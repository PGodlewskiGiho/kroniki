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
let SEASON_DRAW = 0; // pora roku dla rysowanych właśnie przeszkód i ozdób (ustawia obstacleSprite/decorSprite)
const AUTUMN_OAK = [['#4a1a0a', '#8a2e14', '#c8501e', '#f09040'], ['#4a2a08', '#8a5210', '#c8841e', '#f0c040'], ['#3a2410', '#6a4418', '#9a6a28', '#c89a4a']];
const OAK_PAL = [['#123414', '#24601e', '#4a9430', '#9ad056'], ['#1a3810', '#36601a', '#62922c', '#b8d04c'], ['#3a3010', '#645418', '#9a8028', '#e0bc4c']];
function drawOak(g, x, y, s, r = mulberry32(1)) {
  shadowAt(g, x, y, 10 * s);
  mpoly(g, [[x - 4 * s, y + 1], [x - 1.8 * s, y - 2 * s], [x - 1.5 * s, y - 11 * s], [x + 1.5 * s, y - 11 * s], [x + 1.8 * s, y - 2 * s], [x + 4 * s, y + 1]], '#3a2412');
  mpoly(g, [[x - 3 * s, y + 0.5], [x - 1.5 * s, y - 2 * s], [x - 1.4 * s, y - 11 * s], [x, y - 11 * s], [x - 0.2 * s, y]], '#6e4826');
  const k = r(), pal = SEASON_DRAW === 2 ? AUTUMN_OAK[(k * 3) | 0] : OAK_PAL[k < 0.12 ? 2 : r() < 0.35 ? 1 : 0];
  if (SEASON_DRAW === 3) { // zima: gołe gałęzie przyprószone śniegiem
    for (const [dx, dy, ex, ey] of [[0, -10, -7, -22], [0, -12, 7, -21], [0, -11, 0, -27], [-3, -16, -10, -18], [3, -16, 10, -15]]) mline(g, [[x + dx * s, y + dy * s], [x + ex * s, y + ey * s]], '#4a3422', 1.6 * s);
    for (const [ex, ey] of [[-7, -22], [7, -21], [0, -27], [-10, -18], [10, -15]]) { g.fillStyle = '#f4f8fc'; g.fillRect(x + ex * s - 1.5, y + ey * s - 1, 3, 2); }
    return;
  }
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
  if (SEASON_DRAW === 3 && (t === TER.GRASS || t === TER.DIRT || t === TER.ROUGH || t === TER.SWAMP) && o !== OBST.TREE) t = TER.SNOW; // zimą góry i skały w śniegu
  if (o === OBST.MOUNT) return drawMountain(g, px, py, t, r);
  if (o === OBST.ROCK) return drawRock(g, px + (r() - 0.5) * 8, py + 6, r, t);
  const spots = [[(r() - 0.5) * 8, -2], [-8 + (r() - 0.5) * 4, 9], [8 + (r() - 0.5) * 4, 10]], cnt = r() < 0.3 ? 2 : 3;
  for (let k = 0; k < cnt; k++) {
    const x = px + spots[k][0], y = py + spots[k][1], s = 0.8 + r() * 0.3;
    if (t === TER.SNOW || t === TER.ROUGH) drawPine(g, x, y, s, t === TER.SNOW || SEASON_DRAW === 3, r);
    else if (t === TER.SAND) drawPalm(g, x, y, s, r);
    else if (t === TER.LAVA) drawCharredTree(g, x, y, s, r);
    else if (t === TER.SWAMP) { if (r() < 0.5) drawDeadTree(g, x, y, s, '#2e2618', r); else drawWillow(g, x, y, s, r); }
    else if (t === TER.DIRT && r() < 0.5) drawPine(g, x, y, s, SEASON_DRAW === 3, r);
    else drawOak(g, x, y, s, r);
  }
}
// Drobne ozdoby na pustych polach (kępki trawy, kwiaty, kamyki, trzcina, grzyby, żar): tylko wygląd, nie blokują ruchu
function drawDecor(g, t, v) {
  if (SEASON_DRAW === 3 && t !== TER.LAVA && t !== TER.SAND) t = TER.SNOW; // zimą ozdoby w śniegu
  if (SEASON_DRAW === 2 && t === TER.GRASS && v % 2) { for (const [x, y, c] of [[-4, 1, '#c8501e'], [2, -1, '#e0a030'], [5, 3, '#8a3a14'], [-1, 4, '#d87a2a']]) { g.fillStyle = c; g.fillRect(x, y, 3, 2); } return; } // jesienne liście
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
  if (!PIXEL_ART) return t === 2 ? mixRgb(P[1], P[2], vnoise2(ax / 2.5, ay / 2.5, 17) * 0.6) : mixRgb(P[1], P[0], vnoise2(ax / 3, ay / 3, 19) * 0.35); // gładka droga (bruk zostaje kostką)
  if (t === 2) return hh < 0.18 ? P[0] : hh < 0.36 ? P[2] : P[1];
  return hh < 0.08 ? P[0] : hh > 0.93 ? P[2] : P[1];
}
// Gładki teren (PIXEL_ART = false): barwa płynnie między jasnym, średnim i ciemnym odcieniem palety wg szumu wartości,
// do tego drobna, miękka faktura (szum w kilku skalach) zamiast pojedynczych plamek; cechy terenu (żyły lawy, rozlewiska, zmarszczki piasku) zostają
const lerp3 = (P, v) => (v < 0.5 ? mixRgb(P[1], P[0], 1 - v * 2) : mixRgb(P[1], P[2], (v - 0.5) * 2));
const shadeRgb = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
function landColorSmooth(t, ax, ay) {
  const P = TPAL[t], v = clamp((vnoise2(ax / 9, ay / 9, 31 + t) * 0.65 + vnoise2(ax / 3.5, ay / 3.5, 37 + t) * 0.35 - 0.5) * 1.6 + 0.5, 0, 1);
  let col = lerp3(P, v); const f = 0.94 + vnoise2(ax / 1.4, ay / 1.4, 13 + t) * 0.1; col = shadeRgb(col, f);
  switch (t) {
    case TER.GRASS: { const m = vnoise2(ax / 14, ay / 14, 71); if (m > 0.62) col = mixRgb(col, P[3], Math.min(1, (m - 0.62) * 3) * 0.5); break; } // ciemniejsze kępy trawy
    case TER.SAND: { const w = Math.sin((ay + vnoise2(ax / 9, ay / 9, 5) * 8) * Math.PI / 3); if (w > 0.6) col = mixRgb(col, P[2], (w - 0.6) * 1.2); break; } // zmarszczki wydm
    case TER.SWAMP: { const pv = vnoise2(ax / 4, ay / 4, 41); if (pv > 0.62) col = mixRgb(col, P[3], Math.min(1, (pv - 0.62) * 8)); break; }
    case TER.LAVA: { const cr = Math.abs(vnoise2(ax / 6, ay / 6, 51) - 0.5); if (cr < 0.06) col = mixRgb(col, cr < 0.03 ? PC.hot : PC.warm, 1 - cr / 0.06 * 0.5); break; }
    case TER.ROUGH: case TER.DIRT: { const m = vnoise2(ax / 6, ay / 6, 81); if (m < 0.3) col = mixRgb(col, P[3], (0.3 - m) * 1.5); break; }
  }
  return col;
}
function landColor(t, ax, ay, hh) {
  if (!PIXEL_ART) return landColorSmooth(t, ax, ay);
  const P = TPAL[t], bnd = vnoise2(ax / 5, ay / 5, 31 + t); let col = bnd < 0.3 ? P[0] : bnd > 0.7 ? P[2] : P[1];
  switch (t) {
    case TER.GRASS: if (hh < 0.02) col = P[3]; else if (hh < 0.035) col = P[0]; else if (hh > 0.997) col = PC.flY; else if (hh > 0.994) col = PC.flW; break;
    case TER.DIRT: if (hh < 0.03) col = P[3]; else if (hh > 0.985) col = P[2]; break;
    case TER.SAND: if (((Math.floor(ay) + Math.floor(vnoise2(ax / 9, ay / 9, 5) * 8)) % 6) === 0 && hh < 0.6) col = P[2]; else if (hh < 0.025) col = P[3]; break;
    case TER.SNOW: if (hh < 0.015) col = P[3]; else if (hh > 0.99) col = PC.white; break;
    case TER.SWAMP: { const pv = vnoise2(ax / 4, ay / 4, 41); if (pv > 0.7) col = P[3]; else if (pv > 0.66) col = PC.rim; else if (hh < 0.02) col = PC.reed; break; }
    case TER.ROUGH: if (hh < 0.035) col = P[3]; else if (hh > 0.985) col = P[2]; break;
    case TER.LAVA: { const cr = Math.abs(vnoise2(ax / 6, ay / 6, 51) - 0.5); if (cr < 0.03) col = PC.hot; else if (cr < 0.05) col = PC.warm; break; }
  }
  return col;
}
// Tekstury terenu (TERRAIN_ART, malowane przez AI, bezszwowe): piksele w tablicy + średnia barwa. Teren bierze z tekstury strukturę
// (kępy trawy, szczeliny, kamienie), a barwę z palety i pory roku: kolor = tekstura × (barwa terenu / średnia tekstury).
const TERRAIN_TEX = {}, TEX_NAME = ['water', 'grass', 'dirt', 'sand', 'snow', 'swamp', 'rough', 'lava'], TEX_TILES = 8; // tekstura 512 px (tools/tekstury-proc.py) na 8×8 pól: piksel tekstury ≈ piksel ekranu przy zoomie 1 (ostro)
// faktura z tekstury AI w barwie terenu (pora roku, paleta): kolor × (tekstura / jej średnia). Żeby nie było widać powtórzeń,
// tekstura jest próbkowana dwa razy (co TEX_TILES pól i co ~1,6× tyle, z zamienionymi osiami) i obie próbki mieszane wolnym szumem
const TEXS = new Float32Array(6); // wynik dwóch próbek (RGB × 2), bez tworzenia tablic na każdy piksel
function texSmp(TX, u, v, k) { // próbka dwuliniowa (płynnie między pikselami tekstury, bez schodków); u, v w pikselach tekstury
  const W = TX.w, H = TX.h, d = TX.d, x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0, X0 = ((x0 % W) + W) % W, Y0 = ((y0 % H) + H) % H, X1 = X0 + 1 === W ? 0 : X0 + 1, Y1 = Y0 + 1 === H ? 0 : Y0 + 1;
  const a = (Y0 * W + X0) << 2, b = (Y0 * W + X1) << 2, c = (Y1 * W + X0) << 2, e = (Y1 * W + X1) << 2, w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
  TEXS[k] = d[a] * w00 + d[b] * w10 + d[c] * w01 + d[e] * w11; TEXS[k + 1] = d[a + 1] * w00 + d[b + 1] * w10 + d[c + 1] * w01 + d[e + 1] * w11; TEXS[k + 2] = d[a + 2] * w00 + d[b + 2] * w10 + d[c + 2] * w01 + d[e + 2] * w11;
}
function texShade(TX, col, ax, ay, w) { const P = TEX_TILES * AP, M = TX.mean;
  texSmp(TX, ax * TX.w / P, ay * TX.h / P, 0); texSmp(TX, (ay + 11 * AP) * TX.w / (P * 1.618), (ax + 37 * AP) * TX.h / (P * 1.618), 3);
  const m = clamp((vnoise2(ax / (AP * 3.5), ay / (AP * 3.5), 91) - 0.5) * 3 + 0.5, 0, 1), a = (1 - m) * w, b = m * w, u = 1 - w;
  return [Math.min(255, col[0] * ((TEXS[0] * a + TEXS[3] * b) / M[0] + u)), Math.min(255, col[1] * ((TEXS[1] * a + TEXS[4] * b) / M[1] + u)), Math.min(255, col[2] * ((TEXS[2] * a + TEXS[5] * b) / M[2] + u))]; }
