// Budowle Twierdzy (bagienna warownia) w 3D: chaty na palach pod trzcinowymi strzechami, palisady z zaostrzonych pni,
// gliniano-kamienne piramidy schodkowe, totemy z rogami, bagienne oczka, pochodnie i zielonkawy blask wiedźm.
// Te same zasady co budowle-kurhan.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.fortress = { hall(t), fort(t), … }.
'use strict';
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, coneRoof, mast, glowMark, creature, lightMat, boulder, water */
const FT = { mud: '#7a6648', mudD: '#5a4a34', log: '#6e4e30', logD: '#4a3420', reed: '#b49c5c', reedD: '#8a7444', stone: '#7e7a64', stoneD: '#5a5846',
  moss: '#5e7a3a', bog: '#2e3e2a', bone: '#dcd0aa', hide: '#a07c52', red: '#9a3a26', glow: '#c8f060', fire: '#ffa040', teal: '#5ae0c0', gold: '#c8a048' };
// --- drobne bryły ---
const twTorch = (x, y, z) => { const g = new THREE.Group(); g.add(cyl3(1.1, 0.9, y, FT.logD, 'wood', x, 0, z, 6)); g.add(cyl3(2.4, 1.4, 4, FT.logD, 'wood', x, y, z, 7));
  g.add(cone(2.2 / PXU, 7 / PXU, FT.fire, 'glow', P(x, y + 7, z), null, 7)); glowMark(g, x, y + 6, z, 9, FT.fire); return g; };
function twPalisade(x0, x1, z, h = 26, seed = 1) { const g = new THREE.Group(), R = rng(seed);
  for (let x = x0; x <= x1; x += 5.2) { const hh = h * (0.88 + R() * 0.2); g.add(cyl3(2.6, 2.6, hh, R() < 0.5 ? FT.log : FT.logD, 'bark', x, 0, z, 7)); g.add(cone(2.6 / PXU, 6 / PXU, FT.logD, 'wood', P(x, hh + 3, z), null, 7)); }
  g.add(blk(x1 - x0 + 4, 2, 2, FT.logD, 'wood', (x0 + x1) / 2, h * 0.7, z + 2.6)); return g; }
// Okrągła chata z gliny pod stożkową strzechą (opcjonalnie na palach)
function twHut(r, h, x, z, { y = 0, roofH = r * 1.3, col = FT.mud, roof = FT.reed, glow = null, dr = true } = {}) {
  const g = new THREE.Group(); g.add(cyl3(r, r * 1.04, h, col, 'plaster', x, y, z, 16)); g.add(coneRoof(r * 1.32, roofH, roof, 'thatch', x, y + h, z, 14));
  if (dr) g.add(opening(r * 0.55, h * 0.75, x, y, z + r * 0.96, { inner: '#1a120a', frame: FT.logD, sill: false }));
  if (glow) for (const s of [-1, 1]) g.add(opening(r * 0.28, h * 0.32, x + s * r * 0.62, y + h * 0.42, z + r * 0.78, { glow, frame: FT.logD }));
  return g; }
// Pomost na palach (nad bagnem): słupy, deski, drabina
function twStilts(w, d, h, x, z) { const g = new THREE.Group(); for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const k of [0, 1]) g.add(cyl3(2, 2, h, FT.logD, 'bark', x + sx * (w / 2 - 3) * (k ? 0.3 : 1), 0, z + sz * (d / 2 - 3), 6));
  g.add(blk(w, 3, d, FT.log, 'planks', x, h, z)); for (let i = 0; i < 4; i++) g.add(blk(10, 1.2, 1.2, FT.logD, 'wood', x + w / 2 - 8, h * (0.2 + i * 0.22), z + d / 2 + 4)); return g; }
