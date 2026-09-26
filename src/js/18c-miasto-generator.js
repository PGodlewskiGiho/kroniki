// ==================== MIASTO: GENERATOR PLANSZ ============================================
// Każde miasto ma własną planszę wyliczoną z frakcji i nazwy (to samo miasto zawsze wygląda tak samo, zapis gry nic
// nie przechowuje): typ krajobrazu (dolina z rzeką, jezioro, przepaść, tarasy, wyspy, płaskowyż, krater, wybrzeże),
// rozmieszczenie 14 budowli, drogi z mostami i schodami, place, drzewa i drobiazgi, pora dnia, pogoda i kolory dachów.
// Frakcja podaje tylko styl (TOWN_STYLE): wodę, ulubione krajobrazy z wagami, rekwizyty, niebo, pogodę i dachy.
// Nowa frakcja = TOWN_ART (paleta), BUILD_ART (rysunki budowli), TOWN_LAYOUTS (rozmiary miejsc i barwy ziemi) i TOWN_STYLE.
//
// Świat jak w MIASTO: GRAFIKA: X w poziomie (piksele przy Z = 1), Z = odległość (0,8 tuż przy kadrze, 3 daleko), e = wysokość.

// skrót tekstu (FNV) z wymieszaniem bitów: podobne nazwy dają zupełnie różne ziarna (bez tego pierwsze losowania były podobne)
const strHash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };
const pickW = (r, list) => { let s = 0; for (const [, w] of list) s += w; let x = r() * s; for (const [v, w] of list) if ((x -= w) < 0) return v; return list[0][0]; };
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
// Warianty nieba: pora dnia i nastrój (sun: położenie słońca albo księżyca; y przycinane do horyzontu)
const SKY_DAY = { top: '#2c5a9c', mid: '#6e9ccc', hor: '#e6dcc4', sun: [150, 60], cloudDark: 'rgba(150,165,190,.55)', cloudLit: 'rgba(255,255,250,.75)' };
const SKY_DAWN = { top: '#1e2238', mid: '#6a5a7a', hor: '#f0a878', sun: [440, 130], cloudDark: 'rgba(70,60,90,.7)', cloudLit: 'rgba(255,170,130,.6)' };
const SKY_NIGHT = { top: '#06080f', mid: '#141c30', hor: '#3a4260', sun: [420, 70], moon: true, moonR: 22, stars: true, cloudDark: 'rgba(20,24,40,.7)', cloudLit: 'rgba(150,160,200,.25)' };
const TOWN_STYLE = {
  haven: { walls: ['stone', 0.5], masonry: true, arche: [['valley', 3], ['coast', 2], ['terraces', 2], ['plateau', 2], ['lake', 1]], water: 'blue',
    trees: ['tree', 10, 16], deco: [['bush', 3], ['fence', 1], ['rock', 1], ['mushroom', 0.5]], lamp: 'lamp', sand: '#cdb88c',
    skies: [[TOWN_LAYOUTS.haven.sky, 3], [SKY_DAY, 3], [SKY_DAWN, 2], [SKY_NIGHT, 1]], weather: [['clear', 6], ['rain', 2], ['mist', 1]],
    slab: { top: ['#6a8a44', '#4e6a34'], face: ['#8a8272', '#4a463e'] }, hill: ['#566c3a', '#344628'],
    roofs: [TOWN_ART.haven.roof, { hall: '#c9a23a', dw: '#3a5f9e', util: '#5a6070', tower: '#b0432e', wall: '#4a5a7a' }, { hall: '#d8cfb8', dw: '#6a7a3a', util: '#8e5a32', tower: '#7a3a5a', wall: '#6a6a5a' }] },
  sylvan: { walls: ['palisade', 0.3], arche: [['lake', 3], ['valley', 2], ['islands', 1], ['plateau', 1]], water: 'teal', frame: 0.5,
    trees: ['tree', 14, 20], deco: [['fern', 3], ['mushroom', 2], ['bush', 2], ['rock', 1]], lamp: 'lamp', sand: '#a89a6a',
    skies: [[TOWN_LAYOUTS.sylvan.sky, 3], [{ top: '#24402e', mid: '#6a9a6a', hor: '#ece4a8', sun: [200, 70], cloudDark: 'rgba(90,120,90,.5)', cloudLit: 'rgba(255,250,210,.6)' }, 2], [{ ...SKY_NIGHT, hor: '#2a4a3a' }, 1]],
    weather: [['clear', 5], ['mist', 2], ['rain', 1]], slab: { top: ['#4c7a3a', '#34582a'], face: ['#6a6a50', '#3a3a2a'] }, hill: ['#3a5a2e', '#26401e'],
    roofs: [TOWN_ART.sylvan.roof, { hall: '#c8a040', dw: '#8a6a30', util: '#6a5a30', tower: '#3e6a8a', wall: '#5a7a3a' }, { hall: '#a8c85a', dw: '#c87a3a', util: '#7a6a40', tower: '#6a8a3e', wall: '#8a6a3a' }] },
  barrow: { walls: ['iron', 0.45], arche: [['chasm', 3], ['plateau', 2], ['crater', 2], ['valley', 1]], water: 'dark',
    trees: ['tree', 8, 14], deco: [['grave', 4], ['bones', 2], ['rock', 2], ['fence', 1]], lamp: 'lamp', sand: '#4a4454', skel: true,
    skies: [[TOWN_LAYOUTS.barrow.sky, 3], [{ top: '#0a0406', mid: '#2a0a14', hor: '#6a1a2a', sun: [180, 70], moon: true, moonR: 40, stars: true, cloudDark: 'rgba(20,6,10,.7)', cloudLit: 'rgba(200,80,90,.25)' }, 2],
      [{ top: '#1a1a22', mid: '#3a3a48', hor: '#6a6a78', sun: [420, 80], moon: true, moonR: 18, cloudDark: 'rgba(40,40,50,.7)', cloudLit: 'rgba(160,160,180,.3)' }, 1]],
    weather: [['mist', 3], ['clear', 2]], slab: { top: ['#4a4454', '#34303e'], face: ['#3a3444', '#1e1b24'] }, hill: ['#34303c', '#1e1b24'],
    roofs: [TOWN_ART.barrow.roof, { hall: '#6a2a3a', dw: '#4a2030', util: '#3a3440', tower: '#2a1a2a', wall: '#4a3040' }, { hall: '#3a4a50', dw: '#2e3a40', util: '#40444a', tower: '#1e2a30', wall: '#343c44' }] },
  fortress: { walls: ['palisade', 0.55], arche: [['islands', 4], ['valley', 2], ['lake', 2], ['coast', 1]], water: 'murky',
    trees: ['tree', 10, 16], deco: [['reeds', 4], ['bush', 1], ['mushroom', 1], ['fence', 1]], lamp: 'lamp', sand: '#6a6a44',
    skies: [[TOWN_LAYOUTS.fortress.sky, 3], [{ top: '#3a4a44', mid: '#6a7a6a', hor: '#a8b090', sun: [300, 90], cloudDark: 'rgba(70,80,70,.75)', cloudLit: 'rgba(190,200,170,.45)' }, 2], [{ ...SKY_NIGHT, hor: '#3a4a30' }, 1]],
    weather: [['mist', 4], ['rain', 2], ['clear', 1]], slab: { top: ['#5a6040', '#3e4a2c'], face: ['#5a5a44', '#34342a'] }, hill: ['#4a5a36', '#34422a'],
    roofs: [TOWN_ART.fortress.roof, { hall: '#6a5a2a', dw: '#5a6a30', util: '#4a4a2a', tower: '#3a5a3a', wall: '#5a4a2a' }, { hall: '#9a8a4a', dw: '#8a5a2a', util: '#6a4a2a', tower: '#4a6a5a', wall: '#7a6a3a' }] },
  inferno: { walls: ['spiked', 0.5], masonry: true, arche: [['chasm', 3], ['crater', 3], ['plateau', 2], ['valley', 1]], water: 'lava',
    trees: ['tree', 6, 10], deco: [['spike', 4], ['rock', 2], ['fence', 1]], lamp: 'brazier', sand: '#3a2420',
    skies: [[TOWN_LAYOUTS.inferno.sky, 3], [{ top: '#2a1a18', mid: '#6a3a2a', hor: '#d8804a', sun: [360, 80], cloudDark: 'rgba(50,30,26,.8)', cloudLit: 'rgba(255,150,80,.35)' }, 2],
      [{ top: '#000000', mid: '#2a0404', hor: '#8a1a0a', sun: [300, 60], moon: true, moonR: 34, stars: true, cloudDark: 'rgba(20,4,2,.8)', cloudLit: 'rgba(255,90,40,.3)' }, 1]],
    weather: [['embers', 1]], slab: { top: ['#4a2a24', '#2e1a16'], face: ['#3a1e1a', '#1e0e0c'] }, hill: ['#3a1e1a', '#1e0e0c'],
    roofs: [TOWN_ART.inferno.roof, { hall: '#3a1a1a', dw: '#5a2a1a', util: '#3a2a26', tower: '#8a3a10', wall: '#4a2a1a' }, { hall: '#a8401a', dw: '#7a3a1a', util: '#4a2a26', tower: '#2a0a0a', wall: '#6a1a16' }] },
  academy: { walls: ['stone', 0.45], masonry: true, arche: [['terraces', 4], ['plateau', 2], ['lake', 2], ['valley', 1], ['coast', 1]], water: 'ice',
    trees: ['snowPine', 12, 18], deco: [['iceCrystal', 3], ['rock', 2], ['fence', 1]], lamp: 'lamp', sand: '#c8d0dc',
    skies: [[TOWN_LAYOUTS.academy.sky, 3], [{ top: '#2a4a8a', mid: '#7aa0d8', hor: '#f0f0f8', sun: [180, 60], cloudDark: 'rgba(170,185,215,.55)', cloudLit: 'rgba(255,255,255,.8)' }, 3],
      [{ ...SKY_NIGHT, hor: '#2a6a6a', moonR: 18 }, 1]],
    weather: [['snow', 5], ['clear', 2]], slab: { top: ['#cfd8e4', '#aebacc'], face: ['#8a94a6', '#525a6c'] }, hill: ['#d4dce8', '#a8b4c6'],
    roofs: [TOWN_ART.academy.roof, { hall: '#7a3a8a', dw: '#5a4a9a', util: '#5a6a8e', tower: '#4a2a7a', wall: '#5a4a8a' }, { hall: '#2a7a8a', dw: '#3a6a9a', util: '#5a6a7a', tower: '#1e5a6a', wall: '#3a5a70' }] },
};
// Rola każdego z 14 miejsc: [najbliżej, najdalej] (Z), czy woli wzniesienia, czy to mała budowla przy drodze
const SLOT_ROLE = [
  [1.1, 1.7, 0, 0], [1.9, 2.9, 1, 0], [1.4, 2.4, 1, 0], [1.9, 2.9, 1, 0], [1.2, 2.2, 0, 0], [1.4, 2.4, 0, 0], [1.1, 1.9, 0, 0],
  [1.3, 2.3, 0, 0], [0.86, 1.2, 0, 1], [0.86, 1.25, 0, 1], [0.9, 1.4, 0, 1], [0.9, 1.5, 0, 1], [0.86, 1.3, 0, 1], [0.88, 1.35, 0, 1],
];
const SLOT_ORDER = [1, 0, 3, 2, 5, 7, 4, 6, 13, 12, 11, 10, 8, 9]; // najpierw duże i ważne
const hillTop = (Hl, X) => Hl.h * Math.pow(Math.max(0, 1 - ((X - Hl.X) / Hl.rx) ** 2), Hl.flat || 0.65);

