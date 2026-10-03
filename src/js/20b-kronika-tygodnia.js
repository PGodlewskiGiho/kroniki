// ==================== KRONIKA TYGODNIA ===================================================
// Ogłoszenie astrologów na początku tygodnia (okno z rysunkiem stwora albo symbolem tygodnia) i Kronika tawerny:
// ranking graczy jak Gildia Złodziei w Heroes 3. Im więcej własnych miast z tawerną, tym więcej rubryk widać.

// Rysunek do ogłoszenia astrologów: stwór tygodnia, surowiec, księga, gwiazda many albo nocne niebo z księżycem
function chronicleIconOpts(st) {
  const Wk = weekInfo(st);
  return { iconH: 96, icon: (ctx, cx, cy) => {
    ctx.save(); ctx.fillStyle = '#1a1830'; ctx.beginPath(); ctx.arc(cx, cy, 46, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c8962a'; ctx.lineWidth = 2; ctx.stroke(); ctx.clip();
    for (let i = 0; i < 24; i++) { ctx.fillStyle = `rgba(255,248,220,${(0.3 + (thash(i, 7, 3) % 70) / 100).toFixed(2)})`; ctx.fillRect(cx - 44 + thash(i, 1, 9) % 88, cy - 44 + thash(i, 2, 9) % 88, 1.5, 1.5); }
    if (Wk.kind === 'creature') drawCreatureIcon(ctx, Wk.cid, cx, cy + 38, 2.4);
    else if (Wk.kind === 'gold' || Wk.kind === 'mines') resIcon(ctx, Wk.kind === 'gold' ? 'gold' : 'ore', cx, cy, 52);
    else if (Wk.kind === 'harvest') { resIcon(ctx, 'wood', cx - 18, cy + 4, 40); resIcon(ctx, 'ore', cx + 18, cy + 4, 40); }
    else if (Wk.kind === 'exp') { ctx.fillStyle = '#6a2a2a'; ctx.fillRect(cx - 22, cy - 18, 44, 36); ctx.fillStyle = '#f0e0b0'; ctx.fillRect(cx - 19, cy - 15, 18, 30); ctx.fillRect(cx + 1, cy - 15, 18, 30); iconStat(ctx, 'kn', cx, cy, '#6a4418'); }
    else if (Wk.kind === 'magic') { ctx.save(); ctx.translate(cx, cy); ctx.scale(3, 3); iconStat(ctx, 'sp', 0, 0, '#8ac0ff'); ctx.restore(); }
    else { circ(ctx, cx + 8, cy - 6, 22, '#f0ecd8'); circ(ctx, cx + 18, cy - 12, 20, '#1a1830'); } // spokojny tydzień: sierp księżyca
    ctx.restore();
  } };
}

// Rubryki kroniki: [nazwa, ile tawern potrzeba, wartość dla gracza (liczba do porównań), opis wartości]
const CHRONICLE_ROWS = [
  ['Miasta', 0, (st, p) => st.towns.filter(t => t.owner === p.id).length],
  ['Bohaterowie', 0, (st, p) => st.heroes.filter(h => h.owner === p.id).length],
  ['Złoto', 1, (st, p) => p.resources.gold],
  ['Najlepszy bohater', 1, (st, p) => Math.max(0, ...st.heroes.filter(h => h.owner === p.id).map(h => h.level)), v => (v ? `poziom ${v}` : '—')],
  ['Siła armii', 2, (st, p) => Math.round(st.heroes.filter(h => h.owner === p.id).reduce((s, h) => s + armyPower(h.army) * heroFactor(h), 0) + st.towns.filter(t => t.owner === p.id).reduce((s, t) => s + armyPower(t.garrison), 0))],
  ['Rzadkie surowce', 2, (st, p) => RARE.reduce((s, r) => s + p.resources[r], 0)],
  ['Obeliski', 3, (st, p) => obelisksSeen(st, p.id)],
  ['Kopalnie', 3, (st, p) => st.objects.filter(o => o.type === 'mine' && !o.dead && o.owner === p.id).length],
];
const tavernCount = (st, pid) => st.towns.filter(t => t.owner === pid && hasB(t, 'tavern')).length;
// Tabela dla gracza pid: wiersze z wartościami (null = rubryka ukryta, za mało tawern) i numerem prowadzącego
function chronicleTable(st, pid) {
  const players = st.players.filter(p => !p.out), k = tavernCount(st, pid);
  return { players, taverns: k, rows: CHRONICLE_ROWS.map(([name, need, val, fmt]) => {
    if (k < need) return { name, need, vals: null };
    const vals = players.map(p => val(st, p)), best = Math.max(...vals);
    return { name, need, vals, fmt, lead: vals.map(v => v === best && best > 0) };
  }) };
}
function showChronicle(st) {
  const T0 = chronicleTable(st, ME), cols = T0.players.length, W0 = Math.min(760, 250 + cols * 110), H0 = 172 + T0.rows.length * 34, x = (W - W0) / 2, y = (H - H0) / 2, cw = (W0 - 230) / cols;
  const btn = new Button(W / 2 - 70, y + H0 - 46, 140, 36, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 16 });
  G.modal = { box: { x, y, w: W0, h: H0 },
    msg: `Kronika tawerny. Tawerny: ${T0.taverns}.`, buttons: [btn], chronicle: T0,
    draw(ctx) {
      dimScreen(ctx, 0.55); drawParchment(ctx, x, y, W0, H0);
      text(ctx, 'Kronika tawerny', W / 2, y + 30, { size: 24, align: 'center', color: '#3a1e08', fam: 'title' });
      text(ctx, `${dateText(st)} · tydzień ${weekInfo(st).name}`, W / 2, y + 54, { size: 13, italic: true, weight: 500, align: 'center', color: '#5a3814' });
      T0.players.forEach((p, i) => { const cx = x + 220 + cw * (i + 0.5);
        ctx.save(); ctx.translate(cx - 12, y + 70); drawFlag(ctx, 0, 0, 24, 13, G.time, ownerColor(st, p.id)); ctx.restore();
        text(ctx, cap1(playerName(st, p.id)), cx, y + 98, { size: 12, weight: 700, align: 'center', color: p.id === ME ? '#2a6a1e' : '#3a1e08' }); });
      T0.rows.forEach((r, j) => {
        const ry = y + 112 + j * 34; ctx.fillStyle = j % 2 ? 'rgba(90,55,20,.06)' : 'rgba(90,55,20,.13)'; ctx.fillRect(x + 20, ry, W0 - 40, 32);
        text(ctx, r.name, x + 30, ry + 16, { size: 15, color: '#3a1e08', fam: 'title' });
        if (!r.vals) { text(ctx, `potrzeba ${r.need} ${r.need === 1 ? 'tawerny' : 'tawern'}`, x + 220 + (W0 - 250) / 2, ry + 16, { size: 12, italic: true, weight: 500, align: 'center', color: 'rgba(90,55,20,.55)' }); return; }
        r.vals.forEach((v, i) => { const cx = x + 220 + cw * (i + 0.5);
          if (r.lead[i]) { ctx.fillStyle = 'rgba(224,178,74,.35)'; rr(ctx, cx - cw / 2 + 6, ry + 3, cw - 12, 26, 4); ctx.fill(); }
          text(ctx, r.fmt ? r.fmt(v) : String(v), cx, ry + 16, { size: 14, weight: r.lead[i] ? 800 : 500, align: 'center', color: '#2a1606' }); });
      });
      btn.draw(ctx);
    },
  };
}
