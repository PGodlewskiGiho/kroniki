// Nowe budynki mapy: spichlerz (do przejęcia, +20% przyrostu najbliższego miasta), wykopalisko (dni kopania = lepszy skarb),
// turniej rycerski (co tydzień silniejszy czempion i większa nagroda). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('rozmieszczenie: spichlerz przy każdym mieście (3–10 pól, przy miastach graczy bez strażnika), wykopaliska i turnieje na mapie; modele 3D wypalone', async () => {
  const r = await page.evaluate(() => { const out = { granaryTowns: [], exc: 0, tour: 0, far: [] };
    for (const [size, seed] of [['L', 3], ['M', 11], ['XL', 8]]) { const S = Object.assign({}, G.settings, { mapSize: size, land: 'mixed', difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 1, slots: null, underground: false });
      const st = createNewGame(S, seed), gr = st.objects.filter(o => o.kind === 'granary' && !o.dead);
      out.granaryTowns.push([gr.length, st.towns.length]); out.exc += st.objects.filter(o => o.kind === 'excavation' && !o.dead).length; out.tour += st.objects.filter(o => o.kind === 'tournament' && !o.dead).length;
      for (const o of gr) { const t = granaryTown(st, o), d = Math.hypot(t.x - o.x, t.y - o.y); if (d > 10.5) out.far.push(d); if (t.owner >= 0 && st.guard[o.y * st.map.n + o.x]) out.far.push('strażnik przy mieście gracza'); }
      for (const o of st.objects.filter(o => o.kind === 'tournament')) if (o.wins !== 0) out.far.push('turniej bez licznika'); }
    out.sprites = ['site_granary', 'site_excavation', 'site_tournament'].filter(k => !(MAP3D_ART && MAP3D_ART.f[k])); out.flag = map3dFlags('site_granary').length; return out; });
  for (const [g, t] of r.granaryTowns) assert.equal(g, t, `spichlerze ${g} na ${t} miast`);
  assert.ok(r.exc >= 2, `wykopaliska: ${r.exc}`); assert.ok(r.tour >= 2, `turnieje: ${r.tour}`); assert.deepEqual(r.far, []);
  assert.deepEqual(r.sprites, []); assert.ok(r.flag >= 1, 'maszt z flagą na spichlerzu');
});

test('spichlerz: przejęcie daje +20% przyrostu najbliższego własnego miasta; obce miasto nic nie zyskuje; flaga i opis', async () => {
  await newGame(page, { mapSize: 'S' }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns.find(t => t.owner === h.owner); t.built.push('dw4'); const L = 4;
    st.objects.filter(o => o.kind === 'granary').forEach(o => { o.dead = true; });
    const ob = { id: st.objects.length, type: 'site', kind: 'granary', x: t.x + 5, y: t.y + 2, owner: -1, seen: {} }; st.objects.push(ob);
    const before = weeklyGrowth(t, L, st), r1 = useSite(st, h, ob), after = weeklyGrowth(t, L, st), info = siteInfo(st, ob, h);
    const again = useSite(st, h, ob).text; t.owner = 1; const foreign = weeklyGrowth(t, L, st); t.owner = h.owner;
    ob.owner = 1; const lost = weeklyGrowth(t, L, st); ob.owner = -1;
    const ai = st.heroes.find(x => x.owner !== h.owner) || { ...h, owner: 1, army: h.army }; const v = aiSiteValue(st, { ...h, owner: 0 }, ob);
    return { before, after, foreign, lost, owner: ob.owner, text: r1.text, info, again, v, town: granaryTown(st, ob) === t };
  });
  assert.equal(r.town, true); assert.ok(r.after > r.before, `${r.before} -> ${r.after}`); assert.equal(r.lost, r.before);
  assert.match(r.text, /przyrost stworów w nim rośnie o 20%/); assert.equal(r.after - r.before, 1, 'siedlisko 4. poziomu: co najmniej +1'); assert.match(r.info, /premia działa/); assert.match(r.again, /już należy do ciebie/); assert.ok(r.v >= 0);
});