// --- typy krajobrazu: każdy dopisuje teren do planszy L i strefy pod budowę do T ---
const ARCHETYPES = {
  valley(r, St, W, L, T) { // rzeka w poprzek, za nią wzgórza (czasem z płaskim szczytem pod zamek)
    const Zr = between(r, 1.5, 1.85), tilt = between(r, -0.18, 0.18), wR = between(r, 56, 84), ph = r() * 6, pts = [];
    for (let i = 0; i <= 8; i++) { const X = -1000 + i * 250; pts.push([X, Zr + tilt * X / 1000 + Math.sin(i * 0.9 + ph) * 0.08]); }
    L.rivers.push({ w: wR, pts, cols: W.river, edge: W.edge, noReeds: !W.reeds });
    T.feats.push({ pts, w: wR + 24 }); T.river = { pts, w: wR };
    for (let k = 0, n = 1 + (r() < 0.6 ? 1 : 0); k < n; k++) { const Hl = { X: between(r, -520, 520), Z: Math.min(2.85, Zr + between(r, 0.5, 0.95)), rx: between(r, 220, 360), h: between(r, 40, 80), cols: St.hill, rock: r() < 0.5, flat: r() < 0.6 ? 0.18 : 0.65 }; L.hills.push(Hl); }
    T.focus = { X: between(r, -120, 120), Z: between(r, 1.15, 1.3) }; T.entryX = between(r, -70, 70);
  },
  lake(r, St, W, L, T) { // jezioro pośrodku, czasem wysepka z pomostem
    const Lk = { X: between(r, -100, 100), Z: between(r, 1.4, 1.65), rx: between(r, 130, 200), rz: between(r, 0.18, 0.26), cols: W.lake, rim: W.rim, reeds: W.reeds, hot: W.hot };
    L.lakes.push(Lk); T.ells.push(Lk);
    if (r() < 0.5) { const I = { X: Lk.X + between(r, -0.2, 0.2) * Lk.rx, Z: Lk.Z + between(r, -0.05, 0.1), rx: Lk.rx * 0.36, rz: Lk.rz * 0.4 }; L.islands.push(I); T.islands.push(I); T.focus = { X: I.X, Z: I.Z }; T.planks = true; }
    else T.focus = { X: Lk.X + (r() < 0.5 ? -1 : 1) * (Lk.rx + 80), Z: Lk.Z - Lk.rz * 0.4 };
    if (r() < 0.6) { const Hl = { X: between(r, -500, 500), Z: between(r, 2.45, 2.85), rx: between(r, 240, 360), h: between(r, 40, 80), cols: St.hill, rock: r() < 0.5, flat: 0.2 }; L.hills.push(Hl); }
    T.entryX = between(r, -60, 60);
  },
  chasm(r, St, W, L, T) { // przepaść biegnąca w głąb, most w poprzek, cytadela na skale na końcu
    L.pj = { hor: Math.round(between(r, 40, 70)), d: 330 };
    const Xc = between(r, -90, 90), bend = between(r, -140, 140), ph = r() * 6, pts = [];
    for (let i = 0; i <= 6; i++) pts.push([Xc + Math.sin(i * 1.1 + ph) * 26 + bend * i / 6, 0.78 + i * 0.26, 0, 170 - i * 20]);
    const C = W.chasm || TOWN_WATER.dark.chasm; L.rivers.push({ w: 150, chasm: true, pts, cols: C.cols, line: C.line, edge: C.edge, glow: C.glow, glowA: C.glowA, noReeds: true });
    T.feats.push({ pts, w: 190 }); T.chasm = { pts };
    const Sb = { x0: Xc + bend - between(r, 240, 380), x1: Xc + bend + between(r, 240, 380), Z0: 2.36, Z1: between(r, 2.8, 3.1), e: between(r, 50, 80), ...St.slab, jag: r() * 9 };
    L.slabs.push(Sb);
    const side = r() < 0.5 ? -1 : 1; T.focus = { X: Xc + side * between(r, 180, 240), Z: between(r, 1.2, 1.45) }; T.entryX = Xc - side * between(r, 150, 220);
  },
  terraces(r, St, W, L, T) { // stok z tarasami jeden nad drugim, schody zygzakiem
    const n = r() < 0.6 ? 3 : 2; let Z = between(r, 1.3, 1.45), e = 0;
    for (let k = 0; k < n; k++) { const Z0 = Z, Z1 = k === n - 1 ? 3.3 : Z0 + between(r, 0.38, 0.5); e += between(r, 34, 52) + k * 10; L.slabs.push({ x0: -1600, x1: 1600, Z0, Z1, e, ...St.slab, masonry: St.masonry, jag: St.masonry ? 0 : r() * 9 }); Z = Z1; }
    T.focus = { X: between(r, -140, 140), Z: between(r, 1.02, 1.15) }; T.entryX = between(r, -80, 80);
  },
  islands(r, St, W, L, T) { // mokradło od brzegu do brzegu, budowle na wysepkach połączonych kładkami
    const Lk = { X: 0, Z: 1.72, rx: 1500, rz: 0.62, cols: W.lake, rim: W.rim, reeds: W.reeds, hot: W.hot }; L.lakes.push(Lk); T.ells.push(Lk);
    const want = 8 + (r() * 3 | 0);
    for (let t = 0; t < 200 && T.islands.length < want; t++) {
      const Z = between(r, 1.15, 2.3), I = { X: between(r, -250, 250) * Z, Z, rx: between(r, 110, 200), rz: between(r, 0.08, 0.13) };
      if (T.islands.some(o => Math.abs(o.X - I.X) < (o.rx + I.rx) * 0.9 && Math.abs(o.Z - I.Z) < (o.rz + I.rz) * 1.3)) continue;
      T.islands.push(I); L.islands.push(I);
    }
    T.islands.sort((a, b) => a.Z - b.Z); const big = T.islands.reduce((a, b) => (b.rx * b.rz > a.rx * a.rz && b.Z < 1.8 ? b : a), T.islands[0]);
    T.focus = { X: big.X, Z: big.Z }; T.entryX = between(r, -60, 60); T.planks = true;
  },
  plateau(r, St, W, L, T) { // skalny płaskowyż z tyłu, na nim zamek; z przodu miasto na równinie
    const cx = between(r, -260, 260), hw = between(r, 230, 360);
    L.slabs.push({ x0: cx - hw, x1: cx + hw, Z0: between(r, 1.9, 2.15), Z1: between(r, 2.6, 2.9), e: between(r, 55, 90), ...St.slab, masonry: St.masonry && r() < 0.5, jag: r() * 9 });
    if (r() < 0.5) { const Lk = { X: cx + (r() < 0.5 ? -1 : 1) * between(r, 260, 360), Z: between(r, 1.35, 1.6), rx: between(r, 80, 120), rz: between(r, 0.1, 0.15), cols: W.lake, rim: W.rim, reeds: W.reeds, hot: W.hot }; L.lakes.push(Lk); T.ells.push(Lk); }
    T.focus = { X: cx + between(r, -120, 120), Z: between(r, 1.15, 1.35) }; T.entryX = between(r, -70, 70);
  },
  crater(r, St, W, L, T) { // pierścień skał dookoła, pośrodku jama (lawa, ciemna woda albo lód)
    L.pj = { hor: Math.round(between(r, 60, 80)), d: 310 };
    for (const X of [-560, 0, 560]) L.hills.push({ X: X + between(r, -80, 80), Z: between(r, 2.55, 2.9), rx: between(r, 260, 380), h: between(r, 60, 100), cols: St.hill, rock: true, flat: 0.5 });
    const Lk = { X: between(r, -90, 90), Z: between(r, 1.5, 1.75), rx: between(r, 110, 160), rz: between(r, 0.15, 0.22), cols: W.lake, rim: W.rim, hot: W.hot, pit: true }; L.lakes.push(Lk); T.ells.push(Lk);
    T.focus = { X: Lk.X + (r() < 0.5 ? -1 : 1) * (Lk.rx + between(r, 90, 140)), Z: Lk.Z - Lk.rz * 0.3 }; T.entryX = between(r, -70, 70);
  },
  coast(r, St, W, L, T) { // morze z jednej strony, plaża, pomost i łodzie
    const s = r() < 0.5 ? -1 : 1, a = between(r, 110, 170), b = between(r, 130, 180), ph = r() * 6, xAt = Z => s * (a + b * (Z - 0.8) + Math.sin(Z * 4 + ph) * 18);
    const pts = [0.72, 0.9, 1.1, 1.35, 1.65, 2, 2.5, 3.1, 3.8, 4.6].map(Z => [xAt(Z), Z]);
    L.seas.push({ side: s, pts, cols: W.lake, sand: St.sand }); T.sea = { s, xAt };
    const Zp = between(r, 1.15, 1.45), x0 = xAt(Zp); L.roads.push({ w: 26, planks: true, pts: [[x0 - s * 40, Zp], [x0 + s * 170, Zp + 0.04]] }); T.feats.push({ pts: [[x0 - s * 40, Zp], [x0 + s * 170, Zp + 0.04]], w: 30 });
    for (let k = 0; k < 2 + (r() * 2 | 0); k++) { const Z = between(r, 1.2, 2.6); L.props.push(['boat', xAt(Z) + s * between(r, 90, 200) * Z, Z]); }
    if (r() < 0.6) { const Hl = { X: -s * between(r, 250, 520), Z: between(r, 2.4, 2.85), rx: between(r, 240, 360), h: between(r, 40, 80), cols: St.hill, rock: r() < 0.5, flat: 0.2 }; L.hills.push(Hl); }
    T.focus = { X: -s * between(r, 30, 140), Z: between(r, 1.15, 1.35) }; T.entryX = -s * between(r, 20, 90);
  },
};

