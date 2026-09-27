// Budowle specjalne frakcji (FACTION_SPECIAL): działanie każdej z ośmiu. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => {
  ({ browser, page, errors } = await openGame()); await newGame(page, { mapSize: 'M' }, 8);
  await page.evaluate(() => { // miasto gracza danej frakcji z budowlą specjalną, bohater gracza stoi w bramie
    window.spSetup = fac => { const st = G.state, t = st.towns.find(t => t.owner === ME), h = st.heroes.find(h => h.owner === ME);
      t.faction = fac; t.built = ['hall1', 'fort', 'special']; h.x = t.x; h.y = t.y; h.specVisits = []; h.stableWeek = null; t.vortexWeek = null; return [st, t, h]; };
  });
});
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('stajnie, klatka wodzów, sala Walhalli i wir many działają przy odwiedzinach', async () => {
  const r = await page.evaluate(() => {
    let [st, t, h] = spSetup('haven'); const mp0 = heroMaxMP(h), stable = [heroMaxMP(h) - mp0, !!specialVisit(st, t, h), heroMaxMP(h) - mp0, specialVisit(st, t, h)];
    [st, t, h] = spSetup('fortress'); const d0 = h.stats.def; specialVisit(st, t, h); specialVisit(st, t, h); const cage = h.stats.def - d0;
    [st, t, h] = spSetup('stronghold'); const a0 = h.stats.att; specialVisit(st, t, h); const valhalla = h.stats.att - a0;
    [st, t, h] = spSetup('dungeon'); h.mana = 0; specialVisit(st, t, h); const vortex = [h.mana === heroMaxMana(h) * 2, specialVisit(st, t, h)];
    return { stable, cage, valhalla, vortex, mp: STABLE_MP };
  });
  assert.deepEqual(r.stable, [0, true, r.mp, null], 'stajnie: +ruch do końca tygodnia, raz na tydzień');
  assert.equal(r.cage, 1, 'klatka wodzów: +1 obrony tylko raz');
  assert.equal(r.valhalla, 1, 'sala Walhalli: +1 ataku');
  assert.deepEqual(r.vortex, [true, null], 'wir many: raz w tygodniu');
});

test('skarbiec, wzmacniacz nekromancji, biblioteka i brama piekieł', async () => {
  const r = await page.evaluate(() => {
    let [st, t, h] = spSetup('sylvan'); const R = playerOf(st, ME).resources; R.gold = 10000; weeklyTreasury(st); const treasury = R.gold;
    R.gold = 90000; weeklyTreasury(st); const cap = R.gold - 90000;
    [st, t, h] = spSetup('barrow'); const amp = necroAmplifiers(st, ME);
    [st, t, h] = spSetup('academy'); t.built = ['hall1', 'fort', 'tavern', 'guild1', 'guild2']; rollGuildLevel(st, t, 1); rollGuildLevel(st, t, 2);
    const before = [t.guild[1].length, t.guild[2].length]; buildIn(st, t, BUILD_BY_ID.special); const library = [before, [t.guild[1].length, t.guild[2].length]];
    [st, t, h] = spSetup('inferno'); const other = st.towns.find(o => o !== t); const was = [other.owner, other.faction, other.built];
    other.owner = ME; other.faction = 'inferno'; other.built = ['special']; const targets = gateTargets(st, t).length, err = gateTravel(st, t, h, other), moved = h.x === other.x && h.y === other.y;
    [other.owner, other.faction, other.built] = was;
    return { treasury, cap, amp, library, targets, err, moved };
  });
  assert.equal(r.treasury, 11000, 'skarbiec: +10% złota');
  assert.equal(r.cap, 2500, 'skarbiec: najwyżej 2500');
  assert.equal(r.amp, 1);
  assert.deepEqual(r.library, [[3, 2], [4, 3]], 'biblioteka: czar więcej na poziomie');
  assert.deepEqual([r.targets, r.err, r.moved], [1, null, true], 'brama piekieł przenosi bohatera');
});
