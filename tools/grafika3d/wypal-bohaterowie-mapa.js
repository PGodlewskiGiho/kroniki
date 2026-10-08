// Bohaterowie na mapie przygody: ten sam jeździec 3D co w bitwie, ale kamerą mapy (z góry, jak budowle i potwory na mapie)
// i w 8 kierunkach ruchu. Wypalamy 5 kierunków (wschód, południowy wschód, południe, północny wschód, północ); zachodnie gra
// odbija w poziomie. Klatki: spoczynek (4) i chód konia (12 – płynny ruch). Części w barwie gracza w kolorze-kluczu (magenta).
// Arkusz: src/grafika/bohaterowie-mapa/<klasa>.webp, opis: src/grafika/bohaterowie-mapa.json { klasa: { f: { 'walk_S': [[x,y,w,h,ax,ay]…] … } } }
//   node tools/grafika3d/wypal-bohaterowie-mapa.js            wszystkie klasy
//   node tools/grafika3d/wypal-bohaterowie-mapa.js knight      wybrane (podgląd: tools/grafika3d/.cache/bohater-mapa.png)
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, CACHE, openStudio } = require('./wspolne');
const OUT = path.join(ROOT, 'src', 'grafika', 'bohaterowie-mapa'), META = path.join(ROOT, 'src', 'grafika', 'bohaterowie-mapa.json');
const DIRS = { E: 0, SE: 1, S: 2, NE: 7, N: 6 }, FR = { idle: 4, walk: 12 }, PITCH = 0.62, HPX = 96; // wysokość jeźdźca w arkuszu (gra rysuje ok. połowę)

(async () => {
  const t0 = Date.now(), arg = process.argv.slice(2).find(a => !a.startsWith('--')), only = arg ? arg.split(',') : null;
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {}; fs.mkdirSync(OUT, { recursive: true });
  const { browser, page } = await openStudio({ width: 400, height: 300 });
  const classes = (await page.evaluate(() => Object.keys(HERO_LOOKS3))).filter(c => !only || only.includes(c));
  for (const cls of classes) {
    const r = await page.evaluate(async ([cls, DIRS, FR, PITCH, HPX]) => {
      G3.raw = true; const H = HERO_LOOKS3[cls], mage = MAGES.includes(cls), KEY = '#ff00ff';
      const L = { kind: 'rider', horse: H.horse, mane: H.mane, skin: H.skin, cloth: KEY, weapon: mage ? 'staff' : 'sword', helm: H.hood ? 'hood' : 'helm', hoodCol: H.hood, helmCol: H.helm, metal: H.armor, armor: !H.hood, cape: KEY, barding: KEY, trim: '#e0b24a', banner: KEY, orb: '#a0d0ff' };
      const W = 260, Hh = 260, AX = 130, AY = 200;
      const shot = (P, ang, K) => { const g = rider(L, P); g.rotation.y = ang; return G3.render(g, W, Hh, K, AX, AY, { raw: true, yaw: 0, pitch: PITCH }); };
      const bbox = c => { const d = c.getContext('2d').getImageData(0, 0, W, Hh).data; let x0 = W, y0 = Hh, x1 = -1, y1 = -1;
        for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
      // skala: jeździec bokiem (wschód, spoczynek) ma HPX pikseli wysokości
      const b0 = bbox(shot({ t: 0 }, 0, 40)), K = 40 * HPX / (b0[3] - b0[1] + 1);
      const frames = [];
      for (const [dn, oct] of Object.entries(DIRS)) {
        const ang = -oct * Math.PI / 4; // obrót modelu: 0 = w prawo (wschód), kolejne ósemki zgodnie z ruchem wskazówek zegara na ekranie (w dół = południe)
        for (let i = 0; i < FR.idle; i++) frames.push(['idle_' + dn, shot({ t: i / FR.idle * Math.PI * 2 / 2.4 }, ang, K)]);
        for (let i = 0; i < FR.walk; i++) frames.push(['walk_' + dn, shot({ t: i * 0.2 * 8 / FR.walk, walk: i / FR.walk }, ang, K)]);
      }
      const crop = frames.map(([pose, c]) => { const [x0, y0, x1, y1] = bbox(c); return { pose, c, sx: x0, sy: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, ax: AX - x0, ay: AY - y0 }; });
      const rows = {}; for (const f of crop) (rows[f.pose] = rows[f.pose] || []).push(f);
      let sw = 0, sh = 0; for (const rr of Object.values(rows)) { sw = Math.max(sw, rr.reduce((a, f) => a + f.w + 1, 0)); sh += Math.max(...rr.map(f => f.h)) + 1; }
      const sheet = document.createElement('canvas'); sheet.width = sw; sheet.height = sh; const g = sheet.getContext('2d'), m = {};
      let y = 0; for (const [pose, rr] of Object.entries(rows)) { let x = 0; m[pose] = rr.map(f => { g.drawImage(f.c, f.sx, f.sy, f.w, f.h, x, y, f.w, f.h); const q = [x, y, f.w, f.h, f.ax, f.ay]; x += f.w + 1; return q; }); y += Math.max(...rr.map(f => f.h)) + 1; }
      return { webp: sheet.toDataURL('image/webp', 0.88).split(',')[1], png: sheet.toDataURL('image/png').split(',')[1], f: m, h: HPX };
    }, [cls, DIRS, FR, PITCH, HPX]);
    fs.writeFileSync(path.join(OUT, cls + '.webp'), Buffer.from(r.webp, 'base64')); meta[cls] = { f: r.f, h: r.h }; fs.writeFileSync(META, JSON.stringify(meta));
    fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, 'bohater-mapa.png'), Buffer.from(r.png, 'base64'));
    process.stdout.write(`${cls} (${(Buffer.from(r.webp, 'base64').length / 1024).toFixed(0)} KB) `);
  }
  await browser.close(); console.log(`\nGotowe: ${classes.length} klas, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
