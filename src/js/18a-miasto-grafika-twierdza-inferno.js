// ==================== MIASTO: TWIERDZA I INFERNO ==========================================
// Style, budowle i sceny dwóch frakcji dodanych po kroku 10. Budowla dostaje s = { x, b, w, h } (podstawa b)
// i poziom (tier); wspólne klocki (wallRect, roofArt, archWin, doorArt, bannerArt…) są w MIASTO: GRAFIKA.
TOWN_ART.fortress = {
  sky: ['#4a6a5a', '#9aa070', '#d8c890'], far: ['#4a5a44', '#5e6e54'], back: ['#44583a', '#34462c'], mid: ['#4e6240', '#3a4c30'], front: ['#566a44', '#3e5034'],
  path: ['#8a7a58', '#66583e'], wall: ['#9a8660', '#5e4e34'], mortar: 'rgba(40,28,12,.4)', roof: { hall: '#8a7a3e', dw: '#7a6a34', util: '#6a5a30', tower: '#5a6a34', wall: '#6e5e34' },
  roofShape: 'gable', tex: 'planks', glow: '#d8f078', door: '#241a0c', trim: '#c8b060', under: '#1e2a1a',
};
TOWN_ART.inferno = {
  sky: ['#2a0808', '#7a1e0a', '#d86a2a'], far: ['#3a1a14', '#4a2218'], back: ['#3a2622', '#2a1a18'], mid: ['#40282a', '#2e1c1c'], front: ['#482e2a', '#34201e'],
  path: ['#5a3a34', '#3e2826'], wall: ['#5a3c38', '#2e1c1c'], mortar: 'rgba(0,0,0,.5)', roof: { hall: '#8a1e16', dw: '#6a1a14', util: '#4a2a26', tower: '#5a1210', wall: '#4a1a16' },
  roofShape: 'spire', tex: 'blocks', glow: '#ff9a3a', door: '#140604', trim: '#ffb040', under: '#5a1606',
};
// --- klocki Twierdzy: pale, chaty z trzciny, totemy, bajorka ---
function stilts(c, x, b, w, h, col = '#4a3a22') {
  c.fillStyle = col; for (let px = x + 3; px < x + w - 2; px += Math.max(8, w / 5)) c.fillRect(px, b - h, 3, h);
  c.fillStyle = shadeHex(col, 0.15); c.fillRect(x - 2, b - h - 3, w + 4, 4); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x - 2, b - h, w + 4, 1.5);
}
function stiltHut(c, A, x, b, w, h, ph, roof, fx) {
  stilts(c, x, b, w, ph); const top = b - ph - h; wallRect(c, A, x, top, w, h);
  doorArt(c, A, x + w / 2 - 6, b - ph - 3, 12, Math.min(16, h - 4)); if (w > 36) winArt(c, A, x + w - 12, top + 7, 6, 6, fx);
  roofArt(c, A, roof, x, top, w, Math.max(14, h * 0.7));
  c.strokeStyle = '#4a3a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w / 2 - 6, b - ph); c.lineTo(x + w / 2 - 12, b); c.stroke(); // drabina
}
function totem(c, x, b, h, col = '#6a4a2a', eye = '#d8f078') {
  for (let i = 0; i < 3; i++) { const y = b - (i + 1) * h / 3; c.fillStyle = i % 2 ? shadeHex(col, -0.15) : col; c.fillRect(x - 5, y, 10, h / 3); c.fillStyle = '#1a1208'; c.fillRect(x - 3, y + 3, 2, 2); c.fillRect(x + 1, y + 3, 2, 2); c.fillRect(x - 2, y + h / 3 - 4, 4, 1.5); }
  c.fillStyle = eye; c.fillRect(x - 3, b - h + 3, 2, 2); c.fillRect(x + 1, b - h + 3, 2, 2);
  c.fillStyle = '#c83a2a'; c.beginPath(); c.moveTo(x - 9, b - h + 2); c.lineTo(x, b - h - 6); c.lineTo(x + 9, b - h + 2); c.closePath(); c.fill();
}
function bogPool(c, cx, b, rx, ry, col = '#2a3a26') {
  c.fillStyle = '#4a5a34'; c.beginPath(); c.ellipse(cx, b, rx + 4, ry + 2, 0, 0, TAU); c.fill();
  c.fillStyle = col; c.beginPath(); c.ellipse(cx, b, rx, ry, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(200,230,160,.25)'; c.fillRect(cx - rx * 0.5, b - 1, rx * 0.5, 1.2);
  c.fillStyle = '#5a8a3a'; for (const [dx, dy] of [[-0.5, 0.2], [0.35, -0.3], [0.1, 0.4]]) { c.beginPath(); c.ellipse(cx + dx * rx, b + dy * ry, 3, 1.4, 0, 0, TAU); c.fill(); }
}
function palisade(c, x0, x1, b, h, col = '#5a4428') {
  for (let px = x0; px < x1; px += 5) { const hh = h + ((px * 7) % 5); c.fillStyle = (px / 5) % 2 ? col : shadeHex(col, -0.15); c.fillRect(px, b - hh, 4.4, hh); c.beginPath(); c.moveTo(px, b - hh); c.lineTo(px + 2.2, b - hh - 5); c.lineTo(px + 4.4, b - hh); c.closePath(); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x0, b - h * 0.55, x1 - x0, 2); c.fillRect(x0, b - h * 0.2, x1 - x0, 2);
}
const FORTRESS_ART = {
  dw1(c, A, s, tier, col, fx) { // nora gnolli: kopiec z wejściem, kości, włócznie
    const { x, b, w, h } = s; rockMound(c, x + 4, b, w * 0.62, h * 0.52, '#6a5a3a', 21);
    c.fillStyle = '#140c06'; c.beginPath(); c.ellipse(x + 4 + w * 0.31, b - 2, 10, 12, 0, Math.PI, 0); c.fill();
    for (const px of [x + w * 0.72, x + w * 0.84]) { c.strokeStyle = '#5a3a1e'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px, b); c.lineTo(px + 3, b - 26); c.stroke(); fillPoly(c, [[px + 2, b - 26], [px + 3.5, b - 32], [px + 5, b - 25]], '#b8b0a0'); }
    extraProp(c, 'fortress', 'bones', x + w * 0.2, b, mulberry32(3), fx); if (tier >= 2) { stiltHut(c, A, x + w * 0.6, b, w * 0.36, h * 0.28, h * 0.12, A.roof.dw, fx); }
    drawCreature(c, 'gnoll', x + w * 0.9, b, 0.9, -1, 0);
  },
  dw2(c, A, s, tier, col, fx) { // chaty jaszczurów nad wodą
    const { x, b, w, h } = s; bogPool(c, x + w / 2, b - 3, w * 0.48, 8);
    stiltHut(c, A, x + 6, b - 2, w * 0.34, h * 0.36, h * 0.2, A.roof.dw, fx); stiltHut(c, A, x + w * 0.56, b - 2, w * 0.3, h * 0.3, h * 0.24, A.roof.dw, fx);
    if (tier >= 2) { const tx = x + w * 0.43; c.fillStyle = '#4a3a22'; c.fillRect(tx, b - h * 1.1, 3, h * 1.1); c.fillRect(tx - 7, b - h * 1.1, 17, 3); fillPoly(c, [[tx - 8, b - h * 1.1], [tx + 1.5, b - h * 1.1 - 12], [tx + 11, b - h * 1.1]], A.roof.tower); }
    propArt(c, 'fortress', 'reeds', x + 8, b, null, fx); propArt(c, 'fortress', 'reeds', x + w - 8, b, null, fx);
  },
  dw3(c, A, s, tier, col, fx) { // rój ważek: wielkie gniazdo w trzcinach
    const { x, b, w, h } = s, cx = x + w / 2; for (let i = -3; i <= 3; i++) { c.strokeStyle = i % 2 ? '#5a7a3a' : '#6a8a44'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + i * 5, b); c.quadraticCurveTo(cx + i * 7, b - h * 0.5, cx + i * 3, b - h * 0.85); c.stroke(); }
    const ny = b - h * 0.7; c.fillStyle = '#8a7a4a'; c.beginPath(); c.ellipse(cx, ny, w * 0.3, h * 0.2, 0, 0, TAU); c.fill(); c.fillStyle = '#6a5a34'; for (let i = 0; i < 4; i++) c.fillRect(cx - w * 0.28, ny - h * 0.12 + i * h * 0.08, w * 0.56, 1.6);
    for (const [dx, dy] of [[-0.1, -0.05], [0.12, 0.06], [-0.02, 0.1]]) { c.fillStyle = '#1a1208'; c.beginPath(); c.arc(cx + dx * w, ny + dy * h, 2.5, 0, TAU); c.fill(); }
    if (tier >= 2) { fx.glows.push([cx, ny, 26, '#b8f070']); drawCreature(c, 'venomFly', cx + w * 0.3, ny - 6, 0.8, -1, 0); }
    drawCreature(c, 'dragonfly', cx - w * 0.3, ny + 4, 0.8, 1, 0);
  },
  dw4(c, A, s, tier, col, fx) { // jama bazyliszków: krąg kamieni, skamieniali wojownicy
    const { x, b, w, h } = s, cx = x + w / 2; c.fillStyle = '#2a2a1e'; c.beginPath(); c.ellipse(cx, b - 6, w * 0.4, 9, 0, 0, TAU); c.fill();
    for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI, sx = cx + Math.cos(a) * w * 0.44; menhir(c, sx, b - 6 + Math.sin(a) * -4, 8, 16 + (i % 2) * 6 + (tier >= 2 ? 6 : 0), '#7a7a6a', '#f0e040'); }
    c.save(); c.globalAlpha = 0.9; drawCreature(c, 'pikeman', cx - w * 0.2, b - 2, 0.9, 1, 0); c.restore(); c.fillStyle = 'rgba(150,150,140,.75)'; c.fillRect(cx - w * 0.2 - 6, b - 24, 12, 22); // posąg
    circ(c, cx + 6, b - 8, 1.6, '#f0e040'); circ(c, cx + 11, b - 8, 1.6, '#f0e040'); fx.wins.push([cx + 4, b - 10, 9, 4, '#f0e040']);
  },
  dw5(c, A, s, tier, col, fx) { // zagroda gorgon
    const { x, b, w, h } = s; c.fillStyle = '#4a5234'; c.beginPath(); c.ellipse(x + w / 2, b - 4, w * 0.48, 10, 0, 0, TAU); c.fill();
    stiltHut(c, A, x + 2, b, w * 0.36, h * 0.3, h * 0.08, A.roof.dw, fx);
    drawCreature(c, tier >= 2 ? 'mightyGorgon' : 'gorgon', x + w * 0.66, b - 2, 1.1, -1, 0);
    fence(c, x + w * 0.4, x + w - 2, b + 2, '#5a4428', 10); if (tier >= 2) { c.fillStyle = '#5a5a5a'; c.fillRect(x + w * 0.4, b - 12, w * 0.58, 2); }
  },
  dw6(c, A, s, tier, col, fx) { // gniazdo wywern na skalnej iglicy
    const { x, b, w, h } = s, cx = x + w * 0.45; rockMound(c, cx - w * 0.2, b, w * 0.4, h * 0.95, '#5a5a4a', 31);
    const ny = b - h * 0.95; c.fillStyle = '#6a5030'; c.beginPath(); c.ellipse(cx, ny + 2, 16, 5, 0, 0, TAU); c.fill(); c.strokeStyle = '#4a3820'; c.lineWidth = 1.5; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i * 4, ny); c.lineTo(cx + i * 5, ny + 6); c.stroke(); }
    circ(c, cx - 4, ny - 1, 2.5, '#e8e0cc'); circ(c, cx + 2, ny - 1.5, 2.5, '#e8e0cc');
    drawCreature(c, tier >= 2 ? 'wyvernKing' : 'wyvern', x + w * 0.8, b - h * 0.45, 0.9, -1, 0.5);
  },
  dw7(c, A, s, tier, col, fx) { // bagno hydr
    const { x, b, w, h } = s, cx = x + w / 2; bogPool(c, cx, b - 5, w * 0.48, 12, tier >= 2 ? '#2a1e36' : '#1e2e1c');
    rockMound(c, x + 2, b, w * 0.24, h * 0.32, '#4a4e3a', 41); rockMound(c, x + w * 0.76, b, w * 0.22, h * 0.26, '#4a4e3a', 43);
    drawCreature(c, tier >= 2 ? 'chaosHydra' : 'hydra', cx, b - 6, 1.35, -1, 0.3);
    propArt(c, 'fortress', 'reeds', x + w * 0.3, b, null, fx); if (tier >= 2) fx.glows.push([cx, b - 12, 40, '#a080ff']);
  },
};
BUILD_ART.fortress = FORTRESS_ART;
// --- klocki Inferna: bazalt, iglice, lawa, ogień ---
function lavaPool(c, cx, b, rx, ry, fx) {
  c.fillStyle = '#1a0c0a'; c.beginPath(); c.ellipse(cx, b, rx + 4, ry + 2, 0, 0, TAU); c.fill();
  const g = c.createRadialGradient(cx, b, 1, cx, b, rx); g.addColorStop(0, '#ffe070'); g.addColorStop(0.5, '#ff7a1a'); g.addColorStop(1, '#7a1a06'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, b, rx, ry, 0, 0, TAU); c.fill();
  if (fx) fx.glows.push([cx, b - 4, rx * 1.4, '#ff7a1a']);
}
function hornArch(c, x, b, w, h, col = '#2a1a18') {
  c.fillStyle = col; c.beginPath(); c.moveTo(x, b); c.quadraticCurveTo(x - w * 0.1, b - h * 0.7, x + w * 0.2, b - h); c.lineTo(x + w * 0.3, b - h * 0.9); c.quadraticCurveTo(x + w * 0.12, b - h * 0.55, x + w * 0.16, b); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x + w, b); c.quadraticCurveTo(x + w * 1.1, b - h * 0.7, x + w * 0.8, b - h); c.lineTo(x + w * 0.7, b - h * 0.9); c.quadraticCurveTo(x + w * 0.88, b - h * 0.55, x + w * 0.84, b); c.closePath(); c.fill();
}
function portal(c, cx, cy, rx, ry, col, fx) {
  c.fillStyle = '#140404'; c.beginPath(); c.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, TAU); c.fill();
  const g = c.createRadialGradient(cx, cy, 1, cx, cy, Math.max(rx, ry)); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.4, col); g.addColorStop(1, '#3a0404'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,230,160,.5)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(cx, cy, rx * i / 4, ry * i / 4, i, 0.5, 4); c.stroke(); }
  if (fx) fx.glows.push([cx, cy, Math.max(rx, ry) * 1.6, col]);
}
const INFERNO_ART = {
  dw1(c, A, s, tier, col, fx) { // tygiel chochlików
    const { x, b, w, h } = s, cx = x + w * 0.42; c.fillStyle = '#1a1212'; c.beginPath(); c.moveTo(cx - 20, b - 24); c.quadraticCurveTo(cx - 22, b, cx, b); c.quadraticCurveTo(cx + 22, b, cx + 20, b - 24); c.closePath(); c.fill();
    c.fillStyle = '#3a2626'; c.fillRect(cx - 22, b - 26, 44, 4); lavaPool(c, cx, b - 26, 18, 3, fx); fx.smokes.push([cx, b - 30, 0.8]);
    drawCreature(c, 'imp', cx - 10, b - 26, 0.9, 1, 0); drawCreature(c, tier >= 2 ? 'familiar' : 'imp', x + w * 0.84, b, 1, -1, 0.4);
    if (tier >= 2) { c.strokeStyle = '#3a2a2a'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + w * 0.72 + i * 6, b); c.lineTo(x + w * 0.72 + i * 6, b - 30); c.stroke(); } c.fillRect(x + w * 0.7, b - 32, 26, 3); }
  },
  dw2(c, A, s, tier, col, fx) { // hala gogów z kulą ognia
    const { x, b, w, h } = s, bw = w * 0.62, top = b - h * 0.62; wallRect(c, A, x + 4, top, bw, h * 0.62); roofArt(c, A, A.roof.dw, x + 4, top, bw, h * 0.4);
    doorArt(c, A, x + 4 + bw / 2 - 8, b, 16, 20); for (const dx of [10, bw - 10]) archWin(c, x + 4 + dx - 3, top + 10, 6, 10, A.glow, fx);
    const oy = top - h * 0.4 - 12; circ(c, x + 4 + bw / 2, oy, tier >= 2 ? 8 : 6, '#ff8a2a'); circ(c, x + 2 + bw / 2, oy - 2, 3, '#ffe070'); fx.glows.push([x + 4 + bw / 2, oy, 26, '#ff8a2a']);
    drawCreature(c, tier >= 2 ? 'magog' : 'gog', x + w * 0.86, b, 1, -1, 0);
  },
  dw3(c, A, s, tier, col, fx) { // psiarnia: klatki z ogarami
    const { x, b, w, h } = s, bw = w * 0.9, top = b - h * 0.4; wallRect(c, A, x + 4, top, bw, h * 0.4); roofArt(c, A, A.roof.dw, x + 4, top, bw, h * 0.3);
    c.fillStyle = '#0a0404'; c.fillRect(x + 10, b - h * 0.3, bw - 12, h * 0.3); drawCreature(c, tier >= 2 ? 'cerberus' : 'hellHound', x + w * 0.5, b - 1, 0.95, 1, 0);
    c.fillStyle = '#4a3a36'; for (let px = x + 10; px < x + bw; px += 6) c.fillRect(px, b - h * 0.3, 1.8, h * 0.3);
  },
  dw4(c, A, s, tier, col, fx) { // brama demonów: łuk z rogów i czerwony portal
    const { x, b, w, h } = s, cx = x + w / 2; c.fillStyle = '#2a1a18'; c.fillRect(cx - w * 0.36, b - 8, w * 0.72, 8);
    portal(c, cx, b - h * 0.36, w * 0.2, h * 0.3, tier >= 2 ? '#ff3a2a' : '#c8401a', fx);
    hornArch(c, cx - w * 0.36, b - 6, w * 0.72, h * (tier >= 2 ? 1.05 : 0.9), '#e0d0b8');
    drawCreature(c, tier >= 2 ? 'hornedDemon' : 'demon', x + w * 0.88, b, 0.9, -1, 0);
  },
  dw5(c, A, s, tier, col, fx) { // szyb czartów: otwór z łuną i kolumny
    const { x, b, w, h } = s, cx = x + w / 2; lavaPool(c, cx, b - 6, w * 0.34, 8, fx);
    for (const dx of [-w * 0.4, w * 0.4]) { wallRect(c, A, cx + dx - 6, b - h * 0.7, 12, h * 0.7); c.fillStyle = '#1a0e0c'; c.fillRect(cx + dx - 8, b - h * 0.72, 16, 4); propArt(c, 'inferno', 'brazier', cx + dx, b - h * 0.72, null, fx); }
    drawCreature(c, tier >= 2 ? 'pitLord' : 'pitFiend', cx, b - 10, 0.9, -1, 0);
  },
  dw6(c, A, s, tier, col, fx) { // pałac ifrytów: złote kopuły w płomieniach
    const { x, b, w, h } = s, cx = x + w / 2, bw = w * 0.6, top = b - h * 0.5; wallRect(c, { ...A, wall: ['#8a5a3a', '#4a2a1e'] }, cx - bw / 2, top, bw, h * 0.5);
    for (let i = 0; i < 3; i++) archWin(c, cx - bw / 2 + bw * (0.2 + i * 0.3) - 3, top + 10, 6, 11, '#ffe070', fx);
    const dome = (dx, r, y) => { c.fillStyle = '#d8a030'; c.beginPath(); c.moveTo(dx - r, y); c.quadraticCurveTo(dx - r, y - r * 1.4, dx, y - r * 2); c.quadraticCurveTo(dx + r, y - r * 1.4, dx + r, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(dx, y - r * 2); c.quadraticCurveTo(dx + r, y - r * 1.4, dx + r, y); c.lineTo(dx, y); c.closePath(); c.fill(); };
    dome(cx, bw * 0.28, top); if (tier >= 2) { dome(cx - bw * 0.4, 9, top + 8); dome(cx + bw * 0.4, 9, top + 8); }
    fx.glows.push([cx, top - bw * 0.5, 34, '#ffb040']); drawCreature(c, tier >= 2 ? 'efreetSultan' : 'efreet', x + w * 0.9, b - 4, 0.85, -1, 0.2);
  },
  dw7(c, A, s, tier, col, fx) { // wrota piekieł: rogaty portal na skale
    const { x, b, w, h } = s, cx = x + w / 2; rockMound(c, x, b, w, h * 0.35, '#2a1a18', 51);
    portal(c, cx, b - h * 0.62, w * 0.24, h * 0.32, tier >= 2 ? '#ffb040' : '#ff5a1a', fx);
    hornArch(c, cx - w * 0.34, b - h * 0.3, w * 0.68, h * 0.72, '#1a0e0c'); hornArch(c, cx - w * 0.3, b - h * 0.3, w * 0.6, h * 0.62, '#e0d0b8');
    if (tier >= 2) drawCreature(c, 'archDevil', x + w * 0.82, b - h * 0.3, 0.85, -1, 0);
  },
};
BUILD_ART.inferno = INFERNO_ART;
// --- sceny: Twierdza nad mętną rzeką, Inferno nad przepaścią lawy ---
TOWN_LAYOUTS.fortress = {
  sky: { top: '#141c16', mid: '#3a4a36', hor: '#b8a060', sun: [420, 140], cloudDark: 'rgba(40,52,40,.7)', cloudLit: 'rgba(200,190,120,.45)' },
  mountains: ['#4a5446', '#3a4438'], forest: ['#2a3a24', '#26341e', '#30422a'],
  ground: ['#5a6040', '#3e4a2c', '#24301c'], haze: '#8a9470', desat: 0.22, tuft: ['rgba(20,30,10,.45)', 'rgba(170,180,110,.2)'],
  hills: [{ X: -300, Z: 2.3, rx: 320, h: 34, cols: ['#4a5a36', '#34422a'] }, { X: 520, Z: 2.62, rx: 330, h: 70, cols: ['#5a5e4a', '#3e4234'], rock: true }],
  river: { w: 80, cols: ['#6a7a52', '#1e2a1a'], edge: 'rgba(160,180,120,.4)', pts: [[-820, 2.05], [-500, 1.82], [-250, 1.7], [-80, 1.63], [100, 1.6], [300, 1.64], [600, 1.75], [900, 1.9]] },
  roads: [
    { w: 40, planks: true, pts: [[26, 0.8, 0, 50], [15, 0.9], [2, 1.02], [-12, 1.15], [-20, 1.25, 0, 40]] },
    { w: 34, planks: true, pts: [[-70, 1.27], [-130, 1.31], [-170, 1.42], [-190, 1.55], [-200, 1.66], [-214, 1.76], [-226, 1.86], [-236, 1.95], [-240, 1.99]] },
  ],
  plaza: { X: -40, Z: 1.27, r: 100 },
  bridge: { X: -200, Z: 1.665, w: 64 },
  slots: TOWN_LAYOUTS.haven.slots.map((S, i) => ({ ...S, e: i === 1 ? 10 : S.e })),
  props: [
    ['tree', -540, 1.78, 0, 1.3], ['tree', -470, 1.95, 0, 1.3], ['tree', -620, 2.25, 0, 1.4], ['tree', 380, 2.2, 0, 1.4], ['tree', 720, 2.1, 0, 1.4], ['tree', 660, 1.85, 0, 1.3],
    ['tree', -560, 1.3, 0, 1.2], ['tree', -470, 1.05, 0, 1.3], ['tree', 440, 1.06, 0, 1.2], ['tree', 400, 1.55, 0, 1.2], ['tree', 80, 2.45, 0, 1.3],
    ['reeds', -300, 1.62], ['reeds', 40, 1.56], ['reeds', 250, 1.6], ['reeds', -120, 1.58], ['reeds', 480, 1.7], ['bush', -150, 0.88], ['bush', 520, 1.4],
    ['lamp', -25, 0.82], ['lamp', 42, 1.06], ['mushroom', -80, 0.9], ['fence', 330, 1.02], ['fence', -350, 1.0],
  ],
  walksW: [[[26, 0.82], [15, 0.9], [2, 1.02], [-12, 1.15], [-20, 1.26]], [[-100, 1.27], [-40, 1.28], [30, 1.27]]], walkCols: ['#5a7a3a', '#7a6a3a', '#4a6a4a', '#8a5a2a'],
  guardsW: [[-262, 1.985, 10], [-218, 1.985, 10]], guardCol: '#5a7a3a',
  floaters: [{ kind: 'wisp', X: -100, Z: 1.62, e: 14, n: 5, spread: 260, spreadZ: 0.08 }], birds: true, birdCol: 'rgba(20,28,16,.85)', mist: true,
};
TOWN_LAYOUTS.inferno = {
  pj: { hor: 40, d: 330 },
  sky: { top: '#0a0202', mid: '#3a0a06', hor: '#c8401a', sun: [296, 60], moon: true, moonR: 30, cloudDark: 'rgba(30,6,4,.75)', cloudLit: 'rgba(255,120,40,.35)' },
  mountains: ['#2a0e0a', '#1a0806'], forest: ['#1e0c0a', '#2a100c', '#160806'],
  ground: ['#4a2a24', '#2e1a16', '#160c0a'], haze: '#6a2a1a', desat: 0.08, tuft: ['rgba(0,0,0,.4)', 'rgba(255,120,40,.12)'],
  hills: [{ X: 0, Z: 2.55, rx: 200, h: 90, cols: ['#3a1e1a', '#1e0e0c'], rock: true }, { X: 440, Z: 2.85, rx: 260, h: 80, cols: ['#3a1e1a', '#1e0e0c'], rock: true }, { X: -440, Z: 2.9, rx: 260, h: 70, cols: ['#361a16', '#1a0c0a'], rock: true }],
  river: { w: 150, chasm: true, cols: ['#ff9a3a', '#6a0e04'], line: 'rgba(255,240,160,.6)', edge: 'rgba(40,10,6,.9)', glow: '255,120,30', glowA: 0.2,
    pts: [[0, 0.78, 0, 170], [10, 1.0, 0, 150], [-10, 1.3, 0, 130], [15, 1.6, 0, 110], [0, 1.95, 0, 90], [0, 2.2, 0, 50]] },
  roads: TOWN_LAYOUTS.barrow.roads,
  bridge: { X: 0, Z: 1.46, w: 170 },
  slots: TOWN_LAYOUTS.barrow.slots,
  props: [
    ['tree', -420, 2.3, 0, 1.3], ['tree', 380, 2.35, 0, 1.3], ['tree', -360, 1.5, 0, 1.2], ['tree', 360, 1.2, 0, 1.2], ['tree', -260, 0.95, 0, 1.1],
    ['spike', -110, 0.95], ['spike', 110, 0.98], ['spike', 96, 1.12], ['spike', -90, 1.9], ['spike', -60, 2.0, 0, 1.4], ['spike', 60, 2.05, 0, 1.4],
    ['brazier', -85, 1.42], ['brazier', 85, 1.42], ['brazier', -100, 1.95], ['brazier', 100, 1.95], ['fence', 330, 1.05], ['fence', -390, 1.3], ['rock', -200, 1.1],
  ],
  walksW: [[[-190, 1.62], [-130, 1.52], [-80, 1.46], [80, 1.46], [150, 1.52], [220, 1.66]]], walkCols: ['#8a2a1a', '#5a1a14', '#a0402a', '#6a2a20'],
  guardsW: [[-26, 2.47, 76], [26, 2.47, 76]], guardCol: '#6a1a14',
  floaters: [{ kind: 'ember', X: 0, Z: 1.3, e: 10, n: 10, spread: 90, spreadZ: 0.4 }], birds: true, birdCol: 'rgba(20,4,2,.9)', embers: true,
};
