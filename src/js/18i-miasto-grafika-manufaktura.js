// ==================== MIASTO: MANUFAKTURA ==================================================
// Miasto wynalazców: hale z czerwonej cegły z dachami szedowymi, kominy z dymem, miedziane kopuły i zbiorniki, zębatki,
// wieże z cewkami iskier i hangary maszyn latających. Rysunki 2D (zapas, gdy arkusz 3D się wczytuje, i tryb pikselowy);
// docelowo scenę maluje tło AI z budowlami 3D (tools/grafika3d/budowle-manufaktura.js).
TOWN_ART.forge = {
  sky: ['#4a3a3a', '#a8705a', '#f0c08a'], far: ['#6a5a52', '#7a6a60'], back: ['#7a6a5e', '#5e5048'], mid: ['#8a7868', '#6a5a4c'], front: ['#968472', '#76644e'],
  path: ['#8a8078', '#5e5650'], wall: ['#a8543a', '#6e3424'], mortar: 'rgba(40,20,12,.45)', roof: { hall: '#4a4a56', dw: '#5a5a64', util: '#4a4a52', tower: '#b8703a', wall: '#3a3a42' },
  roofShape: 'gable', tex: 'bricks', glow: '#ffc070', door: '#1e140c', trim: '#c8a050',
};
const MZ2 = { brick: '#a8543a', brickD: '#6e3424', iron: '#3a3a42', ironL: '#5a5a64', copper: '#b8703a', patina: '#5a9a84', brass: '#c8a050', glass: '#9ad0e0', spark: '#8ae0ff', fire: '#ff9a40', slate: '#4a4a56' };
// --- klocki ---
function mzGear2D(c, cx, cy, r, col = MZ2.brass) { // zębatka: tarcza z zębami i piastą
  c.fillStyle = col; c.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rr = i % 2 ? r * 0.78 : r; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fill();
  c.fillStyle = shadeHex(col, -0.35); c.beginPath(); c.arc(cx, cy, r * 0.32, 0, TAU); c.fill(); c.fillStyle = shadeHex(col, 0.3); c.fillRect(cx - r * 0.6, cy - r * 0.62, r * 0.3, r * 0.12);
}
function mzStack2D(c, x, b, w, h, fx) { // komin fabryczny z żelaznymi opaskami i dymem
  fillPoly(c, [[x - w * 0.6, b], [x - w / 2, b - h], [x + w / 2, b - h], [x + w * 0.6, b]], MZ2.brickD); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + w * 0.15, b - h, w * 0.35, h);
  c.fillStyle = MZ2.iron; for (const f of [0.3, 0.62, 0.92]) c.fillRect(x - w * 0.6 + w * 0.1 * f, b - h * f, w * 1.2 - w * 0.2 * f, 2.4); c.fillRect(x - w * 0.65, b - h - 3, w * 1.3, 4);
  if (fx) fx.smokes.push([x, b - h - 6, 1]);
}
function mzFactory(c, A, x, b, w, h, teeth, fx, glow = A.glow) { // hala z cegły z dachem szedowym (przeszklone ząbki) i łukowymi oknami
  wallRect(c, A, x, b - h, w, h); c.fillStyle = shadeHex(MZ2.brickD, -0.2); c.fillRect(x - 2, b - h - 3, w + 4, 4);
  const tw = w / teeth; for (let i = 0; i < teeth; i++) { const tx = x + i * tw; fillPoly(c, [[tx, b - h - 3], [tx, b - h - 3 - tw * 0.55], [tx + tw, b - h - 3]], MZ2.slate); fillPoly(c, [[tx, b - h - 3], [tx, b - h - 3 - tw * 0.55], [tx + 3, b - h - 3]], MZ2.glass); }
  const n = Math.max(2, Math.round(w / 22)); for (let i = 0; i < n; i++) { const wx = x + (i + 0.5) * w / n - 4; c.fillStyle = glow; archPath(c, wx, b - h * 0.25, 8, h * 0.45); c.fill(); if (fx) fx.glows.push([wx + 4, b - h * 0.45, 9, glow]); }
}
function mzTank2D(c, x, b, w, h, col = MZ2.copper) { // zbiornik / kocioł z obręczami
  c.fillStyle = col; c.fillRect(x, b - h, w, h); c.beginPath(); c.ellipse(x + w / 2, b - h, w / 2, w * 0.18, 0, Math.PI, 0); c.fill();
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x + w * 0.62, b - h, w * 0.38, h); c.fillStyle = shadeHex(col, -0.3); for (const f of [0.25, 0.6]) c.fillRect(x, b - h * f, w, 2); c.fillStyle = shadeHex(col, 0.35); c.fillRect(x + w * 0.12, b - h + 3, 2, h - 6);
}
function mzCoil2D(c, x, b, h, fx, k = 1) { // wieżyczka z miedzianą cewką i kulą iskier
  c.fillStyle = MZ2.ironL; c.fillRect(x - 2 * k, b - h, 4 * k, h); c.fillStyle = MZ2.copper; for (let i = 0; i < 6; i++) c.fillRect(x - 5 * k + i * 0.3, b - h * 0.65 + i * 3 * k, 10 * k - i * 0.6, 1.8 * k);
  circ(c, x, b - h - 4 * k, 5 * k, '#d8f8ff'); circ(c, x, b - h - 4 * k, 3 * k, '#ffffff'); if (fx) fx.glows.push([x, b - h - 4 * k, 20 * k, MZ2.spark]);
}
function mzBolt2D(c, x0, y0, x1, y1, seed = 1) { const r = mulberry32(seed); c.strokeStyle = 'rgba(200,245,255,.9)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, y0);
  for (let i = 1; i < 6; i++) { const f = i / 6; c.lineTo(x0 + (x1 - x0) * f + (r() - 0.5) * 8, y0 + (y1 - y0) * f + (r() - 0.5) * 8); } c.lineTo(x1, y1); c.stroke(); }
