// Tawerna i wielu bohaterów (krok 14). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Nowa gra z tawerną w mieście gracza i bohaterem wyprowadzonym przed bramę (brama wolna do najmu)
async function withTavern(seed = 41) {
  await newGame(page, { mapSize: 'M', faction: 'sylvan' }, seed);
  await page.evaluate(() => {
    const st = G.state, t = st.towns[0], h = hero(st); t.built.push('tavern'); human(st).explored.fill(1);
    h.y = t.y + 1; human(st).resources.gold = 50000;
  });
}

test('tawerna: dwóch chętnych na tydzień, pierwszy z frakcji gracza, imiona się nie powtarzają', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state, a = tavernOffer(st, ME).map(o => ({ ...o })), again = tavernOffer(st, ME).map(o => o.name);
    for (let d = 0; d < 7; d++) G.screens.adventure.doEndTurn(); G.modal = null;
    const next = tavernOffer(st, ME).map(o => o.name);
    return { a, again, next, taken: st.heroes.map(h => h.name) };
  });
  assert.equal(r.a.length, 2);
  assert.equal(r.a[0].fac, 'sylvan');
  assert.notEqual(r.a[1].fac, 'sylvan');
  assert.notEqual(r.a[0].name, r.a[1].name);
  for (const o of r.a) assert.ok(!r.taken.includes(o.name), `${o.name} już jest na mapie`);
  assert.deepEqual(r.again, r.a.map(o => o.name), 'w tym samym tygodniu ta sama oferta');
  assert.equal(r.next.length, 2);
});

test('najem: kosztuje złoto, bohater staje w bramie z armią i pełnym ruchem', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], gold0 = human(st).resources.gold, offer = tavernOffer(st, ME)[1];
    const { hero: h, error } = hireHero(st, t, 1);
    return { error, spent: gold0 - human(st).resources.gold, name: h.name, offer: offer.name, at: [h.x - t.x, h.y - t.y], owner: h.owner, army: armySize(h.army) > 0,
      fac: offer.fac, armyFac: factionOf(offer.fac).dw.dw1[1] === h.army[0].cid, mpFull: h.mp === heroMaxMP(h), count: myHeroes(st).length, left: tavernOffer(st, ME).map(o => o && o.name) };
  });
  assert.equal(r.error, undefined);
  assert.equal(r.spent, 2500);
  assert.equal(r.name, r.offer);
  assert.deepEqual(r.at, [0, 0]);
  assert.equal(r.owner, 0);
  assert.ok(r.army);
  assert.ok(r.armyFac, 'armia z frakcji bohatera');
  assert.ok(r.mpFull);
  assert.equal(r.count, 2);
  assert.notEqual(r.left[1], r.name, 'na miejsce najętego przychodzi ktoś inny');
  assert.deepEqual(await page.evaluate(() => { const ids = G.state.heroes.map(h => h.id); return new Set(ids).size === ids.length; }), true);
});

test('najem: warunki (tawerna, złoto, wolna brama, limit bohaterów)', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], R = human(st).resources, out = {};
    t.built = t.built.filter(b => b !== 'tavern'); out.noTavern = hireHero(st, t, 0).error; t.built.push('tavern');
    R.gold = 100; out.noGold = hireHero(st, t, 0).error; R.gold = 1e6;
    hireHero(st, t, 0); out.gate = hireHero(st, t, 1).error;
    // limit: wyprowadzamy kolejnych najętych przed bramę
    for (let i = 0; i < 20 && myHeroes(st).length < MAX_HEROES; i++) { const h = heroAt(st, t.x, t.y); if (h) { h.x = t.x + 1 + myHeroes(st).length; h.y = t.y + 2; } hireHero(st, t, i % 2); for (let d = 0; d < 7; d++) st.dayTotal++; }
    const h = heroAt(st, t.x, t.y); if (h) h.x = t.x - 1, h.y = t.y + 2;
    out.limit = hireHero(st, t, 0).error; out.count = myHeroes(st).length;
    return out;
  });
  assert.equal(r.noTavern, 'W mieście nie ma tawerny');
  assert.match(r.noGold, /kosztuje 2500/);
  assert.match(r.gate, /Brama miasta jest zajęta/);
  assert.equal(r.count, 8);
  assert.match(r.limit, /najwyżej 8/);
});

