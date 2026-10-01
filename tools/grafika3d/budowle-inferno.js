// Budowle Inferna (piekielne miasto) w 3D: czarny bazalt, czerwone łupkowe dachy, rogate iglice, kute kolce, rzeki lawy, ognie w misach i okna płonące od środka.
// Te same zasady co budowle-kurhan.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.inferno = { hall(t), fort(t), … }.
'use strict';
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, hipRoof, coneRoof, mast, glowMark, creature, lightMat, boulder, onionDome, crenTop, merlons */
const IF = { bas: '#3a3034', basD: '#241c20', basL: '#56484a', roof: '#6a1e1a', roofD: '#4a1412', iron: '#2a2426', bone: '#e0d0b0', horn: '#d8c8a0',
  lava: '#ff6a1a', lavaL: '#ffb040', fire: '#ff8a2a', sulf: '#e8d040', gold: '#c89a40', cloth: '#7a1a1a', purple: '#b050ff' };
// --- drobne bryły ---
const ifFire = (g, x, y, z, s = 1) => { g.add(cone(2.6 * s / PXU, 9 * s / PXU, IF.fire, 'glow', P(x, y + 4.5 * s, z), null, 7)); g.add(cone(1.4 * s / PXU, 6 * s / PXU, IF.lavaL, 'glow', P(x, y + 3.5 * s, z + 0.4), null, 6)); glowMark(g, x, y + 4 * s, z, 10 * s, IF.fire); };
const ifBowl = (x, y, z, s = 1) => { const g = new THREE.Group(); g.add(cyl3(1.2 * s, 1.6 * s, y, IF.iron, 'iron', x, 0, z, 6)); g.add(cyl3(4 * s, 2 * s, 4 * s, IF.iron, 'iron', x, y, z, 10)); ifFire(g, x, y + 3 * s, z, s); return g; };
const ifWin = (w, h, x, y, z) => opening(w, h, x, y, z, { glow: IF.lava, frame: IF.basD, frameKind: 'ashlar' });
// Zakrzywiony róg: łuk torusa zwężony stożkiem na końcu
function ifHorn(g, x, y, z, s = 1, side = 1, col = IF.horn) { const h = torus(10 * s / PXU, 2.2 * s / PXU, col, 'bone', P(x, y, z), [0, 0, side > 0 ? -0.2 : Math.PI + 0.2], null, Math.PI * 0.55); g.add(h);
  g.add(cone(2.2 * s / PXU, 7 * s / PXU, col, 'bone', P(x + side * 1 * s, y + 13 * s, z), [0, 0, side * 0.25], 6)); }
// Iglica: ośmioboczna, zwężająca się wieża z płonącymi oknami, rogami i kolcem
function ifSpire(r, h, x, z, { y = 0, col = IF.bas, horns = true, wins = 2 } = {}) { const g = new THREE.Group(); g.add(cyl3(r * 1.25, r * 1.25, 6, IF.basD, 'ashlar', x, y, z, 8)); g.add(cyl3(r, r * 0.66, h, col, 'ashlar', x, y + 6, z, 8));
  for (let i = 0; i < wins; i++) g.add(ifWin(r * 0.45, r * 0.8, x, y + 6 + h * (0.25 + 0.5 * i / Math.max(1, wins)), z + r * (0.95 - 0.3 * (0.25 + 0.5 * i / Math.max(1, wins)))));
  g.add(cone(r * 0.75 / PXU, r * 2.8 / PXU, IF.roof, 'tiles', P(x, y + 6 + h + r * 1.4, z), null, 8)); g.add(cone(0.8 / PXU, 10 / PXU, IF.iron, 'iron', P(x, y + 6 + h + r * 2.8 + 5, z), null, 5));
  if (horns) for (const s of [-1, 1]) ifHorn(g, x + s * r * 0.7, y + 6 + h - 2, z, r / 12, s);
  return g; }
