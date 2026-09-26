// ==================== MAPA PRZYGODY: RENDEROWANIE =======================================
// Teren generowany piksel po pikselu, przeszkody, minimapa, mgła, obiekty, kamera.
// Przeszkody i ozdoby mapy rysowane ściankami (jasna od lewej góry, cień z prawej), jak ikony surowców.
const mpoly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
const mline = (g, pts, col, w = 2) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
// Korona z kęp liści: ciemna masa, jaśniejsze kępy przesunięte ku światłu, plamki słońca i dziury w listowiu
function leafCrown(g, clumps, pal, r) {
  for (const [cx, cy, R] of clumps) circ(g, cx, cy, R, pal[0]);
  for (const [cx, cy, R] of clumps) circ(g, cx - R * 0.2, cy - R * 0.22, R * 0.78, pal[1]);
  for (const [cx, cy, R] of clumps) if (cy < clumps[0][1] + 8) circ(g, cx - R * 0.4, cy - R * 0.42, R * 0.42, pal[2]);
  for (const [cx, cy, R] of clumps) {
    g.fillStyle = pal[3]; const a = -2.3 + r() * 0.9, d = R * (0.3 + r() * 0.3); g.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2, 2);
    g.fillStyle = pal[0]; g.fillRect(cx + R * (0.1 + r() * 0.4), cy + R * (0.15 + r() * 0.35), 2, 2);
  }
}
const OAK_PAL = [['#123414', '#24601e', '#4a9430', '#9ad056'], ['#1a3810', '#36601a', '#62922c', '#b8d04c'], ['#3a3010', '#645418', '#9a8028', '#e0bc4c']];
function drawOak(g, x, y, s, r = mulberry32(1)) {
  shadowAt(g, x, y, 10 * s);
  mpoly(g, [[x - 4 * s, y + 1], [x - 1.8 * s, y - 2 * s], [x - 1.5 * s, y - 11 * s], [x + 1.5 * s, y - 11 * s], [x + 1.8 * s, y - 2 * s], [x + 4 * s, y + 1]], '#3a2412');
  mpoly(g, [[x - 3 * s, y + 0.5], [x - 1.5 * s, y - 2 * s], [x - 1.4 * s, y - 11 * s], [x, y - 11 * s], [x - 0.2 * s, y]], '#6e4826');
  const pal = OAK_PAL[r() < 0.12 ? 2 : r() < 0.35 ? 1 : 0];
  const cl = [[0, -24, 7.5], [-7, -19, 7], [7, -18, 7], [-3, -13, 7], [5, -12, 6.5]].map(([dx, dy, R]) => [x + (dx + (r() - 0.5) * 2) * s, y + dy * s, R * s * (0.9 + r() * 0.2)]);
  leafCrown(g, cl, pal, r);
}
function drawPine(g, x, y, s, snowy, r = mulberry32(1)) { // świerk: trzy–cztery piętra ze ścianką jasną z lewej i ciemną z prawej
  shadowAt(g, x, y, 8 * s);
  mpoly(g, [[x - 1.7 * s, y + 1], [x - 1.4 * s, y - 8 * s], [x + 1.4 * s, y - 8 * s], [x + 1.7 * s, y + 1]], '#4a2e18'); mpoly(g, [[x - 1.7 * s, y + 1], [x - 1.4 * s, y - 8 * s], [x - 0.2 * s, y - 8 * s], [x - 0.3 * s, y + 1]], '#80563a');
  const tiers = 3 + (r() < 0.4 ? 1 : 0), step = tiers === 4 ? 6 : 7.5;
  for (let i = 0; i < tiers; i++) {
    const by = y - 5 * s - i * step * s, w = (11.5 - i * (tiers === 4 ? 2.3 : 3)) * s, top = by - (tiers === 4 ? 10 : 12) * s;
    mpoly(g, [[x, top], [x + w, by], [x + w * 0.45, by - 1.8 * s], [x, by + 0.8 * s], [x - w * 0.45, by - 1.8 * s], [x - w, by]], '#184a2a'); // bryła piętra
    mpoly(g, [[x, top], [x - w, by], [x - w * 0.45, by - 1.8 * s], [x - 0.3 * s, by - 0.6 * s]], '#3a8848'); // jasna ścianka
    mpoly(g, [[x - 0.3 * s, top + 2 * s], [x - w * 0.8, by - 0.8 * s], [x - w * 0.55, by - 2.6 * s]], '#72bc68'); // odblask
    mpoly(g, [[x + w * 0.2, by - 1 * s], [x + w, by], [x + w * 0.45, by - 1.8 * s]], '#0e3420'); // cień pod gałęziami
    if (snowy) { mpoly(g, [[x, top], [x - w * 0.6, by - 4.5 * s], [x - w * 0.2, by - 5.5 * s], [x + w * 0.15, by - 4 * s], [x + w * 0.55, by - 5 * s]], '#f4f8fc'); mpoly(g, [[x, top], [x + w * 0.15, by - 4 * s], [x + w * 0.55, by - 5 * s]], '#b8c6d8'); }
  }
}
function drawPalm(g, x, y, s, r = mulberry32(1)) {
  shadowAt(g, x, y, 7 * s);
  const tx = x + 3 * s, ty = y - 21 * s;
  for (let i = 0; i < 6; i++) { const f0 = i / 6, f1 = (i + 1) / 6, p = f => [x + 3 * s * Math.sin(f * 1.6), y - 21 * s * f]; const [ax, ay] = p(f0), [bx, by] = p(f1); mpoly(g, [[ax - 1.6 * s, ay], [bx - 1.3 * s, by], [bx + 1.3 * s, by], [ax + 1.6 * s, ay]], i % 2 ? '#8a6232' : '#6a4a24'); }
  for (const a of [-2.8, -2.2, -1.5, -0.8, -0.2, 0.4]) {
    const ex = tx + Math.cos(a) * 12 * s, ey = ty + Math.sin(a) * 9 * s + 5 * s, mx = tx + Math.cos(a) * 7 * s, my = ty + Math.sin(a) * 7 * s - 2 * s;
    mpoly(g, [[tx, ty], [mx, my - 1.8 * s], [ex, ey], [mx, my + 1.8 * s]], a < -1.2 ? '#4a9a3a' : '#2e6a26');
  }
  circ(g, tx - 1.5 * s, ty + 2 * s, 1.8 * s, '#5a3a1a'); circ(g, tx + 1.5 * s, ty + 2.5 * s, 1.8 * s, '#4a2e14');
}
function drawDeadTree(g, x, y, s, col, r = mulberry32(1)) {
  shadowAt(g, x, y, 6 * s); const lt = shadeHex(col, 0.45);
  mpoly(g, [[x - 2.5 * s, y + 1], [x - 1.2 * s, y - 17 * s], [x + 1.2 * s, y - 17 * s], [x + 2.5 * s, y + 1]], col);
  mpoly(g, [[x - 2 * s, y], [x - 1.2 * s, y - 16 * s], [x - 0.3 * s, y - 16 * s], [x - 0.6 * s, y]], lt);
  mline(g, [[x, y - 9 * s], [x - 6 * s, y - 15 * s], [x - 8 * s, y - 15 * s]], col, 1.6 * s); mline(g, [[x, y - 12 * s], [x + 6 * s, y - 18 * s], [x + 7 * s, y - 21 * s]], col, 1.5 * s);
  mline(g, [[x - 3 * s, y - 12 * s], [x - 7 * s, y - 11 * s]], col, 1.2 * s); mline(g, [[x + 3.5 * s, y - 15 * s], [x + 7 * s, y - 14 * s]], col, 1.1 * s);
}
// Zwęglone drzewo na lawie: szary pień z jaśniejszą krawędzią, żarzące się pęknięcia i rozżarzone końce gałęzi
function drawCharredTree(g, x, y, s, r = mulberry32(1)) {
  shadowAt(g, x, y, 7 * s); const c = '#4a3c38', lt = '#86706a', dk = '#261c1a';
  mpoly(g, [[x - 5 * s, y + 1], [x - 2 * s, y - 3 * s], [x + 2 * s, y - 3 * s], [x + 5 * s, y + 1]], '#2e2624'); // kopczyk popiołu
  mpoly(g, [[x - 2.6 * s, y], [x - 1.3 * s, y - 18 * s], [x + 1.3 * s, y - 18 * s], [x + 2.6 * s, y]], c);
  mpoly(g, [[x - 2.4 * s, y], [x - 1.3 * s, y - 17 * s], [x - 0.2 * s, y - 17 * s], [x - 0.8 * s, y]], lt); mpoly(g, [[x + 0.8 * s, y], [x + 0.6 * s, y - 17 * s], [x + 1.3 * s, y - 18 * s], [x + 2.6 * s, y]], dk);
  const side = r() < 0.5 ? 1 : -1, br = [[0, -10, -7, -16], [0, -13, 7, -20], [-0.5, -6, -5, -8], [0.5, -15, 5, -16]];
  for (const [a, b, c2, d] of br) { mline(g, [[x + a * s * side, y + b * s], [x + c2 * s * side, y + d * s]], c, 1.7 * s); g.fillStyle = '#ffb040'; g.fillRect(x + c2 * s * side - 1, y + d * s - 1, 2, 2); }
  mline(g, [[x - 0.3 * s, y - 2 * s], [x + 0.6 * s, y - 6 * s], [x - 0.4 * s, y - 9 * s], [x + 0.5 * s, y - 12 * s]], '#ff7a2a', 1.2 * s); // żar w pęknięciu
  g.fillStyle = '#ffd060'; g.fillRect(x, y - 6 * s, 1.6, 1.6);
}
function drawWillow(g, x, y, s, r = mulberry32(1)) {
  shadowAt(g, x, y, 9 * s);
  mpoly(g, [[x - 3 * s, y + 1], [x - 1.5 * s, y - 10 * s], [x + 1.5 * s, y - 10 * s], [x + 3 * s, y + 1]], '#3a2a18'); g.fillStyle = '#5e4628'; g.fillRect(x - 1.5 * s, y - 10 * s, 1.2 * s, 10 * s);
  leafCrown(g, [[x, y - 17 * s, 7 * s], [x - 6 * s, y - 14 * s, 6 * s], [x + 6 * s, y - 14 * s, 6 * s]], ['#1e3418', '#2e4a24', '#46663a', '#7a9a58'], r);
  for (let k = -3; k <= 3; k++) mline(g, [[x + k * 2.6 * s, y - 14 * s], [x + k * 3.2 * s, y - 9 * s], [x + k * 3 * s, y - 3 * s - (k & 1) * 2 * s]], k < 0 ? '#5a7a40' : '#3a5a2c', 1.4 * s);
}
// Góry: [jasna ściana, środek, cień, głęboki cień]; mocny kontrast, bo mapa jest potem przygaszana (GRADE)
const MOUNT_PAL = { def: ['#dccaa6', '#9c8a6e', '#5c5244', '#342c24'], snow: ['#ffffff', '#b8c4d2', '#74829a', '#46506a'], lava: ['#806a5c', '#50403a', '#2a201c', '#120c0a'], sand: ['#f8dca0', '#c49860', '#865e38', '#553a22'] };
function mountPeak(g, bx, by, bw, h, tx, pal, r, snow, lava) {
  const ty = by - h, lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], j = k => (r() - 0.5) * k;
  const BL = [bx - bw, by], BR = [bx + bw, by], P = [tx, ty];
  const left = [0.22, 0.45, 0.7, 0.86].map(f => { const p = lerp2(BL, P, f); return [p[0] + j(5), p[1] + j(5)]; });
  const right = [0.86, 0.7, 0.45, 0.22].map(f => { const p = lerp2(BR, P, f); return [p[0] + j(5), p[1] + j(5)]; });
  const ridge = [0.2, 0.42, 0.66, 1].map(f => [tx + f * bw * 0.22 + j(5), ty + h * f]);
  mpoly(g, [BL, ...left, P, ...right, BR], pal[2]); // cała bryła w cieniu
  mpoly(g, [P, ...left.slice().reverse(), BL, ...ridge.slice().reverse()], pal[0]); // jasna ściana od lewej
  mpoly(g, [P, ...ridge, [ridge[3][0] - bw * 0.3, by], [ridge[2][0] - bw * 0.2, ridge[2][1]], [ridge[1][0] - bw * 0.1, ridge[1][1]]], pal[1]); // przełamanie przy grani
  mpoly(g, [right[1], right[2], right[3], BR, [bx + bw * 0.45, by], [ridge[2][0] + bw * 0.3, ridge[2][1] + 4]], pal[3]); // głęboki cień
  for (let i = 0; i < 3; i++) { const a = lerp2(left[1 + (i & 1)], ridge[1 + (i >> 1)], 0.25 + r() * 0.35); mline(g, [a, [a[0] + 3, a[1] + 5], [a[0] + 2, a[1] + 10]], pal[1], 2); } // żleby
  for (let i = 0; i < 2; i++) { const a = lerp2(ridge[1 + i], right[1 + i], 0.35 + r() * 0.3); mline(g, [a, [a[0] + 5, a[1] + 3]], pal[1], 2); }
  if (snow) {
    const sL = left[2], sR = right[1], m1 = lerp2(sL, P, 0.3), m2 = lerp2(ridge[1], P, 0.25);
    mpoly(g, [P, left[3], sL, [m1[0] + 3, m1[1] + 4], [m2[0] - 2, m2[1] + 3], [ridge[1][0] + 1, ridge[1][1] - 2], [sR[0] - 2, sR[1] - 3], sR, right[0]], '#f6f9fc');
    mpoly(g, [P, [ridge[1][0] + 1, ridge[1][1] - 2], [sR[0] - 2, sR[1] - 3], sR, right[0]], '#aebed2');
  }
  if (lava) { mline(g, [[tx, ty + 3], [tx - 2, ty + 12], [tx + 1, ty + 20], [tx - 1, ty + 28]], '#ff7a2a', 2.4); g.fillStyle = '#ffd060'; g.fillRect(tx - 2, ty + 11, 2, 2); }
}
// Mały głaz ze ściankami (też u stóp gór)
function boulder(g, x, y, k, pal) {
  const P = (a, b) => [x + a * k, y + b * k];
  mpoly(g, [P(-9, 0), P(-7, -8), P(-1, -11), P(7, -8), P(9, -1), P(4, 2), P(-5, 2)], pal[1]);
  mpoly(g, [P(-7, -8), P(-1, -11), P(7, -8), P(1, -5), P(-4, -4)], pal[0]);
  mpoly(g, [P(1, -5), P(7, -8), P(9, -1), P(4, 2), P(2, -1)], pal[2]);
}
function drawMountain(g, px, py, t, r) {
  const pal = t === TER.SNOW ? MOUNT_PAL.snow : t === TER.LAVA ? MOUNT_PAL.lava : t === TER.SAND ? MOUNT_PAL.sand : MOUNT_PAL.def;
  const big = r() < 0.3, bw = (big ? 26 : 18) + r() * 8, h = (big ? 44 : 26) + r() * 12, bx = px + (r() - 0.5) * 10, by = py + 12 + r() * 4, tx = bx + (r() - 0.5) * bw * 0.6;
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(bx + 5, by, bw + 2, 6, 0, 0, TAU); g.fill();
  if (r() < 0.6) { const side = r() < 0.5 ? -1 : 1, sw = bw * 0.6; mountPeak(g, bx + side * bw * 0.55, by - 3, sw, h * 0.62, bx + side * bw * 0.6 + (r() - 0.5) * 6, pal, r, t === TER.SNOW, false); }
  mountPeak(g, bx, by, bw, h, tx, pal, r, t === TER.SNOW || (pal === MOUNT_PAL.def && h > 40), t === TER.LAVA);
  const n = 1 + Math.floor(r() * 3); for (let i = 0; i < n; i++) boulder(g, bx + (r() - 0.5) * bw * 1.6, by + 1 + r() * 3, 0.35 + r() * 0.2, pal);
}
const ROCK_PAL = { def: ['#aaa394', '#77716a', '#4e4942'], snow: ['#dfe6ee', '#9aa6b4', '#66727f'], lava: ['#5a4a42', '#3a2e2a', '#1e1714'], sand: ['#d8b684', '#a88658', '#76583a'] };
function drawRock(g, x, y, r, t = TER.GRASS) {
  const pal = t === TER.SNOW ? ROCK_PAL.snow : t === TER.LAVA ? ROCK_PAL.lava : t === TER.SAND ? ROCK_PAL.sand : ROCK_PAL.def, k = 0.85 + r() * 0.3;
  shadowAt(g, x, y + 1, 9 * k); boulder(g, x, y, k, pal);
  mline(g, [[x - 5 * k, y - 2 * k], [x - 2 * k, y - 4 * k], [x, y - 2 * k]], pal[2], 1.6);
  if (t === TER.GRASS || t === TER.SWAMP || t === TER.DIRT) { mpoly(g, [[x - 5 * k, y - 8 * k], [x - 1 * k, y - 10.5 * k], [x + 3 * k, y - 8.5 * k], [x - 1 * k, y - 7 * k]], '#5a7a34'); g.fillStyle = '#86a848'; g.fillRect(x - 2 * k, y - 10 * k, 2, 2); }
  if (r() < 0.6) boulder(g, x + 9 * k, y + 2, 0.4, pal);
}
function drawObstacle(g, o, t, px, py, r) {
  if (o === OBST.MOUNT) return drawMountain(g, px, py, t, r);
  if (o === OBST.ROCK) return drawRock(g, px + (r() - 0.5) * 8, py + 6, r, t);
  const spots = [[(r() - 0.5) * 8, -2], [-8 + (r() - 0.5) * 4, 9], [8 + (r() - 0.5) * 4, 10]], cnt = r() < 0.3 ? 2 : 3;
  for (let k = 0; k < cnt; k++) {
    const x = px + spots[k][0], y = py + spots[k][1], s = 0.8 + r() * 0.3;
    if (t === TER.SNOW || t === TER.ROUGH) drawPine(g, x, y, s, t === TER.SNOW, r);
    else if (t === TER.SAND) drawPalm(g, x, y, s, r);
    else if (t === TER.LAVA) drawCharredTree(g, x, y, s, r);
    else if (t === TER.SWAMP) { if (r() < 0.5) drawDeadTree(g, x, y, s, '#2e2618', r); else drawWillow(g, x, y, s, r); }
    else if (t === TER.DIRT && r() < 0.5) drawPine(g, x, y, s, false, r);
    else drawOak(g, x, y, s, r);
  }
}
// Drobne ozdoby na pustych polach (kępki trawy, kwiaty, kamyki, trzcina, grzyby, żar): tylko wygląd, nie blokują ruchu
function drawDecor(g, t, v) {
  const tuft = (x, y, a, b) => { mline(g, [[x - 3, y], [x - 5, y - 6]], a); mline(g, [[x, y], [x, y - 8]], b); mline(g, [[x + 3, y], [x + 5, y - 5]], a); };
  const pebbles = pal => { boulder(g, -3, 2, 0.35, pal); boulder(g, 4, 3, 0.25, pal); };
  const GR = ['#4a8a30', '#78b848'], DRY = ['#9a8a40', '#ccb45a'];
  if (t === TER.GRASS) [() => tuft(0, 4, ...GR), () => { tuft(0, 4, ...GR); for (const [x, y, c] of [[-4, -3, '#e8d040'], [1, -5, '#f4f4f0'], [5, -2, '#d84a3a']]) { g.fillStyle = c; g.fillRect(x, y, 2.4, 2.4); } }, () => pebbles(ROCK_PAL.def), () => { circ(g, 0, 0, 5, '#24561f'); circ(g, -1, -1, 3.6, '#3c7c2c'); g.fillStyle = '#d84a3a'; g.fillRect(1, -2, 2, 2); }][v](); // krzaczek z owocem
  else if (t === TER.DIRT || t === TER.ROUGH) [() => tuft(0, 4, ...DRY), () => pebbles(ROCK_PAL.def), () => { tuft(-3, 4, ...DRY); boulder(g, 5, 4, 0.3, ROCK_PAL.def); }, () => mline(g, [[-6, 3], [0, 1], [5, 2], [7, -1]], '#5a4028', 1.6)][v]();
  else if (t === TER.SAND) [() => pebbles(ROCK_PAL.sand), () => { mpoly(g, [[-1.5, 4], [-1.5, -7], [1.5, -7], [1.5, 4]], '#4a8a3a'); mpoly(g, [[-1.5, -1], [-5, -2], [-5, -5], [-3.5, -5], [-3.5, -3], [-1.5, -3]], '#4a8a3a'); g.fillStyle = '#7ab85a'; g.fillRect(-1.5, -7, 1.2, 10); }, () => tuft(0, 4, ...DRY), () => { mline(g, [[-5, 2], [4, 0]], '#eee6d0', 2); circ(g, 5, -0.5, 1.6, '#eee6d0'); }][v](); // kaktus, kość
  else if (t === TER.SNOW) [() => pebbles(ROCK_PAL.snow), () => tuft(0, 4, '#8a8a6a', '#aaa888'), () => { mpoly(g, [[-6, 3], [-3, -2], [3, -3], [7, 3]], '#ffffff'); mpoly(g, [[3, -3], [7, 3], [1, 3]], '#c8d4e4'); }, () => pebbles(ROCK_PAL.snow)][v]();
  else if (t === TER.SWAMP) [() => { for (const dx of [-3, 0, 3]) { mline(g, [[dx, 4], [dx + dx * 0.3, -7]], '#4a6a34', 1.4); mpoly(g, [[dx - 1, -4], [dx + 1, -4], [dx + 1, -9], [dx - 1, -9]], '#6a4424'); } }, () => { for (const [x, c] of [[-3, '#c83a2a'], [3, '#b8a060']]) { g.fillStyle = '#e8e0cc'; g.fillRect(x - 0.8, -1, 1.6, 4); mpoly(g, [[x - 3, -1], [x, -4], [x + 3, -1]], c); } }, () => tuft(0, 4, '#3a5a2c', '#5a7a40'), () => pebbles(ROCK_PAL.def)][v]();
  else if (t === TER.LAVA) [() => pebbles(ROCK_PAL.lava), () => { pebbles(ROCK_PAL.lava); g.fillStyle = '#ff7a2a'; g.fillRect(-3, 0, 2, 2); g.fillStyle = '#ffd060'; g.fillRect(4, 1, 2, 2); }, () => { mpoly(g, [[-2, 3], [0, -6], [2, 3]], '#ff7a2a'); mpoly(g, [[-0.5, 3], [0, -3], [0.8, 3]], '#ffd060'); }, () => pebbles(ROCK_PAL.lava)][v]();
}
// --- teren generowany piksel po pikselu ---
// Palety pikselowe (RGB) wyliczone z danych TERRAINS/ROADS
const TPAL = TERRAINS.map(t => t.pal.map(hexRgb));
const RPAL = ROADS.map(r => r && r.pal.map(hexRgb));
// Korekcja barw całej mapy: przyciemnienie (mnożenie) i odbarwienie. Minimapa używa tych samych liczb,
// żeby jej kolory odpowiadały temu, co widać na mapie.
const GRADE = { mul: '#b4b0a8', desat: 0.32 };
function gradeRgb([r, g, b]) {
  const [mr, mg, mb] = hexRgb(GRADE.mul); r *= mr / 255; g *= mg / 255; b *= mb / 255;
  const l = 0.3 * r + 0.59 * g + 0.11 * b, d = GRADE.desat;
  return [r + (l - r) * d, g + (l - g) * d, b + (l - b) * d];
}
const PC = Object.fromEntries(Object.entries({ foam: '#dcecf2', sh1: '#4c8ac2', sh2: '#3a78b4', flY: '#f3df70', flW: '#f6f2ea', white: '#ffffff', rim: '#6a8a5a', reed: '#7a8a44', hot: '#ff8a2a', warm: '#a8401a', edge: '#4e3a22', void: '#000000' }).map(([k, v]) => [k, hexRgb(v)]));
const RING = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [2, 0, 2], [-2, 0, 2], [0, 2, 2], [0, -2, 2], [2, 2, 3], [-2, 2, 3], [2, -2, 3], [-2, -2, 3], [4, 0, 4], [-4, 0, 4], [0, 4, 4], [0, -4, 4], [3, 3, 4], [-3, 3, 4], [3, -3, 4], [-3, -3, 4]];
function segDist(px, py, s) {
  const dx = s[2] - s[0], dy = s[3] - s[1], L = dx * dx + dy * dy, t = L ? clamp(((px - s[0]) * dx + (py - s[1]) * dy) / L, 0, 1) : 0;
  const ex = s[0] + dx * t - px, ey = s[1] + dy * t - py; return Math.sqrt(ex * ex + ey * ey);
}
function roadColor(t, ax, ay, hh) {
  const P = RPAL[t];
  if (t === 3) { const row = (ay / 3) | 0, mortar = ay % 3 === 0 || ((ax + (row & 1) * 2) % 4) === 0; return mortar ? P[0] : (hh < 0.4 ? P[2] : P[1]); }
  if (t === 2) return hh < 0.18 ? P[0] : hh < 0.36 ? P[2] : P[1];
  return hh < 0.08 ? P[0] : hh > 0.93 ? P[2] : P[1];
}
function landColor(t, ax, ay, hh) {
  const P = TPAL[t], bnd = vnoise2(ax / 5, ay / 5, 31 + t); let col = bnd < 0.3 ? P[0] : bnd > 0.7 ? P[2] : P[1];
  switch (t) {
    case TER.GRASS: if (hh < 0.02) col = P[3]; else if (hh < 0.035) col = P[0]; else if (hh > 0.997) col = PC.flY; else if (hh > 0.994) col = PC.flW; break;
    case TER.DIRT: if (hh < 0.03) col = P[3]; else if (hh > 0.985) col = P[2]; break;
    case TER.SAND: if (((ay + Math.floor(vnoise2(ax / 9, ay / 9, 5) * 8)) % 6) === 0 && hh < 0.6) col = P[2]; else if (hh < 0.025) col = P[3]; break;
    case TER.SNOW: if (hh < 0.015) col = P[3]; else if (hh > 0.99) col = PC.white; break;
    case TER.SWAMP: { const pv = vnoise2(ax / 4, ay / 4, 41); if (pv > 0.7) col = P[3]; else if (pv > 0.66) col = PC.rim; else if (hh < 0.02) col = PC.reed; break; }
    case TER.ROUGH: if (hh < 0.035) col = P[3]; else if (hh > 0.985) col = P[2]; break;
    case TER.LAVA: { const cr = Math.abs(vnoise2(ax / 6, ay / 6, 51) - 0.5); if (cr < 0.03) col = PC.hot; else if (cr < 0.05) col = PC.warm; break; }
  }
  return col;
}
function renderChunkPixel(map, cx, cy) {
  const n = map.n, S = CHUNK * AP, M = 5, R = S + 2 * M, bx = cx * S, by = cy * S, lim = n * AP, tid = new Uint8Array(R * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
    const ax = bx + x - M, ay = by + y - M, jx = (vnoise2(ax / 7, ay / 7, 11) - 0.5) * 9, jy = (vnoise2(ax / 7, ay / 7, 23) - 0.5) * 9;
    tid[y * R + x] = map.terrain[clamp(Math.floor((ay + jy) / AP), 0, n - 1) * n + clamp(Math.floor((ax + jx) / AP), 0, n - 1)];
  }
  const TT = (x, y) => tid[(y + M) * R + x + M], rd = map.road, at = (x, y) => (x >= 0 && y >= 0 && x < n && y < n) ? rd[y * n + x] : 0;
  const segs = [], x0 = cx * CHUNK - 1, y0 = cy * CHUNK - 1;
  for (let y = y0; y <= y0 + CHUNK + 1; y++) for (let x = x0; x <= x0 + CHUNK + 1; x++) {
    const t = at(x, y); if (!t) continue; const px = x * AP + 8 - bx, py = y * AP + 8 - by; let any = false;
    for (let d = 0; d < 8; d++) { const dx = DX8[d], dy = DY8[d]; if (!at(x + dx, y + dy) || (dx && dy && (at(x + dx, y) || at(x, y + dy)))) continue; segs.push([px, py, px + dx * 8, py + dy * 8, t]); any = true; }
    if (!any) segs.push([px, py, px, py, t]);
  }
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  const wm = new Uint8Array(S * S); let wet = false; // maska wody: 1 = głębia (fale), 2 = pas przy brzegu (piana)
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const k = (py * S + px) * 4, ax = bx + px, ay = by + py; let col;
    if (ax >= lim || ay >= lim) col = PC.void;
    else {
      const t = TT(px, py), hh = thash(ax, ay, 77) / 4294967296;
      if (t === TER.WATER) {
        let near = 9; for (const r of RING) if (TT(px + r[0], py + r[1]) !== TER.WATER) { near = r[2]; break; }
        wm[py * S + px] = near <= 2 ? 2 : 1; wet = true;
        if (near === 1) col = PC.foam; else if (near === 2) col = PC.sh1; else if (near <= 4) col = PC.sh2;
        else { const P = TPAL[0]; col = vnoise2(ax / 8, ay / 8, 61) < 0.33 ? P[0] : P[1]; if ((thash(ax >> 2, ay, 71) % 100) < 3 && (ax & 3) !== 3) col = P[2]; else if (hh > 0.998) col = P[3]; }
      } else {
        col = landColor(t, ax, ay, hh);
        const below = TT(px, py + 1); if (below !== t && below !== TER.WATER) col = TPAL[t][0];
      }
      if (segs.length) {
        let best = 99, bt = 0;
        for (const s of segs) { if (Math.abs(px - s[0]) > 14 || Math.abs(py - s[1]) > 14) continue; const dd = segDist(px + 0.5, py + 0.5, s); if (dd < best) { best = dd; bt = s[4]; } }
        if (best <= 4.3) wm[py * S + px] = 0;
        if (best <= 3.3) col = roadColor(bt, ax, ay, hh); else if (best <= 4.3) col = PC.edge;
      }
    }
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // ozdoby: pola bez przeszkody, drogi i obiektu; teren sprawdzany w miejscu ozdoby (brzegi terenu są poszarpane)
  const oa = G.state && G.state.map === map ? G.state.objAt : null;
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y0 + CHUNK + 1); y++) for (let x = Math.max(0, x0); x <= Math.min(n - 1, x0 + CHUNK + 1); x++) {
    const i = y * n + x, h = thash(x, y, map.seed + 5); if (map.obst[i] || rd[i] || (oa && oa[i]) || h % 100 >= 22) continue;
    const lx = x * AP + 8 - bx + ((h >>> 8) % 9) - 4, ly = y * AP + 8 - by + ((h >>> 12) % 7) - 3, t = map.terrain[i];
    if (t === TER.WATER || lx < -M || ly < -M || lx >= S + M || ly >= S + M || TT(lx, ly) !== t) continue;
    const s = decorSprite(t, (h >>> 16) % 4); g.drawImage(s.c, lx - s.ax, ly - s.ay);
  }
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y0 + CHUNK + 2); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(n - 1, x0 + CHUNK + 2); x++) {
    const o = map.obst[y * n + x]; if (!o) continue;
    const s = obstacleSprite(o, map.terrain[y * n + x], thash(x, y, map.seed + 2) % (o === OBST.TREE ? 4 : 8)); // góry i skały: 8 wariantów, żeby pasmo nie wyglądało jak wzór
    g.drawImage(s.c, x * AP + 8 - bx - s.ax, y * AP + 8 - by - s.ay);
  }
  gradeCanvas(c, bx, by);
  if (wet) { // maski do animacji wody (WaterFx); przeszkody stojące nad wodą (drzewa, góry przy brzegu) ją zasłaniają
    const mk = v => { const m = document.createElement('canvas'); m.width = m.height = S; const mg = m.getContext('2d'), mi = mg.createImageData(S, S);
      for (let i = 0; i < S * S; i++) if (wm[i] === v) mi.data[i * 4 + 3] = 255; mg.putImageData(mi, 0, 0); mg.globalCompositeOperation = 'destination-out';
      for (let y = Math.max(0, y0); y <= Math.min(n - 1, y0 + CHUNK + 2); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(n - 1, x0 + CHUNK + 2); x++) {
        const o = map.obst[y * n + x]; if (!o) continue; const s = obstacleSprite(o, map.terrain[y * n + x], thash(x, y, map.seed + 2) % (o === OBST.TREE ? 4 : 8)); mg.drawImage(s.c, x * AP + 8 - bx - s.ax, y * AP + 8 - by - s.ay);
      }
      return m; };
    c._deep = mk(1); c._shore = mk(2);
  }
  return c;
}
// Żywa woda: po głębi płyną dwie warstwy błysków fal (w przeciwnych kierunkach), pas przy brzegu pulsuje pianą.
// Rysowane co klatkę na gotowy fragment mapy, przycięte jego maskami; wzór jest ciągły między fragmentami.
const WaterFx = {
  pat: null, tmp: null,
  pattern() {
    if (this.pat) return this.pat; const P = 48, c = document.createElement('canvas'); c.width = c.height = P; const g = c.getContext('2d'), r = mulberry32(4242);
    for (let k = 0; k < 16; k++) { // krótkie łuki fal: jasny grzbiet i ciemniejszy cień pod nim
      const x = Math.floor(r() * P), y = Math.floor(r() * P), w = 3 + Math.floor(r() * 4);
      for (let i = 0; i < w; i++) { const yy = y - (i > 0 && i < w - 1 ? 1 : 0); g.fillStyle = k % 4 ? '#8cb6da' : '#d4eaf6'; g.fillRect((x + i) % P, (yy + P) % P, 1, 1); g.fillStyle = '#1e3e66'; g.fillRect((x + i) % P, (yy + 1 + P) % P, 1, 1); }
    }
    return this.pat = gradeCanvas(c); // kolory fal po tej samej korekcji co teren
  },
  draw(b, ch, dx, dy, size, wx, wy) {
    if (!ch._deep || G.settings.quality === 'low') return; const S = ch.width, t = G.time; // fale na wodzie: nie przy niskiej jakości
    const tmp = this.tmp || (this.tmp = document.createElement('canvas')); if (tmp.width !== S) { tmp.width = tmp.height = S; }
    const g = tmp.getContext('2d'), pat = g.createPattern(this.pattern(), 'repeat');
    const layer = (ox, oy, a) => { g.save(); g.globalAlpha = a; g.translate(ox, oy); g.fillStyle = pat; g.fillRect(-ox, -oy, S, S); g.restore(); };
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S);
    layer(Math.floor(t * 4) - wx, Math.floor(t * 1.5) - wy, 0.5 + 0.2 * Math.sin(t * 1.3));
    layer(-Math.floor(t * 3) - wx + 21, Math.floor(t * 2) - wy + 13, 0.35 + 0.2 * Math.sin(t * 1.7 + 2));
    g.globalCompositeOperation = 'destination-in'; g.drawImage(ch._deep, 0, 0);
    b.drawImage(tmp, dx, dy, size, size);
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S); g.fillStyle = this.foam || (this.foam = `rgb(${gradeRgb(hexRgb('#eef8fc')).map(Math.round).join(',')})`); g.globalAlpha = 0.22 + 0.2 * Math.sin(t * 2.2); g.fillRect(0, 0, S, S); g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-in'; g.drawImage(ch._shore, 0, 0); g.globalCompositeOperation = 'source-over';
    b.drawImage(tmp, dx, dy, size, size);
  },
};
// Minimapa: 1 piksel na pole, kolory bazowe z palety terenu po korekcji barw mapy
function buildMinimap(map, ex) {
  const n = map.n, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  const ter = TPAL.map(p => gradeRgb(p[1])), obst = TPAL.map(p => gradeRgb(p[0]).map(v => v * 0.62)), road = RPAL.map(p => p && gradeRgb(p[1]));
  for (let i = 0; i < n * n; i++) {
    const [r, gg, b] = (ex && !ex[i]) ? [0, 0, 0] : map.obst[i] ? obst[map.terrain[i]] : map.road[i] ? road[map.road[i]] : ter[map.terrain[i]];
    const o = i * 4; img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}
// Pamięć podręczna wyrenderowanych fragmentów mapy (8×8 pól)
const MapRender = {
  map: null, explored: null, cache: new Map(), fog: new Map(), mini: null, miniDirty: false,
  reset(map, explored) { this.map = map; this.explored = explored || null; this.cache.clear(); this.fog.clear(); this.mini = null; },
  // Gotowy kawałek terenu; nowy powstaje tylko, gdy pozwala na to budżet czasu klatki (allow), inaczej null (zastępczy rysunek)
  get(cx, cy, allow = true) {
    const key = cx + ',' + cy; let c = this.cache.get(key);
    if (c) { this.cache.delete(key); this.cache.set(key, c); return c; }
    if (!allow) return null;
    c = renderChunkPixel(this.map, cx, cy); this.cache.set(key, c);
    if (this.cache.size > 160) this.cache.delete(this.cache.keys().next().value);
    return c;
  },
  has(cx, cy) { return this.cache.has(cx + ',' + cy); },
  // Zastępczy kawałek: pola w kolorach minimapy (jeden prostokąt na pole), rysowany, gdy prawdziwy jeszcze nie powstał
  placeholder(b, cx, cy, x, y) {
    const map = this.map, n = map.n, pal = this._pal || (this._pal = TPAL.map(p => `rgb(${gradeRgb(p[1]).map(Math.round).join(',')})`));
    for (let ty = cy * CHUNK; ty < Math.min(n, cy * CHUNK + CHUNK); ty++) for (let tx = cx * CHUNK; tx < Math.min(n, cx * CHUNK + CHUNK); tx++) {
      b.fillStyle = pal[map.terrain[ty * n + tx]]; b.fillRect(x + (tx - cx * CHUNK) * T, y + (ty - cy * CHUNK) * T, T, T);
    }
  },
  miniCanvas() { if (!this.mini || this.miniDirty) { this.mini = buildMinimap(this.map, this.explored); this.miniDirty = false; } return this.mini; },
};
const VIEW = { x: 8, y: 8, w: 576, h: 552 }, MINI = { x: 624, y: 24, s: 144 };
const LIST = { x: 600, y: 262, w: 196, h: 186 }, INFOBOX = { x: 600, y: 456, w: 196, h: 108 };
// Układ mapy przygody zależy od rozmiaru okna (VW×VH): mapa zajmuje wszystko poza panelem po prawej,
// panel i pasek surowców trzymają się prawej i dolnej krawędzi, a lista bohaterów i miast rośnie z wysokością.
const LIST_ROW_H = 48; let LIST_ROWS = 3;
function layoutAdventure() {
  const dx = VW - W, dy = VH - H;
  VIEW.w = 576 + dx; VIEW.h = 552 + dy; MINI.x = 624 + dx;
  LIST.x = 600 + dx; LIST.h = 186 + dy; INFOBOX.x = 600 + dx; INFOBOX.y = 456 + dy;
  LIST_ROWS = Math.floor((LIST.h - 6) / LIST_ROW_H);
}
function camClamp(st) { const m = st.map.n * T; st.cam.x = clamp(st.cam.x, -T, m - VIEW.w + T); st.cam.y = clamp(st.cam.y, -T, m - VIEW.h + T); }
function centerCam(st, tx, ty) { st.cam = { x: tx * T + T / 2 - VIEW.w / 2, y: ty * T + T / 2 - VIEW.h / 2 }; camClamp(st); }
function screenToTile(st, x, y) { return { tx: Math.floor((x - VIEW.x + st.cam.x) / T), ty: Math.floor((y - VIEW.y + st.cam.y) / T) }; }
function drawFog(ctx, st, ox, oy, camX, camY) {
  const n = st.map.n, ex = human(st).explored;
  const tx0 = Math.max(0, Math.floor(camX / T) - 1), ty0 = Math.max(0, Math.floor(camY / T) - 1);
  const tx1 = Math.min(n - 1, Math.floor((camX + VIEW.w) / T) + 1), ty1 = Math.min(n - 1, Math.floor((camY + VIEW.h) / T) + 1);
  for (const [alpha, extra] of [[0.45, 7], [1, 0]]) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`; ctx.beginPath(); let any = false;
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      if (ex[y * n + x]) continue; any = true;
      const r0 = T * 0.72 + (thash(x, y, 3) % 4) + extra, px = ox + x * T + 16, py = oy + y * T + 16;
      ctx.moveTo(px + r0, py); ctx.arc(px, py, r0, 0, TAU);
    }
    if (any) ctx.fill();
  }
}
// Znaczniki: miasta (duże) i kopalnie w kolorze właściciela, bohaterowie jasni, ramka = widoczny fragment mapy
function drawMinimap(ctx, st) {
  const map = st.map, n = map.n, k = MINI.s / (n * T), ex = human(st).explored, sc = MINI.s / n;
  const mark = (x, y, c, s) => { // x, y = środek w polach
    const sx = Math.round(MINI.x + x * sc - s / 2), sy = Math.round(MINI.y + y * sc - s / 2);
    ctx.fillStyle = '#000'; ctx.fillRect(sx - 1, sy - 1, s + 2, s + 2); ctx.fillStyle = c; ctx.fillRect(sx, sy, s, s);
  };
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(MapRender.miniCanvas(), MINI.x, MINI.y, MINI.s, MINI.s); ctx.imageSmoothingEnabled = true;
  ctx.beginPath(); ctx.rect(MINI.x, MINI.y, MINI.s, MINI.s); ctx.clip();
  for (const ob of st.objects) {
    if (ob.dead || !ex[ob.y * n + ob.x]) continue;
    if (ob.type === 'mine') mark(ob.x, ob.y, ownerColor(st, ob.owner), 4);          // kopalnia: pola x-1..x, y-1..y
    else if (ob.type === 'town') mark(ob.x + 0.5, ob.y, ownerColor(st, ob.owner), 6); // miasto: pola x-1..x+1, y-1..y
  }
  for (const h of st.heroes) if (h.owner === ME) mark(h.x + 0.5, h.y + 0.5, h === hero(st) ? '#fff4c8' : '#c8bc98', 4);
  ctx.strokeStyle = '#fff4c8'; ctx.lineWidth = 1.2; ctx.strokeRect(MINI.x + st.cam.x * k, MINI.y + st.cam.y * k, VIEW.w * k, VIEW.h * k);
  ctx.restore();
}
// --- świat w trybie pikselowym ---
function drawPathPixel(b, st, h, ox, oy) {
  if (!h.path || !h.path.length) return; let mp = h.mp, px = h.x, py = h.y;
  h.path.forEach(([x, y], k) => {
    mp -= stepCost(st.map, px, py, x, y, h); const col = mp >= 0 ? '#3ad14c' : '#e03a3a', last = k === h.path.length - 1;
    blitG(b, last ? markSprite(col, 'x', 0) : markSprite(col, h.path[k + 1][0] - x, h.path[k + 1][1] - y), ox + x * T + 16, oy + y * T + 16); px = x; py = y;
  });
}
// Mgła wojny w kawałkach 8×8 pól (jak teren): kółka nad nieodkrytymi polami, progowanie alfy na twardą krawędź
// z ditheringiem w szachownicę. Kawałek przelicza się tylko wtedy, gdy zmieni się odkrycie pól w nim i wokół niego.
function fogChunk(ex, n, cx, cy) {
  const S = CHUNK * AP, x0 = cx * CHUNK - 1, y0 = cy * CHUNK - 1, x1 = x0 + CHUNK + 1, y1 = y0 + CHUNK + 1; let sig = 0, any = false;
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(n - 1, x1); x++) if (!ex[y * n + x]) { sig = (sig * 31 + y * n + x) | 0; any = true; }
  const key = cx + ',' + cy, old = MapRender.fog.get(key); if (old && old._sig === sig) return old.c;
  let c = null;
  if (any) {
    const w = pixBuf('fogWork', S, S, true), f = w._ctx, ox = -cx * CHUNK * T, oy = -cy * CHUNK * T; f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, S, S);
    f.setTransform(0.5, 0, 0, 0.5, 0, 0);
    for (const [alpha, extra] of [[0.45, 7], [1, 0]]) {
      f.fillStyle = `rgba(0,0,0,${alpha})`; f.beginPath();
      for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(n - 1, x1); x++) {
        if (ex[y * n + x]) continue; const r0 = T * 0.72 + (thash(x, y, 3) % 4) + extra, px = ox + x * T + 16, py = oy + y * T + 16;
        f.moveTo(px + r0, py); f.arc(px, py, r0, 0, TAU);
      }
      f.fill();
    }
    const img = f.getImageData(0, 0, S, S), d = img.data, bx = cx * S, by = cy * S;
    for (let y = 0, k = 0; y < S; y++) for (let x = 0; x < S; x++, k += 4) { const a = d[k + 3]; d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = (a >= 225 || (a >= 70 && ((bx + x + by + y) & 1))) ? 255 : 0; }
    // gotowy kawałek w zwykłym płótnie (roboczy, czytany procesorem, służy tylko do liczenia)
    c = document.createElement('canvas'); c.width = c.height = S; c.getContext('2d').putImageData(img, 0, 0);
  }
  MapRender.fog.set(key, { c, _sig: sig }); if (MapRender.fog.size > 80) MapRender.fog.delete(MapRender.fog.keys().next().value);
  return c;
}
function drawFogPixel(b, st, ox, oy, c0, c1, r0, r1) {
  const ex = human(st).explored, n = st.map.n, CP = CHUNK * T;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) { const f = fogChunk(ex, n, cx, cy); if (f) b.drawImage(f, ox + cx * CP, oy + cy * CP, CP, CP); }
}
function drawWorldPixel(b, st) {
  const map = st.map, n = map.n, CP = CHUNK * T, camX = Math.round(st.cam.x / 2) * 2, camY = Math.round(st.cam.y / 2) * 2, nC = Math.ceil(n / CHUNK);
  b.fillStyle = '#000'; b.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  const c0 = Math.max(0, Math.floor(camX / CP)), c1 = Math.min(nC - 1, Math.floor((camX + VIEW.w - 1) / CP));
  const r0 = Math.max(0, Math.floor(camY / CP)), r1 = Math.min(nC - 1, Math.floor((camY + VIEW.h - 1) / CP));
  const ox = VIEW.x - camX, oy = VIEW.y - camY;
  // nowe kawałki terenu: najwyżej ~10 ms na klatkę (na słabym komputerze przewijanie nie szarpie), reszta zastępczo w następnych klatkach;
  // gdy zostaje czasu, kawałki wokół widoku powstają z wyprzedzeniem
  const until = performance.now() + 10;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    const ch = MapRender.get(cx, cy, performance.now() < until), x = ox + cx * CP, y = oy + cy * CP;
    if (!ch) { MapRender.placeholder(b, cx, cy, x, y); G.dirty = true; continue; }
    b.drawImage(ch, x, y, CP, CP); WaterFx.draw(b, ch, x, y, CP, cx * ch.width, cy * ch.width);
  }
  const ahead = performance.now() + 4;
  for (let cy = Math.max(0, r0 - 1); cy <= Math.min(nC - 1, r1 + 1) && performance.now() < ahead; cy++) for (let cx = Math.max(0, c0 - 1); cx <= Math.min(nC - 1, c1 + 1) && performance.now() < ahead; cx++) if (!MapRender.has(cx, cy)) MapRender.get(cx, cy);
  if (hero(st)) drawPathPixel(b, st, hero(st), ox, oy);
  const tx0 = Math.floor(camX / T) - 2, ty0 = Math.floor(camY / T) - 1, tx1 = Math.floor((camX + VIEW.w) / T) + 2, ty1 = Math.floor((camY + VIEW.h) / T) + 2, list = [];
  for (const ob of st.objects) if (!ob.dead && ob.x >= tx0 && ob.x <= tx1 && ob.y >= ty0 && ob.y <= ty1) list.push({ y: ob.y, ob });
  for (const h of st.heroes) { const [hx, hy] = heroDrawPos(h); list.push({ y: hy + 0.5, hero: h, hx, hy }); }
  list.sort((a, c) => a.y - c.y);
  const shadow = (w, x, y) => { b.globalAlpha = 0.3; blitG(b, shadowSprite(w), x, y); b.globalAlpha = 1; };
  for (const it of list) {
    if (it.hero) { const x = ox + it.hx * T + 16, y = oy + it.hy * T + 16; shadow(14, x, y + 13); blitG(b, heroSprite(it.hero, ownerColor(st, it.hero.owner)), x, y); continue; }
    const ob = it.ob, px = ox + ob.x * T + 16, py = oy + ob.y * T + 16;
    if (ob.type === 'monster') { shadow(10, px, py + 10); blitG(b, creatureSprite(ob.cid, ob.dir, Math.floor(G.time * 3 + ob.x * 0.7 + ob.y * 0.3) % 4), px, py + 10); }
    else if (ob.type === 'res') { shadow(10, px, py + 9); blitG(b, resSprite(ob.res), px, py + 2); }
    else if (ob.type === 'chest') { shadow(10, px, py + 9); blitG(b, chestSprite(), px, py + 2); }
    else if (ob.type === 'boat') blitG(b, boatSprite(Math.floor(G.time * 4 + ob.id) % 4), px, py);
    else if (ob.type === 'site') { shadow(14, px, py + 12); blitG(b, siteSprite(ob.kind, siteFrame(ob)), px, py + 14); }
    else if (ob.type === 'art') { shadow(9, px, py + 10); blitG(b, artSprite(ob.art), px, py + 1 + Math.round(Math.sin(G.time * 2 + ob.id) * 1.5) * 2); }
    else if (ob.type === 'bank') blitG(b, bankSprite(ob.kind, ob.cleared), ox + (ob.x - 1) * T, oy + (ob.y - 1) * T);
    else if (ob.type === 'mine') { const mx = ox + (ob.x - 1) * T, my = oy + (ob.y - 1) * T; blitG(b, mineSprite(ob.kind), mx, my); blitG(b, flagSprite(ownerColor(st, ob.owner), 12, 7), mx + 56, my - 2); }
    else if (ob.type === 'town') {
      const t = st.towns[ob.townId], lvl = townLevel(t), mx = ox + (ob.x - 1) * T, my = oy + (ob.y - 1) * T, fc = ownerColor(st, ob.owner);
      blitG(b, townSprite(t.faction, lvl), mx, my);
      for (const [fx, fy] of TOWN_FLAG_POINTS[lvl]) blitG(b, flagSprite(fc, 10, 6), mx + fx, my + fy - 20); // drzewce stoi na szczycie dachu
    }
  }
  drawFogPixel(b, st, ox, oy, c0, c1, r0, r1);
  if (G.mouse.type === 'mouse' && inRect(G.mouse.x, G.mouse.y, VIEW)) {
    const { tx, ty } = screenToTile(st, G.mouse.x, G.mouse.y), x = ox + tx * T, y = oy + ty * T;
    b.fillStyle = 'rgba(255,240,190,.55)'; b.fillRect(x, y, T, 2); b.fillRect(x, y + T - 2, T, 2); b.fillRect(x, y + 2, 2, T - 4); b.fillRect(x + T - 2, y + 2, 2, T - 4);
  }
}
// Korekcja barw mapy (przyciemnienie i odbarwienie jak gradeRgb) oraz paleta z ditheringiem są wypalone raz: w kawałkach
// terenu (renderChunkPixel) i w kopiach sprite'ów (blitG). Co klatkę dochodzi tylko gotowa nakładka światła i winiety.
function gradeCanvas(c, ox = 0, oy = 0, step = 18) {
  const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data;
  const [mr, mg, mb] = hexRgb(GRADE.mul).map(v => v / 255), ds = GRADE.desat;
  for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k += 4) {
    if (!d[k + 3]) continue;
    const r = d[k] * mr, gg = d[k + 1] * mg, b = d[k + 2] * mb, l = 0.3 * r + 0.59 * gg + 0.11 * b, o = (BAYER4[((y + oy) & 3) * 4 + ((x + ox) & 3)] / 16 - 0.5) * step;
    d[k] = clamp(Math.round((r + (l - r) * ds + o) / step) * step, 0, 255); d[k + 1] = clamp(Math.round((gg + (l - gg) * ds + o) / step) * step, 0, 255); d[k + 2] = clamp(Math.round((b + (l - b) * ds + o) / step) * step, 0, 255);
  }
  g.putImageData(img, 0, 0); return c;
}
function gradedSprite(s) {
  if (!s._g) { const c = document.createElement('canvas'); c.width = s.c.width; c.height = s.c.height; c.getContext('2d').drawImage(s.c, 0, 0); s._g = { c: gradeCanvas(c), ax: s.ax, ay: s.ay }; }
  return s._g;
}
const blitG = (b, s, x, y) => blit(b, gradedSprite(s), x, y);
// Nakładka: ciepłe światło z lewej u góry, chłodny cień z prawej u dołu i winieta; alfa w 8 stopniach z ditheringiem
function mapLight(w, h) {
  return Layers.get(`mapLight_${w}x${h}`, w, h, c => {
    const img = c.createImageData(w, h), d = img.data, cx = w / 2, cy = h / 2;
    for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k += 4) {
      const t = (x / w + y / h) / 2, warm = Math.max(0, 0.13 * (1 - t * 2)), cool = Math.max(0, 0.24 * (t * 2 - 1));
      const rr = Math.hypot(x - cx, y - cy), v = clamp((rr - h * 0.35) / (h * 0.5), 0, 1) * 0.5;
      let a = warm + cool + v, r = (255 * warm + 18 * cool + 6 * v) / (a || 1), g = (200 * warm + 22 * cool + 6 * v) / (a || 1), b = (130 * warm + 60 * cool + 14 * v) / (a || 1);
      const q = Math.floor(a * 8 + BAYER4[(y & 3) * 4 + (x & 3)] / 16) / 8;
      d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = clamp(q, 0, 1) * 255;
    }
    c.putImageData(img, 0, 0);
  }, 1);
}
function drawMapView(ctx, st, scr) {
  {
    const wb = pixBuf('world', VIEW.w / 2, VIEW.h / 2), b = wb._ctx; // bez willReadFrequently: przy karcie graficznej bufor zostaje na niej
    b.setTransform(0.5, 0, 0, 0.5, -VIEW.x * 0.5, -VIEW.y * 0.5); b.imageSmoothingEnabled = false; drawWorldPixel(b, st); b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(mapLight(VIEW.w / 2, VIEW.h / 2), 0, 0); b.restore();
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(wb, VIEW.x, VIEW.y, VIEW.w, VIEW.h); ctx.restore();
  }
  const ox = VIEW.x - Math.round(st.cam.x / 2) * 2, oy = VIEW.y - Math.round(st.cam.y / 2) * 2; // to samo zaokrąglenie co w drawWorldPixel
  ctx.save(); ctx.beginPath(); ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h); ctx.clip();
  scr.floats = (scr.floats || []).filter(f => G.time - f.t < 1.6);
  for (const f of scr.floats) {
    const age = G.time - f.t, fx = ox + f.x * T + 16, fy = oy + f.y * T - 14 - age * 18;
    ctx.globalAlpha = clamp(1.6 - age, 0, 1); if (f.res) resIcon(ctx, f.res, fx - 22, fy, 18);
    ctx.font = font(15, 700, 'title'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a0e04';
    const tx = f.res ? fx - 10 : fx - ctx.measureText(f.text).width / 2; ctx.strokeText(f.text, tx, fy); ctx.fillStyle = '#ffe28a'; ctx.fillText(f.text, tx, fy);
    ctx.globalAlpha = 1;
  }
  // efekty czarów na mapie: rozchodzący się krąg światła i słup blasku
  scr.mapFx = (scr.mapFx || []).filter(e => G.time - e.t < 1.2);
  for (const e of scr.mapFx) {
    const f = (G.time - e.t) / 1.2, x = ox + e.x * T + 16, y = oy + e.y * T + 16; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - f;
    if (e.kind === 'ring') { ctx.strokeStyle = e.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, e.r * T * ease(f), e.r * T * ease(f) * 0.6, 0, 0, TAU); ctx.stroke(); }
    else { const g = ctx.createLinearGradient(0, y - 160, 0, y); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, e.col); ctx.fillStyle = g; ctx.fillRect(x - 18 * (1 - f * 0.5), y - 160, 36 * (1 - f * 0.5), 170); }
    ctx.restore();
  }
  if (scr.banner) {
    const a = clamp(1.8 - (G.time - scr.banner.t), 0, 1);
    if (a > 0) { ctx.globalAlpha = a; drawParchment(ctx, VIEW.x + VIEW.w / 2 - 90, VIEW.y + 16, 180, 44); text(ctx, scr.banner.text, VIEW.x + VIEW.w / 2, VIEW.y + 39, { size: 22, align: 'center', color: '#3a1e08', fam: 'title' }); ctx.globalAlpha = 1; }
    else scr.banner = null;
  }
  ctx.restore();
}
function tileInfo(st, tx, ty) {
  const map = st.map, n = map.n; if (tx < 0 || ty < 0 || tx >= n || ty >= n) return 'Poza mapą';
  const i = ty * n + tx; if (!human(st).explored[i]) return 'Nieodkryty teren';
  const h = heroAt(st, tx, ty); if (h) return heroTitle(h);
  const ob = objectAt(st, i);
  if (ob) {
    if (ob.type === 'monster') return `${qtyName(ob.count)} ${CREATURES[ob.cid].gen}`;
    if (ob.type === 'town') { const t = st.towns[ob.townId]; return `${t.name}, ${ob.owner === ME ? 'twoje miasto' : ob.owner < 0 ? 'miasto niezależne' : 'obce miasto'}`; }
    if (ob.type === 'mine') return `${MINES[ob.kind].name} (${ob.owner === ME ? 'należy do ciebie' : 'bez właściciela'})`;
    if (ob.type === 'chest') return 'Skrzynia ze skarbem';
    if (ob.type === 'site') { const h = hero(st); return `${SITES[ob.kind].name}${h && siteUsed(st, ob, h) ? ' (odwiedzone)' : ''}`; }
    if (ob.type === 'art') return `Artefakt: ${ARTIFACTS[ob.art].name}`;
    if (ob.type === 'res') return resName(ob.res);
    if (ob.type === 'boat') return 'Łódź';
    if (ob.type === 'bank') return `${BANKS[ob.kind].name}${ob.cleared ? ' (splądrowane)' : ''}`;
  }
  const t = map.terrain[i]; if (t === TER.WATER) return 'Woda (potrzebna łódź)';
  let s = TERRAINS[t].name, cost = TERRAINS[t].cost;
  if (map.road[i]) { s += ', ' + ROADS[map.road[i]].name; cost = ROADS[map.road[i]].cost; }
  s += map.obst[i] ? `, ${OBST_NAMES[map.obst[i]]} (nie do przejścia)` : `, koszt ruchu ${cost}`;
  if (st.guard[i]) s += `, strzeżone przez ${CREATURES[st.objects[st.guard[i] - 1].cid].acc}`;
  return s;
}

