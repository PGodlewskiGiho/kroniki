// Wypalanie grafik jednostek: każda jednostka z modelem 3D (modele.js, postacie.js, zwierzeta.js) dostaje arkusz PNG
// z klatkami bitwy (spoczynek, chód, atak, zranienie, śmierć) i mapy, zapisany w src/grafika/jednostki/<cid>.png,
// oraz opis klatek w src/grafika/jednostki.json. build.js wbudowuje je w plik gry. Uruchom po zmianie modeli:
//   npm run grafika            wszystkie jednostki          npm run grafika -- orc,troll     wybrane
//   npm run grafika -- --nowe  tylko brakujące arkusze (wznowienie przerwanego wypalania)
//   npm run grafika -- x --bohaterowie   tylko bohaterowie (x = brak jednostek)
// Każda jednostka zapisuje się od razu po wyrenderowaniu.
// Render idzie w kilku przeglądarkach naraz (bez karty graficznej to kilka minut).
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const OUT_DIR = path.join(ROOT, 'src', 'grafika', 'jednostki'), META = path.join(ROOT, 'src', 'grafika', 'jednostki.json');
// Skala: w bitwie 1 piksel grafiki = UB px logicznych, na mapie UM; KB/KM = pikseli na jednostkę świata (człowiek ≈ 2 jednostki)
const UB = 1.3, UM = 1.8, KB = 32 / UB, KM = 15.4 / UM;
const WORKERS = +(process.env.WORKERS || 3);

async function bakeGroup(ids, done) {
  if (!ids.length) return;
  let st = null, n = 0; const retry = {};
  for (const id of ids) {
    if (!st || n++ % 6 === 0) { if (st) await st.browser.close(); st = await openStudio({ width: 400, height: 300 }); } // świeża przeglądarka co kilka jednostek (pamięć karty programowej)
    const page = st.page;
    const r = await page.evaluate(([id, KB, KM, UB, UM]) => {
      const L = CREATURES[id].look, s = Math.max(1, L.size || 1), F = BATTLE_FRAMES, frames = []; window.__blank = 0;
      if (!buildUnit(L, {})) return null;
      const W = Math.round(150 * s), H = Math.round(150 * s), AX = Math.round(W * 0.45), AY = H - Math.round(18 * s);
      const add = (pose, i, P, map) => {
        const g0 = buildUnit(L, P), g = pose === 'dead' ? layDead(g0, L) : g0;
        const c = map ? G3.render(g, Math.round(W * KM / KB) + 4, Math.round(H * KM / KB) + 4, KM, Math.round(AX * KM / KB) + 2, Math.round(AY * KM / KB) + 2) : G3.render(g, W, H, KB, AX, AY);
        const ax = map ? Math.round(AX * KM / KB) + 2 : AX, ay = map ? Math.round(AY * KM / KB) + 2 : AY;
        // przycięcie do zajętych pikseli (z marginesem 1 px)
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; window.__blank = (window.__blank || 0) + 1; }
        frames.push({ pose, i, c, sx: x0, sy: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, ax: ax - x0, ay: ay - y0 });
      };
      for (let i = 0; i < F.idle; i++) add('idle', i, { t: i / F.idle * Math.PI * 2 / 2.4 });
      for (let i = 0; i < F.walk; i++) add('walk', i, { t: i * 0.2, walk: i / F.walk });
      for (let i = 0; i < F.attack; i++) add('attack', i, { t: 0, atk: i / (F.attack - 1) });
      add('hurt', 0, { t: 0, hurt: true }); add('dead', 0, { t: 0 });
      for (let i = 0; i < 4; i++) add('map', i, { t: i / 4 * Math.PI * 2 / 2.4 }, true);
      // arkusz: klatki jedna obok drugiej w rzędach po pozach
      const rows = {}; for (const f of frames) (rows[f.pose] = rows[f.pose] || []).push(f);
      let sw = 0, sh = 0; for (const r of Object.values(rows)) { sw = Math.max(sw, r.reduce((a, f) => a + f.w + 1, 0)); sh += Math.max(...r.map(f => f.h)) + 1; }
      const sheet = document.createElement('canvas'); sheet.width = sw; sheet.height = sh; const g = sheet.getContext('2d'), meta = {};
      let y = 0; for (const [pose, r] of Object.entries(rows)) { let x = 0; meta[pose] = r.map(f => { g.drawImage(f.c, f.sx, f.sy, f.w, f.h, x, y, f.w, f.h); const m = [x, y, f.w, f.h, f.ax, f.ay]; x += f.w + 1; return m; }); y += Math.max(...r.map(f => f.h)) + 1; }
      return window.__blank ? { blank: window.__blank } : { png: sheet.toDataURL('image/png').split(',')[1], f: meta, u: UB, mu: UM };
    }, [id, KB, KM, UB, UM]);
    if (r && r.blank) { // pusta klatka: kontekst grafiki padł (np. brak pamięci) - świeża przeglądarka i jeszcze raz
      process.stdout.write('!'); await st.browser.close(); st = null; n = 0; ids.push(id); if ((retry[id] = (retry[id] || 0) + 1) > 2) throw new Error(`Puste klatki: ${id}`); continue; }
    done(id, r); process.stdout.write(r ? '.' : '-');
  }
  if (st) await st.browser.close();
}

