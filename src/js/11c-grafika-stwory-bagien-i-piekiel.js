// ==================== GRAFIKA: STWORY TWIERDZY I INFERNA =================================
// Rodzaje ciała spoza postaci i czworonogów: ważka ('insect'), bazyliszek ('lizard'), gorgona ('bull'), hydra ('hydra').
// Jak pozostałe stwory: (0,0) = ziemia pod stworem, przód w stronę +x, P = { t, walk, atk, hurt }.
const lungeOf = P => (P.atk != null ? Math.sin(clamp(P.atk, 0, 1) * Math.PI) : 0);
// Ważka: długi odwłok, cztery skrzydła w szybkim trzepocie, wielkie oczy; atak = pchnięcie odwłokiem
function drawInsect(ctx, L, P = {}) {
  const f = L.fur, t = P.t || 0, lunge = lungeOf(P), dk = DK(f, 0.3), lt = LT(f, 0.3), bob = Math.sin(t * 3) * 1.5;
  ctx.save(); ctx.translate(lunge * 5, -20 + bob); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const buzz = P.walk != null ? Math.sin(P.walk * TAU * 4) : Math.sin(t * 20);
  const wingP = (ang, len, col) => { ctx.save(); ctx.rotate(ang); fillPoly(ctx, [[0, 0], [-len * 0.3, -3], [-len, -2.5], [-len * 1.05, 0], [-len * 0.6, 1.8]], col); limb(ctx, 0, -0.5, -len, -1.2, 0.5, DK(L.wing, 0.3)); ctx.restore(); };
  wingP(-0.6 - buzz * 0.35, 17, DK(L.wing, 0.12)); wingP(-0.25 - buzz * 0.3, 15, DK(L.wing, 0.18));
  for (let i = 0; i < 3; i++) limb(ctx, 1 + i * 2, 2, i * 2 - 1, 7 + (i % 2), 0.7, '#2a2a1a'); // nogi
  const curl = lunge * 6; // odwłok: segmenty od tułowia do tyłu, przy ataku podgina się
  for (let i = 0; i < 7; i++) { const x = -4 - i * 3.2, y = 0.5 + i * 0.25 + (i > 3 ? curl * (i - 3) * 0.25 : 0); oval(ctx, x, y, 2.2 - i * 0.12, 1.7 - i * 0.1, i % 2 ? f : dk); }
  oval(ctx, 0, 0, 4.2, 3.2, f); oval(ctx, -0.5, -1.3, 3, 1.2, lt);
  circ(ctx, 5, -0.8, 3, dk); circ(ctx, 5.8, -1.8, 2.4, L.eyes); circ(ctx, 5.2, -2.4, 0.8, '#ffffff');
  wingP(-0.1 + buzz * 0.4, 18, L.wing); wingP(0.25 + buzz * 0.3, 15, LT(L.wing, 0.1));
  ctx.restore();
}
// Bazyliszek: niski gad z długim ogonem, kolce na grzbiecie, świecące oczy (spojrzenie zamienia w kamień)
function drawLizard(ctx, L, P = {}) {
  const f = L.fur, t = P.t || 0, lunge = lungeOf(P), dk = DK(f, 0.3), lt = LT(f, 0.25), sp = L.spikes || dk;
  ctx.save(); ctx.translate(lunge * 4, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  quadLegs(ctx, [[-8, 0, true], [7, Math.PI, true]], -5, 5, f, P, 2.2);
  const sw = Math.sin(t * 2.5) * 1.5; // ogon
  fillPoly(ctx, [[-10, -9], [-18, -6 + sw * 0.5], [-26, -3 + sw], [-19, -3 + sw * 0.5], [-10, -4]], f); fillPoly(ctx, [[-10, -5], [-19, -3.5 + sw * 0.5], [-26, -3 + sw], [-19, -2.5], [-10, -3.5]], dk);
  oval(ctx, 0, -7, 12, 4.8, f); oval(ctx, 0.5, -4.4, 10, 1.8, dk); oval(ctx, -1, -10, 8, 1.4, lt);
  for (let i = 0; i < 6; i++) fillPoly(ctx, [[-10 + i * 3.6, -11], [-8.6 + i * 3.6, -15 - (i % 2) * 1.5], [-7 + i * 3.6, -11]], sp);
  const jaw = lunge * 3, hy = -9 - lunge * 1.5; // głowa: klin z grzebieniem
  fillPoly(ctx, [[9, -12], [15, hy - 3], [21, hy - 1], [22, hy + 1], [15, hy + 1.5], [9, -4]], f);
  fillPoly(ctx, [[15, hy + 1.5], [21.5, hy + 1 + jaw], [15, hy + 3 + jaw]], dk);
  if (jaw > 1) fillPoly(ctx, [[16, hy + 1.8], [21, hy + 1.3 + jaw * 0.6], [16.5, hy + 2.6 + jaw * 0.6]], '#6a1a1a');
  for (let i = 0; i < 3; i++) fillPoly(ctx, [[10 + i * 2.5, hy - 2.5], [11 + i * 2.5, hy - 6 + i], [12.5 + i * 2.5, hy - 2.8]], sp);
  circ(ctx, 17, hy - 1.2, 1.3, L.eyes); ctx.fillStyle = '#1a1a10'; ctx.fillRect(17, hy - 1.8, 0.6, 1.3);
  if (lunge > 0.4) { ctx.globalAlpha = lunge * 0.6; circ(ctx, 24, hy - 1, 3 + lunge * 2, L.eyes); ctx.globalAlpha = 1; }
  quadLegs(ctx, [[-6, Math.PI, false], [9, 0, false]], -5, 5, f, P, 2.4);
  ctx.restore();
}
// Gorgona: ciężki byk w żelaznych łuskach, rogi do przodu; potężna zieje zielonym oddechem
function drawBull(ctx, L, P = {}) {
  const f = L.fur, t = P.t || 0, lunge = lungeOf(P), dk = DK(f, 0.35), lt = LT(f, 0.3), horn = L.horn || '#e8e0cc';
  ctx.save(); ctx.translate(lunge * 5, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  quadLegs(ctx, [[-9, 0, true], [8, Math.PI, true]], -10, 10, f, P, 3);
  const sw = Math.sin(t * 2) * 1.2; limb(ctx, -12, -17, -16, -9 + sw, 1.2, dk); fillPoly(ctx, [[-16.5, -10 + sw], [-14.5, -10 + sw], [-15.5, -6 + sw]], '#2a2420');
  oval(ctx, 0, -16, 13, 7.5, f); oval(ctx, 0.5, -12, 11, 2.8, dk); oval(ctx, -1, -21.5, 9, 1.8, lt);
  if (L.barding) { oval(ctx, -1, -16.5, 11, 6.2, L.barding); ctx.fillStyle = L.trim || '#e0b050'; ctx.fillRect(-11, -12.5, 21, 1.4); }
  if (!L.plain) for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { ctx.strokeStyle = dk; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(-9 + i * 4.5 + j * 2, -18 + j * 4, 2.2, 0.2, Math.PI - 0.2); ctx.stroke(); } // łuski
  oval(ctx, 9, -18, 5.5, 7, f); // kark
  const hy = -15 + lunge * 3; // głowa pochylona do ataku
  fillPoly(ctx, [[10, hy - 6], [17, hy - 4], [21, hy + 2], [19, hy + 5], [13, hy + 4], [10, hy]], f); fillPoly(ctx, [[13, hy + 4], [19, hy + 5], [21, hy + 2], [18, hy + 2.5]], dk);
  circ(ctx, 19.5, hy + 3.2, 0.7, '#1a1410'); circ(ctx, 15.5, hy - 2.3, 1.1, '#f0e060');
  fillPoly(ctx, [[12, hy - 5], [9, hy - 10], [14, hy - 13], [13, hy - 9], [14.5, hy - 5]], horn); fillPoly(ctx, [[15, hy - 4.5], [16, hy - 9], [21, hy - 11], [18, hy - 7.5], [17, hy - 4]], LT(horn, 0.15));
  if (L.breath && lunge > 0.3) { ctx.globalAlpha = 0.7 * lunge; for (let i = 0; i < 4; i++) circ(ctx, 23 + i * 4, hy + 3 - i * 0.5, 2 + i * 1.2, i % 2 ? L.breath : LT(L.breath, 0.4)); ctx.globalAlpha = 1; }
  quadLegs(ctx, [[-7, Math.PI, false], [10, 0, false]], -10, 10, f, P, 3.2);
  ctx.restore();
}
// Hydra: ciężkie cielsko na krótkich łapach i wachlarz szyj z głowami; przy ataku wszystkie głowy kąsają
function drawHydra(ctx, L, P = {}) {
  const f = L.fur, t = P.t || 0, lunge = lungeOf(P), dk = DK(f, 0.3), lt = LT(f, 0.25), n = L.heads || 5;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  quadLegs(ctx, [[-9, 0, true], [7, Math.PI, true]], -6, 6, f, P, 3);
  const sw = Math.sin(t * 2) * 1.5; fillPoly(ctx, [[-12, -12], [-20, -8 + sw * 0.5], [-27, -4 + sw], [-20, -3], [-12, -5]], dk);
  oval(ctx, -1, -11, 14, 7, f); oval(ctx, -0.5, -6.5, 12, 2.4, dk); oval(ctx, -3, -16, 9, 1.8, lt);
  const heads = [];
  for (let i = 0; i < n; i++) { // szyje rozchodzą się wachlarzem, dalsze ciemniejsze
    const a = -1.25 + i / (n - 1) * 1.1, sway = Math.sin(t * 2.2 + i * 1.3) * 1.8, len = 17 + (i % 2) * 3;
    heads.push({ i, x: 5 + Math.cos(a) * len + lunge * 8, y: -15 + Math.sin(a) * len + sway + lunge * 3, far: i % 2 === 0 });
  }
  const neck = h => { ctx.strokeStyle = h.far ? dk : f; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, -14); ctx.quadraticCurveTo(h.x - 6, h.y + 4, h.x, h.y); ctx.stroke(); };
  const headAt = h => {
    const c = h.far ? dk : f, jaw = lunge * 2;
    fillPoly(ctx, [[h.x - 2, h.y - 2.5], [h.x + 4, h.y - 2], [h.x + 6.5, h.y], [h.x + 4, h.y + 1.5 + jaw], [h.x - 2, h.y + 2]], c);
    fillPoly(ctx, [[h.x - 1, h.y - 2.4], [h.x - 3, h.y - 5], [h.x + 0.5, h.y - 2.6]], DK(c, 0.25));
    circ(ctx, h.x + 2, h.y - 0.8, 0.8, '#f0e060');
  };
  heads.filter(h => h.far).forEach(h => { neck(h); headAt(h); });
  heads.filter(h => !h.far).forEach(h => { neck(h); headAt(h); });
  quadLegs(ctx, [[-7, Math.PI, false], [9, 0, false]], -6, 6, f, P, 3.2);
  ctx.restore();
}
// Oko Lochu (obserwator, złe oko): unosząca się kula z wielkim okiem i mackami z oczkami; przy ataku źrenica się zwęża i oko błyska
function drawEyeBeast(ctx, L, P = {}) {
  const f = L.fur, t = P.t || 0, lunge = lungeOf(P), dk = DK(f, 0.35), lt = LT(f, 0.25), y = -17 + (P.hover || 0) * 1.5;
  ctx.save(); ctx.translate(lunge * 4, 0); ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) { // macki u góry z małymi oczkami
    const a = -2.4 + i * 0.4, w = Math.sin(t * 3 + i * 1.3) * 1.5, ex = Math.cos(a) * 14 + w, ey = y + Math.sin(a) * 13;
    limb(ctx, Math.cos(a) * 6, y + Math.sin(a) * 6, ex, ey, 1.4, dk); circ(ctx, ex, ey, 1.6, '#f0ead8'); circ(ctx, ex + 0.5, ey, 0.7, '#1a1a1a');
  }
  for (let i = 0; i < 3; i++) { const w = Math.sin(t * 2.5 + i) * 2; limb(ctx, -4 + i * 4, y + 8, -5 + i * 4 + w, y + 16, 1.6, dk); } // macki pod spodem
  circ(ctx, 0, y, 9.5, f); circ(ctx, -2, y - 2, 6, lt); fillPoly(ctx, [[-9, y + 2], [9, y + 2], [6, y + 7.5], [-6, y + 7.5]], dk);
  const sq = lunge > 0.3 ? 0.4 : 1; oval(ctx, 3, y - 0.5, 5.5, 4.4 * (lunge > 0.3 ? 0.8 : 1), '#f4f0e0');
  oval(ctx, 4, y - 0.5, 2.8, 2.8, L.eyes || '#f0e060'); oval(ctx, 4.4, y - 0.5, 0.9 * sq, 2.2, '#140a10');
  fillPoly(ctx, [[-2, y + 4], [7, y + 4], [5.5, y + 6.5], [-0.5, y + 6.5]], '#2a0a14'); for (let i = 0; i < 4; i++) fillPoly(ctx, [[-1 + i * 2, y + 4], [0 + i * 2, y + 5.6], [1 + i * 2, y + 4]], '#f0ead8');
  if (lunge > 0.3) { ctx.globalAlpha = lunge * 0.6; circ(ctx, 4, y - 0.5, 7, L.orb || '#e0a0ff'); ctx.globalAlpha = 1; }
  ctx.restore();
}
// Wielki ptak Cytadeli (rok, ptak gromu): szerokie skrzydła, biała głowa, zakrzywiony dziób; ptak gromu rzuca iskry
function drawBigBird(ctx, L, P = {}) {
  const f = L.fur, t = P.t || 0, lunge = lungeOf(P), wa = flapAngle(P, -0.25, 0.4, 4), y = -22 + Math.sin(t * 2.5) * 1.2;
  ctx.save(); ctx.translate(lunge * 6, lunge * 3); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(-1, y - 2); wing(ctx, wa + 0.2, 24, DK(L.wing, 0.2), DK(L.wing, 0.45)); ctx.restore();
  for (let i = 0; i < 3; i++) fillPoly(ctx, [[-7, y + 2], [-16 - i * 1.5, y + 3 + i * 2.5], [-8, y + 5]], i % 2 ? L.wing : DK(f, 0.2)); // ogon
  limb(ctx, 0, y + 5, -1 - lunge * 2, y + 11, 1.8, '#c8a040'); limb(ctx, 3, y + 5, 4 + lunge * 3, y + 11, 1.8, '#c8a040'); // szpony
  for (const x of [-1 - lunge * 2, 4 + lunge * 3]) fillPoly(ctx, [[x - 2, y + 11], [x + 3, y + 11], [x + 3.5, y + 13]], '#2a2010');
  oval(ctx, 0, y, 9, 6, f); oval(ctx, 1, y + 2.5, 6.5, 2.4, LT(f, 0.2));
  oval(ctx, 8, y - 5, 3.2, 4.5, f); circ(ctx, 10, y - 9, 3.8, L.head || '#e8e0d0');
  fillPoly(ctx, [[13, y - 10], [17.5, y - 8.5], [16.5, y - 5.5], [13.5, y - 7]], L.beak || '#e0a030'); circ(ctx, 11.3, y - 9.8, 0.9, '#1a1a1a');
  ctx.save(); ctx.translate(0, y - 3); wing(ctx, wa, 22, L.wing, LT(L.wing, 0.3)); ctx.restore();
  if (L.glow && (lunge > 0.2 || Math.sin(t * 5) > 0.7)) { const k = Math.max(lunge, 0.5); limb(ctx, -6, y - 16, -2, y - 10, 1.2 * k, L.glow); limb(ctx, -2, y - 10, -5, y - 5, 1.2 * k, L.glow); limb(ctx, 12, y - 14, 16, y - 18, 1 * k, L.glow); }
  ctx.restore();
}