// Dom długi: ściany z bierwion, dwuspadowa strzecha zjeżdżająca nisko, rogi na szczycie
function twLodge(w, h, d, x, z, { y = 0, roofH = h * 1.1, glow = FT.fire, wins = 2, dr = true, horns = true } = {}) {
  const g = new THREE.Group(); g.add(blk(w, h, d, FT.log, 'planks', x, y, z)); g.add(gable(w + 8, d + 10, roofH, FT.reed, 'thatch', x, y + h, z, 5, FT.mud, 'plaster'));
  for (let i = 0; i < wins; i++) { const wx = x - w / 2 + (i + 0.5) * w / wins; if (dr && Math.abs(wx - x) < w * 0.18) continue; g.add(opening(Math.min(8, w / wins * 0.35), h * 0.38, wx, y + h * 0.36, z + d / 2, { glow, frame: FT.logD })); }
  if (dr) g.add(door(Math.min(14, w * 0.24), Math.min(22, h * 0.68), x, y, z + d / 2, '#3a2414', FT.logD, 'wood'));
  if (horns) twHorns(g, x, y + h + roofH - 2, z + d / 2 + 5, Math.min(1.4, w / 50));
  return g; }
function twHorns(g, x, y, z, s = 1) { g.add(sph(4.5 * s / PXU, FT.bone, 'bone', P(x, y, z), [1, 0.9, 1.2], 10));
  for (const k of [-1, 1]) { const h = torus(9 * s / PXU, 1.5 * s / PXU, FT.bone, 'bone', P(x + k * 8 * s, y + 2 * s, z), [0, 0, k > 0 ? 0 : Math.PI], null, Math.PI * 0.7); g.add(h); } }
// Totem: rzeźbiony pal z twarzami, rogami i skrzydłami
function twTotem(x, z, h, seed = 1, col = FT.log) { const g = new THREE.Group(), R = rng(seed), n = Math.max(2, Math.round(h / 16)); g.add(cyl3(3.6, 4.2, h, col, 'wood', x, 0, z, 8));
  for (let i = 0; i < n; i++) { const y = 6 + i * (h - 10) / n, c = [FT.red, FT.teal, FT.gold][(i + seed) % 3]; g.add(blk(8.4, 3, 1.4, c, 'wood', x, y + 6, z + 3.8)); for (const s of [-1, 1]) g.add(blk(1.8, 1.8, 1.2, '#f0e8c0', 'wood', x + s * 2, y + 9, z + 4.4)); g.add(blk(4, 2, 1.2, '#2a1a10', 'wood', x, y + 2, z + 4.2)); }
  g.add(blk(22, 3, 3, FT.logD, 'wood', x, h - 6, z)); for (const s of [-1, 1]) g.add(blk(9, 7, 1, R() < 0.5 ? FT.red : FT.teal, 'wood', x + s * 13, h - 10, z));
  twHorns(g, x, h + 3, z + 1, 0.8); return g; }
function twReeds(x, z, w, n = 12, seed = 5, h = 18) { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < n; i++) { const hh = h * (0.6 + R() * 0.6), px = x + (R() - 0.5) * w, pz = z + (R() - 0.5) * w * 0.5;
  g.add(cone(0.9 / PXU, hh / PXU, R() < 0.5 ? FT.moss : '#7a8a4a', 'leaves', P(px, hh / 2, pz), [(R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3], 4)); if (R() < 0.4) g.add(cyl3(1.2, 1.2, 4, '#5a3a20', 'wood', px, hh - 3, pz, 5)); } return g; }
// Bagienne oczko: ciemna woda z brzegiem z mułu i trzcinami
function twBog(x, z, w, d, seed = 9) { const g = new THREE.Group(); const b = cyl3(w / 2 + 4, w / 2 + 5, 1.2, FT.mudD, 'dirt', x, 0, z, 20); b.scale.z = d / w; g.add(b);
  const m = cyl3(w / 2, w / 2, 1, FT.bog, 'win', x, 0.6, z, 20); m.material = new THREE.MeshStandardMaterial({ color: FT.bog, roughness: 0.12, metalness: 0.35 }); m.scale.z = d / w; g.add(m);
  g.add(twReeds(x - w * 0.42, z, w * 0.3, 7, seed)); g.add(twReeds(x + w * 0.4, z - d * 0.2, w * 0.25, 6, seed + 1)); return g; }
