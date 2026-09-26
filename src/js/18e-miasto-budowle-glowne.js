// ==================== MIASTO: BUDOWLE GŁÓWNE FRAKCJI ======================================
// Ratusz (4 poziomy), fort (3), gildia (5), karczma, rynek, kuźnia i magazyn. Każda frakcja ma własną architekturę
// i sylwetkę: Przystań to zamek z fosą, Knieja żyjące drzewa, Kurhan kopce i obeliski, Twierdza pale i schodkowe
// piramidy, Inferno twarze demonów i lawa, Akademia cebulaste kopuły i latające skały, Loch fasady wykute w skale,
// Cytadela jurty, kły i cyklopowe głazy. Siedliska (dw1–dw7) są w plikach MIASTO: GRAFIKA i MIASTO: <frakcja>.
// Budowla dostaje s = { x, b, w, h } (lewy dolny róg, podstawa b), poziom (tier), kolor gracza i fx (okna, dym, blask).

// --- klocki wspólne ---
const sh = shadeHex;
function slabRect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = sh(col, 0.18); c.fillRect(x, y, w, Math.min(2, h)); c.fillStyle = sh(col, -0.3); c.fillRect(x, y + h - 2, w, 2); }
function archPath(c, x, b, w, h) { c.beginPath(); c.moveTo(x, b); c.lineTo(x, b - h + w / 2); c.arc(x + w / 2, b - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, b); c.closePath(); }
function pointedPath(c, x, b, w, h) { c.beginPath(); c.moveTo(x, b); c.lineTo(x, b - h * 0.6); c.quadraticCurveTo(x, b - h * 0.9, x + w / 2, b - h); c.quadraticCurveTo(x + w, b - h * 0.9, x + w, b - h * 0.6); c.lineTo(x + w, b); c.closePath(); }
function arcade(c, x, b, w, h, n, dark = '#1e140c', inner) { // rząd łuków (podcienie); inner: kolor światła w środku
  const aw = w / n; for (let i = 0; i < n; i++) { c.fillStyle = dark; archPath(c, x + i * aw + aw * 0.14, b, aw * 0.72, h); c.fill(); if (inner) { c.fillStyle = inner; c.fillRect(x + i * aw + aw * 0.3, b - h * 0.3, aw * 0.4, h * 0.3); } }
}
function stepGable(c, A, x, y, w, h, steps = 3) { // schodkowy szczyt kamienicy
  c.fillStyle = A.wall[0]; const sw = w / (steps * 2 + 1), sh2 = h / (steps + 1);
  for (let i = 0; i <= steps; i++) c.fillRect(x + i * sw, y - (i + 1) * sh2, w - i * sw * 2, sh2 + 0.5);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i <= steps; i++) c.fillRect(x + w - (i + 1) * sw, y - (i + 1) * sh2, sw * 0.5, sh2);
}
function onion(c, cx, y, r, col, fx, glow) { // cebulasta kopuła, podstawa y, wysokość ~2r
  const dk = sh(col, -0.32); c.fillStyle = col;
  c.beginPath(); c.moveTo(cx - r * 0.8, y); c.bezierCurveTo(cx - r * 1.35, y - r * 0.8, cx - r * 0.35, y - r * 1.3, cx, y - r * 2.05); c.bezierCurveTo(cx + r * 0.35, y - r * 1.3, cx + r * 1.35, y - r * 0.8, cx + r * 0.8, y); c.closePath(); c.fill();
  c.fillStyle = dk; c.beginPath(); c.moveTo(cx + r * 0.1, y); c.bezierCurveTo(cx + r * 0.55, y - r * 0.8, cx + r * 0.2, y - r * 1.3, cx, y - r * 2.05); c.bezierCurveTo(cx + r * 0.35, y - r * 1.3, cx + r * 1.35, y - r * 0.8, cx + r * 0.8, y); c.closePath(); c.fill();
  c.fillStyle = sh(col, 0.35); c.beginPath(); c.ellipse(cx - r * 0.42, y - r * 0.85, r * 0.14, r * 0.34, -0.3, 0, TAU); c.fill();
  c.fillStyle = dk; c.fillRect(cx - r * 0.85, y - 1.5, r * 1.7, 3);
  c.strokeStyle = sh(col, -0.45); c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, y - r * 2.05); c.lineTo(cx, y - r * 2.05 - 7); c.stroke(); circ(c, cx, y - r * 2.05 - 8, 1.8, glow || col);
  if (fx && glow) fx.glows.push([cx, y - r, r * 1.8, glow]);
}
function hemiDome(c, cx, y, r, col, rh = r) { // półkulista kopuła z połyskiem
  c.fillStyle = sh(col, -0.3); c.beginPath(); c.ellipse(cx, y, r, rh, 0, Math.PI, 0); c.closePath(); c.fill();
  c.fillStyle = col; c.beginPath(); c.ellipse(cx - r * 0.1, y, r * 0.88, rh * 0.94, 0, Math.PI, 0); c.closePath(); c.fill();
  c.fillStyle = sh(col, 0.35); c.beginPath(); c.ellipse(cx - r * 0.42, y - rh * 0.55, r * 0.16, rh * 0.3, -0.4, 0, TAU); c.fill();
  c.fillStyle = sh(col, -0.45); c.fillRect(cx - r - 1, y - 1.5, r * 2 + 2, 3);
}
function roundTower(c, A, cx, b, w, h, roof, rh, fx, glow) { // okrągła baszta: mur, okno, stożkowy dach (roof = null: blanki)
  wallRect(c, A, cx - w / 2, b - h, w, h); archWin(c, cx - 3, b - h + 10, 6, 10, glow || A.glow, fx);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(cx - w / 2, b - h + 2, w, 2.5);
  if (roof) cone(c, roof, cx, b - h, w, rh); else crenel(c, A, cx - w / 2, b - h, w);
}
function lantern(c, x, y, len, col, fx) { // wisząca latarnia na sznurku
  c.strokeStyle = '#2a1e14'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + len); c.stroke();
  c.fillStyle = '#2a1e14'; c.fillRect(x - 3, y + len, 6, 7); c.fillStyle = col; c.fillRect(x - 2, y + len + 1.5, 4, 4); if (fx) fx.glows.push([x, y + len + 3, 12, col]);
}
function bench(c, x, b, w, col = '#6a4424') { c.fillStyle = col; c.fillRect(x, b - 7, w, 3); c.fillRect(x + 1, b - 5, 2, 5); c.fillRect(x + w - 3, b - 5, 2, 5); }
function sack(c, x, b, s = 1, col = '#c8b080') { c.fillStyle = col; c.beginPath(); c.ellipse(x, b - 5 * s, 5 * s, 6 * s, 0, 0, TAU); c.fill(); c.fillStyle = sh(col, -0.3); c.fillRect(x - 2 * s, b - 12 * s, 4 * s, 2 * s); }
function flame(c, x, y, s, fx, col = '#ffa030') { // płomień (podstawa y)
  c.fillStyle = sh(col, -0.2); c.beginPath(); c.moveTo(x - 5 * s, y); c.quadraticCurveTo(x - 6 * s, y - 8 * s, x, y - 16 * s); c.quadraticCurveTo(x + 6 * s, y - 8 * s, x + 5 * s, y); c.closePath(); c.fill();
  c.fillStyle = '#ffe070'; c.beginPath(); c.moveTo(x - 2.5 * s, y); c.quadraticCurveTo(x - 3 * s, y - 5 * s, x, y - 9 * s); c.quadraticCurveTo(x + 3 * s, y - 5 * s, x + 2.5 * s, y); c.closePath(); c.fill();
  if (fx) fx.glows.push([x, y - 7 * s, 18 * s, col]);
}
function rockPoly(c, pts, col, seed = 5) { // skała: bryła, ciemniejsza prawa strona, jasne krawędzie i szczeliny
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), r = mulberry32(seed);
  fillPoly(c, pts, col); c.save(); c.beginPath(); pts.forEach(([a, d], i) => i ? c.lineTo(a, d) : c.moveTo(a, d)); c.closePath(); c.clip();
  c.fillStyle = sh(col, -0.26); c.fillRect(x0 + (x1 - x0) * 0.58, y0, x1 - x0, y1 - y0);
  c.strokeStyle = sh(col, -0.4); c.lineWidth = 1.2; for (let i = 0; i < 5; i++) { const px = x0 + r() * (x1 - x0), py = y0 + r() * (y1 - y0); c.beginPath(); c.moveTo(px, py); c.lineTo(px + (r() - 0.5) * 10, py + 6 + r() * 8); c.stroke(); }
  c.fillStyle = sh(col, 0.16); for (let i = 0; i < 6; i++) c.fillRect(x0 + r() * (x1 - x0) * 0.55, y0 + r() * (y1 - y0), 5, 2);
  c.restore();
}

// ==================== PRZYSTAŃ: gotyk i renesans, mur pruski, zamek z fosą ====================
Object.assign(BUILD_ART.haven, {
  hall(c, A, s, tier, col, fx) { // ratusz z muru pruskiego z dzwonnicą z boku; wyżej kamienny magistrat, na końcu kapitol ze złotą kopułą
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier <= 2) {
      const bx = x + (tier === 2 ? w * 0.26 : w * 0.12), bw = w * 0.5, g = h * 0.27, up = h * 0.23, top = b - g - up;
      if (tier === 2) { const lx = x + 2, lw = w * 0.25, lt = b - h * 0.46; wallRect(c, A, lx, lt, lw, h * 0.46); stepGable(c, A, lx, lt, lw, h * 0.22); for (let r = 0; r < 2; r++) archWin(c, lx + lw / 2 - 4, lt + 8 + r * 20, 8, 12, A.glow, fx); bannerArt(c, lx + lw / 2, lt - h * 0.22 - 14, col); }
      wallRect(c, A, bx, b - g, bw, g); arcade(c, bx + 3, b, bw - 6, g - 5, 4, '#2a1c10', sh(A.glow, -0.3));
      timber(c, bx, top, bw, up); for (let i = 0; i < 3; i++) winArt(c, A, bx + bw * (0.2 + i * 0.3) - 4, top + 7, 8, 9, fx);
      roofArt(c, GABLE, A.roof.dw, bx - 2, top, bw + 4, h * 0.3);
      c.fillStyle = PAL.plaster; c.fillRect(bx + bw * 0.42, top - h * 0.14, 12, 10); roofArt(c, GABLE, A.roof.dw, bx + bw * 0.42 - 2, top - h * 0.14, 16, 7); winArt(c, A, bx + bw * 0.42 + 3, top - h * 0.14 + 2, 6, 6, fx); // lukarna
      const tw = 28, tx = bx + bw - 10, tt = b - h * (tier === 2 ? 1.02 : 0.92); wallRect(c, A, tx, tt, tw, b - tt);
      c.fillStyle = '#1e140c'; archPath(c, tx + 7, tt + 22, 14, 14); c.fill(); c.fillStyle = '#c8a040'; c.beginPath(); c.arc(tx + 14, tt + 15, 3.5, 0, TAU); c.fill(); // dzwon
      circ(c, tx + 14, tt + 38, 8, '#f4efe0'); c.strokeStyle = '#2a1a0e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx + 14, tt + 38); c.lineTo(tx + 14, tt + 32); c.moveTo(tx + 14, tt + 38); c.lineTo(tx + 18, tt + 40); c.stroke();
      cone(c, A.roof.tower, tx + 14, tt, tw, 30); bannerArt(c, tx + 14, tt - 50, col);
      doorArt(c, A, bx + bw * 0.3 - 8, b, 16, 20);
      return;
    }
    const big = tier === 4, mw = w * (big ? 0.78 : 0.62), mx = cx - mw / 2, mt = b - h * 0.5;
    if (big) for (const tx of [x + 2, x + w - 24]) { wallRect(c, A, tx, b - h * 0.86, 22, h * 0.86); archWin(c, tx + 7, b - h * 0.8, 8, 14, A.glow, fx); hemiDome(c, tx + 11, b - h * 0.86, 12, A.roof.tower, 14); bannerArt(c, tx + 11, b - h * 0.86 - 34, col); }
    else { const tx = mx + mw - 14, tt = b - h * 0.95; wallRect(c, A, tx, tt, 24, b - tt); archWin(c, tx + 8, tt + 10, 8, 14, A.glow, fx); circ(c, tx + 12, tt + 36, 6, '#f4efe0'); hemiDome(c, tx + 12, tt, 13, A.roof.tower, 12); c.fillStyle = A.trim; c.fillRect(tx + 11, tt - 22, 2, 10); }
    wallRect(c, A, mx, mt, mw, b - mt);
    c.fillStyle = sh(A.wall[0], 0.12); for (let i = 0; i <= 6; i++) c.fillRect(mx + i * (mw - 5) / 6, mt, 4, b - mt); // pilastry
    for (let i = 0; i < 6; i++) if (i !== 2 && i !== 3) { archWin(c, mx + (i + 0.5) * mw / 6 - 4, mt + 8, 8, 13, A.glow, fx); archWin(c, mx + (i + 0.5) * mw / 6 - 4, mt + 30, 8, 13, A.glow, fx); }
    c.fillStyle = A.trim; c.fillRect(mx - 2, mt - 3, mw + 4, 4); for (let px = mx; px < mx + mw; px += 6) c.fillRect(px, mt - 8, 2.5, 5); c.fillRect(mx - 2, mt - 9, mw + 4, 2); // attyka z tralkami
    if (big) { const dr = w * 0.17; wallRect(c, A, cx - dr, mt - 26, dr * 2, 26); for (let i = 0; i < 4; i++) archWin(c, cx - dr + 6 + i * (dr * 2 - 12) / 3 - 3, mt - 21, 6, 12, A.glow, fx); hemiDome(c, cx, mt - 26, dr + 4, PAL.gold, dr + 12); wallRect(c, A, cx - 5, mt - 26 - dr - 24, 10, 12); cone(c, PAL.gold, cx, mt - 26 - dr - 24, 10, 10); bannerArt(c, cx, mt - dr - 86, col); }
    else { hemiDome(c, cx, mt - 9, w * 0.14, '#6f9ab8', w * 0.16); }
    const pw = big ? 70 : 54, pt = b - 40; c.fillStyle = PAL.marble; for (let i = 0; i < (big ? 6 : 4); i++) c.fillRect(cx - pw / 2 + 3 + i * (pw - 10) / (big ? 5 : 3), pt, 4, 38); // portyk
    c.fillStyle = PAL.marbleD; c.fillRect(cx - pw / 2 - 3, pt - 4, pw + 6, 4); fillPoly(c, [[cx - pw / 2 - 5, pt - 4], [cx, pt - 18], [cx + pw / 2 + 5, pt - 4]], PAL.marble); fillPoly(c, [[cx, pt - 18], [cx + pw / 2 + 5, pt - 4], [cx, pt - 4]], PAL.marbleD);
    doorArt(c, A, cx - 8, b, 16, 24);
    if (big) { c.fillStyle = '#a8a49a'; c.beginPath(); c.ellipse(cx, b + 6, 20, 5, 0, 0, TAU); c.fill(); c.fillStyle = '#6aa8d8'; c.beginPath(); c.ellipse(cx, b + 5, 16, 3.5, 0, 0, TAU); c.fill(); limb(c, cx, b + 4, cx, b - 10, 2.5, '#b8dcf0'); fx.glows.push([cx, b - 4, 14, '#c8e8ff']); } // fontanna
  },
  fort(c, A, s, tier, col, fx) { // mur z machikułami nad fosą, brama między dwiema okrągłymi basztami, zwodzony most; wyżej donżon i smukłe wieże
    const { x, b, w, h } = s, cx = x + w / 2, mb = b - 8;
    if (tier >= 3) { const lx = x + w * 0.2, lt = b - h * 1.1; wallRect(c, A, lx, lt, 26, mb - lt); for (let r = 0; r < 3; r++) archWin(c, lx + 9, lt + 12 + r * 22, 8, 12, A.glow, fx); cone(c, A.roof.tower, lx + 13, lt, 26, 42); bannerArt(c, lx + 13, lt - 62, col); }
    if (tier >= 2) {
      const kw = tier >= 3 ? 62 : 52, kh = h * (tier >= 3 ? 0.96 : 0.8), kx = cx + 6, kt = b - kh; wallRect(c, A, kx, kt, kw, mb - kt); crenel(c, A, kx, kt, kw);
      for (let r = 0; r < (tier >= 3 ? 3 : 2); r++) for (let i = 0; i < 2; i++) archWin(c, kx + kw * (0.28 + i * 0.44) - 3.5, kt + 12 + r * 20, 7, 12, A.glow, fx);
      for (const tx of [kx - 5, kx + kw - 7]) { wallRect(c, A, tx, kt - 14, 12, 26); cone(c, A.roof.wall, tx + 6, kt - 14, 12, 18); } // wieżyczki narożne
      bannerArt(c, kx + kw / 2, kt - 34, col);
      if (tier >= 3) { const tx = kx + kw + 6, tt = b - h * 0.84; wallRect(c, A, tx, tt, 18, mb - tt); archWin(c, tx + 5, tt + 12, 8, 12, A.glow, fx); cone(c, A.roof.tower, tx + 9, tt, 18, 34); }
    }
    c.fillStyle = '#3a5a78'; c.fillRect(x, mb, w, 8); c.fillStyle = '#5a7a98'; c.fillRect(x, mb + 1, w, 1.5); c.fillStyle = sh(A.wall[1], -0.2); c.fillRect(x, mb - 2, w, 2); // fosa
    const wh = h * 0.32, wy = mb - wh; wallRect(c, A, x + 10, wy, w - 20, wh); crenel(c, A, x + 10, wy, w - 20);
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let px = x + 12; px < x + w - 12; px += 7) c.fillRect(px, wy + 1, 3, 3); // machikuły
    for (const tx of [x, x + w - 22]) { wallRect(c, A, tx, mb - h * 0.44, 22, h * 0.44); crenel(c, A, tx, mb - h * 0.44, 22); archWin(c, tx + 7.5, mb - h * 0.44 + 12, 7, 11, A.glow, fx); }
    const gh = h * (tier >= 2 ? 0.6 : 0.52);
    for (const dx of [-25, 25]) roundTower(c, A, cx + dx, mb, 24, gh, tier >= 2 ? A.roof.wall : null, 26, fx);
    wallRect(c, A, cx - 14, mb - h * 0.44, 28, h * 0.44); crenel(c, A, cx - 14, mb - h * 0.44, 28);
    c.fillStyle = '#140c06'; archPath(c, cx - 10, mb, 20, 24); c.fill();
    c.strokeStyle = '#7a7a82'; c.lineWidth = 1; c.beginPath(); for (let i = -7; i <= 7; i += 3.5) { c.moveTo(cx + i, mb - 22); c.lineTo(cx + i, mb - 9); } for (let j = 0; j < 3; j++) { c.moveTo(cx - 9, mb - 20 + j * 5); c.lineTo(cx + 9, mb - 20 + j * 5); } c.stroke(); // brona
    fillPoly(c, [[cx - 10, mb], [cx + 10, mb], [cx + 12, b + 2], [cx - 12, b + 2]], '#7a5230'); c.fillStyle = '#4a2e18'; for (let j = 0; j < 4; j++) c.fillRect(cx - 11, mb + 1.5 + j * 2.4, 22, 0.8); // zwodzony most
    c.strokeStyle = '#3a3a40'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 12, mb - 22); c.lineTo(cx - 12, b + 1); c.moveTo(cx + 12, mb - 22); c.lineTo(cx + 12, b + 1); c.stroke();
    c.fillStyle = A.trim; c.fillRect(cx - 5, mb - h * 0.44 + 6, 10, 8); drawEmblem(c, 'cross', cx, mb - h * 0.44 + 10, 7, '#a8442e');
  },
  guild(c, A, s, tier, col, fx) { // gotycka gildia: kaplica z rozetą i przyporami, na niej kondygnacje (po jednej na poziom) i iglica z gwiazdą
    const { x, b, w, h } = s, cx = x + w / 2, bw = w * 0.86, bh = h * 0.3, bt = b - bh;
    for (const sd of [-1, 1]) fillPoly(c, [[cx + sd * bw / 2, bt + 8], [cx + sd * (bw / 2 + 10), b], [cx + sd * (bw / 2 + 4), b], [cx + sd * bw / 2, b - 10]], A.wall[1]); // przypory
    wallRect(c, A, cx - bw / 2, bt, bw, bh); c.fillStyle = '#1e140c'; pointedPath(c, cx - 7, b, 14, 22); c.fill();
    circ(c, cx, bt + 14, 9, '#2a1e30'); c.strokeStyle = A.trim; c.lineWidth = 1.2; c.beginPath(); c.arc(cx, bt + 14, 9, 0, TAU); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; circ(c, cx + Math.cos(a) * 5, bt + 14 + Math.sin(a) * 5, 2.2, ['#6a9ae0', '#e05a4a', '#e0c050', '#6ac07a'][i % 4]); } fx.glows.push([cx, bt + 14, 16, '#b8dcff']);
    let y = bt, sw = w * 0.66; const sh3 = h * 0.1;
    for (let i = 0; i < tier; i++) {
      wallRect(c, A, cx - sw / 2, y - sh3, sw, sh3); c.fillStyle = sh(A.wall[1], -0.2); c.fillRect(cx - sw / 2 - 2, y - 2, sw + 4, 3);
      c.fillStyle = '#1e140c'; pointedPath(c, cx - 3.5, y - 3, 7, sh3 - 6); c.fill(); c.fillStyle = '#b8dcff'; pointedPath(c, cx - 2, y - 4, 4, sh3 - 9); c.fill(); fx.wins.push([cx - 2, y - sh3 + 5, 4, sh3 - 9, '#b8dcff']);
      for (const sd of [-1, 1]) fillPoly(c, [[cx + sd * sw / 2, y - sh3], [cx + sd * (sw / 2 + 2), y - sh3 - 7], [cx + sd * (sw / 2 - 3), y - sh3]], A.wall[0]); // sterczyny
      y -= sh3; sw *= 0.86;
    }
    cone(c, A.roof.tower, cx, y, sw, 30 + tier * 4); c.fillStyle = PAL.gold; star(c, cx, y - 38 - tier * 4, 5 + tier * 0.4); fx.glows.push([cx, y - 38 - tier * 4, 12 + tier * 2, '#ffe890']);
  },
  tavern(c, A, s, tier, col, fx) { // karczma z nadwieszonym piętrem, ogródek z ławą i beczkami, szyld z kuflem
    const { x, b, w, h } = s, bw = w * 0.62, bx = x + 4, g = h * 0.3, up = h * 0.3, top = b - g - up;
    wallRect(c, A, bx, b - g, bw, g); archWin(c, bx + 6, b - g + 6, 9, 12, A.glow, fx); archWin(c, bx + bw - 15, b - g + 6, 9, 12, A.glow, fx); doorArt(c, A, bx + bw / 2 - 7, b, 14, 19);
    timber(c, bx - 4, top, bw + 8, up); c.fillStyle = PAL.beam; c.fillRect(bx - 5, b - g - 2, bw + 10, 3); // nadwieszone piętro
    for (const wx of [bx + 4, bx + bw - 12]) { winArt(c, A, wx, top + 7, 8, 8, fx); c.fillStyle = '#6a4a2a'; c.fillRect(wx - 1, top + 16, 10, 3); for (let k = 0; k < 3; k++) circ(c, wx + 1.5 + k * 3, top + 15, 1.6, ['#e04a5a', '#f0d040', '#e080c0'][k]); }
    roofArt(c, GABLE, A.roof.util, bx - 6, top, bw + 12, h * 0.34); c.fillStyle = PAL.stoneD; c.fillRect(bx + bw * 0.72, top - h * 0.36, 8, h * 0.28); fx.smokes.push([bx + bw * 0.72 + 4, top - h * 0.37]);
    c.strokeStyle = '#2a1a0e'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + bw + 4, top + 6); c.lineTo(bx + bw + 20, top + 6); c.stroke();
    c.fillStyle = '#7a5430'; rr(c, bx + bw + 7, top + 9, 15, 13, 2); c.fill(); drawEmblem(c, 'mug', bx + bw + 14.5, top + 15.5, 10, '#f4e2a8');
    const gx = bx + bw + 6; c.fillStyle = '#6a4424'; c.fillRect(gx, b - 10, 22, 3); c.fillRect(gx + 3, b - 8, 2, 8); c.fillRect(gx + 17, b - 8, 2, 8); bench(c, gx - 2, b, 8); barrel(c, x + w - 4, b);
    c.fillStyle = '#e8d8a0'; c.fillRect(gx + 5, b - 13, 3, 3); c.fillRect(gx + 13, b - 13, 3, 3); // kufle
  },
  market(c, A, s, tier, col, fx) { // sukiennice: długa hala z podcieniami, attyka z grzebieniem, kramy pod łukami
    const { x, b, w, h } = s, bw = w - 8, bx = x + 4, top = b - h * 0.78;
    wallRect(c, A, bx, top, bw, b - top); const n = 6, aw = bw / n;
    for (let i = 0; i < n; i++) { c.fillStyle = '#2a1c10'; archPath(c, bx + i * aw + 3, b, aw - 6, h * 0.42); c.fill(); c.fillStyle = ['#c83a2a', '#2f5bd0', '#3a8a3a', '#e8b030', '#b83ab0', '#e87a2a'][i]; c.fillRect(bx + i * aw + 5, b - h * 0.14, aw - 10, 4); circ(c, bx + i * aw + aw / 2, b - h * 0.14 - 2, 2.2, ['#e8b030', '#d83a2a', '#6aa83a'][i % 3]); }
    for (let i = 0; i < n; i++) winArt(c, A, bx + i * aw + aw / 2 - 3.5, top + 7, 7, 8, fx);
    c.fillStyle = A.trim; c.fillRect(bx - 2, top - 3, bw + 4, 3); c.fillStyle = A.wall[0]; c.fillRect(bx, top - 12, bw, 9);
    for (let px = bx + 2; px < bx + bw - 3; px += 9) { c.fillStyle = A.wall[0]; fillPoly(c, [[px, top - 12], [px + 2.5, top - 20], [px + 5, top - 12]], A.wall[0]); circ(c, px + 2.5, top - 8, 1.4, '#6a5a4a'); } // grzebień attyki
    for (const px of [bx + 4, bx + bw - 4]) { wallRect(c, A, px - 5, top - 26, 10, 26); cone(c, A.roof.tower, px, top - 26, 10, 14); }
  },
  smith(c, A, s, tier, col, fx) { // kamienna kuźnia z otwartym frontem pod daszkiem, palenisko, kowadło, koryto z wodą, podkowa nad wejściem
    const { x, b, w, h } = s, bw = w * 0.74, bx = x + 2, top = b - h * 0.56;
    wallRect(c, A, bx, top, bw, b - top); c.fillStyle = '#140c08'; c.fillRect(bx + 6, b - h * 0.4, bw * 0.62, h * 0.4);
    const gx = bx + 6 + bw * 0.2; c.fillStyle = '#6a5a4a'; c.fillRect(gx - 9, b - 10, 18, 10); c.fillStyle = '#ff8a2a'; c.fillRect(gx - 7, b - 13, 14, 4); circ(c, gx, b - 13, 5, '#ffc050'); fx.glows.push([gx, b - 14, 26, '#ff9a3a']);
    c.fillStyle = '#3a2a1a'; c.fillRect(bx + 6 + bw * 0.44, b - 14, 10, 5); drawEmblem(c, 'anvil', bx + 6 + bw * 0.49, b - 5, 12, '#40404a');
    fillPoly(c, [[bx - 3, b - h * 0.4], [bx + bw * 0.72, b - h * 0.4], [bx + bw * 0.72, b - h * 0.46], [bx - 3, b - h * 0.5]], A.roof.util); // daszek nad frontem
    roofArt(c, GABLE, A.roof.util, bx, top, bw, h * 0.26); c.fillStyle = PAL.stoneD; c.fillRect(bx + bw * 0.74, top - h * 0.34, 10, h * 0.34); fx.smokes.push([bx + bw * 0.74 + 5, top - h * 0.35]);
    c.strokeStyle = '#a8a8b0'; c.lineWidth = 2.4; c.beginPath(); c.arc(bx + bw * 0.4, top + 8, 4, 0.2, Math.PI - 0.2, true); c.stroke(); // podkowa
    c.fillStyle = '#6a4424'; c.fillRect(x + w - 20, b - 7, 18, 7); c.fillStyle = '#4a8ac8'; c.fillRect(x + w - 18, b - 6, 14, 2); // koryto
  },
  silo(c, A, s, tier, col, fx) { // wiatrak: kamienna wieża, drewniana czapa i cztery skrzydła, worki z mąką u stóp
    const { x, b, w, h } = s, cx = x + w * 0.42, tw = w * 0.36, top = b - h * 0.62;
    fillPoly(c, [[cx - tw / 2, b], [cx - tw * 0.36, top], [cx + tw * 0.36, top], [cx + tw / 2, b]], A.wall[0]); fillPoly(c, [[cx + tw * 0.1, b], [cx + tw * 0.08, top], [cx + tw * 0.36, top], [cx + tw / 2, b]], A.wall[1]);
    doorArt(c, A, cx - 5, b, 10, 14); winArt(c, A, cx - 3, top + 12, 6, 6, fx);
    fillPoly(c, [[cx - tw * 0.44, top + 1], [cx, top - 14], [cx + tw * 0.44, top + 1]], A.roof.util);
    const hx = cx, hy = top - 4;
    for (let k = 0; k < 4; k++) { const a = 0.5 + k * Math.PI / 2; c.save(); c.translate(hx, hy); c.rotate(a); c.fillStyle = '#5a3a20'; c.fillRect(-1.2, 0, 2.4, 34); c.fillStyle = '#e8e0cc'; c.fillRect(1.2, 8, 7, 24); c.strokeStyle = '#5a3a20'; c.lineWidth = 0.8; for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(1.2, 12 + j * 5); c.lineTo(8.2, 12 + j * 5); c.stroke(); } c.restore(); }
    circ(c, hx, hy, 3, '#3a2a1a'); sack(c, x + w * 0.78, b, 1); sack(c, x + w * 0.9, b, 0.8, '#d8c090');
  },
});

