// ==================== MIASTO: TEREN, ŚCIEŻKI I MIESZKAŃCY FRAKCJI ===========================
// Każda frakcja ma własny kraj (TOWN_BIOME): ziemię (łąka z polami, mech, martwa ziemia, bagno, popiół z lawą, śnieg,
// skalne dno groty, step), las albo skały na horyzoncie, wygląd drogi i ścieżek, mieszkańców i straż przed zamkiem.
// Generator łączy drzwi każdej budowli ścieżką z główną drogą (bez brodzenia przez rzekę i chodzenia za budowlami),
// a mieszkańcy chodzą tymi ścieżkami od bramy miasta do budowli i znikają w drzwiach.

const TOWN_BIOME = {
  haven: { ground: 'meadow', far: 'oaks', road: 'cobble', lane: 'dirt', mainW: 0.9, laneW: 20, wiggle: 0.15, tufts: 1,
    folk: ['peasant', 'maid', 'peasant', 'soldier'], guard: 'soldier', plaza: '#9a9282' },
  sylvan: { ground: 'moss', far: 'wood', road: 'trail', lane: 'trail', mainW: 0.62, laneW: 13, wiggle: 0.45, tufts: 1.2,
    folk: ['elf', 'elf', 'dwarf'], guard: 'archer', plaza: '#7a6a44' },
  barrow: { ground: 'dead', far: 'deadwood', road: 'flag', lane: 'flag', mainW: 0.8, laneW: 18, wiggle: 0.1, tufts: 0.35, tuft: ['rgba(20,16,24,.45)', 'rgba(150,140,130,.16)'],
    folk: ['skeleton', 'zombie', 'skeleton'], guard: 'skeleton', plaza: '#4e4856' },
  fortress: { ground: 'bog', far: 'willows', road: 'planks', lane: 'planks', mainW: 0.62, laneW: 16, wiggle: 0.2, tufts: 1, wade: true,
    folk: ['lizard', 'gnoll', 'lizard'], guard: 'lizard', plaza: '#5e5438' },
  inferno: { ground: 'ash', far: 'spires', road: 'basalt', lane: 'basalt', mainW: 0.85, laneW: 18, wiggle: 0.12, tufts: 0,
    folk: ['imp', 'imp', 'demon'], guard: 'demon', plaza: '#2e2224' },
  academy: { ground: 'snow', far: 'pines', road: 'ice', lane: 'snow', mainW: 0.85, laneW: 18, wiggle: 0.15, tufts: 0,
    folk: ['mage', 'mage', 'gremlin'], guard: 'golem', plaza: '#c4d2e2' },
  dungeon: { ground: 'cave', far: 'stalags', road: 'slab', lane: 'slab', mainW: 0.8, laneW: 18, wiggle: 0.12, tufts: 0,
    folk: ['trog', 'warlock', 'trog'], guard: 'minotaur', plaza: '#4a4454' },
  stronghold: { ground: 'sand', far: 'mesas', road: 'track', lane: 'track', mainW: 0.85, laneW: 18, wiggle: 0.3, tufts: 0.2, tuft: ['rgba(110,80,30,.35)', 'rgba(200,190,120,.25)'],
    folk: ['goblin', 'orc', 'goblin', 'wolf'], guard: 'orc', plaza: '#c49c6c' },
};
// Krajobrazy pasujące do kraju frakcji (zamiast dowolnych): dolina rzeki i pola, polana nad jeziorem w puszczy, cmentarna
// przepaść, bagno z wysepkami, lawa, ośnieżone tarasy, podziemna grota, stołowe góry i oaza
TOWN_STYLE.haven.arche = [['valley', 4], ['coast', 2], ['terraces', 1], ['plateau', 1]];
Object.assign(TOWN_STYLE.sylvan, { arche: [['lake', 4], ['valley', 2], ['islands', 1]], frame: 0.7 });
TOWN_STYLE.barrow.arche = [['chasm', 3], ['crater', 2], ['plateau', 2]];
TOWN_STYLE.fortress.arche = [['islands', 5], ['lake', 3]];
TOWN_STYLE.inferno.arche = [['chasm', 3], ['crater', 3], ['plateau', 1]];
TOWN_STYLE.academy.arche = [['terraces', 4], ['plateau', 2], ['lake', 1]];
TOWN_STYLE.stronghold.arche = [['plateau', 3], ['crater', 2], ['lake', 2]];
// Loch leży pod ziemią: nad miastem sklepienie groty zamiast nieba
Object.assign(TOWN_STYLE.dungeon, { arche: [['chasm', 3], ['crater', 2], ['lake', 2], ['plateau', 2]], frame: 1, frameKind: 'cave',
  skies: [[{ cave: true, top: '#07050c', mid: '#1a1226', hor: '#3a2a4a', sun: [300, 200] }, 3], [{ cave: true, top: '#05080c', mid: '#121e26', hor: '#26404a', sun: [300, 200] }, 2],
    [{ cave: true, top: '#0c0508', mid: '#26121c', hor: '#4a2a36', sun: [300, 200] }, 1]] });

