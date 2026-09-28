// Podgląd modeli 3D: galeria jednostek do pliku PNG (do oceny wyglądu przed wypaleniem).
//   node tools/grafika3d/podglad.js [plik.png] [rodzaj|lista cid po przecinku] [poza: idle|walk|attack|hurt|dead]
'use strict';
const path = require('path');
const { openStudio } = require('./wspolne');
(async () => {
  const out = path.resolve(process.argv[2] || 'podglad.png'), which = process.argv[3] || 'hum', pose = process.argv[4] || 'idle', zoom = +(process.argv[5] || 1);
  const { browser, page, errors } = await openStudio();
  const n = await page.evaluate(([which, pose, zoom]) => {
    const ids = which.includes(',') || CREATURES[which] ? which.split(',') : Object.keys(CREATURES).filter(id => CREATURES[id].look.kind === which);
    document.body.innerHTML = ''; document.body.style.background = '#3e5a30';
    const cv = document.createElement('canvas'); cv.width = 1440; cv.height = 900; document.body.appendChild(cv); const ctx = cv.getContext('2d'); ctx.font = '11px sans-serif'; ctx.fillStyle = '#fff';
    const P = pose === 'walk' ? { walk: 0.25 } : pose === 'attack' ? { atk: 0.55 } : pose === 'hurt' ? { hurt: true } : { t: 0 };
    ids.forEach((id, i) => {
      const L = CREATURES[id].look, g0 = buildUnit(L, P); if (!g0) return; const g = pose === 'dead' ? layDead(g0, L) : g0;
      const c = G3.render(g, 118, 136, 24.6, 59, 114), cols = Math.floor(12 / zoom), x = (i % cols) * 120 * zoom, y = Math.floor(i / cols) * 150 * zoom; ctx.imageSmoothingEnabled = false; ctx.drawImage(c, x, y, 118 * zoom, 136 * zoom); ctx.fillText(id, x + 4, y + 140 * zoom);
    });
    return ids.length;
  }, [which, pose, zoom]);
  await page.screenshot({ path: out }); console.log(n, 'jednostek ->', out, errors.slice(0, 5)); await browser.close();
})();
