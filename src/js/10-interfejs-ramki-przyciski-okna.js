// ==================== INTERFEJS: RAMKI, PRZYCISKI, OKNA =================================
// Kamień, pergamin, przyciski, okna dialogowe, dymki, ikony przycisków.
// --- pixel art interfejsu ---
// Pergamin, kamień i tła przycisków malujemy w buforze o połowie rozdzielczości (1 piksel grafiki = 2 px ekranu), z paletą
// i ditheringiem (crispLayer: twarde krawędzie, 3 stopnie krycia), i powiększamy bez wygładzania — tak jak mapę, sceny i jednostki.
const UI_PX = 2;
function uiLayer(key, w, h, paint) {
  return Layers.get('ui_' + key, w, h, c => { c.imageSmoothingEnabled = false; paint(c, w, h); c.canvas._ctx = c; crispLayer(c.canvas, 12); }, 1 / UI_PX);
}
function drawUi(ctx, c, x, y) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, Math.round(x), Math.round(y), c.width * UI_PX, c.height * UI_PX); ctx.restore(); }
// Romb z pikseli (ozdoba rogów i przerywników): rzędy po 2 px
function pixDiamond(ctx, cx, cy, col, n = 3) {
  cx = Math.round(cx / 2) * 2; cy = Math.round(cy / 2) * 2; ctx.fillStyle = col;
  for (let i = -n + 1; i < n; i++) { const hw = (n - Math.abs(i)) * 2; ctx.fillRect(cx - hw, cy + i * 2 - 1, hw * 2, 2); }
}
function drawCorners(ctx, x, y, w, h) {
  for (const [cx, cy] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) { pixDiamond(ctx, cx, cy, '#6a4a14', 4); pixDiamond(ctx, cx, cy - 1, '#e0b44c', 3); pixDiamond(ctx, cx - 1, cy - 2, '#fff0b0', 1); }
}
// Cegły kamiennego tła: każda w nieco innym odcieniu, jaśniejsza krawędź u góry, cień u dołu, fuga 2 px
function paintBricks(c, w, h, seed = 1) {
  const r = mulberry32(seed * 7919 + Math.round(w) * 31 + Math.round(h)); c.fillStyle = '#28231e'; c.fillRect(0, 0, w, h);
  for (let yy = 0, row = 0; yy < h; yy += 20, row++) for (let xx = row % 2 ? -22 : 0; xx < w; xx += 44) {
    const t = r(), k = yy / Math.max(1, h), v = Math.round(74 + t * 10 - k * 26);
    c.fillStyle = `rgb(${v + 6},${v},${v - 8})`; c.fillRect(xx + 2, yy + 2, 42, 18);
    c.fillStyle = 'rgba(255,238,200,.08)'; c.fillRect(xx + 2, yy + 2, 42, 2); c.fillRect(xx + 2, yy + 2, 2, 18);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(xx + 2, yy + 18, 42, 2); c.fillRect(xx + 42, yy + 2, 2, 18);
    for (let k2 = 0; k2 < 3; k2++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.22)' : 'rgba(255,240,210,.08)'; c.fillRect(xx + 6 + Math.floor(r() * 16) * 2, yy + 6 + Math.floor(r() * 5) * 2, 2 + (r() < 0.3 ? 2 : 0), 2); }
  }
}
function drawStone(ctx, x, y, w, h) {
  drawUi(ctx, uiLayer(`stonebox_${w}x${h}`, w + 8, h + 10, c => {
    c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, 4, 6, w, h, 6); c.fill();
    c.save(); rr(c, 0, 0, w, h, 6); c.clip(); paintBricks(c, w, h, 3); c.restore();
    c.lineWidth = 4; c.strokeStyle = '#15110d'; rr(c, 0, 0, w, h, 6); c.stroke();
    c.lineWidth = 2; c.strokeStyle = '#b8913f'; rr(c, 6, 6, w - 12, h - 12, 4); c.stroke();
  }), x, y);
  drawCorners(ctx, x, y, w, h);
}
// Pergamin (tło okien i paneli): pixel art z pamięci (uiLayer): jasny środek, przypalone brzegi w ditheringu, włókna papieru
function drawParchment(ctx, x, y, w, h) { drawUi(ctx, uiLayer(`parch_${w}x${h}`, w + 16, h + 16, c => paintParchment(c, 4, 4, w, h)), x - 4, y - 4); drawCorners(ctx, x, y, w, h); }
function paintParchment(ctx, x, y, w, h) {
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
function divider(ctx, x1, x2, y) {
  y = Math.round(y / 2) * 2; ctx.fillStyle = 'rgba(90,55,20,.55)'; ctx.fillRect(Math.round(x1), y - 1, Math.round(x2 - x1), 2);
  pixDiamond(ctx, (x1 + x2) / 2, y, '#8a5a1e', 3);
}
// Kamienne tło z cegieł w pixel arcie; gotowy obraz danego rozmiaru z pamięci (uiLayer)
function stoneFill(c, x, y, w, h) { drawUi(c, uiLayer(`stone_${w}x${h}`, w, h, paintStone), x, y); }
function paintStone(c, w, h) { paintBricks(c, w, h); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function goldFrame(c, x, y, w, h) { c.fillStyle = '#000'; c.fillRect(x - 4, y - 4, w + 8, h + 8); c.strokeStyle = '#b8913f'; c.lineWidth = 2; c.strokeRect(x - 5, y - 5, w + 10, h + 10); }
// Tło przycisku w pixel arcie: dwa pasy koloru (jaśniejszy u góry), fazka, czarny obrys, złota ramka; stan: n, h (najechany), s (wybrany), d (wyłączony)
const BTN_COLS = { n: ['#62431f', '#46301a', '#2c1c0c', '#b8913f'], h: ['#7e5a2e', '#5a3e1e', '#3a2610', '#ffd970'], s: ['#a2442a', '#7a2c18', '#4c160a', '#ffd970'], d: ['#4e4a44', '#3a3733', '#2a2724', '#6d665c'] };
function paintButton(c, w, h, st) {
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
      selected: o.selected || null, sub: o.sub || null, swatch: o.swatch || null, icon: o.icon || null, tip: o.tip || null });
  }
  hit(px, py) { return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h; }
  isSel() { return typeof this.selected === 'function' ? this.selected() : !!this.selected; }
  draw(ctx) {
    const hover = G.hover === this, pressed = hover && G.mouse.down, sel = this.isSel(), st = this.disabled ? 'd' : sel ? 's' : hover ? 'h' : 'n';
    const { x, w, h } = this, y = this.y + (pressed ? 2 : 0);
    ctx.save();
    drawUi(ctx, uiLayer(`btn_${w}x${h}_${st}`, w + 4, h + 6, c => paintButton(c, w, h, st)), x, y);
    const col = this.disabled ? '#8d857a' : (hover ? '#fff3c4' : '#ecd08a');
    let cx = x + w / 2;
    if (this.swatch) {
      ctx.fillStyle = typeof this.swatch === 'function' ? this.swatch() : this.swatch; ctx.fillRect(x + 10, y + h / 2 - 8, 16, 16);
      ctx.lineWidth = 2; ctx.strokeStyle = '#e0b24a'; ctx.strokeRect(x + 10, y + h / 2 - 8, 16, 16); cx = x + (w + 26) / 2;
    }
    if (this.icon) { this.icon(ctx, cx + 2, y + h / 2 + 2, '#120a03'); this.icon(ctx, cx, y + h / 2, col); ctx.restore(); return; } // twardy cień zamiast poświaty
    let fs = this.size; const maxW = w - (this.swatch ? 40 : 14);
    ctx.font = font(fs, 700, 'title'); while (fs > 9 && ctx.measureText(this.label).width > maxW) { fs--; ctx.font = font(fs, 700, 'title'); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ly = this.sub ? y + h / 2 - 7 : y + h / 2 + 1;
    ctx.fillStyle = '#120a03'; ctx.fillText(this.label, cx + 2, ly + 2); ctx.fillStyle = col; ctx.fillText(this.label, cx, ly);
    if (this.sub) { ctx.font = font(13, 500, 'body', true); ctx.fillStyle = this.disabled ? '#7a746a' : '#d4bd90'; ctx.fillText(this.sub, cx, y + h / 2 + 11); }
    ctx.restore();
  }
}
function clickButtons(list, x, y) {
  const b = list.find(b => !b.disabled && b.hit(x, y));
  if (b && b === G.downTarget) { if (b.action) b.action(); return true; }
  return false;
}
// opts: [{label, key, action, sub, tip}]; extra: icon, iconH, locked (Esc nie zamyka), bw (szerokość przycisków)
function showDialog(msg, opts, extra = {}) {
  const bw = extra.bw || 120, gap = 24, bh = opts.some(o => o.sub) ? 50 : 40;
  const w = Math.max(400, opts.length * (bw + gap) + 36); G.ctx.font = font(20, 500, 'body'); const lines = wrapText(G.ctx, msg, w - 70);
  const iconH = extra.icon ? (extra.iconH || 56) : 0, h = 120 + bh + lines.length * 26 + iconH, x = (W - w) / 2, y = (H - h) / 2;
  const total = opts.length * bw + (opts.length - 1) * gap; let bx = (W - total) / 2;
  const buttons = opts.map(o => { const b = new Button(bx, y + h - 24 - bh, bw, bh, o.label, () => { G.modal = null; if (o.action) o.action(); }, { key: o.key, sub: o.sub, tip: o.tip }); bx += bw + gap; return b; });
  G.modal = {
    msg, buttons, locked: !!extra.locked, hasIcon: !!extra.icon, // msg, hasIcon: treść okna i czy ma rysunek (podgląd w testach)
    draw(ctx) {
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, h);
      lines.forEach((l, i) => text(ctx, l, W / 2, y + 44 + i * 26, { size: 20, weight: 500, align: 'center', color: '#2a1606' }));
      if (extra.icon) extra.icon(ctx, W / 2, y + 34 + lines.length * 26 + iconH / 2);
      buttons.forEach(b => b.draw(ctx));
    },
  };
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
    const r = G.canvas.getBoundingClientRect(), k = r.width / VW, w = 260 * k, h = 36 * k;
    Object.assign(inp.style, { left: `${r.left + (OX + cx) * k - w / 2}px`, top: `${r.top + (OY + cy) * k - h / 2}px`, width: `${w}px`, height: `${h}px`, fontSize: `${Math.round(20 * k)}px` });
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
  ctx.font = font(16, 500, 'body');
  const lines = wrapText(ctx, p.text, 250), tw = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = clamp(tw + 36, 140, 286), h = 26 + lines.length * 20;
  const x = clamp(p.x + 14, 8, VW - w - 8), y = clamp(p.y + 14, 8, VH - h - 8);
  drawParchment(ctx, x, y, w, h);
  lines.forEach((l, i) => text(ctx, l, x + w / 2, y + 21 + i * 20, { size: 16, weight: 500, align: 'center', color: '#2a1606' }));
}
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
const iconArrowSide = dir => (ctx, cx, cy, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 4 * dir, cy - 8); ctx.lineTo(cx - 4 * dir, cy + 8); ctx.lineTo(cx + 5 * dir, cy); ctx.closePath(); ctx.fill(); };
const iconArrow = dir => (ctx, cx, cy, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 4 * dir); ctx.lineTo(cx + 8, cy - 4 * dir); ctx.lineTo(cx, cy + 5 * dir); ctx.closePath(); ctx.fill(); };
function iconGear(ctx, cx, cy, col) {
  ctx.fillStyle = col;
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillRect(-2, -10, 4, 5); ctx.restore(); }
  ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
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
  RESOURCES.forEach((r, i) => { const x = RESBAR.x + i * RESBAR.step; resIcon(ctx, r.id, x + 10, y, 24); text(ctx, String(R[r.id]), x + 25, y + 1, { size: 16, color: '#ecd9a8' }); });
  text(ctx, dateText(st), w - 18, y + 1, { size: 15, weight: 500, align: 'right', color: '#ecd9a8' });
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

