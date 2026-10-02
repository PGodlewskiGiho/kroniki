// Wypalanie artefaktów z modeli 3D (artefakty.js): każdy artefakt w kwadracie S×S (kadr dopasowany do bryły, bez pikselizacji),
// relikwie i Graal z miękką poświatą. Arkusz src/grafika/artefakty.webp, opis src/grafika/artefakty.json: { s: bok kratki, f: { id: [x, y] } }.
//   node tools/grafika3d/wypal-artefakty.js            wszystkie       node tools/grafika3d/wypal-artefakty.js grail,oakShield   wybrane (podgląd w .cache)
'use strict';
const path = require('path'), fs = require('fs'), url = require('url');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const S = 128, COLS = 10;
(async () => {
  const only = process.argv[2] ? process.argv[2].split(',') : null, st = await openStudio({ width: 400, height: 300 });
  const game = await st.browser.newPage(); await game.goto(url.pathToFileURL(path.join(ROOT, 'Kroniki Królestw.html')).href); await game.waitForFunction(() => typeof ARTIFACTS !== 'undefined');
  const ARTS = await game.evaluate(() => JSON.parse(JSON.stringify(ARTIFACTS))); await game.close();
  const ids = Object.keys(ARTS).filter(id => !only || only.includes(id));
  const out = await st.page.evaluate(([ARTS, ids, S, COLS]) => {
    const sheet = document.createElement('canvas'), rows = Math.ceil(ids.length / COLS); sheet.width = COLS * S; sheet.height = rows * S; const g = sheet.getContext('2d'), f = {}, miss = [];
    ids.forEach((id, i) => {
      const A = ARTS[id], c = renderArtifact(id, A, 256); if (!c) { miss.push(id); return; }
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const X = (i % COLS) * S, Y = (i / COLS | 0) * S, w = x1 - x0 + 1, h = y1 - y0 + 1, k = (S - 10) / Math.max(w, h), dw = w * k, dh = h * k;
      if (A.rarity === 'relic') { const gr = g.createRadialGradient(X + S / 2, Y + S / 2, 0, X + S / 2, Y + S / 2, S / 2); gr.addColorStop(0, 'rgba(255,230,140,.55)'); gr.addColorStop(0.55, 'rgba(255,220,120,.22)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.fillRect(X, Y, S, S); }
      g.imageSmoothingQuality = 'high'; g.drawImage(c, x0, y0, w, h, X + (S - dw) / 2, Y + (S - dh) / 2, dw, dh); f[id] = [X, Y];
    });
    return { img: sheet.toDataURL('image/webp', 0.92).split(',')[1], png: sheet.toDataURL('image/png').split(',')[1], f, miss };
  }, [ARTS, ids, S, COLS]);
  if (out.miss.length) console.log('Bez modelu:', out.miss.join(', '));
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, 'artefakty.png'), Buffer.from(out.png, 'base64'));
  if (!only) { fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'artefakty.webp'), Buffer.from(out.img, 'base64')); fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'artefakty.json'), JSON.stringify({ s: S, f: out.f })); }
  console.log(`${Object.keys(out.f).length} artefaktów → ${only ? '.cache/artefakty.png' : 'src/grafika/artefakty.webp'}`); await st.browser.close();
})();
