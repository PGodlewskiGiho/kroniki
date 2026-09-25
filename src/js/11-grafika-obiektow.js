// ==================== GRAFIKA OBIEKTÓW (wspólna dla mapy i interfejsu) ==================
// Jeden rysunek na obiekt. Mapa i interfejs używają tych samych sprite'ów.
function drawResIcon(ctx, id, cx, cy, s = 24) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 24, s / 24); ctx.lineWidth = 1.2; ctx.strokeStyle = '#1a0e04';
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  switch (id) {
    case 'wood':
      for (const [oy, len] of [[4, 20], [-4, 17]]) {
        ctx.fillStyle = '#7a4a22'; rr(ctx, -len / 2, oy - 4, len, 8, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d9aa6c'; ctx.beginPath(); ctx.ellipse(len / 2 - 1, oy, 2.6, 3.8, 0, 0, TAU); ctx.fill(); ctx.stroke();
      } break;
    case 'mercury': {
      ctx.fillStyle = '#b8bcc8'; ctx.fillRect(-3, -11, 6, 9); ctx.strokeRect(-3, -11, 6, 9);
      const g = ctx.createRadialGradient(-3, 1, 1, 0, 4, 9); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8a90a0');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 4, 8, 0, TAU); ctx.fill(); ctx.stroke(); break;
    }
    case 'ore':
      poly([[-10, 6], [-7, -4], [0, -9], [8, -5], [10, 5], [3, 9], [-6, 9]], '#6d6a68');
      poly([[-7, -4], [0, -9], [2, -1], [-3, 1]], '#a19c97'); break;
    case 'sulfur':
      ctx.beginPath(); ctx.moveTo(-11, 8); ctx.quadraticCurveTo(-6, -10, 0, -9); ctx.quadraticCurveTo(7, -9, 11, 8); ctx.closePath();
      ctx.fillStyle = '#e4c629'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff38a';
      for (const [dx, dy] of [[-3, -3], [3, 0], [-5, 4], [2, 5]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.4, 0, TAU); ctx.fill(); } break;
    case 'crystal':
      poly([[7, -4], [11, 2], [9, 9], [5, 9], [4, 1]], '#a81f28');
      poly([[0, -11], [6, -2], [3, 9], [-3, 9], [-6, -2]], '#d8303a');
      poly([[0, -11], [-1, 9], [-3, 9], [-6, -2]], '#ff7a82'); break;
    case 'gems': {
      const gem = (gx, gy, c) => poly([[gx, gy - 6], [gx + 5, gy], [gx, gy + 6], [gx - 5, gy]], c);
      gem(0, -4, '#b04ad0'); gem(-5, 4, '#2fb85a'); gem(5, 4, '#3a7de0'); break;
    }
    case 'gold':
      for (const [sx, n] of [[-4, 4], [6, 2]]) for (let i = 0; i < n; i++) {
        ctx.fillStyle = i === n - 1 ? '#ffe070' : '#d9a520'; ctx.beginPath(); ctx.ellipse(sx, 8 - i * 4, 6, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
      } break;
  }
  ctx.restore();
}
function drawChest(ctx, x, y, t) {
  shadowAt(ctx, x, y + 8, 10);
  ctx.fillStyle = '#7a4a1e'; rr(ctx, x - 9, y - 4, 18, 12, 2); ctx.fill();
  ctx.fillStyle = '#9a5e28'; ctx.beginPath(); ctx.moveTo(x - 9, y - 3); ctx.quadraticCurveTo(x, y - 12, x + 9, y - 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e0b24a'; ctx.fillRect(x - 9, y - 1, 18, 2); ctx.fillRect(x - 5, y - 7, 2, 15); ctx.fillRect(x + 3, y - 7, 2, 15); ctx.fillRect(x - 1.5, y - 1, 3, 4);
  const a = 0.5 + 0.5 * Math.sin(t * 3 + x); circ(ctx, x + 6, y - 7, 1 + a, `rgba(255,250,210,${a.toFixed(2)})`);
}
function drawMine(ctx, ob, x0, y0, t, col) {
  const k = ob.kind, by = y0 + 58;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x0 + 34, by, 30, 7, 0, 0, TAU); ctx.fill();
  const poly = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.fill(); };
  if (k === 'wood') {
    ctx.fillStyle = '#6a4424'; ctx.fillRect(x0 + 8, y0 + 24, 40, 32);
    ctx.strokeStyle = 'rgba(30,18,8,.5)'; ctx.lineWidth = 1; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x0 + 8, y0 + 24 + i * 6.4); ctx.lineTo(x0 + 48, y0 + 24 + i * 6.4); ctx.stroke(); }
    poly([[x0 + 3, y0 + 26], [x0 + 28, y0 + 6], [x0 + 53, y0 + 26]], '#8a3a22');
    ctx.fillStyle = '#1a120a'; ctx.fillRect(x0 + 38, y0 + 38, 10, 18);
    circ(ctx, x0 + 18, y0 + 44, 7, '#c0c4cc'); circ(ctx, x0 + 18, y0 + 44, 2, '#6a6e76');
    drawResIcon(ctx, 'wood', x0 + 54, y0 + 52, 20);
  } else if (k === 'mercury') {
    ctx.fillStyle = '#8a8478'; ctx.fillRect(x0 + 14, y0 + 18, 30, 38); poly([[x0 + 10, y0 + 20], [x0 + 29, y0 + 2], [x0 + 48, y0 + 20]], '#4a4a6a');
    ctx.fillStyle = '#6a6458'; ctx.fillRect(x0 + 36, y0 + 4, 6, 12);
    if (col) for (let i = 0; i < 3; i++) { const p = (t * 0.6 + i / 3) % 1; circ(ctx, x0 + 39 + Math.sin(p * 6 + i) * 3, y0 + 2 - p * 16, 2 + p * 4, `rgba(170,240,190,${(0.5 * (1 - p)).toFixed(2)})`); }
    ctx.fillStyle = '#1a120a'; ctx.fillRect(x0 + 34, y0 + 40, 10, 16); ctx.fillStyle = '#9fe0b0'; ctx.fillRect(x0 + 20, y0 + 28, 6, 8);
    drawResIcon(ctx, 'mercury', x0 + 54, y0 + 50, 18);
  } else if (k === 'gems') {
    ctx.fillStyle = '#5a7a4a'; ctx.beginPath(); ctx.ellipse(x0 + 30, y0 + 42, 27, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a6aa0'; ctx.beginPath(); ctx.ellipse(x0 + 30, y0 + 42, 23, 11, 0, 0, TAU); ctx.fill();
    drawResIcon(ctx, 'gems', x0 + 46, y0 + 48, 18);
    for (let i = 0; i < 3; i++) { const a = 0.5 + 0.5 * Math.sin(t * 4 + i * 2); circ(ctx, x0 + 18 + i * 10, y0 + 38 + (i % 2) * 5, 1 + a, `rgba(255,255,255,${a.toFixed(2)})`); }
  } else {
    const pal = { ore: ['#6f6a62', '#8f8a80'], sulfur: ['#b89a3a', '#d8c060'], crystal: ['#6a6474', '#8a8494'], gold: ['#7a5a36', '#9a7a4e'] }[k];
    poly([[x0 + 2, by], [x0 + 10, y0 + 18], [x0 + 30, y0 + 6], [x0 + 52, y0 + 14], [x0 + 64, by]], pal[0]);
    poly([[x0 + 2, by], [x0 + 10, y0 + 18], [x0 + 30, y0 + 6], [x0 + 26, y0 + 30], [x0 + 18, by]], pal[1]);
    ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.moveTo(x0 + 36, by); ctx.lineTo(x0 + 36, y0 + 42); ctx.arc(x0 + 43, y0 + 42, 7, Math.PI, 0); ctx.lineTo(x0 + 50, by); ctx.fill();
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x0 + 35, by); ctx.lineTo(x0 + 35, y0 + 34); ctx.lineTo(x0 + 51, y0 + 34); ctx.lineTo(x0 + 51, by); ctx.stroke();
    if (k === 'crystal') { drawResIcon(ctx, 'crystal', x0 + 20, y0 + 20, 16); drawResIcon(ctx, 'crystal', x0 + 44, y0 + 18, 12); }
    if (k === 'sulfur' && col) for (let i = 0; i < 2; i++) { const p = (t * 0.5 + i / 2) % 1; circ(ctx, x0 + 28 + Math.sin(p * 5) * 3, y0 + 4 - p * 14, 2 + p * 4, `rgba(230,220,120,${(0.45 * (1 - p)).toFixed(2)})`); }
    drawResIcon(ctx, k, x0 + 18, y0 + 50, 18);
  }
  if (col) drawFlag(ctx, x0 + 56, y0 - 2, 12, 7, t, col);
}
// --- stworzenia -------------------------------------------------------------------------------
// Rysunki w jednostkach mapy, (0, 0) = punkt na ziemi pod stworzeniem, zwrot w prawo.
// Te same funkcje rysują jednostki w siedliskach miasta, na mapie, w oknach i w bitwie (w bitwie w podwójnej
// rozdzielczości i w pozach). Poza P: { t: czas, walk: faza kroku 0..1, atk: faza ataku 0..1, hurt: trafiony }.
// Cieniowanie „komiksowe”: kolor bazowy + ciemniejszy od spodu/tyłu + jaśniejszy od góry/przodu.
const DK = (c, k = 0.32) => shadeHex(c, -k), LT = (c, k = 0.22) => shadeHex(c, k);
const lerp = (a, b, f) => a + (b - a) * f, ease = f => f * f * (3 - 2 * f);
function limb(ctx, x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function fillPoly(ctx, pts, col) { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
function oval(ctx, x, y, rx, ry, col, rot = 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); }
// Faza ataku -> kąt ramienia (0 = w dół, dodatni = do przodu) i pochylenie tułowia, zależnie od stylu broni
function attackArm(style, f) {
  if (f == null) return { a: style === 'thrust' ? 0.9 : style === 'bow' ? 0.35 : 0.55, lean: 0, pull: 0 };
  if (style === 'bow') return { a: 1.45, lean: -0.03, pull: f < 0.6 ? ease(f / 0.6) : 1 - ease((f - 0.6) / 0.4) };
  if (style === 'thrust') return { a: f < 0.4 ? lerp(0.9, 0.5, ease(f / 0.4)) : f < 0.55 ? lerp(0.5, 1.6, (f - 0.4) / 0.15) : lerp(1.6, 0.9, ease((f - 0.55) / 0.45)), lean: f < 0.4 ? -0.08 : f < 0.75 ? 0.16 : 0.16 * (1 - (f - 0.75) / 0.25), pull: 0 };
  if (style === 'cast') return { a: f < 0.5 ? lerp(0.55, -2.7, ease(f / 0.5)) : lerp(-2.7, 0.55, ease((f - 0.5) / 0.5)), lean: -0.06, pull: 0 };
  return { a: f < 0.42 ? lerp(0.55, -2.5, ease(f / 0.42)) : f < 0.58 ? lerp(-2.5, 1.5, (f - 0.42) / 0.16) : lerp(1.5, 0.55, ease((f - 0.58) / 0.42)), lean: f < 0.42 ? -0.12 * f / 0.42 : f < 0.8 ? 0.16 : 0.16 * (1 - (f - 0.8) / 0.2), pull: 0 };
}
const weaponStyle = w => (w === 'spear' || w === 'halberd' || w === 'lance' ? 'thrust' : w === 'bow' ? 'bow' : w === 'staff' ? 'cast' : 'swing');
// Broń w dłoni: (0,0) = chwyt, oś -y = w stronę ostrza
function drawWeapon(ctx, L, kind, hx, hy, ang, pull) {
  const met = L.metal || '#b8c0cc', wood = '#6a4424';
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
  switch (kind) {
    case 'spear': case 'halberd': case 'lance': {
      const len = kind === 'lance' ? 26 : 22; limb(ctx, 0, 8, 0, -len, kind === 'lance' ? 2 : 1.5, wood);
      fillPoly(ctx, [[-1.8, -len + 1], [0, -len - 5], [1.8, -len + 1]], met); limb(ctx, -0.6, -len, -0.2, -len - 3.5, 0.7, LT(met, 0.35));
      if (kind === 'halberd') { fillPoly(ctx, [[0.5, -len + 2], [5, -len], [5.5, -len + 5], [0.5, -len + 5]], met); fillPoly(ctx, [[-0.5, -len + 3], [-3, -len + 4], [-0.5, -len + 5]], DK(met)); }
      if (kind === 'lance') { fillPoly(ctx, [[-2.4, 3], [2.4, 3], [1, -2], [-1, -2]], L.cloth || '#c8a050'); }
      if (L.pennon) fillPoly(ctx, [[0.6, -len + 3], [6, -len + 4.5], [0.6, -len + 6.5]], L.pennon);
      break; }
    case 'sword':
      fillPoly(ctx, [[-1, -1.5], [1, -1.5], [0.9, -13], [0, -15], [-0.9, -13]], met); limb(ctx, -0.3, -2.5, -0.3, -13, 0.6, LT(met, 0.4));
      limb(ctx, -3, -1.2, 3, -1.2, 1.3, L.hilt || '#c8a050'); limb(ctx, 0, -0.8, 0, 2.2, 1.4, '#4a2a14');
      if (L.glow) { ctx.globalAlpha = 0.6; limb(ctx, 0, -3, 0, -14, 2.6, L.glow); ctx.globalAlpha = 1; }
      break;
    case 'axe':
      limb(ctx, 0, 4, 0, -13, 1.6, wood); fillPoly(ctx, [[0.5, -13], [6.5, -15.5], [7.5, -9.5], [0.5, -9]], met); limb(ctx, 6.6, -15, 7.3, -10, 0.8, LT(met, 0.4));
      break;
    case 'club':
      fillPoly(ctx, [[-0.9, 3], [0.9, 3], [2.4, -11], [0, -13.5], [-2.4, -11]], '#6a4424'); circ(ctx, 1, -8, 0.8, '#3a2410'); circ(ctx, -1, -5, 0.7, '#3a2410');
      break;
    case 'staff':
      limb(ctx, 0, 10, 0, -15, 1.5, wood); fillPoly(ctx, [[-1.6, -14.5], [0, -17], [1.6, -14.5]], '#8a6a3a');
      circ(ctx, 0, -18.5, 2.6, L.orb || '#f0d890'); circ(ctx, -0.7, -19.3, 0.9, '#ffffff');
      break;
    case 'bow': {
      ctx.rotate(-ang); // łuk zawsze pionowo
      const px = -pull * 5; ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-2.5, 0, 8.5, -1.2, 1.2); ctx.stroke();
      const ty = Math.sin(1.2) * 8.5, tx = -2.5 + Math.cos(1.2) * 8.5; ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(tx, -ty); ctx.lineTo(px, 0); ctx.lineTo(tx, ty); ctx.stroke();
      if (pull > 0.05) { limb(ctx, px, 0, px + 12, 0, 0.8, '#c8a878'); fillPoly(ctx, [[px + 12, -1.2], [px + 14.5, 0], [px + 12, 1.2]], met); }
      break; }
  }
  ctx.restore();
}
function drawHumanoid(ctx, L, P = {}) {
  const s = L.size || 1, t = P.t || 0; ctx.save(); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const sk = L.skin, cl = L.cloth || '#6a5a4a', met = L.metal || '#b8c0cc', lea = L.leather || '#4a3222', bony = !!L.bony, W = L.weapon || 'none';
  const walking = P.walk != null, ph = walking ? P.walk * TAU : 0, sw = walking ? Math.sin(ph) : 0;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 1.1 : Math.sin(t * 2.4) * 0.4;
  const style = weaponStyle(W), arm = attackArm(style, P.atk);
  let lean = arm.lean + (L.hunch ? 0.22 : 0); if (P.hurt) lean -= 0.25;
  const hipY = -8 + bob * 0.3, shY = -19 + bob, hdY = -24.6 + bob;
  // nogi (albo nogi jeźdźca zwisające po boku konia)
  const legCol = bony ? sk : L.pants || DK(cl, 0.2), boot = bony ? sk : L.boots || lea;
  const leg = (x0, off, back) => {
    const lift = walking ? Math.max(0, (back ? -1 : 1) * Math.cos(ph)) * 2 : 0, fx = x0 + off, fy = -lift;
    const kx = (x0 + fx) / 2 + 1.3, ky = (hipY + fy) / 2 - 0.5, c = back ? DK(legCol, 0.25) : legCol;
    limb(ctx, x0, hipY, kx, ky, bony ? 1.3 : 2.9, c); limb(ctx, kx, ky, fx, fy - 1.3, bony ? 1.2 : 2.6, c);
    if (!bony) { ctx.fillStyle = back ? DK(boot, 0.25) : boot; rr(ctx, fx - 1.7, fy - 2.6, 4.4, 2.6, 0.8); ctx.fill(); }
  };
  if (L.mounted) { limb(ctx, 1, hipY, 3.5, hipY + 5, 2.6, legCol); ctx.fillStyle = boot; rr(ctx, 2, hipY + 4, 4, 2.4, 0.8); ctx.fill(); }
  else if (!L.robe) leg(-1.8, -sw * 3.6, true);
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -hipY);
  if (L.wings) { // skrzydła za plecami, lekko falujące
    const fl = Math.sin(t * 3 + (walking ? ph : 0)) * 0.12 + (walking ? 0.3 * Math.sin(ph) : 0);
    ctx.save(); ctx.translate(-2, shY + 2); ctx.rotate(-0.2 + fl);
    fillPoly(ctx, [[0, 0], [-8, -14], [-15, -18], [-13, -11], [-17, -9], [-12, -5], [-15, -2], [-6, 2]], DK(L.wings, 0.12));
    fillPoly(ctx, [[0, 0], [-7, -12], [-11, -12], [-6, -4]], LT(L.wings, 0.1)); ctx.restore();
  }
  if (L.cape) { const cw = walking ? sw * 1.5 : Math.sin(t * 1.8) * 0.6; fillPoly(ctx, [[-4, shY], [2, shY], [-3, hipY + 7], [-10 + cw, hipY + 6]], DK(L.cape, 0.15)); }
  // tylne ramię (+ tarcza)
  const shoulder2 = [-3.2, shY + 1.2], backA = walking ? -sw * 0.5 : (P.atk != null && style === 'bow' ? 1.2 : -0.15);
  const pullX = style === 'bow' && P.atk != null ? 3.4 - arm.pull * 4 : null;
  const e2 = pullX != null ? [0.5, shY + 2] : [shoulder2[0] + Math.sin(backA) * 5, shoulder2[1] + Math.cos(backA) * 5];
  const h2 = pullX != null ? [pullX, shY + 1.5] : [e2[0] + Math.sin(backA + 0.2) * 4.6, e2[1] + Math.cos(backA + 0.2) * 4.6];
  const sleeve = bony ? sk : L.armor ? DK(met, 0.15) : DK(cl, 0.2);
  limb(ctx, ...shoulder2, ...e2, bony ? 1.2 : 2.4, DK(sleeve, 0.15)); limb(ctx, ...e2, ...h2, bony ? 1.1 : 2.1, DK(sleeve, 0.15)); circ(ctx, h2[0], h2[1], bony ? 0.9 : 1.2, DK(sk, 0.2));
  if (L.shield) { fillPoly(ctx, [[h2[0] - 4.5, h2[1] - 6], [h2[0] + 1.5, h2[1] - 6], [h2[0] + 1.5, h2[1] + 1], [h2[0] - 1.5, h2[1] + 5], [h2[0] - 4.5, h2[1] + 1]], L.shield);
    limb(ctx, h2[0] - 1.5, h2[1] - 5.5, h2[0] - 1.5, h2[1] + 4, 1, L.shieldMark || LT(L.shield, 0.35)); }
  // tułów
  if (bony) {
    limb(ctx, 0, hipY, 0.4, shY + 1, 1.4, sk);
    for (let r = 0; r < 3; r++) { ctx.strokeStyle = sk; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(0.4, shY + 3 + r * 2.4, 3.6 - r * 0.4, 1.1, 0, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke(); }
    oval(ctx, 0, hipY - 0.5, 3.4, 1.4, sk);
  } else {
    const bottom = L.robe ? 0 : hipY + 1.5, wB = L.robe ? 6 + (walking ? Math.abs(sw) : 0) : 4.6;
    fillPoly(ctx, [[-5, shY], [5, shY], [wB, bottom], [-wB, bottom]], cl);
    fillPoly(ctx, [[-5, shY], [-1, shY], [-1.5, bottom], [-wB, bottom]], DK(cl, 0.22));
    fillPoly(ctx, [[2.2, shY + 0.5], [4.6, shY + 0.5], [4.1, shY + 6], [2.6, shY + 6]], LT(cl));
    if (L.robe) { limb(ctx, -5.5, bottom - 0.5, 5.5, bottom - 0.5, 1, DK(cl, 0.4)); }
    if (L.armor) {
      fillPoly(ctx, [[-4.3, shY + 0.6], [4.3, shY + 0.6], [3.7, hipY - 1.6], [-3.7, hipY - 1.6]], met);
      fillPoly(ctx, [[-4.3, shY + 0.6], [-0.6, shY + 0.6], [-0.9, hipY - 1.6], [-3.7, hipY - 1.6]], DK(met, 0.22));
      limb(ctx, 2.6, shY + 1.8, 2.3, hipY - 3, 0.8, LT(met, 0.4));
      if (L.tabard) { fillPoly(ctx, [[-1.6, shY + 1], [1.6, shY + 1], [1.9, hipY + 3], [-1.9, hipY + 3]], L.tabard); if (L.cross) { limb(ctx, 0, shY + 2.5, 0, hipY, 0.9, L.cross); limb(ctx, -1.4, shY + 4.5, 1.4, shY + 4.5, 0.9, L.cross); } }
    }
    ctx.fillStyle = lea; ctx.fillRect(-4.6, hipY - 1.8, 9.2, 1.8); ctx.fillStyle = '#c8a050'; ctx.fillRect(0.6, hipY - 1.8, 1.4, 1.8);
  }
  // głowa
  const hx = 0.6, hy = hdY;
  if (L.longHair) fillPoly(ctx, [[hx - 4, hy - 2], [hx + 1, hy - 4], [hx - 1, hy + 7], [hx - 6, hy + 8]], L.longHair);
  if (bony || L.helm === 'skull') {
    circ(ctx, hx, hy, 3.8, sk); fillPoly(ctx, [[hx - 1, hy + 2], [hx + 3.6, hy + 1.5], [hx + 3, hy + 4.2], [hx - 0.5, hy + 4.4]], DK(sk, 0.1));
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(hx + 0.6, hy - 1.2, 1.6, 1.8); ctx.fillRect(hx + 2.6, hy - 1, 1, 1.6);
    if (L.eyes) { ctx.fillStyle = L.eyes; ctx.fillRect(hx + 1, hy - 0.8, 0.9, 0.9); }
  } else {
    circ(ctx, hx, hy, 3.9, sk); fillPoly(ctx, [[hx - 3.9, hy], [hx - 1, hy - 3.8], [hx - 1, hy + 3.9], [hx - 3, hy + 2.5]], DK(sk, 0.2));
    if (L.ears) fillPoly(ctx, [[hx - 1.5, hy - 1], [hx - 6.5, hy - 4.5], [hx - 2.5, hy + 1.5]], sk);
    ctx.fillStyle = L.eyes || '#1a1a1a'; ctx.fillRect(hx + 1.6, hy - 1, 1.3, 1.3);
    if (L.beard) fillPoly(ctx, [[hx - 1, hy + 1.5], [hx + 4, hy + 1.2], [hx + 2.5, hy + 6], [hx - 0.5, hy + 4.5]], L.beard);
    if (L.hair && !L.helm) fillPoly(ctx, [[hx - 4.1, hy + 1], [hx - 3.4, hy - 3.2], [hx + 0.5, hy - 4.6], [hx + 3.6, hy - 2.6], [hx + 1, hy - 2.2], [hx - 1.2, hy + 1.8]], L.hair);
    if (L.tusks) { ctx.fillStyle = '#f0ead8'; ctx.fillRect(hx + 2.4, hy + 1.8, 0.9, 1.6); }
  }
  const hm = L.helm;
  if (hm === 'helm' || hm === 'greathelm' || hm === 'horn') {
    const hc = L.helmCol || met;
    ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(hx, hy - 0.4, 4.4, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    fillPoly(ctx, [[hx - 4.4, hy - 0.4], [hx - 1, hy - 4.4], [hx - 1, hy - 0.4]], DK(hc, 0.2)); limb(ctx, hx + 0.5, hy - 4.2, hx + 3, hy - 3, 0.7, LT(hc, 0.4));
    if (hm === 'greathelm') { fillPoly(ctx, [[hx - 4.4, hy - 0.6], [hx + 4.4, hy - 0.6], [hx + 4.2, hy + 4], [hx - 4.2, hy + 4]], hc); ctx.fillStyle = '#1a1a22'; ctx.fillRect(hx + 0.8, hy, 3.4, 1); }
    else { ctx.fillStyle = hc; ctx.fillRect(hx + 2.2, hy - 1, 1, 3); }
    if (hm === 'horn') { fillPoly(ctx, [[hx - 2, hy - 3.5], [hx - 5, hy - 8.5], [hx - 3.8, hy - 3.2]], '#e8e0cc'); fillPoly(ctx, [[hx + 2, hy - 3.8], [hx + 4, hy - 9], [hx + 3.4, hy - 3]], '#d8d0bc'); }
    if (L.plume) { ctx.save(); ctx.translate(hx - 0.5, hy - 4.2); ctx.rotate(Math.sin(t * 3) * 0.1); fillPoly(ctx, [[0, 0], [-2, -4], [-6, -3], [-7, 0], [-2, 0.8]], L.plume); ctx.restore(); }
  } else if (hm === 'hood') {
    const hc = L.hoodCol || cl; fillPoly(ctx, [[hx - 4.6, hy + 3], [hx - 4.6, hy - 1.5], [hx - 2, hy - 5], [hx + 2.5, hy - 4.4], [hx + 4.4, hy - 1.5], [hx + 1.5, hy - 2.5], [hx + 0.5, hy + 3.5]], hc);
    fillPoly(ctx, [[hx - 4.6, hy + 3], [hx - 4.6, hy - 1.5], [hx - 2, hy - 5], [hx - 1.5, hy + 3]], DK(hc, 0.2));
  } else if (hm === 'cap') {
    const hc = L.helmCol || '#6a4a2a'; ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(hx, hy - 0.6, 4.1, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(hx - 4.4, hy - 1.2, 9, 1.2);
    if (L.feather) fillPoly(ctx, [[hx - 2, hy - 3.8], [hx - 7, hy - 7], [hx - 3, hy - 3]], L.feather);
  } else if (hm === 'crown') { fillPoly(ctx, [[hx - 3.4, hy - 3], [hx - 3.4, hy - 6], [hx - 1.7, hy - 4.5], [hx, hy - 6.5], [hx + 1.7, hy - 4.5], [hx + 3.4, hy - 6], [hx + 3.4, hy - 3]], '#f0c040'); }
  if (L.halo) { ctx.strokeStyle = L.halo; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(hx, hy - 6.5, 3.8, 1.2, 0, 0, TAU); ctx.stroke(); }
  // przednie ramię z bronią
  const sh = [3.4, shY + 1.2], a = arm.a, bend = style === 'bow' ? 0.05 : 0.45;
  const el = [sh[0] + Math.sin(a) * 5.2, sh[1] + Math.cos(a) * 5.2], hd = [el[0] + Math.sin(a + bend) * 4.8, el[1] + Math.cos(a + bend) * 4.8];
  const rest = style === 'thrust' ? 0.1 : style === 'cast' ? 0.05 : 0.4;
  const wAng = style === 'thrust' ? (P.atk != null ? lerp(0.1, 1.5, clamp((a - 0.5) / 1.1, 0, 1)) : rest) : rest + (a - 0.55);
  if (W !== 'none' && W !== 'bow') drawWeapon(ctx, L, W, hd[0], hd[1], wAng, 0);
  limb(ctx, ...sh, ...el, bony ? 1.2 : 2.5, sleeve); limb(ctx, ...el, ...hd, bony ? 1.1 : 2.2, sleeve);
  if (L.armor && !bony) circ(ctx, sh[0] - 0.3, sh[1], 2.4, met);
  circ(ctx, hd[0], hd[1], bony ? 0.9 : 1.3, sk);
  if (W === 'none' && !bony && L.claws) { limb(ctx, hd[0], hd[1], hd[0] + 2, hd[1] + 1.5, 0.6, '#e8e0cc'); limb(ctx, hd[0], hd[1], hd[0] + 2.2, hd[1] - 0.2, 0.6, '#e8e0cc'); }
  if (W === 'bow') drawWeapon(ctx, L, 'bow', hd[0], hd[1], 0, arm.pull);
  if (style === 'cast' && P.atk != null && P.atk > 0.3 && P.atk < 0.7) circ(ctx, hd[0] + Math.sin(wAng) * 18.5, hd[1] - Math.cos(wAng) * 18.5, 4, L.orb || '#f0d890');
  ctx.restore();
  if (!L.robe && !L.mounted) leg(1.8, sw * 3.6, false);
  if (L.robe && !L.mounted) { ctx.fillStyle = boot; ctx.fillRect(1 + sw * 1.5, -2.4, 3.6, 2.4); }
  ctx.restore();
}
// Czworonóg (koń, jednorożec, centaur, wilk, gryf): nogi w chodzie w parach po przekątnej
function quadLegs(ctx, xs, top, len, col, P, w) {
  const walking = P.walk != null, ph = walking ? P.walk * TAU : 0;
  xs.forEach(([x, p, far]) => {
    const swing = walking ? Math.sin(ph + p) * 3.2 : 0, lift = walking ? Math.max(0, Math.cos(ph + p)) * 1.8 : 0, c = far ? DK(col, 0.28) : DK(col, 0.08);
    const kx = x + swing * 0.4 + 0.8, ky = top + len * 0.5 - lift * 0.5;
    limb(ctx, x, top, kx, ky, w, c); limb(ctx, kx, ky, x + swing, -lift, w * 0.85, c);
    ctx.fillStyle = far ? '#1a140e' : '#2a2018'; ctx.fillRect(x + swing - w * 0.55, -lift - 1.2, w * 1.2, 1.4);
  });
}
function horse(c, x, b, dir, col = '#7a4a26', mane = '#2a1a0e', P = {}, o = {}) {
  c.save(); c.translate(x, b); c.scale(dir, 1); c.lineCap = 'round'; c.lineJoin = 'round';
  const t = P.t || 0, walking = P.walk != null, rear = o.rear || 0, dk = DK(col), lt = LT(col);
  c.translate(-7, -9); c.rotate(-rear); c.translate(7, 9);
  const legs = [[-8, 0, true], [7, Math.PI, true]]; quadLegs(c, legs, -9, 9, col, P, 2.4);
  const sway = Math.sin(t * 2.2 + (walking ? P.walk * TAU : 0)) * 1.2;
  c.strokeStyle = mane; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-11, -15); c.quadraticCurveTo(-16, -12 + sway, -14 + sway, -3); c.stroke();
  c.lineWidth = 1.2; c.beginPath(); c.moveTo(-11, -14); c.quadraticCurveTo(-14.5, -11, -12.5 + sway, -4); c.stroke();
  oval(c, 0, -13, 12, 6, col); oval(c, 0.5, -9.8, 10, 2.6, dk); oval(c, -1, -17, 8, 1.6, lt); oval(c, 8, -12.5, 5.2, 5.4, col); oval(c, -8, -12, 4.8, 5.6, col);
  if (o.barding) { fillPoly(c, [[-9, -18], [9, -18], [11, -8], [-11, -8]], o.barding); limb(c, -10, -8.5, 10, -8.5, 1.2, o.trim || '#e0b24a'); }
  if (!o.noHead) {
    fillPoly(c, [[6, -15], [11.5, -26], [16.5, -24.5], [12.5, -11]], col); fillPoly(c, [[6, -15], [11.5, -26], [10.5, -14]], dk);
    fillPoly(c, [[11.5, -27.5], [18, -25.5], [23, -20.5], [22.5, -18], [17.5, -18.5], [13.5, -22]], col);
    fillPoly(c, [[17.5, -18.5], [22.5, -18], [23, -20.5]], dk); fillPoly(c, [[13, -27], [14, -31], [15.8, -26.8]], col);
    circ(c, 17, -23.6, 0.9, '#140c06'); circ(c, 21.6, -19.6, 0.6, '#140c06');
    fillPoly(c, [[7, -16], [11, -27], [13.5, -27.5], [10, -17.5], [8.5, -12.5]], mane);
  }
  const legs2 = [[-6, Math.PI, false], [9, 0, false]]; quadLegs(c, legs2, -9, 9, col, P, 2.6);
  c.restore();
}
function unicorn(c, x, b, dir, col = '#f0ecf4', P = {}, o = {}) {
  horse(c, x, b, dir, col, '#c8c0e0', P, o);
  c.save(); c.translate(x, b); c.scale(dir, 1); c.translate(-7, -9); c.rotate(-(o.rear || 0)); c.translate(7, 9);
  fillPoly(c, [[15.5, -26.5], [23, -35], [17.5, -25]], '#f0d890'); limb(c, 17.5, -28, 19.5, -29.5, 0.6, '#c8a050'); limb(c, 19.5, -31, 21, -32.3, 0.6, '#c8a050'); c.restore();
}
function centaur(c, x, b, dir, col = '#8a5a30', P = {}, L = {}) {
  horse(c, x, b, dir, col, L.hair || '#4a2a14', P, { noHead: true });
  c.save(); c.translate(x + 7 * dir, b - 12); c.scale(dir, 1);
  drawHumanoid(c, { skin: L.skin || '#d8a878', cloth: L.vest || '#6a4424', leather: '#3a2410', weapon: 'bow', hair: L.hair || '#4a2a14', helm: L.helm, helmCol: L.helmCol, size: 0.8, mounted: true }, P);
  c.restore();
}
function drawWolfBody(ctx, L, P = {}) {
  const f = L.fur, t = P.t || 0, atk = P.atk, lunge = atk != null ? Math.sin(clamp(atk, 0, 1) * Math.PI) : 0, dk = DK(f), lt = LT(f);
  ctx.save(); ctx.translate(lunge * 4, 0); ctx.rotate(lunge * 0.12); ctx.lineCap = 'round';
  quadLegs(ctx, [[-7, 0, true], [6, Math.PI, true]], -6, 6, f, P, 1.9);
  const wag = Math.sin(t * 4) * 1.5; fillPoly(ctx, [[-9, -9], [-16, -12 + wag], [-17, -8 + wag], [-10, -6.5]], f); fillPoly(ctx, [[-15, -11 + wag], [-17.5, -10 + wag], [-17, -8 + wag]], lt);
  oval(ctx, 0, -8.5, 10, 4.4, f); oval(ctx, 0.5, -6.3, 8, 1.8, dk); oval(ctx, -1, -11.5, 7, 1.3, lt);
  const hy = -11 - lunge * -2; fillPoly(ctx, [[6, -12], [11, hy - 3], [15, hy - 2.5], [18.5, hy + 0.5], [17, hy + 2], [12, hy + 2.5], [7, -6]], f);
  fillPoly(ctx, [[10, hy - 2.5], [11, hy - 7], [13, hy - 3]], f); fillPoly(ctx, [[11, hy - 3], [11.4, hy - 5.5], [12.4, hy - 3]], dk);
  if (atk != null && lunge > 0.3) { fillPoly(ctx, [[14, hy + 1.5], [18.5, hy + 2.5], [15, hy + 4]], '#5a1a1a'); ctx.fillStyle = '#f0ead8'; ctx.fillRect(16, hy + 1.8, 0.8, 1); }
  circ(ctx, 13.3, hy - 1, 0.8, '#f0d060'); circ(ctx, 18.4, hy + 0.6, 0.7, '#1a1a1a');
  quadLegs(ctx, [[-5, Math.PI, false], [8, 0, false]], -6, 6, f, P, 2);
  ctx.restore();
}
// Skrzydło zaczepione w (0,0), zwrócone do tyłu i w górę; ang = uniesienie
function wing(ctx, ang, len, col, feather) {
  ctx.save(); ctx.rotate(-ang);
  fillPoly(ctx, [[0, 0], [-len * 0.35, -len * 0.55], [-len * 0.75, -len * 0.8], [-len, -len * 0.62], [-len * 0.82, -len * 0.4], [-len * 0.95, -len * 0.25], [-len * 0.6, -len * 0.08], [-len * 0.7, len * 0.08], [-len * 0.25, len * 0.12]], col);
  if (feather) { limb(ctx, -len * 0.3, -len * 0.35, -len * 0.8, -len * 0.62, 0.8, feather); limb(ctx, -len * 0.25, -len * 0.15, -len * 0.7, -len * 0.25, 0.8, feather); }
  ctx.restore();
}
const flapAngle = (P, base, amp, speed = 3) => base + (P.walk != null ? Math.sin(P.walk * TAU * 2) * amp * 2.2 : Math.sin((P.t || 0) * speed) * amp);
function griffin(c, x, b, dir, s = 1, body = '#c89a4a', P = {}) {
  c.save(); c.translate(x, b); c.scale(dir * s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  const atk = P.atk, rear = atk != null ? Math.sin(clamp(atk, 0, 1) * Math.PI) * 0.35 : 0, dk = DK(body), lt = LT(body);
  c.translate(-6, -6); c.rotate(-rear); c.translate(6, 6);
  c.save(); c.translate(1, -14); wing(c, flapAngle(P, -0.35, 0.18), 21, '#9a8664', '#6a5a40'); c.restore();
  quadLegs(c, [[-7, 0, true], [6, Math.PI, true]], -7, 7, body, P, 2.1);
  c.strokeStyle = body; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -9); c.quadraticCurveTo(-16, -8, -16, -2); c.stroke(); oval(c, -16, -2, 1.6, 2.2, dk);
  oval(c, -1, -9, 10.5, 5.5, body); oval(c, -0.5, -6.5, 8, 2, dk); oval(c, -2, -13, 7, 1.4, lt);
  oval(c, 6.5, -12, 5, 6, '#f0ead8'); oval(c, 5, -10, 3, 3.5, '#d8d0bc');
  circ(c, 10, -17, 4.6, '#f4f0e6'); oval(c, 8.5, -17.5, 2.6, 3.6, '#e0dccc');
  fillPoly(c, [[13.5, -18.5], [18.5, -16.5], [17, -14], [14, -15]], '#e0a030'); fillPoly(c, [[17, -15.5], [18.5, -16.5], [18, -13.5]], '#a86a1a');
  circ(c, 11.6, -18, 0.9, '#1a1a1a'); fillPoly(c, [[7, -20.5], [5, -24], [8.5, -21]], '#e8e4d8');
  c.save(); c.translate(0, -13); wing(c, flapAngle(P, -0.15, 0.2), 19, '#d8c8a0', '#9a8664'); c.restore();
  quadLegs(c, [[-5, Math.PI, false], [8, 0, false]], -7, 7, body, P, 2.2);
  if (atk != null && rear > 0.15) { limb(c, 9, -8, 13, -10, 1, '#e0a030'); }
  c.restore();
}
function phoenixBird(c, x, y, s, fx, P = {}) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
  const t = P.t || 0, fl = Math.sin(t * 7), wa = flapAngle(P, -0.2, 0.45, 5);
  for (let i = 0; i < 4; i++) { const w = Math.sin(t * 9 + i * 1.7) * 1.5; fillPoly(c, [[-2, 2], [-6 - i * 2 + w, 12 + i * 1.5], [-1 + i * 1.5, 7], [1, 3]], i % 2 ? '#ff7a2a' : '#ffb040'); }
  c.save(); c.translate(-1, -5); wing(c, wa, 17, '#d8401a', '#ff8a2a'); c.restore();
  oval(c, 0, -3, 4.5, 7, '#f8a030'); oval(c, 1, -1, 2.6, 4.5, '#ffd870');
  circ(c, 2, -11, 3.2, '#ffc050'); fillPoly(c, [[4.5, -11.5], [8, -10.5], [4.5, -9.5]], '#f0e0a0'); circ(c, 3, -11.7, 0.8, '#1a1a1a');
  fillPoly(c, [[0, -13.5], [-2 + fl, -18], [1, -14.5], [2.5 - fl, -17.5], [3, -13.5]], '#ff7a2a');
  c.save(); c.translate(0, -5); wing(c, wa * 0.8, 15, '#ff8a2a', '#ffd870'); c.restore();
  c.restore();
  if (fx) fx.glows.push([x, y - 6 * s, 34 * s, '#ffa040']);
}
function ghost(c, x, y, s, col = '#c8d8f0', P = {}, L = {}) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
  const t = P.t || 0, atk = P.atk, lunge = atk != null ? Math.sin(clamp(atk, 0, 1) * Math.PI) : 0, dk = DK(col, 0.25), lt = LT(col, 0.15);
  c.translate(lunge * 4, 0);
  const pts = [[-6, -8], [-6.5, 1]]; for (let i = 0; i <= 6; i++) pts.push([-6.5 + i * 2.2, 3 + Math.sin(t * 5 + i * 1.3) * 2 + (i % 2) * 2]); pts.push([7, 0], [6, -8]);
  c.fillStyle = col; c.beginPath(); c.moveTo(-6, -8); c.quadraticCurveTo(-5, -15, 1, -16); c.quadraticCurveTo(6, -14, 6, -8); pts.forEach(([a, b2]) => c.lineTo(a, b2)); c.closePath(); c.fill();
  fillPoly(c, [[-6, -8], [-2, -13], [-2, 2], [-6.5, 2]], dk); fillPoly(c, [[2, -12.5], [4.5, -11], [4, -6], [2.5, -6]], lt);
  if (L.longHair) fillPoly(c, [[-5, -11], [-10, -4 + Math.sin(t * 3) * 2], [-9, 2], [-5, -2]], L.longHair);
  oval(c, 2.2, -9.5, 2.6, 3, '#1a1a2a'); c.fillStyle = L.eyes || '#9af0ff'; c.fillRect(1.4, -10.4, 1, 1.2); c.fillRect(3.2, -10.4, 1, 1.2);
  limb(c, -5, -3, -7, 3 + Math.sin(t * 4) * 1.5, 1.2, dk);
  limb(c, 3, -4, 7 + lunge * 3, -2 - lunge * 2, 1.4, col);
  if (L.scythe) { limb(c, 8, 4, 8 + lunge * 2, -14, 1, '#4a3a2a'); fillPoly(c, [[8 + lunge * 2, -14], [15 + lunge * 2, -12], [9 + lunge * 2, -12.5]], '#c8ccd4'); }
  c.restore();
}
// Smok albo wywern (L.bony: kościsty wywern Kurhanu)
function drawDragon(ctx, L, P = {}) {
  const c = L.fur, dk = DK(c, 0.35), lt = LT(c, 0.25), t = P.t || 0, atk = P.atk, bony = L.bony;
  const lunge = atk != null ? Math.sin(clamp(atk, 0, 1) * Math.PI) : 0, jaw = atk != null ? lunge * 0.5 : 0.05;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bone = bony ? c : DK(c, 0.45);
  const wingD = (ang, len, col) => { ctx.save(); ctx.rotate(-ang);
    fillPoly(ctx, [[0, 0], [-len * 0.3, -len * 0.7], [-len * 0.55, -len], [-len * 0.62, -len * 0.55], [-len * 0.85, -len * 0.75], [-len * 0.9, -len * 0.35], [-len * 1.05, -len * 0.4], [-len * 0.7, -len * 0.05]], col);
    for (const [ex, ey] of [[-0.55, -1], [-0.85, -0.75], [-1.05, -0.4]]) limb(ctx, -len * 0.3, -len * 0.7, len * ex, len * ey, 0.9, bone);
    limb(ctx, 0, 0, -len * 0.3, -len * 0.7, 1.6, bone); ctx.restore(); };
  ctx.save(); ctx.translate(-2, -16); wingD(flapAngle(P, 0.4, 0.3, 2.5), 26, bony ? dk : DK(c, 0.3)); ctx.restore();
  const sw = Math.sin(t * 2) * 1.5; ctx.strokeStyle = c; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-9, -10); ctx.quadraticCurveTo(-20, -6 + sw, -27, -12 + sw); ctx.stroke();
  fillPoly(ctx, [[-27, -12 + sw], [-31, -17 + sw], [-29, -11 + sw], [-32, -8 + sw]], dk);
  quadLegs(ctx, [[-7, 0, true], [5, Math.PI, true]], -8, 8, c, P, 2.8);
  oval(ctx, 0, -12, 12, 6.5, c); if (!bony) oval(ctx, 1, -8.8, 9, 2.6, lt); oval(ctx, -1, -16.5, 8, 1.4, dk);
  for (let i = 0; i < 4; i++) fillPoly(ctx, [[-8 + i * 4, -17.6], [-6.5 + i * 4, -20.5], [-5 + i * 4, -17.8]], dk);
  if (bony) for (let i = 0; i < 4; i++) limb(ctx, -6 + i * 4, -16, -5 + i * 4, -8, 1.1, dk);
  ctx.save(); ctx.translate(lunge * 5, lunge * 3);
  ctx.strokeStyle = c; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(7, -15); ctx.quadraticCurveTo(12, -25, 16, -27); ctx.stroke();
  fillPoly(ctx, [[14, -30], [22, -28.5], [25, -26], [21, -25 + jaw * 2], [15, -24.5]], c);
  fillPoly(ctx, [[16, -25], [24, -24 + jaw * 6], [21, -22.5 + jaw * 6], [15.5, -23.5]], dk);
  if (jaw > 0.2) fillPoly(ctx, [[19, -25.5], [24, -25 + jaw * 3], [20, -23.5 + jaw * 3]], '#7a1a0a');
  fillPoly(ctx, [[15, -29.5], [11, -35], [16.5, -30]], L.horn || '#e8e0cc'); fillPoly(ctx, [[17.5, -30], [15.5, -35.5], [19, -30]], L.horn || '#e8e0cc');
  circ(ctx, 19.5, -28, 1, bony ? '#8af0b8' : '#f0d060');
  ctx.restore();
  quadLegs(ctx, [[-5, Math.PI, false], [7, 0, false]], -8, 8, c, P, 3);
  ctx.save(); ctx.translate(1, -15); wingD(flapAngle(P, 0.25, 0.32, 2.5), 22, bony ? c : c); ctx.restore();
}
// Drzewiec: pień z korą, ramiona-gałęzie, korona liści
function drawTreant(ctx, L, P = {}) {
  const s = L.size || 1, bark = L.fur || '#6a4a2a', leaf = L.leaves || '#4a8a3a', t = P.t || 0, dk = DK(bark, 0.35), lt = LT(bark, 0.2);
  ctx.save(); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const walking = P.walk != null, sw = walking ? Math.sin(P.walk * TAU) : 0, arm = attackArm('swing', P.atk), lean = arm.lean * 0.7 - (P.hurt ? 0.15 : 0);
  limb(ctx, -3, -6, -5 - sw * 2, 0, 3.2, dk); limb(ctx, 3, -6, 5 + sw * 2, 0, 3.4, bark);
  ctx.save(); ctx.translate(0, -6); ctx.rotate(lean); ctx.translate(0, 6);
  limb(ctx, -4, -20, -10, -14 + Math.sin(t * 2) * 1, 2.6, dk); limb(ctx, -10, -14, -12, -9, 1.6, dk);
  fillPoly(ctx, [[-5.5, -4], [5.5, -4], [5, -24], [-5, -24]], bark); fillPoly(ctx, [[-5.5, -4], [-1.5, -4], [-1.5, -24], [-5, -24]], dk);
  for (const gy of [-8, -13, -18]) limb(ctx, -3.5, gy, 3.5, gy - 1.5, 0.8, dk); limb(ctx, 3, -22, 3.5, -6, 0.8, lt);
  ctx.fillStyle = '#1a1206'; ctx.fillRect(1, -20, 1.6, 1.4); ctx.fillRect(-1.5, -20, 1.6, 1.4); circ(ctx, 1.8, -19.3, 0.5, '#f0d060');
  const leafC = [[-6, -27, 5.5], [1, -30, 6.5], [7, -26, 5], [-2, -24, 5], [4, -23, 4.5]];
  for (const [lx, ly, r] of leafC) circ(ctx, lx, ly + Math.sin(t * 1.5 + lx) * 0.4, r, DK(leaf, 0.15));
  for (const [lx, ly, r] of leafC) circ(ctx, lx - 1, ly - 1.2, r * 0.6, leaf);
  circ(ctx, 0, -32, 2.5, LT(leaf, 0.2));
  const a = arm.a, sh = [4, -20], el = [sh[0] + Math.sin(a) * 6, sh[1] + Math.cos(a) * 6], hd = [el[0] + Math.sin(a + 0.4) * 5.5, el[1] + Math.cos(a + 0.4) * 5.5];
  limb(ctx, ...sh, ...el, 2.8, bark); limb(ctx, ...el, ...hd, 2.2, bark); limb(ctx, ...hd, hd[0] + 2.5, hd[1] + 1, 1.1, bark); limb(ctx, ...hd, hd[0] + 1.5, hd[1] + 2.8, 1.1, bark);
  circ(ctx, el[0] - 1, el[1] - 2, 2.2, leaf);
  ctx.restore(); ctx.restore();
}
// --- machiny wojenne (stoją w miejscu; atak = odrzut balisty) ---
function drawBallista(ctx, L, P) {
  const w = L.wood, m = L.metal, rec = P.atk != null ? Math.sin(clamp(P.atk, 0, 1) * Math.PI) * 2.5 : 0;
  ctx.lineCap = 'round';
  for (const wx of [-7, 6]) { circ(ctx, wx, -3.5, 3.5, DK(w, 0.45)); circ(ctx, wx, -3.5, 1.2, m); }
  fillPoly(ctx, [[-11, -6], [10, -6], [8, -9], [-9, -9]], DK(w));
  limb(ctx, -2, -8, -4, -15, 2.2, w); limb(ctx, 2, -8, 3, -15, 2.2, w);
  ctx.save(); ctx.translate(-rec, -16); ctx.rotate(-0.12);
  fillPoly(ctx, [[-12, -1.5], [12, -1.5], [12, 1.5], [-12, 1.5]], w); ctx.fillStyle = LT(w); ctx.fillRect(-12, -1.5, 24, 1);
  ctx.strokeStyle = m; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(8, -11); ctx.quadraticCurveTo(11, 0, 8, 11); ctx.stroke();
  ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(8, -11); ctx.lineTo(-6 + rec * 2, 0); ctx.lineTo(8, 11); ctx.stroke();
  if (!(P.atk > 0.4)) { limb(ctx, -6, -0.2, 13, -0.2, 1.2, '#5a3a1a'); fillPoly(ctx, [[13, -1.8], [16.5, -0.2], [13, 1.4]], m); }
  ctx.restore();
}
function drawTent(ctx, L, P) {
  const c = L.cloth, sway = Math.sin((P.t || 0) * 2) * 0.6;
  fillPoly(ctx, [[-13, 0], [0, -24 + sway], [13, 0]], c); fillPoly(ctx, [[0, -24 + sway], [13, 0], [5, 0]], DK(c, 0.18));
  fillPoly(ctx, [[-3.5, 0], [0, -11], [3.5, 0]], '#3a2a1e');
  ctx.fillStyle = L.trim; ctx.fillRect(-1.5, -20, 3, 8); ctx.fillRect(-4, -17.5, 8, 3);
  limb(ctx, 0, -24 + sway, 0, -30, 1, '#5a3a1a'); fillPoly(ctx, [[0, -30], [6, -28.5 + sway], [0, -27]], L.trim);
}
function drawCart(ctx, L, P) {
  const w = L.wood;
  limb(ctx, -10, -8, -17, -3, 1.6, DK(w)); fillPoly(ctx, [[-10, -7], [11, -7], [12, -18], [-11, -18]], w);
  ctx.fillStyle = DK(w); ctx.fillRect(-10, -13, 21, 1.2);
  ctx.fillStyle = L.cloth; ctx.beginPath(); ctx.moveTo(-11, -18); ctx.quadraticCurveTo(0, -28, 12, -18); ctx.closePath(); ctx.fill();
  for (const ax of [-5, -1, 3, 7]) limb(ctx, ax, -18, ax + 1.5, -22.5, 1, '#5a3a1a');
  for (const wx of [-6, 7]) { circ(ctx, wx, -4, 4, DK(w, 0.45)); circ(ctx, wx, -4, 2.6, DK(w, 0.2)); circ(ctx, wx, -4, 1, '#9aa0a8'); }
}
// x, y = punkt na ziemi pod stworzeniem; s = skala, dir = 1 w prawo / -1 w lewo; P = poza (domyślnie spoczynek w chwili t)
function drawCreature(ctx, cid, x, y, s, dir, t, P) {
  const L = CREATURES[cid].look; P = P || { t };
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 3.5, 0, 0, TAU); ctx.fill();
  if (L.kind !== 'hum' && L.kind !== 'treant') ctx.scale(L.size || 1, L.size || 1);
  const hover = Math.sin((P.t || 0) * 2.5) * 1.2;
  switch (L.kind) {
    case 'wolf': drawWolfBody(ctx, L, P); break;
    case 'griffin': griffin(ctx, 0, 0, 1, 1, L.fur, P); break;
    case 'unicorn': unicorn(ctx, 0, 0, 1, L.fur, P, { rear: P.atk != null ? Math.sin(clamp(P.atk, 0, 1) * Math.PI) * 0.3 : 0 }); break;
    case 'centaur': centaur(ctx, 0, 0, 1, L.fur, P, L); break;
    case 'phoenix': phoenixBird(ctx, (P.atk != null ? Math.sin(clamp(P.atk, 0, 1) * Math.PI) * 5 : 0), -20 + hover, 1, null, P); break;
    case 'ghost': ghost(ctx, 0, -8 + hover, 1.3, L.fur, P, L); break;
    case 'dragon': drawDragon(ctx, L, P); break;
    case 'treant': drawTreant(ctx, L, P); break;
    case 'ballista': drawBallista(ctx, L, P); break;
    case 'tent': drawTent(ctx, L, P); break;
    case 'cart': drawCart(ctx, L, P); break;
    case 'rider': {
      const rear = P.atk != null ? Math.sin(clamp(P.atk, 0, 1) * Math.PI) * 0.12 : 0;
      horse(ctx, 0, 0, 1, L.horse, L.mane || '#2a1a0e', P, { rear, barding: L.barding, trim: L.trim });
      ctx.save(); ctx.translate(-7, -9); ctx.rotate(-rear); ctx.translate(7, 9); ctx.translate(-1, -11);
      drawHumanoid(ctx, { ...L, size: 0.82, mounted: true }, { ...P, walk: null }); ctx.restore(); break;
    }
    default: drawHumanoid(ctx, L, P);
  }
  ctx.restore();
}
function drawSkeleton(ctx, x, y, sc, t, dir, spear) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc * dir, sc); const ph = Math.sin(t * 7);
  ctx.strokeStyle = '#e0d8c4'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(-2 * ph, 0); ctx.moveTo(0, -6); ctx.lineTo(2 * ph, 0); ctx.moveTo(0, -6); ctx.lineTo(0, -13);
  ctx.moveTo(-2.5, -11); ctx.lineTo(2.5, -11); ctx.moveTo(-2.5, -8.5); ctx.lineTo(2.5, -8.5); ctx.moveTo(-1, -12); ctx.lineTo(-4, -7 + ph); ctx.moveTo(1, -12); ctx.lineTo(4, -7 - ph); ctx.stroke();
  circ(ctx, 0, -15.5, 2.6, '#e8e0cc'); ctx.fillStyle = '#1a1a22'; ctx.fillRect(-1.6, -16.4, 1.2, 1.2); ctx.fillRect(0.4, -16.4, 1.2, 1.2);
  if (spear) { ctx.strokeStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(4, -22); ctx.stroke(); }
  ctx.restore();
}

