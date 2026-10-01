// Budowle Kurhanu (nekropolia) w 3D: gotyckie krypty i wieże z ciemnego kamienia, kości, kute żelazo, zielonkawy blask dusz i fiolet magii.
// Te same zasady co budowle.js / budowle-knieja.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.barrow = { hall(t), fort(t), … }.
'use strict';
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, hipRoof, coneRoof, mast, glowMark, creature, merlons, crenTop, ringMerlons, lightMat, boulder, menhir */
const BR = { stone: '#5e5a68', stoneD: '#3e3a48', stoneL: '#848090', bone: '#dcd2b6', boneD: '#a89c80', iron: '#34343c', roof: '#2c2836', slate: '#3a3646',
  soul: '#8affc8', violet: '#a070f0', moss: '#4e5a3e', wood: '#4a3a2e', dirt: '#4a4038', blood: '#7a1a26', cloth: '#3a2a44', gold: '#b89a50' };
// --- drobne bryły ---
const spire3 = (x, y, z, r, h, col = BR.roof) => { const g = new THREE.Group(); g.add(coneRoof(r, h, col, 'tiles', x, y, z, 8)); g.add(sph(1.6 / PXU, BR.iron, 'iron', P(x, y + h + 1, z), null, 6)); g.add(cyl3(0.5, 0.5, 8, BR.iron, 'iron', x, y + h, z, 4)); return g; };
const soulWin = (w, h, x, y, z, glow = BR.soul) => opening(w, h, x, y, z, { glow, frame: BR.stoneD, frameKind: 'ashlar' });
function tomb(x, z, s = 1, seed = 1) { const R = rng(seed), g = new THREE.Group(), lean = (R() - 0.5) * 0.3;
  if (R() < 0.6) { const b = blk(8 * s, 12 * s, 2.5 * s, BR.stoneL, 'ashlar', x, 0, z); b.rotation.z = lean; g.add(b); const t = cyl3(4 * s, 4 * s, 2.5 * s, BR.stoneL, 'ashlar', 0, 0, 0, 12); t.rotation.x = Math.PI / 2; t.position.set(...P(x - Math.sin(lean) * 12 * s, 12 * s, z - 1.25 * s)); g.add(t); }
  else { g.add(blk(2.2 * s, 16 * s, 2.2 * s, BR.stoneL, 'ashlar', x, 0, z)); g.add(blk(9 * s, 2.2 * s, 2.2 * s, BR.stoneL, 'ashlar', x, 10 * s, z)); }
  return g; }
function skulls(x, z, w, n = 8, seed = 3, y = 0) { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < n; i++) { const px = x + (R() - 0.5) * w, pz = z + (R() - 0.5) * w * 0.5, py = y + (i % 3) * 2.2;
  g.add(sph(2.2 / PXU, BR.bone, 'bone', P(px, py + 2, pz), [1, 0.95, 1.1], 8)); for (const s of [-1, 1]) g.add(sph(0.6 / PXU, '#141018', 'skin', P(px + s * 0.8, py + 2.3, pz + 1.9), null, 5)); } return g; }
function ironFence(x0, x1, z, h = 14) { const g = new THREE.Group(); for (let x = x0; x <= x1; x += 5) { g.add(cyl3(0.5, 0.5, h, BR.iron, 'iron', x, 0, z, 5)); g.add(cone(0.9 / PXU, 3 / PXU, BR.iron, 'iron', P(x, h + 1.5, z), null, 5)); }
  g.add(blk(x1 - x0, 1, 1, BR.iron, 'iron', (x0 + x1) / 2, h * 0.85, z)); g.add(blk(x1 - x0, 1, 1, BR.iron, 'iron', (x0 + x1) / 2, h * 0.25, z)); return g; }
