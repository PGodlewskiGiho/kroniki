// Budowle Inferna (piekielne miasto) w 3D: czarny bazalt, czerwone łupkowe dachy, rogate iglice, kute kolce, rzeki lawy, ognie w misach i okna płonące od środka.
// Te same zasady co budowle-kurhan.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.inferno = { hall(t), fort(t), … }.
'use strict';
/* global dome, THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, hipRoof, coneRoof, mast, glowMark, creature, lightMat, boulder, onionDome, crenTop, merlons */
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
function ifSpire(r, h, x, z, { y = 0, col = IF.bas, horns = false, wins = 2 } = {}) { const g = new THREE.Group(); g.add(cyl3(r * 1.25, r * 1.25, 6, IF.basD, 'ashlar', x, y, z, 8)); g.add(cyl3(r, r * 0.66, h, col, 'ashlar', x, y + 6, z, 8));
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
// Lity róg: łańcuch kul malejących wzdłuż łuku, osadzony w bryle (nie wisi w powietrzu)
function ifHornS(g, x, y, z, s = 1, side = 1, col = IF.horn) { for (let i = 0; i < 10; i++) { const a = i / 9 * 1.9, px = x + side * 14 * s * Math.sin(a * 0.8), py = y + 16 * s * (1 - Math.cos(a)) + i * 1.2 * s;
  g.add(sph(Math.max(0.8, 5.2 * s * (1 - i / 10.5)) / PXU, i < 2 ? DK(col, 0.25) : col, 'bone', P(px, py, z), null, 10)); } }
// Głowa demona jako budowla: bazaltowy łeb, łuk brwiowy, płonące skośne oczy, otwarta paszcza-brama z kłami, lite rogi, kły z policzków
function ifDemonHead(g, R, x, y, z) { const hd = sph(R / PXU, IF.bas, 'rock', P(x, y + R * 0.95, z), [1.15, 1, 0.95], 22); g.add(hd);
  g.add(blk(R * 1.9, R * 0.22, R * 0.5, IF.basD, 'rock', x, y + R * 1.18, z + R * 0.62)); /* łuk brwiowy */
  for (const s of [-1, 1]) { const e = blk(R * 0.42, R * 0.14, R * 0.2, IF.lavaL, 'glow', x + s * R * 0.42, y + R * 1.02, z + R * 0.78); e.rotation.z = s * 0.35; e.material = lightMat('#ffc040'); g.add(e); }
  g.add(blk(R * 0.5, R * 0.3, R * 0.5, IF.basD, 'rock', x, y + R * 0.78, z + R * 0.82)); /* nos */
  g.add(blk(R * 1.5, R * 0.3, R * 0.9, IF.basD, 'rock', x, y, z + R * 0.55)); /* żuchwa */
  const m = blk(R * 1.1, R * 0.52, 1, IF.lava, 'win', x, y + R * 0.3, z + R * 0.98); m.material = lightMat('#ff7020'); g.add(m); glowMark(g, x, y + R * 0.55, z + R, R * 0.7, IF.lava);
  for (let i = 0; i < 7; i++) { const tx = x - R * 0.48 + i * R * 0.16, big = i === 1 || i === 5; g.add(cone(R * (big ? 0.07 : 0.05) / PXU, R * (big ? 0.34 : 0.2) / PXU, IF.bone, 'bone', P(tx, y + R * 0.7, z + R * 1.0), [Math.PI, 0, 0], 6));
    g.add(cone(R * 0.05 / PXU, R * (big ? 0.3 : 0.18) / PXU, IF.bone, 'bone', P(tx + R * 0.06, y + R * 0.38, z + R * 1.0), null, 6)); }
  for (const s of [-1, 1]) { ifHornS(g, x + s * R * 0.8, y + R * 1.45, z, R / 22, s); g.add(cone(R * 0.08 / PXU, R * 0.4 / PXU, IF.bone, 'bone', P(x + s * R * 0.62, y + R * 0.28, z + R * 0.75), [0.4, 0, -s * 0.6], 6)); } }
// Portal z głębią: tunel w głąb bryły (ściany i stopniowo węższe ościeża), na dnie świecąca tafla, po drodze półprzezroczyste warstwy wiru
function ifPortalRect(g, x, y, z, w, h, D, col = '#ff6a20') { const wall = IF.basD;
  for (let i = 0; i < 3; i++) { const k = 1 - i * 0.12, zz = z - i * D / 3, d3 = D / 3; for (const s of [-1, 1]) g.add(blk(4, h * k, d3, wall, 'ashlar', x + s * (w * k / 2 + 2), y, zz - d3 / 2)); g.add(blk(w * k + 8, 4, d3, wall, 'ashlar', x, y + h * k, zz - d3 / 2)); }
  const b = blk(w * 0.76, h * 0.76, 1, col, 'win', x, y, z - D); b.material = lightMat(col); g.add(b);
  for (let i = 1; i <= 3; i++) { const k = 0.95 - i * 0.07, pl = blk(w * k, h * k, 0.4, col, 'win', x, y, z - D * i / 4); pl.material = lightMat(col); pl.material.transparent = true; pl.material.opacity = 0.18 + i * 0.06; g.add(pl);
    g.add(torus(Math.min(w, h) * k * 0.3 / PXU, 0.6 / PXU, LT(col, 0.3), 'glow', P(x, y + h * k * 0.5, z - D * i / 4 + 0.3), [0, 0, i])); }
  glowMark(g, x, y + h / 2, z + 2, Math.max(w, h) * 0.5, col); }
function ifPortalRound(g, x, y, z, R, D, col = '#ff5a20') { const tube = cyl3(R, R, D, IF.basD, 'ashlar', 0, 0, 0, 28, true); tube.material = tube.material.clone(); tube.material.side = THREE.DoubleSide; tube.rotation.x = Math.PI / 2; tube.position.set(...P(x, y, z - D / 2)); g.add(tube);
  const back = cyl3(R, R, 1, col, 'win', 0, 0, 0, 28); back.material = lightMat(col); back.rotation.x = Math.PI / 2; back.position.set(...P(x, y, z - D)); g.add(back);
  for (let i = 1; i <= 3; i++) { const d = cyl3(R * (1 - i * 0.12), R * (1 - i * 0.12), 0.4, col, 'win', 0, 0, 0, 24); d.material = lightMat(LT(col, 0.15 * i)); d.material.transparent = true; d.material.opacity = 0.16 + i * 0.07; d.rotation.x = Math.PI / 2; d.position.set(...P(x, y, z - D * i / 4)); g.add(d);
    g.add(torus(R * (0.75 - i * 0.15) / PXU, 0.7 / PXU, LT(col, 0.35), 'glow', P(x, y, z - D * i / 4 + 0.3))); }
  glowMark(g, x, y, z + 2, R, col); }
// Jezioro / rzeka lawy: świecąca tafla z bazaltowym brzegiem
function ifLava(x, z, w, d, seg = 20) { const g = new THREE.Group(); const b = cyl3(w / 2 + 4, w / 2 + 6, 1.6, IF.basD, 'rock', x, 0, z, seg); b.scale.z = d / w; g.add(b);
  const l = cyl3(w / 2, w / 2, 1.2, IF.lava, 'win', x, 0.8, z, seg); l.material = lightMat('#ff7a24'); l.scale.z = d / w; g.add(l); glowMark(g, x, 3, z, w * 0.4, IF.lava); return g; }
function ifSpikes(x0, x1, z, h = 16) { const g = new THREE.Group(); for (let x = x0; x <= x1; x += 6) { g.add(cyl3(0.9, 0.9, h, IF.iron, 'iron', x, 0, z, 5)); g.add(cone(1.6 / PXU, 6 / PXU, IF.iron, 'iron', P(x, h + 3, z), null, 5)); }
  g.add(blk(x1 - x0, 1.4, 1.4, IF.iron, 'iron', (x0 + x1) / 2, h * 0.8, z)); return g; }
const ifBanner = (x, y, z) => { const g = new THREE.Group(); g.add(mast(x, y, z, 30, IF.iron)); g.add(blk(10, 18, 0.6, IF.cloth, 'cloth', x + 5.5, y + 12, z)); g.add(blk(4, 4, 0.8, IF.lavaL, 'glow', x + 5.5, y + 16, z)); return g; };

const INFERNO3 = {
  hall(t) { // ratusz: budowla-łeb demona nad fosą lawy (wejście przez paszczę); 2: większy łeb i wieżyce po bokach; 3: korona kolców na czaszce i iglica z tyłu; 4: Pandemonium – olbrzymi łeb, dwie iglice i misy ognia
    const g = new THREE.Group(), R = [24, 30, 36, 42][t - 1];
    g.add(ifLava(0, R * 1.4, R * 3.6, 16)); g.add(blk(R * 2.8, 8, R * 2.4, IF.basD, 'ashlar', 0, 0, 0)); g.add(blk(R * 2.4, 6, R * 2, IF.bas, 'ashlar', 0, 8, 0)); g.add(blk(R * 0.8, 6, R * 1.2, IF.basL, 'ashlar', 0, 0, R * 1.4)); /* most */
    ifDemonHead(g, R, 0, 14, 0);
    if (t >= 2) for (const s of [-1, 1]) g.add(ifSpire(R * 0.28, R * 1.8, s * R * 1.25, -R * 0.4, { y: 8 }));
    if (t >= 3) { for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; g.add(cone(R * 0.07 / PXU, R * 0.4 / PXU, IF.iron, 'iron', P(Math.sin(a) * R * 0.9, 14 + R * 0.95 + Math.cos(a) * R * 0.98, -R * 0.1), [0, 0, -a], 6)); } g.add(ifSpire(R * 0.34, R * 2.6, 0, -R * 1.0, { y: 8, wins: 3 })); }
    if (t >= 4) for (const s of [-1, 1]) { g.add(ifSpire(R * 0.3, R * 2.2, s * R * 0.8, -R * 1.0, { y: 8 })); g.add(ifBowl(s * R * 1.7, 18, R * 0.9, 1.4)); }
    return g; },
  fort(t) { // fort: płot z kutych kolców i rogata brama; 2: bazaltowe mury z iglicami; 3: Cytadela Otchłani – wysoki zamek z rogatą koroną i wodospadami lawy
    const g = new THREE.Group();
    if (t === 1) { g.add(ifSpikes(-80, -18, 30)); g.add(ifSpikes(18, 80, 30)); for (const s of [-1, 1]) { g.add(blk(10, 36, 10, IF.basD, 'ashlar', s * 14, 0, 30)); g.add(cone(5 / PXU, 10 / PXU, IF.iron, 'iron', P(s * 14, 41, 30), null, 4)); } g.add(ifLava(0, 46, 50, 10)); return g; }
    g.add(ifLava(0, 52, 190, 14)); g.add(blk(170, 42, 12, IF.bas, 'ashlar', 0, 0, 34)); g.add(merlons(-84, 84, 42, 34, IF.bas, 'ashlar'));
    g.add(blk(42, 56, 18, IF.basD, 'ashlar', 0, 0, 37)); g.add(crenTop(42, 18, 56, IF.basD, 'ashlar', 0, 37)); g.add(opening(20, 32, 0, 0, 46.5, { glow: IF.lava, frame: IF.basL, frameKind: 'ashlar', bars: true, sill: false, frameW: 3 }));
    for (const s of [-1, 1]) { g.add(ifSpire(15, 64, s * 92, 34)); g.add(ifBanner(s * 26, 56, 38)); }
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
  tavern() { // karczma: niska kopuła z czarnej skały (jak piec), okrągłe okna od ognia, komin z płomieniem, kociołek przed wejściem, beczki
    const g = new THREE.Group(); g.add(cyl3(30, 32, 6, IF.basD, 'rock', 0, 0, -4, 18)); g.add(dome(28, 26, IF.bas, 'rock', 0, 6, -4)); g.add(opening(14, 18, 0, 6, 22, { glow: IF.lava, frame: IF.basL, frameKind: 'ashlar', sill: false }));
    for (const s of [-1, 1]) { const w = cyl3(4, 4, 2, IF.lava, 'win', 0, 0, 0, 12); w.material = lightMat('#ffa040'); w.rotation.x = Math.PI / 2; w.position.set(...P(s * 16, 18, 16)); g.add(w); }
    g.add(cyl3(5, 6, 30, IF.basD, 'rock', 14, 20, -14, 8)); ifFire(g, 14, 50, -14, 1.3); marker(g, 'fx:smoke', P(14, 62, -14));
    g.add(cyl3(6, 4.4, 7, IF.iron, 'iron', -26, 0, 28, 12)); g.add(cyl3(5.6, 5.6, 0.8, '#c8ff40', 'glow', -26, 7, 28, 12)); for (const [x, z] of [[30, 26], [37, 18]]) g.add(cyl3(5, 5, 10, '#4a2a20', 'wood', x, 0, z, 10)); return g; },
  market() { // targ: kramy pod czerwonym płótnem na żelaznych słupach, kosze siarki i klejnotów
    const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const x = -40 + i * 40; for (const dx of [-14, 14]) g.add(cyl3(1.3, 1.3, 26, IF.iron, 'iron', x + dx, 0, 6, 6)); g.add(blk(32, 8, 18, IF.basD, 'ashlar', x, 0, 10));
      g.add(gable(34, 22, 8, i % 2 ? IF.cloth : '#5a1a2a', 'cloth', x, 26, 6, 2)); g.add(sph(5 / PXU, [IF.sulf, '#c03040', '#ff9a30'][i], i === 1 ? 'gem' : 'rock', P(x, 10, 12), [1.4, 0.7, 1], 8)); } return g; },
  smith() { // kuźnia: palenisko wykute w skalnym występie, buchająca paszcza pieca, kowadło na pniu, miech, kanał lawy
    const g = new THREE.Group(); g.add(boulder(0, 0, -12, 32, '#2e2628', 31, 0.9)); g.add(opening(20, 16, 0, 0, 14, { glow: IF.lava, frame: IF.iron, frameKind: 'iron', sill: false })); glowMark(g, 0, 8, 18, 18, IF.lava);
    g.add(cyl3(6, 7, 26, IF.basD, 'rock', 16, 22, -18, 8)); ifFire(g, 16, 48, -18); g.add(ifLava(-26, 24, 30, 8));
    g.add(cyl3(4, 5, 8, '#4a2a20', 'wood', 22, 0, 24, 8)); g.add(blk(14, 5, 6, IF.iron, 'iron', 22, 8, 24)); g.add(blk(10, 6, 8, '#5a3a2a', 'leather', -18, 0, 10)); return g; },
  silo() { // skład: dwa żelazne zbiorniki siarki ze stożkowymi pokrywami, rynna, kopce żółtej siarki
    const g = new THREE.Group(); for (const [x, r, h] of [[-14, 12, 34], [14, 10, 28]]) { g.add(cyl3(r, r, h, IF.iron, 'iron', x, 0, -6, 14)); for (const y of [6, h - 6]) g.add(torus(r / PXU, 0.9 / PXU, '#4a3e40', 'iron', P(x, y, -6), [Math.PI / 2, 0, 0])); g.add(cone(r * 1.1 / PXU, r * 0.8 / PXU, IF.roofD, 'tiles', P(x, h + r * 0.4, -6), null, 14)); }
    const ch = blk(4, 2, 24, IF.iron, 'iron', 6, 14, 12); ch.rotation.x = 0.5; g.add(ch);
    for (const [x, z, r] of [[-28, 16, 10], [26, 18, 8], [6, 24, 7]]) g.add(sph(r / PXU, IF.sulf, 'rock', P(x, 0, z), [1, 0.7, 1], 10)); return g; },
  special() { // Brama piekieł: gruby pierścień-tunel z bazaltu na schodach, w głębi wir ognia, misy ognia i kolce
    const g = new THREE.Group(); g.add(blk(84, 6, 44, IF.basD, 'ashlar', 0, 0, -6)); g.add(blk(68, 6, 34, IF.bas, 'ashlar', 0, 6, -6));
    const outer = cyl3(36, 36, 26, IF.bas, 'ashlar', 0, 0, 0, 28, true); outer.rotation.x = Math.PI / 2; outer.position.set(...P(0, 44, -8)); g.add(outer); g.add(torus(32 / PXU, 5 / PXU, IF.basL, 'ashlar', P(0, 44, 5)));
    ifPortalRound(g, 0, 44, 5.5, 28, 24); for (const s of [-1, 1]) g.add(ifBowl(s * 46, 14, 12));
    for (let i = 0; i < 8; i++) { const a = Math.PI * (0.05 + i * 0.128); g.add(cone(2.4 / PXU, 10 / PXU, IF.iron, 'iron', P(Math.cos(a) * 40, 44 + Math.sin(a) * 40, -4), [0, 0, a - Math.PI / 2], 5)); } return g; },
  grail() { // Ołtarz Ognia: kolosalna schodkowa piramida z bazaltu otoczona rzekami lawy, na szczycie olbrzymia misa z kolumną ognia, rogate obeliski i łuk z rogów
    const g = new THREE.Group(); g.add(ifLava(0, 0, 230, 150, 28)); for (let i = 0; i < 5; i++) { const k = 1 - i * 0.17; g.add(blk(170 * k, 22, 120 * k, i % 2 ? IF.basD : IF.bas, 'ashlar', 0, i * 22, -10)); g.add(blk(170 * k + 3, 2.4, 120 * k + 3, IF.lava, 'glow', 0, (i + 1) * 22 - 1.2, -10)); }
    g.add(blk(26, 110, 14, IF.basL, 'ashlar', 0, 0, 46)); /* schody */ for (const s of [-1, 1]) { const f = blk(8, 110, 2, IF.lava, 'win', s * 18, 0, 48); f.material = lightMat('#ff6a1a'); g.add(f); } /* spływająca lawa */
    g.add(cyl3(30, 18, 16, IF.iron, 'iron', 0, 110, -10, 16)); g.add(torus(30 / PXU, 3 / PXU, IF.gold, 'gold', P(0, 126, -10), [Math.PI / 2, 0, 0]));
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = i ? 12 : 0, hh = i ? 40 + (i % 3) * 18 : 90; const fl = cone((i ? 9 : 18) / PXU, hh / PXU, i % 2 ? IF.fire : IF.lavaL, 'glow', P(Math.cos(a) * rr, 126 + hh / 2, -10 + Math.sin(a) * rr), null, 8); fl.material = lightMat(i % 2 ? '#ff7a20' : '#ffc040'); fl.material.transparent = true; fl.material.opacity = 0.85; g.add(fl); } glowMark(g, 0, 170, -10, 70, IF.fire);
    for (const s of [-1, 1]) { for (const z of [-60, 40]) g.add(ifSpire(9, 80 + (z > 0 ? 0 : 30), s * 104, z, { wins: 2 })); }
    return g; },
  dw1(t) { // krąg chochlików: krąg kolców wokół jamy lawy, chochliki; 2: klatka diablików – żelazna klatka; 3: kocioł biesów – wielki kocioł na ogniu
    const g = new THREE.Group(); g.add(ifLava(0, 0, 40, 26)); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; g.add(cone(3 / PXU, (14 + (i % 3) * 5) / PXU, IF.basL, 'rock', P(Math.cos(a) * 30, 7, Math.sin(a) * 20), [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], 6)); }
    if (t >= 2) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(cyl3(0.8, 0.8, 30, IF.iron, 'iron', -40 + Math.cos(a) * 10, 0, -14 + Math.sin(a) * 10, 5)); } g.add(cone(12 / PXU, 10 / PXU, IF.iron, 'iron', P(-40, 35, -14), null, 8)); }
    if (t >= 3) { g.add(cyl3(16, 12, 18, IF.iron, 'iron', 36, 6, -14, 16)); g.add(cyl3(15, 15, 1, '#a0ff40', 'glow', 36, 24, -14, 16)); ifFire(g, 36, 0, -6, 1.4); marker(g, 'fx:smoke', P(36, 30, -14)); }
    for (let i = 0; i < 3; i++) g.add(creature(t >= 3 ? 'bies' : t >= 2 ? 'familiar' : 'imp', -14 + i * 14, 0, 28, 0.55, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // hala gogów: przysadzista okrągła baszta z misą ognia na szczycie; 2: kuźnia magogów – niska przybudówka z kominami; 3: płonąca kuźnia – rzeka lawy
    const g = new THREE.Group(); g.add(cyl3(22, 24, 34, IF.bas, 'ashlar', 0, 0, -10, 14)); g.add(cyl3(25, 25, 4, IF.basD, 'ashlar', 0, 34, -10, 14)); g.add(cyl3(8, 5, 8, IF.iron, 'iron', 0, 38, -10, 10)); ifFire(g, 0, 44, -10, 2);
    g.add(opening(12, 18, 0, 0, 13.5, { glow: IF.lava, frame: IF.basL, frameKind: 'ashlar', sill: false })); for (const s of [-1, 1]) g.add(ifWin(5, 9, s * 13, 16, 9));
    g.add(creature(t >= 3 ? 'firebrand' : t >= 2 ? 'magog' : 'gog', 24, 0, 24, 0.55, -Math.PI / 2 + 0.4));
    if (t >= 2) { g.add(blk(40, 16, 24, IF.basD, 'ashlar', -36, 0, -4)); for (const x of [-46, -28]) { g.add(cyl3(4, 4, 22, IF.bas, 'ashlar', x, 16, -10, 8)); ifFire(g, x, 38, -10, 0.8); } }
    if (t >= 3) g.add(ifLava(-24, 26, 40, 12));
    return g; },
  dw3(t) { // psiarnia: skalna nora z żelazną klatką-wybiegiem i ogar; 2: legowisko cerberów – większa nora i drugie wejście; 3: psiarnia Otchłani – misy ognia
    const g = new THREE.Group(); g.add(boulder(-10, 0, -18, t >= 2 ? 34 : 28, '#2e2628', 33, 0.75)); g.add(opening(16, 12, -10, 0, 4, { glow: IF.lava, frame: IF.basD, frameKind: 'rubble', sill: false }));
    if (t >= 2) { g.add(boulder(28, 0, -14, 20, '#34282a', 34, 0.8)); g.add(opening(10, 9, 28, 0, 2, { inner: '#0a0404', frame: IF.basD, frameKind: 'rubble', sill: false })); }
    for (let i = 0; i < 13; i++) { const a = Math.PI * (i / 12); g.add(cyl3(0.8, 0.8, 18, IF.iron, 'iron', Math.cos(a) * 40, 0, 14 + Math.sin(a) * 16, 5)); }
    g.add(creature(t >= 3 ? 'abyssCerberus' : t >= 2 ? 'cerberus' : 'hellHound', 0, 0, 22, 0.6, -Math.PI / 2 + 0.4));
    if (t >= 3) for (const s of [-1, 1]) g.add(ifBowl(s * 48, 14, 26));
    return g; },
  dw4(t) { // brama demonów: dwa bazaltowe pylony z łukiem i ognisty portal; 2: wrota rogatych – rogi i kolce; 3: brama zagłady – wyższe pylony, fiolet zagłady
    const g = new THREE.Group(), H = t >= 3 ? 70 : 56; for (const s of [-1, 1]) { g.add(blk(16, H, 16, IF.bas, 'ashlar', s * 28, 0, -6)); g.add(cone(9 / PXU, 20 / PXU, IF.roof, 'tiles', P(s * 28, H + 10, -6), [0, Math.PI / 4, 0], 4)); }
    g.add(blk(72, 12, 22, IF.basD, 'ashlar', 0, H - 12, -6)); ifPortalRect(g, 0, 0, 4, 38, H - 14, 22, t >= 3 ? '#b060ff' : '#ff6a20');
    g.add(creature(t >= 3 ? 'doomDemon' : t >= 2 ? 'hornedDemon' : 'demon', 30, 0, 24, 0.55, -Math.PI / 2 + 0.5)); return g; },
  dw5(t) { // szyb czartów: okrągły szyb z płonącą otchłanią i żurawiem z łańcuchem; 2: otchłań władców – wieżyczki; 3: tron Otchłani – bazaltowy tron nad szybem
    const g = new THREE.Group(); g.add(cyl3(30, 32, 10, IF.bas, 'ashlar', 0, 0, -6, 18)); const pit = cyl3(24, 24, 1, IF.lava, 'win', 0, 10, -6, 18); pit.material = lightMat('#ff5a18'); g.add(pit); glowMark(g, 0, 16, -6, 30, IF.lava);
    g.add(cyl3(2, 2, 50, IF.iron, 'iron', -30, 0, -20, 6)); const arm = blk(40, 2, 2, IF.iron, 'iron', -12, 48, -20); g.add(arm); g.add(cyl3(0.6, 0.6, 30, IF.iron, 'iron', 6, 18, -20, 4));
    if (t >= 2) for (const s of [-1, 1]) g.add(ifSpire(7, 40, s * 40, -18));
    if (t >= 3) { g.add(blk(20, 30, 10, IF.basD, 'ashlar', 0, 10, -36)); g.add(blk(26, 6, 18, IF.bas, 'ashlar', 0, 10, -30)); }
    g.add(creature(t >= 3 ? 'archFiend' : t >= 2 ? 'pitLord' : 'pitFiend', 30, 0, 26, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw6(t) { // pałac ifrytów: pałac z cebulastą kopułą w kolorze ognia; 2: pałac sułtanów – minarety; 3: pałac płomieni – złote kopuły i ogień
    const g = new THREE.Group(); g.add(blk(60, 34, 44, IF.basL, 'ashlar', 0, 0, -10)); g.add(onionDome(22, t >= 3 ? IF.gold : '#c84a20', t >= 3 ? 'gold' : 'tiles', 0, 34, -10)); g.add(cone(1 / PXU, 12 / PXU, IF.gold, 'gold', P(0, 34 + 44 + 6, -10), null, 5));
    for (let i = 0; i < 3; i++) g.add(ifWin(8, 16, -18 + i * 18, 8, 12.2));
    if (t >= 2) for (const s of [-1, 1]) { g.add(cyl3(6, 5, 70, IF.basL, 'ashlar', s * 38, 0, -4, 10)); g.add(onionDome(7, '#c84a20', 'tiles', s * 38, 70, -4)); }
    if (t >= 3) for (const s of [-1, 1]) ifFire(g, s * 38, 86, -4, 1.4);
    g.add(creature(t >= 3 ? 'flameLord' : t >= 2 ? 'efreetSultan' : 'efreet', 40, 0, 28, 0.32, -Math.PI / 2 + 0.6)); return g; },
  dw7(t) { // wrota piekieł: olbrzymie wrota wykute w skale, za nimi łuna lawy, diabeł na schodach; 2: tron ognia – tron nad wrotami; 3: serce piekieł – pulsujące serce lawy i iglice
    const g = new THREE.Group(), k = t >= 3 ? 1.2 : 1; g.add(boulder(0, 0, -30, 70 * k, '#3e3034', 70, 0.8)); g.add(boulder(-58 * k, 0, -10, 34, '#46383a', 71, 0.8)); g.add(boulder(58 * k, 0, -14, 38, '#46383a', 72, 0.8));
    for (const sx of [-1, 1]) g.add(blk(14, 70, 26, IF.basD, 'ashlar', sx * 25, 0, 16)); g.add(blk(64, 14, 26, IF.basD, 'ashlar', 0, 56, 16)); ifPortalRect(g, 0, 0, 28, 36, 54, 24, '#ff5a18');
    for (let i = 0; i < 5; i++) g.add(blk(2, 56, 1.6, IF.iron, 'iron', -16 + i * 8, 0, 29.6));
    for (let i = 0; i < 4; i++) g.add(blk(60 - i * 8, 3, 8, IF.basL, 'ashlar', 0, i * 3, 34 + 8 - i * 2.5)); g.add(ifLava(0, 46, 120 * k, 14));
    if (t >= 2) { g.add(blk(24, 36, 12, IF.basD, 'ashlar', 0, 70, 18)); g.add(blk(30, 8, 20, IF.bas, 'ashlar', 0, 70, 24)); ifFire(g, -16, 78, 24); ifFire(g, 16, 78, 24); }
    if (t >= 3) { const h2 = sph(12 / PXU, '#c01a10', 'glow', P(0, 118, 18), [1, 1.2, 0.9], 14); h2.material = lightMat('#ff3a20'); g.add(h2); glowMark(g, 0, 118, 20, 30, '#ff3a20'); for (const s of [-1, 1]) g.add(ifSpire(10, 90, s * 70, -20)); }
    g.add(creature(t >= 3 ? 'hellLord' : t >= 2 ? 'archDevil' : 'devil', 34, 0, 44, 0.5, -Math.PI / 2 + 0.4)); return g; },
  ozd(t) { // ozdoby wtapiane w tło: 1 para mis ognia, 2 jeziorko lawy w bazalcie, 3 obelisk z kolcami, 4 kopczyk żużlu z żarem, 5 posąg demona
    const g = new THREE.Group();
    if (t === 1) for (const x of [-12, 12]) g.add(ifBowl(x, 14, 0));
    if (t === 2) { g.add(ifLava(0, 0, 30, 18)); for (const [x, z] of [[-16, -6], [14, -8]]) g.add(boulder(x, 0, z, 7, IF.bas, 80 + x, 0.7)); }
    if (t === 3) { g.add(blk(10, 4, 10, IF.basD, 'ashlar', 0, 0, 0)); const o = cyl3(3, 4.4, 36, IF.bas, 'ashlar', 0, 4, 0, 4); o.rotation.y = Math.PI / 4; g.add(o); g.add(cone(3 / PXU, 8 / PXU, IF.iron, 'iron', P(0, 44, 0), null, 4)); g.add(blk(2, 14, 0.6, IF.lava, 'glow', 0, 16, 3.2)); }
    if (t === 4) { g.add(boulder(0, 0, 0, 10, '#2a2224', 84, 0.7)); g.add(boulder(6, 6, -2, 6, '#302628', 85, 0.8)); g.add(blk(1.4, 9, 0.6, IF.lava, 'glow', -2, 2, 7)); glowMark(g, 0, 5, 8, 6, IF.lava); } /* kopczyk żużlu z żarzącą się szczeliną */
    if (t === 5) { g.add(blk(14, 8, 12, IF.basD, 'ashlar', 0, 0, 0)); g.add(creature('demon', 0, 8, 0, 0.45, -Math.PI / 2)); }
    return g; },
};
TOWN3.inferno = INFERNO3;
