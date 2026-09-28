// ==================== MODELE 3D: POSTACIE (look.kind === 'hum') =================================
// Humanoid z cech wyglądu z danych gry (look): skóra, strój, zbroja, hełm, broń, tarcza, peleryna, szata, szkielet,
// ogień lub wężowy ogon zamiast nóg, rogi, ogon, skrzydła, aureola, świecące oczy, kły, pysk, jedno oko (cyklop).
// P: poza { t, walk (0..1), atk (0..1), hurt }. Postać patrzy w +x, bliższy bok (prawy, z bronią) to +z.
/* global THREE, G3, mat, mesh, joint, sph, cap, cyl, cone, box, torus, lathe, bone, tube, sheet, decal, DK, LT, bright */
const STYLE = w => (w === 'spear' || w === 'halberd' || w === 'lance' ? 'thrust' : w === 'bow' ? 'bow' : w === 'staff' ? 'cast' : w === 'none' ? 'claw' : 'swing');

function humanoid(L, P = {}) {
  const root = new THREE.Group(), t = P.t || 0, walking = P.walk != null, ph = (P.walk || 0) * Math.PI * 2, sw = walking ? Math.sin(ph) : 0;
  const bony = !!L.bony, skin = L.skin || '#d8a878', cloth = L.cloth || (bony ? skin : '#6a5a4a'), lea = L.leather || '#4a3222', metal = L.metal || '#b8c0cc';
  const helmCol = L.helmCol || metal, pants = bony ? skin : DK(cloth, 0.3), boots = DK(lea, 0.05), W = L.weapon || 'none', style = STYLE(W);
  const legless = !!(L.robe || L.flame || L.serpent || L.noLegs), S = bony ? 0.8 : L.tusks && L.hunch ? 1.15 : 1;
  const atk = P.atk, A = atk != null ? atk : null, hurt = P.hurt ? 1 : 0;
  // przebieg ataku: 0..1 zamach (0..0,45), cios (0,45..0,7), powrót
  const wind = A == null ? 0 : A < 0.45 ? A / 0.45 : A < 0.7 ? 1 - (A - 0.45) / 0.25 : 0, hit = A == null ? 0 : A < 0.45 ? 0 : A < 0.7 ? (A - 0.45) / 0.25 : 1 - (A - 0.7) / 0.3;
  const hunch = L.hunch === true ? 0.22 : L.hunch || 0, lean = hunch + (style === 'thrust' || style === 'claw' ? hit * 0.2 : style === 'swing' ? hit * 0.12 - wind * 0.08 : 0) - hurt * 0.3;
  const thighL = 0.35, shinL = 0.34, hipH = thighL + shinL + 0.1;
  const bob = walking ? Math.abs(Math.sin(ph)) * (legless ? 0.015 : 0.035) : Math.sin(t * 2.4) * 0.01;
  const hips = joint(root, [0, hipH + bob + (L.flame ? 0.06 : 0), 0]);
  // --- nogi ---
  if (!legless) for (const side of [-1, 1]) {
    const th = joint(hips, [0, -0.03, (L.mounted ? 0.2 : 0.105) * side * S]);
    th.rotation.z = L.mounted ? 1.3 : walking ? sw * side * 0.5 : (side > 0 ? 0.1 : -0.06) + hurt * 0.1;
    if (bony) { bone(th, 0.035, 0.03, thighL, skin, 'bone'); } else bone(th, 0.1 * S, 0.078 * S, thighL, pants, L.armor ? 'mail' : 'cloth');
    const kn = joint(th, [0, -thighL, 0]); kn.rotation.z = L.mounted ? -1.4 : walking ? -Math.max(0, Math.cos(ph) * side) * 0.8 : 0;
    if (bony) { kn.add(sph(0.045, skin, 'bone', [0, 0, 0])); bone(kn, 0.03, 0.025, shinL, skin, 'bone'); kn.add(cap(0.03, 0.1, skin, 'bone', [0.05, -shinL, 0], [0, 0, Math.PI / 2])); continue; }
    if (L.armor) kn.add(sph(0.085, metal, 'metal', [0.02, 0, 0], [1, 0.9, 1]));
    bone(kn, 0.075 * S, 0.062 * S, shinL, pants, 'cloth');
    kn.add(lathe([[0.075, 0], [0.078, 0.2], [0.09, 0.22], [0.001, 0.23]], boots, 'leather', [0, -shinL - 0.02, 0]));
    kn.add(cap(0.066, 0.13, boots, 'leather', [0.07, -shinL - 0.03, 0], [0, 0, Math.PI / 2], [1, 1, 1.2]));
    kn.add(torus(0.085, 0.015, DK(boots, 0.3), 'leather', [0, -shinL + 0.19, 0], [Math.PI / 2, 0, 0]));
  }
  if (L.robe && !L.flame && !L.serpent) { // szata do ziemi z fałdami, spod niej czubki butów
    hips.add(lathe([[0.2 * S, 0.12], [0.24 * S, -0.2], [0.3 * S, -0.55], [0.34 * S, -hipH + 0.02], [0.3 * S, -hipH]], cloth, 'cloth', [0, 0, 0], [1, 1, 1.1], 2, [13, 0.08, 0.1, -hipH]));
    for (const z of [-0.08, 0.08]) hips.add(cap(0.06, 0.1, boots, 'leather', [0.2 + (walking ? Math.sin(ph + z * 20) * 0.04 : 0), -hipH + 0.05, z], [0, 0, Math.PI / 2]));
  }
  if (L.flame) { // języki ognia zamiast nóg
    const F = L.flame; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 0.13, fl = Math.sin(t * 9 + i * 1.9) * 0.08;
      hips.add(cone(0.1, 0.55 + fl + (i % 2) * 0.15, i % 2 ? F : LT(F, 0.25), 'fire', [Math.cos(a) * r * 0.6 - 0.05, -0.32 - (i % 2) * 0.05, Math.sin(a) * r], [Math.PI, 0, 0.2 + Math.sin(a) * 0.1])); }
    hips.add(sph(0.2, F, 'fire', [0, -0.05, 0], [1.1, 0.6, 1.1]));
  }
  if (L.serpent) { // wężowy ogon: od bioder do ziemi i zwinięty za plecami
    const v = walking ? Math.sin(ph) * 0.05 : Math.sin(t * 2.5) * 0.02;
    hips.add(tube([[0, 0.05, 0], [0.06, -0.3, 0], [0.02, -hipH + 0.14, 0.04], [-0.3, -hipH + 0.1, 0.02 + v], [-0.65, -hipH + 0.12, -0.1 - v], [-0.9, -hipH + 0.22, 0.05], [-1.05, -hipH + 0.36, 0.12]], 0.19, 0.03, L.serpent, 'scale', 3));
  }
  if (L.tail) { const tw = Math.sin(t * 3 + (walking ? ph : 0)) * 0.06, tip = [-0.78, 0.12 + tw, 0];
    hips.add(tube([[-0.12, 0, 0], [-0.35, -0.2, 0], [-0.6, -0.12, 0.02], tip], 0.06, 0.02, L.tail, L.snout ? 'scale' : 'skin'));
    if (L.horns && !L.snout) hips.add(cone(0.05, 0.12, DK(L.tail, 0.3), 'skin', [tip[0] - 0.05, tip[1] + 0.02, 0], [0, 0, 1.3])); }
  // --- tułów ---
  const spine = joint(hips, [0, 0, 0], -lean);
  if (bony) { // żebra, kręgosłup, miednica
    spine.add(cyl(0.03, 0.03, 0.62, skin, 'bone', [-0.03, 0.3, 0]));
    for (let i = 0; i < 5; i++) spine.add(torus(0.16 - i * 0.012, 0.018, skin, 'bone', [0.02, 0.5 - i * 0.07, 0], [Math.PI / 2, 0, 0], [1, 1.25, 1], Math.PI * 1.6));
    spine.add(sph(0.14, skin, 'bone', [0, -0.02, 0], [1, 0.55, 1.2]));
  } else {
    const TP = [[0.001, -0.06], [0.2, -0.04], [0.19, 0.1], [0.165, 0.2], [0.21, 0.36], [0.215, 0.46], [0.17, 0.55], [0.08, 0.62], [0.001, 0.63]].map(([r, y]) => [r * S, y]);
    spine.add(lathe(TP, cloth, 'cloth', [0, 0, 0], [1, 1, 1.18], 2, [7, 0.035, 0.5, 0.0]));
    if (!L.robe && !L.noLegs) spine.add(lathe([[0.2 * S, 0.12], [0.235 * S, -0.05], [0.265 * S, -0.22], [0.235 * S, -0.23]], L.armor ? metal : cloth, L.armor ? 'mail' : 'cloth', [0, 0, 0], [1, 1, 1.15], 2, [11, 0.09, 0.1, -0.23]));
    if (L.armor) {
      spine.add(lathe([[0.205, 0.08], [0.22, 0.2], [0.232, 0.36], [0.23, 0.47], [0.18, 0.56], [0.001, 0.57]].map(([r, y]) => [r * S, y]), metal, 'metal', [0.012, 0, 0], [1, 1, 1.17], 3));
      for (const z of [-1, 1]) { const pa = joint(spine, [0, 0.53, 0.25 * S * z]); pa.add(sph(0.13 * S, metal, 'metal', [0, 0, 0], [1, 0.7, 1])); pa.add(sph(0.12 * S, metal, 'metal', [0, -0.06, 0.02 * z], [1.05, 0.55, 1])); }
      spine.add(box(0.02, 0.26, 0.02, DK(metal, 0.3), 'metal', [0.245 * S, 0.32, 0]));
      spine.add(torus(0.1, 0.035, metal, 'metal', [0.02, 0.575, 0], [Math.PI / 2, 0, 0], [1.1, 1.2, 1]));
      for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; spine.add(sph(0.014, '#e8d8a0', 'gold', [Math.cos(a) * 0.235 * S + 0.012, 0.47, Math.sin(a) * 0.235 * S * 1.17], null, 8)); }
    }
    spine.add(torus(0.205 * S, 0.028, lea, 'leather', [0, 0.13, 0], [Math.PI / 2, 0, 0], [1, 1.17, 1]));
    spine.add(box(0.035, 0.06, 0.07, '#d8b048', 'gold', [0.215 * S, 0.13, 0]));
    spine.add(box(0.08, 0.1, 0.06, lea, 'leather', [0.05, 0.07, 0.23 * S]));
    if (L.tabard) { const cr = L.cross; spine.add(decal(0.26, 0.62, (g, w, h) => { g.fillStyle = L.tabard; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 6; x < w; x += 12) g.fillRect(x, 0, 2, h); if (cr) { g.fillStyle = cr; g.fillRect(w / 2 - 6, 14, 12, h * 0.55); g.fillRect(10, 36, w - 20, 11); } }, [0.25 * S, 0.22, 0], [0, Math.PI / 2, 0])); }
    if (L.quiver) { const q = joint(spine, [-0.22 * S, 0.32, -0.05], -0.35); q.add(cyl(0.065, 0.075, 0.5, L.quiver, 'leather')); q.add(torus(0.07, 0.012, '#c8a050', 'gold', [0, 0.24, 0], [Math.PI / 2, 0, 0])); for (let i = 0; i < 5; i++) { q.add(cyl(0.006, 0.006, 0.14, '#c8a878', 'wood', [0.03 * Math.cos(i * 1.3), 0.32, 0.03 * Math.sin(i * 1.3)])); q.add(cone(0.02, 0.06, i % 2 ? '#e8e0cc' : '#b83a2a', 'cloth', [0.03 * Math.cos(i * 1.3), 0.4, 0.03 * Math.sin(i * 1.3)], null, 4)); } }
    if (L.spikes) for (const z of [-1, 1]) for (let i = 0; i < 3; i++) spine.add(cone(0.025, 0.12, '#e8e0cc', 'horn', [-0.04 + i * 0.05, 0.64, 0.26 * S * z], [0.3 * z, 0, -0.2]));
  }
  if (L.cape) { const cp = mesh(new THREE.CylinderGeometry(0.2, 0.36, legless ? 1.2 : 0.98, 18, 1, true, Math.PI * 1.5 - 1.2, 2.4), L.cape, 'cloth', [0.02, legless ? -0.02 : 0.08, 0], [0, 0, 0.1 + (walking ? Math.abs(sw) * 0.08 : 0)], [1, 1, 1.25]); cp.material = cp.material.clone(); cp.material.side = THREE.DoubleSide; spine.add(cp); }
  if (L.wings) wings(spine, L.wings, bright(L.wings), t, walking ? ph : null, A);
  // --- głowa ---
  const neck = joint(spine, [0.03, 0.6, 0]); neck.add(cyl(bony ? 0.03 : 0.065, bony ? 0.03 : 0.06, 0.12, skin, bony ? 'bone' : 'skin', [0, 0.04, 0]));
  const head = joint(neck, [0.02, 0.18, 0], lean * 0.6 - hurt * 0.2), hr = 0.14;
  headOf(head, L, hr, skin, t);
  if (L.halo) head.add(torus(0.12, 0.014, L.halo, 'glow', [-0.02, hr + 0.12, 0], [Math.PI / 2 + 0.25, 0, 0]));
  // --- ręce i broń ---
  for (const side of [1, -1]) {
    const near = side === 1, sh = joint(spine, [0.0, 0.5, 0.26 * side * S]);
    let aSh, aEl;
    if (near) {
      if (style === 'thrust') { aSh = 0.3 + hit * 0.9 - wind * 0.3; aEl = 1.0 - hit * 0.7; }
      else if (style === 'swing') { aSh = 0.3 + wind * 2.4 - hit * 1.2; aEl = 0.7 + wind * 0.2 - hit * 0.4; }
      else if (style === 'bow') { aSh = A == null ? 0.25 : 1.45; aEl = A == null ? 0.9 : 0.05; }
      else if (style === 'cast') { aSh = 0.3 + (A == null ? 0 : Math.sin(A * Math.PI) * 1.4); aEl = 0.6 - (A == null ? 0 : Math.sin(A * Math.PI) * 0.4); }
      else { aSh = 0.3 + hit * 1.3 + wind * 0.4; aEl = 0.8 - hit * 0.6; }
      if (walking && A == null) aSh += -sw * 0.35; aSh += hurt * 0.6;
    } else {
      aSh = (walking ? sw * 0.35 : 0.1) + (L.shield ? 0.9 : 0) + (style === 'bow' && A != null ? 1.4 : 0) + (style === 'claw' ? hit * 1.4 + wind * 0.3 : 0) + hurt * 0.5;
      aEl = L.shield ? 0.7 : style === 'bow' && A != null ? 0.1 : 0.5;
    }
    sh.rotation.z = aSh;
    const armCol = bony ? skin : L.armor ? metal : cloth, aK = bony ? 'bone' : L.armor ? 'mail' : 'cloth';
    if (bony) bone(sh, 0.032, 0.026, 0.29, skin, 'bone'); else bone(sh, 0.078 * S, 0.064 * S, 0.29, armCol, aK);
    if (L.armor && !bony) for (const y of [-0.1, -0.17]) sh.add(torus(0.075 * S, 0.012, DK(metal, 0.2), 'metal', [0, y, 0], [Math.PI / 2, 0, 0]));
    const el = joint(sh, [0, -0.29, 0], aEl);
    if (bony) bone(el, 0.026, 0.022, 0.26, skin, 'bone'); else { bone(el, 0.064 * S, 0.052 * S, 0.26, armCol, aK); el.add(cyl(0.07 * S, 0.062 * S, 0.1, L.armor ? metal : lea, L.armor ? 'metal' : 'leather', [0, -0.21, 0])); }
    el.add(sph(bony ? 0.04 : 0.058 * S, L.armor && !bony ? metal : skin, L.armor && !bony ? 'metal' : bony ? 'bone' : 'skin', [0.01, -0.29, 0], [1, 1.1, 0.8]));
    const hand = joint(el, [0, -0.29, 0]), world = aSh + aEl - lean;
    const hold = wa => { hand.rotation.z = wa - world; return hand; };
    if (near) weapon(hold, L, W, A, wind, hit, metal);
    if (!near && L.shield) shield(hold(Math.PI / 2), L, metal);
    if (!near && style === 'bow' && A != null) { const hh = hold(-Math.PI / 2 + 0.1); hh.add(cyl(0.006, 0.006, 0.7, '#c8a878', 'wood', [0.02, 0.35, 0])); } // strzała na cięciwie
    if (L.claws && (W === 'none' || !near)) for (let i = 0; i < 3; i++) hand.add(cone(0.012, 0.09, '#f0e8d0', 'horn', [0.03, -0.05, (i - 1) * 0.025], [0, 0, 2.4]));
  }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}

