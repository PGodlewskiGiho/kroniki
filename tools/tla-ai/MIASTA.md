# Jak robimy miasto: tło AI + budowle 3D (instrukcja krok po kroku)

Gotowe: **Przystań** (haven), **Knieja** (sylvan), **Kurhan** (barrow), **Twierdza** (fortress). Kolejność dalej: Inferno, Akademia (academy), Loch (dungeon), Cytadela (stronghold).
Wzorce do podglądania: `uklady/sylvan.json`, `uklady/barrow.json`, `uklady/fortress.json` (bagno), `../grafika3d/budowle-knieja.js`, `../grafika3d/budowle-kurhan.js`, `../grafika3d/budowle-twierdza.js`.

## Zasady od użytkownika (obowiązkowe)

- Odpowiedzi krótko, po polsku. Commit i push po każdym etapie (hook tego wymaga). Scalanie do main tylko na słowo „scal”.
- **Generuj jedno tło naraz**, nie 4. Jak złe — zmień ziarno/siłę/opis i jedno kolejne.
- **Galeria modeli 3D do akceptacji przed wypalaniem.** Podgląd ułożenia też do akceptacji.
- Każde miasto ma **własny, potężny Graal** (nazwy: `GRAIL_NAMES` w `src/js/04-dane-frakcje-bohaterowie-budowle.js`).
- **Bez ramy z drzew/pni** wokół kadru (użytkownikowi nie pasowała). Rama tylko z tła (skały, góry) — albo wcale.
- **Płaska, otwarta ziemia pod budynki od początku** (wyznaczona już przy generowaniu tła). Budynki nie mogą „latać”, stać na wodzie, w krzakach ani na zboczach.
- Liście drzew: malowane karty (`leafSprite`/`crown3` z kart, `leafClump` dla stworzeń) — **nie kulki**. Nie dawać drzewek na każdy budynek (tylko tam, gdzie drzewo jest istotą budowli). Białe kulki-kwiaty źle wyglądają.
- Środek miasta nie może być pusty: ozdoby (`ozdoby` w układzie), duże budowle (fort, siedlisko 7) wyraźnie duże.
- Wypalanie jednostek (`wypal.js` dla wszystkich) **wstrzymane** do odwołania — wolno wypalić pojedyncze jednostki, gdy zmieniamy ich model.

## Narzędzia (wszystko w repo)

| plik | co robi |
|---|---|
| `tools/tla-ai/uruchom.sh frakcja szkic.png ziarno siła` | img2img (DreamShaper 8, CPU, ~3–7 min). Opis z `opisy.json` (`_styl`, `_negatyw`, `<frakcja>.opis`). Wynik `.cache/<frakcja>/<ziarno>-<siła>.png` |
| `tools/tla-ai/szkic-rownina.py frakcja wynik.png` | szkic: niebo, góry, płaska równina w perspektywie (hor = 140 w kadrze gry), barwy z `opisy.json → <frakcja>.szkic`. `BEZ_RAMY=1` — bez drzew ramy |
| `tools/tla-ai/bez-ramy.py` | usuwa ciemną ramę połączoną z krawędzią obrazu (lepiej od razu generować bez ramy) |
| `tools/grafika3d/wymiary.js frakcja` (`JSON=1` → `uklady/<frakcja>-wymiary.json`) | wymiary najwyższych stopni budowli (szer., głęb., wys., przód/tył) |
| `tools/tla-ai/plan.py frakcja [tło]` | plan bez renderu: obrysy podstaw w perspektywie + sylwetki; wypisuje kolizje (muszą być `[]`) → `.cache/plan-<frakcja>.png` |
| `tools/tla-ai/polana.py frakcja tla/<frakcja>-polana.png [siła] [ziarno]` | przemalowuje ziemię wg planu: place pod obrysami, trakt + ścieżki do frontów, img2img i wklejenie tylko w obszarze `polana.obszar` (`SZKIC=1` — tylko szkic) |
| `tools/grafika3d/galeria-miast.js frakcja plik.png` | galeria wszystkich budowli i stopni (2D z gry obok 3D) |
| `tools/grafika3d/podglad-tla.js frakcja tło.png wynik.png` (`ETYKIETY=1`) | podgląd: tło + ozdoby + najwyższe stopnie w miejscach z układu |
| `tools/grafika3d/wypal-miasta.js frakcja` | wypalenie arkusza `src/grafika/miasta/<frakcja>.webp` + `miasta.json` (~7 min, w tle) |
| `tools/grafika3d/galeria.js plik.png idle cid1,cid2` / `wypal.js cid1,cid2` | galeria / wypalenie wybranych jednostek |

