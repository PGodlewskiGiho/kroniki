// ==================== SILNIK: pętla, wejście, przejścia =================================
// Nie zawiera logiki gry. Ekran to obiekt z metodami enter/draw/update/onClick/... (patrz nagłówek).
function setScreen(name, params) { G.screen = G.screens[name]; G.screenName = name; G.modal = null; if (G.screen.enter) G.screen.enter(params || {}); }
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
  if (e.target && e.target.tagName === 'INPUT') return; // pisanie w polu tekstowym (askText) nie uruchamia skrótów
  const k = e.key.toLowerCase(); G.keys.add(k);
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
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; G.mouse.type = e.pointerType;
    if (!G.modal && G.screen && G.screen.onPointerMove) G.screen.onPointerMove(p.x, p.y, e);
  });
  c.addEventListener('pointerdown', e => {
    if (e.button === 2) {
      e.preventDefault(); const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; updateHover();
      const txt = rightInfoAt(p.x, p.y); if (txt) G.popup = { text: txt, x: p.vx, y: p.vy };
      return;
    }
    if (e.button !== 0) return; e.preventDefault(); G.popup = null;
    if (e.pointerType !== 'mouse') {
      const p0 = toLogical(e); clearTimeout(G.pressTimer);
      G.pressTimer = setTimeout(() => { const txt = rightInfoAt(p0.x, p0.y); if (txt) { G.popup = { text: txt, x: p0.vx, y: p0.vy }; G.longPress = true; } }, 420);
    }
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.vx = p.vx; G.mouse.vy = p.vy; G.mouse.type = e.pointerType; G.mouse.down = true;
    updateHover(); G.downTarget = G.hover;
    if (!G.hover && !G.modal && !G.fade.next && G.screen.onPointerDown) G.screen.onPointerDown(p.x, p.y, e);
  });
  window.addEventListener('pointerup', e => {
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
  c.addEventListener('wheel', e => { if (!G.modal && !G.fade.next && G.screen.onWheel) { e.preventDefault(); G.screen.onWheel(Math.sign(e.deltaY)); } }, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', e => G.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => G.keys.clear());
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
  G.dpr = Math.min(window.devicePixelRatio || 1, 2); G.scale = cw / VW; G.rs = G.scale * G.dpr;
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
  const ctx = G.ctx, s = G.rs, center = () => ctx.setTransform(s, 0, 0, s, OX * s, OY * s);
  ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clearRect(0, 0, VW, VH);
  if (G.screen.fill) G.screen.draw(ctx);
  else { if (OX || OY) drawBackdrop(ctx); center(); G.screen.draw(ctx); }
  if (G.modal) { center(); G.modal.draw(ctx); }
  ctx.setTransform(s, 0, 0, s, 0, 0);
  if (G.popup) drawPopup(ctx, G.popup);
  if (G.fade.a > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade.a.toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
}
// Tło wokół wyśrodkowanego ekranu: kamień jak w ramkach gry, przyciemniony, ze złotą obwódką.
// Ekran może podać własne (screen.backdrop), np. bitwa przedłuża pole walki.
function drawBackdrop(ctx) {
  if (G.screen.backdrop) { G.screen.backdrop(ctx); return; }
  ctx.drawImage(Layers.get(`backdrop_${VW}x${VH}`, VW, VH, c => {
    stoneFill(c, 0, 0, VW, VH); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, VW, VH);
    goldFrame(c, OX, OY, W, H);
  }), 0, 0, VW, VH);
}
function frame(ts) {
  const t = ts / 1000, dt = G.last ? Math.min(0.05, Math.max(0, t - G.last)) : 0; G.last = t;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
function init() {
  loadSettings();
  G.canvas = document.getElementById('game'); G.ctx = G.canvas.getContext('2d');
  resize(); window.addEventListener('resize', resize); bindInput();
  SaveStore.init(); // ustala miejsce zapisów w tle (konto Claude albo przeglądarka)
  setScreen('menu'); G.fade.a = 1; G.fade.target = 0;
  requestAnimationFrame(frame);
}
init();
