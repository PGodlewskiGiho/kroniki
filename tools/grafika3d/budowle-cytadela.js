// Budowle Cytadeli (stepowa warownia barbarzyńców) w 3D: gliniane okrągłe baszty z wystającymi belkami (jak suszone cegły z pustyni),
// namioty ze skór o pasiastych dachach, palisady z ostrych pali, łuki z kłów, czerwone proporce, czerwone skały pustyni.
// Te same zasady co budowle-kurhan.js: piksele sceny (PXU), stopnie rosną bryłą i detalem, TOWN3.stronghold = { hall(t), fort(t), … }.
'use strict';
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, marker, DK, LT, rng, opening, door, gable, mast, glowMark, creature, lightMat, boulder, dome */
const CY = { clay: '#c08a5a', clayD: '#9a6a44', clayL: '#d8a878', wood: '#6a4a2c', woodD: '#4a3220', hide: '#b89060', hideD: '#8a6a44', red: '#a02a20', ochre: '#d0902a',
  rock: '#a0583a', rockD: '#7a4030', bone: '#e8dcc0', fire: '#ffa040', sand: '#d8b888' };
// --- drobne bryły ---
const cyWin = (w, h, x, y, z) => opening(w, h, x, y, z, { glow: '#ffb060', frame: CY.clayD, frameKind: 'plaster', arch: false });
// Okrągła gliniana baszta z wystającymi belkami (toron), płaskim dachem i zębatym wieńcem
function cyAdobe(r, h, x, z, { y = 0, col = CY.clay, beams = true } = {}) { const g = new THREE.Group(); g.add(cyl3(r, r * 1.12, h, col, 'plaster', x, y, z, 14));
  g.add(cyl3(r * 1.04, r * 1.04, 3, DK(col, 0.1), 'plaster', x, y + h, z, 14)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(cone(r * 0.16 / PXU, r * 0.5 / PXU, col, 'plaster', P(x + Math.cos(a) * r * 0.9, y + h + 3 + r * 0.25, z + Math.sin(a) * r * 0.9), null, 6)); }
  if (beams) for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + k * 0.5, b = blk(r * 0.5, 1.8, 1.8, CY.woodD, 'wood', 0, 0, 0); b.rotation.y = -a; b.position.set(...P(x + Math.cos(a) * r * 1.05, y + h * (0.35 + k * 0.35), z + Math.sin(a) * r * 1.05)); g.add(b); } /* wystające belki */
  g.add(cyWin(r * 0.3, r * 0.5, x, y + h * 0.5, z + r * 1.02)); return g; }
// Namiot ze skór: walcowa ściana, stożkowy dach w pasy, otwór wejścia, pal z proporcem
function cyYurt(r, x, z, { y = 0, h = r * 0.8, col = CY.hide, stripe = CY.red } = {}) { const g = new THREE.Group(); g.add(cyl3(r, r, h, col, 'plaster', x, y, z, 16));
  g.add(cone(r * 1.08 / PXU, r * 0.9 / PXU, col, 'plaster', P(x, y + h + r * 0.45, z), null, 16)); g.add(torus(r * 1.0 / PXU, 0.9 / PXU, stripe, 'cloth', P(x, y + h + 0.6, z), [Math.PI / 2, 0, 0]));
  g.add(torus(r * 0.55 / PXU, 0.8 / PXU, stripe, 'cloth', P(x, y + h + r * 0.45, z), [Math.PI / 2, 0, 0])); g.add(cyl3(0.8, 0.8, r * 0.6, CY.woodD, 'wood', x, y + h + r * 0.7, z, 5));
  g.add(opening(r * 0.45, h * 0.75, x, y, z + r * 0.98, { inner: '#2a1a0c', frame: CY.hideD, sill: false })); return g; }
