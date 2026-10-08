// ==================== EKRAN: BITWA =====================================================
// Rysuje bitwę i obsługuje ruchy gracza. Logika jest w BITWA: ZASADY; ekran odtwarza efekty z B.fx.
const HEX = { w: 54, h: 62, row: 46, x0: 36, y0: 52 };
// Miejsce bohatera strony (x, y stóp, zwrot) i skala jego rysunku
const HERO_BATTLE_K = 0.9, heroSpot = side => side ? [W - 22, 122, -1] : [22, 122, 1];
const hexCenter = (x, y) => [HEX.x0 + x * HEX.w + (y & 1 ? HEX.w / 2 : 0) + HEX.w / 2, HEX.y0 + y * HEX.row + HEX.h / 2];
// Środek oddziału na ekranie: duży stwór stoi między przodem a zadem (pół heksu w stronę zadu)
const unitPos = (u, x = u.x, y = u.y) => { const [cx, cy] = hexCenter(x, y); return [cx + (isWide(u) ? tailDx(u) * HEX.w / 2 : 0), cy]; };
// Paszcza zionącego stwora (px logiczne) przy zwrocie d: z arkusza (m: punkt paszczy w klatce ataku, wypalony z modelu) albo szacunkowo
function mouthPos(u, d) {
  const A = unitArt(u.cid), L = CREATURES[u.cid].look, gy = u.py + 14 - (u.lift || 0);
  if (A && A.m) return [u.px + d * A.m[0] * A.u, gy + A.m[1] * A.u];
  const k = 32 * (L.size || 1); return [u.px + d * 0.9 * k, gy - 1.3 * k];
}
// Barwa zionięcia: z wyglądu stwora (kwas, lód, blask), domyślnie ogień
const breathColor = cid => { const L = CREATURES[cid].look; return L.breathCol || L.breath || (L.bony ? '#9af0c8' : '#ff7a1a'); };
function hexPath(ctx, x, y, inset = 0) {
  const [cx, cy] = hexCenter(x, y), r = HEX.h / 2 - inset, rx = HEX.w / 2 - inset; ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(cx + Math.cos(a) * rx / Math.cos(Math.PI / 6), cy + Math.sin(a) * r); }
  ctx.closePath();
}
function hexAt(px, py) {
  let best = null;
  for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) { const [cx, cy] = hexCenter(x, y), d = (cx - px) ** 2 + (cy - py) ** 2; if (!best || d < best.d) best = { x, y, d }; }
  return best && best.d < (HEX.w * 0.58) ** 2 ? best : null;
}
const PAVE_DX = 40; // bruk dziedzińca zaczyna się tyle px logicznych za licem muru (paveX: granica na wysokości py, ukośna jak mur)
const paveX = py => wallLineX(py) + PAVE_DX;
// Tło bitwy w stylu mapy: teren z palety TERRAINS, piksele 2×2, ta sama korekcja barw
const BATTLE_BG_NAMES = ['woda', 'trawa', 'ziemia', 'piasek', 'snieg', 'bagno', 'nierowny', 'lawa'];
function paintBattleBg(c, terr, fac, bare = false) { // bare: samo pole bez siatki i panelu (szkic dla tła malowanego, tools/tla-ai/szkic-bitwy.js)
  // D = gęstość pikseli: teren liczony w drobnych pikselach (fx, fy), wzory w dawnych pikselach (x, y = połowa px logicznych)
  const w = W / 2, h = H / 2, fw = Math.round(w * PXD), fh = Math.round(h * PXD), D = fw / w, off = document.createElement('canvas'); off.width = fw; off.height = fh;
  const g = off.getContext('2d'), img = g.createImageData(fw, fh), P = TPAL[terr].map(gradeRgb), sky = [[40, 44, 62], [70, 72, 92]];
  for (let fy = 0; fy < fh; fy++) for (let fx = 0; fx < fw; fx++) {
    const o = (fy * fw + fx) * 4, x = Math.floor(fx / D), y = Math.floor(fy / D), xs = fx / D, ys = fy / D; let col;
    if (y < 22) col = sky[(y + (x & 1)) % 11 < 6 ? 0 : 1];
    else if (fac && x * 2 > paveX(y * 2) + Math.round(vnoise2(0, y / 4, 3) * 6)) { // bruk dziedzińca za murem
      const pv = SIEGE_PAVE[fac] || SIEGE_PAVE.haven, row = Math.floor(y / 5), cx = x + (row % 2) * 4, edge = y % 5 === 0 || cx % 8 === 0, k = thash(Math.floor(cx / 8), row, 7) % 3;
      col = edge ? pv[1].map(v => v * 0.8) : k === 0 ? pv[1] : k === 1 ? pv[0] : pv[0].map((v, i) => (v + pv[1][i]) / 2);
    } else { const n = vnoise2(xs / 9, ys / 6, 17) * 0.7 + vnoise2(xs / 3, ys / 3, 5) * 0.3 + (PIXEL_ART ? (BAYER4[(fy & 3) * 4 + (fx & 3)] / 16 - 0.5) * 0.18 : 0);
      if (PIXEL_ART) col = P[n < 0.32 ? 0 : n < 0.62 ? 1 : n < 0.8 ? 2 : 3]; else { const q = clamp((n - 0.2) / 0.7, 0, 1) * 3, i = Math.min(2, Math.floor(q)); col = shadeRgb(mixRgb(P[i], P[i + 1], q - i), 0.95 + vnoise2(xs / 1.3, ys / 1.3, 9) * 0.1); } } // gładko: płynne przejścia barw
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); g.setTransform(D, 0, 0, D, 0, 0); battleDecor(g, terr, w, h, fac); c.imageSmoothingEnabled = !PIXEL_ART; c.drawImage(off, 0, 0, W, H);
  const pim = !bare && BATTLE_BG_IMG[BATTLE_BG_NAMES[terr]]; // tło malowane przez AI (pole bitwy bez siatki); przy oblężeniu dziedziniec zamku maluje paintCourtyard
  if (pim && pim._ok) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(pim, 0, 0, W, 490); }
  const TX = !PIXEL_ART && !bare && TERRAIN_TEX[TEX_NAME[terr || 1]]; // faktura z tekstur terenu mapy (widok z góry) i miękkie plamy światła: pole bitwy nie jest płaskie
  if (TX) { c.save(); c.beginPath(); c.rect(0, 44, W, 446); c.clip();
    const pat = c.createPattern(TX.cv, 'repeat'); pat.setTransform(new DOMMatrix().scale(1.15 / c.getTransform().a)); // ostra tekstura 512 px w rozdzielczości ekranu (piksel tekstury ≈ piksel ekranu)
    const fade = c.createLinearGradient(0, 44, 0, 110); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)'); // u góry przejście w malowany horyzont
    const tmp = document.createElement('canvas'); tmp.width = c.canvas.width; tmp.height = c.canvas.height; const tg2 = tmp.getContext('2d'); tg2.setTransform(c.getTransform());
    tg2.fillStyle = pat; tg2.fillRect(0, 44, W, 446); tg2.globalCompositeOperation = 'destination-in'; tg2.fillStyle = fade; tg2.fillRect(0, 44, W, 446);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.85; c.drawImage(tmp, 0, 0); c.restore();
    { const n = document.createElement('canvas'); n.width = n.height = 128; const ng = n.getContext('2d'), id = ng.createImageData(128, 128), rr2 = mulberry32(4242); // ziarno w pikselach ekranu
      for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (rr2() - 0.5) * 70; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } ng.putImageData(id, 0, 0);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.22; c.fillStyle = c.createPattern(n, 'repeat'); c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); }
    const r = mulberry32(terr * 977 + 13); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 1;
    for (let i = 0; i < 9; i++) { const x = r() * W, y = 60 + r() * 420, rad = 60 + r() * 140, lite = r() < 0.5, g = c.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, lite ? 'rgba(255,240,200,.55)' : 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    c.globalCompositeOperation = 'source-over'; const v = c.createLinearGradient(0, 44, 0, 490); v.addColorStop(0, 'rgba(0,0,0,.18)'); v.addColorStop(0.25, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.22)'); c.fillStyle = v; c.fillRect(0, 44, W, 446); // głębia: ciemniej przy horyzoncie i u dołu
    c.restore(); }
  if (fac && !bare && !PIXEL_ART) paintCourtyard(c, fac);
  if (bare) return;
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1;
  for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) { hexPath(c, x, y, 1); c.stroke(); }
  if (PIXEL_ART) { stoneFill(c, 0, 490, W, 110); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, 38); return; }
  stoneFill(c, 0, 490, W, 110); insetBox(c, 10, 498, 456, 94, 11); // panel dowodzenia: drewno, wnęka na podpowiedź i dziennik
  const tg = c.createLinearGradient(0, 0, 0, 40); tg.addColorStop(0, 'rgba(10,6,3,.92)'); tg.addColorStop(1, 'rgba(10,6,3,.7)'); c.fillStyle = tg; c.fillRect(0, 0, W, 38); // pasek górny
  for (const y0 of [38, 487]) { const g = c.createLinearGradient(0, y0, 0, y0 + 3); g.addColorStop(0, '#f0d080'); g.addColorStop(1, '#6a4814'); c.fillStyle = g; c.fillRect(0, y0, W, 3); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, y0 + 3, W, 1); } // złote listwy
}
// Dziedziniec oblężonego zamku w charakterze frakcji (w pełnej rozdzielczości warstwy): bruk (Przystań), ośnieżony marmur (Akademia),
// bruk z kośćmi i zieloną mgłą (Kurhan), obsydian z lawą w szczelinach (Inferno), dno pieczary z kryształami (Loch),
// mech i trawa ze ścieżką (Knieja), błoto z kładką (Cytadela), ubita ziemia ze słomą (Twierdza). Do tego cień muru i plamy światła.
const COURTYARD = { haven: 'cobble', academy: 'snow', barrow: 'grave', inferno: 'obsidian', dungeon: 'cave', sylvan: 'grass', fortress: 'mud', stronghold: 'dirt' };
function paintCourtyard(c, fac) {
  const kind = COURTYARD[fac] || 'cobble', pv = SIEGE_PAVE[fac] || SIEGE_PAVE.haven, y0 = 41, x0 = paveX(y0) - 4, w = W - x0, h = 449, r = mulberry32(fac.length * 131 + 7);
  const rgb = (a, k = 1, al = 1) => `rgba(${a.map(v => Math.round(clamp(v * k, 0, 255))).join(',')},${al})`, blob = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  const glow = (x, y, rad, col) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  c.save(); c.beginPath(); c.moveTo(x0, y0); c.lineTo(W, y0); c.lineTo(W, y0 + h); c.lineTo(paveX(y0 + h) - 4, y0 + h); c.closePath(); c.clip(); // granica ukośna jak mur
  if (['cobble', 'snow', 'grave', 'obsidian'].includes(kind)) { // kamienie w rzędach, jaśniejszy wierzch, cień od dołu, ciemne spoiny
    c.fillStyle = rgb(pv[1], 0.62); c.fillRect(x0, y0, w, h); const big = kind === 'snow' || kind === 'obsidian';
    for (let y = y0 - 4, row = 0; y < y0 + h; row++) {
      const sh = (big ? 14 : 9) + r() * 4; let x = x0 - 6 - (row % 2) * 7;
      while (x < x0 + w) {
        const sw = (big ? 18 : 11) + r() * 10, t = r(), base = pv[0].map((v, i) => v + (pv[1][i] - v) * t), k = 0.86 + r() * 0.22, rx = x + 0.9, ry = y + 0.9, ww = sw - 1.8, hh = sh - 1.8;
        c.fillStyle = rgb(base, k); rr(c, rx, ry, ww, hh, big ? 1.5 : 3); c.fill();
        c.fillStyle = rgb(base, k * 1.12); rr(c, rx + 1, ry + 0.6, ww - 2, hh * 0.42, 2.5); c.fill();
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(rx + 1.5, ry + hh - 1.6, ww - 3, 1.6);
        if (kind === 'cobble' && r() < 0.12) { c.fillStyle = 'rgba(80,110,50,.35)'; c.fillRect(rx - 0.5, ry + hh * r(), 2.5, 2); }
        if (kind === 'obsidian' && r() < 0.35) { c.strokeStyle = 'rgba(255,110,30,.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(rx + ww, ry); c.lineTo(rx + ww + 0.5, ry + hh); c.stroke(); } // lawa w szczelinie
        x += sw;
      }
      y += sh;
    }
    if (kind === 'snow') { for (let i = 0; i < 14; i++) blob(x0 + r() * w, y0 + r() * h, 14 + r() * 30, 6 + r() * 10, `rgba(250,252,255,${0.55 + r() * 0.3})`); for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(x0 + r() * w, y0 + r() * h, 1.2, 1.2); } }
    if (kind === 'grave') {
      for (let i = 0; i < 6; i++) glow(x0 + 20 + r() * (w - 40), y0 + 30 + r() * (h - 60), 40 + r() * 40, 'rgba(110,220,130,.18)');
      for (let i = 0; i < 4; i++) { const x = x0 + 30 + r() * (w - 60), y = y0 + 40 + r() * (h - 80); blob(x + 3, y + 22, 12, 4, 'rgba(0,0,0,.35)'); c.fillStyle = '#6e6878'; rr(c, x - 7, y, 14, 22, 6); c.fill(); c.fillStyle = '#8a8496'; c.fillRect(x - 5, y + 3, 10, 2); c.fillRect(x - 1, y + 6, 2, 9); c.fillRect(x - 4, y + 8, 8, 2); } // nagrobki
      for (let i = 0; i < 14; i++) { const x = x0 + r() * w, y = y0 + r() * h, a = r() * Math.PI; c.strokeStyle = '#d8d0bc'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); c.stroke(); } // kości
    }
    if (kind === 'obsidian') for (let i = 0; i < 6; i++) glow(x0 + r() * w, y0 + r() * h, 30 + r() * 40, 'rgba(255,90,20,.22)');
  } else if (kind === 'cave') { // dno pieczary: skała, kryształy, świecące grzyby
    c.fillStyle = '#2e2a36'; c.fillRect(x0, y0, w, h);
    for (let i = 0; i < 90; i++) { const v = 0.7 + r() * 0.6; blob(x0 + r() * w, y0 + r() * h, 8 + r() * 22, 5 + r() * 12, rgb([62, 56, 74], v, 0.9)); }
    for (let i = 0; i < 7; i++) { const x = x0 + 20 + r() * (w - 40), y = y0 + 30 + r() * (h - 60); glow(x, y - 6, 30, 'rgba(170,90,240,.35)');
      for (let k = 0; k < 4; k++) { const dx = (k - 1.5) * 5, hh = 10 + r() * 14; c.fillStyle = '#8a4ac8'; c.beginPath(); c.moveTo(x + dx - 3, y); c.lineTo(x + dx + (r() - 0.5) * 3, y - hh); c.lineTo(x + dx + 3, y); c.fill(); c.fillStyle = 'rgba(220,180,255,.7)'; c.fillRect(x + dx, y - hh * 0.8, 1.2, hh * 0.6); } }
    for (let i = 0; i < 14; i++) { const x = x0 + r() * w, y = y0 + r() * h; glow(x, y, 9, 'rgba(120,240,220,.5)'); blob(x, y, 2.4, 1.6, '#9af8e8'); }
  } else if (kind === 'grass') { // mech i trawa, kamienna ścieżka, opadłe liście
    const g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#3e6a2e'); g.addColorStop(1, '#4e7e38'); c.fillStyle = g; c.fillRect(x0, y0, w, h);
    for (let i = 0; i < 900; i++) { const x = x0 + r() * w, y = y0 + r() * h; c.strokeStyle = r() < 0.5 ? 'rgba(120,170,70,.6)' : 'rgba(40,80,30,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); c.stroke(); }
    for (let y = y0 + 10, k = 0; y < y0 + h; y += 26, k++) { const x = x0 + w * 0.45 + Math.sin(k * 0.9) * 30; blob(x + 2, y + 3, 13, 7, 'rgba(0,0,0,.25)'); blob(x, y, 13, 7, '#8e8a78'); blob(x - 2, y - 2, 9, 4, '#a8a490'); }
    for (let i = 0; i < 40; i++) blob(x0 + r() * w, y0 + r() * h, 2.6, 1.4, ['#c8902e', '#a8662a', '#d8b040'][i % 3]);
  } else if (kind === 'mud') { // błoto, kałuże, drewniana kładka, trzciny
    c.fillStyle = '#4e4028'; c.fillRect(x0, y0, w, h);
    for (let i = 0; i < 60; i++) blob(x0 + r() * w, y0 + r() * h, 10 + r() * 24, 5 + r() * 10, rgb([96, 78, 46], 0.7 + r() * 0.5, 0.6));
    for (let i = 0; i < 7; i++) { const x = x0 + r() * w, y = y0 + r() * h, rx = 16 + r() * 22; blob(x, y, rx, rx * 0.4, 'rgba(40,52,40,.85)'); blob(x - rx * 0.3, y - 2, rx * 0.4, rx * 0.1, 'rgba(160,190,170,.35)'); }
    const kx = x0 + w * 0.5; for (let y = y0; y < y0 + h; y += 7) { c.fillStyle = (y / 7 | 0) % 2 ? '#7a5e38' : '#8a6c42'; c.fillRect(kx - 14, y, 28, 6); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(kx - 14, y + 5, 28, 1.2); }
    for (let i = 0; i < 30; i++) { const x = x0 + r() * w, y = y0 + r() * h; c.strokeStyle = '#7a8a3a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 4, y - 10 - r() * 6); c.stroke(); }
  } else { // ubita ziemia ze słomą i palami (Twierdza)
    c.fillStyle = '#8a6a44'; c.fillRect(x0, y0, w, h);
    for (let i = 0; i < 1400; i++) { c.fillStyle = r() < 0.5 ? 'rgba(60,40,20,.35)' : 'rgba(190,150,100,.35)'; c.fillRect(x0 + r() * w, y0 + r() * h, 1.6, 1.6); }
    for (let i = 0; i < 70; i++) { const x = x0 + r() * w, y = y0 + r() * h, a = r() * Math.PI; c.strokeStyle = 'rgba(230,200,110,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 3); c.stroke(); }
    for (let i = 0; i < 5; i++) { const x = x0 + 30 + r() * (w - 60), y = y0 + 40 + r() * (h - 80); blob(x + 3, y + 2, 7, 3, 'rgba(0,0,0,.35)'); c.fillStyle = '#6a4a2a'; c.fillRect(x - 2.5, y - 16, 5, 18); c.fillStyle = '#8a6438'; c.fillRect(x - 2.5, y - 16, 1.6, 18); }
  }
  { const k = SIEGE_SLOPE(); c.save(); c.transform(1, 0, k, 1, -k * y0, 0); const sg = c.createLinearGradient(x0, 0, x0 + 46, 0); sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.fillRect(x0, y0, 46, h); c.restore(); } // cień muru (pochylony jak mur)
  c.globalCompositeOperation = 'soft-light';
  for (let i = 0; i < 5; i++) { const x = x0 + r() * w, y = y0 + 40 + r() * (h - 80), rad = 40 + r() * 90; glow(x, y, rad, r() < 0.5 ? 'rgba(255,240,200,.5)' : 'rgba(0,0,0,.45)'); }
  c.restore();
}
// Tło bitwy zależne od terenu (w połowie rozdzielczości, przed powiększeniem): horyzont pod paskiem u góry
// i drobne malowane szczegóły na polu (kępki, kamyki, kałuże, pęknięcia z żarem). Nie wpływają na walkę.
function battleDecor(g, terr, w, h, fac) {
  const r = mulberry32(9001 + terr * 131), P = TPAL[terr].map(c => `rgb(${gradeRgb(c).map(Math.round).join(',')})`), px = (x, y, c, k = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), k, k); };
  const maxX = fac ? paveX(44) / 2 - 8 : w;
  // horyzont: odległe wzgórza, las, wydmy, szczyty albo wulkany w kolorach terenu, zlewające się z polem
  const far = { [TER.GRASS]: '#2e4a2a', [TER.DIRT]: '#4a3a28', [TER.SAND]: '#8a7050', [TER.SNOW]: '#8a98b0', [TER.SWAMP]: '#2a3a2a', [TER.ROUGH]: '#4a4436', [TER.LAVA]: '#2a1614', [TER.WATER]: '#2a4a6a' }[terr] || '#3a3a3a';
  g.fillStyle = far; g.beginPath(); g.moveTo(0, 26);
  for (let x = 0; x <= w; x += 4) { const peak = terr === TER.SNOW || terr === TER.ROUGH || terr === TER.LAVA ? Math.abs(Math.sin(x * 0.045 + 1.3)) * 10 + Math.abs(Math.sin(x * 0.11)) * 4 : (terr === TER.GRASS || terr === TER.SWAMP) ? 4 + (thash(x >> 2, 3, terr) % 4) : Math.sin(x * 0.03) * 3 + 3; g.lineTo(x, 22 - peak); }
  g.lineTo(w, 26); g.closePath(); g.fill();
  if (terr === TER.LAVA) for (let x = 60; x < w; x += 150) { px(x, 10, '#ff7a2a', 2); px(x + 1, 8, '#ffd060'); }
  if (terr === TER.SNOW) for (let x = 0; x < w; x += 3) if (Math.abs(Math.sin(x * 0.045 + 1.3)) > 0.8) px(x, 22 - Math.abs(Math.sin(x * 0.045 + 1.3)) * 10 - Math.abs(Math.sin(x * 0.11)) * 4 + 1, '#f4f8fc', 2);
  // większe plamy (jaśniejsza trawa, piach, zaspy, muł, zastygła lawa), potem drobne szczegóły
  const patch = { [TER.GRASS]: '#4a7a34', [TER.DIRT]: P[0], [TER.SAND]: P[0], [TER.SNOW]: '#c8d2e0', [TER.SWAMP]: '#1e3a30', [TER.ROUGH]: P[0], [TER.LAVA]: '#3a1a14', [TER.WATER]: P[0] }[terr];
  g.fillStyle = patch;
  for (let k = 0; k < 14; k++) { // rozproszone w szachownicę, żeby wtapiały się w teren; środek gęstszy
    const x0 = Math.round(20 + r() * (maxX - 40)), y0 = Math.round(40 + r() * (h - 110)), rx = 8 + r() * 12, ry = 3 + r() * 4;
    for (let y = -Math.ceil(ry); y <= ry; y++) for (let x = -Math.ceil(rx); x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d <= 1 && (d < 0.35 || ((x0 + x + y0 + y) & 1))) g.fillRect(x0 + x, y0 + y, 1, 1); }
  }
  const tuft = (x, y, a, b) => { px(x, y - 2, a); px(x + 1, y - 3, b); px(x + 1, y - 2, b); px(x + 2, y - 4, b); px(x + 3, y - 3, a); px(x + 3, y - 2, a); px(x + 4, y - 2, b); };
  const stone = (x, y, pal) => { g.fillStyle = pal[1]; g.fillRect(Math.round(x), Math.round(y) - 2, 4, 3); px(x, y - 2, pal[0], 2); px(x + 3, y, pal[2]); };
  for (let k = 0; k < 120; k++) {
    const x = 8 + r() * (maxX - 16), y = 34 + r() * (h - 96), v = r();
    switch (terr) {
      case TER.GRASS: if (v < 0.5) tuft(x, y, '#2e5a24', '#6aa844'); else if (v < 0.8) { const c = ['#e8d040', '#f4f0e8', '#d8503a', '#9a70d0'][k % 4]; px(x, y, c, 2); px(x + 3, y + 1, c); } else stone(x, y, ['#b0aca0', '#86847a', '#5a5850']); break;
      case TER.DIRT: case TER.ROUGH: if (v < 0.45) stone(x, y, ['#a89880', '#7a6a58', '#4a3e32']); else if (v < 0.75) { for (let i = 0; i < 7; i++) px(x + i, y + (i % 3 === 1 ? 1 : 0), P[3]); } else tuft(x, y, '#6a6030', '#a89a50'); break;
      case TER.SAND: if (v < 0.6) { for (let i = 0; i < 10; i++) px(x + i, y + Math.round(Math.sin(i * 0.7) * 1.2), P[2]); } else if (v < 0.72) { px(x, y, '#eee6d0', 4); px(x + 4, y + 1, '#eee6d0', 2); } else if (v < 0.8) { g.fillStyle = '#4a8a3a'; g.fillRect(Math.round(x), Math.round(y) - 6, 2, 7); g.fillRect(Math.round(x) - 2, Math.round(y) - 4, 2, 1); g.fillRect(Math.round(x) - 2, Math.round(y) - 5, 1, 2); } else stone(x, y, ['#e0c898', '#b09060', '#7a5a38']); break;
      case TER.SNOW: if (v < 0.5) { for (let i = 0; i < 12; i++) px(x + i, y + (i > 2 && i < 9 ? 0 : 1), '#a0b0c8'); for (let i = 3; i < 9; i++) px(x + i, y - 1, '#ffffff'); } else if (v < 0.75) stone(x, y, ['#e8eef4', '#a0acba', '#6a7686']); else px(x, y, '#ffffff', 2); break;
      case TER.SWAMP: if (v < 0.3) { g.fillStyle = '#16302c'; g.beginPath(); g.ellipse(Math.round(x), Math.round(y), 7, 3, 0, 0, TAU); g.fill(); px(x - 4, y - 1, '#4a8a7a', 2); } else if (v < 0.65) { for (let i = 0; i < 3; i++) { g.fillStyle = '#5a7a2a'; g.fillRect(Math.round(x + i * 2), Math.round(y) - 6, 1, 6); } px(x + 2, y - 8, '#6a4a26', 1); px(x + 2, y - 7, '#6a4a26'); } else if (v < 0.8) px(x, y, '#c83a2a', 2); else tuft(x, y, '#2a4a24', '#5a7a34'); break;
      case TER.LAVA: if (v < 0.45) { let cx = x, cy = y; for (let i = 0; i < 10; i++) { px(cx, cy, i % 3 ? '#e0601a' : '#ffb040'); cx += 1; cy += r() < 0.5 ? 1 : -1; } } else stone(x, y, ['#5a4a42', '#3a2e2a', '#1e1714']); break;
      case TER.WATER: if (v < 0.6) for (let i = 0; i < 5; i++) px(x + i, y - (i > 0 && i < 4 ? 1 : 0), '#8cb6da'); break;
    }
  }
}
// Szacunek obrażeń do podglądu ataku: [min, max] i ilu zginie
function estimateStrike(B, a, t, ranged, moved = 0) {
  const saved = B.rng; const out = [];
  for (const r of [0, 0.9999]) { B.rng = () => r; out.push(damageRoll(B, a, t, ranged, moved)); }
  B.rng = saved; const hp = CREATURES[t.cid].hp, pool = (t.n - 1) * hp + t.hp;
  const kills = d => (d >= pool ? t.n : t.n - Math.ceil((pool - d) / hp));
  return { min: out[0], max: out[1], kmin: kills(out[0]), kmax: kills(out[1]) };
}
// --- dźwięki bitwy: rodzaj stwora decyduje o krokach, ciosie i odgłosie ---
const unitSound = cid => { const C = CREATURES[cid], k = C.look.kind, fly = (C.abil || []).includes('fly');
  return { fly, step: fly ? 'wings' : ['rider', 'centaur', 'unicorn'].includes(k) ? 'gallop' : ['dragon', 'hydra', 'treant', 'bull', 'tower'].includes(k) ? 'stomp' : ['wolf', 'lizard', 'insect', 'griffin', 'bird'].includes(k) ? 'paws' : 'march',
    voice: k === 'dragon' || k === 'hydra' ? 'roar' : ['wolf', 'bull', 'lizard', 'insect', 'griffin', 'eye', 'ghost'].includes(k) ? 'growl' : null, weapon: k === 'hum' || k === 'rider' || k === 'centaur' }; };