// Bohaterowie w bitwie: jeździec z chorągwią dla każdej klasy; części w barwie gracza w kolorze-kluczu (magenta), który gra
// podmienia na kolor właściciela. Klatki: spoczynek (4) i rzucanie czaru (7, jak atak).
const HERO_DIR = path.join(ROOT, 'src', 'grafika', 'bohaterowie'), HERO_META = path.join(ROOT, 'src', 'grafika', 'bohaterowie.json');
async function bakeHeroes(fresh) {
  const meta = fs.existsSync(HERO_META) ? JSON.parse(fs.readFileSync(HERO_META, 'utf8')) : {}; fs.mkdirSync(HERO_DIR, { recursive: true });
  const { browser, page } = await openStudio({ width: 400, height: 300 });
  const classes = (await page.evaluate(() => Object.keys(HERO_LOOKS3))).filter(c => !fresh || !meta[c]);
  for (const cls of classes) {
    const r = await page.evaluate(([cls, KB, UB]) => {
      const H = HERO_LOOKS3[cls], mage = MAGES.includes(cls), KEY = '#ff00ff', F = BATTLE_FRAMES;
      const L = { kind: 'rider', horse: H.horse, mane: H.mane, skin: H.skin, cloth: KEY, weapon: mage ? 'staff' : 'sword', helm: H.hood ? 'hood' : 'helm', hoodCol: H.hood, helmCol: H.helm, metal: H.armor, armor: !H.hood, cape: KEY, barding: KEY, trim: '#e0b24a', banner: KEY, orb: '#a0d0ff' };
      const W = 170, Hh = 190, AX = 80, AY = 170, frames = [];
      const add = (pose, i, P) => { const c = G3.render(rider(L, P), W, Hh, KB, AX, AY), d = c.getContext('2d').getImageData(0, 0, W, Hh).data; let x0 = W, y0 = Hh, x1 = -1, y1 = -1;
        for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        frames.push({ pose, c, sx: x0, sy: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, ax: AX - x0, ay: AY - y0 }); };
      for (let i = 0; i < F.idle; i++) add('idle', i, { t: i / F.idle * Math.PI * 2 / 2.4 });
      for (let i = 0; i < F.attack; i++) add('cast', i, { t: 0, atk: i / (F.attack - 1) });
      const rows = {}; for (const f of frames) (rows[f.pose] = rows[f.pose] || []).push(f);
      let sw = 0, sh = 0; for (const rr of Object.values(rows)) { sw = Math.max(sw, rr.reduce((a, f) => a + f.w + 1, 0)); sh += Math.max(...rr.map(f => f.h)) + 1; }
      const sheet = document.createElement('canvas'); sheet.width = sw; sheet.height = sh; const g = sheet.getContext('2d'), m = {};
      let y = 0; for (const [pose, rr] of Object.entries(rows)) { let x = 0; m[pose] = rr.map(f => { g.drawImage(f.c, f.sx, f.sy, f.w, f.h, x, y, f.w, f.h); const q = [x, y, f.w, f.h, f.ax, f.ay]; x += f.w + 1; return q; }); y += Math.max(...rr.map(f => f.h)) + 1; }
      return { png: sheet.toDataURL('image/png').split(',')[1], f: m, u: UB };
    }, [cls, KB, UB]);
    fs.writeFileSync(path.join(HERO_DIR, cls + '.png'), Buffer.from(r.png, 'base64')); meta[cls] = { u: r.u, f: r.f }; fs.writeFileSync(HERO_META, JSON.stringify(meta)); process.stdout.write('h');
  }
  await browser.close();
}

(async () => {
  const t0 = Date.now(), args = process.argv.slice(2), fresh = args.includes('--nowe'), arg = args.find(a => !a.startsWith('--')), only = arg ? arg.split(',') : null;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
  const { browser, page } = await openStudio({ width: 200, height: 200 });
  let ids = await page.evaluate(only => Object.keys(CREATURES).filter(id => (!only || only.includes(id)) && buildUnit(CREATURES[id].look, {})), only); await browser.close();
  if (!only && !fresh) for (const id of Object.keys(meta)) if (!ids.includes(id)) { delete meta[id]; const f = path.join(OUT_DIR, id + '.png'); if (fs.existsSync(f)) fs.unlinkSync(f); } // jednostki bez modelu
  if (fresh) ids = ids.filter(id => !meta[id] || !fs.existsSync(path.join(OUT_DIR, id + '.png')));
  console.log(`Wypalanie ${ids.length} jednostek w ${WORKERS} przeglądarkach…`);
  const done = (id, r) => { if (!r) return; fs.writeFileSync(path.join(OUT_DIR, id + '.png'), Buffer.from(r.png, 'base64')); meta[id] = { u: r.u, mu: r.mu, f: r.f }; fs.writeFileSync(META, JSON.stringify(meta)); };
  await Promise.all(Array.from({ length: WORKERS }, (_, k) => bakeGroup(ids.filter((_, i) => i % WORKERS === k), done)));
  if (!only || args.includes('--bohaterowie')) await bakeHeroes(fresh);
  const bytes = fs.readdirSync(OUT_DIR).reduce((s, f) => s + fs.statSync(path.join(OUT_DIR, f)).size, 0);
  console.log(`\nGotowe: ${Object.keys(meta).length} arkuszy, ${(bytes / 1024 / 1024).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
