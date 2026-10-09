// Nowe miejsca na mapie: arena, szkoła magii, drzewo wiedzy, targowisko, magiczny ogród, ognisko, fort na wzgórzu. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); await newGame(page, { mapSize: 'L' }, 77); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const KINDS = ['arena', 'school', 'tree', 'market', 'garden', 'campfire', 'hillFort'];

test('nowe miejsca pojawiają się w świecie i mają grafikę 3D', async () => {
  const r = await page.evaluate(K => K.map(k => [k, G.state.objects.filter(o => o.type === 'site' && o.kind === k).length, !!MAP3D_ART.f['site_' + k]]), KINDS);
  for (const [k, n, art] of r) { assert.ok(n > 0, `${k} na mapie`); assert.ok(art, `${k}: grafika`); }
});

test('działanie: arena, szkoła, drzewo, ogród, ognisko, fort', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = st.players[h.owner].resources, mk = kind => ({ type: 'site', kind, x: 0, y: 0, id: 9000 + Math.floor(Math.random() * 999), seen: {}, res: 'ore' });
    const out = {};
    const a0 = h.stats.att; useSite(st, h, mk('arena'), 'att'); out.arena = h.stats.att - a0;
    R.gold = 5000; const k0 = h.stats.kn; useSite(st, h, mk('school'), 'kn'); out.school = [h.stats.kn - k0, 5000 - R.gold];
    const L0 = h.level, t = useSite(st, h, mk('tree')); gainExp(st, h, t.exp); out.tree = h.level - L0;
    const g0 = R.gold + R.gems * 1000; useSite(st, h, mk('garden')); out.garden = R.gold + R.gems * 1000 > g0;
    const fire = mk('campfire'); st.objects.push(fire); const o0 = R.ore; useSite(st, h, fire); out.campfire = [R.ore - o0 >= 4, !!fire.dead];
    h.army = [{ cid: 'pikeman', n: 10 }, null, null, null, null, null, null]; R.gold = 10000; useSite(st, h, mk('hillFort')); out.fort = [h.army[0].cid, 10000 - R.gold];
    return out;
  });
  assert.equal(r.arena, 2); assert.deepEqual(r.school, [1, 1000]); assert.equal(r.tree, 1); assert.ok(r.garden); assert.deepEqual(r.campfire, [true, true]);
  assert.equal(r.fort[0], 'halberdier'); assert.equal(r.fort[1], 150);
});

test('targowisko na mapie daje kurs jak dwa rynki, także bez rynku w mieście', async () => {
  const r = await page.evaluate(() => { const st = G.state; G.marketMin = 2; const L = marketLot(st, ME, 'gold', 'wood'); G.marketMin = 0; return [L && L.give, marketLot(st, ME, 'gold', 'wood')]; });
  assert.ok(r[0] > 0); assert.equal(r[1], null);
});

test('miasto: ulepszanie kupionych stworów (zwykłe -> ulepszone -> elitarne), koszt = różnica cen', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns.find(t => t.owner === ME), F = factionOf(t.faction), base = F.dw.dw1[1], up = F.dw.dw1u[1], el = F.dw.dw1x[1], R = st.players[ME].resources;
    t.garrison = [{ cid: base, n: 10 }, null, null, null, null, null, null]; t.built = t.built.filter(b => !['dw1u', 'dw1x'].includes(b));
    const out = { none: townUpgradeTarget(t, base) };
    t.built.push('dw1', 'dw1u'); out.toUp = townUpgradeTarget(t, base) === up;
    R.gold = 100000; for (const k of Object.keys(R)) if (k !== 'gold') R[k] = 100;
    const g0 = R.gold, cost = upgradeCostFor(base, up, 10); out.err = townUpgrade(st, t, t.garrison, 0); out.cid = t.garrison[0].cid === up; out.paid = g0 - R.gold === (cost.gold || 0);
    t.built.push('dw1x'); out.toElite = townUpgradeTarget(t, up) === el; townUpgrade(st, t, t.garrison, 0); out.elite = t.garrison[0].cid === el;
    // drugie kliknięcie w zaznaczony oddział otwiera okno ulepszenia
    G.go('town', { townId: t.id }); return out;
  });
  assert.deepEqual(r, { none: null, toUp: true, err: null, cid: true, paid: true, toElite: true, elite: true });
  await page.waitForFunction(() => G.screenName === 'town');
  const dlg = await page.evaluate(() => { const s = G.screen, t = s.town(); t.garrison[0] = { cid: factionOf(t.faction).dw.dw2[1], n: 5 }; t.built.push('dw2', 'dw2u'); s.showUpgrade(t.garrison, 0); return G.modal && G.modal.buttons.map(b => b.label); });
  assert.deepEqual(dlg, ['Ulepsz', 'Ulepsz wszystkie', 'Zwolnij', 'Nie']);
});

