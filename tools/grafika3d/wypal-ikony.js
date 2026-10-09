// Portrety jednostek do okienek armii (jak w Heroes 3): ten sam model 3D co w bitwie, ale w trzech czwartych przodem
// i w zbliżeniu na głowę i tułów (głowa: punkt 'head' z modeli, przy jeźdźcu i centaurze najwyższy). Tło (barwy frakcji)
// dorysowuje gra, więc portret jest przezroczysty. Arkusz: src/grafika/ikony.webp + ikony.json { f: { cid: [x, y, w, h] } }.
//   node tools/grafika3d/wypal-ikony.js            wszystkie jednostki      node tools/grafika3d/wypal-ikony.js pikeman,orc   wybrane (do podglądu)
//   node tools/grafika3d/wypal-ikony.js --do-ai    portrety 256×292 (tools/grafika3d/.cache/portrety/<cid>.png + opisy.json);
//     potem tools/tla-ai/portrety-jednostek/sklej.py (arkusz do gry, same rendery 3D – bez domalowywania przez AI)
// Podgląd zawsze w tools/grafika3d/.cache/ikony.png.
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const BL = process.argv.includes('--blender'), AI = process.argv.includes('--do-ai'), PW = AI ? 256 : 112, PH = AI ? 292 : 128, YAW = 1.05, PITCH = 0.12; // portret w pikselach arkusza (gra rysuje go w połowie: ostry na gęstych ekranach); kamera z przodu-boku

// Opis portretu dla AI: słowa z identyfikatora (blackDragon -> black dragon) i najważniejsze cechy wyglądu (kolory, hełm, broń)
async function bake(ids) {
  const out = []; let st = null, n = 0;
  for (const id of ids) {
    if (!st || n++ % 20 === 0) { if (st) await st.browser.close(); st = await openStudio({ width: 300, height: 300 }); } // świeża przeglądarka co kilkanaście (pamięć karty programowej)
    const r = await st.page.evaluate(async ([id, PW, PH, YAW0, PITCH, AI, BL]) => {
      G3.raw = true; G3.soft = AI; const L = CREATURES[id].look, g = buildUnit(L, { t: 0 }); if (!g) return null;
      g.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(g), heads = [];
      g.traverse(o => { if (o.name === 'head') heads.push(o.getWorldPosition(new THREE.Vector3())); });
      let mouth = null; g.traverse(o => { if (o.name === 'mouth' && !mouth) mouth = o.getWorldPosition(new THREE.Vector3()); });
      const top = box.max.y, hp0 = heads.length ? heads.reduce((a, b) => (b.y > a.y ? b : a)) : new THREE.Vector3((box.min.x + box.max.x) / 2, top - (top - box.min.y) * 0.18, (box.min.z + box.max.z) / 2);
      const hp = mouth && heads.length && mouth.distanceTo(hp0) < 1.5 ? hp0.clone().lerp(mouth, 0.5) : hp0; // zwierzę: środek łba między karkiem a pyskiem
      // kadr w jednostkach świata: głowa i pierś człowieka ≈ 0,95; duże stwory szerzej (łeb na długiej szyi, skrzydła), maszyny całe
      const machine = ['ballista', 'tent', 'cart', 'catapult', 'tower'].includes(L.kind), hc0 = machine ? (top - box.min.y) * 1.15 : Math.max(0.95, Math.min(3.2, hp.y * 0.62)); let hc = hc0;
      // skrzydlate (smok, feniks, gryf, ptaki): skrzydła z przodu zasłoniłyby łeb, więc kamera bardziej z boku i szerszy kadr
      const winged = ['dragon', 'phoenix', 'bird', 'griffin'].includes(L.kind) || L.wings, YAW = winged ? 0.55 : YAW0; if (winged && !machine) hc = Math.min(3.6, hc * 1.35);
      const k = PH / hc, sy = Math.sin(YAW), cy = Math.cos(YAW), sp = Math.sin(PITCH), cp = Math.cos(PITCH);
      const fx = machine ? (box.min.x + box.max.x) / 2 : hp.x, fy = machine ? (box.min.y + box.max.y) / 2 : hp.y, fz = machine ? (box.min.z + box.max.z) / 2 : hp.z;
      const px = fx * cy - fz * sy, py = -fx * sy * sp + fy * cp - fz * cy * sp; // punkt kadru na ekranie (kamera ortogonalna z yaw/pitch jak G3.render)
      const ax = PW / 2 - px * k + (machine ? 0 : -PW * 0.04), ay = (machine ? 0.5 : 0.34) * PH + py * k;
      if (BL) { const u = new Uint8Array(await new THREE.GLTFExporter().parseAsync(g, { binary: true })); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { glb: btoa(s), w: PW, h: PH, k, ax, ay, yaw: YAW, pitch: PITCH, skin: L.skin || '' }; } // portret w Blenderze
      const c = G3.render(g, PW, PH, k, ax, ay, { raw: true, yaw: YAW, pitch: PITCH });
      return c.toDataURL('image/png');
    }, [id, PW, PH, YAW, PITCH, AI, BL]);
    if (r) out.push([id, r]); process.stdout.write(r ? '.' : '-');
  }
  if (st) await st.browser.close();
  return out;
}

