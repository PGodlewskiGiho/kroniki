// ==================== GRAFIKA: PORTRETY BOHATERÓW ==========================================
// Pixel art 36×36: popiersie na tle ze światłem z boku, jak małe portrety w klasycznych grach o bohaterach.
// Kształty są cieniowane jak kule (rampa 5 odcieni), rysy twarzy stawiamy piksel po pikselu.
// Każdy bohater ma być rozpoznawalny: znani bohaterowie frakcji mają własny opis w HERO_LOOKS
// (fryzura, zarost, nakrycie głowy, wyraz twarzy, znaki szczególne, tło); pozostałe cechy i bohaterowie
// spoza listy dostają wygląd losowany z imienia (ten sam bohater wygląda zawsze tak samo).
// Peleryna ma kolor gracza. Na ekranie 1 piksel = 1 px logiczny (k = 1) albo 2 px, jak piksel mapy (k = 2).
const PORTRAIT_N = 36;
const PORTRAITS = new Map();
const PORTRAIT_BG = { knight: '#4c5c80', cleric: '#8c6c36', ranger: '#3e5c34', druid: '#5c5a2e', deathKnight: '#294232', necro: '#3e3058',
  beastmaster: '#4e5a34', witch: '#34503e', demoniac: '#6a2a1e', heretic: '#4a1e2e' };