// Wieża strażnicza z pni: cztery słupy, pomost z balustradą, stożkowa strzecha
function twWatch(x, z, h, s = 1) { const g = new THREE.Group(), a = 7 * s; for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl3(2 * s, 2 * s, h, FT.logD, 'bark', x + sx * a, 0, z + sz * a, 6));
  for (const y of [h * 0.35, h * 0.68]) { g.add(blk(a * 2 + 4, 1.5, 1.5, FT.log, 'wood', x, y, z + a)); g.add(blk(a * 2 + 4, 1.5, 1.5, FT.log, 'wood', x, y, z - a)); }
  g.add(blk(a * 2 + 10, 3, a * 2 + 10, FT.log, 'planks', x, h, z)); g.add(blk(a * 2 + 10, 7, 1.5, FT.log, 'planks', x, h + 3, z + a + 4.2)); g.add(coneRoof(a * 1.9, a * 2.2, FT.reed, 'thatch', x, h + 12, z, 10));
  for (let i = 0; i < 4; i++) g.add(cyl3(1, 1, 12, FT.logD, 'wood', x + (i < 2 ? -1 : 1) * (a + 3), h + 3, z + (i % 2 ? -1 : 1) * (a + 3), 5)); return g; }
// Schodkowa piramida z kamienia i gliny (jak w H3) z wejściem i pochodniami
function twZiggurat(w, d, h, x, z, steps = 3, { y = 0, col = FT.stone } = {}) { const g = new THREE.Group(), sh = h / steps;
  for (let i = 0; i < steps; i++) { const k = 1 - i * 0.22; g.add(blk(w * k, sh, d * k, i % 2 ? DK(col, 0.08) : col, 'ashlar', x, y + i * sh, z)); g.add(blk(w * k + 2, 2.4, d * k + 2, FT.moss, 'rubble', x, y + (i + 1) * sh - 1.2, z)); }
  g.add(blk(w * 0.18, h, d * 0.18 + 2, DK(col, 0.12), 'ashlar', x, y, z + d * 0.42)); /* schody na froncie */
  return g; }
const twFlag = (x, y, z, col = FT.red) => { const g = new THREE.Group(); g.add(mast(x, y, z, 30, FT.logD)); g.add(blk(10, 16, 0.6, col, 'cloth', x + 5.5, y + 13, z)); g.add(blk(10, 2, 0.8, FT.bone, 'cloth', x + 5.5, y + 13, z)); return g; };

