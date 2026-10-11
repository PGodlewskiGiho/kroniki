// Budowle Manufaktury (miasto wynalazców) w 3D: hale z czerwonej cegły z dachami szedowymi (przeszklone ząbki), miedziane kopuły,
// żeliwne kratownice, wysokie kominy z dymem, kotły i zbiorniki, zębatki na fasadach, wieże z cewkami iskier i hangary maszyn latających.
// Zamek „z przyszłości” widziany oczami średniowiecza: XIX-wieczna fabryka, nie laboratorium z laserami.
// Te same zasady co budowle-kurhan.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.forge = { hall(t), fort(t), … }.
'use strict';
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, mast, glowMark, creature, lightMat, dome, chimney, coneRoof, hangBanner, finial */
const MZ = { brick: '#9a4a32', brickD: '#6e3424', brickL: '#b8644a', iron: '#3a3a42', ironL: '#5a5a64', copper: '#b8703a', patina: '#5a9a84', brass: '#c8a050',
  glass: '#9ad0e0', spark: '#8ae0ff', fire: '#ffa040', soot: '#2a2622', stone: '#8a8078', stoneD: '#5e5650', wood: '#5a3a22', slate: '#4a4a56' };
// --- drobne bryły ---
const mzWin = (w, h, x, y, z, glow = '#ffc070') => opening(w, h, x, y, z, { glow, frame: MZ.stoneD, frameKind: 'ashlar', arch: true });
// Zębatka na fasadzie (tarcza z zębami w płaszczyźnie xy, oś z), w pikselach sceny
function mzGear(r, x, y, z, col = MZ.brass, n = 12, th = 2.4) { const g = new THREE.Group(); g.position.set(...P(x, y, z)); g.add(cyl3(r * 0.84, r * 0.84, th, col, 'gold', 0, -th / 2, 0, 24)); g.children[0].rotation.x = Math.PI / 2;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = blk(r * 0.28, r * 0.26, th, col, 'gold', 0, 0, 0); b.position.set(Math.cos(a) * r * 0.94 / PXU, Math.sin(a) * r * 0.94 / PXU, 0); b.rotation.z = a; g.add(b); }
  const hub = cyl3(r * 0.28, r * 0.28, th * 1.6, DK(col, 0.3), 'iron', 0, -th * 0.8, 0, 12); hub.rotation.x = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 3; i++) { const sp = blk(r * 0.12, r * 1.5, th * 1.1, DK(col, 0.15), 'gold', 0, -r * 0.75, 0); sp.rotation.z = i * Math.PI / 3; g.add(sp); } return g; }
// Dach szedowy: n ząbków (strome przeszklone zbocze na północ, czyli do tyłu), na hali w × d przy wysokości y
function mzSawtooth(w, d, n, y, x = 0, z = 0, col = MZ.slate) { const g = new THREE.Group(), s = d / n;
  for (let i = 0; i < n; i++) { const z0 = z - d / 2 + i * s, h = s * 0.6, sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(s / PXU, 0), new THREE.Vector2(s / PXU, h / PXU)]);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: w / PXU, bevelEnabled: false }), m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.75, metalness: 0.2 })); m.rotation.y = -Math.PI / 2; m.position.set(...P(x + w / 2, y, z0)); g.add(m);
    const gl = blk(w - 4, h - 2, 0.8, MZ.glass, 'gem', x, y + 1, z0 + s - 0.6); g.add(gl); } return g; }
// Hala z cegły: ściany w × h × d, pilastry, rząd łukowych okien, gzyms
function mzHall(w, h, d, x = 0, z = 0, { y = 0, col = MZ.brick, wins = 3, glow = '#ffc070' } = {}) { const g = new THREE.Group(); g.add(blk(w, h, d, col, 'brick', x, y, z)); g.add(blk(w + 3, 3, d + 3, MZ.stoneD, 'ashlar', x, y + h, z));
  g.add(blk(w + 2, 4, d + 2, MZ.stoneD, 'ashlar', x, y, z)); for (let i = 0; i <= wins; i++) g.add(blk(4, h, 2, DK(col, 0.15), 'brick', x - w / 2 + i * w / wins, y, z + d / 2 + 0.6));
  for (let i = 0; i < wins; i++) g.add(mzWin(w / wins * 0.42, h * 0.5, x - w / 2 + (i + 0.5) * w / wins, y + h * 0.22, z + d / 2, glow)); return g; }
// Komin fabryczny: okrągły z cegły, opaski z żelaza, dym (fx:smoke)
function mzStack(x, z, h = 70, r = 5, y = 0) { const g = new THREE.Group(); g.add(cyl3(r * 1.3, r, h, MZ.brickD, 'brick', x, y, z, 14)); for (const f of [0.3, 0.6, 0.9]) g.add(cyl3(r * (1.3 - 0.3 * f) + 0.6, r * (1.3 - 0.3 * f) + 0.6, 1.6, MZ.iron, 'iron', x, y + h * f, z, 14));
  g.add(cyl3(r + 1.4, r + 1, 3, MZ.soot, 'iron', x, y + h, z, 14)); marker(g, 'fx:smoke', P(x, y + h + 6, z)); return g; }
