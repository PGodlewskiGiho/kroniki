// Nowi stwory neutralni: olbrzymi pająk, syrena, yeti, olbrzym górski, kraken – dane, siedliska na mapie (yeti tylko na śniegu,
// syrena i kraken tylko w morzu), modele 3D (arkusze bitwy) i walka bez błędów. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });
const NEW = ['giantSpider', 'siren', 'yeti', 'stoneGiant', 'kraken', 'ironGuardian', 'sandScorpion', 'mimic', 'ancientMimic', 'myconid'];

test('żelazny strażnik: dane neutralnego konstruktu i lądowe siedlisko', async () => {
  const result = await page.evaluate(() => {
    const creature = CREATURES.ironGuardian;
    return { level: creature.level, hp: creature.hp, abil: creature.abil, faction: creature.faction || null,
      land: NEUTRALS_BY_LEVEL[5].includes('ironGuardian'), habitat: creature.habitat,
      sea: Object.values(SEA_MONSTERS).some(list => list.includes('ironGuardian')), expected: [TER.ROUGH, TER.DIRT, TER.SNOW] };
  });
  assert.equal(result.level, 5); assert.equal(result.hp, 85); assert.equal(result.faction, null);
  assert.ok(result.abil.includes('construct')); assert.equal(result.land, true); assert.equal(result.sea, false);
  assert.deepEqual(result.habitat, result.expected);
});

test('żelazny strażnik: komplet niepustych i animowanych klatek bitwy oraz mapy', async () => {
  const result = await page.evaluate(() => {
    const art = unitArt('ironGuardian');
    return Object.fromEntries(['idle', 'walk', 'attack', 'hurt', 'dead', 'map'].map(pose => {
      const row = art.f[pose], images = row.map((frame, index) => artFrame('ironGuardian', pose, index, 1, art.u).c);
      return [pose, { count: row.length, expected: BATTLE_FRAMES[pose] || (pose === 'map' ? 4 : 1),
        nonblank: images.every(canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)),
        unique: new Set(images.map(canvas => canvas.toDataURL())).size }];
    }));
  });
  for (const [pose, row] of Object.entries(result)) {
    assert.equal(row.count, row.expected, pose); assert.equal(row.nonblank, true, pose);
    if (row.count > 1) assert.ok(row.unique > 1, `animacja ${pose}`);
  }
});

test('skorpion pustynny: dane, siedlisko i komplet animowanych klatek z modelu 3D', async () => {
  const result = await page.evaluate(() => {
    const creature = CREATURES.sandScorpion, art = unitArt('sandScorpion');
    const frames = Object.fromEntries(['idle', 'walk', 'attack', 'hurt', 'dead', 'map'].map(pose => {
      const row = art.f[pose], images = row.map((frame, index) => artFrame('sandScorpion', pose, index, 1, art.u).c);
      return [pose, { count: row.length, expected: BATTLE_FRAMES[pose] || (pose === 'map' ? 4 : 1),
        nonblank: images.every(canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)),
        unique: new Set(images.map(canvas => canvas.toDataURL())).size }];
    }));
    return { level: creature.level, hp: creature.hp, abil: creature.abil, wide: !!creature.wide,
      land: NEUTRALS_BY_LEVEL[4].includes('sandScorpion'), habitat: creature.habitat,
      expectedHabitat: [TER.SAND, TER.ROUGH, TER.DIRT], frames };
  });
  assert.equal(result.level, 4); assert.equal(result.hp, 42); assert.equal(result.wide, true);
  assert.deepEqual(result.abil, ['armorPierce', 'deathBlow']);
  assert.equal(result.land, true); assert.deepEqual(result.habitat, result.expectedHabitat);
  for (const [pose, row] of Object.entries(result.frames)) {
    assert.equal(row.count, row.expected, pose); assert.equal(row.nonblank, true, pose);
    if (row.count > 1) assert.ok(row.unique > 1, `animacja ${pose}`);
  }
});

