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
    const st = createNewGame(Object.assign({}, G.settings, { slots: null,  mapSize: ms, opponents: k, color: 'green', slots: null }), 77), foes = st.players.filter(p => !p.human);
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
  assert.ok(r.gold < 25000, `SI trzyma za dużo złota: ${r.gold}`); // łup ze skarbca potrafi dołożyć kilka tysięcy naraz
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
  await page.evaluate(() => { const st = G.state, h = hero(st); h.x = st.towns[0].x; h.y = st.towns[0].y + 2; captureTown(st, st.towns[0], 1); });
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

test('ekran nowej gry: miejsca graczy (człowiek, komputer, wolne)', async () => {
  const saved = await page.evaluate(() => JSON.stringify(G.settings.slots));
  await page.evaluate(() => setScreen('setup', {}));
  await frames(page, 3);
  const r = await page.evaluate(() => {
    const scr = G.screens.setup, S = G.settings; S.slots = legacySlots({ color: 'red', faction: 'haven', opponents: 1 });
    scr.slotBtns[2].ty.action(); scr.slotBtns[2].ty.action(); scr.slotBtns[2].ty.action(); // wolne -> człowiek -> komputer -> wolne
    const cyc = S.slots[2].type; scr.slotBtns[2].ty.action(); scr.slotBtns[0].ty.action(); // 2 = człowiek, 0 = komputer
    const types = S.slots.map(o => o.type).join(','); scr.slotBtns[1].sw.action();
    const colors = new Set(S.slots.map(o => o.color)).size;
    scr.slotBtns[1].ty.action(); scr.slotBtns[1].ty.action(); scr.slotBtns[1].ty.action(); // komputer -> wolne -> człowiek -> komputer
    const lone = S.slots.map(o => o.type).filter(t => t === 'human').length;
    S.slots[2].type = 'ai'; scr.slotBtns[0].ty.action(); scr.slotBtns[0].ty.action(); // ostatni człowiek nie znika
    return { cyc, types, colors, lone, humans: S.slots.filter(o => o.type === 'human').length };
  });
  assert.equal(r.cyc, 'off');
  assert.equal(r.types, 'ai,ai,human,off,off,off,off,off');
  assert.equal(r.colors, 8);
  assert.equal(r.lone, 1);
  assert.ok(r.humans >= 1);
  await frames(page, 3);
  await page.evaluate(s => { G.settings.slots = JSON.parse(s); G.settings.opponents = 1; }, saved);
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

test('SI nie krąży po garnizony, których nie zmieści: liczy tylko jednostki, które naprawdę zabierze', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1 }, 9);
  const r = await page.evaluate(() => {
    const full = emptyArmy(); ['pikeman', 'archer', 'griffin', 'swordsman', 'monk', 'cavalier', 'dawnbringer'].forEach((cid, i) => { full[i] = { cid, n: 5 }; });
    const gar = emptyArmy(); gar[0] = { cid: 'archer', n: 4 }; gar[1] = { cid: 'imp', n: 9 };
    const part = emptyArmy(); part[0] = { cid: 'pikeman', n: 3 };
    return { full: takeableArmy(gar, full).map(x => x && x.cid), part: takeableArmy(gar, part).map(x => x && x.cid) };
  });
  assert.deepEqual(r.full.filter(Boolean), ['archer'], 'pełna armia: tylko ten sam rodzaj');
  assert.deepEqual(r.part.filter(Boolean), ['archer', 'imp'], 'wolne miejsca: wszystko');
});