function texData(im) {
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
  let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4;
  return { w: c.width, h: c.height, d, mean: [r / n, gg / n, b / n], cv: c };
}
// Pory roku: lato przypala trawę, jesień barwi ją plamami rdzy i złota, zima przykrywa śniegiem (poza lawą i pustynią)
const SNOWC = [[236, 242, 248], [214, 226, 238], [248, 250, 252]], AUTC = [[176, 104, 38], [150, 86, 36], [196, 146, 56], [128, 110, 44]];
const mixRgb = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
function seasonLand(col, t, ax, ay, hh, S) {
  if (!S || t === TER.LAVA || t === TER.SNOW) return col;
  if (S === 1) return t === TER.GRASS ? mixRgb(col, [168, 158, 72], 0.2) : col;
  if (S === 2) { if (t === TER.SAND) return col; const v = vnoise2(ax / 11, ay / 11, 91); return mixRgb(col, AUTC[clamp((v * 4) | 0, 0, 3)], t === TER.GRASS ? 0.55 : 0.28); }
  const v = vnoise2(ax / 9, ay / 9, 97);
  if (t === TER.SAND) return mixRgb(col, SNOWC[0], v > 0.45 ? 0.6 : 0.25); // piasek tylko przyprószony
  if (!PIXEL_ART) return mixRgb(col, mixRgb(SNOWC[1], SNOWC[2], vnoise2(ax / 2, ay / 2, 99)), 0.55 + clamp((v - 0.2) * 3, 0, 1) * 0.35); // gładki śnieg
  return mixRgb(col, SNOWC[hh < 0.3 ? 1 : hh > 0.97 ? 2 : 0], v > 0.3 ? 0.9 : 0.55);
}
// Gotowy kawałek od razu (widoczny kawałek, pierwsza klatka); w tle MapRender.warm maluje go porcjami (renderChunkSteps)
function renderChunkPixel(map, cx, cy) { const it = renderChunkSteps(map, cx, cy); let r; do r = it.next(); while (!r.done); return r.value; }
// Malowanie kawałka jako generator: przerwy co kilka rzędów pikseli, żeby praca w tle nie zabierała czasu klatkom.
// Dwie części: piksele terenu (chunkPixelSteps, ~90% pracy; bez płócien, więc działa też w wątku w tle – TerrainPool) i wykończenie
// na płótnie (chunkFinish: ozdoby, drzewa, góry, korekcja barw, maski wody)
function* renderChunkSteps(map, cx, cy) {
  const D0 = MapRender.D, SN = MapRender.season || 0, px = yield* chunkPixelSteps(map, cx, cy, D0, SN, TERRAIN_TEX);
  return chunkFinish(map, cx, cy, D0, SN, px);
}
// map: { n, ln, terrain, obst, road }; TEX: tekstury terenu { w, h, d, mean }. Wynik: piksele RGBA, maska wody, tereny w ramce (tid)
function* chunkPixelSteps(map, cx, cy, D0, SN, TEX) {
  // D = gęstość pikseli (PXD): teren liczony w drobnych pikselach, współrzędne tekstur (ax, ay) w dawnych pikselach grafiki
  const n = map.n, S = CHUNK * AP, SF = Math.round(S * D0), D = SF / S, M = 5, MF = Math.round(M * D), R = SF + 2 * MF, bx = cx * S, by = cy * S, lim = n * AP, tid = new Uint8Array(R * R);
  // przesunięcie granic terenów szumem: szum jest gładki (skala 7 pikseli grafiki), więc liczymy go co piksel grafiki i interpolujemy
  const GW = Math.ceil(R / D) + 2, gx0 = bx - M, gy0 = by - M, JX = new Float32Array(GW * GW), JY = new Float32Array(GW * GW);
  for (let j = 0; j < GW; j++) for (let i = 0; i < GW; i++) { const ax = gx0 + i, ay = gy0 + j; JX[j * GW + i] = (vnoise2(ax / 7, ay / 7, 11) - 0.5) * 9; JY[j * GW + i] = (vnoise2(ax / 7, ay / 7, 23) - 0.5) * 9; }
  for (let y = 0; y < R; y++) { const ay = by + (y - MF) / D, v = ay - gy0, j = Math.min(GW - 2, Math.floor(v)), fy = v - j;
    for (let x = 0; x < R; x++) {
      const ax = bx + (x - MF) / D, u = ax - gx0, i = Math.min(GW - 2, Math.floor(u)), fx = u - i, k = j * GW + i;
      const jx = (JX[k] * (1 - fx) + JX[k + 1] * fx) * (1 - fy) + (JX[k + GW] * (1 - fx) + JX[k + GW + 1] * fx) * fy, jy = (JY[k] * (1 - fx) + JY[k + 1] * fx) * (1 - fy) + (JY[k + GW] * (1 - fx) + JY[k + GW + 1] * fx) * fy;
      tid[y * R + x] = map.terrain[clamp(Math.floor((ay + jy) / AP), 0, n - 1) * n + clamp(Math.floor((ax + jx) / AP), 0, n - 1)];
    } if ((y & 15) === 15) yield; }
  // podziemia: lita skała (ściana jaskini) to ciemność jak w Heroes 3, z miękkim, poszarpanym brzegiem (pola skały interpolowane i przesunięte szumem)
  const under = map.ln && cx * CHUNK >= map.ln && cy * CHUNK >= map.ln, rk = under ? new Float32Array(R * R) : null;
  if (under) { const rock = (x, y) => { x = clamp(x, 0, n - 1); y = clamp(y, 0, n - 1); return map.obst[y * n + x] === OBST.MOUNT ? 1 : 0; };
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const ax = bx + (x - MF) / D, ay = by + (y - MF) / D, gx = (ax + (vnoise2(ax / 5, ay / 5, 13) - 0.5) * 10) / AP - 0.5, gy = (ay + (vnoise2(ax / 5, ay / 5, 29) - 0.5) * 10) / AP - 0.5;
      const ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, v = (rock(ix, iy) * (1 - fx) + rock(ix + 1, iy) * fx) * (1 - fy) + (rock(ix, iy + 1) * (1 - fx) + rock(ix + 1, iy + 1) * fx) * fy;
      rk[y * R + x] = clamp((v - 0.16) / 0.52, 0, 1); } } // szerszy pas przejścia: miejsce na skalny wał
  const TT = (x, y) => tid[(Math.round(y) + MF) * R + Math.round(x) + MF], TO = (x, y) => TT(Math.floor(x * D), Math.floor(y * D)), rd = map.road, at = (x, y) => (x >= 0 && y >= 0 && x < n && y < n) ? rd[y * n + x] : 0;
  const segs = [], x0 = cx * CHUNK - 1, y0 = cy * CHUNK - 1;
  for (let y = y0; y <= y0 + CHUNK + 1; y++) for (let x = x0; x <= x0 + CHUNK + 1; x++) {
    const t = at(x, y); if (!t) continue; const px = x * AP + 8 - bx, py = y * AP + 8 - by; let any = false;
    for (let d = 0; d < 8; d++) { const dx = DX8[d], dy = DY8[d]; if (!at(x + dx, y + dy) || (dx && dy && (at(x + dx, y) || at(x, y + dy)))) continue; segs.push([px, py, px + dx * 8, py + dy * 8, t]); any = true; }
    if (!any) segs.push([px, py, px, py, t]);
  }
  // odcinki dróg w siatce pól kawałka: piksel sprawdza tylko odcinki z pól 3×3 wokół siebie (odcinek ma najwyżej pół pola)
  const SG = CHUNK + 3, sgrid = segs.length ? Array.from({ length: SG * SG }, () => []) : null;
  if (sgrid) for (const sg of segs) { const lx = Math.floor((sg[0] + bx) / AP) - x0, ly = Math.floor((sg[1] + by) / AP) - y0; if (lx >= 0 && ly >= 0 && lx < SG && ly < SG) sgrid[ly * SG + lx].push(sg); }
  // gładko: barwa lądu (szum, pora roku) liczona w węzłach siatki pikseli grafiki i interpolowana między nimi (szum jest gładki,
  // a liczenia jest D² razy mniej); węzły per teren liczone w miarę potrzeby
  const LW = S + 2, lat = {}, lnode = (t, gx, gy) => { let A = lat[t]; if (!A) { A = lat[t] = new Float32Array(LW * LW * 3); A.fill(-1); } const i = ((gy - by) * LW + gx - bx) * 3;
    if (A[i] < 0) { const c0 = seasonLand(landColorSmooth(t, gx, gy), t, gx, gy, 0.5, SN); A[i] = c0[0]; A[i + 1] = c0[1]; A[i + 2] = c0[2]; } return i; };
  const landLerp = (t, ax, ay) => { const gx = Math.floor(ax), gy = Math.floor(ay), u = ax - gx, v = ay - gy, A = (lnode(t, gx, gy), lat[t]), i00 = lnode(t, gx, gy), i10 = lnode(t, gx + 1, gy), i01 = lnode(t, gx, gy + 1), i11 = lnode(t, gx + 1, gy + 1);
    const w00 = (1 - u) * (1 - v), w10 = u * (1 - v), w01 = (1 - u) * v, w11 = u * v; return [A[i00] * w00 + A[i10] * w10 + A[i01] * w01 + A[i11] * w11, A[i00 + 1] * w00 + A[i10 + 1] * w10 + A[i01 + 1] * w01 + A[i11 + 1] * w11, A[i00 + 2] * w00 + A[i10 + 2] * w10 + A[i01 + 2] * w01 + A[i11 + 2] * w11]; };
  const d = new Uint8ClampedArray(SF * SF * 4), wm = new Uint8Array(SF * SF); let wet = false; // maska wody: 1 = głębia (fale), 2 = pas przy brzegu (piana)
  for (let fy = 0; fy < SF; fy++) { if (fy && (fy & 7) === 0) yield; for (let fx = 0; fx < SF; fx++) {
    const k = (fy * SF + fx) * 4, px = fx / D, py = fy / D, ax = bx + px, ay = by + py, ia = Math.floor(ax), ja = Math.floor(ay), wi = fy * SF + fx; let col;
    if (ax >= lim || ay >= lim) col = PC.void;
    else {
      const t = TT(fx, fy), hh = thash(bx * D + fx, by * D + fy, 77) / 4294967296; // drobny szum: plamki w drobnych pikselach
      if (t === TER.WATER) {
        let near = 9; for (const r of RING) if (TT(fx + r[0] * D, fy + r[1] * D) !== TER.WATER) { near = r[2]; break; }
        wm[wi] = near <= 2 ? 2 : 1; wet = true;
        if (SN === 3 && near <= 4) { wm[wi] = 0; col = near === 1 ? SNOWC[2] : (thash(ax >> 1, ay >> 2, 81) % 23 === 0) ? [150, 186, 214] : near <= 2 ? [206, 226, 240] : [184, 212, 232]; } // zimą lód przy brzegu
        else if (near === 1) col = PC.foam; else if (near === 2) col = PC.sh1; else if (near <= 4) col = PC.sh2;
        else { const P = TPAL[0]; if (!PIXEL_ART) { col = mixRgb(P[1], P[0], clamp((vnoise2(ax / 8, ay / 8, 61) - 0.2) * 2.2, 0, 1)); if (TEX.water) col = texShade(TEX.water, col, ax, ay, 0.45); } else { col = vnoise2(ax / 8, ay / 8, 61) < 0.33 ? P[0] : P[1]; if ((thash(ax >> 2, ay, 71) % 100) < 3 && (ax & 3) !== 3) col = P[2]; else if (hh > 0.998) col = P[3]; } }
      } else {
        col = PIXEL_ART ? seasonLand(landColor(t, ax, ay, hh), t, ax, ay, hh, SN) : landLerp(t, ax, ay);
        const TX = !PIXEL_ART && ((under && (t === TER.DIRT || t === TER.ROUGH) && TEX.cave) || TEX[TEX_NAME[t]]); // podziemia: dno jaskini
        if (TX) { col = texShade(TX, col, ax, ay, 0.85); const gr = 0.955 + hh * 0.09; col = [col[0] * gr, col[1] * gr, col[2] * gr]; } // drobne ziarno w pikselach ekranu: ostrość niezależna od tekstury
        const below = TT(fx, fy + D); if (below !== t && below !== TER.WATER) col = TPAL[t][0];
      }
      if (rk) { const q = (fy + MF) * R + fx + MF, k = rk[q];
        if (k > 0) { // brzeg skały: gruby, skalisty wał (jasny od światła z lewej góry, ciemny po drugiej stronie), dalej ciemność
          const gx = rk[q + 1] - rk[q - 1], gy = rk[q + R] - rk[q - R], gl = Math.hypot(gx, gy) || 1, lit = clamp(0.5 + (gx + gy) / gl * 0.45, 0, 1); // ku ciemności w prawo-dół = ściana zwrócona do światła
          const rim = k < 0.72 ? Math.pow(Math.sin(k / 0.72 * Math.PI), 0.6) : 0, tex = 0.78 + vnoise2(ax / 1.3, ay / 1.3, 57) * 0.3 + vnoise2(ax / 4, ay / 4, 61) * 0.16, rc = mixRgb([40, 34, 46], [156, 144, 160], lit * lit).map(v => v * tex);
          col = mixRgb(col, rc, Math.min(1, rim * 1.2)); const kk = clamp((k - 0.55) / 0.45, 0, 1); col = mixRgb(col, [9, 8, 13], kk * kk * (3 - 2 * kk)); } }
      if (segs.length) {
        let best = 99, bt = 0;
        const tx = Math.floor(ax / AP) - x0, ty = Math.floor(ay / AP) - y0;
        for (let gy = Math.max(0, ty - 1); gy <= Math.min(SG - 1, ty + 1); gy++) for (let gx = Math.max(0, tx - 1); gx <= Math.min(SG - 1, tx + 1); gx++)
          for (const s of sgrid[gy * SG + gx]) { if (Math.abs(px - s[0]) > 14 || Math.abs(py - s[1]) > 14) continue; const dd = segDist(px + 0.5 / D, py + 0.5 / D, s); if (dd < best) { best = dd; bt = s[4]; } }
        if (best <= 4.3) wm[wi] = 0;
        if (best <= 3.3) col = SN === 3 ? mixRgb(roadColor(bt, ia, ja, hh), SNOWC[0], 0.3) : roadColor(bt, ia, ja, hh); else if (best <= 4.3) col = PC.edge;
      }
    }
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  } }
  return { d, wm, wet, tid };
}
function chunkFinish(map, cx, cy, D0, SN, px) {
  const n = map.n, S = CHUNK * AP, SF = Math.round(S * D0), D = SF / S, M = 5, MF = Math.round(M * D), R = SF + 2 * MF, bx = cx * S, by = cy * S, rd = map.road, tid = px.tid, wm = px.wm;
  const TT = (x, y) => tid[(Math.round(y) + MF) * R + Math.round(x) + MF], TO = (x, y) => TT(Math.floor(x * D), Math.floor(y * D)), x0 = cx * CHUNK - 1, y0 = cy * CHUNK - 1;
  const c = document.createElement('canvas'); c.width = c.height = SF; c._noAtlas = 1; const g = c.getContext('2d');
  g.putImageData(new ImageData(px.d, SF, SF), 0, 0);
  if (map.ln && cx * CHUNK >= map.ln && cy * CHUNK >= map.ln) { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#6e6a84'; g.fillRect(0, 0, SF, SF); g.globalCompositeOperation = 'source-over'; } // podziemia: mroczne dno jaskini (ściany i świecące ozdoby mają własne barwy)
  g.setTransform(D, 0, 0, D, 0, 0); // sprite'y ozdób i przeszkód w dawnych jednostkach
  const put = (gg, sp, x, y) => { const k = (sp.u || 2 / PXD) / 2; gg.drawImage(sp.c, x - sp.ax * k, y - sp.ay * k, sp.c.width * k, sp.c.height * k); }; // skala z gęstości samego obrazka (s.u), nie fragmentu
  // ozdoby: pola bez przeszkody, drogi i obiektu; teren sprawdzany w miejscu ozdoby (brzegi terenu są poszarpane)
  const oa = G.state && G.state.map === map ? G.state.objAt : null;
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y0 + CHUNK + 1); y++) for (let x = Math.max(0, x0); x <= Math.min(n - 1, x0 + CHUNK + 1); x++) {
    const i = y * n + x, h = thash(x, y, map.seed + 5), ug = levelOf(map, x, y); if (map.obst[i] || rd[i] || (oa && oa[i]) || h % 100 >= (ug ? 34 : 22)) continue; // podziemia: gęściej (grzyby, kryształy)
    const lx = x * AP + 8 - bx + ((h >>> 8) % 9) - 4, ly = y * AP + 8 - by + ((h >>> 12) % 7) - 3, t = map.terrain[i];
    if (t === TER.WATER || lx < -M || ly < -M || lx >= S + M || ly >= S + M || TO(lx, ly) !== t) continue;
    const s = decorSprite(t, (h >>> 16) % (ug ? 6 : 4), SN, ug); put(g, s, lx, ly);
  }
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y0 + CHUNK + 2); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(n - 1, x0 + CHUNK + 2); x++) {
    const o = map.obst[y * n + x]; if (!o || (o === OBST.MOUNT && levelOf(map, x, y))) continue; // podziemia: ściany jaskini to ciemność, bez brył
    const s = obstacleSprite(o, map.terrain[y * n + x], thash(x, y, map.seed + 2) % (o === OBST.TREE ? 4 : 8), SN, levelOf(map, x, y)); // góry i skały: 8 wariantów, żeby pasmo nie wyglądało jak wzór
    put(g, s, x * AP + 8 - bx, y * AP + 8 - by);
  }
  gradeCanvas(c, Math.round(bx * D), Math.round(by * D));
  if (px.wet) { // maski do animacji wody (WaterFx); przeszkody stojące nad wodą (drzewa, góry przy brzegu) ją zasłaniają
    const mk = v => { const m = document.createElement('canvas'); m.width = m.height = SF; const mg = m.getContext('2d'), mi = mg.createImageData(SF, SF);
      for (let i = 0; i < SF * SF; i++) if (wm[i] === v) mi.data[i * 4 + 3] = 255; mg.putImageData(mi, 0, 0); mg.globalCompositeOperation = 'destination-out'; mg.setTransform(D, 0, 0, D, 0, 0);
      for (let y = Math.max(0, y0); y <= Math.min(n - 1, y0 + CHUNK + 2); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(n - 1, x0 + CHUNK + 2); x++) {
        const o = map.obst[y * n + x]; if (!o || (o === OBST.MOUNT && levelOf(map, x, y))) continue; const s = obstacleSprite(o, map.terrain[y * n + x], thash(x, y, map.seed + 2) % (o === OBST.TREE ? 4 : 8), SN, levelOf(map, x, y)); put(mg, s, x * AP + 8 - bx, y * AP + 8 - by);
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
    if (!ch._deep || G.settings.quality === 'low' || ZOOM < 1) return; if (b.isGL) return GLMap.water(b, ch, dx, dy, size, wx, wy); const S = Math.round(ch.width / MapRender.D), t = G.time; // karta graficzna: shader wody (GLMap.water). Fale liczone w dawnych (grubych) pikselach: 4 razy mniej pracy. Fale na wodzie: nie przy niskiej jakości ani po oddaleniu (za drobne, a kosztowne)
    const tmp = this.tmp || (this.tmp = document.createElement('canvas')); if (tmp.width !== S) { tmp.width = tmp.height = S; }
    const g = tmp.getContext('2d'), pat = g.createPattern(this.pattern(), 'repeat');
    const layer = (ox, oy, a) => { g.save(); g.globalAlpha = a; g.translate(ox, oy); g.fillStyle = pat; g.fillRect(-ox, -oy, S, S); g.restore(); };
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S);
    wx /= MapRender.D; wy /= MapRender.D; layer(Math.floor(t * 4) - wx, Math.floor(t * 1.5) - wy, 0.5 + 0.2 * Math.sin(t * 1.3));
    layer(-Math.floor(t * 3) - wx + 21, Math.floor(t * 2) - wy + 13, 0.35 + 0.2 * Math.sin(t * 1.7 + 2));
    g.globalCompositeOperation = 'destination-in'; g.drawImage(ch._deep, 0, 0, S, S);
    b.drawImage(tmp, dx, dy, size, size);
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S); g.fillStyle = this.foam || (this.foam = `rgb(${gradeRgb(hexRgb('#eef8fc')).map(Math.round).join(',')})`); g.globalAlpha = 0.22 + 0.2 * Math.sin(t * 2.2); g.fillRect(0, 0, S, S); g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-in'; g.drawImage(ch._shore, 0, 0, S, S); g.globalCompositeOperation = 'source-over';
    b.drawImage(tmp, dx, dy, size, size);
  },
};
// Minimapa: 1 piksel na pole, kolory bazowe z palety terenu po korekcji barw mapy
// Kawałek mapy w całości w litej skale między poziomami (nigdy nie widać go z kamery)
const voidChunk = (map, cx, cy) => { if (!map.ln) return false; const x0 = cx * CHUNK, y0 = cy * CHUNK, x1 = x0 + CHUNK - 1, y1 = y0 + CHUNK - 1, ln = map.ln; return (x0 >= ln && y1 < ln) || (x1 < ln && y0 >= ln); };
function buildMinimap(map, ex) {
  const n = map.n, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  const ter = TPAL.map(p => gradeRgb(p[1])), obst = TPAL.map(p => gradeRgb(p[0]).map(v => v * 0.62)), road = RPAL.map(p => p && gradeRgb(p[1]));
  for (let i = 0; i < n * n; i++) {
    const [r, gg, b] = (ex && !ex[i]) || (map.ln && map.obst[i] === OBST.MOUNT && levelOf(map, i % n, (i / n) | 0)) ? [0, 0, 0] : map.obst[i] ? obst[map.terrain[i]] : map.road[i] ? road[map.road[i]] : ter[map.terrain[i]];
    const o = i * 4; img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}
// Pamięć podręczna wyrenderowanych fragmentów mapy (8×8 pól)
const MapRender = {
  map: null, explored: null, season: 0, gen: 0, cache: new Map(), fog: new Map(), mini: null, miniDirty: false,
  // D: gęstość terenu (pikseli fragmentu na piksel grafiki = 2 px logiczne); gładko: tyle, ile bufora świata (ostro, bez powiększania)
  D: PXD,
  reset(map, explored) { this.gen++; this.map = map; this.explored = explored || null; this.cache.clear(); this.alt = null; this.job = null; this.sprIt = null; this.fog.clear(); this.mini = null; this.warmed = false; this.D = mapDensity(); },
  // Zmiana przybliżenia (inna gęstość terenu): kawałki dotychczasowej gęstości zostają jako zapas (alt) – do czasu domalowania
  // nowych widok pokazuje stare, przeskalowane, a powrót do poprzedniego przybliżenia jest natychmiastowy (bez malowania od nowa)
  setDensity(D) { if (D === this.D) return; this.gen++; const prev = { D: this.D, cache: this.cache }; if (this.alt && this.alt.D === D) { this.cache = this.alt.cache; } else this.cache = new Map(); this.alt = prev; this.D = D; this.job = null; this.warmed = false; },
  // Nowe grafiki terenu (tekstury, drzewa i góry) wczytane po pokazaniu mapy: teren maluje się od nowa, ale raz dla kilku obrazków
  // naraz (odczekanie), a do czasu domalowania widać dotychczasowe kawałki (zapas bez gęstości: nie wraca jako gotowy po zmianie przybliżenia)
  refresh() { if (!this.map) return; clearTimeout(this._rt); this._rt = setTimeout(() => { this.gen++; if (this.cache.size) this.alt = { D: null, cache: this.cache }; this.cache = new Map(); this.job = null; this.warmed = false; G.dirty = true; }, 80); },
  stale(cx, cy) { return this.alt ? this.alt.cache.get(cx + ',' + cy) || null : null; },
  // Pora roku: po zmianie wszystkie kawałki terenu rysują się od nowa
  setSeason(s) { if (this.season !== s) { this.gen++; this.season = s; this.cache.clear(); this.alt = null; this.job = null; this.warmed = false; } },
  // Gotowy kawałek terenu; nowy powstaje tylko, gdy pozwala na to budżet czasu klatki (allow), inaczej null (zastępczy rysunek)
  get(cx, cy, allow = true) {
    const key = cx + ',' + cy; let c = this.cache.get(key);
    if (c) { this.cache.delete(key); this.cache.set(key, c); return c; }
    if (!allow) return null;
    if (this.job && this.job.key === key) this.job = null; // kawałek malowany w tle jest potrzebny teraz: od razu w całości
    return this.store(key, renderChunkPixel(this.map, cx, cy));
  },
  store(key, c) {
    this.cache.set(key, c); this.lastGen = performance.now();
    const nC = Math.ceil(this.map.n / CHUNK), cap = this.D > mapBufScale() * 2.5 ? 110 : Math.max(160, nC * nC); if (this.cache.size > cap) this.cache.delete(this.cache.keys().next().value); // gęsty komplet (duże przybliżenie): najwyżej ~110 kawałków, najdawniej oglądane wypadają // mieści całą mapę (olbrzymia: 324 kawałki, ~21 MB)
    return c;
  },
  has(cx, cy) { return this.cache.has(cx + ',' + cy); },
  // Kawałki terenu malują się w tle, w wolnych chwilach między klatkami (requestIdleCallback), od najbliższych widoku aż po całą mapę:
  // przewijanie nie musi ich malować w trakcie klatki (jeden kawałek to 15–45 ms na słabszym komputerze, czyli szarpnięcie obrazu).
  warm(st) {
    if (this.warming || this.warmed || !st || st.map !== this.map) return; this.warming = true;
    const idle = window.requestIdleCallback ? f => window.requestIdleCallback(f, { timeout: 120 }) : f => setTimeout(() => f(null), 16);
    idle(dl => {
      this.warming = false; if (!G.state || G.state.map !== this.map) return;
      const n = this.map.n, nC = Math.ceil(n / CHUNK), CP = CHUNK * T, cam = G.state.cam || { x: 0, y: 0 }, mx = (cam.x + viewW() / 2) / CP, my = (cam.y + viewH() / 2) / CP, todo = [];
      // kolejność: od widoku, ale też od twoich bohaterów i miast (przeskok do innego bohatera trafia na gotowy teren)
      const pts = [[mx, my, 0]]; try { const me = G.state.players[ME]; for (const h of G.state.heroes) if (h && h.owner === ME && h.x != null) pts.push([(h.x + 0.5) / CHUNK, (h.y + 0.5) / CHUNK, 0.6]); for (const t of G.state.towns) if (t.owner === ME) pts.push([(t.x + 0.5) / CHUNK, (t.y + 0.5) / CHUNK, 1.2]); void me; } catch (e) { /* stan bez graczy (podgląd) */ }
      for (let cy = 0; cy < nC; cy++) for (let cx = 0; cx < nC; cx++) if (!this.has(cx, cy) && !voidChunk(this.map, cx, cy)) todo.push([cx, cy, Math.min(...pts.map(([px, py, w]) => Math.hypot(cx + 0.5 - px, cy + 0.5 - py) + w))]);
      const end = performance.now() + (dl && dl.timeRemaining ? Math.max(6, dl.timeRemaining() - 2) : 6);
      // obrazki obiektów mapy (od najbliższych): pierwsze narysowanie każdego kosztuje, np. przy oddaleniu – część każdej wolnej chwili
      if (this.sprIt !== false) { if (!this.sprIt) this.sprIt = mapSpriteJobs(G.state, mx * CHUNK, my * CHUNK); const e2 = todo.length ? performance.now() + Math.max(3, (end - performance.now()) * 0.4) : end; let r; do r = this.sprIt.next(); while (!r.done && performance.now() < e2); if (r.done) this.sprIt = false; }
      if (!todo.length) { if (this.sprIt === false) { this.warmed = true; return; } this.warm(G.state); return; }
      todo.sort((a, b) => a[2] - b[2]);
      // wątki w tle: zlecamy najbliższe kawałki; następne zleca odpowiedź wątku (TerrainPool.done), a tu zostają tylko obrazki obiektów
      const vis = Math.hypot(viewW(), viewH()) / CP / 2 + 1;
      // (kawałki blisko widoku: wszystkie wątki naraz; dalsze, na zapas: po jednym, żeby nie zabierać rdzeni wątkowi gry)
      if (TerrainPool.on()) { TerrainPool.request(this, todo.filter(t => t[2] < vis + 1.5), TerrainPool.cap()); TerrainPool.request(this, todo, 1); if (this.sprIt) this.warm(G.state); return; }
      // porcjami, najwyżej do końca wolnego czasu (kawałek dokończy się w następnych chwilach); w widoku do tego czasu stoi zastępczy kawałek
      for (const [cx, cy, d] of todo) {
        const key = cx + ',' + cy; if (!this.job || this.job.key !== key || this.job.map !== this.map) this.job = { key, map: this.map, it: renderChunkSteps(this.map, cx, cy) };
        let r; do r = this.job.it.next(); while (!r.done && performance.now() < end);
        if (!r.done) break; this.job = null; this.store(key, r.value); if (d < vis && G.screenName === 'adventure') G.dirty = true; // inny ekran: nie wymuszamy klatek if (performance.now() >= end) break;
      }
      this.warm(G.state);
    });
  },
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
// Układ mapy przygody (jednostki interfejsu) zależy od rozmiaru okna (VW×VH): mapa zajmuje wszystko poza panelem po prawej,
// panel i pasek surowców trzymają się prawej i dolnej krawędzi, a lista bohaterów i miast rośnie z wysokością.
// Niskie okno (telefon poziomo): panel kompaktowy – mniejsza minimapa, bez okienka wieści (komunikaty jako pasek na mapie).
const LIST_ROW_H = 48; let LIST_ROWS = 3;
const PANEL = { by1: 176, by2: 212, compact: false }; // rzędy przycisków panelu
function layoutAdventure() {
  const compact = PANEL.compact = VH < 560, px = VW - 200;
  VIEW.w = px - 24; VIEW.h = VH - 48;
  MINI.s = compact ? 112 : 144; MINI.y = compact ? 14 : 24; MINI.x = px + (compact ? 42 : 24);
  PANEL.by1 = MINI.y + MINI.s + 8; PANEL.by2 = PANEL.by1 + 36;
  LIST.x = INFOBOX.x = px; LIST.y = PANEL.by2 + 50;
  INFOBOX.h = compact ? 0 : 108; INFOBOX.y = compact ? VH : VH - 144; LIST.h = (compact ? VH - 39 : INFOBOX.y - 8) - LIST.y;
  LIST_ROWS = Math.floor((LIST.h - 28) / LIST_ROW_H); // nad wierszami pasek zakładek (bohaterowie / miasta)
}
// Przybliżenie mapy (kółko myszy): ZOOM > 1 powiększa. viewW/viewH = ile pikseli świata mieści widok.
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2]; let ZOOM = 1; // największe przybliżenie 2× (na laptopie 1,5× było za daleko; obiekty 3D przy 2× minimalnie miękkie)
// Gęstość malowania terenu: jedna dla wszystkich przybliżeń (jak przy 1×). Przybliżanie i oddalanie tylko skaluje gotowe kawałki
// (robi to karta graficzna, natychmiast), zamiast malować całą mapę od nowa przy każdym kroku; przy 1,25–1,5× teren jest
// minimalnie miękki, ale nic się nie doczytuje, a pamięć zostaje jak przy 1×
const mapDensity = () => (PIXEL_ART ? PXD : clamp(Math.round(mapBufScale() * 2 * (ZOOM >= 1.5 ? 2 : 1) * 4) / 4, PXD, 8)); // duże przybliżenia (1,5–2×): drugi, gęstszy komplet kawałków (raz namalowany, potem w zapasie)
const viewW = () => VIEW.w / ZOOM, viewH = () => VIEW.h / ZOOM;
// Kamera w granicach oglądanego poziomu (st.view: 0 powierzchnia, 1 podziemia); bez podziemi cała mapa
function camClamp(st) { const L = st.map.ln ? st.view || 0 : 0, o = levelOrigin(st.map, L) * T, m = levelSize(st.map) * T, w = viewW(), h = viewH();
  st.cam.x = w > m + 2 * T ? o + (m - w) / 2 : clamp(st.cam.x, o - T, o + m - w + T); st.cam.y = h > m + 2 * T ? o + (m - h) / 2 : clamp(st.cam.y, o - T, o + m - h + T); }
function centerCam(st, tx, ty) { st.view = levelOf(st.map, Math.floor(tx + 0.5), Math.floor(ty + 0.5)); st.cam = { x: tx * T + T / 2 - viewW() / 2, y: ty * T + T / 2 - viewH() / 2 }; camClamp(st); }
// Przełączenie widoku między powierzchnią a podziemiami: to samo miejsce na drugim poziomie
function switchLevel(st) { if (!st.map.ln) return; const ln = st.map.ln, d = st.view ? -ln : ln; st.view = st.view ? 0 : 1; st.cam.x += d * T; st.cam.y += d * T; camClamp(st); MapRender.miniDirty = true; G.dirty = true; }
function screenToTile(st, x, y) { return { tx: Math.floor(((x - VIEW.x) / ZOOM + st.cam.x) / T), ty: Math.floor(((y - VIEW.y) / ZOOM + st.cam.y) / T) }; }
// Pole pod kursorem z uwzględnieniem tego, co narysowane: postać bohatera, potwora czy skarbu sięga pola nad sobą, budowla nawet
// dwóch pól – kliknięcie (i podświetlenie, kursor, opis) w głowę bohatera albo dach zamku trafia w nie, a nie w puste pole za nimi
function pickTile(st, x, y) {
  const p = screenToTile(st, x, y), n = st.map.n; if (p.tx < 0 || p.ty < 0 || p.tx >= n || p.ty >= n) return p;
  if (heroAt(st, p.tx, p.ty)) return p; const own = objectAt(st, p.ty * n + p.tx); if (own) return own.blocks ? { tx: own.x, ty: own.y } : p;
  const ob = drawnObjectAt(st, p.tx, p.ty); if (ob) return { tx: ob.x, ty: ob.y };
  if (p.ty + 1 < n) { if (heroAt(st, p.tx, p.ty + 1)) return { tx: p.tx, ty: p.ty + 1 }; const o = objectAt(st, (p.ty + 1) * n + p.tx); if (o && ['monster', 'art', 'res', 'chest', 'boat'].includes(o.type)) return { tx: p.tx, ty: p.ty + 1 }; }
  return p;
}
// Zmienia przybliżenie o krok (d = -1 bliżej, +1 dalej), trzymając w miejscu punkt świata pod myszą (sx, sy)
function setZoom(st, z, sx = VIEW.x + VIEW.w / 2, sy = VIEW.y + VIEW.h / 2) {
  z = clamp(z, ZOOMS[0], ZOOMS[ZOOMS.length - 1]); if (z === ZOOM) return false;
  const wx = st.cam.x + (sx - VIEW.x) / ZOOM, wy = st.cam.y + (sy - VIEW.y) / ZOOM; ZOOM = z;
  st.cam.x = wx - (sx - VIEW.x) / ZOOM; st.cam.y = wy - (sy - VIEW.y) / ZOOM; camClamp(st); MapRender.warmed = false; G.settings.zoom = z; saveSettings();
  if (MapRender.map && mapDensity() !== MapRender.D) MapRender.setDensity(mapDensity()); // inna gęstość terenu: nowe kawałki malują się w tle, do tego czasu stare
  return true;
}
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
  const map = st.map, n = map.n, ls = levelSize(map), L = map.ln ? st.view || 0 : 0, o = levelOrigin(map, L), k = MINI.s / (ls * T), ex = human(st).explored, sc = MINI.s / ls;
  const mark = (x, y, c, s) => { // x, y = środek w polach
    if (levelOf(map, Math.floor(x), Math.floor(y)) !== L) return; x -= o; y -= o; // tylko oglądany poziom
    const sx = Math.round(MINI.x + x * sc - s / 2), sy = Math.round(MINI.y + y * sc - s / 2);
    ctx.fillStyle = '#000'; ctx.fillRect(sx - 1, sy - 1, s + 2, s + 2); ctx.fillStyle = c; ctx.fillRect(sx, sy, s, s);
  };
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(MapRender.miniCanvas(), o, o, ls, ls, MINI.x, MINI.y, MINI.s, MINI.s); ctx.imageSmoothingEnabled = true;
  ctx.beginPath(); ctx.rect(MINI.x, MINI.y, MINI.s, MINI.s); ctx.clip();
  for (const ob of st.objects) {
    if (ob.dead || !ex[ob.y * n + ob.x]) continue;
    if (ob.type === 'mine') mark(ob.x, ob.y, ownerColor(st, ob.owner), 4);          // kopalnia: pola x-1..x, y-1..y
    else if (ob.type === 'town') mark(ob.x + 0.5, ob.y, ownerColor(st, ob.owner), 6); // miasto: pola x-1..x+1, y-1..y
  }
  for (const h of st.heroes) if (h.owner === ME && h.garrison == null) mark(h.x + 0.5, h.y + 0.5, h === hero(st) ? '#fff4c8' : '#c8bc98', 4);
  ctx.strokeStyle = '#fff4c8'; ctx.lineWidth = 1.2; ctx.strokeRect(MINI.x + (st.cam.x - o * T) * k, MINI.y + (st.cam.y - o * T) * k, viewW() * k, viewH() * k);
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
  const S = Math.round(CHUNK * AP * MapRender.D), x0 = cx * CHUNK - 1, y0 = cy * CHUNK - 1, x1 = x0 + CHUNK + 1, y1 = y0 + CHUNK + 1; let sig = 0, any = false;
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(n - 1, x1); x++) if (!ex[y * n + x]) { sig = (sig * 31 + y * n + x) | 0; any = true; }
  const key = cx + ',' + cy, old = MapRender.fog.get(key); if (old && old._sig === sig) return old.c;
  let c = null;
  if (any) {
    const w = pixBuf('fogWork', S, S, true), f = w._ctx, ox = -cx * CHUNK * T, oy = -cy * CHUNK * T; f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, S, S);
    const fk = S / (CHUNK * T); f.setTransform(fk, 0, 0, fk, 0, 0); // px logiczne → piksele kawałka (gęstość terenu)
    for (const [alpha, extra] of [[0.45, 7], [1, 0]]) {
      f.fillStyle = `rgba(0,0,0,${alpha})`; f.beginPath();
      for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(n - 1, x1); x++) {
        if (ex[y * n + x]) continue; const r0 = T * 0.72 + (thash(x, y, 3) % 4) + extra, px = ox + x * T + 16, py = oy + y * T + 16;
        f.moveTo(px + r0, py); f.arc(px, py, r0, 0, TAU);
      }
      f.fill();
    }
    const img = f.getImageData(0, 0, S, S), d = img.data, bx = cx * S, by = cy * S;
    for (let y = 0, k = 0; y < S; y++) for (let x = 0; x < S; x++, k += 4) { const a = d[k + 3]; d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = !PIXEL_ART ? a : (a >= 225 || (a >= 70 && ((bx + x + by + y) & 1))) ? 255 : 0; } // gładko: miękki brzeg mgły
    // gotowy kawałek w zwykłym płótnie (roboczy, czytany procesorem, służy tylko do liczenia)
    c = document.createElement('canvas'); c.width = c.height = S; c._noAtlas = 1; c.getContext('2d').putImageData(img, 0, 0);
  }
  MapRender.fog.set(key, { c, _sig: sig }); if (MapRender.fog.size > 80) MapRender.fog.delete(MapRender.fog.keys().next().value);
  return c;
}
function drawFogPixel(b, st, ox, oy, c0, c1, r0, r1) {
  const ex = human(st).explored, n = st.map.n, CP = CHUNK * T;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) { const f = fogChunk(ex, n, cx, cy); if (f) b.drawImage(f, ox + cx * CP, oy + cy * CP, CP, CP); }
}
const XRAY = new Map(), XRAY_ID = new WeakMap(); let xraySeq = 0;
const xrayId = g => { let i = XRAY_ID.get(g); if (!i) XRAY_ID.set(g, (i = ++xraySeq)); return i; };
function drawWorldPixel(b, st) {
  const map = st.map, n = map.n, CP = CHUNK * T, camX = Math.round(st.cam.x / PIX) * PIX, camY = Math.round(st.cam.y / PIX) * PIX, nC = Math.ceil(n / CHUNK);
  b.fillStyle = '#000'; b.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  const c0 = Math.max(0, Math.floor(camX / CP)), c1 = Math.min(nC - 1, Math.floor((camX + VIEW.w - 1) / CP));
  const r0 = Math.max(0, Math.floor(camY / CP)), r1 = Math.min(nC - 1, Math.floor((camY + VIEW.h - 1) / CP));
  const ox = VIEW.x - camX, oy = VIEW.y - camY;
  // kawałki terenu malują się w tle (MapRender.warm), nie w klatce: brakujący widoczny kawałek na chwilę zastępuje rysunek
  // w kolorach minimapy, a tło dorysowuje go w najbliższej wolnej chwili (najwyżej po ~0,1 s). Pierwsza klatka widoku maluje wszystko.
  MapRender.warm(st); const first = !MapRender.cache.size && !MapRender.alt; // po zmianie przybliżenia nie malujemy wszystkiego w jednej klatce: są stare kawałki
  // Brakujące kawałki w widoku (skok kamery do innego bohatera, przewinięcie daleko): od środka widoku malujemy od razu, w tej klatce,
  // ile zmieści się w ~20 ms (co najmniej jeden), zamiast czekać na wolne chwile tła – przy animowanej mapie bywa ich mało i teren
  // doczytywał się kilka sekund. Reszta w następnych klatkach, a do tego czasu stary albo zastępczy rysunek.
  { const t0 = performance.now(), mcx = (camX + VIEW.w / 2) / CP, mcy = (camY + VIEW.h / 2) / CP, miss = [];
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) if (!MapRender.has(cx, cy)) miss.push([cx, cy, Math.hypot(cx + 0.5 - mcx, cy + 0.5 - mcy)]);
    miss.sort((a, b) => a[2] - b[2]);
    if (TerrainPool.on()) TerrainPool.request(MapRender, miss, TerrainPool.cap() + miss.length); // wątki w tle: widoczne przed resztą, klatka nie czeka
    else for (const [cx, cy] of miss) { if (performance.now() - t0 > 20 && !first) break; MapRender.get(cx, cy, true); } }
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    const ch = MapRender.get(cx, cy, false), x = ox + cx * CP, y = oy + cy * CP;
    if (!ch) { const old = MapRender.stale(cx, cy); if (old) b.drawImage(old, x, y, CP, CP); else MapRender.placeholder(b, cx, cy, x, y); G.dirty = true; continue; }
    b.drawImage(ch, x, y, CP, CP); WaterFx.draw(b, ch, x, y, CP, cx * ch.width, cy * ch.width);
  }
  const tx0 = Math.floor(camX / T) - 2, ty0 = Math.floor(camY / T) - 1, tx1 = Math.floor((camX + VIEW.w) / T) + 2, ty1 = Math.floor((camY + VIEW.h) / T) + 2, list = [];
  drawHoles(b, st, ox, oy, tx0, ty0, tx1, ty1);
  if (hero(st)) drawPathPixel(b, st, hero(st), ox, oy);
  for (const ob of st.objects) if (!ob.dead && ob.x >= tx0 && ob.x <= tx1 && ob.y >= ty0 && ob.y <= ty1) list.push({ y: ob.y, ob });
  for (const h of st.heroes) { if (h.garrison != null) continue; const [hx, hy] = heroDrawPos(h); list.push({ y: hy + 0.5, hero: h, hx, hy }); }
  for (const c of st.caravans || []) { if (c.owner !== ME) continue; const [cx, cy] = caravanPos(st, c); if (cx >= tx0 && cx <= tx1 && cy >= ty0 && cy <= ty1) list.push({ y: cy + 0.4, caravan: c, cx, cy }); } // własne karawany w drodze
  // drzewa, góry i skały są wtopione w teren (pod obiektami); te, które stoją tuż przed obiektem albo bohaterem
  // (1–2 rzędy niżej), rysujemy jeszcze raz w kolejności głębi, żeby zasłaniały to, co jest za nimi
  if (!PIXEL_ART) { const seenO = new Set(), map = st.map, n = map.n, SN = MapRender.season || 0;
    for (const it of list.slice()) { const ox0 = it.hero ? Math.round(it.hx) : it.caravan ? Math.round(it.cx) : it.ob.x, oy0 = it.hero ? Math.round(it.hy) : it.caravan ? Math.round(it.cy) : it.ob.y, wide = it.ob && (it.ob.type === 'town' || it.ob.type === 'mine' || it.ob.type === 'bank') ? 2 : 1;
      for (let dy = 1; dy <= 2; dy++) for (let dx = -wide; dx <= wide; dx++) { const x = ox0 + dx, y = oy0 + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue; const i = y * n + x; if (!map.obst[i] || seenO.has(i) || (map.obst[i] === OBST.MOUNT && levelOf(map, x, y))) continue; seenO.add(i);
        list.push({ y: y + 0.45, occ: i, s: obstacleSprite(map.obst[i], map.terrain[i], thash(x, y, map.seed + 2) % (map.obst[i] === OBST.TREE ? 4 : 8), SN, levelOf(map, x, y)), x, ty: y, ug: levelOf(map, x, y) }); } } }
  list.sort((a, c) => a.y - c.y);
  const shadow = (w, x, y) => { b.globalAlpha = 0.3; blitG(b, shadowSprite(w), x, y); b.globalAlpha = 1; };
  // każdy rysowany obiekt zapamiętuje swoje sprite'y (do sylwetek zasłoniętych obiektów)
  const recs = [], bl = (sp, x, y) => { const g = gradedSprite(sp); blit(b, g, x, y); if (cur) cur.push([g, x, y]); }; let cur = null;
  for (const it of list) {
    cur = []; recs.push({ it, sp: cur });
    if (it.occ != null) { bl(it.s, ox + it.x * T + 16, oy + it.ty * T + 16); continue; }
    if (it.hero) { const x = ox + it.hx * T + 16, y = oy + it.hy * T + 16, h3 = heroMap3d(it.hero, ownerColor(st, it.hero.owner)); shadow(14, x, y + 13); const hb = it.hero.boat && map3dTinted(`boatHero_${Math.floor(G.time * 4) % 4}`, ownerColor(st, it.hero.owner), it.hero.dir < 0); // łódź z bohaterem: żagiel w barwie gracza, kołysanie
      if (hb) bl(hb, x, y + 8 + Math.round(Math.sin(G.time * 2) * 1.2)); else if (h3) bl(h3, x, y + 13); else bl(heroSprite(it.hero, ownerColor(st, it.hero.owner)), x, y); continue; }
    if (it.caravan) { const x = ox + it.cx * T + 16, y = oy + it.cy * T + 16, c3 = map3dTinted(`caravan_${Math.floor(G.time * 6) % 4}`, ownerColor(st, it.caravan.owner)); if (c3) { bl(c3, x, y + 8); continue; } shadow(12, x, y + 10); bl(caravanSprite(ownerColor(st, it.caravan.owner), Math.floor(G.time * 3) % 2), x, y + 8); continue; }
    const ob = it.ob, px = ox + ob.x * T + 16, py = oy + ob.y * T + 16;
    if (ob.type === 'monster') { shadow(10, px, py + 10); bl(creatureSprite(ob.cid, ob.dir, Math.floor(G.time * 3 + ob.x * 0.7 + ob.y * 0.3) % 4), px, py + 10); }
    else if (ob.type === 'res') { const s3 = map3dSprite('res_' + ob.res); if (s3) bl(s3, px, py + 6); else { shadow(10, px, py + 9); bl(resSprite(ob.res), px, py + 2); } } // 3D: własny cień na ziemi
    else if (ob.type === 'chest') { const s3 = map3dSprite('chest'); if (s3) bl(s3, px, py + 6); else { shadow(10, px, py + 9); bl(chestSprite(), px, py + 2); } }
    else if (ob.type === 'boat') { const s3 = map3dSprite('boat'); if (s3) bl(s3, px, py + 4 + Math.round(Math.sin(G.time * 2 + ob.id) * 1.2)); else bl(boatSprite(Math.floor(G.time * 4 + ob.id) % 4), px, py); }
    else if (ob.type === 'site') { const f3 = siteFrame(ob), s3 = (f3 && map3dSprite(`site_${ob.kind}_${f3}`)) || map3dSprite('site_' + ob.kind); /* klatki ruchu: wiatrak, młyn, ogień, portal */ if (s3) bl(s3, px, py + 6); else { shadow(14, px, py + 12); bl(siteSprite(ob.kind, siteFrame(ob)), px, py + 14); } }
    else if (ob.type === 'art') { const s3 = map3dSprite('art_' + ob.art); if (s3) bl(s3, px, py + 6); else { shadow(9, px, py + 10); bl(artSprite(ob.art), px, py + 1 + Math.round(Math.sin(G.time * 2 + ob.id) * 1.5) * 2); } }
    else if (ob.type === 'bank') { const s3 = map3dSprite(`bank_${ob.kind}_${ob.cleared ? 1 : 0}`); if (s3) bl(s3, px - 8, py - 4); else bl(bankSprite(ob.kind, ob.cleared), ox + (ob.x - 1) * T, oy + (ob.y - 1) * T); } // 3D: środek bloku 2×2, wejście z przodu
    else if (ob.type === 'mine') { const mx = ox + (ob.x - 1) * T, my = oy + (ob.y - 1) * T, s3 = map3dSprite('mine_' + ob.kind); if (s3) bl(s3, px + 6, py); else bl(mineSprite(ob.kind), mx, my); bl(flagSprite(ownerColor(st, ob.owner), 12, 7), mx + 56, my - 2); }
    else if (ob.type === 'town') {
      const t = st.towns[ob.townId], lvl = townLevel(t), mx = ox + (ob.x - 1) * T, my = oy + (ob.y - 1) * T, fc = ownerColor(st, ob.owner);
      const k3 = `town_${t.faction}_${lvl}`, s3 = map3dSprite(k3);
      if (s3) { const gy = py - 14; bl(s3, px, gy); for (const [fx, fy] of map3dFlags(k3)) bl(flagSprite(fc, 10, 6), px + fx, gy + fy - 22); continue; } // 3D: brama tuż za polem wejścia (bohater stoi przed nią), flagi na masztach modelu
      bl(townSprite(t.faction, lvl), mx, my);
      for (const [fx, fy] of townFlagPoints(t.faction, lvl)) bl(flagSprite(fc, 10, 6), mx + fx, my + fy - 20); // drzewce stoi na szczycie dachu
    }
  }
  // Zasłonięte obiekty: tam, gdzie zasłania je coś narysowanego później (drzewo, góra, budowla), widać ich ciemną sylwetkę;
  // obiekt pod kursorem myszy rysujemy na wierzchu w całości
  if (!PIXEL_ART) {
    const rect = ([g, x, y]) => [x - g.ax * g.u, y - g.ay * g.u, g.c.width * g.u, g.c.height * g.u], hit = (p, q) => p[0] < q[0] + q[2] && q[0] < p[0] + p[2] && p[1] < q[1] + q[3] && q[1] < p[1] + p[3];
    const mt = G.mouse.type === 'mouse' && inRect(G.mouse.x, G.mouse.y, { x: VIEW.x, y: VIEW.y, w: VIEW.w * ZOOM, h: VIEW.h * ZOOM }) ? screenToTile(st, G.mouse.x, G.mouse.y) : null; let top = null;
    recs.forEach((r, i) => {
      const it = r.it, key = it.hero || it.caravan || (it.ob && ['monster', 'art', 'res', 'chest', 'boat'].includes(it.ob.type)); if (!key || !r.sp.length) return;
      const main = r.sp[r.sp.length - 1], R0 = rect(main), occ = []; for (let j = i + 1; j < recs.length; j++) for (const q of recs[j].sp) if (hit(R0, rect(q))) occ.push(q); if (!occ.length) return;
      const tx = it.hero ? Math.round(it.hx) : it.caravan ? Math.round(it.cx) : it.ob.x, ty = it.hero ? Math.round(it.hy) : it.caravan ? Math.round(it.cy) : it.ob.y;
      if (mt && mt.tx === tx && mt.ty === ty) { top = r; return; }
      const T0 = b.getTransform(), k = T0.a, W0 = Math.ceil(R0[2] * k) + 2, H0 = Math.ceil(R0[3] * k) + 2;
      // sylwetka zależy tylko od obrazków i ich wzajemnego położenia: gotowa zostaje w pamięci (XRAY), dopóki nic się nie poruszy
      const rel = q => xrayId(q[0]) + ':' + (q[1] - R0[0]).toFixed(2) + ',' + (q[2] - R0[1]).toFixed(2), xk = k.toFixed(3) + '|' + r.sp.map(rel).join(';') + '|' + occ.map(rel).join(';');
      let xb = XRAY.get(xk);
      if (xb) { XRAY.delete(xk); XRAY.set(xk, xb); }
      else { xb = document.createElement('canvas'); xb.width = W0; xb.height = H0; xb._noAtlas = 1; const xg = xb.getContext('2d'); xg.setTransform(k, 0, 0, k, -R0[0] * k, -R0[1] * k);
        for (const q of occ) blit(xg, q[0], q[1], q[2]); xg.globalCompositeOperation = 'source-in'; for (const q of r.sp) blit(xg, tintSprite(q[0], '#1a1626'), q[1], q[2]);
        XRAY.set(xk, xb); if (XRAY.size > 96) XRAY.delete(XRAY.keys().next().value); }
      b.save(); b.globalAlpha = 0.55; b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(xb, R0[0] * k + T0.e, R0[1] * k + T0.f); b.restore();
    });
    if (top) for (const q of top.sp) blit(b, q[0], q[1], q[2]);
  }
  if (!PIXEL_ART) drawMapAmbient(b, st, ox, oy, tx0, ty0, tx1, ty1);
  drawFogPixel(b, st, ox, oy, c0, c1, r0, r1);
  if (G.mouse.type === 'mouse' && inRect(G.mouse.x, G.mouse.y, { x: VIEW.x, y: VIEW.y, w: VIEW.w * ZOOM, h: VIEW.h * ZOOM })) {
    const { tx, ty } = pickTile(st, G.mouse.x, G.mouse.y), x = ox + tx * T, y = oy + ty * T;
    { const n = st.map.n, i = ty * n + tx, live = tx >= 0 && ty >= 0 && tx < n && ty < n && (heroAt(st, tx, ty) || objectAt(st, i)); // bohater albo obiekt do kliknięcia: złoty pierścień pod nim
      if (live) { b.save(); b.strokeStyle = 'rgba(255,214,110,.9)'; b.lineWidth = 2 * PIX; b.shadowColor = '#ffd060'; b.shadowBlur = 8; b.beginPath(); b.ellipse(x + T / 2, y + T * 0.78, T * 0.55, T * 0.26, 0, 0, Math.PI * 2); b.stroke(); b.restore(); } }
    b.fillStyle = 'rgba(255,240,190,.55)'; const q = PIX; b.fillRect(x, y, T, q); b.fillRect(x, y + T - q, T, q); b.fillRect(x, y + q, q, T - 2 * q); b.fillRect(x + T - q, y + q, q, T - 2 * q);
  }
}
// Życie mapy (pod mgłą wojny, więc tylko w odkrytych miejscach): dym z kopalń i kominów miast, błyski słońca na wodzie,
// iskry nad lawą. Wszystko liczone z czasu i skrótu pola (bez stanu), kilkadziesiąt kółek na klatkę.
const SMOKE_COL = { sulfur: '216,206,140', mercury: '170,200,170', gold: '200,190,170', ore: '160,156,150', town: '172,168,162' };
function drawSmoke(b, x, y, seed, rgb, k = 1) {
  const t = G.time, N = 6;
  for (let i = 0; i < N; i++) {
    const p = (t * 0.22 * k + i / N + seed * 0.618) % 1, fade = Math.min(1, p * 5) * (1 - p);
    b.globalAlpha = 0.55 * fade; b.fillStyle = `rgb(${rgb})`;
    b.beginPath(); b.arc(x + Math.sin(p * 4 + seed * 7) * 2.5 + p * 9, y - p * 30 * k, (1.6 + p * 5.5) * k, 0, TAU); b.fill();
  }
  b.globalAlpha = 1;
}
function drawMapAmbient(b, st, ox, oy, tx0, ty0, tx1, ty1) {
  const map = st.map, n = map.n, t = G.time, low = G.settings.quality === 'low';
  b.save();
  for (const ob of st.objects) {
    if (ob.dead || ob.x < tx0 || ob.x > tx1 || ob.y < ty0 || ob.y > ty1) continue; const px = ox + ob.x * T + 16, py = oy + ob.y * T + 16;
    if (ob.type === 'mine' && ob.owner >= 0 && SMOKE_COL[ob.kind]) drawSmoke(b, px - 2, py - 34, ob.id, SMOKE_COL[ob.kind]); // kopalnia pracuje, gdy ma właściciela
    else if (ob.type === 'town') { const lvl = townLevel(st.towns[ob.townId]); drawSmoke(b, px - 20, py - 58, ob.id, SMOKE_COL.town, 0.8); if (lvl >= 2) drawSmoke(b, px + 22, py - 52, ob.id + 0.37, SMOKE_COL.town, 0.7); }
  }
  if (!low && ZOOM >= 1) {
    b.globalCompositeOperation = 'lighter';
    for (let y = Math.max(0, ty0); y <= Math.min(n - 1, ty1); y++) for (let x = Math.max(0, tx0); x <= Math.min(n - 1, tx1); x++) {
      const i = y * n + x, ter = map.terrain[i]; if (ter !== TER.WATER && ter !== TER.LAVA) continue;
      const h = thash(x, y, map.seed + 77); if (h % 4) continue;
      const px = ox + x * T + 4 + (h >> 3) % 24, py = oy + y * T + 4 + (h >> 8) % 24, p = (t * (ter === TER.LAVA ? 0.45 : 0.3) + (h % 997) / 997) % 1;
      if (ter === TER.WATER) { // błysk: krótko rozbłyska i gaśnie
        if (p > 0.12) continue; const a = Math.sin(p / 0.12 * Math.PI), r = 1 + a * 2.2;
        b.globalAlpha = 0.55 * a; b.fillStyle = '#fff6d8'; b.fillRect(px - r, py - 0.5, r * 2, 1); b.fillRect(px - 0.5, py - r, 1, r * 2);
      } else { // iskra unosi się nad lawą
        b.globalAlpha = 0.8 * (1 - p) * Math.min(1, p * 6); b.fillStyle = p < 0.4 ? '#ffd070' : '#ff7a30';
        b.beginPath(); b.arc(px + Math.sin(p * 6 + h) * 3, py - p * 26, 1.3 * (1 - p * 0.5), 0, TAU); b.fill();
      }
    }
  }
  b.restore();
}
// Korekcja barw mapy (przyciemnienie i odbarwienie jak gradeRgb) oraz paleta z ditheringiem są wypalone raz: w kawałkach
// terenu (renderChunkPixel) i w kopiach sprite'ów (blitG). Co klatkę dochodzi tylko gotowa nakładka światła i winiety.
function gradeCanvas(c, ox = 0, oy = 0, step = 18) {
  const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data;
  const [mr, mg, mb] = hexRgb(GRADE.mul).map(v => v / 255), ds = GRADE.desat;
  for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k += 4) {
    if (!d[k + 3]) continue;
    const r = d[k] * mr, gg = d[k + 1] * mg, b = d[k + 2] * mb, l = 0.3 * r + 0.59 * gg + 0.11 * b, o = (BAYER4[((y + oy) & 3) * 4 + ((x + ox) & 3)] / 16 - 0.5) * step;
    if (!PIXEL_ART) { d[k] = r + (l - r) * ds; d[k + 1] = gg + (l - gg) * ds; d[k + 2] = b + (l - b) * ds; continue; } // gładko: sama korekcja barw, bez palety i ditheringu
    d[k] = clamp(Math.round((r + (l - r) * ds + o) / step) * step, 0, 255); d[k + 1] = clamp(Math.round((gg + (l - gg) * ds + o) / step) * step, 0, 255); d[k + 2] = clamp(Math.round((b + (l - b) * ds + o) / step) * step, 0, 255);
  }
  g.putImageData(img, 0, 0); return c;
}
// Obrazki obiektów mapy przygotowywane w tle (MapRender.warm): potwory, budowle, kopalnie, skarby oraz drzewa i góry tuż przed obiektami
function* mapSpriteJobs(st, cx = 0, cy = 0) {
  const map = st.map, n = map.n, SN = MapRender.season || 0, g = s => { if (s && s.c) gradedSprite(s); };
  for (const ob of st.objects.slice().sort((a, c) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(c.x - cx, c.y - cy))) { if (ob.dead) continue; let k = null;
    if (ob.type === 'monster') { for (let i = 0; i < 4; i++) g(creatureSprite(ob.cid, ob.dir, i)); yield; continue; }
    if (ob.type === 'town') { const t = st.towns[ob.townId]; k = `town_${t.faction}_${townLevel(t)}`; }
    else if (ob.type === 'bank') k = `bank_${ob.kind}_${ob.cleared ? 1 : 0}`;
    else if (ob.type === 'res' || ob.type === 'mine' || ob.type === 'site' || ob.type === 'art') k = ob.type + '_' + (ob.res || ob.kind || ob.art);
    else if (ob.type === 'chest' || ob.type === 'boat') k = ob.type;
    if (k) { g(map3dSprite(k)); yield; }
    for (let dy = 1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) { const x = ob.x + dx, y = ob.y + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue; const i = y * n + x; if (!map.obst[i]) continue;
      g(obstacleSprite(map.obst[i], map.terrain[i], thash(x, y, map.seed + 2) % (map.obst[i] === OBST.TREE ? 4 : 8), SN, levelOf(map, x, y))); }
    yield;
  }
}
function gradedSprite(s) {
  if (!s._g) { const c = document.createElement('canvas'); c.width = s.c.width; c.height = s.c.height; c.getContext('2d').drawImage(s.c, 0, 0); s._g = { c: gradeCanvas(c), ax: s.ax, ay: s.ay, u: s.u }; }
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
      const q = PIXEL_ART ? Math.floor(a * 8 + BAYER4[(y & 3) * 4 + (x & 3)] / 16) / 8 : a; // gładko: bez stopni i ditheringu
      d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = clamp(q, 0, 1) * 255;
    }
    c.putImageData(img, 0, 0);
  }, 1);
}
// Gładko: bufor świata w rozdzielczości ekranu (najwyżej 3 piksele na piksel logiczny), żeby świat był ostry
const mapBufScale = () => Math.min(G.rs, 3);
function drawMapView(ctx, st, scr) {
  MapRender.setSeason(seasonIdx(st));
  // Przybliżenie: świat rysujemy w widoku „wirtualnym” (VIEW o rozmiarze viewW × viewH), potem skalujemy do prawdziwego
  const RW = VIEW.w, RH = VIEW.h; VIEW.w = Math.round(RW / ZOOM); VIEW.h = Math.round(RH / ZOOM);
  let ox, oy;
  try {
    // bufor świata: przy oddaleniu ma rozmiar ekranu (świat rysowany pomniejszony, z wygładzaniem), inaczej piksele grafiki
    const sc = Math.min(1, ZOOM) * (PIXEL_ART ? 1 / PIX : mapBufScale()), bw = Math.round(VIEW.w * sc), bh = Math.round(VIEW.h * sc); // gładko: bufor w rozdzielczości ekranu (ostry świat)
    // karta graficzna (GLMap): ten sam kod rysuje do kontekstu WebGL, wynik to płótno WebGL zamiast bufora w pamięci procesora
    const gpu = GLMap.use(), b = gpu ? GLMap.begin(bw, bh) : pixBuf('world', bw, bh)._ctx; // bez willReadFrequently: przy karcie graficznej bufor zostaje na niej
    b.setTransform(sc, 0, 0, sc, -VIEW.x * sc, -VIEW.y * sc); b.imageSmoothingEnabled = ZOOM < 1 || !PIXEL_ART; drawWorldPixel(b, st); b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(mapLight(bw, bh), 0, 0); b.restore();
    const wb = gpu ? GLMap.end() : b.canvas;
    if (gpu) { ctx.clearRect(VIEW.x, VIEW.y, RW, RH); GLMap.place(ctx, VIEW.x, VIEW.y, RW, RH); } else { ctx.save(); ctx.imageSmoothingEnabled = ZOOM < 1 || !PIXEL_ART; ctx.drawImage(wb, VIEW.x, VIEW.y, RW, RH); ctx.restore(); } // karta graficzna: okno mapy w płótnie gry przezroczyste, pod nim płótno WebGL (bez kopiowania obrazu) // oddalenie: pomniejszenie z wygładzaniem
  ox = VIEW.x - Math.round(st.cam.x / PIX) * PIX; oy = VIEW.y - Math.round(st.cam.y / PIX) * PIX; // to samo zaokrąglenie co w drawWorldPixel
  ctx.save(); ctx.beginPath(); ctx.rect(VIEW.x, VIEW.y, RW, RH); ctx.clip();
  ctx.translate(VIEW.x, VIEW.y); ctx.scale(ZOOM, ZOOM); ctx.translate(-VIEW.x, -VIEW.y); // napisy i efekty czarów w skali świata
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
  if (scr.mapFx.length) pixLayer('mapFx', ctx, VIEW.x, VIEW.y, VIEW.w, VIEW.h, ctx => { for (const e of scr.mapFx) {
    const f = (G.time - e.t) / 1.2, x = ox + e.x * T + 16, y = oy + e.y * T + 16; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - f;
    if (e.kind === 'ring') { ctx.strokeStyle = e.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, e.r * T * ease(f), e.r * T * ease(f) * 0.6, 0, 0, TAU); ctx.stroke(); }
    else { const g = ctx.createLinearGradient(0, y - 160, 0, y); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, e.col); ctx.fillStyle = g; ctx.fillRect(x - 18 * (1 - f * 0.5), y - 160, 36 * (1 - f * 0.5), 170); }
    ctx.restore();
  } }, { add: true });
  ctx.restore();
  } finally { VIEW.w = RW; VIEW.h = RH; }
  ctx.save(); ctx.beginPath(); ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h); ctx.clip();
  if (!(st.map.ln && st.view)) { drawSeasonFx(ctx, seasonIdx(st)); drawWeather(ctx, st, ox, oy); } // w podziemiach bez pogody i pór roku
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
  if ((st.holes || []).includes(i)) return 'Wykopany dół: tu już ktoś szukał Graala';
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

