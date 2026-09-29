// Zasady gry z ekranu „Zasady” (RULES): limit bohaterów, rozejm, potwory, skarby, odkryta mapa. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('limit bohaterów: najem i więzień sprawdzają limit gry, komputer też go przestrzega', async () => {
  await newGame(page, { rules: { heroes: 2 } });
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0]; if (!t.built.includes('tavern')) t.built.push('tavern'); human(st).resources.gold = 1e6;
    const h0 = heroAt(st, t.x, t.y); if (h0) { h0.x = t.x - 1; h0.y = t.y + 2; }
    const first = hireHero(st, t, 0).error; const h = heroAt(st, t.x, t.y); h.x = t.x + 1; h.y = t.y + 2;
    return { first, second: hireHero(st, t, 1).error, count: myHeroes(st).length, ai: aiMaxHeroes(st), lim: heroLimit(st) };
  });
  assert.equal(r.first, undefined); assert.equal(r.count, 2); assert.equal(r.lim, 2);
  assert.match(r.second, /najwyżej 2 bohaterów \(limit tej gry\)/);
  assert.ok(r.ai <= 2);
  await newGame(page, { rules: { heroes: 1 } });
  assert.equal(await page.evaluate(() => aiMaxHeroes(G.state)), 1);
});

test('rozejm, potwory, skarby i odkryta mapa zmieniają świat; stary zapis bez zasad ma domyślne', async () => {
  const world = rules => newGame(page, { mapSize: 'M', opponents: 1, rules }, 77).then(() => page.evaluate(() => {
    const st = G.state, m = st.objects.filter(o => o.type === 'monster'), gold = st.objects.filter(o => o.type === 'res' && o.res === 'gold');
    return { mon: m.reduce((s, o) => s + o.count * CREATURES[o.cid].value, 0), gold: gold.reduce((s, o) => s + o.amount, 0), chest: st.objects.filter(o => o.type === 'chest').reduce((s, o) => s + o.gold, 0),
      seen: human(st).explored.reduce((a, b) => a + b, 0), all: st.map.n * st.map.n, truce: truceDays(st), rules: st.settings.rules };
  }));
  const base = await world(null), hard = await world({ monsters: 2.2, treasure: 1.6, reveal: true, truce: 0 }), soft = await world({ monsters: 0.6, treasure: 0.6, truce: 28 });
  assert.deepEqual(base.rules, { heroes: 8, truce: 'auto', monsters: 1, treasure: 1, reveal: false });
  assert.equal(base.truce, 14); assert.equal(hard.truce, 0); assert.equal(soft.truce, 28);
  assert.ok(hard.mon > base.mon * 1.6 && soft.mon < base.mon * 0.75, `potwory ${soft.mon} < ${base.mon} < ${hard.mon}`);
  assert.ok(hard.gold > base.gold && soft.gold < base.gold && hard.chest > base.chest && soft.chest < base.chest);
  assert.ok(base.seen < base.all); assert.equal(hard.seen, hard.all);
  const old = await page.evaluate(() => { delete G.state.settings.rules; return { lim: heroLimit(G.state), truce: truceDays(G.state), m: rule(G.state, 'monsters') }; });
  assert.deepEqual(old, { lim: 8, truce: 14, m: 1 });
});

test('ekran zasad: przyciski zmieniają ustawienia, „Domyślne” przywraca, nowa gra dostaje kopię', async () => {
  const r = await page.evaluate(() => {
    G.settings.rules = validRules(null); setScreen('rules', {});
    const b = l => G.screen.buttons.find(x => x.label === l);
    b('3').action(); b('Miesiąc').action(); b('Odkryta').action();
    const set = { ...G.settings.rules }; const st = createNewGame(G.settings, 5); G.settings.rules.heroes = 5;
    const copy = st.settings.rules.heroes; b('Domyślne').action();
    return { set, copy, def: G.settings.rules };
  });
  await frames(page, 3);
  assert.deepEqual(r.set, { heroes: 3, truce: 28, monsters: 1, treasure: 1, reveal: true });
  assert.equal(r.copy, 3, 'nowa gra ma własną kopię zasad');
  assert.deepEqual(r.def, { heroes: 8, truce: 'auto', monsters: 1, treasure: 1, reveal: false });
});
