// ==================== MODELE 3D JEDNOSTEK (narzędzie, nie trafia do gry) ======================
// Działa w przeglądarce (Chromium z Playwrighta) razem z three.js. Buduje model jednostki z brył (szkielet stawów,
// bryły obrotowe, kapsuły, stożki), nakłada tekstury rysowane kodem (kolczuga, blacha, skóra, tkanina, drewno, futro,
// łuski, pióra), renderuje ze światłem, cieniami, odbiciami i AO, a potem zamienia na pixel art z konturem.
// Układ: jednostka patrzy w +x, góra to +y, bliższy bok (prawy, z bronią) to +z. Stopy w (0, 0, 0). 1 jednostka ≈ 0,9 m.
/* global THREE */
const G3 = {
  r: null,
  init() {
    if (this.r) return;
    const r = this.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace; r.setClearColor(0x000000, 0);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    const s = this.scene = new THREE.Scene();
    s.environment = new THREE.PMREMGenerator(r).fromScene(new THREE.RoomEnvironment(), 0.04).texture; s.environmentIntensity = 0.55;
    s.add(new THREE.HemisphereLight(0xdfe6ff, 0x5a4830, 0.95));
    const key = new THREE.DirectionalLight(0xfff0dc, 3.0); key.position.set(-1.6, 3.4, 2.6); key.castShadow = true;
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -2, near: 0.1, far: 14 }); key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
    s.add(key, key.target);
    const rim = new THREE.DirectionalLight(0xb0c4ff, 1.6); rim.position.set(2.2, 1.8, -2.8); s.add(rim);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 4, 16); this.nMat = new THREE.MeshNormalMaterial(); this.dMat = new THREE.MeshDepthMaterial();
  },
  // Render do płótna w×h pikseli; k = pikseli na jednostkę świata; stopy (0,0,0) w punkcie (ax, ay) płótna
  render(group, w, h, k, ax, ay, o = {}) {
    this.init(); const SS = 4, r = this.r, W = w * SS, H = h * SS; r.setSize(W, H, false);
    group.traverse(m => { if (m.isMesh) { m.castShadow = !m.userData.noShadow; m.receiveShadow = true; } });
    const c = this.cam, yaw = o.yaw ?? 0.38, pitch = o.pitch ?? 0.28;
    c.left = -ax / k; c.right = (w - ax) / k; c.top = ay / k; c.bottom = -(h - ay) / k; c.updateProjectionMatrix();
    c.position.set(Math.sin(yaw) * Math.cos(pitch) * 10, Math.sin(pitch) * 10, Math.cos(yaw) * Math.cos(pitch) * 10); c.lookAt(0, 0, 0);
    this.scene.add(group);
    if (!this.comp || this.comp._w !== W || this.comp._h !== H) {
      const comp = this.comp = new THREE.EffectComposer(r, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 })); comp._w = W; comp._h = H;
      const rp = new THREE.RenderPass(this.scene, c); rp.clearAlpha = 0; comp.addPass(rp);
      const ao = new THREE.GTAOPass(this.scene, c, W, H); ao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.5, thickness: 1, scale: 1.3 }); ao.blendIntensity = 0.9; comp.addPass(ao);
      comp.addPass(new THREE.OutputPass());
    }
    this.comp.render();
    const mid = document.createElement('canvas'); mid.width = w * 2; mid.height = h * 2; const mg = mid.getContext('2d'); mg.imageSmoothingQuality = 'high'; mg.drawImage(r.domElement, 0, 0, w * 2, h * 2);
    const edges = this.edgePass(w, h); this.scene.remove(group);
    const out = document.createElement('canvas'); out.width = w; out.height = h; const g = out.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(mid, 0, 0, w, h);
    inkLines(out, edges); pixelize(out, o.step || 10); disposeGroup(group); return out;
  },
  edgePass(w, h) {
    const r = this.r, s = this.scene; r.setSize(w, h, false); r.toneMapping = THREE.NoToneMapping; r.outputColorSpace = THREE.LinearSRGBColorSpace; const env = s.environment; s.environment = null;
    const grab = mt => { s.overrideMaterial = mt; r.render(s, this.cam); const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(r.domElement, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const n = grab(this.nMat), d = grab(this.dMat); s.overrideMaterial = null; s.environment = env; r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace; return { n, d };
  },
};
// Zwalnia bryły po renderze (model powstaje od nowa dla każdej klatki); wspólne materiały z pamięci MATS zostają
function disposeGroup(g) {
  const shared = new Set(MATS.values());
  g.traverse(m => { if (!m.isMesh) return; m.geometry.dispose(); if (!shared.has(m.material)) { if (m.material.map && !m.material.map._shared) m.material.map.dispose(); m.material.dispose(); } });
}
// Kontur wewnętrzny: skok głębi (linia po dalszej stronie) albo ostry załom powierzchni
function inkLines(c, E) {
  const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data, N = E.n, D = E.d, mark = new Uint8Array(w * h);
  const nrm = k => [N[k * 4] / 127.5 - 1, N[k * 4 + 1] / 127.5 - 1, N[k * 4 + 2] / 127.5 - 1];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const k = y * w + x; if (D[k * 4 + 3] < 128) continue; const a = nrm(k), da = D[k * 4];
    for (const q of [k - 1, k + 1, k - w, k + w]) { if (D[q * 4 + 3] < 128) continue; const b = nrm(q), dd = D[q * 4] - da;
      if (dd > 3) { mark[k] = 1; break; }
      if (Math.abs(dd) <= 3 && a[0] * b[0] + a[1] * b[1] + a[2] * b[2] < 0.35 && dd >= 0) { mark[k] = 2; break; } }
  }
  for (let k = 0; k < w * h; k++) if (mark[k]) { const i = k * 4, f = mark[k] === 1 ? 0.5 : 0.28; d[i] *= 1 - f; d[i + 1] *= 1 - f; d[i + 2] *= 1 - f * 0.8; }
  g.putImageData(img, 0, 0);
}
// Twarde krawędzie (bez półprzezroczystości), stopniowana paleta i ciemny obrys sylwetki
function pixelize(c, step) {
  const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data, A = new Uint8Array(w * h);
  for (let i = 0, k = 0; k < w * h; k++, i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; } const a = d[i + 3] / 255; A[k] = 1;
    for (let j = 0; j < 3; j++) d[i + j] = Math.min(255, Math.round(d[i + j] / a / step) * step); d[i + 3] = 255;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x; if (A[k]) continue;
    if ((x > 0 && A[k - 1]) || (x < w - 1 && A[k + 1]) || (y > 0 && A[k - w]) || (y < h - 1 && A[k + w])) { const i = k * 4; d[i] = 24; d[i + 1] = 16; d[i + 2] = 10; d[i + 3] = 255; } }
  g.putImageData(img, 0, 0);
}