test('druga paczka: oaza na piasku, obiekty wodne na otwartej wodzie, działanie', async () => {
  const r = await page.evaluate(() => {
    const out = { kinds: {}, okTerrain: true };
    for (const seed of [3, 11, 29]) {
      const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'L' }), seed);
      for (const o of st.objects) if (o.type === 'site' && ['oasis', 'graveyard', 'magicSpring', 'buoy', 'flotsam', 'sirens'].includes(o.kind)) {
        out.kinds[o.kind] = (out.kinds[o.kind] || 0) + 1; const t = st.map.terrain[o.y * st.map.n + o.x];
        if (o.kind === 'oasis' && t !== TER.SAND || ['buoy', 'flotsam', 'sirens'].includes(o.kind) && t !== TER.WATER) out.okTerrain = false;
      }
    }
    const st = G.state, h = hero(st), R = st.players[h.owner].resources, mk = kind => { const o = { type: 'site', kind, x: 0, y: 0, id: 8000 + Math.floor(Math.random() * 999), seen: {} }; st.objects.push(o); return o; };
    h.boost = {}; useSite(st, h, mk('oasis')); out.oasis = h.boost.morale === 1;
    h.mana = 0; useSite(st, h, mk('magicSpring')); out.spring = h.mana === heroMaxMana(h) * 2;
    const b0 = h.bag.length + Object.values(h.equip).filter(Boolean).length, g0 = R.gold; const gy = mk('graveyard'); useSite(st, h, gy); out.grave = [R.gold > g0, h.bag.length + Object.values(h.equip).filter(Boolean).length > b0, !!gy.dead];
    h.army = [{ cid: 'pikeman', n: 50 }, null, null, null, null, null, null]; const s = useSite(st, h, mk('sirens')); out.sirens = [s.exp, h.army[0].n];
    return out;
  });
  for (const k of ['oasis', 'graveyard', 'magicSpring', 'buoy', 'flotsam', 'sirens']) assert.ok(r.kinds[k] > 0, `${k} w świecie`);
  assert.ok(r.okTerrain); assert.ok(r.oasis); assert.ok(r.spring); assert.deepEqual(r.grave, [true, true, true]); assert.deepEqual(r.sirens, [1500, 45]);
});

