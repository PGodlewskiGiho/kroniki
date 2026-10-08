// ==================== OZDOBY I IKONY INTERFEJSU Z MODELI 3D (narzędzie, nie trafia do gry) ======================
// Złote okucia (narożniki okien, nity, medaliony przycisków, separator) i ikony przycisków panelu mapy.
// Wszystko w płaszczyźnie xy, przodem do +z; render z przodu (to samo studio i światło co jednostki i obiekty mapy).
// Wypalanie: tools/grafika3d/wypal-interfejs.js -> src/grafika/interfejs.webp + interfejs.json.
/* global THREE, G3, mat, mesh, sph, cyl, cone, box, rbox, torus, lathe, tube, slab, chunk, DK, LT, arGrp, arRot, arGem, arCab, arCrown, arBook, arBoots */
const UI_GOLD = '#dcb35c', UI_GOLD_D = '#a8823a', UI_IRON = '#3a3640', UI_GEM = '#b8222a';
// Narożnik okna (lewy górny; pozostałe przez odbicie): listwy wzdłuż krawędzi, wąsy z kulkami, romb z kamieniem
function uiCorner() {
  const g = new THREE.Group(), L = 2.3;
  for (const [x, y, w, h] of [[L / 2 - 0.1, 0, L, 0.2], [0, -L / 2 + 0.1, 0.2, L]]) g.add(rbox(w, h, 0.16, 0.05, UI_GOLD, 'gold', [x, y, 0]));
  for (const [x, y, w, h] of [[L * 0.42, -0.24, L * 0.75, 0.07], [-0.24 + 0, -L * 0.42 + 0, 0.07, L * 0.75]]) g.add(rbox(w, h, 0.09, 0.02, UI_GOLD_D, 'gold', [x + (w > h ? 0.12 : 0), y - (h > w ? 0.12 : 0), 0.02]));
  for (const s of [1, -1]) { // dwa wąsy: z rogu po skosie i zawinięte, zakończone kulką
    const P = s > 0 ? [[0.25, -0.25, 0.05], [0.75, -0.35, 0.08], [1.15, -0.55, 0.08], [1.3, -0.8, 0.06], [1.15, -0.95, 0.05]] : [[0.25, -0.25, 0.05], [0.35, -0.75, 0.08], [0.55, -1.15, 0.08], [0.8, -1.3, 0.06], [0.95, -1.15, 0.05]];
    g.add(tube(P, 0.07, 0.045, UI_GOLD, 'gold')); g.add(sph(0.09, UI_GOLD, 'gold', P[P.length - 1]));
    const Q = s > 0 ? [[1.25, -0.08, 0.05], [1.55, -0.2, 0.06], [1.75, -0.12, 0.05]] : [[-0.08, -1.25, 0.05], [-0.2, -1.55, 0.06], [-0.12, -1.75, 0.05]]; g.add(tube(Q, 0.05, 0.03, UI_GOLD, 'gold')); }
  const d = rbox(0.62, 0.62, 0.22, 0.08, UI_GOLD, 'gold', [0.05, -0.05, 0.06], [0, 0, Math.PI / 4]); g.add(d); g.add(torus(0.21, 0.04, LT(UI_GOLD, 0.2), 'gold', [0.05, -0.05, 0.17]));
  g.add(arCab(0.17, UI_GEM, [0.05, -0.05, 0.2])); return g;
}
const uiRivet = () => arGrp(sph(0.5, UI_GOLD, 'gold', [0, 0, 0], [1, 1, 0.55], 24), torus(0.5, 0.08, UI_GOLD_D, 'gold', [0, 0, -0.05]));
// Medalion przycisku-ikony: złoty pierścień z czterema nitami i ciemnym, wklęsłym środkiem (ikonę gra rysuje na nim)
function uiMedal() {
  const g = new THREE.Group(); g.add(torus(1.0, 0.15, UI_GOLD, 'gold', [0, 0, 0], null, null)); g.add(torus(0.83, 0.05, UI_GOLD_D, 'gold', [0, 0, 0.02]));
  g.add(cyl(0.86, 0.86, 0.08, '#24180f', 'leather', [0, 0, -0.04], [Math.PI / 2, 0, 0], null, 48));
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(sph(0.07, LT(UI_GOLD, 0.2), 'gold', [Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.13])); } return g;
}
// Separator: środkowa ozdoba (romb z kamieniem, wąsy na boki); listwy po bokach gra rysuje sama (dowolna szerokość)
function uiDivider() {
  const g = new THREE.Group(); g.add(rbox(0.5, 0.5, 0.2, 0.07, UI_GOLD, 'gold', [0, 0, 0], [0, 0, Math.PI / 4])); g.add(arCab(0.14, UI_GEM, [0, 0, 0.13]));
  for (const s of [-1, 1]) { g.add(tube([[s * 0.3, 0, 0], [s * 0.7, 0.18, 0.04], [s * 1.05, 0.05, 0.04], [s * 1.2, -0.12, 0.03]], 0.06, 0.035, UI_GOLD, 'gold')); g.add(sph(0.07, UI_GOLD, 'gold', [s * 1.2, -0.12, 0.03]));
    g.add(tube([[s * 0.3, 0, 0], [s * 0.7, -0.15, 0.03], [s * 1.0, -0.2, 0.03]], 0.045, 0.025, UI_GOLD_D, 'gold')); g.add(rbox(1.0, 0.07, 0.07, 0.02, UI_GOLD, 'gold', [s * 1.75, 0, 0])); g.add(cone(0.08, 0.22, UI_GOLD, 'gold', [s * 2.35, 0, 0], [0, 0, -s * Math.PI / 2], 4)); }
  return g;
}
// --- ikony przycisków ---
const uiChevron = col => slab([[-0.5, 0.9], [0.0, 0.9], [0.6, 0], [0.0, -0.9], [-0.5, -0.9], [0.1, 0]], 0.22, col, 'gold', [0, 0, 0], null, null, 0.4);
const UI3 = {
  corner_tl: () => uiCorner(), rivet: uiRivet, medal: uiMedal, divider: uiDivider,
  ic_crown: () => arCrown({ col: '#e8c050', gem: '#d83a3a' }),
  ic_next: () => { const g = new THREE.Group(), a = uiChevron('#f4d070'), b = uiChevron('#f4d070'); a.position.x = -0.45; b.position.x = 0.45; g.add(a, b); return g; },
  ic_move: () => { const b = arBoots({ col: '#8a5a2a', gem: '#c8a040' }, { cuff: '#c8a040' }); return b; },
  ic_sleep: () => { const g = new THREE.Group(), P = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * 0.35 + i / 24 * Math.PI * 1.3; P.push([Math.cos(a) * 1.1, Math.sin(a) * 1.1]); } for (let i = 24; i >= 0; i--) { const a = Math.PI * 0.35 + i / 24 * Math.PI * 1.3; P.push([Math.cos(a) * 0.82 - 0.35, Math.sin(a) * 0.9]); }
    g.add(slab(P, 0.2, '#d8dcf0', 'gem', [0, 0, 0], null, null, 0.6)); g.add(slab([[0, 0], [0.45, 0], [0.05, -0.45], [0.45, -0.45], [0.45, -0.55], [-0.05, -0.55], [0.35, -0.1], [0, -0.1]], 0.08, '#e8c050', 'gold', [0.55, 0.95, 0.1])); return g; },
  ic_book: () => arBook({ col: '#5a2a7a', gem: '#e8c050' }),
  ic_gear: () => { const g = new THREE.Group(), c = '#b8bcc8'; g.add(cyl(0.75, 0.75, 0.3, c, 'steel', [0, 0, 0], [Math.PI / 2, 0, 0], null, 32)); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; g.add(rbox(0.32, 0.36, 0.3, 0.04, c, 'steel', [Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0], [0, 0, a + Math.PI / 2])); }
    g.add(cyl(0.3, 0.3, 0.34, '#2a2630', 'iron', [0, 0, 0.02], [Math.PI / 2, 0, 0], null, 24)); g.add(torus(0.5, 0.05, '#e8c050', 'gold', [0, 0, 0.17])); return g; },
  ic_dig: () => { const g = new THREE.Group(); g.add(cyl(0.07, 0.07, 2.2, '#8a5a2a', 'wood', [0, 0.35, 0])); g.add(rbox(0.5, 0.12, 0.12, 0.04, '#5a3a20', 'wood', [0, 1.45, 0])); g.add(slab([[-0.38, 0.1], [0.38, 0.1], [0.4, -0.6], [0, -1.0], [-0.4, -0.6]], 0.06, '#9aa2ae', 'steel', [0, -0.85, 0])); g.add(arCab(0.06, '#e8c050', [0, -0.55, 0.05])); return arRot(g, 0, 0.2, -0.6); },
  ic_puzzle: () => { const g = new THREE.Group(), P = [[-0.8, -0.8], [-0.15, -0.8]]; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; P.push([Math.cos(a) * 0.25, -0.8 + Math.sin(a) * -0.28 - 0.2]); } P.push([0.15, -0.8], [0.8, -0.8], [0.8, -0.15]); for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI; P.push([0.8 + 0.2 + Math.cos(a) * 0.28, Math.sin(a) * 0.25]); } P.push([0.8, 0.15], [0.8, 0.8], [-0.8, 0.8]);
    g.add(slab(P, 0.16, '#e2c98e', 'cloth', [0, 0, 0], null, null, 0.5)); g.add(slab([[-0.5, 0.45], [-0.3, 0.45], [0.1, 0.05], [-0.1, 0.05]], 0.04, '#c83a2a', 'cloth', [0, 0, 0.12])); g.add(slab([[-0.1, 0.45], [0.1, 0.45], [-0.3, 0.05], [-0.5, 0.05]], 0.04, '#c83a2a', 'cloth', [0, 0, 0.12])); return arRot(g, 0, 0.2, 0.1); },
  ic_stairs: () => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) g.add(rbox(1.6 - i * 0.0, 0.35, 0.5, 0.05, i % 2 ? '#a8a294' : '#bab4a6', 'stone', [0.3 * i - 0.4, 0.55 - i * 0.35, -i * 0.3])); g.add(slab([[-0.2, 0.6], [0.2, 0.6], [0.2, 0.0], [0.45, 0.0], [0, -0.45], [-0.45, 0.0], [-0.2, 0.0]], 0.1, '#e8c050', 'gold', [0.9, 0.5, 0.4])); return arRot(g, 0.1, 0.4, 0); },
  ic_hourglass: () => { const g = new THREE.Group(); for (const y of [1.05, -1.05]) g.add(rbox(1.3, 0.18, 1.3, 0.05, '#6a4426', 'wood', [0, y, 0])); for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) g.add(cyl(0.06, 0.06, 2.0, '#8a5a2a', 'wood', [x, 0, z]));
    const gl = lathe([[0.01, 0.95], [0.45, 0.9], [0.42, 0.4], [0.1, 0.05], [0.1, -0.05], [0.42, -0.4], [0.45, -0.9], [0.01, -0.95]], '#d8e8f0', 'gem'); gl.material = gl.material.clone(); Object.assign(gl.material, { transparent: true, opacity: 0.35, depthWrite: false }); g.add(gl);
    g.add(lathe([[0.01, -0.92], [0.4, -0.88], [0.32, -0.45], [0.01, -0.3]], '#e8c060', 'cloth')); g.add(lathe([[0.01, 0.12], [0.18, 0.3], [0.3, 0.55], [0.01, 0.55]], '#e8c060', 'cloth')); return arRot(g, 0.15, 0.4, 0); },
  ic_sword: () => arRot(arSwordIcon(), 0, 0, 0), ic_shield: () => arShield({ col: '#4a6aa0', gem: '#e8c050' }, { rim: '#c8a040', gem: true, gemY: 0.2 }),
};
UI3.ic_orb = () => arOrb({ col: '#7aa8ff', gem: '#e8c050' }, { ring: true });
UI3.ic_scroll = () => { const g = new THREE.Group(), pg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0, 1, 12), mat('#f0e2b8', 'cloth').clone()); pg.material.side = THREE.DoubleSide; g.add(pg);
  for (const y of [1.05, -1.05]) { g.add(cyl(0.18, 0.18, 1.8, '#e8d8a8', 'cloth', [0, y, 0.06], [0, 0, Math.PI / 2], null, 20)); for (const x of [-1.0, 1.0]) g.add(sph(0.14, '#c8a040', 'gold', [x, y, 0.06])); }
  for (let i = 0; i < 5; i++) g.add(box(i === 4 ? 0.7 : 1.1, 0.05, 0.02, '#6a5434', 'cloth', [i === 4 ? -0.2 : 0, 0.6 - i * 0.28, 0.03])); g.add(arCab(0.13, '#c83a2a', [0.45, -0.75, 0.05])); return arRot(g, 0, -0.3, 0.1); };
