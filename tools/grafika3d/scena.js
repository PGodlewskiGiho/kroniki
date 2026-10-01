// ==================== SCENA MIASTA W 3D (narzędzie, nie trafia do gry) ======================================
// Jak w Resident Evil Remake: całe tło miasta (teren ze wzgórzami, rzeka, drzewa, góry, las na widnokręgu) jest raz
// wyrenderowane z kamery, która dokładnie odtwarza perspektywę sceny 2D (proj w MIASTO: GRAFIKA), a każda budowla jest
// renderowana osobno z tej samej kamery razem z niewidzialnym terenem i rekwizytami: teren przyjmuje jej cień (ShadowMaterial),
// a to, co stoi przed nią (drzewa, wzgórza), zasłania ją przez bufor głębi. Gra kładzie budowle na tło w kolejności głębokości.
// Świat: x = X sceny, y = wysokość e, z = −TF·Z (1 jednostka = 1 px w odległości Z = 1); kamera na wysokości PJ.d patrzy w −z.
/* global THREE, TOWNS */
const TF = 1000, SCX = 296, SW = 592, SH = 438;
const tz = Z => -TF * Z;
// Kamera sceny: punkt główny w (SCX, hor) przesunięciem widoku; D = pikseli renderu na px logiczny
function townCamera(pj, D) {
  const W = SW * D, H = SH * D, cx = SCX * D, cy = pj.hor * D, fw = 2 * Math.max(cx, W - cx), fh = 2 * Math.max(cy, H - cy);
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(fh / 2 / ((pj.f || TF) * D)) * 180 / Math.PI, fw / fh, 40, 60000); /* pj.f: ogniskowa w px (mniejsza = szerszy kąt, widok bardziej z góry) */
  cam.position.set(0, pj.d, 0); cam.lookAt(0, pj.d, -1); cam.setViewOffset(fw, fh, fw / 2 - cx, fh / 2 - cy, W, H); cam.updateProjectionMatrix(); return cam;
}
// Wysokość terenu: wzgórza jako kopce (profil jak w 2D, w głąb rz), koryto rzeki obniżone
function hillsH(L, X, Z) { let h = 0; for (const Hl of L.hills || []) { const dx = (X - Hl.X) / Hl.rx, dz = (Z - Hl.Z) / (Hl.rz || 0.42), q = 1 - dx * dx - dz * dz; if (q > 0) h = Math.max(h, Hl.h * Math.pow(q, Hl.flat || 0.65) * (1 + 0.06 * Math.sin(X * 0.05) * Math.sin(Z * 9))); } return h; }
// Działki budowli: prostokąt pod obrysem najwyższego stopnia (z zapasem), wyrównany do wysokości terenu w środku miejsca;
// budowla stoi na płaskim, a dookoła teren łagodnie wraca do naturalnego
const TOP_KEY = ['hall4', 'fort3', 'guild5', 'dw73', 'dw63', 'dw53', 'dw43', 'dw33', 'smith1', 'silo1', 'dw13', 'dw23', 'tavern1', 'market1', 'special1', 'grail1'];
function slotPads(fac, L) {
  return (L.slots || []).map((S, i) => { const b = buildTown(fac, TOP_KEY[i]); if (!b) return null; b.scale.set(PXU * S.k, PXU * S.k, PXU * S.k); b.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(b);
    return { X: S.X + (bb.min.x + bb.max.x) / 2 * (S.flip ? -1 : 1), Z: S.Z - (bb.min.z + bb.max.z) / 2 / TF, hx: (bb.max.x - bb.min.x) / 2 + 12, hz: (bb.max.z - bb.min.z) / 2 + 12, h: hillsH(L, S.X, S.Z) }; }).filter(Boolean);
}
const padDist = (P, X, Z) => Math.max(Math.abs(X - P.X) - P.hx, Math.abs((Z - P.Z) * TF) - P.hz);
const slotBase = (L, i) => { const S = L.slots[i]; return terrainH(L, S.X, S.Z); };
// Prostokąty budowli w obrazie (najwyższy stopień): ozdoba, która w obrazie wchodzi na budowlę stojącą niedaleko w głąb, wygląda jak
// zderzenie – takie miejsca odrzucamy (drzewo daleko za budowlą może wystawać ponad nią, jak las w tle)
function slotScreenRects(fac, L, cam) {
  return (L.slots || []).map((S, i) => { const b = buildTown(fac, TOP_KEY[i]); if (!b) return null; b.scale.set(PXU * S.k * (S.flip ? -1 : 1), PXU * S.k, PXU * S.k); b.position.set(S.X, hillsH(L, S.X, S.Z), tz(S.Z)); b.updateMatrixWorld(true);
    return { ...screenRect(new THREE.Box3().setFromObject(b), cam), Z: S.Z }; }).filter(Boolean);
}
function screenRect(bb, cam) { let l = 1e9, r = -1e9, t = 1e9, b = -1e9; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) { const v = new THREE.Vector3(x, y, z).project(cam), sx = (v.x + 1) / 2 * SW, sy = (1 - v.y) / 2 * SH; l = Math.min(l, sx); r = Math.max(r, sx); t = Math.min(t, sy); b = Math.max(b, sy); } return { l, r, t, b }; }
// Ozdoba (bryła w świecie) koliduje w obrazie z budowlą, gdy prostokąty zachodzą (z zapasem m px), a ozdoba nie jest daleko za budowlą
function screenClash(L, obj, Z, m = 6) { if (!L.rects) return false; obj.updateMatrixWorld(true); const q = screenRect(new THREE.Box3().setFromObject(obj), L.cam);
  return L.rects.some(R => q.l < R.r + m && q.r > R.l - m && q.t < R.b + m && q.b > R.t - m && Z < R.Z + 0.9); }