const FORGE_ART = {
  hall(c, A, s, tier, col, fx) { // ceglany ratusz z zegarem; wyżej wieża zegarowa, miedziana kopuła, a na końcu Izba Wynalazców z patyną i wielką zębatką
    const { x, b, w, h } = s, bw = w * (0.56 + tier * 0.06), bx = x + (w - bw) / 2, bh = h * (0.36 + tier * 0.05), cx = x + w / 2;
    wallRect(c, A, bx, b - bh, bw, bh); fillPoly(c, [[bx - 4, b - bh], [cx, b - bh - h * 0.16], [bx + bw + 4, b - bh]], MZ2.slate);
    for (let i = 0; i < 4; i++) winArt(c, A, bx + 6 + i * (bw - 18) / 3, b - bh * 0.7, 6, 9, fx); doorArt(c, A, cx - 6, b, 12, 16); mzGear2D(c, cx, b - bh - 4, 6);
    if (tier >= 2) { const tx = bx - 12, th = h * (0.62 + tier * 0.06); wallRect(c, A, tx - 8, b - th, 16, th); fillPoly(c, [[tx - 10, b - th], [tx, b - th - 16], [tx + 10, b - th]], MZ2.slate); circ(c, tx, b - th + 10, 5, '#f0e8d0'); c.strokeStyle = '#2a2a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, b - th + 10); c.lineTo(tx, b - th + 6); c.moveTo(tx, b - th + 10); c.lineTo(tx + 3, b - th + 10); c.stroke(); }
    if (tier >= 3) hemiDome(c, cx, b - bh - h * 0.14, bw * 0.22, tier >= 4 ? MZ2.patina : MZ2.copper);
    if (tier >= 4) { mzGear2D(c, cx, b - bh - h * 0.36, 10); mzStack2D(c, bx + bw - 6, b - bh, 8, h * 0.5, fx); }
    bannerArt(c, bx + bw - 4, b - bh - 18, col);
  },
  fort(c, A, s, tier, col, fx) { // ceglany mur z żelazną kratą bramy i zębatką; potem baszty z miedzianymi hełmami i armatami; na końcu stalowa twierdza z kominami
    const { x, b, w, h } = s, cx = x + w / 2, mh = h * 0.34;
    if (tier >= 3) { const kw = w * 0.5, kh = h * 0.92; wallRect(c, A, cx - kw / 2, b - kh, kw, kh - mh); c.fillStyle = MZ2.ironL; c.fillRect(cx - kw * 0.42, b - kh, kw * 0.84, kh * 0.25); hemiDome(c, cx, b - kh, kw * 0.2, MZ2.patina);
      for (const dx of [-0.32, 0, 0.32]) mzStack2D(c, cx + dx * kw, b - kh + 6, 7, h * 0.3, fx); for (let i = 0; i < 3; i++) winArt(c, A, cx - kw * 0.3 + i * kw * 0.26, b - kh * 0.62, 6, 10, fx); }
    wallRect(c, A, x + 10, b - mh, w - 20, mh); crenel(c, A, x + 10, b - mh, w - 20);
    for (const tx of [x + 14, x + w - 14]) { const th = h * (tier >= 2 ? 0.66 : 0.48); wallRect(c, A, tx - 11, b - th, 22, th); if (tier >= 2) { hemiDome(c, tx, b - th, 12, MZ2.copper); c.fillStyle = MZ2.iron; c.fillRect(tx + (tx < cx ? -18 : 10), b - th * 0.55, 8, 3); } else crenel(c, A, tx - 11, b - th, 22); }
    c.fillStyle = '#14100c'; archPath(c, cx - 14, b, 28, mh + 10); c.fill(); c.strokeStyle = MZ2.ironL; c.lineWidth = 1.4; c.beginPath(); for (let i = -10; i <= 10; i += 5) { c.moveTo(cx + i, b - mh - 6); c.lineTo(cx + i, b); } c.stroke(); mzGear2D(c, cx, b - mh - 14, 8);
    bannerArt(c, x + 14, b - h * 0.7 - 16, col);
  },
  guild(c, A, s, tier, col, fx) { // laboratorium z oszkloną kopułą obserwatorium; kolejne poziomy dokładają cewki, szklarnię, lunetę i iglicę z wyładowaniem
    const { x, b, w, h } = s, cx = x + w / 2, bw = w * 0.56, bh = h * 0.38; wallRect(c, A, cx - bw / 2, b - bh, bw, bh); doorArt(c, A, cx - 5, b, 10, 14);
    c.fillStyle = 'rgba(160,220,240,.85)'; c.beginPath(); c.ellipse(cx, b - bh, bw * 0.3, bh * 0.5, 0, Math.PI, 0); c.fill(); c.strokeStyle = MZ2.brass; c.lineWidth = 1; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(cx - bw * 0.3 + i * bw * 0.12, b - bh); c.lineTo(cx, b - bh - bh * 0.5); c.stroke(); }
    fx.glows.push([cx, b - bh - 8, 22, '#c0f0ff']);
    if (tier >= 2) mzCoil2D(c, cx - bw * 0.5 - 6, b, h * 0.5, fx);
    if (tier >= 3) { c.fillStyle = 'rgba(160,220,240,.7)'; c.fillRect(cx + bw / 2, b - bh * 0.6, w * 0.18, bh * 0.6); for (let i = 0; i < 3; i++) circ(c, cx + bw / 2 + 5 + i * 6, b - 6, 2.4, ['#80ff90', '#ffa0f0', '#80d0ff'][i]); }
    if (tier >= 4) { c.strokeStyle = MZ2.brass; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, b - bh - 6); c.lineTo(cx + 18, b - bh - 22); c.stroke(); }
    if (tier >= 5) { mzCoil2D(c, cx + bw * 0.5 + 10, b, h * 0.86, fx, 1.3); mzBolt2D(c, cx - bw * 0.5 - 6, b - h * 0.5 - 4, cx + bw * 0.5 + 10, b - h * 0.86 - 5, 5); }
  },
  tavern(c, A, s, tier, col, fx) { // pub „Pod Zębatką”: ceglany dom, komin, szyld z kołem zębatym, beczki
    const { x, b, w, h } = s, bw = w * 0.62, bx = x + w * 0.16, bh = h * 0.4; wallRect(c, A, bx, b - bh, bw, bh); roofArt(c, A, MZ2.slate, bx, b - bh, bw, h * 0.2); mzStack2D(c, bx + bw * 0.75, b - bh - 4, 6, h * 0.2, fx);
    for (let i = 0; i < 2; i++) winArt(c, A, bx + 8 + i * (bw - 22), b - bh * 0.7, 7, 9, fx); doorArt(c, A, bx + bw / 2 - 5, b, 10, 14); mzGear2D(c, bx + bw + 6, b - bh * 0.55, 5); barrel(c, x + w * 0.9, b); barrel(c, x + 8, b);
  },
  market(c, A, s, tier, col, fx) { // hala targowa z żeliwa i szkła nad straganami
    const { x, b, w, h } = s, cx = x + w / 2, hw = w * 0.42, top = b - h * 0.5; c.fillStyle = MZ2.iron; for (let i = 0; i < 5; i++) c.fillRect(cx - hw + i * hw / 2 - 1, top, 2.4, b - top);
    c.fillStyle = 'rgba(160,220,240,.75)'; c.beginPath(); c.ellipse(cx, top, hw + 4, h * 0.22, 0, Math.PI, 0); c.fill(); c.strokeStyle = MZ2.ironL; c.lineWidth = 1.2; c.stroke(); for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i * hw / 3.5, top); c.lineTo(cx + i * hw / 5, top - h * 0.2); c.stroke(); }
    for (let i = 0; i < 3; i++) { const sx = cx - hw * 0.7 + i * hw * 0.7; c.fillStyle = ['#a03a2a', '#3a6a8a', '#c8a040'][i]; c.fillRect(sx - 9, b - 16, 18, 4); c.fillStyle = '#6a4a2a'; c.fillRect(sx - 8, b - 12, 16, 12); } crate(c, x + w * 0.9, b, 10);
  },
  smith(c, A, s, tier, col, fx) { // kuźnia: hala z żarem we wrotach i kominem, kowadło
    const { x, b, w, h } = s; mzFactory(c, A, x + w * 0.1, b, w * 0.66, h * 0.42, 3, fx, '#ff9a40'); mzStack2D(c, x + w * 0.2, b - h * 0.42, 7, h * 0.4, fx);
    c.fillStyle = '#ff8a30'; c.fillRect(x + w * 0.38, b - h * 0.3, w * 0.2, h * 0.3); fx.glows.push([x + w * 0.48, b - h * 0.15, 24, MZ2.fire]); fillPoly(c, [[x + w * 0.82, b - 8], [x + w * 0.96, b - 8], [x + w * 0.93, b - 4], [x + w * 0.85, b - 4]], '#3a3a42'); c.fillStyle = '#3a3a42'; c.fillRect(x + w * 0.87, b - 4, 4, 4);
  },
  silo(c, A, s, tier, col, fx) { // gazometr i zbiorniki, hałda węgla
    const { x, b, w, h } = s; mzTank2D(c, x + w * 0.08, b, w * 0.4, h * 0.55, MZ2.copper); mzTank2D(c, x + w * 0.54, b, w * 0.22, h * 0.4, MZ2.brass); mzTank2D(c, x + w * 0.78, b, w * 0.16, h * 0.3, MZ2.copper);
    fillPoly(c, [[x + w * 0.4, b], [x + w * 0.52, b - 10], [x + w * 0.64, b]], '#1e1c1c');
  },
  special(c, A, s, tier, col, fx) { // Warsztat machin: suwnica na żelaznych słupach nad taśmą z machinami, wielkie zębatki
    const { x, b, w, h } = s, top = b - h * 0.62; c.fillStyle = MZ2.iron; for (const fx0 of [0.08, 0.92]) c.fillRect(x + w * fx0 - 2, top, 4, b - top); c.fillRect(x + w * 0.06, top - 4, w * 0.88, 5);
    c.strokeStyle = MZ2.ironL; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 8; i++) { c.moveTo(x + w * (0.06 + i * 0.11), top); c.lineTo(x + w * (0.06 + (i + 1) * 0.11), top - 4); } c.stroke();
    c.fillStyle = MZ2.brass; c.fillRect(x + w * 0.5 - 6, top + 1, 12, 5); c.strokeStyle = '#2a2a2a'; c.beginPath(); c.moveTo(x + w * 0.5, top + 6); c.lineTo(x + w * 0.5, b - 22); c.stroke();
    c.fillStyle = MZ2.ironL; c.fillRect(x + w * 0.1, b - 5, w * 0.8, 5); drawCreature(c, 'ballista', x + w * 0.3, b - 5, 0.6, -1, 0); drawCreature(c, 'ammoCart', x + w * 0.62, b - 5, 0.6, -1, 0);
    mzGear2D(c, x + w * 0.16, top + 18, 10); mzGear2D(c, x + w * 0.3, top + 12, 6, MZ2.copper);
  },
  dw1(c, A, s, tier, col, fx) { // warsztat czeladników z szyldem-kołem; wyżej żuraw i parowozownia
    const { x, b, w, h } = s, bw = w * 0.5, bx = x + w * 0.1, bh = h * 0.36; wallRect(c, A, bx, b - bh, bw, bh); roofArt(c, A, MZ2.slate, bx, b - bh, bw, h * 0.16); winArt(c, A, bx + 6, b - bh * 0.7, 6, 8, fx); doorArt(c, A, bx + bw - 16, b, 10, 13); mzGear2D(c, bx + bw / 2, b - bh - 4, 5);
    if (tier >= 2) { c.fillStyle = MZ2.iron; c.fillRect(x + w * 0.78, b - h * 0.72, 3, h * 0.72); c.fillRect(x + w * 0.5, b - h * 0.72, w * 0.3, 3); crate(c, x + w * 0.56, b, 9); }
    if (tier >= 3) { mzTank2D(c, x + w * 0.66, b, w * 0.2, h * 0.2, '#3a3a42'); mzStack2D(c, x + w * 0.76, b - h * 0.2, 4, h * 0.12, fx); }
    drawCreature(c, tier >= 3 ? 'machinist' : tier >= 2 ? 'mechanic' : 'apprentice', x + w * 0.86, b, 0.8, -1, 0);
  },
  dw2(c, A, s, tier, col, fx) { // prochownia z grubymi murami i piorunochronem, beczki; wyżej strzelnica z tarczami i piramidy kul
    const { x, b, w, h } = s, bw = w * 0.5, bx = x + w * 0.12, bh = h * 0.38; c.fillStyle = '#8a8078'; c.fillRect(bx, b - bh, bw, bh); fillPoly(c, [[bx - 3, b - bh], [bx + bw / 2, b - bh - h * 0.16], [bx + bw + 3, b - bh]], MZ2.slate);
    c.fillStyle = MZ2.copper; c.fillRect(bx + bw / 2 - 0.6, b - bh - h * 0.36, 1.2, h * 0.2); doorArt(c, A, bx + bw / 2 - 5, b, 10, 13); barrel(c, x + w * 0.72, b); barrel(c, x + w * 0.82, b);
    if (tier >= 2) for (let i = 0; i < 2; i++) { circ(c, x + w * (0.66 + i * 0.16), b - h * 0.62, 5, '#e8e0d0'); circ(c, x + w * (0.66 + i * 0.16), b - h * 0.62, 2, '#a02a20'); }
    if (tier >= 3) for (let k = 0; k < 3; k++) for (let i = 0; i < 3 - k; i++) circ(c, x + w * 0.1 + i * 6 + k * 3, b - 3 - k * 5, 3, '#2a2a2a');
    drawCreature(c, tier >= 3 ? 'grenadier' : tier >= 2 ? 'musketeer' : 'handgunner', x + w * 0.9, b, 0.85, -1, 0);
  },
  dw3(c, A, s, tier, col, fx) { // psiarnia zębatek: hala montażowa z bramą i taśmą; wyżej kocioł, a w burzowej dwie cewki
    const { x, b, w, h } = s; mzFactory(c, A, x + w * 0.08, b, w * 0.6, h * 0.4, 3, fx); c.fillStyle = '#1a1410'; c.fillRect(x + w * 0.3, b - h * 0.26, w * 0.16, h * 0.26);
    if (tier >= 2) { mzTank2D(c, x + w * 0.72, b, w * 0.14, h * 0.32); mzStack2D(c, x + w * 0.2, b - h * 0.4, 5, h * 0.3, fx); }
    if (tier >= 3) { mzCoil2D(c, x + w * 0.06, b, h * 0.5, fx, 0.8); mzCoil2D(c, x + w * 0.94, b, h * 0.5, fx, 0.8); }
    drawCreature(c, tier >= 3 ? 'stormHound' : tier >= 2 ? 'steelHound' : 'clockHound', x + w * 0.62, b, 0.8, -1, 0);
  },
  dw4(c, A, s, tier, col, fx) { // hangar z blachy falistej z wielkimi wrotami; wyżej lądowisko wiropłatów; dok bombowców
    const { x, b, w, h } = s, cx = x + w * 0.4, hw = w * 0.32, hh = h * 0.5; c.fillStyle = MZ2.ironL; c.beginPath(); c.ellipse(cx, b, hw, hh, 0, Math.PI, 0); c.fill();
    c.strokeStyle = MZ2.copper; c.lineWidth = 1.4; for (let i = 1; i < 5; i++) { c.beginPath(); c.ellipse(cx, b, hw * i / 5, hh, 0, Math.PI, Math.PI * 1.02 + (i * 0.002)); c.stroke(); }
    c.fillStyle = '#14100c'; c.beginPath(); c.ellipse(cx, b, hw * 0.55, hh * 0.62, 0, Math.PI, 0); c.fill();
    if (tier >= 2) { c.fillStyle = MZ2.iron; for (const dx of [0.78, 0.94]) c.fillRect(x + w * dx - 1, b - h * 0.62, 2, h * 0.62); c.fillRect(x + w * 0.74, b - h * 0.64, w * 0.24, 3); }
    drawCreature(c, tier >= 3 ? 'bomber' : tier >= 2 ? 'gyrocopter' : 'ornithopter', x + w * 0.42, b - h * 0.12, 0.7, -1, 0.3);
  },
  dw5(c, A, s, tier, col, fx) { // iskrownia: ceglana wieża z cewką; wieża cewek z łukiem; iglica burz
    const { x, b, w, h } = s, cx = x + w * 0.38, th = h * (0.5 + tier * 0.06); wallRect(c, A, cx - 10, b - th, 20, th); c.fillStyle = shadeHex(MZ2.brickD, -0.2); c.fillRect(cx - 12, b - th - 3, 24, 4); mzCoil2D(c, cx, b - th - 3, h * 0.22, fx, 1.1); doorArt(c, A, cx - 5, b, 10, 13);
    if (tier >= 2) { wallRect(c, A, x + w * 0.66, b - h * 0.42, 12, h * 0.42); mzCoil2D(c, x + w * 0.66 + 6, b - h * 0.42, h * 0.16, fx, 0.8); mzBolt2D(c, cx, b - th - h * 0.22 - 8, x + w * 0.66 + 6, b - h * 0.58 - 4, 3); }
    if (tier >= 3) { fillPoly(c, [[x + w * 0.08, b], [x + w * 0.12, b - h * 0.8], [x + w * 0.16, b]], MZ2.ironL); mzBolt2D(c, x + w * 0.12, b - h * 0.8, cx, b - th - h * 0.22 - 8, 9); }
    drawCreature(c, tier >= 3 ? 'stormLord' : tier >= 2 ? 'sparkMaster' : 'sparkwright', x + w * 0.88, b, 0.85, -1, 0);
  },
  dw6(c, A, s, tier, col, fx) { // kotłownia: hala z kotłami i kominem, żar we wrotach; walcownia; kuźnia gromów
    const { x, b, w, h } = s; mzFactory(c, A, x + w * 0.04, b, w * 0.62, h * 0.38, 4, fx, '#ff9a40'); mzStack2D(c, x + w * 0.12, b - h * 0.38, 7, h * 0.46, fx); for (const dx of [0.7, 0.84]) mzTank2D(c, x + w * dx, b, w * 0.12, h * 0.34);
    c.fillStyle = '#ff8030'; c.fillRect(x + w * 0.28, b - h * 0.24, w * 0.16, h * 0.24); fx.glows.push([x + w * 0.36, b - h * 0.12, 20, MZ2.fire]);
    if (tier >= 3) { mzCoil2D(c, x + w * 0.3, b - h * 0.42, h * 0.16, fx, 0.7); mzCoil2D(c, x + w * 0.5, b - h * 0.42, h * 0.16, fx, 0.7); }
    drawCreature(c, tier >= 3 ? 'stormSuit' : tier >= 2 ? 'ironSuit' : 'steamSuit', x + w * 0.58, b, 0.7, -1, 0);
  },
  dw7(c, A, s, tier, col, fx) { // wielka odlewnia: ogromna hala z kominami, suwnica nad rusztowaniem z kolosem, kadź płynnego metalu
    const { x, b, w, h } = s; mzFactory(c, A, x + w * 0.02, b - h * 0.08, w * 0.56, h * 0.46, 4, fx, '#ff9a40'); for (const dx of [0.12, 0.46]) mzStack2D(c, x + w * dx, b - h * 0.54, 8, h * 0.4, fx);
    c.fillStyle = MZ2.iron; for (const dx of [0.62, 0.96]) c.fillRect(x + w * dx - 1.5, b - h * 0.9, 3, h * 0.9); c.fillRect(x + w * 0.6, b - h * 0.92, w * 0.38, 4);
    c.fillStyle = '#6a4a2a'; for (const f of [0.35, 0.65]) c.fillRect(x + w * 0.62, b - h * f, w * 0.34, 2);
    c.fillStyle = '#3a3a42'; c.fillRect(x + w * 0.04, b - 10, 16, 10); c.fillStyle = '#ffb040'; c.fillRect(x + w * 0.04 + 2, b - 10, 12, 2); fx.glows.push([x + w * 0.04 + 8, b - 10, 16, MZ2.fire]);
    drawCreature(c, tier >= 3 ? 'forgeTitan' : tier >= 2 ? 'brassColossus' : 'colossus', x + w * 0.79, b, 0.62, -1, 0);
  },
};
BUILD_ART.forge = FORGE_ART;
FORGE_ART.grail = grailArt; // budowla Graala (wspólny rysunek 2D; w 3D Wieczny Silnik)
TOWN_LAYOUTS.forge = {
  sky: { top: '#3a3a52', mid: '#a8786a', hor: '#f0c08a', sun: [420, 80], cloudDark: 'rgba(70,60,60,.6)', cloudLit: 'rgba(250,210,170,.6)' },
  mountains: ['#6a5a52', '#4a3e38'], forest: ['#4a4a3a', '#3e3e32', '#545440'],
  ground: ['#8a7a68', '#6a5a4c', '#4a3e34'], haze: '#b8907a', desat: 0.12, tuft: ['rgba(40,30,20,.3)', 'rgba(220,200,170,.2)'],
  slots: TOWN_LAYOUTS.haven.slots, birds: true, birdCol: 'rgba(40,30,30,.8)',
};
TOWN_STYLE.forge = { walls: ['spiked', 0.45], masonry: true, water: 'glow', lamp: 'brazier', sand: '#7a6a5a', slab: { top: ['#8a7a68', '#6a5a4c'], face: ['#6a5040', '#3e2e24'] }, hill: ['#7a6a5a', '#4e4036'] };
TOWN_BIOME.forge = { ground: 'dead', far: 'mesas', road: 'cobble', lane: 'cobble', mainW: 0.85, laneW: 18, wiggle: 0.12, tufts: 0.3, tuft: ['rgba(40,30,20,.4)', 'rgba(200,180,150,.18)'],
  folk: ['dwarf', 'peasant', 'dwarf'], guard: 'soldier', plaza: '#7a7068' };
