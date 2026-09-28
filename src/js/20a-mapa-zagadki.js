// ==================== EKRAN: MAPA ZAGADKI I KOPANIE ======================================
// Mapa zagadki jak w Heroes 3: wycinek mapy wokół Graala (PUZZLE_W × PUZZLE_H pól, Graal nie leży dokładnie pośrodku)
// pocięty na PUZZLE_COLS × PUZZLE_ROWS kawałków z wypustkami. Każdy odwiedzony obelisk zdejmuje część kawałków, od brzegów
// do środka; ostatnie odsłaniają krzyżyk nad Graalem. Kopie się przyciskiem „Kop” (klawisz D) z pełnymi punktami ruchu.

// Lewy górny róg wycinka: Graal przesunięty od środka o kilka pól (stale dla danej gry)
function puzzleOrigin(st) {
  const n = st.map.n, g = st.grail, jx = thash(st.seed, 11, 3) % 7 - 3, jy = thash(st.seed, 13, 5) % 5 - 2;
  return [clamp(g.x - (PUZZLE_W >> 1) + jx, 0, Math.max(0, n - PUZZLE_W)), clamp(g.y - (PUZZLE_H >> 1) + jy, 0, Math.max(0, n - PUZZLE_H))];
}
// Kolejność zdejmowania kawałków: najdalsze od Graala najpierw (z odrobiną losu), kawałek z krzyżykiem na końcu
function puzzleOrder(st) {
  const [x0, y0] = puzzleOrigin(st), gx = (st.grail.x - x0 + 0.5) / PUZZLE_W * PUZZLE_COLS, gy = (st.grail.y - y0 + 0.5) / PUZZLE_H * PUZZLE_ROWS, out = [];
  for (let j = 0; j < PUZZLE_ROWS; j++) for (let i = 0; i < PUZZLE_COLS; i++) out.push({ i, j, d: Math.hypot(i + 0.5 - gx, j + 0.5 - gy) + (thash(i, j, st.seed) % 100) / 90 });
  return out.sort((a, b) => b.d - a.d);
}
// Obraz wycinka mapy (teren i stałe obiekty, bez bohaterów i potworów, bez mgły) w połowie rozdzielczości, z krzyżykiem
function puzzleImage(st) {
  const [x0, y0] = puzzleOrigin(st), c = document.createElement('canvas'); c.width = PUZZLE_W * T / 2; c.height = PUZZLE_H * T / 2;
  const b = c.getContext('2d'), CP = CHUNK * T; b.imageSmoothingEnabled = false; b.setTransform(0.5, 0, 0, 0.5, 0, 0);
  for (let cy = Math.floor(y0 / CHUNK); cy <= Math.floor((y0 + PUZZLE_H - 1) / CHUNK); cy++) for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor((x0 + PUZZLE_W - 1) / CHUNK); cx++)
    b.drawImage(MapRender.get(cx, cy), (cx * CHUNK - x0) * T, (cy * CHUNK - y0) * T, CP, CP);
  const ox = -x0 * T, oy = -y0 * T;
  for (const ob of st.objects.filter(o => !o.dead && o.x >= x0 - 1 && o.x <= x0 + PUZZLE_W && o.y >= y0 - 1 && o.y <= y0 + PUZZLE_H + 1).sort((a, c2) => a.y - c2.y)) {
    const px = ox + ob.x * T + 16, py = oy + ob.y * T + 16;
    if (ob.type === 'site') blitG(b, siteSprite(ob.kind), px, py + 14);
    else if (ob.type === 'bank') blitG(b, bankSprite(ob.kind, ob.cleared), ox + (ob.x - 1) * T, oy + (ob.y - 1) * T);
    else if (ob.type === 'mine') blitG(b, mineSprite(ob.kind), ox + (ob.x - 1) * T, oy + (ob.y - 1) * T);
    else if (ob.type === 'town') { const t = st.towns[ob.townId]; blitG(b, townSprite(t.faction, townLevel(t)), ox + (ob.x - 1) * T, oy + (ob.y - 1) * T); }
  }
  const gx = ox + st.grail.x * T + 16, gy = oy + st.grail.y * T + 16; // krzyżyk: czerwony z ciemnym obrysem
  b.lineCap = 'round'; for (const [col, w] of [['#2a0a04', 11], ['#d8261a', 6]]) { b.strokeStyle = col; b.lineWidth = w; b.beginPath(); b.moveTo(gx - 12, gy - 12); b.lineTo(gx + 12, gy + 12); b.moveTo(gx + 12, gy - 12); b.lineTo(gx - 12, gy + 12); b.stroke(); }
  return c;
}
// Obraz na zakrytych kawałkach (jak w H3: malowidło w barwach frakcji gracza): niebo, słońce lub księżyc, góry,
// teren frakcji, droga i miasto frakcji pośrodku. Pixel art w połowie rozdzielczości, raz na grę.
const PUZZLE_ART = {
  haven: { sky: ['#3a64b0', '#f0c878'], sun: '#fff0b0', ground: '#4a7a3a', far: '#6a88a8' }, sylvan: { sky: ['#2a5a7a', '#c8e0a0'], sun: '#fff4c8', ground: '#3a6a2e', far: '#5a8a7a' },
  barrow: { sky: ['#14121e', '#4a3e5a'], sun: '#d8e0f0', ground: '#4a4234', far: '#3a3448', moon: true }, fortress: { sky: ['#1e3a3a', '#8aa878'], sun: '#e8f0c0', ground: '#3a5a44', far: '#4a6a5a' },
  inferno: { sky: ['#200808', '#c83a1a'], sun: '#ffc060', ground: '#3a2020', far: '#5a2a1e' }, academy: { sky: ['#4a78b0', '#d8e8f8'], sun: '#ffffff', ground: '#d8e0e8', far: '#8aa0c0' },
  dungeon: { sky: ['#0e0a1a', '#4a2a6a'], sun: '#c8a0ff', ground: '#4a4040', far: '#2e2440', moon: true }, stronghold: { sky: ['#b85a2a', '#f0c070'], sun: '#fff0c0', ground: '#c8a060', far: '#a86a3a' },
};
let PUZZLE_COVER = null;
function puzzleCover(st, w, h) {
  const fac = (st.players[ME] || {}).faction || 'haven', key = `${fac}_${st.seed}_${w}x${h}`; if (PUZZLE_COVER && PUZZLE_COVER.key === key) return PUZZLE_COVER.c;
  const A = PUZZLE_ART[fac] || PUZZLE_ART.haven, cw = Math.round(w / 2), ch = Math.round(h / 2), c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'), r = mulberry32(st.seed * 31 + 7), hor = Math.round(ch * 0.58);
  let gr = g.createLinearGradient(0, 0, 0, hor); gr.addColorStop(0, A.sky[0]); gr.addColorStop(1, A.sky[1]); g.fillStyle = gr; g.fillRect(0, 0, cw, hor);
  const sx = cw * (0.62 + r() * 0.22), sy = ch * 0.2; for (const [rad, a] of [[34, 0.12], [24, 0.2], [16, 1]]) { g.globalAlpha = a; g.fillStyle = A.sun; g.beginPath(); g.arc(sx, sy, rad, 0, TAU); g.fill(); }
  g.globalAlpha = 1; if (A.moon) { g.fillStyle = gr; g.beginPath(); g.arc(sx + 7, sy - 4, 14, 0, TAU); g.fill(); } // sierp: wycięcie kolorem nieba
  for (let i = 0; i < 5; i++) { const cx = r() * cw, cy = 10 + r() * hor * 0.45, L = 30 + r() * 50; g.fillStyle = 'rgba(255,250,235,.22)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx + k * L / 4, cy - (k % 2) * 3, L / 3, 5, 0, 0, TAU); g.fill(); } }
  for (let layer = 0; layer < 3; layer++) { // góry: od dalekich (blade) do bliskich (ciemne)
    const base = hor - 4 + layer * 8, peak = [44, 32, 20][layer], col = layer === 0 ? A.far : shadeHex(A.far, -0.2 * layer);
    g.fillStyle = col; g.beginPath(); g.moveTo(0, base); for (let x = 0, y = base - peak * r(); x <= cw + 20; x += 14 + r() * 26) { y = clamp(y + (r() - 0.5) * peak * 1.4, base - peak, base - 4); g.lineTo(x, y); } g.lineTo(cw, ch); g.lineTo(0, ch); g.fill();
    if (layer === 0 && fac === 'academy') { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, base - peak, cw, 4); }
  }
  gr = g.createLinearGradient(0, hor, 0, ch); gr.addColorStop(0, shadeHex(A.ground, 0.1)); gr.addColorStop(1, shadeHex(A.ground, -0.35)); g.fillStyle = gr; g.fillRect(0, hor + 10, cw, ch);
  g.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i < cw * ch / 90; i++) g.fillRect(Math.floor(r() * cw), hor + 10 + Math.floor(r() * (ch - hor)), 2, 1); // źdźbła i kamyki
  g.fillStyle = shadeHex(A.ground, 0.25); g.beginPath(); g.moveTo(cw / 2 - 30, ch); g.bezierCurveTo(cw / 2 - 40, ch * 0.85, cw / 2 + 14, ch * 0.8, cw / 2 - 2, hor + 26); // droga
  g.lineTo(cw / 2 + 6, hor + 26); g.bezierCurveTo(cw / 2 + 26, ch * 0.8, cw / 2 - 12, ch * 0.85, cw / 2 + 30, ch); g.fill();
  const ts = townSprite(fac, 3), tk = 2; g.imageSmoothingEnabled = false; g.drawImage(ts.c, cw / 2 - ts.c.width * tk / 2 + 10, hor + 30 - ts.c.height * tk + 16, ts.c.width * tk, ts.c.height * tk);
  for (let i = 0; i < 14; i++) { // kępy drzew po bokach
    const side = i % 2 ? 1 : -1, x = cw / 2 + side * (cw * 0.26 + r() * cw * 0.22), y = hor + 18 + r() * (ch - hor - 30), s2 = 5 + r() * 5, dk = shadeHex(A.ground, -0.3);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y + s2, s2, s2 * 0.35, 0, 0, TAU); g.fill();
    g.fillStyle = fac === 'academy' ? '#3a5a4a' : fac === 'inferno' ? '#2a1a14' : dk; g.beginPath(); g.moveTo(x, y - s2 * 2.2); g.lineTo(x + s2, y + s2 * 0.6); g.lineTo(x - s2, y + s2 * 0.6); g.fill();
  }
  gr = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,16,4,.45)'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
  pixelQuantize(c, 14); PUZZLE_COVER = { key, c }; return c;
}
// Kontur kawałka z wypustkami: wspólna krawędź dwóch sąsiadów ma ten sam kształt (kierunek wypustki z hash)
function piecePath(ctx, i, j, x, y, pw, ph, seed) {
  const tabH = (ii, jj) => (thash(ii, jj, seed + 1) & 1 ? 1 : -1), tabV = (ii, jj) => (thash(ii, jj, seed + 2) & 1 ? 1 : -1); // krawędź pozioma nad wierszem jj / pionowa przed kolumną ii
  const edge = (sx, sy, ex, ey, nx, ny, on) => {
    if (!on) { ctx.lineTo(ex, ey); return; }
    const L = Math.min(pw, ph), P = (t, u) => [sx + (ex - sx) * t + nx * u * L, sy + (ey - sy) * t + ny * u * L];
    ctx.lineTo(...P(0.38, 0)); ctx.bezierCurveTo(...P(0.3, 0.2), ...P(0.4, 0.3), ...P(0.5, 0.3)); ctx.bezierCurveTo(...P(0.6, 0.3), ...P(0.7, 0.2), ...P(0.62, 0)); ctx.lineTo(ex, ey);
  };
  ctx.beginPath(); ctx.moveTo(x, y);
  edge(x, y, x + pw, y, 0, j > 0 ? tabH(i, j) : 0, j > 0);
  edge(x + pw, y, x + pw, y + ph, i < PUZZLE_COLS - 1 ? tabV(i + 1, j) : 0, 0, i < PUZZLE_COLS - 1);
  edge(x + pw, y + ph, x, y + ph, 0, j < PUZZLE_ROWS - 1 ? tabH(i, j + 1) : 0, j < PUZZLE_ROWS - 1);
  edge(x, y + ph, x, y, i > 0 ? tabV(i, j) : 0, 0, i > 0);
  ctx.closePath();
}
function showPuzzle(st) {
  if (!st.grail) return;
  const W0 = 544, H0 = 530, x = (W - W0) / 2, y = (H - H0) / 2, mw = PUZZLE_W * T, mh = PUZZLE_H * T, k = 512 / mw, mx = x + 16, my = y + 50, pw = mw * k / PUZZLE_COLS, ph = mh * k / PUZZLE_ROWS;
  const img = puzzleImage(st), cover = puzzleCover(st, mw * k, mh * k), shown = puzzlePieces(st, ME), order = puzzleOrder(st), open = new Set(order.slice(0, shown).map(p => p.i + ',' + p.j));
  const N = obelisksTotal(st), seen = obelisksSeen(st, ME), btn = new Button(W / 2 - 70, y + H0 - 46, 140, 36, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 16 });
  const found = st.grail.found >= 0, note = found ? (st.grail.found === ME ? 'Graal jest już twój.' : 'Ktoś inny już wykopał Graala.')
    : shown >= PUZZLE_COLS * PUZZLE_ROWS ? 'Mapa kompletna! Krzyżyk wskazuje miejsce Graala.' : `Odwiedzone obeliski: ${seen} z ${N}. Szukaj kolejnych, aby odsłonić mapę.`;
  G.modal = {
    msg: `Mapa zagadki. ${note}`, buttons: [btn], puzzle: { shown, open },
    draw(ctx) {
      dimScreen(ctx, 0.55); drawParchment(ctx, x, y, W0, H0);
      text(ctx, 'Mapa zagadki', W / 2, y + 30, { size: 24, align: 'center', color: '#3a1e08', fam: 'title' });
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, mx, my, mw * k, mh * k);
      ctx.beginPath(); ctx.rect(mx - 12, my - 12, mw * k + 24, mh * k + 24); ctx.clip();
      for (let j = 0; j < PUZZLE_ROWS; j++) for (let i = 0; i < PUZZLE_COLS; i++) {
        const px = mx + i * pw, py = my + j * ph; piecePath(ctx, i, j, px, py, pw, ph, st.seed);
        if (open.has(i + ',' + j)) { ctx.strokeStyle = 'rgba(40,24,8,.28)'; ctx.lineWidth = 1; ctx.stroke(); continue; }
        ctx.save(); ctx.clip(); ctx.drawImage(cover, mx, my, mw * k, mh * k); ctx.restore(); // zakryty kawałek: fragment obrazu
        ctx.strokeStyle = 'rgba(255,240,200,.35)'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#3a220c'; ctx.lineWidth = 1.5; ctx.stroke(); // wypukła krawędź
      }
      ctx.restore(); ctx.strokeStyle = '#5a3a14'; ctx.lineWidth = 2; ctx.strokeRect(mx - 1, my - 1, mw * k + 2, mh * k + 2);
      ctx.font = font(15, 500, 'body'); wrapText(ctx, note, W0 - 60).slice(0, 2).forEach((l, i) => text(ctx, l, W / 2, my + mh * k + 18 + i * 17, { size: 15, weight: 500, italic: true, align: 'center', color: '#3a2410' }));
      btn.draw(ctx);
    },
  };
}
// Kopanie wybranym bohaterem (przycisk „Kop”, klawisz D)
function digHere(scr, st) {
  const h = hero(st); if (!h || scr.aiRun) return;
  const r = digGrail(st, h); if (r.error) { scr.flash(r.error); return; }
  scr.mapFx = scr.mapFx || []; scr.mapFx.push({ kind: 'ring', x: h.x, y: h.y, r: 1.2, col: 'rgba(150,110,60,.8)', t: G.time });
  if (r.found) showDialog(`${h.name} wykopuje Graala! Święty kielich trafia do plecaka. Zanieś go do jednego ze swoich miast, aby wznieść tam budowlę Graala: +${GRAIL_GOLD} złota dziennie i +50% przyrostu stworów.`,
    [{ label: 'Wspaniale', key: 'enter' }], { iconH: 70, icon: (ctx, cx, cy) => drawSprite(ctx, artSprite('grail'), cx, cy, 3) });
  else showDialog(`${h.name} kopie przez cały dzień, ale nic tu nie ma. ${st.grail && st.grail.found < 0 ? 'Mapa zagadki podpowie, gdzie szukać.' : ''}`, [{ label: 'OK', key: 'enter' }]);
}
// Dołki po kopaniu na mapie: ciemna jama z wałem ziemi
function drawHoles(b, st, ox, oy, tx0, ty0, tx1, ty1) {
  const n = st.map.n;
  for (const i of st.holes || []) { const x = i % n, y = (i / n) | 0; if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue;
    const px = ox + x * T + 16, py = oy + y * T + 20;
    b.fillStyle = '#6a4a2a'; b.beginPath(); b.ellipse(px, py, 11, 6, 0, 0, TAU); b.fill(); b.fillStyle = '#1e140a'; b.beginPath(); b.ellipse(px, py + 1, 7, 3.5, 0, 0, TAU); b.fill();
    b.fillStyle = '#8a6a44'; b.fillRect(px + 8, py - 6, 6, 4); b.fillRect(px - 14, py - 3, 5, 3); }
}
function iconPuzzle(ctx, cx, cy, col) { // kawałek układanki
  ctx.fillStyle = col; ctx.fillRect(cx - 8, cy - 6, 14, 14); ctx.beginPath(); ctx.arc(cx - 1, cy - 7, 3.2, 0, TAU); ctx.arc(cx + 7, cy + 1, 3.2, 0, TAU); ctx.fill();
}
function iconShovel(ctx, cx, cy, col) { // łopata
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.6); ctx.fillStyle = col; ctx.fillRect(-1.2, -11, 2.4, 13); ctx.fillRect(-4, -12, 8, 2.4);
  ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(5, 2); ctx.lineTo(4, 8); ctx.lineTo(0, 11); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill(); ctx.restore();
}