// ==================== KNIEJA: żyjące drzewa, pomosty, cierniste żywopłoty, kręgi druidów ====================
function roundWin(c, x, y, r, glow, fx) { circ(c, x, y, r + 1.5, '#2a1a0c'); circ(c, x, y, r, glow); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x - 0.5, y - r, 1, r * 2); if (fx) fx.wins.push([x - r, y - r, r * 2, r * 2, glow]); }
function deck(c, cx, y, w, fx, lamps) { // drewniany pomost wokół pnia z balustradą (i latarniami)
  c.fillStyle = '#5a3c20'; c.fillRect(cx - w / 2, y, w, 4); c.fillStyle = '#7a5530'; c.fillRect(cx - w / 2, y, w, 1.5);
  for (const sd of [-1, 1]) limb(c, cx + sd * w * 0.3, y + 4, cx + sd * w * 0.1, y + 14, 1.6, '#4a3018');
  c.fillStyle = '#6a4a2c'; for (let px = cx - w / 2; px <= cx + w / 2; px += 7) c.fillRect(px, y - 7, 1.6, 7); c.fillRect(cx - w / 2, y - 8, w, 1.6);
  if (lamps) for (const sd of [-1, 1]) lantern(c, cx + sd * (w / 2 - 2), y + 4, 4, '#fff0a0', fx);
}
function leafRoof(c, cx, y, w, h, col) { // elfi dach w kształcie liścia z żyłką
  c.fillStyle = col; c.beginPath(); c.moveTo(cx - w / 2, y); c.quadraticCurveTo(cx - w * 0.42, y - h * 0.7, cx, y - h); c.quadraticCurveTo(cx + w * 0.42, y - h * 0.7, cx + w / 2, y); c.quadraticCurveTo(cx, y - h * 0.18, cx - w / 2, y); c.fill();
  c.fillStyle = sh(col, -0.25); c.beginPath(); c.moveTo(cx, y - h); c.quadraticCurveTo(cx + w * 0.42, y - h * 0.7, cx + w / 2, y); c.quadraticCurveTo(cx + w * 0.2, y - h * 0.12, cx, y - h * 0.1); c.fill();
  c.strokeStyle = sh(col, 0.3); c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, y - h * 0.12); c.lineTo(cx, y - h * 0.9); c.stroke();
}
function hedge(c, x0, x1, b, h, r) { // cierniste krzaki z różami
  c.fillStyle = '#23421f'; c.fillRect(x0, b - h * 0.7, x1 - x0, h * 0.7);
  for (let px = x0; px <= x1; px += 9) { const k = 0.8 + r() * 0.4; circ(c, px, b - h * 0.72, 8 * k, '#2e5a2a'); circ(c, px - 2, b - h * 0.8, 5 * k, '#3e7a34'); }
  c.fillStyle = '#5a3a20'; for (let px = x0 + 3; px < x1; px += 7) fillPoly(c, [[px, b - h * (0.3 + r() * 0.4)], [px + 4, b - h * 0.5], [px + 1, b - h * 0.42]], '#5a3a20');
  for (let px = x0 + 5; px < x1; px += 13) circ(c, px, b - h * (0.6 + r() * 0.3), 2, r() < 0.5 ? '#e04a5a' : '#f0e0e8');
}
Object.assign(BUILD_ART.sylvan, {
  hall(c, A, s, tier, col, fx) { // wielkie drzewo z drzwiami w pniu, pomosty z latarniami, wyżej drugie drzewo z mostem linowym i elfi pawilon, na końcu złota korona
    const { x, b, w, h } = s, cx = x + w * (tier >= 2 ? 0.4 : 0.5), th = h * (0.78 + tier * 0.06), tw = 34 + tier * 3, gold = tier === 4;
    if (tier >= 2) { // drugie drzewo i most linowy
      const ox = x + w * 0.86, oh = h * 0.6; trunk(c, ox, b, 20, oh, '#6a4a2c'); canopy(c, ox, b - oh - 8, 24, gold ? '#b8a030' : '#3e7a34', 21);
      deck(c, ox, b - oh * 0.55, 34, fx, false); roundWin(c, ox, b - 16, 4, A.glow, fx);
      c.strokeStyle = '#4a3018'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx + tw / 2, b - th * 0.5); c.quadraticCurveTo((cx + ox) / 2, b - th * 0.5 + 14, ox - 17, b - oh * 0.55); c.stroke();
      c.fillStyle = '#7a5530'; for (let k = 1; k < 8; k++) { const f = k / 8, px = cx + tw / 2 + (ox - 17 - cx - tw / 2) * f, py = (1 - f) * (1 - f) * (b - th * 0.5) + 2 * f * (1 - f) * (b - th * 0.5 + 14) + f * f * (b - oh * 0.55); c.fillRect(px - 1.5, py, 3, 3); }
      lantern(c, (cx + ox) / 2, b - th * 0.5 + 7, 5, '#fff0a0', fx);
    }
    for (const sd of [-1, 1]) { c.strokeStyle = '#5a3c20'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx + sd * tw * 0.3, b - 6); c.quadraticCurveTo(cx + sd * tw * 0.7, b - 2, cx + sd * tw, b + 2); c.stroke(); } // korzenie
    trunk(c, cx, b, tw, th, '#6a4a2c');
    canopy(c, cx - 18, b - th + 6, 26 + tier * 3, gold ? '#a88a28' : '#2e6a30', 12); canopy(c, cx + 20, b - th + 2, 24 + tier * 3, gold ? '#c8a838' : '#3a7a34', 13); canopy(c, cx, b - th - 14, 30 + tier * 4, gold ? '#e0c050' : '#4a8a3a', 11);
    if (gold) for (let i = 0; i < 7; i++) { const fx0 = cx - 34 + (i * 53) % 70, fy = b - th - 20 + (i * 37) % 30; circ(c, fx0, fy, 2.6, '#fff4b0'); fx.glows.push([fx0, fy, 9, '#fff0a0']); } // świecące owoce
    doorArt(c, A, cx - 8, b, 16, 22); roundWin(c, cx - 7, b - th * 0.36, 4, A.glow, fx); roundWin(c, cx + 8, b - th * 0.5, 3.5, A.glow, fx);
    deck(c, cx, b - th * 0.42, tw + 30, fx, true);
    if (tier >= 3) { // elfi pawilon na górnym pomoście
      const py = b - th * 0.7; deck(c, cx, py, tw + 22, fx, false);
      c.fillStyle = PAL.marble; for (const dx of [-14, -5, 5, 14]) c.fillRect(cx + dx - 1.5, py - 18, 3, 18); leafRoof(c, cx, py - 18, 40, 22, A.roof.hall);
      roundWin(c, cx, py - 9, 3, A.glow, fx);
    }
    bannerArt(c, cx + tw / 2 + 6, b - th * 0.42 - 26, col);
  },
  fort(c, A, s, tier, col, fx) { // cierniste żywopłoty, brama z dwóch splecionych drzew, drzewa-baszty z pomostami łuczników; wyżej prastare drzewo z twarzą
    const { x, b, w, h } = s, cx = x + w / 2, r = mulberry32(17);
    if (tier >= 2) { // prastare drzewo-strażnik
      const big = tier >= 3, kh = h * (big ? 1.18 : 0.96), kw = big ? 40 : 32; trunk(c, cx + 4, b - 10, kw, kh, '#5a3e24');
      for (const sd of [-1, 1]) { circ(c, cx + 4 + sd * 7, b - kh * 0.55, 4, '#1a1008'); circ(c, cx + 4 + sd * 7, b - kh * 0.55, 1.8, '#c8f070'); fx.glows.push([cx + 4 + sd * 7, b - kh * 0.55, 8, '#c8f070']); } // oczy w korze
      c.fillStyle = '#1a1008'; c.beginPath(); c.ellipse(cx + 4, b - kh * 0.4, 7, 3, 0, 0, TAU); c.fill();
      canopy(c, cx - 16, b - kh + 8, big ? 34 : 26, '#2a5a28', 7); canopy(c, cx + 24, b - kh + 4, big ? 32 : 24, '#346a2e', 8); canopy(c, cx + 4, b - kh - 12, big ? 40 : 30, '#3e7a34', 9);
      deck(c, cx + 4, b - kh * 0.72, kw + 26, fx, true);
      if (big) { deck(c, cx + 4, b - kh * 0.9, kw + 14, fx, false); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, rx = cx + 4 + Math.cos(a) * (kw * 0.7), ry = b - kh * 0.3 + Math.sin(a) * 6; circ(c, rx, ry, 2, '#9af0c0'); fx.glows.push([rx, ry, 8, '#9af0c0']); } } // runy wokół pnia
      bannerArt(c, cx + 4 + kw / 2 + 4, b - kh * 0.72 - 24, col);
    }
    hedge(c, x + 20, cx - 20, b, h * 0.3, r); hedge(c, cx + 20, x + w - 20, b, h * 0.3, r);
    for (const tx of [x + 12, x + w - 12]) { // drzewa-baszty
      const th = h * (tier >= 2 ? 0.74 : 0.62); trunk(c, tx, b, 20, th, '#6a4a2c'); deck(c, tx, b - th + 10, 34, fx, false);
      canopy(c, tx, b - th - 8, 18, '#3a7a34', tx | 0); roundWin(c, tx, b - th * 0.45, 3, A.glow, fx);
    }
    c.strokeStyle = '#5a3e24'; c.lineCap = 'round'; for (const sd of [-1, 1]) { c.lineWidth = 7; c.beginPath(); c.moveTo(cx + sd * 18, b); c.quadraticCurveTo(cx + sd * 20, b - h * 0.38, cx + sd * 1, b - h * 0.52); c.stroke(); } // brama z dwóch drzew
    canopy(c, cx, b - h * 0.56, 14, '#4a8a3a', 3);
    c.strokeStyle = '#6ab84a'; c.lineWidth = 1.4; c.beginPath(); for (let i = -12; i <= 12; i += 6) { c.moveTo(cx + i - 4, b); c.lineTo(cx + i + 4, b - 26); c.moveTo(cx + i + 4, b); c.lineTo(cx + i - 4, b - 26); } c.stroke(); // pleciona brama z pnączy
  },
  guild(c, A, s, tier, col, fx) { // krąg druidów: menhiry, źródełko księżyca, trylit i srebrne drzewo rosnące z każdym poziomem
    const { x, b, w, h } = s, cx = x + w / 2;
    c.fillStyle = '#4a7a3a'; c.beginPath(); c.ellipse(cx, b - 4, w * 0.58, 10, 0, 0, TAU); c.fill();
    if (tier >= 3) { for (const dx of [-13, 13]) menhir(c, cx + dx, b - 8, 11, 50 + tier * 3, '#7a7a70'); c.fillStyle = '#6a6a62'; c.fillRect(cx - 21, b - 64 - tier * 3, 42, 8); c.fillStyle = '#8a8a80'; c.fillRect(cx - 21, b - 64 - tier * 3, 42, 2); } // trylit
    const th = 34 + tier * 16; trunk(c, cx, b - 8, 7 + tier, th, '#c8c4b0'); canopy(c, cx, b - 8 - th - 4, 10 + tier * 4, '#a8e0c8', 5 + tier);
    if (tier >= 4) for (let i = 0; i < 5; i++) { const lx = cx - 12 + (i * 37) % 26, ly = b - th - 14 + (i * 23) % 18; circ(c, lx, ly, 1.8, '#f0fff8'); fx.glows.push([lx, ly, 8, '#c8fff0']); }
    if (tier >= 2) { c.fillStyle = '#3a6a8a'; c.beginPath(); c.ellipse(cx, b - 2, 11, 3.5, 0, 0, TAU); c.fill(); c.fillStyle = '#a8f0e0'; c.beginPath(); c.ellipse(cx - 2, b - 2.5, 7, 2, 0, 0, TAU); c.fill(); fx.glows.push([cx, b - 4, 20, '#9af0e0']); } // źródełko
    const n = Math.min(7, 2 + tier); for (let i = 0; i < n; i++) { const a = Math.PI * (0.05 + 0.9 * i / (n - 1)), mx = cx - Math.cos(a) * w * 0.52; menhir(c, mx, b - 2 + Math.sin(a) * 3, 9, 18 + tier * 2 + (i % 2) * 4, '#8a8a80', '#8af0b8'); }
    if (tier >= 5) { const oy = b - th - 42; c.strokeStyle = '#c8fff0'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, oy, 12, 4, 0, 0, TAU); c.stroke(); circ(c, cx, oy, 4, '#f0fff8'); fx.glows.push([cx, oy, 24, '#9af0e0']); }
  },
  tavern(c, A, s, tier, col, fx) { // karczma w wielkim muchomorze, girlanda latarni
    const { x, b, w, h } = s, cx = x + w * 0.42, sw = w * 0.56, sh2 = h * 0.5;
    c.fillStyle = '#e8dcc0'; c.fillStyle = '#b8a888'; const g = c.createLinearGradient(cx - sw / 2, 0, cx + sw / 2, 0); g.addColorStop(0, '#e8dcc0'); g.addColorStop(1, '#b8a888'); c.fillStyle = g;
    c.beginPath(); c.moveTo(cx - sw / 2 - 6, b); c.quadraticCurveTo(cx - sw / 2, b - sh2 * 0.4, cx - sw / 2 + 4, b - sh2); c.lineTo(cx + sw / 2 - 4, b - sh2); c.quadraticCurveTo(cx + sw / 2, b - sh2 * 0.4, cx + sw / 2 + 6, b); c.closePath(); c.fill(); // trzon
    const capY = b - sh2 + 2; c.fillStyle = '#b8342a'; c.beginPath(); c.ellipse(cx, capY, sw * 0.86, h * 0.36, 0, Math.PI, 0); c.closePath(); c.fill(); c.fillStyle = '#8a2420'; c.beginPath(); c.ellipse(cx + sw * 0.2, capY, sw * 0.66, h * 0.3, 0, Math.PI * 1.5, 0); c.lineTo(cx + sw * 0.2, capY); c.closePath(); c.fill();
    c.fillStyle = '#e8dcc0'; c.fillRect(cx - sw * 0.86, capY - 2, sw * 1.72, 3); for (const [dx, dy, r2] of [[-0.5, -0.35, 4], [-0.1, -0.7, 5], [0.35, -0.45, 4], [0.6, -0.15, 3], [-0.7, -0.12, 3]]) circ(c, cx + dx * sw, capY + dy * h * 0.36, r2, '#f4ecd8'); // kropki
    c.fillStyle = '#4a3018'; c.fillRect(cx + sw * 0.3, capY - h * 0.44, 6, h * 0.14); fx.smokes.push([cx + sw * 0.3 + 3, capY - h * 0.45]);
    roundWin(c, cx - sw * 0.28, b - sh2 * 0.6, 4, A.glow, fx); roundWin(c, cx + sw * 0.28, b - sh2 * 0.6, 4, A.glow, fx); doorArt(c, A, cx - 7, b, 14, 19);
    c.strokeStyle = '#3a2a14'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + sw * 0.8, capY + 2); c.quadraticCurveTo(x + w - 10, b - sh2 * 0.4, x + w - 2, b - 30); c.stroke(); for (let i = 1; i < 4; i++) { const px = cx + sw * 0.8 + i * (x + w - 2 - cx - sw * 0.8) / 4; circ(c, px, capY + 6 + i * 4, 2, ['#f0d060', '#80e0c0', '#f09060'][i - 1]); fx.glows.push([px, capY + 6 + i * 4, 7, '#fff0a0']); }
    signArt(c, A, 'mug', x + w - 6, b - 28, 28, false); barrel(c, x + w - 18, b);
  },
  market(c, A, s, tier, col, fx) { // targ pod pergolą z pnączy: kosze owoców, girlandy kwiatów, latarnie
    const { x, b, w, h } = s, n = 3, aw = (w - 8) / n, top = b - h * 0.78;
    c.fillStyle = '#8a7a5a'; c.beginPath(); c.ellipse(x + w / 2, b - 4, w / 2, 8, 0, 0, TAU); c.fill();
    for (let i = 0; i < n; i++) {
      const ax = x + 4 + i * aw; c.strokeStyle = '#5a3c20'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax + 3, b); c.lineTo(ax + 3, top + 10); c.quadraticCurveTo(ax + aw / 2, top - 8, ax + aw - 3, top + 10); c.lineTo(ax + aw - 3, b); c.stroke();
      for (const [dx, cl] of [[0.3, '#e8a030'], [0.62, '#c83a4a']]) { const kx = ax + aw * dx; c.fillStyle = '#8a5a2a'; c.beginPath(); c.ellipse(kx, b - 6, 7, 5, 0, 0, Math.PI); c.fill(); c.fillRect(kx - 7, b - 9, 14, 3); for (let k = 0; k < 4; k++) circ(c, kx - 4.5 + k * 3, b - 10, 2, k % 2 ? cl : '#8ac04a'); }
      lantern(c, ax + aw / 2, top + 4, 7, '#fff0a0', fx);
    }
    for (let px = x + 4; px <= x + w - 4; px += 8) { circ(c, px, top + 4, 6, '#2e6a30'); circ(c, px - 1, top, 4, '#4a8a3a'); } // dach z liści
    for (let px = x + 8; px < x + w - 6; px += 11) circ(c, px, top + 8 + (px % 3), 2, ['#f070a0', '#f0e060', '#ffffff', '#b080f0'][px % 4 | 0]); // kwiaty
  },
  smith(c, A, s, tier, col, fx) { // pracownia łuczarza w wielkim pniu: dach z liści, stojak z łukami, tarcza strzelnicza, beczka strzał
    const { x, b, w, h } = s, cx = x + w * 0.34, tw = w * 0.5, th = h * 0.5;
    trunk(c, cx, b, tw, th, '#7a5530'); c.fillStyle = '#c8a070'; c.beginPath(); c.ellipse(cx, b - th, tw / 2, 5, 0, 0, TAU); c.fill(); c.strokeStyle = '#8a6a40'; c.lineWidth = 0.8; for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(cx, b - th, tw / 2 * k / 4, 5 * k / 4, 0, 0, TAU); c.stroke(); } // słoje
    canopy(c, cx, b - th - 10, 18, '#3e7a34', 33); doorArt(c, A, cx - 6, b, 12, 17); roundWin(c, cx + 9, b - th * 0.6, 3, A.glow, fx); fx.smokes.push([cx - 8, b - th - 16]);
    const rx = x + w * 0.66; c.fillStyle = '#5a3c20'; c.fillRect(rx, b - 26, 2.5, 26); c.fillRect(rx + 16, b - 26, 2.5, 26); c.fillRect(rx, b - 24, 18.5, 2); // stojak
    c.strokeStyle = '#8a5a2a'; c.lineWidth = 1.6; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(rx + 4 + k * 5, b - 13, 10, -1.2, 1.2); c.stroke(); }
    const tx = x + w - 6; limb(c, tx - 4, b, tx, b - 14, 1.5, '#5a3c20'); limb(c, tx + 4, b, tx, b - 14, 1.5, '#5a3c20'); for (const [r2, cl] of [[7, '#f0ead8'], [5, '#c83a2a'], [3, '#f0ead8'], [1.5, '#c83a2a']]) circ(c, tx, b - 18, r2, cl); // tarcza
    c.fillStyle = '#7a4a24'; c.fillRect(x + w * 0.54, b - 10, 8, 10); c.strokeStyle = '#d8c8a0'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + w * 0.54 + 2 + k * 2, b - 10); c.lineTo(x + w * 0.54 + 2 + k * 2, b - 17); c.stroke(); }
  },
  silo(c, A, s, tier, col, fx) { // spiżarnia: dziupla w leżącym pniu pełna orzechów, ule słomiane i dzbany miodu
    const { x, b, w, h } = s;
    c.fillStyle = '#7a5530'; rr(c, x + 2, b - 22, w * 0.62, 22, 10); c.fill(); c.fillStyle = '#5a3c20'; c.fillRect(x + 6, b - 7, w * 0.54, 3); c.fillStyle = '#c8a070'; c.beginPath(); c.ellipse(x + w * 0.62, b - 11, 5, 11, 0, 0, TAU); c.fill();
    c.fillStyle = '#2a1a0c'; c.beginPath(); c.ellipse(x + w * 0.3, b - 11, 9, 7, 0, 0, TAU); c.fill(); for (let k = 0; k < 5; k++) circ(c, x + w * 0.3 - 5 + k * 2.5, b - 9 - (k % 2) * 2, 2, '#b07840');
    canopy(c, x + w * 0.2, b - 24, 8, '#4a8a3a', 4);
    for (const [bx2, s2] of [[x + w * 0.78, 1], [x + w * 0.94, 0.8]]) { c.fillStyle = '#d8b050'; c.beginPath(); c.ellipse(bx2, b - 1, 8 * s2, 15 * s2, 0, Math.PI, 0); c.fill(); c.strokeStyle = '#a07830'; c.lineWidth = 1.2; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(bx2 - 8 * s2 * Math.sqrt(1 - (k / 4) ** 2), b - 1 - 15 * s2 * k / 4); c.lineTo(bx2 + 8 * s2 * Math.sqrt(1 - (k / 4) ** 2), b - 1 - 15 * s2 * k / 4); c.stroke(); } c.fillStyle = '#2a1a0c'; c.fillRect(bx2 - 1.5, b - 5, 3, 3); } // ule
    c.fillStyle = '#b86a2a'; c.beginPath(); c.ellipse(x + w * 0.66, b - 4, 4, 4.5, 0, 0, TAU); c.fill(); c.fillStyle = '#f0c040'; c.fillRect(x + w * 0.66 - 2, b - 9, 4, 2);
  },
});

