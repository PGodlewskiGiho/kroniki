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
// Skrawki terenu mniejsze niż minSize pól (łata śniegu w lesie, pół pola pustyni) wchłania otaczający teren: krainy są spójne
function cleanupBiomes(ter, n, minSize) {
  const N = n * n, comp = new Int32Array(N).fill(-1); let cid = 0;
  for (let s = 0; s < N; s++) { if (comp[s] >= 0 || ter[s] === TER.WATER) continue; const t = ter[s], list = [s]; comp[s] = cid;
    for (let k = 0; k < list.length; k++) { const i = list[k], x = i % n, y = (i / n) | 0;
      for (let d = 0; d < 4; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X >= 0 && Y >= 0 && X < n && Y < n && comp[j] < 0 && ter[j] === t) { comp[j] = cid; list.push(j); } } }
    if (list.length < minSize) { const cnt = {}; for (const i of list) { const x = i % n, y = (i / n) | 0; for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d]; if (X < 0 || Y < 0 || X >= n || Y >= n) continue; const u = ter[Y * n + X]; if (u !== t && u !== TER.WATER) cnt[u] = (cnt[u] || 0) + 1; } }
      const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; if (best) for (const i of list) ter[i] = +best[0]; }
    cid++; }
}
// Teren jak w podróży: pasma górskie (grzbiety szumu) z przełęczami i pogórzem, zwarte puszcze z polanami i rzadkim skrajem,
// rzeki spływające z gór do morza (brody co kilka pól), otwarte doliny między nimi z pojedynczymi drzewami i głazami.
// land: rodzaj krainy (LAND_TYPES), kształt świata i kierunek klimatu losowane z ziarna – każda mapa inna
function generateMap(n, seed, land = 'random') {
  const rng = mulberry32(seed ^ 0x5bd1e995), lr = mulberry32(seed ^ 0x1a2b3c);
  const pickL = land === 'random' ? (() => { const w = { mixed: 3, mountains: 2, forest: 2, desert: 1, frost: 1, marsh: 1, islands: 1 }, tot = Object.values(w).reduce((a, b) => a + b, 0); let r = lr() * tot; for (const [k, v] of Object.entries(w)) if ((r -= v) < 0) return k; return 'mixed'; })() : land;
  const LT = LAND_TYPES.find(l => l.id === pickL) || LAND_TYPES[1], shapes = LT.shapes || ['continent', 'continent', 'coast', 'coast', 'inland', 'isthmus', 'lakes'], shape = shapes[Math.floor(lr() * shapes.length)];
  const ca = lr() * Math.PI * 2, cs = Math.cos(ca), sn = Math.sin(ca), side = Math.floor(lr() * 4), side2 = lr() < 0.5 ? (side + 1) % 4 : -1, ia = lr() * Math.PI, ic = [lr() < 0.5 ? -0.22 : 0.22, (lr() - 0.5) * 0.3];
  const shapeElev = (x, y) => { // dodatek do wysokości: gdzie ma być morze
    const u = x / (n - 1), v = y / (n - 1), eA = Math.min(x, y, n - 1 - x, n - 1 - y) / Math.max(4, n * 0.1), fall = k => -(1 - clamp(k, 0, 1)) * 0.3;
    if (shape === 'continent') return fall(eA);
    if (shape === 'coast') { const d = [y, n - 1 - x, n - 1 - y, x], e1 = d[side], e2 = side2 >= 0 ? d[side2] : 1e9; return fall(Math.min(e1, e2) / Math.max(4, n * 0.16)) - 0.02; }
    if (shape === 'inland') { const r = Math.hypot(u - 0.5, v - 0.5); return -0.32 * clamp(1 - r / 0.3, 0, 1) + fall(eA) * 0.25; }
    if (shape === 'isthmus') { const d = Math.abs((u - 0.5) * Math.sin(ia) - (v - 0.5) * Math.cos(ia)), t = (u - 0.5) * Math.cos(ia) + (v - 0.5) * Math.sin(ia), bridge = ic.some(c => Math.abs(t - c) < 0.045);
      return (bridge ? 0.05 : -0.36 * clamp(1 - d / 0.075, 0, 1)) + fall(eA) * 0.6; }
    if (shape === 'islands') return fall(eA) * 1.2 + (nI(x / 5, y / 5) - 0.5) * 0.35; // poszarpane wybrzeże i wysepki
    return 0; // lakes: bez morza, woda tylko w nieckach
  };
  const nI = makeNoise(lr);
  const nE = makeNoise(rng), nM = makeNoise(rng), nT = makeNoise(rng), nF = makeNoise(rng), nV = makeNoise(rng), nG = makeNoise(rng), nW = makeNoise(rng), nC = makeNoise(rng);
  const N = n * n, terrain = new Uint8Array(N), obst = new Uint8Array(N), road = new Uint8Array(N);
  const elev = new Float32Array(N), moist = new Float32Array(N), temp = new Float32Array(N), forest = new Float32Array(N), volc = new Float32Array(N), clear = new Float32Array(N);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    // duże skale szumu: krainy (śnieg, pustynia, bagna, puszcze) ciągną się po kilkadziesiąt pól, bez drobnych łat
    elev[i] = nE(x / 18, y / 18) + shapeElev(x, y);
    moist[i] = nM(x / 26, y / 26);
    temp[i] = nT(x / 40, y / 40) * 0.45 + (((x / n - 0.5) * cs + (y / n - 0.5) * sn) + 0.5) * 0.55; // klimat: chłodniej w jedną stronę (losowy kierunek)
    forest[i] = nF(x / 16, y / 16) * 0.7 + moist[i] * 0.3;
    volc[i] = nV(x / 12, y / 12);
    clear[i] = nC(x / 3.2, y / 3.2);
  }
  const qWater = quantile(elev, shape === 'lakes' ? Math.min(LT.water, 0.1) : LT.water), qRough = quantile(elev, 0.8);
  const qCold = quantile(temp, LT.cold), qHot = quantile(temp, 1 - LT.hot), qSwamp = quantile(moist, LT.swamp), qDry = quantile(moist, 0.35), qMid = quantile(moist, LT.sandM || 0.6); // qMid: w upale piasek poniżej tej wilgotności
  const qVolc = quantile(volc, 0.85), qForest = quantile(forest, LT.forest), qClear = quantile(clear, 0.86);
  for (let i = 0; i < N; i++) {
    const e = elev[i], m = moist[i], t = temp[i];
    if (e < qWater) terrain[i] = TER.WATER;
    else if (t < qCold) terrain[i] = TER.SNOW;
    else if (t > qHot) terrain[i] = volc[i] > qVolc ? TER.LAVA : (m < qMid ? TER.SAND : TER.DIRT);
    else if (m > qSwamp && e < qRough) terrain[i] = TER.SWAMP; // bagna w nizinach
    else if (e > qRough) terrain[i] = TER.ROUGH;
    else terrain[i] = m > qDry ? TER.GRASS : TER.DIRT;
  }
  smoothTerrain(terrain, n); cleanupBiomes(terrain, n, Math.max(14, Math.round(N / 300)));
  // plaże wzdłuż wybrzeża
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x; if (terrain[i] === TER.WATER || terrain[i] === TER.SNOW) continue;
    let coast = false; for (let d = 0; d < 4; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx >= 0 && ny >= 0 && nx < n && ny < n && terrain[ny * n + nx] === TER.WATER) coast = true; }
    if (coast && thash(x, y, seed) % 10 < 8) terrain[i] = TER.SAND;
  }
  // pasma górskie: kręte grzbiety (kierunek powoli skręca), grubsze w środku, z przełęczami co 9–15 pól i bocznymi odnogami;
  // zaczynają się wysoko (elev) i omijają wodę oraz wybrzeże
  const coastAt = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && terrain[Y * n + X] === TER.WATER) return true; } return false; };
  const mount = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 2 || y < 2 || x >= n - 2 || y >= n - 2) return; const i = y * n + x; if (terrain[i] !== TER.WATER && !coastAt(x, y, 1)) obst[i] = OBST.MOUNT; };
  const chain = (x, y, ang, len, w0, spur) => {
    let nextGap = 5 + Math.floor(rng() * 8), gapLeft = 0;
    for (let k = 0; k < len; k++) {
      ang += (nW(x / 9, y / 9) - 0.5) * 0.9 + (rng() - 0.5) * 0.25; x += Math.cos(ang); y += Math.sin(ang);
      if (x < 3 || y < 3 || x >= n - 3 || y >= n - 3) break;
      if (--nextGap <= 0) { gapLeft = 2 + (rng() < 0.4 ? 1 : 0); nextGap = 9 + Math.floor(rng() * 7); } // przełęcz
      if (gapLeft > 0) { gapLeft--; continue; }
      const t = k / len, w = w0 * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)) * (0.7 + nG(x / 5, y / 5) * 0.8); // cieńsze na końcach
      const px = -Math.sin(ang), py = Math.cos(ang); for (let o = -w; o <= w; o += 0.5) mount(x + px * o, y + py * o);
      if (spur && rng() < 0.035) chain(x, y, ang + (rng() < 0.5 ? 1 : -1) * (0.9 + rng() * 0.6), len * (0.2 + rng() * 0.2), w0 * 0.6, false); // odnoga
    }
  };
  { const ranges = Math.max(1, Math.round(n / 16 * LT.ranges)), cands = [];
    for (let y = 6; y < n - 6; y += 2) for (let x = 6; x < n - 6; x += 2) { const i = y * n + x; if (terrain[i] !== TER.WATER && elev[i] > qRough * 0.97) cands.push([x, y, elev[i]]); }
    cands.sort((a, b) => b[2] - a[2]); const used = [];
    for (const [x, y] of cands) { if (used.length >= ranges) break; if (used.some(([a, b]) => Math.hypot(a - x, b - y) < n * 0.28 / Math.sqrt(LT.ranges))) continue; used.push([x, y]);
      const ang = rng() * Math.PI * 2, len = n * (0.35 + rng() * 0.3), w0 = (0.9 + rng() * 0.8) * (LT.rangeW || 1);
      chain(x, y, ang, len / 2, w0, true); chain(x, y, ang + Math.PI, len / 2, w0, true); } // od środka w obie strony
  }
  // pojedyncze szczyty na najwyższych wzniesieniach
  const qPeak = quantile(elev, 0.985); for (let y = 2; y < n - 2; y++) for (let x = 2; x < n - 2; x++) { const i = y * n + x; if (elev[i] > qPeak && terrain[i] !== TER.WATER && thash(x, y, seed + 3) % 3 === 0) obst[i] = OBST.MOUNT; }
  // pogórze: wokół gór teren nierówny i głazy
  const nearMt = new Uint8Array(N);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (obst[y * n + x] !== OBST.MOUNT) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n) nearMt[Y * n + X] = Math.max(nearMt[Y * n + X], 3 - Math.max(Math.abs(dx), Math.abs(dy))); } }
  for (let i = 0; i < N; i++) if (nearMt[i] && !obst[i] && (terrain[i] === TER.GRASS || terrain[i] === TER.DIRT) && thash(i, 7, seed) % 10 < nearMt[i] * 3) terrain[i] = TER.ROUGH;
  // rzeki: od podnóża gór w dół zbocza (i coraz dalej od źródła) do wody; płyną krętym korytem szerokości pola
  const rivers = [], wet = new Uint8Array(N);
  { const want = Math.max(1, Math.round(n / 14 * LT.rivers)), src = [];
    for (let i = 0; i < N; i++) if (nearMt[i] === 2 && !obst[i] && terrain[i] !== TER.WATER && terrain[i] !== TER.LAVA && terrain[i] !== TER.SAND) src.push(i);
    for (let k = src.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [src[k], src[j]] = [src[j], src[k]]; }
    for (const s0 of src) {
      if (rivers.length >= want) break; const sx = s0 % n, sy = (s0 / n) | 0; if (rivers.some(r => r.some(i => Math.hypot(i % n - sx, ((i / n) | 0) - sy) < n / 6 / Math.sqrt(LT.rivers)))) continue;
      const path = [], seen = new Set([s0]); let cur = s0, ok = false;
      for (let step = 0; step < n * 2; step++) {
        const x = cur % n, y = (cur / n) | 0; let best = -1, bv = Infinity;
        for (let d = 0; d < 4; d++) { const X = x + DX8[d], Y = y + DY8[d]; if (X < 1 || Y < 1 || X >= n - 1 || Y >= n - 1) continue; const j = Y * n + X; if (seen.has(j) || obst[j] === OBST.MOUNT) continue;
          const v = elev[j] - Math.hypot(X - sx, Y - sy) * 0.006 + (rng() - 0.5) * 0.03 - (terrain[j] === TER.WATER ? 1 : 0); if (v < bv) { bv = v; best = j; } }
        if (best < 0) break; if (terrain[best] === TER.WATER) { ok = true; break; } path.push(best); seen.add(best); cur = best;
      }
      if (ok && path.length >= 8) rivers.push(path);
    }
    for (const r of rivers) for (const i of r) { terrain[i] = TER.WATER; obst[i] = OBST.NONE; wet[i] = 1; }
    // brody: co 7–11 pól rzeki przejście (płycizna z piaskiem), żeby rzeka nie odcinała krain
    for (const r of rivers) for (let k = 3 + Math.floor(rng() * 4); k < r.length - 2; k += 7 + Math.floor(rng() * 5)) { const i = r[k]; terrain[i] = TER.SAND; wet[i] = 2; }
  }
  // lasy: zwarte puszcze (gęste wewnątrz, rzadsze na skraju) z polanami; poza lasem pojedyncze drzewa i głazy
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x; if (terrain[i] === TER.WATER || obst[i] || wet[i]) continue; const r = rng(), f = forest[i] - qForest, t = terrain[i];
    if (f > 0 && t !== TER.SAND && t !== TER.LAVA) { const dens = t === TER.SWAMP ? 0.45 : f > 0.04 ? 0.94 : 0.55 + f * 9; if (clear[i] < qClear && r < dens) obst[i] = OBST.TREE; } // polana: clear > qClear
    else if (t === TER.SAND && f > 0.02 && r < 0.2) obst[i] = OBST.TREE;
    else if (nearMt[i] && r < 0.06) obst[i] = OBST.ROCK;
    else if (r < 0.006) obst[i] = OBST.ROCK;
    else if (r < 0.018 && t !== TER.SAND && t !== TER.SNOW) obst[i] = OBST.TREE;
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
  // zabudowa miasta (pola x-1..x+1, y-1..y): drogi jej omijają i wchodzą bramą od południa (pole pod miastem)
  const townBlock = new Uint8Array(N); for (const s of sites) for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) { const x = s.x + dx, y = s.y + dy; if (x >= 0 && y >= 0 && x < n && y < n) townBlock[y * n + x] = 1; }
  const roadCost = (j, i, diag) => {
    if (terrain[j] === TER.WATER || townBlock[j]) return Infinity;
    const x = j % n, y = (j / n) | 0;
    if (diag) { const px = i % n, py = (i / n) | 0, wa = terrain[py * n + x] === TER.WATER, wb = terrain[y * n + px] === TER.WATER; if (wa && wb) return 40; if (wa || wb) return Infinity; } // narożnik dwóch wód: tylko w ostateczności (grobla)
    if (road[j]) return 0.3;
    let c = TERRAINS[terrain[j]].cost / 100; if (obst[j] === OBST.MOUNT) c += 25; else if (obst[j]) c += 4;
    return c + (thash(x, y, seed) % 100) / 300;
  };
  edges.forEach(([a, b], k) => {
    const type = (a === 0 || b === 0) ? 3 : (k % 2 ? 2 : 1);
    const p = findPath(n, sites[a].x, Math.min(n - 1, sites[a].y + 1), sites[b].x, Math.min(n - 1, sites[b].y + 1), roadCost, 0.3); if (!p) return;
    for (let k = 0; k < p.length; k++) { const i = p[k]; road[i] = Math.max(road[i], type); obst[i] = OBST.NONE;
      if (k) { const j = p[k - 1], x = i % n, y = (i / n) | 0, px = j % n, py = (j / n) | 0; // przejście po skosie między dwiema wodami: grobla z piasku
        if (x !== px && y !== py && terrain[py * n + x] === TER.WATER && terrain[y * n + px] === TER.WATER) { const g = py * n + x; terrain[g] = TER.SAND; road[g] = type; } } }
  });
  return { n, seed, terrain, obst, road, sites, start: sites[0], fords: rivers.flatMap(r => r.filter(i => wet[i] === 2 && terrain[i] !== TER.WATER).map(i => [i % n, (i / n) | 0])), land: LT.id, shape };
}
// Podziemia: korytarze i pieczary w litej skale (ściany = góry), dno jaskiń z ziemi, nierównego terenu, bagien i lawy;
// zostaje tylko największa spójna sieć pieczar. caves: środki dużych pieczar (kopalnie podziemi).
function generateCave(n, seed) {
  const rng = mulberry32(seed ^ 0x2c1b3c6d), nW = makeNoise(rng), nW2 = makeNoise(rng), nT = makeNoise(rng), N = n * n;
  const terrain = new Uint8Array(N).fill(TER.DIRT), obst = new Uint8Array(N), road = new Uint8Array(N), wall = new Float32Array(N), kind = new Float32Array(N);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x; wall[i] = nW(x / 7, y / 7) * 0.7 + nW2(x / 3, y / 3) * 0.3; kind[i] = nT(x / 10, y / 10); }
  const qW = quantile(wall, 0.33), qL = quantile(kind, 0.86), qS = quantile(kind, 0.12), qR = quantile(kind, 0.55);
  for (let i = 0; i < N; i++) { const x = i % n, y = (i / n) | 0, edge = Math.min(x, y, n - 1 - x, n - 1 - y);
    if (edge < 1 || wall[i] > qW) obst[i] = OBST.MOUNT;
    terrain[i] = kind[i] > qL ? TER.LAVA : kind[i] < qS ? TER.SWAMP : kind[i] > qR ? TER.ROUGH : TER.DIRT;
    if (!obst[i] && rng() < 0.035) obst[i] = OBST.ROCK; } // stalagmity i kryształy
  const comp = new Int32Array(N).fill(-1); let best = -1, bestSize = 0, cid = 0; // największa sieć pieczar
  for (let s = 0; s < N; s++) { if (obst[s] === OBST.MOUNT || comp[s] >= 0) continue; let size = 0; const stack = [s]; comp[s] = cid;
    while (stack.length) { const i = stack.pop(); size++; const x = i % n, y = (i / n) | 0;
      for (let d = 0; d < 4; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const j = ny * n + nx; if (obst[j] !== OBST.MOUNT && comp[j] < 0) { comp[j] = cid; stack.push(j); } } }
    if (size > bestSize) { bestSize = size; best = cid; } cid++; }
  for (let i = 0; i < N; i++) if (comp[i] !== best) { obst[i] = OBST.MOUNT; }
  const caves = []; for (let k = 0; k < 400 && caves.length < Math.max(2, Math.round(n / 18)); k++) { const x = 3 + Math.floor(rng() * (n - 6)), y = 3 + Math.floor(rng() * (n - 6)); let open = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!obst[(y + dy) * n + x + dx]) open++; if (open >= 22 && caves.every(c => Math.hypot(c.x - x, c.y - y) > n / 4)) caves.push({ x, y }); }
  return { terrain, obst, road, caves };
}
// Mapa z podziemiami: powierzchnia (ln × ln) w lewym górnym rogu, podziemia w prawym dolnym, reszta to lita skała
function withUnderground(surf, seed) {
  const ln = surf.n, n = ln * 2, N = n * n, cave = generateCave(ln, seed), terrain = new Uint8Array(N).fill(TER.ROUGH), obst = new Uint8Array(N).fill(OBST.MOUNT), road = new Uint8Array(N);
  for (let y = 0; y < ln; y++) for (let x = 0; x < ln; x++) { const s = y * ln + x, a = y * n + x, b = (y + ln) * n + x + ln;
    terrain[a] = surf.terrain[s]; obst[a] = surf.obst[s]; road[a] = surf.road[s]; terrain[b] = cave.terrain[s]; obst[b] = cave.obst[s]; }
  return { ...surf, n, ln, terrain, obst, road, caves: cave.caves.map(c => ({ x: c.x + ln, y: c.y + ln })) };
}
// Bramy podziemi: pary pól (powierzchnia, podziemia) w podobnym miejscu obu poziomów, z dala od miast
function gatePairs(map, rng, count) {
  const n = map.n, ln = map.ln, free = (x, y) => x > 1 && y > 1 && x < n - 2 && y < n - 2 && !map.obst[y * n + x] && map.terrain[y * n + x] !== TER.WATER && !map.road[y * n + x], out = [];
  for (let k = 0, tries = 0; out.length < count && tries < 3000; tries++) {
    const x = 3 + Math.floor(rng() * (ln - 6)), y = 3 + Math.floor(rng() * (ln - 6)); if (!free(x, y) || map.sites.some(s => Math.hypot(s.x - x, s.y - y) < 7) || out.some(([a]) => Math.hypot(a[0] - x, a[1] - y) < ln / 4)) continue;
    let b = null; for (let r = 0; r < ln / 3 && !b; r++) for (let dy = -r; dy <= r && !b; dy++) for (let dx = -r; dx <= r; dx++) { const ux = x + ln + dx, uy = y + ln + dy; if (ux >= ln && uy >= ln && free(ux, uy) && free(ux, uy + 1)) { b = [ux, uy]; break; } }
    if (b && free(x, y + 1)) out.push([[x, y], b]);
  }
  return out;
}
function placeObjects(st) {
  const map = st.map, n = map.n, N = n * n, NL = map.ln ? map.ln * map.ln * 2 : N, rng = mulberry32(st.seed ^ 0xabcdef), objs = [], occ = new Uint8Array(N); // NL: pola obu poziomów (gęstość obiektów)
  for (const s of map.sites) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = s.x + dx, y = s.y + dy; if (x >= 0 && y >= 0 && x < n && y < n) occ[y * n + x] = 1; }
  const reach = new Uint8Array(N), q = [map.start.y * n + map.start.x]; reach[q[0]] = 1;
  const gates = map.ln ? gatePairs(map, rng, UNDER_GATES[(MAP_SIZES.find(m => m.n === map.ln) || MAP_SIZES[1]).id] || 3) : [], gateTo = new Map();
  for (const [a, b] of gates) { gateTo.set(a[1] * n + a[0], b[1] * n + b[0]); gateTo.set(b[1] * n + b[0], a[1] * n + a[0]); }
  while (q.length) {
    const i = q.pop(), x = i % n, y = (i / n) | 0, g = gateTo.get(i); if (g != null && !reach[g]) { reach[g] = 1; q.push(g); } // przez bramę na drugi poziom
    for (let d = 0; d < 8; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const j = ny * n + nx; if (!reach[j] && map.terrain[j] !== TER.WATER && !map.obst[j]) { reach[j] = 1; q.push(j); } }
  }
  // obiekty nie leżą na drodze (skarb czy kopalnia na jedynej drodze przez las zamknęłyby przejazd); na drogach stoją tylko strażnicy przejść (okRoad)
  const okRoad = (x, y) => x >= 1 && y >= 1 && x < n - 1 && y < n - 1 && reach[y * n + x] && !occ[y * n + x], ok = (x, y) => okRoad(x, y) && !map.road[y * n + x];
  // Okolica pola (do rozmieszczania wg sensu): odległość od drogi, drzewa wokół (gąszcz, polana), góry i woda w pobliżu
  const dRoad = new Uint8Array(N).fill(99), rq = []; for (let i = 0; i < N; i++) if (map.road[i]) { dRoad[i] = 0; rq.push(i); }
  for (let h = 0; h < rq.length; h++) { const i = rq[h], x = i % n, y = (i / n) | 0; if (dRoad[i] >= 12) continue;
    for (let d = 0; d < 4; d++) { const X = x + DX8[d], Y = y + DY8[d]; if (X < 0 || Y < 0 || X >= n || Y >= n) continue; const j = Y * n + X; if (dRoad[j] > dRoad[i] + 1 && map.terrain[j] !== TER.WATER) { dRoad[j] = dRoad[i] + 1; rq.push(j); } } }
  const around = (x, y, r, f) => { let c = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && f(Y * n + X)) c++; } return c; };
  const trees = (x, y) => around(x, y, 2, j => map.obst[j] === OBST.TREE), mtNear = (x, y) => around(x, y, 2, j => map.obst[j] === OBST.MOUNT), wetNear = (x, y) => around(x, y, 2, j => map.terrain[j] === TER.WATER);
  // Co gdzie pasuje (wynik ~0–3): przy drodze gospoda i targ, nad wodą młyn, w gąszczu chata wiedźmy, w górach ołtarz i kuźnia…
  const FIT = {
    road: (x, y) => { const d = dRoad[y * n + x]; return d === 2 ? 3 : d === 3 ? 2.2 : d <= 5 ? 1 : 0; }, // przy drodze, ale nie na niej (budynek odsunięty o pole)
    water: (x, y) => Math.min(3, wetNear(x, y) * 0.6) + (dRoad[y * n + x] <= 3 ? 0.5 : 0),
    open: (x, y) => (trees(x, y) <= 2 && !mtNear(x, y) ? 2 : 0) + (map.terrain[y * n + x] === TER.GRASS ? 1 : 0),
    forest: (x, y) => { const t = trees(x, y); return t >= 14 ? 3 : t >= 9 ? 2.4 : t >= 5 ? 1.2 : 0; },
    mountain: (x, y) => Math.min(3, mtNear(x, y) * 0.5) + (map.terrain[y * n + x] === TER.ROUGH ? 0.5 : 0),
    hidden: (x, y) => (dRoad[y * n + x] >= 3 ? 1 : 0) + Math.min(2, trees(x, y) * 0.15 + mtNear(x, y) * 0.3), // z dala od drogi, w zakamarkach
    swamp: (x, y) => (map.terrain[y * n + x] === TER.SWAMP ? 2 : 0) + Math.min(1.5, trees(x, y) * 0.15),
    desert: (x, y) => around(x, y, 2, j => map.terrain[j] === TER.SAND) * 0.15 + (trees(x, y) <= 2 ? 1 : 0), // sfinks: wśród piasków, inaczej na otwartym
  };
  const SITE_FIT = { well: 'road', stables: 'road', temple: 'road', market: 'road', school: 'road', hillFort: 'road', camp: 'road', post: 'road', dwelling: 'road', fountain: 'road',
    waterMill: 'water', magicSpring: 'water', windmill: 'open', arena: 'open', oasis: 'open', lookout: 'mountain', altar: 'mountain', stone: 'mountain', crystalCave: 'mountain', dwarfForge: 'mountain',
    witchHut: 'swamp', graveyard: 'swamp', shrine: 'forest', garden: 'forest', tree: 'forest', mushroomRing: 'forest', campfire: 'forest', library: 'hidden', sacrifice: 'hidden', prison: 'hidden',
    sphinx: 'desert', questHut: 'forest', inn: 'road', barrow: 'open', caravanserai: 'road', wishingWell: 'forest' };
  // Budynek nie dotyka drogi: w prostokącie x0..x1, y0..y1 (budynek z marginesem pola; pod wejściem droga może biec) nie ma drogi
  const roadFree = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(n - 1, x1); x++) if (map.road[y * n + x]) return false; return true; };
  // Najlepsze z kilkudziesięciu losowych miejsc: dopasowanie do okolicy i odstęp od innych obiektów (bez zbitych gromad)
  const near = new Float32Array(N).fill(99), markNear = (x0, y0) => { for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const X = x0 + dx, Y = y0 + dy; if (X >= 0 && Y >= 0 && X < n && Y < n) { const j = Y * n + X, d = Math.hypot(dx, dy); if (d < near[j]) near[j] = d; } } };
  const best = (cond, fit, tries = 70) => { let b = null, bs = -1; for (let k = 0; k < tries * 6 && k < 3000; k++) { const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)); if (!ok(x, y) || !cond(x, y)) continue;
    const sc = (fit ? fit(x, y) : 0) + Math.min(5, near[y * n + x]) * 0.45 + rng() * 0.4; if (sc > bs) { bs = sc; b = [x, y]; } if (--tries <= 0) break; } return b; };
  // odległość od najbliższego startu gracza (pierwsze miejsca na liście); d01 = 0 przy starcie, 1 daleko od wszystkich graczy
  const starts = map.sites.slice(0, clamp(playerSlots(st.settings).length, 1, map.sites.length)), spread = levelSize(map) / Math.sqrt(starts.length) * 0.7;
  const dStart = (x, y) => Math.min(...starts.map(s => Math.hypot(x - s.x, y - s.y))), d01 = (x, y) => clamp(dStart(x, y) / spread, 0, 1);
  // Okolica startu (ok. pół dnia marszu po ziemi, nie w linii prostej): bez potworów, żeby żadnego gracza nie zamknął strażnik w wąskim
  // przejściu tuż za miastem (półwysep, dolina w górach)
  const home = new Uint8Array(N); { const H = clamp(Math.round(levelSize(map) / 6), 7, 12), dist = new Int16Array(N).fill(-1), q = [];
    for (const s of starts) { const i = s.y * n + s.x; dist[i] = 0; q.push(i); }
    for (let k = 0; k < q.length; k++) { const i = q[k], x = i % n, y = (i / n) | 0; home[i] = 1; if (dist[i] >= H) continue;
      for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X < 0 || Y < 0 || X >= n || Y >= n || dist[j] >= 0 || map.terrain[j] === TER.WATER || map.obst[j]) continue; dist[j] = dist[i] + 1; q.push(j); } } }
  const pick = (cond, tries = 500) => { for (let k = 0; k < tries; k++) { const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)); if (ok(x, y) && cond(x, y)) return [x, y]; } return null; };
  const add = (o, tiles) => { o.id = objs.length; objs.push(o); for (const i of tiles) occ[i] = 1; markNear(o.x, o.y); return o; };
  // skarb w gąszczu albo wśród skał (dużo drzew wokół): widać go dopiero z bliska (objSeen)
  const hideIn = o => { if (trees(o.x, o.y) >= 9 || mtNear(o.x, o.y) >= 6) o.hid = 1; return o; };
  for (const [a, b] of gates) { const ga = add({ type: 'site', kind: 'gate', x: a[0], y: a[1], seen: {} }, [a[1] * n + a[0], (a[1] + 1) * n + a[0]]), gb = add({ type: 'site', kind: 'gate', x: b[0], y: b[1], seen: {} }, [b[1] * n + b[0], (b[1] + 1) * n + b[0]]); ga.pair = gb.id; gb.pair = ga.id; }
  // Potwór: siła rośnie wykładniczo z odległością od startu (blisko ~armia startowa, na krańcach mapy kilkanaście razy więcej),
  // strażnicy cenniejszych rzeczy (boost) są mocniejsi, a poziom trudności mnoży liczebność
  const diff = DIFFICULTIES[st.settings.difficulty].rating / 100;
  const monster = (x, y, boost = 0, ddFix = null) => { // ddFix: siła jak przy samym starcie (pierwsze walki)
    if (home[y * n + x]) return null; const dd = ddFix != null ? ddFix : d01(x, y), lvl = clamp(1 + Math.floor(dd * 4.6 + rng() * 1.8) + boost, 1, 7), all = NEUTRALS_BY_LEVEL[lvl];
    const power = MONSTER_POWER * Math.exp(dd * 3.4) * (0.75 + rng() * 0.5) * (1 + boost * 0.35) * (0.6 + 0.4 * diff) * rule(st, 'monsters');
    const fit = all.filter(c => CREATURES[c].value <= power * 1.3), list = fit.length ? fit : [all.reduce((a, c) => (CREATURES[c].value < CREATURES[a].value ? c : a))], cid = list[Math.floor(rng() * list.length)]; // bez smoka silniejszego niż cała okolica
    return add({ type: 'monster', cid, count: Math.max(1, Math.round(power / CREATURES[cid].value)), x, y, dir: rng() < 0.5 ? -1 : 1 }, [y * n + x]);
  };
  // Obiekt 2×2 (kopalnia, skarbiec): wejście w prawym dolnym polu, pozostałe trzy pola zablokowane, pole przed wejściem wolne
  const footprint = (near, dmin, dmax, extra = () => true) => pick((x, y) => {
      const d = Math.hypot(x - near.x, y - near.y); if (d < dmin || d > dmax || y + 1 >= n || !extra(x, y) || !roadFree(x - 2, y - 2, x + 1, y)) return false;
      for (const [dx, dy] of [[-1, 0], [-1, -1], [0, -1]]) { const j = (y + dy) * n + x + dx; if (map.terrain[j] === TER.WATER || map.obst[j] || occ[j] || map.road[j]) return false; }
      const f = (y + 1) * n + x; return map.terrain[f] !== TER.WATER && !map.obst[f];
    }, 800);
  const placeMine = (kind, near, dmin, dmax) => {
    const p = footprint(near, dmin, dmax);
    if (!p) return null; const [x, y] = p, blocks = [y * n + x - 1, (y - 1) * n + x - 1, (y - 1) * n + x];
    const m = add({ type: 'mine', kind, x, y, owner: -1, blocks }, [y * n + x, ...blocks]); occ[(y + 1) * n + x] = 1; return m;
  };
  // Strażnik obok obiektu: najchętniej przed wejściem (pola poniżej i z boku), w razie potrzeby dwa pola dalej; nie w okolicy startu
  const GUARD_AT = [[1, 1], [0, 1], [-1, 1], [1, 0], [-1, 0], [1, -1], [-1, -1], [0, -1], [2, 1], [-2, 1], [1, 2], [-1, 2], [0, 2], [2, 0], [-2, 0], [2, 2], [-2, 2]];
  const guard = (m, boost) => { for (const [dx, dy] of GUARD_AT) { const x = m.x + dx, y = m.y + dy; if (ok(x, y) && dStart(x, y) >= 5 && !home[y * n + x] && monster(x, y, boost)) return; } };
  map.sites.forEach((s, k) => {
    for (const kind of ['wood', 'ore']) { const m = placeMine(kind, s, 4, 9); if (m && k >= starts.length) guard(m, 0); }
    const m = placeMine(RARE[Math.floor(rng() * 4)], s, 6, 14); if (m) guard(m, 0);
  });
  for (const c of map.caves || []) { const m = placeMine(RARE[Math.floor(rng() * 4)], c, 1, 8); if (m) guard(m, 1); const g2 = rng() < 0.5 && placeMine(rng() < 0.5 ? 'gold' : 'ore', c, 2, 10); if (g2) guard(g2, 1); }
  for (let g = 0; g < Math.max(1, Math.floor(map.sites.length / 2)); g++) { const m = placeMine('gold', map.start, n * 0.25, n * 2); if (m) guard(m, 1); }
  // surowce: rzadziej niż dawniej (co ~190 pól), ale większe kupki; skrzynie w zakamarkach
  for (let k = Math.round(NL / 190); k > 0; k--) {
    const p = best((x, y) => dStart(x, y) >= 2, rng() < 0.5 ? FIT.hidden : FIT.road, 30); if (!p) continue; const res = RESOURCES[Math.floor(rng() * 7)].id;
    const amount = res === 'gold' ? 800 + Math.floor(rng() * 6) * 100 : (res === 'wood' || res === 'ore') ? 8 + Math.floor(rng() * 6) : 4 + Math.floor(rng() * 4);
    add({ type: 'res', res, amount: Math.max(1, Math.round(amount * rule(st, 'treasure') / (res === 'gold' ? 100 : 1)) * (res === 'gold' ? 100 : 1)), x: p[0], y: p[1] }, [p[1] * n + p[0]]); // surowce zawsze widać (ukryte bywają tylko skrzynie i artefakty)
  }
  for (let k = Math.round(NL / 480); k > 0; k--) {
    const p = best((x, y) => dStart(x, y) >= 3, FIT.hidden, 40); if (!p) continue; const v = Math.floor(rng() * 3);
    guard(add({ type: 'chest', gold: Math.round((1000 + v * 500) * rule(st, 'treasure') / 100) * 100, exp: Math.round((500 + v * 500) * rule(st, 'treasure') / 100) * 100, x: p[0], y: p[1] }, [p[1] * n + p[0]]), 0); // skrzynia na widoku, ale pilnowana
  }
  // potwory: część pilnuje przejść (przełęcze, brody, wąskie gardła dróg), reszta krąży przy drogach
  for (const [fx, fy] of map.fords || []) { if (rng() < 0.65 && okRoad(fx, fy) && dStart(fx, fy) >= 8) monster(fx, fy); }
  { const narrow = (x, y) => map.road[y * n + x] && around(x, y, 1, j => map.obst[j] === OBST.MOUNT || map.terrain[j] === TER.WATER) >= 4; // droga ściśnięta górami albo wodą
    const cand = []; for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) if (okRoad(x, y) && dStart(x, y) >= 8 && narrow(x, y)) cand.push([x, y]);
    for (let k = Math.round(NL / 650); k > 0 && cand.length; k--) { const [x, y] = cand.splice(Math.floor(rng() * cand.length), 1)[0]; monster(x, y); } }
  for (let k = Math.round(NL / 340); k > 0; k--) { const p = best((x, y) => dStart(x, y) >= 6, (x, y) => (dRoad[y * n + x] <= 2 ? 1.5 : 0), 25); if (p) monster(p[0], p[1]); }
  // pierwsze walki: tuż za okolicą każdego startu 2–3 słabe oddziały (przy drodze), do pokonania armią startową
  const homeEdge = (x, y) => { if (home[y * n + x]) return false; for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d]; if (X >= 0 && Y >= 0 && X < n && Y < n && home[Y * n + X]) return true; } return false; };
  for (const s0 of starts) for (let k = 0; k < 2 + (rng() < 0.5 ? 1 : 0); k++) {
    const p = best((x, y) => homeEdge(x, y) && Math.hypot(x - s0.x, y - s0.y) < levelSize(map) * 0.35 && dStart(x, y) === Math.hypot(x - s0.x, y - s0.y), (x, y) => (dRoad[y * n + x] <= 1 ? 2 : 0), 25);
    if (p) monster(p[0], p[1], 0, 0.02); }
  // artefakty: im dalej od startu, tym rzadsze; każdego pilnuje potwór
  for (let k = Math.max(3, Math.round(NL / 600)); k > 0; k--) {
    const p = best((x, y) => dStart(x, y) >= 7, FIT.hidden, 40); if (!p) continue;
    const dd = d01(p[0], p[1]), rar = dd > 0.6 && rng() < 0.5 ? 'major' : dd > 0.3 ? 'minor' : 'treasure', pool = ARTS_BY_RARITY(rar);
    const a = add({ type: 'art', art: pool[Math.floor(rng() * pool.length)], x: p[0], y: p[1] }, [p[1] * n + p[0]]); // artefakt na widoku, zawsze pilnowany
    guard(a, rar === 'major' ? 2 : rar === 'minor' ? 1 : 0);
  }
  // skarbce: jedna na tyle pól (co najmniej min), dalej od startu niż BANKS[].dd; Smocza Utopia możliwie na krańcu mapy
  for (const [kind, B] of Object.entries(BANKS)) {
    const want = NL / (B.per * 1.4), cnt = Math.max(B.min, Math.floor(want) + (rng() < want % 1 ? 1 : 0)); // rzadziej niż dawniej: każdy skarbiec to wyprawa
    for (let k = 0; k < cnt; k++) {
      const pref = (x, y) => (!B.terr || map.terrain[y * n + x] === TER[B.terr]) && (!B.ug || !map.ln || levelOf(map, x, y) === 1); // piramida na piasku, warsztat golemów w podziemiach (gdy są)
      let p = null; for (let dd = B.dd; !p && dd >= 0; dd -= 0.1) p = footprint(map.start, 6, n * 2, (x, y) => d01(x, y) >= dd && pref(x, y)) || (dd < 0.15 ? footprint(map.start, 6, n * 2, (x, y) => d01(x, y) >= dd) : null);
      if (!p) continue; const [x, y] = p, blocks = [y * n + x - 1, (y - 1) * n + x - 1, (y - 1) * n + x];
      add({ type: 'bank', kind, x, y, blocks, guards: bankGuards(kind, st.settings.difficulty), cleared: false }, [y * n + x, ...blocks]); occ[(y + 1) * n + x] = 1;
    }
  }
  // łodzie przy brzegu: w zasięgu lądu dostępnego ze startu, pierwsza możliwie blisko gracza
  const coastBoat = near => { for (let k = 0; k < 600; k++) { const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)), i = y * n + x;
    if (map.terrain[i] !== TER.WATER || occ[i] || (near && dStart(x, y) > near)) continue;
    let land = false; for (let d = 0; d < 8; d++) { const j = (y + DY8[d]) * n + x + DX8[d]; if (reach[j] && !occ[j]) land = true; }
    if (land) return add({ type: 'boat', x, y }, [i]); } return null; };
  if (!coastBoat(n * 0.3)) coastBoat(0); for (let k = Math.round(NL / 3000); k > 0; k--) coastBoat(0);
  // miejsca (SITES): liczba wg gęstości, na małej mapie rzadsze z losowaniem; część pilnują potwory
  for (const [kind, S] of Object.entries(SITES)) {
    if (!S.per) continue; // obeliski rozmieszcza placeGrail
    const want = NL / (S.per * 1.7), cnt = Math.floor(want) + (rng() < want % 1 ? 1 : 0); // ~40% mniej niż dawniej: miejsca mają się wyróżniać
    for (let k = 0; k < cnt; k++) {
      const base = (x, y) => dStart(x, y) >= (S.guard ? 7 : 4) && (!S.terr || map.terrain[y * n + x] === TER[S.terr]) && roadFree(x - 1, y - 1, x + 1, y); // terr: tylko na danym terenie (oaza na piasku); budynek nie na drodze ani tuż przy niej
      const fit = FIT[SITE_FIT[kind]] || null;
      const roadOk = SITE_FIT[kind] === 'road' ? (x, y) => base(x, y) && dRoad[y * n + x] <= 4 : null; // przydrożne naprawdę przy drodze (gdy tam ciasno, odstęp nie wygrywa z drogą)
      const p = (S.ug && map.ln ? best((x, y) => base(x, y) && levelOf(map, x, y) === 1, fit) : null) || (roadOk && best(roadOk, fit)) || best(base, fit); if (!p) continue; // ug: najchętniej w podziemiach
      const o = { type: 'site', kind, x: p[0], y: p[1], seen: {} };
      if (kind === 'shrine') { const L = d01(p[0], p[1]) > 0.5 ? 2 : 1, pool = Object.keys(SPELLS).filter(id => SPELLS[id].level === L); o.spell = pool[Math.floor(rng() * pool.length)]; }
      if (kind === 'windmill') o.res = RARE[Math.floor(rng() * RARE.length)];
      if (kind === 'campfire') { const pool = RESOURCES.filter(r => r.id !== 'gold'); o.res = pool[Math.floor(rng() * pool.length)].id; }
      if (kind === 'witchHut') { const pool = Object.keys(SKILLS).filter(id => id !== 'necromancy'); o.skill = pool[Math.floor(rng() * pool.length)]; }
      if (kind === 'dwelling') { const lv = 2 + Math.floor(rng() * 3), pool = NEUTRALS_BY_LEVEL[lv].filter(c => CREATURES[c].cost); o.cid = pool[Math.floor(rng() * pool.length)]; o.avail = CREATURES[o.cid].growth; o.week = 0; }
      if (kind === 'inn') o.title = `Karczma „${INN_NAMES[Math.floor(rng() * INN_NAMES.length)]}”`;
      if (kind === 'barrow') o.title = `Kurhan ${BARROW_NAMES[Math.floor(rng() * BARROW_NAMES.length)]}`;
      if (kind === 'questHut') { // pustelnik wskazuje groźne stwory kilka dni drogi dalej (silniejsze niż okolica); bez celu nie ma chaty
        o.title = `Chata pustelnika ${HERMIT_NAMES[Math.floor(rng() * HERMIT_NAMES.length)]}a`; o.taken = {};
        const q = best((x, y) => { const d = Math.hypot(x - p[0], y - p[1]); return d >= 7 && d <= 16 && !home[y * n + x] && !map.road[y * n + x]; }, FIT.hidden, 30); if (!q) continue;
        add(o, [p[1] * n + p[0]]); const m = monster(q[0], q[1], 1); if (!m) { o.dead = true; continue; } o.target = m.id; m.quest = o.id; continue;
      }
      add(o, [p[1] * n + p[0]]); if (kind === 'campfire' || kind === 'graveyard') hideIn(o);
      if (S.guard || !UNGUARDED_SITES.includes(kind)) guard(o, kind === 'prison' || S.ai >= 2500 ? 1 : 0); // większość miejsc ma strażnika (cenne: silniejszego)
    }
  }
  // Pierwsze dni: przy każdym starcie w zasięgu 1–2 dni marszu ciekawe miejsce bez strażnika i skrzynia (jeśli los ich tam nie postawił)
  const EARLY = ['stone', 'arena', 'tree', 'garden', 'campfire', 'library', 'temple', 'fountain', 'stables', 'lookout', 'altar'];
  for (const st0 of starts) {
    const near = (o, r) => Math.hypot(o.x - st0.x, o.y - st0.y) <= r;
    if (!objs.some(o => o.type === 'site' && EARLY.includes(o.kind) && near(o, 12))) {
      const kind = EARLY[Math.floor(rng() * EARLY.length)], cond = (x, y) => { const d = Math.hypot(x - st0.x, y - st0.y); return d >= 5 && d <= 11 && roadFree(x - 1, y - 1, x + 1, y); };
      const p = (SITE_FIT[kind] === 'road' && best((x, y) => cond(x, y) && dRoad[y * n + x] <= 4, FIT.road, 40)) || best(cond, FIT[SITE_FIT[kind]] || null, 40) || pick(cond, 1500); // też wg okolicy (stajnia przy drodze, ołtarz w górach)
      if (p) { const o = { type: 'site', kind, x: p[0], y: p[1], seen: {} }; if (kind === 'campfire') o.res = ['wood', 'ore', 'mercury', 'sulfur', 'crystal', 'gems'][Math.floor(rng() * 6)]; add(o, [p[1] * n + p[0]]); }
    }
    if (!objs.some(o => o.type === 'chest' && near(o, 10))) { const p = pick((x, y) => { const d = Math.hypot(x - st0.x, y - st0.y); return d >= 3 && d <= 9; }, 1500);
      if (p) add({ type: 'chest', gold: Math.round(1500 * rule(st, 'treasure') / 100) * 100, exp: Math.round(1000 * rule(st, 'treasure') / 100) * 100, x: p[0], y: p[1] }, [p[1] * n + p[0]]); }
  }
  // portale w parach: oba końce daleko od siebie (skrót przez mapę); wraki na wodzie z dala od brzegu
  const size = (MAP_SIZES.find(m => m.n === levelSize(map)) || MAP_SIZES[1]).id;
  for (let k = 0; k < (PORTAL_PAIRS[size] || 1); k++) {
    const a = pick((x, y) => dStart(x, y) >= 5 && roadFree(x - 1, y - 1, x + 1, y)); if (!a) continue; const b = pick((x, y) => dStart(x, y) >= 5 && roadFree(x - 1, y - 1, x + 1, y) && Math.hypot(x - a[0], y - a[1]) >= n * 0.4); if (!b) continue;
    const pa = add({ type: 'site', kind: 'portal', x: a[0], y: a[1], seen: {} }, [a[1] * n + a[0]]), pb = add({ type: 'site', kind: 'portal', x: b[0], y: b[1], seen: {} }, [b[1] * n + b[0]]);
    pa.pair = pb.id; pb.pair = pa.id;
  }
  const water = map.terrain.reduce((s, t) => s + (t === TER.WATER ? 1 : 0), 0);
  for (let k = Math.floor(water / WRECK_PER), tries = 0; k > 0 && tries < 4000; tries++) {
    const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)), i = y * n + x; if (map.terrain[i] !== TER.WATER || occ[i] || !roadFree(x - 1, y - 1, x + 1, y + 1)) continue; // nie przy moście ani brodzie
    let wet = 0; for (let d = 0; d < 8; d++) if (map.terrain[(y + DY8[d]) * n + x + DX8[d]] === TER.WATER) wet++; if (wet < 7) continue;
    add({ type: 'site', kind: 'wreck', x, y, seen: {} }, [i]); k--;
  }
  // miejsca na wodzie (wper: jedno na tyle pól wody): boja, szczątki, skała syren – na otwartej wodzie, dostępne łodzią
  for (const [kind, S] of Object.entries(SITES)) if (S.wper) for (let k = Math.floor(water / S.wper) + (rng() < (water / S.wper) % 1 ? 1 : 0), tries = 0; k > 0 && tries < 4000; tries++) {
    const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)), i = y * n + x; if (map.terrain[i] !== TER.WATER || occ[i] || !roadFree(x - 1, y - 1, x + 1, y + 1)) continue; // nie przy moście ani brodzie
    let wet = 0; for (let d = 0; d < 8; d++) if (map.terrain[(y + DY8[d]) * n + x + DX8[d]] === TER.WATER && !occ[(y + DY8[d]) * n + x + DX8[d]]) wet++; if (wet < 6) continue;
    add({ type: 'site', kind, x, y, seen: {} }, [i]); k--;
  }
  // Morze: wiry w parach (daleko od siebie, na otwartej wodzie), latarnie na brzegu, piraci i morskie stwory (strażnicy wraków i syren,
  // reszta krąży po otwartej wodzie; siła jak na lądzie, rośnie z odległością od startu)
  const openWater = (x, y, need) => { let wet = 0; for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d]; if (X >= 0 && Y >= 0 && X < n && Y < n && map.terrain[Y * n + X] === TER.WATER && !occ[Y * n + X]) wet++; } return wet >= need; };
  const seaSpot = need => { for (let t = 0; t < 2500; t++) { const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)), i = y * n + x; if (map.terrain[i] === TER.WATER && !occ[i] && openWater(x, y, need)) return [x, y]; } return null; };
  if (water > 200) for (let k = WHIRL_PAIRS[size] || 1; k > 0; k--) { const a = seaSpot(8); if (!a) break; let b = null;
    for (let t = 0; t < 40 && (!b || Math.hypot(b[0] - a[0], b[1] - a[1]) < levelSize(map) * 0.3); t++) b = seaSpot(8); if (!b || Math.hypot(b[0] - a[0], b[1] - a[1]) < levelSize(map) * 0.3) break;
    const wa = add({ type: 'site', kind: 'whirlpool', x: a[0], y: a[1], seen: {} }, [a[1] * n + a[0]]), wb = add({ type: 'site', kind: 'whirlpool', x: b[0], y: b[1], seen: {} }, [b[1] * n + b[0]]); wa.pair = wb.id; wb.pair = wa.id; }
  for (let k = water > 300 ? Math.max(1, Math.round(water / LIGHTHOUSE_PER)) : 0, tries = 0; k > 0 && tries < 3000; tries++) {
    const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)); if (!ok(x, y) || dStart(x, y) < 4 || !roadFree(x - 1, y - 1, x + 1, y)) continue; let wet = 0, open = false;
    for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d]; if (map.terrain[Y * n + X] === TER.WATER) { wet++; if (openWater(X, Y, 6)) open = true; } } if (wet < 3 || !open || objs.some(o => o.kind === 'lighthouse' && Math.hypot(o.x - x, o.y - y) < 14)) continue;
    add({ type: 'site', kind: 'lighthouse', x, y, owner: -1, seen: {} }, [y * n + x]); k--; }
  const seaMonster = (x, y, boost = 0) => { const i = y * n + x; if (x < 1 || y < 1 || x >= n - 1 || y >= n - 1 || map.terrain[i] !== TER.WATER || occ[i]) return null;
    const dd = d01(x, y), lvl = clamp(1 + Math.floor(dd * 4.6 + rng() * 1.8) + boost, 1, 7), pool = SEA_MONSTERS[lvl], cid = pool[Math.floor(rng() * pool.length)];
    const power = MONSTER_POWER * Math.exp(dd * 3.4) * (0.75 + rng() * 0.5) * (1 + boost * 0.35) * (0.6 + 0.4 * diff) * rule(st, 'monsters');
    return add({ type: 'monster', cid, count: Math.max(1, Math.round(power / CREATURES[cid].value)), x, y, dir: rng() < 0.5 ? -1 : 1, sea: 1, ...(PIRATES.includes(cid) ? { ship: 1 } : {}) }, [i]); };
  for (const o of objs.filter(o => o.type === 'site' && ['wreck', 'sirens', 'flotsam'].includes(o.kind))) if (rng() < 0.75) for (const [dx, dy] of GUARD_AT) if (seaMonster(o.x + dx, o.y + dy, o.kind === 'flotsam' ? 0 : 1)) break;
  for (let k = Math.round(water / SEA_MONSTER_PER), tries = 0; k > 0 && tries < 3000; tries++) { const p = seaSpot(7); if (p && dStart(p[0], p[1]) >= 8 && seaMonster(p[0], p[1])) k--; }
  // Przejścia: stały obiekt (kopalnia, skarbiec, miejsce) nie może zamknąć jedynej drogi do któregoś miasta (wąska dolina,
  // przesmyk) – taki obiekt znika. Potwory (do pokonania) i skarby (do podniesienia) drogi nie zamykają.
  { const solid = o => !o.dead && !['monster', 'res', 'chest', 'art', 'boat'].includes(o.type), tilesOf = o => [o.y * n + o.x, ...(o.blocks || [])];
    const blocked = new Uint8Array(N); for (const o of objs) if (solid(o)) for (const i of tilesOf(o)) blocked[i] = 1;
    for (const s of map.sites) for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) { const x = s.x + dx, y = s.y + dy; if (x >= 0 && y >= 0 && x < n && y < n) blocked[y * n + x] = 1; } // zabudowa miast (wejście bramą od południa)
    const reached = () => { const seen = new Uint8Array(N), q = [Math.min(n - 1, map.start.y + 1) * n + map.start.x]; seen[q[0]] = 1;
      while (q.length) { const i = q.pop(), x = i % n, y = (i / n) | 0, g = gateTo.get(i); if (g != null && !seen[g]) { seen[g] = 1; q.push(g); }
        for (let d = 0; d < 8; d++) { const X = x + DX8[d], Y = y + DY8[d], j = Y * n + X; if (X < 0 || Y < 0 || X >= n || Y >= n || seen[j] || blocked[j] || map.terrain[j] === TER.WATER || map.obst[j]) continue; seen[j] = 1; q.push(j); } }
      return map.sites.filter(s => seen[Math.min(n - 1, s.y + 1) * n + s.x]).length; };
    let got = reached();
    for (let k = objs.length - 1; k >= 0 && got < map.sites.length; k--) { const o = objs[k]; if (!solid(o) || o.kind === 'gate') continue;
      for (const i of tilesOf(o)) blocked[i] = 0; const now = reached(); if (now > got) { o.dead = true; got = now; } else for (const i of tilesOf(o)) blocked[i] = 1; }
  }
  return objs;
}
// Graal i obeliski: Graal zakopany na wolnym polu lądu (osiągalnym ze startu, z dala od graczy), obeliski rozsiane po mapie.
// Osobno od placeObjects, bo dokłada je też naprawa starszych zapisów (migrateSave).
function placeGrail(st) {
  const map = st.map, n = map.n, rng = mulberry32(st.seed ^ 0x6a41), reach = new Uint8Array(n * n), q = [map.start.y * n + map.start.x]; reach[q[0]] = 1;
  while (q.length) { const i = q.pop(), x = i % n, y = (i / n) | 0;
    for (let d = 0; d < 8; d++) { const nx = x + DX8[d], ny = y + DY8[d]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const j = ny * n + nx; if (!reach[j] && map.terrain[j] !== TER.WATER && !map.obst[j]) { reach[j] = 1; q.push(j); } } }
  const nearRoad = i => { const x = i % n, y = (i / n) | 0; for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && map.road[Y * n + X]) return true; } return false; };
  const taken = i => !reach[i] || map.obst[i] || map.sites.some(S => Math.abs(S.x - i % n) <= 3 && Math.abs(S.y - ((i / n) | 0)) <= 3) || st.objects.some(o => !o.dead && (o.y * n + o.x === i || (o.blocks || []).includes(i)));
  const starts = map.sites.slice(0, Math.max(1, st.players.length || playerSlots(st.settings).length)), dStart = (x, y) => Math.min(...starts.map(s => Math.hypot(x - s.x, y - s.y)));
  const pick = (minD, near) => { for (let k = 0; k < 3000; k++) { const x = 2 + Math.floor(rng() * (n - 4)), y = 2 + Math.floor(rng() * (n - 4)), i = y * n + x;
    if (taken(i) || dStart(x, y) < minD || (near && near(x, y))) continue; return [x, y]; } return null; };
  if (!st.grail) { const p = pick(n * 0.25) || pick(6) || pick(0); if (p) st.grail = { x: p[0], y: p[1], found: -1 }; }
  st.holes = st.holes || [];
  if (!st.objects.some(o => o.type === 'site' && o.kind === 'obelisk')) {
    const want = OBELISKS[(MAP_SIZES.find(m => m.n === n) || MAP_SIZES[1]).id] || 4, placed = [];
    for (let k = 0; k < want; k++) { // obeliski daleko od siebie (każdy w innej części mapy)
      const p = pick(4, (x, y) => nearRoad(y * n + x) || placed.some(([a, b]) => Math.hypot(a - x, b - y) < n / (Math.sqrt(want) + 1))) || pick(4, (x, y) => nearRoad(y * n + x)) || pick(4); if (!p) continue; // obelisk z dala od drogi
      placed.push(p); st.objects.push({ id: st.objects.length, type: 'site', kind: 'obelisk', x: p[0], y: p[1], seen: {} });
    }
  }
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
// Miasto niezależne w miejscu startowym: losowa frakcja, garnizon tym silniejszy, im dalej od graczy
// (i im wyższy poziom trudności). Daleko stoją też mury (oblężenie w bitwie).
function createNeutralTown(st, site, rng) {
  const n = st.map.n, own = st.towns.filter(t => t.owner >= 0), spread = n / Math.sqrt(Math.max(1, own.length)) * 0.75;
  const dd = clamp(Math.min(...own.map(t => Math.hypot(site.x - t.x, site.y - t.y))) / spread, 0, 1); // daleko od wszystkich graczy = silniej
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
  const h = { id, owner, name, cls, female: !!female, x, y, dir: 1, sight: HERO_SIGHT, exp: 0, asleep: false, army: P.weak ? weakArmy(P.fac) : startingArmy(P.fac, r),
    path: null, dest: null, moving: false, stop: false, anim: null, prev: null, pending: null };
  initHeroProgress(h); h.book = MAGE_CLASSES.includes(cls) || !!CLASS_SPELLS[cls]; h.mp = heroMaxMP(h); st.heroes.push(h); return h; // wojownicy bez księgi czarów
}
// Podgląd kandydata z tawerny: ten sam bohater, którego dałby najem (ta sama armia i umiejętności), ale bez dopisania do gry
function previewHero(st, owner, pick) {
  if (pick.retired) { const r = (st.retired || []).find(q => q.hero.name === pick.name), h = { ...r.hero, owner, army: weakArmy(heroFaction(r.hero) || playerOf(st, owner).faction), preview: true }; h.mp = heroMaxMP(h); return h; }
  const h = createHero(st, owner, -1, -1, pick); st.heroes.pop(); h.preview = true; return h;
}
// Cały świat powstaje tutaj, zanim pokaże się jakikolwiek ekran. Stan (st) nie zawiera nic z grafiki,
// dlatego da się go później zapisać i wczytać (krok 14).
// seed podaje się tylko w testach (powtarzalny świat); w grze jest losowy.
function createNewGame(S, seed = (Math.random() * 1e9) | 0) {
  const rng = mulberry32(seed), d = DIFFICULTIES[S.difficulty];
  const st = { seed, day: 1, week: 1, month: 1, dayTotal: 1, settings: { ...S, rules: validRules(S.rules) }, bonusText: '', selHero: 0, cam: null, players: [], heroes: [], towns: [], objects: [] };
  const surf = generateMap(MAP_SIZES.find(m => m.id === S.mapSize).n, seed, S.land || 'random'), map = st.map = S.underground ? withUnderground(surf, seed) : surf; st.landInfo = { land: surf.land, shape: surf.shape };
  st.objects = placeObjects(st);
  placeGrail(st);
  // gracze (ludzie i komputer) w kolejnych miejscach startowych (pierwsze = map.start, drugie = najdalej od niego), reszta miast jest niezależna
  const trng = mulberry32(seed ^ 0x70a7), slots = playerSlots(S).slice(0, map.sites.length), others = map.sites.filter(s => s !== map.start), sites = [map.start, ...others];
  slots.forEach((o, id) => {
    const fac = o.faction === 'random' ? FACTIONS[Math.floor(trng() * FACTIONS.length)].id : o.faction, isHuman = o.type === 'human';
    st.players.push({ id, color: o.color, ...(isHuman && o.name ? { name: o.name } : {}), ...(o.team ? { team: o.team } : {}), human: isHuman, faction: fac, resources: { ...(isHuman ? d : DIFFICULTIES[1]).res }, explored: new Uint8Array(map.n * map.n) });
    createTown(st, sites[id].x, sites[id].y, id, fac);
  });
  for (const s of sites.slice(slots.length)) createNeutralTown(st, s, trng);
  rebuildObjIndex(st);
  for (const p of st.players) { // bohater startowy: wybrany przy nowej grze (slots[].hero) albo losowy z puli frakcji
    const t = st.towns.find(t => t.owner === p.id), want = slots[p.id].hero, pk = want && want !== 'random' && factionOf(p.faction).heroes.find(([n]) => n === want);
    const h = createHero(st, p.id, t.x, t.y, pk ? { name: pk[0], cls: pk[1], female: !!pk[2], fac: p.faction } : null);
    if (p.human) p.bonusText = startBonus(st, S.bonus, p, h, rng);
    reveal(st, h.x, h.y, HERO_SIGHT + 6, p.id); // start: okolica własnego miasta odkryta (ok. dzień marszu)
    if (rule(st, 'reveal')) p.explored.fill(1); // zasada „odkryta mapa”
  }
  ensureProgress(st);
  st.cur = ME = st.players.find(p => p.human).id; st.bonusText = human(st).bonusText; st.selHero = st.heroes.findIndex(h => h.owner === ME);
  return st;
}
// Postęp bez przestojów: z każdego startu da się wyjść, walcząc z oddziałami w zasięgu armii. Kieszeń wokół startu = to, co bohater
// osiągnie, nie walcząc ze strażnikiem silniejszym niż próg × armia startowa. Gdy jest mniejsza niż wymagana część lądu, najbliższy
// strażnik na jej granicy słabnie (mniej stworów, a gdy nawet jeden jest za silny – słabszy gatunek). Najpierw próg 1 (pierwsze
// wyjście za darmo przy rozsądnej grze), potem 2,2 (po tygodniu–dwóch rozwoju świat stoi otworem dalej).
const PROGRESS = [[1.0, 0.12, 0.75], [2.2, 0.3, 1.7]]; // [próg siły × armia, część lądu poziomu, siła strażnika po osłabieniu × armia]
function ensureProgress(st) {
  const m = st.map, n = m.n, N = n * n, pw = o => o.count * CREATURES[o.cid].value;
  for (const p of st.players) { const h = st.heroes.find(x => x.owner === p.id); if (!h) continue;
    const army = Math.max(600, armyPower(h.army)), lv = levelOf(m, h.x, h.y); let landN = 0;
    for (let i = 0; i < N; i++) if (m.terrain[i] !== TER.WATER && !m.obst[i] && levelOf(m, i % n, (i / n) | 0) === lv) landN++;
    for (const [k, need, to] of PROGRESS) for (let iter = 0; iter < 16; iter++) {
      const d = new Int32Array(N).fill(-1), q = [h.y * n + h.x], front = new Map(); d[q[0]] = 0;
      for (let i = 0; i < q.length; i++) { const c = q[i], x = c % n, y = (c / n) | 0;
        for (let dd = 0; dd < 8; dd++) { const X = x + DX8[dd], Y = y + DY8[dd], j = Y * n + X; if (X < 0 || Y < 0 || X >= n || Y >= n || d[j] >= 0 || m.terrain[j] === TER.WATER || m.obst[j]) continue;
          const ob = objectAt(st, j); if (ob && ob.type !== 'monster' && ob.type !== 'town') continue; // budynek: wejście, nie przejście
          const g = st.guard[j] && st.objects[st.guard[j] - 1]; if (g && !g.dead && pw(g) > army * k) { if (!front.has(g)) front.set(g, d[c]); continue; }
          d[j] = d[c] + 1; q.push(j); } }
      if (q.length >= need * landN || !front.size) break;
      const g = [...front].sort((a, b) => a[1] - b[1])[0][0], want = army * to;
      if (CREATURES[g.cid].value > want) { const lvl = Object.keys(NEUTRALS_BY_LEVEL).map(Number).filter(l => NEUTRALS_BY_LEVEL[l].some(c => CREATURES[c].value * 3 <= want)).pop() || 1;
        g.cid = NEUTRALS_BY_LEVEL[lvl].filter(c => CREATURES[c].value * 3 <= want)[0] || NEUTRALS_BY_LEVEL[1][0]; }
      g.count = g.base = Math.max(1, Math.floor(want / CREATURES[g.cid].value));
    }
  }
}
// Bonus startowy gracza-człowieka: złoto, drewno i ruda albo artefakt dla pierwszego bohatera
function startBonus(st, bonus, p, h, rng) {
  const R = p.resources;
  if (bonus === 'gold') { const g = 500 + Math.floor(rng() * 6) * 100; R.gold += g; return `+${g} złota`; }
  if (bonus === 'resource') { const a = 5 + Math.floor(rng() * 6); R.wood += a; R.ore += a; return `+${a} drewna i rudy`; }
  if (bonus === 'artifact') { const pool = ARTS_BY_RARITY('treasure'), id = pool[Math.floor(rng() * pool.length)]; giveArtifact(h, id); h.mp = heroMaxMP(h); return `artefakt: ${ARTIFACTS[id].name}`; }
  return '';
}
function startNewGame() { saveSettings(); G.state = createNewGame(G.settings); G.go('adventure', { welcome: true }); }

