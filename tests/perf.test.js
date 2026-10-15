// Wydajność: klatki tylko w razie potrzeby, jakość grafiki, mgła i teren z pamięci podręcznej. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Ile razy ekran narysował się w ciągu ms milisekund (licznik na render)
const renders = (ms) => page.evaluate(ms => new Promise(res => {
  let n = 0; const orig = window.render; window.render = () => { n++; orig(); };
  setTimeout(() => { window.render = orig; res(n); }, ms);
}), ms);
// Kursor poza oknem gry: nowszy Chromium bez okna zgłasza mysz w rogu (0,0), a to na mapie przewija ją krawędzią (i słusznie rysuje 60 klatek)
const noMouse = () => page.evaluate(() => { const m = G.mouse; m.x = m.y = m.vx = m.vy = -1; });

test('teren bez workerów oddaje sterowanie po wyczerpaniu budżetu', async () => {
  const r = await page.evaluate(() => {
    const state = G.state, idle = window.requestIdleCallback, now = performance.now, steps = window.renderChunkSteps, on = TerrainPool.on;
    const callbacks = []; let clock = 0, completed = 0;
    try {
      window.requestIdleCallback = callback => { callbacks.push(callback); return callbacks.length; };
      performance.now = () => clock;
      TerrainPool.on = () => false;
      window.renderChunkSteps = function* () { clock += 7; return {}; };
      const map = { n: CHUNK * 3 }, st = { map, cam: { x: 0, y: 0 }, players: [], heroes: [], towns: [] };
      G.state = st;
      const renderer = Object.assign({}, MapRender, { map, cache: new Map(), warming: false, warmed: false, sprIt: false, job: null,
        store(key, canvas) { completed++; this.cache.set(key, canvas); return canvas; } });
      renderer.warm(st);
      callbacks.shift()({ timeRemaining: () => 50 });
      return { completed, queued: callbacks.length, clock };
    } finally {
      G.state = state; window.requestIdleCallback = idle; performance.now = now; window.renderChunkSteps = steps; TerrainPool.on = on;
    }
  });
  assert.equal(r.completed, 1, `jedna porcja pracy, nie ${r.completed} fragmentów (${r.clock} ms)`);
  assert.equal(r.queued, 1, 'pozostała praca zaplanowana na następną wolną chwilę');
});

test('grafiki mapy oddają sterowanie między pojedynczymi obrazkami', async () => {
  const r = await page.evaluate(() => {
    const creature = window.creatureSprite, obstacle = window.obstacleSprite, object = window.map3dSprite, grade = window.gradedSprite;
    let count = 0;
    try {
      const sprite = () => ({ c: {} });
      window.creatureSprite = window.obstacleSprite = window.map3dSprite = sprite;
      window.gradedSprite = () => { count++; };
      const n = 4, map = { n, seed: 1, obst: new Uint8Array(n * n).fill(1), terrain: new Uint8Array(n * n) };
      const st = { map, towns: [], objects: [{ type: 'monster', cid: 'test', dir: 0, x: 0, y: 0 }, { type: 'chest', x: 1, y: 1 }] };
      const jobs = mapSpriteJobs(st), batches = []; let result;
      do { const before = count; result = jobs.next(); batches.push(count - before); } while (!result.done);
      return { batches, count };
    } finally {
      window.creatureSprite = creature; window.obstacleSprite = obstacle; window.map3dSprite = object; window.gradedSprite = grade;
    }
  });
  assert.equal(r.count, 11, 'wszystkie klatki potwora, obiekt i sześć przeszkód');
  assert.ok(r.batches.every(count => count <= 1), `obrazki na porcję: ${r.batches.join(', ')}`);
});

test('gęsty teren kończy przygotowanie, także gdy cała mapa nie mieści się w cache', async () => {
  const r = await page.evaluate(() => {
    const state = G.state, idle = window.requestIdleCallback, now = performance.now, steps = window.renderChunkSteps, on = TerrainPool.on;
    const callbacks = []; let clock = 0, generated = 0;
    try {
      window.requestIdleCallback = callback => { callbacks.push(callback); return callbacks.length; };
      performance.now = () => clock; TerrainPool.on = () => false;
      window.renderChunkSteps = function* () { clock += 7; generated++; return {}; };
      const map = { n: CHUNK * 12 }, st = { map, cam: { x: 0, y: 0 }, players: [], heroes: [], towns: [] };
      G.state = st;
      const renderer = Object.assign({}, MapRender, { map, D: mapBufScale() * 3, cache: new Map(), warming: false, warmed: false, sprIt: false, job: null });
      const drain = () => { for (let count = 0; callbacks.length && count < 400; count++) callbacks.shift()({ timeRemaining: () => 50 }); };
      renderer.warm(st); drain();
      const first = { warmed: renderer.warmed, queued: callbacks.length, generated, cached: renderer.cache.size };
      st.cam.x = CHUNK * T * 8; st.cam.y = CHUNK * T * 8;
      renderer.warm(st); drain();
      return { first, moved: { warmed: renderer.warmed, queued: callbacks.length, visible: renderer.has(9, 9) } };
    } finally {
      G.state = state; window.requestIdleCallback = idle; performance.now = now; window.renderChunkSteps = steps; TerrainPool.on = on;
    }
  });
  assert.equal(r.first.warmed, true, `praca tła musi się zakończyć: ${JSON.stringify(r.first)}`);
  assert.equal(r.first.queued, 0);
  assert.ok(r.first.generated <= 110, `nie generuj całej mapy do cache 110: ${r.first.generated}`);
  assert.ok(r.first.cached <= 110, 'zachowany limit pamięci');
  assert.deepEqual(r.moved, { warmed: true, queued: 0, visible: true }, 'nowy obszar przygotowany po ruchu kamery');
});

