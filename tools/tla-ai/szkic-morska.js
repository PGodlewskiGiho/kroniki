// Szkic tła bitwy morskiej dla img2img (generuj.py): dwa żaglowce burta w burtę, pokłady pod kolumnami heksów 0–4 i 8–12, woda w kolumnach 5–7,
// kładki abordażowe w rzędach 2 i 6 (stałe NAVAL_GAP / NAVAL_PLANKS z gry). Współrzędne pola bitwy 800×490, zapis 768×472.
//   node tools/tla-ai/szkic-morska.js   ->  tools/tla-ai/bitwy/szkic-morska.png
'use strict';
const path = require('path'), fs = require('fs'), { chromium } = require('playwright');
(async () => {
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, b = await chromium.launch(exe ? { executablePath: exe } : {}), p = await b.newPage();
  const png = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 768; c.height = 472; const g = c.getContext('2d'); g.scale(768 / 800, 472 / 490);
    let s = 7; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const L = 322, Rt = 482, rowY = r => 52 + r * 46 + 31, planks = [2, 6];
    // niebo i horyzont, morze
    let gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, '#9cc4dc'); gr.addColorStop(1, '#d8e4e0'); g.fillStyle = gr; g.fillRect(0, 0, 800, 40);
    gr = g.createLinearGradient(0, 30, 0, 490); gr.addColorStop(0, '#3a7890'); gr.addColorStop(0.4, '#1e5a72'); gr.addColorStop(1, '#0c3448'); g.fillStyle = gr; g.fillRect(0, 30, 800, 460);
    for (let i = 0; i < 900; i++) { const x = R() * 800, y = 34 + R() * 456, w = 6 + R() * 22 * (y / 490 + 0.3); g.strokeStyle = R() < 0.5 ? 'rgba(200,236,248,.45)' : 'rgba(8,36,52,.5)'; g.lineWidth = 1 + y / 300; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 2.5, x + w, y); g.stroke(); }
    const plank = (x0, x1, y0, y1, base) => { // deski pokładu wzdłuż statku (pionowo), z łączeniami i sękami
      g.fillStyle = base; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let x = x0, k = 0; x < x1; x += 13, k++) { g.fillStyle = `rgba(${k % 2 ? '255,230,180,.10' : '40,20,6,.10'})`; g.fillRect(x, y0, 13, y1 - y0); g.strokeStyle = 'rgba(46,24,8,.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
        for (let y = y0 + ((k * 37) % 90); y < y1; y += 90 + (k % 3) * 20) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 13, y); g.stroke(); } }
      for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(60,30,10,.35)'; g.beginPath(); g.ellipse(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 2, 4, 0, 0, 6.3); g.fill(); } };
    const ship = (v) => { // lewy statek (burta przy x = L); prawy to jego lustro względem środka szczeliny (v: odmiana ładunku)
      // kadłub: burta schodząca do wody od strony szczeliny, z furtami działowymi i lufami
      g.beginPath(); g.moveTo(L, 18); g.quadraticCurveTo(L - 4, 8, L - 60, -6); g.lineTo(-10, -6); g.lineTo(-10, 500); g.lineTo(L + 22, 500); g.lineTo(L + 22, 70); g.quadraticCurveTo(L + 18, 24, L, 18); g.closePath(); g.fillStyle = '#3a2214'; g.fill();
      for (let y = 30; y < 500; y += 7) { g.strokeStyle = 'rgba(14,6,2,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L, y); g.lineTo(L + 22, y + 2); g.stroke(); }
      g.fillStyle = '#8a1e14'; g.fillRect(L, 60, 22, 6); // pas burty
      for (const y of [110, 270, 420]) { g.fillStyle = '#120804'; g.fillRect(L + 5, y, 12, 12); g.fillStyle = '#2a2a2e'; g.fillRect(L + 14, y + 3, 14, 6); } // furty z działami
      // pokład z desek, zwężający się ku dziobowi u góry
      g.save(); g.beginPath(); g.moveTo(-10, 500); g.lineTo(-10, 0); g.lineTo(240, 0); g.quadraticCurveTo(300, 10, L - 12, 32); g.lineTo(L - 12, 500); g.closePath(); g.clip(); plank(-10, L - 12, 0, 500, '#a87444'); g.restore();
      // reling (nadburcie) z belką i słupkami, przerwany przy kładkach
      g.fillStyle = '#5a3418'; g.fillRect(L - 12, 30, 12, 470); g.fillStyle = '#7a4a24'; g.fillRect(L - 10, 30, 8, 470);
      for (let y = 40; y < 490; y += 26) { g.fillStyle = '#3a2010'; g.fillRect(L - 11, y, 10, 5); }
      for (const r of planks) { const y = rowY(r); g.fillStyle = '#a87444'; g.fillRect(L - 12, y - 16, 12, 32); }
      const barrel = (x, y) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x + 4, y + 5, 11, 7, 0, 0, 6.3); g.fill(); g.fillStyle = '#7a4a22'; g.beginPath(); g.arc(x, y, 10, 0, 6.3); g.fill(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 8, 0, 6.3); g.stroke(); g.beginPath(); g.arc(x, y, 4, 0, 6.3); g.stroke(); };
      const coil = (x, y) => { g.strokeStyle = '#c8b080'; g.lineWidth = 2; for (let k = 3; k < 12; k += 3) { g.beginPath(); g.arc(x, y, k, 0, 6.3); g.stroke(); } };
      const crate = (x, y) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 8, y - 6, 22, 20); g.fillStyle = '#8a5a2a'; g.fillRect(x - 11, y - 11, 22, 20); g.strokeStyle = '#3a2210'; g.lineWidth = 2; g.strokeRect(x - 11, y - 11, 22, 20); g.beginPath(); g.moveTo(x - 11, y - 11); g.lineTo(x + 11, y + 9); g.stroke(); };
      const cannon = y => { const x = L - 34; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 8, y - 5, 26, 20); g.fillStyle = '#4a2a14'; g.fillRect(x - 12, y - 9, 24, 18); g.fillStyle = '#2a2a30'; g.fillRect(x, y - 4, 26, 8); g.fillStyle = '#1a1a1a'; for (const yy of [y - 11, y + 7]) for (const xx of [x - 9, x + 5]) g.fillRect(xx, yy, 5, 5); };
      for (const y of v ? [140, 300, 452] : [128, 290, 440]) cannon(y);
      barrel(v ? 260 : 240, 34); barrel(v ? 238 : 262, 40); coil(L - 40, v ? 232 : 214); crate(v ? 150 : 200, 472); coil(v ? 90 : 60, 478); barrel(14, 230); barrel(16, 254);
      const hx = v ? 110 : 130; g.fillStyle = '#4a2a14'; g.fillRect(hx, 250, 80, 56); g.fillStyle = '#1a0e06'; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) g.fillRect(hx + 6 + i * 12, 256 + j * 12, 8, 8); // luk ładowni
      for (const my of [120, 380]) { const mx = 6; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(mx + 10, my + 10, 22, 12, 0, 0, 6.3); g.fill(); g.fillStyle = '#5a3418'; g.beginPath(); g.arc(mx, my, 16, 0, 6.3); g.fill(); g.fillStyle = '#3a2010'; g.beginPath(); g.arc(mx, my, 10, 0, 6.3); g.fill();
        g.strokeStyle = 'rgba(40,24,10,.7)'; g.lineWidth = 1.5; for (const dy of [-60, -30, 30, 60]) { g.beginPath(); g.moveTo(mx, my); g.lineTo(-10, my + dy); g.stroke(); } } // maszty przy zewnętrznej krawędzi
      gr = g.createLinearGradient(0, 0, 200, 0); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 40, 200, 450); // cień żagli
    };
    ship(0); g.save(); g.translate(L + Rt, 0); g.scale(-1, 1); ship(1); g.restore();
    // piana przy burtach w szczelinie
    for (let i = 0; i < 260; i++) { const sd = R() < 0.5 ? -1 : 1, x = (sd < 0 ? L + 22 : Rt - 22) + sd * -R() * 14, y = 30 + R() * 460; g.fillStyle = `rgba(230,248,255,${0.25 + R() * 0.4})`; g.beginPath(); g.ellipse(x, y, 2 + R() * 4, 1 + R() * 2, 0, 0, 6.3); g.fill(); }
    // kładki abordażowe: dwie deski z poprzeczkami, liny i haki
    for (const r of planks) { const y = rowY(r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(L - 8, y - 10, Rt - L + 16, 30);
      g.fillStyle = '#9a6a3a'; g.fillRect(L - 12, y - 16, Rt - L + 24, 32); for (let x = L - 12; x < Rt + 12; x += 14) { g.strokeStyle = 'rgba(46,24,8,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x, y + 16); g.stroke(); }
      g.strokeStyle = '#3a2210'; g.lineWidth = 2; g.strokeRect(L - 12, y - 16, Rt - L + 24, 32);
      for (const dy of [-18, 18]) { g.strokeStyle = '#c8b080'; g.lineWidth = 2; g.beginPath(); g.moveTo(L - 6, y + dy); g.quadraticCurveTo((L + Rt) / 2, y + dy + 6, Rt + 6, y + dy); g.stroke(); } }
    return c.toDataURL('image/png').split(',')[1];
  });
  fs.writeFileSync(path.join(__dirname, 'bitwy', 'szkic-morska.png'), Buffer.from(png, 'base64')); console.log('szkic-morska.png'); await b.close();
})();
