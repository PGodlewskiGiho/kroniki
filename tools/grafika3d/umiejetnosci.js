// ==================== MODELE 3D IKON UMIEJĘTNOŚCI (narzędzie, nie trafia do gry) ======================
// Każda umiejętność: plakietka (złota rama, płyta w barwie grupy albo szkoły magii) z przedmiotem-znakiem z przodu (SK3[id] -> THREE.Group).
// Wypalanie: tools/grafika3d/wypal-umiejetnosci.js -> src/grafika/umiejetnosci.webp + umiejetnosci.json.
/* global THREE, G3, mat, mesh, sph, cap, cyl, cone, box, rbox, torus, lathe, tube, sheet, slab, chunk, decal, DK, LT, rng, arGrp, arRot, arGem, arSword, arBow, arArmor, arBoots, arBanner, arBook, arShield, arCloth */
const SK_PANEL = { might: '#7a2e22', magic: '#2a3e7a', land: '#2e5a2e', gold: '#7a5a1a', dark: '#3a2a4a', fire: '#7a2a12', air: '#2a5a7a', water: '#1a3a7a', earth: '#4a3a1a' };
const SK_GROUP = { leadership: 'might', offense: 'might', archery: 'might', armorer: 'might', artillery: 'might', ballistics: 'might', firstAid: 'might', resistance: 'might',
  sorcery: 'magic', intelligence: 'magic', mysticism: 'magic', wisdom: 'magic', eagleSight: 'magic', learning: 'magic',
  logistics: 'land', pathfinding: 'land', scouting: 'land', navigation: 'land', luck: 'gold', estates: 'gold', necromancy: 'dark',
  fireMagic: 'fire', airMagic: 'air', waterMagic: 'water', earthMagic: 'earth' };
