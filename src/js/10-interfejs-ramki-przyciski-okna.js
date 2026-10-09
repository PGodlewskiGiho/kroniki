// ==================== INTERFEJS: RAMKI, PRZYCISKI, OKNA =================================
// Kamień, pergamin, przyciski, okna dialogowe, dymki, ikony przycisków.
// --- pixel art interfejsu ---
// Pergamin, kamień i tła przycisków malujemy w buforze o połowie rozdzielczości (1 piksel grafiki = 2 px ekranu), z paletą
// i ditheringiem (crispLayer: twarde krawędzie, 3 stopnie krycia), i powiększamy bez wygładzania — tak jak mapę, sceny i jednostki.
function uiLayer(key, w, h, paint) {
  return Layers.get('ui_' + key, w, h, c => { c.imageSmoothingEnabled = !PIXEL_ART; paint(c, w, h); c.canvas._ctx = c; crispLayer(c.canvas, 12); }, PIXEL_ART ? 1 / PIX : undefined); // gładki styl: w pełnej rozdzielczości ekranu
}
function drawUi(ctx, c, x, y) { ctx.save(); ctx.imageSmoothingEnabled = !PIXEL_ART; ctx.drawImage(c, Math.round(x), Math.round(y), c.width / c._s, c.height / c._s); ctx.restore(); }
// --- system wizualny „oprawiona kronika” (docs/interfejs.md): drewno ramy, skóra paneli, pergamin dokumentów, złote okucia 3D ---
const UI = { txt: '#ecdcb4', txt2: '#b9a47a', txtOff: '#7d6c52', ink: '#2a1808', ink2: '#5b4126', goldHi: '#ffe7a3', gold: '#c9a14a', goldLo: '#6a4814', good: '#7fbf5a', bad: '#d0503a', mana: '#6a9ae8' };
// Ozdoba z arkusza interfejsu (tools/grafika3d/wypal-interfejs.js); false, gdy arkusz jeszcze się nie wczytał
const uiArtReady = () => typeof UI_ART !== 'undefined' && UI_ART && UI_IMG.sheet && UI_IMG.sheet._ok;
function drawUiPiece(ctx, key, x, y, w, h) {
  if (!uiArtReady() || !UI_ART.f[key]) return false; const [sx, sy, sw, sh] = UI_ART.f[key];
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(UI_IMG.sheet, sx, sy, sw, sh, x, y, w ?? sw / 2, h ?? sh / 2); ctx.restore(); return true;
}
// Złota listwa (rama) o grubości t wokół prostokąta: światło z góry, cień na dole, ciemne obrysy z obu stron
function goldRim(c, x, y, w, h, t = 4) {
  c.save(); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#fff0b8'); g.addColorStop(0.08, '#d9b45c'); g.addColorStop(0.5, '#a07a30'); g.addColorStop(0.92, '#6a4814'); g.addColorStop(1, '#c9a14a');
  c.beginPath(); c.rect(x, y, w, h); c.rect(x + t, y + t, w - 2 * t, h - 2 * t); c.fillStyle = g; c.fill('evenodd');
  c.lineWidth = 1; c.strokeStyle = 'rgba(255,240,190,.55)'; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); // połysk na grzbiecie listwy
  c.strokeStyle = '#0e0905'; c.lineWidth = 1.5; c.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5); c.strokeRect(x + t - 0.25, y + t - 0.25, w - 2 * t + 0.5, h - 2 * t + 0.5); c.restore();
}
// Ciemna skóra (wnętrze paneli): ciepłe plamy, drobne ziarno, przyciemnione brzegi
function leatherFill(c, x, y, w, h, seed = 1, tone = 0) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); const r = mulberry32(seed * 977 + Math.round(w) * 7 + Math.round(h));
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, shadeHex('#3a291c', tone)); g.addColorStop(1, shadeHex('#24180f', tone)); c.fillStyle = g; c.fillRect(x, y, w, h);
  for (let i = 0; i < w * h / 2500 + 4; i++) { const px = x + r() * w, py = y + r() * h, rad = 20 + r() * 70, gg = c.createRadialGradient(px, py, 0, px, py, rad), a = 0.05 + r() * 0.07;
    gg.addColorStop(0, r() < 0.5 ? `rgba(120,80,45,${a})` : `rgba(0,0,0,${a * 1.4})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
  c.fillStyle = noise(c); c.globalAlpha = 0.5; c.fillRect(x, y, w, h); c.globalAlpha = 1;
  const e = Math.min(26, w / 4, h / 4); for (const [x0, y0, x1, y1] of [[x, y, x, y + e], [x, y + h, x, y + h - e], [x, y, x + e, y], [x + w, y, x + w - e, y]]) { const eg = c.createLinearGradient(x0, y0, x1, y1); eg.addColorStop(0, 'rgba(0,0,0,.45)'); eg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = eg; c.fillRect(x, y, w, h); }
  c.restore();
}
// Ciemne drewno ramy ekranu: poziome deski ze słojami i sękami, szczeliny, winieta
function paintWood(c, w, h, seed = 1) {
  const r = mulberry32(seed * 7919 + Math.round(w) * 31 + Math.round(h)), PH = 72; c.fillStyle = '#140d08'; c.fillRect(0, 0, w, h);
  for (let y0 = -((seed * 13) % PH), k = 0; y0 < h; y0 += PH, k++) {
    const t = r(), base = shadeHex('#2a1c11', (t - 0.5) * 0.12), g = c.createLinearGradient(0, y0, 0, y0 + PH); g.addColorStop(0, shadeHex(base, 0.05)); g.addColorStop(0.5, base); g.addColorStop(1, shadeHex(base, -0.12));
    c.fillStyle = g; c.fillRect(0, y0 + 1, w, PH - 2); c.save(); c.beginPath(); c.rect(0, y0 + 1, w, PH - 2); c.clip();
    for (let i = 0; i < 34; i++) { const yy = y0 + 3 + r() * (PH - 6), amp = 1 + r() * 3, f = 0.004 + r() * 0.01, ph = r() * 9; c.strokeStyle = r() < 0.55 ? `rgba(0,0,0,${0.08 + r() * 0.12})` : `rgba(160,110,60,${0.03 + r() * 0.05})`; c.lineWidth = 0.6 + r() * 1.2;
      c.beginPath(); for (let x = -10; x <= w + 10; x += 12) { const yv = yy + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph * 2) * amp * 0.3; x < 0 ? c.moveTo(x, yv) : c.lineTo(x, yv); } c.stroke(); }
    if (r() < 0.6) { const kx = r() * w, ky = y0 + PH * (0.3 + r() * 0.4); for (let j = 4; j > 0; j--) { c.strokeStyle = `rgba(0,0,0,${0.1 + j * 0.04})`; c.lineWidth = 1; c.beginPath(); c.ellipse(kx, ky, j * 5, j * 1.8, 0, 0, TAU); c.stroke(); } }
    c.restore(); c.fillStyle = 'rgba(255,220,170,.04)'; c.fillRect(0, y0 + 1, w, 1); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, y0 + PH - 1, w, 1.5);
  }
  c.fillStyle = noise(c); c.globalAlpha = 0.35; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
}
// Romb z pikseli (ozdoba rogów i przerywników): rzędy po 2 px
function pixDiamond(ctx, cx, cy, col, n = 3) {
  cx = Math.round(cx / 2) * 2; cy = Math.round(cy / 2) * 2; ctx.fillStyle = col;
  for (let i = -n + 1; i < n; i++) { const hw = (n - Math.abs(i)) * 2; ctx.fillRect(cx - hw, cy + i * 2 - 1, hw * 2, 2); }
}
function drawCorners(ctx, x, y, w, h) {
  if (!PIXEL_ART && uiArtReady()) { const S = Math.min(46, Math.max(26, Math.min(w, h) * 0.16)), o = S * 0.2; drawUiPiece(ctx, 'corner_tl', x - o, y - o, S, S); drawUiPiece(ctx, 'corner_tr', x + w - S + o, y - o, S, S); drawUiPiece(ctx, 'corner_bl', x - o, y + h - S + o, S, S); drawUiPiece(ctx, 'corner_br', x + w - S + o, y + h - S + o, S, S); return; }
  for (const [cx, cy] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) { pixDiamond(ctx, cx, cy, '#6a4a14', 4); pixDiamond(ctx, cx, cy - 1, '#e0b44c', 3); pixDiamond(ctx, cx - 1, cy - 2, '#fff0b0', 1); }
}
// Cegły kamiennego tła: każda w nieco innym odcieniu, jaśniejsza krawędź u góry, cień u dołu, fuga 2 px
// Mur z cegieł (pixel art w połowie rozdzielczości): różne odcienie, wyszczerbienia, pęknięcia, mech przy dole,
// a gdzieniegdzie wyblakłe malowidła (fryz, herb, słońce), wyryte runy i żelazne kółka
function paintBricks(c, w, h, seed = 1) {
  const r = mulberry32(seed * 7919 + Math.round(w) * 31 + Math.round(h)), MORT = '#28231e', px = (x, y, a = 2, b = 2) => c.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, a, b);
  c.fillStyle = MORT; c.fillRect(0, 0, w, h);
  for (let yy = 0, row = 0; yy < h; yy += 20, row++) for (let xx = row % 2 ? -22 : 0; xx < w; xx += 44) {
    const t = r(), k = yy / Math.max(1, h), kind = r(); let v = Math.round(74 + t * 10 - k * 26); if (kind < 0.06) v -= 14;
    c.fillStyle = kind < 0.14 ? `rgb(${v + 13},${v + 1},${v - 9})` : kind < 0.17 ? `rgb(${v + 3},${v + 1},${v - 3})` : `rgb(${v + 6},${v},${v - 8})`; c.fillRect(xx + 2, yy + 2, 42, 18);
    c.fillStyle = 'rgba(255,238,200,.08)'; c.fillRect(xx + 2, yy + 2, 42, 2); c.fillRect(xx + 2, yy + 2, 2, 18);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(xx + 2, yy + 18, 42, 2); c.fillRect(xx + 42, yy + 2, 2, 18);
    for (let k2 = 0; k2 < 3; k2++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.22)' : 'rgba(255,240,210,.08)'; c.fillRect(xx + 6 + Math.floor(r() * 16) * 2, yy + 6 + Math.floor(r() * 5) * 2, 2 + (r() < 0.3 ? 2 : 0), 2); }
    if (r() < 0.2) { c.fillStyle = MORT; const L = r() < 0.5, T = r() < 0.5; px(L ? xx + 2 : xx + 38, T ? yy + 2 : yy + 16, 6, 4); px(L ? xx + 2 : xx + 40, T ? yy + 6 : yy + 14, 4, 2); } // wyszczerbiony róg
    if (r() < 0.07) { c.fillStyle = 'rgba(10,8,6,.5)'; let cx = xx + 10 + r() * 24, cy = yy + 2; while (cy < yy + 18) { px(cx, cy); cy += 2; cx += r() < 0.4 ? 2 : r() < 0.5 ? -2 : 0; } } // pęknięcie
    if (r() < 0.05 + k * k * 0.3) for (let m = 0; m < 10; m++) { c.fillStyle = ['#3a5a2a', '#4a6a30', '#2e4a24'][m % 3]; px(xx + 4 + r() * 38, yy + 14 + r() * 6 - (m % 4 === 0 ? 4 : 0)); } // mech
  }
  const mortar = (x0, y0, x1, y1) => { c.fillStyle = 'rgba(40,35,30,.7)'; for (let yy = 0, row = 0; yy < h; yy += 20, row++) { if (yy < y0 - 20 || yy > y1) continue; c.fillRect(x0, yy, x1 - x0, 2); for (let xx = row % 2 ? -22 : 0; xx < w; xx += 44) if (xx >= x0 && xx <= x1) c.fillRect(xx, Math.max(y0, yy), 2, 20); } };
  const at = (mw, mh) => [Math.floor(r() * Math.max(1, (w - mw - 16) / 2)) * 2 + 8, Math.floor(r() * Math.max(1, (h - mh - 16) / 2)) * 2 + 8];
  const n = Math.min(5, Math.floor(w * h / 60000 + 0.4 + r())), PAINT = ['#8a2a1e', '#2a4a7a', '#8a6a1e', '#3a5a2a'];
  for (let i = 0; i < n; i++) {
    const q = r(), m = q < 0.28 ? 0 : q < 0.58 ? 1 : q < 0.78 ? 2 : q < 0.9 ? 3 : 4, col = PAINT[Math.floor(r() * PAINT.length)];
    if (m === 0 && w > 180) { // fryz: pas ochry z zygzakiem przez kilka cegieł
      const fw = Math.min(w - 16, 120 + Math.floor(r() * 60) * 2), [x0] = at(fw, 20), y0 = Math.floor(r() * Math.max(1, h / 20 - 1)) * 20 + 4;
      c.globalAlpha = 0.3; c.fillStyle = '#c8a050'; c.fillRect(x0, y0, fw, 14); c.globalAlpha = 0.5; c.fillStyle = col;
      for (let x = 0; x < fw; x += 2) { const z = Math.abs(((x / 2) % 8) - 4); c.fillRect(x0 + x, y0 + 2 + z * 2, 2, 2); } c.fillRect(x0, y0, fw, 2); c.fillRect(x0, y0 + 12, fw, 2);
      c.globalAlpha = 1; mortar(x0, y0, x0 + fw, y0 + 14);
    } else if (m === 1) { // wyblakły herb
      const [x0, y0] = at(48, 58); c.globalAlpha = 0.42; c.fillStyle = col;
      for (let y = 0; y < 58; y += 2) { const half = y < 30 ? 24 : Math.max(0, 24 - Math.round((y - 30) * 0.86)); c.fillRect(x0 + 24 - half, y0 + y, half * 2, 2); }
      c.globalAlpha = 0.4; c.fillStyle = '#e8d8a8'; if (r() < 0.5) { c.fillRect(x0 + 20, y0 + 6, 8, 42); c.fillRect(x0 + 6, y0 + 18, 36, 8); } else for (let y = 0; y < 20; y += 2) c.fillRect(x0 + 24 - y, y0 + 20 + y, 4, 2), c.fillRect(x0 + 20 + y, y0 + 20 + y, 4, 2);
      c.globalAlpha = 1; mortar(x0, y0, x0 + 48, y0 + 58);
    } else if (m === 2) { // słońce
      const [x0, y0] = at(64, 64), cx = x0 + 32, cy = y0 + 32; c.globalAlpha = 0.4; c.fillStyle = '#d8a040';
      for (let y = -14; y < 14; y += 2) for (let x = -14; x < 14; x += 2) if (x * x + y * y < 196) c.fillRect(cx + x, cy + y, 2, 2);
      for (let a = 0; a < 12; a++) for (let d = 18; d < 30; d += 2) px(cx + Math.cos(a * Math.PI / 6) * d, cy + Math.sin(a * Math.PI / 6) * d, 4, 2);
      c.fillStyle = '#8a4a1e'; px(cx - 6, cy - 4, 4, 2); px(cx + 4, cy - 4, 4, 2); px(cx - 4, cy + 6, 8, 2);
      c.globalAlpha = 1; mortar(x0, y0, x0 + 64, y0 + 64);
    } else if (m === 3) { // runy wyryte w jednej cegle
      const row = Math.floor(r() * Math.max(1, h / 20)), xx = Math.floor(r() * Math.max(1, (w - 60) / 44)) * 44 + (row % 2 ? 22 : 0), yy = row * 20; c.fillStyle = 'rgba(12,10,8,.6)';
      for (let g = 0; g < 4; g++) { const gx = xx + 8 + g * 9, gy = yy + 6; px(gx, gy, 2, 10); if (r() < 0.5) px(gx + 2, gy + (r() < 0.5 ? 0 : 4)); if (r() < 0.5) px(gx + 4, gy + 2 + Math.floor(r() * 3) * 2); }
    } else { // żelazne kółko w murze
      const [x0, y0] = at(12, 14); c.fillStyle = '#1a1612'; px(x0 + 4, y0, 4, 4); c.fillStyle = '#5a5048'; for (const [dx, dy] of [[2, 4], [8, 4], [0, 6], [10, 6], [0, 8], [10, 8], [2, 10], [8, 10], [4, 12], [6, 12]]) px(x0 + dx, y0 + dy);
      c.fillStyle = 'rgba(120,60,20,.3)'; px(x0 + 4, y0 + 14, 4, 6);
    }
  }
}
function drawStone(ctx, x, y, w, h) {
  if (!PIXEL_ART) { drawUi(ctx, uiLayer(`panel_${w}x${h}_${uiArtReady() ? 1 : 0}`, w + 10, h + 12, c => paintPanel(c, w, h)), x - 2, y - 2); return; }
  drawUi(ctx, uiLayer(`stonebox_${w}x${h}`, w + 8, h + 10, c => {
    c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, 4, 6, w, h, 6); c.fill();
    c.save(); rr(c, 0, 0, w, h, 6); c.clip(); paintBricks(c, w, h, 3); c.restore();
    c.lineWidth = 4; c.strokeStyle = '#15110d'; rr(c, 0, 0, w, h, 6); c.stroke();
    c.lineWidth = 2; c.strokeStyle = '#b8913f'; rr(c, 6, 6, w - 12, h - 12, 4); c.stroke();
  }), x, y);
  drawCorners(ctx, x, y, w, h);
}
// Panel informacyjny: cień, ciemna skóra, przeszycie, złota listwa, nity w rogach (rysowany z przesunięciem 2 px na cień)
function paintPanel(c, w, h) {
  c.save(); c.translate(2, 2); c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(2, 4, w, h);
  leatherFill(c, 0, 0, w, h, 3); c.save(); c.setLineDash([5, 4]); c.lineWidth = 1.2; c.strokeStyle = 'rgba(176,134,72,.5)'; c.strokeRect(9.5, 9.5, w - 19, h - 19); c.restore();
  goldRim(c, 0, 0, w, h, 4);
  if (w >= 60 && h >= 40) for (const [px, py] of [[2, 2], [w - 12, 2], [2, h - 12], [w - 12, h - 12]]) drawUiPiece(c, 'rivet', px, py, 10, 10);
  c.restore();
}
// Panel w już rysowanej warstwie (np. rama ekranu miasta): bez osobnej warstwy
function paintPanelAt(c, x, y, w, h) { c.save(); c.translate(x - 2, y - 2); paintPanel(c, w, h); c.restore(); }
// Pergamin (tło okien i paneli): pixel art z pamięci (uiLayer): jasny środek, przypalone brzegi w ditheringu, włókna papieru
function drawParchment(ctx, x, y, w, h) { drawUi(ctx, uiLayer(`parch_${w}x${h}`, w + 16, h + 16, c => paintParchment(c, 4, 4, w, h)), x - 4, y - 4); drawCorners(ctx, x, y, w, h); }
function paintParchment(ctx, x, y, w, h) {
  if (!PIXEL_ART) return paintParchmentSmooth(ctx, x, y, w, h);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(ctx, x + 6, y + 8, w, h, 8); ctx.fill();
  rr(ctx, x, y, w, h, 8); ctx.fillStyle = '#d8bf88'; ctx.fill();
  ctx.save(); ctx.clip();
  const rg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.2, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
  rg.addColorStop(0, 'rgba(255,246,214,.4)'); rg.addColorStop(1, 'rgba(92,56,20,.6)');
  ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
  const r = mulberry32(Math.round(w) * 131 + Math.round(h)); // włókna i plamki papieru
  for (let i = 0; i < w * h / 900; i++) { ctx.fillStyle = r() < 0.6 ? 'rgba(120,80,30,.22)' : 'rgba(255,250,225,.3)'; ctx.fillRect(x + Math.floor(r() * w / 2) * 2, y + Math.floor(r() * h / 2) * 2, 2 + Math.floor(r() * 4) * 2, 2); }
  ctx.restore();
  ctx.lineWidth = 4; ctx.strokeStyle = '#3a2410'; rr(ctx, x, y, w, h, 8); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = '#a07a32'; rr(ctx, x + 8, y + 8, w - 16, h - 16, 4); ctx.stroke();
  ctx.restore();
}
function paintParchmentSmooth(c, x, y, w, h) {
  c.save(); const B = 7; // oprawa: ciemne drewno + złota listwa
  c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x + 5, y + 8, w, h); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 2, y + 3, w + 6, h + 8);
  c.fillStyle = '#e4cf9e'; c.fillRect(x, y, w, h); c.save(); c.beginPath(); c.rect(x + B, y + B, w - 2 * B, h - 2 * B); c.clip();
  const rg = c.createRadialGradient(x + w * 0.45, y + h * 0.4, Math.min(w, h) * 0.1, x + w / 2, y + h / 2, Math.hypot(w, h) * 0.6); rg.addColorStop(0, '#f2e3bb'); rg.addColorStop(0.6, '#dcc391'); rg.addColorStop(1, '#a87e48'); c.fillStyle = rg; c.fillRect(x, y, w, h);
  const r = mulberry32(Math.round(w) * 131 + Math.round(h));
  for (let i = 0; i < w * h / 1800 + 6; i++) { const px = x + r() * w, py = y + r() * h, rad = 10 + r() * 60, gg = c.createRadialGradient(px, py, 0, px, py, rad), a = 0.03 + r() * 0.06; gg.addColorStop(0, `rgba(${r() < 0.6 ? '140,95,45' : '255,248,225'},${a})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - rad, py - rad, rad * 2, rad * 2); } // plamy i przetarcia
  c.strokeStyle = 'rgba(120,85,40,.12)'; c.lineWidth = 0.7; for (let i = 0; i < w * h / 700; i++) { const px = x + r() * w, py = y + r() * h, L = 4 + r() * 14, a = (r() - 0.5) * 0.6; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); c.stroke(); } // włókna
  c.fillStyle = noise(c); c.globalAlpha = 0.45; c.fillRect(x, y, w, h); c.globalAlpha = 1;
  const e = 22; for (const [x0, y0, x1, y1] of [[x + B, y, x + B + e, y], [x + w - B, y, x + w - B - e, y], [x, y + B, x, y + B + e], [x, y + h - B, x, y + h - B - e]]) { const eg = c.createLinearGradient(x0, y0, x1, y1); eg.addColorStop(0, 'rgba(96,58,22,.55)'); eg.addColorStop(1, 'rgba(96,58,22,0)'); c.fillStyle = eg; c.fillRect(x, y, w, h); } // przypalony brzeg
  c.restore();
  c.beginPath(); c.rect(x, y, w, h); c.rect(x + B, y + B, w - 2 * B, h - 2 * B); c.fillStyle = '#2a1c11'; c.fill('evenodd'); // drewniana oprawa
  goldRim(c, x, y, w, h, 3); goldRim(c, x + B - 2, y + B - 2, w - 2 * B + 4, h - 2 * B + 4, 2);
  c.restore();
}
// Rozłożona księga (czary): oprawa z czerwonej skóry w złotej listwie, dwie strony pergaminu z cieniem grzbietu i krawędziami kart
function drawBook(ctx, x, y, w, h) { drawUi(ctx, uiLayer(`book_${w}x${h}_${uiArtReady() ? 1 : 0}`, w + 16, h + 16, c => paintBook(c, 4, 4, w, h)), x - 4, y - 4); }
function paintBook(c, x, y, w, h) {
  c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x + 6, y + 9, w, h);
  leatherFill(c, x, y, w, h, 21, -0.05); c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#b0402c'; c.fillRect(x, y, w, h); c.restore(); goldRim(c, x, y, w, h, 3);
  const P = 18, pw = (w - 2 * P) / 2, py = y + P - 4, ph = h - 2 * P + 4;
  for (const [sx, dir] of [[x + P, -1], [x + w / 2, 1]]) {
    for (let k = 3; k > 0; k--) { c.fillStyle = k % 2 ? '#d8c494' : '#bfa978'; c.fillRect(sx + (dir < 0 ? -k * 1.5 : k * 1.5), py + k, pw, ph); } // krawędzie kart pod stroną
    paintParchmentSmoothPage(c, sx, py, pw, ph, dir);
  }
  const g = c.createLinearGradient(x + w / 2 - 26, 0, x + w / 2 + 26, 0); g.addColorStop(0, 'rgba(60,35,12,0)'); g.addColorStop(0.45, 'rgba(60,35,12,.45)'); g.addColorStop(0.5, 'rgba(30,15,5,.6)'); g.addColorStop(0.55, 'rgba(60,35,12,.45)'); g.addColorStop(1, 'rgba(60,35,12,0)'); c.fillStyle = g; c.fillRect(x + w / 2 - 26, py, 52, ph); // grzbiet
  if (uiArtReady()) for (const [px, pyy] of [[x + 2, y + 2], [x + w - 16, y + 2], [x + 2, y + h - 16], [x + w - 16, y + h - 16]]) drawUiPiece(c, 'rivet', px, pyy, 14, 14);
}
function paintParchmentSmoothPage(c, x, y, w, h, dir) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); const g = c.createLinearGradient(x, 0, x + w, 0);
  if (dir < 0) { g.addColorStop(0, '#d9c393'); g.addColorStop(0.15, '#efe0b6'); g.addColorStop(0.85, '#e6d3a5'); g.addColorStop(1, '#c4a872'); } else { g.addColorStop(0, '#c4a872'); g.addColorStop(0.15, '#e6d3a5'); g.addColorStop(0.85, '#efe0b6'); g.addColorStop(1, '#d9c393'); }
  c.fillStyle = g; c.fillRect(x, y, w, h); const r = mulberry32(Math.round(w) * 17 + (dir > 0 ? 3 : 1));
  for (let i = 0; i < w * h / 2200 + 4; i++) { const px = x + r() * w, py = y + r() * h, rad = 10 + r() * 50, gg = c.createRadialGradient(px, py, 0, px, py, rad), a = 0.03 + r() * 0.05; gg.addColorStop(0, `rgba(140,95,45,${a})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
  c.fillStyle = noise(c); c.globalAlpha = 0.4; c.fillRect(x, y, w, h); c.restore();
}
function divider(ctx, x1, x2, y) {
  if (!PIXEL_ART && uiArtReady()) { const cx = (x1 + x2) / 2, g = ctx.createLinearGradient(x1, 0, x2, 0); g.addColorStop(0, 'rgba(120,82,30,0)'); g.addColorStop(0.2, 'rgba(120,82,30,.75)'); g.addColorStop(0.8, 'rgba(120,82,30,.75)'); g.addColorStop(1, 'rgba(120,82,30,0)');
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(x1, y - 1, x2 - x1, 2); ctx.restore(); const dw = Math.min(150, (x2 - x1) * 0.5); drawUiPiece(ctx, 'divider', cx - dw / 2, y - dw / 10, dw, dw / 5); return; }
  y = Math.round(y / 2) * 2; ctx.fillStyle = 'rgba(90,55,20,.55)'; ctx.fillRect(Math.round(x1), y - 1, Math.round(x2 - x1), 2);
  pixDiamond(ctx, (x1 + x2) / 2, y, '#8a5a1e', 3);
}
// Kamienne tło z cegieł w pixel arcie; gotowy obraz danego rozmiaru z pamięci (uiLayer)
function stoneFill(c, x, y, w, h) { drawUi(c, uiLayer(`${PIXEL_ART ? 'stone' : 'wood'}_${w}x${h}`, w, h, PIXEL_ART ? paintStone : paintWood), x, y); }
function paintStone(c, w, h) { paintBricks(c, w, h); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
// Wnęka: wpuszczone pole w ramie (lista, opis, pasek zasobów): ciemniejsza skóra, wewnętrzny cień, cienka złota krawędź
function insetBox(c, x, y, w, h, seed = 5) {
  if (PIXEL_ART) { c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, x, y, w, h, 4); c.fill(); c.strokeStyle = '#8a6d32'; c.lineWidth = 1.2; c.stroke(); return; }
  leatherFill(c, x, y, w, h, seed, -0.35); c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 10; c.shadowOffsetY = 3; c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeRect(x - 3, y - 3, w + 6, h + 6); c.restore();
  c.lineWidth = 1; c.strokeStyle = 'rgba(214,174,88,.55)'; c.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1); c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
}
// Gniazdo (oddział, artefakt, umiejętność, wiersz listy): ciemna wnęka z fazą z brązu; st: '' | 'hover' | 'sel' | 'off'
function slotBox(c, x, y, w, h, st = '') {
  if (PIXEL_ART) { c.fillStyle = st === 'sel' ? 'rgba(210,160,60,.25)' : 'rgba(0,0,0,.25)'; rr(c, x, y, w, h, 3); c.fill(); c.strokeStyle = st === 'sel' ? '#e0b24a' : '#6a5a3a'; c.lineWidth = 1.2; c.stroke(); return; }
  c.save(); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, st === 'sel' ? '#3e2a12' : '#120c07'); g.addColorStop(1, st === 'sel' ? '#2a1c0c' : '#21170e'); c.fillStyle = g; c.fillRect(x, y, w, h);
  const ig = c.createLinearGradient(0, y, 0, y + Math.min(14, h / 2)); ig.addColorStop(0, 'rgba(0,0,0,.6)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = ig; c.fillRect(x, y, w, Math.min(14, h / 2)); // cień od górnej krawędzi
  c.lineWidth = 1; c.strokeStyle = 'rgba(255,220,150,.10)'; c.beginPath(); c.moveTo(x + 1, y + h - 0.5); c.lineTo(x + w - 1, y + h - 0.5); c.stroke(); // odblask dolnej krawędzi
  c.lineWidth = st === 'sel' ? 2 : 1.2; c.strokeStyle = st === 'sel' ? '#f0c860' : st === 'hover' ? '#c9a14a' : st === 'off' ? '#3e3226' : '#6e5228'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (st === 'sel') { c.shadowColor = 'rgba(255,200,90,.6)'; c.shadowBlur = 8; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
  c.restore();
}
function goldFrame(c, x, y, w, h) {
  if (!PIXEL_ART) { c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2); goldRim(c, x - 6, y - 6, w + 12, h + 12, 5); return; }
  c.fillStyle = '#000'; c.fillRect(x - 4, y - 4, w + 8, h + 8); c.strokeStyle = '#b8913f'; c.lineWidth = 2; c.strokeRect(x - 5, y - 5, w + 10, h + 10); }
// Tło przycisku w pixel arcie: dwa pasy koloru (jaśniejszy u góry), fazka, czarny obrys, złota ramka; stan: n, h (najechany), s (wybrany), d (wyłączony)
const BTN_COLS = { n: ['#62431f', '#46301a', '#2c1c0c', '#b8913f'], h: ['#7e5a2e', '#5a3e1e', '#3a2610', '#ffd970'], s: ['#a2442a', '#7a2c18', '#4c160a', '#ffd970'], d: ['#4e4a44', '#3a3733', '#2a2724', '#6d665c'] };
// Gładko: tabliczka w złotej listwie; środek: skóra (zwykły), cieplejszy i jaśniejszy (najechany), złocisty (wybrany),
// czerwona emalia (główna akcja: st 'p'), przygaszony bez złota (wyłączony)
const BTN_FILL = { n: ['#4a3220', '#2a1a0e'], h: ['#6a4828', '#3a2512'], s: ['#8a6224', '#4e3410'], p: ['#9a2e1e', '#561208'], ph: ['#b83a24', '#6a1a0c'], d: ['#2c241d', '#1c1712'] };
function paintButtonSmooth(c, w, h, st) {
  const [top, low] = BTN_FILL[st], dis = st === 'd', R = 3;
  c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, 1, 3, w, h, R); c.fill();
  c.save(); rr(c, 0, 0, w, h, R); c.clip();
  if (dis) { c.fillStyle = '#4a3f33'; c.fillRect(0, 0, w, h); } else { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffeab0'); g.addColorStop(0.15, '#d6ae58'); g.addColorStop(0.6, '#9a7430'); g.addColorStop(1, '#5a3c10'); c.fillStyle = g; c.fillRect(0, 0, w, h); } // złota listwa (fazka)
  const t = 3, g2 = c.createLinearGradient(0, t, 0, h - t); g2.addColorStop(0, top); g2.addColorStop(1, low); c.fillStyle = g2; rr(c, t, t, w - 2 * t, h - 2 * t, 2); c.fill();
  c.fillStyle = noise(c); c.globalAlpha = 0.35; c.fillRect(t, t, w - 2 * t, h - 2 * t); c.globalAlpha = 1;
  const hl = c.createLinearGradient(0, t, 0, t + (h - 2 * t) * 0.5); hl.addColorStop(0, `rgba(255,236,190,${dis ? 0.04 : st === 'n' ? 0.12 : 0.2})`); hl.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = hl; c.fillRect(t, t, w - 2 * t, (h - 2 * t) * 0.5); // światło na górze
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1; rr(c, t + 0.5, t + 0.5, w - 2 * t - 1, h - 2 * t - 1, 2); c.stroke();
  c.restore(); c.strokeStyle = '#0c0703'; c.lineWidth = 1.5; rr(c, 0.75, 0.75, w - 1.5, h - 1.5, R); c.stroke();
}
function paintButton(c, w, h, st) {
  if (!PIXEL_ART) return paintButtonSmooth(c, w, h, st);
  const [top, mid, low, rim] = BTN_COLS[st];
  c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, 2, 4, w, h, 4); c.fill();
  c.save(); rr(c, 0, 0, w, h, 4); c.clip();
  c.fillStyle = top; c.fillRect(0, 0, w, h); c.fillStyle = mid; c.fillRect(0, Math.round(h * 0.45 / 2) * 2, w, h); c.fillStyle = low; c.fillRect(0, h - 6, w, 6);
  c.fillStyle = 'rgba(255,226,160,.28)'; c.fillRect(4, 2, w - 8, 2);
  c.restore();
  c.lineWidth = 2; c.strokeStyle = '#120a03'; rr(c, 1, 1, w - 2, h - 2, 4); c.stroke();
  c.strokeStyle = rim; rr(c, 4, 4, w - 8, h - 8, 2); c.stroke();
}
class Button {
  constructor(x, y, w, h, label, action, o = {}) {
    Object.assign(this, { x, y, w, h, label, action, key: o.key || null, size: o.size || 18, disabled: !!o.disabled,
      selected: o.selected || null, sub: o.sub || null, swatch: o.swatch || null, icon: o.icon || null, lead: o.lead || null, tip: o.tip || null, primary: !!o.primary, display: !!o.display });
  }
  hit(px, py, pad = 0) { return px >= this.x - pad && px <= this.x + this.w + pad && py >= this.y - pad && py <= this.y + this.h + pad; }
  isSel() { return typeof this.selected === 'function' ? this.selected() : !!this.selected; }
  draw(ctx) {
    const hover = G.hover === this, pressed = hover && G.mouse.down, sel = this.isSel(), st = this.disabled ? 'd' : sel ? 's' : this.primary && !PIXEL_ART ? (hover ? 'ph' : 'p') : hover ? 'h' : 'n';
    const { x, w, h } = this, y = this.y + (pressed ? 2 : 0);
    if (this.display && !PIXEL_ART) { slotBox(ctx, x, this.y, w, h, hover ? 'hover' : ''); text(ctx, this.label, x + w / 2, this.y + h / 2 + 1, { size: 16, align: 'center', color: this.dispCol || UI.txt, fam: 'title' }); return; } // pole z wartością (np. mana), nie przycisk
    ctx.save();
    drawUi(ctx, uiLayer(`btn_${w}x${h}_${st}`, w + 4, h + 6, c => paintButton(c, w, h, st)), x, y);
    const col = PIXEL_ART ? (this.disabled ? '#8d857a' : (hover ? '#fff3c4' : '#ecd08a')) : this.disabled ? UI.txtOff : hover || sel ? '#fff4cc' : '#f0dca6';
    let cx = x + w / 2;
    if (this.swatch) {
      ctx.fillStyle = typeof this.swatch === 'function' ? this.swatch() : this.swatch; ctx.fillRect(x + 10, y + h / 2 - 8, 16, 16);
      ctx.lineWidth = 2; ctx.strokeStyle = '#e0b24a'; ctx.strokeRect(x + 10, y + h / 2 - 8, 16, 16); cx = x + (w + 26) / 2;
    }
    if (this.lead) { this.lead(ctx, x + 24, y + h / 2); cx = x + (w + 34) / 2; } // mała ikona przed napisem (np. umiejętność)
    const k3 = !PIXEL_ART && this.icon && (this.icon.k3 || ICON3.get(this.icon));
    if (k3 && uiArtReady()) { const S = Math.min(w, h) - 4; if (this.disabled) ctx.globalAlpha = 0.4; drawUiPiece(ctx, k3, cx - S / 2, y + h / 2 - S / 2, S, S); ctx.restore(); return; } // ikona z modelu 3D
    if (this.icon) { this.icon(ctx, cx + 2, y + h / 2 + 2, '#120a03'); this.icon(ctx, cx, y + h / 2, col); ctx.restore(); return; } // twardy cień zamiast poświaty
    let fs = this.size; const maxW = w - (this.swatch ? 40 : this.lead ? 48 : 14);
    ctx.font = font(fs, 700, 'title'); while (fs > 9 && ctx.measureText(this.label).width > maxW) { fs--; ctx.font = font(fs, 700, 'title'); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ly = this.sub ? y + h / 2 - 7 : y + h / 2 + 1;
    if (PIXEL_ART) { ctx.fillStyle = '#120a03'; ctx.fillText(this.label, cx + 2, ly + 2); } else { ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1; }
    ctx.fillStyle = col; ctx.fillText(this.label, cx, ly);
    if (this.sub) { ctx.font = font(PIXEL_ART ? 13 : 14, PIXEL_ART ? 500 : 600, 'body', true); ctx.fillStyle = this.disabled ? '#7a746a' : '#d8c08e'; ctx.fillText(this.sub, cx, y + h / 2 + 11); }
    ctx.restore();
  }
}
// Przycisk pod palcem albo kursorem. Dotyk: palec jest gruby, więc trafia też tuż obok przycisku (do 10 px), a z kilku
// pobliskich wygrywa ten, którego środek jest najbliżej.
const TOUCH_PAD = 16; // dotyk: przycisk łapie też stuknięcie obok (palec jest grubszy niż kursor), wygrywa najbliższy
function buttonAt(list, x, y) {
  const exact = list.find(b => !b.disabled && b.hit(x, y)); if (exact || !G.mouse.type || G.mouse.type === 'mouse') return exact || null;
  let best = null, bd = Infinity;
  for (const b of list) if (!b.disabled && b.hit(x, y, TOUCH_PAD)) { const d = Math.hypot(x - (b.x + b.w / 2), y - (b.y + b.h / 2)); if (d < bd) { bd = d; best = b; } }
  return best;
}
function clickButtons(list, x, y) {
  const b = buttonAt(list, x, y);
  if (b && b === G.downTarget) { Sfx.play('click', { vol: 0.5 }); if (b.action) b.action(); return true; }
  return false;
}
// opts: [{label, key, action, sub, tip, lead}]; extra: icon, iconH, locked (Esc nie zamyka), bw (szerokość przycisków)
function showDialog(msg, opts, extra = {}) {
  Sfx.play('page', { vol: 0.4, gap: 0.3 }); // szelest pergaminu
  setUnits('ui'); // okno w jednostkach interfejsu: wyśrodkowane w całym oknie, czytelne także na telefonie
  const n = opts.length, bh = opts.some(o => o.sub) ? 50 : 40, iconH = extra.icon ? (extra.iconH || 56) : 0;
  // przyciski w rzędzie, a gdy się nie mieszczą – w dwóch kolumnach (wąskie okno)
  let bw = extra.bw || 120, gap = 24, cols = n; const maxW = VW - 24;
  if (n * (bw + gap) + 36 > maxW) { gap = 12; bw = Math.min(bw, Math.floor((maxW - 36 - (n - 1) * gap) / n)); if (bw < 96) { cols = Math.ceil(n / 2); bw = Math.floor((maxW - 36 - (cols - 1) * gap) / cols); } }
  const rows = Math.ceil(n / cols), w = Math.min(maxW, Math.max(400, cols * (bw + gap) + 36));
  // tekst: od 20 w dół, aż okno zmieści się w wysokości ekranu
  let fs = 20, lh, lines; for (;;) { lh = Math.round(fs * 1.3); G.ctx.font = font(fs, 500, 'body'); lines = wrapText(G.ctx, msg, w - 70); if (fs <= 13 || 100 + rows * (bh + 10) + lines.length * lh + iconH <= VH - 16) break; fs--; }
  const h = Math.min(VH - 8, 100 + rows * (bh + 10) - 10 + lines.length * lh + iconH), x = (VW - w) / 2, y = (VH - h) / 2;
  const buttons = opts.map((o, i) => { const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols), total = inRow * bw + (inRow - 1) * gap;
    return new Button((VW - total) / 2 + c * (bw + gap), y + h - 24 - bh - (rows - 1 - r) * (bh + 10), bw, bh, o.label, () => { G.modal = null; restUnits(); if (o.action) o.action(); }, { key: o.key, sub: o.sub, tip: o.tip, lead: o.lead, selected: o.selected, primary: o.primary ?? (o.key === 'enter' && n > 1) }); });
  G.modal = {
    ui: true, msg, buttons, locked: !!extra.locked, hasIcon: !!extra.icon, // msg, hasIcon: treść okna i czy ma rysunek (podgląd w testach)
    draw(ctx) {
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, h);
      lines.forEach((l, i) => text(ctx, l, VW / 2, y + 44 + i * lh, { size: fs, weight: 500, align: 'center', color: '#2a1606' }));
      if (extra.icon) extra.icon(ctx, VW / 2, y + 34 + lines.length * lh + iconH / 2);
      buttons.forEach(b => b.draw(ctx));
    },
  };
  restUnits();
}
// Okno z polem tekstowym (np. imię gracza): prawdziwy <input> nad pergaminem, żeby działała klawiatura, także na telefonie.
// done(tekst) po OK/Enter; Anuluj/Esc zamyka bez zmian. Pole znika razem z oknem.
function askText(msg, initial, done, max = 16) {
  const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = max; inp.value = initial || '';
  Object.assign(inp.style, { position: 'fixed', zIndex: 10, boxSizing: 'border-box', textAlign: 'center', border: '2px solid #6a4a1e', borderRadius: '4px',
    background: '#f4e6c4', color: '#2a1606', fontFamily: pixelFont() ? FONT_PIXEL : 'Georgia, serif', outline: 'none', padding: '0 6px' });
  document.body.appendChild(inp);
  const close = () => inp.remove(), ok = () => { const v = inp.value.trim().slice(0, max); close(); done(v); };
  showDialog(msg, [{ label: 'OK', action: ok }, { label: 'Anuluj', action: close }], { iconH: 50, icon: (ctx, cx, cy) => {
    const r = G.canvas.getBoundingClientRect(), k = r.width / VW, w = 260 * k, h = 36 * k; // okno w jednostkach interfejsu (całe płótno)
    Object.assign(inp.style, { left: `${r.left + cx * k - w / 2}px`, top: `${r.top + cy * k - h / 2}px`, width: `${w}px`, height: `${h}px`, fontSize: `${Math.round(20 * k)}px` });
  } });
  const M = G.modal; M.input = inp;
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { G.modal = null; ok(); } else if (e.key === 'Escape') { G.modal = null; close(); } });
  const watch = () => { if (G.modal !== M) close(); else requestAnimationFrame(watch); }; requestAnimationFrame(watch);
  setTimeout(() => { inp.focus(); inp.select(); }, 0);
}
// Rysowanie w układzie całego okna (VW×VH), niezależnie od przesunięcia wyśrodkowanego ekranu
function viewportDraw(ctx, fn) { ctx.save(); ctx.setTransform(G.rs, 0, 0, G.rs, 0, 0); fn(ctx); ctx.restore(); }
// Przyciemnienie całego okna pod oknem dialogowym
function dimScreen(ctx, a) { viewportDraw(ctx, c => { c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, VW, VH); }); }
// Dymek z opisem; p.x, p.y w układzie okna (VW×VH)
function drawPopup(ctx, p) {
  if (p.cid) return drawUnitCard(ctx, p); // karta oddziału
  if (p.mapHero) return drawHeroCard(ctx, p); // okienka mapy: bohater i miasto
  if (p.mapTown) return drawTownCard(ctx, p);
  ctx.font = font(16, 500, 'body');
  const lines = wrapText(ctx, p.text, 250), tw = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = clamp(tw + 36, 140, 286), h = 26 + lines.length * 20;
  const x = clamp(p.x + 14, 8, VW - w - 8), y = clamp(p.y + 14, 8, VH - h - 8);
  if (PIXEL_ART) { drawParchment(ctx, x, y, w, h); lines.forEach((l, i) => text(ctx, l, x + w / 2, y + 21 + i * 20, { size: 16, weight: 500, align: 'center', color: '#2a1606' })); return; }
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x + 3, y + 5, w, h); leatherFill(ctx, x, y, w, h, 9, -0.1); goldRim(ctx, x, y, w, h, 2); ctx.restore(); // podpowiedź: ciemna skóra (okno to pergamin)
  lines.forEach((l, i) => text(ctx, l, x + w / 2, y + 22 + i * 20, { size: 17, weight: 600, align: 'center', color: UI.txt }));
}
// Karta oddziału pod prawym przyciskiem (okno albo ekran z metodą rightCard), inaczej zwykły dymek z rightInfoAt
function rightCardAt(x, y) { const o = G.modal || G.screen; return o && o.rightCard ? o.rightCard(x, y) : null; }
function rightPopup(p) { const card = rightCardAt(p.x, p.y); if (card) return Object.assign(card, { x: p.vx, y: p.vy }); const txt = rightInfoAt(p.x, p.y); return txt ? { text: txt, x: p.vx, y: p.vy } : null; }
function rightInfoAt(x, y) {
  const list = G.modal ? G.modal.buttons : (G.screen.buttons || []), b = list.find(b => b.hit(x, y));
  if (b && b.tip) return b.tip;
  if (G.modal) return G.modal.rightInfo ? G.modal.rightInfo(x, y) : null;
  return G.screen.rightInfo ? G.screen.rightInfo(x, y) : null;
}
// ikony przycisków panelu
function iconCrown(ctx, cx, cy, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(cx - 9, cy + 5); ctx.lineTo(cx - 10, cy - 6); ctx.lineTo(cx - 4, cy - 1); ctx.lineTo(cx, cy - 8);
  ctx.lineTo(cx + 4, cy - 1); ctx.lineTo(cx + 10, cy - 6); ctx.lineTo(cx + 9, cy + 5); ctx.closePath(); ctx.fill();
  ctx.fillRect(cx - 9, cy + 6, 18, 3);
}
function iconNext(ctx, cx, cy, col) {
  ctx.fillStyle = col;
  for (const dx of [-7, 0]) { ctx.beginPath(); ctx.moveTo(cx + dx, cy - 7); ctx.lineTo(cx + dx + 7, cy); ctx.lineTo(cx + dx, cy + 7); ctx.lineTo(cx + dx + 3, cy); ctx.closePath(); ctx.fill(); }
}
function iconBoot(ctx, cx, cy, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 9); ctx.lineTo(cx + 1, cy - 9); ctx.lineTo(cx + 2, cy + 1); ctx.lineTo(cx + 9, cy + 4); ctx.lineTo(cx + 9, cy + 9); ctx.lineTo(cx - 5, cy + 9); ctx.closePath(); ctx.fill();
}
function iconSleep(ctx, cx, cy, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + 1, cy, 9, Math.PI * 0.75, Math.PI * 1.9); ctx.arc(cx - 2, cy - 2, 8, Math.PI * 1.85, Math.PI * 0.8, true); ctx.closePath(); ctx.fill();
  ctx.font = font(10, 700, 'title'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', cx + 7, cy - 6);
}
function iconSpell(ctx, cx, cy, col) {
  ctx.fillStyle = col; rr(ctx, cx - 10, cy - 7, 9, 14, 1); ctx.fill(); rr(ctx, cx + 1, cy - 7, 9, 14, 1); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(cx - 1, cy - 8, 2, 16);
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ctx.lineTo(cx + Math.cos(a) * 5, cy - 11 + Math.sin(a) * 5); const b = a + TAU / 10; ctx.lineTo(cx + Math.cos(b) * 2, cy - 11 + Math.sin(b) * 2); }
  ctx.closePath(); ctx.fill();
}
const iconArrowSide = dir => Object.assign((ctx, cx, cy, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 4 * dir, cy - 8); ctx.lineTo(cx - 4 * dir, cy + 8); ctx.lineTo(cx + 5 * dir, cy); ctx.closePath(); ctx.fill(); }, { k3: dir > 0 ? 'ic_right' : 'ic_left' });
const iconArrow = dir => Object.assign((ctx, cx, cy, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 4 * dir); ctx.lineTo(cx + 8, cy - 4 * dir); ctx.lineTo(cx, cy + 5 * dir); ctx.closePath(); ctx.fill(); }, { k3: dir > 0 ? 'ic_down' : 'ic_up' });
function iconGear(ctx, cx, cy, col) {
  ctx.fillStyle = col;
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillRect(-2, -10, 4, 5); ctx.restore(); }
  ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
}
// Ikony przycisków z modeli 3D (arkusz interfejsu); funkcje wektorowe zostają jako zapas i w stylu pikselowym
const ICON3 = new Map([[iconCrown, 'ic_crown'], [iconNext, 'ic_next'], [iconBoot, 'ic_move'], [iconSleep, 'ic_sleep'], [iconSpell, 'ic_book'], [iconGear, 'ic_gear'], [iconStairs, 'ic_stairs'], [iconPuzzle, 'ic_puzzle'], [iconShovel, 'ic_dig']]);
// Tekst skrócony wielokropkiem do szerokości w (czcionka body o rozmiarze size)
function fitText(ctx, str, w, size, weight = 600) {
  ctx.font = font(size, weight, 'body'); if (ctx.measureText(str).width <= w) return str;
  let lo = 0, hi = str.length; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ctx.measureText(str.slice(0, m) + '…').width <= w) lo = m; else hi = m - 1; }
  return str.slice(0, lo).trimEnd() + '…';
}
// Koszt jako rząd ikon surowców z liczbami. have = zasoby gracza: brakujące liczby na czerwono.
function drawCost(ctx, cost, x, y, o = {}) {
  const size = o.size || 18, fs = o.font || 14, col = o.color || '#2a1606', entries = RESOURCES.filter(r => cost[r.id]); let cx = x;
  if (!entries.length) { text(ctx, 'za darmo', x, y, { size: fs, italic: true, weight: 500, color: o.free || '#3c7a2a' }); return; }
  for (const r of entries) {
    resIcon(ctx, r.id, cx + size / 2, y, size); ctx.font = font(fs, 700, 'body'); const s = String(cost[r.id]);
    text(ctx, s, cx + size + 1, y + 1, { size: fs, color: o.have && o.have[r.id] < cost[r.id] ? (o.missing || '#b02a1a') : col });
    cx += size + 5 + ctx.measureText(s).width;
  }
}
// Pasek surowców na dole ekranu mapy i miasta (dy: przesunięcie w dół, w: szerokość ekranu)
const RESBAR = { x: 18, y: 582, step: 78 };
function drawResourceBar(ctx, st, dy = 0, w = W) {
  const R = human(st).resources, y = RESBAR.y + dy;
  RESOURCES.forEach((r, i) => { const x = RESBAR.x + i * RESBAR.step; resIcon(ctx, r.id, x + 10, y, 24); text(ctx, String(R[r.id]), x + 25, y + 1, { size: 15, color: UI.txt, fam: PIXEL_ART ? 'body' : 'title' }); });
  text(ctx, dateText(st), w - 18, y + 1, { size: 16, weight: 600, align: 'right', color: UI.txt2 });
  drawSeasonIcon(ctx, seasonIdx(st), w - 30 - ctx.measureText(dateText(st)).width, y);
}
// Znaczek pory roku przy dacie: kwiat, słońce, liść, płatek śniegu
function drawSeasonIcon(ctx, s, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  if (s === 0) { for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circ(ctx, Math.cos(a) * 4, Math.sin(a) * 4, 3, '#f0a0c0'); } circ(ctx, 0, 0, 2.4, '#ffe070'); }
  else if (s === 1) { ctx.strokeStyle = '#ffc040'; ctx.lineWidth = 1.6; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5); ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.stroke(); } circ(ctx, 0, 0, 4.5, '#ffd040'); }
  else if (s === 2) { ctx.rotate(-0.6); ctx.fillStyle = '#d8702a'; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7a3a14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 9); ctx.stroke(); }
  else { ctx.strokeStyle = '#d8ecff'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.lineTo(-Math.cos(a) * 8, -Math.sin(a) * 8); ctx.stroke(); } }
  ctx.restore();
}
function resourceBarInfo(st, x, y, dy = 0) {
  if (y < 566 + dy) return null; const i = Math.floor((x - RESBAR.x) / RESBAR.step);
  if (i >= RESOURCES.length) { const S = seasonOf(st); return `${dateText(st)}. Pora roku: ${S.name.toLowerCase()} (${S.text}). Pora zmienia się co miesiąc.`; }
  if (i < 0) return null;
  const r = RESOURCES[i]; return `${r.name}: ${human(st).resources[r.id]}. Dochód dzienny: ${dailyIncome(st, r.id)}.`;
}