// Czy w punkcie (X, Z) nic nie stoi w promieniu r (działki, rzeka) – dla drzew, domów i kamieni
const blocked = (L, X, Z, r) => (L.pads || []).some(P => padDist(P, X, Z) < r) || (L.rivers || []).some(Rv => riverDist(Rv, X, Z) < Rv.w / 2 + r) || (L.keepOut || []).some(([x, z, rr]) => Math.hypot(X - x, (Z - z) * TF) < rr + r);
function terrainH(L, X, Z) {
  let h = hillsH(L, X, Z);
  for (const P of L.pads || []) { const d = padDist(P, X, Z); if (d < 70) { const t = Math.max(0, d) / 70, s = t * t * (3 - 2 * t); h = P.h + (h - P.h) * s; } }
  for (const Rv of L.rivers || []) { const d = riverDist(Rv, X, Z), hw = Rv.w / 2; if (d < hw + 14) h = Math.min(h, -10 * Math.min(1, (hw + 14 - d) / 14)); }
  return h;
}
function riverDist(Rv, X, Z) { // odległość od osi rzeki w jednostkach świata (Z × TF)
  let best = Infinity; const p = Rv.pts;
  for (let i = 0; i < p.length - 1; i++) { const ax = p[i][0], az = p[i][1] * TF, bx = p[i + 1][0], bz = p[i + 1][1] * TF, vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((X - ax) * vx + (Z * TF - az) * vz) / (vx * vx + vz * vz))); best = Math.min(best, Math.hypot(X - ax - vx * t, Z * TF - az - vz * t)); }
  return best;
}
const C3 = c => new THREE.Color(c);
// Szum wartości (fBm) do rzeźby gór, plam trawy i rozrzutu roślin
function vnoise2(x, y, seed = 0) { const h = (a, b) => { let q = (a * 374761393 + b * 668265263 + seed * 1442695041) | 0; q = Math.imul(q ^ (q >>> 13), 1274126177); return ((q ^ (q >>> 16)) >>> 0) / 4294967296; };
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; }
const fbm2 = (x, y, seed = 0, oct = 5) => { let a = 0.5, f = 1, s = 0; for (let o = 0; o < oct; o++) { s += a * vnoise2(x * f, y * f, seed + o); f *= 2.03; a *= 0.5; } return s; };
// Teren: siatka gęstsza z bliska, kolory z palety sceny (bliżej ciemniej, wzgórza własnym kolorem, brzegi rzeki muliste), faktura trawy
function terrainMesh(L) {
  const nx = 220, nz = 150, X0 = -2200, X1 = 2200, Z0 = 0.7, Z1 = 13, pos = [], col = [], uv = [], idx = [], G = L.ground.map(C3), tmp = new THREE.Color();
  for (let j = 0; j <= nz; j++) { const f = j / nz, Z = Z0 + (Z1 - Z0) * Math.pow(f, 1.8); for (let i = 0; i <= nx; i++) { const X = (X0 + (X1 - X0) * i / nx) * (0.5 + Z / 2.6), h = terrainH(L, X, Z);
    pos.push(X, h, tz(Z)); uv.push(X / 90, Z * TF / 90);
    const zf = Math.min(1, (Z - 0.7) / 3); tmp.copy(G[2]).lerp(G[1], Math.min(1, zf * 1.6)).lerp(G[0], Math.max(0, zf * 1.6 - 0.6)); tmp.lerp(C3('#5a8a34'), 0.35 * (1 - zf)); // żywsza zieleń z bliska
    const pn = fbm2(X / 260, Z * TF / 260, 5, 4); tmp.offsetHSL((pn - 0.5) * 0.04, (pn - 0.5) * 0.15, (pn - 0.5) * 0.18); if (fbm2(X / 120, Z * TF / 120, 9, 3) > 0.68) tmp.lerp(C3('#8a7a4a'), 0.35); // plamy trawy i przetarta ziemia
    for (const Hl of L.hills || []) { const dx = (X - Hl.X) / Hl.rx, dz = (Z - Hl.Z) / (Hl.rz || 0.42), q = 1 - dx * dx - dz * dz; if (q > 0 && Hl.cols) tmp.lerp(C3(Hl.cols[0]).lerp(C3(Hl.cols[1]), 0.5), Math.min(1, q * 2.2)); }
    if (h < -1) tmp.lerp(C3('#4a4030'), Math.min(1, -h / 8)); col.push(tmp.r, tmp.g, tmp.b); } }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const t = archTex('grass').clone(); t.needsUpdate = true; t.repeat.set(1, 1);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: t, bumpMap: t, bumpScale: 1.5, roughness: 0.96 })); m.receiveShadow = true; m.userData.ground = true; return m;
}
// Wstęga po łamanej (rzeka, droga) na wysokości y nad terenem
function ribbonMesh(L, pts, w, y, mat, follow = true) {
  const pos = [], uv = [], idx = []; let acc = 0; const P2 = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 8; k++) { const t = k / 8; P2.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]); } P2.push(pts[pts.length - 1]);
  P2.forEach(([X, Z], i) => { const [aX, aZ] = P2[Math.max(0, i - 1)], [bX, bZ] = P2[Math.min(P2.length - 1, i + 1)], dx = bX - aX, dz = (bZ - aZ) * TF, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    if (i) acc += Math.hypot(X - P2[i - 1][0], (Z - P2[i - 1][1]) * TF);
    for (const s of [-1, 1]) { const x = X + nx * s * w / 2, zz = Z * TF + nz * s * w / 2; pos.push(x, (follow ? terrainH(L, x, zz / TF) : 0) + y, -zz); uv.push((s + 1) / 2 * w / 60, acc / 60); } });
  for (let i = 0; i < P2.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
// Bryła liści: gęsta kula z garbami z szumu (gładkie cieniowanie, nie fasetki)
function leafBlob(r, col, pos, seed) { const geo = new THREE.IcosahedronGeometry(r, 3), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(), k = 1 + 0.22 * (fbm2(n.x * 2.2 + seed, n.y * 2.2 + n.z * 1.7, seed, 3) - 0.5) * 2; v.copy(n).multiplyScalar(r * k); v.y *= 0.85; p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * r / 8, uv.getY(i) * r / 8);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, map: archTex('leaves'), bumpMap: archTex('leaves'), bumpScale: 2, roughness: 0.85 })); m.position.set(...pos); return m; }
// Drzewo liściaste: pień z konarami, korona z kilku brył liści (jaśniejsza od słońca), skala k
function tree3(x, y, z, k = 1, col = '#4a7a32', seed = 1) {
  const g = new THREE.Group(), R = rng(seed * 101), s = 26 * k;
  g.add(mesh(new THREE.CylinderGeometry(s * 0.1, s * 0.16, s * 1.5, 8), '#5a3e26', 'bark', [0, s * 0.75, 0]));
  for (let i = 0; i < 9; i++) { const a = R() * Math.PI * 2, r = s * (0.25 + R() * 0.55), h = s * (1.55 + R() * 1.1), sz = s * (0.55 + R() * 0.35), c = new THREE.Color(col).offsetHSL((R() - 0.5) * 0.04, 0, (R() - 0.5) * 0.12);
    g.add(leafBlob(sz, '#' + c.getHexString(), [Math.cos(a) * r, h, Math.sin(a) * r], seed * 13 + i)); }
  g.position.set(x, y, z); g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g;
}
function bush3(x, y, z, k = 1, seed = 3) { const g = new THREE.Group(), R = rng(seed * 7); for (let i = 0; i < 5; i++) { const sz = 9 * k * (0.7 + R() * 0.5); g.add(leafBlob(sz, R() < 0.5 ? '#3e6a2a' : '#4e7a30', [(R() - 0.5) * 16 * k, sz * 0.7, (R() - 0.5) * 10 * k], seed + i)); } g.position.set(x, y, z); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g; }
function mushroom3(x, y, z, k = 1) { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(3 * k, 4 * k, 12 * k, 10), '#efe6d2', 'cloth', [0, 6 * k, 0])); const cap = sph(10 * k, '#c8302a', 'skin', [0, 12 * k, 0], [1, 0.55, 1]); g.add(cap);
  for (let i = 0; i < 6; i++) { const a = i * 1.1; g.add(sph(1.6 * k, '#f4eee0', 'cloth', [Math.cos(a) * 7 * k, 15 * k, Math.sin(a) * 7 * k])); } g.position.set(x, y, z); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g; }
