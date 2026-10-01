// Plan miasta z góry (do układania sceny 3D): teren, woda, budowle w najwyższym stopniu, domy, mury, drzewa; siatka co 100 jednostek
//   node tools/grafika3d/plan-miasta.js haven [plik.png]
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, openStudio } = require('./wspolne');
const fac = process.argv[2] || 'haven', out = process.argv[3] || path.join(ROOT, 'tools', 'grafika3d', '.cache', `plan-${fac}.png`);
const TOP = [['hall', 4, 0], ['fort', 3, 1], ['guild', 5, 2], ['dw7', 3, 3], ['dw6', 3, 4], ['dw5', 3, 5], ['dw4', 3, 6], ['dw3', 3, 7], ['smith', 1, 8], ['silo', 1, 9], ['dw1', 3, 10], ['dw2', 3, 11], ['tavern', 1, 12], ['market', 1, 13], ['special', 1, 14], ['grail', 1, 15]];
(async () => {
  const st = await openStudio({ width: 400, height: 300 });
  const png = await st.page.evaluate(([fac, TOP]) => {
    const T = TOWNS[fac], w = townWorld(fac); for (const o of w.far) o.visible = false;
    for (const [grp, t, slot] of TOP) { const S = T.scene.slots[slot], b = buildTown(fac, grp + t); if (!b) continue; b.scale.set(PXU * S.k * (S.flip ? -1 : 1), PXU * S.k, PXU * S.k); b.position.set(S.X, slotBase(w.L, slot), tz(S.Z)); w.scene.add(b); }
    const W = 1400, H = 1000, cam = new THREE.OrthographicCamera(-1100, 1100, -700 * 0 + 3600, 600, 10, 20000); // x: −1100..1100, z: −600..−3600 (Z 0.6..3.6)
    cam.position.set(0, 5000, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0); cam.top = 3600; cam.bottom = 600; cam.updateProjectionMatrix();
    G3.init(); const r = G3.r; r.setSize(W, H, false); r.setClearColor(0x222222, 1); w.scene.fog = null; r.render(w.scene, cam);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(r.domElement, 0, 0);
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.fillStyle = '#fff'; g.font = '12px sans-serif';
    for (let X = -1100; X <= 1100; X += 100) { const x = (X + 1100) / 2200 * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); if (X % 200 === 0) g.fillText(X, x + 2, H - 4); }
    for (let Z = 0.6; Z <= 3.6; Z += 0.1) { const y = H - (Z - 0.6) / 3 * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.fillText(Z.toFixed(1), 2, y - 2); }
    for (const [grp, t, slot] of TOP) { const S = T.scene.slots[slot], x = (S.X + 1100) / 2200 * W, y = H - (S.Z - 0.6) / 3 * H; g.fillStyle = '#ff0'; g.fillText(slot + ' ' + grp, x - 10, y); }
    return c.toDataURL('image/png').split(',')[1];
  }, [fac, TOP]);
  await st.browser.close(); fs.writeFileSync(out, Buffer.from(png, 'base64')); console.log(out);
})();
