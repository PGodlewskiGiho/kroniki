// ==================== SILNIK: pętla, wejście, przejścia =================================
// Nie zawiera logiki gry. Ekran to obiekt z metodami enter/draw/update/onClick/... (patrz nagłówek).
function setScreen(name, params) { G.screen = G.screens[name]; G.screenName = name; G.modal = null; G.dirty = true; if (G.screen.enter) G.screen.enter(params || {}); }
G.go = function (name, params) { if (G.fade.next) return; G.fade.next = { name, params }; G.fade.target = 1; };
function activeButtons() { return G.modal ? G.modal.buttons : (G.screen.buttons || []); }
function updateHover() {
  G.hover = G.fade.next ? null : (activeButtons().find(b => !b.disabled && b.hit(G.mouse.x, G.mouse.y)) || null);
  G.canvas.style.cursor = G.hover ? 'pointer' : 'default';
}
function handleClick(x, y) {
  if (G.fade.next) return;
  if (G.modal) { if (!clickButtons(G.modal.buttons, x, y) && G.modal.onClick) G.modal.onClick(x, y); return; }
  if (G.screen.onClick) G.screen.onClick(x, y); else clickButtons(G.screen.buttons || [], x, y);
}
function onKey(e) {
  G.dirty = true;
  if (e.target && e.target.tagName === 'INPUT') return; // pisanie w polu tekstowym (askText) nie uruchamia skrótów
  const k = e.key.toLowerCase(); G.keys.add(k);
  if (k === 'f' && !e.ctrlKey && !e.metaKey) { G.showPerf = !G.showPerf; return; }
  if (G.fade.next) return;
  const b = activeButtons().find(b => !b.disabled && b.key === k);
  if (b) { e.preventDefault(); if (b.action) b.action(); return; }
  if (k === 'escape') { if (G.modal) { if (!G.modal.locked) G.modal = null; } else if (G.screen.onBack) G.screen.onBack(); }
  else if (!G.modal && G.screen.onKey) G.screen.onKey(k, e);
}
// Współrzędne myszy: vx, vy w całym oknie (VW×VH); x, y w układzie aktywnej warstwy: okno dialogowe
// i zwykłe ekrany leżą w wyśrodkowanym obszarze W×H (przesunięcie OX, OY), ekrany fill w całym oknie.
const layerOffset = () => (G.modal || !(G.screen && G.screen.fill)) ? [OX, OY] : [0, 0];
function toLogical(e) {
  const r = G.canvas.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * VW, vy = (e.clientY - r.top) / r.height * VH, [ox, oy] = layerOffset();
  return { x: vx - ox, y: vy - oy, vx, vy };
}
function syncMouse() { const m = G.mouse; if (m.vx == null || m.vx < 0) return; const [ox, oy] = layerOffset(); m.x = m.vx - ox; m.y = m.vy - oy; }
function bindInput() {
  const c = G.canvas;
  window.addEventListener('pointermove', e => {
    G.dirty = true;
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; G.mouse.type = e.pointerType;
    if (!G.modal && G.screen && G.screen.onPointerMove) G.screen.onPointerMove(p.x, p.y, e);
  });
  c.addEventListener('pointerdown', e => {
    G.dirty = true;
    if (e.button === 2) {
      e.preventDefault(); const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; updateHover();
      const txt = rightInfoAt(p.x, p.y); if (txt) G.popup = { text: txt, x: p.vx, y: p.vy };
      return;
    }
    if (e.button !== 0) return; e.preventDefault(); G.popup = null;
    if (e.pointerType !== 'mouse') {
      const p0 = toLogical(e); clearTimeout(G.pressTimer);
      G.pressTimer = setTimeout(() => { G.dirty = true; const txt = rightInfoAt(p0.x, p0.y); if (txt) { G.popup = { text: txt, x: p0.vx, y: p0.vy }; G.longPress = true; } }, 420);
    }
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; G.mouse.type = e.pointerType; G.mouse.down = true;
    updateHover(); G.downTarget = G.hover;
    if (!G.hover && !G.modal && !G.fade.next && G.screen.onPointerDown) G.screen.onPointerDown(p.x, p.y, e);
  });
  window.addEventListener('pointerup', e => {
    G.dirty = true;
    if (e.button === 2) { G.popup = null; return; }
    clearTimeout(G.pressTimer);
    if (!G.mouse.down) return; G.mouse.down = false; const p = toLogical(e);
    if (G.longPress) { G.longPress = false; G.downTarget = null; return; }
    const consumed = (!G.modal && G.screen.onPointerUp) ? G.screen.onPointerUp(p.x, p.y, e) : false;
    if (!consumed && p.vx >= 0 && p.vx <= VW && p.vy >= 0 && p.vy <= VH) handleClick(p.x, p.y);
    G.downTarget = null; if (e.pointerType !== 'mouse') { G.mouse.x = G.mouse.y = G.mouse.vx = G.mouse.vy = -1; }
  });
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !G.mouse.down) { G.mouse.x = G.mouse.y = G.mouse.vx = G.mouse.vy = -1; } });
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('wheel', e => { G.dirty = true; if (!G.modal && !G.fade.next && G.screen.onWheel) { e.preventDefault(); G.screen.onWheel(Math.sign(e.deltaY)); } }, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', e => { G.keys.delete(e.key.toLowerCase()); G.dirty = true; });
  window.addEventListener('blur', () => { G.keys.clear(); G.dirty = true; });
}
// Okno gry wypełnia ekran: skala tak, by zmieścił się obszar W×H, a reszta szerokości albo wysokości
// (do VW_MAX×VH_MAX) poszerza okno logiczne. Wymiary parzyste, bo bufory pikselowe mają połowę rozdzielczości.
function resize() {
  const wrap = document.getElementById('wrap'), aw = Math.max(1, wrap.clientWidth), ah = Math.max(1, wrap.clientHeight);
  const s = Math.min(aw / W, ah / H);
  VW = clamp(Math.floor(aw / s / 2) * 2, W, VW_MAX); VH = clamp(Math.floor(ah / s / 2) * 2, H, VH_MAX);
  OX = (VW - W) / 2; OY = (VH - H) / 2;
  for (const k in Layers.cache) if (/_\d+x\d+$/.test(k)) delete Layers.cache[k]; // warstwy zależne od rozmiaru okna
  const cw = Math.max(1, Math.floor(VW * s)), ch = Math.max(1, Math.floor(VH * s));
  G.dpr = renderDpr(); G.scale = cw / VW; G.rs = G.scale * G.dpr; G.dirty = true;
  G.canvas.style.width = cw + 'px'; G.canvas.style.height = ch + 'px';
  G.canvas.width = Math.round(cw * G.dpr); G.canvas.height = Math.round(ch * G.dpr);
}
function update(dt) {
  G.time += dt; const f = G.fade, sp = 3.5;
  if (f.a < f.target) f.a = Math.min(f.target, f.a + dt * sp); else if (f.a > f.target) f.a = Math.max(f.target, f.a - dt * sp);
  if (f.next && f.a >= 1) { const n = f.next; f.next = null; setScreen(n.name, n.params); f.target = 0; }
  syncMouse(); updateHover(); if (G.screen.update) G.screen.update(dt);
}
function render() {
  // przesunięcie wyśrodkowanego ekranu w całych pikselach: przy ułamkowym każdy obraz byłby filtrowany (wolno i nieostro)
  const ctx = G.ctx, s = G.rs, center = () => ctx.setTransform(s, 0, 0, s, Math.round(OX * s), Math.round(OY * s));
  ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clearRect(0, 0, VW, VH);
  if (G.screen.fill) G.screen.draw(ctx);
  else { if (OX || OY) drawBackdrop(ctx); center(); G.screen.draw(ctx); }
  if (G.modal) { center(); G.modal.draw(ctx); }
  ctx.setTransform(s, 0, 0, s, 0, 0);
  if (G.popup) drawPopup(ctx, G.popup);
  if (G.fade.a > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade.a.toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
  if (G.showPerf) drawPerfInfo(ctx);
}
// Tło wokół wyśrodkowanego ekranu: kamień jak w ramkach gry, przyciemniony, ze złotą obwódką.
// Ekran może podać własne (screen.backdrop), np. bitwa przedłuża pole walki.
function drawBackdrop(ctx) {
  if (G.screen.backdrop) { G.screen.backdrop(ctx); return; }
  drawLayer(ctx, Layers.get(`backdrop_${VW}x${VH}`, VW, VH, c => {
    stoneFill(c, 0, 0, VW, VH); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, VW, VH);
    goldFrame(c, OX, OY, W, H);
  }), 0, 0);
}
// Klatkę rysujemy tylko wtedy, gdy trzeba: ekran podaje, ilu klatek na sekundę potrzebuje (screen.fps: liczba albo funkcja,
// domyślnie 4 dla ekranów bez animacji), a wejście (mysz, klawisze) i każda zmiana okna, dymka czy podświetlenia wymusza klatkę od razu.
// Na słabym komputerze to połowa sukcesu: nieruchomy ekran prawie nie zużywa procesora.
function screenFps() { const f = G.screen && G.screen.fps; return typeof f === 'function' ? f.call(G.screen) : (f || 4); }
function frame(ts) {
  const t = ts / 1000, raw = G.last ? t - G.last : 0, dt = Math.min(0.05, Math.max(0, raw)); G.last = t;
  try {
    update(dt);
    const ui = [G.screen, G.modal, G.popup, G.hover, G.fade.next]; if (!G._ui || ui.some((v, i) => v !== G._ui[i])) { G._ui = ui; G.dirty = true; }
    const fps = screenFps();
    if (G.dirty || G.fade.a > 0 || t - (G.drawnAt || 0) >= 1 / fps - 0.004) { const w0 = performance.now(); G.dirty = false; render(); Perf.sample(t - (G.drawnAt || t), (performance.now() - w0) / 1000, fps); G.drawnAt = t; } // rysowanie może poprosić o kolejną klatkę (G.dirty)
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
// Jakość grafiki = gęstość pikseli płótna. Wysoka: jak ekran (do 2), niska: pół piksela płótna na piksel ekranu (miękki obraz,
// ale 4 razy mniej pikseli do skopiowania w każdej klatce: na słabym laptopie bez karty graficznej to główny koszt).
// Automatyczna zaczyna jak wysoka i schodzi o stopień (2 → 1 → 0,75 → 0,5), gdy klatki przychodzą za późno.
const QUALITIES = [{ id: 'auto', name: 'Automatyczna' }, { id: 'high', name: 'Wysoka' }, { id: 'low', name: 'Niska' }];
function renderDpr() {
  const dev = Math.min(window.devicePixelRatio || 1, 2), q = G.settings.quality;
  if (q === 'high') return dev;
  if (q === 'low') return Math.min(dev, 1) * 0.5;
  return Math.min(dev, G.settings.autoDpr || dev);
}
// Jakość schodzi, gdy klatki przychodzą wyraźnie później, niż ekran chce (mediana spóźnienia > 12 ms), i to albo przy długim
// rysowaniu w skrypcie (> 12 ms), albo dwa razy z rzędu: kopiowanie pikseli na płótno (bez karty graficznej) nie wlicza się w czas
// skryptu, a pojedyncze przestoje z zewnątrz (karta w tle, zrzut ekranu, generowanie grafiki) nie obniżają jakości.
const Perf = {
  late: [], work: [], strikes: 0, fps: 0, ms: 0,
  sample(gap, work, fps) {
    if (gap > 0 && gap < 1) { this.fps = this.fps ? this.fps * 0.9 + 0.1 / gap : 1 / gap; this.ms = this.ms ? this.ms * 0.9 + work * 100 : work * 1000; }
    if (G.settings.quality !== 'auto' || fps < 12 || gap <= 0 || gap > 0.25 || (G.screens.adventure && G.screens.adventure.aiRun)) return;
    this.late.push(gap - 1 / fps); this.work.push(work); if (this.late.length < 60) return;
    const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1], late = med(this.late) > 0.012, busy = med(this.work) > 0.012; this.late = []; this.work = [];
    this.strikes = late ? this.strikes + 1 : 0;
    if (late && (busy || this.strikes >= 2) && G.dpr > 0.5) { G.settings.autoDpr = G.dpr > 1 ? 1 : G.dpr > 0.75 ? 0.75 : 0.5; this.strikes = 0; saveSettings(); resize(); }
  },
};
// Licznik wydajności (klawisz F): klatki na sekundę, czas rysowania w skrypcie, rozmiar płótna i karta graficzna według przeglądarki
function gpuName() {
  if (G._gpu == null) {
    try { const gl = document.createElement('canvas').getContext('webgl'), ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); G._gpu = gl ? String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : 'brak WebGL'; }
    catch (e) { G._gpu = '?'; }
  }
  return G._gpu;
}
function drawPerfInfo(ctx) {
  const lines = [`${Perf.fps.toFixed(0)} kl/s (ekran chce ${screenFps()}), skrypt ${Perf.ms.toFixed(1)} ms`,
    `płótno ${G.canvas.width}×${G.canvas.height}, gęstość ${G.dpr}, jakość: ${(QUALITIES.find(q => q.id === G.settings.quality) || QUALITIES[0]).name}`, `grafika: ${gpuName().slice(0, 60)}`];
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(4, 4, 390, 58);
  lines.forEach((l, i) => text(ctx, l, 10, 20 + i * 17, { size: 12, weight: 600, color: '#ffe9a0' })); ctx.restore();
}
function showGfxSettings(back) {
  const S = G.settings, cur = (QUALITIES.find(q => q.id === S.quality) || QUALITIES[0]).name;
  const set = id => () => { S.quality = id; if (id === 'auto') delete S.autoDpr; saveSettings(); resize(); showGfxSettings(back); };
  showDialog(`Jakość grafiki: ${cur} (${Math.round(G.dpr * 100)}% ostrości). Na słabym komputerze wybierz Niską: obraz jest trochę mniej ostry, ale gra działa znacznie płynniej. Automatyczna sama obniża jakość, gdy klatek jest za mało. Klawisz F pokazuje licznik klatek.`,
    [...QUALITIES.map(q => ({ label: q.name, action: set(q.id) })), { label: 'OK', key: 'escape', action: () => { if (back) back(); } }], { bw: 130 });
}
function init() {
  loadSettings();
  G.canvas = document.getElementById('game'); G.ctx = G.canvas.getContext('2d', { alpha: false }); // nieprzezroczyste płótno: przeglądarka nie miesza go z tłem strony
  resize(); window.addEventListener('resize', resize); bindInput();
  SaveStore.init(); // ustala miejsce zapisów w tle (konto Claude albo przeglądarka)
  setScreen('menu'); G.fade.a = 1; G.fade.target = 0;
  requestAnimationFrame(frame);
}
init();
