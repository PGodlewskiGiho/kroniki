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
const SITE_COUNT = { 36: 4, 72: 6, 108: 8, 144: 10 }; // miejsca pod miasta = najwięcej graczy na mapie
const STEP_TIME = 0.14, HERO_SIGHT = 5;
// Rodzaj krainy (opcja nowej gry): proporcje terenu. water – część mapy pod wodą, ranges – mnożnik pasm górskich, forest – próg lasu
// (mniej = więcej lasu), rivers – mnożnik rzek, cold/hot – część mapy w mrozie i w upale, swamp – próg bagien, shapes – możliwe kształty świata
const LAND_TYPES = [
  { id: 'random', name: 'Losowa', desc: 'kraina losowana przy każdej nowej grze' },
  { id: 'mixed', name: 'Umiarkowana', desc: 'łąki, lasy i góry po równo', water: 0.2, ranges: 1, forest: 0.64, rivers: 1, cold: 0.12, hot: 0.14, swamp: 0.88 },
  { id: 'mountains', name: 'Górzysta', desc: 'gęste pasma, wąskie doliny i przełęcze', water: 0.16, ranges: 2.3, rangeW: 1.35, forest: 0.68, rivers: 1.4, cold: 0.2, hot: 0.12, swamp: 0.94 },
  { id: 'forest', name: 'Leśna', desc: 'wielkie puszcze z polanami, drogi przez gąszcz', water: 0.18, ranges: 0.7, forest: 0.42, rivers: 1.2, cold: 0.1, hot: 0.08, swamp: 0.86 },
  { id: 'desert', name: 'Pustynna', desc: 'piaski, oazy i wulkaniczne pustkowia', sandM: 0.9, water: 0.12, ranges: 0.8, forest: 0.86, rivers: 0.4, cold: 0.02, hot: 0.6, swamp: 0.97 },
  { id: 'frost', name: 'Mroźna', desc: 'śniegi i lodowe pustkowia, tajga na skraju', water: 0.2, ranges: 1.2, forest: 0.6, rivers: 0.7, cold: 0.55, hot: 0.03, swamp: 0.95 },
  { id: 'marsh', name: 'Rzeczna', desc: 'wiele rzek, rozlewiska i bagna', water: 0.22, ranges: 0.8, forest: 0.6, rivers: 2.6, cold: 0.08, hot: 0.1, swamp: 0.7 },
  { id: 'islands', name: 'Wyspiarska', desc: 'poszarpane wybrzeże, zatoki i wysepki ze skarbami (łodzie)', water: 0.42, ranges: 0.8, forest: 0.62, rivers: 0.6, cold: 0.1, hot: 0.14, swamp: 0.9, shapes: ['islands'] },
];
// Kształt świata (losowany): kontynent w morzu, wybrzeże (morze z 1–2 stron), morze śródlądowe, dwie krainy z przesmykiem, ląd z jeziorami
const MAP_SHAPES = { continent: 'kontynent', coast: 'wybrzeże', inland: 'morze śródlądowe', isthmus: 'dwie krainy z przesmykami', lakes: 'kraina jezior', islands: 'archipelag' };
// Podziemia (opcja nowej gry): mapa ma bok 2·ln; powierzchnia w lewej górnej ćwiartce (0..ln-1), podziemia w prawej dolnej
// (ln..2ln-1); pozostałe dwie ćwiartki to lita skała, której nie widać. Przejścia między poziomami: pary bram (SITES.gate).
// Bez podziemi ln nie istnieje i poziom jest jeden (cała mapa).
const UNDER_GATES = { S: 2, M: 3, L: 4, XL: 5 };
const levelSize = map => map.ln || map.n;
const levelOf = (map, x, y) => (map.ln && x >= map.ln && y >= map.ln ? 1 : 0);
const levelOrigin = (map, L) => (L ? map.ln : 0);

