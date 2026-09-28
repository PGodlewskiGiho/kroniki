// ==================== CZĘŚCI PORTRETU: WŁOSY, ZAROST, STRÓJ, NAKRYCIA GŁOWY ========================
// Każda część to funkcja (root, P, L, s) dopisywana do s.parts; P = pozycje wierzchołków głowy, L = punkty twarzy.
/* global THREE, HD, mat, tex, DK, LT, col3 */
const TAU = Math.PI * 2;
let PT_CUR = {}; // opis portretu w trakcie renderu (kolory dla malowania skóry)
function rngOf(seed) { let t = (seed >>> 0) || 1; return () => ((t = Math.imul(t ^ t >>> 15, 0x2c1b3c6d) + 0x6d2b79f5 >>> 0) >>> 0) / 4294967296; }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// --- pole promienia głowy: największa odległość skóry od środka czaszki w danym kierunku (kolizje włosów, nakrycia) ---
function headField(P, L) {
  if (L.field) return L.field;
  const C = new THREE.Vector3(0, L.eyeY + 0.3, L.back + (L.nose.z - L.back) * 0.45), NT = 72, NP = 48, R = new Float32Array(NT * NP);
  const tp = (x, y, z) => { const r = Math.hypot(x, y, z) || 1e-6; let t = Math.atan2(x, z) / TAU; if (t < 0) t += 1; return [t * NT, Math.acos(Math.max(-1, Math.min(1, y / r))) / Math.PI * NP, r]; };
  for (const i of HD.G.body.verts) { const [t, p, r] = tp(P[i * 3] - C.x, P[i * 3 + 1] - C.y, P[i * 3 + 2] - C.z), k = Math.min(NP - 1, p | 0) * NT + (t | 0) % NT; if (r > R[k]) R[k] = r; }
  for (let it = 0; it < 40; it++) { let holes = 0; for (let p = 0; p < NP; p++) for (let t = 0; t < NT; t++) { const k = p * NT + t; if (R[k]) continue; holes++; let s = 0, n = 0;
    for (const [dp, dt] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const pp = p + dp; if (pp < 0 || pp >= NP) continue; const v = R[pp * NT + (t + dt + NT) % NT]; if (v) { s += v; n++; } } if (n) R[k] = s / n; } if (!holes) break; }
  const at = (p, t) => R[Math.max(0, Math.min(NP - 1, p)) * NT + ((t % NT) + NT) % NT];
  const r = d => { const [t0, p0] = tp(d.x, d.y, d.z), t = t0 - 0.5, p = p0 - 0.5, ti = Math.floor(t), pi = Math.floor(p), ft = t - ti, fp = p - pi;
    return (at(pi, ti) * (1 - ft) + at(pi, ti + 1) * ft) * (1 - fp) + (at(pi + 1, ti) * (1 - ft) + at(pi + 1, ti + 1) * ft) * fp; };
  // punkt na powierzchni (z zapasem off) w kierunku d
  const surf = (d, off = 0) => { const n = d.clone().normalize(); return C.clone().addScaledVector(n, r(n) + off); };
  return (L.field = { C, r, surf, sd: skinDist(P, L) });
}
// Odległość od skóry (ze znakiem, po normalnej najbliższego wierzchołka) – kolizje pasm z twarzą, szyją i barkami
function skinDist(P, L) {
  if (L.sdist) return L.sdist;
  const N = smoothNormals(P, HD.G.body.faces), CS = 0.25, grid = new Map(), key = (x, y, z) => (Math.floor(x / CS) + 500) * 1e6 + (Math.floor(y / CS) + 500) * 1e3 + (Math.floor(z / CS) + 500);
  for (const i of HD.G.body.verts) { const k = key(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
  const q = (p) => { let best = -1, bd = 1e9; const cx = Math.floor(p.x / CS), cy = Math.floor(p.y / CS), cz = Math.floor(p.z / CS);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const a = grid.get((cx + dx + 500) * 1e6 + (cy + dy + 500) * 1e3 + (cz + dz + 500)); if (!a) continue;
      for (const i of a) { const d = (P[i * 3] - p.x) ** 2 + (P[i * 3 + 1] - p.y) ** 2 + (P[i * 3 + 2] - p.z) ** 2; if (d < bd) { bd = d; best = i; } } }
    if (best < 0) return null; const n = new THREE.Vector3(N[best * 3], N[best * 3 + 1], N[best * 3 + 2]);
    return { d: (p.x - P[best * 3]) * n.x + (p.y - P[best * 3 + 1]) * n.y + (p.z - P[best * 3 + 2]) * n.z, n }; };
  return (L.sdist = q);
}
// kąty kierunku: azymut od przodu (0 = twarz, ±π = tył), odchylenie od pionu (0 = czubek)
const angles = d => ({ th: Math.atan2(d.x, d.z), ph: Math.acos(Math.max(-1, Math.min(1, d.y / d.length()))) });
// Linia włosów: do jakiego odchylenia od czubka sięgają włosy przy danym azymucie (w stopniach); rec = zakola/łysienie
function hairlinePh(th, st) {
  const a = Math.abs(th) * 180 / Math.PI, rec = st.recede || 0, pts = [[0, 50 - rec * 30], [30, 55 - rec * 28], [55, 68 - rec * 12], [72, 98], [88, 92], [110, 96], [140, 112], [180, 120]];
  for (let i = 1; i < pts.length; i++) if (a <= pts[i][0]) { const [a0, v0] = pts[i - 1], [a1, v1] = pts[i]; return (v0 + (v1 - v0) * (a - a0) / (a1 - a0)) * Math.PI / 180; }
  return pts[pts.length - 1][1] * Math.PI / 180;
}
function inHair(d, st) { const { th, ph } = angles(d); if (st.region === 'strip' && Math.abs(Math.sin(th)) * Math.sin(ph) > 0.22) return 0; if (st.crown && ph < 0.55 - st.crown) return 0; return smooth(hairlinePh(th, st) + 0.05, hairlinePh(th, st) - 0.05, ph); }

// Pasma jako wstążki zwrócone do kamery: jedna siatka z kolorami wierzchołków
function strandMesh(strands, camPos, o = {}) {
  const pos = [], col = [], idx = []; const t = new THREE.Vector3(), sd = new THREE.Vector3(), v = new THREE.Vector3();
  for (const s of strands) {
    const n = s.pts.length, b = pos.length / 3;
    for (let i = 0; i < n; i++) {
      const p = s.pts[i]; t.copy(s.pts[Math.min(n - 1, i + 1)]).sub(s.pts[Math.max(0, i - 1)]).normalize(); v.copy(camPos).sub(p).normalize(); sd.crossVectors(t, v).normalize();
      const f = i / (n - 1), w = s.w * (1 - f * (o.taper ?? 0.75)) / 2, c = s.cols[i];
      pos.push(p.x - sd.x * w, p.y - sd.y * w, p.z - sd.z * w, p.x + sd.x * w, p.y + sd.y * w, p.z + sd.z * w); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (i < n - 1) { const a = b + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  // normalne „objętości”: od środka bryły włosów (głowa, broda), nie od płaskiej wstążki – cieniowanie jak masy włosów
  const nrm = new Float32Array(pos.length), cen = o.center || new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < pos.length; i += 3) { q.set(pos[i] - cen.x, (pos[i + 1] - cen.y) * (o.squash ?? 0.6), pos[i + 2] - cen.z).normalize(); nrm[i] = q.x; nrm[i + 1] = q.y; nrm[i + 2] = q.z; }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: o.rough ?? 0.5, side: THREE.DoubleSide, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.35, specularIntensity: 0.6 });
  const mesh = new THREE.Mesh(g, m); mesh.userData.noShadow = !!o.noShadow; return mesh;
}
// kolor pasma: odcień z rozrzutem, ciemniejsza nasada, jaśniejsze końce, siwe pasma
function strandColors(n, base, R, st) {
  const c0 = col3(base).multiplyScalar(0.88 + R() * 0.24), grey = R() < (st.grey || 0), out = [];
  if (grey) c0.lerp(col3('#d8d4cc'), 0.85);
  for (let i = 0; i < n; i++) { const f = i / (n - 1); out.push(c0.clone().multiplyScalar(0.78 + 0.22 * Math.min(1, f * 3)).lerp(col3(st.tips || '#ffffff'), f * (st.tipLight ?? 0.12))); }
  return out;
}
// Wzrost pasma od nasady: kierunek startowy, grawitacja, skręt, kolizja z głową, twarz zostaje odsłonięta
function growStrand(p0, d0, len, st, F, L, R, attract) {
  const seg = st.seg || 0.09, n = Math.max(3, Math.round(len / seg)), pts = [p0.clone()], d = d0.clone(), p = p0.clone(), C = F.C, SD = F.sd;
  const off = st.vol * (0.3 + R() * 0.7) + 0.015, ph = R() * TAU, faceW = Math.abs(L.eyeL.x) + L.er * 2.4, browY = L.eyeY + L.er * 2.2;
  const q = new THREE.Vector3(), curlAx = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize();
  for (let i = 1; i < n; i++) {
    const f = i / n;
    d.y -= (st.grav ?? 0.5) * seg * (0.4 + f);
    if (attract) { const [T, k] = attract(p, f); if (T) d.lerp(q.copy(T).sub(p).normalize(), k); }
    if (st.curl) { const a = ph + i * (st.curlF || 5) * seg; d.addScaledVector(q.set(Math.cos(a), Math.sin(a * 1.3), Math.sin(a)).cross(curlAx), st.curl * seg * 6); }
    if (st.frizz) d.add(q.set(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(st.frizz));
    d.normalize(); p.addScaledVector(d, seg);
    // kolizja: poza skórą głowy, szyi i barków (z grubością warstwy)
    const sd = SD(p); if (sd && sd.d < off) { p.addScaledVector(sd.n, off - sd.d); d.addScaledVector(sd.n, -Math.min(0, d.dot(sd.n))).normalize(); }
    else if (st.hug != null && sd && sd.d > off + st.hug && p.y > L.eyeY - 0.3) { p.addScaledVector(sd.n, -(sd.d - off - st.hug) * 0.7); } // przylega do czaszki
    // twarz odsłonięta: pasma przed twarzą odsuwamy na boki (grzywka może zejść do brwi)
    if (!st.veilFace && p.z > C.z + 0.25 && p.y < (st.bangs ? browY : L.top - 0.35) && p.y > L.chin - 0.6 && Math.abs(p.x) < faceW) { p.x = Math.sign(p.x || 1) * faceW; d.x += Math.sign(p.x) * 0.5; d.normalize(); }
    pts.push(p.clone());
  }
  return pts;
}
// Próbkowanie punktów na skórze (trójkąty z wagą pola) spełniających warunek maski
function sampleSkin(P, L, count, weight, R) {
  const tris = [], cum = []; let tot = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const f of HD.G.body.faces) for (const [i, j, k] of [[f[0], f[1], f[2]], [f[0], f[2], f[3]]]) { if (i === k || j === k) continue;
    a.fromArray(P, i * 3); b.fromArray(P, j * 3); c.fromArray(P, k * 3); const m = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3), w = weight(m); if (w <= 0.01) continue;
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2 * w; tot += area; tris.push([i, j, k]); cum.push(tot); }
  const out = [];
  for (let n = 0; n < count && tot > 0; n++) { const x = R() * tot; let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < x) lo = m + 1; else hi = m; }
    const [i, j, k] = tris[lo]; let u = R(), v = R(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    a.fromArray(P, i * 3); b.fromArray(P, j * 3); c.fromArray(P, k * 3); out.push(a.clone().multiplyScalar(1 - u - v).addScaledVector(b, u).addScaledVector(c, v)); }
  return out;
}

