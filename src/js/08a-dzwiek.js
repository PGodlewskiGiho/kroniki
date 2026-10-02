// ==================== DŹWIĘK: EFEKTY ======================================================
// Próbki CC0 (Freesound, wybrane i obrobione przez tools/dzwieki) wbudowane przez build.js jako SOUND_ART: { nazwa_wariant: mp3 base64 }.
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
    this.out = this.ctx.createGain(); this.out.gain.value = this.vol(); this.out.connect(comp); comp.connect(this.ctx.destination);
    for (const [k, b64] of Object.entries(SOUND_ART)) {
      const g = k.replace(/_\d+$/, ''); (this.groups[g] = this.groups[g] || []).push(k);
      const bin = atob(b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      this.ctx.decodeAudioData(a.buffer).then(b => { this.buf[k] = b; }, () => {});
    }
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