// --- tekstury rysowane kodem: szare (mnożą kolor materiału), te same służą za mapę wypukłości ---
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TEX = {};
function tex(kind) {
  if (TEX[kind]) return TEX[kind];
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), R = rng(kind.length * 977 + kind.charCodeAt(0) * 31);
  const px = (x, y, v, a = 1) => { g.fillStyle = `rgba(${v},${v},${v},${a})`; g.fillRect(x, y, 1, 1); };
  const noise = (a, b, k = 1) => { for (let i = 0; i < N * N / 3 * k; i++) { const v = a + R() * (b - a) | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(R() * N | 0, R() * N | 0, 1 + (R() * 2 | 0), 1); } };
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, N, N);
  switch (kind) {
    case 'mail': for (let y = 0; y < N; y += 4) for (let x = (y / 4 % 2) * 2; x < N; x += 4) { g.fillStyle = '#ffffff'; g.fillRect(x, y, 3, 3); px(x + 1, y + 1, 110); } break;
    case 'plate': noise(205, 255); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(120,120,120,${0.2 + R() * 0.3})`; g.beginPath(); const x = R() * N, y = R() * N; g.moveTo(x, y); g.lineTo(x + R() * 20 - 10, y + R() * 6 - 3); g.stroke(); } break;
    case 'cloth': for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) px(x, y, 205 + ((x + y) % 2) * 25 + (R() * 20 | 0)); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(90,90,90,.18)'; g.fillRect(R() * N, 0, 2 + R() * 3, N); } break;
    case 'leather': noise(150, 255, 2); for (let x = 0; x < N; x += 6) { g.fillStyle = 'rgba(60,60,60,.5)'; g.fillRect(x, 2, 3, 1); g.fillRect(x, N - 3, 3, 1); } break;
    case 'wood': for (let y = 0; y < N; y++) { const v = 170 + Math.sin(y * 0.7 + Math.sin(y * 0.13) * 4) * 40 + R() * 20; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.fillRect(0, y, N, 1); } break;
    case 'fur': g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, N, N); for (let i = 0; i < 1600; i++) { const v = 140 + R() * 115 | 0, x = R() * N, y = R() * N; g.strokeStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 2 - 1, y + 3 + R() * 4); g.stroke(); } break;
    case 'hair': g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, N, N); for (let i = 0; i < 900; i++) { const v = 140 + R() * 115 | 0, x = R() * N; g.strokeStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, N / 3, x - 4, N * 2 / 3, x + R() * 6, N); g.stroke(); } break;
    case 'scale': for (let y = 0; y < N; y += 6) for (let x = (y / 6 % 2) * 4; x < N + 8; x += 8) { const gr = g.createRadialGradient(x, y + 2, 0, x, y + 2, 5); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.8, '#b0b0b0'); gr.addColorStop(1, '#707070'); g.fillStyle = gr; g.beginPath(); g.arc(x, y + 2, 4.5, 0, Math.PI); g.fill(); } break;
    case 'feather': g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, N, N); for (let y = 0; y < N; y += 8) for (let x = (y / 8 % 2) * 6; x < N + 12; x += 12) { g.fillStyle = '#f4f4f4'; g.beginPath(); g.ellipse(x, y + 4, 5, 8, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#9a9a9a'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 11); g.stroke(); } break;
    case 'bark': g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, N, N); for (let i = 0; i < 60; i++) { const x = R() * N; g.strokeStyle = `rgba(80,80,80,${0.4 + R() * 0.4})`; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= N; y += 16) g.lineTo(x + Math.sin(y * 0.1 + i) * 4, y); g.stroke(); } break;
    case 'stone': noise(150, 255, 3); break;
    default: noise(215, 255, 1);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (TEX[kind] = t);
}
const MATS = new Map();
const MK = { metal: [0.85, 0.34, 'plate', 0.6], mail: [0.8, 0.45, 'mail', 1.6], cloth: [0, 0.92, 'cloth', 0.6], leather: [0, 0.7, 'leather', 0.6], wood: [0, 0.8, 'wood', 0.6], skin: [0, 0.6, 'skin', 0.4],
  fur: [0, 0.95, 'fur', 0.9], hair: [0, 0.7, 'hair', 0.7], gold: [0.95, 0.28, 'plate', 0.4], bone: [0, 0.55, 'stone', 0.5], scale: [0.05, 0.5, 'scale', 1.4], feather: [0, 0.85, 'feather', 0.8], bark: [0, 0.95, 'bark', 1.5],
  stone: [0, 0.9, 'stone', 1.2], gem: [0.1, 0.1, null, 0], glow: [0, 1, null, 0], horn: [0, 0.45, 'stone', 0.3], fire: [0, 0.7, 'feather', 0.4] };
// Materiał: kolor + rodzaj (faktura, połysk). rep = gęstość faktury; glow = świeci własnym światłem
function mat(col, kind = 'cloth', rep = 1) {
  const key = col + kind + rep; let m = MATS.get(key); if (m) return m; const K = MK[kind] || MK.cloth;
  m = new THREE.MeshStandardMaterial({ color: col, metalness: K[0], roughness: K[1] });
  if (kind === 'glow') { m.emissive = new THREE.Color(col); m.emissiveIntensity = 1.6; }
  if (kind === 'gem') { m.emissive = new THREE.Color(col); m.emissiveIntensity = 0.5; }
  if (kind === 'fire') { m.emissive = new THREE.Color(col); m.emissiveIntensity = 0.55; } // ogień: świeci, ale zachowuje barwę
  if (K[2]) { const tx = tex(K[2]).clone(); tx._shared = true; tx.needsUpdate = true; tx.repeat.set(rep, rep); m.map = tx; m.bumpMap = tx; m.bumpScale = K[3]; }
  MATS.set(key, m); return m;
}
const col3 = c => new THREE.Color(c);
const DK = (hex, k = 0.25) => '#' + col3(hex).multiplyScalar(1 - k).getHexString();
const LT = (hex, k = 0.25) => '#' + col3(hex).lerp(col3('#ffffff'), k).getHexString();
// jasny kolor (świecące oczy, aureole): jasność > 0,6
const bright = hex => { const c = col3(hex); return (c.r + c.g + c.b) / 3 > 0.55; };

// --- bryły ---
function mesh(geo, col, kind, pos, rot, scl, rep) { const m = new THREE.Mesh(geo, mat(col, kind, rep)); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); return m; }
const joint = (parent, pos, rz = 0) => { const g = new THREE.Group(); if (pos) g.position.set(...pos); g.rotation.z = rz; parent.add(g); return g; };
const sph = (r, col, kind, pos, scl, seg = 20) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), col, kind, pos, null, scl);
const cap = (r, len, col, kind, pos, rot, scl) => mesh(new THREE.CapsuleGeometry(r, len, 6, 16), col, kind, pos, rot, scl);
const cyl = (r0, r1, len, col, kind, pos, rot, scl, seg = 16) => mesh(new THREE.CylinderGeometry(r1, r0, len, seg), col, kind, pos, rot, scl);
const cone = (r, len, col, kind, pos, rot, seg = 10) => mesh(new THREE.ConeGeometry(r, len, seg), col, kind, pos, rot);
const box = (w, h, d, col, kind, pos, rot) => mesh(new THREE.BoxGeometry(w, h, d), col, kind, pos, rot);
const torus = (R, r, col, kind, pos, rot, scl, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(R, r, 8, 24, arc), col, kind, pos, rot, scl);
function lathe(pts, col, kind, pos, scl, rep, fold) { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), fold ? 48 : 24); if (fold) folds(g, ...fold); return mesh(g, col, kind, pos, null, scl, rep); }
// Fałdy: promień bryły obrotowej faluje wokół osi (n fałd), mocniej niżej
function folds(geo, n = 9, k = 0.05, y0 = 1, y1 = -1) {
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), f = 1 + k * Math.sin(a * n + y * 4) * Math.min(1, Math.max(0, (y0 - y) / (y0 - y1))); p.setX(i, x * f); p.setZ(i, z * f); }
  geo.computeVertexNormals(); return geo;
}
// Kość kończyny: od stawu w dół (-y), zwężająca się, z kulą w stawie
function bone(parent, r0, r1, len, col, kind) { parent.add(cyl(r1, r0, len, col, kind, [0, -len / 2, 0], null, null, 14)); parent.add(sph(r0 * 1.02, col, kind, [0, 0, 0], null, 14)); }
// Zwężająca się rura wzdłuż krzywej (ogony, szyje, węże, macki): pts [[x,y,z],...]
function tube(pts, r0, r1, col, kind, rep = 1) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), T = 24, Rs = 10, geo = new THREE.TubeGeometry(curve, T, 1, Rs, false), p = geo.attributes.position;
  for (let i = 0; i <= T; i++) { const c = curve.getPointAt(i / T), f = r0 + (r1 - r0) * (i / T); for (let j = 0; j <= Rs; j++) { const k = i * (Rs + 1) + j; p.setXYZ(k, c.x + (p.getX(k) - c.x) * f, c.y + (p.getY(k) - c.y) * f, c.z + (p.getZ(k) - c.z) * f); } }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat(col, kind, rep));
  const g = new THREE.Group(); g.add(m); g.add(sph(r0, col, kind, pts[0], null, 12)); g.add(sph(Math.max(0.005, r1), col, kind, pts[pts.length - 1], null, 10)); return g;
}
// Płaska powłoka z obrysu (błona skrzydła, płetwa, liść): pts [[x,y],...] w płaszczyźnie xy
function sheet(pts, col, kind, pos, rot) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat(col, kind).clone());
  m.material.side = THREE.DoubleSide; if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); return m;
}
function decal(w, h, draw, pos, rot) { // płaski obrazek (herb na tarczy, tabard)
  const c = document.createElement('canvas'); c.width = 64; c.height = Math.round(64 * h / w); draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, side: THREE.DoubleSide }));
  if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); return m;
}

// Model jednostki wg look.kind (humanoid w postacie.js, zwierzęta i potwory w zwierzeta.js); null = brak modelu 3D
function buildUnit(L, P = {}) {
  const f = { hum: 'humanoid', rider: 'rider', centaur: 'centaur', wolf: 'wolf', unicorn: 'unicorn', bull: 'bull', griffin: 'griffin', bird: 'bird', phoenix: 'phoenix',
    dragon: 'dragon', hydra: 'hydra', lizard: 'lizard', insect: 'insect', eye: 'eyeBeast', ghost: 'ghost', treant: 'treant',
    ballista: 'ballista', tent: 'tent', cart: 'cart', catapult: 'catapult', tower: 'tower' }[L.kind];
  const fn = f && typeof globalThis[f] === 'function' ? globalThis[f] : null; return fn ? fn(L, P) : null;
}
// Poległy: model przewrócony na plecy (upada do tyłu), leży na ziemi
const MACHINE_KINDS = ['ballista', 'tent', 'cart', 'catapult'];
function layDead(g, L) {
  const w = new THREE.Group(); w.add(g);
  if (MACHINE_KINDS.includes(L.kind)) { g.rotation.z = 0.28; g.rotation.x = 0.12; g.position.y = -0.1; return w; } // rozbita machina: przechylona, osiadła
  g.rotation.z = 1.42; g.position.y = 0.14 * (L.size || 1); return w;
}
