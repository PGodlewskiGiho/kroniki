// ==================== RYSOWANIE: PODSTAWY I PIXEL ART ===================================
// Czcionki, tekst, cache warstw, potok sprite'ów: rysunek wektorowy -> ostre piksele z obrysem.
const FONT_TITLE = "Cinzel, Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
// Pikselowa czcionka (domyślna; ustawienie Grafika → Czcionka): Jersey 10 wbudowana w plik gry. Rozmiary są przeskalowane
// (PIXEL_FONT_K), żeby napisy zajmowały tyle miejsca co w czcionce klasycznej; kursywy nie ma (pochyłe piksele wyglądają źle).
// PIXEL_ART = false: grafika gładka – bez ograniczonej palety, ditheringu, twardych krawędzi, schodkowych rogów
// i powiększania bez wygładzania (dawny styl pikselowy wraca po ustawieniu na true).
const PIXEL_ART = false;
const FONT_PIXEL = "'Jersey 10', 'Courier New', monospace", PIXEL_FONT_K = { title: 1.12, body: 1.1 };
const pixelFont = () => PIXEL_ART && G.settings.font !== 'classic'; // gładka grafika: zawsze czcionki klasyczne (Cinzel, Cormorant)
function font(size, weight = 700, fam = 'title', italic = false) {
  if (pixelFont()) return `400 ${Math.max(13, Math.round(size * PIXEL_FONT_K[fam === 'title' ? 'title' : 'body']))}px ${FONT_PIXEL}`; // jedna grubość (pogrubienie rozmywa piksele), najmniej 13 px
  return `${italic ? 'italic ' : ''}${weight} ${size}px ${fam === 'title' ? FONT_TITLE : FONT_BODY}`;
}
// Prostokąt z rogami: przy promieniu od 2 px róg jest schodkowy (stopnie po 2 px jak w pixel arcie), mniejsze zaokrąglenia zostają łukiem
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  if (r < 2 || !PIXEL_ART) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); return; }
  const S = rrStairs(r), R = S.slice().reverse();
  ctx.beginPath(); ctx.moveTo(x + S[0][0], y);
  for (const [dx, dy] of S) ctx.lineTo(x + w - dx, y + dy);
  for (const [dx, dy] of R) ctx.lineTo(x + w - dx, y + h - dy);
  for (const [dx, dy] of S) ctx.lineTo(x + dx, y + h - dy);
  for (const [dx, dy] of R) ctx.lineTo(x + dx, y + dy);
  ctx.closePath();
}
// Schodki rogu o promieniu r: [wcięcie, wysokość] od górnej krawędzi w dół (kroki po 2 px)
const _stairs = {};
function rrStairs(r) {
  const k = Math.round(r * 2) / 2; if (_stairs[k]) return _stairs[k];
  const u = 2, n = Math.max(1, Math.round(k / u)), out = [];
  for (let i = 0; i < n; i++) { const yy = i * u, d = k - Math.sqrt(Math.max(0, k * k - (k - yy - u / 2) ** 2)), ix = Math.max(0, Math.round(d / u) * u); out.push([ix, yy], [ix, yy + u]); }
  return (_stairs[k] = out);
}
// Napisy zawsze się mieszczą: ramki (pergamin, wnęka, gniazdo, księga, dymek) zapisują swój prostokąt w tej klatce (textBox),
// a text() sprawdza, w której ramce leży napis i ile ma miejsca do jej brzegu (zależnie od wyrównania). Za szeroki napis
// dostaje mniejszą czcionkę (do ~70%), a gdy i to za mało – jest ściśnięty w poziomie. Prostokąty w pikselach płótna
// (po przekształceniu), więc przesunięcia i skala ekranu nie przeszkadzają; nowa ramka zasłania starsze, które całe przykrywa
// (okno nad ekranem). Własna szerokość: o.max (0 = bez ograniczenia). Poza ramkami granicą jest brzeg płótna.
const TextFit = { boxes: new WeakMap(), frame: 0, log: null };
function textBox(ctx, x, y, w, h) {
  const m = ctx.getTransform(), x0 = m.a * x + m.e, y0 = m.d * y + m.f, x1 = x0 + m.a * w, y1 = y0 + m.d * h;
  let B = TextFit.boxes.get(ctx); if (!B || B.f !== TextFit.frame) TextFit.boxes.set(ctx, (B = { f: TextFit.frame, list: [] }));
  B.list = B.list.filter(b => !(b[0] >= x0 && b[1] >= y0 && b[2] <= x1 && b[3] <= y1)); B.list.push([x0, y0, x1, y1]);
}
function textRoom(ctx, x, y, align) {
  const m = ctx.getTransform(), px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f, k = Math.hypot(m.a, m.b) || 1, B = TextFit.boxes.get(ctx);
  const room = (b, pad) => { const L = px - b[0] - pad, R = b[2] - px - pad; return align === 'center' ? 2 * Math.min(L, R) : align === 'right' || align === 'end' ? L : R; };
  if (B && B.f === TextFit.frame) for (let i = B.list.length - 1; i >= 0; i--) { const b = B.list[i];
    if (px > b[0] && px < b[2] && py > b[1] && py < b[3]) { const r = room(b, Math.min(6 * k, (b[2] - b[0]) * 0.06)); if (r >= (b[2] - b[0]) * 0.25) return r / k; } } // napis przy samym brzegu ramki do niej nie należy (np. tytuł nad dwiema stronami)
  return Math.max(0, room([0, 0, ctx.canvas.width, ctx.canvas.height], 2 * k)) / k;
}
// Dopasowuje bieżącą czcionkę ctx do szerokości: zwraca maxWidth dla fillText (ściśnięcie) albo undefined
function fitFont(ctx, str, room, size, mk) {
  let w = ctx.measureText(str).width; if (w <= room + 0.5) return undefined;
  const s0 = size, min = Math.max(9, Math.floor(size * 0.7));
  while (size > min && w > room + 0.5) { size = Math.max(min, Math.min(size - 1, Math.floor(size * room / w))); ctx.font = mk(size); w = ctx.measureText(str).width; }
  if (TextFit.log) TextFit.log.push({ str: String(str), size: s0, to: size, room: Math.round(room), squeeze: w > room + 0.5 });
  return w > room + 0.5 ? room : undefined;
}
function text(ctx, str, x, y, o = {}) {
  const size = o.size || 16, mk = s => font(s, o.weight || 700, o.fam || 'body', o.italic);
  ctx.font = mk(size); ctx.fillStyle = o.color || '#2a1606'; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
  const room = o.max === 0 ? 0 : o.max || textRoom(ctx, x, y, ctx.textAlign), mw = room > 0 ? fitFont(ctx, str, room, size, mk) : undefined;
  if (mw === undefined) ctx.fillText(str, x, y); else ctx.fillText(str, x, y, mw);
}
// Zawijanie po słowach; słowo dłuższe niż cały wiersz jest dzielone na kawałki
function wrapText(ctx, str, maxW) {
  const lines = []; let cur = '';
  for (let w of String(str).split(' ')) {
    while (w.length > 1 && ctx.measureText(w).width > maxW) {
      if (cur) { lines.push(cur); cur = ''; }
      let n = w.length - 1; while (n > 1 && ctx.measureText(w.slice(0, n)).width > maxW) n--;
      lines.push(w.slice(0, n)); w = w.slice(n);
    }
    const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur); return lines;
}
// Akapit w limicie n wierszy: zawija i zmniejsza czcionkę (do ~70%), aż cały tekst się zmieści; mniejsza czcionka mieści
// więcej wierszy w tej samej wysokości (k: mnożnik odstępu wierszy). Gdy i tak za długi – ostatni wiersz kończy „…”.
function wrapFit(ctx, str, maxW, n, o = {}) {
  const size = o.size || 16, min = Math.max(9, Math.floor(size * 0.7)), mk = s => font(s, o.weight || 700, o.fam || 'body', o.italic);
  let s = size, lines, cap = n;
  for (;;) { ctx.font = mk(s); lines = wrapText(ctx, str, maxW); cap = Math.max(n, Math.floor(n * size / s + 0.01)); if (lines.length <= cap || s <= min) break; s--; }
  if (lines.length > cap) { lines = lines.slice(0, cap); let l = lines[cap - 1]; while (l.length > 1 && ctx.measureText(l + '…').width > maxW) l = l.slice(0, -1); lines[cap - 1] = l.replace(/[\s,.;:]+$/, '') + '…'; }
  return { lines, size: s, k: s / size };
}
// Złoty napis (tytuły): duże napisy w pixel arcie — malowane raz w buforze o połowie rozdzielczości (uiLayer) i powiększane bez wygładzania
function goldText(ctx, str, x, y, size, align = 'center') {
  ctx.save(); ctx.font = font(size, 700, 'title'); const room = textRoom(ctx, x, y, align), tw0 = ctx.measureText(str).width; ctx.restore();
  if (tw0 > room && room > 0) size = Math.max(12, Math.floor(size * room / tw0)); // za długi tytuł: mniejsza czcionka
  if (size < 22 || typeof uiLayer !== 'function') return goldTextPaint(ctx, str, x, y, size, align);
  ctx.save(); ctx.font = font(size, 700, 'title'); const tw = ctx.measureText(str).width; ctx.restore();
  const pad = Math.ceil(size * 0.3), w = Math.ceil(tw) + pad * 2, h = Math.ceil(size * 1.5);
  const L = uiLayer(`gold_${size}_${str}`, w, h, c => goldTextPaint(c, str, w / 2, h / 2, size, 'center'));
  drawUi(ctx, L, (align === 'center' ? x - w / 2 : align === 'left' ? x - pad : x - w + pad), y - h / 2);
}
function goldTextPaint(ctx, str, x, y, size, align = 'center') {
  ctx.save(); ctx.font = font(size, 700, 'title'); ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 7); ctx.strokeStyle = '#1a0e04'; ctx.strokeText(str, x, y);
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#fff3c0'); g.addColorStop(0.45, '#e9b94c'); g.addColorStop(0.55, '#a8721c'); g.addColorStop(1, '#f2cc66');
  ctx.fillStyle = g; ctx.fillText(str, x, y); ctx.restore();
}
// Warstwy statycznej grafiki renderowane raz (odświeżane przy zmianie skali)
const Layers = {
  cache: {}, alt: {}, // alt: ta sama warstwa w drugiej skali (ekran w jednostkach interfejsu i okno w dawnych na jednej klatce nie malują jej od nowa)
  get(key, w, h, paint, sc) {
    const s = sc || G.rs; let c = this.cache[key];
    if (c && c._s !== s) { const a = this.alt[key]; this.alt[key] = c; c = a && a._s === s ? a : null; if (c) this.cache[key] = c; } else if (!c) delete this.alt[key];
    if (!c) {
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
// Warstwa bez prostokątnej dziury (hole: x, y, w, h w jednostkach ctx): cztery pasy wokół niej. Pod oknem mapy tło i tak zakryje
// mapa, a każde przejście przez wszystkie piksele ekranu kosztuje (na słabym komputerze bez karty graficznej najwięcej w klatce)
function drawLayerAround(ctx, c, hole) {
  const m = ctx.getTransform(); if (m.b || m.c || Math.abs(m.a - c._s) > 1e-6 || Math.abs(m.d - c._s) > 1e-6) { drawLayer(ctx, c, 0, 0); return; }
  const X = v => Math.round(m.a * v + m.e), Y = v => Math.round(m.d * v + m.f), x0 = X(0), y0 = Y(0), hx0 = X(hole.x) + 2 - x0, hy0 = Y(hole.y) + 2 - y0, hx1 = X(hole.x + hole.w) - 2 - x0, hy1 = Y(hole.y + hole.h) - 2 - y0, W = c.width, H = c.height;
  if (hx1 <= hx0 || hy1 <= hy0) { drawLayer(ctx, c, 0, 0); return; }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [sx, sy, sw, sh] of [[0, 0, W, hy0], [0, hy1, W, H - hy1], [0, hy0, hx0, hy1 - hy0], [hx1, hy0, W - hx1, hy1 - hy0]]) if (sw > 0 && sh > 0) ctx.drawImage(c, sx, sy, sw, sh, x0 + sx, y0 + sy, sw, sh);
  ctx.restore();
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
// Rozmiar piksela grafiki w px logicznych: PIX_DEFAULT (1,8: niewiele drobniejszy od dawnego), 1 (drobny) albo 2 (dawny; niska jakość grafiki).
// PXD = gęstość względem dawnej grafiki (ile pikseli na dawny piksel). Zmiana czyści wszystkie gotowe obrazy (setPixelSize).
const PIX_DEFAULT = PIXEL_ART ? 1.8 : 1.25;
let PIX = PIX_DEFAULT, PXD = 2 / PIX_DEFAULT;
const PIX_CLEAR = []; // funkcje czyszczące pamięci podręczne obrazów (rejestrują je moduły grafiki)
function setPixelSize(p) {
  if (p === PIX) return; PIX = p; PXD = 2 / p; SPR.clear(); Layers.cache = {}; for (const f of PIX_CLEAR) f();
  if (typeof MapRender !== 'undefined' && MapRender.map) MapRender.reset(MapRender.map, MapRender.explored);
}
const PixBufs = {};
function pixBuf(key, w, h, read) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h)); let c = PixBufs[key];
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
  if (!PIXEL_ART) return; // grafika gładka: miękkie krawędzie i pełna paleta rysunku
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
// Płótno ma PXD razy więcej pikseli (drobny piksel); s.u = ile px logicznych zajmuje piksel płótna przy k = 1.
function sprite(key, w, h, ax, ay, draw, outline = OUTLINE, sc = 0.5) {
  let s = SPR.get(key); if (s) return s;
  const D = PXD; w = Math.ceil(w * D); h = Math.ceil(h * D); ax *= D; ay *= D;
  const c = document.createElement('canvas'); c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: true });
  c._ctx.setTransform(sc * D, 0, 0, sc * D, ax, ay); const colors = []; draw(recordingCtx(c._ctx, colors)); crispify(c, colors, outline);
  // gotowy sprite w zwykłym płótnie: robocze (willReadFrequently) Chrome trzyma w pamięci procesora, a takie kopiuje się wolniej
  const p = document.createElement('canvas'); p.width = w; p.height = h; p._ctx = p.getContext('2d'); p._ctx.drawImage(c, 0, 0);
  s = { c: p, ax, ay, u: 2 / D }; SPR.set(key, s); return s;
}
// Sprite w interfejsie: (x, y) = punkt zaczepienia w px logicznych; k = 1 to rozmiar jak na mapie
// (1 piksel grafiki = 2 px logiczne), k = 2 dwa razy większy itd.
function drawSprite(ctx, s, x, y, k = 1) {
  const f = (s.u || 2) * k; ctx.save(); ctx.imageSmoothingEnabled = !!s.raw || !PIXEL_ART; if (s.raw || !PIXEL_ART) ctx.imageSmoothingQuality = 'high'; // grafika bez pikselizacji: gładkie skalowanie
  ctx.drawImage(s.c, x - s.ax * f, y - s.ay * f, s.c.width * f, s.c.height * f); ctx.restore();
}
// To samo, ale (x, y) = lewy górny róg sprite'a
const drawSpriteBox = (ctx, s, x, y, k = 1) => drawSprite(ctx, s, x + s.ax * (s.u || 2) * k, y + s.ay * (s.u || 2) * k, k);
// Sprite w buforze mapy (bufor ma rozdzielczość pikseli grafiki, więc 1 piksel sprite'a = 1 piksel bufora)
function blit(b, s, lx, ly) { const u = s.u || 2; if (!PIXEL_ART) return b.drawImage(s.c, lx - s.ax * u, ly - s.ay * u, s.c.width * u, s.c.height * u); b.drawImage(s.c, Math.round(lx / u) * u - s.ax * u, Math.round(ly / u) * u - s.ay * u, s.c.width * u, s.c.height * u); }
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// Warstwa pixel art dla rysunków ruchomych (efekty czarów, sceny okien wyniku): rysunek trafia do bufora o rozdzielczości
// 1/px (px = ile pikseli ekranu na piksel grafiki; 2 jak mapa i jednostki w bitwie), dostaje ograniczoną paletę z ditheringiem
// i trzy twarde stopnie krycia (bez miękkich krawędzi), a potem jest powiększany bez wygładzania. add: nakładanie addytywne (światło).
function pixLayer(key, ctx, x, y, w, h, draw, o = {}) {
  const px = o.px || PIX, bw = Math.ceil(w / px), bh = Math.ceil(h / px), c = pixBuf(key, bw, bh, true), g = c._ctx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, bw, bh);
  g.save(); g.setTransform(1 / px, 0, 0, 1 / px, -x / px, -y / px); draw(g); g.restore();
  if (PIXEL_ART) crispLayer(c, o.step || 24);
  ctx.save(); ctx.imageSmoothingEnabled = !PIXEL_ART; if (o.add) ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(c, x, y, bw * px, bh * px); ctx.restore();
}
function crispLayer(c, step) {
  if (!PIXEL_ART) return;
  const g = c._ctx, w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k += 4) {
    const a = d[k + 3]; if (!a) continue; const b = BAYER4[(y & 3) * 4 + (x & 3)] / 16, lv = Math.min(2, Math.floor(a / 255 * 2 + b));
    if (!lv) { d[k + 3] = 0; continue; } d[k + 3] = lv === 2 ? 255 : 150; const o = (b - 0.5) * step;
    d[k] = clamp(Math.round((d[k] + o) / step) * step, 0, 255); d[k + 1] = clamp(Math.round((d[k + 1] + o) / step) * step, 0, 255); d[k + 2] = clamp(Math.round((d[k + 2] + o) / step) * step, 0, 255);
  }
  g.putImageData(img, 0, 0);
}
// Ograniczona paleta z ditheringiem (styl pikselowy jak na mapie)
function pixelQuantize(cv, step = 18) {
  if (!PIXEL_ART || !cv || !cv.getContext) return;
  const g = cv.getContext('2d'), w = cv.width, h = cv.height, img = g.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k += 4) {
    const o = (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * step;
    d[k] = clamp(Math.round((d[k] + o) / step) * step, 0, 255); d[k + 1] = clamp(Math.round((d[k + 1] + o) / step) * step, 0, 255); d[k + 2] = clamp(Math.round((d[k + 2] + o) / step) * step, 0, 255);
  }
  g.putImageData(img, 0, 0);
}

