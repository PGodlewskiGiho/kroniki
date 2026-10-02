// ==================== MIASTO: TEREN I DROGI SCEN ==========================================
// Narzędzia do scen miast (MIASTO: SCENY FRAKCJI): rodzaje wody i nieba, styl frakcji (TOWN_STYLE: woda, tarasy,
// wzgórza, mury), wysokość gruntu, zasłanianie, główna droga z mostami i schodami oraz bramy w murze.
// Nowa frakcja = TOWN_ART (paleta), BUILD_ART (rysunki budowli), TOWN_LAYOUTS (rozmiary miejsc i barwy ziemi), TOWN_STYLE i TOWN_SCENES.
//
// Świat jak w MIASTO: GRAFIKA: X w poziomie (piksele przy Z = 1), Z = odległość (0,8 tuż przy kadrze, 3 daleko), e = wysokość.

// skrót tekstu (FNV) z wymieszaniem bitów: podobne nazwy dają zupełnie różne ziarna (bez tego pierwsze losowania były podobne)
const strHash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };
const between = (r, a, b) => a + r() * (b - a);

// Rodzaje wody (rzeka, jezioro, morze) i przepaści
const TOWN_WATER = {
  blue: { river: ['#7890a4', '#1e3c58'], lake: ['#8aa0b0', '#264a62'], rim: '#5a6a44', edge: 'rgba(200,215,210,.45)', reeds: true },
  teal: { river: ['#7aa0a0', '#1e4a52'], lake: ['#8aa0a0', '#264a52'], rim: '#4a5a34', edge: 'rgba(200,225,210,.45)', reeds: true },
  murky: { river: ['#6a8a78', '#122620'], lake: ['#6a8a80', '#10221e'], rim: '#34402a', edge: 'rgba(170,200,150,.45)', reeds: true },
  dark: { river: ['#3a3450', '#0a0810'], lake: ['#3a3450', '#0a0810'], rim: '#2a2632', edge: 'rgba(120,110,150,.5)', chasm: { cols: ['#2a2034', '#040308'] } },
  lava: { river: ['#ff9a3a', '#6a0e04'], lake: ['#ffc050', '#7a1a06'], rim: '#2a1410', edge: 'rgba(40,10,6,.9)', hot: '#ff7a1a',
    chasm: { cols: ['#ff9a3a', '#6a0e04'], line: 'rgba(255,240,160,.6)', edge: 'rgba(40,10,6,.9)', glow: '255,120,30', glowA: 0.2 } },
  ice: { river: ['#d4e4f0', '#7e9cbc'], lake: ['#e0ecf6', '#8aa6c4'], rim: '#b8c4d4', edge: 'rgba(250,252,255,.75)' },
};
const TOWN_STYLE = {
  haven: { walls: ['stone', 0.5], masonry: true, water: 'blue', lamp: 'lamp', sand: '#cdb88c',
    slab: { top: ['#6a8a44', '#4e6a34'], face: ['#8a8272', '#4a463e'] }, hill: ['#566c3a', '#344628'] },
  sylvan: { walls: ['palisade', 0.3], water: 'teal', lamp: 'lamp', sand: '#a89a6a', slab: { top: ['#4c7a3a', '#34582a'], face: ['#6a6a50', '#3a3a2a'] }, hill: ['#3a5a2e', '#26401e'] },
  barrow: { walls: ['iron', 0.45], water: 'dark', lamp: 'lamp', sand: '#4a4454', slab: { top: ['#4a4454', '#34303e'], face: ['#3a3444', '#1e1b24'] }, hill: ['#34303c', '#1e1b24'] },
  fortress: { walls: ['palisade', 0.55], water: 'murky', lamp: 'lamp', sand: '#6a6a44', slab: { top: ['#5a6040', '#3e4a2c'], face: ['#5a5a44', '#34342a'] }, hill: ['#4a5a36', '#34422a'] },
  inferno: { walls: ['spiked', 0.5], masonry: true, water: 'lava', lamp: 'brazier', sand: '#3a2420', slab: { top: ['#4a2a24', '#2e1a16'], face: ['#3a1e1a', '#1e0e0c'] }, hill: ['#3a1e1a', '#1e0e0c'] },
  academy: { walls: ['stone', 0.45], masonry: true, water: 'ice', lamp: 'lamp', sand: '#c8d0dc', slab: { top: ['#cfd8e4', '#aebacc'], face: ['#8a94a6', '#525a6c'] }, hill: ['#d4dce8', '#a8b4c6'] },
};
const hillTop = (Hl, X) => Hl.h * Math.pow(Math.max(0, 1 - ((X - Hl.X) / Hl.rx) ** 2), Hl.flat || 0.65);

