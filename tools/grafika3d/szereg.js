// Szeregi jednostek w jednej skali (do porównania rozmiarów): każda frakcja w rzędzie, od poziomu 1 do 7, na wspólnej linii ziemi.
// Pod jednostkami miarka: szerokość pola bitwy (heksu). Człowiek ≈ 1,75 j. wysokości.
//   node tools/grafika3d/szereg.js [plik.png] [skala=0.6]
'use strict';
const path = require('path');
const { openStudio } = require('./wspolne');
const KB = 32 / 0.9, HEXW = 54 / 32; // piksele arkusza na jednostkę świata; szerokość heksu w jednostkach świata (54 px na ekranie, 32 px na jednostkę)
async function renderAll(ids) {
  const out = [], queue = [...ids];
  while (queue.length) {
    const batch = queue.splice(0, 5), { browser, page } = await openStudio({ width: 300, height: 300 });
    const r = await page.evaluate(([ids, KB]) => ids.map(id => {
      const C = CREATURES[id], L = C.look, s = Math.max(1, L.size || 1), W = Math.round(300 * s), H = W, AX = Math.round(W * 0.45), AY = H - Math.round(30 * s);
      const c = G3.render(buildUnit(L, { t: 0 }), W, H, KB, AX, AY), d = c.getContext('2d').getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 < 0) return { id, blank: true };
      const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, -x0, -y0);
      return { id, png: o.toDataURL('image/png'), ax: AX - x0, ay: AY - y0, name: C.name, faction: C.faction, level: C.level };
    }), [batch, KB]);
    await browser.close(); out.push(...r); process.stdout.write('.');
  }
  return out;
}
(async () => {
  const file = path.resolve(process.argv[2] || 'szereg.png'), k = +(process.argv[3] || 0.6);
  let st = await openStudio({ width: 200, height: 200 });
  const ids = await st.page.evaluate(() => Object.keys(CREATURES).filter(id => CREATURES[id].level && buildUnit(CREATURES[id].look, {}))); await st.browser.close();
  const cells = await renderAll(ids);
  st = await openStudio({ width: 200, height: 200 });
  const png = await st.page.evaluate(async ([cells, k, KB, HEXW]) => {
    const facs = [...new Set(cells.map(c => c.faction || ''))], rows = [];
    for (const f of facs) {
      const list = cells.filter(c => (c.faction || '') === f && !c.blank).sort((a, b) => a.level - b.level);
      if (!f) { rows.push({ f: 'neutralne', list: list.filter(c => c.level <= 4) }); rows.push({ f: 'neutralne', list: list.filter(c => c.level > 4) }); } else rows.push({ f, list });
    }
    const imgs = {}; for (const c of cells) if (!c.blank) { const im = new Image(); im.src = c.png; await im.decode(); imgs[c.id] = im; }
    const pad = 14, lab = 150, rowH = rows.map(r => Math.max(...r.list.map(c => c.ay)) * k + 90), W = Math.max(...rows.map(r => lab + r.list.reduce((s, c) => s + imgs[c.id].width * k + pad, 0))) + 20;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = rowH.reduce((a, b) => a + b, 0); const g = cv.getContext('2d');
    let y = 0;
    rows.forEach((r, ri) => {
      const base = y + rowH[ri] - 80; g.fillStyle = ri % 2 ? '#3e4a30' : '#46532f'; g.fillRect(0, y, W, rowH[ri]);
      g.fillStyle = '#e8e0c0'; g.font = 'bold 16px sans-serif'; g.fillText(r.f, 8, base - 6);
      // człowiek: linia 1,75 j.
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(lab - 10, base - 1.75 * KB * k); g.lineTo(W, base - 1.75 * KB * k); g.stroke(); g.setLineDash([]);
      let x = lab;
      for (const c of r.list) {
        const im = imgs[c.id], w = im.width * k, cx = x + c.ax * k;
        g.drawImage(im, x, base - c.ay * k, w, im.height * k);
        g.fillStyle = 'rgba(255,220,120,.8)'; g.fillRect(cx - HEXW * KB * k / 2, base + 4, HEXW * KB * k, 3); // miarka: szerokość heksu
        g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.save(); g.translate(x + 2, base + 12); g.rotate(0.5); g.fillText(`${c.level} ${c.name}`.slice(0, 22), 0, 0); g.restore();
        x += w + pad;
      }
      y += rowH[ri];
    });
    return cv.toDataURL('image/png').split(',')[1];
  }, [cells, k, KB, HEXW]);
  await st.browser.close();
  require('fs').writeFileSync(file, Buffer.from(png, 'base64')); console.log('\n' + file);
})();
