// Statki: łódź na wodzie, wsiadanie, żegluga, wysiadka na brzeg, stocznia w mieście nad wodą. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('bohater wsiada do łodzi, płynie po wodzie i wysiada na brzeg; łódź zostaje przy brzegu', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, map = st.map, n = map.n, h = hero(st), W = (x, y) => map.terrain[y * n + x] === TER.WATER;
    human(st).explored.fill(1);
    const free = (x, y) => !W(x, y) && !map.obst[y * n + x] && !st.objAt[y * n + x] && !st.guard[y * n + x];
    const boat = st.objects.find(o => o.type === 'boat' && !o.dead && [...Array(8).keys()].some(d => free(o.x + DX8[d], o.y + DY8[d])));
    const nb = (x, y, f) => { for (let d = 0; d < 8; d++) { const a = x + DX8[d], b = y + DY8[d]; if (f(a, b)) return [a, b]; } return null; };
    const land = nb(boat.x, boat.y, free); h.x = land[0]; h.y = land[1]; h.mp = 9000; h.boat = false;
    const walk = (tx, ty) => { h.path = computePath(st, h, tx, ty); if (!h.path) return false; h.moving = true; for (let g = 0; g < 200 && h.moving; g++) { heroStep(st, h); h.anim = null; if (h.pending) { const f = h.pending; h.pending = null; f(); } } return true; };
    const water = nb(boat.x, boat.y, (x, y) => W(x, y) && !st.objAt[y * n + x]);
    const walkOnWater = !!computePath(st, h, water[0], water[1]);
    walk(boat.x, boat.y); const boarded = !!h.boat && h.x === boat.x && h.y === boat.y && !!boat.dead;
    const noLandWalk = !computePath(st, h, ...(nb(h.x, h.y, (x, y) => free(x, y) && !nb(x, y, W) ? true : false) || [land[0], land[1] + 30]));
    walk(water[0], water[1]); const sailed = h.x === water[0] && h.y === water[1] && h.boat;
    const shore = nb(h.x, h.y, free); walk(shore[0], shore[1]);
    const left = st.objects.find(o => o.type === 'boat' && !o.dead && o.x === water[0] && o.y === water[1]);
    return { walkOnWater, boarded, noLandWalk, sailed, ashore: !h.boat && h.x === shore[0] && h.y === shore[1], mp: h.mp, left: !!left };
  });
  assert.deepEqual(r, { walkOnWater: false, boarded: true, noLandWalk: true, sailed: true, ashore: true, mp: 0, left: true });
  await frames(page, 5);
});

test('stocznia: tylko w mieście nad wodą, łódź za złoto i drewno pojawia się przy mieście', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, map = st.map, n = map.n, t = st.towns[0];
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (map.terrain[(t.y + dy) * n + t.x + dx] === TER.WATER) map.terrain[(t.y + dy) * n + t.x + dx] = TER.GRASS;
    const inland = availableBuildings(t).some(B => B.id === 'shipyard');
    map.terrain[(t.y + 3) * n + t.x + 3] = TER.WATER; map.terrain[(t.y + 3) * n + t.x + 4] = TER.WATER; map.obst[(t.y + 2) * n + t.x + 3] = 0;
    const coastal = availableBuildings(t).some(B => B.id === 'shipyard');
    const noYard = buyBoat(st, t); t.built.push('shipyard'); const R = human(st).resources, g0 = R.gold; const err = buyBoat(st, t);
    const b = st.objects.filter(o => o.type === 'boat' && !o.dead && Math.abs(o.x - t.x) <= 4 && Math.abs(o.y - t.y) <= 4);
    setScreen('town', { townId: t.id });
    return { inland, coastal, noYard: !!noYard, err, paid: g0 - R.gold, boats: b.length };
  });
  assert.deepEqual(r, { inland: false, coastal: true, noYard: true, err: null, paid: 1000, boats: 1 });
  await frames(page, 5);
  assert.ok(await page.evaluate(() => G.screens.town.buttons.some(b => b.label === 'Łódź')));
});
