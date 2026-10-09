// Nowi stwory neutralni: olbrzymi pająk, syrena, yeti, olbrzym górski, kraken – dane, siedliska na mapie (yeti tylko na śniegu,
// syrena i kraken tylko w morzu), modele 3D (arkusze bitwy) i walka bez błędów. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });
const NEW = ['giantSpider', 'siren', 'yeti', 'stoneGiant', 'kraken'];

test('nowi neutralni: dane, poziomy, grafika z modelu 3D; syrena i kraken wśród potworów morskich', async () => {
  const r = await page.evaluate(NEW => NEW.map(id => { const c = CREATURES[id]; return { id, ok: !!c && c.hp > 0 && c.value > 0 && !c.faction, art: !!(UNIT_ART && UNIT_ART[id]), land: Object.values(NEUTRALS_BY_LEVEL).some(a => a.includes(id)), sea: Object.values(SEA_MONSTERS).some(a => a.includes(id)), wide: !!c.wide }; }), NEW);
  for (const c of r) { assert.ok(c.ok, c.id); assert.ok(c.art, `grafika ${c.id}`); }
  assert.deepEqual(r.filter(c => c.land).map(c => c.id), ['giantSpider', 'yeti', 'stoneGiant']); assert.deepEqual(r.filter(c => c.sea).map(c => c.id), ['siren', 'kraken']);
  assert.ok(r.find(c => c.id === 'giantSpider').wide && r.find(c => c.id === 'kraken').wide);
});

test('siedliska: yeti tylko na śniegu, olbrzym górski i pająk tylko na swoich terenach; na lądzie nie ma syren ani krakenów', async () => {
  const r = await page.evaluate(() => { const bad = [], seen = {};
    for (const land of ['frost', 'mountains', 'marsh', 'mixed']) for (const seed of [3, 9]) { const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'L', land, slots: null, opponents: 0 }), seed), n = st.map.n;
      for (const o of st.objects) if (o.type === 'monster' && !o.sea) { const c = CREATURES[o.cid], t = st.map.terrain[o.y * n + o.x]; if (c.habitat) { seen[o.cid] = (seen[o.cid] || 0) + 1; if (!c.habitat.includes(t)) bad.push(`${o.cid} na ${t}`); } } }
    return { bad, seen }; });
  assert.deepEqual(r.bad, []); assert.ok((r.seen.yeti || 0) > 0 && (r.seen.giantSpider || 0) > 0, JSON.stringify(r.seen));
});

test('walka z każdym nowym stworem kończy się bez błędów', async () => {
  await newGame(page, { mapSize: 'M' }, 7);
  const r = await page.evaluate(NEW => NEW.map(id => { const st = G.state, h = hero(st); h.army = [{ cid: 'dawnbringer', n: 6 }, { cid: 'marksman', n: 20 }, null, null, null, null, null];
    const m = { type: 'monster', id: 9000 + NEW.indexOf(id), cid: id, count: CREATURES[id].level >= 6 ? 2 : 10, x: h.x, y: h.y }; const B = createBattle(st, h, m); simulateBattle(B); return [id, B.over, B.round]; }), NEW);
  for (const [id, over] of r) assert.ok(['win', 'lose'].includes(over), `${id}: ${over}`);
});
