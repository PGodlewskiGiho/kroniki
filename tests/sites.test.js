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
  assert.deepEqual(dlg, ['Ulepsz', 'Ulepsz wszystkie', 'Nie']);
});