// Bazaltowy dom: blok, stromy czterospadowy dach z grzebieniem kolców, płonące okna
function ifHall(w, h, d, x, z, { y = 0, roofH = h * 0.9, wins = 2, dr = true, col = IF.bas } = {}) { const g = new THREE.Group(); g.add(blk(w, h, d, col, 'ashlar', x, y, z)); g.add(blk(w + 4, 5, d + 4, IF.basD, 'ashlar', x, y, z));
  g.add(hipRoof(w + 6, d + 6, roofH, IF.roof, 'tiles', x, y + h, z, 3)); for (let i = 0; i < 5; i++) g.add(cone(1.6 / PXU, 8 / PXU, IF.iron, 'iron', P(x - w * 0.3 + i * w * 0.15, y + h + roofH * 0.55, z), null, 5));
  for (let i = 0; i < wins; i++) { const wx = x - w / 2 + (i + 0.5) * w / wins; if (dr && Math.abs(wx - x) < w * 0.18) continue; g.add(ifWin(Math.min(8, w / wins * 0.35), h * 0.4, wx, y + h * 0.3, z + d / 2)); }
  if (dr) g.add(opening(Math.min(14, w * 0.24), Math.min(22, h * 0.62), x, y, z + d / 2, { glow: IF.lava, frame: IF.basL, frameKind: 'ashlar', sill: false }));
  return g; }
// Jezioro / rzeka lawy: świecąca tafla z bazaltowym brzegiem
function ifLava(x, z, w, d, seg = 20) { const g = new THREE.Group(); const b = cyl3(w / 2 + 4, w / 2 + 6, 1.6, IF.basD, 'rock', x, 0, z, seg); b.scale.z = d / w; g.add(b);
  const l = cyl3(w / 2, w / 2, 1.2, IF.lava, 'win', x, 0.8, z, seg); l.material = lightMat('#ff7a24'); l.scale.z = d / w; g.add(l); glowMark(g, x, 3, z, w * 0.4, IF.lava); return g; }
function ifSpikes(x0, x1, z, h = 16) { const g = new THREE.Group(); for (let x = x0; x <= x1; x += 6) { g.add(cyl3(0.9, 0.9, h, IF.iron, 'iron', x, 0, z, 5)); g.add(cone(1.6 / PXU, 6 / PXU, IF.iron, 'iron', P(x, h + 3, z), null, 5)); }
  g.add(blk(x1 - x0, 1.4, 1.4, IF.iron, 'iron', (x0 + x1) / 2, h * 0.8, z)); return g; }
const ifBanner = (x, y, z) => { const g = new THREE.Group(); g.add(mast(x, y, z, 30, IF.iron)); g.add(blk(10, 18, 0.6, IF.cloth, 'cloth', x + 5.5, y + 12, z)); g.add(blk(4, 4, 0.8, IF.lavaL, 'glow', x + 5.5, y + 16, z)); return g; };

