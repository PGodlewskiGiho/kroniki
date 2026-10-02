// ==================== GRAFIKA: JEDNOSTKI Z MODELI 3D ============================================
// Jednostki są wypalone z modeli 3D (tools/grafika3d, npm run grafika) do arkuszy PNG wbudowanych w grę (UNIT_ART:
// opis klatek i obrazek base64). Klatka = [x, y, w, h, ax, ay] w arkuszu, (ax, ay) = stopy. Bitwa: 1 piksel arkusza = u px
// logicznych (1,3), mapa: mu (1,8). Dla dir = -1 klatka jest odbita w poziomie. Jednostka bez arkusza (albo zanim obrazek
// się wczyta) korzysta z dawnego rysunku wektorowego (battleSprite2D, creatureSprite2D).
const UNIT_IMG = {}, HERO_IMG = {}, PORTRAIT_IMG = {}, TOWN_IMG = {}, ARTIFACT_IMG = {}, MAP3D_IMG = {};
function loadUnitArt() {
  if (typeof UNIT_ART === 'undefined') return;
  const load = (set, store) => { for (const [id, A] of Object.entries(set)) { const png = typeof A === 'string' ? A : A.png; if (store[id] || !png) continue; const im = new Image(); im.onload = () => { im._ok = true; G.dirty = true; }; im.src = `data:image/${A.webp ? 'webp' : 'png'};base64,` + png; store[id] = im; } };
  load(UNIT_ART, UNIT_IMG); if (typeof HERO_ART !== 'undefined') load(HERO_ART, HERO_IMG); if (typeof HERO_PORTRAITS !== 'undefined') load(HERO_PORTRAITS, PORTRAIT_IMG); if (typeof TOWN_BUILD_ART !== 'undefined') load(TOWN_BUILD_ART, TOWN_IMG); if (typeof ARTIFACT_ART !== 'undefined' && ARTIFACT_ART) load({ sheet: ARTIFACT_ART }, ARTIFACT_IMG); if (typeof MAP3D_ART !== 'undefined' && MAP3D_ART) { load({ sheet: MAP3D_ART }, MAP3D_IMG); // teren z drzewami i górami malowany wcześniej dawnymi rysunkami: od nowa
    MAP3D_IMG.sheet.addEventListener('load', () => { if (typeof MapRender !== 'undefined' && MapRender.map) MapRender.reset(MapRender.map, MapRender.explored); }); }
}
// Portret bohatera z obrazu (tools/portrety-ai), gdy jest wbudowany i wczytany
const portraitArt = h => { const im = PORTRAIT_IMG[h.name]; return im && im._ok ? im : null; };
const unitArt = cid => { const A = typeof UNIT_ART !== 'undefined' && UNIT_ART[cid], im = UNIT_IMG[cid]; return A && im && im._ok ? A : null; };
const unitArtReady = () => (typeof UNIT_ART === 'undefined' || Object.keys(UNIT_ART).every(cid => UNIT_IMG[cid] && UNIT_IMG[cid]._ok)) && (typeof HERO_ART === 'undefined' || Object.keys(HERO_ART).every(c => HERO_IMG[c] && HERO_IMG[c]._ok))
  && (typeof HERO_PORTRAITS === 'undefined' || Object.keys(HERO_PORTRAITS).every(n => PORTRAIT_IMG[n] && PORTRAIT_IMG[n]._ok))
  && (typeof TOWN_BUILD_ART === 'undefined' || Object.keys(TOWN_BUILD_ART).every(f => TOWN_IMG[f] && TOWN_IMG[f]._ok))
  && (typeof ARTIFACT_ART === 'undefined' || !ARTIFACT_ART || (ARTIFACT_IMG.sheet && ARTIFACT_IMG.sheet._ok))
  && (typeof MAP3D_ART === 'undefined' || !MAP3D_ART || (MAP3D_IMG.sheet && MAP3D_IMG.sheet._ok));
