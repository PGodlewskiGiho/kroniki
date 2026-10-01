// Podgląd sceny miasta w 3D: tło + najwyższe stopnie wszystkich budowli, złożone w kolejności głębokości na niebie z gry.
//   node tools/grafika3d/podglad-miasta.js haven [plik.png]      D=2 (gęstość)
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const fac = process.argv[2] || 'haven', out = process.argv[3] || path.join(ROOT, 'tools', 'grafika3d', '.cache', `scena-${fac}.png`), D = +process.env.D || 2;
const TOP = [['hall', 4, 0], ['fort', 3, 1], ['guild', 5, 2], ['dw7', 3, 3], ['dw6', 3, 4], ['dw5', 3, 5], ['dw4', 3, 6], ['dw3', 3, 7], ['smith', 1, 8], ['silo', 1, 9], ['dw1', 3, 10], ['dw2', 3, 11], ['tavern', 1, 12], ['market', 1, 13], ['special', 1, 14]];
(async () => {
  const st = await openStudio({ width: 400, height: 300 });
  const png = await st.page.evaluate(([fac, TOP, D]) => {
    const T = TOWNS[fac], c = document.createElement('canvas'); c.width = 592 * D; c.height = 438 * D; const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 220 * D); sky.addColorStop(0, T.sky.top); sky.addColorStop(0.55, T.sky.mid); sky.addColorStop(1, T.sky.hor); g.fillStyle = sky; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(renderTownBg(fac, D), 0, 0);
    const order = TOP.map(([grp, t, slot]) => ({ key: grp + t, slot, Z: T.scene.slots[slot].Z })).sort((a, b) => b.Z - a.Z);
    for (const o of order) { const b = renderTownBuilding(fac, o.key, o.slot, D); if (b) g.drawImage(b, 0, 0); }
    return c.toDataURL('image/png').split(',')[1];
  }, [fac, TOP, D]);
  await st.browser.close(); fs.writeFileSync(out, Buffer.from(png, 'base64')); console.log(out);
})();
