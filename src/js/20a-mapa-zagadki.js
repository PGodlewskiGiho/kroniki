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
  const img = puzzleImage(st), shown = puzzlePieces(st, ME), order = puzzleOrder(st), open = new Set(order.slice(0, shown).map(p => p.i + ',' + p.j));
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
        const g = ctx.createLinearGradient(px, py, px + pw, py + ph); g.addColorStop(0, '#e2cfa0'); g.addColorStop(1, '#c4a872');
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(120,80,30,.18)'; for (let q = 0; q < 5; q++) ctx.fillRect(px + (thash(i, j, q) % 100) / 100 * pw * 0.8 + 4, py + (thash(j, i, q) % 100) / 100 * ph * 0.8 + 4, 3, 2);
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
