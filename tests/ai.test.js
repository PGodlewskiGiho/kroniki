// Przeciwnicy komputerowi i koniec gry (krok 15). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Kolejne dni bez okien (wieści zbieramy do tablicy)
const days = (n) => page.evaluate(n => {
  const st = G.state, news = [];
  for (let d = 0; d < n; d++) { G.screens.adventure.doEndTurn(); if (G.modal) { news.push(G.modal.msg); G.modal = null; } }
  return news;
}, n);
const invariants = () => page.evaluate(() => {
  const st = G.state, bad = [];
  for (const p of st.players) for (const r of RESOURCES) if (!(p.resources[r.id] >= 0)) bad.push(`gracz ${p.id}: ${r.id} ${p.resources[r.id]}`);
  for (const h of st.heroes) { if (st.map.terrain[h.y * st.map.n + h.x] === TER.WATER) bad.push(`${h.name} na wodzie`); for (const s of armyStacks(h.army)) if (!(s.n > 0)) bad.push(`${h.name}: ${JSON.stringify(s)}`); }
  const spots = st.heroes.map(h => h.x + ',' + h.y); if (new Set(spots).size !== spots.length) bad.push('dwóch bohaterów na jednym polu');
  for (const t of st.towns) for (const s of armyStacks(t.garrison)) if (!(s.n > 0)) bad.push(`${t.name}: ${JSON.stringify(s)}`);
  return bad;
});

test('nowa gra z rywalami: miasta w miejscach startowych, bohaterowie, różne kolory', async () => {
  const r = await page.evaluate(() => ['S', 'M', 'L'].map(ms => [1, 2, 3].map(k => {
    const st = createNewGame(Object.assign({}, G.settings, { mapSize: ms, opponents: k, color: 'green' }), 77), foes = st.players.filter(p => !p.human);
    return { ms, k, foes: foes.length, sites: st.map.sites.length, towns: st.towns.length, neutral: st.towns.filter(t => t.owner < 0).length,
      farthest: st.towns.find(t => t.owner === 1).x === st.map.sites[1].x && st.towns.find(t => t.owner === 1).y === st.map.sites[1].y,
      heroes: foes.every(p => st.heroes.filter(h => h.owner === p.id).length === 1 && st.heroes.some(h => h.owner === p.id && st.towns.some(t => t.owner === p.id && t.x === h.x && t.y === h.y))),
      colors: new Set(st.players.map(p => p.color)).size === st.players.length };
  })).flat());
  for (const g of r) {
    assert.equal(g.foes, Math.min(g.k, g.sites - 1), `${g.ms}/${g.k}`);
    assert.equal(g.towns, g.sites);
    assert.equal(g.neutral, g.sites - 1 - g.foes);
    assert.ok(g.farthest, 'pierwszy rywal w najdalszym miejscu');
    assert.ok(g.heroes, 'każdy rywal ma bohatera w swoim mieście');
    assert.ok(g.colors, 'kolory graczy są różne');
  }
});

test('SI rozwija się: buduje, werbuje, zbiera kopalnie i wydaje złoto', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 3);
  const before = await page.evaluate(() => ({ built: G.state.towns.find(t => t.owner === 1).built.length }));
  await days(20);
  const r = await page.evaluate(() => {
    const st = G.state, p = st.players[1], towns = st.towns.filter(t => t.owner === 1);
    return { built: Math.max(...towns.map(t => t.built.length)), mines: st.objects.filter(o => o.type === 'mine' && o.owner === 1).length,
      power: Math.max(0, ...st.heroes.filter(h => h.owner === 1).map(h => armyStrength(h))), gold: p.resources.gold, towns: towns.length };
  });
  assert.ok(r.built >= before.built + 8, `budowli: ${r.built}`);
  assert.ok(r.mines >= 2, `kopalń: ${r.mines}`);
  assert.ok(r.power > 4000, `siła bohatera SI: ${r.power}`);
  assert.ok(r.gold < 20000, `SI trzyma za dużo złota: ${r.gold}`);
  assert.deepEqual(await invariants(), []);
});

test('rozejm: na poziomie Normalnym SI nie atakuje przez 14 dni, potem tak', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1, difficulty: 1 }, 9);
  await page.evaluate(() => {
    const st = G.state, me = hero(st), foe = st.heroes.find(h => h.owner === 1);
    me.army = emptyArmy(); me.army[0] = { cid: 'pikeman', n: 1 }; // słaby bohater w mieście gracza
    foe.army = emptyArmy(); foe.army[0] = { cid: 'dawnbringer', n: 30 }; foe.army[1] = { cid: 'champion', n: 60 };
  });
  const early = await days(14);
  const mid = await page.evaluate(() => ({ owner: G.state.towns[0].owner, alive: !!hero(G.state) }));
  assert.deepEqual(mid, { owner: 0, alive: true });
  assert.ok(!early.some(n => /atakuje/.test(n)));
  const late = await days(20);
  assert.ok(late.some(n => /atakuje: miasto .*Miasto przepadło/.test(n)), late.join(' | '));
  assert.equal(await page.evaluate(() => G.state.towns[0].owner), 1);
});

