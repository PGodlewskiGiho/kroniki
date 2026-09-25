// ==================== ZAPIS I ODCZYT GRY ================================================
// Zapis = zwykły obiekt JSON (serializeGame) w jednym z miejsc (SaveStore): na koncie Claude
// (magazyn db opublikowanej strony, prywatny dla każdego gracza) albo w pamięci przeglądarki.
// Tablice mapy kodujemy RLE + base64, bo teren składa się z długich ciągów tych samych wartości.
const SAVE_VERSION = 1;
const SAVE_SLOTS = ['auto', '1', '2', '3', '4', '5'];
const slotName = s => (s === 'auto' ? 'Autozapis' : `Zapis ${s}`);
function packBytes(a) {
  const out = [];
  for (let i = 0; i < a.length;) { const v = a[i]; let k = 1; while (i + k < a.length && a[i + k] === v && k < 255) k++; out.push(v, k); i += k; }
  let s = ''; for (let i = 0; i < out.length; i += 0x4000) s += String.fromCharCode.apply(null, out.slice(i, i + 0x4000));
  return btoa(s);
}
function unpackBytes(b64, len) {
  const s = atob(b64), a = new Uint8Array(len); let p = 0;
  for (let i = 0; i + 1 < s.length; i += 2) { const k = s.charCodeAt(i + 1); a.fill(s.charCodeAt(i), p, p + k); p += k; }
  if (p !== len) throw new Error('uszkodzone dane mapy'); return a;
}
// Stan gry -> dane do zapisu. Pomijamy to, co da się odtworzyć (indeksy obiektów) albo jest chwilowe (animacje).
function serializeGame(st) {
  const m = st.map;
  return {
    v: SAVE_VERSION,
    core: { seed: st.seed, day: st.day, week: st.week, month: st.month, dayTotal: st.dayTotal, settings: st.settings, bonusText: st.bonusText, selHero: st.selHero, cam: st.cam, cur: st.cur || 0 },
    map: { n: m.n, seed: m.seed, sites: m.sites, startIdx: Math.max(0, m.sites.indexOf(m.start)), terrain: packBytes(m.terrain), obst: packBytes(m.obst), road: packBytes(m.road) },
    players: st.players.map(p => ({ ...p, explored: packBytes(p.explored) })),
    heroes: st.heroes.map(h => ({ ...h, anim: null, pending: null, moving: false, stop: false, prev: null })),
    towns: st.towns, objects: st.objects,
  };
}
function deserializeGame(d) {
  if (!d || d.v !== SAVE_VERSION) throw new Error('zapis pochodzi z innej wersji gry');
  const n = d.map.n, N = n * n;
  const map = { n, seed: d.map.seed, sites: d.map.sites, terrain: unpackBytes(d.map.terrain, N), obst: unpackBytes(d.map.obst, N), road: unpackBytes(d.map.road, N) };
  map.start = map.sites[d.map.startIdx] || map.sites[0];
  const st = { ...d.core, map, players: d.players.map(p => ({ ...p, explored: unpackBytes(p.explored, N) })), heroes: d.heroes, towns: d.towns, objects: d.objects };
  // zapisy sprzed rekrutacji: brak armii bohatera, garnizonu i puli jednostek
  const r = mulberry32(st.seed);
  for (const h of st.heroes) { if (!Array.isArray(h.army)) h.army = startingArmy(st.players[h.owner].faction, r); delete h.slowest; initHeroProgress(h); while (h.exp >= expForLevel(h.level + 1)) h.level++; }
  for (const t of st.towns) { if (!Array.isArray(t.garrison) || t.garrison.length !== ARMY_SLOTS) t.garrison = emptyArmy(); if (!t.avail) t.avail = {}; for (let L = 1; L <= guildLevel(t); L++) if (!t.guild || !t.guild[L]) rollGuildLevel(st, t, L); }
  // zapisy sprzed hot-seat: jeden człowiek (numer 0), powitanie już było
  if (!(st.cur >= 0 && st.players[st.cur] && st.players[st.cur].human)) st.cur = st.players.findIndex(p => p.human);
  for (const p of st.players) if (p.human && p.welcomed === undefined) p.welcomed = true;
  ME = st.cur; rebuildObjIndex(st); return st;
}
// Krótki opis zapisu do listy slotów (bez wczytywania całej gry)
function saveMeta(st) {
  const h = st.heroes.find(x => x.owner === ME);
  return { hero: h ? h.name : '', faction: factionOf(human(st).faction).name, date: dateText(st), size: (MAP_SIZES.find(m => m.id === st.settings.mapSize) || MAP_SIZES[0]).name, at: Date.now() };
}
const canSaveNow = st => !!st && !st.heroes.some(h => h.moving || h.anim || h.pending) && !(G.screens.adventure && G.screens.adventure.aiRun);
// Miejsce zapisu. Na opublikowanej stronie: db (dokumenty data/users/<id>/save_<slot>, widoczne tylko
// dla danego gracza). Bez db (plik otwarty lokalnie, podgląd): localStorage tej przeglądarki.
const SaveStore = {
  backend: null, db: null, uid: null, ready: null, queue: Promise.resolve(),
  init() {
    if (!this.ready) this.ready = (async () => {
      try {
        if (window.claude && typeof window.claude.use === 'function') {
          const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
          const uid = user ? await user.id() : null;
          if (db && uid) { this.db = db; this.uid = uid; this.backend = 'db'; return; }
        }
      } catch (e) { /* brak db: zostaje przeglądarka */ }
      this.backend = 'local';
    })();
    return this.ready;
  },
  where() { return this.backend === 'db' ? 'na twoim koncie Claude' : 'w tej przeglądarce'; },
  ref(slot) { return this.db.collection('data/users/' + this.uid).doc('save_' + slot); },
  async list() {
    await this.init(); const out = {};
    if (this.backend === 'db') { const qs = await this.db.collection('data/users/' + this.uid).get(); for (const d of qs.docs) if (d.id.startsWith('save_')) out[d.id.slice(5)] = (d.data() || {}).meta; }
    else for (const s of SAVE_SLOTS) { try { const r = JSON.parse(localStorage.getItem('kk_save_' + s) || 'null'); if (r) out[s] = r.meta; } catch (e) {} }
    return out;
  },
  async read(slot) {
    await this.init();
    if (this.backend === 'db') { const d = await this.ref(slot).get(); return d.exists ? d.data() : null; }
    return JSON.parse(localStorage.getItem('kk_save_' + slot) || 'null');
  },
  // Zapisy idą po kolei (jeden zapis naraz do dokumentu), błąd odrzuca obietnicę tego zapisu
  write(slot, st) {
    const rec = { meta: saveMeta(st), game: serializeGame(st) };
    const job = this.queue.then(async () => {
      await this.init();
      if (this.backend === 'db') await this.ref(slot).set(rec); else localStorage.setItem('kk_save_' + slot, JSON.stringify(rec));
    });
    this.queue = job.catch(() => {}); return job;
  },
};
async function loadGameFrom(slot) {
  const rec = await SaveStore.read(slot);
  if (!rec || !rec.game) throw new Error('ten slot jest pusty');
  return deserializeGame(rec.game);
}

