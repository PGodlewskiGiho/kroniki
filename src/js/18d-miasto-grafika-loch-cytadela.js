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
function caveMouth(c, x, b, w, h, rock, inner, fx) { // skała z wejściem do pieczary (świeci od środka)
  rockMound(c, x, b, w, h, rock, Math.round(w + h));
  const cx = x + w * 0.45, mw = w * 0.34, mh = h * 0.55;
  c.fillStyle = '#08060c'; c.beginPath(); c.moveTo(cx - mw / 2, b); c.quadraticCurveTo(cx - mw / 2, b - mh, cx, b - mh); c.quadraticCurveTo(cx + mw / 2, b - mh, cx + mw / 2, b); c.closePath(); c.fill();
  if (inner && fx) fx.glows.push([cx, b - mh * 0.35, mw * 0.9, inner]);
  if (inner) { c.fillStyle = inner; c.globalAlpha = 0.35; c.beginPath(); c.ellipse(cx, b - 2, mw * 0.36, 4, 0, 0, TAU); c.fill(); c.globalAlpha = 1; }
  return cx;
}
const DUNGEON_ART = {
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
