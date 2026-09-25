// ==================== EKRANY: MENU, NOWA GRA, LISTY =====================================
// Scena tytułowa i ekrany poza rozgrywką.
const CASTLE_WINDOWS = [
  [256, 205, 8, 14], [256, 236, 8, 12], [224, 285, 7, 11], [289, 285, 7, 11], [256, 302, 8, 12],
  [196, 255, 7, 11], [196, 300, 7, 11], [316, 255, 7, 11], [316, 300, 7, 11],
  [144, 352, 7, 10], [369, 352, 7, 10], [182, 364, 6, 9], [334, 364, 6, 9],
].map((w, i) => [...w, i * 1.7]);
const CLOUDS = (() => { const r = mulberry32(5); return Array.from({ length: 7 }, () => ({ x: r() * 1100, y: 30 + r() * 160, s: 0.6 + r() * 1.1, v: 5 + r() * 9, a: 0.1 + r() * 0.12 })); })();
const EMBERS = (() => { const r = mulberry32(9); return Array.from({ length: 28 }, () => ({ x: r() * 500, y: 430 + r() * 170, v: 8 + r() * 14, p: r() * TAU, r: 1 + r() * 1.6 })); })();
function ridge(c, seed, base, amp, col) {
  const r = mulberry32(seed); const p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W + 6; x += 6) { // o krok za brzeg, żeby przy prawej krawędzi nie prześwitywało niebo
    const n = Math.sin(x * 0.009 + p1) * 0.5 + Math.sin(x * 0.023 + p2) * 0.3 + Math.sin(x * 0.061 + p3) * 0.15 + (r() - 0.5) * 0.08;
    c.lineTo(x, base - amp * (0.55 + n * 0.6));
  }
  c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill();
}
function paintSky(c) {
  const g = c.createLinearGradient(0, 0, 0, 440);
  g.addColorStop(0, '#0a0c26'); g.addColorStop(0.35, '#221a4a'); g.addColorStop(0.62, '#6a2f52'); g.addColorStop(0.82, '#c7603f'); g.addColorStop(1, '#f0a050');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = mulberry32(11);
  for (let i = 0; i < 150; i++) { const x = r() * W, y = r() * 260, a = (1 - y / 260) * (0.4 + r() * 0.6), s = r() < 0.1 ? 1.8 : 1; c.fillStyle = `rgba(255,248,230,${a.toFixed(3)})`; c.fillRect(x, y, s, s); }
  const mg = c.createRadialGradient(470, 170, 10, 470, 170, 120); mg.addColorStop(0, 'rgba(255,240,210,.35)'); mg.addColorStop(1, 'rgba(255,240,210,0)');
  c.fillStyle = mg; c.fillRect(340, 40, 260, 260);
  c.fillStyle = '#f6ecd0'; c.beginPath(); c.arc(470, 170, 24, 0, TAU); c.fill();
  c.fillStyle = 'rgba(190,170,140,.35)'; for (const [x, y, rad] of [[462, 164, 5], [478, 180, 4], [476, 160, 3]]) { c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); }
  const sg = c.createRadialGradient(300, 420, 10, 300, 420, 320); sg.addColorStop(0, 'rgba(255,190,110,.5)'); sg.addColorStop(1, 'rgba(255,190,110,0)');
  c.fillStyle = sg; c.fillRect(0, 0, W, H);
  ridge(c, 31, 405, 150, '#4b3358');
  const hz = c.createLinearGradient(0, 330, 0, 430); hz.addColorStop(0, 'rgba(240,140,100,0)'); hz.addColorStop(1, 'rgba(240,140,100,.28)');
  c.fillStyle = hz; c.fillRect(0, 330, W, 100);
  ridge(c, 47, 425, 95, '#2c2140');
}
function pine(c, x, base, h, col) {
  c.fillStyle = col; c.fillRect(x - 1.5, base - h * 0.15, 3, h * 0.15);
  for (let i = 0; i < 4; i++) {
    const ty = base - h * 0.12 - i * h * 0.2, tw = h * 0.3 * (1 - i * 0.18);
    c.beginPath(); c.moveTo(x - tw, ty); c.lineTo(x, ty - h * 0.36); c.lineTo(x + tw, ty); c.closePath(); c.fill();
  }
}
function paintCastle(c) {
  const body = '#1a1729', roofCol = '#2a1b30';
  const cren = (x, y, w, n) => { const mw = w / (n * 2 - 1); for (let i = 0; i < n; i++) c.fillRect(x + i * 2 * mw, y - 7, mw, 7); };
  const tower = (x, y, w, h, roofH) => {
    c.fillStyle = body; c.fillRect(x, y, w, h);
    if (roofH) { c.fillStyle = roofCol; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + w / 2, y - roofH); c.lineTo(x + w + 4, y); c.closePath(); c.fill(); }
    else { c.fillStyle = body; cren(x - 2, y, w + 4, Math.max(2, Math.round(w / 10))); }
  };
  tower(205, 265, 110, 95, 0);
  tower(185, 235, 30, 125, 50); tower(305, 235, 30, 125, 50);
  tower(240, 190, 40, 80, 70);
  c.fillStyle = body; c.fillRect(150, 345, 220, 52); cren(150, 345, 220, 11);
  tower(135, 325, 26, 72, 0); tower(360, 325, 26, 72, 0);
  c.fillStyle = '#07060c'; c.beginPath(); c.moveTo(245, 397); c.lineTo(245, 374); c.arc(260, 374, 15, Math.PI, 0); c.lineTo(275, 397); c.closePath(); c.fill();
  c.fillStyle = '#0a0810'; for (const [x, y, w, h] of CASTLE_WINDOWS) c.fillRect(x, y, w, h);
}
function paintLand(c) {
  c.fillStyle = '#17122a'; c.beginPath(); c.moveTo(-10, H); c.lineTo(-10, 455);
  c.bezierCurveTo(70, 410, 150, 396, 260, 396); c.bezierCurveTo(370, 396, 450, 420, 560, 470); c.lineTo(560, H); c.closePath(); c.fill();
  // skalny kopiec pod zamkiem: wzgórze opada na boki, a mury muszą na czymś stać
  c.beginPath(); c.moveTo(80, 470); c.bezierCurveTo(100, 425, 118, 400, 132, 394); c.lineTo(390, 394);
  c.bezierCurveTo(408, 402, 428, 425, 460, 470); c.closePath(); c.fill();
  const rk = mulberry32(33); c.fillStyle = '#211a36';
  for (let i = 0; i < 18; i++) { const x = 118 + rk() * 285, y = 400 + rk() * 26; c.beginPath(); c.ellipse(x, y, 6 + rk() * 9, 2 + rk() * 3, 0, 0, TAU); c.fill(); }
  paintCastle(c);
  c.fillStyle = 'rgba(140,100,80,.22)'; c.beginPath(); c.moveTo(250, 397); c.lineTo(270, 397);
  c.bezierCurveTo(300, 440, 330, 470, 360, 525); c.lineTo(305, 525); c.bezierCurveTo(290, 470, 265, 430, 250, 397); c.fill();
  const r = mulberry32(21);
  for (let i = 0; i < 9; i++) { const x = 10 + r() * 110; pine(c, x, 460 - (x / 130) * 45 + 10, 30 + r() * 25, '#100c1c'); }
  for (let i = 0; i < 8; i++) { const x = 410 + r() * 110; pine(c, x, 410 + ((x - 400) / 120) * 50 + 10, 30 + r() * 25, '#100c1c'); }
  c.fillStyle = '#0d0a15'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, 505);
  c.bezierCurveTo(150, 470, 330, 500, 480, 520); c.bezierCurveTo(600, 535, 700, 515, 800, 520); c.lineTo(800, H); c.closePath(); c.fill();
  for (let i = 0; i < 16; i++) { const x = r() * 520; if (x > 290 && x < 370) continue; pine(c, x, 540 + r() * 50, 50 + r() * 60, '#07050c'); }
  pine(c, 28, 610, 230, '#050409'); pine(c, 90, 620, 170, '#050409');
}
function drawCloud(ctx, x, y, s, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#7a5680';
  for (const [px, py, rx, ry] of [[0, 0, 46, 14], [34, -9, 36, 16], [70, 0, 44, 13], [30, 7, 60, 10]]) { ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#e0906a'; ctx.beginPath(); ctx.ellipse(34, 10, 62, 4, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
// Jeździec zjeżdżający drogą od bramy zamku (ten sam sprite co bohater na mapie); pętla co MENU_RIDE s
const MENU_RIDE = 16, MENU_ROAD = [[260, 400], [288, 440], [312, 470], [334, 530]];
function menuRider(b, t) {
  const u = (t % MENU_RIDE) / MENU_RIDE, v = 1 - u, [p0, p1, p2, p3] = MENU_ROAD;
  const x = v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0];
  const y = v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1];
  const s = heroSprite({ cls: 'knight', dir: 1, anim: {} }, colorHex(G.settings.color)), k = 0.45 + 0.75 * u;
  b.save(); b.globalAlpha = clamp(u * 8, 0, 1) * clamp((1 - u) * 6, 0, 1);
  b.drawImage(s.c, x - s.ax * 2 * k, y - s.ay * 2 * k, s.c.width * 2 * k, s.c.height * 2 * k); b.restore();
}
// Scena menu w stylu gry: rysunek w buforze o połowie rozdzielczości, paleta z ditheringiem (pixelQuantize)
// i powiększenie bez wygładzania, tak jak mapa przygody i sceny miast.
function drawMenuScene(ctx) {
  const t = G.time, pb = pixBuf('menuScene', W / 2, H / 2, true), b = pb._ctx;
  b.setTransform(0.5, 0, 0, 0.5, 0, 0); b.imageSmoothingEnabled = false;
  b.drawImage(Layers.get('menuSky', W, H, paintSky, 0.5), 0, 0, W, H);
  for (const c of CLOUDS) drawCloud(b, ((c.x + t * c.v) % 1100) - 150, c.y, c.s, c.a);
  b.drawImage(Layers.get('menuLand', W, H, paintLand, 0.5), 0, 0, W, H);
  for (const [x, y, w, h, p] of CASTLE_WINDOWS) {
    const f = clamp(0.55 + 0.35 * Math.sin(t * 2.3 + p) + 0.1 * Math.sin(t * 7.1 + p * 3), 0.15, 1);
    b.fillStyle = `rgba(255,170,70,${(f * 0.18).toFixed(3)})`; b.fillRect(x - 2, y - 2, w + 4, h + 4);
    b.fillStyle = `rgba(255,200,100,${f.toFixed(3)})`; b.fillRect(x, y, w, h);
  }
  const col = colorHex(G.settings.color);
  drawFlag(b, 260, 96, 26, 12, t, col); drawFlag(b, 200, 168, 14, 7, t + 1, col); drawFlag(b, 320, 168, 14, 7, t + 2, col);
  menuRider(b, t);
  for (let i = 0; i < 4; i++) {
    const x = ((i * 320 + t * 9) % 1280) - 240; b.save(); b.translate(x, 448 + (i % 2) * 18); b.scale(3.2, 0.45);
    const g = b.createRadialGradient(0, 0, 0, 0, 0, 100); g.addColorStop(0, 'rgba(210,170,200,.14)'); g.addColorStop(1, 'rgba(210,170,200,0)');
    b.fillStyle = g; b.fillRect(-100, -100, 200, 200); b.restore();
  }
  for (const e of EMBERS) {
    const y = 430 + (((e.y - 430 - t * e.v) % 170) + 170) % 170, x = e.x + Math.sin(t * 0.9 + e.p) * 10, a = 0.45 + 0.35 * Math.sin(t * 3 + e.p);
    b.fillStyle = `rgba(255,214,130,${a.toFixed(3)})`; b.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2);
  }
  pixelQuantize(pb, 14);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(pb, 0, 0, W, H); ctx.restore();
}
function dimmedMenuScene(ctx, a) { drawMenuScene(ctx); ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, W, H); }
function askQuit() {
  showDialog('Czy na pewno chcesz opuścić grę?', [{ label: 'Tak', key: 'enter', action: () => G.go('bye') }, { label: 'Nie', key: 'escape' }]);
}
function askToMenu() {
  showDialog('Wrócić do menu głównego? Niezapisane postępy zostaną utracone.', [
    { label: 'Tak', key: 'enter', action: () => G.go('menu') }, { label: 'Nie', key: 'escape' }]);
}
G.screens.menu = {
  buttons: [], mode: 'main',
  enter(p) { G.state = null; this.setMode(p.mode || 'main'); },
  setMode(m) {
    this.mode = m; let y = 196;
    const B = (label, act, o = {}) => { const b = new Button(540, y, 220, 48, label, act, Object.assign({ size: 17 }, o)); y += 64; return b; };
    this.buttons = [
      B('Nowa gra', () => G.go('setup'), { key: 'n' }),
      B('Wczytaj grę', () => G.go('load', { mode: 'load' }), { key: 'l' }),
      B('Najlepsze wyniki', () => G.go('scores'), { key: 'h' }),
      B('Twórcy', () => G.go('credits'), { key: 'c' }),
      B('Wyjście', () => askQuit(), { key: 'q' }),
    ];

  },
  onBack() { askQuit(); },
  draw(ctx) {
    drawMenuScene(ctx);
    drawStone(ctx, 520, 172, 260, 354);
    this.buttons.forEach(b => b.draw(ctx));
    goldText(ctx, 'KRONIKI KRÓLESTW', W / 2, 62, 44);
    text(ctx, 'Czas bohaterów', W / 2, 104, { size: 22, weight: 500, italic: true, align: 'center', color: '#f3dca0' });
    text(ctx, `Kroniki Królestw · wersja ${VERSION}`, 12, H - 14, { size: 14, weight: 500, color: 'rgba(255,235,190,.55)' });
  },
};
G.screens.setup = {
  buttons: [],
  enter() {
    const S = G.settings, B = [];
    MAP_SIZES.forEach((m, i) => B.push(new Button(230 + i * 128, 118, 118, 44, m.name, () => { S.mapSize = m.id; }, { selected: () => S.mapSize === m.id, size: 16, sub: `${m.n}×${m.n}` })));
    DIFFICULTIES.forEach((d, i) => B.push(new Button(230 + i * 102, 180, 96, 44, d.name, () => { S.difficulty = i; }, { selected: () => S.difficulty === i, size: 14, sub: `ocena ${d.rating}%` })));
    PLAYER_COLORS.forEach((c, i) => B.push(new Button(230 + i * 128, 276, 118, 40, c.name, () => { S.color = c.id; }, { selected: () => S.color === c.id, size: 13, swatch: c.hex })));
    FACTIONS.forEach((f, i) => B.push(new Button(230 + i * 164, 330, 154, 40, f.name, () => { S.faction = f.id; }, { selected: () => S.faction === f.id, size: 16 })));
    BONUSES.forEach((b, i) => B.push(new Button(230 + i * 106, 440, 100, 44, b.name, () => { S.bonus = b.id; }, { selected: () => S.bonus === b.id, size: 15, sub: b.sub })));
    [1, 2, 3].forEach((k, i) => B.push(new Button(628 + i * 38, 440, 34, 44, String(k), () => { S.opponents = k; }, { selected: () => (S.opponents || 1) === k, size: 17,
      tip: 'Liczba przeciwników komputerowych. Na małej mapie zmieszczą się najwyżej dwaj.' })));
    B.push(new Button(150, 506, 200, 46, 'Rozpocznij', () => startNewGame(), { key: 'enter', size: 19 }));
    B.push(new Button(450, 506, 200, 46, 'Wróć', () => G.go('menu'), { key: 'escape', size: 19 }));
    this.buttons = B;
  },
  draw(ctx) {
    dimmedMenuScene(ctx, 0.5);
    drawParchment(ctx, 40, 22, 720, 556);
    text(ctx, 'Nowa gra', W / 2, 58, { size: 30, align: 'center', color: '#3a1e08', fam: 'title' });
    text(ctx, 'Pojedynczy scenariusz na losowej mapie', W / 2, 88, { size: 18, align: 'center', color: '#5a3814', italic: true, weight: 500 });
    divider(ctx, 80, 720, 104);
    const L = (s, y, x = 80) => text(ctx, s, x, y, { size: 17, color: '#3a1e08', fam: 'title' });
    L('Mapa', 140); L('Trudność', 202); L('Zasoby', 248); L('Kolor', 296); L('Frakcja', 350); L('Bonus', 462); L('Rywale', 462, 562);
    const d = DIFFICULTIES[G.settings.difficulty];
    RESOURCES.forEach((r, i) => { const x = 230 + i * 72; resIcon(ctx, r.id, x + 10, 248, 24); text(ctx, String(d.res[r.id]), x + 25, 249, { size: 16 }); });
    const f = FACTIONS.find(f => f.id === G.settings.faction) || FACTIONS[0];
    ctx.font = font(16, 500, 'body');
    wrapText(ctx, f.desc, 490).slice(0, 2).forEach((l, i) => text(ctx, l, 230, 388 + i * 19, { size: 16, weight: 500, italic: true, color: '#4a2c0e' }));
    this.buttons.forEach(b => b.draw(ctx));
  },
};
function makeListScreen(title, drawBody) {
  return {
    buttons: [],
    enter() { this.buttons = [new Button(300, 478, 200, 46, 'Wróć', () => G.go('menu'), { key: 'escape', size: 19 })]; },
    draw(ctx) {
      dimmedMenuScene(ctx, 0.5); drawParchment(ctx, 150, 50, 500, 500);
      text(ctx, title, W / 2, 95, { size: 28, align: 'center', color: '#3a1e08', fam: 'title' }); divider(ctx, 200, 600, 116);
      drawBody(ctx); this.buttons.forEach(b => b.draw(ctx));
    },
  };
}
// Lista slotów zapisu. mode 'load' (z menu albo z gry) lub 'save' (z gry).
G.screens.load = {
  buttons: [], mode: 'load', slots: null, err: null, busy: false, token: 0, hover: -1,
  ROW: { x: 180, y: 132, w: 440, h: 44, gap: 50 },
  enter(p) {
    this.mode = p.mode || 'load'; this.fromGame = !!p.fromGame; this.slots = null; this.err = null; this.busy = false; this.hover = -1;
    this.buttons = [new Button(300, 478, 200, 46, 'Wróć', () => this.back(), { key: 'escape', size: 19 })];
    const tok = ++this.token;
    SaveStore.list().then(s => { if (tok === this.token) this.slots = s; }, e => { if (tok === this.token) { this.slots = {}; this.err = 'Nie udało się odczytać listy zapisów.'; } });
  },
  back() { G.go(this.fromGame ? 'adventure' : 'menu'); },
  onBack() { this.back(); },
  rowAt(x, y) { const R = this.ROW; for (let i = 0; i < SAVE_SLOTS.length; i++) { const ry = R.y + i * R.gap; if (x >= R.x && x <= R.x + R.w && y >= ry && y <= ry + R.h) return i; } return -1; },
  onPointerMove(x, y) { this.hover = this.rowAt(x, y); },
  onClick(x, y) {
    if (clickButtons(this.buttons, x, y)) return;
    const i = this.rowAt(x, y); if (i < 0 || !this.slots || this.busy) return;
    const slot = SAVE_SLOTS[i], meta = this.slots[slot];
    if (this.mode === 'load') { if (meta) this.doLoad(slot); return; }
    if (slot === 'auto') return;
    if (meta) showDialog(`Nadpisać ${slotName(slot).toLowerCase()}? (${meta.hero}, ${meta.date})`, [{ label: 'Nadpisz', key: 'enter', action: () => this.doSave(slot) }, { label: 'Nie', key: 'escape' }]);
    else this.doSave(slot);
  },
  doSave(slot) {
    this.busy = true; this.err = null;
    SaveStore.write(slot, G.state).then(() => { this.busy = false; G.go('adventure', { flash: `Zapisano grę (${slotName(slot).toLowerCase()})` }); },
      () => { this.busy = false; this.err = 'Zapis się nie udał. Spróbuj ponownie za chwilę.'; });
  },
  doLoad(slot) {
    this.busy = true; this.err = null;
    loadGameFrom(slot).then(st => { this.busy = false; G.state = st; G.go('adventure', { flash: `Wczytano grę: ${slotName(slot).toLowerCase()}` }); },
      e => { this.busy = false; this.err = `Nie można wczytać: ${e && e.message ? e.message : 'nieznany błąd'}.`; });
  },
  rightInfo(x, y) {
    const i = this.rowAt(x, y); if (i < 0) return null;
    return SAVE_SLOTS[i] === 'auto' ? 'Autozapis powstaje na początku każdego dnia. Można go wczytać, ale nie nadpisać ręcznie.' : 'Slot na ręczny zapis gry.';
  },
  draw(ctx) {
    dimmedMenuScene(ctx, 0.5); drawParchment(ctx, 150, 50, 500, 500);
    text(ctx, this.mode === 'save' ? 'Zapisz grę' : 'Wczytaj grę', W / 2, 95, { size: 28, align: 'center', color: '#3a1e08', fam: 'title' }); divider(ctx, 200, 600, 116);
    const R = this.ROW;
    SAVE_SLOTS.forEach((slot, i) => {
      const y = R.y + i * R.gap, meta = this.slots && this.slots[slot], usable = this.slots && !this.busy && (this.mode === 'load' ? !!meta : slot !== 'auto');
      ctx.fillStyle = usable && this.hover === i && !G.modal ? 'rgba(160,100,30,.25)' : 'rgba(90,55,20,.12)'; rr(ctx, R.x, y, R.w, R.h, 4); ctx.fill();
      ctx.strokeStyle = usable ? 'rgba(90,55,20,.6)' : 'rgba(90,55,20,.3)'; ctx.lineWidth = 1; ctx.stroke();
      text(ctx, slotName(slot), R.x + 14, y + 16, { size: 16, color: usable || meta ? '#3a1e08' : '#8a6a44', fam: 'title' });
      if (!this.slots) text(ctx, '…', R.x + R.w - 14, y + 16, { size: 15, align: 'right', color: '#7a5a34' });
      else if (meta) {
        text(ctx, `${meta.hero} · ${meta.faction} · mapa ${meta.size.toLowerCase()}`, R.x + 14, y + 33, { size: 13, weight: 500, color: '#5a3814' });
        text(ctx, meta.date, R.x + R.w - 14, y + 16, { size: 13, weight: 500, align: 'right', color: '#5a3814' });
        const at = new Date(meta.at); text(ctx, isNaN(at) ? '' : `zapisano ${at.toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`, R.x + R.w - 14, y + 33, { size: 12, italic: true, weight: 500, align: 'right', color: '#7a5a34' });
      } else text(ctx, 'pusty', R.x + R.w - 14, y + 16, { size: 14, italic: true, weight: 500, align: 'right', color: '#8a6a44' });
    });
    const msg = this.err || (this.busy ? (this.mode === 'save' ? 'Zapisywanie…' : 'Wczytywanie…') : !this.slots ? 'Wczytywanie listy zapisów…' : `Zapisy są przechowywane ${SaveStore.where()}.`);
    text(ctx, msg, W / 2, 448, { size: 15, align: 'center', italic: true, weight: 500, color: this.err ? '#9a2a1a' : '#5a3814' });
    this.buttons.forEach(b => b.draw(ctx));
  },
};
// Najlepsze wyniki: zwycięstwa zapisane w tej przeglądarce. Wynik = trudność × rywale × wielkość mapy / dni.
function loadScores() { try { return JSON.parse(localStorage.getItem('kk_scores') || '[]'); } catch (e) { return []; } }
function recordScore(st) {
  const S = st.settings, foes = st.players.filter(p => !p.human).length, n = st.map.n;
  const score = Math.round(DIFFICULTIES[S.difficulty].rating * foes * n * 20 / Math.max(1, st.dayTotal));
  const row = { hero: (hero(st) || {}).name || '—', faction: factionOf(human(st).faction).name, map: (MAP_SIZES.find(m => m.id === S.mapSize) || MAP_SIZES[0]).name, diff: DIFFICULTIES[S.difficulty].name, days: st.dayTotal, score };
  const all = [...loadScores(), row].sort((a, b) => b.score - a.score).slice(0, 8);
  try { localStorage.setItem('kk_scores', JSON.stringify(all)); } catch (e) {}
  return row;
}
G.screens.scores = makeListScreen('Najlepsze wyniki', ctx => {
  [['Gracz', 200], ['Scenariusz', 330], ['Dni', 480], ['Wynik', 540]].forEach(([s, x]) => text(ctx, s, x, 140, { size: 15, color: '#3a1e08', fam: 'title' }));
  ctx.strokeStyle = 'rgba(90,55,20,.45)'; ctx.beginPath(); ctx.moveTo(195, 156); ctx.lineTo(605, 156); ctx.stroke();
  const rows = loadScores();
  if (!rows.length) { text(ctx, 'Brak wyników. Wygraj pierwszą grę, aby się tu znaleźć.', W / 2, 290, { size: 18, align: 'center', italic: true, weight: 500, color: '#5a3814' }); return; }
  rows.forEach((r, i) => {
    const y = 180 + i * 36, o = { size: 16, weight: 500, color: '#3a1e08' };
    text(ctx, r.hero, 200, y, o); text(ctx, `${r.map}, ${r.diff}`, 330, y, o); text(ctx, String(r.days), 480, y, o); text(ctx, String(r.score), 540, y, { ...o, weight: 700 });
  });
});
G.screens.credits = {
  lines: ['#KRONIKI KRÓLESTW', 'Turowa strategia w klimacie klasycznych gier fantasy', '', '#Pomysł i testy', 'Ty', '',
    '#Kod, grafika i interfejs', 'Claude', '', '#Technologia', 'HTML5 Canvas i czysty JavaScript', '',
    '#Podziękowania', 'Dla wszystkich fanów klasycznych strategii', '', '#Dziękujemy za grę!'],
  enter() { this.t0 = G.time; },
  onClick() { G.go('menu'); }, onBack() { G.go('menu'); },
  draw(ctx) {
    dimmedMenuScene(ctx, 0.78);
    const total = this.lines.length * 36 + H, off = ((G.time - this.t0) * 32) % total;
    this.lines.forEach((l, i) => {
      const y = H + 20 + i * 36 - off; if (y < -20 || y > H + 20) return;
      if (l.startsWith('#')) goldText(ctx, l.slice(1), W / 2, y, 24);
      else text(ctx, l, W / 2, y, { size: 22, weight: 500, align: 'center', color: '#ecdcb4' });
    });
    text(ctx, 'Kliknij lub naciśnij Esc, aby wrócić', W / 2, H - 18, { size: 15, weight: 500, italic: true, align: 'center', color: 'rgba(255,235,190,.6)' });
  },
};
G.screens.bye = {
  enter() { this.t0 = G.time; },
  onClick() { G.go('menu'); }, onBack() { G.go('menu'); },
  draw(ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = clamp((G.time - this.t0) / 1.2, 0, 1);
    goldText(ctx, 'Do zobaczenia, Władco!', W / 2, H / 2 - 20, 36);
    text(ctx, 'Kliknij, aby wrócić do menu głównego', W / 2, H / 2 + 30, { size: 18, weight: 500, italic: true, align: 'center', color: '#bfae88' });
    ctx.globalAlpha = 1;
  },
};

