// ==================== MIASTO: SCENY FRAKCJI =============================================
// Każda frakcja ma jedną, ręcznie ułożoną scenę miasta (jak w Heroes 3): stałe niebo, teren, wodę, miejsca wszystkich
// 15 budowli, drogi, mosty i rekwizyty. Wszystkie miasta tej samej frakcji wyglądają tak samo; w zależności od stanu
// miasta zmieniają się tylko budowle (puste działki, kolejne poziomy). Ścieżki do drzwi i mieszkańców wylicza MIASTO: TEREN.
//
// Świat jak w MIASTO: GRAFIKA: X w poziomie (piksele przy Z = 1), Z = odległość (0,86 tuż przy kadrze, 3 daleko), e = wysokość.
// Miejsca (slots, kolejność jak BUILDINGS.slot): 0 ratusz, 1 zamek, 2 gildia, 3–7 siedliska 7–3, 8 kuźnia, 9 skarbiec zasobów,
// 10–11 siedliska 1–2, 12 tawerna, 13 rynek, 14 budowla specjalna, 15 budowla Graala. Wpis: [X, Z, { flip, hill: nr wzgórza, e: wysokość }].
// Rekwizyty: [rodzaj, X, Z, skala = 1, wysokość = teren]. walks: pomosty i ścieżki ułożone ręcznie ([[X, Z, e], ...],
// pierwszy punkt przy drodze głównej); ścieżki do pozostałych drzwi dołączają do nich same.

const TOWN_SCENES = {};

