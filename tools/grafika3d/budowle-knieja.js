// ==================== KNIEJA: modele 3D budowli (wzór: SYLVAN_ART w 18-miasto-grafika.js) ====================
// Puszcza elfów: żywe drzewa z domami na platformach, omszałe głazy i menhiry, grzybowa tawerna, namioty centaurów,
// świecące kryształy i robaczki. Stworzenia (centaury, jednorożce, feniksy, drzewce, smok) z modeli jednostek.
/* global THREE, TOWN3, PXU, P, blk, cyl3, sph, cone, torus, slab, marker, mat, archMat, lightMat, DK, LT, rng, opening, door, gable, coneRoof, mast, glowMark, creature */
const SV = { bark: '#7a5a3c', barkD: '#4e3824', leaf: '#6ab84e', leafD: '#4c9a40', leafL: '#8ed262', moss: '#6a8a46', wood: '#8a6238', plank: '#a07a4a', stone: '#8a8a7c', stoneL: '#b4b4a6',
  cap: '#c8302a', capL: '#f0e8d8', glow: '#ffd890', green: '#b8ff90', gold: '#e0b040', blossom: '#eaa2c4', silver: '#d8e0ea', cloth: '#b08a58', crystal: '#4ae8a0' };
// Pień: zwężający się walec z korzeniami (fx: rozszerzona podstawa) i lekkim pochyleniem
function trunk3(x, z, h, r, { col = SV.bark, lean = 0, roots = 5, y = 0, seed = 1 } = {}) {
  const g = new THREE.Group(), R = rng(seed * 17), t = cyl3(r, r * 0.62, h, col, 'bark', x, y, z, 14); t.rotation.z = lean; g.add(t);
  for (let i = 0; i < roots; i++) { const a = i / roots * Math.PI * 2 + R(), rr = r * (0.5 + R() * 0.3), len = r * (1.1 + R() * 0.6), m = cone(rr / PXU, len / PXU, col, 'bark', P(x + Math.cos(a) * r * 0.9, y + rr * 0.4, z + Math.sin(a) * r * 0.9), [0, 0, 0], 8);
    m.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25); g.add(m); }
  return g;
}
// Korona: kiść kul z liśćmi (faktura liści), kolor z odcieniami
function crown3(x, y, z, r, col = SV.leaf, seed = 1, n = 9, fl = null) {
  const g = new THREE.Group(), R = rng(seed * 31 + 7), N = Math.round(n * 0.8) + 5;
  const cards = []; for (let i = 0; i < N; i++) { const a = R() * Math.PI * 2, q = i ? Math.sqrt(R()) : 0; cards.push([Math.cos(a) * q * r * 0.8, (R() - 0.35) * r * 0.55 * (1 - q * 0.4), Math.sin(a) * q * r * 0.7, r * (0.62 + R() * 0.25)]); }
  for (const [dx, dy, dz, sz] of cards) { const mt = new THREE.MeshStandardMaterial({ map: leafSprite(col, (R() * 6) | 0, fl), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, metalness: 0 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sz * 2 / PXU, sz * 2 / PXU), mt); m.position.set(...P(x + dx, y + dy, z + dz)); m.rotation.set(-0.35, (R() - 0.5) * 0.5, (R() - 0.5) * 0.3); if (R() < 0.5) m.scale.x = -1; g.add(m); }
  return g;
}
const tree3k = (x, z, h, r, cr, col, seed, o = {}) => { const g = new THREE.Group(); g.add(trunk3(x, z, h, r, { seed, ...o })); g.add(crown3(x, (o.y || 0) + h + cr * 0.35, z, cr, col, seed)); return g; };
// Okrągła platforma z desek wokół pnia, z barierką i chatką pod liściastym dachem
function platform(x, y, z, r, { house = true, roof = SV.leafD, hw = 22, hh = 14, glow = SV.glow } = {}) {
  const g = new THREE.Group(); g.add(cyl3(r, r, 3, SV.plank, 'planks', x, y, z, 20));
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.add(cyl3(0.8, 0.8, 6, SV.wood, 'wood', x + Math.cos(a) * (r - 1), y + 3, z + Math.sin(a) * (r - 1), 5)); }
  g.add(torus((r - 1) / PXU, 0.7 / PXU, SV.wood, 'wood', P(x, y + 9, z), [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, b = cyl3(1.2, 1.2, r * 0.9, SV.wood, 'wood', 0, 0, 0, 5); b.position.set(...P(x + Math.cos(a) * r * 0.45, y - r * 0.3, z + Math.sin(a) * r * 0.45)); b.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8); g.add(b); }
  if (house) { g.add(blk(hw, hh, hw * 0.7, SV.plank, 'planks', x, y + 3, z + r * 0.35)); g.add(opening(5, 7, x - hw * 0.22, y + 7, z + r * 0.35 + hw * 0.35, { glow, frame: SV.barkD, arch: true }));
    g.add(opening(6, 10, x + hw * 0.2, y + 3, z + r * 0.35 + hw * 0.35, { inner: '#3a2414', frame: SV.barkD, sill: false })); g.add(coneRoof(hw * 0.62, hh * 0.9, roof, 'thatch', x, y + 3 + hh, z + r * 0.35, 10)); }
  return g;
}
// Głaz / kopiec skalny (zniekształcony dwudziestościan), menhir z runą, kryształy
function boulder(x, y, z, r, col = SV.stone, seed = 1, sy = 0.7) { const geo = new THREE.IcosahedronGeometry(r / PXU, 2), p = geo.attributes.position, R = rng(seed * 13), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 0.82 + 0.3 * Math.sin(v.x * 9 + seed) * Math.cos(v.z * 7) + R() * 0.08; p.setXYZ(i, v.x * k, Math.max(v.y * k * sy, -r / PXU * 0.15), v.z * k); }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, archMat(col, 'rock')); m.position.set(...P(x, y, z)); return m; }
function menhir(x, z, w, h, col = SV.stone, rune = SV.green, lean = 0) { const g = new THREE.Group(), m = blk(w, h, w * 0.7, col, 'rock', x, 0, z); m.rotation.z = lean; g.add(m);
  g.add(blk(w * 0.3, h * 0.35, 0.6, rune, 'win', x, h * 0.4, z + w * 0.36)); g.children[1].material = lightMat(rune); return g; }
