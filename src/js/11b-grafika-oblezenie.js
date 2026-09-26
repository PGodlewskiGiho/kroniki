// ==================== GRAFIKA: OBLĘŻENIE ===================================================
// Mury miasta na polu bitwy (setupSiege: jeden fragment na każdy rząd heksów kolumny SIEGE_X), w tym samym
// widoku z góry pod kątem co jednostki: mur to pionowy pas przez całe pole – od strony atakujących lico
// z cegieł i rząd blanek, dalej chodnik i przedpiersie od strony miasta. Fragmenty nie zachodzą na siebie,
// więc wyłom jest widoczną dziurą w murze. Wieże strzelnicze to okrągłe baszty z gankiem i dachem,
// brama to łukowy przejazd między dwiema basztami, z mostem zwodzonym.
// Jednostki: px logiczne; (0, 0) = zachodnia krawędź muru (x = SIEGE_WX) na wysokości środka rzędu.
// Cały mur to jeden sprite (pixel art), rysowany zanim staną oddziały.
const SIEGE_WX = 532, SIEGE_HALF = 23.5, TOWER_H = 56;
const WALL = { face: 13, walk: 50, depth: 16 }; // lico 0..face, chodnik face..walk; depth: wysokość czoła muru widocznego od południa
const SIEGE_STONE = { haven: '#b8ae98', sylvan: '#9aa086', barrow: '#6c6676', fortress: '#8e8a6a', inferno: '#5e403c', academy: '#c4c8d2' };
function stonePal(fac) {
  const c = SIEGE_STONE[fac] || SIEGE_STONE.haven;
  return { top: LT(c, 0.22), lit: LT(c, 0.08), base: c, sh: DK(c, 0.25), dk: DK(c, 0.45), mortar: DK(c, 0.34), crack: '#201a1a', moss: fac === 'sylvan' ? '#5a7a34' : fac === 'barrow' ? '#3e4e3a' : '#6a7a44' };
}
const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function sPennant(ctx, [x, y], col) { limb(ctx, x, y, x, y - 9, 1.5, '#2a1a0e'); fillPoly(ctx, [[x, y - 9], [x + 10, y - 7], [x, y - 4]], col); }
// Cegły w prostokącie: rzędy co 6 px, spoiny co 10 px na przemian, kilka jaśniejszych i ciemniejszych kamieni
function bricks(ctx, x, y, w, h, S, r, fill = S.base) {
  rect(ctx, x, y, w, h, fill);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let yy = y, row = 0; yy < y + h; yy += 6, row++) {
    for (let xx = x - (row % 2) * 5; xx < x + w; xx += 10) { const v = r(); if (v < 0.3) rect(ctx, xx + 1.6, yy + 1.6, 8.4, 4.4, v < 0.14 ? S.lit : S.sh); rect(ctx, xx, yy, 1.6, 6, S.mortar); }
    rect(ctx, x, yy + 4.4, w, 1.6, S.mortar);
  }
  ctx.restore();
}

