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
    const across = d => [...d.dist.keys()].some(k => behindWall(k % BCOLS, Math.floor(k / BCOLS)));
    const out = { pikeAcross: across(battleDist(B, pike)), defOut: [...battleDist(B, def).dist.keys()].some(k => beforeWall(k % BCOLS, Math.floor(k / BCOLS))), grifAcross: across(battleDist(B, grif, 99)) };
    for (const w of B.walls.values()) if (w.kind === 'gate') w.hp = 0;
    out.afterBreach = across(battleDist(B, pike));
    out.catapult = B.units.some(u => u.cid === 'catapult' && u.side === 0);
    out.obstOk = [...B.obst.keys()].every(k => k % BCOLS < moatX(Math.floor(k / BCOLS)));
    return out;
  });
  assert.deepEqual(r, { pikeAcross: false, defOut: true, grifAcross: true, afterBreach: true, catapult: true, obstOk: true });
});

test('katapulta niszczy mury; strzał zza muru traci połowę siły', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort', 'citadel'], [['archer', 20]], [['pikeman', 10]]);
  const r = await page.evaluate(() => {
    const B = __B, cat = B.units.find(u => u.cid === 'catapult'), arch = B.units.find(u => u.cid === 'archer'), def = B.units.find(u => u.side === 1 && u.cid === 'pikeman');
    const hp = () => [...B.walls.values()].reduce((s, w) => s + w.hp, 0), hp0 = hp();
    const est = () => estimateStrike(B, arch, def, true).min, withWall = est();
    for (let i = 0; i < 12; i++) actCatapult(B, cat);
    const hp1 = hp(); wallAt(B, wallX(def.y), def.y).hp = 0;
    return { hp0, hp1, withWall, open: est() };
  });
  assert.equal(r.hp0, 9 * 3 + 4, 'Cytadela: wieża, 7 fragmentów i brama po 3, wieża główna 4');
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
    return { towers: tower.length, keepN: (tower.find(u => u.keep) || {}).n, n: tower[0].n, hurt: arch.n < n0 || arch.hp < CREATURES.archer.hp, spell: spellTargetOk(B, 'magicArrow', tower[0]), fighters: fighters(B, 1).some(u => u.cid === 'arrowTower') };
  });
  assert.equal(r.towers, 3, 'dwie wieże i wieża główna');
  assert.equal(r.keepN, 6, 'wieża główna strzela za dwie wieże');
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
      if (scr.phase === 'input' && B.active.cid === 'catapult') { const w = catapultTargets(B)[0]; scr.order({ a: 'cat', x: w.x, y: w.y }); } // katapultą celuje gracz
      else if (scr.phase === 'input') { actDefend(B, B.active); scr.phase = 'play'; }
      return { kinds, screen: G.screenName };
    });
    s.kinds.forEach(k => seen.add(k));
    if (i % 10 === 0) await frames(page, 2);
    if (seen.has('siege') || s.screen !== 'battle') break;
  }
  assert.ok(seen.has('siege'), [...seen].join(','));
  const info = await page.evaluate(() => { const [x, y] = hexCenter(wallX(GATE_Y), GATE_Y); return G.screens.battle.rightInfo(x, y); });
  assert.match(info, /Brama miasta/);
  await frames(page, 5);
});

test('fosa (od Cytadeli): kończy ruch napastnika i go rani, most przy bramie; Fort bez fosy', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort'], [['pikeman', 10]], [['pikeman', 10]]);
  const none = await page.evaluate(() => !__B.moat);
  await siege(['fort', 'citadel'], [['swordsman', 10]], [['pikeman', 10]]);
  const r = await page.evaluate(() => {
    const B = __B, sw = B.units.find(u => u.side === 0 && u.cid === 'swordsman'); B.obst.clear(); sw.x = moatX(2) - 2; sw.y = 2;
    const reach = battleDist(B, sw, 99), beyond = [...reach.dist.keys()].some(k => { const x = k % BCOLS, y = Math.floor(k / BCOLS); return x < moatX(y) && reach.prev.get(k) != null && moatAt(B, reach.prev.get(k) % BCOLS, Math.floor(reach.prev.get(k) / BCOLS)); });
    const hp0 = (sw.n - 1) * CREATURES.swordsman.hp + sw.hp; actMoveAttack(B, sw, pathTo(reach, sw, moatX(2), 2), null);
    return { inMoat: sw.x === moatX(2), lost: hp0 - ((sw.n - 1) * CREATURES.swordsman.hp + sw.hp), dmg: B.moat.dmg, bridge: !moatAt(B, moatX(GATE_Y), GATE_Y), beyond, wallHp: [...B.walls.values()].find(w => w.kind === 'wall').hp };
  });
  assert.ok(none, 'Fort: bez fosy');
  assert.equal(r.inMoat, true); assert.equal(r.lost, r.dmg); assert.equal(r.bridge, true); assert.equal(r.beyond, false, 'nie przechodzi przez fosę w jednym ruchu');
  assert.equal(r.wallHp, 3);
});

