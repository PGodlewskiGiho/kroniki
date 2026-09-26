// ==================== MIASTO: LOCH I CYTADELA ==============================================
// Loch: ciemne skały, stalagmity, świecące grzyby i fioletowe światła w szczelinach okien.
// Cytadela: piaskowiec, namioty ze skór, kły i kości, totemy i pióropusze dymu nad stepem.
// Budowle dostają s = { x, b, w, h } (podstawa b) i poziom (tier), jak w pozostałych plikach MIASTO.
TOWN_ART.dungeon = {
  sky: ['#140e20', '#2e2040', '#5a3a6a'], far: ['#2a2234', '#3a3046'], back: ['#3a3440', '#2a2632'], mid: ['#423a4a', '#302a38'], front: ['#4a4252', '#342e3c'],
  path: ['#6a6070', '#4a4452'], wall: ['#625a6c', '#34303e'], mortar: 'rgba(0,0,0,.45)', roof: { hall: '#3e2a58', dw: '#4a2a3e', util: '#3a3444', tower: '#2a1e3e', wall: '#34283e' },
  roofShape: 'spire', tex: 'blocks', glow: '#c080ff', door: '#0a0610', trim: '#b080e0',
};
TOWN_ART.stronghold = {
  sky: ['#c86a2a', '#f0b060', '#f8e0a8'], far: ['#b8805a', '#c89a6a'], back: ['#c8a070', '#a88050'], mid: ['#d0a878', '#b08858'], front: ['#d8b080', '#b89060'],
  path: ['#b89468', '#8a6a44'], wall: ['#d0a878', '#8a6440'], mortar: 'rgba(80,40,10,.35)', roof: { hall: '#8a3a1a', dw: '#9a6a3a', util: '#7a5a34', tower: '#6a2a14', wall: '#7a4a2a' },
  roofShape: 'gable', tex: 'bricks', glow: '#ffb050', door: '#2a1608', trim: '#e0b050',
};
// --- klocki Lochu ---
function stalag(c, x, b, w, h, col = '#4a4454') { // stalagmit: ostra skała z jaśniejszą krawędzią
  fillPoly(c, [[x - w / 2, b], [x - w * 0.18, b - h * 0.6], [x, b - h], [x + w * 0.16, b - h * 0.55], [x + w / 2, b]], col);
  fillPoly(c, [[x, b - h], [x + w * 0.16, b - h * 0.55], [x + w / 2, b], [x + w * 0.1, b]], shadeHex(col, -0.3));
  c.fillStyle = shadeHex(col, 0.2); c.fillRect(x - w * 0.22, b - h * 0.5, 1.5, h * 0.3);
}
function glowShroom(c, x, b, s, cap, fx) { // wielki grzyb ze świecącymi kropkami
  c.fillStyle = '#d8d0c0'; c.fillRect(x - 2.2 * s, b - 16 * s, 4.4 * s, 16 * s); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + 0.6 * s, b - 16 * s, 1.6 * s, 16 * s);
  c.fillStyle = cap; c.beginPath(); c.ellipse(x, b - 16 * s, 11 * s, 7 * s, 0, Math.PI, 0); c.closePath(); c.fill();
  c.fillStyle = shadeHex(cap, -0.35); c.fillRect(x - 11 * s, b - 16.5 * s, 22 * s, 2 * s);
  for (const [dx, dy] of [[-5, -19], [2, -21], [6, -18], [-1, -17.5]]) circ(c, x + dx * s, b + dy * s, 1.2 * s, '#e8f8ff');
  if (fx) fx.glows.push([x, b - 18 * s, 22 * s, shadeHex(cap, 0.3)]);
}
function darkSpire(c, A, x, b, w, h, roof, fx, glow) { // ciemna wieża ze szczelinami okien i ostrym dachem
  wallRect(c, A, x, b - h, w, h);
  for (let y = b - h + 8; y < b - 14; y += 16) { c.fillStyle = '#0a0610'; c.fillRect(x + w / 2 - 2, y, 4, 10); c.fillStyle = glow || A.glow; c.fillRect(x + w / 2 - 1, y + 1, 2, 8); if (fx) fx.wins.push([x + w / 2 - 1, y + 1, 2, 8, glow || A.glow]); }
  roofArt(c, A, roof, x, b - h, w, w * 1.5);
}
function caveMouth(c, x, b, w, h, rock, inner, fx) { // skała z wejściem do pieczary (świeci od środka)
  rockMound(c, x, b, w, h, rock, Math.round(w + h));
  const cx = x + w * 0.45, mw = w * 0.34, mh = h * 0.55;
  c.fillStyle = '#08060c'; c.beginPath(); c.moveTo(cx - mw / 2, b); c.quadraticCurveTo(cx - mw / 2, b - mh, cx, b - mh); c.quadraticCurveTo(cx + mw / 2, b - mh, cx + mw / 2, b); c.closePath(); c.fill();
  if (inner && fx) fx.glows.push([cx, b - mh * 0.35, mw * 0.9, inner]);
  if (inner) { c.fillStyle = inner; c.globalAlpha = 0.35; c.beginPath(); c.ellipse(cx, b - 2, mw * 0.36, 4, 0, 0, TAU); c.fill(); c.globalAlpha = 1; }
  return cx;
}
const DUNGEON_ART = {
  hall(c, A, s, tier, col, fx) { // mroczna warownia: wieże ze szczelinami, na wyższych poziomach kula mocy nad dachem
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 4) for (const tx of [x - 4, x + w - 14]) stalag(c, tx + 9, b, 22, h * 0.7, '#3a3444');
    if (tier >= 2) for (const tx of [x + 8, x + w - 30]) darkSpire(c, A, tx, b, 22, h * 0.5, A.roof.dw, fx);
    const bw = w * 0.5, bh = h * (0.3 + tier * 0.04), bx = cx - bw / 2; wallRect(c, A, bx, b - bh, bw, bh); crenel(c, A, bx, b - bh, bw);
    for (let i = 0; i < 2; i++) archWin(c, bx + bw * (0.2 + i * 0.46) - 4, b - bh + 10, 8, 12, A.glow, fx);
    doorArt(c, A, cx - 8, b, 16, 22);
    const tw = bw * 0.44, th = h * (0.62 + tier * 0.07); darkSpire(c, A, cx - tw / 2, b - bh + 1, tw, th - bh, A.roof.hall, fx);
    bannerArt(c, cx, b - th - tw * 1.5 - 14, col);
    if (tier >= 3) { const oy = b - th - tw * 0.6; circ(c, cx + tw * 1.4, oy, 5, '#e0a0ff'); circ(c, cx + tw * 1.4 - 1.5, oy - 1.5, 1.8, '#ffffff'); fx.glows.push([cx + tw * 1.4, oy, 28, '#c080ff']); }
  },
  fort(c, A, s, tier, col, fx) { // mur z postrzępionymi blankami i stalagmitami, na wyższych poziomach czarna cytadela
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 2) { const kw = tier >= 3 ? 58 : 46, kh = h * (tier >= 3 ? 0.96 : 0.78); darkSpire(c, A, cx - kw / 2, b - 12, kw, kh - 12 - kw * 0.6, A.roof.wall, fx); bannerArt(c, cx, b - kh - kw * 0.9 - 18, col); }
    const wh = h * 0.34; wallRect(c, A, x + 14, b - wh, w - 28, wh);
    for (let px = x + 16; px < x + w - 20; px += 9) fillPoly(c, [[px, b - wh], [px + 3, b - wh - 7 - (px % 3) * 2], [px + 6, b - wh]], A.wall[1]);
    for (const tx of [x, x + w - 28]) darkSpire(c, A, tx, b, 28, h * (tier >= 3 ? 0.62 : 0.52), A.roof.tower, fx);
    for (const sx of [x + 36, x + w - 36]) stalag(c, sx, b, 12, 26, '#3a3444');
    c.fillStyle = A.door; c.beginPath(); c.moveTo(cx - 10, b); c.lineTo(cx - 10, b - 14); c.lineTo(cx, b - 26); c.lineTo(cx + 10, b - 14); c.lineTo(cx + 10, b); c.closePath(); c.fill();
    c.strokeStyle = '#5a4a6a'; c.lineWidth = 1; for (let i = -6; i <= 6; i += 4) { c.beginPath(); c.moveTo(cx + i, b); c.lineTo(cx + i, b - 20 + Math.abs(i)); c.stroke(); }
  },
  guild(c, A, s, tier, col, fx) { // kręta wieża czarnoksiężników: piętro na każdy poziom, nad nią krążące runy
    const { x, b, w, h } = s, cx = x + w / 2, tw = w * 0.5, th = h * (0.36 + Math.min(tier, 5) * 0.1);
    wallRect(c, A, cx - tw / 2, b - th, tw, th);
    for (let i = 1; i < tier; i++) { c.fillStyle = A.trim; c.fillRect(cx - tw / 2 - 2, b - th + i * th / tier, tw + 4, 2); }
    for (let i = 0; i < tier; i++) archWin(c, cx - 3.5, b - th + 6 + i * th / tier, 7, Math.max(5, Math.min(10, th / tier - 9)), '#c080ff', fx);
    roofArt(c, A, A.roof.tower, cx - tw / 2, b - th, tw, tw * 1.4);
    for (let i = 0; i < Math.min(tier + 1, 4); i++) { const a = i * 1.7, rx = cx + Math.cos(a) * tw * 0.9, ry = b - th - tw * 0.4 + Math.sin(a) * 6; circ(c, rx, ry, 1.8, '#e0b0ff'); fx.glows.push([rx, ry, 8, '#c080ff']); }
    drawEmblem(c, 'book', x + w - 9, b - 7, 14, '#4a2a6a');
  },
  tavern(c, A, s, tier, col, fx) { // karczma w skale: kamienny dom wsparty o głaz, obok świecące grzyby
    const { x, b, w, h } = s, bw = w * 0.62, top = b - h * 0.5;
    rockMound(c, x + bw * 0.5, b, w * 0.5, h * 0.7, '#4a4454', 12);
    wallRect(c, A, x + 4, top, bw, h * 0.5); doorArt(c, A, x + 4 + bw / 2 - 8, b, 16, 20); winArt(c, A, x + 12, top + 10, 8, 8, fx); winArt(c, A, x + bw - 12, top + 10, 8, 8, fx);
    roofArt(c, GABLE, A.roof.util, x + 4, top, bw, h * 0.32);
    signArt(c, A, 'mug', x + w - 14, top + 4, h * 0.5 - 4, false); glowShroom(c, x + w - 4, b, 0.8, '#6a3a9a', fx);
  },
  market(c, A, s, tier, col, fx) { // targ pod fioletowymi daszkami: kryształy, grzyby, zwoje
    c.fillStyle = '#4a4452'; c.beginPath(); c.ellipse(s.x + s.w / 2, s.b - 5, s.w / 2, 9, 0, 0, TAU); c.fill();
    stalls(c, s, [['#4a2a6a', '#8a7aa0'], ['#6a2a3a', '#8a7aa0'], ['#2a4a5a', '#8a7aa0']], ['#c080ff', '#80e0c0', '#ff8aa0', '#e0e0a0', '#a0c0ff'], '#2a2430');
    crystals(c, s.x + 6, s.b, 0.5, '#a070e0'); fx.glows.push([s.x + 6, s.b - 8, 16, '#a070e0']);
  },
  smith(c, A, s, tier, col, fx) { // kuźnia w grocie: palenisko w skale
    const { x, b, w, h } = s, cx = caveMouth(c, x, b, w * 0.78, h * 0.72, '#4a4454', '#ff8a3a', fx);
    circ(c, cx, b - 6, 5, '#ffb040'); fx.smokes.push([cx + 6, b - h * 0.62]);
    drawEmblem(c, 'anvil', x + w - 12, b - 8, 16, '#8a8494');
  },
  silo(c, A, s, tier, col, fx) { // skład: kamienna krypta ze skrzyniami i kryształami
    const { x, b, w, h } = s, tw = w * 0.46, top = b - h * 0.5; wallRect(c, A, x + 4, top, tw, h * 0.5); roofArt(c, A, A.roof.util, x + 4, top, tw, tw * 0.9);
    doorArt(c, A, x + 4 + tw / 2 - 6, b, 12, 16); crate(c, x + w * 0.68, b, 11); crystals(c, x + w * 0.88, b, 0.45, '#80e0c0');
  },
  dw1(c, A, s, tier, col, fx) { // nory troglodytów w skalnym kopcu
    const { x, b, w, h } = s; rockMound(c, x, b, w * 0.86, h * 0.62, '#5a5262', 21);
    for (const [fx0, fy, r] of [[0.2, 0.18, 6], [0.46, 0.32, 7], [0.64, 0.12, 5]]) { c.fillStyle = '#0a080e'; c.beginPath(); c.ellipse(x + w * fx0, b - h * fy, r, r * 0.8, 0, 0, TAU); c.fill(); }
    if (tier >= 2) for (const dx of [0.3, 0.56]) { circ(c, x + w * dx, b - h * 0.42, 2, '#ff6a3a'); fx.glows.push([x + w * dx, b - h * 0.42, 10, '#ff6a3a']); }
    drawCreature(c, tier >= 2 ? 'infernalTroglodyte' : 'troglodyte', x + w * 0.88, b, 1, -1, 0);
  },
  dw2(c, A, s, tier, col, fx) { // skalna turnia z gniazdami harpii
    const { x, b, w, h } = s, cx = x + w * 0.4; stalag(c, cx, b, w * 0.42, h * (tier >= 2 ? 1 : 0.85), '#5a5262'); stalag(c, cx - w * 0.22, b, w * 0.2, h * 0.5, '#4a4454');
    for (const [dx, dy] of [[0.02, 0.5], [-0.08, 0.72]]) { c.fillStyle = '#6a4a2a'; c.beginPath(); c.ellipse(cx + dx * w, b - h * dy, 8, 3, 0, 0, TAU); c.fill(); }
    drawCreature(c, tier >= 2 ? 'harpyHag' : 'harpy', x + w * 0.8, b, 0.9, -1, 0.3);
  },
  dw3(c, A, s, tier, col, fx) { // kamienna kolumna pełna oczu, nad nią unosi się obserwator
    const { x, b, w, h } = s, cx = x + w * 0.4, cw = w * 0.36, ch = h * 0.62;
    c.fillStyle = A.wall[1]; c.fillRect(cx - cw / 2 - 4, b - 6, cw + 8, 6); wallRect(c, A, cx - cw / 2, b - ch, cw, ch - 6); c.fillStyle = A.wall[0]; c.fillRect(cx - cw / 2 - 4, b - ch - 5, cw + 8, 5);
    for (const [dx, dy] of [[0, 0.3], [-0.25, 0.55], [0.22, 0.7], [0, 0.85]]) { const ex = cx + dx * cw, ey = b - ch * dy; c.fillStyle = '#f0ead8'; c.beginPath(); c.ellipse(ex, ey, 3.5, 2, 0, 0, TAU); c.fill(); circ(c, ex + 0.5, ey, 1.2, tier >= 2 ? '#ff5a2a' : '#c080ff'); }
    drawCreature(c, tier >= 2 ? 'evilEye' : 'beholder', cx, b - ch - 6, 0.9, -1, 0.4); fx.glows.push([cx, b - ch - 22, 24, '#c080ff']);
  },
  dw4(c, A, s, tier, col, fx) { // kaplica ciszy: kolumny i zielone światło, przed nią meduza
    const { x, b, w, h } = s, cx = x + w * 0.42, pw = w * 0.56, top = b - h * 0.62;
    c.fillStyle = A.wall[1]; c.fillRect(cx - pw / 2 - 4, b - 5, pw + 8, 5);
    for (let i = 0; i < 4; i++) { const px = cx - pw / 2 + i * (pw - 6) / 3; c.fillStyle = A.wall[0]; c.fillRect(px, top, 6, b - 5 - top); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(px + 4, top, 2, b - 5 - top); }
    c.fillStyle = '#0a0a0c'; c.fillRect(cx - pw / 2 + 8, top + 4, pw - 16, b - top - 9); fx.glows.push([cx, b - 18, 26, '#80f0a0']);
    fillPoly(c, [[cx - pw / 2 - 6, top], [cx, top - 20], [cx + pw / 2 + 6, top]], A.roof.dw); c.fillStyle = A.wall[0]; c.fillRect(cx - pw / 2 - 4, top - 2, pw + 8, 4);
    if (tier >= 2) drawEmblem(c, 'eye', cx, top - 8, 12, '#80f0a0');
    drawCreature(c, tier >= 2 ? 'medusaQueen' : 'medusa', x + w * 0.85, b, 0.9, -1, 0);
  },
  dw5(c, A, s, tier, col, fx) { // labirynt: pierścienie niskich murów, w środku minotaur
    const { x, b, w, h } = s, cx = x + w / 2;
    for (const [k, rw, rh] of [[0, 0.5, 20], [1, 0.36, 15], [2, 0.22, 10]]) {
      if (k === 2 && tier < 2) break; const y = b - 6 - k * 9, ww = w * rw;
      c.fillStyle = A.wall[1]; c.beginPath(); c.ellipse(cx, y, ww, 7, 0, 0, TAU); c.fill(); c.fillStyle = shadeHex(A.wall[0], 0.05); c.fillRect(cx - ww, y - rh * 0.5, ww * 2, rh * 0.5);
      c.fillStyle = '#1a1620'; c.fillRect(cx - 5 + k * 9, y - rh * 0.5, 7, rh * 0.5);
    }
    stalag(c, x + 8, b, 14, 34, '#3a3444'); stalag(c, x + w - 6, b, 12, 28, '#3a3444');
    drawCreature(c, tier >= 2 ? 'minotaurKing' : 'minotaur', cx, b - 24, 0.85, -1, 0);
  },
  dw6(c, A, s, tier, col, fx) { // jaskinia mantykor
    const { x, b, w, h } = s, cx = caveMouth(c, x, b, w * 0.72, h * 0.95, '#524a5a', tier >= 2 ? '#ff5a3a' : '#c07a3a', fx);
    for (let i = 0; i < 3; i++) skullAt(c, cx - 14 + i * 12, b - 3, 0.5);
    drawCreature(c, tier >= 2 ? 'scorpicore' : 'manticore', x + w * 0.82, b, 0.8, -1, 0);
  },
  dw7(c, A, s, tier, col, fx) { // smocza pieczara w wielkiej skale, z czeluści bije żar
    const { x, b, w, h } = s; caveMouth(c, x, b, w * 0.92, h * 0.72, '#443e4c', tier >= 2 ? '#a060ff' : '#ff6a2a', fx);
    for (const [dx, hh] of [[0.1, 40], [0.84, 52]]) stalag(c, x + w * dx, b - h * 0.2, 16, hh, '#3a3444');
    drawCreature(c, tier >= 2 ? 'blackDragon' : 'redDragon', x + w * 0.5, b - h * 0.62, 0.62, -1, 0.5);
  },
};
BUILD_ART.dungeon = DUNGEON_ART;
// --- klocki Cytadeli ---
function hideTent(c, x, b, w, h, col, fx) { // stożkowy namiot ze skór z tyczkami i pasami
  for (const d of [-3, 0, 3]) limb(c, x + w / 2, b - h + 2, x + w / 2 + d * 1.5, b - h - 8, 1.4, '#4a2a14');
  fillPoly(c, [[x, b], [x + w / 2, b - h], [x + w, b]], col); fillPoly(c, [[x + w / 2, b - h], [x + w, b], [x + w * 0.62, b]], shadeHex(col, -0.25));
  c.strokeStyle = shadeHex(col, -0.45); c.lineWidth = 1.4; for (const f of [0.35, 0.65]) { c.beginPath(); c.moveTo(x + w / 2 - w / 2 * f, b - h * (1 - f)); c.lineTo(x + w / 2 + w / 2 * f, b - h * (1 - f)); c.stroke(); }
  c.fillStyle = '#2a1608'; c.beginPath(); c.moveTo(x + w * 0.4, b); c.lineTo(x + w / 2, b - h * 0.42); c.lineTo(x + w * 0.58, b); c.closePath(); c.fill();
  if (fx) fx.smokes.push([x + w / 2, b - h - 6, 0.7]);
}
function tusks(c, cx, b, w, h, col = '#f0e8d0') { // brama z dwóch zakrzywionych kłów
  c.strokeStyle = col; c.lineCap = 'round'; for (const sd of [-1, 1]) { c.lineWidth = 5; c.beginPath(); c.moveTo(cx + sd * w / 2, b); c.quadraticCurveTo(cx + sd * w * 0.6, b - h * 0.7, cx + sd * w * 0.08, b - h); c.stroke(); }
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(cx + sd * w / 2 + 1.5, b); c.quadraticCurveTo(cx + sd * w * 0.6 + 1.5, b - h * 0.7, cx + sd * w * 0.08, b - h + 2); c.stroke(); }
}
function mudDrum(c, A, x, b, w, h, roof, fx) { // okrągła chata z gliny z kopulastym dachem ze strzechy
  wallRect(c, A, x, b - h, w, h); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + w / 2, b - h, w / 2, 3, 0, 0, Math.PI); c.fill();
  c.fillStyle = roof; c.beginPath(); c.ellipse(x + w / 2, b - h, w / 2 + 4, h * 0.6, 0, Math.PI, 0); c.closePath(); c.fill();
  c.strokeStyle = shadeHex(roof, -0.35); c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + w / 2 + i * w * 0.08, b - h - h * 0.58); c.lineTo(x + w / 2 + i * w * 0.16, b - h); c.stroke(); }
  c.fillStyle = shadeHex(roof, -0.4); c.fillRect(x - 4, b - h - 1.5, w + 8, 3);
}
function mesa(c, x, b, w, h, col = '#b87a4a') { // płaska skała stepu z warstwami
  fillPoly(c, [[x, b], [x + w * 0.1, b - h * 0.9], [x + w * 0.2, b - h], [x + w * 0.82, b - h], [x + w * 0.9, b - h * 0.85], [x + w, b]], col);
  fillPoly(c, [[x + w * 0.6, b], [x + w * 0.72, b - h], [x + w * 0.82, b - h], [x + w * 0.9, b - h * 0.85], [x + w, b]], shadeHex(col, -0.25));
  c.strokeStyle = shadeHex(col, -0.3); c.lineWidth = 1.2; for (const f of [0.3, 0.55, 0.78]) { c.beginPath(); c.moveTo(x + w * 0.06 * (1 - f) + w * 0.04, b - h * f); c.lineTo(x + w * 0.94, b - h * f); c.stroke(); }
  c.fillStyle = shadeHex(col, 0.18); c.fillRect(x + w * 0.2, b - h, w * 0.62, 2.5);
}
const STRONGHOLD_ART = {
  hall(c, A, s, tier, col, fx) { // wielka chata wodza z kopułą, kły przed wejściem, totemy, na wyższych poziomach wieże z kamienia
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 3) for (const tx of [x + 2, x + w - 24]) { wallRect(c, A, tx, b - h * 0.62, 22, h * 0.62); cone(c, A.roof.tower, tx + 11, b - h * 0.62, 22, 22); }
    if (tier >= 2) { totem(c, cx - w * 0.3, b, h * 0.6, '#7a4a24', '#ffb050'); totem(c, cx + w * 0.3, b, h * 0.6, '#7a4a24', '#ffb050'); }
    const bw = w * (0.46 + tier * 0.03), bh = h * (0.34 + tier * 0.04); mudDrum(c, A, cx - bw / 2, b, bw, bh, A.roof.hall, fx);
    for (let i = 0; i < 3; i++) { c.fillStyle = shadeHex(A.wall[1], -0.2); c.fillRect(cx - bw / 2 + 6 + i * (bw - 16) / 2, b - bh + 6, 4, 4); }
    winArt(c, A, cx - bw * 0.3, b - bh * 0.62, 7, 7, fx); winArt(c, A, cx + bw * 0.3 - 7, b - bh * 0.62, 7, 7, fx);
    doorArt(c, A, cx - 8, b, 16, 22); tusks(c, cx, b, 34, 36);
    if (tier >= 4) { c.fillStyle = '#e0b050'; c.beginPath(); c.arc(cx, b - bh - bh * 0.6 - 4, 5, 0, TAU); c.fill(); }
    bannerArt(c, cx, b - bh - bh * 0.6 - 26, col);
  },
  fort(c, A, s, tier, col, fx) { // palisada z kamiennymi basztami, brama z kłów; wyżej kamienna twierdza
    const { x, b, w, h } = s, cx = x + w / 2;
    if (tier >= 2) { const kw = tier >= 3 ? 60 : 48, kh = h * (tier >= 3 ? 0.92 : 0.74); wallRect(c, A, cx - kw / 2, b - kh, kw, kh - 12); crenel(c, A, cx - kw / 2, b - kh, kw); for (let r = 0; r < tier; r++) winArt(c, A, cx - 4, b - kh + 8 + r * 14, 8, 8, fx); bannerArt(c, cx, b - kh - 26, col); }
    palisade(c, x + 14, x + w - 14, b, h * 0.32, '#7a5030');
    for (const tx of [x, x + w - 28]) { const th = h * (tier >= 3 ? 0.62 : 0.52); wallRect(c, A, tx, b - th, 28, th); crenel(c, A, tx, b - th, 28); winArt(c, A, tx + 11, b - th + 10, 6, 7, fx); skullAt(c, tx + 14, b - th * 0.45, 0.55); }
    c.fillStyle = '#1a0e06'; c.fillRect(cx - 10, b - 20, 20, 20); tusks(c, cx, b, 30, 32);
  },
  guild(c, A, s, tier, col, fx) { // namiot szamana: coraz wyższe namioty jeden nad drugim, dym i runy
    const { x, b, w, h } = s, cx = x + w / 2, n = Math.min(tier, 5), th = h * (0.3 + n * 0.1);
    wallRect(c, A, cx - w * 0.3, b - th * 0.4, w * 0.6, th * 0.4);
    hideTent(c, cx - w * 0.36, b - th * 0.4, w * 0.72, th * 0.6, A.roof.util, fx);
    for (let i = 0; i < n; i++) { const rx = cx - w * 0.2 + (i % 3) * w * 0.2, ry = b - th * 0.2 - Math.floor(i / 3) * 8; circ(c, rx, ry, 2, '#ffd070'); fx.glows.push([rx, ry, 9, '#ffb050']); }
    drawEmblem(c, 'book', x + w - 9, b - 7, 14, '#6a3a1a');
  },
  tavern(c, A, s, tier, col, fx) { // długi dom z gliny, strzecha, kufel na tyczce i beczki
    const { x, b, w, h } = s, bw = w * 0.66, top = b - h * 0.46;
    wallRect(c, A, x + 4, top, bw, h * 0.46); doorArt(c, A, x + 4 + bw / 2 - 8, b, 16, 20); winArt(c, A, x + 12, top + 10, 8, 8, fx); winArt(c, A, x + bw - 12, top + 10, 8, 8, fx);
    roofArt(c, GABLE, '#b89050', x + 4, top, bw, h * 0.34); fx.smokes.push([x + 4 + bw * 0.7, top - h * 0.28]);
    signArt(c, A, 'mug', x + w - 12, top + 2, h * 0.46 - 2, false); barrel(c, x + w - 24, b);
  },
  market(c, A, s, tier, col, fx) { // bazar: kramy z pasiastymi daszkami, dywany, dzbany
    c.fillStyle = '#c8a070'; c.beginPath(); c.ellipse(s.x + s.w / 2, s.b - 5, s.w / 2, 9, 0, 0, TAU); c.fill();
    stalls(c, s, [['#c83a1a', '#f0d890'], ['#3a6a8a', '#f0d890'], ['#8a3a6a', '#f0d890']], ['#e0b050', '#c86a2a', '#6aa0c0', '#f0e0c0', '#a03a2a'], '#5a3a1a');
    c.fillStyle = '#8a2a1a'; c.fillRect(s.x + 4, s.b - 3, 18, 3); c.fillStyle = '#e0b050'; c.fillRect(s.x + 6, s.b - 2.5, 14, 1);
  },
  smith(c, A, s, tier, col, fx) { // kuźnia pod daszkiem ze skór: palenisko, kowadło
    const { x, b, w, h } = s, top = b - h * 0.62;
    for (const px of [x + 4, x + w * 0.64]) { c.fillStyle = '#5a3a1a'; c.fillRect(px, top, 3, b - top); }
    fillPoly(c, [[x - 2, top + 2], [x + w * 0.34, top - 10], [x + w * 0.72, top + 2]], A.roof.util); fillPoly(c, [[x + w * 0.34, top - 10], [x + w * 0.72, top + 2], [x + w * 0.42, top + 2]], shadeHex(A.roof.util, -0.3));
    wallRect(c, A, x + 10, b - 16, 24, 16); circ(c, x + 22, b - 16, 5, '#ffb040'); fx.glows.push([x + 22, b - 18, 22, '#ff9a3a']); fx.smokes.push([x + 22, top - 4]);
    drawEmblem(c, 'anvil', x + w - 12, b - 8, 16, '#4a3a2a');
  },
  silo(c, A, s, tier, col, fx) { // spichlerze: dwie okrągłe chaty i worki
    const { x, b, w, h } = s; mudDrum(c, A, x + 4, b, w * 0.42, h * 0.42, '#b89050', fx); mudDrum(c, A, x + w * 0.46, b, w * 0.3, h * 0.3, '#a88040', fx);
    for (const dx of [0.84, 0.94]) { c.fillStyle = '#d8c090'; c.beginPath(); c.ellipse(x + w * dx, b - 5, 5, 6, 0, 0, TAU); c.fill(); }
  },
  dw1(c, A, s, tier, col, fx) { // obóz hobgoblinów: namioty i ognisko
    const { x, b, w, h } = s; hideTent(c, x + 2, b, w * 0.42, h * 0.62, '#a0784a', fx); hideTent(c, x + w * 0.38, b, w * 0.34, h * 0.48, tier >= 2 ? '#8a2a1a' : '#8a6a3a', null);
    circ(c, x + w * 0.8, b - 3, 3.5, '#ffb040'); fx.glows.push([x + w * 0.8, b - 6, 16, '#ff9a3a']);
    drawCreature(c, tier >= 2 ? 'hobgoblinRaider' : 'hobgoblin', x + w * 0.9, b, 1, -1, 0);
  },
  dw2(c, A, s, tier, col, fx) { // wilcze doły: ogrodzony dół, kości, warg
    const { x, b, w, h } = s; c.fillStyle = '#6a4a2a'; c.beginPath(); c.ellipse(x + w * 0.42, b - 5, w * 0.36, 8, 0, 0, TAU); c.fill(); c.fillStyle = '#2a1a0e'; c.beginPath(); c.ellipse(x + w * 0.42, b - 5, w * 0.3, 5.5, 0, 0, TAU); c.fill();
    palisade(c, x + 4, x + w * 0.36, b - 8, 16, '#6a4424'); if (tier >= 2) { c.fillStyle = '#7a4a24'; c.fillRect(x + w * 0.6, b - 30, 4, 30); c.fillStyle = col; fillPoly(c, [[x + w * 0.62, b - 30], [x + w * 0.62 + 12, b - 26], [x + w * 0.62, b - 22]], col); }
    skullAt(c, x + w * 0.2, b - 2, 0.5);
    drawCreature(c, tier >= 2 ? 'wargRider' : 'warg', x + w * 0.78, b, 0.9, -1, 0);
  },
  dw3(c, A, s, tier, col, fx) { // orcza wieża: drewniana strażnica na palach z czaszkami
    const { x, b, w, h } = s, cx = x + w * 0.42, tw = w * 0.6, ph = h * 0.46, top = b - h * (tier >= 2 ? 0.82 : 0.72);
    for (const px of [cx - tw / 2 + 2, cx + tw / 2 - 5]) { c.fillStyle = '#5a3a1a'; c.fillRect(px, b - ph, 3.5, ph); }
    limb(c, cx - tw / 2 + 3, b, cx + tw / 2 - 3, b - ph, 1.6, '#4a2a14'); limb(c, cx + tw / 2 - 3, b, cx - tw / 2 + 3, b - ph, 1.6, '#4a2a14');
    wallRect(c, planksA(A), cx - tw / 2, top, tw, b - ph - top); roofArt(c, A, A.roof.dw, cx - tw / 2, top, tw, 16);
    winArt(c, A, cx - 4, top + 8, 8, 7, fx); skullAt(c, cx - tw / 2 + 5, b - ph + 4, 0.5); skullAt(c, cx + tw / 2 - 5, b - ph + 4, 0.5);
    drawCreature(c, tier >= 2 ? 'orcChief' : 'orcAxe', x + w * 0.86, b, 0.9, -1, 0);
  },
  dw4(c, A, s, tier, col, fx) { // zagroda turów
    const { x, b, w, h } = s; fence(c, x + 4, x + w - 6, b, '#6a4424', 14); c.fillStyle = '#d8b878'; c.beginPath(); c.ellipse(x + w * 0.25, b - 6, 9, 5, 0, 0, TAU); c.fill();
    if (tier >= 2) { hideTent(c, x + w * 0.02, b - 2, w * 0.3, h * 0.46, '#8a2a1a', null); }
    drawCreature(c, tier >= 2 ? 'warAurochs' : 'aurochs', x + w * 0.62, b - 2, 0.9, -1, 0);
  },
  dw5(c, A, s, tier, col, fx) { // turnia roków: płaska skała z gniazdem, ptak na szczycie
    const { x, b, w, h } = s, mh = h * (tier >= 2 ? 0.66 : 0.58); mesa(c, x + 6, b, w * 0.8, mh, '#b87a4a');
    c.fillStyle = '#6a4a2a'; c.beginPath(); c.ellipse(x + 6 + w * 0.42, b - mh - 2, 14, 4, 0, 0, TAU); c.fill();
    if (tier >= 2) fx.glows.push([x + w * 0.46, b - mh - 20, 30, '#a0d8ff']);
    drawCreature(c, tier >= 2 ? 'thunderbird' : 'roc', x + 6 + w * 0.42, b - mh + 6, 0.7, -1, 0.3);
  },
  dw6(c, A, s, tier, col, fx) { // jaskinia cyklopów w skale z głazami
    const { x, b, w, h } = s, cx = caveMouth(c, x, b, w * 0.74, h * 0.96, '#a87a4e', '#ffb050', fx);
    rockMound(c, cx + 16, b, 18, 12, '#8a6a4a', 5); rockMound(c, cx - 30, b, 14, 9, '#8a6a4a', 6);
    drawCreature(c, tier >= 2 ? 'cyclopsKing' : 'cyclops', x + w * 0.84, b, 0.7, -1, 0);
  },
  dw7(c, A, s, tier, col, fx) { // legowisko behemota: olbrzymie żebra na skale
    const { x, b, w, h } = s; mesa(c, x, b, w * 0.9, h * 0.3, '#a8703e'); ribs(c, x + w * 0.06, b - h * 0.28, w * 0.74, h * 0.62, '#f0e8d0');
    skullAt(c, x + w * 0.78, b - h * 0.44, 1.4); if (tier >= 2) { totem(c, x + w * 0.04, b, h * 0.6, '#6a4424', '#ff6a2a'); }
    drawCreature(c, tier >= 2 ? 'ancientBehemoth' : 'behemoth', x + w * 0.52, b, 0.62, -1, 0);
  },
};
BUILD_ART.stronghold = STRONGHOLD_ART;
// --- sceny: rozmiary miejsc jak w Przystani, barwy ziemi i nieba (resztę planszy układa generator) ---
TOWN_LAYOUTS.dungeon = {
  sky: { top: '#06040c', mid: '#1e1430', hor: '#5a3a6a', sun: [440, 90], moon: true, moonR: 26, stars: true, cloudDark: 'rgba(20,12,30,.75)', cloudLit: 'rgba(180,120,220,.3)' },
  mountains: ['#2a2434', '#1e1a28'], forest: ['#1e1a26', '#241e2e', '#1a1622'],
  ground: ['#4a4452', '#34303c', '#1e1a24'], haze: '#4a3a5a', desat: 0.12, tuft: ['rgba(0,0,0,.35)', 'rgba(170,120,220,.15)'],
  slots: TOWN_LAYOUTS.haven.slots, walkCols: ['#4a2a6a', '#6a2a3a', '#3a3444', '#5a4a3a'], guardCol: '#3a2a4a', birds: false,
};
TOWN_LAYOUTS.stronghold = {
  sky: { top: '#3a6aa8', mid: '#9ac0d8', hor: '#f8e0a8', sun: [380, 70], cloudDark: 'rgba(200,170,130,.5)', cloudLit: 'rgba(255,250,230,.8)' },
  mountains: ['#b88a60', '#9a6a44'], forest: ['#6a6a3a', '#5a5a30', '#7a6a3a'],
  ground: ['#d8b484', '#b89060', '#8a6a40'], haze: '#e8c89a', desat: 0.1, tuft: ['rgba(90,60,20,.3)', 'rgba(255,240,200,.3)'],
  slots: TOWN_LAYOUTS.haven.slots, walkCols: ['#8a2a1a', '#6a8a3a', '#7a5a2a', '#c86a2a'], guardCol: '#8a2a1a', birds: true, birdCol: 'rgba(60,30,10,.8)',
};
TOWN_WATER.glow = { river: ['#5a3a8a', '#0e0820'], lake: ['#5a4a9a', '#0e0a24'], rim: '#2a2434', edge: 'rgba(170,120,255,.45)',
  chasm: { cols: ['#7a4ab8', '#0a0418'], line: 'rgba(210,170,255,.5)', edge: 'rgba(10,4,20,.9)', glow: '150,90,255', glowA: 0.18 } };
