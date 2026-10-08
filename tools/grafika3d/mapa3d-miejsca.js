// ==================== MODELE 3D MIEJSC, KOPALŃ I SKARBCÓW MAPY (narzędzie) ======================
// Budowane w pikselach sceny (pomocnicze bryły z budowle.js: blk, cyl3, gable, opening…), 1 pole mapy = 60 px sceny,
// więc całość skalowana o 0,5 (świat budowli: 30 px = 1, świat mapy: 1 = pole). Miejsce: 1 pole, środek pola na ziemi.
// Kopalnia i skarbiec: 2×2 pola, (0,0) = środek bloku; wejście w prawym dolnym polu (x ≈ +30, z ≈ +30).
/* global THREE, MAP3, mpGrp, mpRes, blk, cyl3, coneRoof, dome, gable, hipRoof, opening, door, merlons, crenTop, ringMerlons, timberFrame, mast, hangBanner, chimney, finial, crossTop, starTop, water, P, PXU,
   sph, cyl, cone, box, rbox, torus, lathe, tube, slab, chunk, mesh, leafClump, mpPine, mpOak, mpDead, mpRockMesh, MP_ROCK, rng, DK, LT, lightMat, creature, arGem */
const mqWrap = g => { const w = mpGrp(g); w.scale.setScalar(0.5); return mpGrp(w); };
const mqRes = (r, x, z, s = 1) => { const g = mpRes(r); g.scale.setScalar(2 * s); g.position.set(...P(x, 0, z)); return g; }; // stos surowca (w polach) w pikselach sceny
const mqRock = (pal, x, z, rx, ry, rz, seed, peak = false) => { const m = mpRockMesh(rx / PXU, ry / PXU, rz / PXU, MP_ROCK[pal], seed, 14, null, false, peak); m.position.set(...P(x, 0, z)); return m; };
const mqGlow = (r, col, x, y, z) => { const m = sph(r / PXU, col, 'glow', P(x, y, z), null, 14); m.material = lightMat(col); return m; };
const mqTree = (x, z, s = 1, kind = 'oak') => { const R = rng(Math.round(x * 13 + z * 7)), t = kind === 'pine' ? mpPine(R, false, s) : kind === 'dead' ? mpDead(R, '#3a3020', s) : mpOak(R, 1, s); t.scale.multiplyScalar(2); t.position.set(...P(x, 0, z)); return t; };
const ST = { stone: '#9a948a', stoneD: '#6e6a62', wood: '#7a5230', woodD: '#4a3020', roof: '#8a3a22', slate: '#4a5a7a', thatch: '#c8a860', plaster: '#e8dcc0' };
// --- miejsca (1 pole) ---
const SITE3 = {
  shrine() { const g = new THREE.Group(); g.add(blk(44, 8, 34, ST.stoneD, 'ashlar')); g.add(blk(30, 34, 24, ST.stone, 'ashlar', 0, 8, 0)); g.add(gable(30, 24, 18, ST.slate, 'tiles', 0, 42, 0, 4, ST.stone, 'ashlar'));
    g.add(opening(12, 20, 0, 12, 12, { glow: '#8ac8ff', frame: ST.stoneD, frameKind: 'ashlar' })); g.add(mqGlow(3, '#bfe0ff', 0, 22, 16)); g.add(starTop(0, 60, 0, '#bfe0ff', 5)); return g; },
  well() { const g = new THREE.Group(); g.add(cyl3(16, 16, 14, ST.stone, 'rubble')); g.add(cyl3(12, 12, 1, '#2a4a6a', 'win', 0, 13.5, 0)); for (const s of [-1, 1]) g.add(blk(3, 34, 3, ST.woodD, 'wood', s * 14, 10, 0));
    g.add(gable(36, 22, 12, ST.thatch, 'thatch', 0, 44, 0, 3)); g.add(cyl3(1.5, 1.5, 28, ST.woodD, 'wood', 0, 0, 0, 8)); g.children[g.children.length - 1].rotation.z = Math.PI / 2; g.children[g.children.length - 1].position.set(...P(0, 36, 0));
    g.add(cyl3(4, 3.5, 6, ST.wood, 'wood', 6, 22, 0, 10)); return g; },
  windmill(f = 0) { const g = new THREE.Group(); g.add(cyl3(18, 13, 52, ST.plaster, 'plaster')); g.add(coneRoof(15, 18, ST.roof, 'tiles', 0, 52, 0)); g.add(door(9, 14, 0, 0, 17)); g.add(opening(6, 8, 0, 30, 15, { glow: '#ffd890' }));
    const hub = new THREE.Group(); hub.position.set(...P(0, 54, 18)); hub.rotation.z = 0.3 + f * Math.PI / 8; /* 4 klatki = ćwierć obrotu (4 skrzydła) */ for (let i = 0; i < 4; i++) { const b = new THREE.Group(); b.rotation.z = i * Math.PI / 2; b.add(box(1.4 / PXU, 46 / PXU, 1 / PXU, ST.woodD, 'wood', P(0, 23, 0))); b.add(box(9 / PXU, 34 / PXU, 0.6 / PXU, '#e8e0cc', 'cloth', P(5, 28, 0.5))); hub.add(b); } hub.add(cyl(2 / PXU, 2 / PXU, 4 / PXU, ST.woodD, 'wood', [0, 0, 0], [Math.PI / 2, 0, 0])); g.add(hub); return g; },
  waterMill(f = 0) { const g = new THREE.Group(); g.add(blk(40, 30, 30, ST.stone, 'rubble', -6, 0, 0)); g.add(gable(40, 30, 18, ST.roof, 'tiles', -6, 30, 0, 4, ST.plaster)); g.add(door(9, 14, -12, 0, 15)); g.add(opening(7, 8, 2, 14, 15, { glow: '#ffd890' }));
    g.add(water(20, 44, 26, 0)); const wh = new THREE.Group(); wh.position.set(...P(18, 16, 0)); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; wh.add(box(1.5 / PXU, 6 / PXU, 10 / PXU, ST.wood, 'wood', P(Math.cos(a) * 14, Math.sin(a) * 14, 0), [0, 0, a])); }
    wh.add(torus(14 / PXU, 1 / PXU, ST.woodD, 'wood', [0, 0, 0.12], [0, Math.PI / 2, 0])); wh.add(torus(14 / PXU, 1 / PXU, ST.woodD, 'wood', [0, 0, -0.12], [0, Math.PI / 2, 0])); wh.rotation.y = Math.PI / 2; wh.rotation.x = f * Math.PI / 20; g.add(wh); /* koło: 10 łopat, klatka = ćwierć podziałki */ return g; },
  camp(f = 0) { const g = new THREE.Group(); for (const [x, z, c] of [[-14, -6, '#a8402a'], [14, -4, '#c8b080']]) { g.add(cone(13 / PXU, 26 / PXU, c, 'cloth', P(x, 13, z), null, 6)); g.add(opening(6, 10, x, 0, z + 9, { frame: DK(c, 0.3), frameKind: 'cloth', sill: false, arch: false })); g.add(cyl3(0.8, 0.8, 8, ST.woodD, 'wood', x, 24, z, 6)); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(sph(2.4 / PXU, ST.stoneD, 'stone', P(Math.cos(a) * 6, 1, 16 + Math.sin(a) * 4))); } g.add(cone((4 + [0, 0.6, -0.3, 0.4][f]) / PXU, (9 + [0, 2.5, -1.5, 1.2][f]) / PXU, '#ffa040', 'glow', P(0, 5 + [0, 1.2, -0.7, 0.6][f], 16), [0, f, [0, 0.12, -0.1, 0.05][f]], 7)); g.add(mqGlow(3, '#ffd060', 0, 3, 16));
    g.add(blk(14, 12, 2, ST.woodD, 'wood', 26, 0, 10)); for (let i = 0; i < 3; i++) g.add(cyl3(0.7, 0.7, 16, '#b8c0cc', 'iron', 21 + i * 5, 0, 12, 6)); return g; },
  post() { const g = new THREE.Group(); g.add(blk(28, 44, 28, ST.stone, 'ashlar')); g.add(crenTop(28, 28, 44, ST.stone, 'ashlar')); g.add(door(10, 16, 0, 0, 14)); g.add(opening(5, 9, 0, 28, 14, { glow: '#ffd890' }));
    g.add(blk(36, 14, 4, ST.woodD, 'wood', 0, 0, 24)); g.add(hangBanner(-9, 40, 14, 7, 16, '#2a4a8a')); g.add(hangBanner(9, 40, 14, 7, 16, '#2a4a8a')); g.add(mast(0, 56, 0, 20)); return g; },
  altar() { const g = new THREE.Group(); g.add(blk(46, 6, 36, ST.stoneD, 'ashlar')); g.add(blk(36, 6, 26, ST.stone, 'ashlar', 0, 6, 0)); g.add(blk(18, 14, 12, '#5a4a6a', 'marble', 0, 12, 0));
    for (const s of [-1, 1]) { g.add(cyl3(3, 2.5, 30, ST.stone, 'marble', s * 16, 12, -8, 10)); g.add(cone(3 / PXU, 6 / PXU, '#c060ff', 'gem', P(s * 16, 45, -8))); } g.add(mqGlow(5, '#d080ff', 0, 32, 0)); g.add(arGem(5 / PXU, '#c060ff', P(0, 32, 0))); return g; },
  library() { const g = new THREE.Group(); g.add(blk(46, 32, 30, '#b8ae98', 'ashlar')); g.add(gable(46, 30, 16, ST.slate, 'tiles', 0, 32, 0, 4, '#b8ae98', 'ashlar')); for (const x of [-15, 0, 15]) g.add(opening(7, 13, x, 12, 15, { glow: '#ffd890', frame: '#7a6a5a', frameKind: 'ashlar' }));
    for (const x of [-20, -7, 7, 20]) g.add(cyl3(2.4, 2.4, 30, '#d8d0c0', 'marble', x, 0, 19, 10)); g.add(blk(48, 4, 8, '#d8d0c0', 'marble', 0, 30, 19)); g.add(door(9, 12, 0, 0, 15)); return g; },
  stone() { const g = new THREE.Group(); const s = mqRock('def', 0, 0, 14, 34, 10, 7, true); g.add(s); for (let i = 0; i < 5; i++) g.add(box(1.4 / PXU, 6 / PXU, 1 / PXU, '#60e0ff', 'glow', P(-4 + (i % 2) * 6, 8 + i * 5, 9.5)));
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; g.add(mqRock('def', Math.cos(a) * 24, Math.sin(a) * 16, 3, 5, 3, i + 20)); } g.add(mqGlow(3, '#80f0ff', 0, 40, 4)); return g; },
  temple() { const g = new THREE.Group(); g.add(blk(56, 6, 40, '#d8d0c0', 'marble')); g.add(blk(44, 30, 28, '#e8e0d0', 'marble', 0, 6, -2)); for (const x of [-20, -10, 0, 10, 20]) g.add(cyl3(2.6, 2.4, 30, '#f0ece0', 'marble', x, 6, 16, 12));
    g.add(blk(50, 4, 36, '#d8d0c0', 'marble', 0, 36, 0)); g.add(gable(50, 36, 12, '#c8a040', 'gold', 0, 40, 0, 2, '#e8e0d0', 'marble')); g.add(door(10, 16, 0, 6, 12, '#c8a040')); return g; },
  fountain() { const g = new THREE.Group(); g.add(cyl3(26, 26, 7, '#c8c0b0', 'marble')); g.add(cyl3(23, 23, 1, '#3a7aa0', 'win', 0, 6, 0)); g.children[1].material = new THREE.MeshStandardMaterial({ color: '#4a8ab0', roughness: 0.1, metalness: 0.3 });
    g.add(cyl3(4, 3, 20, '#d8d0c0', 'marble', 0, 6, 0, 12)); g.add(cyl3(12, 12, 3, '#d8d0c0', 'marble', 0, 26, 0)); g.add(sph(5 / PXU, '#d8d0c0', 'stone', P(0, 32, 0))); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.add(tube([[Math.cos(a) * 0.3, 1.0, Math.sin(a) * 0.3], [Math.cos(a) * 0.55, 0.95, Math.sin(a) * 0.55], [Math.cos(a) * 0.7, 0.3, Math.sin(a) * 0.7]], 0.02, 0.03, '#a8d8f0', 'gem')); }
    for (const [x, z] of [[-14, 8], [10, 12]]) g.add(sph(1.6 / PXU, '#f0c040', 'gold', P(x, 6.5, z), [1, 0.3, 1])); return g; },
  stables() { const g = new THREE.Group(); g.add(blk(54, 24, 28, ST.wood, 'wood', 0, 0, -4)); g.add(gable(54, 28, 14, ST.thatch, 'thatch', 0, 24, -4, 4, ST.wood, 'wood')); for (const x of [-16, 0, 16]) g.add(opening(11, 15, x, 0, 10, { frame: ST.woodD, sill: false, arch: false }));
    for (let i = 0; i < 6; i++) g.add(blk(2, 10, 2, ST.woodD, 'wood', -26 + i * 10, 0, 22)); g.add(blk(54, 2, 1.5, ST.woodD, 'wood', 0, 8, 22)); for (const [x, z] of [[30, 12], [36, 20]]) g.add(cyl3(6, 6, 8, '#d8b860', 'thatch', x, 0, z, 12)); return g; },
  lookout() { const g = new THREE.Group(); for (const [x, z] of [[-10, -8], [10, -8], [-10, 8], [10, 8]]) { const l = cyl3(1.6, 1.4, 66, ST.woodD, 'wood', x, 0, z, 8); l.rotation.set(z * 0.006, 0, -x * 0.006); g.add(l); }
    for (const y of [20, 42]) { g.add(blk(24, 1.5, 1.5, ST.wood, 'wood', 0, y, 9)); g.add(blk(24, 1.5, 1.5, ST.wood, 'wood', 0, y, -9)); } g.add(blk(28, 3, 24, ST.wood, 'wood', 0, 62, 0)); for (const s of [-1, 1]) g.add(blk(28, 8, 1.5, ST.wood, 'wood', 0, 65, s * 12));
    g.add(hipRoof(22, 18, 12, ST.thatch, 'thatch', 0, 80, 0, 3)); for (const [x, z] of [[-11, -9], [11, -9], [-11, 9], [11, 9]]) g.add(cyl3(1, 1, 12, ST.woodD, 'wood', x, 65, z, 6)); g.add(mast(0, 92, 0, 14)); return g; },
  obelisk() { const g = new THREE.Group(); g.add(blk(22, 6, 22, ST.stoneD, 'ashlar')); const geo = new THREE.CylinderGeometry(3 / PXU, 7 / PXU, 56 / PXU, 4); geo.rotateY(Math.PI / 4); g.add(mesh(geo, '#7a7468', 'stone', P(0, 34, 0)));
    g.add(cone(4.2 / PXU, 8 / PXU, '#c8a040', 'gold', P(0, 66, 0), [0, Math.PI / 4, 0], 4)); for (let i = 0; i < 6; i++) g.add(box(2 / PXU, 2 / PXU, 0.6 / PXU, '#f0d060', 'glow', P(-1.5 + (i % 2) * 3, 16 + i * 6, 5.4 - i * 0.3))); return g; },
  witchHut() { const g = new THREE.Group(); for (const x of [-12, 12]) for (const z of [-10, 10]) g.add(cyl3(1.6, 1.6, 16, ST.woodD, 'wood', x, 0, z, 6)); g.add(blk(32, 22, 26, '#5a4a32', 'wood', 0, 14, 0)); g.add(cone(24 / PXU, 26 / PXU, '#7a6a3a', 'thatch', P(0, 49, 0), [0.1, 0, -0.12], 7));
    g.add(opening(8, 12, -4, 14, 13, { frame: '#3a2a1a' })); g.add(opening(5, 6, 9, 24, 13, { glow: '#9aff8a' })); g.add(blk(10, 1.5, 12, ST.woodD, 'wood', -4, 13, 22)); g.add(blk(3, 14, 3, ST.woodD, 'wood', -4, 0, 28));
    g.add(sph(5 / PXU, '#2a2a2a', 'iron', P(20, 5, 16))); g.add(mqGlow(2.4, '#8aff6a', 20, 10, 16)); g.add(sph(2.2 / PXU, '#e8e0c8', 'bone', P(0, 60, 2))); return g; },
  prison() { const g = new THREE.Group(); g.add(blk(42, 34, 32, '#6a6a70', 'rubble')); g.add(crenTop(42, 32, 34, '#6a6a70', 'rubble')); g.add(opening(16, 22, 0, 0, 16, { bars: true, frame: '#3a3a40', frameKind: 'iron', inner: '#0a0a0c' }));
    for (const x of [-14, 14]) g.add(opening(5, 7, x, 20, 16, { bars: true, frame: '#3a3a40', frameKind: 'iron', sill: false })); for (const s of [-1, 1]) g.add(cyl3(1, 1, 8, '#2a2a2e', 'iron', s * 24, 10, 17, 6)); return g; },
  dwelling() { const g = new THREE.Group(); g.add(blk(40, 24, 30, ST.stone, 'rubble')); g.add(gable(40, 30, 16, '#6a4a2a', 'shingle', 0, 24, 0, 4, ST.plaster)); g.add(door(11, 16, 0, 0, 15)); for (const x of [-14, 14]) g.add(opening(6, 8, x, 10, 15, { glow: '#ffd890' }));
    g.add(blk(48, 1.5, 8, ST.woodD, 'wood', 0, 0, 24)); g.add(mast(-20, 0, 18, 46)); g.add(chimney(12, 34, -6)); return g; },
  sacrifice(f = 0) { const g = new THREE.Group(); g.add(cyl3(26, 28, 5, ST.stoneD, 'rubble')); g.add(cyl3(18, 20, 6, ST.stone, 'ashlar', 0, 5, 0)); g.add(blk(22, 10, 14, '#4a3a3a', 'marble', 0, 11, 0)); g.add(cyl3(6, 5, 4, '#2a2a2a', 'iron', 0, 21, 0, 12));
    g.add(cone((5 + [0, 0.8, -0.4, 0.5][f]) / PXU, (12 + [0, 3, -2, 1.5][f]) / PXU, '#ff7a2a', 'glow', P(0, 31 + [0, 1.5, -1, 0.7][f], 0), [0, f, [0, 0.1, -0.12, 0.06][f]], 8)); g.add(mqGlow(4, '#ffb040', 0, 28, 0)); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(cyl3(2, 1.8, 18 + (i % 2) * 6, ST.stone, 'ashlar', Math.cos(a) * 24, 0, Math.sin(a) * 18, 8)); } return g; },
  portal(f = 0) { const g = new THREE.Group(); g.add(cyl3(24, 26, 4, ST.stoneD, 'ashlar')); const arch = torus(20 / PXU, 4 / PXU, '#6a6474', 'stone', P(0, 24, 0), null, [1, 1.15, 1]); g.add(arch); for (const s of [-1, 1]) g.add(blk(9, 8, 9, '#5a5464', 'ashlar', s * 20, 0, 0));
    const disc = cyl(17 / PXU, 17 / PXU, 1 / PXU, '#60a0ff', 'glow', P(0, 24, 0), [Math.PI / 2, 0, 0], [1, 1, 1.15], 28); disc.material = lightMat('#7ab4ff'); disc.material.transparent = true; disc.material.opacity = 0.85; g.add(disc); g.add(mqGlow(6, '#e0f0ff', 0, 24, 1));
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + f * Math.PI / 12; g.add(sph(1.6 / PXU, '#bfe0ff', 'gem', P(Math.cos(a) * 20, 24 + Math.sin(a) * 23, 3))); } disc.material.opacity = 0.7 + 0.08 * f; return g; },
  gate() { /* brama podziemi jak w H3: wielka kamienna czaszka wrośnięta w skalny pagórek, odchylona ku niebu; wejście w paszczy, schody w ciemność, w oczodołach żar */
    const g = new THREE.Group(), B = '#d8ceb4', BD = '#a89c80', face = new THREE.Group(); face.position.set(...P(0, 6, 4)); face.rotation.x = -0.75; // twarz odchylona ku kamerze
    g.add(mqRock('def', 0, -22, 46, 40, 24, 101, true)); g.add(mqRock('def', -30, -2, 16, 20, 16, 102)); g.add(mqRock('def', 30, 0, 15, 18, 14, 103)); // pagórek za czaszką i po bokach
    face.add(sph(1, B, 'bone', P(0, 22, -6), [24 / PXU, 23 / PXU, 15 / PXU])); // sklepienie (płytkie)
    face.add(sph(1, BD, 'bone', P(0, 8, 2), [19 / PXU, 11 / PXU, 13 / PXU])); // szczęka i kości policzkowe
    for (const sx of [-1, 1]) { face.add(sph(1, B, 'bone', P(sx * 15, 10, 3), [8 / PXU, 7 / PXU, 8 / PXU]));
      face.add(sph(1, '#0c0806', 'stone', P(sx * 9, 21, 8), [8 / PXU, 7.5 / PXU, 3 / PXU])); face.add(mqGlow(2.4, '#ff5a10', sx * 9, 20, 10)); face.add(mqGlow(1.2, '#ffd080', sx * 9, 20, 11)); // oczodoły z żarem
      face.add(blk(11, 3, 5, BD, 'bone', sx * 9, 28, 6, [0, 0, -sx * 0.22])); // łuki brwiowe
      face.add(sph(1, '#100a08', 'stone', P(sx * 2.2, 12, 10), [2 / PXU, 3.6 / PXU, 1.6 / PXU])); } // otwór nosowy (dwa)
    for (let k = 0; k < 8; k++) face.add(blk(2.8, 5, 2.6, '#efe6cc', 'bone', -12.25 + k * 3.5, 1, 12)); // zęby górne nad paszczą
    g.add(face);
    g.add(opening(24, 16, 0, 0, 14, { frame: '#3a3430', frameKind: 'stone', sill: false, inner: '#030203', frameW: 2, arch: true })); // paszcza = wejście
    for (let k = 0; k < 7; k++) g.add(blk(3, 3.6, 2.6, '#e4dabe', 'bone', -10.5 + k * 3.5, -0.4, 17)); // zęby dolne
    for (let i = 0; i < 4; i++) g.add(blk(20 - i * 2, 1.4, 4, '#6a6474', 'ashlar', 0, -0.4 - i * 0.25, 20 + i * 4)); // schody w dół
    g.add(sph(4 / PXU, '#4a6a3a', 'fur', P(-16, 40, -12), [1.8, 0.5, 1.2])); g.add(sph(3 / PXU, '#4a6a3a', 'fur', P(18, 36, -8), [1.4, 0.5, 1]));
    for (const s of [-1, 1]) { g.add(cyl3(1, 1, 16, '#3a2a1a', 'wood', s * 24, 0, 16, 6)); g.add(cone(2.2 / PXU, 6 / PXU, '#ffa040', 'glow', P(s * 24, 19, 16), null, 6)); g.add(mqGlow(1.8, '#ffd060', s * 24, 18, 17)); // pochodnie
      g.add(sph(2.4 / PXU, '#e8e0c8', 'bone', P(s * 20, 1.5, 24))); g.add(sph(1, '#0c0806', 'stone', P(s * 20 - 0.8, 2.2, 26), [0.7 / PXU, 0.7 / PXU, 0.5 / PXU])); } // czaszki przy schodach
    return g; },
  wreck() { const g = new THREE.Group(), hull = lathe([[0.001, -0.5], [0.5, -0.45], [0.75, -0.2], [0.8, 0.1], [0.7, 0.35]].map(([r, y]) => [r, y]), '#5a3a22', 'wood', P(0, 2, 0), [0.55, 0.9, 1.6]); hull.rotation.set(0.3, 0.4, 0.5); g.add(hull);
    const m = cyl3(1.4, 1.2, 40, ST.woodD, 'wood', 0, 0, 0, 8); m.rotation.z = -0.6; m.position.set(...P(4, 10, -4)); g.add(m); g.add(slab([[0, 0], [14, 2], [12, -14], [2, -16]].map(([a, b]) => [a / PXU, b / PXU]), 0.3 / PXU, '#c8b890', 'cloth', P(12, 22, -4), [0, 0.3, -0.3]));
    for (let i = 0; i < 3; i++) g.add(blk(6, 4, 5, ST.wood, 'wood', -18 + i * 8, -1, 14 + (i % 2) * 4, [0.2, i, 0.3])); return g; },
  arena() { // okrągła arena: kamienny pierścień trybun z łukami od frontu, piaszczysty plac, proporce
    const g = new THREE.Group(), st = '#b0a490'; g.add(cyl3(28, 29, 4, ST.stoneD, 'ashlar')); g.add(cyl3(26, 27, 22, st, 'ashlar', 0, 4, 0, 28, true)); g.add(cyl3(22, 22, 14, DK(st, 0.2), 'ashlar', 0, 4, 0, 28, true)); g.add(cyl3(21, 21, 1.5, '#d8c08a', 'plaster', 0, 4, 0, 28)); /* otwarty pierścień: widać piaszczysty plac */
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.add(blk(5, 5, 4, DK(st, 0.1), 'ashlar', Math.cos(a) * 26, 22, Math.sin(a) * 26, [0, -a, 0])); }
    for (const x of [-14, 0, 14]) g.add(opening(8, 12, x, 4, 25 - Math.abs(x) * 0.18, { frame: DK(st, 0.25), frameKind: 'ashlar', inner: '#2a1c10' }));
    g.add(hangBanner(-20, 24, 18, 7, 14, '#a8302a')); g.add(hangBanner(20, 24, 18, 7, 14, '#a8302a')); g.add(mast(-20, 31, -10, 22)); g.add(mast(20, 31, -10, 22));
    for (const s of [-1, 1]) { const sw = blk(1.4, 16, 1, '#c8ccd4', 'steel', s * 4, 27, 0, [0, 0, s * 0.6]); g.add(sw); } return g; },
  school() { // szkoła magii: smukła wieża z niebieskim dachem i gwiazdą, przybudówka z drzwiami, świecące okna
    const g = new THREE.Group(), w = '#9a94b0'; g.add(cyl3(15, 17, 58, w, 'ashlar', 0, 0, -4, 18)); g.add(coneRoof(19, 30, '#3a4aa0', 'tiles', 0, 58, -4, 18)); g.add(starTop(0, 94, -4, '#bfe0ff', 6));
    for (const y of [18, 36]) g.add(opening(6, 9, 0, y, 12, { glow: '#8ab8ff', frame: '#5a5470', frameKind: 'ashlar' }));
    g.add(blk(34, 18, 18, w, 'ashlar', 0, 0, 12)); g.add(gable(34, 18, 10, '#3a4aa0', 'tiles', 0, 18, 12, 3, w, 'ashlar')); g.add(door(9, 13, 0, 0, 21, '#4a3a6a'));
    g.add(mqGlow(3, '#9ad0ff', -12, 26, 22)); g.add(mqGlow(2.4, '#c8a0ff', 12, 22, 22)); return g; },
  tree() { // drzewo wiedzy: wielki dąb w kamiennym kręgu, złote owoce wiedzy
    const g = new THREE.Group(); g.add(cyl3(17, 18, 2, '#8a8478', 'rubble')); g.add(mqTree(0, -2, 1.75, 'oak'));
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, r = 14 + (i % 3) * 5; g.add(mqGlow(2.8, '#ffd860', Math.cos(a) * r, 40 + (i % 4) * 6, Math.sin(a) * r * 0.7 + 8)); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.add(mqRock('def', Math.cos(a) * 19, Math.sin(a) * 15, 3, 4, 3, i + 140)); } return g; },
  market() { // targowisko: trzy kramy w pasiaste daszki, beczki, worki i towary
    const g = new THREE.Group();
    for (const [x, z, c] of [[-18, -8, '#c8302a'], [16, -10, '#2a6ab0'], [0, 14, '#d8a020']]) {
      for (const [dx, dz] of [[-9, -6], [9, -6], [-9, 6], [9, 6]]) g.add(cyl3(1, 1, 16, ST.woodD, 'wood', x + dx, 0, z + dz, 6));
      g.add(blk(20, 7, 12, ST.wood, 'wood', x, 0, z)); g.add(gable(22, 14, 6, c, 'cloth', x, 16, z, 2));
      g.add(sph(2.6 / PXU, ['#e0b040', '#c84030', '#5a9a40'][Math.abs(x) % 3], 'cloth', P(x - 4, 9, z + 2))); g.add(sph(2.2 / PXU, '#d8c890', 'cloth', P(x + 4, 9, z + 1)));
    }
    for (const [x, z] of [[30, 16], [-30, 14]]) g.add(cyl3(4, 4, 9, '#7a4a24', 'wood', x, 0, z, 12)); g.add(mqRes('gold', 22, 24, 0.6)); return g; },
  garden() { // magiczny ogród: żywopłot w kwadracie, krzewy ze świecącymi kwiatami, mała fontanna w środku
    const g = new THREE.Group(), hedge = '#3a6a2a';
    g.add(blk(52, 1, 44, '#5a7a3a', 'plaster', 0, 0, 0)); for (const [x, z, w, d] of [[0, -21, 52, 4], [-25, 0, 4, 44], [25, 0, 4, 44], [-17, 21, 18, 4], [17, 21, 18, 4]]) g.add(blk(w, 7, d, hedge, 'thatch', x, 1, z));
    for (const [x, z] of [[-14, -10], [14, -10], [-14, 8], [14, 8]]) { g.add(leafClump(0.22, '#4a8a3a', P(x, 9, z), (x + z) & 5)); }
    const cols = ['#ff70c0', '#80d0ff', '#ffe060', '#c080ff']; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; g.add(mqGlow(1.3, cols[i % 4], Math.cos(a) * 17, 5 + (i % 2) * 3, Math.sin(a) * 13)); }
    g.add(cyl3(6, 6, 4, '#c8c0b0', 'marble', 0, 1, 0, 16)); g.add(cyl3(5, 5, 0.6, '#4a8ab0', 'win', 0, 5, 0, 16)); g.add(cyl3(1.4, 1.2, 9, '#d8d0c0', 'marble', 0, 5, 0, 8)); g.add(mqGlow(1.8, '#bfe8ff', 0, 15, 0)); return g; },
  campfire(f = 0) { // ognisko: kamienny krąg, skrzyżowane polana, płomień (4 klatki), kociołek na trójnogu, kłody do siedzenia
    const g = new THREE.Group();
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.add(sph(2.6 / PXU, ST.stoneD, 'stone', P(Math.cos(a) * 8, 1, Math.sin(a) * 6))); }
    for (const r of [0.6, -0.6]) { const l = cyl3(1.4, 1.4, 14, '#5a3a20', 'bark', 0, 2, 0, 8); l.rotation.set(0, r, Math.PI / 2); l.position.set(...P(0, 3, 0)); g.add(l); }
    g.add(cone((7 + [0, 0.9, -0.5, 0.6][f]) / PXU, (18 + [0, 4, -3, 2][f]) / PXU, '#ff8a20', 'glow', P(0, 11 + [0, 2, -1.5, 1][f], 0), [0, f, [0, 0.12, -0.1, 0.06][f]], 8));
    g.add(cone(4 / PXU, 11 / PXU, '#ffe080', 'glow', P(0, 9, 0), null, 8)); g.add(mqGlow(6, '#ffb050', 0, 12, 0));
    for (const a of [0, 2.1, 4.2]) { const t = cyl3(0.6, 0.6, 22, '#3a2a1a', 'wood', Math.cos(a) * 8, 0, Math.sin(a) * 6, 6); t.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(t); }
    g.add(sph(3 / PXU, '#2a2a2a', 'iron', P(0, 21, 0), [1, 0.8, 1])); for (const [x, z, r] of [[-20, 6, 0.3], [18, -8, -0.4], [4, 18, 1.4]]) { const l = cyl3(2.6, 2.6, 12, '#7a5230', 'bark', x, 0, z, 10); l.rotation.set(0, r, Math.PI / 2); l.position.set(...P(x, 3, z)); g.add(l); }
    g.add(sph(4 / PXU, '#b89a60', 'cloth', P(-14, 4, -12), [1, 0.8, 1])); return g; },
  hillFort() { // fort na wzgórzu: skalny pagórek, palisada w krąg, drewniana wieża, kuźnia z kowadłem (ulepszanie wojsk)
    const g = new THREE.Group(); g.add(mqRock('def', 0, -4, 30, 16, 24, 151, false));
    for (let i = 0; i < 18; i++) { const a = i / 18 * 6.28; if (a > 1.2 && a < 1.9) continue; g.add(cyl3(1.8, 1.8, 15 + (i % 2) * 3, '#7a5230', 'bark', Math.cos(a) * 22, 12, -4 + Math.sin(a) * 17, 7)); g.add(cone(1.8 / PXU, 4 / PXU, '#6a4422', 'bark', P(Math.cos(a) * 22, 29 + (i % 2) * 3, -4 + Math.sin(a) * 17), null, 7)); }
    g.add(blk(14, 34, 14, '#6a4628', 'wood', -6, 12, -10)); g.add(hipRoof(18, 18, 10, '#8a3a22', 'shingle', -6, 46, -10, 3)); g.add(mast(-6, 56, -10, 16));
    g.add(blk(10, 6, 6, '#3a3a40', 'iron', 10, 12, 4)); g.add(blk(14, 2, 4, '#4a4a52', 'iron', 10, 18, 4)); g.add(mqGlow(2.6, '#ff8a30', 16, 14, -6)); return g; },
  buoy(f = 0) { // boja na wodzie: pływak w pasy, dzwon i chorągiewka; kołysze się (4 klatki)
    const g = new THREE.Group(), b = new THREE.Group(); b.rotation.z = [0, 0.12, 0, -0.12][f]; b.rotation.x = [0.06, 0, -0.06, 0][f];
    b.add(cyl3(9, 7, 7, '#c8302a', 'plaster', 0, -2, 0, 16)); b.add(cyl3(9.2, 9.2, 2.5, '#f0ece0', 'plaster', 0, 1.5, 0, 16)); b.add(cone(6 / PXU, 14 / PXU, '#c8302a', 'plaster', P(0, 12, 0), null, 12));
    for (const s of [-1, 1]) b.add(cyl3(0.8, 0.8, 16, '#3a3a40', 'iron', s * 4, 12, 0, 6)); b.add(sph(3.4 / PXU, '#c8a040', 'gold', P(0, 24, 0), [1, 1.1, 1])); b.add(mast(0, 28, 0, 12)); b.add(slab([[0, 0], [9, -1], [7, -4], [9, -7], [0, -6]].map(([a, c]) => [a / PXU, c / PXU]), 0.3 / PXU, '#2a6ab0', 'cloth', P(0, 39, 0)));
    g.add(b); g.add(torus(10 / PXU, 0.8 / PXU, '#d8eaf0', 'cloth', P(0, 0.4, 0), [Math.PI / 2, 0, 0], [1, 1, 0.3])); return g; },
  flotsam() { // dryfujące szczątki: beczki, deski, skrzynia i lina na wodzie
    const g = new THREE.Group();
    for (const [x, z, r] of [[-12, 4, 0.3], [10, -6, 1.2]]) { const c = cyl3(5, 5, 10, '#7a4a24', 'wood', 0, 0, 0, 12); c.rotation.set(Math.PI / 2, r, 0); c.position.set(...P(x, 3, z)); g.add(c); g.add(torus(5.1 / PXU, 0.6 / PXU, '#3a3a40', 'iron', P(x, 3, z), [0, r, 0])); }
    for (const [x, z, r] of [[0, 14, 0.4], [-18, -10, -0.8], [16, 10, 1.6]]) g.add(blk(18, 1.6, 4, '#8a5a30', 'wood', x, 0, z, [0, r, 0.05]));
    g.add(blk(10, 7, 8, '#6a4022', 'wood', 2, 0, -2, [0.1, 0.5, 0.15])); g.add(blk(10.5, 1.2, 8.5, '#c8a040', 'gold', 2, 6.5, -2, [0.1, 0.5, 0.15])); return g; },
  sirens() { // skała syren: omszały głaz pośrodku wody, muszle i świecące perły, wodorosty
    const g = new THREE.Group(); g.add(mqRock('def', 0, -2, 20, 20, 16, 171, false)); g.add(mqRock('def', 14, 8, 8, 7, 7, 172)); g.add(mqRock('def', -14, 9, 7, 6, 6, 173));
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; g.add(mqGlow(1.6, '#e8f4ff', Math.cos(a) * 10, 14 + (i % 2) * 4, Math.sin(a) * 7 + 2)); }
    g.add(sph(4 / PXU, '#f0c8d0', 'bone', P(-4, 22, 6), [1, 0.5, 1])); g.add(cone(1.2 / PXU, 12 / PXU, '#c8a040', 'gold', P(4, 26, 2), [0.3, 0, -0.2], 6)); // lira na szczycie
    for (const [x, z] of [[-20, 0], [20, -4], [8, 16], [-8, 16]]) g.add(tube([[x / 60, 0, z / 60], [x / 60 + 0.03, 0.18, z / 60], [x / 60 - 0.02, 0.3, z / 60]].map(p => [p[0] * 2, p[1] * 2, p[2] * 2]), 0.025, 0.012, '#2a6a3a', 'hide')); return g; },
  oasis() { // oaza: oczko wody w piasku, palmy, trawa, kamienie
    const g = new THREE.Group(), pond = cyl(20 / PXU, 20 / PXU, 1 / PXU, '#3a8ab0', 'win', P(0, 0.6, 2), null, [1, 1, 0.7], 24); pond.material = new THREE.MeshStandardMaterial({ color: '#3a90b8', roughness: 0.08, metalness: 0.4 }); g.add(pond);
    g.add(torus(20 / PXU, 2.4 / PXU, '#7a9a4a', 'thatch', P(0, 0.5, 2), [Math.PI / 2, 0, 0], [1, 0.7, 0.4]));
    for (const [x, z, h, lean] of [[-18, -10, 1, 0.2], [16, -12, 1.15, -0.25], [20, 12, 0.85, -0.15]]) { const p = new THREE.Group(); p.add(cyl3(1.8, 2.4, 44 * h, '#8a6a40', 'bark', 0, 0, 0, 8)); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; p.add(slab([[0, 0], [16, 2], [24, -6], [14, -2]].map(([u, v]) => [u / PXU, v / PXU]), 0.4 / PXU, '#3a7a2a', 'cloth', P(0, 44 * h, 0), [0.2, a, -0.5])); } p.rotation.z = lean; p.position.set(...P(x, 0, z)); g.add(p); }
    for (let i = 0; i < 4; i++) g.add(mqRock('sand', -22 + i * 12, 22, 3, 3, 3, 180 + i)); return g; },
  graveyard() { // stary cmentarz: kamienne płyty i krzyże, zbutwiałe ogrodzenie, krypta z płaskim dachem, martwe drzewo, błędne ogniki
    const g = new THREE.Group(); g.add(blk(56, 1, 44, '#4a4a3a', 'rubble', 0, 0, 0));
    for (const [x, z, h] of [[-18, -10, 12], [-6, -12, 10], [6, -10, 13], [-18, 6, 9], [-6, 8, 11], [18, 8, 10]]) { g.add(blk(7, h, 2.4, '#8a8a84', 'ashlar', x, 1, z)); g.add(cyl3(3.5, 3.5, 2.4, '#8a8a84', 'ashlar', x, h + 1, z - 1.2, 10)); }
    for (const [x, z] of [[0, 14], [12, -2]]) { g.add(blk(2, 14, 2, '#9a968c', 'ashlar', x, 1, z)); g.add(blk(9, 2, 2, '#9a968c', 'ashlar', x, 10, z)); }
    for (let i = 0; i < 9; i++) g.add(blk(1.4, 9, 1.4, '#3a2a1a', 'wood', -28 + i * 7, 1, 23)); g.add(blk(58, 1.4, 1, '#3a2a1a', 'wood', 0, 7, 23));
    g.add(blk(16, 14, 14, '#6a6a68', 'ashlar', 18, 1, -12)); g.add(blk(18, 3, 16, '#5a5a58', 'ashlar', 18, 15, -12)); g.add(door(7, 10, 18, 1, -5, '#2a2420')); g.add(mqTree(-26, -16, 0.8, 'dead'));
    for (const [x, z] of [[-10, 0], [10, 14]]) g.add(mqGlow(1.8, '#8affd0', x, 14, z)); return g; },
  magicSpring() { // magiczne źródło: kamienna niecka z jarzącą się wodą, kryształy, runiczne kamienie
    const g = new THREE.Group(); g.add(cyl3(20, 22, 6, '#7a7a88', 'ashlar', 0, 0, 0, 20)); const w = cyl(17 / PXU, 17 / PXU, 1 / PXU, '#60c0ff', 'glow', P(0, 6, 0), null, null, 20); w.material = lightMat('#7ad0ff'); g.add(w);
    g.add(mqGlow(5, '#a0e0ff', 0, 10, 0)); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + 0.4; g.add(arGem(3.5 / PXU, '#80c8ff', P(Math.cos(a) * 21, 8, Math.sin(a) * 21))); }
    for (const [x, z] of [[-24, -12], [24, -10]]) { g.add(blk(5, 18, 4, '#6a6a78', 'ashlar', x, 0, z)); for (let k = 0; k < 3; k++) g.add(box(2 / PXU, 1.4 / PXU, 0.4 / PXU, '#9ae0ff', 'glow', P(x, 5 + k * 4, z + 2.1))); } return g; },
  mushroomRing() { // grzybowy krąg: wielkie świecące grzyby w kręgu, mech, zarodniki
    const g = new THREE.Group(); g.add(cyl3(24, 24, 1, '#3a4a2a', 'thatch'));
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, x = Math.cos(a) * 18, z = Math.sin(a) * 13, h = 8 + (i % 3) * 5, c = ['#c84a8a', '#4ab0c8', '#c8a03a'][i % 3];
      g.add(cyl3(1.6, 2, h, '#e8dcc0', 'plaster', x, 1, z, 8)); g.add(sph((4 + (i % 3)) / PXU, c, 'cloth', P(x, h + 1, z), [1, 0.55, 1])); g.add(mqGlow(1.2, c, x, h + 2, z)); }
    g.add(cyl3(3, 4, 18, '#e8dcc0', 'plaster', 0, 1, 0, 10)); g.add(sph(10 / PXU, '#9a4ac8', 'cloth', P(0, 19, 0), [1, 0.5, 1])); g.add(mqGlow(3, '#d080ff', 0, 22, 0));
    for (let i = 0; i < 8; i++) { const a = i * 0.8; g.add(mqGlow(0.8, '#e0ffb0', Math.cos(a) * (6 + i), 26 + i * 2, Math.sin(a) * 5)); } return g; },
  crystalCave() { // kryształowa grota: skała z wejściem, z której wyrastają kolorowe kryształy
    const g = new THREE.Group(); g.add(mqRock('def', 0, -8, 30, 30, 22, 191, false)); g.add(opening(14, 16, 0, 0, 12, { frame: '#4a4454', frameKind: 'rubble', sill: false, inner: '#0a0810' }));
    for (const [x, y, z, s, c] of [[-16, 18, 2, 1.2, '#80c8ff'], [14, 24, -2, 1.4, '#c080ff'], [-4, 30, -8, 1.6, '#80ffd0'], [20, 8, 10, 0.9, '#80c8ff'], [-22, 4, 10, 0.8, '#c080ff']]) { g.add(cone(3 * s / PXU, 14 * s / PXU, c, 'gem', P(x, y, z), [0.2, x, -x * 0.01], 6)); g.add(cone(2 * s / PXU, 9 * s / PXU, c, 'gem', P(x + 3, y - 2, z + 1), [0.4, 0, 0.3], 6)); }
    g.add(mqGlow(3, '#a0d8ff', 0, 8, 10)); g.add(mqRes('crystal', 16, 18, 0.7)); return g; },
  dwarfForge(f = 0) { // kuźnia krasnoludów: kamienny warsztat wpuszczony w skałę, palenisko (4 klatki), kowadło, beczki
    const g = new THREE.Group(); g.add(mqRock('def', 0, -16, 34, 30, 16, 201, false)); g.add(blk(36, 22, 18, '#6a6058', 'ashlar', 0, 0, 2)); g.add(blk(40, 4, 22, '#4a443e', 'ashlar', 0, 22, 2));
    g.add(opening(14, 14, -8, 0, 11, { frame: '#3a342e', frameKind: 'ashlar', inner: '#2a0a02', glow: '#ff7a2a' })); g.add(mqGlow(3 + [0, 0.6, -0.3, 0.4][f], '#ff8a30', -8, 6, 12));
    g.add(blk(8, 6, 5, '#3a3a40', 'iron', 12, 0, 16)); g.add(blk(12, 2, 5, '#4a4a52', 'iron', 12, 6, 16)); g.add(chimney(10, 26, -2));
    for (const [x, z] of [[-24, 14], [24, 6]]) g.add(cyl3(4, 4, 8, '#7a4a24', 'wood', x, 0, z, 12)); return g; },
};
// --- kopalnie (2×2 pola) ---
function mqCave(g, pal, x, z, w = 18, h = 22) { /* wejście sztolni wpuszczone w zbocze: ciemny otwór, belki obudowy, tory wychodzące przed górę */
  g.add(blk(w, h, 14, '#0a0806', 'wood', x, 0, z - 6)); for (const s of [-1, 1]) g.add(blk(4, h, 5, ST.woodD, 'wood', x + s * (w / 2 + 1), 0, z + 1)); g.add(blk(w + 10, 4, 5, ST.woodD, 'wood', x, h, z + 1)); for (let i = 0; i < 2; i++) g.add(blk(2.5, 1.5, 30, '#6a6a70', 'iron', x - 4 + i * 8, 0, z + 16)); for (let i = 0; i < 5; i++) g.add(blk(14, 1, 3, ST.woodD, 'wood', x, 0, z + 6 + i * 6)); }
