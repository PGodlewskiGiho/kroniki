// Scena końca bitwy: zwycięstwo albo porażka z punktu widzenia gracza, pominięcie kliknięciem. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

for (const win of [true, false]) test(`${win ? 'zwycięstwo' : 'porażka'}: scena z napisem i cząstkami, klik pomija ją i wraca na mapę`, async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 8);
  await page.evaluate(win => {
    const st = G.state, h = hero(st), foe = st.heroes.find(x => x.owner === 1);
    h.army = emptyArmy(); h.army[0] = { cid: 'champion', n: win ? 30 : 1 }; foe.army = emptyArmy(); foe.army[0] = { cid: 'pikeman', n: win ? 2 : 80 };
    setScreen('battle', { battle: createBattle(st, h, foe) }); const s = G.screens.battle; s.B.auto = true;
    for (let i = 0; i < 4000 && s.phase !== 'over'; i++) s.update(0.05);
  }, win);
  await frames(page, 10);
  const r = await page.evaluate(() => { const s = G.screens.battle, E = s.ending; for (let i = 0; i < 10; i++) s.update(0.05); return { phase: s.phase, win: E.win, title: E.title, parts: E.parts.length }; });
  assert.equal(r.phase, 'over'); assert.equal(r.win, win); assert.equal(r.title, win ? 'Zwycięstwo!' : 'Porażka'); assert.ok(r.parts > 0, 'cząstki');
  await page.evaluate(() => G.screens.battle.onClick(400, 300));
  await page.waitForFunction(() => G.screenName === 'adventure' && G.modal, null, { timeout: 5000 });
  assert.match(await page.evaluate(() => G.modal && G.modal.msg), win ? /Zwycięstwo/ : /Porażka/);
});