// Nowe klasy korzystają z ubioru klasy o podobnym stroju (zbroja, skóry, szaty)
const PORTRAIT_DRESS = { beastmaster: 'ranger', witch: 'druid', demoniac: 'knight', heretic: 'necro' };
const INFERNAL = ['demoniac', 'heretic'];
const PORTRAIT_HAIR = ['#241a14', '#3e2a1a', '#5e3e22', '#7c4c26', '#a0602c', '#c89450', '#e2c47e', '#8e8a86', '#d8d4cc'];
const PORTRAIT_SKIN = ['#f0c8a0', '#e2b28a', '#d09c74', '#b07c56', '#8e603e'];
const PORTRAIT_EYES = ['#3c64a8', '#3a6e3a', '#6a4424', '#6c8098', '#3a2a1a'];
// Opisy znanych bohaterów (klucze jak w heroFace; brakujące cechy losuje heroFace)
const HERO_LOOKS = {
  'Sir Rolan': { age: 'old', hair: '#8e8a86', style: 'crop', beard: 'full', head: 'none', brow: 'bushy', mouth: 'frown', marks: ['scar'], armor: '#b8c0cc', bg: 'window', flip: false },
  'Weronika': { hair: '#e2c47e', style: 'braid', head: 'diadem', brow: 'arched', mouth: 'smile', eyes: 'wide', robe: '#f0ead8', bg: 'sky', flip: true },
  'Bernard': { age: 'old', hair: '#d8d4cc', style: 'fringe', beard: 'goatee', head: 'none', nose: 'long', mouth: 'smile', face: 'round', robe: '#e0d4b0', bg: 'plain', flip: false },
  'Idalia': { hair: '#a0602c', style: 'ponytail', head: 'winged', brow: 'angry', mouth: 'neutral', marks: ['freckles'], armor: '#a8b2c4', bg: 'sky', flip: false },
  'Kasjan': { hair: '#241a14', style: 'curly', beard: 'mustache', head: 'crest', mouth: 'smirk', eyes: 'narrow', armor: '#c8b070', bg: 'fire', flip: true },
  'Mirela': { skin: '#b07c56', hair: '#241a14', style: 'long', head: 'veil', mouth: 'neutral', brow: 'thin', marks: ['mole'], robe: '#d8e0f0', bg: 'window', flip: false },
  'Elandra': { hair: '#d8d4cc', style: 'long', head: 'headband', brow: 'arched', eyes: 'narrow', marks: ['paint'], bg: 'forest', flip: false },
  'Tarwen': { age: 'old', hair: '#7c4c26', style: 'long', beard: 'long', head: 'antlers', brow: 'bushy', mouth: 'neutral', robe: '#5e4a2a', bg: 'forest', flip: true },
  'Lirien': { hair: '#a0602c', style: 'curly', head: 'flowers', mouth: 'smile', marks: ['freckles'], robe: '#6e7a34', bg: 'sky', flip: false },
  'Gawen': { hair: '#c89450', style: 'short', beard: 'stubble', head: 'hood', eyes: 'narrow', brow: 'angry', marks: ['scarCheek'], bg: 'night', flip: true },
  'Mortis': { age: 'old', style: 'bald', beard: 'goatee', hair: '#d8d4cc', head: 'skullcrown', eyes: 'glow', mouth: 'frown', marks: ['sunken'], robe: '#2a2236', bg: 'night', flip: false },
  'Raga': { hair: '#241a14', style: 'long', head: 'cowl', eyes: 'glow', mouth: 'smirk', marks: ['tattoo'], robe: '#3e2438', bg: 'fire', flip: true },
  'Sir Kruk': { head: 'skullhelm', armor: '#3e3a48', bg: 'night', flip: true },
  'Zofia Czarna': { hair: '#241a14', style: 'crop', head: 'spikecrown', eyes: 'glow', brow: 'angry', mouth: 'frown', marks: ['scar'], armor: '#5a4a50', bg: 'fire', flip: false },
  'Borzywoj': { age: 'adult', skin: '#b07c56', hair: '#3e2a1a', style: 'long', beard: 'full', head: 'horned', brow: 'bushy', nose: 'broad', mouth: 'frown', marks: ['paint'], robe: '#6a5030', bg: 'forest', flip: false },
  'Wilga': { hair: '#5e3e22', style: 'braid', head: 'flowers', brow: 'thin', eyes: 'narrow', mouth: 'smirk', marks: ['tattoo'], robe: '#3e5a3a', bg: 'night', flip: true },
  'Mszar': { age: 'old', hair: '#8e8a86', style: 'long', beard: 'long', head: 'antlers', brow: 'bushy', nose: 'hooked', mouth: 'neutral', marks: ['mole'], robe: '#4a5a34', bg: 'forest', flip: true },
  'Dobrawa': { skin: '#d09c74', hair: '#241a14', style: 'ponytail', head: 'feather', brow: 'angry', mouth: 'neutral', marks: ['scarCheek'], robe: '#7a5a34', bg: 'sky', flip: false },
  'Azgar': { hair: '#241a14', style: 'crop', beard: 'goatee', head: 'horned', eyes: 'glow', brow: 'angry', mouth: 'smirk', marks: ['scar'], armor: '#6a2a24', bg: 'fire', flip: false },
  'Kalida': { hair: '#e2c47e', style: 'long', head: 'spikecrown', eyes: 'glow', brow: 'arched', mouth: 'smirk', armor: '#7a3a2a', bg: 'fire', flip: true },
  'Moloch': { age: 'old', style: 'bald', beard: 'mustache', hair: '#d8d4cc', head: 'horned', eyes: 'glow', nose: 'long', mouth: 'frown', marks: ['tattoo'], robe: '#4a1414', bg: 'night', flip: true },
  'Wiera Popiół': { hair: '#8e8a86', style: 'bun', head: 'circlet', eyes: 'glow', brow: 'thin', mouth: 'neutral', marks: ['mole'], robe: '#2a1418', bg: 'fire', flip: false },
};
function heroLookSeed(h) { let s = 2166136261; for (const ch of String(h.name || '')) s = Math.imul(s ^ ch.charCodeAt(0), 16777619); return s >>> 0; }
// Pełny opis wyglądu: HERO_LOOKS + cechy losowane z imienia
function heroFace(h) {
  const r = mulberry32(heroLookSeed(h)), cls = HERO_CLASSES[h.cls] ? h.cls : 'knight', f = !!h.female, pick = a => a[Math.floor(r() * a.length)];
  const undead = cls === 'necro' || cls === 'deathKnight', elf = cls === 'ranger' || cls === 'druid';
  const age = pick(f ? ['young', 'young', 'adult'] : cls === 'druid' || cls === 'cleric' ? ['adult', 'old'] : ['young', 'adult', 'adult', 'old']);
  const F = { f, cls, undead, elf, age, marks: r() < 0.5 ? [pick(f ? ['freckles', 'mole', 'earring'] : ['scar', 'scarCheek', 'earring', 'freckles'])] : [] };
  F.skin = undead ? pick(['#cac6b6', '#b8beb0', '#d2c8c0']) : pick(elf ? PORTRAIT_SKIN.slice(0, 2) : PORTRAIT_SKIN);
  F.hair = age === 'old' ? pick(PORTRAIT_HAIR.slice(7)) : pick(PORTRAIT_HAIR.slice(0, 7));
  F.eye = pick(PORTRAIT_EYES);
  F.style = f ? pick(['long', 'braid', 'bun', 'ponytail', 'curly']) : pick(['short', 'crop', 'swept', 'long', 'curly', age === 'old' ? 'bald' : 'short']);
  F.beard = f ? 'none' : pick(['none', 'none', 'stubble', 'goatee', 'full', 'mustache', ...(age === 'old' ? ['full', 'long'] : [])]);
  F.head = { knight: ['helm', 'crest', 'none', 'circlet'], cleric: ['diadem', 'veil', 'mitre', 'none'], ranger: ['hood', 'feather', 'headband', 'none'],
    druid: ['wreath', 'antlers', 'flowers'], necro: ['cowl', 'skullcrown', 'none'], deathKnight: ['horned', 'skullhelm', 'spikecrown'],
    beastmaster: ['horned', 'feather', 'headband', 'none'], witch: ['hood', 'flowers', 'antlers'], demoniac: ['horned', 'spikecrown', 'helm'], heretic: ['cowl', 'horned', 'circlet'] }[cls][Math.floor(r() * 4) % (['druid', 'necro', 'deathKnight', 'witch', 'demoniac', 'heretic'].includes(cls) ? 3 : 4)];
  F.brow = pick(['straight', 'arched', 'angry', 'bushy', 'thin']); F.eyes = undead ? 'glow' : pick(['normal', 'normal', 'narrow', 'wide']);
  F.nose = pick(['small', 'long', 'hooked', 'broad']); F.mouth = pick(['neutral', 'smile', 'frown', 'smirk']); F.face = pick(['oval', 'oval', 'round', 'long']);
  F.armor = pick(['#a8b2c4', '#c8b070', '#8a9ab8', '#b8c0cc']); F.robe = pick({ cleric: ['#e6dcc2', '#f0ead8', '#d8e0f0'], ranger: ['#7a5a34', '#5e4a2a'], druid: ['#6e5a34', '#6e7a34'], necro: ['#3a2c52', '#2a2236', '#3e2438'] }[cls] || ['#6e5a34']);
  if (INFERNAL.includes(cls)) { F.eyes = r() < 0.6 ? 'glow' : F.eyes; F.armor = pick(['#6a2a24', '#5a1e1e', '#7a3a2a']); F.robe = pick(['#4a1414', '#2a1418', '#5a1e1e']); }
  if (cls === 'beastmaster') F.robe = pick(['#6a5030', '#7a5a34', '#5a4a2a']); if (cls === 'witch') F.robe = pick(['#3e5a3a', '#4a5a34', '#34503e']);
  F.bg = pick(['plain', 'sky', 'window', 'night', 'fire', 'forest']); F.flip = r() < 0.5;
  Object.assign(F, HERO_LOOKS[h.name] || {});
  if (F.undead && !HERO_LOOKS[h.name]) F.skin = pick(['#cac6b6', '#b8beb0', '#d2c8c0']);
  if (f) F.beard = 'none';
  return F;
}
function drawHeroPortrait(ctx, x, y, h, col, k = 1) {
  const s = 36 * k; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(portraitCanvas(h, col), x, y, s, s); ctx.restore();
  if (h.asleep) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, s, s); text(ctx, 'z z', x + s / 2, y + s / 2, { size: 14, align: 'center', color: '#ecd9a8', fam: 'title' }); }
  ctx.lineWidth = 2; ctx.strokeStyle = '#b8913f'; ctx.strokeRect(x, y, s, s);
}
function portraitCanvas(h, col) {
  const key = `${h.name}|${h.cls}|${h.female ? 1 : 0}|${col}`; let c = PORTRAITS.get(key);
  if (!c) {
    const N = PORTRAIT_N, F = heroFace(h), P = paintPortrait(h, F, col), img = new ImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const p = P.px[y * N + (F.flip ? N - 1 - x : x)]; img.data.set([p[0], p[1], p[2], 255], (y * N + x) * 4); }
    c = document.createElement('canvas'); c.width = c.height = N; c.getContext('2d').putImageData(img, 0, 0); PORTRAITS.set(key, c);
  }
  return c;
}