// --- bohater: postać na koniu (mapa) i portret (panel) z jednego opisu wyglądu -----------------
function drawHeroSprite(ctx, x, y, dir, col, t, moving, look = HERO_CLASSES.knight.look) {
  ctx.save(); ctx.translate(x, y + 4); ctx.scale(dir, 1);
  const bob = moving ? Math.sin(t * 22) * 1.2 : 0, hc = look.horse;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 9, 14, 4, 0, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = look.mane; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, -2 + bob); ctx.quadraticCurveTo(-15, 0, -13, 7); ctx.stroke();
  ctx.strokeStyle = shadeHex(hc, -0.4); ctx.lineWidth = 2.4;
  for (const [lx, ph] of [[-7, 0], [-4, Math.PI], [5, Math.PI], [8, 0]]) { const sw = moving ? Math.sin(t * 22 + ph) * 2.5 : 0; ctx.beginPath(); ctx.moveTo(lx, 1 + bob); ctx.lineTo(lx + sw, 9); ctx.stroke(); }
  ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(0, -1 + bob, 11.5, 5.8, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -4 + bob); ctx.lineTo(12, -13 + bob); ctx.lineTo(16, -11 + bob); ctx.lineTo(11, -1 + bob); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(16.5, -10 + bob, 4.6, 2.6, 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = look.mane; ctx.beginPath(); ctx.moveTo(11, -13 + bob); ctx.lineTo(7, -5 + bob); ctx.lineTo(9, -5 + bob); ctx.lineTo(13, -12 + bob); ctx.closePath(); ctx.fill();
  circ(ctx, 16, -11 + bob, 0.8, '#1a0e06');
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-6, -5 + bob); ctx.lineTo(4, -5 + bob); ctx.lineTo(5, 3 + bob); ctx.lineTo(-7, 3 + bob); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e0b24a'; ctx.lineWidth = 0.8; ctx.stroke();
  const ry = -6 + bob;
  ctx.fillStyle = '#3a3440'; ctx.fillRect(-1, ry, 2.5, 6);
  ctx.fillStyle = look.armor; rr(ctx, -4, ry - 11, 8, 11, 2); ctx.fill();
  ctx.fillStyle = col; ctx.fillRect(-3, ry - 8, 6, 7); ctx.fillStyle = '#e0b24a'; ctx.fillRect(-0.5, ry - 8, 1, 7);
  if (look.hood) {
    circ(ctx, 1, ry - 13.5, 3, look.skin);
    ctx.fillStyle = look.hood; ctx.beginPath(); ctx.moveTo(-4.5, ry - 9); ctx.quadraticCurveTo(-5.5, ry - 18, -2, ry - 20.5); ctx.quadraticCurveTo(3.5, ry - 20, 4.5, ry - 15.5);
    ctx.lineTo(1.5, ry - 16.5); ctx.lineTo(-0.5, ry - 11); ctx.closePath(); ctx.fill();
  } else {
    circ(ctx, 0, ry - 14, 3.6, look.helm); ctx.fillStyle = '#1a1a22'; ctx.fillRect(0.5, ry - 14.5, 3, 1.2);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-1, ry - 17); ctx.quadraticCurveTo(-6, ry - 21, -8, ry - 15); ctx.quadraticCurveTo(-4, ry - 17, -1, ry - 15); ctx.fill();
  }
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, ry + 2); ctx.lineTo(-5, ry - 26); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-5, ry - 26);
  for (let i = 1; i <= 6; i++) ctx.lineTo(-5 - i * 2, ry - 26 + Math.sin(t * 5 - i * 0.9) * 1.2 * i / 6);
  for (let i = 6; i >= 0; i--) ctx.lineTo(-5 - i * 2, ry - 19 + Math.sin(t * 5 - i * 0.9) * 1.2 * i / 6);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
