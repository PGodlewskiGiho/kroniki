// Etapy rozwoju bohatera: ścieżka mistrzowska na 10. poziomie (wybór z trzech ścieżek klasy), legenda na 20.; działanie każdej ścieżki;
// balans magii: drugi czar Bitewnego maga za potrójną manę, moc czarów w bitwie powyżej SP_SOFT liczy się za pół. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każda klasa ma trzy różne ścieżki z opisem ścieżki i legendy', async () => {
  const r = await page.evaluate(() => ({ classes: Object.keys(CLASS_GROWTH).filter(c => !(CLASS_PATHS[c] && CLASS_PATHS[c].length === 3 && new Set(CLASS_PATHS[c]).size === 3 && CLASS_PATHS[c].every(p => HERO_PATHS[p]))),
    texts: Object.keys(HERO_PATHS).map(id => [pathText(id, 1), pathText(id, 2)]), used: Object.keys(HERO_PATHS).filter(id => !Object.values(CLASS_PATHS).some(a => a.includes(id))) }));
  assert.deepEqual(r.classes, []); assert.deepEqual(r.used, [], 'każdą ścieżkę ma jakaś klasa');
  for (const [a, b] of r.texts) { assert.ok(a.length > 20 && b.length > 20); assert.notEqual(a, b); }
});

test('awans gracza na 10. poziom: po umiejętności i talencie okno ścieżki (3 do wyboru); 20. poziom: legenda; SI wybiera sama', async () => {
  await newGame(page, { opponents: 1 });
  await page.evaluate(() => { const st = G.state, h = hero(st); h.exp = expForLevel(9); h.level = 9; window.DONE = false; gainExp(st, h, expForLevel(10) - h.exp, () => { window.DONE = true; }); });
  let d = await dialog(page); assert.match(d.msg, /osiąga poziom 10!/); await pressDialog(page, d.labels[0]);
  d = await dialog(page); assert.match(d.msg, /ścieżkę mistrzowską/); assert.equal(d.labels.length, 3);
  const want = await page.evaluate(() => HERO_PATHS[pathOffer(hero(G.state))[1]].name);
  assert.deepEqual(d.labels, await page.evaluate(() => pathOffer(hero(G.state)).map(id => HERO_PATHS[id].name)));
  await frames(page, 2); await pressDialog(page, want);
  let r = await page.evaluate(() => { const h = hero(G.state); return { done: DONE, path: h.mastery, second: pathOffer(h)[1], title: pathTitle(h) }; });
  assert.equal(r.done, true); assert.equal(r.path, r.second); assert.equal(r.title, want);
  await page.evaluate(() => { const st = G.state, h = hero(st); h.exp = expForLevel(19); h.level = 19; gainExp(st, h, expForLevel(20) - h.exp, () => {}); });
  d = await dialog(page); await pressDialog(page, d.labels[0]); d = await dialog(page);
  if (d && /talent/.test(d.msg)) { await pressDialog(page, d.labels[0]); d = await dialog(page); }
  assert.match(d.msg, /staje się legendą/); await pressDialog(page, 'Chwała!');
  r = await page.evaluate(() => { const st = G.state, h = hero(st), ai = st.heroes.find(x => x.owner === 1); ai.exp = 0; ai.level = 1; gainExp(st, ai, expForLevel(12));
    return { lv: pathLv(h, h.mastery), legend: pathTitle(h) === HERO_PATHS[h.mastery].legend, ai: ai.mastery, aiWant: pathOffer(ai)[0], modal: !!G.modal }; });
  assert.equal(r.lv, 2); assert.ok(r.legend); assert.equal(r.ai, r.aiWant, 'SI bierze pierwszą ścieżkę klasy'); assert.equal(r.modal, false);
});