test('podgląd animacji: desktop i telefon, zmiana pozy, pauza, tempo i odbicie', async () => {
  const directory = fs.mkdtempSync(path.join(__dirname, 'kroniki-jednostka-')), output = path.join(directory, 'podglad.html');
  const preview = await browser.newPage(), previewErrors = [];
  preview.on('pageerror', error => previewErrors.push(error.message));
  try {
    execFileSync(process.execPath, [path.join(__dirname, '../tools/grafika3d/podglad.js'), '--animacja', 'ironGuardian', output, 'Żelazny strażnik']);
    await preview.goto(pathToFileURL(output).href);
    for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
      await preview.setViewportSize(viewport); await preview.locator('#play').check();
      await preview.locator('[value="walk"]').check();
      await preview.waitForFunction(() => document.querySelector('canvas').dataset.pose === 'walk');
      const frame = await preview.locator('canvas').getAttribute('data-frame');
      await preview.waitForFunction(frame => document.querySelector('canvas').dataset.frame !== frame, frame);
      await preview.locator('#play').uncheck();
      const paused = await preview.locator('canvas').getAttribute('data-frame');
      await preview.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await preview.locator('canvas').getAttribute('data-frame'), paused);
      assert.equal(await preview.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await preview.locator('#flip').check(); await preview.locator('#speed').fill('2');
      assert.equal(await preview.locator('#rate').textContent(), '2×');
      const nonblank = await preview.evaluate(() => { const canvas = document.querySelector('canvas');
        return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0); });
      assert.equal(nonblank, true);
    }
    assert.deepEqual(previewErrors, []);
  } finally { await preview.close(); fs.rmSync(directory, { recursive: true, force: true }); }
});

test('nowi neutralni: dane, poziomy, grafika z modelu 3D; syrena i kraken wśród potworów morskich', async () => {
  const r = await page.evaluate(NEW => NEW.map(id => { const c = CREATURES[id]; return { id, ok: !!c && c.hp > 0 && c.value > 0 && !c.faction, art: !!(UNIT_ART && UNIT_ART[id]), land: Object.values(NEUTRALS_BY_LEVEL).some(a => a.includes(id)), sea: Object.values(SEA_MONSTERS).some(a => a.includes(id)), wide: !!c.wide }; }), NEW);
  for (const c of r) { assert.ok(c.ok, c.id); assert.ok(c.art, `grafika ${c.id}`); }
  assert.deepEqual(r.filter(c => c.land).map(c => c.id), ['giantSpider', 'yeti', 'stoneGiant', 'ironGuardian', 'sandScorpion', 'mimic', 'ancientMimic', 'myconid']); assert.deepEqual(r.filter(c => c.sea).map(c => c.id), ['siren', 'kraken']);
  assert.ok(r.find(c => c.id === 'giantSpider').wide && r.find(c => c.id === 'kraken').wide && r.find(c => c.id === 'sandScorpion').wide);
});

test('siedliska: yeti tylko na śniegu, olbrzym górski i pająk tylko na swoich terenach; na lądzie nie ma syren ani krakenów', async () => {
  const r = await page.evaluate(() => { const bad = [], seen = {};
    for (const land of ['frost', 'mountains', 'marsh', 'mixed']) for (const seed of [3, 9]) { const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'L', land, slots: null, opponents: 0 }), seed), n = st.map.n;
      for (const o of st.objects) if (o.type === 'monster' && !o.sea) { const c = CREATURES[o.cid], t = st.map.terrain[o.y * n + o.x]; if (c.habitat) { seen[o.cid] = (seen[o.cid] || 0) + 1; if (!c.habitat.includes(t) && !c.habitat.includes(terBase(t))) bad.push(`${o.cid} na ${t}`); } } }
    return { bad, seen }; });
  assert.deepEqual(r.bad, []); assert.ok((r.seen.yeti || 0) > 0 && (r.seen.giantSpider || 0) > 0, JSON.stringify(r.seen));
});

test('walka z każdym nowym stworem kończy się bez błędów', async () => {
  await newGame(page, { mapSize: 'M' }, 7);
  const r = await page.evaluate(NEW => NEW.map(id => { const st = G.state, h = hero(st); h.army = [{ cid: 'dawnbringer', n: 6 }, { cid: 'marksman', n: 20 }, null, null, null, null, null];
    const m = { type: 'monster', id: 9000 + NEW.indexOf(id), cid: id, count: CREATURES[id].level >= 6 ? 2 : 10, x: h.x, y: h.y }; const B = createBattle(st, h, m); simulateBattle(B); return [id, B.over, B.round]; }), NEW);
  for (const [id, over] of r) assert.ok(['win', 'lose'].includes(over), `${id}: ${over}`);
});

test('mimik: skrzynia, która gryzie – bez odwetu, pokonany wypluwa złoto zwycięzcy', async () => {
  await newGame(page, { mapSize: 'S' }, 9);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), P = st.players[h.owner], c = CREATURES.mimic; h.army = [{ cid: 'dawnbringer', n: 8 }, null, null, null, null, null, null];
    const g0 = P.resources.gold, m = { type: 'monster', id: 9900, cid: 'mimic', count: 6, x: h.x, y: h.y }, B = createBattle(st, h, m); simulateBattle(B);
    const sp = victorySpoils(B, 0);
    return { lvl: c.level, abil: c.abil, land: NEUTRALS_BY_LEVEL[3].includes('mimic'), won: B.over, mimic: sp.mimic, gold: P.resources.gold - g0, text: spoilsText(sp) };
  });
  assert.equal(r.lvl, 3); assert.deepEqual(r.abil, ['noRetal']); assert.ok(r.land);
  assert.equal(r.won, 'win'); assert.equal(r.mimic, 6 * 60); assert.ok(r.gold >= 6 * 60, `złoto ${r.gold}`); assert.match(r.text, /Mimiki wypluwają skarb: \+360 złota/);
});

