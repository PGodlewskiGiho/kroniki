// ==================== MODELE 3D ARTEFAKTÓW (narzędzie, nie trafia do gry) ======================
// Każdy artefakt ma własną bryłę (ART3[id](A) -> THREE.Group), zbudowaną z brył z modele.js; kolory col/gem z danych gry.
// Wypalanie: tools/grafika3d/wypal-artefakty.js -> src/grafika/artefakty.webp + artefakty.json. Przedmiot leży w płaszczyźnie xy
// przodem do +z (kamera patrzy z przodu, lekko z prawej i z góry); rozmiar dowolny, render dopasowuje kadr do bryły.
/* global THREE, G3, mat, mesh, sph, cap, cyl, cone, box, rbox, torus, lathe, tube, sheet, slab, chunk, decal, DK, LT, rng */
const arGem = (r, col, pos, rot, sc = [1, 1.25, 1]) => mesh(new THREE.OctahedronGeometry(r, 0), col, 'gem', pos, rot, sc);
const arCab = (r, col, pos) => sph(r, col, 'gem', pos, [1, 1, 0.55], 18); // kaboszon: gładki, płaski kamień w oprawie
const arGrp = (...ms) => { const g = new THREE.Group(); for (const m of ms) if (m) g.add(m); return g; };
const arRot = (g, x = 0, y = 0, z = 0) => { g.rotation.set(x, y, z); return arGrp(g); };
// fala płótna: płaszczyzna z wygięciem (chorągiew, płaszcz)
function arCloth(w, h, col, kind, pos, wave = 0.12, n = 2, tatter = 0) {
  const geo = new THREE.PlaneGeometry(w, h, 24, 24), p = geo.attributes.position, R = rng(7);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), u = (x + w / 2) / w; p.setZ(i, Math.sin(u * Math.PI * n + y * 0.8) * wave * u); if (tatter && y < -h / 2 + 0.01 && R() < 0.5) p.setY(i, y + R() * tatter); }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat(col, kind).clone()); m.material.side = THREE.DoubleSide; if (pos) m.position.set(...pos); return m;
}
// --- broń ---
function arSword(A, o = {}) {
  const L = o.len || 3.2, W = o.w || 0.26, g = new THREE.Group(), bl = o.blade || A.col;
  const pts = o.curve ? [[-W, 0], [W, 0], [W * 1.25, L * 0.45], [W * 0.7, L * 0.78], [-W * 0.15, L * 1.02], [-W * 0.3, L * 0.6]] : [[-W, 0], [W, 0], [W * 0.82, L * 0.72], [W * 0.35, L * 0.9], [0, L * 1.04], [-W * 0.35, L * 0.9], [-W * 0.82, L * 0.72]];
  /* ostrze: jasna, cienka krawędź (szlif) pod grubszym środkiem z wyżłobieniem – ostre, połyskujące brzegi i spiczasty sztych */
  g.add(slab(pts, 0.012, LT(bl, 0.55), o.bladeKind || 'steel', [0, 0.25, 0], null, null, 0.1)); g.add(slab(pts.map(([x, y]) => [x * 0.62, y * 0.97]), 0.07, LT(bl, 0.15), o.bladeKind || 'steel', [0, 0.25, 0], null, null, 0.6));
  if (!o.curve) g.add(box(W * 0.18, L * 0.62, 0.085, DK(bl, 0.35), 'steel', [0, 0.25 + L * 0.34, 0]));
  const gw = o.guard || 1.1; g.add(o.wing ? arGrp(slab([[0, 0], [gw * 0.6, 0.3], [gw, 0.05], [gw * 0.7, -0.12]], 0.1, o.guardCol || '#c8a040', 'gold', [0, 0.18, 0]), slab([[0, 0], [-gw * 0.6, 0.3], [-gw, 0.05], [-gw * 0.7, -0.12]], 0.1, o.guardCol || '#c8a040', 'gold', [0, 0.18, 0]))
    : rbox(gw, 0.16, 0.2, 0.05, o.guardCol || '#8a8e98', 'iron', [0, 0.2, 0]));
  g.add(cyl(0.09, 0.08, 0.75, o.grip || '#5a3a20', 'leather', [0, -0.25, 0])); for (let i = 0; i < 4; i++) g.add(torus(0.095, 0.022, DK(o.grip || '#5a3a20', 0.3), 'leather', [0, -0.5 + i * 0.17, 0], [Math.PI / 2, 0, 0]));
  g.add(o.pommelGem ? arGem(0.16, A.gem, [0, -0.72, 0]) : sph(0.15, o.guardCol || '#8a8e98', 'iron', [0, -0.72, 0]));
  if (o.gemGuard) g.add(arCab(0.12, A.gem, [0, 0.2, 0.11]));
  return arRot(g, 0, 0, -Math.PI / 4);
}
function arDagger(A) {
  const g = new THREE.Group(); g.add(slab([[-0.32, 0], [0.32, 0], [0.22, 1.0], [0, 1.6], [-0.22, 1.0]], 0.07, A.col, 'gold', [0, 0.2, 0])); g.add(box(0.06, 1.2, 0.09, DK(A.col, 0.35), 'gold', [0, 0.8, 0]));
  g.add(slab([[-0.6, 0.1], [0, -0.02], [0.6, 0.1], [0.5, -0.12], [-0.5, -0.12]], 0.12, DK(A.col, 0.15), 'gold', [0, 0.2, 0])); g.add(cyl(0.09, 0.08, 0.55, A.gem, 'leather', [0, -0.1, 0])); g.add(sph(0.13, A.col, 'gold', [0, -0.42, 0]));
  return arRot(g, 0, 0, -Math.PI / 4);
}
function arAxe(A) {
  const g = new THREE.Group(); g.add(cyl(0.1, 0.08, 3.4, A.gem, 'wood', [0, 0, 0])); g.add(cyl(0.12, 0.12, 0.7, '#3a2a1a', 'leather', [0, -1.2, 0]));
  const blade = [[0, 0.35], [0.5, 0.5], [1.2, 1.0], [1.35, 0], [1.2, -1.0], [0.5, -0.5], [0, -0.35]]; g.add(slab(blade, 0.1, A.col, 'steel', [0.08, 1.1, 0])); g.add(slab(blade.map(([x, y]) => [x * 0.18, y * 0.82]), 0.14, DK(A.col, 0.3), 'iron', [0.08, 1.1, 0]));
  g.add(cone(0.12, 0.5, A.col, 'steel', [-0.3, 1.1, 0], [0, 0, Math.PI / 2], 4)); g.add(cone(0.14, 0.35, A.col, 'steel', [0, 1.85, 0]));
  for (let i = 0; i < 3; i++) g.add(tube([[0, -1.55, 0], [0.05 - i * 0.05, -1.9, 0.05], [-0.05 + i * 0.08, -2.3, 0]], 0.04, 0.015, '#3a2a1a', 'hair')); // końskie włosie u dołu drzewca
  return arRot(g, 0, 0, -Math.PI / 5);
}
function arHammer(A, o = {}) {
  const g = new THREE.Group(); g.add(cyl(0.11, 0.1, 3.0, o.haft || '#5a3a20', o.haft ? 'iron' : 'wood', [0, 0, 0])); g.add(cyl(0.13, 0.13, 0.8, '#2a1a10', 'leather', [0, -1.0, 0])); g.add(sph(0.16, A.col, 'steel', [0, -1.5, 0]));
  if (o.titan) { g.add(cyl(0.55, 0.55, 1.9, A.col, 'steel', [0, 1.45, 0], [0, 0, Math.PI / 2], null, 8)); for (const s of [-1, 1]) { g.add(cyl(0.62, 0.62, 0.12, DK(A.col, 0.3), 'iron', [s * 0.85, 1.45, 0], [0, 0, Math.PI / 2], null, 8)); g.add(cyl(0.22, 0.22, 0.04, A.gem, 'glow', [s * 0.97, 1.45, 0], [0, 0, Math.PI / 2])); }
    for (let i = -1; i <= 1; i++) g.add(box(0.06, 0.04, 0.9, A.gem, 'glow', [i * 0.4, 1.45, 0.5])); }
  else { g.add(rbox(1.6, 0.8, 0.8, 0.12, A.col, 'steel', [0, 1.4, 0])); for (const s of [-1, 1]) g.add(rbox(0.12, 0.9, 0.9, 0.04, '#c8a040', 'gold', [s * 0.55, 1.4, 0]));
    g.add(slab([[0.1, 0.35], [-0.12, 0.02], [0.06, 0.02], [-0.1, -0.35], [0.16, -0.04], [-0.02, -0.04]], 0.04, A.gem, 'glow', [0, 1.4, 0.42])); }
  return arRot(g, 0, 0, -Math.PI / 5);
}
function arBow(A) { // łuk naciągnięty do strzału: majdan z przodu (+x), ramiona wygięte do tyłu, cięciwa między końcami, strzała grotem do przodu
  const g = new THREE.Group(), lim = s => [[0.4, s * 0.2, 0], [0.32, s * 1.0, 0], [0.0, s * 1.75, 0], [-0.45, s * 2.2, 0]];
  for (const s of [-1, 1]) { g.add(tube(lim(s), 0.1, 0.05, A.col, 'wood')); g.add(tube([[-0.45, s * 2.2, 0], [-0.4, s * 2.4, 0]], 0.05, 0.03, A.gem, 'bone')); }
  g.add(cyl(0.12, 0.12, 0.5, '#3a2414', 'leather', [0.4, 0, 0])); for (const s of [-1, 1]) g.add(tube([[-0.42, s * 2.2, 0], [-0.9, 0, 0]], 0.012, 0.012, A.gem, 'cloth'));
  const ar = new THREE.Group(); ar.add(cyl(0.035, 0.035, 3.2, '#8a6a40', 'wood', [0, 0, 0])); ar.add(cone(0.09, 0.3, '#b8c0cc', 'steel', [0, 1.7, 0], null, 4)); for (const s of [-1, 1]) ar.add(slab([[0, 0], [s * 0.18, -0.1], [s * 0.18, -0.5], [0, -0.4]], 0.01, '#e8e0c8', 'feather', [0, -1.15, 0]));
  ar.rotation.z = -Math.PI / 2; ar.position.set(0.7, 0, 0.05); g.add(ar); return arRot(g, 0, 0, Math.PI / 5);
}
function arStaff(A) {
  const g = new THREE.Group(), R = rng(3), pts = []; for (let i = 0; i <= 8; i++) pts.push([Math.sin(i * 1.3) * 0.06, -2.2 + i * 0.5, Math.cos(i * 1.3) * 0.06]);
  g.add(tube(pts, 0.1, 0.12, A.col, 'wood')); g.add(tube([[0, -2.2, 0], [0.03, -2.4, 0]], 0.1, 0.06, '#c8a040', 'gold'));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + R() * 0.3; g.add(tube([[Math.cos(a) * 0.1, 1.75, Math.sin(a) * 0.1], [Math.cos(a) * 0.38, 2.15, Math.sin(a) * 0.38], [Math.cos(a) * 0.22, 2.6, Math.sin(a) * 0.22]], 0.06, 0.02, A.col, 'wood')); }
  g.add(sph(0.36, A.gem, 'glow', [0, 2.3, 0])); g.add(sph(0.52, A.gem, 'gem', [0, 2.3, 0])); g.children[g.children.length - 1].material = g.children[g.children.length - 1].material.clone(); Object.assign(g.children[g.children.length - 1].material, { transparent: true, opacity: 0.3 });
  for (let i = 0; i < 3; i++) g.add(torus(0.13, 0.025, '#c8a040', 'gold', [0, 1.2 - i * 0.12, 0], [Math.PI / 2, 0, 0]));
  return arRot(g, 0, 0, -Math.PI / 7);
}
// --- tarcze ---
function arShield(A, o = {}) {
  const g = new THREE.Group(), sh = o.shape || 'heater';
  const outline = sh === 'kite' ? [[-1, 1.2], [1, 1.2], [1.05, 0.2], [0, -1.9], [-1.05, 0.2]] : sh === 'heater' ? [[-1.1, 1.1], [1.1, 1.1], [1.1, 0], [0.6, -1.0], [0, -1.4], [-0.6, -1.0], [-1.1, 0]] : null;
  if (sh === 'round') { g.add(cyl(1.3, 1.3, 0.16, A.col, o.kind || 'wood', [0, 0, 0], [Math.PI / 2, 0, 0], null, 40)); g.add(torus(1.3, 0.08, o.rim || '#5a5a62', 'iron', [0, 0, 0]));
    if (o.planks) for (let i = -2; i <= 2; i++) g.add(box(0.02, 2.4 * Math.sqrt(1 - (i * 0.5 / 1.3) ** 2), 0.02, DK(A.col, 0.4), 'wood', [i * 0.5, 0, 0.09]));
    g.add(sph(0.38, o.boss || '#7a7a82', 'iron', [0, 0, 0.05], [1, 1, 0.6])); }
  else if (sh === 'stone') { g.add(chunk(1.2, 1.4, 0.2, A.col, 'stone', [0, 0, 0], null, 5, 18)); g.add(slab([[-0.1, 0.7], [0.1, 0.7], [0.1, -0.7], [-0.1, -0.7]], 0.02, A.gem, 'glow', [0, 0, 0.2])); g.add(slab([[-0.5, 0.15], [0.5, 0.15], [0.5, -0.05], [-0.5, -0.05]], 0.02, A.gem, 'glow', [0, 0.2, 0.2])); }
  else { g.add(slab(outline, 0.14, A.col, o.kind || 'metal', [0, 0, 0], null, null, 0.5)); g.add(slab(outline.map(([x, y]) => [x * 1.06, y * 1.04 - 0.01]), 0.1, o.rim || '#c8a040', 'gold', [0, 0, -0.04])); }
  if (o.decal) g.add(decal(o.dw || 1.3, o.dh || 1.3, o.decal, [0, o.dy || 0.05, sh === 'round' ? 0.1 : 0.15]));
  if (o.sun) { g.add(torus(0.75, 0.07, A.gem, 'gold', [0, 0, 0.1])); g.add(cyl(0.6, 0.6, 0.05, '#0a0a12', 'metal', [0, 0, 0.1], [Math.PI / 2, 0, 0], null, 32)); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.add(cone(0.08, 0.35, A.gem, 'gold', [Math.cos(a) * 0.98, Math.sin(a) * 0.98, 0.1], [0, 0, a - Math.PI / 2], 4)); } }
  if (o.gem) g.add(arGem(0.18, A.gem, [0, o.gemY || 0.7, 0.18]));
  if (o.studs) for (const [x, y] of [[-0.9, 0.9], [0.9, 0.9], [-0.9, -0.1], [0.9, -0.1]]) g.add(sph(0.07, '#c8a040', 'gold', [x, y, 0.1]));
  return arRot(g, 0, -0.2, 0.08);
}
const arLion = (col, bg) => (c, w, h) => { if (bg) { c.fillStyle = bg; c.fillRect(0, 0, w, h); } c.fillStyle = col; c.beginPath(); c.arc(w * 0.42, h * 0.32, w * 0.16, 0, 7); c.fill();
  c.beginPath(); c.moveTo(w * 0.3, h * 0.42); c.quadraticCurveTo(w * 0.62, h * 0.38, w * 0.72, h * 0.62); c.lineTo(w * 0.78, h * 0.9); c.lineTo(w * 0.64, h * 0.9); c.lineTo(w * 0.58, h * 0.7); c.lineTo(w * 0.42, h * 0.72); c.lineTo(w * 0.36, h * 0.9); c.lineTo(w * 0.24, h * 0.9); c.lineTo(w * 0.3, h * 0.6); c.closePath(); c.fill();
  c.lineWidth = w * 0.05; c.strokeStyle = col; c.beginPath(); c.moveTo(w * 0.74, h * 0.62); c.quadraticCurveTo(w * 0.92, h * 0.5, w * 0.84, h * 0.3); c.stroke(); for (const x of [0.3, 0.52]) { c.beginPath(); c.moveTo(w * x, h * 0.45); c.lineTo(w * (x - 0.12), h * 0.3); c.stroke(); } };
