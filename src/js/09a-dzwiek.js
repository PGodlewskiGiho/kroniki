// ==================== DŹWIĘK ============================================================
// Wszystko syntezowane w Web Audio, bez plików: efekty Sound.play(id) i muzyka Sound.music(motyw).
// Kontekst audio powstaje przy pierwszym kliknięciu albo klawiszu (wymóg przeglądarek); do tego czasu
// i bez Web Audio wszystko jest ciche. Głośność: G.settings.sfx i G.settings.mus (0–1, kroki SOUND_LEVELS).
const SOUND_LEVELS = [0, 0.35, 0.7, 1];
const NOTE = m => 440 * Math.pow(2, (m - 69) / 12); // numer MIDI → Hz
const Sound = {
  ctx: null, master: null, sfxBus: null, musBus: null, noiseBuf: null, last: {}, theme: null, song: null, timer: null, steps: 0,
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      const c = this.ctx, comp = c.createDynamicsCompressor();
      this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(comp); comp.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.connect(this.master); this.musBus = c.createGain(); this.musBus.connect(this.master);
      const n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0), r = mulberry32(7); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; this.noiseBuf = b;
      this.applyVolume();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (this.theme && !this.song) this.startSong(this.theme);
  },
  applyVolume() { if (!this.ctx) return; const t = this.ctx.currentTime; this.sfxBus.gain.setTargetAtTime(G.settings.sfx ?? 0.7, t, 0.05); this.musBus.gain.setTargetAtTime((G.settings.mus ?? 0.7) * 0.55, t, 0.2); },
  ready() { return !!(this.ctx && this.ctx.state === 'running'); },
  // --- klocki: ton i szum z obwiednią (a = narastanie, d = zanikanie) ---
  tone(f, t, dur, o = {}) {
    const c = this.ctx, osc = c.createOscillator(), g = c.createGain(); let out = osc;
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1); }
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); out = fl; }
    const v = o.vol ?? 0.3, a = o.a ?? 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + Math.max(a, dur - (o.d ?? dur * 0.8)));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(g); g.connect(o.bus || this.sfxBus); osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(t, dur, o = {}) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = o.filter || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q ?? 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const v = o.vol ?? 0.3, a = o.a ?? 0.003;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  // Efekt dźwiękowy; ten sam nie częściej niż co 40 ms (szybka walka automatyczna)
  play(id) {
    if (!this.ready() || !(G.settings.sfx ?? 0.7) || !SFX[id]) return;
    const t = this.ctx.currentTime; if (this.last[id] && t - this.last[id] < 0.04) return; this.last[id] = t;
    try { SFX[id].call(this, t + 0.01); } catch (e) {}
  },
  // --- muzyka: motyw ekranu, pętla 8 taktów planowana z wyprzedzeniem ---
  music(theme) {
    if (theme === this.theme) return; this.theme = theme;
    if (this.song) { const s = this.song, t = this.ctx.currentTime; s.gain.gain.setTargetAtTime(0.0001, t, 0.4); setTimeout(() => s.gain.disconnect(), 3000); this.song = null; }
    if (this.ctx) this.startSong(theme);
  },
  startSong(theme) {
    const T = MUSIC[theme]; if (!T || !this.ctx) return;
    const g = this.ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(1, this.ctx.currentTime, 0.8); g.connect(this.musBus);
    this.song = { T, gain: g, notes: composeSong(T), step: 0, next: this.ctx.currentTime + 0.1 };
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 60);
  },
  schedule() {
    const s = this.song; if (!s || !this.ready()) return;
    const sp = 60 / s.T.bpm / 2; // ósemka
    if (s.next < this.ctx.currentTime - 0.1) s.next = this.ctx.currentTime + 0.05; // karta była w tle: nie nadrabiamy zaległych nut
    while (s.next < this.ctx.currentTime + 0.25) {
      for (const n of s.notes[s.step]) this.voice(n, s.next, sp, s.gain);
      s.step = (s.step + 1) % s.notes.length; s.next += sp;
    }
  },
  voice(n, t, sp, bus) {
    const I = INSTR[n.i], d = n.len * sp;
    if (I.drum) return I.drum.call(this, t, bus, n.v);
    this.tone(NOTE(n.m), t, d * (I.hold || 1), { type: I.type, vol: I.vol * (n.v || 1), a: I.a, d: I.d != null ? d * I.d : undefined, lp: I.lp, vib: I.vib, bus });
    if (I.oct) this.tone(NOTE(n.m + 12), t, d * (I.hold || 1), { type: I.type, vol: I.vol * I.oct, a: I.a, lp: I.lp, bus });
  },
  // Motyw dla ekranu (wywoływane po zmianie ekranu); ekrany bez własnego motywu zostawiają obecny
  screen(name) {
    const st = G.state, fac = st && st.players ? human(st).faction : 'haven';
    if (['menu', 'setup', 'load', 'scores', 'credits'].includes(name)) this.music('menu');
    else if (name === 'adventure') this.music('map_' + fac);
    else if (name === 'town') { const t = G.screens.town.town && G.screens.town.town(); this.music('town_' + (t ? t.faction : fac)); }
    else if (name === 'battle') this.music('battle');
  },
};
// --- efekty: każdy to krótka funkcja z tonów i szumu (this = Sound, t = czas startu) ---
const SFX = {
  click(t) { this.tone(620, t, 0.05, { type: 'triangle', vol: 0.18 }); this.noise(t, 0.025, { f: 2600, q: 2, vol: 0.12 }); },
  step(t) { const k = (Sound.steps++ & 1) ? 1.15 : 1; this.noise(t, 0.06, { f: 900 * k, q: 3, vol: 0.2 }); this.tone(170 * k, t, 0.06, { type: 'triangle', vol: 0.12 }); },
  coin(t) { this.tone(1320, t, 0.07, { type: 'square', vol: 0.11, lp: 4000 }); this.tone(1760, t + 0.07, 0.22, { type: 'square', vol: 0.11, lp: 4000 }); },
  pickup(t) { [660, 880, 1175].forEach((f, i) => this.tone(f, t + i * 0.06, 0.14, { type: 'triangle', vol: 0.16 })); },
  treasure(t) { [72, 76, 79, 84, 88].forEach((m, i) => { this.tone(NOTE(m), t + i * 0.07, 0.6, { vol: 0.13 }); this.tone(NOTE(m + 12), t + i * 0.07 + 0.2, 0.4, { vol: 0.04 }); }); },
  magic(t) { this.tone(400, t, 0.35, { to: 1600, type: 'sine', vol: 0.15 }); [1568, 2093, 2637].forEach((f, i) => this.tone(f, t + 0.1 + i * 0.05, 0.25, { vol: 0.05 })); },
  build(t) { for (let i = 0; i < 3; i++) { this.noise(t + i * 0.2, 0.08, { f: 1400, q: 1.5, vol: 0.3 }); this.tone(210, t + i * 0.2, 0.09, { type: 'triangle', vol: 0.25 }); } this.noise(t + 0.62, 0.5, { f: 300, filter: 'lowpass', vol: 0.12 }); },
  recruit(t) { this.noise(t, 0.12, { f: 150, filter: 'lowpass', vol: 0.4 }); [[55, 0.08], [60, 0.2], [64, 0.2], [67, 0.45]].forEach(([m, d], i) => this.tone(NOTE(m + 12), t + 0.1 + i * 0.1, d, { type: 'square', vol: 0.1, lp: 2200 })); },
  day(t) { this.tone(880, t, 1.4, { vol: 0.12, d: 1.3 }); this.tone(1320, t, 1.0, { vol: 0.04 }); this.tone(1760, t + 0.01, 0.7, { vol: 0.03 }); },
  week(t) { [[55, 0], [59, 0.25], [62, 0.5]].forEach(([m, dt]) => this.tone(NOTE(m), t + dt, 1.3 - dt, { type: 'sawtooth', vol: 0.07, lp: 1400, a: 0.06 })); },
  levelup(t) { [60, 64, 67, 72, 76, 79].forEach((m, i) => this.tone(NOTE(m + 12), t + i * 0.08, i === 5 ? 0.7 : 0.16, { type: 'square', vol: 0.1, lp: 3500 })); },
  error(t) { this.tone(160, t, 0.1, { type: 'square', vol: 0.08, lp: 1200 }); this.tone(130, t + 0.12, 0.14, { type: 'square', vol: 0.08, lp: 1200 }); },
  swing(t) { this.noise(t, 0.18, { f: 3200, to: 700, q: 1.2, vol: 0.28 }); },
  hit(t) { this.noise(t, 0.12, { f: 700, filter: 'lowpass', vol: 0.5 }); this.tone(120, t, 0.16, { to: 55, vol: 0.4 }); },
  death(t) { this.tone(260, t, 0.55, { to: 70, type: 'sawtooth', vol: 0.14, lp: 900 }); this.noise(t + 0.15, 0.4, { f: 250, filter: 'lowpass', vol: 0.25 }); },
  bow(t) { this.tone(330, t, 0.07, { to: 180, type: 'triangle', vol: 0.2 }); this.noise(t + 0.03, 0.3, { f: 2500, to: 5000, filter: 'highpass', vol: 0.1 }); },
  catapult(t) { this.noise(t, 0.25, { f: 400, q: 6, vol: 0.2 }); this.tone(90, t + 0.1, 0.3, { to: 45, vol: 0.4 }); },
  boom(t) { this.noise(t, 1.1, { f: 900, to: 120, filter: 'lowpass', vol: 0.6 }); this.tone(70, t, 0.7, { to: 30, vol: 0.5 }); },
  thunder(t) { this.noise(t, 0.09, { f: 1800, q: 0.7, vol: 0.6 }); this.noise(t + 0.05, 1.3, { f: 260, to: 80, filter: 'lowpass', vol: 0.45 }); },
  buff(t) { [72, 79, 84].forEach((m, i) => this.tone(NOTE(m), t + i * 0.1, 0.7 - i * 0.1, { vol: 0.12, a: 0.03 })); },
  curse(t) { [69, 68, 63].forEach((m, i) => this.tone(NOTE(m), t + i * 0.13, 0.35, { type: 'triangle', vol: 0.14, vib: 7 })); },
  heal(t) { this.tone(660, t, 0.6, { to: 990, slide: 0.4, vol: 0.14, a: 0.05 }); [1320, 1760].forEach((f, i) => this.tone(f, t + 0.2 + i * 0.1, 0.4, { vol: 0.04 })); },
  victory(t) { [[60, 0, 0.18], [64, 0.18, 0.18], [67, 0.36, 0.18], [72, 0.54, 1.2]].forEach(([m, dt, d]) => { this.tone(NOTE(m + 12), t + dt, d, { type: 'square', vol: 0.07, lp: 3000 }); this.tone(NOTE(m), t + dt, d, { type: 'triangle', vol: 0.12 }); }); this.tone(NOTE(48), t + 0.54, 1.2, { type: 'triangle', vol: 0.15 }); },
  defeat(t) { [[69, 0], [67, 0.35], [65, 0.7], [64, 1.05]].forEach(([m, dt]) => this.tone(NOTE(m - 12), t + dt, 0.6, { type: 'sawtooth', vol: 0.07, lp: 900, a: 0.04 })); this.tone(NOTE(40), t + 1.05, 1.4, { type: 'triangle', vol: 0.15 }); },
};
// Dźwięk czaru w bitwie
const spellSfx = id => ({ lightningBolt: 'thunder', fireball: 'boom', meteorShower: 'boom', armageddon: 'boom', slow: 'curse', weakness: 'curse', cure: 'heal', animateDead: 'heal', resurrection: 'heal' })[id]
  || (SPELLS[id].dmg ? 'magic' : 'buff');