// Zbudowanie planszy L (jak dawniej z generatora) z opisu sceny
function buildTownScene(fac) {
  const Sc = TOWN_SCENES[fac] || TOWN_SCENES.haven, St = TOWN_STYLE[fac] || TOWN_STYLE.haven, B = TOWN_LAYOUTS[fac] || TOWN_LAYOUTS.haven, Bm = TOWN_BIOME[fac] || TOWN_BIOME.haven;
  const W = TOWN_WATER[Sc.water || St.water] || TOWN_WATER.blue, seed = strHash('scena:' + fac), r = mulberry32(seed), wx = Sc.weather || {};
  const L = { fac, seed, pj: Sc.pj || null, frame: Sc.frame || null, mountains: Sc.mountains || B.mountains, forest: Sc.forest || B.forest, ground: Sc.ground || B.ground,
    haze: Sc.haze || B.haze, desat: Sc.desat ?? B.desat, tuft: B.tuft || Bm.tuft, tufts: Bm.tufts, plazaCol: Bm.plaza,
    hills: (Sc.hills || []).map(Hl => ({ cols: St.hill, ...Hl, tufts: Bm.tufts > 0.3 })),
    rivers: (Sc.rivers || []).map(Rv => { const C = W.chasm || TOWN_WATER.dark.chasm; return Rv.chasm ? { cols: C.cols, line: C.line, edge: C.edge, glow: C.glow, glowA: C.glowA, noReeds: true, ...Rv } : { cols: W.river, edge: W.edge, noReeds: !W.reeds, ...Rv }; }),
    lakes: (Sc.lakes || []).map(Lk => ({ cols: W.lake, rim: W.rim, reeds: W.reeds, hot: W.hot, ...Lk })), islands: (Sc.islands || []).map(I => ({ ...I })),
    slabs: (Sc.slabs || []).map(Sb => ({ ...St.slab, masonry: St.masonry, jag: 0, ...Sb })), seas: (Sc.seas || []).map(Sa => ({ cols: W.lake, sand: St.sand, ...Sa })),
    roads: [], bridges: (Sc.bridges || []).map(Br => ({ bone: fac === 'barrow', ...Br })), props: [], slots: [], bone: fac === 'barrow',
    birds: Sc.birds ?? B.birds, birdCol: Sc.birdCol || B.birdCol, mist: !!wx.mist, rain: !!wx.rain, snow: !!wx.snow, embers: !!wx.embers, spores: !!wx.spores, dust: !!wx.dust };
  const T = { feats: [], ells: [], islands: L.islands, focus: { X: 0, Z: 1.25 }, entryX: Sc.entryX || 0, frozen: (Sc.water || St.water) === 'ice', planks: !!Sc.planks };
  for (const Rv of L.rivers) { if (Rv.chasm) { T.feats.push({ pts: Rv.pts, w: 190 }); T.chasm = { pts: Rv.pts }; } else { T.feats.push({ pts: Rv.pts, w: Rv.w + 24 }); T.river = { pts: Rv.pts, w: Rv.w }; } }
  for (const Lk of L.lakes) T.ells.push(Lk);
  for (const Sa of L.seas) { const p = Sa.pts; T.sea = { s: Sa.side, xAt: Z => { for (let k = 0; k < p.length - 1; k++) if (Z <= p[k + 1][1]) return p[k][0] + (p[k + 1][0] - p[k][0]) * clamp((Z - p[k][1]) / (p[k + 1][1] - p[k][1]), 0, 1); return p[p.length - 1][0]; } }; }
  usePJ(L); const hor = proj(0, 4.4)[1];
  L.sky = { ...Sc.sky, seed }; L.sky.sun = [Sc.sky.sun[0], Math.min(Sc.sky.sun[1], hor - 28)];
  L.ridge = Sc.ridge ? [Sc.ridge[0], Sc.ridge[1], hor + 12] : [1 + (seed % 997), 3 + (seed % 991), hor + 12];
  L.art = { ...(TOWN_ART[fac] || TOWN_ART.haven), ...(Sc.roof ? { roof: { ...TOWN_ART[fac].roof, ...Sc.roof } } : {}) };
  const onHill = (X, k) => { const Hl = L.hills[k]; return [Hl.Z - 0.004, hillTop(Hl, X)]; };
  L.slots = Sc.slots.map(([X, Z, o = {}], i) => {
    const D = B.slots[i]; let e = o.e; if (o.hill !== undefined) [Z, e] = onHill(X, o.hill); if (e === undefined) e = townElev(T, L, X, Z);
    return { X, Z, e, k: D.k * (o.k || 1), w: D.w, h: D.h, flip: !!o.flip };
  });
  if (Sc.road) { // droga główna podana wprost: [X, Z, e, szerokość]
    const R = { w: Sc.road.w || 44, steps: Sc.road.pts.some(p => p[2] > 2), planks: !!Sc.planks, pts: Sc.road.pts.map(p => p.slice()), main: true };
    L.roads.push(R); T.main = R.pts.map(p => [p[0], p[1]]); T.feats.push({ pts: T.main, w: R.w });
  } else townMainRoad(r, T, L);
  if (Sc.plaza !== undefined) L.plaza = Sc.plaza; // null = bez placu
  for (const Rd of Sc.roads || []) { L.roads.push({ ...Rd, pts: Rd.pts.map(p => p.slice()) }); T.feats.push({ pts: Rd.pts.map(p => [p[0], p[1]]), w: Rd.w }); }
  if (Sc.wall) { L.walls = [{ style: Sc.wall.style || St.walls[0], h: Sc.wall.h || 30, pts: Sc.wall.pts }]; T.feats.push({ pts: Sc.wall.pts, w: 30 }); }
  townPaths(r, T, L, Bm, Sc.walks || []);
  for (const [kind, X, Z, k = 1, e] of Sc.props || []) L.props.push([kind, X, Z, e ?? townElev(T, L, X, Z), k]);
  if (L.walls) townWallGates(r, T, L);
  townFolk(r, T, L, Bm);
  L.floaters = Sc.floaters || [];
  usePJ(null); return L;
}
const TownGenCache = new Map();
// Plansza miasta t: jedna na frakcję (zdobyte miasto innej frakcji ma scenę swojej frakcji)
function townLayout(t) {
  let L = TownGenCache.get(t.faction);
  if (!L) { L = buildTownScene(t.faction); TownGenCache.set(t.faction, L); }
  return L;
}

// --- Przystań: zielona dolina z rzeką, zamek na wzgórzu, katedra i warsztaty wokół rynku ---
TOWN_SCENES.haven = {
  pj: { hor: 92, d: 280 },
  sky: { top: '#2a4a82', mid: '#7a9cc4', hor: '#f0d8a8', sun: [470, 70], cloudDark: 'rgba(120,130,160,.55)', cloudLit: 'rgba(255,240,215,.8)' },
  hills: [
    { X: -250, Z: 2.3, rx: 330, h: 64, flat: 0.2 },
    { X: 470, Z: 2.72, rx: 300, h: 86, rock: true, flat: 0.3, cols: ['#6a665c', '#43423a'] },
  ],
  rivers: [{ w: 66, pts: [[-1100, 1.86], [-700, 1.8], [-420, 1.72], [-200, 1.66], [0, 1.68], [220, 1.74], [480, 1.72], [800, 1.64], [1100, 1.6]] }],
  entryX: 10,
  slots: [
    [10, 1.24], [-250, 0, { hill: 0 }], [150, 2.1], [470, 0, { hill: 1 }], [-300, 1.5], [270, 1.98], [300, 1.5], [60, 2.45, { flip: true }],
    [-230, 0.97], [-150, 1.5], [225, 0.97, { flip: true }], [150, 1.46], [-120, 1.0], [120, 1.0, { flip: true }], [-420, 1.95], [-80, 0, { hill: 0 }],
  ],
  props: [
    ['tree', -520, 1.2, 1.3], ['tree', -560, 1.55, 1.3], ['tree', 520, 1.25, 1.3], ['tree', 560, 1.5, 1.2], ['tree', -620, 2.3, 1.4], ['tree', 700, 2.2, 1.4],
    ['tree', 60, 2.6, 1.4], ['tree', -40, 2.7, 1.4], ['bush', -380, 1.02], ['bush', 400, 1.05], ['fence', -470, 0.98], ['fence', 470, 1.0], ['mushroom', -30, 0.9],
  ],
  weather: {}, birds: true,
};