TOWN_WATER.oasis = { river: ['#6ab0a8', '#1e5a62'], lake: ['#7ac0b8', '#1e5a62'], rim: '#a89a5a', edge: 'rgba(240,240,210,.5)', reeds: true };
TOWN_STYLE.dungeon = { walls: ['spiked', 0.45], masonry: true, arche: [['chasm', 3], ['crater', 2], ['plateau', 2], ['lake', 2], ['terraces', 1]], water: 'glow',
  trees: ['glowShroom', 10, 16], deco: [['stalagmite', 4], ['rock', 2], ['bones', 1]], lamp: 'brazier', sand: '#3e3848',
  skies: [[TOWN_LAYOUTS.dungeon.sky, 3], [{ top: '#0a0612', mid: '#2a1a3a', hor: '#7a3a5a', sun: [200, 80], moon: true, moonR: 40, cloudDark: 'rgba(30,14,34,.8)', cloudLit: 'rgba(220,100,160,.3)' }, 2],
    [{ top: '#101018', mid: '#2a2a3a', hor: '#5a5a70', sun: [300, 90], cloudDark: 'rgba(30,30,44,.8)', cloudLit: 'rgba(150,150,190,.3)' }, 1]],
  weather: [['spores', 3], ['mist', 2]], slab: { top: ['#4a4452', '#34303c'], face: ['#3a3444', '#1e1b24'] }, hill: ['#3a3444', '#1e1b24'],
  roofs: [TOWN_ART.dungeon.roof, { hall: '#5a1a2a', dw: '#4a1a24', util: '#3a3040', tower: '#2a0e18', wall: '#3a1a24' }, { hall: '#1e3a4a', dw: '#2a3a4a', util: '#34383e', tower: '#14283a', wall: '#24303a' }] };
