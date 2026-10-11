// ==================== MODELE 3D: MASZYNY MANUFAKTURY ==============================================
// Konstrukty miasta wynalazców: mechaniczny ogar (i stalowy, i ogar burzy), ornitopter z gnomem (wiropłat, bombowiec),
// parowy pancerz z krasnoludem w kabinie (żelazny, burzowy) i mosiężny kolos z paleniskiem w piersi (tytan Kuźni).
// Mosiądz, miedź, nity, zębatki, tłoki, kominy z dymem i zaklęta iskra (świecące cewki) – bez laserów i plastiku.
// Patrzą w +x, stopy na y = 0 (jak reszta modeli). L: wygląd z CREATURES[cid].look, P: poza { t, walk, fly, atk, hurt }.
/* global THREE, joint, headJoint, sph, cap, cyl, cone, box, torus, lathe, bone, tube, sheet, slab, rbox, spike, marker, DK, LT, quadBody, humanoid, loft */

// Zębatka: tarcza z zębami (n), piastą i szprychami, w płaszczyźnie xy (oś obrotu z); a: obrót (animacja)
function mfGear(parent, r, th, col, kind, pos, rot, n = 10, a = 0) {
  const g = new THREE.Group(); g.position.set(...pos); if (rot) g.rotation.set(...rot); parent.add(g); const w = new THREE.Group(); w.rotation.z = a; g.add(w);
  w.add(cyl(r * 0.86, r * 0.86, th, col, kind, [0, 0, 0], [Math.PI / 2, 0, 0], null, 20)); w.add(cyl(r * 0.3, r * 0.3, th * 1.6, DK(col, 0.25), kind, [0, 0, 0], [Math.PI / 2, 0, 0], null, 10));
  for (let i = 0; i < n; i++) { const b = i / n * Math.PI * 2; w.add(box(r * 0.26, r * 0.24, th, col, kind, [Math.cos(b) * r * 0.95, Math.sin(b) * r * 0.95, 0], [0, 0, b])); }
  for (let i = 0; i < 4; i++) w.add(box(r * 0.08, r * 1.2, th * 1.2, DK(col, 0.12), kind, [0, 0, 0], [0, 0, i * Math.PI / 4])); return g;
}
// Rząd nitów wzdłuż odcinka
const mfRivets = (parent, a, b, n, col, r = 0.014) => { for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) : 0.5; parent.add(sph(r, col, 'gold', [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], null, 8)); } };
// Dym z komina: kłęby coraz większe i jaśniejsze, kołyszą się w czasie
function mfSmoke(parent, pos, t, k = 1, n = 4, col = '#b8b4ac') {
  for (let i = 0; i < n; i++) { const f = (i + (t * 0.8) % 1) / n, x = pos[0] - f * 0.25 * k + Math.sin(t * 2 + i) * 0.03 * k, y = pos[1] + f * 0.6 * k;
    const m = sph((0.05 + f * 0.11) * k, LT(col, f * 0.3), 'cloth', [x, y, pos[2] + Math.cos(t + i) * 0.03 * k]); m.userData.noShadow = true; parent.add(m); }
}
// Komin: rura z kołnierzem i czapą
function mfChimney(parent, pos, h, r, col, t, smoke = true) {
  parent.add(cyl(r, r * 1.1, h, col, 'iron', [pos[0], pos[1] + h / 2, pos[2]], null, null, 12)); parent.add(cyl(r * 1.35, r * 1.2, h * 0.12, DK(col, 0.2), 'iron', [pos[0], pos[1] + h, pos[2]], null, null, 12));
  if (smoke) mfSmoke(parent, [pos[0], pos[1] + h + 0.05, pos[2]], t, r * 7);
}
// Wyładowanie: łamana świecąca linia między punktami (łuk iskry)
function mfArc(parent, a, b, col, seed = 1, k = 4) {
  const pts = []; for (let i = 0; i <= k; i++) { const f = i / k, j = i && i < k ? 1 : 0, s = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; pts.push([a[0] + (b[0] - a[0]) * f + j * ((s % 1) - 0.5) * 0.08, a[1] + (b[1] - a[1]) * f + j * (((s * 7) % 1) - 0.5) * 0.08, a[2] + (b[2] - a[2]) * f + j * (((s * 3) % 1) - 0.5) * 0.08]); }
  parent.add(tube(pts, 0.01, 0.005, col, 'glow'));
}

