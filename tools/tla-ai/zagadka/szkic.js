// Szkice scen mapy zagadki (768×576), każda frakcja z własną sceną i kadrem (jak różne obrazy puzzli w H3): szarża pod zamkiem,
// leśna polana z jeziorem, cmentarz w pełni księżyca, hydra w bagnie, wrota piekieł, tytan na szczycie, smoczy skarbiec w jaskini,
// starcie w kanionie. Prawdziwe stwory z gry (arkusze jednostek) na prostym tle; obraz maluje img2img (opisy: opisy.json zagadka_*).
//   node tools/tla-ai/zagadka/szkic.js [frakcja]  ->  szkic-<frakcja>.png
//   malowanie: cd tools/tla-ai && W=768 H=576 sh uruchom.sh zagadka_<frakcja> zagadka/szkic-<frakcja>.png 1,2 0.5
//   wybrany obraz -> src/grafika/ekrany/zagadka_<frakcja>.webp
const { openGame } = require('../../../tests/harness'); const fs = require('fs'), path = require('path');
const FACS = ['haven', 'sylvan', 'barrow', 'fortress', 'inferno', 'academy', 'dungeon', 'stronghold'];
(async () => { const { browser, page } = await openGame(); const only = process.argv[2];
  for (const fac of FACS) { if (only && fac !== only) continue;
    const b64 = await page.evaluate(fac => {
      const W = 768, H = 576, o = document.createElement('canvas'); o.width = W; o.height = H; const g = o.getContext('2d'), r = mulberry32(fac.length * 7919 + fac.charCodeAt(0));
      // --- pomocnicze ---
      const lin = (y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
      const sky = (stops, hor) => { g.fillStyle = lin(0, hor, stops); g.fillRect(0, 0, W, hor + 2); };
      const disc = (x, y, rad, col, halo = 0.25) => { for (const [k, a] of [[2.4, halo * 0.5], [1.6, halo], [1, 1]]) { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, rad * k, 0, TAU); g.fill(); } g.globalAlpha = 1; };
      const ridge = (base, amp, col, step = 30, seed = 0) => { const R = mulberry32(seed + 5); g.fillStyle = col; g.beginPath(); g.moveTo(0, H); let y = base - amp * R(); for (let x = 0; x <= W + step; x += step * (0.6 + R() * 0.8)) { y = clamp(y + (R() - 0.5) * amp, base - amp, base); g.lineTo(x, y); } g.lineTo(W, H); g.fill(); };
      const ground = (hor, stops) => { g.fillStyle = lin(hor, H, stops); g.fillRect(0, hor, W, H - hor); };
      const blob = (x, y, rx, ry, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.globalAlpha = 1; };
      const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
      const clouds = (n, y0, y1, col, a) => { for (let i = 0; i < n; i++) { const x = r() * W, y = y0 + r() * (y1 - y0), L = 50 + r() * 90; for (let k = 0; k < 5; k++) blob(x + k * L / 5, y - (k % 2) * 6, L / 3, 9 + r() * 6, col, a); } };
      const pine = (x, y, h, col) => poly([[x, y - h], [x + h * 0.3, y], [x - h * 0.3, y]], col);
      const oak = (x, y, h, col) => { g.fillStyle = shadeHex(col, -0.3); g.fillRect(x - h * 0.05, y - h * 0.5, h * 0.1, h * 0.5); for (let k = 0; k < 6; k++) blob(x + (r() - 0.5) * h * 0.6, y - h * 0.55 - r() * h * 0.4, h * 0.25, h * 0.2, k % 2 ? col : shadeHex(col, 0.15)); };
      const rays = (x, y, col, n, a) => { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const ang = 0.35 + i / n * 1.1; g.globalAlpha = a * (0.5 + r() * 0.5); poly([[x, y], [x + Math.cos(ang - 0.04) * 900, y + Math.sin(ang - 0.04) * 900], [x + Math.cos(ang + 0.04) * 900, y + Math.sin(ang + 0.04) * 900]], col); } g.restore(); };
      const glow = (x, y, rad, col, a = 0.6) => { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.restore(); };
      const fog = (y, h, col, a) => { const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, y - h, W, h * 2); g.globalAlpha = 1; };
      const put = (cid, x, y, k, dir = 1, pose = 'attack', fr = 4) => { try { drawSprite(g, battleSprite(cid, dir, pose, fr), x, y, k); } catch (e) { /* brak arkusza */ } };
      const town = (f, x, y, k) => { const ts = townSprite(f, 3); g.imageSmoothingEnabled = true; const w = ts.c.width * ts.u / 2 * k, h = ts.c.height * ts.u / 2 * k; g.drawImage(ts.c, x - w / 2, y - h, w, h); };
      const crowd = (ids, n, x0, x1, y0, y1, k0, k1, dir, pose = 'walk') => { const L = []; for (let i = 0; i < n; i++) { const t = r(); L.push([ids[i % ids.length], x0 + r() * (x1 - x0), y0 + t * (y1 - y0), k0 + t * (k1 - k0)]); } L.sort((a, b) => a[2] - b[2]).forEach(([c, x, y, k], i) => put(c, x, y, k, dir, pose, i % 8)); };
      const bolt = (x0, y0, x1, y1) => { g.save(); g.globalCompositeOperation = 'lighter'; for (const [w, c] of [[10, 'rgba(160,200,255,.5)'], [3, '#ffffff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); for (let i = 1; i < 10; i++) { const f = i / 10; g.lineTo(x0 + (x1 - x0) * f + (r() - 0.5) * 40, y0 + (y1 - y0) * f + (r() - 0.5) * 20); } g.lineTo(x1, y1); g.stroke(); } g.restore(); };
      // --- sceny ---
      const S = {
        haven() { // szarża rycerstwa pod białym zamkiem, archanioł nad polem, promienie słońca zza chmur
          const hor = 300; sky(['#4a7ac8', '#a8c8e8', '#f8d898'], hor); clouds(6, 40, 200, '#ffffff', 0.35); rays(60, -20, '#fff4c0', 9, 0.18);
          ridge(hor, 60, '#7a98b8', 40, 1); ridge(hor + 30, 40, '#5a8a4a', 30, 2); ground(hor + 30, ['#6aa04a', '#3a6a2a']);
          blob(170, 330, 210, 70, '#5a904a'); town('haven', 170, 320, 3.6);
          put('griffin', 520, 150, 0.9, -1, 'walk', 2); put('royalGriffin', 640, 110, 0.7, -1, 'walk', 5);
          crowd(['pikeman', 'crusader', 'marksman'], 14, 260, 720, 380, 430, 0.7, 0.9, 1); crowd(['champion', 'cavalier'], 6, 250, 700, 440, 540, 1.2, 1.9, 1, 'walk');
          put('dawnbringer', 560, 330, 2.8, -1, 'attack', 5); put('champion', 200, 560, 2.4, 1, 'walk', 3); },
        sylvan() { // poranna polana: jezioro w lesie, jednorogi u wody, smok nad koronami, miasto-drzewo we mgle
          const hor = 330; sky(['#7ab0a0', '#c8e8c0', '#f8f0c8'], hor); disc(560, 120, 26, '#fff8d8', 0.2);
          town('sylvan', 400, hor + 10, 2.2); fog(hor, 40, '#e8f4e0', 0.7); ground(hor, ['#5a8a3a', '#2a5a22']);
          blob(400, 440, 250, 55, '#7ab8c8'); blob(400, 432, 220, 30, '#a8d8e0', 0.6);
          for (let i = 0; i < 9; i++) { oak(20 + i * 20, 560 - (i % 3) * 30, 230 + r() * 80, '#2a5a2a'); oak(W - 20 - i * 20, 560 - (i % 3) * 30, 230 + r() * 80, '#2a5a2a'); }
          put('jadeDragon', 300, 250, 1.7, 1, 'walk', 3); put('sunPhoenix', 600, 230, 1.1, -1, 'walk', 6);
          put('silverUnicorn', 330, 470, 1.6, 1, 'idle', 1); put('unicorn', 480, 490, 1.5, -1, 'idle', 3); put('starUnicorn', 400, 520, 1.4, 1, 'idle', 5);
          crowd(['nymph', 'elfSharp', 'dryad'], 8, 230, 560, 380, 410, 0.6, 0.75, 1, 'idle'); put('treantKing', 150, 540, 2.2, 1, 'idle', 2); },
        barrow() { // cmentarz w pełni księżyca: kościany smok na tle tarczy, licz na krypcie, szkielety wstają z grobów
          const hor = 360; sky(['#0e0a1e', '#2a2448', '#4a3e5a'], hor); disc(384, 170, 80, '#e8ecf4', 0.18); clouds(4, 80, 260, '#8a88a8', 0.25);
          ridge(hor, 50, '#1e1a2a', 36, 3); ground(hor, ['#2a2630', '#14121a']); put('boneDragon', 384, 240, 2.4, -1, 'walk', 4);
          poly([[300, 470], [468, 470], [450, 400], [318, 400]], '#3a3644'); poly([[318, 400], [450, 400], [384, 360]], '#4a4654'); // krypta
          for (let i = 0; i < 16; i++) { const x = r() * W, y = hor + 30 + r() * 180, s = 0.6 + (y - hor) / 180; g.fillStyle = '#5a5866'; g.fillRect(x - 7 * s, y - 20 * s, 14 * s, 20 * s); blob(x, y - 20 * s, 7 * s, 7 * s, '#5a5866'); }
          fog(H - 60, 60, '#5aff9a', 0.18); glow(384, 380, 120, '#60ff90', 0.35);
          crowd(['boneWarrior', 'boneGuard', 'boneLegionary', 'ghoul'], 16, 40, 730, 420, 540, 0.8, 1.4, 1, 'walk');
          put('lich', 384, 400, 1.8, 1, 'attack', 4); put('dreadLord', 120, 560, 2.1, 1, 'walk', 2); put('banshee', 620, 330, 1.2, -1, 'walk', 3); put('wraith', 160, 300, 1.0, 1, 'walk', 5); },
        fortress() { // hydra wynurza się z bagna o zmierzchu, jaszczuroludzie w łodziach z pochodniami, ważki, namorzyny
          const hor = 280; sky(['#2a3a4a', '#c87a5a', '#f0b070'], hor); disc(200, 240, 40, '#ffd8a0', 0.2);
          ridge(hor, 30, '#3a4a3a', 40, 4); town('fortress', 140, hor + 18, 1.6); g.fillStyle = lin(hor, H, ['#4a5a3a', '#1e2a1a']); g.fillRect(0, hor, W, H - hor);
          for (let i = 0; i < 6; i++) blob(r() * W, hor + 40 + r() * 200, 80 + r() * 60, 6, '#d8a070', 0.15); // odblaski
          for (let i = 0; i < 4; i++) { const x = 30 + i * 70; g.strokeStyle = '#1e1a10'; g.lineWidth = 6; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x, hor + 60); g.lineTo(x - 20 + k * 14, hor + 120); g.stroke(); } oak(x, hor + 60, 140, '#2a3a1a'); }
          fog(hor + 40, 30, '#c8d8c0', 0.5); put('primeHydra', 500, 470, 3.3, -1, 'attack', 4);
          for (const [x, y, k] of [[180, 500, 1.3], [300, 540, 1.6]]) { poly([[x - 60 * k, y], [x + 60 * k, y], [x + 45 * k, y + 16 * k], [x - 45 * k, y + 16 * k]], '#5a3a1a'); put('lizardWarrior', x - 15 * k, y + 4, k * 0.9, 1, 'attack', 2); put('gnollMarauder', x + 25 * k, y + 4, k * 0.9, 1, 'idle', 1); glow(x - 40 * k, y - 40 * k, 30, '#ffb040', 0.7); }
          put('venomFly', 300, 260, 1.0, 1, 'walk', 2); put('queenFly', 640, 230, 0.9, -1, 'walk', 6); put('wyvernKing', 680, 330, 1.2, -1, 'walk', 4); },
        inferno() { // wrota piekieł: ognisty krąg, arcydiabeł wychodzi, chmary diablików, rzeka lawy, ogary
          const hor = 380; sky(['#120404', '#4a0e08', '#a8301a'], hor); ridge(hor, 140, '#1a0806', 50, 6); poly([[560, hor], [660, 200], [700, 210], [790, hor]], '#140604'); glow(680, 205, 60, '#ff7020', 0.8);
          ground(hor, ['#2a1410', '#140806']);
          for (const [rad, col, a] of [[200, '#ff6a1a', 0.35], [160, '#ffb040', 0.5], [130, '#2a0806', 1]]) blob(384, 300, rad * 0.75, rad, col, a); glow(384, 300, 240, '#ff8030', 0.45);
          g.fillStyle = '#ff7a20'; g.beginPath(); g.moveTo(0, 520); g.bezierCurveTo(250, 470, 450, 600, W, 500); g.lineTo(W, 545); g.bezierCurveTo(450, 640, 250, 520, 0, 565); g.fill(); glow(380, 540, 260, '#ffa040', 0.5);
          put('archDevil', 384, 470, 3.0, 1, 'attack', 4); crowd(['imp', 'familiar', 'firebrand'], 18, 120, 650, 120, 330, 0.6, 0.9, 1, 'walk');
          put('cerberus', 170, 520, 1.8, 1, 'walk', 2); put('abyssCerberus', 610, 530, 1.9, -1, 'walk', 5); put('efreetSultan', 640, 300, 1.4, -1, 'attack', 3); put('pitLord', 120, 420, 1.4, 1, 'idle', 1); },
        academy() { // tytan na ośnieżonym szczycie ciska piorun w czarnego smoka, latająca wieża nad chmurami, zorza
          const hor = 420; sky(['#1a2a5a', '#4a7ab0', '#c8dcf0'], hor);
          for (const [y, col] of [[90, '#60ffb0'], [130, '#b080ff']]) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18; g.fillStyle = col; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(250, y - 60, 500, y + 60, W, y - 20); g.lineTo(W, y + 30); g.bezierCurveTo(500, y + 100, 250, y, 0, y + 50); g.fill(); g.restore(); }
          clouds(5, 230, 300, '#ffffff', 0.5); town('academy', 170, 250, 2.2); clouds(4, 250, 290, '#f0f4ff', 0.6);
          ridge(hor, 80, '#8aa0c0', 40, 7); poly([[380, H], [600, 230], [640, 250], [W, H]], '#a8b8d0'); poly([[560, 300], [600, 230], [640, 250], [660, 320], [610, 290]], '#ffffff');
          ground(hor + 40, ['#e8f0f8', '#b8c8d8']); put('stormTitan', 610, 330, 1.8, -1, 'attack', 5); put('blackDragon', 220, 360, 2.1, 1, 'walk', 3); bolt(575, 220, 280, 300);
          crowd(['ironGolem', 'archMage', 'masterGremlin', 'obsidianGargoyle'], 10, 60, 520, 480, 560, 0.8, 1.2, 1, 'walk'); put('masterGenie', 470, 400, 1.3, -1, 'attack', 2); },
        dungeon() { // smoczy skarbiec w jaskini: kamienny łuk wejścia, stalaktyty, smok zwinięty na złocie, kryształy, śmiałkowie z pochodniami
          g.fillStyle = '#100a14'; g.fillRect(0, 0, W, H); g.fillStyle = lin(0, H, ['#2a1a3a', '#4a2a5a', '#2a1a28']); g.beginPath(); g.ellipse(384, 340, 330, 280, 0, 0, TAU); g.fill();
          for (let i = 0; i < 14; i++) { const x = 60 + i * 50 + r() * 20, L = 40 + r() * 90; poly([[x - 12, 40 + r() * 30], [x + 12, 40 + r() * 30], [x, 60 + L]], '#1a1222'); }
          blob(400, 500, 250, 70, '#c8902a'); blob(400, 480, 200, 45, '#e8b840'); for (let i = 0; i < 40; i++) blob(200 + r() * 400, 450 + r() * 70, 3, 2, '#fff0a0');
          glow(400, 470, 220, '#ffc040', 0.4); for (const [x, y, s] of [[110, 430, 1], [660, 410, 1.2], [600, 200, 0.7]]) { for (let k = 0; k < 4; k++) poly([[x + k * 12 * s, y], [x + k * 12 * s + 8 * s, y - (40 + k * 10) * s], [x + k * 12 * s + 16 * s, y]], '#b060ff'); glow(x + 20 * s, y - 20 * s, 70 * s, '#c080ff', 0.6); }
          put('blackDragon', 420, 450, 3.2, -1, 'idle', 2); put('evilEye', 600, 250, 1.1, -1, 'idle', 3); put('evilEye', 220, 220, 0.9, 1, 'idle', 5);
          for (const [c, x, y, k] of [['champion', 120, 560, 1.6], ['crusader', 210, 545, 1.3], ['marksman', 260, 530, 1.1]]) { put(c, x, y, k, 1, 'idle', 2); glow(x + 18 * k, y - 60 * k, 40, '#ffb040', 0.7); }
          put('minotaurKing', 660, 560, 1.7, -1, 'attack', 3); },
        stronghold() { // starcie w kanionie o zachodzie: behemot przeciw cyklopowi, za nimi horda orków i wilków w kurzu, ptaki rok
          const hor = 330; sky(['#5a2a1a', '#d86a2a', '#f8c070'], hor); disc(384, 300, 50, '#fff0c0', 0.25);
          poly([[0, 0], [190, 0], [230, 120], [210, 260], [260, 400], [180, H], [0, H]], '#7a3a1e'); poly([[W, 0], [560, 0], [530, 150], [560, 280], [500, 420], [590, H], [W, H]], '#6a321a');
          poly([[0, 120], [150, 90], [200, 240], [120, 300], [0, 280]], '#9a4a24'); poly([[W, 160], [600, 130], [570, 300], [660, 330], [W, 320]], '#8a4220');
          ground(hor, ['#c88a50', '#8a5a30']); fog(hor + 40, 50, '#e8c090', 0.7);
          crowd(['orcAxe', 'wargRider', 'hobgoblinRaider', 'orcChief'], 20, 240, 540, hor + 10, hor + 110, 0.55, 0.95, 1, 'walk');
          put('thunderbird', 320, 150, 1.0, 1, 'walk', 3); put('roc', 470, 200, 0.8, -1, 'walk', 6);
          put('ancientBehemoth', 220, 520, 2.5, 1, 'attack', 4); put('cyclopsKing', 570, 510, 2.3, -1, 'attack', 5); for (let i = 0; i < 8; i++) blob(300 + r() * 220, 520 + r() * 40, 40, 14, '#d8a870', 0.4); },
      };
      S[fac](); g.fillStyle = 'rgba(30,16,4,.10)'; g.fillRect(0, 0, W, H);
      return o.toDataURL('image/png').split(',')[1]; }, fac);
    fs.writeFileSync(path.join(__dirname, `szkic-${fac}.png`), Buffer.from(b64, 'base64')); }
  await browser.close(); })();
