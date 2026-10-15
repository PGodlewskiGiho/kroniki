// ==================== POMIAR BALANSU BOHATERÓW ===========================================
// Indeks siły klasy: ile razy większą armię wroga pokona armia z bohaterem danej klasy i poziomu względem tej samej armii
// bez bohatera (k50: liczebność wroga, przy której wygrywa połowę bitew; szukanie połówkowe, kilka ziaren na krok).
// Armia rośnie z poziomem jak w grze (pomiar postępu w grach komputerów: poziom 10 około 8. tygodnia), każda klasa walczy armią
// swojej frakcji, wróg to armia Twierdzy z tego samego tygodnia. Bohater bez specjalności i artefaktów, umiejętności i talenty
// wybiera SI, magowie znają czary z gildii swojej frakcji (poziom gildii rośnie z poziomem bohatera).
// Używają tego tools/balans/bohaterowie.js (pełny pomiar) i tests/balans-klas.test.js (krótki, pilnuje celu w CI).
// Cel: na każdym poziomie każda klasa w granicach ±BALANCE_TARGET średniej, magowie i wojownicy średnio równo.
// BALANCE_GUARD to granica, którą test pilnuje (średnia magów do średniej wojowników). Etap 7: mag/wojownik 0,99–1,13 od 5. poziomu,
// rozrzut klas 19–28% (poziom 1: magowie silniejsi, 48%); dalsze zbliżanie do ±10% wymaga dokładniejszego pomiaru (więcej prób).
const BALANCE_TARGET = 0.10, BALANCE_GUARD = 0.15;
const BalanceLab = {
  UNLOCK: [0, 1, 1, 2, 2, 3, 4, 5], // tydzień, od którego armia ma stwory danego poziomu
  week: L => 1 + 0.7 * (L - 1),
  guild: L => (L < 4 ? 1 : L < 8 ? 2 : L < 12 ? 3 : L < 16 ? 4 : 5),
  // stan gry do pomiarów (bez wpływu na bieżącą grę: G.state wraca po pomiarze)
  setup() {
    const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'S', land: 'mixed', slots: null, opponents: 1, faction: 'haven', underground: false }), 4242);
    return { st, t0: st.towns.find(t => t.owner === 0), base: {} };
  },
  // armia frakcji w tygodniu odpowiadającym poziomowi L: przyrost siedlisk od ich otwarcia, werbowane ~70%; k: mnożnik liczebności
  army(fac, L, k = 1) {
    const F = factionOf(fac), w = this.week(L), out = [];
    for (let c = 1; c <= 7; c++) { const cid = F.dw['dw' + c][1], n = Math.round(CREATURES[cid].growth * Math.max(0, w - this.UNLOCK[c] + 1) * 0.7 * k); if (n > 0) out.push([cid, n]); }
    return out;
  },
  withArmy(h, fac, L) { h.army = this.army(fac, L).map(([cid, n]) => ({ cid, n })); while (h.army.length < 7) h.army.push(null); return h; },
  hero(lab, cls, L, seed) {
    const { st, t0 } = lab, fac = CLASS_FACTION[cls];
    st.heroes = st.heroes.filter(h => h.owner !== 0);
    const h = createHero(st, 0, t0.x, t0.y, { name: 'Próba', cls, female: false, fac }); h.owner = 0;
    st.seed = seed; gainExp(st, h, Math.max(0, expForLevel(L) - h.exp), null, true);
    if (h.book) { const town = { faction: fac, guild: {}, built: [], id: seed % 97 };
      for (let g = 1; g <= Math.min(this.guild(L), guildMax(fac)); g++) { rollGuildLevel(st, town, g); for (let k = 1; k <= Math.min(g, spellCap(h)); k++) for (const id of town.guild[k] || []) if (!knows(h, id)) h.spells.push(id); } }
    this.withArmy(h, fac, L); h.mana = heroMaxMana(h); return h;
  },
  bare(lab, cls, L) {
    const h = this.hero(lab, cls, 1, 1); h.stats = { att: 0, def: 0, sp: 0, kn: 0 }; h.skills = []; h.spells = []; h.book = false; h.talents = []; h.mastery = null;
    return this.withArmy(h, CLASS_FACTION[cls], L);
  },
  fight(lab, h, L, k, seed) {
    const st = lab.st, foe = { type: 'bank', id: 900 + seed, guards: this.army('fortress', L, k) }; st.seed = 7000 + seed * 131; st.dayTotal = 1 + seed;
    const keep = h.army.map(s => s && { ...s }); h.mana = heroMaxMana(h); const B = createBattle(st, h, foe); simulateBattle(B); h.army = keep; return B.over === 'win';
  },
  k50(lab, make, L, trials = 6, iters = 9) {
    let lo = 0.1, hi = 10;
    for (let it = 0; it < iters; it++) { const mid = Math.sqrt(lo * hi); let w = 0; for (let s = 0; s < trials; s++) if (this.fight(lab, make(s), L, mid, s)) w++; if (w * 2 >= trials) lo = mid; else hi = mid; }
    return Math.sqrt(lo * hi);
  },
  // indeks siły klasy na poziomie L (bazowa armia bez bohatera liczona raz na frakcję i poziom)
  index(lab, cls, L, trials = 6, iters = 9) {
    const prev = G.state; G.state = lab.st;
    try {
      const bk = `${CLASS_FACTION[cls]}_${L}_${trials}_${iters}`; if (!lab.base[bk]) lab.base[bk] = this.k50(lab, () => this.bare(lab, cls, L), L, trials, iters);
      const cache = {}, k = this.k50(lab, s => cache[s] || (cache[s] = this.hero(lab, cls, L, 100 + s * 17)), L, trials, iters);
      return { index: k / lab.base[bk], hero: cache[0] || this.hero(lab, cls, L, 100) };
    } finally { G.state = prev; }
  },
  // wartość na mapie ponad bohatera bez rozwoju: ruch, złoto dziennie, zasięg widzenia
  mapValue(lab, h, cls, L) {
    const prev = G.state; G.state = lab.st;
    try { const b = this.bare(lab, cls, L);
      return { mp: heroMaxMP(h) - heroMaxMP(b), gold: heroBonus(h, 'gold') + skillVal(h, 'estates') + (heroPerk(h, 'treasurer') ? 500 : 0) + (pathV(h, 'governor') || [0])[0], sight: heroSight(h) - heroSight(b) };
    } finally { G.state = prev; }
  },
};