// Przyroda wokół: zagajniki (z dala od budowli), kępy trawy, kwiaty i kamienie z bliska (rozrzut z szumu, powtarzalny)
function nature3(L) {
  const R = rng(57), trees = new THREE.Group(), small = new THREE.Group(), free = (X, Z, m) => !blocked(L, X, Z, m);
  for (let i = 0; i < 260 && trees.children.length < 46; i++) { const Z = 1.3 + R() * 2.2, X = (R() - 0.5) * 2 * 330 * Z; if (fbm2(X / 300, Z * 3, 3, 3) < 0.48 || !free(X, Z, 70)) continue; const t3 = tree3(X, terrainH(L, X, Z), tz(Z), 1.3 + R() * 0.8, R() < 0.5 ? '#4a7a32' : '#5a8434', i + 7); if (!screenClash(L, t3, Z)) trees.add(t3); }
  const N = 9000, tuft = new THREE.ConeGeometry(0.5, 1, 3); tuft.translate(0, 0.5, 0); const gm = new THREE.InstancedMesh(tuft, new THREE.MeshStandardMaterial({ roughness: 0.9 }), N), o = new THREE.Object3D(); let n = 0;
  for (let i = 0; i < N * 3 && n < N; i++) { const Z = 0.78 + Math.pow(R(), 1.8) * 1.2, X = (R() - 0.5) * 2 * 320 * Z; if (!free(X, Z, 4)) continue; const h = 2.5 + R() * 3.5; o.position.set(X, terrainH(L, X, Z), tz(Z)); o.scale.set(0.8 + R() * 0.6, h, 0.8 + R() * 0.6); o.rotation.set((R() - 0.5) * 0.5, R() * 6, (R() - 0.5) * 0.5); o.updateMatrix(); gm.setMatrixAt(n, o.matrix);
    gm.setColorAt(n, R() < 0.03 ? C3(['#e8d860', '#ece8e0', '#c890d0', '#e08a5a'][n % 4]) : C3('#3e6424').offsetHSL((R() - 0.5) * 0.05, 0, (R() - 0.5) * 0.1)); n++; }
  gm.count = n; gm.castShadow = true; gm.receiveShadow = true; small.add(gm);
  for (let i = 0; i < 40; i++) { const Z = 0.8 + R() * 1.6, X = (R() - 0.5) * 2 * 300 * Z; if (!free(X, Z, 10)) continue; const r = 3 + R() * 7; const rk = chunk(r, r * 0.6, r * 0.8, R() < 0.5 ? '#8a867a' : '#a09a8a', 'rock', [X, terrainH(L, X, Z) + r * 0.3, tz(Z)], [0, R() * 6, 0], i, 12); if (!screenClash(L, rk, Z, 2)) small.add(rk); }
  small.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return { trees, small };
}
// Góry: pasmo z szumu na dalekim planie, skała z fakturą, śnieg na szczytach; las na widnokręgu z brył koron
function mountains3(L) {
  const g = new THREE.Group(), R = rng(31), nx = 420, nz = 24;
  for (const [Zc, amp, col, ph] of [[12, 900, L.mountains[1], 1.7], [8.6, 560, L.mountains[0], 0.4]]) {
    const pos = [], idx = [], cols = [], cA = C3(col).lerp(C3('#5a6a8a'), 0.35), snow = C3('#eef0f6'), tmp = new THREE.Color();
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const X = -9000 + 18000 * i / nx, dz = (j / nz - 0.5) * 1.6, ridge = 0.55 + 0.3 * Math.sin(X * 0.0011 + ph) + 0.2 * Math.sin(X * 0.0037 + ph * 2) + 0.1 * Math.sin(X * 0.011 + ph * 3) + (R() - 0.5) * 0.05;
      const h = Math.max(0, amp * ridge * (1 - dz * dz) * (0.75 + 0.5 * fbm2(X / 900, dz * 3, Zc | 0, 6))); pos.push(X, h - 220, tz(Zc + dz)); tmp.copy(cA); if (h > amp * 0.8) tmp.lerp(snow, Math.min(1, (h - amp * 0.8) / (amp * 0.15))); cols.push(tmp.r, tmp.g, tmp.b); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const uvs = []; for (let k = 0; k < pos.length; k += 3) uvs.push(pos[k] / 400, pos[k + 1] / 400); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: archTex('rock'), bumpMap: archTex('rock'), bumpScale: 4, roughness: 0.95 }))); }
  return g;
}
function farForest3(L) {
  const R = rng(29), n = 420, geo = new THREE.IcosahedronGeometry(1, 1), m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.95, map: archTex('leaves') }), n), o = new THREE.Object3D(), cols = L.forest.map(C3);
  for (let i = 0; i < n; i++) { const Z = 3.3 + R() * 1.6, X = (R() - 0.5) * 2 * 300 * Z * 1.3, h = 44 + R() * 40; o.position.set(X, terrainH(L, X, Z) + h * 0.55, tz(Z)); o.scale.set(h * 0.42, h * 0.6, h * 0.42); o.rotation.y = R() * 6; o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, cols[i % cols.length].clone().offsetHSL(0, 0, (R() - 0.5) * 0.08)); }
  m.castShadow = true; m.receiveShadow = true; return m;
}
// Cała scena frakcji (bez budowli). Zwraca { scene, ground: [...] } – ground: obiekty, które w przebiegu budowli przyjmują cień i zasłaniają
// bare: tylko teren (tło malowane osobno, np. przez AI): bez wody, dróg, rekwizytów, przyrody i gór; słońce z prawej jak na namalowanym niebie
function townWorld(fac, bare = false) {
  G3.init(); const T = TOWNS[fac], L = T.scene, scene = new THREE.Scene(), occl = [], far = []; L.pads = slotPads(fac, L); L.keepOut = []; L.cam = townCamera(L.pj || { hor: 94, d: 282 }, 1); L.rects = slotScreenRects(fac, L, L.cam);
  const hz = C3(L.haze || '#a0a0a0').lerp(C3((T.sky && T.sky.mid) || '#8aa0c8'), 0.6); scene.fog = new THREE.Fog(hz, 1400, 24000); // ta sama mgła dla terenu i gór: góry wyrastają z ziemi
  scene.add(new THREE.HemisphereLight(0xc8d4f4, 0x3a3020, 0.5));
  const sun = new THREE.DirectionalLight(0xffe2b8, 4.8), target = new THREE.Object3D(); target.position.set(0, 0, tz(1.8)); scene.add(target); sun.target = target;
  if (bare) sun.position.set(1400, 4200, tz(1.8) + 900); else sun.position.set(-3000, 1500, tz(1.8) - 500); /* słońce z lewej, lekko zza sceny: cienie padają w prawo i ku widzowi, fasady w świetle bocznym */ sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -1800, right: 1800, top: 1800, bottom: -1800, near: 100, far: 9000 }); sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 1.5; sun.shadow.radius = 3; scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9ab0e8, 0.45); fill.position.set(1500, 600, 2500); scene.add(fill);
  const ter = terrainMesh(L); scene.add(ter); occl.push(ter);
  if (bare) { scene.environment = G3.scene.environment; return { scene, occl, far, L }; }
  for (const Rv of L.rivers || []) { const w = ribbonMesh(L, Rv.pts, Rv.w, -4, new THREE.MeshStandardMaterial({ color: '#5a8cb4', roughness: 0.12, metalness: 0.15 }), false); w.position.y = -4; scene.add(w); occl.push(w); }
  for (const Rd of L.roads || []) { const t = archTex(Rd.main ? 'cobble' : 'dirt'); const r = ribbonMesh(L, Rd.pts.map(p => [p[0], p[1]]), Rd.w, 0.8, new THREE.MeshStandardMaterial({ color: Rd.main ? '#b0a690' : '#a08a64', map: t, bumpMap: t, bumpScale: 1, roughness: 0.9 })); scene.add(r); occl.push(r); }
  if (L.plaza) { const P0 = L.plaza, d = new THREE.Mesh(new THREE.CircleGeometry(P0.r, 48), new THREE.MeshStandardMaterial({ color: '#b0a690', map: archTex('cobble'), roughness: 0.9 })); d.rotation.x = -Math.PI / 2; d.position.set(P0.X, terrainH(L, P0.X, P0.Z) + 1, tz(P0.Z)); d.receiveShadow = true; scene.add(d); occl.push(d); }
  for (const [kind, X, Z, e = 0, k = 1] of L.props || []) { if (blocked(L, X, Z, kind === 'tree' ? 45 * k : 15)) continue; const y = terrainH(L, X, Z) + e, z = tz(Z), seed = Math.round(X * 7 + Z * 100);
    const o = kind === 'tree' ? tree3(X, y, z, k * 1.6, '#4a7a32', seed) : kind === 'bush' ? bush3(X, y, z, k * 1.4, seed) : null; if (o && !screenClash(L, o, Z)) { scene.add(o); occl.push(o); } }
  if (TOWN_EXTRAS[fac]) TOWN_EXTRAS[fac](L, o => { scene.add(o); occl.push(o); });
  const nat = nature3(L); scene.add(nat.trees); occl.push(nat.trees); scene.add(nat.small); occl.push(nat.small);
  const mts = mountains3(L); scene.add(mts); far.push(mts); const ff = farForest3(L); scene.add(ff); occl.push(ff);
  scene.environment = G3.scene.environment;
  return { scene, occl, far, L };
}
// Render sceny do płótna W×H (×D) z nadpróbkowaniem; tło przezroczyste (niebo maluje gra)
function renderTown(scene, cam, D, SS = 2) {
  G3.init(); const r = G3.r, W = SW * D, H = SH * D; r.setSize(W * SS, H * SS, false); r.shadowMap.enabled = true; r.localClippingEnabled = true; r.setClearColor(0x000000, 0);
  const c2 = cam.clone(); c2.setViewOffset(cam.view.fullWidth * SS, cam.view.fullHeight * SS, cam.view.offsetX * SS, cam.view.offsetY * SS, W * SS, H * SS); c2.updateProjectionMatrix();
  const key = W * SS + 'x' + H * SS; if (!renderTown.comp || renderTown.comp._k !== key) { const comp = new THREE.EffectComposer(r, new THREE.WebGLRenderTarget(W * SS, H * SS, { type: THREE.HalfFloatType, samples: 4 })); comp._k = key; renderTown.comp = comp; }
  if (renderTown.plain) { r.render(scene, c2); const o2 = document.createElement('canvas'); o2.width = W; o2.height = H; o2.getContext('2d').drawImage(r.domElement, 0, 0, W, H); return o2; }
  const comp = renderTown.comp; comp.passes.slice().forEach(p => comp.removePass(p)); const rp = new THREE.RenderPass(scene, c2); rp.clearAlpha = 0; comp.addPass(rp);
  const ao = new THREE.GTAOPass(scene, c2, W * SS, H * SS); ao.updateGtaoMaterial({ radius: 14, distanceExponent: 1.5, thickness: 6, scale: 1.4 }); ao.blendIntensity = 1; comp.addPass(ao); comp.addPass(new THREE.OutputPass()); // okluzja otoczenia: zakamarki i styk z ziemią
  comp.render(); const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(r.domElement, 0, 0, W, H); return out;
}
// Tło frakcji: wszystko poza budowlami
function renderTownBg(fac, D = 2) { const T = TOWNS[fac], w = townWorld(fac), cam = townCamera(T.scene.pj || { hor: 94, d: 282 }, D); const c = renderTown(w.scene, cam, D); sharpen(c, 0.35); return c; }
// Budowla w scenie: model w miejscu i skali miejsca, teren i rekwizyty tylko jako cień i zasłona (bufor głębi)
function renderTownBuilding(fac, key, slot, D = 2, bare = false) {
  const T = TOWNS[fac], S = T.scene.slots[slot], b = buildTown(fac, key); if (!b) return null;
  const w = townWorld(fac, bare), cam = townCamera(T.scene.pj || { hor: 94, d: 282 }, D);
  const shadowM = new THREE.ShadowMaterial({ opacity: bare ? 0.42 : 0.62 }), hide = new THREE.MeshBasicMaterial({ colorWrite: false });
  for (const o of w.occl) o.traverse(m => { if (m.isMesh || m.isInstancedMesh) { m.castShadow = false; m.material = m.userData.ground || m === o && o.isMesh ? shadowM : hide; } });
  for (const o of w.far) o.visible = false;
  b.scale.set(PXU * S.k * (S.flip ? -1 : 1), PXU * S.k, PXU * S.k); const y0 = bare ? (S.e || 0) : slotBase(w.L, slot); b.position.set(S.X, y0, tz(S.Z)); if (bare) { b.rotation.order = 'YXZ'; b.rotation.x = (S.tilt || 0) * Math.PI / 180; b.rotation.y = (S.yaw || 0) * Math.PI / 180; } /* pochylenie ku kamerze: obraz pokazuje to miejsce bardziej z góry, niż wynika z perspektywy */
  if (bare) { for (const o of w.occl) w.scene.remove(o); const pl = new THREE.Mesh(new THREE.CircleGeometry(PXU * S.k * S.w * 1.6, 48), shadowM); pl.rotation.x = -Math.PI / 2; pl.position.set(S.X, y0 + 0.3, tz(S.Z)); pl.receiveShadow = true; w.scene.add(pl); } /* tło namalowane: cień tylko na płaskim krążku pod budowlą */ b.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); w.scene.add(b);
  if (bare) { const clip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -y0)]; b.traverse(m => { if (m.isMesh && m.material) m.material = [].concat(m.material).map(x => { const c = x.clone(); c.clippingPlanes = clip; return c; }).reduce((a, c, i, A) => A.length > 1 ? A : c, null); }); } /* korzenie i podmurówki pod ziemią: na malowanym tle nic ich nie zasłania, więc obcinamy wszystko poniżej gruntu */
  w.scene.updateMatrixWorld(true); const marks = []; b.traverse(o => { if (o.name && o.name.startsWith('fx:')) { const v = o.getWorldPosition(new THREE.Vector3()).project(cam); marks.push([o.name.slice(3), Math.round((v.x + 1) / 2 * SW * 10) / 10, Math.round((1 - v.y) / 2 * SH * 10) / 10]); } });
  const c = renderTown(w.scene, cam, D); sharpen(c, 0.35); c._marks = marks; return c;
}
function sharpen(c, amount) { const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data, s = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = (y * w + x) * 4; if (s[i + 3] < 250) continue; for (let j = 0; j < 3; j++) d[i + j] = s[i + j] + amount * (4 * s[i + j] - s[i - 4 + j] - s[i + 4 + j] - s[i - w * 4 + j] - s[i + w * 4 + j]) / 4; }
  g.putImageData(img, 0, 0); }

