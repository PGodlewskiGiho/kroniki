// ==================== MIASTO: SZCZEGÓŁY TŁA (grafika bez pikselizacji) =================
// Tło sceny miasta zostaje malowane w 2D, ale bez pikselizacji płaskie plamy koloru wyglądały ubogo. Te przejścia dokładają
// to, co dawniej udawało ziarno ditheringu: chmury z bryłą (oświetlone od słońca, cień od spodu, smugi), góry ze stokami
// w świetle i w cieniu, żlebami i śniegiem, las z koronami w świetle, wzgórza z fakturą i krzakami, wodę z odbiciem nieba
// i błyskami, kwiaty i kamienie w trawie oraz miękkie cienie budowli rzucane w prawo (światło z lewej, jak w modelach 3D).
// Wołane z paintTownWorld, gdy TOWN_RAW.

// Chmury: każda ławica z wielu kłębów; kłąb = jasny wierzch od strony słońca, ciemny spód, miękka krawędź; na dole smugi
function skyDetail(c, P) {
  if (P.cave) return;
  const r = mulberry32(141 + (P.seed || 0)), [sunX, sunY] = P.sun, [lr, lg, lb] = rgbOf(P.cloudLit), [dr, dg, db] = rgbOf(P.cloudDark);
  c.save(); c.beginPath(); c.rect(8, 8, 576, 200); c.clip();
  // chmury z szumu (fBm): gęstość -> kształt z miękką krawędzią, oświetlenie z różnicy gęstości w stronę słońca (wierzch jasny, spód ciemny)
  const CW = 296, CH = 110, cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const cg = cv.getContext('2d'), img = cg.createImageData(CW, CH), d = img.data;
  const seed = (P.seed || 0) % 9973, hash = (x, y) => { let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
  const fbm = (x, y) => { let a = 0.5, f = 1, s2 = 0; for (let o = 0; o < 5; o++) { s2 += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s2; };
  const dens = (x, y) => { const band = Math.sin(y / CH * Math.PI * 1.2 + 0.2), stretch = fbm(x / 46, y / 15); return stretch * (0.55 + 0.45 * band) - (y / CH) * 0.12; };
  const sd = Math.sign(sunX - 296) || -1, cover = P.cover || 0.41;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const v = dens(x, y), a = Math.min(1, Math.max(0, (v - cover) / 0.09)); const i = (y * CW + x) * 4; if (a <= 0) continue;
    const lit = Math.min(1, Math.max(0, 0.5 + (v - dens(x + sd * 2.5, y - 2.5)) * 9)); // gęściej od strony słońca = cień, rzadziej = światło na brzegu
    const k = Math.min(1, lit * (1.05 - (y / CH) * 0.35));
    d[i] = dr + (lr - dr) * k; d[i + 1] = dg + (lg - dg) * k; d[i + 2] = db + (lb - db) * k; d[i + 3] = 255 * a * 0.95;
  }
  cg.putImageData(img, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(cv, 8, 8, 576, CH * 576 / CW);
  for (let k = 0; k < 14; k++) { const y = 30 + r() * 140, x = 8 + r() * 576, w = 40 + r() * 140; c.strokeStyle = `rgba(${lr},${lg},${lb},${(0.06 + r() * 0.1).toFixed(2)})`; c.lineWidth = 1 + r() * 1.5; c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y - 3 + r() * 6, x + w / 2, y + r() * 4); c.stroke(); } // pierzaste smugi
  if (!P.moon && !P.stars) { const g = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, 70); g.addColorStop(0, 'rgba(255,240,200,.5)'); g.addColorStop(1, 'rgba(255,220,160,0)'); c.fillStyle = g; c.fillRect(sunX - 70, sunY - 70, 140, 140); }
  c.restore();
}
const rgbOf = col => { if (col.startsWith('#')) return hexRgb(col); const m = col.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [200, 200, 200]; };