// Zbiornik (kocioł, gazometr): walec z dennicami, nity, drabinka
function mzTank(r, h, x, z, y = 0, col = MZ.copper) { const g = new THREE.Group(); g.add(cyl3(r, r, h, col, 'metal', x, y, z, 20)); g.add(dome(r, r * 0.4, col, 'metal', x, y + h, z));
  for (const f of [0.2, 0.5, 0.8]) g.add(cyl3(r + 0.5, r + 0.5, 1.2, DK(col, 0.25), 'gold', x, y + h * f, z, 20)); for (let i = 0; i < 6; i++) g.add(blk(5, 1, 1, MZ.iron, 'iron', x + r + 1, y + 4 + i * h / 7, z)); return g; }
// Cewka iskier: wieżyczka z miedzianą spiralą i świecącą kulą (blask), łuk wyładowania do drugiej
function mzCoil(x, z, h = 40, y = 0, s = 1) { const g = new THREE.Group(); g.add(cyl3(3 * s, 3 * s, h, MZ.ironL, 'iron', x, y, z, 10));
  for (let i = 0; i < 10; i++) g.add(torus((5 - i * 0.2) * s / PXU, 0.9 * s / PXU, MZ.copper, 'metal', P(x, y + h * 0.35 + i * h * 0.05, z), [Math.PI / 2, 0, 0]));
  const o = sph(5 * s / PXU, MZ.spark, 'glow', P(x, y + h + 5 * s, z), null, 14); o.material = lightMat('#bff4ff'); g.add(o); g.add(torus(8 * s / PXU, 1.2 * s / PXU, MZ.brass, 'gold', P(x, y + h + 5 * s, z), [Math.PI / 2, 0, 0])); glowMark(g, x, y + h + 5 * s, z, 16 * s, MZ.spark); return g; }
function mzBolt(a, b, seed = 1) { const g = new THREE.Group(), R = rng(seed), pts = []; for (let i = 0; i <= 6; i++) { const f = i / 6, j = i && i < 6 ? 1 : 0; pts.push(P(a[0] + (b[0] - a[0]) * f + j * (R() - 0.5) * 10, a[1] + (b[1] - a[1]) * f + j * (R() - 0.5) * 10, a[2] + (b[2] - a[2]) * f)); }
  const t = tube(pts, 0.9 / PXU, 0.5 / PXU, MZ.spark, 'glow'); t.traverse(m => { if (m.isMesh) m.material = lightMat('#d8f8ff'); }); g.add(t); return g; }
// Kratownica (żelazne dźwigary) między dwoma punktami: dwa pasy i krzyżulce
function mzTruss(x0, x1, y, z, h = 8) { const g = new THREE.Group(), w = x1 - x0; g.add(blk(w, 1.6, 1.6, MZ.iron, 'iron', (x0 + x1) / 2, y, z)); g.add(blk(w, 1.6, 1.6, MZ.iron, 'iron', (x0 + x1) / 2, y + h, z));
  const n = Math.max(2, Math.round(w / h)); for (let i = 0; i < n; i++) { const b = blk(1.2, Math.hypot(w / n, h), 1.2, MZ.ironL, 'iron', 0, 0, 0); b.geometry.center(); b.position.set(...P(x0 + (i + 0.5) * w / n, y + h / 2 + 0.8, z)); b.rotation.z = (i % 2 ? 1 : -1) * Math.atan2(w / n, h); g.add(b); } return g; }
// Latarnia gazowa
const mzLamp = (x, z, h = 22) => { const g = new THREE.Group(); g.add(cyl3(0.9, 0.7, h, MZ.iron, 'iron', x, 0, z, 6)); g.add(blk(4, 5, 4, MZ.iron, 'iron', x, h, z)); const l = blk(3, 3.6, 3, '#ffd080', 'glow', x, h + 0.7, z); l.material = lightMat('#ffd890'); g.add(l); glowMark(g, x, h + 2, z, 8, '#ffd080'); return g; };
const mzCrates = (x, z, s = 1) => { const g = new THREE.Group(); for (const [dx, dy, dz, k] of [[0, 0, 0, 1], [7, 0, 2, 0.8], [3, 6, 1, 0.7]]) g.add(blk(7 * k * s, 6 * k * s, 7 * k * s, MZ.wood, 'planks', x + dx * s, dy * s, z + dz * s));
  g.add(cyl3(3 * s, 3 * s, 7 * s, '#6a4a2a', 'planks', x - 7 * s, 0, z + 3 * s, 10)); return g; };

