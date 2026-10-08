// Szkice scen mapy zagadki (768×576): krajobraz frakcji z miastem w tle, a na nim bitwa – armia frakcji (bohater, 7. poziom,
// latające stwory, szeregi) naciera na wrogów z prawej. Na tym img2img maluje obraz w stylu H3.
//   node tools/tla-ai/zagadka/szkic.js [frakcja]  ->  szkic-<frakcja>.png; malowanie: cd tools/tla-ai && W=768 H=576 sh uruchom.sh zagadka_<frakcja> zagadka/szkic-<frakcja>.png 1 0.45
//   wybrany obraz -> src/grafika/ekrany/zagadka_<frakcja>.webp
const { openGame } = require('../../../tests/harness'); const fs = require('fs');
const FOE = { haven: 'inferno', sylvan: 'barrow', barrow: 'haven', fortress: 'stronghold', inferno: 'haven', academy: 'dungeon', dungeon: 'academy', stronghold: 'fortress' };
(async () => { const { browser, page } = await openGame(); const only = process.argv[2];
  for (const fac of Object.keys(FOE)) { if (only && fac !== only) continue;
    const b64 = await page.evaluate(([fac, foe]) => {
      const W = 768, H = 576, st = { seed: 7, players: { [ME]: { faction: fac } } }; PUZZLE_COVER = null; const bg = puzzleCover(st, W * PIX, H * PIX);
      const o = document.createElement('canvas'); o.width = W; o.height = H; const g = o.getContext('2d'); g.drawImage(bg, 0, 0, W, H);
      const F = id => FACTIONS.find(f => f.id === id).dw, A = F(fac), B = F(foe), r = mulberry32(fac.length * 977 + 3);
      const put = (cid, x, y, k, dir, pose = 'attack', fr = 4) => { try { const s = battleSprite(cid, dir, pose, fr); drawSprite(g, s, x, y, k); } catch (e) {} };
      const hor = H * 0.58;
      // daleko: szeregi obu armii (małe), bliżej większe; od tyłu do przodu
      for (let row = 0; row < 3; row++) { const y = hor + 40 + row * 34, k = 0.55 + row * 0.18;
        for (let i = 0; i < 5; i++) { put([A.dw1u, A.dw2u, A.dw4u][(i + row) % 3][1], 40 + i * 62 + r() * 20 - row * 10, y + r() * 8, k, 1, i % 2 ? 'attack' : 'walk', (i * 3 + row) % 8);
          put([B.dw1u, B.dw2u, B.dw4u][(i + row) % 3][1], W - 40 - i * 62 - r() * 20 + row * 10, y + r() * 8, k, -1, i % 2 ? 'walk' : 'attack', (i * 5 + row) % 8); } }
      put(A.dw3u[1], 170, hor - 60, 0.95, 1, 'walk', 2); put(A.dw3u[1], 260, hor - 110, 0.75, 1, 'walk', 5); put(B.dw3u[1], 560, hor - 80, 0.85, -1, 'walk', 3); // latające nad polem
      put(B.dw7u[1], W - 170, H - 40, 2.3, -1, 'attack', 5); put(A.dw6u[1], 300, H - 30, 1.7, 1, 'attack', 6); put(A.dw7u[1], 150, H - 20, 2.4, 1, 'attack', 4); put(B.dw5u[1], W - 330, H - 60, 1.4, -1, 'attack', 3);
      g.fillStyle = 'rgba(255,220,150,.10)'; g.fillRect(0, 0, W, H);
      return o.toDataURL('image/png').split(',')[1]; }, [fac, FOE[fac]]);
    fs.writeFileSync(require('path').join(__dirname, `szkic-${fac}.png`), Buffer.from(b64, 'base64')); }
  await browser.close(); })();