// --- malarz pikseli: rampy odcieni, maski kształtów, cieniowanie kulą ---
const pxMix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
// 5 odcieni od najjaśniejszego: ciepłe światło, kolor, chłodny cień
const pxRamp = hex => { const c = typeof hex === 'string' ? hexRgb(hex) : hex; return [pxMix(c, [255, 248, 220], 0.4), pxMix(c, [255, 244, 220], 0.16), c, pxMix(c, [30, 16, 44], 0.35), pxMix(c, [14, 8, 22], 0.6)]; };
const mEll = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const mPoly = pts => (x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const mRect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
const mOr = (...m) => (x, y) => m.some(f => f(x, y));
const mAnd = (...m) => (x, y) => m.every(f => f(x, y));
const mNot = m => (x, y) => !m(x, y);
const mirX = pts => pts.map(([x, y]) => [35 - x, y]); // lewa strona twarzy → prawa (środek między kolumnami 17 i 18)
function pixPainter(N) {
  const px = new Array(N * N).fill(null), fig = new Uint8Array(N * N), Lz = [-0.5, -0.62, 0.6];
  const bay = (x, y) => (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const P = {
    px, fig, N, bay,
    set(x, y, c, isFig = true) { if (x >= 0 && y >= 0 && x < N && y < N && c) { px[y * N + x] = c; fig[y * N + x] = isFig ? 1 : 0; } },
    tone(R, t, x, y, dither) { const k = clamp(t, 0, 1) * (R.length - 1); return R[clamp(dither ? Math.floor(k + bay(x, y)) : Math.round(k), 0, R.length - 1)]; },
    // Wypełnia maskę; odcień z oświetlenia kuli (cx, cy, rx, ry). bias > 0 przyciemnia, tex(x, y) dodaje fakturę.
    shape(mask, R, o = {}) {
      const { cx = 18, cy = 18, rx = 10, ry = 10, bias = 0, dither = false, tex = null } = o;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const X = x + 0.5, Y = y + 0.5; if (!mask(X, Y)) continue;
        const nx = clamp((X - cx) / rx, -1, 1), ny = clamp((Y - cy) / ry, -1, 1), nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const lit = Math.max(0, nx * Lz[0] + ny * Lz[1] + nz * Lz[2]);
        P.set(x, y, P.tone(R, 1 - (0.12 + 0.88 * lit) + bias + (tex ? tex(x, y) : 0), x, y, dither));
      }
    },
    dots(list, c) { for (const [x, y] of list) P.set(x, y, c); },
  };
  return P;
}

// Tło: kolor klasy i scena (niebo, okno zamku, noc, ogień, las albo gładka poświata)
function paintPortraitBg(P, F, r) {
  const N = P.N, bg = hexRgb(PORTRAIT_BG[F.cls]), set = (x, y, c) => P.set(x, y, c, false);
  const BG = [pxMix(bg, [255, 240, 200], 0.22), pxMix(bg, [255, 240, 200], 0.08), bg, pxMix(bg, [10, 6, 16], 0.25), pxMix(bg, [10, 6, 16], 0.5)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) set(x, y, P.tone(BG, 0.05 + Math.hypot(x - 15, (y - 12) * 0.9) / 24, x, y, true));
  if (F.bg === 'sky') {
    const S = [[150, 190, 230], [120, 164, 214], [96, 134, 190], [74, 106, 160]], hill = pxMix(bg, [20, 30, 20], 0.4);
    for (let y = 0; y < 26; y++) for (let x = 0; x < N; x++) set(x, y, S[clamp(Math.floor(y / 7 + P.bay(x, y) * 0.9), 0, 3)]);
    for (const [cx, cy, rx] of [[7, 5, 5], [11, 4, 4], [27, 8, 5]]) for (let x = cx - rx; x <= cx + rx; x++) { set(x, cy, [236, 240, 246]); if (Math.abs(x - cx) < rx - 2) set(x, cy - 1, [250, 250, 252]); }
    for (let x = 0; x < N; x++) { const hy = Math.round(24 + 3 * Math.sin(x / 5 + r() * 0.2)); for (let y = hy; y < N; y++) set(x, y, y === hy ? pxMix(hill, [255, 255, 255], 0.2) : hill); }
  } else if (F.bg === 'night') {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) set(x, y, P.tone([[40, 44, 80], [30, 32, 62], [22, 22, 46], [14, 14, 30]], y / 40 + 0.15, x, y, true));
    for (let i = 0; i < 14; i++) set(Math.floor(r() * N), Math.floor(r() * 22), r() < 0.5 ? [220, 220, 255] : [160, 160, 210]);
    for (let y = 2; y < 9; y++) for (let x = 25; x < 33; x++) if (Math.hypot(x - 28.5, y - 5.5) < 3.4 && Math.hypot(x - 29.8, y - 4.6) > 2.6) set(x, y, [236, 232, 200]);
  } else if (F.bg === 'fire') {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) set(x, y, P.tone([[250, 190, 90], [220, 120, 50], [150, 56, 30], [70, 24, 18], [30, 12, 12]], 1 - y / 36 + Math.sin(x * 1.3 + y * 0.4) * 0.08, x, y, true));
    for (let i = 0; i < 10; i++) set(Math.floor(r() * N), Math.floor(r() * 30), [255, 220, 140]);
  } else if (F.bg === 'window') {
    const ST = pxRamp(pxMix(bg, [150, 140, 130], 0.5));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) set(x, y, (y % 6 === 0 || (x + (Math.floor(y / 6) % 2) * 5) % 10 === 0) ? ST[4] : ST[3]);
    for (let y = 1; y < N; y++) for (let x = 7; x < 29; x++) { const inside = y > 9 ? true : Math.hypot(x - 17.5, y - 10) < 10.5; if (inside) set(x, y, y < 24 ? pxMix([120, 164, 214], [200, 220, 240], y / 30) : [70, 100, 60]); }
    for (let y = 1; y < N; y++) { set(6, y, ST[1]); set(29, y, ST[2]); }
  } else if (F.bg === 'forest') {
    const LV = [pxMix(bg, [0, 0, 0], 0.2), pxMix(bg, [0, 0, 0], 0.45), pxMix(bg, [255, 255, 200], 0.15)];
    for (const tx of [3, 11, 25, 32]) for (let y = 0; y < N; y++) for (let x = tx - 1; x <= tx + 1; x++) set(x, y, x === tx - 1 ? [74, 56, 36] : [48, 36, 24]);
    for (let i = 0; i < 90; i++) { const x = Math.floor(r() * N), y = Math.floor(r() * 16); set(x, y, LV[i % 3]); set(x + 1, y, LV[(i + 1) % 3]); }
    for (let i = 0; i < 6; i++) set(Math.floor(r() * N), 4 + Math.floor(r() * 20), [240, 236, 160]); // świetliki
  }
  return BG;
}