// --- fryzury ---
const HAIR_STYLES = {
  crop: { len: 0.28, n: 9000, lift: 0.1, flow: 'back', grav: 0.15, curl: 0.04, vol: 0.02, w: 0.03, seg: 0.06 },
  short: { len: 0.5, n: 8000, lift: 0.08, flow: 'side', grav: 0.35, curl: 0.05, vol: 0.04, w: 0.032 },
  swept: { len: 0.95, n: 7000, lift: 0.3, flow: 'back', grav: 0.35, curl: 0.06, vol: 0.08, w: 0.032 },
  long: { len: 2.8, n: 7000, lift: 0.15, flow: 'part', grav: 0.9, curl: 0.1, vol: 0.1, w: 0.03, hug: 0.12 },
  curly: { len: 1.3, n: 7000, lift: 0.5, flow: 'part', grav: 0.45, curl: 0.55, curlF: 9, vol: 0.22, w: 0.035 },
  wild: { len: 2.0, n: 7000, lift: 0.55, flow: 'side', grav: 0.55, curl: 0.3, frizz: 0.12, vol: 0.28, w: 0.035 },
  shoulder: { len: 1.7, n: 7000, lift: 0.2, flow: 'part', grav: 0.75, curl: 0.12, vol: 0.12, w: 0.03, hug: 0.15 },
  ponytail: { len: 1.0, n: 6500, lift: 0.15, flow: 'back', grav: 0.2, curl: 0.05, vol: 0.04, w: 0.03, tie: 'pony', tail: 2.4 },
  bun: { len: 1.0, n: 6500, lift: 0.15, flow: 'back', grav: 0.1, curl: 0.04, vol: 0.04, w: 0.03, tie: 'bun' },
  braid: { len: 1.0, n: 6500, lift: 0.15, flow: 'back', grav: 0.2, curl: 0.04, vol: 0.04, w: 0.03, tie: 'braid', tail: 2.6 },
  mohawk: { len: 0.9, n: 3500, lift: 1.4, flow: 'up', grav: -0.1, curl: 0.05, vol: 0.05, w: 0.035, region: 'strip' },
  topknot: { len: 1.0, n: 6000, lift: 0.1, flow: 'up', grav: 0.0, curl: 0.03, vol: 0.03, w: 0.03, tie: 'top', tail: 1.2 },
  fringe: { len: 0.7, n: 8000, lift: 0.25, flow: 'fringe', grav: 0.55, curl: 0.05, vol: 0.07, w: 0.032, bangs: true },
};
function hairPart(opt) {
  const st = { ...HAIR_STYLES[opt.style || 'short'], ...opt };
  const part = (root, P, L, s) => {
    const R = rngOf((s.seed || 1) * 31 + 7), F = headField(P, L), C = F.C;
    const roots = sampleSkin(P, L, Math.round(st.n * (st.density ?? 1)), m => inHair(m.clone().sub(C), st), R), strands = [];
    const partX = st.partX ?? (R() < 0.5 ? -0.25 : 0.25) * (st.flow === 'part' ? 1 : 0);
    const tieP = st.tie === 'pony' || st.tie === 'braid' ? F.surf(new THREE.Vector3(0, 0.25, -1), 0.08) : st.tie === 'bun' ? F.surf(new THREE.Vector3(0, 0.55, -0.8), 0.25) : st.tie === 'top' ? F.surf(new THREE.Vector3(0, 1, -0.25), 0.05) : null;
    for (const p0 of roots) {
      const n0 = p0.clone().sub(C).normalize(); let d;
      const side = new THREE.Vector3(Math.sign(p0.x - partX) || 1, 0, 0);
      switch (st.flow) {
        case 'back': d = new THREE.Vector3(0, 0.15, -1); break;
        case 'up': d = new THREE.Vector3(0, 1, -0.2); break;
        case 'fringe': d = n0.z > 0.2 ? new THREE.Vector3(0, -0.4, 1) : new THREE.Vector3(side.x * 0.4, -0.5, n0.z - 0.2); break;
        case 'side': d = new THREE.Vector3(side.x * 0.6, -0.4, n0.z > 0 ? -0.6 : -0.2); break;
        default: d = side.clone().add(new THREE.Vector3(0, -0.2, n0.z > 0.3 ? -0.8 : -0.1)); // przedziałek
      }
      d.addScaledVector(n0, -d.dot(n0)).normalize().addScaledVector(n0, st.lift).normalize();
      const len = st.len * (0.65 + R() * 0.7);
      const attract = tieP ? (p => p.distanceTo(tieP) > 0.12 ? [tieP, 0.35] : [null, 0]) : null;
      const pts = growStrand(p0, d, st.tie ? Math.max(len, p0.distanceTo(tieP) + 0.2) : len, st, F, L, R, attract);
      strands.push({ pts, w: st.w * (0.85 + R() * 0.3), cols: strandColors(pts.length, s.hair, R, { ...st, grey: st.grey ?? s.grey }) });
    }
    // ogon, warkocz, węzeł na czubku
    if (tieP && st.tie !== 'bun') for (let i = 0; i < (st.tie === 'braid' ? 900 : 1600); i++) {
      const p0 = tieP.clone().add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.16)), d = st.tie === 'top' ? new THREE.Vector3(R() - 0.5, 1.4, R() - 0.5 - 0.5) : new THREE.Vector3((R() - 0.5) * 0.4, -0.3, -1);
      const tst = { ...st, grav: st.tie === 'top' ? 1.2 : 0.9, curl: st.tie === 'braid' ? 0.35 : 0.12, curlF: st.tie === 'braid' ? 14 : 5, vol: 0.02, lift: 0 };
      const pts = growStrand(p0, d.normalize(), st.tail * (0.75 + R() * 0.3), tst, F, L, R, null);
      strands.push({ pts, w: st.w * 1.1, cols: strandColors(pts.length, s.hair, R, { ...st, grey: st.grey ?? s.grey }) });
    }
    if (st.tie === 'bun') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), mat(DK(s.hair, 0.1), 'hair', 2)); b.position.copy(tieP); b.scale.set(1, 0.85, 0.9); root.add(b); }
    root.add(strandMesh(strands, L.camPos, { taper: st.taper, center: F.C }));
  };
  // skóra głowy pod włosami w ich kolorze (bez prześwitów)
  part.paint = (c, v, i, P, L) => { const F = headField(P, L), w = inHair(v.clone().sub(F.C), { ...st, recede: (st.recede || 0) - 0.15 }); if (w > 0) c.lerp(col3(PT_CUR.hair).multiplyScalar(0.55), w * 0.95); };
  return part;
}
// --- brwi: krótkie pasma wzdłuż łuku nad oczami ---
function browPart(opt = {}) {
  return (root, P, L, s) => {
    const F = headField(P, L), R = rngOf((s.seed || 1) * 17 + 3), strands = [], thick = opt.thick ?? 1, arch = opt.arch ?? 0.3, tilt = opt.tilt ?? 0;
    for (const [e, sg] of [[L.eyeL, 1], [L.eyeR, -1]]) for (let i = 0; i < 260 * thick; i++) {
      const t = R(), x = e.x + sg * (-0.9 + 2.1 * t) * L.er, y = e.y + L.er * (1.35 + (opt.lift ?? 0)) + Math.sin(t * Math.PI) * arch * L.er + (t - 0.4) * tilt * L.er * sg * 0 + (R() - 0.5) * 0.09 * thick - (opt.angry ? (1 - t) * 0.12 : 0) + (opt.sad ? t * -0.1 : 0);
      const p0 = F.surf(new THREE.Vector3(x - F.C.x, y - F.C.y, 1.0), 0.005), d = new THREE.Vector3(sg * (0.6 + t * 0.6), 0.35 - t * 0.5, 0.25).normalize();
      const pts = [p0, p0.clone().addScaledVector(d, 0.08 * thick), p0.clone().addScaledVector(d, 0.15 * thick)].map(p => { const q = p.clone().sub(F.C); return F.C.clone().addScaledVector(q.normalize(), F.r(q) + 0.012); });
      strands.push({ pts, w: 0.022, cols: strandColors(3, s.brows || s.hair, R, { grey: s.grey || 0 }) });
    }
    root.add(strandMesh(strands, L.camPos, { taper: 0.5, noShadow: true, center: F.C }));
  };
}
// --- zarost: broda, wąsy, bokobrody ---
const BEARDS = {
  goatee: { zones: ['chin', 'mustache'], len: 0.45, grav: 0.6, vol: 0.04 },
  full: { zones: ['chin', 'jaw', 'cheek', 'mustache'], len: 0.6, grav: 0.6, vol: 0.06 },
  long: { zones: ['chin', 'jaw', 'cheek', 'mustache'], len: 1.9, grav: 1.1, vol: 0.12, curl: 0.12 },
  dwarf: { zones: ['chin', 'jaw', 'cheek', 'mustache'], len: 2.6, grav: 1.1, vol: 0.2, curl: 0.25 },
  mustache: { zones: ['mustache'], len: 0.45, grav: 0.9, vol: 0.03 },
  droop: { zones: ['mustache', 'chin'], len: 0.9, grav: 1.2, vol: 0.03 },
  mutton: { zones: ['jaw', 'cheek', 'mustache'], len: 0.45, grav: 0.5, vol: 0.07 },
  short: { zones: ['chin', 'jaw', 'cheek', 'mustache'], len: 0.2, grav: 0.2, vol: 0.015, seg: 0.04, lift: 0.02, mustLen: 0.14, w: 0.03 },
};
function beardZone(m, L, zones) {
  const up = L.nose.y - 0.12, lw = L.mouth.y, faceFront = m.z - L.back, ax = Math.abs(m.x), jawX = Math.abs(L.eyeL.x) + L.er * 2.6;
  const jawLine = L.chin - 0.18 + Math.pow(Math.min(1, ax / jawX), 2) * (L.mouth.y + 0.35 - L.chin);
  if (faceFront < 0.9 || m.y < jawLine) return 0;
  let w = 0;
  if (zones.includes('mustache') && m.y < up && m.y > lw + 0.06 && ax < 0.42 + (up - m.y) * 0.3 && faceFront > 1.6) w = 1;
  if (zones.includes('chin') && m.y < lw - 0.12 && ax < 0.55) w = 1;
  if (zones.includes('jaw') && m.y < lw + 0.1 && ax < jawX) w = 1;
  if (zones.includes('cheek') && m.y < up - 0.05 && ax > 0.5 && ax < jawX && m.y > lw - 0.2) w = Math.max(w, smooth(up - 0.05, up - 0.35, m.y));
  if (zones.includes('sideburn') && ax > jawX - 0.4 && m.y < L.eyeY && m.y > lw) w = 1;
  return w;
}
function beardPart(opt) {
  const st = { seg: 0.06, w: 0.038, curl: 0.05, ...BEARDS[opt.style || 'full'], ...opt };
  const part = (root, P, L, s) => {
    const R = rngOf((s.seed || 1) * 13 + 11), F = headField(P, L), strands = [];
    const roots = sampleSkin(P, L, st.n || 6000, m => beardZone(m, L, st.zones), R);
    // koniec brody: pasma zbiegają się pod podbródkiem (broda ma kształt, nie jest prostokątem)
    const tip = new THREE.Vector3(0, L.chin - st.len * 0.75, L.mouth.z - 0.25 - st.len * 0.15);
    for (const p0 of roots) {
      const n0 = p0.clone().sub(F.C).normalize(), must = p0.y > L.mouth.y + 0.04 && Math.abs(p0.x) < 0.7;
      const d = must ? new THREE.Vector3(Math.sign(p0.x) * 0.5, -1, 0.15) : tip.clone().sub(p0).normalize().add(new THREE.Vector3(0, -0.6, 0.1));
      d.addScaledVector(n0, -d.dot(n0)).normalize().addScaledVector(n0, st.lift ?? 0.12).normalize();
      const chinPart = 1 - Math.min(1, Math.abs(p0.x) / 1.1), len = (must ? (st.mustLen ?? 0.22) : st.len * (0.35 + 0.65 * chinPart)) * (0.7 + R() * 0.5);
      const attract = must ? null : (p, f) => (f > 0.3 ? [tip, 0.12 * (st.converge ?? 1)] : [null, 0]);
      const pts = growStrand(p0, d, len, { ...st, veilFace: true, grav: must ? 0.8 : st.grav }, F, L, R, attract);
      strands.push({ pts, w: st.w * (0.85 + R() * 0.3), cols: strandColors(pts.length, s.beard || s.hair, R, { grey: st.grey ?? s.grey ?? 0, tipLight: 0.15 }) });
    }
    if (st.braids) for (const bx of st.braids) { const top = new THREE.Vector3(bx, L.chin - 0.3, L.mouth.z - 0.1); for (let i = 0; i < 300; i++) { const p0 = top.clone().add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.12));
      const pts = growStrand(p0, new THREE.Vector3(0, -1, 0.3).normalize(), st.len * 0.8, { ...st, curl: 0.4, curlF: 16, vol: 0.02, veilFace: true }, F, L, R, null); strands.push({ pts, w: 0.04, cols: strandColors(pts.length, s.beard || s.hair, R, { grey: s.grey || 0 }) }); } }
    root.add(strandMesh(strands, L.camPos, { taper: 0.55, center: new THREE.Vector3(0, L.mouth.y, F.C.z - 0.2), squash: 0.35 }));
  };
  part.paint = (c, v, i, P, L) => { const w = beardZone(v, L, st.zones); if (w > 0) c.lerp(col3(PT_CUR.beard || PT_CUR.hair).multiplyScalar(0.6), w * 0.85); };
  return part;
}
// --- stroje: powłoka na barkach (szata, zbroja, futro) ---
// Zbiór ścian skóry poniżej linii dekoltu, odsunięty wzdłuż normalnych
function shellMesh(P, L, below, thick, material, o = {}) {
  const faces = HD.G.body.faces.filter(f => f.every(i => P[i * 3 + 1] < below(P[i * 3], P[i * 3 + 2]) && (o.keep ? o.keep(i) : true)));
  const N = smoothNormals(P, faces), Q = P.slice(); const used = new Set(); for (const f of faces) for (const i of f) used.add(i);
  for (const i of used) for (let a = 0; a < 3; a++) Q[i * 3 + a] += N[i * 3 + a] * (typeof thick === 'function' ? thick(i, P) : thick);
  const idx = []; for (const f of faces) { idx.push(f[0], f[1], f[2]); if (f[3] !== f[2]) idx.push(f[0], f[2], f[3]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(Q, 3)); g.setAttribute('normal', new THREE.BufferAttribute(smoothNormals(Q, faces), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from(HD.uvs), 2)); g.setIndex(idx); return new THREE.Mesh(g, material);
}
// Pierścień wokół szyi/głowy: punkty na powierzchni w pochylonej płaszczyźnie (h = wysokość środka, tilt = pochylenie przód-tył)
function ringPoints(F, y, tilt, off, n = 48, ox = 0) {
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)); let p = null;
    for (let k = 0; k < 4; k++) { const yy = y + Math.cos(a) * tilt, q = new THREE.Vector3(d.x * 1.2, yy - F.C.y, d.z * 1.2); p = F.surf(q, off); } pts.push(p); }
  return pts;
}
// Pierścień na szyi (albo wyżej na głowie): od zewnątrz do skóry, na wysokości y (przód niżej o drop)
function neckRing(F, L, y, off, drop = 0.15, n = 40) {
  const pts = [], cz = F.C.z - 0.25;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, dx = Math.sin(a), dz = Math.cos(a), yy = y - drop * Math.max(0, dz); let r = 2.2, p = new THREE.Vector3();
    for (; r > 0.1; r -= 0.02) { p.set(dx * r, yy, cz + dz * r); const sd = F.sd(p); if (sd && sd.d < off) break; } pts.push(p.clone()); }
  return pts;
}
function tubeOf(pts, r, material, closed = true) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), pts.length * 3, r, 10, closed), material); }
function dressPart(opt) {
  return (root, P, L, s) => {
    const F = headField(P, L), neckY = L.chin - (opt.neck ?? 0.55), kind = opt.kind || 'robe', col = opt.col || '#5a4a3a';
    const below = (x, z) => neckY - Math.max(0, z - (L.back + 0.6)) * (opt.v ?? 0.25) + (Math.abs(x) > 0.9 ? 0.25 : 0);
    const material = kind === 'plate' ? metalMat(col) : kind === 'mail' ? mat(col, 'mail', 14) : kind === 'leather' ? mat(col, 'leather', 3) : kind === 'fur' ? mat(col, 'fur', 5) : mat(col, 'cloth', 6);
    root.add(shellMesh(P, L, below, kind === 'plate' ? 0.14 : kind === 'fur' ? 0.22 : 0.07, material));
    if (opt.under) root.add(shellMesh(P, L, (x, z) => below(x, z) + 0.25, 0.04, mat(opt.under, opt.underKind || 'cloth', 6)));
    if (opt.collar) root.add(tubeOf(neckRing(F, L, neckY + 0.1, (opt.collarR || 0.07) + 0.06, 0.3), opt.collarR || 0.07, mat(opt.collar, opt.collarKind || 'cloth', 3)));
    if (opt.fur) { const pts = []; for (let i = 0; i <= 24; i++) { const a = -1.2 + i / 24 * 2.4 + Math.PI; pts.push(new THREE.Vector3(Math.sin(a) * 2.2, neckY - 0.3 - Math.abs(Math.cos(a)) * 0.1, L.center.z + Math.cos(a) * -1.1 - 0.3)); }
      for (const sg of [-1, 1]) { const arc = []; for (let i = 0; i <= 12; i++) { const t = i / 12; arc.push(new THREE.Vector3(sg * (0.75 + t * 1.6), neckY - 0.05 - t * t * 0.6, L.center.z + 0.2 - t * 0.9)); } const m = tubeOf(arc, 0.32, mat(opt.fur, 'fur', 3), false); m.scale.y = 0.8; root.add(m); } }
    if (opt.pauldrons) for (const sg of [-1, 1]) { const top = new THREE.Vector3(sg * 1.7, 5.6, F.C.z - 0.3); for (let yy = 7; yy > 4.6; yy -= 0.02) { top.y = yy; const sd = F.sd(top); if (sd && sd.d < 0.05) break; }
      for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.8 - k * 0.06, 24, 12, 0, TAU, 0, Math.PI / 2), metalMat(opt.pauldrons)); m.position.copy(top).add(new THREE.Vector3(sg * k * 0.18, -0.12 - k * 0.2, 0)); m.rotation.z = -sg * (0.35 + k * 0.25); m.scale.set(1, 0.55, 1.05); root.add(m); }
      if (opt.spikes) for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 8), metalMat(DK(opt.pauldrons, 0.3))); c.position.set(sg * (1.55 + k * 0.2), neckY - 0.05 - k * 0.05, L.center.z - 0.2 + k * 0.12); c.rotation.z = -sg * 0.5; root.add(c); } }
    if (opt.gorget) for (let k = 0; k < 3; k++) root.add(tubeOf(neckRing(F, L, neckY + 0.05 - k * 0.14, 0.16 + k * 0.05, 0.25), 0.09, metalMat(opt.gorget)));
    if (opt.clasp) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mat(opt.clasp, 'gold')); c.position.copy(F.surf(new THREE.Vector3(0, neckY - 0.3 - F.C.y, 1.3), 0.12)); c.scale.z = 0.5; root.add(c); }
  };
}
// metal z silniejszym odbiciem otoczenia (inaczej ciemny)
function metalMat(col, rough = 0.32) { const m = new THREE.MeshStandardMaterial({ color: col, metalness: 0.9, roughness: rough, envMapIntensity: 5 }); const t = tex('plate').clone(); t.needsUpdate = true; t.repeat.set(3, 3); m.bumpMap = t; m.bumpScale = 0.3; return m; }
// --- nakrycia głowy ---
// Czasza wokół głowy: siatka kierunków (azymut, odchylenie) z promieniem pola + zapas; maska decyduje, co zostaje
function capMesh(F, off, keep, material, o = {}) {
  const NT = o.nt || 64, NP = o.np || 40, phMax = o.phMax || Math.PI * 0.75, pos = [], idx = [], uv = [], ok = [];
  for (let j = 0; j <= NP; j++) for (let i = 0; i <= NT; i++) { const th = i / NT * TAU - Math.PI, ph = j / NP * phMax, d = new THREE.Vector3(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th));
    const extra = typeof off === 'function' ? off(th, ph) : off, p = F.surf(d, extra); pos.push(p.x, p.y, p.z); uv.push(i / NT * (o.rep || 4), j / NP * (o.rep || 4)); ok.push(keep(th, ph)); }
  for (let j = 0; j < NP; j++) for (let i = 0; i < NT; i++) { const a = j * (NT + 1) + i, b = a + 1, c = a + NT + 1, d = c + 1; if (ok[a] && ok[b] && ok[c] && ok[d]) idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); if (o.double) { m.material = material.clone(); m.material.side = THREE.DoubleSide; } return m;
}
function headwearPart(opt) {
  return (root, P, L, s) => {
    const F = headField(P, L), k = opt.kind, col = opt.col || '#8a8a90', browPh = angles(new THREE.Vector3(0, L.eyeY + L.er * 2.4 - F.C.y, 1)).ph;
    const faceOpen = (th, ph, w = 0.62, top = 0.5, bot = 2.2) => Math.abs(th) < w && ph > top && ph < bot;
    const metal = opt.mat ? mat(col, opt.mat, 3) : metalMat(col);
    if (k === 'helm' || k === 'horned' || k === 'spiked' || k === 'crested' || k === 'winged') {
      const edge = browPh - 0.05 + (opt.low ?? 0);
      root.add(capMesh(F, 0.16, (th, ph) => ph < edge + Math.min(0.5, Math.abs(th) * 0.25) + (Math.abs(th) > 1.2 ? 0.35 : 0), metal, { phMax: 2.0 }));
      root.add(tubeOf(ringPoints(F, L.eyeY + L.er * 2.2, -0.35, 0.2), 0.05, metalMat(DK(col, 0.25))));
      if (opt.nasal) { const top = F.surf(new THREE.Vector3(0, L.eyeY + L.er * 2.2 - F.C.y, 1), 0.17), bot = new THREE.Vector3(0, L.nose.y + 0.35, L.nose.z + 0.12); root.add(tubeOf([top, top.clone().lerp(bot, 0.5).add(new THREE.Vector3(0, 0, 0.05)), bot], 0.07, metal, false)); }
      if (opt.cheeks) for (const sg of [-1, 1]) root.add(capMesh(F, 0.17, (th, ph) => th * sg > 0.55 && th * sg < 1.5 && ph > edge - 0.1 && ph < 2.05, metal, { phMax: 2.1 }));
      if (k === 'horned') for (const sg of [-1, 1]) { const b = F.surf(new THREE.Vector3(sg, 0.55, 0.1), 0.1), pts = [b]; for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push(b.clone().add(new THREE.Vector3(sg * (t * 1.3), t * (opt.up ?? 1.2) - t * t * 0.3, t * (opt.fwd ?? 0.4) - t * t * 0.2))); }
        const h = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.2, 10), mat(opt.horn || '#e0d0b0', 'horn')); taperTube(h, 0.2, 0.02); root.add(h); }
      if (k === 'spiked') for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.35, b = F.surf(new THREE.Vector3(Math.sin(a), 0.9, Math.cos(a) * 0.6), 0.15), c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55 - Math.abs(i - 3) * 0.08, 8), metalMat(DK(col, 0.1))); c.position.copy(b); c.lookAt(b.clone().add(b.clone().sub(F.C))); c.rotateX(Math.PI / 2); root.add(c); }
      if (k === 'crested') { const pts = []; for (let i = 0; i <= 10; i++) { const a = -0.4 + i / 10 * 2.4; pts.push(F.surf(new THREE.Vector3(0, Math.cos(a), Math.sin(-a + 0.8) * 0.9 + 0.1), 0.35)); } root.add(tubeOf(pts, 0.14, mat(opt.plume || '#b02a2a', 'fur', 2), false)); }
      if (k === 'winged') for (const sg of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), mat(opt.wing || '#e8e8f0', 'feather', 1)); w.material = w.material.clone(); w.material.side = THREE.DoubleSide; w.position.copy(F.surf(new THREE.Vector3(sg, 0.4, -0.1), 0.35)); w.rotation.set(0, sg * 1.3, sg * 0.5); root.add(w); }
    }
    if (k === 'hood' || k === 'cowl') {
      const hm = mat(col, 'cloth', 4), deep = k === 'cowl' ? 0.55 : 0.35;
      root.add(capMesh(F, (th, ph) => deep + 0.25 * Math.max(0, Math.cos(th + Math.PI)) + (ph > 1.9 ? (ph - 1.9) * 1.2 : 0) + 0.04 * Math.sin(th * 9 + ph * 5), (th, ph) => !faceOpen(th, ph, 0.72 + (ph - 1) * 0.12, browPh - 0.35 - (opt.open || 0), 2.9), hm, { phMax: 2.45, double: true, rep: 3 }));
    }
    if (k === 'coif') root.add(capMesh(F, 0.1, (th, ph) => !faceOpen(th, ph, 0.7, browPh - 0.08, 2.9), mat(col, 'mail', 20), { phMax: 2.4 }));
    if (k === 'circlet' || k === 'crown' || k === 'headband' || k === 'diadem') {
      const y = L.eyeY + L.er * (k === 'headband' ? 2.6 : 2.9), band = ringPoints(F, y, k === 'crown' ? -0.1 : -0.3, k === 'headband' ? 0.06 : 0.07);
      root.add(tubeOf(band, k === 'headband' ? 0.1 : 0.06, mat(col, k === 'headband' ? 'cloth' : 'gold', 2)));
      if (k === 'crown') for (let i = 0; i < 12; i++) { const p = band[i * 4], c = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 4), mat(col, 'gold')); c.position.copy(p).add(new THREE.Vector3(0, 0.2, 0)); c.position.addScaledVector(p.clone().sub(F.C).setY(0).normalize(), 0.03); root.add(c); }
      if (opt.gem) { const g = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), mat(opt.gem, 'gem')); g.position.copy(band[0]).add(new THREE.Vector3(0, k === 'diadem' ? 0.05 : 0, 0.06)); g.scale.set(1, 1.3, 0.6); root.add(g); }
      if (k === 'headband' && opt.knot) for (const sg of [-0.3, 0.3]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.9), mat(col, 'cloth', 1)); t.material = t.material.clone(); t.material.side = THREE.DoubleSide; t.position.copy(band[24]).add(new THREE.Vector3(sg, -0.4, -0.1)); t.rotation.z = sg * 0.6; root.add(t); }
    }
    if (k === 'hat') { const y = L.eyeY + L.er * 3.0, band = ringPoints(F, y, -0.2, 0.08), c = band.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(band.length);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(opt.brim || 2.0, opt.brim || 2.0, 0.06, 40), mat(col, opt.mat || 'leather', 3)); brim.position.copy(c); brim.rotation.x = -0.12; root.add(brim);
      const top = new THREE.Mesh(opt.cone ? new THREE.ConeGeometry(1.25, opt.cone, 32) : new THREE.CylinderGeometry(1.05, 1.25, 1.0, 32), mat(col, opt.mat || 'leather', 3)); top.position.copy(c).add(new THREE.Vector3(0, (opt.cone || 1.0) / 2, -0.05)); top.rotation.x = -0.12 - (opt.cone ? 0.25 : 0); root.add(top);
      if (opt.feather) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.6), mat(opt.feather, 'feather', 1)); f.material = f.material.clone(); f.material.side = THREE.DoubleSide; f.position.copy(c).add(new THREE.Vector3(0.9, 0.7, -0.3)); f.rotation.set(0.3, 0.5, -0.8); root.add(f); } }
    if (k === 'turban') for (let i = 0; i < 4; i++) { const band = ringPoints(F, L.eyeY + L.er * (2.6 + i * 0.9), -0.25 + i * 0.05, 0.1 + i * 0.05 - i * i * 0.04); const t = tubeOf(band, 0.24, mat(col, 'cloth', 2)); root.add(t); }
    if (k === 'antlers') for (const sg of [-1, 1]) { const b = F.surf(new THREE.Vector3(sg * 0.6, 0.8, 0.2), 0), main = [b]; for (let i = 1; i <= 6; i++) { const t = i / 6; main.push(b.clone().add(new THREE.Vector3(sg * t * 1.4, t * 1.8, -t * 0.4))); }
      const am = mat(opt.col || '#8a6a4a', 'horn'); root.add(tubeOf(main, 0.08, am, false)); for (const t of [0.35, 0.6, 0.85]) { const p = main[Math.round(t * 6)], q = p.clone().add(new THREE.Vector3(sg * 0.2, 0.55, 0.35)); root.add(tubeOf([p, p.clone().lerp(q, 0.5).add(new THREE.Vector3(0, 0.1, 0)), q], 0.05, am, false)); } }
    if (k === 'skullcrown') { const band = ringPoints(F, L.eyeY + L.er * 2.8, -0.25, 0.08); root.add(tubeOf(band, 0.07, metalMat('#4a4450'))); for (let i = 0; i < 7; i++) { const p = band[(i * 3 + 38) % 48], sk = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), mat('#d8d0bc', 'bone')); sk.position.copy(p).add(new THREE.Vector3(0, 0.18, 0)); root.add(sk); } }
    if (k === 'feathers') for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 1.4), mat(opt.col || '#c8a040', 'feather', 1)); f.material = f.material.clone(); f.material.side = THREE.DoubleSide; f.position.copy(F.surf(new THREE.Vector3(-0.5 + i * 0.25, 0.9, -0.5), 0.3)).add(new THREE.Vector3(0, 0.5, 0)); f.rotation.set(-0.4, 0, (i - 2) * 0.3); root.add(f); }
  };
}
// zwężenie rury (rogi, kły): skala przekroju od nasady do końca
function taperTube(mesh, r0, r1) {
  const p = mesh.geometry.attributes.position, path = mesh.geometry.parameters.path, segs = mesh.geometry.parameters.tubularSegments, rad = mesh.geometry.parameters.radialSegments;
  for (let i = 0; i <= segs; i++) { const t = i / segs, c = path.getPointAt(t), k = (r0 + (r1 - r0) * t) / r0; for (let j = 0; j <= rad; j++) { const a = i * (rad + 1) + j, v = new THREE.Vector3().fromBufferAttribute(p, a).sub(c).multiplyScalar(k).add(c); p.setXYZ(a, v.x, v.y, v.z); } }
  p.needsUpdate = true; mesh.geometry.computeVertexNormals();
}