const INFERNO3 = {
  hall(t) { // ratusz: bazaltowa sala nad fosą lawy; 2: z dwiema iglicami; 3: wyższa sala z centralną iglicą; 4: Pandemonium – rogata czaszka nad wejściem, trzy iglice, płonące misy
    const g = new THREE.Group(), w = [56, 70, 84, 96][t - 1], h = [28, 34, 42, 50][t - 1];
    g.add(ifLava(0, 30, w + 40, 16)); g.add(blk(w + 14, 6, 58, IF.basD, 'ashlar', 0, 0, -4)); g.add(blk(16, 6, 14, IF.basL, 'ashlar', 0, 0, 28)); /* most nad lawą */
    g.add(ifHall(w, h, 42, 0, -6, { y: 6, wins: t >= 3 ? 5 : 3 }));
    if (t >= 2) for (const s of [-1, 1]) g.add(ifSpire(9, h + 20, s * (w / 2 + 6), -2, { y: 6 }));
    if (t >= 3) g.add(ifSpire(13, h + 54, 0, -22, { y: 6, wins: 3 }));
    if (t >= 4) { g.add(sph(11 / PXU, IF.bone, 'bone', P(0, 6 + h + 6, 16), [1.2, 1, 1], 14)); for (const s of [-1, 1]) { g.add(sph(3 / PXU, '#1a0806', 'skin', P(s * 4.5, 6 + h + 8, 26), null, 6)); ifHorn(g, s * 10, 6 + h + 10, 16, 1.4, s); } glowMark(g, 0, 6 + h + 8, 26, 12, IF.lava); }
    for (const s of [-1, 1]) g.add(ifBowl(s * (w / 2 + 14), 16, 22));
    return g; },
  fort(t) { // fort: płot z kutych kolców i rogata brama; 2: bazaltowe mury z iglicami; 3: Cytadela Otchłani – wysoki zamek z rogatą koroną i wodospadami lawy
    const g = new THREE.Group();
    if (t === 1) { g.add(ifSpikes(-80, -18, 30)); g.add(ifSpikes(18, 80, 30)); for (const s of [-1, 1]) { g.add(blk(10, 36, 10, IF.basD, 'ashlar', s * 14, 0, 30)); ifHorn(g, s * 14, 36, 30, 1.2, s); } g.add(ifLava(0, 46, 50, 10)); return g; }
    g.add(ifLava(0, 52, 190, 14)); g.add(blk(170, 42, 12, IF.bas, 'ashlar', 0, 0, 34)); g.add(merlons(-84, 84, 42, 34, IF.bas, 'ashlar'));
    g.add(blk(42, 56, 18, IF.basD, 'ashlar', 0, 0, 37)); g.add(crenTop(42, 18, 56, IF.basD, 'ashlar', 0, 37)); g.add(opening(20, 32, 0, 0, 46.5, { glow: IF.lava, frame: IF.basL, frameKind: 'ashlar', bars: true, sill: false, frameW: 3 }));
    for (const s of [-1, 1]) { ifHorn(g, s * 12, 62, 46, 1.6, s); g.add(ifSpire(15, 64, s * 92, 34)); g.add(ifBanner(s * 26, 56, 38)); }
    if (t >= 3) { g.add(blk(116, 86, 62, IF.bas, 'ashlar', 0, 0, -30)); g.add(crenTop(116, 62, 86, IF.bas, 'ashlar', 0, -30)); for (let i = 0; i < 5; i++) g.add(ifWin(8, 24, -44 + i * 22, 38, 1.2));
      g.add(ifSpire(24, 130, 0, -42, { wins: 4 })); for (const s of [-1, 1]) { g.add(ifSpire(15, 100, s * 54, -42, { wins: 3 })); g.add(ifSpire(11, 84, s * 54, -4)); }
      for (const s of [-1, 1]) { const f = blk(10, 80, 2, IF.lava, 'win', s * 30, 0, 2); f.material = lightMat('#ff7020'); g.add(f); } glowMark(g, 0, 40, 4, 60, IF.lava); }
    return g; },
  guild(t) { // świątynia ognia: schodkowy ołtarz z wielką misą ognia; każdy stopień – wyższy stopień piramidy, ognisty pierścień i kolumny
    const g = new THREE.Group(), n = t + 1; for (let i = 0; i < n; i++) { const k = 1 - i * 0.16; g.add(blk(64 * k, 12, 54 * k, i % 2 ? IF.basD : IF.bas, 'ashlar', 0, i * 12, -4)); }
    const top = n * 12; g.add(blk(10, top, 10, IF.basL, 'ashlar', 0, 0, 24)); /* schody */
    g.add(cyl3(10, 6, 8, IF.iron, 'iron', 0, top, -4, 12)); ifFire(g, 0, top + 6, -4, 2.2);
    for (let i = 0; i < Math.min(4, t); i++) { const a = i / 4 * Math.PI * 2 + 0.785; g.add(cyl3(2.4, 2.4, 30 + t * 6, IF.basL, 'ashlar', Math.cos(a) * 36, 0, -4 + Math.sin(a) * 30, 8)); ifFire(g, Math.cos(a) * 36, 30 + t * 6, -4 + Math.sin(a) * 30, 0.8); }
    if (t >= 3) g.add(torus(16 / PXU, 1.2 / PXU, IF.lavaL, 'glow', P(0, top + 26, -4), [Math.PI / 2, 0, 0]));
    if (t >= 5) g.add(torus(22 / PXU, 1 / PXU, IF.lava, 'glow', P(0, top + 34, -4), [Math.PI / 2 + 0.3, 0, 0]));
    return g; },
  tavern() { // karczma: bazaltowa gospoda z kominem buchającym ogniem, szyld z rogami, beczki siarkowego trunku
    const g = new THREE.Group(); g.add(ifHall(56, 26, 38, 0, -4, { roofH: 26, wins: 3 })); g.add(blk(10, 36, 10, IF.basD, 'ashlar', 20, 20, -12)); ifFire(g, 20, 56, -12, 1.2); marker(g, 'fx:smoke', P(20, 66, -12));
    g.add(mast(-36, 0, 22, 30, IF.iron)); g.add(blk(12, 8, 1, IF.basD, 'wood', -30, 20, 22)); ifHorn(g, -30, 24, 22, 0.6, 1);
    for (const [x, z] of [[34, 24], [40, 15]]) g.add(cyl3(5, 5, 10, '#4a2a20', 'wood', x, 0, z, 10)); return g; },
  market() { // targ: kramy pod czerwonym płótnem na żelaznych słupach, kosze siarki i klejnotów
    const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const x = -40 + i * 40; for (const dx of [-14, 14]) g.add(cyl3(1.3, 1.3, 26, IF.iron, 'iron', x + dx, 0, 6, 6)); g.add(blk(32, 8, 18, IF.basD, 'ashlar', x, 0, 10));
      g.add(gable(34, 22, 8, i % 2 ? IF.cloth : '#5a1a2a', 'cloth', x, 26, 6, 2)); g.add(sph(5 / PXU, [IF.sulf, '#c03040', '#ff9a30'][i], i === 1 ? 'gem' : 'rock', P(x, 10, 12), [1.4, 0.7, 1], 8)); } return g; },
  smith() { // kuźnia: otwarte palenisko nad kanałem lawy, kowadło, łańcuchy
    const g = new THREE.Group(); g.add(ifHall(46, 24, 34, 0, -6, { roofH: 20, wins: 1, dr: false })); g.add(opening(22, 16, 0, 0, 11.5, { glow: IF.lava, frame: IF.iron, frameKind: 'iron', sill: false }));
    g.add(ifLava(-6, 22, 40, 8)); g.add(blk(14, 5, 7, IF.iron, 'iron', 30, 7, 20)); g.add(cyl3(4, 5, 7, IF.basD, 'ashlar', 30, 0, 20, 8)); g.add(blk(10, 30, 10, IF.basD, 'ashlar', 14, 24, -14)); marker(g, 'fx:smoke', P(14, 58, -14)); return g; },
  silo() { // skład: bazaltowy magazyn z kopcami żółtej siarki
    const g = new THREE.Group(); g.add(blk(40, 22, 30, IF.bas, 'ashlar', 0, 0, -4)); g.add(hipRoof(44, 34, 14, IF.roof, 'tiles', 0, 22, -4, 3)); g.add(opening(12, 16, 0, 0, 11, { inner: '#140808', frame: IF.basL, frameKind: 'ashlar', sill: false }));
    for (const [x, z, r] of [[-30, 14, 10], [28, 16, 8], [-20, 22, 6]]) g.add(sph(r / PXU, IF.sulf, 'rock', P(x, 0, z), [1, 0.7, 1], 10)); return g; },
  special() { // Brama piekieł: wielki pierścień z bazaltu na schodach, w środku wir ognia, rogi i kolce
    const g = new THREE.Group(); g.add(blk(80, 6, 40, IF.basD, 'ashlar', 0, 0, 0)); g.add(blk(64, 6, 30, IF.bas, 'ashlar', 0, 6, 0));
    g.add(torus(30 / PXU, 6 / PXU, IF.bas, 'ashlar', P(0, 44, 0), null, null)); const v = cyl3(26, 26, 2, IF.lava, 'win', 0, 0, 0, 28); v.material = lightMat('#ff5a20'); v.material.transparent = true; v.material.opacity = 0.75; v.rotation.x = Math.PI / 2; v.position.set(...P(0, 44, 0)); g.add(v);
    g.add(torus(16 / PXU, 2 / PXU, IF.purple, 'glow', P(0, 44, 1.5))); glowMark(g, 0, 44, 4, 34, IF.lava); for (const s of [-1, 1]) { ifHorn(g, s * 22, 70, 0, 1.8, s); g.add(ifBowl(s * 44, 14, 14)); }
    for (let i = 0; i < 8; i++) { const a = Math.PI * (0.05 + i * 0.128); g.add(cone(2 / PXU, 9 / PXU, IF.iron, 'iron', P(Math.cos(a) * 37, 44 + Math.sin(a) * 37, 0), [0, 0, a - Math.PI / 2], 5)); } return g; },
  grail() { // Ołtarz Ognia: kolosalna schodkowa piramida z bazaltu otoczona rzekami lawy, na szczycie olbrzymia misa z kolumną ognia, rogate obeliski i łuk z rogów
    const g = new THREE.Group(); g.add(ifLava(0, 0, 230, 150, 28)); for (let i = 0; i < 5; i++) { const k = 1 - i * 0.17; g.add(blk(170 * k, 22, 120 * k, i % 2 ? IF.basD : IF.bas, 'ashlar', 0, i * 22, -10)); g.add(blk(170 * k + 3, 2.4, 120 * k + 3, IF.lava, 'glow', 0, (i + 1) * 22 - 1.2, -10)); }
    g.add(blk(26, 110, 14, IF.basL, 'ashlar', 0, 0, 46)); /* schody */ for (const s of [-1, 1]) { const f = blk(8, 110, 2, IF.lava, 'win', s * 18, 0, 48); f.material = lightMat('#ff6a1a'); g.add(f); } /* spływająca lawa */
    g.add(cyl3(30, 18, 16, IF.iron, 'iron', 0, 110, -10, 16)); g.add(torus(30 / PXU, 3 / PXU, IF.gold, 'gold', P(0, 126, -10), [Math.PI / 2, 0, 0]));
    const col = cyl3(10, 22, 120, IF.fire, 'glow', 0, 124, -10, 14); col.material = lightMat('#ff9a30'); col.material.transparent = true; col.material.opacity = 0.75; g.add(col); const c2 = cyl3(5, 12, 140, IF.lavaL, 'glow', 0, 124, -10, 12); c2.material = lightMat('#ffe080'); g.add(c2); glowMark(g, 0, 190, -10, 70, IF.fire);
    for (const s of [-1, 1]) { ifHorn(g, s * 60, 104, -10, 5, s); for (const z of [-60, 40]) g.add(ifSpire(9, 80 + (z > 0 ? 0 : 30), s * 104, z, { wins: 2 })); }
    return g; },
  dw1(t) { // krąg chochlików: krąg kolców wokół jamy lawy, chochliki; 2: klatka diablików – żelazna klatka; 3: kocioł biesów – wielki kocioł na ogniu
    const g = new THREE.Group(); g.add(ifLava(0, 0, 40, 26)); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; g.add(cone(3 / PXU, (14 + (i % 3) * 5) / PXU, IF.basL, 'rock', P(Math.cos(a) * 30, 7, Math.sin(a) * 20), [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], 6)); }
    if (t >= 2) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(cyl3(0.8, 0.8, 30, IF.iron, 'iron', -40 + Math.cos(a) * 10, 0, -14 + Math.sin(a) * 10, 5)); } g.add(cone(12 / PXU, 10 / PXU, IF.iron, 'iron', P(-40, 35, -14), null, 8)); }
    if (t >= 3) { g.add(cyl3(16, 12, 18, IF.iron, 'iron', 36, 6, -14, 16)); g.add(cyl3(15, 15, 1, '#a0ff40', 'glow', 36, 24, -14, 16)); ifFire(g, 36, 0, -6, 1.4); marker(g, 'fx:smoke', P(36, 30, -14)); }
    for (let i = 0; i < 3; i++) g.add(creature(t >= 3 ? 'bies' : t >= 2 ? 'familiar' : 'imp', -14 + i * 14, 0, 28, 0.55, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // hala gogów: niska bazaltowa hala z ogniem w wejściu; 2: kuźnia magogów – kominy i palenisko; 3: płonąca kuźnia – rzeka lawy i ogniste kominy
    const g = new THREE.Group(); g.add(ifHall(60, 24, 36, 0, -8, { roofH: 20, wins: 3 })); g.add(creature(t >= 3 ? 'firebrand' : t >= 2 ? 'magog' : 'gog', 22, 0, 24, 0.55, -Math.PI / 2 + 0.4));
    if (t >= 2) for (const s of [-1, 1]) { g.add(blk(9, 36, 9, IF.basD, 'ashlar', s * 22, 20, -18)); ifFire(g, s * 22, 56, -18); }
    if (t >= 3) g.add(ifLava(-24, 24, 40, 12));
    return g; },
  dw3(t) { // psiarnia: bazaltowe budy za kolczastym płotem i ogar; 2: legowisko cerberów – większe i z kośćmi; 3: psiarnia Otchłani – ogniste misy i łańcuchy
    const g = new THREE.Group(); for (const x of [-26, 26]) { g.add(blk(28, 16, 22, IF.bas, 'ashlar', x, 0, -10)); g.add(hipRoof(30, 24, 12, IF.roof, 'tiles', x, 16, -10, 2)); g.add(opening(10, 10, x, 0, 1.5, { glow: IF.lava, frame: IF.basD, frameKind: 'ashlar', sill: false })); }
    g.add(ifSpikes(-50, 50, 26, 12)); g.add(creature(t >= 3 ? 'abyssCerberus' : t >= 2 ? 'cerberus' : 'hellHound', 0, 0, 12, 0.6, -Math.PI / 2 + 0.4));
    if (t >= 2) for (let i = 0; i < 5; i++) g.add(sph(2.2 / PXU, IF.bone, 'bone', P(-40 + i * 6, 1, 14 + (i % 2) * 4), [1.6, 0.6, 0.8], 6));
    if (t >= 3) for (const s of [-1, 1]) g.add(ifBowl(s * 54, 14, 24));
    return g; },
  dw4(t) { // brama demonów: dwa bazaltowe pylony z łukiem i ognisty portal; 2: wrota rogatych – rogi i kolce; 3: brama zagłady – wyższe pylony, fiolet zagłady
    const g = new THREE.Group(), H = t >= 3 ? 70 : 56; for (const s of [-1, 1]) { g.add(blk(16, H, 16, IF.bas, 'ashlar', s * 28, 0, -6)); g.add(cone(9 / PXU, 20 / PXU, IF.roof, 'tiles', P(s * 28, H + 10, -6), [0, Math.PI / 4, 0], 4)); }
    g.add(blk(72, 12, 16, IF.basD, 'ashlar', 0, H - 12, -6)); const pt = blk(40, H - 12, 2, t >= 3 ? IF.purple : IF.lava, 'win', 0, 0, -6); pt.material = lightMat(t >= 3 ? '#b060ff' : '#ff6a20'); pt.material.transparent = true; pt.material.opacity = 0.8; g.add(pt); glowMark(g, 0, H / 2, -4, 30, t >= 3 ? IF.purple : IF.lava);
    if (t >= 2) for (const s of [-1, 1]) ifHorn(g, s * 28, H + 4, -6, 1.4, s);
    g.add(creature(t >= 3 ? 'doomDemon' : t >= 2 ? 'hornedDemon' : 'demon', 30, 0, 24, 0.55, -Math.PI / 2 + 0.5)); return g; },
  dw5(t) { // szyb czartów: okrągły szyb z płonącą otchłanią i żurawiem z łańcuchem; 2: otchłań władców – wieżyczki; 3: tron Otchłani – bazaltowy tron nad szybem
    const g = new THREE.Group(); g.add(cyl3(30, 32, 10, IF.bas, 'ashlar', 0, 0, -6, 18)); const pit = cyl3(24, 24, 1, IF.lava, 'win', 0, 10, -6, 18); pit.material = lightMat('#ff5a18'); g.add(pit); glowMark(g, 0, 16, -6, 30, IF.lava);
    g.add(cyl3(2, 2, 50, IF.iron, 'iron', -30, 0, -20, 6)); const arm = blk(40, 2, 2, IF.iron, 'iron', -12, 48, -20); g.add(arm); g.add(cyl3(0.6, 0.6, 30, IF.iron, 'iron', 6, 18, -20, 4));
    if (t >= 2) for (const s of [-1, 1]) g.add(ifSpire(7, 40, s * 40, -18));
    if (t >= 3) { g.add(blk(20, 30, 10, IF.basD, 'ashlar', 0, 10, -36)); g.add(blk(26, 6, 18, IF.bas, 'ashlar', 0, 10, -30)); for (const s of [-1, 1]) ifHorn(g, s * 9, 40, -36, 1, s); }
    g.add(creature(t >= 3 ? 'archFiend' : t >= 2 ? 'pitLord' : 'pitFiend', 30, 0, 26, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw6(t) { // pałac ifrytów: pałac z cebulastą kopułą w kolorze ognia; 2: pałac sułtanów – minarety; 3: pałac płomieni – złote kopuły i ogień
    const g = new THREE.Group(); g.add(blk(60, 34, 44, IF.basL, 'ashlar', 0, 0, -10)); g.add(onionDome(22, t >= 3 ? IF.gold : '#c84a20', t >= 3 ? 'gold' : 'tiles', 0, 34, -10)); g.add(cone(1 / PXU, 12 / PXU, IF.gold, 'gold', P(0, 34 + 44 + 6, -10), null, 5));
    for (let i = 0; i < 3; i++) g.add(ifWin(8, 16, -18 + i * 18, 8, 12.2));
    if (t >= 2) for (const s of [-1, 1]) { g.add(cyl3(6, 5, 70, IF.basL, 'ashlar', s * 38, 0, -4, 10)); g.add(onionDome(7, '#c84a20', 'tiles', s * 38, 70, -4)); }
    if (t >= 3) for (const s of [-1, 1]) ifFire(g, s * 38, 86, -4, 1.4);
    g.add(creature(t >= 3 ? 'flameLord' : t >= 2 ? 'efreetSultan' : 'efreet', 0, 6, 30, 0.45, -Math.PI / 2 + 0.3)); return g; },
  dw7(t) { // wrota piekieł: olbrzymie wrota wykute w skale, za nimi łuna lawy, diabeł na schodach; 2: tron ognia – tron nad wrotami; 3: serce piekieł – pulsujące serce lawy i iglice
    const g = new THREE.Group(), k = t >= 3 ? 1.2 : 1; g.add(boulder(0, 0, -30, 70 * k, '#3e3034', 70, 0.8)); g.add(boulder(-58 * k, 0, -10, 34, '#46383a', 71, 0.8)); g.add(boulder(58 * k, 0, -14, 38, '#46383a', 72, 0.8));
    g.add(blk(60, 70, 12, IF.basD, 'ashlar', 0, 0, 22)); const gate = blk(40, 56, 2, IF.lava, 'win', 0, 0, 28.5); gate.material = lightMat('#ff5a18'); g.add(gate); glowMark(g, 0, 28, 32, 36, IF.lava);
    for (let i = 0; i < 5; i++) g.add(blk(2, 56, 1.6, IF.iron, 'iron', -16 + i * 8, 0, 29.6)); for (const s of [-1, 1]) ifHorn(g, s * 22, 70, 22, 2.2, s);
    for (let i = 0; i < 4; i++) g.add(blk(60 - i * 8, 3, 8, IF.basL, 'ashlar', 0, i * 3, 34 + 8 - i * 2.5)); g.add(ifLava(0, 46, 120 * k, 14));
    if (t >= 2) { g.add(blk(24, 36, 12, IF.basD, 'ashlar', 0, 70, 18)); g.add(blk(30, 8, 20, IF.bas, 'ashlar', 0, 70, 24)); ifFire(g, -16, 78, 24); ifFire(g, 16, 78, 24); }
    if (t >= 3) { const h2 = sph(12 / PXU, '#c01a10', 'glow', P(0, 118, 18), [1, 1.2, 0.9], 14); h2.material = lightMat('#ff3a20'); g.add(h2); glowMark(g, 0, 118, 20, 30, '#ff3a20'); for (const s of [-1, 1]) g.add(ifSpire(10, 90, s * 70, -20)); }
    g.add(creature(t >= 3 ? 'hellLord' : t >= 2 ? 'archDevil' : 'devil', 34, 0, 44, 0.5, -Math.PI / 2 + 0.4)); return g; },
  ozd(t) { // ozdoby wtapiane w tło: 1 para mis ognia, 2 jeziorko lawy w bazalcie, 3 obelisk z kolcami i łańcuchem, 4 rogata czaszka na stosie kamieni, 5 posąg demona
    const g = new THREE.Group();
    if (t === 1) for (const x of [-12, 12]) g.add(ifBowl(x, 14, 0));
    if (t === 2) { g.add(ifLava(0, 0, 30, 18)); for (const [x, z] of [[-16, -6], [14, -8]]) g.add(boulder(x, 0, z, 7, IF.bas, 80 + x, 0.7)); }
    if (t === 3) { g.add(blk(10, 4, 10, IF.basD, 'ashlar', 0, 0, 0)); const o = cyl3(3, 4.4, 36, IF.bas, 'ashlar', 0, 4, 0, 4); o.rotation.y = Math.PI / 4; g.add(o); g.add(cone(3 / PXU, 8 / PXU, IF.iron, 'iron', P(0, 44, 0), null, 4)); g.add(blk(2, 14, 0.6, IF.lava, 'glow', 0, 16, 3.2)); }
    if (t === 4) { g.add(boulder(0, 0, 0, 9, IF.bas, 84, 0.6)); g.add(sph(5 / PXU, IF.bone, 'bone', P(0, 9, 2), [1.2, 1, 1], 10)); for (const s of [-1, 1]) ifHorn(g, s * 4, 11, 2, 0.6, s); }
    if (t === 5) { g.add(blk(14, 8, 12, IF.basD, 'ashlar', 0, 0, 0)); g.add(creature('demon', 0, 8, 0, 0.45, -Math.PI / 2)); }
    return g; },
};
TOWN3.inferno = INFERNO3;
