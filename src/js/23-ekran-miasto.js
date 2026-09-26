// ==================== EKRAN: MIASTO =====================================================
// Widok miasta, lista budowli, garnizon.
G.screens.town = {
  fps: 15, // dym i światła w oknach
  buttons: [], townId: 0, rows: [], hoverSlot: null, scroll: 0, sel: null, garRects: [], heroRects: [],
  LIST_ROWS: 6, // tyle budowli mieści się na liście; resztę przewija się strzałkami albo kółkiem myszy
  town() { return G.state.towns[this.townId]; },
  enter(p) {
    this.townId = p.townId || 0; this.hoverSlot = null; this.msg = null; this.scroll = 0; this.sel = null; this.split = false; this.garRects = []; this.heroRects = [];
    this.guildVisit();
    this.baseButtons = [
      new Button(596, 448, 192, 40, 'Rekrutacja', () => showRecruitList(G.state, this.town(), m => this.say(m)), { key: 'r', size: 16, tip: 'Werbunek jednostek ze wszystkich siedlisk miasta (klawisz R).' }),
      new Button(694, 496, 94, 40, 'Na mapę', () => G.go('adventure'), { key: 'escape', size: 14, tip: 'Wraca na mapę przygody (klawisz Esc).' }),
      new Button(596, 496, 94, 40, 'Dziel', () => { this.split = !this.split; this.say(this.split ? 'Wybierz oddział i miejsce' : 'Przenoszenie całych oddziałów'); }, { key: 'd', size: 14, selected: () => this.split, tip: 'Podział oddziału: przenieś tylko część jednostek (klawisz D albo Shift+klik na miejscu docelowym).' }),
    ];
    this.bRecruitHalf = new Button(596, 448, 94, 40, 'Rekrutacja', this.baseButtons[0].action, { key: 'r', size: 14, tip: this.baseButtons[0].tip });
    this.bShip = new Button(694, 448, 94, 40, 'Łódź', () => this.showShipyard(), { key: 's', size: 14, tip: 'Stocznia: kup łódź (1000 złota i 10 drewna); pojawi się na wodzie przy mieście.' });
    this.btnUp = new Button(596, 392, 44, 28, 'W górę', () => this.onWheel(-1), { icon: iconArrow(-1), tip: 'Przewiń listę budowli w górę.' });
    this.btnDown = new Button(744, 392, 44, 28, 'W dół', () => this.onWheel(1), { icon: iconArrow(1), tip: 'Przewiń listę budowli w dół.' });
    this.buttons = this.baseButtons;
  },
  showShipyard() {
    const st = G.state, t = this.town();
    showDialog(`Stocznia. Łódź kosztuje ${BOAT_COST.gold} złota i ${BOAT_COST.wood} drewna i czeka na wodzie przy mieście. Bohater wsiada, wchodząc na nią z brzegu.`, [
      { label: 'Kup łódź', key: 'enter', action: () => { const e = buyBoat(st, t); this.say(e || 'Łódź czeka na wodzie przy mieście'); } },
      { label: 'Wyjdź', key: 'escape' }]);
  },
  onWheel(d) { const n = availableBuildings(this.town()).length; this.scroll = clamp(this.scroll + d, 0, Math.max(0, n - this.LIST_ROWS)); },
  say(m) { this.msg = m; this.msgT = G.time; },
  // Bohater w mieście z gildią poznaje jej czary i odnawia manę
  guildVisit() {
    const st = G.state, t = this.town(), h = heroInTown(st, t); if (!h || !guildLevel(t)) return;
    const learned = visitGuild(st, t, h); if (learned.length) this.say(`${h.name} poznaje: ${learned.map(id => SPELLS[id].name).join(', ')}`);
  },
  // Tawerna: dwóch chętnych na ten tydzień, najem za HERO_COST złota; nowy bohater staje w bramie miasta
  showTavern() {
    const st = G.state, t = this.town(), offers = tavernOffer(st, t.owner), avail = offers.map((o, k) => o && { o, k }).filter(Boolean);
    const who = o => `${o.name} (${(o.female ? HERO_CLASSES[o.cls].nameF : HERO_CLASSES[o.cls].name).toLowerCase()}, ${factionOf(o.fac).name})`;
    if (!avail.length) return showDialog('W tawernie nikt już nie czeka. Nowi chętni pojawią się w przyszłym tygodniu.', [{ label: 'OK', key: 'enter' }]);
    showDialog(`W tawernie czekają: ${avail.map(a => who(a.o)).join(' i ')}. Najem kosztuje ${HERO_COST} złota, a bohater przychodzi z małym oddziałem.`, [
      ...avail.map(({ o, k }) => ({ label: o.name, action: () => { const r = hireHero(st, t, k); this.say(r.error || `${r.hero.name} dołącza do twojej sprawy`); } })),
      { label: 'Wyjdź', key: 'escape' },
    ], { iconH: 96, icon: (ctx, cx, cy) => avail.forEach(({ o }, i) => {
      const x = cx + (i - (avail.length - 1) / 2) * 144 - 36, look = { name: o.name, cls: o.cls, female: o.female, asleep: false };
      drawHeroPortrait(ctx, x, cy - 44, look, ownerColor(st, t.owner), 2);
    }) });
  },
  // Kuźnia: machiny wojenne dla bohatera stojącego w mieście
  showSmith() {
    const st = G.state, t = this.town(), h = heroInTown(st, t);
    if (!h) return showDialog('Kuźnia sprzedaje machiny wojenne: balistę, namiot medyka i wóz z amunicją. Wprowadź bohatera do miasta, aby je kupić.', [{ label: 'OK', key: 'enter' }]);
    const offer = MACHINES.filter(id => !h.machines.includes(id));
    if (!offer.length) return showDialog(`${h.name} ma już wszystkie machiny wojenne.`, [{ label: 'OK', key: 'enter' }]);
    const bw = 150, gap = 24, total = offer.length * bw + (offer.length - 1) * gap;
    showDialog(`Kuźnia: machiny dla bohatera ${h.name}. Balista strzela co rundę, namiot medyka leczy rannych, a wóz z amunicją daje strzelcom niekończące się strzały.`, [
      ...offer.map(id => ({ label: CREATURES[id].name, sub: `${CREATURES[id].cost.gold} złota`, tip: stackInfo({ cid: id, n: 1 }), action: () => { const e = buyMachine(st, t, h, id); this.say(e || `Kupiono: ${CREATURES[id].name.toLowerCase()}`); if (!e) this.showSmith(); } })),
      { label: 'Wyjdź', key: 'escape' },
    ], { bw, iconH: 70, icon: (ctx, cx, cy) => offer.forEach((id, i) => drawSprite(ctx, battleSprite(id, 1, 'idle', 0), cx - total / 2 + i * (bw + gap) + bw / 2, cy + 26, 1)) });
  },
  showGuild() { if (guildLevel(this.town())) showGuildView(G.state, this.town(), this); },
  onKey(k) { if (k === 'g') this.showGuild(); },
  tryBuild(B) {
    const st = G.state, t = this.town(), info = bInfo(B, t.faction);
    if (t.builtToday) return this.say('W tym mieście zbudowano już dziś budowlę');
    if (!canAfford(st, B.cost)) return this.say('Brakuje zasobów na tę budowlę');
    showDialog(`Zbudować: ${info.name}? ${info.desc}`, [
      { label: 'Zbuduj', key: 'enter', action: () => { buildIn(st, t, B); this.say(`Zbudowano: ${info.name}`); if (/^guild/.test(B.id)) this.guildVisit(); } },
      { label: 'Nie', key: 'escape' },
    ], { iconH: 40, icon: (ctx, cx, cy) => { ctx.font = font(14, 700, 'body'); const w = RESOURCES.reduce((a, r) => a + (B.cost[r.id] ? 29 + ctx.measureText(String(B.cost[r.id])).width : 0), 0); drawCost(ctx, B.cost, cx - w / 2, cy, { size: 24 }); } });
  },
  slotAt(x, y) {
    if (x > 584 || y > 430) return null;
    const RR = (TownFXCache[lastTownKey] || {}).rects || {}; let best = null;
    for (const [i, r] of Object.entries(RR)) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h && (!best || r.z < best.z)) best = { i: +i, z: r.z };
    return best ? best.i : null;
  },
  onPointerMove(x, y) { this.hoverSlot = this.slotAt(x, y); },
  // Miejsca armii: [{ a: tablica armii, i: indeks }] garnizonu i bohatera w mieście
  armySlotAt(x, y) {
    const t = this.town(), hh = heroInTown(G.state, t), g = hitRect(this.garRects, x, y); if (g) return { a: t.garrison, i: g.i };
    const r = hh && hitRect(this.heroRects, x, y); return r ? { a: hh.army, i: r.i } : null;
  },
  onClick(x, y) {
    if (clickButtons(this.buttons, x, y)) return;
    const st = G.state, t = this.town(), fac = t.faction, row = this.rows.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    const hh0 = heroInTown(st, t); if (hh0 && x >= 38 && x <= 74 && y >= 505 && y <= 541) return G.go('hero', { heroId: st.heroes.indexOf(hh0), back: { name: 'town', params: { townId: this.townId } } });
    const slot = this.armySlotAt(x, y);
    if (slot) { // zaznacz oddział, potem wskaż miejsce: przeniesienie, połączenie albo zamiana
      if (!this.sel) { if (slot.a[slot.i]) this.sel = slot; return; }
      const hh = heroInTown(st, t), from = this.sel, heroes = hh ? [hh.army] : []; this.sel = null;
      if (this.split || G.keys.has('shift')) { this.split = false; showSplit(from.a, from.i, slot.a, slot.i, heroes, err => { if (err) this.say(err); }); return; }
      const err = armyMove(from.a, from.i, slot.a, slot.i, heroes); if (err) this.say(err); return;
    }
    this.sel = null;
    if (row) return this.tryBuild(row.B);
    const i = this.slotAt(x, y); if (i === null) return;
    const B = slotBuilding(t, i), next = BUILDINGS.find(b => b.slot === i && !hasB(t, b.id));
    const dw = B && /^dw(\d)u?$/.exec(B.id); if (dw) return showRecruit(st, t, +dw[1], m => this.say(m)); // siedlisko: werbunek
    if (B && /^guild/.test(B.id)) return this.showGuild(); // gildia: podgląd czarów (rozbudowa z listy albo przyciskiem w gildii)
    if (B && B.id === 'tavern') return this.showTavern();
    if (B && B.id === 'smith') return this.showSmith();
    if (B && B.id === 'market' && !(next && reqMet(t, next))) return showMarket(st, t.owner, m => this.say(m));
    if (next && reqMet(t, next)) this.tryBuild(next);
    else if (next) showDialog(`${bInfo(next, fac).name} wymaga wcześniej: ${next.req.map(r => bInfo(BUILD_BY_ID[r], fac).name).join(', ')}.`, [{ label: 'OK', key: 'enter' }]);
    else if (B) showDialog(`${bInfo(B, fac).name}. ${bInfo(B, fac).desc}`, [{ label: 'OK', key: 'enter' }]);
  },
  rightInfo(x, y) {
    const t = this.town(), fac = t.faction, row = this.rows.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (row) { const inf = bInfo(row.B, fac); return `${inf.name}. ${inf.desc}`; }
    const slot = this.armySlotAt(x, y);
    if (slot) return slot.a[slot.i] ? stackInfo(slot.a[slot.i]) : 'Wolne miejsce. Kliknij oddział, a potem miejsce, aby go przenieść, połączyć z takim samym albo zamienić.';
    if (x >= 600 && x <= 784 && y >= 40 && y <= 60) { const F = factionOf(fac); return `${F.name}: ${F.desc} Cecha frakcji — ${traitText(fac)}.`; }
    const i = this.slotAt(x, y); if (i === null) return resourceBarInfo(G.state, x, y);
    const B = slotBuilding(t, i); if (B) { const inf = bInfo(B, fac), dw = /^dw(\d)u?$/.exec(B.id); return `${inf.name}. ${inf.desc}` + (dw ? ` Dostępne: ${t.avail[+dw[1]] || 0}. Kliknij, aby werbować.` : B.id === 'tavern' ? ` Kliknij, aby nająć bohatera (${HERO_COST} złota).` : B.id === 'smith' ? ' Kliknij, aby kupić machiny wojenne.' : B.id === 'market' ? ' Kliknij, aby handlować.' : /^guild/.test(B.id) ? ' Kliknij, aby obejrzeć czary (klawisz G).' : ''); }
    const next = BUILDINGS.find(b => b.slot === i && !hasB(t, b.id)); if (next) { const inf = bInfo(next, fac); return `${inf.name} (niezbudowane). ${inf.desc}`; }
    return null;
  },
  draw(ctx) {
    const st = G.state, t = this.town(), fac = t.faction, col = ownerColor(st, t.owner);
    drawLayer(ctx, Layers.get('townChrome', W, H, paintTownChrome), 0, 0);
    const key = `tw_${fac}_${townLayout(t).seed}_${[...t.built].sort().join('.')}_${col}`;
    if (lastTownKey && lastTownKey !== key) { delete Layers.cache[lastTownKey]; delete TownFXCache[lastTownKey]; }
    lastTownKey = key;
    const scene = Layers.get(key, 592, 438, c => { c.imageSmoothingEnabled = false; TownFXCache[key] = paintTownScene(c, t, col); }, TOWN_ART_SCALE);
    const fb = pixBuf('townFx', scene.width, scene.height), fbx = fb._ctx;
    if (fb._key !== key || !(G.time >= fb._t && G.time - fb._t < 1 / 15)) { // dym i światła w oknach: najwyżej 15 klatek na sekundę
      fbx.setTransform(1, 0, 0, 1, 0, 0); fbx.imageSmoothingEnabled = false; fbx.clearRect(0, 0, fb.width, fb.height); fbx.drawImage(scene, 0, 0);
      fbx.setTransform(TOWN_ART_SCALE, 0, 0, TOWN_ART_SCALE, 0, 0); drawTownFX(fbx, t, TownFXCache[key] || { wins: [], smokes: [] }); fb._key = key; fb._t = G.time;
    }
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(fb, 0, 0, fb.width / TOWN_ART_SCALE, fb.height / TOWN_ART_SCALE); ctx.restore();
    this.fb = fb; // widok z okna gildii
    if (this.hoverSlot !== null && !G.modal) {
      const hb = ((TownFXCache[key] || {}).rects || {})[this.hoverSlot] || { x: 0, y: 0, w: 0, h: 0 };
      const s = { x: hb.x, b: hb.y + hb.h, w: hb.w, h: hb.h }, B = slotBuilding(t, this.hoverSlot), next = BUILDINGS.find(b => b.slot === this.hoverSlot && !hasB(t, b.id));
      ctx.strokeStyle = 'rgba(255,232,154,.85)'; ctx.lineWidth = 2; rr(ctx, s.x - 2, s.b - s.h - 4, s.w + 4, s.h + 8, 5); ctx.stroke();
      const label = B ? bInfo(B, fac).name : (next ? `${bInfo(next, fac).name} (do zbudowania)` : '');
      if (label) { ctx.font = font(15, 700, 'title'); const w = ctx.measureText(label).width + 20, x = clamp(s.x + s.w / 2 - w / 2, 12, 580 - w), y = Math.max(14, s.b - s.h - 30);
        ctx.fillStyle = 'rgba(12,8,3,.82)'; rr(ctx, x, y, w, 22, 3); ctx.fill(); text(ctx, label, x + w / 2, y + 11, { size: 15, align: 'center', color: '#f3e2b0', fam: 'title' }); }
    }
    // garnizon i armia bohatera stojącego w mieście
    const hh = heroInTown(st, t), selOf = a => (this.sel && this.sel.a === a ? this.sel.i : -1);
    text(ctx, 'Garnizon', 56, 471, { size: 15, align: 'center', color: '#f0e4c0', fam: 'title' });
    this.garRects = drawArmyRow(ctx, t.garrison, 100, 446, { sel: selOf(t.garrison) });
    if (hh) { drawHeroPortrait(ctx, 38, 505, hh, ownerColor(st, hh.owner)); this.heroRects = drawArmyRow(ctx, hh.army, 100, 498, { sel: selOf(hh.army) }); }
    else { this.heroRects = []; text(ctx, 'Brak bohatera w mieście. Wejdź bohaterem, aby przekazać mu wojsko.', 335, 523, { size: 13, italic: true, weight: 500, align: 'center', color: 'rgba(240,228,192,.55)' }); }
    if (this.sel && !this.sel.a[this.sel.i]) this.sel = null;
    const rb = this.baseButtons[0]; rb.disabled = !dwellingLevels(t).length;
    rb.tip = rb.disabled ? 'Najpierw zbuduj siedlisko jednostek (np. z listy budowli po prawej).' : 'Werbunek jednostek ze wszystkich siedlisk miasta (klawisz R).';
    text(ctx, t.name, 692, 28, { size: 20, align: 'center', color: '#f3e2b0', fam: 'title' });
    text(ctx, `${factionOf(fac).name}, ${townGold(t)} złota dziennie`, 692, 50, { size: 14, weight: 500, align: 'center', color: '#d8c8a0' });
    text(ctx, t.builtToday ? 'Budowa: wykorzystana dziś' : 'Budowa: dostępna', 692, 70, { size: 14, weight: 500, align: 'center', color: t.builtToday ? '#e0a070' : '#8ad080' });
    const list = availableBuildings(t), N = this.LIST_ROWS; this.rows = [];
    this.scroll = clamp(this.scroll, 0, Math.max(0, list.length - N));
    list.slice(this.scroll, this.scroll + N).forEach((B, i) => {
      const y = 88 + i * 50, afford = canAfford(st, B.cost) && !t.builtToday, info = bInfo(B, fac);
      this.rows.push({ B, x: 596, y, w: 192, h: 46 });
      const hot = !G.modal && G.mouse.x >= 596 && G.mouse.x <= 788 && G.mouse.y >= y && G.mouse.y <= y + 46;
      ctx.fillStyle = hot ? 'rgba(210,160,60,.3)' : 'rgba(0,0,0,.3)'; rr(ctx, 596, y, 192, 46, 3); ctx.fill();
      ctx.strokeStyle = afford ? '#b8913f' : '#6a5a3a'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.font = font(14, 700, 'title'); let fs = 14; while (fs > 10 && ctx.measureText(info.name).width > 180) { fs--; ctx.font = font(fs, 700, 'title'); }
      text(ctx, info.name, 604, y + 14, { size: fs, color: afford ? '#f3e2b0' : '#a89a80', fam: 'title' });
      drawCost(ctx, B.cost, 604, y + 32, { size: 18, font: 13, color: '#e8dcb8', missing: '#e07a6a', free: '#8ad080', have: human(st).resources });
    });
    if (!list.length) text(ctx, 'Brak dostępnych budowli', 692, 120, { size: 13, italic: true, weight: 500, align: 'center', color: '#c8b68a' });
    const paged = list.length > N;
    const base = hasB(t, 'shipyard') ? [this.bRecruitHalf, this.bShip, ...this.baseButtons.slice(1)] : this.baseButtons; // ze stocznią: werbunek i łódź obok siebie
    this.buttons = paged ? [...base, this.btnUp, this.btnDown] : base;
    if (paged) {
      this.btnUp.disabled = this.scroll === 0; this.btnDown.disabled = this.scroll >= list.length - N;
      text(ctx, `${this.scroll + 1}–${Math.min(list.length, this.scroll + N)} z ${list.length}`, 692, 406, { size: 13, italic: true, weight: 500, align: 'center', color: '#c8b68a' });
    }
    this.buttons.forEach(b => b.draw(ctx));
    if (this.msg && G.time - this.msgT < 2.4) { ctx.fillStyle = 'rgba(12,8,3,.8)'; rr(ctx, 160, 398, 272, 26, 4); ctx.fill(); text(ctx, this.msg, 296, 411, { size: 15, align: 'center', color: '#ffd98a', fam: 'title' }); }
    drawResourceBar(ctx, st);
  },
};
function paintTownChrome(c) {
  stoneFill(c, 0, 0, W, H);
  goldFrame(c, 8, 8, 576, 422);
  c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, 12, 440, 568, 112, 4); c.fill(); c.strokeStyle = '#8a6d32'; c.lineWidth = 1.2; c.stroke();
  rr(c, 592, 12, 200, 528, 4); c.fill(); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, 8, 569, 784, 27, 3); c.fill(); c.strokeStyle = '#8a6d32'; c.lineWidth = 1; c.stroke();
}