// Łuk z dwóch kłów osadzonych w ziemi (stykają się u góry)
function cyTusks(x, z, s = 1) { const g = new THREE.Group(); for (const k of [-1, 1]) g.add(torus(14 * s / PXU, 2.4 * s / PXU, CY.bone, 'bone', P(x + k * 14 * s, 0, z), [0, 0, k > 0 ? 0 : Math.PI / 2], null, Math.PI / 2)); return g; }
function cyStockade(x0, x1, z, h = 22, seed = 3) { const g = new THREE.Group(), R = rng(seed); for (let x = x0; x <= x1; x += 4.6) { const hh = h * (0.85 + R() * 0.3); g.add(cyl3(2.2, 2.2, hh, R() < 0.5 ? CY.wood : CY.woodD, 'bark', x, 0, z, 6)); g.add(cone(2.2 / PXU, 6 / PXU, CY.woodD, 'wood', P(x, hh + 3, z), null, 6)); }
  g.add(blk(x1 - x0 + 4, 2, 2, CY.woodD, 'wood', (x0 + x1) / 2, h * 0.6, z + 2.4)); return g; }
const cyBanner = (x, y, z, h = 34) => { const g = new THREE.Group(); g.add(cyl3(1, 1, h, CY.woodD, 'wood', x, y, z, 6)); g.add(blk(9, 16, 0.6, CY.red, 'cloth', x + 5, y + h - 12, z)); g.add(blk(9, 2, 0.8, CY.ochre, 'cloth', x + 5, y + h - 20, z)); marker(g, 'fx:flag', P(x, y + h, z)); return g; };
const cyFire = (x, z, s = 1) => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const b = blk(10 * s, 1.8, 1.8, CY.woodD, 'wood', 0, 0, 0); b.rotation.y = i * 1.25; b.position.set(...P(x, 0.4, z)); g.add(b); } /* kłody */
  const f = cone(3 * s / PXU, 9 * s / PXU, CY.fire, 'glow', P(x, 5 * s, z), null, 7); f.material = lightMat('#ffa040'); g.add(f); glowMark(g, x, 5, z, 10 * s, CY.fire); marker(g, 'fx:smoke', P(x, 14 * s, z)); return g; };

