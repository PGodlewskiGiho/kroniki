// ==================== MODELE 3D OBIEKTÓW MAPY PRZYGODY (narzędzie, nie trafia do gry) ======================
// Jednostka świata = jedno pole mapy; (0, 0, 0) = środek pola na ziemi, +x w prawo, +z w dół ekranu (do kamery), +y w górę.
// Kamera mapy: z przodu, z góry pod kątem MAP_PITCH; głębia (z) rozciągnięta 1/sin(kąta), żeby podstawa obiektu pokrywała
// pola mapy (rzut z góry), a bryły stały pionowo jak w Heroes 3. Cień rzucany na niewidoczną ziemię (ShadowMaterial).
// MAP3[klucz]() -> THREE.Group; mapJobs() = lista kluczy do wypalenia (tools/grafika3d/wypal-mape.js).
/* global THREE, G3, mat, mesh, sph, cap, cyl, cone, box, rbox, torus, lathe, tube, sheet, slab, chunk, leafClump, DK, LT, rng, ART3 */
const MAP_PITCH = 0.62, MAP_K = 64; // px arkusza na pole (4 px na piksel grafiki gry)
const mpGrp = (...ms) => { const g = new THREE.Group(); for (const m of ms) if (m) g.add(m); return g; };
const mpAt = (o, x, y, z, s = 1, ry = 0) => { o.position.set(x, y, z); o.scale.multiplyScalar(s); o.rotation.y = ry; return o; };
// --- drzewa (wysokość ok. 1 pola) ---
const MP_LEAF = { spring: ['#4a8a2c', '#5a9a34'], summer: ['#2e6a22', '#3a7a2a', '#4a7a1e'], autumn: ['#c8501e', '#d8841e', '#a8381a', '#c8a030'], swamp: ['#3a5a2a', '#46663a'] };
function mpBranches(g, R, h, col, n = 5, snow = false) {
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + R() * 0.6, y0 = h * (0.45 + R() * 0.25), L = 0.22 + R() * 0.18, e = [Math.cos(a) * L, y0 + L * 0.9, Math.sin(a) * L];
    g.add(tube([[0, y0, 0], [e[0] * 0.5, y0 + L * 0.5, e[2] * 0.5], e], 0.025, 0.008, col, 'bark')); if (snow) g.add(sph(0.016, '#f4f8fc', 'cloth', [e[0], e[1] + 0.006, e[2]], [1.6, 0.5, 1.6], 8)); }
}
function mpOak(R, season, s = 1) {
  const g = new THREE.Group(), h = 0.5 + R() * 0.12; g.add(tube([[0, 0, 0], [0.02, h * 0.5, 0], [-0.02, h, 0]], 0.07, 0.045, '#5a3a22', 'bark'));
  for (const [dx, a] of [[-0.06, -0.6], [0.06, 0.6]]) g.add(tube([[dx * 0.5, 0.02, 0], [dx * 2, 0, 0.03]], 0.04, 0.015, '#4a3020', 'bark'));
  if (season === 3) { mpBranches(g, R, h, '#4a3422', 7, true); g.add(tube([[0, h, 0], [0.03, h + 0.25, 0]], 0.04, 0.01, '#4a3422', 'bark')); return mpAt(g, 0, 0, 0, s); }
  const pal = season === 2 ? MP_LEAF.autumn : season === 0 ? MP_LEAF.spring : MP_LEAF.summer, col = pal[(R() * pal.length) | 0];
  mpBranches(g, R, h, '#4a3422', 4);
  const cl = [[0, h + 0.28, 0, 0.3], [-0.2, h + 0.12, 0.05, 0.24], [0.2, h + 0.14, -0.02, 0.24], [0.02, h + 0.06, 0.18, 0.22], [-0.05, h + 0.2, -0.16, 0.22]];
  cl.forEach(([x, y, z, r], i) => g.add(leafClump(r * (0.9 + R() * 0.2), col, [x, y, z], i + ((R() * 6) | 0), season === 0 && R() < 0.5 ? '#f8d0e0' : null)));
  return mpAt(g, 0, 0, 0, s);
}
function mpPine(R, snowy, s = 1) {
  const g = new THREE.Group(), tiers = 3 + (R() < 0.4 ? 1 : 0), H = 1.0 + R() * 0.15; g.add(cyl(0.05, 0.035, 0.3, '#5a3a22', 'bark', [0, 0.15, 0]));
  for (let i = 0; i < tiers; i++) { const t = i / tiers, y = 0.16 + t * (H - 0.45), r = 0.3 * (1 - t * 0.62), hh = 0.5 * (1 - t * 0.25);
    const c = lathe([[0.001, hh], [r * 0.35, hh * 0.6], [r * 0.85, hh * 0.12], [r, 0], [r * 0.7, -0.02], [0.001, 0.02]], i % 2 ? '#2e6a3a' : '#357442', 'feather', [0, y, 0], null, 2, [9, 0.12, hh, 0]); c.rotation.y = R() * 6; g.add(c);
    if (snowy) g.add(lathe([[0.001, hh + 0.005], [r * 0.32, hh * 0.62], [r * 0.7, hh * 0.25], [r * 0.5, hh * 0.22], [0.001, hh * 0.5]], '#f2f6fa', 'cloth', [0, y + 0.012, 0], null, 1, [9, 0.18, hh, 0])); }
  return mpAt(g, 0, 0, 0, s);
}
function mpPalm(R, s = 1) {
  const g = new THREE.Group(), lean = (R() - 0.5) * 0.3, top = [0.18 + lean, 1.05, 0.02], pts = [[0, 0, 0], [0.05 + lean * 0.3, 0.35, 0], [0.12 + lean * 0.7, 0.7, 0.01], top];
  g.add(tube(pts, 0.06, 0.04, '#8a6a40', 'bark')); for (let i = 1; i < 8; i++) { const t = i / 8, p = new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(...q))).getPointAt(t); g.add(torus(0.055 - t * 0.015, 0.012, '#6a4a2a', 'bark', [p.x, p.y, p.z], [Math.PI / 2, 0, 0])); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + R() * 0.4, L = 0.48 + R() * 0.1, e = [top[0] + Math.cos(a) * L, top[1] - 0.18 - R() * 0.1, top[2] + Math.sin(a) * L], m = [top[0] + Math.cos(a) * L * 0.5, top[1] + 0.06, top[2] + Math.sin(a) * L * 0.5];
    const lf = slab([[0, 0], [0.08, 0.05], [L * 0.6, 0.06], [L, 0], [L * 0.6, -0.05], [0.08, -0.04]], 0.01, i % 2 ? '#3a8a34' : '#2e7428', 'feather'); lf.position.set(...top); lf.lookAt(e[0], e[1], e[2]); lf.rotateY(-Math.PI / 2); lf.rotateZ(-0.35); g.add(lf); void m; }
  for (let i = 0; i < 3; i++) g.add(sph(0.04, '#5a3a1a', 'wood', [top[0] + Math.cos(i * 2) * 0.05, top[1] - 0.05, top[2] + Math.sin(i * 2) * 0.05]));
  return mpAt(g, 0, 0, 0, s);
}
function mpDead(R, col = '#3a3020', s = 1) {
  const g = new THREE.Group(), h = 0.8 + R() * 0.2; g.add(tube([[0, 0, 0], [0.03, h * 0.5, 0.01], [-0.02, h, 0]], 0.07, 0.025, col, 'bark'));
  for (let i = 0; i < 5; i++) { const a = R() * 6.28, y0 = h * (0.4 + R() * 0.45), L = 0.2 + R() * 0.2; g.add(tube([[0, y0, 0], [Math.cos(a) * L * 0.6, y0 + L * 0.3, Math.sin(a) * L * 0.6], [Math.cos(a) * L, y0 + L * 0.2 + (R() - 0.5) * 0.2, Math.sin(a) * L]], 0.025, 0.006, col, 'bark')); }
  return mpAt(g, 0, 0, 0, s);
}
function mpWillow(R, s = 1) {
  const g = new THREE.Group(), h = 0.45; g.add(tube([[0, 0, 0], [0.04, h * 0.6, 0], [0, h, 0]], 0.08, 0.05, '#4a3a24', 'bark'));
  for (const [x, y, z, r] of [[0, h + 0.2, 0, 0.3], [-0.22, h + 0.08, 0.04, 0.24], [0.22, h + 0.08, -0.03, 0.24]]) g.add(leafClump(r, '#46663a', [x, y, z], (R() * 6) | 0));
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = 0.28 + R() * 0.08; g.add(tube([[Math.cos(a) * r * 0.7, h + 0.15, Math.sin(a) * r * 0.7], [Math.cos(a) * r, h - 0.05, Math.sin(a) * r], [Math.cos(a) * r * 1.05, h - 0.3 - R() * 0.15, Math.sin(a) * r * 1.05]], 0.012, 0.005, i % 2 ? '#5a7a40' : '#3a5a2c', 'feather')); }
  return mpAt(g, 0, 0, 0, s);
}
function mpCharred(R, s = 1) {
  const g = new THREE.Group(), h = 0.85 + R() * 0.15; g.add(cone(0.13, 0.05, '#2e2624', 'stone', [0, 0.02, 0], null, 10)); g.add(tube([[0, 0, 0], [0.02, h * 0.5, 0], [-0.03, h, 0]], 0.07, 0.025, '#3a302c', 'bark'));
  g.add(tube([[0.01, 0.08, 0.06], [0.03, 0.3, 0.065], [-0.01, 0.5, 0.06]], 0.012, 0.01, '#ff7a2a', 'glow'));
  for (let i = 0; i < 4; i++) { const a = R() * 6.28, y0 = h * (0.45 + R() * 0.4), L = 0.18 + R() * 0.15, e = [Math.cos(a) * L, y0 + L * 0.6, Math.sin(a) * L]; g.add(tube([[0, y0, 0], e], 0.025, 0.01, '#3a302c', 'bark')); g.add(sph(0.018, '#ffb040', 'glow', e, null, 8)); }
  return mpAt(g, 0, 0, 0, s);
}
// Pole z drzewami: 2–3 drzewa w tych samych miejscach co dawny rysunek (lekko losowo)
function mpTreeTile(kind, season, v) {
  const R = rng(v * 7919 + kind.length * 31 + season * 7), g = new THREE.Group(), spots = [[(R() - 0.5) * 0.25, -0.1], [-0.27 + (R() - 0.5) * 0.12, 0.26], [0.27 + (R() - 0.5) * 0.12, 0.3]], cnt = R() < 0.3 ? 2 : 3;
  for (let k = 0; k < cnt; k++) { const s = 0.8 + R() * 0.3; let t;
    if (kind === 'pine') t = mpPine(R, season === 3, s); else if (kind === 'snow') t = mpPine(R, true, s); else if (kind === 'palm') t = mpPalm(R, s); else if (kind === 'lava') t = mpCharred(R, s);
    else if (kind === 'swamp') t = R() < 0.5 ? mpDead(R, '#2e2618', s) : mpWillow(R, s); else if (kind === 'dirt') t = R() < 0.5 ? mpPine(R, season === 3, s) : mpOak(R, season, s); else t = mpOak(R, season, s);
    t.position.x = spots[k][0]; t.position.z = spots[k][1]; t.rotation.y = R() * 6.28; g.add(t); }
  return g;
}
// --- góry i skały: bryły z losowych punktów, barwa zależna od wysokości i nachylenia (śnieg na szczytach i płaskich ściankach) ---
const MP_ROCK = { cave: ['#34303c', '#4c4656', '#201c26'], def: ['#8a8070', '#b0a48c', '#6a6458'], snow: ['#8a94a4', '#c0c8d4', '#f4f8fc'], lava: ['#3a2e2a', '#5a4a42', '#2a201c'], sand: ['#b08454', '#d8b07a', '#8a6038'] };
function mpPeakGeo(rx, ry, rz, seed, n) { // stożkowaty szczyt: pierścienie punktów zwężające się ku przesuniętemu wierzchołkowi, z poszarpaną granią
  const R = rng(seed * 7919), pts = [], ax = (R() - 0.5) * rx * 0.5, rings = [[0, 1], [0.3, 0.78], [0.58, 0.48], [0.82, 0.2]];
  for (const [t, q] of rings) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + R() * 0.5, j = 0.8 + R() * 0.35; pts.push(new THREE.Vector3(ax * t + Math.cos(a) * rx * q * j, ry * t + (R() - 0.5) * ry * 0.06, Math.sin(a) * rz * q * j)); }
  pts.push(new THREE.Vector3(ax, ry, 0)); return new THREE.ConvexGeometry(pts);
}
function mpRockMesh(rx, ry, rz, pal, seed, n, snowLine, lava, peak = false) {
  const m = chunk(rx, ry, rz, '#ffffff', 'stone', [0, 0, 0], null, seed, n); if (peak) { m.geometry.dispose(); m.geometry = mpPeakGeo(rx, ry, rz, seed, 9); const pp = m.geometry.attributes.position, uv = new Float32Array(pp.count * 2); for (let i = 0; i < pp.count; i++) { uv[i * 2] = pp.getX(i) + pp.getZ(i); uv[i * 2 + 1] = pp.getY(i); } m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  const geo = m.geometry.toNonIndexed(), p = geo.attributes.position, cols = new Float32Array(p.count * 3); geo.computeVertexNormals(); const nr = geo.attributes.normal;
  const [c0, c1, c2] = pal.map(c => new THREE.Color(c)), snow = new THREE.Color('#f4f8fc'), lavaC = new THREE.Color('#ff6a1a');
  for (let i = 0; i < p.count; i += 3) { const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3 / ry, ny = nr.getY(i), nx = nr.getX(i), c = (nx < -0.2 ? c1 : nx > 0.35 ? c2 : c0).clone().lerp(c1, Math.max(0, ny) * 0.4);
    if (snowLine != null && y > snowLine && ny > -0.1) c.copy(snow); else if (snowLine != null && y > snowLine - 0.15 && ny > 0.3) c.lerp(snow, 0.6);
    if (lava && Math.abs(nx) < 0.08 && y < 0.6) c.copy(lavaC); for (let j = 0; j < 3; j++) cols.set([c.r, c.g, c.b], (i + j) * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); const mt = m.material.clone(); mt.vertexColors = true; mt.flatShading = true; m.geometry.dispose(); m.geometry = geo; m.material = mt;
  if (lava) { mt.emissive = new THREE.Color('#ff4a0a'); mt.emissiveIntensity = 0; }
  return m;
}
function mpMountain(palKey, v) {
  const R = rng(v * 131 + palKey.length * 17), g = new THREE.Group(), pal = MP_ROCK[palKey], big = R() < 0.35, snowLine = palKey === 'snow' ? 0.35 : palKey === 'def' ? (big ? 0.62 : null) : null;
  const main = mpRockMesh(0.62 + R() * 0.2, (big ? 1.55 : 1.05) + R() * 0.3, 0.5, pal, v * 3 + 1, 18, snowLine, palKey === 'lava', true); main.position.set((R() - 0.5) * 0.2, 0, 0); g.add(main);
  if (R() < 0.7) { const side = R() < 0.5 ? -1 : 1, m2 = mpRockMesh(0.42, 0.62 + R() * 0.3, 0.4, pal, v * 3 + 2, 14, snowLine != null ? snowLine - 0.1 : null, palKey === 'lava', true); m2.position.set(side * (0.45 + R() * 0.15), 0, 0.12); g.add(m2); }
  for (let i = 0; i < 1 + ((R() * 3) | 0); i++) { const b = mpRockMesh(0.12 + R() * 0.08, 0.1 + R() * 0.06, 0.1, pal, v * 7 + i, 10, null, false); b.position.set((R() - 0.5) * 1.2, 0, 0.3 + R() * 0.2); g.add(b); }
  return g;
}
function mpRock(palKey, v) {
  const R = rng(v * 977 + palKey.length), g = new THREE.Group(), pal = MP_ROCK[palKey]; g.add(mpRockMesh(0.3 + R() * 0.08, 0.28 + R() * 0.08, 0.26, pal, v * 5 + 3, 14, palKey === 'snow' ? 0.3 : null, false));
  if (R() < 0.6) { const b = mpRockMesh(0.12, 0.1, 0.1, pal, v * 5 + 4, 10, null, false); b.position.set(0.32, 0, 0.12); g.add(b); }
  if (palKey === 'def' && R() < 0.7) g.add(sph(0.08, '#5a7a34', 'cloth', [-0.08, 0.28, 0.05], [1.4, 0.4, 1.2], 10)); // mech na szczycie
  g.position.x = (R() - 0.5) * 0.25; g.position.z = 0.15; return mpGrp(g);
}
// --- surowce, skrzynia, artefakt na ziemi ---
function mpRes(r) {
  const g = new THREE.Group(), R = rng(r.length * 13);
  if (r === 'wood') { for (const [x, y, z] of [[-0.1, 0.06, 0], [0.1, 0.06, 0], [0, 0.17, 0], [-0.05, 0.06, 0.12], [0.15, 0.06, 0.12]]) { g.add(cyl(0.06, 0.06, 0.5, '#7a5230', 'bark', [x, y, z], [0, 0.3, Math.PI / 2])); g.add(cyl(0.058, 0.058, 0.01, '#d8b080', 'wood', [x + 0.25 * Math.cos(0.3), y, z - 0.25 * Math.sin(0.3)], [0, 0.3, Math.PI / 2])); } }
  else if (r === 'ore') { for (let i = 0; i < 7; i++) { const c = chunk(0.1 + R() * 0.04, 0.08, 0.09, i % 3 ? '#6a6a70' : '#8a5a4a', 'stone', [(R() - 0.5) * 0.35, 0.06 + (i > 4 ? 0.08 : 0), (R() - 0.5) * 0.25], null, i + 2, 10); g.add(c); } g.add(sph(0.03, '#c8c8d0', 'steel', [0.05, 0.2, 0.05])); }
  else if (r === 'mercury') { g.add(lathe([[0.001, 0], [0.14, 0.01], [0.17, 0.12], [0.12, 0.25], [0.05, 0.3], [0.05, 0.38], [0.07, 0.4]], '#a8c0d0', 'gem')); g.children[0].material = g.children[0].material.clone(); Object.assign(g.children[0].material, { transparent: true, opacity: 0.5 });
    g.add(sph(0.14, '#d8dce8', 'steel', [0, 0.11, 0], [1, 0.7, 1])); g.add(cyl(0.05, 0.05, 0.06, '#7a5230', 'wood', [0, 0.42, 0])); for (const x of [-0.25, 0.22]) g.add(sph(0.04, '#d8dce8', 'steel', [x, 0.03, 0.1], [1, 0.5, 1])); }
  else if (r === 'sulfur') { g.add(cone(0.26, 0.22, '#e0c83a', 'stone', [0, 0.11, 0], null, 12)); for (let i = 0; i < 5; i++) g.add(chunk(0.06, 0.05, 0.06, '#f0d84a', 'stone', [(R() - 0.5) * 0.45, 0.04, (R() - 0.3) * 0.3], null, i + 9, 9)); g.add(cyl(0.3, 0.32, 0.03, '#7a6a2a', 'stone', [0, 0.01, 0])); }
  else if (r === 'crystal') { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, q = i ? 1 : 0, h = i ? 0.22 + R() * 0.1 : 0.42; const c = cone(i ? 0.05 : 0.08, h, '#e04040', 'gem', [Math.cos(a) * 0.12 * q, h / 2, Math.sin(a) * 0.1 * q], [Math.sin(a) * 0.35 * q, 0, -Math.cos(a) * 0.35 * q], 6); g.add(c); } g.add(chunk(0.18, 0.05, 0.15, '#5a4a4a', 'stone', [0, 0.02, 0], null, 3, 10)); }
  else if (r === 'gems') { const cols = ['#40c070', '#3a80e0', '#c060e0', '#e03a3a', '#f0f0f0', '#f0c040']; for (let i = 0; i < 9; i++) g.add(mesh(new THREE.OctahedronGeometry(0.06, 0), cols[i % 6], 'gem', [(R() - 0.5) * 0.35, 0.05 + (i > 6 ? 0.07 : 0), (R() - 0.5) * 0.25], [R(), R(), R()], [1, 1.2, 1])); }
  else if (r === 'gold') { for (let i = 0; i < 18; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * 0.22, y = 0.02 + Math.max(0, 0.18 - d) * 0.9 * R(); g.add(cyl(0.05, 0.05, 0.015, '#f0c040', 'gold', [Math.cos(a) * d, y, Math.sin(a) * d * 0.8], [R() * 0.6, 0, R() * 0.6], null, 14)); }
    g.add(cone(0.2, 0.14, '#e0b030', 'gold', [0, 0.07, 0], null, 14)); }
  return g;
}
function mpChest() {
  const g = new THREE.Group(); g.add(rbox(0.5, 0.26, 0.32, 0.02, '#7a4a26', 'wood', [0, 0.13, 0])); g.add(cyl(0.16, 0.16, 0.5, '#7a4a26', 'wood', [0, 0.26, 0], [0, 0, Math.PI / 2], [1, 0.6, 1], 16));
  for (const x of [-0.2, 0, 0.2]) { g.add(box(0.035, 0.27, 0.335, '#c8a040', 'gold', [x, 0.13, 0])); g.add(torus(0.162, 0.015, '#c8a040', 'gold', [x, 0.26, 0], [0, Math.PI / 2, 0], [1, 0.6, 1], Math.PI)); }
  g.add(rbox(0.08, 0.09, 0.03, 0.01, '#c8a040', 'gold', [0, 0.24, 0.17])); for (let i = 0; i < 4; i++) g.add(cyl(0.045, 0.045, 0.012, '#f0c040', 'gold', [-0.32 + i * 0.05, 0.01, 0.2 + (i % 2) * 0.05], null, null, 12));
  return g;
}
// Artefakt leżący na ziemi: bryła z artefakty.js zmniejszona do ok. 0,6 pola, oparta o ziemię
function mpArt(id, A) {
  const inner = ART3[id](A), b = new THREE.Box3().setFromObject(inner), sz = b.getSize(new THREE.Vector3()), k = 0.62 / Math.max(sz.x, sz.y), c = b.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -b.min.y, -c.z); const g = mpGrp(inner); g.scale.setScalar(k); return mpGrp(g);
}
// --- katalog ---
const MAP3 = {};
const MP_TREES = ['oak', 'dirt', 'pine', 'snow', 'palm', 'lava', 'swamp'], MP_SEASONAL = { oak: 1, dirt: 1, pine: 1, swamp: 0 };
for (const k of MP_TREES) for (let s = 0; s < 4; s++) { if (!MP_SEASONAL[k] && s) continue; for (let v = 0; v < 4; v++) MAP3[`tree_${k}_${s}_${v}`] = () => mpTreeTile(k, s, v); }
for (const p of Object.keys(MP_ROCK)) for (let v = 0; v < 8; v++) { MAP3[`mount_${p}_${v}`] = () => mpMountain(p, v); MAP3[`rock_${p}_${v}`] = () => mpRock(p, v); }
for (const r of ['wood', 'ore', 'mercury', 'sulfur', 'crystal', 'gems', 'gold']) MAP3[`res_${r}`] = () => mpRes(r);
MAP3.chest = () => mpChest();
// --- drobne ozdoby terenu (ok. 0,3 pola): kępki trawy, kwiaty, kamyki, krzaczek, kaktus, kość, zaspa, trzcina, grzyby, żar ---
function mpTuft(cols, n = 7, h = 0.16, seed = 1) { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < n; i++) { const a = R() * 6.28, r = R() * 0.05, l = h * (0.6 + R() * 0.5);
  g.add(tube([[Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * (r + 0.02), l * 0.6, Math.sin(a) * (r + 0.02)], [Math.cos(a) * (r + 0.05), l, Math.sin(a) * (r + 0.05)]], 0.012, 0.003, cols[i % cols.length], 'feather')); } return g; }
