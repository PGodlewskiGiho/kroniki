// ==================== EKRAN: BOHATER ====================================================
// Cechy, doświadczenie, armia i ekwipunek. Parametry: { heroId, back: { name, params } } – dokąd wrócić.
function iconStat(ctx, id, cx, cy, col) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
  if (id === 'att') { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, 9); ctx.lineTo(9, -9); ctx.moveTo(9, 9); ctx.lineTo(-9, -9); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, 3); ctx.lineTo(-3, 9); ctx.moveTo(9, 3); ctx.lineTo(3, 9); ctx.stroke(); }
  else if (id === 'def') { ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, -9); ctx.lineTo(9, 0); ctx.lineTo(0, 10); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill(); }
  else if (id === 'sp') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.5 : 10; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  else { ctx.fillRect(-9, -8, 8, 16); ctx.fillRect(1, -8, 8, 16); ctx.fillStyle = 'rgba(255,248,220,.8)'; ctx.fillRect(-7, -5, 4, 1.5); ctx.fillRect(3, -5, 4, 1.5); ctx.fillRect(-7, -1, 4, 1.5); ctx.fillRect(3, -1, 4, 1.5); }
  ctx.restore();
}
const RELIC_BTN = { x: 668, y: 60, w: 108, h: 22 }; // przycisk „Złóż relikwię” (gdy komplet części jest założony)
const BAG_VIEW = 6, SLOT_BOX = 50, SPEC_BOX = { x: 322, y: 30, w: 66, h: 76 };
// Mały znak specjalności (stwór, surowiec, czar, umiejętność) z grafik 3D; środek (cx, cy), bok s
// Ścieżka mistrzowska na ekranie bohatera: wybrana (ikona w złotym kręgu i nazwa: ścieżka albo legenda) albo trzy do wyboru (blade, od 10. poziomu)
function drawPathRow(ctx, h, x, y) {
  text(ctx, 'Ścieżka:', x, y, { size: 15, weight: 500, color: '#2a1606' });
  if (h.mastery) { const P = HERO_PATHS[h.mastery], cx = x + 80; ctx.fillStyle = 'rgba(200,150,40,.4)'; ctx.beginPath(); ctx.arc(cx, y, 13, 0, TAU); ctx.fill(); skillIcon(ctx, P.icon, cx, y, 24);
    text(ctx, pathTitle(h), cx + 16, y, { size: 14, weight: 700, color: pathLv(h, h.mastery) === 2 ? '#8a3a10' : '#2a1606' }); return [{ x: cx - 12, y: y - 12, w: 120, h: 24, id: h.mastery }]; }
  return pathOffer(h).map((id, k) => { const cx = x + 80 + k * 26; ctx.save(); ctx.globalAlpha = 0.45; skillIcon(ctx, HERO_PATHS[id].icon, cx, y, 22); ctx.restore(); return { x: cx - 12, y: y - 12, w: 24, h: 24, id }; });
}
const pathTip = (h, id) => (h.mastery ? `Ścieżka mistrzowska — ${pathText(id, pathLv(h, id))}.${pathLv(h, id) < 2 ? ` Na ${PATH_LEVELS[1]}. poziomie legenda: ${pathText(id, 2)}.` : ''}`
  : `Na ${PATH_LEVELS[0]}. poziomie ${h.name} wybierze jedną z trzech ścieżek mistrzowskich. ${pathText(id, 1)}; legenda (${PATH_LEVELS[1]}. poziom): ${pathText(id, 2)}.`);
