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