// Obiekt mapy wypalony z 3D (tools/grafika3d/wypal-mape.js) jako sprite w gęstości grafiki (PXD pikseli na piksel grafiki),
// pomniejszony raz z wygładzaniem; null, gdy brak klatki albo arkusz jeszcze się nie wczytał (wtedy dawny rysunek)
// Maszty flag właściciela obiektu 3D (px logiczne względem punktu zaczepienia); bez masztów w modelu: szczyt środka rysunku
function map3dFlags(key) {
  const A = MAP3D_ART, f = A && A.f[key], s = map3dSprite(key); if (!f || !s) return [];
  const k = 2 / A.d, fl = (f[6] || []).filter(([, y]) => y * k < -16).slice(0, 2).map(([x, y]) => [x * k, y * k]);
  return fl.length ? fl : [[0, -s.ay * s.u + 6]];
}
function map3dSprite(key) {
  const A = typeof MAP3D_ART !== 'undefined' && MAP3D_ART, im = MAP3D_IMG.sheet, f = A && A.f[key]; if (!f || !im || !im._ok) return null;
  const sk = `m3_${key}`; let s = SPR.get(sk); if (s) return s; const [x, y, w, h, ax, ay] = f, k = PXD / A.d, cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
  const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d'); c._ctx = g; g.imageSmoothingQuality = 'high'; g.drawImage(im, x, y, w, h, 0, 0, cw, ch);
  s = { c, ax: ax * cw / w, ay: ay * ch / h, u: 2 / PXD, raw: true }; SPR.set(sk, s); return s;
}
// Klatka arkusza jako sprite ({ c, ax, ay, u }); odbicie dla dir = -1. Pozy: idle, walk, fly (latające), attack, hurt, dead, map
function artFrame(cid, pose, i, dir, u) {
  const key = `u3_${cid}_${pose}_${i}_${dir}`; let s = SPR.get(key); if (s) return s;
  const A = UNIT_ART[cid], row = A.f[pose] || (pose === 'fly' && A.f.walk) || A.f.idle, [x, y, w, h, ax, ay] = row[i % row.length]; // lot bez własnych klatek: chód
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); c._ctx = g;
  if (dir < 0) { g.translate(w, 0); g.scale(-1, 1); } g.drawImage(UNIT_IMG[cid], x, y, w, h, 0, 0, w, h);
  s = { c, ax: dir < 0 ? w - ax : ax, ay, u, raw: !!A.raw }; SPR.set(key, s); return s;
}
// Sprite bitewny jednostki w pozie i klatce animacji
function battleSprite(cid, dir, pose, i = 0) { const A = unitArt(cid); return A ? artFrame(cid, pose, i, dir, A.u) : battleSprite2D(cid, dir, pose, i); }
// Mała figurka na mapie przygody (4 klatki spoczynku)
function creatureSprite(cid, dir, i = 0) { const A = unitArt(cid); return A ? artFrame(cid, 'map', i, dir, A.mu) : creatureSprite2D(cid, dir, i); }
// Jednostka w oknach i panelach: k = powiększenie jak dla figurki mapy (k ≥ 1,4: klatka bitewna, ostrzejsza)
function drawCreatureIcon(ctx, cid, x, y, k = 1) {
  if (unitArt(cid) && k >= 1.4) drawSprite(ctx, battleSprite(cid, 1, 'idle', 0), x, y, k / 2);
  else drawSprite(ctx, creatureSprite(cid, 1), x, y, k);
}
// Bohater na mapie przygody: ten sam jeździec 3D co w bitwie (klatki spoczynku, w ruchu szybciej), zmniejszony do ok. 46 px; na łodzi dawny rysunek
const HERO_MAP_H = 46;
function heroMap3d(h, col) {
  const A = typeof HERO_ART !== 'undefined' && HERO_ART[h.cls], im = HERO_IMG[h.cls]; if (h.boat || !A || !im || !im._ok) return null;
  const walk = !!(h.anim && A.f.walk), n = (walk ? A.f.walk : A.f.idle).length, s = heroBattleSprite(h, col, h.dir < 0 ? -1 : 1, Math.floor(G.time * (walk ? 12 : 3)) % n, walk ? 'walk' : false);
  return s._map || (s._map = { c: s.c, ax: s.ax, ay: s.ay, u: HERO_MAP_H / A.f.idle[0][3], raw: true });
}
// Bohater w bitwie (jeździec z chorągwią): arkusz klasy, a części w kolorze-kluczu (magenta) dostają barwę gracza
// z zachowaniem cieniowania. i: klatka, cast: rzucanie czaru. Bez arkusza: dawny rysunek (heroBattleSprite2D).
// Kolor-klucz (magenta) w wypalonej grafice zamieniony na barwę gracza z zachowaniem cieniowania
function keyTint(g, w, h, col) {
  const img = g.getImageData(0, 0, w, h), d = img.data, [cr, cg, cb] = hexRgb(col);
  for (let k = 0; k < d.length; k += 4) { const r = d[k], gg = d[k + 1], b = d[k + 2]; if (!d[k + 3] || r < 40 || b < 40 || gg > Math.min(r, b) * 0.6 || Math.abs(r - b) > Math.max(r, b) * 0.45) continue;
    const l = Math.min(1.35, (r + b) / 2 / 200); d[k] = Math.min(255, cr * l); d[k + 1] = Math.min(255, cg * l); d[k + 2] = Math.min(255, cb * l); }
  g.putImageData(img, 0, 0);
}
// Obiekt mapy 3D z częściami w barwie gracza (karawana, łódź z bohaterem); flip: odbity w poziomie
function map3dTinted(key, col, flip = false) {
  const sk = `m3t_${key}_${col}_${flip ? 1 : 0}`; let s = SPR.get(sk); if (s) return s; const b = map3dSprite(key); if (!b) return null;
  const c = document.createElement('canvas'); c.width = b.c.width; c.height = b.c.height; const g = c.getContext('2d', { willReadFrequently: true }); c._ctx = g;
  if (flip) { g.translate(c.width, 0); g.scale(-1, 1); } g.drawImage(b.c, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); keyTint(g, c.width, c.height, col);
  s = { c, ax: flip ? c.width - b.ax : b.ax, ay: b.ay, u: b.u, raw: true }; SPR.set(sk, s); return s;
}
function heroBattleSprite(h, col, dir, i, cast) {
  const A = typeof HERO_ART !== 'undefined' && HERO_ART[h.cls], im = HERO_IMG[h.cls]; if (!A || !im || !im._ok) return heroBattleSprite2D(h, col, dir, i, cast);
  const pose = cast === 'walk' && A.f.walk ? 'walk' : cast && cast !== 'walk' ? 'cast' : 'idle', key = `h3_${h.cls}_${col}_${pose}_${i}_${dir}`; /* cast = walk: chód (mapa) */ let s = SPR.get(key); if (s) return s;
  const fr = A.f[pose][i % A.f[pose].length], [x, y, w, hh, ax, ay] = fr, c = document.createElement('canvas'); c.width = w; c.height = hh; const g = c.getContext('2d', { willReadFrequently: true }); c._ctx = g;
  if (dir < 0) { g.translate(w, 0); g.scale(-1, 1); } g.drawImage(im, x, y, w, hh, 0, 0, w, hh); g.setTransform(1, 0, 0, 1, 0, 0);
  keyTint(g, w, hh, col); s = { c, ax: dir < 0 ? w - ax : ax, ay, u: A.u, raw: !!A.raw }; SPR.set(key, s); return s;
}
