// ==================== MIASTO: GRAFIKA ===================================================
// Style frakcji (TOWN_ART), budowle (BUILD_ART), układy scen w perspektywie (TOWN_LAYOUTS), efekty animowane.
const TOWN_ART = {
  haven: { sky: ['#3f74b8', '#8cb6dc', '#e6dcb8'], far: ['#7890b0', '#98acc4'], back: ['#5c8c3c', '#44702e'], mid: ['#6a9a44', '#4e7c34'], front: ['#78a64c', '#56863a'],
    path: ['#c2ab80', '#9c8660'], wall: ['#d6cab4', '#9a8c74'], mortar: 'rgba(60,44,28,.32)', roof: { hall: '#c9a23a', dw: '#b0432e', util: '#8e5a32', tower: '#3a5f9e', wall: '#a8442e' },
    roofShape: 'gable', tex: 'bricks', glow: '#ffd27a', door: '#3a2414', trim: '#e8c868' },
  sylvan: { sky: ['#d9884a', '#f2c880', '#cfe0a0'], far: ['#4f7a52', '#6f9468'], back: ['#40703a', '#2e5a2c'], mid: ['#4c803e', '#386630'], front: ['#5a9046', '#42723a'],
    path: ['#a88e62', '#806a48'], wall: ['#a07a4c', '#6a4c2c'], mortar: 'rgba(40,24,10,.42)', roof: { hall: '#7ab84c', dw: '#5c9a3e', util: '#8a7a40', tower: '#3e8a6a', wall: '#6a8a3a' },
    roofShape: 'dome', tex: 'planks', glow: '#fff0a0', door: '#2a1a0c', trim: '#d8e878' },
  barrow: { sky: ['#140c26', '#342048', '#5e4466'], far: ['#241c34', '#342a46'], back: ['#3a3444', '#2a2632'], mid: ['#423c4c', '#302a38'], front: ['#4a4454', '#34303e'],
    path: ['#6a6474', '#4c4856'], wall: ['#625c6c', '#383442'], mortar: 'rgba(0,0,0,.45)', roof: { hall: '#4c3a70', dw: '#3a3050', util: '#4a4046', tower: '#2c2440', wall: '#3c3648' },
    roofShape: 'spire', tex: 'blocks', glow: '#a6f0a8', door: '#0c0812', trim: '#a888d8' },
};
function drawEmblem(ctx, kind, cx, cy, s, col) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 20, s / 20); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
  const dark = 'rgba(0,0,0,.4)';
  switch (kind) {
    case 'coin': ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(-1, -5, 2, 10); ctx.fillRect(-4, -3, 8, 2); ctx.fillRect(-4, 1, 8, 2); break;
    case 'wall': ctx.fillRect(-9, -2, 18, 10); for (const x of [-9, -3, 3]) ctx.fillRect(x, -8, 4, 6); break;
    case 'book': ctx.fillRect(-9, -7, 8, 14); ctx.fillRect(1, -7, 8, 14); ctx.fillStyle = dark; ctx.fillRect(-1.5, -8, 3, 16); break;
    case 'mug': ctx.fillRect(-7, -6, 11, 13); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(5, -1, 4, -1.2, 1.2); ctx.stroke(); break;
    case 'scale': ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 7); ctx.moveTo(-8, -5); ctx.lineTo(8, -5); ctx.stroke(); ctx.beginPath(); ctx.arc(-8, -1, 4, 0, Math.PI); ctx.arc(8, -1, 4, 0, Math.PI); ctx.fill(); break;
    case 'barrel': ctx.beginPath(); ctx.ellipse(0, 0, 7, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(-7, -3, 14, 2); ctx.fillRect(-7, 2, 14, 2); break;
    case 'anvil': ctx.beginPath(); [[-9, -4], [7, -4], [9, 0], [2, 0], [3, 5], [7, 8], [-7, 8], [-3, 5], [-2, 0], [-9, 0]].forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.fill(); break;
    case 'spear': ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, 9); ctx.lineTo(4, -5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(7, -10); ctx.lineTo(8, -2); ctx.closePath(); ctx.fill(); break;
    case 'bow': ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(-2, 0, 8, -1.2, 1.2); ctx.stroke(); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1, -7.4); ctx.lineTo(1, 7.4); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke(); break;
    case 'sword': ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(5, -8); ctx.stroke(); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(1, 4); ctx.stroke(); break;
    case 'wing': ctx.beginPath(); ctx.moveTo(-9, 4); ctx.quadraticCurveTo(-2, -10, 9, -6); ctx.quadraticCurveTo(0, -2, -2, 7); ctx.closePath(); ctx.fill(); break;
    case 'cross': ctx.fillRect(-2.5, -9, 5, 18); ctx.fillRect(-8, -4, 16, 5); break;
    case 'horse': ctx.beginPath(); ctx.ellipse(-2, 2, 8, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(3, -1); ctx.lineTo(7, -9); ctx.lineTo(10, -8); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill(); break;
    case 'sun': ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill(); ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.stroke(); } break;
    case 'leaf': ctx.save(); ctx.rotate(-0.6); ctx.beginPath(); ctx.ellipse(0, 0, 5, 10, 0, 0, TAU); ctx.fill(); ctx.restore(); ctx.strokeStyle = dark; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 7); ctx.lineTo(5, -7); ctx.stroke(); break;
    case 'tree': ctx.fillRect(-2, 0, 4, 9); ctx.beginPath(); ctx.arc(0, -3, 8, 0, TAU); ctx.fill(); break;
    case 'horn': ctx.beginPath(); ctx.moveTo(-4, 9); ctx.lineTo(0, -10); ctx.lineTo(4, 9); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-3 + i * 0.6, 6 - i * 4); ctx.lineTo(3 - i * 0.6, 4 - i * 4); ctx.stroke(); } break;
    case 'flame': ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(9, 0, 5, 7); ctx.quadraticCurveTo(0, 11, -5, 7); ctx.quadraticCurveTo(-9, 0, 0, -10); ctx.fill(); break;
    case 'dragon': ctx.beginPath(); [[-10, 4], [-4, -8], [-2, -2], [2, -9], [4, -2], [9, -7], [7, 6]].forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.quadraticCurveTo(0, 2, -10, 4); ctx.fill(); break;
    case 'skull': ctx.beginPath(); ctx.arc(0, -2, 8, 0, TAU); ctx.fill(); ctx.fillRect(-5, 4, 10, 5); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.arc(-3, -2, 2.4, 0, TAU); ctx.arc(3, -2, 2.4, 0, TAU); ctx.fill(); ctx.fillRect(-0.8, 1, 1.6, 3); break;
    case 'grave': ctx.beginPath(); ctx.moveTo(-6, 9); ctx.lineTo(-6, -3); ctx.arc(0, -3, 6, Math.PI, 0); ctx.lineTo(6, 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(-1, -6, 2, 9); ctx.fillRect(-3.5, -3.5, 7, 2); break;
    case 'ghost': ctx.beginPath(); ctx.arc(0, -3, 7, Math.PI, 0); ctx.lineTo(7, 9); ctx.lineTo(3.5, 6); ctx.lineTo(0, 9); ctx.lineTo(-3.5, 6); ctx.lineTo(-7, 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(-3.5, -4, 2.2, 3); ctx.fillRect(1.3, -4, 2.2, 3); break;
    case 'bat': ctx.beginPath(); [[0, -3], [3, -7], [4, -3], [10, -7], [9, 1], [6, -1], [3, 4], [0, 1], [-3, 4], [-6, -1], [-9, 1], [-10, -7], [-4, -3], [-3, -7]].forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.fill(); break;
    case 'moon': ctx.beginPath(); ctx.arc(0, 0, 9, 0.9, TAU - 0.9); ctx.arc(5, 0, 7.5, TAU - 1.25, 1.25, true); ctx.closePath(); ctx.fill(); break;
    case 'eye': ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(0, 0, 2, 5, 0, 0, TAU); ctx.fill(); break;
    case 'fork': ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -4); ctx.moveTo(-6, -9); ctx.lineTo(-6, -3); ctx.quadraticCurveTo(0, 2, 6, -3); ctx.lineTo(6, -9); ctx.moveTo(0, -4); ctx.lineTo(0, -10); ctx.stroke(); break;
  }
  ctx.restore();
}
// --- elementy budowli ---
function wallRect(c, A, x, y, w, h) {
  c.fillStyle = A.wall[0]; c.fillStyle = A.wall[1];
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, A.wall[0]); g.addColorStop(1, A.wall[1]); c.fillStyle = g; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = A.mortar; c.lineWidth = 1;
  if (A.tex === 'bricks') { for (let yy = y + 7, r = 0; yy < y + h; yy += 7, r++) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); for (let xx = x + (r % 2) * 6; xx < x + w; xx += 12) { c.beginPath(); c.moveTo(xx, yy - 7); c.lineTo(xx, yy); c.stroke(); } } }
  else if (A.tex === 'planks') { for (let xx = x + 5; xx < x + w; xx += 6) { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, y + h); c.stroke(); } c.fillStyle = 'rgba(40,24,10,.35)'; c.fillRect(x, y, w, 3); c.fillRect(x, y + h - 3, w, 3); }
  else { for (let yy = y + 12, r = 0; yy < y + h; yy += 12, r++) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); for (let xx = x + (r % 2) * 9; xx < x + w; xx += 18) { c.beginPath(); c.moveTo(xx, yy - 12); c.lineTo(xx, yy); c.stroke(); } } }
  const wr = mulberry32(Math.round(x * 31 + y * 17 + w));
  if (A.tex !== 'planks') {
    const bh = A.tex === 'bricks' ? 7 : 12, bw2 = A.tex === 'bricks' ? 12 : 18;
    for (let i = 0, n = Math.round(w * h / 140); i < n; i++) { const row = Math.floor(wr() * (h / bh)), cl = Math.floor(wr() * (w / bw2 + 1)), bx = x + cl * bw2 - (row % 2 ? bw2 / 2 : 0); c.fillStyle = wr() < 0.5 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.1)'; c.fillRect(bx + 1, y + row * bh + 1, bw2 - 1.5, bh - 1.5); }
  } else for (let i = 0; i < w / 6; i++) { c.fillStyle = wr() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)'; c.fillRect(x + Math.floor(wr() * w / 6) * 6 + 1, y, 4, h); }
  const dg = c.createLinearGradient(0, y + h - Math.min(20, h * 0.45), 0, y + h); dg.addColorStop(0, 'rgba(40,30,20,0)'); dg.addColorStop(1, 'rgba(40,30,20,.32)'); c.fillStyle = dg; c.fillRect(x, y, w, h);
  if (A.roofShape !== 'spire') for (let i = 0; i < w / 9; i++) circ(c, x + wr() * w, y + h - wr() * 7, 1.2 + wr() * 2.4, 'rgba(76,112,52,.5)');
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + w * 0.72, y, w * 0.28, h);
  c.restore();
}
function roofArt(c, A, col, x, y, w, rh) {
  if (A.roofShape === 'dome') {
    c.fillStyle = shadeHex(col, -0.3); c.beginPath(); c.ellipse(x + w / 2, y, w / 2 + 6, rh, 0, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(x + w / 2 - 2, y - 2, w / 2 + 2, Math.max(2, rh - 3), 0, Math.PI, 0); c.closePath(); c.fill();
    const r = mulberry32(Math.round(x * 7 + y * 3));
    for (let i = 0; i < Math.round(w / 5); i++) { const a = Math.PI + 0.2 + r() * (Math.PI - 0.4), k = 0.45 + r() * 0.45; circ(c, x + w / 2 + Math.cos(a) * (w / 2) * k, y - 2 + Math.sin(a) * (rh - 3) * k, 2.5 + r() * 3, shadeHex(col, 0.08 + r() * 0.22)); }
    c.fillStyle = shadeHex(col, -0.45); c.fillRect(x - 5, y - 2, w + 10, 3);
  } else if (A.roofShape === 'spire') {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + w / 2, y - rh); c.lineTo(x + w + 3, y); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.moveTo(x + w / 2, y - rh); c.lineTo(x + w + 3, y); c.lineTo(x + w / 2, y); c.closePath(); c.fill();
    c.strokeStyle = A.trim; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + w / 2, y - rh - 8); c.lineTo(x + w / 2, y - rh); c.moveTo(x - 3, y); c.lineTo(x + w + 3, y); c.stroke();
    if (w > 46) for (const sx of [x + 7, x + w - 7]) { c.fillStyle = shadeHex(col, -0.15); c.beginPath(); c.moveTo(sx - 5, y); c.lineTo(sx, y - rh * 0.55); c.lineTo(sx + 5, y); c.closePath(); c.fill(); }
  } else {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 5, y + 2); c.lineTo(x + w / 2, y - rh); c.lineTo(x + w + 5, y + 2); c.closePath(); c.fill();
    c.save(); c.clip(); const tr = mulberry32(Math.round(x * 13 + y * 7));
    for (let yy = y - rh + 1, row = 0; yy < y + 2; yy += 5, row++) for (let xx = x - 5 + (row % 2) * 4; xx < x + w + 5; xx += 8) if (tr() < 0.3) { c.fillStyle = tr() < 0.5 ? 'rgba(0,0,0,.13)' : 'rgba(255,240,220,.13)'; c.fillRect(xx, yy, 7, 4); }
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; for (let yy = y - rh + 6; yy < y + 2; yy += 5) { c.beginPath(); c.moveTo(x - 5, yy); c.lineTo(x + w + 5, yy); c.stroke(); } c.restore();
    c.strokeStyle = 'rgba(255,240,210,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 4, y + 1); c.lineTo(x + w / 2, y - rh + 1); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.moveTo(x + w / 2, y - rh); c.lineTo(x + w + 5, y + 2); c.lineTo(x + w / 2, y + 2); c.closePath(); c.fill();
    c.fillStyle = shadeHex(col, -0.35); c.fillRect(x - 5, y, w + 10, 3);
  }
}
function winArt(c, A, x, y, w, h, fx) {
  c.fillStyle = 'rgba(20,12,6,.85)'; c.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
  c.fillStyle = A.glow; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + w / 2 - 0.5, y, 1, h); c.fillRect(x, y + h / 2 - 0.5, w, 1);
  if (fx) fx.wins.push([x, y, w, h]);
}
function doorArt(c, A, x, b, w, h) {
  const arch = (dx, dw, dh) => { c.beginPath(); c.moveTo(dx, b); c.lineTo(dx, b - dh + dw / 2); c.arc(dx + dw / 2, b - dh + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dx + dw, b); c.closePath(); c.fill(); };
  c.fillStyle = shadeHex(A.wall[1], -0.35); arch(x - 2, w + 4, h + 2); c.fillStyle = A.door; arch(x, w, h);
}
function signArt(c, A, emblem, x, y, post, faded) {
  c.fillStyle = '#3a2614'; c.fillRect(x - 1, y, 2, post);
  c.fillStyle = faded ? 'rgba(96,68,40,.75)' : '#7a5430'; rr(c, x - 11, y + 6, 22, 16, 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1; c.stroke();
  drawEmblem(c, emblem, x, y + 14, 12, faded ? 'rgba(240,220,170,.55)' : '#f4e2a8');
}
let CUR_FX = null;
function bannerArt(c, x, y, col) {
  c.strokeStyle = '#3a2a18'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y + 20); c.lineTo(x, y - 6); c.stroke();
  if (CUR_FX) { CUR_FX.flags.push([x, y, col]); return; }
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 14, y - 1); c.lineTo(x, y + 6); c.closePath(); c.fill();
}
function plotArt(c, A, s, emblem) {
  const cx = s.x + s.w / 2, b = s.b;
  c.strokeStyle = 'rgba(255,245,210,.4)'; c.setLineDash([4, 4]); c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, b - 4, s.w * 0.4, 7, 0, 0, TAU); c.stroke(); c.setLineDash([]);
  for (const dx of [-s.w * 0.38, s.w * 0.38]) { c.fillStyle = '#6a4a2a'; c.fillRect(cx + dx - 1.5, b - 14, 3, 12); }
  signArt(c, A, emblem, cx, b - 26, 24, true);
}
function propArt(c, fac, kind, x, b, r, fx) {
  if (kind === 'tree' && fac === 'fortress') { // bagienna wierzba: krzywy pień, zwisający mech
    c.strokeStyle = '#3a2e1c'; c.lineCap = 'round'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 4, b); c.quadraticCurveTo(x + 4, b - 14, x - 1, b - 28); c.stroke();
    limb(c, x - 1, b - 3, x - 9, b + 1, 2, '#3a2e1c'); limb(c, x, b - 3, x + 8, b + 1, 2, '#3a2e1c');
    circ(c, x, b - 34, 13, '#2a3a1e'); circ(c, x - 7, b - 31, 9, '#34462a'); circ(c, x + 7, b - 30, 9, '#304226'); circ(c, x - 3, b - 40, 6, '#4a5e34');
    c.strokeStyle = '#6a7a4a'; c.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * 3.5, b - 28); c.lineTo(x + i * 3.8, b - 14 - Math.abs(i) * 2); c.stroke(); }
    return;
  }
  if (kind === 'tree' && fac === 'inferno') { // zwęglone drzewo z żarzącymi się pęknięciami
    c.strokeStyle = '#1a0e0c'; c.lineCap = 'round'; c.lineWidth = 4.5; c.beginPath(); c.moveTo(x, b); c.lineTo(x + 1, b - 38); c.stroke(); c.lineWidth = 2;
    for (const [a, l] of [[-1, 15], [-0.4, 19], [0.4, 13], [1, 17]]) { c.beginPath(); c.moveTo(x + 1, b - 22 - l * 0.4); c.lineTo(x + 1 + Math.sin(a) * l, b - 28 - Math.cos(a) * l); c.stroke(); }
    c.strokeStyle = '#ff6a1a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, b - 4); c.lineTo(x + 1, b - 12); c.lineTo(x, b - 18); c.stroke(); if (fx) fx.glows.push([x, b - 10, 10, '#ff6a1a']);
    return;
  }
  if (kind === 'reeds') { for (let i = -4; i <= 4; i++) { const h = 14 + ((i * 7 + 20) % 9); c.strokeStyle = i % 2 ? '#5a7a3a' : '#6a8a44'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + i * 2.4, b); c.lineTo(x + i * 2.8, b - h); c.stroke(); if (i % 3 === 0) { c.fillStyle = '#6a4424'; c.fillRect(x + i * 2.8 - 1, b - h - 1, 2.4, 6); } } return; }
  if (kind === 'spike') { c.fillStyle = '#1e1216'; c.beginPath(); c.moveTo(x - 7, b); c.lineTo(x - 1, b - 30); c.lineTo(x + 6, b); c.closePath(); c.fill(); c.fillStyle = '#3a2226'; c.beginPath(); c.moveTo(x - 7, b); c.lineTo(x - 1, b - 30); c.lineTo(x - 2, b); c.closePath(); c.fill(); c.fillStyle = '#ff5a1a'; c.fillRect(x - 2, b - 12, 1.5, 6); return; }
  if (kind === 'brazier') { c.fillStyle = '#2a1a16'; c.fillRect(x - 1.5, b - 18, 3, 18); c.beginPath(); c.moveTo(x - 7, b - 22); c.lineTo(x + 7, b - 22); c.lineTo(x + 4, b - 17); c.lineTo(x - 4, b - 17); c.closePath(); c.fill(); c.fillStyle = '#ffa030'; c.beginPath(); c.moveTo(x - 5, b - 22); c.quadraticCurveTo(x, b - 36, x + 5, b - 22); c.fill(); if (fx) fx.glows.push([x, b - 26, 22, '#ff8a2a']); return; }
  if (kind === 'tree') {
    if (fac === 'barrow') { c.strokeStyle = '#1e1824'; c.lineCap = 'round'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, b); c.lineTo(x + 2, b - 40); c.stroke(); c.lineWidth = 2;
      for (const [a, l] of [[-0.9, 16], [-0.3, 20], [0.5, 14], [1.1, 18]]) { c.beginPath(); c.moveTo(x + 1, b - 26 - l * 0.4); c.lineTo(x + 1 + Math.sin(a) * l, b - 30 - Math.cos(a) * l); c.stroke(); } return; }
    c.fillStyle = '#4a3020'; c.fillRect(x - 2.5, b - 22, 5, 22);
    const base = fac === 'sylvan' ? '#2e6a30' : '#3a7a2c';
    circ(c, x, b - 32, 14, shadeHex(base, -0.25)); circ(c, x - 6, b - 36, 10, base); circ(c, x + 6, b - 30, 9, base); circ(c, x - 3, b - 42, 7, shadeHex(base, 0.2));
  } else if (kind === 'bush') {
    const base = fac === 'barrow' ? '#3a3a30' : fac === 'inferno' ? '#3a2220' : fac === 'fortress' ? '#3e5a2e' : fac === 'sylvan' ? '#3a7a34' : '#4a8a34';
    circ(c, x, b - 7, 9, shadeHex(base, -0.2)); circ(c, x - 8, b - 4, 7, base); circ(c, x + 8, b - 4, 7, base); circ(c, x - 2, b - 10, 5, shadeHex(base, 0.2));
    if (fac !== 'barrow' && r() < 0.6) for (let i = 0; i < 4; i++) circ(c, x - 8 + r() * 16, b - 4 - r() * 8, 1.5, fac === 'sylvan' ? '#f8e070' : fac === 'inferno' ? '#ff6a1a' : fac === 'fortress' ? '#c080e0' : '#f07a8a');
  } else if (kind === 'lamp') {
    c.fillStyle = '#2a2420'; c.fillRect(x - 1.5, b - 30, 3, 30); c.fillRect(x - 5, b - 2, 10, 2);
    c.fillStyle = '#3a3028'; c.fillRect(x - 4, b - 38, 8, 9); winArt(c, TOWN_ART[fac] || TOWN_ART.haven, x - 2.5, b - 36.5, 5, 6, fx);
  } else if (kind === 'grave') {
    c.fillStyle = '#6a6474'; c.beginPath(); c.moveTo(x - 6, b); c.lineTo(x - 6, b - 12); c.arc(x, b - 12, 6, Math.PI, 0); c.lineTo(x + 6, b); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - 1, b - 15, 2, 8); c.fillRect(x - 3.5, b - 12.5, 7, 2);
  } else if (kind === 'mushroom') {
    for (const [dx, sc] of [[0, 1], [7, 0.7]]) { c.fillStyle = '#e8dcc0'; c.fillRect(x + dx - 1.5 * sc, b - 7 * sc, 3 * sc, 7 * sc); c.fillStyle = '#c8402a'; c.beginPath(); c.ellipse(x + dx, b - 7 * sc, 6 * sc, 4 * sc, 0, Math.PI, 0); c.fill(); circ(c, x + dx - 2 * sc, b - 9 * sc, 1 * sc, '#fff'); }
  } else if (kind === 'fence') {
    const spiky = fac === 'barrow' || fac === 'inferno' || fac === 'fortress'; c.fillStyle = fac === 'barrow' ? '#1e1a24' : fac === 'inferno' ? '#2a1612' : fac === 'fortress' ? '#4e3a22' : '#6a4a2a';
    for (let i = 0; i < 5; i++) { c.fillRect(x + i * 7, b - 14, 2.5, 14); if (spiky) { c.beginPath(); c.moveTo(x + i * 7 - 1, b - 14); c.lineTo(x + i * 7 + 1.2, b - 19); c.lineTo(x + i * 7 + 3.5, b - 14); c.fill(); } }
    c.fillRect(x - 2, b - 10, 34, 2); c.fillRect(x - 2, b - 5, 34, 2);
  }
}
const PAL = { plaster: '#efe4c8', beam: '#5a3a20', woodD: '#5e3c20', stoneD: '#8a7e6a', marble: '#f2eee4', marbleD: '#c8c0b0', gold: '#e0b840', straw: '#d8b860' };
const GABLE = { roofShape: 'gable' };
// grupa budowli i jej poziom (ulepszenia zmieniają wygląd)
function groupOf(B) {
  if (B.id.startsWith('hall')) return ['hall', +B.id[4]];
  const f = ['fort', 'citadel', 'castle'].indexOf(B.id); if (f >= 0) return ['fort', f + 1];
  if (B.id.startsWith('guild')) return ['guild', +B.id[5]];
  const m = /^dw(\d)(u?)$/.exec(B.id); if (m) return ['dw' + m[1], m[2] ? 2 : 1];
  return [B.id, 1];
}
// --- drobne elementy rysunków ---
function cone(c, col, cx, y, w, rh) {
  c.fillStyle = col; c.beginPath(); c.moveTo(cx - w / 2 - 3, y); c.lineTo(cx, y - rh); c.lineTo(cx + w / 2 + 3, y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(cx, y - rh); c.lineTo(cx + w / 2 + 3, y); c.lineTo(cx, y); c.closePath(); c.fill();
  c.fillStyle = shadeHex(col, -0.35); c.fillRect(cx - w / 2 - 3, y - 1, w + 6, 3);
}
function crenel(c, A, x, y, w) {
  const n = Math.max(2, Math.round(w / 10)), mw = w / (n * 2 - 1);
  c.fillStyle = A.wall[0]; for (let i = 0; i < n; i++) c.fillRect(x + i * 2 * mw, y - 6, mw, 6);
  c.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < n; i++) c.fillRect(x + i * 2 * mw + mw * 0.6, y - 6, mw * 0.4, 6);
}
function archWin(c, x, y, w, h, glow, fx) {
  const path = (dx, dy, ww, hh) => { c.beginPath(); c.moveTo(dx, dy + hh); c.lineTo(dx, dy + ww / 2); c.arc(dx + ww / 2, dy + ww / 2, ww / 2, Math.PI, 0); c.lineTo(dx + ww, dy + hh); c.closePath(); };
  c.fillStyle = 'rgba(20,12,6,.85)'; path(x - 1.5, y - 1.5, w + 3, h + 3); c.fill();
  c.fillStyle = glow; path(x, y, w, h); c.fill(); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + w / 2 - 0.5, y + 2, 1, h - 2);
  if (fx) fx.wins.push([x, y, w, h, glow]);
}
function timber(c, x, y, w, h) {
  c.fillStyle = PAL.plaster; c.fillRect(x, y, w, h); c.strokeStyle = PAL.beam; c.lineWidth = 2.5; c.strokeRect(x, y, w, h);
  c.beginPath(); for (let i = 1; i < 3; i++) { c.moveTo(x + w * i / 3, y); c.lineTo(x + w * i / 3, y + h); }
  c.moveTo(x, y); c.lineTo(x + w / 3, y + h); c.moveTo(x + w, y); c.lineTo(x + w * 2 / 3, y + h); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x + w * 0.7, y, w * 0.3, h);
}
function barrel(c, x, b) {
  c.fillStyle = '#7a4a24'; c.beginPath(); c.ellipse(x, b - 7, 6, 8, 0, 0, TAU); c.fill();
  c.fillStyle = '#3a2a1a'; c.fillRect(x - 6, b - 11, 12, 2); c.fillRect(x - 6, b - 4, 12, 2);
  c.fillStyle = '#9a6a3a'; c.beginPath(); c.ellipse(x, b - 14, 5, 2, 0, 0, TAU); c.fill();
}
function crate(c, x, b, s = 12) {
  c.fillStyle = '#9a6a3a'; c.fillRect(x - s / 2, b - s, s, s); c.strokeStyle = '#5a3a1a'; c.lineWidth = 1.2; c.strokeRect(x - s / 2, b - s, s, s);
  c.beginPath(); c.moveTo(x - s / 2, b - s); c.lineTo(x + s / 2, b); c.stroke();
}
function fence(c, x0, x1, b, col = '#7a5230', h = 12) {
  c.fillStyle = col; for (let x = x0; x <= x1; x += 8) c.fillRect(x - 1, b - h, 2.5, h);
  c.fillRect(x0 - 1, b - h + 3, x1 - x0 + 3, 2); c.fillRect(x0 - 1, b - h * 0.45, x1 - x0 + 3, 2);
}
function star(c, x, y, r) {
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill();
}
const planksA = A => ({ ...A, tex: 'planks', wall: ['#a0784a', '#6a4a2a'] });
const marbleA = A => ({ ...A, wall: [PAL.marble, PAL.marbleD], tex: 'blocks', mortar: 'rgba(120,110,90,.25)' });
// --- elementy wspólne ---
function trunk(c, x, b, w, h, col = '#6a4a2c') {
  const lt = shadeHex(col, 0.15), dk = shadeHex(col, -0.35); c.fillStyle = lt; c.fillStyle = dk;
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, lt); g.addColorStop(1, dk); c.fillStyle = g;
  c.beginPath(); c.moveTo(x - w * 0.85, b); c.quadraticCurveTo(x - w * 0.45, b - h * 0.15, x - w / 2, b - h); c.lineTo(x + w / 2, b - h); c.quadraticCurveTo(x + w * 0.45, b - h * 0.15, x + w * 0.85, b); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(30,18,8,.45)'; c.lineWidth = 1; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + i * w * 0.22, b - h + 4); c.lineTo(x + i * w * 0.3, b - 3); c.stroke(); }
}
function canopy(c, cx, cy, r, col, seed = 1) {
  const q = mulberry32(seed), dk = shadeHex(col, -0.3), lt = shadeHex(col, 0.22);
  for (let i = 0; i < 9; i++) { const a = q() * TAU, d = q() * r * 0.55; circ(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, r * (0.45 + q() * 0.25), dk); }
  for (let i = 0; i < 8; i++) { const a = q() * TAU, d = q() * r * 0.5; circ(c, cx + Math.cos(a) * d - r * 0.12, cy + Math.sin(a) * d * 0.6 - r * 0.15, r * (0.3 + q() * 0.2), col); }
  for (let i = 0; i < 6; i++) circ(c, cx - r * 0.35 + q() * r * 0.4, cy - r * 0.38 + q() * r * 0.3, r * 0.14, lt);
}
function menhir(c, x, b, w, h, col = '#8a8a80', rune = '#8af0b8') {
  c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, b); c.lineTo(x - w * 0.42, b - h * 0.85); c.quadraticCurveTo(x, b - h - 2, x + w * 0.42, b - h * 0.85); c.lineTo(x + w / 2, b); c.closePath(); c.fill();
  c.fillStyle = shadeHex(col, -0.3); c.fillRect(x + w * 0.08, b - h * 0.84, w * 0.34, h * 0.84);
  c.strokeStyle = rune; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - 1, b - h * 0.62); c.lineTo(x + 1.5, b - h * 0.46); c.lineTo(x - 1, b - h * 0.3); c.stroke();
}
function rockMound(c, x, b, w, h, col, seed = 3) {
  const q = mulberry32(seed), pts = [[x, b]];
  for (let i = 1; i < 8; i++) { const f = i / 8; pts.push([x + w * f, b - h * Math.sin(f * Math.PI) * (0.75 + q() * 0.3)]); }
  pts.push([x + w, b]); c.fillStyle = col; c.beginPath(); pts.forEach(([a, d], i) => i ? c.lineTo(a, d) : c.moveTo(a, d)); c.closePath(); c.fill();
  c.fillStyle = shadeHex(col, -0.3); c.beginPath(); c.moveTo(x + w * 0.55, b); for (let i = 5; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(x + w * 0.55, pts[4][1]); c.closePath(); c.fill();
  c.fillStyle = shadeHex(col, 0.15); for (let i = 0; i < 5; i++) c.fillRect(x + w * (0.15 + q() * 0.4), b - h * (0.3 + q() * 0.4), 5, 2);
}
function crystals(c, x, b, s, col) {
  for (const [dx, hh, a] of [[-6, 16, -0.25], [0, 24, 0], [7, 14, 0.3]]) {
    c.save(); c.translate(x + dx * s, b); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(-3 * s, 0); c.lineTo(-3 * s, -hh * s * 0.75); c.lineTo(0, -hh * s); c.lineTo(3 * s, -hh * s * 0.75); c.lineTo(3 * s, 0); c.closePath(); c.fill();
    c.fillStyle = shadeHex(col, 0.35); c.fillRect(-2 * s, -hh * s * 0.7, 1.4 * s, hh * s * 0.6); c.restore();
  }
}
function coffin(c, x, b, s = 1) {
  c.fillStyle = '#3a2a24'; c.beginPath(); c.moveTo(x - 4 * s, b); c.lineTo(x - 6 * s, b - 12 * s); c.lineTo(x - 3 * s, b - 20 * s); c.lineTo(x + 3 * s, b - 20 * s); c.lineTo(x + 6 * s, b - 12 * s); c.lineTo(x + 4 * s, b); c.closePath(); c.fill();
  c.fillStyle = '#8a7a6a'; c.fillRect(x - 0.6 * s, b - 17 * s, 1.2 * s, 9 * s); c.fillRect(x - 2.5 * s, b - 14 * s, 5 * s, 1.2 * s);
}
function skullAt(c, x, y, s = 1, col = '#e0d8c4') { drawEmblem(c, 'skull', x, y, 12 * s, col); }
function ribs(c, x, b, w, h, col = '#e0d8c4') {
  c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(x, b - h * 0.2); c.quadraticCurveTo(x + w * 0.5, b - h * 1.05, x + w, b - h * 0.35); c.stroke();
  c.lineWidth = 2.4; for (let i = 1; i <= 5; i++) { const f = i / 6, px = x + w * f, py = b - h * (0.2 + Math.sin(f * Math.PI) * 0.72); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px - 8, b - h * 0.2, px - 4, b); c.stroke(); }
}
function stalls(c, s, awn, goods, pole = '#5a3a20') {
  const { x, b, w } = s;
  for (let i = 0; i < 3; i++) {
    const sw = (w - 12) / 3 - 6, sx = x + 8 + i * (w - 12) / 3, sb = b - 3 - (i % 2) * 7;
    c.fillStyle = pole; c.fillRect(sx, sb - 34, 2.5, 34); c.fillRect(sx + sw - 2.5, sb - 34, 2.5, 34);
    c.fillStyle = '#6a4a2a'; c.fillRect(sx - 2, sb - 14, sw + 4, 5);
    for (let k = 0; k < 5; k++) circ(c, sx + 3 + k * (sw - 6) / 4, sb - 16, 2.3, goods[(k + i) % goods.length]);
    for (let k = 0; k < 5; k++) { c.fillStyle = awn[i][k % 2]; c.fillRect(sx - 4 + k * (sw + 8) / 5, sb - 40, (sw + 8) / 5 + 0.5, 8); }
    c.fillStyle = awn[i][0]; c.beginPath(); for (let k = 0; k <= 5; k++) c.lineTo(sx - 4 + k * (sw + 8) / 5, sb - 32 + (k % 2) * 3); c.lineTo(sx + sw + 4, sb - 40); c.lineTo(sx - 4, sb - 40); c.closePath(); c.fill();
  }
}
// --- Przystań: każdy budynek wygląda jak to, czym jest ---
const HAVEN_ART = {
  hall(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 2) for (const side of [0, 1]) {
      const ww = w * 0.27, wx = side ? x + w - ww : x, wt = b - h * 0.4; wallRect(c, A, wx, wt, ww, h * 0.4);
      for (let i = 0; i < 2; i++) archWin(c, wx + ww * (0.3 + i * 0.4) - 3.5, wt + 10, 7, 12, A.glow, fx);
      roofArt(c, GABLE, A.roof.dw, wx, wt, ww, h * 0.16);
    }
    const bw = w * 0.5, bx = cx - bw / 2, top = b - h * 0.58;
    wallRect(c, A, bx, top, bw, h * 0.58);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { if (r === 1 && i === 1) continue; archWin(c, bx + bw * (0.2 + i * 0.3) - 4, top + 8 + r * 24, 8, 13, A.glow, fx); }
    if (tier >= 3) { c.fillStyle = PAL.marble; for (let i = 0; i < 4; i++) c.fillRect(cx - 25 + i * 15, b - 34, 5, 32); c.fillStyle = PAL.marbleD; c.beginPath(); c.moveTo(cx - 31, b - 33); c.lineTo(cx, b - 47); c.lineTo(cx + 31, b - 33); c.closePath(); c.fill(); }
    doorArt(c, A, cx - 9, b, 18, 26);
    c.fillStyle = A.trim; c.fillRect(bx - 2, top - 3, bw + 4, 4);
    if (tier <= 2) {
      const tw = 26; wallRect(c, A, cx - tw / 2, top - 36, tw, 36);
      circ(c, cx, top - 20, 8, '#f4efe0'); c.strokeStyle = '#2a1a0e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, top - 20); c.lineTo(cx, top - 26); c.moveTo(cx, top - 20); c.lineTo(cx + 4, top - 18); c.stroke();
      cone(c, A.roof.dw, cx, top - 36, tw, 22); bannerArt(c, cx, top - 64, col);
    } else {
      const dc = tier === 4 ? PAL.gold : '#6f9ab8';
      c.fillStyle = shadeHex(dc, -0.3); c.beginPath(); c.ellipse(cx, top - 2, 25, 24, 0, Math.PI, 0); c.closePath(); c.fill();
      c.fillStyle = dc; c.beginPath(); c.ellipse(cx - 2, top - 3, 22, 22, 0, Math.PI, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(cx - 9, top - 12, 4, 8, -0.3, 0, TAU); c.fill();
      c.fillStyle = PAL.marble; c.fillRect(cx - 4, top - 34, 8, 10); cone(c, dc, cx, top - 34, 8, 10); bannerArt(c, cx, top - 62, col);
    }
    if (tier === 4) for (const px of [x + 8, x + w - 8]) bannerArt(c, px, b - h * 0.4 - 24, col);
  },
  fort(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 2) {
      const big = tier >= 3, kw = big ? 64 : 52, kh = h * (big ? 1.04 : 0.86), kx = cx - 8 - kw / 2, kt = b - kh;
      wallRect(c, A, kx, kt, kw, kh - 16); crenel(c, A, kx, kt, kw);
      for (let r = 0; r < (big ? 3 : 2); r++) for (let i = 0; i < 2; i++) archWin(c, kx + kw * (0.3 + i * 0.4) - 3.5, kt + 12 + r * 20, 7, 12, A.glow, fx);
      if (big) {
        for (const tx of [kx - 6, kx + kw - 8]) { wallRect(c, A, tx, kt - 16, 14, 34); cone(c, A.roof.wall, tx + 7, kt - 16, 14, 24); bannerArt(c, tx + 7, kt - 52, col); }
        cone(c, A.roof.wall, kx + kw / 2, kt - 1, kw * 0.46, 44); bannerArt(c, kx + kw / 2, kt - 70, col);
      } else bannerArt(c, kx + kw / 2, kt - 26, col);
    }
    if (tier >= 3) { const tx = x + w * 0.66, tt = b - h * 0.95; wallRect(c, A, tx, tt, 24, b - tt - 20); cone(c, A.roof.wall, tx + 12, tt, 24, 26); archWin(c, tx + 8.5, tt + 14, 7, 11, A.glow, fx); bannerArt(c, tx + 12, tt - 48, col); }
    const wh = h * 0.36, wy = b - wh; wallRect(c, A, x + 16, wy, w - 32, wh); crenel(c, A, x + 16, wy, w - 32);
    const gw = 42, gt = b - wh - 18; wallRect(c, A, cx - gw / 2, gt, gw, wh + 18); crenel(c, A, cx - gw / 2, gt, gw);
    c.fillStyle = '#1a120a'; c.beginPath(); c.moveTo(cx - 10, b); c.lineTo(cx - 10, b - 16); c.arc(cx, b - 16, 10, Math.PI, 0); c.lineTo(cx + 10, b); c.closePath(); c.fill();
    c.strokeStyle = '#7a7a82'; c.lineWidth = 1; c.beginPath();
    for (let i = -8; i <= 8; i += 4) { c.moveTo(cx + i, b - 24); c.lineTo(cx + i, b); } for (let j = 0; j < 4; j++) { c.moveTo(cx - 10, b - 4 - j * 6); c.lineTo(cx + 10, b - 4 - j * 6); } c.stroke();
    for (const tx of [x, x + w - 30]) {
      const th = h * (tier >= 3 ? 0.66 : 0.56); wallRect(c, A, tx, b - th, 30, th); crenel(c, A, tx, b - th, 30); archWin(c, tx + 11.5, b - th + 14, 7, 11, A.glow, fx);
      if (tier >= 2) cone(c, A.roof.wall, tx + 15, b - th - 1, 30, 24);
    }
  },
  guild(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, tw = w * 0.6, th = h * (0.48 + Math.min(tier, 3) * 0.1 + Math.max(0, tier - 3) * 0.05), top = b - th;
    if (tier >= 3) { c.fillStyle = A.wall[1]; c.fillRect(cx + tw / 2 - 2, top + 18, 14, 4); circ(c, cx + tw / 2 + 8, top + 14, 7, '#6f9ab8'); c.strokeStyle = '#3a3a44'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx + tw / 2 + 6, top + 12); c.lineTo(cx + tw / 2 + 18, top); c.stroke(); }
    wallRect(c, A, cx - tw / 2, top, tw, th);
    c.fillStyle = shadeHex(A.wall[1], -0.2); for (let i = 1; i <= tier; i++) c.fillRect(cx - tw / 2 - 2, top + i * th / (tier + 1), tw + 4, 3);
    for (let i = 0; i <= tier; i++) archWin(c, cx - 4, top + 8 + i * th / (tier + 1), 8, 12, '#b8dcff', fx);
    doorArt(c, A, cx - 7, b, 14, 18);
    cone(c, A.roof.tower, cx, top, tw, 34 + tier * 5);
    c.fillStyle = PAL.gold; star(c, cx, top - 42 - tier * 5, 6);
  },
  tavern(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.72, bx = x + 4, top = b - h * 0.62;
    c.fillStyle = shadeHex(PAL.stoneD, 0.1); c.fillRect(bx, b - h * 0.26, bw, h * 0.26);
    timber(c, bx, top, bw, h * 0.36);
    archWin(c, bx + 8, b - h * 0.22, 9, 12, A.glow, fx); archWin(c, bx + bw - 19, b - h * 0.22, 9, 12, A.glow, fx);
    winArt(c, A, bx + 10, top + 9, 9, 9, fx); winArt(c, A, bx + bw - 20, top + 9, 9, 9, fx);
    doorArt(c, A, bx + bw / 2 - 8, b, 16, 20);
    c.fillStyle = PAL.stoneD; c.fillRect(bx + bw * 0.7, top - h * 0.3, 8, h * 0.3); fx.smokes.push([bx + bw * 0.7 + 4, top - h * 0.31]);
    roofArt(c, GABLE, '#8e4a2a', bx, top, bw, h * 0.32);
    c.strokeStyle = '#2a1a0e'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + bw, top + 14); c.lineTo(bx + bw + 18, top + 14); c.stroke();
    c.fillStyle = '#7a5430'; rr(c, bx + bw + 5, top + 17, 16, 14, 2); c.fill(); drawEmblem(c, 'mug', bx + bw + 13, top + 24, 11, '#f4e2a8');
    barrel(c, x + w - 8, b); barrel(c, x + w - 21, b);
    c.fillStyle = '#6a4424'; c.fillRect(bx - 2, b - 7, 18, 3); c.fillRect(bx, b - 5, 2, 5); c.fillRect(bx + 13, b - 5, 2, 5);
  },
  market(c, A, s, tier, col, fx) {
    const { x, b, w } = s;
    c.fillStyle = 'rgba(196,182,154,.95)'; c.beginPath(); c.ellipse(x + w / 2, b - 5, w / 2, 9, 0, 0, TAU); c.fill();
    const awn = [['#c83a2a', '#f4eee0'], ['#2f5bd0', '#f4eee0'], ['#3a8a3a', '#f4eee0']], goods = ['#d83a2a', '#e8b030', '#6aa83a', '#e87a2a', '#b83ab0'];
    for (let i = 0; i < 3; i++) {
      const sw = (w - 12) / 3 - 6, sx = x + 8 + i * (w - 12) / 3, sb = b - 3 - (i % 2) * 7;
      c.fillStyle = '#5a3a20'; c.fillRect(sx, sb - 34, 2.5, 34); c.fillRect(sx + sw - 2.5, sb - 34, 2.5, 34);
      c.fillStyle = '#8a5a32'; c.fillRect(sx - 2, sb - 14, sw + 4, 5);
      for (let k = 0; k < 5; k++) circ(c, sx + 3 + k * (sw - 6) / 4, sb - 16, 2.3, goods[(k + i) % 5]);
      for (let k = 0; k < 5; k++) { c.fillStyle = awn[i][k % 2]; const ax = sx - 4 + k * (sw + 8) / 5; c.fillRect(ax, sb - 40, (sw + 8) / 5 + 0.5, 8); }
      c.fillStyle = awn[i][0]; c.beginPath(); c.moveTo(sx - 4, sb - 40); c.lineTo(sx + sw / 2, sb - 47); c.lineTo(sx + sw + 4, sb - 40); c.closePath(); c.fill();
    }
    crate(c, x + w - 6, b, 10); crate(c, x + 6, b + 1, 9); barrel(c, x + w / 2 + 2, b + 2);
  },
  smith(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.76, bx = x + 2, top = b - h * 0.6;
    wallRect(c, A, bx, top, bw, h * 0.6);
    c.fillStyle = '#1a100a'; c.fillRect(bx + 8, b - h * 0.42, bw * 0.56, h * 0.42);
    const gx = bx + 8 + bw * 0.28; c.fillStyle = '#ff8a2a'; c.fillRect(gx - 9, b - 8, 18, 6); circ(c, gx, b - 8, 6, '#ffc050'); fx.glows.push([gx, b - 10, 24, '#ff9a3a']);
    c.fillStyle = PAL.stoneD; c.fillRect(bx + bw * 0.72, top - h * 0.34, 9, h * 0.34); fx.smokes.push([bx + bw * 0.72 + 4.5, top - h * 0.35]);
    roofArt(c, GABLE, A.roof.util, bx, top, bw, h * 0.3);
    drawEmblem(c, 'anvil', x + w - 11, b - 7, 18, '#40404a');
    c.strokeStyle = '#c0c4cc'; c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx + bw - 13 + i * 4, b - 1); c.lineTo(bx + bw - 15 + i * 4, b - 22); c.stroke(); }
  },
  silo(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.64, bx = x + 2, top = b - h * 0.6, dx = bx + bw / 2;
    wallRect(c, planksA(A), bx, top, bw, h * 0.6); roofArt(c, GABLE, A.roof.util, bx, top, bw, h * 0.36);
    c.fillStyle = '#4a2e18'; c.fillRect(dx - 10, b - 24, 20, 24); c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(dx - 10, b - 24); c.lineTo(dx + 10, b); c.moveTo(dx + 10, b - 24); c.lineTo(dx - 10, b); c.stroke();
    c.fillStyle = '#2a1a0e'; c.fillRect(dx - 5, top + 5, 10, 8);
    for (const [lx, ly] of [[x + w - 20, b - 5], [x + w - 9, b - 5], [x + w - 14.5, b - 14]]) { circ(c, lx, ly, 5.5, '#8a5a32'); circ(c, lx, ly, 3.2, '#d8a86a'); }
    c.fillStyle = '#7a7470'; c.beginPath(); c.moveTo(bx + bw - 4, b); c.lineTo(bx + bw + 3, b - 9); c.lineTo(bx + bw + 9, b - 4); c.lineTo(bx + bw + 11, b); c.closePath(); c.fill();
  },
  dw1(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.56, bx = x + 4, top = b - h * 0.6, mx = bx + bw / 2;
    if (tier >= 2) { fence(c, bx + bw + 4, x + w - 2, b, '#7a5230', 10); bannerArt(c, x + w - 4, b - 42, col); }
    wallRect(c, A, bx, top, bw, h * 0.6); crenel(c, A, bx, top, bw);
    archWin(c, bx + 7, top + 12, 7, 11, A.glow, fx); archWin(c, bx + bw - 14, top + 12, 7, 11, A.glow, fx);
    doorArt(c, A, mx - 7, b, 14, 20);
    c.fillStyle = col; c.beginPath(); c.moveTo(mx - 6, top + 5); c.lineTo(mx + 6, top + 5); c.lineTo(mx + 6, top + 12); c.lineTo(mx, top + 17); c.lineTo(mx - 6, top + 12); c.closePath(); c.fill(); c.strokeStyle = PAL.gold; c.lineWidth = 1; c.stroke();
    const rx = bx + bw + 8; c.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { c.strokeStyle = '#6a4424'; c.beginPath(); c.moveTo(rx + i * 4, b); c.lineTo(rx + 2 + i * 4, b - 30); c.stroke(); c.fillStyle = '#c8ccd4'; c.beginPath(); c.moveTo(rx + i * 4, b - 30); c.lineTo(rx + 2 + i * 4, b - 37); c.lineTo(rx + 4 + i * 4, b - 30); c.fill(); }
    const dx = x + w - 14; c.fillStyle = '#6a4424'; c.fillRect(dx - 1, b - 30, 2.5, 30); c.fillRect(dx - 9, b - 24, 18, 2.5);
    c.fillStyle = PAL.straw; c.beginPath(); c.ellipse(dx, b - 17, 5, 8, 0, 0, TAU); c.fill(); circ(c, dx, b - 29, 4, PAL.straw);
  },
  dw2(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s;
    if (tier >= 2) {
      const tx = x + 3, tw = 22, tt = b - h - 6; c.fillStyle = PAL.woodD; c.fillRect(tx + 2, tt + 24, 3, b - tt - 24); c.fillRect(tx + tw - 5, tt + 24, 3, b - tt - 24);
      wallRect(c, planksA(A), tx, tt + 12, tw, 16); cone(c, A.roof.dw, tx + tw / 2, tt + 12, tw, 16); c.fillStyle = '#1a100a'; c.fillRect(tx + 7, tt + 16, 8, 6);
    }
    const sx = x + (tier >= 2 ? 30 : 6), sw = 44, sy = b - h * 0.62;
    c.fillStyle = PAL.woodD; for (const px of [sx, sx + sw - 3]) c.fillRect(px, sy, 3, b - sy);
    roofArt(c, GABLE, A.roof.dw, sx - 2, sy, sw + 4, 14);
    c.fillStyle = '#8a5a32'; c.fillRect(sx, b - 12, sw, 3);
    c.strokeStyle = '#6a4424'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(sx + 10 + i * 8, b - 12); c.lineTo(sx + 12 + i * 8, b - 26); c.stroke(); }
    for (let i = 0; i < 2; i++) {
      const tx = x + w - 13 - i * 23, ty = b - 17; c.strokeStyle = PAL.woodD; c.lineWidth = 2; c.beginPath(); c.moveTo(tx - 5, b); c.lineTo(tx, ty); c.lineTo(tx + 5, b); c.stroke();
      for (const [r, cc] of [[9, '#f4eee0'], [7, '#c83a2a'], [5, '#f4eee0'], [3, '#c83a2a'], [1.5, '#e8c040']]) circ(c, tx, ty - 4, r, cc);
      c.strokeStyle = '#4a2e18'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx - 2, ty - 6); c.lineTo(tx - 9, ty - 9); c.stroke();
    }
  },
  dw3(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, tw = w * 0.5, top = b - h * 0.72;
    wallRect(c, A, cx - tw / 2, top, tw, h * 0.72); crenel(c, A, cx - tw / 2 - 3, top, tw + 6);
    for (let i = 0; i < 3; i++) archWin(c, cx - 3.5, top + 14 + i * 22, 7, 11, A.glow, fx);
    doorArt(c, A, cx - 7, b, 14, 18);
    if (tier >= 2) { c.fillStyle = PAL.gold; c.fillRect(cx - tw / 2 - 3, top + 2, tw + 6, 3); }
    c.fillStyle = '#6a4a28'; c.beginPath(); c.ellipse(cx, top - 7, tw * 0.78, 7, 0, 0, TAU); c.fill();
    c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.2; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(cx - tw * 0.72 + i * tw * 0.18, top - 2); c.lineTo(cx - tw * 0.62 + i * tw * 0.16, top - 12); c.stroke(); }
    griffin(c, cx - 3, top - 9, 1, 1);
    if (tier >= 2) griffin(c, x + w - 4, top + 26, -1, 0.75);
  },
  dw4(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * (tier >= 2 ? 0.74 : 0.92), bx = x + 3, top = b - h * 0.56, mx = bx + bw / 2;
    if (tier >= 2) {
      const cx2 = x + w - 15, ct = b - h + 4; wallRect(c, A, cx2 - 11, ct + 30, 22, b - ct - 30); cone(c, A.roof.dw, cx2, ct + 30, 22, 26);
      c.fillStyle = PAL.gold; c.fillRect(cx2 - 1, ct - 6, 2, 11); c.fillRect(cx2 - 4, ct - 3, 8, 2); archWin(c, cx2 - 3.5, ct + 40, 7, 12, A.glow, fx);
    }
    wallRect(c, A, bx, top, bw, h * 0.56); roofArt(c, GABLE, A.roof.dw, bx, top, bw, h * 0.32);
    doorArt(c, A, mx - 9, b, 18, 24);
    c.strokeStyle = '#d8dce4'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(mx - 9, top + 16); c.lineTo(mx + 9, top + 4); c.moveTo(mx + 9, top + 16); c.lineTo(mx - 9, top + 4); c.stroke();
    for (const tx of [bx + 14, bx + bw - 14]) { circ(c, tx, top + 17, 7, col); c.strokeStyle = PAL.gold; c.lineWidth = 1.5; c.beginPath(); c.arc(tx, top + 17, 7, 0, TAU); c.stroke(); c.fillStyle = PAL.gold; c.fillRect(tx - 1, top + 12, 2, 10); c.fillRect(tx - 4, top + 16, 8, 2); }
  },
  dw5(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, nx = x + 4, nw = w * 0.62, top = b - h * 0.5;
    const towers = tier >= 2 ? [x + w * 0.62 - 6, x + w - 26] : [x + w - 26];
    for (const tx of towers) {
      const tt = b - h * (tier >= 2 ? 0.8 : 0.72); wallRect(c, A, tx, tt, 22, b - tt);
      c.fillStyle = '#1a120a'; c.beginPath(); c.moveTo(tx + 5, tt + 22); c.lineTo(tx + 5, tt + 12); c.arc(tx + 11, tt + 12, 6, Math.PI, 0); c.lineTo(tx + 17, tt + 22); c.closePath(); c.fill();
      circ(c, tx + 11, tt + 16, 4, PAL.gold); cone(c, A.roof.tower, tx + 11, tt, 22, 26);
      c.fillStyle = PAL.gold; c.fillRect(tx + 10, tt - 36, 2, 10); c.fillRect(tx + 7, tt - 33, 8, 2);
    }
    wallRect(c, A, nx, top, nw, h * 0.5); roofArt(c, GABLE, A.roof.dw, nx, top, nw, h * 0.28);
    const rx = nx + nw / 2, ry = top + 14, rr2 = tier >= 2 ? 10 : 8;
    circ(c, rx, ry, rr2, '#2a1a0e'); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; circ(c, rx + Math.cos(a) * rr2 * 0.5, ry + Math.sin(a) * rr2 * 0.5, rr2 * 0.36, ['#d83a4a', '#3a6ad8', '#e8c040'][i % 3]); }
    circ(c, rx, ry, 2.5, '#fff0b0'); fx.wins.push([rx - 6, ry - 6, 12, 12, '#ffe0a0']);
    doorArt(c, A, rx - 8, b, 16, 22);
    archWin(c, nx + 7, top + 26, 6, 12, A.glow, fx); archWin(c, nx + nw - 13, top + 26, 6, 12, A.glow, fx);
  },
  dw6(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.52, bx = x + 2, top = b - h * 0.58;
    if (tier >= 2) {
      const ax = x + w - 34, ay = b - 12; c.fillStyle = '#8a6a44'; c.beginPath(); c.ellipse(ax, ay, 32, 14, 0, 0, TAU); c.fill();
      c.fillStyle = '#c8ae7a'; c.beginPath(); c.ellipse(ax, ay + 2, 25, 9, 0, 0, TAU); c.fill();
      c.fillStyle = '#6a4a2a'; for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; c.fillRect(ax + Math.cos(a) * 30 - 1, ay + Math.sin(a) * 13 - 8, 2.5, 8); }
      for (const px of [ax - 28, ax + 28]) bannerArt(c, px, ay - 32, col);
      horse(c, ax + 4, ay + 6, -1, '#6a3a1e');
    }
    wallRect(c, planksA(A), bx, top, bw, h * 0.58); roofArt(c, GABLE, A.roof.dw, bx, top, bw, h * 0.3);
    for (const hx of [bx + 2, bx + 12]) { circ(c, hx, b - 5, 5.5, '#d8b050'); c.strokeStyle = '#a8802a'; c.lineWidth = 1; c.beginPath(); c.arc(hx, b - 5, 3, 0, TAU); c.stroke(); }
    for (let i = 0; i < 3; i++) { const dx = bx + 6 + i * (bw - 12) / 3, dw = (bw - 12) / 3 - 4; c.fillStyle = '#4a2e18'; c.fillRect(dx, b - 22, dw, 22); c.fillStyle = '#7a5030'; c.fillRect(dx, b - 12, dw, 2); }
    if (tier < 2) { const p0 = bx + bw + 4, p1 = x + w - 2; fence(c, p0, p1, b, '#7a5230', 12); horse(c, (p0 + p1) / 2 + 2, b - 2, -1, '#e8e0d0', '#8a8078'); horse(c, (p0 + p1) / 2 - 16, b - 4, 1, '#7a4a26'); }
  },
  dw7(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, M = marbleA(A);
    if (tier >= 2) { const sw = 22, st2 = b - h - 6; wallRect(c, M, cx - sw / 2, st2 + 24, sw, b - st2 - 60); cone(c, PAL.marble, cx, st2 + 24, sw, 30); circ(c, cx, st2 - 12, 8, PAL.gold); fx.glows.push([cx, st2 - 12, 26, '#ffe890']); }
    c.fillStyle = PAL.marbleD; c.fillRect(x + 8, b - 6, w - 16, 6); c.fillStyle = PAL.marble; c.fillRect(x + 16, b - 11, w - 32, 5);
    const pw = 14, ph = h * 0.6, py = b - 11 - ph, ix0 = cx - 22, ix1 = cx + 22;
    const gl = c.createRadialGradient(cx, py + ph * 0.55, 4, cx, py + ph * 0.55, 34); gl.addColorStop(0, '#fffbe8'); gl.addColorStop(0.5, '#ffe89a'); gl.addColorStop(1, '#e0b84a');
    c.fillStyle = gl; c.beginPath(); c.moveTo(ix0, b - 11); c.lineTo(ix0, py + 22); c.arc(cx, py + 22, 22, Math.PI, 0); c.lineTo(ix1, b - 11); c.closePath(); c.fill();
    fx.glows.push([cx, py + ph * 0.55, 48, '#fff0b0']);
    wallRect(c, M, ix0 - pw, py, pw, ph); wallRect(c, M, ix1, py, pw, ph);
    c.strokeStyle = PAL.marble; c.lineWidth = 8; c.beginPath(); c.arc(cx, py + 22, 26, Math.PI, 0); c.stroke();
    c.strokeStyle = PAL.gold; c.lineWidth = 2; c.beginPath(); c.arc(cx, py + 22, 30.5, Math.PI, 0); c.stroke();
    for (const [sx, d] of [[ix0 - pw / 2, -1], [ix1 + pw / 2, 1]]) {
      c.fillStyle = PAL.marble; c.fillRect(sx - 3, py - 16, 6, 16); circ(c, sx, py - 19, 3.5, PAL.marble);
      c.beginPath(); c.moveTo(sx, py - 14); c.lineTo(sx + d * 12, py - 30); c.lineTo(sx + d * 6, py - 8); c.closePath(); c.fill();
    }
  },
};
// --- Knieja ---
const SYLVAN_ART = {
  hall(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, th = h * (0.62 + tier * 0.08), tw = 16 + tier * 3;
    trunk(c, cx, b - 10, tw, th); canopy(c, cx, b - th - 4, 28 + tier * 6, tier === 4 ? '#c8a838' : '#4a8a3a', 11);
    if (tier >= 3) { c.fillStyle = '#6a4a2c'; c.fillRect(cx - 32, b - th + 20, 64, 4); c.fillRect(cx - 30, b - th + 24, 2, 12); c.fillRect(cx + 28, b - th + 24, 2, 12); archWin(c, cx - 22, b - th + 10, 6, 8, A.glow, fx); archWin(c, cx + 16, b - th + 10, 6, 8, A.glow, fx); }
    if (tier >= 2) for (const side of [0, 1]) { const ww = w * 0.28, wx = side ? x + w - ww : x; wallRect(c, A, wx, b - h * 0.34, ww, h * 0.34); roofArt(c, A, A.roof.dw, wx, b - h * 0.34, ww, h * 0.16); archWin(c, wx + ww / 2 - 3.5, b - h * 0.25, 7, 10, A.glow, fx); }
    const bw = w * 0.46, bx = cx - bw / 2, top = b - h * 0.38; wallRect(c, A, bx, top, bw, h * 0.38); roofArt(c, A, A.roof.hall, bx, top, bw, h * 0.18);
    for (const wx of [bx + 7, bx + bw - 15]) archWin(c, wx, top + 12, 8, 12, A.glow, fx);
    doorArt(c, A, cx - 9, b, 18, 24); bannerArt(c, cx + tw / 2 + 8, b - th * 0.62, col);
  },
  fort(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, P = planksA(A);
    if (tier >= 2) {
      const th = h * (tier >= 3 ? 1.05 : 0.82); trunk(c, cx - 6, b - 12, 24, th); canopy(c, cx - 6, b - th - 4, tier >= 3 ? 42 : 30, '#3e7a34', 7);
      if (tier >= 3) { c.fillStyle = '#6a4a2c'; for (const py of [b - th * 0.55, b - th * 0.82]) { c.fillRect(cx - 36, py, 60, 4); archWin(c, cx - 30, py - 12, 6, 9, A.glow, fx); archWin(c, cx + 14, py - 12, 6, 9, A.glow, fx); } bannerArt(c, cx - 6, b - th - 44, col); }
      else bannerArt(c, cx - 6, b - th - 30, col);
    }
    const wy = b - h * 0.38;
    for (let px = x + 12, i = 0; px < x + w - 12; px += 6, i++) { c.fillStyle = i % 2 ? '#7a5530' : '#664626'; c.beginPath(); c.moveTo(px, b); c.lineTo(px, wy + 4); c.lineTo(px + 3, wy - 4); c.lineTo(px + 6, wy + 4); c.lineTo(px + 6, b); c.closePath(); c.fill(); }
    c.fillStyle = '#4a3018'; c.fillRect(x + 12, wy + 14, w - 24, 3); c.fillRect(x + 12, b - 10, w - 24, 3);
    for (const tx of [x, x + w - 30]) { const tt = b - h * (tier >= 3 ? 0.66 : 0.56); wallRect(c, P, tx, tt, 30, b - tt); roofArt(c, A, A.roof.wall, tx, tt, 30, 20); archWin(c, tx + 11, tt + 12, 8, 10, A.glow, fx); }
    c.fillStyle = '#2a1a0c'; c.beginPath(); c.moveTo(cx - 12, b); c.lineTo(cx - 12, b - 18); c.arc(cx, b - 18, 12, Math.PI, 0); c.lineTo(cx + 12, b); c.closePath(); c.fill();
    c.strokeStyle = '#6ab84a'; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, b - 18, 14.5, Math.PI, 0); c.stroke();
  },
  guild(c, A, s, tier, col, fx) {
    const { x, b, w } = s, cx = x + w / 2, n = 4 + tier * 2, pts = [];
    c.fillStyle = '#5a8a4a'; c.beginPath(); c.ellipse(cx, b - 5, w * 0.46, 10, 0, 0, TAU); c.fill();
    fx.glows.push([cx, b - 16, 30 + tier * 6, '#9af0c0']);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push([cx + Math.cos(a) * w * 0.4, b - 5 + Math.sin(a) * 8, Math.sin(a)]); }
    pts.sort((p, q) => p[2] - q[2]);
    const altar = () => {
      c.fillStyle = '#6a6a64'; c.fillRect(cx - 9, b - 13, 18, 8);
      if (tier >= 2) { trunk(c, cx, b - 13, 6, 22 + tier * 6, '#8a7a5a'); canopy(c, cx, b - 40 - tier * 6, 11 + tier * 3, '#7ad890', 5); }
      circ(c, cx, b - 17, 3, '#d8fff0'); fx.wins.push([cx - 3, b - 20, 6, 6, '#b8ffd8']);
    };
    let done = false; for (const [px, py, d] of pts) { if (d >= 0 && !done) { altar(); done = true; } menhir(c, px, py, 9, 20 + tier * 5 + (d < 0 ? -4 : 3)); } if (!done) altar();
  },
  tavern(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w * 0.42, sw = w * 0.62, sh = h * 0.6;
    c.fillStyle = '#8a6038'; c.fillStyle = '#4e3418';
    const g = c.createLinearGradient(cx - sw / 2, 0, cx + sw / 2, 0); g.addColorStop(0, '#8a6038'); g.addColorStop(1, '#4e3418'); c.fillStyle = g;
    c.beginPath(); c.moveTo(cx - sw / 2 - 9, b); c.quadraticCurveTo(cx - sw / 2, b - sh * 0.3, cx - sw / 2 + 2, b - sh); c.lineTo(cx + sw / 2 - 2, b - sh); c.quadraticCurveTo(cx + sw / 2, b - sh * 0.3, cx + sw / 2 + 9, b); c.closePath(); c.fill();
    c.fillStyle = '#4a3018'; c.fillRect(cx + sw * 0.2, b - sh - h * 0.3, 7, h * 0.3); fx.smokes.push([cx + sw * 0.2 + 3.5, b - sh - h * 0.31]);
    roofArt(c, A, '#b0603a', cx - sw / 2 - 2, b - sh + 2, sw + 4, h * 0.3);
    for (let i = 0; i < 5; i++) circ(c, cx - sw * 0.35 + i * sw * 0.18, b - sh - h * 0.14 + (i % 2) * 4, 2, '#f0e6c8');
    archWin(c, cx - sw * 0.35, b - sh * 0.62, 8, 10, A.glow, fx); archWin(c, cx + sw * 0.18, b - sh * 0.62, 8, 10, A.glow, fx);
    doorArt(c, A, cx - 8, b, 16, 20);
    c.strokeStyle = '#2a1a0e'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + sw / 2, b - sh * 0.75); c.lineTo(cx + sw / 2 + 16, b - sh * 0.75); c.stroke();
    c.fillStyle = '#7a5430'; rr(c, cx + sw / 2 + 4, b - sh * 0.72, 16, 13, 2); c.fill(); drawEmblem(c, 'mug', cx + sw / 2 + 12, b - sh * 0.72 + 6.5, 10, '#f4e2a8');
    barrel(c, x + w - 8, b); barrel(c, x + w - 20, b);
  },
  market(c, A, s, tier, col, fx) {
    c.fillStyle = '#8a7a5a'; c.beginPath(); c.ellipse(s.x + s.w / 2, s.b - 5, s.w / 2, 9, 0, 0, TAU); c.fill();
    stalls(c, s, [['#4a8a3a', '#d8c878'], ['#8a5a2a', '#e8d8a0'], ['#3a7a6a', '#d8e8c0']], ['#d83a2a', '#f0c040', '#8ac04a', '#e87a2a', '#b85ad8'], '#4a3018');
    crate(c, s.x + s.w - 6, s.b, 10); barrel(c, s.x + 8, s.b + 1);
  },
  smith(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s; rockMound(c, x + 2, b, w * 0.7, h * 0.78, '#6a6a5c', 5);
    c.fillStyle = '#140c06'; c.beginPath(); c.ellipse(x + w * 0.37, b - 1, 14, 18, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#ff8a2a'; c.fillRect(x + w * 0.37 - 8, b - 7, 16, 6); circ(c, x + w * 0.37, b - 8, 5, '#ffc050'); fx.glows.push([x + w * 0.37, b - 10, 22, '#ff9a3a']);
    fx.smokes.push([x + w * 0.5, b - h * 0.72]);
    c.fillStyle = '#5a3c20'; c.fillRect(x + w * 0.62, b - 30, 3, 30); c.fillRect(x + w - 6, b - 26, 3, 26); roofArt(c, A, '#6a8a3a', x + w * 0.6, b - 30, w * 0.4, 10);
    drawEmblem(c, 'anvil', x + w * 0.8, b - 7, 16, '#40404a');
  },
  silo(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.62, top = b - h * 0.56;
    wallRect(c, planksA(A), x + 2, top, bw, h * 0.56); roofArt(c, A, A.roof.util, x + 2, top, bw, h * 0.3);
    c.fillStyle = '#3a2410'; c.fillRect(x + 2 + bw / 2 - 9, b - 22, 18, 22);
    for (const [lx, ly] of [[x + w - 18, b - 5], [x + w - 7, b - 5], [x + w - 12.5, b - 14]]) { circ(c, lx, ly, 5.5, '#8a5a32'); circ(c, lx, ly, 3.2, '#d8a86a'); }
    c.fillStyle = '#a07840'; c.beginPath(); c.ellipse(x + bw + 2, b - 6, 7, 6, 0, 0, TAU); c.fill(); for (let i = 0; i < 3; i++) circ(c, x + bw - 1 + i * 3, b - 10, 2, '#e8a030');
  },
  dw1(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2;
    for (const [dx, hh, sd] of [[-w * 0.3, 0.8, 1], [w * 0.3, 0.72, 2], [0, 0.95, 3]]) { trunk(c, cx + dx, b - 4, 7, h * hh * 0.7, '#8a7050'); canopy(c, cx + dx, b - h * hh * 0.72, 14, tier >= 2 ? '#e8a0c0' : '#6ab84a', sd); }
    c.fillStyle = '#6a4a2c'; c.fillRect(cx - 12, b - 26, 3, 26); c.fillRect(cx + 9, b - 26, 3, 26); c.beginPath(); c.moveTo(cx - 15, b - 26); c.quadraticCurveTo(cx, b - 36, cx + 15, b - 26); c.lineTo(cx + 15, b - 23); c.quadraticCurveTo(cx, b - 32, cx - 15, b - 23); c.closePath(); c.fill();
    fx.glows.push([cx, b - 14, 18, '#b8ffb0']); for (let i = 0; i < 6; i++) circ(c, cx - 20 + i * 8, b - 3, 1.8, tier >= 2 ? '#f8d0e8' : '#f0e070');
  },
  dw2(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, top = b - h * (tier >= 2 ? 0.9 : 0.75);
    c.fillStyle = '#5a3c20'; for (const dx of [-12, 10]) { c.save(); c.translate(cx + dx, b); c.rotate(dx < 0 ? 0.06 : -0.06); c.fillRect(-1.5, -(b - top) + 8, 3, b - top - 8); c.restore(); }
    c.strokeStyle = '#4a3018'; c.lineWidth = 1.5; c.beginPath(); for (let y2 = b - 10; y2 > top + 20; y2 -= 16) { c.moveTo(cx - 12, y2); c.lineTo(cx + 10, y2 - 12); } c.stroke();
    const plat = (py, pw) => { wallRect(c, planksA(A), cx - pw / 2, py, pw, 12); roofArt(c, A, A.roof.dw, cx - pw / 2, py, pw, 14); archWin(c, cx - 3, py + 3, 6, 6, A.glow, fx); };
    if (tier >= 2) plat(top + 30, 26); plat(top + 10, 34); bannerArt(c, cx + 16, top - 4, col);
  },
  dw3(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, tent = (tx, th) => { c.fillStyle = '#a07a50'; c.beginPath(); c.moveTo(tx - th * 0.55, b); c.lineTo(tx, b - th); c.lineTo(tx + th * 0.55, b); c.closePath(); c.fill(); c.fillStyle = '#6a4a2c'; c.beginPath(); c.moveTo(tx, b - th); c.lineTo(tx + th * 0.55, b); c.lineTo(tx + 2, b); c.closePath(); c.fill(); c.fillStyle = '#2a1a0c'; c.beginPath(); c.moveTo(tx - 5, b); c.lineTo(tx, b - th * 0.4); c.lineTo(tx + 5, b); c.closePath(); c.fill(); c.strokeStyle = '#4a3018'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx - 3, b - th - 6); c.lineTo(tx + 4, b - th + 4); c.stroke(); };
    if (tier >= 2) { tent(x + w * 0.62, h * 0.62); bannerArt(c, x + w * 0.62, b - h * 0.62 - 26, col); }
    tent(x + w * 0.25, h * 0.7); fence(c, x + w * 0.45, x + w - 2, b, '#6a4a2a', 12); centaur(c, x + w * 0.72, b - 2, -1);
  },
  dw4(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2;
    for (const [dx, hh, sd] of [[-w * 0.32, 0.62, 21], [w * 0.3, 0.58, 22]]) { trunk(c, cx + dx, b - 4, 12, h * hh * 0.7, '#5a4028'); canopy(c, cx + dx, b - h * hh * 0.75, 20, '#2e6a2e', sd); }
    const th = h * (tier >= 2 ? 0.78 : 0.68); trunk(c, cx, b - 2, 22, th * 0.72, '#4a3220'); canopy(c, cx, b - th * 0.8, 26 + tier * 5, '#34702e', 23);
    circ(c, cx - 5, b - th * 0.45, 2.2, tier >= 2 ? '#a0ffb0' : '#e8d070'); circ(c, cx + 5, b - th * 0.45, 2.2, tier >= 2 ? '#a0ffb0' : '#e8d070'); fx.wins.push([cx - 7, b - th * 0.45 - 2, 14, 4, '#c0ff90']);
    c.strokeStyle = '#2a1a0c'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - 5, b - th * 0.36); c.quadraticCurveTo(cx, b - th * 0.32, cx + 5, b - th * 0.36); c.stroke();
  },
  dw5(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, ac = tier >= 2 ? '#c8d0dc' : '#8a8a80';
    c.fillStyle = '#6a9a4a'; c.beginPath(); c.ellipse(cx, b - 4, w * 0.48, 9, 0, 0, TAU); c.fill();
    menhir(c, cx - 22, b - 2, 11, 42, ac, '#d8f0ff'); menhir(c, cx + 22, b - 2, 11, 42, ac, '#d8f0ff'); c.fillStyle = ac; c.fillRect(cx - 30, b - 48, 60, 8); c.fillStyle = shadeHex(ac, -0.3); c.fillRect(cx - 30, b - 42, 60, 2);
    if (tier >= 2) fx.glows.push([cx, b - 24, 26, '#e0e8ff']);
    unicorn(c, cx + 2, b - 3, -1, tier >= 2 ? '#e0e6f0' : '#f4f0f8');
    for (let i = 0; i < 8; i++) circ(c, x + 6 + i * (w - 12) / 7, b - 3 - (i % 2) * 4, 1.8, ['#f0e070', '#e8a0c0', '#b0d8ff'][i % 3]);
  },
  dw6(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, top = b - h * 0.72;
    c.fillStyle = '#6a6458'; c.beginPath(); c.moveTo(cx - 16, b); c.lineTo(cx - 10, top + 20); c.lineTo(cx - 13, top + 4); c.lineTo(cx + 12, top); c.lineTo(cx + 10, top + 30); c.lineTo(cx + 17, b); c.closePath(); c.fill();
    c.fillStyle = '#48443c'; c.beginPath(); c.moveTo(cx + 2, b); c.lineTo(cx + 4, top + 6); c.lineTo(cx + 12, top); c.lineTo(cx + 10, top + 30); c.lineTo(cx + 17, b); c.closePath(); c.fill();
    c.fillStyle = '#6a4a28'; c.beginPath(); c.ellipse(cx, top, 20, 6, 0, 0, TAU); c.fill(); c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(cx - 18 + i * 5, top + 3); c.lineTo(cx - 15 + i * 4.5, top - 5); c.stroke(); }
    phoenixBird(c, cx, top - 6, tier >= 2 ? 1.25 : 1, fx);
    if (tier >= 2) for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#ffb040' : '#ff6a2a'; c.beginPath(); c.moveTo(cx - 14 + i * 9, top - 2); c.lineTo(cx - 10 + i * 9, top - 14 - (i % 2) * 6); c.lineTo(cx - 6 + i * 9, top - 2); c.closePath(); c.fill(); }
  },
  dw7(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, cc = tier >= 2 ? '#4ae8a0' : '#3ac870';
    rockMound(c, x, b, w, h * 0.9, '#5a6258', 9); canopy(c, x + w * 0.25, b - h * 0.62, 12, '#3a6a30', 31);
    c.fillStyle = '#0a1a10'; c.beginPath(); c.moveTo(cx - 20, b); c.lineTo(cx - 18, b - 22); c.quadraticCurveTo(cx, b - 44, cx + 18, b - 22); c.lineTo(cx + 20, b); c.closePath(); c.fill();
    fx.glows.push([cx, b - 18, 36, cc]); crystals(c, cx - 4, b - 1, 0.9, cc); crystals(c, x + w * 0.82, b - 2, tier >= 2 ? 1 : 0.7, cc);
    if (tier >= 2) { circ(c, cx - 7, b - 26, 2.2, '#f0ff60'); circ(c, cx + 7, b - 26, 2.2, '#f0ff60'); fx.wins.push([cx - 9, b - 28, 18, 4, '#f0ff60']); }
  },
};
// --- Kurhan ---
const BARROW_ART = {
  hall(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 2) for (const side of [0, 1]) { const ww = w * 0.27, wx = side ? x + w - ww : x, wt = b - h * 0.42; wallRect(c, A, wx, wt, ww, h * 0.42); archWin(c, wx + ww / 2 - 3.5, wt + 10, 7, 13, A.glow, fx); roofArt(c, A, A.roof.dw, wx, wt, ww, h * 0.3); }
    const bw = w * 0.5, bx = cx - bw / 2, top = b - h * 0.56; wallRect(c, A, bx, top, bw, h * 0.56);
    for (let i = 0; i < 3; i++) archWin(c, bx + bw * (0.2 + i * 0.3) - 4, top + 12, 8, 16, A.glow, fx);
    for (const px of [cx - 26, cx + 20]) { c.fillStyle = shadeHex(A.wall[0], 0.1); c.fillRect(px, top + 34, 6, b - top - 36); }
    doorArt(c, A, cx - 9, b, 18, 26); skullAt(c, cx, b - 32, 1.1);
    if (tier >= 3) { c.fillStyle = '#3a2a58'; c.beginPath(); c.ellipse(cx, top - 1, 24, 22, 0, Math.PI, 0); c.closePath(); c.fill(); c.fillStyle = 'rgba(160,255,170,.5)'; c.fillRect(cx - 12, top - 12, 3, 8); c.fillRect(cx + 9, top - 12, 3, 8); fx.glows.push([cx, top - 14, 30, '#a6f0a8']); }
    else roofArt(c, A, A.roof.hall, bx, top, bw, h * 0.34);
    if (tier === 4) for (const px of [bx - 6, bx + bw - 6]) { wallRect(c, A, px, top - 26, 12, 30); roofArt(c, A, A.roof.hall, px, top - 26, 12, 30); }
    bannerArt(c, cx, top - (tier >= 3 ? 50 : h * 0.34 + 18), col);
  },
  fort(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 2) { const big = tier >= 3, kw = big ? 60 : 50, kh = h * (big ? 1.02 : 0.84), kx = cx - kw / 2 - 6, kt = b - kh; wallRect(c, A, kx, kt, kw, kh - 16); for (let r = 0; r < (big ? 3 : 2); r++) archWin(c, kx + kw / 2 - 4, kt + 10 + r * 20, 8, 13, A.glow, fx); roofArt(c, A, A.roof.wall, kx, kt, kw, big ? 50 : 32); bannerArt(c, kx + kw / 2, kt - (big ? 72 : 52), col); }
    const wh = h * 0.36, wy = b - wh; wallRect(c, A, x + 14, wy, w - 28, wh);
    c.fillStyle = '#2a2632'; for (let px = x + 16; px < x + w - 16; px += 10) { c.beginPath(); c.moveTo(px, wy); c.lineTo(px + 3, wy - 9); c.lineTo(px + 6, wy); c.closePath(); c.fill(); }
    for (const tx of [x, x + w - 30]) { const th = h * (tier >= 3 ? 0.66 : 0.56); wallRect(c, A, tx, b - th, 30, th); archWin(c, tx + 11, b - th + 14, 8, 12, A.glow, fx); roofArt(c, A, A.roof.wall, tx, b - th, 30, 30); }
    c.fillStyle = '#0a0810'; c.beginPath(); c.moveTo(cx - 11, b); c.lineTo(cx - 11, b - 18); c.lineTo(cx, b - 28); c.lineTo(cx + 11, b - 18); c.lineTo(cx + 11, b); c.closePath(); c.fill(); skullAt(c, cx, b - 34, 1);
  },
  guild(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, tw = w * 0.5, th = h * (0.46 + Math.min(tier, 3) * 0.1 + Math.max(0, tier - 3) * 0.05), top = b - th;
    wallRect(c, A, cx - tw / 2, top, tw, th); c.fillStyle = shadeHex(A.wall[1], -0.2); for (let i = 1; i <= tier; i++) c.fillRect(cx - tw / 2 - 2, top + i * th / (tier + 1), tw + 4, 3);
    for (let i = 0; i <= tier; i++) archWin(c, cx - 4, top + 8 + i * th / (tier + 1), 8, 12, '#a6f0a8', fx);
    doorArt(c, A, cx - 7, b, 14, 18);
    c.fillStyle = '#2a2632'; c.fillRect(cx - tw / 2 - 4, top - 6, tw + 8, 6); c.fillRect(cx - 6, top - 12, 12, 6);
    for (let i = 0; i < 3; i++) { c.fillStyle = i === 1 ? '#c8ffb0' : '#5ae070'; c.beginPath(); c.moveTo(cx - 7 + i * 5, top - 12); c.lineTo(cx - 5 + i * 5, top - 26 - (i === 1 ? 8 : 0)); c.lineTo(cx - 2 + i * 5, top - 12); c.closePath(); c.fill(); }
    fx.glows.push([cx, top - 18, 30, '#80ff90']); for (const dx of [-tw / 2 - 2, tw / 2 + 2]) skullAt(c, cx + dx, top - 8, 0.7);
  },
  tavern(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.7, bx = x + 4, top = b - h * 0.6;
    c.save(); c.translate(bx + bw / 2, b); c.rotate(-0.03); c.translate(-(bx + bw / 2), -b);
    c.fillStyle = '#4a4450'; c.fillRect(bx, b - h * 0.26, bw, h * 0.26);
    c.fillStyle = '#6a6070'; c.fillRect(bx, top, bw, h * 0.34); c.strokeStyle = '#1a1420'; c.lineWidth = 2.5; c.strokeRect(bx, top, bw, h * 0.34); c.beginPath(); c.moveTo(bx, top); c.lineTo(bx + bw / 3, top + h * 0.34); c.moveTo(bx + bw, top); c.lineTo(bx + bw * 2 / 3, top + h * 0.34); c.stroke();
    archWin(c, bx + 8, b - h * 0.21, 8, 11, '#c8ff90', fx); winArt(c, A, bx + bw - 18, top + 8, 8, 9, fx);
    doorArt(c, A, bx + bw / 2 - 8, b, 16, 20); roofArt(c, A, '#2c2638', bx, top, bw, h * 0.36);
    c.fillStyle = '#2a2632'; c.fillRect(bx + bw * 0.72, top - h * 0.3, 7, h * 0.3); fx.smokes.push([bx + bw * 0.72 + 3.5, top - h * 0.31]);
    c.restore();
    c.fillStyle = '#101018'; c.beginPath(); c.ellipse(bx + bw * 0.3, top - h * 0.22, 5, 3, 0, 0, TAU); c.fill(); circ(c, bx + bw * 0.3 + 4, top - h * 0.24, 2, '#101018'); c.fillStyle = '#e0a030'; c.fillRect(bx + bw * 0.3 + 6, top - h * 0.245, 3, 1.2);
    c.strokeStyle = '#1a1420'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + bw, top + 12); c.lineTo(bx + bw + 16, top + 12); c.stroke();
    c.fillStyle = '#3a3040'; rr(c, bx + bw + 4, top + 15, 16, 13, 2); c.fill(); drawEmblem(c, 'mug', bx + bw + 12, top + 21.5, 10, '#c8ff90');
    coffin(c, x + w - 8, b, 0.9);
  },
  market(c, A, s, tier, col, fx) {
    c.fillStyle = '#4a4452'; c.beginPath(); c.ellipse(s.x + s.w / 2, s.b - 5, s.w / 2, 9, 0, 0, TAU); c.fill();
    stalls(c, s, [['#4a2a5a', '#2a2030'], ['#5a2a2a', '#302028'], ['#2a4a3a', '#202a26']], ['#e0d8c4', '#a6f0a8', '#8a3a8a', '#d0c040', '#6a6a7a'], '#1e1824');
    for (const dx of [12, s.w - 14]) { c.fillStyle = '#e8e0c8'; c.fillRect(s.x + dx - 1.5, s.b - 12, 3, 8); circ(c, s.x + dx, s.b - 14, 2, '#c8ff90'); fx.wins.push([s.x + dx - 2, s.b - 16, 4, 4, '#c8ff90']); }
  },
  smith(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.72, top = b - h * 0.6; wallRect(c, A, x + 2, top, bw, h * 0.6);
    c.fillStyle = '#08060c'; c.fillRect(x + 10, b - h * 0.42, bw * 0.56, h * 0.42);
    const gx = x + 10 + bw * 0.28; c.fillStyle = '#40d060'; c.fillRect(gx - 8, b - 7, 16, 6); circ(c, gx, b - 8, 5, '#a0ff90'); fx.glows.push([gx, b - 10, 22, '#60ff70']);
    roofArt(c, A, A.roof.util, x + 2, top, bw, h * 0.3); c.fillStyle = '#2a2632'; c.fillRect(x + bw * 0.72, top - h * 0.32, 8, h * 0.32); fx.smokes.push([x + bw * 0.72 + 4, top - h * 0.33]);
    drawEmblem(c, 'anvil', x + w - 10, b - 7, 16, '#50505a'); c.strokeStyle = '#6a6a74'; c.lineWidth = 1.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x + bw + 2, top + 8 + i * 5, 2, 0, TAU); c.stroke(); }
  },
  silo(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.6, top = b - h * 0.5; wallRect(c, A, x + 2, top, bw, h * 0.5); roofArt(c, A, A.roof.util, x + 2, top, bw, h * 0.34);
    doorArt(c, A, x + 2 + bw / 2 - 8, b, 16, 20); coffin(c, x + w - 16, b, 1); coffin(c, x + w - 6, b, 0.9); coffin(c, x + w - 11, b - 19, 0.8);
  },
  dw1(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.6, bx = x + 4, top = b - h * 0.58;
    if (tier >= 2) ribs(c, x + w * 0.58, b, w * 0.4, h * 0.7);
    wallRect(c, A, bx, top, bw, h * 0.58); roofArt(c, A, A.roof.dw, bx, top, bw, h * 0.34);
    for (let i = 0; i < 4; i++) skullAt(c, bx + 8 + i * (bw - 16) / 3, top + 8, 0.6);
    doorArt(c, A, bx + bw / 2 - 7, b, 14, 20);
    c.fillStyle = '#e0d8c4'; for (let i = 0; i < 5; i++) { c.save(); c.translate(x + w - 18 + (i % 3) * 5, b - 2 - Math.floor(i / 3) * 4); c.rotate(i * 0.7); c.fillRect(-5, -1, 10, 2); c.restore(); } skullAt(c, x + w - 12, b - 12, 0.7);
  },
  dw2(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s; const rg = mulberry32(55);
    if (tier >= 2) { propArt(c, 'barrow', 'tree', x + w * 0.8, b - 6, rg, fx); fx.glows.push([x + w * 0.45, b - 10, 34, '#90ff80']); }
    for (let i = 0; i < 5; i++) propArt(c, 'barrow', 'grave', x + 12 + i * (w - 24) / 4, b - 8 - (i % 2) * 5, rg, fx);
    c.fillStyle = '#3a3040'; c.beginPath(); c.ellipse(x + w * 0.45, b - 3, 12, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#0a0810'; c.beginPath(); c.ellipse(x + w * 0.45, b - 4, 7, 2.2, 0, 0, TAU); c.fill();
    propArt(c, 'barrow', 'fence', x + 2, b, rg, fx); propArt(c, 'barrow', 'fence', x + w - 34, b, rg, fx);
  },
  dw3(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.62, bx = x + 6, top = b - h * 0.5;
    if (tier >= 2) { const tx = x + w - 30, tt = b - h * 0.95; wallRect(c, A, tx, tt, 26, b - tt); c.fillStyle = '#0a0810'; c.beginPath(); c.moveTo(tx, tt); c.lineTo(tx + 8, tt - 10); c.lineTo(tx + 14, tt - 2); c.lineTo(tx + 20, tt - 12); c.lineTo(tx + 26, tt); c.closePath(); c.fill(); archWin(c, tx + 9, tt + 16, 8, 14, '#c8d8f0', fx); ghost(c, tx - 6, tt + 20, 0.9); }
    wallRect(c, A, bx, top, bw, h * 0.5);
    c.fillStyle = '#0a0810'; c.beginPath(); c.moveTo(bx + bw * 0.55, top); c.lineTo(bx + bw * 0.7, top + 10); c.lineTo(bx + bw * 0.8, top + 2); c.lineTo(bx + bw, top + 14); c.lineTo(bx + bw, top); c.closePath(); c.fill();
    roofArt(c, A, A.roof.dw, bx, top, bw * 0.6, h * 0.36);
    c.fillStyle = '#1a1424'; c.beginPath(); c.moveTo(bx + bw / 2 - 7, top + 30); c.lineTo(bx + bw / 2 - 7, top + 14); c.lineTo(bx + bw / 2, top + 6); c.lineTo(bx + bw / 2 + 7, top + 14); c.lineTo(bx + bw / 2 + 7, top + 30); c.closePath(); c.fill(); fx.wins.push([bx + bw / 2 - 5, top + 10, 10, 18, '#8ab0ff']);
    doorArt(c, A, bx + bw / 2 - 7, b, 14, 18); ghost(c, bx + bw + 6, b - 20, 1.1);
  },
  dw4(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, bw = w * (tier >= 2 ? 0.8 : 0.66), bx = cx - bw / 2, top = b - h * 0.5;
    c.fillStyle = shadeHex(A.wall[1], -0.2); c.fillRect(bx - 4, b - 6, bw + 8, 6); c.fillRect(bx, b - 10, bw, 4);
    wallRect(c, A, bx, top, bw, h * 0.5 - 10);
    c.fillStyle = shadeHex(A.wall[0], 0.12); for (let i = 0; i < 4; i++) c.fillRect(bx + 6 + i * (bw - 18) / 3, top + 4, 6, h * 0.5 - 16);
    c.fillStyle = A.wall[0]; c.beginPath(); c.moveTo(bx - 4, top); c.lineTo(cx, top - h * 0.24); c.lineTo(bx + bw + 4, top); c.closePath(); c.fill(); skullAt(c, cx, top - 8, 0.8);
    c.fillStyle = '#0a0810'; c.fillRect(cx - 8, b - 30, 16, 20);
    if (tier >= 2) { circ(c, cx - 3, b - 24, 1.4, '#ff3030'); circ(c, cx + 3, b - 24, 1.4, '#ff3030'); fx.wins.push([cx - 5, b - 26, 10, 4, '#ff5050']); for (const px of [bx - 8, bx + bw + 8]) { c.fillStyle = '#5a5664'; c.fillRect(px - 3, b - 26, 6, 26); c.beginPath(); c.moveTo(px - 3, b - 26); c.lineTo(px - 10, b - 34); c.lineTo(px, b - 30); c.lineTo(px + 10, b - 34); c.lineTo(px + 3, b - 26); c.closePath(); c.fill(); } }
  },
  dw5(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, cx = x + w / 2, tw = w * 0.46, top = b - h * 0.78;
    if (tier >= 2) { const lw = w * 0.42; wallRect(c, A, x, b - h * 0.36, lw, h * 0.36); roofArt(c, A, A.roof.dw, x, b - h * 0.36, lw, h * 0.22); for (let i = 0; i < 3; i++) { c.fillStyle = ['#6a2a2a', '#2a3a5a', '#3a5a2a'][i]; c.fillRect(x + 6 + i * 6, b - 16, 5, 12); } archWin(c, x + lw - 14, b - h * 0.28, 7, 10, '#a6f0a8', fx); }
    wallRect(c, A, cx - tw / 2, top, tw, b - top); for (let i = 0; i < 3; i++) archWin(c, cx - 4, top + 12 + i * 24, 8, 13, '#a6f0a8', fx);
    doorArt(c, A, cx - 7, b, 14, 18); roofArt(c, A, A.roof.tower, cx - tw / 2, top, tw, 30);
    circ(c, cx, top - 36, 6, '#8aff90'); circ(c, cx - 1.5, top - 37.5, 2, '#e8fff0'); fx.glows.push([cx, top - 36, 28, '#80ff90']);
  },
  dw6(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s, bw = w * 0.54, bx = x + 2, top = b - h * 0.58;
    wallRect(c, A, bx, top, bw, h * 0.58); roofArt(c, A, A.roof.dw, bx, top, bw, h * 0.36);
    for (let i = 0; i < 3; i++) { const dx = bx + 6 + i * (bw - 12) / 3, dw = (bw - 12) / 3 - 4; c.fillStyle = '#0a0810'; c.fillRect(dx, b - 22, dw, 22); }
    const p0 = bx + bw + 4, p1 = x + w - 2; c.fillStyle = '#1e1a24'; for (let px = p0; px <= p1; px += 8) { c.fillRect(px - 1, b - 14, 2.5, 14); c.beginPath(); c.moveTo(px - 1.5, b - 14); c.lineTo(px + 0.3, b - 19); c.lineTo(px + 2, b - 14); c.fill(); } c.fillRect(p0 - 1, b - 10, p1 - p0 + 3, 2);
    horse(c, (p0 + p1) / 2, b - 2, -1, '#1a1620', '#3a2a3a'); circ(c, (p0 + p1) / 2 - 16, b - 21, 1.2, '#ff3030'); fx.wins.push([(p0 + p1) / 2 - 18, b - 23, 4, 4, '#ff4040']);
    if (tier >= 2) for (const px of [bx + 4, bx + bw - 4]) { bannerArt(c, px, top - h * 0.36 - 14, col); skullAt(c, px, top + 6, 0.6); }
  },
  dw7(c, A, s, tier, col, fx) {
    const { x, b, w, h } = s; rockMound(c, x, b, w, h * 0.7, '#3e3a46', 13);
    ribs(c, x + w * 0.2, b - h * 0.2, w * 0.6, h * 0.7); c.save(); c.translate(x + w * 0.84, b - h * 0.62); c.scale(1.8, 1.8); skullAt(c, 0, 0, 1.2); c.restore();
    c.strokeStyle = '#e0d8c4'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w * 0.2, b - h * 0.22); c.lineTo(x + w * 0.08, b - h * 0.5); c.stroke();
    if (tier >= 2) { fx.glows.push([x + w * 0.5, b - h * 0.5, 44, '#9ab8ff']); ghost(c, x + w * 0.45, b - h * 0.55, 1.1); }
  },
};
const BUILD_ART = { haven: HAVEN_ART };
BUILD_ART.sylvan = SYLVAN_ART;
 