const wisps = (g, x, y, z, w, h, n = 6, seed = 7, col = BR.soul) => { const R = rng(seed); for (let i = 0; i < n; i++) { const px = x + (R() - 0.5) * w, py = y + R() * h, pz = z + (R() - 0.5) * w * 0.4; g.add(sph((1.2 + R()) / PXU, col, 'glow', P(px, py, pz), [1, 1.6, 1], 6)); } glowMark(g, x, y + h / 2, z, w * 0.4, col); };
const brazier = (x, y, z, col = BR.soul) => { const g = new THREE.Group(); g.add(cyl3(3, 1.5, 5, BR.iron, 'iron', x, y, z, 8)); g.add(cyl3(0.8, 0.8, y, BR.iron, 'iron', x, 0, z, 5)); g.add(cone(2.4 / PXU, 7 / PXU, col, 'glow', P(x, y + 8, z), null, 7)); glowMark(g, x, y + 7, z, 9, col); return g; };
// Gotycki dom z kamienia: ściany, stromy łupkowy dach, ostrołukowe okna z blaskiem, przypory
function gothicHall(w, h, d, x, z, { roofH = h * 0.9, wins = 2, glow = BR.soul, col = BR.stone, y = 0, door: dr = true } = {}) {
  const g = new THREE.Group(); g.add(blk(w, h, d, col, 'ashlar', x, y, z)); g.add(blk(w + 3, 5, d + 3, DK(col, 0.15), 'ashlar', x, y, z));
  g.add(gable(w + 4, d + 4, roofH, BR.roof, 'tiles', x, y + h, z, 3, col, 'ashlar'));
  for (let i = 0; i < wins; i++) { const wx = x - w / 2 + (i + 0.5) * w / wins; if (dr && Math.abs(wx - x) < w * 0.16 && wins % 2) continue; g.add(soulWin(Math.min(9, w / wins * 0.4), h * 0.42, wx, y + h * 0.36, z + d / 2, glow)); }
  for (const s of [-1, 1]) { const b = blk(5, h * 0.8, 8, DK(col, 0.1), 'ashlar', x + s * (w / 2 + 1), y, z + d / 2 - 4); g.add(b); }
  if (dr) g.add(door(Math.min(16, w * 0.24), Math.min(26, h * 0.6), x, y, z + d / 2, '#2a2024', BR.stoneD));
  return g; }
function gothicTower(r, h, x, z, { spire = r * 2.6, col = BR.stone, glow = BR.soul, y = 0, wins = 2 } = {}) {
  const g = new THREE.Group(); g.add(cyl3(r, r * 0.92, h, col, 'ashlar', x, y, z, 12)); g.add(cyl3(r + 1.5, r + 1.5, 5, DK(col, 0.15), 'ashlar', x, y, z, 12));
  for (let i = 0; i < wins; i++) g.add(soulWin(r * 0.5, r * 0.9, x, y + h * (0.3 + 0.55 * i / Math.max(1, wins)), z + r * 0.92, glow));
  g.add(ringMerlons(r * 0.95, y + h, col, 'ashlar', x, z, 8)); g.add(spire3(x, y + h + 4, z, r * 0.85, spire)); return g; }
function obelisk(x, z, w, h, col = BR.stoneD, rune = BR.violet) { const g = new THREE.Group(); g.add(blk(w * 1.6, 4, w * 1.6, BR.stone, 'ashlar', x, 0, z)); const o = cyl3(w * 0.42, w * 0.62, h, col, 'ashlar', x, 4, z, 4); o.rotation.y = Math.PI / 4; g.add(o);
  g.add(cone(w * 0.44 / PXU, w * 0.9 / PXU, col, 'stone', P(x, h + 4 + w * 0.45, z), [0, Math.PI / 4, 0], 4)); for (let i = 0; i < 3; i++) g.add(blk(w * 0.3, 3, 0.6, rune, 'glow', x, 12 + i * h * 0.25, z + w * 0.5)); return g; }
const flagB = (x, y, z) => { const g = new THREE.Group(); g.add(mast(x, y, z, 30, BR.iron)); const f = blk(10, 18, 0.6, BR.cloth, 'cloth', x + 5.5, y + 12, z); g.add(f); g.add(blk(10, 2, 0.8, BR.violet, 'cloth', x + 5.5, y + 12, z)); return g; };