function mqHill(pal, seed) { const g = new THREE.Group(); g.add(mqRock(pal, -14, -18, 52, 58, 34, seed, true)); g.add(mqRock(pal, 30, -24, 36, 40, 28, seed + 1, true)); g.add(mqRock(pal, -46, 4, 22, 22, 22, seed + 2)); return g; }
const MINE3 = {
  wood() { const g = new THREE.Group(); g.add(blk(64, 34, 40, ST.wood, 'wood', -6, 0, -12)); g.add(gable(64, 40, 20, ST.roof, 'shingle', -6, 34, -12, 4, ST.wood, 'wood')); g.add(opening(16, 20, 14, 0, 8, { frame: ST.woodD, sill: false, arch: false }));
    const saw = cyl(13 / PXU, 13 / PXU, 1 / PXU, '#c0c4cc', 'steel', P(-24, 16, 10), [Math.PI / 2, 0, 0], null, 24); g.add(saw); g.add(blk(34, 10, 14, ST.woodD, 'wood', -24, 0, 12));
    for (let i = 0; i < 4; i++) g.add(cyl3(4, 4, 34, '#8a5a30', 'bark', 30, 4 + (i % 2) * 7, 18 + (i >> 1) * 8, 10)).rotation; g.children.slice(-4).forEach(m => { m.rotation.z = Math.PI / 2; });
    g.add(mqTree(-46, -34, 0.9, 'pine')); g.add(mqTree(44, -36, 1, 'pine')); g.add(mqRes('wood', 40, 36, 0.9)); return g; },
  ore() { const g = mqHill('def', 31); mqCave(g, 'def', -14, 14); g.add(mqRes('ore', 24, 26)); g.add(blk(16, 8, 10, ST.woodD, 'wood', -14, 0, 40)); g.add(mqRes('ore', -14, 40, 0.5)); return g; },
  mercury() { const g = new THREE.Group(); g.add(blk(48, 40, 38, '#8a8478', 'ashlar', -6, 0, -10)); g.add(hipRoof(48, 38, 18, '#4a4a6a', 'tiles', -6, 40, -10, 4)); g.add(blk(10, 30, 10, '#6a6458', 'brick', 10, 40, -16));
    g.add(door(10, 16, 6, 0, 9)); g.add(opening(9, 12, -16, 14, 9, { glow: '#9fe0b0' })); for (let i = 0; i < 3; i++) g.add(lathe([[0.001, 0], [0.2, 0.02], [0.24, 0.2], [0.08, 0.45], [0.08, 0.6]], ['#9fe0b0', '#e0c060', '#c080e0'][i], 'gem', P(-30 + i * 9, 0, 26), [0.6, 0.6, 0.6]));
    g.add(mqRes('mercury', 34, 30)); return g; },
  sulfur() { const g = mqHill('sand', 41); mqCave(g, 'sand', -14, 14); g.add(mqRes('sulfur', 24, 26, 1.2)); for (let i = 0; i < 3; i++) g.add(sph(5 / PXU, '#e8e080', 'cloth', P(-2 + i * 5, 58 + i * 8, -18), [1, 0.7, 1])); g.children.slice(-3).forEach(m => { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.5; }); return g; },
  crystal() { const g = mqHill('def', 51); mqCave(g, 'def', -14, 14); for (const [x, z, s] of [[-30, -6, 1.4], [-6, -34, 1.1], [42, -10, 0.9]]) g.add(mqRes('crystal', x, z, s)); g.add(mqRes('crystal', 24, 28)); return g; },
  gems() { const g = new THREE.Group(); const pond = cyl(46 / PXU, 46 / PXU, 1 / PXU, '#2a6aa0', 'win', P(-6, 0.5, -4), null, [1, 1, 0.7], 32); pond.material = new THREE.MeshStandardMaterial({ color: '#3a7ab0', roughness: 0.08, metalness: 0.4 }); g.add(pond);
    g.add(torus(46 / PXU, 4 / PXU, '#5a7a4a', 'stone', P(-6, 0.5, -4), [Math.PI / 2, 0, 0], [1, 0.7, 0.4])); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; g.add(mqRock('def', -6 + Math.cos(a) * 48, -4 + Math.sin(a) * 33, 6, 6, 5, i + 60)); }
    g.add(mqRes('gems', 30, 30)); for (let i = 0; i < 5; i++) g.add(arGem(2.4 / PXU, ['#40c070', '#3a80e0', '#c060e0', '#e03a3a', '#f0f0f0'][i], P(-30 + i * 12, 1.5, -10 + (i % 2) * 14))); g.add(mqTree(-50, -34, 0.9)); return g; },
  gold() { const g = mqHill('def', 61); mqCave(g, 'def', -14, 14); for (let i = 0; i < 6; i++) g.add(box(3 / PXU, 2 / PXU, 1 / PXU, '#f0c040', 'gold', P(-30 + i * 8, 20 + (i % 3) * 10, 10 - i))); g.add(mqRes('gold', 24, 28, 1.1)); g.add(blk(14, 7, 9, ST.woodD, 'wood', -14, 0, 40)); g.add(mqRes('gold', -14, 40, 0.45)); return g; },
};
// --- skarbce (2×2 pola; splądrowany: ciemniej, bez skarbów) ---
const BANK3 = {
  crypt(c) { const g = new THREE.Group(), s = c ? '#5a5854' : '#7a7872'; g.add(blk(56, 34, 44, s, 'ashlar', 6, 0, -8)); g.add(gable(56, 44, 22, DK(s, 0.25), 'slate', 6, 34, -8, 3, s, 'ashlar')); for (const x of [-12, 24]) g.add(cyl3(3, 3, 34, '#b0aea6', 'marble', x, 0, 16, 10));
    g.add(door(14, 24, 6, 0, 14, '#2a2420')); g.add(crossTop(6, 56, 14, '#d8d4c8')); for (const [x, z, h] of [[-38, 10, 16], [-30, 30, 12], [-44, -14, 14]]) { g.add(blk(10, h, 3, '#8a8a86', 'ashlar', x, 0, z)); g.add(cyl3(5, 5, 3, '#8a8a86', 'ashlar', x, h, z, 12)).rotation; }
    if (!c) g.add(mqGlow(2.4, '#7ae0c0', 6, 14, 16)); g.add(mqTree(40, -40, 0.9, 'dead')); return g; },
  orcFort(c) { const g = new THREE.Group(), w = c ? '#5a4632' : '#8a6034'; for (let i = 0; i < 13; i++) { const a = -0.3 + i / 12 * (Math.PI + 0.6), x = Math.cos(a) * 46, z = -Math.sin(a) * 34 + 6, h = 24 + (i % 3) * 4; g.add(cyl3(3, 3, h, w, 'bark', x, 0, z, 8)); g.add(cone(3 / PXU, 6 / PXU, w, 'wood', P(x, h + 3, z), null, 6)); }
    g.add(cone(26 / PXU, 30 / PXU, c ? '#5a4a3a' : '#7a5a3a', 'fur', P(-12, 15, -10), null, 8)); g.add(blk(16, 50, 16, '#5a3a1e', 'wood', 24, 0, -14)); g.add(blk(22, 4, 22, '#8a6238', 'wood', 24, 50, -14)); g.add(hipRoof(20, 20, 14, '#a8402a', 'thatch', 24, 54, -14, 3));
    g.add(opening(12, 14, -6, 0, 12, { frame: '#3a2410', sill: false, arch: false })); g.add(cyl3(1.2, 1.2, 34, '#4a3018', 'wood', 6, 0, 24, 6)); g.add(sph(4 / PXU, '#e8e0c8', 'bone', P(6, 36, 24))); if (!c) g.add(mqRes('gold', 36, 30, 0.8)); return g; },
  griffinNest(c) { const g = new THREE.Group(); g.add(mqRock('def', 0, -10, 30, 54, 26, 71, false)); g.add(mqRock('def', -34, 4, 22, 34, 20, 72, true)); g.add(mqRock('def', 32, 0, 20, 40, 18, 73, true));
    const nest = torus(11 / PXU, 4 / PXU, '#6a4a26', 'bark', P(0, 52, -6), [Math.PI / 2, 0, 0], [1, 1, 0.5]); g.add(nest); if (!c) { g.add(sph(4 / PXU, '#f0e0b0', 'bone', P(-3, 54, -6), [1, 1.3, 1])); g.add(sph(4 / PXU, '#e8c060', 'bone', P(4, 54, -4), [1, 1.3, 1])); }
    g.add(opening(14, 18, 12, 0, 14, { frame: '#5a4a3a', frameKind: 'rubble', sill: false })); return g; },
  hydraLair(c) { const g = new THREE.Group(); g.add(mqRock('def', 4, -12, 52, 46, 32, 81, false)); const pool = cyl(26 / PXU, 26 / PXU, 1 / PXU, '#2e5a4a', 'win', P(-28, 0.5, 24), null, [1, 1, 0.6], 24); pool.material = new THREE.MeshStandardMaterial({ color: '#3a6a5a', roughness: 0.1, metalness: 0.3 }); g.add(pool);
    g.add(leafClump(0.5, '#5a8a3a', [0.1, 1.5, -0.4], 2)); g.add(opening(22, 24, 14, 0, 16, { frame: '#3a4a2a', frameKind: 'rubble', sill: false, inner: '#060a06' }));
    if (!c) g.add(creature('hydra', 14, 0, 22, 0.32, 0.3)); for (const [x, z] of [[-52, 10], [-48, 34], [44, 30], [50, 12]]) for (let i = 0; i < 3; i++) g.add(tube([[x / 60 + i * 0.06, 0, z / 60], [x / 60 + i * 0.07, 0.4 + i * 0.05, z / 60]].map(p => [p[0] * 2, p[1] * 2, p[2] * 2]), 0.02, 0.01, '#6a8a2a', 'feather'));
    if (!c) g.add(mqRes('gold', -24, -2, 0.8)); return g; },
  dragonUtopia(c) { const g = new THREE.Group(); g.add(mqRock('lava', 0, -24, 50, 110, 34, 91, true)); g.add(mqRock('lava', -46, -4, 30, 60, 26, 92, true)); g.add(mqRock('lava', 46, -8, 30, 70, 26, 93, true));
    g.add(opening(30, 30, 0, 0, 10, { frame: '#3a1a14', frameKind: 'rubble', sill: false, inner: '#0a0402' })); if (!c) { g.add(mqRes('gold', -10, 24, 1.3)); g.add(mqRes('gold', 14, 26, 1.1)); g.add(mqGlow(3, '#ff5a2a', -6, 22, 11)); g.add(mqGlow(3, '#ff5a2a', 6, 22, 11)); }
    for (const [x, y] of [[-20, 40], [24, 50], [-44, 24]]) g.add(tube([[x / 30, y / 30, 0.6], [(x + 4) / 30, (y - 18) / 30, 0.7]], 0.04, 0.05, c ? '#4a2a22' : '#ff8a2a', c ? 'stone' : 'glow')); return g; },
  pyramid(c) { // piramida na piasku: schodkowa, z wejściem i złotym szczytem; splądrowana: bez złota, wejście rozbite
    const g = new THREE.Group(), st = c ? '#a8946a' : '#c8b07a'; for (let i = 0; i < 6; i++) g.add(blk(92 - i * 15, 13, 80 - i * 13, DK(st, i * 0.03), 'ashlar', 6, i * 13, -8));
    if (!c) g.add(cone(7 / PXU, 10 / PXU, '#e8c040', 'gold', P(6, 80, -8), [0, Math.PI / 4, 0], 4)); g.add(opening(14, 18, 6, 0, 33, { frame: '#8a7a54', frameKind: 'ashlar', sill: false, inner: '#0a0806' }));
    for (const x of [-14, 26]) { g.add(blk(8, 6, 14, '#b8a070', 'ashlar', x, 0, 38)); g.add(sph(4 / PXU, '#b8a070', 'stone', P(x, 9, 40), [0.8, 1, 1.3])); }
    if (!c) g.add(mqRes('gold', 34, 40, 0.8)); return g; },
  banditHideout(c) { // kryjówka zbójców: palisada, chata z bali, namioty i ognisko; łup w skrzyniach
    const g = new THREE.Group(), w = c ? '#5a4632' : '#7a5230';
    for (let i = 0; i < 14; i++) { const a = -0.2 + i / 13 * (Math.PI + 0.4), x = Math.cos(a) * 44 + 4, z = -Math.sin(a) * 34 + 8; g.add(cyl3(2.2, 2.2, 20 + (i % 2) * 4, w, 'bark', x, 0, z, 7)); }
    g.add(blk(34, 20, 22, w, 'wood', -6, 0, -10)); g.add(gable(36, 24, 12, '#5a5a3a', 'thatch', -6, 20, -10, 3, w, 'wood')); g.add(door(8, 13, -6, 0, 1));
    for (const [x, z, col] of [[22, -8, '#6a5a3a'], [24, 16, '#8a3a2a']]) { g.add(cone(10 / PXU, 18 / PXU, col, 'cloth', P(x, 9, z), null, 6)); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(sph(2 / PXU, '#5a5a58', 'stone', P(-4 + Math.cos(a) * 5, 1, 22 + Math.sin(a) * 4))); } if (!c) { g.add(cone(3 / PXU, 8 / PXU, '#ff9a30', 'glow', P(-4, 4, 22), null, 6)); g.add(mqRes('gold', 10, 30, 0.7)); g.add(blk(9, 6, 6, '#6a4022', 'wood', -22, 0, 24)); }
    return g; },
  golemWorks(c) { // warsztat golemów: kamienna hala z kopułą, kominy, posąg golema przed wejściem, rury z jarzącą się rtęcią
    const g = new THREE.Group(), st = c ? '#6a6670' : '#8a8694'; g.add(blk(64, 34, 44, st, 'ashlar', 4, 0, -10)); g.add(dome(18, 14, '#6a8ab0', 'tiles', 4, 34, -10)); for (const x of [-18, 26]) g.add(chimney(x, 34, -24));
    g.add(door(16, 22, 4, 0, 12, '#3a3440')); g.add(blk(10, 4, 10, '#5a5664', 'ashlar', -20, 0, 22)); const gol = new THREE.Group(); gol.add(blk(10, 14, 6, '#9a9488', 'rubble', 0, 8, 0)); gol.add(blk(6, 6, 5, '#9a9488', 'rubble', 0, 22, 0)); for (const s of [-1, 1]) { gol.add(blk(4, 12, 4, '#8a8478', 'rubble', s * 7.5, 9, 0)); gol.add(blk(4, 9, 4, '#8a8478', 'rubble', s * 3, 0, 0)); }
    gol.position.set(...P(-20, 4, 22)); g.add(gol); if (!c) { g.add(mqGlow(2.4, '#9fe0b0', -20, 30, 25)); for (let i = 0; i < 3; i++) g.add(cyl3(1.5, 1.5, 20, '#9fe0b0', 'glow', 28 + i * 6, 0, 16, 8)); }
    return g; },
};
function mqCaravan(f) { // kryty wóz (plandeka w barwie gracza), koń w zaprzęgu; f: klatka kół i kroku konia
  const g = new THREE.Group(), K = '#ff00ff'; g.add(blk(44, 6, 24, ST.wood, 'wood', 6, 10, 0)); const cover = new THREE.Mesh(new THREE.CylinderGeometry(13 / PXU, 13 / PXU, 40 / PXU, 16, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: K, roughness: 0.9, side: THREE.DoubleSide }));
  cover.rotation.set(Math.PI / 2, 0, Math.PI / 2); cover.position.set(...P(6, 16, 0)); g.add(cover); for (const x of [-12, 6, 24]) g.add(torus(13 / PXU, 1 / PXU, '#e8dcc0', 'cloth', P(x, 16, 0), [0, Math.PI / 2, 0], null, Math.PI));
  for (const x of [-8, 20]) for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(...P(x, 7, s * 13)); w.rotation.z = -f * Math.PI / 4; w.add(torus(7 / PXU, 1.2 / PXU, '#3a2410', 'wood', [0, 0, 0])); for (let i = 0; i < 4; i++) w.add(box(0.8 / PXU, 13 / PXU, 0.8 / PXU, '#7a5a3a', 'wood', [0, 0, 0], [0, 0, i * Math.PI / 4])); g.add(w); }
  g.add(cyl3(0.8, 0.8, 30, ST.woodD, 'wood', -30, 8, 0, 6)); g.children[g.children.length - 1].rotation.z = Math.PI / 2; g.children[g.children.length - 1].position.set(...P(-32, 9, 0));
  const horse = new THREE.Group(), body = cap(0.16, 0.42, '#8a5a30', 'hide', [0, 0.62, 0], [0, 0, Math.PI / 2]); horse.add(body); const sw = [0.12, -0.12, 0.06, -0.06][f] ;
  for (const [x, s] of [[0.22, 1], [-0.22, -1]]) for (const z of [-0.08, 0.08]) horse.add(cyl(0.035, 0.03, 0.5, '#6a4424', 'hide', [x, 0.3, z], [0, 0, s * sw * (z > 0 ? 1 : -1)]));
  horse.add(cap(0.07, 0.2, '#8a5a30', 'hide', [-0.36, 0.84, 0], [0, 0, -0.9])); horse.add(cap(0.06, 0.14, '#7a4a24', 'hide', [-0.48, 0.92, 0], [0, 0, Math.PI / 2.4])); horse.add(box(0.2, 0.05, 0.03, '#2a1a10', 'hair', [-0.3, 0.92, 0], [0, 0, -0.9]));
  horse.add(tube([[0.27, 0.68, 0], [0.38, 0.55, 0], [0.4, 0.38, 0]], 0.04, 0.02, '#2a1a10', 'hair')); horse.scale.setScalar(1.7); horse.position.set(...P(-50, 0, 0)); g.add(horse);
  g.add(mast(-10, 22, 0, 18)); g.add(slab([[0, 0], [10, -1], [8, -5], [10, -9], [0, -8]].map(([a, b]) => [a / PXU, b / PXU]), 0.3 / PXU, K, 'cloth', P(-10, 39, 0)));
  return g; }
