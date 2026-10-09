// Potwory neutralne: dołączanie do armii i ucieczka przed silnym bohaterem. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); await newGame(page); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// bohater gracza z wybraną armią i potwór o zadanym usposobieniu
const setup = (mood, heroN, monN) => page.evaluate(([mood, heroN, monN]) => {
  const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster' && !o.dead);
  h.army = [{ cid: 'pikeman', n: heroN }, null, null, null, null, null, null]; h.skills = h.skills.filter(s => s.id !== 'leadership');
  m.mood = mood; m.cid = 'pikeman'; m.count = monN; G.modal = null; h.prev = null;
  window.__m = m; return neutralReaction(st, h, m);
}, [mood, heroN, monN]);

test('przyjazne potwory dołączają za darmo do dużo silniejszej armii', async () => {
  assert.deepEqual(await setup('friendly', 100, 10), { kind: 'join', cost: 0 });
  const r = await page.evaluate(() => { const st = G.state, h = hero(st); startEncounter(st, h, __m); const msg = G.modal.msg; G.modal.buttons[0].action(); return { msg, dead: !!__m.dead, n: h.army[0].n }; });
  assert.match(r.msg, /chce do niej dołączyć bez zapłaty/); assert.equal(r.dead, true); assert.equal(r.n, 110);
});

test('neutralne chcą złota, gdy przewaga jest umiarkowana', async () => {
  const re = await setup('neutral', 35, 10);
  assert.equal(re.kind, 'join'); assert.ok(re.cost > 0);
  const r = await page.evaluate(() => { const st = G.state, p = st.players[st.cur], g = p.resources.gold = 5000; startEncounter(st, hero(st), __m); G.modal.buttons[0].action(); return { paid: g - p.resources.gold, dead: !!__m.dead }; });
  assert.equal(r.paid, re.cost); assert.equal(r.dead, true);
});

test('wrogie uciekają przed przytłaczającą armią, a dzikie walczą zawsze', async () => {
  assert.deepEqual(await setup('hostile', 200, 10), { kind: 'flee' });
  const r = await page.evaluate(() => { startEncounter(G.state, hero(G.state), __m); const msg = G.modal.msg; G.modal.buttons[0].action(); return { msg, dead: !!__m.dead }; });
  assert.match(r.msg, /ucieka w popłochu/); assert.equal(r.dead, true);
  assert.equal(await setup('savage', 200, 10), null);
  const msg = await page.evaluate(() => { startEncounter(G.state, hero(G.state), __m); const m = G.modal.msg; G.modal = null; return m; });
  assert.match(msg, /siła: twoja/);
});

test('komputer przyjmuje potwory, które chcą dołączyć', async () => {
  await setup('friendly', 100, 10);
  const r = await page.evaluate(() => { const st = G.state, h = hero(st), g = aiBattle(st, h, __m, []); const res = g.next(); return { done: res.done, won: res.value, dead: !!__m.dead, n: h.army[0].n }; });
  assert.deepEqual(r, { done: true, won: true, dead: true, n: 110 });
});

test('karta potwora na mapie: przybliżona liczebność i nastawienie, bez zdradzania dołączenia ani ucieczki', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, m = st.objects.find(o => o.type === 'monster' && !o.dead); m.count = 23; m.mood = 'friendly';
    const c = monsterCard(st, m); drawPopup(G.ctx, Object.assign(c, { x: 50, y: 50 }));
    human(st).explored.fill(1); centerCam(st, m.x, m.y); const sx = VIEW.x + m.x * T - st.cam.x + T / 2, sy = VIEW.y + m.y * T - st.cam.y + T / 2;
    return { qty: c.qty, extra: c.extra.join(' '), tip: G.screens.adventure.rightInfo(sx, sy) || '' };
  });
  assert.equal(r.qty, 'Mnóstwo'); assert.match(r.extra, /Nastawienie: /); assert.doesNotMatch(r.extra + r.tip, /dołącz|uciekn/);
});
