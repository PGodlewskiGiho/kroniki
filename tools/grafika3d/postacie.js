// ==================== MODELE 3D: POSTACIE (look.kind === 'hum') =================================
// Humanoid z cech wyglądu z danych gry (look). Budowa ciała (build): normal, brute (osiłek: szerokie barki, grube ręce,
// mała głowa), lanky (tyczkowaty), slim, stocky (krępy), imp (mały, wielka głowa, brzuszek). Nogi (legs): ludzkie, goat
// (kozie, zgięte do tyłu, z kopytami), beast (zwierzęce ze szponami), talon (ptasie). Tors: tunika, przeszywanica,
// napierśnik, pełna zbroja płytowa z naramiennikami, goły z mięśniami (bare), żebra (ribs), szkielet (bony).
// Do tego szata, ogień lub wężowy ogon zamiast nóg, rogi (hornType), ogon, skrzydła (wingType), aureola, świecące oczy,
// kły, pysk (snout: dog/bull/lizard), jedno oko, broń (także w obu rękach: dual; kilka par rąk: arms).
// P: poza { t, walk (0..1), fly (0..1), atk (0..1), hurt }. Postać patrzy w +x, bliższy bok (prawy, z bronią) to +z.
/* global THREE, G3, mat, mesh, joint, sph, cap, cyl, cone, box, torus, lathe, bone, tube, sheet, decal, slab, rbox, spike, chunk, marker, DK, LT, bright */
const STYLE = w => ({ spear: 'thrust', halberd: 'thrust', lance: 'thrust', trident: 'thrust', pitchfork: 'thrust', glaive: 'thrust', bow: 'bow', crossbow: 'xbow', staff: 'cast', fireball: 'cast', none: 'claw' }[w] || 'swing');
// sh: barki, arm/leg: grubość, armL/legL: długość, torso: wysokość tułowia, chest: głębia klatki, head: głowa
const BUILDS = {
  normal: { sh: 1, arm: 1, armL: 1, leg: 1, legL: 1, torso: 1, chest: 1, head: 1 },
  brute: { sh: 1.42, arm: 1.6, armL: 1.1, leg: 1.4, legL: 0.84, torso: 1.1, chest: 1.35, head: 0.8 },
  lanky: { sh: 0.98, arm: 0.78, armL: 1.2, leg: 0.8, legL: 1.14, torso: 0.96, chest: 0.95, head: 0.9 },
  slim: { sh: 0.88, arm: 0.84, armL: 1, leg: 0.85, legL: 1.05, torso: 0.95, chest: 0.9, head: 0.96 },
  stocky: { sh: 1.2, arm: 1.25, armL: 0.9, leg: 1.25, legL: 0.78, torso: 1.02, chest: 1.2, head: 1.08 },
  imp: { sh: 0.8, arm: 0.66, armL: 1.12, leg: 0.7, legL: 0.72, torso: 0.8, chest: 0.9, head: 1.5, belly: true },
  colossus: { sh: 1.8, arm: 2.1, armL: 1.3, leg: 1.75, legL: 0.8, torso: 1.2, chest: 1.6, head: 0.72 }, // behemot: potężne barki i łapy, mała głowa nisko
};
const buildOf = L => BUILDS[L.build] || (L.tusks && L.hunch ? BUILDS.brute : BUILDS.normal);

