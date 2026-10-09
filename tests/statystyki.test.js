// Statystyki: wykres potęgi (historia co tydzień), liczniki zdarzeń (bitwy, potwory, miasta), osiągnięcia zapisywane na stałe,
// okno statystyk z końca gry i z Kroniki tawerny. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('historia: stan na start i co tydzień dla każdego gracza; zapis gry ją zachowuje', async () => {
  await newGame(page, { mapSize: 'M', opponents: 2 }, 5);
  const r = await page.evaluate(() => { const st = G.state, h0 = st.hist.length; for (let d = 0; d < 14; d++) { G.screens.adventure.doEndTurn(); if (G.modal) G.modal = null; }
    const d = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { h0, h: st.hist.length, cols: st.hist[0].v[0].length, players: st.hist[0].v.length, days: st.hist.map(s => s.d), saved: d.hist.length, tally: !!d.tally }; });
  assert.equal(r.h0, 1); assert.equal(r.h, 3, `wpisy: ${r.days}`); assert.equal(r.cols, 5); assert.equal(r.players, 3); assert.deepEqual(r.days, [1, 8, 15]);
  assert.equal(r.saved, 3); assert.ok(r.tally);
});

test('liczniki: wygrana z potworem, zdobyte i stracone miasto, Graal', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 5);
  const r = await page.evaluate(() => { const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster' && !o.dead);
    h.army = [{ cid: 'dawnbringer', n: 30 }, null, null, null, null, null, null]; m.count = 2; const B = createBattle(st, h, m); simulateBattle(B); resolveBattle(B);
    const t = st.towns.find(t => t.owner === 1); captureTown(st, t, ME);
    return { me: tallyOf(st, ME), foe: tallyOf(st, 1), over: B.over }; });
  assert.equal(r.over, 'win'); assert.equal(r.me.won, 1); assert.equal(r.me.monsters, 1); assert.equal(r.me.towns, 1); assert.equal(r.foe.townsLost, 1);
});

test('osiągnięcia: zdobyte trafiają na stałe (nowe tylko raz); wygrana na dużej mapie i z sojusznikiem', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 5);
  const r = await page.evaluate(() => { localStorage.removeItem('kk_ach'); const st = G.state, T = tallyOf(st, ME); T.won = 1; T.peakGold = 60000; T.monsters = 30;
    const a = earnAchievements(st, ME), b = earnAchievements(st, ME), c = earnAchievements(st, ME, 'win'); const saved = Object.keys(loadAch());
    return { a, b, c, saved, n: ACHIEVEMENTS.length }; });
  assert.deepEqual(r.a.got.sort(), ['firstBlood', 'slayer', 'treasury']); assert.deepEqual(r.a.fresh.sort(), ['firstBlood', 'slayer', 'treasury']);
  assert.deepEqual(r.b.fresh, [], 'drugi raz nic nowego'); assert.ok(r.c.got.includes('unbroken') && r.c.got.includes('blitz'));
  assert.ok(r.saved.length >= 5); assert.ok(r.n >= 12);
});

test('okno statystyk: zakładki wykresu i osiągnięcia; koniec gry i Kronika tawerny mają do niego przycisk', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 5);
  const r = await page.evaluate(async () => { const wait = n => new Promise(res => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    const st = G.state; showStats(st, ME); await wait(3); const tabs = G.modal.buttons.filter(b => b.label).map(b => b.label); G.modal.buttons[2].action(); await wait(3);
    const tips = G.modal.buttons.filter(b => b.tip).length; G.modal = null; showChronicle(st); const chron = G.modal.buttons.map(b => b.label); G.modal = null;
    for (const p of st.players.filter(p => !p.human)) eliminate(st, p); G.screens.adventure.checkGameEnd(st); await wait(3);
    const end = G.modal && G.modal.buttons.map(b => b.label); G.modal.buttons.find(b => b.label === 'Statystyki').action(); await wait(3); const stats = G.modal.msg; G.modal.buttons.find(b => b.label === 'Zamknij').action(); await wait(2);
    return { tabs, tips, chron, end, stats, back: !!(G.modal && G.modal.gameEnd) }; });
  assert.deepEqual(r.tabs, ['Siła armii', 'Złoto', 'Miasta', 'Poziom bohatera', 'Kopalnie', 'Zamknij']); assert.ok(r.tips >= 14);
  assert.ok(r.chron.includes('Wykres potęgi')); assert.ok(r.end.includes('Statystyki'), String(r.end)); assert.equal(r.stats, 'Statystyki'); assert.equal(r.back, true, 'po zamknięciu wraca ekran końca gry');
});
