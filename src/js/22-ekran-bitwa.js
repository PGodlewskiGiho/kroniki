// ==================== EKRAN: BITWA =====================================================
// Rysuje bitwę i obsługuje ruchy gracza. Logika jest w BITWA: ZASADY; ekran odtwarza efekty z B.fx.
const HEX = { w: 54, h: 62, row: 46, x0: 36, y0: 52 };
// Miejsce bohatera strony (x, y stóp, zwrot) i skala jego rysunku
const HERO_BATTLE_K = 0.9, heroSpot = side => side ? [W - 22, 122, -1] : [22, 122, 1];
const hexCenter = (x, y) => [HEX.x0 + x * HEX.w + (y & 1 ? HEX.w / 2 : 0) + HEX.w / 2, HEX.y0 + y * HEX.row + HEX.h / 2];
// Środek oddziału na ekranie: duży stwór stoi między przodem a zadem (pół heksu w stronę zadu)
const unitPos = (u, x = u.x, y = u.y) => { const [cx, cy] = hexCenter(x, y); return [cx + (isWide(u) ? tailDx(u) * HEX.w / 2 : 0), cy]; };
// Paszcza zionącego stwora (px logiczne) przy zwrocie d: z arkusza (m: punkt paszczy w klatce ataku, wypalony z modelu) albo szacunkowo
function mouthPos(u, d) {
  const A = unitArt(u.cid), L = CREATURES[u.cid].look, gy = u.py + 14 - (u.lift || 0);
  if (A && A.m) return [u.px + d * A.m[0] * A.u, gy + A.m[1] * A.u];
  const k = 32 * (L.size || 1); return [u.px + d * 0.9 * k, gy - 1.3 * k];
}
// Barwa zionięcia: z wyglądu stwora (kwas, lód, blask), domyślnie ogień
const breathColor = cid => { const L = CREATURES[cid].look; return L.breathCol || L.breath || (L.bony ? '#9af0c8' : '#ff7a1a'); };
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
const BATTLE_BG_NAMES = ['woda', 'trawa', 'ziemia', 'piasek', 'snieg', 'bagno', 'nierowny', 'lawa'];
function paintBattleBg(c, terr, fac, bare = false) { // bare: samo pole bez siatki i panelu (szkic dla tła malowanego, tools/tla-ai/szkic-bitwy.js)
  // D = gęstość pikseli: teren liczony w drobnych pikselach (fx, fy), wzory w dawnych pikselach (x, y = połowa px logicznych)
  const w = W / 2, h = H / 2, fw = Math.round(w * PXD), fh = Math.round(h * PXD), D = fw / w, off = document.createElement('canvas'); off.width = fw; off.height = fh;
  const g = off.getContext('2d'), img = g.createImageData(fw, fh), P = TPAL[terr].map(gradeRgb), sky = [[40, 44, 62], [70, 72, 92]];
  for (let fy = 0; fy < fh; fy++) for (let fx = 0; fx < fw; fx++) {
    const o = (fy * fw + fx) * 4, x = Math.floor(fx / D), y = Math.floor(fy / D), xs = fx / D, ys = fy / D; let col;
    if (y < 22) col = sky[(y + (x & 1)) % 11 < 6 ? 0 : 1];
    else if (fac && x * 2 > PAVE_X + Math.round(vnoise2(0, y / 4, 3) * 6)) { // bruk dziedzińca za murem
      const pv = SIEGE_PAVE[fac] || SIEGE_PAVE.haven, row = Math.floor(y / 5), cx = x + (row % 2) * 4, edge = y % 5 === 0 || cx % 8 === 0, k = thash(Math.floor(cx / 8), row, 7) % 3;
      col = edge ? pv[1].map(v => v * 0.8) : k === 0 ? pv[1] : k === 1 ? pv[0] : pv[0].map((v, i) => (v + pv[1][i]) / 2);
    } else { const n = vnoise2(xs / 9, ys / 6, 17) * 0.7 + vnoise2(xs / 3, ys / 3, 5) * 0.3 + (PIXEL_ART ? (BAYER4[(fy & 3) * 4 + (fx & 3)] / 16 - 0.5) * 0.18 : 0);
      if (PIXEL_ART) col = P[n < 0.32 ? 0 : n < 0.62 ? 1 : n < 0.8 ? 2 : 3]; else { const q = clamp((n - 0.2) / 0.7, 0, 1) * 3, i = Math.min(2, Math.floor(q)); col = shadeRgb(mixRgb(P[i], P[i + 1], q - i), 0.95 + vnoise2(xs / 1.3, ys / 1.3, 9) * 0.1); } } // gładko: płynne przejścia barw
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); g.setTransform(D, 0, 0, D, 0, 0); battleDecor(g, terr, w, h, fac); c.imageSmoothingEnabled = !PIXEL_ART; c.drawImage(off, 0, 0, W, H);
  const pim = !bare && !fac && BATTLE_BG_IMG[BATTLE_BG_NAMES[terr]]; // tło malowane przez AI (pole bitwy bez siatki); oblężenie: dawny rysunek z brukiem dziedzińca
  if (pim && pim._ok) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(pim, 0, 0, W, 490); }
  if (bare) return;
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1;
  for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) { hexPath(c, x, y, 1); c.stroke(); }
  if (PIXEL_ART) { stoneFill(c, 0, 490, W, 110); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, 38); return; }
  stoneFill(c, 0, 490, W, 110); insetBox(c, 10, 498, 456, 94, 11); // panel dowodzenia: drewno, wnęka na podpowiedź i dziennik
  const tg = c.createLinearGradient(0, 0, 0, 40); tg.addColorStop(0, 'rgba(10,6,3,.92)'); tg.addColorStop(1, 'rgba(10,6,3,.7)'); c.fillStyle = tg; c.fillRect(0, 0, W, 38); // pasek górny
  for (const y0 of [38, 487]) { const g = c.createLinearGradient(0, y0, 0, y0 + 3); g.addColorStop(0, '#f0d080'); g.addColorStop(1, '#6a4814'); c.fillStyle = g; c.fillRect(0, y0, W, 3); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, y0 + 3, W, 1); } // złote listwy
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
// --- dźwięki bitwy: rodzaj stwora decyduje o krokach, ciosie i odgłosie ---
const unitSound = cid => { const C = CREATURES[cid], k = C.look.kind, fly = (C.abil || []).includes('fly');
  return { fly, step: fly ? 'wings' : ['rider', 'centaur', 'unicorn'].includes(k) ? 'gallop' : ['dragon', 'hydra', 'treant', 'bull', 'tower'].includes(k) ? 'stomp' : ['wolf', 'lizard', 'insect', 'griffin', 'bird'].includes(k) ? 'paws' : 'march',
    voice: k === 'dragon' || k === 'hydra' ? 'roar' : ['wolf', 'bull', 'lizard', 'insect', 'griffin', 'eye', 'ghost'].includes(k) ? 'growl' : null, weapon: k === 'hum' || k === 'rider' || k === 'centaur' }; };