const arMount = col => (c, w, h) => { c.fillStyle = col; c.beginPath(); c.moveTo(w * 0.05, h * 0.8); c.lineTo(w * 0.35, h * 0.25); c.lineTo(w * 0.5, h * 0.5); c.lineTo(w * 0.65, h * 0.15); c.lineTo(w * 0.95, h * 0.8); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(w * 0.57, h * 0.3); c.lineTo(w * 0.65, h * 0.15); c.lineTo(w * 0.73, h * 0.3); c.closePath(); c.fill(); };
// --- głowa ---
function arHelm(A, o = {}) {
  const g = new THREE.Group(), c = A.col;
  if (o.type === 'great') { g.add(cyl(0.95, 0.9, 1.5, c, 'steel', [0, 0.2, 0], null, null, 28)); g.add(cyl(0.95, 0.95, 0.08, c, 'steel', [0, 0.97, 0], null, null, 28)); g.add(box(1.2, 0.09, 0.3, '#0a0a10', 'iron', [0, 0.45, 0.82]));
    g.add(box(0.1, 1.4, 0.12, '#c8a040', 'gold', [0, 0.25, 0.95])); g.add(box(1.0, 0.1, 0.12, '#c8a040', 'gold', [0, 0.65, 0.92])); for (let i = 0; i < 9; i++) g.add(sph(0.025, '#0a0a10', 'iron', [0.2 + (i % 3) * 0.12, -0.1 - (i / 3 | 0) * 0.12, 0.92]));
    for (let i = 0; i < 6; i++) g.add(tube([[0, 1.0, 0], [-0.1 - i * 0.05, 1.6, -0.2], [-0.5 - i * 0.1, 1.9 - i * 0.05, -0.5]], 0.1, 0.03, A.gem, 'feather')); }
  else if (o.type === 'bone') { g.add(lathe([[0.9, -0.6], [1.0, 0], [0.95, 0.5], [0.7, 0.95], [0.3, 1.15], [0, 1.2]], c, 'bone')); g.add(box(1.3, 0.16, 0.2, '#100c0a', 'skin', [0, 0.05, 0.85]));
    for (const s of [-1, 1]) g.add(tube([[s * 0.85, 0.5, 0], [s * 1.5, 0.8, 0.1], [s * 1.8, 1.5, 0.2], [s * 1.6, 2.0, 0.1]], 0.2, 0.03, '#d8ccb0', 'horn'));
    for (let i = 0; i < 5; i++) g.add(cone(0.1, 0.4, c, 'bone', [0, 0.6 + i * 0.12, -0.6 + i * 0.3], [-0.5 + i * 0.25, 0, 0], 6)); g.add(arGem(0.15, A.gem, [0, 0.7, 0.92])); }
  else if (o.type === 'titan') { g.add(lathe([[0.95, -0.5], [1.0, 0.1], [0.9, 0.6], [0.55, 1.0], [0, 1.12]], c, 'steel')); g.add(slab([[-1.0, 0.75], [-0.6, 1.35], [0.2, 1.5], [0.95, 1.05], [0.6, 0.95], [0, 1.15], [-0.6, 0.85]], 0.12, '#c8a040', 'gold', [0, 0, 0], [0, Math.PI / 2, 0]));
    for (const s of [-1, 1]) g.add(slab([[0, 0], [0.9, 0.5], [1.3, 1.2], [0.8, 0.9], [0.4, 0.6]], 0.05, '#e8ecf0', 'feather', [s * 0.9, 0.4, 0], [0, s < 0 ? Math.PI : 0, 0]));
    g.add(box(0.9, 0.12, 0.2, '#0a0a10', 'iron', [0, 0.25, 0.9])); g.add(arGem(0.17, A.gem, [0, 0.62, 0.9])); }
  else { g.add(lathe([[0.95, -0.4], [0.98, 0.1], [0.85, 0.6], [0.5, 1.0], [0.1, 1.2], [0, 1.22]], c, 'iron')); g.add(torus(0.97, 0.07, DK(c, 0.2), 'iron', [0, -0.35, 0], [Math.PI / 2, 0, 0]));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; g.add(box(0.1, 1.3, 0.06, DK(c, 0.25), 'iron', [Math.sin(a) * 0.82, 0.35, Math.cos(a) * 0.82], [-0.5 * Math.cos(a), a, 0.5 * Math.sin(a)])); }
    g.add(box(0.16, 0.9, 0.1, c, 'iron', [0, -0.35, 1.0])); g.add(sph(0.08, A.gem, 'iron', [0, 1.2, 0])); }
  return arRot(g, 0.15, -0.35, 0);
}
function arCrown(A, o = {}) {
  const g = new THREE.Group(), c = A.col, kind = o.kind || 'gold';
  if (o.type === 'diadem') { g.add(torus(1.0, 0.06, c, kind, [0, 0, 0], [Math.PI / 2, 0, 0])); g.add(slab([[-0.6, 0], [0, 0.55], [0.6, 0], [0.3, -0.05], [0, 0.25], [-0.3, -0.05]], 0.06, c, kind, [0, 0.02, 1.0]));
    g.add(arGem(0.17, A.gem, [0, 0.3, 1.06])); for (const s of [-1, 1]) g.add(arCab(0.08, A.gem, [s * 0.55, 0.05, 0.85])); return arRot(g, 0.35, 0, 0); }
  if (o.type === 'bone') { g.add(torus(1.0, 0.13, c, 'bone', [0, 0, 0], [Math.PI / 2, 0, 0])); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, h = i % 2 ? 0.55 : 0.95; g.add(cone(0.11, h, c, 'bone', [Math.sin(a) * 1.0, h / 2 + 0.05, Math.cos(a) * 1.0], [Math.cos(a) * 0.15, 0, -Math.sin(a) * 0.15], 6)); }
    g.add(arGem(0.16, A.gem, [0, 0.2, 1.1])); if (o.skull) { const s = new THREE.Group(); s.add(sph(0.36, '#e8e0c8', 'bone', [0, 0.35, 1.05], [1, 1, 0.8])); s.add(rbox(0.36, 0.2, 0.3, 0.06, '#e8e0c8', 'bone', [0, 0.1, 1.08])); for (const x of [-0.13, 0.13]) s.add(sph(0.08, A.gem, 'glow', [x, 0.33, 1.3])); g.add(s); }
    return arRot(g, 0.3, 0, 0); }
  g.add(cyl(1.0, 1.0, 0.45, c, kind, [0, 0, 0], null, null, 32)); g.add(torus(1.0, 0.07, DK(c, 0.2), kind, [0, -0.22, 0], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.add(cone(0.24, i % 2 ? 0.55 : 0.9, c, kind, [Math.sin(a) * 0.98, (i % 2 ? 0.5 : 0.65), Math.cos(a) * 0.98], null, 4)); if (!(i % 2)) g.add(sph(0.09, c, kind, [Math.sin(a) * 0.98, 1.12, Math.cos(a) * 0.98])); }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.add(arCab(0.1, i % 2 ? A.gem : '#3a80e0', [Math.sin(a) * 1.02, 0, Math.cos(a) * 1.02])); }
  g.add(cyl(0.95, 0.9, 0.15, '#7a1a1a', 'cloth', [0, 0.32, 0], null, null, 32)); return arRot(g, 0.3, 0, 0);
}
function arHood(A) {
  const g = new THREE.Group(); g.add(lathe([[0.2, 1.6], [0.6, 1.4], [0.95, 0.9], [1.05, 0.2], [1.2, -0.4], [1.6, -0.9]], A.col, 'cloth', [0, 0, 0], null, 1, [11, 0.06]));
  g.add(sph(0.82, '#0a0806', 'cloth', [0, 0.5, 0.35], [0.8, 1, 0.6])); g.add(cyl(0.04, 0.04, 1.2, A.gem, 'leather', [0.3, -0.6, 1.0], [0, 0, 0.1])); g.add(cyl(0.04, 0.04, 1.0, A.gem, 'leather', [-0.3, -0.6, 1.0], [0, 0, -0.15]));
  g.add(torus(0.18, 0.04, '#5a3a1a', 'wood', [0, -1.2, 1.0])); return arRot(g, 0.1, -0.3, 0);
}
// --- szyja ---
function arChain(g, col, y0 = 0, r = 0.85, kind = 'gold', bead = false) { for (let i = 0; i <= 22; i++) { const t = i / 22, a = Math.PI * (0.95 + t * 1.1), x = Math.cos(a) * r, y = y0 + r * 1.25 + Math.sin(a) * r * 1.25; if (Math.abs(x) < 0.12 && t > 0.4 && t < 0.6) continue; g.add(bead ? sph(0.06, col, kind, [x, y, 0]) : torus(0.075, 0.022, col, kind, [x, y, 0], [0, i % 2 ? Math.PI / 2 : 0, a + Math.PI / 2])); } }
function arAmulet(A, o = {}) {
  const g = new THREE.Group(); arChain(g, o.chain || '#c8a040', o.type === 'phoenix' ? 0.1 : -0.05, 0.85, o.chainKind || 'gold');
  if (o.type === 'phoenix') { g.add(arGem(0.3, A.gem, [0, -0.3, 0.1])); for (const s of [-1, 1]) g.add(slab([[0, 0], [s * 0.5, 0.35], [s * 1.0, 0.55], [s * 0.85, 0.1], [s * 1.0, -0.1], [s * 0.6, -0.15], [s * 0.7, -0.4], [s * 0.2, -0.2]], 0.06, A.col, 'gold', [0, -0.25, 0]));
    g.add(slab([[-0.15, 0], [0.15, 0], [0.3, -0.6], [0, -0.45], [-0.3, -0.6]], 0.06, A.col, 'gold', [0, -0.5, 0])); g.add(sph(0.14, A.col, 'gold', [0, 0.05, 0.05])); g.add(cone(0.06, 0.15, '#c87a1a', 'gold', [0, 0.05, 0.2], [Math.PI / 2, 0, 0])); }
  else if (o.type === 'raven') { g.add(cyl(0.55, 0.55, 0.1, A.col, 'iron', [0, -0.35, 0], [Math.PI / 2, 0, 0], null, 6)); g.add(torus(0.55, 0.05, '#8a8e98', 'steel', [0, -0.35, 0], null, null)); g.add(sph(0.2, A.gem, 'gem', [0, -0.35, 0.06], [1.5, 1, 0.6]));
    g.add(sph(0.08, '#0a0a0a', 'gem', [0, -0.35, 0.15])); for (const s of [-1, 1]) g.add(slab([[0, 0], [s * 0.45, 0.25], [s * 0.6, 0.05]], 0.04, '#1a1a22', 'feather', [s * 0.35, -0.2, 0.06])); }
  else { g.add(rbox(0.5, 0.55, 0.14, 0.06, A.col, 'gold', [0, -0.35, 0])); g.add(sph(0.3, A.gem, 'gem', [0, -0.42, 0.06], [0.9, 1.25, 0.6])); g.children[g.children.length - 1].material = g.children[g.children.length - 1].material.clone(); Object.assign(g.children[g.children.length - 1].material, { transparent: true, opacity: 0.85 }); }
  return arRot(g, 0.1, -0.2, 0);
}
function arFang(A, o = {}) {
  const g = new THREE.Group(); arChain(g, A.gem, o.type === 'vamp' ? 0.4 : 0.15, 0.85, 'leather', true);
  if (o.type === 'vamp') { g.add(tube([[0, 0.2, 0], [0.05, -0.5, 0.05], [-0.05, -1.3, 0]], 0.2, 0.02, A.col, 'bone')); g.add(cyl(0.24, 0.22, 0.25, '#c8ccd4', 'steel', [0, 0.25, 0])); g.add(sph(0.11, A.gem, 'gem', [0.02, -1.4, 0.04], [1, 1.4, 1])); }
  else for (const [x, a] of [[-0.45, 0.4], [0, 0], [0.45, -0.4]]) { g.add(tube([[x, 0.1, 0], [x * 1.1, -0.4, 0.1], [x * 1.4 + a * 0.3, -0.9, 0.05]], 0.13, 0.02, A.col, 'bone')); g.add(torus(0.12, 0.03, '#5a3a1a', 'leather', [x, 0.1, 0], [Math.PI / 2, 0, 0])); }
  return arRot(g, 0.1, -0.2, 0);
}
// --- pierścienie ---
function arRing(A, o = {}) {
  const g = new THREE.Group(), kind = o.kind || 'gold';
  if (o.twist) for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 32; i++) { const a = i / 32 * Math.PI * 2, r = 1 + 0.08 * Math.sin(a * 6 + k * Math.PI); pts.push([Math.sin(a) * r, Math.cos(a) * r, Math.cos(a * 6 + k * Math.PI) * 0.1]); } g.add(tube(pts, 0.1, 0.1, k ? A.col : '#c8a040', kind)); }
  else g.add(torus(1.0, o.thick || 0.14, A.col, kind, [0, 0, 0], null, [1, 1, o.wide || 1.4]));
  if (o.signet) { g.add(rbox(0.9, 0.2, 0.75, 0.08, A.col, kind, [0, 1.12, 0])); g.add(box(0.7, 0.04, 0.55, A.gem, 'stone', [0, 1.23, 0])); g.add(slab([[-0.15, 0], [0, 0.25], [0.15, 0], [0, -0.25]], 0.02, '#c8a040', 'gold', [0, 1.26, 0], [-Math.PI / 2, 0, 0])); }
  else { const prong = o.prongs || 4; g.add(cyl(0.32, 0.22, 0.22, A.col, kind, [0, 1.12, 0])); for (let i = 0; i < prong; i++) { const a = i * Math.PI * 2 / prong; g.add(cyl(0.035, 0.035, 0.3, A.col, kind, [Math.sin(a) * 0.3, 1.32, Math.cos(a) * 0.3], [Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4])); }
    g.add(arGem(o.gemR || 0.32, A.gem, [0, 1.42, 0], null, [1, 0.8, 1])); if (o.side) for (const s of [-1, 1]) g.add(arCab(0.1, o.side, [s * 0.4, 1.0, 0.15])); }
  if (o.rune) for (let i = 0; i < 6; i++) { const a = Math.PI * (0.65 + i * 0.12); g.add(box(0.05, 0.14, 0.05, o.rune, 'glow', [Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.18], [0, 0, a])); }
  return arRot(g, -0.5, 0.5, 0.15);
}
// --- płaszcze, zbroje, szaty ---
function arCloak(A, o = {}) {
  const g = new THREE.Group(), kind = o.kind || 'cloth', geo = new THREE.LatheGeometry([[0.45, 1.3], [0.7, 1.1], [1.0, 0.4], [1.3, -0.8], [1.55, -1.9]].map(([r, y]) => new THREE.Vector2(r, y)), 48, -Math.PI * 0.85, Math.PI * 1.7), p = geo.attributes.position, R = rng(5);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), f = 1 + 0.07 * Math.sin(a * 9) * Math.max(0, (1.3 - y) / 3.2); p.setX(i, x * f); p.setZ(i, z * f); if (o.tatter && y < -1.85) p.setY(i, y + R() * 0.45); }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat(A.col, kind).clone()); m.material.side = THREE.DoubleSide; if (o.opacity) { m.material.transparent = true; m.material.opacity = o.opacity; } m.rotation.y = Math.PI; g.add(m);
  const inner = new THREE.Mesh(geo, mat(o.lining || DK(A.col, 0.45), 'cloth').clone()); inner.material.side = THREE.BackSide; inner.scale.setScalar(0.985); inner.rotation.y = Math.PI; g.add(inner);
  if (o.fur) g.add(torus(0.62, 0.2, o.fur, 'fur', [0, 1.15, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8]));
  if (o.hood) g.add(lathe([[0.15, 2.1], [0.5, 1.95], [0.65, 1.55], [0.55, 1.25]], A.col, kind, [0, 0, -0.25], [1, 1, 0.9]));
  if (o.lion) { g.add(sph(0.5, A.col, 'fur', [0, 1.6, -0.1], [1, 0.85, 1])); g.add(torus(0.5, 0.22, DK(A.col, 0.25), 'fur', [0, 1.55, -0.1], [Math.PI / 2.4, 0, 0])); for (const s of [-1, 1]) g.add(sph(0.1, '#1a1008', 'gem', [s * 0.18, 1.7, 0.35])); g.add(cone(0.12, 0.3, '#2a1a10', 'skin', [0, 1.5, 0.45], [Math.PI / 2, 0, 0])); }
  g.add(arCab(0.16, o.clasp || A.gem, [0, 1.1, 0.7])); g.add(torus(0.2, 0.04, '#c8a040', 'gold', [0, 1.1, 0.68]));
  if (o.stars) for (let i = 0; i < 9; i++) { const a = -0.7 + R() * 1.4, y = -1.6 + R() * 2.4, r = 1.0 + (1.3 - y) * 0.2; g.add(sph(0.05, o.stars, 'glow', [Math.sin(a) * r, y, Math.cos(a) * r])); }
  return arRot(g, 0.12, 0.3, 0);
}
function arArmor(A, o = {}) {
  const g = new THREE.Group(), c = A.col, kind = o.kind || 'metal';
  g.add(lathe([[0.85, -1.3], [0.9, -0.9], [0.8, -0.3], [1.05, 0.4], [1.15, 0.9], [0.95, 1.25], [0.45, 1.4], [0.42, 1.55]], c, kind, [0, 0, 0], [1, 1, 0.62], o.rep || 1));
  if (o.skirt) for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.33; g.add(rbox(0.4, 0.75, 0.08, 0.03, o.skirt, o.skirtKind || 'leather', [Math.sin(a) * 0.86, -1.6, Math.cos(a) * 0.55], [0.1, a, 0])); }
  const pad = o.pad || c; for (const s of [-1, 1]) { g.add(sph(0.55, pad, o.padKind || kind, [s * 1.12, 1.1, 0], [1, 0.75, 0.9])); if (o.plates) for (let k = 0; k < 2; k++) g.add(sph(0.5 - k * 0.04, pad, o.padKind || kind, [s * 1.22, 0.85 - k * 0.22, 0], [1, 0.45, 0.85])); }
  if (o.belt) { g.add(cyl(0.9, 0.9, 0.18, o.belt, 'leather', [0, -0.95, 0], null, [1, 1, 0.64], 28)); g.add(rbox(0.3, 0.26, 0.1, 0.04, '#c8a040', 'gold', [0, -0.95, 0.6])); }
  if (o.laces) for (let i = 0; i < 5; i++) g.add(box(0.36, 0.035, 0.03, o.laces, 'leather', [0, 0.7 - i * 0.28, 0.66], [0, 0, i % 2 ? 0.4 : -0.4]));
  if (o.ridge) g.add(box(0.1, 2.1, 0.08, o.ridge, kind, [0, 0.1, 0.66]));
  if (o.glowLines) for (const s of [-1, 1]) g.add(tube([[s * 0.15, 1.1, 0.62], [s * 0.55, 0.4, 0.64], [s * 0.25, -0.5, 0.56]], 0.04, 0.04, o.glowLines, 'glow'));
  if (o.wings) for (const s of [-1, 1]) g.add(slab([[0, 0], [s * 0.6, 0.6], [s * 1.2, 0.5], [s * 0.9, 0.2], [s * 1.1, -0.1], [s * 0.5, -0.05]], 0.06, o.wings, 'gold', [s * 1.1, 1.3, -0.2]));
  if (o.gem) g.add(arGem(0.18, A.gem, [0, 0.55, 0.68]));
  if (o.collar) g.add(torus(0.5, 0.1, o.collar, o.collarKind || 'mail', [0, 1.45, 0], [Math.PI / 2, 0, 0], [1, 0.7, 1]));
  return arRot(g, 0.1, 0.3, 0);
}
function arRobe(A, o = {}) {
  const g = new THREE.Group(); g.add(lathe([[0.4, 1.6], [0.75, 1.35], [0.85, 0.6], [0.95, -0.4], [1.35, -1.6], [1.4, -1.75]], A.col, 'cloth', [0, 0, 0], [1, 1, 0.65], 1, [12, 0.05]));
  for (const s of [-1, 1]) g.add(lathe([[0.3, 0.3], [0.45, -0.3], [0.62, -0.9]], A.col, 'cloth', [s * 1.1, 0.95, 0], null, 1, [8, 0.06])).rotation;
  g.add(box(0.28, 3.2, 0.04, '#c8a040', 'gold', [0, 0, 0.66], [-0.12, 0, 0])); g.add(torus(0.55, 0.12, o.collar || '#c8a040', o.collar ? 'cloth' : 'gold', [0, 1.5, 0], [Math.PI / 2, 0, 0], [1, 0.7, 1]));
  const R = rng(9); for (let i = 0; i < (o.many ? 16 : 10); i++) { const a = -1.1 + R() * 2.2, y = -1.5 + R() * 2.8, r = (0.85 + Math.max(0, -y) * 0.3) * 1.01; g.add(arGem(0.06 + R() * 0.04, A.gem, [Math.sin(a) * r, y, Math.cos(a) * r * 0.65])); }
  g.add(cyl(0.8, 0.82, 0.16, '#5a3a20', 'leather', [0, -0.1, 0], null, [1, 1, 0.66], 24)); g.add(arGem(0.17, A.gem, [0, -0.1, 0.6]));
  if (o.halo) g.add(torus(1.0, 0.03, A.gem, 'glow', [0, 2.0, -0.2], [Math.PI / 2.4, 0, 0]));
  return arRot(g, 0.1, 0.3, 0);
}
// --- stopy ---
function arBoots(A, o = {}) {
  const g = new THREE.Group(), kind = o.kind || 'leather';
  for (const [s, dx, dz] of [[1, 0.55, 0.3], [-1, -0.55, -0.3]]) { const b = new THREE.Group(), H = o.tall ? 1.9 : 1.4;
    b.add(cyl(0.4, 0.46, H, A.col, kind, [0, H / 2 + 0.15, 0], null, null, 20)); b.add(rbox(0.85, 0.42, 1.3, 0.18, A.col, kind, [0, 0.28, 0.35])); b.add(rbox(0.9, 0.12, 1.36, 0.05, '#2a1a10', 'leather', [0, 0.06, 0.35]));
    b.add(torus(0.47, 0.07, o.cuff || A.gem, o.cuffKind || 'leather', [0, H + 0.1, 0], [Math.PI / 2, 0, 0]));
    if (o.plate) { for (let k = 0; k < 3; k++) b.add(cyl(0.47, 0.5, 0.35, A.col, 'steel', [0, 0.45 + k * 0.4, 0.02], null, null, 20)); b.add(sph(0.22, A.col, 'steel', [0, 0.9, 0.42])); b.add(arGem(0.1, A.gem, [0, 0.9, 0.62])); }
    if (o.buckles) for (let k = 0; k < 3; k++) { b.add(box(0.88, 0.07, 0.88, '#3a2414', 'leather', [0, 0.6 + k * 0.45, 0])); b.add(rbox(0.16, 0.14, 0.05, 0.02, A.gem, 'gold', [0, 0.6 + k * 0.45, 0.46])); }
    if (o.wings) b.add(slab([[0, 0], [-0.35, 0.3], [-0.8, 0.45], [-0.6, 0.18], [-0.85, 0.1], [-0.4, -0.05]], 0.03, o.wings, 'feather', [-0.42, H * 0.75, 0], [0, -0.3, 0]));
    if (o.bolt) b.add(slab([[0.1, 0.3], [-0.1, 0.0], [0.05, 0.0], [-0.1, -0.3], [0.15, 0.05], [0, 0.05]], 0.03, o.bolt, 'glow', [0, H * 0.6, 0.47]));
    b.position.set(dx, 0, dz); b.rotation.y = s * 0.15; g.add(b); }
  return arRot(g, 0.15, -0.5, 0);
}
// --- różne ---
function arBag(A, o = {}) {
  const g = new THREE.Group();
  if (o.chest) { g.add(rbox(2.4, 1.2, 1.4, 0.06, A.col, 'wood', [0, 0.6, 0])); const lid = new THREE.Group(); lid.add(cyl(0.7, 0.7, 2.4, A.col, 'wood', [0, 0, 0], [0, 0, Math.PI / 2], null, 20)); lid.position.set(0, 1.2, -0.7); lid.rotation.x = -1.1;
    lid.children[0].position.set(0, 0.0, 0.7); g.add(lid); for (const x of [-1.0, 0, 1.0]) g.add(box(0.12, 1.25, 1.45, '#c8a040', 'gold', [x, 0.6, 0])); g.add(rbox(0.3, 0.36, 0.1, 0.04, '#c8a040', 'gold', [0, 0.95, 0.72]));
    const R = rng(4); for (let i = 0; i < 40; i++) g.add(cyl(0.16, 0.16, 0.04, '#f0c040', 'gold', [-1.0 + R() * 2.0, 1.2 + R() * 0.3, -0.5 + R() * 1.0], [R() * 3, 0, R() * 3], null, 14));
    for (let i = 0; i < 5; i++) g.add(arGem(0.13, ['#e03a3a', '#3a80e0', '#40c070', '#c060e0', '#f0f0f0'][i], [-0.8 + i * 0.4, 1.55, -0.1 + R() * 0.4]));
    for (let i = 0; i < 6; i++) g.add(cyl(0.16, 0.16, 0.04, '#f0c040', 'gold', [-1.3 + R() * 2.6, 0.02, 0.9 + R() * 0.4], null, null, 14)); return arRot(g, 0.25, -0.35, 0); }
  g.add(lathe([[0.01, -1.0], [0.8, -0.85], [1.15, -0.2], [1.0, 0.45], [0.45, 0.85], [0.35, 1.0], [0.6, 1.35], [0.4, 1.4]], A.col, o.kind || 'leather', [0, 0, 0], null, 1, [7, 0.07, 1.4, -1]));
  g.add(torus(0.4, 0.06, A.gem, o.kind === 'cloth' ? 'gold' : 'leather', [0, 0.88, 0], [Math.PI / 2, 0, 0])); g.add(tube([[0.3, 0.9, 0.25], [0.6, 0.55, 0.5], [0.55, 0.2, 0.6]], 0.04, 0.03, A.gem, 'leather'));
  if (o.emblem) g.add(arCab(0.22, A.gem, [0, -0.1, 1.1])); if (o.embroid) for (let i = 0; i < 8; i++) { const a = -0.9 + i * 0.26; g.add(sph(0.05, '#f0c040', 'gold', [Math.sin(a) * 1.13, -0.25 + Math.sin(i * 1.7) * 0.15, Math.cos(a) * 1.13])); }
  const R = rng(2); for (let i = 0; i < (o.coins || 5); i++) g.add(cyl(0.18, 0.18, 0.05, '#f0c040', 'gold', [0.9 + R() * 0.9, -0.95 + i * 0.05, 0.3 + R() * 0.6], [0.1 * R(), 0, 0.1 * R()], null, 14));
  return arRot(g, 0.12, -0.3, 0);
}
function arHorseshoe(A) {
  const g = new THREE.Group(); g.add(torus(1.0, 0.2, A.col, 'iron', [0, 0, 0], [0, 0, -Math.PI * 0.1], [1, 1.1, 0.6], Math.PI * 1.2)); for (const s of [-1, 1]) g.add(rbox(0.36, 0.2, 0.26, 0.04, A.col, 'iron', [s * 0.62, -0.8, 0]));
  for (let i = 0; i < 6; i++) { const a = Math.PI * (-0.05 + i * 0.22), q = i < 3 ? 1 : 1; g.add(box(0.07, 0.07, 0.1, A.gem, 'iron', [Math.cos(a) * 1.0 * q, Math.sin(a) * 1.1, 0.14])); }
  g.add(cyl(0.02, 0.02, 0.8, '#c8a040', 'gold', [0, 1.4, -0.05])); return arRot(g, 0.1, -0.3, 0);
}
function arOrb(A, o = {}) {
  const g = new THREE.Group(); g.add(lathe([[0.01, -1.2], [0.75, -1.2], [0.7, -1.05], [0.3, -0.9], [0.22, -0.6], [0.45, -0.45]], o.stand || '#8a6a3a', o.standKind || 'gold'));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.add(tube([[Math.cos(a) * 0.4, -0.5, Math.sin(a) * 0.4], [Math.cos(a) * 0.75, -0.1, Math.sin(a) * 0.75], [Math.cos(a) * 0.5, 0.35, Math.sin(a) * 0.5]], 0.07, 0.02, o.stand || '#8a6a3a', o.standKind || 'gold')); }
  g.add(sph(0.55, A.col, 'glow', [0, 0.25, 0])); const sh = sph(0.8, A.col, 'gem', [0, 0.25, 0], null, 32); sh.material = sh.material.clone(); Object.assign(sh.material, { transparent: true, opacity: 0.45, emissiveIntensity: 0.3 }); g.add(sh);
  if (o.ring) g.add(torus(1.05, 0.03, A.gem, 'glow', [0, 0.25, 0], [1.2, 0.3, 0]));
  return arRot(g, 0.1, 0, 0);
}
function arBook(A) {
  const g = new THREE.Group(); g.add(rbox(1.7, 2.2, 0.5, 0.06, '#efe4c8', 'cloth', [0.05, 0, 0])); for (const s of [-1, 1]) g.add(rbox(1.85, 2.35, 0.1, 0.04, A.col, 'leather', [0, 0, s * 0.28]));
  g.add(cyl(0.3, 0.3, 2.35, A.col, 'leather', [-0.92, 0, 0], null, [0.6, 1, 1])); for (const y of [-0.7, 0, 0.7]) g.add(torus(0.22, 0.04, DK(A.col, 0.3), 'leather', [-0.92, y, 0], [Math.PI / 2, 0, 0], [0.8, 1.3, 1]));
  for (const [x, y] of [[-0.78, 1.05], [0.78, 1.05], [-0.78, -1.05], [0.78, -1.05]]) g.add(slab([[-0.2, 0.12], [0.2, 0.12], [0.2, -0.12], [-0.2, -0.12]], 0.04, A.gem, 'gold', [x, y, 0.35]));
  g.add(decal(1.1, 1.4, (c, w, h) => { c.strokeStyle = '#f0c040'; c.lineWidth = 3; c.beginPath(); c.arc(w / 2, h / 2, w * 0.38, 0, 7); c.stroke(); c.beginPath(); c.moveTo(w / 2, h * 0.2); c.lineTo(w / 2, h * 0.8); c.moveTo(w * 0.3, h * 0.35); c.lineTo(w * 0.7, h * 0.65); c.moveTo(w * 0.7, h * 0.35); c.lineTo(w * 0.3, h * 0.65); c.stroke(); }, [0.05, 0, 0.34]));
  g.children[g.children.length - 1].material.transparent = true; g.children[g.children.length - 1].material.alphaTest = 0.3; g.add(arGem(0.14, '#e03a3a', [0.05, 0, 0.4]));
  return arRot(g, 0.15, 0.45, 0.1);
}
function arFeather(A) {
  const g = new THREE.Group(), side = s => { const pts = [[0, -1.6]]; for (let i = 0; i <= 10; i++) { const t = i / 10, y = -1.4 + t * 3.0; pts.push([s * (0.12 + Math.sin(t * Math.PI) * 0.5 * (1 - t * 0.3)), y + (t > 0.98 ? 0.1 : 0)]); } pts.push([0, 1.8]); return pts; };
  for (const s of [-1, 1]) g.add(slab(side(s), 0.02, s < 0 ? A.col : LT(A.col, 0.15), 'feather', [0, 0, 0]));
  for (let i = 0; i < 8; i++) g.add(box(0.02, 0.36, 0.03, A.gem, 'feather', [(i % 2 ? 0.25 : -0.25), -1.0 + i * 0.32, 0.03], [0, 0, i % 2 ? -0.9 : 0.9]));
  g.add(cyl(0.03, 0.015, 3.6, '#f0e8d0', 'bone', [0, 0.1, 0.02])); return arRot(g, 0, 0.3, -Math.PI / 5);
}
function arCoin(A0) {
  const A = { ...A0, col: LT(A0.col, 0.3) }, g = new THREE.Group(); g.add(cyl(1.1, 1.1, 0.16, A.col, 'iron', [0, 0, 0], [Math.PI / 2, 0, 0], null, 40)); g.add(torus(1.04, 0.05, LT(A.col, 0.2), 'iron', [0, 0, 0.08]));
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; g.add(box(0.03, 0.14, 0.1, DK(A.col, 0.3), 'iron', [Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0], [0, 0, a])); }
  g.add(sph(0.36, A.col, 'iron', [0.05, 0.1, 0.05], [1, 1.15, 0.25])); g.add(slab([[-0.35, -0.2], [0.35, -0.2], [0.25, -0.55], [-0.25, -0.55]], 0.04, A.col, 'iron', [0.05, 0, 0.06]));
  for (let i = 0; i < 5; i++) g.add(cone(0.05, 0.16, A.col, 'iron', [-0.2 + i * 0.1, 0.5, 0.08], null, 4));
  return arRot(g, 0.2, -0.45, 0.1);
}
function arBanner(A) {
  const g = new THREE.Group(); g.add(cyl(0.07, 0.07, 4.2, '#5a3a20', 'wood', [-0.9, 0, 0])); g.add(cone(0.14, 0.4, '#c8a040', 'gold', [-0.9, 2.3, 0])); g.add(cyl(0.04, 0.04, 2.3, '#5a3a20', 'wood', [0.25, 1.75, 0], [0, 0, Math.PI / 2]));
  const f = arCloth(2.2, 2.4, A.col, 'cloth', [0.25, 0.5, 0], 0.18, 1.5); g.add(f); for (const x of [-0.6, 0, 0.6]) g.add(cone(0.08, 0.3, '#c8a040', 'gold', [0.25 + x, -0.75, 0.04], [Math.PI, 0, 0], 4));
  g.add(decal(1.3, 1.3, (c, w, h) => { c.fillStyle = A.gem; c.beginPath(); c.moveTo(w / 2, h * 0.1); c.lineTo(w * 0.9, h * 0.45); c.lineTo(w * 0.72, h * 0.9); c.lineTo(w * 0.28, h * 0.9); c.lineTo(w * 0.1, h * 0.45); c.closePath(); c.fill(); c.fillStyle = A.col; c.beginPath(); c.arc(w / 2, h * 0.52, w * 0.16, 0, 7); c.fill(); }, [0.3, 0.6, 0.2]));
  g.children[g.children.length - 1].material.transparent = true; g.children[g.children.length - 1].material.alphaTest = 0.3; return arRot(g, 0, 0.3, 0.05);
}
function arGrail(A) {
  const g = new THREE.Group(); g.add(lathe([[0.01, -1.4], [0.9, -1.4], [0.85, -1.25], [0.35, -1.0], [0.18, -0.6], [0.26, -0.35], [0.16, -0.15], [0.3, 0.0], [0.85, 0.35], [1.0, 1.0], [0.95, 1.05], [0.85, 0.5], [0.01, 0.15]], A.col, 'gold'));
  g.add(torus(0.28, 0.08, A.col, 'gold', [0, -0.35, 0], [Math.PI / 2, 0, 0])); g.add(torus(0.98, 0.05, LT(A.col, 0.2), 'gold', [0, 1.02, 0], [Math.PI / 2, 0, 0]));
  ['#e03a3a', '#3a80e0', '#40c070', '#e03a3a', '#3a80e0', '#40c070'].forEach((c, i) => { const a = i * Math.PI / 3; g.add(arCab(0.1, c, [Math.sin(a) * 0.92, 0.55, Math.cos(a) * 0.92])); });
  g.add(sph(0.82, A.gem, 'glow', [0, 0.95, 0], [1, 0.1, 1])); return arRot(g, 0.15, 0, 0);
}
// --- katalog: id -> bryła ---
const ART3 = {
  noviceSword: A => arSword(A, { len: 2.6, grip: '#8a5a2a' }), dragonfangBlade: A => arSword(A, { len: 3.3, w: 0.32, curve: true, bladeKind: 'bone', wing: true, guardCol: '#3a6a4a', pommelGem: true, grip: '#2a3a2a' }),
  falconBow: A => arBow(A), giantAxe: A => arAxe(A), marchBoots: A => arBoots(A, { wings: '#e8e0c8', cuff: '#c8a040' }), wardAmulet: A => arAmulet(A), warlordBanner: A => arBanner(A), surgeonBag: A => arBag(A), twinRing: A => arRing(A),
  bronzeDagger: A => arDagger(A), steppeAxe: A => arAxe(A), thunderHammer: A => arHammer(A), titanHammer: A => arHammer(A, { titan: true, haft: '#5a6a78' }), hunterBow: A => arBow(A), archmageStaff: A => arStaff(A),
  oakShield: A => arShield(A, { shape: 'round', planks: true, rim: '#5a5a62' }), lionShield: A => arShield(A, { decal: arLion('#a8302a'), dy: 0.15, studs: true, rim: '#8a6a20' }),
  stoneShield: A => arShield(A, { shape: 'stone', rim: '#5a5a54' }), mountainShield: A => arShield(A, { decal: arMount(A.gem), rim: '#c8ccd4', gem: true, gemY: -0.9 }),
  eclipseShield: A => arShield(A, { shape: 'round', kind: 'metal', rim: '#c8a040', boss: '#c8a040', sun: true }), dragonScaleShield: A => arShield(A, { shape: 'kite', kind: 'scale', rim: '#c8a040', gem: true, gemY: 0.6 }),
  ironHelm: A => arHelm(A), knightHelm: A => arHelm(A, { type: 'great' }), titanHelm: A => arHelm(A, { type: 'titan' }), dragonBoneHelm: A => arHelm(A, { type: 'bone' }),
  sageDiadem: A => arCrown(A, { type: 'diadem' }), courageCrown: A => arCrown(A), boneCrown: A => arCrown(A, { type: 'bone' }), deadKingRegalia: A => arCrown(A, { type: 'bone', skull: true }), woolHood: A => arHood(A),
  amberAmulet: A => arAmulet(A), ravenAmulet: A => arAmulet(A, { type: 'raven', chain: '#8a8e98', chainKind: 'steel' }), phoenixAmulet: A => arAmulet(A, { type: 'phoenix' }),
  bearClaw: A => arFang(A), vampireFang: A => arFang(A, { type: 'vamp' }),
  scoutRing: A => arRing(A, { prongs: 6 }), clarityRing: A => arRing(A, { kind: 'steel', gemR: 0.4, side: '#e0e8f0' }), copperRing: A => arRing(A, { kind: 'gold', thick: 0.18, wide: 1.1, gemR: 0.24 }),
  seerRing: A => arRing(A, { kind: 'steel', rune: '#40c0e0', gemR: 0.3 }), goldenSignet: A => arRing(A, { signet: true, thick: 0.2 }), oathRing: A => arRing(A, { twist: true, kind: 'steel', side: '#c83a2a' }),
  mistCloak: A => arCloak(A, { opacity: 0.75, lining: '#c8d4e8' }), travelCloak: A => arCloak(A, { hood: true, kind: 'wrap', clasp: '#8a7a5a' }), lionCloak: A => arCloak(A, { lion: true, kind: 'fur', lining: '#5a3a1a' }),
  deathShroud: A => arCloak(A, { hood: true, tatter: true, lining: '#0a0a0e' }), shadowCloak: A => arCloak(A, { fur: '#1a1622', lining: A.gem, stars: A.gem }),
  wardenMail: A => arArmor(A, { kind: 'mail', rep: 2, belt: '#4a3020', collar: A.col }), leatherVest: A => arArmor(A, { kind: 'leather', laces: A.gem, pad: DK(A.col, 0.2), skirt: DK(A.col, 0.15) }),
  dragonScaleMail: A => arArmor(A, { kind: 'scale', rep: 1.5, pad: '#c8a040', padKind: 'gold', plates: true, gem: true, belt: '#3a2414' }),
  titanCuirass: A => arArmor(A, { kind: 'steel', plates: true, glowLines: A.gem, ridge: '#c8a040', skirt: A.col, skirtKind: 'steel' }),
  dragonLordArmor: A => arArmor(A, { kind: 'metal', plates: true, wings: '#c8a040', gem: true, ridge: '#c8a040', skirt: '#5a1a1a', skirtKind: 'scale', collar: '#c8a040', collarKind: 'gold' }),
  titanArmor: A => arArmor(A, { kind: 'steel', plates: true, glowLines: '#ffffff', wings: '#e8ecf0', ridge: '#c8a040', skirt: A.col, skirtKind: 'steel', gem: true }),
  starRobe: A => arRobe(A), archmageRegalia: A => arRobe(A, { many: true, collar: '#e8e0f0', halo: true }),
  wandererBoots: A => arBoots(A), windBoots: A => arBoots(A, { wings: A.gem, cuff: '#e8f0f8', cuffKind: 'fur' }), titanGreaves: A => arBoots(A, { plate: true, kind: 'steel' }),
  leagueBoots: A => arBoots(A, { tall: true, buckles: true }), stormWalker: A => arBoots(A, { tall: true, wings: '#e8f0ff', bolt: '#ffe060', cuff: '#e8f0ff', cuffKind: 'fur' }),
  merchantPurse: A => arBag(A), hornOfPlenty: A => arBag(A, { kind: 'cloth', embroid: true, emblem: true, coins: 9 }), merchantPrince: A => arBag(A, { chest: true }),
  luckyHorseshoe: A => arHorseshoe(A), emberOrb: A => arOrb(A), skyOrb: A => arOrb(A, { stand: '#c8ccd4', standKind: 'steel', ring: true }), runeBook: A => arBook(A),
  pilgrimStaff: A => arStaff(A), wolfPelt: A => arCloak(A, { hood: true, fur: '#9a948e', lining: '#5a5048' }), minerCharm: A => arAmulet(A, { chain: '#8a8e98', chainKind: 'steel' }),
  hawkHelm: A => arHelm(A), serpentRing: A => arRing(A, { prongs: 4, twist: true }), assassinDagger: A => arDagger(A), fortuneCoin: A => arCoin(A),
  siphonOrb: A => arOrb(A, { ring: true }), envoyBanner: A => arBanner(A), kingsMantle: A => arCloak(A, { fur: '#f0ece0', lining: '#f0c040', clasp: '#f0c040' }), sunAmulet: A => arAmulet(A, { type: 'phoenix' }),
  frostBrand: A => arSword(A, { len: 3.1, w: 0.3, blade: '#6ab8e4', bladeKind: 'gem', gemGuard: true, pommelGem: true, guardCol: '#e8f8ff' }), frostCrown: A => arCrown({ ...A, col: '#4aa0d8' }, { kind: 'gem' }),
  frostMail: A => arArmor({ ...A, col: '#3a8ac4' }, { kind: 'gem', plates: true, glowLines: '#ffffff', ridge: '#bfe8fa', skirt: '#2a74b0', skirtKind: 'gem' }), // lód: półprzezroczysty, świecący
  frostKing: A => arArmor({ ...A, col: '#4a9ad4' }, { kind: 'gem', plates: true, glowLines: '#ffffff', ridge: '#ffffff', skirt: '#2a74b0', skirtKind: 'gem', gem: true, collar: '#e8f4ff', collarKind: 'fur' }),
  owlFeather: A => arFeather(A), silverCoin: A => arCoin(A), battleBanner: A => arBanner(A), grail: A => arGrail(A),
};
// Render artefaktu: bryła wyśrodkowana i dopasowana do kwadratu S×S (bez pikselizacji)
function renderArtifact(id, A, S = 192) {
  const f = ART3[id]; if (!f) return null; const g = f(A), box3 = new THREE.Box3().setFromObject(g), c = box3.getCenter(new THREE.Vector3()), R = box3.getBoundingSphere(new THREE.Sphere()).radius;
  const w = arGrp(g); g.position.sub(c); return G3.render(w, S, S, S * 0.5 / R, S / 2, S / 2, { raw: true, yaw: 0.3, pitch: 0.3 });
}
