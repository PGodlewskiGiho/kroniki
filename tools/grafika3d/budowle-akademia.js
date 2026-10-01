// Budowle Akademii (miasto magów w ośnieżonych górach) w 3D: biały marmur, błękitne i złote kopuły, śnieg na dachach, lodowe kryształy,
// smukłe wieże z mostami, sfery armilarne. Każda budowla ma własną bryłę (bez powtarzania jednego domku).
// Te same zasady co budowle-kurhan.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.academy = { hall(t), fort(t), … }.
'use strict';
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, hipRoof, coneRoof, mast, glowMark, creature, lightMat, boulder, dome, onionDome, crenTop, merlons, ringMerlons */
const AK = { marble: '#e8e6e0', marbleD: '#bcbab4', stone: '#9aa0aa', stoneD: '#6e7480', blue: '#3a6ab0', blueL: '#6a9ad8', teal: '#4aa0b0', gold: '#d8b048',
  snow: '#f6f8fc', ice: '#a8e0ff', wood: '#7a5a3c', glow: '#ffe0a0', cyan: '#80f0ff', violet: '#9a7ae0' };
// --- drobne bryły ---
const akWin = (w, h, x, y, z, glow = AK.glow) => opening(w, h, x, y, z, { glow, frame: AK.marbleD, frameKind: 'ashlar' });
// Śnieżna czapa na stożku/kopule: biały, płaski stożek tuż nad szczytem bryły
const akSnowCap = (r, h, x, y, z) => cone(r / PXU, h / PXU, AK.snow, 'plaster', P(x, y + h / 2, z), null, 14);
// Smukła wieża: walec z marmuru, pas gzymsu, okna, dach (stożek/kopuła/cebula) ze śniegiem i złotą iglicą
function akTower(r, h, x, z, { y = 0, roof = 'cone', col = AK.marble, rc = AK.blue, wins = 2, glow = AK.glow } = {}) { const g = new THREE.Group();
  g.add(cyl3(r * 1.15, r * 1.2, 6, AK.stoneD, 'ashlar', x, y, z, 14)); g.add(cyl3(r, r * 0.94, h, col, 'ashlar', x, y + 6, z, 14)); g.add(cyl3(r * 1.12, r * 1.12, 3, AK.marbleD, 'ashlar', x, y + 6 + h - 3, z, 14));
  for (let i = 0; i < wins; i++) g.add(akWin(r * 0.5, r * 0.9, x, y + 6 + h * (0.3 + 0.5 * i / Math.max(1, wins)), z + r * 0.93, glow));
  const top = y + 6 + h;
  if (roof === 'cone') { g.add(coneRoof(r * 1.2, r * 2.6, rc, 'tiles', x, top, z, 14)); g.add(akSnowCap(r * 0.5, r * 1.1, x, top + r * 1.5, z)); g.add(cone(0.7 / PXU, 10 / PXU, AK.gold, 'gold', P(x, top + r * 2.6 + 5, z), null, 6)); }
  if (roof === 'dome') { g.add(dome(r * 1.05, r * 0.9, rc, 'tiles', x, top, z)); g.add(dome(r * 0.6, r * 0.35, AK.snow, 'plaster', x, top + r * 0.62, z)); g.add(cone(0.7 / PXU, 10 / PXU, AK.gold, 'gold', P(x, top + r * 0.9 + 5, z), null, 6)); }
  if (roof === 'onion') { g.add(onionDome(r * 0.95, rc, 'gold', x, top, z)); g.add(cone(0.7 / PXU, 10 / PXU, AK.gold, 'gold', P(x, top + r * 1.9 + 5, z), null, 6)); }
  return g; }
// Łukowy most między wieżami
function akBridge(x0, x1, y, z, w = 8) { const g = new THREE.Group(), L = Math.abs(x1 - x0); g.add(blk(L, 4, w, AK.marble, 'ashlar', (x0 + x1) / 2, y, z));
  g.add(torus(L / 2 / PXU, 2.4 / PXU, AK.marbleD, 'ashlar', P((x0 + x1) / 2, y - L * 0.28, z), null, [1, 0.56, 1], Math.PI)); for (let x = Math.min(x0, x1) + 4; x < Math.max(x0, x1); x += 6) g.add(cyl3(0.8, 0.8, 5, AK.marbleD, 'ashlar', x, y + 4, z + w / 2 - 1, 6)); return g; }
