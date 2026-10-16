// Role bohaterów komputera: poboczny kopie wykopalisko kilka dni, główny nie traci ruchu na drobiazgi; ołtarz ofiarny; powrót do miasta
// (obrona i wzmocnienie); żegluga: stocznia, łódź, rejs przez wodę i wysiadka. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('wykopalisko: poboczny kopie 4 dni i zabiera artefakt; główny przy pobocznych nie liczy wykopaliska ani kartografa', async () => {
  await newGame(page, { mapSize: 'M' }, 31);
  const r = await page.evaluate(() => {
    const st = G.state, m = hero(st), P = playerOf(st, m.owner), n = st.map.n; m.army[0] = { cid: 'champion', n: 50 };
    for (const o of st.objects) if (o.type !== 'town') o.dead = true; rebuildObjIndex(st);
    let x = m.x + 4, y = m.y; while (st.map.terrain[y * n + x] === TER.WATER || st.map.obst[y * n + x] || objectAt(st, y * n + x)) x++;
    const h = createHero(st, m.owner, x, y); h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 2 }; P.mainHero = m.id; P.human = false;
    const ob = { id: st.objects.length, type: 'site', kind: 'excavation', x, y, seen: {} }; st.objects.push(ob); rebuildObjIndex(st);
    const out = { role: aiRole(st, h), kMain: [aiChoreK(st, m, 'excavation', false), aiChoreK(st, m, 'cartographer', false), aiChoreK(st, m, 'granary', false)], kHelper: aiChoreK(st, h, 'excavation', true), v: aiSiteValue(st, h, ob) };
    const bag0 = h.bag.length + Object.values(h.equip).filter(Boolean).length, days = [];
    for (let d = 0; d < 6 && ob.done == null; d++) { h.mp = heroMaxMP(h); if (d === 0) useSite(st, h, ob); else for (const _ of aiMoveHero(st, h, [])); days.push(digDays(ob, h.owner)); st.dayTotal++; }
    out.days = days; out.done = ob.done; out.arts = h.bag.length + Object.values(h.equip).filter(Boolean).length - bag0;
    const solo = st.heroes.filter(o => o.owner === m.owner && o !== m); st.heroes = st.heroes.filter(o => !solo.includes(o)); out.kSolo = aiChoreK(st, m, 'excavation', false); P.human = true;
    return out; });
  assert.equal(r.role, 'helper'); assert.deepEqual(r.kMain, [0, 0, 0.3]); assert.equal(r.kHelper, 1); assert.equal(r.v, 4000);
  assert.deepEqual(r.days.slice(0, 4), [1, 2, 3, 4]); assert.equal(r.done, 0); assert.equal(r.arts, 1, 'artefakt z 4 dni kopania'); assert.equal(r.kSolo, 1, 'samotny bohater robi wszystko');
});

test('ołtarz ofiarny: wartość z doświadczenia za artefakty, zero przy części relikwii; poboczny ma niską wagę', async () => {
  await newGame(page, { mapSize: 'S' }, 32);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), ob = { id: st.objects.length, type: 'site', kind: 'sacrifice', x: h.x, y: h.y, seen: {} }; st.objects.push(ob);
    const plain = Object.keys(ARTIFACTS).filter(id => id !== 'grail' && !RELIC_PARTS.has(id) && ['major', 'relic'].includes(ARTIFACTS[id].rarity)).slice(0, 2), part = [...RELIC_PARTS][0];
    h.bag = []; const empty = aiSiteValue(st, h, ob); h.bag = plain.slice(); const full = aiSiteValue(st, h, ob); h.bag = [...plain, part]; const withPart = aiSiteValue(st, h, ob);
    return { empty, full, withPart, k: aiChoreK(st, h, 'sacrifice', true) }; });
  assert.equal(r.empty, 0); assert.ok(r.full > 0, `wartość ${r.full}`); assert.equal(r.withPart, 0); assert.equal(r.k, 0.2);
});

test('powrót do miasta: wraca bronić miasta przed silniejszym wrogiem, wraca po wzmocnienie; blisko miasta nie rzuca', async () => {
  await newGame(page, { mapSize: 'L', opponents: 1 }, 33);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), P = playerOf(st, h.owner), n = st.map.n, t = st.towns.find(t => t.owner === h.owner); P.explored.fill(1); P.mainHero = h.id;
    const setup = () => { h.book = true; h.spells = ['townPortal']; h.mana = 200; h.mp = heroMaxMP(h); h.army = emptyArmy(); h.army[0] = { cid: 'champion', n: 40 }; h.x = t.x > n / 2 ? t.x - 30 : t.x + 30; h.y = t.y; t.garrison = emptyArmy(); };
    for (const o of st.heroes) if (o !== h) o.x = o.y = -50;
    setup(); const idle = aiTownPortal(st, h); const at0 = [h.x, h.y];
    const foe = st.heroes.find(o => o.owner !== h.owner) || createHero(st, 1, 0, 0); foe.x = t.x + (t.x > n / 2 ? -5 : 5); foe.y = t.y; foe.army = emptyArmy(); foe.army[0] = { cid: 'champion', n: 15 };
    const mp0 = h.mp, threat = aiTownPortal(st, h), pos1 = [h.x, h.y], mp1 = h.mp;
    foe.x = foe.y = -50; setup(); t.garrison[0] = { cid: 'champion', n: 30 }; const reinf = aiTownPortal(st, h), got = h.army.reduce((k, s) => k + (s && s.cid === 'champion' ? s.n : 0), 0);
    setup(); h.x = t.x + 3; t.garrison[0] = { cid: 'champion', n: 30 }; const near = aiTownPortal(st, h);
    return { idle, at0, threat, pos1, mp1, town: [t.x, t.y], mp0, reinf, got, near }; });
  assert.equal(r.idle, false); assert.equal(r.threat, true); assert.deepEqual(r.pos1, r.town); assert.equal(r.mp1, r.mp0 - 300);
  assert.equal(r.reinf, true); assert.equal(r.got, 70, 'zabrał załogę miasta'); assert.equal(r.near, false);
});