test('okno tawerny w mieście: najem przez kliknięcie budowli', async () => {
  await withTavern();
  await page.evaluate(() => setScreen('town', { townId: 0 }));
  await frames(page, 5);
  await page.evaluate(() => G.screens.town.showTavern());
  const d = await dialog(page);
  assert.match(d.msg, /W tawernie czekają/);
  assert.equal(d.labels.length, 3);
  await frames(page, 3);
  await pressDialog(page, d.labels[0]);
  const r = await page.evaluate(() => ({ heroes: myHeroes(G.state).length, msg: G.screens.town.msg, inTown: !!heroInTown(G.state, G.state.towns[0]) }));
  assert.equal(r.heroes, 2);
  assert.match(r.msg, /dołącza do twojej sprawy/);
  assert.ok(r.inTown);
  await frames(page, 5);
});

test('bohaterowie blokują sobie drogę, kliknięcie własnego bohatera go wybiera', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], a = hero(st), b = hireHero(st, t, 0).hero;
    b.x = a.x + 1; b.y = a.y; a.mp = b.mp = 1e6;
    const path = computePath(st, a, a.x + 2, a.y), through = !!path && path.some(([x, y]) => x === b.x && y === b.y);
    G.screens.adventure.enter({}); G.modal = null; G.screens.adventure.tileClick(b.x, b.y);
    return { through, selected: hero(st) === b, canTarget: !!computePath(st, a, b.x, b.y) };
  });
  assert.equal(r.through, false, 'ścieżka omija drugiego bohatera');
  assert.ok(r.selected);
  assert.ok(r.canTarget, 'na pole bohatera można wskazać cel');
});

test('ruch trwa, gdy w międzyczasie wybierzesz innego bohatera', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], scr = G.screens.adventure, a = hero(st), b = hireHero(st, t, 0).hero;
    scr.enter({}); G.modal = null; b.x = t.x - 1; b.y = t.y + 2;
    for (const o of st.objects) if (o.type === 'monster') o.dead = true; rebuildObjIndex(st);
    a.mp = 1e6; let goal = null;
    for (let d = 6; d > 2 && !goal; d--) for (const [dx, dy] of [[d, 0], [0, d], [-d, 0], [0, -d], [d, d]]) { const p = computePath(st, a, a.x + dx, a.y + dy); if (p && p.length >= 3) { goal = [a.x + dx, a.y + dy]; break; } }
    if (!goal) return { skip: true };
    a.path = computePath(st, a, ...goal); a.dest = goal; a.moving = true;
    scr.update(0.05); scr.selectHero(b);
    for (let i = 0; i < 400 && (a.moving || a.anim || a.pending); i++) scr.update(0.05);
    return { at: [a.x, a.y], goal, sel: hero(st) === b };
  });
  assert.ok(!r.skip);
  assert.deepEqual(r.at, r.goal);
  assert.ok(r.sel);
});

test('wejście na wrogiego bohatera zaczyna bitwę', async () => {
  await withTavern();
  await page.evaluate(() => {
    const st = G.state, n = st.map.n, a = hero(st);
    st.players.push({ id: 1, color: 'blue', human: false, faction: 'barrow', resources: { ...DIFFICULTIES[1].res }, explored: new Uint8Array(n * n) });
    for (const o of st.objects) if (o.type === 'monster') o.dead = true; rebuildObjIndex(st);
    const dirs = [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]], [dx, dy] = dirs.find(([dx, dy]) => passableTile(st, a.x + dx, a.y + dy) && !objectAt(st, (a.y + dy) * n + a.x + dx));
    const foe = createHero(st, 1, a.x + dx, a.y + dy); foe.army = emptyArmy(); foe.army[0] = { cid: 'boneWarrior', n: 3 };
    a.army[0] = { cid: 'elderTreant', n: 10 }; a.mp = 1e6; a.path = computePath(st, a, foe.x, foe.y); a.moving = true;
    G.screens.adventure.enter({}); G.modal = null;
    for (let i = 0; i < 50 && !G.modal; i++) G.screens.adventure.update(0.05);
  });
  const d = await dialog(page);
  assert.ok(d, 'okno przed bitwą');
  assert.match(d.msg, /atakuje: .*gracz niebieski/);
  await pressDialog(page, 'Automatycznie');
  assert.match((await dialog(page)).msg, /Zwycięstwo!.*znika z mapy/);
  assert.equal(await page.evaluate(() => G.state.heroes.filter(h => h.owner === 1).length), 0);
});

