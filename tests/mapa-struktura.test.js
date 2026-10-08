// Struktura mapy: pasma górskie z przełęczami, rzeki z brodami, puszcze; obiekty rzadsze i rozmieszczone wg okolicy;
// skarby ukryte w gąszczu widoczne dopiero z bliska. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('góry tworzą pasma, rzeki mają brody, a do każdego miasta da się dojść lądem', async () => {
  const r = await page.evaluate(() => {
    const out = [];
    for (const [n, seed] of [[36, 1], [72, 4242], [72, 7], [108, 99], [144, 5]]) {
      const m = generateMap(n, seed), N = n * n, comp = new Int32Array(N).fill(-1); let longest = 0, k = 0;
      // najdłuższe pasmo: największa spójna grupa gór (8 sąsiadów), mierzona rozpiętością
      for (let s = 0; s < N; s++) { if (m.obst[s] !== OBST.MOUNT || comp[s] >= 0) continue; const st = [s]; comp[s] = k; let x0 = n, x1 = 0, y0 = n, y1 = 0;
        while (st.length) { const i = st.pop(), x = i % n, y = (i / n) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X >= 0 && Y >= 0 && X < n && Y < n && m.obst[j] === OBST.MOUNT && comp[j] < 0) { comp[j] = k; st.push(j); } } }
        longest = Math.max(longest, Math.hypot(x1 - x0, y1 - y0)); k++; }
      // dojście lądem (bez przeszkód) od startu do każdego miejsca pod miasto
      const reach = new Uint8Array(N), q = [m.start.y * n + m.start.x]; reach[q[0]] = 1;
      while (q.length) { const i = q.pop(), x = i % n, y = (i / n) | 0; for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X >= 0 && Y >= 0 && X < n && Y < n && !reach[j] && m.terrain[j] !== TER.WATER && !m.obst[j]) { reach[j] = 1; q.push(j); } } }
      out.push({ n, longest: Math.round(longest), fords: m.fords.length, sites: m.sites.length, reachable: m.sites.filter(s => reach[s.y * n + s.x]).length });
    }
    return out;
  });
  for (const m of r) {
    assert.equal(m.reachable, m.sites, `mapa ${m.n}: miasta osiągalne lądem`);
    assert.ok(m.longest >= Math.max(8, m.n * 0.12), `mapa ${m.n}: najdłuższy odcinek pasma (między przełęczami) ${m.longest} pól`);
    if (m.n >= 72) assert.ok(m.fords >= 2, `mapa ${m.n}: brody na rzekach (${m.fords})`);
  }
});

test('obiektów mniej niż dawniej i pasują do okolicy (młyn nad wodą, studnia przy drodze)', async () => {
  const r = await page.evaluate(() => {
    const S = Object.assign({}, G.settings, { mapSize: 'L', difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 1, slots: null, underground: false });
    const st = createNewGame(S, 31), m = st.map, n = m.n; let land = 0; for (let i = 0; i < n * n; i++) if (m.terrain[i] !== TER.WATER) land++;
    const roadD = (x, y) => { let b = 99; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && m.road[Y * n + X]) b = Math.min(b, Math.max(Math.abs(dx), Math.abs(dy))); } return b; };
    const wetD = (x, y) => { for (let r = 0; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && m.terrain[Y * n + X] === TER.WATER) return r; } return 9; };
    const avg = (kinds, f) => { const L = st.objects.filter(o => o.type === 'site' && kinds.includes(o.kind)); return L.length ? L.reduce((s, o) => s + f(o.x, o.y), 0) / L.length : null; };
    return { perLand: st.objects.length / land, roadSites: avg(['well', 'stables', 'temple', 'market', 'camp', 'post'], roadD), mills: avg(['waterMill'], wetD),
      hidden: st.objects.filter(o => o.hid).length };
  });
  assert.ok(r.perLand < 1 / 16, `obiekt na ${(1 / r.perLand).toFixed(1)} pól lądu (dawniej ~13)`);
  assert.ok(r.roadSites != null && r.roadSites <= 2.5, `miejsca przydrożne średnio ${r.roadSites} pola od drogi`);
  assert.ok(r.mills == null || r.mills <= 2.5, `młyny wodne średnio ${r.mills} pola od wody`);
  assert.ok(r.hidden >= 3, `ukrytych skarbów: ${r.hidden}`);
});