function paintPortrait(h, F, col) {
  const N = PORTRAIT_N, P = pixPainter(N), cls = F.cls, look = heroClass(h).look, r = mulberry32(heroLookSeed(h) ^ 0x5bd1e995);
  const BG = paintPortraitBg(P, F, r);
  const S = pxRamp(F.skin), HR = pxRamp(F.hair), CL = pxRamp(col);
  const hideHair = ['horned', 'skullhelm', 'cowl', 'helm', 'crest', 'winged', 'hood', 'mitre', 'veil'].includes(F.head);
  const curly = F.style === 'curly';
  const hairTex = curly ? (x, y) => ((x + y) % 3 === 0 ? 0.28 : (x * y) % 4 === 1 ? -0.12 : 0) : (x, y) => ((x * 2 + y * 3) % 7 === 0 ? 0.22 : 0);
  // twarz: owal (okrągły, pociągły albo zwykły) zwężony ku brodzie, lekko zwrócony w bok
  const fcx = 18.3, fcy = 14.8, frx = F.face === 'round' ? 7.8 : F.face === 'long' ? 6.6 : 7.2, fry = F.face === 'long' ? 9.8 : F.face === 'round' ? 8.8 : 9.2;
  const taper = F.face === 'round' ? 0.18 : F.f ? 0.45 : 0.3;
  const face = (x, y) => { const dy = (y - fcy) / fry; if (Math.abs(dy) > 1) return false; let w = frx * Math.sqrt(1 - dy * dy); if (dy > 0.15) w *= 1 - (dy - 0.15) * taper; return Math.abs(x - (fcx + Math.max(0, dy) * 0.8)) <= w; };

  // z tyłu: długie włosy, kok, kucyk, kaptury i welon
  if (!hideHair && (F.style === 'long' || F.style === 'braid')) P.shape(mPoly([[10, 8], [26.5, 8], [28, 20], [27, 29], [9, 29], [8.5, 20]]), HR, { cx: 15, cy: 12, rx: 14, ry: 16, bias: 0.15, tex: hairTex });
  if (F.head === 'veil' && F.style === 'long') P.shape(mPoly([[10, 12], [26.5, 12], [28, 29], [8, 29]]), HR, { cx: 15, cy: 12, rx: 14, ry: 16, bias: 0.2, tex: hairTex });
  if (!hideHair && F.style === 'bun') P.shape(mEll(14.5, 5, 3.6, 3.2), HR, { cx: 13.5, cy: 4, rx: 4, ry: 4, tex: hairTex });
  if (F.style === 'ponytail') P.shape(mPoly([[23, 7], [27, 6], [31, 12], [31, 24], [28.5, 27], [28.8, 16], [25, 11]]), HR, { cx: 26, cy: 8, rx: 8, ry: 14, tex: hairTex });
  if (F.head === 'hood' || F.head === 'cowl' || F.head === 'veil') {
    const HC = F.head === 'cowl' ? pxRamp(F.robe) : F.head === 'veil' ? pxRamp(F.robe) : pxRamp(look.hood || '#3a6a3a');
    P.shape(mOr(mEll(18, 14, F.head === 'cowl' ? 11.5 : 10.5, 12.5), mPoly([[7, 20], [29, 20], [32, 31], [4, 31]])), HC, { cx: 15, cy: 12, rx: 13, ry: 14 });
  }

  // peleryna w kolorze gracza, szyja i tułów klasy
  P.shape(mEll(18, 38, 18.5, 12.5), CL, { cx: 11, cy: 30, rx: 14, ry: 10 });
  const neckW = F.f ? 0.8 : 0;
  P.shape(mPoly([[14.8 + neckW, 20], [21.6 - neckW, 20], [22 - neckW, 27], [14.4 + neckW, 27]]), S, { cx: 16, cy: 20, rx: 6, ry: 8, bias: 0.2 });
  for (let x = 15; x <= 21; x++) P.set(x, 24, S[3]);
  paintTorsoPx(P, F, look, CL);
  if (F.beard === 'long') paintBeardPx(P, F, face, HR, hairTex);

  // ucho (elfy: spiczaste), kolczyk, twarz
  if (F.elf) P.shape(mPoly([[11.8, 17.5], [7.5, 8], [9.8, 9.5], [12, 13]]), S, { cx: 9, cy: 10, rx: 4, ry: 6, bias: 0.1 });
  P.shape(mEll(11.2, 15.6, 1.8, 2.7), S, { cx: 10.5, cy: 14.5, rx: 2.5, ry: 3, bias: 0.12 }); P.set(11, 15, S[3]); P.set(11, 16, S[3]);
  if (F.marks.includes('earring')) P.dots([[11, 18], [11, 19]], [236, 196, 80]);
  P.shape(face, S, { cx: 16.5, cy: 12.5, rx: 9, ry: 11 });
  paintFacePx(P, F, face, S, HR);
  if (F.beard !== 'long' && F.beard !== 'none' && F.beard !== 'stubble') paintBeardPx(P, F, face, HR, hairTex);
  if (!hideHair) paintHairPx(P, F, face, S, HR, hairTex);
  paintHeadgearPx(P, F, face, S, CL, look);
  // obrys sylwetki na tle
  const O = pxMix(BG[4], [0, 0, 0], 0.55), edge = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (P.fig[i]) continue;
    if ((x > 0 && P.fig[i - 1]) || (x < N - 1 && P.fig[i + 1]) || (y > 0 && P.fig[i - N]) || (y < N - 1 && P.fig[i + N])) edge.push(i);
  }
  for (const i of edge) P.px[i] = O;
  return P;
}

