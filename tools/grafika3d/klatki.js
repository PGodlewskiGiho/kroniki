// Pasy klatek animacji (do oceny ruchu): każda jednostka w rzędzie, klatki od lewej.
//   node tools/grafika3d/klatki.js plik.png poza(attack|walk|idle|fly) n lista_cid
'use strict';
const path = require('path');
const { openStudio } = require('./wspolne');
(async () => {
  const file = path.resolve(process.argv[2] || 'klatki.png'), pose = process.argv[3] || 'attack', n = +(process.argv[4] || 10), ids = (process.argv[5] || 'imp').split(',');
  const rows = [];
  for (let b = 0; b < ids.length; b += 3) {
    const { browser, page } = await openStudio({ width: 300, height: 300 });
    rows.push(...await page.evaluate(([ids, pose, n]) => ids.map(id => {
      const KB = 32 / 0.9 * 0.7, L = CREATURES[id].look, s = Math.max(1, L.size || 1), W = Math.round(210 * s), H = Math.round(190 * s), AX = Math.round(W * 0.4), AY = H - Math.round(20 * s);
      return { id, frames: Array.from({ length: n }, (_, i) => {
        const P = pose === 'attack' ? { t: 0, atk: i / (n - 1) } : pose === 'walk' ? { t: i * 0.2, walk: i / n } : pose === 'fly' ? { t: i * 0.2, fly: i / n } : { t: i / n * Math.PI * 2 / 2.4 };
        return G3.render(buildUnit(L, P), W, H, KB, AX, AY);
      }), W, H };
    }).map(r => { // wspólny kadr wszystkich klatek (zajęte piksele), powiększony 2×
      let x0 = r.W, y0 = r.H, x1 = 0, y1 = 0;
      for (const c of r.frames) { const d = c.getContext('2d').getImageData(0, 0, r.W, r.H).data; for (let y = 0; y < r.H; y++) for (let x = 0; x < r.W; x++) if (d[(y * r.W + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
      const w = x1 - x0 + 7, h = y1 - y0 + 7;
      return { id: r.id, W: w * 2, H: h * 2, frames: r.frames.map(c => { const o = document.createElement('canvas'); o.width = w * 2; o.height = h * 2; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, x0 - 3, y0 - 3, w, h, 0, 0, w * 2, h * 2); return o.toDataURL('image/png'); }) };
    }), [ids.slice(b, b + 3), pose, n]));
    await browser.close(); process.stdout.write('.');
  }
  const { browser, page } = await openStudio({ width: 200, height: 200 });
  const png = await page.evaluate(async rows => {
    const W = Math.max(...rows.map(r => r.W * r.frames.length)), H = rows.reduce((s, r) => s + r.H, 0), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    let y = 0; for (const [ri, r] of rows.entries()) { g.fillStyle = ri % 2 ? '#3e4a30' : '#46532f'; g.fillRect(0, y, W, r.H); for (const [i, f] of r.frames.entries()) { const im = new Image(); im.src = f; await im.decode(); g.drawImage(im, i * r.W, y); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(i * r.W, y, 1, r.H); } g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(r.id, 4, y + 14); y += r.H; }
    return cv.toDataURL('image/png').split(',')[1];
  }, rows);
  await browser.close(); require('fs').writeFileSync(file, Buffer.from(png, 'base64')); console.log('\n' + file);
})();
