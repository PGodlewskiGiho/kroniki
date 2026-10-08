// Pogoda z sensem: rodzaj opadu zależy od terenu i pory roku (śnieg nad śniegiem i zimą, nad piaskiem burza piaskowa zamiast
// deszczu, nad lawą popiół, nad bagnem mżawka i mgła, jesienią liście w lesie); rysuje się na karcie graficznej i procesorem. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('co pada, zależy od pola i pory roku', async () => {
  await newGame(page, { mapSize: 'L', land: 'mixed' }, 21);
  const r = await page.evaluate(() => {
    const st = G.state, n = st.map.n, names = ['brak', 'deszcz', 'śnieg', 'liście', 'popiół', 'piasek'], out = {};
    for (const [label, month, w] of [['lato', 2, 'storm'], ['zima', 4, 'snow'], ['jesień', 3, 'rain']]) {
      st.month = month; const by = {};
      for (let y = 0; y < n; y += 2) for (let x = 0; x < n; x += 2) for (const t of [0, 40]) { const v = weatherAt(st, x, y, t, w), ter = TERRAINS[st.map.terrain[y * n + x]].name; (by[ter] = by[ter] || new Set()).add(names[v[0]]); if (v[2] > 0.05) (by[ter + ':mgła'] = 1); }
      out[label] = Object.fromEntries(Object.entries(by).map(([k, s]) => [k, s === 1 ? 1 : [...s].sort()]));
    }
    return out;
  });
  const has = (season, ter, kind) => (r[season][ter] || []).includes(kind);
  for (const s of ['lato', 'zima', 'jesień']) {
    for (const t of Object.keys(r[s])) if (/piasek|pustynia/i.test(t) && !t.includes(':')) assert.ok(!has(s, t, 'deszcz') && !has(s, t, 'śnieg'), `${s}: na piasku nie pada (${r[s][t]})`);
    for (const t of Object.keys(r[s])) if (/śnieg/i.test(t) && !t.includes(':')) assert.ok(!has(s, t, 'deszcz'), `${s}: nad śniegiem nie ma deszczu`);
  }
  const grass = Object.keys(r.lato).find(t => /trawa|łąka/i.test(t)) || Object.keys(r.lato)[1];
  assert.ok(has('lato', grass, 'deszcz') && !has('lato', grass, 'śnieg'), `lato na ${grass}: ${r.lato[grass]}`);
  assert.ok(has('zima', grass, 'śnieg') && !has('zima', grass, 'deszcz'), `zima na ${grass}: ${r.zima[grass]}`);
  assert.ok(Object.values(r['jesień']).some(v => Array.isArray(v) && v.includes('liście')), 'jesienią liście w lasach');
  const lava = Object.keys(r.lato).find(t => /lawa/i.test(t) && !t.includes(':')); if (lava) assert.deepEqual(r.lato[lava], ['popiół']);
  const swamp = Object.keys(r.lato).find(t => /bagno|moczar/i.test(t) && !t.includes(':')); if (swamp) assert.ok(r.lato[swamp + ':mgła'], 'mgła nad bagnem');
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