// Grzbiet gór jak ridge() (te same losowania), z rzeźbą: stoki w świetle i cieniu, żleby, warstwy skał, śnieg na szczytach
function ridgeDetail(c, seed, base, amp, col, snow = false) {
  const r = mulberry32(seed), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, x0 = -OX - (OX % 6), pts = [];
  for (let x = x0; x <= W + OX + 6; x += 6) { const n = Math.sin(x * 0.009 + p1) * 0.5 + Math.sin(x * 0.023 + p2) * 0.3 + Math.sin(x * 0.061 + p3) * 0.15 + (r() - 0.5) * 0.08; pts.push([x, base - amp * (0.55 + n * 0.6)]); }
  const path = () => { c.beginPath(); c.moveTo(x0, H + OY); for (const [x, y] of pts) c.lineTo(x, y); c.lineTo(W + OX + 6, H + OY); c.closePath(); };
  c.save(); path(); c.clip(); const q = mulberry32(seed * 13 + 5), [cr, cg, cb] = rgbOf(col);
  for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], dy = pts[i + 1][1] - pts[i - 1][1]; // stok opadający w prawo (dy > 0) patrzy na słońce z lewej
    const lit = dy > 0, a = Math.min(0.32, Math.abs(dy) * 0.02 + 0.06), len = 30 + q() * (base - y + 40);
    c.strokeStyle = lit ? `rgba(255,236,200,${a.toFixed(2)})` : `rgba(10,12,30,${(a * 1.3).toFixed(2)})`; c.lineWidth = 3 + q() * 4; c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x + (lit ? 1 : -1) * (6 + q() * 10), y + len); c.stroke();
    if (q() < 0.35) { c.strokeStyle = `rgba(${cr * 0.55 | 0},${cg * 0.55 | 0},${cb * 0.6 | 0},.35)`; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 6); c.quadraticCurveTo(x + 4, y + 20, x + (q() - 0.5) * 8, y + 30 + q() * 30); c.stroke(); } // żleby
  }
  if (snow) for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i]; if (y > base - amp * 0.95) continue; c.fillStyle = 'rgba(244,246,255,.85)'; c.beginPath(); c.moveTo(x - 7, y + 9 + q() * 4); c.lineTo(x, y); c.lineTo(x + 7, y + 7 + q() * 6); c.closePath(); c.fill(); }
  const g = c.createLinearGradient(0, base - amp, 0, base + 10); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(200,210,230,.28)'); c.fillStyle = g; c.fillRect(x0, base - amp * 1.4, W + 2 * OX + 12, amp * 1.6); // mgła u podnóża
  c.restore(); c.strokeStyle = 'rgba(255,240,215,.22)'; c.lineWidth = 1; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}

// Las na widnokręgu: korony z jasną stroną od słońca, ciemną z prawej i drobnymi listkami
function forestDetail(c, Wd) {
  const r = mulberry32(29 + (Wd.seed || 0)), trees = [];
  for (let i = 0; i < 220; i++) { const X = (r() - 0.5) * 3200, Z = 3.2 + r() * 1.3; trees.push([X, Z, r(), r()]); }
  trees.sort((a, b) => b[1] - a[1]); const q = mulberry32(77 + (Wd.seed || 0));
  for (const [X, Z, k1] of trees) { const [sx, sy, s] = proj(X, Z); if (sx < -20 || sx > 612) continue; const h = (44 + k1 * 36) * s, cy = sy - h * 0.55, rx = h * 0.42, ry = h * 0.6;
    c.fillStyle = 'rgba(255,236,170,.16)'; c.beginPath(); c.ellipse(sx - rx * 0.3, cy - ry * 0.3, rx * 0.55, ry * 0.5, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,10,20,.22)'; c.beginPath(); c.ellipse(sx + rx * 0.35, cy + ry * 0.2, rx * 0.55, ry * 0.65, 0, 0, TAU); c.fill();
    for (let k = 0; k < 5; k++) { c.fillStyle = q() < 0.5 ? 'rgba(255,240,180,.18)' : 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(sx + (q() - 0.5) * rx * 1.4, cy + (q() - 0.5) * ry * 1.4, Math.max(0.6, rx * 0.16), 0, TAU); c.fill(); } }
}

// Wzgórze: faktura trawy, krzaki z cieniem, jasna krawędź od słońca
function hillDetail(c, Hl) {
  const [sx, sy, s] = proj(Hl.X, Hl.Z), rw = Hl.rx * s, hh = Hl.h * s, top = x => sy - hh * Math.pow(Math.max(0, 1 - (x / rw) ** 2), Hl.flat || 0.65), r = mulberry32(Math.round(Hl.X * 3 + 11));
  c.save(); c.beginPath(); c.moveTo(sx - rw - 30, sy + 10); for (let x = -rw; x <= rw; x += 3) c.lineTo(sx + x, top(x)); c.lineTo(sx + rw + 30, sy + 10); c.closePath(); c.clip();
  for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * rw * 2, y = top(x) + 2 + r() * (sy - top(x) + 8); c.fillStyle = r() < 0.5 ? 'rgba(10,20,6,.22)' : 'rgba(220,230,160,.14)'; c.fillRect(sx + x, y, 1 + r() * 1.5 * s * 2, 1); }
  if (!Hl.rock) for (let i = 0; i < 14; i++) { const x = (r() - 0.5) * rw * 1.6, y = top(x) + 6 + r() * (sy - top(x)), R = (5 + r() * 7) * s * 2;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(sx + x + R * 0.5, y + R * 0.4, R, R * 0.35, 0, 0, TAU); c.fill();
    c.fillStyle = shadeHex(Hl.cols[1], -0.2); c.beginPath(); c.arc(sx + x, y - R * 0.3, R * 0.8, 0, TAU); c.fill(); c.fillStyle = shadeHex(Hl.cols[0], 0.1); c.beginPath(); c.arc(sx + x - R * 0.25, y - R * 0.55, R * 0.45, 0, TAU); c.fill(); }
  c.restore();
}

