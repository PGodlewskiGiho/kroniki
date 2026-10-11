// Biomy: pola, dżungla, sawanna, skute lodem pustkowie oraz w podziemiach groty kryształowe i pieczary grzybowe.
// Generator je tworzy (rodzaj krainy decyduje o ilości), reguły dziedziczą po terenie bazowym, mapa i bitwa mają dla nich grafikę. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const count = () => page.evaluate(() => { const m = G.state.map, c = {}; for (const t of m.terrain) c[t] = (c[t] || 0) + 1; return c; });

test('generator: tropikalna ma dżunglę i sawannę, mroźna lodowe pustkowie, rolnicza pola, podziemia groty kryształowe i grzybowe', async () => {
  await newGame(page, { land: 'tropical', mapSize: 'M' }, 7); const tr = await count();
  await newGame(page, { land: 'frost', mapSize: 'M' }, 7); const fr = await count();
  await newGame(page, { land: 'farmland', mapSize: 'M', underground: true }, 7); const fa = await count();
  const T = await page.evaluate(() => TER);
  assert.ok(tr[T.JUNGLE] > 200 && tr[T.SAVANNA] > 200, `dżungla ${tr[T.JUNGLE]}, sawanna ${tr[T.SAVANNA]}`);
  assert.ok(fr[T.ICE] > 300, `lód ${fr[T.ICE]}`); assert.ok(fa[T.FIELD] > 300, `pola ${fa[T.FIELD]}`);
  assert.ok(fa[T.CRYSTAL] > 200 && fa[T.FUNGUS] > 200, `groty ${fa[T.CRYSTAL]}, pieczary ${fa[T.FUNGUS]}`);
});

test('biomy dziedziczą reguły: lód jak śnieg (Akademia bez kary), stwory z siedliskiem bazowym, koszt ruchu z tabeli', async () => {
  await newGame(page, { land: 'frost', mapSize: 'M' }, 7);
  const r = await page.evaluate(() => {
    const st = G.state, m = st.map, n = m.n, i = m.terrain.findIndex((t, k) => t === TER.ICE && k > n), h = hero(st), prev = h.faction;
    const cost = c => { h.traits = null; return baseCost(m, i - 1, i, h); };
    const plain = cost(); const base = terBase(TER.ICE);
    return { plain, base, names: TERRAINS.slice(8).map(t => t.name), costs: TERRAINS.slice(8).map(t => t.cost), yeti: CREATURES.yeti ? CREATURES.yeti.habitat.includes(terBase(TER.ICE)) : true, prev };
  });
  assert.equal(r.base, 4); assert.ok(r.plain >= 100);
  assert.deepEqual(r.names, ['Pola', 'Dżungla', 'Sawanna', 'Lodowe pustkowie', 'Kryształowe groty', 'Grzybowe pieczary']); assert.ok(r.costs.every(c => c >= 100)); assert.ok(r.yeti);
});

test('grafika: tekstury biomów, modele drzew i ozdób 3D, tło bitwy na każdym biomie rysuje się bez błędów', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const tex = ['field', 'jungle', 'savanna', 'ice', 'crystal', 'fungus'].filter(k => !TERRAIN_TEX[k]);
    const keys = [obstacle3dKey(OBST.TREE, TER.JUNGLE, 1, 0, 0), obstacle3dKey(OBST.TREE, TER.SAVANNA, 2, 1, 0), obstacle3dKey(OBST.TREE, TER.ICE, 3, 3, 0), decor3dKey(TER.FIELD, 1, 0, 0), decor3dKey(TER.JUNGLE, 2, 0, 0), decor3dKey(TER.SAVANNA, 1, 1, 0), decor3dKey(TER.ICE, 0, 3, 0),
      obstacle3dKey(OBST.ROCK, TER.CRYSTAL, 1, 0, 1), obstacle3dKey(OBST.ROCK, TER.FUNGUS, 2, 0, 1), decor3dKey(TER.CRYSTAL, 3, 0, 1)];
    const miss = keys.filter(k => !map3dSprite(k));
    const c = document.createElement('canvas'); c.width = W; c.height = H; for (let t = 8; t <= 13; t++) paintBattleBg(c.getContext('2d'), t, '', false);
    return { tex, keys, miss, winterJungle: decor3dKey(TER.JUNGLE, 1, 3, 0), winterField: decor3dKey(TER.FIELD, 1, 3, 0) };
  });
  assert.deepEqual(r.tex, [], 'tekstury'); assert.deepEqual(r.miss, [], `modele: ${r.keys}`);
  assert.match(r.winterJungle, /jungle/, 'dżungla bez śniegu zimą'); assert.match(r.winterField, /snow/, 'pola zimą pod śniegiem');
});