test('zoom zachowuje ostry bufor widoku i gotowy teren', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const quality = G.settings.quality, renderer = G.settings.renderer, zoom = ZOOM;
    try {
      G.settings.quality = 'high'; G.settings.renderer = 'cpu'; resize(); setZoom(G.state, 1);
      MapRender.reset(G.state.map, human(G.state).explored);
      const cache = MapRender.cache, generation = MapRender.gen, density = MapRender.D;
      const rows = ZOOMS.map(value => {
        setZoom(G.state, value); render();
        return { zoom: value, width: PixBufs.world.width, height: PixBufs.world.height,
          expectedWidth: Math.round(VIEW.w * mapBufScale()), expectedHeight: Math.round(VIEW.h * mapBufScale()),
          sameCache: MapRender.cache === cache, sameGeneration: MapRender.gen === generation, density: MapRender.D };
      });
      return { minimum: ZOOMS[0], density, rows };
    } finally {
      G.settings.quality = quality; G.settings.renderer = renderer; resize(); setZoom(G.state, zoom);
    }
  });
  assert.equal(r.minimum, 0.75, 'maksymalne oddalenie 0,75x');
  for (const row of r.rows) {
    assert.ok(Math.abs(row.width - row.expectedWidth) <= 1 && Math.abs(row.height - row.expectedHeight) <= 1, `pełny bufor przy ${row.zoom}x: ${JSON.stringify(row)}`);
    assert.ok(row.sameCache && row.sameGeneration && row.density === r.density, `zoom nie generuje terenu od nowa: ${row.zoom}x`);
  }
});

test('wysoka jakość zachowuje źródłową rozdzielczość obiektów mapy', async () => {
  const r = await page.evaluate(() => {
    const key = Object.keys(MAP3D_ART.f).find(key => key.startsWith('town_')), frame = MAP3D_ART.f[key];
    SPR.delete('m3_' + key);
    const sprite = map3dSprite(key);
    return { pixelArt: PIXEL_ART, source: frame.slice(2, 4), cached: [sprite.c.width, sprite.c.height] };
  });
  if (!r.pixelArt) assert.deepEqual(r.cached, r.source, 'bez pomniejszania grafiki przed przybliżeniem');
});

test('rozgrzana mapa ma gotowe klatki marszu bohatera we wszystkich kierunkach', async () => {
  await newGame(page);
  await noMouse();
  await page.waitForFunction(() => MapRender.warmed, null, { timeout: 60000 });
  const r = await page.evaluate(() => {
    const h = hero(G.state), key = heroArtKey(h), art = HERO_MAP_ART[key], col = ownerColor(G.state, h.owner), before = SPR.size;
    let graded = true;
    for (let facing = 0; facing < HERO_FACE.length; facing++) {
      const preview = { ...h, anim: { fx: h.x, fy: h.y } }, direction = HERO_FACE[facing], source = HERO_FACE_SRC[direction] || direction;
      HERO_FACING.set(preview, facing);
      for (let index = 0; index < art.f['walk_' + source].length; index++) {
        const sprite = heroMap3d(preview, col, (index + 0.1) / 36);
        graded = graded && !!sprite._g;
      }
    }
    return { added: SPR.size - before, graded };
  });
  assert.deepEqual(r, { added: 0, graded: true }, 'pierwszy marsz nie wycina, nie koloruje i nie koryguje nowych klatek');
});

test('ekran bohatera 60 klatek także bez ruchu; zmiana wymusza klatkę od razu', async () => {
  await newGame(page);
  await page.evaluate(() => setScreen('hero', {}));
  await noMouse(); await frames(page, 5);
  const idle = await renders(1000);
  assert.ok(idle >= 40, `bez ruchu: ${idle} klatek na sekundę`);
  const moved = await page.evaluate(() => new Promise(res => {
    let n = 0; const orig = window.render; window.render = () => { n++; orig(); };
    let k = 0; const iv = setInterval(() => { G.dirty = true; if (++k >= 20) { clearInterval(iv); setTimeout(() => { window.render = orig; res(n); }, 50); } }, 16);
  }));
  assert.ok(moved >= 15, `przy ruchu: ${moved} klatek`);
});

