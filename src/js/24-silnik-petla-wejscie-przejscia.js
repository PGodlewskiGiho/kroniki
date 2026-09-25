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
  const k = e.key.toLowerCase(); G.keys.add(k);
  if (G.fade.next) return;
  const b = activeButtons().find(b => !b.disabled && b.key === k);
  if (b) { e.preventDefault(); if (b.action) b.action(); return; }
  if (k === 'escape') { if (G.modal) { if (!G.modal.locked) G.modal = null; } else if (G.screen.onBack) G.screen.onBack(); }
  else if (!G.modal && G.screen.onKey) G.screen.onKey(k, e);
}
function toLogical(e) { const r = G.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function bindInput() {
  const c = G.canvas;
  window.addEventListener('pointermove', e => {
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.type = e.pointerType;
    if (!G.modal && G.screen && G.screen.onPointerMove) G.screen.onPointerMove(p.x, p.y, e);
  });
  c.addEventListener('pointerdown', e => {
    if (e.button === 2) {
      e.preventDefault(); const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; updateHover();
      const txt = rightInfoAt(p.x, p.y); if (txt) G.popup = { text: txt, x: p.x, y: p.y };
      return;
    }
    if (e.button !== 0) return; e.preventDefault(); G.popup = null;
    if (e.pointerType !== 'mouse') {
      const p0 = toLogical(e); clearTimeout(G.pressTimer);
      G.pressTimer = setTimeout(() => { const txt = rightInfoAt(p0.x, p0.y); if (txt) { G.popup = { text: txt, x: p0.x, y: p0.y }; G.longPress = true; } }, 420);
    }
    const p = toLogical(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.type = e.pointerType; G.mouse.down = true;
    updateHover(); G.downTarget = G.hover;
    if (!G.hover && !G.modal && !G.fade.next && G.screen.onPointerDown) G.screen.onPointerDown(p.x, p.y, e);
  });
  window.addEventListener('pointerup', e => {
    if (e.button === 2) { G.popup = null; return; }
    clearTimeout(G.pressTimer);
    if (!G.mouse.down) return; G.mouse.down = false; const p = toLogical(e);
    if (G.longPress) { G.longPress = false; G.downTarget = null; return; }
    const consumed = (!G.modal && G.screen.onPointerUp) ? G.screen.onPointerUp(p.x, p.y, e) : false;
    if (!consumed && p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H) handleClick(p.x, p.y);
    G.downTarget = null; if (e.pointerType !== 'mouse') { G.mouse.x = -1; G.mouse.y = -1; }
  });
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !G.mouse.down) { G.mouse.x = -1; G.mouse.y = -1; } });
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('wheel', e => { if (!G.modal && !G.fade.next && G.screen.onWheel) { e.preventDefault(); G.screen.onWheel(Math.sign(e.deltaY)); } }, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', e => G.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => G.keys.clear());
}
function resize() {
  const wrap = document.getElementById('wrap'), aw = Math.max(1, wrap.clientWidth), ah = Math.max(1, wrap.clientHeight);
  const s = Math.min(aw / W, ah / H), cw = Math.max(1, Math.floor(W * s)), ch = Math.max(1, Math.floor(H * s));
  G.dpr = Math.min(window.devicePixelRatio || 1, 2); G.scale = cw / W; G.rs = G.scale * G.dpr;
  G.canvas.style.width = cw + 'px'; G.canvas.style.height = ch + 'px';
  G.canvas.width = Math.round(cw * G.dpr); G.canvas.height = Math.round(ch * G.dpr);
}
function update(dt) {
  G.time += dt; const f = G.fade, sp = 3.5;
  if (f.a < f.target) f.a = Math.min(f.target, f.a + dt * sp); else if (f.a > f.target) f.a = Math.max(f.target, f.a - dt * sp);
  if (f.next && f.a >= 1) { const n = f.next; f.next = null; setScreen(n.name, n.params); f.target = 0; }
  updateHover(); if (G.screen.update) G.screen.update(dt);
}
function render() {
  const ctx = G.ctx, s = G.rs; ctx.setTransform(s, 0, 0, s, 0, 0); ctx.clearRect(0, 0, W, H);
  G.screen.draw(ctx); if (G.modal) G.modal.draw(ctx); if (G.popup) drawPopup(ctx, G.popup);
  if (G.fade.a > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade.a.toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
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
