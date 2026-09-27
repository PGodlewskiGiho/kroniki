// Sceny miast: każda frakcja ma jedną, ręcznie ułożoną scenę, budowle mieszczą się w kadrze i nie zasłaniają się nawzajem,
// wszystkie miasta frakcji wyglądają tak samo, a ekran miasta rysuje się dla każdej frakcji. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każda frakcja ma własną scenę: 16 budowli (z Graalem) w kadrze, bez wzajemnego zasłaniania', async () => {
  const r = await page.evaluate(() => {
    const bad = [];
    for (const F of FACTIONS) {
      if (!TOWN_SCENES[F.id]) { bad.push(`${F.id}: brak sceny`); continue; }
      const L = buildTownScene(F.id); usePJ(L); const R = L.slots.map(slotRect);
      if (R.length !== 16) bad.push(`${F.id}: ${R.length} miejsc`);
      R.forEach((q, i) => { if (q.x < 0 || q.x + q.w > 592 || q.y < 4 || q.sy > 440) bad.push(`${F.id}: miejsce ${i} poza kadrem`); });
      for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) if (rectOverlap(R[i], R[j]) > 0.6) bad.push(`${F.id}: ${i} zasłania ${j}`);
      usePJ(null);
    }
    return bad;
  });
  assert.deepEqual(r, []);
});

test('wszystkie miasta frakcji mają tę samą scenę, a sceny frakcji różnią się od siebie', async () => {
  const r = await page.evaluate(() => {
    const sig = F => { const L = buildTownScene(F.id); return JSON.stringify([L.sky.top, L.slots.map(S => [Math.round(S.X), S.Z])]); };
    const same = FACTIONS.every(F => { const [a, b] = F.towns; return townLayout({ faction: F.id, name: a }) === townLayout({ faction: F.id, name: b }); });
    const again = FACTIONS.every(F => sig(F) === sig(F));
    return { same, again, distinct: new Set(FACTIONS.map(sig)).size, n: FACTIONS.length };
  });
  assert.ok(r.same, 'jedna scena na frakcję'); assert.ok(r.again, 'scena powtarzalna');
  assert.equal(r.distinct, r.n, 'każda frakcja ma inną scenę');
});

test('kraj frakcji: spokojny teren bez ścieżek i przechodniów (drogi tylko jako schody, most, kładki), straż z własnej frakcji, Loch w grocie', async () => {
  const r = await page.evaluate(() => {
    const out = {};
    for (const F of FACTIONS) {
      const L = buildTownScene(F.id), Bm = TOWN_BIOME[F.id];
      const S = TOWN_SCENES[F.id], M = L.roads.find(R => R.main);
      out[F.id] = { folk: L.folk.length, guards: L.guards.length === 2 && L.guards.every(g => g.kind === Bm.guard),
        roads: !!M === !!(S.road || S.planks) && (!M || M.style === Bm.road), cave: (L.frame === 'cave') === (F.id === 'dungeon') };
    }
    return out;
  });
  for (const [fac, x] of Object.entries(r)) assert.deepEqual(x, { folk: 0, guards: true, roads: true, cave: true }, fac);
});

test('ekran miasta rysuje się dla każdej frakcji; budowle mają pola do wskazania myszą', async () => {
  const facs = await page.evaluate(() => FACTIONS.map(f => f.id));
  await newGame(page, { mapSize: 'M' }, 8);
  for (const fac of facs) {
    await page.evaluate(([fac]) => { const t = G.state.towns[0]; t.faction = fac; t.built = BUILDINGS.map(b => b.id); setScreen('town', { townId: t.id }); G.modal = null; }, [fac]);
    await frames(page, 6);
    const r = await page.evaluate(() => ({ rects: Object.keys((TownFXCache[lastTownKey] || {}).rects || {}).length, screen: G.screenName }));
    assert.deepEqual(r, { rects: 16, screen: 'town' }, fac);
  }
});

test('przegląd stworów (jak Fort w Heroes 3): siedem poziomów, werbunek tylko ze zbudowanych siedlisk', async () => {
  await newGame(page, { mapSize: 'M', faction: 'academy' }, 8);
  const r = await page.evaluate(() => {
    const t = G.state.towns[0]; t.built = ['hall1', 'fort', 'dw1', 'dw3', 'dw3u']; t.avail[3] = 4;
    setScreen('town', { townId: t.id }); G.modal = null; G.screens.town.baseButtons[0].action();
    const M = G.modal, labels = M.buttons.map(b => b.label), keys = M.buttons.filter(b => b.label === 'Werbuj').map(b => b.key);
    M.draw(G.ctx); M.buttons.find(b => b.key === '3').action(); const opened = G.modal !== M;
    return { overview: !!M.overview, labels, keys, opened };
  });
  assert.ok(r.overview);
  assert.deepEqual(r.keys, ['1', '3']);
  assert.equal(r.labels.at(-1), 'Zamknij');
  assert.ok(r.opened, 'Werbuj otwiera okno werbunku');
  await page.evaluate(() => { G.modal = null; });
  await frames(page, 3);
});

test('gildia magów: podgląd czarów z widokiem na miasto, zwoje zbudowanych poziomów, opis po kliknięciu', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await page.evaluate(() => { const st = G.state, t = st.towns[0]; t.built = ['hall1', 'tavern', 'guild1', 'guild2']; rollGuildLevel(st, t, 1); rollGuildLevel(st, t, 2); setScreen('town', { townId: t.id }); });
  await frames(page, 8);
  const opened = await page.evaluate(() => { const r = TownFXCache[lastTownKey].rects[2]; G.screens.town.onClick(r.x + r.w / 2, r.y + r.h * 0.7); return !!(G.modal && G.modal.guild); });
  assert.ok(opened, 'klik w gildię otwiera podgląd czarów');
  await frames(page, 6);
  const r = await page.evaluate(() => {
    const M = G.modal, r0 = M.rects[0]; M.onClick(r0.x + 5, r0.y + 5);
    return { n: M.rects.length, want: GUILD_OFFER[1] + GUILD_OFFER[2], sel: M.sel === r0.id, info: M.rightInfo(r0.x + 5, r0.y + 5), win: M.rightInfo(GV.win.x + 30, GV.win.y + 60), view: !!G.screens.town.fb };
  });
  assert.equal(r.n, r.want, 'zwoje tylko z poziomów 1 i 2');
  assert.ok(r.sel); assert.match(r.info, /poziom [12], \d+ many/); assert.match(r.win, /Widok z okna gildii/); assert.ok(r.view);
  await frames(page, 4);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => G.modal), null);
  await page.keyboard.press('g');
  assert.ok(await page.evaluate(() => !!(G.modal && G.modal.guild)), 'klawisz G otwiera gildię');
  await page.keyboard.press('Escape');
});
