// ==================== RYSOWANIE: PODSTAWY I PIXEL ART ===================================
// Czcionki, tekst, cache warstw, potok sprite'ów: rysunek wektorowy -> ostre piksele z obrysem.
const FONT_TITLE = "Cinzel, Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
function font(size, weight = 700, fam = 'title', italic = false) {
  return `${italic ? 'italic ' : ''}${weight} ${size}px ${fam === 'title' ? FONT_TITLE : FONT_BODY}`;
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function text(ctx, str, x, y, o = {}) {
  ctx.font = font(o.size || 16, o.weight || 700, o.fam || 'body', o.italic);
  ctx.fillStyle = o.color || '#2a1606'; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}
function wrapText(ctx, str, maxW) {
  const lines = []; let cur = '';
  for (const w of str.split(' ')) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function goldText(ctx, str, x, y, size, align = 'center') {
  ctx.save(); ctx.font = font(size, 700, 'title'); ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 7); ctx.strokeStyle = '#1a0e04'; ctx.strokeText(str, x, y);
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#fff3c0'); g.addColorStop(0.45, '#e9b94c'); g.addColorStop(0.55, '#a8721c'); g.addColorStop(1, '#f2cc66');
  ctx.fillStyle = g; ctx.fillText(str, x, y); ctx.restore();
}
// Warstwy statycznej grafiki renderowane raz (odświeżane przy zmianie skali)
const Layers = {
  cache: {},
  get(key, w, h, paint, sc) {
    const s = sc || G.rs; let c = this.cache[key];
    if (!c || c._s !== s) {
      c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * s)); c.height = Math.max(1, Math.ceil(h * s));
      const cx = c.getContext('2d'); cx.setTransform(s, 0, 0, s, 0, 0); paint(cx, w, h); c._s = s; this.cache[key] = c;
    }
    return c;
  },
};
// Warstwa w naturalnym rozmiarze: piksel warstwy = piksel płótna (bez skalowania i filtrowania, które na słabym komputerze kosztuje najwięcej)
function drawLayer(ctx, c, x, y) {
  const m = ctx.getTransform();
  if (m.b || m.c || Math.abs(m.a - c._s) > 1e-6 || Math.abs(m.d - c._s) > 1e-6) { ctx.drawImage(c, x, y, c.width / c._s, c.height / c._s); return; }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, Math.round(m.a * x + m.e), Math.round(m.d * y + m.f)); ctx.restore(); // w całych pikselach
}
let _noiseCanvas = null;
 
