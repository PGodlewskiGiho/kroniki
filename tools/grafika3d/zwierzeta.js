// ==================== MODELE 3D: ZWIERZĘTA I POTWORY ===========================================
// Czworonogi (koń, wilk i jego odmiany, jednorożec, byk, centaur, jeździec), skrzydlate (gryf, ptak, feniks),
// gady (smok, hydra, bazyliszek), owad, oko z mackami, upiór i drzewiec. Patrzą w +x, stopy na y = 0.
/* global THREE, mat, mesh, joint, sph, cap, cyl, cone, box, torus, lathe, bone, tube, sheet, DK, LT, bright, humanoid, headOf, wings */

// Tułów czworonoga z nogami; o: { col, kind, len, legH, r (grubość), paws, hoofCol, rump, chest }. Zwraca stawy szyi i ogona.
function quadBody(root, o, P) {
  const t = P.t || 0, walking = P.walk != null, ph = (P.walk || 0) * Math.PI * 2, A = P.atk, hit = A != null ? Math.sin(Math.min(1, A) * Math.PI) : 0;
  const len = o.len || 1, legH = o.legH || 0.75, r = o.r || 0.24, col = o.col, K = o.kind || 'fur', far = DK(col, 0.22);
  const bodyY = legH + r * 0.55, bob = walking ? Math.abs(Math.sin(ph * 2)) * 0.03 : Math.sin(t * 2) * 0.008;
  const body = joint(root, [0, bodyY + bob, 0], (o.rear ? hit * 0.4 : -hit * 0.08) - (P.hurt ? 0.1 : 0));
  body.add(cap(r, len * 0.72, col, K, [0, 0.03, 0], [0, 0, Math.PI / 2], [1, 1, 0.88], 2));
  body.add(sph(r * (o.chest || 1.12), col, K, [len * 0.36, 0.06, 0], [1, 1.05, 0.9]));
  body.add(sph(r * (o.rump || 1.08), col, K, [-len * 0.36, 0.05, 0], [1, 1, 0.9]));
  if (o.belly) body.add(sph(r * 0.9, o.belly, K, [0, -r * 0.35, 0], [2.2, 0.6, 0.85]));
  const legs = [[len * 0.36, 1, 0, true], [len * 0.36, -1, Math.PI, true], [-len * 0.36, 1, Math.PI, false], [-len * 0.36, -1, 0, false]];
  for (const [x, z, p, front] of legs) {
    const c = z < 0 ? far : col, hip = joint(body, [x, -r * 0.2, z * r * 0.62]);
    hip.rotation.z = (walking ? Math.sin(ph + p) * 0.45 : 0) - (front && o.rear ? hit * 1.1 : 0) + (front && !o.rear ? hit * 0.3 : 0);
    const upL = legH * 0.52, loL = legH * 0.48 - r * 0.2;
    bone(hip, r * (front ? 0.42 : 0.5), r * 0.26, upL, c, K);
    const kn = joint(hip, [0, -upL, 0], walking ? Math.max(0, Math.cos(ph + p)) * (front ? -0.9 : 0.9) : front && o.rear ? -hit * 1.2 : 0);
    bone(kn, r * 0.26, r * 0.2, loL + r * 0.15, c, K);
    if (o.paws) { kn.add(sph(r * 0.3, c, K, [r * 0.12, -loL - r * 0.12, 0], [1.4, 0.6, 1])); for (let k = -1; k <= 1; k++) kn.add(cone(0.012, 0.05, '#e8e0d0', 'horn', [r * 0.4, -loL - r * 0.16, k * 0.035], [0, 0, -1.8], 5)); }
    else kn.add(cyl(r * 0.24, r * 0.28, r * 0.35, o.hoofCol || '#2a2018', 'horn', [0, -loL - r * 0.1, 0]));
  }
  return { body, neck: joint(body, [len * 0.5, r * 0.45, 0]), tail: joint(body, [-len * 0.55, r * 0.35, 0]), hit, bodyY, r, len };
}
function horseHead(neck, col, mane, P, o = {}) {
  const hit = P.atk != null ? Math.sin(Math.min(1, P.atk) * Math.PI) : 0;
  neck.rotation.z = -0.5 + hit * 0.25; neck.add(cap(0.13, 0.42, col, 'fur', [0, 0.26, 0], null, [1, 1, 0.75])); // szyja
  neck.add(mesh(new THREE.BoxGeometry(0.05, 0.62, 0.07), mane, 'hair', [-0.11, 0.28, 0])); // grzywa
  const head = joint(neck, [0, 0.52, 0], -1.75);
  head.add(cap(0.095, 0.3, col, 'fur', [0, 0.17, 0], null, [1, 1, 0.8])); head.add(sph(0.1, DK(col, 0.25), 'fur', [0.01, 0.36, 0], [1, 1, 0.8]));
  for (const z of [-1, 1]) { head.add(sph(0.024, '#140c06', 'skin', [0.06, 0.07, 0.07 * z])); head.add(sph(0.012, '#0a0604', 'skin', [0.04, 0.42, 0.04 * z])); head.add(cone(0.035, 0.12, col, 'fur', [-0.09, -0.02, 0.05 * z], [0, 0, 1.3], 6)); }
  head.add(mesh(new THREE.BoxGeometry(0.03, 0.1, 0.06), mane, 'hair', [-0.07, 0.02, 0])); // grzywka
  if (o.bridle) { head.add(torus(0.1, 0.008, '#3a2414', 'leather', [0, 0.3, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8])); head.add(torus(0.095, 0.008, '#3a2414', 'leather', [0, 0.1, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8])); }
  if (o.horn) head.add(cone(0.025, 0.3, o.horn, 'horn', [-0.02, 0.0, 0], [0, 0, 2.6], 8));
  return head;
}
function horse(L, P, o = {}) {
  const root = new THREE.Group(), col = L.horse || L.fur || '#7a4a26', mane = L.mane || DK(col, 0.6);
  const q = quadBody(root, { col, len: 1.05, legH: 0.8, r: 0.25, rear: true }, P);
  horseHead(q.neck, col, mane, P, { bridle: o.saddle, horn: o.horn });
  q.tail.add(tube([[0, 0, 0], [-0.12, -0.1, 0], [-0.2, -0.4, 0], [-0.18, -0.65, 0]], 0.06, 0.03, mane, 'hair'));
  if (o.saddle) {
    q.body.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.46, 18, 1, true, -Math.PI / 2, Math.PI), o.saddle, 'leather', [0.02, 0.06, 0], [Math.PI / 2, 0, 0], [1, 1, 1.02]));
    if (L.barding) { const bd = mesh(new THREE.CylinderGeometry(0.29, 0.33, 1.05, 20, 1, true, -Math.PI * 0.6, Math.PI * 1.2), L.barding, 'cloth', [0, -0.02, 0], [0, 0, Math.PI / 2], [1, 1, 0.95]); bd.material = bd.material.clone(); bd.material.side = THREE.DoubleSide; q.body.add(bd); if (L.trim) q.body.add(torus(0.3, 0.012, L.trim, 'gold', [0.52, -0.02, 0], [0, Math.PI / 2, 0], [1, 1.05, 1])); }
  }
  return { root, q };
}
// Jeździec: koń w siodle z humanoidem (nogi zgięte na boki)
function rider(L, P = {}) {
  const { root, q } = horse(L, P, { saddle: L.barding ? DK(L.barding, 0.3) : '#5a2a1a' });
  const man = humanoid({ ...L, mounted: true, size: 0.92, shield: L.shield, cape: L.cape }, { t: P.t, atk: P.atk, hurt: P.hurt });
  man.position.set(0.02, q.r * 0.75 - 0.79 * 0.92, 0); q.body.add(man);
  if (L.banner) { // chorągiew bohatera za siodłem
    const wv = Math.sin((P.t || 0) * 2) * 0.04, pole = joint(q.body, [-0.28, q.r * 0.6, -0.16], 0.12);
    pole.add(cyl(0.018, 0.018, 1.7, '#5a3a1e', 'wood', [0, 0.85, 0])); pole.add(sph(0.035, '#e0b24a', 'gold', [0, 1.72, 0]));
    pole.add(sheet([[0, 0], [0.42, -0.03 + wv], [0.34, -0.14 + wv], [0.42, -0.27 + wv], [0, -0.3]], L.banner, 'cloth', [0.01, 1.66, 0]));
  }
  return root;
}
function centaur(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#8a5a30';
  const q = quadBody(root, { col, len: 0.95, legH: 0.78, r: 0.24 }, P);
  q.tail.add(tube([[0, 0, 0], [-0.12, -0.1, 0], [-0.2, -0.4, 0], [-0.18, -0.6, 0]], 0.05, 0.025, L.hair || DK(col, 0.5), 'hair'));
  const man = humanoid({ skin: L.skin, cloth: L.cloth || '#6a4424', hair: L.hair, helm: L.helm, helmCol: L.helmCol, weapon: 'bow', size: 0.95, noLegs: true, quiver: '#6a4424' }, { t: P.t, atk: P.atk, hurt: P.hurt });
  man.position.set(q.len * 0.4, q.r * 0.2 - 0.79 * 0.95, 0); q.body.add(man); // tors człowieka w miejscu końskiej szyi
  return root;
}
function unicorn(L, P = {}) { return horse({ horse: L.fur, mane: L.mane || '#c8c0e0' }, P, { horn: '#f0d890' }).root; }

