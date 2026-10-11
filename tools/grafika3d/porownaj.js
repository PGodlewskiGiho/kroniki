// Porównywarka jednostek: szuka par zbyt podobnych do siebie (ten sam model z innym kolorem), z wyłączeniem ulepszeń
// tego samego siedliska (te mają być podobne). Dwie miary:
//   obraz – sylwetka (IoU masek klatki spoczynku po wyrównaniu wysokości) i barwy (siatka 4×4 średnich kolorów),
//   model – wspólne cechy wyglądu z danych gry (rodzaj, budowa, broń, szata, hełm, nogi, skrzydła… bez kolorów).
// Wynik: tools/grafika3d/.cache/porownanie.json i arkusz porownanie.png (pary od najbardziej podobnych, obok siebie).
//   node tools/grafika3d/porownaj.js [próg=0.72] [ile=40]
'use strict';
const path = require('path'), fs = require('fs'), { openGame } = require('../../tests/harness');
const OUT = path.join(__dirname, '.cache'), LIMIT = +(process.argv[2] || 0.72), TOP = +(process.argv[3] || 40);
(async () => {
  const { browser, page } = await openGame(); fs.mkdirSync(OUT, { recursive: true });
  const r = await page.evaluate(([LIMIT, TOP]) => {
    const fam = {}; for (const F of FACTIONS) for (const [k, v] of Object.entries(F.dw || {})) { const m = k.match(/^dw(\d)/); if (m && v && v[1]) fam[v[1]] = F.id + m[1]; }
    const N = 64, ids = Object.keys(UNIT_ART).filter(id => CREATURES[id] && UNIT_IMG[id] && UNIT_IMG[id]._ok), feat = {};
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d', { willReadFrequently: true });
    for (const id of ids) {
      const [sx, sy, w, h] = UNIT_ART[id].f.idle[0], k = (N - 4) / Math.max(w, h * 0.9); g.clearRect(0, 0, N, N);
      g.drawImage(UNIT_IMG[id], sx, sy, w, h, (N - w * k) / 2, N - 2 - h * k, w * k, h * k);
      const d = g.getImageData(0, 0, N, N).data, mask = new Uint8Array(N * N), grid = Array.from({ length: 16 }, () => [0, 0, 0, 0]);
      for (let i = 0; i < N * N; i++) if (d[i * 4 + 3] > 60) { mask[i] = 1; const q = grid[(Math.floor(i / N / 16) * 4) + Math.floor((i % N) / 16)]; q[0] += d[i * 4]; q[1] += d[i * 4 + 1]; q[2] += d[i * 4 + 2]; q[3]++; }
      const L = CREATURES[id].look || {}, sig = new Set([`kind:${L.kind}`, ...Object.entries(L).filter(([k]) => !['size', 'kind', 'skin', 'fur', 'cloth', 'eyes'].includes(k)).map(([k, v]) => typeof v === 'string' && v[0] === '#' ? `has:${k}` : `${k}:${v}`)]); // barwa liczy się jako obecność cechy (płomienie, rogi…)
      feat[id] = { mask, grid: grid.map(q => q[3] ? [q[0] / q[3], q[1] / q[3], q[2] / q[3]] : null), sig };
    }
    const pairs = [];
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const A = ids[a], B = ids[b]; if (fam[A] && fam[A] === fam[B]) continue; // ulepszenia jednego siedliska mają być podobne
      const fa = feat[A], fb = feat[B]; let i = 0, u = 0; for (let p = 0; p < N * N; p++) { i += fa.mask[p] & fb.mask[p]; u += fa.mask[p] | fb.mask[p]; }
      let cd = 0, cn = 0; for (let q = 0; q < 16; q++) if (fa.grid[q] && fb.grid[q]) { cd += Math.hypot(...fa.grid[q].map((v, k) => v - fb.grid[q][k])) / 441; cn++; }
      const sil = u ? i / u : 0, col = cn ? 1 - cd / cn : 0, inter = [...fa.sig].filter(s => fb.sig.has(s)).length, model = inter / new Set([...fa.sig, ...fb.sig]).size;
      const img = 0.6 * sil + 0.4 * col, score = 0.55 * img + 0.45 * model;
      if (score >= LIMIT) pairs.push({ a: A, b: B, names: [CREATURES[A].name, CREATURES[B].name], score: +score.toFixed(3), sil: +sil.toFixed(2), col: +col.toFixed(2), model: +model.toFixed(2) });
    }
    pairs.sort((p, q) => q.score - p.score);
    const top = pairs.slice(0, TOP), CW = 240, RH = 120, sheet = document.createElement('canvas'); sheet.width = CW * 2; sheet.height = Math.ceil(top.length / 2) * RH || 1; const sg = sheet.getContext('2d');
    sg.fillStyle = '#2a2a2a'; sg.fillRect(0, 0, sheet.width, sheet.height); sg.font = '11px sans-serif'; sg.fillStyle = '#fff';
    top.forEach((p, n) => { const ox = (n % 2) * CW, oy = Math.floor(n / 2) * RH;
      [p.a, p.b].forEach((id, k) => { const [sx, sy, w, h] = UNIT_ART[id].f.idle[0], s = Math.min(100 / h, 110 / w); sg.drawImage(UNIT_IMG[id], sx, sy, w, h, ox + k * 115 + (115 - w * s) / 2, oy + 104 - h * s, w * s, h * s); });
      sg.fillText(`${p.names[0]} / ${p.names[1]}  ${p.score}`, ox + 4, oy + 116); });
    return { pairs, png: sheet.toDataURL('image/png').split(',')[1], n: ids.length };
  }, [LIMIT, TOP]);
  fs.writeFileSync(path.join(OUT, 'porownanie.json'), JSON.stringify(r.pairs, null, 1)); fs.writeFileSync(path.join(OUT, 'porownanie.png'), Buffer.from(r.png, 'base64'));
  console.log(`${r.n} jednostek, ${r.pairs.length} par ponad ${LIMIT}:`); for (const p of r.pairs.slice(0, TOP)) console.log(`${p.score}  ${p.a} / ${p.b}  (sylwetka ${p.sil}, barwy ${p.col}, model ${p.model})`);
  await browser.close();
})();