BUILD_ART.barrow = BARROW_ART;
// --- rekwizyty dodatkowe ---
const PROP_BOX = { giant: [-110, -300, 220, 310] };
function extraProp(c, fac, kind, x, b, r, fx) {
  if (kind === 'giant') { trunk(c, x, b, 44, 190, '#5a4028'); c.strokeStyle = '#4a3220'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 30, b); c.quadraticCurveTo(x - 50, b - 4, x - 64, b + 2); c.moveTo(x + 30, b); c.quadraticCurveTo(x + 48, b - 3, x + 60, b + 3); c.stroke(); canopy(c, x, b - 200, 70, '#2e5a2a', 77); canopy(c, x - 40, b - 170, 40, '#346430', 78); canopy(c, x + 44, b - 176, 42, '#2a5226', 79); return true; }
  if (kind === 'rock') { rockMound(c, x - 14, b, 28, 16, '#6a6660', 2); return true; }
  if (kind === 'fern') { c.strokeStyle = '#4a8a3a'; c.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x, b); c.quadraticCurveTo(x + i * 4, b - 12, x + i * 7, b - 8 + Math.abs(i)); c.stroke(); } return true; }
  if (kind === 'bones') { c.fillStyle = '#e0d8c4'; for (let i = 0; i < 4; i++) { c.save(); c.translate(x - 6 + i * 4, b - 2); c.rotate(i * 0.8); c.fillRect(-5, -1, 10, 2); c.restore(); } skullAt(c, x + 6, b - 5, 0.6); return true; }
  return false;
}
// Świat: X = położenie w poziomie (w pikselach dla Z=1), Z = odległość (1 = blisko), e = wysokość nad ziemią.
const PJ = { hor: 94, d: 282, cx: 296 };
const PJ_BASE = { hor: 94, d: 282 };
function usePJ(L) { const p = (L && L.pj) || PJ_BASE; PJ.hor = p.hor; PJ.d = p.d; }
function proj(X, Z, e = 0) { const s = 1 / Z; return [PJ.cx + X * s, PJ.hor + PJ.d * s - e * s, s]; }
const hazeAt = Z => clamp((Z - 1.05) * 0.42, 0, 0.6);
const TOWN_ART_SCALE = 0.5;
// Rysuje obiekt jako pikselowy sprite w skali perspektywy (twarde krawędzie, obrys, mgła oddalenia)
function drawObj(dst, draw, box, anchor, sx, sy, sc, haze, hazeCol, fx) {
  const [bx0, by0, bw, bh] = box, R = TOWN_ART_SCALE * sc, cw = Math.ceil(bw * R) + 2, ch = Math.ceil(bh * R) + 2;
  const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d', { willReadFrequently: true }); c._ctx = g;
  g.setTransform(R, 0, 0, R, 1 - bx0 * R, 1 - by0 * R);
  const t = { wins: [], smokes: [], glows: [], flags: [] }, prev = CUR_FX, colors = []; CUR_FX = t; draw(recordingCtx(g, colors), t); CUR_FX = prev;
  crispify(c, colors, OUTLINE);
  if (haze > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = haze; g.fillStyle = hazeCol; g.fillRect(0, 0, cw, ch); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  const k = sc / R, dx = Math.round((sx - (anchor[0] - bx0) * sc - k) * TOWN_ART_SCALE) / TOWN_ART_SCALE, dy = Math.round((sy - (anchor[1] - by0) * sc - k) * TOWN_ART_SCALE) / TOWN_ART_SCALE;
  dst.drawImage(c, dx, dy, cw * k, ch * k);
  const T = (x, y) => [dx + k + (x - bx0) * sc, dy + k + (y - by0) * sc];
  for (const [x, y, w, h, col] of t.wins) { const [X, Y] = T(x, y); fx.wins.push([X, Y, w * sc, h * sc, col]); }
  for (const [x, y] of t.smokes) { const [X, Y] = T(x, y); fx.smokes.push([X, Y, sc]); }
  for (const [x, y, r, col] of t.glows) { const [X, Y] = T(x, y); fx.glows.push([X, Y, r * sc, col]); }
  for (const [x, y, col] of t.flags) { const [X, Y] = T(x, y); fx.flags.push([X, Y, col, sc]); }
}
// wstęga (droga, rzeka) w perspektywie: pts = [[X, Z, e, szerokość], ...]
function subdiv(pts, n) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) { const f = k / n, a = pts[i], b = pts[i + 1]; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * f, a[3] && b[3] ? a[3] + (b[3] - a[3]) * f : (a[3] || b[3])]); }
  out.push(pts[pts.length - 1]); return out;
}
function ribbon(pts, width) {
  const L = [], R = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = (b[1] - a[1]) * 300, len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len, w = (p[3] || width) / 2;
    L.push(proj(p[0] + nx * w, p[1] + nz * w / 300, p[2] || 0)); R.push(proj(p[0] - nx * w, p[1] - nz * w / 300, p[2] || 0));
  });
  return [L, R];
}
function ribbonPath(c, L, R) { c.beginPath(); L.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); }
// --- niebo, góry, las na horyzoncie, ziemia, wzgórza ---
function cloudBank(c, cx, cy, w, h, dark, lit, r) {
  const puffs = []; for (let i = 0; i < 8; i++) puffs.push([cx + (r() - 0.5) * w, cy + (r() - 0.5) * h * 0.6, w * (0.16 + r() * 0.15), h * (0.45 + r() * 0.4)]);
  c.fillStyle = lit; for (const [x, y, rx, ry] of puffs) { c.beginPath(); c.ellipse(x - 4, y + 4, rx, ry, 0, 0, TAU); c.fill(); }
  c.fillStyle = dark; for (const [x, y, rx, ry] of puffs) { c.beginPath(); c.ellipse(x + 1, y - 1, rx, ry, 0, 0, TAU); c.fill(); }
}
function skyDramatic(c, P) {
  const g = c.createLinearGradient(0, 8, 0, 190); g.addColorStop(0, P.top); g.addColorStop(0.55, P.mid); g.addColorStop(1, P.hor); c.fillStyle = g; c.fillRect(8, 8, 576, 432);
  const [sx, sy] = P.sun, sg = c.createRadialGradient(sx, sy, 4, sx, sy, 240);
  if (P.stars) { const q = mulberry32(88); for (let i = 0; i < 160; i++) { const x = 8 + q() * 576, y = 8 + q() * 170; c.fillStyle = `rgba(235,230,255,${((0.3 + q() * 0.7) * (1 - y / 190)).toFixed(2)})`; c.fillRect(x, y, q() < 0.12 ? 2 : 1, q() < 0.12 ? 2 : 1); } }
  if (!P.moon) { sg.addColorStop(0, 'rgba(255,226,160,.95)'); sg.addColorStop(0.18, 'rgba(255,196,120,.45)'); sg.addColorStop(1, 'rgba(255,180,100,0)'); c.fillStyle = sg; c.fillRect(8, 8, 576, 320); circ(c, sx, sy, 13, '#fff0cc'); }
  const r = mulberry32(41);
  for (let i = 0; i < 12; i++) cloudBank(c, 8 + r() * 600, 16 + r() * 80, 120 + r() * 180, 10 + r() * 12, P.cloudDark, P.cloudLit, r);
  if (P.moon) { sg.addColorStop(0, 'rgba(210,200,255,.6)'); sg.addColorStop(1, 'rgba(210,200,255,0)'); c.fillStyle = sg; c.fillRect(8, 8, 576, 320); const mR = P.moonR || 24, mk = mR / 24; circ(c, sx, sy, mR, '#e8e2f2'); for (const [dx, dy, rr2] of [[-7, -5, 5], [8, 7, 4], [5, -9, 3], [-4, 10, 3]]) circ(c, sx + dx * mk, sy + dy * mk, rr2 * mk, 'rgba(150,140,180,.4)'); cloudBank(c, sx + 10, sy + mR * 0.7, 90 * mk, 6, P.cloudDark, P.cloudLit, r); }
  if (!P.moon) { c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const a = 0.18 + i * 0.12, len = 520; c.fillStyle = 'rgba(255,214,150,.05)'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len); c.lineTo(sx + Math.cos(a + 0.05) * len, sy + Math.sin(a + 0.05) * len); c.closePath(); c.fill(); }
  c.restore(); }
}
function farForest(c, cols, hazeCol) {
  const r = mulberry32(29), trees = [];
  for (let i = 0; i < 220; i++) { const X = (r() - 0.5) * 3200, Z = 3.2 + r() * 1.3; trees.push([X, Z, r(), r()]); }
  trees.sort((a, b) => b[1] - a[1]);
  for (const [X, Z, k1, k2] of trees) {
    const [sx, sy, s] = proj(X, Z); if (sx < -20 || sx > 612) continue; const h = (44 + k1 * 36) * s;
    c.fillStyle = cols[Math.floor(k2 * cols.length)]; c.beginPath(); c.ellipse(sx, sy - h * 0.55, h * 0.42, h * 0.6, 0, 0, TAU); c.fill();
  }
  const y0 = proj(0, 4.6)[1], hz = c.createLinearGradient(0, y0 - 30, 0, y0 + 26); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, hazeCol); c.globalAlpha = 0.45; c.fillStyle = hz; c.fillRect(8, y0 - 30, 576, 56); c.globalAlpha = 1;
}
function groundPlane(c, Wd) {
  const yF = proj(0, 4.4)[1], g = c.createLinearGradient(0, yF, 0, 432);
  g.addColorStop(0, Wd.ground[0]); g.addColorStop(0.35, Wd.ground[1]); g.addColorStop(1, Wd.ground[2]); c.fillStyle = g; c.fillRect(8, yF, 576, 440 - yF);
  const r = mulberry32(17);
  for (let i = 0; i < 30; i++) { const X = (r() - 0.5) * 2000, Z = 1.1 + r() * 2.8, [sx, sy, s] = proj(X, Z); c.fillStyle = r() < 0.55 ? 'rgba(0,0,0,.09)' : 'rgba(255,230,170,.06)'; c.beginPath(); c.ellipse(sx, sy, (70 + r() * 140) * s, (16 + r() * 22) * s, 0, 0, TAU); c.fill(); }
  for (let i = 0; i < 900; i++) {
    const X = (r() - 0.5) * 1700, Z = 0.8 + Math.pow(r(), 0.8) * 3.3, [sx, sy, s] = proj(X, Z), k = r(); if (sx < 0 || sx > 592 || sy > 440) continue;
    c.strokeStyle = k < 0.55 ? (Wd.tuft ? Wd.tuft[0] : 'rgba(14,26,8,.4)') : (Wd.tuft ? Wd.tuft[1] : 'rgba(190,200,130,.22)'); c.lineWidth = Math.max(0.6, 1.3 * s);
    c.beginPath(); c.moveTo(sx - 3 * s, sy); c.lineTo(sx, sy - 6 * s); c.lineTo(sx + 3 * s, sy); c.stroke();
    if (k > 0.985) circ(c, sx, sy - 3 * s, 1.6 * s, r() < 0.5 ? '#c8b060' : '#c8c0d0');
  }
}
function hillArt(c, Hl, hazeCol) {
  const [sx, sy, s] = proj(Hl.X, Hl.Z), rw = Hl.rx * s, hh = Hl.h * s, top = x => sy - hh * Math.pow(Math.max(0, 1 - (x / rw) ** 2), 0.65);
  const path = () => { c.beginPath(); c.moveTo(sx - rw - 30, sy + 10); for (let x = -rw; x <= rw; x += 3) c.lineTo(sx + x, top(x)); c.lineTo(sx + rw + 30, sy + 10); c.closePath(); };
  path(); const g = c.createLinearGradient(0, sy - hh, 0, sy + 10); g.addColorStop(0, Hl.cols[0]); g.addColorStop(1, Hl.cols[1]); c.fillStyle = g; c.fill();
  const r = mulberry32(Math.round(Hl.X * 7 + 3));
  c.save(); path(); c.clip();
  if (Hl.rock) for (let i = 0; i < 26; i++) {
    const x = (r() - 0.5) * rw * 1.7, y = top(x) + 4 + r() * (sy - top(x)), w = (10 + r() * 22) * s * 2.2;
    c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,240,220,.08)'; c.beginPath(); c.moveTo(sx + x - w / 2, y + w * 0.3); c.lineTo(sx + x - w * 0.2, y - w * 0.25); c.lineTo(sx + x + w * 0.3, y - w * 0.15); c.lineTo(sx + x + w / 2, y + w * 0.3); c.closePath(); c.fill();
  }
  for (let i = 0; i < 120; i++) { const x = (r() - 0.5) * rw * 2, y = top(x) + 3 + r() * (sy - top(x)); c.strokeStyle = r() < 0.5 ? 'rgba(10,20,5,.3)' : 'rgba(190,200,140,.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + x - 2 * s * 2, y); c.lineTo(sx + x, y - 5 * s * 2); c.lineTo(sx + x + 2 * s * 2, y); c.stroke(); }
  const shade = c.createLinearGradient(sx - rw, 0, sx + rw, 0); shade.addColorStop(0, 'rgba(255,220,160,.08)'); shade.addColorStop(1, 'rgba(10,14,40,.28)'); c.fillStyle = shade; c.fillRect(sx - rw - 30, sy - hh - 5, rw * 2 + 60, hh + 20);
  c.restore();
  c.strokeStyle = 'rgba(255,230,180,.2)'; c.lineWidth = 1.5; c.beginPath(); for (let x = -rw; x <= rw; x += 3) x === -rw ? c.moveTo(sx + x, top(x)) : c.lineTo(sx + x, top(x)); c.stroke();
  const hz = hazeAt(Hl.Z); if (hz > 0) { path(); c.globalAlpha = hz; c.fillStyle = hazeCol; c.fill(); c.globalAlpha = 1; }
}
function riverArt(c, Rv, hazeCol) {
  const pts = subdiv(Rv.pts, 6), [L, R] = ribbon(pts, Rv.w), yF = Math.min(...L.map(p => p[1]), ...R.map(p => p[1])), yN = Math.max(...L.map(p => p[1]), ...R.map(p => p[1]));
  ribbonPath(c, L, R); const g = c.createLinearGradient(0, yF, 0, yN); const RC = Rv.cols || (Rv.chasm ? ['#2a2034', '#040308'] : ['#7890a4', '#1e3c58']); g.addColorStop(0, RC[0]); g.addColorStop(1, RC[1]); c.fillStyle = g; c.fill();
  if (Rv.chasm) { const mid = pts.map(p => proj(p[0], p[1])); c.strokeStyle = Rv.line || 'rgba(120,255,150,.3)'; c.lineWidth = 1.5; c.beginPath(); mid.forEach(([x, y], i) => i ? c.lineTo(x, y + 2) : c.moveTo(x, y + 2)); c.stroke(); c.strokeStyle = Rv.edge || 'rgba(90,70,110,.8)'; c.lineWidth = 2; for (const E of [L, R]) { c.beginPath(); E.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } return; }
  c.strokeStyle = Rv.edge || 'rgba(200,215,210,.45)'; c.lineWidth = 1.4; for (const E of [L, R]) { c.beginPath(); E.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
  const r = mulberry32(61); c.strokeStyle = 'rgba(230,240,245,.35)';
  for (let i = 0; i < 70; i++) { const k = r() * (pts.length - 1), i0 = Math.floor(k), p = pts[i0], q = pts[i0 + 1], f = k - i0, off = (r() - 0.5) * Rv.w * 0.8; const [x, y, s] = proj(p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f + off / 300); c.lineWidth = Math.max(0.6, s); c.beginPath(); c.moveTo(x - 6 * s, y); c.lineTo(x + 6 * s, y); c.stroke(); }
  c.fillStyle = 'rgba(70,90,50,.55)'; for (const E of [L, R]) for (let i = 0; i < E.length; i += 2) { const [x, y] = E[i]; c.fillRect(x - 1, y - 5, 1.2, 5); c.fillRect(x + 2, y - 4, 1.2, 4); }
}
function roadArtW(c, A, Rd) {
  const pts = subdiv(Rd.pts, 5), [L, R] = ribbon(pts, Rd.w), yF = Math.min(...L.map(p => p[1])), yN = Math.max(...L.map(p => p[1]));
  ribbonPath(c, L, R); const g = c.createLinearGradient(0, yF, 0, yN); g.addColorStop(0, A.path[1]); g.addColorStop(1, A.path[0]); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(30,22,12,.35)'; c.lineWidth = 1.2; for (const E of [L, R]) { c.beginPath(); E.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
  const r = mulberry32(7);
  for (let i = 0; i < 160; i++) { const k = r() * (pts.length - 1), i0 = Math.floor(k), p = pts[i0], q = pts[i0 + 1], f = k - i0, wd = (p[3] || Rd.w), off = (r() - 0.5) * wd * 0.85; const [x, y, s] = proj(p[0] + (q[0] - p[0]) * f + off, p[1] + (q[1] - p[1]) * f, (p[2] || 0) + ((q[2] || 0) - (p[2] || 0)) * f); c.fillStyle = r() < 0.5 ? 'rgba(60,44,28,.3)' : 'rgba(255,240,210,.12)'; c.fillRect(x - 2 * s, y - s, 4.5 * s, 2 * s); }
  if (Rd.steps || Rd.planks) { c.strokeStyle = Rd.planks ? 'rgba(30,18,8,.5)' : 'rgba(30,22,12,.35)'; for (let i = 0; i < L.length; i += 1) if (Rd.planks || (pts[i][2] || 0) > 2) { c.beginPath(); c.moveTo(L[i][0], L[i][1]); c.lineTo(R[i][0], R[i][1]); c.stroke(); } }
}
function lakeArt(c, Lk) {
  const [cx, cy, s] = proj(Lk.X, Lk.Z), yT = proj(Lk.X, Lk.Z + Lk.rz)[1], yB = proj(Lk.X, Lk.Z - Lk.rz)[1], rx = Lk.rx * s, ry = (yB - yT) / 2, my = (yB + yT) / 2;
  c.fillStyle = '#5a6a44'; c.beginPath(); c.ellipse(cx, my, rx + 8, ry + 5, 0, 0, TAU); c.fill();
  const g = c.createLinearGradient(0, my - ry, 0, my + ry); g.addColorStop(0, '#8aa0a0'); g.addColorStop(1, '#264a52'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, my, rx, ry, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(230,220,180,.35)'; c.lineWidth = 1; const q = mulberry32(19); for (let i = 0; i < 26; i++) { const a = q() * TAU, d = Math.sqrt(q()) * 0.85, x = cx + Math.cos(a) * rx * d, y = my + Math.sin(a) * ry * d; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.stroke(); }
  c.fillStyle = 'rgba(80,110,50,.8)'; for (let i = 0; i < 14; i++) { const a = Math.PI * (0.05 + q() * 0.9); c.fillRect(cx + Math.cos(a) * rx - 1, my + Math.sin(a) * ry - 6, 1.4, 7); }
}
function boneBridgeArt(g) {
  g.strokeStyle = '#d8d0bc'; g.lineCap = 'round'; g.lineWidth = 4; g.beginPath(); g.ellipse(38, 32, 30, 24, 0, Math.PI, 0); g.stroke();
  g.lineWidth = 2.5; for (let i = 1; i < 6; i++) { const x = 8 + i * 10; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 32 - Math.sin(i / 6 * Math.PI) * 18); g.stroke(); }
  g.fillStyle = '#c8c0a8'; g.fillRect(-2, 2, 80, 6); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < 78; x += 8) g.fillRect(x, 2, 1.5, 6);
  skullAt(g, 0, 0, 0.8); skullAt(g, 76, 0, 0.8);
}
function bridgeArt(g, A) {
  wallRect(g, A, 0, 6, 76, 26); g.fillStyle = A.under || '#1e3a54'; g.beginPath(); g.ellipse(38, 32, 24, 19, 0, Math.PI, 0); g.fill();
  g.strokeStyle = shadeHex(A.wall[1], -0.3); g.lineWidth = 3; g.beginPath(); g.ellipse(38, 32, 25.5, 20.5, 0, Math.PI, 0); g.stroke();
  g.fillStyle = A.wall[0]; g.fillRect(-3, 0, 82, 7); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-3, 5, 82, 2);
}
function castShadow(c, s, dir) {
  const { x, b, w, h } = s, k = h * 0.45 * dir, up = h * 0.14;
  c.fillStyle = 'rgba(20,24,44,.2)'; c.beginPath(); c.moveTo(x + 6, b); c.lineTo(x + w - 6, b); c.lineTo(x + w - 6 + k, b - up); c.lineTo(x + 6 + k, b - up); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.26)'; c.beginPath(); c.ellipse(x + w / 2, b - 1, w * 0.48, 5, 0, 0, TAU); c.fill();
}
function drawWalker(ctx, x, y, sc, col, t, dir) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc * dir, sc); const ph = Math.sin(t * 8);
  ctx.strokeStyle = '#2a1e14'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-2 * ph, 0); ctx.moveTo(0, -6); ctx.lineTo(2 * ph, 0); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-3.2, -5); ctx.lineTo(3.2, -5); ctx.lineTo(2.2, -13); ctx.lineTo(-2.2, -13); ctx.closePath(); ctx.fill();
  circ(ctx, 0, -15.5, 2.5, '#e8c8a0'); ctx.restore();
}
// Knieja: widok z wnętrza lasu – pnie po bokach, korona u góry, smugi światła
function forestFrame(c) {
  const q = mulberry32(501);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const [x0, w0] of [[170, 24], [290, 16], [400, 30], [470, 14]]) { c.fillStyle = 'rgba(255,214,140,.06)'; c.beginPath(); c.moveTo(x0, 40); c.lineTo(x0 + w0, 40); c.lineTo(x0 + w0 * 3 + 70, 440); c.lineTo(x0 + 70, 440); c.closePath(); c.fill(); }
  c.restore();
  for (let i = 0; i < 80; i++) { const x = q() * 600, y = 4 + q() * 46; circ(c, x, y, 14 + q() * 24, q() < 0.5 ? '#14221a' : '#1a2c1e'); }
  for (let i = 0; i < 40; i++) circ(c, q() * 600, 26 + q() * 52, 7 + q() * 12, q() < 0.5 ? '#22382a' : '#2a4430');
  for (let i = 0; i < 14; i++) { const x = q() * 592; c.strokeStyle = '#2e4a2c'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, 40); c.quadraticCurveTo(x + 6, 80 + q() * 30, x + 2, 110 + q() * 60); c.stroke(); }
  for (const [x, w, dir] of [[30, 66, 1], [562, 70, -1]]) {
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#20170f'); g.addColorStop(dir > 0 ? 0.72 : 0.28, '#4a3624'); g.addColorStop(1, '#1a130c'); c.fillStyle = g;
    c.beginPath(); c.moveTo(x - w / 2 - 26, 440); c.quadraticCurveTo(x - w / 2, 380, x - w / 2 + 6, 300); c.lineTo(x - w / 2 + 12, 0); c.lineTo(x + w / 2 - 12, 0); c.lineTo(x + w / 2 - 6, 300); c.quadraticCurveTo(x + w / 2, 380, x + w / 2 + 26, 440); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 9, 10); c.bezierCurveTo(x + i * 10 + 4, 150, x + i * 8 - 4, 280, x + i * 11, 430); c.stroke(); }
    c.strokeStyle = '#2a1e12'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, 96); c.quadraticCurveTo(x + dir * 70, 74, x + dir * 130, 44); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(x + dir * 60, 80); c.quadraticCurveTo(x + dir * 90, 96, x + dir * 110, 118); c.stroke();
    canopy(c, x + dir * 130, 40, 30, '#1e3822', 600 + x); canopy(c, x + dir * 110, 118, 16, '#244428', 700 + x);
    c.strokeStyle = '#3a6a34'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const vx = x + dir * (w / 2 - 14); c.beginPath(); c.moveTo(vx, 70 + i * 60); c.quadraticCurveTo(vx + dir * 14, 92 + i * 60, vx + dir * 2, 120 + i * 60); c.stroke(); circ(c, vx + dir * 10, 96 + i * 60, 2.5, '#4a8a3a'); }
    c.strokeStyle = '#2a1e12'; c.lineWidth = 8; c.beginPath(); c.moveTo(x + dir * (w / 2 - 4), 420); c.quadraticCurveTo(x + dir * (w / 2 + 30), 408, x + dir * (w / 2 + 60), 438); c.stroke();
  }
}
// Kurhan: zielona mgła w przepaści
function chasmGlow(c, Rv) {
  const pts = subdiv(Rv.pts, 4);
  for (const p of pts) { const [x, y, s] = proj(p[0], p[1]); const r = (p[3] || Rv.w) * s * 0.45, g = c.createRadialGradient(x, y, 0, x, y, r); const gc = Rv.glow || '90,255,140'; g.addColorStop(0, `rgba(${gc},${Rv.glowA || 0.08})`); g.addColorStop(1, `rgba(${gc},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
}
function drawCreaturesFX(ctx, LL, tm) {
  for (const F of (LL.floaters || [])) for (let i = 0; i < F.n; i++) {
    const ph = i * 2.3 + (F.seed || 0), X = F.X + Math.sin(tm * 0.3 + ph) * F.spread, Z = F.Z + Math.cos(tm * 0.23 + ph * 1.7) * F.spreadZ, e = F.e + Math.sin(tm * 1.1 + ph) * 8;
    const [x, y, sc] = proj(X, Z, e);
    if (F.kind === 'ember') { const u = ((tm * 0.25 + ph * 0.37) % 1), [ex, ey] = proj(X, Z, F.e + u * 120); circ(ctx, ex, ey, (1.8 - u) * sc + 0.6, `rgba(255,${150 + Math.round(90 * (1 - u))},60,${(1 - u).toFixed(2)})`); }
    else if (F.kind === 'wisp') { const a = 0.55 + 0.35 * Math.sin(tm * 3 + ph); ctx.fillStyle = `rgba(170,255,200,${(a * 0.3).toFixed(2)})`; ctx.beginPath(); ctx.arc(x, y, 7 * sc, 0, TAU); ctx.fill(); circ(ctx, x, y, 1.8 * sc + 0.8, `rgba(230,255,220,${a.toFixed(2)})`); }
    else { ctx.globalAlpha = 0.5 + 0.25 * Math.sin(tm * 2 + ph); ghost(ctx, x, y, sc * 1.2); ctx.globalAlpha = 1; }
  }
  if (LL.skeletons) LL.skeletons.forEach((pts, k) => { for (let j = 0; j < 2; j++) {
    const per = 30 + k * 7 + j * 9, u0 = ((tm + j * 13 + k * 5) % per) / per, fwd = u0 < 0.5, u = fwd ? u0 * 2 : 2 - u0 * 2;
    const f = u * (pts.length - 1), i0 = Math.min(pts.length - 2, Math.floor(f)), fr = f - i0, a = pts[i0], b = pts[i0 + 1];
    const [x, y, sc] = proj(a[0] + (b[0] - a[0]) * fr + (j ? 10 : -10), a[1] + (b[1] - a[1]) * fr, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * fr);
    drawSkeleton(ctx, x, y, sc * 1.1, tm, (b[0] >= a[0]) === fwd ? 1 : -1, j === 1);
  } });
}
const TOWN_LAYOUTS = {};
// --- Przystań w perspektywie ---
TOWN_LAYOUTS.haven = {
  sky: { top: '#161d30', mid: '#3a4664', hor: '#c08e60', sun: [104, 132], cloudDark: 'rgba(40,44,64,.78)', cloudLit: 'rgba(226,160,100,.7)' },
  mountains: ['#6e6a7c', '#4a4c60'], forest: ['#35432f', '#2e3c2c', '#394a34'],
  ground: ['#7c7c64', '#4e6234', '#2c3e22'], haze: '#a49e92', desat: 0.28,
  hills: [{ X: -240, Z: 2.04, rx: 380, h: 58, cols: ['#566c3a', '#344628'] }, { X: 520, Z: 2.62, rx: 330, h: 86, cols: ['#6a665c', '#43423a'], rock: true }],
  river: { w: 70, pts: [[-820, 2.05], [-500, 1.82], [-250, 1.7], [-80, 1.63], [100, 1.6], [300, 1.64], [600, 1.75], [900, 1.9]] },
  roads: [
    { w: 58, pts: [[26, 0.8, 0, 62], [15, 0.9], [2, 1.02], [-12, 1.15], [-20, 1.25, 0, 44]] },
    { w: 40, steps: true, pts: [[-70, 1.27], [-130, 1.31], [-170, 1.42], [-190, 1.55], [-200, 1.66], [-214, 1.76], [-226, 1.86, 14], [-236, 1.95, 34], [-240, 1.99, 44, 26]] },
  ],
  plaza: { X: -40, Z: 1.27, r: 120 },
  bridge: { X: -200, Z: 1.665, w: 64 },
  slots: [
    { X: -18, Z: 1.3, k: 1.15, w: 150, h: 112 }, { X: -240, Z: 2.0, e: 44, k: 1.3, w: 194, h: 124 }, { X: -20, Z: 2.18, e: 6, k: 1.4, w: 62, h: 150 },
    { X: 520, Z: 2.56, e: 78, k: 1.35, w: 112, h: 122 }, { X: 290, Z: 1.28, k: 1.1, w: 128, h: 80 }, { X: 160, Z: 1.84, k: 1.3, w: 104, h: 118 },
    { X: -380, Z: 1.5, k: 1.1, w: 118, h: 86 }, { X: 310, Z: 2.05, k: 1.3, w: 74, h: 140 }, { X: -80, Z: 0.88, k: 1, w: 88, h: 78 },
    { X: -250, Z: 1.52, k: 1, w: 76, h: 76 }, { X: -205, Z: 0.97, k: 1, w: 90, h: 80 }, { X: 190, Z: 1.45, k: 1, w: 110, h: 66 },
    { X: 90, Z: 0.98, k: 1, w: 100, h: 92 }, { X: 205, Z: 0.92, k: 1, w: 128, h: 70 },
  ],
  props: [
    ['tree', -540, 1.78, 0, 1.3], ['tree', -470, 1.95, 0, 1.3], ['tree', -620, 2.25, 0, 1.4], ['tree', -470, 2.35, 20, 1.4], ['tree', 380, 2.2, 0, 1.4],
    ['tree', 720, 2.1, 0, 1.4], ['tree', 660, 1.85, 0, 1.3], ['tree', -560, 1.3, 0, 1.2], ['tree', -470, 1.05, 0, 1.3], ['tree', 440, 1.06, 0, 1.2], ['tree', 400, 1.55, 0, 1.2],
    ['tree', 80, 2.45, 0, 1.3], ['bush', -150, 0.88], ['bush', 520, 1.4], ['lamp', -25, 0.82], ['lamp', -18, 0.9], ['lamp', 42, 1.06], ['lamp', -38, 1.1],
    ['fence', 330, 1.02], ['fence', -350, 1.0],
  ],
  walksW: [[[26, 0.82], [15, 0.9], [2, 1.02], [-12, 1.15], [-20, 1.26]], [[-100, 1.27], [-40, 1.28], [30, 1.27]]],
  guardsW: [[-262, 1.985, 42], [-218, 1.985, 42]], birds: true,
};
// --- Knieja: jezioro pośrodku, pomost do Drzewa Życia, las dookoła ---
TOWN_LAYOUTS.sylvan = {
  pj: { hor: 150, d: 250 }, frame: 'forest',
  sky: { top: '#0e1614', mid: '#2a3a30', hor: '#a88450', sun: [300, 170], cloudDark: 'rgba(24,32,28,.6)', cloudLit: 'rgba(200,150,90,.4)' },
  mountains: ['#2a3a2c', '#223226'], forest: ['#16281a', '#1c301e', '#142418'],
  ground: ['#4a5a3c', '#34502a', '#1e3418'], haze: '#6a7a5c', desat: 0.18,
  hills: [{ X: -280, Z: 2.5, rx: 300, h: 30, cols: ['#3a5a2e', '#26401e'] }, { X: 470, Z: 2.85, rx: 280, h: 86, cols: ['#4a5448', '#2e362c'], rock: true }],
  lake: { X: 20, Z: 1.35, rx: 140, rz: 0.27 },
  roads: [{ w: 34, planks: true, pts: [[40, 0.8, 0, 40], [30, 0.92], [0, 1.08], [-40, 1.28], [-44, 1.5], [-26, 1.72], [-6, 1.92, 0, 26]] }],
  slots: [
    { X: 0, Z: 2.02, k: 1.6, w: 150, h: 130 }, { X: -260, Z: 2.35, e: 12, k: 1.25, w: 194, h: 124 }, { X: -299, Z: 1.59, k: 1, w: 110, h: 70 },
    { X: 470, Z: 2.72, e: 72, k: 1.3, w: 120, h: 100 }, { X: 116, Z: 1.54, k: 1.1, w: 70, h: 150 }, { X: 231, Z: 1.35, k: 1, w: 120, h: 80 },
    { X: 322, Z: 2.7, k: 1.3, w: 130, h: 130 }, { X: -176, Z: 1.58, k: 1.1, w: 120, h: 80 }, { X: -48, Z: 0.9, k: 1, w: 90, h: 80 },
    { X: 524, Z: 2.57, k: 1, w: 76, h: 76 }, { X: 62, Z: 1, k: 1, w: 100, h: 100 }, { X: 335, Z: 1.98, k: 1, w: 70, h: 120 },
    { X: -146, Z: 0.86, k: 1, w: 100, h: 96 }, { X: 150, Z: 0.93, k: 1, w: 128, h: 72 },
  ],
  props: [
    ['tree', -420, 2.2, 0, 1.4], ['tree', -380, 1.6, 0, 1.3], ['tree', 330, 1.55, 0, 1.2], ['tree', 200, 2.9, 0, 1.4], ['tree', -120, 2.9, 0, 1.4],
    ['fern', 60, 0.92], ['fern', -80, 1.25], ['mushroom', 150, 0.88], ['mushroom', 10, 1.62], ['rock', -20, 1.66],
    ['lamp', 8, 0.95], ['lamp', -70, 1.2], ['lamp', -70, 1.6], ['bush', 300, 1.02], ['bush', -300, 1.15],
  ],
  floaters: [{ kind: 'wisp', X: 20, Z: 1.35, e: 18, n: 6, spread: 110, spreadZ: 0.18 }, { kind: 'wisp', X: -250, Z: 1.9, e: 30, n: 3, spread: 90, spreadZ: 0.2, seed: 5 }],
  birds: true, birdCol: 'rgba(20,30,20,.8)',
};
// --- Kurhan: przepaść biegnąca w głąb, cytadela na iglicy, olbrzymi księżyc ---
TOWN_LAYOUTS.barrow = {
  pj: { hor: 40, d: 330 },
  sky: { top: '#050409', mid: '#181028', hor: '#3a2c48', sun: [296, 70], moon: true, moonR: 46, stars: true, cloudDark: 'rgba(16,12,24,.7)', cloudLit: 'rgba(150,140,190,.28)' },
  mountains: ['#221e2c', '#18141f'], forest: ['#110e16', '#15111b', '#0e0b12'],
  ground: ['#403a48', '#2a2632', '#16141c'], haze: '#4a4258', desat: 0.1, tuft: ['rgba(0,0,0,.35)', 'rgba(170,160,190,.14)'],
  hills: [{ X: 0, Z: 2.55, rx: 200, h: 90, cols: ['#34303c', '#1e1b24'], rock: true }, { X: 440, Z: 2.85, rx: 260, h: 70, cols: ['#34303c', '#1e1b24'], rock: true }, { X: -440, Z: 2.9, rx: 260, h: 60, cols: ['#302c38', '#1c1922'], rock: true }],
  river: { w: 150, chasm: true, pts: [[0, 0.78, 0, 170], [10, 1.0, 0, 150], [-10, 1.3, 0, 130], [15, 1.6, 0, 110], [0, 1.95, 0, 90], [0, 2.2, 0, 50]] },
  roads: [
    { w: 34, pts: [[-190, 1.62], [-130, 1.52], [-80, 1.46]] }, { w: 34, pts: [[80, 1.46], [150, 1.52], [220, 1.66]] },
    { w: 26, steps: true, pts: [[-110, 1.92], [-80, 2.1, 20], [-50, 2.3, 50], [-24, 2.46, 76, 20]] }, { w: 26, steps: true, pts: [[110, 1.92], [80, 2.1, 20], [50, 2.3, 50], [24, 2.46, 76, 20]] },
  ],
  bridge: { X: 0, Z: 1.46, w: 170, bone: true },
  slots: [
    { X: -230, Z: 1.6, k: 1.15, w: 150, h: 118 }, { X: 0, Z: 2.5, e: 80, k: 1.6, w: 194, h: 124 }, { X: 230, Z: 1.72, k: 1.25, w: 80, h: 140 },
    { X: 420, Z: 2.72, e: 56, k: 1.3, w: 130, h: 100 }, { X: 300, Z: 1.5, k: 1.1, w: 128, h: 80 }, { X: -150, Z: 2.22, k: 1.3, w: 74, h: 150 },
    { X: -300, Z: 1.25, k: 1.1, w: 118, h: 90 }, { X: 170, Z: 2.26, k: 1.3, w: 100, h: 118 }, { X: -180, Z: 0.88, k: 1, w: 88, h: 78 },
    { X: -120, Z: 1.36, k: 1, w: 76, h: 76 }, { X: -170, Z: 1.1, k: 1, w: 90, h: 80 }, { X: 250, Z: 1.25, k: 1, w: 110, h: 60 },
    { X: 170, Z: 0.9, k: 1, w: 100, h: 92 }, { X: 130, Z: 1.3, k: 0.9, w: 128, h: 70 },
  ],
  props: [
    ['tree', -420, 2.3, 0, 1.3], ['tree', 380, 2.35, 0, 1.3], ['tree', -360, 1.5, 0, 1.2], ['tree', 360, 1.2, 0, 1.2], ['tree', -260, 0.95, 0, 1.1],
    ['grave', -110, 0.95], ['grave', -122, 0.99], ['grave', 110, 0.98], ['grave', 96, 1.12], ['grave', -90, 1.9], ['bones', -100, 1.05], ['bones', 110, 1.12], ['bones', 90, 1.9],
    ['rock', -60, 2.0], ['rock', 60, 2.05], ['lamp', -85, 1.42], ['lamp', -100, 1.95], ['lamp', 100, 1.95], ['fence', 330, 1.05], ['fence', -390, 1.3],
  ],
  skeletons: [[[-70, 1.46, 0], [60, 1.46, 0]], [[-190, 1.62], [-130, 1.52], [-90, 1.47]]],
  floaters: [{ kind: 'ghost', X: 0, Z: 1.25, e: 40, n: 3, spread: 50, spreadZ: 0.25 }, { kind: 'ghost', X: 260, Z: 1.3, e: 30, n: 2, spread: 50, spreadZ: 0.1, seed: 3 }, { kind: 'ghost', X: -60, Z: 2.3, e: 90, n: 2, spread: 60, spreadZ: 0.1, seed: 7 }],
  birds: true, birdCol: 'rgba(10,8,14,.9)', guardSkel: [[-26, 2.47, 76], [26, 2.47, 76]],
};
let TownFXCache = {}, lastTownKey = null;
// --- malowanie całej sceny ---
function paintTownWorld(c, t, col, Wd) {
  usePJ(Wd); const fac = t.faction, A = TOWN_ART[fac], fx = { wins: [], smokes: [], glows: [], flags: [], rects: {} }, arts = BUILD_ART[fac] || {}, hzC = Wd.haze;
  c.save(); c.beginPath(); c.rect(8, 8, 576, 422); c.clip();
  skyDramatic(c, Wd.sky);
  ridge(c, 211, 170, 96, Wd.mountains[0]); ridge(c, 237, 176, 58, Wd.mountains[1]);
  farForest(c, Wd.forest, hzC);
  groundPlane(c, Wd);
  [...Wd.hills].sort((a, b) => b.Z - a.Z).forEach(Hl => hillArt(c, Hl, hzC));
  if (Wd.lake) lakeArt(c, Wd.lake);
  if (Wd.river) riverArt(c, Wd.river, hzC);
  if (Wd.river && Wd.river.chasm) chasmGlow(c, Wd.river);
  for (const Rd of Wd.roads) roadArtW(c, A, Rd);
  if (Wd.plaza) { const [px, py, s] = proj(Wd.plaza.X, Wd.plaza.Z); c.fillStyle = '#8e8470'; c.beginPath(); c.ellipse(px, py, Wd.plaza.r * s, 12 * s, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,30,20,.3)'; c.lineWidth = 1; const r = mulberry32(3); for (let i = 0; i < 90; i++) { const a = r() * TAU, d = Math.sqrt(r()); c.strokeRect(px + Math.cos(a) * Wd.plaza.r * s * d - 2, py + Math.sin(a) * 12 * s * d - 1, 4 * s, 2.5 * s); } }
  const objs = [];
  Wd.slots.forEach((S, i) => objs.push({ Z: S.Z, slot: i, S }));
  Wd.props.forEach(([kind, X, Z, e = 0, k = 1]) => objs.push({ Z, prop: kind, X, e, k }));
  if (Wd.bridge) objs.push({ Z: Wd.bridge.Z, bridge: true, ...Wd.bridge });
  objs.sort((a, b) => b.Z - a.Z);
  for (const o of objs) {
    if (o.slot !== undefined) {
      const S = o.S, [sx, sy, s] = proj(S.X, S.Z, S.e || 0), sc = s * S.k, w = S.w * sc, h = S.h * sc, B = slotBuilding(t, o.slot);
      fx.rects[o.slot] = { x: sx - w / 2, y: sy - h, w, h, z: S.Z };
      const box = [-44, -S.h * 0.8 - 50, S.w + 88, S.h * 1.8 + 62], anc = [S.w / 2, S.h], can = { x: 0, b: S.h, w: S.w, h: S.h };
      if (B) {
        castShadow(c, { x: sx - w / 2, b: sy, w, h }, 1);
        const [grp, tier] = groupOf(B), fn = arts[grp];
        if (fn) drawObj(c, (g, tf) => fn(g, A, can, tier, col, tf), box, anc, sx, sy, sc, hazeAt(S.Z), hzC, fx);
      } else { const next = BUILDINGS.find(b2 => b2.slot === o.slot && !hasB(t, b2.id)); if (next) drawObj(c, g => plotArt(g, A, can, bInfo(next, fac).emblem), box, anc, sx, sy, sc, hazeAt(S.Z), hzC, fx); }
    } else if (o.bridge) {
      const [sx, sy, s] = proj(o.X, o.Z); drawObj(c, g => o.bone ? boneBridgeArt(g) : bridgeArt(g, A), [-6, -4, 90, 42], [38, 32], sx, sy, s * (o.w / 76), hazeAt(o.Z), hzC, fx);
    } else {
      const [sx, sy, s] = proj(o.X, o.Z, o.e), sc = s * o.k;
      const rg = () => mulberry32(Math.round(o.X * 7 + o.Z * 100));
      drawObj(c, (g, tf) => { if (!extraProp(g, fac, o.prop, 0, 0, rg(), tf)) propArt(g, fac, o.prop, 0, 0, rg(), tf); }, PROP_BOX[o.prop] || [-40, -80, 80, 90], [0, 0], sx, sy, sc, hazeAt(o.Z), hzC, fx);
    }
  }
  if (Wd.frame === 'forest') forestFrame(c);
  c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = Wd.desat || 0.25; c.fillStyle = '#808080'; c.fillRect(8, 8, 576, 422); c.restore();
  const lg = c.createLinearGradient(8, 8, 584, 430); lg.addColorStop(0, 'rgba(255,190,110,.16)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(16,20,56,.32)'); c.fillStyle = lg; c.fillRect(8, 8, 576, 422);
  const vg = c.createRadialGradient(296, 230, 150, 296, 230, 400); vg.addColorStop(0, 'rgba(6,6,14,0)'); vg.addColorStop(1, 'rgba(6,6,14,.58)'); c.fillStyle = vg; c.fillRect(8, 8, 576, 422);
  c.restore(); return fx;
}
function paintTownScene(c, t, col) {
  const fx = paintTownWorld(c, t, col, TOWN_LAYOUTS[t.faction] || TOWN_LAYOUTS.haven);
  pixelQuantize(c.canvas); return fx;
}
function drawTownFX(ctx, t, fx) {
  const LL = TOWN_LAYOUTS[t.faction] || TOWN_LAYOUTS.haven; usePJ(LL);
  const tm = G.time, fac = t.faction, A = TOWN_ART[fac] || TOWN_ART.haven, [gr, gg, gb] = hexRgb(A.glow);
  ctx.save(); ctx.beginPath(); ctx.rect(8, 8, 576, 422); ctx.clip();
  for (const [x, y, r, gc] of (fx.glows || [])) {
    const p = 0.7 + 0.3 * Math.sin(tm * 3 + x), [cr, cg, cb] = hexRgb(gc), g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.55 * p).toFixed(3)})`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const [x, y, w, h, wc] of fx.wins) {
    const f = clamp(0.55 + 0.3 * Math.sin(tm * 2.2 + x * 0.37) + 0.15 * Math.sin(tm * 6.1 + y), 0, 1), [r1, g1, b1] = wc ? hexRgb(wc) : [gr, gg, gb];
    ctx.fillStyle = `rgba(${r1},${g1},${b1},${(f * ({ haven: 0.1, sylvan: 0.22 }[fac] || 0.3)).toFixed(3)})`; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.max(w, h) * 1.4, 0, TAU); ctx.fill();
  }
  for (const [sx, sy, ss = 1] of fx.smokes) for (let i = 0; i < 3; i++) {
    const p = (tm * 0.35 + i / 3) % 1; circ(ctx, sx + (Math.sin(p * 4 + i) * 4 + p * 8) * ss, sy - p * 42 * ss, (3 + p * 7) * ss, `rgba(200,198,192,${(0.4 * (1 - p)).toFixed(3)})`);
  }
  for (const [x, y, fc, fs = 1] of (fx.flags || [])) {
    ctx.save(); ctx.translate(x, y); ctx.scale(fs, fs); ctx.fillStyle = fc; ctx.beginPath(); ctx.moveTo(0, -5);
    for (let i = 1; i <= 6; i++) ctx.lineTo(i * 2.4, -5 + i * 0.55 + Math.sin(tm * 5 - i * 0.8 + x) * 1.4 * i / 6);
    for (let i = 6; i >= 0; i--) ctx.lineTo(i * 2.4, 6 - i * 0.75 + Math.sin(tm * 5 - i * 0.8 + x) * 1.4 * i / 6);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (LL.walksW) LL.walksW.forEach((pts, k) => { for (let j = 0; j < 2; j++) {
    const per = 26 + k * 6 + j * 7, u0 = ((tm + j * 11 + k * 5) % per) / per, fwd = u0 < 0.5, u = fwd ? u0 * 2 : 2 - u0 * 2;
    const f = u * (pts.length - 1), i0 = Math.min(pts.length - 2, Math.floor(f)), fr = f - i0, a = pts[i0], b = pts[i0 + 1];
    const [x, y, sc] = proj(a[0] + (b[0] - a[0]) * fr + (j ? 12 : -12), a[1] + (b[1] - a[1]) * fr);
    drawWalker(ctx, x, y, sc * 1.05, (LL.walkCols || ['#7a3a2a', '#3a4a6a', '#5a6a3a', '#7a5a3a'])[(k * 2 + j) % 4], tm, (pts[pts.length - 1][0] >= pts[0][0]) === fwd ? 1 : -1);
  } });
  drawCreaturesFX(ctx, LL, tm);
  if (LL.guardSkel) for (const [gX, gZ, gE] of LL.guardSkel) { const [gx, gy, sc] = proj(gX, gZ, gE); drawSkeleton(ctx, gx, gy, sc * 1.15, 0, 1, true); }
  if (LL.guardsW) for (const [gX, gZ, gE] of LL.guardsW) {
    const [gx, gy, sc] = proj(gX, gZ, gE); drawWalker(ctx, gx, gy, sc * 1.1, LL.guardCol || (t.faction === 'barrow' ? '#c8c0ac' : t.faction === 'sylvan' ? '#3a6a3a' : '#7a8494'), 0, 1);
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.2 * sc; ctx.beginPath(); ctx.moveTo(gx + 4 * sc, gy); ctx.lineTo(gx + 4 * sc, gy - 22 * sc); ctx.stroke();
  }
  if (LL.birds) for (let i = 0; i < 4; i++) {
    const x = ((tm * 18 + i * 170) % 720) - 60, y = 46 + i * 15 + Math.sin(tm * 0.8 + i) * 6, f = Math.sin(tm * 9 + i * 2) * 3;
    ctx.strokeStyle = LL.birdCol || 'rgba(40,40,60,.8)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 5, y - f); ctx.quadraticCurveTo(x - 2, y - 1, x, y + 1); ctx.quadraticCurveTo(x + 2, y - 1, x + 5, y - f); ctx.stroke();
  }
  if (fac === 'sylvan') for (let i = 0; i < 26; i++) {
    const x = 20 + ((i * 97 + Math.sin(tm * 0.4 + i) * 30) % 550), y = 150 + ((i * 53) % 260) + Math.sin(tm * 0.9 + i * 1.7) * 10, a = 0.4 + 0.4 * Math.sin(tm * 3 + i);
    circ(ctx, x, y, 1.6, `rgba(255,250,170,${a.toFixed(3)})`);
  }
  if (LL.mist) for (let i = 0; i < 4; i++) { // bagienna mgła przy ziemi
    const x = ((i * 220 + tm * 9) % 900) - 150, y = 330 + i * 26, g = ctx.createRadialGradient(x, y, 0, x, y, 160); g.addColorStop(0, 'rgba(200,220,180,.16)'); g.addColorStop(1, 'rgba(200,220,180,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.25); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.fillRect(x - 160, y - 160, 320, 320); ctx.restore();
  }
  if (LL.embers) { // żar unoszący się nad całym miastem i drżące powietrze nad lawą
    for (let i = 0; i < 30; i++) { const u = (tm * 0.12 + i * 0.137) % 1, x = 20 + ((i * 83) % 560) + Math.sin(tm + i) * 8, y = 430 - u * 360; circ(ctx, x, y, 1.2, `rgba(255,${130 + (i % 5) * 20},50,${(0.8 * (1 - u)).toFixed(2)})`); }
    const g = ctx.createLinearGradient(0, 300, 0, 440); g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(1, `rgba(255,90,20,${(0.1 + 0.04 * Math.sin(tm * 2)).toFixed(3)})`); ctx.fillStyle = g; ctx.fillRect(8, 300, 576, 140);
  }
  if (fac === 'barrow') {
    for (let i = 0; i < 3; i++) { const x = ((i * 260 + tm * 12) % 900) - 150, y = 300 + i * 45; const g = ctx.createRadialGradient(x, y, 0, x, y, 140); g.addColorStop(0, 'rgba(190,180,220,.16)'); g.addColorStop(1, 'rgba(190,180,220,0)'); ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.3); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.fillRect(x - 140, y - 140, 280, 280); ctx.restore(); }
    for (let i = 0; i < 3; i++) { const x = 100 + ((tm * 40 + i * 180) % 500), y = 60 + i * 25 + Math.sin(tm * 2 + i) * 12, f = Math.sin(tm * 14 + i) * 4;
      ctx.fillStyle = '#0e0a14'; ctx.beginPath(); ctx.moveTo(x - 8, y - f); ctx.quadraticCurveTo(x - 3, y - 2, x, y + 1); ctx.quadraticCurveTo(x + 3, y - 2, x + 8, y - f); ctx.lineTo(x, y + 3); ctx.closePath(); ctx.fill(); }
  }
  ctx.restore();
}

