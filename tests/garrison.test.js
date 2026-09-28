// Bohater w garnizonie (jak w Heroes 3): wchodzi do murów i przejmuje wojsko garnizonu, brama zostaje wolna na najem
// w tawernie; bohater w murach nie chodzi po mapie, broni miasta, a zapis gry to pamięta. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('zamiana: bohater z bramy do garnizonu, brama wolna, najem drugiego, potem zamiana miejscami', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns.find(t => t.owner === ME), h = hero(st), R = human(st).resources; R.gold = 20000; t.built.push('tavern');
    h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 10 }; t.garrison = emptyArmy(); t.garrison[0] = { cid: 'pikeman', n: 5 }; t.garrison[1] = { cid: 'archer', n: 4 };
    const full = !!hireHero(st, t, 0).error, e1 = swapGarrison(st, t);
    const inside = { g: garrisonHero(st, t) === h, gate: heroAt(st, t.x, t.y), army: armySize(h.army), gar: armySize(t.garrison) };
    const hired = hireHero(st, t, 0).hero, v = heroInTown(st, t) === hired;
    const e2 = swapGarrison(st, t), after = { g: garrisonHero(st, t) === hired, out: heroInTown(st, t) === h };
    // bohater w garnizonie nie chodzi, a miasta broni on (a nie ten w bramie)
    const s = G.screens.adventure; st.selHero = st.heroes.indexOf(hired); s.tileClick(t.x + 3, t.y + 3);
    const def = battleSide(st, t).hero === hired;
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st)))), saved = back.heroes.find(o => o.id === hired.id).garrison === t.id;
    return { full, e1, inside, hired: !!hired, v, e2, after, noPath: !hired.path, def, saved };
  });
  assert.equal(r.full, true, 'zajęta brama: nie da się nająć');
  assert.equal(r.e1, null); assert.deepEqual(r.inside, { g: true, gate: null, army: 19, gar: 0 });
  assert.ok(r.hired && r.v, 'wolna brama: najem się udał');
  assert.equal(r.e2, null); assert.deepEqual(r.after, { g: true, out: true });
  assert.ok(r.noPath, 'bohater w garnizonie nie wyrusza'); assert.ok(r.def, 'broni bohater z garnizonu'); assert.ok(r.saved);
});

test('ekran miasta: przycisk Zamień i portret bohatera w garnizonie', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await page.evaluate(() => { const st = G.state, t = st.towns.find(t => t.owner === ME); setScreen('town', { townId: t.id }); G.modal = null; });
  await frames(page, 3);
  await page.keyboard.press('z'); await frames(page, 3);
  const r = await page.evaluate(() => { const st = G.state, t = st.towns.find(t => t.owner === ME); return { g: !!garrisonHero(st, t), msg: G.screens.town.msg }; });
  assert.equal(r.g, true); assert.match(r.msg, /brama jest wolna/);
});
