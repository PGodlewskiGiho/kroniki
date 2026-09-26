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
  assert.deepEqual(b, { morale: [0, 0], luck: [1, 0] }); // dwie frakcje 0, nieumarli −1, cecha Przystani (rycerz) +1
  const r = await page.evaluate(() => BT.units.map(u => [u.cid, unitMorale(BT, u)]));
  assert.deepEqual(r.filter(([c]) => c === 'pikeman').map(x => x[1]), [0]);
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

test('cechy frakcji: morale Przystani, szczęście Kniei, wzrok Lochu, bagna Twierdzy, siarka Inferna, horda Cytadeli', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], mk = cls => ({ cls, equip: {}, skills: [], sight: 5, army: emptyArmy() });
    const swamp = st.map.terrain.findIndex((x, i) => x === TER.SWAMP && !st.map.road[i]), snow = st.map.terrain.findIndex((x, i) => x === TER.SNOW && !st.map.road[i]);
    const inc = f => { const f0 = t.faction; t.faction = f; const v = dailyIncomeAll(st, t.owner).sulfur; t.faction = f0; return v; };
    const grow = f => { const f0 = t.faction; t.faction = f; const v = weeklyGrowth(t, 1, null); t.faction = f0; return [v, CREATURES[factionOf(f).dw.dw1[1]].growth]; };
    return {
      morale: [armyMorale(['pikeman'], mk('knight')), armyMorale(['pikeman'], mk('ranger'))], luck: [heroLuck(mk('druid')), heroLuck(mk('knight'))],
      sight: heroSight(mk('warlock')) - heroSight(mk('knight')),
      swamp: swamp < 0 ? null : [baseCost(st.map, swamp, swamp, mk('witch')), baseCost(st.map, swamp, swamp, mk('knight'))],
      snow: snow < 0 ? null : [baseCost(st.map, snow, snow, mk('wizard')), baseCost(st.map, snow, snow, mk('knight'))],
      sulfur: inc('inferno') - inc('haven'), horde: grow('stronghold'), traits: FACTIONS.every(F => FACTION_TRAITS[F.id] && F.heroes.every(([, c]) => heroFaction({ cls: c }) === F.id)),
    };
  });
  assert.deepEqual(r.morale, [2, 1]); assert.deepEqual(r.luck, [1, 0]); assert.equal(r.sight, 2);
  if (r.swamp) assert.deepEqual(r.swamp, [100, 175]); if (r.snow) assert.deepEqual(r.snow, [100, 150]);
  assert.equal(r.sulfur, 1); assert.equal(r.horde[0], Math.floor(r.horde[1] * 1.25)); assert.ok(r.traits);
});

test('pory roku: miesiąc zmienia porę, lato i zima zmieniają ruch (Akademia bez kary), jesień daje drewno i rudę', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), at = m => { st.month = m; return { s: seasonOf(st).id, mp: heroMaxMP(h), mpAcad: heroMaxMP({ ...h, cls: 'wizard' }), wood: dailyIncomeAll(st).wood }; };
    const out = [1, 2, 3, 4, 5].map(at); st.month = 1; return out;
  });
  assert.deepEqual(r.map(x => x.s), ['spring', 'summer', 'autumn', 'winter', 'spring']);
  assert.ok(r[1].mp > r[0].mp && r[3].mp < r[0].mp, JSON.stringify(r));
  assert.equal(r[3].mpAcad, r[0].mpAcad, 'Akademia bez kary zimą');
  assert.equal(r[2].wood, r[0].wood + 1);
  await frames(page, 5); // mapa rysuje się zimą bez błędów
  await page.evaluate(() => { G.state.month = 4; });
  await frames(page, 15);
  await page.evaluate(() => { G.state.month = 1; });
});