// --- sprawdzanie miejsca: teren, woda, drogi, zasłanianie ---
function townElev(T, L, X, Z) { // wysokość gruntu: taras albo płaskowyż pod punktem (wzgórza tylko przez strefy na grzbiecie)
  let e = 0; for (const Sb of L.slabs) if (Z >= Sb.Z0 && Z <= Sb.Z1 && X >= Sb.x0 && X <= Sb.x1) e = Math.max(e, Sb.e); return e;
}
function inIsland(T, X, Z, k = 1) { return T.islands.some(I => ((X - I.X) / (I.rx * k)) ** 2 + ((Z - I.Z) / (I.rz * k)) ** 2 < 1); }
function segDist(X, Z, pts) { // odległość punktu od łamanej w świecie (Z ×300, jak wstęgi dróg i rzek)
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1] * 300, bx = pts[i + 1][0], bz = pts[i + 1][1] * 300, dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const u = clamp(((X - ax) * dx + (Z * 300 - az) * dz) / l2, 0, 1); best = Math.min(best, Math.hypot(X - ax - u * dx, Z * 300 - az - u * dz));
  }
  return best;
}
function townBlocked(T, L, X, Z, e, halfW, onIsland) {
  for (const f of T.feats) for (let k = -1; k <= 1; k++) if (segDist(X + k * halfW * 0.8, Z, f.pts) < f.w / 2 + 6) return true;
  if (!onIsland) for (const Lk of T.ells) for (let k = -1; k <= 1; k++) if (((X + k * halfW * 0.8 - Lk.X) / (Lk.rx + 12)) ** 2 + ((Z - Lk.Z) / (Lk.rz + 0.04)) ** 2 < 1 && !inIsland(T, X + k * halfW * 0.8, Z, 0.95)) return true;
  if (T.sea) for (let k = -1; k <= 1; k++) if (T.sea.s * (X + k * halfW) > T.sea.s * T.sea.xAt(Z) - 20) return true;
  for (const Hl of L.hills) if (Z > Hl.Z - 0.03 && Math.abs(X - Hl.X) < Hl.rx && e < hillTop(Hl, X) - 2) return true;
  for (const Sb of L.slabs) if (Z > Sb.Z0 - 0.03 && X + halfW > Sb.x0 && X - halfW < Sb.x1 && e < Sb.e - 2) return true;
  for (const Sb of L.slabs) if (e === Sb.e && Z >= Sb.Z0 && (X - halfW < Sb.x0 - 4 || X + halfW > Sb.x1 + 4) && townElev(T, L, X, Z) === Sb.e) return true; // nie zwisa z krawędzi
  return false;
}
function slotRect(S) { const [sx, sy, s] = proj(S.X, S.Z, S.e), sc = s * S.k, w = S.w * sc, h = S.h * sc; return { x: sx - w / 2, y: sy - h, w, h, sx, sy }; }
const rectOverlap = (a, b) => { const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? (w * h) / Math.min(a.w * a.h, b.w * b.h) : 0; };