function humanoid(L, P = {}) {
  const root = new THREE.Group(), t = P.t || 0, walking = P.walk != null, flying = P.fly != null;
  const ph = (walking ? P.walk : flying ? P.fly : 0) * Math.PI * 2, sw = walking ? Math.sin(ph) : 0;
  const bony = !!L.bony, B = buildOf(L), S = bony ? 0.8 : 1, skin = L.skin || '#d8a878', cloth = L.cloth || (bony ? skin : '#6a5a4a'), lea = L.leather || '#4a3222', metal = L.metal || '#b8c0cc';
  const skinK = L.hide === true ? 'hide' : L.hide || (bony ? 'bone' : 'skin'), bare = !!L.bare, W = L.weapon || 'none', style = STYLE(W), armor = L.armor === true ? 'plate' : L.armor || null;
  const legless = !!(L.robe || L.flame || L.serpent || L.noLegs), legT = L.legs || 'human';
  const A = P.atk != null ? P.atk : null, hurt = P.hurt ? 1 : 0;
  // przebieg ataku: zamach (0..0,45), cios (0,45..0,7), powrót
  const wind = A == null ? 0 : A < 0.45 ? A / 0.45 : A < 0.7 ? 1 - (A - 0.45) / 0.25 : 0, hit = A == null ? 0 : A < 0.45 ? 0 : A < 0.7 ? (A - 0.45) / 0.25 : 1 - (A - 0.7) / 0.3;
  const hunch = L.hunch === true ? 0.22 : L.hunch || 0, pitch = flying ? 0.55 + Math.sin(ph) * 0.05 : 0;
  const lean = hunch + (style === 'thrust' || style === 'claw' ? hit * 0.2 : style === 'swing' ? hit * 0.14 - wind * 0.1 : 0) - hurt * 0.3;
  // --- nogi: długości i kąty spoczynkowe; wysokość bioder tak, by stopy stały na ziemi ---
  const LL = B.legL, legSegs = legT === 'goat' || legT === 'beast' || legT === 'talon' ? [[0.3 * LL, 0.5], [0.32 * LL, -1.35], [0.22 * LL, 0.95]] : [[0.35 * LL, 0], [0.34 * LL, 0]];
  let hipH = legSegs.length === 3 ? 0.07 : 0.1, acc = 0; for (const [l, a] of legSegs) { acc += a; hipH += l * Math.cos(acc); }
  if (legless) hipH = 0.79;
  const hover = L.hover ? 0.2 + Math.sin(t * 2.4) * 0.04 : 0;
  const bob = walking ? Math.abs(Math.sin(ph)) * (legless ? 0.015 : 0.035) : flying ? Math.sin(ph) * 0.04 : Math.sin(t * 2.4) * 0.01;
  const hips = joint(root, [0, hipH + bob + hover + (L.flame ? 0.06 : 0), 0], -pitch);
  const legCol = bony ? skin : bare || L.legsBare ? skin : DK(cloth, 0.3), legK = bony ? 'bone' : bare || L.legsBare ? skinK : armor === 'plate' ? 'mail' : 'cloth';
  if (!legless) for (const side of [-1, 1]) {
    const th = joint(hips, [0, -0.03, (L.mounted ? 0.2 : 0.11) * side * B.sh * S]), goat = legSegs.length === 3;
    const swing = walking ? sw * side * 0.5 : flying ? -0.5 - side * 0.12 : (side > 0 ? 0.1 : -0.06) + hurt * 0.1;
    th.rotation.z = L.mounted ? 1.3 : legSegs[0][1] + swing;
    const tr = 0.1 * S * B.leg, [thL] = legSegs[0];
    if (bony) bone(th, 0.035, 0.03, thL, skin, 'bone');
    else { bone(th, tr, tr * 0.78, thL, legCol, legK); if (bare || goat) th.add(sph(tr * 1.05, legCol, legK, [0.02, -thL * 0.4, 0], [1, 1.6, 0.95])); } // udo z mięśniem
    const kn = joint(th, [0, -thL, 0]); const [shL, shA] = legSegs[1];
    kn.rotation.z = L.mounted ? -1.4 : shA + (walking ? -Math.max(0, Math.cos(ph) * side) * 0.8 : flying ? -0.7 : 0);
    if (bony) { kn.add(sph(0.045, skin, 'bone', [0, 0, 0])); bone(kn, 0.03, 0.025, shL, skin, 'bone'); kn.add(cap(0.03, 0.1, skin, 'bone', [0.05, -shL, 0], [0, 0, Math.PI / 2])); continue; }
    if (armor === 'plate' || armor === 'breast') { kn.add(slab([[0, 0.07], [0.07, 0], [0.02, -0.08], [-0.05, -0.02]], 0.16 * B.leg, metal, 'steel', [0.07, 0, 0], [0, 0, 0])); } // nakolannik
    const sr = 0.075 * S * B.leg; bone(kn, sr, sr * 0.8, shL, legCol, legK);
    if (armor === 'plate') kn.add(cyl(sr * 1.15, sr * 1.05, shL * 0.7, metal, 'metal', [0, -shL * 0.45, 0], null, null, 10)); // nagolennik
    if (goat) { // kozia (albo zwierzęca) noga: śródstopie do przodu, kopyto albo szpony
      const an = joint(kn, [0, -shL, 0], legSegs[2][1] + (walking ? Math.max(0, Math.cos(ph) * side) * 0.5 : 0)), mL = legSegs[2][0];
      an.add(sph(sr * 0.9, legCol, legK)); bone(an, sr * 0.75, sr * 0.6, mL, legCol, legK);
      if (legT === 'goat') { an.add(cyl(sr * 0.7, sr * 0.95, 0.07, '#1a1210', 'horn', [0.02, -mL - 0.03, 0])); an.add(box(0.012, 0.07, sr * 1.9, '#0a0808', 'horn', [0.07, -mL - 0.03, 0])); } // rozszczepione kopyto
      else for (let k = -1; k <= 1; k++) an.add(spike(0.014, 0.1, '#f0e8d0', 'horn', [0.07, -mL - 0.02, k * 0.035], [0, 0, -1.9])); // szpony
      if (legT === 'goat' && !L.legsBare) an.add(sph(sr * 1.3, DK(skin, 0.35), 'fur', [0, -0.02, 0], [1, 1.6, 1])); // kosmaty staw
      continue;
    }
    const boots = armor === 'plate' ? metal : DK(lea, 0.05), bK = armor === 'plate' ? 'metal' : 'leather';
    kn.add(lathe([[0.075, 0], [0.078, 0.2], [0.09, 0.22], [0.001, 0.23]], boots, bK, [0, -shL - 0.02, 0]));
    kn.add(cap(0.066, 0.13, boots, bK, [0.07, -shL - 0.03, 0], [0, 0, Math.PI / 2], [1, 1, 1.2]));
    if (armor === 'plate') kn.add(spike(0.03, 0.08, boots, 'metal', [0.16, -shL - 0.04, 0], [0, 0, -Math.PI / 2])); // szpiczasty trzewik
    else kn.add(torus(0.085, 0.015, DK(boots, 0.3), 'leather', [0, -shL + 0.19, 0], [Math.PI / 2, 0, 0]));
  }
  if (L.robe && !L.flame && !L.serpent) { // szata do ziemi z fałdami, spod niej czubki butów; lamówka
    const trail = flying ? 0.3 : 0;
    hips.add(lathe([[0.2 * S, 0.12], [0.24 * S, -0.2], [0.3 * S, -0.55], [0.34 * S, -hipH + 0.02], [0.3 * S, -hipH]], cloth, 'cloth', [0, 0, 0], [1, 1, 1.1], 2, [13, 0.09, 0.1, -hipH]));
    if (L.trim) hips.add(torus(0.31 * S, 0.018, L.trim, 'gold', [0, -hipH + 0.05, 0], [Math.PI / 2, 0, 0], [1, 1.1, 1]));
    if (!trail) for (const z of [-0.08, 0.08]) hips.add(cap(0.06, 0.1, DK(lea, 0.05), 'leather', [0.2 + (walking ? Math.sin(ph + z * 20) * 0.04 : 0), -hipH + 0.05, z], [0, 0, Math.PI / 2]));
  }
  if (L.flame) { // języki ognia zamiast nóg: kilka warstw od białego rdzenia po ciemny koniec, skręcone w wir
    const F = L.flame; for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + t * 1.5, r = 0.14, fl = Math.sin(t * 9 + i * 1.9) * 0.08, len = 0.5 + fl + (i % 3) * 0.12;
      hips.add(cone(0.08 + (i % 2) * 0.03, len, i % 3 === 0 ? DK(F, 0.25) : i % 3 === 1 ? F : LT(F, 0.3), 'fire', [Math.cos(a) * r * 0.6 - 0.05, -0.3 - (i % 2) * 0.05, Math.sin(a) * r], [Math.PI, 0, 0.25 + Math.sin(a) * 0.12], 6)); }
    hips.add(cone(0.1, 0.75, LT(F, 0.6), 'fire', [-0.12, -0.45, 0], [Math.PI, 0, 0.45], 6)); hips.add(sph(0.2, F, 'fire', [0, -0.05, 0], [1.1, 0.6, 1.1]));
  }
  if (L.serpent) { // wężowy ogon: od bioder do ziemi i zwinięty za plecami, z łuskami na brzuchu
    const v = walking ? Math.sin(ph) * 0.05 : Math.sin(t * 2.5) * 0.02, pts = [[0, 0.05, 0], [0.06, -0.3, 0], [0.02, -hipH + 0.14, 0.04], [-0.3, -hipH + 0.1, 0.02 + v], [-0.65, -hipH + 0.12, -0.1 - v], [-0.9, -hipH + 0.22, 0.05], [-1.05, -hipH + 0.36, 0.12]];
    hips.add(tube(pts, 0.19, 0.03, L.serpent, 'scale', 3));
    for (let i = 1; i < 5; i++) hips.add(spike(0.03, 0.09, DK(L.serpent, 0.4), 'horn', [pts[i][0] - 0.04, pts[i][1] + 0.14 - i * 0.02, pts[i][2]], [0, 0, 0.9]));
  }
  if (L.tail) { const tw = Math.sin(t * 3 + (walking ? ph : 0)) * 0.06, tip = [-0.82, 0.14 + tw, 0];
    hips.add(tube([[-0.12, 0, 0], [-0.38, -0.22, 0], [-0.62, -0.12, 0.02], tip], 0.06 * B.leg, 0.018, L.tail, L.snout ? 'scale' : skinK));
    if (L.horns && !L.snout) hips.add(slab([[0, 0.06], [0.1, 0], [0, -0.06], [0.03, 0]], 0.02, DK(L.tail, 0.3), 'horn', [tip[0] - 0.08, tip[1], 0], [0, 0, Math.PI])); } // grot na ogonie diabła
  // --- tułów ---
  const tl = B.torso, spine = joint(hips, [0, 0, 0], -lean), cz = 1.18 * B.chest;
  if (bony) { // żebra, kręgosłup, miednica
    spine.add(cyl(0.03, 0.03, 0.62, skin, 'bone', [-0.03, 0.3, 0]));
    for (let i = 0; i < 5; i++) spine.add(torus(0.16 - i * 0.012, 0.018, skin, 'bone', [0.02, 0.5 - i * 0.07, 0], [Math.PI / 2, 0, 0], [1, 1.25, 1], Math.PI * 1.6));
    spine.add(sph(0.14, skin, 'bone', [0, -0.02, 0], [1, 0.55, 1.2]));
    if (L.rags) spine.add(lathe([[0.17, 0.1], [0.2, -0.05], [0.23, -0.25]], L.rags, 'cloth', [0, 0, 0], [1, 1, 1.15], 1, [9, 0.2, 0.1, -0.25])); // strzępy przepaski
  } else {
    const top = bare ? skin : cloth, topK = bare ? skinK : armor === 'quilt' || armor === 'breast' ? 'quilt' : armor === 'plate' ? 'mail' : 'cloth';
    const TP = [[0.001, -0.06], [0.2, -0.04], [0.19, 0.1], [0.165, 0.2], [0.21, 0.36], [0.225, 0.46], [0.18, 0.55], [0.08, 0.62], [0.001, 0.63]].map(([r, y]) => [r * S, y * tl]);
    if (bare) { const sw = 0.25 * S * B.sh * (cz / 1.18) ** 0.3, dp = B.chest; // nagi tors z przekrojów: szerokie barki, klatka, wcięta talia (litera V)
      spine.add(loft([[-0.07, 0.17 * S, 0.13, 0.13, 0], [0.12 * tl, 0.165 * S * (B.belly ? 1.25 : 1), 0.13 * (B.belly ? 1.5 : 1), 0.12, 0], [0.3 * tl, sw * 0.8, 0.16 * dp, 0.14, 0], [0.46 * tl, sw, 0.19 * dp, 0.16 * dp, 0],
        [0.56 * tl, sw * 1.02, 0.13 * dp, 0.16 * dp, 0], [0.64 * tl, sw * 0.4, 0.08, 0.09, 0]], top, topK, 'y', null, null, 1.5)); }
    else spine.add(lathe(TP, top, topK, [0, 0, 0], [1, 1, cz], 2, [7, 0.035, 0.5, 0.0]));
    if (bare) { // mięśnie: klatka, brzuch, obojczyki
      for (const z of [-1, 1]) spine.add(sph(0.11 * B.chest, skin, skinK, [0.13, 0.44 * tl, 0.085 * z * B.sh], [0.55, 0.75, 1.05]));
      for (let r = 0; r < 3; r++) for (const z of [-1, 1]) spine.add(sph(0.042, skin, skinK, [0.165 + (B.belly ? 0.05 : 0), (0.3 - r * 0.075) * tl, 0.045 * z], [0.5, 0.8, 0.9], 10));
      if (B.belly) spine.add(sph(0.16, skin, skinK, [0.08, 0.14, 0], [1, 0.9, 1.1])); // brzuszek chochlika
      if (L.ribs) for (let i = 0; i < 4; i++) for (const z of [-1, 1]) spine.add(torus(0.17, 0.012, DK(skin, 0.2), skinK, [0.02, 0.42 - i * 0.06, 0], [Math.PI / 2, 0, 0], [1, 1.15, 1], Math.PI * 0.6)); // żebra pod skórą
    }
    if (!L.robe && !L.noLegs) { // spódnica tuniki, fartuch płyt albo przepaska
      if (armor === 'plate') for (let i = 0; i < 3; i++) spine.add(lathe([[0.215 * S + i * 0.012, 0.04 - i * 0.065], [0.24 * S + i * 0.014, -0.03 - i * 0.065]], metal, 'steel', [0, 0, 0], [1, 1, 1.15]));
      else if (bare) { spine.add(lathe([[0.2 * S, 0.1], [0.215 * S, -0.03]], lea, 'leather', [0, 0, 0], [1, 1, 1.15])); spine.add(slab([[0, 0], [0.09, 0], [0.07, -0.26], [0.02, -0.26]], 0.02, cloth, 'cloth', [0.17, 0.02, -0.045], [0, 0, 0.08])); } // przepaska
      else spine.add(lathe([[0.2 * S, 0.12], [0.235 * S, -0.05], [0.265 * S, -0.22], [0.235 * S, -0.23]], armor ? metal : cloth, armor ? 'mail' : 'cloth', [0, 0, 0], [1, 1, 1.15], 2, [11, 0.09, 0.1, -0.23]));
    }
    if (armor === 'plate' || armor === 'breast') { // napierśnik z grzbietem pośrodku (łapie światło) i krawędziami
      const bp = [[0.205, 0.08], [0.225, 0.2], [0.24, 0.36], [0.235, 0.47], [0.18, 0.56], [0.001, 0.57]].map(([r, y]) => [r * S, y * tl]);
      const cu = lathe(bp, metal, 'steel', [0.012, 0, 0], [1, 1, cz * 0.99]); spine.add(cu);
      spine.add(box(0.03, 0.4 * tl, 0.018, LT(metal, 0.2), 'steel', [0.245 * S, 0.3 * tl, 0], [0, 0, -0.05])); // grzbiet
      spine.add(torus(0.215 * S, 0.012, DK(metal, 0.35), 'metal', [0.012, 0.08, 0], [Math.PI / 2, 0, 0], [1, cz, 1]));
      for (let i = 0; i < 6; i++) { const a = -0.8 + i * 0.32; spine.add(sph(0.012, '#e8d8a0', 'gold', [Math.cos(a) * 0.235 * S + 0.012, 0.47 * tl, Math.sin(a) * 0.235 * S * cz], null, 8)); }
    }
    if (armor === 'brig') for (let r = 0; r < 4; r++) for (let c = -2; c <= 2; c++) spine.add(sph(0.011, '#d8c890', 'gold', [0.2 * S, (0.2 + r * 0.09) * tl, c * 0.06], null, 6)); // nity brygantyny
    if (armor === 'plate' || L.pauldrons) for (const z of [-1, 1]) { // naramienniki z warstw blach, opcjonalnie z kolcem
      const pa = joint(spine, [0, 0.53 * tl, 0.26 * z * S * B.sh]); pa.rotation.x = -0.25 * z;
      for (let i = 0; i < 3; i++) pa.add(mesh(new THREE.SphereGeometry(0.14 * S * B.arm ** 0.5 - i * 0.012, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), i ? DK(metal, 0.12 * i) : metal, 'steel', [0, -i * 0.045, 0.012 * i * z], null, [1.1, 0.8, 1]));
      if (L.pauldrons === 'spiked') for (let k = 0; k < 2; k++) pa.add(spike(0.03, 0.16, LT(metal, 0.15), 'steel', [-0.03 + k * 0.07, 0.07, 0.02 * z], [0.5 * z, 0, 0.15]));
    }
    if (!bare) { spine.add(torus(0.205 * S, 0.028, lea, 'leather', [0, 0.13, 0], [Math.PI / 2, 0, 0], [1, cz, 1])); spine.add(rbox(0.035, 0.07, 0.08, 0.01, '#d8b048', 'gold', [0.215 * S, 0.13, 0])); spine.add(rbox(0.08, 0.1, 0.06, 0.015, lea, 'leather', [0.05, 0.07, 0.23 * S])); } // pas, klamra, sakiewka
    else spine.add(torus(0.2 * S, 0.022, lea, 'leather', [0, 0.1, 0], [Math.PI / 2, 0, 0], [1, cz, 1]));
    if (L.tabard) { const cr = L.cross; spine.add(decal(0.26, 0.62, (g, w, h) => { g.fillStyle = L.tabard; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 6; x < w; x += 12) g.fillRect(x, 0, 2, h); if (cr) { g.fillStyle = cr; g.fillRect(w / 2 - 6, 14, 12, h * 0.55); g.fillRect(10, 36, w - 20, 11); } }, [0.25 * S, 0.22, 0], [0, Math.PI / 2, 0])); }
    if (L.quiver) { const q = joint(spine, [-0.22 * S, 0.32, -0.05], -0.35); q.add(cyl(0.065, 0.075, 0.5, L.quiver, 'leather')); q.add(torus(0.07, 0.012, '#c8a050', 'gold', [0, 0.24, 0], [Math.PI / 2, 0, 0])); for (let i = 0; i < 5; i++) { q.add(cyl(0.006, 0.006, 0.14, '#c8a878', 'wood', [0.03 * Math.cos(i * 1.3), 0.32, 0.03 * Math.sin(i * 1.3)])); q.add(cone(0.02, 0.06, i % 2 ? '#e8e0cc' : '#b83a2a', 'cloth', [0.03 * Math.cos(i * 1.3), 0.4, 0.03 * Math.sin(i * 1.3)], null, 4)); } }
    if (L.spikes) for (const z of [-1, 1]) for (let i = 0; i < 3; i++) spine.add(spike(0.03, 0.14, L.spikes === true ? '#e8e0cc' : L.spikes, 'horn', [-0.04 + i * 0.05, 0.64 * tl, 0.26 * S * z * B.sh], [0.3 * z, 0, -0.2]));
    if (L.backSpikes) { const k = Math.sqrt(B.sh); for (let i = 0; i < 5; i++) spine.add(spike(0.035 * k, (0.17 - i * 0.02) * k, L.backSpikes, 'horn', [-0.17 * S * k, (0.6 - i * 0.12) * tl, 0], [0, 0, 1.2])); // kolce na grzbiecie
      if (B === BUILDS.colossus) for (const z of [-1, 1]) for (let i = 0; i < 3; i++) spine.add(slab([[0, 0], [0.1, 0], [-0.04, 0.26 - i * 0.05]], 0.03, L.backSpikes, 'horn', [-0.05 + i * 0.08, 0.6 * tl, 0.3 * z * B.sh * 0.8], [0.5 * z, 0, -0.3 + i * 0.2])); } // kostne kolce na barkach
    if (L.beads) spine.add(torus(0.13, 0.012, L.beads, 'wood', [0.14, 0.44 * tl, 0], [Math.PI / 2 + 0.9, 0, -0.3], [1, 1.3, 1])); // różaniec
  }
  if (L.cape) {
    if (flying && !L.wings) wings(spine, L.cape, 'cape', t, ph, A, 1, true); // w locie peleryna rozpina się jak skrzydła nietoperza
    else { const cp = mesh(new THREE.CylinderGeometry(0.2, 0.36, legless ? 1.2 : 0.98, 18, 1, true, Math.PI * 1.5 - 1.2, 2.4), L.cape, 'cloth', [0.02, legless ? -0.02 : 0.08, 0], [0, 0, 0.1 + (walking ? Math.abs(sw) * 0.08 : 0) + (flying ? 0.6 : 0)], [1, 1, 1.25]); cp.material = cp.material.clone(); cp.material.side = THREE.DoubleSide; spine.add(cp);
      if (L.collar) spine.add(mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.22, 14, 1, true, Math.PI * 0.8, Math.PI * 1.4), L.cape, 'cloth', [-0.02, 0.66 * tl, 0], null, [1, 1, 1.25])); } // wysoki kołnierz wampira
  }
  if (L.wings) wings(spine, L.wings, L.wingType || (bright(L.wings) ? 'feather' : 'bat'), t, flying ? ph : walking ? ph : null, A, L.wingSpan || 1, flying);
  // --- głowa ---
  const hulk = B === BUILDS.brute || B === BUILDS.colossus, col = B === BUILDS.colossus; // głowa nisko, wysunięta, osadzona w karku
  const neck = joint(spine, [0.03 + (hulk ? 0.04 : 0) + (col ? 0.06 : 0), 0.6 * tl - (hulk ? 0.05 : 0) - (col ? 0.06 : 0), 0]); neck.add(cyl(bony ? 0.03 : 0.065 * B.arm ** 0.6, bony ? 0.03 : 0.06, 0.12, skin, bony ? 'bone' : skinK, [0, 0.04, 0]));
  if (hulk && !bony) neck.add(rbox(0.2, 0.14 * (col ? 1.3 : 1), 0.36 * (col ? 1.4 : 1), 0.05, bare ? skin : cloth, bare ? skinK : 'cloth', [-0.06, -0.02, 0], [0, 0, -0.35])); // kark osiłka
  const head = joint(neck, [0.02, 0.18, 0], lean * 0.6 - hurt * 0.2 + (flying ? 0.4 : 0)), hr = 0.14 * B.head;
  headOf(head, L, hr, skin, t, A);
  if (L.halo) head.add(torus(0.12, 0.014, L.halo, 'glow', [-0.02, hr + 0.12, 0], [Math.PI / 2 + 0.25, 0, 0]));
  // --- ręce i broń ---
  const pairs = L.arms ? L.arms / 2 : 1;
  for (let pr = 0; pr < pairs; pr++) for (const side of [1, -1]) {
    const near = side === 1, main = pr === 0, sh = joint(spine, [0.0, (0.5 - pr * 0.12) * tl, 0.26 * side * S * B.sh * (1 - pr * 0.08)]);
    let aSh, aEl; const armed = near || L.dual || !main;
    if (armed && !(style === 'bow' && !near)) {
      const k = main ? 1 : 0.7, off = main ? 0 : (pr * 0.5 + (near ? 0 : 0.3));
      if (style === 'thrust') { aSh = 0.3 + hit * 0.9 - wind * 0.3; aEl = 1.0 - hit * 0.7; }
      else if (style === 'swing') { aSh = 0.3 + wind * 2.4 * k - hit * 1.2 + off; aEl = 0.7 + wind * 0.2 - hit * 0.4; if (!near && L.dual && main && A != null) { aSh = 0.3 + (1 - wind) * 1.4 * (A > 0.3 ? 1 : 0) + hit * 0.6; } }
      else if (style === 'bow') { aSh = A == null ? 0.25 : 1.45; aEl = A == null ? 0.9 : 0.05; }
      else if (style === 'xbow') { aSh = A == null ? 0.5 : 1.3; aEl = A == null ? 1.0 : 0.3; }
      else if (style === 'cast') { aSh = 0.3 + (A == null ? 0 : Math.sin(A * Math.PI) * 1.4); aEl = 0.6 - (A == null ? 0 : Math.sin(A * Math.PI) * 0.4); }
      else { aSh = 0.3 + hit * 1.3 + wind * 0.4; aEl = 0.8 - hit * 0.6; }
      if (walking && A == null) aSh += -sw * 0.35 * side; if (flying && A == null) aSh += 0.9; aSh += hurt * 0.6;
    } else {
      aSh = (walking ? sw * 0.35 : 0.1) + (L.shield ? 0.9 : 0) + (style === 'bow' && A != null ? 1.4 : 0) + (style === 'xbow' ? 1.1 : 0) + (style === 'claw' ? hit * 1.4 + wind * 0.3 : 0) + hurt * 0.5 + (flying ? 0.7 : 0);
      aEl = L.shield ? 0.7 : style === 'bow' && A != null ? 0.1 : style === 'xbow' ? 0.9 : 0.5;
    }
    sh.rotation.z = aSh;
    const ar = 0.078 * S * B.arm, uL = 0.29 * B.armL, fL = 0.26 * B.armL, bareArm = bare || L.bareArms || (!armor && !L.robe && !L.sleeves && bare !== false && !!L.claws);
    const armCol = bony ? skin : bareArm ? skin : armor === 'plate' ? metal : cloth, aK = bony ? 'bone' : bareArm ? skinK : armor === 'plate' ? 'mail' : 'cloth';
    if (bony) bone(sh, 0.032, 0.026, uL, skin, 'bone'); else { bone(sh, ar, ar * 0.82, uL, armCol, aK); if (bareArm) { sh.add(sph(ar * 1.12, skin, skinK, [0.02, -uL * 0.42, 0], [1.1, 1.7, 1])); sh.add(sph(ar * 1.15, skin, skinK, [0, -0.02, 0], [1.1, 1, 1.1])); } } // biceps i bark
    if (armor === 'plate' && !bony) for (const y of [-0.1, -0.17]) sh.add(torus(ar * 0.98, 0.012, DK(metal, 0.2), 'metal', [0, y * B.armL, 0], [Math.PI / 2, 0, 0]));
    if (L.robe && !bony && !bareArm) sh.add(mesh(new THREE.CylinderGeometry(ar * 1.2, ar * 1.9, uL + fL * 0.6, 12, 1, true), cloth, 'cloth', [0, -(uL + fL * 0.6) / 2 - 0.03, 0])); // szeroki rękaw
    const el = joint(sh, [0, -uL, 0], aEl);
    if (bony) bone(el, 0.026, 0.022, fL, skin, 'bone');
    else {
      bone(el, ar * 0.84, ar * 0.68, fL, armCol, aK); if (bareArm) el.add(sph(ar * 0.95, skin, skinK, [0.01, -fL * 0.28, 0], [1, 1.6, 1]));
      const cuff = armor === 'plate' ? metal : L.bracers || lea; el.add(cyl(ar * 0.92, ar * 0.8, 0.11, cuff, armor === 'plate' || L.bracers ? 'metal' : 'leather', [0, -fL * 0.8, 0])); // karwasz
      if (armor === 'plate') el.add(spike(0.02, 0.07, metal, 'steel', [0, -0.02, 0], [0, 0, Math.PI / 2 + 0.4])); // szpic łokcia
    }
    const handR = bony ? 0.04 : 0.058 * S * (B.arm ** 0.6);
    el.add(sph(handR, armor === 'plate' && !bony ? metal : skin, armor === 'plate' && !bony ? 'steel' : bony ? 'bone' : skinK, [0.01, -fL - 0.03, 0], [1, 1.1, 0.8]));
    const hand = joint(el, [0, -fL - 0.03, 0]), world = aSh + aEl - lean - pitch;
    const hold = wa => { hand.rotation.z = wa - world; return hand; };
    if (armed && W !== 'none' && !(style === 'bow' && !near) && !(style === 'xbow' && !near)) weapon(hold, main ? L : { ...L, weapon: L.extraWeapon || W }, main ? W : L.extraWeapon || W, A, wind, hit, metal, near);
    if (!near && main && L.shield && !L.dual) shield(hold(Math.PI / 2), L, metal);
    if (!near && style === 'bow' && A != null) { const hh = hold(-Math.PI / 2 + 0.1); hh.add(cyl(0.006, 0.006, 0.7, '#c8a878', 'wood', [0.02, 0.35, 0])); } // strzała na cięciwie
    if (L.bigClaws) for (let i = 0; i < 4; i++) hand.add(slab([[0, 0.02], [0.03, 0], [0.12, -0.14], [0.08, -0.3], [0.0, -0.04]], 0.024, '#f0e8d0', 'horn', [0.02, -0.06, (i - 1.5) * 0.035], [0, (i - 1.5) * 0.15, 0.25])); // szable pazurów behemota
    else if (L.claws && (W === 'none' || !near)) for (let i = 0; i < 3; i++) hand.add(spike(0.012, 0.1 * (B.arm ** 0.5), '#f0e8d0', 'horn', [0.03, -0.05, (i - 1) * 0.025], [0, 0, 2.4]));
    if (L.handFire && (near || W === 'none')) { const hf = hold(0); for (let i = 0; i < 5; i++) hf.add(cone(0.035, 0.14 + (i % 2) * 0.06, i % 2 ? L.handFire : LT(L.handFire, 0.4), 'fire', [Math.cos(i * 1.3) * 0.03, 0.08, Math.sin(i * 1.3) * 0.03], [Math.sin(t * 8 + i) * 0.2, 0, Math.cos(i) * 0.2], 5)); } // płonąca dłoń
  }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}