// ==================== KURHAN: kopce, dolmeny, obeliski, kości i zielony ogień ====================
const BONE = '#d8d0bc';
function obelisk(c, cx, b, w0, h, col, rune, fx, fire) { // zwężający się obelisk z piramidką, runy, (zielony ogień na szczycie)
  const w1 = w0 * 0.55; fillPoly(c, [[cx - w0 / 2, b], [cx - w1 / 2, b - h], [cx + w1 / 2, b - h], [cx + w0 / 2, b]], col); fillPoly(c, [[cx + w0 * 0.08, b], [cx + w1 * 0.05, b - h], [cx + w1 / 2, b - h], [cx + w0 / 2, b]], sh(col, -0.3));
  fillPoly(c, [[cx - w1 / 2, b - h], [cx, b - h - w1 * 0.9], [cx + w1 / 2, b - h]], sh(col, 0.15));
  c.fillStyle = rune; for (let y = b - h + 8; y < b - 6; y += 9) { c.fillRect(cx - 1.5, y, 3, 4); } if (fx) fx.glows.push([cx, b - h * 0.5, 10, rune]);
  if (fire) flame(c, cx, b - h - w1 * 0.9 + 2, 0.9, fx, '#6af08a');
}
function bigSkull(c, cx, cy, r, fx, eye = '#8af0a0') { // czaszka: sklepienie, oczodoły z blaskiem, nos, kości policzkowe
  c.fillStyle = sh(BONE, -0.25); c.beginPath(); c.ellipse(cx + r * 0.08, cy + 1, r, r * 0.88, 0, 0, TAU); c.fill();
  c.fillStyle = BONE; c.beginPath(); c.ellipse(cx - r * 0.04, cy, r * 0.94, r * 0.84, 0, 0, TAU); c.fill();
  c.fillStyle = sh(BONE, 0.12); c.beginPath(); c.ellipse(cx - r * 0.3, cy - r * 0.45, r * 0.35, r * 0.2, -0.3, 0, TAU); c.fill();
  for (const sd of [-1, 1]) { c.fillStyle = '#100c14'; c.beginPath(); c.ellipse(cx + sd * r * 0.36, cy + r * 0.12, r * 0.24, r * 0.2, sd * 0.25, 0, TAU); c.fill(); circ(c, cx + sd * r * 0.36, cy + r * 0.14, r * 0.07, eye); if (fx) fx.glows.push([cx + sd * r * 0.36, cy + r * 0.14, r * 0.5, eye]); }
  fillPoly(c, [[cx, cy + r * 0.3], [cx - r * 0.1, cy + r * 0.52], [cx + r * 0.1, cy + r * 0.52]], '#100c14');
}
Object.assign(BUILD_ART.barrow, {
  hall(c, A, s, tier, col, fx) { // kurhan: kopiec z dolmenem; wyżej mauzoleum z kolumnami, obeliski z zielonym ogniem, na końcu wielka czaszka w kopcu
    const { x, b, w, h } = s, cx = x + w / 2, mr = w * (0.36 + tier * 0.03), mh = h * (0.44 + tier * 0.05);
    if (tier >= 3) for (const sd of [-1, 1]) obelisk(c, cx + sd * (mr + 6), b, 14, h * (0.5 + tier * 0.06), '#3a3444', '#8af0a0', fx, true);
    c.fillStyle = '#34322a'; c.beginPath(); c.ellipse(cx, b, mr, mh, 0, Math.PI, 0); c.closePath(); c.fill(); // kopiec
    c.fillStyle = '#44422f'; c.beginPath(); c.ellipse(cx - mr * 0.12, b - 2, mr * 0.86, mh * 0.94, 0, Math.PI, 0); c.closePath(); c.fill();
    c.strokeStyle = '#5a5a3e'; c.lineWidth = 1.2; const r = mulberry32(9); for (let i = 0; i < 18; i++) { const a = Math.PI + r() * Math.PI, d = 0.3 + r() * 0.65, px = cx + Math.cos(a) * mr * d, py = b + Math.sin(a) * mh * d; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 1, py - 3); c.moveTo(px + 2, py); c.lineTo(px + 2.5, py - 3); c.stroke(); } // trawa
    if (tier >= 3) ribs(c, cx - mr * 0.5, b - mh * 0.72, mr, mh * 0.5, BONE);
    if (tier >= 4) { bigSkull(c, cx, b - mh - mr * 0.12, mr * 0.42, fx); for (let k = 1; k < 5; k++) fx.glows.push([cx, b - mh - k * 16, 14, '#8af0a0']); } // czaszka i słup dusz
    if (tier >= 2) { // mauzoleum
      const pw = 64, pt = b - 44; slabRect(c, cx - pw / 2 - 4, b - 5, pw + 8, 5, '#4a4452'); c.fillStyle = '#0c0a10'; c.fillRect(cx - pw / 2 + 6, pt, pw - 12, 39);
      for (let i = 0; i < 4; i++) { const px = cx - pw / 2 + 2 + i * (pw - 10) / 3; c.fillStyle = '#6a6474'; c.fillRect(px, pt, 6, 39); c.fillStyle = '#4a4452'; c.fillRect(px + 4, pt, 2, 39); }
      fillPoly(c, [[cx - pw / 2 - 5, pt], [cx, pt - 18], [cx + pw / 2 + 5, pt]], '#5a5464'); c.fillStyle = '#6a6474'; c.fillRect(cx - pw / 2 - 5, pt - 2, pw + 10, 4); skullAt(c, cx, pt - 8, 0.7);
      c.strokeStyle = '#3a3a40'; c.lineWidth = 1.2; c.beginPath(); for (let i = -8; i <= 8; i += 4) { c.moveTo(cx + i, pt + 8); c.lineTo(cx + i, b - 5); } c.stroke(); fx.glows.push([cx, b - 14, 18, '#8af0a0']);
    } else { // dolmen
      c.fillStyle = '#0c0a10'; c.fillRect(cx - 11, b - 26, 22, 26); fx.glows.push([cx, b - 8, 16, '#8af0a0']);
      for (const sd of [-1, 1]) { c.fillStyle = '#6a6470'; c.fillRect(cx + sd * 15 - 4.5, b - 28, 9, 28); c.fillStyle = '#4a4452'; c.fillRect(cx + sd * 15 + 1.5, b - 28, 3, 28); }
      slabRect(c, cx - 22, b - 36, 44, 9, '#726c7a');
    }
    for (const sd of [-1, 1]) { const px = cx + sd * (mr * 0.7); limb(c, px, b, px, b - 24, 1.6, '#4a3a2a'); skullAt(c, px, b - 27, 0.6); } // czaszki na palach
    bannerArt(c, cx + mr * 0.2, b - mh - 18, col);
  },
  fort(c, A, s, tier, col, fx) { // żelazne ogrodzenie z grotami między słupami z czaszkami, brama-czaszka, obeliski; wyżej krypta i wieża z kręgów
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 3) { // kręgosłup z żebrami i zielonym ogniem
      const vx = cx + w * 0.3, vt = b - h * 1.18, n = 11;
      for (let i = 0; i < n; i++) { const vy = b - 8 - i * (b - 8 - vt) / n; c.fillStyle = i % 2 ? BONE : sh(BONE, -0.18); c.beginPath(); c.ellipse(vx, vy, 7 - i * 0.2, 4, 0, 0, TAU); c.fill(); }
      c.strokeStyle = BONE; c.lineWidth = 2.4; c.lineCap = 'round'; for (let k = 0; k < 4; k++) { const ry = vt + 22 + k * 16; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(vx, ry); c.quadraticCurveTo(vx + sd * 22, ry - 4, vx + sd * 18, ry + 14); c.stroke(); } }
      flame(c, vx, vt, 1.3, fx, '#6af08a');
    }
    if (tier >= 2) { // gotycka krypta
      const kw = tier >= 3 ? 52 : 44, kh = h * (tier >= 3 ? 0.92 : 0.78), kx = cx - w * 0.3 - kw / 2, kt = b - kh; wallRect(c, A, kx, kt, kw, kh);
      for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < 2; i++) { c.fillStyle = '#0c0a10'; pointedPath(c, kx + kw * (0.3 + i * 0.4) - 4, kt + 24 + r2 * 22, 8, 16); c.fill(); c.fillStyle = A.glow; pointedPath(c, kx + kw * (0.3 + i * 0.4) - 2.5, kt + 22 + r2 * 22, 5, 12); c.fill(); fx.wins.push([kx + kw * (0.3 + i * 0.4) - 2.5, kt + 10 + r2 * 22, 5, 12, A.glow]); }
      roofArt(c, A, A.roof.hall, kx, kt, kw, kw * 1.1); bannerArt(c, kx + kw / 2, kt - kw * 1.1 - 22, col);
    }
    const fh = h * 0.28; c.strokeStyle = '#2a2830'; c.lineWidth = 1.8; c.beginPath(); for (let px = x + 16; px < x + w - 16; px += 5) { if (Math.abs(px - cx) < 30) continue; c.moveTo(px, b); c.lineTo(px, b - fh); } c.stroke(); // żelazne pręty
    for (let px = x + 16; px < x + w - 16; px += 5) if (Math.abs(px - cx) >= 30) fillPoly(c, [[px - 1.8, b - fh], [px, b - fh - 5], [px + 1.8, b - fh]], '#5a5864');
    c.fillStyle = '#2a2830'; c.fillRect(x + 16, b - fh + 4, w - 32, 2); c.fillRect(x + 16, b - 8, w - 32, 2);
    for (const px of [x + 50, x + w - 50]) { slabRect(c, px - 5, b - fh - 6, 10, fh + 6, '#5a5464'); skullAt(c, px, b - fh - 10, 0.55); }
    for (const tx of [x + 12, x + w - 12]) obelisk(c, tx, b, 20, h * (tier >= 2 ? 0.72 : 0.6), '#3a3444', '#8af0a0', fx, true);
    const gy = b - h * 0.48, gr = 30; bigSkull(c, cx, gy, gr, fx); // brama-czaszka
    c.fillStyle = '#100c14'; c.beginPath(); c.moveTo(cx - 17, b); c.lineTo(cx - 17, gy + gr * 0.7); c.quadraticCurveTo(cx, gy + gr * 0.55, cx + 17, gy + gr * 0.7); c.lineTo(cx + 17, b); c.closePath(); c.fill();
    c.fillStyle = BONE; for (let i = 0; i < 6; i++) { c.fillRect(cx - 15 + i * 5.2, gy + gr * 0.66, 3.6, 6); } for (const sd of [-1, 1]) { c.fillStyle = sh(BONE, -0.2); c.fillRect(cx + sd * 19 - 3, gy + gr * 0.6, 6, b - gy - gr * 0.6); } // zęby i żuchwa
    fx.glows.push([cx, b - 12, 18, '#8af0a0']);
  },
  guild(c, A, s, tier, col, fx) { // czarny obelisk z runami, nad nim otwarta księga; wyżej pierścienie run, czaszki i zielona kula
    const { x, b, w, h } = s, cx = x + w / 2, oh = h * (0.36 + tier * 0.09);
    slabRect(c, cx - 22, b - 6, 44, 6, '#4a4452'); slabRect(c, cx - 16, b - 11, 32, 5, '#5a5464');
    if (tier >= 4) for (const dx of [-18, -10, 10, 18]) skullAt(c, cx + dx, b - 13, 0.5);
    obelisk(c, cx, b - 11, 26, oh, '#26222e', '#8af0a0', fx, false);
    if (tier >= 3) for (const f of [0.35, 0.7]) { c.strokeStyle = '#8af0a0'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(cx, b - 11 - oh * f, 16, 4, 0, 0, TAU); c.stroke(); fx.glows.push([cx, b - 11 - oh * f, 14, '#8af0a0']); }
    if (tier >= 2) { const by = b - 11 - oh - 30; fillPoly(c, [[cx - 16, by - 5], [cx, by + 2], [cx + 16, by - 5], [cx + 16, by + 1], [cx, by + 8], [cx - 16, by + 1]], '#e8e0cc'); c.fillStyle = '#3a2a4a'; c.fillRect(cx - 16, by + 1, 32, 3); c.strokeStyle = '#8a8070'; c.lineWidth = 0.8; for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(cx - 10 + k * 3, by - 1); c.lineTo(cx - 3 + k, by + 2); c.stroke(); } fx.glows.push([cx, by, 18, '#a6f0a8']); } // księga
    if (tier >= 5) { const oy = b - 11 - oh - 52; circ(c, cx, oy, 7, '#a6f0a8'); circ(c, cx - 2, oy - 2, 2.5, '#f0fff0'); fx.glows.push([cx, oy, 30, '#8af0a0']); limb(c, cx - 4, oy + 6, cx - 9, oy + 20, 1.2, '#c8ffd0'); limb(c, cx + 5, oy + 5, cx + 8, oy + 18, 1.2, '#c8ffd0'); }
  },
  tavern(c, A, s, tier, col, fx) { // krzywa karczma: przechylone ściany, krzywy komin, kruki, szyld w kształcie trumny, nagrobek
    const { x, b, w, h } = s, bx = x + 6, bw = w * 0.6, lt = b - h * 0.5, rt = b - h * 0.56;
    fillPoly(c, [[bx, b], [bx + 4, lt], [bx + bw + 8, rt], [bx + bw, b]], A.wall[0]); fillPoly(c, [[bx + bw * 0.62, b], [bx + bw * 0.66, rt + 3], [bx + bw + 8, rt], [bx + bw, b]], A.wall[1]);
    c.strokeStyle = '#2a2230'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(bx + 2, b - h * 0.26); c.lineTo(bx + bw + 4, b - h * 0.29); c.moveTo(bx + 4, lt); c.lineTo(bx + bw, b - h * 0.29); c.moveTo(bx + bw + 6, rt); c.lineTo(bx + 2, b - h * 0.26); c.stroke();
    fillPoly(c, [[bx - 4, lt + 2], [bx + bw * 0.35, lt - h * 0.36], [bx + bw + 14, rt + 1]], A.roof.util); fillPoly(c, [[bx + bw * 0.35, lt - h * 0.36], [bx + bw + 14, rt + 1], [bx + bw * 0.5, rt]], sh(A.roof.util, -0.3));
    fillPoly(c, [[bx + bw * 0.62, lt - h * 0.2], [bx + bw * 0.68, lt - h * 0.42], [bx + bw * 0.8, lt - h * 0.4], [bx + bw * 0.74, lt - h * 0.18]], '#3a3444'); fx.smokes.push([bx + bw * 0.74, lt - h * 0.43]);
    for (const [wx, wy] of [[bx + 8, b - h * 0.42], [bx + bw - 12, b - h * 0.46]]) winArt(c, A, wx, wy, 8, 9, fx); doorArt(c, A, bx + bw * 0.42, b, 14, 19);
    for (const [bx2, by2] of [[bx + bw * 0.2, lt - h * 0.18], [bx + bw * 0.5, lt - h * 0.33]]) { fillPoly(c, [[bx2 - 4, by2], [bx2, by2 - 5], [bx2 + 5, by2 - 1], [bx2 + 1, by2 + 1]], '#0e0a12'); } // kruki
    const sx = x + w - 12; c.fillStyle = '#2a2230'; c.fillRect(sx - 1, b - 36, 2, 36); fillPoly(c, [[sx - 6, b - 32], [sx + 6, b - 32], [sx + 8, b - 24], [sx + 4, b - 14], [sx - 4, b - 14], [sx - 8, b - 24]], '#4a3a30'); drawEmblem(c, 'mug', sx, b - 23, 9, '#a6f0a8');
    c.fillStyle = '#6a6474'; c.beginPath(); c.moveTo(x + w - 30, b); c.lineTo(x + w - 30, b - 9); c.arc(x + w - 25, b - 9, 5, Math.PI, 0); c.lineTo(x + w - 20, b); c.closePath(); c.fill();
  },
  market(c, A, s, tier, col, fx) { // targ w cieniu: postrzępiony czarny baldachim, kamienne płyty jak nagrobki, świece, flakony, latarnie z zielonym ogniem
    const { x, b, w, h } = s, top = b - h * 0.8;
    for (const px of [x + 8, x + w * 0.5, x + w - 8]) { c.fillStyle = '#2a2830'; c.fillRect(px - 1.5, top, 3, b - top); }
    c.fillStyle = '#1e1a24'; c.beginPath(); c.moveTo(x + 2, top + 6); c.lineTo(x + w / 2, top - 8); c.lineTo(x + w - 2, top + 6); for (let px = x + w - 2; px >= x + 2; px -= 8) c.lineTo(px - 4, top + 12 + ((px * 7) % 5)); c.closePath(); c.fill(); // baldachim
    for (let i = 0; i < 3; i++) { const sx = x + 10 + i * (w - 20) / 3, sw = (w - 20) / 3 - 8; slabRect(c, sx, b - 14, sw, 6, '#5a5464'); c.fillStyle = '#3a3444'; c.fillRect(sx + 3, b - 8, 4, 8); c.fillRect(sx + sw - 7, b - 8, 4, 8);
      for (let k = 0; k < 3; k++) { const px = sx + 5 + k * (sw - 10) / 2; if (k === 1) skullAt(c, px, b - 18, 0.45); else { c.fillStyle = ['#8af0a0', '#c080ff', '#ff6a5a'][(i + k) % 3]; c.fillRect(px - 2, b - 21, 4, 7); c.fillRect(px - 1, b - 23, 2, 2); } } }
    for (let i = 0; i < 4; i++) { const px = x + 14 + i * (w - 28) / 3; c.fillStyle = '#e8e0cc'; c.fillRect(px - 1, b - 30, 2, 5); circ(c, px, b - 31, 1.4, '#ffe890'); fx.glows.push([px, b - 31, 8, '#ffd070']); }
    for (const px of [x - 2, x + w + 2]) { c.fillStyle = '#2a2830'; c.fillRect(px - 1, b - 40, 2, 40); c.fillStyle = '#1e1a24'; c.fillRect(px - 4, b - 46, 8, 7); circ(c, px, b - 42.5, 2.4, '#8af0a0'); fx.glows.push([px, b - 42, 12, '#8af0a0']); }
  },
  smith(c, A, s, tier, col, fx) { // kuźnia krypty: ostrołukowe wejście z zielonym żarem, żelazny kocioł na nóżkach, łańcuchy, kowadło z czaszką
    const { x, b, w, h } = s, bw = w * 0.66, bx = x + 2, top = b - h * 0.6;
    wallRect(c, A, bx, top, bw, b - top); roofArt(c, A, A.roof.util, bx, top, bw, h * 0.34); c.fillStyle = '#3a3444'; c.fillRect(bx + bw * 0.7, top - h * 0.3, 8, h * 0.3); fx.smokes.push([bx + bw * 0.7 + 4, top - h * 0.31]);
    c.fillStyle = '#0c0a10'; pointedPath(c, bx + bw * 0.2, b, bw * 0.46, h * 0.44); c.fill(); circ(c, bx + bw * 0.43, b - 7, 5, '#6af08a'); fx.glows.push([bx + bw * 0.43, b - 9, 22, '#6af08a']);
    for (const px of [bx + 4, bx + bw - 6]) { c.strokeStyle = '#6a6874'; c.lineWidth = 1.4; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(px, top + 6 + k * 4, 1.4, 2.2, 0, 0, TAU); c.stroke(); } }
    const kx = x + w * 0.82; c.fillStyle = '#2a2830'; c.beginPath(); c.ellipse(kx, b - 12, 11, 9, 0, 0, Math.PI); c.fill(); c.fillRect(kx - 11, b - 14, 22, 3); limb(c, kx - 8, b - 6, kx - 10, b, 1.6, '#2a2830'); limb(c, kx + 8, b - 6, kx + 10, b, 1.6, '#2a2830');
    c.fillStyle = '#6af08a'; c.beginPath(); c.ellipse(kx, b - 14, 9, 2.5, 0, 0, TAU); c.fill(); fx.glows.push([kx, b - 18, 16, '#6af08a']); fx.smokes.push([kx, b - 18, 0.6]);
    drawEmblem(c, 'anvil', bx + bw * 0.75, b - 5, 11, '#4a4854'); skullAt(c, bx + bw * 0.75, b - 13, 0.4);
  },
  silo(c, A, s, tier, col, fx) { // kostnica: kamienna szopa z czaszką nad wejściem, stos trumien, żelazna klatka z kośćmi
    const { x, b, w, h } = s, bw = w * 0.48, top = b - h * 0.5;
    wallRect(c, A, x + 2, top, bw, b - top); roofArt(c, A, A.roof.util, x + 2, top, bw, h * 0.3); c.fillStyle = '#0c0a10'; archPath(c, x + 2 + bw / 2 - 6, b, 12, 18); c.fill(); skullAt(c, x + 2 + bw / 2, top + 7, 0.6);
    coffin(c, x + bw + 10, b, 0.8); coffin(c, x + bw + 22, b, 0.75); c.save(); c.translate(x + bw + 16, b - 16); c.rotate(-1.4); coffin(c, 0, 8, 0.7); c.restore();
    const cx2 = x + w - 8; c.strokeStyle = '#3a3840'; c.lineWidth = 1.2; c.beginPath(); for (let k = -6; k <= 6; k += 3) { c.moveTo(cx2 + k, b); c.lineTo(cx2 + k, b - 16); } c.moveTo(cx2 - 7, b - 16); c.lineTo(cx2 + 7, b - 16); c.stroke(); c.fillStyle = BONE; c.fillRect(cx2 - 4, b - 4, 8, 2); skullAt(c, cx2, b - 7, 0.35);
  },
});

