// Graal i obeliski jak w Heroes 3: obeliski odsłaniają mapę zagadki, kopanie z pełnymi punktami ruchu, budowla Graala
// w mieście (+złoto, +przyrost), Graal przechodzi na zwycięzcę bitwy, zapis go pamięta, SI umie go wykopać. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('świat ma Graala na wolnym polu lądu i obeliski wg rozmiaru mapy', async () => {
  for (const [size, want] of [['S', 3], ['M', 5], ['L', 7]]) {
    await newGame(page, { mapSize: size }, 21);
    const r = await page.evaluate(() => { const st = G.state, n = st.map.n, g = st.grail, i = g.y * n + g.x;
      return { land: st.map.terrain[i] !== TER.WATER && !st.map.obst[i], free: !st.objAt[i], found: g.found, obelisks: obelisksTotal(st) }; });
    assert.deepEqual(r, { land: true, free: true, found: -1, obelisks: want }, size);
  }
});

test('obeliski odsłaniają kawałki mapy zagadki, ostatni pokazuje całość; okno mapy zagadki się rysuje', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), obs = st.objects.filter(o => o.kind === 'obelisk'), all = PUZZLE_COLS * PUZZLE_ROWS, seen = [puzzlePieces(st, ME)];
    for (const ob of obs) { useSite(st, h, ob); seen.push(puzzlePieces(st, ME)); }
    const again = useSite(st, h, obs[0]).puzzle;
    showPuzzle(st); const M = G.modal; M.draw(G.ctx);
    const order = puzzleOrder(st), last = order[order.length - 1], [x0, y0] = puzzleOrigin(st);
    const inLast = Math.floor((st.grail.x - x0) / PUZZLE_W * PUZZLE_COLS) === last.i && Math.floor((st.grail.y - y0) / PUZZLE_H * PUZZLE_ROWS) === last.j;
    return { seen, all, again: !!again, open: M.puzzle.open.size, inLast };
  });
  assert.equal(r.seen[0], 0);
  assert.ok(r.seen.every((v, i) => !i || v > r.seen[i - 1]), 'każdy obelisk odsłania więcej');
  assert.equal(r.seen.at(-1), r.all, 'wszystkie obeliski = cała mapa');
  assert.equal(r.again, false, 'ten sam obelisk drugi raz nic nie daje');
  assert.equal(r.open, r.all); assert.ok(r.inLast, 'kawałek z Graalem odsłania się na końcu');
  await frames(page, 4);
  await page.keyboard.press('Escape');
});

test('kopanie: tylko z pełnym ruchem, zły dołek zużywa dzień, dobre miejsce daje Graala', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), g = st.grail, n = st.map.n;
    const free = [...Array(n * n).keys()].find(i => !st.objAt[i] && !st.guard[i] && st.map.terrain[i] !== TER.WATER && !st.map.obst[i] && i !== g.y * n + g.x);
    const town = (h.mp = heroMaxMP(h), digGrail(st, h).error); h.x = free % n; h.y = (free / n) | 0;
    h.mp = 10; const tired = digGrail(st, h).error;
    h.mp = heroMaxMP(h); const miss = digGrail(st, h), holes = st.holes.length, mp = h.mp, twice = (h.mp = heroMaxMP(h), digGrail(st, h).error);
    h.x = g.x; h.y = g.y; h.mp = heroMaxMP(h); const hit = digGrail(st, h);
    return { town: !!town, tired: !!tired, miss: miss.found, holes, mp, twice: !!twice, hit: hit.found, bag: hasGrail(h), found: g.found === ME, equip: !!equipFromBag(h, h.bag.indexOf('grail')), info: (human(st).explored[st.holes[0]] = 1, tileInfo)(st, st.holes[0] % n, (st.holes[0] / n) | 0) };
  });
  assert.ok(r.town, 'w mieście nie kopie');
  assert.deepEqual([r.tired, r.miss, r.holes, r.mp, r.twice], [true, false, 1, 0, true]);
  assert.deepEqual([r.hit, r.bag, r.found], [true, true, true]);
  assert.ok(r.equip, 'Graala nie da się założyć'); assert.match(r.info, /dół/);
});

test('budowla Graala: bohater wnosi Graala do miasta, +5000 złota i +50% przyrostu; rysuje się w każdej frakcji', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns.find(t => t.owner === ME); t.built = ['hall1', 'dw1'];
    const gold0 = townGold(t), grow0 = weeklyGrowth(t, 1, null), noGrail = buildGrail(st, t, h);
    h.bag.push('grail'); h.x = t.x; h.y = t.y; visitObject(st, h, st.objects.find(o => o.type === 'town' && o.townId === t.id));
    const asked = G.modal && /Wznieść/.test(G.modal.msg); G.modal.buttons[0].action();
    return { noGrail, asked, built: hasB(t, 'grail'), bag: hasGrail(h), gold: townGold(t) - gold0, grow: [grow0, weeklyGrowth(t, 1, null)], list: availableBuildings(t).some(B => B.id === 'grail') };
  });
  assert.equal(r.noGrail, false); assert.ok(r.asked, 'miasto pyta o budowę');
  assert.deepEqual([r.built, r.bag, r.gold, r.list], [true, false, 5000, false]);
  assert.ok(r.grow[1] >= Math.floor(r.grow[0] * 1.5), `przyrost ${r.grow}`);
  for (const fac of await page.evaluate(() => FACTIONS.map(f => f.id))) {
    await page.evaluate(fac => { const t = G.state.towns[0]; t.faction = fac; t.built = ['hall1', 'grail']; G.modal = null; setScreen('town', { townId: t.id }); }, fac);
    await frames(page, 4);
    assert.equal(await page.evaluate(() => !!TownFXCache[lastTownKey].rects[15]), true, fac);
  }
});

test('Graal przechodzi na zwycięzcę bitwy i przetrwa zapis gry', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), foe = st.heroes.find(x => x.owner === 1);
    foe.bag.push('grail'); h.army = emptyArmy(); h.army[0] = { cid: 'champion', n: 40 }; foe.army = emptyArmy(); foe.army[0] = { cid: 'pikeman', n: 2 };
    const res = resolveBattle(simulateBattle(createBattle(st, h, foe)), false);
    st.holes.push(5); const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { win: res.outcome, grail: hasGrail(h), saved: JSON.stringify(back.grail) === JSON.stringify(st.grail) && back.holes.includes(5), obelisks: obelisksTotal(back) };
  });
  assert.deepEqual([r.win, r.grail, r.saved], ['win', true, true]); assert.equal(r.obelisks, 5);
});

test('SI znająca mapę zagadki idzie kopać, wykopuje Graala i buduje go w swoim mieście', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1 }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, p = st.players[1], h = st.heroes.find(x => x.owner === 1), t = st.towns.find(t => t.owner === 1), g = st.grail;
    for (const ob of st.objects.filter(o => o.kind === 'obelisk')) ob.seen['p1'] = 1;
    for (let i = 0; i < p.explored.length; i++) p.explored[i] = 1;
    h.army = emptyArmy(); h.army[0] = { cid: 'champion', n: 60 }; h.x = g.x; h.y = g.y; h.mp = heroMaxMP(h);
    runAiSync(st, aiMoveHero(st, h, [])); const dug = g.found === 1;
    h.mp = heroMaxMP(h) * 20; runAiSync(st, aiMoveHero(st, h, []));
    return { dug, built: hasB(t, 'grail') || st.towns.some(o => o.owner === 1 && hasB(o, 'grail')) };
  });
  assert.ok(r.dug, 'SI wykopała Graala'); assert.ok(r.built, 'SI zbudowała Graala');
});
