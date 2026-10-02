// Szkice teł bitew dla img2img (generuj.py): tło bitwy rysowane przez grę (paintBattleBg) dla każdego terenu, 768×472 (pole bitwy bez siatki i panelu: górne 490 px ekranu).
//   node tools/tla-ai/szkic-bitwy.js     ->  tools/tla-ai/bitwy/szkic-<teren>.png
'use strict';
const path = require('path'), fs = require('fs'), url = require('url'), { chromium } = require('playwright');
(async () => {
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, b = await chromium.launch(exe ? { executablePath: exe } : {}), p = await b.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await p.goto(url.pathToFileURL(path.join(__dirname, '..', '..', 'Kroniki Królestw.html')).href); await p.waitForFunction(() => typeof paintBattleBg === 'function');
  const out = await p.evaluate(() => TERRAINS.map((t, i) => { const c = document.createElement('canvas'); c.width = 768; c.height = 472; const g = c.getContext('2d'); g.scale(768 / W, 472 / 490); paintBattleBg(g, i, '', true); return c.toDataURL('image/png').split(',')[1]; }));
  const names = ['woda', 'trawa', 'ziemia', 'piasek', 'snieg', 'bagno', 'nierowny', 'lawa'];
  out.forEach((png, i) => fs.writeFileSync(path.join(__dirname, 'bitwy', `szkic-${names[i]}.png`), Buffer.from(png, 'base64'))); console.log('szkice:', names.join(', ')); await b.close();
})();
