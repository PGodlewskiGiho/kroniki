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
     MIASTO: GRAFIKA                 style frakcji, siedliska Przystani, Kniei i Kurhanu, sceny w perspektywie, efekty
     MIASTO: TWIERDZA I INFERNO … LOCH I CYTADELA   palety, siedliska i barwy scen pozostałych frakcji
     MIASTO: TEREN I DROGI SCEN      woda, tarasy, wzgórza, wysokość gruntu, główna droga z mostami, bramy w murze
     MIASTO: SCENY FRAKCJI           jedna ręcznie ułożona scena na frakcję (TOWN_SCENES, townLayout)
     MIASTO: BUDOWLE GŁÓWNE FRAKCJI  ratusz, fort, gildia, karczma, rynek, kuźnia, magazyn: własna architektura każdej frakcji
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
     'unicorn', 'phoenix', 'ghost', 'dragon', 'eye', 'bird' i in.); nowy rodzaj ciała = nowy case w drawCreature().
   • Frakcję: wpis w FACTIONS, TOWN_ART (paleta), BUILD_ART (siedliska w pliku frakcji, budowle główne w MIASTO: BUDOWLE
     GŁÓWNE FRAKCJI — z nich powstaje też ikona miasta na mapie), TOWN_LAYOUTS (rozmiary miejsc i barwy ziemi)
     TOWN_STYLE (woda, tarasy, wzgórza, mury) i scena w TOWN_SCENES (18h): niebo, teren, miejsca budowli, rekwizyty.
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
   Rozwój jak w Heroes 3: specjalności (HERO_SPECS: stwory dw z premią rosnącą z poziomem, surowiec, umiejętność +5%/poz.,
   czar +3%/poz.; specBonus/u.spec w bitwie, ramka na ekranie bohatera i w tawernie), 7 nowych umiejętności (Mądrość = czary
   powyżej 2. poziomu, spellCap; Nawigacja, Artyleria, Pierwsza pomoc, Balistyka, Odporność, Orle oko) i wagi klas przy awansie
   (CLASS_SKILL_PREF, skillWeight). Magowie zaczynają z Mądrością; stare zapisy dostają ją w migrateSave.
   Nowe miejsca na mapie: chata wiedźmy (uczy umiejętności ob.skill), więzienie (freePrisoner: bohater z doświadczeniem,
   awans bez okien gainExp(..., silent)), portale w parach (ob.pair, PORTAL_PAIRS), siedlisko najemników (dwellRefresh/
   dwellMax/dwellHire, okno showDwelling), ołtarz ofiarny (artefakty z plecaka za SACRIFICE_EXP) i wraki na wodzie.
   Użycia 'free' (bez limitu) i 'once' (obiekt znika). Strzał: kary za odległość (SHOT_RANGE) i przeszkody (shotBlocked),
   bez kar machiny i sharpshooter; licznik strzał przy oddziale. Kliknięcie w wieże miasta na mapie: drawnObjectAt.
   Garnizon z bohaterem (h.garrison = id miasta): swapGarrison (przycisk „Zamień”, klawisz Z) wprowadza bohatera z bramy do murów
   (przejmuje wojsko garnizonu) i wyprowadza tego z murów; heroAt go pomija (brama wolna na najem), townHero broni miasta.
   Kronika tygodnia (20b): ogłoszenie astrologów z rysunkiem na początku tygodnia (st.weekNews, p.seenWeek, chronicleIconOpts),
   nowe tygodnie Żniw (+HARVEST drewna i rudy) i Magii (pełna mana), Kronika tawerny (showChronicle: ranking graczy jak Gildia
   Złodziei, rubryki CHRONICLE_ROWS odkrywane liczbą własnych tawern).
   Pixel art efektów: pixLayer/crispLayer (bufor 1/px rozdzielczości, paleta z ditheringiem, 3 stopnie krycia) dla czarów
   w bitwie (BattleFX: warstwa zwykła i świetlna, poświaty jako pierścienie), czarów na mapie, sceny okna wyniku bitwy
   i ekranu końca gry (tło miasta w skali 1,5, piksel = 3 px ekranu); ikony czarów w gildii jako sprite'y.
   Płynność: miasto, menu i bitwa w 60 klatkach (smoothFps, przy niskiej jakości 30), mapa w spoczynku 30; efekty miasta (dym,
   ptaki, śnieg, żar) rysowane prosto na ekranie w pełnej rozdzielczości, bufor sceny z efektami tylko dla okna gildii.
   Szkoły magii (SCHOOLS: Ognia, Powietrza, Wody, Ziemi; umiejętności fireMagic/airMagic/waterMagic/earthMagic): spellCost (zniżka
   SCHOOL_COST), schoolMul (moc SCHOOL_POWER), +poziom rund czarów na oddziały, ekspert = czar na całą armię (massBuff). Nowe czary:
   Tarcza, Klątwa, Przywołanie łodzi, Lodowy pocisk, Fortuna, Fala śmierci, Pierścień mrozu, Tarcza powietrza, Łańcuch piorunów,
   Ognista tarcza, Źródło życia; księga czarów z zakładkami szkół i stronami.
   Wymagania budowli: lista budowania pokazuje też zablokowane (kłódka, „Wymaga: …” z pośrednimi, missingReqs/buildList),
   najechanie zaznacza w scenie miejsce budowli i brakujących budowli, opis mówi, co budowla odblokowuje (unlocksOf).
   Interfejs w pixel arcie: pergamin, kamień (cegły paintBricks), tła przycisków (paintButton, stany n/h/s/d) i duże złote napisy
   malowane w buforze 1:2 (uiLayer + crispLayer, drawUi bez wygładzania); rr ze schodkowymi rogami; rogi i przerywniki z pikseli
   (pixDiamond); napisy i ikony przycisków z twardym cieniem zamiast poświaty.
   Oblężenie: fosa od Cytadeli (MOAT_X przed murem, most w rzędzie bramy; kończy ruch napastnika i rani go o MOAT_DMG), mury
   WALL_HP wg poziomu (Zamek 4), obrońca walczący wręcz czeka za murami (holdWalls), chyba że ma 1,5× przewagi (wypad).
   Karawany (st.caravans): oddziały garnizonu jadą bez bohatera do innego własnego miasta po drodze lądem (caravanRoute,
   CARAVAN_MP dziennie), dołączają do garnizonu, zawracają, gdy cel przepadł; wóz na mapie, okno w mieście (klawisz K).
   Mapa bez szarpnięć: kawałki terenu malują się w tle (MapRender.warm, requestIdleCallback, od najbliższych widoku po całą mapę),
   w klatce tylko zastępczy rysunek; pamięć na całą mapę; mapa w spoczynku 60 klatek; auto-jakość wraca po ~10 s płynnej gry.
   Etap A (wygoda i zasady): panel mapy w zakładkach bohaterowie/miasta, młotek przy mieście (czy dziś budowano); klik na dalekiego
   własnego bohatera = ścieżka i spotkanie po dojściu; szybkie przekazanie armii (giveArmy: zostaje jeden stwór najsłabszego oddziału)
   w spotkaniu i w mieście; werbunek z listy wraca do listy, „Werbuj wszystko” (recruitAll, od najsilniejszych); podgląd kandydata
   z tawerny na ekranie bohatera (previewHero) i najem z podglądu; ucieczka/porażka jak w H3 (retireHero, st.retired: uciekinier od razu
   w swojej tawernie, pokonany po tygodniu u wszystkich, łup artefaktów lootHero), pełna armia tylko dla dwóch kandydatów tygodnia
   (weak/weakArmy); księga czarów (hasBook, buyBook za SPELLBOOK_COST w gildii; wojownicy zaczynają bez niej).
   Czcionka pikselowa: Jersey 10 (OFL, czytelne cyfry) wbudowana przez build.js z src/czcionki; ustawienie Grafika → Czcionka (piksele/klasyczna).
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
   Graal i obeliski (20a, placeGrail w 12): Graal zakopany na wolnym polu lądu (st.grail, found = kto go wykopał), obeliski
   (SITES.obelisk, liczba wg OBELISKS) odsłaniają kawałki mapy zagadki (showPuzzle: wycinek mapy, kawałki z wypustkami,
   od brzegów do krzyżyka). Kop (klawisz D) tylko z pełnym ruchem, dołki w st.holes. Artefakt 'grail' (relikwia, do plecaka)
   wnosi się do własnego miasta: budowla Graala (slot 15, nazwa wg GRAIL_NAMES) daje +5000 złota i +50% przyrostu. Graal
   przechodzi na zwycięzcę bitwy; SI, która zna całą mapę zagadki, kopie i buduje. Starsze zapisy dostają Graala w migrateSave.
   Sceny miast (18h, TOWN_SCENES): zamiast losowego generatora każda frakcja ma jedną, ręcznie ułożoną scenę — Przystań w dolinie
   z rzeką i zamkiem na wzgórzu, Knieja na polanie nad leśnym jeziorem, Kurhan nad przepaścią z kościanym mostem, Twierdza na
   wysepkach mokradła, Inferno w kraterze z jeziorem lawy, Akademia na ośnieżonych tarasach, Loch w grocie ze świecącym jeziorem,
   Cytadela pod stołową górą z oazą i palisadą. Stałe są niebo, teren, miejsca 15 budowli i rekwizyty; ścieżki do drzwi
   i mieszkańców wylicza MIASTO: TEREN. Drogi (roadStyled) „malowane”: falujące brzegi przechodzące w trawę,
   wydeptany środek, bruk z nieregularnych otoczaków (cobbleAt). Sceny odchudzone jak w Heroes 3: bez dróg, placów, przechodniów
   i tabliczek na pustych działkach (co tam stanie, widać po najechaniu myszą); ziemia z nielicznymi szczegółami, lawa Inferno
   w dwóch strumykach do jeziora. Budowle ciasno w rzędach jak w Heroes 3 (atPx: miejsce podane w pikselach kadru), zamek duży
   w głębi; tarasy Akademii mają proste kamienne schody (slab.stairs), chaty Twierdzy stoją na własnych wysepkach (islandsUnder).
   Akademia (śnieg, TER.SNOW): gremliny, gargulce, golemy, magowie, dżiny, nagi (nowy wężowy ogon L.serpent), olbrzymi i tytani;
   klasy Alchemik i Czarodziej, miasto białych wież ze złotymi kopułami i padającym śniegiem (18b), mury i portrety. Pocisk z look.orb
   bez laski to kula (gremlin, tytan). SI bierze z garnizonu tylko to, co zmieści (takeableArmy), więc nie krąży między miastami.
   Loch (skały, TER.ROUGH) i Cytadela (step, TER.SAND), 18d: nowe ciała 'eye' (obserwator) i 'bird' (rok, ptak gromu),
   czworonóg z wings/stinger/mane/horns/stripes/rider (mantykora, behemot, jeździec wargów), cyklop (L.cyclops), tur bez łusek
   (L.plain, barding). Woda 'glow' i 'oasis', rekwizyty glowShroom/stalagmite/acacia/cactus/totem, pogoda 'spores' i 'dust'.
   Koniec bitwy jak w Heroes 3 (22a): zwycięzcy chwilę wiwatują, potem okno wyniku nad polem bitwy (showBattleReport): portrety
   obu stron z podpisem zwycięzca/pokonany, ruchomy obraz (świt i bohater ze sztandarami, burza z krukami i złamanym sztandarem,
   odjazd o zmierzchu), opis kroniki, straty obu stron z ikonami stworów (res.sides). To samo okno po walce automatycznej i obronie.
   Koniec gry (showGameEnd): scena miasta gracza z fajerwerkami albo w dymie i szarości, wstęga z napisem, kronika królestwa
   i ranga od Chłopa do Czarnego smoka.
   Pory roku (SEASONS, seasonIdx: miesiąc 1 wiosna, 2 lato, 3 jesień, 4 zima, potem od nowa): lato +10% ruchu, jesień +1 drewna
   i rudy z miasta, zima −20% ruchu. Wygląd: seasonLand (barwy terenu), lód przy brzegach, drzewa i ozdoby wg SEASON_DRAW
   (obstacleSprite/decorSprite z porą w kluczu), MapRender.setSeason czyści kawałki, drawSeasonFx (śnieg, liście).
   Budowle główne każdej frakcji od nowa (18e): Przystań — ratusz z muru pruskiego z dzwonnicą, magistrat i kapitol, zamek z fosą,
   zwodzonym mostem i bramą między basztami, gotycka gildia, sukiennice, wiatrak; Knieja — drzewo z pomostami, żywopłoty
   z bramą z drzew, krąg druidów; Kurhan — kopiec z dolmenem i czaszką, brama-czaszka, obeliski; Twierdza — dom na palach z dachem
   siodłowym, piramidy schodkowe, chata na kurzych łapach, pływający targ; Inferno — fasada-twarz demona, rogi, wulkan, zigurat
   ognia; Akademia — cebulaste kopuły i minarety, kryształowe pylony, latająca cytadela i biblioteka; Loch — fasady wykute
   w skale, twarz władcy, geoda, wózki kopalniane; Cytadela — jurta z czaszką bestii, cyklopowe mury, kamienny łeb, namiot
   szamana. Ikona miasta na mapie to pomniejszony fort frakcji (drawTownMap), flagi na masztach z rysunku (townFlagPoints).
   Gildia magów (showGuildView, 23): wnętrze w stylu frakcji (GUILD_LOOK: kształt okna, półki, drobiazgi), w oknie żywy widok
   na miasto (bufor sceny ekranu miasta), półki poziomów V–I ze zwojami czarów, opis czaru po kliknięciu, klawisz G.
   Kraj frakcji w mieście (18f, TOWN_BIOME): własna ziemia (łąka z polami, mech z liśćmi, spękana martwa ziemia, bagno z kałużami,
   bazalt ze szczelinami lawy, zaspy, dno groty z kryształami, wydmy), horyzont (dęby, puszcza, martwe drzewa, wierzby, iglice,
   świerki, stalagmity, góry stołowe), tylko pasujące krajobrazy, Loch pod sklepieniem groty (caveSky, caveFrame). Drogi w stylu
   frakcji (ROAD_LOOK: bruk, leśna ścieżka, płyty z czaszkami, pomosty na palach, bazalt z żarem, lód, piach z koleinami),
   ścieżka od drzwi każdej budowli do drogi (townPaths: bez rzek i przepaści, schody tylko na krawędzi tarasu, kładki nad wodą,
   po lodzie Akademii bez kładek). Mieszkańcy frakcji chodzą od bramy do budowli i znikają w drzwiach (townFolk, drawDweller):
   chłopi i straż, elfy i krasnoludy, szkielety i zombie, jaszczuroludzie i gnolle, diabełki i demony, magowie z gremlinami
   i golemem, troglodyci z czarnoksiężnikami i minotaurem, gobliny, orkowie i wilki.
   Budowle specjalne frakcji (FACTION_SPECIAL, 15. miejsce w mieście, rysunki w 18g): Stajnie (+400 ruchu do końca tygodnia),
   Skarbiec krasnoludów (+10% złota co tydzień, do 2500), Wzmacniacz nekromancji (+10% wskrzeszeń), Klatka wodzów (+1 obrony raz
   na bohatera), Brama piekieł (przejście między miastami Inferna), Biblioteka (czar więcej na każdym poziomie gildii), Wir many
   (podwójna mana raz w tygodniu), Sala Walhalli (+1 ataku raz na bohatera). Działają przy wejściu do miasta i na początku dnia.
   Cechy frakcji (FACTION_TRAITS, heroFaction z klasy bohatera): morale Przystani, szczęście Kniei, nekromancja Kurhanu,
   bagna Twierdzy, siarka Inferna, zima i śnieg Akademii, wzrok Lochu, przyrost Cytadeli; opisy w dymkach (nowa gra, miasto, bohater).
   Słaby laptop: menu i miasto bez pixelQuantize co klatkę (paleta wypalona w nieruchomym tle), płótno bez przezroczystości
   (alpha: false), bufory mapy, mgły i sprite'ów bez willReadFrequently (przy karcie graficznej zostają na niej), niska jakość
   = pół piksela płótna na piksel ekranu i bez fal na wodzie, Perf schodzi do 0,5 także przy spóźnionych klatkach, licznik pod F.
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
   Etap B1 (grafika): strzały z łuku lecą szybko po parabolicznym torze ze smugą (projPos), ikony umiejętności
   (drawSkillIcon/skillIcon: ekran bohatera, okno awansu przez Button.lead, chata wiedźmy), bohater na polu bitwy
   (heroBattleSprite w narożniku, heroSpot; czar wylatuje z jego ręki), mur z cegieł z wyszczerbieniami, pęknięciami, mchem
   i wyblakłymi malowidłami (paintBricks), obraz frakcji na zakrytych kawałkach mapy zagadki (puzzleCover), pogoda na mapie
   (weatherOf: losowana codziennie wg pory roku, drawWeather: deszcz, burza, mgła, śnieżyca, cienie chmur; wyłącznik w ustawieniach).
   Etap B2: drobny piksel w całej grafice (PIX = px logicznych na piksel grafiki: PIX_DEFAULT 1,8, przy niskiej jakości 2; PXD = gęstość
   względem dawnej grafiki; sprite ma s.u, setPixelSize czyści pamięci obrazów przez PIX_CLEAR). Teren mapy, tło bitwy, sceny
   miast, interfejs i menu w drobnych pikselach; jednostki z detalami (twarz, szwy, nity, uzda). Portrety 72×72 (siatka 36,
   pixPainter z K, płynne cieniowanie, portraitFinish: światło konturowe, winieta). Kursory gry (11b-kursory.js: setCursor,
   adventureCursor, battleCursor; G.wantCursor ustawiany co klatkę). Przybliżenie mapy kółkiem i klawiszami +/− (ZOOM, ZOOMS,
   viewW/viewH, setZoom; świat rysowany w widoku wirtualnym i skalowany; fale liczone w grubych pikselach).
   Etap C, krok 17: magia frakcji (FACTION_MAGIC: najwyższy poziom gildii i wagi szkół przy losowaniu czarów, bAllowed,
   magicText w opisie frakcji i w gildii). Przystań IV, Twierdza i Cytadela III, reszta V.
   Krok 25: grafiki jednostek z modeli 3D. Narzędzie tools/grafika3d (three.js w Chromium z Playwrighta, nie trafia do gry):
   modele.js (render: światło, cienie, odbicia, AO, kontur wewnętrzny, pixel art; tekstury rysowane kodem; bryły),
   postacie.js (humanoid z cech look), zwierzeta.js (czworonogi, skrzydlate, gady, potwory), podglad.js (galeria PNG),
   wypal.js (npm run grafika: arkusze PNG w src/grafika/, opis klatek w jednostki.json i bohaterowie.json). build.js wbudowuje
   je jako UNIT_ART i HERO_ART; 11c-grafika-jednostek.js podaje klatki (battleSprite, creatureSprite, drawCreatureIcon,
   heroBattleSprite z podmianą koloru-klucza na barwę gracza). Piksel jednostek 1,3 px (bitwa), 1,8 px (mapa). Machiny wojenne
   (balista, namiot medyka, wóz z amunicją, katapulta, strzelec na wieży) mają modele w maszyny.js. Bez arkusza zostaje
   dawny rysunek wektorowy (battleSprite2D, creatureSprite2D, heroBattleSprite2D).
   Krok 18: po 2 nowych bohaterów w każdym zamku; portrety bohaterów z tools/portrety-ai (Stable Diffusion + wzorce stylu
   dla klasy) jako HERO_PORTRAITS. Krok 18b: 13 nowych stworów neutralnych (chłop, niziołek, rozbójnik, mumia, koczownik,
   strzelec wyborowy, złoty i diamentowy golem, zaklinacz, smoki: baśniowy, rdzawy, kryształowy, lazurowy); potwór na mapie
   wybierany tak, by nie był silniejszy niż okolica. Smoki z różnymi sylwetkami (look.form: heavy, crystal, serpent, fae).
   Krok 19: 36 nowych artefaktów (w tym części kompletów) i 6 relikwii (ARTIFACTS z parts): komplet części założony naraz
   składa się w relikwię (assembleRelic; człowiek przyciskiem na ekranie bohatera, komputer sam), która zajmuje miejsca części
   (h.locked) i daje więcej niż ich suma; rozkładanie (disassembleRelic), relikwia kupiecka daje też surowce (bonus.res).
   ===================================================================================== */

