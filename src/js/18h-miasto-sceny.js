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
// Miejsce budowli podane na ekranie: sx = środek w pikselach kadru (8–584), Z = głębokość (X świata wylicza się sam)
const atPx = (sx, Z, o) => [Math.round((sx - 296) * Z), Z, o];

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
  for (const i of Sc.islandsUnder || []) { const S = L.slots[i]; L.islands.push({ X: S.X, Z: S.Z - 0.012, rx: S.w * S.k * 0.62 * S.Z / 1.4 + 26, rz: 0.075 }); }
  if (Sc.road) { // droga główna podana wprost: [X, Z, e, szerokość]
    const R = { w: Sc.road.w || 44, steps: Sc.road.pts.some(p => p[2] > 2), planks: !!Sc.planks, pts: Sc.road.pts.map(p => p.slice()), main: true };
    L.roads.push(R); T.main = R.pts.map(p => [p[0], p[1]]); T.feats.push({ pts: T.main, w: R.w });
  } else townMainRoad(r, T, L);
  L.plaza = Sc.plaza || null; // plac tylko tam, gdzie scena go podaje (bez placów: spokojniejszy teren)
  for (const Rd of Sc.roads || []) { L.roads.push({ ...Rd, pts: Rd.pts.map(p => p.slice()) }); T.feats.push({ pts: Rd.pts.map(p => [p[0], p[1]]), w: Rd.w }); }
  if (Sc.wall) { L.walls = [{ style: Sc.wall.style || St.walls[0], h: Sc.wall.h || 30, pts: Sc.wall.pts }]; T.feats.push({ pts: Sc.wall.pts, w: 30 }); }
  townPaths(r, T, L, Bm, Sc.walks || []);
  for (const [kind, X, Z, k = 1, e] of Sc.props || []) L.props.push([kind, X, Z, e ?? townElev(T, L, X, Z), k]);
  if (L.walls) townWallGates(r, T, L);
  if (!Sc.planks) { L.roads = []; L.bridges = L.bridges.slice(0, (Sc.bridges || []).length); } // bez dróg jak w Heroes 3 (poza kładkami Twierdzy); trasy do drzwi zostają dla straży i wyboru miejsc
  townFolk(r, T, L, Bm); L.folk = []; // bez chodzących mieszkańców: została tylko straż przed zamkiem
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
    { X: -130, Z: 2.3, rx: 360, h: 64, flat: 0.2 },
    { X: 470, Z: 2.72, rx: 300, h: 86, rock: true, flat: 0.3, cols: ['#6a665c', '#43423a'] },
  ],
  rivers: [{ w: 66, pts: [[-1100, 1.86], [-700, 1.8], [-420, 1.76], [-200, 1.74], [0, 1.76], [220, 1.8], [480, 1.78], [800, 1.72], [1100, 1.68]] }],
  entryX: 10,
  slots: [
    atPx(310, 1.28, { k: 1.15 }), [-130, 0, { hill: 0, k: 1.6 }], atPx(425, 2.12, { k: 1.2 }), [470, 0, { hill: 1, k: 1.35 }], atPx(95, 2.0, { k: 1.3 }), atPx(540, 1.95, { k: 1.25 }), atPx(480, 1.42, { k: 1.15 }), atPx(42, 1.55, { k: 1.2 }),
    atPx(195, 0.96), atPx(556, 1.3), atPx(70, 1.0), atPx(515, 1.02, { flip: true }), atPx(128, 1.3, { k: 1.1 }), atPx(390, 0.96, { flip: true, k: 1.1 }), atPx(200, 1.56, { k: 1.15 }), atPx(398, 1.62),
  ],
  props: [
    ['tree', -620, 2.3, 1.4], ['tree', 700, 2.2, 1.4], ['tree', 40, 2.75, 1.4], ['tree', -40, 2.8, 1.4], ['bush', -250, 0.9], ['bush', 280, 0.9], ['mushroom', -30, 0.9],
  ],
  weather: {}, birds: true,
};

