// Grafika: portrety bohaterów i mury oblężenia. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('portrety: każdy bohater frakcji wygląda inaczej, ten sam zawsze tak samo', async () => {
  const r = await page.evaluate(() => {
    const all = FACTIONS.flatMap(F => F.heroes.map(([name, cls, f]) => ({ name, cls, female: !!f })));
    const pix = h => { const c = portraitCanvas(h, '#c8302a'); return Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data).join(','); };
    const imgs = all.map(pix);
    PORTRAITS.clear(); const again = pix(all[0]);
    return { n: all.length, unique: new Set(imgs).size, same: again === imgs[0], size: portraitCanvas(all[0], '#2a5ac8').width, looks: all.every(h => HERO_LOOKS[h.name]) };
  });
  assert.equal(r.unique, r.n);
  assert.ok(r.same);
  assert.equal(r.size, 72, 'portret 72×72 (siatka 36, dwa razy gęściej)');
  assert.ok(r.looks, 'każdy bohater frakcji ma własny opis wyglądu');
});

test('mury: jeden sprite zamku, nowy rysunek po trafieniu i wyłomie', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1], h = hero(st); t.built = ['hall1', 'dw1', 'fort', 'citadel', 'castle'];
    const B = createBattle(st, h, t), spr = () => castleSprite(t.faction, '#888888', B.walls);
    const s0 = spr(), again = spr() === s0, w = wallAt(B, SIEGE_X, 2); w.hp--; const s1 = spr(); w.hp = 0; const s2 = spr();
    setScreen('battle', { battle: B });
    return { again, hit: s1 !== s0, down: s2 !== s1 && s2 !== s0, w: s0.c.width === Math.ceil(80 * PXD) };
  });
  assert.deepEqual(r, { again: true, hit: true, down: true, w: true });
  await frames(page, 4);
});

test('interfejs w pixel arcie: pergamin, kamień i przyciski w buforze pikseli grafiki z twardymi krawędziami, rogi schodkowe', async () => {
  const r = await page.evaluate(() => {
    const b = new Button(0, 0, 120, 40, 'Test', null); const c = document.createElement('canvas').getContext('2d'); b.draw(c);
    const L = [uiLayer('btn_120x40_n', 124, 46, cc => paintButton(cc, 120, 40, 'n')), uiLayer('parch_200x100', 216, 116, cc => paintParchment(cc, 4, 4, 200, 100))];
    const alphas = new Set(); for (const l of L) { const d = l.getContext('2d').getImageData(0, 0, l.width, l.height).data; for (let i = 3; i < d.length; i += 4) alphas.add(d[i]); }
    const p = []; const rec = { beginPath() {}, moveTo(x, y) { p.push([x, y]); }, lineTo(x, y) { p.push([x, y]); }, closePath() {} }; rr(rec, 0, 0, 40, 20, 6);
    return { w: L[0].width === Math.ceil(124 / PIX), alphas: [...alphas].sort((a, b) => a - b), axis: p.every(([x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return x === x2 || y === y2; }) };
  });
  assert.ok(r.w, 'bufor przycisku w pikselach grafiki (124 px logicznych / PIX)');
  assert.deepEqual(r.alphas.filter(a => ![0, 150, 255].includes(a)), [], 'tylko 3 stopnie krycia');
  assert.ok(r.axis, 'róg rr to schodki (same odcinki poziome i pionowe)');
});

test('czcionka pikselowa wbudowana w plik gry (także polskie znaki) i przełącznik w ustawieniach grafiki', async () => {
  const r = await page.evaluate(async () => {
    await document.fonts.load(`16px ${FONT_PIXEL}`, 'Aąęśćżźółń'); const S = G.settings, f0 = S.font; S.font = 'classic';
    const ok = document.fonts.check(`16px ${FONT_PIXEL}`, 'ąęśćżźółń'), classic = font(16);
    showGfxSettings(); G.modal.buttons.find(b => /Czcionka/.test(b.label)).action(); const pixel = font(16), label = G.modal.buttons.find(b => /Czcionka/.test(b.label)).label; G.modal = null;
    S.font = f0; Layers.cache = {}; return { ok, classic, pixel, label };
  });
  assert.ok(r.ok, 'czcionka załadowana z pliku gry'); assert.match(r.classic, /Cinzel/); assert.match(r.pixel, /Jersey/); assert.equal(r.label, 'Czcionka: piksele');
});

test('ikony umiejętności: każda umiejętność ma własny obrazek; okno awansu i ekran bohatera je rysują', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const pix = id => Array.from(skillSprite(id).c.getContext('2d').getImageData(0, 0, 16, 16).data).join(',');
    const ids = Object.keys(SKILLS), h = hero(G.state); h.skills = ids.slice(0, MAX_SKILLS).map(id => ({ id, lv: 2 }));
    setScreen('hero', { heroId: G.state.selHero }); G.screens.hero.draw(G.ctx);
    setScreen('adventure', {}); h.exp = 0; gainExp(G.state, h, 1000); const lead = G.modal.buttons.every(b => typeof b.lead === 'function'); G.modal = null;
    return { n: ids.length, unique: new Set(ids.map(pix)).size, lead };
  });
  assert.equal(r.unique, r.n); assert.ok(r.lead, 'wybór umiejętności z ikoną');
});