test('obrońca walczący wręcz czeka za murem; przy dużej przewadze robi wypad', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort'], [['archer', 30]], [['swordsman', 10]]);
  const r = await page.evaluate(() => {
    const B = __B; for (const w of B.walls.values()) if (w.kind === 'gate') w.hp = 0; B.obst.clear();
    const d = B.units.find(u => u.side === 1 && u.cid === 'swordsman'), x0 = d.x; B.active = d; aiAct(B, d); const stayed = !beforeWall(d.x, d.y) || d.x === x0;
    d.n = 400; d.x = x0; d.y = 4; aiAct(B, d); return { stayed, sortie: d.x < x0 };
  });
  assert.deepEqual(r, { stayed: true, sortie: true });
});

test('katapulta pod rozkazami: cel wybrany przez gracza, zburzona wieża milknie, Balistyka daje dwa strzały', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort', 'citadel', 'castle'], [['pikeman', 10]], [['pikeman', 10]]);
  const r = await page.evaluate(() => {
    const B = __B, cat = B.units.find(u => u.cid === 'catapult'), tw = [...B.walls.values()].find(w => w.kind === 'tower'), out = {};
    out.towerHp = tw.hp; B.rng = () => 0.1; // zawsze trafia
    out.targets = catapultTargets(B).length;
    for (let i = 0; i < 6 && tw.hp > 0; i++) actCatapult(B, cat, { x: tw.x, y: tw.y });
    const archers = B.units.find(u => u.cid === 'arrowTower' && u.x === tw.x && u.y === tw.y);
    out.towerDown = tw.hp <= 0; out.archersDead = archers.dead;
    out.passable = !walled(B, tw.x, tw.y, 0);
    const h = sideHero(B, 0); h.skills = [{ id: 'ballistics', lv: 2 }]; const n0 = B.log.length; actCatapult(B, cat); out.shots = B.log.slice(n0).filter(l => /Katapulta/.test(l)).length;
    return out;
  });
  assert.ok(Number.isFinite(r.towerHp) && r.towerHp > 0, 'wieża ma wytrzymałość');
  assert.ok(r.targets >= 9); assert.ok(r.towerDown && r.archersDead && r.passable);
  assert.equal(r.shots, 2);
});

test('wieża główna (od Cytadeli): stoi za murem, blokuje pole, katapulta może ją zburzyć', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await siege(['fort'], [['pikeman', 10]], [['pikeman', 10]]);
  const fort = await page.evaluate(() => [...__B.walls.values()].some(w => w.kind === 'keep'));
  await siege(['fort', 'citadel'], [['pikeman', 10]], [['pikeman', 10], ['archer', 10], ['swordsman', 5], ['monk', 3], ['pikeman', 4], ['archer', 2], ['pikeman', 1]]);
  const r = await page.evaluate(() => {
    const B = __B, k = [...B.walls.values()].find(w => w.kind === 'keep'), cat = B.units.find(u => u.cid === 'catapult'), out = { behind: behindWall(k.x, k.y) };
    out.blocked = walled(B, k.x, k.y, 1) && walled(B, k.x, k.y, 0);
    out.defOk = B.units.filter(u => u.side === 1 && u.src !== 'siege').every(u => behindWall(u.x, u.y) && !wallAt(B, u.x, u.y));
    B.rng = () => 0.1; for (let i = 0; i < 8 && k.hp > 0; i++) actCatapult(B, cat, { x: k.x, y: k.y });
    out.down = k.hp <= 0; out.archersDead = B.units.find(u => u.keep).dead; out.passable = !walled(B, k.x, k.y, 0);
    return out;
  });
  assert.equal(fort, false, 'Fort: bez wieży głównej');
  assert.deepEqual(r, { behind: true, blocked: true, defOk: true, down: true, archersDead: true, passable: true });
});
