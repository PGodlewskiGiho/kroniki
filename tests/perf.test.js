// Wydajność: klatki tylko w razie potrzeby, jakość grafiki, mgła i teren z pamięci podręcznej. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Ile razy ekran narysował się w ciągu ms milisekund (licznik na render)
const renders = (ms) => page.evaluate(ms => new Promise(res => {
  let n = 0; const orig = window.render; window.render = () => { n++; orig(); };
  setTimeout(() => { window.render = orig; res(n); }, ms);
}), ms);
// Kursor poza oknem gry: nowszy Chromium bez okna zgłasza mysz w rogu (0,0), a to na mapie przewija ją krawędzią (i słusznie rysuje 60 klatek)
const noMouse = () => page.evaluate(() => { const m = G.mouse; m.x = m.y = m.vx = m.vy = -1; });

test('nieruchomy ekran bohatera rysuje się rzadko, ruch myszy wymusza klatkę', async () => {
  await newGame(page);
  await page.evaluate(() => setScreen('hero', {}));
  await noMouse(); await frames(page, 5);
  const idle = await renders(1000);
  assert.ok(idle <= 8, `bez ruchu: ${idle} klatek na sekundę`);
  const moved = await page.evaluate(() => new Promise(res => {
    let n = 0; const orig = window.render; window.render = () => { n++; orig(); };
    let k = 0; const iv = setInterval(() => { G.dirty = true; if (++k >= 20) { clearInterval(iv); setTimeout(() => { window.render = orig; res(n); }, 50); } }, 16);
  }));
  assert.ok(moved >= 15, `przy ruchu: ${moved} klatek`);
});

test('mapa: w spoczynku ~20 klatek, gdy kamera jedzie – płynnie', async () => {
  await newGame(page, { mapSize: 'M' });
  await page.evaluate(() => { setScreen('adventure', {}); G.modal = null; });
  await noMouse(); await frames(page, 5);
  const idle = await renders(1000);
  assert.ok(idle >= 12 && idle <= 26, `spoczynek: ${idle}`);
  await page.evaluate(() => { window.__iv = setInterval(() => { G.state.cam.x += 3; }, 8); });
  const busy = await renders(1000);
  await page.evaluate(() => clearInterval(window.__iv));
  assert.ok(busy >= 40, `ruch kamery: ${busy}`);
});

test('jakość grafiki: niska 0,5, wysoka jak ekran; ustawienie w menu', async () => {
  const r = await page.evaluate(() => {
    const S = G.settings, q0 = S.quality, out = {};
    S.quality = 'low'; resize(); out.low = G.dpr;
    S.quality = 'high'; resize(); out.high = G.dpr === Math.min(window.devicePixelRatio || 1, 2);
    S.quality = q0; resize();
    showGfxSettings(); out.labels = G.modal.buttons.map(b => b.label); G.modal = null;
    return out;
  });
  assert.equal(r.low, 0.5); assert.ok(r.high);
  assert.deepEqual(r.labels, ['Automatyczna', 'Wysoka', 'Niska', 'OK']);
});

test('mgła w kawałkach: odkrycie pola odświeża tylko potrzebny kawałek', async () => {
  await newGame(page, { mapSize: 'M' });
  const r = await page.evaluate(() => {
    const st = G.state, n = st.map.n, ex = human(st).explored; MapRender.reset(st.map, ex);
    const cx = 5, cy = 5, a = fogChunk(ex, n, cx, cy), again = fogChunk(ex, n, cx, cy) === a;
    ex[(cy * CHUNK + 3) * n + cx * CHUNK + 3] = 1; const b = fogChunk(ex, n, cx, cy);
    for (let y = cy * CHUNK - 1; y <= cy * CHUNK + CHUNK; y++) for (let x = cx * CHUNK - 1; x <= cx * CHUNK + CHUNK; x++) ex[y * n + x] = 1;
    return { again, changed: b !== a, clear: fogChunk(ex, n, cx, cy) === null };
  });
  assert.deepEqual(r, { again: true, changed: true, clear: true });
});
