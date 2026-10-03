// ==================== OKNO WYNIKU BITWY (jak w Heroes 3) ====================================
// Po bitwie nad polem walki (albo nad mapą po walce automatycznej) otwiera się okno: portrety obu stron z podpisem
// zwycięzca/pokonany, ruchomy obraz (zwycięstwo: bohater na wzgórzu o wschodzie słońca i sztandary; porażka: burza, kruki
// i złamany sztandar; odwrót: bohater odjeżdża o zmierzchu), opis w stylu kroniki i straty obu stron z ikonami stworów.
// Treść okna jest też w M.msg (testy i czytniki ekranu).

// Strona bitwy do okna: bohater (albo najsilniejszy stwór), właściciel, miasto i straty [{ cid, n }]
function sideSummary(B, s) {
  const S = B.sides[s], units = B.units.filter(u => u.side === s && u.src !== 'siege'), lost = {};
  for (const u of units) if (u.n < u.n0) lost[u.cid] = (lost[u.cid] || 0) + u.n0 - u.n;
  const top = units.filter(u => !isMachine(u)).sort((a, b) => b.n0 * CREATURES[b.cid].hp - a.n0 * CREATURES[a.cid].hp)[0];
  return { hero: S.hero || null, owner: S.owner, town: S.town ? S.town.name : null, cid: top ? top.cid : null, lost: Object.entries(lost).map(([cid, n]) => ({ cid, n })) };
}
const REPORT_FLAVOR = {
  win: ['Wróg pierzcha w popłochu, a twoje sztandary powiewają nad polem bitwy.', 'Chwalebne zwycięstwo! Bardowie długo będą o nim śpiewać.', 'Pole bitwy należy do ciebie, a wrogowie liczą poległych.'],
  lose: ['Twoje wojska leżą pokonane, a sztandar wlecze się w błocie.', 'Kruki krążą nad polem bitwy. Tym razem los był przeciwko tobie.', 'Wróg okazał się silniejszy. Z pola bitwy wraca tylko echo.'],
  fled: ['Odwrót to nie hańba: przegrana bitwa to jeszcze nie przegrana wojna.', 'Twoje wojska wycofują się w porządku, by walczyć innego dnia.'],
};
const flavorOf = (st, kind) => { const L = REPORT_FLAVOR[kind]; return L[(st.dayTotal + (st.seed || 0)) % L.length]; };
const heroExpText = (h, exp) => (h && exp ? ` Za odwagę ${h.name} otrzymuje ${exp} doświadczenia.` : '');
// Opis wyniku z punktu widzenia atakującego (strona 0); tekst zgodny z dawnymi oknami
function attackReport(st, h, res) {
  if (res.outcome === 'win') {
    const extra = (res.heroDefeated ? ` ${res.heroDefeated.name} zostaje ${res.heroDefeated.female ? 'pokonana' : 'pokonany'} i znika z mapy.${res.loot ? ` Zdobyte artefakty: ${res.loot}.` : ''}` : '') + (res.captured ? ` Miasto ${res.captured} należy teraz do ciebie.` : '') + (res.bankText || '');
    return { me: 0, kind: 'win', title: 'Zwycięstwo!', body: `${flavorOf(st, 'win')}${extra}${raisedText(res.raised)}${spoilsText(res.spoils)}${heroExpText(h, res.exp)}` };
  }
  if (res.outcome === 'fled') return { me: 0, kind: 'fled', title: 'Odwrót', body: `${h.name} ucieka z pola bitwy, a armia się rozprasza. ${flavorOf(st, 'fled')} ${h.female ? 'Czeka' : 'Czeka'} w twojej tawernie: możesz ${h.female ? 'ją' : 'go'} znów nająć (z poziomem, umiejętnościami i artefaktami).` };
  const tail = `${h.name} ${h.female ? 'znika' : 'znika'} z mapy${res.foeLoot ? ', a artefakty przejmuje zwycięzca' : ''}. Za tydzień ${h.female ? 'pojawi się' : 'pojawi się'} w tawernach — może ${h.female ? 'ją' : 'go'} nająć każdy, także przeciwnik.`;
  return { me: 0, kind: 'lose', title: 'Porażka', body: `${flavorOf(st, 'lose')} Armia została rozbita. ${tail}` };
}
// Opis wyniku obrony (gracz to strona 1)
function defenseReport(st, a, D, res) {
  const held = res.outcome !== 'win';
  if (held) return { me: 1, kind: 'win', title: 'Obrona udana!', body: `${a.h.name} zostaje odparty. ${flavorOf(st, 'win')}${raisedText(res.foeRaised)}${spoilsText(res.foeSpoils)}${D ? heroExpText(D, res.foeExp) : ''}` };
  return { me: 1, kind: 'lose', title: 'Porażka w obronie.', body: `${res.captured ? `Miasto ${res.captured} przepada. ` : ''}${res.heroDefeated ? `${res.heroDefeated.name} ${res.heroDefeated.female ? 'poległa' : 'poległ'}. ` : ''}${flavorOf(st, 'lose')}` };
}
// Okno wyniku. R: { me, kind, title, body }; res.sides z resolveBattle. onOk po zamknięciu.
function showBattleReport(st, res, R, onOk) {
  const w = 620, x = (W - w) / 2, S = res.sides || [], me = S[R.me] || {}, foe = S[1 - R.me] || {}, t0 = G.time;
  G.ctx.font = font(17, 500, 'body'); const lines = wrapText(G.ctx, R.body, w - 70);
  const rowH = 70, h = 318 + lines.length * 22 + rowH * 2, y = Math.max(8, (H - h) / 2);
  const ok = new Button(W / 2 - 60, y + h - 56, 120, 40, 'OK', () => { G.modal = null; if (onOk) onOk(); }, { key: 'enter' });
  const colOf = s => (s && s.owner >= 0 ? ownerColor(st, s.owner) : '#8a8478');
  const portrait = (ctx, s, px, py, dir, winner) => {
    if (!PIXEL_ART && uiArtReady()) { // medalion: portret bohatera albo stwór na tle nieba
      if (s.hero) drawHeroMedal(ctx, px + 40, py + 40, 42, s.hero, colOf(s));
      else { ctx.save(); ctx.beginPath(); ctx.arc(px + 40, py + 40, 37, 0, TAU); ctx.clip(); const g = ctx.createLinearGradient(0, py, 0, py + 80); g.addColorStop(0, '#4a5a6a'); g.addColorStop(1, '#2a2a22'); ctx.fillStyle = g; ctx.fillRect(px, py, 80, 80);
        if (s.cid) { const bs = battleSprite(s.cid, dir, 'idle', 0), k = clamp(66 / (bs.c.height * bs.u), 0.4, 1.1); drawSprite(ctx, bs, px + 40, py + 74, k); } ctx.restore(); drawUiPiece(ctx, 'ring', px - 5, py - 5, 90, 90); }
      const name = s.hero ? s.hero.name : s.town ? `Garnizon: ${s.town}` : s.cid ? CREATURES[s.cid].plural : '—';
      text(ctx, name, px + 40, py + 100, { size: 14, align: 'center', color: '#2a1606', fam: 'title' });
      text(ctx, winner ? 'Zwycięzca' : 'Pokonany', px + 40, py + 118, { size: 14, align: 'center', italic: true, weight: 600, color: winner ? '#2a6a1a' : '#8a1a14' }); return;
    }
    ctx.fillStyle = '#1a1208'; ctx.fillRect(px - 2, py - 2, 84, 84); ctx.strokeStyle = '#b8913f'; ctx.lineWidth = 2; ctx.strokeRect(px - 2, py - 2, 84, 84);
    if (s.hero) drawHeroPortrait(ctx, px + 4, py + 4, s.hero, colOf(s), 2);
    else if (s.cid) { ctx.save(); ctx.beginPath(); ctx.rect(px, py, 80, 80); ctx.clip(); const g = ctx.createLinearGradient(0, py, 0, py + 80); g.addColorStop(0, '#4a5a6a'); g.addColorStop(1, '#2a2a22'); ctx.fillStyle = g; ctx.fillRect(px, py, 80, 80); drawSprite(ctx, battleSprite(s.cid, dir, 'idle', 0), px + 40, py + 74, 0.42); ctx.restore(); }
    const name = s.hero ? s.hero.name : s.town ? `Garnizon: ${s.town}` : s.cid ? CREATURES[s.cid].plural : '—';
    text(ctx, name, px + 40, py + 98, { size: 14, align: 'center', color: '#2a1606', fam: 'title' });
    text(ctx, winner ? 'Zwycięzca' : 'Pokonany', px + 40, py + 116, { size: 13, align: 'center', italic: true, weight: 500, color: winner ? '#2a6a1a' : '#8a1a14' });
  };
  const lossRow = (ctx, label, list, ry, dir) => {
    text(ctx, label, x + 34, ry + 30, { size: 15, color: '#3a1e08', fam: 'title' });
    if (!list.length) return text(ctx, 'bez strat', x + 190, ry + 30, { size: 15, italic: true, weight: 500, color: '#5a3814' });
    list.slice(0, 8).forEach((L, i) => { const cx = x + 190 + i * 50; if (PIXEL_ART) { ctx.fillStyle = 'rgba(60,36,12,.12)'; ctx.fillRect(cx - 23, ry, 46, 52); } else slotBox(ctx, cx - 23, ry, 46, 52);
      ctx.save(); ctx.beginPath(); ctx.rect(cx - 23, ry, 46, 52); ctx.clip(); drawSprite(ctx, battleSprite(L.cid, dir, 'idle', 0), cx, ry + 50, 0.5); ctx.restore(); text(ctx, String(L.n), cx, ry + 64, { size: 14, align: 'center', color: '#2a1606', fam: 'title' }); });
    if (list.length > 8) text(ctx, `+${list.length - 8}`, x + 190 + 8 * 50, ry + 30, { size: 14, color: '#3a1e08' });
  };
  const winnerMe = R.kind === 'win';
  G.modal = { box: { x, y, w, h },
    msg: `${R.title} ${R.body}`, buttons: [ok], report: R, locked: true,
    draw(ctx) {
      dimScreen(ctx, 0.45); drawParchment(ctx, x, y, w, h); const t = G.time - t0;
      goldText(ctx, R.title, W / 2, y + 34, 30);
      const px = x + 120, py = y + 60, pw = w - 240, ph = 150;
      pixLayer('report', ctx, px, py, pw, ph, g => drawReportScene(g, px, py, pw, ph, R.kind, me, colOf(me), t, st)); // obraz jako pixel art
      ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3; ctx.strokeRect(px - 1.5, py - 1.5, pw + 3, ph + 3); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1; ctx.strokeRect(px - 4, py - 4, pw + 8, ph + 8);
      portrait(ctx, me, x + 20, y + 64, 1, winnerMe); portrait(ctx, foe, x + w - 100, y + 64, -1, !winnerMe && R.kind !== 'fled');
      lines.forEach((l, i) => text(ctx, l, W / 2, y + 240 + i * 22, { size: 17, weight: 500, align: 'center', color: '#2a1606' }));
      const ly = y + 252 + lines.length * 22; ctx.strokeStyle = 'rgba(90,55,20,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 30, ly - 4); ctx.lineTo(x + w - 30, ly - 4); ctx.stroke();
      lossRow(ctx, 'Twoje straty', me.lost || [], ly, 1); lossRow(ctx, 'Straty wroga', foe.lost || [], ly + rowH, -1);
      ok.draw(ctx); G.dirty = true;
    },
  };
}

