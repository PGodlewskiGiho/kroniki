// Podgląd portretów: galeria do pliku PNG (powiększona, bez wygładzania)
//   node tools/portrety3d/podglad.js plik.png [imiona po przecinku | test] [powiększenie]
'use strict';
const path = require('path');
const { openPortraitStudio } = require('./studio');
(async () => {
  const out = path.resolve(process.argv[2] || 'portrety.png'), which = process.argv[3] || '', zoom = +(process.argv[4] || 3);
  const { browser, page, errors } = await openPortraitStudio();
  const n = await page.evaluate(([which, zoom]) => {
    const list = which === 'test' || !which ? TEST_SPECS : which.startsWith('raw:') ? TEST_SPECS.filter(t => which.slice(4).split(',').includes(t.name)).map(t => ({ ...t, raw: true })) : which.split(',');
    const cv = document.createElement('canvas'), cols = Math.max(1, Math.min(list.length, Math.floor(1180 / (72 * zoom + 8))));
    cv.width = cols * (72 * zoom + 8); cv.height = Math.ceil(list.length / cols) * (72 * zoom + 22); document.body.appendChild(cv);
    const g = cv.getContext('2d'); g.fillStyle = '#1a1612'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false; g.font = '12px sans-serif'; g.fillStyle = '#ddd';
    list.forEach((it, i) => { const spec = typeof it !== 'string' ? it : TEST_SPECS.find(t => t.name === it) || portraitSpec(it), c = PR.render(spec, 72), x = (i % cols) * (72 * zoom + 8), y = Math.floor(i / cols) * (72 * zoom + 22);
      g.imageSmoothingEnabled = c.width > 72; g.drawImage(c, x + 4, y + 4, 72 * zoom, 72 * zoom); g.fillText(spec.name || String(i), x + 6, y + 72 * zoom + 17); });
    return list.length;
  }, [which, zoom]);
  const el = await page.$('canvas'); await el.screenshot({ path: out }); console.log(n, 'portretów ->', out, errors.slice(0, 5)); await browser.close();
})();
