// ==================== MURY OBLĘŻENIA W 3D (narzędzie, nie trafia do gry) =========================
// Fragmenty murów oblężonego miasta dla każdej frakcji, wypalane przez wypal-oblezenia.js do arkusza src/grafika/oblezenia/<frakcja>.webp.
// Mur biegnie wzdłuż osi z (z północy na południe), lico od strony atakujących to -x. Kamera patrzy z lekka z południowego zachodu:
// kąt SIEGE_YAW dobrany tak, żeby oś z na ekranie schodziła o pół heksu w prawo na rząd – jak ukośny mur na polu bitwy (wallX w grze).
// Bryły stoją prosto, więc lico, wieże i brama wyglądają jak budowle widziane z boku.
// Jednostki: piksele sceny jak w budowle.js (blk, cyl3); (0, 0, 0) = lico muru na ziemi, w środku rzędu.
/* global THREE, blk, cyl3, coneRoof, dome, onionDome, ringMerlons, archMat, sph, marker, DK, LT, P, PXU */
const SIEGE_PITCH = 0.5, SIEGE_ROW = 46, SIEGE_STEP = 27; // rząd heksów: 46 px w dół i pół heksu (27 px) w prawo
const SIEGE_YAW = -Math.atan(SIEGE_STEP / SIEGE_ROW * Math.sin(SIEGE_PITCH));
const SIEGE_LZ = SIEGE_ROW / (Math.cos(SIEGE_YAW) * Math.sin(SIEGE_PITCH)) + 1.5; // długość fragmentu wzdłuż z (z zakładką)
const SIEGE3 = {
  haven: { mat: 'stone', col: '#c8bca4', kind: 'ashlar', roof: '#3a5f9e', shape: 'cone', deco: 'banner' },
  sylvan: { mat: 'wood', col: '#7a5c36', kind: 'planks', roof: '#3e8a4a', roofKind: 'leaves', shape: 'cone', deco: 'vines' },
  barrow: { mat: 'stone', col: '#6c6676', kind: 'rock', roof: '#2c2440', shape: 'spire', deco: 'skulls' },
  fortress: { mat: 'wood', col: '#6e5c3c', kind: 'planks', roof: '#8a7a40', roofKind: 'thatch', shape: 'cone', deco: 'reeds' },
  inferno: { mat: 'stone', col: '#6a4440', kind: 'brick', roof: '#5a1a14', shape: 'spire', deco: 'lava' },
  academy: { mat: 'stone', col: '#d4d8e2', kind: 'ashlar', roof: '#4a6ab8', shape: 'onion', deco: 'snow' },
  dungeon: { mat: 'stone', col: '#5a5260', kind: 'rock', roof: '#3a2a4a', shape: 'spire', deco: 'crystals' },
  stronghold: { mat: 'wood', col: '#8c5c32', kind: 'planks', roof: '#8a5a3a', roofKind: 'thatch', shape: 'cone', deco: 'skullsWood' },
};
const rnd = seed => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const emis = (w, h, d, col, x, y, z, rot) => { const m = blk(w, h, d, col, 'win', x, y, z, rot); return m; };
// Gruzy: bloki kamienia albo połamane bale rozrzucone po pasie muru
function rubble(g, S, r, x0 = -10, x1 = 50, n = 34) {
  const L = SIEGE_LZ / 2;
  if (S.mat === 'wood') { for (let i = 0; i < n * 0.6; i++) { const lg = cyl3(4, 4, 18 + r() * 14, i % 3 ? S.col : DK(S.col, 0.25), 'planks', 0, 0, 0, 8); lg.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.6, r() * Math.PI, 0); lg.position.set(...P(x0 + r() * (x1 - x0), 3 + r() * 4, -L + r() * 2 * L)); g.add(lg); } return; }
  g.add(blk(x1 - x0 - 6, 5, SIEGE_LZ * 0.9, DK(S.col, 0.2), S.kind, (x0 + x1) / 2, 0, 0));
  for (let i = 0; i < n; i++) { const s = 5 + r() * 9; g.add(blk(s, s * 0.7, s * (0.8 + r() * 0.5), i % 4 ? S.col : DK(S.col, 0.3), S.kind, x0 + r() * (x1 - x0), 2 + r() * 6, -L + r() * 2 * L, [r() * 0.6, r() * 3, r() * 0.6])); }
}
// Wieża: okrągła baszta z blankami i strzelcem na szczycie (marker fx:post), wieżyczka z dachem frakcji z tyłu
function siegeRoof(g, S, r, x, y, z) {
  const rk = S.roofKind || 'tiles';
  if (S.shape === 'onion') g.add(onionDome(r, S.roof, rk, x, y, z));
  else if (S.shape === 'spire') g.add(coneRoof(r, r * 3.2, S.roof, rk, x, y, z, 12));
  else g.add(coneRoof(r, r * 2.1, S.roof, rk, x, y, z, S.mat === 'wood' ? 8 : 16));
}
function siegeTower(g, S, r) {
  const x = 30, H = 96;
  if (S.mat === 'wood') { // wieża strażnicza z bali: cztery słupy, krzyżulce, pomost z palisadą z zaostrzonych desek
    for (const [dx, dz] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) g.add(cyl3(3.5, 3, H, DK(S.col, 0.1), 'planks', x + dx, 0, dz, 8));
    for (const dz of [-15, 15]) { const b = blk(42, 3, 3, DK(S.col, 0.3), 'planks', x, H * 0.45, dz, [0, 0, 0.7]); g.add(b); }
    g.add(blk(40, 4, 40, S.col, 'planks', x, H, 0));
    for (let i = 0; i < 9; i++) for (const side of [-1, 1]) { g.add(cyl3(2.4, 2.4, 12, S.col, 'planks', x - 18 + i * 4.5, H + 4, side * 19, 6)); g.add(cyl3(2.4, 0.3, 4, LT(S.col, 0.1), 'planks', x - 18 + i * 4.5, H + 16, side * 19, 6)); }
    for (let i = 0; i < 9; i++) { g.add(cyl3(2.4, 2.4, 12, S.col, 'planks', x - 19, H + 4, -18 + i * 4.5, 6)); g.add(cyl3(2.4, 0.3, 4, LT(S.col, 0.1), 'planks', x - 19, H + 16, -18 + i * 4.5, 6)); }
    g.add(cyl3(9, 9, 16, S.col, 'planks', x + 10, H + 4, -12, 8)); siegeRoof(g, S, 12, x + 10, H + 20, -12);
  } else {
    g.add(cyl3(37, 35, H, S.col, S.kind, x, 0, 0)); g.add(cyl3(39, 39, 8, DK(S.col, 0.15), S.kind, x, 0, 0)); g.add(cyl3(36.5, 36.5, 4, DK(S.col, 0.1), S.kind, x, H * 0.5, 0));
    g.add(ringMerlons(35, H, S.col, S.kind, x, 0, 16));
    for (const a of [2.6, 3.4]) g.add(blk(3, 9, 3, '#120c08', 'planks', x + Math.cos(a) * 35.4, H * 0.62, Math.sin(a) * 35.4)); // strzelnice
    g.add(cyl3(13, 13, 20, S.col, S.kind, x + 13, H, -16)); siegeRoof(g, S, 17, x + 13, H + 20, -16);
  }
  marker(g, 'fx:post', P(x - 2, H + 4, 6));
}
// Brama: dwie baszty (albo słupy z bali) po bokach przejazdu, wrota na licu, most zwodzony
function siegeGate(g, S, r, state) {
  const L = SIEGE_LZ / 2, wood = S.mat === 'wood', gap = L - 17;
  for (const s of [-1, 1]) {
    if (wood) { g.add(blk(12, 54, 12, DK(S.col, 0.1), 'planks', 8, 0, s * (L - 7))); g.add(cyl3(7, 0.4, 10, LT(S.col, 0.1), 'planks', 8, 54, s * (L - 7), 6)); }
    else { g.add(cyl3(19, 18, 78, S.col, S.kind, 18, 0, s * (L - 16))); g.add(ringMerlons(18, 78, S.col, S.kind, 18, s * (L - 16), 10)); siegeRoof(g, S, 14, 18, 88, s * (L - 16)); }
  }
  if (!wood) g.add(blk(50, 54, gap * 2, S.col, S.kind, 30, 0, 0)), g.add(blk(52, 3, gap * 2 + 2, DK(S.col, 0.15), S.kind, 30, 54, 0));
  g.add(blk(wood ? 14 : 8, 8, gap * 2 + 6, wood ? S.col : DK(S.col, 0.1), wood ? 'planks' : S.kind, wood ? 8 : 4, 44, 0)); // nadproże
  if (state === 'down') { // wyłamane wrota: ciemny przejazd, deski na ziemi
    g.add(blk(3, 42, gap * 2 - 2, '#120c08', 'planks', -0.5, 0, 0));
    for (let i = 0; i < 6; i++) g.add(blk(16 + r() * 8, 2, 4, '#6a4a28', 'planks', -10 - r() * 14, 1, -gap + r() * gap * 2, [0, r() * 3, 0]));
  } else { // wrota z desek z okuciami
    g.add(blk(3, 42, gap * 2 - 2, state === 'hit' ? '#5a3a1c' : '#74502a', 'planks', -1, 0, 0));
    for (const y of [8, 22, 34]) g.add(blk(3.6, 2.4, gap * 2 - 2, '#7a7e86', 'gold', -1.2, y, 0));
    if (state === 'hit') g.add(blk(4, 14, 3, '#1a1210', 'planks', -1.6, 12, 3, [0.3, 0, 0]));
    g.add(blk(18, 2, gap * 2 - 4, '#6e4a26', 'planks', -10, 0, 0)); // most zwodzony
  }
}
// Odcinek muru: pochyłe lico (skarpa), chodnik z blankami od strony atakujących, przedpiersie od strony miasta (albo palisada z bali)
function siegeWall(g, S, r, state) {
  const L = SIEGE_LZ / 2, hit = state === 'hit';
  if (S.mat === 'wood') {
    const n = Math.round(SIEGE_LZ / 8.6);
    for (let i = 0; i < n; i++) { const z = -L + 4.3 + i * 8.6; if (hit && (i === 2 || i === 5)) { const b = cyl3(4.3, 4.3, 18, DK(S.col, 0.2), 'planks', 6, 0, z, 8); b.rotation.z = 0.5; g.add(b); continue; }
      const h = 58 + (i % 3) * 3; g.add(cyl3(4.3, 4.3, h, i % 2 ? S.col : DK(S.col, 0.1), 'planks', 6, 0, z, 8)); g.add(cyl3(4.3, 0.3, 9, LT(S.col, 0.12), 'planks', 6, h, z, 8)); }
    for (const y of [14, 42]) g.add(blk(2, 3, SIEGE_LZ, '#3a2a18', 'planks', 11, y, 0)); // wiązania
    for (const z of [-L + 8, 0, L - 8]) for (const x of [22, 42]) g.add(cyl3(2.6, 2.6, 42, DK(S.col, 0.2), 'planks', x, 0, z, 8));
    g.add(blk(34, 3, SIEGE_LZ, LT(S.col, 0.08), 'planks', 30, 42, 0)); g.add(blk(3, 8, SIEGE_LZ, S.col, 'planks', 47, 45, 0));
    return;
  }
  g.add(blk(44, 50, SIEGE_LZ, S.col, S.kind, 34, 0, 0));
  g.add(blk(18, 58, SIEGE_LZ, S.col, S.kind, 8, -4, 0, [0, 0, -0.34])); // skarpa lica
  g.add(blk(50, 3, SIEGE_LZ, DK(S.col, 0.12), S.kind, 32, 50, 0));
  g.add(blk(4, 7, SIEGE_LZ, S.col, S.kind, 55, 53, 0));
  const n = 4; for (let i = 0; i < n; i++) { if (hit && (i === 1 || i === 3)) { g.add(blk(9, 3, 9, DK(S.col, 0.3), S.kind, 14, 53, -L + 7.5 + i * (SIEGE_LZ - 15) / (n - 1), [0.3, 0.4, 0])); continue; } g.add(blk(10, 11, 10, S.col, S.kind, 13, 53, -L + 7.5 + i * (SIEGE_LZ - 15) / (n - 1))); }
  g.add(blk(2, 10, 3, '#120c08', 'planks', 6.6, 24, -8)); g.add(blk(2, 10, 3, '#120c08', 'planks', 6.6, 24, 9)); // strzelnice w licu
  if (hit) { for (let i = 0; i < 6; i++) { const s = 4 + r() * 5; g.add(blk(s, s * 0.7, s, DK(S.col, 0.25), S.kind, -12 + r() * 10, 0, -L + r() * 2 * L, [r(), r() * 3, r()])); } // odłamki pod murem
    g.add(blk(1.5, 14, 2, '#201a1a', 'planks', 5.6, 12, 3, [0, 0, -0.26])); g.add(blk(1.5, 10, 2, '#201a1a', 'planks', 6.4, 20, -6, [0.4, 0, -0.26])); } // pęknięcia
}
// Ozdoby frakcji
function siegeDeco(g, S, kind, state, r, col) {
  const L = SIEGE_LZ / 2, wood = S.mat === 'wood';
  if (state === 'down' && kind !== 'gate') return;
  if (S.deco === 'banner' && kind === 'wall') { g.add(blk(1.2, 28, 13, col, 'cloth', 2.2, 18, 0, [0, 0, -0.34])); g.add(blk(1.6, 2, 14, '#e0b040', 'gold', 1.8, 46, 0, [0, 0, -0.34])); }
  if (S.deco === 'vines') for (let i = 0; i < 18; i++) g.add(sph((2 + r() * 2.5) / PXU, r() < 0.5 ? '#4a8a34' : '#3a6a2a', 'leaves', P(2 + r() * 6, 8 + r() * 54, -L + r() * 2 * L), null, 8));
  if (S.deco === 'reeds') { g.add(blk(10, 2, SIEGE_LZ, '#4a3a20', 'dirt', -6, 0, 0)); for (let i = 0; i < 14; i++) { const z = -L + r() * 2 * L, x = -10 + r() * 7; g.add(cyl3(0.6, 0.4, 12 + r() * 10, i % 2 ? '#6a7a3a' : '#8a8a4a', 'leaves', x, 0, z, 5)); } }
  if (S.deco === 'skulls' && kind === 'wall') for (const z of [-L + 7.5, L - 7.5]) g.add(sph(3.6 / PXU, '#ddd6c2', 'bone', P(13, 67, z), null, 10));
  if (S.deco === 'skulls') for (const z of [-8, 9]) g.add(emis(1, 9, 2.6, '#7af0a0', 6.2, 24, z));
  if (S.deco === 'skullsWood') for (const z of [-L + 9, 6]) g.add(sph(3.4 / PXU, '#e8e0cc', 'bone', P(4, wood ? 70 : 64, z), null, 10));
  if (S.deco === 'skullsWood' && kind === 'wall') g.add(blk(1.2, 24, 9, '#a8281e', 'cloth', 46, 50, 0));
  if (S.deco === 'lava') { for (let i = 0; i < 4; i++) g.add(emis(1.4, 6 + r() * 10, 1.4, '#ff7a1a', 4 + r() * 3, 4 + r() * 22, -L + r() * 2 * L, [0, 0, -0.26])); if (kind === 'wall') for (let i = 0; i < 4; i++) g.add(cyl3(2.4, 0.2, 8, '#2a1614', 'rock', 13, 64, -L + 7.5 + i * (SIEGE_LZ - 15) / 3, 6)); }
  if (S.deco === 'snow') { if (kind === 'wall') { for (let i = 0; i < 4; i++) g.add(blk(11, 2.4, 11, '#f4f8ff', 'plaster', 13, 64, -L + 7.5 + i * (SIEGE_LZ - 15) / 3)); g.add(blk(30, 1.6, SIEGE_LZ * 0.8, '#eef4ff', 'plaster', 32, 53, 0)); }
    if (kind === 'tower') g.add(emis(5, 13, 5, '#8ad0ff', 37, 112, -14, [0.2, 0.6, 0])); }
  if (S.deco === 'crystals') for (let i = 0; i < 4; i++) { const z = -L + 4 + r() * (2 * L - 8), x = -8 + r() * 5, h = 8 + r() * 10; const c = cyl3(2.8, 0.2, h, '#9a5ad0', 'win', x, 0, z, 5); c.rotation.z = (r() - 0.5) * 0.6; g.add(c); }
}
// Wieża główna (keep) na dziedzińcu: (0, 0, 0) = środek heksu na ziemi. Kamienna: gruba baszta z cokołem, gankiem z blankami,
// wieżyczką i wysokim dachem frakcji; z bali: wielki dwupiętrowy blokhauz z czterospadowym dachem. Strzelcy na ganku (fx:keep).
function siegeKeep(g, S, r, state, col) {
  if (state === 'down') { // gruzy po wieży: kopiec kamieni albo bali i ocalały kikut ściany
    if (S.mat === 'wood') { for (let i = 0; i < 26; i++) { const lg = cyl3(4.5, 4.5, 26 + r() * 20, i % 3 ? S.col : DK(S.col, 0.25), 'planks', 0, 0, 0, 8); lg.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.7, r() * Math.PI, 0); lg.position.set(...P(-34 + r() * 68, 4 + r() * 10, -34 + r() * 68)); g.add(lg); } return; }
    g.add(cyl3(46, 50, 10, DK(S.col, 0.2), S.kind, 0, 0, 0)); g.add(cyl3(42, 44, 34, S.col, S.kind, 4, 0, -6, 24));
    for (let i = 0; i < 40; i++) { const sz = 7 + r() * 12, a = r() * Math.PI * 2, d = 20 + r() * 40; g.add(blk(sz, sz * 0.7, sz, i % 4 ? S.col : DK(S.col, 0.3), S.kind, Math.cos(a) * d, 4 + r() * 18, Math.sin(a) * d, [r(), r() * 3, r()])); }
    return;
  }
  const H = 100;
  if (S.mat === 'wood') {
    g.add(blk(76, 70, 76, S.col, 'planks', 0, 0, 0)); g.add(blk(88, 6, 88, DK(S.col, 0.2), 'planks', 0, 70, 0));
    g.add(blk(84, 54, 84, LT(S.col, 0.05), 'planks', 0, 76, 0));
    for (const [dx, dz] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) g.add(cyl3(5, 5, 130, DK(S.col, 0.15), 'planks', dx, 0, dz, 8));
    for (let i = 0; i < 4; i++) g.add(blk(3, 10, 8, '#120c08', 'planks', -42.5, 92, -24 + i * 16)); // strzelnice
    g.add(blk(3, 30, 22, '#3a2410', 'planks', -38.5, 0, 0)); // drzwi
    const roof = coneRoof(68, 62, S.roof, S.roofKind || 'thatch', 0, 130, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof);
    g.add(blk(1.2, 26, 16, col, 'cloth', -6, 196, 0)); g.add(cyl3(1.2, 1.2, 40, '#3a2410', 'planks', 0, 186, 0, 6));
    marker(g, 'fx:keep', P(-20, 130, 10));
    return;
  }
  g.add(cyl3(56, 60, 14, DK(S.col, 0.15), S.kind, 0, 0, 0, 28)); // cokół
  g.add(cyl3(50, 48, H, S.col, S.kind, 0, 0, 0, 28)); g.add(cyl3(49.5, 49.5, 5, DK(S.col, 0.12), S.kind, 0, H * 0.45, 0, 28));
  g.add(cyl3(55, 55, 8, DK(S.col, 0.18), S.kind, 0, H, 0, 28)); g.add(ringMerlons(53, H + 8, S.col, S.kind, 0, 0, 20)); // ganek z blankami
  for (const [a, y] of [[2.7, 0.35], [3.3, 0.66], [2.9, 0.82], [3.6, 0.5]]) g.add(blk(3, 12, 4, '#120c08', 'planks', Math.cos(a) * 49, H * y, Math.sin(a) * 49)); // okna-strzelnice
  g.add(blk(3, 34, 22, '#2a1a10', 'planks', -50, 14, 0)); g.add(blk(4, 4, 26, DK(S.col, 0.3), S.kind, -50.5, 48, 0)); // brama baszty
  g.add(cyl3(26, 26, 34, S.col, S.kind, 10, H + 8, -8, 20)); g.add(ringMerlons(25, H + 42, S.col, S.kind, 10, -8, 12)); // wieżyczka
  siegeRoof(g, S, 28, 10, H + 50, -8);
  if (S.deco === 'lava') for (let i = 0; i < 5; i++) g.add(emis(1.6, 10 + r() * 16, 1.6, '#ff7a1a', Math.cos(2.6 + i * 0.3) * 50.5, 10 + r() * 80, Math.sin(2.6 + i * 0.3) * 50.5));
  if (S.deco === 'crystals') for (let i = 0; i < 5; i++) { const a = 2.4 + r() * 1.5, c = cyl3(4, 0.3, 14 + r() * 12, '#9a5ad0', 'win', Math.cos(a) * 58, 0, Math.sin(a) * 58, 5); c.rotation.z = (r() - 0.5) * 0.5; g.add(c); }
  if (S.deco === 'skulls') for (let i = 0; i < 3; i++) g.add(emis(1, 10, 3, '#7af0a0', -49.4, 40 + i * 26, -10 + i * 10));
  if (S.deco === 'snow') g.add(cyl3(56, 56, 2, '#f4f8ff', 'plaster', 0, H + 8.5, 0, 28));
  if (S.deco === 'banner' || S.deco === 'snow') { g.add(blk(1.4, 40, 18, col, 'cloth', -50.5, 70, 18)); g.add(blk(1.4, 40, 18, col, 'cloth', -50.5, 70, -18)); }
  marker(g, 'fx:keep', P(-30, H + 10, 12));
}
// Fragment muru frakcji: kind 'wall' | 'gate' | 'tower', state 'ok' | 'hit' | 'down'; col = barwa właściciela (chorągwie)
function buildSiegePiece(fac, kind, state, col = '#2a4a8a') {
  const S = SIEGE3[fac] || SIEGE3.haven, g = new THREE.Group(), r = rnd((kind.length * 977 + state.length * 131 + fac.length * 17) | 0);
  if (kind === 'keep') { siegeKeep(g, S, r, state, col); return g; }
  if (state === 'down' && kind !== 'gate') rubble(g, S, r);
  else if (kind === 'tower') { siegeWall(g, S, r, 'ok'); siegeTower(g, S, r); }
  else if (kind === 'gate') siegeGate(g, S, r, state);
  else siegeWall(g, S, r, state);
  siegeDeco(g, S, kind, state, r, col);
  return g;
}