const skFlame = (g, x, y, s, cols = ['#e8401a', '#ff9a2a', '#ffe070']) => cols.forEach((c, i) => { const k = 1 - i * 0.3; g.add(mesh(new THREE.ConeGeometry(0.55 * s * k, 1.7 * s * k, 16), c, 'fire', [x, y + 0.85 * s * k - 0.1 * i * s, 0.12 * i], null, [1, 1, 0.6])); g.add(sph(0.55 * s * k, c, 'fire', [x, y, 0.12 * i], [1, 0.9, 0.6])); });
const skLeaf = (col, a) => { const g = new THREE.Group(), L = slab([[0, 0], [0.45, 0.35], [0.5, 0.75], [0.25, 0.95], [0, 0.75], [-0.25, 0.95], [-0.5, 0.75], [-0.45, 0.35]], 0.08, col, 'skin'); g.add(L); g.add(box(0.03, 0.7, 0.03, LT(col, 0.3), 'skin', [0, 0.38, 0.07])); g.rotation.z = a; return g; };
const SK3 = {
  leadership: () => arBanner({ col: '#c8302a', gem: '#ffd060' }),
  luck: () => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) g.add(skLeaf(i % 2 ? '#4ab83a' : '#5ac84a', i * Math.PI / 2 + Math.PI / 4)); g.add(sph(0.14, '#a8f090', 'skin', [0, 0, 0.08])); g.add(tube([[0, 0, -0.02], [0.3, -0.6, 0], [0.55, -1.2, 0]], 0.07, 0.05, '#3a8a2a', 'skin')); return arRot(g, 0.2, -0.2, 0); },
  offense: () => arSword({ col: '#dfe3ea', gem: '#d84a3a' }, { guardCol: '#c8a040', pommelGem: true }),
  archery: () => arBow({ col: '#8a5a2a', gem: '#e8e0c8' }),
  armorer: () => arArmor({ col: '#b8c0cc', gem: '#c8a040' }, { kind: 'steel', plates: true, ridge: '#c8a040', skirt: '#9aa2ae', skirtKind: 'steel' }),
  logistics: () => arBoots({ col: '#7a4a26', gem: '#c8a040' }, { wings: '#f0f0f0', cuff: '#e8e0c8', cuffKind: 'fur' }),
  pathfinding: () => { const g = new THREE.Group(); g.add(cyl(0.12, 0.1, 3.4, '#6a4426', 'wood', [0, -0.2, 0])); g.add(chunk(0.5, 0.25, 0.4, '#7a7a70', 'stone', [0, -1.85, 0], null, 3));
    g.add(slab([[-1.2, -0.28], [0.9, -0.28], [1.35, 0], [0.9, 0.28], [-1.2, 0.28]], 0.12, '#c89a5a', 'wood', [0.35, 0.95, 0.1], [0, 0, 0.08])); g.add(slab([[1.2, -0.25], [-0.9, -0.25], [-1.3, 0], [-0.9, 0.25], [1.2, 0.25]], 0.12, '#a87a40', 'wood', [-0.3, 0.2, 0.1], [0, 0, -0.06]));
    g.add(tube([[-0.9, -1.9, 0.2], [-0.5, -1.6, 0.25], [0.2, -1.9, 0.3], [1.0, -1.7, 0.2]], 0.08, 0.05, '#c8a060', 'cloth')); return arRot(g, 0, -0.25, 0); },
  scouting: () => { const g = new THREE.Group(); [[0.34, 1.1, '#5a3a20', 'leather'], [0.28, 0.9, '#c8a040', 'gold'], [0.22, 0.8, '#c8a040', 'gold']].reduce((y, [r, l, c, k]) => { g.add(cyl(r, r, l, c, k, [0, y + l / 2, 0], null, null, 24)); g.add(torus(r + 0.02, 0.04, '#e8c060', 'gold', [0, y + l, 0], [Math.PI / 2, 0, 0])); return y + l - 0.05; }, -1.4);
    g.add(cyl(0.38, 0.38, 0.12, '#c8a040', 'gold', [0, -1.4, 0], null, null, 24)); g.add(cyl(0.2, 0.2, 0.03, '#9ad8ff', 'gem', [0, 1.28, 0], null, null, 24)); return arRot(g, 0.3, 0, -0.9); },
  sorcery: () => { const g = new THREE.Group(), P = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.55 : 1.4; P.push([Math.cos(a) * r, Math.sin(a) * r]); } g.add(slab(P, 0.2, '#b080ff', 'gem', [0, 0, 0], null, null, 0.8)); g.add(sph(0.35, '#ffffff', 'glow', [0, 0, 0.15], [1, 1, 0.4]));
    for (const [x, y, s] of [[1.3, 1.1, 0.12], [-1.3, -0.9, 0.1], [1.1, -1.2, 0.08]]) g.add(arGem(s, '#e0c8ff', [x, y, 0.1])); return arRot(g, 0.1, -0.25, 0); },
  intelligence: () => { const g = new THREE.Group(), gl = lathe([[0.01, -1.3], [0.9, -1.2], [1.1, -0.6], [0.9, 0.0], [0.32, 0.45], [0.3, 1.0], [0.38, 1.1]], '#d8e8f0', 'gem'); gl.material = gl.material.clone(); Object.assign(gl.material, { transparent: true, opacity: 0.28, emissiveIntensity: 0.1, depthWrite: false }); g.add(gl);
    g.add(lathe([[0.01, -1.22], [0.85, -1.12], [1.02, -0.6], [0.85, -0.15], [0.01, -0.15]], '#4a8aff', 'gem')); g.add(cyl(0.26, 0.3, 0.35, '#8a5a2a', 'wood', [0, 1.2, 0])); for (const [x, y] of [[-0.3, -0.7], [0.25, -0.45], [0.1, -0.9]]) g.add(sph(0.08, '#c8e4ff', 'glow', [x, y, 0.5])); return arRot(g, 0.1, 0, 0.15); },
  mysticism: () => { const g = new THREE.Group(), P = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * 0.35 + i / 24 * Math.PI * 1.3; P.push([Math.cos(a) * 1.4, Math.sin(a) * 1.4]); } for (let i = 24; i >= 0; i--) { const a = Math.PI * 0.35 + i / 24 * Math.PI * 1.3; P.push([Math.cos(a) * 1.05 - 0.45, Math.sin(a) * 1.15]); }
    g.add(slab(P, 0.22, '#ffe890', 'gem', [0, 0, 0], null, null, 0.6)); for (const [x, y, s] of [[0.8, 0.7, 0.2], [1.0, -0.3, 0.14], [0.4, 0.1, 0.1]]) { const S = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * 0.35 : s; S.push([Math.cos(a) * r, Math.sin(a) * r]); } g.add(slab(S, 0.05, '#fff4b0', 'glow', [x, y, 0.1])); }
    return arRot(g, 0.1, -0.3, 0.2); },
  estates: () => { const g = new THREE.Group(), R = rng(5); for (const [x, z, n] of [[-0.7, 0, 6], [0.15, 0.3, 9], [0.95, -0.1, 4]]) for (let i = 0; i < n; i++) g.add(cyl(0.42, 0.42, 0.13, '#f0c040', 'gold', [x + (R() - 0.5) * 0.06, -1 + i * 0.14, z + (R() - 0.5) * 0.06], null, null, 24));
    for (const [x, z] of [[-0.3, 0.9], [0.8, 0.8]]) g.add(cyl(0.42, 0.42, 0.13, '#f0c040', 'gold', [x, -1.0, z], [0.1, 0, 0.15], null, 24)); g.add(arGem(0.2, '#e03a3a', [-0.75, -0.05, 0.1])); return arRot(g, 0.35, -0.3, 0); },
  learning: () => { const g = new THREE.Group(); for (const s of [-1, 1]) { const pg = new THREE.Group(); pg.add(rbox(1.25, 1.8, 0.08, 0.03, '#f4ead0', 'cloth', [s * 0.68, 0, 0])); for (let i = 0; i < 5; i++) pg.add(box(0.85 - (i === 4 ? 0.35 : 0), 0.04, 0.02, '#8a7a5a', 'cloth', [s * 0.7 - (i === 4 ? s * 0.17 : 0), 0.55 - i * 0.25, 0.05]));
      pg.add(rbox(1.35, 1.95, 0.08, 0.03, '#7a2a2a', 'leather', [s * 0.7, 0, -0.08])); pg.rotation.y = -s * 0.28; g.add(pg); } g.add(tube([[0, 0.9, 0.06], [0.05, -0.3, 0.1], [0.1, -1.4, 0.1]], 0.04, 0.04, '#d84a3a', 'cloth')); return arRot(g, -0.35, 0, 0); },
  necromancy: () => { const g = new THREE.Group(), B = '#ece6d2', D = '#ddd5bc', H = '#1a1218';
    g.add(sph(0.82, B, 'bone', [0, 0.42, -0.05], [0.9, 0.88, 1.08], 32)); // mózgoczaszka: wyższa z tyłu, węższa po bokach
    g.add(sph(0.6, B, 'bone', [0, 0.0, 0.4], [1.1, 0.95, 0.75], 28)); // twarzoczaszka
    for (const s of [-1, 1]) { g.add(sph(0.2, D, 'bone', [s * 0.46, -0.16, 0.6], [1, 0.7, 0.7])); // kości policzkowe
      g.add(sph(0.25, H, 'cloth', [s * 0.27, 0.14, 0.76], [1, 1.05, 0.5])); g.add(sph(0.045, '#5ae07a', 'glow', [s * 0.27, 0.12, 0.8])); // oczodoły z ognikiem
      g.add(torus(0.26, 0.05, D, 'bone', [s * 0.27, 0.16, 0.78], [0, 0, 0], [1, 1, 0.6], Math.PI)); } // łuki brwiowe
    g.add(slab([[0, 0.08], [0.11, -0.12], [0.03, -0.2], [0, -0.16], [-0.03, -0.2], [-0.11, -0.12]], 0.04, H, 'cloth', [0, -0.18, 0.92])); // otwór nosowy
    g.add(rbox(0.66, 0.24, 0.5, 0.1, D, 'bone', [0, -0.5, 0.5])); for (let i = -3; i <= 3; i++) g.add(rbox(0.08, 0.16, 0.08, 0.03, '#f8f4e6', 'bone', [i * 0.085, -0.66, 0.74])); // szczęka i górne zęby
    const jaw = new THREE.Group(); jaw.add(rbox(0.6, 0.18, 0.44, 0.08, D, 'bone', [0, -0.92, 0.48])); for (const s of [-1, 1]) jaw.add(rbox(0.12, 0.5, 0.36, 0.05, D, 'bone', [s * 0.36, -0.7, 0.28], [0.2, 0, 0]));
    for (let i = -3; i <= 3; i++) jaw.add(rbox(0.075, 0.14, 0.08, 0.03, '#f8f4e6', 'bone', [i * 0.08, -0.79, 0.69])); jaw.rotation.x = 0.08; g.add(jaw);
    return arRot(g, 0.12, -0.45, 0); },
  wisdom: () => { const g = new THREE.Group(), pg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.4, 1, 16), mat('#f0e2b8', 'cloth').clone()), p = pg.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getY(i) * 2.2) * 0.08); pg.geometry.computeVertexNormals(); pg.material.side = THREE.DoubleSide; g.add(pg);
    for (const y of [1.25, -1.25]) { g.add(cyl(0.2, 0.2, 2.15, '#e8d8a8', 'cloth', [0, y, 0.06], [0, 0, Math.PI / 2], null, 20)); for (const x of [-1.2, 1.2]) g.add(sph(0.16, '#c8a040', 'gold', [x, y, 0.06])); }
    for (let i = 0; i < 6; i++) g.add(box(i % 3 === 2 ? 0.9 : 1.4, 0.05, 0.02, '#6a5434', 'cloth', [i % 3 === 2 ? -0.25 : 0, 0.75 - i * 0.3, 0.1])); g.add(arGem(0.15, '#3a6aff', [0.6, -0.95, 0.1])); return arRot(g, 0, -0.3, 0.08); },
  navigation: () => { const g = new THREE.Group(), c = '#9aa2ae'; g.add(torus(0.3, 0.08, c, 'iron', [0, 1.55, 0])); g.add(cyl(0.11, 0.11, 2.8, c, 'iron', [0, 0.1, 0])); g.add(rbox(1.5, 0.18, 0.18, 0.06, c, 'iron', [0, 0.95, 0]));
    g.add(torus(1.05, 0.12, c, 'iron', [0, -0.3, 0], [0, 0, Math.PI * 1.15], null, Math.PI * 0.7)); for (const s of [-1, 1]) g.add(cone(0.24, 0.5, c, 'iron', [s * 0.95, -0.55, 0], [0, 0, s * 0.9], 4)); g.add(cone(0.2, 0.4, c, 'iron', [0, -1.45, 0], [Math.PI, 0, 0], 4));
    g.add(tube([[0.3, 1.55, 0.1], [0.9, 1.1, 0.3], [0.7, 0.2, 0.35], [1.0, -0.6, 0.2]], 0.06, 0.06, '#c8a060', 'cloth')); return arRot(g, 0.1, -0.35, 0.05); },
  artillery: () => { const g = new THREE.Group(); g.add(rbox(0.5, 0.5, 2.4, 0.08, '#6a4426', 'wood', [0, 0, 0])); for (const s of [-1, 1]) g.add(tube([[0, 0.05, 0.9], [s * 0.9, 0.05, 0.75], [s * 1.6, 0.05, 0.25]], 0.1, 0.06, '#8a5a2a', 'wood'));
    for (const s of [-1, 1]) g.add(tube([[s * 1.6, 0.06, 0.25], [0, 0.3, -0.9]], 0.02, 0.02, '#e8e0c8', 'cloth')); g.add(cyl(0.05, 0.05, 2.6, '#c8b8a0', 'wood', [0, 0.32, 0.05], [Math.PI / 2, 0, 0])); g.add(cone(0.12, 0.4, '#dfe3ea', 'steel', [0, 0.32, 1.5], [Math.PI / 2, 0, 0], 4));
    g.add(cyl(0.25, 0.3, 0.9, '#5a3a20', 'wood', [0, -0.65, 0])); g.add(rbox(1.4, 0.15, 1.4, 0.04, '#5a3a20', 'wood', [0, -1.1, 0])); return arRot(g, 0.55, 0.6, 0); },
  ballistics: () => { const g = new THREE.Group(); for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - (r === 2 ? 1 : 0); i++) g.add(chunk(0.42, 0.24, 0.3, r % 2 ? '#a89e8a' : '#968c78', 'stone', [-0.9 + i * 0.85 + (r % 2) * 0.42, -1.1 + r * 0.5, 0], null, r * 3 + i + 1, 10));
    g.add(chunk(0.6, 0.6, 0.6, '#7a7468', 'stone', [0.8, 0.9, 0.3], null, 9, 16)); for (let i = 1; i <= 3; i++) g.add(sph(0.18 - i * 0.03, '#d8d0c0', 'cloth', [0.8 - i * 0.55, 0.9 + i * 0.35, 0.2])); for (const [x, y] of [[0.0, -0.1], [-0.3, 0.1]]) g.add(chunk(0.14, 0.1, 0.1, '#968c78', 'stone', [x, y, 0.3], null, 13));
    return arRot(g, 0.1, -0.3, 0); },
  firstAid: () => { const g = new THREE.Group(); g.add(mesh(new THREE.ConeGeometry(1.5, 2.0, 4, 1, true), '#e8e2cc', 'cloth', [0, 0, 0], [0, Math.PI / 4, 0])); g.children[0].material = g.children[0].material.clone(); g.children[0].material.side = THREE.DoubleSide;
    g.add(slab([[-0.45, -0.9], [0.45, -0.9], [0, 0.2]], 0.04, '#3a2a1a', 'cloth', [0, 0, 0.75], [-0.35, 0, 0])); g.add(cyl(0.05, 0.05, 0.6, '#6a4426', 'wood', [0, 1.2, 0])); g.add(arCloth(0.6, 0.35, '#d83a3a', 'cloth', [0.3, 1.35, 0], 0.05));
    const cr = new THREE.Group(); cr.add(box(0.16, 0.55, 0.04, '#d83a3a', 'cloth')); cr.add(box(0.55, 0.16, 0.04, '#d83a3a', 'cloth')); cr.position.set(0.53, 0.05, 0.53); cr.rotation.set(-0.35, Math.PI / 4, 0); g.add(cr);  return arRot(g, 0.25, -0.15, 0); },
  resistance: () => { const g = arShield({ col: '#6a8ad0', gem: '#e0c0ff' }, { rim: '#c8ccd4', gem: true, gemY: 0.2 }); g.add(torus(1.75, 0.05, '#c8a0ff', 'glow', [0, 0, -0.2])); g.add(torus(1.55, 0.03, '#e0c8ff', 'glow', [0, 0, -0.2], [0, 0, 0.5], [1, 1, 1], Math.PI * 1.4)); return g; },
  fireMagic: () => { const g = new THREE.Group(); skFlame(g, 0, -0.6, 1.2); skFlame(g, -0.75, -0.95, 0.6); skFlame(g, 0.75, -0.9, 0.65); g.add(chunk(1.5, 0.25, 0.6, '#3a2a22', 'stone', [0, -1.25, 0], null, 4)); return arRot(g, 0.1, 0, 0); },
  airMagic: () => { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const P = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * Math.PI * 4 + k * 2.1, r = 0.15 + t * (1.0 - k * 0.12); P.push([Math.cos(a) * r, -1.5 + t * 3.0, Math.sin(a) * r * 0.6]); } g.add(tube(P, 0.04 + 0.04 * k, 0.12 - 0.02 * k, ['#e8f6ff', '#a8d8ff', '#6ab0f0'][k], 'glow')); }
    for (const [x, y] of [[-1.1, 0.8], [1.15, 0.2], [-0.9, -0.6]]) g.add(sph(0.06, '#ffffff', 'glow', [x, y, 0.3])); return arRot(g, 0.15, 0, 0); },
  waterMagic: () => { const g = new THREE.Group(), P = [[0.01, 1.6]]; for (let i = 1; i <= 16; i++) { const t = i / 16; P.push([Math.sin(t * Math.PI * 0.95) * (t < 0.6 ? t * 1.6 : 1.05) * (t > 0.85 ? Math.sin((1 - t) / 0.15 * Math.PI / 2) * 0.9 + 0.1 : 1), 1.6 - t * 2.9]); }
    const d = lathe(P, '#3a8aff', 'gem'); d.material = d.material.clone(); Object.assign(d.material, { transparent: true, opacity: 0.85, emissiveIntensity: 0.35 }); g.add(d); g.add(sph(0.25, '#e8f6ff', 'glow', [-0.35, -0.35, 0.65], [0.8, 1.2, 0.4]));
    g.add(torus(1.3, 0.05, '#8ac8ff', 'glow', [0, -1.35, 0], [Math.PI / 2, 0, 0], [1, 1, 1])); return arRot(g, 0.1, 0, 0); },
  earthMagic: () => { const g = new THREE.Group(); g.add(chunk(1.6, 0.4, 0.9, '#6a5a3a', 'stone', [0, -1.0, 0], null, 2, 18)); g.add(rbox(3.0, 0.12, 1.6, 0.05, '#5a7a2a', 'skin', [0, -0.75, 0]));
    for (const [x, h, r, c] of [[0, 2.0, 0.42, '#c8a050'], [-0.65, 1.3, 0.3, '#a8864a'], [0.65, 1.5, 0.32, '#d8b060'], [0.25, 0.9, 0.2, '#e8c070']]) g.add(mesh(new THREE.CylinderGeometry(0, r, h, 6), c, 'gem', [x, -0.7 + h / 2, 0.1], [0, x, (x) * -0.15]));
    return arRot(g, 0.15, -0.2, 0); },
  eagleSight: () => { const g = new THREE.Group(), fe = (L, w) => [[0, 0], [w, L * 0.12], [w * 0.9, L * 0.85], [0, L], [-w * 0.9, L * 0.85], [-w, L * 0.12]];
    const add = (pts, d, col, kind, x, y, z, a) => g.add(slab(pts, d, col, kind, [x, y, z], [0, 0, a]));
    const dirF = (s, x, y, z, th, L, w, col, d = 0.04) => add(fe(L, w), d, col, 'feather', s * x, y, z, s * (th - Math.PI / 2)); // pióro od (x,y) w kierunku th (od +x, w górę)
    for (const s of [-1, 1]) { // skrzydło: pełny płat, lotki wachlarzem z końca, lotki drugorzędne w dół, pokrywy na wierzchu
      add([[0, -0.1], [0.4, 0.45], [1.0, 0.95], [1.55, 1.3], [1.75, 1.15], [1.6, 0.55], [1.25, 0.05], [0.75, -0.25], [0.25, -0.35]].map(([x, y]) => [s * x, y]), 0.1, '#5a3418', 'feather', s * 0.2, 0.1, -0.02, 0);
      for (let k = 0; k < 7; k++) { const t = k / 6; dirF(s, 1.75 + 0.05 * Math.sin(t * 3), 1.4 - t * 1.15, -0.08 + k * 0.012, 1.15 - t * 1.75, 0.95 - t * 0.25, 0.17, k % 2 ? '#3a2210' : '#4a2c16'); }
      for (let k = 0; k < 6; k++) { const t = k / 5; dirF(s, 1.3 - t * 0.95, 0.2 - t * 0.3, -0.04 + k * 0.01, -0.75 - t * 0.6, 0.6, 0.16, k % 2 ? '#4a2c16' : '#5a3418'); }
      for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { const t = k / 5; dirF(s, 0.45 + t * 1.15 - r * 0.1, 0.25 + t * 0.85 - r * 0.35, 0.06 + r * 0.04, -0.6 - t * 0.2, 0.42 - r * 0.06, 0.15, r ? '#a06a38' : '#8a5a2e', 0.05); } }
    g.add(sph(0.48, '#5a3418', 'feather', [0, -0.15, 0.1], [0.85, 1.25, 0.7])); g.add(sph(0.3, '#7a4a24', 'feather', [0, 0.25, 0.25], [1, 0.9, 0.7])); // tułów i pierś
    for (let k = -2; k <= 2; k++) add(fe(0.75, 0.12), 0.04, '#f4f0e6', 'feather', k * 0.08, -0.65, 0.0, Math.PI + k * 0.22); // ogon
    g.add(sph(0.34, '#f4f0e6', 'feather', [0, 0.55, 0.25], [0.95, 0.85, 0.85])); g.add(sph(0.38, '#fbf8f0', 'feather', [0.08, 0.86, 0.3], [1.05, 0.9, 0.9])); // szyja i głowa (zwrócona w prawo)
    g.add(cone(0.11, 0.3, '#f0b020', 'horn', [0.52, 0.82, 0.34], [0, 0, -Math.PI / 2], 12)); g.add(sph(0.08, '#e8a018', 'horn', [0.6, 0.76, 0.34], [1, 1.2, 0.9])); g.add(sph(0.12, '#f0c040', 'horn', [0.4, 0.84, 0.34], [1, 0.8, 0.9])); // dziób z hakiem i woskówka
    g.add(sph(0.055, '#ffd040', 'glow', [0.26, 0.94, 0.6])); g.add(sph(0.025, '#1a1008', 'cloth', [0.275, 0.94, 0.65])); g.add(box(0.18, 0.04, 0.05, '#e8e0d0', 'feather', [0.24, 1.01, 0.6], [0, 0, -0.2])); // oko i brew
    for (const s of [-1, 1]) { g.add(cyl(0.06, 0.05, 0.3, '#e8b020', 'skin', [s * 0.16, -0.62, 0.3])); for (let k = -1; k <= 1; k++) g.add(cone(0.03, 0.18, '#2a2018', 'horn', [s * 0.16 + k * 0.07, -0.82, 0.34], [0.3, 0, k * 0.4 + Math.PI], 6)); } // nogi i szpony
    return arRot(g, 0.05, -0.12, 0); },
};
// Plakietka z przedmiotem: rama 3×3 jednostki, przedmiot dopasowany do koła o promieniu 1.15 przed płytą
function renderSkill(id, S = 192) {
  const f = SK3[id]; if (!f) return null; const col = SK_PANEL[SK_GROUP[id]] || '#4a3e2c', w = new THREE.Group();
  w.add(rbox(3.0, 3.0, 0.3, 0.1, '#c8a050', 'gold', [0, 0, -0.15])); w.add(rbox(2.62, 2.62, 0.22, 0.06, col, 'leather', [0, 0, 0.0])); w.add(rbox(2.66, 0.08, 0.05, 0.02, LT(col, 0.25), 'leather', [0, 1.26, 0.1]));
  for (const [x, y] of [[-1.32, 1.32], [1.32, 1.32], [-1.32, -1.32], [1.32, -1.32]]) w.add(sph(0.12, '#e8c070', 'gold', [x, y, 0.02]));
  const g = f(), b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3()), R = b.getBoundingSphere(new THREE.Sphere()).radius, z = b.getSize(new THREE.Vector3()), k = Math.min(2.2 / Math.max(z.x, z.y), 1.5 / R);
  const h = new THREE.Group(); g.position.sub(c); h.add(g); h.scale.setScalar(k); h.position.set(0, 0, 0.25 + (b.max.z - c.z) * k * 0.5); w.add(h);
  return G3.render(w, S, S, S / 3.05, S / 2, S / 2, { raw: true, yaw: 0.0, pitch: 0.08 });
}
