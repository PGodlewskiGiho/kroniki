// Hot-seat: kilku ludzi na zmianę przy jednym ekranie, do 8 graczy, osobna mgła wojny. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Miejsca graczy: napis z liter h (człowiek), a (komputer), - (wolne)
const slots = code => [...code.padEnd(8, '-')].map((c, i) => ({ type: c === 'h' ? 'human' : c === 'a' ? 'ai' : 'off', color: ['red', 'blue', 'green', 'purple', 'orange', 'teal', 'pink', 'tan'][i], faction: 'random' }));

test('do 8 graczy na dużej mapie: każdy ma miasto, bohatera i swój kolor', async () => {
  const r = await page.evaluate(sl => ['L', 'XL'].map(ms => {
    const st = createNewGame(Object.assign({}, G.settings, { mapSize: ms, slots: sl }), 31);
    return { ms, n: st.players.length, humans: st.players.filter(p => p.human).length, colors: new Set(st.players.map(p => p.color)).size,
      towns: st.players.every(p => st.towns.filter(t => t.owner === p.id).length === 1), heroes: st.players.every(p => st.heroes.some(h => h.owner === p.id)),
      bonus: st.players.filter(p => p.human).every(p => p.bonusText) };
  }), slots('hhaaahaa'));
  for (const g of r) assert.deepEqual(g, { ms: g.ms, n: 8, humans: 3, colors: 8, towns: true, heroes: true, bonus: true });
});

test('koniec tury przekazuje grę następnemu człowiekowi; dzień mija raz na kolejkę', async () => {
  await newGame(page, { mapSize: 'M', slots: slots('hah') }, 21);
  const r = await page.evaluate(() => {
    const st = G.state, A = G.screens.adventure, out = { start: ME, day0: st.dayTotal };
    st.players[2].explored.fill(0); human(st).explored.fill(1);
    A.doEndTurn(); G.modal = null;
    const t0 = st.towns.find(t => t.owner === 0);
    out.afterFirst = ME; out.day1 = st.dayTotal; out.hidden = human(st) === st.players[2] && !human(st).explored[t0.y * st.map.n + t0.x];
    out.hero = hero(st).owner;
    A.doEndTurn(); G.modal = null;
    out.back = ME; out.day2 = st.dayTotal;
    return out;
  });
  assert.equal(r.start, 0);
  assert.equal(r.afterFirst, 2, 'po graczu 0 (komputer 1 gra od razu) kolej człowieka 2');
  assert.equal(r.day1, r.day0, 'dzień jeszcze nie minął');
  assert.ok(r.hidden, 'gracz 2 nie widzi terenu odkrytego przez gracza 0');
  assert.equal(r.hero, 2);
  assert.equal(r.back, 0);
  assert.equal(r.day2, r.day0 + 1);
});

test('zasłona między turami ukrywa mapę, dopóki gracz nie kliknie', async () => {
  await newGame(page, { mapSize: 'S', slots: slots('hh') }, 5);
  await page.evaluate(() => { G.screens.adventure.doEndTurn({ live: true }); });
  for (let i = 0; i < 40 && await page.evaluate(() => !!G.screens.adventure.aiRun); i++) await frames(page, 2);
  const d = await dialog(page);
  assert.ok(d && /^Tura: Gracz niebieski/.test(d.msg), d && d.msg);
  assert.equal(await page.evaluate(() => G.screens.adventure.curtain), 1);
  await frames(page, 3);
  await pressDialog(page, 'Zaczynam');
  const w = await dialog(page);
  assert.ok(w && /Rozpoczyna się twoja kronika/.test(w.msg), 'powitanie drugiego gracza w jego pierwszej turze');
  assert.equal(await page.evaluate(() => G.screens.adventure.curtain), null);
  await pressDialog(page, 'Do dzieła');
});

test('wieści trafiają do skrzynki właściwego gracza', async () => {
  await newGame(page, { mapSize: 'S', slots: slots('hh') }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, A = G.screens.adventure; st.players[1].welcomed = true;
    tell(st, 1, 'Wieść dla niebieskiego.'); tell(st, -1, 'Wieść dla wszystkich.');
    A.doEndTurn(); const m1 = G.modal && G.modal.msg; G.modal = null;
    return { m1, inbox0: st.players[0].inbox };
  });
  assert.equal(r.m1, 'Wieść dla niebieskiego. Wieść dla wszystkich.');
  assert.deepEqual(r.inbox0, ['Wieść dla wszystkich.']);
});

