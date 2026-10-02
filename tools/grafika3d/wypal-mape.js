// Wypalanie obiektów mapy przygody z modeli 3D (mapa3d.js): drzewa, góry, skały, surowce, skrzynia, artefakty na ziemi…
// Każda klatka przycięta do treści, z punktem zaczepienia = środek pola na ziemi. Arkusz src/grafika/mapa.webp,
// opis src/grafika/mapa.json: { d: px arkusza na piksel grafiki gry, f: { klucz: [x, y, w, h, ax, ay] } }.
//   node tools/grafika3d/wypal-mape.js                 wszystko
//   node tools/grafika3d/wypal-mape.js tree_,res_      tylko klucze o tych początkach (dopisuje do istniejącego arkusza)
//   PODGLAD=1 ...                                      bez zapisu, podgląd w tools/grafika3d/.cache/mapa.png
'use strict';
const path = require('path'), fs = require('fs'), url = require('url');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const IMG = path.join(ROOT, 'src', 'grafika', 'mapa.webp'), META = path.join(ROOT, 'src', 'grafika', 'mapa.json'), PER = 40;
(async () => {
  const t0 = Date.now(), pre = process.argv[2] ? process.argv[2].split(',') : null, prev = !process.env.PODGLAD && pre && fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  let st = await openStudio({ width: 400, height: 300 });
  const game = await st.browser.newPage(); await game.goto(url.pathToFileURL(path.join(ROOT, 'Kroniki Królestw.html')).href); await game.waitForFunction(() => typeof ARTIFACTS !== 'undefined');
  const ARTS = await game.evaluate(() => JSON.parse(JSON.stringify(ARTIFACTS))); await game.close();
  const setup = async () => st.page.evaluate(ARTS => { for (const [id, A] of Object.entries(ARTS)) if (ART3[id]) MAP3['art_' + id] = () => mpArt(id, A); return Object.keys(MAP3); }, ARTS);
  const keys = (await setup()).filter(k => !pre || pre.some(p => k.startsWith(p))), frames = [];
  for (let i = 0; i < keys.length; i += PER) { // świeża przeglądarka co PER klatek (pamięć karty programowej)
    if (i) { await st.browser.close(); st = await openStudio({ width: 400, height: 300 }); await setup(); }
    frames.push(...await st.page.evaluate(keys => keys.map(key => { const big = /^(mount)/.test(key), c = big ? renderMap3(key, 256, 320, 128, 250) : renderMap3(key);
      const W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 4) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, -x0, -y0);
      return { key, png: o.toDataURL('image/png'), w: o.width, h: o.height, ax: (big ? 128 : 128) - x0, ay: (big ? 250 : 190) - y0 }; }), keys.slice(i, i + PER)));
    process.stdout.write(`${Math.min(keys.length, i + PER)}/${keys.length} `);
  }
  // stary arkusz: klatki spoza wypalanych kluczy zostają
  if (prev && fs.existsSync(IMG)) { const b64 = fs.readFileSync(IMG).toString('base64'); const old = await st.page.evaluate(async ([b64, f, skip]) => { const im = new Image(); im.src = 'data:image/webp;base64,' + b64; await im.decode();
      return Object.entries(f).filter(([k]) => !skip.includes(k)).map(([key, [x, y, w, h, ax, ay]]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, -x, -y); return { key, png: c.toDataURL('image/png'), w, h, ax, ay }; }); }, [b64, prev.f, keys]);
    frames.push(...old); }
  const sheet = await st.page.evaluate(async frames => {
    const imgs = await Promise.all(frames.map(f => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = f.png; })));
    const order = frames.map((f, i) => i).sort((a, b) => frames[b].h - frames[a].h), SW = 2048, pos = []; let x = 0, y = 0, rh = 0;
    for (const i of order) { const f = frames[i]; if (x + f.w > SW) { x = 0; y += rh + 1; rh = 0; } pos[i] = [x, y]; x += f.w + 1; rh = Math.max(rh, f.h); }
    const c = document.createElement('canvas'); c.width = SW; c.height = y + rh; const g = c.getContext('2d'), out = {};
    frames.forEach((f, i) => { g.drawImage(imgs[i], pos[i][0], pos[i][1]); out[f.key] = [pos[i][0], pos[i][1], f.w, f.h, f.ax, f.ay]; });
    return { img: c.toDataURL('image/webp', 0.9).split(',')[1], png: c.toDataURL('image/png').split(',')[1], f: out };
  }, frames);
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, 'mapa.png'), Buffer.from(sheet.png, 'base64'));
  if (!process.env.PODGLAD) { fs.writeFileSync(IMG, Buffer.from(sheet.img, 'base64')); fs.writeFileSync(META, JSON.stringify({ d: 4, f: sheet.f })); }
  console.log(`\n${Object.keys(sheet.f).length} klatek, ${((Date.now() - t0) / 1000) | 0} s`); await st.browser.close();
})();
