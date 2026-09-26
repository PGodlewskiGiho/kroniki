// ==================== DANE: FRAKCJE, BOHATEROWIE, BUDOWLE, KOPALNIE =====================
// Wszystko, co różni frakcje, jest w FACTIONS. BUILDINGS opisuje budowle wspólne dla frakcji.
// Klasy bohaterów. look = wygląd wspólny dla postaci na mapie i portretu w panelu.
// helm: kolor hełmu (klasy siły) albo hood: kolor kaptura (klasy magii).
const HERO_CLASSES = {
  knight: { name: 'Rycerz', nameF: 'Rycerka', look: { horse: '#7a4a26', mane: '#2a1a0e', armor: '#b8c0cc', helm: '#c8d0da', skin: '#e0b890' } },
  cleric: { name: 'Kapłan', nameF: 'Kapłanka', look: { horse: '#e8e0d0', mane: '#8a8078', armor: '#c8b88a', hood: '#f0ead8', skin: '#e0b890' } },
  ranger: { name: 'Strażnik', nameF: 'Strażniczka', look: { horse: '#9a6a3a', mane: '#3a2410', armor: '#6a5a34', hood: '#3a6a3a', skin: '#e8c8a0' } },
  druid: { name: 'Druid', nameF: 'Druidka', look: { horse: '#c8b890', mane: '#6a5a3a', armor: '#7a6a3a', hood: '#6a8a3a', skin: '#e8c8a0' } },
  deathKnight: { name: 'Rycerz śmierci', nameF: 'Rycerka śmierci', look: { horse: '#2e2a36', mane: '#a6f0a8', armor: '#5a5468', helm: '#6e6880', skin: '#c8c0b0' } },
  necro: { name: 'Nekromanta', nameF: 'Nekromantka', look: { horse: '#3a3440', mane: '#c8c0ac', armor: '#4a3a5a', hood: '#2a1e36', skin: '#c8c0b0' } },
  beastmaster: { name: 'Władca bestii', nameF: 'Władczyni bestii', look: { horse: '#6a5a3a', mane: '#2a2010', armor: '#7a5a34', helm: '#8a6a3a', skin: '#c89a6a' } },
  witch: { name: 'Szaman', nameF: 'Wiedźma', look: { horse: '#5a6a4a', mane: '#2a3a20', armor: '#4a5a3a', hood: '#3a5a3a', skin: '#d8b890' } },
  demoniac: { name: 'Piekielny rycerz', nameF: 'Piekielna rycerka', look: { horse: '#2a1a1a', mane: '#ff6a2a', armor: '#6a2a24', helm: '#4a1e1a', skin: '#d8a888' } },
  heretic: { name: 'Heretyk', nameF: 'Heretyczka', look: { horse: '#3a2020', mane: '#c83a1a', armor: '#5a1e1e', hood: '#2a0e10', skin: '#d8b090' } },
  alchemist: { name: 'Alchemik', nameF: 'Alchemiczka', look: { horse: '#c8c8d0', mane: '#6a6a7a', armor: '#7a8aa0', hood: '#4a6a9a', skin: '#e8c8a0' } },
  wizard: { name: 'Czarodziej', nameF: 'Czarodziejka', look: { horse: '#e8e8f0', mane: '#a8b0c8', armor: '#3a4a8a', hood: '#2a3a7a', skin: '#e8c8a0' } },
};
// Wszystko, co wyróżnia frakcję. dw: siedliska [nazwa, jednostka], emb: symbole siedlisk poziomów 1–7.
const FACTIONS = [
  {
    id: 'haven', name: 'Przystań', terrain: TER.GRASS,
    desc: 'Królestwo ludzi: pikinierzy, łucznicy, gryfy, miecznicy, mnisi, kawaleria i Strażnicy Światła.',
    heroes: [['Sir Rolan', 'knight'], ['Weronika', 'cleric', 1], ['Bernard', 'cleric'], ['Idalia', 'knight', 1], ['Kasjan', 'knight'], ['Mirela', 'cleric', 1]],
    towns: ['Jaworzyn', 'Białogród', 'Złote Pole', 'Dębowa Góra', 'Srebrny Bród', 'Wysoka Grań', 'Lipowiec', 'Kamienna Straż'],
    guild: 'Gildia magów', emb: ['spear', 'bow', 'wing', 'sword', 'cross', 'horse', 'sun'],
    dw: {
      dw1: ['Koszary', 'pikeman'], dw1u: ['Ćwiczebnia', 'halberdier'], dw2: ['Strzelnica', 'archer'], dw2u: ['Wieża kuszników', 'marksman'],
      dw3: ['Wieża gryfów', 'griffin'], dw3u: ['Gniazdo królewskie', 'royalGriffin'], dw4: ['Koszary miecznicze', 'swordsman'], dw4u: ['Kaplica krzyżowców', 'crusader'],
      dw5: ['Klasztor', 'monk'], dw5u: ['Katedra', 'priest'], dw6: ['Ujeżdżalnia', 'cavalier'], dw6u: ['Arena czempionów', 'champion'],
      dw7: ['Portal Światła', 'lightGuard'], dw7u: ['Wieża Świtu', 'dawnbringer'],
    },
  },
  {
    id: 'sylvan', name: 'Knieja', terrain: TER.GRASS,
    desc: 'Leśne ostępy: driady, elfi łucznicy, centaury, drzewce, jednorożce, feniksy i szmaragdowe smoki.',
    heroes: [['Elandra', 'ranger', 1], ['Tarwen', 'druid'], ['Lirien', 'druid', 1], ['Gawen', 'ranger']],
    towns: ['Zielony Gaj', 'Srebrny Liść', 'Cicha Knieja', 'Jasna Polana', 'Szumiący Bór', 'Złota Paproć'],
    guild: 'Krąg druidów', emb: ['leaf', 'bow', 'horse', 'tree', 'horn', 'flame', 'dragon'],
    dw: {
      dw1: ['Gaj driad', 'dryad'], dw1u: ['Święty gaj', 'nymph'], dw2: ['Elfia strażnica', 'elfArcher'], dw2u: ['Wieża strzelców', 'elfSharp'],
      dw3: ['Zagroda centaurów', 'centaur'], dw3u: ['Obóz wodzów', 'centaurChief'], dw4: ['Stary las', 'treant'], dw4u: ['Pradawny las', 'elderTreant'],
      dw5: ['Polana jednorożców', 'unicorn'], dw5u: ['Srebrna polana', 'silverUnicorn'], dw6: ['Gniazdo feniksa', 'phoenix'], dw6u: ['Słoneczne gniazdo', 'sunPhoenix'],
      dw7: ['Szmaragdowa grota', 'emeraldDragon'], dw7u: ['Nefrytowa grota', 'jadeDragon'],
    },
  },
  {
    id: 'barrow', name: 'Kurhan', terrain: TER.DIRT,
    desc: 'Ziemie umarłych: kościotrupy, ghule, zjawy, wampiry, nekromanci, Rycerze Zagłady i kościste wywerny.',
    heroes: [['Mortis', 'necro'], ['Raga', 'necro', 1], ['Sir Kruk', 'deathKnight'], ['Zofia Czarna', 'deathKnight', 1]],
    towns: ['Czarny Kurhan', 'Mglista Krypta', 'Upiorna Dolina', 'Kościeniec', 'Wroni Jar', 'Szary Całun'],
    guild: 'Gildia nekromantów', emb: ['skull', 'grave', 'ghost', 'bat', 'moon', 'horse', 'dragon'],
    dw: {
      dw1: ['Kostnica', 'boneWarrior'], dw1u: ['Ossuarium', 'boneGuard'], dw2: ['Zapomniany cmentarz', 'ghoul'], dw2u: ['Morowy cmentarz', 'plagueGhoul'],
      dw3: ['Nawiedzona kaplica', 'wraith'], dw3u: ['Wieża zawodzenia', 'banshee'], dw4: ['Krypta', 'vampire'], dw4u: ['Mroczna krypta', 'vampireLord'],
      dw5: ['Wieża nekromanty', 'necromancer'], dw5u: ['Czarna biblioteka', 'archNecro'], dw6: ['Mroczne stajnie', 'doomKnight'], dw6u: ['Stajnie zagłady', 'dreadLord'],
      dw7: ['Kościana grań', 'boneWyvern'], dw7u: ['Upiorna grań', 'ghostWyvern'],
    },
  },
  {
    id: 'fortress', name: 'Twierdza', terrain: TER.SWAMP,
    desc: 'Bagienna warownia: gnolle, jaszczuroludzie, ważki, bazyliszki, gorgony, wywerny i hydry.',
    heroes: [['Borzywoj', 'beastmaster'], ['Wilga', 'witch', 1], ['Mszar', 'witch'], ['Dobrawa', 'beastmaster', 1]],
    towns: ['Mokradła', 'Trzcinowy Gród', 'Czarny Staw', 'Grząski Bród', 'Żabi Kamień', 'Olszowa Warownia', 'Sitowie'],
    guild: 'Chata wiedźmy', emb: ['spear', 'bow', 'wing', 'eye', 'horn', 'dragon', 'skull'],
    dw: {
      dw1: ['Nora gnolli', 'gnoll'], dw1u: ['Obóz gnolli', 'gnollMarauder'], dw2: ['Chaty jaszczurów', 'lizardman'], dw2u: ['Strażnica jaszczurów', 'lizardWarrior'],
      dw3: ['Rój ważek', 'dragonfly'], dw3u: ['Gniazdo ważek', 'venomFly'], dw4: ['Jama bazyliszków', 'basilisk'], dw4u: ['Leże bazyliszków', 'greatBasilisk'],
      dw5: ['Zagroda gorgon', 'gorgon'], dw5u: ['Żelazna zagroda', 'mightyGorgon'], dw6: ['Gniazdo wywern', 'wyvern'], dw6u: ['Turnia wywern', 'wyvernKing'],
      dw7: ['Bagno hydr', 'hydra'], dw7u: ['Otchłań chaosu', 'chaosHydra'],
    },
  },
  {
    id: 'inferno', name: 'Inferno', terrain: TER.LAVA,
    desc: 'Piekielne miasto: chochliki, gogi, piekielne ogary, demony, czarty, ifryty i diabły.',
    heroes: [['Azgar', 'demoniac'], ['Kalida', 'demoniac', 1], ['Moloch', 'heretic'], ['Wiera Popiół', 'heretic', 1]],
    towns: ['Siarkogród', 'Płonąca Brama', 'Popielisko', 'Czerwona Otchłań', 'Żarnowiec', 'Smolna Twierdza', 'Kotlina Dymów'],
    guild: 'Świątynia ognia', emb: ['bat', 'sun', 'horn', 'skull', 'flame', 'sun', 'fork'],
    dw: {
      dw1: ['Krąg chochlików', 'imp'], dw1u: ['Klatka diablików', 'familiar'], dw2: ['Hala gogów', 'gog'], dw2u: ['Kuźnia magogów', 'magog'],
      dw3: ['Psiarnia', 'hellHound'], dw3u: ['Legowisko cerberów', 'cerberus'], dw4: ['Brama demonów', 'demon'], dw4u: ['Wrota rogatych', 'hornedDemon'],
      dw5: ['Szyb czartów', 'pitFiend'], dw5u: ['Otchłań władców', 'pitLord'], dw6: ['Pałac ifrytów', 'efreet'], dw6u: ['Pałac sułtanów', 'efreetSultan'],
      dw7: ['Wrota piekieł', 'devil'], dw7u: ['Tron ognia', 'archDevil'],
    },
  },
  {
    id: 'academy', name: 'Akademia', terrain: TER.SNOW,
    desc: 'Miasto magów w ośnieżonych górach: gremliny, gargulce, golemy, magowie, dżiny, nagi i tytani.',
    heroes: [['Ostromir', 'wizard'], ['Jagna Mróz', 'wizard', 1], ['Zbylut', 'alchemist'], ['Mirosława', 'alchemist', 1]],
    towns: ['Szronowa Wieża', 'Białe Iglice', 'Lodowa Przełęcz', 'Mroźny Gród', 'Kryształowe Wzgórze', 'Śnieżna Turnia', 'Zimna Toń'],
    guild: 'Wieża wiedzy', emb: ['anvil', 'wing', 'wall', 'book', 'moon', 'eye', 'sun'],
    dw: {
      dw1: ['Warsztat', 'gremlin'], dw1u: ['Wielki warsztat', 'masterGremlin'], dw2: ['Parapet', 'stoneGargoyle'], dw2u: ['Wysoki parapet', 'obsidianGargoyle'],
      dw3: ['Kuźnia golemów', 'stoneGolem'], dw3u: ['Wielka kuźnia', 'ironGolem'], dw4: ['Wieża magów', 'mage'], dw4u: ['Wieża arcymagów', 'archMage'],
      dw5: ['Ołtarz życzeń', 'genie'], dw5u: ['Złoty ołtarz', 'masterGenie'], dw6: ['Złoty pawilon', 'naga'], dw6u: ['Pałac nag', 'nagaQueen'],
      dw7: ['Chmurna świątynia', 'giant'], dw7u: ['Niebiańska świątynia', 'titan'],
    },
  },
];
const factionOf = id => FACTIONS.find(f => f.id === id) || FACTIONS[0];
// Budowle wspólne dla frakcji. Nazwy siedlisk i gildii bierze z FACTIONS funkcja bInfo().
const BUILDINGS = [
  { id: 'hall1', name: 'Ratusz', slot: 0, cost: {}, req: [], gold: 500, emblem: 'coin', desc: 'Przynosi 500 złota dziennie.' },
  { id: 'hall2', name: 'Ratusz miejski', slot: 0, cost: { gold: 2500 }, req: ['hall1'], gold: 1000, emblem: 'coin', desc: 'Przynosi 1000 złota dziennie.' },
  { id: 'hall3', name: 'Magistrat', slot: 0, cost: { gold: 5000, wood: 10, ore: 10 }, req: ['hall2', 'guild1'], gold: 2000, emblem: 'coin', desc: 'Przynosi 2000 złota dziennie.' },
  { id: 'hall4', name: 'Kapitol', slot: 0, cost: { gold: 10000, wood: 10, ore: 10 }, req: ['hall3', 'castle'], gold: 4000, emblem: 'coin', desc: 'Przynosi 4000 złota dziennie.' },
  { id: 'fort', name: 'Fort', slot: 1, cost: { gold: 5000, wood: 20, ore: 20 }, req: [], emblem: 'wall', desc: 'Mury obronne miasta. Otwiera drogę do silniejszych siedlisk.' },
  { id: 'citadel', name: 'Cytadela', slot: 1, cost: { gold: 2500, wood: 5, ore: 5 }, req: ['fort'], emblem: 'wall', desc: 'Mocniejsze mury i wieża strzelnicza. Przyrost jednostek we wszystkich siedliskach większy o połowę.' },
  { id: 'castle', name: 'Zamek', slot: 1, cost: { gold: 5000, wood: 10, ore: 10 }, req: ['citadel'], emblem: 'wall', desc: 'Najmocniejsze mury. Przyrost jednostek we wszystkich siedliskach podwojony.' },
  { id: 'tavern', name: 'Tawerna', slot: 12, cost: { gold: 500, wood: 5 }, req: [], emblem: 'mug', desc: 'Najem bohaterów: co tydzień dwóch nowych chętnych.' },
  { id: 'market', name: 'Rynek', slot: 13, cost: { gold: 500, wood: 5 }, req: [], emblem: 'scale', desc: 'Handel surowcami. Każdy kolejny rynek w królestwie daje lepszy kurs.' },
  { id: 'silo', name: 'Skarbiec zasobów', slot: 9, cost: { gold: 5000, ore: 5 }, req: ['market'], emblem: 'barrel', desc: 'Codziennie dodaje 1 drewna i 1 rudy.' },
  { id: 'shipyard', name: 'Stocznia', cost: { gold: 2000, wood: 20 }, req: [], emblem: 'anchor', desc: 'Buduje łodzie (1000 złota i 10 drewna) na wodzie przy mieście. Tylko w mieście nad wodą.' },
  { id: 'smith', name: 'Kuźnia', slot: 8, cost: { gold: 1000, ore: 5 }, req: [], emblem: 'anvil', desc: 'Sprzedaje machiny wojenne bohaterowi stojącemu w mieście: balistę, namiot medyka i wóz z amunicją.' },
  { id: 'guild1', slot: 2, cost: { gold: 2000, wood: 5, ore: 5 }, req: ['tavern'], emblem: 'book', desc: 'Uczy bohaterów czarów 1 poziomu i odnawia im manę.' },
  { id: 'guild2', slot: 2, cost: { gold: 1000, wood: 5, ore: 5 }, req: ['guild1'], emblem: 'book', desc: 'Dodaje czary 2 poziomu.' },
  { id: 'guild3', slot: 2, cost: { gold: 1000, wood: 5, ore: 5, mercury: 4, crystal: 4 }, req: ['guild2', 'hall2'], emblem: 'book', desc: 'Dodaje czary 3 poziomu.' },
  { id: 'guild4', slot: 2, cost: { gold: 1000, wood: 5, ore: 5, mercury: 6, sulfur: 6, crystal: 6, gems: 6 }, req: ['guild3'], emblem: 'book', desc: 'Dodaje czary 4 poziomu.' },
  { id: 'guild5', slot: 2, cost: { gold: 1000, wood: 5, ore: 5, mercury: 10, sulfur: 10, crystal: 10, gems: 10 }, req: ['guild4', 'hall3'], emblem: 'book', desc: 'Dodaje czary 5 poziomu.' },
  { id: 'dw1', slot: 10, cost: { gold: 500 }, req: [] },
  { id: 'dw1u', slot: 10, cost: { gold: 1000, wood: 5 }, req: ['dw1'] },
  { id: 'dw2', slot: 11, cost: { gold: 1000, wood: 5 }, req: ['dw1'] },
  { id: 'dw2u', slot: 11, cost: { gold: 1500, wood: 5, ore: 5 }, req: ['dw2'] },
  { id: 'dw3', slot: 7, cost: { gold: 1000, ore: 5 }, req: ['fort'] },
  { id: 'dw3u', slot: 7, cost: { gold: 1500, ore: 5 }, req: ['dw3', 'citadel'] },
  { id: 'dw4', slot: 6, cost: { gold: 2000, wood: 5, ore: 5 }, req: ['fort', 'dw2'] },
  { id: 'dw4u', slot: 6, cost: { gold: 2000, wood: 5, ore: 5 }, req: ['dw4', 'smith'] },
  { id: 'dw5', slot: 5, cost: { gold: 3000, wood: 10, ore: 10 }, req: ['guild1'] },
  { id: 'dw5u', slot: 5, cost: { gold: 2000, mercury: 5 }, req: ['dw5', 'guild2'] },
  { id: 'dw6', slot: 4, cost: { gold: 5000, wood: 10, ore: 20 }, req: ['citadel', 'dw4'] },
  { id: 'dw6u', slot: 4, cost: { gold: 3000, ore: 10, crystal: 5 }, req: ['dw6'] },
  { id: 'dw7', slot: 3, cost: { gold: 15000, wood: 20, ore: 20, gems: 10 }, req: ['castle', 'dw6'] },
  { id: 'dw7u', slot: 3, cost: { gold: 10000, gems: 10, crystal: 10 }, req: ['dw7', 'guild3'] },
];
const BUILD_BY_ID = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));
// Nazwa, jednostka, symbol i opis budowli dla danej frakcji
function bInfo(B, fac) {
  const F = factionOf(fac), m = /^dw(\d)(u?)$/.exec(B.id);
  if (m) {
    const [name, unit] = F.dw[B.id], c = CREATURES[unit];
    return { name, unit, emblem: F.emb[+m[1] - 1], desc: `${m[2] ? 'Ulepszone siedlisko' : 'Siedlisko'}: ${c.plural.toLowerCase()} (poziom ${m[1]}).` };
  }
  if (B.id.startsWith('guild')) return { name: F.guild + ({ guild1: '', guild2: ' II', guild3: ' III', guild4: ' IV', guild5: ' V' })[B.id], emblem: B.emblem, desc: B.desc };
  return { name: B.name, emblem: B.emblem, desc: B.desc };
}
const MINES = {
  wood: { name: 'Tartak', income: 2 }, ore: { name: 'Kopalnia rudy', income: 2 }, mercury: { name: 'Laboratorium alchemiczne', income: 1 },
  sulfur: { name: 'Kopalnia siarki', income: 1 }, crystal: { name: 'Grota kryształów', income: 1 }, gems: { name: 'Staw klejnotów', income: 1 },
  gold: { name: 'Kopalnia złota', income: 1000 },
};
const RARE = ['mercury', 'sulfur', 'crystal', 'gems'];