// Strefy pod budowę: ziemia, tarasy i płaskowyże, grzbiety wzgórz, wyspy (pozycje losowane w strefach)
function townZones(T, L) {
  const Z = [{ x0: -3000, x1: 3000, z0: 0.86, z1: 2.95, e: null, tag: 'ground' }];
  for (const Sb of L.slabs) Z.push({ x0: Sb.x0, x1: Sb.x1, z0: Sb.Z0 + 0.02, z1: Math.min(Sb.Z1 - 0.04, 2.95), e: Sb.e, tag: 'high' });
  for (const Hl of L.hills) if (hillTop(Hl, Hl.X) > 20 && Hl.Z < 2.95) Z.push({ x0: Hl.X - Hl.rx * 0.5, x1: Hl.X + Hl.rx * 0.5, z0: Hl.Z - 0.004, z1: Hl.Z - 0.004, e: X => hillTop(Hl, X), tag: 'high', hill: Hl });
  for (const I of T.islands) Z.push({ x0: I.X - I.rx * 0.75, x1: I.X + I.rx * 0.75, z0: I.Z - I.rz * 0.5, z1: I.Z + I.rz * 0.35, e: 0, tag: 'island' });
  return Z;
}
function placeTownSlots(r, T, L, dims) {
  const zones = townZones(T, L), placed = [], margin = L.frame ? 56 : 14;
  for (const i of SLOT_ORDER) {
    const [z0, z1, high, small] = T.roles[i], D = dims[i]; let best = null;
    // coraz luźniejsze wymagania: zasłonięcie, a potem też głębokość (cała plansza), zanim dopuścimy nakładanie się budowli
    for (const [thr, tries, anyZ] of [[0.12, 140, 0], [0.3, 140, 0], [0.5, 200, 1], [0.6, 400, 1], [2, 200, 1]]) {
      for (let t = 0; t < tries; t++) {
        const cand = anyZ ? zones : zones.filter(zn => zn.z1 >= z0 - 0.3 && zn.z0 <= z1 + 0.3), zn = pickW(r, (cand.length ? cand : zones).map(zn => [zn, zn.tag === 'high' ? (high ? 5 : 0.6) : zn.tag === 'island' ? 2 : 1]));
        const Z = zn.z0 === zn.z1 ? zn.z0 : anyZ ? between(r, zn.z0, zn.z1) : between(r, Math.max(zn.z0, z0 - 0.15), Math.min(zn.z1, z1 + 0.15)); if (!(Z >= zn.z0 - 1e-6 && Z <= zn.z1 + 1e-6)) continue;
        const wS = D.w * D.k / Z, lo = (margin + wS / 2 - 296) * Z, hi = (592 - margin - wS / 2 - 296) * Z, X = between(r, Math.max(lo, zn.x0), Math.min(hi, zn.x1)); if (!(X >= lo && X <= hi && X >= zn.x0 && X <= zn.x1)) continue;
        if (zn.hill && Math.abs(X - zn.hill.X) + D.w * D.k / 2 > zn.hill.rx * (zn.hill.flat < 0.3 ? 0.8 : 0.5)) continue; // budowla mieści się na grzbiecie
        const e = zn.e === null ? townElev(T, L, X, Z) : typeof zn.e === 'function' ? zn.e(X) : zn.e, S = { X, Z, e, k: D.k, w: D.w, h: D.h }, R = slotRect(S);
        if (R.y < 12 || R.sy > 432 || townBlocked(T, L, X, Z, e, D.w * D.k / 2, zn.tag === 'island')) continue;
        let ov = 0, near = 999; for (const P of placed) { ov = Math.max(ov, rectOverlap(R, P.R)); near = Math.min(near, Math.hypot(R.sx - P.R.sx, (R.sy - R.h / 2) - (P.R.sy - P.R.h / 2))); }
        if (ov > thr) continue;
        let score = r() * 0.35 - Math.abs(Z - (z0 + z1) / 2) * 1.2 + Math.min(near, 160) / 320 - ov * 3 + (high && e > 0 ? 0.8 : 0);
        if (i === 0) score -= Math.abs(X - T.focus.X) / 220 + (T.hallHigh ? (e > 0 ? -1 : 1) : Math.abs(Z - T.focus.Z) * 2.5);
        if (i === 1 && T.flank) score += T.flank * (R.sx - 296) / 200;
        if (small && T.main) score -= segDist(X, Z, T.main) / 500;
        if (!best || score > best.score) best = { S, R, score };
      }
      if (best) break;
    }
    if (!best) { const S = { ...TOWN_LAYOUTS.haven.slots[i], e: 0, k: D.k, w: D.w, h: D.h }; best = { S, R: slotRect(S) }; } // awaryjnie: miejsce z klasycznej planszy
    best.S.flip = r() < 0.5; L.slots[i] = best.S; placed.push({ i, R: best.R });
    if (i === 0) townMainRoad(r, T, L); // po ratuszu i zamku: główna droga, której reszta budowli nie zastawia
  }
}
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
  L.roads.push({ w: 44, steps, planks: !!T.planks, pts: way }); T.main = way.map(p => [p[0], p[1]]);
  T.feats.push({ pts: T.main, w: 44 }); L.bridges.push(...bridges);
  if (!hall.e && !T.planks) { L.plaza = { X: hall.X, Z: hall.Z - 0.09, r: between(r, 85, 120) }; T.ells.push({ X: L.plaza.X, Z: L.plaza.Z, rx: L.plaza.r, rz: 0.05 }); }
  L.walksW = [way.filter(p => !p[2]).map(p => [p[0], p[1]])].filter(w => w.length >= 2);
}
// Drzewa, drobiazgi i latarnie w wolnych miejscach (nie na drogach, w wodzie ani przed budowlami)
function townProps(r, T, L, St) {
  const rects = L.slots.map(slotRect), free = (X, Z, e, w, h) => {
    if (townBlocked(T, L, X, Z, e, 12, inIsland(T, X, Z, 0.9))) return false;
    const [sx, sy, s] = proj(X, Z, e), R = { x: sx - w * s / 2, y: sy - h * s, w: w * s, h: h * s }; if (sx < 4 || sx > 588 || sy > 436) return false;
    return !rects.some(Q => rectOverlap(R, Q) > 0.08);
  };
  const [tree, n0, n1] = St.trees, n = Math.round(between(r, n0, n1));
  for (let k = 0, t = 0; k < n && t < 400; t++) { const Z = between(r, 0.9, 3), X = between(r, -300, 300) * Z, e = townElev(T, L, X, Z), edge = Math.abs(X / Z) / 300; if (r() > 0.25 + edge && Z < 2.2) continue; if (free(X, Z, e, 36, 50)) { L.props.push([tree, X, Z, e, between(r, 1.1, 1.45)]); k++; } }
  for (let k = 0, t = 0, m = 6 + (r() * 6 | 0); k < m && t < 300; t++) { const Z = between(r, 0.86, 2.2), X = between(r, -290, 290) * Z, e = townElev(T, L, X, Z); if (free(X, Z, e, 30, 22)) { L.props.push([pickW(r, St.deco), X, Z, e]); k++; } }
  for (let i = 1; i < T.main.length; i++) { const p = L.roads[L.roads.length - 1].pts[i]; if (p[2] || i % 2 || T.planks) continue; const X = p[0] + (r() < 0.5 ? -1 : 1) * 30, e = townElev(T, L, X, p[1]); if (free(X, p[1], e, 12, 40)) L.props.push([St.lamp, X, p[1], e]); }
}
// Cała plansza miasta: typ krajobrazu, budowle, drogi, rekwizyty, niebo, pogoda, dachy i ozdobne istoty (duchy, ogniki)
function generateTownLayout(fac, seed, force) {
  const St = TOWN_STYLE[fac] || TOWN_STYLE.haven, B = TOWN_LAYOUTS[fac] || TOWN_LAYOUTS.haven, r = mulberry32(seed), W = TOWN_WATER[St.water] || TOWN_WATER.blue;
  const arche = force || pickW(r, St.arche), wx = pickW(r, St.weather), sky = { ...pickW(r, St.skies) };
  const L = { arche, seed, pj: null, frame: St.frame && r() < St.frame ? 'forest' : null, mountains: B.mountains, forest: B.forest, ground: B.ground, haze: B.haze, desat: B.desat, tuft: B.tuft,
    hills: [], rivers: [], lakes: [], islands: [], slabs: [], seas: [], roads: [], bridges: [], props: [], slots: [], bone: fac === 'barrow',
    walkCols: B.walkCols, guardCol: B.guardCol, birds: B.birds, birdCol: B.birdCol, mist: wx === 'mist', rain: wx === 'rain', snow: wx === 'snow', embers: wx === 'embers', spores: wx === 'spores', dust: wx === 'dust' };
  const T = { feats: [], ells: [], islands: [], focus: { X: 0, Z: 1.25 }, entryX: 0 };
  L.pj = { hor: Math.round(between(r, 62, 112)), d: Math.round(between(r, 262, 326)) }; // kamera: wyżej albo niżej, bliżej albo dalej
  ARCHETYPES[arche](r, St, W, L, T);
  T.roles = SLOT_ROLE.map(x => x.slice()); T.flank = r() < 0.45 ? (r() < 0.5 ? -1 : 1) : 0; // zamek z tyłu albo z boku planszy
  if (T.flank) T.roles[1] = [1.35, 2.1, 1, 0];
  if (L.slabs.length && r() < 0.4) { T.roles[0] = [1.3, 2.5, 1, 0]; T.hallHigh = true; } // ratusz na tarasie albo płaskowyżu
  T.focus.X += between(r, -90, 90);
  if (St.walls && r() < St.walls[1] && arche !== 'terraces') { // mur miejski w poprzek planszy (brama tam, gdzie przejdzie droga)
    const Zw = between(r, 1.72, 2.15), ph = r() * 6;
    if (!T.river || T.river.pts.every(p => Math.abs(p[1] - Zw) > 0.28)) {
      const pts = []; for (let X = -1500; X <= 1500; X += 50) pts.push([X, Zw + Math.sin(X / 260 + ph) * 0.06]);
      L.walls = [{ style: St.walls[0], h: St.walls[0] === 'iron' ? 16 : between(r, 24, 36), pts }]; T.feats.push({ pts, w: 30 });
    }
  }
  usePJ(L); const hor = proj(0, 4.4)[1];
  sky.sun = [between(r, 90, 500), Math.min(sky.sun[1], hor - 28)]; sky.seed = seed; L.sky = sky; L.ridge = [1 + (seed % 997), 3 + (seed % 991), hor + 12];
  L.art = { ...(TOWN_ART[fac] || TOWN_ART.haven), roof: pickW(r, St.roofs.map(x => [x, 1])) };
  placeTownSlots(r, T, L, B.slots);
  townProps(r, T, L, St);
  if (L.walls) townWallGates(r, T, L);
  const fort = L.slots[1], F = T.focus;
  if (St.skel) { L.guardSkel = [[fort.X - 24, fort.Z - 0.02, fort.e], [fort.X + 24, fort.Z - 0.02, fort.e]]; if (L.walksW.length) L.skeletons = L.walksW.slice(0, 1); }
  else L.guardsW = [[fort.X - 24, fort.Z - 0.02, fort.e], [fort.X + 24, fort.Z - 0.02, fort.e]];
  L.floaters = fac === 'sylvan' || fac === 'fortress' ? [{ kind: 'wisp', X: F.X, Z: F.Z + 0.2, e: 18, n: 5, spread: 200, spreadZ: 0.2 }]
    : fac === 'barrow' ? [{ kind: 'ghost', X: F.X, Z: F.Z + 0.1, e: 40, n: 3, spread: 120, spreadZ: 0.25 }]
    : fac === 'inferno' ? [{ kind: 'ember', X: F.X, Z: F.Z + 0.2, e: 10, n: 10, spread: 160, spreadZ: 0.4 }]
    : fac === 'dungeon' ? [{ kind: 'spore', X: F.X, Z: F.Z + 0.25, e: 20, n: 8, spread: 220, spreadZ: 0.3 }] : [];
  usePJ(null); return L;
}
// Mur: odcinki w wodzie, za wzgórzem albo na tarasie znikają, na drodze jest brama z dwiema basztami, co kilka odcinków baszta
function townWallGates(r, T, L) {
  const Wl = L.walls[0], segs = [], towers = [];
  for (let i = 0; i < Wl.pts.length - 1; i++) {
    const a = Wl.pts[i], b = Wl.pts[i + 1], mX = (a[0] + b[0]) / 2, mZ = (a[1] + b[1]) / 2, [sx] = proj(mX, mZ);
    const road = T.main && segDist(mX, mZ, T.main) < 34, off = sx < -40 || sx > 632, hidden = townBlocked({ ...T, feats: [] }, L, mX, mZ, 0, 20, false);
    segs.push(road ? 'gate' : off || hidden ? null : [a, b]);
  }
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]; if (!Array.isArray(s)) continue;
    if (segs[i - 1] === 'gate') towers.push(s[0]); if (segs[i + 1] === 'gate') towers.push(s[1]);
    else if (i % 6 === 3 && Wl.style !== 'palisade' && Wl.style !== 'iron') towers.push(s[1]);
  }
  Wl.segs = segs.filter(Array.isArray); Wl.towers = towers;
}
const TownGenCache = new Map();
// Plansza miasta t (z pamięci): ziarno z frakcji i nazwy, więc zdobyte miasto innej frakcji dostaje planszę swojej frakcji
function townLayout(t) {
  const seed = strHash(t.faction + ':' + (t.name || t.id)); let L = TownGenCache.get(seed);
  if (!L) { L = generateTownLayout(t.faction, seed); TownGenCache.set(seed, L); if (TownGenCache.size > 40) TownGenCache.delete(TownGenCache.keys().next().value); }
  return L;
}