// --- Knieja: polana w puszczy nad leśnym jeziorem, Drzewo Rady za wodą, smocze urwisko w głębi ---
TOWN_SCENES.sylvan = {
  pj: { hor: 120, d: 270 }, frame: 'forest',
  sky: { top: '#0e1614', mid: '#2a3a30', hor: '#a88450', sun: [420, 150], cloudDark: 'rgba(24,32,28,.6)', cloudLit: 'rgba(200,150,90,.4)' },
  hills: [{ X: -300, Z: 2.5, rx: 320, h: 34, flat: 0.3 }, { X: 470, Z: 2.85, rx: 280, h: 86, rock: true, cols: ['#4a5448', '#2e362c'] }],
  lakes: [{ X: -80, Z: 1.42, rx: 150, rz: 0.17 }],
  entryX: 60,
  slots: [
    atPx(360, 1.9, { k: 1.1 }), [-300, 0, { hill: 0, k: 1.45 }], atPx(465, 2.05), [470, 0, { hill: 1, k: 1.25 }], atPx(515, 1.62), atPx(165, 1.62), atPx(85, 1.62), atPx(470, 1.35),
    atPx(405, 1.0), atPx(255, 2.3), atPx(110, 1.03), atPx(515, 1.0), atPx(235, 1.0), atPx(395, 1.3), atPx(215, 1.95, { k: 1.1 }), atPx(290, 1.72),
  ],
  props: [['fern', 40, 0.9], ['mushroom', 20, 1.2], ['rock', -30, 1.62], ['tree', -560, 1.25, 1.3], ['tree', 560, 1.2, 1.3]],
  floaters: [{ kind: 'wisp', X: -80, Z: 1.42, e: 18, n: 6, spread: 110, spreadZ: 0.15 }, { kind: 'wisp', X: -250, Z: 1.9, e: 30, n: 3, spread: 90, spreadZ: 0.2, seed: 5 }],
  weather: {}, birds: true, birdCol: 'rgba(20,30,20,.8)',
};

// --- Kurhan: przepaść biegnąca w głąb, kościany most, cytadela na iglicy pod olbrzymim księżycem ---
TOWN_SCENES.barrow = {
  pj: { hor: 40, d: 330 },
  sky: TOWN_LAYOUTS.barrow.sky,
  hills: TOWN_LAYOUTS.barrow.hills,
  rivers: [{ w: 150, chasm: true, pts: TOWN_LAYOUTS.barrow.river.pts }],
  bridges: [{ X: 0, Z: 1.46, w: 170 }],
  slots: [
    atPx(150, 1.42, { k: 1.1 }), [0, 2.5, { e: 80, k: 1.25 }], atPx(425, 1.62), [440, 0, { hill: 1, k: 1.15 }], [-440, 0, { hill: 2, k: 1.15 }], atPx(205, 2.0), atPx(525, 1.42), atPx(385, 2.0),
    atPx(420, 1.0), atPx(40, 1.62), atPx(70, 1.02), atPx(530, 1.03, { flip: true }), atPx(170, 1.0), atPx(400, 1.28), atPx(55, 2.0), atPx(245, 1.75),
  ],
  props: [['tree', -620, 2.4, 1.3], ['tree', 640, 2.3, 1.3], ['grave', -20, 0.9], ['grave', 50, 0.92], ['lamp', -85, 1.42], ['lamp', 85, 1.42]],
  floaters: TOWN_LAYOUTS.barrow.floaters,
  weather: { mist: true }, birds: true, birdCol: 'rgba(10,8,14,.9)',
};