// ==================== KOMPOZYCJA SCEN FRAKCJI ====================
// To, co daje poczucie wielkiego miasta: mury, drogi, plac, mosty, zabudowa mieszczan w tle, drzewa w ramie kadru.
// Każda frakcja: funkcja (L, add) dokładająca bryły do tła; add(obiekt) = część tła, która też zasłania budowle.
// Dom mieszczański (wypełnienie): mur pruski albo kamień, dach dwuspadowy, obrót w stronę widza
function townHouse(x, y, z, k, seed, A) {
  const R = rng(seed), w = 34 + R() * 26, h = 24 + R() * 18, d = 26 + R() * 12, roof = ['#b4402c', '#9a3a28', '#7a5030', '#a84a30'][Math.floor(R() * 4)], g = new THREE.Group();
  if (R() < 0.55) g.add(halfTimber(w, h, d, 0, 0, { wins: 2 + Math.floor(R() * 2), floors: h > 34 ? 2 : 1, roofH: h * 0.6, roof, chim: R() < 0.4 }));
  else g.add(stoneHall(w, h * 0.8, d, 0, 0, { roof, roofH: h * 0.5, wins: 2, doorW: 10 }));
  g.scale.setScalar(PXU * k / PXU); g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  const o = new THREE.Group(); o.add(g); g.scale.setScalar(k); o.position.set(x, y, z); o.rotation.y = (R() - 0.5) * 0.7; o.scale.setScalar(1); return o;
}
// Mur obronny po łamanej (X, Z) na terenie: odcinki z blankami i baszty w narożnikach; brama w punkcie gate (indeks)
function cityWall(L, pts, h, A, gateAt = -1) {
  const g = new THREE.Group(), seg = (a, b, i) => { const ax = a[0], az = tz(a[1]), bx = b[0], bz = tz(b[1]), len = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, y = Math.min(terrainH(L, ax, a[1]), terrainH(L, bx, b[1]));
    const s = new THREE.Group(); s.position.set(mx, y - 6, mz); s.rotation.y = -Math.atan2(bz - az, bx - ax); s.scale.setScalar(1 / 1);
    const inner = new THREE.Group(); inner.scale.setScalar(PXU); s.add(inner);
    if (i === gateAt) { inner.add(gatehouse(Math.min(len, 60), h + 18, 0, 0)); } else { inner.add(curtain(-len / 2, len / 2, 0, h + 6)); }
    g.add(s); };
  for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], i);
  for (const p of pts) { const t = new THREE.Group(); t.scale.setScalar(PXU); t.add(roundTower(13, h + 26, 0, 0, A, { roof: HV.blue, roofH: 30, wins: 1 })); t.position.set(p[0], terrainH(L, p[0], p[1]) - 6, tz(p[1])); g.add(t); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g;
}
// Most kamienny łukowy w poprzek rzeki (wzdłuż Z) w punkcie X
function stoneBridge(L, X, Z, len = 110, w = 30) {
  const g = new THREE.Group(), deck = new THREE.Mesh(new THREE.BoxGeometry(w, 8, len), archMat('#b8ac94', 'ashlar')); deck.position.set(X, 4, tz(Z)); g.add(deck);
  for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(3, 7, len), archMat('#a89a80', 'ashlar')); rail.position.set(X + s * (w / 2 - 1.5), 11, tz(Z)); g.add(rail); }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(len * 0.32, 5, 8, 20, Math.PI), archMat('#a89a80', 'ashlar')); arch.rotation.y = Math.PI / 2; arch.position.set(X, -8, tz(Z)); arch.scale.set(1, 0.5, 1); g.add(arch);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g;
}
const TOWN_EXTRAS = {
  haven(L, add) {
    const A = havenA();
    // zabudowa mieszczan w głębi (miasto ciągnie się dalej za zamkiem), bez zderzeń w obrazie
    const R = rng(404), busy = (X, Z) => blocked(L, X, Z, 45);
    let n = 0; for (let i = 0; i < 900 && n < 40; i++) { const right = R() < 0.5, Z = 2.55 + R() * 0.8, X = right ? 100 + R() * 900 : -1000 + R() * 700; /* dzielnice za zamkiem i po bokach */ if (busy(X, Z)) continue; const hs = townHouse(X, terrainH(L, X, Z) - 2, tz(Z), 1.15 + R() * 0.3, 900 + i, A); if (screenClash(L, hs, Z)) continue;
      add(hs); L.keepOut.push([X, Z, 40]); n++; }
    // ramę kadru tworzą drzewa po bokach z przodu
    for (const [X, Z, k] of [[-330, 0.95, 2.2], [-300, 1.1, 1.9], [360, 0.98, 2.1], [330, 1.15, 1.8], [-640, 1.5, 2.2], [690, 1.4, 2.2]]) if (!blocked(L, X, Z, 40 * k)) { const t3 = tree3(X, terrainH(L, X, Z), tz(Z), k, '#4a7a32', Math.round(X + Z * 100)); if (!screenClash(L, t3, Z)) add(t3); }
  },
};

