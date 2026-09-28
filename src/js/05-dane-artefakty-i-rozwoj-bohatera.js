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
const MAX_SKILLS = 8, SKILL_LEVELS = ['', 'podstawowe', 'zaawansowane', 'eksperckie'];
const SKILLS = {
  leadership: { name: 'Przywództwo', v: [1, 2, 3], desc: v => `+${v} do morale armii` },
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
const MAGIC_SKILLS = ['wisdom', 'sorcery', 'intelligence', 'mysticism', 'eagleSight', 'learning', 'scouting'];
const CLASS_SKILL_PREF = {
  knight: ['leadership', 'offense', 'armorer', 'artillery'], cleric: ['wisdom', 'eagleSight', 'mysticism', 'estates'],
  ranger: ['archery', 'pathfinding', 'luck', 'scouting'], druid: ['wisdom', 'intelligence', 'luck', 'eagleSight'],
  deathKnight: ['offense', 'armorer', 'resistance', 'necromancy'], necro: ['wisdom', 'intelligence', 'eagleSight', 'necromancy'],
  beastmaster: ['armorer', 'offense', 'navigation', 'firstAid'], witch: ['wisdom', 'eagleSight', 'navigation', 'intelligence'],
  demoniac: ['offense', 'artillery', 'ballistics', 'resistance'], heretic: ['wisdom', 'sorcery', 'intelligence', 'learning'],
  alchemist: ['artillery', 'ballistics', 'wisdom', 'firstAid'], wizard: ['wisdom', 'intelligence', 'eagleSight', 'sorcery'],
  overlord: ['leadership', 'offense', 'resistance', 'scouting'], warlock: ['wisdom', 'sorcery', 'intelligence', 'eagleSight'],
  barbarian: ['offense', 'resistance', 'armorer', 'ballistics'], battleMage: ['offense', 'wisdom', 'sorcery', 'artillery'],
};
// Waga umiejętności w losowaniu przy awansie: ulubione klasy ×4, magiczne u wojowników i bojowe u magów ×0,5
const skillWeight = (cls, id) => (CLASS_SKILL_PREF[cls] || []).includes(id) ? 4 : (MAGE_CLASSES.includes(cls) ? MIGHT_SKILLS : MAGIC_SKILLS).includes(id) ? 0.5 : 1;
// Kolejność, w jakiej SI wybiera umiejętności przy awansie (wcześniejsza = ważniejsza)
const AI_SKILL_ORDER = ['offense', 'necromancy', 'wisdom', 'leadership', 'armorer', 'archery', 'logistics', 'resistance', 'luck', 'artillery', 'pathfinding', 'estates', 'sorcery',
  'intelligence', 'firstAid', 'ballistics', 'learning', 'eagleSight', 'mysticism', 'navigation', 'scouting'];

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
  // Graala nie da się założyć (nie ma pasującego miejsca): leży w plecaku, dopóki bohater nie zbuduje go w mieście
  grail: { name: 'Graal', kind: 'grail', rarity: 'relic', bonus: {}, icon: 'grail', col: '#f0c040', gem: '#fff4c0',
    desc: 'Święty kielich. Zanieś go do własnego miasta, aby wznieść tam budowlę Graala (+5000 złota dziennie, +50% przyrostu stworów).' },
};
const ARTS_BY_RARITY = rar => Object.keys(ARTIFACTS).filter(id => ARTIFACTS[id].rarity === rar);
// Opis premii artefaktu: „+2 do ataku, +200 ruchu”
function artBonusText(b) {
  const out = [];
  for (const p of PRIMARY) if (b[p.id]) out.push(`+${b[p.id]} do ${p.gen}`);
  if (b.morale) out.push(`${signed(b.morale)} do morale`); if (b.luck) out.push(`${signed(b.luck)} do szczęścia`);
  if (b.mp) out.push(`+${b.mp} punktów ruchu`); if (b.sight) out.push(`+${b.sight} do zasięgu widzenia`); if (b.gold) out.push(`+${b.gold} złota dziennie`);
  return out.join(', ');
}
const artInfo = id => { const A = ARTIFACTS[id]; return `${A.name} (${RARITY[A.rarity]}): ${A.desc || artBonusText(A.bonus) + '.'}`; };

