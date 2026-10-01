// Galeria budowli miasta: rysunek 2D z gry obok modelu 3D (przed wypaleniem). Uruchom:
//   node tools/grafika3d/galeria-miast.js haven [plik.png]      FILTR=dw (tylko pasujące warianty), K=2 (powiększenie)
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const fac = process.argv[2] || 'haven', out = process.argv[3] || path.join(ROOT, 'tools', 'grafika3d', '.cache', `miasto-${fac}.png`), K = +process.env.K || 2, FILTR = process.env.FILTR || '';
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch((p => p ? { executablePath: p } : {})(process.env.CHROMIUM_PATH || (require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : null)));
  const game = await browser.newPage(); await game.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await game.goto(require('url').pathToFileURL(path.join(ROOT, 'Kroniki Królestw.html')).href); await game.waitForFunction(() => typeof BUILD_ART !== 'undefined');
  // rysunki 2D: każda budowla w każdym stopniu, na płótnie w rozmiarze miejsca × K
  const list = await game.evaluate(([fac, K, FILTR]) => {
    const L = TOWN_LAYOUTS[fac], A = TOWN_ART[fac], arts = BUILD_ART[fac], out = [];
    const seen = new Set();
    for (const B of BUILDINGS) {
      if (B.slot == null || B.slot === undefined) continue; const [grp, tier] = groupOf(B), key = grp + tier; if (seen.has(key) || !arts[grp]) continue; seen.add(key);
      if (FILTR && !key.startsWith(FILTR)) continue;
      const S = L.slots[B.slot], m = 50, c = document.createElement('canvas'); c.width = (S.w + 2 * m) * K; c.height = (S.h * 1.5 + m) * K; const g = c.getContext('2d');
      g.scale(K, K); g.translate(m, S.h * 0.5 + m * 0.6); const prev = CUR_FX; CUR_FX = { wins: [], smokes: [], glows: [], flags: [] };
      const dw = grp.startsWith('dw'), can = { x: 0, b: S.h, w: S.w, h: S.h }; arts[grp](g, A, can, dw ? Math.min(2, tier) : tier, '#c83a2a', CUR_FX); if (dw && tier === 3) eliteArt(g, can, '#c83a2a'); CUR_FX = prev;
      out.push({ key, slot: B.slot, w: S.w, h: S.h, png: c.toDataURL() });
    }
    return out;
  }, [fac, K, FILTR]);
  // modele 3D (budowle.js), jeśli są
  const st = await openStudio({ width: 400, height: 300 });
  const r3 = await st.page.evaluate(([fac, list, K]) => list.map(v => { if (typeof buildTown !== 'function') return null; const c = renderBuilding(fac, v.key, v.w, v.h, K); return c ? c.toDataURL() : null; }), [fac, list.map(({ key, w, h }) => ({ key, w, h })), K]);
  await st.browser.close();
  const page = await browser.newPage();
  const html = `<body style="margin:0;background:#4a5a3a;font:13px sans-serif;color:#fff"><div style="display:flex;flex-wrap:wrap;gap:6px;padding:6px">${list.map((v, i) => `<div style="background:#5a6a48;padding:3px;text-align:center"><div>${v.key}</div><img src="${v.png}" style="image-rendering:pixelated">${r3[i] ? `<img src="${r3[i]}" style="image-rendering:pixelated;margin-left:4px">` : ''}</div>`).join('')}</div></body>`;
  await page.setViewportSize({ width: +process.env.SZER || 1800, height: 900 }); await page.setContent(html); await page.waitForTimeout(300);
  fs.mkdirSync(path.dirname(out), { recursive: true }); await page.screenshot({ path: out, fullPage: true }); await browser.close(); console.log(out, list.length);
})();
