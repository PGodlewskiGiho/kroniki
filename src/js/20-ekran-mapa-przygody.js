// ==================== EKRAN: MAPA PRZYGODY ==============================================
// Panel boczny, okno królestwa i obsługa mapy przygody.
function paintAdvChrome(c) {
  stoneFill(c, 0, 0, VW, VH);
  goldFrame(c, VIEW.x, VIEW.y, VIEW.w, VIEW.h); goldFrame(c, MINI.x, MINI.y, MINI.s, MINI.s);
  for (const r of [LIST, INFOBOX]) { c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, r.x, r.y, r.w, r.h, 4); c.fill(); c.strokeStyle = '#8a6d32'; c.lineWidth = 1.2; c.stroke(); }
  c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, 8, VH - 31, VW - 16, 27, 3); c.fill(); c.strokeStyle = '#8a6d32'; c.lineWidth = 1; c.stroke();
}
function showKingdom(st) {
  const R = human(st).resources, x = 150, y = 84, w = 500, h = 444, mines = {};
  for (const ob of st.objects) if (ob.type === 'mine' && !ob.dead && ob.owner === ME) mines[ob.kind] = (mines[ob.kind] || 0) + 1;
  const total = Object.values(mines).reduce((a, b) => a + b, 0);
  const btn = new Button(W / 2 - 70, y + h - 48, 140, 40, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 17 });
  G.modal = {
    buttons: [btn],
    draw(ctx) {
      const inc = dailyIncomeAll(st);
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, h);
      text(ctx, 'Twoje królestwo', W / 2, y + 40, { size: 28, align: 'center', color: '#3a1e08', fam: 'title' });
      divider(ctx, x + 40, x + w - 40, y + 62);
      text(ctx, 'Zasób', x + 96, y + 84, { size: 15, color: '#5a3814', fam: 'title' });
      text(ctx, 'Posiadasz', x + 288, y + 84, { size: 14, align: 'right', color: '#5a3814', fam: 'title' });
      text(ctx, 'Dziennie', x + 386, y + 84, { size: 14, align: 'right', color: '#5a3814', fam: 'title' });
      text(ctx, 'Kopalnie', x + 466, y + 84, { size: 14, align: 'right', color: '#5a3814', fam: 'title' });
      RESOURCES.forEach((r, i) => {
        const ry = y + 112 + i * 30; resIcon(ctx, r.id, x + 74, ry, 24);
        text(ctx, r.name, x + 96, ry, { size: 17, color: '#2a1606' });
        text(ctx, String(R[r.id]), x + 288, ry, { size: 17, align: 'right', color: '#2a1606' });
        text(ctx, inc[r.id] ? `+${inc[r.id]}` : '—', x + 386, ry, { size: 17, align: 'right', color: inc[r.id] ? '#2a6a1e' : '#7a5a34' });
        text(ctx, mines[r.id] ? String(mines[r.id]) : '—', x + 466, ry, { size: 17, align: 'right', color: '#2a1606' });
      });
      divider(ctx, x + 40, x + w - 40, y + 330);
      text(ctx, `Bohaterowie: ${myHeroes(st).length}    Kopalnie: ${total}    Miasta: ${myTowns(st).length}`, W / 2, y + 348, { size: 17, align: 'center', weight: 500, color: '#3a1e08' });
      text(ctx, `${dateText(st)} (Tydzień ${weekName(st)})`, W / 2, y + 372, { size: 16, align: 'center', italic: true, weight: 500, color: '#5a3814' });
      btn.draw(ctx);
    },
  };
}
const myHeroes = st => st.heroes.filter(h => h.owner === ME);
const myTowns = st => st.towns.filter(t => t.owner === ME);
// Wiersze listy po prawej: najpierw bohaterowie, potem miasta gracza
// Lista bohaterów i miast w panelu; mieści się LIST_ROWS wierszy, resztę przewija się kółkiem albo przeciągnięciem
const panelItems = st => [...myHeroes(st).map(h => ({ hero: h })), ...myTowns(st).map(t => ({ town: t }))];
function panelRows(st, scroll = 0) {
  return panelItems(st).map((r, i) => ({ ...r, y: LIST.y + 6 + (i - scroll) * LIST_ROW_H })).filter(r => r.y >= LIST.y && r.y + 44 <= LIST.y + LIST.h);
}
function buildPanelButtons(scr, st) {
  const S = 30, by = 176, bx = LIST.x + 2, mk = (i, icon, label, act, o = {}) => new Button(bx + i * 32, by, S, S, label, act, Object.assign({ icon }, o));
  scr.btnMove = mk(2, iconBoot, 'Ruch', () => scr.startMove(), { key: 'm', tip: 'Ruszaj bohatera wzdłuż wyznaczonej ścieżki (klawisz M).' });
  scr.btnSleep = mk(3, iconSleep, 'Śpij', () => scr.toggleSleep(), { key: 's', selected: () => !!(hero(G.state) && hero(G.state).asleep), tip: 'Uśpij albo obudź bohatera. Śpiący nie upomina się o ruch przy końcu tury (klawisz S).' });
  scr.buttons = [
    mk(0, iconCrown, 'Królestwo', () => showKingdom(st), { key: 'k', tip: 'Podsumowanie królestwa: zasoby, dochód i kopalnie (klawisz K).' }),
    mk(1, iconNext, 'Następny bohater', () => scr.nextHero(), { key: 'n', tip: 'Przełącz na następnego bohatera (klawisz N).' }),
    scr.btnMove, scr.btnSleep,
    mk(4, iconSpell, 'Czary', () => scr.spellbook(), { key: 'c', tip: 'Księga czarów: czary rzucane na mapie (klawisz C).' }),
    mk(5, iconGear, 'Menu', () => scr.systemMenu(), { key: 'escape', tip: 'Menu systemowe: powrót do menu głównego (klawisz Esc).' }),
    new Button(LIST.x + 2, 212, 190, 40, 'Koniec tury', () => scr.endTurn(), { key: 'e', size: 17, tip: 'Kończy dzień. Bohaterowie odzyskują punkty ruchu, a kopalnie i miasta dają dochód (klawisz E).' }),
  ];
}
function panelInfoText(st, scr) {
  if (scr.aiRun) { const p = scr.aiRun.who; return { text: p ? `Tura przeciwnika: ${ownerName(st, p.id)} (${factionOf(p.faction).name})…` : 'Tura przeciwników…', col: '#ffd970' }; }
  if (scr.flashMsg && G.time - scr.flashMsg.t < 2.2) return { text: scr.flashMsg.text, col: '#ff9a7a' };
  if (G.mouse.type === 'mouse' && inRect(G.mouse.x, G.mouse.y, VIEW) && !G.modal) {
    const { tx, ty } = screenToTile(st, G.mouse.x, G.mouse.y); return { text: tileInfo(st, tx, ty), col: '#ecd9a8' };
  }
  const h = hero(st);
  if (!h) return { text: 'Nie masz bohatera. Najmij nowego w tawernie któregoś z miast.', col: '#ff9a7a' };
  if (h.path) return { text: `Ścieżka wyznaczona, ${h.path.length} pól. Kliknij cel ponownie albo naciśnij M.`, col: '#ecd9a8' };
  return { text: 'Kliknij pole, aby wyznaczyć ścieżkę. Prawy przycisk myszy pokazuje informacje.', col: 'rgba(236,217,168,.75)' };
}
function drawPanel(ctx, st, scr) {
  drawMinimap(ctx, st);
  const items = panelItems(st).length; scr.listScroll = clamp(scr.listScroll || 0, 0, Math.max(0, items - LIST_ROWS));
  if (items > LIST_ROWS) { // pasek przewijania
    const bh = LIST.h * LIST_ROWS / items, by = LIST.y + (LIST.h - bh) * scr.listScroll / (items - LIST_ROWS);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(LIST.x + LIST.w - 3, LIST.y, 3, LIST.h); ctx.fillStyle = '#b8913f'; ctx.fillRect(LIST.x + LIST.w - 3, by, 3, bh);
  }
  for (const r of panelRows(st, scr.listScroll)) {
    const y = r.y, on = r.hero && r.hero === hero(st);
    ctx.fillStyle = on ? 'rgba(210,160,60,.25)' : 'rgba(0,0,0,.25)'; rr(ctx, LIST.x + 4, y, 188, 44, 3); ctx.fill();
    ctx.strokeStyle = on ? '#e0b24a' : '#6a5a3a'; ctx.lineWidth = 1.2; ctx.stroke();
    if (r.hero) {
      const h = r.hero, max = heroMaxMP(h), frac = clamp(h.mp / max, 0, 1);
      drawHeroPortrait(ctx, LIST.x + 8, y + 4, h, ownerColor(st, h.owner));
      text(ctx, h.name, LIST.x + 52, y + 14, { size: 15, color: '#ecd9a8', fam: 'title' });
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(LIST.x + 52, y + 27, 132, 9);
      ctx.fillStyle = h.asleep ? '#7a7466' : '#3aa14a'; ctx.fillRect(LIST.x + 52, y + 27, 132 * frac, 9);
      ctx.strokeStyle = '#8a6d32'; ctx.lineWidth = 1; ctx.strokeRect(LIST.x + 52.5, y + 27.5, 131, 8);
      text(ctx, `${h.mp} / ${max}`, LIST.x + 186, y + 14, { size: 12, align: 'right', color: '#c8b68a' });
    } else {
      const t = r.town;
      drawSpriteBox(ctx, townIconSprite(t.faction, townLevel(t), ownerColor(st, t.owner)), LIST.x + 6, y + 2, 1);
      text(ctx, t.name, LIST.x + 52, y + 16, { size: 14, color: '#ecd9a8', fam: 'title' });
      text(ctx, `${townGold(t)} złota dziennie`, LIST.x + 52, y + 32, { size: 12, weight: 500, color: '#c8b68a' });
    }
  }
  text(ctx, `Tydzień ${weekName(st)}`, INFOBOX.x + INFOBOX.w / 2, INFOBOX.y + 18, { size: 15, align: 'center', color: '#f0e4c0', fam: 'title' });
  divider(ctx, INFOBOX.x + 16, INFOBOX.x + INFOBOX.w - 16, INFOBOX.y + 32);
  const info = panelInfoText(st, scr); ctx.font = font(14, 500, 'body');
  wrapText(ctx, info.text, INFOBOX.w - 24).slice(0, 4).forEach((l, i) => text(ctx, l, INFOBOX.x + INFOBOX.w / 2, INFOBOX.y + 50 + i * 18, { size: 14, weight: 500, align: 'center', color: info.col }));
}
G.screens.adventure = {
  buttons: [], drag: null, banner: null, flashMsg: null, floats: [],
  // Ekran tylko pokazuje stan: świat tworzy createNewGame(), tutaj przygotowujemy widok.
  fill: true, // rysuje w całym oknie, układ z layoutAdventure()
  // Po zmianie rozmiaru okna: nowy układ panelu, przyciski na nowych miejscach, kamera w granicach mapy
  layout(force) {
    const key = VW + 'x' + VH; if (!force && this.layoutKey === key) return; this.layoutKey = key;
    const st = G.state; layoutAdventure(); buildPanelButtons(this, st); if (this.aiRun) this.lockButtons(true);
    if (st.cam) camClamp(st);
  },
  enter(p) {
    const st = G.state;
    rebuildObjIndex(st); this.floats = []; this.banner = null; this.flashMsg = null;
    MapRender.reset(st.map, human(st).explored); layoutAdventure();
    if (!st.cam) { const f = hero(st) || myTowns(st)[0] || st.towns[0]; centerCam(st, f.x, f.y); }
    if (this.aiRun && this.aiRun.st !== st) this.aiRun = null; // tura z poprzedniej gry
    this.layout(true); // przyciski panelu; w trakcie tury przeciwnika (powrót z bitwy obronnej) zablokowane
    if (p.flash) this.flash(p.flash);
    if (p.after) p.after();
    if (p.welcome) {
      const h = hero(st), foes = st.players.filter(q => !q.human);
      const goal = foes.length ? ` Twoi rywale: ${foes.map(q => `${ownerName(st, q.id)} (${factionOf(q.faction).name})`).join(', ')}. Pokonaj ich wszystkich: zdobądź ich miasta i rozbij ich bohaterów.` : ' Nie masz rywali: to gra swobodna, bez zwycięstwa.';
      showDialog(`Rozpoczyna się twoja kronika. ${h.name} (${heroTitle(h).split(', ')[1]}) czeka na rozkazy w mieście ${st.towns[0].name}.${goal} Bonus startowy: ${st.bonusText}.`, [{ label: 'Do dzieła', key: 'enter' }]);
    }
  },
  flash(msg) { this.flashMsg = { text: msg, t: G.time }; },
  systemMenu() {
    showDialog('Gra jest wstrzymana. Co chcesz zrobić?', [
      { label: 'Wróć do gry', key: 'escape' },
      { label: 'Zapisz', key: 'z', action: () => this.openSaves('save') },
      { label: 'Wczytaj', key: 'w', action: () => this.openSaves('load') },
      { label: 'Dźwięk', key: 'd', action: () => showSoundSettings(() => this.systemMenu()) },
      { label: 'Menu główne', action: () => askToMenu() }]);
  },
  openSaves(mode) { if (!canSaveNow(G.state)) return this.flash('Poczekaj, aż bohater się zatrzyma'); G.go('load', { mode, fromGame: true }); },
  autosave(st) { SaveStore.write('auto', st).catch(() => { if (G.state === st) this.flash('Autozapis się nie udał'); }); },
  onKey(k) { const h = hero(G.state); if (!h || this.aiRun) return; if (k === ' ') centerCam(G.state, h.x, h.y); else if (k === 'h') this.heroInfo(); },
  selectHero(h) {
    const st = G.state; st.selHero = st.heroes.indexOf(h); centerCam(st, h.x, h.y);
    const i = myHeroes(st).indexOf(h), s = this.listScroll || 0; if (i >= 0) this.listScroll = i < s ? i : i >= s + LIST_ROWS ? i - LIST_ROWS + 1 : s; // wybrany widoczny na liście
  },
  onWheel(d) { if (inRect(G.mouse.x, G.mouse.y, LIST)) this.listScroll = clamp((this.listScroll || 0) + Math.sign(d), 0, Math.max(0, panelItems(G.state).length - LIST_ROWS)); },
  nextHero() {
    const st = G.state, mine = myHeroes(st), i0 = mine.indexOf(hero(st)); if (!mine.length) return;
    for (let k = 1; k <= mine.length; k++) { const h = mine[(i0 + k) % mine.length]; if (!h.asleep || k === mine.length) { this.selectHero(h); break; } }
  },
  toggleSleep() { const h = hero(G.state); if (!h) return; h.asleep = !h.asleep; if (h.asleep) { h.path = null; h.dest = null; } this.flash(h.asleep ? `${h.name} odpoczywa` : `${h.name} znów rusza w drogę`); },
  rightInfo(x, y) {
    const st = G.state;
    if (inRect(x, y, { x: INFOBOX.x, y: INFOBOX.y, w: INFOBOX.w, h: 32 })) { const W = weekInfo(st), M = monthInfo(st); return `Tydzień ${W.name}: ${W.text || 'spokojny tydzień, bez szczególnych skutków'}.${M.name ? ` Miesiąc ${M.name}: ${M.text}.` : ''} Co tydzień los wybiera nowy efekt.`; }
    if (inRect(x, y, VIEW)) {
      const { tx, ty } = screenToTile(st, x, y), n = st.map.n;
      if (tx < 0 || ty < 0 || tx >= n || ty >= n) return null;
      const i = ty * n + tx;
      if (!human(st).explored[i]) return 'Nieodkryty teren. Wyślij tam bohatera, żeby zobaczyć, co się kryje.';
      const hh = heroAt(st, tx, ty);
      if (hh) return `${heroTitle(hh)}. Punkty ruchu: ${hh.mp} z ${heroMaxMP(hh)}. Doświadczenie: ${hh.exp}.`;
      const ob = objectAt(st, i);
      if (ob && ob.type === 'monster') { const c = CREATURES[ob.cid]; return `${qtyName(ob.count)} ${c.gen} (siła ${ob.count * c.value}, twoja armia ${hero(st) ? armyPower(hero(st).army) : 0}). Poziom ${c.level}, ${unitStats(c)}.`; }
      if (ob && ob.type === 'town') {
        const t = st.towns[ob.townId];
        return `${t.name}. Dochód: ${townGold(t)} złota dziennie. Budowli: ${t.built.length}. ` + (t.owner === ME ? 'Wejdź bohaterem albo wybierz miasto z listy po prawej.' : `${t.owner < 0 ? 'Miasto niezależne' : `Właściciel: ${ownerName(st, t.owner)}`}. Siła obrońców ${townPower(st, t)}, twoja armia ${hero(st) ? armyPower(hero(st).army) : 0}. Wejdź, aby je zdobyć.`);
      }
      if (ob && ob.type === 'mine') { const M = MINES[ob.kind]; return `${M.name}. Właściciel: ${ownerName(st, ob.owner)}. Dochód dzienny: ${M.income} (${resName(ob.kind).toLowerCase()}).`; }
      if (ob && ob.type === 'site') return siteInfo(st, ob, hero(st));
      if (ob && ob.type === 'chest') return 'Skrzynia ze skarbem. Wybierzesz złoto albo doświadczenie dla bohatera.';
      if (ob && ob.type === 'art') return `${artInfo(ob.art)} Wejdź na to pole, aby go podnieść.`;
      if (ob && ob.type === 'res') return `${resName(ob.res)}: ${ob.amount}. Wejdź na to pole, aby zabrać.`;
      return tileInfo(st, tx, ty);
    }
    if (inRect(x, y, { x: MINI.x, y: MINI.y, w: MINI.s, h: MINI.s })) return 'Minimapa. Kliknij albo przeciągnij, aby przenieść widok.';
    if (inRect(x, y, LIST)) return 'Bohaterowie i miasta. Kliknij bohatera, aby go wybrać (ponownie: ekran bohatera, klawisz H), albo miasto, aby do niego wejść. Kółko albo przeciągnięcie przewija listę.';
    return resourceBarInfo(st, x, y, VH - H);
  },
  spellbook() {
    const st = G.state, h = hero(st); if (!h || h.moving || h.anim) return;
    showSpellbook(h, 'adv', id => {
      const from = [h.x, h.y], err = castAdventure(st, h, id); this.flash(err || `${h.name} rzuca: ${SPELLS[id].name}`); Sound.play(err ? 'error' : 'magic'); if (err) return;
      this.mapFx = this.mapFx || []; const col = SPELLS[id].col;
      if (id === 'eagleEye') this.mapFx.push({ kind: 'ring', x: h.x, y: h.y, r: 5 + heroStat(h, 'sp'), col, t: G.time });
      else { this.mapFx.push({ kind: 'column', x: from[0], y: from[1], col, t: G.time }, { kind: 'column', x: h.x, y: h.y, col, t: G.time + 0.2 }); }
    });
  },
  heroInfo() { if (hero(G.state)) G.go('hero', { heroId: G.state.heroes.indexOf(hero(G.state)) }); },
  startMove() {
    const st = G.state, h = hero(st); if (!h || !h.path || h.moving || h.anim) return;
    if (!armySize(h.army)) { this.flash('Bohater nie ma armii. Zwerbuj jednostki w mieście.'); return; }
    const [nx, ny] = h.path[0];
    if (stepCost(st.map, h.x, h.y, nx, ny, h) > h.mp) { this.flash('Bohater nie ma już dziś punktów ruchu'); return; }
    h.stop = false; h.moving = true;
  },
  tileClick(tx, ty) {
    const st = G.state, h = hero(st), n = st.map.n; if (!h) return;
    if (h.moving || h.anim) { h.stop = true; return; }
    if (tx < 0 || ty < 0 || tx >= n || ty >= n) return;
    // kliknięcie w budynek miasta albo kopalni oznacza jego wejście
    const ob = objectAt(st, ty * n + tx); if (ob && ob.blocks && human(st).explored[ty * n + tx]) { tx = ob.x; ty = ob.y; }
    const other = heroAt(st, tx, ty); // własny bohater: obok = spotkanie i wymiana, dalej = wybór
    if (other && other !== h && other.owner === ME) { if (Math.max(Math.abs(other.x - h.x), Math.abs(other.y - h.y)) === 1) showMeeting(st, h, other); else this.selectHero(other); return; }
    if (tx === h.x && ty === h.y) {
      const here = objectAt(st, ty * n + tx);
      if (here && here.type === 'town' && here.owner === h.owner) G.go('town', { townId: here.townId }); else this.heroInfo();
      return;
    }
    if (h.path && h.dest && h.dest[0] === tx && h.dest[1] === ty) { this.startMove(); return; }
    const p = computePath(st, h, tx, ty);
    if (p) { h.path = p; h.dest = [tx, ty]; } else { h.path = null; h.dest = null; this.flash('Nie można tam dotrzeć'); }
  },
  endTurn() {
    const st = G.state; if (this.aiRun || st.heroes.some(h => h.moving || h.anim)) return;
    const idle = myHeroes(st).filter(h => !h.asleep && heroCanStillMove(st, h));
    if (idle.length) showDialog(`${idle.length > 1 ? 'Niektórzy bohaterowie mogą' : `${idle[0].name} może`} się jeszcze poruszyć. Czy na pewno zakończyć turę?`, [{ label: 'Tak', key: 'enter', action: () => this.doEndTurn({ live: true }) }, { label: 'Nie', key: 'escape' }]);
    else this.doEndTurn({ live: true });
  },
  // Koniec dnia: najpierw tura przeciwników, potem nowy dzień (finishDay).
  // { live: true } (przycisk) odtwarza turę SI na mapie i pyta o obronę; bez opcji (testy, symulacje) wszystko dzieje się od razu.
  doEndTurn(opts = {}) {
    const st = G.state, news = [], gen = aiAllTurns(st, news);
    if (!opts.live) { runAiSync(st, gen); this.finishDay(st, news); return; }
    this.aiRun = { st, gen, news, input: undefined, wait: false, who: null, anim: null, seen: new Set() }; this.lockButtons(true);
  },
  lockButtons(on) { for (const b of this.buttons) { if (on) { b._was = b.disabled; b.disabled = true; } else if (b._was !== undefined) { b.disabled = b._was; delete b._was; } } },
  // Odtwarzanie tury SI: widoczne kroki (na odkrytej mapie) z animacją i kamerą, reszta od razu; atak na gracza czeka na jego decyzję
  updateAi(st, dt) {
    const R = this.aiRun;
    if (R.anim) {
      const h = R.anim; h.anim.t += dt;
      const [hx, hy] = heroDrawPos(h), k = Math.min(1, dt * 6);
      st.cam.x += (hx * T + T / 2 - VIEW.w / 2 - st.cam.x) * k; st.cam.y += (hy * T + T / 2 - VIEW.h / 2 - st.cam.y) * k; camClamp(st);
      if (h.anim.t < STEP_TIME) return; h.anim = null; R.anim = null;
    }
    if (R.wait || G.modal || G.fade.next) return;
    const ex = human(st).explored, n = st.map.n;
    for (let k = 0; k < 2000; k++) {
      const r = R.gen.next(R.input); R.input = undefined;
      if (r.done) { this.aiRun = null; this.lockButtons(false); this.finishDay(st, R.news); return; }
      const a = r.value;
      if (a.kind === 'player') { R.who = a.p; continue; }
      if (a.kind === 'step') {
        if (!st.heroes.includes(a.h) || !(ex[a.fy * n + a.fx] || ex[a.h.y * n + a.h.x])) continue; // niewidoczny ruch: od razu
        if (!R.seen.has(a.h)) { R.seen.add(a.h); centerCam(st, a.fx, a.fy); }
        a.h.anim = { fx: a.fx, fy: a.fy, t: 0 }; R.anim = a.h; return;
      }
      if (a.kind === 'defend') { R.wait = true; this.askDefense(st, a, res => { R.input = res; R.wait = false; }); return; }
    }
  },
  // Przeciwnik atakuje bohatera albo miasto gracza: walka na ekranie bitwy (gracz po prawej) albo automatyczna
  askDefense(st, a, done) {
    const t = a.foe.garrison ? a.foe : null, D = t ? heroInTown(st, t) : a.foe; a.shown = true; centerCam(st, a.foe.x, a.foe.y);
    const who = `${a.h.name} (${ownerName(st, a.h.owner)}) atakuje ${t ? `twoje miasto ${t.name}` : `twojego bohatera: ${heroTitle(D)}`}!`;
    const after = res => this.defenseResult(st, a, D, res, done);
    showDialog(`${who} (siła: twoja ${t ? townPower(st, t) : armyStrength(D)}, wroga ${armyStrength(a.h)})`, [
      { label: 'Walcz', key: 'enter', action: () => G.go('battle', { battle: createBattle(st, a.h, a.foe), onDone: res => G.go('adventure', { after: () => after(res) }) }) },
      { label: 'Automatycznie', key: 'a', action: () => after(resolveBattle(simulateBattle(createBattle(st, a.h, a.foe)), false)) },
    ], { locked: true, iconH: 84, icon: (ctx, cx, cy) => drawHeroPortrait(ctx, cx - 36, cy - 36, a.h, ownerColor(st, a.h.owner), 2) });
  },
  defenseResult(st, a, D, res, done) {
    const held = res.outcome !== 'win', mine = res.foeLost.length ? `Twoje straty: ${res.foeLost.join(', ')}.` : 'Bez strat.';
    const msg = held ? `Obrona udana! ${a.h.name} zostaje odparty. ${mine}${raisedText(res.foeRaised)}${D && res.foeExp ? ` Doświadczenie: +${res.foeExp}.` : ''}`
      : `Porażka w obronie.${res.captured ? ` Miasto ${res.captured} przepada.` : ''}${res.heroDefeated ? ` ${res.heroDefeated.name} ${res.heroDefeated.female ? 'poległa' : 'poległ'}.` : ''} ${mine}`;
    showDialog(msg, [{ label: 'OK', key: 'enter', action: () => { if (held && D && res.foeExp && st.heroes.includes(D)) gainExp(st, D, res.foeExp); } }]);
    done(res);
  },
  finishDay(st, news) {
    st.day++; st.dayTotal++; let newWeek = false, newMonth = false;
    if (st.day > 7) { st.day = 1; st.week++; newWeek = true; if (st.week > 4) { st.week = 1; st.month++; newMonth = true; } }
    for (const h of st.heroes) {
      h.mp = heroMaxMP(h);
      const t = st.towns.find(t => t.x === h.x && t.y === h.y && t.owner === h.owner); // w mieście z gildią pełna mana, poza nim +1 dziennie
      if (t && guildLevel(t)) visitGuild(st, t, h); else h.mana = Math.min(heroMaxMana(h), h.mana + 1 + skillVal(h, 'mysticism'));
    }
    collectIncome(st);
    for (const t of st.towns) t.builtToday = false;
    this.banner = { text: `Dzień ${st.day}`, t: G.time }; Sound.play(newWeek ? 'week' : 'day');
    this.autosave(st);
    const weekNews = newWeek ? startWeek(st, newMonth) : null;
    news.push(...dailyTownCheck(st)); rebuildObjIndex(st); MapRender.miniDirty = true;
    if (weekNews) news.unshift(weekNews);
    if (news.length) showDialog(news.join(' '), [{ label: 'OK', key: 'enter' }]);
  },
  // Koniec gry sprawdzamy w każdej klatce bez otwartego okna: po bitwie, zdobyciu miasta i turze przeciwników
  checkGameEnd(st) {
    if (st.over || G.modal) return; const r = gameResult(st); if (!r) return;
    st.over = r; if (r === 'win') recordScore(st); Sound.play(r === 'win' ? 'victory' : 'defeat');
    const msg = r === 'win' ? `Zwycięstwo! Wszyscy przeciwnicy zostali pokonani w ${st.dayTotal} ${st.dayTotal === 1 ? 'dzień' : 'dni'}. Twoja kronika trafia do księgi najlepszych wyników.`
      : 'Porażka. Twoje królestwo upadło: nie masz już miast ani bohaterów, którzy mogliby walczyć dalej.';
    showDialog(msg, [{ label: 'Menu główne', key: 'enter', action: () => G.go('menu') }, ...(r === 'win' ? [{ label: 'Wyniki', action: () => G.go('scores') }] : [])], { locked: true });
  },
  update(dt) {
    if (G.state && G.state.map) this.layout();
    const st = G.state, K = G.keys, m = G.mouse; if (!st || !st.map) return;
    // ruch wszystkich bohaterów gracza (wybór innego nie zatrzymuje tego, który idzie); kamera śledzi idącego
    let walker = null;
    for (const w of myHeroes(st)) {
      if (w.anim) { w.anim.t += dt; if (w.anim.t >= STEP_TIME) { w.anim = null; if (w.pending) { const f = w.pending; w.pending = null; f(); } else if (w.moving) heroStep(st, w); } }
      else if (w.moving && !G.modal) heroStep(st, w);
      if (w.anim) walker = w;
    }
    if (this.aiRun) { this.updateAi(st, dt); return; }
    this.checkGameEnd(st);
    const h = walker || hero(st);
    this.btnMove.disabled = !(hero(st) && hero(st).path);
    if (G.modal || !h) return;
    if (h.anim) {
      const [hx, hy] = heroDrawPos(h), tx = hx * T + T / 2 - VIEW.w / 2, ty = hy * T + T / 2 - VIEW.h / 2, k = Math.min(1, dt * 5);
      st.cam.x += (tx - st.cam.x) * k; st.cam.y += (ty - st.cam.y) * k; camClamp(st);
    }
    let vx = 0, vy = 0;
    if (K.has('arrowleft')) vx -= 1; if (K.has('arrowright')) vx += 1; if (K.has('arrowup')) vy -= 1; if (K.has('arrowdown')) vy += 1;
    if (!m.down && m.type === 'mouse' && m.x >= 0 && m.x <= VW && m.y >= 0 && m.y <= VH) {
      if (m.x < 10) vx -= 1; else if (m.x > VW - 10) vx += 1;
      if (m.y < 10) vy -= 1; else if (m.y > VH - 10) vy += 1;
    }
    if (vx || vy) { st.cam.x += vx * 640 * dt; st.cam.y += vy * 640 * dt; camClamp(st); }
    if (this.drag && this.drag.moved) G.canvas.style.cursor = 'grabbing';
    else if (inRect(m.x, m.y, VIEW) && !G.hover) G.canvas.style.cursor = 'pointer';
  },
  onPointerDown(x, y) {
    const st = G.state;
    if (inRect(x, y, { x: MINI.x, y: MINI.y, w: MINI.s, h: MINI.s })) { this.drag = { mode: 'mini' }; this.miniJump(x, y); }
    else if (inRect(x, y, VIEW)) this.drag = { mode: 'map', sx: x, sy: y, cx: st.cam.x, cy: st.cam.y, moved: false };
    else if (inRect(x, y, LIST)) this.drag = { mode: 'list', sy: y, s0: this.listScroll || 0, moved: false };
  },
  onPointerMove(x, y) {
    const d = this.drag; if (!d || !G.mouse.down) return;
    clearTimeout(G.pressTimer);
    if (d.mode === 'mini') { this.miniJump(x, y); return; }
    if (d.mode === 'list') { if (Math.abs(y - d.sy) > 6) d.moved = true; if (d.moved) this.listScroll = clamp(d.s0 - Math.round((y - d.sy) / LIST_ROW_H), 0, Math.max(0, panelItems(G.state).length - LIST_ROWS)); return; }
    const dx = x - d.sx, dy = y - d.sy; if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) { G.state.cam.x = d.cx - dx; G.state.cam.y = d.cy - dy; camClamp(G.state); }
  },
  onPointerUp() { const d = this.drag; this.drag = null; return !!(d && (d.mode === 'mini' || d.moved)); }, // przeciągnięcie listy to nie kliknięcie
  miniJump(x, y) { const st = G.state, n = st.map.n; centerCam(st, clamp((x - MINI.x) / MINI.s * n, 0, n) - 0.5, clamp((y - MINI.y) / MINI.s * n, 0, n) - 0.5); },
  onClick(x, y) {
    if (this.aiRun) return; // tura przeciwnika: mapę można tylko oglądać
    if (clickButtons(this.buttons, x, y)) return;
    const st = G.state;
    if (inRect(x, y, LIST)) {
      const r = panelRows(st, this.listScroll).find(r => y >= r.y && y < r.y + 44);
      if (r && r.hero) { if (r.hero === hero(st)) this.heroInfo(); else this.selectHero(r.hero); } else if (r && r.town) G.go('town', { townId: r.town.id });
      return;
    }
    if (inRect(x, y, VIEW)) { const { tx, ty } = screenToTile(st, x, y); this.tileClick(tx, ty); }
  },
  draw(ctx) {
    const st = G.state; if (!st || !st.map) return;
    this.layout();
    ctx.drawImage(Layers.get(`advChrome_${VW}x${VH}`, VW, VH, paintAdvChrome), 0, 0, VW, VH);
    drawMapView(ctx, st, this); drawPanel(ctx, st, this);
    this.buttons.forEach(b => b.draw(ctx));
    drawResourceBar(ctx, st, VH - H, VW);
  },
};

