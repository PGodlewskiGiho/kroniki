# Interfejs: analiza i kierunek przebudowy

Zrzuty wszystkich ekranów (menu, nowa gra, mapa, okna, królestwo, kronika, bohater, księga, miasto, werbunek, rynek,
ustawienia, bitwa) przy 1280×800, przed przebudową. Poniżej: co jest źle, dlaczego, jak ma być i w jakiej kolejności.

## 1. Diagnoza

### Najważniejsze problemy (od największego wpływu)
1. **Brak jednego języka materiałów.** Na jednym ekranie są cztery niepasujące materiały: szary mur z cegieł w stylu
   pixel art, jasny pergamin, brązowe płaskie przyciski i czarne prostokąty z cienką złotą linią. Nic nie wynika z
   niczego. Świat (malowane miasta, modele 3D jednostek i obiektów) jest gładki i oświetlony, a interfejs jest płaski
   i pikselowy. Stąd wrażenie „taniego i losowego”.
2. **Tło-mur jest szumem.** Szare cegły zajmują 30–40% ekranu (boki bohatera i miasta, panel mapy, pasek bitwy).
   Są jasne, kontrastowe i powtarzalne, więc konkurują z treścią i wyglądają jak tekstura zastępcza.
3. **Typografia zastępcza.** Cinzel i Cormorant ładowały się z Google, więc bez sieci gra pisała Georgią. Nagłówki,
   przyciski i liczby mają ten sam krój i podobną wagę, więc hierarchia ginie. Część napisów jest za mała
   (np. „Czcionka: klasyczna” w przycisku), część się zmniejsza, żeby się zmieścić (różne rozmiary w jednym rzędzie).
4. **Przyciski bez stanu i bez szlachetności.** Dwa pasy brązu i cienka złota ramka. Wyłączony przycisk jest szarym
   kamieniem, który wygląda jak zepsuty element, a nie jak „niedostępne”. Wszystkie przyciski są jednakowo ważne:
   „Koniec tury”, „Rozpocznij” i „Wróć” nie różnią się wagą.
5. **Ozdoby z innej epoki.** Narożniki to pikselowe romby (2 px), separatory to kreska z rombem. Przy gładkiej
   grafice i ostrym ekranie wyglądają jak błąd skalowania.
6. **Ikony panelu mapy** to płaskie, jednokolorowe sylwetki (korona, but, księżyc), nieczytelne i różnej wielkości.
7. **Gniazda (armia, artefakty, plecak, umiejętności)** to półprzezroczyste czarne prostokąty z cienką ramką na murze.
   Puste gniazda bohatera z napisami „Głowa”, „Szyja” wyglądają jak makieta.
8. **Układ i rytm.** Brak siatki: różne marginesy (6, 8, 10, 14 px), elementy przyklejone do krawędzi, nachodzące
   napisy (Królestwo: „Obeliski” pod przyciskiem „Zamknij”), ucięte treści (Werbunek: ostatni rząd, umiejętności
   bohatera na dole ekranu).
9. **Bitwa:** górny pasek to ciemny pas z trzema napisami, dolny to mur z sześcioma przyciskami. Brak ramki pola,
   brak kolejki ruchów, licznik many jako wyłączony przycisk.
10. **Księga czarów** jest listą na pergaminie, a nie księgą. Większość okna jest pusta.

### Co działa i zostaje
- Pergamin jako materiał „dokumentu” (okna z tekstem, kronika): dobry kierunek, wymaga lepszej ramy i światła.
- Złoto i ciemny brąz jako kolory akcentu: pasują do Heroes i do malowanych miast.
- Ikony surowców, artefaktów i umiejętności z modeli 3D: to wzór jakości dla reszty interfejsu.
- Rozmieszczenie głównych ekranów (mapa + panel z prawej, miasto + lista budowli) jest czytelne; zmieniamy wygląd,
  nie przyzwyczajenia gracza.

## 2. Kierunek: „oprawiona kronika”

Interfejs ma wyglądać jak oprawa starej kroniki i warsztat kartografa: **ciemne, rzeźbione drewno i czernione żelazo
jako rama, mosiądz/złoto jako okucia, skóra jako wnętrze paneli, pergamin tylko tam, gdzie się czyta.** Ozdoby
(narożniki, nity, medaliony, ikony przycisków) są wypalane z modeli 3D tym samym oświetleniem co jednostki i obiekty
mapy, więc interfejs i świat mają wspólne światło.

Zasady:
- **Rama się cofa, treść wychodzi.** Tło ramy jest ciemne i spokojne (niski kontrast, winieta). Najjaśniejsze są
  treść, obraz świata i główne akcje.
- **Jeden materiał na jedną rolę** (tabela niżej). Żadnych cegieł w interfejsie.
- **Hierarchia przez wagę, nie przez liczbę ozdób:** jeden ozdobny nagłówek na okno, jedna główna akcja na ekran.
- **Gładko i ostro:** wszystko rysowane w rozdzielczości ekranu, ozdoby w wysokiej rozdzielczości z arkusza.