test('żegluga: plan trasy przez łódź, rejs, wysiadka (łódź przy brzegu, koniec ruchu) i skrzynia na wyspie', async () => {
  await newGame(page, { mapSize: 'M' }, 34);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n, P = playerOf(st, h.owner), y = h.y; if (h.x + 14 >= n) h.x = n - 15; const cx = h.x + 2;
    for (const o of st.objects) if (o.type !== 'town') o.dead = true;
    for (let yy = 0; yy < n; yy++) for (let k = 0; k < 6; k++) { const i = yy * n + cx + k; st.map.terrain[i] = TER.WATER; st.map.obst[i] = 0; st.map.road[i] = 0; }
    for (let x = h.x; x <= cx + 10; x++) for (let yy = y - 1; yy <= y + 1; yy++) { const i = yy * n + x; if (x < cx || x > cx + 5) { st.map.terrain[i] = TER.GRASS; st.map.obst[i] = 0; } }
    st.guard.fill(0); P.explored.fill(1); h.boat = false; h.army[0] = { cid: 'champion', n: 20 };
    st.towns = st.towns.filter(t => t.owner === h.owner); for (const o of st.objects) if (o.type === 'town' && !st.towns.includes(o)) o.dead = true; // tylko skrzynia jest celem
    const chest = { id: st.objects.length, type: 'chest', gold: 3000, exp: 1000, x: cx + 8, y }; st.objects.push(chest); rebuildObjIndex(st);
    const noBoat = aiReach(st, h).dist[chest.y * n + chest.x];
    const boat = addBoat(st, cx, y); const R = aiReach(st, h), d = R.dist[chest.y * n + chest.x], viaBoat = R.path(chest.y * n + chest.x).some(([x, yy]) => x === boat.x && yy === boat.y);
    h.mp = heroMaxMP(h) * 3; for (const _ of aiMoveHero(st, h, []));
    const left = st.objects.filter(o => o.type === 'boat' && !o.dead).map(o => [o.x, o.y]), day1 = { pos: [h.x, h.y], boat: !!h.boat, mp: h.mp, chest: !!chest.dead };
    h.mp = heroMaxMP(h); for (const _ of aiMoveHero(st, h, []));
    return { noBoat, d, viaBoat, day1, left, chest: !!chest.dead, shore: cx + 6 }; });
  assert.ok(!Number.isFinite(r.noBoat), 'bez łodzi wyspa nieosiągalna'); assert.ok(Number.isFinite(r.d)); assert.equal(r.viaBoat, true);
  assert.equal(r.day1.boat, false); assert.equal(r.day1.pos[0], r.shore, 'wysiadł na drugim brzegu'); assert.equal(r.day1.mp, 0, 'wysiadka kończy ruch');
  assert.equal(r.left.length, 1); assert.equal(r.left[0][0], r.shore - 1, 'łódź przy brzegu');
  assert.equal(r.chest, true, 'skrzynia na wyspie zabrana następnego dnia');
});

test('stocznia i łódź: stocznia w kolejce budowy na mapie z wodą; komputer kupuje łódź, drugiej nie; sucha mapa bez żeglugi', async () => {
  await newGame(page, { mapSize: 'M', land: 'islands', opponents: 1 }, 35);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns.find(t => townCoastal(st, t)) || st.towns[0], p = playerOf(st, 1);
    const own0 = t.owner; t.owner = 1; for (const h of st.heroes) if (h.owner === 1) h.boat = false;
    st.objects.filter(o => o.type === 'boat').forEach(o => { o.dead = true; }); rebuildObjIndex(st);
    const coastal = townCoastal(st, t), wet = aiWatery(st);
    t.built = t.built.filter(id => id !== 'shipyard'); const order = AI_BUILD_ORDER.includes('shipyard');
    t.built.push('shipyard'); t.builtToday = true; p.resources.gold = 20000; p.resources.wood = 50; p.boatWeek = null; aiManageTown(st, p, t);
    const boats = st.objects.filter(o => o.type === 'boat' && !o.dead).length; aiManageTown(st, p, t); const boats2 = st.objects.filter(o => o.type === 'boat' && !o.dead).length;
    st.map._wet = 0; const dry = aiWatery(st); delete st.map._wet; t.owner = own0;
    return { coastal, wet, order, boats, boats2, dry }; });
  assert.equal(r.coastal, true); assert.equal(r.wet, true); assert.equal(r.order, true);
  assert.equal(r.boats, 1, 'kupiona łódź'); assert.equal(r.boats2, 1, 'druga nie, gdy łódź stoi przy mieście'); assert.equal(r.dry, false);
});