// kind: 'wall' | 'gate' | 'tower'; state: 'ok' | 'hit' | 'down'; open: od południa brak muru (widać czoło); col: kolor właściciela
function drawSiegePiece(ctx, fac, kind, state, open, col) {
  const S = stonePal(fac), A = TOWN_ART[fac] || TOWN_ART.haven, h = SIEGE_HALF, { face, walk, depth } = WALL;
  const r = mulberry32((kind === 'gate' ? 50 : kind === 'tower' ? 90 : 3) + (state === 'hit' ? 100 : state === 'down' ? 200 : 0));
  ctx.fillStyle = S.top; ctx.fillStyle = S.lit; ctx.fillStyle = S.base; ctx.fillStyle = S.sh; ctx.fillStyle = S.dk; ctx.fillStyle = S.mortar; // paleta sprite'a
  if (state === 'down' && kind === 'wall') return drawRubble(ctx, S, r);
  // cień muru na dziedzińcu (dithering)
  ctx.fillStyle = S.dk; for (let y = -h; y < h; y += 2) for (let x = walk; x < walk + 10; x += 2) if (((x + y) / 2 & 3) === 0 || x === walk) ctx.fillRect(x, y, 2, 2);
  // lico od strony atakujących, cokół u podstawy
  bricks(ctx, 0, -h, face, 2 * h, S, r, S.base);
  rect(ctx, -4, -h, 4, 2 * h, S.sh); rect(ctx, -4, -h, 1.6, 2 * h, S.lit);
  for (let i = 0; i < 3; i++) rect(ctx, -4 + r() * 6, -h + r() * (2 * h - 6), 3, 4 + r() * 4, S.moss);
  // chodnik: płyty
  rect(ctx, face, -h, walk - face, 2 * h, S.top);
  for (let y = -h + 4, k = 0; y < h; y += 8, k++) { rect(ctx, face, y, walk - face, 1.6, S.lit); rect(ctx, face + 6 + (k % 2) * 9, y, 1.6, 8, S.lit); rect(ctx, face + 24 + (k % 2) * 9, y, 1.6, 8, S.lit); }
  // przedpiersie od strony miasta
  rect(ctx, walk - 6, -h, 6, 2 * h, S.base); rect(ctx, walk - 6, -h, 6, 2, S.lit); rect(ctx, walk - 1.6, -h, 1.6, 2 * h, S.dk);
  // blanki nad licem: góra zęba jasna, jego czoło (od południa) w cieniu, między zębami strzelnice
  const skip = state === 'hit' ? [1, 3] : [];
  rect(ctx, face - 3, -h, 11, 2 * h, S.dk);
  for (let y = -h + 1, k = 0; y < h - 4; y += 11.75, k++) { if (skip.includes(k)) { rect(ctx, face - 3, y, 11, 6, S.sh); continue; } rect(ctx, face - 4, y, 12, 6, S.top); rect(ctx, face - 4, y + 6, 12, 4, S.sh); rect(ctx, face - 4, y, 1.6, 10, S.lit); }
  for (const y of [-11, 7]) rect(ctx, 4, y, 3, 8, '#16121a'); // strzelnice w licu
  if (open) { bricks(ctx, -4, h, walk + 4, depth, S, r, S.sh); rect(ctx, -4, h, walk + 4, 2, S.top); } // czoło przy wyłomie
  if (state === 'hit') {
    ctx.strokeStyle = S.crack; ctx.lineWidth = 2;
    for (const [x, y] of [[3, -16], [26, 2], [8, 8]]) { let xx = x, yy = y; ctx.beginPath(); ctx.moveTo(xx, yy); for (let k = 0; k < 4; k++) { xx += (r() - 0.5) * 8; yy += 3 + r() * 4; ctx.lineTo(xx, yy); } ctx.stroke(); }
    fillPoly(ctx, [[face + 4, -6], [face + 16, -8], [face + 20, 2], [face + 8, 4]], S.dk); // wyrwa w chodniku
    for (let i = 0; i < 6; i++) { const x = -18 + r() * 14, y = -h + r() * 2 * h; rect(ctx, x, y, 4 + r() * 3, 3 + r() * 2, i % 2 ? S.base : S.sh); }
  }
  if (kind === 'tower') return drawRoundTower(ctx, S, A, col, walk / 2, 10, 27, TOWER_H);
  if (kind === 'gate') drawGate(ctx, S, A, state, col, r);
}
// Wyłom: rozsypane bloki na ziemi, widać ziemię i bruk
function drawRubble(ctx, S, r) {
  const h = SIEGE_HALF;
  for (let i = 0; i < 26; i++) {
    const x = -14 + r() * (WALL.walk + 8), y = -h + 2 + r() * (2 * h - 6), w = 4 + r() * 6, hh = 3 + r() * 4;
    rect(ctx, x, y, w, hh, S.base); rect(ctx, x, y, w, 1.6, S.top); rect(ctx, x, y + hh - 1.6, w, 1.6, S.sh);
  }
  for (let i = 0; i < 4; i++) { const x = r() * WALL.walk, y = -h + r() * 2 * h; rect(ctx, x, y, 8 + r() * 6, 6 + r() * 3, S.sh); rect(ctx, x, y, 8, 2, S.lit); }
}
// Brama: łukowy przejazd w czole między dwiema basztami, wrota z okuciami (albo wyłamane), most zwodzony
function drawGate(ctx, S, A, state, col, r) {
  const h = SIEGE_HALF, cx = 12, by = h - 2, hw = 10, sp = 12, at = (s, z) => [cx + s, by - z];
  drawRoundTower(ctx, S, A, col, cx - 20, by - 26, 12, TOWER_H - 6, true); // baszta północna (za przejazdem)
  // blok bramy: czoło z cegieł i blanki
  bricks(ctx, cx - 19, by - 38, 38, 38, S, r, S.base);
  rect(ctx, cx - 20, by - 44, 40, 6, S.top); for (let x = cx - 20; x < cx + 20; x += 8) { rect(ctx, x, by - 50, 5, 6, S.top); rect(ctx, x, by - 45, 5, 1.6, S.sh); }
  rect(ctx, cx - 20, by - 38, 40, 2, S.dk);
  const arch = k => { const pts = [at(-hw - k, 0)]; for (let i = 0; i <= 12; i++) { const t = Math.PI + i * Math.PI / 12; pts.push(at(Math.cos(t) * (hw + k), sp - Math.sin(t) * (hw + k))); } pts.push(at(hw + k, 0)); return pts; };
  fillPoly(ctx, arch(3), S.lit); fillPoly(ctx, arch(0), '#1a1210');
  if (state === 'down') {
    fillPoly(ctx, [at(-hw + 2, 0), at(hw - 2, 0), at(hw - 2, 7), at(-hw + 2, 7)], A.path[1]); // widok na dziedziniec
    for (const [s, z, s2, z2] of [[-9, 1, -3, 12], [2, 0, 9, 10], [-4, 0, 6, 2]]) limb(ctx, ...at(s, z), ...at(s2, z2), 2.5, '#6a4424');
  } else {
    fillPoly(ctx, arch(0), state === 'hit' ? '#5a3a1c' : '#74502a');
    for (const s of [-5, 0, 5]) rect(ctx, cx + s - 0.8, by - sp - Math.sqrt(hw * hw - s * s) + 1, 1.6, sp + Math.sqrt(hw * hw - s * s) - 1, '#3a2412');
    for (const z of [4, 13]) rect(ctx, cx - hw + 1, by - z, 2 * hw - 2, 1.8, '#8a8e96');
    if (state === 'hit') { ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...at(-2, 20)); ctx.lineTo(...at(1, 12)); ctx.lineTo(...at(-1, 5)); ctx.stroke(); }
  }
  // most zwodzony przed bramą i łańcuchy
  fillPoly(ctx, [at(-hw, 0), at(hw, 0), at(hw + 2, -12), at(-hw - 2, -12)], state === 'down' ? '#4a3018' : '#6e4a26');
  for (let s = -hw; s <= hw; s += 5) rect(ctx, cx + s - 0.8, by, 1.6, 12, '#3a2412');
  limb(ctx, ...at(-hw - 1, sp + 8), cx - hw - 2, by + 12, 1.2, '#2a2420'); limb(ctx, ...at(hw + 1, sp + 8), cx + hw + 2, by + 12, 1.2, '#2a2420');
  for (const s of [-hw - 8, hw + 4]) fillPoly(ctx, [at(s, 34), at(s + 5, 34), at(s + 5, 18), at(s + 2.5, 21), at(s, 18)], col); // chorągwie
  drawRoundTower(ctx, S, A, col, cx + 22, by - 20, 12, TOWER_H - 6, true); // baszta południowa-wschodnia
}
// Okrągła baszta stojąca pionowo (widok z góry pod kątem: przekrój to elipsa), środek podstawy (cx, cy)
function drawRoundTower(ctx, S, A, col, cx, cy, R, top, small = false) {
  const E = 0.5, roof = A.roof.tower || A.roof.wall, el = (r, z, n = 24) => [...Array(n)].map((_, i) => [cx + Math.cos(i * TAU / n) * r, cy - z + Math.sin(i * TAU / n) * r * E]);
  fillPoly(ctx, el(R + 3, 0), S.dk);
  // bryła: pionowe pasy od światła (lewa) do cienia (prawa), dolna połowa elipsy
  for (let i = 0; i < 24; i++) {
    const a0 = i * TAU / 24, a1 = (i + 1) * TAU / 24; if (Math.sin((a0 + a1) / 2) < 0) continue;
    const c = Math.cos((a0 + a1) / 2), p0 = [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R * E], p1 = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R * E];
    fillPoly(ctx, [p0, p1, [p1[0], p1[1] - top], [p0[0], p0[1] - top]], c < -0.6 ? S.lit : c < 0.05 ? S.base : c < 0.6 ? S.sh : S.dk);
  }
  ctx.fillStyle = S.mortar;
  for (let z = 6, row = 0; z < top - 2; z += 6, row++) {
    for (let i = 0; i <= 24; i++) { const a = i * Math.PI / 24; ctx.fillRect(cx + Math.cos(a) * R - 0.8, cy + Math.sin(a) * R * E - z - 0.8, 1.6, 1.6); }
    for (let i = row % 2; i < 8; i += 2) { const a = (i + 0.5) * Math.PI / 8; ctx.fillRect(cx + Math.cos(a) * R - 0.8, cy + Math.sin(a) * R * E - z, 1.6, 6); }
  }
  for (const [a, z] of [[2.2, top * 0.35], [1.2, top * 0.6], [2.0, top * 0.8]]) { const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * E - z; fillPoly(ctx, [[x - 1.5, y], [x + 1.5, y], [x + 1.5, y - 8], [x - 1.5, y - 8]], '#16121a'); }
  // ganek z blankami, wieżyczka z dachem i flaga
  fillPoly(ctx, el(R + 4, top), S.top); fillPoly(ctx, el(R - 1, top), S.sh);
  const merl = front => { for (let i = 0; i < 16; i += 2) { const a = (i + 0.5) * TAU / 16, s = Math.sin(a); if ((s >= 0) !== front) continue; const x = cx + Math.cos(a) * (R + 2), y = cy - top + s * (R + 2) * E; fillPoly(ctx, [[x - 3.5, y], [x + 3.5, y], [x + 3.5, y - 8], [x - 3.5, y - 8]], Math.cos(a) < -0.3 ? S.lit : Math.cos(a) < 0.4 ? S.base : S.sh); fillPoly(ctx, [[x - 3.5, y - 8], [x + 3.5, y - 8], [x + 3.5, y - 10], [x - 3.5, y - 10]], S.top); } };
  merl(false);
  if (small) { // baszta bramna: stożkowy dach na całym ganku
    const rb = el(R + 3, top + 7, 16), apex = [cx, cy - top - 7 - R * 2];
    fillPoly(ctx, [...rb.filter((p, i) => Math.sin(i * TAU / 16) >= -0.01), apex], roof);
    fillPoly(ctx, [...rb.filter((p, i) => Math.sin(i * TAU / 16) >= -0.01 && Math.cos(i * TAU / 16) >= -0.01), apex], DK(roof, 0.32));
    fillPoly(ctx, [[cx - 2, cy - top + R * E * 0.3], [cx + 3, cy - top + R * E * 0.3], [cx + 3, cy - top + R * E * 0.3 + 12], [cx + 0.5, cy - top + R * E * 0.3 + 9], [cx - 2, cy - top + R * E * 0.3 + 12]], col);
    return sPennant(ctx, apex, col);
  }
  const tr = (r, z) => el(r, z, 16).map(([x, y]) => [x + 3, y - 6]);
  for (let i = 0; i < 16; i++) { const a0 = i * TAU / 16, a1 = (i + 1) * TAU / 16; if (Math.sin((a0 + a1) / 2) < 0) continue; const c = Math.cos((a0 + a1) / 2), p0 = [cx + 3 + Math.cos(a0) * 11, cy - 6 - top + Math.sin(a0) * 11 * E], p1 = [cx + 3 + Math.cos(a1) * 11, cy - 6 - top + Math.sin(a1) * 11 * E]; fillPoly(ctx, [p0, p1, [p1[0], p1[1] - 10], [p0[0], p0[1] - 10]], c < -0.3 ? S.lit : c < 0.4 ? S.base : S.sh); }
  const rb = tr(14, top + 10), apex = [cx + 3, cy - 6 - top - 38];
  fillPoly(ctx, [...rb.filter((p, i) => Math.sin(i * TAU / 16) >= -0.01), apex], roof);
  fillPoly(ctx, [...rb.filter((p, i) => Math.sin(i * TAU / 16) >= -0.01 && Math.cos(i * TAU / 16) >= -0.01), apex], DK(roof, 0.32));
  sPennant(ctx, apex, col);
  merl(true);
}
// Punkt na ganku wieży, w którym stoi strzelec (względem (SIEGE_WX, środek rzędu))
const towerPost = () => [WALL.walk / 2 - 2, 10 - TOWER_H + 8];
// Cały mur jako jeden sprite; (0, 0) = (SIEGE_WX, 0) ekranu bitwy. Klucz obejmuje stan każdego fragmentu,
// więc nowy rysunek powstaje tylko po trafieniu.
const siegeState = w => (w.hp <= 0 ? 'down' : w.hp < w.max ? 'hit' : 'ok');
function castleSprite(fac, col, walls) {
  const segs = [...walls.values()].sort((a, b) => a.y - b.y);
  return sprite(`castle_${fac}_${col}_${segs.map(w => w.kind[0] + siegeState(w)[0]).join('')}`, 80, 280, 20, 24, p => {
    segs.forEach((w, i) => {
      const next = segs[i + 1], open = !next || (siegeState(next) === 'down' && next.kind === 'wall');
      p.save(); p.translate(0, hexCenter(w.x, w.y)[1]); drawSiegePiece(p, fac, w.kind, siegeState(w), open, col); p.restore();
    });
  }, OUTLINE, 0.5);
}
// Bruk dziedzińca za murem (tło bitwy): kolor płyt [jasny, ciemny] wg frakcji
const SIEGE_PAVE = { haven: [[176, 164, 140], [142, 130, 108]], sylvan: [[140, 146, 118], [108, 116, 90]], barrow: [[104, 98, 114], [78, 74, 88]], fortress: [[132, 126, 98], [102, 98, 74]], inferno: [[96, 64, 58], [70, 44, 40]], academy: [[188, 194, 206], [150, 156, 170]] };