// Wilk i jego odmiany: ogniste ogary (flame), trójgłowy pies (heads), mantykora (mane + wings + stinger), behemot (horns, duży)
function canineHead(neck, L, P, col, o = {}) {
  const hit = P.atk != null ? Math.sin(Math.min(1, P.atk) * Math.PI) : 0, head = joint(neck, [0, 0, 0], -0.4 - hit * 0.3);
  head.add(sph(0.13, col, 'fur', [0.04, 0.02, 0], [1.1, 0.95, 0.9]));
  head.add(cap(0.06, 0.12, col, 'fur', [0.2, -0.02, 0], [0, 0, Math.PI / 2], [1, 1, 0.9])); head.add(sph(0.03, '#141010', 'skin', [0.3, -0.01, 0]));
  const jaw = joint(head, [0.1, -0.06, 0], -hit * 0.5); jaw.add(cap(0.04, 0.12, DK(col, 0.15), 'fur', [0.1, -0.01, 0], [0, 0, Math.PI / 2], [1, 1, 0.8]));
  if (hit > 0.2) for (const z of [-0.03, 0.03]) head.add(cone(0.01, 0.04, '#f0ead8', 'horn', [0.24, -0.06, z], [Math.PI, 0, 0], 5));
  const eye = L.eyes || '#e0c040', gl = bright(eye) ? 'glow' : 'skin';
  for (const z of [-1, 1]) { head.add(sph(0.018, eye, gl, [0.14, 0.06, 0.07 * z])); if (!o.noEars) head.add(cone(0.04, 0.12, col, 'fur', [-0.02, 0.13, 0.07 * z], [0.2 * z, 0, -0.2], 6)); }
  if (L.horns) for (const z of [-1, 1]) head.add(tube([[0, 0.08, 0.08 * z], [-0.05, 0.2, 0.14 * z], [-0.18, 0.26, 0.12 * z], [-0.25, 0.2, 0.1 * z]], 0.04, 0.008, L.horns, 'horn'));
  return head;
}
function wolf(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#7a7470', big = (L.size || 1) > 1.4, mant = !!L.stinger;
  const q = quadBody(root, { col, len: big ? 1.1 : 0.85, legH: big ? 0.62 : 0.52, r: big ? 0.3 : 0.19, paws: true, chest: mant || big ? 1.25 : 1.12, belly: L.stripes ? null : LT(col, 0.15) }, P);
  if (L.stripes) for (let i = 0; i < 6; i++) q.body.add(torus(q.r * 1.02, 0.02, L.stripes, 'fur', [-q.len * 0.35 + i * q.len * 0.14, 0.03, 0], [0, Math.PI / 2, 0], [1, 1, 0.9], Math.PI));
  const heads = L.heads || 1;
  for (let k = 0; k < heads; k++) {
    const m = heads > 1 ? k - (heads - 1) / 2 : 0, z = m * 0.2, nk = joint(q.neck, [m * 0.05 - Math.abs(m) * 0.04, -m * 0.1, z], -0.65 - m * 0.4);
    nk.add(cap(q.r * 0.6, 0.16, col, 'fur', [0, 0.1, 0], null, [1, 1, 0.8])); const hd = joint(nk, [0.02, 0.22, 0], 0.7); canineHead(hd, L, P, col);
  }
  if (L.mane) q.neck.add(sph(q.r * 1.05, L.mane, 'fur', [0.02, 0.12, 0], [1, 1.1, 1.2]));
  if (L.flame) for (let i = 0; i < 7; i++) q.body.add(cone(0.06, 0.2 + (i % 3) * 0.06, i % 2 ? L.flame : LT(L.flame, 0.2), 'fire', [-q.len * 0.4 + i * q.len * 0.13, q.r * 0.95, 0], [0, 0, 0.3]));
  if (mant) q.tail.add(tube([[0, 0, 0], [-0.2, 0.25, 0], [-0.15, 0.6, 0], [0.1, 0.75, 0]], 0.07, 0.03, DK(col, 0.1), 'scale'), cone(0.04, 0.16, L.stinger, 'horn', [0.14, 0.72, 0], [0, 0, -1.9], 6));
  else q.tail.add(tube([[0, 0, 0], [-0.2, -0.05, 0], [-0.35, -0.2, 0], [-0.45, -0.25, 0]], L.flame ? 0.04 : 0.07, 0.03, L.flame ? L.flame : col, L.flame ? 'fire' : 'fur'));
  if (L.wings) wings(joint(q.body, [0.05, q.r * 0.2, 0]), L.wings, false, P.t || 0, P.walk != null ? P.walk * Math.PI * 2 : null, P.atk);
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
function bull(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#5a3a24';
  const q = quadBody(root, { col, len: 1.1, legH: 0.62, r: 0.33, chest: 1.3, hoofCol: '#1a140e' }, P);
  const hit = q.hit, head = joint(q.neck, [0.02, -0.05, 0], -0.2 - hit * 0.6);
  head.add(sph(0.2, col, 'fur', [0.12, 0, 0], [1.2, 1, 0.9])); head.add(sph(0.12, DK(col, 0.2), 'fur', [0.3, -0.08, 0], [1, 0.9, 1]));
  for (const z of [-1, 1]) { head.add(sph(0.02, '#140c06', 'skin', [0.28, 0.06, 0.1 * z])); head.add(tube([[0.1, 0.12, 0.12 * z], [0.12, 0.18, 0.28 * z], [0.24, 0.3, 0.32 * z]], 0.045, 0.01, L.horn || '#e8e0cc', 'horn')); head.add(cone(0.04, 0.1, col, 'fur', [0.02, 0.12, 0.16 * z], [0.8 * z, 0, 0], 6)); }
  if (!L.plain) for (let i = 0; i < 12; i++) q.body.add(sph(0.06, DK(col, 0.15), 'scale', [-q.len * 0.4 + (i % 6) * q.len * 0.16, q.r * 0.7, (i < 6 ? 1 : -1) * 0.08], [1.2, 0.6, 1])); // łuski gorgony
  if (L.breath && hit > 0.3) head.add(sph(0.12, L.breath, 'glow', [0.5, -0.05, 0], [1.6, 0.7, 0.9]));
  if (L.barding) { const bd = mesh(new THREE.CylinderGeometry(q.r * 1.05, q.r * 1.12, q.len * 0.9, 20, 1, true, -Math.PI * 0.6, Math.PI * 1.2), L.barding, 'cloth', [0, -0.02, 0], [0, 0, Math.PI / 2]); bd.material = bd.material.clone(); bd.material.side = THREE.DoubleSide; q.body.add(bd); if (L.trim) q.body.add(torus(q.r * 1.1, 0.015, L.trim, 'gold', [q.len * 0.45, -0.02, 0], [0, Math.PI / 2, 0])); }
  q.tail.add(tube([[0, 0, 0], [-0.06, -0.2, 0], [-0.08, -0.5, 0]], 0.03, 0.02, col, 'fur'), sph(0.05, DK(col, 0.4), 'hair', [-0.08, -0.52, 0]));
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Skrzydło z piór: ramię od barku do tyłu i w górę, lotki wachlarzem; z = strona (±1), span = rozpiętość, flap = machnięcie
function featherWing(parent, z, col, span, flap, K = 'feather') {
  const w = joint(parent, [0, 0, 0.16 * z]); w.rotation.set((0.35 + flap) * z, 0, 0);
  const arm = [[0, 0, 0], [-0.15 * span, 0.35 * span, 0], [-0.45 * span, 0.55 * span, 0]];
  w.add(tube(arm, 0.06 * span, 0.03 * span, col, K));
  for (let i = 0; i < 9; i++) { const f = i / 8, bx = arm[1][0] + (arm[2][0] - arm[1][0]) * f, by = arm[1][1] + (arm[2][1] - arm[1][1]) * f, l = (0.35 + f * 0.35) * span, a = -0.9 - f * 0.9;
    w.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), i % 2 ? col : LT(col, 0.18), K, [bx + Math.sin(a) * l * 0.5, by - Math.cos(a) * l * 0.5 * 0.2 - l * 0.35, 0], [0, 0, a + Math.PI / 2], [0.35 * span, l * 4.5, 0.12])); }
  for (let i = 0; i < 5; i++) { const f = i / 4; w.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), LT(col, 0.1), K, [-0.08 * span - f * 0.25 * span, 0.3 * span - f * 0.05, 0.01], [0, 0, 0.4], [1.8 * span, 0.7 * span, 0.15])); } // pokrywy
  return w;
}
// Gryf: lwie ciało, orla głowa i skrzydła, przednie łapy ze szponami
function griffin(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#c89a4a', wh = '#f0ece0';
  const q = quadBody(root, { col, len: 0.9, legH: 0.58, r: 0.22, paws: true, chest: 1.2, rear: true }, P);
  q.neck.rotation.z = -0.4; q.neck.add(cap(0.12, 0.18, wh, 'feather', [0, 0.12, 0], null, [1, 1, 0.85]));
  const head = joint(q.neck, [0.03, 0.28, 0], -0.3); head.add(sph(0.12, wh, 'feather', [0, 0, 0], [1.1, 1, 0.9]));
  head.add(tube([[0.1, 0.0, 0], [0.2, -0.02, 0], [0.26, -0.08, 0], [0.24, -0.13, 0]], 0.05, 0.008, '#e8b040', 'horn'));
  for (const z of [-1, 1]) { head.add(sph(0.02, '#e8a020', 'gem', [0.08, 0.04, 0.08 * z])); head.add(sph(0.01, '#140c06', 'skin', [0.095, 0.04, 0.085 * z])); head.add(cone(0.03, 0.1, wh, 'feather', [-0.08, 0.06, 0.06 * z], [0, 0, 1.2], 5)); }
  q.tail.add(tube([[0, 0, 0], [-0.2, -0.1, 0], [-0.35, -0.3, 0], [-0.4, -0.45, 0]], 0.04, 0.02, col, 'fur'), sph(0.06, DK(col, 0.3), 'fur', [-0.4, -0.47, 0]));
  const flap = P.walk != null ? Math.sin(P.walk * Math.PI * 4) * 0.5 : Math.sin((P.t || 0) * 2) * 0.1 + (P.atk != null ? Math.sin(P.atk * Math.PI) * 0.5 : 0);
  for (const z of [-1, 1]) featherWing(joint(q.body, [0.2, q.r * 0.7, 0]), z, col, 1.1, flap);
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Wielki ptak (roc, ptak gromu) i feniks (płonący)
function birdBody(L, P, o) {
  const root = new THREE.Group(), t = P.t || 0, hover = Math.sin(t * 2.5) * 0.05, col = o.col, wcol = o.wing || col, K = o.kind;
  const walking = P.walk != null, ph = walking ? P.walk * Math.PI * 2 : 0, A = P.atk, flap = walking ? Math.sin(ph * 2) : Math.sin(t * 2.5) * 0.4;
  const body = joint(root, [0, 0.95 + hover, 0], A != null ? -Math.sin(A * Math.PI) * 0.3 : 0);
  body.add(sph(0.3, col, K, [0, 0, 0], [1.4, 0.85, 0.9])); body.add(sph(0.2, LT(col, 0.1), K, [0.25, -0.05, 0], [1, 1, 0.9]));
  const nk = joint(body, [0.35, 0.12, 0], -0.4); nk.add(cap(0.1, 0.2, o.head || col, K, [0, 0.12, 0]));
  const head = joint(nk, [0.02, 0.28, 0], -0.2); head.add(sph(0.13, o.head || col, K, [0, 0, 0], [1.15, 1, 0.9]));
  head.add(tube([[0.1, 0.0, 0], [0.22, -0.01, 0], [0.28, -0.07, 0], [0.26, -0.12, 0]], 0.05, 0.008, o.beak || '#e0a030', 'horn'));
  for (const z of [-1, 1]) head.add(sph(0.02, o.eye || '#f0d040', o.glow ? 'glow' : 'gem', [0.08, 0.04, 0.085 * z]));
  for (const z of [-1, 1]) featherWing(joint(body, [0.05, 0.18, 0]), z, wcol, 1.35, 0.2 + flap * 0.5, o.flame ? 'fire' : 'feather'); // skrzydła uniesione, machające
  for (let i = 0; i < 5; i++) body.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), i % 2 ? wcol : LT(wcol, 0.2), o.flame ? 'fire' : 'feather', [-0.45 - i * 0.02, -0.05 + i * 0.01, (i - 2) * 0.07], [0, 0, -0.2], [3.2, 0.25, 0.7])); // ogon
  for (const z of [-1, 1]) { const lg = joint(body, [0.05, -0.2, 0.1 * z], 0.3); bone(lg, 0.04, 0.03, 0.5 + hover, '#c89040', 'horn'); for (let k = -1; k <= 1; k++) lg.add(cone(0.012, 0.08, '#2a2018', 'horn', [0.04, -0.52 - hover, k * 0.03], [0, 0, -1.8], 5)); }
  if (o.glow && !o.flame) body.add(sph(0.2, o.glow, 'glow', [0, 0.35, 0], [0.4, 0.4, 0.4]));
  return root;
}
function bird(L, P = {}) { const r = birdBody(L, P, { col: L.fur, wing: L.wing, head: L.head, beak: L.beak, kind: 'feather', glow: L.glow }); if (L.size) r.scale.setScalar(L.size); return r; }
function phoenix(L, P = {}) { const r = birdBody(L, P, { col: '#e8501a', wing: '#f08a20', head: '#f8b030', beak: '#ffe070', kind: 'fire', flame: true, eye: '#fff8c0', glow: '#ffd060' }); if (L.size) r.scale.setScalar(L.size); return r; }