function battleSound(fx, sp) {
  if (fx.kind === 'move') { const S = unitSound(fx.u.cid), x = fx.u.px; if (S.fly) Sfx.play('wings', { vol: 0.7, pan: sfxPan(x) });
    else { const n = Math.min(6, fx.path.length - 1); for (let i = 0; i < n; i++) Sfx.play(S.step, { vol: 0.55, pan: sfxPan(x), delay: i * 0.17 * sp, gap: 0 }); } }
  else if (fx.kind === 'hit' && fx.a && !fx.splash) { const S = unitSound(fx.a.cid); if (hasAb(fx.a, 'breath')) Sfx.play('firebreath', { pan: sfxPan(fx.a.px) }); else if (S.voice) Sfx.play(S.voice, { vol: 0.7, pan: sfxPan(fx.a.px) }); if (S.weapon) Sfx.play('swing', { vol: 0.8, pan: sfxPan(fx.a.px), delay: 0.12 * sp }); }
  else if (fx.kind === 'shot') { const LK = CREATURES[fx.a.cid].look; Sfx.play(LK.weapon === 'staff' || LK.orb ? 'zap' : 'bow', { pan: sfxPan(fx.a.px), delay: 0.3 * sp }); }
  else if (fx.kind === 'siege') Sfx.play('catapult', { pan: sfxPan(fx.a.px), delay: 0.25 * sp });
  else if (fx.kind === 'spell') Sfx.play(SPELL_SND[fx.id] ? SPELL_SND[fx.id][0] : 'cast', { vol: 0.8 });
}
// Trafienie: cios bronią dzwoni, pazury i kły tępo uderzają, strzała wbija się; zabity oddział pada
function impactSound(p, tg) {
  const pan = sfxPan(tg.px), a = p && p.a, shot = p && p.kind === 'shot', S = a ? unitSound(a.cid) : null;
  Sfx.play(shot ? 'arrowhit' : S && S.weapon ? 'clash' : 'hit', { vol: 0.85, pan });
  if (tg.dead) Sfx.play('death', { vol: 0.8, pan, delay: 0.15 });
}
// Czar: [dźwięk rzucenia, dźwięk trafienia]
const SPELL_SND = { magicArrow: ['zap', 'zaphit'], lightningBolt: ['cast', 'thunder'], chainLightning: ['cast', 'thunder'], fireball: ['fireball', 'explode'], meteorShower: ['fireball', 'explode'], armageddon: ['cast', 'explode'],
  implosion: ['cast', 'explode'], iceBolt: ['cast', 'ice'], frostRing: ['cast', 'ice'], cure: ['cast', 'heal'], massCure: ['cast', 'heal'], resurrection: ['cast', 'heal'], animateDead: ['cast', 'curse'],
  curse: ['cast', 'curse'], weakness: ['cast', 'curse'], slow: ['cast', 'curse'], deathRipple: ['cast', 'curse'] };
