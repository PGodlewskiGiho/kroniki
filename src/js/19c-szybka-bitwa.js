// ==================== SZYBKA BITWA =======================================================
// Bitwa bez mapy (menu główne): dwie frakcje i ich bohaterowie (losowi albo wybrani), siła armii (tygodnie przyrostu wszystkich siedlisk), poziom bohaterów i ulepszenia.
// Pod spodem mała, chwilowa gra (createNewGame) z bohaterami obu stron; po walce raport i powrót tutaj (można od razu powtórzyć).
const QUICK_LEVELS = [1, 5, 10, 15, 20], QUICK_DEF = { a: 'haven', b: 'barrow', ha: 'random', hb: 'random', weeks: 2, lvl: 1, up: 0 };
// Armia z przyrostu: każdy z 7 poziomów siedlisk, stopień 0 = podstawowe, 1 = ulepszone, 2 = drugi stopień ulepszenia (gdy jest)
function quickArmy(fac, weeks, up) {
  const F = factionOf(fac), suf = ['', 'u', 'x'][up] || '';
  return [1, 2, 3, 4, 5, 6, 7].map(L => { const d = F.dw['dw' + L + suf] || F.dw['dw' + L + (up ? 'u' : '')] || F.dw['dw' + L], cid = d[1]; return { cid, n: Math.max(1, Math.round(CREATURES[cid].growth * weeks)) }; });
}
function quickBattleState(Q) {
  const slots = Array.from({ length: 8 }, (_, i) => ({ type: i === 0 ? 'human' : i === 1 ? 'ai' : 'off', faction: i ? Q.b : Q.a, hero: (i ? Q.hb : Q.ha) || 'random', color: PLAYER_COLORS[i].id, team: 0, name: '' }));
  const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'S', land: 'mixed', underground: false, difficulty: 1, slots }), (Math.random() * 1e9) | 0);
  ME = 0; st.quick = true; const h = st.heroes.find(x => x.owner === 0), foe = st.heroes.find(x => x.owner === 1);
  st.heroes = [h, foe]; foe.x = h.x + 1; foe.y = h.y; rebuildObjIndex(st);
  for (const [x, fac] of [[h, Q.a], [foe, Q.b]]) { x.army = quickArmy(fac, Q.weeks, Q.up); x.machines = []; const L = QUICK_LEVELS[Q.lvl] || 1; if (L > 1) gainExp(st, x, expForLevel(L) - x.exp, null, true); quickSpells(st, x, fac, L); x.mana = heroMaxMana(x); }
  return { st, h, foe };
}
// Czary jak po wizytach w miastach własnej frakcji: gildia tym wyższa, im wyższy poziom bohaterów (1: II, 5: III, 10: IV, 15+: V,
// nie wyżej niż pozwala frakcja), a doświadczony bohater zwiedził więcej miast (1 + poziom/6: na 20. poziomie cztery gildie),
// więc zna prawie całą księgę swojej szkoły, z najmocniejszymi czarami. Poziomów tyle, ile pozwala Mądrość (jak w grze).
const QUICK_GUILD = L => L >= 15 ? 5 : L >= 10 ? 4 : L >= 5 ? 3 : 2, QUICK_TOWNS = L => 1 + Math.floor(L / 6);
function quickSpells(st, h, fac, L) {
  if (!hasBook(h)) return; const G = Math.min(QUICK_GUILD(L), guildMax(fac));
  for (let n = 0; n < QUICK_TOWNS(L); n++) { const t = { id: 900 + h.owner * 10 + n, faction: fac, built: [] };
    for (let k = 1; k <= G; k++) { t.built.push('guild' + k); rollGuildLevel(st, t, k); }
    for (let k = 1; k <= Math.min(G, spellCap(h)); k++) for (const id of t.guild[k]) if (!knows(h, id)) h.spells.push(id); }
}
G.screens.quick = {
  fps: smoothFps, backdrop() {}, buttons: [],
  enter(p = {}) { G.state = null; this.q = Object.assign({}, QUICK_DEF, G.settings.quick || {}); for (const k of ['a', 'b']) if (!factionOf(this.q[k]).heroes.some(([n]) => n === this.q['h' + k])) this.q['h' + k] = 'random'; if (p.result) this.last = p.result; this.build(); },
  save() { G.settings.quick = this.q; saveSettings(); },
  build() {
    const Q = this.q, B = [], facs = FACTIONS.map(f => f.id);
    const row = (x, y, w, label, sub, get, n, set, lead, tip) => {
      const mv = d => () => { const N = typeof n === 'function' ? n() : n; set((get() + d + N) % N); this.save(); }; // n: liczba pozycji (funkcja, gdy zależy od innego wyboru)
      const c = new Button(x + 36, y, w - 72, 46, '', mv(1), { size: 15, lead, tip }); Object.defineProperty(c, 'label', { get: label, set() {} }); Object.defineProperty(c, 'sub', { get: sub, set() {} });
      B.push(new Button(x, y, 32, 46, '', mv(-1), { icon: icoK3('ic_left'), tip: 'Poprzednia' }), c, new Button(x + w - 32, y, 32, 46, '', mv(1), { icon: icoK3('ic_right'), tip: 'Następna' }));
    };
    const fac = k => [() => factionOf(Q[k]).name, () => (k === 'a' ? 'twoja armia' : 'przeciwnik'), () => facs.indexOf(Q[k]), facs.length, i => { Q[k] = facs[i]; Q['h' + k] = 'random'; }, (ctx, cx, cy) => factionMedal(ctx, Q[k], cx, cy, 30), `Frakcja ${k === 'a' ? 'twojej armii' : 'przeciwnika'} (kliknij, aby zmienić).`];
    const heroIds = k => ['random', ...factionOf(Q[k]).heroes.map(([n]) => n)], heroCls = k => { const e = factionOf(Q[k]).heroes.find(([n]) => n === Q['h' + k]), C = e && HERO_CLASSES[e[1]]; return C ? (e[2] ? C.nameF || C.name : C.name) : 'bohater'; };
    const hero = k => [() => (Q['h' + k] === 'random' ? 'Losowy' : Q['h' + k]), () => heroCls(k), () => Math.max(0, heroIds(k).indexOf(Q['h' + k])), () => heroIds(k).length, i => { Q['h' + k] = heroIds(k)[i]; },
      (ctx, cx, cy) => heroPickMedal(ctx, { faction: Q[k], hero: Q['h' + k], color: PLAYER_COLORS[k === 'a' ? 0 : 1].id }, cx, cy, 16), `Bohater ${k === 'a' ? 'twojej armii' : 'przeciwnika'}: losowy albo konkretny z frakcji (kliknij, aby zmienić).`];
    row(170, 144, 225, ...fac('a')); row(405, 144, 225, ...fac('b'));
    row(170, 196, 225, ...hero('a')); row(405, 196, 225, ...hero('b'));
    row(250, 256, 300, () => `${Q.weeks} ${Q.weeks === 1 ? 'tydzień' : Q.weeks < 5 ? 'tygodnie' : 'tygodni'} przyrostu`, () => 'siła armii', () => Q.weeks - 1, 8, i => { Q.weeks = i + 1; }, (ctx, cx, cy) => uiIco(ctx, 'ic_sword', cx, cy, 30), 'Obie armie: tyle tygodni przyrostu wszystkich siedmiu siedlisk frakcji.');
    row(250, 308, 300, () => `Poziom ${QUICK_LEVELS[Q.lvl]}`, () => 'bohaterowie', () => Q.lvl, QUICK_LEVELS.length, i => { Q.lvl = i; }, (ctx, cx, cy) => uiIco(ctx, 'ic_helm', cx, cy, 30), 'Poziom obu bohaterów: cechy i umiejętności rosną jak w grze.');
    row(250, 360, 300, () => ['Podstawowe jednostki', 'Ulepszone jednostki', 'Najwyższy stopień'][Q.up], () => 'stopień', () => Q.up, 3, i => { Q.up = i; }, (ctx, cx, cy) => uiIco(ctx, 'ic_plus', cx, cy, 26), 'Stopień jednostek obu armii (gdy frakcja nie ma drugiego ulepszenia, zostaje pierwsze).');
    B.push(new Button(415, 460, 200, 46, 'Walcz!', () => this.start(), { key: 'enter', primary: true, size: 19 }));
    B.push(new Button(185, 460, 200, 46, 'Wróć', () => G.go('menu'), { key: 'escape', size: 19 }));
    this.buttons = B;
  },
  start() {
    const { st, h, foe } = quickBattleState(this.q); G.state = st;
    G.go('battle', { battle: createBattle(st, h, foe), quick: true });
  },
  onBack() { G.go('menu'); },
  draw(ctx) {
    dimmedMenuScene(ctx, 0.5); drawParchment(ctx, 150, 40, 500, 520);
    text(ctx, 'Szybka bitwa', W / 2, 86, { size: 30, align: 'center', color: '#3a1e08', fam: 'title' }); divider(ctx, 200, 600, 106);
    text(ctx, 'Dwie armie, bez mapy: wybierz frakcje, bohaterów, siłę i poziom.', W / 2, 130, { size: 14, italic: true, align: 'center', color: '#5a3814' });
    if (this.last) text(ctx, `Ostatnia bitwa: ${this.last}`, W / 2, 432, { size: 16, weight: 600, align: 'center', color: '#3a1e08', fam: 'title' });
    this.buttons.forEach(b => b.draw(ctx));
  },
};
