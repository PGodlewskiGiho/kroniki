// ==================== KONFIGURACJA I DANE PODSTAWOWE ====================================
// Stałe gry, surowce, poziomy trudności, rozmiary map, kolory graczy, bonusy.
const W = 800, H = 600;
const VERSION = '1.1';
// Plan rozwoju: gdzie w interfejsie obiecujemy przyszłe funkcje. Zmiana planu = zmiana tylko tutaj.
const ROADMAP = {
  later: 'w dalszym kroku',
};
const RESOURCES = [
  { id: 'wood', name: 'Drewno' }, { id: 'mercury', name: 'Rtęć' }, { id: 'ore', name: 'Ruda' },
  { id: 'sulfur', name: 'Siarka' }, { id: 'crystal', name: 'Kryształ' }, { id: 'gems', name: 'Klejnoty' },
  { id: 'gold', name: 'Złoto' },
];
const mkRes = (gold, basic, rare) => ({ wood: basic, mercury: rare, ore: basic, sulfur: rare, crystal: rare, gems: rare, gold });
const DIFFICULTIES = [
  { name: 'Łatwy', rating: 80, res: mkRes(30000, 30, 15) },
  { name: 'Normalny', rating: 100, res: mkRes(20000, 20, 10) },
  { name: 'Trudny', rating: 130, res: mkRes(15000, 15, 7) },
  { name: 'Ekspert', rating: 160, res: mkRes(10000, 10, 4) },
  { name: 'Niemożliwy', rating: 200, res: mkRes(0, 0, 0) },
];
const MAP_SIZES = [
  { id: 'S', name: 'Mała', n: 36 }, { id: 'M', name: 'Średnia', n: 72 },
  { id: 'L', name: 'Duża', n: 108 }, { id: 'XL', name: 'Olbrzymia', n: 144 },
];
const PLAYER_COLORS = [
  { id: 'red', name: 'Czerwony', hex: '#c42a2a' }, { id: 'blue', name: 'Niebieski', hex: '#2f5bd0' },
  { id: 'green', name: 'Zielony', hex: '#2f8f3a' }, { id: 'purple', name: 'Fioletowy', hex: '#8040b0' },
];
const NEUTRAL_COLOR = '#d8d4c8'; // flagi i znaczniki obiektów bez właściciela (mapa, minimapa, interfejs)
const BONUSES = [
  { id: 'gold', name: 'Złoto', sub: '500–1000' },
  { id: 'resource', name: 'Zasoby', sub: 'drewno i ruda' },
  { id: 'artifact', name: 'Artefakt', sub: 'losowy' },
];
const WEEK_NAMES = ['Jelenia', 'Sowy', 'Borsuka', 'Sokoła', 'Niedźwiedzia', 'Lisa', 'Wilka', 'Kruka', 'Żubra', 'Bociana'];

