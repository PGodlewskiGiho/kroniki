// ==================== GRAFIKA: OBLĘŻENIE ===================================================
// Mury miasta na polu bitwy (setupSiege: jeden fragment na każdy rząd heksów, w kolumnie wallX(y) – mur biegnie ukośnie), w tym samym
// widoku z góry pod kątem co jednostki: mur to pionowy pas przez całe pole – od strony atakujących lico
// z cegieł i rząd blanek, dalej chodnik i przedpiersie od strony miasta. Fragmenty nie zachodzą na siebie,
// więc wyłom jest widoczną dziurą w murze. Wieże strzelnicze to okrągłe baszty z gankiem i dachem,
// brama to łukowy przejazd między dwiema basztami, z mostem zwodzonym.
// Jednostki: px logiczne; (0, 0) = zachodnia krawędź muru w danym rzędzie (x = wallWX(y)) na wysokości środka rzędu.
// Cały mur to jeden sprite (pixel art), rysowany zanim staną oddziały.
const SIEGE_HALF = 23.5, TOWER_H = 56;
// Mur na ekranie: lico w rzędzie y zaczyna się 17 px przed środkiem pola muru; co rząd przesuwa się o pół heksu w prawo
const SIEGE_SLOPE = () => HEX.w / 2 / HEX.row, wallWX = y => hexCenter(wallX(y), y)[0] - 17;
const wallLineX = py => wallWX(0) + (py - hexCenter(0, 0)[1]) * SIEGE_SLOPE(); // lico muru na dowolnej wysokości py
const WALL = { face: 13, walk: 50, depth: 16 }; // lico 0..face, chodnik face..walk; depth: wysokość czoła muru widocznego od południa
const SIEGE_STONE = { haven: '#b8ae98', sylvan: '#9aa086', barrow: '#6c6676', fortress: '#8e8a6a', inferno: '#5e403c', academy: '#c4c8d2', dungeon: '#5a5260', stronghold: '#b08a5a' };
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