// --- Twierdza: mokradło, każda chata na własnej wysepce, twierdza na drugim brzegu, wierzby i mgła ---
TOWN_SCENES.fortress = {
  sky: TOWN_LAYOUTS.fortress.sky,
  hills: [{ X: 500, Z: 2.7, rx: 320, h: 70, rock: true, cols: ['#5a5e4a', '#3e4234'] }],
  lakes: [{ X: 0, Z: 1.7, rx: 1500, rz: 0.58 }],
  entryX: 0,
  slots: [
    atPx(300, 1.38, { k: 1.1 }), atPx(300, 2.42, { k: 1.45 }), atPx(150, 2.38, { k: 1.2 }), [500, 0, { hill: 0, k: 1.3 }], atPx(55, 2.35), atPx(425, 2.0), atPx(495, 1.5), atPx(125, 1.95),
    atPx(190, 0.97), atPx(560, 1.28), atPx(70, 1.0), atPx(525, 1.0, { flip: true }), atPx(410, 0.96), atPx(75, 1.4), atPx(205, 1.62, { k: 1.1 }), atPx(385, 1.72),
  ],
  islandsUnder: [0, 5, 6, 7, 9, 13, 14, 15],
  props: [['reeds', -150, 1.16], ['reeds', 150, 1.18], ['reeds', 420, 1.6], ['reeds', -470, 1.8], ['tree', -620, 2.5, 1.4], ['tree', 700, 2.4, 1.4], ['mushroom', -40, 0.9]],
  floaters: TOWN_LAYOUTS.fortress.floaters,
  weather: { mist: true }, birds: true, birdCol: 'rgba(20,28,16,.85)',
};

// --- Inferno: krater z jeziorem lawy, cytadela na bazaltowym płaskowyżu, iglice skał dookoła ---
TOWN_SCENES.inferno = {
  pj: { hor: 60, d: 310 },
  sky: TOWN_LAYOUTS.inferno.sky,
  hills: [{ X: -540, Z: 2.6, rx: 300, h: 90, rock: true, flat: 0.5 }, { X: 540, Z: 2.6, rx: 300, h: 100, rock: true, flat: 0.5 }],
  lakes: [{ X: 0, Z: 1.58, rx: 150, rz: 0.18, pit: true }],
  slabs: [{ x0: -270, x1: 270, Z0: 2.2, Z1: 2.9, e: 70, jag: 5 }],
  entryX: 0,
  slots: [
    atPx(150, 1.4, { k: 1.1 }), atPx(296, 2.5, { k: 1.3 }), atPx(455, 1.6), [540, 0, { hill: 1, k: 1.15 }], [-540, 0, { hill: 0, k: 1.15 }], atPx(205, 2.08), atPx(530, 1.3), atPx(385, 2.05),
    atPx(420, 1.0), atPx(40, 1.6), atPx(70, 1.02), atPx(530, 1.03, { flip: true }), atPx(180, 1.0), atPx(385, 1.24), atPx(45, 1.98), atPx(296, 1.95),
  ],
  props: [['spike', -60, 1.95, 1.3], ['spike', 60, 1.95, 1.3], ['brazier', -40, 0.92], ['brazier', 50, 0.92]],
  floaters: [{ kind: 'ember', X: 0, Z: 1.55, e: 10, n: 12, spread: 120, spreadZ: 0.25 }],
  weather: { embers: true }, birds: false, /* w piekle bez ptaków */
};

// --- Akademia: ośnieżone tarasy z kamiennymi schodami, zamek magów na najwyższym ---
TOWN_SCENES.academy = {
  pj: { hor: 80, d: 290 },
  sky: TOWN_LAYOUTS.academy.sky,
  slabs: [{ x0: -1600, x1: 1600, Z0: 1.45, Z1: 1.95, e: 40, stairs: [[4, 0]] }, { x0: -1600, x1: 1600, Z0: 1.95, Z1: 2.4, e: 86, stairs: [[-158, 40]] }, { x0: -1600, x1: 1600, Z0: 2.4, Z1: 3.4, e: 136, stairs: [[290, 86]] }],
  entryX: 20,
  slots: [
    atPx(296, 1.62, { k: 1.1 }), atPx(296, 2.62, { k: 1.4 }), atPx(130, 2.15, { k: 1.2 }), atPx(480, 2.65, { k: 1.2 }), atPx(185, 2.7, { k: 1.2 }), atPx(460, 2.15), atPx(470, 1.6), atPx(45, 1.7),
    atPx(190, 1.0), atPx(560, 1.55), atPx(70, 1.02), atPx(520, 1.02, { flip: true }), atPx(410, 1.0), atPx(135, 1.3), atPx(150, 1.65), atPx(385, 1.75),
  ],
  props: [['snowPine', -600, 1.3, 1.3], ['snowPine', 620, 1.25, 1.3], ['snowPine', -700, 2.2, 1.3], ['snowPine', 700, 2.3, 1.3], ['iceCrystal', -60, 0.9], ['iceCrystal', 80, 0.92]],
  weather: { snow: true }, birds: true, birdCol: 'rgba(30,36,50,.8)',
};

