// Zapis do pliku i wczytanie z pliku (ekran zapisu/odczytu). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('gra zapisana do pliku wczytuje się z pliku taka sama', async () => {
  await newGame(page);
  await page.evaluate(() => { G.state.players[G.state.cur].resources.gold = 12345; G.go('load', { mode: 'save', fromGame: true }); });
  await page.waitForFunction(() => G.screenName === 'load');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => G.screen.toFile())]);
  const file = path.join(os.tmpdir(), 'kk-test-zapis.json'); await dl.saveAs(file);
  assert.match(dl.suggestedFilename(), /^kroniki-.*\.json$/);
  const before = await page.evaluate(() => JSON.stringify(serializeGame(G.state)));
  await page.evaluate(() => { G.state.players[G.state.cur].resources.gold = 1; G.go('load', { mode: 'load' }); });
  await page.waitForFunction(() => G.screenName === 'load' && G.screen.mode === 'load');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.evaluate(() => { G.screen.fromFile(); })]);
  await fc.setFiles(file);
  await page.waitForFunction(() => G.screenName === 'adventure', null, { timeout: 30000 }); // przy kilku przeglądarkach naraz (testy równolegle) wczytanie bywa wolne
  const r = await page.evaluate(() => ({ gold: G.state.players[G.state.cur].resources.gold, same: JSON.stringify(serializeGame(G.state)) }));
  assert.equal(r.gold, 12345); assert.equal(r.same, before);
  fs.unlinkSync(file);
});

test('zły plik daje czytelny komunikat zamiast błędu', async () => {
  const r = await page.evaluate(() => { try { gameFromFileText('to nie json'); return 'ok'; } catch (e) { return e.message; } });
  assert.equal(r, 'to nie jest plik zapisu gry');
});