test('bohater stoi na polu bitwy i unosi rękę, rzucając czar; strzała leci szybko po parabolicznym torze', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), f = st.heroes.find(x => x.owner === 1); h.book = true; h.spells = ['magicArrow']; h.mana = 50;
    const B = createBattle(st, h, f), scr = G.screens.battle; setScreen('battle', { battle: B }); scr.intro = { t: 99, dur: 1 }; scr.phase = 'input';
    const t = B.units.find(u => u.side === 1); castBattle(B, 'magicArrow', t.x, t.y); scr.play = null; for (let i = 0; i < 3; i++) scr.update(0.02); scr.draw(G.ctx);
    const pr = { kind: 'arrow', x0: 0, y0: 100, x1: 600, y1: 100, dur: 1, arc: 48, t: 0.5 };
    return { cast: scr.heroCast && scr.heroCast.side, spr: !!heroBattleSprite(f, '#2a5ac8', -1, 0, false).c, peak: projPos(pr)[1], dur: (0.08 + 600 / 1500) };
  });
  assert.equal(r.cast, 0); assert.ok(r.spr); assert.equal(r.peak, 52); assert.ok(r.dur < 0.5, 'strzała na 600 px krócej niż pół sekundy');
});

test('pogoda: codziennie inna wg pory roku, rysuje się bez błędów i da się ją wyłączyć', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, seen = {}, month = st.month, day = st.dayTotal, out = { winterRain: false };
    for (let m = 1; m <= 4; m++) for (let d = 1; d <= 60; d++) { st.month = m; st.dayTotal = d; const w = weatherOf(st); seen[w] = 1; if (m === 4 && (w === 'rain' || w === 'storm')) out.winterRain = true; }
    st.dayTotal = 5; out.stable = weatherOf(st) === weatherOf(st);
    const real = weatherOf; for (const w of Object.keys(WEATHERS)) { window.weatherOf = () => w; drawMapView(G.ctx, st, G.screens.adventure); }
    G.settings.weather = 'off'; out.off = !weatherOn(); delete G.settings.weather; out.on = weatherOn(); window.weatherOf = real;
    st.month = month; st.dayTotal = day; out.kinds = Object.keys(seen).sort(); out.tip = G.screens.adventure.rightInfo(INFOBOX.x + 10, INFOBOX.y + 10);
    return out;
  });
  assert.deepEqual(r.kinds, ['clear', 'clouds', 'fog', 'rain', 'snow', 'storm']);
  assert.ok(!r.winterRain, 'zimą nie pada deszcz'); assert.ok(r.stable && r.off && r.on); assert.match(r.tip, /Pogoda dziś: /);
});

test('mur z cegieł ma detale i malowidła; zakryte kawałki mapy zagadki pokazują obraz frakcji', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 800; c.height = 600; const g = c.getContext('2d'); let alpha = 0;
    const f = g.fillRect.bind(g); g.fillRect = (...a) => { if (g.globalAlpha < 1) alpha++; f(...a); }; paintBricks(g, 800, 600, 5);
    const st = G.state; if (!st.grail) return { alpha, skip: true };
    const a = puzzleCover(st, 512, 384); st.players[ME].faction = st.players[ME].faction === 'inferno' ? 'haven' : 'inferno'; const b = puzzleCover(st, 512, 384);
    showPuzzle(st); G.modal.draw(G.ctx); G.modal = null;
    return { alpha, diff: a !== b && a.width === Math.round(512 / PIX) };
  });
  assert.ok(r.alpha > 50, `malowidła: ${r.alpha}`); if (!r.skip) assert.ok(r.diff, 'obraz zależy od frakcji');
});

test('rozmiar piksela: 2 (niska jakość), 1 (drobny) i domyślny, bez błędów rysowania', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const w = s => s.c.width; setPixelSize(2); const a = w(battleSprite('pikeman', 1, 'idle', 0)); G.screens.adventure.draw(G.ctx);
    setPixelSize(1); const b = w(battleSprite('pikeman', 1, 'idle', 0)); G.screens.adventure.draw(G.ctx);
    const out = { a, b, u: battleSprite('pikeman', 1, 'idle', 0).u, world: PixBufs.world.width, view: VIEW.w }; setPixelSize(PIX_DEFAULT); G.screens.adventure.draw(G.ctx);
    return { ...out, mid: PixBufs.world.width === Math.round(VIEW.w / PIX_DEFAULT) };
  });
  assert.equal(r.b, r.a * 2); assert.equal(r.u, 1); assert.equal(r.world, r.view, 'bufor mapy: 1 piksel grafiki = 1 px logiczny'); assert.ok(r.mid, 'domyślny piksel PIX_DEFAULT');
});