// Pierścień portretu (medalion bez środka) i ikony przycisków: strzałki, plus, minus, zamiana
UI3.ring = () => { const g = new THREE.Group(); g.add(torus(1.0, 0.13, UI_GOLD, 'gold', [0, 0, 0])); g.add(torus(0.86, 0.04, UI_GOLD_D, 'gold', [0, 0, 0.03])); for (let i = 0; i < 4; i++) { const a = Math.PI / 2 + i * Math.PI / 2; g.add(sph(0.08, LT(UI_GOLD, 0.25), 'gold', [Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.12])); } return g; };
const uiArrow = () => slab([[0, 1.0], [0.9, 0.05], [0.35, 0.05], [0.35, -0.9], [-0.35, -0.9], [-0.35, 0.05], [-0.9, 0.05]], 0.25, '#f0cc66', 'gold', [0, 0, 0], null, null, 0.45);
UI3.ic_up = () => uiArrow(); UI3.ic_down = () => arRot(uiArrow(), 0, 0, Math.PI); UI3.ic_left = () => arRot(uiArrow(), 0, 0, Math.PI / 2); UI3.ic_right = () => arRot(uiArrow(), 0, 0, -Math.PI / 2);
UI3.ic_plus = () => arGrp(rbox(1.8, 0.5, 0.3, 0.1, '#f0cc66', 'gold', [0, 0, 0]), rbox(0.5, 1.8, 0.3, 0.1, '#f0cc66', 'gold', [0, 0, 0]));
UI3.ic_minus = () => arGrp(rbox(1.8, 0.5, 0.3, 0.1, '#f0cc66', 'gold', [0, 0, 0]), rbox(0.02, 1.8, 0.02, 0.005, '#000', 'gold', [0, 0, -0.3]));
UI3.ic_swap = () => { const g = new THREE.Group(), a = uiArrow(), b = arRot(uiArrow(), 0, 0, Math.PI); a.scale.setScalar(0.7); b.scale.setScalar(0.7); a.position.set(-0.45, 0.1, 0); b.position.set(0.45, -0.1, 0); g.add(a, b); return g; };
// Ekran nowej gry: mapa (rozmiar świata), hełm (człowiek), kostka (losowo), skrzynia (bonus: artefakt)
UI3.ic_map = () => { const g = new THREE.Group(), pg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.5, 1, 1), mat('#ecd9a8', 'cloth').clone()); pg.material.side = THREE.DoubleSide; g.add(pg);
  for (const x of [-1.05, 1.05]) { g.add(cyl(0.16, 0.16, 1.62, '#e2cc94', 'cloth', [x, 0, 0.06], null, null, 20)); for (const y of [-0.85, 0.85]) g.add(sph(0.12, '#8a5a2a', 'wood', [x, y, 0.06])); }
  g.add(slab([[-0.85, 0.55], [-0.2, 0.62], [0.1, 0.3], [-0.05, -0.1], [-0.5, -0.25], [-0.85, 0.0]], 0.03, '#6a9a4a', 'cloth', [0, 0, 0.02])); // ląd
  g.add(slab([[0.2, -0.05], [0.8, 0.05], [0.85, -0.55], [0.3, -0.6], [0.05, -0.35]], 0.03, '#4a7ab0', 'cloth', [0, 0, 0.02])); // jezioro
  for (const [x, y] of [[-0.55, 0.25], [-0.35, 0.35]]) g.add(cone(0.12, 0.26, '#7a6a58', 'stone', [x, y, 0.08], [Math.PI / 2, 0, 0], 4));
  for (let i = 0; i < 5; i++) g.add(sph(0.035, '#a83020', 'cloth', [-0.3 + i * 0.13, -0.35 - Math.sin(i) * 0.08, 0.05]));
  g.add(arGrp(rbox(0.26, 0.06, 0.03, 0.01, '#a83020', 'cloth', [0.45, 0.45, 0.06], [0, 0, 0.78]), rbox(0.26, 0.06, 0.03, 0.01, '#a83020', 'cloth', [0.45, 0.45, 0.06], [0, 0, -0.78])));
  return arRot(g, -0.35, -0.25, 0.05); };
