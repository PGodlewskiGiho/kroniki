// Wspólne narzędzia testów: gra działa w prawdziwej przeglądarce (Chromium bez okna),
// a testy wywołują jej funkcje przez page.evaluate(). Gra zostaje jednym plikiem HTML.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const GAME_URL = pathToFileURL(path.join(__dirname, '..', 'Kroniki Królestw.html')).href;

// Otwiera grę i zbiera błędy strony. Fonty z sieci blokujemy: testy nie zależą od internetu.
// CHROMIUM_PATH pozwala użyć przeglądarki zainstalowanej obok (gdy wersja Playwrighta jej nie zna).
async function openGame() {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  // „Failed to load resource” pomijamy: nieudane żądania (poza fontami) łapie requestfailed poniżej.
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`console: ${m.text()}`); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  page.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`requestfailed: ${r.url()}`); });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => typeof G !== 'undefined' && G.screen);
  return { browser, page, errors };
}

// Nowa gra o stałym ziarnie, bez ekranów przejścia. Zwraca krótki opis świata.
async function newGame(page, settings = {}, seed = 12345) {
  return page.evaluate(([settings, seed]) => {
    const S = Object.assign({}, G.settings, { mapSize: 'S', difficulty: 1, faction: 'haven', bonus: 'gold' }, settings);
    G.state = createNewGame(S, seed);
    setScreen('adventure', {});
    return { players: G.state.players.length, towns: G.state.towns.length, heroes: G.state.heroes.length, objects: G.state.objects.length };
  }, [settings, seed]);
}

// Czeka kilka klatek, żeby pętla gry narysowała bieżący ekran (błędy rysowania trafiają do konsoli).
async function frames(page, n = 5) {
  await page.evaluate(n => new Promise(res => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
}

module.exports = { openGame, newGame, frames };
