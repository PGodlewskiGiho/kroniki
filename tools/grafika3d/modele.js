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
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.25; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const s = this.scene = new THREE.Scene();
    // Światłocień: mocne, ciepłe światło z lewej z góry, słabe wypełnienie (głębokie cienie), zimny kontur z tyłu
    // i otoczenie o dużym kontraście (jasne okna na ciemnym tle), żeby metal miał wyraźne odblaski
    s.environment = new THREE.PMREMGenerator(r).fromScene(studioEnv(), 0.02).texture; s.environmentIntensity = 0.85;
    s.add(new THREE.HemisphereLight(0xc8d4ff, 0x2a2018, 0.42));
    const key = new THREE.DirectionalLight(0xffe4c4, 4.4); key.position.set(-1.8, 3.6, 2.4); key.castShadow = true;
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -2, near: 0.1, far: 14 }); key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 2;
    s.add(key, key.target);
    const rim = new THREE.DirectionalLight(0xc0d0f0, 3.0); rim.position.set(2.4, 2.0, -2.6); s.add(rim);
    const kick = new THREE.DirectionalLight(0xffb070, 1.3); kick.position.set(-2.6, 0.8, -2.2); s.add(kick); // ciepła krawędź z drugiej strony
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
      const ao = new THREE.GTAOPass(this.scene, c, W, H); ao.updateGtaoMaterial({ radius: 0.16, distanceExponent: 1.4, thickness: 1, scale: 1.5 }); ao.blendIntensity = 1; comp.addPass(ao);
      comp.addPass(new THREE.OutputPass());
    }
    this.comp.render();
    const mid = document.createElement('canvas'); mid.width = w * 2; mid.height = h * 2; const mg = mid.getContext('2d'); mg.imageSmoothingQuality = 'high'; mg.drawImage(r.domElement, 0, 0, w * 2, h * 2);
    const marks = []; group.traverse(ob => { if (ob.name && ob.name.startsWith('fx:')) { const v = ob.getWorldPosition(new THREE.Vector3()).project(c); marks.push([ob.name.slice(3), (v.x + 1) / 2 * w, (1 - v.y) / 2 * h]); } }); // punkty efektów (dym, blask, flagi)
    let probe = null; if (o.probe) { const ob = group.getObjectByName(o.probe); if (ob) { const v = ob.getWorldPosition(new THREE.Vector3()).project(c); probe = [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h]; } } // punkt pomocniczy w pikselach klatki
    const edges = this.edgePass(w, h); this.scene.remove(group);
    const out = document.createElement('canvas'); out.width = w; out.height = h; const g = out.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(mid, 0, 0, w, h);
    inkLines(out, edges); if (o.raw || G3.raw) crisp(out); else pixelize(out, o.step || 8); /* raw: bez pikselizacji, wyostrzony */ disposeGroup(group); out._probe = probe; out._marks = marks; return out;
  },
  edgePass(w, h) {
    const r = this.r, s = this.scene; r.setSize(w, h, false); r.toneMapping = THREE.NoToneMapping; r.outputColorSpace = THREE.LinearSRGBColorSpace; const env = s.environment; s.environment = null;
    const grab = mt => { s.overrideMaterial = mt; r.render(s, this.cam); const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(r.domElement, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const n = grab(this.nMat), d = grab(this.dMat); s.overrideMaterial = null; s.environment = env; r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace; return { n, d };
  },
};
// Otoczenie do odbić: ciemne studio z dużym jasnym oknem u góry z lewej, zimnym paskiem z tyłu i ciepłą poświatą od ziemi
function studioEnv() {
  const s = new THREE.Scene(), room = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x2a2c34, side: THREE.BackSide })); s.add(room);
  const panel = (w, h, col, k, pos, look) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); if (look) m.rotateZ(look); s.add(m); };
  panel(7, 4, 0xfff0dc, 5, [-4, 7, 5]); panel(2, 9, 0xb8ccff, 3.2, [7, 3, -6], 0.2); panel(18, 18, 0x8a94a8, 0.9, [0, 9.9, 0]); panel(10, 1.2, 0xffe0c0, 2.2, [0, 9, 0]); panel(14, 5, 0x6a4a2a, 0.8, [0, -9, 2]); panel(18, 6, 0x5a6070, 0.8, [0, 1, 9.9]);
  panel(1.5, 6, 0xffffff, 2.6, [-8, 2, -2]);
  return s;
}
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
// Grafika bez pikselizacji, ale ostra (jak wyrenderowane sprite'y Heroes 3): wyostrzenie (maska wyostrzająca na kolorze),
// twardsza krawędź sylwetki (alfa przez krzywą S) i cienki, wygładzony ciemny obrys na zewnątrz
function crisp(c, amount = 0.7) {
  const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data, src = new Float32Array(d);
  const A = k => src[k * 4 + 3] / 255;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const k = y * w + x, i = k * 4; if (!d[i + 3]) continue;
    for (let j = 0; j < 3; j++) { let s = 0, n = 0; for (const q of [k - 1, k + 1, k - w, k + w]) if (src[q * 4 + 3] > 0) { s += src[q * 4 + j]; n++; }
      if (n) d[i + j] = Math.max(0, Math.min(255, src[i + j] + amount * (src[i + j] - s / n))); }
  }
  for (let k = 0; k < w * h; k++) { const i = k * 4, a = d[i + 3] / 255; if (a > 0 && a < 1) { const t = Math.min(1, Math.max(0, (a - 0.12) / 0.6)); d[i + 3] = Math.round(255 * t * t * (3 - 2 * t)); } }
  const al = Float32Array.from({ length: w * h }, (_, k) => d[k * 4 + 3] / 255);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const k = y * w + x, i = k * 4, a = al[k]; if (a > 0.98) continue;
    const m = Math.max(al[k - 1], al[k + 1], al[k - w], al[k + w], 0.7 * Math.max(al[k - w - 1], al[k - w + 1], al[k + w - 1], al[k + w + 1])), oa = m * 0.85; if (oa <= a) continue;
    const f = a / oa; d[i] = d[i] * f + 24 * (1 - f); d[i + 1] = d[i + 1] * f + 16 * (1 - f); d[i + 2] = d[i + 2] * f + 10 * (1 - f); d[i + 3] = Math.round(oa * 255); }
  g.putImageData(img, 0, 0); void A;
}
// Twarde krawędzie (bez półprzezroczystości), stopniowana paleta i ciemny obrys sylwetki
function pixelize(c, step) {
  const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data, A = new Uint8Array(w * h);
  for (let i = 0, k = 0; k < w * h; k++, i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; } A[k] = 1; // getImageData daje kolor bez mnożenia przez alfę: nie dzielimy (rozjaśniało brzegi)
    for (let j = 0; j < 3; j++) d[i + j] = Math.min(255, Math.round(d[i + j] / step) * step); d[i + 3] = 255;
  }
  // Brzeg sylwetki nie jaśniejszy od wnętrza: światło konturowe dawało jasną obwódkę wokół skrzydeł i zbroi
  const lum = i => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, src = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const k = y * w + x; if (!A[k] || (A[k - 1] && A[k + 1] && A[k - w] && A[k + w])) continue;
    let r = 0, gg = 0, b = 0, n = 0;
    for (const q of [k - 1, k + 1, k - w, k + w, k - w - 1, k - w + 1, k + w - 1, k + w + 1]) if (A[q] && A[q - 1] && A[q + 1] && A[q - w] && A[q + w]) { const j = q * 4; r += src[j]; gg += src[j + 1]; b += src[j + 2]; n++; }
    const i = k * 4; if (!n) continue; r /= n; gg /= n; b /= n;
    if (lum(i) > (r * 0.3 + gg * 0.59 + b * 0.11) * 1.12 + 6) { d[i] = Math.round(r / step) * step; d[i + 1] = Math.round(gg / step) * step; d[i + 2] = Math.round(b / step) * step; } }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x; if (A[k]) continue;
    if ((x > 0 && A[k - 1]) || (x < w - 1 && A[k + 1]) || (y > 0 && A[k - w]) || (y < h - 1 && A[k + w])) { const i = k * 4; d[i] = 24; d[i + 1] = 16; d[i + 2] = 10; d[i + 3] = 255; } }
  g.putImageData(img, 0, 0);
}