const spellLandSound = (id, x) => Sfx.play(SPELL_SND[id] ? SPELL_SND[id][1] : 'buff', { vol: 0.9, pan: sfxPan(x) });
G.screens.battle = {
  fps: smoothFps, // płynnie także czekając na rozkaz (oddychające jednostki, płomienie)
  // Szersze okno: pole walki ciągnie się na boki (lustrzane odbicie brzegów tła, lekko przyciemnione)
  backdrop(ctx) { // gotowy obraz na dany rozmiar okna i teren (kamień, odbite brzegi pola, przyciemnienie): jedna warstwa zamiast pięciu
    const f = this.B && this.B.walls ? this.B.sides[1].town.faction : '';
    drawLayer(ctx, Layers.get(`battleBack_${VW}x${VH}_${this.terr}_${f}`, VW, VH, c => {
      const bg = this.bg(), k = bg.width / W, sw = Math.min(OX, W);
      stoneFill(c, 0, 0, VW, VH);
      if (sw > 0) {
        const fh = PIXEL_ART ? H : 490, sh = bg.height * fh / H; // gładko: odbijamy samo pole (bez panelu dowodzenia)
        c.save(); c.translate(OX, OY); c.scale(-1, 1); c.drawImage(bg, 0, 0, sw * k, sh, 0, 0, sw, fh); c.restore();
        c.save(); c.translate(OX + W, OY); c.scale(-1, 1); c.drawImage(bg, (W - sw) * k, 0, sw * k, sh, -sw, 0, sw, fh); c.restore();
      }
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, VW, VH);
      if (!PIXEL_ART) { const tg = c.createLinearGradient(0, OY, 0, OY + 40); tg.addColorStop(0, 'rgba(10,6,3,.92)'); tg.addColorStop(1, 'rgba(10,6,3,.7)'); c.fillStyle = tg; c.fillRect(0, OY, VW, 38);
        for (const y0 of [OY + 38, OY + 487]) { const g = c.createLinearGradient(0, y0, 0, y0 + 3); g.addColorStop(0, '#f0d080'); g.addColorStop(1, '#6a4814'); c.fillStyle = g; c.fillRect(0, y0, VW, 3); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, y0 + 3, VW, 1); } }
    }), 0, 0);
  },
  bg() { const f = this.B && this.B.walls ? this.B.sides[1].town.faction : ''; return Layers.get(`battleBg_${this.terr}_${f}`, W, H, c => paintBattleBg(c, this.terr, f)); },
  buttons: [], B: null, phase: 'play', play: null, floats: [], preview: null, reach: null,
  enter(p) {
    Sfx.play('battlestart', { vol: 0.8, jit: 0 });
    const B = this.B = p.battle; B.fx = []; this.play = null; this.onDone = p.onDone || null; this.net = p.net || null;
    this.me = B.sides[0].owner === ME ? 0 : 1; this.floats = []; this.preview = null; this.timer = 0; this.ending = null; // strona gracza: 0 gdy atakuje, 1 gdy się broni
    this.terr = B.st.map.terrain[B.h.y * B.st.map.n + B.h.x] || TER.GRASS;
    for (const u of B.units) { [u.px, u.py] = unitPos(u); u.anim = null; u.dieT = null; u.flashT = null; u.face = null; }
    BattleFX.reset(); this.intro = { t: 0, dur: 0.9 };
    // przygotowanie klatek animacji z góry (żeby pierwszy ruch nie przycinał)
    for (const u of B.units) for (const d of [1, -1]) for (const [pose, n] of Object.entries(BATTLE_FRAMES)) for (let i = 0; i < n; i++) battleSprite(u.cid, d, pose, i); // obie strony: oddziały się obracają
    const bx = 470, mk = (i, j, label, act, o) => new Button(bx + i * 108, 500 + j * 46, 100, 38, label, act, Object.assign({ size: 15 }, o));
    this.bWait = mk(0, 0, 'Czekaj', () => this.order({ a: 'wait' }), { key: 'w', tip: 'Oddział ruszy na końcu tej rundy (klawisz W).' });
    this.bDef = mk(1, 0, 'Obrona', () => this.order({ a: 'def' }), { key: 'd', tip: 'Oddział broni się: wyższa obrona do jego następnego ruchu (klawisz D).' });
    this.bAuto = mk(0, 1, 'Auto', () => { B.auto = !B.auto; if (B.auto && this.phase === 'input') this.startTurnFor(B.active); }, { key: 'a', selected: () => B.auto, tip: 'Walka automatyczna: twoje oddziały dowodzą się same (klawisz A).' });
    this.bFlee = mk(1, 1, 'Ucieczka', () => this.onBack(), { key: 'u', tip: 'Wycofanie się z bitwy: ocalałe oddziały zostają, ale bohater traci resztę ruchu na dziś (klawisz U).' });
    this.bCast = mk(2, 0, 'Czar', () => this.openBook(), { key: 'c', tip: 'Księga czarów bohatera: jeden czar na rundę, przed ruchem oddziału (klawisz C).' });
    this.bInfo = mk(2, 1, 'Mana', null, { disabled: true, display: true, tip: 'Mana bohatera. Odnawia się o 1 dziennie, a w pełni w mieście z gildią magów.' });
    this.casting = null; this.resume = false;
    this.fleeTip = this.bFlee.tip;
    if (this.me === 1) { this.bFlee.disabled = true; this.bFlee.tip = 'Obrońca nie może uciec z pola bitwy.'; }
    if (this.net) { this.bAuto.disabled = true; this.bAuto.tip = 'W bitwie online każdy dowodzi sam.'; }
    this.buttons = [this.bWait, this.bDef, this.bAuto, this.bFlee, this.bCast, this.bInfo];
    this.phase = 'intro';
  },
  onBack() {
    if (this.phase === 'over') return;
    if (this.casting) { this.casting = null; this.preview = null; return; } // Esc anuluje wybór celu czaru
    if (this.phase !== 'input' && !this.B.auto || this.me === 1) return;
    showDialog('Wycofać się z bitwy? Ocalałe oddziały zostaną z bohaterem, ale na dziś koniec marszu.', [{ label: 'Uciekaj', key: 'enter', action: () => (this.net ? this.order({ a: 'flee' }) : this.finish(true)) }, { label: 'Walcz dalej', key: 'escape' }]);
  },
  nextTurn() {
    const B = this.B, u = nextActive(B); this.preview = null;
    for (const v of B.units) v.face = null; // po akcji oddziały znów patrzą w stronę wroga
    if (!u) { this.startEnding(); return; }
    this.startTurnFor(u);
  },
  startTurnFor(u) {
    const B = this.B; this.casting = null; this.touchKey = null;
    const mach = isMachine(u) && humanSide(B, u.side) && !B.auto && !(machineControlled(B, u) && (u.cid !== 'firstAid' || firstAidTargets(B, u).length)); // machiny gracza działają same, chyba że bohater zna ich umiejętność
    const ai = mach || B.auto || !humanSide(B, u.side);
    if (ai && !mach && aiHeroCast(B)) { this.phase = 'play'; this.resume = true; return; } // najpierw czar bohatera (swojego albo wroga)
    if (ai) { this.phase = 'ai'; this.timer = B.auto ? 0.2 : 0.4; return; }
    if (this.net && B.sides[u.side].owner !== ME) { this.phase = 'remote'; this.reach = null; return; } // online: ruch przeciwnika-człowieka przyjdzie siecią
    this.phase = 'input'; this.reach = battleDist(B, u, unitSpd(u));
    if (this.me !== u.side) { this.me = u.side; this.bFlee.disabled = u.side === 1; this.bFlee.tip = u.side ? 'Obrońca nie może uciec z pola bitwy.' : this.fleeTip; } // hot-seat: dowodzą na zmianę dwaj ludzie
    this.bWait.disabled = u.waited; this.onPointerMove(G.mouse.x, G.mouse.y);
  },
  player(fn) { if (this.phase !== 'input') return; this.casting = null; fn(this.B.active); this.phase = 'play'; },
  // Rozkaz gracza jako dane (online wysyłany przeciwnikowi, który wykonuje go u siebie tak samo): a = rodzaj, t = cel, p = ścieżka
  order(c) {
    if (this.phase !== 'input') return; const B = this.B; c.u = B.units.indexOf(B.active); c.r = B.round;
    if (this.net) Net.send({ t: 'bcmd', c }, this.net.foe);
    this.applyOrder(c);
  },
  applyOrder(c) {
    const B = this.B, u = B.active, T = c.t != null ? B.units[c.t] : null;
    if (B.units.indexOf(u) !== c.u) console.warn('bitwa online: rozbieżność kolejki', c, B.units.indexOf(u));
    this.casting = null; this.preview = null; this.touchKey = null;
    if (c.a === 'cast') { castBattle(B, c.id, c.x, c.y); this.phase = 'play'; this.resume = true; return; }
    if (c.a === 'flee') { this.finish(true); return; }
    if (c.a === 'wait') actWait(B, u); else if (c.a === 'def') actDefend(B, u); else if (c.a === 'shoot') actShoot(B, u, T);
    else if (c.a === 'heal') actFirstAid(B, u, T); else actMoveAttack(B, u, c.p, T);
    this.phase = 'play';
  },
  openBook() {
    if (this.phase !== 'input') return; const B = this.B;
    const mh = sideHero(B, this.me); if (!mh) return;
    if (B.cast[this.me]) { B.log.push('W tej rundzie bohater już rzucił czar.'); return; }
    showSpellbook(mh, 'battle', id => { this.casting = id; this.onPointerMove(G.mouse.x, G.mouse.y); });
  },
  // Koniec bitwy: zwycięzcy wiwatują przez chwilę, potem okno wyniku nad polem bitwy (jak w Heroes 3). Klik albo klawisz przyspiesza.
  startEnding() {
    const B = this.B, winner = fighters(B, 0).length ? 0 : 1;
    this.phase = 'over'; this.preview = null; this.casting = null; this.ending = { t: 0, dur: 1.1, winner }; Sfx.play(winner === this.me ? 'victory' : 'defeat', { vol: 0.9, jit: 0 }); Music.stop(0.8);
  },
  finish(fled) {
    const B = this.B, st = B.st, h = B.h, res = resolveBattle(B, fled), f = this.onDone; this.onDone = null; this.phase = 'done';
    if (this.net && !this.net.lead) { showBattleReport(st, res, defenseReport(st, { h }, B.sides[1].hero, res), () => G.go('adventure')); return; } // online, obrońca: wynik u siebie, stan gry przyśle prowadzący
    if (this.net && f) { f(res); return; } // online: komputer zaatakował człowieka przy innym ekranie – wynik od razu wraca do tury komputera
    if (f) showBattleReport(st, res, defenseReport(st, { h }, B.sides[1].hero, res), () => { res.reported = true; f(res); }); // obrona: wynik wraca do tury przeciwnika
    else showBattleReport(st, res, attackReport(st, h, res), () => G.go('adventure', { after: () => battleAftermath(st, h, res) }));
  },
  update(dt) {
    const B = this.B; if (!B || this.phase === 'done') return;
    if (!G.hover && !G.modal && this.phase === 'input') G.wantCursor = battleCursor(this); // miecz, strzała, koń, skrzydło, czar
    BattleFX.update(dt); this.floats = this.floats.filter(f => G.time - f.t < 1.2);
    if (this.phase === 'intro') { this.intro.t += dt; if (this.intro.t >= this.intro.dur) this.nextTurn(); return; }
    if (this.play) { this.play.t += dt; this.stepPlay(); return; }
    if (B.fx.length) { this.startPlay(B.fx.shift()); return; }
    if (this.phase === 'play') {
      if (this.resume) { this.resume = false; if (fighters(B, 0).length && fighters(B, 1).length && !B.active.dead) { this.startTurnFor(B.active); return; } }
      this.nextTurn(); return;
    }
    if (this.phase === 'ai') { this.timer -= dt; if (this.timer <= 0) { aiAct(B, B.active); this.phase = 'play'; } return; }
    if (this.phase === 'remote' && Net.battleQ && Net.battleQ.length) { this.applyOrder(Net.battleQ.shift()); return; }
    if (this.phase === 'over') { const E = this.ending; E.t += dt; if (E.t >= E.dur) this.finish(false); }
  },
  // Czasy efektów (w sekundach); walka automatyczna odtwarza się szybciej
  startPlay(fx) {
    battleSound(fx, this.B.auto ? 0.55 : 1);
    const sp = this.B.auto ? 0.55 : 1, S = fx.kind === 'spell' ? SPELL_FX[fx.id] || {} : null;
    const dur = fx.kind === 'move' ? (fx.fly ? 0.45 + 0.08 * hexDistance({ x: fx.path[0][0], y: fx.path[0][1] }, { x: fx.u.x, y: fx.u.y }) : 0.17 * (fx.path.length - 1))
      : fx.kind === 'hit' ? (fx.a && !fx.splash ? 0.62 : 0.3) : fx.kind === 'shot' || fx.kind === 'siege' ? 0.95 : fx.kind === 'heal' ? 0.55 : fx.kind === 'spell' ? (S.proj || S.meteor ? 0.85 : S.strike ? 0.55 : 0.7) : 0.4;
    this.play = { ...fx, t: 0, dur: dur * sp, landed: false, launched: false, sp };
    const now = G.time, faceTo = (v, x) => { if (v && Math.abs(x - v.px) > 2) v.face = Math.sign(x - v.px); }; // oddział obraca się w stronę ruchu i celu
    if (fx.kind === 'move') { fx.u.anim = { pose: fx.fly ? 'fly' : 'walk', t0: now, dur: this.play.dur }; if (fx.fly) faceTo(fx.u, unitPos(fx.u)[0]); }
    if (fx.kind === 'hit' && fx.a && !fx.splash) { faceTo(fx.a, fx.tg.px); fx.a.anim = { pose: 'attack', t0: now, dur: this.play.dur }; }
    if (fx.kind === 'shot') faceTo(fx.a, fx.tg.px);
    if (fx.kind === 'siege') faceTo(fx.a, hexCenter(fx.x, fx.y)[0]);
    if (fx.kind === 'shot' || fx.kind === 'siege') fx.a.anim = { pose: 'attack', t0: now, dur: 0.55 * sp };
  },
  // Trafienie: błysk, odrzut, iskry, liczba obrażeń; zabity oddział przewraca się
  impact(tg, dmg, killed, col = '#ffe8a0') {
    const now = G.time, [tx, ty] = [tg.px, tg.py];
    tg.flashT = now; tg.anim = { pose: 'hurt', t0: now, dur: 0.28 }; impactSound(this.play, tg); BattleFX.glow(tx, ty - 10, 26, col, 0.25);
    BattleFX.emit(tx, ty - 8, { n: 10 + Math.min(20, Math.round(dmg / 8)), col: [col, '#ffffff', hasAb(tg, 'undead') ? '#e8e2cc' : '#b8302a'], spd: 110, up: -40, g: 260, life: 0.55, size: 3 });
    this.floats.push({ x: tx, y: ty - 44, text: `-${dmg}`, t: now, big: dmg >= 50 });
    if (killed) { this.floats.push({ x: tx, y: ty - 26, text: `†${killed}`, t: now + 0.05, col: '#e8e0cc', small: true }); BattleFX.shake = Math.max(BattleFX.shake, 2 + Math.min(4, killed)); }
    if (tg.dead && tg.dieT == null) { tg.dieT = now + 0.15; BattleFX.emit(tx, ty + 10, { n: 16, col: ['#8a7a6a', '#5a4e44'], spd: 50, up: -20, life: 0.8, size: 4, drag: 2, jx: 20 }); }
  },
  stepPlay() {
    const p = this.play, f = clamp(p.t / p.dur, 0, 1);
    if (p.kind === 'move') {
      const u = p.u;
      if (p.fly) { // start, lot wysoko nad polem i lądowanie
        const [ax, ay] = unitPos(u, ...p.path[0]), [bx, by] = unitPos(u), k = ease(f), top = Math.min(66, 34 + Math.hypot(bx - ax, by - ay) * 0.12);
        u.px = lerp(ax, bx, k); u.py = lerp(ay, by, k); u.lift = top * Math.min(1, Math.sin(f * Math.PI) * 1.6);
      } else { const seg = f * (p.path.length - 1), i = Math.min(p.path.length - 2, Math.floor(seg)), k = seg - i; const [ax, ay] = unitPos(u, ...p.path[i]), [bx, by] = unitPos(u, ...p.path[i + 1]); u.px = ax + (bx - ax) * k; u.py = ay + (by - ay) * k; if (bx !== ax) u.face = Math.sign(bx - ax); }
      if (Math.random() < 0.35 && !p.fly) BattleFX.emit(u.px, u.py + 14, { n: 1, col: '#9a8a70', spd: 20, up: -15, life: 0.4, size: 3, drag: 2 });
    } else if (p.kind === 'hit') {
      if (p.a && !p.splash && hasAb(p.a, 'breath') && f > 0.3 && f < 0.78) { // zionięcie: strumień ognia z paszczy przez cel i pole za nim
        const d = p.a.face || (p.a.side === 0 ? 1 : -1), [mx, my] = mouthPos(p.a, d), bh = hexBehind(p.a, p.tg), [ex, ey] = bh ? hexCenter(...bh) : [p.tg.px + d * 40, p.tg.py];
        BattleFX.flame(mx, my, ex, ey - 22, breathColor(p.a.cid));
      }
      if (!p.landed && f >= (p.a && !p.splash ? 0.5 : 0)) { p.landed = true; this.impact(p.tg, p.dmg, p.killed); }
    } else if (p.kind === 'shot') {
      const LK = CREATURES[p.a.cid].look, orb = LK.weapon === 'staff' || !!LK.orb, col = LK.orb || '#c8e0ff'; // kula: laska albo własny pocisk (kamień gremlina, piorun tytana)
      if (!p.launched && f >= 0.42) {
        p.launched = true; const dist = Math.hypot(p.tg.px - p.a.px, p.tg.py - p.a.py);
        p.pr = BattleFX.proj(orb ? 'orb' : 'arrow', p.a.px + (p.tg.px > p.a.px ? 14 : -14), p.a.py - 18, p.tg.px, p.tg.py - 16, (orb ? 0.12 + dist / 900 : 0.08 + dist / 1500) * p.sp, col, orb ? 8 : 6 + dist * 0.07); // strzała z łuku: szybka, płaski łuk rosnący z odległością
        p.hitAt = p.t + p.pr.dur;
      }
      if (p.launched && !p.landed && p.t >= p.hitAt) { p.landed = true; this.impact(p.tg, p.dmg, p.killed, orb ? col : '#ffe8a0'); if (orb) BattleFX.emit(p.tg.px, p.tg.py - 16, { n: 14, col: [col, '#ffffff'], spd: 90, life: 0.4, size: 3, glow: true }); }
      if (p.hitAt) p.dur = Math.max(p.dur, p.hitAt + 0.15);
    } else if (p.kind === 'siege') { // głaz z katapulty w mur
      const [tx, ty] = hexCenter(p.x, p.y);
      if (!p.launched && f >= 0.4) { p.launched = true; p.pr = BattleFX.proj('rock', p.a.px, p.a.py - 26, tx + (p.hit ? 0 : 20), ty - 20, 0.5 * p.sp, '#8a847a', 90); p.hitAt = p.t + p.pr.dur; }
      if (p.launched && !p.landed && p.t >= p.hitAt) {
        p.landed = true; Sfx.play(p.hit ? 'crash' : 'thud', { vol: p.broken ? 1 : 0.7, pan: sfxPan(tx) }); BattleFX.emit(tx, ty - 16, { n: p.broken ? 40 : 18, col: ['#9a948a', '#6e6a62', '#c8c0b0'], spd: 120, up: -60, g: 300, life: 0.7, size: 4, jx: 20 });
        BattleFX.shake = Math.max(BattleFX.shake, p.broken ? 6 : 3); this.floats.push({ x: tx, y: ty - 50, text: p.hit ? (p.broken ? 'Wyłom!' : 'Trafienie!') : 'Pudło', t: G.time, col: '#e8e0cc', small: true });
      }
      if (p.hitAt) p.dur = Math.max(p.dur, p.hitAt + 0.2);
    } else if (p.kind === 'heal') {
      if (!p.landed) { p.landed = true; const u = p.u; if (!p.label) Sfx.play('heal', { vol: 0.6, pan: sfxPan(u.px) });
        if (p.label) this.floats.push({ x: u.px, y: u.py - 50, text: p.label, t: G.time, col: '#ffe08a', small: true });
        else { this.floats.push({ x: u.px, y: u.py - 44, text: `+${p.amount}`, t: G.time, col: '#8af07a' }); spellAura(u.px, u.py, { aura: 'rise', col: '#8af07a' }); } }
    } else if (p.kind === 'spell') {
      const S = SPELL_FX[p.id] || {}, [tx, ty] = hexCenter(p.x, p.y), aim = [tx, ty - 16];
      if (!p.launched) {
        p.launched = true; const hp = heroSpot(p.side || 0), hand = [hp[0] + hp[2] * 16, hp[1] - 44]; this.heroCast = { side: p.side || 0, t0: G.time }; // bohater unosi rękę
        BattleFX.ring(hand[0], hand[1], S.col || '#ffffff', 26, 0.5, 2);
        if (S.proj) { p.pr = BattleFX.proj(S.proj, hand[0], hand[1], aim[0], aim[1], 0.5 * p.sp, S.col, 40); p.hitAt = p.pr.dur; }
        else if (S.meteor) { for (let i = 0; i < 3; i++) p.pr = BattleFX.proj('fireball', tx - 140 + i * 50, -30 - i * 20, aim[0] + (i - 1) * 14, aim[1], (0.4 + i * 0.08) * p.sp, S.col); p.hitAt = p.pr.dur; }
        else if (S.strike) { BattleFX.bolt(tx + (Math.random() - 0.5) * 60, 0, aim[0], aim[1], S.col); BattleFX.bolt(tx + (Math.random() - 0.5) * 80, 0, aim[0], aim[1], S.col); p.hitAt = 0.05;
          if (S.chain && p.area) for (let i = 1; i < p.area.length; i++) { const [x0, y0] = hexCenter(...p.area[i - 1]), [x1, y1] = hexCenter(...p.area[i]); BattleFX.bolt(x0, y0 - 16, x1, y1 - 16, S.col); BattleFX.glow(x1, y1 - 16, 40, S.col, 0.4); } } // łańcuch: piorun skacze od celu do celu
        else { for (const [ax, ay] of p.area || spellArea(p.id, p.x, p.y, this.B)) { const [cx, cy] = hexCenter(ax, ay); spellAura(cx, cy, S); } p.hitAt = 0.3; }
      }
      if (!p.landed && p.t >= p.hitAt) {
        p.landed = true; spellLandSound(p.id, tx);
        if (S.burst) BattleFX.emit(aim[0], aim[1], { n: S.boom ? 60 : 24, col: [S.col, S.burst, '#ffffff'], spd: S.boom ? 170 : 110, life: S.boom ? 0.8 : 0.5, size: S.boom ? 4 : 3, glow: true, drag: 1.5 });
        BattleFX.glow(aim[0], aim[1], S.boom ? 110 : 55, S.col, S.boom ? 0.7 : 0.45);
        if (S.boom) { BattleFX.ring(tx, ty + 10, S.col, 90, 0.6, 6); BattleFX.emit(tx, ty, { n: 40, col: ['#ff8a2a', '#ffd060', '#ff5a1a'], dir: -Math.PI / 2, spread: 2.4, spd: 150, g: 120, life: 0.9, size: 4, glow: true, jx: 50, jy: 20 }); BattleFX.emit(tx, ty, { n: 24, col: ['#5a4e44', '#8a7a6a'], dir: -Math.PI / 2, spread: 1.2, spd: 60, life: 1.1, size: 5, drag: 1 }); }
        if (S.flash) BattleFX.flash = { col: S.col, a: S.flash }; if (S.shake) BattleFX.shake = S.shake;
      }
    }
    if (p.t >= p.dur) { if (p.kind === 'move') { [p.u.px, p.u.py] = unitPos(p.u); p.u.lift = 0; p.u.anim = null; } this.play = null; }
  },
  // Klatka do narysowania: poza, sprite, przesunięcia
  // Bohaterowie w narożnikach pola (jak w H3): lewy górny atakujący, prawy górny obrońca; czar = krótka animacja zamachu
  drawHeroes(ctx) {
    const B = this.B, st = G.state, E = (this.phase === 'over' || this.phase === 'done') && this.ending, now = G.time;
    for (const side of [0, 1]) {
      const h = side ? B.sides[1].hero : B.h; if (!h) continue;
      const [x, y, dir] = heroSpot(side), c = this.heroCast && this.heroCast.side === side && now - this.heroCast.t0 < 0.6 ? this.heroCast : null, win = E && E.winner === side;
      const nA = BATTLE_FRAMES.attack, i = c ? Math.min(nA - 1, Math.floor((now - c.t0) / 0.6 * nA)) : win ? Math.floor((now * 1.6 % 1) * nA) : Math.floor(now * 4.5 + side) % BATTLE_FRAMES.idle;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y, 14, 4.5, 0, 0, TAU); ctx.fill();
      drawSprite(ctx, heroBattleSprite(h, ownerColor(st, h.owner), dir, i, !!(c || win)), x, y, HERO_BATTLE_K);
    }
  },
  unitLook(u) {
    const d = u.face || (u.side === 0 ? 1 : -1), now = G.time, a = u.anim && now - u.anim.t0 < u.anim.dur ? u.anim : null;
    let pose = 'idle', i = Math.floor(now * 5.2 + u.id * 1.37) % BATTLE_FRAMES.idle, ox = 0;
    const E = (this.phase === 'over' || this.phase === 'done') && this.ending;
    if (E && u.side === E.winner && !u.dead && !isMachine(u)) { // zwycięzcy podskakują i wymachują bronią
      const k = now * 1.6 + u.id * 0.37, hop = Math.abs(Math.sin(k * Math.PI)) * 7 * clamp(E.t * 3, 0, 1);
      return { s: battleSprite(u.cid, d, 'attack', Math.floor((k % 1) * BATTLE_FRAMES.attack)), ox: 0, hop, flash: false };
    }
    if (this.phase === 'intro' && u.cid !== 'arrowTower') { pose = 'walk'; i = Math.floor(now * 13) % BATTLE_FRAMES.walk; ox = -d * (1 - ease(clamp(this.intro.t / this.intro.dur, 0, 1))) * 110; }
    else if (a) {
      const f = clamp((now - a.t0) / a.dur, 0, 1); pose = a.pose;
      i = pose === 'walk' || pose === 'fly' ? Math.floor(now * (pose === 'fly' ? 17 : 13)) % BATTLE_FRAMES[pose] : pose === 'attack' ? Math.min(BATTLE_FRAMES.attack - 1, Math.floor(f * BATTLE_FRAMES.attack)) : 0;
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
    if (u.cid === 'firstAid') { // namiot medyka pod rozkazami: wskazujemy rannego oddział
      if (occ && firstAidTargets(B, u).includes(occ)) this.preview = { kind: 'heal', target: occ, most: skillVal(sideHero(B, u.side), 'firstAid') || 25 };
      else if (occ) this.preview = { kind: 'info', target: occ };
      return;
    }
    if (isMachine(u) && !(occ && occ.side !== u.side && targetable(occ))) { if (occ) this.preview = { kind: 'info', target: occ }; return; } // balista nie chodzi
    if (occ && occ.side !== u.side && targetable(occ)) {
      if (canShoot(B, u)) { this.preview = { kind: 'shoot', target: occ, est: estimateStrike(B, u, occ, true) }; return; }
      let best = null;
      for (const [nx, ny] of [[u.x, u.y], ...attackSpots(u, occ)]) { // pole, z którego uderzy: najbliżej kursora (duży stwór: jego środek)
        const own = nx === u.x && ny === u.y; if (!own && !this.reach.dist.has(hexKey(nx, ny)) || !hexAdjacent({ ...u, x: nx, y: ny }, occ)) continue;
        const [cx, cy] = unitPos(u, nx, ny), md = (cx - x) ** 2 + (cy - y) ** 2; if (!best || md < best.md) best = { nx, ny, md };
      }
      this.preview = best ? { kind: 'attack', target: occ, from: [best.nx, best.ny], est: estimateStrike(B, u, occ, false, hexDistance(u, { x: best.nx, y: best.ny })) } : { kind: 'far', target: occ };
    } else if (!occ && this.reach.dist.has(k)) this.preview = { kind: 'move', to: [hx.x, hx.y] };
    else if (occ) this.preview = { kind: 'info', target: occ };
  },
  onKey() { if (this.phase === 'over' && this.ending.t > 0.3) this.finish(false); },
  onClick(x, y) {
    if (this.phase === 'over') { if (this.ending.t > 0.3) this.finish(false); return; }
    if (clickButtons(this.buttons, x, y)) return;
    if (this.phase === 'input' && G.mouse.type && G.mouse.type !== 'mouse') { // dotyk: pierwsze stuknięcie pokazuje akcję i jej skutek, drugie w to samo pole ją wykonuje
      const hx = hexAt(x, y), key = hx ? hexKey(hx.x, hx.y) + (this.casting || '') : null, again = key && key === this.touchKey;
      if (!again) { this.onPointerMove(x, y); this.touchKey = this.preview && this.preview.kind !== 'info' && this.preview.kind !== 'far' && this.preview.kind !== 'nocast' ? key : null; return; }
      this.touchKey = null;
    }
    const B = this.B, p = this.preview; if (this.phase !== 'input' || !p) return;
    const ix = v => B.units.indexOf(v), u = B.active;
    if (p.kind === 'cast') this.order({ a: 'cast', id: p.id, x: p.x, y: p.y });
    else if (p.kind === 'heal') this.order({ a: 'heal', t: ix(p.target) });
    else if (p.kind === 'shoot') this.order({ a: 'shoot', t: ix(p.target) });
    else if (p.kind === 'attack') this.order({ a: 'move', t: ix(p.target), p: pathTo(this.reach, u, ...p.from) });
    else if (p.kind === 'move') this.order({ a: 'move', p: pathTo(this.reach, u, ...p.to) });
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
      if (p && (p.kind === 'move' || p.kind === 'attack')) { const [mx, my] = p.to || p.from; ctx.fillStyle = 'rgba(255,217,112,.35)'; for (const [cx, cy] of unitCells(u0, mx, my)) { hexPath(ctx, cx, cy, 2); ctx.fill(); } }
      if (p && p.target) { ctx.strokeStyle = p.kind === 'info' ? '#c8d8f0' : p.kind === 'far' ? '#8a8078' : '#ff6a4a'; ctx.lineWidth = 2.5; for (const [cx, cy] of unitCells(p.target)) { hexPath(ctx, cx, cy, 3); ctx.stroke(); } }
    }
    if (u0 && this.phase !== 'intro') {
      const pulse = 0.55 + 0.45 * Math.sin(G.time * 6); ctx.strokeStyle = `rgba(255,217,112,${0.35 * pulse})`; ctx.lineWidth = 2; for (const [cx, cy] of unitCells(u0)) { hexPath(ctx, cx, cy, 2); ctx.stroke(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,90,${0.18 + 0.12 * pulse})`; ctx.beginPath(); ctx.ellipse(u0.px, u0.py + 14, isWide(u0) ? 46 : 24, 9, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    if (B.moat) drawMoat(ctx, B); // fosa przed murem
    this.drawHeroes(ctx);
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
      drawSprite(ctx, L.s, gx, gy - lift - (L.hop || 0), 1);
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
      if (CREATURES[u.cid].shots && !endlessShots(u)) { // strzały: pod liczebnością, szare, gdy się skończyły
        const ax = bx + 2, ay = by + 15, c2 = u.shots ? '#e8e0c8' : '#7a7468'; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(ax - 1, ay, 24, 10);
        ctx.fillStyle = c2; ctx.fillRect(ax + 1, ay + 4, 7, 1); ctx.fillRect(ax + 6, ay + 3, 2, 3); ctx.fillRect(ax, ay + 3, 1, 3);
        text(ctx, String(u.shots), ax + 16, ay + 5, { size: 9, align: 'center', color: c2, fam: 'body' });
      }
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
    if (PIXEL_ART) drawHeroPortrait(ctx, 6, 1, B.h, col); else drawHeroMedal(ctx, 24, 21, 19, B.h, col); text(ctx, heroTitle(B.h), 50, 19, { size: 15, color: UI.txt, fam: 'title' });
    text(ctx, `Runda ${B.round}`, W / 2, 19, { size: 17, align: 'center', color: UI.goldHi, fam: 'title' });
    const D = B.sides[1], foeCol = ownerColor(st, D.owner), right = D.hero ? W - 50 : W - 12;
    if (D.hero) { if (PIXEL_ART) drawHeroPortrait(ctx, W - 44, 1, D.hero, foeCol); else drawHeroMedal(ctx, W - 26, 21, 19, D.hero, foeCol); }
    text(ctx, D.monster ? `${CREATURES[D.monster.cid].plural} (neutralni)` : D.bank ? `${BANKS[D.bank.kind].name} (załoga)` : D.hero ? heroTitle(D.hero) : `Garnizon: ${D.town.name}`, right, 19, { size: 15, align: 'right', color: UI.txt, fam: 'title' });
    // panel dolny: podpowiedź i dziennik
    const pv = this.preview, cu = u0 && CREATURES[u0.cid];
    let tip = this.phase === 'remote' && u0 ? `Ruch gracza ${playerName(st, B.sides[u0.side].owner)}: ${cu.plural.toLowerCase()}…` : this.phase === 'input' && u0 ? `Ruch: ${cu.plural} (${u0.n}). Kliknij pole albo wroga.` : B.auto ? 'Walka automatyczna…' : u0 && !humanSide(B, u0.side) ? 'Ruch przeciwnika…' : '';
    if (this.casting) tip = pv && pv.kind === 'cast' ? `${SPELLS[pv.id].name}: ${SPELLS[pv.id].desc(heroStat(sideHero(B, this.me) || B.h, 'sp'))}. Kliknij, aby rzucić.` : `${SPELLS[this.casting].name}: wskaż właściwy cel (Esc anuluje).`;
    else if (pv && pv.est) tip = `${pv.kind === 'shoot' ? `Strzał (zostało ${u0.shots}${shotPenaltyText(B, u0, pv.target)})` : 'Atak'}: ${pv.est.min}–${pv.est.max} obrażeń, zabitych ${pv.est.kmin === pv.est.kmax ? pv.est.kmin : `${pv.est.kmin}–${pv.est.kmax}`} (${CREATURES[pv.target.cid].plural.toLowerCase()}).`;
    else if (pv && pv.kind === 'far') tip = 'Ten oddział jest poza zasięgiem w tej turze.';
    if (this.touchKey && pv && G.mouse.type !== 'mouse') tip += ' Stuknij jeszcze raz, aby wykonać.';
    else if (pv && pv.kind === 'heal') tip = `Namiot medyka: wyleczy ${CREATURES[pv.target.cid].plural.toLowerCase()} o 1–${Math.min(pv.most, CREATURES[pv.target.cid].hp - pv.target.hp)} życia.`;
    else if (this.phase === 'input' && u0 && u0.cid === 'firstAid') tip = 'Namiot medyka: wskaż rannego oddział do leczenia (Obrona = pomiń).';
    else if (this.phase === 'input' && u0 && u0.cid === 'ballista') tip = `Balista (${CREATURES.ballista.name}): wskaż cel strzału.`;
    let tfs = 15; ctx.font = font(tfs, 700, 'body'); while (tfs > 11 && ctx.measureText(tip).width > 440) { tfs--; ctx.font = font(tfs, 700, 'body'); }
    if (PIXEL_ART) { text(ctx, tip, 20, 508, { size: tfs, weight: 700, color: '#ffd970' }); B.log.slice(-4).forEach((l, i) => text(ctx, l, 20, 532 + i * 18, { size: 14, weight: 600, color: UI.txt2 })); }
    else { // kolejka ruchów (jak w Heroes 3 HD): oddział, który teraz działa, i następne; pod nią podpowiedź i ostatnie wpisy dziennika
      battleQueue(B, 11).forEach((u, i) => { const qx = 16 + i * 41, qy = 503, own = u.side === 0 ? col : foeCol;
        slotBox(ctx, qx, qy, 38, 36, i === 0 ? 'sel' : ''); ctx.save(); ctx.beginPath(); ctx.rect(qx + 1, qy + 1, 36, 34); ctx.clip(); { const bs = battleSprite(u.cid, u.side === 0 ? 1 : -1, 'idle', 0), k = clamp(30 / (bs.c.height * bs.u), 0.3, 0.6); drawSprite(ctx, bs, qx + 19, qy + 35, k); } /* cała postać w kratce */ ctx.restore();
        ctx.fillStyle = own; ctx.fillRect(qx + 2, qy + 32, 34, 3); text(ctx, String(u.n), qx + 36, qy + 25, { size: 11, align: 'right', color: '#fff4cc', fam: 'title' }); });
      text(ctx, tip, 18, 554, { size: Math.min(tfs, 15), weight: 700, color: UI.goldHi });
      B.log.slice(-2).forEach((l, i, a) => text(ctx, l, 18, 572 + i * 16, { size: 13, weight: 600, color: i === a.length - 1 ? UI.txt : UI.txt2 })); }
    this.bCast.disabled = this.phase !== 'input' || !canCastNow(B); this.bInfo.label = sideHero(B, this.me) ? `Mana ${sideHero(B, this.me).mana}` : 'Bez bohatera'; this.bInfo.dispCol = UI.mana;
    this.buttons.forEach(b => b.draw(ctx));
  },
};
// Okno po bitwie (pokazywane już na mapie przygody)
// Wynik bitwy na mapie (po walce automatycznej): okno jak po bitwie na ekranie, potem doświadczenie i odwiedziny miejsca
function showBattleResult(st, h, res) { showBattleReport(st, res, attackReport(st, h, res), () => battleAftermath(st, h, res)); }
function battleAftermath(st, h, res) {
  if (res.outcome !== 'win') return;
  advFloat(`+${res.exp} dośw.`, h.x, h.y);
  gainExp(st, h, res.exp, () => { const here = objectAt(st, h.y * st.map.n + h.x); if (here && here.type !== 'monster' && here.type !== 'bank') visitObject(st, h, here); });
}
// Fosa oblężonego miasta: ciemna woda na polach przed murem, połyskujące piksele fal, most w rzędzie bramy
function drawMoat(ctx, B) {
  for (let y = 0; y < BROWS; y++) {
    if (!moatAt(B, MOAT_X, y)) continue; const [cx, cy] = hexCenter(MOAT_X, y);
    ctx.fillStyle = '#16303e'; hexPath(ctx, MOAT_X, y, 0); ctx.fill(); ctx.fillStyle = '#1f4a5e'; hexPath(ctx, MOAT_X, y, 4); ctx.fill();
    ctx.fillStyle = 'rgba(160,210,230,.55)';
    for (let i = 0; i < 4; i++) { const ph = (G.time * 0.6 + i * 0.27 + y * 0.13) % 1, px = Math.round((cx - 16 + ((i * 11 + y * 7) % 30)) / 2) * 2, py = Math.round((cy - 10 + i * 6) / 2) * 2; if (ph < 0.6) ctx.fillRect(px + Math.round(ph * 4) * 2, py, 6, 2); }
    ctx.strokeStyle = 'rgba(8,16,22,.8)'; ctx.lineWidth = 2; hexPath(ctx, MOAT_X, y, 1); ctx.stroke();
  }
}

