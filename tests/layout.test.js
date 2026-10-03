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
  assert.deepEqual(await size(1280, 720), { VW: 1280, VH: 720, OX: 0, OY: 0 }, 'menu w jednostkach interfejsu');
  await page.evaluate(() => { setScreen('menu'); G.fade.a = 0; G.fade.target = 0; });
  await frames(page, 3);
  const p = await btnCenter('Nowa gra'); await page.mouse.move(p.x, p.y); await page.mouse.click(p.x, p.y);
  assert.equal(await page.evaluate(() => G.fade.next && G.fade.next.name), 'setup');
  await page.waitForFunction(() => G.screenName === 'setup'); await frames(page, 3);
});

test('mapa przygody wypełnia szerokie okno: większy widok, panel przy prawej krawędzi', async () => {
  await size(1280, 720); await newGame(page, { opponents: 0 }, 3); await frames(page, 3); // ziarno 3: cel daleko w prawo jest osiągalny
  const r = await page.evaluate(() => ({ view: { ...VIEW }, list: LIST.x, rows: LIST_ROWS, end: G.screens.adventure.buttons.find(b => b.label === 'Koniec tury').x }));
  assert.deepEqual(r.view, { x: 8, y: 8, w: 1056, h: 672 }, 'jednostki interfejsu: okno 1280×720 to 1280×720');
  assert.equal(r.list, 1080); assert.equal(r.end, 1146); assert.equal(r.rows, 5);
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
  assert.deepEqual(await size(900, 900), { VW: 818, VH: 818, OX: 0, OY: 0 }, 'powyżej UI_MAX_H interfejs rośnie');
  await frames(page, 2);
  let r = await page.evaluate(() => ({ view: { ...VIEW }, rows: LIST_ROWS, info: INFOBOX.y }));
  assert.deepEqual(r, { view: { x: 8, y: 8, w: 594, h: 770 }, rows: 7, info: 674 });
  assert.deepEqual(await size(800, 600), { VW: 800, VH: 600, OX: 0, OY: 0 });
  r = await page.evaluate(() => ({ view: { ...VIEW }, rows: LIST_ROWS, list: LIST.x }));
  assert.deepEqual(r, { view: { x: 8, y: 8, w: 576, h: 552 }, rows: 3, list: 600 });
  assert.deepEqual(await size(2400, 800), { VW: 2400, VH: 800, OX: 0, OY: 0 }, 'bardzo szeroki ekran: mapa na całą szerokość');
  assert.deepEqual(await size(844, 390), { VW: 952, VH: 440, OX: 0, OY: 0 }, 'telefon poziomo: okno ma co najmniej UI_MIN_H jednostek');
  r = await page.evaluate(() => ({ compact: PANEL.compact, rows: LIST_ROWS, mini: MINI.s, info: INFOBOX.h }));
  assert.deepEqual(r, { compact: true, rows: 3, mini: 112, info: 0 }, 'kompaktowy panel na niskim ekranie');
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

test('bitwa w oknie telefonu: panel z boku, pole większe, kliknięcie heksu działa', async () => {
  await size(844, 390); await newGame(page, { opponents: 0 });
  await page.evaluate(() => { const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'); m.cid = 'pikeman'; m.count = 5; setScreen('battle', { battle: createBattle(st, h, m) }); });
  await frames(page, 5);
  const r = await page.evaluate(() => { const S = G.screens.battle, B = S.B; for (let i = 0; i < 400 && (S.phase !== 'input' || B.active.side !== 0); i++) S.update(0.1);
    const L = S.lay(), u = B.active, k = [...S.reach.dist.keys()].find(k => !unitAt(B, k % BCOLS, Math.floor(k / BCOLS))), tx = k % BCOLS, ty = Math.floor(k / BCOLS), [fx, fy] = hexCenter(tx, ty), c = G.canvas.getBoundingClientRect(), s = c.width / VW;
    return { side: L.side, fs: L.fs, px: c.left + (L.fx + fx * L.fs) * s, py: c.top + (L.fy + fy * L.fs) * s, to: [tx, ty], u: B.units.indexOf(u) }; });
  assert.ok(r.side && r.fs > 0.75, JSON.stringify(r));
  await page.mouse.move(r.px, r.py); await page.mouse.click(r.px, r.py);
  const after = await page.evaluate(i => { const S = G.screens.battle; for (let k = 0; k < 100 && S.phase === 'play'; k++) S.update(0.1); const u = S.B.units[i]; return [u.x, u.y]; }, r.u);
  assert.deepEqual(after, r.to);
  await size(800, 600);
});

test('miasto w oknie telefonu: szuflada armii i kliknięcie oddziału w garnizonie', async () => {
  await size(844, 390); await newGame(page, { opponents: 0 });
  await page.evaluate(() => { G.screens.town.garOpen = false; setScreen('town', { townId: G.state.towns.findIndex(t => t.owner === 0) }); });
  await frames(page, 3);
  let r = await page.evaluate(() => { const S = G.screens.town, R = S.lay(); return { compact: R.compact, B: !!R.B, rows: R.N, gar: S.buttons.some(b => b.label === 'Armia') }; });
  assert.deepEqual(r, { compact: true, B: false, rows: 2, gar: true });
  await page.evaluate(() => G.screens.town.buttons.find(b => b.label === 'Armia').action()); await frames(page, 3);
  r = await page.evaluate(() => { const S = G.screens.town, R = S.lay(), g = S.heroRects[0], c = G.canvas.getBoundingClientRect(), k = c.width / VW, B = R.B;
    return { B: !!B, px: c.left + (B.sx + (g.x + g.w / 2 - B.lx) * B.s) * k, py: c.top + (B.sy + (g.y + g.h / 2 - B.ly) * B.s) * k }; });
  assert.ok(r.B);
  await page.mouse.move(r.px, r.py); await page.mouse.click(r.px, r.py);
  assert.deepEqual(await page.evaluate(() => G.screens.town.sel && G.screens.town.sel.i), 0, 'pierwszy oddział bohatera w bramie zaznaczony');
  await size(800, 600);
});

test('telefon: dawny ekran (nowa gra) w pełnej wielkości, przewijany kółkiem; przycisk na dole klikalny po przewinięciu', async () => {
  await size(844, 390); await page.evaluate(() => { setScreen('setup'); G.fade.a = 0; G.fade.target = 0; }); await frames(page, 3);
  const r0 = await page.evaluate(() => ({ max: G.legScrollMax, ls: LS }));
  assert.ok(r0.max > 100 && r0.ls === 1, JSON.stringify(r0));
  await page.mouse.move(400, 200); await page.mouse.wheel(0, 2000); await frames(page, 3);
  const p = await page.evaluate(() => { const b = G.screen.buttons.find(b => b.label === 'Wróć'), c = G.canvas.getBoundingClientRect(), k = c.width / UNITS.ui.vw;
    return { s: G.legScroll, x: c.left + (OX + b.x + b.w / 2) * LS * k, y: c.top + (OY + b.y + b.h / 2) * LS * k }; });
  assert.ok(p.s > 100 && p.y < 390, JSON.stringify(p));
  await page.mouse.move(p.x, p.y); await page.mouse.click(p.x, p.y);
  assert.equal(await page.evaluate(() => G.fade.next && G.fade.next.name), 'menu');
  await page.waitForFunction(() => G.screenName === 'menu'); await size(800, 600);
});

test('dotyk na mapie: pierwsze stuknięcie pokazuje opis celu, drugie wysyła bohatera', async () => {
  await newGame(page, { opponents: 0 }, 5);
  const r = await page.evaluate(() => { const st = G.state, h = hero(st), S = G.screens.adventure, ob = st.objects.find(o => o.type === 'mine' && Math.abs(o.x - h.x) < 6 && Math.abs(o.y - h.y) < 6);
    G.mouse.type = 'touch'; S.tileClick(ob.x, ob.y); const first = { info: S.tapInfo && S.tapInfo.text, moving: !!(h.moving || h.anim) };
    S.tileClick(ob.x, ob.y); const second = !!(h.moving || h.anim) || h.path === null; G.mouse.type = 'mouse'; return { first, second, tap: S.tapInfo }; });
  assert.match(r.first.info, /Właściciel: nikt/); assert.equal(r.first.moving, false); assert.ok(r.second); assert.equal(r.tap, null);
});
