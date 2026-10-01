// Zrzut ekranu miasta w grze: nowa gra wybraną frakcją, wszystkie budowle, ekran miasta.
//   node tools/grafika3d/zrzut-miasta.js sylvan plik.png
const { openGame, newGame, frames } = require('../../tests/harness.js');
(async () => {
  const fac = process.argv[2] || 'sylvan', out = process.argv[3];
  const { browser, page, errors } = await openGame();
  await newGame(page, { faction: fac });
  await page.evaluate(() => { const st = G.state, t = st.towns.find(t => t.owner === 0); const ids = BUILDINGS.map(b => b.id); if (t.built instanceof Set) ids.forEach(k => t.built.add(k)); else t.built = [...new Set([...t.built, ...ids])]; window._dbg = [typeof t.built, t.built instanceof Set, ids.length, Object.keys(BUILDINGS).slice(0, 8)]; G.go('town', { townId: t.id }); });
  await frames(page, 30); await page.waitForTimeout(1500);
  await page.screenshot({ path: out }); console.log(out, (errors || []).slice(0, 3), await page.evaluate(() => window._dbg)); await browser.close();
})();
