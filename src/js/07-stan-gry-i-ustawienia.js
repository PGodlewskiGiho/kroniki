// ==================== STAN GRY I USTAWIENIA =============================================
// G trzyma stan programu; G.state to stan jednej rozgrywki (to, co kiedyś trafi do zapisu gry).
const G = {
  canvas: null, ctx: null, scale: 1, dpr: 1, time: 0, last: 0,
  screens: {}, screen: null, screenName: '',
  mouse: { x: -1, y: -1, down: false },
  hover: null, downTarget: null, modal: null, keys: new Set(), popup: null, pressTimer: 0, longPress: false,
  fade: { a: 1, target: 0, next: null },
  settings: { mapSize: 'M', difficulty: 1, color: 'red', faction: 'haven', bonus: 'gold', opponents: 1 }, rs: 1,
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
}
function saveSettings() { try { localStorage.setItem('kk_settings', JSON.stringify(G.settings)); } catch (e) {} }
const colorHex = id => (PLAYER_COLORS.find(c => c.id === id) || PLAYER_COLORS[0]).hex;
// --- skróty do stanu rozgrywki (st = G.state) ---
const ME = 0; // indeks gracza-człowieka; przeciwnicy komputerowi dostaną kolejne numery
const human = st => st.players[ME];
const playerOf = (st, owner) => st.players[owner]; // gracz o danym numerze (surowce, frakcja, odkryta mapa)
const ownerName = (st, owner) => (owner === ME ? 'ty' : st.players[owner] ? `gracz ${(PLAYER_COLORS.find(c => c.id === st.players[owner].color) || PLAYER_COLORS[0]).name.toLowerCase()}` : 'nikt');
const ownerColor = (st, owner) => (st.players[owner] ? colorHex(st.players[owner].color) : NEUTRAL_COLOR);
// Wybrany bohater gracza-człowieka; null, gdy gracz nie ma już bohaterów (może wtedy nająć nowego w tawernie)
const hero = st => { const h = st.heroes[st.selHero || 0]; return h && h.owner === ME ? h : st.heroes.find(o => o.owner === ME) || null; };
const heroAt = (st, x, y) => st.heroes.find(h => h.x === x && h.y === y) || null;
const heroClass = h => HERO_CLASSES[h.cls] || HERO_CLASSES.knight;
const heroTitle = h => `${h.name}, ${(h.female ? heroClass(h).nameF : heroClass(h).name).toLowerCase()}`;
const dateText = st => `Miesiąc ${st.month}, tydzień ${st.week}, dzień ${st.day}`;
const weekName = st => WEEK_NAMES[thash(st.week, st.month, st.seed) % WEEK_NAMES.length];
const resName = id => RESOURCES.find(r => r.id === id).name;

