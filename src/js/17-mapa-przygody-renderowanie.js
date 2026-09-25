// ==================== MAPA PRZYGODY: RENDEROWANIE =======================================
// Teren generowany piksel po pikselu, przeszkody, minimapa, mgła, obiekty, kamera.
function drawOak(g, x, y, s) {
  shadowAt(g, x, y, 9 * s); g.fillStyle = '#4a2e18'; g.fillRect(x - 1.5 * s, y - 9 * s, 3 * s, 9 * s);
  circ(g, x, y - 15 * s, 10 * s, '#1f4a1c'); circ(g, x - 3 * s, y - 17 * s, 8 * s, '#2e6a26');
  circ(g, x + 3 * s, y - 13 * s, 6.5 * s, '#2a6224'); circ(g, x - 4 * s, y - 20 * s, 4.5 * s, '#4c9a3a');
}
function drawPine(g, x, y, s, snowy) {
  shadowAt(g, x, y, 7 * s); g.fillStyle = '#3e2614'; g.fillRect(x - 1.2 * s, y - 5 * s, 2.4 * s, 5 * s);
  for (let i = 0; i < 3; i++) {
    const by = y - 4 * s - i * 7 * s, w = (8 - i * 2) * s, h = 11 * s;
    g.fillStyle = '#1b4428'; g.beginPath(); g.moveTo(x - w, by); g.lineTo(x, by - h); g.lineTo(x + w, by); g.closePath(); g.fill();
    g.fillStyle = '#2d6a3c'; g.beginPath(); g.moveTo(x - w, by); g.lineTo(x, by - h); g.lineTo(x - w * 0.1, by); g.closePath(); g.fill();
    if (snowy) { g.fillStyle = '#f4f8fc'; g.beginPath(); g.moveTo(x - w * 0.45, by - h * 0.55); g.lineTo(x, by - h); g.lineTo(x + w * 0.45, by - h * 0.55); g.lineTo(x + w * 0.15, by - h * 0.45); g.lineTo(x - w * 0.1, by - h * 0.6); g.closePath(); g.fill(); }
  }
}
function drawPalm(g, x, y, s) {
  shadowAt(g, x, y, 7 * s); g.lineCap = 'round';
  g.strokeStyle = '#7a5a30'; g.lineWidth = 2.6 * s; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4 * s, y - 10 * s, x + 2 * s, y - 20 * s); g.stroke();
  const tx = x + 2 * s, ty = y - 20 * s; g.strokeStyle = '#3f8a33'; g.lineWidth = 2.4 * s;
  for (const a of [-2.7, -2.1, -1.2, -0.5, 0.2]) { g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * 7 * s, ty + Math.sin(a) * 7 * s - 2 * s, tx + Math.cos(a) * 11 * s, ty + Math.sin(a) * 11 * s + 4 * s); g.stroke(); }
}
function drawDeadTree(g, x, y, s, col) {
  shadowAt(g, x, y, 6 * s); g.strokeStyle = col; g.lineCap = 'round';
  g.lineWidth = 2.4 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 16 * s); g.stroke();
  g.lineWidth = 1.4 * s; g.beginPath(); g.moveTo(x, y - 9 * s); g.lineTo(x - 6 * s, y - 15 * s); g.moveTo(x, y - 12 * s); g.lineTo(x + 6 * s, y - 18 * s); g.moveTo(x - 3 * s, y - 12 * s); g.lineTo(x - 7 * s, y - 11 * s); g.stroke();
}
function drawWillow(g, x, y, s) {
  shadowAt(g, x, y, 9 * s); g.fillStyle = '#3a2a18'; g.fillRect(x - 1.5 * s, y - 8 * s, 3 * s, 8 * s);
  circ(g, x, y - 14 * s, 9 * s, '#2c4a26'); g.strokeStyle = '#4a6a34'; g.lineWidth = 1.2 * s;
  for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x + k * 2.5 * s, y - 16 * s); g.quadraticCurveTo(x + k * 3.2 * s, y - 10 * s, x + k * 3 * s, y - 4 * s); g.stroke(); }
}
function drawMountain(g, px, py, t, r) {
  const bw = 21 + r() * 6, h = 30 + r() * 14, bx = px + (r() - 0.5) * 6, by = py + 13, tx = bx + (r() - 0.5) * 10, ty = by - h;
  const pal = t === TER.SNOW ? ['#8e9aaa', '#c4ced9', '#66727f'] : t === TER.LAVA ? ['#3a2e2a', '#5a4840', '#221a18'] : t === TER.SAND ? ['#a98656', '#d2ae7a', '#7a5a38'] : ['#7c6e5c', '#a99b84', '#544a3e'];
  const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(bx + 5, by, bw + 2, 6, 0, 0, TAU); g.fill();
  const L = [bx - bw, by], LS = [bx - bw * 0.45, by - h * 0.55], P = [tx, ty], RS = [bx + bw * 0.5, by - h * 0.5], R = [bx + bw, by];
  poly([L, LS, P, RS, R], pal[0]);
  poly([L, LS, P, [tx - 2, by - h * 0.35], [bx - bw * 0.15, by]], pal[1]);
  poly([P, RS, R, [bx + bw * 0.35, by], [tx + 3, by - h * 0.45]], pal[2]);
  if (t === TER.SNOW || r() < 0.35) poly([P, [tx - 7, ty + 10], [tx - 2, ty + 7], [tx + 1, ty + 11], [tx + 6, ty + 8]], '#f3f7fa');
  if (t === TER.LAVA) { g.strokeStyle = '#ff7a2a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(tx, ty + 2); g.lineTo(tx - 2, ty + 12); g.lineTo(tx + 1, ty + 20); g.stroke(); }
  g.strokeStyle = 'rgba(20,14,8,.45)'; g.lineWidth = 1; g.beginPath(); [L, LS, P, RS, R].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
}
function drawRock(g, x, y, r) {
  shadowAt(g, x, y + 1, 8); g.fillStyle = '#6e685f'; g.beginPath(); g.ellipse(x, y - 3, 8, 6, 0, 0, TAU); g.fill();
  g.fillStyle = '#9d968a'; g.beginPath(); g.ellipse(x - 2.5, y - 5, 4, 2.6, -0.3, 0, TAU); g.fill();
  if (r() < 0.5) { g.fillStyle = '#5e584f'; g.beginPath(); g.ellipse(x + 7, y, 4, 3, 0, 0, TAU); g.fill(); }
}
function drawObstacle(g, o, t, px, py, r) {
  if (o === OBST.MOUNT) return drawMountain(g, px, py, t, r);
  if (o === OBST.ROCK) return drawRock(g, px + (r() - 0.5) * 8, py + 6, r);
  const spots = [[(r() - 0.5) * 8, -2], [-8 + (r() - 0.5) * 4, 9], [8 + (r() - 0.5) * 4, 10]], cnt = r() < 0.3 ? 2 : 3;
  for (let k = 0; k < cnt; k++) {
    const x = px + spots[k][0], y = py + spots[k][1], s = 0.8 + r() * 0.3;
    if (t === TER.SNOW || t === TER.ROUGH) drawPine(g, x, y, s, t === TER.SNOW);
    else if (t === TER.SAND) drawPalm(g, x, y, s);
    else if (t === TER.LAVA) drawDeadTree(g, x, y, s, '#1a1210');
    else if (t === TER.SWAMP) { if (r() < 0.5) drawDeadTree(g, x, y, s, '#2e2618'); else drawWillow(g, x, y, s); }
    else if (t === TER.DIRT && r() < 0.5) drawPine(g, x, y, s, false);
    else drawOak(g, x, y, s);
  }
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
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const k = (py * S + px) * 4, ax = bx + px, ay = by + py; let col;
    if (ax >= lim || ay >= lim) col = PC.void;
    else {
      const t = TT(px, py), hh = thash(ax, ay, 77) / 4294967296;
      if (t === TER.WATER) {
        let near = 9; for (const r of RING) if (TT(px + r[0], py + r[1]) !== TER.WATER) { near = r[2]; break; }
        if (near === 1) col = PC.foam; else if (near === 2) col = PC.sh1; else if (near <= 4) col = PC.sh2;
        else { const P = TPAL[0]; col = vnoise2(ax / 8, ay / 8, 61) < 0.33 ? P[0] : P[1]; if ((thash(ax >> 2, ay, 71) % 100) < 3 && (ax & 3) !== 3) col = P[2]; else if (hh > 0.998) col = P[3]; }
      } else {
        col = landColor(t, ax, ay, hh);
        const below = TT(px, py + 1); if (below !== t && below !== TER.WATER) col = TPAL[t][0];
      }
      if (segs.length) {
        let best = 99, bt = 0;
        for (const s of segs) { if (Math.abs(px - s[0]) > 14 || Math.abs(py - s[1]) > 14) continue; const dd = segDist(px + 0.5, py + 0.5, s); if (dd < best) { best = dd; bt = s[4]; } }
        if (best <= 3.3) col = roadColor(bt, ax, ay, hh); else if (best <= 4.3) col = PC.edge;
      }
    }
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let y = Math.max(0, y0); y <= Math.min(n - 1, y0 + CHUNK + 2); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(n - 1, x0 + CHUNK + 2); x++) {
    const o = map.obst[y * n + x]; if (!o) continue;
    const s = obstacleSprite(o, map.terrain[y * n + x], thash(x, y, map.seed + 2) % 4);
    g.drawImage(s.c, x * AP + 8 - bx - s.ax, y * AP + 8 - by - s.ay);
  }
  return c;
}
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
  map: null, explored: null, cache: new Map(), mini: null, miniDirty: false,
  reset(map, explored) { this.map = map; this.explored = explored || null; this.cache.clear(); this.mini = null; },
  get(cx, cy) {
    const key = cx + ',' + cy; let c = this.cache.get(key);
    if (c) { this.cache.delete(key); this.cache.set(key, c); return c; }
    c = renderChunkPixel(this.map, cx, cy); this.cache.set(key, c);
    if (this.cache.size > 40) this.cache.delete(this.cache.keys().next().value);
    return c;
  },
  miniCanvas() { if (!this.mini || this.miniDirty) { this.mini = buildMinimap(this.map, this.explored); this.miniDirty = false; } return this.mini; },
};
const VIEW = { x: 8, y: 8, w: 576, h: 552 }, MINI = { x: 624, y: 24, s: 144 };
const LIST = { x: 600, y: 262, w: 196, h: 186 }, INFOBOX = { x: 600, y: 456, w: 196, h: 108 };
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
    mp -= stepCost(st.map, px, py, x, y); const col = mp >= 0 ? '#3ad14c' : '#e03a3a', last = k === h.path.length - 1;
    blit(b, last ? markSprite(col, 'x', 0) : markSprite(col, h.path[k + 1][0] - x, h.path[k + 1][1] - y), ox + x * T + 16, oy + y * T + 16); px = x; py = y;
  });
}
function drawFogPixel(b, st, ox, oy, camX, camY) {
  const fw = VIEW.w / 2, fh = VIEW.h / 2, fb = pixBuf('fog', fw, fh, true), f = fb._ctx, par = (camX / 2 + camY / 2) & 1;
  f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fw, fh); f.setTransform(0.5, 0, 0, 0.5, -VIEW.x * 0.5, -VIEW.y * 0.5);
  drawFog(f, st, ox, oy, camX, camY);
  const img = f.getImageData(0, 0, fw, fh), d = img.data;
  for (let y = 0, k = 0; y < fh; y++) for (let x = 0; x < fw; x++, k += 4) { const a = d[k + 3]; d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = (a >= 225 || (a >= 70 && ((x + y + par) & 1))) ? 255 : 0; }
  f.putImageData(img, 0, 0); b.drawImage(fb, VIEW.x, VIEW.y, VIEW.w, VIEW.h);
}
function drawWorldPixel(b, st) {
  const map = st.map, n = map.n, CP = CHUNK * T, camX = Math.round(st.cam.x / 2) * 2, camY = Math.round(st.cam.y / 2) * 2, nC = Math.ceil(n / CHUNK);
  b.fillStyle = '#000'; b.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  const c0 = Math.max(0, Math.floor(camX / CP)), c1 = Math.min(nC - 1, Math.floor((camX + VIEW.w - 1) / CP));
  const r0 = Math.max(0, Math.floor(camY / CP)), r1 = Math.min(nC - 1, Math.floor((camY + VIEW.h - 1) / CP));
  const ox = VIEW.x - camX, oy = VIEW.y - camY;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) b.drawImage(MapRender.get(cx, cy), ox + cx * CP, oy + cy * CP, CP, CP);
  if (hero(st)) drawPathPixel(b, st, hero(st), ox, oy);
  const tx0 = Math.floor(camX / T) - 2, ty0 = Math.floor(camY / T) - 1, tx1 = Math.floor((camX + VIEW.w) / T) + 2, ty1 = Math.floor((camY + VIEW.h) / T) + 2, list = [];
  for (const ob of st.objects) if (!ob.dead && ob.x >= tx0 && ob.x <= tx1 && ob.y >= ty0 && ob.y <= ty1) list.push({ y: ob.y, ob });
  for (const h of st.heroes) { const [hx, hy] = heroDrawPos(h); list.push({ y: hy + 0.5, hero: h, hx, hy }); }
  list.sort((a, c) => a.y - c.y);
  const shadow = (w, x, y) => { b.globalAlpha = 0.3; blit(b, shadowSprite(w), x, y); b.globalAlpha = 1; };
  for (const it of list) {
    if (it.hero) { const x = ox + it.hx * T + 16, y = oy + it.hy * T + 16; shadow(14, x, y + 13); blit(b, heroSprite(it.hero, ownerColor(st, it.hero.owner)), x, y); continue; }
    const ob = it.ob, px = ox + ob.x * T + 16, py = oy + ob.y * T + 16;
    if (ob.type === 'monster') { shadow(10, px, py + 10); blit(b, creatureSprite(ob.cid, ob.dir, Math.floor(G.time * 3 + ob.x * 0.7 + ob.y * 0.3) % 4), px, py + 10); }
    else if (ob.type === 'res') { shadow(10, px, py + 9); blit(b, resSprite(ob.res), px, py + 2); }
    else if (ob.type === 'chest') { shadow(10, px, py + 9); blit(b, chestSprite(), px, py + 2); }
    else if (ob.type === 'art') { shadow(9, px, py + 10); blit(b, artSprite(ob.art), px, py + 1 + Math.round(Math.sin(G.time * 2 + ob.id) * 1.5) * 2); }
    else if (ob.type === 'mine') { const mx = ox + (ob.x - 1) * T, my = oy + (ob.y - 1) * T; blit(b, mineSprite(ob.kind), mx, my); blit(b, flagSprite(ownerColor(st, ob.owner), 12, 7), mx + 56, my - 2); }
    else if (ob.type === 'town') {
      const t = st.towns[ob.townId], lvl = townLevel(t), mx = ox + (ob.x - 1) * T, my = oy + (ob.y - 1) * T, fc = ownerColor(st, ob.owner);
      blit(b, townSprite(t.faction, lvl), mx, my);
      for (const [fx, fy] of TOWN_FLAG_POINTS[lvl]) blit(b, flagSprite(fc, 10, 6), mx + fx, my + fy - 20); // drzewce stoi na szczycie dachu
    }
  }
  drawFogPixel(b, st, ox, oy, camX, camY);
  if (G.mouse.type === 'mouse' && inRect(G.mouse.x, G.mouse.y, VIEW)) {
    const { tx, ty } = screenToTile(st, G.mouse.x, G.mouse.y), x = ox + tx * T, y = oy + ty * T;
    b.fillStyle = 'rgba(255,240,190,.55)'; b.fillRect(x, y, T, 2); b.fillRect(x, y + T - 2, T, 2); b.fillRect(x, y + 2, 2, T - 4); b.fillRect(x + T - 2, y + 2, 2, T - 4);
  }
}
function mapGrade(b) {
  const x = VIEW.x, y = VIEW.y, w = VIEW.w, h = VIEW.h;
  b.save(); b.globalCompositeOperation = 'multiply'; b.fillStyle = GRADE.mul; b.fillRect(x, y, w, h);
  b.globalCompositeOperation = 'saturation'; b.globalAlpha = GRADE.desat; b.fillStyle = '#808080'; b.fillRect(x, y, w, h); b.restore();
  const lg = b.createLinearGradient(x, y, x + w, y + h); lg.addColorStop(0, 'rgba(255,200,130,.13)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(18,22,60,.24)'); b.fillStyle = lg; b.fillRect(x, y, w, h);
  const vg = b.createRadialGradient(x + w / 2, y + h / 2, h * 0.35, x + w / 2, y + h / 2, h * 0.85); vg.addColorStop(0, 'rgba(6,6,14,0)'); vg.addColorStop(1, 'rgba(6,6,14,.5)'); b.fillStyle = vg; b.fillRect(x, y, w, h);
}
function drawMapView(ctx, st, scr) {
  {
    const wb = pixBuf('world', VIEW.w / 2, VIEW.h / 2, true), b = wb._ctx;
    b.setTransform(0.5, 0, 0, 0.5, -VIEW.x * 0.5, -VIEW.y * 0.5); b.imageSmoothingEnabled = false; drawWorldPixel(b, st); mapGrade(b); pixelQuantize(wb);
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
    if (ob.type === 'art') return `Artefakt: ${ARTIFACTS[ob.art].name}`;
    if (ob.type === 'res') return resName(ob.res);
  }
  const t = map.terrain[i]; if (t === TER.WATER) return 'Woda (potrzebna łódź)';
  let s = TERRAINS[t].name, cost = TERRAINS[t].cost;
  if (map.road[i]) { s += ', ' + ROADS[map.road[i]].name; cost = ROADS[map.road[i]].cost; }
  s += map.obst[i] ? `, ${OBST_NAMES[map.obst[i]]} (nie do przejścia)` : `, koszt ruchu ${cost}`;
  if (st.guard[i]) s += `, strzeżone przez ${CREATURES[st.objects[st.guard[i] - 1].cid].acc}`;
  return s;
}

