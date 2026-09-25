// Mgła wojny dla SI (krok 5): komputer zna tylko teren, który odkrył. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const count = a => a.reduce((s, v) => s + v, 0);

test('SI zaczyna z odkrytym otoczeniem i odkrywa mapę, człowiek nic nie zyskuje', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, ai = st.players[1], foe = st.heroes.find(h => h.owner === 1), n = st.map.n;
    const start = ai.explored.reduce((s, v) => s + v, 0), mine0 = human(st).explored.slice(), seesHome = !!ai.explored[foe.y * n + foe.x];
    const humanHome = st.towns[0], knowsHuman = !!ai.explored[humanHome.y * n + humanHome.x];
    for (let d = 0; d < 5; d++) { G.screens.adventure.doEndTurn(); G.modal = null; }
    return { start, after: ai.explored.reduce((s, v) => s + v, 0), total: n * n, seesHome, knowsHuman,
      humanSame: human(st).explored.every((v, i) => v === mine0[i]) };
  });
  assert.ok(r.seesHome);
  assert.ok(!r.knowsHuman, 'SI nie zna na starcie miasta gracza');
  assert.ok(r.start > 0 && r.start < r.total / 4, `na starcie ${r.start}`);
  assert.ok(r.after > r.start * 2, `po 5 dniach ${r.after} (start ${r.start})`);
  assert.ok(r.humanSame, 'ruchy SI nie odkrywają mapy człowiekowi');
});

test('SI wybiera cele tylko na odkrytym terenie, a bez nich idzie na zwiad', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 7);
  const r = await page.evaluate(() => {
    const st = G.state, ai = st.players[1], foe = st.heroes.find(h => h.owner === 1), n = st.map.n;
    foe.army = emptyArmy(); foe.army[0] = { cid: 'champion', n: 50 };
    // skarb poza zasięgiem wzroku: bez odkrycia go nie widać
    ai.explored.fill(0); reveal(st, foe.x, foe.y, 2, 1);
    const R = aiReach(st, foe), t = aiPickTarget(st, foe, R);
    const reachUnknown = [...R.dist].some((d, i) => d < Infinity && !ai.explored[i]);
    // pełna wiedza: cel może leżeć daleko
    ai.explored.fill(1); const t2 = aiPickTarget(st, foe, aiReach(st, foe));
    return { what: t && t.what, known: t && !!ai.explored[t.i], reachUnknown, far: t2 && t2.what !== 'explore' };
  });
  assert.equal(r.reachUnknown, false, 'trasy tylko po odkrytym terenie');
  assert.ok(r.what, 'jest jakiś cel');
  assert.ok(r.far, 'przy odkrytej mapie zwykły cel');
});

test('mgła SI przetrwa zapis i odczyt', async () => {
  await newGame(page, { mapSize: 'S', opponents: 2 }, 4);
  const r = await page.evaluate(() => {
    const st = G.state; for (let d = 0; d < 3; d++) { G.screens.adventure.doEndTurn(); G.modal = null; }
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return st.players.map((p, k) => p.explored.every((v, i) => v === back.players[k].explored[i]));
  });
  assert.deepEqual(r, [true, true, true]);
});