// ==================== TWIERDZA: pale, siodłowe dachy z trzciny, omszałe piramidy, czaszki jaszczurów ====================
const MOSS = '#6a8a3a', BASALT = '#5a6450';
function saddleRoof(c, x, y, w, rh, col) { // dach siodłowy: grzbiet opada pośrodku, końce wygięte w górę i wysunięte daleko przed ściany
  const tip = Math.max(10, w * 0.22);
  c.fillStyle = col; c.beginPath(); c.moveTo(x - 4, y + 2); c.quadraticCurveTo(x - tip * 0.5, y - rh * 0.5, x - tip, y - rh * 1.15); c.quadraticCurveTo(x + w / 2, y - rh * 0.45, x + w + tip, y - rh * 1.15); c.quadraticCurveTo(x + w + tip * 0.5, y - rh * 0.5, x + w + 4, y + 2); c.closePath(); c.fill();
  c.fillStyle = sh(col, -0.28); c.beginPath(); c.moveTo(x + w / 2, y + 2); c.lineTo(x + w / 2, y - rh * 0.72); c.quadraticCurveTo(x + w * 0.8, y - rh * 0.76, x + w + tip, y - rh * 1.15); c.quadraticCurveTo(x + w + tip * 0.5, y - rh * 0.5, x + w + 4, y + 2); c.closePath(); c.fill();
  c.strokeStyle = sh(col, -0.4); c.lineWidth = 1; for (let k = 1; k < 7; k++) { const px = x - tip * 0.3 + k * (w + tip * 0.6) / 7; c.beginPath(); c.moveTo(px, y + 1); c.lineTo(px + (px - x - w / 2) * 0.12, y - rh * 0.6); c.stroke(); }
  c.fillStyle = sh(col, -0.5); c.fillRect(x - 4, y, w + 8, 2.5);
}
function lizardSkull(c, cx, cy, s, col = BONE) { // czaszka jaszczura: wydłużony pysk, zęby, oczodół
  fillPoly(c, [[cx - 8 * s, cy - 4 * s], [cx + 2 * s, cy - 6 * s], [cx + 12 * s, cy - 2 * s], [cx + 12 * s, cy + 1 * s], [cx - 8 * s, cy + 4 * s]], col);
  circ(c, cx - 3 * s, cy - 2 * s, 2 * s, '#1a1a10'); c.fillStyle = sh(col, -0.3); c.fillRect(cx - 6 * s, cy + 1 * s, 17 * s, 1.5 * s);
  c.fillStyle = col; for (let k = 0; k < 5; k++) fillPoly(c, [[cx - 4 * s + k * 3.2 * s, cy + 2 * s], [cx - 3 * s + k * 3.2 * s, cy + 5 * s], [cx - 2 * s + k * 3.2 * s, cy + 2 * s]], col);
}
function stepPyramid(c, cx, b, w, h, steps, fx) { // omszała piramida schodkowa ze schodami pośrodku
  const sh3 = h / steps;
  for (let i = 0; i < steps; i++) { const sw = w * (1 - i * 0.2), y = b - (i + 1) * sh3; slabRect(c, cx - sw / 2, y, sw, sh3, BASALT); c.fillStyle = sh(BASALT, -0.25); c.fillRect(cx + sw * 0.22, y + 2, sw * 0.28, sh3 - 4); for (let k = 0; k < sw / 9; k++) circ(c, cx - sw / 2 + 4 + k * 9, y + 1, 2.4, MOSS); }
  c.fillStyle = sh(BASALT, 0.12); c.fillRect(cx - 7, b - h, 14, h); c.fillStyle = sh(BASALT, -0.35); for (let y = b - 3; y > b - h; y -= 4) c.fillRect(cx - 7, y, 14, 1.2); // schody
}
function stiltLegs(c, x, b, w, h) { // cztery pale z zastrzałami
  c.fillStyle = '#4a3a22'; for (const px of [x + 2, x + w - 5]) c.fillRect(px, b - h, 3, h);
  c.strokeStyle = '#3a2e1a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 3, b); c.lineTo(x + w - 4, b - h * 0.55); c.moveTo(x + w - 4, b); c.lineTo(x + 3, b - h * 0.55); c.stroke();
}
function lizardIdol(c, x, b, fx) { c.fillStyle = BASALT; c.fillRect(x - 6, b - 8, 12, 8); drawEmblem(c, 'dragon', x, b - 16, 16, '#d8b040'); flame(c, x + 9, b - 8, 0.45, fx, '#c8f070'); }
Object.assign(BUILD_ART.fortress, {
  hall(c, A, s, tier, col, fx) { // długi dom na palach z dachem siodłowym i czaszką jaszczura; wyżej chaty obok, potem omszała piramida schodkowa pod domem
    const { x, b, w, h } = s, cx = x + w / 2, P = planksA(A);
    let base = b - h * 0.18;
    if (tier >= 3) { const ph = h * (tier >= 4 ? 0.36 : 0.22); stepPyramid(c, cx, b, w * (tier >= 4 ? 0.9 : 0.74), ph, tier >= 4 ? 3 : 2, fx); base = b - ph; if (tier >= 4) for (const sd of [-1, 1]) lizardIdol(c, cx + sd * w * 0.4, b, fx); }
    else { stilts(c, cx - w * 0.28, b, w * 0.56, h * 0.18); c.strokeStyle = '#4a3a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 4, base); c.lineTo(cx - 12, b); c.moveTo(cx + 4, base); c.lineTo(cx - 4, b); c.stroke(); for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(cx - 4 - k * 2, base + k * (b - base) / 4); c.lineTo(cx + 4 - k * 2, base + k * (b - base) / 4); c.stroke(); } }
    if (tier === 2) for (const sd of [-1, 1]) { const hx = cx + sd * w * 0.38 - 16; stilts(c, hx, b, 32, h * 0.14); wallRect(c, P, hx, b - h * 0.14 - 18, 32, 18); saddleRoof(c, hx, b - h * 0.14 - 18, 32, 14, A.roof.dw); totem(c, cx + sd * w * 0.22, b, h * 0.36); }
    const bw = w * 0.46, bh = h * 0.24, hx = cx - bw / 2, top = base - bh;
    wallRect(c, P, hx, top, bw, bh); doorArt(c, A, cx - 7, base, 14, Math.min(18, bh - 2)); for (const wx of [hx + 6, hx + bw - 13]) winArt(c, A, wx, top + 6, 7, 7, fx);
    c.fillStyle = '#b86a3a'; for (let k = 0; k < 6; k++) fillPoly(c, [[hx + k * bw / 6, top + bh - 2], [hx + (k + 0.5) * bw / 6, top + bh - 7], [hx + (k + 1) * bw / 6, top + bh - 2]], k % 2 ? '#b86a3a' : '#e0c050'); // malowany fryz
    saddleRoof(c, hx, top, bw, h * 0.34, A.roof.hall); lizardSkull(c, cx - 2, top - h * 0.14, 1.1);
    bannerArt(c, hx + bw + bw * 0.22, top - h * 0.34 - 16, col);
  },
  fort(c, A, s, tier, col, fx) { // mętna fosa, zasieki z zaostrzonych pali, brama pod czaszką krokodyla, wieże na palach; wyżej omszałe wieże schodkowe
    const { x, b, w, h } = s, cx = x + w / 2, mb = b - 7;
    if (tier >= 2) { const big = tier >= 3, kx = cx - w * 0.2, kh = h * (big ? 0.95 : 0.72); stepPyramid(c, kx, mb, big ? 74 : 60, kh * 0.62, big ? 4 : 3, fx); const hw = big ? 34 : 28; wallRect(c, planksA(A), kx - hw / 2, mb - kh, hw, kh * 0.38); winArt(c, A, kx - 3.5, mb - kh + 6, 7, 8, fx); cone(c, A.roof.wall, kx, mb - kh, hw + 6, 26);
      bannerArt(c, kx, mb - kh - 46, col); if (big) for (const sd of [-1, 1]) { const hx2 = kx + sd * 32; limb(c, hx2, mb - kh * 0.35, hx2 + sd * 8, mb - kh * 0.55, 4, '#4a6a3a'); circ(c, hx2 + sd * 9, mb - kh * 0.57, 4, '#4a6a3a'); circ(c, hx2 + sd * 10.5, mb - kh * 0.58, 1.2, '#f0e040'); flame(c, kx, mb - kh * 0.62, 0.6, fx, '#c8f070'); } } // głowy hydr
    palisade(c, x + 14, x + w - 14, mb, h * 0.34, '#5a4428');
    c.strokeStyle = '#6a5030'; c.lineWidth = 3; c.lineCap = 'round'; for (let px = x + 18; px < x + w - 18; px += 14) { if (Math.abs(px - cx) < 24) continue; c.beginPath(); c.moveTo(px - 7, mb); c.lineTo(px + 6, mb - 16); c.moveTo(px + 7, mb); c.lineTo(px - 6, mb - 16); c.stroke(); } // zasieki
    c.fillStyle = '#2e3e26'; c.fillRect(x, mb, w, 7); c.fillStyle = '#5a7a4a'; c.fillRect(x, mb + 1, w, 1.2); for (let px = x + 6; px < x + w; px += 23) { c.fillStyle = '#6a9a4a'; c.fillRect(px, mb + 3, 5, 1.5); } // fosa z rzęsą
    for (const tx of [x - 2, x + w - 30]) { const th = h * (tier >= 2 ? 0.8 : 0.68); stiltLegs(c, tx, mb, 32, th * 0.6); wallRect(c, planksA(A), tx, mb - th, 32, th * 0.4); winArt(c, A, tx + 12, mb - th + 6, 8, 7, fx); cone(c, A.roof.wall, tx + 16, mb - th, 38, 24); }
    c.fillStyle = '#1a1208'; c.fillRect(cx - 14, mb - 28, 28, 28); c.fillStyle = '#6a4a2a'; for (let i = 0; i < 6; i++) c.fillRect(cx - 13 + i * 4.5, mb - 27, 3.5, 27); c.fillStyle = '#3a2a14'; c.fillRect(cx - 14, mb - 20, 28, 2.5); c.fillRect(cx - 14, mb - 9, 28, 2.5);
    for (const sd of [-1, 1]) { c.fillStyle = '#5a4428'; c.fillRect(cx + sd * 16 - 3, mb - 36, 6, 36); } lizardSkull(c, cx - 3, mb - 40, 1.6);
  },
  guild(c, A, s, tier, col, fx) { // chata wiedźmy na kurzych łapach: coraz wyższe łapy, kocioł, pęki ziół, druga krzywa izba, czaszki na tyczkach
    const { x, b, w, h } = s, cx = x + w / 2, legH = 26 + tier * 7, hb = b - legH, hw = 36, hh = 26;
    for (const sd of [-1, 1]) { const hip = [cx + sd * 8, hb], knee = [cx + sd * 13 - 6, b - legH * 0.45], foot = [cx + sd * 9, b - 2];
      limb(c, ...hip, ...knee, 5, '#c89a5a'); limb(c, ...knee, ...foot, 3.2, '#d8aa6a'); for (const [dx, dy] of [[7, 1], [5, -2], [-4, 1]]) limb(c, ...foot, foot[0] + dx, foot[1] + dy + 1, 1.8, '#b8884a');
      circ(c, hip[0], hip[1] + 3, 6, '#6a5a3a'); }
    c.save(); c.translate(cx, hb); c.rotate(-0.06); const P = planksA(A); wallRect(c, P, -hw / 2, -hh, hw, hh); winArt(c, A, -hw / 2 + 5, -hh + 7, 7, 7, fx); doorArt(c, A, 4, 0, 9, 14);
    saddleRoof(c, -hw / 2, -hh, hw, 16, A.roof.hall);
    if (tier >= 3) { wallRect(c, P, -hw * 0.34 + 3, -hh - 34, hw * 0.62, 18); winArt(c, A, -3, -hh - 30, 6, 6, fx); cone(c, A.roof.tower, 3 - hw * 0.34 + hw * 0.31, -hh - 34, hw * 0.7, 20); }
    c.restore();
    for (let k = 0; k < Math.min(tier + 1, 4); k++) { const px = cx - hw / 2 + 4 + k * 9; c.strokeStyle = '#3a2a14'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px, hb + 1); c.lineTo(px, hb + 6); c.stroke(); c.fillStyle = ['#6a9a3a', '#c8a040', '#8a5aa8', '#5a8a6a'][k]; c.fillRect(px - 2, hb + 6, 4, 5); } // pęki ziół
    if (tier >= 2) { const kx = cx + 20; c.fillStyle = '#1e1e1a'; c.beginPath(); c.ellipse(kx, b - 7, 9, 7, 0, 0, Math.PI); c.fill(); c.fillRect(kx - 9, b - 9, 18, 3); c.fillStyle = '#9af04a'; c.beginPath(); c.ellipse(kx, b - 9, 7, 2, 0, 0, TAU); c.fill(); circ(c, kx - 2, b - 12, 2, '#c8ff8a'); fx.glows.push([kx, b - 12, 16, '#9af04a']); fx.smokes.push([kx, b - 14, 0.5]); flame(c, kx, b, 0.35, fx); }
    if (tier >= 4) for (const sd of [-1, 1]) { const px = cx + sd * 26; limb(c, px, b, px, b - 30, 1.6, '#4a3a22'); skullAt(c, px, b - 33, 0.6); circ(c, px - 1.5, b - 34, 1, '#c8f070'); fx.glows.push([px, b - 34, 8, '#c8f070']); }
    if (tier >= 5) { const oy = hb - 80; circ(c, cx, oy, 6, '#b8f070'); fx.glows.push([cx, oy, 26, '#9af04a']); }
  },
  tavern(c, A, s, tier, col, fx) { // karczma na palach nad wodą: łódka przy pomoście, suszące się ryby, szyld
    const { x, b, w, h } = s, P = planksA(A), bw = w * 0.58, bx = x + 6, pb = b - h * 0.2;
    bogPool(c, x + w * 0.5, b - 2, w * 0.48, 6, '#2a3a26'); stilts(c, bx, b, bw, h * 0.2);
    wallRect(c, P, bx, pb - h * 0.3, bw, h * 0.3); doorArt(c, A, bx + bw / 2 - 7, pb, 14, 17); winArt(c, A, bx + 6, pb - h * 0.24, 8, 8, fx); winArt(c, A, bx + bw - 14, pb - h * 0.24, 8, 8, fx);
    saddleRoof(c, bx, pb - h * 0.3, bw, h * 0.3, A.roof.util); fx.smokes.push([bx + bw * 0.3, pb - h * 0.5]);
    c.fillStyle = '#5a4428'; c.fillRect(bx + bw, pb - 2, 18, 3); c.fillRect(bx + bw + 14, pb, 2.5, b - pb); // pomost
    c.fillStyle = '#6a4a2a'; c.beginPath(); c.moveTo(bx + bw + 4, b - 6); c.lineTo(x + w - 2, b - 6); c.quadraticCurveTo(x + w - 4, b - 1, x + w - 10, b - 1); c.lineTo(bx + bw + 8, b - 1); c.closePath(); c.fill(); // łódka
    c.strokeStyle = '#3a2a14'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, pb - 18); c.lineTo(x + 2, b - 4); c.moveTo(x + 2, pb - 16); c.lineTo(bx + 6, pb - 14); c.stroke(); for (let k = 0; k < 3; k++) fillPoly(c, [[x + 4 + k * 3, pb - 14], [x + 3 + k * 3, pb - 7], [x + 5.5 + k * 3, pb - 7]], '#a8b098'); // ryby
    signArt(c, A, 'mug', bx + bw + 10, pb - 30, 26, false);
  },
  market(c, A, s, tier, col, fx) { // pływający targ: tratwy z towarem pod matami z trzciny, pale pomostu
    const { x, b, w, h } = s; bogPool(c, x + w / 2, b - 4, w / 2, 8, '#2a3a26');
    for (let i = 0; i < 3; i++) { const rx = x + 6 + i * (w - 12) / 3, rw = (w - 12) / 3 - 6, rb = b - 4 - (i % 2) * 3;
      c.fillStyle = '#7a5a34'; c.fillRect(rx, rb - 4, rw, 4); c.fillStyle = '#5a4024'; for (let k = 0; k < rw; k += 5) c.fillRect(rx + k, rb - 4, 1, 4);
      for (const px of [rx + 2, rx + rw - 4]) { c.fillStyle = '#4a3a22'; c.fillRect(px, rb - 30, 2, 26); } fillPoly(c, [[rx - 3, rb - 28], [rx + rw + 3, rb - 32], [rx + rw + 3, rb - 26], [rx - 3, rb - 22]], ['#c8b070', '#b8a060', '#d8c080'][i]);
      for (let k = 0; k < 3; k++) { const kx = rx + 5 + k * (rw - 10) / 2; if (i === 1 && k === 1) fillPoly(c, [[kx - 5, rb - 8], [kx + 5, rb - 10], [kx + 6, rb - 7], [kx - 4, rb - 5]], '#a8b098'); else { c.fillStyle = '#8a5a2a'; c.beginPath(); c.ellipse(kx, rb - 7, 4.5, 3.5, 0, 0, Math.PI); c.fill(); circ(c, kx - 1.5, rb - 8, 1.6, ['#d83a2a', '#f0c040', '#8ac04a'][k]); circ(c, kx + 1.5, rb - 8, 1.6, '#e87a2a'); } } }
    for (const px of [x + 2, x + w - 2]) { c.fillStyle = '#4a3a22'; c.fillRect(px - 1.5, b - 22, 3, 22); }
  },
  smith(c, A, s, tier, col, fx) { // dymarka: gliniany piec-stożek z żarem u podstawy, skórzany miech, kowadło na pniu, szałas z trzciny
    const { x, b, w, h } = s, fxx = x + w * 0.36;
    for (const px of [x + w * 0.62, x + w - 3]) { c.fillStyle = '#4a3a22'; c.fillRect(px, b - 30, 2.5, 30); } fillPoly(c, [[x + w * 0.56, b - 30], [x + w + 2, b - 34], [x + w + 2, b - 28], [x + w * 0.56, b - 24]], A.roof.util);
    fillPoly(c, [[fxx - 16, b], [fxx - 7, b - h * 0.66], [fxx + 7, b - h * 0.66], [fxx + 16, b]], '#8a5a3a'); fillPoly(c, [[fxx + 2, b], [fxx + 1, b - h * 0.66], [fxx + 7, b - h * 0.66], [fxx + 16, b]], '#6a4028');
    c.fillStyle = '#1a0c06'; archPath(c, fxx - 6, b, 12, 13); c.fill(); circ(c, fxx, b - 4, 4, '#ffb040'); fx.glows.push([fxx, b - 6, 22, '#ff8a2a']); fx.smokes.push([fxx, b - h * 0.68]); circ(c, fxx, b - h * 0.66, 3, '#ff8a2a');
    c.fillStyle = '#4a3020'; c.beginPath(); c.ellipse(fxx - 22, b - 7, 7, 5, 0.3, 0, TAU); c.fill(); c.fillRect(fxx - 17, b - 8, 6, 2); // miech
    c.fillStyle = '#6a4a2a'; c.fillRect(x + w * 0.74, b - 8, 10, 8); drawEmblem(c, 'anvil', x + w * 0.78, b - 12, 12, '#40404a');
  },
  silo(c, A, s, tier, col, fx) { // spichlerze na palach z drabinami, gliniane dzbany
    const { x, b, w, h } = s, P = planksA(A);
    for (const [gx, gw, gh] of [[x + 4, 30, h * 0.34], [x + w * 0.5, 24, h * 0.26]]) { stiltLegs(c, gx, b, gw, gh); wallRect(c, P, gx - 2, b - gh - 16, gw + 4, 16); cone(c, A.roof.util, gx + gw / 2, b - gh - 16, gw + 10, 18); c.strokeStyle = '#4a3a22'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(gx + gw * 0.4, b - gh); c.lineTo(gx + gw * 0.2, b); c.moveTo(gx + gw * 0.6, b - gh); c.lineTo(gx + gw * 0.4, b); c.stroke(); }
    for (const [px, s2] of [[x + w - 12, 1], [x + w - 4, 0.8]]) { c.fillStyle = '#a0603a'; c.beginPath(); c.ellipse(px, b - 5 * s2, 4.5 * s2, 5 * s2, 0, 0, TAU); c.fill(); c.fillRect(px - 2 * s2, b - 12 * s2, 4 * s2, 3 * s2); }
  },
});

