// ==================== TEREN MAPY W WĄTKACH W TLE (Web Worker) ====================
// Piksele kawałka terenu (chunkPixelSteps: szum, tekstury, brzegi, drogi – ~90% pracy) liczą wątki w tle, równolegle na kilku
// rdzeniach, a wątek gry tylko kończy kawałek na płótnie (chunkFinish: ozdoby, drzewa, góry; kilka ms). Przewijanie, przeskok
// do innego bohatera i zmiana przybliżenia nie zatrzymują więc klatek. Kod wątku to te same funkcje gry (tekst funkcji), więc
// obraz jest identyczny. Brak wątków (stara przeglądarka, błąd) – teren maluje się jak dawniej, w wolnych chwilach wątku gry.
const TerrainPool = {
  ok: null, ws: [], jobs: new Map(), pending: new Set(), seq: 0, sentMap: null, texN: -1,
  stats: { sent: 0, done: 0, ms: 0 },
  on() { if (this.ok === null) this.init(); return this.ok; },
  src() {
    const K = { AP, CHUNK, TER, OBST, DX8, DY8, PIXEL_ART, TPAL, RPAL, PC, RING, SNOWC, AUTC, TEX_TILES, TEX_NAME };
    const fns = [thash, vnoise2, segDist, roadColor, landColorSmooth, landColor, texSmp, texShade, seasonLand, chunkPixelSteps];
    return `'use strict';\n${Object.entries(K).map(([k, v]) => `const ${k} = ${JSON.stringify(v)};`).join('\n')}
const clamp = ${clamp}, mixRgb = ${mixRgb}, lerp3 = ${lerp3}, shadeRgb = ${shadeRgb}, TEXS = new Float32Array(6);
${fns.map(f => f.toString()).join('\n')}
let MAP = null, TEX = {};
onmessage = e => { const m = e.data; if (m.map) MAP = m.map; if (m.tex) TEX = m.tex;
  if (m.job) { const j = m.job, t0 = performance.now(), it = chunkPixelSteps(MAP, j.cx, j.cy, j.D, j.SN, TEX); let r; do r = it.next(); while (!r.done);
    const v = r.value; postMessage({ id: j.id, d: v.d, wm: v.wm, wet: v.wet, tid: v.tid, ms: performance.now() - t0 }, [v.d.buffer, v.wm.buffer, v.tid.buffer]); } };`;
  },
  init() {
    this.ok = false; if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || G.settings.terrainWorker === false) return;
    try {
      const url = URL.createObjectURL(new Blob([this.src()], { type: 'text/javascript' })), n = clamp(Math.floor((navigator.hardwareConcurrency || 4) / 2), 1, 3); // połowa rdzeni: reszta dla wątku gry i przeglądarki
      for (let i = 0; i < n; i++) { const w = new Worker(url); w.busy = 0; w.onmessage = e => this.done(w, e.data); w.onerror = e => this.fail(e); this.ws.push(w); }
      this.ok = true;
    } catch (e) { this.fail(e); }
  },
  // Wątek padł (np. zakaz wątków w aplikacji): dalej po staremu, w wątku gry
  fail(e) { if (e && e.preventDefault) e.preventDefault(); for (const w of this.ws) w.terminate(); this.ws = []; this.jobs.clear(); this.pending.clear(); this.ok = false; MapRender.job = null; G.dirty = true; },
  // Mapa i tekstury idą do wątków raz (kopia), przed pierwszym kawałkiem; potem tylko numery kawałków
  sync(map) {
    if (this.sentMap !== map) { const m = { n: map.n, ln: map.ln || 0, terrain: map.terrain, obst: map.obst, road: map.road }; for (const w of this.ws) w.postMessage({ map: m }); this.sentMap = map; }
    const tk = Object.keys(TERRAIN_TEX); if (tk.length !== this.texN) { const tex = {}; for (const k of tk) { const t = TERRAIN_TEX[k]; tex[k] = { w: t.w, h: t.h, d: t.d, mean: t.mean }; } for (const w of this.ws) w.postMessage({ tex }); this.texN = tk.length; }
  },
  // Zleca kawałki (od najważniejszych), najwyżej `cap` naraz w drodze; zwraca liczbę zleconych
  request(R, list, cap) {
    if (!this.on() || !R.map) return 0; let k = 0;
    for (const [cx, cy] of list) {
      if (this.jobs.size >= cap) break; const key = cx + ',' + cy, pk = R.gen + '|' + key; if (this.pending.has(pk) || R.cache.has(key)) continue;
      this.sync(R.map); const w = this.ws.reduce((a, b) => (b.busy < a.busy ? b : a)), id = ++this.seq;
      this.jobs.set(id, { id, key, pk, cx, cy, D: R.D, SN: R.season || 0, gen: R.gen, map: R.map, t: performance.now() }); this.pending.add(pk); w.busy++;
      w.postMessage({ job: { id, cx, cy, D: R.D, SN: R.season || 0 } }); this.stats.sent++; k++;
    }
    return k;
  },
  cap() { return this.ws.length * 2; },
  done(w, m) {
    w.busy--; const j = this.jobs.get(m.id); if (!j) return; this.jobs.delete(m.id); this.pending.delete(j.pk); this.stats.done++; this.stats.ms += m.ms;
    const R = MapRender;
    if (j.gen === R.gen && j.map === R.map && !R.cache.has(j.key)) { R.store(j.key, chunkFinish(j.map, j.cx, j.cy, j.D, j.SN, m)); if (G.screenName === 'adventure') G.dirty = true; }
    if (G.state && G.state.map === R.map) R.warm(G.state); // następne kawałki
  },
};
