// Wypalanie klatek bitewnych jednostek w Blenderze (Cycles: miękkie światło, skóra z rozpraszaniem, metal z odbiciami) zamiast
// renderu przeglądarki. Pozy i bryły budują te same modele (postacie.js, zwierzeta.js…); każda klatka idzie do Blendera jako GLB.
// Klatki mapy przygody (małe) zostają z przeglądarki. Arkusze i opis jak wypal.js (src/grafika/jednostki/<cid>.webp, jednostki.json).
//   node tools/grafika3d/wypal-blender.js                wszystkie      node tools/grafika3d/wypal-blender.js pikeman,orc   wybrane
//   node tools/grafika3d/wypal-blender.js --nowe         tylko jednostki jeszcze nie wypalone w Blenderze (wznowienie)
// Wymaga Blendera jako modułu Pythona (bpy) w BLENDER_PY (domyślnie /home/user/bl/bin/python; pip install bpy tbb).
'use strict';
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const OUT_DIR = path.join(ROOT, 'src', 'grafika', 'jednostki'), META = path.join(ROOT, 'src', 'grafika', 'jednostki.json');
const UB = 0.6, UM = 1.8, KB = 32 / UB, KM = 15.4 / UM, DS = KB / 24.6;
const PY = process.env.BLENDER_PY || '/home/user/bl/bin/python', TMP = path.join(CACHE, 'blender');

