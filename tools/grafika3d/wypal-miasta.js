// Wypalanie scen miast z 3D (scena.js, budowle.js), jak w Resident Evil Remake: dla każdej frakcji tło (teren, woda, drzewa, góry)
// wyrenderowane z kamery sceny oraz każda budowla w każdym stopniu, wyrenderowana z tej samej kamery w swoim miejscu, z cieniem
// na terenie i zasłonięta przez to, co stoi przed nią. Arkusz src/grafika/miasta/<frakcja>.webp, opis w src/grafika/miasta.json:
// { d: gęstość (px arkusza na px sceny), bg: [x, y, w, h], b: { klucz: { f: [x, y, w, h], o: [x, y] (miejsce w scenie, px), m: punkty efektów } } }.
// Frakcja z namalowanym tłem (tools/tla-ai/tla/<frakcja>.png + uklady/<frakcja>.json): tło = obraz, budowle w miejscach z układu,
// z placykiem, cieniem styku i barwami pod obraz (paintedFinish w scena.js).
//   node tools/grafika3d/wypal-miasta.js            frakcje z modelami      node tools/grafika3d/wypal-miasta.js haven       D=2
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const OUT = path.join(ROOT, 'src', 'grafika', 'miasta'), META = path.join(ROOT, 'src', 'grafika', 'miasta.json'), D = +(process.env.D || 2);
// klucz budowli (grupa + stopień) -> miejsce w scenie (jak BUILDINGS.slot)
const KEYS = [['hall', 4, 0], ['fort', 3, 1], ['guild', 5, 2], ['dw7', 3, 3], ['dw6', 3, 4], ['dw5', 3, 5], ['dw4', 3, 6], ['dw3', 3, 7], ['smith', 1, 8], ['silo', 1, 9],
  ['dw1', 3, 10], ['dw2', 3, 11], ['tavern', 1, 12], ['market', 1, 13], ['special', 1, 14], ['grail', 1, 15]];
(async () => {
  const t0 = Date.now(), only = process.argv[2] ? process.argv[2].split(',') : null; fs.mkdirSync(OUT, { recursive: true });
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
  let st = await openStudio({ width: 400, height: 300 });
  const facs = (await st.page.evaluate(() => Object.keys(TOWN3))).filter(f => !only || only.includes(f));
  // każda klatka w osobnym wywołaniu, świeża przeglądarka co kilka renderów (scena 3D jest duża, pamięć karty programowej się kończy)
  const crop = c => { const W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= 3) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1]; };
  for (const fac of facs) {
    const TLA = path.join(ROOT, 'tools', 'tla-ai'), pf = path.join(TLA, 'uklady', fac + '.json'), U0 = fs.existsSync(pf) ? JSON.parse(fs.readFileSync(pf, 'utf8')) : null, pimg = path.join(TLA, 'tla', (U0 && U0.tlo) || fac + '.png'), pdep = path.join(TLA, 'tla', fac + '-glebia.png');
    const P = fs.existsSync(pf) && fs.existsSync(pimg) ? { U: U0, url: 'data:image/png;base64,' + fs.readFileSync(pimg).toString('base64'), dep: fs.existsSync(pdep) ? 'data:image/png;base64,' + fs.readFileSync(pdep).toString('base64') : null } : null;
    if (P) console.log(`${fac}: namalowane tło`);
    const jobs = [['_bg', -1], ...KEYS.flatMap(([grp, n, slot]) => Array.from({ length: n }, (_, t) => [grp + (t + 1), slot]))], frames = []; let used = 0;
    for (const [key, slot] of jobs) {
      if (used++ >= 5) { await st.browser.close(); st = await openStudio({ width: 400, height: 300 }); used = 1; }
      const r = await st.page.evaluate(async ([fac, key, slot, D, crop, P]) => { let c;
        if (P) { applyPaintedLayout(fac, P.U); if (!window._pbg) { const im = new Image(); im.src = P.url; await im.decode(); const b = paintedBg(im, D); window._pbg = { c: b, d: b.getContext('2d').getImageData(0, 0, b.width, b.height), dep: null }; if (P.dep) { const di = new Image(); di.src = P.dep; await di.decode(); window._pbg.dep = paintedDepth(di, D); } paintedDecor(fac, P.U, b, D, window._pbg.dep); window._pbg.d = b.getContext('2d').getImageData(0, 0, b.width, b.height); }
          if (key === '_bg') c = window._pbg.c; else { const b = renderTownBuilding(fac, key, slot, D, true); c = b && paintedFinish(b, fac, slot, window._pbg.d, D, P.U, window._pbg.dep); } }
        else c = key === '_bg' ? renderTownBg(fac, D) : renderTownBuilding(fac, key, slot, D); if (!c) return null;
        const r = new Function('return ' + crop)()(c); if (!r) return { empty: true }; const o = document.createElement('canvas'); o.width = r[2]; o.height = r[3]; o.getContext('2d').drawImage(c, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
        return { r, png: o.toDataURL('image/png'), m: c._marks || [] }; }, [fac, key, slot, D, crop.toString(), P]);
      if (!r) continue; if (r.empty) { console.log(`  ${key}: pusto (zasłonięte?)`); continue; } frames.push({ key, ...r }); process.stdout.write('.');
    }
    // arkusz w Node: składamy przez stronę (canvas), żeby nie dokładać zależności
    const sheet = await st.page.evaluate(async ([frames, D]) => {
      const imgs = await Promise.all(frames.map(f => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = f.png; })));
      let x = 0, y = 0, rh = 0, sw = 0; const SWD = 2048, pos = frames.map(f => { if (x + f.r[2] > SWD) { x = 0; y += rh + 1; rh = 0; } const p = [x, y]; x += f.r[2] + 1; rh = Math.max(rh, f.r[3]); sw = Math.max(sw, x); return p; });
      const c = document.createElement('canvas'); c.width = sw; c.height = y + rh; const g = c.getContext('2d'), out = { d: D, b: {} };
      frames.forEach((f, i) => { g.drawImage(imgs[i], pos[i][0], pos[i][1]); const fr = [pos[i][0], pos[i][1], f.r[2], f.r[3]]; if (f.key === '_bg') { out.bg = fr; out.bgo = [f.r[0] / D, f.r[1] / D]; } else out.b[f.key] = { f: fr, o: [f.r[0] / D, f.r[1] / D], ...(f.m.length ? { m: f.m } : {}) }; });
      return { img: c.toDataURL('image/webp', 0.9).split(',')[1], meta: out };
    }, [frames, D]);
    for (const e of ['.png', '.webp']) { const f = path.join(OUT, fac + e); if (fs.existsSync(f)) fs.unlinkSync(f); }
    fs.writeFileSync(path.join(OUT, fac + '.webp'), Buffer.from(sheet.img, 'base64')); meta[fac] = sheet.meta; fs.writeFileSync(META, JSON.stringify(meta));
    console.log(`\n${fac}: tło + ${Object.keys(sheet.meta.b).length} budowli`);
  }
  await st.browser.close(); console.log(`Gotowe w ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
