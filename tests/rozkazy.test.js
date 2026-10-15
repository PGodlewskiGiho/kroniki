// Rozkazy bohatera (Zapał) i sztuczka Iskra: pula i odnawianie, działanie rozkazów, jedna akcja bohatera na rundę, przycisk w bitwie.
// Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Bitwa bohatera gracza z garnizonem niezależnego miasta bez murów; __B w przeglądarce, ruch ma pierwszy oddział gracza
const battle = (army, garrison, setup = '') => page.evaluate(([army, garrison, setup]) => {
  const st = G.state, t = st.towns[1], h = hero(st);
  t.built = ['hall1']; t.garrison = emptyArmy(); garrison.forEach(([cid, n], i) => { t.garrison[i] = { cid, n }; });
  h.army = emptyArmy(); army.forEach(([cid, n], i) => { h.army[i] = { cid, n }; });
  h.stats = { att: 6, def: 4, sp: 2, kn: 2 }; h.skills = []; h.talents = []; h.equip = {}; new Function('h', setup)(h);
  window.__B = createBattle(st, h, t); __B.active = __B.units.find(u => u.side === 0); return true;
}, [army, garrison, setup]);

test('Zapał: pula z obrony, wraca co rundę; Szarżę i Mur tarcz zna każdy, resztę dają umiejętności', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20]], [['pikeman', 20]]);
  const r = await page.evaluate(() => {
    const B = __B, h = B.h, start = B.valor[0], max = heroValorMax(h); B.valor[0] = 0; B.round = 1; B.active = null; B.order = []; B.waitQ = []; nextActive(B);
    const base = knownOrders(h); h.skills = [{ id: 'leadership', lv: 1 }, { id: 'archery', lv: 1 }];
    return { start, max, after: B.valor[0], base, more: knownOrders(h) };
  });
  assert.equal(r.start, 6 + 2 * 4); assert.equal(r.max, r.start); assert.equal(r.after, 2, 'co rundę wraca VALOR_REGEN');
  assert.deepEqual(r.base, ['charge', 'shieldWall']); assert.ok(r.more.includes('warCry') && r.more.includes('volleyOrder'), r.more.join());
});

test('Szarża, Mur tarcz, Flanka i Pogrom zmieniają obrażenia; Flanka zabiera odwet; jedna akcja bohatera na rundę', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['swordsman', 20]], [['swordsman', 20]], "h.skills = [{ id: 'tactics', lv: 1 }, { id: 'offense', lv: 1 }]; h.book = true; h.spells = ['magicArrow']; h.mana = 50;");
  const r = await page.evaluate(() => {
    const B = __B, a = B.units.find(u => u.side === 0), t = B.units.find(u => u.side === 1), avg = (x, y) => { const e = estimateStrike(B, x, y, false); return (e.min + e.max) / 2; };
    const base = avg(a, t), spd = unitSpd(a);
    castBattle(B, 'charge', a.x, a.y); const charged = avg(a, t), spd2 = unitSpd(a), afterOrder = { cast: canCastNow(B), order: canOrderNow(B), valor: B.valor[0] };
    B.cast[0] = false; B.casts[0] = 0; castBattle(B, 'flank', t.x, t.y); const flanked = avg(a, t), retal = canRetal(B, t);
    B.cast[0] = false; B.casts[0] = 0; delete a.buffs.charge; delete t.buffs.exposed;
    castBattle(B, 'execute', a.x, a.y); const exec = avg(a, t); delete a.buffs.exec;
    B.active = t; B.cast[1] = false; const before = avg(a, t); B.active = a; B.cast[0] = false; B.casts[0] = 0; castBattle(B, 'shieldWall', t.x, t.y);
    return { base, charged, flanked, exec, walled: avg(a, t), before, spd, spd2, afterOrder, retal };
  });
  assert.ok(r.charged > r.base * 1.1, `Szarża: ${r.base} → ${r.charged}`); assert.equal(r.spd2, r.spd + 2);
  assert.deepEqual(r.afterOrder, { cast: false, order: false, valor: 14 - 4 }, 'po rozkazie bohater w tej rundzie już nie działa');
  assert.ok(r.flanked > r.charged, 'Flanka dokłada obrażeń'); assert.equal(r.retal, false, 'odsłonięty wróg nie oddaje');
  assert.ok(r.exec > r.base, 'Pogrom pomija część obrony');
  assert.ok(r.walled < r.before * 0.9, `Mur tarcz: ${r.before} → ${r.walled}`);
});

