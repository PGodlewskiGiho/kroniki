// ==================== KONFIGURACJA I DANE PODSTAWOWE ====================================
// Stałe gry, surowce, poziomy trudności, rozmiary map, kolory graczy, bonusy.
// W×H: obszar, dla którego zaprojektowano ekrany i okna (wyśrodkowany w oknie przeglądarki).
// VW×VH: całe okno w tych samych jednostkach (co najmniej W×H, dopasowane do proporcji ekranu);
// OX, OY: przesunięcie obszaru W×H w oknie. Ekrany z fill: true (mapa przygody) rysują w całym oknie.
const W = 800, H = 600, VW_MAX = 1440, VH_MAX = 800;
let VW = W, VH = H, OX = 0, OY = 0;
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
  { id: 'orange', name: 'Pomarańczowy', hex: '#e07818' }, { id: 'teal', name: 'Turkusowy', hex: '#1f9a9a' },
  { id: 'pink', name: 'Różowy', hex: '#d0508e' }, { id: 'tan', name: 'Płowy', hex: '#a88450' },
];
const MAX_PLAYERS = 8; // hot-seat: do 8 graczy (ludzie i komputer) na jednej mapie, każdy w innym kolorze
const NEUTRAL_COLOR = '#d8d4c8'; // flagi i znaczniki obiektów bez właściciela (mapa, minimapa, interfejs)
const BONUSES = [
  { id: 'gold', name: 'Złoto', sub: '500–1000' },
  { id: 'resource', name: 'Zasoby', sub: 'drewno i ruda' },
  { id: 'artifact', name: 'Artefakt', sub: 'losowy' },
];
const WEEK_NAMES = ['Jelenia', 'Sowy', 'Borsuka', 'Sokoła', 'Niedźwiedzia', 'Lisa', 'Wilka', 'Kruka', 'Żubra', 'Bociana'];

// Dane binarne wbudowane przez build.js (grafiki, dźwięki) w kodzie 85-znakowym: 5 znaków = 4 bajty, pierwszy znak = dopełnienie.
const B85 = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).filter(c => !'"$%&\'<>\\`'.includes(c)).join('');
const B85I = new Uint8Array(128); for (let i = 0; i < 85; i++) B85I[B85.charCodeAt(i)] = i;
function unpackBin(s) {
  const pad = B85I[s.charCodeAt(0)], out = new Uint8Array((s.length - 1) / 5 * 4);
  for (let i = 1, o = 0; i < s.length; i += 5) {
    const v = (((B85I[s.charCodeAt(i)] * 85 + B85I[s.charCodeAt(i + 1)]) * 85 + B85I[s.charCodeAt(i + 2)]) * 85 + B85I[s.charCodeAt(i + 3)]) * 85 + B85I[s.charCodeAt(i + 4)];
    out[o++] = v >>> 24; out[o++] = (v >>> 16) & 255; out[o++] = (v >>> 8) & 255; out[o++] = v & 255;
  }
  return pad ? out.subarray(0, out.length - pad) : out;
}
const binUrl = (s, type) => URL.createObjectURL(new Blob([unpackBin(s)], { type })); // adres obrazka bez kopii w base64