function mpPebbles(pal, seed = 1) { const g = new THREE.Group(), R = rng(seed); for (let i = 0; i < 3; i++) { const m = mpRockMesh(0.05 + R() * 0.03, 0.04 + R() * 0.02, 0.045, MP_ROCK[pal], seed * 5 + i, 9, pal === 'snow' ? 0.2 : null, false); m.position.set((R() - 0.5) * 0.25, 0, (R() - 0.5) * 0.12); g.add(m); } return g; }
function mpDecor(t, v) {
  const g = new THREE.Group();
  if (t === 'leaves') { const R = rng(v + 3); for (let i = 0; i < 6; i++) g.add(mesh(new THREE.CircleGeometry(0.03, 5), ['#c8501e', '#e0a030', '#8a3a14', '#d87a2a'][i % 4], 'cloth', [(R() - 0.5) * 0.25, 0.004, (R() - 0.5) * 0.15], [-Math.PI / 2, 0, R() * 3], [1, 0.6, 1])); return g; }
  if (t === 'grass') { if (v === 0) g.add(mpTuft(['#4a8a30', '#78b848'], 8, 0.16, 1)); else if (v === 1) { g.add(mpTuft(['#4a8a30', '#78b848'], 6, 0.13, 2)); for (const [x, z, c] of [[-0.06, 0.02, '#e8d040'], [0.03, -0.03, '#f4f4f0'], [0.07, 0.03, '#d84a3a']]) { g.add(cyl(0.004, 0.004, 0.14, '#4a8a30', 'cloth', [x, 0.07, z])); g.add(sph(0.018, c, 'cloth', [x, 0.14, z], [1, 0.5, 1], 8)); } }
    else if (v === 2) g.add(mpPebbles('def', 3)); else { g.add(leafClump(0.09, '#3c7c2c', [0, 0.08, 0], 2)); g.add(sph(0.015, '#d84a3a', 'gem', [0.03, 0.09, 0.07], null, 8)); } }
  else if (t === 'dirt') { if (v === 0) g.add(mpTuft(['#9a8a40', '#ccb45a'], 7, 0.14, 4)); else if (v === 1) g.add(mpPebbles('def', 5)); else if (v === 2) { g.add(mpTuft(['#9a8a40', '#ccb45a'], 5, 0.12, 6)); const p = mpPebbles('def', 7); p.position.x = 0.1; g.add(p); } else g.add(tube([[-0.15, 0.01, 0.03], [0, 0.02, 0], [0.1, 0.015, 0.02], [0.17, 0.03, -0.02]], 0.012, 0.008, '#5a4028', 'bark')); }
  else if (t === 'sand') { if (v === 0) g.add(mpPebbles('sand', 9)); else if (v === 1) { g.add(cap(0.025, 0.16, '#4a8a3a', 'leather', [0, 0.11, 0])); g.add(cap(0.017, 0.06, '#4a8a3a', 'leather', [-0.045, 0.12, 0], [0, 0, 0.2])); g.add(cap(0.017, 0.04, '#4a8a3a', 'leather', [-0.06, 0.16, 0])); } else if (v === 2) g.add(mpTuft(['#9a8a40', '#ccb45a'], 6, 0.12, 8)); else { g.add(cyl(0.012, 0.012, 0.2, '#eee6d0', 'bone', [0, 0.012, 0], [0, 0.3, Math.PI / 2])); g.add(sph(0.022, '#eee6d0', 'bone', [0.1, 0.02, -0.03], null, 10)); } }
  else if (t === 'snow') { if (v === 0 || v === 3) g.add(mpPebbles('snow', 11 + v)); else if (v === 1) g.add(mpTuft(['#8a8a6a', '#aaa888'], 6, 0.12, 12)); else g.add(sph(0.14, '#f4f8fc', 'cloth', [0, 0, 0], [1.2, 0.35, 0.8], 14)); }
  else if (t === 'swamp') { if (v === 0) for (const dx of [-0.06, 0, 0.06]) { g.add(cyl(0.004, 0.004, 0.26, '#4a6a34', 'cloth', [dx, 0.13, 0], [0, 0, dx * 0.6])); g.add(cap(0.012, 0.05, '#6a4424', 'leather', [dx + dx * 0.08, 0.22, 0])); }
    else if (v === 1) for (const [x, c] of [[-0.05, '#c83a2a'], [0.05, '#b8a060']]) { g.add(cyl(0.01, 0.012, 0.06, '#e8e0cc', 'skin', [x, 0.03, 0])); g.add(sph(0.035, c, 'skin', [x, 0.06, 0], [1, 0.55, 1], 12)); } else if (v === 2) g.add(mpTuft(['#3a5a2c', '#5a7a40'], 8, 0.16, 14)); else g.add(mpPebbles('def', 15)); }
  else if (t === 'lava') { g.add(mpPebbles('lava', 16 + v)); if (v === 1) for (const x of [-0.06, 0.08]) g.add(sph(0.012, '#ffb040', 'glow', [x, 0.01, 0.04], null, 8)); if (v === 2) g.add(cone(0.02, 0.1, '#ff7a2a', 'glow', [0, 0.05, 0.06], null, 6)); }
  return g;
}
for (const t of ['grass', 'dirt', 'sand', 'snow', 'swamp', 'lava']) for (let v = 0; v < 4; v++) MAP3[`decor_${t}_${v}`] = () => mpDecor(t, v);
MAP3.decor_leaves_0 = () => mpDecor('leaves', 0); MAP3.decor_leaves_1 = () => mpDecor('leaves', 1);
// --- podziemia: niskie, poszarpane ściany jaskini (zlewają się z sąsiednimi), stalagmity, kryształy, świecące grzyby ---
const MP_GLOW = ['#8a6aff', '#40d8c0', '#ff6ab0', '#60b0ff'];
function mpCaveWall(v) {
  const R = rng(v * 313 + 7), g = new THREE.Group();
  for (let i = 0; i < 4 + (v % 3); i++) { const x = (R() - 0.5) * 0.9, z = (R() - 0.5) * 0.7, h = 0.2 + R() * 0.28, m = mpRockMesh(0.26 + R() * 0.16, h, 0.24 + R() * 0.12, MP_ROCK.cave, v * 11 + i, 12, null, false, false); /* niskie, obłe bloki skały */ m.position.set(x, 0, z); m.rotation.y = R() * 6; g.add(m); }
  for (let i = 0; i < 2 + (v % 2); i++) { const x = (R() - 0.5) * 0.8, z = 0.15 + R() * 0.3; g.add(cone(0.04 + R() * 0.03, 0.18 + R() * 0.2, '#5a5462', 'stone', [x, 0.09, z], [(R() - 0.5) * 0.2, 0, (R() - 0.5) * 0.2], 7)); }
  if (v % 3 === 0) { const c = MP_GLOW[v % 4]; for (let i = 0; i < 3; i++) { const k = cone(0.035, 0.18 + R() * 0.1, c, 'gem', [(R() - 0.5) * 0.5, 0.35 + R() * 0.15, 0.22 + R() * 0.1], [(R() - 0.5) * 0.8, 0, (R() - 0.5) * 0.8], 6); k.material = k.material.clone(); k.material.emissiveIntensity = 1.4; g.add(k); } }
  return g;
}
function mpStalag(v) {
  const R = rng(v * 97 + 3), g = new THREE.Group(), kind = v % 4;
  if (kind === 0 || kind === 2) for (let i = 0; i < 4; i++) { const h = 0.2 + R() * 0.35; g.add(cone(0.05 + h * 0.15, h, i % 2 ? '#6e6878' : '#5a5462', 'stone', [(R() - 0.5) * 0.35, h / 2, (R() - 0.5) * 0.2], null, 8)); }
  else if (kind === 1) { const c = MP_GLOW[(v >> 1) % 4]; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, q = i ? 1 : 0, h = i ? 0.15 + R() * 0.12 : 0.38; const k = cone(i ? 0.035 : 0.06, h, c, 'gem', [Math.cos(a) * 0.08 * q, h / 2, Math.sin(a) * 0.06 * q], [Math.sin(a) * 0.4 * q, 0, -Math.cos(a) * 0.4 * q], 6); k.material = k.material.clone(); k.material.emissiveIntensity = 1.3; g.add(k); }
    g.add(mpRockMesh(0.16, 0.06, 0.13, MP_ROCK.cave, v + 40, 10, null, false)); }
  else { const c = MP_GLOW[(v >> 1) % 4]; for (let i = 0; i < 3; i++) { const x = (R() - 0.5) * 0.3, z = (R() - 0.5) * 0.2, h = 0.15 + R() * 0.25, r = 0.07 + R() * 0.06; g.add(cyl(0.022, 0.03, h, '#d8d0c0', 'skin', [x, h / 2, z])); const cap = sph(r, c, 'gem', [x, h, z], [1, 0.45, 1], 14); cap.material = cap.material.clone(); cap.material.emissiveIntensity = 1.1; g.add(cap); } } // olbrzymie świecące grzyby
  return g;
}
function mpCaveDecor(v) {
  const R = rng(v * 59 + 5), g = new THREE.Group(), c = MP_GLOW[v % 4];
  if (v === 0 || v === 4) for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * 0.22, z = (R() - 0.5) * 0.12, h = 0.04 + R() * 0.05; g.add(cyl(0.008, 0.01, h, '#d8d0c0', 'skin', [x, h / 2, z])); const m = sph(0.025 + R() * 0.015, c, 'gem', [x, h, z], [1, 0.5, 1], 10); m.material = m.material.clone(); m.material.emissiveIntensity = 1.2; g.add(m); }
  else if (v === 1) for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28, h = 0.06 + R() * 0.07, k = cone(0.016, h, c, 'gem', [Math.cos(a) * 0.04, h / 2, Math.sin(a) * 0.03], [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4], 6); k.material = k.material.clone(); k.material.emissiveIntensity = 1.3; g.add(k); }
  else if (v === 2) { g.add(sph(0.035, '#e8e0c8', 'bone', [0, 0.03, 0], [1.1, 0.9, 1], 12)); for (const x of [-0.012, 0.012]) g.add(sph(0.009, '#100c0c', 'skin', [x, 0.035, 0.03], null, 8)); g.add(cyl(0.008, 0.008, 0.14, '#e8e0c8', 'bone', [0.08, 0.01, 0.02], [0, 0.4, Math.PI / 2])); }
  else if (v === 3) { const p = cyl(0.12, 0.12, 0.004, '#1a2a3a', 'win', [0, 0.003, 0], null, [1, 1, 0.65], 20); p.material = new THREE.MeshStandardMaterial({ color: '#1e3448', roughness: 0.05, metalness: 0.5 }); g.add(p); g.add(mpPebbles('cave', 21)); }
  else { g.add(mpPebbles('cave', 23)); g.add(cone(0.03, 0.12, '#5a5462', 'stone', [0.05, 0.06, 0], null, 7)); }
  return g;
}
for (let v = 0; v < 8; v++) { MAP3[`cave_${v}`] = () => mpCaveWall(v); MAP3[`stalag_${v}`] = () => mpStalag(v); }
for (let v = 0; v < 6; v++) MAP3[`decor_cave_${v}`] = () => mpCaveDecor(v);
// artefakty dopisuje wypal-mape.js (dane z gry): MAP3['art_' + id] = () => mpArt(id, A)
// Render obiektu mapy: płótno w×h, ziemia środka pola w (ax, ay); cień na ziemi
const MP_SHADOW = new THREE.ShadowMaterial({ opacity: 0.38 });
function renderMap3(key, w = 256, h = 256, ax = 128, ay = 190) {
  const f = MAP3[key]; if (!f) return null; const obj = f(), g = mpGrp(obj); g.scale.z = 1 / Math.sin(MAP_PITCH);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), MP_SHADOW); ground.rotation.x = -Math.PI / 2; ground.userData.noShadow = true; g.add(ground);
  return G3.render(g, w, h, MAP_K, ax, ay, { raw: true, yaw: 0, pitch: MAP_PITCH });
}