Python: `tools/portrety-ai/venv/bin/python`; skrypty z AI przez `LD_PRELOAD=../portrety-ai/venv/stub/libcuextra.so LD_LIBRARY_PATH=../portrety-ai/venv/stub ../portrety-ai/venv/bin/python X.py` (z katalogu `tools/tla-ai`). Nie puszczać AI równolegle z ciężkim wypalaniem (OOM). Przeglądarka: `/opt/pw-browsers/chromium` (wykrywana automatycznie).

## Kroki dla nowego miasta

1. **Dane frakcji**: nazwy budowli i jednostek siedlisk (`src/js/04-dane-frakcje-bohaterowie-budowle.js`, linie `dw1: [...]`), Graal (`GRAIL_NAMES`), jednostki (`src/js/03-dane-stworzenia.js`, elity `elite(...)`).
2. **Modele 3D**: nowy plik `tools/grafika3d/budowle-<frakcja>.js` na wzór `budowle-kurhan.js`: paleta, pomocnicze bryły, obiekt `{ hall(t) 1–4, fort(t) 1–3, guild(t) 1–5, tavern, market, smith, silo, special, grail, dw1..dw7(t) 1–3, ozd(t) 1–5 }`, na końcu `TOWN3.<frakcja> = ...`. Dopisać plik do `MODEL_FILES` w `tools/grafika3d/wspolne.js` (przed `scena.js`).
   - Uwaga: pliki modeli to jedna przestrzeń globalna — **unikalne nazwy funkcji** (kolizje typu `tent`, `mushroom3` nadpisywały cudze).
   - Komentarze w środku linii kodu tylko `/* */` (komentarz `//` zjadł kiedyś `w.scene.add(b)`).
   - Stworzenia w budowlach: `creature('cid', x, y, z, skala, obrót)`.
   - Galeria jest wysoka (~13000 px) — do wysłania użytkownikowi pociąć na 4 JPG (inaczej wysyłka pada).
   - Graal: kolosalny, charakterystyczny (Przystań: anioł-kolos; Knieja: król drzewców; Kurhan: czaszka + klatka + słup dusz).
   - `node galeria-miast.js <frakcja> plik.png` → **pokazać użytkownikowi**, poprawić, aż zaakceptuje.
3. **Tło**: dopisać do `opisy.json` wpis frakcji: `opis` (bez drzew ramy, „wide flat open plain/ground…”) i `szkic` (barwy: `niebo`, `ziemia`, `gory`, `ksiezyc`/`ksiezyc_kolor` opcjonalnie, `rama`, `skaly`, `mgla`).
   `BEZ_RAMY=1 python szkic-rownina.py <frakcja> tla/szkic-<frakcja>-bez.png`, potem `./uruchom.sh <frakcja> tla/szkic-<frakcja>-bez.png <ziarno> 0.58–0.65` — **jedno**. Pokazać. Zapisać wybrane jako `tla/<frakcja>.png`.
   - **Opis max ~77 tokenów CLIP** (opis frakcji + `_styl` razem) — dłuższy jest ucinany (log: „truncated”), wtedy wypada styl i tło wychodzi mgliste. Opis frakcji krótki (~25 słów).
   - Zbyt wysoka siła daje przypadkowe skały/kratery na środku; wklejanie starego środka do szkicu dawało kolce. Najlepiej: czysty szkic równiny + opis z „huge perfectly flat open plain … only near the edges”.
