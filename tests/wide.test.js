// Duże stwory na dwóch polach: ustawienie, zajęte pola, ruch, atak z zadu, czary obszarowe. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); await newGame(page, { opponents: 1 }, 777); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('duże stwory zajmują dwa pola: zad przy krawędzi, nic na nie nie wchodzi', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, A = st.heroes.find(h => h.owner === 0), D = st.heroes.find(h => h.owner === 1); D.x = A.x + 1; D.y = A.y;
    const arm = ids => { const a = emptyArmy(); ids.forEach((c, i) => a[i] = { cid: c, n: 3 }); return a; };
    A.army = arm(['cavalier', 'pikeman', 'redDragon', 'archer', 'hydra', 'unicorn', 'griffin']); D.army = arm(['blackDragon', 'behemoth', 'naga', 'troll', 'centaur', 'basilisk', 'gorgon']);
    const B = createBattle(st, A, D), cells = B.units.flatMap(u => unitCells(u).map(([x, y]) => hexKey(x, y)));
    const kinds = ['pikeman', 'archer', 'troll', 'cavalier', 'redDragon', 'naga', 'unicorn', 'griffin', 'behemoth', 'centaur'].map(c => [c, !!CREATURES[c].wide]);
    const cav = B.units.find(u => u.cid === 'cavalier'), dr = B.units.find(u => u.cid === 'blackDragon');
    return { kinds, dup: cells.length - new Set(cells).size, inField: B.units.every(u => unitCells(u).every(([x, y]) => inField(x, y))),
      cav: [cav.x, cav.y], tail: unitAt(B, cav.x - 1, cav.y) === cav, dr: [dr.x, unitAt(B, dr.x + 1, dr.y) === dr], blocked: !battleDist(B, B.units.find(u => u.cid === 'pikeman'), 20).dist.has(hexKey(cav.x - 1, cav.y)) };
  });
  assert.deepEqual(r.kinds, [['pikeman', false], ['archer', false], ['troll', false], ['cavalier', true], ['redDragon', true], ['naga', true], ['unicorn', true], ['griffin', true], ['behemoth', true], ['centaur', true]]);
  assert.equal(r.dup, 0, 'pola się nie nakładają'); assert.ok(r.inField);
  assert.equal(r.cav[0], 1, 'przód jeźdźca w drugiej kolumnie, zad przy krawędzi'); assert.ok(r.tail); assert.ok(r.dr[1]);
  assert.equal(r.dr[0], 11); assert.ok(r.blocked, 'zad zajmuje pole');
});

test('ruch potrzebuje miejsca na oba pola, atak sięga z zadu i w zad, kula ognia rani duży oddział raz', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, B = { st, h: null, sides: [0, 1].map(o => ({ owner: o, hero: null, monster: true, town: null })), round: 0, order: [], waitQ: [], active: null, units: [], log: [],
      over: null, auto: true, obst: new Map(), cast: [true, true], rng: mulberry32(3), morale: [0, 0], luck: [0, 0] };
    placeSide(B, 0, [{ cid: 'cavalier', n: 5, src: 'x' }]); placeSide(B, 1, [{ cid: 'pikeman', n: 50, src: 'x' }, { cid: 'behemoth', n: 2, src: 'x' }]);
    const cav = B.units[0], pk = B.units[1], be = B.units[2];
    cav.x = 5; cav.y = 4; pk.x = 3; pk.y = 4; be.x = 8; be.y = 2; // piechur tuż za zadem (x 4) jeźdźca
    const backAdj = hexAdjacent(cav, pk), frontAdj = hexAdjacent({ x: 6, y: 4 }, cav) && !hexAdjacent({ x: 7, y: 4 }, cav);
    B.obst.set(hexKey(9, 6), { o: 0, v: 0 }); const reach = battleDist(B, cav, 20), noTail = !reach.dist.has(hexKey(10, 6)) && reach.dist.has(hexKey(9, 5)) === canStand(B, cav, 9, 5);
    const beCells = unitCells(be); // zad behemota: x 9
    const tailHit = attackSpots(cav, be).some(([x, y]) => hexAdjacent({ ...cav, x, y }, { x: 9, y: 2 }));
    const before = be.n * CREATURES.behemoth.hp; B.active = cav; B.sides[0].hero = { mana: 99, spells: ['fireball'], book: true }; // atrapa bohatera tylko do liczenia obszaru
    const area = spellArea('fireball', 8, 2, B), units = area.map(([x, y]) => unitAt(B, x, y)).filter(Boolean);
    return { backAdj, frontAdj, noTail, beCells, tailHit, twice: units.filter(u => u === be).length };
  });
  assert.ok(r.backAdj, 'wróg za zadem sąsiaduje'); assert.ok(r.frontAdj);
  assert.ok(r.noTail, 'przód nie staje tam, gdzie zad trafiłby w przeszkodę');
  assert.deepEqual(r.beCells, [[8, 2], [9, 2]]); assert.ok(r.tailHit);
  assert.equal(r.twice, 2, 'obszar obejmuje oba pola (obrażenia liczone raz w castBattle)');
});

test('bitwy z dużymi stworami kończą się, a oddziały nigdy na siebie nie wchodzą (także oblężenie)', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, A = st.heroes.find(h => h.owner === 0), D = st.heroes.find(h => h.owner === 1), bad = [];
    const big = Object.keys(CREATURES).filter(c => CREATURES[c].wide && CREATURES[c].faction !== undefined), small = ['pikeman', 'archer', 'troll', 'skeleton', 'monk'];
    for (let k = 0; k < 24; k++) {
      const pick = i => (i % 2 ? small[(k + i) % small.length] : big[(k * 7 + i * 13) % big.length]), a = emptyArmy(), d = emptyArmy();
      for (let i = 0; i < 7; i++) { a[i] = { cid: pick(i), n: 4 + i }; d[i] = { cid: pick(i + 3), n: 4 + i }; }
      A.army = a; D.army = d; st.dayTotal = 50 + k; D.x = A.x + 1; D.y = A.y;
      const B = createBattle(st, A, D); B.auto = true; let g = 0;
      while (!B.over && g++ < 3000) { const u = nextActive(B); if (!u) break; aiHeroCast(B); if (!u.dead && fighters(B, 1 - u.side).length) aiAct(B, u);
        const cells = alive(B).flatMap(v => unitCells(v).map(([x, y]) => hexKey(x, y))); if (cells.length !== new Set(cells).size) { bad.push(`nakładanie w bitwie ${k}`); break; }
        if (alive(B).some(v => unitCells(v).some(([x, y]) => !inField(x, y) || B.obst.has(hexKey(x, y))))) { bad.push(`poza polem w bitwie ${k}`); break; } }
      if (!B.over) bad.push(`bitwa ${k} bez końca`);
    }
    return bad;
  });
  assert.deepEqual(r, []);
});
