// ==================== SZYBKA BITWA =======================================================
// Bitwa bez mapy (menu główne): dwie frakcje, siła armii (tygodnie przyrostu wszystkich siedlisk), poziom bohaterów i ulepszenia.
// Pod spodem mała, chwilowa gra (createNewGame) z bohaterami obu stron; po walce raport i powrót tutaj (można od razu powtórzyć).
const QUICK_LEVELS = [1, 5, 10, 15, 20], QUICK_DEF = { a: 'haven', b: 'barrow', weeks: 2, lvl: 1, up: 0 };
// Armia z przyrostu: każdy z 7 poziomów siedlisk, stopień 0 = podstawowe, 1 = ulepszone, 2 = drugi stopień ulepszenia (gdy jest)
function quickArmy(fac, weeks, up) {
  const F = factionOf(fac), suf = ['', 'u', 'x'][up] || '';
  return [1, 2, 3, 4, 5, 6, 7].map(L => { const d = F.dw['dw' + L + suf] || F.dw['dw' + L + (up ? 'u' : '')] || F.dw['dw' + L], cid = d[1]; return { cid, n: Math.max(1, Math.round(CREATURES[cid].growth * weeks)) }; });
}
function quickBattleState(Q) {
  const slots = Array.from({ length: 8 }, (_, i) => ({ type: i === 0 ? 'human' : i === 1 ? 'ai' : 'off', faction: i ? Q.b : Q.a, hero: 'random', color: PLAYER_COLORS[i].id, team: 0, name: '' }));
  const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'S', land: 'mixed', underground: false, difficulty: 1, slots }), (Math.random() * 1e9) | 0);
  ME = 0; st.quick = true; const h = st.heroes.find(x => x.owner === 0), foe = st.heroes.find(x => x.owner === 1);
  st.heroes = [h, foe]; foe.x = h.x + 1; foe.y = h.y; rebuildObjIndex(st);
  for (const [x, fac] of [[h, Q.a], [foe, Q.b]]) { x.army = quickArmy(fac, Q.weeks, Q.up); x.machines = []; const L = QUICK_LEVELS[Q.lvl] || 1; if (L > 1) gainExp(st, x, expForLevel(L) - x.exp, null, true); x.mana = heroMaxMana(x); }
  return { st, h, foe };
}
G.screens.quick = {
  fps: smoothFps, backdrop() {}, buttons: [],
  enter(p = {}) { G.state = null; this.q = Object.assign({}, QUICK_DEF, G.settings.quick || {}); if (p.result) this.last = p.result; this.build(); },
  save() { G.settings.quick = this.q; saveSettings(); },
  build() {
    const Q = this.q, B = [], facs = FACTIONS.map(f => f.id);
    const row = (x, y, w, label, sub, get, n, set, lead, tip) => {
      const mv = d => () => { set((get() + d + n) % n); this.save(); };
      const c = new Button(x + 36, y, w - 72, 46, '', mv(1), { size: 15, lead, tip }); Object.defineProperty(c, 'label', { get: label, set() {} }); Object.defineProperty(c, 'sub', { get: sub, set() {} });
      B.push(new Button(x, y, 32, 46, '', mv(-1), { icon: icoK3('ic_left'), tip: 'Poprzednia' }), c, new Button(x + w - 32, y, 32, 46, '', mv(1), { icon: icoK3('ic_right'), tip: 'Następna' }));
    };
    const fac = k => [() => factionOf(Q[k]).name, () => (k === 'a' ? 'twoja armia' : 'przeciwnik'), () => facs.indexOf(Q[k]), facs.length, i => { Q[k] = facs[i]; }, (ctx, cx, cy) => factionMedal(ctx, Q[k], cx, cy, 30), `Frakcja ${k === 'a' ? 'twojej armii' : 'przeciwnika'} (kliknij, aby zmienić).`];
    row(170, 150, 225, ...fac('a')); row(405, 150, 225, ...fac('b'));
    row(250, 222, 300, () => `${Q.weeks} ${Q.weeks === 1 ? 'tydzień' : Q.weeks < 5 ? 'tygodnie' : 'tygodni'} przyrostu`, () => 'siła armii', () => Q.weeks - 1, 8, i => { Q.weeks = i + 1; }, (ctx, cx, cy) => uiIco(ctx, 'ic_sword', cx, cy, 30), 'Obie armie: tyle tygodni przyrostu wszystkich siedmiu siedlisk frakcji.');
    row(250, 278, 300, () => `Poziom ${QUICK_LEVELS[Q.lvl]}`, () => 'bohaterowie', () => Q.lvl, QUICK_LEVELS.length, i => { Q.lvl = i; }, (ctx, cx, cy) => uiIco(ctx, 'ic_helm', cx, cy, 30), 'Poziom obu bohaterów: cechy i umiejętności rosną jak w grze.');
    row(250, 334, 300, () => ['Podstawowe jednostki', 'Ulepszone jednostki', 'Najwyższy stopień'][Q.up], () => 'stopień', () => Q.up, 3, i => { Q.up = i; }, (ctx, cx, cy) => uiIco(ctx, 'ic_plus', cx, cy, 26), 'Stopień jednostek obu armii (gdy frakcja nie ma drugiego ulepszenia, zostaje pierwsze).');
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
    text(ctx, 'Dwie armie, bez mapy: wybierz frakcje, siłę i poziom bohaterów.', W / 2, 130, { size: 14, italic: true, align: 'center', color: '#5a3814' });
    if (this.last) text(ctx, `Ostatnia bitwa: ${this.last}`, W / 2, 420, { size: 16, weight: 600, align: 'center', color: '#3a1e08', fam: 'title' });
    this.buttons.forEach(b => b.draw(ctx));
  },
};
