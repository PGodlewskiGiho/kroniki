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

test('ekran nowej gry: liczba graczy dopasowana do mapy (mała 2, średnia 4, duża 6, olbrzymia i większe 8); nadmiar wyłącza się, przepełnienie to ostrzeżenie', async () => {
  const saved = await page.evaluate(() => JSON.stringify(G.settings));
  await page.evaluate(sl => { G.settings.slots = sl; G.settings.mapSize = 'S'; setScreen('setup', {}); }, slots('hhhhha'));
  await frames(page, 3);
  const r = await page.evaluate(() => { const S = G.settings, act = () => S.slots.filter(o => o.type !== 'off').length, a0 = act(), humans = S.slots.filter(o => o.type === 'human').length;
    const off = S.slots.findIndex(o => o.type === 'off'); G.screens.setup.nextType(off); const a1 = act();
    const caps = MAP_SIZES.map(m => { S.mapSize = m.id; return setupCap(S); }); S.mapSize = 'S'; S.slots[off].type = 'ai'; G.screens.setup.bStart.action(); return { a0, humans, a1, caps }; });
  assert.deepEqual(r.caps, [2, 4, 6, 8, 8, 8]); assert.equal(r.a0, 2, 'nadmiarowe miejsca wyłączone'); assert.equal(r.humans, 2, 'najpierw odpada komputer'); assert.equal(r.a1, 2, 'pełna mapa: nie da się włączyć miejsca');
  const d = await dialog(page);
  assert.ok(d && /najwyżej 2 graczy/.test(d.msg), d && d.msg);
  await page.evaluate(() => { G.modal = null; });
  await page.evaluate(s => { Object.assign(G.settings, JSON.parse(s)); }, saved);
});

test('ekran nowej gry: wybór bohatera startowego z puli frakcji; zmiana frakcji wraca do losowego; gra startuje wybranym', async () => {
  const saved = await page.evaluate(() => JSON.stringify(G.settings));
  await page.evaluate(sl => { G.settings.slots = sl; G.settings.mapSize = 'M'; setScreen('setup', {}); }, slots('ha'));
  await frames(page, 3);
  const r = await page.evaluate(() => { const S = G.settings, b = G.screens.setup.slotBtns[0]; S.slots[0].faction = 'sylvan'; S.slots[0].hero = 'random';
    b.he.action(); b.he.action(); const pick = S.slots[0].hero, tip = b.he.tip; const st = createNewGame(Object.assign({}, S), 7), h = st.heroes.find(x => x.owner === 0);
    b.fa.action(); const after = S.slots[0].hero; S.slots[1].faction = 'random'; const aiDisabled = (G.screens.setup.draw(G.ctx || document.querySelector('canvas').getContext('2d')), G.screens.setup.slotBtns[1].he.disabled);
    return { pick, expected: factionOf('sylvan').heroes[1][0], hero: h.name, cls: h.cls, tip, after, aiDisabled }; });
  assert.equal(r.pick, r.expected); assert.equal(r.hero, r.pick, 'gra zaczyna się wybranym bohaterem'); assert.ok(/specjalność/.test(r.tip), r.tip);
  assert.equal(r.after, 'random'); assert.equal(r.aiDisabled, true, 'losowa frakcja: bohater losowy');
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
  // podpis przycisku odświeża się przy rysowaniu: czekamy na klatkę z nowym imieniem (na wolnym serwerze CI może to potrwać)
  await page.waitForFunction(() => G.screens.setup.slotBtns[1].nm.label === 'Ania', null, { timeout: 3000 }).catch(() => {});
  const r = await page.evaluate(() => {
    const st = createNewGame(Object.assign({}, G.settings), 5);
    return { name: G.settings.slots[1].name, input: !!document.querySelector('input'), modal: !!G.modal, p1: playerName(st, 1), p0: playerName(st, 0), label: G.screens.setup.slotBtns[1].nm.label };
  });
  await frames(page, 2);
  assert.deepEqual(r, { name: 'Ania', input: false, modal: false, p1: 'Ania', p0: 'gracz czerwony', label: 'Ania' });
  await page.evaluate(() => G.screens.setup.slotBtns[1].nm.action());
  await page.waitForFunction(() => { const inp = document.querySelector('input'); return !!inp && document.activeElement === inp; }, null, { timeout: 3000 }); // na wolnym serwerze CI pole dostaje fokus z opóźnieniem
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('input') && !G.modal, null, { timeout: 3000 }).catch(() => {});
  assert.equal(await page.evaluate(() => !!document.querySelector('input') || !!G.modal), false, 'Esc zamyka okno i pole');
  await page.evaluate(s => { Object.assign(G.settings, JSON.parse(s)); }, saved);
});

