// ==================== DANE: ARTEFAKTY I ROZWÓJ BOHATERA ==================================
// Cechy podstawowe: att (atak), def (obrona), sp (moc czarów), kn (wiedza). Moc i wiedza zadziałają z czarami.
const PRIMARY = [
  { id: 'att', name: 'Atak', gen: 'ataku' }, { id: 'def', name: 'Obrona', gen: 'obrony' },
  { id: 'sp', name: 'Moc czarów', gen: 'mocy czarów' }, { id: 'kn', name: 'Wiedza', gen: 'wiedzy' },
];
// Cechy startowe i szanse (w %) na wzrost danej cechy przy awansie, osobno dla każdej klasy
const CLASS_GROWTH = {
  knight: { base: [2, 2, 1, 1], grow: [35, 45, 10, 10] }, cleric: { base: [1, 0, 2, 2], grow: [20, 15, 30, 35] },
  ranger: { base: [1, 3, 1, 1], grow: [30, 45, 10, 15] }, druid: { base: [0, 2, 1, 2], grow: [10, 20, 35, 35] },
  deathKnight: { base: [1, 2, 2, 1], grow: [30, 25, 25, 20] }, necro: { base: [1, 0, 2, 2], grow: [15, 15, 35, 35] },
  beastmaster: { base: [0, 4, 1, 1], grow: [30, 50, 10, 10] }, witch: { base: [0, 1, 2, 2], grow: [5, 15, 40, 40] },
  demoniac: { base: [2, 2, 1, 1], grow: [40, 35, 15, 10] }, heretic: { base: [1, 1, 2, 1], grow: [15, 15, 40, 30] },
  alchemist: { base: [1, 1, 2, 2], grow: [30, 30, 20, 20] }, wizard: { base: [0, 1, 2, 2], grow: [10, 20, 40, 30] },
  overlord: { base: [2, 2, 1, 1], grow: [35, 35, 15, 15] }, warlock: { base: [0, 0, 3, 2], grow: [10, 10, 50, 30] },
  barbarian: { base: [4, 0, 1, 1], grow: [55, 35, 5, 5] }, battleMage: { base: [2, 1, 1, 1], grow: [30, 20, 25, 25] },
};
// Umiejętności drugorzędne (jak w oryginale): bohater ma ich najwyżej MAX_SKILLS, każdą na poziomie 1–3.
// v: wartość na poziomach 1–3 (działanie w ZASADY GRY i BITWA: ZASADY), desc: opis dla wartości.
// Szkoła magii na poziomie v (1–3): koszt −SCHOOL_COST[v]%, obrażenia i leczenie +SCHOOL_POWER[v]%, czary na oddziały +v rund,
// eksperckie: czar na jeden oddział działa na wszystkie oddziały tej strony (jak w Heroes 3)
const SCHOOL_COST = [0, 15, 25, 35], SCHOOL_POWER = [0, 10, 20, 30];
const schoolDesc = v => `czary szkoły tańsze o ${SCHOOL_COST[v]}%, mocniejsze o ${SCHOOL_POWER[v]}%, dłuższe o ${v} ${v === 1 ? 'rundę' : 'rundy'}${v >= 3 ? '; czary na jeden oddział działają na całą armię' : ''}`;
const MAX_SKILLS = 8, SKILL_LEVELS = ['', 'podstawowe', 'zaawansowane', 'eksperckie'];
const SKILLS = {
  leadership: { name: 'Przywództwo', v: [1, 2, 3], desc: v => `+${v} do morale armii; potwory chętniej dołączają i biorą mniej złota` },
  luck: { name: 'Szczęście', v: [1, 2, 3], desc: v => `+${v} do szczęścia armii` },
  offense: { name: 'Atak', v: [10, 20, 30], desc: v => `+${v}% obrażeń w walce wręcz` },
  archery: { name: 'Łucznictwo', v: [10, 25, 50], desc: v => `+${v}% obrażeń strzelców` },
  armorer: { name: 'Zbroja', v: [5, 10, 15], desc: v => `armia otrzymuje o ${v}% mniej obrażeń` },
  logistics: { name: 'Logistyka', v: [10, 20, 30], desc: v => `+${v}% punktów ruchu` },
  pathfinding: { name: 'Znajdowanie drogi', v: [25, 50, 100], desc: v => `trudny teren spowalnia o ${v}% mniej` },
  scouting: { name: 'Zwiad', v: [1, 2, 3], desc: v => `+${v} do zasięgu widzenia` },
  sorcery: { name: 'Czarnoksięstwo', v: [10, 20, 30], desc: v => `+${v}% obrażeń od czarów` },
  intelligence: { name: 'Inteligencja', v: [25, 50, 100], desc: v => `+${v}% maksymalnej many` },
  mysticism: { name: 'Mistycyzm', v: [2, 3, 4], desc: v => `+${v} many dziennie` },
  estates: { name: 'Majątek', v: [125, 250, 500], desc: v => `+${v} złota dziennie` },
  learning: { name: 'Nauka', v: [5, 10, 15], desc: v => `+${v}% doświadczenia` },
  necromancy: { name: 'Nekromancja', v: [10, 20, 30], desc: v => `po zwycięstwie z ${v}% życia poległych żywych wrogów powstają kościotrupy` },
  wisdom: { name: 'Mądrość', v: [3, 4, 5], desc: v => `pozwala poznać czary do ${v}. poziomu (bez niej tylko do 2.)` },
  navigation: { name: 'Nawigacja', v: [50, 100, 150], desc: v => `+${v}% ruchu na wodzie` },
  artillery: { name: 'Artyleria', v: [50, 75, 100], desc: v => `balista zadaje o ${v}% więcej obrażeń` },
  firstAid: { name: 'Pierwsza pomoc', v: [50, 75, 100], desc: v => `namiot medyka leczy do ${v} punktów życia` },
  ballistics: { name: 'Balistyka', v: [85, 95, 100], desc: v => `katapulta trafia w mury i wieże w ${v}% strzałów${v > 85 ? ' i strzela dwa razy na rundę' : ''}` },
  resistance: { name: 'Odporność', v: [5, 10, 20], desc: v => `${v}% szans, że czar wroga nie zadziała na oddział` },
  fireMagic: { name: 'Magia Ognia', v: [1, 2, 3], school: 'fire', desc: v => schoolDesc(v) },
  airMagic: { name: 'Magia Powietrza', v: [1, 2, 3], school: 'air', desc: v => schoolDesc(v) },
  waterMagic: { name: 'Magia Wody', v: [1, 2, 3], school: 'water', desc: v => schoolDesc(v) },
  earthMagic: { name: 'Magia Ziemi', v: [1, 2, 3], school: 'earth', desc: v => schoolDesc(v) },
  eagleSight: { name: 'Orle oko', v: [40, 50, 60], desc: v => `${v}% szans na naukę czaru rzuconego przez wroga (do ${v / 10 - 2}. poziomu)` },
  tactics: { name: 'Taktyka', v: [1, 2, 3], desc: v => `w dwóch pierwszych rundach bitwy twoje oddziały mają +${v} do szybkości, ataku i obrony (Taktyka wroga to znosi)` },
  diplomacy: { name: 'Dyplomacja', v: [1, 2, 3], desc: v => `potwory dużo chętniej dołączają do armii i biorą o ${v * 20}% mniej złota${v >= 2 ? '; słabsze stada częściej uciekają' : ''}` },
  interference: { name: 'Zakłócanie', v: [15, 25, 40], desc: v => `czary wroga w bitwie zadają i leczą o ${v}% mniej` },
  plunder: { name: 'Grabież', v: [10, 20, 30], desc: v => `po zwycięstwie zabierasz złoto: ${v}% ceny poległych wrogów` },
  triage: { name: 'Opatrywanie ran', v: [10, 20, 30], desc: v => `po zwycięskiej bitwie wraca ${v}% twoich poległych (żywych) stworów` },
};
// Talenty: co TALENT_EVERY poziomów bohater wybiera jeden z trzech (heroPerk). req: lista [umiejętność, poziom], wystarczy jedna;
// bez req dostępne zawsze (Weteran i Arcymag można brać wielokrotnie). Działanie w ZASADY GRY i BITWA: ZASADY.
const TALENT_EVERY = 4;
const TALENTS = {
  veteran: { name: 'Weteran', desc: '+2 do ataku i +2 do obrony', again: true },
  archmage: { name: 'Arcymag', desc: '+2 do mocy czarów i +2 do wiedzy', again: true },
  explorer: { name: 'Odkrywca', desc: '+1 do zasięgu widzenia i +150 punktów ruchu dziennie', again: true },
  counter: { name: 'Kontruderzenie', req: [['armorer', 2], ['offense', 3]], desc: 'twoje oddziały oddają cios dwa razy na rundę' },
  volley: { name: 'Salwa', req: [['archery', 2]], desc: 'strzelcy nie tracą obrażeń przez odległość (przeszkody nadal przeszkadzają)' },
  giantSlayer: { name: 'Pogromca olbrzymów', req: [['offense', 2], ['archery', 2]], desc: 'twoje oddziały zadają o 25% więcej obrażeń stworom 6. i 7. poziomu' },
  ambush: { name: 'Zasadzka', req: [['tactics', 1], ['offense', 2]], desc: 'w pierwszej rundzie bitwy twoje oddziały zadają o 50% więcej obrażeń' },
  warlord: { name: 'Wódz', req: [['leadership', 2]], desc: 'morale armii nigdy nie spada poniżej zera, do tego +1' },
  fortunate: { name: 'Ulubieniec losu', req: [['luck', 2]], desc: 'szczęśliwe ciosy zadają potrójne obrażenia zamiast podwójnych' },
  fieldMedic: { name: 'Polowy cyrulik', req: [['firstAid', 1], ['triage', 2]], desc: 'na początku każdej rundy ranne stwory na czele twoich oddziałów odzyskują do 50 życia' },
  doubleCast: { name: 'Bitewny mag', req: [['sorcery', 2], ['wisdom', 3]], desc: 'w bitwie rzucasz dwa czary na rundę (drugi za potrójną manę)' },
  spellWard: { name: 'Bariera', req: [['resistance', 2], ['interference', 2]], desc: 'pierwszy wrogi czar w każdej bitwie rozbija się o barierę' },
  manaSiphon: { name: 'Wysysanie many', req: [['mysticism', 2], ['intelligence', 2]], desc: 'po każdej wygranej bitwie wraca trzecia część many' },
  scholar: { name: 'Uczony', req: [['wisdom', 2], ['learning', 2], ['eagleSight', 1]], desc: 'od razu poznaje dwa nowe czary (do limitu Mądrości)' },
  deathLord: { name: 'Pan śmierci', req: [['necromancy', 2]], desc: 'nekromancja wskrzesza o połowę więcej kościotrupów' },
  forcedMarch: { name: 'Forsowny marsz', req: [['logistics', 2], ['pathfinding', 2]], desc: '+300 punktów ruchu każdego dnia' },
  treasurer: { name: 'Skarbnik', req: [['estates', 2], ['plunder', 2]], desc: '+500 złota dziennie' },
  diplomat: { name: 'Poseł', req: [['diplomacy', 2]], desc: 'przyjazne i obojętne stwory dołączają za darmo' },
};
// Ścieżki mistrzowskie (etapy rozwoju): na 10. poziomie (PATH_LEVELS[0]) bohater wybiera jedną z trzech ścieżek swojej klasy (CLASS_PATHS),
// na 20. (PATH_LEVELS[1]) staje się Legendą tej ścieżki: to samo działanie, mocniejsze. v: [ścieżka, legenda].
// Wartości dobrane pomiarem tools/balans/bohaterowie.js (indeks siły w bitwie: ile razy większą armię pokonuje armia z bohaterem):
// ścieżka bojowa wojownika daje ok. +15% siły na 10. poziomie i +30% na 20., ścieżka maga mniej (magowie i tak rosną szybciej
// z mocą czarów), a ścieżki przygody i skarbu tyle, ile warte są w złocie i ruchu dwa talenty (Skarbnik +500 zł, Forsowny marsz +300).
const PATH_LEVELS = [10, 20];
const HERO_PATHS = {
  marshal: { name: 'Marszałek', legend: 'Hetman', icon: 't_warlord', v: [[2, 1], [3, 2]], desc: ([s, m]) => `wszystkie twoje oddziały +${s} do szybkości i +${m} do morale` },
  champion: { name: 'Czempion', legend: 'Niezwyciężony', icon: 't_counter', v: [4, 10], desc: v => `+${v} do ataku i +${v} do obrony bohatera` },
  hunter: { name: 'Łowca', legend: 'Mistrz łuku', icon: 't_volley', v: [25, 60], desc: v => `strzelcy zadają o ${v}% więcej obrażeń i nie tracą ich przez odległość` },
  archmage: { name: 'Arcymistrz', legend: 'Arcymistrz wieków', icon: 't_doubleCast', v: [[1, 15], [1, 25]], desc: ([s, c]) => `+${s} do mocy czarów, czary tańsze o ${c}%` },
  sage: { name: 'Mędrzec', legend: 'Wielki mędrzec', icon: 't_scholar', v: [[50, 25], [75, 40]], desc: ([m, w]) => `+${m}% maksymalnej many; czary wroga zadają twojej armii o ${w}% mniej obrażeń` },
  wanderer: { name: 'Wędrowiec', legend: 'Pan szlaków', icon: 't_forcedMarch', v: [[400, 2], [800, 3]], desc: ([mp, s]) => `+${mp} punktów ruchu dziennie i +${s} do zasięgu widzenia` },
  governor: { name: 'Namiestnik', legend: 'Książę', icon: 't_treasurer', v: [[750, 0], [1500, 1]], desc: ([g, r]) => `+${g} złota dziennie${r ? ' i 1 rzadki surowiec dziennie (na zmianę: rtęć, siarka, kryształ, klejnoty)' : ''}` },
};
// Ścieżki do wyboru dla klasy; pierwsza = wybór komputera
const CLASS_PATHS = {
  knight: ['marshal', 'champion', 'governor'], ranger: ['hunter', 'marshal', 'wanderer'], deathKnight: ['champion', 'marshal', 'governor'], beastmaster: ['champion', 'hunter', 'wanderer'],
  demoniac: ['champion', 'marshal', 'wanderer'], alchemist: ['hunter', 'champion', 'governor'], overlord: ['marshal', 'champion', 'governor'], barbarian: ['champion', 'marshal', 'wanderer'],
  battleMage: ['champion', 'archmage', 'wanderer'], cleric: ['sage', 'archmage', 'governor'], druid: ['sage', 'archmage', 'wanderer'], necro: ['archmage', 'sage', 'governor'],
  witch: ['sage', 'archmage', 'wanderer'], heretic: ['archmage', 'sage', 'governor'], wizard: ['archmage', 'sage', 'wanderer'], warlock: ['archmage', 'sage', 'governor'],
};
const PATH_RARE = ['mercury', 'sulfur', 'crystal', 'gems'];
// Kolejność wyboru talentów przez SI (wcześniejszy = ważniejszy)
const AI_TALENT_ORDER = ['doubleCast', 'counter', 'giantSlayer', 'ambush', 'warlord', 'volley', 'deathLord', 'spellWard', 'fortunate', 'fieldMedic', 'forcedMarch', 'treasurer', 'diplomat', 'manaSiphon', 'scholar', 'veteran', 'archmage', 'explorer'];
// Magowie zaczynają z Mądrością (jak w oryginale): bez niej bohater zna czary najwyżej 2. poziomu
const spellCap = h => { const L = heroSkill(h, 'wisdom'); return L ? SKILLS.wisdom.v[L - 1] : 2; };
// Umiejętności startowe klas; nekromancję mogą poznać tylko klasy Kurhanu
const CLASS_SKILLS = {
  knight: [['leadership', 1], ['archery', 1]], cleric: [['wisdom', 1], ['intelligence', 1], ['estates', 1]],
  ranger: [['pathfinding', 1], ['archery', 1]], druid: [['wisdom', 1], ['luck', 1], ['mysticism', 1]],
  deathKnight: [['necromancy', 1], ['offense', 1]], necro: [['necromancy', 1], ['wisdom', 1], ['sorcery', 1]],
  beastmaster: [['armorer', 1], ['pathfinding', 1]], witch: [['wisdom', 1], ['mysticism', 1], ['learning', 1]],
  demoniac: [['offense', 1], ['logistics', 1]], heretic: [['wisdom', 1], ['sorcery', 1], ['intelligence', 1]],
  alchemist: [['armorer', 1], ['estates', 1]], wizard: [['wisdom', 1], ['mysticism', 1], ['intelligence', 1]],
  overlord: [['leadership', 1], ['logistics', 1]], warlock: [['wisdom', 1], ['sorcery', 1], ['intelligence', 1]],
  barbarian: [['offense', 1], ['pathfinding', 1]], battleMage: [['offense', 1], ['sorcery', 1]],
};
const NECRO_CLASSES = ['deathKnight', 'necro'];
const MAGE_CLASSES = ['cleric', 'druid', 'necro', 'witch', 'heretic', 'wizard', 'warlock'];
// Umiejętności, które klasa dostaje przy awansie częściej (jak w oryginale: rycerz rzadko uczy się magii, mag walki)
const MIGHT_SKILLS = ['offense', 'armorer', 'archery', 'leadership', 'artillery', 'ballistics', 'firstAid', 'logistics', 'pathfinding', 'resistance', 'tactics', 'triage', 'plunder'];
const MAGIC_SKILLS = ['wisdom', 'sorcery', 'intelligence', 'mysticism', 'eagleSight', 'learning', 'scouting', 'fireMagic', 'airMagic', 'waterMagic', 'earthMagic', 'interference'];
const CLASS_SKILL_PREF = {
  knight: ['leadership', 'offense', 'armorer', 'artillery', 'tactics'], cleric: ['wisdom', 'waterMagic', 'mysticism', 'estates', 'triage'],
  ranger: ['archery', 'pathfinding', 'luck', 'scouting', 'diplomacy'], druid: ['wisdom', 'earthMagic', 'waterMagic', 'intelligence', 'diplomacy'],
  deathKnight: ['offense', 'armorer', 'resistance', 'necromancy', 'tactics'], necro: ['wisdom', 'earthMagic', 'intelligence', 'necromancy', 'interference'],
  beastmaster: ['armorer', 'offense', 'navigation', 'firstAid', 'triage'], witch: ['wisdom', 'eagleSight', 'waterMagic', 'intelligence', 'interference'],
  demoniac: ['offense', 'artillery', 'ballistics', 'resistance', 'plunder'], heretic: ['wisdom', 'fireMagic', 'sorcery', 'intelligence', 'interference'],
  alchemist: ['artillery', 'ballistics', 'wisdom', 'earthMagic', 'plunder'], wizard: ['wisdom', 'airMagic', 'intelligence', 'sorcery', 'interference'],
  overlord: ['leadership', 'offense', 'resistance', 'scouting', 'tactics'], warlock: ['wisdom', 'fireMagic', 'sorcery', 'intelligence', 'interference'],
  barbarian: ['offense', 'resistance', 'armorer', 'ballistics', 'plunder'], battleMage: ['offense', 'wisdom', 'fireMagic', 'artillery', 'tactics'],
};
// Waga umiejętności w losowaniu przy awansie: ulubione klasy ×4, magiczne u wojowników i bojowe u magów ×0,5
const skillWeight = (cls, id) => (CLASS_SKILL_PREF[cls] || []).includes(id) ? 4 : (MAGE_CLASSES.includes(cls) ? MIGHT_SKILLS : MAGIC_SKILLS).includes(id) ? 0.5 : 1;
// Kolejność, w jakiej SI wybiera umiejętności przy awansie (wcześniejsza = ważniejsza)
const AI_SKILL_ORDER = ['offense', 'necromancy', 'wisdom', 'leadership', 'armorer', 'archery', 'tactics', 'logistics', 'resistance', 'luck', 'triage', 'artillery', 'pathfinding', 'estates', 'sorcery',
  'earthMagic', 'fireMagic', 'airMagic', 'waterMagic', 'interference', 'intelligence', 'plunder', 'diplomacy', 'firstAid', 'ballistics', 'learning', 'eagleSight', 'mysticism', 'navigation', 'scouting'];

