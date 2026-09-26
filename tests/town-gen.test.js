// Generator plansz miast: każde miasto ma własny krajobraz i układ, budowle mieszczą się w kadrze i nie zasłaniają się nawzajem,
// ta sama nazwa daje tę samą planszę, a ekran miasta rysuje się dla każdego typu krajobrazu. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każda frakcja i każdy krajobraz: 14 budowli w kadrze, bez wzajemnego zasłaniania', async () => {
  const r = await page.evaluate(() => {
    const bad = []; let n = 0;
    for (const fac of FACTIONS.map(f => f.id)) for (const arche of Object.keys(ARCHETYPES)) for (let k = 0; k < 4; k++) {
      const L = generateTownLayout(fac, strHash(`${fac}/${arche}/${k}`), arche); usePJ(L); n++;
      const R = L.slots.map(slotRect);
      if (R.length !== 14) bad.push(`${fac}/${arche}/${k}: ${R.length} miejsc`);
      R.forEach((q, i) => { if (q.x < 0 || q.x + q.w > 592 || q.y < 4 || q.sy > 440) bad.push(`${fac}/${arche}/${k}: miejsce ${i} poza kadrem`); });
      for (let i = 0; i < 14; i++) for (let j = i + 1; j < 14; j++) if (rectOverlap(R[i], R[j]) > 0.6) bad.push(`${fac}/${arche}/${k}: ${i} zasłania ${j}`);
      usePJ(null);
    }
    return { n, bad };
  });
  assert.equal(r.n, 6 * 8 * 4);
  assert.deepEqual(r.bad, []);
});

test('ta sama nazwa daje tę samą planszę, różne miasta frakcji różnią się krajobrazem, niebem albo układem', async () => {
  const r = await page.evaluate(() => {
    const out = {};
    for (const F of FACTIONS) {
      const Ls = F.towns.map(name => generateTownLayout(F.id, strHash(F.id + ':' + name)));
      const again = JSON.stringify(generateTownLayout(F.id, strHash(F.id + ':' + F.towns[0]))) === JSON.stringify(Ls[0]);
      const sig = Ls.map(L => `${L.arche}|${L.sky.top}|${Math.round(L.slots[0].X / 40)},${Math.round(L.slots[1].X / 40)}`);
      out[F.id] = { again, distinct: new Set(sig).size, arches: new Set(Ls.map(L => L.arche)).size, n: Ls.length };
    }
    return out;
  });
  for (const [fac, x] of Object.entries(r)) {
    assert.ok(x.again, `${fac}: plansza powtarzalna`);
    assert.equal(x.distinct, x.n, `${fac}: każde miasto inne`);
    assert.ok(x.arches >= 2, `${fac}: co najmniej dwa rodzaje krajobrazu (${x.arches})`);
  }
});

test('ekran miasta rysuje się dla każdego krajobrazu; budowle mają pola do wskazania myszą', async () => {
  const facs = await page.evaluate(() => FACTIONS.map(f => f.id)), arches = await page.evaluate(() => Object.keys(ARCHETYPES));
  for (let k = 0; k < arches.length; k++) {
    const fac = facs[k % facs.length];
    await newGame(page, { mapSize: 'M', faction: fac }, 8);
    await page.evaluate(([arche]) => {
      const t = G.state.towns[0], seed = strHash(t.faction + ':' + t.name); TownGenCache.set(seed, generateTownLayout(t.faction, seed, arche));
      t.built = BUILDINGS.map(b => b.id); setScreen('town', { townId: t.id }); G.modal = null;
    }, [arches[k]]);
    await frames(page, 6);
    const r = await page.evaluate(() => { const t = G.state.towns[0]; return { arche: townLayout(t).arche, rects: Object.keys((TownFXCache[lastTownKey] || {}).rects || {}).length, screen: G.screenName }; });
    assert.deepEqual(r, { arche: arches[k], rects: 14, screen: 'town' }, `${fac}/${arches[k]}`);
  }
});