// --- mechaniczny ogar: tułów z blach na szkielecie, łapy z tłokami, szczęka-imadło, kocioł z kominkiem na grzbiecie, zębatki na bokach ---
function clockHound(L, P = {}) {
  const root = new THREE.Group(), t = P.t || 0, col = L.fur || '#c8a050', plate = L.plates || '#b8703a', K = 'gold', iron = '#3a3a40', glow = L.eyes || '#ff9a3a';
  const q = quadBody(root, { col: DK(col, 0.15), kind: 'metal', len: 0.92, legH: 0.56, r: 0.17, paws: true, chest: 1.3, rump: 0.95, bulk: 1.1, claw: '#d8dce4' }, P);
  // blachy pancerza na grzbiecie i bokach z nitami
  for (let i = 0; i < 4; i++) { const x = q.len * 0.36 - i * q.len * 0.22; q.body.add(rbox(q.len * 0.2, 0.05, q.r * 2.3, 0.02, i % 2 ? plate : col, K, [x, q.r * 0.86, 0], [0, 0, 0.08])); mfRivets(q.body, [x - 0.07, q.r * 0.9, q.r * 1.12], [x + 0.07, q.r * 0.9, q.r * 1.12], 3, LT(col, 0.2), 0.01); }
  for (const z of [-1, 1]) { q.body.add(rbox(q.len * 0.5, q.r * 1.1, 0.03, 0.02, plate, K, [0.02, 0, q.r * 1.02 * z])); mfGear(q.body, 0.1, 0.03, col, K, [-0.12, -0.02, q.r * 1.06 * z], null, 9, t * 3 * z); mfGear(q.body, 0.065, 0.03, LT(col, 0.1), K, [0.02, 0.06, q.r * 1.08 * z], null, 7, -t * 4.5 * z); }
  // kocioł z kominkiem i manometrem na grzbiecie; ogar burzy: cewki z wyładowaniami
  q.body.add(cyl(0.085, 0.085, 0.26, plate, 'metal', [-0.12, q.r * 1.12, 0], [0, 0, Math.PI / 2], null, 14)); for (const x of [-0.22, -0.02]) q.body.add(torus(0.088, 0.01, col, K, [x, q.r * 1.12, 0], [0, Math.PI / 2, 0]));
  mfChimney(q.body, [-0.24, q.r * 1.18, 0], 0.16, 0.025, iron, t, !L.coils); q.body.add(cyl(0.03, 0.03, 0.02, '#e8e0d0', 'gold', [0.04, q.r * 1.22, 0.06], [Math.PI / 2, 0, 0]));
  if (L.coils) for (const x of [-0.24, 0.0]) { q.body.add(cyl(0.012, 0.012, 0.16, col, K, [x, q.r * 1.25, 0])); for (let i = 0; i < 5; i++) q.body.add(torus(0.035 - i * 0.003, 0.008, '#b8703a', 'metal', [x, q.r * 1.2 + i * 0.03, 0], [Math.PI / 2, 0, 0])); q.body.add(sph(0.03, L.coils, 'glow', [x, q.r * 1.36, 0])); }
  if (L.coils) mfArc(q.body, [-0.24, q.r * 1.36, 0], [0.0, q.r * 1.36, 0], L.coils, Math.floor(t * 8));
  // szyja z rury falistej i łeb: blaszana czaszka, szczęka na zawiasie z zębami ze stali, świecące oczy-soczewki, uszy-płetwy
  const hit = P.atk != null ? Math.sin(Math.min(1, P.atk) * Math.PI) : 0, nk = joint(q.neck, [0, 0, 0], -0.65);
  for (let i = 0; i < 4; i++) nk.add(torus(q.r * 0.48 - i * 0.008, 0.02, i % 2 ? iron : col, 'metal', [0, 0.04 + i * 0.045, 0], [Math.PI / 2, 0, 0]));
  const head = headJoint(nk, [0.02, 0.22, 0], 0.3 - hit * 0.3);
  head.add(rbox(0.2, 0.13, 0.14, 0.03, col, K, [0.04, 0.02, 0])); head.add(rbox(0.16, 0.07, 0.11, 0.02, plate, K, [0.18, -0.005, 0], [0, 0, -0.06]));
  head.add(rbox(0.12, 0.03, 0.15, 0.01, DK(col, 0.2), K, [0.06, 0.09, 0], [0, 0, -0.15])); // łuk brwiowy z blachy
  const jaw = joint(head, [0.08, -0.05, 0], -(0.15 + hit * 0.6)); jaw.add(rbox(0.2, 0.04, 0.1, 0.015, DK(col, 0.1), K, [0.09, -0.01, 0])); jaw.add(box(0.15, 0.012, 0.07, '#1a1414', 'iron', [0.09, 0.012, 0]));
  for (let k = 0; k < 4; k++) for (const z of [-0.035, 0.035]) { head.add(spike(0.012, L.jaws ? 0.05 : 0.035, '#e0e4ec', 'steel', [0.12 + k * 0.035, -0.045, z], [Math.PI, 0, 0])); jaw.add(spike(0.01, L.jaws ? 0.045 : 0.03, '#e0e4ec', 'steel', [0.06 + k * 0.035, 0.02, z])); }
  for (const z of [-1, 1]) { head.add(cyl(0.028, 0.024, 0.03, iron, 'iron', [0.13, 0.05, 0.055 * z], [0, 0, -Math.PI / 2])); head.add(sph(0.022, glow, 'glow', [0.145, 0.05, 0.055 * z], [0.6, 1, 1]));
    head.add(slab([[0, 0], [0.06, 0], [-0.04, 0.14]], 0.012, plate, K, [-0.03, 0.08, 0.06 * z], [0.35 * z, 0, 0.2])); }
  marker(head, 'mouth', [0.3, -0.05, 0]);
  // ogon: segmenty na sprężynie
  for (let i = 0; i < 5; i++) { const a = -0.4 - i * 0.18 + Math.sin(t * 3 + i) * 0.05; q.tail.add(cyl(0.025 - i * 0.003, 0.025 - i * 0.003, 0.07, i % 2 ? col : iron, 'metal', [-0.06 - i * 0.065, -0.02 - i * 0.03, 0], [0, 0, a + Math.PI / 2], null, 8)); }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}