function drawSpecIcon(ctx, h, cx, cy, s) {
  const sp = heroSpec(h); if (!sp) return;
  if (sp.dw) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, s / 2, 0, TAU); ctx.fillStyle = '#1a120a'; ctx.fill(); ctx.clip(); { const bs = battleSprite(specUnits(h)[0], 1, 'idle', 0), k = clamp(s * 0.9 / (bs.c.height * bs.u), 0.2, 1); drawSprite(ctx, bs, cx, cy + s * 0.45, k); } ctx.restore(); if (!PIXEL_ART) drawUiPiece(ctx, 'ring', cx - s * 0.56, cy - s * 0.56, s * 1.12, s * 1.12); }
  else if (sp.res) resIcon(ctx, sp.res, cx, cy, s);
  else if (sp.spell) drawSprite(ctx, spellSprite(sp.spell), cx, cy, s / 32);
  else if (sp.skill) skillIcon(ctx, sp.skill, cx, cy, s);
}
// Specjalność bohatera: ramka z obrazkiem (stwór, surowiec, czar albo księga umiejętności) i podpisem
function drawSpecBox(ctx, h) {
  const r = SPEC_BOX, sp = heroSpec(h), cx = r.x + r.w / 2, hot = !G.modal && inRect(G.mouse.x, G.mouse.y, r);
  if (PIXEL_ART) { ctx.fillStyle = 'rgba(90,55,20,.14)'; rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill(); ctx.strokeStyle = hot ? '#b8862a' : 'rgba(90,55,20,.5)'; ctx.lineWidth = hot ? 1.8 : 1; ctx.stroke(); }
  else { ctx.fillStyle = 'rgba(90,55,20,.14)'; rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill(); slotBox(ctx, r.x + 6, r.y + 15, r.w - 12, 46, hot ? 'hover' : ''); }
  text(ctx, 'Specjalność', cx, r.y + 9, { size: 10, weight: 700, align: 'center', color: '#6a4418' });
  if (sp.dw) { ctx.save(); rr(ctx, r.x + 7, r.y + 16, r.w - 14, 44, 3); ctx.clip(); if (!drawUnitPortrait(ctx, specUnits(h)[0], r.x + 7, r.y + 16, r.w - 14, 44)) drawCreatureIcon(ctx, specUnits(h)[0], cx, r.y + 58, PIXEL_ART ? 1.2 : 1.45); ctx.restore(); }
  else if (sp.res) resIcon(ctx, sp.res, cx, r.y + 38, PIXEL_ART ? 30 : 36);
  else if (sp.spell) drawSprite(ctx, spellSprite(sp.spell), cx, r.y + 38, PIXEL_ART ? 1.8 : 1.3);
  else if (!PIXEL_ART && sp.skill) skillIcon(ctx, sp.skill, cx, r.y + 38, 42); // umiejętność: ikona 3D
  else { ctx.save(); ctx.translate(cx, r.y + 38); ctx.fillStyle = '#6a2a2a'; ctx.fillRect(-12, -14, 24, 28); ctx.fillStyle = '#f0e0b0'; ctx.fillRect(-9, -11, 18, 22); ctx.restore(); iconStat(ctx, 'sp', cx, r.y + 38, '#b8862a'); }
  const nm = specName(h); text(ctx, nm, cx, r.y + 68, { size: nm.length > 11 ? 9 : 11, weight: 700, align: 'center', color: '#3a1e08' });
}
G.screens.hero = {
  buttons: [], sel: null, bagPage: 0, armyRects: [], back: null, paintedBack: 'zbrojownia', // tło: malowana zbrojownia
  hero() { return this.preview || G.state.heroes[this.heroId] || hero(G.state); },
  // p.preview: kandydat z tawerny (podgląd przed najęciem; p.hire = { townId, k }) — bez zmian w armii i ekwipunku
  enter(p) {
    this.heroId = p.heroId != null ? p.heroId : G.state.heroes.indexOf(hero(G.state)); this.back = p.back || { name: 'adventure', params: {} };
    this.preview = p.preview || null; this.hire = p.hire || null;
    this.sel = null; this.bagPage = 0; this.armyRects = []; this.msg = null;
    this.bPrev = new Button(432, 446, 44, 28, 'Poprzednie', () => { this.bagPage--; }, { icon: iconArrowSide(-1), tip: 'Poprzednie artefakty w plecaku.' });
    this.bNext = new Button(728, 446, 44, 28, 'Następne', () => { this.bagPage++; }, { icon: iconArrowSide(1), tip: 'Następne artefakty w plecaku.' });
    this.buttons = [new Button(32, 500, 170, 44, 'Wróć', () => this.onBack(), { key: 'escape', size: 18, tip: 'Powrót (klawisz Esc).' }), this.bPrev, this.bNext,
      new Button(216, 500, 172, 44, 'Księga czarów', () => hasBook(this.hero()) ? showSpellbook(this.hero(), 'view', () => {}) : this.say(`Brak księgi czarów: kupisz ją w gildii magów (${SPELLBOOK_COST} złota).`), { key: 'c', size: 16, tip: 'Czary znane bohaterowi (klawisz C). Wojownicy muszą najpierw kupić księgę w gildii magów.' })];
    if (this.preview) this.buttons.splice(3, 1, this.bHire = new Button(216, 500, 172, 44, 'Najmij', () => {
      const st = G.state, t = st.towns[this.hire.townId], r = hireHero(st, t, this.hire.k); if (r.error) return this.say(r.error);
      G.go('town', { townId: t.id, msg: `${r.hero.name} dołącza do twojej sprawy` });
    }, { key: 'enter', size: 17, sub: `${HERO_COST} złota`, tip: `Najmij bohatera za ${HERO_COST} złota; stanie w bramie miasta (klawisz Enter).` }));
  },
  onBack() { G.go(this.back.name, this.back.params); },
  say(m) { this.msg = m; this.msgT = G.time; },
  equipAt(x, y) { return EQUIP_SLOTS.find(s => x >= s.x && x <= s.x + SLOT_BOX && y >= s.y && y <= s.y + SLOT_BOX) || null; },
  bagAt(x, y) { for (let i = 0; i < BAG_VIEW; i++) { const bx = 432 + i * 58; if (x >= bx && x <= bx + SLOT_BOX && y >= 386 && y <= 386 + SLOT_BOX) return this.bagPage * BAG_VIEW + i; } return -1; },
  // Umiejętności: 8 pól (4 × 2) w prawym panelu pod premiami z artefaktów
  skillRect: i => ({ x: 424 + (i % 4) * 90, y: 484 + Math.floor(i / 4) * 56, w: 86, h: 52 }),
  skillAt(x, y) { for (let i = 0; i < MAX_SKILLS; i++) if (inRect(x, y, this.skillRect(i))) return i; return -1; },
  statAt(x, y) { if (y < 164 || y > 244) return null; const i = Math.floor((x - 32) / 90); return i >= 0 && i < 4 && x - 32 - i * 90 <= 84 ? PRIMARY[i] : null; },
  onClick(x, y) {
    if (clickButtons(this.buttons, x, y)) return;
    if (this.preview) return; // podgląd kandydata: tylko oglądanie
    const h = this.hero(), e = this.equipAt(x, y), bi = this.bagAt(x, y), ar = hitRect(this.armyRects, x, y);
    if (ar) {
      if (this.sel == null) { if (h.army[ar.i]) this.sel = ar.i; return; } // (sel 0 to pierwszy oddział – dawniej uznawany za brak zaznaczenia)
      const from = this.sel; this.sel = null;
      if (from === ar.i) return showDismiss(h.army, from, true, m => this.say(m)); // drugie kliknięcie w zaznaczony oddział: zwolnienie
      if (G.keys.has('shift')) { showSplit(h.army, from, h.army, ar.i, [], err => { if (err) this.say(err); }); return; } // Shift+klik: część oddziału na wolne miejsce
      armyMove(h.army, from, h.army, ar.i); return;
    }
    this.sel = null;
    const fixMp = () => { h.mp = Math.min(h.mp, heroMaxMP(h)); };
    if (inRect(x, y, RELIC_BTN) && assemblable(h).length) { this.offerRelic(h); return; }
    if (e && (h.locked || {})[e.id]) this.say(`To miejsce zajmuje relikwia: ${ARTIFACTS[h.locked[e.id]].name}.`);
    else if (e && h.equip[e.id] && ARTIFACTS[h.equip[e.id]].parts) { const r = h.equip[e.id]; // relikwia: rozłożyć albo zdjąć w całości
      showDialog(`${ARTIFACTS[r].name}. Co zrobić z relikwią?`, [
        { label: 'Rozłóż na części', key: 'r', action: () => { disassembleRelic(h, e.id); fixMp(); this.say(`Rozłożono: ${ARTIFACTS[r].name}`); } },
        { label: 'Zdejmij', key: 'z', action: () => { unequip(h, e.id); fixMp(); this.say(`Zdjęto: ${ARTIFACTS[r].name}`); } },
        { label: 'Anuluj', key: 'escape', action: () => {} }]); }
    else if (e && h.equip[e.id]) { unequip(h, e.id); fixMp(); this.say(`Zdjęto: ${ARTIFACTS[h.bag[h.bag.length - 1]].name}`); }
    else if (e) this.say(`Wolne miejsce: ${e.name.toLowerCase()}. Kliknij artefakt w plecaku, aby go założyć.`);
    else if (bi >= 0 && h.bag[bi]) { const id = h.bag[bi], err = equipFromBag(h, bi); fixMp(); this.say(err || `Założono: ${ARTIFACTS[id].name}`); if (!err) this.offerRelic(h); }
  },
  // Komplet części założony: propozycja złożenia relikwii
  offerRelic(h) {
    const r = assemblable(h)[0]; if (!r) return; const A = ARTIFACTS[r];
    showDialog(`Masz komplet części: ${A.name}! Złożona relikwia daje: ${artBonusText(A.bonus)}. Złożyć ją?`, [
      { label: 'Złóż relikwię', key: 'enter', action: () => { assembleRelic(h, r); h.mp = Math.min(h.mp, heroMaxMP(h)); this.say(`Złożono: ${A.name}`); } },
      { label: 'Nie teraz', key: 'escape', action: () => {} }], { iconH: 56, icon: (ctx, cx, cy) => drawSprite(ctx, artSprite(r, true), cx, cy, 3) });
  },
  rightCard(x, y) { // oddział albo artefakt (założony, zablokowany przez relikwię, w plecaku)
    const h = this.hero(), ar = hitRect(this.armyRects, x, y), e = this.equipAt(x, y), bi = this.bagAt(x, y);
    if (ar) return unitCard(h.army[ar.i], h); if (e) return artCard(h.equip[e.id] || (h.locked || {})[e.id], h); return bi >= 0 ? artCard(h.bag[bi], h) : null;
  },
  rightInfo(x, y) {
    const h = this.hero(), e = this.equipAt(x, y), bi = this.bagAt(x, y), ar = hitRect(this.armyRects, x, y), p = this.statAt(x, y);
    if (e && (h.locked || {})[e.id]) return `Miejsce zajęte przez relikwię: ${artInfo(h.locked[e.id])}`;
    if (e) return h.equip[e.id] ? `${artInfo(h.equip[e.id])} ${ARTIFACTS[h.equip[e.id]].parts ? 'Kliknij, aby rozłożyć albo zdjąć.' : 'Kliknij, aby zdjąć.'}` : `Wolne miejsce: ${e.name.toLowerCase()}.`;
    if (bi >= 0) return h.bag[bi] ? `${artInfo(h.bag[bi])} Kliknij, aby założyć.` : null;
    if (ar) return h.army[ar.i] ? stackInfo(h.army[ar.i]) : 'Wolne miejsce w armii.';
    if (h.machines.length && y >= 470 && y <= 490 && x >= 32 && x <= 388) return `Machiny wojenne (stają za armią i działają same): ${h.machines.map(id => stackInfo({ cid: id, n: 1 })).join(' ')} Kupisz je w kuźni.`;
    if (inRect(x, y, SPEC_BOX)) return heroSpec(h) ? `Specjalność: ${specText(h)}.` : null;
    if (x >= 32 && x <= 310 && y >= 32 && y <= 104) { const f = heroFaction(h); return f ? `${heroTitle(h)}. Cecha frakcji (${factionOf(f).name}) — ${traitText(f)}.` : null; }
    const tr = hitRect(this.talentRects || [], x, y); if (tr) return `Talent — ${talentText(tr.id)}.`;
    const pr = hitRect(this.pathRects || [], x, y); if (pr) return pathTip(h, pr.id);
    const si = this.skillAt(x, y);
    if (si >= 0) { const s = h.skills[si]; return s ? `${skillText(s.id, s.lv)}.` : 'Wolne miejsce na umiejętność. Nowe umiejętności bohater wybiera przy awansie.'; }
    if (p) return {
      att: 'Atak: dodaje się do ataku każdego twojego oddziału w bitwie (+5% obrażeń za punkt przewagi).',
      def: 'Obrona: dodaje się do obrony każdego twojego oddziału w bitwie (mniej otrzymywanych obrażeń).',
      sp: 'Moc czarów: zwiększa obrażenia, leczenie i czas działania czarów.',
      kn: 'Wiedza: każdy punkt to 10 punktów many.',
    }[p.id];
    return null;
  },
  draw(ctx) {
    const st = G.state, h = this.hero(), col = ownerColor(st, h.owner);
    const HB = paintedBackLayer('zbrojownia', 0.55); if (HB) viewportDraw(ctx, c => drawLayer(c, HB, 0, 0)); else stoneFill(ctx, 0, 0, W, H);
    drawParchment(ctx, 12, 12, 396, PIXEL_ART ? 548 : 576);
    if (PIXEL_ART) { ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, 416, 12, 372, 548, 4); ctx.fill(); ctx.strokeStyle = '#8a6d32'; ctx.lineWidth = 1.2; ctx.stroke(); } else drawStone(ctx, 416, 12, 372, 584);
    // nagłówek i doświadczenie
    drawHeroPortrait(ctx, 32, 32, h, col, 2);
    text(ctx, h.name, 120, 50, { size: 25, color: '#3a1e08', fam: 'title' });
    text(ctx, heroTitle(h).split(', ')[1].replace(/^./, s => s.toUpperCase()), 120, 76, { size: 16, weight: 500, color: '#5a3814' });
    text(ctx, `Poziom ${h.level}`, 120, 98, { size: 16, color: '#3a1e08', fam: 'title' });
    if (heroSpec(h)) drawSpecBox(ctx, h);
    const e0 = expForLevel(h.level), e1 = expForLevel(h.level + 1), f = clamp((h.exp - e0) / (e1 - e0), 0, 1);
    ctx.fillStyle = 'rgba(90,55,20,.25)'; ctx.fillRect(32, 118, 356, 12); ctx.fillStyle = '#c8962a'; ctx.fillRect(32, 118, 356 * f, 12);
    ctx.strokeStyle = 'rgba(90,55,20,.6)'; ctx.lineWidth = 1; ctx.strokeRect(32.5, 118.5, 355, 11);
    text(ctx, `Doświadczenie: ${h.exp} / ${e1}`, 210, 142, { size: 13, weight: 500, align: 'center', color: '#5a3814' });
    // cechy
    PRIMARY.forEach((p, i) => {
      const bx = 32 + i * 90, b = heroBonus(h, p.id) + pathStat(h, p.id);
      ctx.fillStyle = 'rgba(90,55,20,.12)'; rr(ctx, bx, 164, 84, 80, 4); ctx.fill(); if (!PIXEL_ART) { ctx.strokeStyle = 'rgba(120,80,30,.35)'; ctx.lineWidth = 1; ctx.stroke(); }
      if (PIXEL_ART || !drawUiPiece(ctx, { att: 'ic_sword', def: 'ic_shield', sp: 'ic_orb', kn: 'ic_scroll' }[p.id], bx + 28, 168, 28, 28)) iconStat(ctx, p.id, bx + 42, 184, '#6a4418');
      text(ctx, p.name, bx + 42, 208, { size: 12, weight: 500, align: 'center', color: '#5a3814' });
      text(ctx, String(h.stats[p.id] + b), bx + 42, 230, { size: 20, align: 'center', color: '#2a1606', fam: 'title' });
      if (b) text(ctx, `+${b}`, bx + 78, 230, { size: 12, weight: 700, align: 'right', color: '#2a6a1e' });
    });
    divider(ctx, 32, 388, 262);
    const mpB = heroBonus(h, 'mp'), gold = heroBonus(h, 'gold'), sB = heroBonus(h, 'sight');
    [`Ruch: ${h.mp} z ${heroMaxMP(h)}${mpB ? ` (+${mpB} z artefaktów)` : ''}`,
     `Zasięg widzenia: ${heroSight(h)}${sB ? ` (+${sB})` : ''} · mana ${h.mana} / ${heroMaxMana(h)} · czary: ${(h.spells || []).length}`,
     `Siła armii: ${Math.round(armyPower(h.army) * heroFactor(h))} (premia bohatera +${Math.round((heroFactor(h) - 1) * 100)}%)`,
     `Morale: ${signed(armyMorale(armyStacks(h.army).map(s => s.cid), h, null))} · Szczęście: ${signed(heroLuck(h))}`,
     gold ? `Złoto z artefaktów: +${gold} dziennie` : null, (h.talents || []).length ? 'Talenty:' : null].filter(Boolean)
      .forEach((l, i, L) => { const y = L.length > 4 && (h.talents || []).length ? 276 + i * 19 : 286 + i * 22; text(ctx, l, 32, y, { size: 15, weight: 500, color: '#2a1606' });
        if (l === 'Talenty:') this.talentRects = (h.talents || []).map((id, k) => { const r = { x: 100 + k * 26, y: y - 12, w: 24, h: 24, id }; skillIcon(ctx, 't_' + id, r.x + 12, y, 24); return r; });
        if (l.startsWith('Morale')) this.pathRects = drawPathRow(ctx, h, 236, y); }); // ścieżka mistrzowska w wierszu morale (z prawej)
    if (!(h.talents || []).length) this.talentRects = [];
    text(ctx, 'Armia', 32, 392, { size: 16, color: '#3a1e08', fam: 'title' });
    this.armyRects = drawArmyRow(ctx, h.army, 32, 404, { light: true, w: 46, gap: 5, h: 58, sel: this.sel == null ? -1 : this.sel });
    if (h.machines.length) text(ctx, `Machiny wojenne: ${h.machines.map(id => CREATURES[id].name.toLowerCase()).join(', ')}`, 210, 480, { size: 13, weight: 700, align: 'center', color: '#5a3814' });
    else text(ctx, this.preview ? `Kandydat z tawerny: podgląd przed najęciem (${HERO_COST} złota).` : 'Kliknij oddział, a potem miejsce, aby go przestawić lub połączyć.', 210, 480, { size: 12, italic: true, weight: 500, align: 'center', color: '#7a5a34' });
    // ekwipunek
    text(ctx, 'Ekwipunek', 602, 38, { size: 20, align: 'center', color: PIXEL_ART ? '#f0e4c0' : UI.goldHi, fam: 'title' }); if (!PIXEL_ART) divider(ctx, 470, 734, 56);
    const MA = screenArt('manekin');
    if (MA) drawLayer(ctx, Layers.get('heroMannequin', 206, 308, c => { // malowany stojak ze zbroją: hełm pod gniazdem głowy, napierśnik pod tułowiem; brzegi gasną w panelu
      c.drawImage(MA[0], 0, 0, 206, 308); c.fillStyle = 'rgba(10,7,4,.35)'; c.fillRect(0, 0, 206, 308);
      c.globalCompositeOperation = 'destination-in'; const g = c.createRadialGradient(103, 140, 40, 103, 150, 170); g.addColorStop(0, '#000'); g.addColorStop(0.7, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, 206, 308);
    }), 496, 52);
    else { const a = 'rgba(214,174,88,.09)'; circ(ctx, 599, 89, 26, a); ctx.fillStyle = a; rr(ctx, 560, 118, 78, 170, 20); ctx.fill(); ctx.fillRect(566, 280, 26, 70); ctx.fillRect(606, 280, 26, 70); } // sylwetka bohatera pod gniazdami
    const hot = !G.modal ? this.equipAt(G.mouse.x, G.mouse.y) : null;
    for (const s of EQUIP_SLOTS) {
      const id = h.equip[s.id];
      slotBox(ctx, s.x, s.y, SLOT_BOX, SLOT_BOX, hot === s ? 'hover' : '');
      const lk = (h.locked || {})[s.id];
      if (id) drawSprite(ctx, artSprite(id, true), s.x + SLOT_BOX / 2, s.y + SLOT_BOX / 2, 1.5);
      else if (lk) { ctx.globalAlpha = 0.35; drawSprite(ctx, artSprite(lk, true), s.x + SLOT_BOX / 2, s.y + SLOT_BOX / 2, 1.5); ctx.globalAlpha = 1; // zajęte przez relikwię
        ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x + 5, s.y + 5); ctx.lineTo(s.x + SLOT_BOX - 5, s.y + SLOT_BOX - 5); ctx.moveTo(s.x + SLOT_BOX - 5, s.y + 5); ctx.lineTo(s.x + 5, s.y + SLOT_BOX - 5); ctx.stroke(); }
      else text(ctx, s.name, s.x + SLOT_BOX / 2, s.y + SLOT_BOX / 2, { size: 12, italic: true, weight: 500, align: 'center', color: 'rgba(214,190,140,.4)' });
    }
    text(ctx, `Plecak (${h.bag.length})`, 432, 372, { size: 15, color: PIXEL_ART ? '#f0e4c0' : UI.goldHi, fam: 'title' });
    const pages = Math.max(1, Math.ceil(h.bag.length / BAG_VIEW)); this.bagPage = clamp(this.bagPage, 0, pages - 1);
    for (let i = 0; i < BAG_VIEW; i++) {
      const bx = 432 + i * 58, id = h.bag[this.bagPage * BAG_VIEW + i];
      slotBox(ctx, bx, 386, SLOT_BOX, SLOT_BOX);
      if (id) drawSprite(ctx, artSprite(id, true), bx + SLOT_BOX / 2, 386 + SLOT_BOX / 2, 1.5);
    }
    this.bPrev.disabled = this.bagPage === 0; this.bNext.disabled = this.bagPage >= pages - 1;
    if (pages > 1) text(ctx, `${this.bagPage + 1} / ${pages}`, 602, 461, { size: 13, italic: true, weight: 500, align: 'center', color: '#c8b68a' });
    const all = {}; for (const id of Object.values(h.equip)) if (id) for (const [k, v] of Object.entries(ARTIFACTS[id].bonus)) all[k] = (all[k] || 0) + v;
    ctx.font = font(13, 500, 'body');
    wrapText(ctx, Object.keys(all).length ? `Premie z artefaktów: ${artBonusText(all)}.` : 'Brak założonych artefaktów. Znajdziesz je na mapie, zwykle pod strażą potworów.', 236).slice(0, 2)
      .forEach((l, i) => text(ctx, l, 602, 453 + i * 14, { size: 13, weight: 600, align: 'center', color: UI.txt2 })); // między strzałkami plecaka
    for (let i = 0; i < MAX_SKILLS; i++) {
      const r = this.skillRect(i), sk = h.skills[i], hot = !G.modal && inRect(G.mouse.x, G.mouse.y, r);
      slotBox(ctx, r.x, r.y, r.w, r.h, hot ? 'hover' : sk ? '' : 'off');
      if (!sk) continue;
      skillIcon(ctx, sk.id, r.x + r.w / 2, r.y + 19); // ikona 32 px, obok niej poziom (kreski od dołu)
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k < sk.lv ? '#ffd970' : 'rgba(240,228,192,.2)'; ctx.fillRect(r.x + r.w / 2 + 20, r.y + 27 - k * 8, 5, 6); }
      text(ctx, SKILLS[sk.id].name, r.x + r.w / 2, r.y + 44, { size: SKILLS[sk.id].name.length > 13 ? 12 : 13, weight: 700, align: 'center', color: UI.txt });
    }
    if (!this.preview && assemblable(h).length) { const r = RELIC_BTN, hot = inRect(G.mouse.x, G.mouse.y, r); ctx.fillStyle = hot ? 'rgba(200,150,40,.55)' : 'rgba(200,150,40,.35)'; rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill();
      ctx.strokeStyle = '#ffd970'; ctx.lineWidth = 1.2; ctx.stroke(); text(ctx, 'Złóż relikwię', r.x + r.w / 2, r.y + 15, { size: 12, weight: 700, align: 'center', color: '#fff4c8' }); }
    this.buttons.forEach(b => b.draw(ctx));
    if (this.msg && G.time - this.msgT < 2.5) text(ctx, this.msg, 300, 580, { size: 14, weight: 500, align: 'center', color: '#ffd970' });
  },
};

