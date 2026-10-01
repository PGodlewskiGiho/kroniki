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
  const r = await page.evaluate(([fac, F]) => {
    const t = { ...G.state.towns[0], faction: fac, built: [] }; TownGenCache.clear && TownGenCache.clear();
    const D = 2, c = document.createElement('canvas'); c.width = 592 * D; c.height = 438 * D; const g = c.getContext('2d'); g.scale(D, D); TOWN_ART_SCALE = D;
    const L = townLayout(t); paintTownWorld(g, t, '#c83a2a', L); usePJ(L);
    const hor = PJ.hor, d = PJ.d, slots = [], plots = [];
    L.slots.forEach((S, i) => { const [sx, sy, s] = proj(S.X, S.Z, S.e || 0), w = S.w * s * S.k, ang = Math.atan2(sy - hor, F), rx = w * 0.45, ry = Math.max(3, rx * Math.sin(ang));
      slots.push({ s: [Math.round(sx), Math.round(sy)], z: +(F * S.Z / 1000).toFixed(3), ...(S.flip ? { flip: true } : {}) }); plots.push([sx, sy, rx, ry]);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(150,146,96,.7)'); gr.addColorStop(0.7, 'rgba(132,138,84,.5)'); gr.addColorStop(1, 'rgba(120,130,80,0)');
      g.save(); g.translate(sx, sy); g.scale(1, ry / rx); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore(); });
    const o = document.createElement('canvas'); o.width = 576 * D; o.height = 422 * D; o.getContext('2d').drawImage(c, -8 * D, -8 * D);
    return { png: o.toDataURL('image/png').split(',')[1], pj: { hor, d, f: F }, slots, plots };
  }, [fac, F]);
  await browser.close(); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(r.png, 'base64'));
  if (!fs.existsSync(lay) || process.env.NADPISZ) fs.writeFileSync(lay, JSON.stringify({ _opis: 'Układ z planu sceny 2D (szkic.js): s = podstawa na ekranie, z = głębokość jak w 2D; place = płaskie polany [sx, sy, rx, ry] wymuszone po malowaniu (place.py).', tlo: fac + '.png', pj: r.pj, slots: r.slots, place: r.plots.map(p => p.map(v => +v.toFixed(1))) }, null, 1));
  console.log(out, lay);
})();