4. **Analiza kątów**: horyzont = wiersz styku ziemi z górami (w kadrze gry 8–584 × 8–430; obraz 768×560 → `sy = 8 + y·422/560`). Kąt z elipsy na ziemi (np. wydeptany krąg/jezioro): proporcja wys/szer ≈ sin(kąt) w wierszu `sy` → `f = (sy − hor) / tan(kąt)`. Typowo `hor 140, f 500–540, d 440` (d = wysokość kamery → rozmiar budowli: px/jednostkę = (sy − hor)/d). Mapa głębi (Depth Anything) na malowanych tłach **nie działa** — nie używać do geometrii.
5. **Wymiary i plan**: `JSON=1 node wymiary.js <frakcja> > ../tla-ai/uklady/<frakcja>-wymiary.json`; napisać `uklady/<frakcja>.json`:
   `{ tlo: "<frakcja>-polana.png", pj: {hor, d, f}, slots: [16 × { s: [sx, sy], k?, flip?, yaw?, zaslona?: false }], ozdoby: [{o: wariant 1–5, s, k}], polana: {...} }`
   Kolejność slotów: 0 hall, 1 fort, 2 guild, 3 dw7, 4 dw6, 5 dw5, 6 dw4, 7 dw3, 8 smith, 9 silo, 10 dw1, 11 dw2, 12 tavern, 13 market, 14 special, 15 grail.
   Kompozycja jak w H3: olbrzymy z tyłu (fort pośrodku, brama na trakcie, Graal i siedlisko 7 duże, z tyłu po bokach), średnie w środku, małe z przodu; nic nie zasłania bram/fortu; budynki nie wychodzą za kadr. `python3 plan.py <frakcja> tla/<frakcja>.png` aż `kolizje: []`.
6. **Ziemia pod plan**: w układzie `polana`: `zrodlo` (tło), `obszar` (wielokąt w kadrze gry, od linii za tylnym rzędem do dołu), `bez` (wycięcia, np. wodospad), `obszar_tyl`, `woda` ([od, do] wierszy z wodą do zachowania; `[0,0]` = brak), `pnie: false` (gdy brak pni ramy), `trawa` [tył, przód], `ziemia`, `trakt` (punkty od dołu do bramy fortu), `trakt_w`, `opis` (prompt). `polana.py <frakcja> tla/<frakcja>-polana.png 0.42–0.5 <ziarno>`; usunąć `tla/*-polana-szkic.png`. Po każdej zmianie pozycji budowli — przemalować ziemię ponownie.
   - Pod ozdobami też są malowane małe place (nie stoją w wodzie).
   - **Woda między budynkami** (np. bagno): `bagno: 0.5` (próg; mniej = więcej wody), `bagno_tyl: 0.13` (o ile więcej wody z tyłu), `bagno_skala: 150` (wielkość rozlewisk w jednostkach świata), `woda_kolor: [[tył], [przód]]`. Szum liczony w świecie (X, Z), więc rozlewiska są spłaszczone perspektywą. Żeby woda sięgała do horyzontu, `obszar` zaczyna się tuż pod horyzontem (Twierdza: 160).
   - Kształt wody **najpierw pokazać użytkownikowi bez budynków** (`SZKIC=1`, potem wynik AI), dopiero potem budynki.
7. **Podgląd**: `node podglad-tla.js <frakcja> ../tla-ai/tla/<frakcja>-polana.png wynik.png` (`ETYKIETY=1` z numerami). Sprawdzić: nic nie lata, nic nie zasłania kluczowych budowli, środek nie pusty (dodać `ozdoby`: `TOWN3.<frakcja>.ozd(t)`; `k` zależy od modelu ozdoby: Kurhan 2.4–3.2, Twierdza 1.5–1.7 — ozdoby nie mogą przerastać budynków), unikać powtarzania tych samych elementów (rogi, totemy) na wielu budowlach, smoki/duże siedliska wyraźnie duże. **Pokazać użytkownikowi.**
8. **Wypalenie i gra**: `node tools/grafika3d/wypal-miasta.js <frakcja>` (w tle), `npm run build`, zrzut w grze (`node tools/grafika3d/zrzut-miasta.js <frakcja> plik.png` — nowa gra frakcją, wszystkie budowle, bohaterowie z księgą czarów, ekran `town`), `npm test` (229 testów), commit + push (`src/grafika/miasta/<frakcja>.webp`, `miasta.json`, `Kroniki Królestw.html`, narzędzia, `tla/`, `uklady/`).

## Jak to działa w grze (dla pewności)

- `paintedBg` (tło), `paintedDecor` (ozdoby wtapiane w tło), `renderTownBuilding(..., bare)` + `paintedFinish` (placyk, cień styku, dopasowanie barw, mgła) w `tools/grafika3d/scena.js`. Bryły poniżej gruntu są obcinane (płaszczyzna przycinania), żeby nic nie wisiało.
- Arkusz miasta: `{d, bg, bgo, b: {klucz: {f, o, m}}}`; gra (`src/js/18-miasto-grafika.js`) rysuje tło zamiast nieba i pomija postacie 2D, gdy `fx.painted`.