const FORGE3 = {
  hall(t) { // ratusz: ceglany dom kupców z zegarem; 2: ratusz miejski z wieżą zegarową; 3: magistrat z miedzianą kopułą; 4: Izba Wynalazców – kopuła z patyną, dwie wieże, wielka zębatka nad wejściem
    const g = new THREE.Group(), w = [60, 72, 86, 100][t - 1]; g.add(blk(w + 30, 3, 70, MZ.stone, 'cobble', 0, 0, 0));
    g.add(mzHall(w, 32 + t * 4, 40, 0, -6, { wins: 3 })); g.add(gable(w, 40, 16, MZ.slate, 'shingle', 0, 32 + t * 4, -6, 4, MZ.brick, 'brick'));
    g.add(door(14, 20, 0, 4, 14.6, '#3a2a1a', MZ.stoneD)); g.add(mzGear(8, 0, 30 + t * 4, 15.4));
    if (t >= 2) { const th = 70 + t * 8; g.add(blk(20, th, 20, MZ.brickL, 'brick', -w / 2 - 6, 0, -10)); g.add(cyl3(8, 8, 1.4, '#f0e8d0', 'plaster', -w / 2 - 6, th - 18, 0.6, 20)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
      g.add(coneRoof(14, 18, MZ.slate, 'tiles', -w / 2 - 6, th, -10, 4)); g.add(blk(1.2, 7, 1.2, MZ.iron, 'iron', -w / 2 - 6, th - 22, 1.6)); }
    if (t >= 3) { g.add(dome(18, 20, t >= 4 ? MZ.patina : MZ.copper, 'metal', 0, 52 + t * 4, -6)); g.add(finial(0, 72 + t * 4, -6, MZ.brass)); }
    if (t >= 4) { g.add(blk(20, 104, 20, MZ.brickL, 'brick', w / 2 + 6, 0, -10)); g.add(dome(11, 14, MZ.patina, 'metal', w / 2 + 6, 104, -10)); g.add(mzGear(16, 0, 70, 12)); g.add(mzStack(w / 2 - 10, -26, 80, 4)); g.add(hangBanner(-20, 42, 15, 9, 20, '#3a5a7a', MZ.brass)); g.add(hangBanner(20, 42, 15, 9, 20, '#3a5a7a', MZ.brass)); }
    return g; },
  fort(t) { // fort: ceglany mur z żelazną bramą kratową; 2: cytadela – okrągłe baszty z miedzianymi hełmami i armatami; 3: Zamek Manufaktury – stalowa twierdza z trzema kominami, wieżą zegarową i działami
    const g = new THREE.Group();
    g.add(blk(170, 40, 12, MZ.brick, 'brick', 0, 0, 34)); g.add(blk(174, 4, 15, MZ.stoneD, 'ashlar', 0, 40, 34)); for (let x = -82; x <= 82; x += 10) if (Math.abs(x) > 24) g.add(blk(6, 6, 12, MZ.brickD, 'brick', x, 44, 34));
    g.add(blk(48, 54, 20, MZ.brickD, 'brick', 0, 0, 36)); g.add(opening(24, 34, 0, 0, 46.5, { inner: '#14100c', frame: MZ.iron, frameKind: 'iron', bars: true, sill: false, arch: true })); g.add(mzGear(10, 0, 44, 46.8));
    if (t === 1) { for (const s of [-1, 1]) g.add(blk(18, 52, 18, MZ.brickD, 'brick', s * 88, 0, 34)); return g; }
    for (const s of [-1, 1]) { g.add(cyl3(17, 15, 66, MZ.brickL, 'brick', s * 94, 0, 34, 18)); g.add(dome(17, 14, MZ.copper, 'metal', s * 94, 66, 34)); g.add(finial(s * 94, 80, 34, MZ.brass));
      const cn = cyl3(2.6, 2.2, 22, MZ.iron, 'iron', 0, 0, 0, 10); cn.rotation.x = Math.PI / 2; cn.position.set(...P(s * 94, 40, 56)); g.add(cn); g.add(mast(s * 24, 54, 40, 26)); }
    if (t >= 3) { g.add(mzHall(130, 70, 70, 0, -34, { col: MZ.brick, wins: 4 })); g.add(blk(110, 46, 56, MZ.ironL, 'iron', 0, 70, -38)); for (let i = 0; i < 5; i++) g.add(blk(2, 46, 58, MZ.iron, 'iron', -44 + i * 22, 70, -38));
      g.add(blk(40, 60, 36, MZ.brickL, 'brick', 0, 116, -42)); g.add(cyl3(10, 10, 1.6, '#f0e8d0', 'plaster', 0, 156, -24, 24)); g.children[g.children.length - 1].rotation.x = Math.PI / 2; g.add(dome(22, 22, MZ.patina, 'metal', 0, 176, -42)); g.add(finial(0, 198, -42, MZ.brass));
      for (const s of [-1, 0, 1]) g.add(mzStack(s * 44, -60, 110 + Math.abs(s) * -14, 6, 70)); for (const s of [-1, 1]) g.add(mzTank(12, 30, s * 74, -10, 0, MZ.copper)); }
    return g; },
  guild(t) { // laboratorium: ceglany dom z oszkloną kopułą obserwatorium; 2: cewka iskier na dachu; 3: szklarnia z retortami; 4: luneta i druga kopuła; 5: wysoka iglica z cewką i łukami wyładowań
    const g = new THREE.Group(); g.add(mzHall(56, 34, 36, 0, -6, { wins: 2, glow: '#c0f0ff' })); g.add(dome(20, 18, MZ.glass, 'gem', 0, 37, -6)); for (let i = 0; i < 8; i++) { const b = blk(1.2, 20, 1.2, MZ.brass, 'gold', 0, 0, 0); b.position.set(...P(Math.cos(i * 0.785) * 14, 44, -6 + Math.sin(i * 0.785) * 14)); b.rotation.set(Math.sin(i * 0.785) * 0.7, 0, -Math.cos(i * 0.785) * 0.7); g.add(b); }
    g.add(door(12, 18, 0, 4, 12.6, '#2a2a3a', MZ.stoneD));
    if (t >= 2) g.add(mzCoil(-34, -14, 36));
    if (t >= 3) { g.add(blk(34, 20, 26, MZ.glass, 'gem', 40, 0, -2)); g.add(gable(34, 26, 10, MZ.glass, 'gem', 40, 20, -2, 1)); for (let i = 0; i < 4; i++) g.add(sph(3 / PXU, ['#80ff90', '#ffa0f0', '#80d0ff', '#ffd060'][i], 'glow', P(30 + i * 7, 6, 8), [1, 1.3, 1], 10)); }
    if (t >= 4) { const sc = cyl3(3, 4, 40, MZ.brass, 'gold', 0, 0, 0, 12); sc.rotation.z = -0.8; sc.position.set(...P(14, 64, -6)); g.add(sc); g.add(dome(12, 11, MZ.copper, 'metal', -24, 34, -18)); }
    if (t >= 5) { g.add(blk(14, 70, 14, MZ.brickL, 'brick', 34, 0, -26)); g.add(mzCoil(34, -26, 34, 70, 1.3)); g.add(mzBolt([-34, 56, -14], [34, 112, -26], 7)); }
    return g; },
  tavern() { // karczma „Pod Zębatką”: ceglany pub z wykuszem, szyld z kołem zębatym, beczki z piwem, komin
    const g = new THREE.Group(); g.add(mzHall(58, 26, 32, 0, -6, { wins: 2 })); g.add(gable(58, 32, 14, MZ.slate, 'shingle', 0, 26, -6, 4, MZ.brick, 'brick')); g.add(chimney(18, 32, -10, 18, MZ.brickD));
    g.add(door(11, 16, -10, 4, 10.6, '#4a2a18', MZ.stoneD)); g.add(blk(2, 2, 14, MZ.iron, 'iron', 14, 22, 16)); g.add(mzGear(5.5, 14, 14, 22)); for (const [x, z] of [[-30, 18], [-24, 24], [32, 20]]) g.add(cyl3(4.4, 4.4, 9, '#6a4a2a', 'planks', x, 0, z, 12)); g.add(mzLamp(26, 24, 20)); return g; },
  market() { // targ: hala targowa z żeliwa i szkła (łukowy dach na kolumnach), stragany z towarem pod spodem
    const g = new THREE.Group(); for (let i = 0; i < 4; i++) for (const z of [-14, 22]) g.add(cyl3(1.6, 1.4, 26, MZ.iron, 'iron', -42 + i * 28, 0, z, 8));
    for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI, b = blk(92, 1.6, 9, i % 2 ? MZ.glass : MZ.ironL, i % 2 ? 'gem' : 'iron', 0, 0, 0); b.position.set(...P(0, 26 + Math.sin(a) * 16, 4 - Math.cos(a) * 18)); b.rotation.x = -(a - Math.PI / 2); g.add(b); }
    for (let i = 0; i < 3; i++) { g.add(blk(18, 8, 10, MZ.wood, 'planks', -30 + i * 30, 0, 6)); g.add(blk(20, 1, 12, ['#a03a2a', '#3a6a8a', '#c8a040'][i], 'cloth', -30 + i * 30, 12, 6)); } g.add(mzCrates(40, 26, 0.8)); return g; },
  smith() { // kuźnia: hala z młotem parowym widocznym przez wrota, żar paleniska, wysoki komin, kowadło i sterta sztab
    const g = new THREE.Group(); g.add(mzHall(54, 30, 34, 0, -8, { wins: 2, glow: '#ff9a40' })); g.add(mzSawtooth(54, 34, 3, 30, 0, -8)); g.add(mzStack(-22, -20, 64, 4.5));
    g.add(opening(18, 22, 8, 0, 9.4, { glow: '#ff8a30', frame: MZ.iron, frameKind: 'iron', arch: false, sill: false })); glowMark(g, 8, 10, 12, 16, MZ.fire);
    g.add(blk(10, 4, 6, MZ.iron, 'iron', -24, 7, 18)); g.add(cyl3(3.6, 4.4, 7, MZ.wood, 'wood', -24, 0, 18, 8)); for (let i = 0; i < 4; i++) g.add(blk(14, 2, 3, MZ.ironL, 'iron', 30, i * 2, 18 - i)); return g; },
  silo() { // skład zasobów: gazometr i dwa zbiorniki na kratownicy, hałda węgla i rudy
    const g = new THREE.Group(); g.add(mzTank(18, 34, -18, -12)); g.add(mzTank(10, 26, 18, -18, 8, MZ.brass)); g.add(mzTank(9, 22, 30, 4, 8, MZ.copper)); for (const [x, z] of [[18, -18], [30, 4]]) for (const dx of [-6, 6]) g.add(blk(1.6, 8, 1.6, MZ.iron, 'iron', x + dx, 0, z));
    const coal = cone(14 / PXU, 10 / PXU, '#1e1c1c', 'rock', P(-30, 5, 18), null, 9); g.add(coal); g.add(cone(10 / PXU, 7 / PXU, '#7a5a4a', 'rock', P(6, 3.5, 22), null, 8)); return g; },
  special() { // Warsztat machin: otwarta hala z suwnicą, pod nią balista, wóz z amunicją i namiot medyka „na taśmie”, wielka zębatka
    const g = new THREE.Group(); g.add(blk(96, 3, 50, MZ.stone, 'cobble', 0, 0, 0)); for (const x of [-44, 44]) for (const z of [-20, 18]) g.add(blk(5, 44, 5, MZ.iron, 'iron', x, 0, z));
    g.add(mzTruss(-46, 46, 44, -20, 8)); g.add(mzTruss(-46, 46, 44, 18, 8)); g.add(blk(8, 6, 44, MZ.brass, 'gold', 6, 46, -1)); g.add(cyl3(0.5, 0.5, 18, MZ.iron, 'iron', 6, 28, 4, 4)); g.add(blk(6, 4, 4, MZ.iron, 'iron', 6, 26, 4));
    g.add(blk(80, 4, 14, MZ.ironL, 'iron', 0, 0, 8)); g.add(creature('ballista', -26, 4, 8, 0.6, -Math.PI / 2 + 0.3)); g.add(creature('ammoCart', 6, 4, 8, 0.6, -Math.PI / 2 + 0.3)); g.add(creature('firstAid', 34, 4, 8, 0.5, -Math.PI / 2 + 0.3));
    g.add(mzGear(14, -40, 30, -18)); g.add(mzGear(9, -24, 36, -18, MZ.copper, 10)); return g; },
  grail() { // Wieczny Silnik: kolosalna machina, która kręci się bez paliwa – pionowe koło zębate w żelaznej ramie, wokół niego
    // obręcze orrery z kulami, w osi świecące serce (zaklęta iskra), tłoki po bokach, kominy z dymem i łuki wyładowań do dwóch wież
    const g = new THREE.Group(); g.add(cyl3(84, 90, 10, MZ.stoneD, 'ashlar', 0, 0, 0, 24)); g.add(cyl3(70, 74, 8, MZ.stone, 'ashlar', 0, 10, 0, 24));
    for (const s of [-1, 1]) { g.add(blk(14, 150, 20, MZ.iron, 'iron', s * 66, 18, -10)); g.add(blk(18, 8, 24, MZ.brass, 'gold', s * 66, 164, -10)); }
    g.add(blk(146, 10, 16, MZ.ironL, 'iron', 0, 168, -10)); g.add(mzGear(58, 0, 98, -6, MZ.brass, 24, 6)); g.add(mzGear(26, 0, 98, 2, MZ.copper, 14, 5));
    const core = sph(16 / PXU, MZ.spark, 'glow', P(0, 98, 6), null, 18); core.material = lightMat('#c8f8ff'); g.add(core); glowMark(g, 0, 98, 10, 60, MZ.spark);
    for (let i = 0; i < 3; i++) { const r = torus((38 + i * 14) / PXU, 1.4 / PXU, MZ.brass, 'gold', P(0, 98, 6), [0.5 + i * 0.6, i * 0.9, 0]); g.add(r); const a = i * 2.1; g.add(sph((5 - i) / PXU, ['#e0c060', '#b8703a', '#8ad0ff'][i], 'gold', P(Math.cos(a) * (38 + i * 14), 98 + Math.sin(a) * (38 + i * 14) * 0.6, 6), null, 12)); }
    for (const s of [-1, 1]) { const pi = cyl3(5, 5, 60, '#c8ccd4', 'steel', 0, 0, 0, 12); pi.rotation.z = s * 0.5; pi.position.set(...P(s * 40, 50, 10)); g.add(pi); g.add(cyl3(8, 8, 26, MZ.iron, 'iron', s * 56, 18, 12, 12));
      g.add(mzCoil(s * 106, -20, 90, 0, 1.6)); g.add(mzBolt([s * 106, 98, -20], [s * 18, 98, 4], 11 + s)); g.add(mzStack(s * 46, -40, 130, 6, 18)); }
    return g; },
  dw1(t) { // warsztat czeladników: mały ceglany warsztat z szyldem-kołem, stół z imadłem; 2: pracownia mechaników – żuraw i skrzynie; 3: parowozownia – półokrągła hala z małą lokomotywą
    const g = new THREE.Group(); g.add(mzHall(40, 22, 26, -6, -8, { wins: 2 })); g.add(gable(40, 26, 10, MZ.slate, 'shingle', -6, 22, -8, 3, MZ.brick, 'brick')); g.add(mzGear(6, -6, 20, 5.6)); g.add(blk(16, 7, 7, MZ.wood, 'planks', 24, 0, 12)); g.add(blk(4, 4, 4, MZ.iron, 'iron', 20, 7, 12));
    if (t >= 2) { g.add(blk(3, 44, 3, MZ.iron, 'iron', 30, 0, -16)); const arm = blk(30, 3, 3, MZ.iron, 'iron', 20, 42, -16); g.add(arm); g.add(cyl3(0.4, 0.4, 14, MZ.iron, 'iron', 8, 28, -16, 4)); g.add(mzCrates(8, -16, 0.7)); }
    if (t >= 3) { const rh = cyl3(26, 26, 20, MZ.brick, 'brick', -40, 0, -6, 20, false); rh.scale.z = 0.6; g.add(rh); g.add(dome(26, 10, MZ.slate, 'shingle', -40, 20, -6)); g.add(mzTank(5, 14, -40, 22, 0, '#3a3a42')); g.add(mzStack(-40, 30, 22, 2.4, 0)); }
    for (let i = 0; i < Math.min(3, t + 1); i++) g.add(creature(t >= 3 ? 'machinist' : t >= 2 ? 'mechanic' : 'apprentice', -16 + i * 14, 0, 26, 0.5, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // prochownia: kamienny magazyn prochu z grubymi murami i piorunochronem, beczki; 2: strzelnica muszkieterów – tarcze na wale; 3: arsenał granatów – piramidy kul i czerwony proporzec
    const g = new THREE.Group(); g.add(blk(40, 24, 30, MZ.stone, 'ashlar', 0, 0, -10)); g.add(gable(40, 30, 12, MZ.slate, 'shingle', 0, 24, -10, 2, MZ.stone, 'ashlar')); g.add(door(10, 14, 0, 0, 5.6, '#4a2a18', MZ.stoneD)); g.add(blk(1, 22, 1, MZ.copper, 'metal', 0, 36, -10));
    for (const [x, z] of [[-26, 10], [-20, 16], [24, 12]]) g.add(cyl3(4, 4, 8, '#5a3a22', 'planks', x, 0, z, 10));
    if (t >= 2) { g.add(blk(60, 10, 8, '#6a5a44', 'dirt', 0, 0, -40)); for (let i = 0; i < 3; i++) { const tg = cyl3(4, 4, 1, '#e8e0d0', 'plaster', -20 + i * 20, 12, -36, 16); tg.rotation.x = Math.PI / 2; g.add(tg); g.add(cyl3(1.6, 1.6, 1.2, '#a02a20', 'cloth', -20 + i * 20, 12, -35.4, 12)); g.children[g.children.length - 1].rotation.x = Math.PI / 2; } }
    if (t >= 3) { for (let k = 0; k < 3; k++) for (let i = 0; i < 3 - k; i++) g.add(sph(3.2 / PXU, '#2a2a2a', 'iron', P(36 + i * 6.4 + k * 3.2, 3.2 + k * 5.4, -2), null, 10)); g.add(mast(-34, 0, -24, 40)); }
    g.add(creature(t >= 3 ? 'grenadier' : t >= 2 ? 'musketeer' : 'handgunner', 14, 0, 22, 0.55, -Math.PI / 2 + 0.4)); return g; },
  dw3(t) { // psiarnia zębatek: hala montażowa z bramą, na taśmie ogar w budowie; 2: stalowa psiarnia – kocioł i komin; 3: burzowa psiarnia – dwie cewki
    const g = new THREE.Group(); g.add(mzHall(56, 26, 34, 0, -12, { wins: 2 })); g.add(mzSawtooth(56, 34, 3, 26, 0, -12)); g.add(opening(20, 18, 0, 0, 5.6, { inner: '#1a1410', frame: MZ.iron, frameKind: 'iron', arch: false, sill: false }));
    g.add(blk(60, 3, 10, MZ.ironL, 'iron', 0, 0, 14)); g.add(mzGear(7, 30, 20, 5.6));
    if (t >= 2) { g.add(mzTank(9, 24, -38, -2, 0, MZ.copper)); g.add(mzStack(20, -24, 58, 3.6, 26)); }
    if (t >= 3) { g.add(mzCoil(-36, 22, 24)); g.add(mzCoil(36, 22, 24)); g.add(mzBolt([-36, 53, 22], [36, 53, 22], 3)); }
    g.add(creature(t >= 3 ? 'stormHound' : t >= 2 ? 'steelHound' : 'clockHound', 4, 3, 14, 0.6, -Math.PI / 2 + 0.4)); return g; },
  dw4(t) { // hangar: półokrągła hala z blachy falistej z wielkimi wrotami, na placu ornitopter; 2: wieża wiropłatów – lądowisko na kratownicy; 3: dok bombowców – drugi hangar i bomby
    const g = new THREE.Group(), hg = cyl3(30, 30, 70, MZ.ironL, 'iron', 0, 0, 0, 20, false); hg.rotation.x = Math.PI / 2; hg.scale.set(1, 1, 0.75); hg.position.set(...P(0, 0, -20)); g.add(hg);
    g.add(opening(34, 24, 0, 0, 14.5, { inner: '#14100c', frame: MZ.copper, frameKind: 'metal', arch: true, sill: false })); for (let i = 0; i < 5; i++) g.add(torus(30 / PXU, 1.2 / PXU, MZ.copper, 'metal', P(0, 0, -50 + i * 15), [0, 0, 0], [1, 0.75, 1], Math.PI));
    if (t >= 2) { for (const [x, z] of [[40, -30], [64, -30], [40, -8], [64, -8]]) g.add(blk(2, 50, 2, MZ.iron, 'iron', x, 0, z)); g.add(blk(30, 3, 28, MZ.ironL, 'iron', 52, 50, -19)); g.add(creature('gyrocopter', 52, 53, -19, 0.45, -Math.PI / 2 + 0.4)); }
    if (t >= 3) { const h2 = cyl3(22, 22, 50, MZ.iron, 'iron', 0, 0, 0, 18, false); h2.rotation.x = Math.PI / 2; h2.scale.set(1, 1, 0.75); h2.position.set(...P(-56, 0, -30)); g.add(h2); for (let i = 0; i < 4; i++) g.add(sph(3.4 / PXU, '#2a2a2a', 'iron', P(-40 + i * 7, 3.4, 18), null, 10)); }
    g.add(creature(t >= 3 ? 'bomber' : t >= 2 ? 'gyrocopter' : 'ornithopter', 0, 0, 30, 0.55, -Math.PI / 2 + 0.4)); return g; },
  dw5(t) { // iskrownia: ceglana wieża z miedzianą cewką i kulą iskier; 2: wieża cewek – wyższa, druga cewka i łuk; 3: iglica burz – smukła stalowa iglica z pierścieniami i wieloma łukami
    const g = new THREE.Group(), h = [56, 70, 82][t - 1]; g.add(cyl3(16, 13, h, MZ.brick, 'brick', 0, 0, -10, 16)); g.add(cyl3(17, 17, 4, MZ.stoneD, 'ashlar', 0, h, -10, 16)); g.add(mzCoil(0, -10, 30, h + 4, 1.2)); g.add(door(10, 16, 0, 0, 3, '#2a2a3a', MZ.stoneD));
    for (let i = 0; i < 2; i++) g.add(mzWin(6, 10, 0, 18 + i * 20, 3.4, '#c0f0ff'));
    if (t >= 2) { g.add(blk(14, 44, 14, MZ.brickL, 'brick', 36, 0, -2)); g.add(mzCoil(36, -2, 22, 44)); g.add(mzBolt([0, h + 40, -10], [36, 75, -2], 5)); }
    if (t >= 3) { g.add(cone(6 / PXU, 60 / PXU, MZ.ironL, 'iron', P(-36, 30, -16), null, 8)); for (let i = 0; i < 3; i++) g.add(torus((7 - i) / PXU, 1 / PXU, MZ.brass, 'gold', P(-36, 14 + i * 14, -16), [Math.PI / 2, 0, 0])); g.add(mzBolt([-36, 60, -16], [0, h + 40, -10], 9)); }
    g.add(creature(t >= 3 ? 'stormLord' : t >= 2 ? 'sparkMaster' : 'sparkwright', 20, 0, 20, 0.55, -Math.PI / 2 + 0.4)); return g; },
  dw6(t) { // kotłownia: niska ceglana hala z dwoma kotłami i kominem; 2: walcownia – walce i żar; 3: kuźnia gromów – cewki na dachu i trzeci kocioł
    const g = new THREE.Group(); g.add(mzHall(70, 30, 40, -6, -14, { wins: 3, glow: '#ff9a40' })); g.add(mzSawtooth(70, 40, 4, 30, -6, -14)); g.add(mzStack(-34, -26, 76, 5));
    for (const x of [26, 46]) g.add(mzTank(9, 26, x, 18, 0, MZ.copper)); g.add(opening(20, 22, -6, 0, 6.6, { glow: '#ff8030', frame: MZ.iron, frameKind: 'iron', arch: false, sill: false })); glowMark(g, -6, 10, 9, 18, MZ.fire);
    if (t >= 2) for (let i = 0; i < 2; i++) { const r = cyl3(5, 5, 30, MZ.ironL, 'steel', 0, 0, 0, 14); r.rotation.z = Math.PI / 2; r.position.set(...P(-40, 6 + i * 10, 20)); g.add(r); }
    if (t >= 3) { g.add(mzCoil(-20, -20, 18, 34)); g.add(mzCoil(10, -20, 18, 34)); g.add(mzBolt([-20, 60, -20], [10, 60, -20], 4)); g.add(mzTank(9, 26, 66, 6, 0, MZ.brass)); }
    g.add(creature(t >= 3 ? 'stormSuit' : t >= 2 ? 'ironSuit' : 'steamSuit', 8, 0, 26, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw7(t) { // wielka odlewnia: ogromna hala z suwnicą, kadź z płynnym metalem, rusztowanie z kolosem w budowie; 2: mosiężna – miedziane hełmy kominów; 3: Serce Kuźni – piec z żarem w kształcie serca i cewki
    const g = new THREE.Group(), k = t >= 3 ? 1.15 : 1; g.add(mzHall(110 * k, 54, 60, -20, -40, { wins: 4, glow: '#ff9a40' })); g.add(mzSawtooth(110 * k, 60, 4, 54, -20, -40));
    for (const s of [-1, 1]) g.add(mzStack(-20 + s * 40, -66, 110, 6, 0)); if (t >= 2) for (const s of [-1, 1]) g.add(dome(8, 6, MZ.copper, 'metal', -20 + s * 40, 113, -66));
    for (const x of [30, 80]) for (const z of [-20, 30]) g.add(blk(4, 90, 4, MZ.iron, 'iron', x, 0, z)); g.add(mzTruss(26, 84, 90, -20, 8)); g.add(mzTruss(26, 84, 90, 30, 8)); for (const y of [30, 60]) { g.add(blk(56, 2, 2, MZ.wood, 'planks', 55, y, 30)); g.add(blk(2, 2, 52, MZ.wood, 'planks', 30, y, 5)); }
    const ld = cyl3(10, 8, 12, MZ.iron, 'iron', -50, 0, 20, 14); g.add(ld); const molt = cyl3(9, 9, 1, '#ffb040', 'glow', -50, 11.6, 20, 14); molt.material = lightMat('#ffb040'); g.add(molt); glowMark(g, -50, 14, 20, 20, MZ.fire);
    if (t >= 3) { g.add(mzCoil(-80, 10, 40)); g.add(mzCoil(100, -10, 40)); g.add(mzBolt([-80, 87, 10], [-20, 70, -10], 6)); const hrt = sph(10 / PXU, '#ff7020', 'glow', P(-20, 30, -9), [1.2, 1, 0.4], 14); hrt.material = lightMat('#ff8a30'); g.add(hrt); }
    g.add(creature(t >= 3 ? 'forgeTitan' : t >= 2 ? 'brassColossus' : 'colossus', 55, 0, 6, 0.55 * k, -Math.PI / 2 + 0.4)); return g; },
  ozd(t) { // ozdoby: 1 latarnia gazowa, 2 skrzynie i beczki, 3 pomnik zębatki, 4 rura z zaworem i manometrem, 5 mała cewka iskier
    const g = new THREE.Group();
    if (t === 1) g.add(mzLamp(0, 0, 26));
    if (t === 2) g.add(mzCrates(0, 0, 1));
    if (t === 3) { g.add(blk(14, 8, 10, MZ.stone, 'ashlar', 0, 0, 0)); g.add(mzGear(10, 0, 20, 0)); }
    if (t === 4) { const pp = cyl3(2.4, 2.4, 30, MZ.copper, 'metal', 0, 0, 0, 10); pp.rotation.z = Math.PI / 2; pp.position.set(...P(0, 8, 0)); g.add(pp); for (const x of [-12, 12]) g.add(blk(2, 8, 2, MZ.iron, 'iron', x, 0, 0)); g.add(cyl3(1.4, 1.4, 6, MZ.brass, 'gold', 0, 9, 0, 8)); g.add(torus(3 / PXU, 0.6 / PXU, '#a02a20', 'iron', P(0, 16, 0), [Math.PI / 2, 0, 0])); }
    if (t === 5) g.add(mzCoil(0, 0, 22, 0, 0.8));
    return g; },
};
TOWN3.forge = FORGE3;
