// ==================== ŚWIAT: TWORZENIE NOWEJ GRY ========================================
// Generator mapy, rozmieszczanie obiektów, miasta i bohaterowie startowi.
function smoothTerrain(ter, n) {
  for (let pass = 0; pass < 2; pass++) {
    const src = ter.slice();
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x, own = src[i], cnt = [0, 0, 0, 0, 0, 0, 0, 0]; let same = 0;
      for (let d = 0; d < 8; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const t = src[ny * n + nx]; cnt[t]++; if (t === own) same++; }
      if (same <= 1) { let best = own, bc = -1; for (let t = 0; t < 8; t++) if (t !== own && cnt[t] > bc) { bc = cnt[t]; best = t; } ter[i] = best; }
    }
  }
}
function generateMap(n, seed) {
  const rng = mulberry32(seed ^ 0x5bd1e995);
  const nE = makeNoise(rng), nM = makeNoise(rng), nT = makeNoise(rng), nF = makeNoise(rng), nV = makeNoise(rng);
  const N = n * n, terrain = new Uint8Array(N), obst = new Uint8Array(N), road = new Uint8Array(N);
  const elev = new Float32Array(N), moist = new Float32Array(N), temp = new Float32Array(N), forest = new Float32Array(N), volc = new Float32Array(N);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, edge = clamp(Math.min(x, y, n - 1 - x, n - 1 - y) / Math.max(4, n * 0.1), 0, 1);
    elev[i] = nE(x / 14, y / 14) - (1 - edge) * 0.3;
    moist[i] = nM(x / 11, y / 11);
    temp[i] = nT(x / 22, y / 22) * 0.55 + (y / n) * 0.45;
    forest[i] = nF(x / 7, y / 7);
    volc[i] = nV(x / 6, y / 6);
  }
  const qWater = quantile(elev, 0.2), qMount = quantile(elev, 0.93), qRough = quantile(elev, 0.8);
  const qCold = quantile(temp, 0.16), qHot = quantile(temp, 0.8), qSwamp = quantile(moist, 0.88), qDry = quantile(moist, 0.35), qMid = quantile(moist, 0.6);
  const qVolc = quantile(volc, 0.85), qForest = quantile(forest, 0.68);
  for (let i = 0; i < N; i++) {
    const e = elev[i], m = moist[i], t = temp[i];
    if (e < qWater) terrain[i] = TER.WATER;
    else if (t < qCold) terrain[i] = TER.SNOW;
    else if (t > qHot) terrain[i] = volc[i] > qVolc ? TER.LAVA : (m < qMid ? TER.SAND : TER.DIRT);
    else if (m > qSwamp) terrain[i] = TER.SWAMP;
    else if (e > qRough) terrain[i] = TER.ROUGH;
    else terrain[i] = m > qDry ? TER.GRASS : TER.DIRT;
  }
  smoothTerrain(terrain, n);
  // plaże wzdłuż wybrzeża
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x; if (terrain[i] === TER.WATER || terrain[i] === TER.SNOW) continue;
    let coast = false; for (let d = 0; d < 4; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx >= 0 && ny >= 0 && nx < n && ny < n && terrain[ny * n + nx] === TER.WATER) coast = true; }
    if (coast && thash(x, y, seed) % 10 < 8) terrain[i] = TER.SAND;
  }
  // przeszkody: góry, lasy, skały
  for (let i = 0; i < N; i++) {
    if (terrain[i] === TER.WATER) continue; const r = rng();
    if (elev[i] > qMount) obst[i] = OBST.MOUNT;
    else if (forest[i] > qForest && terrain[i] !== TER.SAND && r < 0.8) obst[i] = OBST.TREE;
    else if (terrain[i] === TER.SAND && forest[i] > qForest && r < 0.25) obst[i] = OBST.TREE;
    else if (r < 0.025) obst[i] = OBST.ROCK;
    else if (r < 0.045) obst[i] = OBST.TREE;
  }
  // największy spójny ląd
  const comp = new Int32Array(N).fill(-1); let best = -1, bestSize = 0, cid = 0;
  for (let s = 0; s < N; s++) {
    if (terrain[s] === TER.WATER || comp[s] >= 0) continue;
    let size = 0; const stack = [s]; comp[s] = cid;
    while (stack.length) {
      const i = stack.pop(); size++; const x = i % n, y = (i / n) | 0;
      for (let d = 0; d < 8; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const j = ny * n + nx; if (terrain[j] !== TER.WATER && comp[j] < 0) { comp[j] = cid; stack.push(j); } }
    }
    if (size > bestSize) { bestSize = size; best = cid; } cid++;
  }
  // miejsca pod przyszłe miasta
  const cand = [];
  for (let y = 4; y < n - 4; y++) for (let x = 4; x < n - 4; x++) {
    if (comp[y * n + x] !== best) continue; let ok = true;
    for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (terrain[(y + dy) * n + x + dx] === TER.WATER) { ok = false; break; }
    if (ok) cand.push([x, y]);
  }
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  const want = SITE_COUNT[n] || 4; let sites = [];
  for (let dmin = n * 0.9 / Math.sqrt(want); dmin > 2 && sites.length < want; dmin *= 0.85) {
    sites = [];
    for (const [x, y] of cand) { if (sites.every(s => Math.hypot(s.x - x, s.y - y) >= dmin)) { sites.push({ x, y }); if (sites.length >= want) break; } }
  }
  if (!sites.length) sites = [{ x: n >> 1, y: n >> 1 }];
  if (sites.length > 2) { // drugi = najdalej od gracza (przyszły przeciwnik)
    let fi = 1, fd = -1; sites.forEach((s, k) => { const d = Math.hypot(s.x - sites[0].x, s.y - sites[0].y); if (k && d > fd) { fd = d; fi = k; } });
    [sites[1], sites[fi]] = [sites[fi], sites[1]];
  }
  sites.forEach((s, k) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = s.x + dx, y = s.y + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue;
      const i = y * n + x; obst[i] = OBST.NONE; if ((k === 0 && dx * dx + dy * dy <= 6) || terrain[i] === TER.WATER) terrain[i] = TER.GRASS;
    }
  });
  // drogi: minimalne drzewo rozpinające + jedna pętla
  const edges = [], inTree = [0], rest = sites.map((_, i) => i).slice(1);
  while (rest.length) {
    let bi = -1, bj = -1, bd = Infinity;
    for (const a of inTree) for (const b of rest) { const d = Math.hypot(sites[a].x - sites[b].x, sites[a].y - sites[b].y); if (d < bd) { bd = d; bi = a; bj = b; } }
    edges.push([bi, bj]); inTree.push(bj); rest.splice(rest.indexOf(bj), 1);
  }
  if (sites.length > 3) {
    let pair = null, pd = Infinity;
    for (let a = 0; a < sites.length; a++) for (let b = a + 1; b < sites.length; b++) {
      if (edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) continue;
      const d = Math.hypot(sites[a].x - sites[b].x, sites[a].y - sites[b].y); if (d < pd) { pd = d; pair = [a, b]; }
    }
    if (pair) edges.push(pair);
  }
  const roadCost = (j, i, diag) => {
    if (terrain[j] === TER.WATER) return Infinity;
    const x = j % n, y = (j / n) | 0;
    if (diag) { const px = i % n, py = (i / n) | 0; if (terrain[py * n + x] === TER.WATER || terrain[y * n + px] === TER.WATER) return Infinity; }
    if (road[j]) return 0.3;
    let c = TERRAINS[terrain[j]].cost / 100; if (obst[j] === OBST.MOUNT) c += 25; else if (obst[j]) c += 4;
    return c + (thash(x, y, seed) % 100) / 300;
  };
  edges.forEach(([a, b], k) => {
    const type = (a === 0 || b === 0) ? 3 : (k % 2 ? 2 : 1);
    const p = findPath(n, sites[a].x, sites[a].y, sites[b].x, sites[b].y, roadCost, 0.3); if (!p) return;
    for (const i of p) { road[i] = Math.max(road[i], type); obst[i] = OBST.NONE; }
  });
  return { n, seed, terrain, obst, road, sites, start: sites[0] };
}
function placeObjects(st) {
  const map = st.map, n = map.n, N = n * n, rng = mulberry32(st.seed ^ 0xabcdef), objs = [], occ = new Uint8Array(N);
  for (const s of map.sites) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = s.x + dx, y = s.y + dy; if (x >= 0 && y >= 0 && x < n && y < n) occ[y * n + x] = 1; }
  const reach = new Uint8Array(N), q = [map.start.y * n + map.start.x]; reach[q[0]] = 1;
  while (q.length) {
    const i = q.pop(), x = i % n, y = (i / n) | 0;
    for (let d = 0; d < 8; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const j = ny * n + nx; if (!reach[j] && map.terrain[j] !== TER.WATER && !map.obst[j]) { reach[j] = 1; q.push(j); } }
  }
  const ok = (x, y) => x >= 1 && y >= 1 && x < n - 1 && y < n - 1 && reach[y * n + x] && !occ[y * n + x];
  const dStart = (x, y) => Math.hypot(x - map.start.x, y - map.start.y), d01 = (x, y) => clamp(dStart(x, y) / (n * 0.75), 0, 1);
  const pick = (cond, tries = 500) => { for (let k = 0; k < tries; k++) { const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)); if (ok(x, y) && cond(x, y)) return [x, y]; } return null; };
  const add = (o, tiles) => { o.id = objs.length; objs.push(o); for (const i of tiles) occ[i] = 1; return o; };
  const monster = (x, y, boost = 0) => {
    const dd = d01(x, y), lvl = clamp(1 + Math.floor(dd * 3.2 + rng() * 1.6) + boost, 1, 5), list = NEUTRALS_BY_LEVEL[lvl];
    const base = { 1: [10, 22], 2: [6, 14], 3: [4, 10], 4: [3, 6], 5: [2, 4] }[lvl];
    const count = Math.max(1, Math.round((base[0] + rng() * (base[1] - base[0])) * (0.8 + dd * 0.8)));
    return add({ type: 'monster', cid: list[Math.floor(rng() * list.length)], count, x, y, dir: rng() < 0.5 ? -1 : 1 }, [y * n + x]);
  };
  const placeMine = (kind, near, dmin, dmax) => {
    const p = pick((x, y) => {
      const d = Math.hypot(x - near.x, y - near.y); if (d < dmin || d > dmax || y + 1 >= n) return false;
      for (const [dx, dy] of [[-1, 0], [-1, -1], [0, -1]]) { const j = (y + dy) * n + x + dx; if (map.terrain[j] === TER.WATER || map.obst[j] || occ[j] || map.road[j]) return false; }
      const f = (y + 1) * n + x; return map.terrain[f] !== TER.WATER && !map.obst[f];
    }, 800);
    if (!p) return null; const [x, y] = p, blocks = [y * n + x - 1, (y - 1) * n + x - 1, (y - 1) * n + x];
    const m = add({ type: 'mine', kind, x, y, owner: -1, blocks }, [y * n + x, ...blocks]); occ[(y + 1) * n + x] = 1; return m;
  };
  const guard = (m, boost) => { for (const [dx, dy] of [[1, 0], [1, 1], [-1, 1], [1, -1]]) { const x = m.x + dx, y = m.y + dy; if (ok(x, y) && dStart(x, y) >= 6) { monster(x, y, boost); return; } } };
  map.sites.forEach((s, k) => {
    for (const kind of ['wood', 'ore']) { const m = placeMine(kind, s, 4, 9); if (m && k !== 0) guard(m, 0); }
    const m = placeMine(RARE[Math.floor(rng() * 4)], s, 6, 14); if (m) guard(m, 0);
  });
  for (let g = 0; g < Math.max(1, Math.floor(map.sites.length / 2)); g++) { const m = placeMine('gold', map.start, n * 0.25, n * 2); if (m) guard(m, 1); }
  for (let k = Math.round(N / 90); k > 0; k--) {
    const p = pick((x, y) => dStart(x, y) >= 2); if (!p) continue; const res = RESOURCES[Math.floor(rng() * 7)].id;
    const amount = res === 'gold' ? 500 + Math.floor(rng() * 6) * 100 : (res === 'wood' || res === 'ore') ? 5 + Math.floor(rng() * 6) : 3 + Math.floor(rng() * 4);
    add({ type: 'res', res, amount, x: p[0], y: p[1] }, [p[1] * n + p[0]]);
  }
  for (let k = Math.round(N / 300); k > 0; k--) {
    const p = pick((x, y) => dStart(x, y) >= 3); if (!p) continue; const v = Math.floor(rng() * 3);
    add({ type: 'chest', gold: 1000 + v * 500, exp: 500 + v * 500, x: p[0], y: p[1] }, [p[1] * n + p[0]]);
  }
  for (let k = Math.round(N / 260); k > 0; k--) { const p = pick((x, y) => dStart(x, y) >= 6); if (p) monster(p[0], p[1]); }
  // artefakty: im dalej od startu, tym rzadsze; każdego pilnuje potwór
  for (let k = Math.max(3, Math.round(N / 420)); k > 0; k--) {
    const p = pick((x, y) => dStart(x, y) >= 7); if (!p) continue;
    const dd = d01(p[0], p[1]), rar = dd > 0.6 && rng() < 0.5 ? 'major' : dd > 0.3 ? 'minor' : 'treasure', pool = ARTS_BY_RARITY(rar);
    const a = add({ type: 'art', art: pool[Math.floor(rng() * pool.length)], x: p[0], y: p[1] }, [p[1] * n + p[0]]);
    guard(a, rar === 'major' ? 2 : rar === 'minor' ? 1 : 0);
  }
  // miejsca (SITES): liczba wg gęstości, na małej mapie rzadsze z losowaniem; część pilnują potwory
  for (const [kind, S] of Object.entries(SITES)) {
    const want = N / S.per, cnt = Math.floor(want) + (rng() < want % 1 ? 1 : 0);
    for (let k = 0; k < cnt; k++) {
      const p = pick((x, y) => dStart(x, y) >= (S.guard ? 7 : 4)); if (!p) continue;
      const o = { type: 'site', kind, x: p[0], y: p[1], seen: {} };
      if (kind === 'shrine') { const L = d01(p[0], p[1]) > 0.5 ? 2 : 1, pool = Object.keys(SPELLS).filter(id => SPELLS[id].level === L); o.spell = pool[Math.floor(rng() * pool.length)]; }
      if (kind === 'windmill') o.res = RARE[Math.floor(rng() * RARE.length)];
      add(o, [p[1] * n + p[0]]); if (S.guard) guard(o, 0);
    }
  }
  return objs;
}
function createTown(st, x, y, owner, fac = 'haven') {
  const F = factionOf(fac), names = F.towns, nat = F.terrain, n0 = st.map.n;
  const used = new Set(st.towns.map(t => t.name)), k0 = thash(x, y, st.seed) % names.length;
  const name = names.map((_, k) => names[(k0 + k) % names.length]).find(nm => !used.has(nm)) || names[k0];
  const t = { id: st.towns.length, x, y, owner, name, faction: fac, built: ['hall1'], builtToday: false, garrison: emptyArmy(), avail: {} };
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const tx = x + dx, ty = y + dy; if (dx * dx + dy * dy <= 6 && tx >= 0 && ty >= 0 && tx < n0 && ty < n0 && st.map.terrain[ty * n0 + tx] !== TER.WATER) st.map.terrain[ty * n0 + tx] = nat; }
  st.towns.push(t);
  const n = st.map.n, blocks = [];
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0]]) { const bx = x + dx, by = y + dy; if (bx >= 0 && by >= 0 && bx < n && by < n) blocks.push(by * n + bx); }
  st.objects.push({ id: st.objects.length, type: 'town', townId: t.id, x, y, owner, blocks });
  return t;
}
// Miasto niezależne w miejscu startowym: losowa frakcja, garnizon tym silniejszy, im dalej od gracza
// (i im wyższy poziom trudności). Daleko stoją też mury (oblężenie w bitwie).
function createNeutralTown(st, site, rng) {
  const n = st.map.n, dd = clamp(Math.hypot(site.x - st.map.start.x, site.y - st.map.start.y) / (n * 0.75), 0, 1);
  const fac = FACTIONS[Math.floor(rng() * FACTIONS.length)].id, t = createTown(st, site.x, site.y, -1, fac), F = factionOf(fac);
  t.built.push('dw1', 'dw2'); if (dd > 0.45) t.built.push('fort', 'dw3'); if (dd > 0.8) t.built.push('tavern');
  const k = (0.8 + dd * 1.4) * DIFFICULTIES[st.settings.difficulty].rating / 100;
  const troops = [[1, 14, 8], [2, 7, 4]]; if (dd > 0.4) troops.push([3, 4, 3]); if (dd > 0.7) troops.push([4, 2, 2]);
  troops.forEach(([L, base, spread], i) => { t.garrison[i] = { cid: F.dw['dw' + L][1], n: Math.max(1, Math.round((base + rng() * spread) * k)) }; });
  return t;
}
// pick = { name, cls, female, fac } z tawerny; bez niego losujemy bohatera frakcji gracza
function createHero(st, owner, x, y, pick = null) {
  const id = st.heroes.reduce((m, h) => Math.max(m, h.id + 1), 0); // pokonani bohaterowie znikają z listy, więc nie liczymy po długości
  const pool = factionOf(st.players[owner].faction).heroes, r = mulberry32(st.seed ^ 0x1234 ^ (id * 977));
  const P = pick || (([name, cls, female]) => ({ name, cls, female: !!female, fac: st.players[owner].faction }))(pool[Math.floor(r() * pool.length)]);
  const { name, cls, female } = P;
  const h = { id, owner, name, cls, female: !!female, x, y, dir: 1, sight: HERO_SIGHT, exp: 0, asleep: false, army: startingArmy(P.fac, r),
    path: null, dest: null, moving: false, stop: false, anim: null, prev: null, pending: null };
  initHeroProgress(h); h.mp = heroMaxMP(h); st.heroes.push(h); return h;
}
// Cały świat powstaje tutaj, zanim pokaże się jakikolwiek ekran. Stan (st) nie zawiera nic z grafiki,
// dlatego da się go później zapisać i wczytać (krok 14).
// seed podaje się tylko w testach (powtarzalny świat); w grze jest losowy.
function createNewGame(S, seed = (Math.random() * 1e9) | 0) {
  const rng = mulberry32(seed), d = DIFFICULTIES[S.difficulty];
  const resources = { ...d.res }; let bonusText = '';
  if (S.bonus === 'gold') { const g = 500 + Math.floor(rng() * 6) * 100; resources.gold += g; bonusText = `+${g} złota`; }
  else if (S.bonus === 'resource') { const a = 5 + Math.floor(rng() * 6); resources.wood += a; resources.ore += a; bonusText = `+${a} drewna i rudy`; }
  const st = { seed, day: 1, week: 1, month: 1, dayTotal: 1, settings: { ...S }, bonusText, selHero: 0, cam: null,
    players: [{ id: ME, color: S.color, human: true, faction: S.faction, resources }], heroes: [], towns: [], objects: [] };
  const map = st.map = generateMap(MAP_SIZES.find(m => m.id === S.mapSize).n, seed);
  human(st).explored = new Uint8Array(map.n * map.n);
  st.objects = placeObjects(st);
  createTown(st, map.start.x, map.start.y, ME, S.faction);
  // przeciwnicy komputerowi w kolejnych miejscach startowych (drugie = najdalej od gracza), reszta miast jest niezależna
  const trng = mulberry32(seed ^ 0x70a7), others = map.sites.filter(s => s !== map.start), foes = others.slice(0, clamp(S.opponents == null ? 1 : S.opponents, 0, others.length));
  const colors = PLAYER_COLORS.filter(c => c.id !== S.color);
  foes.forEach((s, k) => {
    const id = st.players.length, fac = FACTIONS[Math.floor(trng() * FACTIONS.length)].id;
    st.players.push({ id, color: colors[k % colors.length].id, human: false, faction: fac, resources: { ...DIFFICULTIES[1].res }, explored: new Uint8Array(map.n * map.n) });
    createTown(st, s.x, s.y, id, fac);
  });
  for (const s of others.slice(foes.length)) createNeutralTown(st, s, trng);
  rebuildObjIndex(st);
  const h = createHero(st, ME, map.start.x, map.start.y);
  for (const p of st.players) if (!p.human) createHero(st, p.id, st.towns.find(t => t.owner === p.id).x, st.towns.find(t => t.owner === p.id).y);
  if (S.bonus === 'artifact') { const pool = ARTS_BY_RARITY('treasure'), id = pool[Math.floor(rng() * pool.length)]; giveArtifact(h, id); st.bonusText = `artefakt: ${ARTIFACTS[id].name}`; h.mp = heroMaxMP(h); }
  reveal(st, h.x, h.y, HERO_SIGHT + 1);
  for (const o of st.heroes) if (o.owner !== ME) reveal(st, o.x, o.y, HERO_SIGHT + 1, o.owner);
  return st;
}
function startNewGame() { saveSettings(); G.state = createNewGame(G.settings); G.go('adventure', { welcome: true }); }