test('skarb w gąszczu: niewidoczny z daleka, odkrywa go bohater przechodzący obok; SI też go nie zna', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 4242);
  const r = await page.evaluate(() => {
    const st = G.state, o = st.objects.find(x => x.hid && !x.dead), n = st.map.n, out = {};
    human(st).explored.fill(1); // cała mapa odkryta: ukryty skarb i tak niewidoczny
    out.before = { seen: objSeen(st, o), ui: !!uiObjectAt(st, o.y * n + o.x), ai: objSeen(st, o, 1) };
    reveal(st, o.x + 2, o.y - 1, 5); // bohater 2 pola obok
    out.after = { seen: objSeen(st, o), ui: !!uiObjectAt(st, o.y * n + o.x), ai: objSeen(st, o, 1) };
    out.saved = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st)))).objects[o.id].fd[ME] === 1;
    return out;
  });
  assert.deepEqual(r.before, { seen: false, ui: false, ai: false });
  assert.deepEqual(r.after, { seen: true, ui: true, ai: false });
  assert.ok(r.saved, 'odkrycie zapisuje się w grze');
});

test('każda kraina i każdy kształt świata: komplet miejsc na miasta, wszystkie osiągalne lądem; mapy się różnią', async () => {
  const r = await page.evaluate(() => {
    const reachOk = m => { const n = m.n, reach = new Uint8Array(n * n), q = [m.start.y * n + m.start.x]; reach[q[0]] = 1;
      while (q.length) { const i = q.pop(), x = i % n, y = (i / n) | 0; for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X >= 0 && Y >= 0 && X < n && Y < n && !reach[j] && m.terrain[j] !== TER.WATER && !m.obst[j]) { reach[j] = 1; q.push(j); } } }
      return m.sites.every(s => reach[s.y * n + s.x]); };
    const bad = [], shapes = new Set(), water = {}, snow = {}, sand = {};
    for (const L of LAND_TYPES) for (const n of [36, 72, 144]) for (let seed = 1; seed <= 6; seed++) {
      const m = generateMap(n, seed * 31 + n, L.id); shapes.add(m.shape);
      if (!reachOk(m)) bad.push(`${L.id} ${n} ${seed} ${m.shape}: miasto nieosiągalne`);
      if (m.sites.length < SITE_COUNT[n]) bad.push(`${L.id} ${n} ${seed} ${m.shape}: miejsc ${m.sites.length}/${SITE_COUNT[n]}`);
      if (n === 72) { const N = n * n; let w = 0, s = 0, d = 0; for (let i = 0; i < N; i++) { if (m.terrain[i] === TER.WATER) w++; if (m.terrain[i] === TER.SNOW) s++; if (m.terrain[i] === TER.SAND) d++; }
        water[m.land] = (water[m.land] || 0) + w / N / 6; snow[m.land] = (snow[m.land] || 0) + s / N / 6; sand[m.land] = (sand[m.land] || 0) + d / N / 6; }
    }
    return { bad, shapes: [...shapes].sort(), water, snow, sand };
  });
  assert.deepEqual(r.bad, []);
  assert.deepEqual(r.shapes, ['coast', 'continent', 'inland', 'islands', 'isthmus', 'lakes']);
  assert.ok(r.snow.frost > r.snow.mixed * 2.5, `mroźna: śniegu ${r.snow.frost.toFixed(2)} vs ${r.snow.mixed.toFixed(2)}`);
  assert.ok(r.sand.desert > r.sand.mixed * 2.5, `pustynna: piasku ${r.sand.desert.toFixed(2)} vs ${r.sand.mixed.toFixed(2)}`);
  assert.ok(r.water.islands > r.water.mixed * 1.5, `wyspiarska: wody ${r.water.islands.toFixed(2)} vs ${r.water.mixed.toFixed(2)}`);
});