// ==================== INFERNO: twarze demonów, obsydianowe kolce, rogi, lawa i ogień ====================
const OBSID = '#2a1a1a';
function lavaBand(c, x, y, w, h, fx) { c.fillStyle = '#ffb040'; c.fillStyle = '#7a1a06'; const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffe070'); g.addColorStop(0.5, '#ff7a1a'); g.addColorStop(1, '#7a1a06'); c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = '#1a0c0a'; c.fillRect(x, y - 2, w, 2); if (fx) for (let px = x + 20; px < x + w; px += 50) fx.glows.push([px, y + 2, 26, '#ff7a1a']); }
function shard(c, x, b, w, h, lean = 0, col = OBSID) { // obsydianowy kolec z czerwoną krawędzią
  fillPoly(c, [[x - w / 2, b], [x + lean, b - h], [x + w / 2, b]], col); fillPoly(c, [[x + lean, b - h], [x + w / 2, b], [x + w * 0.1, b]], sh(col, -0.4)); c.strokeStyle = '#a8301a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - w / 2 + 1, b); c.lineTo(x + lean, b - h + 2); c.stroke();
}
function horn(c, x, b, w, h, dir, col = '#3a2622') { // gruby, wygięty róg (dir: 1 w prawo, -1 w lewo) z pierścieniami
  const P = (u, v) => [x + dir * u, b - v];
  c.fillStyle = col; c.beginPath(); c.moveTo(...P(-w / 2, 0)); c.bezierCurveTo(...P(h * 0.5, h * 0.12), ...P(h * 0.62, h * 0.7), ...P(h * 0.2, h));
  c.bezierCurveTo(...P(h * 0.2, h * 0.6), ...P(h * 0.06, h * 0.22), ...P(w / 2, 0)); c.closePath(); c.fill();
  c.fillStyle = sh(col, 0.22); c.beginPath(); c.moveTo(...P(-w / 2, 0)); c.bezierCurveTo(...P(h * 0.5, h * 0.12), ...P(h * 0.62, h * 0.7), ...P(h * 0.2, h)); c.bezierCurveTo(...P(h * 0.52, h * 0.68), ...P(h * 0.4, h * 0.14), ...P(-w * 0.2, 0)); c.closePath(); c.fill();
  c.strokeStyle = sh(col, -0.35); c.lineWidth = 1.2; if (h > 30) for (let k = 1; k < 5; k++) { const f = k / 5, u = h * (0.12 + 0.36 * Math.sin(f * 2.4)), v = h * f * 0.85, hw = (w / 2) * (1 - f * 0.75); c.beginPath(); c.moveTo(...P(u - hw, v)); c.lineTo(...P(u + hw, v + 1.5)); c.stroke(); }
  circ(c, ...P(h * 0.2, h), 1.8, '#ff7a2a');
}
function demonFace(c, cx, b, w, h, fx, fangs = true) { // fasada-twarz: brwi, skośne świecące oczy, paszcza z kłami jako wejście
  fillPoly(c, [[cx - w / 2, b], [cx - w / 2, b - h * 0.62], [cx - w * 0.3, b - h * 0.86], [cx, b - h], [cx + w * 0.3, b - h * 0.86], [cx + w / 2, b - h * 0.62], [cx + w / 2, b]], OBSID);
  fillPoly(c, [[cx + w * 0.05, b], [cx, b - h], [cx + w * 0.3, b - h * 0.86], [cx + w / 2, b - h * 0.62], [cx + w / 2, b]], sh(OBSID, -0.35));
  c.strokeStyle = '#4a2a24'; c.lineWidth = 1; for (let y = b - 8; y > b - h * 0.6; y -= 9) { c.beginPath(); c.moveTo(cx - w / 2, y); c.lineTo(cx + w / 2, y); c.stroke(); }
  for (const sd of [-1, 1]) { fillPoly(c, [[cx + sd * w * 0.08, b - h * 0.62], [cx + sd * w * 0.36, b - h * 0.7], [cx + sd * w * 0.36, b - h * 0.64], [cx + sd * w * 0.1, b - h * 0.56]], '#140808'); // brew
    fillPoly(c, [[cx + sd * w * 0.12, b - h * 0.54], [cx + sd * w * 0.32, b - h * 0.6], [cx + sd * w * 0.3, b - h * 0.5], [cx + sd * w * 0.14, b - h * 0.48]], '#ffd040'); fx.glows.push([cx + sd * w * 0.22, b - h * 0.54, 14, '#ff9a2a']); fx.wins.push([cx + sd * w * 0.22 - 4, b - h * 0.57, 8, 6, '#ffb040']); }
  fillPoly(c, [[cx - 3, b - h * 0.46], [cx, b - h * 0.34], [cx + 3, b - h * 0.46]], '#140808');
  const mw = w * 0.5, mt = b - h * 0.3; c.fillStyle = '#1a0604'; c.beginPath(); c.moveTo(cx - mw / 2, b); c.lineTo(cx - mw / 2, mt + 6); c.quadraticCurveTo(cx, mt - 6, cx + mw / 2, mt + 6); c.lineTo(cx + mw / 2, b); c.closePath(); c.fill();
  const g = c.createRadialGradient(cx, b - 4, 1, cx, b - 4, mw * 0.5); c.fillStyle = '#ff7a1a'; c.fillStyle = '#ffd060'; g.addColorStop(0, '#ffd060'); g.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = g; c.fillRect(cx - mw / 2, mt, mw, b - mt); fx.glows.push([cx, b - 8, mw * 0.7, '#ff6a1a']);
  if (fangs) { c.fillStyle = '#e8dcc8'; for (let k = 0; k < 5; k++) { const fx0 = cx - mw / 2 + 3 + k * (mw - 6) / 4; fillPoly(c, [[fx0 - 2.5, mt + 3 + Math.abs(k - 2) * 1.5], [fx0, mt + 11 + (k % 4 === 0 ? 4 : 0)], [fx0 + 2.5, mt + 3 + Math.abs(k - 2) * 1.5]], '#e8dcc8'); } }
}
Object.assign(BUILD_ART.inferno, {
  hall(c, A, s, tier, col, fx) { // fasada-twarz demona z paszczą-wejściem; wyżej obsydianowe kolce i fosa lawy, wielkie rogi i lawospady, na końcu poszarpana iglica z pierścieniem ognia
    const { x, b, w, h } = s, cx = x + w / 2, fw = w * (0.5 + tier * 0.03), fh = h * (0.62 + tier * 0.05);
    if (tier >= 4) { for (const [dx, hh, ln] of [[-18, 1.28, 4], [-4, 1.5, -2], [12, 1.2, 5], [24, 1.02, 6]]) shard(c, cx + dx, b - fh * 0.6, 20, h * hh - fh * 0.6 + 10, ln); const ry = b - h * 1.46; c.strokeStyle = '#ff8a2a'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(cx - 4, ry, 18, 5, 0, 0, TAU); c.stroke(); flame(c, cx - 4, ry + 2, 1.1, fx); fx.glows.push([cx - 4, ry, 30, '#ff7a1a']); }
    if (tier >= 2) for (const [dx, hh, ln] of [[-0.46, 0.62, -6], [-0.36, 0.46, -3], [0.36, 0.5, 4], [0.47, 0.66, 7]]) shard(c, cx + dx * w, b, 16, h * hh, ln);
    if (tier >= 3) { horn(c, cx - fw * 0.3, b - fh * 0.8, 16, h * 0.5, -1); horn(c, cx + fw * 0.3, b - fh * 0.8, 16, h * 0.5, 1); }
    demonFace(c, cx, b, fw, fh, fx);
    if (tier < 3) for (const sd of [-1, 1]) horn(c, cx + sd * fw * 0.2, b - fh * 0.9, 12, 22, sd);
    if (tier >= 3) for (const sd of [-1, 1]) { c.fillStyle = '#ff7a1a'; c.fillStyle = '#ffd060'; c.fillRect(cx + sd * fw * 0.42 - 2, b - fh * 0.5, 4, fh * 0.5); c.fillStyle = '#ff7a1a'; c.fillRect(cx + sd * fw * 0.42 - 1, b - fh * 0.5, 2, fh * 0.5); fx.glows.push([cx + sd * fw * 0.42, b - fh * 0.25, 14, '#ff7a1a']); } // lawospady
    if (tier >= 2) { lavaBand(c, x + 4, b + 1, w - 8, 5, fx); c.fillStyle = '#3a2622'; c.fillRect(cx - 12, b, 24, 6); }
    bannerArt(c, cx + fw * 0.5 + 6, b - fh * 0.62 - 20, col);
  },
  fort(c, A, s, tier, col, fx) { // mur z obsydianowych kolców nad fosą lawy, brama-paszcza z oczami i rogami, wieże jak skręcone rogi; wyżej wieża ognia, na końcu wulkan
    const { x, b, w, h } = s, cx = x + w / 2, mb = b - 6;
    if (tier >= 3) { const vx = cx + w * 0.16, vt = b - h * 1.12; fillPoly(c, [[vx - 90, mb], [vx - 26, vt + 8], [vx - 12, vt], [vx + 10, vt + 4], [vx + 26, vt + 10], [vx + 92, mb]], '#3a221e'); fillPoly(c, [[vx + 2, vt + 2], [vx + 10, vt + 4], [vx + 26, vt + 10], [vx + 92, mb], [vx + 20, mb]], '#261412'); // wulkan
      c.strokeStyle = '#ff7a1a'; c.lineWidth = 3; c.lineCap = 'round'; for (const [ex, ey] of [[-30, 0.55], [18, 0.62], [42, 0.4]]) { c.beginPath(); c.moveTo(vx - 2, vt + 4); c.quadraticCurveTo(vx + ex * 0.5, vt + (mb - vt) * 0.3, vx + ex, vt + (mb - vt) * ey); c.stroke(); } flame(c, vx - 1, vt + 4, 1.6, fx); fx.glows.push([vx, vt, 50, '#ff5a1a']); }
    if (tier >= 2) { const tx = cx - w * 0.24, tt = b - h * (tier >= 3 ? 1.02 : 0.92); fillPoly(c, [[tx - 16, mb], [tx - 10, tt], [tx + 10, tt], [tx + 16, mb]], '#3a2420'); fillPoly(c, [[tx + 2, mb], [tx + 1, tt], [tx + 10, tt], [tx + 16, mb]], '#26140f'); for (let r2 = 0; r2 < 3; r2++) { c.fillStyle = '#140808'; c.fillRect(tx - 2.5, tt + 12 + r2 * 18, 5, 10); c.fillStyle = '#ffb040'; c.fillRect(tx - 1.2, tt + 13 + r2 * 18, 2.4, 8); fx.wins.push([tx - 1.2, tt + 13 + r2 * 18, 2.4, 8, '#ffb040']); }
      c.fillStyle = '#1a0e0c'; c.fillRect(tx - 14, tt - 4, 28, 5); flame(c, tx, tt - 4, 1.3, fx); bannerArt(c, tx + 18, tt - 12, col); } // wieża ognia
    const wh = h * 0.3; c.fillStyle = '#26160f'; c.fillRect(x + 14, mb - wh, w - 28, wh); const r = mulberry32(31);
    for (let px = x + 14; px < x + w - 14; px += 8) { if (Math.abs(px + 4 - cx) < 30) continue; shard(c, px + 4, mb - wh + 2, 9, 8 + r() * 12, (r() - 0.5) * 3, '#26160f'); }
    c.strokeStyle = '#ff6a1a'; c.lineWidth = 1; for (let px = x + 24; px < x + w - 24; px += 26) { if (Math.abs(px - cx) < 30) continue; c.beginPath(); c.moveTo(px, mb - wh + 4); c.lineTo(px + 3, mb - wh * 0.6); c.lineTo(px - 1, mb - wh * 0.35); c.stroke(); fx.glows.push([px, mb - wh * 0.6, 8, '#ff6a1a']); } // pęknięcia
    for (const [tx, dir] of [[x + 18, -1], [x + w - 18, 1]]) horn(c, tx, mb, 24, h * (tier >= 2 ? 0.86 : 0.72), -dir, '#3a2420');
    demonFace(c, cx, mb, 64, h * 0.62, fx); for (const sd of [-1, 1]) horn(c, cx + sd * 13, mb - h * 0.56, 12, 24, sd);
    lavaBand(c, x, mb, w, 6, fx);
  },
  guild(c, A, s, tier, col, fx) { // świątynia ognia: obsydianowy zigurat (stopień na poziom), wielka misa z ogniem, wyżej pierścień run, krąg u stóp i kula ognia
    const { x, b, w, h } = s, cx = x + w / 2, n = tier + 1, st = h * 0.075;
    if (tier >= 4) { c.strokeStyle = '#ff7a1a'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, b - 2, w * 0.6, 5, 0, 0, TAU); c.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; circ(c, cx + Math.cos(a) * w * 0.6, b - 2 + Math.sin(a) * 5, 1.8, '#ffd060'); } fx.glows.push([cx, b - 4, 30, '#ff6a1a']); }
    for (let i = 0; i < n; i++) { const sw = w * (0.96 - i * 0.14), y = b - (i + 1) * st; slabRect(c, cx - sw / 2, y, sw, st, i % 2 ? '#3a2420' : '#2e1a16'); c.fillStyle = '#ff8a2a'; c.fillRect(cx - 1.5, y + 3, 3, st - 5); fx.wins.push([cx - 1.5, y + 3, 3, st - 5, '#ff8a2a']); }
    const top = b - n * st; c.fillStyle = '#1a0e0c'; fillPoly(c, [[cx - 12, top - 8], [cx + 12, top - 8], [cx + 7, top], [cx - 7, top]], '#1a0e0c'); flame(c, cx, top - 8, 1.2 + tier * 0.18, fx);
    if (tier >= 3) { const ry = top - 34 - tier * 3; c.strokeStyle = '#ffb040'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx, ry, 20, 5, 0, 0, TAU); c.stroke(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.4; c.fillStyle = '#ffd060'; c.fillRect(cx + Math.cos(a) * 20 - 1.5, ry + Math.sin(a) * 5 - 2, 3, 4); } fx.glows.push([cx, ry, 22, '#ff9a2a']); }
    if (tier >= 5) { const oy = top - 70; circ(c, cx, oy, 7, '#ffb040'); circ(c, cx - 2, oy - 2, 3, '#fff0a0'); fx.glows.push([cx, oy, 30, '#ff7a1a']); }
  },
  tavern(c, A, s, tier, col, fx) { // karczma „Pod Siarkowym Kotłem”: przysadzista bazaltowa kopuła z rogami, komin buchający ogniem, płonący szyld
    const { x, b, w, h } = s, cx = x + w * 0.4, r = w * 0.32;
    c.fillStyle = '#3a2420'; c.beginPath(); c.ellipse(cx, b, r, h * 0.5, 0, Math.PI, 0); c.closePath(); c.fill(); c.fillStyle = '#26140f'; c.beginPath(); c.ellipse(cx + r * 0.3, b, r * 0.7, h * 0.47, 0, Math.PI * 1.5, 0); c.lineTo(cx + r * 0.3, b); c.closePath(); c.fill();
    c.strokeStyle = '#4a2c26'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(cx, b, r * (1 - k * 0.001), h * 0.5 * k / 4, 0, Math.PI, 0); c.stroke(); }
    for (const sd of [-1, 1]) horn(c, cx + sd * r * 0.55, b - h * 0.38, 9, 20, sd, '#e8dcc8');
    c.fillStyle = '#1a0e0c'; c.fillRect(cx + r * 0.25, b - h * 0.62, 8, h * 0.2); flame(c, cx + r * 0.25 + 4, b - h * 0.62, 0.7, fx); fx.smokes.push([cx + r * 0.25 + 4, b - h * 0.72]);
    c.fillStyle = '#140808'; archPath(c, cx - 8, b, 16, 20); c.fill(); fx.glows.push([cx, b - 8, 14, '#ff8a2a']); roundWin(c, cx - r * 0.55, b - h * 0.26, 3.5, A.glow, fx); roundWin(c, cx + r * 0.55, b - h * 0.26, 3.5, A.glow, fx);
    const sx = x + w - 12; c.fillStyle = '#1a0e0c'; c.fillRect(sx - 1, b - 36, 2, 36); c.fillStyle = '#4a2a22'; rr(c, sx - 8, b - 32, 16, 13, 2); c.fill(); drawEmblem(c, 'flame', sx, b - 25.5, 10, '#ffb040'); fx.glows.push([sx, b - 26, 10, '#ff8a2a']);
    lavaPool(c, x + w * 0.78, b - 2, 9, 3, fx);
  },
  market(c, A, s, tier, col, fx) { // bazar otchłani: obsydianowe ołtarze z misami ognia, trójkątne czerwono-czarne płachty na kolcach, klatki z chochlikami
    const { x, b, w, h } = s;
    for (let i = 0; i < 3; i++) { const sx = x + 6 + i * (w - 12) / 3, sw = (w - 12) / 3 - 8, sb = b - (i % 2) * 5;
      for (const px of [sx, sx + sw]) shard(c, px, sb, 5, 38, 0, '#26160f'); fillPoly(c, [[sx - 3, sb - 30], [sx + sw / 2, sb - 42], [sx + sw + 3, sb - 30]], i % 2 ? '#1e1010' : '#8a1a14'); fillPoly(c, [[sx + sw / 2, sb - 42], [sx + sw + 3, sb - 30], [sx + sw / 2, sb - 30]], i % 2 ? '#140808' : '#6a120e');
      slabRect(c, sx, sb - 12, sw, 12, OBSID); for (let k = 0; k < 3; k++) circ(c, sx + 5 + k * (sw - 10) / 2, sb - 14, 2.2, ['#ffd040', '#c83a2a', '#ff8a2a'][(i + k) % 3]); }
    for (const px of [x + 2, x + w - 2]) { c.strokeStyle = '#3a2a26'; c.lineWidth = 1.2; c.beginPath(); for (let k = -6; k <= 6; k += 3) { c.moveTo(px + k, b); c.lineTo(px + k, b - 18); } c.moveTo(px - 7, b - 18); c.lineTo(px + 7, b - 18); c.stroke(); drawCreature(c, 'imp', px, b - 1, 0.55, px < x + w / 2 ? 1 : -1, 0); }
    for (const px of [x + w * 0.35, x + w * 0.68]) { c.fillStyle = '#1a0e0c'; c.fillRect(px - 1.5, b - 20, 3, 20); c.fillRect(px - 5, b - 22, 10, 3); flame(c, px, b - 22, 0.5, fx); }
  },
  smith(c, A, s, tier, col, fx) { // piekielna kuźnia: piec w kształcie twarzy demona z żarem w paszczy, kowadło nad lawą, łańcuchy
    const { x, b, w, h } = s; demonFace(c, x + w * 0.34, b, w * 0.6, h * 0.72, fx, true);
    c.fillStyle = '#1a0e0c'; c.fillRect(x + w * 0.5, b - h * 0.86, 8, h * 0.24); flame(c, x + w * 0.5 + 4, b - h * 0.86, 0.7, fx); fx.smokes.push([x + w * 0.5 + 4, b - h * 0.96]);
    lavaPool(c, x + w * 0.8, b - 2, 11, 3.5, fx); c.fillStyle = '#2a1a16'; c.fillRect(x + w * 0.8 - 4, b - 10, 8, 8); drawEmblem(c, 'anvil', x + w * 0.8, b - 14, 13, '#5a3a34'); c.fillStyle = '#ff9a3a'; c.fillRect(x + w * 0.8 - 5, b - 18, 8, 2);
    c.strokeStyle = '#5a4a46'; c.lineWidth = 1.4; for (const px of [x + w * 0.66, x + w - 3]) for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(px, b - 44 + k * 4, 1.4, 2.2, 0, 0, TAU); c.stroke(); }
    c.fillStyle = '#3a2420'; c.fillRect(x + w * 0.64, b - 46, w * 0.38, 3);
  },
  silo(c, A, s, tier, col, fx) { // skład siarki: żółte hałdy, obsydianowy kopiec-schowek, dymiące szczeliny
    const { x, b, w, h } = s;
    fillPoly(c, [[x + 2, b], [x + w * 0.18, b - h * 0.5], [x + w * 0.32, b - h * 0.62], [x + w * 0.5, b - h * 0.46], [x + w * 0.58, b]], '#3a2420'); fillPoly(c, [[x + w * 0.32, b - h * 0.62], [x + w * 0.5, b - h * 0.46], [x + w * 0.58, b], [x + w * 0.34, b]], '#26140f');
    c.fillStyle = '#140808'; archPath(c, x + w * 0.2, b, 12, 16); c.fill(); fx.glows.push([x + w * 0.26, b - 6, 10, '#ff8a2a']);
    for (const [px, pw, ph] of [[x + w * 0.62, 18, 14], [x + w * 0.84, 14, 10]]) { fillPoly(c, [[px - pw / 2, b], [px - 2, b - ph], [px + 3, b - ph + 1], [px + pw / 2, b]], '#e8c030'); fillPoly(c, [[px + 3, b - ph + 1], [px + pw / 2, b], [px + 2, b]], '#b8901a'); }
    for (const px of [x + w * 0.72, x + w * 0.95]) fx.smokes.push([px, b - 4, 0.5]);
  },
});

