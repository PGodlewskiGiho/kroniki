// ==================== STAN GRY I USTAWIENIA =============================================
// G trzyma stan programu; G.state to stan jednej rozgrywki (to, co kiedyś trafi do zapisu gry).
const G = {
  canvas: null, ctx: null, scale: 1, dpr: 1, time: 0, last: 0,
  screens: {}, screen: null, screenName: '',
  mouse: { x: -1, y: -1, down: false },
  hover: null, downTarget: null, modal: null, keys: new Set(), popup: null, pressTimer: 0, longPress: false,
  fade: { a: 1, target: 0, next: null },
  settings: { mapSize: 'M', difficulty: 1, color: 'red', faction: 'haven', bonus: 'gold', opponents: 1, slots: null, quality: 'auto', font: 'pixel', aiMoves: 'fast' }, rs: 1,
  state: null,
};
function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem('kk_settings') || 'null'); if (s) Object.assign(G.settings, s); } catch (e) {}
  const S = G.settings;
  delete S.gfx; // ustawienie z dawnego trybu grafiki wektorowej
  if (!MAP_SIZES.some(m => m.id === S.mapSize)) S.mapSize = 'M';
  if (!(S.difficulty >= 0 && S.difficulty < DIFFICULTIES.length)) S.difficulty = 1;
  if (!PLAYER_COLORS.some(c => c.id === S.color)) S.color = 'red';
  if (!BONUSES.some(b => b.id === S.bonus)) S.bonus = 'gold';
  if (!FACTIONS.some(f => f.id === S.faction)) S.faction = 'haven';
  delete S.sfx; delete S.mus; // głośności z czasów, gdy gra miała dźwięk
  if (!['auto', 'high', 'low'].includes(S.quality)) S.quality = 'auto';
  if (!['pixel', 'classic'].includes(S.font)) S.font = 'pixel'; // czcionka: pikselowa (domyślna) albo klasyczna (szeryfowa)
  if (!AI_MOVES.some(m => m.id === S.aiMoves)) S.aiMoves = 'fast';
  S.rules = validRules(S.rules);
  if (!(S.autoDpr >= 0.5 && S.autoDpr <= 2)) delete S.autoDpr;
  S.slots = validSlots(S.slots) || legacySlots(S);
}
// Miejsca graczy na ekranie nowej gry: 8 miejsc { type: 'human' | 'ai' | 'off', color, faction ('random' = losowa) }.
// Kolejność miejsc = kolejność tur. Stare ustawienia (kolor, frakcja, liczba rywali) zamieniamy na miejsca.
const SLOT_TYPES = ['human', 'ai', 'off'];
function validSlots(a) {
  if (!Array.isArray(a) || a.length !== MAX_PLAYERS) return null;
  const used = new Set(), out = a.map(o => ({ type: SLOT_TYPES.includes(o && o.type) ? o.type : 'off', color: o && o.color, name: o && typeof o.name === 'string' ? o.name.trim().slice(0, 16) : '', faction: o && (o.faction === 'random' || FACTIONS.some(f => f.id === o.faction)) ? o.faction : 'random' }));
  for (const o of out) { if (!PLAYER_COLORS.some(c => c.id === o.color) || used.has(o.color)) o.color = null; else used.add(o.color); }
  for (const o of out) if (!o.color) { o.color = PLAYER_COLORS.find(c => !used.has(c.id)).id; used.add(o.color); }
  if (!out.some(o => o.type === 'human')) out[0].type = 'human';
  return out;
}
function legacySlots(S) {
  const colors = [S.color || 'red', ...PLAYER_COLORS.map(c => c.id).filter(id => id !== (S.color || 'red'))], foes = S.opponents == null ? 1 : S.opponents;
  return colors.map((color, i) => ({ type: i === 0 ? 'human' : i <= foes ? 'ai' : 'off', color, faction: i === 0 ? S.faction || 'haven' : 'random' }));
}
// Aktywne miejsca do createNewGame. Bez S.slots (testy, stare ustawienia) liczą się kolor, frakcja i liczba rywali.
const playerSlots = S => (validSlots(S.slots) || legacySlots(S)).filter(o => o.type !== 'off');
// Zasady gry (ekran „Zasady” przy nowej grze): trafiają do st.settings.rules; stare zapisy bez nich mają wartości domyślne
const RULES = [
  { id: 'heroes', name: 'Limit bohaterów', def: 8, tip: 'Ilu bohaterów może mieć każdy gracz naraz (także komputer). Mało bohaterów: wolniejsza, spokojniejsza gra jednym wodzem.',
    opts: [1, 2, 3, 4, 5, 6, 7, 8].map(v => ({ v, name: String(v) })) },
  { id: 'truce', name: 'Rozejm', def: 'auto', tip: 'Przez ile dni komputer nie atakuje miast ani bohaterów ludzi. „Wg trudności”: Łatwy 21, Normalny 14, Trudny 7, wyżej 0.',
    opts: [{ v: 'auto', name: 'Wg trudności' }, { v: 0, name: 'Brak' }, { v: 7, name: 'Tydzień' }, { v: 14, name: '2 tygodnie' }, { v: 28, name: 'Miesiąc' }] },
  { id: 'monsters', name: 'Potwory', def: 1, tip: 'Liczebność potworów neutralnych na mapie (strażników kopalni, skarbów i przejść).',
    opts: [{ v: 0.6, name: 'Słabe' }, { v: 1, name: 'Zwykłe' }, { v: 1.5, name: 'Silne' }, { v: 2.2, name: 'Zabójcze' }] },
  { id: 'treasure', name: 'Skarby', def: 1, tip: 'Ile dają leżące na mapie surowce i skrzynie.',
    opts: [{ v: 0.6, name: 'Skąpo' }, { v: 1, name: 'Zwykle' }, { v: 1.6, name: 'Hojnie' }] },
  { id: 'reveal', name: 'Mapa', def: false, tip: 'Odkryta: wszyscy od początku widzą cały teren i obiekty (bez mgły wojny na starcie).',
    opts: [{ v: false, name: 'Zakryta' }, { v: true, name: 'Odkryta' }] },
];
function validRules(r) { const out = {}; for (const R of RULES) out[R.id] = r && R.opts.some(o => o.v === r[R.id]) ? r[R.id] : R.def; return out; }
const rule = (st, id) => { const r = st.settings.rules, R = RULES.find(q => q.id === id); return r && R.opts.some(o => o.v === r[id]) ? r[id] : R.def; };
const heroLimit = st => rule(st, 'heroes');
// Ruchy komputera na mapie: czas jednego kroku bohatera (0 = nie pokazujemy, mapa zmienia się od razu)
const AI_MOVES = [{ id: 'fast', name: 'szybkie', step: 0.045 }, { id: 'normal', name: 'zwykłe', step: STEP_TIME }, { id: 'off', name: 'ukryte', step: 0 }];
const aiMoves = () => AI_MOVES.find(m => m.id === G.settings.aiMoves) || AI_MOVES[0];
function saveSettings() { try { localStorage.setItem('kk_settings', JSON.stringify(G.settings)); } catch (e) {} }
const colorHex = id => (PLAYER_COLORS.find(c => c.id === id) || PLAYER_COLORS[0]).hex;
// --- skróty do stanu rozgrywki (st = G.state) ---
// ME = numer gracza-człowieka, który teraz gra (w hot-seat zmienia się co turę: setViewer). Mgła, surowce i „ty” w tekstach dotyczą jego.
let ME = 0;
const human = st => st.players[ME];
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const humanCount = st => st.players.filter(p => p.human).length;
const hotseat = st => humanCount(st) > 1; // gra hot-seat (zwycięzca = ostatni gracz na placu)
const sharedScreen = st => st.players.filter(p => p.human && !p.out).length > 1; // zasłona między turami: przy ekranie więcej niż jeden człowiek
// Imię gracza wpisane na ekranie nowej gry (hot-seat), inaczej „gracz <kolor>”
const playerName = (st, id) => st.players[id].name || `gracz ${(PLAYER_COLORS.find(c => c.id === st.players[id].color) || PLAYER_COLORS[0]).name.toLowerCase()}`;
const playerOf = (st, owner) => st.players[owner]; // gracz o danym numerze (surowce, frakcja, odkryta mapa)
const ownerName = (st, owner) => (owner === ME ? 'ty' : st.players[owner] ? playerName(st, owner) : 'nikt');
const ownerColor = (st, owner) => (st.players[owner] ? colorHex(st.players[owner].color) : NEUTRAL_COLOR);
// Wybrany bohater gracza-człowieka; null, gdy gracz nie ma już bohaterów (może wtedy nająć nowego w tawernie)
const hero = st => { const h = st.heroes[st.selHero || 0]; return h && h.owner === ME ? h : st.heroes.find(o => o.owner === ME) || null; };
// Bohater na polu mapy; bohater w garnizonie miasta (h.garrison = id miasta) jest w murach, nie na mapie
const heroAt = (st, x, y) => st.heroes.find(h => h.x === x && h.y === y && h.garrison == null) || null;
const heroClass = h => HERO_CLASSES[h.cls] || HERO_CLASSES.knight;
const heroTitle = h => `${h.name}, ${(h.female ? heroClass(h).nameF : heroClass(h).name).toLowerCase()}`;
const dateText = st => `Miesiąc ${st.month}, tydzień ${st.week}, dzień ${st.day}`;
const weekName = st => weekInfo(st).name; // tygodnie z efektem: ZASADY GRY (weekInfo)
const resName = id => RESOURCES.find(r => r.id === id).name;

