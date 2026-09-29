// ==================== MODELE 3D: ZWIERZĘTA I POTWORY ===========================================
// Czworonogi (koń, wilk i jego odmiany, jednorożec, byk, centaur, jeździec), skrzydlate (gryf, ptak, feniks),
// gady (smok, hydra, bazyliszek), owad, oko z mackami, upiór i drzewiec. Patrzą w +x, stopy na y = 0.
/* global THREE, mat, mesh, joint, sph, cap, cyl, cone, box, torus, lathe, bone, tube, sheet, slab, rbox, spike, chunk, marker, DK, LT, bright, humanoid, headOf, wings, membraneWing, featherFan */

// Tułów czworonoga z nogami; o: { col, kind, len, legH, r (grubość), paws, hoofCol, rump, chest, bulk (mięśnie łopatek i ud),
// ribs (wystające żebra), noFront (bez przednich łap: wywerna), rear (staje dęba przy ataku) }. W locie łapy podkulone.
// Zwraca stawy szyi i ogona.
function quadBody(root, o, P) {
  const t = P.t || 0, walking = P.walk != null, flying = P.fly != null, ph = (walking ? P.walk : flying ? P.fly : 0) * Math.PI * 2, A = P.atk, hit = A != null ? Math.sin(Math.min(1, A) * Math.PI) : 0;
  const len = o.len || 1, legH = o.legH || 0.75, r = o.r || 0.24, col = o.col, K = o.kind || 'fur', far = DK(col, 0.22), bulk = o.bulk || 1;
  const bodyY = legH + r * 0.55, bob = walking ? Math.abs(Math.sin(ph * 2)) * 0.03 : flying ? Math.sin(ph) * 0.06 : Math.sin(t * 2) * 0.008;
  const body = joint(root, [0, bodyY + bob, 0], (o.rear ? hit * 0.4 : -hit * 0.08) - (P.hurt ? 0.1 : 0) + (flying ? 0.1 : 0));
  // tułów z przekrojów: kręgosłup, głęboka klatka, wcięta talia, szerokie łopatki i zad (bez beczki z kul)
  const ch = o.chest || 1.12, ru = o.rump || 1.05, hump = o.hump || 0, wb = 0.8 * Math.sqrt(bulk);
  body.add(loft([[len * 0.68, r * 0.4, r * 0.5, r * 0.42, 0], [len * 0.44, r * wb * ch, r * (0.95 + hump) * ch, r * 1.15 * ch, 0.1], [len * 0.14, r * wb * 0.95, r * (0.92 + hump * 0.4), r * 0.98, 0.08],
    [-len * 0.16, r * wb * 0.82, r * 0.84, r * (o.ribs ? 0.5 : 0.62), 0.06], [-len * 0.42, r * wb * ru, r * 0.96 * ru, r * 0.82 * ru, 0.1], [-len * 0.64, r * 0.4, r * 0.6, r * 0.34, 0]], col, K, 'x', [0, 0.03, 0], null, 1.5));
  if (o.ribs) for (let i = 0; i < 5; i++) body.add(torus(r * 0.86, 0.014, DK(col, 0.3), K, [len * 0.3 - i * 0.08, -0.02, 0], [0, Math.PI / 2, 0], [1.05, 1, 0.8], Math.PI * 1.1)); // żebra pod skórą
  const legs = [[len * 0.36, 1, 0, true], [len * 0.36, -1, Math.PI, true], [-len * 0.36, 1, Math.PI, false], [-len * 0.36, -1, 0, false]].filter(l => !(o.noFront && l[3]));
  for (const [x, z, p, front] of legs) {
    const c = z < 0 ? far : col, hip = joint(body, [x, -r * 0.2, z * r * 0.62]);
    const sw = walking ? Math.sin(ph + p) * 0.45 : 0, kb = walking ? Math.max(0, Math.cos(ph + p)) * (front ? -0.9 : 0.9) : 0;
    if (o.paws) { // łapa ze szponami: udo, podudzie i śródstopie (tylne zgięte jak u kota), stopa z pazurami
      const seg = front ? [[0.46, -0.08], [0.34, 0.2], [0.2, -0.12]] : [[0.44, 0.5], [0.36, -1.05], [0.2, 0.6]], target = legH + r * 0.35 - r * 0.14;
      let v = 0, acc = 0; for (const [f, a] of seg) { acc += a; v += f * Math.cos(acc); } const Lt = target / v;
      hip.rotation.z = seg[0][1] + (flying ? (front ? -0.6 : -1.3) + Math.sin(ph + p) * 0.08 : sw - (front && o.rear ? hit * 1.1 : 0) + (front && !o.rear ? hit * 0.3 : 0));
      const l0 = seg[0][0] * Lt, l1 = seg[1][0] * Lt, l2 = seg[2][0] * Lt, th = r * (front ? 0.42 : 0.52) * bulk;
      bone(hip, th, r * 0.24, l0, c, K); hip.add(sph(th * 1.1, c, K, [front ? 0.02 : -0.02, -l0 * 0.3, 0], [1, 1.5, 0.8])); // mięsień uda
      const kn = joint(hip, [0, -l0, 0], seg[1][1] + (flying ? (front ? 1.4 : -0.3) : kb - (front && o.rear ? hit * 1.2 : 0)));
      bone(kn, r * 0.24, r * 0.17, l1, c, K);
      const an = joint(kn, [0, -l1, 0], seg[2][1] + (flying ? 0.6 : 0)); bone(an, r * 0.17, r * 0.15, l2, c, K);
      const ft = joint(an, [0, -l2, 0], -(seg[0][1] + seg[1][1] + seg[2][1]) - (flying ? 0.5 : 0)); ft.add(sph(r * 0.3, c, K, [r * 0.14, -r * 0.08, 0], [1.5, 0.55, 1.1]));
      for (let k = -1; k <= 1; k++) ft.add(spike(0.018 * bulk, 0.11 * bulk, o.claw || '#e8e0d0', 'horn', [r * 0.5, -r * 0.14, k * 0.045], [0, 0, -1.95]));
      if (o.dewclaw) ft.add(spike(0.015, 0.08, o.claw || '#e8e0d0', 'horn', [-r * 0.2, r * 0.05, 0], [0, 0, 2.2]));
      continue;
    }
    hip.rotation.z = flying ? (front ? -0.5 : -1.1) + Math.sin(ph + p) * 0.08 : sw - (front && o.rear ? hit * 1.1 : 0) + (front && !o.rear ? hit * 0.3 : 0);
    const upL = legH * 0.52, loL = legH * 0.48 - r * 0.2;
    bone(hip, r * (front ? 0.42 : 0.5) * bulk, r * 0.26, upL, c, K);
    const kn = joint(hip, [0, -upL, 0], flying ? (front ? 1.5 : -0.5) : kb - (front && o.rear ? hit * 1.2 : 0));
    bone(kn, r * 0.26, r * 0.2, loL + r * 0.15, c, K);
    kn.add(cyl(r * 0.24, r * 0.28, r * 0.35, o.hoofCol || '#2a2018', 'horn', [0, -loL - r * 0.1, 0]));
    kn.add(sph(r * 0.3, c, K, [0, -loL * 0.72, 0], [1, 1.2, 0.9])); // pęcina
    if (o.hoofFire) for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; kn.add(cone(0.035, 0.12 + (i % 2) * 0.06, i % 2 ? o.hoofFire : LT(o.hoofFire, 0.4), 'fire', [Math.cos(a) * r * 0.25, -loL - r * 0.05, Math.sin(a) * r * 0.25], [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], 5)); } // płonące kopyta
  }
  return { body, neck: joint(body, [len * 0.5, r * 0.45, 0]), tail: joint(body, [-len * 0.55, r * 0.35, 0]), hit, bodyY, r, len, flying, ph };
}
// Łeb konia z brył (kanciasta czaszka, długi pysk, żuchwa, łuki brwiowe) i szarpana grzywa; koszmar (nightmare): płonąca
// grzywa, świecące oczy, stalowy naczółek z kolcem. W układzie łba +y biegnie ku chrapom, −x to czoło
function horseHead(neck, col, mane, P, o = {}) {
  const hit = P.atk != null ? Math.sin(Math.min(1, P.atk) * Math.PI) : 0, t = P.t || 0, dark = DK(col, 0.3), nm = o.nightmare;
  neck.rotation.z = -0.5 + hit * 0.25; neck.add(loft([[-0.05, 0.12, 0.17, 0.13, 0], [0.28, 0.09, 0.13, 0.1, 0], [0.56, 0.07, 0.1, 0.08, 0]], col, 'fur', 'y')); // szyja
  if (nm) for (let i = 0; i < 8; i++) neck.add(cone(0.05, 0.24 + (i % 3) * 0.08 + Math.sin(t * 8 + i) * 0.03, i % 2 ? mane : LT(mane, 0.4), 'fire', [-0.11, 0.06 + i * 0.07, 0], [0, 0, 1.2 - i * 0.04], 6)); // płonąca grzywa
  else neck.add(slab([[0, -0.05], [-0.07, 0.05], [-0.04, 0.16], [-0.09, 0.26], [-0.05, 0.36], [-0.1, 0.46], [-0.05, 0.6], [0.02, 0.62], [0.02, -0.05]], 0.06, mane, 'hair', [-0.08, 0.0, 0])); // grzywa
  const head = joint(neck, [0, 0.54, 0], -1.75);
  head.add(rbox(0.19, 0.2, 0.16, 0.04, col, 'fur', [0, 0.07, 0])); head.add(rbox(0.13, 0.27, 0.12, 0.04, col, 'fur', [0.02, 0.29, 0])); // czaszka i pysk
  head.add(rbox(0.1, 0.16, 0.14, 0.03, dark, 'fur', [0.07, 0.1, 0])); head.add(rbox(0.09, 0.08, 0.11, 0.03, DK(col, 0.4), 'fur', [0.03, 0.42, 0])); // policzek i chrapy
  const eye = o.eyes || '#140c06', eK = o.eyes ? 'glow' : 'skin';
  for (const z of [-1, 1]) { head.add(rbox(0.05, 0.08, 0.03, 0.01, dark, 'fur', [-0.07, 0.07, 0.075 * z], [0, 0, 0.3])); head.add(sph(0.022, eye, eK, [-0.03, 0.08, 0.08 * z], [0.8, 1.3, 0.7])); head.add(sph(0.014, '#0a0604', 'skin', [0.02, 0.45, 0.045 * z]));
    head.add(slab([[0, 0], [0.03, 0.04], [-0.14, 0.02]], 0.02, col, 'fur', [-0.08, -0.02, 0.05 * z], [0.3 * z, 0, 0])); } // uszy
  if (nm) { head.add(rbox(0.03, 0.34, 0.13, 0.01, o.plate || '#3a3440', 'iron', [-0.095, 0.2, 0])); head.add(spike(0.035, 0.26, '#d8d0c0', 'horn', [-0.16, 0.1, 0], [0, 0, 0.9])); for (const z of [-1, 1]) head.add(spike(0.02, 0.1, o.plate || '#3a3440', 'steel', [-0.08, 0.0, 0.07 * z], [0.6 * z, 0, 1.5])); } // naczółek z kolcami
  else head.add(slab([[0, 0], [0.04, 0.05], [-0.06, 0.12], [-0.02, 0.02]], 0.05, mane, 'hair', [-0.08, 0.0, 0])); // grzywka
  const jaw = joint(head, [0.08, 0.2, 0], -hit * 0.25); jaw.add(rbox(0.05, 0.2, 0.09, 0.02, dark, 'fur', [0, 0.08, 0]));
  if (o.bridle) { head.add(torus(0.09, 0.008, '#3a2414', 'leather', [0.01, 0.3, 0], [Math.PI / 2, 0, 0], [1.1, 1, 0.8])); head.add(torus(0.1, 0.008, '#3a2414', 'leather', [0, 0.1, 0], [Math.PI / 2, 0, 0], [1.1, 1, 0.9])); }
  if (o.horn) { head.add(tube([[-0.1, 0.05, 0], [-0.2, 0.18, 0], [-0.32, 0.32, 0]], 0.03, 0.004, o.horn, 'horn')); for (let i = 0; i < 4; i++) head.add(torus(0.026 - i * 0.005, 0.005, DK(o.horn, 0.2), 'horn', [-0.13 - i * 0.045, 0.09 + i * 0.055, 0], [0, 0, -0.85], null)); } // spiralny róg
  return head;
}
// Koń (jednorożec, rumak jeźdźca); nightmare: koszmarny rumak w kolczastej zbroi płytowej, z płonącą grzywą, ogonem i kopytami
function horse(L, P, o = {}) {
  const root = new THREE.Group(), col = L.horse || L.fur || '#7a4a26', mane = L.mane || DK(col, 0.6), nm = !!L.nightmare, plate = L.metal || '#3a3440';
  const q = quadBody(root, { col, len: nm ? 1.15 : 1.05, legH: nm ? 0.86 : 0.8, r: nm ? 0.28 : 0.25, rear: true, bulk: nm ? 1.2 : 1, hump: 0.08, chest: 1.18, hoofFire: nm ? mane : null }, P);
  horseHead(q.neck, col, mane, P, { bridle: o.saddle, horn: o.horn, nightmare: nm, eyes: nm ? L.eyes || mane : null, plate });
  if (nm) for (let i = 0; i < 6; i++) q.tail.add(cone(0.05, 0.35 + (i % 3) * 0.12, i % 2 ? mane : LT(mane, 0.4), 'fire', [-0.08 - i * 0.02, -0.15 - i * 0.05, (i - 2.5) * 0.02], [0, 0, 2.7 - i * 0.08], 6)); // płonący ogon
  else q.tail.add(tube([[0, 0, 0], [-0.12, -0.1, 0], [-0.2, -0.4, 0], [-0.18, -0.65, 0]], 0.06, 0.03, mane, 'hair'));
  if (o.saddle) {
    q.body.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.46, 18, 1, true, -Math.PI / 2, Math.PI), o.saddle, 'leather', [0.02, 0.06, 0], [Math.PI / 2, 0, 0], [1, 1, 1.02]));
    if (L.barding && !nm) { const bd = mesh(new THREE.CylinderGeometry(0.29, 0.33, 1.05, 20, 1, true, -Math.PI * 0.6, Math.PI * 1.2), L.barding, 'cloth', [0, -0.02, 0], [0, 0, Math.PI / 2], [1, 1, 0.95]); bd.material = bd.material.clone(); bd.material.side = THREE.DoubleSide; q.body.add(bd); if (L.trim) q.body.add(torus(0.3, 0.012, L.trim, 'gold', [0.52, -0.02, 0], [0, Math.PI / 2, 0], [1, 1.05, 1])); }
  }
  if (nm) { // zbroja rumaka: płyty na bokach i zadzie z kolcami, napierśnik z kolcami, czaprak w barwie jeźdźca
    for (const z of [-1, 1]) for (let i = 0; i < 4; i++) { const x = 0.42 - i * 0.26; q.body.add(rbox(0.24, 0.24, 0.04, 0.02, i % 2 ? plate : DK(plate, 0.15), 'iron', [x, -0.02, z * q.r * 0.82], [0.12 * z, 0, 0])); q.body.add(spike(0.03, 0.16, '#c8c0b0', 'steel', [x, 0.02, z * q.r * 0.98], [Math.PI / 2 * z, 0, 0])); }
    q.body.add(rbox(0.06, 0.34, 0.4, 0.02, plate, 'iron', [q.len * 0.6, -0.04, 0], [0, 0, -0.2])); for (const z of [-0.12, 0, 0.12]) q.body.add(spike(0.035, 0.22, '#c8c0b0', 'steel', [q.len * 0.66, 0.0, z], [0, 0, -Math.PI / 2 + 0.2]));
    if (L.barding) { const bd = mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.7, 20, 1, true, -Math.PI * 0.55, Math.PI * 1.1), L.barding, 'cloth', [-0.1, -0.05, 0], [0, 0, Math.PI / 2], [1, 1, 1]); bd.material = bd.material.clone(); bd.material.side = THREE.DoubleSide; q.body.add(bd); }
  }
  return { root, q };
}
// Jeździec: koń w siodle z humanoidem (nogi zgięte na boki)
function rider(L, P = {}) {
  const { root, q } = horse(L, P, { saddle: L.barding ? DK(L.barding, 0.3) : '#5a2a1a' });
  const man = humanoid({ ...L, mounted: true, size: 0.92, shield: L.shield, cape: L.cape }, { t: P.t, atk: P.atk, hurt: P.hurt });
  man.position.set(0.02, q.r * 0.75 - (0.1 + 0.69 * buildOf(L).legL) * 0.92, 0); q.body.add(man); // biodra jeźdźca w siodle
  if (L.size && !L.banner) root.scale.setScalar(L.size);
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
  const hit = P.atk != null ? Math.sin(Math.min(1, P.atk) * Math.PI) : 0, snarl = 0.12 + hit * 0.55, head = joint(neck, [0, 0, 0], -0.4 - hit * 0.3);
  head.add(sph(0.13, col, 'fur', [0.04, 0.02, 0], [1.1, 0.95, 0.9]));
  head.add(rbox(0.2, 0.09, 0.11, 0.03, col, 'fur', [0.2, -0.015, 0], [0, 0, -0.08])); head.add(sph(0.03, '#141010', 'skin', [0.3, -0.005, 0]));
  head.add(rbox(0.1, 0.03, 0.18, 0.01, DK(col, 0.2), 'fur', [0.1, 0.075, 0], [0, 0, -0.3])); // łuk brwiowy: groźne spojrzenie
  const jaw = joint(head, [0.1, -0.06, 0], -snarl); jaw.add(rbox(0.19, 0.04, 0.09, 0.015, DK(col, 0.15), 'fur', [0.1, -0.01, 0])); jaw.add(box(0.15, 0.012, 0.07, '#6a1a1a', 'skin', [0.1, 0.012, 0]));
  for (const z of [-0.03, 0.03]) { head.add(spike(0.012, 0.055, '#f4ecd8', 'horn', [0.25, -0.065, z], [Math.PI, 0, 0])); jaw.add(spike(0.01, 0.045, '#f4ecd8', 'horn', [0.16, 0.02, z])); } // kły
  for (let k = 0; k < 3; k++) for (const z of [-0.04, 0.04]) head.add(spike(0.006, 0.025, '#f0e8d8', 'horn', [0.14 + k * 0.035, -0.06, z], [Math.PI, 0, 0]));
  const eye = L.eyes || '#e0c040', gl = bright(eye) ? 'glow' : 'skin';
  for (const z of [-1, 1]) { head.add(sph(0.02, eye, gl, [0.15, 0.05, 0.065 * z], [1.2, 0.6, 1])); if (!o.noEars) head.add(slab([[0, 0], [0.05, 0], [-0.02, 0.14]], 0.015, col, 'fur', [-0.02, 0.1, 0.07 * z], [0.3 * z, 0, 0.1])); }
  if (L.horns) for (const z of [-1, 1]) head.add(tube([[0, 0.08, 0.08 * z], [-0.05, 0.2, 0.14 * z], [-0.18, 0.26, 0.12 * z], [-0.25, 0.2, 0.1 * z]], 0.04, 0.008, L.horns, 'horn'));
  marker(head, 'mouth', [0.32, -0.05, 0]);
  return head;
}
// Wilk i jego odmiany: ogniste ogary (flame: chude, żebra, płonąca grzywa), trójgłowy pies (heads), warg (stripes: masywny,
// zjeżona sierść), mantykora (mane + wings + stinger: lwia grzywa, skrzydła nietoperza, ogon skorpiona)
function wolf(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#7a7470', mant = !!L.stinger, fire = !!L.flame, warg = !!L.stripes;
  const q = quadBody(root, { col, len: mant ? 1.0 : warg ? 0.95 : 0.85, legH: mant ? 0.58 : 0.52, r: mant ? 0.23 : warg ? 0.23 : fire ? 0.16 : 0.19, paws: true, chest: mant || warg ? 1.3 : 1.12, rump: fire ? 0.85 : 1, bulk: warg || mant ? 1.2 : fire ? 0.8 : 1, ribs: fire, belly: warg || fire ? null : LT(col, 0.15) }, P);
  if (warg) for (let i = 0; i < 6; i++) q.body.add(torus(q.r * 1.02, 0.02, L.stripes, 'fur', [-q.len * 0.35 + i * q.len * 0.14, 0.03, 0], [0, Math.PI / 2, 0], [1, 1, 0.9], Math.PI));
  const ruff = L.mane || (warg ? DK(col, 0.15) : fire ? null : DK(col, 0.08));
  if (!fire) for (let i = 0; i < 9; i++) { const x = -q.len * 0.45 + i * q.len * 0.11, h = (warg ? 0.16 : 0.1) * (1 - Math.abs(i - 6) * 0.08); q.body.add(spike(0.04, h, i % 2 ? col : DK(col, 0.2), 'fur', [x, q.r * 0.88, 0], [0, 0, 0.7])); } // zjeżona sierść na grzbiecie
  const heads = L.heads || 1;
  for (let k = 0; k < heads; k++) {
    const m = heads > 1 ? k - (heads - 1) / 2 : 0, z = m * 0.2, nk = joint(q.neck, [m * 0.05 - Math.abs(m) * 0.04, -m * 0.1, z], -0.65 - m * 0.4);
    nk.add(cap(q.r * 0.6, 0.16, col, 'fur', [0, 0.1, 0], null, [1, 1, 0.8])); const hd = joint(nk, [0.02, 0.22, 0], 0.7); canineHead(hd, L, P, col);
    if (fire) for (let i = 0; i < 4; i++) nk.add(cone(0.045, 0.22 + (i % 2) * 0.08, i % 2 ? L.flame : LT(L.flame, 0.35), 'fire', [-0.05, 0.08 + i * 0.05, 0], [0, 0, 1.0 + i * 0.12], 6)); // płonąca grzywa
  }
  if (ruff) q.neck.add(sph(q.r * (mant ? 1.25 : 0.95), ruff, 'fur', [0.02, 0.12, 0], [1, 1.15, 1.25]));
  if (ruff && mant) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; q.neck.add(spike(0.06, 0.2, ruff, 'fur', [0.02 + Math.cos(a) * 0.12, 0.12 + Math.sin(a) * 0.15, Math.sin(a * 1.3) * 0.12], [0, 0, a + 1.57])); } // lwia grzywa
  if (fire) for (let i = 0; i < 9; i++) q.body.add(cone(0.055, 0.22 + (i % 3) * 0.07 + Math.sin((P.t || 0) * 8 + i) * 0.03, i % 2 ? L.flame : LT(L.flame, 0.3), 'fire', [-q.len * 0.42 + i * q.len * 0.1, q.r * 0.9, 0], [0, 0, 0.55], 6));
  if (mant) { const sw = Math.sin((P.t || 0) * 2.5) * 0.03 + (P.atk != null ? Math.sin(P.atk * Math.PI) * 0.25 : 0), st = [[0, 0, 0], [-0.3, 0.3, 0], [-0.36, 0.8, 0], [-0.12 + sw, 1.12, 0], [0.18 + sw, 1.12 - sw, 0]]; q.tail.add(tube(st, 0.075, 0.04, DK(col, 0.1), 'scale'));
    for (let i = 1; i < 4; i++) q.tail.add(torus(0.075 - i * 0.01, 0.016, DK(L.stinger, 0.1), 'horn', st[i], [0, 0, Math.PI / 2])); q.tail.add(sph(0.07, L.stinger, 'horn', st[4], [1.3, 1, 1])); q.tail.add(spike(0.045, 0.24, L.stinger, 'horn', [st[4][0] + 0.12, st[4][1] - 0.06, 0], [0, 0, -2.2])); } // ogon skorpiona nad grzbietem, żądło nad głową
  else q.tail.add(tube([[0, 0, 0], [-0.2, -0.05, 0], [-0.35, -0.2, 0], [-0.45, -0.25, 0]], fire ? 0.035 : 0.07, 0.025, fire ? L.flame : col, fire ? 'fire' : 'fur'));
  if (L.wings) { const wl = joint(q.body, [q.len * 0.26, q.r * 0.85, 0]), fl = wingFlap(P, 0.3); // skrzydła z łopatek, nie z zadu
    for (const z of [-1, 1]) { const w = joint(wl, [0, 0, 0.14 * z]); w.rotation.set((fl + (z < 0 ? 0.12 : 0)) * z, -0.3 * z, P.fly != null ? -0.35 : -0.2); w.scale.setScalar(0.95); membraneWing(w, L.wings, DK(L.wings, 0.45), 1, true, 1.2); } }
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
// Skrzydło z piór (ramię z lotkami wachlarzem, featherFan); z = strona (±1), span = rozpiętość, flap = kąt machnięcia
function featherWing(parent, z, col, span, flap, K = 'feather') {
  const w = joint(parent, [0, 0, 0.16 * z]); w.rotation.set((0.3 + flap) * z, -0.3 * z, 0.1); w.scale.setScalar(span * 0.9);
  featherFan(w, col, 1, K === 'fire'); return w;
}
// Mach skrzydeł: w locie szeroki (w dół poniżej tułowia), w marszu średni, w spoczynku lekkie drganie; przy ataku rozpostarte
const wingFlap = (P, base = 0.25) => P.fly != null ? 0.5 + Math.sin(P.fly * Math.PI * 2) * 1.0 : P.walk != null ? base + 0.1 + Math.sin(P.walk * Math.PI * 4) * 0.3 : base + Math.sin((P.t || 0) * 2) * 0.08 + (P.atk != null ? Math.sin(P.atk * Math.PI) * 0.5 : 0);
// Gryf: lwie ciało, orla głowa i skrzydła, przednie łapy ze szponami
function griffin(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#c89a4a', wh = '#f0ece0';
  const q = quadBody(root, { col, len: 0.9, legH: 0.58, r: 0.22, paws: true, chest: 1.2, rear: true }, P);
  q.neck.rotation.z = -0.4; q.neck.add(cap(0.12, 0.18, wh, 'feather', [0, 0.12, 0], null, [1, 1, 0.85]));
  const head = joint(q.neck, [0.03, 0.28, 0], -0.3); head.add(sph(0.12, wh, 'feather', [0, 0, 0], [1.1, 1, 0.9]));
  head.add(tube([[0.1, 0.0, 0], [0.2, -0.02, 0], [0.26, -0.08, 0], [0.24, -0.13, 0]], 0.05, 0.008, '#e8b040', 'horn'));
  for (const z of [-1, 1]) { head.add(sph(0.02, '#e8a020', 'gem', [0.08, 0.04, 0.08 * z])); head.add(sph(0.01, '#140c06', 'skin', [0.095, 0.04, 0.085 * z])); head.add(cone(0.03, 0.1, wh, 'feather', [-0.08, 0.06, 0.06 * z], [0, 0, 1.2], 5)); }
  q.tail.add(tube([[0, 0, 0], [-0.2, -0.1, 0], [-0.35, -0.3, 0], [-0.4, -0.45, 0]], 0.04, 0.02, col, 'fur'), sph(0.06, DK(col, 0.3), 'fur', [-0.4, -0.47, 0]));
  for (const z of [-1, 1]) featherWing(joint(q.body, [0.2, q.r * 0.7, 0]), z, col, 1.25, wingFlap(P));
  for (const z of [-1, 1]) head.add(rbox(0.08, 0.025, 0.05, 0.01, DK(wh, 0.3), 'feather', [0.07, 0.07, 0.07 * z], [0, 0, -0.3])); // groźna brew orła
  marker(head, 'mouth', [0.26, -0.06, 0]);
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
// Wielki ptak (roc, ptak gromu) i feniks: dostojna postawa orła z herbu (wyprostowany, pierś do przodu, skrzydła uniesione
// wysoko), pióropusz, potężny zakrzywiony dziób pod groźną brwią, kryza piór na karku, szpony; ogon z długich piór wachlarzem.
// Ptak gromu: błyskawice na skrzydłach; feniks: pióra z ognia, płonący pióropusz i ogon ze smug płomieni
function birdBody(L, P, o) {
  const root = new THREE.Group(), t = P.t || 0, col = o.col, wcol = o.wing || col, K = o.kind, A = P.atk, fly = P.fly != null, hit = A != null ? Math.sin(A * Math.PI) : 0;
  const legH = 0.58, pitch = fly ? 0.12 : 0.72 - hit * 0.45, H = legH + 0.14 + (fly ? 0.25 + Math.sin(P.fly * Math.PI * 2) * 0.05 : 0), fK = o.flame ? 'fire' : 'feather';
  const body = joint(root, [0, H, 0], pitch), hd = o.head || col, dark = DK(col, 0.35);
  body.add(loft([[0.44, 0.1, 0.1, 0.1, 0], [0.3, 0.2, 0.2, 0.27, 0.04], [0.06, 0.22, 0.22, 0.24, 0.06], [-0.2, 0.17, 0.17, 0.14, 0.05], [-0.42, 0.07, 0.07, 0.05, 0]], col, K, 'x', [0, 0, 0], null, 2));
  for (let r = 0; r < 3; r++) for (const z of [-1, 0, 1]) body.add(slab([[0, 0], [0.05, -0.02], [0.02, -0.12], [-0.04, -0.03]], 0.012, LT(col, 0.1 + r * 0.05), fK, [0.33 - r * 0.1, -0.12 - r * 0.03, z * 0.1], [0, z * 0.3, 0.2])); // pióra na piersi
  // szyja i głowa: głowa zawsze poziomo, patrzy na wroga
  const nr = -pitch * 0.55, nk = joint(body, [0.38, 0.1, 0], nr); nk.add(tube([[0, 0, 0], [0.06, 0.14, 0], [0.1, 0.26, 0]], 0.11, 0.085, hd, K));
  for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4; nk.add(slab([[0, 0], [0.04, 0], [-0.06, 0.16]], 0.012, i % 2 ? hd : DK(hd, 0.15), fK, [-0.02, 0.12 + Math.cos(a) * 0.02, Math.sin(a) * 0.09], [0, a * 0.4, 1.9 - nr])); } // kryza piór na karku
  const head = joint(nk, [0.1, 0.3, 0], -(pitch + nr) - 0.08 - hit * 0.25);
  head.add(rbox(0.21, 0.15, 0.15, 0.04, hd, K, [0, 0.01, 0])); head.add(rbox(0.12, 0.1, 0.13, 0.03, hd, K, [0.07, -0.03, 0]));
  const bk = o.beak || '#e0a030'; head.add(rbox(0.06, 0.06, 0.09, 0.015, LT(bk, 0.2), 'horn', [0.12, 0.0, 0])); // woskówka
  head.add(slab([[0, 0.035], [0.1, 0.04], [0.19, 0.01], [0.24, -0.05], [0.21, -0.11], [0.18, -0.05], [0.09, -0.02], [0, -0.025]], 0.07, bk, 'horn', [0.12, -0.005, 0], null, null, 0.3)); // hakowaty dziób
  const jw = joint(head, [0.14, -0.035, 0], -hit * 0.5); jw.add(slab([[0, 0.01], [0.12, 0.0], [0.08, -0.03], [0, -0.025]], 0.055, DK(bk, 0.15), 'horn'));
  for (const z of [-1, 1]) { head.add(rbox(0.1, 0.03, 0.05, 0.01, DK(hd, 0.45), K, [0.06, 0.065, 0.065 * z], [0, 0.2 * z, -0.25])); head.add(sph(0.022, o.eye || '#f0c030', o.glow ? 'glow' : 'gem', [0.07, 0.035, 0.07 * z], [1.2, 0.8, 1])); head.add(sph(0.01, '#0a0604', 'skin', [0.085, 0.035, 0.078 * z])); }
  const crest = o.crest || DK(col, 0.1); for (let i = 0; i < 5; i++) head.add(slab([[0, 0], [0.04, 0.01], [-0.3 - i * 0.04, 0.06 + i * 0.03], [-0.26 - i * 0.04, 0.02 + i * 0.02]], 0.012, i % 2 ? crest : LT(crest, 0.2), o.flame || o.glow ? (o.flame ? 'fire' : 'glow') : 'feather', [-0.06, 0.06, (i - 2) * 0.02], [0, 0, 0.25 + Math.sin(t * 3 + i) * 0.05])); // pióropusz
  marker(head, 'mouth', [0.3, -0.06, 0]);
  // skrzydła z barków (poza obrotem tułowia): w spoczynku uniesione wysoko jak w herbie
  const sx = 0.16 * Math.cos(pitch) - 0.16 * Math.sin(pitch), sy = H + 0.16 * Math.sin(pitch) + 0.16 * Math.cos(pitch), wl = joint(root, [sx, sy, 0]);
  for (const z of [-1, 1]) { const w = featherWing(wl, z, wcol, 1.95, wingFlap(P, 0.12), fK);
    if (o.bolts) for (const off of [0, 0.2]) w.add(tube([[0.02, 0.15 + off, 0.02], [0.1, 0.35 + off, 0.02], [-0.02, 0.5 + off, 0.02], [0.08, 0.7 + off, 0.02], [-0.05, 0.9 + off, 0.02]], 0.012, 0.004, o.bolts, 'glow')); } // błyskawice
  // ogon: wachlarz długich piór (feniks: smugi ognia)
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.12; body.add(slab([[0, 0], [0.05, -0.1], [0.03, -0.7 - Math.abs(i - 3) * -0.05], [0, -0.78], [-0.03, -0.6], [-0.04, -0.1]], 0.012, i % 2 ? wcol : LT(wcol, 0.12), fK, [-0.38, -0.02, a * 0.5], [a, 0, 1.3 + Math.abs(i - 3) * 0.04])); }
  if (o.flame) for (let i = 0; i < 5; i++) body.add(cone(0.05, 0.8 + i * 0.1, i % 2 ? '#ff6a1a' : '#ffc040', 'fire', [-0.7 - i * 0.05, -0.2 - i * 0.05 + Math.sin(t * 5 + i) * 0.03, (i - 2) * 0.08], [0, 0, 1.4 + i * 0.05], 6)); // smugi ognia
  // nogi: pióra na udach, łuskowate skoki, szpony (w locie podkulone)
  for (const z of [-1, 1]) {
    const lg = joint(root, [-0.02, legH + 0.08 + (fly ? 0.2 : 0), 0.1 * z], fly ? -1.3 : 0.12); lg.add(sph(0.1, col, K, [0.02, -0.06, 0], [1, 1.5, 0.9])); // udo w piórach
    bone(lg, 0.035, 0.03, legH, o.leg || '#d0a040', 'scale'); const ft = joint(lg, [0, -legH, 0], fly ? 1.3 : -0.12);
    for (let k = -1; k <= 1; k++) { ft.add(cyl(0.015, 0.018, 0.11, o.leg || '#d0a040', 'scale', [0.06, -0.01, k * 0.04], [0, 0, Math.PI / 2 + 0.2])); ft.add(spike(0.014, 0.07, '#1a1410', 'horn', [0.13, -0.03, k * 0.045], [0, 0, -2.3])); }
    ft.add(spike(0.014, 0.08, '#1a1410', 'horn', [-0.06, -0.02, 0], [0, 0, 2.2]));
  }
  return root;
}
function bird(L, P = {}) { const r = birdBody(L, P, { col: L.fur, wing: L.wing, head: L.head, beak: L.beak, kind: 'feather', glow: L.glow, bolts: L.glow, crest: L.crest || (L.glow ? L.glow : null) }); r.scale.setScalar(1.1 * (L.size || 1)); return r; }
function phoenix(L, P = {}) { const r = birdBody(L, P, { col: '#e8501a', wing: '#f08a20', head: '#f8b030', beak: '#ffe070', kind: 'fire', flame: true, eye: '#fff8c0', crest: '#ffd060', leg: '#e8a040' }); r.scale.setScalar(1.05 * (L.size || 1)); return r; }