// --- ziemia frakcji: szczegóły malowane na płaszczyźnie gruntu ---
function groundDetail(c, Wd, fx) {
  const Bm = TOWN_BIOME[Wd.fac]; if (!Bm) return;
  const r = mulberry32(211 + (Wd.seed || 0)), pt = (z0, z1) => { const Z = z0 + r() * (z1 - z0); return [(r() - 0.5) * 640 * Z, Z]; };
  const quad = (X, Z, w, d, col) => { const P = [[X - w / 2, Z], [X + w / 2, Z], [X + w / 2, Z + d], [X - w / 2, Z + d]].map(([a, b]) => proj(a, b)); fillPoly(c, P, col); return P; };
  const crack = (X, Z, n, len, col, lw) => { c.strokeStyle = col; c.beginPath(); let [x, y, s] = proj(X, Z); c.moveTo(x, y); c.lineWidth = Math.max(0.7, lw * s); let a = r() * TAU;
    for (let i = 0; i < n; i++) { a += (r() - 0.5) * 1.6; X += Math.cos(a) * len; Z += Math.sin(a) * len / 300; [x, y] = proj(X, Z); c.lineTo(x, y); } c.stroke(); return [X, Z]; };
  const blob = (X, Z, rx, rz, col) => { const [x, y, s] = proj(X, Z); c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx * s, rz * s, 0, 0, TAU); c.fill(); return [x, y, s]; };
  const g = Bm.ground;
  if (g === 'meadow') { // pola uprawne w oddali (pasy z bruzdami i miedzami), polne kwiaty z przodu
    const fields = ['#8a9a4a', '#b0a458', '#6e8a3a', '#bca060', '#7a8e44', '#9a8a4a'];
    for (let Z = 2.45; Z < 3.9; Z += 0.3 + r() * 0.12) for (let X = -1500 + r() * 200; X < 1500;) {
      const w = 170 + r() * 190, d = 0.22 + r() * 0.1, col = fields[r() * fields.length | 0], P = quad(X + w / 2, Z, w - 10, d, col);
      c.strokeStyle = 'rgba(40,50,20,.28)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { const f = k / 5; c.beginPath(); c.moveTo(P[0][0] + (P[1][0] - P[0][0]) * f, P[0][1]); c.lineTo(P[3][0] + (P[2][0] - P[3][0]) * f, P[3][1]); c.stroke(); }
      c.strokeStyle = 'rgba(40,64,28,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(P[0][0], P[0][1]); c.lineTo(P[1][0], P[1][1]); c.stroke();
      const hz = hazeAt(Z); if (hz > 0) { c.globalAlpha = hz; fillPoly(c, P, Wd.haze); c.globalAlpha = 1; } X += w;
    }
    for (let i = 0; i < 220; i++) { const [X, Z] = pt(0.82, 2), [x, y, s] = proj(X, Z); c.fillStyle = ['#f4f0e0', '#f0d040', '#d84a3a', '#a878d8'][r() * 4 | 0]; c.fillRect(x, y, Math.max(1, 1.6 * s), Math.max(1, 1.6 * s)); }
  } else if (g === 'moss') { // mech, plamy słońca między koronami, opadłe liście, korzenie przy brzegach kadru
    for (let i = 0; i < 34; i++) { const [X, Z] = pt(0.9, 3); blob(X, Z, 40 + r() * 90, 8 + r() * 14, 'rgba(14,40,16,.28)'); }
    for (let i = 0; i < 14; i++) { const [X, Z] = pt(0.9, 2.4); blob(X, Z, 30 + r() * 60, 6 + r() * 10, 'rgba(240,236,150,.10)'); }
    for (let i = 0; i < 320; i++) { const [X, Z] = pt(0.82, 2.4), [x, y, s] = proj(X, Z); c.fillStyle = ['#c8862a', '#d8a83a', '#8a4a1a', '#a8a040'][r() * 4 | 0]; c.fillRect(x, y, Math.max(1, 2.2 * s), Math.max(1, 1.2 * s)); }
    c.lineCap = 'round'; for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { const Z = 0.9 + r() * 0.8, X = side * (250 + r() * 50) * Z; c.strokeStyle = 'rgba(58,40,22,.8)'; crack(X, Z, 4, 30, 'rgba(58,40,22,.75)', 3.2); }
  } else if (g === 'dead') { // spękana szara ziemia, rozsypane kości, suche badyle
    for (let i = 0; i < 26; i++) { const [X, Z] = pt(0.9, 3); blob(X, Z, 50 + r() * 100, 10 + r() * 16, 'rgba(10,6,14,.18)'); }
    for (let i = 0; i < 46; i++) { const [X, Z] = pt(0.84, 2.6), E = crack(X, Z, 3 + (r() * 4 | 0), 14 + r() * 16, 'rgba(8,4,12,.5)', 1.2); if (r() < 0.5) crack(E[0], E[1], 2, 10, 'rgba(8,4,12,.4)', 0.9); }
    for (let i = 0; i < 70; i++) { const [X, Z] = pt(0.84, 2.2), [x, y, s] = proj(X, Z); c.fillStyle = 'rgba(224,216,196,.7)'; c.save(); c.translate(x, y); c.rotate(r() * 3); c.fillRect(-2.5 * s, -0.6 * s, 5 * s, 1.2 * s); c.restore(); }
    c.strokeStyle = 'rgba(120,104,90,.55)'; c.lineWidth = 1; for (let i = 0; i < 60; i++) { const [X, Z] = pt(0.84, 2.2), [x, y, s] = proj(X, Z); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3 * s, y - 7 * s); c.moveTo(x, y); c.lineTo(x + 2 * s, y - 9 * s); c.stroke(); }
  } else if (g === 'bog') { // kałuże z rzęsą i liśćmi grzybieni, błoto, pałki
    for (let i = 0; i < 28; i++) { const [X, Z] = pt(0.9, 3); blob(X, Z, 50 + r() * 90, 8 + r() * 14, 'rgba(30,22,10,.22)'); }
    for (let i = 0; i < 30; i++) { const [X, Z] = pt(0.86, 2.6), rx = 16 + r() * 34, rz = 4 + r() * 5, [x, y, s] = blob(X, Z, rx + 3, rz + 2, 'rgba(40,34,18,.55)');
      const gg = c.createLinearGradient(0, y - rz * s, 0, y + rz * s); gg.addColorStop(0, '#6a8a78'); gg.addColorStop(1, '#16281e'); c.fillStyle = gg; c.beginPath(); c.ellipse(x, y, rx * s, rz * s, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(200,220,180,.35)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, rx * s * 0.8, rz * s * 0.6, 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
      for (let k = 0; k < 3; k++) if (r() < 0.6) circ(c, x + (r() - 0.5) * rx * s, y + (r() - 0.5) * rz * s, 1.6 * s + 0.4, '#4a7a34'); }
    for (let i = 0; i < 50; i++) { const [X, Z] = pt(0.84, 2.2), [x, y, s] = proj(X, Z); c.strokeStyle = '#4a6a2a'; c.lineWidth = Math.max(0.8, s); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 12 * s); c.stroke(); c.fillStyle = '#5a3a1a'; c.fillRect(x - 1.2 * s, y - 12 * s, 2.4 * s, 4 * s); }
  } else if (g === 'ash') { // czarny bazalt, szczeliny z lawą (świecą), popiół, dymiące kominy
    for (let i = 0; i < 30; i++) { const [X, Z] = pt(0.9, 3); blob(X, Z, 50 + r() * 100, 8 + r() * 16, r() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(120,110,110,.08)'); }
    for (let i = 0; i < 22; i++) { const [X, Z] = pt(0.86, 2.6), n = 3 + (r() * 4 | 0), len = 16 + r() * 20, q = r;
      const st = r(); c.lineCap = 'round'; const seg = []; let XX = X, ZZ = Z, a = r() * TAU; for (let k = 0; k <= n; k++) { seg.push(proj(XX, ZZ)); a += (q() - 0.5) * 1.4; XX += Math.cos(a) * len; ZZ += Math.sin(a) * len / 300; }
      for (const [col, lw] of [['#5a1206', 3.6], ['#ff6a1a', 2], ['#ffd070', 0.8]]) { c.strokeStyle = col; c.lineWidth = Math.max(0.6, lw * seg[0][2]); c.beginPath(); seg.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
      if (fx && st < 0.5) { const [x, y, s] = seg[seg.length >> 1]; fx.glows.push([x, y, 26 * s, '#ff5a10']); } }
    for (let i = 0; i < 160; i++) { const [X, Z] = pt(0.84, 2.4), [x, y, s] = proj(X, Z); c.fillStyle = r() < 0.6 ? 'rgba(160,150,150,.35)' : 'rgba(0,0,0,.4)'; c.fillRect(x, y, Math.max(1, 2 * s), Math.max(1, 1.2 * s)); }
    if (fx) for (let i = 0; i < 3; i++) { const [X, Z] = pt(1.1, 2.2), [x, y, s] = proj(X, Z); circ(c, x, y, 4 * s, '#1a0a06'); circ(c, x, y - 0.5, 2 * s, '#ff7a1a'); fx.smokes.push([x, y - 2, s]); }
  } else if (g === 'snow') { // zaspy z niebieskim cieniem, zamarznięte kałuże, iskrzący się śnieg
    for (let i = 0; i < 34; i++) { const [X, Z] = pt(0.86, 3), rx = 40 + r() * 90, rz = 6 + r() * 10; blob(X, Z + 0.02, rx, rz, 'rgba(120,140,180,.22)'); blob(X, Z, rx * 0.9, rz * 0.8, 'rgba(252,253,255,.55)'); }
    for (let i = 0; i < 9; i++) { const [X, Z] = pt(0.9, 2.2), rx = 24 + r() * 40, rz = 5 + r() * 5, [x, y, s] = blob(X, Z, rx, rz, 'rgba(170,205,235,.75)');
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - rx * s * 0.5, y - 1); c.lineTo(x + rx * s * 0.2, y - rz * s * 0.4); c.stroke(); }
    for (let i = 0; i < 180; i++) { const [X, Z] = pt(0.82, 2.8), [x, y] = proj(X, Z); c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.9)' : 'rgba(170,220,255,.8)'; c.fillRect(x, y, 1, 1); }
  } else if (g === 'cave') { // skalne dno groty: płyty ze szczelinami, żyły kryształów, świecący mech, kamyki
    for (let i = 0; i < 30; i++) { const [X, Z] = pt(0.9, 3); blob(X, Z, 50 + r() * 100, 8 + r() * 16, r() < 0.5 ? 'rgba(0,0,0,.22)' : 'rgba(170,150,200,.07)'); }
    for (let i = 0; i < 40; i++) { const [X, Z] = pt(0.84, 2.8); crack(X, Z, 3 + (r() * 3 | 0), 22 + r() * 20, 'rgba(6,4,10,.55)', 1.3); }
    for (let i = 0; i < 12; i++) { const [X, Z] = pt(0.86, 2.4), [x0, y0, s0] = proj(X, Z), E = crack(X, Z, 3, 16, 'rgba(190,120,255,.75)', 1.4); if (fx && i % 3 === 0) fx.glows.push([x0, y0, 18 * s0, '#a060ff']); }
    for (let i = 0; i < 16; i++) { const [X, Z] = pt(0.86, 2.4), [x, y, s] = blob(X, Z, 12 + r() * 18, 3 + r() * 3, 'rgba(80,220,190,.28)'); if (fx && i % 4 === 0) fx.glows.push([x, y, 16 * s, '#40d8b0']); }
    for (let i = 0; i < 160; i++) { const [X, Z] = pt(0.82, 2.6), [x, y, s] = proj(X, Z); c.fillStyle = r() < 0.6 ? 'rgba(10,6,16,.6)' : 'rgba(150,140,170,.4)'; c.fillRect(x, y, Math.max(1, 2.4 * s), Math.max(1, 1.4 * s)); }
  } else if (g === 'sand') { // zmarszczki wydm, spękana glina, kamyki
    for (let i = 0; i < 70; i++) { const [X, Z] = pt(0.86, 3.2), [x, y, s] = proj(X, Z), w = (40 + r() * 80) * s, ph = r() * 6;
      for (const [col, dy] of [['rgba(255,240,200,.35)', 0], ['rgba(120,80,30,.22)', 1.2]]) { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); for (let k = 0; k <= 10; k++) { const xx = x - w / 2 + w * k / 10, yy = y + dy + Math.sin(k * 0.9 + ph) * 1.4 * s; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); } }
    for (let i = 0; i < 6; i++) { const [X, Z] = pt(0.9, 2.2), rx = 50 + r() * 60; blob(X, Z, rx, 8 + r() * 6, 'rgba(150,90,50,.25)'); for (let k = 0; k < 6; k++) crack(X + (r() - 0.5) * rx, Z + (r() - 0.5) * 0.03, 3, 10, 'rgba(90,50,20,.45)', 0.9); }
    for (let i = 0; i < 120; i++) { const [X, Z] = pt(0.82, 2.4), [x, y, s] = proj(X, Z); c.fillStyle = r() < 0.5 ? 'rgba(110,80,50,.5)' : 'rgba(255,245,220,.4)'; c.fillRect(x, y, Math.max(1, 2 * s), Math.max(1, 1.2 * s)); }
  }
}