test('próbna walka SI przewiduje prawdziwy wynik', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 12);
  const r = await page.evaluate(() => {
    const st = G.state, foe = st.heroes.find(h => h.owner === 1), out = [];
    for (const m of st.objects.filter(o => o.type === 'monster').slice(0, 12)) {
      const predicted = simulateBattle(createBattle(st, foe, m)).over, snap = JSON.stringify(foe.army);
      const real = resolveBattle(simulateBattle(createBattle(st, foe, m)), false).outcome;
      out.push(predicted === real); foe.army = JSON.parse(snap); m.dead = false; m.count = Math.max(1, m.count); rebuildObjIndex(st);
      foe.x = st.towns.find(t => t.owner === 1).x; foe.y = st.towns.find(t => t.owner === 1).y;
    }
    return out;
  });
  assert.ok(r.length >= 10);
  assert.ok(r.every(Boolean));
});

test('zwycięstwo: po pokonaniu rywali okno końca gry i wpis w wynikach', async () => {
  await newGame(page, { mapSize: 'S', opponents: 2 }, 5);
  await page.evaluate(() => { try { localStorage.removeItem('kk_scores'); } catch (e) {} });
  await page.evaluate(() => {
    const st = G.state; for (const t of st.towns.filter(t => t.owner > 0)) captureTown(st, t, ME);
    for (const h of st.heroes.filter(h => h.owner !== ME)) removeHero(st, h);
    G.screens.adventure.update(0.016);
  });
  const d = await dialog(page);
  assert.match(d.msg, /Zwycięstwo! Wszyscy przeciwnicy/);
  assert.deepEqual(d.labels, ['Menu główne', 'Wyniki']);
  const scores = await page.evaluate(() => loadScores());
  assert.equal(scores.length, 1);
  assert.ok(scores[0].score > 0);
  await pressDialog(page, 'Wyniki');
  await page.waitForFunction(() => G.screenName === 'scores');
  await frames(page, 5);
});

test('porażka: bez miast i bohaterów gra się kończy', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1 }, 5);
  await page.evaluate(() => { const st = G.state; captureTown(st, st.towns[0], 1); removeHero(st, hero(st)); G.screens.adventure.update(0.016); });
  assert.match((await dialog(page)).msg, /Porażka/);
  await frames(page, 5);
});

test('7 dni bez miasta: ostrzeżenia, potem porażka', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1, difficulty: 0 }, 5);
  await page.evaluate(() => { const st = G.state; captureTown(st, st.towns[0], 1); const h = hero(st); h.x = st.towns[0].x; h.y = st.towns[0].y + 2; });
  const news = await days(6);
  assert.equal(news.filter(n => /Nie masz żadnego miasta/.test(n)).length, 6);
  assert.match(news[0], /w ciągu 7 dni/);
  assert.equal(await page.evaluate(() => gameResult(G.state)), null);
  await days(1);
  assert.equal(await page.evaluate(() => gameResult(G.state)), 'lose');
});

test('gracz bez bohatera: mapa działa, można nająć nowego', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1 }, 5);
  await page.evaluate(() => { const st = G.state; removeHero(st, hero(st)); G.screens.adventure.enter({}); });
  await frames(page, 5);
  const r = await page.evaluate(() => {
    const st = G.state, scr = G.screens.adventure; scr.tileClick(3, 3); scr.onKey('h'); scr.onKey(' '); scr.nextHero(); scr.toggleSleep(); scr.startMove(); scr.spellbook();
    const info = panelInfoText(st, scr).text; st.towns[0].built.push('tavern'); human(st).resources.gold = 10000;
    const hired = hireHero(st, st.towns[0], 0); return { info, hired: !!hired.hero, sel: hero(st) === hired.hero, over: gameResult(st) };
  });
  assert.match(r.info, /Nie masz bohatera/);
  assert.ok(r.hired);
  assert.ok(r.sel);
  assert.equal(r.over, null);
  await frames(page, 5);
});

test('ekran nowej gry: wybór liczby rywali', async () => {
  await page.evaluate(() => setScreen('setup', {}));
  await frames(page, 3);
  const r = await page.evaluate(() => { const b = G.screens.setup.buttons.find(b => b.label === '3'); b.action(); return G.settings.opponents; });
  assert.equal(r, 3);
  await frames(page, 3);
  await page.evaluate(() => { G.settings.opponents = 1; });
});

test('zapis i odczyt z przeciwnikami', async () => {
  await newGame(page, { mapSize: 'M', opponents: 2 }, 3);
  await days(10);
  const r = await page.evaluate(() => {
    const st = G.state, json = JSON.stringify(serializeGame(st)), back = deserializeGame(JSON.parse(json));
    return { same: JSON.stringify(serializeGame(back)) === json, players: back.players.length, aiHeroes: back.heroes.filter(h => h.owner > 0).length };
  });
  assert.ok(r.same);
  assert.equal(r.players, 3);
  assert.ok(r.aiHeroes >= 1);
});

test('olbrzymia mapa z trzema rywalami: 40 dni w rozsądnym czasie, stan spójny', async () => {
  await newGame(page, { mapSize: 'XL', opponents: 3 }, 17);
  const t0 = Date.now(); await days(40); const ms = Date.now() - t0;
  assert.ok(ms < 20000, `40 dni trwało ${ms} ms`);
  assert.deepEqual(await invariants(), []);
});
