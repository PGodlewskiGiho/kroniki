// ==================== PORTRETY BOHATERÓW Z MODELU 3D (narzędzie, nie trafia do gry) ================
// Działa w przeglądarce razem z three.js i modele.js (materiały, faktury). Głowa to siatka MakeHuman (CC0) z morfami:
// płeć, wiek, budowa, pochodzenie i ~180 cech twarzy (nos, usta, oczy, uszy, podbródek, kości policzkowe…).
// Do tego oczy, zęby, włosy i zarost z pasm, nakrycia głowy, stroje, rasy (elf, ork, demon, lisz, jaszczuroczłek…),
// światło jak na portretach z H3 (ciepłe z boku, kolorowy kontur od tła) i malowane tło.
// Układ jednostek MakeHuman: dm, twarz w +z, góra +y, lewa strona postaci to +x.
/* global THREE, GLOWA, mat, tex, DK, LT, col3 */

// --- dane siatki: cele (morfy) jako tablice przesunięć ---
const HD = (() => {
  const d = GLOWA, T = {};
  for (const [k, a] of Object.entries(d.targets)) {
    const n = a.length / 4, idx = new Int32Array(n), dv = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { idx[i] = a[i * 4]; dv[i * 3] = a[i * 4 + 1]; dv[i * 3 + 1] = a[i * 4 + 2]; dv[i * 3 + 2] = a[i * 4 + 3]; }
    T[k] = { idx, dv };
  }
  // nazwy cech: "nos-hump" → cel nose/nose-hump-incr|decr; cele o tej samej nazwie odróżnia kierunek: "nose-trans.up"
  const MOD = {};
  for (const g of d.mods) {
    const cnt = {}; for (const m of g.modifiers) if (m.target) cnt[m.target] = (cnt[m.target] || 0) + 1;
    for (const m of g.modifiers) if (m.target) MOD[m.target + (cnt[m.target] > 1 ? '.' + m.max : '')] = { path: g.group + '/' + m.target, min: m.min, max: m.max };
  }
  const nV = d.verts.length / 3, orig = d.orig;
  // maska obszaru z celu: siła przesunięcia 0..1 dla każdego wierzchołka
  const mask = (...names) => { const m = new Float32Array(nV); for (const n of names) { const t = T[n]; if (!t) continue; let mx = 0; const a = new Float32Array(nV);
    for (let i = 0; i < t.idx.length; i++) { const v = Math.hypot(t.dv[i * 3], t.dv[i * 3 + 1], t.dv[i * 3 + 2]); a[t.idx[i]] = v; mx = Math.max(mx, v); }
    for (let i = 0; i < nV; i++) m[i] = Math.max(m[i], a[i] / (mx || 1)); } return m; };
  const M = {
    lips: mask('mouth/mouth-upperlip-volume-incr', 'mouth/mouth-lowerlip-volume-incr'),
    upper: mask('mouth/mouth-upperlip-volume-incr'), lower: mask('mouth/mouth-lowerlip-volume-incr'),
    cheek: mask('cheek/l-cheek-volume-incr', 'cheek/r-cheek-volume-incr'), nose: mask('nose/nose-volume-incr'), noseTip: mask('nose/nose-point-width-incr'),
    brow: mask('eyebrows/eyebrows-trans-up'), eyebag: mask('eyes/l-eye-bag-incr', 'eyes/r-eye-bag-incr'),
    ear: mask('ears/l-ear-scale-incr', 'ears/r-ear-scale-incr'), chin: mask('chin/chin-prominent-incr'), jaw: mask('chin/chin-width-incr'),
    lid: mask('eyes/l-eye-height2-incr', 'eyes/r-eye-height2-incr'), temple: mask('forehead/forehead-temple-incr'), forehead: mask('forehead/forehead-scale-vert-incr'),
    earL: mask('ears/l-ear-scale-incr'), earR: mask('ears/r-ear-scale-incr'), neck: mask('neck/neck-scale-horiz-incr'),
  };
  const G = {}; for (const [g, faces] of Object.entries(d.groups)) { const s = new Set(); for (const f of faces) for (const i of f) s.add(i); G[g] = { faces, verts: [...s] }; }
  return { T, MOD, M, G, nV, orig, uvs: d.uvs, base: d.verts };
})();