test('Salwa strzela wszystkimi strzelcami, Do szeregu! przywraca poległych, Przegrupowanie tylko blisko', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['archer', 15], ['archer', 15], ['pikeman', 30]], [['swordsman', 30]], "h.skills = [{ id: 'archery', lv: 1 }, { id: 'firstAid', lv: 1 }, { id: 'logistics', lv: 1 }];");
  const r = await page.evaluate(() => {
    const B = __B, [a1, a2, pk] = B.units.filter(u => u.side === 0 && !isMachine(u)), t = B.units.find(u => u.side === 1), hp = u => (u.n - 1) * CREATURES[u.cid].hp + u.hp;
    const s0 = [a1.shots, a2.shots], h0 = hp(t); castBattle(B, 'volleyOrder', t.x, t.y);
    const volley = { shots: [s0[0] - a1.shots, s0[1] - a2.shots], hurt: hp(t) < h0 };
    pk.n = 10; B.cast[0] = false; B.casts[0] = 0; B.valor[0] = 20; castBattle(B, 'rally', pk.x, pk.y);
    B.cast[0] = false; B.casts[0] = 0; const far = !actTeleOk(B, 'regroup', pk, pk.x + 8, pk.y), ok = [[pk.x + 2, pk.y], [pk.x + 1, pk.y], [pk.x + 3, pk.y]].find(([x, y]) => actTeleOk(B, 'regroup', pk, x, y));
    if (ok) castBattle(B, 'regroup', pk.x, pk.y, ok[0], ok[1]);
    return { volley, rallied: pk.n, far, moved: ok ? pk.x === ok[0] : null };
  });
  assert.deepEqual(r.volley, { shots: [1, 1], hurt: true }, 'każdy strzelec oddał strzał');
  assert.ok(r.rallied > 10, `polegli wracają: ${r.rallied}`); assert.equal(r.far, true, 'za daleko'); assert.equal(r.moved, true);
});

test('Iskra: darmowa sztuczka każdej księgi, nie do nauczenia; SI wydaje rozkazy', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20]], [['pikeman', 40]], "h.book = true; h.spells = []; h.mana = 0; h.stats.sp = 4;");
  const r = await page.evaluate(() => {
    const B = __B, h = B.h, t = B.units.find(u => u.side === 1), n0 = t.n;
    const can = canCastNow(B), cost = battleCost(B, 0, h, 'spark'); castBattle(B, 'spark', t.x, t.y);
    const learnable = Object.keys(SPELLS).filter(id => SPELLS[id].level <= 5 && !SPELLS[id].cantrip).includes('spark');
    const st = G.state, t2 = st.towns[1]; h.book = false; h.skills = [{ id: 'leadership', lv: 2 }]; h.stats.att = 8;
    const B2 = createBattle(st, h, t2); simulateBattle(B2);
    return { can, cost, hit: t.n < n0, learnable, inList: battleSpells(h).includes('spark'), orders: B2.log.filter(l => l.includes('rozkaz')).length };
  });
  assert.equal(r.can, true, 'bez many można rzucić Iskrę'); assert.equal(r.cost, 0); assert.equal(r.hit, true);
  assert.equal(r.learnable, false); assert.equal(r.inList, false, 'bez księgi nie ma Iskry'); assert.ok(r.orders > 0, 'SI wydała rozkaz');
});

test('ekran bitwy: przycisk Rozkaz otwiera listę, wybrany rozkaz czeka na cel', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20]], [['pikeman', 20]]);
  await page.evaluate(() => { setScreen('battle', { battle: __B }); const S = G.screens.battle; S.phase = 'input'; S.startTurnFor && S.startTurnFor(__B.active); });
  await frames(page, 3);
  const r = await page.evaluate(() => {
    const S = G.screens.battle; S.phase = 'input'; const b = S.buttons.find(b => b.label === 'Rozkaz'); b.action();
    const labels = G.modal ? G.modal.buttons.map(b => b.label) : []; G.modal.buttons.find(b => b.label === 'Szarża').action();
    return { sub: b.sub, labels, casting: S.casting };
  });
  assert.match(r.sub, /zapał \d+/); assert.ok(r.labels.includes('Szarża') && r.labels.includes('Mur tarcz'), r.labels.join()); assert.equal(r.casting, 'charge');
  await frames(page, 2);
});
