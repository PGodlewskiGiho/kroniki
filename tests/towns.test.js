// Miasta niezależne i ich zdobywanie (krok 13). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Stawia bohatera pod bramą miasta (pole poniżej wejścia), usuwa strażników z okolicy i prowadzi go do środka.
// Zwraca, czy bohater doszedł (albo zatrzymało go okno dialogowe).
const walkIntoTown = (townIndex, army) => page.evaluate(([ti, army]) => {
  const st = G.state, h = hero(st), t = st.towns[ti], n = st.map.n;
  for (const o of st.objects) if (o.type === 'monster' && Math.abs(o.x - t.x) <= 2 && Math.abs(o.y - t.y + 1) <= 3) o.dead = true;
  rebuildObjIndex(st); human(st).explored.fill(1);
  if (army) { h.army = emptyArmy(); army.forEach(([cid, k], i) => { h.army[i] = { cid, n: k }; }); }
  h.x = t.x; h.y = t.y + 1; h.mp = 1e6; h.path = computePath(st, h, t.x, t.y); h.moving = !!h.path;
  if (!h.path) return false;
  for (let i = 0; i < 200 && (h.moving || h.anim || h.pending) && !G.modal; i++) G.screens.adventure.update(0.05);
  return h.x === t.x && h.y === t.y;
}, [townIndex, army]);

test('garnizon rośnie z odległością od gracza i z poziomem trudności', async () => {
  const power = difficulty => page.evaluate(d => {
    const st = createNewGame(Object.assign({}, G.settings, { slots: null,  mapSize: 'XL', difficulty: d, opponents: 0 }), 4242), s = st.map.start;
    return st.towns.slice(1).map(t => ({ d: Math.hypot(t.x - s.x, t.y - s.y), p: armyPower(t.garrison) })).sort((a, b) => a.d - b.d);
  }, difficulty);
  const easy = await power(0), hard = await power(4);
  assert.ok(easy.length >= 5);
  assert.ok(easy.at(-1).p > easy[0].p * 1.5, `najdalsze miasto (${easy.at(-1).p}) wyraźnie silniejsze od najbliższego (${easy[0].p})`);
  const sum = a => a.reduce((s, x) => s + x.p, 0);
  assert.ok(sum(hard) > sum(easy) * 2, 'poziom Niemożliwy ma dużo silniejsze garnizony niż Łatwy');
});

test('mury miasta stoją na polu bitwy (oblężenie), bez dodatkowej premii do obrony', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1], out = [];
    for (const walls of [[], ['fort'], ['fort', 'citadel'], ['fort', 'citadel', 'castle']]) {
      t.built = ['hall1', ...walls]; const B = createBattle(st, hero(st), t);
      out.push([sideDef(B, 1), B.walls ? B.walls.size : 0, B.units.filter(u => u.cid === 'arrowTower').length]);
    }
    return out;
  });
  assert.deepEqual(r, [[0, 0, 0], [0, 9, 0], [0, 9, 1], [0, 9, 2]]);
});

test('wejście do niezależnego miasta: okno oblężenia, wygrana, zdobycie i wejście do miasta', async () => {
  await newGame(page, { mapSize: 'M' }, 21);
  assert.ok(await walkIntoTown(1, [['champion', 40], ['dawnbringer', 5]]), 'bohater stoi w bramie');
  const d = await dialog(page);
  assert.ok(d, 'okno przed bitwą');
  assert.match(d.msg, /miasto niezależne/);
  assert.deepEqual(d.labels, ['Walcz', 'Automatycznie', 'Wycofaj się']);
  await pressDialog(page, 'Automatycznie');
  const res = await dialog(page);
  assert.match(res.msg, /Zwycięstwo!.*należy teraz do ciebie/);
  const st = await page.evaluate(() => ({ owner: G.state.towns[1].owner, mine: myTowns(G.state).length, garrison: armySize(G.state.towns[1].garrison) }));
  assert.deepEqual(st, { owner: 0, mine: 2, garrison: 0 });
  await pressDialog(page, 'OK');
  while (await dialog(page)) await pressDialog(page, (await dialog(page)).labels[0]); // ewentualny awans
  await page.waitForFunction(() => G.screenName === 'town');
  await frames(page, 5);
  assert.equal(await page.evaluate(() => G.screens.town.townId), 1);
});

test('odwrót sprzed miasta cofa bohatera i nic nie zmienia', async () => {
  await newGame(page, { mapSize: 'M' }, 21);
  await walkIntoTown(1);
  await pressDialog(page, 'Wycofaj się');
  const r = await page.evaluate(() => { const t = G.state.towns[1], h = hero(G.state); return { owner: t.owner, at: [h.x - t.x, h.y - t.y] }; });
  assert.deepEqual(r, { owner: -1, at: [0, 1] });
});

test('przegrane oblężenie: bohater znika z mapy, garnizon zostaje osłabiony', async () => {
  await newGame(page, { mapSize: 'M' }, 21);
  const before = await page.evaluate(() => armySize(G.state.towns[1].garrison));
  await walkIntoTown(1, [['pikeman', 2]]);
  await pressDialog(page, 'Automatycznie');
  assert.match((await dialog(page)).msg, /Porażka/);
  const r = await page.evaluate(() => { const st = G.state, t = st.towns[1]; return { owner: t.owner, garrison: armySize(t.garrison), home: myHeroes(st).length === 0 && (st.retired || []).length === 1 }; });
  assert.equal(r.owner, -1);
  assert.ok(r.home, 'pokonany bohater w puli tawern');
  assert.ok(r.garrison > 0 && r.garrison <= before);
});

