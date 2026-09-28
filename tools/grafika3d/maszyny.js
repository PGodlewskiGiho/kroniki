// ==================== MODELE 3D: MACHINY WOJENNE ================================================
// Balista, namiot medyka, wóz z amunicją, katapulta i strzelec na wieży. Stoją przodem do +x, podstawa na y = 0.
// Wymiary w skali jednostek (człowiek ≈ 2): machiny są mniej więcej wzrostu człowieka.
/* global THREE, mat, mesh, joint, sph, cap, cyl, cone, box, torus, lathe, bone, tube, sheet, decal, DK, LT, humanoid */

// Koło ze szprychami (oś wzdłuż z)
function wheel(parent, pos, r, wood, metal) {
  const w = joint(parent, pos); w.add(torus(r, r * 0.13, DK(wood, 0.25), 'wood', [0, 0, 0])); w.add(torus(r, r * 0.05, metal || '#6a6a70', 'metal', [0, 0, 0.02]));
  for (let i = 0; i < 6; i++) w.add(box(r * 1.9, r * 0.1, r * 0.1, wood, 'wood', [0, 0, 0], [0, 0, i * Math.PI / 6]));
  w.add(cyl(r * 0.22, r * 0.22, r * 0.35, metal || '#6a6a70', 'metal', [0, 0, 0], [Math.PI / 2, 0, 0])); return w;
}
function ballista(L, P = {}) {
  const root = new THREE.Group(), body = joint(root, [0, 0, 0]), w = L.wood || '#8a5a2a', m = L.metal || '#9aa0a8', A = P.atk, rec = A != null ? Math.sin(Math.min(1, A) * Math.PI) : 0;
  body.rotation.y = -0.35; body.scale.setScalar(1.12); // przód lekko do widza, żeby łuk nie był widziany na krawędź
  for (const z of [-0.3, 0.3]) { body.add(box(1.5, 0.1, 0.1, DK(w, 0.1), 'wood', [0, 0.32, z])); for (const x of [-0.5, 0.5]) wheel(body, [x, 0.25, z * 1.25], 0.25, w, m); }
  for (const x of [-0.6, 0, 0.6]) body.add(box(0.1, 0.08, 0.7, DK(w, 0.1), 'wood', [x, 0.36, 0]));
  for (const [x, z] of [[-0.15, -0.22], [-0.15, 0.22], [0.25, 0]]) body.add(tube([[x, 0.38, z], [0.05, 0.78, 0]], 0.045, 0.04, w, 'wood'));
  const top = joint(body, [0.05, 0.84, 0], 0.14);
  top.add(box(1.6, 0.1, 0.16, w, 'wood', [0, 0, 0])); top.add(box(1.6, 0.02, 0.05, DK(w, 0.4), 'wood', [0, 0.06, 0]));
  for (const x of [-0.4, 0.1]) top.add(box(0.06, 0.12, 0.18, m, 'metal', [x, 0, 0])); // okucia
  top.add(box(0.22, 0.26, 0.4, DK(w, 0.1), 'wood', [0.6, 0.03, 0])); for (const z of [-0.14, 0.14]) { top.add(cyl(0.06, 0.06, 0.36, '#c8b890', 'cloth', [0.6, 0.03, z])); top.add(cyl(0.075, 0.075, 0.04, m, 'metal', [0.6, 0.22, z])); } // głowica ze skręconymi linami
  const pull = 0.45 - rec * 0.3, sx = 0.05 - pull;
  for (const z of [-1, 1]) {
    const arm = [[0.6, 0.04, 0.16 * z], [0.5, 0.12, 0.55 * z], [0.28 + rec * 0.08, 0.2, 0.95 * z]];
    top.add(tube(arm, 0.07, 0.036, LT(w, 0.05), 'wood')); top.add(cyl(0.04, 0.04, 0.08, m, 'metal', arm[2]));
    top.add(tube([arm[2], [(arm[2][0] + sx) / 2, 0.11, 0.42 * z], [sx, 0.07, 0]], 0.012, 0.012, '#e8e0c8', 'cloth')); // cięciwa
  }
  top.add(box(0.14, 0.07, 0.12, m, 'metal', [sx, 0.07, 0])); // suwak cięciwy
  if (A == null || A < 0.45) { top.add(cyl(0.025, 0.025, 1.0, '#7a5030', 'wood', [sx + 0.5, 0.1, 0], [0, 0, Math.PI / 2])); top.add(cone(0.05, 0.16, m, 'metal', [sx + 1.05, 0.1, 0], [0, 0, -Math.PI / 2], 4)); for (const s of [-1, 1]) top.add(sheet([[0, 0], [0.12, 0], [0.02, 0.05 * s]], '#e8e0cc', 'cloth', [sx + 0.02, 0.1, 0])); }
  top.add(cyl(0.08, 0.08, 0.44, DK(w, 0.2), 'wood', [-0.72, 0, 0], [Math.PI / 2, 0, 0])); for (const z of [-0.24, 0.24]) top.add(box(0.04, 0.24, 0.04, m, 'metal', [-0.72, 0, z], [0, 0, 0.8])); // kołowrót
  return root;
}
function tent(L, P = {}) {
  const root = new THREE.Group(), c = L.cloth || '#e8e0cc', tr = L.trim || '#c83a2a', sway = Math.sin((P.t || 0) * 2) * 0.03, SZ = 0.85, FOLD = [8, 0.05, 1.6, 0];
  root.add(lathe([[0.95, 0], [0.8, 0.35], [0.45, 1.0], [0.08, 1.55], [0.001, 1.6]], c, 'cloth', [0, 0, 0], [1, 1, SZ], 2, FOLD));
  root.add(lathe([[0.95 * 1.03, 0.2], [0.8 * 1.03, 0.35], [0.77 * 1.03, 0.4]], tr, 'cloth', [0, 0, 0], [1, 1, SZ], 1, FOLD)); // pas
  root.add(lathe([[0.2, 1.3], [0.08 * 1.1, 1.56], [0.001, 1.62]], tr, 'cloth', [0, 0, 0], [1, 1, SZ])); // czubek
  // Na powierzchni stożka pod kątem a (od +x ku widzowi +z), wysokość y, promień r; nachylenie ściany tilt
  const onWall = (o, a, y, r, tilt) => { o.position.set(Math.cos(a) * r, y, Math.sin(a) * r * SZ); o.rotation.set(-tilt, Math.PI / 2 - a, 0, 'YXZ'); root.add(o); return o; };
  onWall(sheet([[-0.26, 0], [0, 0.8], [0.26, 0]], '#2a1e16', 'cloth'), 0.7, 0.01, 1.0, 0.44); // wejście
  onWall(sheet([[-0.26, 0], [-0.02, 0.78], [-0.36, 0.05]], DK(c, 0.08), 'cloth'), 0.7, 0.02, 1.04, 0.44); // odchylona poła
  onWall(decal(0.34, 0.34, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = tr; g.fillRect(w * 0.38, 5, w * 0.24, h - 10); g.fillRect(5, h * 0.38, w - 10, h * 0.24); }), 1.55, 0.8, 0.6, 0.49); // czerwony krzyż
  const pole = joint(root, [0, 1.55, 0]); pole.add(cyl(0.02, 0.02, 0.5, '#5a3a1a', 'wood', [0, 0.25, 0])); pole.add(sph(0.035, '#e0b24a', 'gold', [0, 0.52, 0]));
  pole.add(sheet([[0, 0], [0.34, -0.06 + sway], [0, -0.16]], tr, 'cloth', [0.01, 0.48, 0]));
  for (const a of [0.2, 2.4, 3.6, 5.2]) { const x0 = Math.cos(a) * 1.08, z0 = Math.sin(a) * SZ * 1.08; root.add(cyl(0.03, 0.02, 0.14, '#5a3a1a', 'wood', [x0, 0.05, z0])); } // śledzie
  return root;
}
function cart(L, P = {}) {
  const root = new THREE.Group(), w = L.wood || '#7a4a22', c = L.cloth || '#b8a070';
  root.add(box(1.4, 0.4, 0.8, w, 'wood', [0, 0.62, 0])); for (const y of [0.52, 0.66, 0.8]) root.add(box(1.42, 0.02, 0.82, DK(w, 0.35), 'wood', [0, y, 0])); // deski
  for (const x of [-0.7, 0.7]) root.add(box(0.06, 0.44, 0.84, DK(w, 0.2), 'wood', [x, 0.62, 0]));
  const cov = mesh(new THREE.CylinderGeometry(0.44, 0.44, 1.3, 20, 1, true, -Math.PI / 2, Math.PI), c, 'cloth', [-0.05, 0.82, 0], [0, 0, Math.PI / 2]); cov.material = cov.material.clone(); cov.material.side = THREE.DoubleSide; root.add(cov); // plandeka
  for (const x of [-0.6, -0.2, 0.2, 0.55]) root.add(torus(0.44, 0.015, DK(w, 0.3), 'wood', [x, 0.82, 0], [0, Math.PI / 2, 0], null, Math.PI));
  for (const z of [-0.47, 0.47]) for (const x of [-0.45, 0.45]) wheel(root, [x, 0.34, z], 0.32, w);
  root.add(tube([[0.7, 0.45, 0], [1.1, 0.3, 0], [1.5, 0.2, 0]], 0.03, 0.03, DK(w, 0.1), 'wood')); root.add(box(0.05, 0.05, 0.5, DK(w, 0.1), 'wood', [1.45, 0.2, 0])); // dyszel
  root.add(cyl(0.16, 0.16, 0.36, DK(w, 0.1), 'wood', [0.55, 0.98, 0.22])); root.add(torus(0.16, 0.015, '#5a5a60', 'metal', [0.55, 1.06, 0.22], [Math.PI / 2, 0, 0])); // beczka
  for (let i = 0; i < 7; i++) { const x = 0.5 + (i % 3) * 0.05, z = -0.25 + (i / 3 | 0) * 0.05; root.add(cyl(0.008, 0.008, 0.5, '#c8a878', 'wood', [x, 1.1, z], [0.1 * (i % 2 ? 1 : -1), 0, 0.1])); root.add(cone(0.02, 0.06, i % 2 ? '#e8e0cc' : '#b83a2a', 'cloth', [x, 1.35, z], null, 4)); } // pęk strzał
  return root;
}
function catapult(L, P = {}) {
  const root = new THREE.Group(), w = L.wood || '#7a4a22', m = '#6a6a70', A = P.atk, a = A != null ? Math.sin(Math.min(1, A) * Math.PI) : 0;
  for (const z of [-0.32, 0.32]) { root.add(box(1.6, 0.12, 0.1, DK(w, 0.1), 'wood', [0, 0.32, z])); for (const x of [-0.52, 0.52]) wheel(root, [x, 0.26, z * 1.3], 0.26, w, m); }
  for (const x of [-0.7, -0.1, 0.7]) root.add(box(0.1, 0.1, 0.74, DK(w, 0.1), 'wood', [x, 0.36, 0]));
  for (const z of [-0.3, 0.3]) { root.add(tube([[-0.05, 0.36, z], [0.32, 1.08, z * 0.75]], 0.05, 0.045, w, 'wood')); root.add(tube([[0.72, 0.36, z], [0.32, 1.08, z * 0.75]], 0.05, 0.045, w, 'wood')); root.add(box(0.1, 0.06, 0.06, m, 'metal', [0.32, 1.06, z * 0.75])); }
  root.add(box(0.12, 0.12, 0.5, DK(w, 0.2), 'wood', [0.32, 1.04, 0])); root.add(box(0.06, 0.14, 0.3, '#8a7050', 'leather', [0.25, 1.04, 0])); // poprzeczka oporowa z poduszką
  root.add(box(0.08, 0.08, 0.5, DK(w, 0.2), 'wood', [-0.72, 0.5, 0])); // oparcie ramienia z tyłu
  root.add(cyl(0.1, 0.1, 0.6, DK(w, 0.2), 'wood', [0.1, 0.5, 0], [Math.PI / 2, 0, 0])); for (const z of [-0.12, 0, 0.12]) root.add(torus(0.11, 0.035, '#b8a878', 'cloth', [0.1, 0.5, z])); // skręt liny
  const arm = joint(root, [0.1, 0.5, 0], 1.3 - a * 1.65); // ramię: w spoczynku leży do tyłu, przy rzucie uderza w poprzeczkę
  arm.add(box(0.09, 1.0, 0.09, LT(w, 0.1), 'wood', [0, 0.5, 0])); for (const y of [0.3, 0.7]) arm.add(box(0.11, 0.04, 0.11, m, 'metal', [0, y, 0]));
  arm.add(lathe([[0.001, -0.08], [0.15, -0.05], [0.19, 0.06], [0.17, 0.08]], DK(w, 0.2), 'wood', [0, 1.05, 0], null)); // łyżka
  if (A == null || A < 0.5) arm.add(sph(0.13, '#8a847a', 'stone', [0, 1.13, 0]));
  return root;
}
// Strzelec na ganku wieży strzelniczej (samą wieżę rysuje gra jako część muru)
function tower(L, P = {}) { return humanoid({ skin: '#d8a878', cloth: '#4a5a8a', helm: 'helm', weapon: 'bow', armor: true, metal: '#9aa0a8', size: 0.5 }, P); }