function crystals(x, y, z, s, col = SV.crystal, n = 5, seed = 3) { const g = new THREE.Group(), R = rng(seed);
  for (let i = 0; i < n; i++) { const h = s * (8 + R() * 14), m = cone(s * (2 + R() * 2) / PXU, h / PXU, col, 'gem', P(x + (R() - 0.5) * s * 14, y + h / 2, z + (R() - 0.5) * s * 8), [(R() - 0.5) * 0.6, 0, (R() - 0.5) * 0.6], 6); g.add(m); }
  return g; }
const flowers = (x, z, w, d, cols, n = 18, seed = 5) => { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < n; i++) g.add(sph(1.6 / PXU, cols[i % cols.length], 'cloth', P(x + (R() - 0.5) * w, 1.2, z + (R() - 0.5) * d), null, 6)); return g; };
const lantern = (x, y, z, col = SV.glow) => { const g = new THREE.Group(); g.add(sph(2.4 / PXU, col, 'glow', P(x, y, z), null, 8)); glowMark(g, x, y, z, 8, col); return g; };
const fireflies = (g, x, y, z, w, h, n = 8, seed = 9) => { const R = rng(seed); for (let i = 0; i < n; i++) g.add(sph(0.9 / PXU, '#f0ff90', 'glow', P(x + (R() - 0.5) * w, y + R() * h, z + (R() - 0.5) * w * 0.5), null, 5)); };
// Namiot (stożek z płótna z wejściem), wieniec z wbitych pali
function tentK(x, z, r, h, col = SV.cloth, trim = '#8a3a2a') { const g = new THREE.Group(); g.add(cyl3(r, 0.6, h, col, 'cloth', x, 0, z, 12)); g.add(cyl3(r + 0.5, r, 4, trim, 'cloth', x, 0, z, 12));
  g.add(opening(r * 0.6, h * 0.4, x, 0, z + r * 0.85, { inner: '#2a1a10', frame: DK(col, 0.3), frameKind: 'cloth', sill: false })); for (let i = 0; i < 3; i++) { const p = cyl3(0.7, 0.4, 8, SV.barkD, 'wood', x + (i - 1) * 2, h - 2, z, 5); p.rotation.z = (i - 1) * 0.3; g.add(p); } return g; }
