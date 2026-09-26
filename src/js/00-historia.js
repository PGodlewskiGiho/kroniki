/* =====================================================================================
   KRONIKI KRÓLESTW — turowa strategia fantasy w klimacie klasycznych gier o bohaterach.
   Jeden plik HTML, czysty JavaScript i Canvas 2D, bez bibliotek.

   SPIS TREŚCI (działy w kolejności w pliku; szukaj po "// ==================== NAZWA")
     KONFIGURACJA I DANE PODSTAWOWE  stałe, surowce, trudność, mapy, kolory, bonusy, ROADMAP
     DANE: TEREN I RUCH              TERRAINS/ROADS (koszty ruchu i palety kolorów)
     DANE: STWORZENIA                CREATURES: statystyki i wygląd (look) jednostek
     DANE: FRAKCJE, BOHATEROWIE...   HERO_CLASSES, FACTIONS, BUILDINGS, MINES
     DANE: ARTEFAKTY I ROZWÓJ...     PRIMARY, CLASS_GROWTH, poziomy, EQUIP_SLOTS, ARTIFACTS
     DANE: CZARY                     SPELLS, efekty i opisy; GUILD_OFFER, CLASS_SPELLS
     DANE: OBIEKTY MAPY              SITES: kapliczki, studnie, młyny, obozy… (działanie w ZASADY GRY)
     STAN GRY I USTAWIENIA           G (program), miejsca graczy (slots), ME = człowiek przy ekranie, skróty: human, hero...
     NARZĘDZIA                       losowość, szum, A*, kolory
     RYSOWANIE: PODSTAWY I PIXEL ART tekst, cache warstw, sprite(), drawSprite(), blit()
     INTERFEJS                       kamień, pergamin, Button, showDialog, drawCost, pasek surowców
     GRAFIKA OBIEKTÓW                jeden rysunek na obiekt: surowce, kopalnie, stwory, bohater, miasto
     GRAFIKA: PORTRETY BOHATERÓW     pixel art 36×36, wygląd z HERO_LOOKS albo losowany z imienia
     GRAFIKA: OBLĘŻENIE              mur, brama i wieże na polu bitwy (castleSprite), bruk dziedzińca
     GRAFIKA: STWORY TWIERDZY I INFERNA  ciała 'insect', 'lizard', 'bull', 'hydra'
     GRAFIKA: SKARBCE                drawBank, bankSprite: krypta, warownia, gniazdo, leże hydr, Smocza Utopia
     ŚWIAT: TWORZENIE NOWEJ GRY      generateMap, placeObjects, createTown, createHero, createNewGame
     ZASADY GRY                      ruch, ścieżki, obiekty, potyczki, armie, rekrutacja, dochód, budowa
     BITWA: ZASADY                   pole heksów, obrażenia, kolejka, SI, simulateBattle, resolveBattle
     ZAPIS I ODCZYT GRY              serializeGame/deserializeGame, SaveStore (konto Claude albo przeglądarka)
     MAPA PRZYGODY: RENDEROWANIE     teren piksel po pikselu, minimapa, mgła, kamera
     MIASTO: GRAFIKA                 style frakcji, budowle, sceny w perspektywie, efekty
     MIASTO: TWIERDZA I INFERNO      style, budowle i sceny dwóch nowych frakcji
     EKRANY / MAPA / BOHATER / BITWA / MIASTO  menu, listy, mapa, ekran bohatera, bitwa, widok miasta
     SILNIK                          pętla, wejście (mysz, dotyk, klawiatura, kółko), przejścia

   ZASADY, KTÓRYCH SIĘ TRZYMAMY
   • Jedno źródło prawdy. Dane frakcji tylko w FACTIONS, kolory terenu tylko w TERRAINS/ROADS,
     obietnice typu „w kroku 7” tylko w ROADMAP, dochód tylko w dailyIncomeAll().
   • G.state to dane rozgrywki bez grafiki; cały świat tworzy createNewGame(), ekrany tylko go pokazują.
     Nowe pole w stanie = sprawdź serializeGame(): dane zapisują się same, jeśli są zwykłym JSON-em.
     Zapis jest możliwy tylko, gdy nikt się nie rusza (canSaveNow), bo h.pending to funkcja.
     Zmiana formatu zapisu = podbij SAVE_VERSION (stare zapisy zostaną wtedy odrzucone z komunikatem).
   • Obiekt gry ma JEDEN rysunek wektorowy w GRAFICE OBIEKTÓW. Mapa i interfejs pokazują ten sam
     sprite: mapa przez blit(), interfejs przez drawSprite(ctx, sprite, x, y, k)
     (k = 1 to rozmiar jak na mapie). Nie rysuj obiektów w interfejsie funkcjami wektorowymi wprost.
   • Właściciel zamiast „gracza 0”: kolory przez ownerColor(st, owner), gracz-człowiek to ME.

   • Testy: npm test (katalog tests/, Chromium bez okna przez Playwright). Po zmianie zasad gry dopisz test;
     createNewGame(S, seed) ze stałym seedem daje zawsze ten sam świat.

   WSPÓŁRZĘDNE I JEDNOSTKI
   • Ekran logiczny W×H = 800×600; płótno skaluje się do okna (G.rs).
   • Pole mapy T = 32 px logiczne; świat rysujemy w buforze o połowie rozdzielczości,
     więc 1 piksel grafiki = 2 px logiczne (AP = 16 pikseli grafiki na pole).
   • Obiekt 3×2 (miasto) i 2×2 (kopalnia) stoi na polu wejścia (x, y); pozostałe pola to ob.blocks.

   JAK DODAĆ…
   • Stworzenie: wpis w CREATURES z look.kind ('hum', 'wolf', 'griffin', 'rider', 'centaur',
     'unicorn', 'phoenix', 'ghost', 'dragon'); nowy rodzaj ciała = nowy case w drawCreature().
   • Frakcję: wpis w FACTIONS, TOWN_ART, BUILD_ART (rysunki budowli) i TOWN_LAYOUTS (scena miasta).
   • Budowlę wspólną: wpis w BUILDINGS (slot = miejsce w scenie) i funkcja w BUILD_ART każdej frakcji.
   • Ekran: G.screens.nazwa = { enter(p), draw(ctx), update(dt), onClick(x, y), onBack(),
     onKey(k), onWheel(d), onPointerDown/Move/Up, rightInfo(x, y) → tekst dymka, buttons: [] };
     przejście przez G.go('nazwa', parametry).

   HISTORIA
   Kroki 1–6: menu i nowa gra, generator mapy, bohater i mgła wojny, obiekty na mapie,
   panel boczny, miasta trzech frakcji. Po kroku 6: porządki (usunięty nieużywany renderer
   wektorowy i stare wersje scen miast), kod ułożony według działów, spójna grafika mapy
   i interfejsu. Dalej: rekrutacja (7), ekran bohatera i artefakty (8), bitwy (9–10),
   czary (11), zdobywanie miast (13). Zapis i odczyt gry zrobiony wcześniej, zaraz po porządkach.
   Krok 7: rekrutacja (pule siedlisk, przyrost tygodniowy), armie bohatera i garnizonu, wymiana oddziałów,
   Krok 8: ekran bohatera, poziomy i cechy (atak, obrona, moc, wiedza), 20 artefaktów na mapie i w ekwipunku.
   Krok 9: bitwy taktyczne na heksach (ruch, walka wręcz, strzelanie, kontratak, czekanie, obrona, SI,
   walka automatyczna, ucieczka, porażka). Krok 10: zdolności jednostek (ABILITIES), przeszkody na polu bitwy,
   SI licząca opłacalność wymiany (tradeValue).
   Krok 11: czary (SPELLS): mana z wiedzy, gildie magów, księga czarów, czary w bitwie i na mapie.
   Grafika: postacie z cieniowaniem i pozami (drawHumanoid/horse/griffin/drawDragon…), w bitwie w podwójnej
   rozdzielczości z animacją (battleSprite), efekty bitwy BattleFX (cząsteczki, pociski, pioruny, poświaty).
   Krok 12: testy automatyczne (tests/), bitwa z dowolną armią: potwór, bohater albo miasto (garnizon + bohater
   w mieście), czary bohatera obrońców, pokonany bohater znika, zwycięstwo nad miastem zmienia właściciela;
   surowce, budowa i rekrutacja liczone dla właściciela (playerOf), nie tylko dla gracza-człowieka.
   Krok 13: miasta niezależne w pozostałych miejscach startowych (createNeutralTown: losowa frakcja, garnizon
   rośnie z odległością i trudnością), zdobywanie miast (startTownAssault; puste zajmuje się bez walki),
   mury Fortu/Cytadeli/Zamku dają obrońcom premię do obrony (TOWN_WALL_DEF; od etapu 2 krok 9 tylko szacunek siły SI,
   w bitwie mury stoją na polu: oblężenie z bramą, wieżami i katapultą, setupSiege).
   Krok 14: tawerna (tavernOffer/hireHero: dwóch chętnych na tydzień, HERO_COST, najwyżej MAX_HEROES),
   wielu bohaterów: blokują sobie drogę, kliknięcie własnego wybiera go, wejście na wrogiego = bitwa,
   ruch wszystkich bohaterów w pętli ekranu mapy, przewijana lista w panelu (panelItems, listScroll).
   Krok 15: przeciwnicy komputerowi (GRACZE KOMPUTEROWI: aiTurn po turze człowieka; budowa według AI_BUILD_ORDER,
   dokupowanie surowców na rynku, werbunek, najem, cele z mapy odległości aiReach, próbna walka aiWorthFight,
   rozejm AI_PEACE_DAYS zależny od trudności), koniec gry (gameResult: wygrana po pokonaniu rywali, porażka bez
   miast i bohaterów albo po NO_TOWN_DAYS dniach bez miasta), najlepsze wyniki (recordScore), wybór liczby rywali.
   Po kroku 15 (etap 1): rynek dla gracza (marketLot/trade, okno showMarket; kurs zależy od liczby rynków,
   te same zasady dla SI w buyMissing). Menu w stylu pikselowym.
   Tura przeciwnika na żywo: aiAllTurns (dziś turnsAfter) to generator akcji (kroki, obrona), ekran mapy odtwarza go w updateAi
   (widoczne ruchy z animacją), atak na gracza pyta o walkę (askDefense) i otwiera bitwę z graczem po prawej
   (ekran bitwy: this.me, onDone). doEndTurn() bez opcji (testy) liczy wszystko od razu, z obroną automatyczną.
   Spotkanie bohaterów (showMeeting). Mgła wojny dla SI: reveal(…, owner) odkrywa teren każdemu graczowi,
   aiReach i aiPickTarget widzą tylko odkryte pola, a bez lepszego celu bohater SI idzie na zwiad (cel explore).
   Podział pliku: źródła w src/ (szablon.html + src/js/NN-dział.js, jeden plik na dział), build.js skleja je
   w „Kroniki Królestw.html” (npm run build / watch), a npm test najpierw sprawdza, czy plik jest aktualny.
   Okno dopasowane do ekranu: logiczne okno VW×VH (co najmniej W×H, do VW_MAX×VH_MAX) zamiast stałego 4:3.
   Mapa przygody (fill: true) wypełnia całe okno (layoutAdventure), menu maluje scenę na całą szerokość,
   pozostałe ekrany i okna dialogowe są wyśrodkowane (OX, OY) na tle drawBackdrop / screen.backdrop.
   Krok 6: morale i szczęście (armyMorale, heroLuck; B.morale / B.luck liczone w createBattle). Morale dodatnie
   daje drugi ruch po ataku (nextActive), ujemne wahanie i utratę tury; szczęście podwaja, pech połowi obrażenia (strike).
   Krok 7: umiejętności drugorzędne (SKILLS, h.skills = [{ id, lv }], najwyżej 8, poziomy 1–3). Awans daje wybór
   z dwóch (skillOffer: ulepszenie + nowa), SI wybiera wg AI_SKILL_ORDER. Działanie: skillVal() w ruchu, widzeniu,
   manie, dochodzie, koszcie terenu (baseCost z bohaterem), obrażeniach (damageRoll, spellDamage), morale,
   szczęściu, doświadczeniu i nekromancji (raiseDead po zwycięstwie).
   Grafika po krokach 8–12: portrety bohaterów w pixel arcie (drawHeroPortrait, własny wygląd każdego bohatera
   w HERO_LOOKS), mury oblężenia jako jeden sprite (castleSprite: kurtyna z blankami, brama między basztami,
   okrągłe wieże z gankiem; wyłom to dziura z gruzem), bruk dziedzińca w tle bitwy.
   Etap 2, krok 10: czary 4. i 5. poziomu (deszcz meteorów, modlitwa, wskrzeszenie, implozja, armagedon,
   przyspieszenie armii), gildie IV i V (GUILD_MAX), cele 'livingAlly', 'all' i 'allies' (spellArea z B),
   księga czarów w trzech kolumnach, gdy czarów jest wiele.
   Grafika mapy: ruda jako ciemne bryłki, góry/drzewa/skały ze ściankami (8 wariantów gór), ozdoby na pustych polach.
   Dźwięk: efekty i muzyka syntezowane w Web Audio; później usunięte w całości (słabe brzmienie, koszt na słabym PC).
   Statki: obiekt 'boat' na wodzie, h.boat (passableTile/legOk: w łodzi tylko woda, brzeg jako cel; wysiadka kończy ruch),
   stocznia (buyBoat, shipyardSpot, tylko w mieście nad wodą), darmowe łodzie przy brzegach.
   Nowe frakcje: Twierdza (bagna: gnolle, jaszczuroludzie, ważki, bazyliszki, gorgony, wywerny, hydry) i Inferno (lawa:
   chochliki, gogi, ogary, demony, czarty, ifryty, diabły); klasy beastmaster/witch i demoniac/heretic, portrety, miasta, muzyka.
   Hot-seat i do 8 graczy: 8 miejsc na ekranie nowej gry (settings.slots: człowiek/komputer/wolne, kolor, frakcja),
   ME to numer człowieka przy ekranie (setViewer: jego mgła, kamera, wybrany bohater), kolejka tur turnsAfter
   (komputery po kolei, nowy dzień advanceDay przy końcu listy), zasłona między ludźmi, wieści w skrzynkach graczy
   (tell/takeInbox), obrona innego człowieka przed atakiem komputera, bitwa człowiek na człowieka (obie strony ręcznie),
   zwycięzca = ostatni gracz na placu. Miejsc na miasta: 4/6/8/10 zależnie od mapy (SITE_COUNT).
   Imiona graczy: pole tekstowe askText (prawdziwy <input> nad oknem), slot.name → player.name, playerName.
   Podział oddziału: splitLimit/armySplit, okno showSplit (przycisk „Dziel” albo Shift+klik) w spotkaniu, mieście i u bohatera.
   Wydajność: klatka rysowana tylko w razie potrzeby (screen.fps, G.dirty), kamienne tło i pergamin z pamięci (Layers, drawLayer
   w całych pikselach), mapa bez przeliczania całego obrazu co klatkę (gradeCanvas w kawałkach terenu i kopiach sprite'ów, mgła
   w kawałkach fogChunk, nakładka mapLight), scena menu i efekty miasta ~12–15 klatek/s, jakość grafiki (auto/wysoka/niska, Perf).
   Kawałki terenu: budżet ~10 ms na klatkę (MapRender.get allow, zastępczy placeholder), generowanie wokół widoku z wyprzedzeniem.
   Porządki i trudniejsza mapa: potwory neutralne to też jednostki frakcji (poziomy 1–7, fillNeutrals), siła rośnie
   wykładniczo z odległością od najbliższego startu (MONSTER_POWER, d01) i z trudnością, potwory rosną co tydzień
   (MONSTER_GROW do MONSTER_GROW_MAX). Skarbce BANKS (Krypta, Orcza warownia, Gniazdo gryfów, Leże hydr, Smocza Utopia):
   załoga z kilku oddziałów, łup (lootBank), puste po zwycięstwie; SI też je rozbija. migrateSave naprawia stare zapisy.
   Balans: Kurhan silniejszy, hydra bez regeneracji, bazyliszek bez „bez odwetu”; test balansu frakcji (30–70% wygranych).
   Szlify grafiki: żywa woda (WaterFx: fale po głębi i pulsująca piana, maski wody fragmentów mapy), wyraźniejsze świerki,
   zwęglone drzewa z żarem na lawie, surowce jako bryłki w stylu rudy, tła bitew ze szczegółami terenu (battleDecor).

   PLAN (kolejność ustalona z graczem; krok 13 „warunki zwycięstwa” pominięty)
   1. Dźwięk (zrobione). 2. Nowe frakcje (zrobione: Twierdza i Inferno). 3. Statki (zrobione: stocznia, łodzie). 4. Hot-seat (zrobione: do 8 graczy, zasłona między turami).
   5. Samouczek (wykreślony). 6. Porządki (zrobione: migracja zapisów, test balansu, trudniejsza mapa i skarbce).
   7. Grafika (zrobione: animowana woda, świerki, surowce w stylu rudy, tła bitew zależne od terenu).
   ===================================================================================== */

