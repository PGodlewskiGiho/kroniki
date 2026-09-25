// Rynek: kursy, wymiana, okno handlu i zakupy SI (etap 1, krok 1). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('kursy: bez rynku brak handlu, więcej rynków = lepszy kurs', async () => {
  await newGame(page, { mapSize: 'M' }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, lots = () => ({ buyWood: marketLot(st, ME, 'gold', 'wood'), sellWood: marketLot(st, ME, 'wood', 'gold'), woodToGems: marketLot(st, ME, 'wood', 'gems'), gemsToWood: marketLot(st, ME, 'gems', 'wood'), same: marketLot(st, ME, 'ore', 'ore') });
    const none = lots(); st.towns[0].built.push('market'); const one = lots();
    for (const t of st.towns.slice(1, 4)) { captureTown(st, t, ME); t.built.push('market'); }
    return { none, one, four: lots(), count: marketCount(st, ME) };
  });
  assert.equal(r.none.buyWood, null);
  assert.deepEqual(r.one.buyWood, { give: 250, get: 1 });
  assert.deepEqual(r.one.sellWood, { give: 1, get: 50 });
  assert.deepEqual(r.one.woodToGems, { give: 10, get: 1 });
  assert.deepEqual(r.one.gemsToWood, { give: 3, get: 1 });
  assert.equal(r.one.same, null);
  assert.equal(r.count, 4);
  assert.ok(r.four.buyWood.give < r.one.buyWood.give, 'kupno taniej');
  assert.ok(r.four.sellWood.get > r.one.sellWood.get, 'sprzedaż drożej');
  // kupno i natychmiastowa odsprzedaż zawsze przynosi stratę (brak „perpetuum mobile”)
  assert.ok(r.four.buyWood.give > r.four.sellWood.get);
});

test('wymiana zmienia surowce dokładnie o kurs i nie schodzi poniżej zera', async () => {
  await newGame(page, { mapSize: 'M' }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, R = human(st).resources; st.towns[0].built.push('market');
    const before = { ...R }, err = trade(st, ME, 'gold', 'ore', 4), after = { ...R };
    const tooMuch = trade(st, ME, 'gems', 'gold', 1000), zero = trade(st, ME, 'gems', 'gold', 0);
    const max = marketMax(st, ME, 'wood', 'sulfur'); const errMax = trade(st, ME, 'wood', 'sulfur', max);
    return { err, dGold: after.gold - before.gold, dOre: after.ore - before.ore, tooMuch, zero, errMax, max, wood: R.wood, allOk: RESOURCES.every(r => R[r.id] >= 0) };
  });
  assert.equal(r.err, null);
  assert.equal(r.dGold, -1000);
  assert.equal(r.dOre, 4);
  assert.match(r.tooMuch, /Brakuje/);
  assert.match(r.zero, /Wybierz/);
  assert.equal(r.errMax, null);
  assert.ok(r.max > 0);
  assert.ok(r.wood < 10, 'po maksymalnej wymianie zostaje mniej niż jedna transakcja');
  assert.ok(r.allOk);
});

test('okno rynku w mieście: wybór surowców, ilość i handel', async () => {
  await newGame(page, { mapSize: 'M' }, 5);
  await page.evaluate(() => { G.state.towns[0].built.push('market'); setScreen('town', { townId: 0 }); });
  await frames(page, 5);
  const r = await page.evaluate(() => {
    const st = G.state, scr = G.screens.town, R = human(st).resources, gold0 = R.gold, crystal0 = R.crystal;
    showMarket(st, ME, m => scr.say(m));
    const btn = (label, k = 0) => G.modal.buttons.filter(b => b.label === label)[k];
    btn('Złoto', 0).action(); btn('Kryształ', 1).action(); // oddaję złoto, dostaję kryształ
    btn('Więcej').action(); btn('Więcej').action(); btn('Więcej').action(); // 1 + 3 = 4 wymiany
    const n = G.modal.market.n; btn('Handluj').action();
    return { n, dGold: R.gold - gold0, dCrystal: R.crystal - crystal0, msg: scr.msg, open: !!G.modal };
  });
  assert.equal(r.n, 4);
  assert.equal(r.dGold, -2000);
  assert.equal(r.dCrystal, 4);
  assert.match(r.msg, /Wymiana: Złoto 2000 → Kryształ 4/);
  assert.ok(r.open, 'okno zostaje otwarte do kolejnych wymian');
  await frames(page, 5);
  await page.evaluate(() => { G.modal.buttons.find(b => b.label === 'Zamknij').action(); });
});

test('kliknięcie budowli Rynku otwiera okno handlu', async () => {
  await newGame(page, { mapSize: 'M' }, 5);
  await page.evaluate(() => { G.state.towns[0].built.push('market'); setScreen('town', { townId: 0 }); });
  await frames(page, 5);
  const r = await page.evaluate(() => {
    const scr = G.screens.town, rects = (TownFXCache[lastTownKey] || {}).rects || {}, rc = rects[BUILD_BY_ID.market.slot];
    if (!rc) return { skip: true };
    const px = rc.x + rc.w / 2, py = rc.y + rc.h / 2; if (scr.slotAt(px, py) !== BUILD_BY_ID.market.slot) return { skip: true };
    scr.onClick(px, py); return { market: !!(G.modal && G.modal.market) };
  });
  assert.ok(!r.skip, 'rynek widoczny w scenie miasta');
  assert.ok(r.market);
});

test('SI dokupuje brakujące surowce po kursie swojego rynku', async () => {
  await newGame(page, { mapSize: 'M' }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, R = human(st).resources; R.wood = 0; R.ore = 0; R.gold = 20000;
    const noMarket = buyMissing(st, ME, BUILD_BY_ID.fort.cost); st.towns[0].built.push('market');
    const ok = buyMissing(st, ME, BUILD_BY_ID.fort.cost);
    return { noMarket, ok, wood: R.wood, ore: R.ore, gold: R.gold, afford: canAfford(st, BUILD_BY_ID.fort.cost) };
  });
  assert.equal(r.noMarket, false);
  assert.equal(r.ok, true);
  assert.deepEqual([r.wood, r.ore], [20, 20]);
  assert.equal(r.gold, 20000 - 40 * 250);
  assert.ok(r.afford, 'po zakupie stać na Fort');
});