// --- efekty bitwy: cząsteczki, pociski, pioruny, kręgi, błyski, wstrząsy ---------------------------
// Wszystko w px logicznych ekranu; cząsteczki rysowane jako kwadraciki (pixel art), poświaty addytywnie.
const SPELL_FX = {
  magicArrow: { proj: 'orb', col: '#8ac0ff', burst: '#d8ecff', sig: 'spark' },
  lightningBolt: { strike: true, col: '#e0f0ff', burst: '#ffffff', flash: 0.45, shake: 5, sig: 'scorch' },
  fireball: { proj: 'fireball', col: '#ff8a2a', burst: '#ffd060', boom: true, flash: 0.25, shake: 8, sig: 'flames' },
  bless: { aura: 'fall', col: '#ffe08a', sig: 'beam' }, stoneSkin: { aura: 'orbit', col: '#c8b898', sig: 'stone' }, haste: { aura: 'wind', col: '#a8f0ff', sig: 'speed' },
  cure: { aura: 'rise', col: '#8af07a', sig: 'spiral' }, slow: { aura: 'fall', col: '#9a7ad8', sig: 'sink' }, weakness: { aura: 'drip', col: '#9aa060', sig: 'smoke' },
  bloodlust: { aura: 'rise', col: '#ff5a4a', sig: 'rage' }, animateDead: { aura: 'rise', col: '#a6f0a8', column: true, sig: 'souls' },
  meteorShower: { meteor: true, col: '#ff6a3a', burst: '#ffd060', boom: true, flash: 0.3, shake: 10, sig: 'flames' },
  prayer: { aura: 'fall', col: '#fff0b0', column: true, sig: 'beam' }, resurrection: { aura: 'rise', col: '#fff8d0', column: true, sig: 'souls' },
  implosion: { aura: 'orbit', col: '#c05aff', burst: '#f0c0ff', flash: 0.35, shake: 7, sig: 'implode' },
  armageddon: { aura: 'fall', col: '#ff4a1a', burst: '#ffd060', flash: 0.6, shake: 12, sig: 'firerain' }, massHaste: { aura: 'wind', col: '#a8f0ff', sig: 'speed' },
  shield: { aura: 'orbit', col: '#e0c070', sig: 'dome' }, fortune: { aura: 'rise', col: '#8af0c0', sig: 'spiral' }, curse: { aura: 'drip', col: '#b04a8a', sig: 'smoke' },
  airShield: { aura: 'wind', col: '#d0f0ff', sig: 'dome' }, fireShield: { aura: 'rise', col: '#ff9a3a', column: true, sig: 'firedome' },
  iceBolt: { proj: 'orb', col: '#9ad8ff', burst: '#ffffff', flash: 0.15, sig: 'ice' },
  blizzard: { aura: 'wind', col: '#e8f6ff', burst: '#ffffff', flash: 0.3, shake: 4, sig: 'ice' },
  dispel: { aura: 'rise', col: '#c8e8ff', sig: 'implode' }, blind: { aura: 'fall', col: '#f0e0a0', flash: 0.2, sig: 'beam' }, poison: { aura: 'drip', col: '#8ac83a', sig: 'bubbles' }, vampirism: { aura: 'rise', col: '#c83a4a', sig: 'smoke' },
  fireWall: { aura: 'rise', col: '#ff7a2a', burst: '#ffd060', boom: true, flash: 0.2, shake: 5, sig: 'flames' }, lifeSteal: { proj: 'orb', col: '#d84a6a', burst: '#ff9ab0', sig: 'implode' },
  teleport: { aura: 'orbit', col: '#9ab0ff', flash: 0.15, sig: 'spiral' }, holyLight: { aura: 'fall', col: '#fff4c0', burst: '#ffffff', flash: 0.4, column: true, sig: 'beam' }, clone: { aura: 'orbit', col: '#b8e0ff', sig: 'dome' },
  frostRing: { aura: 'fall', col: '#bfe8ff', burst: '#ffffff', flash: 0.3, shake: 4, sig: 'ice' },
  chainLightning: { strike: true, chain: true, col: '#e0ecff', burst: '#ffffff', flash: 0.5, shake: 7, sig: 'scorch' },
  tailwind: { aura: 'wind', col: '#c8f0ff', sig: 'speed' }, fear: { aura: 'drip', col: '#6a3a8a', flash: 0.15, sig: 'smoke' },
  massCure: { aura: 'rise', col: '#7ae8c8', column: true, sig: 'spiral' }, deathRipple: { aura: 'drip', col: '#8a9a6a', burst: '#c8d0a0', shake: 6, sig: 'smoke' },
};
const BattleFX = {
  reset() { this.parts = []; this.rings = []; this.bolts = []; this.projs = []; this.glows = []; this.beams = []; this.domes = []; this.flash = null; this.shake = 0; },
  // Słup światła z nieba (błogosławieństwo, modlitwa, święte światło) i półprzezroczysta kopuła tarczy wokół oddziału
  beam(x, y, col, dur = 0.9, w = 26) { (this.beams = this.beams || []).push({ x, y, col, dur, w, t: 0 }); },
  dome(x, y, col, dur = 1, r = 34) { (this.domes = this.domes || []).push({ x, y, col, dur, r, t: 0 }); },
  // Cząsteczki ściągane do środka (implozja, rozproszenie, wysysanie życia): startują na okręgu i zdążają do (x, y)
  implode(x, y, col, r = 70, n = 36, life = 0.45) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, rr = r * (0.7 + Math.random() * 0.5), v = rr / life;
    this.parts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * 0.6, vx: -Math.cos(a) * v, vy: -Math.sin(a) * v * 0.6, g: 0, life, max: life, col: Array.isArray(col) ? col[i % col.length] : col, size: 3, glow: true, drag: 0, streak: true }); } },
  // Spirala wokół oddziału: cząsteczki krążą i wznoszą się (leczenie, dusze) albo opadają (spowolnienie)
  spiral(x, y, col, up = true, n = 26, life = 1) { for (let i = 0; i < n; i++) { const a0 = i / n * TAU * 2, d = Math.random() * 0.25;
    this.parts.push({ x, y, vx: 0, vy: 0, g: 0, life: life + d, max: life + d, col: Array.isArray(col) ? col[i % col.length] : col, size: 3, glow: true, drag: 0, orb: { cx: x, cy: up ? y + 6 : y - 70, a: a0, w: up ? 7 : -6, r: 22 + Math.random() * 6, vy: (up ? -80 : 70) * (0.8 + Math.random() * 0.4), t: -i / n * 0.35 } }); } },
  // Kłęby dymu (klątwy, trucizny, czarna magia): ciemne, rosnące, rysowane bez dodawania światła
  smoke(x, y, col, n = 12) { for (let i = 0; i < n; i++) { const life = 0.8 + Math.random() * 0.6;
    this.parts.push({ x: x + (Math.random() - 0.5) * 40, y: y - Math.random() * 30, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 30, g: 0, life, max: life, col, size: 6, grow: 10 + Math.random() * 8, smoke: true, drag: 0.8 }); } },
  // Odłamki (lód, kamień): wydłużone w kierunku lotu, spadają
  shards(x, y, cols, n = 18, spd = 160) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = spd * (0.5 + Math.random() * 0.7), life = 0.5 + Math.random() * 0.35;
    this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 420, life, max: life, col: cols[i % cols.length], size: 3, glow: false, drag: 0.6, streak: true }); } },
  // Bańki (trucizna, bagno): rosną, wznoszą się i pękają
  bubbles(x, y, col, n = 14) { for (let i = 0; i < n; i++) { const life = 0.6 + Math.random() * 0.6;
    this.parts.push({ x: x + (Math.random() - 0.5) * 44, y: y - Math.random() * 20, vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 40, g: 0, life, max: life, col, size: 2, grow: 4 + Math.random() * 4, bubble: true, drag: 0.5 }); } },
  glow(x, y, r, col, dur = 0.5) { this.glows.push({ x, y, r, col, dur, t: 0 }); },
  emit(x, y, o) {
    for (let i = 0; i < (o.n || 8); i++) {
      const a = o.dir != null ? o.dir + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * TAU, v = (o.spd || 80) * (0.4 + Math.random() * 0.8);
      const life = (o.life || 0.6) * (0.6 + Math.random() * 0.6);
      this.parts.push({ x: x + (Math.random() - 0.5) * (o.jx || 0), y: y + (Math.random() - 0.5) * (o.jy || 0), vx: Math.cos(a) * v, vy: Math.sin(a) * v + (o.up || 0),
        g: o.g || 0, life, max: life, col: Array.isArray(o.col) ? o.col[i % o.col.length] : o.col, size: o.size || 3, glow: !!o.glow, drag: o.drag || 0 });
    }
  },
  // Strumień ognia (zionięcie): kłęby lecą od paszczy do celu, rosną i stygną od białożółtego przez barwę ognia do dymu
  flame(x0, y0, x1, y1, col) {
    const a = Math.atan2(y1 - y0, x1 - x0), dist = Math.hypot(x1 - x0, y1 - y0);
    for (let i = 0; i < 4; i++) {
      const aa = a + (Math.random() - 0.5) * 0.22, v = dist / 0.32 * (0.75 + Math.random() * 0.45), life = 0.3 + Math.random() * 0.16;
      this.parts.push({ x: x0 + (Math.random() - 0.5) * 4, y: y0 + (Math.random() - 0.5) * 4, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, g: -60, life, max: life, col, size: 3, grow: 13 + Math.random() * 7, fire: true, glow: true, drag: 2.2 });
    }
  },
  ring(x, y, col, r1 = 40, dur = 0.5, w = 3) { this.rings.push({ x, y, col, r1, dur, w, t: 0 }); },
  bolt(x0, y0, x1, y1, col) {
    const pts = [[x0, y0]]; const n = 9;
    for (let i = 1; i < n; i++) { const f = i / n; pts.push([x0 + (x1 - x0) * f + (Math.random() - 0.5) * 26, y0 + (y1 - y0) * f + (Math.random() - 0.5) * 8]); }
    pts.push([x1, y1]); this.bolts.push({ pts, col, t: 0, dur: 0.35 });
  },
  proj(kind, x0, y0, x1, y1, dur, col, arc = 0) { const p = { kind, x0, y0, x1, y1, dur, col, arc, t: 0 }; this.projs.push(p); return p; },
  update(dt) {
    for (const p of this.parts) { p.life -= dt;
      if (p.orb) { const o = p.orb; o.t += dt; if (o.t < 0) { p.life += dt; continue; } o.a += o.w * dt; p.x = o.cx + Math.cos(o.a) * o.r; p.y = o.cy + o.vy * o.t + Math.sin(o.a) * o.r * 0.35; p.back = Math.sin(o.a) < 0; continue; }
      p.vx *= 1 - p.drag * dt; p.vy = p.vy * (1 - p.drag * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const b of this.beams || []) b.t += dt; this.beams = (this.beams || []).filter(b => b.t < b.dur);
    for (const d of this.domes || []) d.t += dt; this.domes = (this.domes || []).filter(d => d.t < d.dur);
    for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < r.dur);
    for (const g of this.glows) g.t += dt; this.glows = this.glows.filter(g => g.t < g.dur);
    for (const b of this.bolts) b.t += dt; this.bolts = this.bolts.filter(b => b.t < b.dur);
    for (const p of this.projs) {
      p.t += dt; const [x, y] = projPos(p);
      if (p.kind === 'orb') this.emit(x, y, { n: 2, col: [p.col, '#ffffff'], spd: 12, life: 0.35, size: 3, glow: true });
      if (p.kind === 'fireball') this.emit(x, y, { n: 4, col: ['#ff8a2a', '#ffd060', '#6a5a50'], spd: 20, up: -20, life: 0.5, size: 4, glow: true });
    }
    this.projs = this.projs.filter(p => p.t < p.dur);
    if (this.flash) { this.flash.a -= dt * 2.2; if (this.flash.a <= 0) this.flash = null; }
    this.shake = Math.max(0, this.shake - dt * 30);
  },
  // Efekty jako pixel art: zwykłe (kręgi, kamienie, strzały, iskry) i świetlne (poświaty, pioruny, pociski magii) nakładane addytywnie
  draw(ctx) {
    if (!(this.glows.length + this.rings.length + this.projs.length + this.bolts.length + this.parts.length + (this.beams || []).length + (this.domes || []).length)) return;
    pixLayer('fxN', ctx, 0, 0, W, H, g => this.drawLayer(g, false));
    pixLayer('fxA', ctx, 0, 0, W, H, g => this.drawLayer(g, true), { add: true });
  },
  drawLayer(ctx, add) {
    if (add) for (const g of this.glows) {
      const f = g.t / g.dur, r = g.r * (0.6 + 0.4 * ease(Math.min(1, f * 3))); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - f;
      for (const [k, col, al] of [[1, g.col, 0.3], [0.62, g.col, 0.75], [0.3, LT(g.col, 0.5), 1], [0.14, '#ffffff', 1]]) { ctx.globalAlpha = (1 - f) * al; circ(ctx, g.x, g.y, r * k, col); } // pierścienie jak w pixel arcie
      ctx.restore();
    }
    if (add) for (const b of this.beams || []) { // słup światła: od góry pola do oddziału, rozbłysk i wygaszanie, migotanie
      const f = b.t / b.dur, a = (f < 0.2 ? f / 0.2 : 1 - (f - 0.2) / 0.8) * (0.85 + Math.random() * 0.15), w = b.w * (0.6 + 0.4 * Math.min(1, f * 4)); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createLinearGradient(b.x - w, 0, b.x + w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, b.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = a * 0.55; ctx.fillStyle = gr; ctx.fillRect(b.x - w, 38, w * 2, b.y - 38 + 8); ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - w * 0.12, 38, w * 0.24, b.y - 38);
      ctx.globalAlpha = a * 0.7; ctx.beginPath(); ctx.ellipse(b.x, b.y + 6, w * 1.4, w * 0.45, 0, 0, TAU); ctx.fillStyle = b.col; ctx.fill(); ctx.restore(); }
    if (add) for (const d of this.domes || []) { // kopuła tarczy: obrys półkuli z poziomymi pasami, pulsuje i gaśnie
      const f = d.t / d.dur, a = (f < 0.15 ? f / 0.15 : 1 - (f - 0.15) / 0.85), r = d.r * (0.85 + 0.15 * ease(Math.min(1, f * 3))); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = d.col;
      ctx.globalAlpha = a * 0.25; ctx.fillStyle = d.col; ctx.beginPath(); ctx.ellipse(d.x, d.y, r, r * 1.05, 0, Math.PI, TAU); ctx.ellipse(d.x, d.y, r, r * 0.38, 0, 0, Math.PI); ctx.fill();
      ctx.globalAlpha = a * 0.9; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(d.x, d.y, r, r * 1.05, 0, Math.PI, TAU); ctx.stroke();
      ctx.lineWidth = 1; ctx.globalAlpha = a * 0.5; for (const k of [0.35, 0.7]) { ctx.beginPath(); ctx.ellipse(d.x, d.y - r * 1.05 * k, r * Math.sqrt(1 - k * k), r * 0.3 * Math.sqrt(1 - k * k), 0, 0, TAU); ctx.stroke(); }
      for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(d.x, d.y, r * Math.abs(Math.cos(k + f * 3)), r * 1.05, 0, Math.PI, TAU); ctx.stroke(); } ctx.restore(); }
    if (!add) for (const r of this.rings) { const f = r.t / r.dur; ctx.save(); ctx.globalAlpha = 1 - f; ctx.strokeStyle = r.col; ctx.lineWidth = r.w * (1 - f) + 1; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r1 * ease(f), r.r1 * ease(f) * 0.45, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    for (const p of this.projs) {
      if ((p.kind === 'rock' || p.kind === 'arrow') === add) continue;
      const [x, y] = projPos(p), [nx, ny] = projPos({ ...p, t: Math.min(p.dur, p.t + 0.02) }), ang = Math.atan2(ny - y, nx - x);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      if (p.kind === 'rock') { circ(ctx, 0, 0, 6, '#6e6a62'); circ(ctx, -1.5, -1.5, 3.5, '#9a948a'); }
      else if (p.kind === 'arrow') { // smuga za strzałą, cienkie drzewce, grot i lotki
        const g = ctx.createLinearGradient(-46, 0, -12, 0); g.addColorStop(0, 'rgba(255,250,230,0)'); g.addColorStop(1, 'rgba(255,250,230,.45)'); ctx.fillStyle = g; ctx.fillRect(-46, -1, 34, 2);
        limb(ctx, -13, 0, 9, 0, 1.6, '#7a5230'); fillPoly(ctx, [[8, -2.6], [14, 0], [8, 2.6]], '#dfe3ea'); fillPoly(ctx, [[-8, 0], [-14, -3.4], [-11, 0], [-14, 3.4]], '#c83a2a'); }
      else { ctx.globalCompositeOperation = 'lighter'; const r = p.kind === 'fireball' ? 13 : 7, gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, p.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, TAU); ctx.fill(); fillPoly(ctx, [[0, -r * 0.6], [-r * 2.2, 0], [0, r * 0.6]], p.col); }
      ctx.restore();
    }
    if (add) for (const b of this.bolts) {
      const f = b.t / b.dur, flick = Math.random() < 0.8 ? 1 : 0.3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - f) * flick;
      for (const [w, col] of [[9, b.col], [3, '#ffffff']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.globalAlpha *= w > 5 ? 0.45 : 1; ctx.beginPath(); b.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalAlpha = (1 - f) * flick; }
      ctx.restore();
    }
    for (const p of this.parts) {
      if (p.fire) { drawFlamePuff(ctx, p, add); continue; }
      if (p.smoke) { if (add) continue; const age = 1 - clamp(p.life / p.max, 0, 1); ctx.save(); ctx.globalAlpha = Math.min(1, age * 5) * (1 - age * age) * 0.55; circ(ctx, Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, p.size + p.grow * Math.sqrt(age), p.col); ctx.restore(); continue; }
      if (p.bubble) { if (add) continue; const age = 1 - clamp(p.life / p.max, 0, 1), r = p.size + p.grow * age; ctx.save(); ctx.globalAlpha = 0.85 * (1 - age * 0.5); ctx.strokeStyle = p.col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); ctx.fillStyle = LT(p.col, 0.5); ctx.fillRect(p.x - r * 0.4, p.y - r * 0.5, 2, 2); ctx.restore(); continue; }
      if (p.streak) { if (p.glow !== add) continue; const a = clamp(p.life / p.max, 0, 1), L = Math.min(14, Math.hypot(p.vx, p.vy) * 0.045) + 2, ang = Math.atan2(p.vy, p.vx); ctx.save(); if (p.glow) ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.fillStyle = p.col; ctx.fillRect(-L, -1, L, 2.4); ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -1, 2, 2.4); ctx.restore(); continue; }
      if (p.glow !== add) continue; const a = clamp(p.life / p.max, 0, 1), s = Math.max(1, Math.round(p.size * (p.glow ? 0.6 + a * 0.6 : 1)));
      ctx.save(); if (p.glow) ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x / 2) * 2 - s / 2, Math.round(p.y / 2) * 2 - s / 2, s, s); ctx.restore();
    }
  },
  drawFlash(ctx) { if (this.flash) { ctx.save(); ctx.globalAlpha = clamp(this.flash.a, 0, 1) * 0.6; ctx.fillStyle = this.flash.col; ctx.fillRect(0, 38, W, 452); ctx.restore(); } },
};
// Kłąb ognia: rdzeń białożółty, potem barwa płomienia i jego ciemniejszy brzeg (światło addytywne); pod koniec życia dym
function drawFlamePuff(ctx, p, add) {
  const age = 1 - clamp(p.life / p.max, 0, 1), r = p.size + p.grow * Math.sqrt(age), x = Math.round(p.x / 2) * 2, y = Math.round(p.y / 2) * 2;
  ctx.save();
  if (add) {
    ctx.globalCompositeOperation = 'lighter'; const heat = 1 - age, col = p.col;
    ctx.globalAlpha = 0.5 * heat; circ(ctx, x, y, r, DK(col, 0.25));
    ctx.globalAlpha = 0.8 * heat; circ(ctx, x, y, r * 0.68, age < 0.5 ? LT(col, 0.25) : col);
    if (age < 0.45) { ctx.globalAlpha = 1 - age * 2; circ(ctx, x, y, r * 0.36, '#fff4c8'); }
  } else if (age > 0.55) { ctx.globalAlpha = (age - 0.55) * 0.9; circ(ctx, x, y - (age - 0.55) * 20, r * 0.8, '#2e2622'); } // dym nad końcem strumienia
  ctx.restore();
}
function projPos(p) { const f = clamp(p.t / p.dur, 0, 1); return [lerp(p.x0, p.x1, f), lerp(p.y0, p.y1, f) - (p.kind === 'arrow' ? 4 * f * (1 - f) : Math.sin(f * Math.PI)) * p.arc]; } // strzała: parabola balistyczna
// Aura czaru wokół oddziału (cząsteczki zależne od rodzaju)
function spellAura(x, y, fx) {
  const c = fx.col, top = y - 70;
  if (fx.aura === 'fall') BattleFX.emit(x, top, { n: 26, col: [c, '#ffffff'], dir: Math.PI / 2, spread: 0.5, spd: 60, jx: 40, life: 0.9, size: 3, glow: true });
  else if (fx.aura === 'rise') BattleFX.emit(x, y, { n: 28, col: [c, LT(c, 0.3)], dir: -Math.PI / 2, spread: 0.4, spd: 70, jx: 36, life: 0.9, size: 3, glow: true, drag: 1 });
  else if (fx.aura === 'wind') { for (let i = 0; i < 3; i++) BattleFX.emit(x - 40, y - 15 - i * 14, { n: 8, col: c, dir: 0, spread: 0.1, spd: 180, life: 0.45, size: 2, glow: true }); }
  else if (fx.aura === 'orbit') BattleFX.emit(x, y - 25, { n: 24, col: [c, DK(c, 0.3)], spd: 70, life: 0.7, size: 4, drag: 3 });
  else if (fx.aura === 'drip') BattleFX.emit(x, y - 55, { n: 20, col: [c, DK(c, 0.35)], dir: Math.PI / 2, spread: 0.3, spd: 30, g: 180, jx: 30, life: 0.8, size: 3 });
  BattleFX.ring(x, y + 14, c, 34, 0.6, 3); BattleFX.glow(x, y - 18, fx.sig ? 26 : 46, c, fx.sig ? 0.35 : 0.7); // czar z własnym znakiem: poświata tylko w tle
  if (fx.column) BattleFX.emit(x, y, { n: 30, col: [c, '#ffffff'], dir: -Math.PI / 2, spread: 0.15, spd: 160, jx: 14, life: 0.7, size: 2, glow: true });
  if (fx.sig) spellSignature(x, y, fx);
}
// Znak rozpoznawczy czaru (na celu): słup światła, kopuła, dym, lód, ogień…
function spellSignature(x, y, fx) {
  const c = fx.col, F = BattleFX;
  switch (fx.sig) {
    case 'beam': F.beam(x, y + 10, c, 0.9, 24); F.emit(x, y, { n: 16, col: ['#ffffff', c], dir: -Math.PI / 2, spread: 1.6, spd: 60, life: 0.8, size: 2, glow: true, jx: 30 }); break;
    case 'dome': F.dome(x, y + 12, c, 1.1, 36); break;
    case 'firedome': F.dome(x, y + 12, c, 1.1, 38); for (let i = 0; i < 3; i++) F.flame(x - 24 + i * 24, y + 10, x - 24 + i * 24, y - 50, c); break;
    case 'stone': F.dome(x, y + 12, '#c8b898', 0.8, 32); F.shards(x, y - 10, ['#9a948a', '#6e6a62', '#c8c0b0'], 16, 120); break;
    case 'speed': for (let i = 0; i < 10; i++) F.parts.push({ x: x - 60 - Math.random() * 30, y: y - 50 + Math.random() * 56, vx: 380 + Math.random() * 160, vy: 0, g: 0, life: 0.28, max: 0.28, col: i % 2 ? c : '#ffffff', size: 2, glow: true, drag: 0, streak: true }); break;
    case 'sink': F.spiral(x, y, [c, DK(c, 0.3)], false, 22, 0.9); F.smoke(x, y + 6, '#3a2a5a', 3); break;
    case 'spiral': F.spiral(x, y, [c, '#ffffff'], true, 26, 1); break;
    case 'souls': F.spiral(x, y, [c, '#ffffff'], true, 18, 1.2); for (let i = 0; i < 4; i++) F.emit(x + (i - 1.5) * 12, y, { n: 6, col: [c, '#ffffff'], dir: -Math.PI / 2, spread: 0.2, spd: 90, life: 1.1, size: 4, glow: true }); break;
    case 'rage': F.ring(x, y + 10, '#ff3a2a', 46, 0.5, 5); F.smoke(x, y, '#5a1010', 6); F.emit(x, y - 20, { n: 20, col: ['#ff3a2a', '#ffb070'], spd: 120, life: 0.4, size: 3, glow: true }); break;
    case 'smoke': F.smoke(x, y, '#140c18', 16); F.emit(x, y - 30, { n: 10, col: [c, DK(c, 0.4)], dir: -Math.PI / 2, spread: 1, spd: 40, life: 1, size: 3, glow: true }); break;
    case 'bubbles': F.bubbles(x, y, c, 20); F.smoke(x, y, '#2a4014', 4); break;
    case 'implode': F.implode(x, y - 20, [c, '#ffffff'], 80, 40, 0.45); F.glow(x, y - 20, 30, '#ffffff', 0.6); break;
    case 'ice': F.shards(x, y - 20, ['#e8f6ff', '#9ad8ff', '#ffffff'], 22, 170); F.dome(x, y + 12, '#bfe8ff', 0.6, 30); break;
    case 'flames': for (let i = 0; i < 5; i++) { const a = Math.random() * TAU; F.flame(x, y - 10, x + Math.cos(a) * 60, y - 10 + Math.sin(a) * 30 - 30, i % 2 ? '#ff7a2a' : '#ffb040'); } F.smoke(x, y - 20, '#3a302a', 5); break;
    case 'firerain': for (let i = 0; i < 3; i++) { const sx = x + (Math.random() - 0.5) * 60; F.flame(sx - 40, y - 180, sx, y, '#ff6a2a'); } F.smoke(x, y, '#2a1a14', 5); break;
    case 'spark': F.shards(x, y - 16, ['#ffffff', c, '#d8ecff'], 12, 140); F.ring(x, y - 16, c, 26, 0.35, 2); break;
    case 'scorch': F.shards(x, y + 4, ['#ffffff', '#e0f0ff', '#ffe080'], 14, 200); F.smoke(x, y + 6, '#2a2a30', 5); break;
  }
}