// ==================== AKADEMIA: marmur, złote cebulaste kopuły, minarety, kryształowe pylony, latające skały ====================
const GOLD = '#d8a830', ICE = '#a8e0ff';
function snowLedge(c, x, y, w) { c.fillStyle = 'rgba(244,248,255,.95)'; c.fillRect(x - 1, y - 1.5, w + 2, 2.5); for (let px = x + 2; px < x + w - 2; px += 7) c.fillRect(px, y + 0.5, 3, 1.5); }
function minaret(c, A, cx, b, h, fx) { // smukła wieża z balkonikiem i złotą cebulką
  wallRect(c, A, cx - 6, b - h, 12, h); archWin(c, cx - 2.5, b - h * 0.55, 5, 9, A.glow, fx);
  c.fillStyle = A.wall[1]; c.fillRect(cx - 9, b - h * 0.78, 18, 3); c.fillStyle = GOLD; c.fillRect(cx - 9, b - h * 0.78 - 1, 18, 1.4); snowLedge(c, cx - 9, b - h * 0.78, 18);
  onion(c, cx, b - h, 7, GOLD, fx);
}
function floatRock(c, cx, cy, w, h, col = '#8a94a6') { // latająca skała: płaski wierzch, spód jak odwrócony stożek
  fillPoly(c, [[cx - w / 2, cy], [cx + w / 2, cy], [cx + w * 0.2, cy + h * 0.6], [cx + w * 0.05, cy + h], [cx - w * 0.15, cy + h * 0.55]], col);
  fillPoly(c, [[cx + w * 0.1, cy], [cx + w / 2, cy], [cx + w * 0.2, cy + h * 0.6], [cx + w * 0.05, cy + h]], sh(col, -0.28)); snowLedge(c, cx - w / 2, cy, w);
}
function book(c, x, y, col, rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.fillRect(-3.5, -4.5, 7, 9); c.fillStyle = '#f0ead8'; c.fillRect(2.5, -4, 1.5, 8); c.fillStyle = sh(col, -0.35); c.fillRect(-3.5, -4.5, 1.2, 9); c.restore(); }
Object.assign(BUILD_ART.academy, {
  hall(c, A, s, tier, col, fx) { // marmurowy pawilon ze złotą cebulastą kopułą; wyżej minarety, arkada i kryształ nad kopułą, na końcu latające wysepki i złoty pierścień
    const { x, b, w, h } = s, cx = x + w / 2, pw = w * (0.4 + tier * 0.04), ph = h * (0.34 + tier * 0.03), pt = b - ph, dr = 13 + tier * 3.5;
    if (tier >= 2) for (const sd of [-1, 1]) minaret(c, A, cx + sd * (pw / 2 + 14), b, h * (0.72 + tier * 0.08), fx);
    if (tier >= 4) { for (const [dx, dy, rw] of [[-58, -1.06, 26], [60, -0.98, 22], [-30, -1.3, 16]]) { const ry = b + h * dy; floatRock(c, cx + dx, ry, rw, rw * 0.6); wallRect(c, A, cx + dx - 4, ry - 12, 8, 12); onion(c, cx + dx, ry - 12, 4, GOLD, fx); fx.glows.push([cx + dx, ry + rw * 0.5, rw * 0.6, ICE]); } }
    wallRect(c, A, cx - pw / 2, pt, pw, ph); snowLedge(c, cx - pw / 2, pt, pw); c.fillStyle = GOLD; c.fillRect(cx - pw / 2, pt + 3, pw, 2);
    const n = tier >= 3 ? 3 : 2; for (let i = 0; i < n; i++) { const wx = cx - pw / 2 + (i + 0.5) * pw / n; if (tier >= 3 && i === 1) continue; archWin(c, wx - 5, pt + 10, 10, ph - 26, A.glow, fx); }
    if (tier >= 3) { arcade(c, cx - pw * 0.28, b, pw * 0.56, ph * 0.5, 3, '#1a2030', sh(ICE, -0.2)); }
    doorArt(c, A, cx - 8, b, 16, 22);
    const dw2 = dr * 1.5; wallRect(c, A, cx - dw2 / 2, pt - 12, dw2, 12); snowLedge(c, cx - dw2 / 2, pt - 12, dw2); onion(c, cx, pt - 12, dr, GOLD, fx);
    if (tier >= 3) crystal(c, cx, pt - 12 - dr * 2 - 22, 5 + tier, ICE, fx);
    if (tier >= 4) { c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, pt - 12 - dr * 0.9, dr * 1.6, 5, 0, 0, TAU); c.stroke(); }
    bannerArt(c, cx + pw / 2 - 4, pt - 22, col);
  },
  fort(c, A, s, tier, col, fx) { // biały mur z półokrągłymi blankami, kryształowe pylony z migoczącą barierą, złota brama podkowiasta; wyżej oko na kolumnie, na końcu latająca cytadela
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 3) { const iy = b - h * 1.08; c.strokeStyle = '#8a8a90'; c.lineWidth = 1; for (const dx of [-22, 22]) { c.beginPath(); c.moveTo(cx + dx, iy + 26); c.lineTo(cx + dx * 1.4, b - h * 0.3); c.stroke(); } // łańcuchy
      floatRock(c, cx, iy, 96, 44); fx.glows.push([cx, iy + 36, 40, ICE]);
      for (const [dx, th] of [[-28, 28], [0, 44], [28, 28]]) { wallRect(c, A, cx + dx - 7, iy - th, 14, th); archWin(c, cx + dx - 2.5, iy - th + 8, 5, 9, A.glow, fx); onion(c, cx + dx, iy - th, dx ? 7 : 9, GOLD, fx); } bannerArt(c, cx, iy - 44 - 38, col); }
    if (tier === 2) { const oy = b - h * 0.86; c.fillStyle = A.wall[0]; c.fillRect(cx - 5, oy + 12, 10, b - oy - 12); c.fillStyle = GOLD; c.fillRect(cx - 7, oy + 10, 14, 3); // oko na kolumnie
      circ(c, cx, oy, 12, '#e8f4ff'); circ(c, cx, oy, 7, '#3a6ab8'); circ(c, cx, oy, 3, '#0a1020'); circ(c, cx - 3, oy - 3, 1.6, '#ffffff'); c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx, oy, 18, 5, 0.2, 0, TAU); c.stroke(); fx.glows.push([cx, oy, 28, ICE]); bannerArt(c, cx + 20, oy - 10, col); }
    const wh = h * 0.26, wy = b - wh; wallRect(c, A, x + 12, wy, w - 24, wh); c.fillStyle = GOLD; c.fillRect(x + 12, wy + 4, w - 24, 2);
    for (let px = x + 16; px < x + w - 16; px += 10) { c.fillStyle = A.wall[0]; c.beginPath(); c.arc(px + 3, wy, 3.5, Math.PI, 0); c.fill(); } snowLedge(c, x + 12, wy, w - 24);
    const pyl = [x + 8, cx - 30, cx + 30, x + w - 8], ph = h * (tier >= 2 ? 0.6 : 0.52);
    for (let i = 0; i < pyl.length - 1; i++) { c.strokeStyle = ICE; c.lineWidth = 1.2; c.beginPath(); c.moveTo(pyl[i], b - ph + 2); c.quadraticCurveTo((pyl[i] + pyl[i + 1]) / 2, b - ph + 16, pyl[i + 1], b - ph + 2); c.stroke(); fx.glows.push([(pyl[i] + pyl[i + 1]) / 2, b - ph + 10, 22, ICE]); } // bariera
    for (const px of pyl) { fillPoly(c, [[px - 6, b], [px - 3.5, b - ph], [px + 3.5, b - ph], [px + 6, b]], A.wall[0]); fillPoly(c, [[px + 1, b], [px + 0.5, b - ph], [px + 3.5, b - ph], [px + 6, b]], A.wall[1]); c.fillStyle = GOLD; c.fillRect(px - 5, b - ph * 0.3, 10, 2); crystal(c, px, b - ph - 12, 5, ICE, fx); }
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(cx - 17, b); c.lineTo(cx - 17, b - 22); c.arc(cx, b - 24, 17, Math.PI * 0.85, Math.PI * 0.15); c.lineTo(cx + 17, b); c.closePath(); c.fill(); // brama podkowiasta
    c.fillStyle = '#1a2030'; c.beginPath(); c.moveTo(cx - 12, b); c.lineTo(cx - 12, b - 22); c.arc(cx, b - 24, 12, Math.PI * 0.85, Math.PI * 0.15); c.lineTo(cx + 12, b); c.closePath(); c.fill();
    drawEmblem(c, 'eye', cx, b - 24, 10, ICE); fx.glows.push([cx, b - 20, 18, ICE]);
  },
  guild(c, A, s, tier, col, fx) { // latająca biblioteka: bębny z księgami rozdzielone świecącymi szczelinami, krążące księgi; na szczycie otwarta wielka księga
    const { x, b, w, h } = s, cx = x + w / 2, dw = w * 0.72, dh = h * 0.12, gap = 6;
    slabRect(c, cx - dw / 2 - 4, b - 6, dw + 8, 6, A.wall[1]); let y = b - 6;
    for (let i = 0; i < tier; i++) { const ww = dw * (1 - i * 0.07); wallRect(c, A, cx - ww / 2, y - dh, ww, dh); c.fillStyle = '#2a2030'; c.fillRect(cx - ww / 2 + 5, y - dh + 5, ww - 10, dh - 9);
      for (let k = 0; k < (ww - 12) / 4; k++) { c.fillStyle = ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#8a6a2a', '#5a2a6a'][(k + i) % 5]; c.fillRect(cx - ww / 2 + 6 + k * 4, y - dh + 7 + (k % 3), 3, dh - 12 - (k % 3)); } // grzbiety ksiąg
      c.fillStyle = GOLD; c.fillRect(cx - ww / 2 - 1, y - dh - 1, ww + 2, 2); snowLedge(c, cx - ww / 2, y - dh, ww);
      fx.glows.push([cx, y - dh - gap / 2, ww * 0.6, ICE]); y -= dh + gap; }
    for (let k = 0; k < tier + 1; k++) { const a = k / (tier + 1) * TAU + 0.6, bx = cx + Math.cos(a) * (dw * 0.75), by = b - 20 - k * (h * 0.1) + Math.sin(a) * 4; book(c, bx, by, ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#8a6a2a', '#5a2a6a'][k % 5], a); }
    if (tier >= 5) { const by = y - 10; fillPoly(c, [[cx - 20, by - 6], [cx, by + 2], [cx + 20, by - 6], [cx + 20, by + 1], [cx, by + 9], [cx - 20, by + 1]], '#f4eee0'); c.fillStyle = '#4a3a8a'; c.fillRect(cx - 20, by + 1, 40, 3); fx.glows.push([cx, by - 4, 30, ICE]); }
    else { hemiDome(c, cx, y + gap - 1, dw * 0.28, GOLD, 10); }
  },
  tavern(c, A, s, tier, col, fx) { // okrągła herbaciarnia: marmurowy bęben, płaska złota kopuła w śniegu, latarnie
    const { x, b, w, h } = s, cx = x + w * 0.42, dw = w * 0.56, dh = h * 0.42;
    wallRect(c, A, cx - dw / 2, b - dh, dw, dh); snowLedge(c, cx - dw / 2, b - dh, dw); c.fillStyle = GOLD; c.fillRect(cx - dw / 2, b - dh + 4, dw, 2);
    for (const dx of [-0.3, 0.3]) archWin(c, cx + dx * dw - 4, b - dh + 10, 8, 14, A.glow, fx); doorArt(c, A, cx - 7, b, 14, 19);
    hemiDome(c, cx, b - dh, dw * 0.56, GOLD, dh * 0.55); c.fillStyle = 'rgba(244,248,255,.95)'; c.beginPath(); c.ellipse(cx - 4, b - dh - dh * 0.44, dw * 0.26, 4, 0, 0, TAU); c.fill();
    c.fillStyle = '#4a4e58'; c.fillRect(cx + dw * 0.3, b - dh - 16, 6, 14); fx.smokes.push([cx + dw * 0.3 + 3, b - dh - 17]);
    for (const px of [cx - dw / 2 - 6, cx + dw / 2 + 6]) { c.fillStyle = '#3a3e48'; c.fillRect(px - 1, b - 30, 2, 30); c.fillStyle = GOLD; c.fillRect(px - 4, b - 36, 8, 7); c.fillStyle = ICE; c.fillRect(px - 2.5, b - 34.5, 5, 4); fx.glows.push([px, b - 32, 10, ICE]); }
    signArt(c, A, 'mug', x + w - 8, b - 30, 30, false);
  },
  market(c, A, s, tier, col, fx) { // rotunda: krąg kolumn pod złotą kopułą, w środku unoszą się kryształy i zwoje
    const { x, b, w, h } = s, cx = x + w / 2, rw = w * 0.66, top = b - h * 0.62;
    slabRect(c, cx - rw / 2 - 8, b - 5, rw + 16, 5, A.wall[1]); slabRect(c, cx - rw / 2 - 4, b - 9, rw + 8, 4, A.wall[0]);
    c.fillStyle = '#2a3040'; c.fillRect(cx - rw / 2, top, rw, b - 9 - top);
    for (const [dx, cl] of [[-0.25, ICE], [0.05, '#e0a0ff'], [0.3, '#f0e0a0']]) { const px = cx + dx * rw, py = b - 22 + dx * 8; crystal(c, px, py, 4, cl, fx); }
    c.fillStyle = '#f4eee0'; c.fillRect(cx - 12, b - 34, 10, 5); c.fillRect(cx + 4, b - 30, 9, 4); fx.glows.push([cx, b - 30, 16, '#fff4c0']); // zwoje
    for (let i = 0; i < 5; i++) { const px = cx - rw / 2 + i * (rw - 6) / 4; c.fillStyle = A.wall[0]; c.fillRect(px, top, 6, b - 9 - top); c.fillStyle = A.wall[1]; c.fillRect(px + 4, top, 2, b - 9 - top); }
    c.fillStyle = A.wall[0]; c.fillRect(cx - rw / 2 - 4, top - 5, rw + 8, 5); c.fillStyle = GOLD; c.fillRect(cx - rw / 2 - 4, top - 2, rw + 8, 2); hemiDome(c, cx, top - 5, rw * 0.5, GOLD, h * 0.3); snowLedge(c, cx - rw * 0.3, top - 5 - h * 0.26, rw * 0.3);
  },
  smith(c, A, s, tier, col, fx) { // warsztat parowy: mosiężny kocioł, wielkie koło zębate, rury i komin z parą
    const { x, b, w, h } = s, bw = w * 0.5, top = b - h * 0.5;
    wallRect(c, A, x + 2, top, bw, b - top); roofArt(c, GABLE, A.roof.util, x + 2, top, bw, h * 0.24); gableSnow(c, x + 2, top, bw, h * 0.24); doorArt(c, A, x + 2 + bw / 2 - 7, b, 14, 18);
    gear(c, x + 2 + bw * 0.2, top + 12, 7, '#c8a040');
    const kx = x + w * 0.74; c.fillStyle = '#b88a30'; rr(c, kx - 13, b - 22, 26, 20, 8); c.fill(); c.fillStyle = '#e0b850'; c.fillRect(kx - 10, b - 20, 20, 3); c.fillStyle = '#8a6420'; for (const dx of [-9, 0, 9]) c.fillRect(kx + dx - 0.8, b - 22, 1.6, 20); // kocioł
    c.fillStyle = '#6a6e78'; c.fillRect(kx + 6, b - 44, 5, 22); fx.smokes.push([kx + 8.5, b - 46]); fx.smokes.push([kx + 8.5, b - 46, 0.7]);
    c.strokeStyle = '#8a6420'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(kx - 13, b - 12); c.lineTo(x + 2 + bw, b - 12); c.moveTo(kx - 8, b - 22); c.lineTo(kx - 8, b - 30); c.lineTo(x + 2 + bw, b - 30); c.stroke();
    gear(c, x + w * 0.56, b - 34, 9, '#a0a4b0'); circ(c, kx, b - 12, 3, '#ff9a3a'); fx.glows.push([kx, b - 12, 12, '#ff9a3a']);
  },
  silo(c, A, s, tier, col, fx) { // magazyn: skrzynie unoszące się nad świecącym kręgiem run, obok mała kopuła
    const { x, b, w, h } = s, cx = x + w * 0.62;
    const dw = w * 0.36; wallRect(c, A, x + 2, b - h * 0.34, dw, h * 0.34); hemiDome(c, x + 2 + dw / 2, b - h * 0.34, dw * 0.56, A.roof.util, h * 0.22); snowLedge(c, x + 2, b - h * 0.34, dw); doorArt(c, A, x + 2 + dw / 2 - 5, b, 10, 14);
    c.strokeStyle = ICE; c.lineWidth = 1.4; c.beginPath(); c.ellipse(cx, b - 3, 18, 4, 0, 0, TAU); c.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.fillStyle = ICE; c.fillRect(cx + Math.cos(a) * 18 - 1, b - 3 + Math.sin(a) * 4 - 1, 2, 2); } fx.glows.push([cx, b - 6, 24, ICE]);
    crate(c, cx - 7, b - 12, 11); crate(c, cx + 7, b - 16, 10); crate(c, cx, b - 30, 9);
  },
});

