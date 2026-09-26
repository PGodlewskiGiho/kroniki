// ==================== EKRAN: BITWA =====================================================
// Rysuje bitwę i obsługuje ruchy gracza. Logika jest w BITWA: ZASADY; ekran odtwarza efekty z B.fx.
const HEX = { w: 54, h: 62, row: 46, x0: 36, y0: 52 };
const hexCenter = (x, y) => [HEX.x0 + x * HEX.w + (y & 1 ? HEX.w / 2 : 0) + HEX.w / 2, HEX.y0 + y * HEX.row + HEX.h / 2];
function hexPath(ctx, x, y, inset = 0) {
  const [cx, cy] = hexCenter(x, y), r = HEX.h / 2 - inset, rx = HEX.w / 2 - inset; ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(cx + Math.cos(a) * rx / Math.cos(Math.PI / 6), cy + Math.sin(a) * r); }
  ctx.closePath();
}
function hexAt(px, py) {
  let best = null;
  for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) { const [cx, cy] = hexCenter(x, y), d = (cx - px) ** 2 + (cy - py) ** 2; if (!best || d < best.d) best = { x, y, d }; }
  return best && best.d < (HEX.w * 0.58) ** 2 ? best : null;
}
const PAVE_X = 572; // bruk dziedzińca od tej kolumny pikseli (px logiczne) w prawo
// Tło bitwy w stylu mapy: teren z palety TERRAINS, piksele 2×2, ta sama korekcja barw
function paintBattleBg(c, terr, fac) {
  const w = W / 2, h = H / 2, off = document.createElement('canvas'); off.width = w; off.height = h;
  const g = off.getContext('2d'), img = g.createImageData(w, h), P = TPAL[terr].map(gradeRgb), sky = [[40, 44, 62], [70, 72, 92]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4; let col;
    if (y < 22) col = sky[(y + (x & 1)) % 11 < 6 ? 0 : 1];
    else if (fac && x * 2 > PAVE_X + Math.round(vnoise2(0, y / 4, 3) * 6)) { // bruk dziedzińca za murem
      const pv = SIEGE_PAVE[fac] || SIEGE_PAVE.haven, row = Math.floor(y / 5), cx = x + (row % 2) * 4, edge = y % 5 === 0 || cx % 8 === 0, k = thash(Math.floor(cx / 8), row, 7) % 3;
      col = edge ? pv[1].map(v => v * 0.8) : k === 0 ? pv[1] : k === 1 ? pv[0] : pv[0].map((v, i) => (v + pv[1][i]) / 2);
    } else { const n = vnoise2(x / 9, y / 6, 17) * 0.7 + vnoise2(x / 3, y / 3, 5) * 0.3 + (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.18; col = P[n < 0.32 ? 0 : n < 0.62 ? 1 : n < 0.8 ? 2 : 3]; }
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); battleDecor(g, terr, w, h, fac); c.imageSmoothingEnabled = false; c.drawImage(off, 0, 0, W, H);
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1;
  for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) { hexPath(c, x, y, 1); c.stroke(); }
  stoneFill(c, 0, 490, W, 110); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, 38);
}
// Tło bitwy zależne od terenu (w połowie rozdzielczości, przed powiększeniem): horyzont pod paskiem u góry
// i drobne malowane szczegóły na polu (kępki, kamyki, kałuże, pęknięcia z żarem). Nie wpływają na walkę.
function battleDecor(g, terr, w, h, fac) {
  const r = mulberry32(9001 + terr * 131), P = TPAL[terr].map(c => `rgb(${gradeRgb(c).map(Math.round).join(',')})`), px = (x, y, c, k = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), k, k); };
  const maxX = fac ? PAVE_X / 2 - 8 : w;
  // horyzont: odległe wzgórza, las, wydmy, szczyty albo wulkany w kolorach terenu, zlewające się z polem
  const far = { [TER.GRASS]: '#2e4a2a', [TER.DIRT]: '#4a3a28', [TER.SAND]: '#8a7050', [TER.SNOW]: '#8a98b0', [TER.SWAMP]: '#2a3a2a', [TER.ROUGH]: '#4a4436', [TER.LAVA]: '#2a1614', [TER.WATER]: '#2a4a6a' }[terr] || '#3a3a3a';
  g.fillStyle = far; g.beginPath(); g.moveTo(0, 26);
  for (let x = 0; x <= w; x += 4) { const peak = terr === TER.SNOW || terr === TER.ROUGH || terr === TER.LAVA ? Math.abs(Math.sin(x * 0.045 + 1.3)) * 10 + Math.abs(Math.sin(x * 0.11)) * 4 : (terr === TER.GRASS || terr === TER.SWAMP) ? 4 + (thash(x >> 2, 3, terr) % 4) : Math.sin(x * 0.03) * 3 + 3; g.lineTo(x, 22 - peak); }
  g.lineTo(w, 26); g.closePath(); g.fill();
  if (terr === TER.LAVA) for (let x = 60; x < w; x += 150) { px(x, 10, '#ff7a2a', 2); px(x + 1, 8, '#ffd060'); }
  if (terr === TER.SNOW) for (let x = 0; x < w; x += 3) if (Math.abs(Math.sin(x * 0.045 + 1.3)) > 0.8) px(x, 22 - Math.abs(Math.sin(x * 0.045 + 1.3)) * 10 - Math.abs(Math.sin(x * 0.11)) * 4 + 1, '#f4f8fc', 2);
  // większe plamy (jaśniejsza trawa, piach, zaspy, muł, zastygła lawa), potem drobne szczegóły
  const patch = { [TER.GRASS]: '#4a7a34', [TER.DIRT]: P[0], [TER.SAND]: P[0], [TER.SNOW]: '#c8d2e0', [TER.SWAMP]: '#1e3a30', [TER.ROUGH]: P[0], [TER.LAVA]: '#3a1a14', [TER.WATER]: P[0] }[terr];
  g.fillStyle = patch;
  for (let k = 0; k < 14; k++) { // rozproszone w szachownicę, żeby wtapiały się w teren; środek gęstszy
    const x0 = Math.round(20 + r() * (maxX - 40)), y0 = Math.round(40 + r() * (h - 110)), rx = 8 + r() * 12, ry = 3 + r() * 4;
    for (let y = -Math.ceil(ry); y <= ry; y++) for (let x = -Math.ceil(rx); x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d <= 1 && (d < 0.35 || ((x0 + x + y0 + y) & 1))) g.fillRect(x0 + x, y0 + y, 1, 1); }
  }
  const tuft = (x, y, a, b) => { px(x, y - 2, a); px(x + 1, y - 3, b); px(x + 1, y - 2, b); px(x + 2, y - 4, b); px(x + 3, y - 3, a); px(x + 3, y - 2, a); px(x + 4, y - 2, b); };
  const stone = (x, y, pal) => { g.fillStyle = pal[1]; g.fillRect(Math.round(x), Math.round(y) - 2, 4, 3); px(x, y - 2, pal[0], 2); px(x + 3, y, pal[2]); };
  for (let k = 0; k < 120; k++) {
    const x = 8 + r() * (maxX - 16), y = 34 + r() * (h - 96), v = r();
    switch (terr) {
      case TER.GRASS: if (v < 0.5) tuft(x, y, '#2e5a24', '#6aa844'); else if (v < 0.8) { const c = ['#e8d040', '#f4f0e8', '#d8503a', '#9a70d0'][k % 4]; px(x, y, c, 2); px(x + 3, y + 1, c); } else stone(x, y, ['#b0aca0', '#86847a', '#5a5850']); break;
      case TER.DIRT: case TER.ROUGH: if (v < 0.45) stone(x, y, ['#a89880', '#7a6a58', '#4a3e32']); else if (v < 0.75) { for (let i = 0; i < 7; i++) px(x + i, y + (i % 3 === 1 ? 1 : 0), P[3]); } else tuft(x, y, '#6a6030', '#a89a50'); break;
      case TER.SAND: if (v < 0.6) { for (let i = 0; i < 10; i++) px(x + i, y + Math.round(Math.sin(i * 0.7) * 1.2), P[2]); } else if (v < 0.72) { px(x, y, '#eee6d0', 4); px(x + 4, y + 1, '#eee6d0', 2); } else if (v < 0.8) { g.fillStyle = '#4a8a3a'; g.fillRect(Math.round(x), Math.round(y) - 6, 2, 7); g.fillRect(Math.round(x) - 2, Math.round(y) - 4, 2, 1); g.fillRect(Math.round(x) - 2, Math.round(y) - 5, 1, 2); } else stone(x, y, ['#e0c898', '#b09060', '#7a5a38']); break;
      case TER.SNOW: if (v < 0.5) { for (let i = 0; i < 12; i++) px(x + i, y + (i > 2 && i < 9 ? 0 : 1), '#a0b0c8'); for (let i = 3; i < 9; i++) px(x + i, y - 1, '#ffffff'); } else if (v < 0.75) stone(x, y, ['#e8eef4', '#a0acba', '#6a7686']); else px(x, y, '#ffffff', 2); break;
      case TER.SWAMP: if (v < 0.3) { g.fillStyle = '#16302c'; g.beginPath(); g.ellipse(Math.round(x), Math.round(y), 7, 3, 0, 0, TAU); g.fill(); px(x - 4, y - 1, '#4a8a7a', 2); } else if (v < 0.65) { for (let i = 0; i < 3; i++) { g.fillStyle = '#5a7a2a'; g.fillRect(Math.round(x + i * 2), Math.round(y) - 6, 1, 6); } px(x + 2, y - 8, '#6a4a26', 1); px(x + 2, y - 7, '#6a4a26'); } else if (v < 0.8) px(x, y, '#c83a2a', 2); else tuft(x, y, '#2a4a24', '#5a7a34'); break;
      case TER.LAVA: if (v < 0.45) { let cx = x, cy = y; for (let i = 0; i < 10; i++) { px(cx, cy, i % 3 ? '#e0601a' : '#ffb040'); cx += 1; cy += r() < 0.5 ? 1 : -1; } } else stone(x, y, ['#5a4a42', '#3a2e2a', '#1e1714']); break;
      case TER.WATER: if (v < 0.6) for (let i = 0; i < 5; i++) px(x + i, y - (i > 0 && i < 4 ? 1 : 0), '#8cb6da'); break;
    }
  }
}
// Szacunek obrażeń do podglądu ataku: [min, max] i ilu zginie
function estimateStrike(B, a, t, ranged, moved = 0) {
  const saved = B.rng; const out = [];
  for (const r of [0, 0.9999]) { B.rng = () => r; out.push(damageRoll(B, a, t, ranged, moved)); }
  B.rng = saved; const hp = CREATURES[t.cid].hp, pool = (t.n - 1) * hp + t.hp;
  const kills = d => (d >= pool ? t.n : t.n - Math.ceil((pool - d) / hp));
  return { min: out[0], max: out[1], kmin: kills(out[0]), kmax: kills(out[1]) };
}
G.screens.battle = {
  fps() { return this.phase === 'input' && !this.play && !this.floats.length ? 24 : 60; }, // czekając na rozkaz wystarczy spokojna animacja
  // Szersze okno: pole walki ciągnie się na boki (lustrzane odbicie brzegów tła, lekko przyciemnione)
  backdrop(ctx) { // gotowy obraz na dany rozmiar okna i teren (kamień, odbite brzegi pola, przyciemnienie): jedna warstwa zamiast pięciu
    const f = this.B && this.B.walls ? this.B.sides[1].town.faction : '';
    drawLayer(ctx, Layers.get(`battleBack_${VW}x${VH}_${this.terr}_${f}`, VW, VH, c => {
      const bg = this.bg(), k = bg.width / W, sw = Math.min(OX, W);
      stoneFill(c, 0, 0, VW, VH);
      if (sw > 0) {
        c.save(); c.translate(OX, OY); c.scale(-1, 1); c.drawImage(bg, 0, 0, sw * k, bg.height, 0, 0, sw, H); c.restore();
        c.save(); c.translate(OX + W, OY); c.scale(-1, 1); c.drawImage(bg, (W - sw) * k, 0, sw * k, bg.height, -sw, 0, sw, H); c.restore();
      }
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, VW, VH);
    }), 0, 0);
  },
  bg() { const f = this.B && this.B.walls ? this.B.sides[1].town.faction : ''; return Layers.get(`battleBg_${this.terr}_${f}`, W, H, c => paintBattleBg(c, this.terr, f)); },
  buttons: [], B: null, phase: 'play', play: null, floats: [], preview: null, reach: null,
  enter(p) {
    const B = this.B = p.battle; B.fx = []; this.play = null; this.onDone = p.onDone || null;
    this.me = B.sides[0].owner === ME ? 0 : 1; // strona gracza: 0 gdy atakuje, 1 gdy się broni this.floats = []; this.preview = null; this.timer = 0;
    this.terr = B.st.map.terrain[B.h.y * B.st.map.n + B.h.x] || TER.GRASS;
    for (const u of B.units) { [u.px, u.py] = hexCenter(u.x, u.y); u.anim = null; u.dieT = null; u.flashT = null; }
    BattleFX.reset(); this.intro = { t: 0, dur: 0.9 };
    // przygotowanie klatek animacji z góry (żeby pierwszy ruch nie przycinał)
    for (const u of B.units) { const d = u.side === 0 ? 1 : -1; for (const [pose, n] of Object.entries(BATTLE_FRAMES)) for (let i = 0; i < n; i++) battleSprite(u.cid, d, pose, i); }
    const bx = 470, mk = (i, j, label, act, o) => new Button(bx + i * 108, 500 + j * 46, 100, 38, label, act, Object.assign({ size: 15 }, o));
    this.bWait = mk(0, 0, 'Czekaj', () => this.player(u => actWait(B, u)), { key: 'w', tip: 'Oddział ruszy na końcu tej rundy (klawisz W).' });
    this.bDef = mk(1, 0, 'Obrona', () => this.player(u => actDefend(B, u)), { key: 'd', tip: 'Oddział broni się: wyższa obrona do jego następnego ruchu (klawisz D).' });
    this.bAuto = mk(0, 1, 'Auto', () => { B.auto = !B.auto; if (B.auto && this.phase === 'input') this.startTurnFor(B.active); }, { key: 'a', selected: () => B.auto, tip: 'Walka automatyczna: twoje oddziały dowodzą się same (klawisz A).' });
    this.bFlee = mk(1, 1, 'Ucieczka', () => this.onBack(), { key: 'u', tip: 'Wycofanie się z bitwy: ocalałe oddziały zostają, ale bohater traci resztę ruchu na dziś (klawisz U).' });
    this.bCast = mk(2, 0, 'Czar', () => this.openBook(), { key: 'c', tip: 'Księga czarów bohatera: jeden czar na rundę, przed ruchem oddziału (klawisz C).' });
    this.bInfo = mk(2, 1, 'Mana', null, { disabled: true, tip: 'Mana bohatera. Odnawia się o 1 dziennie, a w pełni w mieście z gildią magów.' });
    this.casting = null; this.resume = false;
    this.fleeTip = this.bFlee.tip;
    if (this.me === 1) { this.bFlee.disabled = true; this.bFlee.tip = 'Obrońca nie może uciec z pola bitwy.'; }
    this.buttons = [this.bWait, this.bDef, this.bAuto, this.bFlee, this.bCast, this.bInfo];
    this.phase = 'intro';
  },
  onBack() {
    if (this.casting) { this.casting = null; this.preview = null; return; } // Esc anuluje wybór celu czaru
    if (this.phase !== 'input' && !this.B.auto || this.me === 1) return;
    showDialog('Wycofać się z bitwy? Ocalałe oddziały zostaną z bohaterem, ale na dziś koniec marszu.', [{ label: 'Uciekaj', key: 'enter', action: () => this.finish(true) }, { label: 'Walcz dalej', key: 'escape' }]);
  },
  nextTurn() {
    const B = this.B, u = nextActive(B); this.preview = null;
    if (!u) { this.phase = 'over'; this.timer = 0.6; return; }
    this.startTurnFor(u);
  },
  startTurnFor(u) {
    const B = this.B; this.casting = null;
    const mach = isMachine(u) && humanSide(B, u.side) && !B.auto; // machiny gracza działają same
    const ai = mach || B.auto || !humanSide(B, u.side);
    if (ai && !mach && aiHeroCast(B)) { this.phase = 'play'; this.resume = true; return; } // najpierw czar bohatera (swojego albo wroga)
    if (ai) { this.phase = 'ai'; this.timer = B.auto ? 0.2 : 0.4; return; }
    this.phase = 'input'; this.reach = battleDist(B, u, unitSpd(u));
    if (this.me !== u.side) { this.me = u.side; this.bFlee.disabled = u.side === 1; this.bFlee.tip = u.side ? 'Obrońca nie może uciec z pola bitwy.' : this.fleeTip; } // hot-seat: dowodzą na zmianę dwaj ludzie
    this.bWait.disabled = u.waited; this.onPointerMove(G.mouse.x, G.mouse.y);
  },
  player(fn) { if (this.phase !== 'input') return; this.casting = null; fn(this.B.active); this.phase = 'play'; },
  openBook() {
    if (this.phase !== 'input') return; const B = this.B;
    const mh = sideHero(B, this.me); if (!mh) return;
    if (B.cast[this.me]) { B.log.push('W tej rundzie bohater już rzucił czar.'); return; }
    showSpellbook(mh, 'battle', id => { this.casting = id; this.onPointerMove(G.mouse.x, G.mouse.y); });
  },
  finish(fled) {
    const B = this.B, st = B.st, h = B.h, res = resolveBattle(B, fled);
    if (this.onDone) { const f = this.onDone; this.onDone = null; f(res); } // bitwa obronna: wynik wraca do tury przeciwnika
    else G.go('adventure', { after: () => showBattleResult(st, h, res) });
    this.phase = 'done';
  },
  update(dt) {
    const B = this.B; if (!B || this.phase === 'done') return;
    BattleFX.update(dt); this.floats = this.floats.filter(f => G.time - f.t < 1.2);
    if (this.phase === 'intro') { this.intro.t += dt; if (this.intro.t >= this.intro.dur) this.nextTurn(); return; }
    if (this.play) { this.play.t += dt; this.stepPlay(); return; }
    if (B.fx.length) { this.startPlay(B.fx.shift()); return; }
    if (this.phase === 'play') {
      if (this.resume) { this.resume = false; if (fighters(B, 0).length && fighters(B, 1).length && !B.active.dead) { this.startTurnFor(B.active); return; } }
      this.nextTurn(); return;
    }
    if (this.phase === 'ai') { this.timer -= dt; if (this.timer <= 0) { aiAct(B, B.active); this.phase = 'play'; } return; }
    if (this.phase === 'over') { this.timer -= dt; if (this.timer <= 0) this.finish(false); }
  },
  // Czasy efektów (w sekundach); walka automatyczna odtwarza się szybciej
  startPlay(fx) {
    const sp = this.B.auto ? 0.55 : 1, S = fx.kind === 'spell' ? SPELL_FX[fx.id] || {} : null;
    const dur = fx.kind === 'move' ? (fx.fly ? 0.35 + 0.07 * hexDistance({ x: fx.path[0][0], y: fx.path[0][1] }, { x: fx.u.x, y: fx.u.y }) : 0.17 * (fx.path.length - 1))
      : fx.kind === 'hit' ? (fx.a ? 0.62 : 0.3) : fx.kind === 'shot' || fx.kind === 'siege' ? 0.95 : fx.kind === 'heal' ? 0.55 : fx.kind === 'spell' ? (S.proj || S.meteor ? 0.85 : S.strike ? 0.55 : 0.7) : 0.4;
    this.play = { ...fx, t: 0, dur: dur * sp, landed: false, launched: false, sp };
    const now = G.time;
    if (fx.kind === 'move') fx.u.anim = { pose: 'walk', t0: now, dur: this.play.dur };
    if (fx.kind === 'hit' && fx.a) { fx.a.anim = { pose: 'attack', t0: now, dur: this.play.dur }; }
    if (fx.kind === 'shot' || fx.kind === 'siege') fx.a.anim = { pose: 'attack', t0: now, dur: 0.55 * sp };
  },
  // Trafienie: błysk, odrzut, iskry, liczba obrażeń; zabity oddział przewraca się
  impact(tg, dmg, killed, col = '#ffe8a0') {
    const now = G.time, [tx, ty] = [tg.px, tg.py];
    tg.flashT = now; tg.anim = { pose: 'hurt', t0: now, dur: 0.28 }; BattleFX.glow(tx, ty - 10, 26, col, 0.25);
    BattleFX.emit(tx, ty - 8, { n: 10 + Math.min(20, Math.round(dmg / 8)), col: [col, '#ffffff', hasAb(tg, 'undead') ? '#e8e2cc' : '#b8302a'], spd: 110, up: -40, g: 260, life: 0.55, size: 3 });
    this.floats.push({ x: tx, y: ty - 44, text: `-${dmg}`, t: now, big: dmg >= 50 });
    if (killed) { this.floats.push({ x: tx, y: ty - 26, text: `†${killed}`, t: now + 0.05, col: '#e8e0cc', small: true }); BattleFX.shake = Math.max(BattleFX.shake, 2 + Math.min(4, killed)); }
    if (tg.dead && tg.dieT == null) { tg.dieT = now + 0.15; BattleFX.emit(tx, ty + 10, { n: 16, col: ['#8a7a6a', '#5a4e44'], spd: 50, up: -20, life: 0.8, size: 4, drag: 2, jx: 20 }); }
  },
  stepPlay() {
    const p = this.play, f = clamp(p.t / p.dur, 0, 1);
    if (p.kind === 'move') {
      const u = p.u;
      if (p.fly) { const [ax, ay] = hexCenter(...p.path[0]), [bx, by] = hexCenter(u.x, u.y), k = ease(f); u.px = lerp(ax, bx, k); u.py = lerp(ay, by, k); u.lift = Math.sin(f * Math.PI) * 30; }
      else { const seg = f * (p.path.length - 1), i = Math.min(p.path.length - 2, Math.floor(seg)), k = seg - i; const [ax, ay] = hexCenter(...p.path[i]), [bx, by] = hexCenter(...p.path[i + 1]); u.px = ax + (bx - ax) * k; u.py = ay + (by - ay) * k; }
      if (Math.random() < 0.35 && !p.fly) BattleFX.emit(u.px, u.py + 14, { n: 1, col: '#9a8a70', spd: 20, up: -15, life: 0.4, size: 3, drag: 2 });
    } else if (p.kind === 'hit') {
      if (!p.landed && f >= (p.a ? 0.5 : 0)) { p.landed = true; this.impact(p.tg, p.dmg, p.killed); }
    } else if (p.kind === 'shot') {
      const LK = CREATURES[p.a.cid].look, orb = LK.weapon === 'staff' || !!LK.orb, col = LK.orb || '#c8e0ff'; // kula: laska albo własny pocisk (kamień gremlina, piorun tytana)
      if (!p.launched && f >= 0.42) {
        p.launched = true; const dist = Math.hypot(p.tg.px - p.a.px, p.tg.py - p.a.py);
        p.pr = BattleFX.proj(orb ? 'orb' : 'arrow', p.a.px + (p.tg.px > p.a.px ? 14 : -14), p.a.py - 18, p.tg.px, p.tg.py - 16, (0.12 + dist / 900) * p.sp, col, orb ? 8 : 26 + dist * 0.04);
        p.hitAt = p.t + p.pr.dur;
      }
      if (p.launched && !p.landed && p.t >= p.hitAt) { p.landed = true; this.impact(p.tg, p.dmg, p.killed, orb ? col : '#ffe8a0'); if (orb) BattleFX.emit(p.tg.px, p.tg.py - 16, { n: 14, col: [col, '#ffffff'], spd: 90, life: 0.4, size: 3, glow: true }); }
      if (p.hitAt) p.dur = Math.max(p.dur, p.hitAt + 0.15);
    } else if (p.kind === 'siege') { // głaz z katapulty w mur
      const [tx, ty] = hexCenter(p.x, p.y);
      if (!p.launched && f >= 0.4) { p.launched = true; p.pr = BattleFX.proj('rock', p.a.px, p.a.py - 26, tx + (p.hit ? 0 : 20), ty - 20, 0.5 * p.sp, '#8a847a', 90); p.hitAt = p.t + p.pr.dur; }
      if (p.launched && !p.landed && p.t >= p.hitAt) {
        p.landed = true; BattleFX.emit(tx, ty - 16, { n: p.broken ? 40 : 18, col: ['#9a948a', '#6e6a62', '#c8c0b0'], spd: 120, up: -60, g: 300, life: 0.7, size: 4, jx: 20 });
        BattleFX.shake = Math.max(BattleFX.shake, p.broken ? 6 : 3); this.floats.push({ x: tx, y: ty - 50, text: p.hit ? (p.broken ? 'Wyłom!' : 'Trafienie!') : 'Pudło', t: G.time, col: '#e8e0cc', small: true });
      }
      if (p.hitAt) p.dur = Math.max(p.dur, p.hitAt + 0.2);
    } else if (p.kind === 'heal') {
      if (!p.landed) { p.landed = true; const u = p.u;
        if (p.label) this.floats.push({ x: u.px, y: u.py - 50, text: p.label, t: G.time, col: '#ffe08a', small: true });
        else { this.floats.push({ x: u.px, y: u.py - 44, text: `+${p.amount}`, t: G.time, col: '#8af07a' }); spellAura(u.px, u.py, { aura: 'rise', col: '#8af07a' }); } }
    } else if (p.kind === 'spell') {
      const S = SPELL_FX[p.id] || {}, [tx, ty] = hexCenter(p.x, p.y), aim = [tx, ty - 16];
      if (!p.launched) {
        p.launched = true; BattleFX.ring(24, 19, S.col || '#ffffff', 26, 0.5, 2);
        if (S.proj) { p.pr = BattleFX.proj(S.proj, 40, 34, aim[0], aim[1], 0.5 * p.sp, S.col, 40); p.hitAt = p.pr.dur; }
        else if (S.meteor) { for (let i = 0; i < 3; i++) p.pr = BattleFX.proj('fireball', tx - 140 + i * 50, -30 - i * 20, aim[0] + (i - 1) * 14, aim[1], (0.4 + i * 0.08) * p.sp, S.col); p.hitAt = p.pr.dur; }
        else if (S.strike) { BattleFX.bolt(tx + (Math.random() - 0.5) * 60, 0, aim[0], aim[1], S.col); BattleFX.bolt(tx + (Math.random() - 0.5) * 80, 0, aim[0], aim[1], S.col); p.hitAt = 0.05; }
        else { for (const [ax, ay] of p.area || spellArea(p.id, p.x, p.y, this.B)) { const [cx, cy] = hexCenter(ax, ay); spellAura(cx, cy, S); } p.hitAt = 0.3; }
      }
      if (!p.landed && p.t >= p.hitAt) {
        p.landed = true;
        if (S.burst) BattleFX.emit(aim[0], aim[1], { n: S.boom ? 60 : 24, col: [S.col, S.burst, '#ffffff'], spd: S.boom ? 170 : 110, life: S.boom ? 0.8 : 0.5, size: S.boom ? 4 : 3, glow: true, drag: 1.5 });
        BattleFX.glow(aim[0], aim[1], S.boom ? 110 : 55, S.col, S.boom ? 0.7 : 0.45);
        if (S.boom) { BattleFX.ring(tx, ty + 10, S.col, 90, 0.6, 6); BattleFX.emit(tx, ty, { n: 40, col: ['#ff8a2a', '#ffd060', '#ff5a1a'], dir: -Math.PI / 2, spread: 2.4, spd: 150, g: 120, life: 0.9, size: 4, glow: true, jx: 50, jy: 20 }); BattleFX.emit(tx, ty, { n: 24, col: ['#5a4e44', '#8a7a6a'], dir: -Math.PI / 2, spread: 1.2, spd: 60, life: 1.1, size: 5, drag: 1 }); }
        if (S.flash) BattleFX.flash = { col: S.col, a: S.flash }; if (S.shake) BattleFX.shake = S.shake;
      }
    }
    if (p.t >= p.dur) { if (p.kind === 'move') { [p.u.px, p.u.py] = hexCenter(p.u.x, p.u.y); p.u.lift = 0; p.u.anim = null; } this.play = null; }
  },
  // Klatka do narysowania: poza, sprite, przesunięcia
  unitLook(u) {
    const d = u.side === 0 ? 1 : -1, now = G.time, a = u.anim && now - u.anim.t0 < u.anim.dur ? u.anim : null;
    let pose = 'idle', i = Math.floor(now * 3.5 + u.id * 1.37) % BATTLE_FRAMES.idle, ox = 0;
    if (this.phase === 'intro' && u.cid !== 'arrowTower') { pose = 'walk'; i = Math.floor(now * 10) % BATTLE_FRAMES.walk; ox = -d * (1 - ease(clamp(this.intro.t / this.intro.dur, 0, 1))) * 110; }
    else if (a) {
      const f = clamp((now - a.t0) / a.dur, 0, 1); pose = a.pose;
      i = pose === 'walk' ? Math.floor(now * 10) % BATTLE_FRAMES.walk : pose === 'attack' ? Math.min(BATTLE_FRAMES.attack - 1, Math.floor(f * BATTLE_FRAMES.attack)) : 0;
      const p = this.play;
      if (pose === 'attack' && p && p.kind === 'hit' && p.a === u) ox = Math.sign(p.tg.px - u.px || d) * Math.sin(f * Math.PI) * 12;
      if (pose === 'hurt') ox = -d * Math.sin(f * Math.PI) * 5;
    }
    return { s: battleSprite(u.cid, d, pose, i), ox, flash: u.flashT != null && now - u.flashT < 0.14 };
  },
  onPointerMove(x, y) {
    const B = this.B; this.preview = null; if (this.phase !== 'input' || G.modal) return;
    const u = B.active, hx = hexAt(x, y); if (!hx) return;
    if (this.casting) {
      const id = this.casting, tu = spellUnitAt(B, id, hx.x, hx.y);
      this.preview = spellTargetOk(B, id, tu) ? { kind: 'cast', id, x: hx.x, y: hx.y, target: tu } : { kind: 'nocast', id }; return;
    }
    const occ = unitAt(B, hx.x, hx.y), k = hexKey(hx.x, hx.y);
    if (occ && occ.side !== u.side && targetable(occ)) {
      if (canShoot(B, u)) { this.preview = { kind: 'shoot', target: occ, est: estimateStrike(B, u, occ, true) }; return; }
      let best = null;
      for (const [nx, ny] of hexNeighbors(occ.x, occ.y)) {
        const own = nx === u.x && ny === u.y; if (!own && !this.reach.dist.has(hexKey(nx, ny))) continue;
        const [cx, cy] = hexCenter(nx, ny), md = (cx - x) ** 2 + (cy - y) ** 2; if (!best || md < best.md) best = { nx, ny, md };
      }
      this.preview = best ? { kind: 'attack', target: occ, from: [best.nx, best.ny], est: estimateStrike(B, u, occ, false, hexDistance(u, { x: best.nx, y: best.ny })) } : { kind: 'far', target: occ };
    } else if (!occ && this.reach.dist.has(k)) this.preview = { kind: 'move', to: [hx.x, hx.y] };
    else if (occ) this.preview = { kind: 'info', target: occ };
  },
  onClick(x, y) {
    if (clickButtons(this.buttons, x, y)) return;
    const B = this.B, p = this.preview; if (this.phase !== 'input' || !p) return;
    if (p.kind === 'cast') { this.casting = null; castBattle(B, p.id, p.x, p.y); this.phase = 'play'; this.resume = true; return; }
    if (p.kind === 'shoot') this.player(u => actShoot(B, u, p.target));
    else if (p.kind === 'attack') this.player(u => actMoveAttack(B, u, pathTo(this.reach, u, ...p.from), p.target));
    else if (p.kind === 'move') this.player(u => actMoveAttack(B, u, pathTo(this.reach, u, ...p.to), null));
  },
  rightInfo(x, y) {
    const hx = hexAt(x, y), u = hx && unitAt(this.B, hx.x, hx.y), w = hx && wallAt(this.B, hx.x, hx.y);
    if (w && !u) return w.hp <= 0 ? `${w.kind === 'gate' ? 'Rozbita brama' : 'Wyłom w murze'}: można tędy przejść.` : w.kind === 'gate' ? `Brama miasta (wytrzymałość ${w.hp}/${w.max}): przepuszcza tylko obrońców. Rozbija ją katapulta.` : `Mur miasta (wytrzymałość ${w.hp}/${w.max}). Strzały zza muru tracą połowę siły; katapulta robi wyłomy.`;
    if (!u) return null;
    const c = CREATURES[u.cid];
    const ab = abilText(c);
    return `${c.plural}: ${u.n} (${u.side === this.me ? 'twoi' : 'wrogowie'}). Życie pierwszego: ${u.hp}/${c.hp}. ${unitStats(c)}${c.shots ? `, strzały ${u.shots}` : ''}.${ab ? ` ${ab}.` : ''}${u.defending ? ' Broni się.' : ''} Morale ${signed(unitMorale(this.B, u))}, szczęście ${signed(unitLuck(this.B, u))}.${Object.keys(u.buffs).length ? ` Czary: ${Object.entries(u.buffs).map(([k, r]) => `${BUFF_NAMES[k]} (${r})`).join(', ')}.` : ''}`;
  },
  draw(ctx) {
    const B = this.B, st = B.st, u0 = B.active, col = ownerColor(st, B.h.owner);
    drawLayer(ctx, this.bg(), 0, 0);
    const sh = BattleFX.shake; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 490); ctx.clip(); if (sh > 0) ctx.translate((Math.random() - 0.5) * sh * 2, (Math.random() - 0.5) * sh * 2);
    if (this.phase === 'input' && this.casting) {
      const p = this.preview;
      if (p && p.kind === 'cast') { ctx.fillStyle = 'rgba(160,200,255,.3)'; for (const [ax, ay] of spellArea(p.id, p.x, p.y, B)) { hexPath(ctx, ax, ay, 2); ctx.fill(); } }
    } else if (this.phase === 'input' && u0) {
      ctx.fillStyle = 'rgba(255,240,200,.16)';
      for (const k of this.reach.dist.keys()) { hexPath(ctx, k % BCOLS, Math.floor(k / BCOLS), 2); ctx.fill(); }
      const p = this.preview;
      if (p && (p.kind === 'move' || p.kind === 'attack')) { const [mx, my] = p.to || p.from; ctx.fillStyle = 'rgba(255,217,112,.35)'; hexPath(ctx, mx, my, 2); ctx.fill(); }
      if (p && p.target) { ctx.strokeStyle = p.kind === 'info' ? '#c8d8f0' : p.kind === 'far' ? '#8a8078' : '#ff6a4a'; ctx.lineWidth = 2.5; hexPath(ctx, p.target.x, p.target.y, 3); ctx.stroke(); }
    }
    if (u0 && this.phase !== 'intro') {
      const pulse = 0.55 + 0.45 * Math.sin(G.time * 6); ctx.strokeStyle = `rgba(255,217,112,${0.35 * pulse})`; ctx.lineWidth = 2; hexPath(ctx, u0.x, u0.y, 2); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,90,${0.18 + 0.12 * pulse})`; ctx.beginPath(); ctx.ellipse(u0.px, u0.py + 14, 24, 9, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    // polegli leżą pod żywymi
    for (const u of B.units) if (u.dead && u.dieT != null && G.time - u.dieT > 0.45) drawSprite(ctx, corpseSprite(u.cid, u.side === 0 ? 1 : -1), u.px, u.py + 14, 1);
    // oddziały i przeszkody (od góry ekranu w dół, żeby niższe zasłaniały wyższe)
    const shown = B.units.filter(u => !u.dead || u.dieT == null || G.time - u.dieT <= 0.45);
    const obst = [...B.obst].map(([k, o]) => { const x = k % BCOLS, y = Math.floor(k / BCOLS), [px, py] = hexCenter(x, y); return { obst: o, px, py }; });
    if (B.walls) { const T = B.sides[1].town; drawSprite(ctx, castleSprite(T.faction, ownerColor(st, T.owner), B.walls), SIEGE_WX, 0, 1); } // mury pod oddziałami
    for (const u of [...shown, ...obst].sort((a, b) => a.py - b.py)) {
      if (u.obst) { drawSprite(ctx, obstacleSprite(u.obst.o, this.terr, u.obst.v), u.px, u.py + 6, 1.5); continue; }
      const L = this.unitLook(u), tp = u.cid === 'arrowTower' ? towerPost() : null, gx = tp ? SIEGE_WX + tp[0] : u.px + L.ox, gy = tp ? u.py + tp[1] : u.py + 14, lift = u.lift || 0, sz = CREATURES[u.cid].look.size || 1;
      if (u.cid !== 'arrowTower') { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gx, gy, 15 * sz, 5 * sz, 0, 0, TAU); ctx.fill(); }
      ctx.save();
      if (u.dead && u.dieT != null) { const f = clamp((G.time - u.dieT) / 0.45, 0, 1); ctx.translate(gx, gy); ctx.rotate(-(u.side === 0 ? 1 : -1) * ease(f) * Math.PI / 2 * 0.9); ctx.globalAlpha = 1 - f * 0.4; ctx.translate(-gx, -gy); }
      drawSprite(ctx, L.s, gx, gy - lift, 1);
      if (L.flash) { ctx.globalAlpha = 0.85; drawSprite(ctx, tintSprite(L.s, '#ffffff'), gx, gy - lift, 1); }
      ctx.restore();
    }
    for (const u of shown) if (!u.dead) { // liczebność nad wszystkim, także nad murami
      const bx = u.px + (u.side === 0 ? 8 : -34), by = u.py + 18, s = String(u.n);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx + 1, by + 1, 27, 15);
      ctx.fillStyle = u.side === 0 ? col : B.sides[1].owner >= 0 ? ownerColor(st, B.sides[1].owner) : '#5a5448'; ctx.fillRect(bx, by, 26, 14); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(bx, by, 26, 4);
      ctx.strokeStyle = '#e0b24a'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, 25, 13);
      text(ctx, s, bx + 13, by + 8, { size: 11, align: 'center', color: '#fff8e0', fam: 'body' });
      Object.keys(u.buffs).forEach((k, i) => { ctx.fillStyle = BAD_BUFFS.includes(k) ? '#b060e0' : '#ffe08a'; ctx.fillRect(bx + i * 6, by - 6, 4, 4); });
    }
    BattleFX.draw(ctx);
    for (const f of this.floats) {
      const k = clamp((G.time - f.t) / 1.2, 0, 1); if (k <= 0) continue; const pop = k < 0.12 ? 1 + (0.12 - k) * 4 : 1;
      ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.font = font(Math.round((f.small ? 14 : f.big ? 24 : 19) * pop), 700, 'title'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = f.y - ease(k) * 28; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,5,.85)'; ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.col || '#ff7a5a'; ctx.fillText(f.text, f.x, y); ctx.restore();
    }
    ctx.restore(); // koniec wstrząsu
    BattleFX.drawFlash(ctx);
    // pasek górny
    drawHeroPortrait(ctx, 6, 1, B.h, col); text(ctx, heroTitle(B.h), 50, 19, { size: 15, color: '#ecd9a8', fam: 'title' });
    text(ctx, `Runda ${B.round}`, W / 2, 19, { size: 16, align: 'center', color: '#f0e4c0', fam: 'title' });
    const D = B.sides[1], foeCol = ownerColor(st, D.owner), right = D.hero ? W - 50 : W - 12;
    if (D.hero) drawHeroPortrait(ctx, W - 44, 1, D.hero, foeCol);
    text(ctx, D.monster ? `${CREATURES[D.monster.cid].plural} (neutralni)` : D.bank ? `${BANKS[D.bank.kind].name} (załoga)` : D.hero ? heroTitle(D.hero) : `Garnizon: ${D.town.name}`, right, 19, { size: 15, align: 'right', color: '#ecd9a8', fam: 'title' });
    // panel dolny: podpowiedź i dziennik
    const pv = this.preview, cu = u0 && CREATURES[u0.cid];
    let tip = this.phase === 'input' && u0 ? `Ruch: ${cu.plural} (${u0.n}). Kliknij pole albo wroga.` : B.auto ? 'Walka automatyczna…' : u0 && !humanSide(B, u0.side) ? 'Ruch przeciwnika…' : '';
    if (this.casting) tip = pv && pv.kind === 'cast' ? `${SPELLS[pv.id].name}: ${SPELLS[pv.id].desc(heroStat(sideHero(B, this.me) || B.h, 'sp'))}. Kliknij, aby rzucić.` : `${SPELLS[this.casting].name}: wskaż właściwy cel (Esc anuluje).`;
    else if (pv && pv.est) tip = `${pv.kind === 'shoot' ? `Strzał (zostało ${u0.shots})` : 'Atak'}: ${pv.est.min}–${pv.est.max} obrażeń, zabitych ${pv.est.kmin === pv.est.kmax ? pv.est.kmin : `${pv.est.kmin}–${pv.est.kmax}`} (${CREATURES[pv.target.cid].plural.toLowerCase()}).`;
    else if (pv && pv.kind === 'far') tip = 'Ten oddział jest poza zasięgiem w tej turze.';
    let tfs = 15; ctx.font = font(tfs, 700, 'body'); while (tfs > 11 && ctx.measureText(tip).width > 440) { tfs--; ctx.font = font(tfs, 700, 'body'); }
    text(ctx, tip, 20, 508, { size: tfs, weight: 700, color: '#ffd970' });
    B.log.slice(-4).forEach((l, i) => text(ctx, l, 20, 532 + i * 18, { size: 13, weight: 500, color: 'rgba(236,217,168,.85)' }));
    this.bCast.disabled = this.phase !== 'input' || !canCastNow(B); this.bInfo.label = sideHero(B, this.me) ? `Mana ${sideHero(B, this.me).mana}` : 'Bez bohatera';
    this.buttons.forEach(b => b.draw(ctx));
  },
};
// Okno po bitwie (pokazywane już na mapie przygody)
function showBattleResult(st, h, res) {
  const lost = res.lost.length ? `Straty: ${res.lost.join(', ')}.` : 'Bez strat.';
  if (res.outcome === 'win') {
    const extra = (res.heroDefeated ? ` ${res.heroDefeated.name} zostaje ${res.heroDefeated.female ? 'pokonana' : 'pokonany'} i znika z mapy.` : '') + (res.captured ? ` Miasto ${res.captured} należy teraz do ciebie.` : '') + (res.bankText || '');
    showDialog(`Zwycięstwo!${extra} ${lost}${raisedText(res.raised)} Doświadczenie: +${res.exp}.`, [{ label: 'OK', key: 'enter', action: () => {
      advFloat(`+${res.exp} dośw.`, h.x, h.y);
      gainExp(st, h, res.exp, () => { const here = objectAt(st, h.y * st.map.n + h.x); if (here && here.type !== 'monster' && here.type !== 'bank') visitObject(st, h, here); });
    } }]);
  } else if (res.outcome === 'fled') showDialog(`${h.name} wycofuje się z pola bitwy. ${lost} Na dziś koniec marszu.`, [{ label: 'OK', key: 'enter' }]);
  else if (res.heroLost) showDialog(`Porażka. Armia została rozbita, a ${h.name} opuszcza twoją służbę: wszystkie bramy twoich miast są zajęte.`, [{ label: 'OK', key: 'enter' }]);
  else { showDialog(`Porażka. Armia została rozbita, a ${h.name} ledwie uchodzi z życiem${res.home ? ` do miasta ${res.home}` : ''}. Zwerbuj nowe wojsko, zanim ruszysz dalej.`, [{ label: 'OK', key: 'enter' }]); }
}