// --- gildia magów: wnętrze w stylu frakcji, okno z żywym widokiem na miasto, półki z czarami poziomów 1–5 (na górze 5) ---
// Zbudowane poziomy mają zwoje (klik: opis w ramce pod oknem, prawy przycisk: dymek), niezbudowane stoją puste z wymaganiem.
const GUILD_LOOK = { // kształt okna, materiał półek i kolor krawędzi, drobiazgi przy oknie
  haven: { win: 'pointed', shelf: '#7a5230', edge: '#e0c068', deco: 'candles' }, sylvan: { win: 'round', shelf: '#5a3c20', edge: '#6ab84a', deco: 'vines' },
  barrow: { win: 'pointed', shelf: '#3a3444', edge: '#8af0a0', deco: 'skulls' }, fortress: { win: 'round', shelf: '#6a5030', edge: '#c8b060', deco: 'herbs' },
  inferno: { win: 'arch', shelf: '#2a1a1a', edge: '#ff7a1a', deco: 'braziers' }, academy: { win: 'arch', shelf: '#d8dce6', edge: '#d8a830', deco: 'orbs' },
  dungeon: { win: 'rough', shelf: '#4a4454', edge: '#c080ff', deco: 'crystals' }, stronghold: { win: 'rough', shelf: '#7a5030', edge: '#e8dcc0', deco: 'totems' },
};
const GV = { x: 20, y: 14, w: 760, h: 552, win: { x: 44, y: 70, w: 272, h: 232 }, info: { x: 40, y: 318, w: 280, h: 200 }, sh: { x: 340, y: 70, w: 420, row: 90 } };
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
function guildWinPath(c, kind, x, y, w, h, grow = 0) { // obrys okna: ostrołuk, koło, łuk albo poszarpana szczelina w skale
  const X = x - grow, Y = y - grow, Wd = w + grow * 2, Hd = h + grow * 2; c.beginPath();
  if (kind === 'round') c.ellipse(X + Wd / 2, Y + Hd / 2, Wd / 2, Hd / 2, 0, 0, TAU);
  else if (kind === 'rough') { const r = mulberry32(5), n = 14; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 0.92 + r() * 0.1; c.lineTo(X + Wd / 2 + Math.cos(a) * Wd / 2 * k, Y + Hd / 2 + Math.sin(a) * Hd / 2 * k); } c.closePath(); }
  else if (kind === 'pointed') { c.moveTo(X, Y + Hd); c.lineTo(X, Y + Hd * 0.42); c.quadraticCurveTo(X, Y + Hd * 0.08, X + Wd / 2, Y); c.quadraticCurveTo(X + Wd, Y + Hd * 0.08, X + Wd, Y + Hd * 0.42); c.lineTo(X + Wd, Y + Hd); c.closePath(); }
  else { c.moveTo(X, Y + Hd); c.lineTo(X, Y + Wd / 2); c.arc(X + Wd / 2, Y + Wd / 2, Wd / 2, Math.PI, 0); c.lineTo(X + Wd, Y + Hd); c.closePath(); }
}
function paintGuildRoom(c, fac) { // nieruchome wnętrze gildii (raz na frakcję)
  const A = TOWN_ART[fac] || TOWN_ART.haven, L = GUILD_LOOK[fac] || GUILD_LOOK.haven, { win: Wn, info: I, sh: S } = GV;
  wallRect(c, A, GV.x, GV.y, GV.w, GV.h); c.fillStyle = 'rgba(8,6,10,.42)'; c.fillRect(GV.x, GV.y, GV.w, GV.h);
  c.strokeStyle = L.edge; c.lineWidth = 3; c.strokeRect(GV.x + 1.5, GV.y + 1.5, GV.w - 3, GV.h - 3); c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 2; c.strokeRect(GV.x + 5, GV.y + 5, GV.w - 10, GV.h - 10);
  c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, GV.x + GV.w / 2 - 230, GV.y + 10, 460, 36, 6); c.fill(); c.strokeStyle = L.edge; c.lineWidth = 1.5; c.stroke();
  guildWinPath(c, L.win, Wn.x, Wn.y, Wn.w, Wn.h, 12); c.fillStyle = sh(A.wall[1], -0.25); c.fill(); guildWinPath(c, L.win, Wn.x, Wn.y, Wn.w, Wn.h, 6); c.fillStyle = sh(A.wall[0], 0.05); c.fill(); // rama okna
  c.strokeStyle = L.edge; c.lineWidth = 2; guildWinPath(c, L.win, Wn.x, Wn.y, Wn.w, Wn.h, 7); c.stroke();
  c.fillStyle = sh(A.wall[1], -0.1); c.fillRect(Wn.x - 18, Wn.y + Wn.h + 2, Wn.w + 36, 9); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(Wn.x - 18, Wn.y + Wn.h + 9, Wn.w + 36, 3); // parapet
  guildDecor(c, L.deco, Wn, L);
  c.fillStyle = 'rgba(12,8,4,.72)'; rr(c, I.x, I.y + 8, I.w, I.h, 6); c.fill(); c.strokeStyle = L.edge; c.lineWidth = 1.2; c.stroke();
  for (let i = 0; i < 5; i++) { // półki
    const y = S.y + i * S.row + 74; c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(S.x, y - 72, S.w, 72);
    c.fillStyle = L.shelf; c.fillRect(S.x - 4, y, S.w + 8, 10); c.fillStyle = sh(L.shelf, 0.25); c.fillRect(S.x - 4, y, S.w + 8, 2); c.fillStyle = sh(L.shelf, -0.35); c.fillRect(S.x - 4, y + 8, S.w + 8, 2);
    c.fillStyle = L.edge; c.fillRect(S.x - 4, y + 10, S.w + 8, 1.5);
    for (const bx of [S.x + 14, S.x + S.w - 20]) { fillPoly(c, [[bx, y + 10], [bx + 6, y + 10], [bx + 6, y + 22], [bx + 3, y + 22]], sh(L.shelf, -0.2)); }
    c.fillStyle = 'rgba(0,0,0,.6)'; rr(c, S.x - 2, y - 66, 30, 22, 4); c.fill(); c.strokeStyle = L.edge; c.lineWidth = 1; c.stroke(); // tabliczka poziomu
  }
}
function guildDecor(c, kind, Wn, L) { // drobiazgi przy oknie, różne dla każdej frakcji
  const lx = Wn.x - 4, rx = Wn.x + Wn.w + 4, sy = Wn.y + Wn.h + 2;
  if (kind === 'candles') for (const [x, hh] of [[lx + 14, 18], [lx + 24, 12], [rx - 18, 16]]) { c.fillStyle = '#efe4c8'; c.fillRect(x - 2.5, sy - hh, 5, hh); c.fillStyle = '#ffd070'; c.beginPath(); c.ellipse(x, sy - hh - 4, 2.5, 4.5, 0, 0, TAU); c.fill(); }
  else if (kind === 'vines') { c.strokeStyle = '#3a6a2a'; c.lineWidth = 2.5; for (const sd of [0, 1]) { const x0 = sd ? rx + 4 : lx - 4; c.beginPath(); c.moveTo(x0, Wn.y - 6); for (let k = 1; k <= 8; k++) c.lineTo(x0 + Math.sin(k * 1.3) * 6, Wn.y - 6 + k * 30); c.stroke(); for (let k = 1; k < 8; k++) { c.fillStyle = k % 3 ? '#4a8a3a' : '#f070a0'; c.beginPath(); c.ellipse(x0 + Math.sin(k * 1.3) * 6 + 5, Wn.y - 6 + k * 30, 5, 3, 0.5, 0, TAU); c.fill(); } } }
  else if (kind === 'skulls') { for (const x of [lx + 16, rx - 16]) drawEmblem(c, 'skull', x, sy - 8, 14, BONE); c.fillStyle = '#e8e0cc'; c.fillRect(lx + 34, sy - 14, 4, 14); c.fillStyle = '#8af0a0'; c.beginPath(); c.ellipse(lx + 36, sy - 18, 2.5, 4.5, 0, 0, TAU); c.fill(); }
  else if (kind === 'herbs') for (let k = 0; k < 5; k++) { const x = Wn.x + 20 + k * (Wn.w - 40) / 4; c.strokeStyle = '#3a2a14'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, Wn.y - 12); c.lineTo(x, Wn.y + 4); c.stroke(); c.fillStyle = ['#6a9a3a', '#c8a040', '#8a5aa8', '#5a8a6a', '#b86a3a'][k]; fillPoly(c, [[x - 5, Wn.y + 4], [x + 5, Wn.y + 4], [x + 2, Wn.y + 18], [x - 2, Wn.y + 18]], c.fillStyle); }
  else if (kind === 'braziers') for (const x of [lx + 10, rx - 10]) { c.fillStyle = '#1a0e0c'; c.fillRect(x - 1.5, sy - 20, 3, 20); fillPoly(c, [[x - 8, sy - 24], [x + 8, sy - 24], [x + 5, sy - 19], [x - 5, sy - 19]], '#2a1a16'); c.fillStyle = '#ff9a30'; c.beginPath(); c.moveTo(x - 6, sy - 24); c.quadraticCurveTo(x, sy - 40, x + 6, sy - 24); c.fill(); }
  else if (kind === 'orbs') for (const [x, y, r] of [[lx + 12, Wn.y + 30, 7], [rx - 10, Wn.y + 70, 5], [lx + 8, Wn.y + 130, 4]]) { c.fillStyle = '#a8e0ff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU); c.fill(); }
  else if (kind === 'crystals') for (const x of [lx + 14, rx - 14]) crystals(c, x, sy, 0.6, '#b070f0');
  else if (kind === 'totems') for (const x of [lx + 4, rx - 4]) totem(c, x, sy, 60, '#7a4a24', '#ffb050');
}
function drawScroll(ctx, cx, top, id, hot, known) { // zwój z ikoną czaru; hot = pod myszą, known = bohater w mieście już go zna
  const w = 50, h = 58, y = top - (hot ? 3 : 0);
  if (hot) { ctx.fillStyle = 'rgba(255,230,150,.28)'; rr(ctx, cx - w / 2 - 6, y - 8, w + 12, h + 16, 8); ctx.fill(); }
  ctx.fillStyle = '#e8d8b0'; ctx.fillRect(cx - w / 2, y + 4, w, h - 8); ctx.fillStyle = 'rgba(120,90,40,.25)'; ctx.fillRect(cx + w / 2 - 8, y + 4, 8, h - 8);
  for (const yy of [y + 4, y + h - 4]) { ctx.fillStyle = '#c8b080'; ctx.beginPath(); ctx.ellipse(cx, yy, w / 2 + 3, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#a88a58'; ctx.beginPath(); ctx.ellipse(cx + w / 2 + 3, yy, 2.5, 5, 0, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.translate(cx, y + h / 2); ctx.scale(1.45, 1.45); drawSpellIcon(ctx, id); ctx.restore();
  if (known) { ctx.strokeStyle = '#2a8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + w / 2 - 12, y + 12); ctx.lineTo(cx + w / 2 - 7, y + 17); ctx.lineTo(cx + w / 2 + 1, y + 6); ctx.stroke(); }
  let fs = 12; ctx.font = font(fs, 700, 'body'); const nm = SPELLS[id].name; while (fs > 9 && ctx.measureText(nm).width > 124) { fs--; ctx.font = font(fs, 700, 'body'); }
  const tw = ctx.measureText(nm).width + 10; ctx.fillStyle = 'rgba(12,8,4,.72)'; rr(ctx, cx - tw / 2, top + h + 2, tw, 16, 3); ctx.fill();
  text(ctx, nm, cx, top + h + 10, { size: fs, align: 'center', color: '#f3e2b0' });
}
function showGuildView(st, t, scr) {
  const F = factionOf(t.faction), L0 = GUILD_LOOK[t.faction] || GUILD_LOOK.haven, { win: Wn, info: I, sh: S } = GV;
  const next = BUILDINGS.find(b => /^guild/.test(b.id) && !hasB(t, b.id));
  const close = new Button(GV.x + GV.w - 148, GV.y + GV.h - 48, 128, 36, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 16 });
  const up = next && reqMet(t, next) ? new Button(I.x + 8, GV.y + GV.h - 48, 150, 36, 'Rozbuduj', () => { G.modal = null; scr.tryBuild(next); }, { size: 15, tip: `Zbuduj: ${bInfo(next, t.faction).name}.` }) : null;
  const M = {
    guild: true, sel: null, rects: [], buttons: up ? [up, close] : [close],
    spAt() { const h = heroInTown(st, t); return h ? heroStat(h, 'sp') : 1; },
    scrollAt(x, y) { const r = this.rects.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); return r ? r.id : null; },
    onClick(x, y) { const id = this.scrollAt(x, y); if (id) this.sel = id; },
    rightInfo(x, y) {
      const id = this.scrollAt(x, y); if (id) { const Sp = SPELLS[id]; return `${Sp.name} (poziom ${Sp.level}, ${Sp.cost} many, ${Sp.kind === 'battle' ? 'w bitwie' : 'na mapie'}): ${Sp.desc(this.spAt())}.`; }
      if (x >= Wn.x && x <= Wn.x + Wn.w && y >= Wn.y && y <= Wn.y + Wn.h) return `Widok z okna gildii na miasto ${t.name}.`;
      return null;
    },
    draw(ctx) {
      dimScreen(ctx, 0.55); drawLayer(ctx, Layers.get(`guildRoom_${t.faction}`, W, H, c => paintGuildRoom(c, t.faction)), 0, 0);
      const Lv = guildLevel(t), h = heroInTown(st, t);
      text(ctx, `${F.guild}${Lv > 1 ? ' ' + ROMAN[Lv] : ''} — ${t.name}`, GV.x + GV.w / 2, GV.y + 28, { size: 21, align: 'center', color: '#f3e2b0', fam: 'title' });
      const fb = scr.fb; // żywy widok na miasto (bufor sceny z dymem i światłami)
      ctx.save(); guildWinPath(ctx, L0.win, Wn.x, Wn.y, Wn.w, Wn.h, 0); ctx.clip(); ctx.fillStyle = '#10121a'; ctx.fillRect(Wn.x, Wn.y, Wn.w, Wn.h);
      if (fb) { const hall = ((TownFXCache[lastTownKey] || {}).rects || {})[0], k = TOWN_ART_SCALE, sh3 = 422 * k, sw = sh3 * Wn.w / Wn.h, hx = hall ? (hall.x + hall.w / 2) * k : fb.width / 2;
        const sx = clamp(hx - sw / 2, 8 * k, fb.width - 8 * k - sw); ctx.imageSmoothingEnabled = false; ctx.drawImage(fb, sx, 8 * k, sw, sh3, Wn.x, Wn.y, Wn.w, Wn.h); }
      const vg = ctx.createRadialGradient(Wn.x + Wn.w / 2, Wn.y + Wn.h / 2, Wn.h * 0.3, Wn.x + Wn.w / 2, Wn.y + Wn.h / 2, Wn.h * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(Wn.x, Wn.y, Wn.w, Wn.h);
      ctx.strokeStyle = 'rgba(20,14,8,.85)'; ctx.lineWidth = 3; if (L0.win === 'pointed' || L0.win === 'arch') { ctx.beginPath(); ctx.moveTo(Wn.x + Wn.w / 2, Wn.y + 8); ctx.lineTo(Wn.x + Wn.w / 2, Wn.y + Wn.h); ctx.moveTo(Wn.x, Wn.y + Wn.h * 0.55); ctx.lineTo(Wn.x + Wn.w, Wn.y + Wn.h * 0.55); ctx.stroke(); } // szprosy
      ctx.restore();
      this.rects = []; const mx = G.mouse.x, my = G.mouse.y;
      for (let row = 0; row < 5; row++) {
        const lvl = 5 - row, y = S.y + row * S.row, built = lvl <= Lv, ids = built ? ((t.guild || {})[lvl] || []) : [], n = GUILD_OFFER[lvl] || 1, slotW = (S.w - 34) / 3;
        text(ctx, ROMAN[lvl], S.x + 13, y + 19, { size: 14, align: 'center', color: built ? '#f3e2b0' : '#8a7a60', fam: 'title' });
        for (let k = 0; k < n; k++) {
          const cx = S.x + 34 + slotW * (k + (3 - n) / 2) + slotW / 2, top = y - 4;
          if (built && ids[k]) { const r = { x: cx - 30, y: top - 6, w: 60, h: 74, id: ids[k] }; this.rects.push(r); const hot = !G.popup && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
            if (this.sel === ids[k]) { ctx.strokeStyle = L0.edge; ctx.lineWidth = 2; rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 6); ctx.stroke(); }
            drawScroll(ctx, cx, top, ids[k], hot, h && knows(h, ids[k])); }
          else { ctx.strokeStyle = 'rgba(200,180,140,.35)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; rr(ctx, cx - 24, top + 2, 48, 54, 4); ctx.stroke(); ctx.setLineDash([]); text(ctx, '?', cx, top + 29, { size: 20, align: 'center', color: 'rgba(200,180,140,.4)', fam: 'title' }); }
        }
        if (!built) { const B = BUILD_BY_ID['guild' + lvl], need = B.req.filter(r => !hasB(t, r)).map(r => bInfo(BUILD_BY_ID[r], t.faction).name), msg = `Nie zbudowano: ${bInfo(B, t.faction).name}${need.length ? ` (wymaga: ${need.join(', ')})` : ''}`;
          ctx.font = font(11, 600, 'body'); let m2 = msg; while (ctx.measureText(m2).width > S.w - 40 && m2.length > 10) m2 = m2.slice(0, -2); if (m2 !== msg) m2 = m2.slice(0, -1) + '…';
          ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(ctx, S.x + 34, y + 58, S.w - 38, 16, 3); ctx.fill(); text(ctx, m2, S.x + 34 + (S.w - 38) / 2, y + 66, { size: 11, weight: 600, align: 'center', color: '#e0b890' }); }
      }
      // ramka pod oknem: opis wybranego czaru albo stan gildii
      const tx = I.x + 14, ty = I.y + 28, tw = I.w - 28;
      if (this.sel) {
        const Sp = SPELLS[this.sel], sp = this.spAt();
        ctx.save(); ctx.translate(tx + 20, ty + 14); ctx.scale(1.7, 1.7); drawSpellIcon(ctx, this.sel); ctx.restore();
        text(ctx, Sp.name, tx + 46, ty + 6, { size: 17, color: '#f3e2b0', fam: 'title' });
        text(ctx, `Poziom ${Sp.level} · ${Sp.cost} many · ${Sp.kind === 'battle' ? 'czar bitewny' : 'czar mapy'}`, tx + 46, ty + 24, { size: 12, weight: 600, color: '#c8b88a' });
        ctx.font = font(13, 500, 'body'); wrapText(ctx, `${cap1(Sp.desc(sp))}.`, tw).slice(0, 4).forEach((l, i) => text(ctx, l, tx, ty + 50 + i * 17, { size: 13, weight: 500, color: '#ecd9a8' }));
        text(ctx, `Moc czarów: ${sp}${h ? ` (${h.name})` : ' (bez bohatera)'}`, tx, ty + 124, { size: 12, weight: 600, color: '#c8b88a' });
        text(ctx, h ? (knows(h, this.sel) ? `${h.name} zna ten czar.` : `${h.name} jeszcze go nie zna.`) : 'Bohater pozna go, wchodząc do miasta.', tx, ty + 146, { size: 12, italic: true, weight: 600, color: h && knows(h, this.sel) ? '#8ad080' : '#e0b070' });
      } else {
        const all = []; for (let k = 1; k <= Lv; k++) all.push(...((t.guild || {})[k] || [])); const kn = h ? all.filter(id => knows(h, id)).length : 0;
        text(ctx, `Poziom gildii: ${Lv} z ${GUILD_MAX}`, tx, ty, { size: 16, color: '#f3e2b0', fam: 'title' });
        const lines = [h ? `${h.name} zna ${kn} z ${all.length} czarów gildii i ma pełną manę.` : 'W mieście nie ma bohatera. Bohater, który tu wejdzie, pozna wszystkie czary gildii i odnowi manę.',
          next ? `Następny poziom: ${bInfo(next, t.faction).name}${reqMet(t, next) ? '' : ` (wymaga: ${next.req.filter(r => !hasB(t, r)).map(r => bInfo(BUILD_BY_ID[r], t.faction).name).join(', ')})`}.` : 'Gildia jest w pełni rozbudowana.',
          'Kliknij zwój, aby zobaczyć opis czaru.'];
        ctx.font = font(13, 500, 'body'); let yy = ty + 24; for (const para of lines) for (const l of wrapText(ctx, para, tw)) { text(ctx, l, tx, yy, { size: 13, weight: 500, color: para.startsWith('Kliknij') ? '#c8b88a' : '#ecd9a8' }); yy += 17; }
      }
      this.buttons.forEach(b => b.draw(ctx));
    },
  };
  G.modal = M;
}