// Głowa: twarz, oczy, włosy, zarost, uszy, kły, pysk, rogi i nakrycie głowy
function headOf(head, L, hr, skin, t) {
  const bony = !!L.bony, eyeCol = L.eyes || '#2a1c10', glowEye = L.eyes && (bony || bright(L.eyes)), eK = glowEye ? 'glow' : 'skin';
  if (bony) {
    head.add(sph(hr, skin, 'bone', [0, 0.01, 0], [1, 1.05, 0.9])); head.add(sph(hr * 0.62, skin, 'bone', [0.06, -0.08, 0], [1, 0.7, 0.9]));
    for (const z of [-0.05, 0.05]) { head.add(sph(0.036, '#141014', 'skin', [hr * 0.78, 0.02, z], [0.6, 1, 1])); if (L.eyes) head.add(sph(0.016, eyeCol, 'glow', [hr * 0.86, 0.02, z])); }
    head.add(box(0.02, 0.018, 0.08, '#e8e0d0', 'bone', [hr * 0.86, -0.09, 0]));
  } else {
    head.add(sph(hr, skin, 'skin', [0, 0, 0], [0.98, 1.08, 0.92])); head.add(sph(hr * 0.75, skin, 'skin', [0.045, -0.07, 0], [1, 0.8, 0.95]));
    if (L.snout) { head.add(cap(0.065, 0.12, skin, 'skin', [hr + 0.02, -0.06, 0], [0, 0, Math.PI / 2 + 0.15], [1, 1, 0.9])); head.add(sph(0.05, DK(skin, 0.3), 'skin', [hr + 0.12, -0.04, 0], [0.8, 0.6, 1])); for (const z of [-0.025, 0.025]) head.add(sph(0.01, '#140c08', 'skin', [hr + 0.16, -0.035, z])); }
    else head.add(cone(0.03, 0.08, skin, 'skin', [hr * 0.98, -0.01, 0], [0, 0, -Math.PI / 2 + 0.3], 8));
    if (L.cyclops) { head.add(sph(0.05, '#f0ece2', 'skin', [hr * 0.8, 0.03, 0])); head.add(sph(0.024, L.eyes || '#3a2a1a', eK, [hr * 0.9, 0.03, 0])); head.add(cap(0.02, 0.12, DK(skin, 0.3), 'skin', [hr * 0.82, 0.09, 0], [Math.PI / 2, 0, 0])); }
    else for (const z of [-0.055, 0.055]) { head.add(sph(0.022, glowEye ? eyeCol : '#f0ece2', eK, [hr * 0.83, 0.025, z], [0.6, 0.8, 1], 10)); head.add(sph(0.012, glowEye ? LT(eyeCol, 0.5) : eyeCol, eK, [hr * 0.9, 0.025, z], null, 8)); head.add(box(0.02, 0.012, 0.05, L.hair || DK(skin, 0.5), 'hair', [hr * 0.86, 0.06, z], [0, 0, -0.2])); }
    head.add(box(0.012, 0.01, 0.05, DK(skin, 0.45), 'skin', [hr * 0.9, -0.075, 0]));
    head.add(cap(0.02, 0.1, skin, 'skin', [hr * 0.78, 0.055, 0], [Math.PI / 2, 0, 0])); for (const z of [-0.07, 0.07]) head.add(sph(0.035, skin, 'skin', [hr * 0.72, -0.025, z], [0.8, 0.7, 1], 10));
    if (L.ears) for (const z of [-1, 1]) head.add(cone(0.035, 0.17, skin, 'skin', [-0.02, 0.07, hr * 0.85 * z], [0.9 * z, 0, -0.5], 6));
    else for (const z of [-1, 1]) head.add(sph(0.03, skin, 'skin', [-0.01, 0, hr * 0.9 * z], [0.6, 1, 0.5], 10));
    if (L.tusks) for (const z of [-0.05, 0.05]) head.add(cone(0.016, 0.07, '#f0ead8', 'horn', [0.12, -0.07, z], null, 6));
    if (L.beard) head.add(sph(0.095, L.beard, 'hair', [0.07, -0.1, 0], [0.9, 1.25, 1.15]));
  }
  const hm = L.helm, hc = L.helmCol || L.metal || '#b8c0cc';
  const hairTop = !hm || hm === 'crown' || hm === 'cap';
  if ((L.hair || L.longHair) && hairTop && !bony) head.add(sph(hr * 1.05, L.hair || L.longHair, 'hair', [-0.03, 0.035, 0], [1, 0.9, 1.02]));
  if (L.longHair && !bony) head.add(cap(0.1, 0.3, L.longHair, 'hair', [-0.1, -0.12, 0], [0, 0, -0.2], [0.7, 1, 1.3]));
  if (L.horns) for (const z of [-1, 1]) head.add(tube([[-0.02, hr * 0.7, 0.07 * z], [-0.05, hr + 0.07, 0.12 * z], [-0.14, hr + 0.14, 0.13 * z], [-0.2, hr + 0.1, 0.1 * z]], 0.035, 0.006, L.horns, 'horn'));
  if (hm === 'helm' || hm === 'horn') {
    head.add(mesh(new THREE.SphereGeometry(hr * 1.12, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hc, 'metal', [0, 0.015, 0]));
    head.add(torus(hr * 1.1, 0.02, DK(hc, 0.2), 'metal', [0, 0.005, 0], [Math.PI / 2, 0, 0]));
    head.add(box(0.012, 0.03, 0.24, DK(hc, 0.25), 'metal', [0, hr * 1.08, 0]));
    head.add(box(0.025, 0.12, 0.035, hc, 'metal', [hr * 1.1, -0.04, 0])); for (const z of [-1, 1]) head.add(box(0.1, 0.12, 0.018, hc, 'metal', [0.04, -0.06, hr * 1.02 * z]));
    if (hm === 'horn') for (const z of [-1, 1]) head.add(tube([[0, hr * 0.8, 0.1 * z], [0.02, hr + 0.1, 0.2 * z], [0.08, hr + 0.22, 0.22 * z]], 0.04, 0.008, '#e8e0cc', 'horn'));
  } else if (hm === 'greathelm') {
    head.add(cyl(hr * 1.12, hr * 1.08, 0.3, hc, 'metal', [0, -0.03, 0])); head.add(sph(hr * 1.1, hc, 'metal', [0, 0.1, 0], [1, 0.5, 1]));
    head.add(box(0.02, 0.014, 0.2, '#101014', 'metal', [hr * 1.12, 0.02, 0])); head.add(box(0.02, 0.2, 0.02, DK(hc, 0.3), 'metal', [hr * 1.13, -0.02, 0]));
    for (let i = 0; i < 4; i++) head.add(sph(0.012, '#101014', 'metal', [hr * 1.12, -0.05 - i * 0.025, 0.04]));
  } else if (hm === 'hood') {
    const c = L.hoodCol || L.cloth; head.add(mesh(new THREE.SphereGeometry(hr * 1.16, 24, 16, Math.PI * 1.32, Math.PI * 1.36), c, 'cloth', [-0.015, 0.012, 0]));
    head.parent.add(cyl(0.2, 0.12, 0.16, c, 'cloth', [-0.01, 0.0, 0], null, [1, 1, 1.2]));
    if (L.eyes && bright(L.eyes)) for (const z of [-0.05, 0.05]) head.add(sph(0.016, L.eyes, 'glow', [hr * 0.9, 0.02, z]));
  } else if (hm === 'cap') {
    head.add(mesh(new THREE.SphereGeometry(hr * 1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), hc, 'leather', [-0.01, 0.02, 0]));
    head.add(cyl(hr * 1.18, hr * 1.18, 0.02, DK(hc, 0.15), 'leather', [0.02, 0.02, 0], [0, 0, 0.1]));
    if (L.feather) head.add(tube([[-0.06, hr * 0.9, 0.08], [-0.16, hr + 0.12, 0.1], [-0.26, hr + 0.2, 0.08]], 0.03, 0.006, L.feather, 'feather'));
  } else if (hm === 'crown') {
    head.add(cyl(hr * 0.9, hr * 0.92, 0.06, '#e8c040', 'gold', [0, hr * 0.72, 0]));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; head.add(cone(0.02, 0.07, '#e8c040', 'gold', [Math.cos(a) * hr * 0.9, hr * 0.8, Math.sin(a) * hr * 0.9], null, 6)); }
    head.add(sph(0.018, '#c82030', 'gem', [hr * 0.92, hr * 0.72, 0]));
  } else if (hm === 'skull') {
    head.add(sph(hr * 1.14, '#e8e2cc', 'bone', [0, 0.04, 0], [1.05, 0.95, 1])); for (const z of [-0.05, 0.05]) head.add(sph(0.03, '#141014', 'skin', [hr * 1.02, 0.06, z]));
    for (const z of [-1, 1]) head.add(tube([[-0.02, hr * 0.8, 0.09 * z], [-0.1, hr + 0.1, 0.14 * z], [-0.22, hr + 0.12, 0.12 * z]], 0.03, 0.006, '#d8d0b8', 'horn'));
  }
  if (L.plume) head.add(tube([[-0.02, hr * 1.12, 0], [-0.12, hr + 0.18, 0], [-0.28, hr + 0.14, 0], [-0.36, hr + 0.0, 0]], 0.05, 0.02, L.plume, 'fur'));
}

