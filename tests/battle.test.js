// Bitwy z dowolną armią (bohater, miasto) i zasoby liczone dla właściciela. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Nowa gra + drugi gracz (Kurhan) z miastem w drugim miejscu startowym i bohaterem obok niego.
// W przeglądarce zostają pomocnicze funkcje TX.* (T to już rozmiar pola w grze) do budowania armii.
async function twoPlayers(seed = 500) {
  await newGame(page, { mapSize: 'M' }, seed);
  await page.evaluate(() => {
    const st = G.state, s = st.map.sites.find(p => p !== st.map.start), n = st.map.n;
    st.players.push({ id: 1, color: 'blue', human: false, faction: 'barrow', resources: { ...DIFFICULTIES[1].res }, explored: new Uint8Array(n * n) });
    createTown(st, s.x, s.y, 1, 'barrow'); rebuildObjIndex(st);
    createHero(st, 1, s.x, s.y + 1);
    window.TX = {
      me: () => G.state.heroes.find(h => h.owner === ME), foe: () => G.state.heroes.find(h => h.owner === 1),
      army: stacks => { const a = emptyArmy(); stacks.forEach(([cid, n], i) => { a[i] = { cid, n }; }); return a; },
      total: a => armyStacks(a).reduce((s, x) => s + x.n, 0),
    };
  });
}

test('surowce, budowa i rekrutacja liczą się dla właściciela miasta', async () => {
  await twoPlayers();
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1], mine = { ...human(st).resources }, P1 = playerOf(st, 1).resources, g0 = P1.gold;
    buildIn(st, t, BUILD_BY_ID.dw1);
    const afterBuild = P1.gold, cid = dwellingUnits(t, 1)[0], err = recruit(st, t, 1, cid, t.avail[1]);
    // surowiec podniesiony przez bohatera gracza 1 trafia do gracza 1
    const res = st.objects.find(o => o.type === 'res' && !o.dead), before = P1[res.res];
    visitObject(st, TX.foe(), res);
    return { owner: t.owner, built: g0 - afterBuild, err, recruited: TX.total(t.garrison), gained: P1[res.res] - before, amount: res.amount,
      mineUntouched: JSON.stringify(human(st).resources) === JSON.stringify(mine),
      canAffordMe: canAfford(st, { gold: mine.gold }), canAffordFoe: canAfford(st, { gold: mine.gold }, 1) };
  });
  assert.equal(r.owner, 1);
  assert.equal(r.built, 500);
  assert.equal(r.err, null);
  assert.ok(r.recruited > 0);
  assert.equal(r.gained, r.amount);
  assert.ok(r.mineUntouched, 'zasoby gracza nie zmieniły się');
  assert.equal(r.canAffordMe, true);
  assert.equal(r.canAffordFoe, false);
});

test('bohater na bohatera: wygrana usuwa pokonanego, wybór bohatera zostaje', async () => {
  await twoPlayers();
  const r = await page.evaluate(() => {
    const st = G.state, me = TX.me(), foe = TX.foe();
    me.army = TX.army([['champion', 30], ['archer', 40]]); foe.army = TX.army([['boneWarrior', 10]]);
    const B = createBattle(st, me, foe), sides = [B.sides[1].owner, B.sides[1].hero === foe, B.units.filter(u => u.side === 1).length];
    const res = resolveBattle(simulateBattle(B), false);
    return { sides, res, heroes: st.heroes.length, foeGone: !st.heroes.includes(foe), sel: hero(st) === me };
  });
  assert.deepEqual(r.sides, [1, true, 1]);
  assert.equal(r.res.outcome, 'win');
  assert.ok(r.res.heroDefeated);
  assert.ok(r.res.exp > 0);
  assert.equal(r.heroes, 1);
  assert.ok(r.foeGone);
  assert.ok(r.sel, 'wybrany bohater gracza bez zmian');
});

test('bohater na bohatera: porażka zostawia obrońcy ocalałych i daje mu doświadczenie', async () => {
  await twoPlayers();
  const r = await page.evaluate(() => {
    const st = G.state, me = TX.me(), foe = TX.foe();
    me.army = TX.army([['pikeman', 3]]); foe.army = TX.army([['vampireLord', 10], ['boneWarrior', 30]]);
    const exp0 = foe.exp, res = resolveBattle(simulateBattle(createBattle(st, me, foe)), false);
    return { res, foeExp: foe.exp - exp0, foeArmy: armyStacks(foe.army), foeAlive: st.heroes.includes(foe) };
  });
  assert.equal(r.res.outcome, 'lose');
  assert.ok(r.foeAlive);
  assert.equal(r.foeExp, r.res.foeExp);
  assert.ok(r.foeExp > 0);
  assert.equal(r.foeArmy.length, 2, 'oddziały obrońcy wróciły na swoje miejsca');
  assert.ok(r.foeArmy.every(s => s.n > 0));
});