function akCrystals(x, y, z, s = 1, n = 5, seed = 3, col = AK.ice) { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < n; i++) { const h = s * (8 + R() * 14);
  g.add(cone(s * (2 + R() * 2) / PXU, h / PXU, col, 'gem', P(x + (R() - 0.5) * s * 12, y + h / 2, z + (R() - 0.5) * s * 8), [(R() - 0.5) * 0.5, 0, (R() - 0.5) * 0.5], 6)); } glowMark(g, x, y + 8 * s, z, 10 * s, AK.cyan); return g; }
// Sfera armilarna na słupku: złote pierścienie wokół świecącego rdzenia
function akArmillary(x, y, z, r) { const g = new THREE.Group(); g.add(cyl3(r * 0.12, r * 0.16, r * 0.8, AK.gold, 'gold', x, y, z, 8)); const c = y + r * 0.8 + r;
  for (let i = 0; i < 3; i++) g.add(torus(r / PXU, r * 0.06 / PXU, AK.gold, 'gold', P(x, c, z), [i * 1.05, i * 0.6, 0.3 * i]));
  const core = sph(r * 0.32 / PXU, AK.cyan, 'glow', P(x, c, z), null, 12); core.material = lightMat('#a0f4ff'); g.add(core); glowMark(g, x, c, z, r * 1.2, AK.cyan); return g; }
// Marmurowy budynek z kolumnadą, trójkątnym frontonem i dachem ze śniegiem
function akTemple(w, h, d, x, z, { y = 0, cols = 6, roofCol = AK.blue } = {}) { const g = new THREE.Group(); g.add(blk(w + 10, 4, d + 10, AK.stoneD, 'ashlar', x, y, z)); g.add(blk(w + 4, 3, d + 4, AK.marbleD, 'ashlar', x, y + 4, z));
  g.add(blk(w * 0.8, h, d * 0.7, AK.marble, 'ashlar', x, y + 7, z - d * 0.1)); for (let i = 0; i < cols; i++) g.add(cyl3(2.4, 2.4, h, AK.marble, 'ashlar', x - w / 2 + 3 + i * (w - 6) / (cols - 1), y + 7, z + d / 2 - 3, 10));
  g.add(blk(w + 2, 4, d + 2, AK.marbleD, 'ashlar', x, y + 7 + h, z)); g.add(gable(w + 4, d + 4, h * 0.38, roofCol, 'tiles', x, y + 11 + h, z, 3, AK.marble, 'ashlar'));
  g.add(gable(w + 2, d + 2, h * 0.1, AK.snow, 'plaster', x, y + 11 + h + h * 0.3, z, 0)); for (let i = 0; i < 3; i++) g.add(akWin(5, h * 0.4, x - w * 0.22 + i * w * 0.22, y + 7 + h * 0.3, z + d * 0.25));
  return g; }

