// Spotkanie bohaterów: wymiana oddziałów i artefaktów (etap 1, krok 4). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Dwóch bohaterów gracza obok siebie; b dostaje artefakt w plecaku
async function twoHeroes() {
  await newGame(page, { mapSize: 'M' }, 41);
  await page.evaluate(() => {
    const st = G.state, t = st.towns[0], a = hero(st), n = st.map.n; human(st).explored.fill(1); t.built.push('tavern'); human(st).resources.gold = 9999;
    a.y = t.y + 1; const b = hireHero(st, t, 0).hero;
    const spot = [[1, 1], [-1, 1], [0, 2], [1, 2]].map(([dx, dy]) => [a.x + dx, a.y + dy - 1]).find(([x, y]) => passableTile(st, x, y) && !objectAt(st, y * n + x) && !heroAt(st, x, y) && Math.max(Math.abs(x - a.x), Math.abs(y - a.y)) === 1);
    b.x = spot[0]; b.y = spot[1]; b.bag = ['wandererBoots'];
    G.screens.adventure.enter({}); G.modal = null; G.screens.adventure.selectHero(a);
  });
}
// Kliknięcie w środek miejsca armii (k = bohater 0/1, i = miejsce) albo artefaktu w plecaku
const click = (what, k, i) => page.evaluate(([what, k, i]) => {
  G.modal.draw(G.ctx); // prostokąty liczone przy rysowaniu
  const rows = [70 + 96, 70 + 290], x = what === 'army' ? 60 + 24 + i * 90 + 42 : 60 + 90 + i * 46 + 20, y = what === 'army' ? rows[k] + 16 + 25 : rows[k] + 92;
  G.modal.onClick(x, y);
}, [what, k, i]);

test('kliknięcie sąsiedniego własnego bohatera otwiera spotkanie, dalekiego — wybiera go', async () => {
  await twoHeroes();
  const r = await page.evaluate(() => {
    const st = G.state, scr = G.screens.adventure, [a, b] = myHeroes(st); scr.tileClick(b.x, b.y);
    const meeting = !!(G.modal && G.modal.meeting); G.modal = null;
    b.x += 3; scr.selectHero(a); scr.tileClick(b.x, b.y); const sel = hero(st) === b; b.x -= 3; return { meeting, sel };
  });
  assert.deepEqual(r, { meeting: true, sel: true });
});

test('wymiana oddziałów: przeniesienie, połączenie, ostatni oddział zostaje', async () => {
  await twoHeroes();
  await page.evaluate(() => { const [a, b] = myHeroes(G.state); a.army = [{ cid: 'pikeman', n: 10 }, { cid: 'archer', n: 5 }, null, null, null, null, null]; b.army = [{ cid: 'pikeman', n: 3 }, null, null, null, null, null, null]; showMeeting(G.state, a, b); });
  await frames(page, 2);
  await click('army', 0, 1); await click('army', 1, 4); // łucznicy a → b (wolne miejsce)
  await click('army', 1, 0); await click('army', 0, 0); // piki b → a (połączenie) — to ostatni oddział b? nie, b ma też łuczników
  const r = await page.evaluate(() => { const [a, b] = myHeroes(G.state); return { a: a.army.map(s => s && `${s.cid}:${s.n}`), b: b.army.map(s => s && `${s.cid}:${s.n}`) }; });
  assert.deepEqual(r.a, ['pikeman:13', null, null, null, null, null, null]);
  assert.deepEqual(r.b, [null, null, null, null, 'archer:5', null, null]);
  await click('army', 0, 0); await click('army', 1, 0); // ostatni oddział a nie może odejść
  const r2 = await page.evaluate(() => ({ a: armyStacks(myHeroes(G.state)[0].army).length }));
  assert.equal(r2.a, 1);
});

test('wymiana artefaktów z plecaka i okno rysuje się bez błędów', async () => {
  await twoHeroes();
  await page.evaluate(() => { const [a, b] = myHeroes(G.state); showMeeting(G.state, a, b); });
  await frames(page, 3);
  await click('bag', 1, 0);
  const r = await page.evaluate(() => { const [a, b] = myHeroes(G.state); return { a: a.bag.slice(), b: b.bag.slice() }; });
  assert.ok(r.a.includes('wandererBoots'));
  assert.deepEqual(r.b, []);
  await frames(page, 3);
  await page.evaluate(() => G.modal.buttons.find(b => b.label === 'Zamknij').action());
  assert.equal(await page.evaluate(() => G.modal), null);
});