// --- Knieja: polana w puszczy nad leśnym jeziorem, Drzewo Rady na drugim brzegu, smocze urwisko w głębi ---
TOWN_SCENES.sylvan = {
  pj: { hor: 150, d: 250 }, frame: 'forest',
  sky: { top: '#0e1614', mid: '#2a3a30', hor: '#a88450', sun: [420, 170], cloudDark: 'rgba(24,32,28,.6)', cloudLit: 'rgba(200,150,90,.4)' },
  hills: [{ X: -270, Z: 2.5, rx: 300, h: 30, flat: 0.3 }, { X: 470, Z: 2.85, rx: 280, h: 86, rock: true, cols: ['#4a5448', '#2e362c'] }],
  lakes: [{ X: -70, Z: 1.45, rx: 160, rz: 0.22 }],
  entryX: 60,
  slots: [
    [0, 2.05], [-250, 0, { hill: 0 }], [-300, 1.4], [470, 0, { hill: 1 }], [150, 1.85], [280, 1.55], [300, 2.65], [-200, 1.75],
    [-190, 0.95], [-470, 2.6], [230, 1.0, { flip: true }], [190, 1.6], [-80, 0.95], [110, 0.98, { flip: true }], [400, 2.05], [-130, 1.95],
  ],
  props: [['fern', 60, 0.92], ['fern', -40, 1.25], ['mushroom', 150, 1.2], ['mushroom', 20, 1.75], ['rock', -30, 1.8], ['bush', 300, 1.25], ['bush', -300, 1.35], ['tree', -470, 1.3, 1.3], ['tree', 480, 1.2, 1.3]],
  floaters: [{ kind: 'wisp', X: -70, Z: 1.45, e: 18, n: 6, spread: 110, spreadZ: 0.18 }, { kind: 'wisp', X: -250, Z: 1.9, e: 30, n: 3, spread: 90, spreadZ: 0.2, seed: 5 }],
  weather: {}, birds: true, birdCol: 'rgba(20,30,20,.8)',
};

// --- Kurhan: przepaść biegnąca w głąb, kościany most, cytadela na iglicy pod olbrzymim księżycem ---
TOWN_SCENES.barrow = {
  pj: { hor: 40, d: 330 },
  sky: TOWN_LAYOUTS.barrow.sky,
  hills: TOWN_LAYOUTS.barrow.hills,
  rivers: [{ w: 150, chasm: true, pts: TOWN_LAYOUTS.barrow.river.pts }],
  road: { w: 34, pts: [[-60, 0.8, 0, 46], [-80, 1.0], [-100, 1.2], [-90, 1.46], [90, 1.46], [110, 1.92], [80, 2.1, 20], [50, 2.3, 50], [24, 2.46, 76, 20]] },
  plaza: null,
  bridges: [{ X: 0, Z: 1.46, w: 170 }],
  slots: [...TOWN_LAYOUTS.barrow.slots.slice(0, 15).map((S, i) => [i === 6 ? -280 : S.X, S.Z, S.e !== undefined ? { e: S.e } : {}]), [-90, 1.95]],
  props: TOWN_LAYOUTS.barrow.props.map(([k, X, Z, e, s]) => [k, X, Z, s || 1, e]),
  floaters: TOWN_LAYOUTS.barrow.floaters,
  weather: { mist: true }, birds: true, birdCol: 'rgba(10,8,14,.9)',
};