test('miasto bez obrońców zajmuje się bez walki', async () => {
  await newGame(page, { mapSize: 'M' }, 21);
  await page.evaluate(() => { G.state.towns[1].garrison = emptyArmy(); });
  await walkIntoTown(1);
  const d = await dialog(page);
  assert.match(d.msg, /bez walki/);
  assert.equal(await page.evaluate(() => G.state.towns[1].owner), 0);
  await pressDialog(page, 'Wejdź do miasta');
  await page.waitForFunction(() => G.screenName === 'town');
});

test('zdobyte miasto daje dochód i jednostki swojej frakcji', async () => {
  await newGame(page, { mapSize: 'M' }, 21);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1], R = human(st).resources, inc0 = dailyIncomeAll(st).gold;
    captureTown(st, t, ME); const inc1 = dailyIncomeAll(st).gold, cid = dwellingUnits(t, 1)[0], gold0 = R.gold;
    t.garrison = emptyArmy(); t.avail[1] = 5; const err = recruit(st, t, 1, cid, 5);
    return { gain: inc1 - inc0, err, spent: gold0 - R.gold, cost: unitCost(cid).gold * 5, faction: factionOf(t.faction).dw.dw1[1] === cid };
  });
  assert.equal(r.gain, 500);
  assert.equal(r.err, null);
  assert.equal(r.spent, r.cost);
  assert.ok(r.faction);
});

test('mapa i dymki pokazują miasta niezależne bez błędów', async () => {
  await newGame(page, { mapSize: 'M' }, 21);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1]; human(st).explored.fill(1); MapRender.reset(st.map, human(st).explored); centerCam(st, t.x, t.y);
    const sx = VIEW.x + t.x * T - st.cam.x + T / 2, sy = VIEW.y + t.y * T - st.cam.y + T / 2;
    return { tile: tileInfo(st, t.x, t.y), tip: G.screens.adventure.rightInfo(sx, sy) };
  });
  assert.match(r.tile, /miasto niezależne/);
  assert.match(r.tip, /Miasto niezależne\. Siła obrońców \d+/);
  await frames(page, 10);
});

test('lista budowania pokazuje zablokowane budowle z brakującymi wymaganiami (także pośrednimi) i co budowla odblokowuje', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const t = G.state.towns.find(t => t.owner === ME); t.built = ['hall1']; setScreen('town', { townId: t.id }); G.modal = null;
    const L = buildList(t), first = L.findIndex(x => x.locked), dw4 = L.find(x => x.B.id === 'dw4');
    const s = G.screens.town; s.scroll = L.indexOf(dw4); s.draw(document.querySelector('canvas').getContext('2d'));
    const row = s.rows.find(x => x.B.id === 'dw4'); s.onClick(row.x + 10, row.y + 10); const msg = G.modal && G.modal.msg; G.modal = null;
    return { okFirst: L.slice(0, first).every(x => !x.locked), lockedAfter: L.slice(first).every(x => x.locked), miss: dw4.miss, tip: s.rightInfo(row.x + 10, row.y + 10),
      unlock: unlocksOf(t, BUILD_BY_ID.fort).map(B => B.id).includes('citadel'), built: t.built.length, msg };
  });
  assert.ok(r.okFirst && r.lockedAfter, 'najpierw dostępne, potem zablokowane');
  assert.deepEqual(r.miss.slice().sort(), ['dw1', 'dw2', 'fort'], 'dw4 wymaga fortu i siedliska 2. poziomu (a to siedliska 1.)');
  assert.match(r.tip, /Wymaga \(w tej kolejności\):/); assert.ok(r.unlock); assert.equal(r.built, 1, 'klik w zablokowaną nie buduje');
});

test('werbunek z listy wraca do listy; „Werbuj wszystko” kupuje od najsilniejszych, na ile starczy', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns.find(t => t.owner === ME), R = human(st).resources; for (const h of st.heroes) if (h.x === t.x && h.y === t.y) h.x += 1;
    t.built = ['hall1', 'fort', 'dw1', 'dw2', 'dw3', 'dw3u']; t.garrison = emptyArmy(); t.avail = { 1: 20, 2: 10, 3: 5 }; setScreen('town', { townId: t.id }); G.modal = null;
    showRecruitList(st, t, () => {}); G.modal.buttons.find(b => b.label === 'Werbuj').action(); G.modal.buttons.find(b => b.label === 'Rekrutuj').action();
    const back = !!(G.modal && G.modal.overview);
    const F = factionOf(t.faction), up3 = F.dw.dw3u[1], c3 = unitCost(up3).gold; R.gold = c3 * 5 + 10; // stać tylko na 5 ulepszonych stworów 3. poziomu
    const res = recruitAll(st, t); G.modal = null;
    return { back, n3: armyStacks(t.garrison).find(s => s.cid === up3)?.n, avail3: t.avail[3], text: res.text, gold: R.gold };
  });
  assert.ok(r.back, 'po werbunku z listy wraca lista'); assert.equal(r.n3, 5, 'najpierw najsilniejsi (ulepszeni)'); assert.equal(r.avail3, 0);
  assert.ok(r.gold < 60, `reszta złota wydana na słabszych: ${r.gold}`); assert.match(r.text, /Zwerbowano/);
});
