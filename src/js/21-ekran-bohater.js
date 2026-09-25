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
const BAG_VIEW = 6, SLOT_BOX = 50;
G.screens.hero = {
  buttons: [], sel: null, bagPage: 0, armyRects: [], back: null,
  hero() { return G.state.heroes[this.heroId] || hero(G.state); },
  enter(p) {
    this.heroId = p.heroId != null ? p.heroId : G.state.heroes.indexOf(hero(G.state)); this.back = p.back || { name: 'adventure', params: {} };
    this.sel = null; this.bagPage = 0; this.armyRects = []; this.msg = null;
    this.bPrev = new Button(432, 446, 44, 28, 'Poprzednie', () => { this.bagPage--; }, { icon: iconArrowSide(-1), tip: 'Poprzednie artefakty w plecaku.' });
    this.bNext = new Button(728, 446, 44, 28, 'Następne', () => { this.bagPage++; }, { icon: iconArrowSide(1), tip: 'Następne artefakty w plecaku.' });
    this.buttons = [new Button(32, 500, 170, 44, 'Wróć', () => this.onBack(), { key: 'escape', size: 18, tip: 'Powrót (klawisz Esc).' }), this.bPrev, this.bNext,
      new Button(216, 500, 172, 44, 'Księga czarów', () => showSpellbook(this.hero(), 'view', () => {}), { key: 'c', size: 16, tip: 'Czary znane bohaterowi (klawisz C).' })];
  },
  onBack() { G.go(this.back.name, this.back.params); },
  say(m) { this.msg = m; this.msgT = G.time; },
  equipAt(x, y) { return EQUIP_SLOTS.find(s => x >= s.x && x <= s.x + SLOT_BOX && y >= s.y && y <= s.y + SLOT_BOX) || null; },
  bagAt(x, y) { for (let i = 0; i < BAG_VIEW; i++) { const bx = 432 + i * 58; if (x >= bx && x <= bx + SLOT_BOX && y >= 386 && y <= 386 + SLOT_BOX) return this.bagPage * BAG_VIEW + i; } return -1; },
  // Umiejętności: 8 pól (4 × 2) w prawym panelu pod premiami z artefaktów
  skillRect: i => ({ x: 424 + (i % 4) * 90, y: 512 + Math.floor(i / 4) * 32, w: 86, h: 28 }),
  skillAt(x, y) { for (let i = 0; i < MAX_SKILLS; i++) if (inRect(x, y, this.skillRect(i))) return i; return -1; },
  statAt(x, y) { if (y < 164 || y > 244) return null; const i = Math.floor((x - 32) / 90); return i >= 0 && i < 4 && x - 32 - i * 90 <= 84 ? PRIMARY[i] : null; },
  onClick(x, y) {
    if (clickButtons(this.buttons, x, y)) return;
    const h = this.hero(), e = this.equipAt(x, y), bi = this.bagAt(x, y), ar = hitRect(this.armyRects, x, y);
    if (ar) {
      if (!this.sel) { if (h.army[ar.i]) this.sel = ar.i; return; }
      armyMove(h.army, this.sel, h.army, ar.i); this.sel = null; return;
    }
    this.sel = null;
    if (e && h.equip[e.id]) { unequip(h, e.id); h.mp = Math.min(h.mp, heroMaxMP(h)); this.say(`Zdjęto: ${ARTIFACTS[h.bag[h.bag.length - 1]].name}`); }
    else if (e) this.say(`Wolne miejsce: ${e.name.toLowerCase()}. Kliknij artefakt w plecaku, aby go założyć.`);
    else if (bi >= 0 && h.bag[bi]) { const id = h.bag[bi]; equipFromBag(h, bi); h.mp = Math.min(h.mp, heroMaxMP(h)); this.say(`Założono: ${ARTIFACTS[id].name}`); }
  },
  rightInfo(x, y) {
    const h = this.hero(), e = this.equipAt(x, y), bi = this.bagAt(x, y), ar = hitRect(this.armyRects, x, y), p = this.statAt(x, y);
    if (e) return h.equip[e.id] ? `${artInfo(h.equip[e.id])} Kliknij, aby zdjąć.` : `Wolne miejsce: ${e.name.toLowerCase()}.`;
    if (bi >= 0) return h.bag[bi] ? `${artInfo(h.bag[bi])} Kliknij, aby założyć.` : null;
    if (ar) return h.army[ar.i] ? stackInfo(h.army[ar.i]) : 'Wolne miejsce w armii.';
    if (h.machines.length && y >= 470 && y <= 490 && x >= 32 && x <= 388) return `Machiny wojenne (stają za armią i działają same): ${h.machines.map(id => stackInfo({ cid: id, n: 1 })).join(' ')} Kupisz je w kuźni.`;
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
    stoneFill(ctx, 0, 0, W, H); drawParchment(ctx, 12, 12, 396, 548);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, 416, 12, 372, 548, 4); ctx.fill(); ctx.strokeStyle = '#8a6d32'; ctx.lineWidth = 1.2; ctx.stroke();
    // nagłówek i doświadczenie
    drawHeroPortrait(ctx, 32, 32, h, col, 2);
    text(ctx, h.name, 120, 50, { size: 25, color: '#3a1e08', fam: 'title' });
    text(ctx, heroTitle(h).split(', ')[1].replace(/^./, s => s.toUpperCase()), 120, 76, { size: 16, weight: 500, color: '#5a3814' });
    text(ctx, `Poziom ${h.level}`, 120, 98, { size: 16, color: '#3a1e08', fam: 'title' });
    const e0 = expForLevel(h.level), e1 = expForLevel(h.level + 1), f = clamp((h.exp - e0) / (e1 - e0), 0, 1);
    ctx.fillStyle = 'rgba(90,55,20,.25)'; ctx.fillRect(32, 118, 356, 12); ctx.fillStyle = '#c8962a'; ctx.fillRect(32, 118, 356 * f, 12);
    ctx.strokeStyle = 'rgba(90,55,20,.6)'; ctx.lineWidth = 1; ctx.strokeRect(32.5, 118.5, 355, 11);
    text(ctx, `Doświadczenie: ${h.exp} / ${e1}`, 210, 142, { size: 13, weight: 500, align: 'center', color: '#5a3814' });
    // cechy
    PRIMARY.forEach((p, i) => {
      const bx = 32 + i * 90, b = heroBonus(h, p.id);
      ctx.fillStyle = 'rgba(90,55,20,.12)'; rr(ctx, bx, 164, 84, 80, 4); ctx.fill();
      iconStat(ctx, p.id, bx + 42, 184, '#6a4418');
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
     gold ? `Złoto z artefaktów: +${gold} dziennie` : null].filter(Boolean)
      .forEach((l, i) => text(ctx, l, 32, 286 + i * 22, { size: 15, weight: 500, color: '#2a1606' }));
    text(ctx, 'Armia', 32, 392, { size: 16, color: '#3a1e08', fam: 'title' });
    this.armyRects = drawArmyRow(ctx, h.army, 32, 404, { light: true, w: 46, gap: 5, h: 58, sel: this.sel == null ? -1 : this.sel });
    if (h.machines.length) text(ctx, `Machiny wojenne: ${h.machines.map(id => CREATURES[id].name.toLowerCase()).join(', ')}`, 210, 480, { size: 13, weight: 700, align: 'center', color: '#5a3814' });
    else text(ctx, 'Kliknij oddział, a potem miejsce, aby go przestawić lub połączyć.', 210, 480, { size: 12, italic: true, weight: 500, align: 'center', color: '#7a5a34' });
    // ekwipunek
    text(ctx, 'Ekwipunek', 602, 38, { size: 20, align: 'center', color: '#f0e4c0', fam: 'title' });
    ctx.fillStyle = 'rgba(240,228,192,.07)'; circ(ctx, 599, 89, 26, 'rgba(240,228,192,.07)'); rr(ctx, 560, 118, 78, 170, 20); ctx.fill(); ctx.fillRect(566, 280, 26, 70); ctx.fillRect(606, 280, 26, 70);
    const hot = !G.modal ? this.equipAt(G.mouse.x, G.mouse.y) : null;
    for (const s of EQUIP_SLOTS) {
      const id = h.equip[s.id];
      ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, s.x, s.y, SLOT_BOX, SLOT_BOX, 4); ctx.fill();
      ctx.strokeStyle = hot === s ? '#ffd970' : id ? '#b8913f' : '#5a4a32'; ctx.lineWidth = hot === s ? 2 : 1.2; ctx.stroke();
      if (id) drawSprite(ctx, artSprite(id), s.x + SLOT_BOX / 2, s.y + SLOT_BOX / 2, 1.5);
      else text(ctx, s.name, s.x + SLOT_BOX / 2, s.y + SLOT_BOX / 2, { size: 10, italic: true, weight: 500, align: 'center', color: 'rgba(240,228,192,.35)' });
    }
    text(ctx, `Plecak (${h.bag.length})`, 432, 372, { size: 15, color: '#f0e4c0', fam: 'title' });
    const pages = Math.max(1, Math.ceil(h.bag.length / BAG_VIEW)); this.bagPage = clamp(this.bagPage, 0, pages - 1);
    for (let i = 0; i < BAG_VIEW; i++) {
      const bx = 432 + i * 58, id = h.bag[this.bagPage * BAG_VIEW + i];
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, bx, 386, SLOT_BOX, SLOT_BOX, 4); ctx.fill(); ctx.strokeStyle = '#5a4a32'; ctx.lineWidth = 1; ctx.stroke();
      if (id) drawSprite(ctx, artSprite(id), bx + SLOT_BOX / 2, 386 + SLOT_BOX / 2, 1.5);
    }
    this.bPrev.disabled = this.bagPage === 0; this.bNext.disabled = this.bagPage >= pages - 1;
    if (pages > 1) text(ctx, `${this.bagPage + 1} / ${pages}`, 602, 461, { size: 13, italic: true, weight: 500, align: 'center', color: '#c8b68a' });
    const all = {}; for (const id of Object.values(h.equip)) if (id) for (const [k, v] of Object.entries(ARTIFACTS[id].bonus)) all[k] = (all[k] || 0) + v;
    ctx.font = font(13, 500, 'body');
    wrapText(ctx, Object.keys(all).length ? `Premie z artefaktów: ${artBonusText(all)}.` : 'Brak założonych artefaktów. Znajdziesz je na mapie, zwykle pod strażą potworów.', 350).slice(0, 2)
      .forEach((l, i) => text(ctx, l, 602, 482 + i * 16, { size: 12, weight: 500, align: 'center', color: '#c8b68a' }));
    for (let i = 0; i < MAX_SKILLS; i++) {
      const r = this.skillRect(i), sk = h.skills[i], hot = !G.modal && inRect(G.mouse.x, G.mouse.y, r);
      ctx.fillStyle = sk ? 'rgba(90,60,20,.45)' : 'rgba(0,0,0,.3)'; rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill();
      ctx.strokeStyle = hot ? '#ffd970' : sk ? '#b8913f' : '#4a3e2c'; ctx.lineWidth = hot ? 1.8 : 1; ctx.stroke();
      if (!sk) continue;
      text(ctx, SKILLS[sk.id].name, r.x + r.w / 2, r.y + 10, { size: SKILLS[sk.id].name.length > 13 ? 10 : 11, weight: 700, align: 'center', color: '#f0e4c0' });
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k < sk.lv ? '#ffd970' : 'rgba(240,228,192,.2)'; ctx.fillRect(r.x + r.w / 2 - 17 + k * 12, r.y + 19, 10, 4); }
    }
    this.buttons.forEach(b => b.draw(ctx));
    if (this.msg && G.time - this.msgT < 2.5) text(ctx, this.msg, 300, 580, { size: 14, weight: 500, align: 'center', color: '#ffd970' });
  },
};