function battleSound(fx, sp) {
  if (fx.kind === 'move') { const S = unitSound(fx.u.cid), x = fx.u.px; if (S.fly) Sfx.play('wings', { vol: 0.7, pan: sfxPan(x) });
    else { const n = Math.min(6, fx.path.length - 1); for (let i = 0; i < n; i++) Sfx.play(S.step, { vol: 0.55, pan: sfxPan(x), delay: i * 0.17 * sp, gap: 0 }); } }
  else if (fx.kind === 'hit' && fx.a && !fx.splash) { const S = unitSound(fx.a.cid); if (hasAb(fx.a, 'breath')) Sfx.play('firebreath', { pan: sfxPan(fx.a.px) }); else if (S.voice) Sfx.play(S.voice, { vol: 0.7, pan: sfxPan(fx.a.px) }); if (S.weapon) Sfx.play('swing', { vol: 0.8, pan: sfxPan(fx.a.px), delay: 0.12 * sp }); }
  else if (fx.kind === 'shot') { const LK = CREATURES[fx.a.cid].look; Sfx.play(LK.weapon === 'staff' || LK.orb ? 'zap' : 'bow', { pan: sfxPan(fx.a.px), delay: 0.3 * sp }); }
  else if (fx.kind === 'siege') Sfx.play('catapult', { pan: sfxPan(fx.a.px), delay: 0.25 * sp });
  else if (fx.kind === 'spell') Sfx.play(sndOr(SPELL_SND[fx.id] ? SPELL_SND[fx.id][0] : 'cast'), { vol: 0.8 });
}
// Trafienie: cios bronią dzwoni, pazury i kły tępo uderzają, strzała wbija się; zabity oddział pada
function impactSound(p, tg) {
  const pan = sfxPan(tg.px), a = p && p.a, shot = p && p.kind === 'shot', S = a ? unitSound(a.cid) : null;
  Sfx.play(shot ? 'arrowhit' : S && S.weapon ? 'clash' : 'hit', { vol: 0.85, pan });
  if (tg.dead) Sfx.play('death', { vol: 0.8, pan, delay: 0.15 });
}
// Czar: [dźwięk rzucenia, dźwięk trafienia]; brzmienia żywiołów i szkół (wiatr, ziemia, chór, trucizna…), a gdy którejś próbki brak – zastępcza
const SPELL_SND = { magicArrow: ['zap', 'zaphit'], lightningBolt: ['cast', 'thunder'], chainLightning: ['cast', 'thunder'], fireball: ['fireball', 'explode'], meteorShower: ['earth', 'explode'], armageddon: ['dark', 'explode'],
  implosion: ['drain', 'explode'], iceBolt: ['frost', 'ice'], frostRing: ['frost', 'ice'], blizzard: ['wind', 'ice'], cure: ['cast', 'heal'], massCure: ['holy', 'heal'], resurrection: ['holy', 'heal'], animateDead: ['dark', 'holy'],
  curse: ['dark', 'curse'], weakness: ['dark', 'curse'], slow: ['cast', 'slowdn'], deathRipple: ['dark', 'curse'], haste: ['cast', 'haste'], massHaste: ['wind', 'haste'], bless: ['cast', 'holy'], prayer: ['holy', 'buff'],
  blind: ['cast', 'curse'], poison: ['cast', 'poison'], fireWall: ['fireball', 'firebreath'], lifeSteal: ['drain', 'heal'], holyLight: ['holy', 'thunder'], vampirism: ['dark', 'drain'], stoneSkin: ['cast', 'earth'],
  shield: ['cast', 'shield'], airShield: ['wind', 'shield'], fireShield: ['fireball', 'shield'], teleport: ['teleport', 'teleport'], clone: ['teleport', 'shield'], dispel: ['cast', 'drain'], bloodlust: ['cast', 'growl'], fortune: ['cast', 'artifact'], tailwind: ['wind', 'haste'], fear: ['dark', 'growl'] };