// --- las albo skały na horyzoncie (w miejsce jednakowych kulek drzew) ---
function farBand(c, Wd, hazeCol) {
  const kind = (TOWN_BIOME[Wd.fac] || {}).far;
  if (!kind || kind === 'oaks') return farForest(c, Wd.forest, hazeCol, Wd.seed || 0);
  const cols = kind === 'mesas' ? Wd.mountains : Wd.forest, r = mulberry32(29 + (Wd.seed || 0)), items = [];
  const n = { wood: 280, deadwood: 120, willows: 150, spires: 60, pines: 260, stalags: 80, mesas: 16 }[kind] || 150;
  for (let i = 0; i < n; i++) items.push([(r() - 0.5) * 3200, 3.2 + r() * 1.3, r(), r()]);
  items.sort((a, b) => b[1] - a[1]);
  for (const [X, Z, k1, k2] of items) {
    const [sx, sy, s] = proj(X, Z); if (sx < -90 || sx > 682) continue; const col = cols[Math.floor(k2 * cols.length)], dark = shadeHex(col, -0.25);
    if (kind === 'wood') { const h = (80 + k1 * 70) * s; c.fillStyle = dark; c.fillRect(sx - 1.6 * s, sy - h * 0.5, 3.2 * s, h * 0.5); c.fillStyle = col; c.beginPath(); c.ellipse(sx, sy - h * 0.66, h * 0.26, h * 0.42, 0, 0, TAU); c.fill(); }
    else if (kind === 'deadwood') { const h = (50 + k1 * 50) * s; c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = Math.max(1, 3 * s); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + k2 * 4 * s, sy - h); c.stroke(); c.lineWidth = Math.max(0.8, 1.6 * s);
      for (let k = 0; k < 4; k++) { const y = sy - h * (0.45 + k * 0.14), d = k % 2 ? 1 : -1; c.beginPath(); c.moveTo(sx + k2 * 2 * s, y); c.lineTo(sx + d * (8 + k1 * 8) * s, y - (10 + k * 3) * s); c.stroke(); } }
    else if (kind === 'willows') { const h = (50 + k1 * 40) * s; c.fillStyle = dark; c.fillRect(sx - 2 * s, sy - h * 0.5, 4 * s, h * 0.5); c.fillStyle = col; c.beginPath(); c.ellipse(sx, sy - h * 0.62, h * 0.5, h * 0.34, 0, Math.PI, 0); c.fill();
      c.strokeStyle = col; c.lineWidth = Math.max(1, 2 * s); for (let k = -4; k <= 4; k++) { const x = sx + k * h * 0.11; c.beginPath(); c.moveTo(x, sy - h * 0.64); c.quadraticCurveTo(x + k * s, sy - h * 0.3, x + k * 1.5 * s, sy - h * 0.12); c.stroke(); } }
    else if (kind === 'spires') { const h = (70 + k1 * 130) * s, w = (18 + k2 * 26) * s; fillPoly(c, [[sx - w, sy], [sx - w * 0.3, sy - h * 0.6], [sx - w * 0.1, sy - h], [sx + w * 0.25, sy - h * 0.55], [sx + w, sy]], col);
      fillPoly(c, [[sx - w * 0.1, sy - h], [sx + w * 0.25, sy - h * 0.55], [sx + w, sy], [sx + w * 0.2, sy]], dark); if (k1 > 0.7) { c.strokeStyle = 'rgba(255,110,30,.55)'; c.lineWidth = Math.max(1, 1.5 * s); c.beginPath(); c.moveTo(sx - w * 0.1, sy - h); c.lineTo(sx, sy - h * 0.5); c.lineTo(sx - w * 0.3, sy); c.stroke(); } }
    else if (kind === 'pines') { const h = (50 + k1 * 50) * s, w = h * 0.3; for (let k = 0; k < 3; k++) { const y = sy - h * (0.25 + k * 0.25), ww = w * (1 - k * 0.25); fillPoly(c, [[sx - ww, y + h * 0.18], [sx, y - h * 0.28], [sx + ww, y + h * 0.18]], k % 2 ? dark : col);
      fillPoly(c, [[sx - ww * 0.45, y - h * 0.06], [sx, y - h * 0.28], [sx + ww * 0.45, y - h * 0.06]], 'rgba(240,246,255,.85)'); } }
    else if (kind === 'stalags') { const h = (50 + k1 * 140) * s, w = (8 + k2 * 14) * s; fillPoly(c, [[sx - w, sy], [sx - w * 0.2, sy - h * 0.7], [sx, sy - h], [sx + w * 0.3, sy - h * 0.6], [sx + w, sy]], col); fillPoly(c, [[sx, sy - h], [sx + w * 0.3, sy - h * 0.6], [sx + w, sy], [sx + w * 0.2, sy]], dark); }
    else if (kind === 'mesas') { const w = (220 + k1 * 260) * s, h = (50 + k2 * 60) * s; fillPoly(c, [[sx - w / 2 - h * 0.5, sy], [sx - w / 2, sy - h], [sx + w / 2, sy - h], [sx + w / 2 + h * 0.6, sy]], col);
      c.fillStyle = shadeHex(col, 0.18); c.fillRect(sx - w / 2, sy - h, w, Math.max(1, 3 * s)); c.strokeStyle = 'rgba(80,40,20,.3)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { const y = sy - h + k * h / 4; c.beginPath(); c.moveTo(sx - w / 2 - h * 0.12 * k, y); c.lineTo(sx + w / 2 + h * 0.15 * k, y); c.stroke(); }
      fillPoly(c, [[sx + w * 0.2, sy - h], [sx + w / 2, sy - h], [sx + w / 2 + h * 0.6, sy], [sx + w * 0.35, sy]], 'rgba(60,20,10,.22)'); }
  }
  const y0 = proj(0, 4.6)[1], hz = c.createLinearGradient(0, y0 - 30, 0, y0 + 26); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, hazeCol); c.globalAlpha = 0.45; c.fillStyle = hz; c.fillRect(8, y0 - 30, 576, 56); c.globalAlpha = 1;
}

