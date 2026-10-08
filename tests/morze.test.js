// Morze: piraci na statkach i morskie stwory (strażnicy wody), wiry w parach (połowa najsłabszego oddziału), latarnie (ruch łodzi),
// bitwa morska na dwóch pokładach z kładkami; brama podziemi jako kamienna czaszka. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('morze ma piratów i morskie stwory (pilnują tylko wody), wiry w parach i latarnie na brzegu', async () => {
  await newGame(page, { mapSize: 'L', land: 'islands', opponents: 1 }, 21);
  const r = await page.evaluate(() => {
    const st = G.state, n = st.map.n, o = st.objects.filter(x => !x.dead), wet = i => st.map.terrain[i] === TER.WATER, sea = o.filter(x => x.sea);
    const zoneBad = sea.some(m => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = (m.y + dy) * n + m.x + dx; if (st.guard[i] === m.id + 1 && !wet(i)) return true; } return false; });
    const whirl = o.filter(x => x.kind === 'whirlpool'), light = o.filter(x => x.kind === 'lighthouse');
    return { pirates: sea.filter(x => x.ship).length, beasts: sea.filter(x => !x.ship).length, onWater: sea.every(m => wet(m.y * n + m.x)), zoneBad,
      whirl: whirl.length, paired: whirl.every(w => st.objects[w.pair] && st.objects[w.pair].pair === w.id), light: light.length, coast: light.every(l => !wet(l.y * n + l.x) && DX8.some((dx, d) => wet((l.y + DY8[d]) * n + l.x + dx))),
      shipsArePirates: sea.filter(x => x.ship).every(x => PIRATES.includes(x.cid)) };
  });
  assert.ok(r.pirates >= 3 && r.beasts >= 3, `piraci ${r.pirates}, stwory ${r.beasts}`); assert.ok(r.onWater); assert.equal(r.zoneBad, false, 'strefa morskiego strażnika tylko na wodzie');
  assert.ok(r.whirl >= 2 && r.whirl % 2 === 0 && r.paired, `wiry ${r.whirl}`); assert.ok(r.light >= 1 && r.coast, `latarnie ${r.light}`); assert.ok(r.shipsArePirates);
});

test('wir przenosi łódź do drugiego wiru i zabiera połowę najsłabszego oddziału; latarnia daje ruch na morzu właścicielowi', async () => {
  await newGame(page, { mapSize: 'L', land: 'islands' }, 21);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), w = st.objects.find(x => x.kind === 'whirlpool' && !x.dead), to = st.objects[w.pair], lh = st.objects.find(x => x.kind === 'lighthouse' && !x.dead);
    h.boat = true; h.x = w.x; h.y = w.y; h.army = [{ cid: 'pikeman', n: 10 }, { cid: 'archer', n: 30 }, null, null, null, null, null];
    const t = useSite(st, h, w), moved = h.x === to.x && h.y === to.y, left = h.army[0].n, archers = h.army[1].n;
    const mp0 = heroMaxMP(h), claim = useSite(st, h, lh), mp1 = heroMaxMP(h); h.boat = false; const land = heroMaxMP(h);
    return { moved, left, archers, lost: /zabiera/.test(t.text), owner: lh.owner === ME, gain: mp1 - mp0, landGain: land - (mp0 - 0), claim: claim.text, info: siteInfo(st, lh, h).includes('świeci dla') };
  });
  assert.equal(r.moved, true); assert.equal(r.left, 5, 'pikinierzy (najsłabsi) tracą połowę'); assert.equal(r.archers, 30); assert.ok(r.lost);
  assert.equal(r.owner, true); assert.equal(r.gain, 400, 'latarnia: +400 ruchu w łodzi'); assert.ok(r.info);
});

test('bitwa morska: dwa pokłady, woda między nimi, przejście kładkami; bitwa się kończy', async () => {
  await newGame(page, { mapSize: 'L', land: 'islands' }, 21);
  const r = await page.evaluate(async () => {
    const st = G.state, h = hero(st), m = st.objects.find(x => x.ship && !x.dead), n = st.map.n; let spot = null;
    for (let d = 0; d < 8 && !spot; d++) { const X = m.x + DX8[d], Y = m.y + DY8[d]; if (st.map.terrain[Y * n + X] === TER.WATER && !objectAt(st, Y * n + X)) spot = [X, Y]; }
    h.x = spot[0]; h.y = spot[1]; h.boat = true; h.army = [{ cid: 'swordsman', n: 30 }, { cid: 'archer', n: 30 }, null, null, null, null, null]; m.count = 3;
    const B = createBattle(st, h, m), water = [...B.obst.values()].filter(o => o.o === 'sea').length, planks = NAVAL_PLANKS.every(y => NAVAL_GAP.every(x => !B.obst.has(hexKey(x, y))));
    setScreen('battle', { battle: B }); G.fade.a = 0; B.auto = true; for (let i = 0; i < 4000 && !B.over; i++) await new Promise(res => setTimeout(res, 15));
    const out = { naval: B.naval, water, planks, over: B.over }; setScreen('adventure', {}); return out;
  });
  assert.equal(r.naval, true); assert.equal(r.water, 3 * (9 - 2), 'woda: 3 kolumny bez 2 kładek'); assert.ok(r.planks); assert.equal(r.over, 'win');
});

test('brama podziemi i obiekty morskie mają modele (czaszka, wir w 4 klatkach, latarnia, statek piracki)', async () => {
  const r = await page.evaluate(() => ['site_gate', 'site_whirlpool', 'site_whirlpool_1', 'site_lighthouse', 'pirate_0', 'pirate_3'].filter(k => !(MAP3D_ART && MAP3D_ART.f[k])));
  assert.deepEqual(r, []);
});