// Głowa: twarz (kanciasta żuchwa, łuki brwiowe), oczy, włosy, zarost, uszy, kły, pysk, rogi i nakrycie głowy
function headOf(head, L, hr, skin, t, A) {
  const bony = !!L.bony, eyeCol = L.eyes || '#2a1c10', glowEye = L.eyes && (bony || bright(L.eyes)), eK = glowEye ? 'glow' : 'skin', skinK = L.hide === true ? 'hide' : L.hide || 'skin';
  const open = A != null ? Math.sin(Math.min(1, A) * Math.PI) : 0;
  if (bony) {
    head.add(sph(hr, skin, 'bone', [0, 0.01, 0], [1, 1.05, 0.9])); head.add(sph(hr * 0.62, skin, 'bone', [0.06, -0.08, 0], [1, 0.7, 0.9]));
    for (const z of [-0.05, 0.05]) { head.add(sph(0.036, '#141014', 'skin', [hr * 0.78, 0.02, z], [0.6, 1, 1])); if (L.eyes) head.add(sph(0.016, eyeCol, 'glow', [hr * 0.86, 0.02, z])); }
    head.add(box(0.02, 0.018, 0.08, '#e8e0d0', 'bone', [hr * 0.86, -0.09, 0])); head.add(box(0.04, 0.03, 0.1, skin, 'bone', [hr * 0.6, -0.14 - open * 0.03, 0])); // zęby i żuchwa
  } else if (L.snout === 'bull') { // łeb byka (minotaur): szeroki pysk, nozdrza, kółko w nosie
    head.add(sph(hr * 1.1, skin, 'fur', [0, 0.02, 0], [1, 1, 0.95])); head.add(rbox(hr * 1.2, hr * 0.9, hr * 1.1, 0.04, skin, 'fur', [hr * 0.75, -hr * 0.35, 0], [0, 0, -0.35]));
    head.add(rbox(hr * 0.6, hr * 0.5, hr * 0.95, 0.04, DK(skin, 0.35), 'skin', [hr * 1.3, -hr * 0.6, 0], [0, 0, -0.35]));
    for (const z of [-1, 1]) { head.add(sph(0.018, '#100808', 'skin', [hr * 1.55, -hr * 0.5, 0.035 * z])); head.add(sph(0.02, L.eyes || '#e03020', L.eyes ? 'glow' : 'skin', [hr * 0.7, hr * 0.25, 0.1 * z])); head.add(box(0.07, 0.022, 0.05, DK(skin, 0.4), 'fur', [hr * 0.65, hr * 0.38, 0.1 * z], [0, 0, -0.35])); head.add(cone(0.04, 0.12, skin, 'fur', [-0.02, hr * 0.3, hr * 0.95 * z], [0.9 * z, 0, 0.2], 6)); }
    head.add(torus(0.035, 0.008, '#e0c060', 'gold', [hr * 1.6, -hr * 0.8, 0], [0, Math.PI / 2, 0])); head.add(sph(hr * 0.7, DK(skin, 0.3), 'fur', [-0.02, hr * 0.5, 0], [1, 0.5, 1.2])); // kółko, grzywka
  } else {
    head.add(sph(hr, skin, skinK, [0, 0, 0], [0.98, 1.08, 0.92])); // czaszka
    head.add(rbox(hr * 0.95, hr * 0.62, hr * 1.2, 0.03, skin, skinK, [hr * 0.35, -hr * 0.52, 0], [0, 0, -0.18])); // kanciasta żuchwa
    head.add(rbox(hr * 0.36, hr * 0.2, hr * 1.35, 0.02, DK(skin, 0.12), skinK, [hr * 0.78, hr * 0.28, 0], [0, 0, -0.3])); // łuki brwiowe
    for (const z of [-1, 1]) head.add(sph(hr * 0.24, skin, skinK, [hr * 0.62, -hr * 0.12, hr * 0.5 * z], [0.8, 0.7, 1], 10)); // kości policzkowe
    if (L.snout) { // pysk psa (gnoll), jaszczura
      const lz = L.snout === 'lizard', len = lz ? 0.2 : 0.15;
      head.add(rbox(len, 0.075, 0.1, 0.025, skin, lz ? 'scale' : 'fur', [hr + len * 0.4, -0.05, 0], [0, 0, -0.1])); head.add(sph(0.032, '#140c08', 'skin', [hr + len * 0.9, -0.03, 0], [1, 0.8, 1.2]));
      const jw = joint(head, [hr * 0.6, -0.09, 0], -open * 0.5); jw.add(rbox(len * 0.95, 0.04, 0.085, 0.015, DK(skin, 0.15), lz ? 'scale' : 'fur', [len * 0.55, -0.01, 0]));
      for (let k = 0; k < 3; k++) for (const z of [-0.035, 0.035]) head.add(spike(0.008, 0.035, '#f0ead8', 'horn', [hr + 0.02 + k * 0.045, -0.095, z], [Math.PI, 0, 0]));
    } else head.add(cone(0.03, 0.08, skin, skinK, [hr * 0.98, -0.01, 0], [0, 0, -Math.PI / 2 + 0.3], 6)); // nos
    if (L.cyclops) { head.add(sph(0.05, '#f0ece2', 'skin', [hr * 0.8, 0.03, 0])); head.add(sph(0.026, L.eyes || '#3a2a1a', eK, [hr * 0.9, 0.03, 0])); head.add(rbox(0.06, 0.03, 0.16, 0.01, DK(skin, 0.3), skinK, [hr * 0.84, 0.1, 0], [0, 0, -0.3])); }
    else if (!L.blind) for (const z of [-0.055, 0.055]) { // oczy głęboko pod brwiami
      head.add(sph(0.022, glowEye ? eyeCol : '#f0ece2', eK, [hr * 0.83, 0.02, z], [0.6, 0.65, 1], 10)); head.add(sph(0.012, glowEye ? LT(eyeCol, 0.5) : eyeCol, eK, [hr * 0.9, 0.02, z], null, 8));
      head.add(box(0.03, 0.014, 0.06, L.hair || DK(skin, 0.5), 'hair', [hr * 0.86, 0.058, z], [0, 0, -0.2])); // brwi
    }
    head.add(box(0.012, 0.01, 0.05 + open * 0.02, DK(skin, 0.5), 'skin', [hr * 0.92, -0.075 - open * 0.015, 0])); // usta
    if (L.grin) for (let k = -2; k <= 2; k++) head.add(spike(0.007, 0.022, '#f8f0e0', 'horn', [hr * 0.95, -0.07, k * 0.012], [Math.PI, 0, 0])); // szeroki uśmiech chochlika
    const ears = L.bigEars ? 0.3 : L.ears ? 0.17 : 0;
    if (ears) for (const z of [-1, 1]) head.add(slab([[0, -0.03], [0, 0.04], [-ears * 0.6, ears * 0.55], [-ears * 0.35, 0]], 0.012, skin, skinK, [-0.02, 0.05, hr * 0.85 * z], [0.9 * z, 0.3 * z, 0]));
    else if (!L.snout) for (const z of [-1, 1]) head.add(sph(0.03, skin, skinK, [-0.01, 0, hr * 0.9 * z], [0.6, 1, 0.5], 10));
    if (L.tusks) for (const z of [-0.05, 0.05]) head.add(tube([[hr * 0.75, -0.09, z], [hr * 0.9, -0.05, z * 1.3], [hr * 0.95, 0.0, z * 1.1]], 0.016, 0.004, '#f0ead8', 'horn'));
    if (L.fangs) for (const z of [-0.025, 0.025]) head.add(spike(0.008, 0.04, '#ffffff', 'horn', [hr * 0.93, -0.095, z], [Math.PI, 0, 0]));
    if (L.beard) { const fork = L.beard === 'goatee'; head.add(sph(fork ? 0.05 : 0.095, L.beardCol || L.beard, 'hair', [0.08, fork ? -0.14 : -0.1, 0], fork ? [0.7, 1.9, 0.6] : [0.9, 1.25, 1.15])); if (fork) head.add(spike(0.03, 0.1, L.beardCol || '#1a1010', 'hair', [0.09, -0.24, 0], [Math.PI, 0, -0.3])); }
    if (L.mustache) for (const z of [-1, 1]) head.add(tube([[hr * 0.9, -0.06, 0], [hr * 0.95, -0.07, 0.04 * z], [hr * 0.85, -0.12, 0.07 * z]], 0.014, 0.004, L.mustache, 'hair'));
  }
  const hm = L.helm, hc = L.helmCol || L.metal || '#b8c0cc';
  const hairTop = !hm || hm === 'crown' || hm === 'cap' || hm === 'circlet';
  if ((L.hair || L.longHair) && hairTop && !bony && L.snout !== 'bull') head.add(sph(hr * 1.05, L.hair || L.longHair, 'hair', [-0.03, 0.035, 0], [1, 0.9, 1.02]));
  if (L.longHair && !bony) head.add(cap(0.1, 0.3, L.longHair, 'hair', [-0.1, -0.12, 0], [0, 0, -0.2], [0.7, 1, 1.3]));
  if (L.topknot) head.add(tube([[-0.02, hr * 0.95, 0], [-0.08, hr + 0.1, 0], [-0.22, hr + 0.02, 0], [-0.3, hr - 0.15, 0]], 0.04, 0.02, L.topknot, 'hair'));
  if (L.mohawk) for (let i = 0; i < 5; i++) head.add(spike(0.02, 0.1 - Math.abs(i - 2) * 0.01, L.mohawk, 'hair', [0.08 - i * 0.05, hr * 0.95, 0], [0, 0, 0.3 + i * 0.25]));
  if (L.flameHair) for (let i = 0; i < 7; i++) head.add(cone(0.04 + (i % 2) * 0.02, 0.2 + (i % 3) * 0.08 + Math.sin(t * 7 + i) * 0.03, i % 2 ? L.flameHair : LT(L.flameHair, 0.4), 'fire', [0.06 - i * 0.035, hr * 0.85, Math.sin(i * 2.1) * 0.06], [Math.sin(i) * 0.3, 0, 0.35 + i * 0.12], 6)); // płonące włosy
  if (L.snakes) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 1.6 - 0.3, w = Math.sin(t * 3 + i) * 0.03, bx = -Math.sin(a) * 0.06 - 0.02, bz = Math.cos(a) * 0.1; // wężowe włosy meduzy
    head.add(tube([[bx, hr * 0.7, bz], [bx - 0.05, hr + 0.06 + w, bz * 1.4], [bx - 0.12, hr + 0.02 - w, bz * 1.6], [bx - 0.16, hr - 0.06, bz * 1.8]], 0.02, 0.012, L.snakes, 'scale')); head.add(sph(0.018, DK(L.snakes, 0.2), 'scale', [bx - 0.16, hr - 0.06, bz * 1.8], [1.4, 0.8, 1])); }
  if (L.horns) { const ht = L.hornType || 'swept'; for (const z of [-1, 1]) {
    const pts = ht === 'ram' ? [[-0.02, hr * 0.75, 0.08 * z], [-0.1, hr + 0.06, 0.13 * z], [-0.2, hr - 0.02, 0.15 * z], [-0.17, hr - 0.14, 0.15 * z], [-0.07, hr - 0.14, 0.16 * z], [-0.04, hr - 0.05, 0.16 * z]]
      : ht === 'bull' ? [[-0.02, hr * 0.65, 0.1 * z], [0.0, hr * 0.8, 0.22 * z], [0.08, hr + 0.06, 0.3 * z], [0.18, hr + 0.16, 0.27 * z]]
      : ht === 'long' ? [[-0.02, hr * 0.75, 0.07 * z], [-0.08, hr + 0.14, 0.1 * z], [-0.22, hr + 0.3, 0.1 * z], [-0.4, hr + 0.36, 0.08 * z]]
      : ht === 'small' ? [[0.02, hr * 0.8, 0.06 * z], [0.0, hr + 0.06, 0.08 * z], [-0.05, hr + 0.1, 0.08 * z]]
      : [[-0.02, hr * 0.7, 0.07 * z], [-0.05, hr + 0.07, 0.12 * z], [-0.14, hr + 0.14, 0.13 * z], [-0.2, hr + 0.1, 0.1 * z]];
    head.add(tube(pts, ht === 'small' ? 0.022 : ht === 'bull' ? 0.045 : 0.038, 0.004, L.horns, 'horn', 2)); } }
  if (hm === 'helm' || hm === 'horn') { // hełm z nosalem, policzkami i grzebieniem
    head.add(mesh(new THREE.SphereGeometry(hr * 1.12, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hc, 'steel', [0, 0.015, 0]));
    head.add(torus(hr * 1.1, 0.02, DK(hc, 0.2), 'metal', [0, 0.005, 0], [Math.PI / 2, 0, 0]));
    head.add(slab([[-0.14, 0], [0.12, 0], [0.1, 0.03], [-0.12, 0.05]], 0.012, LT(hc, 0.1), 'steel', [0, hr * 1.04, 0])); // grzebień
    head.add(box(0.025, 0.12, 0.035, hc, 'steel', [hr * 1.1, -0.04, 0])); for (const z of [-1, 1]) head.add(slab([[0, 0], [0.1, 0], [0.07, -0.13], [-0.02, -0.12]], 0.018, hc, 'steel', [-0.02, 0.0, hr * 1.02 * z]));
    if (hm === 'horn') for (const z of [-1, 1]) head.add(tube([[0, hr * 0.8, 0.1 * z], [0.02, hr + 0.1, 0.2 * z], [0.08, hr + 0.22, 0.22 * z], [0.16, hr + 0.28, 0.18 * z]], 0.045, 0.006, '#e8e0cc', 'horn', 2));
  } else if (hm === 'greathelm') { // garnczkowy: wizjer, otwory oddechowe, krzyż
    head.add(cyl(hr * 1.12, hr * 1.08, 0.3, hc, 'steel', [0, -0.03, 0], null, null, 14)); head.add(sph(hr * 1.1, hc, 'steel', [0, 0.1, 0], [1, 0.5, 1]));
    const slit = L.eyes && bright(L.eyes); head.add(box(0.02, 0.016, 0.22, slit ? L.eyes : '#08080c', slit ? 'glow' : 'metal', [hr * 1.12, 0.02, 0])); head.add(box(0.02, 0.2, 0.024, L.cross || DK(hc, 0.3), L.cross ? 'gold' : 'steel', [hr * 1.13, -0.02, 0])); // wizjer (u upiornych rycerzy świeci)
    for (let i = 0; i < 4; i++) head.add(sph(0.012, '#08080c', 'metal', [hr * 1.12, -0.05 - i * 0.025, 0.045]));
  } else if (hm === 'kettle') { // kapalin: szerokie rondo
    head.add(mesh(new THREE.SphereGeometry(hr * 1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hc, 'steel', [0, 0.02, 0])); head.add(cyl(hr * 1.75, hr * 1.6, 0.025, hc, 'steel', [0, 0.02, 0], [0, 0, 0.06], null, 20)); head.add(torus(hr * 1.7, 0.01, DK(hc, 0.3), 'metal', [0, 0.02, 0], [Math.PI / 2, 0, 0.06]));
  } else if (hm === 'sallet') { // salada: długi ogon z tyłu, wizjer
    head.add(mesh(new THREE.SphereGeometry(hr * 1.14, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hc, 'steel', [0, 0.01, 0])); head.add(slab([[0.02, -0.14], [-0.28, -0.17], [-0.31, 0], [-0.28, 0.17], [0.02, 0.14]], 0.014, hc, 'steel', [-0.04, -0.01, 0], [Math.PI / 2, 0, 0])); // ogon salady head.add(box(0.02, 0.014, 0.2, '#08080c', 'metal', [hr * 1.1, 0.015, 0]));
    head.add(rbox(0.06, 0.08, 0.22, 0.02, hc, 'steel', [hr * 0.95, -0.08, 0])); // podbródek
  } else if (hm === 'hood') {
    const c = L.hoodCol || L.cloth; head.add(mesh(new THREE.SphereGeometry(hr * 1.16, 24, 16, Math.PI * 1.32, Math.PI * 1.36), c, 'cloth', [-0.015, 0.012, 0])); head.add(spike(0.06, 0.16, c, 'cloth', [-0.12, hr * 0.7, 0], [0, 0, 1.1])); // szpic kaptura
    head.parent.add(cyl(0.2, 0.12, 0.16, c, 'cloth', [-0.01, 0.0, 0], null, [1, 1, 1.2]));
    head.add(sph(hr * 0.9, '#08060a', 'cloth', [hr * 0.25, -0.01, 0], [0.5, 0.9, 0.9])); // cień pod kapturem
    if (L.eyes && bright(L.eyes)) for (const z of [-0.05, 0.05]) head.add(sph(0.018, L.eyes, 'glow', [hr * 0.9, 0.02, z]));
  } else if (hm === 'cap') {
    head.add(mesh(new THREE.SphereGeometry(hr * 1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), hc, 'leather', [-0.01, 0.02, 0]));
    head.add(cyl(hr * 1.18, hr * 1.18, 0.02, DK(hc, 0.15), 'leather', [0.02, 0.02, 0], [0, 0, 0.1]));
    if (L.feather) head.add(tube([[-0.06, hr * 0.9, 0.08], [-0.16, hr + 0.12, 0.1], [-0.26, hr + 0.2, 0.08]], 0.03, 0.006, L.feather, 'feather'));
  } else if (hm === 'straw') { // słomkowy kapelusz chłopa
    head.add(cone(hr * 1.2, 0.12, hc, 'wood', [0, hr * 0.85, 0], null, 18)); head.add(cyl(hr * 1.9, hr * 1.9, 0.015, hc, 'wood', [0, hr * 0.62, 0], [0, 0, 0.05], null, 22));
  } else if (hm === 'crown' || hm === 'circlet') {
    const g = L.crownCol || '#e8c040', hi = hm === 'crown' ? 1 : 0.4;
    head.add(cyl(hr * 0.9, hr * 0.92, 0.06 * hi + 0.02, g, 'gold', [0, hr * 0.72, 0]));
    if (hm === 'crown') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; head.add(spike(0.022, 0.1, g, 'gold', [Math.cos(a) * hr * 0.9, hr * 0.84, Math.sin(a) * hr * 0.9])); }
    head.add(sph(0.02, L.gem || '#c82030', 'gem', [hr * 0.92, hr * 0.72, 0]));
  } else if (hm === 'skull') {
    head.add(sph(hr * 1.14, '#e8e2cc', 'bone', [0, 0.04, 0], [1.05, 0.95, 1])); for (const z of [-0.05, 0.05]) head.add(sph(0.03, '#141014', 'skin', [hr * 1.02, 0.06, z]));
    for (const z of [-1, 1]) head.add(tube([[-0.02, hr * 0.8, 0.09 * z], [-0.1, hr + 0.1, 0.14 * z], [-0.22, hr + 0.12, 0.12 * z]], 0.03, 0.006, '#d8d0b8', 'horn'));
  } else if (hm === 'turban') {
    const c = L.hoodCol || '#e8e0d0'; for (let i = 0; i < 3; i++) head.add(torus(hr * (0.95 - i * 0.12), 0.05, i % 2 ? DK(c, 0.12) : c, 'cloth', [-0.01, hr * (0.55 + i * 0.22), 0], [Math.PI / 2 + 0.1, 0, 0])); head.add(sph(0.025, L.gem || '#30a0e0', 'gem', [hr * 1.02, hr * 0.62, 0])); head.add(tube([[0, hr * 1.2, 0], [-0.04, hr * 1.4, 0], [-0.12, hr * 1.45, 0]], 0.02, 0.008, L.feather || '#f0e8d0', 'feather'));
  } else if (hm === 'mitre') { // mitra kapłana
    head.add(slab([[-0.11, 0], [0.11, 0], [0.09, 0.2], [0, 0.3], [-0.09, 0.2]], 0.2, hc, 'cloth', [0, hr * 0.62, 0], [0, Math.PI / 2, 0])); head.add(box(0.03, 0.28, 0.21, L.trim || '#e0b24a', 'gold', [0.005, hr * 0.62 + 0.13, 0]));
  } else if (hm === 'wizard') { // spiczasty kapelusz maga
    head.add(cyl(hr * 1.7, hr * 1.7, 0.02, hc, 'cloth', [0, hr * 0.7, 0], null, null, 20)); head.add(tube([[0, hr * 0.7, 0], [-0.02, hr + 0.18, 0], [-0.08, hr + 0.36, 0], [-0.2, hr + 0.42, 0]], hr * 0.95, 0.01, hc, 'cloth'));
    for (let i = 0; i < 3; i++) head.add(slab([[0, 0.02], [0.006, 0.006], [0.02, 0], [0.006, -0.006], [0, -0.02], [-0.006, -0.006], [-0.02, 0], [-0.006, 0.006]], 0.005, '#f0e090', 'glow', [hr * 0.5 - i * 0.06, hr + 0.05 + i * 0.1, hr * 0.5], null, null, 0.1)); // gwiazdki
  }
  if (L.plume) head.add(tube([[-0.02, hr * 1.12, 0], [-0.12, hr + 0.18, 0], [-0.28, hr + 0.14, 0], [-0.36, hr + 0.0, 0]], 0.05, 0.02, L.plume, 'fur'));
}

// Broń w bliższej (albo drugiej) ręce; hold(kąt w świecie) ustawia dłoń i zwraca ją. Kąt 0 = ostrze w górę, ujemny = do przodu.
function weapon(hold, L, W, A, wind, hit, metal, near = true) {
  const glow = L.glow, blade = glow ? L.glow : metal, bK = glow ? 'glow' : 'steel', wood = L.shaft || '#6a4424';
  const pole = (h, len, r = 0.02) => { h.add(cyl(r, r, len, wood, 'wood', [0, len / 2 - 0.7, 0])); for (const y of [-0.3, len - 0.95]) h.add(torus(r * 1.1, 0.008, DK(metal, 0.3), 'metal', [0, y, 0], [Math.PI / 2, 0, 0])); };
  const swingA = base => base + (A != null ? wind * 1.3 - hit * 1.6 : 0) + (near ? 0 : 0.3);
  if (W === 'spear' || W === 'halberd' || W === 'lance' || W === 'trident' || W === 'pitchfork' || W === 'glaive') {
    const lance = W === 'lance', h = hold(lance ? -1.35 + (A != null ? -0.1 * hit : 0) : -0.3 - hit * 1.25 + wind * 0.2), len = lance ? 2.6 : 2.2, top = len - 0.7;
    if (lance) { h.add(lathe([[0.001, top + 0.3], [0.03, top - 0.4], [0.045, -0.2], [0.1, -0.1], [0.06, -0.3]], L.lanceCol || '#c8a050', 'wood', [0, 0, 0])); h.add(cone(0.12, 0.25, metal, 'steel', [0, -0.12, 0], [Math.PI, 0, 0], 12)); if (L.pennon) h.add(sheet([[0, 0], [-0.35, -0.07], [0, -0.16]], L.pennon, 'cloth', [0, top - 0.2, 0], [0, 0, 0])); return; }
    pole(h, len);
    if (W === 'spear') { h.add(slab([[0, 0.3], [0.045, 0.1], [0.03, 0], [-0.03, 0], [-0.045, 0.1]], 0.02, blade, bK, [0, top, 0])); h.add(slab([[0, 0.3], [0.045, 0.1], [0.03, 0], [-0.03, 0], [-0.045, 0.1]], 0.02, blade, bK, [0, top, 0], [0, Math.PI / 2, 0])); }
    else if (W === 'halberd') { // topór, kolec i hak
      h.add(slab([[0, 0], [0.24, -0.06], [0.28, 0.1], [0.24, 0.26], [0, 0.2]], 0.018, blade, bK, [0.01, top - 0.28, 0])); h.add(slab([[0, 0.05], [-0.14, 0.12], [-0.02, 0.15]], 0.02, blade, bK, [-0.01, top - 0.2, 0]));
      h.add(slab([[0, 0.34], [0.04, 0.06], [0, 0], [-0.04, 0.06]], 0.02, blade, bK, [0, top, 0]));
    } else if (W === 'glaive') h.add(slab([[0, 0], [0.07, 0.05], [0.09, 0.3], [0.02, 0.55], [-0.03, 0.2], [-0.03, 0]], 0.02, blade, bK, [0, top - 0.05, 0]));
    else { const n = 3, pc = W === 'pitchfork' ? wood : blade, pk = W === 'pitchfork' ? 'wood' : bK; h.add(box(0.2, 0.03, 0.03, pc, pk, [0, top, 0])); for (let i = 0; i < n; i++) { const x = (i - 1) * 0.09; h.add(cyl(0.012, 0.012, 0.22, pc, pk, [x, top + 0.12, 0], null, null, 6)); if (W === 'trident') h.add(slab([[0, 0.1], [0.03, 0], [-0.03, 0]], 0.012, blade, bK, [x, top + 0.23, 0])); } }
  } else if (W === 'sword' || W === 'greatsword' || W === 'scimitar' || W === 'dagger') {
    const gs = W === 'greatsword', dg = W === 'dagger', bl = gs ? 1.15 : dg ? 0.32 : 0.8, h = hold(swingA(-0.55));
    const pts = W === 'scimitar' ? [[-0.035, 0], [0.035, 0], [0.07, 0.4], [0.05, 0.7], [-0.04, bl + 0.05], [0.0, 0.6], [-0.03, 0.3]] : [[-0.035, 0], [0.035, 0], [0.03, bl * 0.8], [0, bl], [-0.03, bl * 0.8]];
    h.add(slab(pts.map(([x, y]) => [x * (gs ? 1.3 : 1), y]), 0.016, blade, bK, [0, 0.12, 0], null, null, 0.5)); // ostrze z fazą: odblask na krawędzi
    if (!dg) h.add(box(0.012, bl * 0.7, 0.012, DK(blade, 0.35), bK, [0, 0.12 + bl * 0.4, 0])); // zbrocze
    h.add(slab([[-0.14, 0.02], [-0.02, -0.01], [0.02, -0.01], [0.14, 0.02], [0.02, 0.025], [-0.02, 0.025]].map(([x, y]) => [x * (dg ? 0.5 : gs ? 1.3 : 1), y]), 0.035, L.hilt || '#c8a050', 'gold', [0, 0.1, 0])); // jelec
    h.add(cyl(0.022, 0.022, gs ? 0.28 : 0.15, '#3a2010', 'leather', [0, gs ? -0.04 : 0.02, 0])); h.add(sph(0.032, L.hilt || '#c8a050', 'gold', [0, gs ? -0.2 : -0.07, 0]));
  } else if (W === 'axe' || W === 'labrys') {
    const h = hold(-0.35 + (A != null ? wind * 1.4 - hit * 1.7 : 0) + (near ? 0 : 0.3)), big = W === 'labrys';
    h.add(cyl(0.024, 0.028, big ? 1.2 : 0.95, wood, 'wood', [0, big ? 0.42 : 0.32, 0])); h.add(torus(0.03, 0.01, DK(metal, 0.3), 'metal', [0, big ? 0.9 : 0.7, 0], [Math.PI / 2, 0, 0]));
    const head = [[0, -0.06], [0.1, -0.1], [0.24, -0.2], [0.27, 0.0], [0.24, 0.2], [0.1, 0.1], [0, 0.06]].map(([x, y]) => [x * (big ? 1.25 : 1), y * (big ? 1.25 : 1)]);
    const y0 = big ? 0.9 : 0.68; h.add(slab(head, 0.024, blade, bK, [0.01, y0, 0], null, null, 0.6));
    if (big) h.add(slab(head, 0.024, blade, bK, [-0.01, y0, 0], [0, Math.PI, 0], null, 0.6)); else h.add(spike(0.035, 0.12, blade, bK, [-0.07, y0, 0], [0, 0, Math.PI / 2]));
    h.add(spike(0.02, 0.1, blade, bK, [0, y0 + 0.12, 0]));
  } else if (W === 'club' || W === 'mace') {
    const h = hold(-0.4 + (A != null ? wind * 1.4 - hit * 1.8 : 0));
    if (W === 'mace') { h.add(cyl(0.02, 0.02, 0.7, '#3a2a1a', 'leather', [0, 0.25, 0])); h.add(sph(0.08, metal, 'iron', [0, 0.62, 0])); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; h.add(spike(0.025, 0.1, metal, 'steel', [Math.cos(a) * 0.08, 0.62 + (i % 2 ? 0.03 : -0.03), Math.sin(a) * 0.08], [Math.sin(a) * 1.57, 0, -Math.cos(a) * 1.57])); } return; }
    h.add(lathe([[0.03, -0.05], [0.035, 0.2], [0.07, 0.55], [0.1, 0.75], [0.07, 0.86], [0.001, 0.88]], '#5a3a1e', 'bark', [0, 0, 0]));
    for (let i = 0; i < 9; i++) h.add(spike(0.022, 0.09, '#8a8478', 'iron', [Math.cos(i * 1.3) * 0.09, 0.55 + i * 0.035, Math.sin(i * 1.3) * 0.09], [Math.sin(i * 1.3) * 1.3, 0, -Math.cos(i * 1.3) * 1.3]));
  } else if (W === 'bow') {
    const pull = A == null ? 0 : A < 0.6 ? A / 0.6 : 0, h = hold(-Math.PI / 2);
    // łuk refleksyjny w pionie (w dłoni oś x to góra-dół świata), cięciwa naciągana do tyłu (−y)
    h.add(tube([[-0.64, -0.1, 0], [-0.52, -0.2, 0], [-0.26, -0.06, 0], [0, 0, 0], [0.26, -0.06, 0], [0.52, -0.2, 0], [0.64, -0.1, 0]], 0.022, 0.022, L.bowCol || '#5a3218', 'wood'));
    const top = [-0.64, -0.1], bot = [0.64, -0.1], mid = [0, -0.16 - pull * 0.42];
    for (const e of [top, bot]) { const dx = mid[0] - e[0], dy = mid[1] - e[1], l = Math.hypot(dx, dy); h.add(cyl(0.004, 0.004, l, '#e8e0cc', 'cloth', [(e[0] + mid[0]) / 2, (e[1] + mid[1]) / 2, 0], [0, 0, Math.atan2(-dx, dy)], null, 4)); }
    h.add(cyl(0.03, 0.03, 0.12, '#3a2010', 'leather', [0, 0, 0], [0, 0, Math.PI / 2]));
  } else if (W === 'crossbow') { // kusza trzymana poziomo przed sobą
    const h = hold(-Math.PI / 2 + 0.05); h.add(rbox(0.07, 0.85, 0.08, 0.02, '#6a4424', 'wood', [0, 0.12, 0])); h.add(rbox(0.12, 0.2, 0.07, 0.02, '#5a3a1e', 'wood', [0.06, -0.25, 0])); // łoże i kolba
    h.add(tube([[0.1, 0.5, -0.36], [-0.02, 0.56, -0.1], [-0.02, 0.56, 0.1], [0.1, 0.5, 0.36]], 0.024, 0.014, metal, 'steel')); h.add(slab([[-0.04, 0], [0.04, 0], [0.03, 0.1], [-0.03, 0.1]], 0.02, metal, 'steel', [0, 0.5, 0])); // łuk kuszy
    h.add(cyl(0.004, 0.004, 0.7, '#e8e0cc', 'cloth', [0.08, 0.46, 0], [Math.PI / 2, 0, 0], null, 4)); h.add(box(0.02, 0.1, 0.02, metal, 'steel', [0.05, -0.08, 0])); if (A == null || A < 0.5) { h.add(cyl(0.01, 0.01, 0.4, '#8a6a4a', 'wood', [0.05, 0.3, 0], null, null, 4)); h.add(spike(0.02, 0.06, metal, 'steel', [0.05, 0.52, 0])); }
  } else if (W === 'staff') {
    const h = hold(-0.12 - (A != null ? Math.sin(A * Math.PI) * 0.3 : 0)), top = L.staffTop || 'orb';
    h.add(tube([[0, -0.55, 0], [0.02, 0.2, 0], [-0.02, 0.8, 0], [0, 1.1, 0]], 0.024, 0.02, '#5a3a1e', 'wood'));
    if (top === 'skull') { h.add(sph(0.07, '#e8e2cc', 'bone', [0, 1.2, 0], [1, 1.1, 0.9])); for (const z of [-0.025, 0.025]) h.add(sph(0.016, L.orb || '#a0f0a0', 'glow', [0.06, 1.21, z])); }
    else if (top === 'cross') { h.add(box(0.035, 0.28, 0.035, '#e0c050', 'gold', [0, 1.25, 0])); h.add(box(0.035, 0.035, 0.18, '#e0c050', 'gold', [0, 1.3, 0])); h.add(sph(0.03, L.orb || '#fff0a0', 'glow', [0, 1.3, 0])); }
    else if (top === 'crook') { h.add(torus(0.08, 0.02, '#e0c050', 'gold', [0.08, 1.18, 0], null, null, Math.PI * 1.3)); }
    else { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; h.add(tube([[0, 1.08, 0], [Math.cos(a) * 0.07, 1.18, Math.sin(a) * 0.07], [Math.cos(a) * 0.03, 1.3, Math.sin(a) * 0.03]], 0.012, 0.006, '#5a3a1e', 'wood')); } // korona z korzeni
      h.add(sph(0.075, L.orb || '#80c0ff', A != null ? 'glow' : 'gem', [0, 1.2, 0])); }
  } else if (W === 'fireball') { const h = hold(0), c = L.orb || '#ff8a2a', s = 0.8 + (A != null ? Math.sin(A * Math.PI) * 0.6 : 0); // kula ognia w dłoni
    h.add(sph(0.07 * s, LT(c, 0.6), 'glow', [0.02, 0.1, 0])); for (let i = 0; i < 6; i++) h.add(cone(0.04 * s, 0.14 * s, i % 2 ? c : LT(c, 0.3), 'fire', [0.02 + Math.cos(i) * 0.03, 0.14, Math.sin(i) * 0.03], [Math.sin(i * 2) * 0.4, 0, Math.cos(i * 2) * 0.4], 5));
  }
}
function shield(h, L, metal) {
  const c = L.shield, m = L.shieldMark, shape = L.shieldShape || 'round';
  if (shape === 'heater') { // trójkątna tarcza rycerska z herbem
    const pts = [[-0.25, 0.3], [0.25, 0.3], [0.25, 0.0], [0, -0.35], [-0.25, 0.0]];
    h.add(slab(pts, 0.04, DK(c, 0.2), 'wood', [0, 0.02, 0.13], [0, 0, -Math.PI / 2])); h.add(slab(pts.map(([x, y]) => [x * 1.06, y * 1.06 - 0.01]), 0.03, metal, 'steel', [0, 0.02, 0.125], [0, 0, -Math.PI / 2])); // okucie
    h.add(decal(0.46, 0.6, (g, w, hh) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, hh * 0.46); g.lineTo(w / 2, hh); g.lineTo(0, hh * 0.46); g.fill(); if (m) { g.fillStyle = m; g.fillRect(w / 2 - 5, 8, 10, hh * 0.62); g.fillRect(10, hh * 0.28, w - 20, 9); } }, [0, 0.02, 0.157], [0, 0, -Math.PI / 2]));
    return;
  }
  h.add(mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.045, 28), DK(c, 0.3), 'wood', [0, 0.02, 0.13], [Math.PI / 2, 0, 0]));
  h.add(decal(0.57, 0.57, (g, w, hh) => { g.fillStyle = c; g.beginPath(); g.arc(w / 2, hh / 2, w / 2, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.22)'; for (let x = 0; x < w; x += 11) g.fillRect(x, 0, 1, hh);
    for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`; g.fillRect(Math.random() * w, Math.random() * hh, 2, 1); }
    if (m) { g.fillStyle = m; g.fillRect(w / 2 - 4, 8, 8, hh - 16); g.fillRect(12, hh / 2 - 12, w - 24, 8); } }, [0, 0.02, 0.154]));
  h.add(torus(0.29, 0.024, metal, 'steel', [0, 0.02, 0.155])); h.add(sph(0.075, metal, 'steel', [0, 0.02, 0.17], [1, 1, 0.6])); h.add(spike(0.03, 0.08, metal, 'steel', [0, 0.02, 0.22], [Math.PI / 2, 0, 0])); // umbo z kolcem
  for (let i = 0; i < 8; i++) h.add(sph(0.014, '#d8d0c0', 'metal', [Math.cos(i * 0.785) * 0.25, 0.02 + Math.sin(i * 0.785) * 0.25, 0.16], null, 8));
}
// Skrzydła na plecach: pierzaste (anioły, harpie), błoniaste (demony, gargulce, smoki), owadzie (driady, nimfy) albo peleryna
// rozpięta jak skrzydła. Skrzydło leży w płaszczyźnie xy (w górę i do tyłu), machnięcie obraca je wokół osi tułowia.
// flying: szeroki mach w locie; span: rozpiętość
function wings(spine, col, type, t, ph, A, span = 1, flying = false) {
  const beat = flying ? Math.sin(ph) : 0, flap = flying ? 0.55 + beat * 0.85 : (ph != null ? Math.sin(ph * 2) * 0.25 : Math.sin(t * 2) * 0.08) + (A != null ? Math.sin(A * Math.PI) * 0.45 : 0);
  for (const z of [-1, 1]) {
    const root = joint(spine, [-0.12, 0.52, 0.1 * z]); root.rotation.set((0.35 + flap) * z, -0.35 * z, flying ? -0.2 : 0.15); root.scale.setScalar(span);
    if (type === 'feather') featherFan(root, col, flying ? 1.05 : 0.9, false);
    else if (type === 'fairy') for (const [a, l, w] of [[0.5, 0.75, 0.2], [-0.25, 0.55, 0.16]]) { const g = joint(root, [0, 0, 0], a); g.add(slab([[0, 0], [-w, l * 0.3], [-w * 0.8, l * 0.8], [0, l], [w * 0.6, l * 0.7], [w * 0.4, l * 0.25]], 0.006, col, 'gem', [0, 0, 0], null, null, 0.2)); g.add(tube([[0, 0, 0.005], [-0.02, l * 0.5, 0.005], [0, l * 0.95, 0.005]], 0.008, 0.004, DK(col, 0.4), 'gem')); }
    else membraneWing(root, col, type === 'cape' ? col : DK(col, 0.4), type === 'cape' ? 1.1 : 1, type !== 'cape');
  }
}
// Błoniaste skrzydło: ramię, przedramię, palce wachlarzem, błona z wcięciami między palcami, pazur na zgięciu
function membraneWing(w, col, boneCol, s = 1, claw = true, sc = 1) {
  const E = [-0.12 * s, 0.38 * s], Wr = [0.06 * s, 0.78 * s], tips = [[-0.22, 1.12], [-0.62, 1.05], [-0.98, 0.72], [-1.12, 0.3]].map(([x, y]) => [x * s, y * s]), at = [-0.6 * s, -0.08 * s];
  const edge = [[0, 0], E, Wr]; for (let i = 0; i < tips.length; i++) { edge.push(tips[i]); const nx = i + 1 < tips.length ? tips[i + 1] : at; edge.push([(tips[i][0] + nx[0]) / 2 * 0.78 + Wr[0] * 0.22, (tips[i][1] + nx[1]) / 2 * 0.78 + Wr[1] * 0.22]); }
  edge.push(at); w.add(sheet(edge, col, 'skin', [0, 0, 0]));
  const b = (pts, r) => w.add(tube(pts.map(p => p.concat(0.004)), r * sc, r * 0.4 * sc, boneCol, 'horn'));
  b([[0, 0], E, Wr], 0.035 * s); for (const tp of tips) b([Wr, [(Wr[0] + tp[0]) / 2, (Wr[1] + tp[1]) / 2 + 0.03 * s], tp], 0.022 * s);
  if (claw) w.add(spike(0.022 * s, 0.13 * s, '#e8e0cc', 'horn', [Wr[0] + 0.03 * s, Wr[1] + 0.06 * s, 0], [0, 0, -0.5]));
}
// Pierzaste skrzydło: ramię z lotkami (długie pióra wachlarzem), drugorzędowe i pokrywy
function featherFan(w, col, s = 1, flame = false) {
  const K = flame ? 'fire' : 'feather', arm = [[0, 0, 0], [-0.1 * s, 0.4 * s, 0], [0.05 * s, 0.8 * s, 0], [-0.2 * s, 1.1 * s, 0]];
  w.add(tube(arm, 0.06 * s, 0.03 * s, col, K));
  const feather = (x, y, len, a, c) => w.add(slab([[0, 0], [0.05 * s, len * 0.25], [0.03 * s, len * 0.85], [0, len], [-0.035 * s, len * 0.6], [-0.03 * s, len * 0.2]], 0.01, c, K, [x, y, 0], [0, 0, a], null, 0.2));
  for (let i = 0; i < 10; i++) { const f = i / 9, p = f < 0.5 ? [arm[2][0] + (arm[3][0] - arm[2][0]) * f * 2, arm[2][1] + (arm[3][1] - arm[2][1]) * f * 2] : [arm[2][0] - (f - 0.5) * 0.5 * s, arm[2][1] - (f - 0.5) * 0.9 * s];
    feather(p[0], p[1], (0.75 - f * 0.25) * s, 1.5 + f * 1.3, i % 2 ? col : LT(col, 0.12)); } // lotki
  for (let i = 0; i < 7; i++) { const f = i / 6; feather(arm[1][0] + f * 0.12 * s, arm[1][1] - 0.35 * s + f * 0.3 * s, 0.45 * s, 2.5 + f * 0.3, i % 2 ? DK(col, 0.08) : col); } // drugorzędowe
  for (let i = 0; i < 6; i++) { const f = i / 5; w.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), LT(col, 0.15), K, [-0.05 * s - f * 0.2 * s, (0.35 + f * 0.35) * s, 0.012], [0, 0, 0.5], [1.4 * s, 0.6 * s, 0.14])); } // pokrywy
}
// Golem: bryły zamiast ciała (kamień: nieregularne głazy, żelazo i złoto: płyty z nitami, diament: kryształy), świecące
// szczeliny oczu i runy na piersi; ciężki chód i cios obiema pięściami z góry
function golem(L, P = {}) {
  const root = new THREE.Group(), t = P.t || 0, walking = P.walk != null, ph = (P.walk || 0) * Math.PI * 2, sw = walking ? Math.sin(ph) : 0, A = P.atk, hurt = P.hurt ? 1 : 0;
  const G = L.golem, col = G === 'iron' ? L.metal || '#8a929e' : G === 'gold' ? L.metal || '#e0c050' : G === 'diamond' ? L.skin || '#b8e0f0' : L.skin || '#9a9282';
  const K = G === 'iron' ? 'iron' : G === 'gold' ? 'gold' : G === 'diamond' ? 'gem' : 'stone', glow = L.eyes || '#80d0ff', dk = DK(col, 0.25);
  const wind = A == null ? 0 : A < 0.45 ? A / 0.45 : A < 0.7 ? 1 - (A - 0.45) / 0.25 : 0, hit = A == null ? 0 : A < 0.45 ? 0 : A < 0.7 ? (A - 0.45) / 0.25 : 1 - (A - 0.7) / 0.3;
  let n = 1; const part = (w, h, d, pos, rot, c = col) => G === 'iron' || G === 'gold' ? rbox(w, h, d, 0.03, c, K, pos, rot) : chunk(w / 2, h / 2, d / 2, c, K, pos, rot, n++ + (G === 'diamond' ? 50 : 0), G === 'diamond' ? 9 : 16);
  const rivets = (g, x, y, z, k) => { if (G === 'iron' || G === 'gold') for (let i = 0; i < k; i++) g.add(sph(0.018, LT(col, 0.2), K, [x, y - i * 0.07, z], null, 8)); };
  const hips = joint(root, [0, 0.72 + (walking ? Math.abs(sw) * 0.03 : Math.sin(t * 2) * 0.008), 0], -hurt * 0.2);
  hips.add(part(0.36, 0.2, 0.44, [0, 0.02, 0]));
  for (const side of [-1, 1]) {
    const th = joint(hips, [0, -0.06, 0.15 * side], walking ? sw * side * 0.4 : 0); th.add(part(0.22, 0.34, 0.2, [0, -0.17, 0]));
    const kn = joint(th, [0, -0.34, 0], walking ? -Math.max(0, Math.cos(ph) * side) * 0.6 : 0); kn.add(part(0.2, 0.3, 0.19, [0.01, -0.14, 0])); kn.add(part(0.32, 0.1, 0.24, [0.06, -0.3, 0], null, dk)); rivets(kn, 0.1, -0.05, 0.1 * side, 2);
  }
  const spine = joint(hips, [0, 0.08, 0], 0.15 + hit * 0.35 - wind * 0.15);
  spine.add(part(0.46, 0.5, 0.62, [0.02, 0.28, 0])); spine.add(part(0.3, 0.2, 0.7, [0, 0.55, 0])); // pierś i barki
  for (let i = 0; i < 3; i++) spine.add(box(0.01, 0.2 - i * 0.05, 0.015, glow, 'glow', [0.25, 0.3 + i * 0.03, -0.08 + i * 0.08], [0.4 * (i - 1), 0, 0.3 * (i - 1)])); // runy
  rivets(spine, 0.24, 0.48, 0.22, 4); rivets(spine, 0.24, 0.48, -0.22, 4);
  if (G === 'diamond') for (let i = 0; i < 5; i++) spine.add(mesh(new THREE.OctahedronGeometry(0.1), LT(col, 0.3), 'gem', [-0.1 + (i % 2) * 0.1, 0.55 + (i % 3) * 0.05, -0.2 + i * 0.1], [i, i * 2, 0], [0.6, 1.8, 0.6])); // kryształy na barkach
  const head = joint(spine, [0.12, 0.62, 0], -0.2); head.add(part(0.2, 0.18, 0.2, [0.02, 0.06, 0]));
  head.add(box(0.03, 0.022, 0.13, '#0a0a0c', 'stone', [0.12, 0.08, 0])); for (const z of [-0.04, 0.04]) head.add(sph(0.02, glow, 'glow', [0.125, 0.08, z], [0.5, 0.7, 1.4]));
  for (const side of [1, -1]) {
    const sh = joint(spine, [0.02, 0.5, 0.36 * side], 0.25 + wind * 2.6 - hit * 1.7 + (walking ? -sw * 0.3 * side : 0) + hurt * 0.5);
    sh.add(part(0.3, 0.26, 0.3, [0, 0, 0.03 * side])); sh.add(part(0.2, 0.36, 0.2, [0, -0.24, 0]));
    const el = joint(sh, [0, -0.42, 0], 0.35 - hit * 0.3); el.add(part(0.26, 0.38, 0.26, [0.01, -0.18, 0])); el.add(part(0.28, 0.24, 0.26, [0.02, -0.44, 0], null, dk)); // ciężka pięść
    rivets(el, 0.13, -0.08, 0.1 * side, 3);
  }
  if (L.size) root.scale.setScalar(L.size);
  return root;
}
