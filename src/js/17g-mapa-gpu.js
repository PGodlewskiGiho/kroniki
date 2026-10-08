// ==================== MAPA PRZYGODY NA KARCIE GRAFICZNEJ (WebGL) ===========================
// Świat mapy (teren, droga bohatera, obiekty, bohaterowie, dym, mgła wojny, światło) rysuje ten sam kod co dotąd
// (drawWorldPixel), ale zamiast płótna procesora dostaje kontekst GLCtx: każde drawImage / fillRect / koło staje się
// prostokątem z teksturą, składanym przez kartę graficzną. Obrazki (kawałki terenu, sprite'y, mgła) trafiają na kartę raz
// i tam zostają, więc klatka to kilkaset tanich prostokątów zamiast przepisywania milionów pikseli przez procesor.
// Fale na wodzie liczy shader (wzór fal × maska głębi, piana × maska brzegu) – dawniej składane w płótnie dla każdego kawałka.
// Gotowy obraz trafia do płótna gry jednym drawImage (jak dawny bufor świata). Bez WebGL, w trybie pikseli albo po
// wybraniu w ustawieniach „procesor” – dawne rysowanie (drawMapView sprawdza GLMap.use()).
const GLMap = {
  ok: null, canvas: null, gl: null, frame: 0, tex: new Map(), bytes: 0, BUDGET: 192 * 1024 * 1024, stats: { quads: 0, draws: 0, uploads: 0 },
  // Tryb rysowania mapy (G.settings.renderer): 'auto' (domyślnie) – karta graficzna, jeśli przeglądarka ma sprzętowy WebGL;
  // 'gl' – zawsze WebGL (także programowy); 'cpu' – dawne rysowanie procesorem. Programowy WebGL (SwiftShader, llvmpipe:
  // przeglądarka bez sterownika karty) liczy obraz procesorem wolniej niż płótno 2D, więc „auto” go nie wybiera.
  use() { const m = G.settings.renderer || 'auto'; if (PIXEL_ART || m === 'cpu') return false; if (this.ok === null) this.init(); return !!this.ok && (m === 'gl' || this.hw); },
  mode() { return this.use() ? 'karta graficzna (WebGL)' : 'procesor (płótno 2D)'; },
  init() {
    try {
      const c = document.createElement('canvas'), o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
      const gl = c.getContext('webgl', o) || c.getContext('experimental-webgl', o); if (!gl) return (this.ok = false);
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; this.tex.clear(); this.bytes = 0; G.dirty = true; }); // utrata kontekstu: dalej rysuje procesor
      const ext = gl.getExtension('WEBGL_debug_renderer_info'), name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      this.hw = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name); this.name = name;
      this.canvas = c; this.gl = gl; this.setup(gl); return (this.ok = true);
    } catch (e) { return (this.ok = false); }
  },
  setup(gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = (vs, fs, attrs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
    // zwykłe prostokąty: pozycja w pikselach płótna, współrzędne tekstury, barwa (z alfą, przemnożona)
    this.pQuad = prog(`attribute vec2 aP; attribute vec2 aT; attribute vec4 aC; uniform vec2 uR; varying vec2 vT; varying vec4 vC;
      void main() { gl_Position = vec4(aP.x / uR.x * 2.0 - 1.0, 1.0 - aP.y / uR.y * 2.0, 0.0, 1.0); vT = aT; vC = aC; }`,
    `precision mediump float; uniform sampler2D uTex; varying vec2 vT; varying vec4 vC; void main() { gl_FragColor = texture2D(uTex, vT) * vC; }`, ['aP', 'aT', 'aC']);
    // woda: dwie warstwy wzoru fal (przesuwane w przeciwne strony) w masce głębi i pulsująca piana w masce brzegu (jak WaterFx.draw)
    this.pWater = prog(`attribute vec2 aP; attribute vec2 aT; uniform vec2 uR; varying vec2 vT;
      void main() { gl_Position = vec4(aP.x / uR.x * 2.0 - 1.0, 1.0 - aP.y / uR.y * 2.0, 0.0, 1.0); vT = aT; }`,
    `precision mediump float; uniform sampler2D uPat, uDeep, uShore; uniform vec2 uW, uO1, uO2; uniform float uS; uniform vec3 uA; uniform vec4 uFoam; varying vec2 vT;
      void main() { vec2 q = vT * uS + uW; vec4 c1 = texture2D(uPat, fract((q - uO1) / 48.0)) * uA.x, c2 = texture2D(uPat, fract((q - uO2) / 48.0)) * uA.y;
        vec4 w = c2 + c1 * (1.0 - c2.a); gl_FragColor = (w * texture2D(uDeep, vT).a + uFoam * texture2D(uShore, vT).a) * uA.z; }`, ['aP', 'aT']);
    this.uR = gl.getUniformLocation(this.pQuad, 'uR'); this.uTex = gl.getUniformLocation(this.pQuad, 'uTex');
    this.uw = {}; for (const k of ['uR', 'uPat', 'uDeep', 'uShore', 'uW', 'uO1', 'uO2', 'uS', 'uA', 'uFoam']) this.uw[k] = gl.getUniformLocation(this.pWater, k);
    this.vbo = gl.createBuffer(); this.N = 4096; this.buf = new Float32Array(this.N * 6 * 8); this.n = 0; this.cur = null; this.add = false;
    // stałe obrazki: biały piksel (prostokąty w kolorze), miękkie koło (dym, iskry, dołki) i pierścień (podświetlenie)
    const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; };
    this.white = mk(2, 2, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); });
    this.disc = mk(64, 64, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 31, 0, TAU); g.fill(); });
    this.ring = mk(128, 128, g => { g.strokeStyle = '#fff'; g.lineWidth = 7; g.shadowColor = '#fff'; g.shadowBlur = 10; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke(); });
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  },
  // Tekstura obrazka: raz wgrana zostaje na karcie; płótna robocze (pixBuf, np. sylwetki zasłoniętych obiektów) wgrywane przy każdym użyciu
  texOf(img) {
    const gl = this.gl; let r = this.tex.get(img); const dyn = !!img._ctx;
    if (r && !dyn) { r.used = this.frame; return r.t; }
    if (!r) { r = { t: gl.createTexture(), b: 0, used: this.frame }; this.tex.set(img, r); gl.bindTexture(gl.TEXTURE_2D, r.t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
    else { this.flush(); gl.bindTexture(gl.TEXTURE_2D, r.t); }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); this.stats.uploads++;
    const b = (img.width || 1) * (img.height || 1) * 4; this.bytes += b - r.b; r.b = b; r.used = this.frame; return r.t;
  },
  // Obrazki nieużywane od dawna wypadają z karty (kawałki terenu daleko od kamery wrócą przy powrocie, w ~1 ms każdy)
  evict() {
    if (this.bytes <= this.BUDGET && this.frame % 300) return; const gl = this.gl, old = [...this.tex].filter(([, r]) => r.used < this.frame - 2).sort((a, b) => a[1].used - b[1].used);
    for (const [k, r] of old) { if (this.bytes <= this.BUDGET * 0.75 && r.used > this.frame - 900) break; gl.deleteTexture(r.t); this.bytes -= r.b; this.tex.delete(k); }
  },
  flush() {
    if (!this.n) return; const gl = this.gl; gl.useProgram(this.pQuad); gl.uniform2f(this.uR, this.W, this.H); gl.uniform1i(this.uTex, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.cur); gl.blendFunc(gl.ONE, this.add ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); gl.bufferData(gl.ARRAY_BUFFER, this.buf.subarray(0, this.n * 48), gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 8); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
    gl.drawArrays(gl.TRIANGLES, 0, this.n * 6); this.stats.draws++; this.n = 0;
  },
  // Prostokąt (x0,y0)-(x1,y1) w przestrzeni rysowania, przekształcony macierzą m, z wycinkiem tekstury u0..u1, v0..v1 i barwą c
  quad(tex, m, x0, y0, x1, y1, u0, v0, u1, v1, c, add) {
    if (tex !== this.cur || add !== this.add || this.n >= this.N) { this.flush(); this.cur = tex; this.add = add; }
    const [a, b, cc, d, e, f] = m, B = this.buf, P = [[x0, y0, u0, v0], [x1, y0, u1, v0], [x0, y1, u0, v1], [x1, y0, u1, v0], [x1, y1, u1, v1], [x0, y1, u0, v1]];
    let k = this.n * 48; for (const [x, y, u, v] of P) { B[k++] = a * x + cc * y + e; B[k++] = b * x + d * y + f; B[k++] = u; B[k++] = v; B[k++] = c[0]; B[k++] = c[1]; B[k++] = c[2]; B[k++] = c[3]; }
    this.n++; this.stats.quads++;
  },
  // Początek klatki: płótno WebGL w rozmiarze bufora świata (w × h pikseli), kontekst rysowania z jednostkową macierzą
  begin(w, h) {
    const c = this.canvas, gl = this.gl; if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    this.W = w; this.H = h; this.frame++; this.stats = { quads: 0, draws: 0, uploads: 0 };
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); this.cur = null; this.n = 0;
    GLCtx.reset(c); return GLCtx;
  },
  end() { this.flush(); this.evict(); return this.canvas; },
  // Płótno WebGL pod płótnem gry, dokładnie w miejscu okna mapy (x, y, w, h w jednostkach kontekstu ctx); płótno gry jest tam
  // przezroczyste, więc obraz z karty graficznej nie wraca do procesora (składa go przeglądarka)
  place(ctx, x, y, w, h) {
    const c = this.canvas, gc = G.canvas, wrap = gc.parentNode; if (!wrap) return;
    if (c.parentNode !== wrap) { wrap.style.position = 'relative'; gc.style.position = 'relative'; gc.style.zIndex = '1'; Object.assign(c.style, { position: 'absolute', pointerEvents: 'none', zIndex: '0' }); wrap.insertBefore(c, gc); }
    const m = ctx.getTransform(), k = gc.width / (gc.clientWidth || gc.width), css = [gc.offsetLeft + (m.a * x + m.e) / k, gc.offsetTop + (m.d * y + m.f) / k, m.a * w / k, m.d * h / k].map(v => v.toFixed(2) + 'px');
    const st = c.style; if (st.left !== css[0]) st.left = css[0]; if (st.top !== css[1]) st.top = css[1]; if (st.width !== css[2]) st.width = css[2]; if (st.height !== css[3]) st.height = css[3]; if (st.display === 'none') st.display = '';
    this.shown = true;
  },
  hideUnused() { if (!this.shown && this.canvas && this.canvas.style.display !== 'none') this.canvas.style.display = 'none'; },
  // Fale na kawałku terenu (WaterFx.draw): jeden prostokąt shadera wody zamiast składania warstw w płótnie
  water(ctx, ch, dx, dy, size, wx, wy) {
    const gl = this.gl, t = G.time, D = MapRender.D, S = Math.round(ch.width / D), pat = this.texOf(WaterFx.pattern()), deep = this.texOf(ch._deep), shore = this.texOf(ch._shore);
    this.flush(); const U = this.uw, fc = WaterFx.foamRgb || (WaterFx.foamRgb = gradeRgb(hexRgb('#eef8fc')).map(v => v / 255)), fa = 0.22 + 0.2 * Math.sin(t * 2.2);
    gl.useProgram(this.pWater); gl.uniform2f(U.uR, this.W, this.H); gl.uniform1f(U.uS, S); gl.uniform2f(U.uW, wx / D, wy / D);
    gl.uniform2f(U.uO1, Math.floor(t * 4), Math.floor(t * 1.5)); gl.uniform2f(U.uO2, -Math.floor(t * 3) + 21, Math.floor(t * 2) + 13);
    gl.uniform3f(U.uA, 0.5 + 0.2 * Math.sin(t * 1.3), 0.35 + 0.2 * Math.sin(t * 1.7 + 2), ctx.globalAlpha); gl.uniform4f(U.uFoam, fc[0] * fa, fc[1] * fa, fc[2] * fa, fa);
    [[pat, U.uPat], [deep, U.uDeep], [shore, U.uShore]].forEach(([tx, u], i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(u, i); });
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, pat); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // wzór fal: ostre piksele (jak w płótnie), maski gładko
    const [a, b, c, d, e, f] = ctx.m, x0 = dx, y0 = dy, x1 = dx + size, y1 = dy + size, V = new Float32Array(24); let k = 0;
    for (const [x, y, u, v] of [[x0, y0, 0, 0], [x1, y0, 1, 0], [x0, y1, 0, 1], [x1, y0, 1, 0], [x1, y1, 1, 1], [x0, y1, 0, 1]]) { V[k++] = a * x + c * y + e; V[k++] = b * x + d * y + f; V[k++] = u; V[k++] = v; }
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); gl.bufferData(gl.ARRAY_BUFFER, V, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLES, 0, 6); this.stats.draws++; this.cur = null;
  },
};
// Kolor CSS (#rgb, #rrggbb, rgb(), rgba()) -> [r, g, b, a] 0..1; nieznany (gradient, wzór) -> biały
const GL_COL = new Map();
function glColor(s) {
  if (typeof s !== 'string') return [1, 1, 1, 1]; let c = GL_COL.get(s); if (c) return c;
  let m; if ((m = /^#([0-9a-f]{3})$/i.exec(s))) c = [...m[1]].map(h => parseInt(h + h, 16) / 255).concat(1);
  else if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s))) c = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  else if ((m = /^rgba?\(([^)]+)\)$/i.exec(s))) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat); c = [p[0] / 255, p[1] / 255, p[2] / 255, p.length > 3 ? p[3] : 1]; }
  else c = [1, 1, 1, 1];
  GL_COL.set(s, c); return c;
}
// Kontekst rysowania dla drawWorldPixel: część API płótna 2D (macierz, przezroczystość, mieszanie „lighter”, drawImage,
// fillRect, koła i elipsy pełne lub obrysowane), zamieniana od razu na prostokąty GLMap.quad
const GLCtx = {
  isGL: true, canvas: null, m: [1, 0, 0, 1, 0, 0], globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
  imageSmoothingEnabled: true, imageSmoothingQuality: 'low', shadowColor: 'transparent', shadowBlur: 0, stack: [], path: [],
  reset(c) { this.canvas = c; this.m = [1, 0, 0, 1, 0, 0]; this.globalAlpha = 1; this.globalCompositeOperation = 'source-over'; this.fillStyle = '#000'; this.stack = []; this.path = []; },
  save() { this.stack.push([this.m.slice(), this.globalAlpha, this.globalCompositeOperation, this.fillStyle, this.strokeStyle, this.lineWidth]); },
  restore() { const s = this.stack.pop(); if (s) [this.m, this.globalAlpha, this.globalCompositeOperation, this.fillStyle, this.strokeStyle, this.lineWidth] = s; },
  setTransform(a, b, c, d, e, f) { if (typeof a === 'object') ({ a, b, c, d, e, f } = a); this.m = [a, b, c, d, e, f]; },
  getTransform() { const [a, b, c, d, e, f] = this.m; return { a, b, c, d, e, f, m11: a, m12: b, m21: c, m22: d, m41: e, m42: f }; },
  transform(a, b, c, d, e, f) { const [A, B, C, D, E, F] = this.m; this.m = [A * a + C * b, B * a + D * b, A * c + C * d, B * c + D * d, A * e + C * f + E, B * e + D * f + F]; },
  translate(x, y) { this.transform(1, 0, 0, 1, x, y); }, scale(x, y) { this.transform(x, 0, 0, y, 0, 0); },
  rotate(r) { const c = Math.cos(r), s = Math.sin(r); this.transform(c, s, -s, c, 0, 0); },
  tint(col) { const a = col[3] * this.globalAlpha; return [col[0] * a, col[1] * a, col[2] * a, a]; },
  drawImage(img, ...p) {
    if (!img || !img.width || !img.height || this.globalAlpha <= 0) return; const iw = img.width, ih = img.height; let sx = 0, sy = 0, sw = iw, sh = ih, dx, dy, dw = iw, dh = ih;
    if (p.length === 2) [dx, dy] = p; else if (p.length === 4) [dx, dy, dw, dh] = p; else [sx, sy, sw, sh, dx, dy, dw, dh] = p;
    const a = this.globalAlpha; GLMap.quad(GLMap.texOf(img), this.m, dx, dy, dx + dw, dy + dh, sx / iw, sy / ih, (sx + sw) / iw, (sy + sh) / ih, [a, a, a, a], this.globalCompositeOperation === 'lighter');
  },
  fillRect(x, y, w, h) { GLMap.quad(GLMap.texOf(GLMap.white), this.m, x, y, x + w, y + h, 0.25, 0.25, 0.75, 0.75, this.tint(glColor(this.fillStyle)), this.globalCompositeOperation === 'lighter'); },
  clearRect() {}, clip() {}, rect(x, y, w, h) { this.path.push({ rect: [x, y, w, h] }); }, moveTo() {}, lineTo() {}, closePath() {},
  beginPath() { this.path = []; },
  arc(x, y, r) { this.path.push({ x, y, rx: r, ry: r }); },
  ellipse(x, y, rx, ry) { this.path.push({ x, y, rx, ry }); },
  fill() { const c = this.tint(glColor(this.fillStyle)), add = this.globalCompositeOperation === 'lighter';
    for (const p of this.path) { if (p.rect) { const [x, y, w, h] = p.rect; GLMap.quad(GLMap.texOf(GLMap.white), this.m, x, y, x + w, y + h, 0.25, 0.25, 0.75, 0.75, c, add); } else GLMap.quad(GLMap.texOf(GLMap.disc), this.m, p.x - p.rx, p.y - p.ry, p.x + p.rx, p.y + p.ry, 0, 0, 1, 1, c, add); } },
  stroke() { const c = this.tint(glColor(this.strokeStyle)); for (const p of this.path) if (!p.rect) { const k = 64 / 52; GLMap.quad(GLMap.texOf(GLMap.ring), this.m, p.x - p.rx * k, p.y - p.ry * k, p.x + p.rx * k, p.y + p.ry * k, 0, 0, 1, 1, c, false); } },
};