// Każdy zamek wygląda inaczej: Knieja, Cytadela i Twierdza bronią się za palisadą z bali (drewniane wieże i brama),
// pozostałe za kamiennym murem; do tego ozdoby frakcji (pnącza, trzciny, czaszki, lawa, śnieg, kryształy, chorągwie).
const SIEGE_WOOD = { sylvan: '#7a5c36', fortress: '#6e5c3c', stronghold: '#8c5c32' };
function woodPal(fac) { const c = SIEGE_WOOD[fac]; return { top: LT(c, 0.25), lit: LT(c, 0.1), base: c, sh: DK(c, 0.25), dk: DK(c, 0.45), mortar: DK(c, 0.55), crack: '#1a120a', moss: '#4e7a30' }; }
const sOval = (cx, cy, rx, ry, n = 10) => [...Array(n)].map((_, i) => [cx + Math.cos(i * TAU / n) * rx, cy + Math.sin(i * TAU / n) * ry]);
// kind: 'wall' | 'gate' | 'tower'; state: 'ok' | 'hit' | 'down'; open: od południa brak muru (widać czoło); col: kolor właściciela
function drawSiegePiece(ctx, fac, kind, state, open, col) {
  if (SIEGE_WOOD[fac]) drawWoodPiece(ctx, fac, kind, state, open, col); else drawStonePiece(ctx, fac, kind, state, open, col);
  drawSiegeDeco(ctx, fac, kind, state, col);
}
function drawStonePiece(ctx, fac, kind, state, open, col) {
  const S = stonePal(fac), A = TOWN_ART[fac] || TOWN_ART.haven, h = SIEGE_HALF, { face, walk, depth } = WALL;
  const r = mulberry32((kind === 'gate' ? 50 : kind === 'tower' ? 90 : 3) + (state === 'hit' ? 100 : state === 'down' ? 200 : 0));
  ctx.fillStyle = S.top; ctx.fillStyle = S.lit; ctx.fillStyle = S.base; ctx.fillStyle = S.sh; ctx.fillStyle = S.dk; ctx.fillStyle = S.mortar; // paleta sprite'a
  if (state === 'down' && kind !== 'gate') return drawRubble(ctx, S, r); // wyłom w murze albo zburzona wieża
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
// Punkt na ganku wieży, w którym stoi strzelec (względem (wallWX(y), środek rzędu)); mury z 3D mają swój punkt w opisie arkusza
let siegePost3D = null, keepPost3D = null;
const towerPost = () => siegePost3D || [WALL.walk / 2 - 2, 10 - TOWER_H + 8];
const keepPost = () => { const p = keepPost3D || [-20, -90]; return [p[0] + KEEP_DX, p[1]]; }; // strzelcy na ganku wieży głównej (względem środka jej heksu)
// Mury wypalone z 3D (tools/grafika3d/wypal-oblezenia.js): fragment na rząd, od góry do dołu (niższe zasłaniają wyższe)
const siegeArt = fac => { const A = typeof SIEGE_ART !== 'undefined' && SIEGE_ART[fac], im = SIEGE_IMG[fac]; return A && im && im._ok ? { ...A, im } : null; };
function drawSiege3D(ctx, A, walls) {
  const d = A.d; siegePost3D = A.post || null; keepPost3D = A.keepPost || null;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (const w of [...walls.values()].sort((a, b) => a.y - b.y)) {
    if (w.kind === 'keep') continue; // rysuje ją drawKeep3D razem z oddziałami
    const s = siegeState(w), f = A.p[`${w.kind}_${w.kind === 'tower' && s === 'hit' ? 'ok' : s}`]; if (!f) continue;
    const cy = hexCenter(w.x, w.y)[1]; ctx.drawImage(A.im, f[0], f[1], f[2], f[3], wallWX(w.y) - f[4] / d, cy - f[5] / d, f[2] / d, f[3] / d);
  }
  ctx.restore();
}
// Wieża główna na dziedzińcu: (0, 0) klatki = środek jej heksu przesunięty o KEEP_DX w prawo (baszta wystaje poza pole jak w Heroes 3,
// mniej zasłania); oddziały za nią prześwitują (ekran bitwy rysuje je drugi raz, półprzezroczyste)
const KEEP_DX = 12;
function drawKeep3D(ctx, A, w) {
  const f = A.p[`keep_${w.hp <= 0 ? 'down' : 'ok'}`]; if (!f) return; const d = A.d, [hx, cy] = hexCenter(w.x, w.y), cx = hx + KEEP_DX;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(A.im, f[0], f[1], f[2], f[3], cx - f[4] / d, cy - f[5] / d, f[2] / d, f[3] / d); ctx.restore();
}
// Przód blanek wieży (balustrada, pale, blanki od strony patrzącego) rysowany po strzelcu: strzelec stoi w wieży, nie na niej
function drawTowerFront(ctx, A, u) {
  const f = A && A.p[u.keep ? 'keep_front' : 'tower_front']; if (!f || f[2] <= 0) return;
  const d = A.d, [hx, cy] = hexCenter(u.x, u.y), x = u.keep ? hx + KEEP_DX : wallWX(u.y);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(A.im, f[0], f[1], f[2], f[3], x - f[4] / d, cy - f[5] / d, f[2] / d, f[3] / d); ctx.restore();
}
// Cały mur jako jeden sprite; (0, 0) = (wallWX(0), 0) ekranu bitwy, każdy rząd przesunięty jak mur. Klucz obejmuje stan każdego fragmentu,
// więc nowy rysunek powstaje tylko po trafieniu.
const siegeState = w => (w.hp <= 0 ? 'down' : w.hp < w.max ? 'hit' : 'ok');
function castleSprite(fac, col, walls) {
  const segs = [...walls.values()].filter(w => w.kind !== 'keep').sort((a, b) => a.y - b.y); // wieżę główną rysuje tylko grafika 3D
  return sprite(`castle_${fac}_${col}_${segs.map(w => w.kind[0] + siegeState(w)[0]).join('')}`, 80 + Math.ceil(wallWX(BROWS - 1) - wallWX(0)), 280, 20, 24, p => {
    segs.forEach((w, i) => {
      const next = segs[i + 1], open = !next || (siegeState(next) === 'down' && next.kind === 'wall');
      p.save(); p.translate(wallWX(w.y) - wallWX(0), hexCenter(w.x, w.y)[1]); drawSiegePiece(p, fac, w.kind, siegeState(w), open, col); p.restore();
    });
  }, OUTLINE, 0.5);
}
// Bruk dziedzińca za murem (tło bitwy): kolor płyt [jasny, ciemny] wg frakcji
const SIEGE_PAVE = { haven: [[176, 164, 140], [142, 130, 108]], sylvan: [[140, 146, 118], [108, 116, 90]], barrow: [[104, 98, 114], [78, 74, 88]], fortress: [[132, 126, 98], [102, 98, 74]], inferno: [[96, 64, 58], [70, 44, 40]], academy: [[188, 194, 206], [150, 156, 170]], dungeon: [[92, 86, 100], [66, 60, 74]], stronghold: [[186, 150, 104], [148, 114, 76]] };

// Palisada: pomost z desek od strony miasta, pale z zaostrzonymi czubkami na zewnątrz, wiązania z lin
function drawWoodPiece(ctx, fac, kind, state, open, col) {
  const S = woodPal(fac), A = TOWN_ART[fac] || TOWN_ART.haven, h = SIEGE_HALF, { face, walk, depth } = WALL;
  const r = mulberry32((kind === 'gate' ? 51 : kind === 'tower' ? 91 : 4) + (state === 'hit' ? 100 : state === 'down' ? 200 : 0));
  ctx.fillStyle = S.top; ctx.fillStyle = S.lit; ctx.fillStyle = S.base; ctx.fillStyle = S.sh; ctx.fillStyle = S.dk; // paleta sprite'a
  if (state === 'down' && kind !== 'gate') { // wyłom: połamane bale na ziemi
    for (let i = 0; i < 16; i++) { const x = -12 + r() * (walk + 6), y = -h + 2 + r() * (2 * h - 4), a = (r() - 0.5) * 2.4, L = 8 + r() * 10; limb(ctx, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, 3 + r() * 1.5, i % 3 ? S.base : S.sh); }
    return;
  }
  ctx.fillStyle = S.dk; for (let y = -h; y < h; y += 2) for (let x = walk; x < walk + 10; x += 2) if (((x + y) / 2 & 3) === 0 || x === walk) ctx.fillRect(x, y, 2, 2); // cień na dziedzińcu
  rect(ctx, face, -h, walk - face, 2 * h, S.lit); // pomost
  for (let y = -h; y < h; y += 5) rect(ctx, face, y, walk - face, 1.2, S.sh);
  for (let y = -h + 2, k = 0; y < h; y += 10, k++) rect(ctx, face + 8 + (k % 2) * 14, y, 1.2, 5, S.dk);
  rect(ctx, walk - 4, -h, 4, 2 * h, S.base); rect(ctx, walk - 1.2, -h, 1.2, 2 * h, S.dk); // poręcz
  const gaps = state === 'hit' ? [2, 5] : [];
  for (let y = -h, k = 0; y < h - 1; y += 6.7, k++) {
    if (gaps.includes(k)) { rect(ctx, 2, y + 1, face - 4, 4.5, S.dk); continue; }
    rect(ctx, 0, y, face + 2, 6.2, S.base); rect(ctx, 0, y, face + 2, 1.6, S.top); rect(ctx, 0, y + 4.6, face + 2, 1.6, S.sh);
    fillPoly(ctx, [[0, y], [-7, y + 3.1], [0, y + 3.1]], S.lit); fillPoly(ctx, [[0, y + 3.1], [-7, y + 3.1], [0, y + 6.2]], S.sh); // zaostrzony czubek
    rect(ctx, face - 1, y + 2.4, 3, 1.4, S.dk);
  }
  rect(ctx, 4, -h, 1.6, 2 * h, '#3a2a18'); rect(ctx, face - 3, -h, 1.6, 2 * h, '#3a2a18'); // liny
  if (open) for (let x = -4; x < walk; x += 6.5) { rect(ctx, x, h, 6, depth, S.sh); rect(ctx, x, h, 6, 1.6, S.top); } // końce bali przy wyłomie
  if (state === 'hit') for (let i = 0; i < 6; i++) { const x = -16 + r() * 12, y = -h + r() * 2 * h; limb(ctx, x, y, x + 4 + r() * 5, y + (r() - 0.5) * 4, 1.6, S.base); } // drzazgi
  if (kind === 'tower') return drawWoodTower(ctx, S, A, col, walk / 2, 10, TOWER_H);
  if (kind === 'gate') drawWoodGate(ctx, S, A, state, col);
}
// Wieża strażnicza z bali: słupy z krzyżulcami, pomost z zaostrzonymi deskami, czterospadowy dach w barwie frakcji
function drawWoodTower(ctx, S, A, col, cx, cy, top) {
  const w = 26, py = cy - top, roof = A.roof.tower || A.roof.wall;
  for (const sx of [-w / 2, w / 2 - 4]) { rect(ctx, cx + sx, py, 4, top, S.sh); rect(ctx, cx + sx, py, 1.4, top, S.lit); }
  limb(ctx, cx - w / 2 + 2, cy - 4, cx + w / 2 - 2, py + top * 0.45, 1.6, S.dk); limb(ctx, cx + w / 2 - 2, cy - 4, cx - w / 2 + 2, py + top * 0.45, 1.6, S.dk);
  rect(ctx, cx - w / 2 - 2, py - 2, w + 4, 14, S.base);
  for (let x = cx - w / 2 - 2; x < cx + w / 2 + 2; x += 4.4) { rect(ctx, x, py - 2, 1.2, 14, S.dk); fillPoly(ctx, [[x, py - 2], [x + 2.2, py - 6], [x + 4.4, py - 2]], S.lit); }
  rect(ctx, cx - w / 2 - 2, py + 10, w + 4, 2, S.dk);
  const ap = [cx, py - 34];
  fillPoly(ctx, [[cx - w / 2 - 6, py - 8], [cx + w / 2 + 6, py - 8], ap], roof); fillPoly(ctx, [[cx, py - 8], [cx + w / 2 + 6, py - 8], ap], DK(roof, 0.3));
  for (let i = 0; i < 5; i++) limb(ctx, cx - w / 2 - 4 + i * 8, py - 8, ap[0], ap[1] + 4, 1, DK(roof, 0.45)); // strzecha
  sPennant(ctx, ap, col);
}
// Brama w palisadzie: dwa grube słupy, belka, wrota z desek z okuciami (albo wyłamane), dwie wieżyczki
function drawWoodGate(ctx, S, A, state, col) {
  const h = SIEGE_HALF, cx = 12, by = h - 2;
  drawWoodTower(ctx, S, A, col, cx - 18, by - 22, TOWER_H - 14);
  for (const sx of [-14, 10]) { rect(ctx, cx + sx, by - 34, 5, 34, S.sh); rect(ctx, cx + sx, by - 34, 1.6, 34, S.lit); fillPoly(ctx, [[cx + sx, by - 34], [cx + sx + 2.5, by - 40], [cx + sx + 5, by - 34]], S.lit); }
  rect(ctx, cx - 16, by - 32, 32, 4, S.base); rect(ctx, cx - 16, by - 32, 32, 1.4, S.top);
  if (state === 'down') for (const [a, b, c, d] of [[-9, -2, -2, -16], [2, 0, 8, -12], [-6, -6, 6, -4]]) limb(ctx, cx + a, by + b, cx + c, by + d, 3, S.base);
  else {
    rect(ctx, cx - 9, by - 28, 18, 28, state === 'hit' ? S.sh : S.base);
    for (let x = cx - 9; x < cx + 9; x += 4.5) rect(ctx, x, by - 28, 1.2, 28, S.dk);
    for (const z of [6, 18]) rect(ctx, cx - 9, by - z, 18, 2, '#5a5a5e');
    if (state === 'hit') limb(ctx, cx - 2, by - 22, cx + 3, by - 8, 1.6, '#1a120a');
  }
  for (const s of [-20, 16]) fillPoly(ctx, [[cx + s, by - 30], [cx + s + 5, by - 30], [cx + s + 5, by - 14], [cx + s + 2.5, by - 17], [cx + s, by - 14]], col);
  drawWoodTower(ctx, S, A, col, cx + 22, by - 16, TOWER_H - 14);
}
// Ozdoby frakcji na murze (współrzędne jak we fragmencie muru: lico 0..face, pomost face..walk)
function drawSiegeDeco(ctx, fac, kind, state, col) {
  const h = SIEGE_HALF, { face, walk } = WALL, r = mulberry32(kind.length * 31 + (state === 'hit' ? 7 : 0) + fac.length * 5);
  if (state === 'down' && kind !== 'gate') { // gruzy: kości w Kurhanie, żar w Inferno, kryształy w Lochu
    if (fac === 'barrow') for (let i = 0; i < 4; i++) { const x = r() * walk, y = -h + r() * 2 * h; limb(ctx, x, y, x + 6, y + 2, 1.6, '#e0d8c4'); }
    if (fac === 'inferno') for (let i = 0; i < 5; i++) rect(ctx, r() * walk, -h + r() * 2 * h, 3, 2, '#ff8a2a');
    if (fac === 'dungeon') for (let i = 0; i < 2; i++) { const x = r() * walk, y = -h + r() * 2 * h; fillPoly(ctx, [[x, y], [x + 3, y - 9], [x + 6, y]], '#9a5ad0'); }
    return;
  }
  if (kind === 'tower' && !['academy', 'inferno', 'dungeon', 'barrow'].includes(fac)) return;
  const merlons = f => { for (let y = -h + 1; y < h - 4; y += 11.75) f(y); };
  if (fac === 'haven' && kind === 'wall') { // chorągiew z barwami właściciela na licu
    fillPoly(ctx, [[1, -12], [11, -12], [11, 6], [6, 2], [1, 6]], col); rect(ctx, 1, -13, 10, 1.6, '#e8c868'); fillPoly(ctx, sOval(6, -4, 2.2, 2.2, 8), '#e8c868');
  } else if (fac === 'sylvan') { // pnącza i liście na palisadzie
    ctx.strokeStyle = '#3e6a2a'; ctx.lineWidth = 1.4;
    for (let k = 0; k < 2; k++) { let x = 2 + k * 6; ctx.beginPath(); ctx.moveTo(x, -h); for (let y = -h; y < h; y += 4) { x = clamp(x + (r() - 0.5) * 4, -2, face); ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < 10; i++) { const x = r() * 14 - 2, y = -h + r() * 2 * h; fillPoly(ctx, [[x, y], [x + 3, y - 2], [x + 5, y], [x + 3, y + 2]], i % 2 ? '#5aa03c' : '#3e7a2c'); }
  } else if (fac === 'fortress') { // trzciny i błoto u stóp palisady
    rect(ctx, -9, -h, 4, 2 * h, 'rgba(70,56,30,.7)');
    for (let i = 0; i < 10; i++) { const y = -h + r() * 2 * h, x = -9 + r() * 4; limb(ctx, x, y, x - 2 + r() * 4, y - 7 - r() * 5, 1.2, i % 2 ? '#6a7a3a' : '#8a8a4a'); rect(ctx, x - 1, y - 10 - r() * 3, 1.6, 3, '#5a3a1a'); }
  } else if (fac === 'stronghold') { // czaszki na palach, czerwony proporzec wojenny
    for (const y of [-h + 6, 4]) { fillPoly(ctx, sOval(-9, y, 3.2, 2.8, 8), '#e8e0cc'); rect(ctx, -10.6, y - 0.6, 1.2, 1.2, '#1a1410'); rect(ctx, -8.4, y - 0.6, 1.2, 1.2, '#1a1410'); }
    if (kind === 'wall') fillPoly(ctx, [[face + 3, -12], [face + 10, -12], [face + 10, 6], [face + 6.5, 2], [face + 3, 6]], '#a8281e');
  } else if (fac === 'barrow') { // czaszki na blankach, zielona poświata w strzelnicach
    if (kind !== 'tower') merlons(y => { fillPoly(ctx, sOval(face + 2, y + 3, 3, 2.6, 8), '#ddd6c2'); rect(ctx, face + 0.6, y + 2.4, 1.2, 1.2, '#14100e'); rect(ctx, face + 2.8, y + 2.4, 1.2, 1.2, '#14100e'); });
    for (const y of [-11, 7]) rect(ctx, 4.4, y + 1, 2.2, 6, '#7af0a0');
  } else if (fac === 'inferno') { // szczeliny z lawą w licu, kolce na blankach
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 2; k++) { let x = 2 + r() * 8, y = -h + r() * 10; ctx.beginPath(); ctx.moveTo(x, y); for (let i = 0; i < 6; i++) { x = clamp(x + (r() - 0.5) * 6, 0, face); y += 5 + r() * 4; ctx.lineTo(x, y); } ctx.strokeStyle = '#ff6a1a'; ctx.stroke(); ctx.lineWidth = 0.7; ctx.strokeStyle = '#ffd27a'; ctx.stroke(); ctx.lineWidth = 1.6; }
    if (kind !== 'tower') merlons(y => fillPoly(ctx, [[face - 4, y + 1], [face - 9, y + 3], [face - 4, y + 5]], '#2a1614'));
  } else if (fac === 'academy') { // śnieg na blankach i pomoście, błękitne kryształy
    if (kind !== 'tower') merlons(y => rect(ctx, face - 4, y, 12, 2.4, '#f4f8ff'));
    for (let i = 0; i < 4; i++) rect(ctx, face + 4 + r() * 28, -h + r() * 2 * h, 6, 2, 'rgba(244,248,255,.85)');
    if (kind === 'wall') { const y = -4; fillPoly(ctx, [[face + 18, y], [face + 21, y - 10], [face + 24, y]], '#7ac8ff'); fillPoly(ctx, [[face + 21, y - 10], [face + 24, y], [face + 22, y]], '#c8ecff'); }
  } else if (fac === 'dungeon') { // fioletowe kryształy u podstawy i świecące grzyby
    for (let i = 0; i < 3; i++) { const x = -10 + r() * 6, y = -h + 6 + r() * (2 * h - 12), hh = 6 + r() * 6; fillPoly(ctx, [[x, y], [x + 2.5, y - hh], [x + 5, y]], '#8a4ac8'); fillPoly(ctx, [[x + 2.5, y - hh], [x + 5, y], [x + 3.4, y]], '#c896f0'); }
    for (let i = 0; i < 3; i++) fillPoly(ctx, sOval(face + 6 + r() * 24, -h + r() * 2 * h, 1.8, 1.2, 6), '#7af0e0');
  }
}
