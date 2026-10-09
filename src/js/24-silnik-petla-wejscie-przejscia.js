// ==================== SILNIK: pętla, wejście, przejścia =================================
// Nie zawiera logiki gry. Ekran to obiekt z metodami enter/draw/update/onClick/... (patrz nagłówek).
function setScreen(name, params) { G.screen = G.screens[name]; G.screenName = name; G.modal = null; G.dirty = true; legScrollTo(0); restUnits(); if (G.screen.enter) G.screen.enter(params || {}); Music.screen(name, params || {}); }
G.go = function (name, params) { if (G.fade.next) return; G.fade.next = { name, params }; G.fade.target = 1; };
function activeButtons() { return G.modal ? G.modal.buttons : (G.screen.buttons || []); }
function updateHover() {
  G.hover = G.fade.next ? null : buttonAt(activeButtons(), G.mouse.x, G.mouse.y);
  G.wantCursor = G.hover ? 'hand' : 'arrow'; // ekran może to zmienić w update (np. miecz nad wrogiem); ustawia pętla
}
function handleClick(x, y) {
  if (G.fade.next) return; restUnits();
  if (G.modal) { if (!clickButtons(G.modal.buttons, x, y) && G.modal.onClick) G.modal.onClick(x, y); return; }
  if (G.screen.onClick) G.screen.onClick(x, y); else clickButtons(G.screen.buttons || [], x, y);
}
function onKey(e) {
  G.dirty = true; Sfx.unlock(); restUnits();
  if (e.target && e.target.tagName === 'INPUT') return; // pisanie w polu tekstowym (askText) nie uruchamia skrótów
  const k = e.key.toLowerCase(); G.keys.add(k);
  if (k === 'f' && !e.ctrlKey && !e.metaKey) { G.showPerf = !G.showPerf; return; }
  if (G.fade.next) return;
  if (k === 't' && Net.peer && !G.modal && (Net.inGame || G.screenName === 'online')) { e.preventDefault(); netChatOpen(); return; } // czat online
  if (k === 'escape' && !G.modal && G.screen.cancelMode && G.screen.cancelMode()) return; // Esc najpierw przerywa tryb wskazywania (np. cel czaru na mapie)
  const b = activeButtons().find(b => !b.disabled && b.key === k);
  if (b) { e.preventDefault(); Sfx.play('click', { vol: 0.5 }); if (b.action) b.action(); return; }
  if (k === 'escape') { if (G.modal) { if (!G.modal.locked) G.modal = null; } else if (G.screen.onBack) G.screen.onBack(); }
  else if (!G.modal && G.screen.onKey) G.screen.onKey(k, e);
}
// Układy jednostek (opis przy W, H): ekran i okno dialogowe z ui: true rysują w jednostkach interfejsu, pozostałe w dawnych.
// Rysowanie i obsługa wejścia ustawiają układ warstwy, której dotyczą (setUnits); poza tym obowiązuje układ wierzchniej warstwy.
const UNITS = { ui: null, leg: null }; let UNIT = 'ui';
function setUnits(m) { const u = m === 'box' ? boxUnits() : UNITS[m]; if (!u) return; UNIT = m; VW = u.vw; VH = u.vh; OX = u.ox; OY = u.oy; G.rs = u.rs; G.scale = u.scale; }
const screenUnits = () => (G.screen && G.screen.ui) ? 'ui' : 'leg';
const modalUnits = () => G.modal.ui ? 'ui' : G.modal.box ? 'box' : 'leg';
const topUnits = () => G.modal ? modalUnits() : screenUnits();
// Dawne okno dialogowe z ramką (modal.box: x, y, w, h w układzie W×H) skaluje się do swojej ramki, nie do całego W×H:
// na telefonie wychodzi większe i czytelniejsze, na dużym monitorze najwyżej tak duże jak dawny ekran (LS)
function boxUnits() {
  const b = G.modal && G.modal.box, u = UNITS.ui; if (!b) return UNITS.leg;
  const m = Math.min((u.vw - 12) / b.w, (u.vh - 12) / b.h, Math.max(1, LS)), vw = u.vw / m, vh = u.vh / m;
  return { vw, vh, ox: vw / 2 - (b.x + b.w / 2), oy: vh / 2 - (b.y + b.h / 2), rs: u.rs * m, scale: u.scale * m, m };
}
function restUnits() { setUnits(topUnits()); }
// Przewijanie dawnego ekranu, który nie mieści się w wysokości okna (telefon): przeciągnięcie palcem albo kółko myszy
function legScrollTo(v) { const L = UNITS.leg; if (!L) return; G.legScroll = clamp(v, 0, G.legScrollMax || 0); if (L.scroll) L.oy = -G.legScroll / LS; if (UNIT === 'leg') OY = L.oy; G.dirty = true; }
const legScrollable = () => G.legScrollMax > 0 && topUnits() === 'leg' && !(!G.modal && G.screen && G.screen.fitsView && G.screen.fitsView()); // ekran ułożony pod widok (np. nowa gra na telefonie) nie przewija się
// Współrzędne myszy: vx, vy w całym oknie w jednostkach interfejsu; x, y w układzie aktywnej warstwy: dawne okna dialogowe
// i zwykłe ekrany leżą w wyśrodkowanym obszarze W×H (przesunięcie OX, OY, skala LS), dawne ekrany fill w całym oknie (skala LS).
function layerXY(vx, vy) {
  const tu = topUnits();
  if (tu === 'ui') return !G.modal && G.screen && G.screen.mapPoint ? G.screen.mapPoint(vx, vy) : [vx, vy]; // ekran może mieć obszary w dawnych współrzędnych (miasto)
  if (tu === 'box') { const b = boxUnits(); return [vx / b.m - b.ox, vy / b.m - b.oy]; }
  const L = UNITS.leg, lx = vx / LS, ly = vy / LS;
  return (G.modal || !(G.screen && G.screen.fill)) ? [lx - L.ox, ly - L.oy] : [lx, ly];
}
function toLogical(e) {
  const r = G.canvas.getBoundingClientRect(), u = UNITS.ui, vx = (e.clientX - r.left) / r.width * u.vw, vy = (e.clientY - r.top) / r.height * u.vh, [x, y] = layerXY(vx, vy);
  return { x, y, vx, vy };
}
function syncMouse() { const m = G.mouse; if (m.vx == null || m.vx < 0) return; [m.x, m.y] = layerXY(m.vx, m.vy); }
function bindInput() {
  const c = G.canvas;
  window.addEventListener('pointermove', e => {
    G.dirty = true; restUnits();
    const sd = G.scrollDrag; if (sd && G.mouse.down) { const dy = e.clientY - sd.y0; if (Math.abs(dy) > 10) { sd.moved = true; clearTimeout(G.pressTimer); } if (sd.moved) { legScrollTo(sd.s0 - dy / UNITS.ui.scale); restUnits(); return; } }
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; G.mouse.type = e.pointerType;
    if (!G.modal && G.screen && G.screen.onPointerMove) G.screen.onPointerMove(p.x, p.y, e);
  });
  // Dwa palce na ekranie: szczypanie (przybliżanie i oddalanie mapy). Pojedynczy dotyk działa jak mysz.
  const touches = new Map(), pinchDist = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const touchEnd = e => { if (!touches.delete(e.pointerId)) return; if (touches.size < 2 && G.pinch) { G.pinch.done = true; if (!touches.size) G.pinch = null; } };
  c.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { // drugi palec: koniec przeciągania i dotknięcia, zaczyna się szczypanie
        clearTimeout(G.pressTimer); G.mouse.down = false; G.downTarget = null; if (G.screen && G.screen.drag) G.screen.drag = null;
        G.pinch = { d0: pinchDist() }; return;
      }
      if (G.pinch) return;
    }
  });
  window.addEventListener('pointermove', e => {
    if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size !== 2 || !G.pinch || G.pinch.done) return;
    const d = pinchDist(), k = d / G.pinch.d0; if (k > 0.8 && k < 1.25) return;
    const [a, b] = [...touches.values()], mid = toLogical({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
    restUnits(); if (!G.modal && G.screen && G.screen.onPinch) G.screen.onPinch(k > 1 ? 1 : -1, mid.x, mid.y);
    G.pinch.d0 = d; G.dirty = true;
  });
  window.addEventListener('pointerup', touchEnd); window.addEventListener('pointercancel', touchEnd);
  c.addEventListener('pointerdown', e => {
    if (G.canvasFirstTouch) G.canvasFirstTouch(e);
    if (G.pinch || needRotate()) return;
    G.dirty = true; Sfx.unlock(); restUnits();
    G.scrollDrag = e.pointerType !== 'mouse' && legScrollable() ? { y0: e.clientY, s0: G.legScroll, moved: false } : null; // dźwięk: kontekst audio dopiero po geście gracza
    if (e.button === 2) {
      e.preventDefault(); const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; updateHover();
      const pop = rightPopup(p); if (pop) G.popup = pop;
      return;
    }
    if (e.button !== 0) return; e.preventDefault(); G.popup = null;
    if (e.pointerType !== 'mouse') {
      const p0 = toLogical(e); clearTimeout(G.pressTimer);
      G.pressTimer = setTimeout(() => { G.dirty = true; const pop = rightPopup(p0); if (pop) { G.popup = pop; G.longPress = true; } }, 420);
    }
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; G.mouse.type = e.pointerType; G.mouse.down = true;
    updateHover(); G.downTarget = G.hover;
    if (!G.hover && !G.modal && !G.fade.next && G.screen.onPointerDown) G.screen.onPointerDown(p.x, p.y, e);
  });
  window.addEventListener('pointerup', e => {
    G.dirty = true; restUnits(); if (G.pinch && e.pointerType === 'touch') { G.mouse.down = false; return; } // koniec szczypania to nie kliknięcie
    if (e.button === 2) { G.popup = null; return; }
    clearTimeout(G.pressTimer);
    if (!G.mouse.down) return; G.mouse.down = false; const p = toLogical(e);
    if (G.longPress) { G.longPress = false; G.downTarget = null; return; }
    if (G.scrollDrag && G.scrollDrag.moved) { G.scrollDrag = null; G.downTarget = null; G.mouse.x = G.mouse.y = G.mouse.vx = G.mouse.vy = -1; return; } // przewinięcie to nie kliknięcie
    G.scrollDrag = null;
    const consumed = (!G.modal && G.screen.onPointerUp) ? G.screen.onPointerUp(p.x, p.y, e) : false;
    if (!consumed && p.vx >= 0 && p.vx <= UNITS.ui.vw && p.vy >= 0 && p.vy <= UNITS.ui.vh) handleClick(p.x, p.y);
    G.downTarget = null; if (e.pointerType !== 'mouse') { G.mouse.x = G.mouse.y = G.mouse.vx = G.mouse.vy = -1; }
  });
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !G.mouse.down) { G.mouse.x = G.mouse.y = G.mouse.vx = G.mouse.vy = -1; } });
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('wheel', e => { G.dirty = true; restUnits(); if (legScrollable() && (G.modal || !G.screen.onWheel)) { e.preventDefault(); legScrollTo(G.legScroll + clamp(e.deltaY / UNITS.ui.scale, -240, 240)); restUnits(); return; } if (!G.modal && !G.fade.next && G.screen.onWheel) { e.preventDefault(); G.screen.onWheel(Math.sign(e.deltaY)); } }, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', e => { G.keys.delete(e.key.toLowerCase()); G.dirty = true; });
  window.addEventListener('blur', () => { G.keys.clear(); G.dirty = true; });
}
// Okno gry wypełnia ekran. Skala interfejsu (piksele CSS na jednostkę) zależy od wysokości okna: między UI_MIN_H a UI_MAX_H
// jednostka to piksel CSS (razy ustawienie „wielkość interfejsu”), niżej (telefon) okno ma UI_MIN_H jednostek, wyżej (duży monitor) UI_MAX_H.
// Dawne ekrany W×H skalują się (LS), by zmieścić się w oknie. Wymiary parzyste, bo bufory pikselowe mają połowę rozdzielczości.
function resize() {
  const wrap = document.getElementById('wrap'), aw = Math.max(1, wrap.clientWidth), ah = Math.max(1, wrap.clientHeight);
  const k = clamp(G.settings.uiScale || 1, 0.6, 2), s0 = ah < UI_MIN_H ? ah / UI_MIN_H : ah > UI_MAX_H ? ah / UI_MAX_H : 1, s = Math.min(s0 * k, ah / UI_MIN_H, aw / UI_MIN_W);
  const vw = clamp(Math.floor(aw / s / 2) * 2, UI_MIN_W, VW_MAX), vh = clamp(Math.floor(ah / s / 2) * 2, UI_MIN_H, VH_MAX);
  for (const k in Layers.cache) if (/_\d+x\d+$/.test(k)) delete Layers.cache[k]; // warstwy zależne od rozmiaru okna
  const cw = Math.max(1, Math.floor(vw * s)), ch = Math.max(1, Math.floor(vh * s));
  G.dpr = renderDpr(); const scale = cw / vw, rs = scale * G.dpr;
  // dawne ekrany: zmieszczone w oknie (LS), a gdy wyszłyby wyraźnie mniejsze niż interfejs (telefon), w pełnej wielkości i przewijane w pionie
  const fit = Math.min(vw / W, vh / H), scroll = fit < 0.92 && vw / W > fit * 1.02;
  LS = scroll ? Math.min(1, vw / W) : fit; const lw = Math.max(W, Math.round(vw / LS / 2) * 2), lh = scroll ? vh / LS : Math.max(H, Math.round(vh / LS / 2) * 2);
  G.legScrollMax = scroll ? Math.max(0, H * LS - vh) : 0; G.legScroll = clamp(G.legScroll || 0, 0, G.legScrollMax);
  UNITS.ui = { vw, vh, ox: 0, oy: 0, rs, scale };
  UNITS.leg = { vw: lw, vh: lh, ox: (lw - W) / 2, oy: scroll ? 0 : (lh - H) / 2, rs: rs * LS, scale: scale * LS, scroll };
  legScrollTo(G.legScroll);
  restUnits(); G.dirty = true;
  G.canvas.style.width = cw + 'px'; G.canvas.style.height = ch + 'px';
  G.canvas.width = Math.round(cw * G.dpr); G.canvas.height = Math.round(ch * G.dpr);
  if (G.screen && G.screen.onResize) G.screen.onResize();
}
function update(dt) {
  G.time += dt; const f = G.fade, sp = 3.5;
  if (f.a < f.target) f.a = Math.min(f.target, f.a + dt * sp); else if (f.a > f.target) f.a = Math.max(f.target, f.a - dt * sp);
  if (f.next && f.a >= 1) { const n = f.next; f.next = null; f.target = 0; setScreen(n.name, n.params); } // enter() może od razu zlecić kolejne przejście
  restUnits(); syncMouse(); updateHover(); setUnits(screenUnits()); if (G.screen.update) G.screen.update(dt); restUnits(); setCursor(G.wantCursor); Ambient.tick(dt);
}
function render() {
  // przesunięcie wyśrodkowanego ekranu w całych pikselach: przy ułamkowym każdy obraz byłby filtrowany (wolno i nieostro)
  const ctx = G.ctx, center = () => ctx.setTransform(G.rs, 0, 0, G.rs, Math.round(OX * G.rs), Math.round(OY * G.rs)), whole = () => ctx.setTransform(G.rs, 0, 0, G.rs, 0, 0);
  setUnits('ui'); whole(); ctx.clearRect(0, 0, VW, VH); GLMap.shown = false;
  setUnits(screenUnits()); whole();
  if (G.screen.fill || G.screen.ui) G.screen.draw(ctx);
  else { if (OX || OY) drawBackdrop(ctx); center(); G.screen.draw(ctx); }
  if (G.modal) { setUnits(modalUnits()); if (G.modal.ui) whole(); else center(); G.modal.draw(ctx); }
  setUnits('ui'); whole();
  if (legScrollable()) { const h = VH * VH / (VH + G.legScrollMax), y = (VH - h) * G.legScroll / G.legScrollMax; // pasek przewijania dawnego ekranu
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(VW - 7, 0, 7, VH); ctx.fillStyle = 'rgba(214,174,92,.85)'; ctx.fillRect(VW - 6, y + 2, 5, h - 4); }
  if (G.popup) drawPopup(ctx, G.popup);
  drawNetChat(ctx); // czat gry online
  if (G.fade.a > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade.a.toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
  if (G.showPerf) drawPerfInfo(ctx);
  if (needRotate()) drawRotateHint(ctx); // telefon trzymany pionowo
  GLMap.hideUnused(); // mapy w tej klatce nie było (inny ekran): płótno WebGL schowane
  restUnits();
}
// Tło wokół wyśrodkowanego ekranu: kamień jak w ramkach gry, przyciemniony, ze złotą obwódką.
// Ekran może podać własne (screen.backdrop), np. bitwa przedłuża pole walki.
function drawBackdrop(ctx) {
  if (G.screen.backdrop) { G.screen.backdrop(ctx); return; }
  const P = paintedBackLayer(G.screen.paintedBack || 'sala', 0.55); // malowana sala zamkowa (gobeliny, pochodnie) zamiast kamienia
  if (P) { drawLayer(ctx, P, 0, 0); drawLayer(ctx, Layers.get(`backframe_${VW}x${VH}`, VW, VH, c => goldFrame(c, OX, OY, W, H)), 0, 0); return; }
  drawLayer(ctx, Layers.get(`backdrop_${VW}x${VH}`, VW, VH, c => {
    stoneFill(c, 0, 0, VW, VH); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, VW, VH);
    goldFrame(c, OX, OY, W, H);
  }), 0, 0);
}
// Klatkę rysujemy tylko wtedy, gdy trzeba: ekran podaje, ilu klatek na sekundę potrzebuje (screen.fps: liczba albo funkcja,
// domyślnie 4 dla ekranów bez animacji), a wejście (mysz, klawisze) i każda zmiana okna, dymka czy podświetlenia wymusza klatkę od razu.
// Na słabym komputerze to połowa sukcesu: nieruchomy ekran prawie nie zużywa procesora.
// Ekrany z ciągłą animacją: pełna płynność, przy niskiej jakości grafiki połowa klatek (słaby komputer)
function smoothFps(n = 60) { return G.settings.quality === 'low' ? n / 2 : n; }
function screenFps() { const f = G.screen && G.screen.fps; return typeof f === 'function' ? f.call(G.screen) : (f || 4); }
function frame(ts) {
  const t = ts / 1000, raw = G.last ? t - G.last : 0, dt = Math.min(0.05, Math.max(0, raw)); G.last = t;
  try {
    update(dt); Net.tick();
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
  late: [], work: [], strikes: 0, good: 0, fps: 0, ms: 0,
  sample(gap, work, fps) {
    if (gap > 0 && gap < 1) { this.fps = this.fps ? this.fps * 0.9 + 0.1 / gap : 1 / gap; this.ms = this.ms ? this.ms * 0.9 + work * 100 : work * 1000; }
    // pomijamy tury komputera i czas, gdy teren mapy maluje się w tle (to chwilowe, nie wina jakości grafiki)
    if (G.settings.quality !== 'auto' || fps < 12 || gap <= 0 || gap > 0.25 || (G.screens.adventure && G.screens.adventure.aiRun) || (MapRender.map && !MapRender.warmed && G.screen === G.screens.adventure)) return;
    this.late.push(gap - 1 / fps); this.work.push(work); if (this.late.length < 60) return;
    const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1], late = med(this.late) > 0.012, busy = med(this.work) > 0.012, easy = med(this.late) < 0.003 && med(this.work) < 0.006; this.late = []; this.work = [];
    this.strikes = late ? this.strikes + 1 : 0; this.good = easy ? this.good + 1 : 0;
    if (late && (busy || this.strikes >= 2) && G.dpr > 0.5) { G.settings.autoDpr = G.dpr > 1 ? 1 : G.dpr > 0.75 ? 0.75 : 0.5; this.strikes = 0; this.good = 0; saveSettings(); resize(); }
    // i z powrotem: po ~10 s płynnej gry z zapasem jakość rośnie o stopień (obniżka nie zostaje na zawsze)
    else if (this.good >= 10 && G.settings.autoDpr) { const up = { 0.5: 0.75, 0.75: 1, 1: 2 }[G.settings.autoDpr]; if (up && up <= 1) G.settings.autoDpr = up; else delete G.settings.autoDpr; this.good = 0; saveSettings(); resize(); }
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
    `płótno ${G.canvas.width}×${G.canvas.height}, gęstość ${G.dpr}, jakość: ${(QUALITIES.find(q => q.id === G.settings.quality) || QUALITIES[0]).name}`, `grafika: ${gpuName().slice(0, 60)}`, `mapa: ${GLMap.mode()}${GLMap.use() ? `, ${GLMap.stats.quads} prostokątów, ${GLMap.stats.draws} wywołań` : ''}`];
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(4, 4, 390, 75);
  lines.forEach((l, i) => text(ctx, l, 10, 20 + i * 17, { size: 12, weight: 600, color: '#ffe9a0' })); ctx.restore();
}
// Dźwięk: osobno efekty i muzyka; każde kliknięcie przełącza poziom głośności (wyłączony → … → 100%).
function showSoundSettings(back) {
  const S = G.settings, sv = Sfx.vol(), mv = Music.vol(), pct = v => v ? `${Math.round(v * 100)}%` : 'wyłączona';
  const next = (vals, v) => vals[(vals.findIndex(x => x >= v - 0.01) + 1) % vals.length];
  showDialog('Głośność efektów dźwiękowych i muzyki. Kliknięcie zmienia poziom.', [
    { label: 'Efekty', sub: sv ? `${Math.round(sv * 100)}%` : 'wyłączone', tip: 'Kroki, ciosy, czary, złoto, przyciski (wyłączone, 40%, 70%, 100%).',
      action: () => { Sfx.setVol(next([0, 0.4, 0.7, 1], sv)); saveSettings(); Sfx.unlock(); Sfx.play('click'); showSoundSettings(back); } },
    { label: 'Muzyka', sub: pct(mv), tip: 'Muzyka orkiestrowa: menu, mapa, miasta i bitwy (wyłączona, 25%, 50%, 75%, 100%).',
      action: () => { Sfx.unlock(); Music.setVol(next([0, 0.25, 0.5, 0.75, 1], mv)); saveSettings(); showSoundSettings(back); } },
    { label: 'OK', key: 'escape', primary: true, action: () => { if (back) back(); } }], { bw: 130 });
}
function showGfxSettings(back) {
  const S = G.settings, cur = (QUALITIES.find(q => q.id === S.quality) || QUALITIES[0]).name;
  const set = id => () => { S.quality = id; if (id === 'auto') delete S.autoDpr; saveSettings(); setPixelSize(id === 'low' ? 2 : PIX_DEFAULT); resize(); showGfxSettings(back); };
  const fontBtn = { label: pixelFont() ? 'Czcionka: piksele' : 'Czcionka: klasyczna', sub: 'zmień', tip: 'Czcionka interfejsu: pikselowa (pasuje do grafiki) albo klasyczna szeryfowa.',
    action: () => { S.font = pixelFont() ? 'classic' : 'pixel'; saveSettings(); Layers.cache = {}; showGfxSettings(back); } };
  const sv = Sfx.vol(), mv = Music.vol(), pct = v => v ? `${Math.round(v * 100)}%` : 'wyłączony';
  const sndBtn = { label: 'Dźwięk', sub: `${sv ? 'efekty ' + Math.round(sv * 100) + '%' : 'bez efektów'}`, tip: `Głośność efektów (${pct(sv)}) i muzyki (${pct(mv)}).`,
    action: () => showSoundSettings(() => showGfxSettings(back)) };
  const UIS = [0.85, 1, 1.15, 1.3, 1.5], uis = G.settings.uiScale || 1;
  const uiBtn = { label: 'Interfejs', sub: `${Math.round(uis * 100)}%`, tip: 'Wielkość przycisków, napisów i paneli. Większy: wygodniej na telefonie i dużym monitorze; mniejszy: więcej miejsca na mapę.',
    action: () => { S.uiScale = UIS[(UIS.indexOf(uis) + 1) % UIS.length]; saveSettings(); resize(); showGfxSettings(back); } };
  const wxBtn = { label: 'Pogoda', sub: weatherOn() ? 'włączona' : 'wyłączona', tip: 'Deszcz, śnieg, mgła i cienie chmur na mapie świata (tylko wygląd).',
    action: () => { S.weather = weatherOn() ? 'off' : 'on'; saveSettings(); showGfxSettings(back); } };
  const RM = ['auto', 'gl', 'cpu'], rm = S.renderer || 'auto', glOn = GLMap.use();
  const glBtn = { label: 'Karta graficzna', sub: rm === 'auto' ? (glOn ? 'auto: włączona' : 'auto: wyłączona') : rm === 'gl' ? 'zawsze' : 'wyłączona',
    tip: `Kto rysuje mapę świata. Karta graficzna (WebGL): płynny ruch, przybliżanie i przewijanie. „Auto” włącza ją tylko przy sprzętowym WebGL${GLMap.name ? ` (tu: ${GLMap.hw ? 'jest' : 'brak – sterownik programowy'})` : ''}; „wyłączona”: dawny sposób, procesorem. Teraz mapę rysuje: ${GLMap.mode()}.`,
    action: () => { S.renderer = RM[(RM.indexOf(rm) + 1) % RM.length]; saveSettings(); G.dirty = true; showGfxSettings(back); } };
  showDialog(`Jakość grafiki: ${cur} (${Math.round(G.dpr * 100)}% ostrości). Na słabym komputerze wybierz Niską: obraz jest trochę mniej ostry, ale gra działa znacznie płynniej. Automatyczna sama obniża jakość, gdy klatek jest za mało. Klawisz F pokazuje licznik klatek.`,
    [...QUALITIES.map(q => ({ label: q.name, action: set(q.id), selected: q.id === (S.quality || 'auto') })), ...(PIXEL_ART ? [fontBtn] : [glBtn]), uiBtn, wxBtn, sndBtn, { label: 'OK', key: 'escape', primary: true, action: () => { if (back) back(); } }], { bw: PIXEL_ART ? 100 : 112 });
}
function init() {
  loadSettings(); loadUnitArt(); // arkusze jednostek dekodują się w tle (do tego czasu dawne rysunki)
  setPixelSize(G.settings.quality === 'low' ? 2 : PIX_DEFAULT); ZOOM = ZOOMS.includes(G.settings.zoom) ? G.settings.zoom : isTouchDevice() ? 1.25 : 1; // na telefonie domyślnie bliżej: pola pod palec // niska jakość: dawny, grubszy piksel (4 razy mniej pracy przy rysowaniu)
  G.canvas = document.getElementById('game'); G.ctx = G.canvas.getContext('2d', { alpha: true }); // przezroczyste płótno: pod nim, w oknie mapy, leży płótno WebGL (GLMap)
  App.init(); resize(); window.addEventListener('resize', resize); bindInput();
  SaveStore.init(); // ustala miejsce zapisów w tle (konto Claude albo przeglądarka)
  setScreen('menu'); G.fade.a = 1; G.fade.target = 0;
  // wbudowana czcionka ładuje się chwilę: potem odświeżamy obrazy z napisami trzymane w pamięci (tytuły, przyciski)
  if (document.fonts) Promise.all([`16px ${FONT_PIXEL}`, `700 16px Cinzel`, `600 16px Cinzel`, `700 16px 'Cinzel Decorative'`, `500 16px 'Cormorant Garamond'`, `700 16px 'Cormorant Garamond'`, `italic 500 16px 'Cormorant Garamond'`].map(f => document.fonts.load(f))).then(() => { Layers.cache = {}; G.dirty = true; }, () => {}); // wbudowane czcionki: po wczytaniu napisy od nowa
  requestAnimationFrame(frame);
}
init();