(async () => {
  const t0 = Date.now(), arg = process.argv.slice(2).find(a => !a.startsWith('--')), only = arg ? arg.split(',') : null;
  const { browser, page } = await openStudio({ width: 200, height: 200 });
  const ids = await page.evaluate(only => Object.keys(CREATURES).filter(id => (!only || only.includes(id)) && buildUnit(CREATURES[id].look, {})), only); await browser.close();
  console.log(`Portrety ${ids.length} jednostek…`);
  const W = 3, parts = await Promise.all(Array.from({ length: W }, (_, k) => bake(ids.filter((_, i) => i % W === k))));
  const all = parts.flat().sort((a, b) => ids.indexOf(a[0]) - ids.indexOf(b[0]));
  if (BL) { // --blender: wszystkie portrety w jednym uruchomieniu Blendera (blender/klatki.py), potem jak zwykle arkusz
    const dir = path.join(CACHE, 'blender', '_portrety'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const frames = all.map(([id, r]) => { const glb = path.join(dir, id + '.glb'); fs.writeFileSync(glb, Buffer.from(r.glb, 'base64')); const { glb: _, ...cam } = r; return { glb, out: path.join(dir, id + '.png'), ...cam }; });
    fs.writeFileSync(path.join(dir, 'job.json'), JSON.stringify({ ...frames[0], frames }));
    const PY = process.env.BLENDER_PY || '/home/user/bl/bin/python';
    require('child_process').execFileSync(PY, [path.join(__dirname, 'blender', 'klatki.py'), path.join(dir, 'job.json')], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, LD_LIBRARY_PATH: path.join(path.dirname(PY), '..', 'lib') } });
    for (const a of all) a[1] = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, a[0] + '.png')).toString('base64');
  }
  if (AI) { // pojedyncze portrety i opisy dla AI (angielskie: nazwa z identyfikatora i cechy wyglądu)
    const dir = path.join(CACHE, 'portrety'); fs.mkdirSync(dir, { recursive: true }); for (const [id, url] of all) fs.writeFileSync(path.join(dir, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    const { browser: b3, page: p3 } = await openStudio({ width: 200, height: 200 });
    const prompts = await p3.evaluate(ids => Object.fromEntries(ids.map(id => [id, unitPrompt(id, CREATURES[id].look)])), all.map(a => a[0])); await b3.close();
    fs.writeFileSync(path.join(dir, 'opisy.json'), JSON.stringify(prompts, null, 1)); console.log(`\nGotowe: ${all.length} portretów do AI w ${dir}`); return;
  }
  // arkusz składa osobna strona (płótno przeglądarki): portrety w rzędach po 16
  const { browser: b2, page: p2 } = await openStudio({ width: 200, height: 200 });
  const res = await p2.evaluate(async ([all, PW, PH]) => {
    const COLS = 16, sheet = document.createElement('canvas'); sheet.width = COLS * (PW + 2); sheet.height = Math.ceil(all.length / COLS) * (PH + 2); const g = sheet.getContext('2d'), f = {};
    for (let i = 0; i < all.length; i++) { const [id, url] = all[i], im = new Image(); im.src = url; await im.decode(); const x = (i % COLS) * (PW + 2), y = Math.floor(i / COLS) * (PH + 2); g.drawImage(im, x, y); f[id] = [x, y, PW, PH]; }
    return { webp: sheet.toDataURL('image/webp', 0.9).split(',')[1], png: sheet.toDataURL('image/png').split(',')[1], f };
  }, [all, PW, PH]); await b2.close();
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, 'ikony.png'), Buffer.from(res.png, 'base64'));
  if (!only) { fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'ikony.webp'), Buffer.from(res.webp, 'base64')); fs.writeFileSync(path.join(ROOT, 'src', 'grafika', 'ikony.json'), JSON.stringify({ f: res.f })); }
  console.log(`\nGotowe: ${all.length} portretów, ${(Buffer.from(res.webp, 'base64').length / 1024).toFixed(0)} KB, ${((Date.now() - t0) / 1000).toFixed(0)} s${only ? ' (tylko podgląd)' : ''}`);
})();
