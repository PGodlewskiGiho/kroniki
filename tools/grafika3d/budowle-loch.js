// Budowle Lochu (podziemne miasto w pieczarze) w 3D: ciemny fioletowo-szary kamień, wieże-stalagmity z oknami, olbrzymie świecące grzyby,
// fioletowe i zielone kryształy, kręgi monolitów, łuki wykute w skale. Bez kopuł i stożkowych dachów jak w innych miastach.
// Te same zasady co budowle-kurhan.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.dungeon = { hall(t), fort(t), … }.
'use strict';
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, mast, glowMark, creature, lightMat, boulder, dome */
const LC = { rock: '#4a4252', rockD: '#2e2834', rockL: '#6a6074', moss: '#3e5a46', violet: '#b060ff', green: '#60ff9a', glow: '#d0a0ff', amber: '#ffb860',
  cap: '#7a3a9a', capL: '#a060c0', stem: '#d8d0c0', bone: '#d8ccb0', iron: '#2a2a30', cloth: '#5a1a4a' };
// --- drobne bryły ---
const lcWin = (w, h, x, y, z, glow = LC.glow) => opening(w, h, x, y, z, { glow, frame: LC.rockD, frameKind: 'rubble' });
function lcCrystals(x, y, z, s = 1, n = 5, seed = 3, col = LC.violet) { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < n; i++) { const h = s * (8 + R() * 16);
  const c = cone(s * (2 + R() * 2.4) / PXU, h / PXU, col, 'gem', P(x + (R() - 0.5) * s * 12, y + h / 2, z + (R() - 0.5) * s * 8), [(R() - 0.5) * 0.6, 0, (R() - 0.5) * 0.6], 6); c.material = lightMat(col); c.material.transparent = true; c.material.opacity = 0.85; g.add(c); }
  glowMark(g, x, y + 8 * s, z, 12 * s, col); return g; }
// Wieża-stalagmit: trzy nałożone, nieregularne stożki skały, pierścienie okien, kryształ na czubku
function lcSpire(r, h, x, z, { y = 0, col = LC.rock, glow = LC.glow, tip = LC.violet, seed = 1 } = {}) { const g = new THREE.Group(), R = rng(seed);
  for (let i = 0; i < 3; i++) { const rr = r * (1 - i * 0.28), hh = h * (0.55 - i * 0.08), yy = y + h * i * 0.3, dx = (R() - 0.5) * r * 0.2; g.add(cone(rr / PXU, hh / PXU, i % 2 ? DK(col, 0.1) : col, 'rock', P(x + dx, yy + hh / 2, z), null, 9)); }
  for (let i = 0; i < 3; i++) { const yy = y + h * (0.12 + i * 0.22), rr = r * (0.82 - i * 0.22); g.add(lcWin(rr * 0.3, rr * 0.5, x, yy, z + rr * 0.86, glow)); }
  g.add(lcCrystals(x, y + h * 0.88, z, r / 14, 3, seed + 9, tip)); return g; }
// Olbrzymi grzyb: trzon, kapelusz (spłaszczona półkula), świecące kropki i blaszki pod spodem
function lcMush(x, z, h, r, { col = LC.cap, y = 0, seed = 2, glow = LC.green } = {}) { const g = new THREE.Group(), R = rng(seed); g.add(cyl3(r * 0.22, r * 0.3, h, LC.stem, 'plaster', x, y, z, 10));
  g.add(dome(r, r * 0.5, col, 'plaster', x, y + h, z)); g.add(cyl3(r * 0.98, r * 0.98, 1, '#e8d8f0', 'plaster', x, y + h - 0.4, z, 18));
  for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2, q = 0.3 + R() * 0.6; const sp = sph(r * 0.1 / PXU, glow, 'glow', P(x + Math.cos(a) * r * q, y + h + r * 0.5 * Math.sqrt(1 - q * q) * 0.98, z + Math.sin(a) * r * q), [1, 0.5, 1], 6); sp.material = lightMat(glow); g.add(sp); }
  glowMark(g, x, y + h, z, r * 0.8, glow); return g; }
