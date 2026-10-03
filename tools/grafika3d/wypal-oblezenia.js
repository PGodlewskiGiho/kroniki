// Wypalanie murów oblężenia z 3D (oblezenie3d.js): dla każdej frakcji fragment muru, brama i wieża w stanach cały / uszkodzony / zburzony,
// z kamery bitwy (z ukosa z południowego zachodu). Arkusz src/grafika/oblezenia/<frakcja>.webp, opis w src/grafika/oblezenia.json:
// { d: gęstość (px arkusza na px logiczny), p: { 'wall_ok': [x, y, w, h, ax, ay] (ax, ay = lico muru w środku rzędu, px arkusza; wieża główna: środek heksu) },
//   post / keepPost: [x, y] (strzelcy na wieży i na wieży głównej, px logiczne) }.
//   node tools/grafika3d/wypal-oblezenia.js            wszystkie frakcje      node tools/grafika3d/wypal-oblezenia.js inferno
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const OUT = path.join(ROOT, 'src', 'grafika', 'oblezenia'), META = path.join(ROOT, 'src', 'grafika', 'oblezenia.json'), D = +(process.env.D || 2);
const PIECES = [['wall', 'ok'], ['wall', 'hit'], ['wall', 'down'], ['gate', 'ok'], ['gate', 'hit'], ['gate', 'down'], ['tower', 'ok'], ['tower', 'down'], ['keep', 'ok'], ['keep', 'down'], ['tower', 'front'], ['keep', 'front']];
const FACS = ['haven', 'sylvan', 'barrow', 'fortress', 'inferno', 'academy', 'dungeon', 'stronghold'];
(async () => {
  const t0 = Date.now(), only = process.argv[2] ? process.argv[2].split(',') : null; fs.mkdirSync(OUT, { recursive: true });
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
  for (const fac of FACS.filter(f => !only || only.includes(f))) {
    const st = await openStudio({ width: 400, height: 300 });
    const sheet = await st.page.evaluate(async ([fac, PIECES, D]) => {
      G3.raw = true; const k = PXU * D, frames = []; let post = null, keepPost = null;
      for (const [kind, state] of PIECES) {
        const big = kind === 'keep', W = (big ? 220 : 150) * D, H = (big ? 340 : 260) * D, AX = (big ? 110 : 44) * D, AY = (big ? 280 : 200) * D; // wieża główna: środek heksu
        const c = G3.render(state === 'front' ? siegeFront(fac, kind) : buildSiegePiece(fac, kind, state), W, H, k, AX, AY, { yaw: SIEGE_YAW, pitch: SIEGE_PITCH, raw: true });
        const p = (c._marks || []).find(m => m[0] === 'post'); if (p && kind === 'tower' && state === 'ok') post = [Math.round((p[1] - AX) / D), Math.round((p[2] - AY) / D)];
        const kp = (c._marks || []).find(m => m[0] === 'keep'); if (kp && state === 'ok') keepPost = [Math.round((kp[1] - AX) / D), Math.round((kp[2] - AY) / D)];
        const d = c.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= 3) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        frames.push({ key: kind + '_' + state, c, AX, AY, r: [x0, y0, x1 - x0 + 1, y1 - y0 + 1] });
      }
      let x = 0, sw = 0, sh = 0; const pos = frames.map(f => { const p = [x, 0]; x += f.r[2] + 1; sw = x; sh = Math.max(sh, f.r[3]); return p; });
      const o = document.createElement('canvas'); o.width = sw; o.height = sh; const g = o.getContext('2d'), out = { d: D, p: {}, post, keepPost };
      frames.forEach((f, i) => { g.drawImage(f.c, f.r[0], f.r[1], f.r[2], f.r[3], pos[i][0], 0, f.r[2], f.r[3]); out.p[f.key] = [pos[i][0], 0, f.r[2], f.r[3], f.AX - f.r[0], f.AY - f.r[1]]; });
      return { img: o.toDataURL('image/webp', 0.92).split(',')[1], meta: out };
    }, [fac, PIECES, D]);
    if (st.errors.length) console.log(st.errors.slice(0, 3));
    fs.writeFileSync(path.join(OUT, fac + '.webp'), Buffer.from(sheet.img, 'base64')); meta[fac] = sheet.meta; fs.writeFileSync(META, JSON.stringify(meta));
    console.log(`${fac}: ${Object.keys(sheet.meta.p).length} fragmentów, ${Math.round(fs.statSync(path.join(OUT, fac + '.webp')).size / 1024)} KB`);
    await st.browser.close();
  }
  console.log(`Gotowe w ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
