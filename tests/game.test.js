// Testy dymne i reguł gry. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
// Każdy test kończy się bez błędów strony (w tym błędów rysowania z pętli gry).
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Sprawdza spójność stanu gry; zwraca listę naruszeń (pusta = w porządku).
const checkInvariants = () => page.evaluate(() => {
  const st = G.state, n = st.map.n, bad = [];
  const inMap = (x, y) => x >= 0 && y >= 0 && x < n && y < n;
  for (const p of st.players) for (const r of RESOURCES) if (!(p.resources[r.id] >= 0)) bad.push(`gracz ${p.id}: ${r.id} = ${p.resources[r.id]}`);
  const checkArmy = (a, who) => {
    if (a.length !== ARMY_SLOTS) bad.push(`${who}: armia ma ${a.length} slotów`);
    for (const s of armyStacks(a)) if (!CREATURES[s.cid] || !Number.isInteger(s.n) || s.n <= 0) bad.push(`${who}: zły oddział ${JSON.stringify(s)}`);
  };
  for (const h of st.heroes) {
    if (!inMap(h.x, h.y)) bad.push(`${h.name} poza mapą`);
    else if (st.map.terrain[h.y * n + h.x] === TER.WATER) bad.push(`${h.name} na wodzie`);
    checkArmy(h.army, h.name);
    if (h.mana < 0 || h.mana > heroMaxMana(h)) bad.push(`${h.name}: mana ${h.mana}`);
  }
  for (const t of st.towns) checkArmy(t.garrison, t.name);
  for (const ob of st.objects) {
    if (ob.dead) continue;
    if (!inMap(ob.x, ob.y)) { bad.push(`obiekt ${ob.id} poza mapą`); continue; }
    const i = ob.y * n + ob.x;
    if (st.map.terrain[i] === TER.WATER) bad.push(`obiekt ${ob.id} (${ob.type}) na wodzie`);
    if (st.objAt[i] !== ob.id + 1) bad.push(`obiekt ${ob.id} nie jest w indeksie objAt`);
    if (ob.type === 'monster' && !(ob.count > 0)) bad.push(`potwór ${ob.id}: liczebność ${ob.count}`);
  }
  return bad;
});

test('menu uruchamia się i rysuje bez błędów', async () => {
  await frames(page, 10);
  assert.equal(await page.evaluate(() => G.screenName), 'menu');
});

for (const faction of ['haven', 'sylvan', 'barrow']) {
  for (const mapSize of ['S', 'M']) {
    test(`nowa gra: ${faction}, mapa ${mapSize}`, async () => {
      const info = await newGame(page, { faction, mapSize }, 1000 + mapSize.charCodeAt(0));
      assert.equal(info.players, 1);
      assert.ok(info.towns >= 2, 'miasto gracza + niezależne');
      assert.equal(info.heroes, 1);
      assert.ok(info.objects > 20, `za mało obiektów: ${info.objects}`);
      const start = await page.evaluate(() => {
        const st = G.state, h = st.heroes[0], t = st.towns[0], others = st.towns.slice(1);
        return { heroOnTown: h.x === t.x && h.y === t.y, faction: t.faction, army: armySize(h.army), mp: h.mp, owner: t.owner,
          townsAtSites: st.towns.length === st.map.sites.length, neutral: others.every(o => o.owner === -1 && armySize(o.garrison) > 0),
          names: new Set(st.towns.map(o => o.name)).size === st.towns.length };
      });
      assert.equal(start.owner, 0);
      assert.ok(start.townsAtSites, 'miasto w każdym miejscu startowym');
      assert.ok(start.neutral, 'pozostałe miasta są niezależne i mają garnizon');
      assert.ok(start.names, 'nazwy miast się nie powtarzają');
      assert.ok(start.heroOnTown, 'bohater zaczyna w mieście');
      assert.equal(start.faction, faction);
      assert.ok(start.army > 0, 'bohater ma armię');
      assert.ok(start.mp > 0, 'bohater ma ruch');
      assert.deepEqual(await checkInvariants(), []);
      await frames(page);
    });
  }
}

