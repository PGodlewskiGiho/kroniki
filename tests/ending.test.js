// Koniec bitwy jak w Heroes 3: zwycięzcy wiwatują, potem okno wyniku nad polem bitwy (portrety, obraz, straty obu stron),
// OK wraca na mapę. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

for (const win of [true, false]) test(`${win ? 'zwycięstwo' : 'porażka'}: okno wyniku ze stratami obu stron, OK wraca na mapę`, async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 8);
  await page.evaluate(win => {
    const st = G.state, h = hero(st), foe = st.heroes.find(x => x.owner === 1);
    h.army = emptyArmy(); h.army[0] = { cid: 'champion', n: win ? 30 : 1 }; foe.army = emptyArmy(); foe.army[0] = { cid: 'pikeman', n: win ? 2 : 80 };
    setScreen('battle', { battle: createBattle(st, h, foe) }); const s = G.screens.battle; s.B.auto = true;
    for (let i = 0; i < 4000 && s.phase !== 'over'; i++) s.update(0.05);
  }, win);
  assert.equal(await page.evaluate(() => G.screens.battle.phase), 'over', 'zwycięzcy wiwatują');
  await page.evaluate(() => { const s = G.screens.battle; s.update(0.4); s.onClick(400, 300); }); // klik przyspiesza wiwaty
  await frames(page, 10);
  const r = await page.evaluate(() => { const M = G.modal; return { screen: G.screenName, kind: M.report.kind, title: M.report.title }; });
  assert.equal(r.screen, 'battle', 'okno nad polem bitwy');
  assert.equal(r.kind, win ? 'win' : 'lose'); assert.equal(r.title, win ? 'Zwycięstwo!' : 'Porażka');
  await page.evaluate(() => G.modal.buttons[0].action());
  await page.waitForFunction(() => G.screenName === 'adventure');
});

test('wynik bitwy zna straty obu stron i bohaterów', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), foe = st.heroes.find(x => x.owner === 1);
    h.army = emptyArmy(); h.army[0] = { cid: 'champion', n: 30 }; foe.army = emptyArmy(); foe.army[0] = { cid: 'pikeman', n: 5 };
    const res = resolveBattle(simulateBattle(createBattle(st, h, foe)), false);
    showBattleResult(st, h, res); const M = G.modal;
    return { outcome: res.outcome, me: res.sides[0].hero === h, foe: res.sides[1].hero === foe, foeLost: res.sides[1].lost, msg: M.msg, report: !!M.report };
  });
  assert.equal(r.outcome, 'win'); assert.ok(r.me && r.foe);
  assert.deepEqual(r.foeLost, [{ cid: 'pikeman', n: 5 }]);
  assert.match(r.msg, /Zwycięstwo!.*otrzymuje \d+ doświadczenia/); assert.ok(r.report);
  await frames(page, 5);
});
