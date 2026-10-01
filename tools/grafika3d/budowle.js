// ==================== MODELE 3D BUDOWLI MIAST (narzędzie, nie trafia do gry) =============================
// Budowle scen miast z brył (mury z ciosów, cegły i tynku z belkami, dachy z dachówki i gontu, wieże, blanki, okna, drzwi),
// renderowane tym samym światłem co jednostki (modele.js) i wypalane do arkuszy (wypal-miasta.js). Wzorem są rysunki 2D z gry
// (BUILD_ART, galeria-miast.js pokazuje oba obok siebie). Układ: fasada patrzy w +z (do widza), x w prawo, y w górę.
// Wymiary w pikselach sceny (jak w rysunkach 2D: szerokość i wysokość miejsca), model skalowany do świata: 1 = PXU px.
/* global THREE, TOWNS */
const PXU = 30;
// --- faktury architektury (szare, mnożą kolor materiału; służą też za wypukłość) ---
function archTex(kind) {
  if (TEX[kind]) return TEX[kind];
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N * 2; const g = c.getContext('2d'), R = rng(kind.length * 131 + kind.charCodeAt(1) * 7); g.scale(2, 2); // rysunek 256, płótno 512: ostrzejsza faktura
  const grey = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`, noise = (a, b, k = 1) => { for (let i = 0; i < N * N / 3 * k; i++) { g.fillStyle = grey(a + R() * (b - a)); g.fillRect(R() * N | 0, R() * N | 0, 1 + (R() * 2 | 0), 1); } };
  const blocks = (rowH, w0, w1, mortar, bev) => { // mur z bloków: rzędy, losowe szerokości, jaśniejsza górna krawędź, ciemna spoina
    for (let y = 0; y < N; y += rowH) { let x = -R() * w0; while (x < N) { const w = w0 + R() * (w1 - w0), v = 168 + R() * 70; g.fillStyle = grey(v); g.fillRect(x, y, w, rowH);
      g.fillStyle = grey(Math.min(255, v + 34), 0.8); g.fillRect(x, y, w, bev); g.fillRect(x, y, bev, rowH); g.fillStyle = grey(v - 46, 0.7); g.fillRect(x, y + rowH - bev, w, bev); g.fillRect(x + w - bev, y, bev, rowH);
      g.fillStyle = grey(mortar); g.fillRect(x + w - 1, y, 2, rowH); x += w; } g.fillStyle = grey(mortar); g.fillRect(0, y + rowH - 1, N, 2); }
    noise(0, 255, 0.25); g.globalAlpha = 0.35; noise(120, 200, 0.6); g.globalAlpha = 1; };
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, N, N);
  switch (kind) {
    case 'ashlar': blocks(32, 44, 76, 70, 3); break; // ciosy
    case 'brick': blocks(16, 30, 36, 90, 2); break;
    case 'rubble': for (let i = 0; i < 90; i++) { const x = R() * N, y = R() * N, r = 10 + R() * 16, v = 150 + R() * 80; g.fillStyle = grey(v); g.beginPath(); g.ellipse(x, y, r, r * 0.7, R() * 3, 0, Math.PI * 2); g.fill(); g.strokeStyle = grey(70); g.lineWidth = 2; g.stroke(); } noise(0, 255, 0.3); break;
    case 'plaster': noise(200, 245, 1.2); for (let i = 0; i < 26; i++) { const x = R() * N, y = R() * N, r = 10 + R() * 30, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${0.06 + R() * 0.1})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } break;
    case 'planks': for (let x = 0; x < N; x += 32) { const v = 160 + R() * 70; g.fillStyle = grey(v); g.fillRect(x, 0, 32, N); for (let k = 0; k < 14; k++) { g.fillStyle = grey(v - 30 - R() * 40, 0.5); g.fillRect(x + 3 + R() * 26, 0, 1, N); } g.fillStyle = grey(50); g.fillRect(x, 0, 2, N); }
      for (let i = 0; i < 10; i++) { g.fillStyle = grey(70); g.beginPath(); g.arc(R() * N, R() * N, 2, 0, 7); g.fill(); } break;
    case 'tiles': for (let y = 0; y < N; y += 16) for (let x = -(y / 16 % 2) * 12; x < N; x += 24) { const v = 150 + R() * 80, gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, grey(v - 50)); gr.addColorStop(0.35, grey(v + 20)); gr.addColorStop(1, grey(v - 10)); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 24, y); g.lineTo(x + 24, y + 12); g.quadraticCurveTo(x + 12, y + 18, x, y + 12); g.closePath(); g.fill(); g.strokeStyle = grey(60, 0.8); g.lineWidth = 1.5; g.stroke(); } break; // dachówka (rzędy łusek)
    case 'shingle': for (let y = 0; y < N; y += 14) for (let x = -(y / 14 % 2) * 10; x < N; x += 20) { const v = 140 + R() * 90; g.fillStyle = grey(v); g.fillRect(x, y, 19, 14); g.fillStyle = grey(v - 60); g.fillRect(x, y + 12, 20, 2); g.fillRect(x + 18, y, 2, 14); } noise(0, 255, 0.2); break;
    case 'thatch': for (let i = 0; i < 2600; i++) { const x = R() * N, y = R() * N, v = 120 + R() * 120; g.strokeStyle = grey(v, 0.8); g.lineWidth = 1 + R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y + 12 + R() * 10); g.stroke(); } for (let y = 0; y < N; y += 32) { g.fillStyle = grey(60, 0.5); g.fillRect(0, y, N, 3); } break;
    case 'cobble': for (let y = 0; y < N; y += 18) for (let x = -(y / 18 % 2) * 11; x < N; x += 22) { const v = 140 + R() * 90; g.fillStyle = grey(v); g.beginPath(); g.ellipse(x + 11, y + 9, 10, 8, 0, 0, 7); g.fill(); g.strokeStyle = grey(60); g.lineWidth = 1.5; g.stroke(); } break;
    case 'grass': g.fillStyle = grey(150); g.fillRect(0, 0, N, N); for (let i = 0; i < 26; i++) { const x = R() * N, y = R() * N, r = 20 + R() * 50, gr = g.createRadialGradient(x, y, 0, x, y, r), v = R() < 0.5 ? 110 : 190; gr.addColorStop(0, grey(v, 0.5)); gr.addColorStop(1, grey(v, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (let i = 0; i < 9000; i++) { const x = R() * N, y = R() * N, v = 70 + R() * 170; g.strokeStyle = grey(v, 0.7); g.lineWidth = 0.8 + R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y - 2 - R() * 5); g.stroke(); } break; // trawa: źdźbła i plamy
    case 'leaves': g.fillStyle = grey(110); g.fillRect(0, 0, N, N); for (let i = 0; i < 1400; i++) { const x = R() * N, y = R() * N, v = 70 + R() * 180, a = R() * 3; g.fillStyle = grey(v); g.beginPath(); g.ellipse(x, y, 5 + R() * 4, 2.5 + R() * 2, a, 0, 7); g.fill(); } break; // liście
    case 'dirt': noise(120, 220, 1.4); for (let i = 0; i < 300; i++) { const x = R() * N, y = R() * N, r = 1 + R() * 3, v = 80 + R() * 160; g.fillStyle = grey(v); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } break; // ubita ziemia z kamykami
    case 'rock': noise(110, 230, 1.2); for (let i = 0; i < 60; i++) { g.strokeStyle = grey(60, 0.6); g.lineWidth = 1 + R() * 2; let x = R() * N, y = R() * N; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 30; y += R() * 20; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 30; i++) { const x = R() * N, y = R() * N, r = 10 + R() * 30, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, grey(R() < 0.5 ? 80 : 220, 0.35)); gr.addColorStop(1, grey(128, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } break;
    default: noise(210, 255, 1);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  return (TEX[kind] = t);
}
// rodzaje materiałów budowli: [metaliczność, szorstkość, faktura, wypukłość]; faktura mapowana w pikselach sceny (archUV)
Object.assign(MK, { ashlar: [0, 0.88, 'ashlar', 1.6], brick: [0, 0.85, 'brick', 1.4], rubble: [0, 0.9, 'rubble', 2], plaster: [0, 0.92, 'plaster', 0.6], planks: [0, 0.8, 'planks', 1.3],
  tiles: [0, 0.7, 'tiles', 2.2], shingle: [0, 0.82, 'shingle', 1.8], thatch: [0, 0.95, 'thatch', 2.4], cobble: [0, 0.85, 'cobble', 1.8], grass: [0, 0.95, 'grass', 1.2], leaves: [0, 0.8, 'leaves', 2], dirt: [0, 0.95, 'dirt', 1.2], rock: [0, 0.9, 'rock', 2.4], copper: [0.75, 0.38, 'plate', 0.4], win: [0, 0.4, null, 0] });
for (const k of ['ashlar', 'brick', 'rubble', 'plaster', 'planks', 'tiles', 'shingle', 'thatch', 'cobble', 'grass', 'leaves', 'dirt', 'rock']) archTex(k);
// Gęstość faktury: jeden powtórzony kafel = TEXPX pikseli sceny (UV bryły przeliczane z jej wymiarów)
const TEXPX = { ashlar: 70, brick: 60, rubble: 80, plaster: 90, planks: 60, tiles: 50, shingle: 46, thatch: 70, cobble: 60 };
function archMat(col, kind) { const m = mat(col, kind, 1); if (kind === 'win') { m.emissive = new THREE.Color(col); m.emissiveIntensity = 0.9; } return m; }
// Świetlista płaszczyzna (wrota portalu, magiczne światło): sam blask, bez cieni
const lightMat = col => new THREE.MeshBasicMaterial({ color: col });
// UV pudełka w pikselach sceny: każda ściana dostaje faktury tyle, ile ma rozmiaru
function uvBox(geo, w, h, d, T) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / T, uv.getY(i) * dims[f][1] / T); }
}
const P = (x, y, z) => [x / PXU, y / PXU, z / PXU]; // piksele sceny -> świat
// Prostopadłościan w pikselach sceny: (x, y, z) = środek podstawy
function blk(w, h, d, col, kind, x = 0, y = 0, z = 0, rot) {
  const geo = new THREE.BoxGeometry(w / PXU, h / PXU, d / PXU); if (TEXPX[kind]) uvBox(geo, w, h, d, TEXPX[kind]);
  const m = new THREE.Mesh(geo, archMat(col, kind)); m.position.set(...P(x, y + h / 2, z)); if (rot) m.rotation.set(...rot); return m;
}
// Walec / stożek ścięty w pikselach (r0 dół, r1 góra), podstawa w y
function cyl3(r0, r1, h, col, kind, x = 0, y = 0, z = 0, seg = 20, open = false) {
  const geo = new THREE.CylinderGeometry(r1 / PXU, r0 / PXU, h / PXU, seg, 1, open); const T = TEXPX[kind];
  if (T) { const uv = geo.attributes.uv, c = Math.PI * 2 * Math.max(r0, r1); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * c / T, uv.getY(i) * h / T); }
  const m = new THREE.Mesh(geo, archMat(col, kind)); m.position.set(...P(x, y + h / 2, z)); return m;
}
// Stożkowy dach wieży (z okapem) i ostrosłup (seg = 4)
const coneRoof = (r, h, col, kind, x, y, z, seg = 20) => { const g = new THREE.Group(); g.add(cyl3(r, 0.5, h, col, kind, x, y, z, seg)); g.add(cyl3(r + 2, r, 3, DK(col, 0.3), kind, x, y - 1, z, seg)); return g; };
// Kopuła (półkula, rh = wysokość) i cebula
function dome(r, rh, col, kind, x, y, z) { const m = new THREE.Mesh(new THREE.SphereGeometry(r / PXU, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), archMat(col, kind)); m.scale.y = rh / r; m.position.set(...P(x, y, z)); return m; }
function onionDome(r, col, kind, x, y, z) { const pts = [[r * 0.75, 0], [r, r * 0.45], [r * 0.95, r * 0.8], [r * 0.6, r * 1.25], [r * 0.2, r * 1.6], [0.3, r * 1.95]].map(([a, b]) => new THREE.Vector2(a / PXU, b / PXU));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), archMat(col, kind)); m.position.set(...P(x, y, z)); return m; }
// Dach dwuspadowy: kalenica wzdłuż x (szerokość w), głębokość d, wysokość h, okap o; szczyty w kolorze ścian
function gable(w, d, h, col, kind, x, y, z, o = 5, wallCol = null, wallKind = 'plaster') {
  const g = new THREE.Group(), half = d / 2 + o, len = Math.hypot(half, h * (half / (d / 2))), ang = Math.atan2(h, d / 2), t = 3;
  for (const s of [-1, 1]) { const pl = blk(w + 2 * o, t, len, col, kind, 0, 0, 0); pl.position.set(...P(x, y + h / 2 - (o * h / (d / 2)) / 2, z + s * (d / 4 + o / 2))); pl.rotation.x = s * ang; g.add(pl); }
  g.add(blk(w + 2 * o + 2, 4, 5, DK(col, 0.35), kind, x, y + h - 2, z)); // kalenica
  if (wallCol) { const sh = new THREE.Shape([new THREE.Vector2(-d / 2 / PXU, 0), new THREE.Vector2(d / 2 / PXU, 0), new THREE.Vector2(0, h / PXU)]), geo = new THREE.ExtrudeGeometry(sh, { depth: w / PXU, bevelEnabled: false });
    const uv = geo.attributes.uv, T = TEXPX[wallKind] || 60; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * PXU / T, uv.getY(i) * PXU / T);
    const m = new THREE.Mesh(geo, archMat(wallCol, wallKind)); m.rotation.y = Math.PI / 2; m.position.set(...P(x - w / 2, y, z)); g.add(m); }
  return g;
}
// Dach czterospadowy (ostrosłup ścięty, kalenica krótsza)
function hipRoof(w, d, h, col, kind, x, y, z, o = 5) { const geo = new THREE.CylinderGeometry(0.5 / PXU, 1 / PXU, h / PXU, 4, 1); geo.rotateY(Math.PI / 4); const m = new THREE.Mesh(geo, archMat(col, kind));
  const T = TEXPX[kind]; if (T) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * (w + d) / T, uv.getY(i) * h / T); }
  m.scale.set((w + 2 * o) * Math.SQRT1_2 / 1, 1, (d + 2 * o) * Math.SQRT1_2 / 1); m.position.set(...P(x, y + h / 2, z)); return m; }
// Blanki wzdłuż krawędzi muru (od x0 do x1 na wysokości y, przy z); co drugi ząb
function merlons(x0, x1, y, z, col, kind, mw = 8, mh = 8, md = 8, axis = 'x') {
  const g = new THREE.Group(), n = Math.max(2, Math.round((x1 - x0) / (mw * 2))), step = (x1 - x0 - mw) / (n - 1);
  for (let i = 0; i < n; i++) { const a = x0 + mw / 2 + i * step; g.add(axis === 'x' ? blk(mw, mh, md, col, kind, a, y, z) : blk(md, mh, mw, col, kind, z, y, a)); } return g;
}
// Mur z blankami na całym obwodzie prostopadłościanu (w × d), wysokość ściany h
function crenTop(w, d, y, col, kind, x = 0, z = 0) { const g = new THREE.Group(); g.add(blk(w + 4, 3, d + 4, DK(col, 0.15), kind, x, y, z));
  g.add(merlons(x - w / 2 - 2, x + w / 2 + 2, y + 3, z + d / 2, col, kind)); g.add(merlons(x - w / 2 - 2, x + w / 2 + 2, y + 3, z - d / 2, col, kind));
  g.add(merlons(z - d / 2 + 8, z + d / 2 - 8, y + 3, x + w / 2, col, kind, 8, 8, 8, 'z')); g.add(merlons(z - d / 2 + 8, z + d / 2 - 8, y + 3, x - w / 2, col, kind, 8, 8, 8, 'z')); return g; }
// Blanki okrągłej baszty
function ringMerlons(r, y, col, kind, x, z, n = 10) { const g = new THREE.Group(); g.add(cyl3(r + 3, r + 3, 3, DK(col, 0.15), kind, x, y, z)); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = blk(7, 8, 6, col, kind, x + Math.cos(a) * (r + 1), y + 3, z + Math.sin(a) * (r + 1)); b.rotation.y = -a; g.add(b); } return g; }
// Otwór w fasadzie (okno, drzwi): ciemne lub świecące wnętrze z obramieniem, łuk u góry (arch), wysunięty o pół grubości
function opening(w, h, x, y, z, { glow = null, frame = '#4a3a2a', frameKind = 'wood', arch = true, inner = '#120c08', sill = true, bars = false, frameW = 2.5 } = {}) {
  const g = new THREE.Group(), shape = (ww, hh) => { const s = new THREE.Shape(), r = arch ? ww / 2 : 0; s.moveTo(-ww / 2, 0); s.lineTo(ww / 2, 0); s.lineTo(ww / 2, hh - r); if (arch) s.absarc(0, hh - r, r, 0, Math.PI, false); else s.lineTo(-ww / 2, hh); s.lineTo(-ww / 2, 0); return s; };
  const mk = (ww, hh, dz, col, kind, dep) => { const geo = new THREE.ExtrudeGeometry(shape(ww / PXU, hh / PXU), { depth: dep / PXU, bevelEnabled: false, curveSegments: 8 }); const m = new THREE.Mesh(geo, archMat(col, kind)); m.position.set(...P(x, y, z + dz)); return m; };
  g.add(mk(w + frameW * 2, h + frameW, 0, frame, frameKind, 1.6)); g.add(mk(w, h, 0.4, glow || inner, glow ? 'win' : 'wood', 1.6));
  if (glow) { g.add(blk(1.2, h - 1, 1, frame, frameKind, x, y, z + 2.2)); if (h > w * 1.3) g.add(blk(w, 1.2, 1, frame, frameKind, x, y + h * 0.5, z + 2.2)); }
  if (bars) for (let i = 1; i < 4; i++) g.add(blk(1, h - 2, 1.2, '#2a2a2e', 'iron', x - w / 2 + i * w / 4, y, z + 2.2));
  if (sill) g.add(blk(w + 5, 2, 3, DK(frame, 0.1), frameKind, x, y - 2, z + 1.5));
  return g;
}
// Drzwi z desek z okuciami w łukowym portalu
function door(w, h, x, y, z, col = '#5a3a22', portal = '#8a8070', portalKind = 'ashlar') {
  const g = opening(w, h, x, y, z, { frame: portal, frameKind: portalKind, inner: col, sill: false, frameW: 4 });
  g.add(blk(w * 0.9, 1.5, 1, '#2a2420', 'iron', x, y + h * 0.3, z + 2.2)); g.add(blk(w * 0.9, 1.5, 1, '#2a2420', 'iron', x, y + h * 0.65, z + 2.2)); return g;
}
// Belki muru pruskiego na ścianie (fasada przy z): słupy, rygle, zastrzały
function timberFrame(w, h, x, y, z, col = '#3a2416', posts = 4) {
  const g = new THREE.Group(), t = 3;
  g.add(blk(w + 2, t + 1, 2, col, 'wood', x, y, z)); g.add(blk(w + 2, t + 1, 2, col, 'wood', x, y + h - t - 1, z)); g.add(blk(w + 2, t, 2, col, 'wood', x, y + h * 0.5, z));
  for (let i = 0; i <= posts; i++) g.add(blk(t, h, 2, col, 'wood', x - w / 2 + i * w / posts, y, z));
  for (let i = 0; i < posts; i++) { const cx = x - w / 2 + (i + 0.5) * w / posts, len = Math.hypot(w / posts, h * 0.5), a = Math.atan2(h * 0.5, w / posts) * (i % 2 ? 1 : -1); const b = blk(2.4, len, 1.6, col, 'wood', 0, 0, 0); b.geometry.center(); b.position.set(...P(cx, y + h * 0.25, z)); b.rotation.z = a + Math.PI / 2 * (i % 2 ? -1 : 1) * 0 ; b.rotation.z = (i % 2 ? 1 : -1) * (Math.PI / 2 - Math.atan2(h * 0.5, w / posts)); g.add(b); }
  return g;
}
// Maszt z flagą właściciela (gra rysuje powiewającą flagę w punkcie fx:flag)
function mast(x, y, z, h = 40, col = '#5a4028') { const g = new THREE.Group(); g.add(cyl3(1.3, 1, h, col, 'wood', x, y, z, 8)); g.add(sph(1.8 / PXU, '#d8b040', 'gold', P(x, y + h, z), null, 8)); marker(g, 'fx:flag', P(x, y + h - 2, z)); return g; }
// Chorągiew zwisająca ze ściany (barwy frakcji): drążek, płachta zakończona w szpic, złoty lamowany pas
function hangBanner(x, y, z, w = 9, h = 22, col = '#2a4a8a', trim = '#e0b040') {
  const g = new THREE.Group(); g.add(cyl3(0.8, 0.8, w + 4, '#5a4028', 'wood', 0, 0, 0, 6)); g.children[0].rotation.z = Math.PI / 2; g.children[0].position.set(...P(x, y + 1, z + 1.5));
  const pts = [[-w / 2, 0], [w / 2, 0], [w / 2, -h], [0, -h - 5], [-w / 2, -h]].map(([a, b]) => [a / PXU, b / PXU]);
  g.add(slab(pts.map(([a, b]) => [a * 1.15, b * 1.03]), 0.5 / PXU, trim, 'gold', P(x, y, z + 1))); g.add(slab(pts, 0.8 / PXU, col, 'cloth', P(x, y, z + 1.6)));
  g.add(blk(w * 0.7, 1.2, 0.6, trim, 'gold', x, y - h * 0.45, z + 2.3)); return g;
}
// Kominy z dymem, ogień, blask
const chimney = (x, y, z, h = 16, col = '#7a5a48') => { const g = new THREE.Group(); g.add(blk(8, h, 8, col, 'brick', x, y, z)); g.add(blk(10, 3, 10, DK(col, 0.2), 'brick', x, y + h, z)); marker(g, 'fx:smoke', P(x, y + h + 4, z)); return g; };
const glowMark = (g, x, y, z, r, col) => marker(g, `fx:glow|${r}|${col}`, P(x, y, z));
// Gwiazda / krzyż / kula na szczycie
const finial = (x, y, z, col = '#e0b040', kind = 'gold') => { const g = new THREE.Group(); g.add(cyl3(1, 1, 8, col, kind, x, y, z, 6)); g.add(sph(2.6 / PXU, col, kind, P(x, y + 9, z), null, 10)); return g; };
const crossTop = (x, y, z, col = '#e0b040') => { const g = new THREE.Group(); g.add(blk(2, 12, 2, col, 'gold', x, y, z)); g.add(blk(8, 2, 2, col, 'gold', x, y + 7, z)); return g; };
function starTop(x, y, z, col = '#ffd040', r = 6) { const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push([Math.cos(a) * rr / PXU, Math.sin(a) * rr / PXU]); }
  const g = new THREE.Group(); g.add(cyl3(1, 1, 6, '#c0a040', 'gold', x, y, z, 6)); const s = slab(pts, 2 / PXU, col, 'gem', P(x, y + 6 + r, z)); g.add(s); return g; }
// Okrągła baszta z dachem stożkowym albo blankami; okna w rzędach
function roundTower(r, h, x, z, A, { roof = null, roofH = r * 2.2, y = 0, wins = 1, glow = A.glow, cren = !roof, kind = 'ashlar', taper = 0.94 } = {}) {
  const g = new THREE.Group(); g.add(cyl3(r, r * taper, h, A.wall[0], kind, x, y, z)); g.add(cyl3(r + 1.5, r + 1.5, 6, DK(A.wall[0], 0.12), kind, x, y, z));
  for (let i = 0; i < wins; i++) g.add(opening(r * 0.42, r * 0.7, x, y + h * (0.35 + 0.5 * i / Math.max(1, wins)), z + r * taper * 0.97, { glow, frame: DK(A.wall[0], 0.3), frameKind: kind }));
  if (cren) g.add(ringMerlons(r * taper, y + h, A.wall[0], kind, x, z));
  if (roof) g.add(coneRoof(r * taper + 3, roofH, roof, 'tiles', x, y + h, z));
  return g;
}
// Zwierzę albo postać z modeli jednostek (gryf w gnieździe, koń w zagrodzie), w skali sceny; patrzy w bok (+x) albo do widza
function creature(cid, x, y, z, s = 1, yaw = 0, P0 = { t: 0.3 }) {
  const C = CREATURES[cid]; if (!C) return new THREE.Group(); const m = buildUnit(C.look, P0); if (!m) return new THREE.Group();
  const g = new THREE.Group(); g.add(m); g.scale.setScalar(s); g.rotation.y = yaw; g.position.set(...P(x, y, z)); return g;
}
// Tarcza herbowa (płaska) w kolorze, na ścianie
function shieldPlate(x, y, z, s, col, rim = '#e0b040') { const pts = [[-1, 1], [1, 1], [1, 0], [0.6, -0.8], [0, -1.2], [-0.6, -0.8], [-1, 0]].map(([a, b]) => [a * s / PXU, b * s / PXU]); const g = new THREE.Group();
  g.add(slab(pts.map(([a, b]) => [a * 1.18, b * 1.18]), 1 / PXU, rim, 'gold', P(x, y, z))); g.add(slab(pts, 1.4 / PXU, col, 'metal', P(x, y, z + 0.8))); return g; }
// Dziedziniec / bruk pod budowlą
const pave = (w, d, col = '#9a9080', x = 0, z = 0) => blk(w, 1.5, d, col, 'cobble', x, 0, z);
// Woda (fosa, sadzawka): płaska, ciemna z połyskiem
const water = (w, d, x, z, col = '#3a6a8a') => { const m = blk(w, 1, d, col, 'win', x, -0.5, z); m.material = new THREE.MeshStandardMaterial({ color: col, roughness: 0.15, metalness: 0.3 }); return m; };

// ==================== PRZYSTAŃ ====================
// Paleta z rysunków 2D: jasny kamień, czerwona dachówka, niebieskie stożki wież, mur pruski, złote ozdoby.
const HV = { stone: '#d2c6ae', stoneD: '#a89a80', roof: '#b4402c', blue: '#3a5f9e', plaster: '#efe4c8', beam: '#4a2c18', gold: '#e0b040', wood: '#7a5230', glow: '#ffd27a', marble: '#ece6da' };
const havenA = () => ({ wall: [HV.stone, HV.stoneD], glow: HV.glow });
// Dom z muru pruskiego: tynk, belki, czerwony dach dwuspadowy, okna
function halfTimber(w, h, d, x, z, { roof = HV.roof, roofH = h * 0.7, wins = 3, floors = 2, doorAt = 0, y = 0, base = 14, roofKind = 'tiles', chim = true } = {}) {
  const g = new THREE.Group();
  g.add(blk(w, base, d, HV.stoneD, 'ashlar', x, y, z)); g.add(blk(w, h - base, d, HV.plaster, 'plaster', x, y + base, z));
  g.add(timberFrame(w, h - base, x, y + base, z + d / 2, HV.beam, Math.max(3, wins + 1)));
  const eave = h - 5 * roofH / (d / 2) - 2, band = (eave - base - 3) / floors, wh = Math.min(11, band - 3); /* okna pod okapem: dach opada o 5 * roofH / (d / 2) poniżej ściany */
  for (let f = 0; f < floors; f++) for (let i = 0; i < wins; i++) { const wx = x - w / 2 + (i + 0.5) * w / wins; if (f === 0 && Math.abs(wx - (x + doorAt)) < w / wins * 0.5) continue; g.add(opening(8, wh, wx, y + base + 3 + f * band + (band - wh) / 2, z + d / 2 + 0.5, { glow: HV.glow, frame: HV.beam, arch: false })); }
  g.add(door(12, 20, x + doorAt, y, z + d / 2, '#5a3820', HV.stoneD));
  g.add(gable(w, d, roofH, roof, roofKind, x, y + h, z, 5, HV.plaster));
  if (chim) g.add(chimney(x + w * 0.3, y + h + roofH * 0.35, z - d * 0.15, roofH * 0.55));
  return g;
}
// Prostokątny budynek z ciosów z dachem dwuspadowym
function stoneHall(w, h, d, x, z, { roof = HV.roof, roofH = h * 0.6, y = 0, wins = 2, doorW = 14, kind = 'ashlar', col = HV.stone } = {}) {
  const g = new THREE.Group(); g.add(blk(w, h, d, col, kind, x, y, z)); g.add(blk(w + 3, 5, d + 3, DK(col, 0.15), kind, x, y, z));
  for (let i = 0; i < wins; i++) { const wx = x - w / 2 + (i + 0.5) * w / wins; if (Math.abs(wx - x) < doorW) continue; g.add(opening(8, 13, wx, y + h * 0.35, z + d / 2, { glow: HV.glow, frame: DK(col, 0.3), frameKind: kind })); }
  g.add(door(doorW, Math.min(h * 0.7, 24), x, y, z + d / 2, '#5a3820', DK(col, 0.1), kind));
  g.add(gable(w, d, roofH, roof, 'tiles', x, y + h, z, 4, col, kind)); return g;
}
// Czworoboczna wieża z blankami (i dachem)
function squareTower(w, h, x, z, { roof = null, roofH = w * 1.3, y = 0, col = HV.stone, wins = 2, kind = 'ashlar', clock = false } = {}) {
  const g = new THREE.Group(); g.add(blk(w, h, w, col, kind, x, y, z)); g.add(blk(w + 3, 5, w + 3, DK(col, 0.15), kind, x, y, z));
  for (let i = 0; i < wins; i++) g.add(opening(w * 0.28, w * 0.45, x, y + h * (0.3 + 0.55 * i / Math.max(1, wins)), z + w / 2, { glow: HV.glow, frame: DK(col, 0.3), frameKind: kind }));
  if (clock) { const c = cyl3(w * 0.32, w * 0.32, 2, '#f4ecd8', 'plaster', 0, 0, 0, 24); c.rotation.x = Math.PI / 2; c.position.set(...P(x, y + h - w * 0.45, z + w / 2 + 1)); g.add(c); const r = torus(w * 0.34 / PXU, 1.2 / PXU, HV.gold, 'gold', P(x, y + h - w * 0.45, z + w / 2 + 2)); g.add(r);
    g.add(blk(1.4, w * 0.24, 1, '#2a2420', 'iron', x, y + h - w * 0.45, z + w / 2 + 2.5)); }
  if (roof) { g.add(blk(w + 4, 3, w + 4, DK(col, 0.2), kind, x, y + h, z)); g.add(hipRoof(w, w, roofH, roof, 'tiles', x, y + h + 3, z, 3)); }
  else g.add(crenTop(w, w, y + h, col, kind, x, z));
  return g;
}
// Mur obronny z blankami między punktami (x0..x1 przy z), wysokość h, grubość t
function curtain(x0, x1, z, h, col = HV.stone, t = 10, kind = 'ashlar') { const g = new THREE.Group(), w = x1 - x0, x = (x0 + x1) / 2; g.add(blk(w, h, t, col, kind, x, 0, z)); g.add(blk(w, 3, t + 3, DK(col, 0.15), kind, x, h, z)); g.add(merlons(x0, x1, h + 3, z + t / 2, col, kind)); return g; }
function gatehouse(w, h, x, z, col = HV.stone) { const g = new THREE.Group(); g.add(blk(w, h, 18, col, 'ashlar', x, 0, z)); g.add(crenTop(w, 18, h, col, 'ashlar', x, z));
  g.add(opening(w * 0.5, h * 0.6, x, 0, z + 9, { inner: '#141010', frame: DK(col, 0.2), frameKind: 'ashlar', bars: true, sill: false, frameW: 3 })); return g; }

// Wnętrze niebiańskiej bramy: łuk (prostokąt 0..y1 + półkole) z obrazem świetlistej głębi – jasny środek, złote wiry, obłoki
function portalGlow(r, y0, y1, z) {
  const sh = new THREE.Shape(); sh.moveTo(-r, y0); sh.lineTo(r, y0); sh.lineTo(r, y1); sh.absarc(0, y1, r, 0, Math.PI, false); sh.lineTo(-r, y0);
  const geo = new THREE.ShapeGeometry(sh, 24), uv = geo.attributes.uv, pos = geo.attributes.position, top = y1 + r;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + r) / (2 * r), (pos.getY(i) - y0) / (top - y0));
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const q = c.getContext('2d'), R = rng(77);
  const bg = q.createRadialGradient(64, 150, 4, 64, 150, 150); bg.addColorStop(0, '#fffef0'); bg.addColorStop(0.25, '#ffe9a0'); bg.addColorStop(0.6, '#e8a850'); bg.addColorStop(1, '#8a5a3a'); q.fillStyle = bg; q.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = 20 + R() * 90; q.strokeStyle = `rgba(255,${200 + R() * 55 | 0},${120 + R() * 100 | 0},${0.25 + R() * 0.4})`; q.lineWidth = 1 + R() * 3; q.beginPath(); q.arc(64, 150, d, a, a + 0.6 + R() * 1.2); q.stroke(); }
  for (let i = 0; i < 14; i++) { const x = R() * 128, y = 170 + R() * 90, rr = 8 + R() * 18, gg = q.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, 'rgba(255,250,235,.55)'); gg.addColorStop(1, 'rgba(255,250,235,0)'); q.fillStyle = gg; q.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t })); m.scale.setScalar(1 / PXU); m.position.z = z / PXU; return m;
}
const HAVEN3 = {
  hall(t) { // ratusz: dom z muru pruskiego i wieża zegarowa; 2: kamienica ze schodkowym szczytem; 3: biały gmach z kopułą; 4: pałac ze złotą kopułą
    const g = new THREE.Group(), A = havenA();
    if (t <= 2) {
      g.add(halfTimber(70, 50, 44, -12, 0, { wins: 4, floors: 2 }));
      g.add(squareTower(24, 96, 38, -6, { roof: HV.blue, roofH: 30, clock: true, wins: 2 })); g.add(mast(38, 132, -6, 18));
      if (t === 2) { const k = new THREE.Group(); k.add(blk(40, 56, 40, HV.stone, 'ashlar', -64, 0, -10)); for (let i = 0; i < 4; i++) k.add(blk(40 - i * 10, 8, 40, HV.stone, 'ashlar', -64, 56 + i * 8, -10));
        k.add(opening(8, 13, -72, 22, 10, { glow: HV.glow, frame: HV.stoneD, frameKind: 'ashlar' })); k.add(opening(8, 13, -56, 22, 10, { glow: HV.glow, frame: HV.stoneD, frameKind: 'ashlar' })); k.add(opening(8, 13, -64, 44, 10, { glow: HV.glow, frame: HV.stoneD, frameKind: 'ashlar' })); g.add(k); }
    } else if (t === 3) {
      g.add(blk(110, 46, 50, HV.marble, 'ashlar', -6, 0, -6)); g.add(blk(116, 6, 56, HV.stone, 'ashlar', -6, 46, -6));
      for (let i = 0; i < 6; i++) g.add(cyl3(3.2, 3, 40, '#f4f0e6', 'stone', -46 + i * 16, 4, 24, 12)); g.add(blk(100, 4, 12, '#f4f0e6', 'stone', -6, 0, 24)); g.add(gable(96, 14, 12, '#f0ece2', 'stone', -6, 44, 24, 2, '#f0ece2', 'stone'));
      for (let i = 0; i < 5; i++) g.add(opening(8, 16, -40 + i * 17, 10, 19, { glow: HV.glow, frame: '#b8ac94', frameKind: 'ashlar' }));
      g.add(cyl3(22, 22, 12, HV.marble, 'ashlar', -6, 52, -10)); g.add(dome(22, 20, '#7aa6d8', 'copper', -6, 64, -10)); g.add(finial(-6, 84, -10));
      g.add(squareTower(22, 100, 50, -8, { roof: HV.blue, roofH: 22, clock: true, wins: 2, col: HV.marble })); 
    } else {
      g.add(blk(100, 56, 56, HV.marble, 'ashlar', 0, 0, -8)); g.add(blk(106, 6, 62, HV.stone, 'ashlar', 0, 56, -8));
      for (let i = 0; i < 7; i++) g.add(cyl3(3.4, 3.1, 48, '#f6f2e8', 'stone', -42 + i * 14, 4, 24, 12)); g.add(blk(96, 4, 12, '#f6f2e8', 'stone', 0, 0, 24)); g.add(gable(92, 14, 14, '#f6f2e8', 'stone', 0, 52, 24, 2, '#f6f2e8', 'stone'));
      for (let i = 0; i < 5; i++) g.add(opening(9, 18, -32 + i * 16, 12, 21, { glow: HV.glow, frame: '#b8ac94', frameKind: 'ashlar' }));
      g.add(cyl3(26, 26, 16, HV.marble, 'ashlar', 0, 62, -12)); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.3; g.add(opening(4, 8, Math.cos(a) * 0 + (i - 3.5) * 6, 65, -12 + 26, { glow: HV.glow, frame: HV.gold, frameKind: 'gold', sill: false })); }
      g.add(dome(27, 28, HV.gold, 'gold', 0, 78, -12)); g.add(finial(0, 106, -12));
      for (const s of [-1, 1]) { g.add(roundTower(14, 96, s * 62, -6, A, { roof: null, cren: false, wins: 3, kind: 'ashlar' })); g.add(dome(15, 14, HV.blue, 'copper', s * 62, 96, -6)); g.add(finial(s * 62, 110, -6)); }
      g.add(water(26, 14, 0, 46, '#5a8ab0')); g.add(cyl3(14, 14, 3, HV.marble, 'stone', 0, 0, 46)); g.add(cyl3(2, 2, 10, HV.marble, 'stone', 0, 0, 46)); g.add(dome(5, 3, HV.marble, 'stone', 0, 10, 46));
    }
    return g;
  },
  fort(t) { // mur z basztami i bramą; 2: donżon z czerwonymi stożkami; 3: zamek z wysokimi niebieskimi iglicami
    const g = new THREE.Group(), A = havenA();
    g.add(curtain(-84, 84, 22, 32)); g.add(gatehouse(34, 44, 0, 24)); g.add(blk(18, 2, 14, '#6a4a2a', 'planks', 0, 0, 40));
    for (const s of [-1, 1]) g.add(squareTower(24, 46, s * 86, 22, { wins: 1 }));
    if (t >= 2) { g.add(squareTower(30, 70, -36, -10, { roof: HV.roof, roofH: 26, wins: 2 })); g.add(squareTower(26, 60, 40, -12, { roof: HV.roof, roofH: 24, wins: 2 }));
      g.add(blk(50, 50, 30, HV.stone, 'ashlar', 4, 0, -14)); g.add(crenTop(50, 30, 50, HV.stone, 'ashlar', 4, -14)); g.add(roundTower(9, 70, 4, -4, A, { roof: HV.roof, roofH: 20, wins: 2 })); if (t < 3) g.add(mast(4, 86, -4, 16)); }
    if (t >= 3) { g.add(roundTower(16, 110, -22, -30, A, { roof: HV.blue, roofH: 46, wins: 3 })); g.add(roundTower(13, 92, 52, -32, A, { roof: HV.blue, roofH: 40, wins: 3 }));
      g.add(blk(70, 80, 30, HV.stone, 'ashlar', 14, 0, -34)); g.add(crenTop(70, 30, 80, HV.stone, 'ashlar', 14, -34)); for (let i = 0; i < 3; i++) g.add(opening(8, 14, -6 + i * 20, 46, -19, { glow: HV.glow, frame: HV.stoneD, frameKind: 'ashlar' }));
      g.add(mast(-22, 150, -30, 20)); for (const s of [-1, 1]) g.add(roundTower(10, 60, s * 86, 22, A, { roof: HV.blue, roofH: 26, y: 46, cren: false, wins: 0 })); }
    return g;
  },
  guild(t) { // gildia magów: zwężająca się kamienna wieża, niebieski stożek, gwiazda; wyżej z każdym poziomem
    const g = new THREE.Group(), A = havenA(), h = 40 + t * 18, r = 22 - t;
    g.add(cyl3(r + 6, r + 4, 16, HV.stoneD, 'ashlar', 0, 0, 0, 24)); g.add(cyl3(r + 2, r * 0.72, h, HV.stone, 'ashlar', 0, 14, 0, 24));
    for (let i = 0; i < t; i++) { const y = 26 + i * 18, rr = r + 2 - (r * 0.3) * (y - 14) / h; g.add(cyl3(rr + 1.5, rr + 1.5, 2.5, HV.stoneD, 'ashlar', 0, y + 12, 0, 24)); g.add(opening(5, 8, 0, y, rr * 0.98, { glow: '#9ad0ff', frame: HV.stoneD, frameKind: 'ashlar' })); }
    const rose = cyl3(6, 6, 2, '#c84040', 'win', 0, 0, 0, 16); rose.rotation.x = Math.PI / 2; rose.position.set(...P(0, 30, r + 3)); g.add(rose); g.add(torus(6.5 / PXU, 1.2 / PXU, HV.gold, 'gold', P(0, 30, r + 4)));
    g.add(door(10, 16, 0, 0, r + 6, '#3a2a5a', HV.stoneD));
    g.add(coneRoof(r * 0.72 + 4, 30 + t * 2, HV.blue, 'tiles', 0, 14 + h, 0)); g.add(starTop(0, 14 + h + 30 + t * 2, 0));
    glowMark(g, 0, 30, r + 4, 8, '#9ad0ff');
    return g;
  },
  tavern() { const g = new THREE.Group(); g.add(halfTimber(64, 44, 40, -6, 0, { wins: 3, roofH: 30 })); g.add(blk(3, 30, 3, HV.beam, 'wood', 32, 0, 18)); g.add(blk(18, 2, 2, HV.beam, 'wood', 38, 30, 18));
    g.add(decal(12 / PXU, 10 / PXU, (c, w, h) => { c.fillStyle = '#e8c868'; c.fillRect(0, 0, w, h); c.fillStyle = '#5a3820'; c.fillRect(w * 0.3, h * 0.2, w * 0.35, h * 0.6); c.fillRect(w * 0.62, h * 0.35, w * 0.12, h * 0.25); }, P(42, 24, 18)));
    for (let i = 0; i < 2; i++) g.add(cyl3(4, 4, 9, '#7a5030', 'wood', 34 + i * 10, 0, 28, 12)); g.add(blk(10, 6, 7, '#6a4428', 'planks', 46, 0, 22)); return g; },
  market() { const g = new THREE.Group(); g.add(blk(110, 40, 36, HV.stone, 'ashlar', 0, 0, -4)); g.add(blk(114, 4, 40, HV.stoneD, 'ashlar', 0, 40, -4));
    for (let i = 0; i < 7; i++) { const x = -45 + i * 15; g.add(opening(10, 22, x, 2, 14.5, { inner: '#2a1c12', frame: HV.stoneD, frameKind: 'ashlar', sill: false })); g.add(blk(10, 5, 6, ['#c83a2a', '#3a6aa8', '#e8c040', '#4a8a3a'][i % 4], 'cloth', x, 6, 18)); }
    g.add(merlons(-56, 56, 44, 14, HV.stone, 'ashlar', 6, 7, 6));
    for (const s of [-1, 1]) g.add(squareTower(16, 64, s * 52, -6, { roof: HV.blue, roofH: 22, wins: 1 }));
    return g; },
  silo() { // wiatrak
    const g = new THREE.Group(); g.add(cyl3(16, 11, 44, HV.plaster, 'plaster', 0, 0, 0, 16)); g.add(coneRoof(13, 18, '#7a5a38', 'shingle', 0, 44, 0)); g.add(door(8, 13, 0, 0, 15, '#5a3820', HV.stoneD));
    const hub = new THREE.Group(); hub.position.set(...P(0, 46, 16)); hub.rotation.z = 0.35; for (let i = 0; i < 4; i++) { const b = new THREE.Group(); b.rotation.z = i * Math.PI / 2; b.add(blk(2, 44, 2, '#5a3820', 'wood', 0, 0, 0)); b.add(blk(9, 32, 1, '#e8e0cc', 'cloth', 5, 12, 0)); hub.add(b); }
    hub.add(sph(3 / PXU, '#3a2a1a', 'wood', [0, 0, 0])); g.add(hub);
    for (let i = 0; i < 3; i++) g.add(sph(4 / PXU, '#c8b080', 'cloth', P(24 + i * 7, 4, 14), [1, 0.9, 1])); return g; },
  smith() { const g = new THREE.Group(); g.add(blk(60, 34, 40, HV.stoneD, 'rubble', 0, 0, -6)); g.add(blk(58, 30, 2, '#1a1210', 'wood', 0, 2, 14.2));
    g.add(gable(64, 46, 22, '#6a4a2e', 'shingle', 0, 34, -6, 5, HV.stoneD, 'rubble')); g.add(chimney(20, 40, -10, 30, '#6a5a50'));
    g.add(blk(16, 10, 10, '#3a3a40', 'iron', -12, 0, 6)); const fire = blk(12, 6, 6, '#ff8a2a', 'win', 10, 2, 8); g.add(fire); glowMark(g, 10, 8, 10, 14, '#ffa040');
    g.add(blk(14, 4, 7, '#3a3a42', 'iron', 30, 8, 20)); g.add(blk(5, 8, 5, '#3a3a42', 'iron', 30, 0, 20)); return g; },
  special() { // stajnie: dom z muru pruskiego, koń
    const g = new THREE.Group(); g.add(halfTimber(80, 36, 40, -6, 0, { wins: 4, floors: 1, roofH: 26, roofKind: 'shingle', roof: '#7a5030', doorAt: -26, chim: false }));
    g.add(squareTower(12, 20, -6, -4, { roof: HV.blue, roofH: 12, y: 50, wins: 0 })); g.add(blk(56, 22, 2, '#2a1a10', 'wood', 6, 2, 14.5));
    g.add(creature('cavalier', 6, 0, 26, 0.5, 0, { t: 0.2 })); g.add(blk(40, 2, 2, '#7a5230', 'wood', 26, 10, 30)); for (let i = 0; i < 4; i++) g.add(blk(2, 13, 2, '#7a5230', 'wood', 8 + i * 12, 0, 30));
    return g; },
  grail() { // Kolos Archanioła: olbrzymi marmurowy serafin z uniesionym mieczem i złotymi skrzydłami na wysokim schodkowym postumencie, nad głową świetlista aureola
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) g.add(blk(130 - i * 20, 8, 96 - i * 16, HV.marble, 'ashlar', 0, i * 8, 0));
    g.add(blk(56, 42, 46, HV.marble, 'ashlar', 0, 32, 0)); const band = y => { const b = blk(62, 5, 52, HV.gold, 'gold', 0, y, 0); b.material = new THREE.MeshStandardMaterial({ color: '#e0b448', roughness: 0.3, metalness: 0.85 }); return b; }; g.add(band(32)); g.add(band(70));
    for (const s of [-1, 1]) { g.add(blk(14, 26, 14, HV.marble, 'ashlar', s * 52, 32, 30)); g.add(sph(6 / PXU, HV.gold, 'gold', P(s * 52, 63, 30))); glowMark(g, s * 52, 63, 30, 10, '#ffe8a0'); }
    const st = creature('seraph', 0, 75, 0, 2.8, -Math.PI / 2, { t: 0.15 }), /* model jednostki patrzy w bok pola bitwy: obrót przodem do widza */ marble = new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.55, metalness: 0 }), gold = new THREE.MeshStandardMaterial({ color: '#e0b448', roughness: 0.3, metalness: 0.85 });
    st.traverse(m => { if (!m.isMesh) return; const om = Array.isArray(m.material) ? m.material[0] : m.material, c = om && om.color ? om.color : null, warm = c && c.r > c.b * 1.35 && c.r > 0.45;
      m.material = om && om.metalness > 0.5 ? gold : marble; m.castShadow = true; }); g.add(st); /* posąg: marmur, złoto tam, gdzie model ma metal lub ciepłe barwy (skrzydła, oręż) */
    st.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(st), top = bb.max.y * PXU;
        glowMark(g, 0, top - 20, 0, 70, '#fff0a0');
    return g; },
// Siedliska: stopień 2 rozbudowuje budowlę, stopień 3 (elita) to ta sama budowla w pełnej okazałości: wyższa, z kamienia
  // i złoceń, z wieżami i chorągwiami w barwach frakcji (granat i złoto), bez doklejonych obcych części.
  dw1(t) { // strażnica pikinierów: mała kamienna wartownia z blankami i tarczą; 2: stojak z włóczniami i manekin;
    // 3: koszary gwardii – piętro wyżej, dwie narożne baszty z niebieskimi stożkami, złocone blanki, chorągwie
    const g = new THREE.Group(), A = havenA(), H = t >= 3 ? 50 : 34, W = t >= 3 ? 56 : 48;
    g.add(blk(W, H, 34, HV.stone, 'ashlar', -6, 0, -4)); g.add(crenTop(W, 34, H, t >= 3 ? LT(HV.stone, 0.15) : HV.stone, 'ashlar', -6, -4));
    if (t >= 3) g.add(blk(W + 5, 2, 39, HV.gold, 'gold', -6, H, -4));
    g.add(door(12, 20, -6, 0, 13, '#5a3820', HV.stoneD)); for (const s of [-1, 1]) g.add(opening(6, 10, -6 + s * 15, 18, 13, { glow: HV.glow, frame: HV.stoneD, frameKind: 'ashlar' }));
    if (false) for (const s of [-1, 1]) g.add(opening(6, 10, -6 + s * 15, 34, 13, { glow: HV.glow, frame: HV.stoneD, frameKind: 'ashlar' }));
    g.add(shieldPlate(-6, t >= 3 ? 40 : 28, 13.5, t >= 3 ? 8 : 6, t >= 3 ? '#2a4a8a' : '#c83a2a'));
    if (t >= 2) { for (let i = 0; i < 3; i++) { const sp = blk(1.6, 34, 1.6, '#6a4424', 'wood', 26 + i * 4, 0, 10); sp.rotation.z = -0.05; g.add(sp); g.add(cone(1.8 / PXU, 6 / PXU, '#c8ccd4', 'steel', P(26.5 + i * 4, 37, 10))); }
      g.add(blk(2.5, 30, 2.5, '#6a4424', 'wood', 40, 0, 16)); g.add(blk(18, 2.5, 2.5, '#6a4424', 'wood', 40, 22, 16)); g.add(sph(5 / PXU, '#d8c080', 'cloth', P(40, 16, 16), [1, 1.5, 0.8])); g.add(sph(4 / PXU, '#d8c080', 'cloth', P(40, 28, 16))); }
    if (t >= 3) { for (const s of [-1, 1]) { g.add(roundTower(9, 62, -6 + s * (W / 2), 13, A, { roof: HV.blue, roofH: 22, wins: 1 })); g.add(hangBanner(-6 + s * 13, H - 4, 13, 8, 18)); } g.add(mast(-6, H, -4, 22)); }
    return g; },
  dw2(t) { // strzelnica kuszników: wiata i tarcze; 2: wieżyczka na palach; 3: arsenał – kamienna wieża z blankami zamiast drewnianej, złoty pas, chorągiew
    const g = new THREE.Group(), sx = t >= 2 ? 6 : -14, A = havenA();
    for (const [a, b] of [[-20, -10], [20, -10], [-20, 12], [20, 12]]) g.add(blk(3, 26, 3, '#5a3a20', 'wood', sx + a, 0, b)); g.add(gable(46, 28, 12, HV.roof, 'tiles', sx, 26, 1, 4));
    g.add(blk(40, 3, 3, '#8a5a32', 'wood', sx, 10, 12));
    for (let i = 0; i < 2; i++) { const tx = 42 - i * 20, tg = new THREE.Group(); tg.position.set(...P(tx, 0, 20)); for (const s of [-1, 1]) { const l = blk(2, 20, 2, '#5a3a20', 'wood', s * 4, 0, -2); l.rotation.z = -s * 0.2; tg.add(l); }
      [[9, '#f4eee0'], [7, '#c83a2a'], [5, '#f4eee0'], [3, '#c83a2a'], [1.5, '#e8c040']].forEach(([r, c], k) => { const d = cyl3(r, r, 1.5 + k * 0.3, c, 'cloth', 0, 0, 0, 20); d.rotation.x = Math.PI / 2; d.position.set(...P(0, 20, k * 0.3)); tg.add(d); }); g.add(tg); }
    if (t === 2) { const tx = -40; for (const [a, b] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) g.add(blk(3, 34, 3, '#5a3a20', 'wood', tx + a, 0, b)); g.add(blk(24, 16, 22, '#8a6a42', 'planks', tx, 34, 0)); g.add(opening(8, 6, tx, 40, 11, { inner: '#1a100a', arch: false, frame: '#5a3a20', sill: false }));
      g.add(hipRoof(22, 20, 16, HV.roof, 'tiles', tx, 50, 0, 3)); }
    if (t >= 3) { const tx = -40; g.add(squareTower(26, 62, tx, -2, { wins: 2 })); g.add(blk(29, 2, 29, HV.gold, 'gold', tx, 62, -2)); g.add(hangBanner(tx, 52, 11, 9, 20)); g.add(mast(tx, 73, -2, 18));
      for (const s of [-1, 1]) { const cb = blk(14, 2, 2, '#5a3a20', 'wood', tx + s * 6, 74, -2 + 13); cb.rotation.y = s * 0.3; } }
    return g; },
  dw3(t) { // gryfia wieża: okrągła baszta z gniazdem; 2: złoty pas, drugi gryf; 3: cesarskie gniazdo – wyższa, z blankami na wsporniku, złota korona gniazda, dobudowana druga wieżyczka
    const g = new THREE.Group(), A = havenA(), h = t >= 3 ? 124 : 112;
    g.add(roundTower(18, h, 0, 0, A, { cren: true, wins: 3 })); g.add(door(10, 16, 0, 0, 17.5, '#5a3820', HV.stoneD));
    if (t >= 2) g.add(cyl3(19.5, 19.5, 3, HV.gold, 'gold', 0, h - 6, 0, 24));
    g.add(cyl3(26, 22, 8, '#6a4a28', 'thatch', 0, h + 6, 0, 20)); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, s = blk(1.5, 14, 1.5, '#8a6a3a', 'wood', Math.cos(a) * 24, h + 4, Math.sin(a) * 24); s.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); g.add(s); }
    if (t >= 3) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(cone(2 / PXU, 9 / PXU, HV.gold, 'gold', P(Math.cos(a) * 26, h + 16, Math.sin(a) * 26))); }
    g.add(creature(t >= 3 ? 'imperialGriffin' : 'griffin', 0, h + 12, 2, 0.62, 0.3, { t: 0.4 }));
    if (t >= 2) g.add(creature('royalGriffin', 30, h * 0.55, 18, 0.42, -0.4, { t: 0.1, fly: 0.3 }));
    if (t >= 3) { g.add(roundTower(10, 70, -26, -4, A, { roof: HV.blue, roofH: 24, wins: 2 })); g.add(blk(14, 8, 10, HV.stone, 'ashlar', -14, 58, -2)); g.add(hangBanner(0, h - 14, 18, 8, 20)); }
    return g; },
  dw4(t) { // koszary krzyżowców: kamienna hala, tarcze, skrzyżowane miecze nad wejściem; 2: kaplica z krzyżem;
    // 3: komandoria templariuszy – hala z przyporami i wysokimi oknami, wyższa dzwonnica z iglicą, złocony krzyż, chorągwie
    const g = new THREE.Group(), bx = t >= 2 ? -10 : 0, bw = t >= 2 ? 80 : 96, hh = t >= 3 ? 48 : 40;
    g.add(stoneHall(bw, hh, 48, bx, -4, { roofH: 28, wins: t >= 3 ? 0 : 4, doorW: 16 }));
    if (t >= 3) for (let i = 0; i < 4; i++) { const x = bx - bw / 2 + 8 + i * (bw - 16) / 3; g.add(blk(6, hh - 14, 8, HV.stoneD, 'ashlar', x, 0, 22)); g.add(blk(6, 5, 6, HV.stoneD, 'ashlar', x, hh - 14, 20)); /* przypory kończą się pod okapem */ if (i < 3) g.add(opening(7, 22, x + (bw - 16) / 6, 12, 20.5, { glow: HV.glow, frame: HV.stoneD, frameKind: 'ashlar' })); }
    for (const s of [-1, 1]) g.add(shieldPlate(bx + s * 28, t >= 3 ? 36 : 26, 20.5, 5, t >= 3 ? '#e8e2d0' : '#c83a2a'));
    if (t < 3) for (const s of [-1, 1]) { const sw = blk(2, 22, 1, '#d8dce4', 'steel', bx, 22, 22); sw.rotation.z = s * 0.7; g.add(sw); } /* w 3 miecze zasłaniały środkowe okno */
    if (t >= 2) { const th = t >= 3 ? 76 : 56; g.add(squareTower(22, th, 44, -8, { roof: HV.roof, roofH: t >= 3 ? 40 : 26, wins: 2 })); g.add(crossTop(44, th + (t >= 3 ? 43 : 29), -8)); }
    if (t >= 3) for (const s of [-1, 1]) g.add(hangBanner(bx + s * 40, hh - 10, 21, 9, 22, '#e8e2d0', '#c83a2a')); /* chorągwie pod okapem (złota listwa wystawała spod dachu) */
    return g; },
  dw5(t) { // klasztor: kościół z rozetą i dzwonnicą; 2: dwie dzwonnice; 3: trybunał – wyższa nawa z przyporami, złote iglice, chorągwie
    const g = new THREE.Group(), hh = t >= 3 ? 58 : 46;
    g.add(stoneHall(52, hh, 56, -16, -6, { roofH: 34, wins: 0, doorW: 12 })); const rose = cyl3(8, 8, 2, '#c84a3a', 'win', 0, 0, 0, 16); rose.rotation.x = Math.PI / 2; rose.position.set(...P(-16, hh + 6, 23)); g.add(rose);
    g.add(torus(8.5 / PXU, 1.4 / PXU, HV.gold, 'gold', P(-16, hh + 6, 24))); glowMark(g, -16, hh + 6, 24, 10, '#ffb080');
    if (t >= 3) for (const s of [-1, 1]) { g.add(blk(6, hh - 6, 10, HV.stoneD, 'ashlar', -16 + s * 28, 0, 10)); g.add(cone(4 / PXU, 14 / PXU, HV.stoneD, 'ashlar', P(-16 + s * 28, hh, 10), null, 4)); g.add(hangBanner(-16 + s * 14, hh - 10, 22, 8, 20)); }
    const towers = t >= 2 ? [26, 44] : [30], th = t >= 3 ? 96 : 80;
    for (const x of towers) { g.add(squareTower(16, th, x, -6, { roof: t >= 3 ? HV.gold : HV.blue, roofH: t >= 3 ? 40 : 28, wins: 2 })); g.add(crossTop(x, th + (t >= 3 ? 41 : 28), -6)); }
    return g; },
  dw6(t) { // stajnie rycerzy: drewniana stajnia, koń, zagroda; 2: drugi rycerz; 3: zakon paladynów – kamienny parter, wieżyczka z zegarem, szranki z chorągwiami
    const g = new THREE.Group(), stone = t >= 3;
    g.add(blk(64, 30, 40, stone ? HV.stone : '#8a6a42', stone ? 'ashlar' : 'planks', -20, 0, -4)); g.add(gable(64, 40, 22, HV.roof, 'tiles', -20, 30, -4, 5, stone ? HV.plaster : '#8a6a42', stone ? 'plaster' : 'planks'));
    for (let i = 0; i < 3; i++) g.add(opening(14, 20, -40 + i * 20, 0, 16, { inner: '#1a1008', frame: stone ? HV.stoneD : '#4a2c18', frameKind: stone ? 'ashlar' : 'wood', arch: stone, sill: false }));
    g.add(creature(stone ? 'paladin' : 'cavalier', 30, 0, 18, 0.45, 0, { t: 0.2 })); for (let i = 0; i < 4; i++) g.add(blk(2, 13, 2, stone ? HV.stone : '#7a5230', stone ? 'ashlar' : 'wood', 14 + i * 14, 0, 30)); g.add(blk(44, 2, 2, '#7a5230', 'wood', 35, 10, 30)); g.add(blk(44, 2, 2, '#7a5230', 'wood', 35, 5, 30));
    if (t >= 2) g.add(creature('champion', 54, 0, 4, 0.42, 0.5, { t: 0.5 }));
    if (stone) { g.add(squareTower(14, 30, -20, -4, { roof: HV.blue, roofH: 16, y: 44, wins: 0, clock: true })); g.add(mast(-20, 92, -4, 14)); for (const s of [-1, 1]) g.add(hangBanner(-20 + s * 22, 26, 16, 8, 18)); }
    return g; },
  dw7(t) { // brama niebios: biały portal ze złotym światłem i posągami aniołów; 2: iglica ze złotą kulą;
    // 3: niebiański chór – monumentalna brama: wysokie schody, filary ze złotymi głowicami, podwójny łuk, złote skrzydła, iglice i anioły na cokołach
    const g = new THREE.Group(), big = t >= 3, wd = big ? 34 : 22, H = big ? 92 : 60, st = big ? 5 : 3, y0 = st * 4, A = y0 + H;
    for (let i = 0; i < st; i++) g.add(blk(70 - i * 8 + (big ? 44 : 0), 4, 30 - i * 3 + (big ? 14 : 0), HV.marble, 'ashlar', 0, i * 4, 0));
    for (const s of [-1, 1]) { g.add(blk(big ? 18 : 14, H, big ? 18 : 14, HV.marble, 'ashlar', s * wd, y0, 0)); if (big) { g.add(blk(22, 6, 22, HV.marble, 'ashlar', s * wd, y0, 0)); g.add(blk(22, 4, 22, HV.gold, 'gold', s * wd, y0 + H - 4, 0)); } }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(wd / PXU, (big ? 9 : 7) / PXU, 10, 28, Math.PI), archMat(HV.marble, 'ashlar')); arch.position.set(...P(0, A, 0)); g.add(arch);
    g.add(portalGlow(wd - (big ? 9 : 7), y0, A, -2)); /* świetlista głębia bramy zamiast płaskiej tafli */
    glowMark(g, 0, y0 + H * 0.6, 4, big ? 70 : 40, '#fff0a0');
    for (const s of [-1, 1]) g.add(creature('seraph', s * wd, A, 2, big ? 0.42 : 0.3, s * 0.5, { t: 0.2 }));
    if (t >= 2) { g.add(cyl3(6, 2, big ? 54 : 40, HV.marble, 'stone', 0, A + wd, -2, 12)); g.add(sph((big ? 7 : 5) / PXU, HV.gold, 'gold', P(0, A + wd + (big ? 58 : 44), -2))); }
    if (big) {
      g.add(torus((wd + 13) / PXU, 2.4 / PXU, HV.gold, 'gold', P(0, A, -3), null, null, Math.PI));
      for (const s of [-1, 1]) { const x = s * (wd + 30); g.add(blk(14, 16, 14, HV.marble, 'ashlar', x, 0, 4)); g.add(cyl3(6, 2, 74, HV.marble, 'stone', x, 16, 4, 12)); g.add(sph(4.5 / PXU, HV.gold, 'gold', P(x, 92, 4)));
        g.add(blk(16, 10, 14, HV.marble, 'ashlar', s * (wd + 14), 0, 26)); g.add(creature('seraph', s * (wd + 14), 10, 26, 0.34, s * 0.3, { t: 0.5 })); }
      for (const s of [-1, 1]) { const wg = slab([[0, 0], [16, 6], [26, 18], [18, 14], [22, 24], [12, 16], [10, 22], [4, 10]].map(([a, b]) => [s * a * 1.6 / PXU, b * 1.6 / PXU]), 1.4 / PXU, HV.gold, 'gold', P(s * 6, A + wd + 4, 2)); g.add(wg); }
    }
    return g; },
};
const TOWN3 = { haven: HAVEN3 };

// Model budowli frakcji: key = grupa + stopień (np. 'dw43', 'hall2'); null = brak modelu
function buildTown(fac, key) {
  const M = TOWN3[fac], m = /^([a-z]+\d?)(\d)$/.exec(key); if (!M || !m) return null; const [, grp, tier] = m, fn = M[grp]; if (!fn) return null;
  const root = new THREE.Group(); root.add(fn(+tier)); return root;
}
// Render budowli w rozmiarze miejsca (w × h pikseli sceny) z gęstością D pikseli arkusza na piksel sceny; stopy (środek podstawy) w (ax, ay)
const TOWN_CAM = { yaw: 0.32, pitch: 0.24 };
function renderBuilding(fac, key, w, h, D = 1) {
  const g = buildTown(fac, key); if (!g) return null; G3.init();
  G3.scene.traverse(l => { if (l.isDirectionalLight && l.castShadow) { Object.assign(l.shadow.camera, { left: -5, right: 5, top: 7, bottom: -2, far: 24 }); l.shadow.camera.updateProjectionMatrix(); } }); // budowle są większe od jednostek
  const W = Math.round((w + 120) * D), H = Math.round((h * 1.7 + 30) * D), ax = Math.round(W / 2), ay = H - Math.round(14 * D);
  return G3.render(g, W, H, PXU * D, ax, ay, { ...TOWN_CAM, step: 8 });
}