test('ten sam seed daje ten sam świat, inny seed inny', async () => {
  const snap = seed => page.evaluate(seed => JSON.stringify(serializeGame(createNewGame(Object.assign({}, G.settings, { mapSize: 'M' }), seed))), seed);
  const a = await snap(42), b = await snap(42), c = await snap(43);
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('zapis i odczyt zachowują stan gry', async () => {
  await newGame(page, { mapSize: 'M' }, 7);
  const r = await page.evaluate(() => {
    const st = G.state; for (let i = 0; i < 9; i++) G.screens.adventure.doEndTurn(); G.modal = null;
    const json = JSON.stringify(serializeGame(st)), back = deserializeGame(JSON.parse(json));
    return { same: JSON.stringify(serializeGame(back)) === json, day: back.dayTotal };
  });
  assert.ok(r.same, 'zapis → odczyt → zapis daje to samo');
  assert.equal(r.day, 10);
});

test('30 dni: kalendarz, dochód i przyrost tygodniowy', async () => {
  await newGame(page, {}, 99);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], R = human(st).resources, log = [];
    buildIn(st, t, BUILD_BY_ID.dw1); t.avail[1] = 0;
    for (let d = 0; d < 30; d++) {
      const inc = dailyIncomeAll(st, ME), before = { ...R };
      G.screens.adventure.doEndTurn(); G.modal = null;
      for (const res of RESOURCES) if (R[res.id] - before[res.id] !== inc[res.id]) log.push(`dzień ${st.dayTotal}: ${res.id} +${R[res.id] - before[res.id]}, oczekiwano +${inc[res.id]}`);
    }
    return { log, day: st.day, week: st.week, month: st.month, dayTotal: st.dayTotal, avail: t.avail[1], growth: weeklyGrowth(t, 1) };
  });
  assert.deepEqual(r.log, []);
  assert.equal(r.dayTotal, 31);
  // dzień 31 = miesiąc 2 (28 dni), tydzień 1, dzień 3
  assert.deepEqual([r.month, r.week, r.day], [2, 1, 3]);
  assert.equal(r.avail, r.growth * 4, 'cztery nowe tygodnie = cztery przyrosty');
  assert.deepEqual(await checkInvariants(), []);
});

test('budowa i rekrutacja pobierają właściwe koszty', async () => {
  await newGame(page, {}, 5);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], R = human(st).resources, gold0 = R.gold;
    buildIn(st, t, BUILD_BY_ID.dw1);
    const afterBuild = R.gold, cid = dwellingUnits(t, 1)[0], avail = t.avail[1], cost = unitCost(cid).gold;
    const err = recruit(st, t, 1, cid, avail), tooMany = recruit(st, t, 1, cid, 1);
    return { built: gold0 - afterBuild, spent: afterBuild - R.gold, cost, avail, err, tooMany, inGarrison: armyStacks(t.garrison).reduce((s, x) => s + (x.cid === cid ? x.n : 0), 0) };
  });
  assert.equal(r.built, 500);
  assert.equal(r.err, null);
  assert.equal(r.spent, r.cost * r.avail);
  assert.equal(r.inGarrison, r.avail);
  assert.equal(r.tooMany, 'Tylu jednostek nie ma w siedlisku');
  assert.deepEqual(await checkInvariants(), []);
});

test('bohater idzie do surowca i go podnosi', async () => {
  await newGame(page, {}, 321);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n; human(st).explored.fill(1); h.mp = 1e6;
    const cands = st.objects.filter(o => !o.dead && o.type === 'res' && !st.guard[o.y * n + o.x])
      .map(o => ({ o, p: computePath(st, h, o.x, o.y) })).filter(c => c.p).sort((a, b) => a.p.length - b.p.length);
    if (!cands.length) return { skip: true };
    const { o, p } = cands[0], before = human(st).resources[o.res];
    h.path = p; h.dest = [o.x, o.y]; h.moving = true;
    for (let i = 0; i < 2000 && (h.moving || h.anim || h.pending); i++) G.screens.adventure.update(0.05);
    return { at: [h.x, h.y], target: [o.x, o.y], dead: !!o.dead, gained: human(st).resources[o.res] - before, amount: o.amount };
  });
  assert.ok(!r.skip, 'brak osiągalnego surowca na mapie testowej');
  assert.deepEqual(r.at, r.target);
  assert.ok(r.dead, 'surowiec zniknął z mapy');
  assert.equal(r.gained, r.amount);
  assert.deepEqual(await checkInvariants(), []);
});

