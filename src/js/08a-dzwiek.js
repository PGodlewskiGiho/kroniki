// ==================== DŹWIĘK: EFEKTY ======================================================
// Próbki CC0 (Freesound, wybrane i obrobione przez tools/dzwieki) wbudowane przez build.js jako SOUND_ART: { nazwa_wariant: mp3 (kod 85-znakowy) }.
// Sfx.play('hoof') losuje jeden z wariantów (hoof_1, hoof_2, …, bez powtórzenia poprzedniego), lekko zmienia wysokość i głośność
// (jak w dobrych grach: ten sam dźwięk nigdy nie brzmi identycznie), ustawia go w panoramie (pan: -1 lewo … 1 prawo).
// Kontekst audio powstaje dopiero po pierwszym kliknięciu albo klawiszu (wymóg przeglądarek); próbki dekodują się w tle.
const Sfx = {
  ctx: null, out: null, buf: {}, groups: {}, last: {}, lastT: {}, voices: 0, MAX_VOICES: 24,
  vol() { const v = G.settings.sfxVol; return v == null ? 0.8 : v; },
  unlock() {
    if (this.ctx || typeof SOUND_ART === 'undefined' || !SOUND_ART) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2; // wspólny ogranicznik: głośne bitwy bez przesterowań
    this.comp = comp; this.out = this.ctx.createGain(); this.out.gain.value = this.vol(); this.out.connect(comp); comp.connect(this.ctx.destination);
    for (const [k, b64] of Object.entries(SOUND_ART)) {
      const g = k.replace(/_\d+$/, ''); (this.groups[g] = this.groups[g] || []).push(k);
      this.ctx.decodeAudioData(unpackBin(b64).slice().buffer).then(b => { this.buf[k] = b; }, () => {});
    }
    Music.resume();
  },
  setVol(v) { G.settings.sfxVol = v; if (this.out) this.out.gain.value = v; },
  // o: { vol, rate, jit (rozrzut wysokości), pan, delay (s), gap (s: ten sam dźwięk nie częściej) }
  play(name, o = {}) {
    if (!this.ctx || !this.vol()) return; if (this.ctx.state === 'suspended') this.ctx.resume();
    const list = this.groups[name]; if (!list || !list.length) return; const now = this.ctx.currentTime, gap = o.gap == null ? 0.045 : o.gap;
    if (now - (this.lastT[name] || -9) < gap || this.voices >= this.MAX_VOICES) return; this.lastT[name] = now;
    let k = list[(Math.random() * list.length) | 0]; if (list.length > 1 && k === this.last[name]) k = list[(list.indexOf(k) + 1) % list.length]; this.last[name] = k;
    const b = this.buf[k]; if (!b) return;
    const src = this.ctx.createBufferSource(), gn = this.ctx.createGain(), jit = o.jit == null ? 0.06 : o.jit; src.buffer = b;
    src.playbackRate.value = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * jit); gn.gain.value = (o.vol == null ? 1 : o.vol) * (0.9 + Math.random() * 0.1);
    let node = gn; if (o.pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); gn.connect(p); node = p; }
    src.connect(gn); node.connect(this.out); this.voices++; src.onended = () => { this.voices--; };
    src.start(now + (o.delay || 0));
  },
  has(name) { return !!(this.groups[name] && this.groups[name].length); },
};
// Panorama z położenia na ekranie (px logiczne): lewy brzeg -0.6, prawy 0.6
const sfxPan = x => clamp((x / W - 0.5) * 1.2, -0.6, 0.6);

