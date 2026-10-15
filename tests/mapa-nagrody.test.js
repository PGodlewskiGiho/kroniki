// Mapa: każdy rodzaj kopalni na każdej mapie (więcej na większych), nagrody tym cenniejsze, im dalej od startów i silniejsi strażnicy.
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const gen = (size, land, ug, seed, opp = 1) => page.evaluate(([size, land, ug, seed, opp]) => {
  const S = Object.assign({}, G.settings, { mapSize: size, land, difficulty: 1, faction: 'haven', bonus: 'gold', opponents: opp, slots: null, underground: ug });
  const st = createNewGame(S, seed), c = {}; for (const o of st.objects) if (o.type === 'mine') c[o.kind] = (c[o.kind] || 0) + 1;
  const starts = st.towns.filter(t => t.owner >= 0), spread = levelSize(st.map) / Math.sqrt(starts.length) * 0.7, d01 = o => Math.min(1, Math.min(...starts.map(t => Math.hypot(o.x - t.x, o.y - t.y))) / spread);
  const near = [], far = []; for (const o of st.objects) if (o.type === 'chest' || (o.type === 'res' && o.res === 'gold')) (d01(o) < 0.3 ? near : d01(o) > 0.7 ? far : []).push(o.type === 'chest' ? o.gold : o.amount);
  const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  return { c, total: Object.values(c).reduce((a, b) => a + b, 0), near: avg(near), far: avg(far), nFar: far.length };
}, [size, land, ug, seed, opp]);

test('kopalnie: każdy z 7 rodzajów na każdej mapie, więcej na większych', async () => {
  const kinds = ['wood', 'ore', 'gold', 'mercury', 'sulfur', 'crystal', 'gems'], totals = {};
  for (const [size, land, ug, seed, opp] of [['S', 'mixed', false, 3, 1], ['S', 'islands', true, 8, 3], ['M', 'forest', false, 11, 3], ['L', 'mountains', true, 5, 1], ['XL', 'mixed', false, 2, 3]]) {
    const r = await gen(size, land, ug, seed, opp);
    for (const k of kinds) assert.ok(r.c[k] >= 1, `${size} ${land}${ug ? ' z podziemiami' : ''}: brak kopalni ${k} (${JSON.stringify(r.c)})`);
    totals[size + (ug ? '+' : '')] = r.total;
  }
  assert.ok(totals.S >= 12 && totals.M >= 22 && totals.XL >= 40, JSON.stringify(totals));
});

test('nagrody: skrzynie i złoto daleko od startów wyraźnie cenniejsze niż przy nich', async () => {
  const r = await gen('L', 'mixed', false, 21, 3);
  assert.ok(r.nFar >= 5 && r.far >= r.near * 2, `blisko ${Math.round(r.near)}, daleko ${Math.round(r.far)} (${r.nFar})`);
});