test('SI jak zawodowiec: główny bohater i pomocnicy do limitu, pomocnik oddaje armię i artefakty (zostawia 1 jednostkę)', async () => {
  await newGame(page, { mapSize: 'L', opponents: 1, rules: { heroes: 5, truce: 28, monsters: 1, treasure: 1, reveal: false } }, 21);
  await days(21);
  const r = await page.evaluate(() => {
    const st = G.state, p = st.players[1], hs = st.heroes.filter(h => h.owner === 1), m = aiMain(st, p);
    return { n: hs.length, main: m && m.id, mainIsBest: hs.every(h => aiHeroScore(h) <= aiHeroScore(m) * 2), maxH: aiMaxHeroes(st) };
  });
  assert.equal(r.maxH, 5);
  assert.ok(r.n >= 3 && r.n <= 5, `bohaterów SI: ${r.n}`);
  assert.ok(r.mainIsBest, 'główny bohater jest najsilniejszy');
  const f = await page.evaluate(() => {
    const st = G.state, a = createHero(st, 1, 2, 2), b = createHero(st, 1, 3, 2);
    a.army = emptyArmy(); a.army[0] = { cid: 'pikeman', n: 10 }; a.army[1] = { cid: 'griffin', n: 4 };
    b.army = emptyArmy(); b.army[0] = { cid: 'pikeman', n: 1 };
    const art = Object.keys(ARTIFACTS).find(id => !ARTIFACTS[id].parts && ARTIFACTS[id].kind); giveArtifact(a, art);
    const gain = aiFeed(st, a, b);
    const res = { gain, left: armyStacks(a.army).map(s => [s.cid, s.n]), got: armyStacks(b.army).map(s => [s.cid, s.n]).sort(), art: Object.values(b.equip).includes(art) || b.bag.includes(art), artLeft: Object.values(a.equip).some(Boolean) };
    removeHero(st, a); removeHero(st, b); return res;
  });
  assert.deepEqual(f.left, [['pikeman', 1]], 'pomocnik zostawia sobie 1 najsłabszą jednostkę');
  assert.deepEqual(f.got, [['griffin', 4], ['pikeman', 10]]);
  assert.ok(f.gain > 0 && f.art && !f.artLeft);
});

test('SI omija pola, do których w jeden dzień dojdzie silniejszy wróg; limit 1 = bez pomocników', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 4);
  const r = await page.evaluate(() => {
    const st = G.state, ai = st.heroes.find(h => h.owner === 1), me = st.heroes.find(h => h.owner === 0), n = st.map.n;
    ai.army = emptyArmy(); ai.army[0] = { cid: 'pikeman', n: 1 };
    me.army = emptyArmy(); me.army[0] = { cid: 'griffin', n: 30 };
    playerOf(st, 1).explored.fill(1);
    const D = aiDanger(st, ai), near = D[me.y * n + me.x + 2], far = D[0];
    const weakMe = (me.army[0].n = 1, ai.army[0].n = 50, aiDanger(st, ai)[me.y * n + me.x + 1]);
    return { near, far, weakMe };
  });
  assert.equal(r.near, 1); assert.equal(r.far, 0); assert.equal(r.weakMe, 0, 'słabszy wróg nie jest zagrożeniem');
  await newGame(page, { mapSize: 'L', opponents: 1, rules: { heroes: 1 } }, 21);
  await days(14);
  assert.equal(await page.evaluate(() => G.state.heroes.filter(h => h.owner === 1).length <= 1), true);
});

test('komputer przejmuje neutralną kopalnię: gracz nie dostaje o tym wiadomości, a za swoją kopalnię dostaje', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1 }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, me = st.players.find(p => p.human), ai = st.players.find(p => !p.human), h = st.heroes.find(x => x.owner === ai.id);
    const mine = st.objects.find(o => o.type === 'mine'); me.inbox = [];
    mine.owner = -1; const i = mine.y * st.map.n + mine.x; h.x = mine.x; h.y = mine.y; st.guard[i] = 0; [...aiVisit(st, h, i, [])]; const neutral = takeInbox(me).length, took = mine.owner === ai.id;
    mine.owner = me.id; [...aiVisit(st, h, i, [])]; const mineMsg = takeInbox(me).length;
    return { neutral, took, mineMsg };
  });
  assert.equal(r.took, true); assert.equal(r.neutral, 0); assert.equal(r.mineMsg, 1);
});