const _patterns = new WeakMap();
function noise(ctx) {
  if (!_noiseCanvas) {
    _noiseCanvas = document.createElement('canvas'); _noiseCanvas.width = _noiseCanvas.height = 96;
    const x = _noiseCanvas.getContext('2d'); const img = x.createImageData(96, 96); const r = mulberry32(7);
    for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 34; }
    x.putImageData(img, 0, 0);
  }
  let p = _patterns.get(ctx); if (!p) { p = ctx.createPattern(_noiseCanvas, 'repeat'); _patterns.set(ctx, p); }
  return p;
}
function circ(g, x, y, rad, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); }
function shadowAt(g, x, y, w) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 3, y, w, w * 0.38, 0, 0, TAU); g.fill(); }
// Mapa to pixel art: AP = pikseli grafiki na pole (połowa T), OUTLINE = kolor obrysu sprite'ów.
// Ramki, przyciski i tekst interfejsu są gładkie; obiekty gry wszędzie są sprite'ami (patrz GRAFIKA OBIEKTÓW).
const AP = 16, OUTLINE = [24, 16, 10];
const PixBufs = {};
function pixBuf(key, w, h, read) {
  let c = PixBufs[key];
  if (!c || c.width !== w || c.height !== h) { c = document.createElement('canvas'); c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: !!read }); PixBufs[key] = c; }
  return c;
}
// --- sprite'y: rysunek wektorowy -> twarde krawędzie, kolory przyciągane do użytej palety, ciemny obrys ---
// Paletę sprite'a tworzą kolory przypisane do fillStyle/strokeStyle podczas rysowania (recordingCtx).
// Gradienty nie są kolorami, dlatego rysunki z gradientem najpierw przypisują jego kolory na próbę,
// np. `c.fillStyle = A.wall[0]; c.fillStyle = A.wall[1];` – to celowe, nie pomyłka.
function colorToRgb(c) {
  if (typeof c !== 'string') return null;
  if (c[0] === '#' && c.length === 7) return hexRgb(c);
  const m = c.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2]]; }
  return null;
}
function recordingCtx(g, colors) {
  return new Proxy(g, {
    get(t, p) { const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; },
    set(t, p, v) { if (p === 'fillStyle' || p === 'strokeStyle') { const c = colorToRgb(v); if (c) colors.push(c); } t[p] = v; return true; },
  });
}
function crispify(c, colors, outline) {
  const g = c._ctx, w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data, A = new Uint8Array(w * h), cache = new Map();
  const snap = (r, gg, b) => {
    const key = (r << 16) | (gg << 8) | b; let v = cache.get(key); if (v) return v; let bd = 1e9;
    for (const p of colors) { const dr = r - p[0], dg = gg - p[1], db = b - p[2], dd = dr * dr * 2 + dg * dg * 3 + db * db; if (dd < bd) { bd = dd; v = p; } }
    cache.set(key, v); return v;
  };
  for (let k = 0, i = 0; k < w * h; k++, i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    d[i + 3] = 255; A[k] = 1; if (colors.length) { const p = snap(d[i], d[i + 1], d[i + 2]); d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; }
  }
  if (outline) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x; if (A[k]) continue;
    if ((x > 0 && A[k - 1]) || (x < w - 1 && A[k + 1]) || (y > 0 && A[k - w]) || (y < h - 1 && A[k + w])) { const i = k * 4; d[i] = outline[0]; d[i + 1] = outline[1]; d[i + 2] = outline[2]; d[i + 3] = 255; }
  }
  g.putImageData(img, 0, 0);
}
const SPR = new Map();
// Sprite = rysunek wektorowy zamieniony raz na pixel art i zapamiętany pod kluczem.
// w, h, ax, ay: rozmiar i punkt zaczepienia w pikselach grafiki; draw() rysuje w jednostkach mapy wokół (0,0).
// sc: ile pikseli grafiki na jednostkę mapy (0.5 = standard mapy; mniejsze = miniatura tego samego rysunku).
function sprite(key, w, h, ax, ay, draw, outline = OUTLINE, sc = 0.5) {
  let s = SPR.get(key); if (s) return s;
  const c = document.createElement('canvas'); c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: true });
  c._ctx.setTransform(sc, 0, 0, sc, ax, ay); const colors = []; draw(recordingCtx(c._ctx, colors)); crispify(c, colors, outline);
  s = { c, ax, ay }; SPR.set(key, s); return s;
}
// Sprite w interfejsie: (x, y) = punkt zaczepienia w px logicznych; k = 1 to rozmiar jak na mapie
// (1 piksel grafiki = 2 px logiczne), k = 2 dwa razy większy itd.
function drawSprite(ctx, s, x, y, k = 1) {
  const f = 2 * k; ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(s.c, x - s.ax * f, y - s.ay * f, s.c.width * f, s.c.height * f); ctx.restore();
}
// To samo, ale (x, y) = lewy górny róg sprite'a
const drawSpriteBox = (ctx, s, x, y, k = 1) => drawSprite(ctx, s, x + s.ax * 2 * k, y + s.ay * 2 * k, k);
// Sprite w buforze mapy (bufor ma połowę rozdzielczości, więc 1 piksel grafiki = 1 piksel bufora)
function blit(b, s, lx, ly) { b.drawImage(s.c, Math.round(lx / 2) * 2 - s.ax * 2, Math.round(ly / 2) * 2 - s.ay * 2, s.c.width * 2, s.c.height * 2); }
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// Ograniczona paleta z ditheringiem (styl pikselowy jak na mapie)
function pixelQuantize(cv, step = 18) {
  if (!cv || !cv.getContext) return;
  const g = cv.getContext('2d'), w = cv.width, h = cv.height, img = g.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k += 4) {
    const o = (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * step;
    d[k] = clamp(Math.round((d[k] + o) / step) * step, 0, 255); d[k + 1] = clamp(Math.round((d[k + 1] + o) / step) * step, 0, 255); d[k + 2] = clamp(Math.round((d[k + 2] + o) / step) * step, 0, 255);
  }
  g.putImageData(img, 0, 0);
}