// --- Loch: grota zamiast nieba (skalna ściana w głębi, smugi światła z otworów) i sklepienie ze stalaktytami ---
function caveSky(c, P) {
  const g = c.createLinearGradient(0, 8, 0, 220); g.addColorStop(0, P.top); g.addColorStop(0.6, P.mid); g.addColorStop(1, P.hor); c.fillStyle = g; c.fillRect(8, 8, 576, 432);
  const q = mulberry32(90 + (P.seed || 0));
  for (let i = 0; i < 90; i++) { const x = 8 + q() * 576, y = 8 + q() * 190, w = 20 + q() * 80, h = 6 + q() * 18;
    fillPoly(c, [[x - w / 2, y + h / 2], [x - w * 0.3, y - h / 2], [x + w * 0.25, y - h * 0.4], [x + w / 2, y + h / 2]], q() < 0.55 ? 'rgba(0,0,0,.2)' : 'rgba(200,170,255,.05)'); }
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) { const x = 90 + q() * 420, w = 10 + q() * 16; c.fillStyle = 'rgba(170,150,255,.06)'; c.beginPath(); c.moveTo(x - w / 2, 8); c.lineTo(x + w / 2, 8); c.lineTo(x + w * 2.5 + 40, 300); c.lineTo(x - w * 1.5 + 40, 300); c.closePath(); c.fill(); }
  c.restore();
  for (let i = 0; i < 50; i++) { const x = 8 + q() * 576, y = 20 + q() * 170; c.fillStyle = q() < 0.5 ? `rgba(200,150,255,${(0.3 + q() * 0.6).toFixed(2)})` : `rgba(120,240,220,${(0.3 + q() * 0.5).toFixed(2)})`; c.fillRect(x, y, q() < 0.2 ? 2 : 1, q() < 0.2 ? 2 : 1); }
}
function caveFrame(c, fx, seed) {
  const q = mulberry32(700 + (seed || 0)), ceil = x => 12 + 70 * Math.pow(Math.abs(x - 296) / 296, 3) + Math.sin(x * 0.07 + seed) * 4;
  const rock = ['#2c2438', '#362c44', '#221c2c'];
  c.beginPath(); c.moveTo(0, 0); for (let x = 0; x <= 592; x += 8) c.lineTo(x, ceil(x)); c.lineTo(592, 0); c.closePath(); c.fillStyle = rock[0]; c.fill();
  for (let i = 0; i < 40; i++) { const x = q() * 592, y = q() * ceil(x); fillPoly(c, [[x - 12, y], [x - 4, y - 5], [x + 10, y - 3], [x + 14, y + 3]], q() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(200,170,240,.1)'); }
  c.strokeStyle = 'rgba(200,170,240,.35)'; c.lineWidth = 1.5; c.beginPath(); for (let x = 0; x <= 592; x += 8) x ? c.lineTo(x, ceil(x) - 1) : c.moveTo(x, ceil(x) - 1); c.stroke();
  for (let i = 0; i < 34; i++) { // stalaktyty: dłuższe przy ścianach, krótkie nad środkiem
    const x = 8 + q() * 576, y = ceil(x) - 2, edge = Math.abs(x - 296) / 296, len = 6 + q() * 16 + edge * edge * 60, w = 4 + q() * 6 + edge * 6;
    fillPoly(c, [[x - w, y], [x - w * 0.3, y + len * 0.6], [x, y + len], [x + w * 0.4, y + len * 0.5], [x + w, y]], rock[q() * 3 | 0]);
    fillPoly(c, [[x, y + len], [x + w * 0.4, y + len * 0.5], [x + w, y], [x + w * 0.3, y]], 'rgba(0,0,0,.3)'); c.fillStyle = 'rgba(200,170,240,.25)'; c.fillRect(x - w * 0.5, y + 2, 1, len * 0.4);
  }
  for (const side of [-1, 1]) { // skalne ściany po bokach
    const x0 = side < 0 ? 8 : 584, wAt = y => 14 + 34 * Math.pow(y / 440, 2) + Math.sin(y * 0.05 + side * 3 + seed) * 5;
    c.beginPath(); c.moveTo(x0, 0); for (let y = 0; y <= 440; y += 10) c.lineTo(x0 - side * wAt(y), y); c.lineTo(x0, 440); c.closePath(); c.fillStyle = rock[1]; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const y = 60 + q() * 360; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 - side * wAt(y) * 0.8, y + 10); c.stroke(); }
    for (let k = 0; k < 2; k++) { const y = 150 + q() * 240, x = x0 - side * wAt(y) * 0.85; // kryształy w ścianie
      for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + side * (-0.4 - j * 0.3), L = 10 + q() * 12, ex = x + Math.cos(a) * L * side * -1, ey = y + Math.sin(a) * L;
        fillPoly(c, [[x - 2, y], [ex - 1.5, ey], [ex + 1.5, ey - 2], [x + 2, y]], j % 2 ? '#8a50d0' : '#b88aff'); }
      if (fx) fx.glows.push([x, y - 8, 30, '#a060ff']); }
  }
}