// --- ornitopter / wiropłat / bombowiec: kadłub-łódka z miedzianej blachy, gnom w goglach przy sterach, skrzydła z płótna na żebrach
// (ornitopter macha nimi jak ważka) albo wirnik (rotor: obraca się nad kadłubem; twin: dwa wirniki i podwieszone bomby) ---
function ornithopter(L, P = {}) {
  const root = new THREE.Group(), t = P.t || 0, col = L.fur || '#b8703a', metal = L.metal || '#c8a050', canvas = L.wing || '#d8ccb0', A = P.atk, hit = A != null ? Math.sin(Math.min(1, A) * Math.PI) : 0;
  const fly = P.fly != null, ph = fly ? P.fly * Math.PI * 2 : t * 6, H = 0.62 + Math.sin(ph) * 0.03 + (fly ? 0.08 : 0);
  const body = joint(root, [hit * 0.2, H, 0], fly ? -0.12 : -0.04 - hit * 0.25);
  body.add(loft([[0.56, 0.05, 0.06, 0.06, 0], [0.38, 0.18, 0.15, 0.17, 0], [0.0, 0.23, 0.14, 0.2, 0], [-0.34, 0.15, 0.12, 0.13, 0], [-0.64, 0.05, 0.05, 0.05, 0]], col, 'metal', 'x', [0, 0, 0]));
  for (const x of [0.3, 0.0, -0.3]) body.add(torus(0.16 - Math.abs(x) * 0.15, 0.012, metal, 'gold', [x, -0.01, 0], [0, Math.PI / 2, 0], [1, 0.85, 1.2]));
  mfRivets(body, [0.38, 0.05, 0.14], [-0.4, 0.05, 0.1], 7, LT(metal, 0.2), 0.009); mfRivets(body, [0.38, 0.05, -0.14], [-0.4, 0.05, -0.1], 7, LT(metal, 0.2), 0.009);
  body.add(cone(0.05, 0.12, metal, 'gold', [0.56, 0.0, 0], [0, 0, -Math.PI / 2], 10)); // dziób
  // ogon ze sterem i śmigłem pchającym
  body.add(slab([[0, 0], [0.12, 0], [-0.08, 0.2], [-0.16, 0.2]], 0.015, canvas, 'cloth', [-0.6, 0.02, 0])); for (const z of [-1, 1]) body.add(slab([[0, 0], [0.1, 0], [-0.1, 0.14 * z * 0 + 0.0], [-0.14, 0.0]], 0.012, canvas, 'cloth', [-0.6, 0.0, 0.06 * z], [Math.PI / 2 * z, 0, 0]));
  const prop = joint(body, [-0.66, 0.0, 0], 0); prop.rotation.x = t * 30; for (let i = 0; i < 2; i++) prop.add(rbox(0.01, 0.2, 0.04, 0.005, '#6a4424', 'wood', [0, 0, 0], [i * Math.PI / 2, 0, 0.3])); prop.add(sph(0.025, metal, 'gold', [0, 0, 0]));
  // pilot: gnom w goglach, ręce na drążkach (przy ataku pochyla się i rzuca bombę / naciska spust)
  const pl = L.pilot || {}, pilot = humanoid({ kind: 'hum', gnome: true, skin: pl.skin || '#e0b088', cloth: pl.cloth || '#7a5a3a', leather: '#3a2414', goggles: pl.goggles || metal, helm: 'cap', helmCol: '#5a3a1e', build: 'stocky', size: 0.46, weapon: 'none', mounted: true, mountR: 0.12, beard: '#c8b090' }, { t, atk: A != null ? Math.min(1, A * 0.6) : null });
  pilot.position.set(0.12, 0.02, 0); body.add(pilot); body.add(cyl(0.1, 0.12, 0.08, DK(col, 0.3), 'leather', [0.12, 0.08, 0], null, null, 12)); // fotel-kokpit
  for (const z of [-1, 1]) body.add(cyl(0.006, 0.006, 0.18, metal, 'gold', [0.26, 0.14, 0.05 * z], [0, 0, 0.5]));
  if (L.rotor) { // wirnik nośny na maszcie (bombowiec: dwa wirniki na wysięgnikach)
    const masts = L.twin ? [[0.16, 0.5], [-0.34, 0.42]] : [[-0.06, 0.55]];
    for (const [mx, mh] of masts) { body.add(cyl(0.018, 0.022, mh, '#4a4a52', 'iron', [mx, 0.12 + mh / 2, 0])); const r = joint(body, [mx, 0.12 + mh, 0], 0); r.rotation.y = t * 25 + mx * 3;
      for (let i = 0; i < 3; i++) r.add(rbox(0.6, 0.014, 0.1, 0.006, i % 2 ? canvas : DK(canvas, 0.1), 'wood', [0.3 * Math.cos(i * 2.094), 0, 0.3 * Math.sin(i * 2.094)], [0, -i * 2.094, 0.04]));
      r.add(cyl(0.03, 0.03, 0.03, metal, 'gold')); const blur = cyl(0.62, 0.62, 0.004, '#e8e0d0', 'cloth', [0, 0, 0], null, null, 32); blur.material = blur.material.clone(); blur.material.transparent = true; blur.material.opacity = 0.18; blur.userData.noShadow = true; r.add(blur); } // tarcza ruchu wirnika
    for (const z of [-1, 1]) body.add(slab([[0, 0], [0.18, 0], [0.1, 0.22], [-0.04, 0.22]], 0.015, canvas, 'cloth', [0.0, 0.0, 0.12 * z], [Math.PI / 2 * z, 0, 0])); // krótkie skrzydełka stabilizujące
  } else for (const z of [-1, 1]) { // skrzydła ważki: dwie pary płócien na listwach, machające naprzemiennie
    for (let pr = 0; pr < 2; pr++) { const flap = Math.sin(ph * 2 + pr * 1.4) * (fly ? 0.7 : 0.45) + hit * 0.3, w = joint(body, [0.06 - pr * 0.24, 0.12, 0.1 * z]); w.rotation.set(-(0.15 + flap) * z, 0.15 * z * (pr ? -1 : 1), 0);
      const S = (pr ? 0.8 : 1) * 1.45, E = [[0, 0], [0.1 * S, 0.12 * S], [0.08 * S, 0.62 * S], [-0.04 * S, 0.78 * S], [-0.14 * S, 0.6 * S], [-0.1 * S, 0.1 * S]];
      const wg = new THREE.Group(); wg.rotation.x = Math.PI / 2 * z; w.add(wg); wg.add(sheet(E, canvas, 'cloth', [0, 0, 0]));
      wg.add(tube([[0, 0, 0.004], [0.06 * S, 0.3 * S, 0.004], [0.02 * S, 0.7 * S, 0.004]], 0.012, 0.006, metal, 'gold')); for (const f of [0.35, 0.6]) wg.add(tube([[0.06 * S, f * S, 0.004], [-0.12 * S, (f + 0.05) * S, 0.004]], 0.006, 0.004, '#6a4424', 'wood')); }
  }
  if (L.bombs) for (const x of [0.0, -0.16]) { body.add(sph(0.05, L.bombs, 'iron', [x, -0.2, 0])); body.add(cyl(0.006, 0.006, 0.08, '#8a8478', 'iron', [x, -0.13, 0])); }
  for (const z of [-1, 1]) { body.add(cyl(0.008, 0.008, 0.2, '#4a4a52', 'iron', [0.04, -0.2, 0.1 * z], [0.35 * z, 0, 0])); body.add(cyl(0.01, 0.01, 0.42, '#4a4a52', 'iron', [0.02, -0.29, 0.13 * z], [0, 0, Math.PI / 2])); } // płozy
  marker(body, 'mouth', [0.5, -0.1, 0]);
  if (L.size) root.scale.setScalar(L.size);
  return root;
}

