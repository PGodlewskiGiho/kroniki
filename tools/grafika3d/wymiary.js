// Wymiary budowli najwyższych stopni (szer. X, głęb. Z, wys. Y w jednostkach świata, ze skalą miejsca k): do planowania ułożenia na tle.
//   node tools/grafika3d/wymiary.js sylvan
'use strict';
const { openStudio } = require('./wspolne');
const fac = process.argv[2] || 'haven';
const TOP = ['hall4', 'fort3', 'guild5', 'dw73', 'dw63', 'dw53', 'dw43', 'dw33', 'smith1', 'silo1', 'dw13', 'dw23', 'tavern1', 'market1', 'special1', 'grail1'];
(async () => {
  const st = await openStudio({ width: 200, height: 200 });
  const r = await st.page.evaluate(([fac, TOP]) => TOP.map((key, i) => { const S = TOWNS[fac].scene.slots[i], b = buildTown(fac, key); if (!b) return [i, key, null];
    const k = PXU * (S.k0 || S.k); b.scale.setScalar(k); b.updateMatrixWorld(true); const B = new THREE.Box3().setFromObject(b), s = B.getSize(new THREE.Vector3());
    return [i, key, +s.x.toFixed(0), +s.z.toFixed(0), +s.y.toFixed(0), +(S.k0 || S.k).toFixed(2), +(-B.min.z).toFixed(0), +B.max.z.toFixed(0)]; }), [fac, TOP]);
  await st.browser.close(); if (process.env.JSON) { console.log(JSON.stringify(Object.fromEntries(r.map(([i, key, w, dz, h, k, back, front]) => [i, { key, w, dz, h, k, back, front }])))); return; } console.log('nr klucz szer głęb wys k (tył przód)'); for (const x of r) console.log(x.join(' '));
})();
