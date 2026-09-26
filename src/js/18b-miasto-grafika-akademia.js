// ==================== MIASTO: AKADEMIA =====================================================
// Miasto magów w ośnieżonych górach: białe wieże ze stożkowymi dachami, złote kopuły, kryształy i padający śnieg.
// Budowle dostają s = { x, b, w, h } (podstawa b) i poziom (tier), jak w MIASTO: GRAFIKA i MIASTO: TWIERDZA I INFERNO.
TOWN_ART.academy = {
  sky: ['#4a6a9a', '#9ab4d8', '#eef0f6'], far: ['#8a9ab8', '#a8b6cc'], back: ['#c8d2e0', '#a8b4c6'], mid: ['#d4dce8', '#b4c0d0'], front: ['#e0e6ee', '#c0cad8'],
  path: ['#a8a6a4', '#7c7a78'], wall: ['#e2e4ea', '#9ea4b4'], mortar: 'rgba(60,70,90,.3)', roof: { hall: '#2e4e9e', dw: '#4a64b0', util: '#5a6a8e', tower: '#243e8a', wall: '#3e5890' },
  roofShape: 'spire', tex: 'blocks', glow: '#a8e0ff', door: '#1a2030', trim: '#e0c060',
};
// --- klocki Akademii: śnieg na dachach, smukłe wieże, kryształy, koła zębate ---
function snowCap(c, x, y, w, rh) { // czapa śniegu na stożkowym dachu i okapie
  c.fillStyle = 'rgba(244,248,255,.92)'; const cx = x + w / 2;
  fillPoly(c, [[cx, y - rh], [cx - w * 0.2, y - rh * 0.56], [cx - w * 0.06, y - rh * 0.64], [cx + w * 0.07, y - rh * 0.52], [cx + w * 0.18, y - rh * 0.62]], 'rgba(244,248,255,.92)');
  c.fillRect(x - 3, y - 1.5, w + 6, 2.2);
}
function magicTower(c, A, x, b, w, h, roof, fx, glow) { // wieża maga: okna jedno nad drugim, stożkowy dach ze śniegiem
  wallRect(c, A, x, b - h, w, h);
  for (let y = b - h + 8; y < b - 16; y += 18) archWin(c, x + w / 2 - 3, y, 6, 9, glow || A.glow, fx);
  roofArt(c, A, roof, x, b - h, w, w * 1.3); snowCap(c, x, b - h, w, w * 1.3);
}
function gableSnow(c, x, y, w, rh) { // śnieg na dwuspadowym dachu (roofArt z GABLE)
  const cx = x + w / 2; fillPoly(c, [[cx, y - rh - 1], [cx - w * 0.32, y - rh * 0.4], [cx - w * 0.12, y - rh * 0.52], [cx + w * 0.05, y - rh * 0.36], [cx + w * 0.3, y - rh * 0.44]], 'rgba(244,248,255,.92)');
  c.fillRect(x - 5, y + 0.5, w + 10, 2);
}
function crystal(c, cx, cy, s, col, fx) { // unoszący się kryształ z poświatą
  fillPoly(c, [[cx, cy - s * 1.6], [cx + s * 0.7, cy], [cx, cy + s], [cx - s * 0.7, cy]], col);
  fillPoly(c, [[cx, cy - s * 1.6], [cx, cy + s], [cx - s * 0.7, cy]], shadeHex(col, -0.25));
  if (fx) fx.glows.push([cx, cy, s * 3.5, col]);
}
function gear(c, cx, cy, r, col) {
  for (let i = 0; i < 8; i++) { c.save(); c.translate(cx, cy); c.rotate(i / 8 * TAU); c.fillStyle = col; c.fillRect(-1.5, -r - 2.5, 3, 3); c.restore(); }
  circ(c, cx, cy, r, col); circ(c, cx, cy, r * 0.4, shadeHex(col, -0.35));
}
function snowRock(c, x, b, w, h, seed) { rockMound(c, x, b, w, h, '#8a94a6', seed); c.fillStyle = 'rgba(244,248,255,.85)'; c.beginPath(); c.ellipse(x + w * 0.45, b - h * 0.8, w * 0.28, h * 0.14, 0, 0, TAU); c.fill(); }
function goldDome(c, cx, y, r, fx) { // złota kopuła z iglicą (podstawa y)
  c.fillStyle = '#d8a830'; c.beginPath(); c.moveTo(cx - r, y); c.quadraticCurveTo(cx - r, y - r * 1.2, cx, y - r * 1.4); c.quadraticCurveTo(cx + r, y - r * 1.2, cx + r, y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(cx, y - r * 1.4); c.quadraticCurveTo(cx + r, y - r * 1.2, cx + r, y); c.lineTo(cx, y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(244,248,255,.85)'; c.beginPath(); c.ellipse(cx - r * 0.2, y - r * 1.25, r * 0.4, r * 0.16, 0, 0, TAU); c.fill();
  c.strokeStyle = '#e0c060'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, y - r * 1.4); c.lineTo(cx, y - r * 1.4 - 8); c.stroke(); circ(c, cx, y - r * 1.4 - 9, 1.6, '#fff0a0');
  if (fx) fx.glows.push([cx, y - r * 0.7, r * 1.6, '#ffdc78']);
}
const ACADEMY_ART = {
  dw1(c, A, s, tier, col, fx) { // warsztat gremlinów: komin, koła zębate
    const { x, b, w, h } = s, bw = w * 0.6, top = b - h * 0.5; wallRect(c, A, x + 4, top, bw, h * 0.5);
    roofArt(c, A, A.roof.dw, x + 4, top, bw, h * 0.32); snowCap(c, x + 4, top, bw, h * 0.32);
    doorArt(c, A, x + 4 + bw / 2 - 7, b, 14, 18); c.fillStyle = '#3a3e48'; c.fillRect(x + 4 + bw * 0.75, top - h * 0.3, 7, h * 0.3); fx.smokes.push([x + 7.5 + bw * 0.75, top - h * 0.31]);
    gear(c, x + w * 0.8, b - h * 0.36, tier >= 2 ? 9 : 7, '#a0a4b0'); if (tier >= 2) gear(c, x + w * 0.93, b - h * 0.5, 5, '#c8a040');
    drawCreature(c, tier >= 2 ? 'masterGremlin' : 'gremlin', x + w * 0.86, b, 1, -1, 0);
  },
  dw2(c, A, s, tier, col, fx) { // parapet na kolumnach z gargulcami
    const { x, b, w, h } = s, top = b - h * (tier >= 2 ? 0.55 : 0.42);
    for (let i = 0; i < 4; i++) wallRect(c, A, x + 6 + i * (w - 20) / 3, top, 8, b - top);
    c.fillStyle = A.wall[0]; c.fillRect(x + 2, top - 6, w - 4, 6); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + 2, top - 1, w - 4, 1.5);
    c.fillStyle = 'rgba(244,248,255,.92)'; c.fillRect(x + 2, top - 7.5, w - 4, 2);
    drawCreature(c, tier >= 2 ? 'obsidianGargoyle' : 'stoneGargoyle', x + w * 0.3, top - 6, 0.9, 1, 0);
    drawCreature(c, 'stoneGargoyle', x + w * 0.72, top - 6, 0.9, -1, 0.5);
  },
  dw3(c, A, s, tier, col, fx) { // kuźnia golemów z błękitnym żarem
    const { x, b, w, h } = s, bw = w * 0.72, top = b - h * 0.55; wallRect(c, A, x + 2, top, bw, h * 0.55);
    roofArt(c, A, A.roof.dw, x + 2, top, bw, h * 0.3); snowCap(c, x + 2, top, bw, h * 0.3);
    c.fillStyle = '#10141c'; c.fillRect(x + 10, b - h * 0.4, bw * 0.6, h * 0.4); const gx = x + 10 + bw * 0.3; circ(c, gx, b - 6, 4, '#a0e0ff'); fx.glows.push([gx, b - 10, 22, '#80c8ff']);
    c.fillStyle = '#3a3e48'; c.fillRect(x + 2 + bw * 0.75, top - h * 0.3, 8, h * 0.3); fx.smokes.push([x + 6 + bw * 0.75, top - h * 0.31]);
    drawCreature(c, tier >= 2 ? 'ironGolem' : 'stoneGolem', x + w * 0.86, b, 0.9, -1, 0);
  },
  dw4(c, A, s, tier, col, fx) { // smukła wieża magów z kulą światła nad dachem
    const { x, b, w, h } = s, cx = x + w * 0.4, tw = w * 0.34, th = h * (tier >= 2 ? 0.78 : 0.66), glow = tier >= 2 ? '#e0a0ff' : '#80c0ff';
    magicTower(c, A, cx - tw / 2, b, tw, th, tier >= 2 ? '#5a2a8a' : A.roof.tower, fx, tier >= 2 ? '#e0a0ff' : null);
    const oy = b - th - tw * 1.3 - 12; circ(c, cx, oy, 4, glow); circ(c, cx - 1, oy - 1, 1.6, '#ffffff'); fx.glows.push([cx, oy, 18, glow]);
    drawCreature(c, tier >= 2 ? 'archMage' : 'mage', x + w * 0.82, b, 0.95, -1, 0);
  },
  dw5(c, A, s, tier, col, fx) { // ołtarz życzeń: stopnie, złota lampa, nad nią dżin
    const { x, b, w, h } = s, cx = x + w / 2;
    c.fillStyle = A.wall[1]; c.fillRect(cx - w * 0.36, b - 6, w * 0.72, 6); c.fillStyle = A.wall[0]; c.fillRect(cx - w * 0.28, b - 12, w * 0.56, 6); c.fillRect(cx - w * 0.14, b - 26, w * 0.28, 14);
    c.fillStyle = 'rgba(244,248,255,.9)'; c.fillRect(cx - w * 0.14, b - 27, w * 0.28, 1.6); if (tier >= 2) { c.fillStyle = '#e0c060'; c.fillRect(cx - w * 0.28, b - 12, w * 0.56, 1.5); }
    c.fillStyle = '#e0b040'; c.beginPath(); c.ellipse(cx, b - 29, 7, 2.6, 0, 0, TAU); c.fill(); fillPoly(c, [[cx + 5, b - 30], [cx + 12, b - 33], [cx + 11, b - 31], [cx + 6, b - 28]], '#c89a30');
    fx.glows.push([cx, b - 36, 26, '#80c0ff']); fx.smokes.push([cx + 11, b - 34, 0.5]);
    drawCreature(c, tier >= 2 ? 'masterGenie' : 'genie', cx + 2, b - 34, 0.8, -1, 0.3);
  },
  dw6(c, A, s, tier, col, fx) { // złoty pawilon na kolumnach, przed nim naga
    const { x, b, w, h } = s, cx = x + w * 0.42, pw = w * 0.6, top = b - h * 0.42;
    c.fillStyle = '#c8ccd4'; c.fillRect(cx - pw / 2 - 4, b - 5, pw + 8, 5);
    for (let i = 0; i < 4; i++) { const px = cx - pw / 2 + i * (pw - 6) / 3; c.fillStyle = '#ece8dc'; c.fillRect(px, top, 6, b - 5 - top); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(px + 4, top, 2, b - 5 - top); }
    c.fillStyle = '#c89a30'; c.fillRect(cx - pw / 2 - 3, top - 5, pw + 6, 5);
    goldDome(c, cx, top - 5, pw * 0.42, fx); if (tier >= 2) for (const dx of [-pw * 0.5, pw * 0.5]) goldDome(c, cx + dx, top - 5, pw * 0.13, null);
    drawCreature(c, tier >= 2 ? 'nagaQueen' : 'naga', x + w * 0.84, b, 0.9, -1, 0);
  },
  dw7(c, A, s, tier, col, fx) { // chmurna świątynia na ośnieżonej skale
    const { x, b, w, h } = s, cx = x + w * 0.45; snowRock(c, x, b, w * 0.9, h * 0.34, 61);
    const tb = b - h * 0.28, tw = w * 0.5, th = h * 0.34;
    c.fillStyle = A.wall[1]; c.fillRect(cx - tw / 2 - 4, tb - 4, tw + 8, 4);
    for (let i = 0; i < 5; i++) { const px = cx - tw / 2 + i * (tw - 5) / 4; c.fillStyle = '#eef0f4'; c.fillRect(px, tb - th, 5, th - 4); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(px + 3.5, tb - th, 1.5, th - 4); }
    c.fillStyle = A.wall[0]; c.fillRect(cx - tw / 2 - 4, tb - th - 4, tw + 8, 4); fillPoly(c, [[cx - tw / 2 - 6, tb - th - 4], [cx, tb - th - 18], [cx + tw / 2 + 6, tb - th - 4]], '#d8dce6');
    fillPoly(c, [[cx - tw / 2 - 6, tb - th - 4], [cx, tb - th - 18], [cx - tw * 0.1, tb - th - 12]], 'rgba(244,248,255,.95)');
    for (const [dx, r] of [[-0.5, 9], [-0.15, 11], [0.25, 10], [0.55, 8]]) circ(c, cx + dx * tw * 1.3, tb + 2, r, 'rgba(240,244,252,.8)');
    if (tier >= 2) { fx.glows.push([cx, tb - th - 10, 40, '#c0e0ff']); limb(c, cx + tw * 0.7, tb - th - 30, cx + tw * 0.6, tb - th - 18, 1.4, '#e0f0ff'); limb(c, cx + tw * 0.6, tb - th - 18, cx + tw * 0.72, tb - th - 12, 1.4, '#e0f0ff'); }
    drawCreature(c, tier >= 2 ? 'titan' : 'giant', x + w * 0.86, b, 0.78, -1, 0);
  },
};
BUILD_ART.academy = ACADEMY_ART;
// --- scena: zamarznięta rzeka, ośnieżone wzgórza, świerki w śniegu, sypiący śnieg ---
TOWN_LAYOUTS.academy = {
  sky: { top: '#1e2a44', mid: '#5a7098', hor: '#e0dcea', sun: [430, 120], cloudDark: 'rgba(90,100,130,.7)', cloudLit: 'rgba(240,236,250,.6)' },
  mountains: ['#a4b0c6', '#8894ac'], forest: ['#2c3c40', '#26363a', '#324448'],
  ground: ['#dfe6ee', '#c6d0dc', '#9eaabc'], haze: '#c8d4e4', desat: 0.12, tuft: ['rgba(80,100,130,.22)', 'rgba(255,255,255,.4)'],
  hills: [{ X: -260, Z: 2.1, rx: 360, h: 54, cols: ['#d4dce8', '#a8b4c6'] }, { X: 520, Z: 2.62, rx: 330, h: 90, cols: ['#b4bccc', '#7e889c'], rock: true }],
  river: { w: 70, cols: ['#c8dcec', '#7a98b8'], edge: 'rgba(250,252,255,.7)', pts: [[-820, 2.05], [-500, 1.82], [-250, 1.7], [-80, 1.63], [100, 1.6], [300, 1.64], [600, 1.75], [900, 1.9]] },
  roads: TOWN_LAYOUTS.haven.roads,
  plaza: { X: -40, Z: 1.27, r: 110 },
  bridge: { X: -200, Z: 1.665, w: 64 },
  slots: TOWN_LAYOUTS.haven.slots,
  props: [
    ['snowPine', -540, 1.78, 0, 1.3], ['snowPine', -470, 1.95, 0, 1.3], ['snowPine', -620, 2.25, 0, 1.4], ['snowPine', 380, 2.2, 0, 1.4], ['snowPine', 720, 2.1, 0, 1.4],
    ['snowPine', 660, 1.85, 0, 1.3], ['snowPine', -560, 1.3, 0, 1.2], ['snowPine', -470, 1.05, 0, 1.3], ['snowPine', 440, 1.06, 0, 1.2], ['snowPine', 400, 1.55, 0, 1.2], ['snowPine', 80, 2.45, 0, 1.3],
    ['iceCrystal', -150, 0.9], ['iceCrystal', 520, 1.4], ['iceCrystal', -330, 1.62], ['rock', 250, 1.62], ['lamp', -25, 0.82], ['lamp', -18, 0.9], ['lamp', 42, 1.06], ['lamp', -38, 1.1],
    ['fence', 330, 1.02], ['fence', -350, 1.0],
  ],
  walksW: [[[26, 0.82], [15, 0.9], [2, 1.02], [-12, 1.15], [-20, 1.26]], [[-100, 1.27], [-40, 1.28], [30, 1.27]]], walkCols: ['#3a4a9a', '#5a2a8a', '#6a6a74', '#2a5a7a'],
  guardsW: [[-262, 1.985, 42], [-218, 1.985, 42]], guardCol: '#3a4a8a',
  birds: true, birdCol: 'rgba(30,36,50,.8)', snow: true,
};
