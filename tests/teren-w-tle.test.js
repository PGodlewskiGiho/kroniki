// Teren mapy liczony w wątkach w tle (TerrainPool, Web Worker): ten sam obraz co w wątku gry, wątek gry nie liczy pikseli
// terenu przy przewijaniu i przeskokach kamery, a gdy wątki zawiodą – teren maluje się dawnym sposobem. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Czeka, aż w widoku nie będzie zastępczych kawałków (wszystkie widoczne kawałki terenu gotowe)
const viewReady = () => page.waitForFunction(() => { const st = G.state, CP = CHUNK * T, nC = Math.ceil(st.map.n / CHUNK);
  for (let cy = Math.max(0, Math.floor(st.cam.y / CP)); cy <= Math.min(nC - 1, Math.floor((st.cam.y + VIEW.h - 1) / CP)); cy++)
    for (let cx = Math.max(0, Math.floor(st.cam.x / CP)); cx <= Math.min(nC - 1, Math.floor((st.cam.x + VIEW.w - 1) / CP)); cx++) if (!MapRender.has(cx, cy)) return false;
  return true; }, null, { timeout: 30000, polling: 50 });

test('kawałek z wątku w tle jest identyczny z malowanym w wątku gry (teren, woda, maski fal)', async () => {
  await newGame(page, { mapSize: 'M' }); await viewReady();
  const r = await page.evaluate(() => {
    const keys = [...MapRender.cache.keys()].slice(0, 4), out = { pool: TerrainPool.ok, workers: TerrainPool.ws.length, done: TerrainPool.stats.done, diff: 0, px: 0, masks: true };
    const data = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (const key of keys) { const [cx, cy] = key.split(',').map(Number), a = MapRender.cache.get(key), b = renderChunkPixel(MapRender.map, cx, cy), da = data(a), db = data(b);
      out.px += da.length; for (let i = 0; i < da.length; i++) if (da[i] !== db[i]) out.diff++;
      if (!!a._deep !== !!b._deep) out.masks = false; else if (a._deep) { const ma = data(a._deep), mb = data(b._deep); for (let i = 3; i < ma.length; i += 4) if (ma[i] !== mb[i]) out.masks = false; } }
    return out;
  });
  assert.equal(r.pool, true); assert.ok(r.workers >= 1 && r.done >= 4, `wątki: ${r.workers}, gotowe kawałki: ${r.done}`);
  assert.equal(r.diff, 0, `różnych bajtów: ${r.diff} z ${r.px}`); assert.ok(r.masks, 'maski wody te same');
});

test('przeskoki kamery po mapie: wątek gry nie liczy pikseli terenu, widok uzupełnia się sam', async () => {
  await page.evaluate(() => { window.__px = 0; const o = window.chunkPixelSteps; window.__pxo = o; window.chunkPixelSteps = function (...a) { window.__px++; return o.apply(this, a); }; });
  for (const [x, y] of [[0.85, 0.8], [0.15, 0.85], [0.8, 0.15]]) {
    await page.evaluate(([x, y]) => { const st = G.state, n = st.map.n; st.cam.x = x * n * T - viewW() / 2; st.cam.y = y * n * T - viewH() / 2; camClamp(st); G.dirty = true; }, [x, y]);
    await frames(page, 2); await viewReady();
  }
  const main = await page.evaluate(() => { window.chunkPixelSteps = window.__pxo; return window.__px; });
  assert.equal(main, 0, 'pikseli terenu nie liczy wątek gry');
});

test('wątki w tle zawiodły: teren dalej maluje się w wątku gry, bez błędów', async () => {
  await page.evaluate(() => { TerrainPool.fail(); MapRender.reset(G.state.map, human(G.state).explored); }); await frames(page, 3); await viewReady();
  const r = await page.evaluate(() => ({ ok: TerrainPool.ok, on: TerrainPool.on(), chunks: MapRender.cache.size }));
  assert.deepEqual({ ok: r.ok, on: r.on }, { ok: false, on: false }); assert.ok(r.chunks >= 4, `kawałków: ${r.chunks}`);
});
