// Pogoda z sensem: rodzaj opadu zależy od terenu i pory roku (śnieg nad śniegiem i zimą, nad piaskiem burza piaskowa zamiast
// deszczu, nad lawą popiół, nad bagnem mżawka i mgła, jesienią liście w lesie); rysuje się na karcie graficznej i procesorem. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('co pada, zależy od krainy i pory roku (śnieg w śniegach i zimą, piasek na pustyni, popiół nad lawą, mgła na bagnach, jesienią liście)', async () => {
  await newGame(page, { mapSize: 'L', land: 'mixed' }, 21);
  const r = await page.evaluate(() => {
    const st = G.state, n = st.map.n, out = { bad: [], seen: {} };
    for (const [label, month, w] of [['lato', 2, 'storm'], ['zima', 4, 'snow'], ['jesień', 3, 'rain']]) {
      st.month = month;
      for (let y = 0; y < n; y += 2) for (let x = 0; x < n; x += 2) for (const t of [0, 40]) {
        const v = weatherAt(st, x, y, t, w), [snow, sand, lava, swamp] = climateAt(st.map, x, y), k = `${label}:${v[0]}`; out.seen[k] = 1;
        if (sand > 0.6 && (v[0] === WX.RAIN || v[0] === WX.SNOW)) out.bad.push(`${label}: opad na pustyni ${x},${y}`);
        if (snow > 0.6 && v[0] === WX.RAIN) out.bad.push(`${label}: deszcz w krainie śniegu ${x},${y}`);
        if (lava > 0.5 && v[0] !== WX.ASH) out.bad.push(`${label}: nad lawą bez popiołu ${x},${y}`);
        if (swamp > 0.5 && v[2] < 0.3) out.bad.push(`${label}: bagno bez mgły ${x},${y}`);
        if (label === 'zima' && v[0] === WX.RAIN) out.bad.push(`zima: deszcz ${x},${y}`);
      }
    }
    return { bad: out.bad.slice(0, 5), seen: Object.keys(out.seen).sort() };
  });
  assert.deepEqual(r.bad, []);
  assert.ok(r.seen.includes('lato:1') && r.seen.includes('zima:2') && r.seen.includes('jesień:3'), `deszcz latem, śnieg zimą, liście jesienią: ${r.seen}`);
});

test('pogoda rysuje się kartą graficzną i procesorem, tanio, a wyłączona znika', async () => {
  await newGame(page, { mapSize: 'M', land: 'mixed' }, 7);
  const r = await page.evaluate(async () => {
    const st = G.state, wait = k => new Promise(res => { const f = () => (--k <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), real = weatherOf, out = {};
    human(st).explored.fill(1); st.month = 1; window.weatherOf = () => 'storm';
    for (const m of ['gl', 'cpu']) { G.settings.renderer = m; G.dirty = true; await wait(4); out[m] = !!(Weather.grid && Weather.grid.any); }
    const o = Weather.draw; let acc = 0; Weather.draw = function (...a) { const t0 = performance.now(); o.apply(this, a); acc += performance.now() - t0; };
    for (let i = 0; i < 30; i++) { G.time += 1 / 60; drawMapView(G.ctx, st, G.screens.adventure); } Weather.draw = o; out.ms = acc / 30;
    G.settings.weather = 'off'; Weather.grid.any = false; drawMapView(G.ctx, st, G.screens.adventure); out.offSkips = !Weather.grid.any; delete G.settings.weather; window.weatherOf = real;
    return out;
  });
  assert.ok(r.gl && r.cpu, 'pogoda widoczna w obu trybach'); assert.ok(r.ms < 3, `pogoda: ${r.ms.toFixed(2)} ms na klatkę`); assert.ok(r.offSkips, 'wyłączona się nie liczy');
});

test('pogoda jest regionalna: sąsiednie pola prawie zawsze mają tę samą (granice tylko między dużymi obszarami)', async () => {
  await newGame(page, { mapSize: 'L', land: 'mixed' }, 33);
  const r = await page.evaluate(() => {
    const st = G.state, n = st.map.n, out = {};
    for (const [month, w] of [[2, 'storm'], [3, 'rain'], [4, 'snow']]) { st.month = month; let pairs = 0, diff = 0; const type = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) type[y * n + x] = weatherAt(st, x, y, 10, w)[0];
      for (let y = 0; y < n; y++) for (let x = 0; x + 1 < n; x++) { pairs += 2; if (type[y * n + x] !== type[y * n + x + 1]) diff++; if (y + 1 < n && type[y * n + x] !== type[(y + 1) * n + x]) diff++; }
      out[w] = diff / pairs; }
    return out;
  });
  for (const [w, v] of Object.entries(r)) assert.ok(v < 0.04, `${w}: ${(v * 100).toFixed(1)}% sąsiednich pól z inną pogodą`);
});