UI3.ic_helm = () => arRot(arHelm({ col: '#c8ccd6', gem: '#d83a3a' }), 0.05, 0.5, 0);
UI3.ic_dice = () => { const g = new THREE.Group(); g.add(rbox(1.4, 1.4, 1.4, 0.22, '#f2ead8', 'marble', [0, 0, 0]));
  const pip = (x, y, z) => g.add(sph(0.14, '#2a1a10', 'iron', [x, y, z], [1, 1, 0.4]));
  pip(0, 0, 0.71); for (const [a, b] of [[-0.35, 0.35], [0.35, -0.35]]) pip(0.71, a, b); for (const [a, b] of [[-0.38, -0.38], [0, 0], [0.38, 0.38], [-0.38, 0.38], [0.38, -0.38]]) g.add(sph(0.13, '#a82a1a', 'iron', [a, 0.71, b], [1, 0.4, 1]));
  return arRot(g, 0.55, 0.65, 0); };
UI3.ic_chest = () => arRot(arBag({ col: '#8a5a2a', gem: '#e8c050' }, { chest: true }), 0.35, 0.6, 0);
function arSwordIcon() { return arSword({ col: '#dfe3ea', gem: '#d84a3a' }, { guardCol: '#c8a040' }); }
// Render: bryła wyśrodkowana i dopasowana do prostokąta w×h (pikseli), z marginesem
// Ikony surowców: kupki z mapy (mapa3d.js) oglądane z ukosa z góry (view), jak bryłki na pasku surowców w H3
// Ikony surowców: bryły jak kupki z mapy (mapa3d.js), ale pełniejsze i czytelne w małym rozmiarze; oglądane z ukosa z góry (view)
function uiRes(r) {
  const g = new THREE.Group(), R = rng(r.length * 31 + 7);
  const heap = (n, rad, col, kind, sz, h0 = 0.04, cols) => { for (let i = 0; i < n; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * rad, y = h0 + (rad - d) * 0.75 + R() * 0.03, s = sz * (0.75 + R() * 0.5); g.add(chunk(s, s * 0.8, s * 0.9, cols ? cols[i % cols.length] : col, kind, [Math.cos(a) * d, y, Math.sin(a) * d * 0.8], [R(), R(), R()], i + 3, 10)); } };
  if (r === 'wood') return mpRes('wood');
  if (r === 'mercury') return mpRes('mercury');
  if (r === 'ore') { heap(14, 0.24, '#6a6a72', 'stone', 0.085, 0.04, ['#6a6a72', '#7a7a82', '#8a5a48', '#5a5a62']); for (let i = 0; i < 4; i++) g.add(sph(0.022, '#d8dce8', 'steel', [(R() - 0.5) * 0.3, 0.16 + R() * 0.06, 0.12])); }
  else if (r === 'sulfur') { heap(16, 0.24, '#e0c83a', 'stone', 0.075, 0.04, ['#e8d040', '#d8b828', '#f4e070']); for (let i = 0; i < 4; i++) g.add(cone(0.035, 0.12, '#fff07a', 'gem', [(R() - 0.5) * 0.25, 0.22 + R() * 0.04, (R() - 0.3) * 0.15], [R() - 0.5, 0, R() - 0.5], 5)); }
  else if (r === 'crystal') { g.add(chunk(0.24, 0.08, 0.18, '#5a5660', 'stone', [0, 0.05, 0], null, 4, 12));
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, q = i ? 1 : 0, h = i ? 0.2 + R() * 0.1 : 0.45; g.add(cone(i ? 0.05 : 0.085, h, i % 2 ? '#ff5050' : '#d82a2a', 'gem', [Math.cos(a) * 0.12 * q, 0.1 + h / 2, Math.sin(a) * 0.09 * q], [Math.sin(a) * 0.45 * q, 0, -Math.cos(a) * 0.45 * q], 6)); } }
  else if (r === 'gems') { const cols = ['#40c070', '#3a80e0', '#c060e0', '#e03a3a', '#f4f4ff', '#f0c040'];
    for (let i = 0; i < 16; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * 0.22, y = 0.05 + (0.22 - d) * 0.6; g.add(mesh(new THREE.OctahedronGeometry(0.06, 0), cols[i % 6], 'gem', [Math.cos(a) * d, y, Math.sin(a) * d * 0.8], [R() * 3, R() * 3, 0])); }
    g.add(mesh(new THREE.OctahedronGeometry(0.11, 0), '#40d080', 'gem', [0, 0.24, 0.02], [0.3, 0.6, 0], [1, 1.25, 1])); }
  else if (r === 'gold') { for (const [x, z, n] of [[-0.15, -0.05, 6], [0.12, -0.08, 8], [0.02, 0.1, 4]]) for (let i = 0; i < n; i++) g.add(cyl(0.075, 0.075, 0.022, i % 2 ? '#f0c040' : '#e0b030', 'gold', [x + (R() - 0.5) * 0.01, 0.012 + i * 0.024, z], null, null, 18));
    for (let i = 0; i < 9; i++) { const a = R() * 6.28, d = 0.18 + R() * 0.1; g.add(cyl(0.07, 0.07, 0.02, '#f0c040', 'gold', [Math.cos(a) * d, 0.012, Math.sin(a) * d * 0.7], [R() * 0.5, 0, R() * 0.5], null, 18)); }
    g.add(rbox(0.24, 0.07, 0.1, 0.015, '#f4c848', 'gold', [0.05, 0.035, 0.2], [0, 0.4, 0])); }
  return g;
}
for (const r of ['wood', 'ore', 'mercury', 'sulfur', 'crystal', 'gems', 'gold']) UI3['res_' + r] = () => uiRes(r);
function renderUi(key, w, h, mirror, view) {
  const f = UI3[key.replace(/_(tr|bl|br)$/, '_tl')]; if (!f) return null; const g = f(); if (mirror) g.scale.set(mirror[0], mirror[1], 1);
  const wrap = new THREE.Group(); wrap.add(g); const b = new THREE.Box3().setFromObject(wrap), c = b.getCenter(new THREE.Vector3()), z = b.getSize(new THREE.Vector3());
  g.position.sub(c); const k = Math.min((w - 4) / z.x, (h - 4) / z.y);
  if (view) { const v = new THREE.Group(); v.add(wrap); wrap.rotation.y = view.yaw || 0; v.rotation.x = view.pitch || 0; const p = new THREE.Group(); p.add(v); const b2 = new THREE.Box3().setFromObject(p), c2 = b2.getCenter(new THREE.Vector3()), z2 = b2.getSize(new THREE.Vector3()); v.position.sub(c2); const k2 = Math.min((w - 4) / z2.x, (h - 4) / z2.y); return G3.render(p, w, h, k2, w / 2, h / 2, { raw: true, yaw: 0, pitch: 0.001 }); }
  return G3.render(wrap, w, h, k, w / 2, h / 2, { raw: true, yaw: 0, pitch: 0.001 });
}