// --- efekty bitwy: cząsteczki, pociski, pioruny, kręgi, błyski, wstrząsy ---------------------------
// Wszystko w px logicznych ekranu; cząsteczki rysowane jako kwadraciki (pixel art), poświaty addytywnie.
const SPELL_FX = {
  magicArrow: { proj: 'orb', col: '#8ac0ff', burst: '#d8ecff' },
  lightningBolt: { strike: true, col: '#e0f0ff', burst: '#ffffff', flash: 0.45, shake: 5 },
  fireball: { proj: 'fireball', col: '#ff8a2a', burst: '#ffd060', boom: true, flash: 0.25, shake: 8 },
  bless: { aura: 'fall', col: '#ffe08a' }, stoneSkin: { aura: 'orbit', col: '#c8b898' }, haste: { aura: 'wind', col: '#a8f0ff' },
  cure: { aura: 'rise', col: '#8af07a' }, slow: { aura: 'fall', col: '#9a7ad8' }, weakness: { aura: 'drip', col: '#9aa060' },
  bloodlust: { aura: 'rise', col: '#ff5a4a' }, animateDead: { aura: 'rise', col: '#a6f0a8', column: true },
};
const BattleFX = {
  reset() { this.parts = []; this.rings = []; this.bolts = []; this.projs = []; this.glows = []; this.flash = null; this.shake = 0; },
  glow(x, y, r, col, dur = 0.5) { this.glows.push({ x, y, r, col, dur, t: 0 }); },
  emit(x, y, o) {
    for (let i = 0; i < (o.n || 8); i++) {
      const a = o.dir != null ? o.dir + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * TAU, v = (o.spd || 80) * (0.4 + Math.random() * 0.8);
      const life = (o.life || 0.6) * (0.6 + Math.random() * 0.6);
      this.parts.push({ x: x + (Math.random() - 0.5) * (o.jx || 0), y: y + (Math.random() - 0.5) * (o.jy || 0), vx: Math.cos(a) * v, vy: Math.sin(a) * v + (o.up || 0),
        g: o.g || 0, life, max: life, col: Array.isArray(o.col) ? o.col[i % o.col.length] : o.col, size: o.size || 3, glow: !!o.glow, drag: o.drag || 0 });
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
    for (const p of this.parts) { p.vx *= 1 - p.drag * dt; p.vy = p.vy * (1 - p.drag * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.parts = this.parts.filter(p => p.life > 0);
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
  draw(ctx) {
    for (const g of this.glows) {
      const f = g.t / g.dur, r = g.r * (0.6 + 0.4 * ease(Math.min(1, f * 3))); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - f;
      const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, g.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, TAU); ctx.fill(); ctx.restore();
    }
    for (const r of this.rings) { const f = r.t / r.dur; ctx.save(); ctx.globalAlpha = 1 - f; ctx.strokeStyle = r.col; ctx.lineWidth = r.w * (1 - f) + 1; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r1 * ease(f), r.r1 * ease(f) * 0.45, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    for (const p of this.projs) {
      const [x, y] = projPos(p), [nx, ny] = projPos({ ...p, t: Math.min(p.dur, p.t + 0.02) }), ang = Math.atan2(ny - y, nx - x);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      if (p.kind === 'rock') { circ(ctx, 0, 0, 6, '#6e6a62'); circ(ctx, -1.5, -1.5, 3.5, '#9a948a'); }
      else if (p.kind === 'arrow') { limb(ctx, -9, 0, 7, 0, 2, '#6a4424'); fillPoly(ctx, [[7, -3], [12, 0], [7, 3]], '#d8dce4'); fillPoly(ctx, [[-9, 0], [-12, -3], [-7, 0], [-12, 3]], '#e8e0cc'); }
      else { ctx.globalCompositeOperation = 'lighter'; const r = p.kind === 'fireball' ? 13 : 7, gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, p.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, TAU); ctx.fill(); fillPoly(ctx, [[0, -r * 0.6], [-r * 2.2, 0], [0, r * 0.6]], p.col); }
      ctx.restore();
    }
    for (const b of this.bolts) {
      const f = b.t / b.dur, flick = Math.random() < 0.8 ? 1 : 0.3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - f) * flick;
      for (const [w, col] of [[9, b.col], [3, '#ffffff']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.globalAlpha *= w > 5 ? 0.45 : 1; ctx.beginPath(); b.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalAlpha = (1 - f) * flick; }
      ctx.restore();
    }
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1), s = Math.max(1, Math.round(p.size * (p.glow ? 0.6 + a * 0.6 : 1)));
      ctx.save(); if (p.glow) ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x / 2) * 2 - s / 2, Math.round(p.y / 2) * 2 - s / 2, s, s); ctx.restore();
    }
  },
  drawFlash(ctx) { if (this.flash) { ctx.save(); ctx.globalAlpha = clamp(this.flash.a, 0, 1) * 0.6; ctx.fillStyle = this.flash.col; ctx.fillRect(0, 38, W, 452); ctx.restore(); } },
};
function projPos(p) { const f = clamp(p.t / p.dur, 0, 1); return [lerp(p.x0, p.x1, f), lerp(p.y0, p.y1, f) - Math.sin(f * Math.PI) * p.arc]; }
// Aura czaru wokół oddziału (cząsteczki zależne od rodzaju)
function spellAura(x, y, fx) {
  const c = fx.col, top = y - 70;
  if (fx.aura === 'fall') BattleFX.emit(x, top, { n: 26, col: [c, '#ffffff'], dir: Math.PI / 2, spread: 0.5, spd: 60, jx: 40, life: 0.9, size: 3, glow: true });
  else if (fx.aura === 'rise') BattleFX.emit(x, y, { n: 28, col: [c, LT(c, 0.3)], dir: -Math.PI / 2, spread: 0.4, spd: 70, jx: 36, life: 0.9, size: 3, glow: true, drag: 1 });
  else if (fx.aura === 'wind') { for (let i = 0; i < 3; i++) BattleFX.emit(x - 40, y - 15 - i * 14, { n: 8, col: c, dir: 0, spread: 0.1, spd: 180, life: 0.45, size: 2, glow: true }); }
  else if (fx.aura === 'orbit') BattleFX.emit(x, y - 25, { n: 24, col: [c, DK(c, 0.3)], spd: 70, life: 0.7, size: 4, drag: 3 });
  else if (fx.aura === 'drip') BattleFX.emit(x, y - 55, { n: 20, col: [c, DK(c, 0.35)], dir: Math.PI / 2, spread: 0.3, spd: 30, g: 180, jx: 30, life: 0.8, size: 3 });
  BattleFX.ring(x, y + 14, c, 34, 0.6, 3); BattleFX.glow(x, y - 18, 46, c, 0.7);
  if (fx.column) BattleFX.emit(x, y, { n: 30, col: [c, '#ffffff'], dir: -Math.PI / 2, spread: 0.15, spd: 160, jx: 14, life: 0.7, size: 2, glow: true });
}