test('miasto: garnizon i bohater bronią się razem, zdobycie zmienia właściciela', async () => {
  await twoPlayers();
  const r = await page.evaluate(() => {
    const st = G.state, me = TX.me(), t = st.towns[1], foe = TX.foe();
    foe.x = t.x; foe.y = t.y; // bohater w mieście
    foe.army = TX.army(Array.from({ length: 7 }, () => ['boneWarrior', 2])); t.garrison = TX.army(Array.from({ length: 7 }, () => ['ghoul', 2]));
    me.army = TX.army([['dawnbringer', 20], ['champion', 40]]);
    const B = createBattle(st, me, t), def = B.units.filter(u => u.side === 1), cells = new Set(B.units.map(u => u.x + ',' + u.y));
    const layout = { def: def.length, fromGarrison: def.filter(u => u.src === 'garrison').length, unique: cells.size === B.units.length, cols: [...new Set(def.map(u => u.x))].sort() };
    const res = resolveBattle(simulateBattle(B), false), ob = st.objects.find(o => o.type === 'town' && o.townId === t.id);
    return { layout, res, owner: t.owner, obOwner: ob.owner, garrison: TX.total(t.garrison), foeGone: !st.heroes.includes(foe), income: dailyIncomeAll(st, ME).gold, foeIncome: dailyIncomeAll(st, 1).gold };
  });
  assert.deepEqual(r.layout, { def: 14, fromGarrison: 7, unique: true, cols: [11, 12] });
  assert.equal(r.res.outcome, 'win');
  assert.ok(r.res.captured);
  assert.equal(r.owner, 0);
  assert.equal(r.obOwner, 0);
  assert.equal(r.garrison, 0);
  assert.ok(r.foeGone);
  assert.equal(r.income, 1000, 'dwa miasta z ratuszem = 2 × 500 złota');
  assert.equal(r.foeIncome, 0);
});

test('miasto: odparty atak zostawia ocalałych w garnizonie', async () => {
  await twoPlayers();
  const r = await page.evaluate(() => {
    const st = G.state, me = TX.me(), t = st.towns[1];
    t.garrison = [{ cid: 'vampireLord', n: 15 }, null, { cid: 'ghoul', n: 20 }, null, null, null, null];
    me.army = TX.army([['pikeman', 5]]);
    const res = resolveBattle(simulateBattle(createBattle(st, me, t)), false);
    return { res, owner: t.owner, slots: t.garrison.map(s => s && s.cid) };
  });
  assert.equal(r.res.outcome, 'lose');
  assert.equal(r.owner, 1);
  assert.deepEqual(r.slots, ['vampireLord', null, 'ghoul', null, null, null, null]);
});

test('bohater obrońców rzuca czary w bitwie', async () => {
  await twoPlayers();
  const r = await page.evaluate(() => {
    const st = G.state, me = TX.me(), foe = TX.foe();
    me.army = TX.army([['pikeman', 60]]); me.spells = []; me.mana = 0; // piki: 10 pż, więc strzała na pewno kogoś zabije i SI uzna czar za opłacalny
    foe.army = TX.army([['boneWarrior', 40]]); foe.spells = ['magicArrow']; foe.mana = heroMaxMana(foe) + 20; foe.stats.kn = 5;
    const m0 = foe.mana, B = simulateBattle(createBattle(st, me, foe));
    return { spent: m0 - foe.mana, cast: B.log.some(l => l.startsWith(`${foe.name} rzuca`)), myMana: me.mana };
  });
  assert.ok(r.cast, 'obrońca rzucił czar');
  assert.ok(r.spent > 0);
  assert.equal(r.myMana, 0);
});

test('ekran bitwy z bohaterem i z miastem rysuje się bez błędów', async () => {
  await twoPlayers();
  for (const kind of ['hero', 'town']) {
    await page.evaluate(kind => {
      const st = G.state, me = TX.me(), foe = TX.foe(), t = st.towns[1];
      me.army = TX.army([['archer', 10], ['swordsman', 5]]); foe.army = TX.army([['ghoul', 8], ['wraith', 3]]); t.garrison = TX.army([['boneWarrior', 12]]);
      if (kind === 'town') { foe.x = t.x; foe.y = t.y; }
      setScreen('battle', { battle: createBattle(st, me, kind === 'town' ? t : foe) });
    }, kind);
    await frames(page, 60);
    assert.equal(await page.evaluate(() => G.screenName), 'battle');
  }
});

test('zapis po pokonaniu bohatera: nowe id nie powtarzają się', async () => {
  await twoPlayers();
  const r = await page.evaluate(() => {
    const st = G.state, foe = TX.foe(), extra = createHero(st, 1, st.towns[1].x, st.towns[1].y); // id 0, 1, 2
    removeHero(st, foe); // zostają id 0 i 2; licząc po długości listy nowy dostałby znów 2
    const nh = createHero(st, 1, st.towns[1].x, st.towns[1].y), ids = st.heroes.map(h => h.id);
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { unique: new Set(ids).size === ids.length, newId: nh.id, extraId: extra.id, heroes: back.heroes.length, sel: back.heroes[back.selHero].owner };
  });
  assert.ok(r.unique);
  assert.equal(r.extraId, 2);
  assert.equal(r.newId, 3);
  assert.equal(r.heroes, 3);
  assert.equal(r.sel, 0);
});