const SND_FALLBACK = { wind: 'cast', earth: 'thud', holy: 'heal', poison: 'curse', teleport: 'cast', shield: 'buff', drain: 'curse', frost: 'ice', slowdn: 'curse', haste: 'buff', dark: 'curse' };
const sndOr = n => (Sfx.has(n) ? n : SND_FALLBACK[n] || n);
const spellLandSound = (id, x) => Sfx.play(sndOr(SPELL_SND[id] ? SPELL_SND[id][1] : 'buff'), { vol: 0.9, pan: sfxPan(x) });
// Pole bitwy morskiej (współrzędne pola): malowany obraz dwóch żaglowców burta w burtę (pokłady pod kolumnami 0–4 i 8–12, kładki w rzędach NAVAL_PLANKS),
// nad wodą w szczelinie ruchome błyski fal; bez obrazu – zapasowy rysunek: falujące morze, dwa pokłady z desek z relingami, kładki
const NAVAL_SEA = [344, 460]; // woda między burtami (x pola) na obrazie tools/tla-ai/szkic-morska.js
function drawNavalField(ctx, B) {
  const pim = BATTLE_BG_IMG.morska, t = G.time;
  if (pim && pim._ok) { ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(pim, 0, 0, W, 490);
    ctx.beginPath(); ctx.rect(NAVAL_SEA[0], 40, NAVAL_SEA[1] - NAVAL_SEA[0], 450); for (const y of NAVAL_PLANKS) { const [, cy] = hexCenter(0, y); ctx.rect(NAVAL_SEA[1], cy - 18, NAVAL_SEA[0] - NAVAL_SEA[1], 36); } ctx.clip('evenodd');
    ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(170,220,240,.22)'; ctx.lineWidth = 1.5; // fale płyną w dół szczeliny
    for (let r = 0; r < 22; r++) { const y = 40 + ((r * 23 + t * 14) % 460); ctx.beginPath(); for (let x = NAVAL_SEA[0]; x <= NAVAL_SEA[1]; x += 6) ctx.lineTo(x, y + Math.sin(x / 14 + t * 2 + r) * 2.5); ctx.stroke(); }
    ctx.restore(); return; }
  const [lx0, ty] = hexCenter(0, 0), [lx1] = hexCenter(NAVAL_GAP[0] - 1, 1), [rx0] = hexCenter(NAVAL_GAP[NAVAL_GAP.length - 1] + 1, 0), [rx1, by] = hexCenter(BCOLS - 1, BROWS - 1), hw = HEX.w / 2 + 4, top = ty - HEX.h / 2 - 6, bot = by + HEX.h / 2 + 6;
  const sea = ctx.createLinearGradient(0, 40, 0, 500); sea.addColorStop(0, '#1e5070'); sea.addColorStop(1, '#0e2c42'); ctx.fillStyle = sea; ctx.fillRect(-400, 40, 1600, 470);
  ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#bfe6f8'; ctx.lineWidth = 1.5; // fale
  for (let r = 0; r < 18; r++) { const y = 52 + r * 26; ctx.beginPath(); for (let x = -40; x <= 840; x += 8) ctx.lineTo(x, y + Math.sin(x / 34 + t * 1.6 + r) * 3); ctx.stroke(); } ctx.restore();
  const deck = (x0, x1, port) => { // kadłub (ciemne burty) i pokład z desek; dziób zaokrąglony od strony wody
    ctx.fillStyle = '#3a2414'; ctx.beginPath(); ctx.roundRect(x0 - hw - 10, top - 10, x1 - x0 + hw * 2 + 20, bot - top + 20, 26); ctx.fill();
    ctx.fillStyle = '#9a6a3a'; ctx.beginPath(); ctx.roundRect(x0 - hw, top, x1 - x0 + hw * 2, bot - top, 18); ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(60,34,14,.55)'; ctx.lineWidth = 1.2; for (let y = top + 12; y < bot; y += 12) { ctx.beginPath(); ctx.moveTo(x0 - hw, y); ctx.lineTo(x1 + hw, y); ctx.stroke(); }
    for (let y = top, k = 0; y < bot; y += 12, k++) for (let x = x0 - hw + (k % 3) * 40; x < x1 + hw; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 12); ctx.stroke(); } ctx.restore();
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x0 - hw - 4, top - 4, x1 - x0 + hw * 2 + 8, bot - top + 8, 22); ctx.stroke(); // reling
    const mx = port ? x0 + 6 : x1 - 6; for (const my of [top + (bot - top) * 0.3, top + (bot - top) * 0.72]) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(mx + 4, my + 4, 9, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a2c14'; ctx.beginPath(); ctx.arc(mx, my, 6, 0, TAU); ctx.fill(); } }; // podstawy masztów
  deck(lx0, lx1, true); deck(rx0, rx1, false);
  for (const y of NAVAL_PLANKS) { const [, cy] = hexCenter(0, y); ctx.fillStyle = '#7a5230'; ctx.fillRect(lx1 + hw - 6, cy - 9, rx0 - lx1 - hw * 2 + 12, 18); ctx.strokeStyle = 'rgba(40,24,10,.6)'; ctx.lineWidth = 1;
    for (let x = lx1 + hw; x < rx0 - hw; x += 10) { ctx.beginPath(); ctx.moveTo(x, cy - 9); ctx.lineTo(x, cy + 9); ctx.stroke(); } ctx.fillStyle = '#4a3020'; ctx.fillRect(lx1 + hw - 6, cy - 11, rx0 - lx1 - hw * 2 + 12, 3); ctx.fillRect(lx1 + hw - 6, cy + 8, rx0 - lx1 - hw * 2 + 12, 3); } // kładki z linami
}
const UNIT_SCALE = 1.15;
G.screens.battle = {
  fps: smoothFps, // płynnie także czekając na rozkaz (oddychające jednostki, płomienie)
  // Układ (jednostki interfejsu): pole walki (heksy w swoich współrzędnych 800×490) skalowane do wolnego miejsca (fs, przesunięcie fx, fy),
  // pasek górny i panel dowodzenia w pełnej wielkości. Panel pod polem, a w niskim, szerokim oknie (telefon) z boku – wtedy pole jest większe.
  // Przy 800×600 pole ma skalę 1 i leży jak dawniej (te same współrzędne heksów).
  ui: true,
  lay() {
    const key = VW + 'x' + VH; if (this.L && this.L.key === key) return this.L;
    const TOP = 44, FH = 446, SW = 300, fsB = Math.min(VW / W, (VH - TOP - 110) / FH), fsS = Math.min((VW - SW) / W, (VH - TOP - 6) / FH), side = fsS > fsB * 1.08;
    const fs = side ? fsS : fsB, areaW = side ? VW - SW : VW, areaH = (side ? VH : VH - 110) - TOP;
    const L = this.L = { key, side, fs, areaW, top: TOP, fx: Math.round((areaW - W * fs) / 2), fy: Math.round(TOP + (areaH - FH * fs) / 2 - TOP * fs),
      panel: side ? { x: VW - SW, y: TOP - 3, w: SW, h: VH - TOP + 3 } : { x: 0, y: VH - 110, w: VW, h: 110 } };
    L.fieldBottom = side ? VH : VH - 110;
    // przyciski: pod polem – trzy kolumny przy prawej krawędzi; z boku – dwie kolumny u góry panelu
    const P = L.panel, place = (b, i, j) => { b.x = side ? P.x + 38 + i * 116 : VW - 330 + i * 108; b.y = side ? P.y + 12 + j * 46 : P.y + 10 + j * 46; b.w = side ? 108 : 100; };
    if (this.bWait) { if (side) { place(this.bWait, 0, 0); place(this.bDef, 1, 0); place(this.bCast, 0, 1); place(this.bInfo, 1, 1); place(this.bAuto, 0, 2); place(this.bFlee, 1, 2); }
      else { place(this.bWait, 0, 0); place(this.bDef, 1, 0); place(this.bCast, 2, 0); place(this.bAuto, 0, 1); place(this.bFlee, 1, 1); place(this.bInfo, 2, 1); } }
    return L;
  },
  toField(x, y) { const L = this.lay(); return [(x - L.fx) / L.fs, (y - L.fy) / L.fs]; },
  // Tło: pole z obrazu bitwy, na boki lustrzane odbicie jego brzegów (przyciemnione), pasek górny i panel dowodzenia (jedna warstwa na rozmiar okna)
  drawBack(ctx, L) {
    const f = this.B && this.B.walls ? this.B.sides[1].town.faction : '';
    drawLayer(ctx, Layers.get(`battleBackUI_${VW}x${VH}_${this.terr}_${f}_${TERRAIN_TEX[TEX_NAME[this.terr || 1]] ? 1 : 0}`, VW, VH, c => {
      const bg = this.bg(G.rs * L.fs), k = bg.width / W, y0 = 38, fh = PIXEL_ART ? H - 38 : 452, dy = L.fy + y0 * L.fs, dh = fh * L.fs, fw = W * L.fs;
      stoneFill(c, 0, 0, VW, VH);
      c.imageSmoothingEnabled = !PIXEL_ART; c.drawImage(bg, 0, y0 * k, W * k, fh * k, L.fx, dy, fw, dh);
      for (let x = L.fx, flip = true; x > 0; x -= fw, flip = !flip) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.drawImage(bg, 0, y0 * k, W * k, fh * k, flip ? 0 : -fw, dy, fw, dh); c.restore(); } // lewo
      for (let x = L.fx + fw, flip = true; x < L.areaW; x += fw, flip = !flip) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.drawImage(bg, 0, y0 * k, W * k, fh * k, flip ? -fw : 0, dy, fw, dh); c.restore(); } // prawo
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, L.fx, VH); c.fillRect(L.fx + fw, 0, VW - L.fx - fw, VH);
      const tg = c.createLinearGradient(0, 0, 0, 40); tg.addColorStop(0, 'rgba(10,6,3,.96)'); tg.addColorStop(1, 'rgba(10,6,3,.86)'); c.fillStyle = tg; c.fillRect(0, 0, VW, 38);
      const P = L.panel; stoneFill(c, P.x, P.y, P.w, P.h);
      const gold = (x, y, w, h) => { const g = h > w ? c.createLinearGradient(x, 0, x + w, 0) : c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#f0d080'); g.addColorStop(1, '#6a4814'); c.fillStyle = g; c.fillRect(x, y, w, h); };
      gold(0, 38, L.side ? P.x : VW, 3); if (L.side) { gold(P.x, 38, P.w, 3); gold(P.x, 38, 3, VH - 38); } else gold(0, P.y - 3, VW, 3);
      if (L.side) insetBox(c, P.x + 12, P.y + 156, P.w - 24, P.h - 168, 11); else insetBox(c, 10, P.y + 8, VW - 344, 94, 11); // wnęka na kolejkę, podpowiedź i dziennik
    }), 0, 0);
  },
  bg(sc) { const f = this.B && this.B.walls ? this.B.sides[1].town.faction : ''; return Layers.get(`battleBg_${this.terr}_${f}_${TERRAIN_TEX[TEX_NAME[this.terr || 1]] ? 1 : 0}`, W, H, c => paintBattleBg(c, this.terr, f), sc); },
  buttons: [], B: null, phase: 'play', play: null, floats: [], preview: null, reach: null,
  enter(p) {
    Sfx.play('battlestart', { vol: 0.8, jit: 0 });
    const B = this.B = p.battle; B.fx = []; this.play = null; this.onDone = p.onDone || null; this.net = p.net || null;
    this.me = B.sides[0].owner === ME ? 0 : 1; this.floats = []; this.preview = null; this.timer = 0; this.ending = null; // strona gracza: 0 gdy atakuje, 1 gdy się broni
    this.terr = B.st.map.terrain[B.h.y * B.st.map.n + B.h.x] || TER.GRASS;
    for (const u of B.units) { [u.px, u.py] = unitPos(u); u.anim = null; u.dieT = null; u.flashT = null; u.face = null; }
    BattleFX.reset(); this.intro = { t: 0, dur: 0.9 };
    // przygotowanie klatek animacji z góry (żeby pierwszy ruch nie przycinał)
    for (const u of B.units) for (const d of [1, -1]) for (const [pose, n] of Object.entries(BATTLE_FRAMES)) for (let i = 0; i < n; i++) battleSprite(lookCid(u), d, pose, i); // obie strony: oddziały się obracają
    const bx = 470, mk = (i, j, label, act, o) => new Button(bx + i * 108, 500 + j * 46, 100, 38, label, act, Object.assign({ size: 15 }, o));
    this.bWait = mk(0, 0, 'Czekaj', () => this.order({ a: 'wait' }), { key: 'w', tip: 'Oddział ruszy na końcu tej rundy (klawisz W).' });
    this.bDef = mk(1, 0, 'Obrona', () => this.order({ a: 'def' }), { key: 'd', tip: 'Oddział broni się: wyższa obrona do jego następnego ruchu (klawisz D).' });
    this.myAuto = false;
    this.bAuto = mk(0, 1, 'Auto', () => { if (this.net) { this.myAuto = !this.myAuto; if (this.myAuto && this.phase === 'input') this.order({ a: 'ai' }); return; } B.auto = !B.auto; if (B.auto && this.phase === 'input') this.startTurnFor(B.active); }, { key: 'a', selected: () => (this.net ? this.myAuto : B.auto), tip: 'Walka automatyczna: twoje oddziały dowodzą się same (klawisz A).' });
    this.bFlee = mk(1, 1, 'Ucieczka', () => this.onBack(), { key: 'u', tip: 'Wycofanie się z bitwy: ocalałe oddziały zostają, ale bohater traci resztę ruchu na dziś (klawisz U).' });
    this.bCast = mk(2, 0, 'Czar', () => this.openBook(), { key: 'c', tip: 'Księga czarów bohatera: jeden czar na rundę, przed ruchem oddziału (klawisz C).' });
    this.bInfo = mk(2, 1, 'Mana', null, { disabled: true, display: true, tip: 'Mana bohatera. Odnawia się o 1 dziennie, a w pełni w mieście z gildią magów.' });
    this.casting = null; this.resume = false;
    this.fleeTip = this.bFlee.tip;
    if (this.me === 1) { this.bFlee.disabled = true; this.bFlee.tip = 'Obrońca nie może uciec z pola bitwy.'; }
    this.buttons = [this.bWait, this.bDef, this.bAuto, this.bFlee, this.bCast, this.bInfo]; this.L = null; this.lay();
    this.phase = 'intro';
  },
  onBack() {
    if (this.phase === 'over') return;
    if (this.casting) { this.casting = null; this.tele = null; this.preview = null; return; } // Esc anuluje wybór celu czaru
    if (this.phase !== 'input' && !this.B.auto || this.me === 1) return;
    showDialog('Wycofać się z bitwy? Ocalałe oddziały zostaną z bohaterem, ale na dziś koniec marszu.', [{ label: 'Uciekaj', key: 'enter', action: () => (this.net ? this.order({ a: 'flee' }) : this.finish(true)) }, { label: 'Walcz dalej', key: 'escape' }]);
  },
  nextTurn() {
    const B = this.B, u = nextActive(B); this.preview = null;
    for (const v of B.units) v.face = null; // po akcji oddziały znów patrzą w stronę wroga
    if (!u) { this.startEnding(); return; }
    this.startTurnFor(u);
  },
  startTurnFor(u) {
    const B = this.B; this.casting = null; this.touchKey = null;
    const ctl = u.cid === 'catapult' ? catapultTargets(B).length > 0 : machineControlled(B, u) && (u.cid !== 'firstAid' || firstAidTargets(B, u).length); // katapultą zawsze celuje gracz
    const mach = isMachine(u) && humanSide(B, u.side) && !B.auto && !ctl; // pozostałe machiny gracza działają same, chyba że bohater zna ich umiejętność
    const ai = mach || B.auto || !humanSide(B, u.side);
    if (ai && !mach && aiHeroCast(B)) { this.phase = 'play'; this.resume = true; return; } // najpierw czar bohatera (swojego albo wroga)
    if (ai) { this.phase = 'ai'; this.timer = B.auto ? 0.2 : 0.4; return; }
    if (this.net && B.sides[u.side].owner !== ME) { this.phase = 'remote'; this.reach = null; return; } // online: ruch przeciwnika-człowieka przyjdzie siecią
    if (this.net && this.myAuto) { this.phase = 'input'; this.order({ a: 'ai' }); return; } // online Auto: rozkaz „decyduje komputer” – obie strony liczą ten sam ruch SI
    this.phase = 'input'; this.reach = battleDist(B, u, unitSpd(u));
    if (this.me !== u.side) { this.me = u.side; this.bFlee.disabled = u.side === 1; this.bFlee.tip = u.side ? 'Obrońca nie może uciec z pola bitwy.' : this.fleeTip; } // hot-seat: dowodzą na zmianę dwaj ludzie
    this.bWait.disabled = u.waited; this.onPointerMove(G.mouse.x, G.mouse.y);
  },
  player(fn) { if (this.phase !== 'input') return; this.casting = null; fn(this.B.active); this.phase = 'play'; },
  // Rozkaz gracza jako dane (online wysyłany przeciwnikowi, który wykonuje go u siebie tak samo): a = rodzaj, t = cel, p = ścieżka
  order(c) {
    if (this.phase !== 'input') return; const B = this.B; c.u = B.units.indexOf(B.active); c.r = B.round;
    if (this.net) Net.send({ t: 'bcmd', c }, this.net.foe);
    this.applyOrder(c);
  },
  applyOrder(c) {
    const B = this.B, u = B.active, T = c.t != null ? B.units[c.t] : null;
    if (B.units.indexOf(u) !== c.u) console.warn('bitwa online: rozbieżność kolejki', c, B.units.indexOf(u));
    this.casting = null; this.preview = null; this.touchKey = null; this.tele = null;
    if (c.a === 'cast') { castBattle(B, c.id, c.x, c.y, c.x2, c.y2); this.phase = 'play'; this.resume = true; return; }
    if (c.a === 'flee') { this.finish(true); return; }
    if (c.a === 'ai') { if (aiHeroCast(B)) { this.phase = 'play'; this.resume = true; return; } aiAct(B, u); this.phase = 'play'; return; } // ruch SI za gracza (Auto online): ten sam u obu, bo bitwa jest powtarzalna
    if (c.a === 'wait') actWait(B, u); else if (c.a === 'def') actDefend(B, u); else if (c.a === 'shoot') actShoot(B, u, T);
    else if (c.a === 'heal') actFirstAid(B, u, T); else if (c.a === 'cat') actCatapult(B, u, { x: c.x, y: c.y }); else actMoveAttack(B, u, c.p, T);
    this.phase = 'play';
  },
  openBook() {
    if (this.phase !== 'input') return; const B = this.B;
    const mh = sideHero(B, this.me); if (!mh) return;
    if (B.cast[this.me]) { B.log.push('W tej rundzie bohater już rzucił czar.'); return; }
    showSpellbook(mh, 'battle', id => { this.casting = id; this.tele = null; this.onPointerMove(G.mouse.x, G.mouse.y); });
  },
  // Koniec bitwy: zwycięzcy wiwatują przez chwilę, potem okno wyniku nad polem bitwy (jak w Heroes 3). Klik albo klawisz przyspiesza.
  startEnding() {
    const B = this.B, winner = fighters(B, 0).length ? 0 : 1;
    this.phase = 'over'; this.preview = null; this.casting = null; this.ending = { t: 0, dur: 1.1, winner }; Sfx.play(winner === this.me ? 'victory' : 'defeat', { vol: 0.9, jit: 0 }); Music.stop(0.8);
  },
  finish(fled) {
    const B = this.B, st = B.st, h = B.h, res = resolveBattle(B, fled), f = this.onDone; this.onDone = null; this.phase = 'done';
    if (this.net && !this.net.lead) { showBattleReport(st, res, defenseReport(st, { h }, B.sides[1].hero, res), () => G.go('adventure')); return; } // online, obrońca: wynik u siebie, stan gry przyśle prowadzący
    if (this.net && f) { f(res); return; } // online: komputer zaatakował człowieka przy innym ekranie – wynik od razu wraca do tury komputera
    if (f) showBattleReport(st, res, defenseReport(st, { h }, B.sides[1].hero, res), () => { res.reported = true; f(res); }); // obrona: wynik wraca do tury przeciwnika
    else showBattleReport(st, res, attackReport(st, h, res), () => G.go('adventure', { after: () => battleAftermath(st, h, res) }));
  },
  update(dt) {
    const B = this.B; if (!B || this.phase === 'done') return;
    if (!G.hover && !G.modal && this.phase === 'input') G.wantCursor = battleCursor(this); // miecz, strzała, koń, skrzydło, czar
    BattleFX.update(dt); this.floats = this.floats.filter(f => G.time - f.t < 1.2);
    if (this.phase === 'intro') { this.intro.t += dt; if (this.intro.t >= this.intro.dur) this.nextTurn(); return; }
    if (this.play) { this.play.t += dt; this.stepPlay(); return; }
    if (B.fx.length) { this.startPlay(B.fx.shift()); return; }
    if (this.phase === 'play') {
      if (this.resume) { this.resume = false; if (fighters(B, 0).length && fighters(B, 1).length && !B.active.dead) { this.startTurnFor(B.active); return; } }
      this.nextTurn(); return;
    }
    if (this.phase === 'ai') { this.timer -= dt; if (this.timer <= 0) { aiAct(B, B.active); this.phase = 'play'; } return; }
    if (this.phase === 'remote' && Net.battleQ && Net.battleQ.length) { this.applyOrder(Net.battleQ.shift()); return; }
    if (this.phase === 'over') { const E = this.ending; E.t += dt; if (E.t >= E.dur) this.finish(false); }
  },
  // Czasy efektów (w sekundach); walka automatyczna odtwarza się szybciej
  startPlay(fx) {
    battleSound(fx, this.B.auto ? 0.55 : 1);
    const sp = this.B.auto ? 0.55 : 1, S = fx.kind === 'spell' ? SPELL_FX[fx.id] || {} : null;
    const dur = fx.kind === 'move' ? (fx.fly ? 0.45 + 0.08 * hexDistance({ x: fx.path[0][0], y: fx.path[0][1] }, { x: fx.u.x, y: fx.u.y }) : 0.17 * (fx.path.length - 1))
      : fx.kind === 'hit' ? (fx.a && !fx.splash ? 0.62 : 0.3) : fx.kind === 'shot' || fx.kind === 'siege' ? 0.95 : fx.kind === 'heal' ? 0.55 : fx.kind === 'spell' ? (S.proj || S.meteor ? 0.85 : S.strike ? 0.55 : 0.7) : 0.4;
    this.play = { ...fx, t: 0, dur: dur * sp, landed: false, launched: false, sp };
    const now = G.time, faceTo = (v, x) => { if (v && Math.abs(x - v.px) > 2) v.face = Math.sign(x - v.px); }; // oddział obraca się w stronę ruchu i celu
    if (fx.kind === 'heal' && fx.u && (fx.jump || fx.u.px == null)) { [fx.u.px, fx.u.py] = unitPos(fx.u); if (fx.jump) BattleFX.glow(fx.u.px, fx.u.py - 10, 40, '#9ab0ff', 0.4); } // Teleportacja i Klon: nowe miejsce od razu
    if (fx.kind === 'move') { fx.u.anim = { pose: fx.fly ? 'fly' : 'walk', t0: now, dur: this.play.dur }; if (fx.fly) faceTo(fx.u, unitPos(fx.u)[0]); }
    if (fx.kind === 'hit' && fx.a && !fx.splash) { faceTo(fx.a, fx.tg.px); fx.a.anim = { pose: 'attack', t0: now, dur: this.play.dur }; }
    if (fx.kind === 'shot') faceTo(fx.a, fx.tg.px);
    if (fx.kind === 'siege') faceTo(fx.a, hexCenter(fx.x, fx.y)[0]);
    if (fx.kind === 'shot' || fx.kind === 'siege') fx.a.anim = { pose: 'attack', t0: now, dur: 0.55 * sp };
  },
  // Trafienie: błysk, odrzut, iskry, liczba obrażeń; zabity oddział przewraca się
  impact(tg, dmg, killed, col = '#ffe8a0') {
    const now = G.time, [tx, ty] = [tg.px, tg.py];
    tg.flashT = now; tg.anim = { pose: 'hurt', t0: now, dur: 0.28 }; impactSound(this.play, tg); BattleFX.glow(tx, ty - 10, 26, col, 0.25);
    BattleFX.emit(tx, ty - 8, { n: 10 + Math.min(20, Math.round(dmg / 8)), col: [col, '#ffffff', hasAb(tg, 'undead') ? '#e8e2cc' : '#b8302a'], spd: 110, up: -40, g: 260, life: 0.55, size: 3 });
    this.floats.push({ x: tx, y: ty - 44, text: `-${dmg}`, t: now, big: dmg >= 50 });
    if (killed) { this.floats.push({ x: tx, y: ty - 26, text: `†${killed}`, t: now + 0.05, col: '#e8e0cc', small: true }); BattleFX.shake = Math.max(BattleFX.shake, 2 + Math.min(4, killed)); }
    if (tg.dead && tg.dieT == null) { tg.dieT = now + 0.15; BattleFX.emit(tx, ty + 10, { n: 16, col: ['#8a7a6a', '#5a4e44'], spd: 50, up: -20, life: 0.8, size: 4, drag: 2, jx: 20 }); }
  },
  stepPlay() {
    const p = this.play, f = clamp(p.t / p.dur, 0, 1);
    if (p.kind === 'move') {
      const u = p.u;
      if (p.fly) { // start, lot wysoko nad polem i lądowanie
        const [ax, ay] = unitPos(u, ...p.path[0]), [bx, by] = unitPos(u), k = ease(f), top = Math.min(66, 34 + Math.hypot(bx - ax, by - ay) * 0.12);
        u.px = lerp(ax, bx, k); u.py = lerp(ay, by, k); u.lift = top * Math.min(1, Math.sin(f * Math.PI) * 1.6);
      } else { const seg = f * (p.path.length - 1), i = Math.min(p.path.length - 2, Math.floor(seg)), k = seg - i; const [ax, ay] = unitPos(u, ...p.path[i]), [bx, by] = unitPos(u, ...p.path[i + 1]); u.px = ax + (bx - ax) * k; u.py = ay + (by - ay) * k; if (bx !== ax) u.face = Math.sign(bx - ax); }
      if (Math.random() < 0.35 && !p.fly) BattleFX.emit(u.px, u.py + 14, { n: 1, col: '#9a8a70', spd: 20, up: -15, life: 0.4, size: 3, drag: 2 });
    } else if (p.kind === 'hit') {
      if (p.a && !p.splash && hasAb(p.a, 'breath') && f > 0.3 && f < 0.78) { // zionięcie: strumień ognia z paszczy przez cel i pole za nim
        const d = p.a.face || (p.a.side === 0 ? 1 : -1), [mx, my] = mouthPos(p.a, d), bh = hexBehind(p.a, p.tg), [ex, ey] = bh ? hexCenter(...bh) : [p.tg.px + d * 40, p.tg.py];
        BattleFX.flame(mx, my, ex, ey - 22, breathColor(p.a.cid));
      }
      if (!p.landed && f >= (p.a && !p.splash ? 0.5 : 0)) { p.landed = true; this.impact(p.tg, p.dmg, p.killed); }
    } else if (p.kind === 'shot') {
      const LK = CREATURES[p.a.cid].look, orb = LK.weapon === 'staff' || !!LK.orb, col = LK.orb || '#c8e0ff'; // kula: laska albo własny pocisk (kamień gremlina, piorun tytana)
      if (!p.launched && f >= 0.42) {
        p.launched = true; const dist = Math.hypot(p.tg.px - p.a.px, p.tg.py - p.a.py);
        p.pr = BattleFX.proj(orb ? 'orb' : 'arrow', p.a.px + (p.tg.px > p.a.px ? 14 : -14), p.a.py - 18, p.tg.px, p.tg.py - 16, (orb ? 0.12 + dist / 900 : 0.08 + dist / 1500) * p.sp, col, orb ? 8 : 6 + dist * 0.07); // strzała z łuku: szybka, płaski łuk rosnący z odległością
        p.hitAt = p.t + p.pr.dur;
      }
      if (p.launched && !p.landed && p.t >= p.hitAt) { p.landed = true; this.impact(p.tg, p.dmg, p.killed, orb ? col : '#ffe8a0'); if (orb) BattleFX.emit(p.tg.px, p.tg.py - 16, { n: 14, col: [col, '#ffffff'], spd: 90, life: 0.4, size: 3, glow: true }); }
      if (p.hitAt) p.dur = Math.max(p.dur, p.hitAt + 0.15);
    } else if (p.kind === 'siege') { // głaz z katapulty w mur
      const [tx, ty] = hexCenter(p.x, p.y);
      if (!p.launched && f >= 0.4) { p.launched = true; p.pr = BattleFX.proj('rock', p.a.px, p.a.py - 26, tx + (p.hit ? 0 : 20), ty - 20, 0.5 * p.sp, '#8a847a', 90); p.hitAt = p.t + p.pr.dur; }
      if (p.launched && !p.landed && p.t >= p.hitAt) {
        p.landed = true; Sfx.play(p.hit ? 'crash' : 'thud', { vol: p.broken ? 1 : 0.7, pan: sfxPan(tx) }); BattleFX.emit(tx, ty - 16, { n: p.broken ? 40 : 18, col: ['#9a948a', '#6e6a62', '#c8c0b0'], spd: 120, up: -60, g: 300, life: 0.7, size: 4, jx: 20 });
        BattleFX.shake = Math.max(BattleFX.shake, p.broken ? 6 : 3); this.floats.push({ x: tx, y: ty - 50, text: p.hit ? (p.broken ? (p.tower ? 'Wieża runęła!' : 'Wyłom!') : 'Trafienie!') : 'Pudło', t: G.time, col: '#e8e0cc', small: true });
        if (p.tower) { p.tower.dieT = G.time - 1; BattleFX.emit(tx, ty - 40, { n: 50, col: ['#9a948a', '#6e6a62', '#c8c0b0', '#4a4440'], spd: 150, up: -90, g: 280, life: 1, size: 5, jx: 30 }); BattleFX.shake = 9; } // wieża w gruzach, łucznicy znikają
      }
      if (p.hitAt) p.dur = Math.max(p.dur, p.hitAt + 0.2);
    } else if (p.kind === 'heal') {
      if (!p.landed) { p.landed = true; const u = p.u; if (!p.label) Sfx.play('heal', { vol: 0.6, pan: sfxPan(u.px) });
        if (p.label) this.floats.push({ x: u.px, y: u.py - 50, text: p.label, t: G.time, col: '#ffe08a', small: true });
        else { this.floats.push({ x: u.px, y: u.py - 44, text: `+${p.amount}`, t: G.time, col: '#8af07a' }); spellAura(u.px, u.py, { aura: 'rise', col: '#8af07a' }); } }
    } else if (p.kind === 'spell') {
      const S = SPELL_FX[p.id] || {}, [tx, ty] = hexCenter(p.x, p.y), aim = [tx, ty - 16];
      if (!p.launched) {
        p.launched = true; const hp = heroSpot(p.side || 0), hand = [hp[0] + hp[2] * 16, hp[1] - 44]; this.heroCast = { side: p.side || 0, t0: G.time }; // bohater unosi rękę
        BattleFX.ring(hand[0], hand[1], S.col || '#ffffff', 26, 0.5, 2);
        if (S.proj) { p.pr = BattleFX.proj(S.proj, hand[0], hand[1], aim[0], aim[1], 0.5 * p.sp, S.col, 40); p.hitAt = p.pr.dur; }
        else if (S.meteor) { for (let i = 0; i < 3; i++) p.pr = BattleFX.proj('fireball', tx - 140 + i * 50, -30 - i * 20, aim[0] + (i - 1) * 14, aim[1], (0.4 + i * 0.08) * p.sp, S.col); p.hitAt = p.pr.dur; }
        else if (S.strike) { BattleFX.bolt(tx + (Math.random() - 0.5) * 60, 0, aim[0], aim[1], S.col); BattleFX.bolt(tx + (Math.random() - 0.5) * 80, 0, aim[0], aim[1], S.col); p.hitAt = 0.05;
          if (S.chain && p.area) for (let i = 1; i < p.area.length; i++) { const [x0, y0] = hexCenter(...p.area[i - 1]), [x1, y1] = hexCenter(...p.area[i]); BattleFX.bolt(x0, y0 - 16, x1, y1 - 16, S.col); BattleFX.glow(x1, y1 - 16, 40, S.col, 0.4); } } // łańcuch: piorun skacze od celu do celu
        else { for (const [ax, ay] of p.area || spellArea(p.id, p.x, p.y, this.B)) { const [cx, cy] = hexCenter(ax, ay); spellAura(cx, cy, S); } p.hitAt = 0.3; }
      }
      if (!p.landed && p.t >= p.hitAt) {
        p.landed = true; spellLandSound(p.id, tx); if (S.sig && (S.proj || S.strike || S.meteor)) spellSignature(aim[0], ty, S); // pocisk i piorun: znak czaru w miejscu trafienia
        if (S.burst) BattleFX.emit(aim[0], aim[1], { n: S.boom ? 60 : 24, col: [S.col, S.burst, '#ffffff'], spd: S.boom ? 170 : 110, life: S.boom ? 0.8 : 0.5, size: S.boom ? 4 : 3, glow: true, drag: 1.5 });
        BattleFX.glow(aim[0], aim[1], S.boom ? 110 : 55, S.col, S.boom ? 0.7 : 0.45);
        if (S.boom) { BattleFX.ring(tx, ty + 10, S.col, 90, 0.6, 6); BattleFX.emit(tx, ty, { n: 40, col: ['#ff8a2a', '#ffd060', '#ff5a1a'], dir: -Math.PI / 2, spread: 2.4, spd: 150, g: 120, life: 0.9, size: 4, glow: true, jx: 50, jy: 20 }); BattleFX.emit(tx, ty, { n: 24, col: ['#5a4e44', '#8a7a6a'], dir: -Math.PI / 2, spread: 1.2, spd: 60, life: 1.1, size: 5, drag: 1 }); }
        if (S.flash) BattleFX.flash = { col: S.col, a: S.flash }; if (S.shake) BattleFX.shake = S.shake;
      }
    }
    if (p.t >= p.dur) { if (p.kind === 'move') { [p.u.px, p.u.py] = unitPos(p.u); p.u.lift = 0; p.u.anim = null; } this.play = null; }
  },
  // Klatka do narysowania: poza, sprite, przesunięcia
  // Bohaterowie w narożnikach pola (jak w H3): lewy górny atakujący, prawy górny obrońca; czar = krótka animacja zamachu
  drawHeroes(ctx) {
    const B = this.B, st = G.state, E = (this.phase === 'over' || this.phase === 'done') && this.ending, now = G.time;
    for (const side of [0, 1]) {
      const h = side ? B.sides[1].hero : B.h; if (!h) continue;
      const [x, y, dir] = heroSpot(side), c = this.heroCast && this.heroCast.side === side && now - this.heroCast.t0 < 0.6 ? this.heroCast : null, win = E && E.winner === side;
      const nA = BATTLE_FRAMES.attack, i = c ? Math.min(nA - 1, Math.floor((now - c.t0) / 0.6 * nA)) : win ? Math.floor((now * 1.6 % 1) * nA) : Math.floor(now * 4.5 + side) % BATTLE_FRAMES.idle;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y, 14, 4.5, 0, 0, TAU); ctx.fill();
      drawSprite(ctx, heroBattleSprite(h, ownerColor(st, h.owner), dir, i, !!(c || win)), x, y, HERO_BATTLE_K);
    }
  },
  unitLook(u) {
    const d = u.face || (u.side === 0 ? 1 : -1), now = G.time, a = u.anim && now - u.anim.t0 < u.anim.dur ? u.anim : null;
    let pose = 'idle', i = Math.floor(now * 5.2 + u.id * 1.37) % BATTLE_FRAMES.idle, ox = 0;
    const E = (this.phase === 'over' || this.phase === 'done') && this.ending;
    if (E && u.side === E.winner && !u.dead && !isMachine(u)) { // zwycięzcy podskakują i wymachują bronią
      const k = now * 1.6 + u.id * 0.37, hop = Math.abs(Math.sin(k * Math.PI)) * 7 * clamp(E.t * 3, 0, 1);
      return { s: battleSprite(lookCid(u), d, 'attack', Math.floor((k % 1) * BATTLE_FRAMES.attack)), ox: 0, hop, flash: false };
    }
    if (this.phase === 'intro' && u.cid !== 'arrowTower') { pose = 'walk'; i = Math.floor(now * 13) % BATTLE_FRAMES.walk; ox = -d * (1 - ease(clamp(this.intro.t / this.intro.dur, 0, 1))) * 110; }
    else if (a) {
      const f = clamp((now - a.t0) / a.dur, 0, 1); pose = a.pose;
      i = pose === 'walk' || pose === 'fly' ? Math.floor(now * (pose === 'fly' ? 17 : 13)) % BATTLE_FRAMES[pose] : pose === 'attack' ? Math.min(BATTLE_FRAMES.attack - 1, Math.floor(f * BATTLE_FRAMES.attack)) : 0;
      const p = this.play;
      if (pose === 'attack' && p && p.kind === 'hit' && p.a === u) ox = Math.sign(p.tg.px - u.px || d) * Math.sin(f * Math.PI) * 12;
      if (pose === 'hurt') ox = -d * Math.sin(f * Math.PI) * 5;
    }
    return { s: battleSprite(lookCid(u), d, pose, i), ox, flash: u.flashT != null && now - u.flashT < 0.14 };
  },
  onPointerMove(x, y) { this.hover(...this.toField(x, y)); },
  hover(x, y) { // x, y: współrzędne pola walki
    const B = this.B; this.preview = null; if (this.phase !== 'input' || G.modal) return;
    const u = B.active, hx = hexAt(x, y); if (!hx) return;
    if (this.casting && this.tele) { // Teleportacja, krok 2: wolne pole dla wskazanego oddziału
      const T = this.tele, tu = unitAt(B, T.x, T.y);
      this.preview = tu && teleportOk(B, tu, hx.x, hx.y) ? { kind: 'cast', id: this.casting, x: T.x, y: T.y, x2: hx.x, y2: hx.y, target: tu, tele: true } : { kind: 'nocast', id: this.casting }; return;
    }
    if (this.casting) {
      const id = this.casting, tu = spellUnitAt(B, id, hx.x, hx.y);
      this.preview = spellTargetOk(B, id, tu) ? { kind: 'cast', id, x: hx.x, y: hx.y, target: tu } : { kind: 'nocast', id }; return;
    }
    const occ = unitAt(B, hx.x, hx.y), k = hexKey(hx.x, hx.y);
    if (u.cid === 'catapult') { const w = wallAt(B, hx.x, hx.y); if (w && w.hp > 0) this.preview = { kind: 'siege', x: w.x, y: w.y, w, chance: catapultChance(B, u), shots: catapultShots(B, u) }; return; } // katapulta: cel w murach // namiot medyka pod rozkazami: wskazujemy rannego oddział
    if (u.cid === 'firstAid') { // namiot medyka pod rozkazami: wskazujemy rannego oddział
      if (occ && firstAidTargets(B, u).includes(occ)) this.preview = { kind: 'heal', target: occ, most: skillVal(sideHero(B, u.side), 'firstAid') || 25 };
      else if (occ) this.preview = { kind: 'info', target: occ };
      return;
    }
    if (isMachine(u) && !(occ && occ.side !== u.side && targetable(occ))) { if (occ) this.preview = { kind: 'info', target: occ }; return; } // balista nie chodzi
    if (occ && occ.side !== u.side && targetable(occ)) {
      if (canShoot(B, u)) { this.preview = { kind: 'shoot', target: occ, est: estimateStrike(B, u, occ, true) }; return; }
      let best = null;
      for (const [nx, ny] of [[u.x, u.y], ...attackSpots(u, occ)]) { // pole, z którego uderzy: najbliżej kursora (duży stwór: jego środek)
        const own = nx === u.x && ny === u.y; if (!own && !this.reach.dist.has(hexKey(nx, ny)) || !hexAdjacent({ ...u, x: nx, y: ny }, occ)) continue;
        const [cx, cy] = unitPos(u, nx, ny), md = (cx - x) ** 2 + (cy - y) ** 2; if (!best || md < best.md) best = { nx, ny, md };
      }
      this.preview = best ? { kind: 'attack', target: occ, from: [best.nx, best.ny], est: estimateStrike(B, u, occ, false, hexDistance(u, { x: best.nx, y: best.ny })) } : { kind: 'far', target: occ };
    } else if (!occ && this.reach.dist.has(k)) this.preview = { kind: 'move', to: [hx.x, hx.y] };
    else if (occ) this.preview = { kind: 'info', target: occ };
  },
  onKey() { if (this.phase === 'over' && this.ending.t > 0.3) this.finish(false); },
  onClick(x, y) {
    if (this.phase === 'over') { if (this.ending.t > 0.3) this.finish(false); return; }
    if (clickButtons(this.buttons, x, y)) return;
    [x, y] = this.toField(x, y);
    if (this.phase === 'input' && G.mouse.type && G.mouse.type !== 'mouse') { // dotyk: pierwsze stuknięcie pokazuje akcję i jej skutek, drugie w to samo pole ją wykonuje
      const hx = hexAt(x, y), key = hx ? hexKey(hx.x, hx.y) + (this.casting || '') : null, again = key && key === this.touchKey;
      if (!again) { this.hover(x, y); this.touchKey = this.preview && this.preview.kind !== 'info' && this.preview.kind !== 'far' && this.preview.kind !== 'nocast' ? key : null; return; }
      this.touchKey = null;
    }
    const B = this.B, p = this.preview; if (this.phase !== 'input' || !p) return;
    const ix = v => B.units.indexOf(v), u = B.active;
    if (p.kind === 'cast' && SPELLS[p.id].teleport && !p.tele) { this.tele = { x: p.x, y: p.y }; this.preview = null; return; } // najpierw oddział, potem miejsce
    if (p.kind === 'cast') this.order(p.tele ? { a: 'cast', id: p.id, x: p.x, y: p.y, x2: p.x2, y2: p.y2 } : { a: 'cast', id: p.id, x: p.x, y: p.y });
    else if (p.kind === 'heal') this.order({ a: 'heal', t: ix(p.target) });
    else if (p.kind === 'siege') this.order({ a: 'cat', x: p.x, y: p.y });
    else if (p.kind === 'shoot') this.order({ a: 'shoot', t: ix(p.target) });
    else if (p.kind === 'attack') this.order({ a: 'move', t: ix(p.target), p: pathTo(this.reach, u, ...p.from) });
    else if (p.kind === 'move') this.order({ a: 'move', p: pathTo(this.reach, u, ...p.to) });
  },
  rightInfo(x, y) {
    [x, y] = this.toField(x, y); const hx = hexAt(x, y), u = hx && unitAt(this.B, hx.x, hx.y), w = hx && wallAt(this.B, hx.x, hx.y);
    if (w && !u) return w.hp <= 0 ? `${w.kind === 'gate' ? 'Rozbita brama' : w.kind === 'keep' ? 'Gruzy wieży głównej' : 'Wyłom w murze'}: można tędy przejść.` : w.kind === 'keep' ? `Wieża główna (wytrzymałość ${w.hp}/${w.max}): jej łucznicy strzelają co rundę za dwie wieże. Burzy ją katapulta.` : w.kind === 'gate' ? `Brama miasta (wytrzymałość ${w.hp}/${w.max}): przepuszcza tylko obrońców. Rozbija ją katapulta.` : `Mur miasta (wytrzymałość ${w.hp}/${w.max}). Strzały zza muru tracą połowę siły; katapulta robi wyłomy.`;
    if (!u) return null;
    const c = CREATURES[u.cid];
    const ab = abilText(c);
    return `${c.plural}: ${u.n} (${u.side === this.me ? 'twoi' : 'wrogowie'}). Życie pierwszego: ${u.hp}/${c.hp}. ${unitStats(c)}${c.shots ? `, strzały ${u.shots}` : ''}.${ab ? ` ${ab}.` : ''}${u.defending ? ' Broni się.' : ''} Morale ${signed(unitMorale(this.B, u))}, szczęście ${signed(unitLuck(this.B, u))}.${Object.keys(u.buffs).length ? ` Czary: ${Object.entries(u.buffs).map(([k, r]) => `${BUFF_NAMES[k]} (${r})`).join(', ')}.` : ''}`;
  },
  draw(ctx) {
    const B = this.B, st = B.st, u0 = B.active, col = ownerColor(st, B.h.owner), L = this.lay(), P = L.panel;
    this.drawBack(ctx, L);
    ctx.save(); ctx.translate(L.fx, L.fy); ctx.scale(L.fs, L.fs); // pole walki w swoich współrzędnych
    const sh = BattleFX.shake; ctx.save(); ctx.beginPath(); ctx.rect(-L.fx / L.fs, 41, L.areaW / L.fs, (L.fieldBottom - L.fy) / L.fs - 41); ctx.clip(); if (sh > 0) ctx.translate((Math.random() - 0.5) * sh * 2, (Math.random() - 0.5) * sh * 2);
    if (B.naval) drawNavalField(ctx, B); // morze, dwa pokłady i kładki
    if (this.phase === 'input' && this.casting) {
      const p = this.preview;
      if (p && p.kind === 'cast') { ctx.fillStyle = 'rgba(160,200,255,.3)'; for (const [ax, ay] of spellArea(p.id, p.x, p.y, B)) { hexPath(ctx, ax, ay, 2); ctx.fill(); } }
      if (p && p.tele) { ctx.fillStyle = 'rgba(150,170,255,.45)'; for (const [cx, cy] of unitCells(p.target, p.x2, p.y2)) { hexPath(ctx, cx, cy, 2); ctx.fill(); } }
      else if (this.tele) { ctx.strokeStyle = '#9ab0ff'; ctx.lineWidth = 2.5; hexPath(ctx, this.tele.x, this.tele.y, 3); ctx.stroke(); }
    } else if (this.phase === 'input' && u0 && u0.cid === 'catapult') { // cele katapulty rysujemy nad murami (niżej)
    } else if (this.phase === 'input' && u0) {
      ctx.fillStyle = 'rgba(255,240,200,.16)';
      for (const k of this.reach.dist.keys()) { hexPath(ctx, k % BCOLS, Math.floor(k / BCOLS), 2); ctx.fill(); }
      const p = this.preview;
      if (p && (p.kind === 'move' || p.kind === 'attack')) { const [mx, my] = p.to || p.from; ctx.fillStyle = 'rgba(255,217,112,.35)'; for (const [cx, cy] of unitCells(u0, mx, my)) { hexPath(ctx, cx, cy, 2); ctx.fill(); } }
      if (p && p.target) { ctx.strokeStyle = p.kind === 'info' ? '#c8d8f0' : p.kind === 'far' ? '#8a8078' : '#ff6a4a'; ctx.lineWidth = 2.5; for (const [cx, cy] of unitCells(p.target)) { hexPath(ctx, cx, cy, 3); ctx.stroke(); } }
    }
    if (u0 && this.phase !== 'intro') {
      const pulse = 0.55 + 0.45 * Math.sin(G.time * 6); ctx.strokeStyle = `rgba(255,217,112,${0.35 * pulse})`; ctx.lineWidth = 2; for (const [cx, cy] of unitCells(u0)) { hexPath(ctx, cx, cy, 2); ctx.stroke(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,90,${0.18 + 0.12 * pulse})`; ctx.beginPath(); ctx.ellipse(u0.px, u0.py + 14, isWide(u0) ? 46 : 24, 9, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    if (B.moat) drawMoat(ctx, B); // fosa przed murem
    if (B.fire) for (const f of B.fire) { // Ściana ognia: płonące pola (migotanie, języki ognia)
      const [cx, cy] = hexCenter(f.x, f.y), fl = 0.75 + 0.25 * Math.sin(G.time * 9 + f.x * 3 + f.y);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,110,30,${0.22 * fl})`; hexPath(ctx, f.x, f.y, 3); ctx.fill();
      for (let i = 0; i < 4; i++) { const ox = (i - 1.5) * 9, h = (14 + 8 * Math.sin(G.time * 11 + i * 1.7 + f.x)) * fl, g = ctx.createLinearGradient(0, cy + 6 - h, 0, cy + 8);
        g.addColorStop(0, 'rgba(255,220,90,0)'); g.addColorStop(0.5, 'rgba(255,150,40,.55)'); g.addColorStop(1, 'rgba(255,70,20,.75)'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(cx + ox - 5, cy + 8); ctx.quadraticCurveTo(cx + ox - 4, cy + 2 - h * 0.4, cx + ox + Math.sin(G.time * 7 + i) * 2, cy + 6 - h); ctx.quadraticCurveTo(cx + ox + 4, cy + 2 - h * 0.4, cx + ox + 5, cy + 8); ctx.fill(); }
      ctx.restore(); }
    this.drawHeroes(ctx);
    // polegli leżą pod żywymi
    for (const u of B.units) if (u.dead && u.dieT != null && G.time - u.dieT > 0.45 && u.cid !== 'arrowTower') drawSprite(ctx, corpseSprite(u.cid, u.side === 0 ? 1 : -1), u.px, u.py + 14, 1);
    // oddziały i przeszkody (od góry ekranu w dół, żeby niższe zasłaniały wyższe)
    const shown = B.units.filter(u => !u.dead || u.dieT == null || G.time - u.dieT <= 0.45);
    const obst = [...B.obst].map(([k, o]) => { const x = k % BCOLS, y = Math.floor(k / BCOLS), [px, py] = hexCenter(x, y); return { obst: o, px, py }; });
    if (B.walls) { const T = B.sides[1].town, A3 = siegeArt(T.faction); if (A3) drawSiege3D(ctx, A3, B.walls); else { siegePost3D = null; drawSprite(ctx, castleSprite(T.faction, ownerColor(st, T.owner), B.walls), wallWX(0), 0, 1); } } // mury pod oddziałami (z 3D albo dawny rysunek)
    if (this.phase === 'input' && u0 && u0.cid === 'catapult') { // cele katapulty: fragmenty murów, wież i brama; wskazany na czerwono
      const p = this.preview, pulse = 0.6 + 0.4 * Math.sin(G.time * 5); ctx.lineWidth = 3;
      for (const w of catapultTargets(B)) { const on = p && p.kind === 'siege' && p.x === w.x && p.y === w.y; ctx.strokeStyle = on ? '#ff5a3a' : `rgba(255,217,112,${0.5 * pulse})`; hexPath(ctx, w.x, w.y, 4); ctx.stroke(); if (on) { ctx.fillStyle = 'rgba(255,100,60,.22)'; ctx.fill(); } }
    }
    const keep = B.walls && [...B.walls.values()].find(w => w.kind === 'keep'), A3 = keep && siegeArt(B.sides[1].town.faction), keepO = A3 ? [{ keepW: keep, py: hexCenter(keep.x, keep.y)[1] - 0.5 }] : []; // wieża główna zasłania i jest zasłaniana jak oddziały
    const drawUnit = (u, ghost) => { // ghost: oddział za wieżą główną, prześwituje przez nią
      const L = this.unitLook(u), tp = u.cid === 'arrowTower' ? (u.keep ? keepPost() : towerPost()) : null, gx = tp ? (u.keep ? u.px : wallWX(u.y)) + tp[0] : u.px + L.ox, gy = tp ? u.py + tp[1] : u.py + 14, lift = u.lift || 0, sz = CREATURES[u.cid].look.size || 1;
      const us = u.cid === 'arrowTower' ? UNIT_SCALE * 0.9 : UNIT_SCALE; // jednostki nieco większe niż heks (lepiej widać szczegóły); łucznik na wieży trochę mniejszy
      if (u.cid !== 'arrowTower' && !ghost) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gx, gy, 15 * sz * us, 5 * sz * us, 0, 0, TAU); ctx.fill(); }
      ctx.save(); if (ghost) ctx.globalAlpha = 0.45;
      if (u.dead && u.dieT != null) { const f = clamp((G.time - u.dieT) / 0.45, 0, 1); ctx.translate(gx, gy); ctx.rotate(-(u.side === 0 ? 1 : -1) * ease(f) * Math.PI / 2 * 0.9); ctx.globalAlpha = 1 - f * 0.4; ctx.translate(-gx, -gy); }
      drawSprite(ctx, L.s, gx, gy - lift - (L.hop || 0), us);
      if (L.flash) { ctx.globalAlpha = 0.85; drawSprite(ctx, tintSprite(L.s, '#ffffff'), gx, gy - lift, us); }
      ctx.restore();
      if (u.cid === 'arrowTower' && !u.dead && B.walls) drawTowerFront(ctx, siegeArt(B.sides[1].town.faction), u);
    };
    const kx = keepO.length ? hexCenter(keep.x, keep.y)[0] + KEEP_DX : 0, hidden = keepO.length && keep.hp > 0 ? shown.filter(v => !v.dead && !v.keep && v.py < keepO[0].py && v.py > keepO[0].py - 200 && Math.abs(v.px - kx) < 62) : [];
    for (const u of [...shown, ...obst, ...keepO].sort((a, b) => a.py - b.py)) {
      if (u.keepW) { drawKeep3D(ctx, A3, u.keepW); continue; }
      if (u.obst) { if (u.obst.o !== 'sea') drawSprite(ctx, obstacleSprite(u.obst.o, this.terr, u.obst.v), u.px, u.py + 6, 1.5); continue; }
      drawUnit(u);
    }
    for (const u of hidden) drawUnit(u, true);
    for (const u of shown) if (!u.dead) { // liczebność nad wszystkim, także nad murami
      const bx = u.cid === 'arrowTower' && !u.keep ? wallWX(u.y) + 70 : u.px + (u.side === 0 ? 8 : -34), by = Math.min(u.py + 18, Math.min(486, (L.fieldBottom - L.fy) / L.fs - 4) - (CREATURES[u.cid].shots && !endlessShots(u) ? 25 : 15)), s = String(u.n); // dolny rząd: licznik nad panelem
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx + 1, by + 1, 27, 15);
      ctx.fillStyle = u.side === 0 ? col : B.sides[1].owner >= 0 ? ownerColor(st, B.sides[1].owner) : '#5a5448'; ctx.fillRect(bx, by, 26, 14); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(bx, by, 26, 4);
      ctx.strokeStyle = '#e0b24a'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, 25, 13);
      text(ctx, s, bx + 13, by + 8, { size: 11, align: 'center', color: '#fff8e0', fam: 'body' });
      Object.keys(u.buffs).forEach((k, i) => { ctx.fillStyle = BAD_BUFFS.includes(k) ? '#b060e0' : '#ffe08a'; ctx.fillRect(bx + i * 6, by - 6, 4, 4); });
      if (CREATURES[u.cid].shots && !endlessShots(u)) { // strzały: pod liczebnością, szare, gdy się skończyły
        const ax = bx + 2, ay = by + 15, c2 = u.shots ? '#e8e0c8' : '#7a7468'; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(ax - 1, ay, 24, 10);
        ctx.fillStyle = c2; ctx.fillRect(ax + 1, ay + 4, 7, 1); ctx.fillRect(ax + 6, ay + 3, 2, 3); ctx.fillRect(ax, ay + 3, 1, 3);
        text(ctx, String(u.shots), ax + 16, ay + 5, { size: 9, align: 'center', color: c2, fam: 'body' });
      }
    }
    BattleFX.draw(ctx);
    for (const f of this.floats) {
      const k = clamp((G.time - f.t) / 1.2, 0, 1); if (k <= 0) continue; const pop = k < 0.12 ? 1 + (0.12 - k) * 4 : 1;
      ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.font = font(Math.round((f.small ? 14 : f.big ? 24 : 19) * pop), 700, 'title'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = f.y - ease(k) * 28; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,5,.85)'; ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.col || '#ff7a5a'; ctx.fillText(f.text, f.x, y); ctx.restore();
    }
    ctx.restore(); // koniec wstrząsu
    BattleFX.drawFlash(ctx);
    ctx.restore(); // koniec pola walki
    // pasek górny
    if (PIXEL_ART) drawHeroPortrait(ctx, 6, 1, B.h, col); else drawHeroMedal(ctx, 24, 21, 19, B.h, col); text(ctx, heroTitle(B.h), 50, 19, { size: 15, color: UI.txt, fam: 'title' });
    text(ctx, `Runda ${B.round}`, VW / 2, 19, { size: 17, align: 'center', color: UI.goldHi, fam: 'title' });
    const D = B.sides[1], foeCol = ownerColor(st, D.owner), right = D.hero ? VW - 50 : VW - 12;
    if (D.hero) { if (PIXEL_ART) drawHeroPortrait(ctx, VW - 44, 1, D.hero, foeCol); else drawHeroMedal(ctx, VW - 26, 21, 19, D.hero, foeCol); }
    text(ctx, D.monster ? `${CREATURES[D.monster.cid].plural} (neutralni)` : D.bank ? `${BANKS[D.bank.kind].name} (załoga)` : D.hero ? heroTitle(D.hero) : `Garnizon: ${D.town.name}`, right, 19, { size: 15, align: 'right', color: UI.txt, fam: 'title' });
    // panel dolny: podpowiedź i dziennik
    const pv = this.preview, cu = u0 && CREATURES[u0.cid];
    let tip = this.phase === 'remote' && u0 ? `Ruch gracza ${playerName(st, B.sides[u0.side].owner)}: ${cu.plural.toLowerCase()}…` : this.phase === 'input' && u0 ? `Ruch: ${cu.plural} (${u0.n}). Kliknij pole albo wroga.` : B.auto ? 'Walka automatyczna…' : u0 && !humanSide(B, u0.side) ? 'Ruch przeciwnika…' : '';
    if (this.casting && SPELLS[this.casting].teleport) tip = this.tele ? (pv && pv.kind === 'cast' ? 'Teleportacja: kliknij, aby przenieść oddział tutaj.' : 'Teleportacja: wskaż wolne pole (Esc anuluje).') : 'Teleportacja: wskaż swój oddział do przeniesienia (Esc anuluje).';
    else if (this.casting) tip = pv && pv.kind === 'cast' ? `${SPELLS[pv.id].name}: ${SPELLS[pv.id].desc(heroStat(sideHero(B, this.me) || B.h, 'sp'))}. Kliknij, aby rzucić.` : `${SPELLS[this.casting].name}: wskaż właściwy cel (Esc anuluje).`;
    else if (pv && pv.est) tip = `${pv.kind === 'shoot' ? `Strzał (zostało ${u0.shots}${shotPenaltyText(B, u0, pv.target)})` : 'Atak'}: ${pv.est.min}–${pv.est.max} obrażeń, zabitych ${pv.est.kmin === pv.est.kmax ? pv.est.kmin : `${pv.est.kmin}–${pv.est.kmax}`} (${CREATURES[pv.target.cid].plural.toLowerCase()}).`;
    else if (pv && pv.kind === 'far') tip = 'Ten oddział jest poza zasięgiem w tej turze.';
    if (this.touchKey && pv && G.mouse.type !== 'mouse') tip += ' Stuknij jeszcze raz, aby wykonać.';
    else if (pv && pv.kind === 'heal') tip = `Namiot medyka: wyleczy ${CREATURES[pv.target.cid].plural.toLowerCase()} o 1–${Math.min(pv.most, CREATURES[pv.target.cid].hp - pv.target.hp)} życia.`;
    else if (this.phase === 'input' && u0 && u0.cid === 'firstAid') tip = 'Namiot medyka: wskaż rannego oddział do leczenia (Obrona = pomiń).';
    else if (pv && pv.kind === 'siege') tip = `Katapulta: ${pv.w.kind === 'gate' ? 'brama' : pv.w.kind === 'tower' ? 'wieża strzelnicza' : pv.w.kind === 'keep' ? 'wieża główna' : 'mur'} (wytrzymałość ${pv.w.hp}/${pv.w.max}), trafienie ${pv.chance}%${pv.shots > 1 ? ', dwa strzały' : ''}. Kliknij, aby strzelić.`;
    else if (this.phase === 'input' && u0 && u0.cid === 'catapult') tip = 'Katapulta: wskaż fragment muru, bramę albo wieżę (zburzona wieża milknie).';
    else if (this.phase === 'input' && u0 && u0.cid === 'ballista') tip = `Balista (${CREATURES.ballista.name}): wskaż cel strzału.`;
    // panel: kolejka ruchów (jak w Heroes 3 HD), pod nią podpowiedź i ostatnie wpisy dziennika
    const qx0 = L.side ? P.x + 22 : 16, qy0 = L.side ? P.y + 166 : P.y + 13, perRow = L.side ? 6 : Math.max(4, Math.floor((VW - 346) / 41)), qn = L.side ? 12 : perRow;
    const tx = qx0 + 2, tw = L.side ? P.w - 40 : VW - 366, ty = L.side ? qy0 + 98 : P.y + 64;
    battleQueue(B, qn).forEach((u, i) => { const qx = qx0 + (i % perRow) * 41, qy = qy0 + Math.floor(i / perRow) * 42, own = u.side === 0 ? col : foeCol;
      slotBox(ctx, qx, qy, 38, 36, i === 0 ? 'sel' : ''); ctx.save(); ctx.beginPath(); ctx.rect(qx + 1, qy + 1, 36, 34); ctx.clip(); { const bs = battleSprite(lookCid(u), u.side === 0 ? 1 : -1, 'idle', 0), k = clamp(30 / (bs.c.height * bs.u), 0.3, 0.6); drawSprite(ctx, bs, qx + 19, qy + 35, k); } /* cała postać w kratce */ ctx.restore();
      ctx.fillStyle = own; ctx.fillRect(qx + 2, qy + 32, 34, 3); text(ctx, String(u.n), qx + 36, qy + 25, { size: 11, align: 'right', color: '#fff4cc', fam: 'title' }); });
    ctx.font = font(15, 700, 'body'); const tipL = L.side ? wrapText(ctx, tip, tw).slice(0, 3) : [tip];
    let tfs = 15; if (!L.side) while (tfs > 11 && ctx.measureText(tip).width > tw) { tfs--; ctx.font = font(tfs, 700, 'body'); }
    tipL.forEach((l, i) => text(ctx, l, tx, ty + i * 18, { size: tfs, weight: 700, color: UI.goldHi }));
    const ly = ty + tipL.length * 18, logN = L.side ? Math.max(1, Math.min(10, Math.floor((P.y + P.h - 14 - ly) / 16))) : 2;
    B.log.slice(-logN).forEach((l, i, a) => text(ctx, L.side ? fitText(ctx, l, tw, 13) : l, tx, ly + i * 16, { size: 13, weight: 600, color: i === a.length - 1 ? UI.txt : UI.txt2 }));
    this.bCast.disabled = this.phase !== 'input' || !canCastNow(B); this.bInfo.label = sideHero(B, this.me) ? `Mana ${sideHero(B, this.me).mana}` : 'Bez bohatera'; this.bInfo.dispCol = UI.mana;
    this.buttons.forEach(b => b.draw(ctx));
    if (pv && pv.est && this.phase === 'input' && !G.modal && G.mouse.type === 'mouse') drawStrikeTip(ctx, B, u0, pv, L.side ? P.x : VW, L.fieldBottom);
  },
};
// Dymek przy kursorze nad celem: przewidywane obrażenia i zabici, a dla ataku wręcz także odwet (najgorszy przypadek dla nas)
function drawStrikeTip(ctx, B, a, pv, maxX = W, maxY = 490) {
  const t = pv.target, e = pv.est, k = e.kmin === e.kmax ? `${e.kmin}` : `${e.kmin}–${e.kmax}`, lines = [[`${pv.kind === 'shoot' ? 'Strzał' : 'Atak'}: ${e.min}–${e.max} obrażeń`, '#fff4cc'], [`Giną: ${k} z ${t.n}`, '#ffb070']];
  if (pv.kind === 'attack' && e.kmin < t.n && !hasAb(a, 'noRetal') && canRetal(B, t) && !isMachine(t)) { // odwet tego, co przeżyje (po najmniejszych stratach)
    const n0 = t.n, r = (t.n = n0 - e.kmin, estimateStrike(B, t, a, false)); t.n = n0;
    lines.push([`Odwet: ${r.min}–${r.max}, giną ${r.kmin === r.kmax ? r.kmin : `${r.kmin}–${r.kmax}`} z ${a.n}`, '#c8d8f0']);
  } else if (pv.kind === 'attack' && e.kmin >= t.n) lines.push(['Bez odwetu: cel ginie', '#a8e090']);
  ctx.font = font(13, 700, 'body'); const w = Math.max(...lines.map(l => ctx.measureText(l[0]).width)) + 18, h = lines.length * 17 + 10;
  let x = G.mouse.x + 18, y = G.mouse.y + 14; if (x + w > maxX - 4) x = G.mouse.x - w - 12; if (y + h > maxY - 2) y = G.mouse.y - h - 10;
  ctx.fillStyle = 'rgba(20,12,6,.88)'; rr(ctx, x, y, w, h, 5); ctx.fill(); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.2; ctx.stroke();
  lines.forEach(([l, c], i) => text(ctx, l, x + 9, y + 14 + i * 17, { size: 13, weight: 700, color: c }));
}
// Okno po bitwie (pokazywane już na mapie przygody)
// Wynik bitwy na mapie (po walce automatycznej): okno jak po bitwie na ekranie, potem doświadczenie i odwiedziny miejsca
function showBattleResult(st, h, res) { showBattleReport(st, res, attackReport(st, h, res), () => battleAftermath(st, h, res)); }
function battleAftermath(st, h, res) {
  if (res.outcome !== 'win') return;
  advFloat(`+${res.exp} dośw.`, h.x, h.y);
  gainExp(st, h, res.exp, () => { const here = objectAt(st, h.y * st.map.n + h.x); if (here && here.type !== 'monster' && here.type !== 'bank') visitObject(st, h, here); });
}
// Zawartość fosy wg frakcji: faktura terenu, zabarwienie, brzeg, połysk; Inferno – lawa, Cytadela – bagno, Kurhan – trująca zieleń
const MOAT_LIQ = {
  haven: { tex: 'water', col: '#1f4a5e', bank: ['#3e3020', '#5a4630'], flow: 'rgba(40,90,110,.25)', spark: 'rgba(200,230,240,.55)' },
  sylvan: { tex: 'water', col: '#1f5a4e', tint: 'rgba(30,90,60,.25)', bank: ['#2e3a1e', '#4a5a2e'], flow: 'rgba(60,120,90,.25)', spark: 'rgba(210,240,220,.5)', pads: true },
  barrow: { tex: 'water', col: '#2a4a2e', tint: 'rgba(70,160,80,.35)', bank: ['#2a2630', '#403a48'], flow: 'rgba(120,230,140,.22)', spark: 'rgba(170,255,190,.45)' },
  fortress: { tex: 'swamp', col: '#3a4a2a', tint: 'rgba(50,60,24,.3)', bank: ['#3a2e18', '#56462a'], flow: 'rgba(90,110,50,.25)', spark: 'rgba(200,220,160,.35)', pads: true },
  inferno: { tex: 'lava', col: '#a8401a', bank: ['#1e1414', '#3a2420'], flow: 'rgba(255,200,90,.3)', spark: 'rgba(255,230,150,.7)', glow: true },
  academy: { tex: 'water', col: '#5a8aa8', tint: 'rgba(210,235,255,.4)', bank: ['#8a909a', '#c8d0da'], flow: 'rgba(230,245,255,.35)', spark: 'rgba(255,255,255,.75)' },
  dungeon: { tex: 'water', col: '#2a2440', tint: 'rgba(60,30,90,.4)', bank: ['#1e1a24', '#34303e'], flow: 'rgba(150,100,220,.22)', spark: 'rgba(200,170,255,.5)' },
  stronghold: { tex: 'water', col: '#4a3e28', tint: 'rgba(110,80,40,.35)', bank: ['#4a3820', '#6a5232'], flow: 'rgba(160,130,80,.25)', spark: 'rgba(230,210,170,.45)' },
};
// Fosa oblężonego miasta: prosty kanał wzdłuż lica muru (równoległy do ukosu, brzeg przy murze), przez całą wysokość pola;
// w rzędzie bramy przerzucony drewniany most. Ziemny brzeg, woda z faktury terenu (płynie powoli), ciemniejsza przy brzegach, fale
const MOAT_OFF = 33; // środek kanału tyle px przed licem muru (połowa szerokości z brzegiem: 26; podstawa muru zachodzi na brzeg)
function drawMoat(ctx, B) {
  const fac = B.sides[1].town ? B.sides[1].town.faction : 'haven', L = MOAT_LIQ[fac] || MOAT_LIQ.haven, WT = TERRAIN_TEX[L.tex] || TERRAIN_TEX.water, pat = WT && WT.cv ? ctx.createPattern(WT.cv, 'repeat') : null;
  if (pat) pat.setTransform(new DOMMatrix().translate(0, G.time * 5).scale(0.35));
  const y0 = 41, y1 = 490, mx = py => wallLineX(py) - MOAT_OFF, k = SIEGE_SLOPE();
  const band = (hw, a = y0, b = y1) => { ctx.beginPath(); ctx.moveTo(mx(a) - hw, a); ctx.lineTo(mx(a) + hw, a); ctx.lineTo(mx(b) + hw, b); ctx.lineTo(mx(b) - hw, b); ctx.closePath(); };
  const fill = (hw, c) => { band(hw); ctx.fillStyle = c; ctx.fill(); };
  ctx.save();
  fill(26, L.bank[0]); fill(23, L.bank[1]); fill(19, pat || L.col); if (L.tint) fill(19, L.tint); // brzeg i ciecz fosy
  fill(19, 'rgba(8,22,30,.3)'); fill(9, L.flow); // głębia i jaśniejszy nurt
  if (L.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fill(30, `rgba(255,120,30,${0.18 + 0.08 * Math.sin(G.time * 3)})`); ctx.restore(); } // lawa się żarzy
  const rows = [...Array(BROWS).keys()].filter(y => y !== GATE_Y).map(y => [y, hexCenter(0, y)[1]]);
  if (L.pads) for (const [y, cy] of rows) { const cx = mx(cy); for (const [dx, dy] of [[-8, -6], [7, 9]]) { ctx.fillStyle = '#4e8a3a'; ctx.beginPath(); ctx.arc(cx + dx + dy * k, cy + dy, 4.5, 0.4, TAU); ctx.lineTo(cx + dx + dy * k, cy + dy); ctx.fill(); } } // lilie wodne
  ctx.fillStyle = L.spark;
  for (const [y, cy] of rows) { const cx = mx(cy); for (let i = 0; i < 4; i++) { const ph = (G.time * 0.6 + i * 0.27 + y * 0.13) % 1, dy = -14 + i * 8 + ph * 5; if (ph < 0.6) ctx.fillRect(cx - 10 + ((i * 11 + y * 7) % 16) + dy * k, cy + dy, 1.6, 6); } }
  // most w rzędzie bramy: deski w poprzek kanału, poręcze, cień na wodzie
  const gy = hexCenter(0, GATE_Y)[1], h = 13, xa = py => mx(py) - 30, xb = py => wallLineX(py) + 2;
  const quad = (a, b, c) => { ctx.beginPath(); ctx.moveTo(xa(a), a); ctx.lineTo(xb(a), a); ctx.lineTo(xb(b), b); ctx.lineTo(xa(b), b); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
  quad(gy + h, gy + h + 5, 'rgba(0,0,0,.35)'); quad(gy - h, gy + h, '#6e4a26');
  ctx.strokeStyle = 'rgba(40,24,10,.75)'; ctx.lineWidth = 1;
  for (let x = xa(gy) + 5; x < xb(gy) - 2; x += 5.5) { ctx.beginPath(); ctx.moveTo(x - h * k, gy - h); ctx.lineTo(x + h * k, gy + h); ctx.stroke(); } // szpary między deskami
  quad(gy - h, gy - h + 2.5, '#8a6236'); quad(gy + h - 2.5, gy + h, '#4a2e14'); // krawędzie: oświetlona i w cieniu
  ctx.restore();
}

