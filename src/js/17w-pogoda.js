// ==================== POGODA NA MAPIE PRZYGODY ===========================================
// Pogoda z sensem: każdego dnia los wybiera jej charakter (weatherOf: pogodnie, pochmurno, deszcz, burza, mgła, śnieżyca), a po
// mapie wędruje z wiatrem front chmur i opadów (szum). Co pada, zależy od pola: nad śniegiem i zimą śnieg, nad bagnem mżawka
// i mgła, w lesie jesienią liście (wiosną płatki), nad lawą popiół i iskry, nad pustynią zamiast deszczu burza piaskowa,
// a na wodzie deszcz rysuje kręgi. Chmury rzucają cienie, woda odbija niebo i błyska w słońcu.
// Na karcie graficznej (GLMap) wszystko liczą shadery: cząstki jednym poleceniem rysowania, cienie chmur i mgła jednym
// prostokątem; procesor dostaje lżejszą wersję (mgła i chmury jako jeden przeskalowany obrazek, ok. 160 cząstek).
const WEATHERS = { clear: 'pogodnie', clouds: 'pochmurno', rain: 'deszcz', storm: 'burza', fog: 'mgła', snow: 'śnieżyca' };
const WEATHER_ODDS = [ // wiosna, lato, jesień, zima: [pogoda, waga]
  [['clear', 40], ['clouds', 25], ['rain', 25], ['fog', 10]], [['clear', 60], ['clouds', 20], ['storm', 12], ['rain', 8]],
  [['clear', 20], ['clouds', 25], ['rain', 30], ['fog', 15], ['storm', 10]], [['clear', 25], ['clouds', 25], ['snow', 35], ['fog', 15]],
];
function weatherOf(st) {
  if (!st || !st.dayTotal) return 'clear'; const L = WEATHER_ODDS[seasonIdx(st)]; let r = thash(st.seed, st.dayTotal, 77) % L.reduce((s, x) => s + x[1], 0);
  for (const [k, w] of L) if ((r -= w) < 0) return k; return 'clear';
}
const weatherOn = () => G.settings.weather !== 'off';
const WX = { NONE: 0, RAIN: 1, SNOW: 2, LEAF: 3, ASH: 4, DUST: 5 }, WX_BASE = { clear: -0.34, clouds: -0.12, fog: -0.14, rain: 0.1, storm: 0.22, snow: 0.14 };
const WX_WIND = [0.32, 0.11]; // pola na sekundę: front płynie z zachodu
// Klimat okolicy (pogoda jest regionalna, nie dla pojedynczego pola): udział śniegu, piasku, lawy, bagien, lasu i wody w promieniu
// ok. 7 pól, w siatce co 4 pola, odczyt płynny (dwuliniowo) – granice pogody biegną łagodnie przez całe krainy
const CLIM_K = ['snow', 'sand', 'lava', 'swamp', 'forest', 'water'], CLIM_C = 4, CLIM_R = 7;
function mapClimate(map) {
  if (map._clim) return map._clim; const n = map.n, C = CLIM_C, gw = Math.ceil(n / C) + 1, G = new Float32Array(gw * gw * 6);
  for (let gy = 0; gy < gw; gy++) for (let gx = 0; gx < gw; gx++) { const cx = gx * C, cy = gy * C, acc = [0, 0, 0, 0, 0, 0]; let tot = 0;
    for (let dy = -CLIM_R; dy <= CLIM_R; dy++) for (let dx = -CLIM_R; dx <= CLIM_R; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue; const i = y * n + x, t = map.terrain[i]; tot++;
      if (t === TER.SNOW) acc[0]++; else if (t === TER.SAND) acc[1]++; else if (t === TER.LAVA) acc[2]++; else if (t === TER.SWAMP) acc[3]++; else if (t === TER.WATER) acc[5]++; if (map.obst[i] === OBST.TREE) acc[4]++; }
    for (let k = 0; k < 6; k++) G[(gy * gw + gx) * 6 + k] = tot ? acc[k] / tot : 0; }
  return (map._clim = { G, gw });
}
const CLIM = new Float32Array(6);
function climateAt(map, tx, ty) {
  const { G, gw } = mapClimate(map), u = clamp(tx / CLIM_C, 0, gw - 1.001), v = clamp(ty / CLIM_C, 0, gw - 1.001), x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
  for (let k = 0; k < 6; k++) { const a = G[(y0 * gw + x0) * 6 + k], b = G[(y0 * gw + x0 + 1) * 6 + k], c = G[((y0 + 1) * gw + x0) * 6 + k], d = G[((y0 + 1) * gw + x0 + 1) * 6 + k];
    CLIM[k] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy; }
  return CLIM;
}
// Pogoda na polu w chwili t: [rodzaj opadu (WX), natężenie 0–1, mgła 0–1, zachmurzenie 0–1, deszcz na wodzie 0–1]
// Rodzaj wynika z klimatu okolicy (cała kraina śniegu – śnieg, pustynia – piasek, puszcza jesienią – liście), front opadów jest duży
function weatherAt(st, tx, ty, t, w = weatherOf(st)) {
  const map = st.map, n = map.n; if (tx < 0 || ty < 0 || tx >= n || ty >= n) return [0, 0, 0, 0, 0];
  const i = ty * n + tx, S = seasonIdx(st), seed = (st.seed + st.dayTotal * 131) | 0, fx = tx - t * WX_WIND[0], fy = ty - t * WX_WIND[1];
  const F = vnoise2(fx / 28, fy / 28, seed) * 0.75 + vnoise2(fx / 12, fy / 12, seed + 7) * 0.25, base = WX_BASE[w] || 0;
  const cloud = clamp((F - 0.4 + base * 1.2) * 2.2, 0, 1) * (w === 'clear' ? 0.45 : 1), wet = clamp((F - 0.55 + base) * 3.2, 0, 1);
  const c = climateAt(map, tx, ty), [snow, sand, lava, swamp, forest, water] = c; let type = 0, amt = 0, fog = 0;
  if (lava > 0.3) { type = WX.ASH; amt = clamp(lava * 1.5, 0.3, 0.9); }
  else if (sand > 0.45) { if (wet > 0.25 && w !== 'snow') { type = WX.DUST; amt = wet; } } // pustynia: zamiast deszczu piasek
  else if (wet > 0) { type = snow > 0.35 || S === 3 ? WX.SNOW : WX.RAIN; amt = wet; }
  else if (swamp > 0.3 && w !== 'clear') { type = S === 3 ? WX.SNOW : WX.RAIN; amt = 0.28; } // mżawka nad mokradłami (zimą prószy)
  else if (snow > 0.5 && w !== 'clear' && F > 0.45) { type = WX.SNOW; amt = 0.35; } // w krainie śniegu prószy przy chmurach
  if (!type && forest > 0.3 && (S === 2 || S === 0) && snow < 0.35) { type = WX.LEAF; amt = Math.min(1, forest * (S === 2 ? 1.3 : 0.65)); } // jesienią liście, wiosną płatki
  fog = swamp * 0.8 + (w === 'fog' ? clamp(F * 1.3 - 0.15, 0, 0.6) + water * 0.25 : 0) + (w === 'rain' ? swamp * 0.2 : 0);
  return [type, amt, Math.min(0.85, fog), cloud, map.terrain[i] === TER.WATER && type === WX.RAIN ? amt : 0];
}
// Siatka pogody dla widocznych pól (co klatkę, ok. 1000 pól): rodzaj i natężenie (tType) oraz mgła, chmury, deszcz (tSky)
const Weather = {
  grid: null, flash: 0,
  build(st, camX, camY, vw, vh) {
    const n = st.map.n, tx0 = Math.floor(camX / T) - 1, ty0 = Math.floor(camY / T) - 1, cols = Math.ceil(vw / T) + 3, rows = Math.ceil(vh / T) + 3, w = weatherOf(st), t = G.time;
    let g = this.grid; if (!g || g.cols !== cols || g.rows !== rows) g = this.grid = { cols, rows, type: new Uint8Array(cols * rows * 4), sky: new Uint8Array(cols * rows * 4), ver: 0 };
    // front płynie wolno (ułamek pola na sekundę): siatka liczy się ok. 10 razy na sekundę albo po przesunięciu widoku o pole
    const key = `${tx0},${ty0},${w},${st.dayTotal},${st.month},${Math.floor(t * 10)},${st.map.n},${st.seed},${MapRender.miniDirty ? 1 : 0}`;
    if (g.key === key && g.st === st) { this.stormFlash(st, g, t); return g; } g.key = key; g.st = st; g.ver++;
    g.tx0 = tx0; g.ty0 = ty0; g.any = false; g.storm = 0; const ex = human(st).explored, under = st.map.ln;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const tx = tx0 + c, ty = ty0 + r, k = (r * cols + c) * 4, inside = tx >= 0 && ty >= 0 && tx < n && ty < n, i = ty * n + tx;
      const v = inside && ex[i] && !(under && levelOf(st.map, tx, ty)) ? weatherAt(st, tx, ty, t, w) : [0, 0, 0, 0, 0];
      g.type[k] = v[0] * 40; g.type[k + 1] = v[1] * 255; g.type[k + 3] = 255;
      g.sky[k] = v[2] * 255; g.sky[k + 1] = v[3] * 255; g.sky[k + 2] = v[4] * 255; g.sky[k + 3] = 255;
      if (v[0] || v[2] > 0.05 || v[3] > 0.05) g.any = true; if (w === 'storm' && v[0] === WX.RAIN && v[1] > 0.6) g.storm++;
    }
    this.stormFlash(st, g, t); return g;
  },
  // błyskawica: co kilka sekund, gdy nad widokiem jest burza
  stormFlash(st, g, t) { const ph = (t + st.dayTotal * 1.7) % 6.5; this.flash = g.storm > 4 && ph < 0.25 ? 0.38 * (1 - ph / 0.25) * (ph < 0.08 || ph > 0.14 ? 1 : 0.3) : 0; },
  // Rysowanie w buforze świata (współrzędne logiczne mapy; ox, oy: położenie pola (0,0)); b: płótno procesora albo GLCtx
  draw(b, st, ox, oy) {
    if (!weatherOn() || !st || (st.map.ln && st.view)) return; // w podziemiach bez pogody
    const camX = VIEW.x - ox, camY = VIEW.y - oy, g = this.build(st, camX, camY, VIEW.w, VIEW.h); if (!g.any) return;
    G.dirty = true; // pogoda się rusza
    if (b.isGL) return GLMap.weather(b, g, ox, oy, seasonIdx(st), this.flash);
    this.drawCpu(b, g, ox, oy, seasonIdx(st));
  },
  // Procesor: mgła i cienie chmur jako mały obrazek (piksel = pole) rozciągnięty gładko na widok, do tego garść cząstek
  drawCpu(b, g, ox, oy, S) {
    const { cols, rows } = g, c = this._sky && this._sky.width === cols && this._sky.height === rows ? this._sky : (this._sky = Object.assign(document.createElement('canvas'), { width: cols, height: rows }));
    const sg = c.getContext('2d');
    if (c._ver !== g.ver) { c._ver = g.ver; const img = sg.createImageData(cols, rows), d = img.data;
    for (let k = 0; k < cols * rows * 4; k += 4) { const fog = g.sky[k] / 255, sh = g.sky[k + 1] / 255 * 0.3 + g.sky[k + 2] / 255 * 0.08, a = Math.min(1, fog * 0.7 + sh);
      const wf = a > 0 ? fog * 0.7 / a : 0; d[k] = 220 * wf + 10 * (1 - wf); d[k + 1] = 224 * wf + 12 * (1 - wf); d[k + 2] = 230 * wf + 22 * (1 - wf); d[k + 3] = a * 255; }
    sg.putImageData(img, 0, 0); }
    b.save(); b.imageSmoothingEnabled = true; b.drawImage(c, ox + g.tx0 * T, oy + g.ty0 * T, cols * T, rows * T); // piksel = pole (środek piksela w środku pola) b.restore();
    if (G.settings.quality === 'low') return;
    const t = G.time, V = VIEW, P = this.seeds(2500).subarray(0, 4 * 220), rain = [], dots = { 2: [], 4: [], 5: [] }, leaves = [];
    for (let i = 0; i < P.length; i += 4) {
      const c5 = wxClass(P[i + 3]), [x, y] = wxPos(c5, P[i], P[i + 1], P[i + 2], t, V), tx = Math.floor((x - ox) / T) - g.tx0, ty = Math.floor((y - oy) / T) - g.ty0;
      if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) continue; const k = (ty * cols + tx) * 4; if (Math.round(g.type[k] / 40) !== c5 || P[i + 2] > g.type[k + 1] / 255) continue;
      if (c5 === WX.RAIN) rain.push(x, y); else if (c5 === WX.LEAF) leaves.push(x, y, P[i]); else dots[c5].push(x, y);
    }
    if (rain.length) { b.beginPath(); for (let i = 0; i < rain.length; i += 2) { b.moveTo(rain[i], rain[i + 1]); b.lineTo(rain[i] - 2.5, rain[i + 1] - 11); } b.strokeStyle = 'rgba(190,210,240,.5)'; b.lineWidth = 1.3; b.stroke(); }
    b.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < dots[2].length; i += 2) b.fillRect(dots[2][i] - 1.5, dots[2][i + 1] - 1.5, 3, 3);
    b.fillStyle = 'rgba(120,112,108,.8)'; for (let i = 0; i < dots[4].length; i += 2) b.fillRect(dots[4][i] - 1, dots[4][i + 1] - 1, 2, 2);
    b.fillStyle = 'rgba(200,170,110,.25)'; for (let i = 0; i < dots[5].length; i += 2) b.fillRect(dots[5][i] - 6, dots[5][i + 1] - 3, 12, 6);
    for (let i = 0; i < leaves.length; i += 3) { b.fillStyle = S === 2 ? ['#c8501e', '#e0a030', '#8a3a14', '#d87a2a'][Math.floor(leaves[i + 2] * 4)] : '#f4d0dc'; b.fillRect(leaves[i] - 2.5, leaves[i + 1] - 1.2, 5, 2.4); }
    if (this.flash) { b.fillStyle = `rgba(230,240,255,${this.flash.toFixed(2)})`; b.fillRect(V.x, V.y, V.w, V.h); }
  },
  // stałe losowe ziarna cząstek (x, y, prędkość/rozmiar, rodzaj)
  seeds(N) { if (this._seeds && this._seeds.length === N * 4) return this._seeds; const r = mulberry32(911), a = new Float32Array(N * 4); for (let i = 0; i < a.length; i++) a[i] = r(); return (this._seeds = a); },
};
// Ruch cząstki rodzaju c (te same wzory co w shaderze GLMap.weather): spada i dryfuje z wiatrem, zawija się w widoku
const WX_FALL = [0, 620, 42, 34, 28, 8], WX_DRIFT = [0, 90, 18, 40, 10, 170];
const wxClass = w => (w < 0.4 ? WX.RAIN : w < 0.7 ? WX.SNOW : w < 0.8 ? WX.LEAF : w < 0.9 ? WX.ASH : WX.DUST); // podział ziaren na rodzaje (najwięcej deszczu)
function wxPos(c, sx, sy, sz, t, V) {
  const k = 0.7 + sz * 0.6, sway = c === WX.SNOW || c === WX.LEAF ? Math.sin(t * (1.3 + sz) + sx * 40) * 14 : 0, m = (a, b) => ((a % b) + b) % b;
  return [V.x + m(sx * V.w + t * WX_DRIFT[c] * k + sway, V.w), V.y + m(sy * V.h + t * WX_FALL[c] * k, V.h)];
}