test('porażka przy zajętej bramie: bohater idzie do innego miasta albo odchodzi', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state, t0 = st.towns[0], a = hero(st), b = hireHero(st, t0, 0).hero; // b stoi w bramie t0
    const m = st.objects.filter(o => o.type === 'monster' && !o.dead).sort((x, y) => y.count * CREATURES[y.cid].value - x.count * CREATURES[x.cid].value)[0];
    a.army = emptyArmy(); a.army[0] = { cid: 'dryad', n: 1 };
    const res1 = resolveBattle(simulateBattle(createBattle(st, a, m)), false); // jedyne miasto zajęte → a odchodzi
    const t1 = st.towns[1]; captureTown(st, t1, ME);
    b.army = emptyArmy(); b.army[0] = { cid: 'dryad', n: 1 }; b.x = t0.x + 1; b.y = t0.y + 2;
    const c = hireHero(st, t0, 1).hero; // teraz c w bramie t0, brama t1 wolna
    const res2 = resolveBattle(simulateBattle(createBattle(st, b, m)), false);
    return { r1: [res1.outcome, !!res1.heroLost, st.heroes.includes(a)], r2: [res2.outcome, res2.home, b.x === t1.x && b.y === t1.y], c: !!c, sel: !!hero(st) && hero(st).owner === ME };
  });
  assert.deepEqual(r.r1, ['lose', true, false]);
  assert.equal(r.r2[0], 'lose');
  assert.ok(r.r2[2], 'b trafia do wolnego miasta');
  assert.ok(r.c);
  assert.ok(r.sel, 'wybrany jest któryś z bohaterów gracza');
});

test('lista w panelu przewija się i pokazuje wybranego bohatera', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], scr = G.screens.adventure;
    for (let k = 0; k < 3; k++) { const h = heroAt(st, t.x, t.y); if (h) { h.x = t.x - 2 + k; h.y = t.y + 3; } hireHero(st, t, k % 2); st.dayTotal += 7; }
    scr.enter({}); G.modal = null; const items = panelItems(st).length, last = myHeroes(st).at(-1);
    scr.selectHero(last); const visible = panelRows(st, scr.listScroll).some(r => r.hero === last), s1 = scr.listScroll;
    G.mouse.x = LIST.x + 20; G.mouse.y = LIST.y + 20; scr.onWheel(-1); scr.onWheel(-1); scr.onWheel(-1); const s2 = scr.listScroll;
    for (let k = 0; k < 10; k++) scr.onWheel(1);
    return { items, visible, s1, s2, max: scr.listScroll };
  });
  assert.ok(r.items >= 5);
  assert.ok(r.visible);
  assert.ok(r.s1 > 0);
  assert.equal(r.s2, 0);
  assert.equal(r.max, r.items - 3);
  await frames(page, 5);
});

test('zapis zachowuje wielu bohaterów i ofertę tawerny', async () => {
  await withTavern();
  const r = await page.evaluate(() => {
    const st = G.state; hireHero(st, st.towns[0], 0); const offer = tavernOffer(st, ME).map(o => o && o.name);
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { heroes: back.heroes.map(h => h.name), orig: st.heroes.map(h => h.name), offer, backOffer: tavernOffer(back, ME).map(o => o && o.name) };
  });
  assert.deepEqual(r.heroes, r.orig);
  assert.deepEqual(r.backOffer, r.offer);
});
