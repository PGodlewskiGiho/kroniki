// Morale i szczęście w bitwie (krok 6). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Bitwa bohatera gracza z potworem; armia z podanych oddziałów
const battle = (stacks, opts = {}) => page.evaluate(([stacks, opts]) => {
  const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
  h.army = emptyArmy(); stacks.forEach(([cid, n], i) => { h.army[i] = { cid, n }; }); h.equip = {}; if (opts.equip) Object.assign(h.equip, opts.equip);
  window.BT = createBattle(st, h, m); return { morale: BT.morale, luck: BT.luck };
}, [stacks, opts]);

test('morale armii: jedna frakcja +1, mieszanka mniej, nieumarli −1, artefakty i tawerna', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const M = (cids, h, t) => armyMorale(cids, h, t), town = G.state.towns[0];
    return {
      one: M(['pikeman', 'archer']), two: M(['pikeman', 'centaur']), three: M(['pikeman', 'centaur', 'boneWarrior']),
      undeadOnly: M(['boneWarrior', 'ghoul']), mixed: M(['pikeman', 'boneWarrior']),
      art: M(['pikeman'], { equip: { shield: 'mountainShield' } }), capped: M(['pikeman'], { equip: { shield: 'mountainShield', misc1: 'luckyHorseshoe' } }, { built: ['tavern'] }),
      tavern: M(['pikeman'], null, Object.assign({}, town, { built: [...town.built, 'tavern'] })),
      luck: heroLuck({ equip: { misc1: 'luckyHorseshoe', cloak: 'mistCloak' } }),
      info: artInfo('luckyHorseshoe'),
    };
  });
  assert.equal(r.one, 1); assert.equal(r.two, 0); assert.equal(r.three, -2, 'trzy frakcje −1 i nieumarli −1');
  assert.equal(r.undeadOnly, 0); assert.equal(r.mixed, -1);
  assert.equal(r.art, 3); assert.equal(r.capped, 3, 'najwyżej +3'); assert.equal(r.tavern, 2); assert.equal(r.luck, 2);
  assert.match(r.info, /\+1 do szczęścia/);
});

test('w bitwie: potwory i nieumarli bez morale, szczęście z artefaktów bohatera', async () => {
  await newGame(page);
  const b = await battle([['pikeman', 10], ['boneWarrior', 10]], { equip: { misc1: 'luckyHorseshoe' } });
  assert.deepEqual(b, { morale: [-1, 0], luck: [1, 0] });
  const r = await page.evaluate(() => BT.units.map(u => [u.cid, unitMorale(BT, u)]));
  assert.deepEqual(r.filter(([c]) => c === 'pikeman').map(x => x[1]), [-1]);
  assert.deepEqual(r.filter(([c]) => c === 'boneWarrior').map(x => x[1]), [0]);
});

test('wysokie morale: po ataku drugi ruch w tej samej rundzie, tylko raz', async () => {
  await newGame(page);
  await battle([['champion', 5]]);
  const r = await page.evaluate(() => {
    const B = BT; B.morale = [3, 0]; B.rng = () => 0;
    const u = nextActive(B); while (B.active.side !== 0) nextActive(B);
    const me = B.active, foe = alive(B, 1)[0]; actMoveAttack(B, me, [], null); // ruch w miejscu liczy się jak ruch
    const again = nextActive(B) === me; actMoveAttack(B, me, [], null); const third = nextActive(B) === me;
    return { again, third, log: B.log.some(l => l.startsWith('Wysokie morale')) };
  });
  assert.deepEqual(r, { again: true, third: false, log: true });
});

test('niskie morale: oddział waha się i traci turę', async () => {
  await newGame(page);
  await battle([['pikeman', 10], ['centaur', 5], ['boneWarrior', 5]]);
  const r = await page.evaluate(() => {
    const B = BT; B.morale = [-3, 0]; B.rng = () => 0;
    const acted = []; for (let i = 0; i < 8 && !B.over; i++) { const u = nextActive(B); if (!u || B.round > 1) break; acted.push(u.cid); actDefend(B, u); } // tylko pierwsza runda
    return { acted, log: B.log.filter(l => l.includes('wahają się')).length };
  });
  assert.ok(!r.acted.includes('pikeman') && !r.acted.includes('centaur'), r.acted.join());
  assert.ok(r.acted.includes('boneWarrior'), 'nieumarli się nie wahają');
  assert.ok(r.log >= 2, `wahań: ${r.log}`);
});

test('szczęście podwaja obrażenia, pech je połowi', async () => {
  await newGame(page);
  await battle([['champion', 5]]);
  const r = await page.evaluate(() => {
    const B = BT, a = alive(B, 0)[0], t = alive(B, 1)[0], hit = L => { B.luck = [L, 0]; B.rng = () => 0; const snap = { n: t.n, hp: t.hp, dead: t.dead }; const d = strike(B, a, t, false); Object.assign(t, snap); return d; };
    return { base: hit(0), lucky: hit(1), unlucky: hit(-1), log: B.log.some(l => l.startsWith('Szczęście!')) && B.log.some(l => l.startsWith('Pech!')) };
  });
  assert.equal(r.lucky, r.base * 2); assert.equal(r.unlucky, Math.max(1, Math.floor(r.base / 2))); assert.ok(r.log);
});

test('ekran bitwy pokazuje morale i szczęście bez błędów', async () => {
  await newGame(page);
  await battle([['champion', 8], ['archer', 10]], { equip: { misc1: 'luckyHorseshoe', shield: 'mountainShield' } });
  await page.evaluate(() => { BT.auto = true; setScreen('battle', { battle: BT }); });
  await frames(page, 240);
  const info = await page.evaluate(() => { const u = alive(BT, 0)[0] || BT.units[0], [x, y] = hexCenter(u.x, u.y); return G.screens.battle.rightInfo(x, y - 10); });
  assert.match(info || '', /Morale \+3, szczęście \+1/);
});
