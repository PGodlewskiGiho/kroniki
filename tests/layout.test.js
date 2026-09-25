// Okno gry dopasowane do ekranu: szersze albo wyższe niż 4:3. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const size = async (w, h) => { await page.setViewportSize({ width: w, height: h }); await frames(page, 3); return page.evaluate(() => ({ VW, VH, OX, OY })); };
// środek przycisku w pikselach strony (przycisk w wyśrodkowanej warstwie albo w całym oknie)
const btnCenter = (label, layer) => page.evaluate(([label, layer]) => {
  const list = G.modal ? G.modal.buttons : G.screen.buttons, b = list.find(b => b.label === label), r = G.canvas.getBoundingClientRect(), k = r.width / VW;
  const ox = layer === 'fill' ? 0 : OX, oy = layer === 'fill' ? 0 : OY;
  return { x: r.left + (b.x + ox + b.w / 2) * k, y: r.top + (b.y + oy + b.h / 2) * k };
}, [label, layer]);

test('okno 16:9: szersze okno logiczne, menu wyśrodkowane i klikalne', async () => {
  assert.deepEqual(await size(1280, 720), { VW: 1066, VH: 600, OX: 133, OY: 0 });
  await page.evaluate(() => { setScreen('menu'); G.fade.a = 0; G.fade.target = 0; });
  await frames(page, 3);
  const p = await btnCenter('Nowa gra'); await page.mouse.move(p.x, p.y); await page.mouse.click(p.x, p.y);
  assert.equal(await page.evaluate(() => G.fade.next && G.fade.next.name), 'setup');
  await page.waitForFunction(() => G.screenName === 'setup'); await frames(page, 3);
});

test('mapa przygody wypełnia szerokie okno: większy widok, panel przy prawej krawędzi', async () => {
  await size(1280, 720); await newGame(page, { opponents: 0 }); await frames(page, 3);
  const r = await page.evaluate(() => ({ view: { ...VIEW }, list: LIST.x, rows: LIST_ROWS, end: G.screens.adventure.buttons.at(-1).x }));
  assert.deepEqual(r.view, { x: 8, y: 8, w: 842, h: 552 });
  assert.equal(r.list, 866); assert.equal(r.end, 868); assert.equal(r.rows, 3);
  // kliknięcie w mapę daleko po prawej (poza dawnym obszarem 800×600) wyznacza ścieżkę
  const target = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n, r = G.canvas.getBoundingClientRect(), k = r.width / VW; human(st).explored.fill(1); centerCam(st, h.x, h.y);
    for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) {
      const lx = VIEW.x + tx * T + 16 - st.cam.x, ly = VIEW.y + ty * T + 16 - st.cam.y;
      if (lx > 620 && lx < VIEW.x + VIEW.w - 20 && ly > 20 && ly < VIEW.y + VIEW.h - 20 && !objectAt(st, ty * n + tx) && !heroAt(st, tx, ty) && computePath(st, h, tx, ty))
        return { tx, lx, px: r.left + lx * k, py: r.top + ly * k };
    }
    return null;
  });
  assert.ok(target && target.lx > 600, 'cel poza dawnym widokiem mapy (do x = 584)');
  await page.mouse.move(target.px, target.py); await page.mouse.click(target.px, target.py);
  const path = await page.evaluate(() => hero(G.state).path);
  assert.ok(path && path.at(-1)[0] === target.tx, JSON.stringify(path && path.at(-1)));
  // okno dialogowe jest wyśrodkowane, jego przyciski działają pod myszą
  await page.evaluate(() => showDialog('Test', [{ label: 'OK', key: 'enter' }]));
  const ok = await btnCenter('OK'); await page.mouse.move(ok.x, ok.y); await page.mouse.click(ok.x, ok.y);
  assert.equal(await page.evaluate(() => G.modal), null);
});

test('wysokie okno: dłuższa lista bohaterów i miast; powrót do 4:3 przywraca układ', async () => {
  await newGame(page, { opponents: 0 });
  assert.deepEqual(await size(900, 900), { VW: 800, VH: 800, OX: 0, OY: 100 });
  await frames(page, 2);
  let r = await page.evaluate(() => ({ view: { ...VIEW }, rows: LIST_ROWS, info: INFOBOX.y }));
  assert.deepEqual(r, { view: { x: 8, y: 8, w: 576, h: 752 }, rows: 7, info: 656 });
  assert.deepEqual(await size(800, 600), { VW: 800, VH: 600, OX: 0, OY: 0 });
  r = await page.evaluate(() => ({ view: { ...VIEW }, rows: LIST_ROWS, list: LIST.x }));
  assert.deepEqual(r, { view: { x: 8, y: 8, w: 576, h: 552 }, rows: 3, list: 600 });
  assert.deepEqual(await size(2400, 800), { VW: 1440, VH: 600, OX: 320, OY: 0 }, 'bardzo szeroki ekran: najwyżej VW_MAX');
});

test('wszystkie ekrany rysują się bez błędów w szerokim i wysokim oknie', async () => {
  for (const [w, h] of [[1280, 720], [1600, 600], [768, 1024]]) {
    await size(w, h); await newGame(page, { opponents: 1 });
    for (const go of [
      () => setScreen('town', { townId: G.state.towns[0].id }),
      () => setScreen('hero', {}),
      () => { const st = G.state, m = st.objects.find(o => o.type === 'monster'); setScreen('battle', { battle: createBattle(st, hero(st), m) }); },
      () => { setScreen('adventure', {}); showKingdom(G.state); },
      () => setScreen('menu'), () => setScreen('setup'), () => setScreen('scores'), () => setScreen('credits'),
    ]) { await page.evaluate(`(${go})()`); await frames(page, 4); }
    await page.evaluate(() => { G.modal = null; });
  }
  await size(800, 600);
});