// Opady pory roku nad mapą: płatki śniegu zimą, spadające liście jesienią (bez nich przy niskiej jakości)
// ---- Pogoda na mapie (tylko wygląd): losowana codziennie wg pory roku. Nad śniegiem deszcz pada jako śnieg,
// nad piaskiem i lawą nie pada wcale. Chmury rzucają cienie, burza błyska, mgła snuje się pasmami. Wyłącznik w ustawieniach grafiki.
const WEATHERS = { clear: 'pogodnie', clouds: 'pochmurno', rain: 'deszcz', storm: 'burza', fog: 'mgła', snow: 'śnieżyca' };
const WEATHER_ODDS = [ // wiosna, lato, jesień, zima: [pogoda, waga]
  [['clear', 40], ['clouds', 25], ['rain', 25], ['fog', 10]], [['clear', 60], ['clouds', 20], ['storm', 12], ['rain', 8]],
  [['clear', 20], ['clouds', 25], ['rain', 30], ['fog', 15], ['storm', 10]], [['clear', 25], ['clouds', 25], ['snow', 35], ['fog', 15]],
];
function weatherOf(st) {
  if (!st || !st.dayTotal) return 'clear'; const L = WEATHER_ODDS[seasonIdx(st)]; let r = thash(st.seed, st.dayTotal, 77) % L.reduce((s, x) => s + x[1], 0);
  for (const [k, w] of L) if ((r -= w) < 0) return k; return 'clear';
}
const weatherOn = () => G.settings.weather !== 'off';
let WEATHER_BLOB = null; // miękka plama (cień chmury, pasmo mgły)
function weatherBlob() {
  if (WEATHER_BLOB) return WEATHER_BLOB; const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.setTransform(2, 0, 0, 1, 0, 0); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (WEATHER_BLOB = c);
}
function drawWeather(ctx, st, ox, oy) {
  const w = weatherOf(st); if (w === 'clear' || !weatherOn()) return;
  const t = G.time, lo = G.settings.quality === 'low', map = st.map, n = map.n, V = VIEW, blob = weatherBlob();
  const terAt = (x, y) => { const { tx, ty } = screenToTile(st, x, y); return tx < 0 || ty < 0 || tx >= n || ty >= n ? -1 : map.terrain[ty * n + tx]; };
  const blobs = (k, col, a, sp, sw, sh) => { ctx.save(); ctx.globalAlpha = a; for (let i = 0; i < k; i++) { // plamy przesuwają się razem z mapą i z wiatrem
      const x = V.x + ((((i * 263 + ox * 0.9 + t * sp) % (V.w + sw)) + V.w + sw) % (V.w + sw)) - sw / 2, y = V.y + ((((i * 181 + oy * 0.9 + (i % 2 ? 40 : 0)) % (V.h + sh)) + V.h + sh) % (V.h + sh)) - sh / 2;
      ctx.drawImage(col, x - sw / 2, y - sh / 2, sw, sh); } ctx.restore(); };
  if (w !== 'fog') { const sh = tintBlob('#0a1020'); blobs(lo ? 3 : 6, sh, w === 'clouds' ? 0.3 : 0.26, 9, 300, 150); }
  if (w === 'rain' || w === 'storm' || w === 'snow') { ctx.fillStyle = w === 'storm' ? 'rgba(14,20,40,.26)' : w === 'snow' ? 'rgba(200,210,230,.08)' : 'rgba(20,30,50,.14)'; ctx.fillRect(V.x, V.y, V.w, V.h); }
  if (w === 'fog') { ctx.fillStyle = 'rgba(210,215,220,.1)'; ctx.fillRect(V.x, V.y, V.w, V.h); blobs(lo ? 5 : 9, tintBlob('#e8ecf0'), 0.3, 6, 340, 110); }
  if (w === 'rain' || w === 'storm') {
    const N = (w === 'storm' ? 180 : 110) >> (lo ? 1 : 0), flakes = []; ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const sp = 380 + (i % 5) * 45, x = V.x + (((i * 53.7 + t * 70) % V.w) + V.w) % V.w, y = V.y + ((i * 97.3 + t * sp) % V.h), ter = terAt(x, y);
      if (ter === TER.SAND || ter === TER.LAVA) continue; if (ter === TER.SNOW) { flakes.push([x, y]); continue; }
      ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 12);
      if ((i + Math.floor(t * 5)) % 19 === 0) { ctx.moveTo(x - 3, y + 2); ctx.lineTo(x + 3, y + 2); } // bryzg
    }
    ctx.strokeStyle = 'rgba(190,210,240,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (const [x, y] of flakes) ctx.fillRect(x - 1, (y * 0.4 + V.y * 0.6) | 0, 2, 2);
    if (w === 'storm') { const ph = (t + st.dayTotal * 1.7) % 6.5; if (ph < 0.25) { ctx.fillStyle = `rgba(230,240,255,${(0.4 * (1 - ph / 0.25) * (ph < 0.08 || ph > 0.14 ? 1 : 0.3)).toFixed(2)})`; ctx.fillRect(V.x, V.y, V.w, V.h); } } // błyskawica
  }
  if (w === 'snow') {
    const N = lo ? 90 : 200; ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < N; i++) {
      const u = (t * (0.07 + (i % 6) * 0.015) + i * 0.137) % 1, x = V.x + (((i * 83.1 + t * 22 + Math.sin(t * 1.1 + i) * 14) % V.w) + V.w) % V.w, y = V.y + u * V.h;
      if (terAt(x, y) === TER.LAVA) continue; const r = i % 3 ? 3 : 4; ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), r, r);
    }
  }
}
const BLOB_TINTS = {};
function tintBlob(col) {
  if (BLOB_TINTS[col]) return BLOB_TINTS[col]; const b = weatherBlob(), c = document.createElement('canvas'); c.width = b.width; c.height = b.height; const g = c.getContext('2d');
  g.drawImage(b, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return (BLOB_TINTS[col] = c);
}
function drawSeasonFx(ctx, S) {
  if ((S !== 2 && S !== 3) || G.settings.quality === 'low') return;
  const t = G.time, n = S === 3 ? 70 : 22;
  for (let i = 0; i < n; i++) {
    const sp = S === 3 ? 0.05 + (i % 5) * 0.012 : 0.035 + (i % 4) * 0.008, u = (t * sp + i * 0.137) % 1, sway = Math.sin(t * (S === 3 ? 0.9 : 1.6) + i * 1.7);
    const x = VIEW.x + ((i * 97 + (S === 2 ? t * 14 : 0)) % VIEW.w) + sway * (S === 3 ? 10 : 18), y = VIEW.y + u * VIEW.h;
    if (S === 3) { ctx.fillStyle = `rgba(255,255,255,${(0.55 + 0.35 * Math.sin(i)).toFixed(2)})`; const r = i % 3 ? 1.5 : 2.5; ctx.fillRect(x - r / 2, y - r / 2, r, r); }
    else { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.fillStyle = ['#c8501e', '#e0a030', '#8a3a14', '#d87a2a'][i % 4]; ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); }
  }
}
