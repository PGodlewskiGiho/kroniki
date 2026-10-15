// Wspólne narzędzia testów: gra działa w prawdziwej przeglądarce (Chromium bez okna),
// a testy wywołują jej funkcje przez page.evaluate(). Gra zostaje jednym plikiem HTML.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const GAME_URL = pathToFileURL(path.join(__dirname, '..', 'Kroniki Królestw.html')).href;

// Otwiera grę i zbiera błędy strony. Fonty z sieci blokujemy: testy nie zależą od internetu.
// CHROMIUM_PATH pozwala użyć przeglądarki zainstalowanej obok (gdy wersja Playwrighta jej nie zna).
async function openGame() {
  const exe = process.env.CHROMIUM_PATH || (require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : null), browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  // „Failed to load resource” pomijamy: nieudane żądania (poza fontami) łapie requestfailed poniżej.
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`console: ${m.text()}`); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  page.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`requestfailed: ${r.url()}`); });
  // błąd skryptu przy wczytywaniu (np. składnia): od razu, z treścią błędu – zamiast czekać 2 minuty na grę, która nie wstanie
  let loadErr = null; const onLoadErr = e => { loadErr = e; }; page.on('pageerror', onLoadErr);
  const ready = (fn, what) => Promise.race([page.waitForFunction(fn, null, { timeout: 120000 }),
    new Promise((_, rej) => { const t = setInterval(() => { if (loadErr) { clearInterval(t); rej(new Error(`gra się nie wczytała (${what}): ${loadErr.message}`)); } }, 200); page.once('close', () => clearInterval(t)); })]);
  await page.goto(GAME_URL, { timeout: 120000 }); // plik gry ok. 96 MB: lokalnie ~10 s, na CI bywa ponad domyślne 30 s
  await ready(() => typeof G !== 'undefined' && G.screen, 'G.screen');
  await ready(() => unitArtReady(), 'arkusze jednostek'); page.off('pageerror', onLoadErr); // wbudowane arkusze jednostek i 56 bohaterów (dekodują się asynchronicznie; na wolnym CI dłużej niż 30 s)
  return { browser, page, errors };
}

// Nowa gra o stałym ziarnie, bez ekranów przejścia. Zwraca krótki opis świata.
// Domyślnie bez przeciwników komputerowych (tryb swobodny), żeby testy zasad nie zależały od ruchów SI.
async function newGame(page, settings = {}, seed = 12345) {
  return page.evaluate(([settings, seed]) => {
    const S = Object.assign({}, G.settings, { mapSize: 'S', land: 'mixed', difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 0, slots: null }, settings);
    G.state = createNewGame(S, seed);
    setScreen('adventure', {});
    return { players: G.state.players.length, towns: G.state.towns.length, heroes: G.state.heroes.length, objects: G.state.objects.length };
  }, [settings, seed]);
}

// Czeka kilka klatek, żeby pętla gry narysowała bieżący ekran (błędy rysowania trafiają do konsoli).
async function frames(page, n = 5) {
  await page.evaluate(n => new Promise(res => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
}

// Otwarte okno dialogowe: { msg, labels } albo null
const dialog = page => page.evaluate(() => (G.modal && G.modal.msg != null ? { msg: G.modal.msg, labels: G.modal.buttons.map(b => b.label) } : null));
// Wciska przycisk okna dialogowego po etykiecie (jak kliknięcie)
async function pressDialog(page, label) {
  const ok = await page.evaluate(label => { const b = G.modal && G.modal.buttons.find(b => b.label === label); if (b) b.action(); return !!b; }, label);
  if (!ok) throw new Error(`brak przycisku „${label}” w oknie`);
}

module.exports = { openGame, newGame, frames, dialog, pressDialog };