test('bitwa dwóch ludzi: obie strony dowodzone ręcznie, przegrany odpada, zostaje zwycięzca', async () => {
  await newGame(page, { mapSize: 'S', slots: slots('hh') }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, a = st.heroes.find(h => h.owner === 0), b = st.heroes.find(h => h.owner === 1), B = createBattle(st, a, b);
    const sides = [humanSide(B, 0), humanSide(B, 1)];
    for (const t of st.towns.filter(t => t.owner === 1)) captureTown(st, t, 0);
    removeHero(st, b);
    return { sides, res: gameResult(st), winner: st.winner };
  });
  assert.deepEqual(r.sides, [true, true]);
  assert.equal(r.res, 'win'); assert.equal(r.winner, 0);
  await page.evaluate(() => { G.state.over = null; G.modal = null; G.screens.adventure.checkGameEnd(G.state); });
  const d = await dialog(page);
  assert.ok(/Gracz czerwony/.test(d.msg), d.msg);
  await page.evaluate(() => { G.modal = null; });
});

test('zapis i odczyt pamięta, czyja jest tura', async () => {
  await newGame(page, { mapSize: 'S', slots: slots('ahh') }, 7);
  const r = await page.evaluate(() => {
    const st = G.state, first = ME; G.screens.adventure.doEndTurn(); G.modal = null;
    const now = ME, back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { first, now, cur: back.cur, me: ME, welcomed: back.players.filter(p => p.human).map(p => !!p.welcomed) };
  });
  assert.equal(r.first, 1, 'pierwszy człowiek na liście zaczyna');
  assert.equal(r.now, 2); assert.equal(r.cur, 2); assert.equal(r.me, 2);
  assert.deepEqual(r.welcomed, [true, true]);
});

test('ekran nowej gry: za dużo graczy na małej mapie to ostrzeżenie zamiast startu', async () => {
  const saved = await page.evaluate(() => JSON.stringify(G.settings));
  await page.evaluate(sl => { G.settings.slots = sl; G.settings.mapSize = 'S'; setScreen('setup', {}); }, slots('hhhhha'));
  await frames(page, 3);
  await page.evaluate(() => G.screens.setup.bStart.action());
  const d = await dialog(page);
  assert.ok(d && /najwyżej 4 graczy/.test(d.msg), d && d.msg);
  await page.evaluate(() => { G.modal = null; });
  await page.evaluate(s => { Object.assign(G.settings, JSON.parse(s)); }, saved);
});

test('imiona graczy: wpisane na ekranie nowej gry zastępują „gracz <kolor>” w turach i wieściach', async () => {
  const saved = await page.evaluate(() => JSON.stringify(G.settings));
  await page.evaluate(sl => { G.settings.slots = sl; G.settings.mapSize = 'S'; setScreen('setup', {}); }, slots('hh'));
  await frames(page, 3);
  await page.evaluate(() => G.screens.setup.slotBtns[1].nm.action());
  await frames(page, 2);
  const typed = await page.evaluate(() => { const inp = document.querySelector('input'); return !!inp && document.activeElement === inp; });
  assert.ok(typed, 'pole tekstowe ma fokus');
  await page.keyboard.type('Ania');
  await page.keyboard.press('Enter');
  const r = await page.evaluate(() => {
    const st = createNewGame(Object.assign({}, G.settings), 5);
    return { name: G.settings.slots[1].name, input: !!document.querySelector('input'), modal: !!G.modal, p1: playerName(st, 1), p0: playerName(st, 0), label: G.screens.setup.slotBtns[1].nm.label };
  });
  await frames(page, 2);
  assert.deepEqual(r, { name: 'Ania', input: false, modal: false, p1: 'Ania', p0: 'gracz czerwony', label: 'Ania' });
  await page.evaluate(() => G.screens.setup.slotBtns[1].nm.action());
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => !!document.querySelector('input') || !!G.modal), false, 'Esc zamyka okno i pole');
  await page.evaluate(s => { Object.assign(G.settings, JSON.parse(s)); }, saved);
});