// --- muzyka: instrumenty i motywy ---
// i = instrument, m = nuta MIDI, len = długość w ósemkach, v = głośność względna
const INSTR = {
  pad: { type: 'triangle', vol: 0.05, a: 0.4, d: 0.5, lp: 900, hold: 1.1 },
  bass: { type: 'triangle', vol: 0.14, a: 0.01, d: 0.7 },
  harp: { type: 'triangle', vol: 0.06, a: 0.003, d: 0.95, hold: 2 },
  flute: { type: 'triangle', vol: 0.08, a: 0.04, d: 0.4, vib: 5 },
  bell: { type: 'sine', vol: 0.07, a: 0.002, d: 0.98, hold: 3, oct: 0.3 },
  horn: { type: 'sawtooth', vol: 0.035, a: 0.03, d: 0.5, lp: 1300 },
  kick: { drum(t, bus, v = 1) { this.tone(110, t, 0.18, { to: 40, vol: 0.35 * v, bus }); } },
  snare: { drum(t, bus, v = 1) { this.noise(t, 0.14, { f: 1800, q: 0.8, vol: 0.16 * v, bus }); } },
  tom: { drum(t, bus, v = 1) { this.tone(180, t, 0.2, { to: 90, vol: 0.2 * v, bus }); } },
};
// scale = stopnie skali (półtony), prog = akordy (stopnie skali) na 8 taktów, lead = instrument melodii
const MUSIC = {
  menu: { bpm: 76, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 5, 4, 0, 3, 5, 4], lead: 'flute', arp: 'harp', seed: 11 },
  map_haven: { bpm: 96, root: 53, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0, 5, 3, 1, 4], lead: 'flute', arp: 'harp', seed: 21 },
  map_sylvan: { bpm: 88, root: 57, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 3, 0, 0, 6, 4, 4], lead: 'flute', arp: 'harp', seed: 31 },
  map_barrow: { bpm: 70, root: 50, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 5, 1, 0, 0, 5, 6, 4], lead: 'bell', arp: null, seed: 41 },
  town_haven: { bpm: 84, root: 55, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3, 0, 4, 3, 4], lead: 'horn', arp: 'harp', seed: 51 },
  town_sylvan: { bpm: 80, root: 52, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 6, 0, 5, 3, 4, 0], lead: 'harp', arp: 'harp', seed: 61 },
  town_barrow: { bpm: 64, root: 45, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 0, 5, 0, 1, 6, 4], lead: 'bell', arp: null, seed: 71 },
  battle: { bpm: 132, root: 52, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 0, 5, 6, 0, 0, 3, 4], lead: 'horn', arp: null, drums: true, seed: 81 },
};
// Układa 8 taktów po 8 ósemek: akord (pad), bas, arpeggio, melodia z prostym motywem (A A' powtórzone) i bębny w bitwie
function composeSong(T) {
  const r = mulberry32(T.seed), steps = Array.from({ length: 64 }, () => []), S = T.scale;
  const deg = (d, oct = 0) => T.root + S[((d % 7) + 7) % 7] + 12 * (oct + Math.floor(d / 7));
  const rhythms = [[2, 2, 2, 2], [3, 1, 2, 2], [2, 1, 1, 4], [4, 2, 2], [1, 1, 2, 2, 2], [6, 2]];
  const motif = [0, 1].map(() => rhythms[Math.floor(r() * rhythms.length)]);
  let mel = 4; // stopień skali melodii względem toniki (oktawa wyżej)
  T.prog.forEach((c, bar) => {
    const b = bar * 8, chord = [c, c + 2, c + 4];
    chord.forEach(d => steps[b].push({ i: 'pad', m: deg(d), len: 8 }));
    steps[b].push({ i: 'bass', m: deg(c, -1), len: 3 }); steps[b + 4].push({ i: 'bass', m: deg(c + (T.drums ? 0 : 4), -1), len: 3 });
    if (T.drums) { for (let k = 0; k < 8; k += 2) steps[b + k + 1].push({ i: 'bass', m: deg(c, -1), len: 1, v: 0.7 }); }
    if (T.arp) for (let k = 0; k < 8; k++) steps[b + k].push({ i: T.arp, m: deg(chord[[0, 1, 2, 1][k % 4]] + (k >= 4 ? 7 : 0), 0), len: 1, v: 0.8 });
    const rh = motif[bar % 2 === 0 ? 0 : 1]; let k = 0;
    rh.forEach((len, j) => {
      if (j === 0) { const tones = chord.map(d => d + 7); mel = tones.reduce((a, x) => Math.abs(x - mel) < Math.abs(a - mel) ? x : a, tones[0]); } // mocna część: najbliższy dźwięk akordu
      else mel += [-2, -1, -1, 1, 1, 2][Math.floor(r() * 6)];
      mel = clamp(mel, 3, 12);
      if (bar === 7 && j === rh.length - 1) mel = 7; // koniec frazy na tonice
      if (!(bar % 4 === 3 && j === 0 && r() < 0.3)) steps[b + k].push({ i: T.lead, m: deg(mel, 0), len });
      k += len;
    });
    if (T.drums) for (let k2 = 0; k2 < 8; k2++) {
      if (k2 % 4 === 0) steps[b + k2].push({ i: 'kick', len: 1 });
      if (k2 % 4 === 2) steps[b + k2].push({ i: 'snare', len: 1 });
      if (bar % 4 === 3 && k2 >= 5) steps[b + k2].push({ i: 'tom', len: 1, v: 0.6 + k2 * 0.05 });
    }
  });
  return steps;
}
// Okno ustawień dźwięku (z menu gry i menu głównego); after = co zrobić po zamknięciu
function showSoundSettings(after) {
  const pct = v => `${Math.round((v ?? 0) * 100)}%`, cycle = k => { const i = SOUND_LEVELS.indexOf(G.settings[k]); G.settings[k] = SOUND_LEVELS[(i + 1) % SOUND_LEVELS.length]; saveSettings(); Sound.applyVolume(); showSoundSettings(after); };
  showDialog('Dźwięk. Kliknij, aby zmienić głośność (wyłączone, cicho, średnio, głośno).', [
    { label: `Efekty ${pct(G.settings.sfx)}`, key: 'e', action: () => cycle('sfx') },
    { label: `Muzyka ${pct(G.settings.mus)}`, key: 'u', action: () => cycle('mus') },
    { label: 'Gotowe', key: 'enter', action: () => { if (after) after(); } }]);
}