// --- drogi i ścieżki w stylu frakcji: płyty, bruk, deski, bazalt z lawą, ubity śnieg, piach z koleinami ---
const ROAD_LOOK = {
  cobble: { base: ['#aaa08a', '#7e7664'], edge: 'rgba(50,42,30,.5)', tile: [11, 7, 'rgba(50,40,28,.4)'], curb: 'rgba(230,222,200,.45)' },
  dirt: { base: ['#a88a5e', '#7e6644'], soft: 'rgba(120,96,60,.35)', specks: ['rgba(60,40,20,.35)', 'rgba(255,240,200,.15)'] },
  trail: { base: ['#7e6644', '#5e4a2e'], soft: 'rgba(90,70,40,.35)', specks: ['rgba(40,26,12,.4)', 'rgba(210,150,60,.4)'] },
  flag: { base: ['#5e5866', '#403c48'], edge: 'rgba(8,6,12,.6)', tile: [20, 12, 'rgba(10,8,14,.6)'], jag: 1, bones: true },
  planks: { base: ['#8a6a40', '#5e4424'], edge: 'rgba(30,18,6,.7)', planks: 6, posts: true },
  basalt: { base: ['#2e2426', '#1a1214'], edge: 'rgba(0,0,0,.6)', tile: [16, 12, 'rgba(255,110,30,.6)'], jag: 1, lava: true },
  ice: { base: ['#dce8f4', '#a8bcd2'], banks: '#f8fbff', tile: [18, 12, 'rgba(110,140,180,.5)'], shine: true },
  snow: { base: ['#dfe7f0', '#b0c0d4'], banks: '#fbfdff', prints: true },
  slab: { base: ['#716880', '#4c4458'], edge: 'rgba(190,150,255,.4)', tile: [22, 16, 'rgba(8,4,14,.65)'], jag: 0.6, crystals: true },
  track: { base: ['#dcc090', '#b8966a'], soft: 'rgba(150,110,60,.4)', ruts: 'rgba(100,66,30,.55)', specks: ['rgba(110,80,50,.4)', 'rgba(255,245,220,.3)'] },
};
// Punkty co `step` jednostek świata wzdłuż łamanej: [X, Z, e, szerokość, nx, nz] (n = kierunek w poprzek drogi)
function pathFrames(pts, step, w0) {
  const P = subdiv(pts, 4), cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], (P[i][1] - P[i - 1][1]) * 300));
  const D = cum[cum.length - 1], out = [];
  for (let d = 0, i = 0; d <= D + 1e-6; d += step) {
    while (i < P.length - 2 && cum[i + 1] < d) i++;
    const a = P[i], b = P[i + 1], f = clamp((d - cum[i]) / (cum[i + 1] - cum[i] || 1), 0, 1), dx = b[0] - a[0], dz = (b[1] - a[1]) * 300, l = Math.hypot(dx, dz) || 1;
    out.push([a[0] + dx * f, a[1] + (b[1] - a[1]) * f, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * f, (a[3] && b[3] ? a[3] + (b[3] - a[3]) * f : a[3] || b[3]) || w0, -dz / l, dx / l]);
  }
  return out;
}
const pathAt = (F, o) => proj(F[0] + F[4] * o, F[1] + F[5] * o / 300, F[2]);
function roadStyled(c, A, Rd, Wd, fx) {
  const S = ROAD_LOOK[Rd.style]; if (!S) return roadArtW(c, A, Rd);
  const pts = subdiv(Rd.pts, 5), line = (E, col, lw) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); E.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
  if (S.banks) { const [L2, R2] = ribbon(pts.map(p => [p[0], p[1], p[2], (p[3] || Rd.w) * 1.45]), Rd.w * 1.45); ribbonPath(c, L2, R2); c.fillStyle = S.banks; c.fill(); }
  if (S.soft) { const [L2, R2] = ribbon(pts.map(p => [p[0], p[1], p[2], (p[3] || Rd.w) * 1.3]), Rd.w * 1.3); ribbonPath(c, L2, R2); c.fillStyle = S.soft; c.fill(); }
  const [L, R] = ribbon(pts, Rd.w), ys = [...L, ...R].map(p => p[1]), g = c.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  g.addColorStop(0, S.base[1]); g.addColorStop(1, S.base[0]); ribbonPath(c, L, R); c.fillStyle = g; c.fill();
  c.save(); ribbonPath(c, L, R); c.clip();
  const r = mulberry32(7 + Math.round(Rd.pts[0][0] + Rd.pts[0][1] * 100));
  if (S.tile) { // płyty w perspektywie: rzędy w poprzek drogi, spoiny wzdłuż co drugi rząd przesunięte
    const [len, wid, col] = S.tile, F = pathFrames(Rd.pts, len, Rd.w), sMid = proj(0, F[F.length >> 1][1])[2]; c.strokeStyle = col; c.lineWidth = Math.max(0.7, sMid * (S.lava ? 1.6 : 1.2)); c.beginPath();
    F.forEach((f, k) => { const w = f[3] / 2, j = S.jag ? (r() - 0.5) * len * 0.5 * S.jag : 0, [x1, y1] = pathAt([f[0], f[1] + j / 300, ...f.slice(2)], -w), [x2, y2] = pathAt([f[0], f[1] + j / 300, ...f.slice(2)], w);
      c.moveTo(x1, y1); c.lineTo(x2, y2);
      const nx = F[k + 1]; if (!nx) return; const n = Math.max(1, Math.round(f[3] / wid));
      for (let i = 1; i < n; i++) { const o = -w + (i + (k % 2 ? 0.5 : 0)) * f[3] / n; if (o >= w) continue; const [ax, ay] = pathAt(f, o), [bx, by] = pathAt(nx, o * nx[3] / f[3]); c.moveTo(ax, ay); c.lineTo(bx, by); }
    });
    c.stroke();
    F.forEach((f, k) => {
      if (S.shine && k % 3 === 0) { const [sx, sy, ss] = pathAt(f, (r() - 0.5) * f[3] / 2); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(sx, sy - ss, 4 * ss, Math.max(1, ss)); }
      if (S.lava && fx && k % 9 === 4) { const [sx, sy, ss] = pathAt(f, 0); fx.glows.push([sx, sy, 16 * ss, '#ff5a10']); }
    });
  }
  if (S.planks) { const F = pathFrames(Rd.pts, S.planks, Rd.w); F.forEach((f, k) => { const [x1, y1, s] = pathAt(f, -f[3] / 2), [x2, y2] = pathAt(f, f[3] / 2); c.strokeStyle = k % 5 === 2 ? 'rgba(20,12,4,.55)' : 'rgba(30,18,8,.4)'; c.lineWidth = Math.max(0.7, s * 1.1); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    if (k % 7 === 3) { c.fillStyle = 'rgba(255,230,180,.14)'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x2, y2 + 2 * s); c.lineTo(x1, y1 + 2 * s); c.closePath(); c.fill(); } }); }
  if (S.ruts) { const F = pathFrames(Rd.pts, 6, Rd.w); c.strokeStyle = S.ruts; for (const k of [-0.24, 0.24]) { c.lineWidth = Math.max(0.8, 2 * proj(0, F[0][1])[2]); c.beginPath(); F.forEach((f, i) => { const [x, y] = pathAt(f, f[3] * k); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); } }
  if (S.prints) { const F = pathFrames(Rd.pts, 9, Rd.w); c.fillStyle = 'rgba(100,130,170,.45)'; F.forEach((f, k) => { const [x, y, s] = pathAt(f, (k % 2 ? 1 : -1) * 3 + Math.sin(k * 1.3) * f[3] * 0.18); c.fillRect(x - s, y - s * 0.6, 2.4 * s, 1.4 * s); }); }
  if (S.specks) for (let i = 0; i < 170; i++) { const k = r() * (pts.length - 1), i0 = Math.floor(k), p = pts[i0], q = pts[i0 + 1], f = k - i0, wd = p[3] || Rd.w, off = (r() - 0.5) * wd * 0.9;
    const [x, y, s] = proj(p[0] + (q[0] - p[0]) * f + off, p[1] + (q[1] - p[1]) * f, (p[2] || 0) + ((q[2] || 0) - (p[2] || 0)) * f); c.fillStyle = S.specks[r() < 0.5 ? 0 : 1]; c.fillRect(x - 2 * s, y - s, 4 * s, 1.8 * s); }
  const F = pathFrames(Rd.pts, 5, Rd.w); c.strokeStyle = 'rgba(20,14,8,.5)'; // schody tam, gdzie droga wspina się na taras albo wzgórze
  for (let k = 1; k < F.length; k++) if (Math.abs(F[k][2] - F[k - 1][2]) > 1.5) { const [x1, y1, s] = pathAt(F[k], -F[k][3] / 2), [x2, y2] = pathAt(F[k], F[k][3] / 2); c.lineWidth = Math.max(0.8, s * 1.2); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  c.restore();
  if (S.edge) { line(L, S.edge, 1.3); line(R, S.edge, 1.3); }
  if (S.curb) { line(L, S.curb, 1); line(R, S.curb, 1); }
  if (S.posts || S.bones || S.crystals) { const F2 = pathFrames(Rd.pts, S.posts ? 34 : 70, Rd.w); F2.forEach((f, k) => { if (k === 0) return; for (const sd of [-1, 1]) {
    const [x, y, s] = pathAt(f, sd * (f[3] / 2 + 1));
    if (S.posts) { c.fillStyle = '#3a2812'; c.fillRect(x - 1.2 * s, y - 5 * s, 2.4 * s, 9 * s); c.fillStyle = 'rgba(255,230,180,.2)'; c.fillRect(x - 1.2 * s, y - 5 * s, 2.4 * s, 1.2 * s); }
    else if (S.bones && (k + (sd > 0)) % 2) skullAt(c, x, y - 2 * s, 0.45 * s);
    else if (S.crystals && (k + (sd > 0)) % 2) { fillPoly(c, [[x - 2 * s, y], [x - 0.5 * s, y - 8 * s], [x + 1.5 * s, y - 5 * s], [x + 2 * s, y]], '#9a60e0'); if (fx) fx.glows.push([x, y - 4 * s, 10 * s, '#a060ff']); }
  } }); }
}

// --- sieć ścieżek: od drzwi każdej budowli do najbliższego miejsca na drodze albo na innej ścieżce ---
function townPaths(r, T, L, Bm) {
  const M = L.roads.find(R => R.main); if (!M) return;
  const wade = !!(Bm.wade || T.planks);
  M.w *= Bm.mainW; for (const p of M.pts) if (p[3]) p[3] *= Bm.mainW; M.style = Bm.road;
  const W = (p, d) => [p[0], p[1], p[2] || 0];
  const main = subdiv(M.pts, 3).map(W), net = [];
  main.forEach((p, i) => { if (Math.abs(p[2] - townElev(T, L, p[0], p[1])) < 1 && p[1] > 0.84) net.push({ X: p[0], Z: p[1], e: p[2], route: main.slice(0, i + 1) }); });
  L.mainRoute = main; L.doorRoutes = {};
  const wet = (X, Z) => {
    if (T.river && segDist(X, Z, T.river.pts) < T.river.w / 2 + 6) return 2;
    if (T.chasm && segDist(X, Z, T.chasm.pts) < 95) return 2;
    if (T.sea && T.sea.s * X > T.sea.s * T.sea.xAt(Z) - 14) return 2;
    if (!T.frozen) for (const Lk of L.lakes) if (((X - Lk.X) / (Lk.rx + 6)) ** 2 + ((Z - Lk.Z) / (Lk.rz + 0.02)) ** 2 < 1 && !inIsland(T, X, Z, 0.95)) return Lk.pit ? 2 : 1;
    return 0;
  };
  const rects = L.slots.map(slotRect), wallZ = X => { const P = L.walls && L.walls[0].pts; if (!P) return null; const i = clamp(Math.floor((X + 1500) / 50), 0, P.length - 2), f = (X - P[i][0]) / 50; return P[i][1] + (P[i + 1][1] - P[i][1]) * f; };
  const hidden = (X, Z, e) => { // 2: za wzgórzem albo w ścianie tarasu (droga malowałaby się na skale), 1: za budowlą (tylko kara)
    for (const Hl of L.hills) if (Z > Hl.Z - 0.03 && Math.abs(X - Hl.X) < Hl.rx && e < hillTop(Hl, X) - 2) return 2;
    for (const Sb of L.slabs) if (Z > Sb.Z0 && X > Sb.x0 && X < Sb.x1 && e < Sb.e - 2) return 2;
    const [sx, sy] = proj(X, Z, e);
    for (let j = 0; j < L.slots.length; j++) { const S = L.slots[j], Q = rects[j]; if (S.Z < Z && sx > Q.x + Q.w * 0.12 && sx < Q.x + Q.w * 0.88 && sy > Q.y + Q.h * 0.1 && sy < Q.sy + 2) return 1; }
    return 0;
  };
  const build = (i, door, tgt, wig) => {
    const a = [door.X, door.Z - 0.05], dx = tgt.X - a[0], dz = (tgt.Z - a[1]) * 300, len = Math.hypot(dx, dz); if (len < 10) return null;
    const off = wig * len, mx = (a[0] + tgt.X) / 2 - dz / len * off, mz = (a[1] + tgt.Z) / 2 + dx / len * off / 300, n = Math.max(3, Math.ceil(len / 24)), pts = [[door.X, door.Z, door.e]];
    const ramp = door.e > 0 && Math.abs(door.e - townElev(T, L, door.X, door.Z)) > 1 ? door.e : 0; // budowla na wzgórzu: ścieżka schodzi po zboczu
    let water = 0, cover = 0, lastE = door.e, wz0 = wallZ(door.X);
    for (let s = 0; s <= n; s++) {
      const f = s / n, u = 1 - f, X = u * u * a[0] + 2 * u * f * mx + f * f * tgt.X, Z = s === n ? tgt.Z : u * u * a[1] + 2 * u * f * mz + f * f * tgt.Z;
      let e = s === n ? tgt.e : Math.max(townElev(T, L, X, Z), ramp * Math.max(0, 1 - (s + 1) / (n * 0.6)));
      const w = wet(X, Z); if (w === 2 || (w && !wade)) return null; water += w;
      const h = s < n ? hidden(X, Z, e) : 0; if (h === 2) return null; cover += h;
      if (wz0 !== null && Math.sign(Z - wallZ(X)) !== Math.sign(door.Z - wz0)) return null;
      if (Math.abs(e - lastE) > 1.5 && !ramp) { // stopień: tylko na przedniej krawędzi tarasu, nigdy z boku
        const hi = Math.max(e, lastE), Sb = L.slabs.find(q => Math.abs(q.e - hi) < 1 && X > q.x0 + 6 && X < q.x1 - 6 && Math.abs(Z - q.Z0) < 0.12); if (!Sb) return null;
        const p0 = pts[pts.length - 1]; pts.push([X, Sb.Z0 + (lastE > e ? 0.012 : -0.012), lastE], [X, Sb.Z0 + (lastE > e ? -0.012 : 0.012), e]); if (p0[1] < Sb.Z0 === Z < Sb.Z0) return null;
      }
      pts.push([X, Z, e]); lastE = e;
    }
    return { pts, len: len * (1 + Math.abs(wig)) + water * 30 + cover * 40, water };
  };
  const order = L.slots.map((S, i) => ({ i, d: Math.min(...net.map(p => Math.hypot(p.X - S.X, (p.Z - S.Z) * 300))) })).filter(o => o.i > 1).sort((a, b) => a.d - b.d);
  for (const { i } of order) {
    const S = L.slots[i], door = { X: S.X, Z: S.Z - 0.012, e: S.e || 0 }; let best = null;
    const cands = net.map(p => ({ p, d: Math.hypot(p.X - door.X, (p.Z - door.Z) * 300) })).sort((a, b) => a.d - b.d).slice(0, 16);
    for (const { p } of cands) for (const wig of [between(r, -1, 1) * Bm.wiggle, between(r, -1, 1) * Bm.wiggle * 0.3]) { const b = build(i, door, p, wig); if (b && (!best || b.len < best.len)) best = { ...b, tgt: p }; }
    if (!best) continue;
    const lane = { w: Bm.laneW, style: Bm.lane, pts: best.pts.map(q => [...q]) }; L.roads.splice(L.roads.indexOf(M), 0, lane);
    T.feats.push({ pts: best.pts.map(q => [q[0], q[1]]), w: Bm.laneW + 8 });
    const back = best.pts.slice().reverse(), route = [...best.tgt.route, ...back.slice(1)]; L.doorRoutes[i] = route;
    for (let k = 3; k < back.length - 2; k++) net.push({ X: back[k][0], Z: back[k][1], e: back[k][2], route: [...best.tgt.route, ...back.slice(1, k + 1)] });
  }
  if (Bm.lane !== 'planks') for (const Rd of L.roads.filter(q => q.style)) { // nad wodą drogi i ścieżki biegną po kładkach na palach
    const P = subdiv(Rd.pts, 3); let run = [];
    P.forEach((p, k) => { const w = wet(p[0], p[1]) === 1; if (w) { if (!run.length && k) run.push(P[k - 1]); run.push(p); }
      if ((!w || k === P.length - 1) && run.length) { if (!w) run.push(p); if (run.length > 2) L.roads.push({ w: Rd.w * 1.08, style: 'planks', pts: run }); run = []; } });
  }
}
// Mieszkańcy: kilka dróg od bramy do budowli (i główną drogą do zamku), straż przed zamkiem
function townFolk(r, T, L, Bm) {
  const withD = pts => { let d = 0; return pts.map((p, i) => { if (i) d += Math.hypot(p[0] - pts[i - 1][0], (p[1] - pts[i - 1][1]) * 300); return [p[0], p[1], p[2] || 0, d]; }); };
  const ids = Object.keys(L.doorRoutes || {}).map(Number); for (let i = ids.length - 1; i > 0; i--) { const j = r() * (i + 1) | 0; [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const routes = [L.mainRoute, ...ids.slice(0, 5).map(i => L.doorRoutes[i])].filter(p => p && p.length > 1);
  L.folk = routes.map((pts, k) => { const P = withD(pts); return { pts: P, D: P[P.length - 1][3], kind: Bm.folk[(k + (r() * Bm.folk.length | 0)) % Bm.folk.length], n: k === 0 ? 2 : 1 + (r() < 0.35 ? 1 : 0), v: between(r, 15, 22), ph: r() * 400, door: k > 0 }; });
  const fort = L.slots[1]; L.guards = [-24, 24].map(dx => ({ X: fort.X + dx, Z: fort.Z - 0.02, e: fort.e || 0, kind: Bm.guard }));
}
function drawTownFolk(ctx, LL, tm, rects) {
  const behind = (x, y, Z) => rects && Object.values(rects).some(R => R.z < Z && x > R.x + R.w * 0.12 && x < R.x + R.w * 0.88 && y > R.y + R.h * 0.1 && y < R.y + R.h + 2);
  for (const [k, W] of (LL.folk || []).entries()) for (let j = 0; j < W.n; j++) {
    const P = 70, cyc = 2 * W.D + 2 * P, p = (tm * W.v + W.ph + j * (W.D * 0.8 + 50)) % cyc;
    let d, fwd; if (p < W.D) { d = p; fwd = true; } else if (p < W.D + P) { if (W.door) continue; d = W.D; fwd = true; } else if (p < 2 * W.D + P) { d = 2 * W.D + P - p; fwd = false; } else continue;
    const pts = W.pts; let i = 1; while (i < pts.length - 1 && pts[i][3] < d) i++;
    const a = pts[i - 1], b = pts[i], f = clamp((d - a[3]) / (b[3] - a[3] || 1), 0, 1), side = j ? 7 : -7, dz = (b[1] - a[1]) * 300, dx = b[0] - a[0], l = Math.hypot(dx, dz) || 1;
    const [x, y, sc] = proj(a[0] + dx * f - dz / l * side, a[1] + (b[1] - a[1]) * f + dx / l * side / 300, a[2] + (b[2] - a[2]) * f);
    if (y > 446 || behind(x, y, a[1] + (b[1] - a[1]) * f)) continue; // za budowlą: nie widać go
    drawDweller(ctx, W.kind, x, y, sc * 1.05, tm + k * 1.7 + j, (dx >= 0) === fwd ? 1 : -1, false, k + j * 3);
  }
  for (const [k, Gd] of (LL.guards || []).entries()) { const [x, y, sc] = proj(Gd.X, Gd.Z, Gd.e); drawDweller(ctx, Gd.kind, x, y, sc * 1.12, 0, k ? -1 : 1, true, k); }
}

// --- mieszkańcy frakcji (stopy w (0, 0), twarzą w prawo; still = straż stoi w miejscu) ---
function drawDweller(ctx, kind, x, y, sc, t, dir, still, v = 0) {
  const big = { imp: 0.72, gremlin: 0.72, goblin: 0.74, dwarf: 0.9, demon: 1.25, minotaur: 1.3, orc: 1.12, golem: 1.2, wolf: 1.1 }[kind] || 1;
  if (kind === 'skeleton') return drawSkeleton(ctx, x, y, sc * 1.1, still ? 0 : t, dir, still);
  const hop = kind === 'imp' && !still ? Math.abs(Math.sin(t * 7)) * 3 : 0;
  ctx.save(); ctx.translate(x, y - hop * sc); ctx.scale(sc * dir * big, sc * big);
  const ph = still ? 0 : Math.sin(t * (kind === 'zombie' ? 4 : kind === 'golem' ? 3 : 8)), P = ctx;
  const legs = (col, h = 6, sp = 2, lw = 1.6) => { P.strokeStyle = col; P.lineWidth = lw; P.lineCap = 'round'; P.beginPath(); P.moveTo(0, -h); P.lineTo(-sp * ph, 0); P.moveTo(0, -h); P.lineTo(sp * ph, 0); P.stroke(); };
  const body = (col, y0, y1, wb, wt, lean = 0) => fillPoly(P, [[-wb, y0], [wb, y0], [wt + lean, y1], [-wt + lean, y1]], col);
  const stick = (x0, y0, x1, y1, col, lw = 1.2) => { P.strokeStyle = col; P.lineWidth = lw; P.lineCap = 'round'; P.beginPath(); P.moveTo(x0, y0); P.lineTo(x1, y1); P.stroke(); };
  const eye = (ex, ey, col = '#1a1208') => { P.fillStyle = col; P.fillRect(ex, ey, 1, 1); };
  switch (kind) {
    case 'peasant': { const c = ['#7a5a3a', '#3a4a6a', '#5a6a3a', '#7a3a2a'][v % 4]; legs('#3a2a1a'); body(c, -5, -13, 3.2, 2.2); circ(P, 0, -15.5, 2.5, '#e8c8a0');
      P.fillStyle = '#c8a860'; P.beginPath(); P.ellipse(0, -17.4, 4.2, 1.2, 0, 0, TAU); P.fill(); P.fillRect(-2, -19.5, 4, 2.2); if (v % 2) { P.fillStyle = '#8a6a3a'; P.fillRect(2.5, -10, 3.5, 3.5); } break; }
    case 'maid': { const c = ['#8a3a3a', '#3a5a7a', '#6a4a7a'][v % 3], sw = ph * 0.6; fillPoly(P, [[-4 - sw, 0], [4 + sw, 0], [2.2, -12.5], [-2.2, -12.5]], c); P.fillStyle = '#e8e0d0'; P.fillRect(0.6, -10, 2.4, 8);
      circ(P, 0, -15, 2.4, '#f0d0b0'); P.fillStyle = '#e8e0d0'; P.beginPath(); P.arc(0, -15.5, 2.8, Math.PI, 0); P.fill(); if (v % 2) { P.fillStyle = '#9a7a4a'; P.beginPath(); P.ellipse(4, -8, 2.6, 1.6, 0, 0, TAU); P.fill(); } break; }
    case 'soldier': { legs('#2a2a30'); body('#8a92a0', -5, -13, 3.2, 2.6); P.fillStyle = '#3a5f9e'; P.fillRect(-1.2, -12.5, 2.4, 7.5); circ(P, 0, -15.5, 2.5, '#e8c8a0');
      P.fillStyle = '#9aa2b0'; P.beginPath(); P.arc(0, -16, 2.9, Math.PI, 0); P.fill(); P.fillRect(-0.4, -16.5, 0.8, 3); stick(4, 1, 4, -23, '#5a3a1e'); fillPoly(P, [[3, -23], [4, -26.5], [5, -23]], '#c8ccd4');
      circ(P, -3, -9.5, 3.2, '#3a5f9e'); circ(P, -3, -9.5, 1, '#d8c070'); break; }
    case 'elf': case 'archer': { legs('#3a4a2a', 6.5, 2, 1.4); body(v % 2 ? '#3a6a3a' : '#4a7a4a', -4, -13.5, 3.2, 2); circ(P, 0, -15.7, 2.3, '#f0d8b0'); fillPoly(P, [[-2.6, -15], [-1, -20.5], [2.6, -16.5]], '#2e5a30');
      fillPoly(P, [[1.8, -16.2], [4.2, -17.6], [2.2, -15.2]], '#f0d8b0');
      P.strokeStyle = '#6a4a24'; P.lineWidth = 1; P.beginPath(); if (kind === 'archer') { P.arc(3, -12, 6.5, -1.2, 1.2); P.stroke(); stick(3, -18, 3, -6, 'rgba(230,230,210,.8)', 0.5); } else { P.arc(-2.5, -11, 5.5, 1.9, 4.4); P.stroke(); } break; }
    case 'dwarf': { legs('#3a2a1a', 4, 1.6, 2); body('#7a4a2a', -3.5, -10.5, 4.2, 3.4); P.fillStyle = '#4a3a2a'; P.fillRect(-4.2, -5.5, 8.4, 1.5); circ(P, 0, -12.8, 2.6, '#e8b890');
      fillPoly(P, [[-2.6, -12.5], [2.6, -12.5], [1, -6.5], [-1, -6.5]], '#c8702a'); P.fillStyle = '#8a8e98'; P.beginPath(); P.arc(0, -13.4, 2.9, Math.PI, 0); P.fill();
      stick(4.5, -2, 4.5, -14, '#5a3a1e', 1.1); fillPoly(P, [[4.5, -14], [7.5, -15.5], [7.5, -11], [4.5, -12]], '#b0b4bc'); break; }
    case 'zombie': { legs('#3a3a2a', 6, 1.4); body('#4a5a44', -5, -12.5, 3.2, 2.4, 2); P.fillStyle = 'rgba(0,0,0,.3)'; P.fillRect(-2, -9, 2, 3); circ(P, 2.6, -14.5, 2.4, '#8a9a7a');
      eye(3, -15.5, '#e0f070'); stick(1.5, -11, 7.5, -10.5 + ph * 0.5, '#8a9a7a', 1.3); stick(0.5, -10.5, 6.5, -9 - ph * 0.5, '#7a8a6a', 1.3); break; }
    case 'lizard': { P.strokeStyle = '#3a6a2a'; P.lineWidth = 2.2; P.lineCap = 'round'; P.beginPath(); P.moveTo(-2, -6); P.quadraticCurveTo(-7, -4, -10, -1 + ph * 0.5); P.stroke(); legs('#3a5a2a', 6, 2, 1.8);
      body('#4a7a3a', -5, -13, 3.2, 2.4); P.fillStyle = '#9ab87a'; P.fillRect(0.4, -12, 1.8, 6); P.fillStyle = '#5a8a3a'; P.beginPath(); P.ellipse(1.6, -15.3, 3.6, 2.2, 0.15, 0, TAU); P.fill(); eye(2, -16.4, '#f0d040');
      if (still) { stick(4, 1, 4, -23, '#5a3a1e'); fillPoly(P, [[3, -23], [4, -26.5], [5, -23]], '#b0a080'); } break; }
    case 'gnoll': { legs('#4a3a24', 6, 2, 1.8); body('#8a6a3a', -5, -12.5, 3.2, 2.6, 1); P.fillStyle = '#5a4020'; P.fillRect(-3, -6.5, 6, 2); circ(P, 1.2, -14.8, 2.6, '#9a7a4a');
      P.fillStyle = '#8a6a3a'; P.fillRect(2.6, -15, 3, 2); fillPoly(P, [[-1.5, -16.5], [-0.8, -19.5], [0.6, -17]], '#6a4a24'); eye(2, -15.8); stick(-3, -10, -4, -3, '#6a4a24', 1.6); break; }
    case 'imp': { const f = Math.sin(t * 16) * 3; fillPoly(P, [[-1, -11], [-8, -15 - f], [-6, -9]], '#6a1a10'); fillPoly(P, [[-1, -11], [-6, -17 - f], [-3, -9]], '#8a2414');
      P.strokeStyle = '#8a2414'; P.lineWidth = 1; P.beginPath(); P.moveTo(-2, -5); P.quadraticCurveTo(-7, -3, -8, -7); P.stroke(); fillPoly(P, [[-9, -8], [-7, -7.5], [-8.5, -5.5]], '#8a2414');
      legs('#6a1a10', 5, 1.8, 1.4); body('#b8321e', -4.5, -11.5, 2.8, 2.2); circ(P, 0.5, -13.8, 2.6, '#c83a22'); fillPoly(P, [[-1.8, -15.5], [-2.8, -19], [-0.6, -16]], '#2a1008'); fillPoly(P, [[1.4, -16], [2.2, -19.5], [2.8, -15.6]], '#2a1008'); eye(1.6, -14.4, '#ffd040'); break; }
    case 'demon': { legs('#3a0e08', 6, 2, 2); body('#8a2a1a', -5, -13.5, 3.4, 3.2); P.fillStyle = '#5a140c'; P.fillRect(-3.4, -6.5, 6.8, 1.8); circ(P, 0, -15.8, 2.7, '#a8321e');
      P.strokeStyle = '#e0d0b0'; P.lineWidth = 1.2; P.beginPath(); P.moveTo(-1.8, -17.4); P.quadraticCurveTo(-4.5, -19, -3.6, -21.5); P.moveTo(1.8, -17.4); P.quadraticCurveTo(4.5, -19, 3.6, -21.5); P.stroke(); eye(1, -16.2, '#ffd040');
      if (still || v % 2) { stick(4.5, 1, 4.5, -23, '#2a1a14'); P.strokeStyle = '#c8b090'; P.lineWidth = 0.9; P.beginPath(); P.moveTo(3, -26); P.lineTo(3, -23); P.lineTo(6, -23); P.lineTo(6, -26); P.moveTo(4.5, -27); P.lineTo(4.5, -23); P.stroke(); } break; }
    case 'mage': { const c = ['#3a4a9a', '#6a3a8a', '#2a6a7a'][v % 3], sw = ph * 0.5; fillPoly(P, [[-3.8 - sw, 0], [3.8 + sw, 0], [2.2, -13], [-2.2, -13]], c); P.fillStyle = 'rgba(255,220,120,.7)'; P.fillRect(-2.6, -7.5, 5.2, 1);
      circ(P, 0, -15.2, 2.3, '#f0d0b0'); fillPoly(P, [[-1.8, -14.5], [1.8, -14.5], [0.4, -10.5]], '#e8e8ea'); fillPoly(P, [[-3.6, -16.6], [3.6, -16.6], [0.8, -24], [-0.4, -23.4]], shadeHex(c, -0.2));
      stick(4.5, 0, 4.5, -20, '#6a4a2a', 1); circ(P, 4.5, -21, 1.6, '#9ad8ff'); break; }
    case 'gremlin': { legs('#4a4a5a', 5, 1.8, 1.4); body('#5a6a8a', -4.5, -11, 3, 2.4); P.fillStyle = '#8a6a3a'; P.fillRect(-3, -7, 6, 1.5); circ(P, 0.5, -13.5, 2.8, '#7a8aa0');
      fillPoly(P, [[-1.8, -14.5], [-6.5, -17], [-1.5, -12.8]], '#7a8aa0'); fillPoly(P, [[2.6, -14.5], [6.5, -17.5], [2.8, -12.8]], '#7a8aa0'); circ(P, 1.8, -14, 0.9, '#f0e040'); stick(3, -9, 6, -6, '#8a8e98', 1.4); break; }
    case 'golem': { const lg = ph * 1.2; P.fillStyle = '#6a6e78'; P.fillRect(-3.5 + lg, -6, 2.8, 6); P.fillRect(0.7 - lg, -6, 2.8, 6); P.fillStyle = '#8a8e98'; P.fillRect(-4.5, -15, 9, 9.5);
      P.fillStyle = '#7a7e88'; P.fillRect(-6.5, -14.5, 2.4, 8); P.fillRect(4.1, -14.5, 2.4, 8); P.fillStyle = '#9a9ea8'; P.fillRect(-2.6, -19.5, 5.2, 4.6); P.fillStyle = '#8ad8ff'; P.fillRect(-1.6, -18, 1.2, 1.2); P.fillRect(0.6, -18, 1.2, 1.2);
      P.fillStyle = 'rgba(0,0,0,.25)'; P.fillRect(-1, -13, 1, 5); P.fillStyle = '#8ad8ff'; P.fillRect(-0.8, -11.5, 1.6, 1.6); break; }
    case 'trog': { legs('#5a4a5a', 6, 2, 1.6); body('#8a7a8a', -5, -12, 3, 2.4, 1.5); P.fillStyle = '#5a3a2a'; P.fillRect(-3, -6.5, 6, 2.5); circ(P, 2, -14, 2.5, '#9a8a9a');
      P.fillStyle = 'rgba(0,0,0,.35)'; P.fillRect(2.4, -13.2, 2, 0.8); stick(4, 0, 6, -18, '#4a3a2a', 1); fillPoly(P, [[5.4, -18], [6.6, -21.5], [7, -17.8]], '#c8c0d0'); break; }
    case 'warlock': { const sw = ph * 0.5; fillPoly(P, [[-4 - sw, 0], [4 + sw, 0], [2.4, -13.5], [-2.4, -13.5]], '#2a1a3a'); fillPoly(P, [[-3, -13], [3, -13], [2.6, -17.5], [0.2, -20], [-2.6, -17]], '#3a2250');
      circ(P, 0.6, -15.4, 1.8, '#0a0610'); P.fillStyle = '#d080ff'; P.fillRect(0.4, -16, 0.9, 0.9); P.fillRect(1.8, -16, 0.9, 0.9); stick(4.5, 0, 4.5, -19, '#2a1a24', 1); circ(P, 4.5, -20, 1.8, '#b060ff'); break; }
    case 'minotaur': { legs('#3a2410', 6.5, 2, 2.2); body('#7a4a2a', -5.5, -14, 3.6, 3.8); P.fillStyle = '#5a3a1e'; P.fillRect(-3.6, -7, 7.2, 2); P.fillStyle = '#5a3418'; P.beginPath(); P.ellipse(0.6, -16.4, 2.8, 2.6, 0, 0, TAU); P.fill();
      P.fillStyle = '#8a6a4a'; P.fillRect(2.4, -16, 2.4, 2.2); P.strokeStyle = '#e8dcc0'; P.lineWidth = 1.1; P.beginPath(); P.moveTo(-1.8, -17.8); P.quadraticCurveTo(-4.6, -18.5, -4, -21); P.moveTo(2.2, -17.8); P.quadraticCurveTo(4.8, -18.5, 4.4, -21); P.stroke(); eye(1.8, -17, '#ff4020');
      stick(5, 1, 5, -22, '#4a2e14', 1.3); fillPoly(P, [[5, -22], [9, -24.5], [9, -17.5], [5, -19]], '#a8acb4'); fillPoly(P, [[5, -22], [1.8, -24], [1.8, -18.5], [5, -19]], '#8a8e98'); break; }
    case 'goblin': { legs('#3a4a1a', 5, 1.8, 1.4); body('#7a5a3a', -4.5, -10.8, 3, 2.2); circ(P, 0.6, -13.2, 2.6, '#7aa03a'); fillPoly(P, [[-1.6, -14], [-6, -15.5], [-1.4, -12.4]], '#7aa03a'); fillPoly(P, [[2.6, -14], [6.4, -15.8], [2.8, -12.4]], '#7aa03a');
      eye(1.8, -13.8, '#f0d040'); stick(3.5, -8, 6.5, -13, '#6a4a24', 1.6); break; }
    case 'orc': { legs('#3a2a1a', 6, 2, 1.9); body('#5a3a24', -5, -13.5, 3.6, 3.2); P.fillStyle = '#3a2410'; P.fillRect(-3.6, -7, 7.2, 1.6); stick(-3.4, -12.5, -4.4, -6.5, '#6a8a4a', 1.8);
      circ(P, 0.4, -15.8, 2.7, '#6a8a4a'); P.fillStyle = '#f0ead8'; P.fillRect(1.6, -15, 0.8, 1.4); P.fillRect(-0.4, -15, 0.8, 1.4); eye(1.4, -16.8, '#ff3020');
      stick(4.5, 0, 4.5, -17, '#5a3a1e', 1.2); fillPoly(P, [[4.5, -17], [8.5, -18.5], [8, -13], [4.5, -14]], '#a8acb4'); break; }
    case 'wolf': { const a = ph * 1.8, c = '#6a6058'; stick(-4, -5, -4 + a, 0, '#4a4038', 1.4); stick(4, -5, 4 - a, 0, '#4a4038', 1.4); stick(-2.5, -5, -2.5 - a, 0, c, 1.4); stick(5.5, -5, 5.5 + a, 0, c, 1.4);
      P.fillStyle = c; P.beginPath(); P.ellipse(0.5, -6.5, 6.5, 2.8, 0, 0, TAU); P.fill(); P.strokeStyle = c; P.lineWidth = 1.8; P.beginPath(); P.moveTo(-5.5, -7); P.quadraticCurveTo(-9, -8, -10, -5 + ph); P.stroke();
      circ(P, 7, -8.5, 2.3, '#7a7068'); fillPoly(P, [[8.2, -9.5], [11.5, -8], [8.4, -7.2]], '#7a7068'); fillPoly(P, [[5.8, -10], [6.4, -12.8], [7.6, -10.2]], '#5a5048'); eye(7.8, -9.2, '#f0d040'); break; }
    default: drawWalker(P, 0, 0, 1, '#7a5a3a', t, 1);
  }
  ctx.restore();
}