// --- Twierdza: mokradło z wysepkami, kładki między chatami na palach, wierzby i mgła ---
TOWN_SCENES.fortress = {
  sky: TOWN_LAYOUTS.fortress.sky, planks: true,
  hills: [{ X: 500, Z: 2.7, rx: 320, h: 70, rock: true, cols: ['#5a5e4a', '#3e4234'] }],
  lakes: [{ X: 0, Z: 1.72, rx: 1500, rz: 0.6 }],
  islands: [
    { X: 0, Z: 1.34, rx: 190, rz: 0.1 }, { X: -240, Z: 2.02, rx: 230, rz: 0.1 }, { X: 270, Z: 1.7, rx: 210, rz: 0.1 },
    { X: -340, Z: 1.45, rx: 150, rz: 0.09 }, { X: 90, Z: 2.27, rx: 120, rz: 0.06 }, { X: 420, Z: 2.1, rx: 140, rz: 0.08 }, { X: -130, Z: 1.61, rx: 80, rz: 0.05 },
  ],
  entryX: 0,
  walks: [[[40, 1.3], [150, 1.46], [240, 1.66]], [[-40, 1.3], [-190, 1.4], [-320, 1.44]], [[250, 1.7], [350, 1.92], [410, 2.07]], [[20, 1.42], [60, 1.85], [90, 2.24]]],
  slots: [
    [0, 1.36], [-240, 2.03], [90, 2.28], [500, 0, { hill: 0 }], [-340, 1.46], [230, 1.72], [280, 1.28], [-80, 2.45],
    [-220, 0.95], [-470, 2.45], [230, 0.97, { flip: true }], [420, 2.1], [-110, 1.0], [120, 1.0, { flip: true }], [200, 2.45], [-130, 1.6],
  ],
  props: [['reeds', -150, 1.2], ['reeds', 150, 1.25], ['reeds', -60, 1.62], ['reeds', 420, 1.55], ['reeds', -470, 1.8], ['tree', -520, 1.2, 1.3], ['tree', 520, 1.15, 1.3], ['tree', -560, 2.5, 1.4], ['tree', 380, 2.55, 1.4], ['mushroom', -40, 0.9]],
  floaters: TOWN_LAYOUTS.fortress.floaters,
  weather: { mist: true }, birds: true, birdCol: 'rgba(20,28,16,.85)',
};

// --- Inferno: krater z jeziorem lawy, cytadela na bazaltowym płaskowyżu, iglice skał dookoła ---
TOWN_SCENES.inferno = {
  pj: { hor: 60, d: 310 },
  sky: TOWN_LAYOUTS.inferno.sky,
  hills: [{ X: -540, Z: 2.6, rx: 300, h: 90, rock: true, flat: 0.5 }, { X: 540, Z: 2.6, rx: 300, h: 100, rock: true, flat: 0.5 }],
  lakes: [{ X: 0, Z: 1.58, rx: 150, rz: 0.2, pit: true }],
  slabs: [{ x0: -270, x1: 270, Z0: 2.2, Z1: 2.9, e: 70, jag: 5 }],
  entryX: 0,
  slots: [
    [-150, 1.3], [0, 2.5], [230, 1.95], [-500, 0, { hill: 0 }], [280, 1.3], [-190, 2.05], [-370, 1.75], [210, 2.45],
    [-220, 0.95], [-330, 2.2], [230, 0.97, { flip: true }], [340, 1.75], [-110, 1.0], [120, 1.02, { flip: true }], [500, 0, { hill: 1 }], [90, 1.25],
  ],
  props: [['spike', -110, 1.25], ['spike', 120, 1.3], ['spike', -60, 1.9, 1.3], ['spike', 60, 1.95, 1.3], ['brazier', -40, 0.95], ['brazier', 50, 0.95], ['rock', -400, 1.1], ['rock', 420, 1.2]],
  floaters: [{ kind: 'ember', X: 0, Z: 1.5, e: 10, n: 12, spread: 120, spreadZ: 0.3 }],
  weather: { embers: true }, birds: true, birdCol: 'rgba(20,4,2,.9)',
};