// --- tekstury rysowane kodem: szare (mnożą kolor materiału), te same służą za mapę wypukłości ---
// 256 px: kolczuga z kółek, blacha z rysami i wgnieceniami, przeszywanica, tkanina z splotem i plamami, skóra z przeszyciami,
// drewno ze słojami i sękami, futro, włosy, łuski z krawędziami, pióra z promieniami, kora, kamień z pęknięciami,
// skóra ciała z porami, skóra demona (spękana), kość, róg z pierścieniami
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TEX = {};
function tex(kind) {
  if (TEX[kind]) return TEX[kind];
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), R = rng(kind.length * 977 + kind.charCodeAt(0) * 31);
  const grey = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
  const noise = (a, b, k = 1, sz = 2) => { for (let i = 0; i < N * N / 3 * k; i++) { g.fillStyle = grey(a + R() * (b - a)); g.fillRect(R() * N | 0, R() * N | 0, 1 + (R() * sz | 0), 1); } };
  const blotch = (n, r0, r1, a0, a1, dark = true) => { for (let i = 0; i < n; i++) { const x = R() * N, y = R() * N, r = r0 + R() * (r1 - r0), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, dark ? `rgba(0,0,0,${a0 + R() * (a1 - a0)})` : `rgba(255,255,255,${a0 + R() * (a1 - a0)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } };
  const crack = (n, len, a, w = 1) => { for (let i = 0; i < n; i++) { let x = R() * N, y = R() * N, ang = R() * Math.PI * 2; g.strokeStyle = `rgba(20,20,20,${a})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < len; k++) { ang += (R() - 0.5) * 1.2; x += Math.cos(ang) * 5; y += Math.sin(ang) * 5; g.lineTo(x, y); } g.stroke(); } };
  const scratch = (n, len, a) => { for (let i = 0; i < n; i++) { const x = R() * N, y = R() * N, ang = (R() - 0.5) * 0.8, l = len * (0.3 + R()); g.strokeStyle = R() < 0.5 ? `rgba(40,40,40,${a})` : `rgba(255,255,255,${a * 1.2})`; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l); g.stroke(); } };
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, N, N);
  switch (kind) {
    case 'mail': g.fillStyle = '#505050'; g.fillRect(0, 0, N, N); for (let y = 0; y < N + 6; y += 5) for (let x = (y / 5 % 2) * 3; x < N + 6; x += 6) { g.strokeStyle = '#d8d8d8'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, 2.6, Math.PI, Math.PI * 2.2); g.stroke(); g.strokeStyle = '#8a8a8a'; g.beginPath(); g.arc(x, y, 2.6, Math.PI * 0.2, Math.PI); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 3, 1, 1); } blotch(20, 10, 30, 0.1, 0.3); break;
    case 'plate': noise(215, 250, 1); for (let y = 0; y < N; y++) { g.fillStyle = grey(200 + R() * 40, 0.25); g.fillRect(0, y, N, 1); } scratch(160, 22, 0.35); blotch(14, 6, 18, 0.12, 0.3); blotch(10, 8, 20, 0.15, 0.35, false);
      for (let i = 0; i < 26; i++) { const x = R() * N, y = R() * N, gr = g.createRadialGradient(x - 1, y - 1, 0, x, y, 3); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#9a9a9a'); gr.addColorStop(1, 'rgba(60,60,60,0)'); g.fillStyle = gr; g.fillRect(x - 3, y - 3, 6, 6); } break; // nity
    case 'quilt': noise(200, 240, 1); g.strokeStyle = 'rgba(70,70,70,.7)'; g.lineWidth = 1.5; for (let k = -N; k < N * 2; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + N, N); g.stroke(); g.beginPath(); g.moveTo(k, N); g.lineTo(k + N, 0); g.stroke(); }
      for (let y = 0; y < N; y += 16) for (let x = 0; x < N; x += 16) { const gr = g.createRadialGradient(x + 8, y, 0, x + 8, y, 7); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y - 8, 16, 16); } blotch(10, 12, 30, 0.1, 0.25); break;
    case 'cloth': for (let y = 0; y < N; y++) for (let x = 0; x < N; x += 2) { g.fillStyle = grey(200 + ((x / 2 + y) % 2) * 28 + R() * 18); g.fillRect(x, y, 2, 1); } for (let i = 0; i < 24; i++) { g.fillStyle = 'rgba(80,80,80,.16)'; g.fillRect(R() * N, 0, 2 + R() * 5, N); } blotch(16, 10, 34, 0.08, 0.22); scratch(40, 6, 0.2); break;
    case 'leather': noise(150, 250, 2.5); blotch(30, 8, 28, 0.1, 0.3); blotch(14, 6, 20, 0.1, 0.25, false); crack(30, 5, 0.3);
      g.strokeStyle = 'rgba(40,40,40,.7)'; g.setLineDash([3, 3]); for (const y of [4, N - 5, N / 2]) { g.beginPath(); g.moveTo(0, y); g.lineTo(N, y); g.stroke(); } g.setLineDash([]); break;
    case 'wood': for (let y = 0; y < N; y++) { const v = 165 + Math.sin(y * 0.55 + Math.sin(y * 0.09) * 5) * 42 + R() * 22; g.fillStyle = grey(v); g.fillRect(0, y, N, 1); }
      for (let i = 0; i < 4; i++) { const x = R() * N, y = R() * N; g.strokeStyle = 'rgba(40,40,40,.5)'; for (let r = 2; r < 12; r += 3) { g.beginPath(); g.ellipse(x, y, r * 2.2, r * 0.8, 0, 0, Math.PI * 2); g.stroke(); } } crack(12, 8, 0.4); break;
    case 'fur': g.fillStyle = '#bcbcbc'; g.fillRect(0, 0, N, N); for (let i = 0; i < 7000; i++) { const v = 110 + R() * 145, x = R() * N, y = R() * N, l = 4 + R() * 7; g.strokeStyle = grey(v); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + R() * 3 - 1.5, y + l / 2, x + R() * 4 - 2, y + l); g.stroke(); } blotch(20, 10, 30, 0.1, 0.25); break;
    case 'hair': g.fillStyle = '#a8a8a8'; g.fillRect(0, 0, N, N); for (let i = 0; i < 2200; i++) { const v = 110 + R() * 145, x = R() * N; g.strokeStyle = grey(v); g.lineWidth = 0.8 + R(); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, N / 3, x - 6, N * 2 / 3, x + R() * 8, N); g.stroke(); } break;
    case 'scale': g.fillStyle = '#404040'; g.fillRect(0, 0, N, N); for (let y = -6; y < N + 8; y += 9) for (let x = ((y + 6) / 9 % 2) * 6; x < N + 12; x += 12) { const gr = g.createRadialGradient(x - 1, y - 1, 0, x, y + 2, 7.5); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#c0c0c0'); gr.addColorStop(0.9, '#707070'); gr.addColorStop(1, '#303030'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 6.5, y - 2); g.quadraticCurveTo(x - 6, y + 7, x, y + 9); g.quadraticCurveTo(x + 6, y + 7, x + 6.5, y - 2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 6); g.stroke(); } blotch(12, 10, 30, 0.1, 0.25); break;
    case 'feather': g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, N, N); for (let y = -8; y < N + 16; y += 12) for (let x = ((y + 8) / 12 % 2) * 9; x < N + 18; x += 18) { g.fillStyle = '#f0f0f0'; g.beginPath(); g.ellipse(x, y + 6, 8, 13, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#8a8a8a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x, y + 18); g.stroke(); g.lineWidth = 0.5; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(x, y + k * 2); g.lineTo(x - 7, y + k * 2 + 5); g.moveTo(x, y + k * 2); g.lineTo(x + 7, y + k * 2 + 5); g.stroke(); } } break;
    case 'bark': g.fillStyle = '#b0b0b0'; g.fillRect(0, 0, N, N); for (let i = 0; i < 110; i++) { const x = R() * N; g.strokeStyle = `rgba(50,50,50,${0.4 + R() * 0.5})`; g.lineWidth = 1 + R() * 3.5; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= N; y += 12) g.lineTo(x + Math.sin(y * 0.08 + i) * 6, y); g.stroke(); } blotch(20, 10, 30, 0.15, 0.35); crack(20, 6, 0.5); break;
    case 'stone': noise(140, 250, 3); blotch(24, 8, 30, 0.12, 0.35); blotch(12, 8, 20, 0.1, 0.3, false); crack(18, 9, 0.6, 1.4); break;
    case 'skin': noise(220, 250, 1.2, 1); blotch(30, 6, 24, 0.05, 0.14); blotch(20, 5, 14, 0.06, 0.14, false); for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(90,90,90,.35)'; g.fillRect(R() * N, R() * N, 1, 1); } break;
    case 'hide': noise(180, 240, 1.5); blotch(30, 8, 26, 0.12, 0.3); crack(70, 7, 0.55, 1.2); crack(40, 4, 0.35); blotch(16, 6, 16, 0.12, 0.3, false); break;
    case 'wrap': noise(200, 240, 1); for (let y = 0; y < N; y += 9) { const a = (R() - 0.5) * 0.5; g.save(); g.translate(0, y); g.rotate(a); g.fillStyle = 'rgba(60,60,60,.55)'; g.fillRect(-20, 0, N + 40, 1.5); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-20, 2, N + 40, 1); g.restore(); } blotch(24, 8, 26, 0.12, 0.35); break; // bandaże mumii
    case 'bone': noise(200, 250, 1.4); blotch(24, 8, 26, 0.1, 0.28); crack(24, 6, 0.4); for (let y = 0; y < N; y += 3) { g.fillStyle = 'rgba(120,120,120,.12)'; g.fillRect(0, y, N, 1); } break;
    case 'horn': for (let y = 0; y < N; y++) { const v = 190 + Math.sin(y * 0.9) * 30 + (y % 16 < 2 ? -60 : 0) + R() * 18; g.fillStyle = grey(v); g.fillRect(0, y, N, 1); } scratch(60, 10, 0.3); break; // pierścienie rogu
    default: noise(210, 255, 1);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return (TEX[kind] = t);
}
const MATS = new Map();
// rodzaj: [metaliczność, szorstkość, faktura, siła wypukłości, gęstość faktury]
const MK = { metal: [0.8, 0.36, 'plate', 0.9], steel: [0.85, 0.27, 'plate', 0.6], iron: [0.75, 0.5, 'plate', 1.4], mail: [0.85, 0.42, 'mail', 2.2, 2], cloth: [0, 0.9, 'cloth', 0.9], quilt: [0, 0.88, 'quilt', 2.4],
  leather: [0, 0.62, 'leather', 1.2], wood: [0, 0.75, 'wood', 1.1], skin: [0, 0.55, 'skin', 0.6], hide: [0, 0.6, 'hide', 2.2], fur: [0, 0.95, 'fur', 1.4, 1.5], hair: [0, 0.6, 'hair', 1.1],
  gold: [0.95, 0.24, 'plate', 0.5], bone: [0, 0.55, 'bone', 1.2], scale: [0.15, 0.4, 'scale', 2.4, 3], feather: [0, 0.8, 'feather', 1.2], bark: [0, 0.95, 'bark', 2.6, 1.5],
  stone: [0, 0.85, 'stone', 2.2], wrap: [0, 0.9, 'wrap', 2], gem: [0.1, 0.08, null, 0], glow: [0, 1, null, 0], horn: [0.05, 0.38, 'horn', 1.2], fire: [0, 0.7, 'feather', 0.4] };