// Smok: kanciasta głowa z łukami brwiowymi, kryzą kolców za żuchwą, rogami i zębami; płyty na brzuchu, płetwy kolców
// na grzbiecie, szyi i ogonie, ostrze na ogonie; ogromne, postrzępione skrzydła z pazurami. W locie łapy podkulone,
// szyja wyciągnięta, skrzydła biją szeroko. L.form: 'heavy' (masywny, pancerne płyty, zakręcone rogi, maczuga na ogonie),
// 'crystal' (kryształy), 'serpent' (smukły, długa szyja, grzywa kolców, największe skrzydła), 'fae' (mały, skrzydła motyla),
// 'wyvern' (bez przednich łap). Punkt 'mouth' (paszcza) odczytuje wypalanie do zionięcia w grze.
function dragon(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#3a9a5a', bony = !!L.bony, K = bony ? 'bone' : 'scale', horn = L.horn || '#e8e0c0', F = L.form || '';
  const heavy = F === 'heavy', ser = F === 'serpent', fae = F === 'fae', cry = F === 'crystal', wyv = F === 'wyvern', dark = DK(col, 0.4), hornK = cry ? 'gem' : 'horn';
  const q = quadBody(root, { col, kind: K, len: ser ? 1.8 : heavy ? 1.55 : 1.6, legH: heavy ? 0.66 : 0.74, r: bony ? 0.2 : heavy ? 0.34 : ser ? 0.24 : 0.28, paws: true, chest: heavy ? 1.2 : 1.1, rump: 0.95, belly: bony ? null : LT(col, 0.3), bulk: heavy ? 1.1 : 0.9, noFront: wyv, claw: horn, ribs: bony, dewclaw: true }, P);
  const fly = q.flying, ph = q.ph, hit = q.hit, t = P.t || 0;
  if (bony) for (let i = 0; i < 6; i++) q.body.add(torus(0.3, 0.025, col, 'bone', [0.35 - i * 0.12, 0, 0], [0, Math.PI / 2, 0], [1, 1.1, 1], Math.PI * 1.4));
  else for (let i = 0; i < 8; i++) q.body.add(rbox(0.13, 0.05, q.r * 1.1, 0.016, LT(col, 0.38), 'horn', [-0.58 + i * 0.16, -q.r * 0.8, 0], [0, 0, 0.04])); // płyty brzucha
  const fin = (parent, x, y, h, c = dark, a = 0.5, w = 0.1) => parent.add(slab([[-w, 0], [w * 0.6, 0], [-w * 0.2 - h * 0.35, h]], 0.022, c, 'horn', [x, y, 0], [0, 0, a - 0.5]));
  for (let i = 0; i < 9; i++) { const x = -0.72 + i * 0.17, h = (heavy ? 0.2 : ser ? 0.4 : 0.32) * (1 - Math.abs(i - 5) * 0.08);
    if (cry && i % 2) q.body.add(mesh(new THREE.OctahedronGeometry(0.17), L.gem || LT(col, 0.4), 'gem', [x, q.r * 1.1, 0], [0.3, i, 0.2], [0.7, 2.4, 0.7]));
    if (heavy) q.body.add(rbox(0.15, 0.07, q.r * 1.45, 0.02, dark, 'iron', [x, q.r * 0.9, 0], [0, 0, -0.15])); // pancerne płyty
    fin(q.body, x, q.r * 0.92, h); }
  q.body.scale.y *= heavy ? 0.9 : 0.82; // smukły tułów, nie beczka
  const nl = ser ? 1.35 : heavy ? 0.8 : 1;
  const nk = fly ? [[0, 0, 0], [0.26 * nl, 0.16 * nl, 0], [0.55 * nl, 0.3 * nl, 0], [0.82 * nl, 0.34 * nl, 0]]
    : [[0, 0, 0], [0.18 * nl, 0.3 * nl, 0], [0.3 * nl + hit * 0.1, 0.62 * nl - hit * 0.25, 0], [0.45 * nl + hit * 0.35, 0.8 * nl - hit * 0.4, 0]];
  q.neck.add(tube(nk, heavy ? 0.22 : 0.17, ser ? 0.08 : 0.11, col, K, 2));
  for (let i = 1; i < 4; i++) fin(q.neck, nk[i][0] - 0.06, nk[i][1] + 0.07, ser ? 0.3 : 0.2, dark, 0.3, 0.07); // kolce szyi
  const head = joint(q.neck, nk[3], (fly ? -0.05 : -0.35) - hit * 0.3), hs = heavy ? 1.5 : fae ? 1.1 : 1.35;
  head.scale.setScalar(hs);
  head.add(rbox(0.26, 0.15, 0.2, 0.03, col, K, [0.02, 0.01, 0], [0, 0, 0.1])); // czaszka
  head.add(rbox(0.3, 0.09, 0.14, 0.025, col, K, [0.25, -0.02, 0], [0, 0, -0.08])); // pysk
  head.add(slab([[0, 0], [0.26, -0.02], [0.3, 0.02], [0.02, 0.05]], 0.12, DK(col, 0.12), K, [0.12, 0.045, 0], [0, 0, -0.06])); // grzbiet nosa
  for (const z of [-1, 1]) {
    head.add(rbox(0.16, 0.045, 0.05, 0.012, dark, 'horn', [0.09, 0.085, 0.085 * z], [0, 0.25 * z, -0.35])); // łuk brwiowy
    head.add(sph(0.024, L.eyes || '#ffd040', 'glow', [0.11, 0.052, 0.09 * z], [1.5, 0.55, 1])); // oko: wąska szczelina
    head.add(sph(0.012, '#140a06', 'skin', [0.38, 0.01, 0.04 * z])); // nozdrze
    for (let k = 0; k < 5; k++) head.add(spike(0.012, 0.055 + (k === 1 ? 0.03 : 0), '#f4ecd8', 'horn', [0.13 + k * 0.058, -0.075, 0.058 * z], [Math.PI, 0, 0])); // zęby, kieł dłuższy
    const hr = heavy ? [[-0.06, 0.08, 0.09 * z], [-0.18, 0.2, 0.18 * z], [-0.14, 0.32, 0.27 * z], [0.0, 0.3, 0.26 * z]]
      : ser ? [[-0.06, 0.08, 0.07 * z], [-0.3, 0.2, 0.12 * z], [-0.6, 0.28, 0.14 * z], [-0.88, 0.32, 0.12 * z]]
      : [[-0.05, 0.08, 0.07 * z], [-0.24, 0.2, 0.11 * z], [-0.46, 0.3, 0.1 * z], [-0.58, 0.26, 0.08 * z]];
    head.add(tube(hr, heavy ? 0.065 : 0.05, 0.005, cry ? (L.gem || horn) : horn, hornK, 2));
    head.add(tube([[-0.05, 0.02, 0.09 * z], [-0.28, 0.06, 0.16 * z], [-0.46, 0.02, 0.2 * z]], 0.03, 0.004, horn, hornK)); // drugie rogi
    for (let k = 0; k < 3; k++) head.add(spike(0.022, 0.16 - k * 0.03, dark, 'horn', [-0.03 - k * 0.03, -0.06 - k * 0.03, 0.1 * z], [0.4 * z, 0, 1.6 + k * 0.35])); // kryza kolców za żuchwą
  }
  const jaw = joint(head, [0.08, -0.07, 0], -hit * 0.75); jaw.add(rbox(0.3, 0.05, 0.12, 0.015, DK(col, 0.15), K, [0.15, -0.03, 0]));
  for (const z of [-1, 1]) for (let k = 0; k < 4; k++) jaw.add(spike(0.011, 0.05, '#f4ecd8', 'horn', [0.08 + k * 0.065, 0.015, 0.05 * z]));
  marker(head, 'mouth', [0.42, -0.07, 0]);
  if (hit > 0.45 && !bony) { const fc = L.breathCol || '#ff9a3a'; for (let i = 0; i < 5; i++) head.add(cone(0.05 - i * 0.006, 0.16 + i * 0.05, i % 2 ? fc : LT(fc, 0.5), 'fire', [0.45 + i * 0.05, -0.08 + Math.sin(i * 2) * 0.02, Math.cos(i * 2) * 0.02], [0, 0, -Math.PI / 2 + Math.sin(i) * 0.15], 6)); } // żar w paszczy
  const tl = fly ? [[0, 0, 0], [-0.45, -0.05, 0], [-0.9, -0.08, 0.05], [-1.3, -0.05, 0], [-1.7 * (ser ? 1.2 : 1), 0.02 + Math.sin(ph) * 0.08, -0.05]]
    : [[0, 0, 0], [-0.4, -0.15, 0], [-0.8, -0.35, 0.1], [-1.15, -0.45, 0], [-1.5 * (ser ? 1.2 : 1), -0.35 + Math.sin(t * 2) * 0.03, -0.1]];
  q.tail.add(tube(tl, heavy ? 0.26 : 0.2, 0.03, col, K, 2));
  for (let i = 1; i < 4; i++) fin(q.tail, tl[i][0], tl[i][1] + 0.12 - i * 0.02, 0.24 - i * 0.04, dark, 0.8);
  const tip = tl[4];
  if (heavy) { q.tail.add(sph(0.13, dark, 'iron', tip)); for (let i = 0; i < 7; i++) q.tail.add(spike(0.035, 0.18, horn, 'horn', tip, [i, i * 2, i * 3])); }
  else q.tail.add(slab([[0, -0.12], [0.08, 0], [0, 0.12], [-0.45, 0]], 0.03, cry ? (L.gem || horn) : dark, hornK, [tip[0] + 0.02, tip[1], tip[2]])); // ostrze ogona
  // skrzydła: postrzępione błony z pazurami (smok baśniowy: skrzydła motyla); w spoczynku uniesione, w locie biją szeroko
  const wl = joint(q.body, [wyv ? 0.4 : 0.22, q.r * 0.82, 0]), W = L.wing || DK(col, 0.12), span = ser ? 2.3 : heavy ? 1.75 : cry ? 1.85 : fae ? 1.3 : bony ? 1.9 : 2.0;
  const flap = fly ? 0.5 + Math.sin(ph) * 1.0 : P.walk != null ? 0.3 + Math.sin(P.walk * Math.PI * 4) * 0.25 : 0.28 + Math.sin(t * 2) * 0.06 + (P.atk != null ? hit * 0.35 : 0);
  for (const z of [-1, 1]) {
    const w = joint(wl, [0, 0, 0.18 * z]); w.rotation.set((flap + (z < 0 ? 0.12 : 0)) * z, -0.3 * z, fly ? -0.35 : -0.1); w.scale.setScalar(span);
    if (fae) { for (const [a, rr] of [[0.5, 0.62], [-0.4, 0.46]]) w.add(slab([[0, 0], [-rr * Math.cos(a) * 0.4, rr * 0.9], [-rr * 1.3, rr * Math.sin(a) + 0.2], [-rr * 1.1, rr * Math.sin(a) - 0.25]], 0.01, L.wing || '#e0c0ff', 'gem', [0, 0, 0], null, null, 0.2)); continue; }
    if (bony) { membraneWingBones(w, col); continue; }
    membraneWing(w, W, DK(W, 0.45), 1, true, 1.3);
  }
  if (wyv) for (const z of [-1, 1]) q.body.add(spike(0.025, 0.14, horn, 'horn', [0.5, 0.05, 0.3 * z], [0, 0, -2.2])); // pazury na skrzydłach wywerny
  root.scale.setScalar(1.12 * (L.size || 1));
  return root;
}
// Kościane skrzydło (wywerny nieumarłe): same kości palców z resztkami postrzępionej błony
function membraneWingBones(w, col) {
  const E = [-0.12, 0.38], Wr = [0.06, 0.78], tips = [[-0.22, 1.12], [-0.62, 1.05], [-0.98, 0.72], [-1.12, 0.3]];
  w.add(tube([[0, 0, 0], E.concat(0), Wr.concat(0)], 0.035, 0.02, col, 'bone')); for (const tp of tips) w.add(tube([Wr.concat(0), [(Wr[0] + tp[0]) / 2, (Wr[1] + tp[1]) / 2 + 0.03, 0], tp.concat(0)], 0.02, 0.006, col, 'bone'));
  w.add(sheet([Wr, tips[1], [-0.7, 0.8], tips[2], [-0.55, 0.5]], '#5a6a5a', 'skin', [0, 0, -0.005]));
}
// Głowa gada (hydra, bazyliszek): kanciasta czaszka, długi pysk z zębami, łuki brwiowe nad świecącymi szczelinami oczu,
// kolce za głową, opcjonalnie rogi; żuchwa otwiera się przy ataku (bite 0..1)
function reptileHead(h, col, o = {}) {
  const dark = DK(col, 0.42), bite = o.bite || 0;
  h.add(rbox(0.24, 0.13, 0.17, 0.03, col, 'scale', [0, 0.01, 0], [0, 0, 0.08])); // czaszka
  h.add(rbox(0.27, 0.08, 0.12, 0.022, col, 'scale', [0.22, -0.02, 0], [0, 0, -0.08])); // pysk
  h.add(slab([[0, 0], [0.24, -0.02], [0.27, 0.02], [0.02, 0.045]], 0.1, DK(col, 0.12), 'scale', [0.1, 0.04, 0], [0, 0, -0.06])); // grzbiet nosa
  for (const z of [-1, 1]) {
    h.add(rbox(0.13, 0.035, 0.045, 0.01, dark, 'horn', [0.07, 0.07, 0.07 * z], [0, 0.25 * z, -0.35])); // łuk brwiowy
    h.add(sph(0.02, o.eyes || '#f0e040', 'glow', [0.09, 0.045, 0.075 * z], [1.5, 0.5, 1]));
    for (let k = 0; k < 4; k++) h.add(spike(0.01, 0.045 + (k === 0 ? 0.025 : 0), '#f4ecd8', 'horn', [0.13 + k * 0.055, -0.065, 0.048 * z], [Math.PI, 0, 0]));
    for (let k = 0; k < 3; k++) h.add(spike(0.02, 0.15 - k * 0.025, dark, 'horn', [-0.08 - k * 0.02, 0.04 - k * 0.05, 0.07 * z], [0.35 * z, 0, 1.5 + k * 0.3])); // kolce za głową
    if (o.horns) h.add(tube([[-0.04, 0.06, 0.05 * z], [-0.18, 0.15, 0.08 * z], [-0.32, 0.17, 0.07 * z]], 0.03, 0.004, o.horns, 'horn'));
  }
  const jaw = joint(h, [0.06, -0.06, 0], -0.08 - bite * 0.8); jaw.add(rbox(0.26, 0.045, 0.1, 0.012, DK(col, 0.15), 'scale', [0.13, -0.025, 0]));
  jaw.add(box(0.2, 0.01, 0.07, '#5a1414', 'skin', [0.13, 0.0, 0]));
  for (const z of [-1, 1]) for (let k = 0; k < 3; k++) jaw.add(spike(0.009, 0.04, '#f4ecd8', 'horn', [0.07 + k * 0.06, 0.012, 0.042 * z]));
  return h;
}
// Hydra: niski, długi gadzi tułów z płytami i kolcami na grzbiecie, a z barków wachlarz długich, wijących się szyj
// zakończonych dużymi smoczymi głowami (każda patrzy na wroga); przy ataku część głów wystrzeliwuje do przodu
function hydra(L, P = {}) {
  const root = new THREE.Group(), col = L.fur || '#4a7a4a', n = L.heads || 5, t = P.t || 0, A = P.atk, hit = A != null ? Math.sin(A * Math.PI) : 0, dark = DK(col, 0.42);
  const q = quadBody(root, { col, kind: 'scale', len: 1.3, legH: 0.46, r: 0.26, paws: true, chest: 1.15, rump: 1.02, bulk: 1.0, claw: '#e8e0c8', dewclaw: true }, P);
  for (let i = 0; i < 8; i++) { const x = -0.58 + i * 0.16; q.body.add(rbox(0.13, 0.05, q.r * 0.95, 0.016, DK(col, 0.22), 'horn', [x, q.r * 0.84, 0], [0, 0, -0.1])); q.body.add(spike(0.035, 0.15, dark, 'horn', [x, q.r * 0.93, 0], [0, 0, 0.4])); } // płyty i kolce grzbietu
  const tl = [[0, 0, 0], [-0.4, -0.12, 0], [-0.8, -0.28, 0.08], [-1.15, -0.34, 0], [-1.45, -0.3 + Math.sin(t * 2) * 0.03, -0.06]];
  q.tail.add(tube(tl, 0.16, 0.025, col, 'scale', 2)); for (let i = 1; i < 4; i++) q.tail.add(spike(0.03, 0.13 - i * 0.02, dark, 'horn', [tl[i][0], tl[i][1] + 0.11 - i * 0.02, tl[i][2]], [0, 0, 0.6]));
  const front = Math.round((n - 1) * 0.25);
  for (let k = 0; k < n; k++) {
    const f = k / (n - 1), a = 0.2 + f * 1.3, sw = Math.sin(t * 2 + k * 1.3) * 0.05, lunge = hit * (k % 2 ? 0.55 : 0.25) * (1 - f * 0.5), z = (f - 0.5) * 0.46;
    const L1 = 1.0 + Math.sin(k * 1.7) * 0.12, px = Math.cos(a), py = Math.sin(a), nx = -py, ny = px, s = (k % 2 ? 1 : -1) * 0.1; // S-kształt: wygięcie w poprzek szyi
    const pts = [[0, 0, z * 0.3], [px * 0.3 + nx * s, py * 0.3 + ny * s + 0.04, z * 0.6], [px * L1 * 0.62 - nx * s + lunge * 0.4, py * L1 * 0.62 - ny * s + sw, z * 0.9], [px * L1 + lunge + 0.08, py * L1 + 0.08 + sw - lunge * 0.3, z]];
    q.neck.add(tube(pts, 0.11, 0.075, col, 'scale', 2));
    for (let i = 1; i < 3; i++) q.neck.add(spike(0.025, 0.1, dark, 'horn', [pts[i][0] - nx * 0.08, pts[i][1] + 0.08, pts[i][2]], [0, 0, a - 0.9])); // kolce na szyi
    const h = joint(q.neck, pts[3], -0.15 - lunge * 0.3 + Math.sin(t * 1.5 + k) * 0.05); h.scale.setScalar(1.25);
    reptileHead(h, col, { bite: hit * (k % 2 ? 1 : 0.6), eyes: L.eyes || '#f0e040', horns: L.horns });
    if (k === front) marker(h, 'mouth', [0.4, -0.06, 0]);
  }
  root.scale.setScalar(1.12 * (L.size || 1));
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