// --- ruchomy obraz w oknie wyniku ---
function drawReportScene(ctx, x, y, w, h, kind, me, col, t, st) {
  const cx = x + w / 2, gy = y + h * 0.78, R = mulberry32(5 + ((st && st.dayTotal) || 0));
  if (kind === 'win') { // świt nad wzgórzem, promienie słońca, bohater ze sztandarami, złoty pył
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2a4a8a'); g.addColorStop(0.55, '#e89a5a'); g.addColorStop(1, '#f8d890'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const sx = cx + w * 0.18, sy = gy - 18;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(sx, sy); ctx.rotate(t * 0.15);
    for (let i = 0; i < 14; i++) { ctx.rotate(TAU / 14); ctx.fillStyle = 'rgba(255,220,140,.10)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(260, -22); ctx.lineTo(260, 22); ctx.closePath(); ctx.fill(); }
    ctx.restore(); const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 60); sg.addColorStop(0, 'rgba(255,250,210,1)'); sg.addColorStop(0.35, 'rgba(255,220,140,.7)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = sg; ctx.fillRect(sx - 60, sy - 60, 120, 120);
    fillPoly(ctx, [[x, gy], [x + w * 0.2, gy - 26], [x + w * 0.45, gy - 12], [x + w * 0.7, gy - 30], [x + w, gy - 8], [x + w, y + h], [x, y + h]], '#6a5a7a');
    ctx.fillStyle = '#3a5a2a'; ctx.beginPath(); ctx.ellipse(cx - w * 0.12, y + h + 30, w * 0.5, 70, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a6a34'; ctx.beginPath(); ctx.ellipse(cx - w * 0.12, y + h + 34, w * 0.46, 64, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.fill();
    const hx = cx - w * 0.12, hy = y + h - 38;
    for (const [dx, k] of [[-58, 0], [58, 1.3]]) { ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx + dx, hy + 16); ctx.lineTo(hx + dx, hy - 48); ctx.stroke(); // sztandary na drzewcach
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx + dx, hy - 47); for (let i = 1; i <= 8; i++) ctx.lineTo(hx + dx + i * 4, hy - 46 + Math.sin(t * 5 - i * 0.7 + k) * 2.2 * i / 8); for (let i = 8; i >= 0; i--) ctx.lineTo(hx + dx + i * 4, hy - 30 - i * 0.6 + Math.sin(t * 5 - i * 0.7 + k) * 2.2 * i / 8); ctx.fill();
      ctx.fillStyle = '#f0d060'; ctx.fillRect(hx + dx - 2, hy - 51, 4, 4); }
    if (me && me.hero && !PIXEL_ART) drawSprite(ctx, heroBattleSprite(me.hero, col, 1, Math.floor(t * 6) % 4), hx, hy + 16, 0.75); // bohater z modelu 3D
    else if (me && me.hero) { ctx.save(); ctx.translate(hx, hy + 14); ctx.scale(3, 3); drawHeroSprite(ctx, 0, 0, 1, col, t, false, heroClass(me.hero).look); ctx.restore(); }
    else { ctx.fillStyle = '#4a4040'; ctx.fillRect(hx - 30, hy - 30, 60, 44); for (let i = 0; i < 5; i++) ctx.fillRect(hx - 30 + i * 13, hy - 38, 8, 8); ctx.fillStyle = '#1a1010'; ctx.fillRect(hx - 8, hy - 6, 16, 20); } // obroniony gród
    for (let i = 0; i < 26; i++) { const u = (t * 0.12 + R()) % 1, px = x + R() * w + Math.sin(t + i) * 6; ctx.fillStyle = `rgba(255,230,140,${(0.8 * Math.sin(u * Math.PI)).toFixed(2)})`; ctx.fillRect(px, y + h - u * h, 2, 2); }
    for (let i = 0; i < 3; i++) { const bx = x + ((t * 22 + i * 90) % (w + 40)) - 20, by = y + 26 + i * 12 + Math.sin(t * 2 + i) * 4, f = Math.sin(t * 9 + i) * 3; ctx.strokeStyle = 'rgba(40,30,40,.8)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(bx - 5, by - f); ctx.quadraticCurveTo(bx - 2, by, bx, by + 1); ctx.quadraticCurveTo(bx + 2, by, bx + 5, by - f); ctx.stroke(); }
  } else if (kind === 'lose') { // burza nad pobojowiskiem: błyskawice, deszcz, kruki, złamany sztandar, miecz w ziemi
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0e0e16'); g.addColorStop(0.6, '#3a3040'); g.addColorStop(1, '#5a4a44'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 7; i++) { const cxx = x + ((i * 70 + t * 8) % (w + 120)) - 60; ctx.fillStyle = 'rgba(20,18,26,.7)'; ctx.beginPath(); ctx.ellipse(cxx, y + 14 + (i % 3) * 10, 50, 14, 0, 0, TAU); ctx.fill(); }
    const ph = (t * 0.6) % 3.2; if (ph < 0.12) { ctx.fillStyle = `rgba(230,230,255,${(0.5 - ph * 4).toFixed(2)})`; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#f0f0ff'; ctx.lineWidth = 2; ctx.beginPath(); let lx = x + w * 0.7, ly = y; ctx.moveTo(lx, ly); for (let k = 0; k < 6; k++) { lx += (R() - 0.5) * 30; ly += h * 0.1; ctx.lineTo(lx, ly); } ctx.stroke(); }
    fillPoly(ctx, [[x, gy], [x + w * 0.3, gy - 10], [x + w * 0.6, gy - 4], [x + w, gy - 14], [x + w, y + h], [x, y + h]], '#2a2622');
    for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + R() * w, gy + 8 + R() * (h * 0.15), 14 + R() * 10, 3, 0, 0, TAU); ctx.fill(); }
    const fx0 = cx - 20, fy = gy + 6; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx0, fy); ctx.lineTo(fx0 + 30, fy - 64); ctx.stroke(); // złamane drzewce i podarty sztandar
    ctx.beginPath(); ctx.moveTo(fx0 - 26, fy + 2); ctx.lineTo(fx0 - 4, fy - 4); ctx.stroke();
    const dc = shadeHex(col, -0.45); ctx.fillStyle = dc; ctx.beginPath(); ctx.moveTo(fx0 + 29, fy - 62);
    for (let i = 1; i <= 7; i++) ctx.lineTo(fx0 + 29 + i * 4, fy - 58 + i * 1.2 + Math.sin(t * 2 - i * 0.6) * 1.4 * i / 7); ctx.lineTo(fx0 + 55, fy - 42); ctx.lineTo(fx0 + 48, fy - 46); ctx.lineTo(fx0 + 44, fy - 38); ctx.lineTo(fx0 + 36, fy - 44); ctx.lineTo(fx0 + 27, fy - 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a8e98'; ctx.save(); ctx.translate(cx + 60, fy + 2); ctx.rotate(0.15); ctx.fillRect(-1.5, -30, 3, 30); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-7, -32, 14, 3); ctx.fillRect(-1.5, -40, 3, 8); ctx.restore(); // miecz w ziemi
    ctx.fillStyle = shadeHex(col, -0.3); ctx.beginPath(); ctx.ellipse(cx - 70, fy + 4, 13, 5, -0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8a040'; circ(ctx, cx - 70, fy + 3, 2, '#c8a040'); // porzucona tarcza
    for (let i = 0; i < 4; i++) { const a = t * 0.8 + i * TAU / 4, bx = cx + Math.cos(a) * (60 + i * 8), by = y + 40 + Math.sin(a) * 18, f = Math.sin(t * 8 + i) * 3; ctx.fillStyle = '#0a0808'; ctx.beginPath(); ctx.moveTo(bx - 7, by - f); ctx.quadraticCurveTo(bx - 2, by - 1, bx, by + 1); ctx.quadraticCurveTo(bx + 2, by - 1, bx + 7, by - f); ctx.lineTo(bx, by + 3); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(170,180,210,.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 50; i++) { const u = (t * (1.4 + (i % 3) * 0.2) + i * 0.137) % 1, rx = x + ((i * 53) % w) - u * 20, ry = y + u * h; ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 9); } ctx.stroke();
  } else { // odwrót: zmierzch, droga, bohater odjeżdża w dal
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1e2238'); g.addColorStop(0.6, '#6a5a7a'); g.addColorStop(1, '#c08a6a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    fillPoly(ctx, [[x, gy - 6], [x + w * 0.35, gy - 22], [x + w * 0.7, gy - 10], [x + w, gy - 26], [x + w, y + h], [x, y + h]], '#3a3448');
    fillPoly(ctx, [[x + w * 0.3, y + h], [x + w * 0.46, gy], [x + w * 0.5, gy], [x + w * 0.9, y + h]], '#8a7058');
    const u = (t * 0.12) % 1, hx = x + w * (0.82 - u * 0.4), hy = gy + 6 + (1 - u) * 26, k = 2.6 - u * 1.6;
    if (me && me.hero && !PIXEL_ART) drawSprite(ctx, heroBattleSprite(me.hero, col, -1, Math.floor(t * 8) % 8, 'walk'), hx, hy, k * 0.25); // odjeżdża (3D)
    else if (me && me.hero) { ctx.save(); ctx.translate(hx, hy); ctx.scale(k, k); drawHeroSprite(ctx, 0, 0, -1, col, t, true, heroClass(me.hero).look); ctx.restore(); }
    for (let i = 0; i < 20; i++) { const sx2 = x + (i * 97) % w, sy2 = y + (i * 37) % (h * 0.4); ctx.fillStyle = `rgba(240,230,255,${(0.3 + 0.3 * Math.sin(t * 2 + i)).toFixed(2)})`; ctx.fillRect(sx2, sy2, 1, 1); }
  }
  ctx.fillStyle = 'rgba(0,0,0,.25)'; const vg = ctx.createRadialGradient(cx, y + h / 2, h * 0.3, cx, y + h / 2, w * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
}

// ==================== EKRAN KOŃCA GRY ====================================================
// Tłem jest malowany obraz (zwycięstwo / porażka, tools/tla-ai/menu), a bez niego scena miasta gracza: przy zwycięstwie z fajerwerkami i złotym blaskiem, przy porażce szara, w dymie,
// z żarem i krukami. Na niej napis, kronika królestwa (dni, miasta, bohaterowie, siła armii, wynik) i ranga jak w Heroes 3.
const END_RANKS = [[0, 'Chłop'], [40, 'Goblin'], [80, 'Wilk'], [140, 'Ork'], [220, 'Gryf'], [330, 'Mantykora'], [480, 'Jednorożec'], [700, 'Archanioł'], [1000, 'Czarny smok']];
const endRank = score => END_RANKS.filter(([s]) => score >= s).pop()[1];
function showGameEnd(st, r, msg, opts) {
  const pid = hotseat(st) && r === 'win' ? st.winner : ME, P = st.players[pid], col = ownerColor(st, pid), t0 = G.time;
  const town = st.towns.find(t => t.owner === pid) || st.towns.find(t => t.faction === P.faction) || st.towns[0];
  const SK = PIXEL_ART ? 1 : 2, scene = document.createElement('canvas'); scene.width = 592 * SK; scene.height = 440 * SK; scene.getContext('2d').scale(SK, SK); // gładko: scena w podwójnej rozdzielczości (ostra na pełnym ekranie)
  if (town) paintTownScene(scene.getContext('2d'), { ...town, owner: pid, built: BUILDINGS.filter(B => B.slot !== undefined).map(B => B.id) }, col); // miasto w pełnej krasie (albo w ruinie)
  const heroes = st.heroes.filter(h => h.owner === pid), army = heroes.reduce((s, h) => s + h.army.reduce((a, x) => a + (x ? x.n * (CREATURES[x.cid].value || 0) : 0), 0), 0);
  const score = r === 'win' ? (st.scoreRow ? st.scoreRow.score : 0) : 0;
  const rows = [['Dni panowania', st.dayTotal], ['Miasta', st.towns.filter(t => t.owner === pid).length], ['Bohaterowie', heroes.length], ['Siła armii', army], ...(r === 'win' && !hotseat(st) ? [['Wynik', score], ['Ranga', endRank(score)]] : [])];
  const bw = 150, gap = 20, total = opts.length * bw + (opts.length - 1) * gap; let bx = (W - total) / 2;
  const buttons = opts.map(o => { const b = new Button(bx, H - 64, bw, 42, o.label, () => { G.modal = null; if (o.action) o.action(); }, { key: o.key }); bx += bw + gap; return b; });
  const win = r === 'win', R = mulberry32(77);
  const bursts = Array.from({ length: 7 }, (_, i) => ({ x: 120 + R() * 560, y: 70 + R() * 150, t: i * 0.45 + R() * 0.3, c: [col, '#ffd970', '#ffffff', '#6ac0ff', '#ff6a8a'][i % 5] }));
  G.modal = {
    msg, buttons, locked: true, gameEnd: r,
    draw(ctx) {
      const t = G.time - t0; G.dirty = true;
      const EA = screenArt(win ? 'zwyciestwo' : 'porazka'); // malowany obraz końca gry (rycerz w czerwonej pelerynie: triumf o świcie albo klęska przy płonącym zamku)
      if (EA) viewportDraw(ctx, c => drawPaintedArt(c, EA[0], EA[1], VW, VH)); // obraz na całe okno (także poza polem okna 800×600)
      else { ctx.save(); ctx.imageSmoothingEnabled = !PIXEL_ART; ctx.drawImage(scene, 30 * SK, 20 * SK, 534 * SK, 400 * SK, 0, 0, W, H); ctx.restore(); } // piksel sceny = 3 px ekranu (równe piksele)
      if (win && !EA) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,120,${(0.08 + 0.04 * Math.sin(t)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } // ciepłe światło: gładkie (dithering dałby siatkę kropek)
      if (win) pixLayer('endFx', ctx, 0, 0, W, H, ctx => {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const B of bursts) { const u = ((t - B.t) % 3.2 + 3.2) % 3.2; if (u > 1.4) continue; const k = u / 1.4, rad = 20 + ease(k) * 70; // fajerwerki
          for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, px = B.x + Math.cos(a) * rad, py = B.y + Math.sin(a) * rad + k * k * 30; ctx.fillStyle = B.c; ctx.globalAlpha = 1 - k; ctx.fillRect(px - 1.5, py - 1.5, 3, 3); } }
        ctx.restore(); ctx.globalAlpha = 1;
      }, { px: 3, add: true });
      else if (!EA) {
        ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = 0.85; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
        ctx.fillStyle = 'rgba(10,4,6,.45)'; ctx.fillRect(0, 0, W, H);
        pixLayer('endFx', ctx, 0, 0, W, H, ctx => {
        for (let i = 0; i < 5; i++) for (let k = 0; k < 6; k++) { const u = (t * 0.15 + k / 6 + i * 0.13) % 1, x = 90 + i * 150 + Math.sin(u * 5 + i) * 20, y = 470 - u * 420; circ(ctx, x, y, 14 + u * 40, `rgba(30,26,28,${(0.35 * (1 - u)).toFixed(2)})`); } // dym z pogorzeliska
        for (let i = 0; i < 30; i++) { const u = (t * 0.2 + i * 0.137) % 1; ctx.fillStyle = `rgba(255,${120 + (i % 4) * 25},40,${(0.8 * (1 - u)).toFixed(2)})`; ctx.fillRect(40 + (i * 97) % 720 + Math.sin(t + i) * 8, 560 - u * 420, 2, 2); }
        for (let i = 0; i < 5; i++) { const a = t * 0.6 + i * TAU / 5, bx2 = 400 + Math.cos(a) * (150 + i * 20), by2 = 110 + Math.sin(a) * 40, f = Math.sin(t * 8 + i) * 4; ctx.fillStyle = '#0a0808'; ctx.beginPath(); ctx.moveTo(bx2 - 9, by2 - f); ctx.quadraticCurveTo(bx2 - 3, by2 - 1, bx2, by2 + 1); ctx.quadraticCurveTo(bx2 + 3, by2 - 1, bx2 + 9, by2 - f); ctx.lineTo(bx2, by2 + 4); ctx.closePath(); ctx.fill(); }
        }, { px: 3 });
        const vg = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 520); vg.addColorStop(0, 'rgba(120,0,0,0)'); vg.addColorStop(1, 'rgba(110,10,10,.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      }
      const k = ease(clamp(t / 0.8, 0, 1)); // wstęga z napisem opada z góry
      ctx.save(); ctx.translate(W / 2, -60 + 130 * k); const cloth = win ? '#8a1e1a' : '#2e2a30', trim = win ? '#e0b24a' : '#6a6268';
      for (const sd of [-1, 1]) fillPoly(ctx, [[sd * 190, -30], [sd * 240, -26], [sd * 222, 0], [sd * 240, 34], [sd * 190, 30]], shadeHex(cloth, -0.3));
      if (PIXEL_ART) { ctx.fillStyle = cloth; ctx.fillRect(-200, -42, 400, 84); ctx.fillStyle = trim; ctx.fillRect(-200, -42, 400, 4); ctx.fillRect(-200, 38, 400, 4); }
      else { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(-196, -36, 400, 84); leatherFill(ctx, -200, -42, 400, 84, 31); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = win ? '#c84030' : '#8a8090'; ctx.fillRect(-200, -42, 400, 84); ctx.restore(); goldRim(ctx, -200, -42, 400, 84, 4);
        drawCorners(ctx, -200, -42, 400, 84); } // tablica: skóra w barwie wyniku w złotej listwie
      goldText(ctx, win ? 'Zwycięstwo!' : 'Porażka', 0, -8, 40); text(ctx, win ? (hotseat(st) ? `${cap1(playerName(st, pid))} włada krainą` : 'Kraina należy do ciebie') : 'Twoje królestwo upadło', 0, 24, { size: 16, align: 'center', italic: true, weight: 500, color: '#f4e2a8' });
      ctx.restore();
      if (t > 0.6) { // kronika królestwa na pergaminie
        const pw = 420, ph = 44 + rows.length * 26, px = (W - pw) / 2, py = H - 90 - ph; ctx.globalAlpha = clamp((t - 0.6) / 0.5, 0, 1);
        drawParchment(ctx, px, py, pw, ph); text(ctx, 'Kronika królestwa', W / 2, py + 26, { size: 18, align: 'center', color: '#3a1e08', fam: 'title' });
        rows.forEach(([a, b], i) => { text(ctx, a, px + 50, py + 54 + i * 26, { size: 16, weight: 500, color: '#3a1e08' }); text(ctx, String(b), px + pw - 50, py + 54 + i * 26, { size: 16, align: 'right', color: '#2a1606', fam: 'title' }); });
        ctx.globalAlpha = 1;
      }
      buttons.forEach(b => b.draw(ctx));
    },
  };
}