test('bitwy automatyczne kończą się, są powtarzalne i zapisują wynik', async () => {
  await newGame(page, { mapSize: 'M' }, 2024);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), army0 = JSON.stringify(h.army), out = [];
    for (const m of st.objects.filter(o => o.type === 'monster').slice(0, 25)) {
      const a = simulateBattle(createBattle(st, h, m)), b = simulateBattle(createBattle(st, h, m));
      const units = B => B.units.map(u => [u.cid, u.n, u.dead]);
      out.push({ over: a.over, same: a.over === b.over && JSON.stringify(units(a)) === JSON.stringify(units(b)), rounds: a.round });
    }
    return { out, armyUntouched: JSON.stringify(h.army) === army0 };
  });
  assert.ok(r.out.length >= 10);
  for (const b of r.out) {
    assert.ok(b.over === 'win' || b.over === 'lose', `wynik: ${b.over}`);
    assert.ok(b.same, 'ten sam przebieg przy tym samym stanie');
  }
  assert.ok(r.armyUntouched, 'symulacja nie zmienia armii przed resolveBattle');
});

test('wygrana usuwa potwora i daje doświadczenie, porażka odsyła bohatera do miasta', async () => {
  await newGame(page, {}, 77);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns[0], mons = st.objects.filter(o => o.type === 'monster');
    // wygrana: silna armia na najsłabszego potwora
    const weak = mons.reduce((a, b) => a.count * CREATURES[a.cid].value <= b.count * CREATURES[b.cid].value ? a : b);
    h.army = emptyArmy(); h.army[0] = { cid: dwellingUnits(t, 7)[0], n: 20 };
    const win = resolveBattle(simulateBattle(createBattle(st, h, weak)), false);
    // porażka: jeden słaby oddział na najsilniejszego
    const strong = mons.filter(o => !o.dead).reduce((a, b) => a.count * CREATURES[a.cid].value >= b.count * CREATURES[b.cid].value ? a : b);
    h.army = emptyArmy(); h.army[0] = { cid: dwellingUnits(t, 1)[0], n: 1 }; h.x = strong.x - 1; h.y = strong.y;
    const lose = resolveBattle(simulateBattle(createBattle(st, h, strong)), false);
    return { win: win.outcome, exp: win.exp, weakDead: !!weak.dead, lose: lose.outcome, strongAlive: !strong.dead && strong.count > 0,
      home: h.x === t.x && h.y === t.y, army: armySize(h.army), mp: h.mp };
  });
  assert.equal(r.win, 'win');
  assert.ok(r.exp > 0);
  assert.ok(r.weakDead);
  assert.equal(r.lose, 'lose');
  assert.ok(r.strongAlive);
  assert.ok(r.home, 'po porażce bohater wraca do miasta');
  assert.equal(r.army, 0);
  assert.equal(r.mp, 0);
});

test('ekrany rysują się bez błędów', async () => {
  await newGame(page, {}, 11);
  for (const [name, params] of [['adventure', '{}'], ['hero', '{}'], ['town', '{ townId: 0 }'], ['setup', '{}'], ['load', '{}'], ['scores', '{}'], ['credits', '{}']]) {
    await page.evaluate(([name, params]) => setScreen(name, eval(`(${params})`)), [name, params]);
    await frames(page, 5);
    assert.equal(await page.evaluate(() => G.screenName), name);
  }
});

for (const faction of ['haven', 'sylvan', 'barrow']) {
  test(`miasto i bitwa frakcji ${faction} rysują się bez błędów`, async () => {
    await newGame(page, { faction }, 31);
    await page.evaluate(() => { const t = G.state.towns[0]; for (const B of BUILDINGS) if (!hasB(t, B.id)) t.built.push(B.id); setScreen('town', { townId: 0 }); });
    await frames(page, 5);
    await page.evaluate(() => {
      const st = G.state, h = hero(st), t = st.towns[0], m = st.objects.find(o => o.type === 'monster');
      h.army = emptyArmy(); for (let L = 1; L <= 7; L++) h.army[L - 1] = { cid: dwellingUnits(t, L).at(-1), n: 3 };
      setScreen('battle', { battle: createBattle(st, h, m) });
    });
    await frames(page, 30);
    assert.equal(await page.evaluate(() => G.screenName), 'battle');
  });
}