// Popiersie 36×36 jednostek: ten sam hełm/kaptur, zbroja i kolor gracza co postać na mapie
function drawHeroBust(ctx, look, col) {
  ctx.fillStyle = shadeHex(col, -0.25); ctx.fillRect(0, 0, 36, 36);
  ctx.fillStyle = shadeHex(col, -0.5); ctx.beginPath(); ctx.moveTo(0, 36); ctx.lineTo(36, 10); ctx.lineTo(36, 36); ctx.closePath(); ctx.fill();
  ctx.fillStyle = look.armor; ctx.beginPath(); ctx.ellipse(18, 40, 16, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = col; ctx.fillRect(14, 30, 8, 6); ctx.fillStyle = '#e0b24a'; ctx.fillRect(17.5, 30, 1.5, 6);
  if (look.hood) {
    const dk = shadeHex(look.hood, -0.45);
    ctx.fillStyle = look.hood; ctx.beginPath(); ctx.moveTo(6, 33); ctx.quadraticCurveTo(4, 9, 18, 4); ctx.quadraticCurveTo(32, 9, 30, 33); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(18, 21, 8.5, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = look.skin; ctx.beginPath(); ctx.ellipse(18, 23.5, 6.2, 7.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = dk; ctx.fillRect(12, 14.5, 12, 4.5);
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(14.5, 21, 2.5, 2); ctx.fillRect(19, 21, 2.5, 2);
  } else {
    ctx.fillStyle = look.helm; ctx.beginPath(); ctx.arc(18, 19, 11, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.fillRect(7, 19, 22, 9);
    ctx.fillStyle = '#2a2e38'; ctx.fillRect(9, 20, 18, 4);
    ctx.fillStyle = shadeHex(look.helm, -0.25); ctx.fillRect(17, 11, 2, 17);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(18, 8); ctx.quadraticCurveTo(27, 1, 31, 10); ctx.quadraticCurveTo(24, 5, 18, 11); ctx.closePath(); ctx.fill();
  }
}
function drawFlag(ctx, px, py, len, hgt, t, col) {
  ctx.strokeStyle = '#0c0a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py + hgt + 14); ctx.lineTo(px, py - 2); ctx.stroke();
  const N = 8; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py);
  for (let i = 1; i <= N; i++) ctx.lineTo(px + len * i / N, py + Math.sin(t * 4 - i * 0.8) * 2 * i / N);
  for (let i = N; i >= 0; i--) ctx.lineTo(px + len * i / N, py + hgt + Math.sin(t * 4 - i * 0.8) * 2 * i / N);
  ctx.closePath(); ctx.fill();
}

// --- miasto na mapie przygody -------------------------------------------------------------------
// 3×2 pola, (x0, y0) = lewy górny róg, wejście pośrodku dolnego rzędu.
// Poziom umocnień jak w widoku miasta: 0 osada bez murów, 1 fort, 2 cytadela, 3 zamek.
// Premia do obrony oddziałów broniących miasta za mury: brak, Fort, Cytadela, Zamek
const TOWN_WALL_DEF = [0, 2, 4, 6];
const townLevel = t => hasB(t, 'castle') ? 3 : hasB(t, 'citadel') ? 2 : hasB(t, 'fort') ? 1 : 0;
// szczyty dachów, na których powiewają flagi właściciela [x, y] względem (x0, y0)
const TOWN_FLAG_POINTS = [[[48, -16]], [[13, -2], [83, -2]], [[13, -10], [83, -10]], [[13, -10], [83, -10], [48, -26]]];
function drawTownMap(ctx, x0, y0, fac = 'haven', lvl = 1) {
  const A = TOWN_ART[fac] || TOWN_ART.haven;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x0 + 48, y0 + 60, 44, 8, 0, 0, TAU); ctx.fill();
  if (lvl === 0) {
    for (const hx of [x0 + 6, x0 + 66]) { wallRect(ctx, A, hx, y0 + 34, 24, 24); roofArt(ctx, A, A.roof.util, hx, y0 + 34, 24, 14); winArt(ctx, A, hx + 9, y0 + 42, 6, 7, null); }
    ctx.fillStyle = shadeHex(A.wall[1], -0.4); for (let i = 0; i < 10; i++) ctx.fillRect(x0 + 3 + i * 10, y0 + 51, 2.5, 9); ctx.fillRect(x0 + 3, y0 + 54, 94, 2);
  } else {
    const tt = lvl >= 2 ? y0 + 8 : y0 + 16;
    wallRect(ctx, A, x0 + 8, y0 + 28, 80, 30); ctx.fillStyle = A.wall[0];
    for (let i = 0; i < 6; i++) ctx.fillRect(x0 + 10 + i * 14, y0 + 22, 8, 6);
    for (const tx of [x0 + 2, x0 + 72]) {
      wallRect(ctx, A, tx, tt, 22, y0 + 58 - tt); roofArt(ctx, A, A.roof.wall, tx, tt, 22, 18);
      winArt(ctx, A, tx + 8, tt + 14, 6, 8, null); if (lvl >= 2) winArt(ctx, A, tx + 8, tt + 30, 6, 8, null);
    }
  }
  const big = lvl >= 3, hx = big ? x0 + 30 : x0 + 34, hw = big ? 36 : 28, ht = big ? y0 + 2 : y0 + 8;
  wallRect(ctx, A, hx, ht, hw, (lvl === 0 ? y0 + 58 : y0 + 48) - ht); roofArt(ctx, A, A.roof.hall, hx, ht, hw, big ? 28 : 24);
  winArt(ctx, A, hx + hw / 2 - 4, ht + 10, 8, 10, null); if (big) for (const wx of [hx + 5, hx + hw - 11]) winArt(ctx, A, wx, ht + 22, 6, 9, null);
  doorArt(ctx, A, x0 + 40, y0 + 58, 16, 18);
}

// --- sprite'y (cache): mapa rysuje je w buforze pikselowym, interfejs przez drawSprite() -------
const obstacleSprite = (o, t, v) => sprite(`ob${o}_${t}_${v}`, 40, 38, 20, 26, p => drawObstacle(p, o, t, 0, 0, mulberry32(v * 7919 + o * 31 + t * 7)));
const shadowSprite = w => sprite(`sh${w}`, w + 2, 6, (w + 2) / 2, 3, p => { p.fillStyle = '#000000'; p.beginPath(); p.ellipse(0, 0, w, 4, 0, 0, TAU); p.fill(); }, null);
const resSprite = r => sprite(`res_${r}`, 16, 16, 8, 8, p => drawResIcon(p, r, 0, 0, 24));
const chestSprite = () => sprite('chest', 16, 16, 8, 9, p => drawChest(p, 0, 0, 0));
const mineSprite = k => sprite(`mine_${k}`, 36, 38, 2, 4, p => drawMine(p, { kind: k }, 0, 0, 0, null));
const creatureSprite = (cid, dir, i = 0) => sprite(`cr_${cid}_${dir}_${i}`, 30, 32, 15, 27, p => drawCreature(p, cid, 0, 0, 1, dir, i * TAU / 4 / 2.4));
// Sprite bitewny: ta sama postać w podwójnej rozdzielczości (1 piksel = 1 jednostka), w pozie i klatce animacji.
// Na ekranie rysowany z k = 1, czyli z tą samą wielkością piksela co mapa (2 px logiczne).
const BATTLE_FRAMES = { idle: 4, walk: 6, attack: 7, hurt: 1, dead: 1 };
function battleSprite(cid, dir, pose, i = 0) {
  return sprite(`bs_${cid}_${dir}_${pose}_${i}`, 76, 88, 38, 72, p => {
    const n = BATTLE_FRAMES[pose];
    const P = pose === 'idle' ? { t: i / n * TAU / 2.4 } : pose === 'walk' ? { t: i * 0.2, walk: i / n } : pose === 'attack' ? { t: 0, atk: i / (n - 1) } : pose === 'hurt' ? { t: 0, hurt: true } : { t: 0 };
    if (pose === 'dead') { p.translate(0, -3); p.rotate(-Math.PI / 2 * 0.9 * dir); p.scale(0.85, 0.85); }
    drawCreature(p, cid, 0, 0, 1, dir, P.t, P);
  }, OUTLINE, 1);
}
// Poległy: ciemniejsza kopia leżącej postaci (zostaje na polu bitwy)
function corpseSprite(cid, dir) {
  const s = battleSprite(cid, dir, 'dead');
  if (!s.dark) { const g = s.c._ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(28,20,18,.55)'; g.fillRect(0, 0, s.c.width, s.c.height); g.globalCompositeOperation = 'source-over'; s.dark = true; }
  return s;
}
// Biała albo barwna sylwetka sprite'a (błysk trafienia, poświata czaru)
function tintSprite(s, col) {
  s.tints = s.tints || {}; if (s.tints[col]) return s.tints[col];
  const c = document.createElement('canvas'); c.width = s.c.width; c.height = s.c.height; const g = c.getContext('2d');
  g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return (s.tints[col] = { c, ax: s.ax, ay: s.ay });
}
function heroSprite(h, col) {
  const moving = !!h.anim, fr = Math.floor(G.time * (moving ? 12 : 4)) % 4, tk = moving ? fr * TAU / 88 : fr * TAU / 20;
  return sprite(`hero_${h.cls}_${col}_${h.dir}_${moving ? 1 : 0}_${fr}`, 26, 26, 13, 17, p => drawHeroSprite(p, 0, 0, h.dir, col, tk, moving, heroClass(h).look));
}
const bustSprite = (h, col) => sprite(`bust_${h.cls}_${col}`, 18, 18, 0, 0, p => drawHeroBust(p, heroClass(h).look, col), null);
function flagSprite(col, len, hgt) {
  const fr = Math.floor(G.time * 6) % 4;
  return sprite(`fl_${col}_${len}_${fr}`, Math.ceil(len / 2) + 6, Math.ceil((hgt + 18) / 2) + 4, 2, 3, p => {
    p.fillStyle = '#2a1a0e'; p.fillRect(0, -2, 2, hgt + 16);
    const N = 6, tk = fr * TAU / 4; p.fillStyle = col; p.beginPath(); p.moveTo(2, 0);
    for (let i = 1; i <= N; i++) p.lineTo(2 + len * i / N, Math.sin(tk - i * 0.9) * 2 * i / N);
    for (let i = N; i >= 0; i--) p.lineTo(2 + len * i / N, hgt + Math.sin(tk - i * 0.9) * 2 * i / N);
    p.closePath(); p.fill();
  });
}
function markSprite(col, dx, dy) {
  return sprite(`mk_${col}_${dx}_${dy}`, 16, 16, 8, 8, p => {
    p.fillStyle = col; p.strokeStyle = col;
    if (dx === 'x') { p.lineCap = 'round'; p.lineWidth = 4; p.beginPath(); p.moveTo(-6, -6); p.lineTo(6, 6); p.moveTo(6, -6); p.lineTo(-6, 6); p.stroke(); }
    else { p.rotate(Math.atan2(dy, dx)); p.beginPath(); [[-8, -3], [1, -3], [1, -7], [9, 0], [1, 7], [1, 3], [-8, 3]].forEach(([a, c], i) => i ? p.lineTo(a, c) : p.moveTo(a, c)); p.closePath(); p.fill(); }
  });
}
const townSprite = (fac, lvl) => sprite(`town_${fac}_${lvl}`, 56, 56, 4, 20, p => drawTownMap(p, 0, 0, fac, lvl));
// Miniatura miasta do list: ten sam rysunek w mniejszej skali (1 piksel = 5 jednostek), z flagami właściciela
const townIconSprite = (fac, lvl, col) => sprite(`townico_${fac}_${lvl}_${col}`, 20, 20, 1, 7, p => {
  drawTownMap(p, 0, 0, fac, lvl);
  for (const [fx, fy] of TOWN_FLAG_POINTS[lvl]) { p.fillStyle = '#2a1a0e'; p.fillRect(fx - 2, fy - 22, 5, 22); p.fillStyle = col; p.fillRect(fx + 3, fy - 22, 18, 11); }
}, OUTLINE, 0.19);

// --- armie w interfejsie ---------------------------------------------------------------------
const unitStats = c => `atak ${c.att}, obrona ${c.def}, obrażenia ${c.dmin}–${c.dmax}, życie ${c.hp}, szybkość ${c.spd}`;
const abilText = c => (c.abil || []).map(a => `${ABILITIES[a].name} (${ABILITIES[a].desc})`).join('; ');
const machineInfo = id => { const c = CREATURES[id]; return `${c.name}: ${c.desc}. Życie ${c.hp}, cena ${c.cost.gold} złota.`; };
const stackInfo = s => { if (MACHINES.includes(s.cid)) return machineInfo(s.cid); const c = CREATURES[s.cid], ab = abilText(c); return `${c.plural}: ${s.n}. Poziom ${c.level}, ${unitStats(c)}${c.shots ? `, strzały ${c.shots}` : ''}.${ab ? ` Zdolności: ${ab}.` : ''}`; };
// Rząd 7 miejsc armii z tymi samymi sprite'ami co na mapie. Zwraca prostokąty miejsc (do klikania i dymków).
function drawArmyRow(ctx, army, x, y, o = {}) {
  const w = o.w || 62, h = o.h || 50, gap = o.gap || 6, rects = [];
  army.forEach((s, i) => {
    const sx = x + i * (w + gap); rects.push({ x: sx, y, w, h, i });
    ctx.fillStyle = o.light ? 'rgba(90,55,20,.14)' : 'rgba(0,0,0,.35)'; rr(ctx, sx, y, w, h, 3); ctx.fill();
    const sel = o.sel === i; ctx.strokeStyle = sel ? '#ffd970' : (o.light ? 'rgba(90,55,20,.45)' : '#6a5a3a'); ctx.lineWidth = sel ? 2.4 : 1; ctx.stroke();
    if (!s) return;
    ctx.save(); rr(ctx, sx + 1, y + 1, w - 2, h - 2, 3); ctx.clip(); drawSprite(ctx, creatureSprite(s.cid, 1), sx + w / 2, y + h - 7, 1); ctx.restore();
    const n = String(s.n); ctx.save(); ctx.font = font(13, 700, 'body'); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 3; ctx.strokeStyle = '#120a03'; ctx.strokeText(n, sx + w - 4, y + h - 4); ctx.fillStyle = '#f3e2b0'; ctx.fillText(n, sx + w - 4, y + h - 4); ctx.restore();
  });
  return rects;
}
const hitRect = (rects, x, y) => rects.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || null;
const iconMinus = (ctx, cx, cy, col) => { ctx.fillStyle = col; ctx.fillRect(cx - 7, cy - 1.5, 14, 3); };
const iconPlus = (ctx, cx, cy, col) => { ctx.fillStyle = col; ctx.fillRect(cx - 7, cy - 1.5, 14, 3); ctx.fillRect(cx - 1.5, cy - 7, 3, 14); };
// Werbunek z jednego poziomu siedliska (zwykła i ulepszona jednostka mają wspólną pulę)
function showRecruit(st, t, L, onDone, backToList) {
  const units = dwellingUnits(t, L), x = 170, y = 100, w = 460, hh = 390, F = factionOf(t.faction);
  let cid = units[units.length - 1];
  const maxN = () => Math.min(t.avail[L] || 0, maxAffordable(st, unitCost(cid)));
  let n = Math.min(1, maxN());
  const set = v => { n = clamp(v, 0, maxN()); };
  const unitBtns = units.map((u, k) => new Button(x + w / 2 - units.length * 76 + k * 152 + 4, y + 52, 144, 32, CREATURES[u].name, () => { cid = u; set(n); }, { selected: () => cid === u, size: 15 }));
  const qy = y + 262;
  const bMinus = new Button(x + 150, qy, 36, 30, 'Mniej', () => set(n - 1), { icon: iconMinus, key: '-' });
  const bPlus = new Button(x + 284, qy, 36, 30, 'Więcej', () => set(n + 1), { icon: iconPlus, key: '+' });
  const bMax = new Button(x + 330, qy, 80, 30, 'Maks', () => set(maxN()), { size: 14, key: 'm' });
  const bBuy = new Button(x + (backToList ? 30 : 90), y + hh - 56, 130, 40, 'Rekrutuj', () => {
    const err = recruit(st, t, L, cid, n); if (err) { onDone(err); return; }
    G.modal = null; onDone(`Zwerbowano: ${CREATURES[cid].name} × ${n}`);
  }, { key: 'enter', size: 17 });
  const bClose = new Button(x + (backToList ? 300 : 240), y + hh - 56, 130, 40, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 17 });
  const btns = [...(units.length > 1 ? unitBtns : []), bMinus, bPlus, bMax, bBuy, bClose];
  if (backToList) btns.push(new Button(x + 165, y + hh - 56, 130, 40, 'Lista', () => backToList(), { size: 17 }));
  G.modal = {
    buttons: btns,
    rightInfo(px, py) { return px < x + 150 && py > y + 100 && py < y + 250 ? stackInfo({ cid, n: t.avail[L] || 0 }) : null; },
    draw(ctx) {
      const c = CREATURES[cid], cost = unitCost(cid), total = {}; for (const r of RESOURCES) if (cost[r.id]) total[r.id] = cost[r.id] * n;
      bBuy.disabled = n <= 0; bMinus.disabled = n <= 0; bPlus.disabled = bMax.disabled = n >= maxN();
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, hh);
      text(ctx, F.dw['dw' + L + (cid === units[0] ? '' : 'u')][0], W / 2, y + 32, { size: 24, align: 'center', color: '#3a1e08', fam: 'title' });
      if (units.length === 1) text(ctx, c.name, W / 2, y + 68, { size: 17, align: 'center', color: '#5a3814', fam: 'title' });
      ctx.fillStyle = 'rgba(90,55,20,.12)'; rr(ctx, x + 24, y + 100, 110, 140, 4); ctx.fill();
      drawSprite(ctx, creatureSprite(cid, 1), x + 79, y + 218, 2);
      const sx = x + 152;
      [`Poziom ${c.level} · szybkość ${c.spd}`, `Atak ${c.att} · obrona ${c.def}`, `Obrażenia ${c.dmin}–${c.dmax} · życie ${c.hp}`, `Przyrost: ${weeklyGrowth(t, L)} na tydzień`]
        .forEach((l, i) => text(ctx, l, sx, y + 112 + i * 24, { size: 15, weight: 500, color: '#2a1606' }));
      text(ctx, 'Koszt jednostki:', sx, y + 212, { size: 14, weight: 500, color: '#5a3814' }); drawCost(ctx, cost, sx + 112, y + 212, { size: 18 });
      text(ctx, `Dostępne: ${t.avail[L] || 0}`, sx, y + 238, { size: 15, weight: 700, color: '#3a1e08' });
      const ab = (c.abil || []).map(a => ABILITIES[a].name).join(', ') + (c.shots ? `${c.abil && c.abil.length ? ', ' : ''}strzelec (${c.shots})` : '');
      if (ab) text(ctx, ab, W / 2, y + 90, { size: 13, italic: true, weight: 500, align: 'center', color: '#6a4418' });
      text(ctx, 'Liczba:', x + 90, qy + 16, { size: 15, weight: 500, color: '#5a3814' });
      ctx.fillStyle = 'rgba(255,248,220,.6)'; rr(ctx, x + 192, qy, 86, 30, 3); ctx.fill(); ctx.strokeStyle = 'rgba(90,55,20,.5)'; ctx.lineWidth = 1; ctx.stroke();
      text(ctx, String(n), x + 235, qy + 16, { size: 18, align: 'center', color: '#2a1606', fam: 'title' });
      text(ctx, 'Razem:', x + 90, y + 316, { size: 15, weight: 500, color: '#5a3814' });
      if (n > 0) drawCost(ctx, total, x + 150, y + 316, { size: 20, have: human(st).resources });
      else text(ctx, maxN() === 0 ? ((t.avail[L] || 0) === 0 ? 'brak jednostek w siedlisku' : 'brakuje zasobów') : '—', x + 150, y + 316, { size: 14, italic: true, weight: 500, color: '#8a4a2a' });
      btns.forEach(b => b.draw(ctx));
    },
  };
}
// Przegląd wszystkich siedlisk miasta
// Okno rynku: po lewej, co oddajesz, po prawej, co dostajesz; liczba transakcji jak przy werbunku
function showMarket(st, owner, onDone) {
  const x = 150, y = 70, w = 500, hh = 450, R = playerOf(st, owner).resources, col = (i, right) => x + (right ? 282 : 28) + (i % 4) * 48, row = (i) => y + 90 + Math.floor(i / 4) * 60;
  let from = 'gold', to = 'wood', n = 0;
  const lot = () => marketLot(st, owner, from, to), max = () => marketMax(st, owner, from, to), set = v => { n = clamp(v, 0, max()); };
  const pick = (right) => RESOURCES.map((r, i) => new Button(col(i, right), row(i), 44, 44, r.name, () => { if (right) to = r.id; else from = r.id; set(Math.min(n, max()) || (max() ? 1 : 0)); },
    { selected: () => (right ? to : from) === r.id, icon: (ctx, cx, cy) => resIcon(ctx, r.id, cx, cy, 26), tip: `${r.name}: masz ${R[r.id]}.` }));
  const qy = y + 300;
  const bMinus = new Button(x + 150, qy, 36, 30, 'Mniej', () => set(n - 1), { icon: iconMinus, key: '-' });
  const bPlus = new Button(x + 284, qy, 36, 30, 'Więcej', () => set(n + 1), { icon: iconPlus, key: '+' });
  const bMax = new Button(x + 330, qy, 80, 30, 'Maks', () => set(max()), { size: 14, key: 'm' });
  const bTrade = new Button(x + 90, y + hh - 56, 130, 40, 'Handluj', () => {
    const L = lot(), err = trade(st, owner, from, to, n); if (err) { onDone(err); return; }
    onDone(`Wymiana: ${resName(from)} ${L.give * n} → ${resName(to)} ${L.get * n}`); set(Math.min(n, max()));
  }, { key: 'enter', size: 17 });
  const bClose = new Button(x + 280, y + hh - 56, 130, 40, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 17 });
  const btns = [...pick(false), ...pick(true), bMinus, bPlus, bMax, bTrade, bClose];
  G.modal = {
    buttons: btns, market: { get from() { return from; }, get to() { return to; }, get n() { return n; }, set: v => set(v) }, // podgląd w testach
    draw(ctx) {
      const L = lot(), m = marketCount(st, owner);
      bTrade.disabled = !L || n <= 0; bMinus.disabled = n <= 0; bPlus.disabled = bMax.disabled = n >= max();
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, hh);
      text(ctx, 'Rynek', W / 2, y + 32, { size: 24, align: 'center', color: '#3a1e08', fam: 'title' });
      text(ctx, `Rynków w królestwie: ${m}${m < 4 ? ' (kolejne poprawiają kurs)' : ''}`, W / 2, y + 56, { size: 14, italic: true, weight: 500, align: 'center', color: '#6a4418' });
      text(ctx, 'Oddajesz', col(0, false), y + 80, { size: 15, color: '#3a1e08', fam: 'title' }); text(ctx, 'Dostajesz', col(0, true), y + 80, { size: 15, color: '#3a1e08', fam: 'title' });
      btns.forEach(b => b.draw(ctx));
      for (const right of [false, true]) RESOURCES.forEach((r, i) => text(ctx, String(R[r.id]), col(i, right) + 22, row(i) + 52, { size: 12, align: 'center', weight: 700, color: '#3a1e08' }));
      const rate = !L ? (from === to ? 'Wybierz dwa różne surowce.' : 'Brak rynku.') : `Kurs: ${resName(from)} ${L.give} → ${resName(to)} ${L.get}`;
      text(ctx, rate, W / 2, y + 232, { size: 16, align: 'center', weight: 700, color: '#2a1606' });
      text(ctx, 'Wymian:', x + 90, qy + 16, { size: 15, weight: 500, color: '#5a3814' });
      ctx.fillStyle = 'rgba(255,248,220,.6)'; rr(ctx, x + 192, qy, 86, 30, 3); ctx.fill(); ctx.strokeStyle = 'rgba(90,55,20,.5)'; ctx.lineWidth = 1; ctx.stroke();
      text(ctx, String(n), x + 235, qy + 16, { size: 18, align: 'center', color: '#2a1606', fam: 'title' });
      if (L && n > 0) text(ctx, `Oddasz ${L.give * n}, dostaniesz ${L.get * n}`, W / 2, qy + 52, { size: 15, align: 'center', weight: 500, color: '#5a3814' });
      else if (L && !max()) text(ctx, `Za mało na jedną wymianę (${resName(from)}: ${R[from]})`, W / 2, qy + 52, { size: 14, align: 'center', italic: true, weight: 500, color: '#8a4a2a' });
    },
  };
}
// Spotkanie dwóch bohaterów gracza (stoją obok siebie): wymiana oddziałów i artefaktów z plecaka.
// Oddział: kliknij go, potem miejsce w dowolnej z dwóch armii (przeniesienie, połączenie albo zamiana).
function showMeeting(st, a, b, onMsg) {
  const x = 60, y = 70, w = 680, hh = 460, heroes = [a, b], rows = [y + 96, y + 290], armies = [a.army, b.army];
  let sel = null, msg = ''; const say = m => { msg = m; if (onMsg) onMsg(m); };
  let armyRects = [[], []], bagRects = [[], []];
  const bClose = new Button(x + w / 2 - 65, y + hh - 54, 130, 40, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 17 });
  const armyAt = (px, py) => { for (let k = 0; k < 2; k++) { const r = hitRect(armyRects[k], px, py); if (r) return { k, i: r.i }; } return null; };
  const bagAt = (px, py) => { for (let k = 0; k < 2; k++) { const r = hitRect(bagRects[k], px, py); if (r) return { k, i: r.i }; } return null; };
  G.modal = {
    buttons: [bClose], meeting: { a, b, get sel() { return sel; } }, // podgląd w testach
    onClick(px, py) {
      const s = armyAt(px, py), g = bagAt(px, py);
      if (s) {
        if (!sel) { if (armies[s.k][s.i]) { sel = s; msg = ''; } return; }
        const err = armyMove(armies[sel.k], sel.i, armies[s.k], s.i, armies); sel = null; if (err) say(err); return;
      }
      if (g) { const from = heroes[g.k], to = heroes[1 - g.k], [id] = from.bag.splice(g.i, 1); to.bag.push(id); say(`${ARTIFACTS[id].name} → ${to.name}`); return; }
      sel = null;
    },
    rightInfo(px, py) {
      const s = armyAt(px, py); if (s) return armies[s.k][s.i] ? stackInfo(armies[s.k][s.i]) : 'Wolne miejsce.';
      const g = bagAt(px, py); if (g) return `${artInfo(heroes[g.k].bag[g.i])} Kliknij, aby oddać drugiemu bohaterowi.`;
      return null;
    },
    draw(ctx) {
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, hh);
      text(ctx, 'Spotkanie bohaterów', W / 2, y + 30, { size: 22, align: 'center', color: '#3a1e08', fam: 'title' });
      text(ctx, msg || 'Kliknij oddział, a potem miejsce, aby go przenieść. Kliknij artefakt, aby go oddać.', W / 2, y + 56, { size: 14, italic: true, weight: 500, align: 'center', color: msg ? '#8a3a1a' : '#6a4418' });
      heroes.forEach((h, k) => {
        const ry = rows[k]; drawHeroPortrait(ctx, x + 24, ry - 26, h, ownerColor(st, h.owner));
        text(ctx, heroTitle(h), x + 68, ry - 12, { size: 16, color: '#3a1e08', fam: 'title' });
        text(ctx, `Armia: siła ${armyStrength(h)}`, x + w - 24, ry - 12, { size: 13, align: 'right', weight: 500, color: '#5a3814' });
        armyRects[k] = drawArmyRow(ctx, h.army, x + 24, ry + 16, { light: true, sel: sel && sel.k === k ? sel.i : null, w: 84, gap: 6 });
        text(ctx, h.bag.length ? 'Plecak:' : 'Plecak pusty', x + 24, ry + 92, { size: 13, weight: 500, color: '#5a3814' });
        bagRects[k] = h.bag.slice(0, 12).map((id, i) => { const bx = x + 90 + i * 46; drawSprite(ctx, artSprite(id), bx + 20, ry + 92, 1); return { x: bx, y: ry + 72, w: 40, h: 40, i }; });
      });
      bClose.draw(ctx);
    },
  };
}
function showRecruitList(st, t, onDone) {
  const levels = dwellingLevels(t), F = factionOf(t.faction), w = 500, hh = 120 + levels.length * 52 + 60, x = (W - w) / 2, y = Math.max(20, (H - hh) / 2);
  const open = L => showRecruit(st, t, L, onDone, () => showRecruitList(st, t, onDone));
  const rowBtns = levels.map((L, i) => new Button(x + w - 118, y + 84 + i * 52 + 8, 92, 32, 'Werbuj', () => open(L), { size: 15, key: String(L) }));
  const close = new Button(W / 2 - 70, y + hh - 56, 140, 40, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 17 });
  G.modal = {
    buttons: [...rowBtns, close],
    draw(ctx) {
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, hh);
      text(ctx, `Rekrutacja: ${t.name}`, W / 2, y + 40, { size: 24, align: 'center', color: '#3a1e08', fam: 'title' }); divider(ctx, x + 30, x + w - 30, y + 64);
      levels.forEach((L, i) => {
        const ry = y + 84 + i * 52, units = dwellingUnits(t, L), best = units[units.length - 1];
        ctx.fillStyle = 'rgba(90,55,20,.12)'; rr(ctx, x + 24, ry, w - 48, 48, 4); ctx.fill();
        ctx.save(); rr(ctx, x + 26, ry + 1, 50, 46, 3); ctx.clip(); drawSprite(ctx, creatureSprite(best, 1), x + 51, ry + 42, 1); ctx.restore();
        text(ctx, units.map(u => CREATURES[u].name).join(' / '), x + 86, ry + 17, { size: 15, color: '#2a1606', fam: 'title' });
        text(ctx, `${F.dw['dw' + L + (units.length > 1 ? 'u' : '')][0]} · dostępne ${t.avail[L] || 0}, przyrost ${weeklyGrowth(t, L, st)}/tydz.`, x + 86, ry + 36, { size: 13, weight: 500, color: '#5a3814' });
      });
      rowBtns.forEach(b => { b.disabled = false; b.draw(ctx); }); close.draw(ctx);
    },
  };
}