// Smok: łuski, długa szyja i ogon, wielkie skrzydła błoniaste, rogi; bony = kościany
// Smok: kanciasta głowa z łukami brwiowymi, zębami i kolcami żuchwy, kolce na grzbiecie, ostrze na ogonie, postrzępione skrzydła.
// L.form zmienia sylwetkę: 'heavy' (masywny, pancerne płyty, krótkie zakręcone rogi, maczuga na ogonie), 'crystal' (kryształy
// na grzbiecie i głowie), 'serpent' (smukły, długa szyja, grzywa kolców, ogromne skrzydła), 'fae' (mały, skrzydła motyla)
function dragon(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#3a9a5a', bony = !!L.bony, K = bony ? 'bone' : 'scale', horn = L.horn || '#e8e0c0', F = L.form || '';
  const heavy = F === 'heavy', ser = F === 'serpent', fae = F === 'fae', cry = F === 'crystal', dark = DK(col, 0.35);
  const q = quadBody(root, { col, kind: K, len: ser ? 1.8 : heavy ? 1.55 : 1.6, legH: heavy ? 0.66 : 0.74, r: bony ? 0.2 : heavy ? 0.34 : ser ? 0.24 : 0.28, paws: true, chest: heavy ? 1.3 : 1.25, belly: bony ? null : LT(col, 0.3) }, P);
  if (bony) for (let i = 0; i < 6; i++) q.body.add(torus(0.3, 0.025, col, 'bone', [0.35 - i * 0.12, 0, 0], [0, Math.PI / 2, 0], [1, 1.1, 1], Math.PI * 1.4));
  // grzbiet: kolce, płyty pancerza albo kryształy
  for (let i = 0; i < 9; i++) { const x = -0.75 + i * 0.17, h = (heavy ? 0.22 : ser ? 0.42 : 0.34) * (1 - Math.abs(i - 5) * 0.08);
    if (cry && i % 2) q.body.add(mesh(new THREE.OctahedronGeometry(0.17), L.gem || LT(col, 0.4), 'gem', [x, q.r * 1.1, 0], [0.3, i, 0.2], [0.7, 2.4, 0.7]));
    else if (heavy) q.body.add(box(0.15, 0.06, q.r * 1.4, dark, 'metal', [x, q.r * 0.92, 0], [0, 0, -0.15]));
    q.body.add(cone(0.07, h, dark, 'horn', [x, q.r * 0.95 + h * 0.3 + (heavy ? 0.05 : 0), 0], [0, 0, 0.45], 4)); }
  q.body.scale.y *= heavy ? 0.9 : 0.82; // smukły tułów, nie beczka
  const hit = q.hit, nl = ser ? 1.35 : heavy ? 0.8 : 1;
  const nk = [[0, 0, 0], [0.18 * nl, 0.3 * nl, 0], [0.3 * nl, 0.62 * nl - hit * 0.2, 0], [0.45 * nl + hit * 0.2, 0.8 * nl - hit * 0.3, 0]];
  q.neck.add(tube(nk, heavy ? 0.22 : 0.17, ser ? 0.08 : 0.11, col, K, 2));
  for (let i = 1; i < 4; i++) q.neck.add(cone(0.05, ser ? 0.3 : 0.2, dark, 'horn', [nk[i][0] - 0.08, nk[i][1] + 0.08, 0], [0, 0, 0.6], 4)); // kolce szyi
  const head = joint(q.neck, nk[3], -0.35 - hit * 0.4), hs = heavy ? 1.5 : fae ? 1.1 : 1.35;
  head.scale.setScalar(hs);
  head.add(box(0.26, 0.15, 0.2, col, K, [0.02, 0.01, 0], [0, 0, 0.1])); // czaszka
  head.add(box(0.28, 0.09, 0.14, col, K, [0.24, -0.02, 0], [0, 0, -0.08])); // pysk
  for (const z of [-1, 1]) {
    head.add(box(0.14, 0.04, 0.05, dark, K, [0.08, 0.08, 0.08 * z], [0, 0.25 * z, -0.35])); // łuk brwiowy
    head.add(sph(0.022, L.eyes || '#ffd040', 'glow', [0.1, 0.05, 0.09 * z], [1.4, 0.6, 1]));
    for (let t = 0; t < 4; t++) head.add(cone(0.012, 0.05, '#f0e8d0', 'horn', [0.14 + t * 0.07, -0.08, 0.055 * z], [Math.PI, 0, 0], 4)); // zęby
    const hr = heavy ? [[-0.06, 0.08, 0.09 * z], [-0.16, 0.2, 0.18 * z], [-0.12, 0.3, 0.26 * z], [0.0, 0.26, 0.24 * z]]
      : ser ? [[-0.06, 0.08, 0.07 * z], [-0.3, 0.2, 0.12 * z], [-0.6, 0.28, 0.14 * z], [-0.85, 0.3, 0.12 * z]]
      : [[-0.05, 0.08, 0.07 * z], [-0.22, 0.18, 0.11 * z], [-0.42, 0.26, 0.1 * z]];
    head.add(tube(hr, heavy ? 0.06 : 0.045, 0.006, cry ? (L.gem || horn) : horn, cry ? 'gem' : 'horn'));
    if (ser) head.add(tube([[-0.05, 0.02, 0.09 * z], [-0.3, 0.05, 0.16 * z], [-0.5, 0.02, 0.2 * z]], 0.03, 0.004, horn, 'horn')); // drugie rogi
    head.add(cone(0.02, 0.1, dark, 'horn', [-0.02, -0.08, 0.1 * z], [0, 0, -2.2], 4)); // kolce żuchwy
  }
  const jaw = joint(head, [0.08, -0.07, 0], -hit * 0.7); jaw.add(box(0.28, 0.05, 0.12, DK(col, 0.15), K, [0.15, -0.03, 0]));
  for (const z of [-1, 1]) for (let t = 0; t < 3; t++) jaw.add(cone(0.012, 0.045, '#f0e8d0', 'horn', [0.1 + t * 0.07, 0.02, 0.05 * z], null, 4));
  if (hit > 0.4 && !bony) head.add(sph(0.18, L.breathCol || '#ffb040', 'glow', [0.6, -0.05, 0], [2.2, 0.7, 0.9])); // zionięcie
  const tl = [[0, 0, 0], [-0.4, -0.15, 0], [-0.8, -0.35, 0.1], [-1.15, -0.45, 0], [-1.45 * (ser ? 1.2 : 1), -0.35, -0.1]];
  q.tail.add(tube(tl, heavy ? 0.26 : 0.2, 0.03, col, K, 2));
  for (let i = 1; i < 4; i++) q.tail.add(cone(0.05, 0.22, dark, 'horn', [tl[i][0], tl[i][1] + 0.16, tl[i][2]], [0, 0, 0.5], 4));
  const tip = tl[4];
  if (heavy) { q.tail.add(sph(0.12, dark, 'horn', tip)); for (let i = 0; i < 6; i++) q.tail.add(cone(0.03, 0.14, horn, 'horn', tip, [i, i * 2, i * 3], 4)); }
  else q.tail.add(mesh(new THREE.ConeGeometry(0.16, 0.45, 4), cry ? (L.gem || horn) : dark, cry ? 'gem' : 'horn', [tip[0] - 0.12, tip[1], tip[2]], [0, 0, Math.PI / 2], [1, 1, 0.25])); // ostrze ogona
  // skrzydła: postrzępione błony z pazurami (smok baśniowy: skrzydła motyla)
  const wl = joint(q.body, [0.15, q.r * 0.8, 0]), W = L.wing || DK(col, 0.1), flap = P.walk != null ? Math.sin(P.walk * Math.PI * 4) * 0.4 : Math.sin((P.t || 0) * 2) * 0.1 + (P.atk != null ? Math.sin(P.atk * Math.PI) * 0.3 : 0);
  const span = ser ? 2.1 : heavy ? 1.4 : cry ? 1.3 : fae ? 1.2 : 1.7;
  for (const z of [-1, 1]) {
    const w = joint(wl, [0, 0, 0.18 * z]); w.rotation.set((0.9 + flap) * z, -0.4 * z, 0.35), w.scale.setScalar(span);
    if (fae) { for (const [a, r] of [[0.5, 0.55], [-0.4, 0.4]]) w.add(sheet([[0, 0], [-r * Math.cos(a) * 0.4, r * 0.9], [-r * 1.3, r * Math.sin(a) + 0.2], [-r * 1.1, r * Math.sin(a) - 0.25]], L.wing || '#e0c0ff', 'glow', [0, 0, 0])); continue; }
    const pts = [[0, 0], [-0.3, 0.48], [-0.8, 0.68], [-0.6, 0.34], [-0.95, 0.2], [-0.62, 0.04], [-0.82, -0.22], [-0.42, -0.08], [-0.35, -0.3], [-0.1, -0.15]];
    if (!bony) w.add(sheet(pts, W, 'skin', [0, 0, 0]));
    for (const k of [2, 4, 6, 8]) w.add(tube([[0, 0, 0], [pts[k][0] * 0.5, pts[k][1] * 0.6 + 0.08, 0], pts[k].concat(0)], 0.025, 0.006, bony ? col : DK(W, 0.35), bony ? 'bone' : 'skin'));
    w.add(cone(0.02, 0.1, horn, 'horn', [-0.3, 0.5, 0], [0, 0, 0.6], 4)); // pazur na zgięciu skrzydła
  }
  root.scale.setScalar(1.12 * (L.size || 1));
  return root;
}
function hydra(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#4a7a4a', n = L.heads || 5, t = P.t || 0, hit = P.atk != null ? Math.sin(P.atk * Math.PI) : 0;
  const q = quadBody(root, { col, kind: 'scale', len: 1.1, legH: 0.42, r: 0.36, paws: true, chest: 1.1, belly: LT(col, 0.3) }, P);
  q.tail.add(tube([[0, 0, 0], [-0.4, -0.2, 0], [-0.75, -0.3, 0.1], [-1.0, -0.25, 0]], 0.18, 0.03, col, 'scale', 2));
  for (let k = 0; k < n; k++) {
    const f = k / (n - 1), a = 0.25 + f * 1.25, sw = Math.sin(t * 2 + k) * 0.05, reach = hit * (k % 2 ? 0.3 : 0.15), z = (k % 2 ? 1 : -1) * 0.12 * (1 - Math.abs(f - 0.5));
    const L1 = 0.95 + (k % 2) * 0.15, pts = [[0, 0, 0], [Math.cos(a) * 0.25, Math.sin(a) * 0.25, z * 0.5], [Math.cos(a) * L1 * 0.75 + reach, Math.sin(a) * L1 * 0.8 + sw, z], [Math.cos(a) * L1 + reach * 1.5 + 0.08, Math.sin(a) * L1 + 0.1 + sw, z]];
    q.neck.add(tube(pts, 0.09, 0.06, col, 'scale', 2));
    const h = joint(q.neck, pts[3], -0.3); h.add(sph(0.12, col, 'scale', [0, 0, 0], [1.4, 0.9, 0.9])); h.add(cap(0.06, 0.14, DK(col, 0.1), 'scale', [0.16, -0.03, 0], [0, 0, Math.PI / 2])); for (const zz of [-1, 1]) h.add(cone(0.02, 0.1, DK(col, 0.4), 'horn', [-0.06, 0.08, 0.05 * zz], [0, 0, 1.2], 5));
    for (const z of [-1, 1]) h.add(sph(0.018, '#f0e040', 'glow', [0.08, 0.04, 0.06 * z]));
  }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Bazyliszek: długi, niski jaszczur z kolcami na grzbiecie i świecącymi oczami
function lizard(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#6a7a3a';
  const q = quadBody(root, { col, kind: 'scale', len: 1.15, legH: 0.34, r: 0.22, paws: true, belly: LT(col, 0.35) }, P);
  for (let i = 0; i < 8; i++) q.body.add(cone(0.04, 0.16, L.spikes || DK(col, 0.4), 'horn', [-0.55 + i * 0.16, q.r * 0.95, 0], [0, 0, 0.3], 5));
  const hit = q.hit, head = joint(q.neck, [0.05, -0.02, 0], -0.1 - hit * 0.2);
  head.add(sph(0.14, col, 'scale', [0.1, 0, 0], [1.5, 0.8, 1])); head.add(cap(0.06, 0.12, DK(col, 0.1), 'scale', [0.3, -0.03, 0], [0, 0, Math.PI / 2], [1, 1, 1.1]));
  for (const z of [-1, 1]) head.add(sph(0.03, L.eyes || '#f0e040', 'glow', [0.18, 0.06, 0.08 * z]));
  q.tail.add(tube([[0, 0, 0], [-0.35, -0.1, 0], [-0.7, -0.2, 0.15], [-1.0, -0.22, 0]], 0.13, 0.02, col, 'scale', 2));
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Ważka: długi odwłok, tułów, wielkie oczy, cztery przezroczyste skrzydła, cienkie nogi
function insect(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#3a7ac8', t = P.t || 0, hover = Math.sin(t * 5) * 0.04, A = P.atk;
  const body = joint(root, [0, 1.0 + hover, 0], A != null ? -Math.sin(A * Math.PI) * 0.4 : 0);
  body.add(sph(0.14, col, 'scale', [0, 0, 0], [1.4, 1, 1])); body.add(tube([[-0.15, 0, 0], [-0.5, -0.02, 0], [-0.85, 0.02, 0], [-1.1, 0.08, 0]], 0.07, 0.03, col, 'scale', 3));
  for (let i = 0; i < 6; i++) body.add(torus(0.07 - i * 0.006, 0.01, DK(col, 0.4), 'scale', [-0.25 - i * 0.14, 0, 0], [0, Math.PI / 2, 0]));
  body.add(sph(0.1, col, 'scale', [0.2, 0.02, 0])); for (const z of [-1, 1]) body.add(sph(0.08, L.eyes || '#a0f070', 'gem', [0.25, 0.05, 0.06 * z]));
  const wc = L.wing || '#d0ecff', fl = Math.sin(t * 20 + (P.walk || 0) * 20) * 0.3;
  for (const z of [-1, 1]) for (const [x, s] of [[0.05, 1], [-0.1, 0.85]]) { const w = sheet([[0, 0], [-0.15, 0.05], [-0.6, 0.08], [-0.75, 0.02], [-0.6, -0.05], [-0.15, -0.04]].map(([a, b]) => [a * s, b * s]), wc, 'gem', [x, 0.1, 0.05 * z], [Math.PI / 2 * z + fl * z, 0.4 * z, Math.PI / 2 * z]); w.material.transparent = false; body.add(w); }
  for (let i = 0; i < 3; i++) for (const z of [-1, 1]) { const lg = joint(body, [0.05 - i * 0.07, -0.08, 0.05 * z], 0.3 - i * 0.3); bone(lg, 0.012, 0.008, 0.25, DK(col, 0.3), 'scale'); }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Oko: unosząca się kula z wielkim okiem, paszczą i szypułkami z małymi oczami
function eyeBeast(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#8a5a7a', t = P.t || 0, hover = Math.sin(t * 2) * 0.06, hit = P.atk != null ? Math.sin(P.atk * Math.PI) : 0;
  const b = joint(root, [0, 1.0 + hover, 0]); b.add(sph(0.42, col, 'skin', [0, 0, 0], [1, 0.95, 0.95]));
  b.add(sph(0.2, '#f4f0e0', 'skin', [0.3, 0.05, 0], [0.6, 1, 1])); b.add(sph(0.1, L.eyes || '#f0e060', 'glow', [0.4, 0.05, 0], [0.5, 1, 1])); b.add(sph(0.05, '#101010', 'skin', [0.45, 0.05, 0], [0.4, 1, 0.6]));
  b.add(torus(0.18, 0.04, DK(col, 0.3), 'skin', [0.32, 0.05, 0], [0, Math.PI / 2, 0])); // powieka
  b.add(sph(0.2, '#2a0a10', 'skin', [0.28, -0.22, 0], [0.5, 0.35 + hit * 0.2, 1])); for (let i = 0; i < 6; i++) b.add(cone(0.02, 0.06, '#f0e8d0', 'horn', [0.36, -0.17, -0.15 + i * 0.06], [0, 0, Math.PI], 5));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, w = Math.sin(t * 3 + i) * 0.08; const p0 = [-0.05, 0.3, 0], dir = [Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.35];
    const pts = [[p0[0] + dir[0] * 0.4, p0[1] + 0.05, dir[2] * 0.6], [p0[0] + dir[0] + w, p0[1] + 0.3, dir[2] * 1.1], [p0[0] + dir[0] * 1.3 + w, p0[1] + 0.5, dir[2] * 1.3]];
    b.add(tube(pts, 0.03, 0.02, col, 'skin')); b.add(sph(0.045, '#f4f0e0', 'skin', pts[2])); b.add(sph(0.022, L.orb || '#e0a0ff', 'glow', [pts[2][0] + 0.03, pts[2][1], pts[2][2]])); }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Upiór: kaptur i szata przechodzące w strzępy, blade dłonie, świecące oczy, kosa
function ghost(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#c8d0e8', t = P.t || 0, hover = Math.sin(t * 2.2) * 0.06, A = P.atk, hit = A != null ? Math.sin(A * Math.PI) : 0;
  const b = joint(root, [0, 0.45 + hover, 0], -hit * 0.2);
  b.add(lathe([[0.001, 1.25], [0.14, 1.2], [0.2, 1.05], [0.22, 0.8], [0.3, 0.4], [0.35, 0.05], [0.25, -0.2], [0.001, -0.25]], col, 'cloth', [0, 0, 0], [1, 1, 1], 2, [7, 0.2, 0.4, -0.25]));
  b.add(mesh(new THREE.SphereGeometry(0.2, 20, 14, Math.PI * 1.32, Math.PI * 1.36), DK(col, 0.15), 'cloth', [0.02, 1.28, 0])); b.add(sph(0.15, '#101018', 'skin', [0.06, 1.26, 0], [0.9, 1, 0.9]));
  for (const z of [-0.05, 0.05]) b.add(sph(0.025, L.eyes || '#a0ffc0', 'glow', [0.16, 1.28, z]));
  if (L.longHair) b.add(cap(0.12, 0.5, L.longHair, 'hair', [-0.12, 1.05, 0], [0, 0, -0.1], [0.8, 1, 1.4]));
  const arm = joint(b, [0.05, 1.0, 0.2], 0.9 + hit * 0.8 - (A != null && A < 0.4 ? A * 2 : 0)); bone(arm, 0.07, 0.05, 0.5, col, 'cloth'); arm.add(sph(0.05, '#e8e8f0', 'skin', [0, -0.52, 0]));
  if (L.scythe) { const h = joint(arm, [0, -0.52, 0], -1.4); h.add(cyl(0.02, 0.02, 1.6, '#3a2a1a', 'wood', [0, 0.3, 0])); h.add(mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 20, Math.PI * 0.55), '#c8ccd4', 'metal', [0.35, 1.05, 0], [0, 0, Math.PI * 0.5], [1, 1, 0.4])); }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Drzewiec: pień z korą i twarzą, gałęzie jako ręce, korzenie jako nogi, korona liści
function treant(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#6a4a2a', lv = L.leaves || '#4a8a3a', t = P.t || 0, walking = P.walk != null, ph = (P.walk || 0) * Math.PI * 2, hit = P.atk != null ? Math.sin(P.atk * Math.PI) : 0;
  for (const z of [-1, 1]) { const lg = joint(root, [0, 0.55, 0.15 * z], walking ? Math.sin(ph) * 0.3 * z : 0); bone(lg, 0.13, 0.1, 0.5, col, 'bark'); for (let k = 0; k < 3; k++) lg.add(tube([[0, -0.48, 0], [0.1 + k * 0.05, -0.55, (k - 1) * 0.08], [0.22 + k * 0.05, -0.55, (k - 1) * 0.14]], 0.05, 0.015, col, 'bark')); }
  const trunk = joint(root, [0, 0.55, 0], -hit * 0.15);
  trunk.add(lathe([[0.2, -0.05], [0.24, 0.3], [0.21, 0.7], [0.25, 1.0], [0.3, 1.15], [0.001, 1.2]], col, 'bark', [0, 0, 0], [1, 1, 0.9], 2));
  for (const z of [-0.07, 0.07]) trunk.add(sph(0.03, '#f0e070', 'glow', [0.2, 0.8, z])); trunk.add(box(0.03, 0.03, 0.14, '#1a1008', 'bark', [0.22, 0.62, 0]));
  for (const z of [-1, 1]) { const arm = joint(trunk, [0.02, 0.95, 0.24 * z], 0.6 + hit * 1.2 * (z > 0 ? 1 : 0.5)); bone(arm, 0.08, 0.05, 0.55, col, 'bark'); for (let k = 0; k < 3; k++) arm.add(tube([[0, -0.52, 0], [0.05, -0.65, (k - 1) * 0.06], [0.12, -0.72, (k - 1) * 0.1]], 0.025, 0.008, col, 'bark')); arm.add(sph(0.12, lv, 'fur', [0, -0.25, 0], [1, 0.8, 1])); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; trunk.add(sph(0.2 + (i % 3) * 0.04, i % 2 ? lv : LT(lv, 0.12), 'fur', [Math.cos(a) * 0.22 - 0.05, 1.3 + Math.sin(i * 2.3) * 0.12 + Math.sin(t * 2 + i) * 0.01, Math.sin(a) * 0.25])); }
  trunk.add(sph(0.26, DK(lv, 0.1), 'fur', [-0.05, 1.5, 0]));
  root.scale.setScalar(L.size || 1);
  return root;
}
