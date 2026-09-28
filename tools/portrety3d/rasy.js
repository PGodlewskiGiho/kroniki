// ==================== RASY: DEFORMACJE GŁOWY I DODATKI ===========================================
// Elfie i gobliňskie uszy, otwarta paszcza, kły, rogi, czaszka (lisz), pysk jaszczura. Deformacje dostają pozycje P
// i punkty twarzy L (sprzed deformacji) i zmieniają P w miejscu; dodatki to zwykłe części (root, P, L, s).
/* global THREE, HD, mat, DK, LT, col3, headField, smooth, TAU, tubeOf, taperTube, landmarks */

// Uszy: wierzchołki z maską ucha (brzeg ucha rusza się najbardziej przy skalowaniu, więc maska ≈ odległość od nasady)
const EARS = (() => { const S = { L: [], R: [] }; for (let i = 0; i < HD.nV; i++) { if (HD.M.earL[i] > 0.45) S.L.push(i); if (HD.M.earR[i] > 0.45) S.R.push(i); } return S; })();
function earStretch(k, dir = [0.35, 1, -0.55], pow = 2) {
  return (P, L) => {
    for (const [ids, M] of [[EARS.L, HD.M.earL], [EARS.R, HD.M.earR]]) {
      let cx = 0; for (const i of ids) cx += P[i * 3]; const sg = Math.sign(cx) || 1, d = new THREE.Vector3(dir[0] * sg, dir[1], dir[2]).normalize();
      for (const i of ids) { const w = Math.pow(smooth(0.45, 1, M[i]), pow) * k; P[i * 3] += d.x * w; P[i * 3 + 1] += d.y * w; P[i * 3 + 2] += d.z * w; }
    }
  };
}
// Uszy przyklejone do głowy (jaszczur, szkielet)
function earShrink(k = 0.85) {
  return (P, L) => { for (const [ids, M] of [[EARS.L, HD.M.earL], [EARS.R, HD.M.earR]]) { let c = new THREE.Vector3(); for (const i of ids) c.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); c.divideScalar(ids.length); c.x *= 0.9;
    for (const i of ids) { const w = smooth(0.45, 0.8, M[i]) * k; for (let a = 0; a < 3; a++) P[i * 3 + a] += (c.getComponent(a) - P[i * 3 + a]) * w; } } };
}
// Otwarta paszcza: żuchwa obraca się wokół osi przed uszami; dolne zęby i język razem z nią
function jawOpen(angle) {
  return (P, L) => {
    const piv = new THREE.Vector3(0, L.mouth.y + 0.25, L.back + (L.mouth.z - L.back) * 0.35), low = new Set([...HD.G['helper-lower-teeth'].verts, ...HD.G['helper-tongue'].verts]);
    const ca = Math.cos(angle), sa = Math.sin(angle);
    for (let i = 0; i < HD.nV; i++) {
      const y = P[i * 3 + 1], z = P[i * 3 + 2]; let w;
      if (low.has(i)) w = 1; else if (HD.G['helper-upper-teeth'].verts.includes(i)) w = 0;
      else w = smooth(L.mouth.y + 0.015, L.mouth.y - 0.06, y) * smooth(piv.z - 0.2, piv.z + 0.5, z) * smooth(L.chin - 0.9, L.chin - 0.15, y) * (1 - 0.6 * HD.M.upper[i]);
      if (!w) continue; const a = angle * w, c = Math.cos(a), s = Math.sin(a), dy = y - piv.y, dz = z - piv.z;
      P[i * 3 + 1] = piv.y + dy * c - dz * s; P[i * 3 + 2] = piv.z + dy * s + dz * c;
    }
  };
}
// wnętrze ust (ciemne), żeby przez otwartą paszczę nie było widać tła
function mouthInside(col = '#2a0a0a') { return (root, P, L) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 })); m.position.set(0, L.mouth.y - 0.18, L.mouth.z - 0.55); m.scale.set(1.1, 0.9, 0.9); m.userData.noShadow = true; root.add(m); }; }
// Kły: tusks = z dolnej szczęki w górę (ork), fangs = z górnej w dół (wampir, demon)
function tusks(o = {}) {
  return (root, P, L) => { const lt = HD.G['helper-lower-teeth'].verts; let c = new THREE.Vector3(), mx = 0; for (const i of lt) { c.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); mx = Math.max(mx, Math.abs(P[i * 3])); } c.divideScalar(lt.length);
    for (const sg of [-1, 1]) { const len = o.len || 0.45, b = new THREE.Vector3(sg * (mx * 0.75), c.y + 0.02, c.z + 0.12), pts = [b, b.clone().add(new THREE.Vector3(sg * 0.05, len * 0.6, 0.12)), b.clone().add(new THREE.Vector3(sg * (0.1 + (o.out || 0)), len, 0.08))];
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, o.r || 0.07, 8), mat(o.col || '#e8dcb8', 'horn')); taperTube(t, o.r || 0.07, 0.008); root.add(t); } };
}
function fangs(o = {}) {
  return (root, P, L) => { const ut = HD.G['helper-upper-teeth'].verts; let c = new THREE.Vector3(), mx = 0, lo = 1e9; for (const i of ut) { c.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); mx = Math.max(mx, Math.abs(P[i * 3])); lo = Math.min(lo, P[i * 3 + 1]); } c.divideScalar(ut.length);
    for (const sg of [-1, 1]) { const m = new THREE.Mesh(new THREE.ConeGeometry(o.r || 0.035, o.len || 0.18, 8), mat('#f0e8d0', 'horn')); m.position.set(sg * mx * 0.55, lo - (o.len || 0.18) / 2 + 0.03, c.z + 0.1); m.rotation.x = Math.PI; root.add(m); } };
}
// Rogi z czoła/skroni: kształt przez punkty kontrolne w układzie (na zewnątrz, w górę, do przodu)
const HORNS = {
  demon: [[0, 0, 0], [0.25, 0.5, -0.1], [0.4, 1.0, -0.45], [0.35, 1.35, -0.95]],
  ram: [[0, 0, 0], [0.45, 0.35, -0.35], [0.8, -0.05, -0.55], [0.85, -0.5, -0.15], [0.6, -0.55, 0.25]],
  bull: [[0, 0, 0], [0.55, 0.15, 0.05], [1.0, 0.45, 0.2], [1.2, 0.95, 0.25]],
  small: [[0, 0, 0], [0.1, 0.25, -0.05], [0.15, 0.45, -0.18]],
  back: [[0, 0, 0], [0.15, 0.25, -0.4], [0.25, 0.3, -1.0], [0.3, 0.15, -1.5]],
};
function horns(o = {}) {
  return (root, P, L) => { const F = headField(P, L), shape = HORNS[o.shape || 'demon'], sc = o.size || 1;
    for (const sg of [-1, 1]) { const base = F.surf(new THREE.Vector3(sg * (o.spread ?? 0.5), 0.85, o.fwd ?? 0.45), -0.05), pts = shape.map(([x, y, z]) => base.clone().add(new THREE.Vector3(sg * x * sc, y * sc, z * sc)));
      const h = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, (o.r || 0.17) * sc, 12), mat(o.col || '#3a2a22', 'horn')); taperTube(h, (o.r || 0.17) * sc, 0.01); root.add(h);
      if (o.rings) { for (let k = 1; k < 6; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry((o.r || 0.17) * sc * (1 - k / 7), 0.015, 6, 16), mat(DK(o.col || '#3a2a22', 0.3), 'horn')); const c = h.geometry.parameters.path.getPointAt(k / 7), tg = h.geometry.parameters.path.getTangentAt(k / 7); t.position.copy(c); t.lookAt(c.clone().add(tg)); root.add(t); } } } };
}
// Czaszka (lisz): wychudzenie, wklęsły nos, głębokie oczodoły, zęby bez warg; kolor kości ustawia spec
function skullify(o = {}) {
  return (P, L) => {
    const eyeR = L.er * (o.socket || 2.0), nose = HD.M.nose, sock = new Float32Array(HD.nV);
    for (let i = 0; i < HD.nV; i++) {
      const v = new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
      for (const e of [L.eyeL, L.eyeR]) { const d = v.distanceTo(e); if (d < eyeR && v.z > e.z - L.er * 0.5) { const w = smooth(eyeR, eyeR * 0.45, d); sock[i] = Math.max(sock[i], w); v.lerp(new THREE.Vector3(e.x, e.y, e.z - L.er * 0.9), w * 0.55); } }
      const nw = smooth(0.35, 0.8, nose[i]) * (v.y < L.nose.y + 0.5 ? 1 : 0); if (nw) v.z -= nw * 0.45;
      const lw = HD.M.lips[i]; if (lw > 0.2) v.z -= lw * 0.18;
      P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
    }
    SKULL_SOCKETS = sock;
  };
}
let SKULL_SOCKETS = null;
// kolory czaszki: kość, ciemne oczodoły i nos, zabrudzenia
function skullPaint(o = {}) {
  const f = () => {}; f.paint = (c, v, i, P, L) => { const bone = col3(o.bone || '#d8ccb0'); c.copy(bone).multiplyScalar(0.85 + 0.25 * Math.sin(v.x * 9 + v.y * 7) * Math.sin(v.z * 11));
    const dark = Math.max(SKULL_SOCKETS ? SKULL_SOCKETS[i] : 0, smooth(0.35, 0.75, HD.M.nose[i]) * (v.y < L.nose.y + 0.4 ? 1 : 0), smooth(0.3, 0.7, HD.M.lips[i]) * 0.7);
    c.lerp(col3('#120c08'), Math.min(1, dark * 1.3)); }; return f;
}
// zęby wzdłuż ust (czaszka, uśmiech szkieletu)
function teethRow(o = {}) {
  return (root, P, L) => { const F = headField(P, L); for (let i = -5; i <= 5; i++) for (const up of [1, -1]) { const x = i * 0.085, p = F.sd ? null : null;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.06), mat(o.col || '#e8dcc0', 'bone')); const z = L.mouth.z - 0.12 - Math.pow(Math.abs(i) / 5, 2) * 0.45; m.position.set(x, L.mouth.y + up * 0.07, z); m.rotation.y = x * 0.9; root.add(m); } };
}
// Pysk jaszczura: dolna część twarzy wysunięta i zwężona, bez nosa i warg
function snout(k = 1.1) {
  return (P, L) => { const zc = L.back + (L.nose.z - L.back) * 0.5;
    for (let i = 0; i < HD.nV; i++) { const y = P[i * 3 + 1], z = P[i * 3 + 2]; const wf = smooth(zc, L.nose.z, z) * smooth(L.eyeY + 0.3, L.eyeY - 0.25, y) * smooth(L.chin - 0.8, L.chin - 0.1, y);
      if (!wf) continue; P[i * 3 + 2] += wf * k; P[i * 3] *= 1 - wf * 0.3; P[i * 3 + 1] += wf * (L.mouth.y - y) * 0.25; } };
}
// Grzebień kolców wzdłuż czubka głowy (jaszczur, smoczy potomek)
function crest(o = {}) {
  return (root, P, L) => { const F = headField(P, L); for (let i = 0; i < (o.n || 7); i++) { const a = -0.3 + i / ((o.n || 7) - 1) * 2.2, d = new THREE.Vector3(0, Math.cos(a), Math.sin(-a) + 0.2), b = F.surf(d, -0.05), len = (o.len || 0.6) * (1 - Math.abs(i - 2) * 0.1);
    const c = new THREE.Mesh(new THREE.ConeGeometry(o.r || 0.12, len, 6), mat(o.col || '#8a3a2a', 'horn')); c.position.copy(b).addScaledVector(d.normalize(), len * 0.4); c.lookAt(b.clone().add(d)); c.rotateX(Math.PI / 2); c.scale.z = 0.4; root.add(c); } };
}
// Kolczyki, kolczyk w nosie, znak na czole
function earrings(col = '#e0b24a', r = 0.12) {
  return (root, P, L) => { for (const [ids] of [[EARS.L], [EARS.R]]) { let lo = null; for (const i of ids) { if (!lo || P[i * 3 + 1] < lo.y) lo = new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); }
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 20), mat(col, 'gold')); t.position.copy(lo).add(new THREE.Vector3(0, -r * 0.9, 0.02)); t.rotation.y = Math.PI / 2; root.add(t); } };
}