// Specjalności bohaterów (jak w oryginale), rosną z poziomem bohatera:
// dw: stwory z siedliska tego poziomu (i ulepszone) dostają +5% ataku i obrony za każdy poziom bohatera na poziom stwora, +1 szybkości;
// res: surowiec dziennie; skill: umiejętność działa o 5% mocniej za poziom (gdy bohater ją zna); spell: czar mocniejszy o 3% za poziom.
const HERO_SPECS = {
  'Sir Rolan': { dw: 3 }, Weronika: { spell: 'cure' }, Bernard: { res: 'gold', n: 350 }, Idalia: { dw: 6 }, Kasjan: { skill: 'archery' }, Mirela: { spell: 'magicArrow' },
  Elandra: { dw: 2 }, Tarwen: { spell: 'lightningBolt' }, Lirien: { res: 'crystal', n: 1 }, Gawen: { dw: 4 },
  Mortis: { skill: 'necromancy' }, Raga: { spell: 'animateDead' }, 'Sir Kruk': { dw: 1 }, 'Zofia Czarna': { dw: 5 },
  Borzywoj: { dw: 1 }, Wilga: { skill: 'mysticism' }, Mszar: { res: 'mercury', n: 1 }, Dobrawa: { dw: 6 },
  Azgar: { dw: 3 }, Kalida: { skill: 'offense' }, Moloch: { spell: 'fireball' }, 'Wiera Popiół': { res: 'sulfur', n: 1 },
  Ostromir: { spell: 'magicArrow' }, 'Jagna Mróz': { skill: 'intelligence' }, Zbylut: { dw: 2 }, 'Mirosława': { res: 'gems', n: 1 },
  'Czarnobór': { dw: 7 }, Morana: { spell: 'meteorShower' }, 'Zmorzysław': { skill: 'sorcery' }, Dziwa: { res: 'gold', n: 350 },
  'Gromisław': { dw: 1 }, 'Wojsława': { dw: 5 }, 'Ognisław': { skill: 'logistics' }, Jarogniewa: { res: 'ore', n: 2 },
  Ulryk: { dw: 2 }, Bogna: { skill: 'intelligence' }, Aelwen: { skill: 'archery' }, 'Dębosz': { dw: 5 }, 'Wrocisław': { res: 'mercury', n: 1 }, 'Grzymisława': { skill: 'offense' },
  Skrzek: { dw: 3 }, 'Rusałka': { spell: 'cure' }, Belzar: { dw: 5 }, 'Żmija': { spell: 'fireball' }, 'Mieszko Kruszec': { res: 'ore', n: 2 }, Srebrna: { spell: 'lightningBolt' },
  Grzmot: { dw: 6 }, Nocna: { skill: 'mysticism' }, Warg: { dw: 2 }, Iskra: { spell: 'fireball' },
};
const heroSpec = h => (h && HERO_SPECS[h.name]) || null;
// Doświadczenie potrzebne do poziomu 2, 3, ... (dalej każdy poziom +20%)
const LEVEL_EXP = [0, 0, 1000, 2000, 3200, 4600, 6200, 8000, 10000, 12200, 14700, 17500, 20600, 24320];
const expForLevel = L => (L < LEVEL_EXP.length ? LEVEL_EXP[L] : Math.round(expForLevel(L - 1) * 1.2));
// Miejsca na ekwipunek (x, y = pozycja na ekranie bohatera, kind = rodzaj artefaktu, który pasuje)
const EQUIP_SLOTS = [
  { id: 'head', kind: 'head', name: 'Głowa', x: 574, y: 64 }, { id: 'neck', kind: 'neck', name: 'Szyja', x: 574, y: 118 },
  { id: 'cloak', kind: 'cloak', name: 'Płaszcz', x: 648, y: 118 }, { id: 'torso', kind: 'torso', name: 'Tułów', x: 574, y: 172 },
  { id: 'weapon', kind: 'weapon', name: 'Broń', x: 490, y: 172 }, { id: 'shield', kind: 'shield', name: 'Tarcza', x: 658, y: 172 },
  { id: 'ring1', kind: 'ring', name: 'Pierścień', x: 490, y: 234 }, { id: 'ring2', kind: 'ring', name: 'Pierścień', x: 658, y: 234 },
  { id: 'feet', kind: 'feet', name: 'Stopy', x: 574, y: 300 },
  { id: 'misc1', kind: 'misc', name: 'Różne', x: 432, y: 300 }, { id: 'misc2', kind: 'misc', name: 'Różne', x: 716, y: 300 },
];
const RARITY = { treasure: 'skarb', minor: 'pomniejszy', major: 'potężny', relic: 'relikwia' };
// bonus: att/def/sp/kn (cechy), mp (punkty ruchu), sight (zasięg widzenia), gold (złoto dziennie), morale, luck (szczęście)
// icon: rodzaj rysunku w drawArtifact(); col/gem: kolory
const ARTIFACTS = {
  noviceSword: { name: 'Miecz nowicjusza', kind: 'weapon', rarity: 'treasure', bonus: { att: 1 }, icon: 'sword', col: '#b8c0cc', gem: '#8a5a2a' },
  oakShield: { name: 'Dębowa tarcza', kind: 'shield', rarity: 'treasure', bonus: { def: 1 }, icon: 'shield', col: '#8a5a30', gem: '#c8a050' },
  ironHelm: { name: 'Żelazny hełm', kind: 'head', rarity: 'treasure', bonus: { kn: 1 }, icon: 'helm', col: '#9aa2ae', gem: '#5a6270' },
  amberAmulet: { name: 'Bursztynowy amulet', kind: 'neck', rarity: 'treasure', bonus: { sp: 1 }, icon: 'amulet', col: '#c8a050', gem: '#f0a030' },
  scoutRing: { name: 'Pierścień zwiadowcy', kind: 'ring', rarity: 'treasure', bonus: { sight: 1 }, icon: 'ring', col: '#c8a050', gem: '#4aa0e0' },
  wandererBoots: { name: 'Buty wędrowca', kind: 'feet', rarity: 'treasure', bonus: { mp: 200 }, icon: 'boots', col: '#7a4a26', gem: '#c8a050' },
  merchantPurse: { name: 'Sakiewka kupca', kind: 'misc', rarity: 'treasure', bonus: { gold: 250 }, icon: 'bag', col: '#9a6a3a', gem: '#f0c040' },
  luckyHorseshoe: { name: 'Szczęśliwa podkowa', kind: 'misc', rarity: 'treasure', bonus: { luck: 1 }, icon: 'horseshoe', col: '#aab2bc', gem: '#6a7280' },
  steppeAxe: { name: 'Topór stepowego wodza', kind: 'weapon', rarity: 'minor', bonus: { att: 2 }, icon: 'axe', col: '#b0b8c4', gem: '#6a4424' },
  lionShield: { name: 'Tarcza lwiej straży', kind: 'shield', rarity: 'minor', bonus: { def: 1, morale: 1 }, icon: 'shield', col: '#c8a040', gem: '#a8302a' },
  mistCloak: { name: 'Płaszcz z mgły', kind: 'cloak', rarity: 'minor', bonus: { def: 1, luck: 1 }, icon: 'cloak', col: '#8aa0c0', gem: '#dce6f4' },
  wardenMail: { name: 'Kolczuga strażnika', kind: 'torso', rarity: 'minor', bonus: { def: 1, kn: 1 }, icon: 'armor', col: '#a8b0bc', gem: '#6a7280' },
  clarityRing: { name: 'Pierścień jasności', kind: 'ring', rarity: 'minor', bonus: { kn: 2 }, icon: 'ring', col: '#d8dce4', gem: '#a060e0' },
  emberOrb: { name: 'Kula żaru', kind: 'misc', rarity: 'minor', bonus: { sp: 2 }, icon: 'orb', col: '#ff7a2a', gem: '#6a4424' },
  windBoots: { name: 'Buty wiatru', kind: 'feet', rarity: 'minor', bonus: { mp: 400 }, icon: 'boots', col: '#6a8aa8', gem: '#e8f0f8' },
  dragonfangBlade: { name: 'Ostrze smoczego kła', kind: 'weapon', rarity: 'major', bonus: { att: 4 }, icon: 'sword', col: '#e8e0c8', gem: '#3aa060' },
  mountainShield: { name: 'Tarcza górskiego rodu', kind: 'shield', rarity: 'major', bonus: { def: 3, morale: 2 }, icon: 'shield', col: '#6a7a8a', gem: '#f0c040' },
  sageDiadem: { name: 'Diadem mędrca', kind: 'head', rarity: 'major', bonus: { kn: 3, sp: 1, luck: 1 }, icon: 'crown', col: '#f0c040', gem: '#4aa0e0' },
  runeBook: { name: 'Księga run', kind: 'misc', rarity: 'major', bonus: { sp: 3, kn: 1 }, icon: 'book', col: '#6a2a2a', gem: '#f0c040' },
  hornOfPlenty: { name: 'Mieszek obfitości', kind: 'misc', rarity: 'major', bonus: { gold: 750 }, icon: 'bag', col: '#6a3a6a', gem: '#f0c040' },
  // --- kolejne artefakty ---
  bronzeDagger: { name: 'Brązowy sztylet', kind: 'weapon', rarity: 'treasure', bonus: { att: 1, luck: 1 }, icon: 'dagger', col: '#c8904a', gem: '#6a4424' },
  leatherVest: { name: 'Skórzany kaftan', kind: 'torso', rarity: 'treasure', bonus: { def: 1 }, icon: 'armor', col: '#8a5a30', gem: '#c8a050' },
  travelCloak: { name: 'Płaszcz podróżny', kind: 'cloak', rarity: 'treasure', bonus: { mp: 150 }, icon: 'cloak', col: '#6a5a3a', gem: '#8a7a5a' },
  bearClaw: { name: 'Naszyjnik z niedźwiedziego pazura', kind: 'neck', rarity: 'treasure', bonus: { att: 1 }, icon: 'fang', col: '#e8dcc0', gem: '#5a3a1a' },
  woolHood: { name: 'Wełniany kaptur mnicha', kind: 'head', rarity: 'treasure', bonus: { sp: 1 }, icon: 'hood', col: '#7a5a3a', gem: '#5a3a1a' },
  owlFeather: { name: 'Sowie pióro', kind: 'misc', rarity: 'treasure', bonus: { kn: 1 }, icon: 'feather', col: '#c8b890', gem: '#6a5a3a' },
  silverCoin: { name: 'Srebrna moneta', kind: 'misc', rarity: 'treasure', bonus: { gold: 150 }, icon: 'coin', col: '#d8dce4', gem: '#8a8e98' },
  copperRing: { name: 'Miedziany pierścień', kind: 'ring', rarity: 'treasure', bonus: { def: 1 }, icon: 'ring', col: '#c8784a', gem: '#3aa060' },
  knightHelm: { name: 'Hełm rycerski', kind: 'head', rarity: 'minor', bonus: { def: 2 }, icon: 'helm', col: '#b8c0cc', gem: '#a8302a' },
  // --- artefakty z talentem (perk: działa jak talent TALENTS, póki artefakt jest założony) ---
  falconBow: { name: 'Łuk sokolnika', kind: 'weapon', rarity: 'major', bonus: { att: 2 }, perk: 'volley', icon: 'bow', col: '#5a3a20', gem: '#ffd060' },
  giantAxe: { name: 'Topór pogromcy olbrzymów', kind: 'weapon', rarity: 'major', bonus: { att: 2 }, perk: 'giantSlayer', icon: 'axe', col: '#c8ccd4', gem: '#a83a2a' },
  marchBoots: { name: 'Buty forsownego marszu', kind: 'feet', rarity: 'minor', bonus: {}, perk: 'forcedMarch', icon: 'boots', col: '#5a4a3a', gem: '#c8a040' },
  wardAmulet: { name: 'Amulet bariery', kind: 'neck', rarity: 'minor', bonus: { def: 1 }, perk: 'spellWard', icon: 'amulet', col: '#c8ccd4', gem: '#8ac8ff' },
  warlordBanner: { name: 'Sztandar wodza', kind: 'misc', rarity: 'major', bonus: { morale: 1 }, perk: 'warlord', icon: 'banner', col: '#c8302a', gem: '#ffd060' },
  surgeonBag: { name: 'Torba cyrulika', kind: 'misc', rarity: 'minor', bonus: {}, perk: 'fieldMedic', icon: 'bag', col: '#e8e0cc', gem: '#d83a3a' },
  twinRing: { name: 'Pierścień bliźniaczych zaklęć', kind: 'ring', rarity: 'major', bonus: { sp: 1 }, perk: 'doubleCast', icon: 'ring', col: '#c8a040', gem: '#b080ff' },
  hunterBow: { name: 'Łuk myśliwego', kind: 'weapon', rarity: 'minor', bonus: { att: 1, luck: 1, sight: 1 }, icon: 'bow', col: '#8a5a2a', gem: '#e8e0c8' },
  ravenAmulet: { name: 'Krucze oko', kind: 'neck', rarity: 'minor', bonus: { kn: 1, sp: 1 }, icon: 'amulet', col: '#3a3a44', gem: '#a02a2a' },
  lionCloak: { name: 'Lwia skóra', kind: 'cloak', rarity: 'minor', bonus: { att: 1, morale: 1 }, icon: 'cloak', col: '#c8a050', gem: '#8a5a20' },
  stoneShield: { name: 'Kamienna tarcza', kind: 'shield', rarity: 'minor', bonus: { def: 2 }, icon: 'shield', col: '#8a8a80', gem: '#5a5a54' },
  seerRing: { name: 'Pierścień jasnowidza', kind: 'ring', rarity: 'minor', bonus: { sight: 2, kn: 1 }, icon: 'ring', col: '#d8dce4', gem: '#40c0e0' },
  battleBanner: { name: 'Chorągiew bojowa', kind: 'misc', rarity: 'minor', bonus: { morale: 2 }, icon: 'banner', col: '#a8302a', gem: '#f0c040' },
  goldenSignet: { name: 'Złoty sygnet kupca', kind: 'ring', rarity: 'minor', bonus: { gold: 250 }, icon: 'ring', col: '#f0c040', gem: '#3a3a44' },
  titanHelm: { name: 'Hełm tytana', kind: 'head', rarity: 'minor', bonus: { def: 2 }, icon: 'helm', col: '#8aa0b0', gem: '#40c0e0' },
  titanGreaves: { name: 'Nagolenniki tytana', kind: 'feet', rarity: 'minor', bonus: { def: 1, mp: 200 }, icon: 'boots', col: '#8aa0b0', gem: '#40c0e0' },
  boneCrown: { name: 'Korona z kości', kind: 'head', rarity: 'minor', bonus: { sp: 2 }, icon: 'crown', col: '#e0d8c0', gem: '#60e0a0' },
  deathShroud: { name: 'Całun śmierci', kind: 'cloak', rarity: 'minor', bonus: { def: 1, sp: 1 }, icon: 'cloak', col: '#3a3440', gem: '#60e0a0' },
  vampireFang: { name: 'Kieł wampira', kind: 'neck', rarity: 'minor', bonus: { kn: 2 }, icon: 'fang', col: '#f0e8d0', gem: '#a0202a' },
  thunderHammer: { name: 'Młot gromu', kind: 'weapon', rarity: 'major', bonus: { att: 5 }, icon: 'hammer', col: '#9aa8c0', gem: '#ffe060' },
  eclipseShield: { name: 'Tarcza zaćmienia', kind: 'shield', rarity: 'major', bonus: { def: 5 }, icon: 'shield', col: '#2a2a3a', gem: '#f0c040' },
  courageCrown: { name: 'Korona męstwa', kind: 'head', rarity: 'major', bonus: { att: 2, def: 2, morale: 2 }, icon: 'crown', col: '#f0c040', gem: '#c83a2a' },
  phoenixAmulet: { name: 'Amulet feniksa', kind: 'neck', rarity: 'major', bonus: { sp: 3, luck: 1 }, icon: 'amulet', col: '#ff8a2a', gem: '#ffe060' },
  shadowCloak: { name: 'Płaszcz cienia', kind: 'cloak', rarity: 'major', bonus: { def: 3, luck: 2 }, icon: 'cloak', col: '#2a2436', gem: '#8a6ac0' },
  oathRing: { name: 'Pierścień przysięgi', kind: 'ring', rarity: 'major', bonus: { att: 2, def: 2 }, icon: 'ring', col: '#e0e4ec', gem: '#c83a2a' },
  leagueBoots: { name: 'Buty siedmiomilowe', kind: 'feet', rarity: 'major', bonus: { mp: 700 }, icon: 'boots', col: '#4a3a2a', gem: '#f0c040' },
  skyOrb: { name: 'Kula niebios', kind: 'misc', rarity: 'major', bonus: { sp: 2, kn: 2, sight: 2 }, icon: 'orb', col: '#6ab0f0', gem: '#e0e4ec' },
  dragonScaleShield: { name: 'Tarcza ze smoczej łuski', kind: 'shield', rarity: 'major', bonus: { def: 4 }, icon: 'shield', col: '#3a8a5a', gem: '#e8e0c8' },
  dragonScaleMail: { name: 'Zbroja ze smoczej łuski', kind: 'torso', rarity: 'major', bonus: { def: 3, att: 1 }, icon: 'armor', col: '#3a8a5a', gem: '#e8e0c8' },
  dragonBoneHelm: { name: 'Hełm ze smoczej kości', kind: 'head', rarity: 'major', bonus: { att: 2, kn: 1 }, icon: 'helm', col: '#e8e0c8', gem: '#3a8a5a' },
  starRobe: { name: 'Gwiezdna szata', kind: 'torso', rarity: 'major', bonus: { sp: 2, kn: 2 }, icon: 'robe', col: '#2a3a8a', gem: '#f0e080' },
  archmageStaff: { name: 'Laska arcymaga', kind: 'weapon', rarity: 'major', bonus: { sp: 3 }, icon: 'staff', col: '#6a4a2a', gem: '#8ad0ff' },
  titanCuirass: { name: 'Napierśnik tytana', kind: 'torso', rarity: 'major', bonus: { def: 4 }, icon: 'armor', col: '#8aa0b0', gem: '#40c0e0' },
  titanHammer: { name: 'Młot tytana', kind: 'weapon', rarity: 'major', bonus: { att: 4 }, icon: 'hammer', col: '#8aa0b0', gem: '#40c0e0' },
  // --- relikwie: składa się je z kompletu części założonych naraz (parts); zajmują wtedy wszystkie ich miejsca ---
  dragonLordArmor: { name: 'Rynsztunek Smoczego Władcy', kind: 'torso', rarity: 'relic', parts: ['dragonScaleMail', 'dragonfangBlade', 'dragonScaleShield', 'dragonBoneHelm'], bonus: { att: 9, def: 9, morale: 1 }, icon: 'armor', col: '#2a9a5a', gem: '#ffe060' },
  archmageRegalia: { name: 'Regalia Arcymaga', kind: 'torso', rarity: 'relic', parts: ['starRobe', 'archmageStaff', 'sageDiadem', 'runeBook'], bonus: { sp: 9, kn: 9, luck: 1 }, icon: 'robe', col: '#3a4ab0', gem: '#ffe060' },
  stormWalker: { name: 'Strój Wędrowca Burz', kind: 'feet', rarity: 'relic', parts: ['windBoots', 'mistCloak', 'scoutRing'], bonus: { mp: 1400, sight: 4, luck: 2 }, icon: 'boots', col: '#4a7ac0', gem: '#e8f0ff' },
  merchantPrince: { name: 'Skarbiec Kupieckiego Księcia', kind: 'misc', rarity: 'relic', parts: ['merchantPurse', 'hornOfPlenty', 'goldenSignet'], bonus: { gold: 3000, res: { wood: 1, ore: 1, mercury: 1, sulfur: 1, crystal: 1, gems: 1 } }, icon: 'bag', col: '#f0c040', gem: '#c83a2a' },
  titanArmor: { name: 'Pancerz Tytana', kind: 'torso', rarity: 'relic', parts: ['titanCuirass', 'titanHammer', 'titanHelm', 'titanGreaves'], bonus: { att: 7, def: 12 }, icon: 'armor', col: '#6ab0d0', gem: '#ffffff' },
  deadKingRegalia: { name: 'Insygnia Króla Umarłych', kind: 'head', rarity: 'relic', parts: ['boneCrown', 'deathShroud', 'vampireFang'], bonus: { sp: 5, kn: 4, def: 3 }, icon: 'crown', col: '#d8d0b8', gem: '#60e0a0' },
  // Graala nie da się założyć (nie ma pasującego miejsca): leży w plecaku, dopóki bohater nie zbuduje go w mieście
  grail: { name: 'Graal', kind: 'grail', rarity: 'relic', bonus: {}, icon: 'grail', col: '#f0c040', gem: '#fff4c0',
    desc: 'Święty kielich. Zanieś go do własnego miasta, aby wznieść tam budowlę Graala (+5000 złota dziennie, +50% przyrostu stworów).' },
};
const ARTS_BY_RARITY = rar => Object.keys(ARTIFACTS).filter(id => ARTIFACTS[id].rarity === rar && id !== 'grail' && !ARTIFACTS[id].parts);
const RELICS = Object.keys(ARTIFACTS).filter(id => ARTIFACTS[id].parts);
const relicOf = id => RELICS.find(r => ARTIFACTS[r].parts.includes(id)) || null; // relikwia, której częścią jest artefakt
// Opis premii artefaktu: „+2 do ataku, +200 ruchu”
function artBonusText(b) {
  const out = [];
  for (const p of PRIMARY) if (b[p.id]) out.push(`+${b[p.id]} do ${p.gen}`);
  if (b.morale) out.push(`${signed(b.morale)} do morale`); if (b.luck) out.push(`${signed(b.luck)} do szczęścia`);
  if (b.mp) out.push(`+${b.mp} punktów ruchu`); if (b.sight) out.push(`+${b.sight} do zasięgu widzenia`); if (b.gold) out.push(`+${b.gold} złota dziennie`);
  if (b.res) out.push(`dziennie ${Object.entries(b.res).map(([r, n]) => `+${n} ${(RESOURCES.find(x => x.id === r) || { name: r }).name.toLowerCase()}`).join(', ')}`);
  return out.join(', ');
}
const artInfo = id => { const A = ARTIFACTS[id], r = relicOf(id);
  return `${A.name} (${RARITY[A.rarity]}): ${A.desc || [artBonusText(A.bonus), A.perk ? `talent ${TALENTS[A.perk].name} (${TALENTS[A.perk].desc})` : ''].filter(Boolean).join('; ') + '.'}` + (A.parts ? ` Złożona z: ${A.parts.map(p => ARTIFACTS[p].name).join(', ')}.` : '') + (r ? ` Część relikwii: ${ARTIFACTS[r].name}.` : ''); };