// --- parowy pancerz: krasnolud w kabinie na piersi stalowego kroczącego kotła; prawe ramię z pneumatycznym młotem,
// lewe z kleszczami (shieldArm: z tarczą), kominy na plecach, palenisko w brzuchu, tłoki w kolanach (thrusters: dysze odrzutowe) ---
function steamSuit(L, P = {}) {
  const root = new THREE.Group(), t = P.t || 0, walking = P.walk != null, ph = (P.walk || 0) * Math.PI * 2, sw = walking ? Math.sin(ph) : 0, A = P.atk, hurt = P.hurt ? 1 : 0;
  const col = L.metal || '#b8703a', plate = L.plate || '#c8a050', iron = '#3a3a42', glow = L.glow || '#ff9a3a';
  const wind = A == null ? 0 : A < 0.45 ? A / 0.45 : A < 0.7 ? 1 - (A - 0.45) / 0.25 : 0, hit = A == null ? 0 : A < 0.45 ? 0 : A < 0.7 ? (A - 0.45) / 0.25 : 1 - (A - 0.7) / 0.3;
  const hips = joint(root, [hit * 0.12, 0.62 + (walking ? Math.abs(sw) * 0.03 : Math.sin(t * 2) * 0.006), 0], -hurt * 0.15);
  hips.add(rbox(0.32, 0.16, 0.44, 0.04, iron, 'iron', [0, 0.02, 0]));
  for (const side of [-1, 1]) { // nogi: udo z płyt, kolano z tłokiem, podudzie, płaska stopa z pazurami
    const th = joint(hips, [0, -0.04, 0.17 * side], walking ? sw * side * 0.45 : side > 0 ? hit * 0.25 : -hit * 0.15);
    th.add(rbox(0.18, 0.3, 0.16, 0.04, col, 'metal', [0, -0.15, 0])); th.add(sph(0.08, iron, 'iron', [0, -0.3, 0]));
    const kn = joint(th, [0, -0.3, 0], walking ? -Math.max(0, Math.cos(ph) * side) * 0.6 : -0.1); kn.add(rbox(0.16, 0.28, 0.15, 0.04, plate, 'gold', [0.02, -0.13, 0]));
    th.add(cyl(0.02, 0.02, 0.3, '#c8ccd4', 'steel', [0.1, -0.2, 0], [0, 0, -0.2])); kn.add(cyl(0.03, 0.03, 0.12, '#5a5a62', 'iron', [0.1, -0.05, 0], [0, 0, 0.2])); // tłok kolana
    kn.add(rbox(0.32, 0.07, 0.2, 0.02, iron, 'iron', [0.06, -0.3, 0])); for (const z of [-0.06, 0, 0.06]) kn.add(spike(0.02, 0.07, '#9aa0a8', 'steel', [0.24, -0.31, z], [0, 0, -Math.PI / 2]));
  }
  const spine = joint(hips, [0, 0.1, 0], 0.08 + hit * 0.3 - wind * 0.12);
  spine.add(cyl(0.3, 0.27, 0.56, col, 'metal', [0, 0.3, 0], null, null, 18)); for (const y of [0.06, 0.3, 0.54]) spine.add(torus(0.3, 0.018, plate, 'gold', [0, y, 0], [Math.PI / 2, 0, 0]));
  mfRivets(spine, [0.29, 0.12, -0.12], [0.29, 0.5, -0.12], 5, LT(plate, 0.2), 0.012); mfRivets(spine, [0.29, 0.12, 0.12], [0.29, 0.5, 0.12], 5, LT(plate, 0.2), 0.012);
  // palenisko z kratą i kabina z szybą, w której widać krasnoluda
  spine.add(rbox(0.06, 0.12, 0.2, 0.02, iron, 'iron', [0.28, 0.14, 0])); for (let i = 0; i < 4; i++) spine.add(box(0.02, 0.1, 0.012, '#1a1414', 'iron', [0.31, 0.14, -0.06 + i * 0.04])); spine.add(box(0.01, 0.08, 0.16, glow, 'glow', [0.3, 0.14, 0]));
  const pl = L.pilot || {}, face = new THREE.Group(); face.position.set(0.21, 0.44, 0.02); face.scale.setScalar(1.35); spine.add(face);
  face.add(sph(0.075, pl.skin || '#d8a878', 'skin', [0, 0, 0], [0.9, 1, 0.9])); face.add(sph(0.06, pl.beard || '#8a5a2a', 'hair', [0.03, -0.06, 0], [0.8, 1.2, 1])); for (const z of [-0.025, 0.025]) face.add(sph(0.012, '#1a1410', 'skin', [0.065, 0.015, z]));
  face.add(torus(0.08, 0.008, '#3a2a1a', 'leather', [0, 0.03, 0], [Math.PI / 2, 0, 0])); for (const z of [-1, 1]) face.add(cyl(0.022, 0.02, 0.02, plate, 'gold', [0.06, 0.035, 0.03 * z], [0, 0, -Math.PI / 2 + 0.4]));
  spine.add(torus(0.155, 0.028, plate, 'gold', [0.27, 0.44, 0.02], [0, Math.PI / 2 - 0.25, 0])); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; spine.add(sph(0.014, LT(plate, 0.2), 'gold', [0.28, 0.44 + Math.sin(a) * 0.155, 0.02 + Math.cos(a) * 0.155])); } const glass = sph(0.145, '#9ad8e8', 'gem', [0.27, 0.44, 0.02], [0.25, 1, 1]); glass.material = glass.material.clone(); glass.material.transparent = true; glass.material.opacity = 0.35; spine.add(glass);
  spine.add(mfDome(0.27, col)); // kopuła hełmu kabiny
  // kominy na plecach z dymem; burzowy: dysze z płomieniem
  for (const z of [-0.12, 0.12]) mfChimney(spine, [-0.22, 0.5, z], 0.32, 0.045, iron, t + z * 3);
  if (L.thrusters) for (const z of [-0.14, 0.14]) { spine.add(cyl(0.06, 0.08, 0.16, iron, 'iron', [-0.3, 0.16, z], [0, 0, 0.3], null, 12)); spine.add(cone(0.06, 0.24 + Math.sin(t * 12 + z) * 0.04, glow, 'fire', [-0.38, 0.06, z], [0, 0, Math.PI - 0.3], 10)); }
  // ramiona: barki z płyt, prawe z młotem parowym (zamach w ataku), lewe z kleszczami albo tarczą
  for (const side of [1, -1]) {
    const sh = joint(spine, [0.02, 0.5, 0.36 * side], side > 0 ? 0.3 + wind * 2.4 - hit * 1.8 + (walking ? -sw * 0.25 : 0) : 0.4 + hit * 0.3 + (walking ? sw * 0.25 : 0));
    sh.add(sph(0.13, plate, 'gold', [0, 0, 0.02 * side], [1, 0.9, 1])); sh.add(rbox(0.13, 0.32, 0.13, 0.03, col, 'metal', [0, -0.2, 0]));
    const el = joint(sh, [0, -0.36, 0], side > 0 ? -0.3 - hit * 0.2 : -0.9); el.add(rbox(0.16, 0.3, 0.15, 0.03, iron, 'iron', [0.01, -0.14, 0])); el.add(cyl(0.025, 0.025, 0.26, '#c8ccd4', 'steel', [-0.08, -0.12, 0]));
    if (side > 0) { el.add(cyl(0.05, 0.05, 0.22, '#5a5a62', 'iron', [0.02, -0.34, 0])); el.add(rbox(0.3, 0.17, 0.2, 0.03, '#4a4a52', 'iron', [0.02, -0.5, 0])); el.add(rbox(0.31, 0.04, 0.21, 0.01, plate, 'gold', [0.02, -0.43, 0])); marker(el, 'fx:hammer', [0.02, -0.55, 0]); }
    else if (L.shieldArm) { el.add(rbox(0.05, 0.5, 0.36, 0.03, plate, 'gold', [0.1, -0.24, 0])); el.add(rbox(0.04, 0.42, 0.28, 0.02, iron, 'iron', [0.125, -0.24, 0])); mfGear(el, 0.09, 0.03, plate, 'gold', [0.15, -0.24, 0], [0, Math.PI / 2, 0], 9); }
    else for (const z of [-1, 1]) el.add(slab([[0, 0], [0.06, 0], [0.12, -0.18], [0.04, -0.24], [0.06, -0.16]], 0.04, '#9aa0a8', 'steel', [0.02, -0.28, 0.05 * z]));
  }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
