# Kroniki Królestw

Turowa strategia fantasy w stylu Heroes 3, w przeglądarce. Gotowa gra to jeden plik:
**`Kroniki Królestw.html`** — wystarczy go otworzyć.

## Kod

Źródła leżą w `src/`, a plik gry jest z nich składany:

- `src/szablon.html` — HTML i CSS strony, w miejscu `@@SKRYPT@@` trafia cały kod gry,
- `src/js/NN-dział.js` — kod gry podzielony na działy (dane, zasady, bitwa, SI, ekrany…),
  sklejany w kolejności numerów w jeden `<script>`.

Nie zmieniaj `Kroniki Królestw.html` ręcznie — edytuj `src/`, a potem:

```
npm run build   # złóż plik gry
npm run watch   # składaj po każdej zmianie w src/
npm test        # sprawdź, czy plik gry jest aktualny, i uruchom testy (Playwright)
```

Poza CI testom trzeba wskazać Chromium, np. `CHROMIUM_PATH=/ścieżka/do/chromium npm test`.

## Publikacja

Po każdej zmianie w `main` workflow „Publikacja (GitHub Pages)” uruchamia testy i publikuje grę
jako `index.html` (jednorazowo: Settings → Pages → Source: „GitHub Actions”).

## Bezpieczeństwo

- Paczki npm tylko z oficjalnego rejestru, w wersjach i sumach kontrolnych z `package-lock.json` (`npm ci`);
  skrypty instalacji paczek wyłączone (`.npmrc`: `ignore-scripts=true`) — tą drogą zainfekowane paczki uruchamiają kod.
  Nowe paczki dodawaj tylko po sprawdzeniu (popularność, wydawca); `npm audit` działa w CI, a Dependabot co tydzień
  zgłasza znane podatności jako pull request do przejrzenia.
- Żadnych sekretów w repozytorium: klucz podpisu APK i hasło są wyłącznie w sekretach GitHuba (Settings → Secrets),
  używane tylko przy wydaniu z `main`. `.gitignore` odrzuca pliki kluczy, `.env` i `sekrety*`.
- Gra nie zbiera żadnych danych i nie łączy się z niczym poza grą online (PeerJS: serwer pośredniczący przy łączeniu,
  potem połączenie bezpośrednie — drugi gracz widzi twój adres IP, jak w każdej grze sieciowej). Wiadomości od innych
  graczy są sprawdzane (format, rozmiar, długość nazw) i rysowane na płótnie, nigdy wstawiane jako HTML.
- Narzędzia AI (`tools/tla-ai`, `tools/portrety-ai`) wczytują wagi modeli tylko w bezpiecznym formacie safetensors
  (bez plików pickle, które mogą wykonać kod); modele z Hugging Face od znanych autorów.
- Zasady pilnuje `tests/bezpieczenstwo.test.js`.