// Oczy, brwi, nos, usta, zmarszczki i znaki szczególne
function paintFacePx(P, F, face, S, HR) {
  const cls = F.cls, lid = pxMix(S[4], [20, 10, 8], 0.5), white = F.eyes === 'glow' ? [26, 20, 28] : [238, 230, 214];
  const glow = cls === 'deathKnight' || INFERNAL.includes(cls) ? [255, 110, 70] : [170, 250, 170], iris = F.eyes === 'glow' ? glow : hexRgb(F.eye);
  for (const [x0, i] of [[13, 14], [20, 21]]) {
    const shade = x0 === 13 ? white : pxMix(white, S[2], 0.5);
    if (F.eyes === 'narrow') { P.dots([[x0, 15], [x0 + 2, 15]], lid); P.set(i, 15, iris); P.dots([[x0, 14], [x0 + 1, 14], [x0 + 2, 14]], S[3]); }
    else if (F.eyes === 'wide') { P.dots([[x0, 13], [x0 + 1, 13], [x0 + 2, 13]], lid); P.dots([[x0, 14], [x0, 15]], white); P.dots([[i, 14], [i, 15]], iris); P.dots([[x0 + 2, 14], [x0 + 2, 15]], shade); P.set(i, 15, pxMix(iris, [0, 0, 0], 0.5)); }
    else { P.dots([[x0, 14], [x0 + 1, 14], [x0 + 2, 14]], lid); P.set(x0, 15, white); P.set(i, 15, iris); P.set(x0 + 2, 15, shade); }
    if (F.eyes === 'glow') P.dots([[x0, 15], [x0 + 2, 15]], pxMix(glow, [0, 0, 0], 0.55));
    if (F.f && F.eyes !== 'narrow') P.set(x0 + 3, F.eyes === 'wide' ? 13 : 14, lid);
  }
  const brow = F.age === 'old' ? HR[1] : HR[3];
  const BROWS = { straight: [[12, 12], [13, 12], [14, 12], [15, 12]], arched: [[12, 12], [13, 11], [14, 11], [15, 12]], angry: [[12, 11], [13, 11], [14, 12], [15, 13]],
    bushy: [[12, 12], [13, 12], [14, 12], [15, 12], [12, 11], [13, 11], [14, 11], [15, 11]], thin: [[13, 12], [14, 12]] };
  const b = BROWS[F.brow] || BROWS.straight; P.dots(b, brow); P.dots(mirX(b), brow);
  // nos
  const n = F.nose;
  P.dots([[17, 16], [17, 17]], S[1]); P.dots([[18, 17], [18, 18]], S[3]); P.set(17, 18, S[1]); P.set(18, 19, S[4]); P.set(16, 19, S[3]); P.set(17, 19, S[2]);
  if (n === 'long') { P.set(18, 16, S[3]); P.set(18, 20, S[3]); P.set(17, 20, S[2]); }
  if (n === 'hooked') { P.set(18, 16, S[2]); P.set(19, 17, S[3]); P.set(19, 18, S[3]); }
  if (n === 'broad') { P.set(15, 19, S[3]); P.set(19, 19, S[4]); P.set(16, 18, S[2]); }
  // usta: [lewy kącik, środek, prawy kącik] jako przesunięcie w pionie
  const lip = F.f ? (F.undead ? [90, 150, 90] : [176, 70, 72]) : pxMix(S[4], [120, 40, 30], 0.3), m = F.mouth, my = n === 'long' ? 22 : 21;
  const off = { neutral: [0, 0, 0, 0], smile: [-1, 0, 0, -1], frown: [1, 0, 0, 1], smirk: [0, 0, 0, -1] }[m] || [0, 0, 0, 0];
  [16, 17, 18, 19].forEach((x, i) => P.set(x, my + off[i], lip));
  if (m === 'smile') P.dots([[17, my + 1], [18, my + 1]], F.f ? pxMix(lip, [255, 230, 220], 0.3) : S[2]);
  else if (F.f) P.dots([[17, my + 1], [18, my + 1]], pxMix(lip, [255, 220, 210], 0.25)); else P.dots([[17, my + 1], [18, my + 1]], S[2]);
  if (F.f && !F.undead) P.dots([[13, 18], [22, 18]], pxMix(S[2], [220, 110, 110], 0.35));
  if (F.age === 'old') P.dots([[15, 9], [16, 9], [19, 9], [20, 9], [12, 16], [23, 16], [15, 20], [21, 20]], S[3]);
  const mk = F.marks || [];
  if (mk.includes('scar')) P.dots([[13, 10], [13, 11], [14, 13], [15, 16], [15, 17], [16, 18]], [150, 60, 60]);
  if (mk.includes('scarCheek')) P.dots([[21, 17], [22, 18], [23, 19], [23, 20]], [168, 80, 76]);
  if (mk.includes('freckles')) P.dots([[13, 17], [15, 18], [14, 19], [20, 17], [22, 17], [21, 19]], pxMix(S[2], [150, 80, 40], 0.45));
  if (mk.includes('mole')) P.set(21, 21, S[4]);
  if (mk.includes('paint')) P.dots([[12, 17], [13, 17], [14, 18], [21, 18], [22, 17], [23, 17]], [60, 140, 90]);
  if (mk.includes('tattoo')) P.dots([[18, 8], [17, 9], [19, 9], [18, 10], [18, 23], [18, 24]], [90, 150, 110]);
  if (mk.includes('sunken') || F.undead) P.dots([[13, 16], [14, 16], [20, 16], [21, 16], [22, 16], [12, 18], [12, 19], [24, 18], [24, 19]], S[3]);
  if (F.beard === 'stubble') for (let y = 18; y < 25; y++) for (let x = 11; x < 27; x++) if (face(x + 0.5, y + 0.5) && !(y >= 20 && y <= 22 && x >= 15 && x <= 20) && (x + y) % 2 === 0) P.set(x, y, pxMix(S[3], HR[3], 0.5));
}