test('wykopalisko: dzień kopania zabiera ruch, raz dziennie; dwa dni = artefakt; obcy zaczyna od zera; klik w bohatera kopie dalej', async () => {
  await newGame(page, { mapSize: 'S' }, 7);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), out = {}, ob = { id: st.objects.length, type: 'site', kind: 'excavation', x: h.x, y: h.y, seen: {} }; st.objects.push(ob); rebuildObjIndex(st);
    h.mp = heroMaxMP(h); G.modal = null; visitObject(st, h, ob); out.first = G.modal.buttons.map(b => b.label);
    G.modal.buttons.find(b => b.label === 'Kop (cały dzień)').action(); G.modal = null; out.mp = h.mp; out.dug = ob.dug; out.again = canDig(st, h, ob);
    visitObject(st, h, ob); out.sameDay = G.modal.msg; out.sameDayBtns = G.modal.buttons.map(b => b.label); G.modal = null;
    out.rival = digDays(ob, h.owner + 1);
    st.dayTotal++; h.mp = heroMaxMP(h); G.screens.adventure.onClick && (G.state.selHero = st.heroes.indexOf(h)); G.screens.adventure.useHere(h);
    G.modal.buttons.find(b => b.label === 'Kop (cały dzień)').action(); out.dug2 = ob.dug; const bag0 = h.bag.length + Object.values(h.equip).filter(Boolean).length;
    G.modal.buttons.find(b => b.label.startsWith('Zabierz')).action(); out.done = ob.done; out.arts = h.bag.length + Object.values(h.equip).filter(Boolean).length - bag0; G.modal = null;
    visitObject(st, h, ob); out.empty = G.modal.msg; G.modal = null;
    const ob2 = { id: st.objects.length, type: 'site', kind: 'excavation', x: h.x + 1, y: h.y, seen: {} }; st.objects.push(ob2); st.dayTotal++; h.mp = 100; const R = human(st).resources, g0 = R.gold;
    const ai = useSite(st, h, ob2); out.aiGold = R.gold - g0; out.aiDone = ob2.done; out.info = siteInfo(st, ob2, h);
    return out; });
  assert.deepEqual(r.first, ['Kop (cały dzień)', 'Odejdź']); assert.equal(r.mp, 0); assert.equal(r.dug, 1); assert.equal(r.again, false);
  assert.match(r.sameDay, /Dziś już tu kopano/); assert.ok(r.sameDayBtns.some(l => l.startsWith('Zabierz: 1000 złota')));
  assert.equal(r.rival, 0); assert.equal(r.dug2, 2); assert.equal(r.arts, 1); assert.equal(r.done, 0); assert.match(r.empty, /wykop jest pusty/);
  assert.equal(r.aiGold, 1000); assert.equal(r.aiDone, 0); assert.match(r.info, /znalezisko już zabrane/);
});

test('turniej: czempion rośnie z wygranymi; zwycięstwo daje złoto, doświadczenie i raz w tygodniu kończy turniej; komputer walczy tylko z przewagą', async () => {
  await newGame(page, { mapSize: 'S' }, 9);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = human(st).resources, out = {}, ob = { id: st.objects.length, type: 'site', kind: 'tournament', x: h.x, y: h.y, seen: {}, wins: 0 }; st.objects.push(ob);
    const c0 = tourneyChamp(st, ob); ob.wins = 3; const c3 = tourneyChamp(st, ob); ob.wins = 5; const c5 = tourneyChamp(st, ob); ob.wins = 0;
    out.champs = [c0.cid, c3.cid, c5.cid]; out.grows = c3.count * CREATURES[c3.cid].value > c0.count * CREATURES[c0.cid].value;
    out.prize3 = (ob.wins = 2, tourneyPrize(ob).art); ob.wins = 0;
    G.modal = null; visitObject(st, h, ob); out.btns = G.modal.buttons.map(b => b.label); out.msg = G.modal.msg; G.modal = null;
    h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 3 }; out.aiWeak = aiSiteValue(st, h, ob); h.army = emptyArmy(); h.army[0] = { cid: 'champion', n: 60 }; out.aiStrong = aiSiteValue(st, h, ob);
    const r1 = useSite(st, h, ob), g0 = R.gold, foe = Object.assign(trapMonster(h, r1.trap), r1.trapX), res = resolveBattle(simulateBattle(createBattle(st, h, foe)), false);
    out.outcome = res.outcome; out.wins = ob.wins; out.gold = R.gold - g0; out.spoils = spoilsText(res.spoils); out.used = siteUsed(st, ob, h); out.again = useSite(st, h, ob).text;
    visitObject(st, h, ob); out.closed = G.modal.msg; G.modal = null; st.dayTotal += 7; st.week = (st.week % 4) + 1; out.reopen = siteUsed(st, ob, h);
    return out; });
  assert.deepEqual(r.champs, ['crusader', 'cavalier', 'champion']); assert.equal(r.grows, true); assert.equal(r.prize3, 'minor');
  assert.deepEqual(r.btns, ['Stań do pojedynku', 'Odejdź']); assert.match(r.msg, /1\. turniej/);
  assert.equal(r.aiWeak, 0); assert.ok(r.aiStrong > 0);
  assert.equal(r.outcome, 'win'); assert.equal(r.wins, 1); assert.ok(r.gold >= 1000, `złoto ${r.gold}`); assert.match(r.spoils, /Turniej wygrany: 1000 złota, 750 doświadczenia/);
  assert.equal(r.used, true); assert.match(r.again, /już rozstrzygnięto/); assert.match(r.closed, /następny w przyszłym tygodniu/);
});

test('mapa z nowymi budynkami rysuje się bez błędów (z flagą właściciela spichlerza)', async () => {
  await newGame(page, { mapSize: 'M' }, 11);
  await page.evaluate(() => { const st = G.state, h = hero(st); for (const [i, kind] of ['granary', 'excavation', 'tournament'].entries()) st.objects.push({ id: st.objects.length, type: 'site', kind, x: h.x + 2 + i, y: h.y + 2, owner: kind === 'granary' ? h.owner : undefined, seen: {}, wins: 0 });
    rebuildObjIndex(st); MapRender.miniDirty = true; });
  await frames(page, 6);
});