// --- artefakty: jeden rysunek (24×24 jednostki wokół 0,0) dla mapy, okien i ekranu bohatera ---
function drawArtifact(c, id) {
  const A = ARTIFACTS[id], col = A.col, gem = A.gem, dk = shadeHex(col, -0.4), lt = shadeHex(col, 0.35);
  const poly = (pts, f) => { c.fillStyle = f; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  switch (A.icon) {
    case 'sword':
      poly([[-9, 9], [5, -5], [8, -8], [7, -4], [-7, 10]], col); c.strokeStyle = lt; c.lineWidth = 1; c.beginPath(); c.moveTo(-7, 8); c.lineTo(6, -6); c.stroke();
      c.strokeStyle = '#6a4424'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-8, 3); c.lineTo(-3, 8); c.stroke();
      c.strokeStyle = '#3a2410'; c.beginPath(); c.moveTo(-6, 6); c.lineTo(-10, 10); c.stroke(); circ(c, -10.5, 10.5, 1.8, gem); break;
    case 'axe':
      c.strokeStyle = '#6a4424'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-8, 10); c.lineTo(5, -7); c.stroke();
      poly([[1, -9], [9, -11], [11, -3], [6, 2], [3, -3]], col); poly([[3, -8], [8, -9], [9, -4]], lt); break;
    case 'shield':
      poly([[-9, -9], [9, -9], [9, 0], [0, 11], [-9, 0]], col); poly([[-9, -9], [0, -9], [0, 11], [-9, 0]], shadeHex(col, -0.15));
      c.strokeStyle = gem; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -7); c.lineTo(0, 7); c.moveTo(-6, -2); c.lineTo(6, -2); c.stroke(); break;
    case 'helm':
      c.fillStyle = col; c.beginPath(); c.arc(0, 1, 9, Math.PI, 0); c.lineTo(9, 8); c.lineTo(-9, 8); c.closePath(); c.fill();
      c.fillStyle = '#1a1a22'; c.fillRect(-7, 1, 14, 3); c.fillStyle = gem; c.fillRect(-1, -8, 2, 16); c.fillStyle = lt; c.fillRect(-6, -4, 3, 3); break;
    case 'crown':
      poly([[-10, 7], [-10, -5], [-5, 0], [0, -9], [5, 0], [10, -5], [10, 7]], col); c.fillStyle = dk; c.fillRect(-10, 4, 20, 3);
      circ(c, 0, -2, 2, gem); circ(c, -6, 3, 1.5, gem); circ(c, 6, 3, 1.5, gem); break;
    case 'amulet':
      c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -4, 8, Math.PI * 0.1, Math.PI * 0.9, true); c.stroke();
      poly([[0, 1], [6, 6], [0, 12], [-6, 6]], col); poly([[0, 3], [4, 6], [0, 10], [-4, 6]], gem); break;
    case 'ring':
      c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 3, 7, 6, 0, 0, TAU); c.stroke();
      poly([[0, -9], [4, -5], [0, -1], [-4, -5]], gem); c.strokeStyle = lt; c.lineWidth = 1; c.beginPath(); c.arc(0, 3, 7, Math.PI * 1.1, Math.PI * 1.4); c.stroke(); break;
    case 'cloak':
      poly([[-5, -9], [5, -9], [10, 10], [-10, 10]], col); poly([[-5, -9], [0, -9], [-3, 10], [-10, 10]], shadeHex(col, -0.2));
      c.fillStyle = gem; c.fillRect(-6, -10, 12, 3); circ(c, 0, -8.5, 1.8, '#f0c040'); break;
    case 'armor':
      poly([[-10, -7], [-4, -9], [4, -9], [10, -7], [8, 1], [7, 10], [-7, 10], [-8, 1]], col);
      c.strokeStyle = dk; c.lineWidth = 1; for (let yy = -5; yy <= 8; yy += 3) { c.beginPath(); c.moveTo(-7, yy); c.lineTo(7, yy); c.stroke(); }
      poly([[-3, -9], [3, -9], [0, -5]], gem); break;
    case 'boots':
      poly([[-8, -9], [-1, -9], [-1, 4], [9, 5], [9, 10], [-8, 10]], col); c.fillStyle = dk; c.fillRect(-8, 8, 17, 2.5); c.fillStyle = gem; c.fillRect(-8, -9, 7, 2.5); break;
    case 'bag':
      c.fillStyle = col; c.beginPath(); c.ellipse(0, 4, 9, 7, 0, 0, TAU); c.fill(); poly([[-4, -3], [4, -3], [6, -9], [-6, -9]], col);
      c.fillStyle = dk; c.fillRect(-5, -4, 10, 2); circ(c, 3, 5, 3, gem); circ(c, 3, 5, 1.2, shadeHex(gem, -0.3)); break;
    case 'horseshoe':
      c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(0, -1, 7, Math.PI * 0.05, Math.PI * 0.95, true); c.stroke();
      c.fillStyle = gem; for (const [x, y] of [[-6, -4], [-3, -7.5], [3, -7.5], [6, -4]]) c.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); break;
    case 'orb':
      c.fillStyle = gem; c.fillRect(-6, 7, 12, 3); poly([[-4, 7], [4, 7], [2, 4], [-2, 4]], gem);
      circ(c, 0, -2, 7.5, col); circ(c, -2.5, -4.5, 2.5, lt); break;
    case 'book':
      c.fillStyle = '#e8dcc0'; c.fillRect(-8, -9, 17, 19); c.fillStyle = col; c.fillRect(-9, -10, 16, 19); c.fillStyle = dk; c.fillRect(-9, -10, 3, 19);
      c.strokeStyle = gem; c.lineWidth = 1.5; c.beginPath(); c.moveTo(1, -6); c.lineTo(1, 5); c.moveTo(-2, -3); c.lineTo(4, 2); c.moveTo(4, -3); c.lineTo(-2, 2); c.stroke(); break;
  }
}
const artSprite = id => sprite(`art_${id}`, 16, 16, 8, 8, p => drawArtifact(p, id));

