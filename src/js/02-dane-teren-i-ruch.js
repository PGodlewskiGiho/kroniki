// ==================== DANE: TEREN I RUCH ================================================
// Rodzaje terenu, przeszkody, drogi, koszty ruchu.
const T = 32, CHUNK = 8;
const TER = { WATER: 0, GRASS: 1, DIRT: 2, SAND: 3, SNOW: 4, SWAMP: 5, ROUGH: 6, LAVA: 7 };
// cost: koszt ruchu jak w oryginale (100 = normalny krok)
// pal: paleta pikselowa [ciemny, bazowy, jasny, akcent]; bazowy kolor trafia też na minimapę
const TERRAINS = [
  { name: 'Woda', cost: 0, pal: ['#1d4c8a', '#245a9a', '#2f6aac', '#6a9fd4'] },
  { name: 'Trawa', cost: 100, pal: ['#3c7a2a', '#4b8f32', '#5ea23e', '#86c25a'] },
  { name: 'Ziemia', cost: 100, pal: ['#735432', '#8a6a3e', '#9e7c4a', '#5a4226'] },
  { name: 'Piasek', cost: 150, pal: ['#c9b074', '#d8c388', '#e6d49c', '#b39660'] },
  { name: 'Śnieg', cost: 150, pal: ['#c8d6e4', '#e2e9f1', '#f4f8fb', '#a6bad2'] },
  { name: 'Bagno', cost: 175, pal: ['#3e5638', '#4c6444', '#5c7650', '#2c4636'] },
  { name: 'Nierówny teren', cost: 125, pal: ['#7e6e4a', '#94825a', '#a8966c', '#65573a'] },
  { name: 'Lawa', cost: 100, pal: ['#2a201d', '#3a2c28', '#4a3a34', '#ff6a1a'] },
];
const OBST = { NONE: 0, TREE: 1, MOUNT: 2, ROCK: 3 };
const OBST_NAMES = ['', 'las', 'góry', 'skały'];
const ROADS = [null,
  { name: 'droga gruntowa', cost: 75, pal: ['#6e5230', '#9a7646', '#b08a56'] },
  { name: 'droga żwirowa', cost: 65, pal: ['#7c7668', '#a8a292', '#c4bfb0'] },
  { name: 'droga brukowana', cost: 50, pal: ['#8c826e', '#bdb29c', '#ddd4c0'] },
];
const DX8 = [1, -1, 0, 0, 1, 1, -1, -1], DY8 = [0, 0, 1, -1, 1, -1, 1, -1];
const SITE_COUNT = { 36: 3, 72: 5, 108: 7, 144: 9 };
const STEP_TIME = 0.14, HERO_SIGHT = 5;