test('podziemia i nowe skarbce: grzybowy krąg, kryształowa grota, kuźnia krasnoludów, piramida, kryjówka zbójców, warsztat golemów', async () => {
  const r = await page.evaluate(() => {
    const out = { kinds: {}, ugIn: 0, ugAll: 0 };
    for (const seed of [5, 17, 41]) {
      const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'L', underground: true }), seed);
      for (const o of st.objects) {
        const k = o.kind; if (['mushroomRing', 'crystalCave', 'dwarfForge', 'pyramid', 'banditHideout', 'golemWorks'].includes(k)) out.kinds[k] = (out.kinds[k] || 0) + 1;
        if (['mushroomRing', 'crystalCave', 'dwarfForge'].includes(k)) { out.ugAll++; if (levelOf(st.map, o.x, o.y) === 1) out.ugIn++; }
      }
    }
    const st = G.state, h = hero(st), R = st.players[h.owner].resources, mk = kind => { const o = { type: 'site', kind, x: 0, y: 0, id: 7000 + Math.floor(Math.random() * 999), seen: {} }; st.objects.push(o); return o; };
    h.boost = {}; useSite(st, h, mk('mushroomRing')); out.luck = h.boost.luck === 1;
    const c0 = R.crystal; useSite(st, h, mk('crystalCave')); out.cave = R.crystal - c0 >= 3;
    R.gold = 5000; R.ore = 10; const a0 = h.bag.length + Object.values(h.equip).filter(Boolean).length; const fg = mk('dwarfForge'); useSite(st, h, fg); out.forge = [5000 - R.gold, 10 - R.ore, h.bag.length + Object.values(h.equip).filter(Boolean).length - a0];
    const h2 = createHero(st, h.owner, h.x, h.y); out.forgeOnce = /już/.test(useSite(st, h2, fg).text) && R.gold === 2500; removeHero(st, h2); // raz na całą grę, nie na bohatera
    out.art = ['pyramid', 'banditHideout', 'golemWorks'].every(k => MAP3D_ART.f[`bank_${k}_0`] && MAP3D_ART.f[`bank_${k}_1`]) && ['mushroomRing', 'crystalCave', 'dwarfForge'].every(k => MAP3D_ART.f['site_' + k]);
    return out;
  });
  for (const k of ['mushroomRing', 'crystalCave', 'dwarfForge', 'pyramid', 'banditHideout', 'golemWorks']) assert.ok(r.kinds[k] > 0, `${k} w świecie`);
  assert.ok(r.ugIn / r.ugAll > 0.8, `w podziemiach ${r.ugIn}/${r.ugAll}`); assert.ok(r.luck); assert.ok(r.cave); assert.deepEqual(r.forge, [2500, 5, 1]); assert.ok(r.forgeOnce, 'kuźnia wykuwa tylko jeden artefakt na grę'); assert.ok(r.art);
});

test('nowy skarbiec: zwycięstwo daje łup i golemy do armii', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = st.players[h.owner].resources, ob = { type: 'bank', kind: 'golemWorks', x: 0, y: 0, id: 6999, guards: [], cleared: false };
    h.army = [{ cid: 'pikeman', n: 5 }, null, null, null, null, null, null]; const g0 = R.gold, m0 = R.mercury; lootBank(st, h, ob);
    return [R.gold - g0, R.mercury - m0, h.army.some(x => x && x.cid === 'ironGolem' && x.n === 6), ob.cleared];
  });
  assert.deepEqual(r, [4000, 10, true, true]);
});

test('fort na wzgórzu: okno z wyborem oddziału albo wszystkich; jeden ulepszony, okno wraca z resztą', async () => {
  await newGame(page, {}, 5);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = human(st).resources, ob = { id: 9100, type: 'site', kind: 'hillFort', x: h.x, y: h.y, seen: {} }; st.objects.push(ob);
    h.army = [{ cid: 'pikeman', n: 10 }, { cid: 'archer', n: 6 }, null, null, null, null, null]; R.gold = 50000; G.modal = null; siteChoice(st, h, ob);
    const labels = G.modal.buttons.map(b => b.label); G.modal.buttons[1].action(); // tylko łucznicy
    const after = [h.army[0].cid, h.army[1].cid], again = G.modal && G.modal.buttons.map(b => b.label); G.modal = null; ob.dead = true;
    return { labels, after, again };
  });
  assert.equal(r.labels.length, 4); assert.deepEqual(r.labels.slice(2), ['Wszystkie', 'Wyjdź']);
  assert.deepEqual(r.after, ['pikeman', 'marksman'], 'ulepszony tylko wybrany oddział'); assert.equal(r.again.length, 3, 'okno wraca z pikinierami');
});