function fence3(x0, x1, z, h = 10) { const g = new THREE.Group(); for (let x = x0; x <= x1; x += 7) g.add(cyl3(1.2, 1, h, SV.wood, 'wood', x, 0, z, 6)); g.add(blk(x1 - x0, 1.6, 1.6, SV.wood, 'wood', (x0 + x1) / 2, h * 0.45, z + 1)); g.add(blk(x1 - x0, 1.6, 1.6, SV.wood, 'wood', (x0 + x1) / 2, h * 0.8, z + 1)); return g; }
// Grzyb (trzon + kapelusz z kropkami) – dom w tawernie, ozdoby
function shroomK(x, z, r, h, { cap = SV.cap, stem = SV.capL, spots = true, seed = 4 } = {}) {
  const g = new THREE.Group(); g.add(cyl3(r * 0.42, r * 0.36, h, stem, 'plaster', x, 0, z, 18));
  const pts = [[0, 0], [r * 1.05, 0], [r * 1.1, r * 0.12], [r, r * 0.36], [r * 0.75, r * 0.62], [r * 0.4, r * 0.8], [0.01, r * 0.86]].map(([a, b]) => new THREE.Vector2(a / PXU, b / PXU));
  const c = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), archMat(cap, 'plaster')); c.position.set(...P(x, h - 2, z)); g.add(c);
  if (spots) { const R = rng(seed), prof = [[1.1, 0.12], [1, 0.36], [0.75, 0.62], [0.4, 0.8]], at = t => { const k = Math.min(2.999, t * 3), i = Math.floor(k), f = k - i; return [prof[i][0] + (prof[i + 1][0] - prof[i][0]) * f, prof[i][1] + (prof[i + 1][1] - prof[i][1]) * f]; };
    for (let i = 0; i < 14; i++) { const a = R() * Math.PI * 2, [pr, py] = at(0.1 + R() * 0.85); g.add(sph(r * (0.07 + R() * 0.05) / PXU, '#f8f4ea', 'plaster', P(x + Math.cos(a) * pr * r * 1.01, h - 2 + py * r, z + Math.sin(a) * pr * r * 1.01), [1, 0.45, 1], 8)); } } /* kropki na powierzchni kapelusza (profil jak w LatheGeometry) */
  return g;
}
const SYLVAN3 = {
  hall(t) { // ratusz: dziupla w dębie; 2: dom na platformie; 3: dwa piętra platform z mostkiem; 4: złoty Dąb Rady z latarniami i elfią iglicą
    const g = new THREE.Group(), H = [70, 92, 112, 132][t - 1], r = [18, 20, 23, 26][t - 1];
    g.add(trunk3(0, 0, H, r, { seed: 11, roots: 7 })); g.add(crown3(0, H + 30, -4, 44 + t * 8, t >= 4 ? '#c8a838' : SV.leaf, 12, 12));
    g.add(opening(13, 22, 0, 0, r * 0.95, { inner: '#2a1a0c', frame: SV.barkD, frameKind: 'bark', sill: false, frameW: 3 })); g.add(opening(7, 9, -7, 34, r * 0.82, { glow: SV.glow, frame: SV.barkD, frameKind: 'bark' }));
    if (t >= 2) g.add(platform(0, H * 0.55, 0, r + 16, { hw: 26, hh: 15 }));
    if (t >= 3) { g.add(platform(0, H * 0.82, 0, r + 10, { hw: 20, hh: 12 })); g.add(tree3k(-52, -14, 58, 10, 26, SV.leafD, 13)); g.add(platform(-52, 38, -14, 16, { hw: 16, hh: 10 }));
      const br = blk(36, 1.6, 6, SV.plank, 'planks', -30, H * 0.55 - 6, -6); br.rotation.z = 0.22; g.add(br); }
    if (t >= 4) { for (const [x, y, z] of [[-24, 70, 20], [26, 82, 16], [10, 112, 22], [-14, 128, 12], [34, 120, -8]]) g.add(lantern(x, y, z)); g.add(cyl3(5, 0.5, 34, '#e8e0c8', 'ashlar', 0, H + 52, 0, 10)); g.add(sph(3 / PXU, SV.gold, 'gold', P(0, H + 87, 0))); fireflies(g, 0, 40, 0, 120, 90, 14, 3); }
    return g; },
  fort(t) { // fort: palisada żywych drzew z bramą z gałęzi; 2: strażnice na drzewach; 3: Drzewo Rady – olbrzymi dąb z salą w koronie
    const g = new THREE.Group();
    for (let i = 0; i < 9; i++) { const x = -88 + i * 22; if (Math.abs(x) < 14) continue; g.add(tree3k(x, 30 + Math.abs(x) * -0.1, 34 + (i % 3) * 6, 5, 14, i % 2 ? SV.leaf : SV.leafD, 40 + i, { roots: 3 })); }
    const arch = torus(16 / PXU, 3 / PXU, SV.bark, 'bark', P(0, 26, 32), null, null, Math.PI); g.add(arch); g.add(cyl3(3, 3, 26, SV.bark, 'bark', -16, 0, 32, 8)); g.add(cyl3(3, 3, 26, SV.bark, 'bark', 16, 0, 32, 8));
    g.add(crown3(0, 46, 32, 14, SV.leafL, 41, 5));
    if (t >= 2) for (const s of [-1, 1]) { g.add(tree3k(s * 66, 4, 64, 9, 20, SV.leafD, 50 + s)); g.add(platform(s * 66, 48, 4, 13, { hw: 14, hh: 10 })); g.add(mast(s * 66, 72, 4, 18)); }
    if (t >= 3) { g.add(trunk3(0, -36, 150, 34, { seed: 60, roots: 8 })); g.add(crown3(0, 190, -40, 80, SV.leaf, 61, 14)); g.add(platform(0, 112, -36, 46, { hw: 40, hh: 20, roof: '#4c9a40' }));
      g.add(platform(0, 150, -36, 34, { hw: 26, hh: 14 })); for (const [x, y] of [[-30, 120], [30, 124], [0, 158], [-18, 168], [24, 172]]) g.add(lantern(x, y, -10)); g.add(mast(0, 172, -36, 24)); fireflies(g, 0, 90, -20, 160, 110, 16, 7); }
    return g; },
  guild(t) { // krąg druidów: kamienny krąg z ołtarzem; każdy stopień – wyższe drzewo-wieża z runami, wyżej świecące kręgi
    const g = new THREE.Group(), H = 34 + t * 18;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(menhir(Math.cos(a) * 34, Math.sin(a) * 18, 7, 20 + (i % 2) * 6, SV.stone, '#9ad0ff')); }
    g.add(trunk3(0, -6, H, 11, { seed: 70, col: '#6a5a48' })); g.add(sph(6 / PXU, '#9ad0ff', 'glow', P(0, H + 6, -6), null, 12)); /* szczyt wieży: kula mocy zamiast korony */
    for (let i = 0; i < t; i++) { const y = 20 + i * (H - 26) / Math.max(1, t - 1); g.add(torus(13 / PXU, 1 / PXU, '#9ad0ff', 'glow', P(0, y, -6), [Math.PI / 2, 0, 0])); g.add(opening(4, 6, 0, y - 4, 4, { glow: '#9ad0ff', frame: SV.barkD })); }
    g.add(blk(16, 7, 10, SV.stoneL, 'rock', 0, 0, 18)); g.add(sph(3 / PXU, '#9ad0ff', 'glow', P(0, 11, 18))); glowMark(g, 0, 10, 18, 12, '#9ad0ff'); glowMark(g, 0, H, 0, 20, '#9ad0ff');
    return g; },
  tavern() { // grzybowa tawerna: wielki czerwony grzyb z drzwiami i oknami, mniejsze grzyby, szyld z kuflem
    const g = new THREE.Group(); g.add(shroomK(0, 0, 40, 42, { seed: 81 })); g.add(door(12, 18, 0, 0, 15, '#6a4020', SV.barkD, 'wood'));
    for (const x of [-9, 9]) g.add(opening(6, 7, x, 26, 14, { glow: SV.glow, frame: SV.barkD })); g.add(shroomK(-40, 14, 12, 14, { cap: '#d84a2a', seed: 82 })); g.add(shroomK(34, 18, 9, 10, { cap: '#e0a030', seed: 83 }));
    g.add(cyl3(1.2, 1.2, 26, SV.wood, 'wood', 22, 0, 24, 6)); g.add(blk(12, 9, 1.5, '#e8c868', 'planks', 26, 16, 24)); g.add(blk(5, 5, 1, '#6a4020', 'wood', 26, 18, 25)); glowMark(g, 0, 28, 20, 18, SV.glow); return g; },
  market() { // targ: altany z liściastymi daszkami, kosze z owocami, beczki
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) { const x = -40 + i * 40; for (const dx of [-14, 14]) g.add(cyl3(1.5, 1.5, 26, SV.wood, 'wood', x + dx, 0, 6, 6)); g.add(blk(34, 3, 22, SV.wood, 'planks', x, 26, 6));
      g.add(blk(26, 9, 10, SV.plank, 'planks', x, 0, 12)); for (let k = 0; k < 4; k++) g.add(sph(2.6 / PXU, ['#d83a2a', '#e8c040', '#7ac040', '#c060c0'][(k + i) % 4], 'cloth', P(x - 9 + k * 6, 11, 12), null, 8)); }
    for (const x of [-64, 62]) g.add(cyl3(5, 5, 12, '#7a5030', 'wood', x, 0, 14, 12)); return g; },
  smith() { // kuźnia w pniu: ogromny pniak z wykutym paleniskiem, kowadło, miechy
    const g = new THREE.Group(); g.add(cyl3(34, 30, 30, SV.bark, 'bark', 0, 0, -4, 18)); g.add(cyl3(31, 31, 2, '#c8a070', 'wood', 0, 30, -4, 18)); g.add(trunk3(0, -4, 6, 34, { seed: 100, roots: 6 }));
    g.add(opening(20, 18, 0, 0, 26, { inner: '#1a0e08', frame: SV.barkD, frameKind: 'bark', sill: false })); const f = blk(14, 6, 4, '#ff8a2a', 'win', 0, 2, 24); f.material = lightMat('#ff9a3a'); g.add(f); glowMark(g, 0, 8, 28, 16, '#ffa040');
    g.add(blk(14, 6, 8, '#3a3a40', 'iron', 30, 6, 22)); g.add(cyl3(4, 5, 6, SV.barkD, 'bark', 30, 0, 22, 8)); marker(g, 'fx:smoke', P(8, 34, -4)); return g; },
  silo() { // spichlerz na palach z dachem z gontu, kosze, worki
    const g = new THREE.Group(); for (const [x, z] of [[-16, -10], [16, -10], [-16, 12], [16, 12]]) { g.add(cyl3(2.4, 2.4, 14, SV.barkD, 'wood', x, 0, z, 8)); g.add(sph(4 / PXU, SV.stone, 'rock', P(x, 14, z), [1, 0.5, 1], 8)); }
    g.add(blk(40, 26, 30, SV.plank, 'planks', 0, 16, 1)); g.add(gable(40, 30, 18, '#7a5a38', 'shingle', 0, 42, 1, 4, SV.plank, 'planks')); g.add(opening(10, 14, 0, 18, 16.5, { inner: '#3a2414', frame: SV.barkD, sill: false }));
    const l = blk(4, 18, 2, SV.wood, 'wood', 10, 0, 22); l.rotation.x = -0.4; g.add(l); for (let i = 0; i < 3; i++) g.add(sph(5 / PXU, '#c8a868', 'cloth', P(-26 + i * 7, 4, 20), [1, 0.8, 1], 10)); return g; },
  special() { // Skarbiec krasnoludów: kamienna brama w omszałym wzgórzu, złote wrota z runami, skrzynie z monetami
    const g = new THREE.Group(); g.add(boulder(0, 0, -10, 50, '#6a6a5e', 110, 0.62));
    g.add(blk(44, 34, 10, '#9a9688', 'ashlar', 0, 0, 22)); g.add(blk(50, 6, 12, '#7a7668', 'ashlar', 0, 34, 22)); g.add(opening(24, 26, 0, 0, 27, { inner: '#c89a30', frame: '#5a5650', frameKind: 'ashlar', sill: false, frameW: 4 }));
    g.add(blk(2, 22, 1, '#8a6a20', 'gold', 0, 1, 29)); for (const x of [-26, 26]) { g.add(blk(10, 7, 7, '#6a4422', 'wood', x, 0, 34)); g.add(sph(4 / PXU, SV.gold, 'gold', P(x, 8, 34), [1, 0.5, 1], 10)); } glowMark(g, 0, 14, 30, 18, '#ffd060'); return g; },
  grail() { // Strażnik Kniei: kolosalny pradawny drzewiec-strażnik z koroną z kwitnących gałęzi, świecące oczy i runy w korzeniach
    const g = new THREE.Group(); g.add(boulder(0, 0, 0, 70, '#5a6a50', 120, 0.35));
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.add(menhir(Math.cos(a) * 62, Math.sin(a) * 30, 8, 22, SV.stoneL, SV.green)); }
    const st = creature('treantKing', 0, 20, 0, 3.4, -Math.PI / 2, { t: 0.2 }); g.add(st); st.updateMatrixWorld(true); const top = new THREE.Box3().setFromObject(st).max.y * PXU;
    
    glowMark(g, 0, top * 0.6, 10, 70, '#b8ff90'); fireflies(g, 0, 30, 0, 160, top, 18, 12); return g; },
  dw1(t) { // gaj driad: trzy drzewa i łuk z gałęzi; 2: święty gaj – kwitnące różem; 3: jezioro rusałek – staw z liliami w kręgu kwitnących drzew
    const g = new THREE.Group(), bl = t >= 2 ? SV.blossom : SV.leafL;
    for (const [x, z, h, s] of [[-30, -6, 40, 1], [30, -4, 36, 2], [0, -16, 48, 3]]) g.add(tree3k(x, z, h, 5, 18, bl, 130 + s, { col: '#8a7050' }));
    g.add(torus(14 / PXU, 2 / PXU, '#6a4a2c', 'bark', P(0, 20, 18), null, null, Math.PI)); g.add(cyl3(2, 2, 20, '#6a4a2c', 'bark', -14, 0, 18, 6)); g.add(cyl3(2, 2, 20, '#6a4a2c', 'bark', 14, 0, 18, 6));
    g.add(flowers(0, 20, 70, 14, t >= 2 ? ['#f8d0e8', '#ffffff'] : ['#f0e070', '#ffffff'], 22, 131)); glowMark(g, 0, 14, 18, 18, '#b8ffb0');
    if (t >= 3) { const w = new THREE.Mesh(new THREE.CircleGeometry(30 / PXU, 28), new THREE.MeshStandardMaterial({ color: '#4a8aa8', roughness: 0.12, metalness: 0.3 })); w.rotation.x = -Math.PI / 2; w.position.set(...P(0, 0.6, 30)); w.scale.set(1, 0.55, 1); g.add(w);
      for (let i = 0; i < 6; i++) g.add(sph(2.4 / PXU, i % 2 ? '#ffffff' : '#f0a0c8', 'cloth', P(-20 + i * 8, 1.2, 28 + (i % 3) * 4), [1, 0.4, 1], 8)); for (const x of [-56, 56]) g.add(tree3k(x, 4, 34, 4, 15, SV.blossom, 132 + x)); g.add(creature('rusalka', 22, 0, 30, 0.5, -0.6)); fireflies(g, 0, 10, 20, 90, 50, 10, 133); }
    return g; },
  dw2(t) { // elfia strażnica: wieża z pni na palach z platformą; 2: dwie platformy; 3: łowiecka strażnica – wyższa, liściasty dach, chorągwie i stojak łuków
    const g = new THREE.Group(), H = t >= 3 ? 108 : t >= 2 ? 92 : 72;
    for (const [x, z] of [[-10, -6], [10, -6], [-10, 10], [10, 10]]) { const p = cyl3(2.6, 2, H, SV.bark, 'bark', x, 0, z, 8); p.rotation.z = -x * 0.004; g.add(p); }
    for (let y = 12; y < H - 16; y += 16) { const b = blk(26, 2, 2, SV.wood, 'wood', 0, y, 11); b.rotation.z = 0.5; g.add(b); }
    g.add(platform(0, H - 18, 2, 20, { hw: 22, hh: 14 })); if (t >= 2) g.add(platform(0, H - 50, 2, 16, { house: false }));
    if (t >= 3) { for (const s of [-1, 1]) g.add(mast(s * 22, H - 15, 2, 20)); for (let i = 0; i < 4; i++) { const b = cyl3(0.8, 0.8, 22, '#6a4424', 'wood', 26 + i * 4, 0, 18, 5); b.rotation.z = 0.2; g.add(b); } g.add(creature('elfHunter', -26, 0, 20, 0.45, -0.3)); }
    else g.add(mast(14, H - 15, 2, 16));
    return g; },
  dw3(t) { // zagroda centaurów: namiot, płot, centaur; 2: obóz wodzów – drugi namiot z chorągwią; 3: jurta chana – wielka zdobna jurta, sztandary, dwa centaury
    const g = new THREE.Group();
    if (t >= 3) { g.add(cyl3(38, 38, 20, '#d8c49a', 'cloth', 0, 0, -6, 20)); g.add(cyl3(40, 4, 26, '#b03a2a', 'cloth', 0, 20, -6, 20)); g.add(torus(38 / PXU, 1.2 / PXU, SV.gold, 'gold', P(0, 10, -6), [Math.PI / 2, 0, 0]));
      g.add(opening(14, 16, 0, 0, 31, { inner: '#2a1a10', frame: SV.gold, frameKind: 'gold', sill: false })); for (const s of [-1, 1]) g.add(mast(s * 46, 0, 10, 50)); g.add(creature('centaurKhan', -34, 0, 28, 0.62, 0.4)); g.add(creature('centaurChief', 40, 0, 26, 0.55, -0.5)); }
    else { g.add(tentK(-24, -4, 22, 38)); g.add(fence3(4, 54, 22)); g.add(creature(t >= 2 ? 'centaurChief' : 'centaur', 30, 0, 12, 0.55, -1.2)); if (t >= 2) { g.add(tentK(24, -18, 18, 32, '#c09a68')); g.add(mast(24, 32, -18, 18)); } }
    return g; },
  dw4(t) { // stary las: trzy pradawne drzewa i drzewiec; 2: pradawny las – większe; 3: królewski bór – olbrzymi dąb z koroną z kwiatów, świecące oczy, król drzewców
    const g = new THREE.Group(), k = t >= 2 ? 1.2 : 1;
    for (const [x, z, s] of [[-40, -10, 1], [40, -12, 2]]) g.add(tree3k(x, z, 46 * k, 8, 26 * k, SV.leafD, 150 + s));
    if (t >= 3) { g.add(trunk3(0, -14, 100, 22, { seed: 155, roots: 8, col: '#4a3220' })); g.add(crown3(0, 128, -16, 52, '#4e9a42', 156, 12, SV.blossom));
      for (const x of [-7, 7]) g.add(sph(2.6 / PXU, '#a0ffb0', 'glow', P(x, 56, 6), null, 8)); g.add(creature('treantKing', 30, 0, 26, 0.6, -0.8)); glowMark(g, 0, 56, 8, 20, '#a0ffb0'); }
    else { g.add(trunk3(0, -6, 60 * k, 16, { seed: 157, col: '#4a3220' })); g.add(crown3(0, 74 * k, -8, 30 + t * 5, '#4e9a42', 158, 9)); for (const x of [-5, 5]) g.add(sph(2 / PXU, t >= 2 ? '#a0ffb0' : '#e8d070', 'glow', P(x, 32 * k, 10), null, 8)); g.add(creature(t >= 2 ? 'elderTreant' : 'treant', 30, 0, 22, 0.5, -0.8)); }
    return g; },
  dw5(t) { // polana jednorożców: trylit z menhirów i jednorożec; 2: srebrna polana – srebrne kamienie i blask; 3: gwiezdna polana – krąg trylitów z gwiezdnymi kryształami
    const g = new THREE.Group(), ac = t >= 2 ? '#c8d0dc' : SV.stone, tri = (x, z, s = 1) => { const q = new THREE.Group(); q.add(menhir(x - 20 * s, z, 10 * s, 40 * s, ac, '#d8f0ff')); q.add(menhir(x + 20 * s, z, 10 * s, 40 * s, ac, '#d8f0ff')); q.add(blk(56 * s, 8 * s, 10 * s, ac, 'rock', x, 40 * s, z)); return q; };
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(50 / PXU, 28), archMat('#6a9a4a', 'grass')); lawn.rotation.x = -Math.PI / 2; lawn.position.set(...P(0, 0.4, 6)); lawn.scale.set(1, 0.6, 1); g.add(lawn);
    g.add(tri(0, -8)); g.add(flowers(0, 10, 90, 30, ['#f0e070', '#e8a0c0', '#b0d8ff'], 26, 160)); g.add(creature(t >= 3 ? 'starUnicorn' : t >= 2 ? 'silverUnicorn' : 'unicorn', 6, 0, 18, 0.55, -1.2));
    if (t >= 2) glowMark(g, 0, 26, 0, 30, '#e0e8ff');
    if (t >= 3) { for (const s of [-1, 1]) { const q = tri(s * 62, -20, 0.7); q.rotation.y = -s * 0.5; g.add(q); g.add(crystals(s * 40, 0, 20, 0.8, '#c8e0ff', 4, 161 + s)); } g.add(starTop(0, 50, -8, '#e8f0ff', 8)); }
    return g; },
  dw6(t) { // gniazdo feniksa: skalna iglica z gniazdem i feniksem; 2: słoneczne gniazdo – płomienie wokół; 3: niebiańskie gniazdo – wyższa iglica, złoty pierścień, ognisty blask
    const g = new THREE.Group(), H = t >= 3 ? 96 : 72;
    g.add(boulder(0, 0, 0, 30, '#6a6458', 170, 0.5)); const sp = cyl3(18, 10, H, '#6a6458', 'rock', 0, 0, -2, 9); g.add(sp); g.add(boulder(4, H * 0.5, -4, 16, '#5a5448', 171, 0.8));
    g.add(torus(18 / PXU, 5 / PXU, '#6a4a28', 'bark', P(0, H + 2, -2), [Math.PI / 2, 0, 0])); g.add(creature(t >= 3 ? 'celestialPhoenix' : t >= 2 ? 'sunPhoenix' : 'phoenix', 0, H + 4, -2, 0.55, -Math.PI / 2));
    if (t >= 2) for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.add(cone(3 / PXU, (10 + (i % 2) * 6) / PXU, i % 2 ? '#ffb040' : '#ff6a2a', 'fire', P(Math.cos(a) * 16, H + 8, Math.sin(a) * 16 - 2))); }
    if (t >= 3) { g.add(torus(28 / PXU, 1.6 / PXU, SV.gold, 'gold', P(0, H + 24, -2))); glowMark(g, 0, H + 10, 0, 50, '#ffb040'); } else glowMark(g, 0, H + 6, 0, 26, '#ff9040');
    return g; },
  dw7(t) { // szmaragdowa grota: skalny kopiec z jaskinią i kryształami; 2: nefrytowa grota – więcej kryształów, oczy smoka w mroku; 3: serce puszczy – wielkie wzgórze z drzewem, smok leżący u wejścia
    const g = new THREE.Group(), cc = t >= 2 ? '#4ae8a0' : '#3ac870', s = t >= 3 ? 1.3 : 1;
    g.add(boulder(0, 0, -16, 64 * s, '#5a6258', 180, 0.7));
    g.add(opening(34, 34, 0, 0, 26 * s, { inner: '#06140c', frame: '#4a5048', frameKind: 'rock', sill: false, frameW: 5 })); glowMark(g, 0, 16, 30, 40, cc);
    g.add(crystals(-34, 0, 26, 1, cc, 5, 182)); g.add(crystals(36, 0, 22, t >= 2 ? 1.1 : 0.7, cc, 5, 183));
    if (t === 2) for (const x of [-7, 7]) g.add(sph(2.2 / PXU, '#f0ff60', 'glow', P(x, 20, 26 * s), null, 8));
    if (t >= 3) { g.add(creature('forestDragon', 0, 0, 52, 0.7, -Math.PI / 2 + 0.3)); g.add(crystals(0, 0, 50, 1.3, cc, 7, 185)); }
    return g; },
};
TOWN3.sylvan = SYLVAN3;
