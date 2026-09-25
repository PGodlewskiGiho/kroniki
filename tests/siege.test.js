// Oblężenia: mury, brama, wieże i katapulta (krok 9). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Bitwa bohatera gracza o miasto niezależne z podanymi umocnieniami (zwraca B w zmiennej globalnej __B)
const siege = (walls, army, garrison) => page.evaluate(([walls, army, garrison]) => {
  const st = G.state, t = st.towns[1], h = hero(st);
  t.built = ['hall1', 'dw1', 'dw2', ...walls]; t.garrison = emptyArmy(); garrison.forEach(([cid, n], i) => { t.garrison[i] = { cid, n }; });
  h.army = emptyArmy(); army.forEach(([cid, n], i) => { h.army[i] = { cid, n }; });
  window.__B = createBattle(st, h, t); return true;
}, [walls, army, garrison]);

test('mur blokuje piechotę atakującego, brama przepuszcza obrońców, lotnik przelatuje', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort'], [['pikeman', 10], ['griffin', 5]], [['pikeman', 10]]);
  const r = await page.evaluate(() => {
    const B = __B, pike = B.units.find(u => u.cid === 'pikeman' && u.side === 0), grif = B.units.find(u => u.cid === 'griffin'), def = B.units.find(u => u.side === 1 && u.cid === 'pikeman');
    const across = d => [...d.dist.keys()].some(k => k % BCOLS > SIEGE_X);
    const out = { pikeAcross: across(battleDist(B, pike)), defOut: [...battleDist(B, def).dist.keys()].some(k => k % BCOLS < SIEGE_X), grifAcross: across(battleDist(B, grif, 99)) };
    for (const w of B.walls.values()) if (w.kind === 'gate') w.hp = 0;
    out.afterBreach = across(battleDist(B, pike));
    out.catapult = B.units.some(u => u.cid === 'catapult' && u.side === 0);
    out.obstOk = [...B.obst.keys()].every(k => k % BCOLS < SIEGE_X - 1);
    return out;
  });
  assert.deepEqual(r, { pikeAcross: false, defOut: true, grifAcross: true, afterBreach: true, catapult: true, obstOk: true });
});

test('katapulta niszczy mury; strzał zza muru traci połowę siły', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort', 'citadel'], [['archer', 20]], [['pikeman', 10]]);
  const r = await page.evaluate(() => {
    const B = __B, cat = B.units.find(u => u.cid === 'catapult'), arch = B.units.find(u => u.cid === 'archer'), def = B.units.find(u => u.side === 1 && u.cid === 'pikeman');
    const hp = () => [...B.walls.values()].filter(w => w.kind !== 'tower').reduce((s, w) => s + w.hp, 0), hp0 = hp();
    const est = () => estimateStrike(B, arch, def, true).min, withWall = est();
    for (let i = 0; i < 12; i++) actCatapult(B, cat);
    const hp1 = hp(); wallAt(B, SIEGE_X, def.y).hp = 0;
    return { hp0, hp1, withWall, open: est() };
  });
  assert.equal(r.hp0, 8 * 3, 'Cytadela: 7 fragmentów + brama po 3');
  assert.ok(r.hp1 <= r.hp0 - 6, `po 12 rzutach: ${r.hp1}`);
  assert.ok(Math.abs(r.open - r.withWall * 2) <= 1, `${r.withWall} → ${r.open}`);
});

test('wieże strzelają same i nie da się ich zaatakować ani trafić czarem', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort', 'citadel', 'castle'], [['archer', 20]], [['pikeman', 5]]);
  const r = await page.evaluate(() => {
    const B = __B, tower = B.units.filter(u => u.cid === 'arrowTower'), arch = B.units.find(u => u.cid === 'archer');
    const n0 = arch.n; aiAct(B, tower[0]);
    const h = hero(G.state); h.spells = ['magicArrow']; h.mana = 50; B.active = arch;
    return { towers: tower.length, n: tower[0].n, hurt: arch.n < n0 || arch.hp < CREATURES.archer.hp, spell: spellTargetOk(B, 'magicArrow', tower[0]), fighters: fighters(B, 1).some(u => u.cid === 'arrowTower') };
  });
  assert.equal(r.towers, 2);
  assert.equal(r.n, 3, 'siła wieży: 1 + liczba siedlisk');
  assert.ok(r.hurt);
  assert.equal(r.spell, false);
  assert.equal(r.fighters, false, 'wieże nie liczą się do wyniku');
});

test('pełne oblężenie: silna armia zdobywa miasto, katapulta i wieże nie trafiają do armii', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort', 'citadel', 'castle'], [['champion', 30], ['swordsman', 40], ['archer', 40]], [['pikeman', 30], ['archer', 20]]);
  const r = await page.evaluate(() => {
    const B = __B, res = resolveBattle(simulateBattle(B), false), st = G.state, h = hero(st);
    return { outcome: res.outcome, rounds: B.round, army: armyStacks(h.army).map(s => s.cid).filter(c => SIEGE_UNITS.includes(c)), owner: st.towns[1].owner, lost: res.lost.join(',') };
  });
  assert.equal(r.outcome, 'win');
  assert.equal(r.owner, 0);
  assert.deepEqual(r.army, []);
  assert.ok(!/katapult/i.test(r.lost));
});

test('SI oblega miasto: symulacja kończy się bez zawieszenia', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], foe = st.heroes.find(h => h.owner === 1), out = [];
    t.built.push('fort', 'citadel'); t.garrison = emptyArmy(); t.garrison[0] = { cid: 'archer', n: 15 };
    for (const [cid, n] of [['pikeman', 20], ['griffin', 12], ['champion', 6]]) {
      foe.army = emptyArmy(); foe.army[0] = { cid, n };
      const B = simulateBattle(createBattle(st, foe, t)); out.push({ cid, over: B.over, rounds: B.round });
    }
    return out;
  });
  for (const x of r) { assert.ok(x.over === 'win' || x.over === 'lose', JSON.stringify(x)); assert.ok(x.rounds < 60, JSON.stringify(x)); }
});

test('ekran oblężenia: rysuje mury, katapulta rzuca, dymek muru', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort', 'citadel'], [['pikeman', 20], ['archer', 20]], [['pikeman', 10]]);
  await page.evaluate(() => setScreen('battle', { battle: __B }));
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const s = await page.evaluate(() => {
      const scr = G.screens.battle, B = scr.B, kinds = [];
      for (let k = 0; k < 10; k++) { scr.update(0.05); if (scr.play) kinds.push(scr.play.kind); }
      if (scr.phase === 'input') { actDefend(B, B.active); scr.phase = 'play'; }
      return { kinds, screen: G.screenName };
    });
    s.kinds.forEach(k => seen.add(k));
    if (i % 10 === 0) await frames(page, 2);
    if (seen.has('siege') || s.screen !== 'battle') break;
  }
  assert.ok(seen.has('siege'), [...seen].join(','));
  const info = await page.evaluate(() => { const [x, y] = hexCenter(SIEGE_X, GATE_Y); return G.screens.battle.rightInfo(x, y); });
  assert.match(info, /Brama miasta/);
  await frames(page, 5);
});
