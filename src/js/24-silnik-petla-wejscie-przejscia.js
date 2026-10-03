// ==================== SILNIK: pętla, wejście, przejścia =================================
// Nie zawiera logiki gry. Ekran to obiekt z metodami enter/draw/update/onClick/... (patrz nagłówek).
function setScreen(name, params) { G.screen = G.screens[name]; G.screenName = name; G.modal = null; G.dirty = true; if (G.screen.enter) G.screen.enter(params || {}); Music.screen(name, params || {}); }
G.go = function (name, params) { if (G.fade.next) return; G.fade.next = { name, params }; G.fade.target = 1; };
function activeButtons() { return G.modal ? G.modal.buttons : (G.screen.buttons || []); }
function updateHover() {
  G.hover = G.fade.next ? null : buttonAt(activeButtons(), G.mouse.x, G.mouse.y);
  G.wantCursor = G.hover ? 'hand' : 'arrow'; // ekran może to zmienić w update (np. miecz nad wrogiem); ustawia pętla
}
function handleClick(x, y) {
  if (G.fade.next) return;
  if (G.modal) { if (!clickButtons(G.modal.buttons, x, y) && G.modal.onClick) G.modal.onClick(x, y); return; }
  if (G.screen.onClick) G.screen.onClick(x, y); else clickButtons(G.screen.buttons || [], x, y);
}
function onKey(e) {
  G.dirty = true; Sfx.unlock();
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
    if (!G.modal && G.screen && G.screen.onPinch) G.screen.onPinch(k > 1 ? 1 : -1, mid.x, mid.y);
    G.pinch.d0 = d; G.dirty = true;
  });
  window.addEventListener('pointerup', touchEnd); window.addEventListener('pointercancel', touchEnd);
  c.addEventListener('pointerdown', e => {
    if (G.pinch) return;
    G.dirty = true; Sfx.unlock(); // dźwięk: kontekst audio dopiero po geście gracza
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
    G.dirty = true; if (G.pinch && e.pointerType === 'touch') { G.mouse.down = false; return; } // koniec szczypania to nie kliknięcie
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
  if (f.next && f.a >= 1) { const n = f.next; f.next = null; f.target = 0; setScreen(n.name, n.params); } // enter() może od razu zlecić kolejne przejście
  syncMouse(); updateHover(); if (G.screen.update) G.screen.update(dt); setCursor(G.wantCursor);
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
  drawNetChat(ctx); // czat gry online
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
    `płótno ${G.canvas.width}×${G.canvas.height}, gęstość ${G.dpr}, jakość: ${(QUALITIES.find(q => q.id === G.settings.quality) || QUALITIES[0]).name}`, `grafika: ${gpuName().slice(0, 60)}`];
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(4, 4, 390, 58);
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
  const wxBtn = { label: 'Pogoda', sub: weatherOn() ? 'włączona' : 'wyłączona', tip: 'Deszcz, śnieg, mgła i cienie chmur na mapie świata (tylko wygląd).',
    action: () => { S.weather = weatherOn() ? 'off' : 'on'; saveSettings(); showGfxSettings(back); } };
  showDialog(`Jakość grafiki: ${cur} (${Math.round(G.dpr * 100)}% ostrości). Na słabym komputerze wybierz Niską: obraz jest trochę mniej ostry, ale gra działa znacznie płynniej. Automatyczna sama obniża jakość, gdy klatek jest za mało. Klawisz F pokazuje licznik klatek.`,
    [...QUALITIES.map(q => ({ label: q.name, action: set(q.id), selected: q.id === (S.quality || 'auto') })), ...(PIXEL_ART ? [fontBtn] : []), wxBtn, sndBtn, { label: 'OK', key: 'escape', primary: true, action: () => { if (back) back(); } }], { bw: PIXEL_ART ? 100 : 112 });
}
function init() {
  loadSettings(); loadUnitArt(); // arkusze jednostek dekodują się w tle (do tego czasu dawne rysunki)
  setPixelSize(G.settings.quality === 'low' ? 2 : PIX_DEFAULT); ZOOM = ZOOMS.includes(G.settings.zoom) ? G.settings.zoom : 1; // niska jakość: dawny, grubszy piksel (4 razy mniej pracy przy rysowaniu)
  G.canvas = document.getElementById('game'); G.ctx = G.canvas.getContext('2d', { alpha: false }); // nieprzezroczyste płótno: przeglądarka nie miesza go z tłem strony
  resize(); window.addEventListener('resize', resize); bindInput();
  SaveStore.init(); // ustala miejsce zapisów w tle (konto Claude albo przeglądarka)
  setScreen('menu'); G.fade.a = 1; G.fade.target = 0;
  // wbudowana czcionka ładuje się chwilę: potem odświeżamy obrazy z napisami trzymane w pamięci (tytuły, przyciski)
  if (document.fonts) Promise.all([`16px ${FONT_PIXEL}`, `700 16px Cinzel`, `600 16px Cinzel`, `700 16px 'Cinzel Decorative'`, `500 16px 'Cormorant Garamond'`, `700 16px 'Cormorant Garamond'`, `italic 500 16px 'Cormorant Garamond'`].map(f => document.fonts.load(f))).then(() => { Layers.cache = {}; G.dirty = true; }, () => {}); // wbudowane czcionki: po wczytaniu napisy od nowa
  requestAnimationFrame(frame);
}
init();