test('mapa: w spoczynku płynnie (jak miasto), gdy kamera jedzie – płynnie', async () => {
  await newGame(page, { mapSize: 'M' });
  await page.evaluate(() => { setScreen('adventure', {}); G.modal = null; });
  await noMouse(); await frames(page, 5);
  const idle = await renders(1000);
  assert.ok(idle >= 40, `spoczynek: ${idle}`);
  await page.evaluate(() => { window.__iv = setInterval(() => { G.state.cam.x += 3; }, 8); });
  const busy = await renders(1000);
  await page.evaluate(() => clearInterval(window.__iv));
  assert.ok(busy >= 40, `ruch kamery: ${busy}`);
});

test('jakość grafiki: niska 0,5, wysoka jak ekran; ustawienie w menu', async () => {
  const r = await page.evaluate(() => {
    const S = G.settings, q0 = S.quality, out = {};
    S.quality = 'low'; resize(); out.low = G.dpr;
    S.quality = 'high'; resize(); out.high = G.dpr === Math.min(window.devicePixelRatio || 1, 2);
    S.quality = q0; resize();
    showGfxSettings(); out.labels = G.modal.buttons.map(b => b.label); out.pix = PIXEL_ART; G.modal = null;
    return out;
  });
  assert.equal(r.low, 0.5); assert.ok(r.high);
  assert.deepEqual(r.labels, r.pix ? ['Automatyczna', 'Wysoka', 'Niska', 'Czcionka: klasyczna', 'Interfejs', 'Pogoda', 'Dźwięk', 'OK'] : ['Automatyczna', 'Wysoka', 'Niska', 'Karta graficzna', 'Interfejs', 'Pogoda', 'Dźwięk', 'OK']);
});

test('mgła w kawałkach: odkrycie pola odświeża tylko potrzebny kawałek', async () => {
  await newGame(page, { mapSize: 'M' });
  const r = await page.evaluate(() => {
    const st = G.state, n = st.map.n, ex = human(st).explored; MapRender.reset(st.map, ex);
    const cx = 5, cy = 5; for (let y = cy * CHUNK - 2; y <= cy * CHUNK + CHUNK + 1; y++) for (let x = cx * CHUNK - 2; x <= cx * CHUNK + CHUNK + 1; x++) ex[y * n + x] = 0; // kawałek w mgle (start odkrywa okolicę miasta)
    const a = fogChunk(ex, n, cx, cy), again = fogChunk(ex, n, cx, cy) === a;
    ex[(cy * CHUNK + 3) * n + cx * CHUNK + 3] = 1; const b = fogChunk(ex, n, cx, cy);
    for (let y = cy * CHUNK - 1; y <= cy * CHUNK + CHUNK; y++) for (let x = cx * CHUNK - 1; x <= cx * CHUNK + CHUNK; x++) ex[y * n + x] = 1;
    return { again, changed: b !== a, clear: fogChunk(ex, n, cx, cy) === null };
  });
  assert.deepEqual(r, { again: true, changed: true, clear: true });
});

test('miasto i menu płynnie (60 klatek), także przy niskiej jakości; efekty miasta w pełnej rozdzielczości', async () => {
  await newGame(page);
  await page.evaluate(() => { setScreen('town', { townId: G.state.towns.find(t => t.owner === ME).id }); G.modal = null; });
  await noMouse(); await frames(page, 5);
  const town = await renders(1000);
  const r = await page.evaluate(() => { const q = G.settings.quality; G.settings.quality = 'low'; const low = screenFps(); G.settings.quality = q; return { low, fb: !!G.screens.town.fb }; });
  assert.ok(town >= 40, `miasto: ${town}`); assert.equal(r.low, 60); assert.equal(r.fb, false, 'bez okna efekty idą prosto na ekran');
});

test('teren mapy maluje się w tle aż po całą mapę; przewijanie nie maluje go w klatce; obniżona jakość wraca', async () => {
  await newGame(page, { mapSize: 'M' });
  await page.evaluate(() => { setScreen('adventure', {}); G.modal = null; });
  await noMouse(); await frames(page, 3);
  await page.waitForFunction(() => MapRender.warmed, null, { timeout: 40000 }); // tło maluje porcjami po kilka ms na klatkę
  const r = await page.evaluate(() => {
    const nC = Math.ceil(G.state.map.n / CHUNK), full = MapRender.cache.size, g0 = MapRender.lastGen;
    for (let i = 0; i < 20; i++) { G.state.cam.x += 40; camClamp(G.state); render(); }
    const S = G.settings, q = S.quality, a = S.autoDpr; S.quality = 'auto'; S.autoDpr = 0.5; Perf.good = 0;
    for (let k = 0; k < 10 * 60; k++) Perf.sample(1 / 60, 0.002, 60);
    const up = S.autoDpr; S.quality = q; if (a == null) delete S.autoDpr; else S.autoDpr = a; resize();
    return { full, need: nC * nC, noGen: MapRender.lastGen === g0, up };
  });
  assert.equal(r.full, r.need, 'cała mapa w pamięci'); assert.ok(r.noGen, 'przewijanie bez malowania terenu'); assert.equal(r.up, 0.75, 'jakość wraca o stopień');
});
