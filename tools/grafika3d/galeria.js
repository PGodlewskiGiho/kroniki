// Galeria wszystkich jednostek na jednym obrazku (do oceny modeli przed wypaleniem), w gęstości arkuszy bitewnych.
//   COLS=7 (liczba kolumn), ZOOM=2 (powiększenie do oglądania detali)
//   node tools/grafika3d/galeria.js [plik.png] [poza: idle|attack|fly|walk] [lista cid po przecinku]
// Duże jednostki (smoki) są zmniejszone, żeby zmieściły się w polu; liczba w rogu = skala.
// Render w partiach, każda w świeżej przeglądarce (programowa karta grafiki traci pamięć po kilkunastu modelach).
'use strict';
const path = require('path'), fs = require('fs');
const { openStudio } = require('./wspolne');
const Z = +process.env.ZOOM || 1, CW = 236 * Z, CH = 262 * Z, COLS = +process.env.COLS || 10;
async function cells(ids, pose) {
  const { browser, page } = await openStudio({ width: 400, height: 300 });
  const r = await page.evaluate(([ids, pose, CW, CH]) => ids.map(id => {
    const KB = 32 / 0.9 * CW / 236, DS = KB / 24.6, C = CREATURES[id], L = C.look, s = Math.max(1, L.size || 1), wide = L.kind === 'dragon' || L.wings || C.abil.includes('fly') ? 1.25 : 1;
    const W = Math.round(150 * s * DS * wide), H = W, AX = Math.round(W * 0.45), AY = H - Math.round(18 * s * DS);
    const P = pose === 'attack' ? { t: 0, atk: 0.5 } : pose === 'fly' ? (C.abil.includes('fly') ? { t: 0, fly: 0.6 } : { t: 0 }) : pose === 'walk' ? { t: 0, walk: 0.25 } : { t: 0 };
    const c = G3.render(buildUnit(L, P), W, H, KB, AX, AY), d = c.getContext('2d').getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < 0) return { id, blank: true };
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = Math.min(1, (CW - 8) / bw, (CH - 34) / bh), o = document.createElement('canvas'); o.width = Math.round(bw * k); o.height = Math.round(bh * k);
    const g = o.getContext('2d'); g.imageSmoothingEnabled = k < 1; g.drawImage(c, x0, y0, bw, bh, 0, 0, o.width, o.height);
    return { id, png: o.toDataURL('image/png'), k, s, name: C.name, faction: C.faction, level: C.level };
  }), [ids, pose, CW, CH]);
  await browser.close(); return r;
}
(async () => {
  const out = path.resolve(process.argv[2] || 'galeria.png'), pose = process.argv[3] || 'idle', only = process.argv[4] ? process.argv[4].split(',') : null;
  let st = await openStudio({ width: 200, height: 200 });
  const ids = await st.page.evaluate(only => Object.keys(CREATURES).filter(id => (!only || only.includes(id)) && buildUnit(CREATURES[id].look, {})), only); await st.browser.close();
  const all = [], queue = [...ids], retry = {};
  while (queue.length) {
    const batch = queue.splice(0, 5), r = await cells(batch, pose);
    for (const c of r) { if (c.blank && (retry[c.id] = (retry[c.id] || 0) + 1) < 3) queue.push(c.id); else all.push(c); } process.stdout.write('.');
  }
  all.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  st = await openStudio({ width: 200, height: 200 });
  const png = await st.page.evaluate(async ([all, CW, CH, COLS]) => {
    const sheet = document.createElement('canvas'); sheet.width = COLS * CW; sheet.height = Math.ceil(all.length / COLS) * CH; const g = sheet.getContext('2d');
    for (let n = 0; n < all.length; n++) {
      const C = all[n], cx = (n % COLS) * CW, cy = Math.floor(n / COLS) * CH; g.fillStyle = n % 2 ? '#4e5a38' : '#46522f'; g.fillRect(cx, cy, CW, CH);
      if (!C.blank) { const im = new Image(); im.src = C.png; await im.decode();
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(cx + CW / 2, cy + CH - 30, 34 * Math.min(1.6, C.s) * C.k, 9 * C.k, 0, 0, Math.PI * 2); g.fill();
        g.drawImage(im, cx + Math.round((CW - im.width) / 2), cy + CH - 28 - im.height); }
      g.fillStyle = '#f0e8d0'; g.font = 'bold 12px sans-serif'; g.fillText(C.name || C.id, cx + 5, cy + CH - 12); g.fillStyle = '#c8c0a8'; g.font = '10px sans-serif'; g.fillText(`${C.faction || 'neutralne'} · poz. ${C.level ?? '-'}`, cx + 5, cy + CH - 2);
      if (C.k < 1) { g.fillStyle = '#e0c060'; g.fillText(`×${C.k.toFixed(2)}`, cx + CW - 34, cy + 12); }
    }
    return sheet.toDataURL('image/png').split(',')[1];
  }, [all, CW, CH, COLS]);
  fs.writeFileSync(out, Buffer.from(png, 'base64')); await st.browser.close();
  console.log(`\n${all.length} jednostek ->`, out, all.filter(c => c.blank).map(c => c.id).join(','));
})();
