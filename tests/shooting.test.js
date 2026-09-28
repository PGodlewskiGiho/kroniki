// Strzelanie jak w Heroes 3: ograniczona liczba strzał, połowa obrażeń za odległość i za przeszkodę na torze lotu,
// wyborowi strzelcy bez kar; kliknięcie w wieże miasta na mapie prowadzi do bramy. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('kary strzału: odległość i przeszkoda po połowie, wyborowi strzelcy bez kar, strzały się kończą', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
    h.skills = []; h.army = emptyArmy(); h.army[0] = { cid: 'archer', n: 100 }; h.army[1] = { cid: 'elfSharp', n: 100 };
    const B = createBattle(st, h, m); B.rng = () => 0.5; B.obst.clear();
    const a = B.units.find(u => u.cid === 'archer'), e = B.units.find(u => u.cid === 'elfSharp'), t = B.units.find(u => u.side === 1);
    const put = (u, x, y) => { u.x = x; u.y = y; }, dmg = u => damageRoll(B, u, t, true);
    put(t, 12, 4); put(a, 6, 4); const near = dmg(a); put(a, 1, 4); const far = dmg(a);
    B.obst.set(hexKey(4, 4), { o: OBST.TREE, v: 0 }); const blocked = [shotBlocked(B, a, t), dmg(a)], tip = shotPenaltyText(B, a, t);
    put(e, 1, 4); const sharp = [farShot(e, t), shotBlocked(B, e, t)];
    const shots0 = a.shots; B.obst.clear(); put(a, 6, 4); actShoot(B, a, t);
    return { near, far, blocked, tip, sharp, used: shots0 - a.shots };
  });
  assert.ok(Math.abs(r.far / r.near - 0.5) < 0.02, `odległość ${r.near} → ${r.far}`);
  assert.equal(r.blocked[0], true); assert.ok(Math.abs(r.blocked[1] / r.far - 0.5) < 0.02, 'przeszkoda: kolejna połowa');
  assert.match(r.tip, /daleko i przeszkoda/);
  assert.deepEqual(r.sharp, [false, false], 'wyborowy strzelec bez kar'); assert.equal(r.used, 1);
});

test('kliknięcie w wieże miasta na mapie (pole nad nim) wysyła bohatera do bramy', async () => {
  await newGame(page, { mapSize: 'M' }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns.find(t => t.owner === ME), s = G.screens.adventure, n = st.map.n;
    h.x = t.x; h.y = t.y + 3; for (let i = 0; i < n * n; i++) human(st).explored[i] = 1;
    s.tileClick(t.x, t.y - 2); return { dest: h.dest, gate: [t.x, t.y], ob: drawnObjectAt(st, t.x, t.y - 2).type };
  });
  assert.deepEqual(r.dest, r.gate); assert.equal(r.ob, 'town');
  await frames(page, 2);
});