// ==================== LOCH: fasady wykute w skale, skalne grzbiety, stalagmity, ametysty i fiolet ====================
const ROCK = '#4e4858', AMETH = '#b070f0';
function carvedFacade(c, cx, b, w, h, fx, glow = '#c080ff') { // wykuta fasada: wnęka, dwie kolumny, nadproże z trójkątem, drzwi ze światłem
  c.fillStyle = '#2a2632'; c.fillRect(cx - w / 2, b - h, w, h); c.fillStyle = '#1a1620'; c.fillRect(cx - w / 2, b - h, w, 3);
  for (const sd of [-1, 1]) { const px = cx + sd * w * 0.32; c.fillStyle = '#6a6474'; c.fillRect(px - 3.5, b - h + 8, 7, h - 8); c.fillStyle = '#4a4454'; c.fillRect(px + 1.5, b - h + 8, 2, h - 8); c.fillStyle = '#7a7484'; c.fillRect(px - 5, b - h + 6, 10, 3); }
  fillPoly(c, [[cx - w / 2 - 2, b - h], [cx, b - h - h * 0.3], [cx + w / 2 + 2, b - h]], '#5a5464'); fillPoly(c, [[cx, b - h - h * 0.3], [cx + w / 2 + 2, b - h], [cx, b - h]], '#443e4e');
  c.fillStyle = '#0a0610'; archPath(c, cx - w * 0.16, b, w * 0.32, h * 0.72); c.fill(); c.fillStyle = glow; c.fillRect(cx - w * 0.1, b - h * 0.22, w * 0.2, h * 0.22); fx.glows.push([cx, b - h * 0.2, w * 0.4, glow]);
}
function mineCart(c, x, b, w, load, fx) { // wózek kopalniany na szynach z ładunkiem
  fillPoly(c, [[x, b - 14], [x + w, b - 14], [x + w - 3, b - 4], [x + 3, b - 4]], '#5a4a3a'); c.fillStyle = '#3a2e24'; c.fillRect(x, b - 14, w, 2); c.fillStyle = '#7a7478'; c.fillRect(x + 1, b - 10, w - 2, 1.5);
  for (const dx of [5, w - 5]) { circ(c, x + dx, b - 3, 3, '#2a2630'); circ(c, x + dx, b - 3, 1, '#8a8490'); }
  for (let k = 0; k < 3; k++) { const px = x + 4 + k * (w - 8) / 2; if (load === 'crystal') { crystal(c, px, b - 18, 3, AMETH, fx); } else circ(c, px, b - 16, 3.5, load); }
}
Object.assign(BUILD_ART.dungeon, {
  hall(c, A, s, tier, col, fx) { // skała z wykutą fasadą; wyżej okna i chorągwie, druga kondygnacja z kryształami, na końcu wykuta twarz władcy w koronie
    const { x, b, w, h } = s, cx = x + w / 2, rh = h * (0.6 + tier * 0.12), rw = w * (0.74 + tier * 0.04), r = mulberry32(41 + tier);
    const pts = [[cx - rw / 2, b]]; for (let i = 0; i <= 8; i++) { const f = i / 8, bump = Math.sin(f * Math.PI); pts.push([cx - rw / 2 + rw * f, b - rh * (0.55 + bump * 0.45) * (0.9 + r() * 0.12)]); } pts.push([cx + rw / 2, b]);
    rockPoly(c, pts, ROCK, 11 + tier);
    if (tier >= 3) for (const [dx, sc] of [[-0.38, 0.55], [0.34, 0.7]]) { crystals(c, cx + dx * rw, b - rh * 0.72, sc, AMETH); fx.glows.push([cx + dx * rw, b - rh * 0.8, 16, AMETH]); }
    if (tier >= 4) { const fy = b - rh * 0.78, fw = rw * 0.44; // twarz władcy
      c.fillStyle = '#3a3444'; c.fillRect(cx - fw / 2, fy - 6, fw, 6); for (const sd of [-1, 1]) { c.fillStyle = '#0a0610'; c.beginPath(); c.ellipse(cx + sd * fw * 0.24, fy + 5, 6, 3.5, 0, 0, TAU); c.fill(); circ(c, cx + sd * fw * 0.24, fy + 5, 2, '#e0a0ff'); fx.glows.push([cx + sd * fw * 0.24, fy + 5, 12, '#c080ff']); }
      fillPoly(c, [[cx - 4, fy + 6], [cx, fy + 18], [cx + 4, fy + 6]], '#3a3444'); c.fillStyle = '#2a2632'; c.fillRect(cx - fw * 0.22, fy + 22, fw * 0.44, 3);
      for (let k = 0; k < 5; k++) fillPoly(c, [[cx - fw / 2 + k * fw / 5, fy - 6], [cx - fw / 2 + (k + 0.5) * fw / 5, fy - 18 - (k === 2 ? 6 : 0)], [cx - fw / 2 + (k + 1) * fw / 5, fy - 6]], '#6a6474'); circ(c, cx, fy - 22, 2.4, '#e0a0ff'); } // korona
    if (tier >= 3) { const fy2 = b - rh * (tier >= 4 ? 0.48 : 0.62); carvedFacade(c, cx, fy2, 36, 22, fx); c.fillStyle = '#5a5464'; c.fillRect(cx - 22, fy2, 44, 3); for (let px = cx - 20; px < cx + 20; px += 5) c.fillRect(px, fy2 - 6, 1.5, 6); } // druga kondygnacja z balkonem
    carvedFacade(c, cx, b - 6, 52, h * 0.4, fx);
    for (let k = 0; k < 3; k++) slabRect(c, cx - 30 + k * 4, b - 6 + k * 2, 60 - k * 8, 2 + (k === 2 ? 0 : 0), '#5a5464'); // stopnie
    if (tier >= 2) { for (const sd of [-1, 1]) { const px = cx + sd * rw * 0.3; c.fillStyle = '#0a0610'; c.fillRect(px - 2.5, b - rh * 0.5, 5, 12); c.fillStyle = '#c080ff'; c.fillRect(px - 1.2, b - rh * 0.5 + 1, 2.4, 10); fx.wins.push([px - 1.2, b - rh * 0.5 + 1, 2.4, 10, '#c080ff']); c.fillStyle = '#5a2a6a'; c.fillRect(cx + sd * 18 - 3, b - 6 - h * 0.4, 6, 18); fillPoly(c, [[cx + sd * 18 - 3, b - 6 - h * 0.4 + 18], [cx + sd * 18, b - 6 - h * 0.4 + 22], [cx + sd * 18 + 3, b - 6 - h * 0.4 + 18]], '#5a2a6a'); } }
    bannerArt(c, cx + rw * 0.22, b - rh - 14, col);
  },
  fort(c, A, s, tier, col, fx) { // skalne grzbiety z wykutymi blankami, brama w pieczarze z broną i runami, wydrążone stalagmity; wyżej skalna iglica i wielka skała z kryształem
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 3) { const kw = w * 0.56, kh = h * 1.08; rockPoly(c, [[cx - kw / 2, b], [cx - kw * 0.4, b - kh * 0.7], [cx - kw * 0.2, b - kh * 0.86], [cx + kw * 0.05, b - kh], [cx + kw * 0.3, b - kh * 0.82], [cx + kw / 2, b - kh * 0.6], [cx + kw / 2, b]], '#443e4e', 77);
      for (const f of [0.6, 0.8]) { const y = b - kh * f; c.fillStyle = '#2a2632'; for (let px = cx - kw * 0.3; px < cx + kw * 0.3; px += 9) c.fillRect(px, y - 6, 5, 6); c.fillStyle = '#5a5464'; c.fillRect(cx - kw * 0.32, y, kw * 0.64, 3); }
      crystal(c, cx + kw * 0.05, b - kh - 24, 9, AMETH, fx); fx.glows.push([cx, b - kh - 20, 40, '#c080ff']); }
    if (tier === 2) { const sx = cx - w * 0.22, sh2 = h * 0.98; rockPoly(c, [[sx - 20, b], [sx - 12, b - sh2 * 0.6], [sx - 4, b - sh2], [sx + 8, b - sh2 * 0.75], [sx + 20, b]], '#443e4e', 55); for (let k = 0; k < 3; k++) { c.fillStyle = '#0a0610'; c.fillRect(sx - 3, b - sh2 * (0.3 + k * 0.18), 5, 10); c.fillStyle = '#c080ff'; c.fillRect(sx - 1.8, b - sh2 * (0.3 + k * 0.18) + 1, 2.6, 8); fx.wins.push([sx - 1.8, b - sh2 * (0.3 + k * 0.18) + 1, 2.6, 8, '#c080ff']); } bannerArt(c, sx - 4, b - sh2 - 20, col); }
    const r = mulberry32(61), ridge = (x0, x1) => { const pts = [[x0, b]]; for (let px = x0; px <= x1; px += 12) pts.push([px, b - h * (0.28 + r() * 0.12)]); pts.push([x1, b]); rockPoly(c, pts, ROCK, (x0 | 0) + 3); const top = b - h * 0.28; c.fillStyle = '#2a2632'; for (let px = x0 + 6; px < x1 - 6; px += 10) c.fillRect(px, top - 2, 5, 5); };
    ridge(x + 14, cx - 26); ridge(cx + 26, x + w - 14);
    for (const tx of [x + 12, x + w - 12]) { stalag(c, tx, b, 26, h * (tier >= 2 ? 0.86 : 0.72), '#4a4454'); for (let k = 0; k < 2; k++) { c.fillStyle = '#0a0610'; c.fillRect(tx - 3, b - h * (0.24 + k * 0.2), 4, 8); c.fillStyle = '#c080ff'; c.fillRect(tx - 2, b - h * (0.24 + k * 0.2) + 1, 2, 6); fx.wins.push([tx - 2, b - h * (0.24 + k * 0.2) + 1, 2, 6, '#c080ff']); } }
    rockPoly(c, [[cx - 30, b], [cx - 26, b - h * 0.46], [cx - 8, b - h * 0.58], [cx + 12, b - h * 0.54], [cx + 30, b - h * 0.4], [cx + 30, b]], '#524a5c', 7);
    c.fillStyle = '#0a0610'; archPath(c, cx - 14, b, 28, h * 0.4); c.fill(); c.strokeStyle = '#7a7484'; c.lineWidth = 1.2; c.beginPath(); for (let i = -10; i <= 10; i += 4) { c.moveTo(cx + i, b - h * 0.36); c.lineTo(cx + i, b - 4); } c.moveTo(cx - 12, b - h * 0.2); c.lineTo(cx + 12, b - h * 0.2); c.stroke(); // brona
    for (let k = 0; k < 7; k++) { const a = Math.PI + k / 6 * Math.PI, rx = cx + Math.cos(a) * 18, ry = b - h * 0.4 + 14 + Math.sin(a) * 18; c.fillStyle = '#c080ff'; c.fillRect(rx - 1, ry - 1.5, 2, 3); } fx.glows.push([cx, b - h * 0.34, 24, '#c080ff']); // runy
  },
  guild(c, A, s, tier, col, fx) { // geoda ametystu: krąg run, kryształy rosnące z każdym poziomem, odłamki na orbicie, na końcu wielki unoszący się kryształ
    const { x, b, w, h } = s, cx = x + w / 2;
    c.fillStyle = '#2a2632'; c.beginPath(); c.ellipse(cx, b - 4, w * 0.56, 8, 0, 0, TAU); c.fill(); c.strokeStyle = '#c080ff'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(cx, b - 4, w * 0.48, 6, 0, 0, TAU); c.stroke(); fx.glows.push([cx, b - 6, 30, '#c080ff']);
    rockMound(c, cx - w * 0.44, b - 2, w * 0.88, 16, '#3a3444', 3);
    const main = 30 + tier * 16, cr = (px, hh, ww, lean, col2) => { fillPoly(c, [[px - ww / 2, b - 10], [px - ww / 2 + lean, b - 10 - hh * 0.85], [px + lean, b - 10 - hh], [px + ww / 2 + lean, b - 10 - hh * 0.85], [px + ww / 2, b - 10]], col2); fillPoly(c, [[px + lean, b - 10 - hh], [px + ww / 2 + lean, b - 10 - hh * 0.85], [px + ww / 2, b - 10], [px + 1, b - 10]], sh(col2, -0.3)); c.fillStyle = sh(col2, 0.35); c.fillRect(px - ww / 2 + 2 + lean * 0.3, b - 10 - hh * 0.7, 2, hh * 0.5); };
    cr(cx - 12, main * 0.55, 10, -4, '#8a50c8'); cr(cx + 13, main * 0.62, 11, 4, '#9a60d8'); cr(cx, main, 15, 0, AMETH); if (tier >= 2) { cr(cx - 20, main * 0.35, 8, -6, '#7a40b8'); cr(cx + 20, main * 0.4, 8, 5, '#8a50c8'); }
    fx.glows.push([cx, b - main * 0.6, 20 + tier * 4, '#c080ff']);
    if (tier >= 3) for (let k = 0; k < tier; k++) { const a = k / tier * TAU + 0.3, px = cx + Math.cos(a) * 22, py = b - main * 0.7 + Math.sin(a) * 6; fillPoly(c, [[px, py - 5], [px + 2.5, py], [px, py + 4], [px - 2.5, py]], '#e0b0ff'); }
    if (tier >= 5) { crystal(c, cx, b - main - 30, 8, '#e0a0ff', fx); fx.glows.push([cx, b - main - 30, 30, '#c080ff']); }
  },
  tavern(c, A, s, tier, col, fx) { // gospoda w wielkim głazie: okrągłe drzwi, okna, na szczycie rośnie świecący grzyb
    const { x, b, w, h } = s, rw = w * 0.7;
    rockMound(c, x + 2, b, rw, h * 0.66, '#524a5c', 23); glowShroom(c, x + rw * 0.62, b - h * 0.56, 1.1, '#6a3a9a', fx);
    c.fillStyle = '#0a0610'; c.beginPath(); c.ellipse(x + rw * 0.4, b - 9, 8, 10, 0, Math.PI, 0); c.fill(); c.fillRect(x + rw * 0.4 - 8, b - 9, 16, 9); c.fillStyle = '#7a5a3a'; c.beginPath(); c.ellipse(x + rw * 0.4, b - 9, 6, 8, 0, Math.PI, 0); c.fill(); c.fillRect(x + rw * 0.4 - 6, b - 9, 12, 9); circ(c, x + rw * 0.4 + 3, b - 6, 1, '#e0c060');
    roundWin(c, x + rw * 0.18, b - h * 0.32, 3.5, '#c080ff', fx); roundWin(c, x + rw * 0.66, b - h * 0.28, 3.5, '#c080ff', fx); lantern(c, x + rw * 0.4 + 12, b - 24, 4, '#e0a0ff', fx);
    signArt(c, A, 'mug', x + w - 10, b - 30, 30, false); barrel(c, x + w - 22, b);
  },
  market(c, A, s, tier, col, fx) { // targ górników: wózki kopalniane na szynach z kryształami, rudą i grzybami, latarnie na słupach
    const { x, b, w, h } = s;
    c.fillStyle = '#3a3040'; for (let px = x + 2; px < x + w - 2; px += 7) c.fillRect(px, b - 2, 4, 2); c.fillStyle = '#8a8490'; c.fillRect(x, b - 3, w, 1.2); // szyny
    mineCart(c, x + 6, b - 1, 30, 'crystal', fx); mineCart(c, x + w / 2 - 15, b - 1, 30, '#8a7a6a', fx); mineCart(c, x + w - 36, b - 1, 30, '#c0a0e0', fx);
    for (const px of [x + 2, x + w * 0.36, x + w * 0.68, x + w - 2]) { c.fillStyle = '#4a3a2a'; c.fillRect(px - 1.2, b - 40, 2.4, 38); c.fillRect(px - 5, b - 40, 10, 2); lantern(c, px + 4, b - 38, 3, '#e0a0ff', fx); }
    c.strokeStyle = '#3a2e24'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, b - 40); c.quadraticCurveTo(x + w / 2, b - 32, x + w - 2, b - 40); c.stroke();
  },
  smith(c, A, s, tier, col, fx) { // kuźnia w grocie z wózkiem rudy i stojakiem kilofów
    const { x, b, w, h } = s, cx = caveMouth(c, x, b, w * 0.72, h * 0.74, '#4a4454', '#ff8a3a', fx);
    circ(c, cx, b - 6, 5, '#ffb040'); fx.smokes.push([cx + 6, b - h * 0.64]); drawEmblem(c, 'anvil', cx + 14, b - 6, 12, '#8a8494');
    mineCart(c, x + w * 0.68, b, 22, '#6a6060', fx);
    for (const [dx, a] of [[-4, -0.5], [4, 0.5]]) { c.save(); c.translate(x + w - 6 + dx, b - 20); c.rotate(a); c.fillStyle = '#6a4a2a'; c.fillRect(-1, -2, 2, 20); c.fillStyle = '#8a8494'; c.beginPath(); c.moveTo(-7, -1); c.quadraticCurveTo(0, -6, 7, -1); c.lineTo(0, -3); c.closePath(); c.fill(); c.restore(); } // kilofy
  },
  silo(c, A, s, tier, col, fx) { // szyb kopalni: drewniana wieża z kołem, lina w głąb, wózek i hałda rudy
    const { x, b, w, h } = s, tx = x + w * 0.36;
    c.fillStyle = '#0a0610'; c.beginPath(); c.ellipse(tx, b - 3, 12, 4, 0, 0, TAU); c.fill();
    c.strokeStyle = '#5a4028'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx - 14, b); c.lineTo(tx - 2, b - h * 0.72); c.moveTo(tx + 14, b); c.lineTo(tx + 2, b - h * 0.72); c.moveTo(tx + 26, b); c.lineTo(tx + 2, b - h * 0.66); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(tx - 9, b - h * 0.3); c.lineTo(tx + 9, b - h * 0.3); c.moveTo(tx - 6, b - h * 0.5); c.lineTo(tx + 6, b - h * 0.5); c.stroke();
    c.strokeStyle = '#3a2e24'; c.lineWidth = 2; c.beginPath(); c.arc(tx, b - h * 0.76, 7, 0, TAU); c.stroke(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(tx + Math.cos(a) * 7, b - h * 0.76 + Math.sin(a) * 7); c.lineTo(tx - Math.cos(a) * 7, b - h * 0.76 - Math.sin(a) * 7); c.stroke(); }
    c.strokeStyle = '#8a7a6a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(tx + 7, b - h * 0.76); c.lineTo(tx + 7, b - 4); c.stroke();
    mineCart(c, x + w * 0.62, b, 20, '#6a6060', fx); fillPoly(c, [[x + w * 0.84, b], [x + w * 0.92, b - 10], [x + w, b]], '#5a5460'); circ(c, x + w * 0.9, b - 6, 1.5, AMETH);
  },
});

