// Karawany: oddziały z garnizonu jadą bez bohatera do innego własnego miasta, docierają po kilku dniach,
// zawracają, gdy cel przepadł, i trafiają do zapisu gry. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Dwa własne miasta: startowe i drugie (przejęte), garnizon startowego z oddziałami
const setup = () => page.evaluate(() => {
  const st = G.state, a = st.towns.find(t => t.owner === ME), b = st.towns.find(t => t !== a); b.owner = ME;
  for (const h of st.heroes) if (h.x === a.x && h.y === a.y) h.x += 1; // bez bohatera w bramie
  a.garrison = emptyArmy(); a.garrison[0] = { cid: 'pikeman', n: 12 }; a.garrison[1] = { cid: 'archer', n: 7 };
  b.garrison = emptyArmy(); b.garrison[0] = { cid: 'pikeman', n: 3 }; st.caravans = []; return [a.id, b.id];
});

test('karawana wyrusza z garnizonu i po kilku dniach dołącza do garnizonu celu', async () => {
  await newGame(page, { mapSize: 'L' }, 3);
  const [ai, bi] = await setup();
  const r = await page.evaluate(([ai, bi]) => {
    const st = G.state, a = st.towns[ai], b = st.towns[bi], days = caravanDays(a, b);
    const err = sendCaravan(st, a, b, [0]), left = a.garrison[0], c = st.caravans[0];
    const noPick = sendCaravan(st, a, b, [5]), self = sendCaravan(st, a, a, [1]);
    let n = 0; while (st.caravans.length && n < 20) { advanceDay(st); n++; }
    return { err, left, days, n, arrive: c.arrive - c.start, got: b.garrison[0].n, noPick, self, inbox: (human(st).inbox || []).some(t => /dotarła/.test(t)) };
  }, [ai, bi]);
  assert.equal(r.err, null); assert.equal(r.left, null, 'oddział opuścił garnizon');
  assert.ok(r.days >= 1); assert.equal(r.arrive, r.days); assert.equal(r.n, r.days, 'dociera po wyliczonej liczbie dni');
  assert.equal(r.got, 15, 'pikinierzy połączeni w garnizonie celu'); assert.ok(r.inbox);
  assert.match(r.noPick, /Wybierz oddziały/); assert.match(r.self, /inne własne miasto/);
});

test('cel przepadł: karawana zawraca; karawana w zapisie gry; okno karawany w mieście', async () => {
  await newGame(page, { mapSize: 'L' }, 3);
  const [ai, bi] = await setup();
  const r = await page.evaluate(([ai, bi]) => {
    const st = G.state, a = st.towns[ai], b = st.towns[bi]; sendCaravan(st, a, b, [1]);
    const back = JSON.parse(JSON.stringify(serializeGame(st))), loaded = deserializeGame(back).caravans.length;
    b.owner = 1; const c = st.caravans[0]; st.dayTotal = c.arrive - 1; advanceDay(st); const turned = c.to === a.id && st.caravans.length === 1;
    st.dayTotal = c.arrive - 1; advanceDay(st);
    setScreen('town', { townId: a.id }); G.modal = null; const btn = G.screens.town.buttons.find(x => x.label === 'Karawana'); btn.action();
    return { loaded, turned, home: a.garrison.some(s => s && s.cid === 'archer' && s.n === 7), modal: !!(G.modal && G.modal.caravan) };
  }, [ai, bi]);
  assert.equal(r.loaded, 1); assert.ok(r.turned, 'zawraca do miasta startowego'); assert.ok(r.home, 'łucznicy wrócili'); assert.ok(r.modal);
  await frames(page, 3);
  const sent = await page.evaluate(() => { const M = G.modal, st = G.state, t = G.screens.town.town(); M.pick(0); M.choose(st.towns.find(x => x.owner === ME && x !== t) || st.towns.find(x => x !== t && (x.owner = ME, true)));
    const b = M.buttons.find(x => x.label === 'Wyślij'); M.draw(document.querySelector('canvas').getContext('2d')); b.action(); return st.caravans.length; });
  assert.equal(sent, 1);
  await page.evaluate(() => setScreen('adventure', {})); await frames(page, 3);
});