test('kursor zmienia się wg celu: mapa (ruch, atak, odwiedziny, zakaz), przyciski, bitwa (miecz, strzała)', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n; human(st).explored.fill(1); centerCam(st, h.x, h.y); G.modal = null;
    const at = (tx, ty) => adventureCursor(st, VIEW.x + (tx * T - st.cam.x) * ZOOM + 5, VIEW.y + (ty * T - st.cam.y) * ZOOM + 5);
    const m = st.objects.find(o => o.type === 'monster' && !o.dead), res = st.objects.find(o => o.type === 'res');
    let free = null; for (let d = 1; d < 6 && !free; d++) for (const [dx, dy] of [[d, 0], [0, d], [-d, 0], [0, -d]]) { const x = h.x + dx, y = h.y + dy; if (passableTile(st, x, y, h) && !objectAt(st, y * n + x) && !heroAt(st, x, y)) { free = [x, y]; break; } }
    let wall = null; for (let i = 0; i < n * n && !wall; i++) if (st.map.obst[i] && !objectAt(st, i)) wall = [i % n, Math.floor(i / n)];
    const out = { monster: at(m.x, m.y), res: res ? at(res.x, res.y) : 'visit', free: free ? at(...free) : 'move', wall: at(...wall) };
    out.css = cursorCss('attack').startsWith('url(data:image/png'); setCursor('attack'); out.set = G.canvas.style.cursor.includes('url(');
    const B = createBattle(st, h, m), scr = G.screens.battle; setScreen('battle', { battle: B }); scr.phase = 'input';
    scr.preview = { kind: 'attack' }; out.bAtt = battleCursor(scr); scr.preview = { kind: 'shoot' }; out.bShoot = battleCursor(scr); scr.preview = { kind: 'far' }; out.bFar = battleCursor(scr);
    return out;
  });
  assert.deepEqual(r, { monster: 'attack', res: 'visit', free: 'move', wall: 'no', css: true, set: true, bAtt: 'attack', bShoot: 'shoot', bFar: 'no' });
});

test('kółko myszy przybliża i oddala mapę wokół kursora; pole pod kursorem zostaje to samo', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, s = G.screens.adventure, h = hero(st); setScreen('adventure', {}); centerCam(st, h.x, h.y);
    const mx = VIEW.x + 200, my = VIEW.y + 150, before = screenToTile(st, mx, my); G.mouse.x = mx; G.mouse.y = my;
    s.onWheel(-1); const z1 = ZOOM, after = screenToTile(st, mx, my); s.onWheel(1); s.onWheel(1); const z2 = ZOOM;
    for (let i = 0; i < 5; i++) s.onWheel(1); const zMin = ZOOM; for (let i = 0; i < 9; i++) s.onWheel(-1); const zMax = ZOOM;
    s.draw(G.ctx); setZoom(st, 1); s.onKey('-'); const key = ZOOM; setZoom(st, 1);
    return { z1, z2, zMin, zMax, key, same: before.tx === after.tx && before.ty === after.ty };
  });
  assert.deepEqual(r, { z1: 1.5, z2: 0.75, zMin: 0.5, zMax: 2, key: 0.75, same: true });
});

test('jednostki z modeli 3D: wbudowane arkusze dają klatki bitwy i mapy, odbicie dla drugiej strony, machiny z dawnego rysunku', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const ids = Object.keys(UNIT_ART), a = battleSprite('pikeman', 1, 'idle', 0), b = battleSprite('pikeman', -1, 'idle', 0), m = creatureSprite('pikeman', 1, 2);
    const poses = ['idle', 'walk', 'attack', 'hurt', 'dead', 'map'].every(p => UNIT_ART.pikeman.f[p].length === (BATTLE_FRAMES[p] || 4));
    const mach = battleSprite('ballista', 1, 'idle', 0); drawCreatureIcon(G.ctx, 'pikeman', 100, 100, 2); drawCreatureIcon(G.ctx, 'pikeman', 100, 100, 1);
    return { n: ids.length, u: a.u, mu: m.u, mirror: a.c.width === b.c.width && a.ax + b.ax === a.c.width, poses, mach: !UNIT_ART.ballista && mach.u !== 1.3, tall: a.c.height };
  });
  assert.ok(r.n >= 70, `arkuszy: ${r.n}`); assert.equal(r.u, 1.3); assert.equal(r.mu, 1.8); assert.ok(r.mirror, 'odbicie w poziomie'); assert.ok(r.poses); assert.ok(r.mach);
  assert.ok(r.tall > 35 && r.tall < 80, `wysokość klatki: ${r.tall}`);
});