// --- Loch: podziemna grota z jeziorem świecącej wody, cytadela na skalnym progu, stalagmity i grzyby ---
TOWN_SCENES.dungeon = {
  frame: 'cave', water: 'glow',
  sky: { cave: true, top: '#07050c', mid: '#1a1226', hor: '#3a2a4a', sun: [300, 200] },
  slabs: [{ x0: -330, x1: 330, Z0: 2.2, Z1: 2.9, e: 60, jag: 6 }],
  lakes: [{ X: 280, Z: 1.75, rx: 150, rz: 0.14 }],
  entryX: -20,
  slots: [
    atPx(190, 1.4, { k: 1.1 }), atPx(296, 2.35, { k: 1.4 }), atPx(470, 2.15), atPx(125, 2.45, { k: 1.15 }), atPx(540, 2.5, { k: 1.15 }), atPx(390, 2.05), atPx(60, 1.42), atPx(215, 2.02),
    atPx(190, 0.98), atPx(545, 1.25), atPx(70, 1.02), atPx(480, 1.03, { flip: true }), atPx(360, 1.0), atPx(60, 1.95), atPx(440, 1.36), atPx(315, 1.62),
  ],
  props: [['stalagmite', -560, 1.2, 1.4], ['stalagmite', 580, 1.4, 1.3], ['glowShroom', 20, 1.2], ['glowShroom', -60, 0.92], ['bones', 300, 0.92]],
  floaters: [{ kind: 'spore', X: 280, Z: 1.75, e: 20, n: 10, spread: 200, spreadZ: 0.2 }],
  weather: { spores: true }, birds: false,
};

// --- Cytadela: step o zachodzie słońca, twierdza na stołowej górze, oaza z palmami, palisada z bramą ---
TOWN_SCENES.stronghold = {
  pj: { hor: 86, d: 290 },
  sky: TOWN_LAYOUTS.stronghold.sky,
  slabs: [{ x0: -380, x1: 120, Z0: 2.15, Z1: 2.9, e: 100, jag: 7, top: ['#c4895a', '#a06a40'], face: ['#a45e36', '#5e3218'] }],
  hills: [{ X: 480, Z: 2.75, rx: 280, h: 70, flat: 0.25 }],
  lakes: [{ X: 300, Z: 1.38, rx: 110, rz: 0.1 }],
  wall: { style: 'palisade', h: 30, pts: Array.from({ length: 61 }, (_, i) => [-1500 + i * 50, 1.88 + Math.sin(i * 0.4) * 0.03]) },
  entryX: -30,
  slots: [
    atPx(260, 1.35, { k: 1.1 }), atPx(225, 2.5, { k: 1.5 }), atPx(430, 2.2), [480, 0, { hill: 0, k: 1.15 }], atPx(80, 2.2), atPx(345, 2.05), atPx(90, 1.45), atPx(545, 2.1),
    atPx(180, 0.98), atPx(40, 1.75), atPx(70, 1.02), atPx(400, 1.0, { flip: true }), atPx(530, 1.05), atPx(420, 1.6), atPx(160, 1.62), atPx(370, 1.5),
  ],
  props: [['acacia', -560, 1.3, 1.3], ['acacia', 620, 1.5, 1.2], ['cactus', -40, 0.92], ['cactus', 60, 0.95], ['rock', 700, 1.6]],
  weather: {}, birds: true, birdCol: 'rgba(60,30,10,.8)',
};