// ==================== MUZYKA ===============================================================
// Utwory orkiestrowe (tools/muzyka: kompozycje MIDI renderowane bankiem GeneralUser GS) wbudowane jako MUSIC_ART: { nazwa: { d: mp3 (kod 85-znakowy), loop: s } }.
// Każdy ekran ma swój utwór (Music.forScreen); zmiana utworu to płynne przenikanie. Pliki są pętlami bez szwu (ogon pogłosu
// dodany na początek), więc grają w kółko. Zdekodowany utwór zajmuje ok. 30 MB, dlatego w pamięci trzymamy tylko bieżący i poprzedni.
// Muzyka miasta: osobny utwór każdej frakcji, w jej klimacie (tools/muzyka/zamki.py)
const MUSIC_TOWN = { haven: 'miasto_przystan', sylvan: 'miasto_knieja', barrow: 'miasto_kurhan', fortress: 'miasto_cytadela', inferno: 'miasto_inferno', academy: 'miasto_akademia', dungeon: 'miasto_loch', stronghold: 'miasto_twierdza' };
const Music = {
  cur: null, node: null, buf: {}, order: [], bus: null,
  vol() { const v = G.settings.musVol; return v == null ? 0.5 : v; },
  setVol(v) { G.settings.musVol = v; if (this.bus) this.bus.gain.setTargetAtTime(v, Sfx.ctx.currentTime, 0.1); if (!v) this.fadeOut(0.3); else if (!this.node && this.cur) this.start(this.cur); },
  has() { return typeof MUSIC_ART !== 'undefined' && MUSIC_ART && Object.keys(MUSIC_ART).length > 0; },
  // utwór dla ekranu (null = bez zmiany)
  forScreen(name, p = {}) {
    if (['menu', 'setup', 'rules', 'load', 'scores', 'credits', 'nazwa'].includes(name)) return 'menu';
    if (name === 'adventure') return ''; // mapa świata: bez muzyki (same dźwięki otoczenia i kroki)
    if (name === 'battle') { // oblężenie, starcie z bohaterem, a z potworami na zmianę dwa utwory
      const B = p.battle; if (B && B.walls) return 'bitwa_oblezenie';
      if (B && (B.sides[1].hero || B.sides[1].town)) return 'bitwa_bohater';
      return MUSIC_ART && MUSIC_ART.bitwa_dzicz && (this.wild = !this.wild) ? 'bitwa_dzicz' : 'bitwa'; }
    if (name === 'town') { const t = G.state && G.state.towns[p.townId || 0]; return MUSIC_TOWN[t && t.faction] || 'miasto_przystan'; }
    if (name === 'bye') return '';
    return null;
  },
  screen(name, p) { const m = this.forScreen(name, p); if (m !== null) this.play(m); },
  play(name) { if (name === this.cur) return; this.cur = name; this.start(name); },
  resume() { if (this.cur && !this.node && G.screenName !== 'adventure') this.start(this.cur); },
  start(name) {
    const ctx = Sfx.ctx; if (!ctx || !this.has()) return;
    if (!this.bus) { this.bus = ctx.createGain(); this.bus.gain.value = this.vol(); this.bus.connect(Sfx.comp || ctx.destination); }
    this.fadeOut(1.4);
    if (G.screenName === 'adventure') return; // mapa świata: muzyka całkowicie wyłączona
    const e = name && MUSIC_ART[name]; if (!e || !this.vol()) return;
    if (this.buf[name]) return this.begin(name);
    if (this.buf[name] === false) return; this.buf[name] = false; // dekodowanie w toku
    ctx.decodeAudioData(unpackBin(e.d).slice().buffer).then(b => { this.buf[name] = b; this.keep(name); if (this.cur === name && !this.node) this.begin(name); }, () => { delete this.buf[name]; });
  },
  keep(name) { this.order = [name, ...this.order.filter(n => n !== name)]; for (const n of this.order.slice(2)) delete this.buf[n]; this.order = this.order.slice(0, 2); },
  begin(name) {
    if (G.screenName === 'adventure') return; // mapa świata zawsze bez muzyki (także gdy dekodowanie skończy się już po wejściu na mapę)
    const ctx = Sfx.ctx, b = this.buf[name], loop = MUSIC_ART[name].loop || b.duration, now = ctx.currentTime;
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; src.loop = true;
    // przeglądarka zwykle obcina opóźnienie kodera MP3 (wtedy długość = pętla); jeśli nie, pomijamy typowe 1105 próbek
    const off = Math.abs(b.duration - loop) < 0.01 ? 0 : 1105 / b.sampleRate; src.loopStart = off; src.loopEnd = off + loop;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 2.0); src.connect(g); g.connect(this.bus); src.start(now, off);
    this.node = { src, g }; this.keep(name);
  },
  fadeOut(t = 1.2) {
    const n = this.node; if (!n) return; this.node = null; const now = Sfx.ctx.currentTime;
    n.g.gain.cancelScheduledValues(now); n.g.gain.setValueAtTime(n.g.gain.value, now); n.g.gain.linearRampToValueAtTime(0, now + t); n.src.stop(now + t + 0.05);
  },
  stop(t) { this.cur = null; if (Sfx.ctx) this.fadeOut(t); }, // koniec bitwy: cisza pod fanfarę; następny ekran zacznie swój utwór
};