function paintBeardPx(P, F, face, HR, tex) {
  const o = { cx: 16, cy: 17, rx: 10, ry: 10, tex };
  if (F.beard === 'mustache' || F.beard === 'goatee') P.shape(mPoly([[15, 19.6], [18.5, 19.4], [22, 19.8], [22.2, 21.4], [18.5, 20.6], [14.8, 21.4]]), HR, o);
  if (F.beard === 'mustache') P.dots([[14, 21], [21, 21]], HR[3]);
  if (F.beard === 'goatee') P.shape(mPoly([[16.4, 22], [20.8, 22], [20.4, 25.2], [18.6, 26.5], [16.8, 25.2]]), HR, o);
  if (F.beard === 'full' || F.beard === 'long') {
    const low = F.beard === 'long' ? mPoly([[12.5, 21], [25, 21], [23.5, 31], [18.6, 33], [14, 31]]) : mPoly([[12.5, 21], [25, 21], [23.6, 25.6], [18.8, 27.2], [14, 25.6]]);
    P.shape(mAnd(mOr(mAnd(face, (x, y) => y >= 17.5), mRect(11, 14, 12.6, 20), low), mNot(mRect(16, 20.6, 20.2, 22))), HR, o);
    P.dots([[16, 21], [17, 21], [18, 21], [19, 21]], HR[4]);
  }
}

function paintHairPx(P, F, face, S, HR, tex) {
  if (F.style === 'bald' || F.style === 'fringe') {
    P.shape(mOr(mRect(10, 11, 12.2, 17), mRect(24.4, 11, 26.2, 17), F.style === 'fringe' ? mAnd(mEll(18.2, 9, 8.8, 6), mNot(face)) : () => false), HR, { cx: 15, cy: 10, rx: 12, ry: 8, tex });
    P.dots([[15, 7], [16, 7], [15, 8]], S[0]); return;
  }
  const hairline = x => 9 + ((x - 18.5) / 6) ** 2 * 2.4;
  const crop = F.style === 'crop';
  let cap = mAnd(crop ? mEll(18.2, 11.5, 8, 6.3) : mEll(18.2, 11, 8.8, 7), (x, y) => (face(x, y) ? y < hairline(x) - (crop ? 0.6 : 0) : x < 12 ? y < (crop ? 13 : 14) : y < 16.5));
  if (F.style === 'curly') cap = mOr(cap, mAnd((x, y) => Math.hypot(x - 18.2, (y - 10.5) * 1.2) < 9.6 + Math.sin(Math.atan2(y - 10.5, x - 18.2) * 9) * 0.9, (x, y) => y < 14 || !face(x, y), (x, y) => y < 18));
  if (F.style === 'swept') cap = mOr(cap, mAnd(mEll(20, 7.2, 8.4, 4.4), mNot(mAnd(face, (x, y) => y >= 9.5))));
  if (F.style === 'long' || F.style === 'braid') cap = mOr(cap, mPoly([[9.2, 10], [12.2, 10], [12.4, 21], [11.6, 29], [8.4, 28]]));
  if (F.style === 'long') cap = mOr(cap, mPoly([[24.8, 11], [27, 10], [28.2, 27], [25.6, 29], [25.2, 19]]));
  P.shape(cap, HR, { cx: 15.5, cy: 8, rx: 11, ry: 9, tex });
  if (F.style === 'swept' || F.style === 'short') P.dots([[14, 9], [15, 10], [21, 9]], HR[3]); // pasma na czole
  if (F.style === 'braid') for (let i = 0; i < 5; i++) { const y = 21 + i * 2.4, x = 10.5 - i * 0.2; P.shape(mEll(x, y, 1.8, 1.4), HR, { cx: x - 1, cy: y - 1, rx: 2, ry: 2 }); }
}