const FORTRESS3 = {
  hall(t) { // ratusz: duża okrągła chata wodza; 2: dom długi z totemami; 3: dom na kamiennej piramidzie; 4: Wielki Dwór Wodzów – piramida, dom z wieżami i rogami
    const g = new THREE.Group();
    if (t === 1) { g.add(blk(70, 3, 56, FT.mudD, 'dirt', 0, 0, 0)); g.add(twHut(24, 22, 0, -4, { roofH: 34, glow: FT.fire })); for (const s of [-1, 1]) g.add(twTorch(s * 34, 18, 22)); return g; }
    const zh = t >= 3 ? 26 : 4; g.add(t >= 3 ? twZiggurat(110, 76, zh, 0, -4, 2) : blk(96, 4, 64, FT.mudD, 'dirt', 0, 0, 0));
    g.add(twLodge(t >= 4 ? 82 : 68, t >= 4 ? 34 : 28, 40, 0, -8, { y: zh, roofH: t >= 4 ? 42 : 34, wins: 5 }));
    for (const s of [-1, 1]) g.add(twTotem(s * (t >= 3 ? 50 : 44), 28, t >= 3 ? 50 : 40, 3 + s));
    if (t >= 3) g.add(twWatch(-34, -36, 60 + zh)); if (t >= 4) { g.add(twWatch(34, -36, 70 + zh)); for (const s of [-1, 1]) g.add(twFlag(s * 22, zh + 34, 14)); g.add(sph(5 / PXU, FT.glow, 'glow', P(0, zh + 84, -8), null, 10)); glowMark(g, 0, zh + 84, -8, 14, FT.glow); }
    for (const s of [-1, 1]) g.add(twTorch(s * 30, 18, 36));
    return g; },
  fort(t) { // fort: palisada z bramą; 2: palisada z wieżami strażniczymi i kamienną bramą; 3: Warownia Wodzów – piramida schodkowa z twierdzą z bali na szczycie
    const g = new THREE.Group(); g.add(twPalisade(-84, -18, 34, 30, 11)); g.add(twPalisade(18, 84, 34, 30, 12));
    if (t === 1) { for (const s of [-1, 1]) g.add(cyl3(4, 4, 44, FT.logD, 'bark', s * 15, 0, 34, 8)); g.add(blk(38, 5, 5, FT.logD, 'wood', 0, 38, 34)); twHorns(g, 0, 46, 37, 1.2); return g; }
    g.add(blk(42, 46, 18, FT.stone, 'ashlar', 0, 0, 36)); g.add(blk(46, 4, 22, FT.moss, 'rubble', 0, 46, 36)); g.add(opening(20, 30, 0, 0, 45.5, { inner: '#120c08', frame: FT.logD, frameKind: 'wood', bars: true, sill: false, frameW: 3 }));
    twHorns(g, 0, 54, 46, 1.4); for (const s of [-1, 1]) { g.add(twWatch(s * 92, 32, 54, 1.1)); g.add(twTotem(s * 30, 48, 44, 20 + s)); }
    if (t >= 3) { g.add(twZiggurat(150, 80, 72, 0, -34, 4)); g.add(twLodge(70, 30, 34, 0, -40, { y: 72, roofH: 40, wins: 3, glow: FT.glow }));
      for (const s of [-1, 1]) { g.add(twWatch(s * 58, -40, 110, 1.2)); g.add(twTorch(s * 14, 80, 0)); } for (const s of [-1, 1]) g.add(twFlag(s * 30, 102, -28)); }
    return g; },
  guild(t) { // chata wiedźmy: chata na palach nad bagnem z kotłem; kolejne stopnie dokładają piętra, czaszki i zielony blask
    const g = new THREE.Group(); g.add(twBog(0, 10, 70, 40, 40)); g.add(twStilts(44, 36, 16, 0, -4)); g.add(twHut(17, 18, 0, -4, { y: 19, roofH: 26, glow: FT.glow }));
    for (let i = 1; i < t; i++) g.add(twHut(17 - i * 2.6, 13, 0, -4 - i, { y: 19 + 18 + (i - 1) * 22 + 6, roofH: 22, roof: i % 2 ? FT.reedD : FT.reed, glow: FT.glow, dr: false }));
    g.add(cyl3(6, 4.5, 7, '#2a2a26', 'iron', 26, 0, 22, 12)); g.add(sph(5.4 / PXU, FT.glow, 'glow', P(26, 7, 22), [1, 0.3, 1], 10)); glowMark(g, 26, 10, 22, 12, FT.glow); marker(g, 'fx:smoke', P(26, 14, 22));
    for (let i = 0; i < t + 1; i++) g.add(sph(2.2 / PXU, FT.bone, 'bone', P(-22 + i * 4, 22, 14), [1, 0.95, 1.1], 8));
    const top = 19 + 18 + Math.max(0, t - 1) * 22 + 28; g.add(sph(4 / PXU, FT.glow, 'glow', P(0, top + 10, -6), null, 10)); glowMark(g, 0, top + 10, -6, 12, FT.glow); return g; },
  tavern() { // karczma: dom długi z dymiącym otworem, beczki, rożen z pieczenią
    const g = new THREE.Group(); g.add(twLodge(60, 24, 40, 0, -4, { roofH: 30, wins: 3 })); marker(g, 'fx:smoke', P(0, 58, -4));
    for (const [x, z] of [[36, 22], [42, 12], [-38, 20]]) g.add(cyl3(5, 5, 10, FT.logD, 'wood', x, 0, z, 10));
    for (const s of [-1, 1]) g.add(blk(2, 12, 2, FT.logD, 'wood', -14 + s * 10, 0, 30)); g.add(cyl3(1, 1, 22, FT.logD, 'wood', -14, 11, 30, 5)); g.add(sph(4 / PXU, '#8a4a2a', 'skin', P(-14, 11, 30), [1.6, 1, 1], 8));
    g.add(sph(3 / PXU, FT.fire, 'glow', P(-14, 3, 30), null, 7)); glowMark(g, -14, 4, 30, 9, FT.fire); return g; },
  market() { // targ: kramy pod skórami na tyczkach, kosze, ryby, skóry na stelażu
    const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const x = -40 + i * 40; for (const dx of [-14, 14]) g.add(cyl3(1.4, 1.4, 24, FT.logD, 'wood', x + dx, 0, 6, 6)); g.add(blk(30, 8, 16, FT.log, 'planks', x, 0, 10));
      g.add(gable(34, 22, 9, i % 2 ? FT.hide : '#8a6a44', 'thatch', x, 24, 6, 2)); for (let k = 0; k < 3; k++) g.add(cyl3(3.4, 2.6, 4, FT.reed, 'thatch', x - 8 + k * 8, 8, 12, 8)); } return g; },
  smith() { // kuźnia: otwarta wiata na słupach, palenisko z gliny, kowadło
    const g = new THREE.Group(); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl3(2.2, 2.2, 26, FT.logD, 'bark', sx * 22, 0, sz * 14, 6)); g.add(gable(52, 38, 16, FT.reed, 'thatch', 0, 26, 0, 3));
    g.add(cyl3(10, 12, 14, FT.mud, 'plaster', -8, 0, -4, 12)); g.add(cyl3(4, 3, 14, FT.mudD, 'plaster', -8, 14, -6, 8)); g.add(sph(5 / PXU, FT.fire, 'glow', P(-8, 13, 4), null, 8)); glowMark(g, -8, 12, 6, 14, FT.fire);
    g.add(blk(12, 5, 6, '#3a3a3e', 'iron', 14, 7, 10)); g.add(cyl3(4, 5, 7, FT.logD, 'wood', 14, 0, 10, 8)); marker(g, 'fx:smoke', P(-8, 40, -6)); return g; },
  silo() { // skład: spichlerz na palach, worki i skrzynie
    const g = new THREE.Group(); g.add(twStilts(40, 30, 12, 0, 0)); g.add(blk(34, 18, 26, FT.log, 'planks', 0, 15, 0)); g.add(gable(40, 32, 14, FT.reed, 'thatch', 0, 33, 0, 3, FT.log, 'planks'));
    for (let i = 0; i < 3; i++) g.add(blk(9, 7, 9, FT.logD, 'planks', -30 + i * 3, i * 7, 14)); return g; },
  special() { // Klatka wodzów: wielka klatka z bali na kamiennym podeście, totemy dookoła, ogniska
    const g = new THREE.Group(); g.add(cyl3(32, 34, 5, FT.stone, 'ashlar', 0, 0, 0, 16)); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.add(cyl3(2, 2, 40, FT.logD, 'bark', Math.cos(a) * 22, 5, Math.sin(a) * 22, 6)); }
    for (const y of [24, 44]) g.add(torus(22 / PXU, 1.8 / PXU, FT.log, 'wood', P(0, y, 0), [Math.PI / 2, 0, 0])); g.add(coneRoof(26, 18, FT.reed, 'thatch', 0, 45, 0, 14));
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.6; g.add(twTotem(Math.cos(a) * 40, Math.sin(a) * 26, 34, 50 + i)); } for (const s of [-1, 1]) g.add(twTorch(s * 18, 12, 32)); return g; },
  grail() { // Pradawne Źródło: kolosalna piramida schodkowa z omszałego kamienia, na szczycie świątynia, z niej wodospad turkusowej wody do świętej sadzawki; wąż-strażnik owinięty wokół, olbrzymie totemy
    const g = new THREE.Group(); g.add(twBog(0, 46, 170, 50, 80));
    const pool = cyl3(56, 56, 1.4, FT.teal, 'win', 0, 1, 50, 24); pool.material = lightMat('#3ac0a0'); pool.scale.z = 0.45; g.add(pool); glowMark(g, 0, 4, 50, 50, FT.teal);
    g.add(twZiggurat(150, 110, 120, 0, -30, 5)); g.add(blk(40, 34, 30, FT.stoneD, 'ashlar', 0, 120, -30)); g.add(gable(48, 38, 26, FT.reedD, 'thatch', 0, 154, -30, 3)); g.add(opening(18, 24, 0, 120, -14.5, { glow: FT.teal, frame: FT.gold, frameKind: 'ashlar', sill: false }));
    const fall = blk(16, 120, 4, FT.teal, 'win', 0, 2, 26); fall.material = lightMat('#6af0d0'); fall.material.transparent = true; fall.material.opacity = 0.7; g.add(fall); /* wodospad po schodach */
    for (let i = 0; i < 10; i++) g.add(sph((3 + (i % 3)) / PXU, '#d8fff4', 'glow', P(-14 + (i * 7) % 28, 3 + (i % 2) * 3, 32 + (i % 3) * 3), null, 6));
    const sp = sph(9 / PXU, FT.teal, 'glow', P(0, 186, -30), null, 14); g.add(sp); glowMark(g, 0, 186, -30, 40, FT.teal); for (let i = 0; i < 3; i++) g.add(torus((14 + i * 7) / PXU, 0.8 / PXU, FT.teal, 'glow', P(0, 186, -30), [Math.PI / 2 + 0.3 * (i - 1), 0, 0.25 * i]));
    for (const s of [-1, 1]) { g.add(blk(26, 30, 26, FT.stoneD, 'ashlar', s * 30, 0, 30)); g.add(sph(15 / PXU, FT.stone, 'rock', P(s * 30, 40, 34), [1, 0.8, 1.3], 12)); g.add(cone(5 / PXU, 16 / PXU, FT.stone, 'rock', P(s * 30, 40, 52), [Math.PI / 2, 0, 0], 8)); /* kamienne głowy węży-strażników */
      for (const k of [-1, 1]) g.add(sph(2.4 / PXU, FT.teal, 'glow', P(s * 30 + k * 7, 46, 44), null, 6)); g.add(blk(28, 3, 28, FT.moss, 'rubble', s * 30, 30, 30)); }
    for (const s of [-1, 1]) { g.add(twTotem(s * 92, 10, 110, 70 + s)); g.add(twTotem(s * 70, 34, 80, 72 + s)); g.add(twTorch(s * 34, 30, 40)); } return g; },
  dw1(t) { // nora gnolli: ziemianki pod strzechą, kości, gnoll; 2: obóz – palisada i druga chata; 3: krąg berserkerów – krąg pali z czaszkami i ognisko
    const g = new THREE.Group(); g.add(twHut(16, 12, -10, -6, { roofH: 22, col: FT.mudD })); g.add(sph(10 / PXU, FT.mudD, 'dirt', P(22, 0, -10), [1.4, 0.7, 1], 10));
    if (t >= 2) { g.add(twHut(13, 11, 26, -18, { roofH: 18 })); g.add(twPalisade(-44, 44, -36, 22, 15)); }
    if (t >= 3) { for (let i = 0; i < 7; i++) { const a = Math.PI * (0.1 + i * 0.13); g.add(cyl3(1.6, 1.6, 20, FT.logD, 'bark', Math.cos(a) * 38, 0, 22 - Math.sin(a) * 8, 5)); g.add(sph(2.2 / PXU, FT.bone, 'bone', P(Math.cos(a) * 38, 22, 22 - Math.sin(a) * 8), null, 6)); } g.add(sph(4 / PXU, FT.fire, 'glow', P(0, 3, 26), null, 8)); glowMark(g, 0, 4, 26, 10, FT.fire); }
    for (let i = 0; i < (t >= 3 ? 3 : t); i++) g.add(creature(t >= 3 ? 'gnollBerserker' : t >= 2 ? 'gnollMarauder' : 'gnoll', 10 - i * 18, 0, 22, 0.55, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // chaty jaszczurów: chata na palach nad oczkiem; 2: strażnica – dwie chaty z kładką i wieżyczka; 3: obóz zabójców – totemy i włócznie
    const g = new THREE.Group(); g.add(twBog(0, 6, 90, 40, 20)); g.add(twStilts(36, 30, 14, -16, -8)); g.add(twHut(14, 14, -16, -8, { y: 17, roofH: 22, glow: FT.fire }));
    if (t >= 2) { g.add(twStilts(30, 26, 14, 26, -12)); g.add(twHut(12, 12, 26, -12, { y: 17, roofH: 20 })); g.add(blk(20, 2, 6, FT.log, 'planks', 5, 16, -10)); g.add(twWatch(46, -30, 40, 0.8)); }
    if (t >= 3) { g.add(twTotem(-46, 12, 40, 31)); for (let i = 0; i < 5; i++) { const s = cyl3(0.8, 0.8, 26, FT.logD, 'wood', 30 + i * 4, 0, 24, 4); s.rotation.z = 0.2; g.add(s); } }
    g.add(creature(t >= 3 ? 'lizardSlayer' : t >= 2 ? 'lizardWarrior' : 'lizardman', 4, 0, 24, 0.55, -Math.PI / 2 + 0.4)); return g; },
  dw3(t) { // rój ważek: wysokie trzciny i wiszące gniazda-kokony; 2: gniazdo – więcej kokonów i jadowity blask; 3: rój królowej – olbrzymi kokon królowej
    const g = new THREE.Group(); g.add(twBog(0, 6, 80, 36, 30)); g.add(twReeds(0, -8, 80, 30, 33, 40));
    const pods = t >= 2 ? 5 : 3; for (let i = 0; i < pods; i++) { const x = -30 + i * 60 / Math.max(1, pods - 1); g.add(cyl3(0.8, 0.8, 50, FT.logD, 'wood', x, 0, -14, 4)); g.add(sph(7 / PXU, '#a89a6a', 'hide', P(x, 44, -14), [1, 1.5, 1], 10)); if (t >= 2) { g.add(sph(1.8 / PXU, FT.glow, 'glow', P(x, 40, -7), null, 6)); } }
    if (t >= 3) { g.add(sph(14 / PXU, '#b8a870', 'hide', P(0, 64, -20), [1, 1.4, 1], 14)); glowMark(g, 0, 64, -20, 20, FT.glow); }
    g.add(creature(t >= 3 ? 'queenFly' : t >= 2 ? 'venomFly' : 'dragonfly', 10, 22, 16, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw4(t) { // jama bazyliszków: skalny kopiec z jamą; 2: leże – kamienie z runami, większe skały; 3: królewskie leże – złote ozdoby i pochodnie
    const g = new THREE.Group(), k = t >= 2 ? 1.15 : 1; g.add(boulder(0, 0, -16, 46 * k, '#6a6a52', 40, 0.55)); g.add(boulder(-40, 0, -4, 22, '#74725a', 41, 0.6));
    g.add(opening(26, 18, 0, 0, 16, { inner: '#0e0a06', frame: FT.stoneD, frameKind: 'rubble', sill: false })); g.add(creature(t >= 3 ? 'royalBasilisk' : t >= 2 ? 'greatBasilisk' : 'basilisk', 40, 0, 40, 1.0, -Math.PI / 2 + 0.5));
    if (t >= 2) for (const s of [-1, 1]) g.add(blk(6, 22, 4, FT.stone, 'rock', s * 22, 0, 24));
    if (t >= 3) { for (const s of [-1, 1]) g.add(twTorch(s * 34, 22, 30)); g.add(blk(28, 3, 2, FT.gold, 'gold', 0, 20, 17)); } return g; },
  dw5(t) { // zagroda gorgon: zagroda z bali i obora z gliny; 2: żelazna zagroda – okute wrota i kamienne narożniki; 3: pancerna – wieża i zbroje
    const g = new THREE.Group(); g.add(twLodge(54, 22, 30, -8, -20, { roofH: 24, wins: 2, horns: true }));
    for (const x of [-50, 50]) for (let z = 2; z <= 38; z += 12) g.add(cyl3(1.8, 1.8, 16, FT.logD, 'bark', x, 0, z, 6)); for (const x of [-50, 50]) for (const y of [6, 13]) g.add(blk(2, 2, 38, FT.log, 'wood', x, y, 20));
    if (t >= 2) { for (const sx of [-1, 1]) { g.add(blk(10, 22, 10, FT.stone, 'ashlar', sx * 52, 0, 38)); g.add(blk(2.4, 16, 30, '#4a4a4c', 'iron', sx * 50, 0, 20)); } }
    if (t >= 3) g.add(twWatch(40, -24, 46, 0.9));
    g.add(creature(t >= 3 ? 'armoredGorgon' : t >= 2 ? 'mightyGorgon' : 'gorgon', 0, 0, 22, 0.6, -Math.PI / 2 + 0.3)); return g; },
  dw6(t) { // gniazdo wywern: skalna turnia z gniazdem z gałęzi na szczycie; 2: turnia – wyższa, z totemem; 3: burzowa turnia – świecące runy i błękitny blask
    const g = new THREE.Group(), h = [70, 90, 104][t - 1]; g.add(boulder(0, 0, -10, 40, '#6a6656', 60, 0.6)); for (let i = 0; i < 5; i++) { const y = i * h / 5, rr = 34 - i * 4.6; g.add(boulder((i % 2 ? 4 : -4), y, -10, rr, i % 2 ? '#6e6a58' : '#76725e', 63 + i, 0.9)); } g.add(boulder(0, h - 8, -10, 18, '#7a765e', 61, 0.6));
    g.add(torus(20 / PXU, 5 / PXU, FT.logD, 'bark', P(0, h + 4, -10), [Math.PI / 2, 0, 0])); for (let i = 0; i < 3; i++) g.add(sph(3.6 / PXU, '#e8e0c8', 'bone', P(-5 + i * 5, h + 6, -10), [1, 1.3, 1], 8));
    if (t >= 2) g.add(twTotem(34, 18, 36, 62)); if (t >= 3) { for (let i = 0; i < 3; i++) g.add(blk(4, 8, 0.8, '#8ad8ff', 'glow', -6 + i * 6, h * 0.5 + i * 8, 20)); glowMark(g, 0, h * 0.6, 20, 24, '#8ad8ff'); }
    g.add(creature(t >= 3 ? 'stormWyvern' : t >= 2 ? 'wyvernKing' : 'wyvern', 0, h + 6, -6, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw7(t) { // bagno hydr: rozległe bagno z kamiennymi ruinami i hydrą; 2: otchłań chaosu – fioletowa mgła i kolumny; 3: pradawne bagno – większe ruiny i łuk
    const g = new THREE.Group(), k = t >= 3 ? 1.2 : 1; g.add(twBog(0, 4, 150 * k, 70 * k, 90)); g.add(boulder(-56 * k, 0, -18, 26, '#5e6250', 91, 0.6)); g.add(boulder(54 * k, 0, -22, 30, '#5e6250', 92, 0.6));
    for (const s of [-1, 1]) { const c = cyl3(6, 7, 40 + s * 8, FT.stone, 'ashlar', s * 40 * k, 0, -30, 8); c.rotation.z = s * 0.12; g.add(c); }
    if (t >= 2) { for (let i = 0; i < 8; i++) g.add(sph((3 + (i % 3)) / PXU, '#b080ff', 'glow', P(-60 + i * 17, 6 + (i % 2) * 6, -4 + (i % 3) * 8), [1.6, 0.6, 1], 6)); glowMark(g, 0, 10, 0, 50, '#b080ff'); }
    if (t >= 3) { g.add(torus(42 / PXU, 6 / PXU, FT.stone, 'ashlar', P(0, 0, -44), null, null, Math.PI)); g.add(blk(18, 6, 8, FT.moss, 'rubble', 0, 42, -44)); }
    g.add(creature(t >= 3 ? 'primeHydra' : t >= 2 ? 'chaosHydra' : 'hydra', 0, 0, 6, 0.85 * k, 0.35)); return g; },
  ozd(t) { // ozdoby wtapiane w tło: 1 totem, 2 para pochodni z czaszką na palu, 3 oczko z trzcinami, 4 suszarnia skór, 5 kamienny bożek z mchem
    const g = new THREE.Group();
    if (t === 1) g.add(twTotem(0, 0, 40, 101));
    if (t === 2) { for (const x of [-14, 14]) g.add(twTorch(x, 16, 0)); g.add(cyl3(1.2, 1.2, 22, FT.logD, 'wood', 0, 0, -4, 5)); g.add(sph(2.6 / PXU, FT.bone, 'bone', P(0, 24, -4), [1, 0.95, 1.1], 8)); }
    if (t === 3) g.add(twBog(0, 0, 40, 20, 103));
    if (t === 4) { for (const x of [-14, 14]) g.add(cyl3(1.4, 1.4, 24, FT.logD, 'wood', x, 0, 0, 5)); g.add(blk(34, 1.8, 1.8, FT.log, 'wood', 0, 24, 0));
      for (let i = 0; i < 3; i++) g.add(blk(8, 14, 0.8, [FT.hide, '#8a6a44', '#b08a5a'][i], 'hide', -9 + i * 9, 9, 0)); }
    if (t === 5) { g.add(boulder(0, 0, 0, 12, '#6a6a56', 105, 0.6)); g.add(blk(10, 26, 8, FT.stoneD, 'rock', 0, 4, 0)); g.add(blk(8, 3, 1, FT.glow, 'glow', 0, 22, 4.2)); for (const s of [-1, 1]) g.add(blk(2, 2, 1, FT.glow, 'glow', s * 2.4, 25, 4.2)); g.add(blk(12, 3, 9, FT.moss, 'rubble', 0, 30, 0)); }
    return g; },
};
TOWN3.fortress = FORTRESS3;
