// Strona z three.js, materiałami z tools/grafika3d/modele.js, siatką głowy i portret.js (dla podglądu i wypalania)
'use strict';
const path = require('path'), fs = require('fs');
const { ROOT, threeBundle } = require('../grafika3d/wspolne');
const { build, OUT } = require('./pobierz');
async function openPortraitStudio() {
  if (!fs.existsSync(OUT)) await build();
  const { chromium } = require('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } }), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await page.setContent('<!doctype html><html><body style="margin:0;background:#222"></body></html>');
  await page.addScriptTag({ path: threeBundle() }); await page.addScriptTag({ path: path.join(ROOT, 'tools', 'grafika3d', 'modele.js') });
  await page.addScriptTag({ content: 'window.GLOWA = ' + fs.readFileSync(OUT, 'utf8') });
  for (const f of ['portret.js', 'wyglad.js', 'bohaterowie.js']) if (fs.existsSync(path.join(__dirname, f))) await page.addScriptTag({ path: path.join(__dirname, f) });
  if (errors.length) throw new Error(errors.join('\n'));
  return { browser, page, errors };
}
module.exports = { openPortraitStudio };