function paintTorsoPx(P, F, look, CL) {
  const cls = PORTRAIT_DRESS[F.cls] || F.cls;
  if (cls === 'knight' || cls === 'deathKnight') {
    const M = pxRamp(F.armor || (cls === 'knight' ? '#a8b2c4' : '#4c485c')), trim = cls === 'knight' ? [232, 196, 90] : [150, 40, 40];
    P.shape(mEll(18, 37, 14.5, 10.5), M, { cx: 13, cy: 29, rx: 16, ry: 10 });
    P.shape(mEll(18.2, 26.6, 5.6, 2.4), M, { cx: 16, cy: 25, rx: 6, ry: 3 });
    for (const x of [7.5, 29]) {
      for (let i = 2; i >= 0; i--) P.shape(mEll(x, 30.5 + i * 1.8, 6.4 - i * 0.5, 4.6 - i * 0.6), M, { cx: x - 2.5, cy: 28 + i * 1.8, rx: 7, ry: 5, bias: i * 0.08 });
      for (let d = -4; d <= 4; d++) P.set(Math.round(x) + d, 34, trim);
      if (cls === 'deathKnight') P.dots([[Math.round(x) - 1, 25], [Math.round(x) - 1, 24], [Math.round(x), 26], [Math.round(x) - 1, 26]], [214, 206, 184]);
    }
    if (cls === 'knight') { P.shape(mRect(15, 29, 21.5, 36), CL, { cx: 16, cy: 30, rx: 6, ry: 8 }); P.dots([[18, 30], [18, 31], [18, 32], [18, 33], [18, 34], [17, 31], [19, 31]], trim); }
    else { P.dots([[17, 31], [18, 31], [19, 31], [17, 32], [19, 32], [18, 33]], [214, 206, 184]); P.dots([[18, 32]], [20, 14, 18]); }
  } else if (cls === 'cleric') {
    P.shape(mEll(18, 37.5, 15.5, 11.5), pxRamp(F.robe), { cx: 13, cy: 29, rx: 16, ry: 10 });
    const G = pxRamp('#d8b048');
    for (const x of [14, 21]) P.shape(mRect(x, 26, x + 2, 36), G, { cx: x, cy: 28, rx: 4, ry: 10 });
    P.dots([[18, 29], [17, 30], [18, 30], [19, 30], [18, 31]], G[0]);
  } else if (cls === 'ranger') {
    P.shape(mEll(18, 37.5, 15, 11), pxRamp(F.robe), { cx: 13, cy: 29, rx: 16, ry: 10 });
    P.shape(mEll(18, 26.8, 9.5, 3.2), pxRamp(look.hood || '#3a6a3a'), { cx: 14, cy: 25, rx: 10, ry: 4 });
    for (let i = 0; i < 16; i++) P.set(9 + i, 29 + Math.round(i * 0.45), [70, 44, 20]);
    for (let y = 14; y < 36; y++) P.set(Math.round(28.5 + 3 * Math.sin((y - 14) / 22 * Math.PI)), y, [96, 60, 26]);
  } else if (cls === 'druid') {
    P.shape(mEll(18, 37.5, 15.5, 11.5), pxRamp(F.robe), { cx: 13, cy: 29, rx: 16, ry: 10 });
    const LV = [[120, 170, 70], [84, 130, 50], [58, 96, 38]];
    for (let x = 4; x <= 32; x++) { const y = Math.round(29 - 2.5 * Math.sin((x - 4) / 28 * Math.PI)); P.set(x, y, LV[(x * 7) % 3]); P.set(x, y + 1, LV[(x * 5 + 1) % 3]); if (x % 3 === 0) P.set(x, y - 1, LV[0]); }
    P.dots([[15, 25], [16, 25], [17, 25], [18, 25], [19, 25], [20, 25], [21, 25]], [216, 176, 72]);
  } else {
    P.shape(mEll(18, 37.5, 15.5, 11.5), pxRamp(F.robe), { cx: 13, cy: 29, rx: 16, ry: 10 });
    P.dots([[17, 28], [18, 28], [19, 28], [18, 29]], [214, 206, 184]);
    if (F.head === 'skullcrown' || F.age === 'old') P.dots([[12, 29], [13, 30], [23, 30], [24, 29]], [214, 206, 184]);
  }
}