// Woda rzeki: odbicie nieba (jaśniej pośrodku), lśnienia, ciemny pas cienia przy brzegu
function riverDetail(c, Rv) {
  if (Rv.chasm) return; const pts = subdiv(Rv.pts, 6), [L, R] = ribbon(pts, Rv.w), r = mulberry32(83);
  c.save(); ribbonPath(c, L, R); c.clip();
  c.strokeStyle = 'rgba(220,235,255,.18)'; c.lineWidth = 6; c.beginPath(); pts.forEach((p, i) => { const [x, y] = proj(p[0], p[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  c.strokeStyle = 'rgba(0,10,20,.35)'; c.lineWidth = 3; c.beginPath(); L.forEach(([x, y], i) => i ? c.lineTo(x, y + 1.5) : c.moveTo(x, y + 1.5)); c.stroke();
  for (let i = 0; i < 90; i++) { const k = r() * (pts.length - 1), i0 = Math.floor(k), p = pts[i0], q = pts[i0 + 1], f = k - i0, off = (r() - 0.5) * Rv.w * 0.9, [x, y, s] = proj(p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f + off / 300);
    c.fillStyle = `rgba(255,250,230,${(0.25 + r() * 0.5).toFixed(2)})`; c.fillRect(x, y, Math.max(1, (2 + r() * 5) * s), Math.max(0.6, 0.8 * s)); }
  c.restore();
}

// Trawa przy ziemi: kępki kwiatów, kamyki, ciemniejsze kępy (gęściej i większe bliżej widza)
function meadowDetail(c, Wd) {
  const r = mulberry32(203 + (Wd.seed || 0)), flowers = ['#f0e070', '#f4f0f0', '#d8a0e0', '#f08a5a', '#a8c8f0'];
  for (let i = 0; i < 220; i++) { const X = (r() - 0.5) * 1500, Z = 0.85 + Math.pow(r(), 0.7) * 2.6, [sx, sy, s] = proj(X, Z); if (sx < 8 || sx > 584 || sy > 430) continue; const k = r();
    if (k < 0.45) { const col = flowers[Math.floor(r() * flowers.length)]; for (let j = 0; j < 4; j++) { c.fillStyle = col; c.fillRect(sx + (r() - 0.5) * 10 * s, sy - r() * 3 * s, Math.max(1, 1.6 * s), Math.max(1, 1.6 * s)); } }
    else if (k < 0.65) { const R = (1.5 + r() * 2.5) * s; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(sx + R * 0.4, sy + R * 0.3, R * 1.1, R * 0.45, 0, 0, TAU); c.fill(); c.fillStyle = '#9a968a'; c.beginPath(); c.ellipse(sx, sy, R, R * 0.7, 0, 0, TAU); c.fill(); c.fillStyle = '#c8c4b4'; c.beginPath(); c.ellipse(sx - R * 0.3, sy - R * 0.3, R * 0.45, R * 0.3, 0, 0, TAU); c.fill(); }
    else { c.fillStyle = 'rgba(12,30,8,.35)'; c.beginPath(); c.ellipse(sx, sy, (6 + r() * 10) * s, (2 + r() * 2) * s, 0, 0, TAU); c.fill(); } }
}

// Miękki cień budowli: rzucony w prawo i lekko w głąb (słońce z lewej), rozmyty, mocniejszy przy podstawie
function softShadow(c, s, dir) {
  const { x, b, w, h } = s, k = h * 0.55 * dir, up = h * 0.2;
  c.save(); c.filter = 'blur(3px)';
  const g = c.createLinearGradient(x, b, x + k, b - up); g.addColorStop(0, 'rgba(10,14,30,.42)'); g.addColorStop(1, 'rgba(10,14,30,.05)'); c.fillStyle = g;
  c.beginPath(); c.moveTo(x + w * 0.08, b + 1); c.lineTo(x + w * 0.92, b + 1); c.lineTo(x + w * 0.92 + k, b - up); c.lineTo(x + w * 0.2 + k, b - up); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x + w / 2, b, w * 0.5, 4, 0, 0, TAU); c.fill(); c.restore();
}