// ==================== CYTADELA: jurty ze skór, kły i czaszki bestii, cyklopowe głazy, kamienne idole ====================
const HIDE = '#b88a58', FELT = '#d8b888';
function beastSkull(c, cx, cy, s) { // czaszka rogatej bestii z wielkimi rogami
  c.strokeStyle = '#e8dcc0'; c.lineCap = 'round'; c.lineWidth = 3.5 * s; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(cx + sd * 5 * s, cy - 3 * s); c.quadraticCurveTo(cx + sd * 18 * s, cy - 4 * s, cx + sd * 16 * s, cy - 16 * s); c.stroke(); }
  fillPoly(c, [[cx - 7 * s, cy - 5 * s], [cx + 7 * s, cy - 5 * s], [cx + 5 * s, cy + 6 * s], [cx + 2 * s, cy + 10 * s], [cx - 2 * s, cy + 10 * s], [cx - 5 * s, cy + 6 * s]], BONE);
  for (const sd of [-1, 1]) circ(c, cx + sd * 3 * s, cy - 0.5 * s, 1.8 * s, '#1a120a'); c.fillStyle = '#6a5a4a'; c.fillRect(cx - 1.5 * s, cy + 5 * s, 3 * s, 2 * s);
}
function yurt(c, cx, b, w, h, fx, smoke = true) { // jurta: niski walec z filcu w pasy i kopulasty dach ze skór z otworem dymnym
  const wh = h * 0.42; c.fillStyle = FELT; c.fillRect(cx - w / 2, b - wh, w, wh); c.fillStyle = sh(FELT, -0.25); c.fillRect(cx + w * 0.2, b - wh, w * 0.3, wh);
  c.fillStyle = '#8a3a1a'; c.fillRect(cx - w / 2, b - wh * 0.6, w, 3); c.fillStyle = '#e0b050'; for (let px = cx - w / 2 + 3; px < cx + w / 2 - 3; px += 7) fillPoly(c, [[px, b - wh * 0.6], [px + 3, b - wh * 0.6 - 3], [px + 6, b - wh * 0.6]], '#e0b050');
  c.fillStyle = HIDE; c.beginPath(); c.ellipse(cx, b - wh, w / 2 + 3, h - wh, 0, Math.PI, 0); c.closePath(); c.fill(); c.fillStyle = sh(HIDE, -0.28); c.beginPath(); c.ellipse(cx + w * 0.12, b - wh, w * 0.38, (h - wh) * 0.92, 0, Math.PI * 1.5, 0); c.lineTo(cx + w * 0.12, b - wh); c.closePath(); c.fill();
  c.strokeStyle = sh(HIDE, -0.4); c.lineWidth = 1; for (const f of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(cx + f * w * 0.5, b - wh); c.quadraticCurveTo(cx + f * w * 0.25, b - h * 0.9, cx, b - h + 2); c.stroke(); }
  c.fillStyle = '#3a2a1a'; c.fillRect(cx - 4, b - h - 1, 8, 3); if (smoke && fx) fx.smokes.push([cx, b - h - 2]);
}
function boulderWall(c, x0, x1, b, h, seed) { // mur z nieregularnych wielkich głazów (dwa rzędy)
  const r = mulberry32(seed); for (let row = 0; row < 2; row++) { const rb = b - row * h * 0.5, rh = h * 0.52; for (let px = x0 + (row ? 7 : 0); px < x1 - 4; px += 14 + r() * 4) { const bw = 14 + r() * 6; c.fillStyle = ['#a88a64', '#9a7a58', '#b8986e'][(r() * 3) | 0]; c.beginPath(); c.ellipse(px + bw / 2, rb - rh / 2, bw / 2, rh / 2, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(40,24,10,.3)'; c.beginPath(); c.ellipse(px + bw * 0.62, rb - rh * 0.4, bw * 0.3, rh * 0.36, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,240,210,.25)'; c.fillRect(px + bw * 0.25, rb - rh * 0.8, bw * 0.3, 2); } }
}
function watchPost(c, x, b, w, h, roof, fx) { // strażnica na palach z dachem ze skór i bębnem
  stiltLegs(c, x, b, w, h * 0.6); c.fillStyle = '#6a4424'; c.fillRect(x - 3, b - h * 0.6 - 3, w + 6, 4); c.fillStyle = '#5a3a1a'; for (let px = x - 2; px <= x + w + 2; px += 5) c.fillRect(px, b - h * 0.6 - 12, 2, 10); c.fillRect(x - 3, b - h * 0.6 - 13, w + 6, 2);
  hideTent(c, x - 4, b - h * 0.6 - 13, w + 8, h * 0.34, roof, null); c.fillStyle = '#8a3a1a'; c.beginPath(); c.ellipse(x + w / 2, b - h * 0.6 - 8, 4, 3, 0, 0, TAU); c.fill();
}
Object.assign(BUILD_ART.stronghold, {
  hall(c, A, s, tier, col, fx) { // jurta wodza z czaszką bestii nad wejściem; wyżej palisada i totemy, długi dom na głazach z rogami, na końcu kamienny łeb olbrzyma
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 4) { const hy = b - h * 1.02, hw = w * 0.56; mesa(c, cx - hw / 2 - 6, b - h * 0.3, hw + 12, h * 0.78, '#a8703e'); // kamienny łeb
      c.fillStyle = '#7a4a24'; c.fillRect(cx - hw * 0.34, hy + h * 0.14, hw * 0.68, 6); for (const sd of [-1, 1]) { c.fillStyle = '#2a1608'; c.beginPath(); c.ellipse(cx + sd * hw * 0.18, hy + h * 0.24, 7, 4.5, 0, 0, TAU); c.fill(); circ(c, cx + sd * hw * 0.18, hy + h * 0.24, 2.2, '#ffb050'); fx.glows.push([cx + sd * hw * 0.18, hy + h * 0.24, 12, '#ffb050']); }
      fillPoly(c, [[cx - 6, hy + h * 0.26], [cx - 9, hy + h * 0.4], [cx + 9, hy + h * 0.4], [cx + 6, hy + h * 0.26]], '#8a5a30'); c.fillStyle = '#3a2210'; c.fillRect(cx - hw * 0.22, hy + h * 0.46, hw * 0.44, 5); for (const sd of [-1, 1]) fillPoly(c, [[cx + sd * hw * 0.16, hy + h * 0.47], [cx + sd * hw * 0.19, hy + h * 0.34], [cx + sd * hw * 0.22, hy + h * 0.47]], '#f0e8d0'); }
    if (tier >= 2 && tier < 4) { palisade(c, x + 4, x + w - 4, b - 6, 24, '#7a5030'); for (const sd of [-1, 1]) totem(c, cx + sd * w * 0.42, b, h * 0.52, '#7a4a24', '#ffb050'); }
    if (tier >= 3) { // długi dom na cokole z głazów, rogi na kalenicy
      boulderWall(c, cx - w * 0.36, cx + w * 0.36, b, 16, 5); const lw = w * 0.56, lt = b - 16 - h * 0.28; wallRect(c, A, cx - lw / 2, lt, lw, h * 0.28); roofArt(c, GABLE, '#a88048', cx - lw / 2, lt, lw, h * 0.26); // strzecha
      c.strokeStyle = '#f0e8d0'; c.lineWidth = 3; c.lineCap = 'round'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(cx, lt - h * 0.26 + 2); c.quadraticCurveTo(cx + sd * 16, lt - h * 0.34, cx + sd * 12, lt - h * 0.5); c.stroke(); }
      winArt(c, A, cx - lw / 2 + 8, lt + 8, 8, 8, fx); winArt(c, A, cx + lw / 2 - 16, lt + 8, 8, 8, fx); c.fillStyle = '#2a1608'; c.fillRect(cx - 9, b - 16 - 22, 18, 22); beastSkull(c, cx, lt + 6, 0.9); fx.smokes.push([cx + lw * 0.3, lt - h * 0.2]);
      bannerArt(c, cx + lw / 2 + 8, lt - 20, col); return;
    }
    if (tier === 2) yurt(c, cx + w * 0.34, b, 36, 34, fx, false);
    const yw = w * 0.5, yh = h * 0.62; yurt(c, cx - (tier === 2 ? 10 : 0), b, yw, yh, fx);
    const dx = cx - (tier === 2 ? 10 : 0); c.fillStyle = '#5a3a1a'; c.fillRect(dx - 9, b - 22, 18, 22); c.fillStyle = '#2a1608'; c.fillRect(dx - 7, b - 20, 14, 20); c.fillStyle = '#8a3a1a'; c.fillRect(dx - 7, b - 20, 14, 5);
    beastSkull(c, dx, b - 30, 1.1);
    for (const sd of [-1, 1]) { const px = dx + sd * (yw / 2 + 6); c.fillStyle = '#5a3a1a'; c.fillRect(px - 1, b - 40, 2.4, 40); fillPoly(c, [[px, b - 40], [px + sd * 12, b - 36], [px + sd * 10, b - 26], [px, b - 28]], col); } // chorągwie ze skór
  },
  fort(c, A, s, tier, col, fx) { // mur z cyklopowych głazów, brama z kłów mamuta z czaszką, strażnice na palach; wyżej wieża z głazów z ogniskiem, na końcu warownia na mesie
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 3) { const mw = w * 0.62, mh = h * 0.86; mesa(c, cx - mw / 2 + 10, b, mw, mh, '#a8703e'); palisade(c, cx - mw * 0.32 + 10, cx + mw * 0.32 + 10, b - mh, 18, '#6a4424'); for (const px of [cx - mw * 0.2 + 10, cx + mw * 0.24 + 10]) bannerArt(c, px, b - mh - 36, col); c.fillStyle = '#8a3a1a'; c.beginPath(); c.ellipse(cx + 10, b - mh - 6, 6, 4, 0, 0, TAU); c.fill(); }
    if (tier >= 2) { const tx = cx - w * 0.24, n = tier >= 3 ? 6 : 5; for (let i = 0; i < n; i++) { const rw2 = 34 - i * 3, y = b - 8 - i * 12; c.fillStyle = i % 2 ? '#a88a64' : '#9a7a58'; c.beginPath(); c.ellipse(tx, y, rw2 / 2, 7, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(40,24,10,.3)'; c.beginPath(); c.ellipse(tx + rw2 * 0.18, y + 1, rw2 * 0.28, 5, 0, 0, TAU); c.fill(); }
      flame(c, tx, b - 8 - n * 12 + 4, 1.2, fx); if (tier === 2) bannerArt(c, tx + 16, b - n * 12 - 24, col); } // wieża z głazów z ogniskiem
    boulderWall(c, x + 16, cx - 24, b, h * 0.36, 3); boulderWall(c, cx + 24, x + w - 16, b, h * 0.36, 4);
    if (tier >= 2) for (const [x0, x1] of [[x + 18, cx - 26], [cx + 26, x + w - 18]]) { c.fillStyle = '#6a4424'; c.fillRect(x0, b - h * 0.36 - 3, x1 - x0, 4); c.fillStyle = '#5a3a1a'; for (let px = x0; px < x1; px += 6) c.fillRect(px, b - h * 0.36 - 11, 2, 9); c.fillRect(x0, b - h * 0.36 - 12, x1 - x0, 2); } // pomosty
    for (const tx of [x - 2, x + w - 26]) watchPost(c, tx, b, 28, h * (tier >= 2 ? 0.86 : 0.74), A.roof.wall, fx);
    c.fillStyle = '#2a1608'; c.fillRect(cx - 16, b - 30, 32, 30); c.fillStyle = '#6a4424'; for (let i = 0; i < 7; i++) c.fillRect(cx - 15 + i * 4.4, b - 29, 3.4, 29); c.fillStyle = '#3a2210'; c.fillRect(cx - 16, b - 22, 32, 2.5); c.fillRect(cx - 16, b - 10, 32, 2.5);
    tusks(c, cx, b, 46, 50); beastSkull(c, cx, b - 44, 1.2);
  },
  guild(c, A, s, tier, col, fx) { // namiot szamana z porożem, łapacze snów, totemy w kręgu, duchy w dymie
    const { x, b, w, h } = s, cx = x + w / 2, th = h * (0.34 + tier * 0.07), tw = w * 0.9;
    const n = Math.min(tier + 1, 5); for (let i = 0; i < n; i++) { const a = Math.PI * (0.1 + 0.8 * i / Math.max(1, n - 1)), px = cx - Math.cos(a) * w * 0.7; totem(c, px, b + 2, 26 + (i % 2) * 8, '#7a4a24', '#ffb050'); }
    hideTent(c, cx - tw / 2, b, tw, th, A.roof.util, fx);
    c.strokeStyle = '#d8c8a0'; c.lineWidth = 2; c.lineCap = 'round'; for (const sd of [-1, 1]) { const bx = cx + sd * 3, by = b - th - 6; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + sd * 12, by - 14); c.moveTo(bx + sd * 6, by - 7); c.lineTo(bx + sd * 2, by - 14); c.moveTo(bx + sd * 10, by - 11); c.lineTo(bx + sd * 16, by - 12); c.stroke(); } // poroże
    for (const [dx, dy] of [[-0.3, 0.5], [0.28, 0.42]]) { const px = cx + dx * tw, py = b - th * dy; c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.2; c.beginPath(); c.arc(px, py, 5, 0, TAU); c.stroke(); c.lineWidth = 0.6; c.beginPath(); c.moveTo(px - 4, py); c.lineTo(px + 4, py); c.moveTo(px, py - 4); c.lineTo(px, py + 4); c.stroke(); for (const fxo of [-3, 0, 3]) { c.fillStyle = '#e8e0cc'; c.fillRect(px + fxo - 0.6, py + 6, 1.2, 5); } } // łapacze snów
    if (tier >= 3) for (let k = 0; k < tier - 1; k++) { const sy = b - th - 26 - k * 14, sx = cx + Math.sin(k * 2.1) * 8; circ(c, sx, sy, 3, '#b8f0e0'); fx.glows.push([sx, sy, 12, '#a8f0d8']); } // duchy w dymie
    if (tier >= 5) { const ey = b - th - 90; fillPoly(c, [[cx - 14, ey], [cx - 4, ey - 3], [cx, ey - 7], [cx + 4, ey - 3], [cx + 14, ey], [cx + 3, ey + 2], [cx, ey + 6], [cx - 3, ey + 2]], '#c8f0ff'); fx.glows.push([cx, ey, 26, '#a8f0d8']); } // duch orła
  },
  tavern(c, A, s, tier, col, fx) { // dom miodu: długi namiot ze skór z łatami, rożen z pieczenią nad ogniem, beczki
    const { x, b, w, h } = s, tw = w * 0.66, th = h * 0.5, tx = x + 2;
    c.fillStyle = HIDE; c.beginPath(); c.moveTo(tx, b); c.lineTo(tx, b - th * 0.5); c.quadraticCurveTo(tx + tw / 2, b - th * 1.3, tx + tw, b - th * 0.5); c.lineTo(tx + tw, b); c.closePath(); c.fill();
    c.fillStyle = sh(HIDE, -0.25); c.beginPath(); c.moveTo(tx + tw * 0.55, b); c.lineTo(tx + tw * 0.55, b - th * 0.92); c.quadraticCurveTo(tx + tw * 0.8, b - th * 0.95, tx + tw, b - th * 0.5); c.lineTo(tx + tw, b); c.closePath(); c.fill();
    for (const [px, py, pw, ph, cl] of [[0.12, 0.62, 10, 8, '#8a6a44'], [0.36, 0.86, 12, 7, '#c8a878'], [0.7, 0.58, 9, 9, '#6a4a2a']]) { c.fillStyle = cl; c.fillRect(tx + tw * px, b - th * py, pw, ph); } // łaty
    c.fillStyle = '#2a1608'; c.fillRect(tx + tw * 0.3, b - 20, 16, 20); c.fillStyle = '#6a4a2a'; fillPoly(c, [[tx + tw * 0.3, b - 20], [tx + tw * 0.3 + 8, b - 20], [tx + tw * 0.3, b - 6]], '#6a4a2a'); fx.smokes.push([tx + tw * 0.5, b - th * 1.1]);
    const sx = x + w * 0.84; limb(c, sx - 10, b, sx - 6, b - 18, 1.6, '#4a2a14'); limb(c, sx + 10, b, sx + 6, b - 18, 1.6, '#4a2a14'); limb(c, sx - 8, b - 16, sx + 8, b - 16, 1.4, '#3a2a1a');
    c.fillStyle = '#8a4a24'; c.beginPath(); c.ellipse(sx, b - 16, 7, 4, 0, 0, TAU); c.fill(); flame(c, sx, b - 2, 0.5, fx); barrel(c, x + w * 0.66, b);
    signArt(c, A, 'mug', tx + tw + 4, b - 30, 30, false);
  },
  market(c, A, s, tier, col, fx) { // stanica kupiecka: dywany z towarem na ziemi, kram z daszkiem ze skór, wóz karawany
    const { x, b, w, h } = s;
    for (const [rx, rw, c1, c2] of [[x + 4, 30, '#8a2a1a', '#e0b050'], [x + 40, 26, '#2a5a7a', '#e8dcc0']]) { fillPoly(c, [[rx, b - 1], [rx + rw, b - 1], [rx + rw - 4, b - 8], [rx + 4, b - 8]], c1); c.strokeStyle = c2; c.lineWidth = 1; c.beginPath(); c.moveTo(rx + 5, b - 4.5); c.lineTo(rx + rw - 5, b - 4.5); c.stroke();
      for (let k = 0; k < 3; k++) { const px = rx + 7 + k * (rw - 14) / 2; if (k === 1) { c.fillStyle = '#a0603a'; c.beginPath(); c.ellipse(px, b - 10, 3.5, 4, 0, 0, TAU); c.fill(); } else circ(c, px, b - 9, 2.4, ['#e8a030', '#8ac04a', '#d83a2a'][k]); } }
    const kx = x + w * 0.58; for (const px of [kx, kx + 24]) { c.fillStyle = '#5a3a1a'; c.fillRect(px, b - 30, 2.4, 30); } fillPoly(c, [[kx - 4, b - 28], [kx + 12, b - 36], [kx + 29, b - 28]], HIDE); c.fillStyle = '#6a4424'; c.fillRect(kx - 1, b - 12, 28, 4);
    for (let k = 0; k < 3; k++) { c.save(); c.translate(kx + 5 + k * 8, b - 18); c.rotate(-0.3); c.fillStyle = '#5a3a1a'; c.fillRect(-1, -4, 2, 12); c.fillStyle = '#a8a49a'; fillPoly(c, [[-1, -4], [5, -7], [5, -1], [-1, -1]], '#a8a49a'); c.restore(); } // topory
    const wx = x + w - 20; c.fillStyle = '#e8dcc0'; c.beginPath(); c.ellipse(wx, b - 12, 14, 12, 0, Math.PI, 0); c.fill(); c.fillStyle = '#b8a888'; c.fillRect(wx - 14, b - 13, 28, 3); c.fillStyle = '#6a4424'; c.fillRect(wx - 15, b - 10, 30, 4);
    for (const dx of [-9, 9]) { circ(c, wx + dx, b - 4, 4.5, '#4a2a14'); circ(c, wx + dx, b - 4, 1.4, '#8a6a44'); } // wóz
  },
  smith(c, A, s, tier, col, fx) { // kuźnia pod daszkiem ze skór: palenisko z kamieni, stojak z toporami i włóczniami, kamień szlifierski
    const { x, b, w, h } = s, top = b - h * 0.62;
    for (const px of [x + 4, x + w * 0.64]) { c.fillStyle = '#5a3a1a'; c.fillRect(px, top, 3, b - top); }
    fillPoly(c, [[x - 2, top + 2], [x + w * 0.34, top - 10], [x + w * 0.72, top + 2]], HIDE); fillPoly(c, [[x + w * 0.34, top - 10], [x + w * 0.72, top + 2], [x + w * 0.42, top + 2]], sh(HIDE, -0.3));
    boulderWall(c, x + 10, x + 38, b, 14, 9); circ(c, x + 24, b - 14, 5, '#ffb040'); fx.glows.push([x + 24, b - 16, 22, '#ff9a3a']); fx.smokes.push([x + 24, top - 4]);
    drawEmblem(c, 'anvil', x + w * 0.5, b - 6, 13, '#4a3a2a');
    const rx = x + w * 0.76; c.fillStyle = '#5a3a1a'; c.fillRect(rx, b - 26, 2, 26); c.fillRect(rx + 16, b - 26, 2, 26); c.fillRect(rx, b - 24, 18, 2);
    for (let k = 0; k < 3; k++) { const px = rx + 3 + k * 5; c.fillStyle = '#6a4424'; c.fillRect(px, b - 30, 1.6, 30); c.fillStyle = '#a8a49a'; if (k === 1) fillPoly(c, [[px - 1, b - 34], [px + 0.8, b - 40], [px + 2.6, b - 34]], '#a8a49a'); else fillPoly(c, [[px + 1.6, b - 28], [px + 6, b - 31], [px + 6, b - 24], [px + 1.6, b - 25]], '#a8a49a'); }
    c.fillStyle = '#9a8a74'; c.beginPath(); c.arc(x + w - 4, b - 7, 6, 0, TAU); c.fill(); c.fillStyle = '#5a3a1a'; c.fillRect(x + w - 5, b - 8, 2, 8);
  },
  silo(c, A, s, tier, col, fx) { // gliniane spichlerze, worki ziarna i kości bestii
    const { x, b, w, h } = s; mudDrum(c, A, x + 4, b, w * 0.42, h * 0.42, '#b89050', fx); mudDrum(c, A, x + w * 0.46, b, w * 0.3, h * 0.3, '#a88040', fx);
    sack(c, x + w * 0.84, b, 0.9); sack(c, x + w * 0.95, b, 0.7, '#c8a870'); c.save(); c.translate(x + w * 0.4, b - 2); c.rotate(-0.2); c.fillStyle = BONE; c.fillRect(-9, -1.5, 18, 3); circ(c, -9, 0, 2.4, BONE); circ(c, 9, 0, 2.4, BONE); c.restore();
  },
});