TOWN_STYLE.stronghold = { walls: ['palisade', 0.5], arche: [['plateau', 3], ['valley', 2], ['crater', 2], ['lake', 1], ['coast', 1]], water: 'oasis',
  trees: ['acacia', 6, 11], deco: [['cactus', 3], ['bones', 2], ['rock', 2], ['totem', 1]], lamp: 'brazier', sand: '#e0c090',
  skies: [[TOWN_LAYOUTS.stronghold.sky, 3], [{ top: '#3a1a2a', mid: '#b04a2a', hor: '#f8b050', sun: [460, 120], cloudDark: 'rgba(90,40,40,.6)', cloudLit: 'rgba(255,180,100,.7)' }, 2],
    [{ ...SKY_NIGHT, hor: '#6a4a3a' }, 1]],
  weather: [['clear', 4], ['dust', 2]], slab: { top: ['#d0a878', '#b08858'], face: ['#b07a4a', '#6a4424'] }, hill: ['#c89a68', '#9a6a40'],
  roofs: [TOWN_ART.stronghold.roof, { hall: '#b8903a', dw: '#8a5a2a', util: '#6a5a3a', tower: '#4a2a1a', wall: '#8a6a3a' }, { hall: '#3a5a7a', dw: '#8a3a1a', util: '#7a5a34', tower: '#2a4a5a', wall: '#6a3a2a' }] };
