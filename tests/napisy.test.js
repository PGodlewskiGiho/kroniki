// Napisy zawsze się mieszczą: text() dopasowuje się do ramki (pergamin, wnęka, gniazdo, skóra), wrapText dzieli zbyt długie
// słowa, wrapFit zmniejsza czcionkę zamiast ucinać wiersze, goldText zmniejsza za długi tytuł. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); await newGame(page); await frames(page, 2); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Rysuje w świeżej klatce i zwraca szerokość każdego napisu po dopasowaniu (z uwzględnieniem ściśnięcia przez maxWidth)
const drawn = fn => page.evaluate(fn => {
  const c = G.ctx, out = [], orig = c.fillText;
  c.fillText = function (s, x, y, mw) { const w = this.measureText(s).width; out.push({ s, w: mw === undefined ? w : Math.min(w, mw), font: this.font }); return orig.call(this, s, x, y, mw); };
  TextFit.frame++; c.save(); try { new Function('c', fn)(c); } finally { c.restore(); c.fillText = orig; }
  return out;
}, fn);

test('długi napis w pergaminie mieści się w ramce, krótki zostaje bez zmian', async () => {
  const r = await drawn(`drawParchment(c, 100, 100, 200, 100);
    text(c, 'Bardzo długi napis, który w żadnym razie nie zmieści się w tej małej ramce', 200, 140, { size: 18, align: 'center' });
    text(c, 'Krótki', 200, 170, { size: 18, align: 'center' });
    text(c, 'Napis od lewej strony też dłuższy niż ramka pergaminu', 110, 120, { size: 16 });`);
  assert.ok(r[0].w <= 200, `wyśrodkowany: ${r[0].w}`); assert.match(r[1].font, /18px/, 'krótki w pełnym rozmiarze');
  assert.ok(r[2].w <= 300 - 110, `od lewej do prawego brzegu: ${r[2].w}`);
});

test('ramka wybrana dobrze: gniazdo w panelu, okno nad ekranem, własna szerokość max', async () => {
  const r = await drawn(`insetBox(c, 50, 50, 400, 200); slotBox(c, 60, 60, 60, 40);
    text(c, 'Liczba 12345678901234', 90, 80, { size: 14, align: 'center' }); // w gnieździe: do 60 px
    text(c, 'Opis w panelu obok gniazda, dość długi ale mieści się', 140, 80, { size: 14 }); // w panelu: do 450
    drawParchment(c, 40, 40, 140, 80); // okno przykrywa gniazdo
    text(c, 'Tekst okna nad gniazdem, dłuższy', 110, 80, { size: 14, align: 'center' });
    text(c, 'Z własnym limitem szerokości', 300, 200, { size: 14, max: 60 });`);
  assert.ok(r[0].w <= 60, `w gnieździe: ${r[0].w}`); assert.match(r[1].font, /14px/, 'w panelu bez zmian');
  assert.ok(r[2].w <= 140 && r[2].w > 60, `okno, nie gniazdo: ${r[2].w}`); assert.ok(r[3].w <= 60, `max: ${r[3].w}`);
});

test('wrapText dzieli słowo dłuższe niż wiersz; wrapFit nie gubi tekstu', async () => {
  const r = await page.evaluate(() => {
    const c = G.ctx; c.font = font(16, 600, 'body');
    const lines = wrapText(c, 'Krótko Bardzozłożonasłowonazwakrainybezspacjiktóranigdysięniezmieści tak', 120);
    const long = 'Bohater odnalazł w ruinach starożytnej świątyni zwój z zaklęciem, którego nikt nie czytał od stu lat, a obok leżał zardzewiały miecz.';
    const f = wrapFit(c, long, 200, 3, { size: 16, weight: 600 }), g = wrapFit(c, long.repeat(6), 200, 2, { size: 16, weight: 600 });
    return { lines, widths: lines.map(l => c.measureText(l).width), f: { ...f, joined: f.lines.join(' ') }, long, g };
  });
  assert.equal(r.lines.join('').replace(/ /g, ''), 'KrótkoBardzozłożonasłowonazwakrainybezspacjiktóranigdysięniezmieścitak', 'żadna litera nie zginęła');
  assert.ok(r.lines.length >= 3);
  assert.ok(r.f.size < 16 && r.f.size >= 11, `mniejsza czcionka: ${r.f.size}`); assert.equal(r.f.joined, r.long, 'cały tekst, bez ucinania');
  assert.ok(r.g.lines.at(-1).endsWith('…'), 'zbyt długi kończy się wielokropkiem');
});

test('ekrany rysują się bez błędów na małym telefonie', async () => {
  await page.setViewportSize({ width: 640, height: 360 });
  for (const s of ['adventure', 'hero']) { await page.evaluate(s => setScreen(s, {}), s); await frames(page, 3); }
  await page.evaluate(() => setScreen('town', { townId: G.state.towns[0].id })); await frames(page, 3);
  await page.setViewportSize({ width: 800, height: 600 });
});
