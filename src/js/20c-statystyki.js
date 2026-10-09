// ==================== STATYSTYKI I OSIĄGNIĘCIA ============================================
// Wykres potęgi jak w Heroes 3: co tydzień (i na końcu gry) zapisujemy dla każdego gracza siłę armii, złoto, liczbę miast,
// poziom najlepszego bohatera i kopalnie (st.hist). Liczniki zdarzeń gracza (st.tally[pid]): bitwy, pokonane potwory,
// zdobyte i stracone miasta, skarbce, bitwy morskie, szczyty złota i miast. Na ich podstawie osiągnięcia (ACHIEVEMENTS),
// zdobyte raz zostają na zawsze (localStorage 'kk_ach').

const HIST_KEYS = [
  { id: 'army', name: 'Siła armii', f: (st, p) => Math.round(st.heroes.filter(h => h.owner === p.id).reduce((s, h) => s + armyPower(h.army) * heroFactor(h), 0) + st.towns.filter(t => t.owner === p.id).reduce((s, t) => s + armyPower(t.garrison), 0)) },
  { id: 'gold', name: 'Złoto', f: (st, p) => p.resources.gold },
  { id: 'towns', name: 'Miasta', f: (st, p) => st.towns.filter(t => t.owner === p.id).length },
  { id: 'level', name: 'Poziom bohatera', f: (st, p) => Math.max(0, ...st.heroes.filter(h => h.owner === p.id).map(h => h.level)) },
  { id: 'mines', name: 'Kopalnie', f: (st, p) => st.objects.filter(o => o.type === 'mine' && !o.dead && o.owner === p.id).length },
];
function recordHistory(st) {
  st.hist = st.hist || []; const last = st.hist[st.hist.length - 1]; if (last && last.d === st.dayTotal) st.hist.pop(); // ten sam dzień: zastąp
  st.hist.push({ d: st.dayTotal, v: st.players.map(p => (p.out ? null : HIST_KEYS.map(K => K.f(st, p)))) });
}
const tallyOf = (st, pid) => { if (pid < 0 || !st.players[pid]) return {}; st.tally = st.tally || {}; return (st.tally[pid] = st.tally[pid] || {}); };
const tallyAdd = (st, pid, key, n = 1) => { if (pid >= 0) { const T = tallyOf(st, pid); T[key] = (T[key] || 0) + n; } };
// Codziennie: szczyty złota, miast i poziomu (osiągnięcia „Skarbiec”, „Imperium”, „Legenda”)
function tallyDaily(st) {
  for (const p of st.players) { if (p.out) continue; const T = tallyOf(st, p.id), towns = st.towns.filter(t => t.owner === p.id).length, lvl = Math.max(0, ...st.heroes.filter(h => h.owner === p.id).map(h => h.level));
    T.peakGold = Math.max(T.peakGold || 0, p.resources.gold); T.peakTowns = Math.max(T.peakTowns || 0, towns); T.peakLevel = Math.max(T.peakLevel || 0, lvl);
    if (st.heroes.some(h => h.owner === p.id && h.mastery)) T.mastery = 1; }
}
// Po bitwie (resolveBattle): zwycięstwa, porażki, potwory, skarbce, bohaterowie, bitwy morskie
function tallyBattle(B, outcome) {
  const st = B.st, a = B.h.owner, D = B.sides[1], d = D.owner;
  if (outcome === 'win') { tallyAdd(st, a, 'won'); if (D.monster) tallyAdd(st, a, 'monsters'); if (D.bank) tallyAdd(st, a, 'banks'); if (D.hero) tallyAdd(st, a, 'heroes'); if (B.naval) tallyAdd(st, a, 'naval'); if (d >= 0) tallyAdd(st, d, 'lost'); }
  else { tallyAdd(st, a, 'lost'); if (d >= 0 && outcome === 'lose') tallyAdd(st, d, 'won'); }
}
// Osiągnięcia: test(st, pid, T, r) – r: wynik gry ('win' / 'lose' / null w trakcie)
const ACHIEVEMENTS = [
  { id: 'firstBlood', name: 'Pierwsza krew', desc: 'wygraj pierwszą bitwę', icon: ['ui', 'ic_sword'], test: (st, p, T) => (T.won || 0) >= 1 },
  { id: 'slayer', name: 'Pogromca potworów', desc: 'pokonaj 25 stad potworów', icon: ['sk', 't_giantSlayer'], test: (st, p, T) => (T.monsters || 0) >= 25 },
  { id: 'conqueror', name: 'Zdobywca', desc: 'zdobądź 3 miasta', icon: ['ui', 'ic_crown'], test: (st, p, T) => (T.towns || 0) >= 3 },
  { id: 'empire', name: 'Imperium', desc: 'miej naraz 8 miast', icon: ['ui', 'ic_map'], test: (st, p, T) => (T.peakTowns || 0) >= 8 },
  { id: 'treasury', name: 'Skarbiec', desc: 'zgromadź naraz 50 000 złota', icon: ['ui', 'res_gold'], test: (st, p, T) => (T.peakGold || 0) >= 50000 },
  { id: 'master', name: 'Mistrzostwo', desc: 'wybierz ścieżkę mistrzowską bohatera (10. poziom)', icon: ['sk', 't_warlord'], test: (st, p, T) => !!T.mastery },
  { id: 'legend', name: 'Żywa legenda', desc: 'doprowadź bohatera do 20. poziomu', icon: ['sk', 't_veteran'], test: (st, p, T) => (T.peakLevel || 0) >= 20 },
  { id: 'plunder', name: 'Łowca skarbów', desc: 'splądruj 5 skarbców', icon: ['ui', 'ic_chest'], test: (st, p, T) => (T.banks || 0) >= 5 },
  { id: 'grail', name: 'Strażnik Graala', desc: 'wznieś budowlę Graala', icon: ['art', 'grail'], test: (st, p, T) => !!T.grail },
  { id: 'admiral', name: 'Admirał', desc: 'wygraj bitwę morską', icon: ['map', 'pirate_0'], test: (st, p, T) => (T.naval || 0) >= 1 },
  { id: 'blitz', name: 'Błyskawica', desc: 'wygraj grę w ciągu dwóch miesięcy', icon: ['ui', 'ic_hourglass'], test: (st, p, T, r) => r === 'win' && st.dayTotal <= 56 },
  { id: 'unbroken', name: 'Niezłomny', desc: 'wygraj, nie tracąc ani jednego miasta', icon: ['ui', 'ic_shield'], test: (st, p, T, r) => r === 'win' && !T.townsLost },
  { id: 'vast', name: 'Bezkresne ziemie', desc: 'wygraj na mapie gigantycznej albo bezkresnej', icon: ['ui', 'ic_move'], test: (st, p, T, r) => r === 'win' && st.map.n >= 180 },
  { id: 'brothers', name: 'Braterstwo broni', desc: 'wygraj razem z sojusznikiem w drużynie', icon: ['ui', 'ic_helm'], test: (st, p, T, r) => r === 'win' && st.players.some(q => q.id !== p && allied(st, p, q.id)) },
];
const loadAch = () => { try { return JSON.parse(localStorage.getItem('kk_ach') || '{}') || {}; } catch (e) { return {}; } };
// Osiągnięcia gracza w tej grze (lista id) i zapis nowych na stałe; zwraca nowe
function earnAchievements(st, pid, r = null) {
  const T = tallyOf(st, pid), got = ACHIEVEMENTS.filter(A => A.test(st, pid, T, r)).map(A => A.id), all = loadAch(), fresh = got.filter(id => !all[id]);
  if (fresh.length && st.players[pid] && st.players[pid].human) { for (const id of fresh) all[id] = Date.now(); try { localStorage.setItem('kk_ach', JSON.stringify(all)); } catch (e) {} }
  return { got, fresh };
}
function achIcon(ctx, A, cx, cy, s, on) {
  ctx.save(); if (!on) { ctx.globalAlpha = 0.28; ctx.filter = 'grayscale(1)'; }
  const [k, id] = A.icon;
  if (k === 'ui') uiIco(ctx, id, cx, cy, s); else if (k === 'sk') skillIcon(ctx, id, cx, cy, s * 0.9); else if (k === 'art') drawSprite(ctx, artSprite(id, true), cx, cy, s / 26);
  else if (!drawMap3dIcon(ctx, id, cx, cy, s, s)) uiIco(ctx, 'ic_sword', cx, cy, s);
  ctx.restore();
}
// Okno statystyk: wykres potęgi (zakładki: siła, złoto, miasta, poziom, kopalnie) i osiągnięcia gracza pid; onClose – co potem
function showStats(st, pid = ME, onClose = null, r = null) {
  recordHistory(st); tallyDaily(st);
  const x = 20, y = 14, w = 760, h = 572, ach = earnAchievements(st, pid, r); let key = 0;
  const close = () => { G.modal = null; if (onClose) onClose(); };
  const tabs = HIST_KEYS.map((K, i) => new Button(x + 30 + i * 140, y + 54, 134, 34, K.name, () => { key = i; }, { size: 14, selected: () => key === i }));
  const bClose = new Button(W / 2 - 80, y + h - 50, 160, 38, 'Zamknij', close, { key: 'escape', size: 17 });
  const ch = { x: x + 70, y: y + 104, w: w - 110, h: 200 };
  const cell = i => [x + 58 + (i % 7) * 106, y + 404 + Math.floor(i / 7) * 58]; // środek komórki osiągnięcia
  const achBtns = ACHIEVEMENTS.map((A, i) => new Button(cell(i)[0] - 50, cell(i)[1], 100, 54, '', null, { tip: `${A.name}: ${A.desc}.` })); // niewidoczne: tylko podpowiedzi
  G.modal = { box: { x, y, w, h }, msg: 'Statystyki', stats: { hist: st.hist, ach }, buttons: [...tabs, bClose, ...achBtns],
    draw(ctx) {
      dimScreen(ctx, 0.6); drawParchment(ctx, x, y, w, h);
      text(ctx, 'Wykres potęgi', W / 2, y + 36, { size: 26, align: 'center', color: '#3a1e08', fam: 'title' });
      tabs.forEach(b => b.draw(ctx));
      const H = st.hist, K = HIST_KEYS[key], vals = H.flatMap(s => s.v.map(v => (v ? v[key] : 0))), max = Math.max(1, ...vals), nice = max >= 1000 ? Math.ceil(max / 1000) * 1000 : max >= 10 ? Math.ceil(max / 5) * 5 : max;
      ctx.fillStyle = 'rgba(90,55,20,.08)'; ctx.fillRect(ch.x, ch.y, ch.w, ch.h);
      ctx.strokeStyle = 'rgba(90,55,20,.3)'; ctx.lineWidth = 1; for (let i = 0; i <= 4; i++) { const yy = ch.y + ch.h - ch.h * i / 4; ctx.beginPath(); ctx.moveTo(ch.x, yy); ctx.lineTo(ch.x + ch.w, yy); ctx.stroke();
        const v = nice * i / 4; text(ctx, v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(Math.round(v * 10) / 10), ch.x - 8, yy, { size: 12, align: 'right', weight: 600, color: '#5a3814' }); }
      const d0 = H[0] ? H[0].d : 1, d1 = Math.max(d0 + 1, H[H.length - 1] ? H[H.length - 1].d : 2), X = d => ch.x + (d - d0) / (d1 - d0) * ch.w, Y = v => ch.y + ch.h - v / nice * ch.h;
      for (let wk = Math.ceil(d0 / 7) * 7; wk <= d1; wk += Math.max(7, Math.ceil((d1 - d0) / 10 / 7) * 7)) text(ctx, `t.${Math.floor((wk - 1) / 7) + 1}`, X(wk), ch.y + ch.h + 14, { size: 11, align: 'center', weight: 600, color: '#5a3814' });
      st.players.forEach((p, i) => { const pts = H.map(s => s.v[i] && [X(s.d), Y(s.v[i][key])]).filter(Boolean); if (!pts.length) return;
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4; ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py + 1) : ctx.moveTo(px, py + 1))); ctx.stroke();
        ctx.strokeStyle = ownerColor(st, p.id); ctx.lineWidth = p.id === pid ? 3.5 : 2.2; ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
        const [lx, ly] = pts[pts.length - 1]; ctx.fillStyle = ownerColor(st, p.id); ctx.beginPath(); ctx.arc(lx, ly, 4, 0, TAU); ctx.fill(); });
      st.players.forEach((p, i) => { const lx = x + 40 + (i % 4) * 180, ly = y + 332 + Math.floor(i / 4) * 20; ctx.fillStyle = ownerColor(st, p.id); ctx.fillRect(lx, ly - 5, 16, 10);
        text(ctx, `${cap1(playerName(st, p.id))}${p.team ? ` (${TEAM_NAMES[p.team]})` : ''}${p.out ? ' – odpadł' : ''}`, lx + 22, ly, { size: 12, weight: p.id === pid ? 800 : 600, color: p.out ? '#8a7a64' : '#3a1e08' }); });
      // osiągnięcia
      const all = loadAch(); text(ctx, `Osiągnięcia: ${ach.got.length} w tej grze · ${Object.keys(all).length}/${ACHIEVEMENTS.length} zdobytych kiedykolwiek`, W / 2, y + 388, { size: 15, align: 'center', color: '#3a1e08', fam: 'title' });
      ACHIEVEMENTS.forEach((A, i) => { const [cx, cy] = cell(i), on = ach.got.includes(A.id), ever = !!all[A.id];
        if (on) { ctx.fillStyle = 'rgba(224,178,74,.35)'; rr(ctx, cx - 50, cy, 100, 54, 6); ctx.fill(); }
        achIcon(ctx, A, cx, cy + 17, 28, on || ever); text(ctx, A.name, cx, cy + 44, { size: 11, weight: 800, align: 'center', color: on ? '#2a6a1e' : ever ? '#3a1e08' : '#8a7a64' });
        if (ach.fresh.includes(A.id)) text(ctx, 'nowe!', cx + 30, cy + 8, { size: 11, weight: 800, italic: true, color: '#b03a1a' }); });
      bClose.draw(ctx);
    },
  };
}