// --- Miasto na namalowanym tle (tools/tla-ai): układ z pliku uklady/<frakcja>.json i wykończenie budowli pod obraz ---
// U = { pj: { hor, d, f }, slots: [{ s: [sx, sy], z?, k?, flip? }], haze?, grade? }: s = punkt podstawy na ekranie, z = głębokość
// (domyślnie z płaskiej ziemi), e (wysokość) wynika z rzędu. Kamera jak townCamera z ogniskową f.
// Ozdoby z układu (U.ozdoby: [{ o: wariant, s: [sx, sy], k }]) wtapiane w namalowane tło: render jak budowla (TOWN3[fac].ozd(wariant)), od dalszych do bliższych
function paintedDecor(fac, U, c, D, dep) {
  const T = TOWNS[fac], L = U.ozdoby || []; if (!L.length || !TOWN3[fac].ozd) return; const g = c.getContext('2d'), bgd = g.getImageData(0, 0, c.width, c.height);
  L.map((o, i) => ({ o, i, sy: o.s[1] })).sort((a, b) => a.sy - b.sy).forEach(({ o, i }) => { const b = renderTownBuilding(fac, 'ozd' + o.o, 100 + i, D, true); if (b) g.drawImage(paintedFinish(b, fac, 100 + i, bgd, D, U, dep), 0, 0); });
}
function applyPaintedLayout(fac, U) {
  const T = TOWNS[fac], { hor, d } = U.pj, f = U.pj.f || 1000; T.scene.pj = U.pj;
  U.slots.forEach((o, i) => { const S = T.scene.slots[i]; if (!S) return; const [sx, sy] = o.s, zw = o.z ? o.z * 1000 : f * d / (sy - hor);
    S.X = (sx - 296) * zw / f; S.Z = zw / 1000; S.e = d - (sy - hor) * zw / f; S.k = (S.k0 || (S.k0 = S.k)) * (o.k || 1); S.flip = !!o.flip; S.tilt = o.tilt || 0; S.yaw = o.yaw || 0; });
  (U.ozdoby || []).forEach((o, i) => { const [sx, sy] = o.s, zw = f * d / (sy - hor); T.scene.slots[100 + i] = { X: (sx - 296) * zw / f, Z: zw / 1000, e: 0, k: o.k || 1, k0: 1, w: 14, flip: !!o.flip, tilt: 0, yaw: o.yaw || 0 }; });
}
// b: render budowli (kadr 592×438 × D), bg: ImageData tła w tym samym kadrze. Zwraca nowy kadr: wydeptany placyk w barwie ziemi z obrazu
// i cień styku pod podstawą (elipsa w perspektywie miejsca), na nich budowla przygaszona jak obraz, dalsza zamglona.
function paintedFinish(b, fac, slot, bg, D, U, dep) {
  const T = TOWNS[fac], S = T.scene.slots[slot], W = b.width, H = b.height, bdI = b.getContext('2d').getImageData(0, 0, W, H), bd = bdI.data, out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d');
  let bot = -1; for (let y = H - 1; y >= 0 && bot < 0; y--) for (let x = 0; x < W; x++) if (bd[(y * W + x) * 4 + 3] > 128) { bot = y; break; }
  if (bot >= 0) { const band = Math.max(4, Math.round(10 * D)); let l = W, r = -1; for (let y = bot - band; y <= bot; y++) for (let x = 0; x < W; x++) if (bd[(y * W + x) * 4 + 3] > 128) { l = Math.min(l, x); r = Math.max(r, x); }
    const cx = (l + r) / 2, cy = bot - 2 * D, rx = (r - l) / 2 * 1.25, v = bot / D - U.pj.hor, F = U.pj.f || 1000, k = v / Math.hypot(F, v), ry = rx * k;
    const ix = Math.round(Math.min(W - 1, Math.max(0, cx))), iy = Math.round(Math.min(H - 1, Math.max(0, cy + ry * 1.6))), pi = (iy * W + ix) * 4, col = [bg.data[pi], bg.data[pi + 1], bg.data[pi + 2]];
    const dirt = `${Math.round(col[0] * 0.75 + 46)},${Math.round(col[1] * 0.7 + 30)},${Math.round(col[2] * 0.6 + 14)}`;
    g.save(); g.translate(cx, cy); g.scale(1, k); let gr = g.createRadialGradient(0, 0, 0, 0, 0, rx * 1.15); gr.addColorStop(0, `rgba(${dirt},.75)`); gr.addColorStop(0.6, `rgba(${dirt},.45)`); gr.addColorStop(1, `rgba(${dirt},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx * 1.15, 0, 7); g.fill();
    gr = g.createRadialGradient(0, -ry * 0.2 / k, 0, 0, -ry * 0.2 / k, rx * 0.8); gr.addColorStop(0, 'rgba(18,16,10,.55)'); gr.addColorStop(0.7, 'rgba(18,16,10,.25)'); gr.addColorStop(1, 'rgba(18,16,10,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, -ry * 0.2 / k, rx * 0.8, 0, 7); g.fill(); g.restore(); }
  if (dep && bot >= 0 && U.glebia && (U.slots[slot] || {}).zaslona !== false) { // drzewa i wzgórza z obrazu bliżej niż podstawa budowli zasłaniają ją (głębia z glebia.py)
    let l = W, r = -1; for (let x = 0; x < W; x++) if (bd[(bot * W + x) * 4 + 3] > 128) { l = Math.min(l, x); r = Math.max(r, x); }
    const cx = Math.round((l + r) / 2), samp = []; for (let dx = -4 * D; dx <= 4 * D; dx += D) for (let dy = 1; dy <= 3 * D; dy += D) { const x = Math.min(W - 1, Math.max(0, cx + dx)), y = Math.min(H - 1, bot + dy); samp.push(dep.data[(y * W + x) * 4]); }
    samp.sort((a, c) => a - c); const db = samp[samp.length >> 1], m = 255 * Math.log(1 / 0.86) / (U.glebia.hi - U.glebia.lo), soft = 255 * 0.04 / (U.glebia.hi - U.glebia.lo);
    for (let y = 0; y < bot - 4 * D; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (!bd[i + 3]) continue; const dp = dep.data[i], k = Math.min(1, Math.max(0, (dp - (db - m)) / soft + 0.5)); if (k < 1) bd[i + 3] = Math.round(bd[i + 3] * k); }
    b.getContext('2d').putImageData(bdI, 0, 0); }
  const hz = Math.min(0.4, Math.max(0, (S.Z * 1000 / (U.pj.f || 1000) - 1.2) * 0.1)), q = b.getContext('2d'); q.globalCompositeOperation = 'source-atop'; q.globalAlpha = hz; q.fillStyle = U.haze || '#8a98ac'; q.fillRect(0, 0, W, H); q.globalAlpha = 1; q.globalCompositeOperation = 'source-over';
  const bb = U.blend === false ? b : blendIntoPainting(b, bg, D, U);
  g.filter = U.grade || 'saturate(0.85) brightness(0.92) contrast(0.95)'; g.drawImage(bb, 0, 0); g.filter = 'none'; out._marks = b._marks; return out;
}
// Wtopienie renderu w obraz: (1) barwy częściowo dopasowane do otoczenia (średnia i rozrzut kanałów obrazu wokół budowli),
// (2) ostrość jak obrazu (render zmniejszony do rozdzielczości obrazu i z powrotem), (3) filtr malarski Kuwahary (plamy jak pędzlem),
// (4) przenikanie światła: rozmyte tło zachodzi na krawędzie budowli.
function blendIntoPainting(b, bg, D, U) {
  const W = b.width, H = b.height, src = b.getContext('2d').getImageData(0, 0, W, H), d = src.data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return b; const P = Math.round(12 * D); x0 = Math.max(0, x0 - P); y0 = Math.max(0, y0 - P); x1 = Math.min(W - 1, x1 + P); y1 = Math.min(H - 1, y1 + P); const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const o = U.blendOpts || {}, CT = o.color ?? 0.18, KR = o.kuwahara ?? 1, WRAP = o.wrap ?? 0.22, RES = o.res ?? (U.res || 0.8);
  // (1) dopasowanie barw: statystyki obrazu w pierścieniu wokół budowli i samej budowli
  const st = (cond, data, ww) => { const m = [0, 0, 0], q = [0, 0, 0]; let n = 0; for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) { const i = (y * ww + x) * 4; if (!cond(i)) continue; for (let c = 0; c < 3; c++) { m[c] += data[i + c]; q[c] += data[i + c] ** 2; } n++; }
    return n ? m.map((v, c) => [v / n, Math.sqrt(Math.max(1, q[c] / n - (v / n) ** 2))]) : null; };
  const sb = st(i => d[i + 3] > 200, d, W), sg = st(i => d[i + 3] < 10, bg.data, W);
  const c1 = document.createElement('canvas'); c1.width = w; c1.height = h; const g1 = c1.getContext('2d'), im = g1.createImageData(w, h), a = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y + y0) * W + x + x0) * 4, j = (y * w + x) * 4; a[j + 3] = d[i + 3];
    for (let c = 0; c < 3; c++) { let v = d[i + c]; if (sb && sg) { v += (sg[c][0] - sb[c][0]) * CT; /* tylko odcień i jasność w stronę otoczenia; kontrast budowli zostaje */ } a[j + c] = Math.max(0, Math.min(255, v)); } }
  // (3) Kuwahara: dla każdego piksela średnia z tej z 4 ćwiartek okna, która ma najmniejszą wariancję
  if (KR > 0) { const s = new Uint8ClampedArray(a); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const j = (y * w + x) * 4; if (s[j + 3] < 8) continue; let best = 1e18, bm = null;
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const m = [0, 0, 0]; let q = 0, n = 0; for (let v = 0; v <= KR; v++) for (let u = 0; u <= KR; u++) { const xx = x + u * dx, yy = y + v * dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const k = (yy * w + xx) * 4; if (s[k + 3] < 8) continue; const l = s[k] + s[k + 1] + s[k + 2]; m[0] += s[k]; m[1] += s[k + 1]; m[2] += s[k + 2]; q += l * l; n++; }
        if (!n) continue; const lm = (m[0] + m[1] + m[2]) / n, va = q / n - lm * lm; if (va < best) { best = va; bm = [m[0] / n, m[1] / n, m[2] / n]; } }
      if (bm) { a[j] = bm[0]; a[j + 1] = bm[1]; a[j + 2] = bm[2]; } } }
  g1.putImageData(im, 0, 0);
  // (2) ostrość obrazu: w dół do rozdzielczości obrazu i z powrotem
  if (RES < 1) { const sw = Math.max(1, Math.round(w * RES)), sh = Math.max(1, Math.round(h * RES)), t = document.createElement('canvas'); t.width = sw; t.height = sh; const tg = t.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(c1, 0, 0, sw, sh); g1.clearRect(0, 0, w, h); g1.imageSmoothingQuality = 'high'; g1.drawImage(t, 0, 0, w, h); }
  // (4) przenikanie światła: rozmyte tło pod budowlą, widoczne tylko przy jej krawędzi (maska = budowla minus jej zwężenie)
  if (WRAP > 0) { const r = Math.max(2, Math.round(3 * D)), bgc = document.createElement('canvas'); bgc.width = w; bgc.height = h; const bgg = bgc.getContext('2d'), bgi = bgg.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y + y0) * W + x + x0) * 4, j = (y * w + x) * 4; bgi.data[j] = bg.data[i]; bgi.data[j + 1] = bg.data[i + 1]; bgi.data[j + 2] = bg.data[i + 2]; bgi.data[j + 3] = 255; } bgg.putImageData(bgi, 0, 0);
    const blur = document.createElement('canvas'); blur.width = w; blur.height = h; const bl = blur.getContext('2d'); bl.filter = `blur(${r * 2}px)`; bl.drawImage(bgc, 0, 0); bl.filter = 'none';
    const edge = document.createElement('canvas'); edge.width = w; edge.height = h; const eg = edge.getContext('2d'); eg.drawImage(c1, 0, 0); eg.globalCompositeOperation = 'destination-out'; eg.filter = `blur(${r}px)`; eg.drawImage(c1, 0, 0); eg.filter = 'none';
    eg.globalCompositeOperation = 'source-in'; eg.drawImage(blur, 0, 0); g1.globalAlpha = WRAP; g1.globalCompositeOperation = 'source-atop'; g1.drawImage(edge, 0, 0); g1.globalAlpha = 1; g1.globalCompositeOperation = 'source-over'; }
  const outc = document.createElement('canvas'); outc.width = W; outc.height = H; outc.getContext('2d').drawImage(c1, x0, y0); return outc;
}
// Tło z obrazu w kadrze 592×438 × D (obraz w polu sceny 8–584 × 8–430), wyostrzone po powiększeniu
function paintedDepth(im, D) { const c = document.createElement('canvas'); c.width = 592 * D; c.height = 438 * D; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 8 * D, 8 * D, 576 * D, 422 * D); return g.getImageData(0, 0, c.width, c.height); }
function paintedBg(im, D) { const c = document.createElement('canvas'); c.width = 592 * D; c.height = 438 * D; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 8 * D, 8 * D, 576 * D, 422 * D); sharpen(c, 0.3); return c; }
