// Eksport modelu jednostki z gry do GLB (dla Blendera): node tools/grafika3d/blender/eksport-glb.js pikeman wyj.glb
const { openStudio } = require('/home/user/kroniki/tools/grafika3d/wspolne'), fs = require('fs');
(async () => { const { browser, page } = await openStudio({ width: 200, height: 200 });
  const b64 = await page.evaluate(async id => { const g = buildUnit(CREATURES[id].look, { t: 0 }); g.updateMatrixWorld(true);
    const buf = await new THREE.GLTFExporter().parseAsync(g, { binary: true }); let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }, process.argv[2]);
  fs.writeFileSync(process.argv[3], Buffer.from(b64, 'base64')); await browser.close(); })();