// --- sprawdzanie miejsca: teren, woda, drogi, zasłanianie ---
function townElev(T, L, X, Z) { // wysokość gruntu: taras albo płaskowyż pod punktem (wzgórza tylko przez strefy na grzbiecie)
  let e = 0; for (const Sb of L.slabs) if (Z >= Sb.Z0 && Z <= Sb.Z1 && X >= Sb.x0 && X <= Sb.x1) e = Math.max(e, Sb.e); return e;
}
function inIsland(T, X, Z, k = 1) { return T.islands.some(I => ((X - I.X) / (I.rx * k)) ** 2 + ((Z - I.Z) / (I.rz * k)) ** 2 < 1); }
function polyDist(X, Z, pts) { // odległość punktu od łamanej w świecie (Z ×300, jak wstęgi dróg i rzek)
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1] * 300, bx = pts[i + 1][0], bz = pts[i + 1][1] * 300, dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const u = clamp(((X - ax) * dx + (Z * 300 - az) * dz) / l2, 0, 1); best = Math.min(best, Math.hypot(X - ax - u * dx, Z * 300 - az - u * dz));
  }
  return best;
}
function townBlocked(T, L, X, Z, e, halfW, onIsland) {
  for (const f of T.feats) for (let k = -1; k <= 1; k++) if (polyDist(X + k * halfW * 0.8, Z, f.pts) < f.w / 2 + 6) return true;
  if (!onIsland) for (const Lk of T.ells) for (let k = -1; k <= 1; k++) if (((X + k * halfW * 0.8 - Lk.X) / (Lk.rx + 12)) ** 2 + ((Z - Lk.Z) / (Lk.rz + 0.04)) ** 2 < 1 && !inIsland(T, X + k * halfW * 0.8, Z, 0.95)) return true;
  if (T.sea) for (let k = -1; k <= 1; k++) if (T.sea.s * (X + k * halfW) > T.sea.s * T.sea.xAt(Z) - 20) return true;
  for (const Hl of L.hills) if (Z > Hl.Z - 0.03 && Math.abs(X - Hl.X) < Hl.rx && e < hillTop(Hl, X) - 2) return true;
  for (const Sb of L.slabs) if (Z > Sb.Z0 - 0.03 && X + halfW > Sb.x0 && X - halfW < Sb.x1 && e < Sb.e - 2) return true;
  for (const Sb of L.slabs) if (e === Sb.e && Z >= Sb.Z0 && (X - halfW < Sb.x0 - 4 || X + halfW > Sb.x1 + 4) && townElev(T, L, X, Z) === Sb.e) return true; // nie zwisa z krawędzi
  return false;
}
function slotRect(S) { const [sx, sy, s] = proj(S.X, S.Z, S.e), sc = s * S.k, w = S.w * sc, h = S.h * sc; return { x: sx - w / 2, y: sy - h, w, h, sx, sy }; }
const rectOverlap = (a, b) => { const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? (w * h) / Math.min(a.w * a.h, b.w * b.h) : 0; };