function paintHeadgearPx(P, F, face, S, CL, look) {
  const k = F.head, GOLD = pxRamp('#d8b048'), BONE = pxRamp('#e0d8c0'), IRON = pxRamp('#5a5660');
  const helmet = (M, withNasal) => {
    P.shape(mAnd(mEll(18.2, 10.8, 9.2, 7.6), (x, y) => (face(x, y) ? y < 12.5 : y < 19)), M, { cx: 15, cy: 7, rx: 10, ry: 9 });
    if (withNasal) P.shape(mRect(18, 12, 19, 18), M, { cx: 17, cy: 12, rx: 3, ry: 6 });
    for (let x = 10; x <= 26; x++) if (face(x + 0.5, 12.5) || x < 12 || x > 24) P.set(x, 12, GOLD[2]);
  };
  if (k === 'helm') { helmet(pxRamp('#b4bccc'), true); P.shape(mPoly([[19, 4.5], [24, 0], [32, 0.5], [27, 3], [21.5, 6]]), CL, { cx: 22, cy: 1, rx: 8, ry: 4 }); }
  else if (k === 'crest') { helmet(pxRamp(F.armor || '#c8b070'), false); P.shape(mPoly([[11, 5], [14, 1], [22, 0], [27, 3], [26, 6], [18, 3.5]]), CL, { cx: 16, cy: 1, rx: 10, ry: 4 }); }
  else if (k === 'winged') {
    helmet(pxRamp('#c4ccd8'), false);
    for (const d of [1, -1]) { const X = x => (d > 0 ? x : 36.6 - x); P.shape(mPoly([[X(10.5), 10], [X(4), 3], [X(3), 7], [X(5), 7.5], [X(4), 10], [X(9.5), 13]]), pxRamp('#f0ecf0'), { cx: X(5), cy: 5, rx: 6, ry: 6 }); }
  } else if (k === 'circlet' || k === 'diadem' || k === 'spikecrown') {
    const M = k === 'spikecrown' ? IRON : GOLD;
    for (let x = 11; x <= 25; x++) P.set(x, 10 + (x < 13 || x > 23 ? 1 : 0), M[x < 17 ? 1 : x < 21 ? 2 : 3]);
    if (k === 'diadem') P.dots([[18, 8], [17, 9], [18, 9], [19, 9]], GOLD[0]);
    else if (k === 'circlet') P.set(18, 10, [200, 40, 56]);
    else for (const x of [12, 15, 18, 21, 24]) P.dots([[x, 9], [x, 8], ...(x === 18 ? [[x, 7], [x, 6]] : [[x, 7]])], IRON[x < 18 ? 1 : 2]);
  } else if (k === 'headband') {
    for (let x = 10; x <= 26; x++) P.set(x, 10 + (x < 13 || x > 23 ? 1 : 0), CL[x < 18 ? 1 : 3]);
    P.dots([[9, 11], [8, 12], [8, 13], [7, 14]], CL[2]);
  } else if (k === 'feather') {
    P.shape(mPoly([[24, 9.5], [27, 3], [31.5, 0], [29.5, 4.5], [25.6, 10.5]]), pxRamp('#e8e0cc'), { cx: 27, cy: 3, rx: 5, ry: 6 });
    for (let i = 0; i < 6; i++) P.set(25 + i, 9 - Math.round(i * 1.5), [120, 100, 70]);
  } else if (k === 'wreath' || k === 'flowers') {
    const LV = [[132, 180, 76], [90, 140, 54], [60, 100, 40]];
    for (let x = 10; x <= 26; x++) { const y = Math.round(9.5 + (x - 18) ** 2 / 26); P.set(x, y, LV[(x * 5) % 3]); if (x % 2) P.set(x, y - 1, LV[(x + 1) % 3]); }
    if (k === 'wreath') P.dots([[13, 10], [23, 10]], [200, 40, 40]);
    else for (const [x, c] of [[11, [240, 220, 240]], [14, [250, 200, 90]], [17, [230, 120, 160]], [20, [250, 250, 250]], [23, [250, 200, 90]]]) { const y = Math.round(9 + (x - 18) ** 2 / 26); P.dots([[x, y], [x + 1, y], [x, y - 1]], c); }
  } else if (k === 'antlers') {
    const A = pxRamp('#b89a70');
    for (const d of [1, -1]) {
      const X = x => (d > 0 ? x : 36.4 - x);
      P.dots([[X(11), 9], [X(10), 8], [X(9), 7], [X(8), 6], [X(7), 5], [X(6), 4], [X(6), 3], [X(5), 2], [X(9), 6], [X(10), 5], [X(10), 4], [X(7), 3], [X(8), 2], [X(4), 4], [X(3), 3]], A[d > 0 ? 1 : 3]);
    }
    const LV = [[120, 170, 70], [84, 130, 50]]; for (let x = 11; x <= 25; x++) P.set(x, 10, LV[x % 2]);
  } else if (k === 'mitre') {
    P.shape(mPoly([[11.5, 11], [13, 2], [18.2, -1], [23.5, 2], [25, 11]]), pxRamp(F.robe || '#f0ead8'), { cx: 14, cy: 3, rx: 10, ry: 10 });
    for (let x = 12; x <= 24; x++) P.set(x, 10, GOLD[1]);
    P.dots([[18, 3], [18, 4], [18, 5], [18, 6], [18, 7], [17, 5], [19, 5]], GOLD[0]);
  } else if (k === 'hood' || k === 'cowl' || k === 'veil') {
    const HD = pxRamp(k === 'hood' ? look.hood || '#3a6a3a' : F.robe), deep = k === 'cowl';
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
      if (!face(x + 0.5, y + 0.5)) continue;
      if (y <= (deep ? 9 : 8) || (y <= 11 && (x <= 11 || x >= 25))) P.set(x, y, HD[deep ? 4 : k === 'veil' ? 2 : 3]);
      else if (y <= (deep ? 11 : 9) && k !== 'veil') P.set(x, y, deep ? S[4] : S[3]);
    }
    if (k === 'veil') for (let x = 12; x <= 24; x++) P.set(x, 9, GOLD[1]);
    if (deep && F.eyes === 'glow') P.dots([[14, 15], [21, 15]], [200, 255, 200]);
  } else if (k === 'skullcrown') {
    for (let x = 11; x <= 25; x++) P.set(x, 9, BONE[x < 18 ? 1 : 3]);
    for (const x of [12, 16, 20, 24]) { P.dots([[x, 8], [x + 1, 8], [x, 7], [x + 1, 7]], BONE[1]); P.set(x, 8, [30, 20, 30]); }
  } else if (k === 'horned' || k === 'skullhelm') {
    const M = k === 'skullhelm' ? BONE : pxRamp(F.armor || '#6a6480');
    if (k === 'horned') for (const d of [1, -1]) { const X = x => (d > 0 ? x : 36.4 - x); P.shape(mPoly([[X(11.5), 10], [X(7), 6.5], [X(4), 0.5], [X(3.2), 4.5], [X(6), 9.5], [X(10.5), 13]]), BONE, { cx: X(6), cy: 3, rx: 6, ry: 8 }); }
    else for (let i = 0; i < 7; i++) { const x = 12 + i * 2; P.dots([[x, 6 - (i % 2)], [x, 5 - (i % 2)], [x + 1, 4 - (i % 3)], [x, 3 - (i % 2)]], [34, 28, 40]); } // krucze pióra
    P.shape(mEll(18.2, 14.5, 8.6, 10.2), M, { cx: 15, cy: 10, rx: 10, ry: 12 });
    if (k === 'horned') {
      for (let x = 12; x <= 24; x++) P.set(x, 15, [10, 6, 8]);
      for (let y = 16; y <= 21; y++) P.set(18, y, [10, 6, 8]);
      P.dots([[13, 19], [23, 19], [13, 21], [23, 21]], M[1]);
      for (let x = 11; x <= 25; x++) P.set(x, 11, [120, 36, 36]);
    } else {
      P.dots([[13, 14], [14, 14], [15, 14], [13, 15], [14, 15], [15, 15], [13, 16], [15, 16], [20, 14], [21, 14], [22, 14], [20, 15], [21, 15], [22, 15], [21, 16], [22, 16], [17, 18], [18, 19], [17, 19]], [20, 14, 18]);
      for (let x = 14; x <= 22; x += 2) P.dots([[x, 22], [x, 23]], BONE[4]);
    }
    P.dots([[14, 15], [21, 15]], [255, 140, 90]);
  }
}