function mqBoatHero(f) { const g = mqBoat(true); g.rotation.z = [0, 0.04, 0, -0.04][f]; return g; }
// Statek piracki: większy kadłub, dwa maszty z czarnymi żaglami (biała czaszka), proporzec, latarnia na rufie; kołysze się (4 klatki)
function mqPirate(f) {
  const g = new THREE.Group(), L = 2.6, B = 0.8, H = 0.42; g.add(mqHull(L, B, H, '#3a2618')); const inner = mqHull(L * 0.9, B * 0.82, H * 0.9, '#1e140c'); inner.position.y = 0.06; g.add(inner);
  for (const y of [0.14, 0.28]) { const st = mqHull(L * 1.002, B * 1.01, 0.03, '#7a1e18'); st.position.y = y; g.add(st); } // czerwone pasy burty
  for (const [x, h, w] of [[-0.35, 1.7, 0.95], [0.55, 1.35, 0.75]]) { g.add(cyl(0.03, 0.024, h, '#2a1a10', 'wood', [x, H + h / 2, 0]));
    const sail = new THREE.PlaneGeometry(w, h * 0.62, 8, 8), sp = sail.attributes.position; for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / (w / 2), v = sp.getY(i) / (h * 0.62) + 0.5; sp.setZ(i, 0.14 * (1 - u * u) * Math.sin(v * Math.PI)); }
    sail.computeVertexNormals(); const sm = new THREE.Mesh(sail, new THREE.MeshStandardMaterial({ color: '#1a1818', roughness: 0.95, side: THREE.DoubleSide })); sm.position.set(x, H + h * 0.55, 0.03); g.add(sm);
    g.add(sph(0.09, '#e8e0cc', 'bone', [x, H + h * 0.6, 0.18], [1, 1.05, 0.4])); for (const s2 of [-1, 1]) g.add(sph(0.022, '#1a1818', 'stone', [x + s2 * 0.035, H + h * 0.62, 0.22])); } // czaszka na żaglu
  g.add(slab([[0, 0], [0.32, -0.04], [0.24, -0.11], [0.32, -0.18], [0, -0.17]], 0.008, '#c81e1e', 'cloth', [-0.35, H + 1.68, 0])); // czerwony proporzec
  g.add(box(0.36, 0.22, B * 0.7, '#3a2618', 'wood', [-L * 0.42, H + 0.11, 0])); g.add(sph(0.05, '#ffc860', 'glow', [-L * 0.52, H + 0.3, 0.1])); // nadbudówka rufowa z latarnią
  g.add(cyl(0.016, 0.016, 0.7, '#2a1a10', 'wood', [L / 2 + 0.12, H + 0.16, 0], [0, 0, -1.1]));
  g.rotation.z = [0, 0.05, 0, -0.05][f]; const w = mpGrp(g); w.scale.setScalar(30 / PXU * 0.85); return w;
}
// --- morze: wir i latarnia ---
Object.assign(SITE3, {
  whirlpool(f = 0) { // wir: spiralne pasma piany wokół ciemnego leja, obracają się (4 klatki = ćwierć obrotu)
    const g = new THREE.Group(), funnel = cyl(24 / PXU, 2 / PXU, 6 / PXU, '#0e2a3a', 'win', P(0, -1, 0), null, null, 24); funnel.material = new THREE.MeshStandardMaterial({ color: '#0e2a3a', roughness: 0.1, metalness: 0.4 }); g.add(funnel);
    for (let arm = 0; arm < 3; arm++) { const pts = []; for (let t = 0; t <= 1.001; t += 0.05) { const a = arm * 2.094 + t * 5.2 + f * Math.PI / 6, r = 26 * (1 - t * 0.85); pts.push(P(Math.cos(a) * r, 1.2 - t * 1.5, Math.sin(a) * r * 0.9)); }
      g.add(tube(pts, 2.4 / PXU, 0.5 / PXU, '#e8f4f8', 'cloth')); }
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + f * 0.5; g.add(sph(1.6 / PXU, '#f4fbff', 'cloth', P(Math.cos(a) * 28, 0.6, Math.sin(a) * 25), [1.6, 0.4, 1])); }
    g.add(mqGlow(3, '#7ad0ff', 0, 0, 0)); return g; },
  lighthouse() { // latarnia morska: skała przy brzegu, wieża w czerwone i białe pasy, galeria, jarzące się światło; maszt z flagą właściciela
    const g = new THREE.Group(); g.add(mqRock('def', 0, 2, 26, 12, 22, 131, false)); g.add(blk(24, 6, 22, '#8a8478', 'rubble', 0, 8, 0));
    for (let k = 0; k < 5; k++) g.add(cyl3(10 - k * 1.1, 9 - k * 1.1, 11, k % 2 ? '#f0ece0' : '#b02a20', 'plaster', 0, 14 + k * 11, 0, 18));
    g.add(cyl3(10, 10, 2, '#3a3a40', 'iron', 0, 69, 0, 18)); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; g.add(cyl3(0.5, 0.5, 6, '#3a3a40', 'iron', Math.cos(a) * 9, 71, Math.sin(a) * 9, 4)); }
    const lamp = cyl(5 / PXU, 5 / PXU, 8 / PXU, '#ffe080', 'glow', P(0, 75, 0), null, null, 12); lamp.material = lightMat('#fff0a0'); g.add(lamp); g.add(mqGlow(9, '#ffe890', 0, 75, 0));
    g.add(coneRoof(7, 9, '#3a3a40', 'iron', 0, 79, 0, 12)); g.add(door(7, 10, 0, 14, 10, '#3a2a1a', '#8a8478')); g.add(mast(14, 14, 6, 26)); return g; },
});
// --- miejsca przygody ---
Object.assign(SITE3, {
  sphinx() { // sfinks: leżący lew z ludzką głową w pasiastej chuście, na piaskowcowym cokole; oczy świecą, przy nim złamane kolumny
    const g = new THREE.Group(), S = '#d2b882', SD = '#b89a64'; g.add(blk(40, 8, 60, SD, 'ashlar', 0, 0, -4)); g.add(blk(44, 2, 64, DK(SD, 0.15), 'ashlar', 0, 0, -4));
    g.add(sph(1, S, 'stone', P(0, 17, -10), [11 / PXU, 9 / PXU, 19 / PXU])); g.add(sph(1, S, 'stone', P(0, 16, -24), [12 / PXU, 10 / PXU, 10 / PXU])); g.add(sph(1, S, 'stone', P(0, 21, 4), [10 / PXU, 12 / PXU, 9 / PXU]));
    for (const sx of [-1, 1]) { g.add(blk(6, 6, 18, S, 'ashlar', sx * 6, 8, 14)); g.add(sph(3.4 / PXU, S, 'stone', P(sx * 6, 11, 23), [1, 0.8, 1.2])); g.add(sph(1, S, 'stone', P(sx * 9, 13, -24), [4 / PXU, 6 / PXU, 8 / PXU])); }
    g.add(tube([[0, 16, -32], [6, 10, -36], [10, 9, -30]].map(q => P(...q)), 1.4 / PXU, 0.9 / PXU, S, 'stone'));
    g.add(blk(20, 18, 10, '#2a4a8a', 'cloth', 0, 24, 2)); for (const y of [27, 32, 37]) g.add(blk(20.6, 1.6, 10.6, '#d8b040', 'gold', 0, y, 2)); // chusta w pasy za głową
    for (const sx of [-1, 1]) { g.add(blk(5, 16, 9, '#2a4a8a', 'cloth', sx * 9.5, 16, 7)); g.add(blk(5.4, 1.4, 9.4, '#d8b040', 'gold', sx * 9.5, 22, 7)); g.add(blk(5.4, 1.4, 9.4, '#d8b040', 'gold', sx * 9.5, 18, 7)); }
    g.add(sph(1, S, 'stone', P(0, 32, 9), [7 / PXU, 8 / PXU, 6.5 / PXU])); g.add(blk(14, 3, 9, '#2a4a8a', 'cloth', 0, 38, 7)); g.add(blk(3, 6, 3, S, 'stone', 0, 30, 15)); /* nos */ g.add(cone(2 / PXU, 8 / PXU, SD, 'stone', P(0, 23, 13), [Math.PI, 0, 0], 8)); // broda
    for (const sx of [-1, 1]) g.add(mqGlow(1.3, '#70e8ff', sx * 3, 33, 15)); g.add(cone(2.2 / PXU, 5 / PXU, '#d8b040', 'gold', P(0, 43, 9), null, 8)); // ureus
    for (const [x, z, h] of [[-26, -18, 30], [26, -12, 18], [-26, 18, 12]]) { g.add(cyl3(4, 3.6, h, '#e0d0b0', 'marble', x, 0, z, 12)); g.add(blk(10, 3, 10, '#d0c0a0', 'ashlar', x, 0, z)); }
    g.add(blk(9, 3, 6, '#e0d0b0', 'marble', 22, 0, 14, [0, 0.6, 0.2])); return g; },
  questHut(f = 0) { // chata pustelnika: kamienna okrągła chata z dachem ze strzechy, latarnia na słupie, tablica z pergaminem (zadanie), zioła, sosny
    const g = new THREE.Group(); g.add(cyl3(16, 15, 22, '#8a8478', 'rubble', -6, 0, -6, 18)); g.add(coneRoof(19, 22, '#9a8448', 'thatch', -6, 22, -6, 18)); g.add(sph(3 / PXU, '#5a7a3a', 'fur', P(-12, 40, -4), [1.4, 0.5, 1.2]));
    g.add(door(8, 13, -6, 0, 9.5, '#4a3020', '#6a6458')); g.add(opening(5, 6, -17, 10, 5, { glow: '#ffd070', frame: '#4a3a2a' }));
    g.add(cyl3(1.2, 1, 30, '#4a3020', 'wood', 18, 0, 8, 8)); g.add(blk(8, 1.2, 1.2, '#4a3020', 'wood', 15, 29, 8)); g.add(blk(5, 6, 5, '#3a3a40', 'iron', 12, 21, 8)); g.add(mqGlow(2.4, '#ffd070', 12, 23.5, 8)); // latarnia
    g.add(cyl3(1.2, 1.2, 20, '#5a3a22', 'wood', 14, 0, -16, 8)); g.add(blk(16, 11, 1.6, '#7a5230', 'wood', 14, 12, -15)); g.add(blk(10, 8, 0.6, '#f0e0b0', 'cloth', 13, 13.5, -14)); g.add(blk(2, 2, 0.8, '#a82a20', 'cloth', 13, 13, -13.6)); // tablica z pergaminem i pieczęcią
    for (const [x, z, c] of [[-24, 12, '#4a8a3a'], [-18, 16, '#6a9a3a'], [4, 18, '#5a8a2a']]) g.add(sph(3 / PXU, c, 'fur', P(x, 2, z), [1.2, 0.8, 1]));
    g.add(blk(14, 4, 5, '#6a4a2a', 'wood', 4, 0, 14)); g.add(mqTree(-26, -20, 0.75, 'pine')); g.add(mqTree(24, -24, 0.65, 'pine')); return g; },
  inn() { // karczma przydrożna: kamienny parter, piętro z muru pruskiego, dach z dachówki, komin, szyld z kuflem, beczki, ławka, latarnie
    const g = new THREE.Group(); g.add(blk(44, 18, 30, '#8a8478', 'rubble', 0, 0, -4)); g.add(blk(48, 17, 33, '#e8dcc0', 'plaster', 0, 18, -4)); g.add(timberFrame(48, 17, 0, 18, 12.6, '#3a2416', 4));
    g.add(gable(48, 33, 14, '#8a3a22', 'tiles', 0, 35, -4, 3, '#e8dcc0')); g.add(chimney(14, 38, -10, 16)); g.add(door(9, 14, -10, 0, 11.2, '#5a3a22', '#6a6458'));
    for (const x of [6, 17]) g.add(opening(6, 8, x, 5, 11.2, { glow: '#ffc860', frame: '#4a3a2a' })); for (const x of [-15, 0, 15]) g.add(opening(5, 7, x, 23, 12.8, { glow: '#ffd890', frame: '#3a2416', arch: false }));
    g.add(blk(12, 1.4, 1.4, '#2a2420', 'iron', 26, 30, 13)); g.add(blk(1, 3, 1, '#2a2420', 'iron', 30, 27, 13)); g.add(blk(11, 8, 1.4, '#7a5230', 'wood', 30, 19, 13)); g.add(cyl3(2, 2, 4, '#d8b040', 'gold', 30, 21, 14, 10)); g.add(cyl3(2.1, 2.1, 1, '#f4f0e0', 'cloth', 30, 25, 14, 10)); // szyld z kuflem
    for (const [x, z] of [[-24, 16], [-17, 18]]) { g.add(cyl3(4, 4.6, 9, '#7a4a24', 'wood', x, 0, z, 12)); for (const y of [1.5, 7]) g.add(cyl3(4.7, 4.7, 0.8, '#3a3a40', 'iron', x, y, z, 12)); }
    g.add(blk(16, 4, 4, '#6a4a2a', 'wood', 6, 0, 20)); g.add(blk(16, 1.4, 6, '#7a5230', 'wood', 6, 4, 20)); g.add(mqGlow(2, '#ffc060', -3, 15, 13)); g.add(mqGlow(2, '#ffc060', -17, 15, 13)); return g; },
  barrow() { // kurhan: zarośnięty kopiec, kamienne wejście (dolmen) z czarną komorą, miecz wbity w szczyt, krąg głazów, błędne ogniki
    const g = new THREE.Group(); g.add(sph(1, '#5a7436', 'fur', P(0, 0, -6), [26 / PXU, 17 / PXU, 22 / PXU])); g.add(sph(1, '#6a8440', 'fur', P(-6, 2, -12), [16 / PXU, 14 / PXU, 14 / PXU]));
    g.add(blk(13, 15, 3, '#0a0806', 'stone', 0, 0, 12)); for (const sx of [-1, 1]) g.add(blk(5, 16, 6, '#7a7a74', 'ashlar', sx * 8.5, 0, 14)); g.add(blk(24, 5, 8, '#6a6a64', 'ashlar', 0, 16, 14)); g.add(blk(26, 2, 10, '#5a5a54', 'ashlar', 0, 0, 18));
    g.add(blk(1.8, 16, 0.8, '#c8d0d8', 'steel', 2, 15, -8, [0, 0, 0.12])); g.add(blk(8, 1.4, 1.6, '#c8a040', 'gold', 0.4, 31, -8, [0, 0, 0.12])); g.add(blk(1.6, 6, 1.6, '#4a3020', 'leather', -0.3, 32, -8, [0, 0, 0.12])); g.add(sph(1.6 / PXU, '#c8a040', 'gold', P(-1.2, 38.5, -8)));
    for (let i = 0; i < 7; i++) { const a = -0.3 + i / 6 * (Math.PI + 0.6), x = Math.cos(a) * 30, z = -6 - Math.sin(a) * 24; g.add(blk(5, 10 + (i % 3) * 4, 4, '#7a7a70', 'ashlar', x, 0, z, [0, a, (i % 2 ? 0.08 : -0.06)])); }
    g.add(sph(2 / PXU, '#e8e0c8', 'bone', P(-14, 1, 18), [1, 0.9, 1.1])); for (const [x, y, z] of [[-12, 22, 6], [14, 18, 10], [6, 30, -16]]) g.add(mqGlow(1.6, '#9affd8', x, y, z)); return g; },
  caravanserai() { // karawanseraj: namioty w pasy, dywan z towarem, skrzynie, dzbany, sztandar, latarnie na sznurze
    const g = new THREE.Group(); for (const [x, z, r, h, c] of [[-14, -12, 15, 30, '#c8302a'], [14, -14, 13, 26, '#d8a030'], [20, 8, 9, 18, '#2a6ab0']]) {
      g.add(cone(r / PXU, h / PXU, c, 'cloth', P(x, h / 2, z), null, 8)); g.add(cone((r + 0.4) / PXU, (h * 0.32) / PXU, '#f0e8d8', 'cloth', P(x, h * 0.36, z), null, 8)); g.add(cone(r * 0.4 / PXU, h * 0.2 / PXU, c, 'cloth', P(x, h * 0.9, z), null, 8));
      g.add(finial(x, h - 1, z)); g.add(opening(6, 10, x, 0, z + r * 0.72, { frame: DK(c, 0.3), frameKind: 'cloth', arch: false, sill: false })); }
    g.add(blk(26, 0.6, 16, '#8a2a4a', 'cloth', -4, 0, 14)); g.add(blk(24, 0.7, 2, '#d8b040', 'cloth', -4, 0, 21));
    for (const [x, z, c] of [[-12, 12, '#c8a040'], [-6, 16, '#4a8ab0'], [2, 12, '#a04a2a']]) g.add(sph(2.6 / PXU, c, c === '#c8a040' ? 'gold' : 'stone', P(x, 3, z), [1, 1.3, 1]));
    for (const [x, z, h] of [[-26, 6, 8], [-24, 16, 6], [8, 20, 7]]) g.add(blk(8, h, 7, '#8a5a30', 'wood', x, 0, z)); g.add(mqRes('gems', -1, 14, 0.4)); g.add(mqRes('gold', 7, 15, 0.35));
    g.add(cyl3(1, 1, 36, '#5a3a22', 'wood', 0, 0, -26, 8)); g.add(hangBanner(4, 34, -26, 8, 16, '#7a2a8a')); for (let i = 0; i < 4; i++) g.add(mqGlow(1.4, '#ffc860', -22 + i * 9, 22 - (i % 2) * 2, 2)); return g; },
  wishingWell() { // studnia życzeń: marmurowa cembrowina ze świecącą wodą, cztery kolumienki, niebieska kopułka ze złotą gwiazdą, monety, kwiaty
    const g = new THREE.Group(); g.add(blk(44, 2, 44, '#b8b0a0', 'ashlar', 0, 0, 0)); g.add(cyl3(16, 17, 13, '#d8d0c0', 'marble', 0, 0, 0, 20)); g.add(cyl3(17.5, 17.5, 2, '#c8a040', 'gold', 0, 13, 0, 20));
    const w = cyl(13 / PXU, 13 / PXU, 1 / PXU, '#7ad0ff', 'glow', P(0, 13.8, 0), null, null, 20); w.material = lightMat('#8adcff'); g.add(w); g.add(mqGlow(5, '#a8e4ff', 0, 17, 0));
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(cyl3(1.8, 1.6, 26, '#f0ece0', 'marble', Math.cos(a) * 15, 13, Math.sin(a) * 15, 10)); }
    g.add(cyl3(20, 20, 2.4, '#e8e0d0', 'marble', 0, 39, 0, 20)); g.add(dome(17, 7, '#3a5a9a', 'tiles', 0, 41, 0)); g.add(starTop(0, 52, 0, '#ffd040', 5));
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; g.add(sph(1.3 / PXU, '#f0c040', 'gold', P(Math.cos(a) * (8 + (i % 3) * 2), 14.4, Math.sin(a) * (8 + (i % 3) * 2)), [1, 0.3, 1])); }
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + 0.2, c = ['#f0a0c0', '#ffffff', '#f0d060'][i % 3]; g.add(sph(1.6 / PXU, c, 'cloth', P(Math.cos(a) * 21, 2.4, Math.sin(a) * 21))); g.add(sph(2 / PXU, '#4a7a2a', 'fur', P(Math.cos(a) * 21, 1, Math.sin(a) * 21), [1.3, 0.6, 1.3])); }
    return g; },
});
// Kadłub łodzi: obrys burty (z boku) wyciągnięty na szerokość, potem zwężony ku dziobowi, rufie i stępce
function mqHull(L, B, H, col) {
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, H); sh.quadraticCurveTo(-L * 0.42, H * 0.2, -L * 0.3, 0); sh.lineTo(L * 0.32, 0); sh.quadraticCurveTo(L * 0.46, H * 0.25, L / 2 + L * 0.04, H * 1.15); sh.lineTo(-L / 2, H);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: B, bevelEnabled: false, curveSegments: 10, steps: 6 }); geo.translate(0, 0, -B / 2);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = Math.min(1, Math.abs(x) / (L / 2)), f = Math.sqrt(Math.max(0, 1 - t ** 2.4)) * (0.55 + 0.45 * Math.min(1, y / H)); p.setZ(i, z * f); }
  geo.computeVertexNormals(); return mesh(geo, col, 'wood');
}
function mqBoat(hero = false) { // łódź żaglowa: kadłub z deskami, ciemne wnętrze, ławki, maszt z wybrzuszonym żaglem (bohater: żagiel i proporzec w barwie gracza)
  const g = new THREE.Group(), L = 2.0, B = 0.62, H = 0.32, hull = mqHull(L, B, H, '#7a4a26'); g.add(hull);
  const inner = mqHull(L * 0.9, B * 0.82, H * 0.9, '#3a2414'); inner.position.y = 0.05; inner.scale.y = 0.96; g.add(inner);
  for (const y of [0.1, 0.2]) { const st = mqHull(L * 1.002, B * 1.01, 0.025, '#5a3418'); st.position.y = y; g.add(st); } // pasy desek na burcie
  g.add(cyl(0.028, 0.022, 1.55, '#4a3020', 'wood', [0.05, H + 0.75, 0])); g.add(cyl(0.015, 0.015, 0.95, '#4a3020', 'wood', [0.1, H + 1.36, 0.02], [0, 0, Math.PI / 2])); /* reja */
  const sail = new THREE.PlaneGeometry(0.85, 1.0, 8, 8), sp = sail.attributes.position; for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / 0.425, v = (sp.getY(i) + 0.5) / 1.0; sp.setZ(i, 0.16 * (1 - u * u) * Math.sin(v * Math.PI) ); }
  sail.computeVertexNormals(); const sm = new THREE.Mesh(sail, new THREE.MeshStandardMaterial({ color: hero ? '#ff00ff' : '#e8dcc0', roughness: 0.9, side: THREE.DoubleSide })); sm.position.set(0.1, H + 0.85, 0.02); /* żagiel w poprzek widoku, wybrzuszony ku kamerze */ g.add(sm);
  if (hero) g.add(slab([[0, 0], [0.3, -0.03], [0.22, -0.1], [0.3, -0.17], [0, -0.16]], 0.008, '#ff00ff', 'cloth', [0.05, H + 1.52, 0]));
  g.add(cyl(0.012, 0.012, 0.5, '#4a3020', 'wood', [L / 2 + 0.05, H + 0.1, 0], [0, 0, -1.1])); // bukszpryt
  const w = mpGrp(g); w.scale.setScalar(30 / PXU * 0.95); return w; }
