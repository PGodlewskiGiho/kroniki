// ==================== PLANER ROZWOJU BOHATERA ===============================================
// Okno z ekranu bohatera (przycisk „Rozwój”, klawisz R): trzy zakładki – Postęp (kolejne punkty, talenty, ścieżka, umiejętności
// i specjalizacje), Sploty (20 par umiejętności, co działa i czego brakuje) i Klasy prestiżowe (12 hybryd, wymagania i zdolność).
// Klik w splot albo klasę wyznacza cel: przy awansie umiejętność prowadząca do celu jest zawsze w ofercie i ma gwiazdkę.
// W mieście z gildią magów działa tu ołtarz przemiany (za złoto: nowe specjalizacje, punkty od nowa, zapomnienie umiejętności).
const PLAN_BOX = { x: 20, y: 22, w: 760, h: 556 };
const PLAN_TABS = [['progress', 'Postęp'], ['syn', 'Sploty'], ['pre', 'Klasy prestiżowe']];
const lvName = L => (L ? SKILL_LEVELS[L].toLowerCase() : 'brak');
// stan pary umiejętności: 2 = obie co najmniej na poziomie need, 1 = jedna, 0 = żadna
const pairState = (h, req, need) => req.filter(id => heroSkill(h, id) >= need).length;
const pairText = (h, req, need) => req.map(id => `${SKILLS[id].name} (${lvName(heroSkill(h, id))}${heroSkill(h, id) >= need ? ' ✓' : ''})`).join(' + ');
function nextLevelWhere(h, f) { for (let L = h.level + 1; L <= h.level + 40; L++) if (f(L)) return L; return null; }