// --- czary: ikony i księga czarów (mapa, bitwa, ekran bohatera) ---
function drawSpellIcon(c, id) {
  const S = SPELLS[id], col = S.col, dk = shadeHex(col, -0.45);
  c.fillStyle = dk; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill(); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  const poly = pts => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
  switch (id) {
    case 'magicArrow': c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 6); c.lineTo(5, -5); c.stroke(); poly([[7, -7], [1, -5], [5, -1]]); break;
    case 'bless': for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.lineWidth = 1.6; c.beginPath(); c.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); c.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); c.stroke(); } c.beginPath(); c.arc(0, 0, 3.5, 0, TAU); c.fill(); break;
    case 'stoneSkin': poly([[-7, -6], [7, -6], [7, 1], [0, 8], [-7, 1]]); c.fillStyle = dk; c.fillRect(-3, -3, 2, 2); c.fillRect(2, 0, 2, 2); break;
    case 'haste': poly([[-7, 2], [2, -7], [0, -1], [7, -2], [-2, 7], [0, 1]]); break;
    case 'cure': c.fillRect(-2, -7, 4, 14); c.fillRect(-7, -2, 14, 4); break;
    case 'slow': c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(0, -4); c.lineTo(0, 0); c.lineTo(3, 2); c.stroke(); break;
    case 'eagleEye': c.beginPath(); c.ellipse(0, 0, 8, 4.5, 0, 0, TAU); c.fill(); c.fillStyle = dk; c.beginPath(); c.arc(0, 0, 2.5, 0, TAU); c.fill(); break;
    case 'lightningBolt': poly([[2, -8], [-5, 1], [0, 1], [-2, 8], [5, -1], [0, -1]]); break;
    case 'weakness': c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 6); c.lineTo(-1, 1); c.moveTo(1, -1); c.lineTo(6, -6); c.stroke(); break;
    case 'bloodlust': c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(7, 1, 0, 7); c.quadraticCurveTo(-7, 1, 0, -8); c.fill(); break;
    case 'fireball': c.beginPath(); c.arc(0, 2, 5.5, 0, TAU); c.fill(); poly([[-5, 0], [-3, -8], [0, -3], [3, -8], [5, 0]]); break;
    case 'animateDead': c.beginPath(); c.arc(0, -1, 6, 0, TAU); c.fill(); c.fillRect(-4, 3, 8, 4); c.fillStyle = dk; c.fillRect(-3.5, -3, 2.5, 2.5); c.fillRect(1, -3, 2.5, 2.5); break;
    case 'townPortal': c.lineWidth = 2.2; c.beginPath(); c.ellipse(0, 0, 5, 8, 0, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.fill(); break;
  }
}
const spellSprite = id => sprite(`sp_${id}`, 16, 16, 8, 8, p => drawSpellIcon(p, id));
// Księga czarów. mode: 'view' (tylko opis), 'adv' (czary mapy), 'battle' (czary bitwy). onPick(id) po wyborze.
function showSpellbook(h, mode, onPick) {
  const x = 110, y = 60, w = 580, hh = 460, sp = heroStat(h, 'sp'), list = [...(h.spells || [])].sort((a, b) => SPELLS[a].level - SPELLS[b].level || SPELLS[a].name.localeCompare(SPELLS[b].name));
  const cell = i => ({ x: x + 24 + (i % 2) * 272, y: y + 76 + Math.floor(i / 2) * 50, w: 262, h: 46 });
  const usable = id => mode !== 'view' && SPELLS[id].kind === mode && SPELLS[id].cost <= h.mana;
  const close = new Button(W / 2 - 70, y + hh - 54, 140, 40, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 17 });
  let hover = -1;
  G.modal = {
    buttons: [close],
    onClick(px, py) { const i = list.findIndex((id, k) => inRect(px, py, cell(k))); if (i >= 0 && usable(list[i])) { G.modal = null; onPick(list[i]); } },
    rightInfo(px, py) { const i = list.findIndex((id, k) => inRect(px, py, cell(k))); if (i < 0) return null; const S = SPELLS[list[i]]; return `${S.name} (poziom ${S.level}, ${S.kind === 'battle' ? 'w bitwie' : 'na mapie'}, koszt ${S.cost} many): ${S.desc(sp)}.`; },
    draw(ctx) {
      hover = list.findIndex((id, k) => inRect(G.mouse.x, G.mouse.y, cell(k)));
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, hh);
      text(ctx, 'Księga czarów', W / 2, y + 34, { size: 26, align: 'center', color: '#3a1e08', fam: 'title' });
      text(ctx, `${h.name} · mana ${h.mana} / ${heroMaxMana(h)} · moc czarów ${sp}`, W / 2, y + 58, { size: 14, weight: 500, align: 'center', color: '#5a3814' });
      if (!list.length) text(ctx, 'Bohater nie zna jeszcze żadnych czarów. Odwiedź miasto z gildią magów.', W / 2, y + 200, { size: 15, italic: true, weight: 500, align: 'center', color: '#7a5a34' });
      list.forEach((id, i) => {
        const r = cell(i), S = SPELLS[id], ok = usable(id);
        ctx.fillStyle = ok && hover === i ? 'rgba(160,100,30,.3)' : 'rgba(90,55,20,.12)'; rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill();
        ctx.save(); if (mode !== 'view' && !ok) ctx.globalAlpha = 0.45;
        drawSprite(ctx, spellSprite(id), r.x + 24, r.y + 23, 1);
        text(ctx, S.name, r.x + 46, r.y + 16, { size: 15, color: '#2a1606', fam: 'title' });
        text(ctx, `${S.level} poz. · ${S.cost} many · ${S.kind === 'battle' ? 'bitwa' : 'mapa'}`, r.x + 46, r.y + 34, { size: 12, weight: 500, color: '#5a3814' });
        ctx.restore();
      });
      const hs = hover >= 0 ? SPELLS[list[hover]] : null;
      text(ctx, hs ? `${hs.name}: ${hs.desc(sp)}.` : mode === 'view' ? 'Prawy przycisk na czarze: pełny opis.' : `Kliknij czar, aby go rzucić (${mode === 'battle' ? 'jeden na rundę' : 'na mapie'}).`,
        W / 2, y + hh - 76, { size: 13, italic: true, weight: 500, align: 'center', color: '#6a4418' });
      close.draw(ctx);
    },
  };
}

// --- rysowanie obiektów w interfejsie (te same sprite'y co na mapie) ----------------------------
// size = rozmiar ikony w px logicznych; 24 = dokładnie jak na mapie
function resIcon(ctx, id, cx, cy, size = 24) { drawSprite(ctx, resSprite(id), cx, cy, size / 24); }
function drawHeroPortrait(ctx, x, y, h, col, k = 1) {
  const s = 36 * k; drawSprite(ctx, bustSprite(h, col), x, y, k);
  if (h.asleep) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, s, s); text(ctx, 'z z', x + s / 2, y + s / 2, { size: 14, align: 'center', color: '#ecd9a8', fam: 'title' }); }
  ctx.lineWidth = 2; ctx.strokeStyle = '#b8913f'; ctx.strokeRect(x, y, s, s);
}