### Materiały i role
| Rola | Materiał | Przykłady |
|---|---|---|
| Rama ekranu (chrome) | ciemne drewno orzechowe, delikatne słoje, winieta, żelazne okucia | tło boków miasta i bohatera, panel mapy, pasek bitwy |
| Panel informacyjny | ciemna skóra z przeszyciem, złota listwa | panel mapy, lista budowli, statystyki |
| Dokument | pergamin z ciepłym światłem i przypalonym brzegiem, złota oprawa | okna dialogowe, kronika, rynek, ustawienia |
| Gniazdo | wpuszczone, ciemne, z mosiężną fazą i wewnętrznym cieniem | armia, artefakty, plecak, umiejętności |
| Akcja | tabliczka z brązu z ciemnym środkiem, wypukły napis | przyciski |
| Akcja główna | ta sama tabliczka, czerwień i złoto | „Koniec tury”, „Rozpocznij”, „Walcz” |
| Wybór | czerwona emalia + jasne złoto | wybrana opcja, zakładka |
| Ozdoba | złoto 3D: narożniki, nity, medaliony, separator z kamieniem | rogi okien, nagłówki |

### Kolory (tokeny)
- Drewno ramy: `#1c130c` → `#2b1d12` (słoje `#3a2818`)
- Skóra panelu: `#2a1d14` → `#3a2819`, przeszycie `#8a6a3a`
- Pergamin: `#e9d7ac` (środek) → `#c9a771` (brzeg), przypalenie `#6b4520`
- Złoto: cień `#5a3d12`, środek `#c9a14a`, blask `#ffe7a3`
- Tekst na ciemnym: `#ecdcb4` (główny), `#b9a47a` (drugorzędny), `#7d6c52` (wyłączony)
- Tekst na pergaminie: `#2a1808` (główny), `#5b4126` (drugorzędny)
- Akcenty: czerwień wyboru `#8e2a1c`, zieleń zysku `#4f8a3a`, czerwień braku `#a8321e`, błękit many `#4a7ac8`

### Typografia
- **Cinzel Decorative 700**: tylko tytuł gry i nagłówki dużych okien (jeden na ekran).
- **Cinzel 700/600**: nagłówki, przyciski, zakładki, etykiety statystyk, z lekkim rozstrzeleniem liter.
- **Cormorant Garamond 600/500, kursywa 500**: tekst ciągły, opisy, podpowiedzi. Cormorant ma małą wysokość
  małych liter, więc tekst ciągły co najmniej 18 px.
- Liczby (zasoby, statystyki): Cinzel 700, wyrównanie do prawej.
- Na ciemnym tle: cień 0 2 px rozmyty zamiast twardego, przesuniętego cienia pikselowego.
- Fonty wbudowane w plik gry (działają bez internetu).

### Siatka i rytm
- Jednostka 8 px; marginesy wewnętrzne okien 24, odstępy między grupami 16, między elementami 8.
- Wysokości przycisków: 32 (mały), 40 (zwykły), 48 (główny).
- Narożniki prostokątne (rzeźbione ramy), zaokrąglenie najwyżej 3 px.

## 3. Komponenty
1. **Rama ekranu** (`chromeFill`): drewno + winieta + listwy; zastępuje mur (`stoneFill`).
2. **Panel** (`drawStone` → panel skórzany): skóra, wewnętrzne przeszycie, złota listwa, nity 3D w rogach.
3. **Okno-dokument** (`drawParchment`): pergamin, oprawa ze złotej listwy, narożniki 3D, opcjonalny nagłówek
   na wstędze z separatorem 3D.
4. **Przycisk** (`Button`): stany: zwykły, najechany (cieplejsze złoto, poświata), wciśnięty (wgłębiony), wybrany
   (czerwona emalia), wyłączony (przyciemniony, napis wyblakły, bez szarego kamienia); wariant główny.
5. **Przycisk-ikona**: medalion 3D z ikoną 3D (korona, następny bohater, but, sen, księga, ustawienia, łopata,
   zagadka, schody).
6. **Gniazdo** (`drawSlot`): jeden komponent dla armii, artefaktów, plecaka, umiejętności; puste gniazdo
   bohatera z wyblakłą ikoną części ciała zamiast napisu.
7. **Separator** z kamieniem 3D, **zakładki**, **pasek zasobów** (oprawiona listwa z podziałkami).
8. **Dymek podpowiedzi**: ciemna skóra z jasnym tekstem, nie pergamin (odróżnia podpowiedź od okna).

## 4. Plan etapów
1. Fonty wbudowane, tokeny kolorów i typografii w kodzie (`UI` w pliku 10).
2. Ornamenty 3D wypalone do arkusza `src/grafika/interfejs.webp` (narożniki, nity, medaliony, separator, ikony
   przycisków) narzędziem `tools/grafika3d/wypal-interfejs.js`.
3. Nowe prymitywy w `10-interfejs-ramki-przyciski-okna.js`: rama, panel, dokument, przycisk, gniazdo, separator,
   zakładka, dymek. Stare nazwy funkcji zostają (wszystkie ekrany zmieniają się od razu).
4. Ekrany po kolei: menu → nowa gra → mapa (panel, pasek zasobów, ikony) → miasto → bohater → bitwa (rama pola,
   panel dowodzenia) → księga czarów (rozłożona księga) → okna (królestwo, kronika, rynek, werbunek, ustawienia).
5. Weryfikacja: zrzuty przed i po dla każdego ekranu, testy układu i wydajności, poprawki nachodzenia i ucinania.

## 5. Kryteria odbioru
- Na żadnym ekranie nie ma cegieł ani pikselowych ozdób.
- Każde okno ma jeden nagłówek, jedną główną akcję, równe marginesy (siatka 8 px), nic nie nachodzi i nic nie jest ucięte.
- Wszystkie stany przycisków są odróżnialne bez czytania napisu.
- Tekst ciągły co najmniej 16 px (opisy 18 px), kontrast tekstu do tła co najmniej 4,5:1.
- Płynność ekranów menu, miasta i bohatera bez zmian (gotowe obrazy z pamięci), testy zielone.