test('krainy są duże: drobnych skrawków terenu (poniżej 10 pól, bez plaż i pogórza) jest mniej niż 5% lądu', async () => {
  const r = await page.evaluate(() => { const out = [];
    for (const L of ['mixed', 'mountains', 'forest', 'desert', 'frost', 'marsh', 'islands']) for (const n of [72, 144]) { const m = generateMap(n, 77, L), N = n * n, seen = new Uint8Array(N); let land = 0, small = 0;
      for (let s = 0; s < N; s++) { if (seen[s] || m.terrain[s] === TER.WATER) continue; const t = m.terrain[s], list = [s]; seen[s] = 1;
        for (let k = 0; k < list.length; k++) { const i = list[k], x = i % n, y = (i / n) | 0; for (let d = 0; d < 4; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X >= 0 && Y >= 0 && X < n && Y < n && !seen[j] && m.terrain[j] === t) { seen[j] = 1; list.push(j); } } }
        land += list.length; if (list.length < 10 && t !== TER.SAND && t !== TER.ROUGH) small += list.length; }
      out.push([L, n, small / land]); }
    return out; });
  for (const [L, n, v] of r) assert.ok(v < 0.05, `${L} ${n}: ${(v * 100).toFixed(1)}% lądu w drobnych skrawkach`);
});

test('budynki (miasta, kopalnie, skarbce) nie stoją na drodze ani tuż przy niej', async () => {
  const r = await page.evaluate(() => { const out = [];
    for (const [size, seed, land] of [['S', 1, 'mixed'], ['M', 4242, 'forest'], ['L', 21, 'islands'], ['M', 7, 'mountains']]) { const S = Object.assign({}, G.settings, { mapSize: size, land, difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 1, slots: null, underground: false });
      const st = createNewGame(S, seed), m = st.map, n = m.n; let bad = 0, tot = 0;
      for (const o of st.objects) { if (o.dead || !['site', 'mine', 'bank'].includes(o.type)) continue; tot++; let near = false;
        for (const i of [o.y * n + o.x, ...(o.blocks || [])]) { const x = i % n, y = (i / n) | 0; for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && m.road[Y * n + X]) near = true; } }
        if (near) bad++; }
      out.push([`${size}/${land}`, tot, bad]); }
    return out; });
  for (const [k, tot, bad] of r) { assert.ok(tot > 10, `${k}: budynków ${tot}`); assert.equal(bad, 0, `${k}: ${bad} z ${tot} budynków przy drodze`); }
});

test('większość miejsc, skrzyń i artefaktów ma strażnika; surowce, skrzynie i artefakty nie chowają się w gąszczu', async () => {
  const r = await page.evaluate(() => { const out = [];
    for (const [size, seed] of [['M', 9], ['L', 31]]) { const S = Object.assign({}, G.settings, { mapSize: size, land: 'mixed', difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 1, slots: null, underground: false });
      const st = createNewGame(S, seed), alive = st.objects.filter(o => !o.dead), near = (o, d) => alive.some(m => m.type === 'monster' && Math.max(Math.abs(m.x - o.x), Math.abs(m.y - o.y)) <= d);
      const homeT = st.towns.filter(t => t.owner >= 0), far = o => Math.min(...homeT.map(t => Math.hypot(t.x - o.x, t.y - o.y))) > 12;
      const sites = alive.filter(o => o.type === 'site' && SITES[o.kind].per && !UNGUARDED_SITES.includes(o.kind) && far(o));
      const loot = alive.filter(o => (o.type === 'chest' || o.type === 'art') && far(o));
      out.push([size, sites.filter(o => near(o, 2)).length / sites.length, alive.filter(o => ['res', 'chest', 'art'].includes(o.type) && o.hid).length, loot.filter(o => near(o, 2)).length / loot.length]); }
    return out; });
  for (const [size, guarded, hidRes, loot] of r) { assert.ok(guarded >= 0.85, `${size}: pilnowanych ${(guarded * 100).toFixed(0)}% miejsc`); assert.equal(hidRes, 0, `${size}: ukryte surowce, skrzynie, artefakty`);
    assert.ok(loot >= 0.85, `${size}: pilnowanych ${(loot * 100).toFixed(0)}% skrzyń i artefaktów`); }
});