// Broń w bliższej ręce; hold(kąt w świecie) ustawia dłoń i zwraca ją. Kąt 0 = ostrze w górę, ujemny = do przodu.
function weapon(hold, L, W, A, wind, hit, metal) {
  const glow = L.glow, blade = glow ? L.glow : metal, bK = glow ? 'glow' : 'metal';
  if (W === 'spear' || W === 'halberd' || W === 'lance') {
    const lance = W === 'lance', h = hold(lance ? -1.35 + (A != null ? -0.1 * hit : 0) : -0.3 - hit * 1.25 + wind * 0.2), len = lance ? 2.6 : 2.2;
    h.add(cyl(lance ? 0.035 : 0.02, lance ? 0.018 : 0.02, len, '#7a5030', 'wood', [0, len / 2 - 0.7, 0]));
    h.add(cone(lance ? 0.03 : 0.05, 0.24, metal, 'metal', [0, len - 0.58, 0], null, lance ? 8 : 4)); h.add(torus(0.03, 0.012, metal, 'metal', [0, len - 0.71, 0], [Math.PI / 2, 0, 0]));
    if (W === 'halberd') { h.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 16, 1, false, 0, Math.PI), metal, 'metal', [0.02, len - 0.85, 0], [Math.PI / 2, Math.PI / 2, 0])); h.add(cone(0.03, 0.14, metal, 'metal', [-0.12, len - 0.85, 0], [0, 0, Math.PI / 2], 4)); }
    if (lance) { h.add(cone(0.1, 0.22, '#c8a050', 'metal', [0, -0.05, 0], [Math.PI, 0, 0], 12)); if (L.pennon) h.add(sheet([[0, 0], [-0.35, -0.07], [0, -0.16]], L.pennon, 'cloth', [0, len - 0.9, 0], [0, 0, 0])); }
  } else if (W === 'sword') {
    const h = hold(-0.55 + (A != null ? wind * 1.3 - hit * 1.6 : 0));
    h.add(mesh(new THREE.CylinderGeometry(0.004, 0.035, 0.8, 4), blade, bK, [0, 0.52, 0], null, [1, 1, 0.3]));
    h.add(box(0.26, 0.035, 0.05, L.hilt || '#c8a050', 'gold', [0, 0.11, 0])); h.add(cyl(0.022, 0.022, 0.15, '#4a2a14', 'leather', [0, 0.02, 0])); h.add(sph(0.03, L.hilt || '#c8a050', 'gold', [0, -0.07, 0]));
  } else if (W === 'axe') {
    const h = hold(-0.35 + (A != null ? wind * 1.4 - hit * 1.7 : 0));
    h.add(cyl(0.024, 0.026, 0.95, '#6a4424', 'wood', [0, 0.32, 0])); h.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.025, 20, 1, false, 0, Math.PI), metal, 'metal', [0.02, 0.68, 0], [Math.PI / 2, Math.PI / 2, 0]));
    h.add(cone(0.035, 0.1, metal, 'metal', [-0.06, 0.68, 0], [0, 0, Math.PI / 2], 4));
  } else if (W === 'club') {
    const h = hold(-0.4 + (A != null ? wind * 1.4 - hit * 1.8 : 0));
    h.add(lathe([[0.03, -0.05], [0.035, 0.2], [0.07, 0.55], [0.09, 0.75], [0.06, 0.85], [0.001, 0.87]], '#6a4424', 'wood', [0, 0, 0]));
    for (let i = 0; i < 5; i++) h.add(cone(0.02, 0.06, '#8a8478', 'metal', [Math.cos(i * 1.3) * 0.085, 0.6 + i * 0.04, Math.sin(i * 1.3) * 0.085], [Math.sin(i * 1.3), 0, -Math.cos(i * 1.3)], 5));
  } else if (W === 'bow') {
    const pull = A == null ? 0 : A < 0.6 ? A / 0.6 : 0, h = hold(-Math.PI / 2);
    h.add(torus(0.45, 0.022, '#7a4a22', 'wood', [0, -0.3, 0], [0, 0, Math.PI * 0.1], null, Math.PI * 0.8));
    const top = [Math.cos(Math.PI * 0.1) * 0.45, -0.3 + Math.sin(Math.PI * 0.1) * 0.45], bot = [Math.cos(Math.PI * 0.9) * 0.45, -0.3 + Math.sin(Math.PI * 0.9) * 0.45];
    const mid = [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2 - pull * 0.3];
    for (const e of [top, bot]) { const dx = mid[0] - e[0], dy = mid[1] - e[1], l = Math.hypot(dx, dy); h.add(cyl(0.004, 0.004, l, '#e8e0cc', 'cloth', [(e[0] + mid[0]) / 2, (e[1] + mid[1]) / 2, 0], [0, 0, Math.atan2(-dx, dy)], null, 4)); }
  } else if (W === 'staff') {
    const h = hold(-0.12 - (A != null ? Math.sin(A * Math.PI) * 0.3 : 0));
    h.add(cyl(0.022, 0.026, 1.7, '#6a4424', 'wood', [0, 0.3, 0])); h.add(torus(0.05, 0.014, '#c8a050', 'gold', [0, 1.12, 0], [Math.PI / 2, 0, 0]));
    h.add(sph(0.08, L.orb || '#80c0ff', A != null ? 'glow' : 'gem', [0, 1.2, 0]));
  }
}
function shield(h, L, metal) {
  const c = L.shield, m = L.shieldMark;
  h.add(mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.045, 28), DK(c, 0.3), 'wood', [0, 0.02, 0.13], [Math.PI / 2, 0, 0]));
  h.add(decal(0.57, 0.57, (g, w, hh) => { g.fillStyle = c; g.beginPath(); g.arc(w / 2, hh / 2, w / 2, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 0; x < w; x += 11) g.fillRect(x, 0, 1, hh);
    for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`; g.fillRect(Math.random() * w, Math.random() * hh, 2, 1); }
    if (m) { g.fillStyle = m; g.fillRect(w / 2 - 4, 8, 8, hh - 16); g.fillRect(12, hh / 2 - 12, w - 24, 8); } }, [0, 0.02, 0.154]));
  h.add(torus(0.29, 0.024, metal, 'metal', [0, 0.02, 0.155])); h.add(sph(0.075, metal, 'metal', [0, 0.02, 0.17], [1, 1, 0.6]));
  for (let i = 0; i < 8; i++) h.add(sph(0.014, '#d8d0c0', 'metal', [Math.cos(i * 0.785) * 0.25, 0.02 + Math.sin(i * 0.785) * 0.25, 0.16], null, 8));
}
// Skrzydła na plecach: pierzaste (jasne: anioły) albo błoniaste (demony, gargulce). flap: machnięcie przy chodzie i ataku
function wings(spine, col, feathered, t, ph, A) {
  const flap = (ph != null ? Math.sin(ph * 2) * 0.35 : Math.sin(t * 2) * 0.08) + (A != null ? Math.sin(A * Math.PI) * 0.4 : 0);
  for (const z of [-1, 1]) {
    const root = joint(spine, [-0.12, 0.5, 0.1 * z]); root.rotation.set(0.5 * z + flap * z, -0.5 * z, 0.35);
    if (feathered) {
      for (let i = 0; i < 7; i++) { const a = -0.3 + i * 0.22, l = 0.55 + i * 0.07; root.add(mesh(new THREE.SphereGeometry(0.1, 12, 8), i % 2 ? col : LT(col, 0.2), 'feather', [-Math.cos(a) * l * 0.5, Math.sin(a) * l * 0.5 + 0.15, 0], [0, 0, a - Math.PI / 2], [0.45, l * 3.2, 0.12])); }
    } else {
      const bn = DK(col, 0.3), pts = [[0, 0], [-0.3, 0.45], [-0.75, 0.62], [-0.62, 0.3], [-0.85, 0.15], [-0.6, -0.02], [-0.7, -0.22], [-0.35, -0.1], [-0.1, -0.2]];
      root.add(sheet(pts, col, 'skin', [0, 0, 0], [0, 0, 0])); for (const k of [2, 4, 6]) root.add(tube([[0, 0, 0], [pts[k][0] * 0.5, pts[k][1] * 0.6 + 0.08, 0], pts[k].concat(0)], 0.022, 0.008, bn, 'skin'));
    }
  }
}