// Łuk wykuty w skale (brama): dwa filary i półkolisty łuk z kamienia
function lcArch(w, h, x, z, { y = 0, col = LC.rockL } = {}) { const g = new THREE.Group(); for (const s of [-1, 1]) g.add(blk(w * 0.2, h, w * 0.24, col, 'rubble', x + s * w * 0.4, y, z));
  g.add(torus(w * 0.4 / PXU, w * 0.11 / PXU, col, 'rubble', P(x, y + h, z), null, null, Math.PI)); return g; }
// Krąg monolitów
function lcRing(x, z, r, n, h, seed = 1, col = LC.rockD) { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, hh = h * (0.8 + R() * 0.4);
  const m = blk(r * 0.2, hh, r * 0.1, col, 'rock', x + Math.cos(a) * r, 0, z + Math.sin(a) * r * 0.7); m.rotation.y = -a + Math.PI / 2; g.add(m); const rn = blk(r * 0.06, hh * 0.3, 0.6, LC.violet, 'glow', x + Math.cos(a) * r * 0.94, hh * 0.45, z + Math.sin(a) * r * 0.66); rn.material = lightMat('#c080ff'); rn.rotation.y = -a + Math.PI / 2; g.add(rn); } return g; }
const lcTorch = (x, y, z, col = LC.violet) => { const g = new THREE.Group(); g.add(cyl3(1, 1.3, y, LC.iron, 'iron', x, 0, z, 6)); g.add(cyl3(2.6, 1.4, 3, LC.iron, 'iron', x, y, z, 8)); const f = cone(2 / PXU, 7 / PXU, col, 'glow', P(x, y + 6, z), null, 7); f.material = lightMat(col); g.add(f); glowMark(g, x, y + 5, z, 9, col); return g; };

