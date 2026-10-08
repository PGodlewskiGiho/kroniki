// ==================== MAPA PRZYGODY NA KARCIE GRAFICZNEJ (WebGL) ===========================
// Świat mapy (teren, droga bohatera, obiekty, bohaterowie, dym, mgła wojny, światło) rysuje ten sam kod co dotąd
// (drawWorldPixel), ale zamiast płótna procesora dostaje kontekst GLCtx: każde drawImage / fillRect / koło staje się
// prostokątem z teksturą, składanym przez kartę graficzną. Obrazki (kawałki terenu, sprite'y, mgła) trafiają na kartę raz
// i tam zostają, więc klatka to kilkaset tanich prostokątów zamiast przepisywania milionów pikseli przez procesor.
// Fale na wodzie liczy shader (wzór fal × maska głębi, piana × maska brzegu) – dawniej składane w płótnie dla każdego kawałka.
// Gotowy obraz trafia do płótna gry jednym drawImage (jak dawny bufor świata). Bez WebGL, w trybie pikseli albo po
// wybraniu w ustawieniach „procesor” – dawne rysowanie (drawMapView sprawdza GLMap.use()).
const HP = 'precision highp float;', GLSL_HASH = 'float wxH(highp vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }'; // wzór fal w wodzie liczony jak dawniej (mediump), skrót losowy zawsze w highp
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
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; this.tex.clear(); this.pages = []; this.bytes = 0; G.dirty = true; }); // utrata kontekstu: dalej rysuje procesor
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
    `precision mediump float; uniform sampler2D uPat, uDeep, uShore, uSky; uniform vec2 uW, uO1, uO2; uniform float uS, uT, uRefl; uniform vec3 uA; uniform vec4 uFoam, uGrid; varying vec2 vT; ${GLSL_HASH}
      void main() { vec2 q = vT * uS + uW; vec4 c1 = texture2D(uPat, fract((q - uO1) / 48.0)) * uA.x, c2 = texture2D(uPat, fract((q - uO2) / 48.0)) * uA.y;
        float deep = texture2D(uDeep, vT).a; vec4 w = c2 + c1 * (1.0 - c2.a);
        // pogoda: odbicie nieba (jaśniej i bardziej błękitnie bez chmur), błyski słońca, kręgi deszczu (q: piksele grafiki, 16 na pole)
        vec4 s = texture2D(uSky, (q / 16.0 - uGrid.xy) / uGrid.zw); float sky = 1.0 - s.g;
        vec3 refl = mix(vec3(0.09, 0.11, 0.15), vec3(0.56, 0.72, 0.88), sky); float fr = 0.11;
        float gl = step(0.993, wxH(floor(q / 1.6) + floor(uT * 3.0))) * sky * 0.7;
        vec2 cell = floor(q / 10.0), lp = fract(q / 10.0) - 0.5 - (vec2(wxH(cell), wxH(cell + 3.1)) - 0.5) * 0.4; float ph = fract(uT * 0.9 + wxH(cell + 7.3));
        float ring = smoothstep(0.06, 0.0, abs(length(lp) - ph * 0.45)) * (1.0 - ph) * step(wxH(cell + 11.7), s.b) * 0.55;
        vec4 add = vec4(refl * fr + vec3(1.0, 0.97, 0.88) * gl + vec3(0.82, 0.88, 0.95) * ring, fr + gl + ring) * uRefl;
        gl_FragColor = ((w + add * (1.0 - w.a)) * deep + uFoam * texture2D(uShore, vT).a) * uA.z; }`, ['aP', 'aT']);
    this.uR = gl.getUniformLocation(this.pQuad, 'uR'); this.uTex = gl.getUniformLocation(this.pQuad, 'uTex');
    this.uw = {}; for (const k of ['uR', 'uPat', 'uDeep', 'uShore', 'uW', 'uO1', 'uO2', 'uS', 'uA', 'uFoam', 'uSky', 'uGrid', 'uT', 'uRefl']) this.uw[k] = gl.getUniformLocation(this.pWater, k);
    // pogoda: cząstki (punkty: deszcz, śnieg, liście, popiół, piasek) i niebo (cienie chmur, mgła, błyskawica) – Weather w 17w-pogoda.js
    this.pWxP = prog(`attribute vec4 aS; uniform vec2 uR; uniform vec3 uM; uniform vec4 uV; uniform vec2 uO; uniform float uT, uTs; varying vec2 vTile; varying float vC, vS, vR;
      void main() { float c = aS.w < 0.4 ? 1.0 : aS.w < 0.7 ? 2.0 : aS.w < 0.8 ? 3.0 : aS.w < 0.9 ? 4.0 : 5.0, k = 0.7 + aS.z * 0.6; // jak wxClass
        float fall = c < 1.5 ? 620.0 : c < 2.5 ? 42.0 : c < 3.5 ? 34.0 : c < 4.5 ? 28.0 : 8.0, drift = c < 1.5 ? 90.0 : c < 2.5 ? 18.0 : c < 3.5 ? 40.0 : c < 4.5 ? 10.0 : 170.0;
        float sway = (c > 1.5 && c < 3.5) ? sin(uT * (1.3 + aS.z) + aS.x * 40.0) * 14.0 : 0.0;
        vec2 p = uV.xy + mod(vec2(aS.x * uV.z + uT * drift * k + sway, aS.y * uV.w + uT * fall * k), uV.zw);
        vTile = (p - uO) / uTs; vC = c; vS = aS.z; vR = aS.x; vec2 b = uM.x * p + uM.yz;
        gl_Position = vec4(b.x / uR.x * 2.0 - 1.0, 1.0 - b.y / uR.y * 2.0, 0.0, 1.0);
        gl_PointSize = (c < 1.5 ? 17.0 : c < 2.5 ? 4.0 + aS.z * 3.0 : c < 3.5 ? 8.0 : c < 4.5 ? 3.5 : 20.0) * uM.x; }`,
    `${HP} uniform sampler2D uType; uniform vec4 uGrid; uniform float uT, uSeason; varying vec2 vTile; varying float vC, vS, vR;
      void main() { vec2 g = (vTile - uGrid.xy) / uGrid.zw; if (g.x < 0.0 || g.y < 0.0 || g.x > 1.0 || g.y > 1.0) discard;
        vec4 w = texture2D(uType, g); if (abs(floor(w.r * 255.0 / 40.0 + 0.5) - vC) > 0.5 || vS > w.g) discard;
        vec2 p = gl_PointCoord - 0.5; vec4 col;
        if (vC < 1.5) { float a = smoothstep(0.07, 0.0, abs(p.x + p.y * 0.2)) * smoothstep(0.5, 0.2, abs(p.y)) * 0.75; col = vec4(vec3(0.8, 0.86, 0.97) * a, a); }
        else if (vC < 2.5) { float a = smoothstep(0.5, 0.12, length(p)) * 0.92; col = vec4(vec3(a), a); }
        else if (vC < 3.5) { float an = uT * 2.0 + vR * 30.0; vec2 q = mat2(cos(an), -sin(an), sin(an), cos(an)) * p; float a = smoothstep(0.5, 0.36, length(q * vec2(1.0, 2.3)));
          vec3 c3 = uSeason > 1.5 ? mix(vec3(0.82, 0.32, 0.1), vec3(0.95, 0.68, 0.18), fract(vR * 7.0)) : mix(vec3(1.0, 0.78, 0.86), vec3(1.0), fract(vR * 7.0)); col = vec4(c3 * a, a); }
        else if (vC < 4.5) { float a = smoothstep(0.5, 0.1, length(p)) * 0.85, e = step(0.78, fract(vR * 11.0)); vec3 c3 = mix(vec3(0.42, 0.4, 0.4), vec3(1.0, 0.55, 0.15) * (0.7 + 0.3 * sin(uT * 9.0 + vR * 50.0)), e); col = vec4(c3 * a, a); }
        else { float a = smoothstep(0.5, 0.0, length(p)) * 0.2; col = vec4(vec3(0.78, 0.66, 0.45) * a, a); }
        gl_FragColor = col; }`, ['aS']);
    this.pWxS = prog(`attribute vec2 aP; uniform vec2 uR; uniform vec3 uM; varying vec2 vL; void main() { vL = aP; vec2 b = uM.x * aP + uM.yz; gl_Position = vec4(b.x / uR.x * 2.0 - 1.0, 1.0 - b.y / uR.y * 2.0, 0.0, 1.0); }`,
    `${HP} uniform sampler2D uSky; uniform vec4 uGrid; uniform vec2 uO; uniform float uTs, uT, uFlash; varying vec2 vL; ${GLSL_HASH}
      float wxN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wxH(i), wxH(i + vec2(1.0, 0.0)), f.x), mix(wxH(i + vec2(0.0, 1.0)), wxH(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main() { vec2 tile = (vL - uO) / uTs; vec4 s = texture2D(uSky, (tile - uGrid.xy) / uGrid.zw);
        float nn = wxN(tile * 0.9 - vec2(uT * 0.32, uT * 0.11)) * 0.6 + wxN(tile * 2.3 - vec2(uT * 0.5, 0.0)) * 0.4;
        float sh = s.g * (0.5 + 0.5 * nn) * 0.3 + s.b * 0.06, fog = s.r * (0.55 + 0.45 * wxN(tile * 1.3 - vec2(uT * 0.15, uT * 0.05))) * 0.8;
        vec4 c = vec4(vec3(0.03, 0.04, 0.08) * sh, sh); c = c * (1.0 - fog) + vec4(vec3(0.86, 0.88, 0.9) * fog, fog);
        gl_FragColor = c + vec4(vec3(0.9, 0.94, 1.0) * uFlash, uFlash) * (1.0 - c.a); }`, ['aP']);
    this.ux = {}; for (const [P, ks] of [[this.pWxP, ['uR', 'uM', 'uV', 'uO', 'uT', 'uTs', 'uType', 'uGrid', 'uSeason']], [this.pWxS, ['uR', 'uM', 'uSky', 'uGrid', 'uO', 'uTs', 'uT', 'uFlash']]]) for (const k of ks) this.ux[(P === this.pWxP ? 'p_' : 's_') + k] = gl.getUniformLocation(P, k);
    const seeds = Weather.seeds(2500); this.wxN = 2500; this.wxVbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.wxVbo); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    this.tType = this.newTex(); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.tSky = this.newTex(); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 70, 0, 255])); this.wxGrid = [0, 0, 1e4, 1e4];
    this.vbo = gl.createBuffer(); this.N = 4096; this.buf = new Float32Array(this.N * 6 * 8); this.n = 0; this.cur = null; this.add = false;
    // stałe obrazki: biały piksel (prostokąty w kolorze), miękkie koło (dym, iskry, dołki) i pierścień (podświetlenie)
    const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; };
    this.white = mk(2, 2, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); });
    this.disc = mk(64, 64, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 31, 0, TAU); g.fill(); });
    this.ring = mk(128, 128, g => { g.strokeStyle = '#fff'; g.lineWidth = 7; g.shadowColor = '#fff'; g.shadowBlur = 10; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke(); });
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  },
  newTex(w, h) { const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); return t; },
  // Tekstura obrazka: { t, u0, v0, su, sv } (wycinek tekstury). Raz wgrana zostaje na karcie; małe obrazki (sprite'y obiektów,
  // bohaterów, flagi, koła) trafiają do wspólnych tekstur atlasu, więc kolejne prostokąty idą jednym poleceniem rysowania.
  // Płótna robocze (pixBuf, np. sylwetki zasłoniętych obiektów) wgrywane przy każdym użyciu; own: osobna tekstura (wzór fal, maski wody)
  texOf(img, own) {
    const gl = this.gl; let r = this.tex.get(img); const dyn = !!img._ctx;
    if (r && !dyn) { r.used = this.frame; return r; }
    if (!r && !dyn && !own && !img._noAtlas && img.width <= this.AMAX && img.height <= this.AMAX) { r = this.atlasPut(img); this.tex.set(img, r); return r; }
    if (!r) { r = { t: this.newTex(), u0: 0, v0: 0, su: 1, sv: 1, b: 0, used: this.frame }; this.tex.set(img, r); }
    else { this.flush(); gl.bindTexture(gl.TEXTURE_2D, r.t); }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); this.stats.uploads++;
    const b = (img.width || 1) * (img.height || 1) * 4; this.bytes += b - r.b; r.b = b; r.used = this.frame; return r;
  },
  // Atlas: strony AT×AT pikseli dzielone na półki (rzędy obrazków podobnej wysokości), 1 px pustego odstępu wokół obrazka
  // (gładkie skalowanie nie łapie sąsiada). Pełne strony (najwyżej APAGES): atlas zaczyna się od nowa, obrazki wgrają się ponownie
  AT: 2048, AMAX: 256, APAGES: 4, pages: [],
  atlasPut(img) {
    const w = img.width + 2, h = img.height + 2, A = this.AT, gl = this.gl;
    const fit = pg => { for (const s of pg.shelves) if (h <= s.h && s.h <= h + 24 && s.x + w <= A) { const x = s.x; s.x += w; return [x, s.y]; } if (pg.y + h > A) return null; pg.shelves.push({ y: pg.y, h, x: w }); pg.y += h; return [0, pg.y - h]; };
    let pg = null, at = null; for (const p of this.pages) if ((at = fit(p))) { pg = p; break; }
    if (!pg) { if (this.pages.length >= this.APAGES) this.atlasReset(); pg = { t: this.newTex(A, A), shelves: [], y: 0 }; this.pages.push(pg); this.bytes += A * A * 4; at = fit(pg); }
    this.flush(); gl.bindTexture(gl.TEXTURE_2D, pg.t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, at[0] + 1, at[1] + 1, gl.RGBA, gl.UNSIGNED_BYTE, img); this.stats.uploads++;
    return { t: pg.t, pg, u0: (at[0] + 1) / A, v0: (at[1] + 1) / A, su: img.width / A, sv: img.height / A, b: 0, used: this.frame };
  },
  atlasReset() { this.flush(); const gl = this.gl; for (const p of this.pages) { gl.deleteTexture(p.t); this.bytes -= this.AT * this.AT * 4; } this.pages = []; for (const [k, r] of this.tex) if (r.pg) this.tex.delete(k); },
  // Obrazki nieużywane od dawna wypadają z karty (kawałki terenu daleko od kamery wrócą przy powrocie, w ~1 ms każdy)
  evict() {
    if (this.bytes <= this.BUDGET && this.frame % 300) return; const gl = this.gl, old = [...this.tex].filter(([, r]) => !r.pg && r.used < this.frame - 2).sort((a, b) => a[1].used - b[1].used);
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
  // Prostokąt (x0,y0)-(x1,y1) w przestrzeni rysowania, przekształcony macierzą m, z wycinkiem obrazka u0..u1, v0..v1 (0..1) i barwą c
  quad(r, m, x0, y0, x1, y1, u0, v0, u1, v1, c, add) {
    const tex = r.t; u0 = r.u0 + u0 * r.su; u1 = r.u0 + u1 * r.su; v0 = r.v0 + v0 * r.sv; v1 = r.v0 + v1 * r.sv;
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
    const gl = this.gl, t = G.time, D = MapRender.D, S = Math.round(ch.width / D), pat = this.texOf(WaterFx.pattern(), true).t, deep = this.texOf(ch._deep, true).t, shore = this.texOf(ch._shore, true).t;
    this.flush(); const U = this.uw, fc = WaterFx.foamRgb || (WaterFx.foamRgb = gradeRgb(hexRgb('#eef8fc')).map(v => v / 255)), fa = 0.22 + 0.2 * Math.sin(t * 2.2);
    gl.useProgram(this.pWater); gl.uniform2f(U.uR, this.W, this.H); gl.uniform1f(U.uS, S); gl.uniform2f(U.uW, wx / D, wy / D);
    gl.uniform2f(U.uO1, Math.floor(t * 4), Math.floor(t * 1.5)); gl.uniform2f(U.uO2, -Math.floor(t * 3) + 21, Math.floor(t * 2) + 13);
    gl.uniform3f(U.uA, 0.5 + 0.2 * Math.sin(t * 1.3), 0.35 + 0.2 * Math.sin(t * 1.7 + 2), ctx.globalAlpha); gl.uniform4f(U.uFoam, fc[0] * fa, fc[1] * fa, fc[2] * fa, fa);
    [[pat, U.uPat], [deep, U.uDeep], [shore, U.uShore], [this.tSky, U.uSky]].forEach(([tx, u], i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(u, i); });
    gl.uniform4f(U.uGrid, ...this.wxGrid); gl.uniform1f(U.uT, t % 1000); gl.uniform1f(U.uRefl, this.reflect === false ? 0 : 1); // odbicia nieba, błyski i kręgi deszczu (tylko karta graficzna)
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, pat); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // wzór fal: ostre piksele (jak w płótnie), maski gładko
    const [a, b, c, d, e, f] = ctx.m, x0 = dx, y0 = dy, x1 = dx + size, y1 = dy + size, V = new Float32Array(24); let k = 0;
    for (const [x, y, u, v] of [[x0, y0, 0, 0], [x1, y0, 1, 0], [x0, y1, 0, 1], [x1, y0, 1, 0], [x1, y1, 1, 1], [x0, y1, 0, 1]]) { V[k++] = a * x + c * y + e; V[k++] = b * x + d * y + f; V[k++] = u; V[k++] = v; }
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); gl.bufferData(gl.ARRAY_BUFFER, V, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLES, 0, 6); this.stats.draws++; this.cur = null;
  },
  // Pogoda (Weather.draw): siatka pól do tekstur, potem prostokąt nieba (chmury, mgła, błysk) i cząstki jednym poleceniem
  weather(ctx, g, ox, oy, season, flash) {
    const gl = this.gl, [a, , , , e, f] = ctx.m, t = G.time % 1000, V = VIEW; this.flush();
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (this.wxVer !== g.ver || this.wxFor !== g) { this.wxVer = g.ver; this.wxFor = g; // tekstury pogody tylko po przeliczeniu siatki
      gl.bindTexture(gl.TEXTURE_2D, this.tType); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, g.cols, g.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, g.type);
      gl.bindTexture(gl.TEXTURE_2D, this.tSky); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, g.cols, g.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, g.sky); }
    this.wxGrid = [g.tx0, g.ty0, g.cols, g.rows]; const X = this.ux; gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
    // niebo: prostokąt widoku (współrzędne logiczne mapy)
    gl.useProgram(this.pWxS); gl.uniform2f(X.s_uR, this.W, this.H); gl.uniform3f(X.s_uM, a, e, f); gl.uniform4f(X.s_uGrid, ...this.wxGrid); gl.uniform2f(X.s_uO, ox, oy); gl.uniform1f(X.s_uTs, T); gl.uniform1f(X.s_uT, t); gl.uniform1f(X.s_uFlash, flash);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tSky); gl.uniform1i(X.s_uSky, 0);
    const x0 = V.x, y0 = V.y, x1 = V.x + V.w, y1 = V.y + V.h; gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, x1, y0, x0, y1, x1, y0, x1, y1, x0, y1]), gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0); gl.drawArrays(gl.TRIANGLES, 0, 6); this.stats.draws++;
    // cząstki: tyle punktów, ile ziaren; każdy pokazuje się tylko tam, gdzie pada jego rodzaj (tekstura tType)
    if (G.settings.quality !== 'low') {
      gl.useProgram(this.pWxP); gl.uniform2f(X.p_uR, this.W, this.H); gl.uniform3f(X.p_uM, a, e, f); gl.uniform4f(X.p_uV, V.x, V.y, V.w, V.h); gl.uniform2f(X.p_uO, ox, oy); gl.uniform1f(X.p_uT, t); gl.uniform1f(X.p_uTs, T);
      gl.uniform4f(X.p_uGrid, ...this.wxGrid); gl.uniform1f(X.p_uSeason, season); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tType); gl.uniform1i(X.p_uType, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.wxVbo); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0); gl.drawArrays(gl.POINTS, 0, this.wxN); this.stats.draws++;
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); this.cur = null;
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