test('bez przestojów: z każdego startu da się wyjść, walcząc z oddziałami w zasięgu armii (kieszeń startu nie zamknięta silnym strażnikiem)', async () => {
  const r = await page.evaluate(() => { const out = [];
    for (const [size, land, seed] of [['M', 'forest', 4242], ['M', 'mountains', 7], ['M', 'mixed', 9], ['L', 'islands', 21]]) {
      const S = Object.assign({}, G.settings, { mapSize: size, land, difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 1, slots: null, underground: false });
      const st = createNewGame(S, seed), m = st.map, n = m.n, pw = o => o.count * CREATURES[o.cid].value;
      for (const h of st.heroes) { const army = armyPower(h.army), d = new Uint8Array(n * n), q = [h.y * n + h.x]; d[q[0]] = 1; let land = 0;
        for (let i = 0; i < n * n; i++) if (m.terrain[i] !== TER.WATER && !m.obst[i]) land++;
        for (let i = 0; i < q.length; i++) { const c = q[i], x = c % n, y = (c / n) | 0;
          for (let dd = 0; dd < 8; dd++) { const X = x + DX8[dd], Y = y + DY8[dd], j = Y * n + X; if (X < 0 || Y < 0 || X >= n || Y >= n || d[j] || m.terrain[j] === TER.WATER || m.obst[j]) continue;
            const ob = objectAt(st, j); if (ob && ob.type !== 'monster' && ob.type !== 'town') continue; const g = st.guard[j] && st.objects[st.guard[j] - 1]; if (g && !g.dead && pw(g) > army) continue; d[j] = 1; q.push(j); } }
        out.push([`${size}/${land} gracz ${h.owner}`, q.length / land]); } }
    return out; });
  for (const [k, part] of r) assert.ok(part >= 0.1, `${k}: bez walki z silniejszymi dostępne ${(part * 100).toFixed(0)}% lądu`);
});

test('mapy gigantyczna (180) i bezkresna (216): komplet miejsc na miasta, wszystkie osiągalne; gra z 8 graczami startuje', async () => {
  const r = await page.evaluate(() => {
    const bad = []; for (const n of [180, 216]) for (const land of ['mixed', 'islands']) {
      const m = generateMap(n, n * 7 + land.length, land), N = n * n, reach = new Uint8Array(N), q = [m.start.y * n + m.start.x]; reach[q[0]] = 1;
      while (q.length) { const i = q.pop(), x = i % n, y = (i / n) | 0; for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X >= 0 && Y >= 0 && X < n && Y < n && !reach[j] && m.terrain[j] !== TER.WATER && !m.obst[j]) { reach[j] = 1; q.push(j); } } }
      if (m.sites.length < SITE_COUNT[n]) bad.push(`${n} ${land}: miejsc ${m.sites.length}/${SITE_COUNT[n]}`);
      if (land === 'mixed' && !m.sites.every(s => reach[s.y * n + s.x])) bad.push(`${n} ${land}: miasto nieosiągalne`); }
    const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'G', land: 'mixed', slots: null, opponents: 7, underground: false }), 3);
    return { bad, players: st.players.length, towns: st.towns.length, sizes: MAP_SIZES.map(m => m.id) };
  });
  assert.deepEqual(r.bad, []); assert.equal(r.players, 8); assert.equal(r.towns, 14); assert.deepEqual(r.sizes, ['S', 'M', 'L', 'XL', 'XXL', 'G']);
});
