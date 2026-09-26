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
  showGuild() {
    const t = this.town(), L = guildLevel(t), F = factionOf(t.faction);
    const lines = []; for (let k = 1; k <= L; k++) lines.push(`poziom ${k}: ${((t.guild || {})[k] || []).map(id => SPELLS[id].name).join(', ')}`);
    showDialog(`${F.guild}${L > 1 ? ` ${['', '', 'II', 'III', 'IV', 'V'][L]}` : ''}. Czary: ${lines.join('; ')}. Bohater, który tu wejdzie, pozna je wszystkie i odnowi manę.`, [{ label: 'OK', key: 'enter' }]);
  },
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
    if (B && /^guild/.test(B.id) && !(next && reqMet(t, next))) return this.showGuild();
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
    const i = this.slotAt(x, y); if (i === null) return resourceBarInfo(G.state, x, y);
    const B = slotBuilding(t, i); if (B) { const inf = bInfo(B, fac), dw = /^dw(\d)u?$/.exec(B.id); return `${inf.name}. ${inf.desc}` + (dw ? ` Dostępne: ${t.avail[+dw[1]] || 0}. Kliknij, aby werbować.` : B.id === 'tavern' ? ` Kliknij, aby nająć bohatera (${HERO_COST} złota).` : B.id === 'smith' ? ' Kliknij, aby kupić machiny wojenne.' : B.id === 'market' ? ' Kliknij, aby handlować.' : ''); }
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