// --- płeć, wiek, budowa, pochodzenie: wagi celów makro jak w MakeHuman ---
function macroWeights(s) {
  const g = s.gender ?? 0.5, a = s.age ?? 0.5, mu = s.muscle ?? 0.5, w = s.weight ?? 0.5, W = {};
  const G = { female: 1 - g, male: g };
  const A = a < 0.1875 ? { baby: 1 - a / 0.1875, child: a / 0.1875 } : a < 0.5 ? { child: (0.5 - a) / 0.3125, young: 1 - (0.5 - a) / 0.3125 } : { young: (1 - a) / 0.5, old: (a - 0.5) / 0.5 };
  const tri = (v, lo, mid, hi) => v < 0.5 ? { [lo]: (0.5 - v) * 2, [mid]: 1 - (0.5 - v) * 2 } : { [mid]: 1 - (v - 0.5) * 2, [hi]: (v - 0.5) * 2 };
  const MU = tri(mu, 'minmuscle', 'averagemuscle', 'maxmuscle'), WE = tri(w, 'minweight', 'averageweight', 'maxweight');
  const R = s.race || { caucasian: 1 }, rs = Object.values(R).reduce((x, y) => x + y, 0) || 1;
  for (const [gk, gw] of Object.entries(G)) for (const [ak, aw] of Object.entries(A)) {
    for (const [mk, mw] of Object.entries(MU)) for (const [wk, ww] of Object.entries(WE)) W[`macrodetails/universal-${gk}-${ak}-${mk}-${wk}`] = gw * aw * mw * ww;
    for (const [rk, rw] of Object.entries(R)) W[`macrodetails/${rk}-${gk}-${ak}`] = gw * aw * rw / rs;
  }
  return W;
}
// Kształt: pozycje wierzchołków po nałożeniu makro i cech twarzy (mods: { 'nose-hump': 0.5, 'eye-scale': -0.3, … })
function headShape(s) {
  const P = Float32Array.from(HD.base);
  const add = (name, w) => { const t = HD.T[name]; if (!t || !w) return; for (let i = 0; i < t.idx.length; i++) { const j = t.idx[i] * 3; P[j] += t.dv[i * 3] * w; P[j + 1] += t.dv[i * 3 + 1] * w; P[j + 2] += t.dv[i * 3 + 2] * w; } };
  for (const [k, w] of Object.entries(macroWeights(s))) add(k, w);
  const mod = (k, v) => {
    const m = HD.MOD[k];
    if (!m) { if (HD.MOD['l-' + k] || HD.MOD['l-' + k.replace(/^(\w+)/, '$1')]) { mod('l-' + k, v); mod('r-' + k, v); return; } console.warn('brak cechy ' + k); return; }
    if (!m.min) add(`${m.path}`, Math.max(0, v)); else add(`${m.path}-${v < 0 ? m.min : m.max}`, Math.abs(v));
  };
  for (const [k, v] of Object.entries(s.mods || {})) mod(k, v);
  return P;
}
// Normalne wspólne dla wierzchołków rozciętych szwem UV (ten sam wierzchołek MakeHuman)
function smoothNormals(P, faces) {
  const acc = new Map(), N = new Float32Array(P.length), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const add = (i, n) => { const o = HD.orig[i]; const v = acc.get(o) || acc.set(o, [0, 0, 0]).get(o); v[0] += n.x; v[1] += n.y; v[2] += n.z; };
  for (const f of faces) for (const [i, j, k] of [[f[0], f[1], f[2]], [f[0], f[2], f[3]]]) { if (j === k || i === k) continue;
    a.fromArray(P, i * 3); b.fromArray(P, j * 3).sub(a); c.fromArray(P, k * 3).sub(a); const n = b.cross(c); add(i, n); add(j, n); add(k, n); }
  for (const f of faces) for (const i of f) { const v = acc.get(HD.orig[i]); const l = Math.hypot(...v) || 1; N[i * 3] = v[0] / l; N[i * 3 + 1] = v[1] / l; N[i * 3 + 2] = v[2] / l; }
  return N;
}
function groupGeometry(P, g, colors) {
  const faces = HD.G[g].faces, idx = [];
  for (const f of faces) { idx.push(f[0], f[1], f[2]); if (f[3] !== f[2]) idx.push(f[0], f[2], f[3]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P.slice(), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(smoothNormals(P, faces), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from(HD.uvs), 2)); if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.setIndex(idx); return geo;
}
// Punkty charakterystyczne twarzy po morfach
function landmarks(P) {
  const V = i => new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
  const centroid = g => { const c = new THREE.Vector3(), vs = HD.G[g].verts; for (const i of vs) c.add(V(i)); return c.divideScalar(vs.length); };
  const eyeL = centroid('helper-l-eye'), eyeR = centroid('helper-r-eye'); let er = 0; for (const i of HD.G['helper-l-eye'].verts) er = Math.max(er, V(i).distanceTo(eyeL));
  const body = HD.G.body.verts; let top = -1e9, nose = null, chin = 1e9, lipsY = 0, lw = 0, back = 1e9;
  for (const i of body) { const v = V(i); if (v.y > top) top = v.y; if (Math.abs(v.x) < 0.25 && v.y < eyeL.y && v.y > eyeL.y - 1 && (!nose || v.z > nose.z)) nose = v; if (v.z < back && v.y > eyeL.y) back = v.z;
    if (HD.M.chin[i] > 0.5 && v.y < chin) chin = v.y; if (HD.M.lips[i] > 0.3) { lipsY += v.y * HD.M.lips[i]; lw += HD.M.lips[i]; } }
  const mouth = new THREE.Vector3(0, lipsY / lw, nose.z - 0.3); let mz = -1e9; for (const i of body) { const v = V(i); if (HD.M.lips[i] > 0.5 && Math.abs(v.x) < 0.1) mz = Math.max(mz, v.z); } mouth.z = mz;
  chin = 1e9; for (const i of body) { const v = V(i); if (Math.abs(v.x) < 0.3 && v.z > mz - 0.45 && v.y < mouth.y && v.y > mouth.y - 1.2) chin = Math.min(chin, v.y); } // dół podbródka (szyja jest dalej z tyłu)
  const center = new THREE.Vector3(0, (top + chin) / 2, (nose.z + back) / 2);
  return { eyeL, eyeR, er, top, nose, chin, mouth, back, center, eyeY: eyeL.y };
}

// --- skóra: kolory wierzchołków (usta, rumieńce, cienie pod oczami, piegi) ---
function hash(i, s = 0) { let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ s; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function skinColors(P, L, s) {
  const n = HD.nV, C = new Float32Array(n * 3), base = col3(s.skin || '#e0b090'), lip = col3(s.lips || '#b0544a').lerp(base, s.lipMix ?? 0.3), blush = col3(s.blush || '#d06a5a');
  const brow = col3(s.brows || s.hair || '#3a2a1a'), tmp = new THREE.Color(), M = HD.M, seed = s.seed || 1, vv = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const y = P[i * 3 + 1], z = P[i * 3 + 2]; tmp.copy(base);
    const low = Math.min(1, Math.max(0, (L.chin - y) / 1.2)); tmp.multiplyScalar(1 - 0.12 * low); // szyja w cieniu
    tmp.lerp(blush, 0.28 * M.cheek[i] * (s.flush ?? 1) + 0.22 * M.nose[i] * (s.flush ?? 1) + 0.18 * M.ear[i]);
    tmp.lerp(col3(s.eyeShadow || '#5a3a4a'), 0.3 * M.eyebag[i] * (s.tired ?? 0.6) + 0.35 * M.lid[i] * (s.paintLids ?? 0.3));
    tmp.lerp(lip, Math.min(1, Math.pow(M.lips[i], 0.6) * 1.1));
    if (s.stubble) { const beardZone = y < L.nose.y - 0.15 && y > L.chin - 0.6 && z > L.back + 1.0 && M.lips[i] < 0.4 ? Math.min(1, (L.nose.y - 0.15 - y) * 3) : 0; tmp.lerp(col3(s.hair || '#2a1a10'), beardZone * s.stubble * (0.5 + 0.2 * hash(HD.orig[i], seed))); }
    if (s.browPaint) tmp.lerp(brow, Math.max(0, M.brow[i] - 0.55) * 2.2 * s.browPaint);
    const nz = hash(HD.orig[i], seed) - 0.5; tmp.multiplyScalar(1 + nz * (s.rough ?? 0.08));
    if (s.freckles && hash(HD.orig[i], seed + 7) < 0.12 * s.freckles && M.cheek[i] + M.nose[i] > 0.2) tmp.lerp(col3('#8a4a2a'), 0.35);
    for (const f of s.parts || []) if (f.paint) { vv.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); f.paint(tmp, vv, i, P, L); }
    if (s.debugMask) { const v = HD.M[s.debugMask] ? HD.M[s.debugMask][i] : s.debugMask(i, P, L); tmp.setRGB(v, 0.2, 1 - v); }
    C[i * 3] = tmp.r; C[i * 3 + 1] = tmp.g; C[i * 3 + 2] = tmp.b;
  }
  return C;
}
function skinMaterial(s) {
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: s.oily ?? 0.48, metalness: 0, sheen: 0.2, sheenColor: new THREE.Color(s.sss || '#ff7a5a'), sheenRoughness: 0.6, specularIntensity: 0.55 });
  const t = tex('default').clone(); t._shared = false; t.needsUpdate = true; t.repeat.set(10, 10); m.bumpMap = t; m.bumpScale = 0.4;
  if (s.scales) { const sc = tex('scale').clone(); sc.needsUpdate = true; sc.repeat.set(s.scales, s.scales); m.bumpMap = sc; m.bumpScale = 2.5; }
  // miękkie przejście światła w cień (rozproszenie podpowierzchniowe w przybliżeniu): zawinięte oświetlenie rozproszone
  const chunk = THREE.ShaderChunk.lights_physical_pars_fragment, from = 'vec3 irradiance = dotNL * directLight.color;';
  if (!chunk.includes(from)) throw new Error('three.js: zmieniony shader oświetlenia');
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', chunk.replace(from,
    'float wrapNL = saturate((dot(geometryNormal, directLight.direction) + 0.25) / 1.25); vec3 irradiance = mix(vec3(wrapNL), vec3(dotNL), vec3(0.6, 0.85, 0.92)) * directLight.color;')); };
  return m;
}
// Tęczówka: ciemny brzeg, promienie, jaśniej przy źrenicy
function irisTex(col) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), k = col3(col), rgb = (m, a = 1) => `rgba(${k.r * 255 * m | 0},${k.g * 255 * m | 0},${k.b * 255 * m | 0},${a})`;
  const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, rgb(1.3)); gr.addColorStop(0.55, rgb(1)); gr.addColorStop(0.9, rgb(0.55)); gr.addColorStop(1, rgb(0.25)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; g.strokeStyle = rgb(i % 2 ? 0.7 : 1.4, 0.4); g.beginPath(); g.moveTo(32 + Math.cos(a) * 8, 32 + Math.sin(a) * 8); g.lineTo(32 + Math.cos(a) * 30, 32 + Math.sin(a) * 30); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Oko: białko, tęczówka, źrenica i szklista rogówka; patrzy w stronę dir
function eyeball(c, r, s, dir) {
  const g = new THREE.Group(); g.position.copy(c);
  const glow = s.eyeGlow;
  const white = new THREE.MeshStandardMaterial({ color: glow ? DK(s.eyeGlow, 0.35) : (s.sclera || '#b8a898'), roughness: 0.4 }); if (glow) { white.emissive = col3(s.eyeGlow); white.emissiveIntensity = 0.5; }
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), white));
  const f = new THREE.Group(); g.add(f); g.updateMatrixWorld(); f.lookAt(dir); // przód oka w +z grupy f
  const iris = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, map: irisTex(glow || s.eye || '#4a6a8a') }); if (glow) { iris.emissive = col3(glow); iris.emissiveIntensity = 2.2; }
  const ir = new THREE.Mesh(new THREE.CircleGeometry(r * (s.irisR || 0.56), 24), iris); ir.position.z = r * 0.93; f.add(ir);
  if (!glow || s.pupil) { const pu = new THREE.Mesh(s.slit ? new THREE.PlaneGeometry(r * 0.12, r * 0.7) : new THREE.CircleGeometry(r * 0.2, 16), new THREE.MeshBasicMaterial({ color: '#0a0806' })); pu.position.z = r * 0.95; f.add(pu); }
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 24, 16), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.05, clearcoat: 1, specularIntensity: 1 }));
  cornea.userData.noShadow = true; g.add(cornea);
  if (!glow) { const hl = new THREE.Mesh(new THREE.CircleGeometry(r * 0.13, 10), new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.position.set(r * 0.22 * (s.light ?? -1), r * 0.22, r * 1.04); hl.userData.noShadow = true; f.add(hl); } // odblask światła
  return g;
}