// --- Akademia: ośnieżone tarasy nad zamarzniętym stawem, schody zygzakiem aż do zamku magów ---
TOWN_SCENES.academy = {
  pj: { hor: 80, d: 290 },
  sky: TOWN_LAYOUTS.academy.sky,
  slabs: [{ x0: -1600, x1: 1600, Z0: 1.45, Z1: 1.95, e: 40 }, { x0: -1600, x1: 1600, Z0: 1.95, Z1: 2.4, e: 86 }, { x0: -1600, x1: 1600, Z0: 2.4, Z1: 3.4, e: 136 }],
  lakes: [{ X: -330, Z: 1.18, rx: 120, rz: 0.12 }],
  road: { w: 34, pts: [[30, 0.8, 0, 42], [50, 1.1, 0], [70, 1.3, 0], [80, 1.43, 0], [80, 1.47, 40], [40, 1.53, 40], [10, 1.57, 40],
    [-60, 1.66, 40], [-90, 1.8, 40], [-95, 1.93, 40], [-95, 1.97, 86], [-40, 2.08, 86], [40, 2.2, 86], [60, 2.38, 86], [60, 2.42, 136], [20, 2.52, 136, 26]] },
  entryX: 20,
  slots: [
    [0, 1.62], [0, 2.62], [-300, 2.15], [430, 2.8], [-330, 1.7], [230, 2.2], [320, 1.62], [-470, 2.8],
    [-220, 0.95], [-240, 1.3], [230, 0.97, { flip: true }], [220, 1.28], [-110, 1.0], [120, 1.02, { flip: true }], [-130, 2.15], [-180, 1.62],
  ],
  props: [['snowPine', -540, 1.3, 1.3], ['snowPine', 560, 1.25, 1.3], ['snowPine', -600, 2.2, 1.3], ['snowPine', 600, 2.3, 1.3], ['iceCrystal', -250, 1.15], ['iceCrystal', 380, 1.1], ['rock', 300, 1.95]],
  weather: { snow: true }, birds: true, birdCol: 'rgba(30,36,50,.8)',
};

// --- Loch: podziemna grota z jeziorem świecącej wody, cytadela na skalnym progu, stalagmity i grzyby ---
TOWN_SCENES.dungeon = {
  frame: 'cave', water: 'glow',
  sky: { cave: true, top: '#07050c', mid: '#1a1226', hor: '#3a2a4a', sun: [300, 200] },
  slabs: [{ x0: -330, x1: 330, Z0: 2.2, Z1: 2.9, e: 60, jag: 6 }],
  lakes: [{ X: 250, Z: 1.5, rx: 170, rz: 0.2 }],
  entryX: -20,
  slots: [
    [-60, 1.4], [0, 2.5], [-260, 1.95], [-240, 2.55], [-300, 1.4], [240, 2.0], [280, 1.25], [230, 2.55],
    [-220, 0.95], [-420, 2.0], [230, 0.97, { flip: true }], [100, 1.62], [-110, 1.0], [120, 1.02, { flip: true }], [420, 2.1], [100, 2.1],
  ],
  props: [['stalagmite', -460, 1.2, 1.4], ['stalagmite', 470, 1.4, 1.3], ['stalagmite', -30, 1.9, 1.2], ['glowShroom', 60, 1.2], ['glowShroom', -420, 1.6], ['glowShroom', 150, 1.25], ['bones', -40, 0.95]],
  floaters: [{ kind: 'spore', X: 200, Z: 1.5, e: 20, n: 10, spread: 220, spreadZ: 0.3 }],
  weather: { spores: true }, birds: false,
};

// --- Cytadela: step o zachodzie słońca, twierdza na stołowej górze, oaza z palmami, palisada z bramą ---
TOWN_SCENES.stronghold = {
  pj: { hor: 86, d: 290 },
  sky: TOWN_LAYOUTS.stronghold.sky,
  slabs: [{ x0: -380, x1: 120, Z0: 2.15, Z1: 2.9, e: 100, jag: 7, top: ['#c4895a', '#a06a40'], face: ['#a45e36', '#5e3218'] }],
  hills: [{ X: 480, Z: 2.75, rx: 280, h: 70, flat: 0.25 }],
  lakes: [{ X: 300, Z: 1.35, rx: 120, rz: 0.12 }],
  wall: { style: 'palisade', h: 30, pts: Array.from({ length: 61 }, (_, i) => [-1500 + i * 50, 1.88 + Math.sin(i * 0.4) * 0.03]) },
  entryX: -30,
  slots: [
    [-60, 1.35], [-150, 2.5], [180, 2.2], [480, 0, { hill: 0 }], [-200, 1.4], [300, 2.2], [-360, 1.6], [30, 2.3],
    [-220, 0.95], [220, 1.85], [230, 0.97, { flip: true }], [330, 1.7], [-110, 1.0], [120, 1.02, { flip: true }], [-420, 2.3], [90, 1.22],
  ],
  props: [['acacia', 380, 1.2, 1.2], ['acacia', 200, 1.3, 1.1], ['acacia', -520, 1.3, 1.3], ['cactus', -40, 0.92], ['cactus', 60, 1.15], ['bones', 0, 1.6], ['totem', -30, 1.2], ['rock', 450, 1.6]],
  weather: {}, birds: true, birdCol: 'rgba(60,30,10,.8)',
};