test('skrzynie-mimiki: część skrzyń z dala od startów to mimiki; przy otwarciu walka, po zwycięstwie skarb skrzyni i złoto mimików', async () => {
  const gen = await page.evaluate(() => { let all = 0, mim = 0, anc = 0;
    for (const seed of [4, 7, 12]) { const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'L', land: 'mixed', slots: null, opponents: 1 }), seed);
      for (const o of st.objects) if (o.type === 'chest') { all++; if (o.mimic) { mim++; if (o.mimic.cid === 'ancientMimic') anc++; } } }
    return { all, mim, anc }; });
  assert.ok(gen.mim >= 2 && gen.mim < gen.all * 0.3, JSON.stringify(gen));
  await newGame(page, { mapSize: 'S' }, 9);
  const r = await page.evaluate(async () => {
    const st = G.state, h = hero(st), n = st.map.n, P = st.players[h.owner]; h.army = [{ cid: 'dawnbringer', n: 10 }, null, null, null, null, null, null];
    let spot = null; for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1]]) { const x = h.x + dx, y = h.y + dy, i = y * n + x; if (!st.map.obst[i] && st.map.terrain[i] !== TER.WATER && !objectAt(st, i)) { spot = [x, y]; break; } }
    const ob = { type: 'chest', id: st.objects.length, gold: 3000, exp: 1500, x: spot[0], y: spot[1], mimic: { cid: 'mimic', count: 5 } }; st.objects.push(ob); rebuildObjIndex(st);
    const g0 = P.resources.gold; visitObject(st, h, ob); const msg = G.modal && G.modal.msg;
    G.modal.buttons.find(b => b.label === 'Do walki!').action(); const offer = G.modal && G.modal.msg;
    G.modal.buttons.find(b => b.label === 'Automatycznie').action();
    return { msg, offer, dead: !!ob.dead, gold: P.resources.gold - g0, result: G.modal && G.modal.msg };
  });
  assert.match(r.msg, /Skrzynia ożywa/); assert.match(r.offer, /mimik/i);
  assert.ok(r.dead, 'skrzynia znika po zwycięstwie'); assert.equal(r.gold, 3000 + 5 * 60, r.result);
});

test('grzybołak: zarodniki spowalniają trafiony oddział na 2 rundy (konstrukty i nieumarli odporni); żyje w grzybowych jaskiniach i na bagnach', async () => {
  await newGame(page, { mapSize: 'S' }, 9);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), c = CREATURES.myconid; h.army = [{ cid: 'pikeman', n: 20 }, null, null, null, null, null, null];
    const B = createBattle(st, h, { type: 'monster', id: 9901, cid: 'myconid', count: 8, x: h.x, y: h.y }), a = B.units.find(u => u.cid === 'myconid'), t = B.units.find(u => u.cid === 'pikeman');
    const s0 = unitSpd(t); B.rng = () => 0.5; strike(B, a, t, false); const slowed = t.buffs.slow, s1 = unitSpd(t);
    const imm = ['ironGuardian', 'skeleton'].map(cid => { const B2 = createBattle(st, { ...h, army: [{ cid, n: 5 }, null, null, null, null, null, null] }, { type: 'monster', id: 9902, cid: 'myconid', count: 8, x: h.x, y: h.y });
      const a2 = B2.units.find(u => u.cid === 'myconid'), t2 = B2.units.find(u => u.cid === cid); strike(B2, a2, t2, false); return !t2.buffs.slow; });
    const B3 = createBattle(st, h, { type: 'monster', id: 9903, cid: 'myconid', count: 8, x: h.x, y: h.y }); simulateBattle(B3);
    return { lvl: c.level, abil: c.abil, land: NEUTRALS_BY_LEVEL[3].includes('myconid'), habitat: c.habitat.includes(TER.FUNGUS) && c.habitat.includes(TER.SWAMP), slowed, d: s0 - s1, imm, over: B3.over, log: B.log.some(l => /Zarodniki spowalniają/.test(l)) };
  });
  assert.equal(r.lvl, 3); assert.deepEqual(r.abil, ['spores']); assert.ok(r.land && r.habitat);
  assert.equal(r.slowed, 2); assert.equal(r.d, 3); assert.ok(r.log); assert.deepEqual(r.imm, [true, true]); assert.ok(['win', 'lose'].includes(r.over));
});
