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