const STRONGHOLD3 = {
  hall(t) { // ratusz: wielki namiot wodza; 2: gliniana sala z belkami; 3: dwie gliniane baszty; 4: Sala Wodza – łuk z kłów przed wejściem, proporce, wysoka baszta
    const g = new THREE.Group(); g.add(blk(110, 3, 70, CY.sand, 'dirt', 0, 0, 0));
    if (t === 1) { g.add(cyYurt(28, 0, -4)); g.add(cyFire(30, 26)); return g; }
    const w = [0, 66, 80, 92][t - 1]; g.add(blk(w, 30, 40, CY.clay, 'plaster', 0, 0, -8)); g.add(blk(w + 4, 3, 44, CY.clayD, 'plaster', 0, 30, -8)); for (let i = 0; i < 9; i++) g.add(cone(2.6 / PXU, 7 / PXU, CY.clay, 'plaster', P(-w / 2 + 4 + i * (w - 8) / 8, 36, 12), null, 6));
    for (let i = 0; i < 7; i++) { const b = blk(1.6, 1.6, 10, CY.woodD, 'wood', -w / 2 + 6 + i * (w - 12) / 6, 22, 14); g.add(b); } g.add(opening(16, 22, 0, 0, 12, { glow: '#ffb060', frame: CY.woodD, sill: false, arch: false })); for (const s of [-1, 1]) g.add(cyWin(6, 9, s * w * 0.3, 10, 12.2));
    if (t >= 3) for (const s of [-1, 1]) g.add(cyAdobe(12, 50, s * (w / 2 + 8), -10));
    if (t >= 4) { g.add(cyTusks(0, 30, 1.3)); g.add(cyAdobe(15, 74, 0, -26)); for (const s of [-1, 1]) g.add(cyBanner(s * 24, 0, 30)); }
    return g; },
  fort(t) { // fort: palisada z łukiem z kłów; 2: gliniany mur z okrągłymi basztami; 3: Twierdza Hordy – piętrowa gliniana cytadela z belkami i iglicami (jak meczet z suszonej cegły)
    const g = new THREE.Group();
    if (t === 1) { g.add(cyStockade(-84, -20, 34, 26, 11)); g.add(cyStockade(20, 84, 34, 26, 12)); g.add(cyTusks(0, 34, 1.4)); return g; }
    g.add(blk(170, 38, 12, CY.clay, 'plaster', 0, 0, 34)); for (let x = -82; x <= 82; x += 9) if (Math.abs(x) > 22) g.add(cone(3.4 / PXU, 9 / PXU, CY.clay, 'plaster', P(x, 42, 34), null, 6));
    g.add(blk(44, 50, 18, CY.clayD, 'plaster', 0, 0, 36)); g.add(opening(20, 30, 0, 0, 45.5, { inner: '#2a1a0c', frame: CY.woodD, frameKind: 'wood', bars: true, sill: false, arch: false })); g.add(cyTusks(0, 48, 1.1));
    for (const s of [-1, 1]) { g.add(cyAdobe(15, 58, s * 92, 34)); g.add(cyBanner(s * 18, 50, 38)); }
    if (t >= 3) { g.add(blk(120, 50, 64, CY.clay, 'plaster', 0, 0, -30)); g.add(blk(90, 40, 46, CY.clayL, 'plaster', 0, 50, -34)); g.add(blk(56, 30, 30, CY.clay, 'plaster', 0, 90, -38));
      for (const [y, w] of [[30, 120], [72, 90], [108, 56]]) for (let i = 0; i < 6; i++) g.add(blk(1.6, 1.6, 8, CY.woodD, 'wood', -w / 2 + 6 + i * (w - 12) / 5, y, w === 120 ? 2 : w === 90 ? -11 : -23));
      for (const s of [-1, 1]) { g.add(cyAdobe(14, 120, s * 52, -30)); g.add(cyAdobe(10, 96, s * 36, -2)); } g.add(cone(10 / PXU, 34 / PXU, CY.clay, 'plaster', P(0, 137, -38), null, 8)); g.add(cyBanner(0, 150, -38, 30)); }
    return g; },
  guild(t) { // namiot szamana: duży namiot ze skór, przed nim kocioł i totem z czaszką byka; każdy stopień – większy namiot, dodatkowe namioty, krąg kamieni i dymy
    const g = new THREE.Group(); g.add(cyYurt(20 + t * 3, 0, -8, { stripe: '#4a8a8a' })); g.add(cyl3(7, 5, 8, '#3a3434', 'iron', 26, 0, 20, 12)); g.add(cyl3(6.4, 6.4, 0.8, '#80ff90', 'glow', 26, 8, 20, 12)); glowMark(g, 26, 10, 20, 12, '#80ff90'); marker(g, 'fx:smoke', P(26, 14, 20));
    g.add(cyl3(2, 2.4, 40 + t * 6, CY.wood, 'wood', -30, 0, 16, 8)); g.add(sph(5 / PXU, CY.bone, 'bone', P(-30, 44 + t * 6, 18), [1.2, 0.9, 1.3], 10)); for (const s of [-1, 1]) g.add(cone(1.6 / PXU, 10 / PXU, CY.bone, 'bone', P(-30 + s * 6, 48 + t * 6, 18), [0, 0, -s * 0.9], 6));
    for (let i = 1; i < t; i++) { const a = -0.6 + i * 0.5; g.add(cyYurt(10, Math.sin(a) * 50, -30 + Math.cos(a) * 10, { stripe: '#4a8a8a' })); }
    if (t >= 3) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; g.add(boulder(Math.cos(a) * 48, 0, Math.sin(a) * 30, 4, CY.rockD, 230 + i, 0.9)); }
    return g; },
  tavern() { // karczma: długi gliniany dom z drewnianym zadaszeniem przed wejściem, beczki, rożen
    const g = new THREE.Group(); g.add(blk(60, 22, 34, CY.clayL, 'plaster', 0, 0, -6)); g.add(blk(64, 3, 38, CY.clayD, 'plaster', 0, 22, -6)); for (let i = 0; i < 6; i++) g.add(blk(1.6, 1.6, 8, CY.woodD, 'wood', -25 + i * 10, 16, 12));
    for (const s of [-1, 1]) g.add(cyl3(1.4, 1.4, 18, CY.wood, 'wood', s * 24, 0, 24, 6)); g.add(blk(56, 1.6, 16, CY.hide, 'cloth', 0, 18, 18)); g.add(opening(12, 16, 0, 0, 11, { glow: '#ffb060', frame: CY.woodD, sill: false, arch: false }));
    for (const [x, z] of [[36, 24], [42, 16]]) g.add(cyl3(5, 5, 10, CY.wood, 'wood', x, 0, z, 10)); g.add(cyFire(-36, 26, 0.9)); return g; },
  market() { // targ: bazar pod kolorowymi płachtami rozpiętymi na tykach, dywany i dzbany
    const g = new THREE.Group(), cols = ['#b03a2a', '#d0902a', '#3a7a8a']; for (let i = 0; i < 3; i++) { const x = -40 + i * 40; for (const [dx, dz] of [[-14, -4], [14, -4], [-14, 16], [14, 16]]) g.add(cyl3(1, 1, 22, CY.wood, 'wood', x + dx, 0, dz, 5));
      const c = blk(32, 1, 24, cols[i], 'cloth', x, 22, 6); c.rotation.x = 0.12; g.add(c); g.add(blk(22, 0.6, 12, cols[(i + 1) % 3], 'cloth', x, 0.4, 8)); for (let k = 0; k < 3; k++) g.add(cyl3(2.4, 1.6, 6, CY.clayD, 'plaster', x - 8 + k * 8, 0.6, 2, 8)); } return g; },
  smith() { // kuźnia: kamienny piec-kopiec z paleniskiem, wiata ze skór, kowadło, stojak z toporami
    const g = new THREE.Group(); g.add(dome(16, 16, CY.rockD, 'rubble', -10, 0, -8)); g.add(opening(10, 9, -10, 0, 7, { glow: CY.fire, frame: CY.rockD, frameKind: 'rubble', sill: false })); glowMark(g, -10, 5, 10, 12, CY.fire); g.add(cyl3(4, 4, 16, CY.rockD, 'rubble', -10, 14, -12, 8)); marker(g, 'fx:smoke', P(-10, 34, -12));
    for (const [x, z] of [[8, -10], [36, -10], [8, 18], [36, 18]]) g.add(cyl3(1.2, 1.2, 20, CY.wood, 'wood', x, 0, z, 5)); g.add(blk(32, 1, 32, CY.hide, 'cloth', 22, 20, 4));
    g.add(blk(10, 4, 6, '#4a4a4c', 'iron', 22, 7, 6)); g.add(cyl3(3.6, 4.4, 7, CY.wood, 'wood', 22, 0, 6, 8)); g.add(blk(1, 18, 1, CY.woodD, 'wood', 44, 0, 20)); return g; },
  silo() { // skład: skupisko glinianych spichrzy w kształcie uli na podwyższeniu, drabina
    const g = new THREE.Group(); g.add(blk(56, 5, 34, CY.clayD, 'plaster', 0, 0, -4)); for (const [x, z, r] of [[-16, -8, 11], [6, -10, 13], [24, 2, 9], [-4, 8, 8]]) { g.add(cyl3(r, r * 0.9, r * 1.4, CY.clay, 'plaster', x, 5, z, 12)); g.add(dome(r * 0.9, r * 0.8, CY.clayL, 'plaster', x, 5 + r * 1.4, z)); g.add(cyWin(r * 0.35, r * 0.4, x, 5 + r * 0.7, z + r * 0.9)); }
    for (let i = 0; i < 4; i++) g.add(blk(8, 1, 1, CY.woodD, 'wood', 30, 4 + i * 5, 14)); return g; },
  special() { // Sala Walhalli: długa sala z kamienia i gliny, nad wejściem dwa skrzyżowane olbrzymie topory, tarcze bohaterów na ścianach, ognie
    const g = new THREE.Group(); g.add(blk(78, 30, 40, CY.rockD, 'rubble', 0, 0, -6)); g.add(gable(84, 46, 20, CY.woodD, 'shingle', 0, 30, -6, 4, CY.rockD, 'rubble'));
    for (const s of [-1, 1]) { const h = blk(3, 46, 3, CY.woodD, 'wood', s * 6, 18, 16); h.rotation.z = s * 0.6; g.add(h); const ax = blk(14, 10, 2, '#8a8a8c', 'iron', s * 18, 54, 16); ax.rotation.z = s * 0.6; g.add(ax); }
    for (let i = 0; i < 4; i++) { const sh = cyl3(5, 5, 1.4, i % 2 ? CY.red : CY.ochre, 'cloth', 0, 0, 0, 14); sh.rotation.x = Math.PI / 2; sh.position.set(...P(-30 + i * 20, 16, 14.4)); g.add(sh); }
    g.add(opening(14, 20, 0, 0, 14.2, { glow: '#ffb060', frame: CY.woodD, sill: false, arch: false })); for (const s of [-1, 1]) g.add(cyFire(s * 46, 22)); return g; },
  grail() { // Pomnik Wodzów: olbrzymi totem z trzech wykutych w skale głów wodzów (brwi, oczy z żarem, kły), na kamiennym podeście; wokół menhiry i ogniska
    const g = new THREE.Group(); g.add(cyl3(70, 76, 8, CY.rockD, 'rubble', 0, 0, 0, 20)); g.add(cyl3(56, 60, 8, CY.rock, 'rubble', 0, 8, 0, 20));
    for (let i = 0; i < 3; i++) { const y = 16 + i * 50, w = 54 - i * 8; g.add(blk(w, 48, w * 0.8, i % 2 ? CY.rock : '#b0684a', 'rock', 0, y, -6)); g.add(blk(w + 6, 7, 8, CY.rockD, 'rock', 0, y + 32, -6 + w * 0.4)); /* łuk brwiowy */
      for (const s of [-1, 1]) { const e = blk(w * 0.18, 5, 2, CY.fire, 'glow', s * w * 0.22, y + 25, -6 + w * 0.4 + 0.4); e.material = lightMat('#ffa040'); g.add(e); g.add(cone(2.6 / PXU, 12 / PXU, CY.bone, 'bone', P(s * w * 0.28, y + 9, -6 + w * 0.4 + 2), null, 6)); }
      g.add(blk(w * 0.24, 10, 6, CY.rockD, 'rock', 0, y + 14, -6 + w * 0.4 + 2)); g.add(blk(w * 0.6, 4, 3, '#2a1a10', 'rock', 0, y + 6, -6 + w * 0.4 + 0.6)); }
    for (const s of [-1, 1]) g.add(torus(26 / PXU, 4 / PXU, CY.bone, 'bone', P(s * 22, 166, -6), [0, 0, s > 0 ? -0.1 : Math.PI + 0.1], null, Math.PI * 0.55)); /* rogi osadzone w górnej głowie */
    glowMark(g, 0, 120, 20, 40, CY.fire); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; g.add(blk(8, 34 + (i % 2) * 10, 6, CY.rockD, 'rock', Math.cos(a) * 84, 0, Math.sin(a) * 54)); } for (const s of [-1, 1]) g.add(cyFire(s * 44, 52, 1.4));
    return g; },
  dw1(t) { // chaty hobgoblinów: kilka małych namiotów ze skór i ognisko; 2: obóz łupieżców – palisada; 3: obóz rębaczy – stojaki z bronią i proporzec
    const g = new THREE.Group(); for (const [x, z, r] of [[-18, -10, 13], [16, -14, 11]].concat(t >= 2 ? [[34, 6, 9]] : [])) g.add(cyYurt(r, x, z, { stripe: CY.ochre })); g.add(cyFire(0, 16, 0.8));
    if (t >= 2) g.add(cyStockade(-44, 44, -34, 18, 21)); if (t >= 3) { g.add(cyBanner(-40, 0, 14)); for (let i = 0; i < 4; i++) { const sp = cyl3(0.6, 0.6, 20, CY.woodD, 'wood', 40 + i * 3, 0, 24, 4); sp.rotation.z = 0.15; g.add(sp); } }
    for (let i = 0; i < Math.min(3, t + 1); i++) g.add(creature(t >= 3 ? 'hobgoblinSlasher' : t >= 2 ? 'hobgoblinRaider' : 'hobgoblin', -14 + i * 14, 0, 28, 0.5, -Math.PI / 2 + 0.4));
    return g; },
  dw2(t) { // wilcze doły: wykopany dół otoczony palisadą, nora w skarpie; 2: zagroda jeźdźców – siodła na belce i brama; 3: wilcza warownia – gliniana baszta
    const g = new THREE.Group(); const pit = cyl3(30, 26, 2, '#5a3a24', 'dirt', 0, -1, -4, 20); pit.scale.z = 0.6; g.add(pit); g.add(boulder(-10, 0, -24, 22, CY.rockD, 241, 0.6)); g.add(opening(12, 9, -10, 0, -8, { inner: '#1a0e08', frame: CY.rockD, frameKind: 'rubble', sill: false }));
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (a > 1.2 && a < 1.9) continue; g.add(cyl3(1.6, 1.6, 16, CY.wood, 'bark', Math.cos(a) * 40, 0, -4 + Math.sin(a) * 26, 5)); }
    if (t >= 2) { g.add(blk(30, 2, 2, CY.woodD, 'wood', 30, 14, 20)); for (let i = 0; i < 3; i++) g.add(blk(5, 5, 4, '#6a3a1a', 'leather', 20 + i * 9, 11, 20)); }
    if (t >= 3) g.add(cyAdobe(10, 44, 44, -24));
    g.add(creature(t >= 3 ? 'wargChief' : t >= 2 ? 'wargRider' : 'warg', 6, 0, 18, 0.55, -Math.PI / 2 + 0.4)); return g; },
  dw3(t) { // orcza wieża: wysoka gliniana baszta z belkami i proporcem; 2: twierdza wodzów – druga baszta połączona murem; 3: namiot watażki – czerwony namiot u stóp
    const g = new THREE.Group(); g.add(cyAdobe(14, 64, 0, -10)); g.add(cyBanner(0, 74, -10, 26));
    if (t >= 2) { g.add(cyAdobe(10, 46, 36, -16)); g.add(blk(24, 26, 8, CY.clay, 'plaster', 18, 0, -12)); }
    if (t >= 3) g.add(cyYurt(14, -34, 4, { col: '#8a2a20', stripe: CY.ochre }));
    g.add(creature(t >= 3 ? 'orcWarlord' : t >= 2 ? 'orcChief' : 'orcAxe', 20, 0, 22, 0.55, -Math.PI / 2 + 0.4)); return g; },
  dw4(t) { // zagroda turów: kwadratowa zagroda z pali i wiata z trzciny; 2: bojowe pastwisko – koryto i stóg; 3: taranowe pastwisko – taran na kołach
    const g = new THREE.Group(); for (const [x, z, w, d] of [[0, -24, 90, 2], [0, 26, 90, 2], [-45, 1, 2, 50], [45, 1, 2, 50]]) { g.add(blk(w, 2, d, CY.wood, 'wood', x, 6, z)); g.add(blk(w, 2, d, CY.wood, 'wood', x, 12, z)); }
    for (const [x, z] of [[-45, -24], [45, -24], [-45, 26], [45, 26], [-15, 26], [15, 26]]) g.add(cyl3(1.8, 1.8, 16, CY.woodD, 'bark', x, 0, z, 6));
    g.add(blk(36, 1.4, 20, '#c8a860', 'thatch', -22, 18, -16)); for (const [x, z] of [[-38, -24], [-6, -24], [-38, -8], [-6, -8]]) g.add(cyl3(1.2, 1.2, 18, CY.wood, 'wood', x, 0, z, 5));
    if (t >= 2) { g.add(blk(20, 5, 6, CY.woodD, 'planks', 24, 0, -14)); g.add(dome(10, 12, '#d8b860', 'thatch', 30, 0, 8)); }
    if (t >= 3) { g.add(blk(30, 6, 8, CY.woodD, 'wood', 0, 6, 40)); for (const s of [-1, 1]) { const wh = cyl3(5, 5, 2, CY.woodD, 'wood', 0, 0, 0, 10); wh.rotation.x = Math.PI / 2; wh.position.set(...P(s * 10, 5, 45)); g.add(wh); } g.add(cone(4 / PXU, 10 / PXU, '#6a6a6c', 'iron', P(20, 9, 40), [0, 0, -Math.PI / 2], 6)); }
    g.add(creature(t >= 3 ? 'ramAurochs' : t >= 2 ? 'warAurochs' : 'aurochs', 10, 0, 6, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw5(t) { // turnia roków: wysoka czerwona iglica skalna z gniazdem z gałęzi i jajami; 2: gromowa turnia – wyższa, błękitne runy burzy; 3: turnia nawałnicy – druga iglica
    const g = new THREE.Group(), h = [80, 96, 104][t - 1]; g.add(boulder(0, 0, -10, 34, CY.rockD, 251, 0.6)); g.add(cone(22 / PXU, h / PXU, CY.rock, 'rock', P(0, h / 2, -10), null, 8)); g.add(cyl3(10, 12, 8, CY.rock, 'rock', 0, h - 12, -10, 8));
    g.add(torus(14 / PXU, 4 / PXU, CY.woodD, 'bark', P(0, h - 2, -10), [Math.PI / 2, 0, 0])); for (let i = 0; i < 3; i++) g.add(sph(3.4 / PXU, '#f0e8d0', 'bone', P(-4 + i * 4, h, -10), [1, 1.3, 1], 8));
    if (t >= 2) for (let i = 0; i < 3; i++) { const rn = blk(4, 8, 0.6, '#8ad8ff', 'glow', -4 + i * 4, h * 0.4 + i * 8, 6); rn.material = lightMat('#9ae0ff'); g.add(rn); }
    if (t >= 3) g.add(cone(14 / PXU, h * 0.7 / PXU, CY.rockD, 'rock', P(36, h * 0.35, -20), null, 8));
    g.add(creature(t >= 3 ? 'tempestBird' : t >= 2 ? 'thunderbird' : 'roc', 0, h, -6, 0.45, -Math.PI / 2 + 0.4)); return g; },
  dw6(t) { // jaskinia cyklopów: wielka czerwona skała z jaskinią, nad wejściem namalowane oko; 2: królewska pieczara – kamienny tron przed wejściem; 3: pradawna – stos głazów do rzucania
    const g = new THREE.Group(); g.add(boulder(0, 0, -20, 48, CY.rock, 261, 0.9)); g.add(opening(28, 26, 0, 0, 16, { inner: '#140a06', frame: CY.rockD, frameKind: 'rubble', sill: false }));
    g.add(sph(6 / PXU, '#f0e8d8', 'plaster', P(0, 36, 22), [1.6, 1, 0.3], 10)); g.add(sph(3 / PXU, CY.red, 'cloth', P(0, 36, 23.6), [1, 1, 0.3], 8));
    if (t >= 2) { g.add(blk(18, 8, 12, CY.rockD, 'rubble', -34, 0, 22)); g.add(blk(18, 22, 4, CY.rockD, 'rubble', -34, 8, 16)); }
    if (t >= 3) for (const [x, z, r] of [[36, 20, 7], [44, 26, 6], [40, 14, 5]]) g.add(boulder(x, 0, z, r, CY.rockD, 262 + x, 0.9));
    g.add(creature(t >= 3 ? 'elderCyclops' : t >= 2 ? 'cyclopsKing' : 'cyclops', 24, 0, 26, 0.5, -Math.PI / 2 + 0.4)); return g; },
  dw7(t) { // legowisko behemota: arena w kraterze otoczona głazami, olbrzymie żebra (kości osadzone w ziemi) i behemot; 2: pradawne – więcej żeber i kły; 3: pierwotne – czerwone skały i ognie
    const g = new THREE.Group(), k = t >= 3 ? 1.2 : 1; const cr = cyl3(70 * k, 60 * k, 3, '#8a5a3a', 'dirt', 0, -1, -4, 24); cr.scale.z = 0.6; g.add(cr);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; if (a > 1.3 && a < 1.85) continue; g.add(boulder(Math.cos(a) * 70 * k, 0, -4 + Math.sin(a) * 42 * k, 10 + (i % 3) * 4, i % 2 ? CY.rock : CY.rockD, 270 + i, 0.9)); }
    for (let i = 0; i < (t >= 2 ? 6 : 4); i++) g.add(torus(26 / PXU, 2.4 / PXU, CY.bone, 'bone', P(-40 + i * 12, 0, -36), [0, Math.PI / 2, 0], null, Math.PI)); /* żebra wbite w ziemię */
    if (t >= 3) for (const s of [-1, 1]) g.add(cyFire(s * 50, 30, 1.2));
    g.add(creature(t >= 3 ? 'primalBehemoth' : t >= 2 ? 'ancientBehemoth' : 'behemoth', 0, 0, 0, 0.6 * k, -Math.PI / 2 + 0.4)); return g; },
  ozd(t) { // ozdoby: 1 totem z czaszką byka, 2 ognisko z kłodami, 3 czerwona iglica skalna, 4 stojak z bronią, 5 kamienny krąg z menhirem
    const g = new THREE.Group();
    if (t === 1) { g.add(cyl3(1.8, 2.2, 30, CY.wood, 'wood', 0, 0, 0, 8)); g.add(sph(4 / PXU, CY.bone, 'bone', P(0, 30, 1.4), [1.2, 0.9, 1.3], 10)); for (const s of [-1, 1]) g.add(cone(1.4 / PXU, 9 / PXU, CY.bone, 'bone', P(s * 5, 33, 1.4), [0, 0, -s * 0.9], 6)); g.add(blk(8, 12, 0.6, CY.red, 'cloth', 0, 14, 2.2)); }
    if (t === 2) g.add(cyFire(0, 0, 1.2));
    if (t === 3) { g.add(cone(9 / PXU, 40 / PXU, CY.rock, 'rock', P(0, 20, 0), null, 7)); g.add(cone(5 / PXU, 18 / PXU, CY.rockD, 'rock', P(8, 9, 3), null, 6)); }
    if (t === 4) { for (const x of [-10, 10]) g.add(cyl3(1, 1, 18, CY.woodD, 'wood', x, 0, 0, 5)); g.add(blk(22, 1.6, 1.6, CY.woodD, 'wood', 0, 16, 0)); for (let i = 0; i < 3; i++) { g.add(blk(1, 16, 1, CY.wood, 'wood', -6 + i * 6, 2, 1.4)); g.add(blk(6, 5, 1, '#8a8a8c', 'iron', -6 + i * 6 + 2, 14, 1.4)); } }
    if (t === 5) { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(boulder(Math.cos(a) * 14, 0, Math.sin(a) * 9, 3, CY.rockD, 290 + i, 0.9)); } g.add(blk(5, 24, 4, CY.rock, 'rock', 0, 0, 0)); }
    return g; },
};
TOWN3.stronghold = STRONGHOLD3;
