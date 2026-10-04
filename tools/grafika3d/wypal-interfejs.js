// Wypalanie ozdób i ikon interfejsu z modeli 3D (interfejs.js) do arkusza src/grafika/interfejs.webp; opis src/grafika/interfejs.json:
// { f: { klucz: [x, y, w, h] } } w pikselach arkusza (2× rozmiaru w grze: gra rysuje je w połowie, ostro także na gęstych ekranach).
//   node tools/grafika3d/wypal-interfejs.js     (podgląd zawsze w tools/grafika3d/.cache/interfejs.png)
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const ITEMS = [['corner_tl', 112, 112], ['corner_tr', 112, 112, [-1, 1]], ['corner_bl', 112, 112, [1, -1]], ['corner_br', 112, 112, [-1, -1]], ['rivet', 40, 40], ['medal', 112, 112], ['divider', 320, 64], ['ring', 112, 112],
  ...['crown', 'next', 'move', 'sleep', 'book', 'gear', 'dig', 'puzzle', 'stairs', 'hourglass', 'sword', 'shield', 'orb', 'scroll', 'up', 'down', 'left', 'right', 'plus', 'minus', 'swap'].map(k => ['ic_' + k, 96, 96]),
  ...['wood', 'ore', 'mercury', 'sulfur', 'crystal', 'gems', 'gold'].map(k => ['res_' + k, 64, 64, null, { pitch: 0.55, yaw: 0.5 }])];
(async () => {
  const st = await openStudio({ width: 400, height: 300 });
  const out = await st.page.evaluate(ITEMS => {
    const W = 1024, f = {}, cs = []; let x = 0, y = 0, rowH = 0;
    for (const [k, w, h, m, v] of ITEMS) { const c = renderUi(k, w, h, m, v); if (!c) continue; if (x + w > W) { x = 0; y += rowH + 2; rowH = 0; } f[k] = [x, y, w, h]; cs.push([c, x, y]); x += w + 2; rowH = Math.max(rowH, h); }
    const sheet = document.createElement('canvas'); sheet.width = W; sheet.height = y + rowH; const g = sheet.getContext('2d'); for (const [c, x, y] of cs) g.drawImage(c, x, y);
    return { img: sheet.toDataURL('image/webp', 0.95).split(',')[1], png: sheet.toDataURL('image/png').split(',')[1], f };
  }, ITEMS);
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, 'interfejs.png'), Buffer.from(out.png, 'base64'));
  fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'interfejs.webp'), Buffer.from(out.img, 'base64')); fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'interfejs.json'), JSON.stringify({ f: out.f }));
  console.log(`${Object.keys(out.f).length} ozdób → src/grafika/interfejs.webp`); await st.browser.close();
})();