const BARROW3 = {
  hall(t) { // ratusz: mauzoleum; 2: większe z kolumnadą; 3: gotycka sala z wieżą; 4: Czarna Cytadela Rady – sala z dwiema iglicami i rozetą dusz
    const g = new THREE.Group(), w = [54, 70, 84, 96][t - 1], h = [30, 38, 46, 54][t - 1];
    g.add(blk(w + 16, 5, 60, BR.stoneD, 'ashlar', 0, 0, 0)); g.add(blk(w + 8, 3, 54, BR.stone, 'ashlar', 0, 5, 0));
    g.add(gothicHall(w, h, 44, 0, -2, { y: 8, wins: t >= 3 ? 5 : 3 }));
    if (t >= 2) for (let i = 0; i < 4; i++) { const x = -w / 2 + 8 + i * (w - 16) / 3; g.add(cyl3(3, 3, h - 4, BR.stoneL, 'ashlar', x, 8, 26, 10)); } /* kolumnada przed wejściem */
    if (t >= 2) g.add(blk(w, 4, 10, BR.stone, 'ashlar', 0, 8 + h - 4, 26));
    if (t >= 3) g.add(gothicTower(13, h + 40, 0, -20, { y: 8, spire: 44, wins: 3 }));
    if (t >= 4) { for (const s of [-1, 1]) g.add(gothicTower(9, h + 18, s * (w / 2 + 6), -6, { y: 8, spire: 34 })); const ro = torus(9 / PXU, 1.4 / PXU, BR.stoneD, 'ashlar', P(0, 8 + h + 26, 2 + 24)); g.add(ro); const rc = cyl3(8, 8, 1, BR.soul, 'glow', 0, 0, 0, 20); rc.rotation.x = Math.PI / 2; rc.position.set(...P(0, 8 + h + 26, 25.6)); g.add(rc); glowMark(g, 0, 8 + h + 26, 28, 14, BR.soul); }
    for (const s of [-1, 1]) g.add(brazier(s * (w / 2 + 12), 14, 26));
    return g; },
  fort(t) { // fort: ogrodzenie z kutego żelaza i brama z kości; 2: kamienne mury z basztami; 3: Twierdza Nocy – wysoki gotycki zamek z wieżami i zielonymi oknami
    const g = new THREE.Group();
    if (t === 1) { g.add(ironFence(-80, -18, 30)); g.add(ironFence(18, 80, 30)); for (const s of [-1, 1]) { g.add(blk(10, 34, 10, BR.stoneD, 'ashlar', s * 14, 0, 30)); g.add(skulls(s * 14, 30, 4, 1, 5 + s, 34)); }
      const a = torus(14 / PXU, 2.6 / PXU, BR.bone, 'bone', P(0, 30, 30), null, null, Math.PI); g.add(a); return g; }
    g.add(blk(170, 40, 10, BR.stone, 'ashlar', 0, 0, 34)); g.add(merlons(-84, 84, 40, 34, BR.stone, 'ashlar'));
    g.add(blk(40, 52, 16, BR.stoneD, 'ashlar', 0, 0, 36)); g.add(crenTop(40, 16, 52, BR.stoneD, 'ashlar', 0, 36)); g.add(opening(20, 30, 0, 0, 44.5, { inner: '#0e0a10', frame: BR.stoneD, frameKind: 'ashlar', bars: true, sill: false, frameW: 3 }));
    for (const s of [-1, 1]) g.add(gothicTower(15, 66, s * 90, 34, { spire: 30 }));
    for (const s of [-1, 1]) g.add(flagB(s * 20, 52, 36));
    if (t >= 3) { g.add(blk(110, 80, 60, BR.stone, 'ashlar', 0, 0, -30)); g.add(crenTop(110, 60, 80, BR.stone, 'ashlar', 0, -30)); for (let i = 0; i < 5; i++) g.add(soulWin(8, 22, -44 + i * 22, 36, 0.2));
      g.add(gothicTower(22, 140, 0, -40, { spire: 70, wins: 4 })); for (const s of [-1, 1]) { g.add(gothicTower(14, 104, s * 52, -40, { spire: 44, wins: 3 })); g.add(gothicTower(11, 90, s * 52, -2, { spire: 36 })); } wisps(g, 0, 150, -40, 60, 60, 8, 21); }
    return g; },
  guild(t) { // gildia nekromantów: czarny obelisk-wieża; każdy stopień wyżej, z fioletowymi kręgami mocy i księgą
    const g = new THREE.Group(), H = 40 + t * 22;
    g.add(blk(56, 5, 56, BR.stoneD, 'ashlar', 0, 0, 0)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(obelisk(Math.cos(a) * 24, Math.sin(a) * 14, 4, 14 + (i % 2) * 6)); }
    g.add(cyl3(13, 9, H, BR.stoneD, 'ashlar', 0, 5, -4, 6)); g.add(spire3(0, H + 5, -4, 11, 26, BR.slate));
    for (let i = 0; i < t; i++) { const y = 18 + i * (H - 20) / Math.max(1, t - 1); g.add(torus(17 / PXU, 1 / PXU, BR.violet, 'glow', P(0, y, -4), [Math.PI / 2, 0, 0])); g.add(soulWin(5, 8, 0, y - 5, 6, BR.violet)); }
    g.add(sph(5 / PXU, BR.violet, 'glow', P(0, H + 40, -4), null, 12)); glowMark(g, 0, H + 40, -4, 16, BR.violet); return g; },
  tavern() { // karczma: krzywy dom z ciemnych desek, wisząca latarnia, beczki, nagrobki obok
    const g = new THREE.Group(); g.add(gothicHall(54, 30, 38, 0, 0, { col: '#5a4e48', roofH: 30, wins: 3 })); g.add(blk(10, 30, 10, BR.stoneD, 'rubble', 22, 30, -6)); /* komin */
    g.add(mast(-34, 0, 22, 34, BR.iron)); g.add(blk(14, 1, 1, BR.iron, 'iron', -28, 32, 22)); g.add(sph(2.4 / PXU, '#ffb060', 'glow', P(-22, 26, 22), null, 8)); glowMark(g, -22, 26, 22, 8, '#ffb060');
    for (const [x, z] of [[30, 26], [36, 18]]) g.add(cyl3(5, 5, 10, BR.wood, 'wood', x, 0, z, 10)); for (let i = 0; i < 3; i++) g.add(tomb(-44 + i * 8, -8 + i * 6, 0.8, 30 + i));
    marker(g, 'fx:smoke', P(22, 64, -6)); return g; },
  market() { // targ: kramy pod czarnym płótnem, kosze kości, waga, kruki
    const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const x = -40 + i * 40; for (const dx of [-14, 14]) g.add(cyl3(1.3, 1.3, 26, BR.iron, 'iron', x + dx, 0, 6, 6)); g.add(blk(32, 8, 18, BR.wood, 'planks', x, 0, 10));
      const roof = gable(34, 22, 8, i % 2 ? BR.cloth : '#4a3040', 'cloth', x, 26, 6, 2); g.add(roof); g.add(skulls(x, 10, 16, 3, 40 + i, 8)); } return g; },
  smith() { // kuźnia: kamienna kuźnia z zielonym paleniskiem, kowadło, łańcuchy
    const g = new THREE.Group(); g.add(gothicHall(48, 26, 36, 0, -4, { col: BR.stoneD, roofH: 22, wins: 1, door: false }));
    g.add(opening(22, 16, 0, 0, 14.5, { inner: '#0a1a10', frame: BR.iron, frameKind: 'iron', sill: false })); const f = blk(16, 7, 3, BR.soul, 'win', 0, 2, 13); f.material = lightMat('#7affb0'); g.add(f); glowMark(g, 0, 8, 18, 16, BR.soul);
    g.add(blk(10, 30, 10, BR.stone, 'rubble', 16, 26, -10)); g.add(blk(14, 5, 7, BR.iron, 'iron', 32, 7, 20)); g.add(cyl3(4, 5, 7, BR.stoneD, 'ashlar', 32, 0, 20, 8)); marker(g, 'fx:smoke', P(16, 60, -10)); return g; },
  silo() { // skład: kamienna szopa z trumnami i skrzyniami
    const g = new THREE.Group(); g.add(blk(42, 22, 30, BR.stone, 'rubble', 0, 0, 0)); g.add(gable(46, 34, 16, BR.roof, 'tiles', 0, 22, 0, 3, BR.stone, 'rubble')); g.add(door(12, 16, 0, 0, 15, '#2a2024', BR.stoneD));
    for (let i = 0; i < 3; i++) { const c = blk(7, 3, 18, BR.wood, 'planks', -30 + i * 2, i * 3.2, 14 - i * 2); c.rotation.y = 0.3; g.add(c); } return g; },
  special() { // Wzmacniacz nekromancji: czarny pylon na kręgu run, wokół wir dusz
    const g = new THREE.Group(); g.add(cyl3(30, 32, 5, BR.stoneD, 'ashlar', 0, 0, 0, 24)); g.add(torus(26 / PXU, 1 / PXU, BR.soul, 'glow', P(0, 5.5, 0), [Math.PI / 2, 0, 0]));
    g.add(obelisk(0, 0, 12, 56, BR.stoneD, BR.soul)); for (let i = 0; i < 3; i++) g.add(torus((14 + i * 5) / PXU, 0.7 / PXU, BR.soul, 'glow', P(0, 26 + i * 14, 0), [Math.PI / 2 + 0.3 * (i - 1), 0, 0.2 * i]));
    wisps(g, 0, 10, 0, 50, 60, 10, 33); return g; },
  grail() { // Więzienie Dusz: kolosalna czarna cytadela-klatka z wielką czaszką u podstawy, kolce, wieżyce i słup uwięzionych dusz bijący w niebo
    const g = new THREE.Group(); g.add(cyl3(74, 82, 10, BR.stoneD, 'ashlar', 0, 0, 0, 10)); g.add(cyl3(64, 70, 10, BR.stone, 'ashlar', 0, 10, 0, 10));
    const sk = sph(40 / PXU, BR.bone, 'bone', P(0, 52, 18), [1.1, 0.95, 1], 24); g.add(sk); for (const s of [-1, 1]) g.add(sph(13 / PXU, '#06080a', 'skin', P(s * 15, 56, 47), [1, 1.15, 0.7], 14)); /* głębokie oczodoły */
    for (const s of [-1, 1]) g.add(sph(2.6 / PXU, BR.soul, 'glow', P(s * 15, 55, 53), null, 8)); g.add(blk(34, 12, 20, BR.boneD, 'bone', 0, 22, 40)); for (let i = 0; i < 6; i++) g.add(blk(4, 7, 3, BR.bone, 'bone', -12.5 + i * 5, 28, 50));
    g.add(cyl3(26, 20, 150, BR.stoneD, 'ashlar', 0, 20, -24, 8)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = cyl3(2, 1, 170, BR.iron, 'iron', Math.cos(a) * 34, 20, -24 + Math.sin(a) * 34, 5); g.add(b); }
    for (let i = 0; i < 4; i++) g.add(torus(34 / PXU, 2 / PXU, BR.iron, 'iron', P(0, 40 + i * 44, -24), [Math.PI / 2, 0, 0], null));
    const beam = cyl3(5, 9, 190, BR.soul, 'glow', 0, 30, -24, 12); beam.material = lightMat('#5ad890'); beam.material.transparent = true; beam.material.opacity = 0.4; g.add(beam); glowMark(g, 0, 140, -24, 50, BR.soul);
    for (const s of [-1, 1]) for (const k of [0, 1]) g.add(gothicTower(10, 70 + k * 30, s * (52 - k * 14), -6 - k * 30, { spire: 40, y: 20 }));
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(cone(4 / PXU, 26 / PXU, BR.bone, 'bone', P(Math.cos(a) * 70, 30, Math.sin(a) * 70 * 0.6), [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4], 6)); }
    wisps(g, 0, 60, -24, 110, 160, 18, 77); return g; },
  dw1(t) { // kostnica: niska krypta, stosy czaszek, kościotrup; 2: ossuarium – kopuła z kości i kolumny; 3: legion – brama z kości, sztandary, trzy kościotrupy
    const g = new THREE.Group(); g.add(gothicHall(46, 22, 32, 0, -6, { roofH: 18, wins: 1 })); g.add(skulls(-30, 12, 20, 10, 51)); g.add(skulls(30, 12, 16, 7, 52));
    if (t >= 2) { g.add(cyl3(16, 16, 8, BR.boneD, 'bone', 0, 22, -6, 16)); g.add(sph(16 / PXU, BR.bone, 'bone', P(0, 30, -6), [1, 0.7, 1], 16)); for (const s of [-1, 1]) g.add(cyl3(2.5, 2.5, 22, BR.bone, 'bone', s * 18, 0, 14, 8)); }
    if (t >= 3) { g.add(torus(16 / PXU, 3 / PXU, BR.bone, 'bone', P(0, 0, 26), null, null, Math.PI)); for (const s of [-1, 1]) g.add(flagB(s * 30, 0, 22)); }
    for (let i = 0; i < (t >= 3 ? 3 : 1); i++) g.add(creature(t >= 2 ? 'boneGuard' : 'boneWarrior', -18 + i * 18, 0, 28, 0.55, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // cmentarz: groby, rozkopane mogiły, płot, ghul; 2: morowy – zielona mgła i trupie światła; 3: kostnica zarazy z kapliczką
    const g = new THREE.Group(), R = rng(60); g.add(blk(110, 1.2, 60, BR.dirt, 'cobble', 0, 0, 0)); g.add(ironFence(-55, 55, 30, 10));
    for (let i = 0; i < 9; i++) { const x = -44 + (i % 5) * 22 + (R() - 0.5) * 6, z = -20 + Math.floor(i / 5) * 24; g.add(tomb(x, z, 1, 61 + i)); if (i % 3 === 0) g.add(blk(10, 2, 16, '#2a2420', 'cobble', x, 0.4, z + 10)); }
    g.add(creature('ghoul', 10, 0, 18, 0.55, -Math.PI / 2 + 0.3));
    if (t >= 2) { wisps(g, 0, 4, 0, 100, 20, 10, 62, '#a0ff70'); for (const x of [-50, 50]) g.add(brazier(x, 16, 26, '#a0ff70')); }
    if (t >= 3) { g.add(gothicHall(30, 26, 24, 0, -30, { roofH: 22, wins: 1, glow: '#a0ff70' })); g.add(spire3(0, 50, -30, 6, 18)); }
    return g; },
  dw3(t) { // nawiedzona kaplica: kaplica z dzwonnicą i zjawą; 2: wieża zawodzenia – wysoka wieża z rozbitym dachem; 3: kaplica upiorów z wirem dusz
    const g = new THREE.Group(); g.add(gothicHall(40, 32, 50, 0, 0, { roofH: 30, wins: 3 })); g.add(gothicTower(9, 44, 0, -30, { spire: t >= 2 ? 30 : 20 }));
    g.add(creature(t >= 2 ? 'banshee' : 'wraith', 26, 10, 26, 0.6, -Math.PI / 2));
    if (t >= 2) g.add(gothicTower(11, 80, -30, -14, { spire: 38, wins: 3, glow: '#c0e8ff' }));
    if (t >= 3) wisps(g, 0, 40, 0, 80, 80, 14, 71, '#c0e8ff');
    return g; },
  dw4(t) { // krypta: wejście w kopiec ze schodami w dół, kolumny, wampir; 2: mroczna krypta – mauzoleum z kopułą; 3: grobowiec nosferatu z czerwonym blaskiem i iglicami
    const g = new THREE.Group(); g.add(boulder(0, 0, -16, 54, '#4a4a3e', 80, 0.5)); g.add(blk(36, 30, 20, BR.stone, 'ashlar', 0, 0, 18)); g.add(gable(40, 24, 14, BR.roof, 'tiles', 0, 30, 18, 2, BR.stone, 'ashlar'));
    g.add(opening(16, 22, 0, 0, 28.5, { inner: '#0a0608', frame: BR.stoneD, frameKind: 'ashlar', sill: false })); for (const s of [-1, 1]) g.add(cyl3(3, 3, 30, BR.stoneL, 'ashlar', s * 15, 0, 30, 10));
    g.add(creature(t >= 2 ? 'vampireLord' : 'vampire', -30, 0, 30, 0.55, -Math.PI / 2 + 0.5));
    if (t >= 2) { g.add(cyl3(18, 20, 22, BR.stone, 'ashlar', 0, 26, -18, 16)); g.add(sph(18 / PXU, BR.slate, 'tiles', P(0, 48, -18), [1, 0.8, 1], 16)); g.add(spire3(0, 60, -18, 3, 14)); }
    if (t >= 3) { for (const s of [-1, 1]) g.add(gothicTower(8, 60, s * 34, -10, { spire: 30, glow: '#ff4050' })); g.add(sph(3 / PXU, '#ff3040', 'glow', P(0, 14, 29), null, 8)); glowMark(g, 0, 14, 30, 14, '#ff3040'); }
    return g; },
  dw5(t) { // wieża nekromanty: smukła wieża z balkonem i księgą; 2: czarna biblioteka – skrzydło z regałami i fioletowe okna; 3: licz – pływające kryształy i krąg run
    const g = new THREE.Group(); g.add(gothicTower(14, 96 + (t - 1) * 14, 0, -6, { spire: 42, wins: 4, glow: BR.violet }));
    g.add(cyl3(19, 19, 3, BR.stoneD, 'ashlar', 0, 58, -6, 16)); g.add(creature(t >= 3 ? 'lich' : t >= 2 ? 'archNecro' : 'necromancer', 22, 0, 22, 0.55, -Math.PI / 2 + 0.3));
    if (t >= 2) g.add(gothicHall(44, 34, 30, -38, 0, { roofH: 24, wins: 3, glow: BR.violet }));
    if (t >= 3) { g.add(torus(30 / PXU, 1.2 / PXU, BR.violet, 'glow', P(0, 4, -6), [Math.PI / 2, 0, 0])); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; g.add(cone(3 / PXU, 10 / PXU, BR.violet, 'glow', P(Math.cos(a) * 26, 120, -6 + Math.sin(a) * 18), [Math.PI, 0, 0], 4)); } }
    return g; },
  dw6(t) { // mroczne stajnie: długa stajnia z czarnymi końmi i żelaznymi wrotami; 2: stajnie zagłady – wieżyczki i ogień; 3: zbrojownia Otchłani – sztandary i rycerz
    const g = new THREE.Group(); g.add(gothicHall(96, 28, 34, 0, -8, { roofH: 22, wins: 4, door: false })); for (let i = 0; i < 3; i++) g.add(opening(16, 20, -32 + i * 32, 0, 9.2, { inner: '#0c080a', frame: BR.iron, frameKind: 'iron', sill: false, bars: true }));
    g.add(ironFence(-56, 56, 30, 12)); g.add(creature(t >= 3 ? 'abyssKnight' : t >= 2 ? 'dreadLord' : 'doomKnight', 0, 0, 22, 0.5, -Math.PI / 2 + 0.4));
    if (t >= 2) for (const s of [-1, 1]) { g.add(gothicTower(9, 50, s * 54, -12, { spire: 26 })); g.add(brazier(s * 40, 16, 26, '#ff7a30')); }
    if (t >= 3) for (const s of [-1, 1]) g.add(flagB(s * 22, 50, -8));
    return g; },
  dw7(t) { // kościana grań: skalna grań z wielkimi żebrami i czaszką, wywern; 2: upiorna grań – zielone dusze i mgła; 3: legowisko kościanego smoka – większa grań, smok na szczycie
    const g = new THREE.Group(), k = t >= 3 ? 1.25 : 1; g.add(boulder(0, 0, -20, 74 * k, '#4e4c56', 90, 0.62)); g.add(boulder(-50 * k, 0, 0, 34 * k, '#56545e', 91, 0.7));
    for (let i = 0; i < 6; i++) { const x = -40 + i * 16; const rb = torus(26 * k / PXU, 2.4 / PXU, BR.bone, 'bone', P(x * k, 0, 24), [0, Math.PI / 2, 0], null, Math.PI); g.add(rb); } /* żebra olbrzyma */
    g.add(sph(18 * k / PXU, BR.bone, 'bone', P(46 * k, 16, 20), [1.3, 0.9, 1], 14)); for (const s of [-1, 1]) g.add(sph(4 / PXU, '#0a0a0e', 'skin', P(46 * k + s * 7, 20, 34), null, 6));
    g.add(creature(t >= 3 ? 'boneDragon' : t >= 2 ? 'ghostWyvern' : 'boneWyvern', 0, 52 * k, -14, t >= 3 ? 0.55 : 0.6, -Math.PI / 2 + 0.4));
    if (t >= 2) wisps(g, 0, 20, 0, 120, 60, 12, 92);
    return g; },
};
TOWN3.barrow = BARROW3;