const SITE3_ANIM = ['windmill', 'waterMill', 'camp', 'sacrifice', 'portal', 'campfire', 'buoy', 'dwarfForge', 'whirlpool']; // klatki 1–3 (klatka 0 = klucz bez numeru)
for (const k of Object.keys(SITE3)) { MAP3['site_' + k] = () => mqWrap(SITE3[k](0)); if (SITE3_ANIM.includes(k)) for (let f = 1; f < 4; f++) MAP3[`site_${k}_${f}`] = () => mqWrap(SITE3[k](f)); }
for (const k of Object.keys(MINE3)) MAP3['mine_' + k] = () => mqWrap(MINE3[k]());
for (const k of Object.keys(BANK3)) for (const c of [0, 1]) MAP3[`bank_${k}_${c}`] = () => mqWrap(BANK3[k](!!c));
MAP3.boat = () => mqWrap(mqBoat());
for (let f = 0; f < 4; f++) { MAP3['boatHero_' + f] = () => mqWrap(mqBoatHero(f)); MAP3['caravan_' + f] = () => mqWrap(mqCaravan(f)); MAP3['pirate_' + f] = () => mqWrap(mqPirate(f)); }
// --- miasta na mapie: fort frakcji (bez fortu: ratusz) z modeli miast (TOWN3), zmniejszony do ok. 3 pól szerokości ---
function mqFit(g, width) { const b = new THREE.Box3().setFromObject(g), sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), k = width / Math.max(sz.x, sz.z * 0.8);
  g.position.set(-c.x, -b.min.y, -c.z); const w = mpGrp(g); w.scale.setScalar(k); return mpGrp(w); }
for (const fac of Object.keys(TOWN3)) for (let lvl = 0; lvl <= 3; lvl++) MAP3[`town_${fac}_${lvl}`] = () => { // fort 1–2 to same mury: za nimi ratusz wyższego stopnia; fort 3 to cały zamek
  const M = TOWN3[fac], g = new THREE.Group(); if (lvl === 3) g.add(M.fort(3)); else { const h = M.hall(lvl + 1), hb = new THREE.Box3().setFromObject(h); g.add(h); if (lvl) { const f = M.fort(lvl), fb = new THREE.Box3().setFromObject(f); f.position.z = hb.max.z - fb.min.z + 0.2; g.add(f); } }
  return mqFit(g, lvl ? 3 : 2.2); };
