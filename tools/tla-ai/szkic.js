// Szkic kompozycji tła miasta do malowania przez AI, z wyznaczonymi płaskimi placami pod budowle.
// Miejsca i wielkości budowli bierze ze sceny 2D frakcji (rzut ekranowy podstawy, szerokość w perspektywie), rysuje je na szkicu
// jako płaskie polany (elipsy w perspektywie kamery f) i zapisuje układ uklady/<frakcja>.json (s = podstawa na ekranie, z = głębokość
// dająca tę samą skalę co scena 2D). Te same place wymusza potem place.py po malowaniu.
//   node tools/tla-ai/szkic.js sylvan            F=300 (ogniskowa kamery budowli), NADPISZ=1 (nadpisz istniejący układ)
'use strict';
const path = require('path'), fs = require('fs');
const { openGame, newGame } = require('../../tests/harness');
(async () => {
  const fac = process.argv[2], F = +(process.env.F || 300), dir = __dirname, out = path.join(dir, 'tla', `szkic-${fac}.png`), lay = path.join(dir, 'uklady', fac + '.json');
  const { browser, page } = await openGame(); await newGame(page, {}, 777);
  const U0 = fs.existsSync(lay) ? JSON.parse(fs.readFileSync(lay, 'utf8')) : null, LAS = process.env.LAS || '';
  const r = await page.evaluate(([fac, F, drogi, LAS]) => {
    const t = { ...G.state.towns[0], faction: fac, built: [] }; TownGenCache.clear && TownGenCache.clear();
    const D = 2, c = document.createElement('canvas'); c.width = 592 * D; c.height = 438 * D; const g = c.getContext('2d'); g.scale(D, D); TOWN_ART_SCALE = D;
    const L = townLayout(t); paintTownWorld(g, t, '#c83a2a', L); usePJ(L);
    const hor = PJ.hor, d = PJ.d, slots = [], plots = [];
    L.slots.forEach((S, i) => { const [sx, sy, s] = proj(S.X, S.Z, S.e || 0), w = S.w * s * S.k, ang = Math.atan2(sy - hor, F), rx = w * 0.45, ry = Math.max(3, rx * Math.sin(ang));
      slots.push({ s: [Math.round(sx), Math.round(sy)], z: +(F * S.Z / 1000).toFixed(3), ...(S.flip ? { flip: true } : {}) }); plots.push([sx, sy, rx, ry]);
    });
    // Masa lasu (LAS=kolor): AI trzyma się układu jasnych i ciemnych plam, więc cały teren poniżej horyzontu pokrywa ciemne listowie,
    // a place pod budowle i drogi zostają jasną łąką – AI maluje las wokół i polany dokładnie w tych miejscach.
    if (LAS) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const q = f.getContext('2d'); q.scale(D, D); const R = mulberry32(7);
      const base = g.getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < 4200; i++) { const x = R() * 592, y = hor + 14 + R() * (438 - hor - 14), s2 = (y - hor) / 300, rr = (3 + R() * 6) * (0.4 + s2 * 1.4), k = (Math.round(y * D) * c.width + Math.round(x * D)) * 4; if (base[k] + base[k + 1] + base[k + 2] < 120 && base[k] > base[k + 1]) continue; /* pnie ramki zostają */ q.fillStyle = `hsl(${105 + R() * 25},${30 + R() * 20}%,${8 + R() * 10}%)`; q.beginPath(); q.arc(x, y, rr, 0, 7); q.fill(); }
      q.globalCompositeOperation = 'destination-out';
      for (const [sx, sy, rx, ry] of plots) { q.save(); q.translate(sx, sy); q.scale(1, ry / rx); q.beginPath(); q.arc(0, 0, rx * 1.35, 0, 7); q.fill(); q.restore(); }
      q.lineCap = 'round'; for (const Rd of drogi || []) { q.beginPath(); Rd.pts.forEach(([x, y], k) => k ? q.lineTo(x, y) : q.moveTo(x, y)); q.lineWidth = Rd.w * 1.6 * Math.max(0.3, (Rd.pts[0][1] - hor) / (420 - hor)); q.stroke(); }
      const wat = g.getImageData(0, 0, c.width, c.height).data, fd = q.getImageData(0, 0, f.width, f.height); // woda zostaje
      for (let i = 0; i < wat.length; i += 4) if (wat[i + 2] > wat[i] + 18 && wat[i + 2] >= wat[i + 1] - 4) fd.data[i + 3] = 0; q.putImageData(fd, 0, 0);
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(f, 0, 0); g.setTransform(D, 0, 0, D, 0, 0);
      g.globalCompositeOperation = 'source-over'; for (const [sx, sy, rx, ry] of plots) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx * 1.2); gr.addColorStop(0, 'rgba(120,170,80,.55)'); gr.addColorStop(1, 'rgba(120,170,80,0)'); g.save(); g.translate(sx, sy); g.scale(1, ry / rx); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx * 1.2, 0, 7); g.fill(); g.restore(); } }
    const o = document.createElement('canvas'); o.width = 576 * D; o.height = 422 * D; o.getContext('2d').drawImage(c, -8 * D, -8 * D);
    return { png: o.toDataURL('image/png').split(',')[1], pj: { hor, d, f: F }, slots, plots };
  }, [fac, F, U0 && U0.drogi, LAS]);
  await browser.close(); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(r.png, 'base64'));
  if (!fs.existsSync(lay) || process.env.NADPISZ) fs.writeFileSync(lay, JSON.stringify({ _opis: 'Układ z planu sceny 2D (szkic.js): s = podstawa na ekranie, z = głębokość jak w 2D; place = płaskie polany [sx, sy, rx, ry] wymuszone po malowaniu (place.py).', tlo: fac + '.png', pj: r.pj, slots: r.slots, place: r.plots.map(p => p.map(v => +v.toFixed(1))) }, null, 1));
  console.log(out, lay);
})();