const DUNGEON3 = {
  hall(t) { // ratusz: twierdza wykuta w skupisku stalagmitów; 2: centralna wieża-stalagmit; 3: dwie boczne wieże i kamienny most; 4: Tron Ciemności – korona kryształów i wieża z balkonem
    const g = new THREE.Group(), s = [1, 1.15, 1.3, 1.45][t - 1]; g.add(boulder(0, 0, -10, 44 * s, '#4a4252', 11, 0.62)); g.add(blk(50 * s, 26 * s, 20, LC.rockL, 'rubble', 0, 0, 20 * s));
    for (let i = 0; i < 4; i++) g.add(lcWin(6, 10, -18 * s + i * 12 * s, 9, 20 * s + 10.2)); g.add(lcArch(22, 18, 0, 20 * s + 11)); g.add(opening(14, 18, 0, 0, 20 * s + 10.6, { glow: LC.amber, frame: LC.rockD, frameKind: 'rubble', sill: false }));
    if (t >= 2) g.add(lcSpire(18 * s, 110 * s, 0, -16, { seed: 21 }));
    if (t >= 3) { for (const sx of [-1, 1]) g.add(lcSpire(12 * s, 80 * s, sx * 42 * s, -4, { seed: 22 + sx })); g.add(blk(80 * s, 4, 8, LC.rockL, 'rubble', 0, 56 * s, -10)); }
    if (t >= 4) { g.add(lcCrystals(0, 110 * s + 4, -16, 2.2, 7, 31, LC.violet)); g.add(cyl3(18, 18, 3, LC.rockL, 'rubble', 0, 74 * s, -16, 14)); for (const sx of [-1, 1]) g.add(lcTorch(sx * 34 * s, 16, 38 * s)); }
    return g; },
  fort(t) { // fort: niski mur z głazów i kolców skalnych; 2: mur z wieżami-stalagmitami i łukiem bramy; 3: Cytadela Pieczar – olbrzymi filar skalny z wykutą fasadą, mostami i wieżami
    const g = new THREE.Group(); for (let x = -84; x <= 84; x += 14) { if (Math.abs(x) < 18) continue; g.add(boulder(x, 0, 34, 10 + (t >= 2 ? 6 : 0), '#4a4252', 40 + x, 0.9)); }
    for (let i = 0; i < 12; i++) { const x = -80 + i * 14.5; if (Math.abs(x) < 20) continue; g.add(cone(3 / PXU, (16 + (i % 3) * 8) / PXU, LC.rockL, 'rock', P(x, 10 + (t >= 2 ? 10 : 0), 34), null, 6)); }
    g.add(lcArch(36, t >= 2 ? 40 : 26, 0, 36)); g.add(opening(22, t >= 2 ? 38 : 24, 0, 0, 38, { inner: '#0e0a14', frame: LC.rockD, frameKind: 'rubble', bars: true, sill: false }));
    if (t === 1) return g;
    for (const sx of [-1, 1]) { g.add(lcSpire(16, 80, sx * 92, 34, { seed: 50 + sx })); g.add(lcSpire(10, 56, sx * 26, 38, { seed: 52 + sx })); g.add(lcTorch(sx * 16, 18, 46)); }
    if (t >= 3) { g.add(boulder(0, 0, -40, 70, '#423a4a', 60, 1.5)); g.add(blk(80, 90, 10, LC.rockL, 'rubble', 0, 0, 2)); for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) g.add(lcWin(7, 14, -27 + i * 18, 14 + r * 26, 7.2));
      g.add(lcSpire(26, 170, 0, -48, { seed: 61 })); for (const sx of [-1, 1]) { g.add(lcSpire(16, 120, sx * 56, -40, { seed: 62 + sx })); g.add(blk(36, 4, 8, LC.rockL, 'rubble', sx * 30, 96, -44)); } g.add(lcCrystals(0, 92, 4, 1.4, 5, 64, LC.green)); }
    return g; },
  guild(t) { // krąg czarnoksiężników: krąg monolitów z runami wokół czarnego obelisku i sfery mocy na postumencie; każdy stopień dokłada pierścień i wyższy obelisk
    const g = new THREE.Group(); g.add(cyl3(40, 42, 3, LC.rockD, 'rubble', 0, 0, 0, 24)); g.add(lcRing(0, 0, 34, 8, 26 + t * 4, 70));
    if (t >= 3) g.add(lcRing(0, 0, 22, 6, 16 + t * 3, 71, LC.rock));
    const H = 30 + t * 14, o = cyl3(4, 7, H, '#1e1a24', 'rock', 0, 3, 0, 4); o.rotation.y = Math.PI / 4; g.add(o); g.add(cone(4.6 / PXU, 10 / PXU, '#1e1a24', 'rock', P(0, H + 8, 0), [0, Math.PI / 4, 0], 4));
    g.add(cyl3(1.2, 1.2, 14, LC.iron, 'iron', 0, H + 13, 0, 6)); const sp = sph((5 + t) / PXU, LC.violet, 'glow', P(0, H + 32, 0), null, 14); sp.material = lightMat('#c890ff'); g.add(sp);
    for (let i = 0; i < Math.min(3, t); i++) g.add(torus((9 + t + i * 3) / PXU, 0.6 / PXU, LC.glow, 'glow', P(0, H + 32, 0), [i * 1.1, 0.4 * i, 0.3])); glowMark(g, 0, H + 32, 0, 24, LC.violet); return g; },
  tavern() { // karczma: dom w olbrzymim grzybie – okrągłe ściany z kamienia, kapelusz grzyba jako dach, okna od ognia, latarnie, beczki
    const g = new THREE.Group(); g.add(cyl3(20, 22, 24, LC.rockL, 'rubble', 0, 0, -4, 16)); g.add(lcMush(0, -4, 24, 34, { col: '#8a4a2a', seed: 80, glow: LC.amber }));
    g.add(opening(10, 16, 0, 0, 16.5, { glow: LC.amber, frame: LC.rockD, frameKind: 'rubble', sill: false })); for (const sx of [-1, 1]) g.add(lcWin(5, 7, sx * 12, 10, 13.6, LC.amber));
    for (const sx of [-1, 1]) g.add(lcTorch(sx * 28, 14, 20, LC.amber)); for (const [x, z] of [[30, 24], [36, 16]]) g.add(cyl3(5, 5, 10, '#5a3a24', 'wood', x, 0, z, 10)); marker(g, 'fx:smoke', P(0, 50, -4)); return g; },
  market() { // targ: kramy pod kapeluszami grzybów, kosze z kryształami i grzybami
    const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const x = -40 + i * 40; g.add(blk(28, 9, 14, '#4a3828', 'planks', x, 0, 10)); g.add(lcMush(x, 2, 22, 18, { col: [LC.cap, '#3a7a6a', '#9a5a2a'][i], seed: 90 + i }));
      g.add(lcCrystals(x - 6, 9, 12, 0.35, 3, 95 + i, [LC.violet, LC.green, LC.amber][i])); } return g; },
  smith() { // kuźnia: kowalnia wykuta w skale z zielonym paleniskiem, kowadło, wózek z rudą na szynach
    const g = new THREE.Group(); g.add(boulder(0, 0, -14, 30, '#3e3646', 120, 0.85)); g.add(lcArch(26, 16, 0, 12)); g.add(opening(18, 16, 0, 0, 14, { glow: LC.green, frame: LC.rockD, frameKind: 'rubble', sill: false })); glowMark(g, 0, 8, 18, 16, LC.green);
    g.add(blk(12, 5, 6, LC.iron, 'iron', 26, 7, 22)); g.add(cyl3(4, 5, 7, LC.rockL, 'rubble', 26, 0, 22, 8)); for (const z of [26, 30]) g.add(blk(60, 1, 1.2, LC.iron, 'iron', -10, 0.5, z));
    g.add(blk(12, 7, 8, '#4a3828', 'planks', -26, 2, 28)); g.add(sph(4 / PXU, '#8a6a9a', 'rock', P(-26, 9, 28), [1.3, 0.6, 1], 8)); return g; },
  silo() { // skład: grota-magazyn za żelazną kratą, skrzynie, wózki z rudą i kryształami
    const g = new THREE.Group(); g.add(boulder(0, 0, -10, 28, '#433c4a', 130, 0.8)); g.add(opening(20, 16, 0, 0, 16, { inner: '#0c0a10', frame: LC.iron, frameKind: 'iron', bars: true, sill: false }));
    for (let i = 0; i < 3; i++) g.add(blk(9, 8, 9, '#5a4430', 'planks', -30 + i * 3, i * 8, 16)); g.add(blk(14, 7, 9, LC.iron, 'iron', 26, 2, 22)); g.add(lcCrystals(26, 9, 22, 0.4, 4, 131, LC.violet)); return g; },
  special() { // Wir many: okrągły basen z czarnego kamienia, z którego wznosi się wirujący słup fioletowej many (pierścienie coraz wyżej), cztery obeliski
    const g = new THREE.Group(); g.add(cyl3(32, 34, 6, LC.rockD, 'rubble', 0, 0, 0, 24)); const pool = cyl3(26, 26, 1, LC.violet, 'win', 0, 6, 0, 24); pool.material = lightMat('#9a50e0'); g.add(pool);
    for (let i = 0; i < 6; i++) { const t2 = torus((20 - i * 2.6) / PXU, (1.4 - i * 0.12) / PXU, LC.glow, 'glow', P(0, 10 + i * 12, 0), [Math.PI / 2 + Math.sin(i) * 0.2, 0, Math.cos(i) * 0.2]); t2.material = lightMat(i % 2 ? '#c080ff' : '#e0c0ff'); g.add(t2); }
    const col = cyl3(4, 12, 80, LC.violet, 'glow', 0, 6, 0, 16); col.material = lightMat('#b070ff'); col.material.transparent = true; col.material.opacity = 0.35; g.add(col); glowMark(g, 0, 40, 0, 40, LC.violet);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.785, o = cyl3(2.4, 3.4, 36, LC.rockD, 'rock', Math.cos(a) * 42, 0, Math.sin(a) * 28, 4); o.rotation.y = 0.785; g.add(o); } return g; },
  grail() { // Strażnik Głębin: kolosalny posąg zakapturzonego strażnika wykuty w skale, w dłoniach olbrzymi kryształ, oczy świecą; u stóp schody i krąg kryształowych kolumn
    const g = new THREE.Group(); for (let i = 0; i < 4; i++) g.add(blk(140 - i * 22, 10, 100 - i * 16, i % 2 ? LC.rockD : LC.rock, 'rubble', 0, i * 10, -10));
    g.add(cone(40 / PXU, 130 / PXU, '#3a3442', 'rock', P(0, 40 + 65, -16), null, 10)); g.add(sph(22 / PXU, '#3a3442', 'rock', P(0, 40 + 126, -16), [1, 1.15, 1], 16)); /* szata i kaptur */
    g.add(sph(15 / PXU, '#0c0a10', 'skin', P(0, 40 + 122, 0), [1, 1.2, 0.6], 12)); for (const s of [-1, 1]) { const e = sph(2.6 / PXU, LC.green, 'glow', P(s * 5.5, 40 + 126, 5), null, 8); e.material = lightMat('#80ffb0'); g.add(e); }
    for (const s of [-1, 1]) { const arm = cyl3(7, 9, 50, '#3a3442', 'rock', 0, 0, 0, 8); arm.rotation.z = s * 0.9; arm.position.set(...P(s * 26, 40 + 84, 2)); g.add(arm); }
    const cr = cone(14 / PXU, 46 / PXU, LC.violet, 'gem', P(0, 40 + 92, 22), null, 6); cr.material = lightMat('#c080ff'); g.add(cr); const cr2 = cone(14 / PXU, 22 / PXU, LC.violet, 'gem', P(0, 40 + 64, 22), [Math.PI, 0, 0], 6); cr2.material = lightMat('#a060f0'); g.add(cr2); glowMark(g, 0, 40 + 84, 26, 50, LC.violet);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; g.add(lcCrystals(Math.cos(a) * 80, 0, -10 + Math.sin(a) * 52, 1.6, 4, 140 + i, i % 2 ? LC.green : LC.violet)); }
    g.add(blk(30, 40, 16, LC.rockL, 'rubble', 0, 0, 44)); return g; },
  dw1(t) { // nory troglodytów: skalne kopce z norami; 2: głębokie nory – więcej kopców i drabiny; 3: nory cienia – fioletowy blask i kryształy
    const g = new THREE.Group(); for (const [x, z, r, sd] of [[-14, -10, 22, 151], [20, -16, 16, 152]].concat(t >= 2 ? [[-36, 4, 12, 153]] : [])) { g.add(boulder(x, 0, z, r, '#4a4252', sd, 0.7)); g.add(opening(r * 0.5, r * 0.45, x, 0, z + r * 0.9, { inner: '#0a080c', frame: LC.rockD, frameKind: 'rubble', sill: false })); }
    if (t >= 2) for (let i = 0; i < 4; i++) g.add(blk(9, 1.2, 1.2, '#5a4430', 'wood', 34, 3 + i * 4, 2));
    if (t >= 3) g.add(lcCrystals(0, 0, 10, 0.7, 4, 155, LC.violet));
    for (let i = 0; i < Math.min(3, t + 1); i++) g.add(creature(t >= 3 ? 'shadowTroglodyte' : t >= 2 ? 'infernalTroglodyte' : 'troglodyte', -16 + i * 16, 0, 26, 0.5, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // gniazdo harpii: wysoka iglica skalna z gniazdem na szczycie; 2: turnia – druga iglica i kładka; 3: gniazdo furii – czerwone szmaty i kości na półkach
    const g = new THREE.Group(), h = [64, 78, 86][t - 1]; g.add(cone(18 / PXU, h / PXU, '#4e4656', 'rock', P(0, h / 2, -8), null, 8)); g.add(torus(10 / PXU, 3 / PXU, '#5a4430', 'wood', P(0, h * 0.8, -8), [Math.PI / 2, 0, 0]));
    if (t >= 2) { g.add(cone(12 / PXU, h * 0.7 / PXU, '#4a4252', 'rock', P(30, h * 0.35, -14), null, 8)); g.add(blk(26, 1.4, 4, '#5a4430', 'planks', 15, h * 0.55, -11)); }
    if (t >= 3) for (let i = 0; i < 3; i++) g.add(blk(6, 8, 0.6, '#9a2a2a', 'cloth', -4 + i * 4, h * 0.5 + i * 6, 2));
    g.add(creature(t >= 3 ? 'fury' : t >= 2 ? 'harpyHag' : 'harpy', 0, h * 0.8 + 2, -4, 0.45, -Math.PI / 2 + 0.3)); return g; },
  dw3(t) { // kolumna oczu: kamienna kolumna z rzeźbionymi oczami (kule z tęczówką) i obserwator; 2: głębia oczu – trzy kolumny; 3: oko otchłani – olbrzymie oko na szczycie
    const g = new THREE.Group(); const cols = t >= 2 ? [[-22, 46], [0, 62], [22, 50]] : [[0, 56]];
    for (const [x, h] of cols) { g.add(cyl3(6, 7, h, LC.rockL, 'rubble', x, 0, -6, 10)); for (let i = 0; i < 3; i++) { const y = h * (0.25 + i * 0.25); g.add(sph(3.4 / PXU, '#e8e0d0', 'skin', P(x, y, 0.4), null, 10)); const ir = sph(1.6 / PXU, LC.green, 'glow', P(x, y, 3.4), null, 8); ir.material = lightMat('#80ff90'); g.add(ir); } }
    if (t >= 3) { g.add(sph(12 / PXU, '#e8e0d0', 'skin', P(0, 80, -6), null, 16)); const ir = sph(6 / PXU, '#ff4060', 'glow', P(0, 80, 5), [1, 1, 0.5], 12); ir.material = lightMat('#ff5070'); g.add(ir); glowMark(g, 0, 80, 6, 18, '#ff5070'); }
    g.add(creature(t >= 3 ? 'doomEye' : t >= 2 ? 'evilEye' : 'beholder', 26, 20, 22, 0.5, -Math.PI / 2 + 0.3)); return g; },
  dw4(t) { // kaplica ciszy: niska kaplica z kolumnami w kształcie węży, skamieniali wędrowcy przed wejściem; 2: świątynia meduz – wyższy fronton; 3: sanktuarium – zielony blask i więcej posągów
    const g = new THREE.Group(); g.add(blk(56, 4, 40, LC.rockD, 'rubble', 0, 0, -6)); g.add(blk(44, 26, 28, LC.rock, 'rubble', 0, 4, -10)); g.add(gable(50, 34, t >= 2 ? 16 : 10, '#3a5a4a', 'tiles', 0, 30, -10, 3, LC.rock, 'rubble'));
    for (let i = 0; i < 4; i++) { const x = -18 + i * 12; for (let k = 0; k < 6; k++) g.add(sph(2.2 / PXU, '#5a7a5a', 'scale', P(x + Math.sin(k * 1.4) * 1.6, 6 + k * 4, 8), null, 6)); }
    g.add(opening(10, 16, 0, 4, 4.6, { glow: LC.green, frame: LC.rockD, frameKind: 'rubble', sill: false }));
    for (let i = 0; i < (t >= 3 ? 3 : 1); i++) g.add(creature('archMage', -26 + i * 14, 0, 24, 0.4, -Math.PI / 2 + 0.6)); /* skamieniali wędrowcy (szary kamień nakłada mgła) */
    g.add(creature(t >= 3 ? 'archMedusa' : t >= 2 ? 'medusaQueen' : 'medusa', 26, 0, 22, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw5(t) { // labirynt: niskie mury labiryntu z bramą i wieżyczką strażnika; 2: wielki labirynt – szerszy; 3: serce labiryntu – wieża-stalagmit w środku
    const g = new THREE.Group(), s = t >= 2 ? 1.25 : 1, R = rng(170); g.add(blk(90 * s, 2, 60 * s, LC.rockD, 'rubble', 0, 0, -6));
    for (const [x, z, w, d] of [[0, 22, 90, 4], [0, -36, 90, 4], [-45, -7, 4, 62], [45, -7, 4, 62], [-20, 6, 4, 28], [10, -10, 40, 4], [20, 8, 4, 24], [-28, -22, 30, 4], [30, -24, 4, 20]]) { if (z === 22 && Math.abs(x) < 1) { g.add(blk(36 * s, 14, 4, LC.rockL, 'rubble', -27 * s, 0, 22 * s)); g.add(blk(36 * s, 14, 4, LC.rockL, 'rubble', 27 * s, 0, 22 * s)); continue; } g.add(blk(w * s, 14, d * s, LC.rockL, 'rubble', x * s, 0, z * s)); }
    g.add(lcArch(16, 16, 0, 22 * s)); if (t >= 3) g.add(lcSpire(10, 70, 0, -10, { seed: 171, tip: LC.amber }));
    g.add(creature(t >= 3 ? 'minotaurLord' : t >= 2 ? 'minotaurKing' : 'minotaur', 0, 0, 34 * s, 0.5, -Math.PI / 2 + 0.3)); return g; },
  dw6(t) { // jaskinia mantykor: skalny łuk-wejście do jaskini z ciemnym wnętrzem, ślady pazurów; 2: leże skorpikor – kolce i druga grota; 3: pradawne leże – czerwone kryształy
    const g = new THREE.Group(); g.add(boulder(0, 0, -20, 46, '#463e4e', 180, 0.85)); g.add(lcArch(34, 22, 0, 12)); g.add(opening(26, 26, 0, 0, 12, { inner: '#08060a', frame: LC.rockD, frameKind: 'rubble', sill: false }));
    for (let i = 0; i < 3; i++) { const c = blk(1.4, 14, 0.6, '#2a2228', 'rock', 24 + i * 4, 18, 8); c.rotation.z = 0.4; g.add(c); }
    if (t >= 2) { g.add(boulder(-40, 0, -6, 22, '#4a4252', 181, 0.8)); for (let i = 0; i < 5; i++) g.add(cone(2.6 / PXU, 16 / PXU, LC.rockL, 'rock', P(-30 + i * 14, 28 + (i % 2) * 6, 0), null, 6)); }
    if (t >= 3) g.add(lcCrystals(36, 0, 6, 0.9, 4, 183, '#ff5060'));
    g.add(creature(t >= 3 ? 'ancientManticore' : t >= 2 ? 'scorpicore' : 'manticore', -18, 0, 26, 0.5, -Math.PI / 2 + 0.5)); return g; },
  dw7(t) { // smocza pieczara: olbrzymi kopiec skalny z ogromną paszczą jaskini i smokiem na szczycie; 2: czarna pieczara – obsydianowe kolce; 3: pieczara cienia – fioletowa mgła i kryształy
    const g = new THREE.Group(), k = t >= 3 ? 1.2 : 1; g.add(boulder(0, 0, -24, 76 * k, '#3e3646', 190, 0.8)); g.add(boulder(-56 * k, 0, -4, 34, '#463e4e', 191, 0.8)); g.add(boulder(56 * k, 0, -8, 30, '#463e4e', 192, 0.8));
    g.add(lcArch(54, 34, 0, 26)); g.add(opening(42, 40, 0, 0, 27, { inner: '#06040a', frame: LC.rockD, frameKind: 'rubble', sill: false })); glowMark(g, 0, 18, 28, 26, '#ff6a30');
    if (t >= 2) for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; g.add(cone(4 / PXU, 22 / PXU, '#18141c', 'gem', P(Math.sin(a) * 66 * k, 40 + Math.cos(a) * 26, -18), [0, 0, -a * 0.8], 6)); }
    if (t >= 3) { g.add(lcCrystals(-50, 0, 20, 1.2, 5, 195, LC.violet)); g.add(lcCrystals(50, 0, 18, 1.1, 5, 196, LC.violet)); }
    g.add(creature(t >= 3 ? 'shadowDragon' : t >= 2 ? 'blackDragon' : 'redDragon', 0, 58 * k, -20, 0.5, -Math.PI / 2 + 0.4)); return g; },
  ozd(t) { // ozdoby: 1 kępa świecących grzybów, 2 kryształy, 3 grupa stalagmitów, 4 para fioletowych pochodni, 5 mały posąg-idol
    const g = new THREE.Group();
    if (t === 1) { g.add(lcMush(0, 0, 14, 10, { seed: 201, col: '#3a7a6a' })); g.add(lcMush(10, 4, 8, 6, { seed: 202, col: LC.cap })); g.add(lcMush(-8, 5, 6, 5, { seed: 203, col: LC.capL })); }
    if (t === 2) g.add(lcCrystals(0, 0, 0, 1.1, 6, 204, LC.violet));
    if (t === 3) for (const [x, z, h] of [[0, 0, 30], [9, 3, 18], [-8, 4, 22]]) g.add(cone(4 / PXU, h / PXU, LC.rockL, 'rock', P(x, h / 2, z), null, 7));
    if (t === 4) for (const x of [-12, 12]) g.add(lcTorch(x, 16, 0));
    if (t === 5) { g.add(blk(12, 6, 10, LC.rockD, 'rubble', 0, 0, 0)); g.add(cone(5 / PXU, 18 / PXU, '#3a3442', 'rock', P(0, 15, 0), null, 8)); g.add(sph(4 / PXU, '#3a3442', 'rock', P(0, 26, 0), null, 10)); for (const s of [-1, 1]) { const e = sph(0.9 / PXU, LC.green, 'glow', P(s * 1.5, 26, 3.4), null, 6); e.material = lightMat('#80ffb0'); g.add(e); } }
    return g; },
};
TOWN3.dungeon = DUNGEON3;