// Główna droga: od brzegu kadru przez plac przed ratuszem do zamku; mosty nad rzeką i przepaścią, schody na tarasy
function townMainRoad(r, T, L) {
  const hall = L.slots[0], fort = L.slots[1], way = [[T.entryX, 0.78, 0, 58]], bridges = [];
  const front = S => [S.X + between(r, -0.15, 0.15) * S.w * S.k, S.Z - 0.035, S.e];
  const hallF = front(hall), fortF = front(fort);
  const cross = (a, b) => { // przejście przez rzekę albo przepaść między punktami a i b
    if (T.river) { const zr = X => { const p = T.river.pts; for (let k = 0; k < p.length - 1; k++) if (X >= p[k][0] && X <= p[k + 1][0]) return p[k][1] + (p[k + 1][1] - p[k][1]) * (X - p[k][0]) / (p[k + 1][0] - p[k][0]); return p[0][1]; };
      const Xc = (a[0] + b[0]) / 2, Zc = zr(Xc), hw = T.river.w / 600 + 0.03; if ((a[1] - Zc) * (b[1] - Zc) < 0) { bridges.push({ X: Xc, Z: Zc, w: T.river.w + 24 }); return [[Xc, Zc - hw, 0], [Xc, Zc + hw, 0]]; } }
    if (T.chasm) { const p = T.chasm.pts, cx = Z => { for (let k = 0; k < p.length - 1; k++) if (Z >= p[k][1] && Z <= p[k + 1][1]) return p[k][0] + (p[k + 1][0] - p[k][0]) * (Z - p[k][1]) / (p[k + 1][1] - p[k][1]); return p[p.length - 1][0]; };
      const Zb = clamp((a[1] + b[1]) / 2, 1.1, 2.1), Xb = cx(Zb), wB = 170 - (Zb - 0.78) / 0.26 * 20 + 40; if ((a[0] - cx(a[1])) * (b[0] - cx(b[1])) < 0 && b[1] < 2.3) { bridges.push({ X: Xb, Z: Zb, w: wB, bone: L.bone }); return [[Xb - Math.sign(b[0] - a[0]) * wB / 2, Zb, 0], [Xb + Math.sign(b[0] - a[0]) * wB / 2, Zb, 0]]; } }
    return [];
  };
  const climb = (a, b) => { const out = []; for (const Sb of L.slabs) if (a[1] < Sb.Z0 && b[1] > Sb.Z0) { const f = (Sb.Z0 - a[1]) / (b[1] - a[1]), X = a[0] + (b[0] - a[0]) * f, e0 = townElev(T, L, X, Sb.Z0 - 0.02); out.push([X, Sb.Z0 - 0.015, e0, 34], [X, Sb.Z0 + 0.015, Sb.e, 34]); } return out; };
  const around = (a, b) => { // objazd jeziora (bez kładek): punkt obok brzegu po stronie bliższej drodze
    if (T.planks) return []; const out = [];
    for (const Lk of T.ells) { if (Lk.rz < 0.06) continue; let hit = false; for (let k = 1; k < 10; k++) { const f = k / 10, X = a[0] + (b[0] - a[0]) * f, Z = a[1] + (b[1] - a[1]) * f; if (((X - Lk.X) / (Lk.rx + 30)) ** 2 + ((Z - Lk.Z) / (Lk.rz + 0.05)) ** 2 < 1) hit = true; }
      if (hit) { const side = (a[0] + b[0]) / 2 < Lk.X ? -1 : 1; out.push([Lk.X + side * (Lk.rx + 60), Lk.Z, 0]); } }
    return out;
  };
  const leg = (a, b) => { for (const p of [...cross(a, b), ...climb(a, b), ...around(a, b)]) way.push(p); way.push(b); };
  leg(way[0], [hallF[0], hallF[1], hallF[2], 44]); leg(way[way.length - 1], [fortF[0], fortF[1], fortF[2], 34]);
  way.sort((a, b) => a[1] - b[1]);
  const steps = way.some(p => p[2] > 2);
  L.roads.push({ w: 44, steps, planks: !!T.planks, pts: way, main: true }); T.main = way.map(p => [p[0], p[1]]);
  T.feats.push({ pts: T.main, w: 44 }); L.bridges.push(...bridges);
  if (!hall.e && !T.planks) { L.plaza = { X: hall.X, Z: hall.Z - 0.09, r: between(r, 85, 120) }; T.ells.push({ X: L.plaza.X, Z: L.plaza.Z, rx: L.plaza.r, rz: L.plaza.r * 0.3 * hall.Z / (PJ.d || 280) }); }
}
// Mur: odcinki w wodzie, za wzgórzem albo na tarasie znikają, na drodze jest brama z dwiema basztami, co kilka odcinków baszta
function townWallGates(r, T, L) {
  const Wl = L.walls[0], segs = [], towers = [];
  for (let i = 0; i < Wl.pts.length - 1; i++) {
    const a = Wl.pts[i], b = Wl.pts[i + 1], mX = (a[0] + b[0]) / 2, mZ = (a[1] + b[1]) / 2, [sx] = proj(mX, mZ);
    const road = T.main && polyDist(mX, mZ, T.main) < 34, off = sx < -40 || sx > 632, hidden = townBlocked({ ...T, feats: [] }, L, mX, mZ, 0, 20, false);
    segs.push(road ? 'gate' : off || hidden ? null : [a, b]);
  }
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]; if (!Array.isArray(s)) continue;
    if (segs[i - 1] === 'gate') towers.push(s[0]); if (segs[i + 1] === 'gate') towers.push(s[1]);
    else if (i % 6 === 3 && Wl.style !== 'palisade' && Wl.style !== 'iron') towers.push(s[1]);
  }
  Wl.segs = segs.filter(Array.isArray); Wl.towers = towers;
}
