// Wypalanie ikon czarów z modeli 3D (czary.js): plakietka w barwie szkoły ze znakiem czaru, kratka S×S.
// Arkusz src/grafika/czary.webp, opis src/grafika/czary.json: { s: bok kratki, f: { id: [x, y] } }.
//   node tools/grafika3d/wypal-czary.js        wszystkie       node tools/grafika3d/wypal-czary.js fireball,cure   wybrane (podgląd w .cache)
'use strict';
const path = require('path'), fs = require('fs'), url = require('url');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const S = 128, COLS = 10;
(async () => {
  const only = process.argv[2] ? process.argv[2].split(',') : null, st = await openStudio({ width: 400, height: 300 });
  const game = await st.browser.newPage(); await game.goto(url.pathToFileURL(path.join(ROOT, 'Kroniki Królestw.html')).href); await game.waitForFunction(() => typeof SPELLS !== 'undefined');
  const SCH = await game.evaluate(() => Object.fromEntries(Object.entries(SPELLS).map(([id, s]) => [id, s.school]))); await game.close();
  const out = await st.page.evaluate(([SCH, only, S, COLS]) => {
    const ids = Object.keys(SCH).filter(id => !only || only.includes(id)), sheet = document.createElement('canvas'); sheet.width = COLS * S; sheet.height = Math.ceil(ids.length / COLS) * S; const g = sheet.getContext('2d'), f = {}, miss = [];
    ids.forEach((id, i) => { const c = renderSpell(id, SCH[id], S * 2); if (!c) { miss.push(id); return; } const X = (i % COLS) * S, Y = (i / COLS | 0) * S; g.imageSmoothingQuality = 'high'; g.drawImage(c, X, Y, S, S); f[id] = [X, Y]; });
    return { img: sheet.toDataURL('image/webp', 0.92).split(',')[1], png: sheet.toDataURL('image/png').split(',')[1], f, miss };
  }, [SCH, only, S, COLS]);
  if (out.miss.length) console.log('Bez modelu:', out.miss.join(', '));
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, 'czary.png'), Buffer.from(out.png, 'base64'));
  if (!only) { fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'czary.webp'), Buffer.from(out.img, 'base64')); fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'czary.json'), JSON.stringify({ s: S, f: out.f })); }
  console.log(`${Object.keys(out.f).length} czarów → ${only ? '.cache/czary.png' : 'src/grafika/czary.webp'}`); await st.browser.close();
})();