const mfDome = (r, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r * 0.85, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: col, metalness: 0.75, roughness: 0.35 })); m.position.set(-0.02, 0.58, 0); m.scale.set(1, 0.6, 1); return m; };

// --- kolos: mosiężny olbrzym z paleniskiem w piersi (zionie parą i ogniem), żebra z rur, barki z kominami, głowa-hełm
// z wizjerem, potężne pięści; crest: grzebień z płyt, chimneys: kominy na barkach ---
function colossus(L, P = {}) {
  const root = new THREE.Group(), t = P.t || 0, walking = P.walk != null, ph = (P.walk || 0) * Math.PI * 2, sw = walking ? Math.sin(ph) : 0, A = P.atk, hurt = P.hurt ? 1 : 0;
  const col = L.metal || '#5a5a62', plate = L.plate || '#b8703a', glow = L.glow || '#ff9a3a', iron = DK(col, 0.35);
  const wind = A == null ? 0 : A < 0.45 ? A / 0.45 : A < 0.7 ? 1 - (A - 0.45) / 0.25 : 0, hit = A == null ? 0 : A < 0.45 ? 0 : A < 0.7 ? (A - 0.45) / 0.25 : 1 - (A - 0.7) / 0.3;
  const hips = joint(root, [hit * 0.08, 0.72 + (walking ? Math.abs(sw) * 0.03 : Math.sin(t * 1.6) * 0.008), 0], -hurt * 0.15);
  hips.add(rbox(0.36, 0.2, 0.46, 0.05, iron, 'iron', [0, 0.02, 0])); hips.add(rbox(0.12, 0.26, 0.3, 0.03, plate, 'gold', [0.18, -0.06, 0])); // pas i nabiodrek
  for (const side of [-1, 1]) {
    const th = joint(hips, [0, -0.06, 0.16 * side], walking ? sw * side * 0.38 : 0); th.add(rbox(0.22, 0.34, 0.2, 0.05, col, 'iron', [0, -0.17, 0])); th.add(rbox(0.23, 0.12, 0.21, 0.03, plate, 'gold', [0.005, -0.1, 0]));
    const kn = joint(th, [0, -0.34, 0], walking ? -Math.max(0, Math.cos(ph) * side) * 0.55 : 0); kn.add(sph(0.1, plate, 'gold', [0.04, 0, 0])); kn.add(rbox(0.2, 0.3, 0.19, 0.05, col, 'iron', [0.01, -0.15, 0]));
    kn.add(rbox(0.34, 0.1, 0.25, 0.03, iron, 'iron', [0.06, -0.31, 0])); mfRivets(kn, [0.1, -0.05, 0.1 * side], [0.1, -0.25, 0.1 * side], 3, LT(plate, 0.2), 0.016);
  }
  const spine = joint(hips, [0, 0.08, 0], 0.12 + hit * 0.32 - wind * 0.14);
  spine.add(rbox(0.46, 0.52, 0.64, 0.08, col, 'iron', [0.0, 0.3, 0])); spine.add(rbox(0.3, 0.2, 0.74, 0.06, plate, 'gold', [0, 0.56, 0])); // pierś i barki
  for (let i = 0; i < 4; i++) for (const z of [-1, 1]) spine.add(tube([[0.24, 0.12 + i * 0.09, 0.05 * z], [0.22, 0.14 + i * 0.09, 0.2 * z], [0.12, 0.13 + i * 0.09, 0.3 * z]], 0.016, 0.016, plate, 'gold')); // żebra z rur
  spine.add(cyl(0.12, 0.12, 0.04, iron, 'iron', [0.235, 0.32, 0], [0, 0, Math.PI / 2], null, 18)); spine.add(cyl(0.1, 0.1, 0.02, glow, 'glow', [0.255, 0.32, 0], [0, 0, Math.PI / 2], null, 18)); // palenisko: żar za kratą
  for (let i = 0; i < 5; i++) spine.add(box(0.02, 0.2, 0.018, '#141010', 'iron', [0.265, 0.32, -0.08 + i * 0.04])); spine.add(torus(0.12, 0.02, plate, 'gold', [0.25, 0.32, 0], [0, Math.PI / 2, 0]));
  mfRivets(spine, [0.24, 0.52, -0.28], [0.24, 0.52, 0.28], 7, LT(plate, 0.2), 0.016);
  if (L.chimneys) for (const z of [-0.3, 0.3]) mfChimney(spine, [-0.12, 0.62, z], 0.34, 0.05, iron, t + z);
  else for (const z of [-0.18, 0.18]) mfChimney(spine, [-0.2, 0.58, z], 0.22, 0.035, iron, t + z);
  // głowa: hełm z wizjerem i żarzącymi się oczami, z paszczy bucha para (marker dla zionięcia)
  const head = headJoint(spine, [0.14, 0.7, 0], -0.12); head.scale.setScalar(1.35); head.add(rbox(0.22, 0.2, 0.22, 0.05, col, 'iron', [0.02, 0.06, 0])); head.add(rbox(0.06, 0.14, 0.2, 0.02, plate, 'gold', [0.13, 0.04, 0]));
  head.add(box(0.03, 0.034, 0.17, '#0a0808', 'iron', [0.16, 0.09, 0])); head.add(box(0.012, 0.016, 0.15, glow, 'glow', [0.172, 0.09, 0])); for (const z of [-0.05, 0.05]) head.add(sph(0.026, glow, 'glow', [0.168, 0.09, z], [0.5, 0.8, 1.4]));
  for (let i = 0; i < 3; i++) head.add(box(0.03, 0.012, 0.12, '#0a0808', 'iron', [0.16, 0.0 - i * 0.025, 0])); for (const z of [-1, 1]) head.add(cyl(0.04, 0.04, 0.03, plate, 'gold', [0.02, 0.07, 0.115 * z], [Math.PI / 2, 0, 0], null, 10));
  if (L.crest) for (let i = 0; i < 5; i++) head.add(slab([[0, 0], [0.06, 0], [-0.02, 0.12 - Math.abs(i - 2) * 0.02]], 0.02, plate, 'gold', [0.08 - i * 0.05, 0.16, 0]));
  if (A != null && A > 0.4 && A < 0.85) { const k = Math.sin((A - 0.4) / 0.45 * Math.PI); for (let i = 0; i < 4; i++) { const m = sph(0.05 + i * 0.03, LT('#e8e4dc', i * 0.05), 'cloth', [0.22 + i * 0.1 * k, -0.02 + i * 0.015, 0], null, 10); m.userData.noShadow = true; head.add(m); } }
  marker(head, 'mouth', [0.22, -0.01, 0]);
  for (const side of [1, -1]) {
    const sh = joint(spine, [0.02, 0.5, 0.42 * side], 0.25 + wind * 2.5 - hit * 1.7 + (walking ? -sw * 0.3 * side : 0) + hurt * 0.4);
    sh.add(sph(0.16, plate, 'gold', [0, 0, 0.04 * side], [1, 0.9, 1])); sh.add(rbox(0.2, 0.38, 0.2, 0.05, col, 'iron', [0, -0.24, 0])); sh.add(cyl(0.03, 0.03, 0.34, '#c8ccd4', 'steel', [-0.1, -0.2, 0])); // tłok bicepsa
    const el = joint(sh, [0, -0.44, 0], 0.35 - hit * 0.3); el.add(rbox(0.25, 0.36, 0.25, 0.05, col, 'iron', [0.01, -0.17, 0])); el.add(rbox(0.3, 0.26, 0.28, 0.06, iron, 'iron', [0.03, -0.44, 0])); // pięść
    for (let k = 0; k < 4; k++) el.add(rbox(0.06, 0.05, 0.06, 0.01, plate, 'gold', [0.18, -0.38 - k * 0.04, (k - 1.5) * 0.065]));
    mfRivets(el, [0.13, -0.05, 0.12 * side], [0.13, -0.28, 0.12 * side], 4, LT(plate, 0.2), 0.016);
  }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