(async () => {
  const t0 = Date.now(), args = process.argv.slice(2), fresh = args.includes('--nowe'), arg = args.find(a => !a.startsWith('--')), only = arg ? arg.split(',') : null;
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
  let st = await openStudio({ width: 300, height: 300 });
  let ids = await st.page.evaluate(only => Object.keys(CREATURES).filter(id => (!only || only.includes(id)) && buildUnit(CREATURES[id].look, {})), only);
  if (fresh) ids = ids.filter(id => !(meta[id] && meta[id].bl));
  console.log(`Blender: ${ids.length} jednostek`);
  let n = 0;
  for (const id of ids) {
    if (n++ % 8 === 7) { await st.browser.close(); st = await openStudio({ width: 300, height: 300 }); } // świeża przeglądarka (pamięć)
    const dir = path.join(TMP, id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    // 1) pozy -> GLB (klatki bitwy) i klatki mapy z przeglądarki; punkt paszczy liczony rzutem jak kamera G3
    const job = await st.page.evaluate(async ([id, KB, KM, DS]) => {
      G3.raw = true; const L = CREATURES[id].look, s = Math.max(1, L.size || 1), F = BATTLE_FRAMES, flyer = CREATURES[id].abil.includes('fly'), wide = L.kind === 'dragon' || L.wings || flyer ? 1.25 : 1;
      const W = Math.round(150 * s * DS * wide), H = Math.round(150 * s * DS * wide), AX = Math.round(W * 0.45), AY = H - Math.round(18 * s * DS), frames = [], maps = []; let mouth = null;
      const yaw = 0.38, pitch = 0.28, proj = v => { const x = v.x * Math.cos(yaw) - v.z * Math.sin(yaw), y = -v.x * Math.sin(yaw) * Math.sin(pitch) + v.y * Math.cos(pitch) - v.z * Math.cos(yaw) * Math.sin(pitch); return [AX + x * KB, AY - y * KB]; };
      const ex = new THREE.GLTFExporter(), b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
      const add = async (pose, i, P) => {
        const g0 = buildUnit(L, P), g = pose === 'dead' ? layDead(g0, L) : g0; g.updateMatrixWorld(true);
        if (pose === 'attack' && i === Math.round(0.55 * (F.attack - 1))) { const m = g.getObjectByName('mouth'); if (m) { const p = proj(m.getWorldPosition(new THREE.Vector3())); mouth = [Math.round(p[0] - AX), Math.round(p[1] - AY)]; } }
        frames.push({ pose, i, glb: b64(await ex.parseAsync(g, { binary: true })) });
      };
      for (let i = 0; i < F.idle; i++) await add('idle', i, { t: i / F.idle * Math.PI * 2 / 2.4 });
      for (let i = 0; i < F.walk; i++) await add('walk', i, { t: i * 0.2, walk: i / F.walk });
      if (flyer) for (let i = 0; i < F.fly; i++) await add('fly', i, { t: i * 0.2, fly: i / F.fly });
      for (let i = 0; i < F.attack; i++) await add('attack', i, { t: 0, atk: i / (F.attack - 1) });
      await add('hurt', 0, { t: 0, hurt: true }); await add('dead', 0, { t: 0 });
      const mw = Math.round(W * KM / KB) + 4, mh = Math.round(H * KM / KB) + 4, max = Math.round(AX * KM / KB) + 2, may = Math.round(AY * KM / KB) + 2;
      for (let i = 0; i < 4; i++) maps.push(G3.render(buildUnit(L, { t: i / 4 * Math.PI * 2 / 2.4 }), mw, mh, KM, max, may).toDataURL('image/png'));
      return { W, H, AX, AY, frames, maps, mw, mh, max, may, mouth, skin: L.skin || '' };
    }, [id, KB, KM, DS]);
    const list = job.frames.map((f, k) => { const g = path.join(dir, `${k}.glb`); fs.writeFileSync(g, Buffer.from(f.glb, 'base64')); return { glb: g, out: path.join(dir, `${k}.png`) }; });
    fs.writeFileSync(path.join(dir, 'job.json'), JSON.stringify({ w: job.W, h: job.H, k: KB, ax: job.AX, ay: job.AY, yaw: 0.38, pitch: 0.28, skin: job.skin, frames: list }));
    // 2) Blender renderuje wszystkie klatki jednostki w jednym uruchomieniu
    execFileSync(PY, [path.join(__dirname, 'blender', 'klatki.py'), path.join(dir, 'job.json')], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, LD_LIBRARY_PATH: path.join(path.dirname(PY), '..', 'lib') } });
    // 3) arkusz jak w wypal.js: klatki przycięte do zajętych pikseli, rzędy po pozach
    const pngs = list.map(f => 'data:image/png;base64,' + fs.readFileSync(f.out).toString('base64'));
    const r = await st.page.evaluate(async ([job, pngs]) => {
      const load = async u => { const im = new Image(); im.src = u; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c; };
      const frames = [], crop = (pose, i, c, ax, ay) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } frames.push({ pose, i, c, sx: x0, sy: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, ax: ax - x0, ay: ay - y0 }); };
      for (let k = 0; k < job.frames.length; k++) crop(job.frames[k].pose, job.frames[k].i, await load(pngs[k]), job.AX, job.AY);
      for (let i = 0; i < 4; i++) crop('map', i, await load(job.maps[i]), job.max, job.may);
      const rows = {}; for (const f of frames) (rows[f.pose] = rows[f.pose] || []).push(f);
      let sw = 0, sh = 0; for (const rr of Object.values(rows)) { sw = Math.max(sw, rr.reduce((a, f) => a + f.w + 1, 0)); sh += Math.max(...rr.map(f => f.h)) + 1; }
      const sheet = document.createElement('canvas'); sheet.width = sw; sheet.height = sh; const g = sheet.getContext('2d'), m = {};
      let y = 0; for (const [pose, rr] of Object.entries(rows)) { let x = 0; m[pose] = rr.map(f => { g.drawImage(f.c, f.sx, f.sy, f.w, f.h, x, y, f.w, f.h); const q = [x, y, f.w, f.h, f.ax, f.ay]; x += f.w + 1; return q; }); y += Math.max(...rr.map(f => f.h)) + 1; }
      return { webp: sheet.toDataURL('image/webp', 0.9).split(',')[1], f: m };
    }, [{ ...job, frames: job.frames.map(f => ({ pose: f.pose, i: f.i })) }, pngs]);
    for (const e of ['.png', '.webp']) { const p = path.join(OUT_DIR, id + e); if (fs.existsSync(p)) fs.unlinkSync(p); }
    fs.writeFileSync(path.join(OUT_DIR, id + '.webp'), Buffer.from(r.webp, 'base64'));
    meta[id] = { u: UB, mu: UM, f: r.f, ...(job.mouth ? { m: job.mouth } : {}), raw: 1, bl: 1 }; fs.writeFileSync(META, JSON.stringify(meta));
    fs.rmSync(dir, { recursive: true, force: true }); process.stdout.write(`${id} `);
  }
  await st.browser.close();
  console.log(`\nGotowe: ${ids.length} jednostek, ${((Date.now() - t0) / 60000).toFixed(1)} min`);
})();
