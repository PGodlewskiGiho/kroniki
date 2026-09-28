// ==================== DANE: CZARY =======================================================
// kind: 'battle' (w bitwie, raz na rundę) albo 'adv' (na mapie). target: 'enemy', 'ally', 'undeadAlly', 'livingAlly' (także poległy),
// 'hex' (pole i sąsiedzi), 'all' (wszystkie oddziały na polu bitwy), 'allies' (wszyscy swoi), 'none' (czar mapy).
// sp = moc czarów bohatera; efekty liczą funkcje w polach dmg/heal/rounds, opis w desc(sp).
const SPELL_ROUNDS = sp => Math.max(1, sp + 1);
// Szkoły magii jak w Heroes 3: umiejętność szkoły (Magia Ognia, Powietrza, Wody, Ziemi) obniża koszt czarów tej szkoły,
// wzmacnia obrażenia i leczenie, wydłuża czary na oddziały, a na poziomie eksperckim czar na jeden oddział działa na całą armię.
const SCHOOLS = {
  fire: { name: 'Ognia', tab: 'Ogień', skill: 'fireMagic', col: '#e8602a' }, air: { name: 'Powietrza', tab: 'Powietrze', skill: 'airMagic', col: '#8ac8ff' },
  water: { name: 'Wody', tab: 'Woda', skill: 'waterMagic', col: '#4a9ae0' }, earth: { name: 'Ziemi', tab: 'Ziemia', skill: 'earthMagic', col: '#a8864a' },
};
// Tarcza i Tarcza powietrza: o tyle % mniej obrażeń; Ognista tarcza: tyle % obrażeń wraca do napastnika; Łańcuch: przeskoki
const SHIELD_CUT = 30, FIRE_SHIELD = 20, CHAIN_JUMPS = 3;
const SPELLS = {
  magicArrow: { name: 'Magiczna strzała', school: 'air', level: 1, cost: 5, kind: 'battle', target: 'enemy', col: '#8ac0ff', dmg: sp => 10 + 10 * sp, desc: sp => `${10 + 10 * sp} obrażeń jednemu wrogowi` },
  bless: { name: 'Błogosławieństwo', school: 'water', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#ffe08a', buff: 'bless', desc: sp => `sojusznik zadaje najwyższe obrażenia przez ${SPELL_ROUNDS(sp)} rund` },
  stoneSkin: { name: 'Kamienna skóra', school: 'earth', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#b8a888', buff: 'stoneSkin', desc: sp => `+3 do obrony sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  haste: { name: 'Przyspieszenie', school: 'air', level: 1, cost: 6, kind: 'battle', target: 'ally', col: '#a8f0ff', buff: 'haste', desc: sp => `+3 do szybkości sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  cure: { name: 'Uzdrowienie', school: 'water', level: 1, cost: 6, kind: 'battle', target: 'ally', col: '#8af07a', heal: sp => 10 + 5 * sp, desc: sp => `leczy ${10 + 5 * sp} życia i zdejmuje złe czary` },
  slow: { name: 'Spowolnienie', school: 'earth', level: 1, cost: 6, kind: 'battle', target: 'enemy', col: '#9a8ac8', buff: 'slow', desc: sp => `−3 do szybkości wroga przez ${SPELL_ROUNDS(sp)} rund` },
  shield: { name: 'Tarcza', school: 'earth', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#d0b070', buff: 'shield', desc: sp => `sojusznik otrzymuje o ${SHIELD_CUT}% mniej obrażeń w walce wręcz przez ${SPELL_ROUNDS(sp)} rund` },
  eagleEye: { name: 'Sokole oko', school: 'air', level: 1, cost: 4, kind: 'adv', target: 'none', col: '#f0c040', desc: sp => `odsłania mapę w promieniu ${5 + sp} pól wokół bohatera` },
  summonBoat: { name: 'Przywołanie łodzi', school: 'water', level: 1, cost: 7, kind: 'adv', target: 'none', col: '#6ab0e8', desc: () => 'łódź pojawia się na wodzie tuż przy bohaterze (bohater musi stać na brzegu)' },
  lightningBolt: { name: 'Błyskawica', school: 'air', level: 2, cost: 10, kind: 'battle', target: 'enemy', col: '#c8e0ff', dmg: sp => 25 + 20 * sp, desc: sp => `${25 + 20 * sp} obrażeń jednemu wrogowi` },
  iceBolt: { name: 'Lodowy pocisk', school: 'water', level: 2, cost: 8, kind: 'battle', target: 'enemy', col: '#9ad8ff', dmg: sp => 20 + 20 * sp, desc: sp => `${20 + 20 * sp} obrażeń jednemu wrogowi` },
  weakness: { name: 'Osłabienie', school: 'water', level: 2, cost: 8, kind: 'battle', target: 'enemy', col: '#a8a878', buff: 'weakness', desc: sp => `−3 do ataku wroga przez ${SPELL_ROUNDS(sp)} rund` },
  bloodlust: { name: 'Żądza krwi', school: 'fire', level: 2, cost: 7, kind: 'battle', target: 'ally', col: '#ff6a5a', buff: 'bloodlust', desc: sp => `+3 do ataku sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  fortune: { name: 'Fortuna', school: 'air', level: 2, cost: 7, kind: 'battle', target: 'ally', col: '#8af0c0', buff: 'fortune', desc: sp => `+2 do szczęścia sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  deathRipple: { name: 'Fala śmierci', school: 'earth', level: 2, cost: 10, kind: 'battle', target: 'all', spare: 'undead', col: '#8a9a6a', dmg: sp => 5 + 5 * sp, desc: sp => `${5 + 5 * sp} obrażeń każdemu żywemu oddziałowi na polu bitwy (także swoim), nieumarłych oszczędza` },
  fireball: { name: 'Kula ognia', school: 'fire', level: 3, cost: 15, kind: 'battle', target: 'hex', col: '#ff8a2a', dmg: sp => 15 + 10 * sp, desc: sp => `${15 + 10 * sp} obrażeń na polu i wokół niego (także swoim!)` },
  frostRing: { name: 'Pierścień mrozu', school: 'water', level: 3, cost: 12, kind: 'battle', target: 'ring', col: '#bfe8ff', dmg: sp => 15 + 10 * sp, desc: sp => `${15 + 10 * sp} obrażeń na polach wokół wskazanego (środek bezpieczny)` },
  curse: { name: 'Klątwa', school: 'fire', level: 1, cost: 6, kind: 'battle', target: 'enemy', col: '#b04a8a', buff: 'curse', desc: sp => `wróg zadaje najniższe obrażenia przez ${SPELL_ROUNDS(sp)} rund` },
  airShield: { name: 'Tarcza powietrza', school: 'air', level: 3, cost: 12, kind: 'battle', target: 'ally', col: '#d0f0ff', buff: 'airShield', desc: sp => `sojusznik otrzymuje o ${SHIELD_CUT}% mniej obrażeń od strzał przez ${SPELL_ROUNDS(sp)} rund` },
  animateDead: { name: 'Ożywienie umarłych', school: 'earth', level: 3, cost: 15, kind: 'battle', target: 'undeadAlly', col: '#a6f0a8', heal: sp => 30 + 50 * sp, raise: true, desc: sp => `przywraca ${30 + 50 * sp} życia nieumarłym, także poległym w tej bitwie` },
  townPortal: { name: 'Powrót do miasta', school: 'earth', level: 3, cost: 16, kind: 'adv', target: 'none', col: '#c8a0ff', desc: () => 'przenosi bohatera do najbliższego własnego miasta (kosztuje 300 punktów ruchu)' },
  meteorShower: { name: 'Deszcz meteorów', school: 'earth', level: 4, cost: 16, kind: 'battle', target: 'hex', col: '#ff6a3a', dmg: sp => 25 + 25 * sp, desc: sp => `${25 + 25 * sp} obrażeń na polu i wokół niego (także swoim!)` },
  chainLightning: { name: 'Łańcuch piorunów', school: 'air', level: 4, cost: 24, kind: 'battle', target: 'enemy', chain: CHAIN_JUMPS, col: '#e0ecff', dmg: sp => 25 + 40 * sp,
    desc: sp => `${25 + 40 * sp} obrażeń wrogowi, potem przeskakuje na ${CHAIN_JUMPS} najbliższe oddziały (każdy za połowę poprzednich; także swoje!)` },
  fireShield: { name: 'Ognista tarcza', school: 'fire', level: 4, cost: 16, kind: 'battle', target: 'ally', col: '#ff9a3a', buff: 'fireShield', desc: sp => `kto uderzy sojusznika wręcz, sam dostaje ${FIRE_SHIELD}% zadanych obrażeń (${SPELL_ROUNDS(sp)} rund)` },
  prayer: { name: 'Modlitwa', school: 'water', level: 4, cost: 16, kind: 'battle', target: 'ally', col: '#fff0b0', buff: 'prayer', desc: sp => `+2 do ataku, obrony i szybkości sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  resurrection: { name: 'Wskrzeszenie', school: 'earth', level: 4, cost: 20, kind: 'battle', target: 'livingAlly', col: '#fff8d0', heal: sp => 40 + 20 * sp, raise: true, desc: sp => `przywraca ${40 + 20 * sp} życia żywym sojusznikom, także poległym w tej bitwie` },
  implosion: { name: 'Implozja', school: 'earth', level: 5, cost: 30, kind: 'battle', target: 'enemy', col: '#c05aff', dmg: sp => 100 + 75 * sp, desc: sp => `${100 + 75 * sp} obrażeń jednemu wrogowi` },
  armageddon: { name: 'Armagedon', school: 'fire', level: 5, cost: 24, kind: 'battle', target: 'all', col: '#ff4a1a', dmg: sp => 30 + 50 * sp, desc: sp => `${30 + 50 * sp} obrażeń każdemu oddziałowi na polu bitwy, także swoim` },
  massHaste: { name: 'Przyspieszenie armii', school: 'air', level: 5, cost: 20, kind: 'battle', target: 'allies', col: '#a8f0ff', buff: 'haste', desc: sp => `+3 do szybkości wszystkich sojuszników przez ${SPELL_ROUNDS(sp)} rund` },
  massCure: { name: 'Źródło życia', school: 'water', level: 5, cost: 22, kind: 'battle', target: 'allies', col: '#7ae8c8', heal: sp => 20 + 15 * sp, desc: sp => `leczy ${20 + 15 * sp} życia wszystkim sojusznikom i zdejmuje z nich złe czary` },
};
const BUFF_NAMES = { bless: 'błogosławieństwo', stoneSkin: 'kamienna skóra', haste: 'przyspieszenie', slow: 'spowolnienie', weakness: 'osłabienie', bloodlust: 'żądza krwi', prayer: 'modlitwa',
  shield: 'tarcza', fortune: 'fortuna', curse: 'klątwa', airShield: 'tarcza powietrza', fireShield: 'ognista tarcza' };
const BAD_BUFFS = ['slow', 'weakness', 'curse'];
// Ile czarów danego poziomu oferuje gildia
const GUILD_OFFER = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 1 };
const GUILD_MAX = 5;
// Czar startowy klas magicznych
const CLASS_SPELLS = { cleric: ['bless'], druid: ['cure'], necro: ['magicArrow'], witch: ['slow'], heretic: ['magicArrow'], alchemist: ['stoneSkin'], wizard: ['haste'], warlock: ['magicArrow'], battleMage: ['bless'] };


// ==================== DANE: OBIEKTY MAPY =================================================
// Miejsca na mapie (obiekt type: 'site', kind): bohater wchodzi na pole i dostaje nagrodę; obiekt zostaje.
// use: 'hero' raz na bohatera, 'day' raz dziennie na bohatera, 'heroWeek' raz w tygodniu na bohatera,
// 'week' raz w tygodniu dla całego świata (plon zbiera pierwszy), 'player' raz na gracza (potem bez skutku),
// 'free' bez limitu (skutek zależy od stanu obiektu: portal, siedlisko, ołtarz), 'once' jeden raz, potem obiekt znika.
// per = jeden obiekt na tyle pól mapy (co najmniej jeden), guard = pilnuje go potwór, ai = wartość celu dla SI.
const SITES = {
  shrine: { name: 'Kapliczka magii', use: 'hero', per: 700, ai: 1500, desc: 'uczy czaru' },
  well: { name: 'Studnia', use: 'day', per: 900, ai: 400, desc: 'odnawia całą manę bohatera (raz dziennie)' },
  windmill: { name: 'Wiatrak', use: 'week', per: 1100, ai: 1200, desc: 'co tydzień 3–6 jednostek rzadkiego surowca dla pierwszego gościa' },
  waterMill: { name: 'Młyn wodny', use: 'week', per: 1100, ai: 1000, desc: 'co tydzień 1000 złota dla pierwszego gościa' },
  camp: { name: 'Obóz najemników', use: 'hero', per: 1600, ai: 3000, stat: 'att', guard: true, desc: '+1 do ataku bohatera' },
  post: { name: 'Posterunek rycerzy', use: 'hero', per: 1600, ai: 3000, stat: 'def', guard: true, desc: '+1 do obrony bohatera' },
  altar: { name: 'Ołtarz mocy', use: 'hero', per: 1600, ai: 2500, stat: 'sp', guard: true, desc: '+1 do mocy czarów bohatera' },
  library: { name: 'Stara biblioteka', use: 'hero', per: 1600, ai: 2500, stat: 'kn', guard: true, desc: '+1 do wiedzy bohatera' },
  stone: { name: 'Kamień wiedzy', use: 'hero', per: 1400, ai: 2500, guard: true, desc: '+1000 doświadczenia' },
  temple: { name: 'Świątynia', use: 'day', per: 1400, ai: 300, desc: '+1 do morale armii do końca następnej bitwy' },
  fountain: { name: 'Fontanna szczęścia', use: 'day', per: 1400, ai: 300, desc: '+1 do szczęścia do końca następnej bitwy' },
  stables: { name: 'Stajnie', use: 'heroWeek', per: 1400, ai: 700, desc: '+400 punktów ruchu na dziś (raz w tygodniu)' },
  lookout: { name: 'Wieża obserwacyjna', use: 'player', per: 1600, ai: 500, desc: 'odsłania okolicę w promieniu 12 pól' },
  obelisk: { name: 'Obelisk', use: 'player', per: 0, ai: 1800, desc: 'odsłania fragment mapy zagadki, która prowadzi do Graala' },
  witchHut: { name: 'Chata wiedźmy', use: 'hero', per: 1500, ai: 2200, desc: 'uczy umiejętności' },
  prison: { name: 'Więzienie', use: 'once', per: 3500, ai: 5000, guard: true, desc: 'uwolniony bohater z doświadczeniem przyłącza się do ciebie' },
  dwelling: { name: 'Siedlisko najemników', use: 'free', per: 1500, ai: 1500, desc: 'co tydzień przybywają stwory do werbunku' },
  sacrifice: { name: 'Ołtarz ofiarny', use: 'free', per: 2500, ai: 0, desc: 'artefakty z plecaka zamienia na doświadczenie' },
  portal: { name: 'Portal', use: 'free', per: 0, ai: 0, desc: 'przenosi bohatera do drugiego portalu z pary' },
  wreck: { name: 'Wrak statku', use: 'once', per: 0, ai: 1600, desc: 'zatopiony ładunek: złoto, czasem artefakt (dostępny łodzią)' },
};
// Nowe miejsca: portale w parach (PORTAL_PAIRS wg rozmiaru mapy), wraki na wodzie (jeden na WRECK_PER pól wody),
// siedlisko: tygodniowy przyrost stworów (DWELL_WEEKS tygodni zapasu), ołtarz: doświadczenie za artefakt wg rzadkości.
const PORTAL_PAIRS = { S: 1, M: 1, L: 2, XL: 3 }, WRECK_PER = 700, DWELL_WEEKS = 3;
const SACRIFICE_EXP = { treasure: 800, minor: 2000, major: 4500 };
// Graal (jak w Heroes 3): zakopany na mapie; obeliski odsłaniają kolejne kawałki mapy zagadki (PUZZLE_COLS × PUZZLE_ROWS
// kawałków, wycinek PUZZLE_W × PUZZLE_H pól wokół Graala). Kopać można z pełnymi punktami ruchu (zużywa wszystkie).
// Bohater z Graalem wchodzi do własnego miasta i buduje tam budowlę Graala: +GRAIL_GOLD złota dziennie i +50% przyrostu.
const OBELISKS = { S: 3, M: 5, L: 7, XL: 9 }, GRAIL_GOLD = 5000, GRAIL_GROWTH = 0.5;
const PUZZLE_COLS = 8, PUZZLE_ROWS = 6, PUZZLE_W = 16, PUZZLE_H = 12;
const SITE_EXP = 1000, SITE_MP = 400, LOOKOUT_R = 12;
// Skarbce (obiekt type: 'bank', kind): silna załoga z kilku oddziałów, po zwycięstwie jednorazowy łup, potem obiekt stoi pusty.
// guards: [stwór, liczba] (liczby rosną z poziomem trudności), loot: surowce, arts: artefakty [rzadkość, ile], units: stwory dołączają do armii.
// per = jeden na tyle pól mapy, min = najmniej na każdej mapie, dd = najmniejsza odległość od startu (0–1, jak siła potworów).
const BANKS = {
  crypt: { name: 'Krypta', per: 1300, min: 1, dd: 0.15, guards: [['skeleton', 24], ['ghoul', 12], ['wraith', 5]],
    loot: { gold: 2500 }, arts: [['treasure', 1]], desc: 'nieumarli strzegą grobowych skarbów' },
  orcFort: { name: 'Orcza warownia', per: 1900, min: 1, dd: 0.25, guards: [['orc', 22], ['troll', 5], ['ogre', 4]],
    loot: { gold: 4000, wood: 10, ore: 10 }, desc: 'orkowie i trolle pilnują łupów z wypraw' },
  griffinNest: { name: 'Gniazdo gryfów', per: 2600, min: 0, dd: 0.35, guards: [['griffin', 22], ['royalGriffin', 10]],
    loot: { gold: 3000 }, units: ['champion', 3], desc: 'gryfy bronią gniazd; w podziemiach czekają uwięzieni czempioni' },
  hydraLair: { name: 'Leże hydr', per: 3600, min: 0, dd: 0.5, guards: [['hydra', 5], ['basilisk', 12], ['gorgon', 6]],
    loot: { gold: 8000, mercury: 5, sulfur: 5, crystal: 5, gems: 5 }, arts: [['minor', 1]], desc: 'hydry z bagien strzegą zatopionych skarbów' },
  dragonUtopia: { name: 'Smocza Utopia', per: 6000, min: 1, dd: 0.6, guards: [['emeraldDragon', 4], ['jadeDragon', 2], ['ghostWyvern', 3], ['archDevil', 2], ['chaosHydra', 1]],
    loot: { gold: 20000 }, arts: [['major', 2], ['minor', 1]], desc: 'legowisko smoków: ogromne skarby dla najsilniejszych armii' },
};
// Siła potworów na mapie tuż przy starcie gracza (liczebność = siła / wartość stwora), rośnie z odległością (placeObjects)
const MONSTER_POWER = 700;
// Potwory na mapie rosną co tydzień o tyle (część ułamkowa w górę), do MONSTER_GROW_MAX razy stanu początkowego
const MONSTER_GROW = 0.08, MONSTER_GROW_MAX = 3;
const bankGuards = (kind, diff) => BANKS[kind].guards.map(([cid, n]) => [cid, Math.max(1, Math.round(n * (0.6 + 0.4 * DIFFICULTIES[diff].rating / 100)))]);