test('działanie ścieżek: Czempion, Arcymistrz, Mędrzec, Wędrowiec, Namiestnik (legenda mocniejsza) i zapis', async () => {
  await newGame(page, {});
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), at = () => [heroStat(h, 'att'), heroStat(h, 'def'), heroStat(h, 'sp')];
    h.level = 12; h.mastery = null; const a0 = at(), mana0 = heroMaxMana(h), mp0 = heroMaxMP(h), sight0 = heroSight(h), gold0 = dailyIncomeAll(st).gold, cost0 = spellCost(h, 'fireball');
    h.mastery = 'champion'; const ch = at(); h.level = 20; const ch2 = at(); h.level = 12;
    h.mastery = 'archmage'; const am = [heroStat(h, 'sp'), spellCost(h, 'fireball')];
    h.mastery = 'sage'; const sg = heroMaxMana(h); h.level = 20; const sg2 = heroMaxMana(h); h.level = 12;
    h.mastery = 'wanderer'; const wd = [heroMaxMP(h) - mp0, heroSight(h) - sight0];
    h.mastery = 'governor'; const gv = dailyIncomeAll(st).gold - gold0; h.level = 20; const inc = dailyIncomeAll(st), gv2 = inc.gold - gold0, rare = PATH_RARE.some(k => inc[k] >= 1);
    const saved = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st)))).heroes.find(x => x.id === h.id).mastery;
    return { a0, ch, ch2, am, cost0, mana0, sg, sg2, wd, gv, gv2, rare, saved };
  });
  assert.deepEqual([r.ch[0] - r.a0[0], r.ch[1] - r.a0[1]], [4, 4]); assert.deepEqual([r.ch2[0] - r.a0[0], r.ch2[1] - r.a0[1]], [10, 10]);
  assert.equal(r.am[0], r.a0[2] + 1); assert.ok(r.am[1] < r.cost0, 'Arcymistrz: tańsze czary');
  assert.ok(r.sg > r.mana0 && r.sg2 > r.sg, `mana ${r.mana0} → ${r.sg} → ${r.sg2}`);
  assert.deepEqual(r.wd, [400, 2]); assert.equal(r.gv, 750); assert.equal(r.gv2, 1500); assert.ok(r.rare, 'Książę: rzadki surowiec dziennie');
  assert.equal(r.saved, 'governor');
});

test('ścieżki w bitwie: Marszałek (szybkość, morale), Łowca (strzelcy), Mędrzec (wrogie czary słabsze)', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), foe = st.objects.find(o => o.type === 'monster' && !o.dead); h.level = 12;
    h.army = [{ cid: 'archer', n: 20 }, { cid: 'pikeman', n: 20 }, null, null, null, null, null];
    h.mastery = null; let B = createBattle(st, h, foe); const sp0 = unitSpd(B.units.find(u => u.side === 0 && u.cid === 'pikeman')), mor0 = sideMorale(B, 0);
    h.mastery = 'marshal'; B = createBattle(st, h, foe); const sp1 = unitSpd(B.units.find(u => u.side === 0 && u.cid === 'pikeman')), mor1 = sideMorale(B, 0);
    const shoot = path => { h.mastery = path; const B = createBattle(st, h, foe), a = B.units.find(u => u.side === 0 && u.cid === 'archer'), t = B.units.find(u => u.side === 1); B.rng = () => 0.5; return damageRoll(B, a, t, true); };
    const d0 = shoot(null), d1 = shoot('hunter');
    const ward = path => { h.mastery = path; const B = createBattle(st, h, foe); return sageWard(B, 0, 1); };
    return { sp0, sp1, mor0, mor1, d0, d1, w0: ward(null), w1: ward('sage') };
  });
  assert.equal(r.sp1 - r.sp0, 2); assert.equal(r.mor1, Math.min(3, r.mor0 + 1));
  assert.ok(r.d1 >= Math.floor(r.d0 * 1.2), `Łowca: ${r.d0} → ${r.d1}`); assert.equal(r.w0, 1); assert.equal(r.w1, 0.75);
});

test('balans magii: drugi czar w rundzie za potrójną manę (Bitewny mag), moc czarów powyżej progu liczy się za pół', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), foe = st.objects.find(o => o.type === 'monster' && !o.dead); h.talents = ['doubleCast']; h.spells = ['magicArrow']; h.book = true; h.mana = 100;
    const B = createBattle(st, h, foe), c1 = battleCost(B, 0, h, 'magicArrow'); B.casts = [1, 0]; const c2 = battleCost(B, 0, h, 'magicArrow');
    return { c1, c2, base: spellCost(h, 'magicArrow'), eff: [4, 6, 8, 10, 14].map(effSp), soft: SP_SOFT };
  });
  assert.equal(r.c1, r.base); assert.equal(r.c2, r.base * 3);
  assert.equal(r.soft, 6); assert.deepEqual(r.eff, [4, 6, 7, 8, 10]);
});
