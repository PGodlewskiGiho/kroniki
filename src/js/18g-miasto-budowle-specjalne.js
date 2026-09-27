// ==================== MIASTO: BUDOWLE SPECJALNE FRAKCJI =====================================
// Jedna budowla na frakcję (FACTION_SPECIAL): Stajnie Przystani, Skarbiec krasnoludów Kniei, Wzmacniacz nekromancji Kurhanu,
// Klatka wodzów Twierdzy, Brama piekieł Inferna, Biblioteka Akademii, Wir many Lochu, Sala Walhalli Cytadeli.
// Budowla dostaje s = { x, b, w, h } (lewy dolny róg, podstawa b), jak budowle główne w MIASTO: BUDOWLE GŁÓWNE FRAKCJI.

function horseHead(c, x, y, col, dir = 1) { // koński łeb wychylony z boksu
  c.save(); c.translate(x, y); c.scale(dir, 1); fillPoly(c, [[-3, 6], [-3, -2], [2, -7], [8, -5], [9, -1], [4, 0], [3, 6]], col);
  fillPoly(c, [[-2, -3], [0, -9], [1, -5]], sh(col, -0.2)); c.fillStyle = '#1a0e06'; c.fillRect(3, -5, 1.5, 1.5); c.fillStyle = sh(col, -0.35); c.fillRect(-3.5, -3, 2, 8); c.restore();
}
function coinPile(c, cx, b, w, h) { // kopiec złotych monet z błyskami
  fillPoly(c, [[cx - w / 2, b], [cx - w * 0.2, b - h * 0.8], [cx, b - h], [cx + w * 0.25, b - h * 0.75], [cx + w / 2, b]], '#d8a830');
  fillPoly(c, [[cx, b - h], [cx + w * 0.25, b - h * 0.75], [cx + w / 2, b], [cx + w * 0.1, b]], '#a87a20');
  for (let i = 0; i < 7; i++) { const x = cx - w * 0.35 + i * w * 0.11, y = b - 2 - (i % 3) * h * 0.25; c.fillStyle = '#f8e070'; c.beginPath(); c.ellipse(x, y, 2.4, 1.2, 0, 0, TAU); c.fill(); }
  c.fillStyle = '#fffbe0'; c.fillRect(cx - 2, b - h * 0.8, 1.5, 1.5); c.fillRect(cx + w * 0.2, b - h * 0.4, 1.5, 1.5);
}
function swirl(c, cx, cy, r, cols, turns = 2.2) { // wirująca spirala (portal, wir many)
  for (let k = 0; k < cols.length; k++) { c.strokeStyle = cols[k]; c.lineWidth = 3 - k * 0.6; c.beginPath();
    for (let a = 0; a < TAU * turns; a += 0.2) { const rr2 = r * (1 - a / (TAU * turns)), x = cx + Math.cos(a + k * 2.1) * rr2, y = cy + Math.sin(a + k * 2.1) * rr2 * 0.9; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
}

Object.assign(BUILD_ART.haven, {
  special(c, A, s, tier, col, fx) { // stajnie: długi budynek z muru pruskiego, boksy z końskimi łbami, wybieg z płotem, siano i podkowa
    const { x, b, w, h } = s, bx = x + 4, bw = w * 0.72, top = b - h * 0.4;
    c.fillStyle = PAL.plaster; c.fillRect(bx, top, bw, b - top); timber(c, bx, top, bw, b - top);
    roofArt(c, GABLE, A.roof.util, bx, top, bw, h * 0.22); c.fillStyle = PAL.stoneD; c.fillRect(bx + bw / 2 - 5, top - h * 0.22 - 6, 10, 9); cone(c, A.roof.tower, bx + bw / 2, top - h * 0.22 - 6, 12, 10);
    for (let i = 0; i < 3; i++) { const dx = bx + 8 + i * (bw - 16) / 3; c.fillStyle = '#2a1a0c'; c.fillRect(dx, b - 22, 18, 22); c.fillStyle = '#6a4424'; c.fillRect(dx, b - 11, 18, 11);
      c.strokeStyle = '#3a2410'; c.lineWidth = 1; c.beginPath(); c.moveTo(dx, b - 11); c.lineTo(dx + 18, b); c.moveTo(dx + 18, b - 11); c.lineTo(dx, b); c.stroke(); horseHead(c, dx + 9, b - 14, ['#6a3a1a', '#e8e0d0', '#2a2020'][i]); }
    c.strokeStyle = '#a8a8b0'; c.lineWidth = 2.2; c.beginPath(); c.arc(bx + bw / 2, top + 7, 4, 0.2, Math.PI - 0.2, true); c.stroke();
    fence(c, x + w * 0.76, x + w, b, '#7a5230', 12); horseHead(c, x + w * 0.88, b - 16, '#8a5a2a', -1); c.fillStyle = '#8a5a2a'; c.fillRect(x + w * 0.84, b - 12, 12, 6);
    c.fillStyle = PAL.straw; rr(c, x + w * 0.78, b - 9, 12, 9, 2); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + w * 0.78, b - 5, 12, 1);
    bannerArt(c, bx + bw - 6, top - h * 0.22 - 4, col);
  },
});
Object.assign(BUILD_ART.sylvan, {
  special(c, A, s, tier, col, fx) { // skarbiec krasnoludów: kamienny kopiec z okutymi okrągłymi wrotami, runy, wózek i sterty złota
    const { x, b, w, h } = s, cx = x + w * 0.45;
    rockMound(c, cx - w * 0.42, b, w * 0.84, h * 0.62, '#6a6660', 11);
    circ(c, cx, b - 18, 19, '#3a3430'); circ(c, cx, b - 18, 16, '#5a3a1e'); c.strokeStyle = '#8a8e98'; c.lineWidth = 2.2; for (const r of [8, 14]) { c.beginPath(); c.arc(cx, b - 18, r, 0, TAU); c.stroke(); }
    c.fillStyle = '#b0b4bc'; for (let a = 0; a < 8; a++) c.fillRect(cx + Math.cos(a * TAU / 8) * 14 - 1, b - 18 + Math.sin(a * TAU / 8) * 14 - 1, 2, 2); circ(c, cx, b - 18, 3, '#d8a830');
    c.fillStyle = '#3a3430'; c.fillRect(cx - 22, b - 3, 44, 3);
    c.strokeStyle = '#8af0b8'; c.lineWidth = 1.4; for (const [rx, ry] of [[cx - 30, b - 34], [cx + 26, b - 38], [cx - 6, b - 50]]) { c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 3, ry - 6); c.lineTo(rx + 6, ry); c.moveTo(rx + 1, ry - 3); c.lineTo(rx + 5, ry - 3); c.stroke(); fx.glows.push([rx + 3, ry - 3, 8, '#60e0a0']); }
    lantern(c, cx - 26, b - h * 0.4, 6, '#fff0a0', fx); lantern(c, cx + 26, b - h * 0.4, 6, '#fff0a0', fx);
    coinPile(c, x + w * 0.86, b, 22, 12); c.fillStyle = '#4a3a2a'; c.fillRect(x + 2, b - 12, 20, 9); c.fillStyle = '#2a2420'; circ(c, x + 6, b - 2, 3, '#2a2420'); circ(c, x + 18, b - 2, 3, '#2a2420'); coinPile(c, x + 12, b - 12, 18, 7);
  },
});
Object.assign(BUILD_ART.barrow, {
  special(c, A, s, tier, col, fx) { // wzmacniacz nekromancji: czarny pylon z zieloną kulą, kościane żebra wokół, zielone smugi dusz
    const { x, b, w, h } = s, cx = x + w * 0.5, top = b - h * 0.86;
    fillPoly(c, [[cx - 30, b], [cx + 30, b], [cx + 22, b - 10], [cx - 22, b - 10]], '#34303e'); c.fillStyle = '#4a4454'; c.fillRect(cx - 22, b - 12, 44, 2);
    fillPoly(c, [[cx - 11, b - 10], [cx - 5, top + 14], [cx + 5, top + 14], [cx + 11, b - 10]], '#221e2a'); fillPoly(c, [[cx, b - 10], [cx + 5, top + 14], [cx + 11, b - 10]], '#161218');
    c.strokeStyle = '#6af0a0'; c.lineWidth = 1.2; for (let k = 0; k < 4; k++) { const y = b - 20 - k * 12; c.beginPath(); c.moveTo(cx - 3, y); c.lineTo(cx + 3, y - 4); c.stroke(); }
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { c.strokeStyle = '#d8d0bc'; c.lineWidth = 2.6 - k * 0.4; c.beginPath(); c.moveTo(cx + sd * 9, b - 18 - k * 14); c.quadraticCurveTo(cx + sd * (30 - k * 4), b - 26 - k * 14, cx + sd * (24 - k * 5), b - 8 - k * 12); c.stroke(); }
    circ(c, cx, top + 8, 11, '#1a3a24'); circ(c, cx, top + 8, 8, '#4ad080'); circ(c, cx - 3, top + 5, 3, '#c8ffd8'); fx.glows.push([cx, top + 8, 40, '#40ff90']);
    for (const sd of [-1, 1]) { skullAt(c, cx + sd * 26, b - 13, 0.8); fx.glows.push([cx + sd * 26, b - 15, 8, '#40ff90']); }
    c.strokeStyle = 'rgba(120,255,170,.4)'; c.lineWidth = 1.5; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(cx + sd * 40, b - 4); c.bezierCurveTo(cx + sd * 34, b - 40, cx + sd * 16, b - 50, cx + sd * 6, top + 10); c.stroke(); }
  },
});
Object.assign(BUILD_ART.fortress, {
  special(c, A, s, tier, col, fx) { // klatka wodzów: bambusowa klatka na palach pod strzechą, w środku jeniec-wódz, totemy z czaszkami
    const { x, b, w, h } = s, cx = x + w * 0.46, cw = w * 0.5, fl = b - 14, top = b - h * 0.62;
    c.fillStyle = '#4a3418'; for (const px of [cx - cw / 2 + 3, cx + cw / 2 - 3, cx - 4]) c.fillRect(px - 2, fl, 4, 14); c.fillStyle = '#6a4a24'; c.fillRect(cx - cw / 2 - 4, fl - 3, cw + 8, 4);
    c.fillStyle = '#1e1a10'; c.fillRect(cx - cw / 2, top, cw, fl - top); c.fillStyle = '#4a7a3a'; c.fillRect(cx - 5, fl - 22, 10, 16); circ(c, cx, fl - 26, 5, '#5a8a3a'); c.fillStyle = '#f0d040'; c.fillRect(cx + 1, fl - 28, 1.5, 1.5);
    c.fillStyle = '#b09a50'; for (let px = cx - cw / 2; px <= cx + cw / 2; px += 6) { c.fillRect(px - 1.2, top, 2.4, fl - top); c.fillStyle = '#8a7a3a'; c.fillRect(px - 1.2, top + (fl - top) * 0.5, 2.4, 1.5); c.fillStyle = '#b09a50'; }
    c.fillRect(cx - cw / 2, top + 4, cw, 2);
    fillPoly(c, [[cx - cw / 2 - 12, top + 4], [cx, top - h * 0.28], [cx + cw / 2 + 12, top + 4]], PAL.straw); fillPoly(c, [[cx, top - h * 0.28], [cx + cw / 2 + 12, top + 4], [cx, top + 4]], '#a88a40');
    c.strokeStyle = 'rgba(80,60,20,.5)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { const y = top + 4 - k * h * 0.056; c.beginPath(); c.moveTo(cx - (cw / 2 + 12) * (1 - k / 5), y); c.lineTo(cx + (cw / 2 + 12) * (1 - k / 5), y); c.stroke(); }
    for (const tx of [x + 8, x + w - 10]) { totem(c, tx, b, 42, '#6a4a2a', '#d8f078'); skullAt(c, tx, b - 46, 0.7); }
    bannerArt(c, cx, top - h * 0.28 - 4, col);
  },
});
Object.assign(BUILD_ART.inferno, {
  special(c, A, s, tier, col, fx) { // brama piekieł: łuk z czarnego kamienia z rogami, w środku wirujący ognisty portal, kosze z ogniem
    const { x, b, w, h } = s, cx = x + w * 0.5, aw = w * 0.56, ah = h * 0.8;
    c.fillStyle = '#2a1a18'; archPath(c, cx - aw / 2 - 8, b, aw + 16, ah + 8); c.fill(); c.fillStyle = '#3a2422'; archPath(c, cx - aw / 2 - 4, b, aw + 8, ah + 4); c.fill();
    c.fillStyle = '#1a0402'; archPath(c, cx - aw / 2, b, aw, ah); c.fill();
    c.save(); archPath(c, cx - aw / 2, b, aw, ah); c.clip(); const g = c.createRadialGradient(cx, b - ah * 0.45, 2, cx, b - ah * 0.45, aw * 0.6); g.addColorStop(0, '#ffe080'); g.addColorStop(0.4, '#ff6a1a'); g.addColorStop(1, '#5a0a04'); c.fillStyle = g; c.fillRect(cx - aw / 2, b - ah, aw, ah);
    swirl(c, cx, b - ah * 0.45, aw * 0.42, ['#ffd070', '#c82a0a', '#ff9a3a']); c.restore(); fx.glows.push([cx, b - ah * 0.45, aw * 0.9, '#ff5a10']);
    horn(c, cx - aw / 2 - 2, b - ah + 10, 10, 30, -1); horn(c, cx + aw / 2 + 2, b - ah + 10, 10, 30, 1);
    c.fillStyle = '#5a1a14'; for (let k = 0; k < 5; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 5, r = aw / 2 + 4; c.fillRect(cx + Math.cos(a) * r - 2, b - ah + aw / 2 + Math.sin(a) * r - 2, 4, 4); }
    for (const bx of [x + 6, x + w - 6]) { c.fillStyle = '#2a1a18'; c.fillRect(bx - 2, b - 18, 4, 18); fillPoly(c, [[bx - 7, b - 18], [bx + 7, b - 18], [bx + 4, b - 24], [bx - 4, b - 24]], '#3a2422'); flame(c, bx, b - 24, 1.1, fx); }
    c.fillStyle = '#3a2422'; c.fillRect(cx - aw / 2 - 12, b - 3, aw + 24, 3);
  },
});
Object.assign(BUILD_ART.academy, {
  special(c, A, s, tier, col, fx) { // biblioteka: marmurowy gmach z kolumnadą, niebieska kopuła z latarnią, wielka księga nad wejściem, stosy ksiąg
    const { x, b, w, h } = s, bx = x + 8, bw = w * 0.8, top = b - h * 0.44, cx = bx + bw / 2;
    c.fillStyle = PAL.marbleD; c.fillRect(bx - 4, b - 5, bw + 8, 5); c.fillStyle = PAL.marble; c.fillRect(bx, top, bw, b - top - 5);
    for (let i = 0; i < 6; i++) { const px = bx + 5 + i * (bw - 10) / 5; c.fillStyle = '#ffffff'; c.fillRect(px - 2.5, top + 6, 5, b - top - 11); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(px + 1, top + 6, 1.5, b - top - 11); }
    for (let i = 0; i < 5; i++) { const px = bx + 5 + (i + 0.5) * (bw - 10) / 5; winArt(c, A, px - 3, top + 12, 6, 12, fx); }
    fillPoly(c, [[bx - 6, top + 1], [cx, top - 16], [bx + bw + 6, top + 1]], PAL.marble); fillPoly(c, [[bx, top], [cx, top - 12], [bx + bw, top]], PAL.marbleD);
    hemiDome(c, cx, top - 12, 22, A.roof.hall, 20); c.fillStyle = PAL.marble; c.fillRect(cx - 3, top - 40, 6, 8); circ(c, cx, top - 42, 3, '#9ad8ff'); fx.glows.push([cx, top - 42, 14, '#9ad8ff']);
    c.save(); c.translate(cx, top - 4); c.fillStyle = '#6a3a1a'; c.fillRect(-11, -6, 22, 8); c.fillStyle = '#f4eee0'; c.fillRect(-10, -7, 9.5, 7); c.fillRect(0.5, -7, 9.5, 7);
    c.strokeStyle = 'rgba(60,50,40,.5)'; c.lineWidth = 0.8; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-8, -5 + k * 2); c.lineTo(-3, -5 + k * 2); c.moveTo(3, -5 + k * 2); c.lineTo(8, -5 + k * 2); c.stroke(); } c.restore();
    doorArt(c, A, cx - 6, b - 5, 12, 16);
    for (const [px, n] of [[x + 2, 4], [x + w - 8, 3]]) for (let k = 0; k < n; k++) { c.fillStyle = ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#8a6a2a'][k % 4]; c.fillRect(px - (k % 2), b - 3 - k * 3, 9, 3); }
  },
});
Object.assign(BUILD_ART.dungeon, {
  special(c, A, s, tier, col, fx) { // wir many: kamienny krąg z runami, nad nim fioletowa spirala many i krążące kryształy
    const { x, b, w, h } = s, cx = x + w * 0.5, cy = b - h * 0.5;
    c.fillStyle = '#2a2434'; c.beginPath(); c.ellipse(cx, b - 6, w * 0.44, 9, 0, 0, TAU); c.fill(); c.fillStyle = '#4a4454'; c.beginPath(); c.ellipse(cx, b - 8, w * 0.4, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#b080ff'; for (let k = 0; k < 8; k++) { const a = k * TAU / 8; c.fillRect(cx + Math.cos(a) * w * 0.34 - 1.5, b - 8 + Math.sin(a) * 5.5 - 1, 3, 2); }
    for (const sd of [-1, 1]) stalag(c, cx + sd * w * 0.4, b - 6, 12, 46, '#4a4454');
    const g = c.createRadialGradient(cx, cy, 2, cx, cy, w * 0.34); g.addColorStop(0, 'rgba(240,210,255,.95)'); g.addColorStop(0.5, 'rgba(150,80,255,.7)'); g.addColorStop(1, 'rgba(60,20,120,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, w * 0.34, h * 0.36, 0, 0, TAU); c.fill();
    swirl(c, cx, cy, w * 0.3, ['#e8d0ff', '#8a40e0', '#b070ff'], 2.6); fx.glows.push([cx, cy, w * 0.6, '#a060ff']);
    c.strokeStyle = 'rgba(200,150,255,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 6, b - 9); c.quadraticCurveTo(cx - 2, cy + 20, cx, cy); c.moveTo(cx + 6, b - 9); c.quadraticCurveTo(cx + 3, cy + 20, cx, cy); c.stroke();
    for (const [dx, dy] of [[-0.36, -0.1], [0.34, -0.2], [0.05, -0.9]]) { const px = cx + dx * w, py = cy + dy * h * 0.5; fillPoly(c, [[px, py - 7], [px + 4, py], [px, py + 7], [px - 4, py]], '#b88aff'); fillPoly(c, [[px, py - 7], [px + 4, py], [px, py + 7]], '#7a40d0'); fx.glows.push([px, py, 10, '#b070ff']); }
  },
});
Object.assign(BUILD_ART.stronghold, {
  special(c, A, s, tier, col, fx) { // sala Walhalli: długi dom z bali, skrzyżowane smocze głowy na szczytach, tarcze na ścianie, pochodnie, rogi
    const { x, b, w, h } = s, bx = x + 6, bw = w * 0.86, top = b - h * 0.36, rh = h * 0.34;
    c.fillStyle = '#7a4a24'; c.fillRect(bx, top, bw, b - top); c.strokeStyle = 'rgba(40,20,8,.5)'; c.lineWidth = 1; for (let y = top + 5; y < b; y += 5) { c.beginPath(); c.moveTo(bx, y); c.lineTo(bx + bw, y); c.stroke(); }
    fillPoly(c, [[bx - 8, top + 3], [bx + bw * 0.5, top - rh], [bx + bw + 8, top + 3]], '#5a3418'); fillPoly(c, [[bx + bw * 0.5, top - rh], [bx + bw + 8, top + 3], [bx + bw * 0.5, top + 3]], '#3e2410');
    c.fillStyle = 'rgba(255,220,170,.15)'; for (let k = 1; k < 5; k++) c.fillRect(bx - 8 + k * 4, top + 3 - k * rh / 5, bw + 16 - k * 8, 1.5);
    for (const [px, d] of [[bx + bw * 0.5 - 2, -1], [bx + bw * 0.5 + 2, 1]]) { c.strokeStyle = '#4a2a10'; c.lineWidth = 3; c.beginPath(); c.moveTo(px, top - rh + 4); c.quadraticCurveTo(px + d * 6, top - rh - 8, px + d * 12, top - rh - 10); c.stroke(); fillPoly(c, [[px + d * 10, top - rh - 13], [px + d * 17, top - rh - 10], [px + d * 11, top - rh - 7]], '#4a2a10'); }
    for (let i = 0; i < 4; i++) { const px = bx + 10 + i * (bw - 20) / 3; circ(c, px, top + 10, 5.5, i % 2 ? col : '#c8a040'); circ(c, px, top + 10, 1.8, '#8a8e98'); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.beginPath(); c.arc(px, top + 10, 5.5, 0, TAU); c.stroke(); }
    c.fillStyle = '#1e1008'; c.fillRect(bx + bw / 2 - 8, b - 20, 16, 20); c.fillStyle = '#ffb050'; c.fillRect(bx + bw / 2 - 6, b - 17, 12, 3); fx.wins.push([bx + bw / 2 - 6, b - 17, 12, 3]);
    horn(c, bx + bw / 2 - 12, b - 24, 5, 12, -1, '#e8dcc0'); horn(c, bx + bw / 2 + 12, b - 24, 5, 12, 1, '#e8dcc0');
    for (const px of [bx - 2, bx + bw + 2]) { c.fillStyle = '#4a2a10'; c.fillRect(px - 1.5, b - 20, 3, 20); flame(c, px, b - 20, 0.9, fx); }
    fx.smokes.push([bx + bw * 0.3, top - rh * 0.4]);
  },
});