// --- scena i render portretu ---
const PR = {
  r: null,
  init() {
    if (this.r) return; const r = this.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace; r.setClearColor(0, 0); r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.env = new THREE.PMREMGenerator(r).fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  },
  // Buduje scenę z opisu s (patrz bohaterowie.js) i zwraca płótno size×size
  render(s, size = 72) {
    this.init(); const SS = 4, W = size * SS, r = this.r; r.setSize(W, W, false); PT_CUR = s;
    const scene = new THREE.Scene(); scene.environment = this.env; scene.environmentIntensity = s.envI ?? 0.12;
    const P = headShape(s); if (s.deform) s.deform(P, s);
    const L = landmarks(P); const root = new THREE.Group(); scene.add(root);
    const skin = new THREE.Mesh(groupGeometry(P, 'body', skinColors(P, L, s)), skinMaterial(s)); root.add(skin);
    const look = new THREE.Vector3(Math.sin(s.gaze ?? s.yaw ?? 0.3) * 30, L.eyeY + (s.gazeY ?? 0) * 30, 30);
    for (const [c, sg] of [[L.eyeL, 1], [L.eyeR, -1]]) root.add(eyeball(c.clone().add(new THREE.Vector3(0, 0, -L.er * 0.12)), L.er * 0.93, s, look));
    const toothM = new THREE.MeshStandardMaterial({ color: s.teeth || '#e4dac2', roughness: 0.35 });
    for (const g of ['helper-upper-teeth', 'helper-lower-teeth']) root.add(new THREE.Mesh(groupGeometry(P, g), toothM));
    root.add(new THREE.Mesh(groupGeometry(P, 'helper-tongue'), new THREE.MeshStandardMaterial({ color: '#8a3a3a', roughness: 0.4 })));
    if (!s.noLashes) { const lm = new THREE.MeshStandardMaterial({ color: s.lashes || '#1a120e', roughness: 0.8, side: THREE.DoubleSide }); for (const g of ['helper-l-eyelashes', 'helper-r-eyelashes']) root.add(new THREE.Mesh(groupGeometry(P, g), lm)); }
    // kamera: portret 3/4, twarz wypełnia kadr
    const cam = new THREE.PerspectiveCamera(s.fov ?? 16, 1, 1, 100), yaw = s.yaw ?? 0.3, pitch = s.pitch ?? 0.04, dist = s.dist ?? 13.5;
    const tgt = new THREE.Vector3(0, (L.top + (s.frameLow ?? L.chin - 0.55)) / 2 + (s.frameUp ?? 0), L.center.z);
    cam.position.set(tgt.x + Math.sin(yaw) * Math.cos(pitch) * dist, tgt.y + Math.sin(pitch) * dist, tgt.z + Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(tgt);
    const span = (L.top - (s.frameLow ?? L.chin - 0.55)) * (s.zoom ?? 1.1); cam.fov = 2 * Math.atan(span / 2 / dist) * 180 / Math.PI; cam.updateProjectionMatrix();
    L.camPos = cam.position.clone();
    for (const f of s.parts || []) f(root, P, L, s); // włosy, zarost, strój, nakrycie głowy, dodatki rasy
    root.traverse(m => { if (m.isMesh) { m.castShadow = !m.userData.noShadow; m.receiveShadow = true; } });
    // światło: ciepłe główne z boku i z góry, chłodne wypełnienie, kolorowy kontur od tła
    const side = s.light ?? -1, key = new THREE.DirectionalLight(s.keyCol || '#fff2e4', s.keyI ?? 4.6);
    key.position.set(side * (s.keyX ?? 4.8) + L.center.x, L.center.y + (s.keyY ?? 2.6), s.keyZ ?? 1.9); key.target.position.copy(L.center); key.castShadow = true;
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 }); key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.01;
    scene.add(key, key.target);
    scene.add(new THREE.HemisphereLight(s.skyCol || '#9ab0d0', s.groundCol || '#3a2a20', s.fillI ?? 0.18));
    const rim = new THREE.DirectionalLight(s.rimCol || '#a8c8ff', s.rimI ?? 3.8); rim.position.set(-side * 3 + L.center.x, L.center.y + 1.2, -3.5); rim.target.position.copy(L.center); scene.add(rim, rim.target);
    if (s.under) { const u = new THREE.PointLight(s.under, 6, 6); u.position.set(0, L.chin - 1.2, 2); scene.add(u); } // poświata z dołu (ogień, magia)
    const comp = new THREE.EffectComposer(r, new THREE.WebGLRenderTarget(W, W, { type: THREE.HalfFloatType, samples: 4 }));
    const rp = new THREE.RenderPass(scene, cam); rp.clearAlpha = 0; comp.addPass(rp);
    const ao = new THREE.GTAOPass(scene, cam, W, W); ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1, scale: 1.2 }); ao.blendIntensity = 0.8; comp.addPass(ao);
    comp.addPass(new THREE.OutputPass()); comp.render();
    const fg = document.createElement('canvas'); fg.width = fg.height = W; fg.getContext('2d').drawImage(r.domElement, 0, 0);
    comp.dispose(); ao.dispose && ao.dispose(); scene.traverse(m => { if (m.isMesh) { m.geometry.dispose(); } });
    return finishPortrait(fg, s, size);
  },
};
// Tło malowane, złożenie z postacią, zmniejszenie z wyostrzeniem i lekkim podbiciem barw
function finishPortrait(fg, s, size) {
  const W = fg.width, c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d');
  paintBackdrop(g, W, s);
  // poświata konturu: rozmyta sylwetka w kolorze tła za postacią
  g.save(); g.filter = `blur(${W / 40}px)`; g.globalAlpha = 0.22; g.globalCompositeOperation = 'lighter'; const sil = document.createElement('canvas'); sil.width = sil.height = W; const sg = sil.getContext('2d');
  sg.drawImage(fg, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = s.rimCol || '#a8c8ff'; sg.fillRect(0, 0, W, W); g.drawImage(sil, 0, 0); g.restore();
  g.drawImage(fg, 0, 0);
  if (s.raw) return c;
  let cur = c; while (cur.width > size * 2) { const n = document.createElement('canvas'); n.width = n.height = cur.width / 2; const ng = n.getContext('2d'); ng.imageSmoothingQuality = 'high'; ng.drawImage(cur, 0, 0, n.width, n.height); cur = n; }
  const out = document.createElement('canvas'); out.width = out.height = size; const og = out.getContext('2d', { willReadFrequently: true }); og.imageSmoothingQuality = 'high'; og.drawImage(cur, 0, 0, size, size);
  // wyostrzenie (maska nieostra) i nasycenie
  const img = og.getImageData(0, 0, size, size), d = img.data, src = Uint8ClampedArray.from(d), A = s.sharp ?? 0.55, SAT = s.sat ?? 1.12, CON = s.con ?? 1.12;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const k = (y * size + x) * 4;
    for (let ch = 0; ch < 3; ch++) { let sum = 0, n = 0; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue; sum += src[(yy * size + xx) * 4 + ch]; n++; }
      d[k + ch] = src[k + ch] + A * (src[k + ch] - sum / n); }
    const l = 0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2]; for (let ch = 0; ch < 3; ch++) d[k + ch] = ((l + (d[k + ch] - l) * SAT) - 128) * CON + 128; d[k + 3] = 255; }
  og.putImageData(img, 0, 0); return out;
}
// Tło jak w H3: miękkie, malowane plamy barwne (niebo, ogień, las, mury, noc, jaskinia, bagno, śnieg)
function paintBackdrop(g, W, s) {
  const B = s.bg || {}, R = (() => { let t = (s.seed || 1) * 7919 >>> 0; return () => ((t = Math.imul(t ^ t >>> 15, 0x2c1b3c6d) + 0x6d2b79f5 >>> 0) >>> 0) / 4294967296; })();
  const cols = B.cols || ['#2a3a5a', '#5a7aa0', '#c8d0d8'];
  const lg = g.createLinearGradient(0, 0, W * (B.tilt ?? 0.3), W); cols.forEach((c, i) => lg.addColorStop(i / (cols.length - 1), c)); g.fillStyle = lg; g.fillRect(0, 0, W, W);
  g.save(); g.filter = `blur(${W / 18}px)`;
  for (let i = 0; i < (B.blobs ?? 14); i++) { const c = (B.spots || cols)[R() * (B.spots || cols).length | 0]; g.globalAlpha = 0.25 + R() * 0.45; g.fillStyle = c; g.beginPath(); g.ellipse(R() * W, R() * W, W * (0.08 + R() * 0.25), W * (0.05 + R() * 0.18), R() * 3, 0, Math.PI * 2); g.fill(); }
  if (B.shapes) B.shapes(g, W, R);
  g.restore();
}
