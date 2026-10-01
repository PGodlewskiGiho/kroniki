// Wspólne dla podglądu i wypalania: pakiet three.js (esbuild), przeglądarka z grą i modelami 3D.
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..', '..'), CACHE = path.join(__dirname, '.cache');
function threeBundle() {
  const out = path.join(CACHE, 'three.min.js'); if (fs.existsSync(out)) return out;
  fs.mkdirSync(CACHE, { recursive: true });
  require('esbuild').buildSync({ entryPoints: [path.join(__dirname, 'three-entry.js')], bundle: true, minify: true, format: 'iife', globalName: 'THREE', outfile: out, logLevel: 'warning' });
  return out;
}
const MODEL_FILES = ['modele.js', 'postacie.js', 'zwierzeta.js', 'maszyny.js', 'budowle.js', 'budowle-knieja.js', 'scena.js'].map(f => path.join(__dirname, f)).filter(f => fs.existsSync(f));
// Dane jednostek (look, klatki animacji) z gry, a modele na osobnej, pustej stronie (nazwy funkcji gry i narzędzia nie kolidują)
async function openStudio(viewport = { width: 1440, height: 900 }) {
  const { chromium } = require('playwright');
  const exe = process.env.CHROMIUM_PATH || (require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : null), browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const game = await browser.newPage(); await game.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await game.goto(require('url').pathToFileURL(path.join(ROOT, 'Kroniki Królestw.html')).href); await game.waitForFunction(() => typeof CREATURES !== 'undefined');
  const data = await game.evaluate(() => ({ creatures: Object.fromEntries(Object.entries(CREATURES).map(([id, c]) => [id, { look: c.look, abil: c.abil || [], name: c.name, faction: c.faction || '', level: c.level }])), frames: BATTLE_FRAMES,
    heroes: Object.fromEntries(Object.entries(HERO_CLASSES).map(([id, c]) => [id, c.look])), mages: MAGE_CLASSES,
    towns: Object.fromEntries(Object.keys(TOWN_LAYOUTS).map(f => { const L = townLayout({ faction: f }); return [f, { slots: L.slots.map(S => ({ w: S.w, h: S.h, k: S.k, Z: S.Z })), art: TOWN_ART[f], sky: L.sky,
      scene: JSON.parse(JSON.stringify({ pj: L.pj, hills: L.hills, rivers: L.rivers, roads: L.roads, plaza: L.plaza, bridges: L.bridges, props: L.props, walls: L.walls, slots: L.slots, ground: L.ground, haze: L.haze, mountains: L.mountains, forest: L.forest, lakes: L.lakes, slabs: L.slabs, islands: L.islands, seas: L.seas })) }]; })) })); await game.close();
  const page = await browser.newPage({ viewport }); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setContent('<!doctype html><html><body style="margin:0"></body></html>');
  await page.evaluate(d => { window.CREATURES = d.creatures; window.BATTLE_FRAMES = d.frames; window.HERO_LOOKS3 = d.heroes; window.MAGES = d.mages; window.TOWNS = d.towns; }, data);
  await page.addScriptTag({ path: threeBundle() }); for (const f of MODEL_FILES) await page.addScriptTag({ path: f });
  if (errors.length) throw new Error(errors.join('\n'));
  return { browser, page, errors };
}
module.exports = { ROOT, CACHE, openStudio, threeBundle };
