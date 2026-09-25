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
};
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
const RARITY = { treasure: 'skarb', minor: 'pomniejszy', major: 'potężny' };
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
const artInfo = id => { const A = ARTIFACTS[id]; return `${A.name} (${RARITY[A.rarity]}): ${artBonusText(A.bonus)}.`; };