// --- Manufaktura: płaskowyż nad doliną kominów, odlewnia w głębi, kanał z płynnym metalem, mur z cegły ---
TOWN_SCENES.forge = {
  pj: { hor: 90, d: 285 },
  sky: TOWN_LAYOUTS.forge.sky,
  slabs: [{ x0: -120, x1: 380, Z0: 2.2, Z1: 2.9, e: 90, jag: 4, top: ['#8a7868', '#6a5a4c'], face: ['#6e4a36', '#3a2618'] }],
  hills: [{ X: -470, Z: 2.75, rx: 260, h: 64, flat: 0.25, rock: true, cols: ['#6a5a52', '#3e3430'] }],
  lakes: [{ X: -250, Z: 1.4, rx: 100, rz: 0.09 }],
  entryX: 20,
  slots: [
    atPx(330, 1.32, { k: 1.1 }), atPx(390, 2.5, { k: 1.45 }), atPx(170, 2.2), [-470, 0, { hill: 0, k: 1.2 }], atPx(545, 2.15), atPx(255, 2.05), atPx(500, 1.45), atPx(60, 2.1),
    atPx(420, 0.98), atPx(560, 1.75), atPx(70, 1.02), atPx(220, 1.0, { flip: true }), atPx(530, 1.05), atPx(150, 1.55), atPx(440, 1.62), atPx(270, 1.55),
  ],
  props: [['rock', -560, 1.3, 1.2], ['rock', 640, 1.5, 1.2], ['rock', 700, 1.6]],
  weather: {}, birds: true, birdCol: 'rgba(40,30,30,.8)',
};
