// Mapa przygody na karcie graficznej (GLMap, WebGL): ten sam obraz co rysowanie procesorem, płótno WebGL tylko na mapie,
// powrót do procesora po utracie kontekstu, tryb automatyczny. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Zrzut okna mapy z ekranu (płótno gry + płótno WebGL pod nim, złożone przez przeglądarkę) przy zamrożonym czasie
async function viewShot(mode) {
  await page.evaluate(m => { G.settings.renderer = m; G.dirty = true; }, mode); await frames(page, 4);
  const clip = await page.evaluate(() => { const b = G.canvas.getBoundingClientRect(), k = b.width / VW; return { x: b.left + VIEW.x * k + 2, y: b.top + VIEW.y * k + 2, width: VIEW.w * k - 4, height: VIEW.h * k - 4 }; });
  return (await page.screenshot({ clip })).toString('base64');
}
// Średnia różnica kanałów (0–255) i odsetek wyraźnie różnych pikseli (> 40) między dwoma zrzutami
const diff = (a, b) => page.evaluate(async ([a, b]) => {
  const px = async s => { const im = new Image(); im.src = 'data:image/png;base64,' + s; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
  const A = await px(a), B = await px(b); let sum = 0, big = 0, n = A.length / 4;
  for (let i = 0; i < A.length; i += 4) { const d = (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3; sum += d; if (d > 40) big++; }
  return { mean: sum / n, big: big / n * 100, same: A.length === B.length };
}, [a, b]);

test('mapa na karcie graficznej wygląda tak samo jak rysowana procesorem (teren, woda, obiekty, mgła, światło)', async () => {
  await newGame(page, { weather: 'off' }, 5); await page.waitForFunction(() => MapRender.warmed || MapRender.cache.size > 4, null, { timeout: 30000 });
  await page.evaluate(() => { G.settings.weather = 'off'; window.__upd = update; window.update = () => { G.time = 12.3; G.dirty = true; }; G.mouse.x = G.mouse.y = -100; }); // stały czas: fale i dym w tej samej fazie
  const ok = await page.evaluate(() => { G.settings.renderer = 'gl'; GLMap.reflect = false; return GLMap.use(); }); // odbicia nieba na wodzie są tylko na karcie: do porównania wyłączone
  if (!ok) return; // przeglądarka bez WebGL: nie ma czego porównać
  await page.evaluate(() => { MapLayers.on = false; }); // najpierw pełne rysowanie każdej klatki (jak w ruchu)
  const cpu = await viewShot('cpu'), gpu = await viewShot('gl'), r = await diff(cpu, gpu);
  const st = await page.evaluate(() => ({ ...GLMap.stats, shown: GLMap.canvas.style.display !== 'none' }));
  assert.ok(r.same, 'ten sam rozmiar zrzutów');
  assert.ok(r.mean < 2, `średnia różnica ${r.mean.toFixed(2)}`); assert.ok(r.big < 0.5, `wyraźnie różnych pikseli ${r.big.toFixed(2)}%`);
  assert.ok(st.shown && st.quads > 30, `prostokątów w klatce: ${st.quads}`);
  // atlas: małe obrazki we wspólnych teksturach (mniej poleceń rysowania niż prostokątów); nieruchomy widok niczego nie wgrywa na nowo
  // (sylwetki zasłoniętych obiektów z pamięci XRAY, a nie płótna roboczego przy każdej klatce)
  await frames(page, 3); const s2 = await page.evaluate(() => ({ ...GLMap.stats, pages: GLMap.pages.length }));
  assert.ok(s2.pages >= 1 && s2.draws * 2 < s2.quads, `poleceń rysowania ${s2.draws} przy ${s2.quads} prostokątach`);
  assert.equal(s2.uploads, 0, 'wgrań na kartę w nieruchomej klatce');
  // spoczynek: warstwy (teren i obiekty zapamiętane, co klatkę tylko fale i pogoda) dają ten sam obraz, a klatka karty to kilka prostokątów bez wgrań
  await page.evaluate(() => { MapLayers.on = true; MapLayers.drop(); });
  const cpuL = await viewShot('cpu'), gpuL = await viewShot('gl'), rc = await diff(cpu, cpuL), rg = await diff(cpu, gpuL);
  assert.ok(rc.mean < 1 && rc.big < 0.3, `warstwy procesorem: średnia ${rc.mean.toFixed(2)}, różnych ${rc.big.toFixed(2)}%`);
  assert.ok(rg.mean < 2 && rg.big < 0.5, `warstwy kartą: średnia ${rg.mean.toFixed(2)}, różnych ${rg.big.toFixed(2)}%`);
  await frames(page, 3); const s3 = await page.evaluate(() => ({ ...GLMap.stats, idle: G.screens.adventure._busy === false && !!(MapLayers.topG && MapLayers.topG._key) }));
  assert.ok(s3.idle && s3.quads < 30 && s3.uploads === 0, `spoczynek: ${JSON.stringify(s3)}`);
  // ruch (idący bohater w pół kroku): warstwy z zapasem, bohater rysowany co klatkę osobno – ten sam obraz co pełne rysowanie
  await page.evaluate(() => { const h = hero(G.state); h.anim = { fx: h.x - 1, fy: h.y, t: STEP_TIME / 2, d: STEP_TIME }; MapLayers.on = false; });
  const cpuM = await viewShot('cpu');
  await page.evaluate(() => { MapLayers.on = true; MapLayers.drop(); });
  const cpuML = await viewShot('cpu'), gpuML = await viewShot('gl'), mc = await diff(cpuM, cpuML), mg = await diff(cpuM, gpuML);
  const s4 = await page.evaluate(() => ({ busy: G.screens.adventure._busy, wide: MapLayers.topG.width > GLMap.canvas.width && MapLayers.top.width > GLMap.canvas.width }));
  await page.evaluate(() => { hero(G.state).anim = null; });
  assert.ok(s4.busy && s4.wide, `ruch: ${JSON.stringify(s4)}`);
  assert.ok(mc.mean < 1.5 && mc.big < 0.5, `ruch procesorem: średnia ${mc.mean.toFixed(2)}, różnych ${mc.big.toFixed(2)}%`);
  assert.ok(mg.mean < 2 && mg.big < 0.6, `ruch kartą: średnia ${mg.mean.toFixed(2)}, różnych ${mg.big.toFixed(2)}%`);
  await page.evaluate(() => { window.update = window.__upd; GLMap.reflect = true; });
});

test('płótno WebGL tylko na mapie: poza nią schowane, okno mapy w płótnie gry przezroczyste tylko przy karcie graficznej', async () => {
  const r = await page.evaluate(async () => {
    const wait = n => new Promise(res => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    const alphaAt = () => { const k = G.rs; return G.ctx.getImageData(Math.round((VIEW.x + VIEW.w / 2) * k), Math.round((VIEW.y + VIEW.h / 2) * k), 1, 1).data[3]; };
    G.settings.renderer = 'gl'; G.dirty = true; await wait(3); const onMap = GLMap.canvas.style.display !== 'none', holeGl = alphaAt();
    G.settings.renderer = 'cpu'; G.dirty = true; await wait(3); const hidCpu = GLMap.canvas.style.display === 'none', holeCpu = alphaAt();
    G.settings.renderer = 'gl'; const t = G.state.towns[0]; G.go('town', { townId: t.id }); G.fade.a = 0; await wait(30); const inTown = G.screenName, hidTown = GLMap.canvas.style.display === 'none';
    setScreen('adventure', {}); G.fade.a = 0; await wait(3); const back = GLMap.canvas.style.display !== 'none';
    return { onMap, holeGl, hidCpu, holeCpu, inTown, hidTown, back };
  });
  assert.deepEqual(r, { onMap: true, holeGl: 0, hidCpu: true, holeCpu: 255, inTown: 'town', hidTown: true, back: true });
});

test('utrata kontekstu WebGL (sterownik, uśpienie): mapa dalej rysowana procesorem, bez błędów', async () => {
  const r = await page.evaluate(async () => {
    const wait = n => new Promise(res => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    G.settings.renderer = 'gl'; G.dirty = true; await wait(2); const ext = GLMap.gl.getExtension('WEBGL_lose_context'); if (!ext) return { skip: true };
    ext.loseContext(); await wait(2); for (let i = 0; i < 5; i++) { G.dirty = true; await wait(1); }
    const k = G.rs, a = G.ctx.getImageData(Math.round((VIEW.x + VIEW.w / 2) * k), Math.round((VIEW.y + VIEW.h / 2) * k), 1, 1).data[3];
    return { use: GLMap.use(), mode: GLMap.mode(), alpha: a };
  });
  if (r.skip) return;
  assert.deepEqual(r, { use: false, mode: 'procesor (płótno 2D)', alpha: 255 });
});

test('tryb automatyczny: karta graficzna tylko przy sprzętowym WebGL (programowy byłby wolniejszy od płótna 2D)', async () => {
  const r = await page.evaluate(() => { GLMap.ok = null; GLMap.tex.clear(); GLMap.bytes = 0; G.settings.renderer = 'auto'; const u = GLMap.use(); return { use: u, hw: !!GLMap.hw, name: GLMap.name || '' }; });
  assert.equal(r.use, r.hw, `WebGL: ${r.name}`);
  const cpu = await page.evaluate(() => { G.settings.renderer = 'cpu'; return GLMap.use(); }); assert.equal(cpu, false);
});
