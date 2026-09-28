// ==================== GRAFIKA: JEDNOSTKI Z MODELI 3D ============================================
// Jednostki są wypalone z modeli 3D (tools/grafika3d, npm run grafika) do arkuszy PNG wbudowanych w grę (UNIT_ART:
// opis klatek i obrazek base64). Klatka = [x, y, w, h, ax, ay] w arkuszu, (ax, ay) = stopy. Bitwa: 1 piksel arkusza = u px
// logicznych (1,3), mapa: mu (1,8). Dla dir = -1 klatka jest odbita w poziomie. Jednostka bez arkusza (albo zanim obrazek
// się wczyta) korzysta z dawnego rysunku wektorowego (battleSprite2D, creatureSprite2D).
const UNIT_IMG = {}, HERO_IMG = {};
function loadUnitArt() {
  if (typeof UNIT_ART === 'undefined') return;
  const load = (set, store) => { for (const [id, A] of Object.entries(set)) { if (store[id] || !A.png) continue; const im = new Image(); im.onload = () => { im._ok = true; G.dirty = true; }; im.src = 'data:image/png;base64,' + A.png; store[id] = im; } };
  load(UNIT_ART, UNIT_IMG); if (typeof HERO_ART !== 'undefined') load(HERO_ART, HERO_IMG);
}
const unitArt = cid => { const A = typeof UNIT_ART !== 'undefined' && UNIT_ART[cid], im = UNIT_IMG[cid]; return A && im && im._ok ? A : null; };
const unitArtReady = () => (typeof UNIT_ART === 'undefined' || Object.keys(UNIT_ART).every(cid => UNIT_IMG[cid] && UNIT_IMG[cid]._ok)) && (typeof HERO_ART === 'undefined' || Object.keys(HERO_ART).every(c => HERO_IMG[c] && HERO_IMG[c]._ok));
// Klatka arkusza jako sprite ({ c, ax, ay, u }); odbicie dla dir = -1
function artFrame(cid, pose, i, dir, u) {
  const key = `u3_${cid}_${pose}_${i}_${dir}`; let s = SPR.get(key); if (s) return s;
  const A = UNIT_ART[cid], fr = (A.f[pose] || A.f.idle)[i % (A.f[pose] || A.f.idle).length], [x, y, w, h, ax, ay] = fr;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); c._ctx = g;
  if (dir < 0) { g.translate(w, 0); g.scale(-1, 1); } g.drawImage(UNIT_IMG[cid], x, y, w, h, 0, 0, w, h);
  s = { c, ax: dir < 0 ? w - ax : ax, ay, u }; SPR.set(key, s); return s;
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
// Bohater w bitwie (jeździec z chorągwią): arkusz klasy, a części w kolorze-kluczu (magenta) dostają barwę gracza
// z zachowaniem cieniowania. i: klatka, cast: rzucanie czaru. Bez arkusza: dawny rysunek (heroBattleSprite2D).
function heroBattleSprite(h, col, dir, i, cast) {
  const A = typeof HERO_ART !== 'undefined' && HERO_ART[h.cls], im = HERO_IMG[h.cls]; if (!A || !im || !im._ok) return heroBattleSprite2D(h, col, dir, i, cast);
  const pose = cast ? 'cast' : 'idle', key = `h3_${h.cls}_${col}_${pose}_${i}_${dir}`; let s = SPR.get(key); if (s) return s;
  const fr = A.f[pose][i % A.f[pose].length], [x, y, w, hh, ax, ay] = fr, c = document.createElement('canvas'); c.width = w; c.height = hh; const g = c.getContext('2d', { willReadFrequently: true }); c._ctx = g;
  if (dir < 0) { g.translate(w, 0); g.scale(-1, 1); } g.drawImage(im, x, y, w, hh, 0, 0, w, hh); g.setTransform(1, 0, 0, 1, 0, 0);
  const img = g.getImageData(0, 0, w, hh), d = img.data, [cr, cg, cb] = hexRgb(col);
  for (let k = 0; k < d.length; k += 4) { const r = d[k], gg = d[k + 1], b = d[k + 2]; if (!d[k + 3] || r < 40 || b < 40 || gg > Math.min(r, b) * 0.6 || Math.abs(r - b) > Math.max(r, b) * 0.45) continue;
    const l = Math.min(1.35, (r + b) / 2 / 200); d[k] = Math.min(255, cr * l); d[k + 1] = Math.min(255, cg * l); d[k + 2] = Math.min(255, cb * l); }
  g.putImageData(img, 0, 0); s = { c, ax: dir < 0 ? w - ax : ax, ay, u: A.u }; SPR.set(key, s); return s;
}