test('gra korespondencyjna: zasłona tury ma „Wyślij plikiem”, plik wczytany u drugiego gracza zaczyna jego turę', async () => {
  await newGame(page, { mapSize: 'S', slots: slots('hh') }, 23);
  await page.evaluate(() => { G.modal = null; const A = G.screens.adventure; A.doEndTurn({ live: true }); });
  await page.waitForFunction(() => G.modal && G.modal.buttons.some(b => b.label === 'Wyślij plikiem'), null, { timeout: 20000 });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => G.modal.buttons.find(b => b.label === 'Wyślij plikiem').action())]);
  const file = require('path').join(require('os').tmpdir(), 'kk-korespondencja.json'); await dl.saveAs(file);
  const who = await page.evaluate(() => ME);
  await page.evaluate(() => { G.modal = null; G.go('load', { mode: 'load' }); });
  await page.waitForFunction(() => G.screenName === 'load');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.evaluate(() => { G.screen.fromFile(); })]);
  await fc.setFiles(file);
  await page.waitForFunction(() => G.screenName === 'adventure' && G.modal && /Tura:/.test(G.modal.msg), null, { timeout: 10000 });
  assert.equal(await page.evaluate(() => ME), who);
  require('fs').unlinkSync(file);
});

test('ekran nowej gry: widać tylko zajęte miejsca; „Dodaj gracza” do limitu mapy, usuwanie i przełączanie człowiek/komputer (zawsze jeden człowiek)', async () => {
  const saved = await page.evaluate(() => JSON.stringify(G.settings));
  await page.evaluate(sl => { G.settings.slots = sl; G.settings.mapSize = 'M'; setScreen('setup', {}); }, slots('ha'));
  await frames(page, 3);
  const r = await page.evaluate(() => { const s = G.screens.setup, S = G.settings, vis = () => s.buttons.filter(b => s.slotBtns.some(q => q.nm === b)).length, out = {};
    out.v0 = vis(); s.bAdd.action(); s.bAdd.action(); out.v1 = vis(); s.relayout(); out.addShown = s.buttons.includes(s.bAdd);
    s.slotBtns[3].rm.action(); out.v2 = vis(); s.slotBtns[0].ty.action(); out.onlyHuman = S.slots[0].type; s.slotBtns[1].ty.action(); s.slotBtns[0].ty.action(); out.swapped = [S.slots[0].type, S.slots[1].type];
    s.slotBtns[1].rm.action(); out.keepLast = S.slots[1].type; return out; });
  assert.equal(r.v0, 2); assert.equal(r.v1, 4); assert.equal(r.addShown, false, 'średnia mapa: 4 graczy, przycisk znika');
  assert.equal(r.v2, 3); assert.equal(r.onlyHuman, 'human', 'jedynego człowieka nie da się zmienić w komputer'); assert.deepEqual(r.swapped, ['ai', 'human']);
  assert.equal(r.keepLast, 'human', 'jedynego człowieka nie da się usunąć');
  await page.evaluate(s => { Object.assign(G.settings, JSON.parse(s)); }, saved);
});
