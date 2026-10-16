// Komputer korzysta z przeskoków w planie trasy: prom (za złoto) i portal przenoszą go na drugi koniec pary, a z kartografa
// kupuje mapę lądów, gdy ma zapas złota i dużo nieodkrytego terenu. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Pas wody przez całą mapę (3 pola) odcina skrzynię za nim; jedyna droga to para obiektów `kind` po obu stronach
const scene = kind => {
  const st = G.state, h = hero(st), n = st.map.n, P = playerOf(st, h.owner), y = h.y; if (h.x + 12 >= n) h.x = n - 13; const cx = h.x + 3; // scena musi się zmieścić na mapie
  for (const o of st.objects) if (o.type !== 'town') o.dead = true;
  for (let yy = 0; yy < n; yy++) for (let k = 0; k < 3; k++) { const i = yy * n + cx + k; st.map.terrain[i] = TER.WATER; st.map.obst[i] = 0; st.map.road[i] = 0; }
  for (let x = h.x; x <= cx + 8; x++) for (let yy = y - 1; yy <= y + 1; yy++) { const i = yy * n + x; if (x < cx || x > cx + 2) { st.map.terrain[i] = TER.GRASS; st.map.obst[i] = 0; } } // pas lądu po obu stronach wody
  st.guard.fill(0); P.explored.fill(1); P.resources.gold = 5000;
  const a = { id: st.objects.length, type: 'site', kind, x: cx - 1, y, seen: {} }; st.objects.push(a); const b = { id: st.objects.length, type: 'site', kind, x: cx + 3, y, seen: {} }; st.objects.push(b); a.pair = b.id; b.pair = a.id;
  const chest = { id: st.objects.length, type: 'chest', gold: 3000, exp: 1000, x: cx + 6, y }; st.objects.push(chest); rebuildObjIndex(st);
  h.mp = heroMaxMP(h) * 3; return { st, h, P, a, b, chest };
};

test('prom: komputer planuje trasę przez przeprawę, płaci 200 złota i zabiera skrzynię za wodą; bez złota nie widzi drogi', async () => {
  await newGame(page, { mapSize: 'M' }, 21);
  const r = await page.evaluate(sc => { const scene = eval(sc), { st, h, P, b, chest } = scene('ferry'), n = st.map.n;
    P.resources.gold = 100; const poor = aiReach(st, h).dist[chest.y * n + chest.x]; P.resources.gold = 5000;
    const R = aiReach(st, h), d = R.dist[chest.y * n + chest.x], path = R.path(chest.y * n + chest.x), jump = path.some(([x, y]) => x === b.x && y === b.y);
    for (const _ of aiMoveHero(st, h, [])); return { poor, d, jump, pos: [h.x, h.y], chest: !!chest.dead, gold: P.resources.gold };
  }, scene.toString());
  assert.ok(!Number.isFinite(r.poor), 'bez złota na prom skrzynia nieosiągalna');
  assert.ok(Number.isFinite(r.d)); assert.equal(r.jump, true); assert.equal(r.chest, true, 'skrzynia zabrana');
  assert.ok(r.gold === 5000 - 200 + 3000 || r.gold === 5000 - 200, `złoto ${r.gold}`);
});

test('portal: komputer przechodzi przez portal do celu po drugiej stronie (bez opłaty)', async () => {
  await newGame(page, { mapSize: 'M' }, 22);
  const r = await page.evaluate(sc => { const scene = eval(sc), { st, h, P, chest } = scene('portal'), n = st.map.n;
    const d = aiReach(st, h).dist[chest.y * n + chest.x]; for (const _ of aiMoveHero(st, h, [])); return { d, chest: !!chest.dead, gold: P.resources.gold };
  }, scene.toString());
  assert.ok(Number.isFinite(r.d)); assert.equal(r.chest, true); assert.ok(r.gold >= 5000, `złoto ${r.gold}`);
});

test('kartograf: komputer kupuje mapę lądów z zapasem złota, mapy wód nie; potem wartość 0', async () => {
  await newGame(page, { mapSize: 'M' }, 23);
  const r = await page.evaluate(() => { const st = G.state, h = hero(st), P = playerOf(st, h.owner), ob = { id: st.objects.length, type: 'site', kind: 'cartographer', x: h.x, y: h.y, seen: {} }; st.objects.push(ob);
    P.resources.gold = 3000; const poor = aiSiteValue(st, h, ob); P.resources.gold = 20000; const rich = aiSiteValue(st, h, ob);
    const land = cartoTiles(st, 'land'), before = land.filter(i => P.explored[i]).length, t = useSite(st, h, ob).text, after = land.filter(i => P.explored[i]).length;
    return { poor, rich, t, before, after, total: land.length, gold: P.resources.gold, again: aiSiteValue(st, h, ob) }; });
  assert.equal(r.poor, 0); assert.ok(r.rich > 0); assert.match(r.t, /mapa lądów/); assert.equal(r.after, r.total); assert.ok(r.before < r.total);
  assert.equal(r.gold, 17500); assert.equal(r.again, 0);
});
