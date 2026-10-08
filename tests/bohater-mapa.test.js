// Bohater na mapie przygody: 8 kierunków ruchu (zachodnie jako odbicia wschodnich), płynny chód (12 klatek), kierunek zostaje
// po zatrzymaniu. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każda klasa bohatera ma arkusz mapy: 5 kierunków, 12 klatek chodu i 4 spoczynku', async () => {
  const r = await page.evaluate(() => Object.keys(HERO_CLASSES).map(c => { const M = HERO_MAP_ART[c]; return M ? [c, ...['E', 'SE', 'S', 'NE', 'N'].map(d => `${M.f['walk_' + d].length}/${M.f['idle_' + d].length}`)] : [c, 'brak']; }));
  for (const [c, ...d] of r) assert.deepEqual(d, Array(5).fill('12/4'), `klasa ${c}`);
});

test('kierunek z kroku: 8 stron, zachodnie odbite, w górę i w dół osobne widoki; po zatrzymaniu zostaje', async () => {
  await newGame(page, { mapSize: 'S' }, 5);
  await page.waitForFunction(() => Object.values(HERO_MAP_IMG).every(im => im._ok), null, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const h = hero(G.state), col = '#c03030', out = {}, sig = s => { const g = s.c.getContext('2d'), d = g.getImageData(0, 0, s.c.width, s.c.height).data; let a = 0, b = 0; for (let i = 0; i < d.length; i += 4) { a += d[i + 3]; b += (i / 4 % s.c.width) * d[i + 3]; } return [s.c.width, s.c.height, Math.round(b / a)].join('x'); };
    for (const [dx, dy] of [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]) { h.anim = { fx: h.x - dx, fy: h.y - dy, t: 0 }; const f = heroFacing(h), s = heroMap3d(h, col); out[HERO_FACE[f]] = { s: sig(s), ax: s.ax, w: s.c.width }; }
    h.anim = null; const still = HERO_FACE[heroFacing(h)]; // ostatni krok był na płn.-wschód
    h.anim = { fx: h.x, fy: h.y + 1, t: 0 }; const frames = new Set(); for (let k = 0; k < 40; k++) { G.time += 1 / 60; frames.add(heroMap3d(h, col).c); }
    return { out, still, frames: frames.size };
  });
  assert.deepEqual(Object.keys(r.out).sort(), ['E', 'N', 'NE', 'NW', 'S', 'SE', 'SW', 'W']);
  assert.notEqual(r.out.N.s, r.out.S.s, 'widok w górę inny niż w dół'); assert.notEqual(r.out.E.s, r.out.S.s);
  for (const [w, e] of [['W', 'E'], ['SW', 'SE'], ['NW', 'NE']]) assert.equal(r.out[w].ax, r.out[e].w - r.out[e].ax, `${w} to odbicie ${e}`);
  assert.equal(r.still, 'NE', 'po zatrzymaniu bohater patrzy tam, dokąd szedł');
  assert.ok(r.frames >= 12, `klatek chodu w 2/3 s: ${r.frames}`);
});