const TEST_SPECS = [];
TEST_SPECS.push(
  { name: 'knight', gender: 1, age: 0.55, skin: '#d0a490', hair: '#3e2a1a', light: -1, yaw: 0.35, parts: [hairPart({ style: 'short' }), browPart(), beardPart({ style: 'short' }), dressPart({ kind: 'plate', col: '#a8b0bc', gorget: '#8a929c', pauldrons: '#a8b0bc' })] },
  { name: 'lady', gender: 0, age: 0.45, skin: '#eac0a0', hair: '#a0602c', light: 1, yaw: -0.3, bg: { cols: ['#6a3a1a', '#c86a2a', '#f0c060'] }, rimCol: '#ffb070', parts: [hairPart({ style: 'long' }), browPart({ thick: 0.7 }), dressPart({ kind: 'robe', col: '#2a4a7a', collar: '#e0b24a' }), headwearPart({ kind: 'circlet', col: '#e0b24a', gem: '#3a8ae0' })] },
  { name: 'wizard', gender: 1, age: 0.95, weight: 0.3, skin: '#c8987a', hair: '#d8d4cc', grey: 1, light: -1, yaw: 0.2, mods: { 'nose-hump': 0.8, 'nose-scale-vert': 0.4 }, parts: [hairPart({ style: 'long', recede: 0.8 }), browPart({ thick: 1.4 }), beardPart({ style: 'long' }), dressPart({ kind: 'robe', col: '#2a3a7a' })] },
  { name: 'barbarian', gender: 1, age: 0.6, muscle: 0.9, race: { african: 0.6, caucasian: 0.4 }, skin: '#6e4a36', hair: '#1a1210', light: 1, yaw: 0.4, bg: { cols: ['#1a2a1a', '#3a5a2a', '#8a9a4a'] }, rimCol: '#c0e090', parts: [hairPart({ style: 'wild' }), browPart({ thick: 1.2, angry: true }), beardPart({ style: 'full' }), dressPart({ kind: 'leather', col: '#6a4a2a', fur: '#8a7050' })] },
  { name: 'ranger', gender: 1, age: 0.4, skin: '#e0b890', hair: '#c89450', light: -1, yaw: -0.35, parts: [hairPart({ style: 'ponytail' }), browPart(), beardPart({ style: 'goatee' }), dressPart({ kind: 'leather', col: '#5a4a2a' }), headwearPart({ kind: 'hood', col: '#3a5a2a' })] },
  { name: 'viking', gender: 1, age: 0.7, skin: '#e0b090', hair: '#b86a2a', light: -1, yaw: 0.3, parts: [hairPart({ style: 'long' }), browPart({ thick: 1.3 }), beardPart({ style: 'dwarf', braids: [-0.3, 0.3] }), dressPart({ kind: 'mail', col: '#8a8a90', fur: '#6a5040' }), headwearPart({ kind: 'horned', col: '#8a8a90', nasal: true })] },
  { name: 'monk', gender: 1, age: 0.6, skin: '#d8a882', hair: '#5e3e22', light: -1, yaw: 0.3, parts: [hairPart({ style: 'crop', recede: 0.6 }), browPart(), beardPart({ style: 'mustache' }), dressPart({ kind: 'robe', col: '#6a5a3a' })] },
);
const _k = TEST_SPECS.find(t => t.name === 'knight');
TEST_SPECS.push({ ..._k, name: 'A-hard', keyI: 5, fillI: 0.12, envI: 0.1, rimI: 4, con: 1.15 }, { ..._k, name: 'B-hard-side', keyI: 5, keyX: 5, keyZ: 1.2, fillI: 0.15, envI: 0.1, rimI: 4, con: 1.15 },
  { ..._k, name: 'C-top', keyI: 5, keyX: 2.5, keyY: 4.5, keyZ: 2.5, fillI: 0.15, envI: 0.1, rimI: 3, con: 1.15 }, { ..._k, name: 'D-low', frameLow: null, keyI: 4.4, fillI: 0.2, envI: 0.12, rimI: 3.5, con: 1.12, sat: 1.2 });
