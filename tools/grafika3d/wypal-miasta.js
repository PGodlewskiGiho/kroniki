// Wypalanie budowli miast z modeli 3D (budowle.js): dla każdej frakcji arkusz src/grafika/miasta/<frakcja>.png z klatkami
// wszystkich budowli we wszystkich stopniach i opis w src/grafika/miasta.json. build.js wbudowuje je w grę (TOWN_BUILD_ART).
//   node tools/grafika3d/wypal-miasta.js            wszystkie frakcje z modelami      node tools/grafika3d/wypal-miasta.js haven,sylvan
// Gęstość: każda budowla w skali, w jakiej stoi w scenie (miejsce: k / Z), przy pikselu sceny miasta TOWN_PIX (1,35 px) razy Q.
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const OUT = path.join(ROOT, 'src', 'grafika', 'miasta'), META = path.join(ROOT, 'src', 'grafika', 'miasta.json');
const PIXD = 1.35, Q = +(process.env.Q || 1);
// klucz budowli (grupa + stopień) -> miejsce w scenie (jak BUILDINGS.slot)
const KEYS = [['hall', 4, 0], ['fort', 3, 1], ['guild', 5, 2], ['dw7', 3, 3], ['dw6', 3, 4], ['dw5', 3, 5], ['dw4', 3, 6], ['dw3', 3, 7], ['smith', 1, 8], ['silo', 1, 9],
  ['dw1', 3, 10], ['dw2', 3, 11], ['tavern', 1, 12], ['market', 1, 13], ['special', 1, 14], ['grail', 1, 15]];
(async () => {
  const t0 = Date.now(), only = process.argv[2] ? process.argv[2].split(',') : null; fs.mkdirSync(OUT, { recursive: true });
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
  const st = await openStudio({ width: 400, height: 300 });
  const facs = (await st.page.evaluate(() => Object.keys(TOWN3))).filter(f => !only || only.includes(f));
  for (const fac of facs) {
    const r = await st.page.evaluate(([fac, KEYS, PIXD, Q]) => {
      const frames = []; const slots = TOWNS[fac].slots;
      for (const [grp, n, slot] of KEYS) for (let t = 1; t <= n; t++) {
        const key = grp + t, S = slots[slot], D = S.k / S.Z / PIXD * Q, c = renderBuilding(fac, key, S.w, S.h, D); if (!c) continue;
        const W = c.width, H = c.height, ax = Math.round(W / 2), ay = H - Math.round(14 * D), d = c.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) continue; frames.push({ key, c, sx: x0, sy: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, ax: ax - x0, ay: ay - y0, D, m: c._marks.map(([nm, x, y]) => [nm, Math.round((x - ax) * 10) / 10, Math.round((y - ay) * 10) / 10]) });
      }
      // arkusz: klatki w rzędach do szerokości 1024
      let x = 0, y = 0, rh = 0, sw = 0; for (const f of frames) { if (x + f.w > 1024) { x = 0; y += rh + 1; rh = 0; } f.px = x; f.py = y; x += f.w + 1; rh = Math.max(rh, f.h); sw = Math.max(sw, x); }
      const sheet = document.createElement('canvas'); sheet.width = sw; sheet.height = y + rh; const g = sheet.getContext('2d'), out = {};
      for (const f of frames) { g.drawImage(f.c, f.sx, f.sy, f.w, f.h, f.px, f.py, f.w, f.h); out[f.key] = { f: [f.px, f.py, f.w, f.h, f.ax, f.ay], d: Math.round(f.D * 1000) / 1000, ...(f.m.length ? { m: f.m } : {}) }; }
      return { png: sheet.toDataURL('image/png').split(',')[1], b: out };
    }, [fac, KEYS, PIXD, Q]);
    fs.writeFileSync(path.join(OUT, fac + '.png'), Buffer.from(r.png, 'base64')); meta[fac] = r.b; fs.writeFileSync(META, JSON.stringify(meta));
    console.log(`${fac}: ${Object.keys(r.b).length} budowli`);
  }
  await st.browser.close(); console.log(`Gotowe w ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
