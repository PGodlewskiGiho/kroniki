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
  alchemist: { base: [1, 1, 2, 2], grow: [30, 30, 20, 20] }, wizard: { base: [0, 0, 2, 3], grow: [10, 10, 40, 40] },
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
  ballistics: { name: 'Balistyka', v: [85, 95, 100], desc: v => `katapulta trafia w mury w ${v}% strzałów` },
  resistance: { name: 'Odporność', v: [5, 10, 20], desc: v => `${v}% szans, że czar wroga nie zadziała na oddział` },
  fireMagic: { name: 'Magia Ognia', v: [1, 2, 3], school: 'fire', desc: v => schoolDesc(v) },
  airMagic: { name: 'Magia Powietrza', v: [1, 2, 3], school: 'air', desc: v => schoolDesc(v) },
  waterMagic: { name: 'Magia Wody', v: [1, 2, 3], school: 'water', desc: v => schoolDesc(v) },
  earthMagic: { name: 'Magia Ziemi', v: [1, 2, 3], school: 'earth', desc: v => schoolDesc(v) },
  eagleSight: { name: 'Orle oko', v: [40, 50, 60], desc: v => `${v}% szans na naukę czaru rzuconego przez wroga (do ${v / 10 - 2}. poziomu)` },
};
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
const MIGHT_SKILLS = ['offense', 'armorer', 'archery', 'leadership', 'artillery', 'ballistics', 'firstAid', 'logistics', 'pathfinding', 'resistance'];
const MAGIC_SKILLS = ['wisdom', 'sorcery', 'intelligence', 'mysticism', 'eagleSight', 'learning', 'scouting', 'fireMagic', 'airMagic', 'waterMagic', 'earthMagic'];
const CLASS_SKILL_PREF = {
  knight: ['leadership', 'offense', 'armorer', 'artillery'], cleric: ['wisdom', 'waterMagic', 'mysticism', 'estates'],
  ranger: ['archery', 'pathfinding', 'luck', 'scouting'], druid: ['wisdom', 'earthMagic', 'waterMagic', 'intelligence'],
  deathKnight: ['offense', 'armorer', 'resistance', 'necromancy'], necro: ['wisdom', 'earthMagic', 'intelligence', 'necromancy'],
  beastmaster: ['armorer', 'offense', 'navigation', 'firstAid'], witch: ['wisdom', 'eagleSight', 'waterMagic', 'intelligence'],
  demoniac: ['offense', 'artillery', 'ballistics', 'resistance'], heretic: ['wisdom', 'fireMagic', 'sorcery', 'intelligence'],
  alchemist: ['artillery', 'ballistics', 'wisdom', 'earthMagic'], wizard: ['wisdom', 'airMagic', 'intelligence', 'sorcery'],
  overlord: ['leadership', 'offense', 'resistance', 'scouting'], warlock: ['wisdom', 'fireMagic', 'sorcery', 'intelligence'],
  barbarian: ['offense', 'resistance', 'armorer', 'ballistics'], battleMage: ['offense', 'wisdom', 'fireMagic', 'artillery'],
};
// Waga umiejętności w losowaniu przy awansie: ulubione klasy ×4, magiczne u wojowników i bojowe u magów ×0,5
const skillWeight = (cls, id) => (CLASS_SKILL_PREF[cls] || []).includes(id) ? 4 : (MAGE_CLASSES.includes(cls) ? MIGHT_SKILLS : MAGIC_SKILLS).includes(id) ? 0.5 : 1;
// Kolejność, w jakiej SI wybiera umiejętności przy awansie (wcześniejsza = ważniejsza)
const AI_SKILL_ORDER = ['offense', 'necromancy', 'wisdom', 'leadership', 'armorer', 'archery', 'logistics', 'resistance', 'luck', 'artillery', 'pathfinding', 'estates', 'sorcery',
  'earthMagic', 'fireMagic', 'airMagic', 'waterMagic', 'intelligence', 'firstAid', 'ballistics', 'learning', 'eagleSight', 'mysticism', 'navigation', 'scouting'];

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
  return `${A.name} (${RARITY[A.rarity]}): ${A.desc || artBonusText(A.bonus) + '.'}` + (A.parts ? ` Złożona z: ${A.parts.map(p => ARTIFACTS[p].name).join(', ')}.` : '') + (r ? ` Część relikwii: ${ARTIFACTS[r].name}.` : ''); };

