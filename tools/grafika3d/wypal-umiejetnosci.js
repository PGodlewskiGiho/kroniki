// Wypalanie ikon umiejętności z modeli 3D (umiejetnosci.js): plakietka z przedmiotem w kwadracie S×S, bez pikselizacji.
// Arkusz src/grafika/umiejetnosci.webp, opis src/grafika/umiejetnosci.json: { s: bok kratki, f: { id: [x, y] } }.
//   node tools/grafika3d/wypal-umiejetnosci.js        wszystkie       node tools/grafika3d/wypal-umiejetnosci.js luck,wisdom   wybrane (podgląd w .cache)
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const S = 128, COLS = 9;
(async () => {
  const only = process.argv[2] ? process.argv[2].split(',') : null, st = await openStudio({ width: 400, height: 300 });
  const out = await st.page.evaluate(([only, S, COLS]) => {
    const ids = Object.keys(SK3).filter(id => !only || only.includes(id)), sheet = document.createElement('canvas'); sheet.width = COLS * S; sheet.height = Math.ceil(ids.length / COLS) * S; const g = sheet.getContext('2d'), f = {};
    ids.forEach((id, i) => { const c = renderSkill(id, S * 2), X = (i % COLS) * S, Y = (i / COLS | 0) * S; g.imageSmoothingQuality = 'high'; g.drawImage(c, X, Y, S, S); f[id] = [X, Y]; });
    return { img: sheet.toDataURL('image/webp', 0.92).split(',')[1], png: sheet.toDataURL('image/png').split(',')[1], f };
  }, [only, S, COLS]);
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, 'umiejetnosci.png'), Buffer.from(out.png, 'base64'));
  if (!only) { fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'umiejetnosci.webp'), Buffer.from(out.img, 'base64')); fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'umiejetnosci.json'), JSON.stringify({ s: S, f: out.f })); }
  console.log(`${Object.keys(out.f).length} ikon → ${only ? '.cache/umiejetnosci.png' : 'src/grafika/umiejetnosci.webp'}`); await st.browser.close();
})();