// Materiał: kolor + rodzaj (faktura, połysk). rep = gęstość faktury; glow = świeci własnym światłem
function mat(col, kind = 'cloth', rep = 1) {
  const key = col + kind + rep; let m = MATS.get(key); if (m) return m; const K = MK[kind] || MK.cloth;
  m = new THREE.MeshStandardMaterial({ color: col, metalness: K[0], roughness: K[1] });
  if (kind === 'glow') { m.emissive = new THREE.Color(col); m.emissiveIntensity = 1.8; }
  if (kind === 'gem') { m.emissive = new THREE.Color(col); m.emissiveIntensity = 0.6; }
  if (kind === 'fire') { m.emissive = new THREE.Color(col); m.emissiveIntensity = 0.75; m.toneMapped = true; } // ogień: świeci, ale zachowuje barwę
  if (K[2]) { const tx = tex(K[2]).clone(); tx._shared = true; tx.needsUpdate = true; tx.repeat.set(rep * (K[4] || 1), rep * (K[4] || 1)); m.map = tx; m.bumpMap = tx; m.bumpScale = K[3]; if (K[0] > 0.5) m.roughnessMap = tx; }
  MATS.set(key, m); return m;
}
const col3 = c => new THREE.Color(c);
const DK = (hex, k = 0.25) => '#' + col3(hex).multiplyScalar(1 - k).getHexString();
const LT = (hex, k = 0.25) => '#' + col3(hex).lerp(col3('#ffffff'), k).getHexString();
// jasny kolor (świecące oczy, aureole): jasność > 0,6
const bright = hex => { const c = col3(hex); return (c.r + c.g + c.b) / 3 > 0.55; };
// Kępa liści namalowana na kanwie (jak na tle AI): falista sylwetka z płatów wypełniona setkami pociągnięć pędzla; każdy płat jasny i ciepły u góry,
// ciemny i chłodny u dołu. Korona = kilka takich kart zwróconych do kamery (widok miasta jest stały), w warstwach, więc ma głębię i rzuca cień.
const LEAF_SPR = new Map();
function leafSprite(col, v, fl = null) {
  const key = col + v + (fl || ''); if (LEAF_SPR.has(key)) return LEAF_SPR.get(key);
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), R = rng(v * 7919 + 13), base = new THREE.Color(col);
  const lobes = []; for (let i = 0; i < 16; i++) { const a = R() * Math.PI * 2, q = Math.sqrt(R()); lobes.push([128 + Math.cos(a) * q * 70, 140 + Math.sin(a) * q * 44 - (1 - q) * 14, 26 + R() * 22]); }
  lobes.sort((a, b) => a[1] - b[1]);
  const shade = t => { const k = 0.38 + 0.68 * t, c2 = base.clone().multiplyScalar(k); if (t < 0.45) c2.lerp(new THREE.Color('#1c3438'), (0.45 - t) * 0.7); else c2.lerp(new THREE.Color('#f0e890'), (t - 0.45) * 0.28); return `rgb(${Math.min(255, c2.r * 255) | 0},${Math.min(255, c2.g * 255) | 0},${Math.min(255, c2.b * 255) | 0})`; };
  for (const [lx, ly, lr] of lobes) { /* najpierw ciemny podkład płatu, potem pociągnięcia od cienia do światła */
    g.fillStyle = shade(0.05); g.beginPath(); g.ellipse(lx, ly + lr * 0.08, lr, lr * 0.82, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.85; for (let k = 0; k < 150; k++) { const a = R() * Math.PI * 2, q = Math.sqrt(R()) * 0.95, x = lx + Math.cos(a) * q * lr, y = ly + Math.sin(a) * q * lr * 0.8, t = Math.min(1, Math.max(0, 0.5 - (y - ly) / lr * 0.75 - (x - lx) / lr * 0.25 + (R() - 0.5) * 0.35));
      g.fillStyle = shade(t); g.beginPath(); g.ellipse(x, y, 2.5 + R() * 4, 1.8 + R() * 2.4, R() * Math.PI, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }
  for (let k = 0; k < 160; k++) { const L = lobes[R() * lobes.length | 0], a = -Math.PI * R(), x = L[0] + Math.cos(a) * L[2] * (0.95 + R() * 0.2), y = L[1] + Math.sin(a) * L[2] * 0.8 * (0.95 + R() * 0.2); /* listki wystające z obrysu */
    g.fillStyle = shade(0.55 + R() * 0.4); g.beginPath(); g.ellipse(x, y, 2 + R() * 3, 1.5 + R() * 2, R() * Math.PI, 0, Math.PI * 2); g.fill(); }
  if (fl) for (let k = 0; k < 32; k++) { const L = lobes[R() * lobes.length | 0], a = R() * Math.PI * 2, q = Math.sqrt(R()) * 0.85, x = L[0] + Math.cos(a) * q * L[2], y = L[1] + Math.sin(a) * q * L[2] * 0.8 - L[2] * 0.15; /* kwiaty namalowane w liściach: drobne plamki, jaśniejsze w świetle */
    g.fillStyle = k % 4 ? fl : '#fff8ec'; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(x, y, 1.6 + R() * 1.8, 1.3 + R() * 1.3, R() * Math.PI, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; LEAF_SPR.set(key, t); return t;
}
// Kępa liści jako karta obracana do kamery przed każdym renderem (jak duszek, ale z normalną, więc światło i cienie kontaktowe działają):
// liście stworzeń (drzewce) wyglądają tak samo z każdej strony, także w bitwie, gdy jednostka się obraca
const _lcQ = new THREE.Quaternion();
function leafClump(r, col, pos, v = 0, fl = null) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.6, r * 2.6), new THREE.MeshStandardMaterial({ map: leafSprite(LT(col, 0.28), ((v % 6) + 6) % 6, fl), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, metalness: 0 }));
  m.position.set(...pos); m.userData.noShadow = true;
  m.onBeforeRender = (r2, sc, cam) => { m.parent.getWorldQuaternion(_lcQ); m.quaternion.copy(_lcQ.invert().multiply(cam.quaternion)); m.updateMatrixWorld(true); };
  return m;
}

// --- bryły ---
function mesh(geo, col, kind, pos, rot, scl, rep) { const m = new THREE.Mesh(geo, mat(col, kind, rep)); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); return m; }
const joint = (parent, pos, rz = 0) => { const g = new THREE.Group(); if (pos) g.position.set(...pos); g.rotation.z = rz; parent.add(g); return g; };
const sph = (r, col, kind, pos, scl, seg = 20) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), col, kind, pos, null, scl);
const cap = (r, len, col, kind, pos, rot, scl) => mesh(new THREE.CapsuleGeometry(r, len, 6, 16), col, kind, pos, rot, scl);
const cyl = (r0, r1, len, col, kind, pos, rot, scl, seg = 16) => mesh(new THREE.CylinderGeometry(r1, r0, len, seg), col, kind, pos, rot, scl);
const cone = (r, len, col, kind, pos, rot, seg = 10) => mesh(new THREE.ConeGeometry(r, len, seg), col, kind, pos, rot);
// Czaszka (ozdoba broni, zbroi, rzędu): puszka, oczodoły, szczęka z zębami; twarzą w +x
const skullOn = (parent, pos, s = 1, col = '#e8e2cc', rot = null) => { const g = new THREE.Group(); g.position.set(...pos); if (rot) g.rotation.set(...rot); g.scale.setScalar(s); parent.add(g);
  g.add(sph(0.05, col, 'bone', [0, 0.01, 0], [1.05, 1, 0.9])); g.add(rbox(0.05, 0.035, 0.06, 0.012, col, 'bone', [0.022, -0.035, 0]));
  for (const z of [-0.018, 0.018]) g.add(sph(0.013, '#120c0c', 'skin', [0.042, 0.008, z])); g.add(box(0.008, 0.012, 0.03, '#120c0c', 'skin', [0.05, -0.02, 0])); return g; };
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
// Płaska bryła z obrysu z fazowanymi krawędziami (ostrza, płyty zbroi, kolce, pióra): pts w płaszczyźnie xy, grubość d
function slab(pts, d, col, kind, pos, rot, scl, bev = 0.35) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: d * bev, bevelSize: d * bev, bevelSegments: 1, curveSegments: 4 });
  geo.translate(0, 0, -d / 2); geo.computeVertexNormals(); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 2);
  return mesh(geo, col, kind, pos, rot, scl);
}
// Prostopadłościan z zaokrąglonymi krawędziami: płyty i bloki łapią na krawędziach światło
const rbox = (w, h, d, r, col, kind, pos, rot, scl) => mesh(new THREE.RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999), col, kind, pos, rot, scl);
// Kolec: czworościenny ostry stożek; ostrze w kierunku +y
const spike = (r, len, col, kind, pos, rot) => cone(r, len, col, kind, pos, rot, 4);
// Nieregularna bryła (kamień, kryształ, bryła golema) z losowych punktów na elipsoidzie
function chunk(rx, ry, rz, col, kind, pos, rot, seed = 1, n = 14) {
  const R = rng(seed * 7919), pts = []; for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, q = Math.sqrt(1 - u * u); pts.push(new THREE.Vector3(Math.cos(a) * q * rx, u * ry, Math.sin(a) * q * rz)); }
  for (const s of [-1, 1]) pts.push(new THREE.Vector3(0, s * ry, 0), new THREE.Vector3(s * rx, 0, 0), new THREE.Vector3(0, 0, s * rz));
  const geo = new THREE.ConvexGeometry(pts), p = geo.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) + p.getZ(i); uv[i * 2 + 1] = p.getY(i); }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return mesh(geo, col, kind, pos, rot);
}
// Bryła z przekrojów (tułowia zwierząt i postaci) zamiast kapsuł i kul: przekrój to kanciasty 12-kąt z grzbietem u góry
// i kilem u dołu, więc sylwetka ma kręgosłup, głęboką klatkę i wciętą talię. secs: [[położenie na osi, pół-szerokość,
// wysokość w górę, w dół, grzbiet]]. Oś 'x' (czworonogi: góra = +y) albo 'y' (tułów postaci: 'w górę' = przód +x, 'w dół' = tył).
const LOFT_P = [[0, 1], [0.5, 0.93], [0.86, 0.62], [1, 0.08], [0.9, -0.48], [0.56, -0.88], [0, -1], [-0.56, -0.88], [-0.9, -0.48], [-1, 0.08], [-0.86, 0.62], [-0.5, 0.93]];
function loft(secs, col, kind, axis = 'x', pos, rot, rep) {
  const S = [], cr = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let i = 0; i < secs.length - 1; i++) for (let k = 0; k < 3; k++) { const a = secs[Math.max(0, i - 1)], b = secs[i], c = secs[i + 1], d = secs[Math.min(secs.length - 1, i + 2)]; S.push(b.map((_, j) => cr(a[j] || 0, b[j] || 0, c[j] || 0, d[j] || 0, k / 3))); }
  S.push(secs[secs.length - 1].map(v => v || 0));
  const P = LOFT_P, n = P.length, pos3 = [], uv = [], idx = [], vert = (s, u, v) => { const [p, w, top, bot, ridge] = s, h = v >= 0 ? v * top * (1 + (u === 0 ? ridge || 0 : 0)) : v * bot; return axis === 'x' ? [p, h, u * w] : [h, p, u * w]; };
  S.forEach((s, i) => P.forEach(([u, v], j) => { pos3.push(...vert(s, u, v)); uv.push(j / n * 2, i / (S.length - 1) * 2); }));
  for (let i = 0; i < S.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * n + j, b = i * n + (j + 1) % n, c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
  for (const [i, first] of [[0, true], [S.length - 1, false]]) { const s = S[i], ci = pos3.length / 3, cy = (s[2] - s[3]) / 2; pos3.push(...(axis === 'x' ? [s[0], cy, 0] : [cy, s[0], 0])); uv.push(0.5, 0.5); for (let j = 0; j < n; j++) { const a = i * n + j, b = i * n + (j + 1) % n; if (first) idx.push(ci, a, b); else idx.push(ci, b, a); } }
  if (axis === 'x') for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]]; // oś x: zamiana osi odwraca kierunek ścianek
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return mesh(g, col, kind, pos, rot, null, rep);
}
// Punkt pomocniczy bez bryły (np. paszcza do zionięcia): wypalanie odczytuje jego położenie w klatce
const marker = (parent, name, pos) => { const o = new THREE.Object3D(); o.name = name; o.position.set(...pos); parent.add(o); return o; };
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
  const fn = L.golem ? globalThis.golem : L.beast ? globalThis[L.beast] : L.biped ? globalThis.humanoid : f && typeof globalThis[f] === 'function' ? globalThis[f] : null; return fn ? fn(L, P) : null;
}
// Poległy: model przewrócony na plecy (upada do tyłu), leży na ziemi
const MACHINE_KINDS = ['ballista', 'tent', 'cart', 'catapult'];
function layDead(g, L) {
  const w = new THREE.Group(); w.add(g);
  if (MACHINE_KINDS.includes(L.kind)) { g.rotation.z = 0.28; g.rotation.x = 0.12; g.position.y = -0.1; return w; } // rozbita machina: przechylona, osiadła
  g.rotation.z = 1.42; g.position.y = 0.14 * (L.size || 1); return w;
}
