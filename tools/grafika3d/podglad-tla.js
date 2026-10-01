// Podgląd miasta: namalowane tło (tools/tla-ai) + budowle 3D w najwyższych stopniach, w miejscach z układu (UKLAD=plik.json).
//   node tools/grafika3d/podglad-tla.js haven tlo.png [wynik.png]      D=2 (gęstość), ETYKIETY=1 (numery miejsc)
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const fac = process.argv[2] || 'haven', bg = process.argv[3], out = process.argv[4] || path.join(ROOT, 'tools', 'grafika3d', '.cache', `tlo-${fac}.png`), D = +process.env.D || 2;
const TOP = [['hall', 4, 0], ['fort', 3, 1], ['guild', 5, 2], ['dw7', 3, 3], ['dw6', 3, 4], ['dw5', 3, 5], ['dw4', 3, 6], ['dw3', 3, 7], ['smith', 1, 8], ['silo', 1, 9], ['dw1', 3, 10], ['dw2', 3, 11], ['tavern', 1, 12], ['market', 1, 13], ['special', 1, 14], ['grail', 1, 15]];
(async () => {
  const st = await openStudio({ width: 400, height: 300 });
  const U = JSON.parse(fs.readFileSync(process.env.UKLAD || path.join(ROOT, 'tools', 'tla-ai', 'uklady', fac + '.json'), 'utf8')), LAB = !!process.env.ETYKIETY;
  const bgUrl = 'data:image/png;base64,' + fs.readFileSync(bg).toString('base64'), dp = path.join(path.dirname(bg), fac + '-glebia.png'), depUrl = fs.existsSync(dp) ? 'data:image/png;base64,' + fs.readFileSync(dp).toString('base64') : null;
  const png = await st.page.evaluate(async ([fac, TOP, D, bgUrl, U, LAB, depUrl]) => {
    const T = TOWNS[fac]; applyPaintedLayout(fac, U);
    const im = new Image(); im.src = bgUrl; await im.decode(); const c = paintedBg(im, D), g = c.getContext('2d'); let dep = null; if (depUrl) { const di = new Image(); di.src = depUrl; await di.decode(); dep = paintedDepth(di, D); } paintedDecor(fac, U, c, D, dep); const bgd = g.getImageData(0, 0, c.width, c.height);
    const order = TOP.map(([grp, t, slot]) => ({ key: grp + t, slot, Z: T.scene.slots[slot].Z })).sort((a, b) => b.Z - a.Z);
    for (const o of order) { const b = renderTownBuilding(fac, o.key, o.slot, D, true); if (b) g.drawImage(paintedFinish(b, fac, o.slot, bgd, D, U, dep), 0, 0); }
    if (LAB) { g.font = `bold ${11 * D}px sans-serif`; for (const o of order) { const S = T.scene.slots[o.slot], F = U.pj.f || 1000, sx = (296 + F * S.X / (S.Z * 1000)) * D, sy = (U.pj.hor + F * (U.pj.d - S.e) / (S.Z * 1000)) * D; g.fillStyle = '#ff0'; g.fillRect(sx - 2 * D, sy - 2 * D, 4 * D, 4 * D); g.fillStyle = '#000a'; g.fillRect(sx + 3 * D, sy - 12 * D, 52 * D, 12 * D); g.fillStyle = '#fff'; g.fillText(o.slot + ' ' + o.key, sx + 4 * D, sy - 2 * D); } }
    const o = document.createElement('canvas'); o.width = 576 * D; o.height = 422 * D; o.getContext('2d').drawImage(c, -8 * D, -8 * D); return o.toDataURL('image/png').split(',')[1];
  }, [fac, TOP, D, bgUrl, U, LAB, depUrl]);
  await st.browser.close(); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(png, 'base64')); console.log(out);
})();
