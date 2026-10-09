// ==================== GRAFIKA: KURSORY ======================================================
// Pikselowe kursory w stylu gry (sprite'y jak reszta grafiki, z obrysem), zmieniane zależnie od tego, co wskazuje mysz:
// strzałka, dłoń nad przyciskiem, koń (ruch), szary koń (za daleko), miecz (atak), strzała (strzał), brama (odwiedziny),
// kotwica (łódź), gwiazdka (czar), skrzydło (lot), zakaz, krzyż strzałek (przeciąganie mapy).
// Obraz ma 32×32 px CSS (przy drobnym pikselu 1 piksel grafiki = 1 px), a gorący punkt zależy od kształtu.
const CURSORS = {
  arrow: { hot: [2, 2], fb: 'default', draw(c) {
    fillPoly(c, [[2, 2], [2, 25], [8, 19.5], [12, 28.5], [16, 26.5], [12.2, 18], [19.5, 18]], '#e8c060');
    fillPoly(c, [[2, 2], [2, 25], [4.5, 22.5], [4.5, 7]], '#fff0b0'); fillPoly(c, [[8, 19.5], [12, 28.5], [16, 26.5], [12.2, 18], [19.5, 18], [13, 16]], '#a8782a');
  } },
  hand: { hot: [11, 2], fb: 'pointer', draw(c) {
    const g = '#e8c070', d = '#b08040';
    rr(c, 9, 2, 5.5, 16, 2.5); c.fillStyle = g; c.fill(); // palec wskazujący
    for (const [x, y] of [[14, 10], [18, 11], [22, 13]]) { rr(c, x, y, 4.5, 9, 2); c.fillStyle = d; c.fill(); }
    fillPoly(c, [[4, 15], [7, 13], [10, 18], [9, 22]], g); rr(c, 7, 15, 19, 11, 4); c.fillStyle = g; c.fill();
    limb(c, 10.5, 4, 10.5, 14, 1, '#fff0c0'); c.fillStyle = '#9aa0ac'; c.fillRect(8, 25, 17, 5); c.fillStyle = '#d8dce4'; c.fillRect(8, 25, 17, 1.6);
  } },
  move: { hot: [16, 16], fb: 'pointer', draw(c) { cursorHorse(c, '#e8c060', '#8a5a1e'); } },
  far: { hot: [16, 16], fb: 'pointer', draw(c) { cursorHorse(c, '#a8a4a0', '#5a5650'); } },
  attack: { hot: [16, 16], fb: 'crosshair', draw(c) {
    limb(c, 7, 25, 25, 7, 3.4, '#d8dce4'); fillPoly(c, [[23.5, 5.5], [28.5, 3.5], [26.5, 8.5]], '#ffffff'); limb(c, 9, 22, 24, 7, 1, '#ffffff');
    limb(c, 5, 19, 13, 27, 3, '#e0b24a'); limb(c, 7, 25, 3.5, 28.5, 3, '#6a4424'); circ(c, 3, 29, 2, '#e0b24a');
  } },
  shoot: { hot: [16, 16], fb: 'crosshair', draw(c) {
    limb(c, 5, 27, 24, 8, 1.8, '#9a6a3a'); fillPoly(c, [[21, 6], [28, 4], [26, 11]], '#dfe3ea');
    fillPoly(c, [[5, 27], [3, 20], [8, 24]], '#d84a3a'); fillPoly(c, [[5, 27], [12, 29], [8, 24]], '#f07a5a');
  } },
  visit: { hot: [16, 16], fb: 'pointer', draw(c) {
    c.fillStyle = '#8a8478'; c.fillRect(4, 10, 24, 19); fillPoly(c, [[4, 10], [4, 5], [8, 5], [8, 8], [12, 8], [12, 5], [20, 5], [20, 8], [24, 8], [24, 5], [28, 5], [28, 10]], '#a8a296');
    c.fillStyle = '#3a2410'; c.beginPath(); c.moveTo(10, 29); c.lineTo(10, 18); c.arc(16, 18, 6, Math.PI, 0); c.lineTo(22, 29); c.fill();
    c.fillStyle = '#e8c060'; c.fillRect(15, 20, 2, 9); circ(c, 16, 14, 1.4, '#ffd060');
  } },
  boat: { hot: [16, 16], fb: 'pointer', draw(c) {
    c.lineCap = 'round'; c.strokeStyle = '#d8dce4'; c.lineWidth = 3; c.beginPath(); c.arc(16, 6, 3, 0, TAU); c.stroke();
    limb(c, 16, 9, 16, 27, 3, '#d8dce4'); limb(c, 10, 13, 22, 13, 3, '#d8dce4'); c.beginPath(); c.arc(16, 17, 11, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
  } },
  spell: { hot: [16, 16], fb: 'crosshair', draw(c) {
    fillPoly(c, [[16, 2], [19, 13], [30, 16], [19, 19], [16, 30], [13, 19], [2, 16], [13, 13]], '#b890ff'); fillPoly(c, [[16, 8], [18, 14], [24, 16], [18, 18], [16, 24], [14, 18], [8, 16], [14, 14]], '#e8d8ff');
    circ(c, 16, 16, 2, '#ffffff'); circ(c, 26, 5, 1.6, '#e8d8ff'); circ(c, 6, 26, 1.3, '#e8d8ff');
  } },
  fly: { hot: [16, 16], fb: 'pointer', draw(c) {
    fillPoly(c, [[4, 24], [8, 12], [16, 5], [28, 3], [24, 9], [28, 10], [22, 15], [26, 17], [18, 21], [20, 23], [10, 25]], '#f0ecf4');
    limb(c, 6, 23, 22, 7, 1, '#b8b0c8'); limb(c, 9, 23, 20, 14, 1, '#b8b0c8');
  } },
  no: { hot: [16, 16], fb: 'not-allowed', draw(c) { c.strokeStyle = '#d83a2a'; c.lineWidth = 4; c.beginPath(); c.arc(16, 16, 11, 0, TAU); c.stroke(); limb(c, 8.5, 8.5, 23.5, 23.5, 4, '#d83a2a'); } },
  grab: { hot: [16, 16], fb: 'grabbing', draw(c) {
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const tx = 16 + dx * 13, ty = 16 + dy * 13, px = -dy, py = dx; fillPoly(c, [[tx, ty], [tx - dx * 6 + px * 5, ty - dy * 6 + py * 5], [tx - dx * 6 - px * 5, ty - dy * 6 - py * 5]], '#e8c060'); }
    limb(c, 16, 6, 16, 26, 2.4, '#e8c060'); limb(c, 6, 16, 26, 16, 2.4, '#e8c060'); circ(c, 16, 16, 2.4, '#fff0b0');
  } },
};
// Głowa konia (ruch po mapie i w bitwie), jak kursor ruchu w klasycznych grach o bohaterach
function cursorHorse(c, col, mane) {
  fillPoly(c, [[9, 29], [10, 18], [6, 14], [7, 8], [12, 4], [15, 1], [16, 5], [21, 6], [28, 13], [28, 17], [25, 18], [20, 15], [18, 20], [21, 29]], col);
  fillPoly(c, [[12, 4], [15, 1], [16, 5], [11, 13], [10, 20], [9, 29], [6, 29], [7, 17], [5, 12]], mane);
  circ(c, 19, 9.5, 1.3, '#1a0e06'); circ(c, 26, 15, 0.9, '#1a0e06'); limb(c, 14, 7, 12, 14, 0.8, LT(col, 0.35));
}
let CURSOR_CSS = {}; PIX_CLEAR.push(() => { CURSOR_CSS = {}; G._cursor = null; });
// Miecz obrócony w stronę ciosu: 'attack0'…'attack11' co 30° (0 = w prawo, zgodnie z ruchem wskazówek zegara na ekranie)
function cursorDef(kind) {
  const m = /^attack(\d+)$/.exec(kind); if (!m) return CURSORS[kind] || CURSORS.arrow;
  const a = +m[1] * Math.PI / 6 + Math.PI / 4; // narysowany miecz celuje w górę i w prawo (−45°)
  return { hot: [16, 16], fb: 'crosshair', draw(c) { c.translate(16, 16); c.rotate(a); c.translate(-16, -16); CURSORS.attack.draw(c); } };
}
function cursorCss(kind) {
  if (CURSOR_CSS[kind]) return CURSOR_CSS[kind];
  const C = cursorDef(kind), s = sprite(`cursor_${kind}`, 16, 16, 0, 0, C.draw, OUTLINE, 0.5);
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const g = cv.getContext('2d'); g.imageSmoothingEnabled = !PIXEL_ART; g.drawImage(s.c, 0, 0, 32, 32);
  return (CURSOR_CSS[kind] = `url(${cv.toDataURL()}) ${C.hot[0]} ${C.hot[1]}, ${C.fb}`);
}
// Ustawia kursor (tylko gdy się zmienił: podmiana obrazu kursora co klatkę kosztowałaby przeglądarkę)
function setCursor(kind) {
  if (!G.canvas || G._cursor === kind) return; G._cursor = kind;
  try { G.canvas.style.cursor = cursorCss(kind); } catch (e) { G.canvas.style.cursor = cursorDef(kind).fb; }
}
// Mapa przygody: co pokazuje kursor nad polem (x, y) dla wybranego bohatera
function adventureCursor(st, x, y) {
  const h = hero(st); if (!h || !st.map) return 'arrow';
  const { tx, ty } = pickTile(st, x, y), n = st.map.n; if (tx < 0 || ty < 0 || tx >= n || ty >= n) return 'arrow';
  const i = ty * n + tx; if (!human(st).explored[i]) return 'no';
  const oh = heroAt(st, tx, ty); if (oh) return oh === h ? 'arrow' : oh.owner === h.owner ? 'visit' : 'attack';
  const ob = objectAt(st, i);
  if (ob) { if (ob.type === 'monster') return 'attack'; if (ob.type === 'town') return st.towns[ob.townId].owner === h.owner ? 'visit' : 'attack'; if (ob.type === 'boat') return 'boat'; return 'visit'; }
  if (!passableTile(st, tx, ty, h)) return 'no';
  const gd = st.guard && st.guard[i], gm = gd && st.objects[gd - 1]; if (gm && !gm.dead && gm.type === 'monster') return 'attack'; // pole w zasięgu strażnika: wejście to walka
  if (h.path && h.path.length) { const e = h.path[h.path.length - 1]; if (e[0] === tx && e[1] === ty && pathCostMp(st, h) > h.mp) return 'far'; }
  return 'move';
}
// Koszt całej wyznaczonej ścieżki (punkty ruchu)
function pathCostMp(st, h) { let c = 0, px = h.x, py = h.y; for (const [x, y] of h.path) { c += stepCost(st.map, px, py, x, y, h); px = x; py = y; } return c; }
// Bitwa: kursor z podglądu akcji pod myszą
function battleCursor(scr) {
  const p = scr.preview, u = scr.B && scr.B.active; if (!p) return scr.casting ? 'no' : 'arrow';
  if (p.kind === 'move') return u && hasAb(u, 'fly') ? 'fly' : 'move';
  if (p.kind === 'attack') { // miecz wskazuje kierunek ciosu: od pola, z którego oddział uderzy, do celu
    const [fx, fy] = hexCenter(...p.from), a = Math.atan2(p.target.py - fy, p.target.px - fx);
    return 'attack' + ((Math.round(a / (Math.PI / 6)) + 12) % 12);
  }
  return { attack: 'attack', shoot: 'shoot', cast: 'spell', heal: 'spell', nocast: 'no', far: 'no', info: 'arrow' }[p.kind] || 'arrow';
}