function showDevPlanner(h, tab = 'progress', msg = '') {
  const { x, y, w, h: hh } = PLAN_BOX, mine = h.owner === ME && !G.screens.hero.preview, st = G.state;
  let rows = []; const say = m => { msg = m; };
  const tabs = PLAN_TABS.map(([id, name], i) => new Button(x + 24 + i * 176, y + 62, 168, 36, name, () => { tab = id; msg = ''; }, { size: 16, selected: () => tab === id, key: String(i + 1), tip: `Zakładka: ${name} (klawisz ${i + 1}).` }));
  const altarOk = () => mine && curseFree(st, h);
  const bAltar = new Button(x + 24, y + hh - 56, 220, 40, 'Ołtarz przemiany', () => showAltar(h), { size: 16, key: 'o',
    tip: 'W mieście z gildią magów: za złoto nowe specjalizacje, punkty cech od nowa albo zapomnienie umiejętności (klawisz O).' });
  const bClose = new Button(x + w - 164, y + hh - 56, 140, 40, 'Zamknij', () => { G.modal = null; }, { key: 'escape', size: 17 });
  const rowAt = (px, py) => rows.find(r => inRect(px, py, r)) || null;
  G.modal = { box: PLAN_BOX, planner: { get tab() { return tab; }, h }, buttons: [...tabs, bAltar, bClose],
    onClick(px, py) { const r = rowAt(px, py); if (r && r.goal && mine) { const g = setGoal(h, r.goal); say(g ? `Cel: ${goalName(h)}. Umiejętność, która do niego prowadzi, będzie zawsze w ofercie awansu (★).` : 'Cel zdjęty.'); Sfx.play('click'); } },
    rightInfo(px, py) { const r = rowAt(px, py); return r ? r.info + (r.goal && mine ? (h.goal === r.goal ? ' Kliknij, aby zdjąć cel.' : ' Kliknij, aby uczynić to celem rozwoju.') : '') : null; },
    draw(ctx) {
      dimScreen(ctx, 0.5); drawParchment(ctx, x, y, w, hh); rows = [];
      goldText(ctx, `Rozwój: ${h.name}`, x + w / 2, y + 38, 24);
      text(ctx, `${heroTitle(h)} · poziom ${h.level}`, x + w - 24, y + 38, { size: 13, weight: 600, align: 'right', color: '#6a3a10', max: 200 });
      bAltar.disabled = !altarOk(); [...tabs, bAltar, bClose].forEach(b => b.draw(ctx));
      const top = y + 112, bot = y + hh - 104;
      if (tab === 'progress') drawPlanProgress(ctx, h, x + 24, top, w - 48, rows);
      else if (tab === 'syn') drawPlanPairs(ctx, h, Object.keys(SYNERGIES), x + 24, top, w - 48, bot - top, rows, 'syn');
      else drawPlanPairs(ctx, h, Object.keys(PRESTIGE), x + 24, top, w - 48, bot - top, rows, 'pre');
      // cel i komunikat
      const req = goalReq(h), miss = goalSkills(h);
      const gl = req ? `Cel: ${goalName(h)} – ${goalDone(h) ? 'osiągnięty!' : `brakuje: ${miss.map(id => `${SKILLS[id].name} (${heroSkill(h, id) ? 'do zaawansowanego' : 'nowa'})`).join(', ')}`}` : 'Cel: brak. Kliknij splot albo klasę prestiżową, aby wyznaczyć cel rozwoju.';
      text(ctx, msg || gl, x + w / 2, y + hh - 76, { size: 14, weight: 600, align: 'center', italic: !msg && !req, color: msg ? '#8a3a1a' : '#3a1e08', max: w - 48 });
      if (!altarOk()) text(ctx, 'Ołtarz: w mieście z gildią magów', x + 254, y + hh - 32, { size: 12, italic: true, color: '#6a4418' });
    },
  };
}
// Zakładka Postęp: kamienie milowe (punkt cechy, talent, ścieżka, legenda) i umiejętności ze specjalizacjami
function drawPlanProgress(ctx, h, x, y, w, rows) {
  const half = (w - 24) / 2, L = (k, v, yy, col) => { text(ctx, k, x, yy, { size: 14, weight: 500, color: '#3a2410', max: half - 120 }); text(ctx, v, x + half, yy, { size: 14, weight: 700, align: 'right', color: col || '#2a1606', max: 150 }); };
  text(ctx, 'Kolejne awanse', x, y, { size: 17, fam: 'title', color: '#5a2a08' });
  const pt = nextLevelWhere(h, L => L % FREE_PT_EVERY === 0), tl = TALENTS_ON ? nextLevelWhere(h, L => talentLevel(L, h)) : null, exp = expForLevel(h.level + 1) - h.exp;
  const rowsL = [
    ['Następny poziom', `za ${Math.max(0, exp)} dośw.`],
    ['Wolny punkt cechy', h.freePts > 0 ? `${h.freePts} do wydania!` : `poziom ${pt}`, h.freePts > 0 ? '#2a7a1a' : null],
    ['Talent', tl ? `poziom ${tl}` : '—'],
    ['Ścieżka mistrzowska', h.mastery ? HERO_PATHS[h.mastery].name : `poziom ${PATH_LEVELS[0]}`],
    ['Legenda', h.mastery && pathLv(h, h.mastery) === 2 ? 'osiągnięta' : `poziom ${PATH_LEVELS[1]}`],
    ['Umiejętności', `${h.skills.length} z ${MAX_SKILLS}`],
    ['Talenty', h.talents.length ? h.talents.map(t => TALENTS[t].name).join(', ') : 'brak'],
    ['Sploty działające', String(activeSynergies(h).length)],
  ];
  if (h.relearn > 0) rowsL.push(['Do wybrania (ołtarz)', `${h.relearn} poz. umiejętności`, '#2a7a1a']);
  rowsL.forEach(([k, v, c], i) => L(k, v, y + 30 + i * 26, c));
  const rx = x + half + 24; text(ctx, 'Umiejętności i specjalizacje', rx, y, { size: 17, fam: 'title', color: '#5a2a08' });
  if (!h.skills.length) text(ctx, 'Jeszcze żadnej: pierwszą bohater wybierze przy awansie.', rx, y + 30, { size: 13, italic: true, color: '#6a4418' });
  h.skills.forEach((s, i) => {
    const yy = y + 18 + i * 40, F = s.fork && FORK[s.fork], forks = SKILL_FORKS[s.id];
    skillIcon(ctx, s.id, rx + 14, yy + 16, 28);
    text(ctx, `${SKILLS[s.id].name} · ${lvName(s.lv)}`, rx + 34, yy + 12, { size: 14, weight: 700, color: '#2a1606', max: half - 40 });
    const sub = F ? `specjalizacja: ${F.name}` : forks ? (s.lv >= 3 ? `do wyboru: ${forks.map(f => f.name).join(' albo ')} (kliknij umiejętność)` : `na poziomie eksperckim: ${forks.map(f => f.name).join(' albo ')}`) : '';
    text(ctx, sub, rx + 34, yy + 29, { size: 12, italic: true, color: F ? '#2a5a1a' : s.lv >= 3 && forks ? '#8a3a1a' : '#6a4418', max: half - 40 });
    rows.push({ x: rx, y: yy, w: half, h: 38, info: `${skillText(s.id, s.lv, s.fork)}.${synHint(h, s.id)}` });
  });
}
// Zakładki Sploty i Klasy prestiżowe: dwie kolumny wierszy z parą ikon, nazwą i stanem; klik = cel
function drawPlanPairs(ctx, h, ids, x, y, w, H, rows, kind) {
  const cols = 2, per = Math.ceil(ids.length / cols), rh = Math.min(kind === 'pre' ? 62 : 40, Math.floor(H / per)), cw = (w - 16) / cols, need = kind === 'pre' ? PRESTIGE_LV : SYN_LV;
  ids.forEach((id, i) => {
    const D = kind === 'pre' ? PRESTIGE[id] : SYNERGIES[id], cx = x + Math.floor(i / per) * (cw + 16), cy = y + (i % per) * rh, goal = `${kind}:${id}`;
    const n = pairState(h, D.req, need), taken = kind === 'pre' && h.mastery === id, on = kind === 'syn' ? synergy(h, id) : n === 2;
    const isGoal = h.goal === goal, col = taken || (kind === 'syn' && on) ? '#2a7a1a' : n === 2 ? '#2a6a8a' : n === 1 ? '#a0661a' : '#8a7a62';
    ctx.save(); ctx.fillStyle = isGoal ? 'rgba(220,170,60,.32)' : on || taken ? 'rgba(80,140,60,.14)' : 'rgba(90,55,20,.06)'; rr(ctx, cx, cy + 1, cw, rh - 3, 5); ctx.fill(); ctx.restore();
    D.req.forEach((sk, k) => { ctx.save(); if (heroSkill(h, sk) < need) ctx.globalAlpha = 0.45; skillIcon(ctx, sk, cx + 14 + k * 24, cy + rh / 2, 22); ctx.restore(); });
    const name = (isGoal ? '★ ' : '') + (kind === 'pre' ? HERO_PATHS[id].name : D.name);
    text(ctx, name, cx + 62, cy + (kind === 'pre' ? 17 : 15), { size: 14, weight: 700, color: '#2a1606', max: cw - 70 });
    const status = kind === 'pre' ? (taken ? 'wybrana' : n === 2 ? (h.mastery ? 'wymagania spełnione (ścieżka już wybrana)' : `gotowa: do wyboru na ${PATH_LEVELS[0]}. poziomie`) : pairText(h, D.req, need))
      : (on ? 'działa' : pairText(h, D.req, need));
    text(ctx, status, cx + 62, cy + (kind === 'pre' ? 33 : 31), { size: 11, weight: 600, italic: !on && !taken, color: col, max: cw - 70 });
    if (kind === 'pre') text(ctx, `Raz na bitwę: ${ORDERS[D.ability].name}`, cx + 62, cy + 49, { size: 11, weight: 500, color: '#6a4418', max: cw - 70 });
    const info = kind === 'pre' ? `${pathText(id, 1)}. Legenda (${PATH_LEVELS[1]}. poziom): ${pathText(id, 2)}. Wymaga: ${D.req.map(s => SKILLS[s].name).join(' + ')} (obie co najmniej na poziomie zaawansowanym).`
      : `${synText(id)}. Wymaga: ${D.req.map(s => SKILLS[s].name).join(' + ')} (obie co najmniej na poziomie zaawansowanym).`;
    rows.push({ x: cx, y: cy, w: cw, h: rh - 2, goal, info });
  });
}
// Ołtarz przemiany: trzy przemiany za złoto (koszty w ALTAR_COST); po każdej planer wraca z komunikatem
function showAltar(h) {
  const st = G.state, gold = playerOf(st, h.owner).resources.gold, back = m => showDevPlanner(h, 'progress', m);
  const cf = altarCost(h, 'forks'), cp = altarCost(h, 'points'), np = Object.values(h.ptLog || {}).reduce((a, b) => a + b, 0);
  showChoice(`Ołtarz przemiany w gildii magów. Masz ${gold} złota. Przemiana jest na zawsze – wybieraj rozważnie.`, [
    { label: 'Nowe specjalizacje', sub: cf ? `${cf} złota` : 'brak specjalizacji', disabled: !cf || gold < cf, key: '1', lead: (ctx, cx, cy) => iconStat(ctx, 'sp', cx, cy, '#6a4418'),
      tip: `Wszystkie wybrane specjalizacje (${h.skills.filter(s => s.fork).length}) znikają; wybierzesz je od nowa, klikając świecące umiejętności na ekranie bohatera.`,
      action: () => back(altar(st, h, 'forks') || 'Specjalizacje zapomniane: kliknij świecące umiejętności, aby wybrać nowe.') },
    { label: 'Punkty cech od nowa', sub: cp ? `${cp} złota` : 'brak punktów', disabled: !cp || gold < cp, key: '2', lead: (ctx, cx, cy) => iconStat(ctx, 'att', cx, cy, '#6a4418'),
      tip: `Wolne punkty cech wydane dotąd (${np}) wracają do rozdania: kliknij cechę na ekranie bohatera.`,
      action: () => back(altar(st, h, 'points') || 'Punkty cech wróciły: rozdaj je na ekranie bohatera.') },
    { label: 'Zapomnij umiejętność', sub: h.skills.length ? `${ALTAR_COST.skill} złota za poziom` : 'brak umiejętności', disabled: !h.skills.length, key: '3', lead: (ctx, cx, cy) => iconStat(ctx, 'kn', cx, cy, '#6a4418'),
      tip: 'Wybrana umiejętność znika razem ze specjalizacją; jej poziomy rozdasz od nowa, klikając wolne pole umiejętności na ekranie bohatera.',
      action: () => showChoice(`Którą umiejętność ${h.name} ma zapomnieć?`, [...h.skills.map((s, k) => ({ label: SKILLS[s.id].name, sub: `${lvName(s.lv)} · ${altarCost(h, 'skill', s.id)} złota`, disabled: gold < altarCost(h, 'skill', s.id),
        tip: `${skillText(s.id, s.lv, s.fork)}.`, key: k < 9 ? String(k + 1) : null, lead: (ctx, cx, cy) => skillIcon(ctx, s.id, cx, cy),
        action: () => back(altar(st, h, 'skill', s.id) || `${SKILLS[s.id].name} zapomniana: wybierz ${h.relearn === 1 ? 'nowy poziom' : `${h.relearn} nowe poziomy`} na ekranie bohatera.`) })),
        { label: 'Anuluj', sub: 'nic nie zmieniaj', tip: 'Wróć do planera.', key: 'escape', action: () => back('') }]) },
    { label: 'Anuluj', sub: 'nic nie zmieniaj', tip: 'Wróć do planera.', key: 'escape', action: () => back('') },
  ]);
}
// Wybór w miejsce zapomnianej umiejętności (ekran bohatera: klik w wolne pole umiejętności, gdy h.relearn > 0)
function offerRelearn(h, done) {
  const st = G.state, offer = relearnOffer(st, h); if (!offer.length) { h.relearn = 0; return done && done(); }
  showChoice(`${h.name}: wybierz umiejętność w miejsce zapomnianej (zostało ${h.relearn}).`, offer.map((id, k) => skillChoiceOpt(h, id, k, () => { relearn(h, id); if (done) done(); })));
}