const ACADEMY3 = {
  hall(t) { // ratusz: marmurowy ratusz pod błękitną kopułą; 2: z kolumnadą; 3: dwie wieże; 4: Kapitol – złota kopuła na bębnie, cztery wieże
    const g = new THREE.Group(), w = [50, 64, 74, 84][t - 1], h = [28, 32, 36, 40][t - 1]; g.add(blk(w + 30, 5, 70, AK.stoneD, 'ashlar', 0, 0, 0));
    g.add(blk(w, h, 44, AK.marble, 'ashlar', 0, 5, -6)); g.add(blk(w + 4, 4, 48, AK.marbleD, 'ashlar', 0, 5 + h, -6)); for (let i = 0; i < 5; i++) g.add(akWin(6, h * 0.45, -w * 0.36 + i * w * 0.18, 5 + h * 0.3, 16.2));
    g.add(door(12, 20, 0, 5, 16, '#4a3a2a', AK.marbleD)); const dr = t >= 4 ? 30 : 20, dy = 9 + h; g.add(cyl3(dr * 0.9, dr * 0.9, t >= 4 ? 18 : 8, AK.marble, 'ashlar', 0, dy, -6, 20));
    g.add(dome(dr, dr * 0.85, t >= 4 ? AK.gold : AK.blue, t >= 4 ? 'gold' : 'tiles', 0, dy + (t >= 4 ? 18 : 8), -6)); g.add(dome(dr * 0.5, dr * 0.26, AK.snow, 'plaster', 0, dy + (t >= 4 ? 18 : 8) + dr * 0.72, -6));
    if (t >= 2) { for (let i = 0; i < 6; i++) g.add(cyl3(2.6, 2.6, h - 4, AK.marble, 'ashlar', -w * 0.4 + i * w * 0.16, 5, 24, 10)); g.add(blk(w * 0.9, 4, 10, AK.marbleD, 'ashlar', 0, 1 + h, 24)); g.add(gable(w * 0.9, 12, 10, AK.blue, 'tiles', 0, 5 + h, 24, 1)); }
    if (t >= 3) for (const s of [-1, 1]) g.add(akTower(8, h + 30, s * (w / 2 + 6), -14, { y: 5, roof: 'cone' }));
    if (t >= 4) for (const s of [-1, 1]) g.add(akTower(7, h + 14, s * (w / 2 + 6), 18, { y: 5, roof: 'onion' }));
    return g; },
  fort(t) { // fort: niski marmurowy mur z bramą; 2: mury z okrągłymi basztami pod błękitnymi dachami; 3: Cytadela Magów – wysoka biała wieża z kryształem, krąg wież i mosty
    const g = new THREE.Group(); g.add(blk(170, t === 1 ? 20 : 36, 10, AK.marble, 'ashlar', 0, 0, 34)); g.add(merlons(-84, 84, t === 1 ? 20 : 36, 34, AK.marbleD, 'ashlar'));
    g.add(blk(40, t === 1 ? 32 : 52, 16, AK.marbleD, 'ashlar', 0, 0, 36)); g.add(opening(18, 28, 0, 0, 44.5, { inner: '#2a2e3a', frame: AK.gold, frameKind: 'ashlar', bars: true, sill: false, frameW: 3 }));
    g.add(blk(44, 3, 20, AK.snow, 'plaster', 0, t === 1 ? 32 : 52, 36));
    if (t === 1) return g;
    for (const s of [-1, 1]) { g.add(akTower(14, 54, s * 92, 34, { roof: 'cone' })); g.add(akTower(9, 52, s * 22, 38, { roof: 'cone', rc: AK.blueL })); }
    if (t >= 3) { g.add(blk(100, 70, 56, AK.marble, 'ashlar', 0, 0, -30)); g.add(crenTop(100, 56, 70, AK.marbleD, 'ashlar', 0, -30)); for (let i = 0; i < 5; i++) g.add(akWin(7, 20, -40 + i * 20, 30, -1.8));
      g.add(akTower(20, 150, 0, -40, { wins: 4, roof: 'dome' })); g.add(akCrystals(0, 150 + 6 + 26, -40, 1.6, 5, 11, AK.cyan));
      for (const s of [-1, 1]) { g.add(akTower(13, 110, s * 56, -44, { wins: 3, roof: 'cone' })); g.add(akBridge(s * 20, s * 43, 96, -40)); g.add(akTower(10, 84, s * 54, -6, { roof: 'onion' })); } }
    return g; },
  guild(t) { // wieża wiedzy: okrągła wieża-biblioteka z galeriami; każdy stopień – kondygnacja z balkonem; na szczycie sfera armilarna
    const g = new THREE.Group(), fl = 22; g.add(cyl3(30, 32, 5, AK.stoneD, 'ashlar', 0, 0, -4, 18));
    for (let i = 0; i < t; i++) { const r = 20 - i * 1.8, y = 5 + i * fl; g.add(cyl3(r, r, fl, i % 2 ? AK.marble : '#dcdad4', 'ashlar', 0, y, -4, 18)); g.add(cyl3(r + 4, r + 4, 2.4, AK.marbleD, 'ashlar', 0, y + fl - 2.4, -4, 18));
      g.add(torus((r + 3.6) / PXU, 0.5 / PXU, AK.gold, 'gold', P(0, y + fl + 2.4, -4), [Math.PI / 2, 0, 0])); for (const a of [-0.6, 0, 0.6]) g.add(akWin(4, 10, Math.sin(a) * r, y + 6, -4 + Math.cos(a) * r * 0.98)); }
    const top = 5 + t * fl; g.add(dome(15 - t, 8, AK.blue, 'tiles', 0, top, -4)); g.add(akArmillary(0, top + 6, -4, 10 + t)); return g; },
  tavern() { // karczma: kamienna gospoda o stromym dachu pod grubym śniegiem, ciepłe okna, komin z dymem, sanie i drewno na opał
    const g = new THREE.Group(); g.add(blk(54, 22, 36, AK.stone, 'rubble', 0, 0, -4)); g.add(gable(60, 42, 26, '#5a4a3a', 'shingle', 0, 22, -4, 4, AK.stone, 'rubble')); g.add(gable(58, 40, 8, AK.snow, 'plaster', 0, 22 + 18, -4, 0));
    for (let i = 0; i < 3; i++) g.add(akWin(7, 9, -16 + i * 16, 8, 14.2)); g.add(door(10, 16, 0, 0, 14, '#5a3a22', AK.stoneD)); g.add(blk(9, 30, 9, AK.stoneD, 'rubble', 18, 30, -12)); marker(g, 'fx:smoke', P(18, 64, -12));
    for (let i = 0; i < 4; i++) g.add(cyl3(2, 2, 16, AK.wood, 'wood', -40, 1 + i * 3.4, 4 + (i % 2) * 2, 6).rotateX(Math.PI / 2));
    g.add(blk(16, 4, 8, AK.wood, 'planks', 36, 2, 22)); g.add(torus(4 / PXU, 0.6 / PXU, AK.gold, 'gold', P(44, 4, 22), [0, Math.PI / 2, 0], null, Math.PI)); return g; },
  market() { // targ: półokrągłe kramy pod biało-niebieskimi markizami, skrzynie z kryształami, beczki
    const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const x = -40 + i * 40; g.add(blk(30, 9, 16, AK.wood, 'planks', x, 0, 10)); for (const dx of [-13, 13]) g.add(cyl3(1.2, 1.2, 24, AK.gold, 'gold', x + dx, 0, 4, 6));
      for (let k = 0; k < 4; k++) g.add(blk(7.2, 1, 18, k % 2 ? AK.snow : AK.blueL, 'cloth', x - 11 + k * 7.4, 24, 8)); g.add(akCrystals(x, 9, 12, 0.5, 3, 20 + i)); } return g; },
  smith() { // kuźnia: kamienny łuk-wiata nad paleniskiem, kowadło, koło szlifierskie, sztaby metalu
    const g = new THREE.Group(); for (const s of [-1, 1]) g.add(blk(10, 26, 30, AK.stone, 'ashlar', s * 22, 0, -4)); g.add(torus(22 / PXU, 5 / PXU, AK.stone, 'ashlar', P(0, 26, -4), [0, 0, 0], [1, 0.5, 1], Math.PI));
    g.add(blk(54, 4, 34, AK.stoneD, 'ashlar', 0, 26, -4)); g.add(blk(50, 3, 32, AK.snow, 'plaster', 0, 30, -4)); g.add(cyl3(8, 10, 10, AK.stoneD, 'ashlar', 0, 0, -8, 12)); g.add(sph(5 / PXU, '#ff9040', 'glow', P(0, 11, -8), null, 8)); glowMark(g, 0, 12, -6, 14, '#ff9040');
    g.add(blk(12, 5, 6, '#4a4e58', 'iron', 30, 7, 20)); g.add(cyl3(4, 5, 7, AK.wood, 'wood', 30, 0, 20, 8)); const wh = cyl3(7, 7, 3, AK.stoneD, 'rock', 0, 0, 0, 16); wh.rotation.z = Math.PI / 2; wh.position.set(...P(-34, 9, 18)); g.add(wh); return g; },
  silo() { // skład: okrągły marmurowy spichlerz pod stożkowym dachem ze śniegiem, rampa i worki
    const g = new THREE.Group(); g.add(cyl3(18, 19, 34, AK.marble, 'ashlar', 0, 0, -4, 18)); for (const y of [10, 24]) g.add(torus(18.5 / PXU, 1 / PXU, AK.marbleD, 'ashlar', P(0, y, -4), [Math.PI / 2, 0, 0]));
    g.add(coneRoof(22, 18, AK.blue, 'tiles', 0, 34, -4, 18)); g.add(akSnowCap(12, 9, 0, 40, -4)); g.add(door(10, 14, 0, 0, 14.5, '#5a3a22', AK.marbleD));
    for (const [x, z] of [[-22, 16], [-28, 10], [24, 18]]) g.add(sph(5 / PXU, '#c8b890', 'cloth', P(x, 0, z), [1, 0.8, 1.2], 8)); return g; },
  special() { // Biblioteka: okrągła rotunda z przeszkloną kopułą, kolumny dookoła, wielka otwarta księga z kamienia przed wejściem
    const g = new THREE.Group(); g.add(cyl3(40, 42, 6, AK.stoneD, 'ashlar', 0, 0, -4, 24)); g.add(cyl3(28, 28, 34, AK.marble, 'ashlar', 0, 6, -4, 24));
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.add(cyl3(2.2, 2.2, 34, AK.marble, 'ashlar', Math.cos(a) * 34, 6, -4 + Math.sin(a) * 34, 10)); }
    g.add(cyl3(37, 37, 4, AK.marbleD, 'ashlar', 0, 40, -4, 24)); const gl = dome(28, 24, AK.ice, 'gem', 0, 44, -4); gl.material = gl.material.clone(); gl.material.transparent = true; gl.material.opacity = 0.75; g.add(gl);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; const rb = torus(28 / PXU, 0.8 / PXU, AK.gold, 'gold', P(0, 44, -4), [0, a, 0], [1, 0.86, 1], Math.PI); g.add(rb); }
    g.add(blk(16, 10, 8, AK.marbleD, 'ashlar', 0, 0, 40)); for (const s of [-1, 1]) { const p = blk(13, 1.6, 16, AK.snow, 'plaster', s * 7, 12, 40); p.rotation.z = s * 0.25; g.add(p); } glowMark(g, 0, 50, 0, 30, AK.cyan); return g; },
  grail() { // Podniebny Kielich: kolosalny złoty kielich na smukłej marmurowej kolumnie, z kielicha bije słup światła; wokół krąg wież i kryształów
    const g = new THREE.Group(); g.add(cyl3(80, 86, 8, AK.stoneD, 'ashlar', 0, 0, 0, 28)); g.add(cyl3(64, 70, 8, AK.marbleD, 'ashlar', 0, 8, 0, 28)); g.add(cyl3(46, 52, 8, AK.marble, 'ashlar', 0, 16, 0, 28));
    g.add(cyl3(14, 20, 120, AK.marble, 'ashlar', 0, 24, 0, 18)); for (const y of [50, 90, 130]) g.add(torus(15 / PXU, 1.8 / PXU, AK.gold, 'gold', P(0, y, 0), [Math.PI / 2, 0, 0]));
    g.add(cyl3(8, 22, 16, AK.gold, 'gold', 0, 144, 0, 20)); g.add(cyl3(38, 14, 34, AK.gold, 'gold', 0, 160, 0, 24)); g.add(torus(38 / PXU, 2.6 / PXU, AK.gold, 'gold', P(0, 194, 0), [Math.PI / 2, 0, 0]));
    const liq = cyl3(36, 36, 1, AK.cyan, 'win', 0, 192, 0, 24); liq.material = lightMat('#b0f8ff'); g.add(liq);
    const beam = cyl3(16, 26, 140, AK.cyan, 'glow', 0, 194, 0, 18); beam.material = lightMat('#c8faff'); beam.material.transparent = true; beam.material.opacity = 0.35; g.add(beam); glowMark(g, 0, 210, 0, 70, AK.cyan);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.5; g.add(akTower(8, 70 + (i % 2) * 20, Math.cos(a) * 66, Math.sin(a) * 44, { y: 0, roof: i % 2 ? 'onion' : 'cone' })); g.add(akCrystals(Math.cos(a + 0.5) * 56, 24, Math.sin(a + 0.5) * 36, 1.1, 4, 70 + i, AK.cyan)); }
    return g; },
  dw1(t) { // warsztat gremlinów: drewniana szopa z wielkimi zębatkami na ścianie i kominem; 2: większy warsztat z suwnicą; 3: pracownia inżynierów – żuraw i mechaniczne ramię
    const g = new THREE.Group(); g.add(blk(44, 20, 30, AK.wood, 'planks', 0, 0, -6)); g.add(gable(50, 36, 14, '#5a4a3a', 'shingle', 0, 20, -6, 3, AK.wood, 'planks')); g.add(gable(48, 34, 5, AK.snow, 'plaster', 0, 20 + 10, -6, 0));
    for (const [x, y, r] of [[-12, 10, 7], [2, 13, 5]]) { g.add(torus(r / PXU, 1.2 / PXU, AK.gold, 'gold', P(x, y, 9.4))); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(blk(2, 2, 1.4, AK.gold, 'gold', x + Math.cos(a) * (r + 1.4), y + Math.sin(a) * (r + 1.4), 9.6)); } }
    g.add(door(10, 14, 14, 0, 9, '#4a3020', AK.wood, 'wood')); g.add(cyl3(3, 3, 22, '#5a5a62', 'iron', -16, 24, -14, 8)); marker(g, 'fx:smoke', P(-16, 50, -14));
    if (t >= 2) { for (const s of [-1, 1]) g.add(cyl3(1.6, 1.6, 36, AK.wood, 'wood', s * 30, 0, 18, 6)); g.add(blk(64, 3, 3, '#5a5a62', 'iron', 0, 36, 18)); g.add(blk(10, 8, 8, AK.wood, 'planks', 8, 18, 18)); }
    if (t >= 3) { g.add(cyl3(2, 2, 60, '#5a5a62', 'iron', 36, 0, -18, 6)); const arm = blk(50, 2.4, 2.4, '#5a5a62', 'iron', 18, 58, -18); arm.rotation.z = -0.2; g.add(arm); g.add(blk(8, 8, 8, AK.gold, 'gold', 0, 40, -18)); }
    for (let i = 0; i < Math.min(3, t + 1); i++) g.add(creature(t >= 3 ? 'gremlinEngineer' : t >= 2 ? 'masterGremlin' : 'gremlin', -20 + i * 14, 0, 24, 0.5, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // parapet: kwadratowa wieża z balkonem-gzymsem, na narożach gargulce; 2: wyższa, drugi parapet; 3: runiczny – świecące runy na ścianach
    const g = new THREE.Group(), h = [44, 60, 70][t - 1]; g.add(blk(26, h, 26, AK.stone, 'ashlar', 0, 0, -6)); g.add(blk(36, 4, 36, AK.stoneD, 'ashlar', 0, h, -6)); g.add(merlons(-17, 17, h + 4, 11, AK.stone, 'ashlar', 6, 6, 4));
    g.add(hipRoof(22, 22, 14, AK.blue, 'tiles', 0, h + 4, -6, 2)); g.add(akSnowCap(7, 6, 0, h + 12, -6)); for (let i = 0; i < 2; i++) g.add(akWin(5, 10, -6 + i * 12, h * 0.4, 7.2));
    if (t >= 2) { g.add(blk(32, 3, 32, AK.stoneD, 'ashlar', 0, h * 0.5, -6)); }
    if (t >= 3) for (const s of [-1, 1]) { const rn = blk(3, 14, 0.6, AK.cyan, 'glow', s * 7, h * 0.6, 7.3); rn.material = lightMat('#90f8ff'); g.add(rn); }
    for (const [x, z] of t >= 2 ? [[-14, 8], [14, 8]] : [[14, 8]]) g.add(creature(t >= 3 ? 'runeGargoyle' : t >= 2 ? 'obsidianGargoyle' : 'stoneGargoyle', x, h + 4, z, 0.45, -Math.PI / 2 + 0.3));
    return g; },
  dw3(t) { // kuźnia golemów: masywna hala z wielkimi wrotami i dwoma kominami, w środku żar; 2: wielka kuźnia – kowadło-olbrzym przed wejściem; 3: kuźnia mithrilu – srebrno-błękitny blask
    const g = new THREE.Group(), glow = t >= 3 ? '#a0e0ff' : '#ff9a40'; g.add(blk(70, 34, 40, AK.stoneD, 'ashlar', 0, 0, -10)); g.add(hipRoof(76, 46, 18, '#4a5060', 'tiles', 0, 34, -10, 3)); g.add(hipRoof(70, 40, 6, AK.snow, 'plaster', 0, 34 + 12, -10, 0));
    g.add(opening(26, 26, 0, 0, 10.5, { glow, frame: AK.stone, frameKind: 'ashlar', sill: false })); glowMark(g, 0, 14, 14, 22, glow); for (const s of [-1, 1]) { g.add(blk(10, 36, 10, AK.stone, 'ashlar', s * 24, 30, -20)); marker(g, 'fx:smoke', P(s * 24, 70, -20)); }
    if (t >= 2) { g.add(blk(22, 8, 12, '#4a4e58', 'iron', -30, 10, 24)); g.add(cyl3(6, 8, 10, AK.stoneD, 'ashlar', -30, 0, 24, 10)); }
    g.add(creature(t >= 3 ? 'mithrilGolem' : t >= 2 ? 'ironGolem' : 'stoneGolem', 26, 0, 24, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw4(t) { // wieża magów: wysoka, lekko skręcona wieża z obserwatorium (kopuła z otworem i lunetą); 2: wieża arcymagów – druga wieżyczka i most; 3: akademia bitewna – dziedziniec z tarczami ćwiczebnymi
    const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const r = 14 - i * 1.6, sg = cyl3(r, r * 0.95, 26, AK.marble, 'ashlar', i * 1.6, 4 + i * 26, -8, 12); sg.rotation.y = i * 0.3; g.add(sg); g.add(akWin(4, 9, i * 1.6, 12 + i * 26, -8 + r * 0.95, AK.violet)); }
    g.add(cyl3(16, 16, 4, AK.stoneD, 'ashlar', 0, 0, -8, 12)); const tp = 4 + 4 * 26; g.add(cyl3(13, 13, 3, AK.marbleD, 'ashlar', 6, tp, -8, 14)); g.add(dome(12, 11, '#3a3a6a', 'tiles', 6, tp + 3, -8));
    const sc = cyl3(1.6, 2.4, 22, AK.gold, 'gold', 0, 0, 0, 8); sc.rotation.z = -0.9; sc.position.set(...P(14, tp + 12, -2)); g.add(sc);
    if (t >= 2) { g.add(akTower(8, 66, -34, -14, { roof: 'cone', rc: '#4a3a8a', glow: AK.violet })); g.add(akBridge(-26, -8, 64, -10, 6)); }
    if (t >= 3) for (const x of [24, 38]) { g.add(cyl3(1, 1, 14, AK.wood, 'wood', x, 0, 26, 5)); const tg = cyl3(5, 5, 1.4, '#c84040', 'cloth', 0, 0, 0, 14); tg.rotation.x = Math.PI / 2; tg.position.set(...P(x, 16, 26.5)); g.add(tg); }
    g.add(creature(t >= 3 ? 'battleMage' : t >= 2 ? 'archMage' : 'mage', 18, 0, 22, 0.5, -Math.PI / 2 + 0.3)); return g; },
  dw5(t) { // ołtarz życzeń: okrągła platforma ze schodami, krąg kolumn z łukami, pośrodku na postumencie lampa dżina; 2: złoty ołtarz – złote łuki; 3: diamentowy – kryształowa kopuła
    const g = new THREE.Group(), gc = t >= 2 ? AK.gold : AK.marbleD; g.add(cyl3(36, 38, 5, AK.stoneD, 'ashlar', 0, 0, -4, 24)); g.add(cyl3(30, 32, 5, AK.marble, 'ashlar', 0, 5, -4, 24));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(cyl3(2.2, 2.2, 30, AK.marble, 'ashlar', Math.cos(a) * 26, 10, -4 + Math.sin(a) * 26, 10)); }
    g.add(torus(26 / PXU, 2 / PXU, gc, t >= 2 ? 'gold' : 'ashlar', P(0, 41, -4), [Math.PI / 2, 0, 0])); g.add(cyl3(5, 6, 14, AK.marbleD, 'ashlar', 0, 10, -4, 12));
    g.add(sph(4 / PXU, AK.gold, 'gold', P(0, 26, -4), [1.6, 0.7, 1], 10)); g.add(cone(1 / PXU, 6 / PXU, AK.gold, 'gold', P(5, 27, -4), [0, 0, -1.2], 6)); glowMark(g, 0, 28, -4, 12, AK.cyan);
    if (t >= 3) { const cd = dome(28, 18, AK.ice, 'gem', 0, 42, -4); cd.material = cd.material.clone(); cd.material.transparent = true; cd.material.opacity = 0.6; g.add(cd); }
    g.add(creature(t >= 3 ? 'genieLord' : t >= 2 ? 'masterGenie' : 'genie', 0, 22, 4, 0.45, -Math.PI / 2 + 0.3)); return g; },
  dw6(t) { // złoty pawilon: pawilon na wodzie (zamarznięty staw) z wywiniętym, wielopiętrowym złotym dachem; 2: pałac nag – drugi poziom i schody; 3: pałac cesarzowej – trzeci dach i złote posągi
    const g = new THREE.Group(); const ice = cyl3(46, 46, 1.4, AK.ice, 'gem', 0, 0, 0, 24); ice.scale.z = 0.6; g.add(ice); g.add(blk(56, 5, 40, AK.marble, 'ashlar', 0, 0, -4));
    const lv = t + 1; for (let i = 0; i < lv; i++) { const w = 40 - i * 9, y = 5 + i * 20; for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl3(1.8, 1.8, 14, '#b02a2a', 'wood', sx * w * 0.42, y, -4 + sz * w * 0.3, 8));
      g.add(blk(w * 0.8, 14, w * 0.5, '#e8d8c0', 'plaster', 0, y, -4)); g.add(hipRoof(w + 14, w * 0.75 + 12, 7, AK.gold, 'gold', 0, y + 14, -4, 4)); g.add(hipRoof(w + 8, w * 0.75 + 6, 2.5, AK.snow, 'plaster', 0, y + 18, -4, 0)); }
    g.add(cone(1 / PXU, 14 / PXU, AK.gold, 'gold', P(0, 5 + lv * 20 + 6, -4), null, 6));
    if (t >= 3) for (const s of [-1, 1]) { g.add(blk(6, 6, 6, AK.marbleD, 'ashlar', s * 30, 5, 18)); g.add(sph(3 / PXU, AK.gold, 'gold', P(s * 30, 14, 18), [1, 1.6, 1], 8)); }
    g.add(creature(t >= 3 ? 'nagaEmpress' : t >= 2 ? 'nagaQueen' : 'naga', 22, 5, 22, 0.45, -Math.PI / 2 + 0.4)); return g; },
  dw7(t) { // chmurna świątynia: świątynia na szczycie skalnej iglicy, schody wykute w skale, wokół obłoki; 2: niebiańska – złota kopuła i druga świątynia niżej; 3: świątynia burzy – piorunochrony i błękitny blask
    const g = new THREE.Group(), H = t >= 3 ? 110 : 96; g.add(boulder(0, 0, -16, 46, '#8a8e98', 90, 0.9)); g.add(cyl3(22, 40, H, '#8a8e98', 'rock', 0, 0, -16, 10)); g.add(boulder(0, H - 10, -16, 30, '#9a9ea8', 91, 0.6));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 1.6 - 0.4, r = 38 - i * 2.2; g.add(blk(10, 3, 6, AK.marbleD, 'ashlar', Math.cos(a) * r, i * H / 8, -16 + Math.sin(a) * r * 0.5)); } /* schody */
    g.add(akTemple(44, 22, 30, 0, -16, { y: H - 4, cols: 5, roofCol: t >= 2 ? AK.gold : AK.blue })); if (t >= 2) g.add(dome(10, 9, AK.gold, 'gold', 0, H + 30, -16));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(sph((10 + (i % 3) * 3) / PXU, '#f4f6fa', 'plaster', P(Math.cos(a) * 46, H * 0.45 + (i % 2) * 14, -16 + Math.sin(a) * 26), [1.8, 0.7, 1.1], 10)); } /* obłoki wokół iglicy */
    if (t >= 3) { for (const s of [-1, 1]) g.add(cyl3(0.8, 0.8, 30, AK.gold, 'gold', s * 18, H + 26, -16, 5)); glowMark(g, 0, H + 40, -16, 40, AK.cyan); }
    g.add(creature(t >= 3 ? 'stormTitan' : t >= 2 ? 'titan' : 'giant', 40, 0, 24, 0.5, -Math.PI / 2 + 0.4)); return g; },
  ozd(t) { // ozdoby: 1 kryształy lodu, 2 para magicznych latarni, 3 posąg maga na cokole, 4 zaspa z kamieniami, 5 obelisk z runą
    const g = new THREE.Group();
    if (t === 1) g.add(akCrystals(0, 0, 0, 1.2, 6, 501, AK.ice));
    if (t === 2) for (const x of [-12, 12]) { g.add(cyl3(1, 1.4, 22, '#4a4e58', 'iron', x, 0, 0, 8)); const l = sph(2.6 / PXU, AK.cyan, 'glow', P(x, 24, 0), null, 10); l.material = lightMat('#b0f8ff'); g.add(l); glowMark(g, x, 24, 0, 8, AK.cyan); g.add(cone(3 / PXU, 3 / PXU, '#4a4e58', 'iron', P(x, 28, 0), null, 6)); }
    if (t === 3) { g.add(blk(12, 8, 12, AK.marbleD, 'ashlar', 0, 0, 0)); g.add(cone(5 / PXU, 18 / PXU, AK.marble, 'ashlar', P(0, 17, 0), null, 10)); g.add(sph(3 / PXU, AK.marble, 'ashlar', P(0, 28, 0), null, 10)); g.add(cone(3.4 / PXU, 6 / PXU, AK.marble, 'ashlar', P(0, 32, 0), null, 8)); g.add(blk(8, 3, 4, AK.snow, 'plaster', 0, 8, 0)); }
    if (t === 4) { g.add(sph(14 / PXU, AK.snow, 'plaster', P(0, 0, 0), [1.6, 0.45, 1], 12)); g.add(boulder(-8, 0, -2, 6, AK.stone, 504, 0.7)); g.add(boulder(9, 0, 1, 5, AK.stone, 505, 0.7)); }
    if (t === 5) { g.add(blk(10, 4, 10, AK.stoneD, 'ashlar', 0, 0, 0)); const o = cyl3(2.6, 3.6, 30, AK.marble, 'ashlar', 0, 4, 0, 4); o.rotation.y = Math.PI / 4; g.add(o); g.add(cone(2.6 / PXU, 6 / PXU, AK.gold, 'gold', P(0, 37, 0), [0, Math.PI / 4, 0], 4)); const rn = blk(2, 9, 0.6, AK.cyan, 'glow', 0, 16, 2.6); rn.material = lightMat('#90f8ff'); g.add(rn); }
    return g; },
};
TOWN3.academy = ACADEMY3;
