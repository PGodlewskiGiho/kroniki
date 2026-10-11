// Manufaktura (miasto wynalazców): dane frakcji i jej mechaniki bitewne – konstrukty (bez morale, odporne na czary żywych),
// naprawa przez mechaników, łańcuch iskier, wybuch granatu, polowy warsztat po bitwie i warsztat machin w mieście. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('dane: 21 jednostek w siedliskach, klasy bohaterów we wszystkich tablicach, cecha, budowla specjalna, Graal, gildia', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const F = factionOf('forge'), dw = Object.values(F.dw).map(d => d[1]), bad = dw.filter(c => !CREATURES[c] || CREATURES[c].faction !== 'forge');
    const cls = ['engineer', 'inventor'], tables = { HERO_CLASSES, CLASS_GROWTH, CLASS_SKILLS, CLASS_PATHS, CLASS_SKILL_PREF };
    const miss = cls.flatMap(c => Object.entries(tables).filter(([, T]) => !T[c]).map(([k]) => `${k}.${c}`));
    const lv = [1, 2, 3, 4, 5, 6, 7].map(L => ['', 'u', 'x'].map(k => CREATURES[F.dw['dw' + L + k][1]].level === L).every(Boolean));
    return { id: F.id, n: dw.length, uniq: new Set(dw).size, bad, miss, lv: lv.every(Boolean), trait: !!FACTION_TRAITS.forge, special: !!FACTION_SPECIAL.forge, grail: GRAIL_NAMES.forge,
      magic: !!FACTION_MAGIC.forge, heroes: F.heroes.length, abil: ['construct', 'repair', 'chain', 'splash'].every(a => ABILITIES[a]) };
  });
  assert.equal(r.id, 'forge'); assert.equal(r.n, 21); assert.equal(r.uniq, 21); assert.deepEqual(r.bad, []); assert.deepEqual(r.miss, []);
  assert.ok(r.lv, 'poziomy siedlisk'); assert.ok(r.trait && r.special && r.magic && r.abil); assert.equal(r.grail, 'Wieczny Silnik'); assert.ok(r.heroes >= 6);
});

// Bitwa: armia bohatera z podanych oddziałów przeciw potworowi (cid, liczba)
const setup = (mine, foe, cls) => page.evaluate(([mine, foe, cls]) => {
  const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'); if (cls) h.cls = cls;
  h.army = emptyArmy(); mine.forEach(([cid, n], i) => { h.army[i] = { cid, n }; }); h.machines = []; m.cid = foe[0]; m.count = foe[1];
  window.BT = createBattle(st, h, m); BT.auto = true; return BT.units.length;
}, [mine, foe, cls]);

test('konstrukty: bez morale, odporne na oślepienie, truciznę i uzdrowienie, namiot medyka ich nie leczy', async () => {
  await newGame(page);
  await setup([['clockHound', 10], ['pikeman', 10]], ['goblin', 20]);
  const r = await page.evaluate(() => {
    const B = BT, hound = B.units.find(u => u.cid === 'clockHound'), pike = B.units.find(u => u.cid === 'pikeman'), gob = B.units.find(u => u.side === 1);
    B.morale = [3, 0]; hound.hp = 5; pike.hp = 5;
    return { morale: unitMorale(B, hound), pikeMorale: unitMorale(B, pike), blind: spellTargetOk(B, 'blind', Object.assign({}, hound, { side: 1 })), cure: spellTargetOk(B, 'cure', hound),
      cureLiving: spellTargetOk(B, 'cure', pike), tent: firstAidTargets(B, pike).includes(hound), tentLiving: firstAidTargets(B, pike).includes(pike), construct: isConstruct(hound) && !isConstruct(gob) };
  });
  assert.equal(r.morale, 0); assert.equal(r.pikeMorale, 3); assert.equal(r.blind, false); assert.equal(r.cure, false); assert.equal(r.cureLiving, true);
  assert.equal(r.tent, false); assert.equal(r.tentLiving, true); assert.ok(r.construct);
});

test('naprawa: mechanicy na początku rundy naprawiają i odbudowują uszkodzone konstrukty', async () => {
  await newGame(page);
  await setup([['mechanic', 20], ['clockHound', 10]], ['goblin', 5]);
  const r = await page.evaluate(() => {
    const B = BT, hound = B.units.find(u => u.cid === 'clockHound'); applyDamage(hound, 50); const n0 = hound.n, hp0 = (hound.n - 1) * 22 + hound.hp;
    repairRound(B); const hp1 = (hound.n - 1) * 22 + hound.hp;
    return { n0, n1: hound.n, healed: hp1 - hp0, log: B.log.some(l => /naprawiają/.test(l)) };
  });
  assert.equal(r.healed, 50, '20 mechaników × 3 życia, najwyżej tyle, ile brakuje'); assert.ok(r.n1 > r.n0, 'zniszczone ogary wracają'); assert.ok(r.log);
});

test('łańcuch iskier przeskakuje na drugi oddział, wybuch granatu rani sąsiadów celu', async () => {
  await newGame(page);
  await setup([['sparkwright', 10], ['grenadier', 10]], ['ogre', 30]);
  const r = await page.evaluate(() => {
    const B = BT, foes = B.units.filter(u => u.side === 1), spark = B.units.find(u => u.cid === 'sparkwright'), gren = B.units.find(u => u.cid === 'grenadier');
    // trzy oddziały wroga obok siebie w środku pola
    foes.forEach((u, i) => { u.x = 8; u.y = 2 + i; }); const pool = u => (u.n - 1) * CREATURES[u.cid].hp + u.hp, before = foes.map(pool);
    actShoot(B, spark, foes[0]); const afterSpark = foes.map(pool);
    const b2 = foes.map(pool); actShoot(B, gren, foes[1]); const afterGren = foes.map(pool);
    return { n: foes.length, hit0: before[0] - afterSpark[0], hit1: before[1] - afterSpark[1], hit2: before[2] - afterSpark[2], g1: b2[1] - afterGren[1], g0: b2[0] - afterGren[0], g2: b2[2] - afterGren[2],
      log: B.log.filter(l => /Iskra|Wybuch/.test(l)).length };
  });
  assert.ok(r.n >= 3, 'ogry w kilku oddziałach'); assert.ok(r.hit0 > 0 && r.hit1 > 0, `iskra: ${r.hit0}, ${r.hit1}`); assert.equal(r.hit2, 0, 'iskrownik: jeden przeskok');
  assert.ok(r.g1 > 0 && r.g0 > 0 && r.g2 > 0, `wybuch: ${r.g0}, ${r.g1}, ${r.g2}`); assert.ok(r.log >= 3);
});

test('polowy warsztat: inżynier po zwycięstwie odbudowuje część zniszczonych konstruktów; warsztat machin daje machiny raz w tygodniu', async () => {
  await newGame(page, { faction: 'forge' });
  await setup([['clockHound', 20], ['lightGuard', 30]], ['goblin', 4], 'engineer');
  const r = await page.evaluate(() => {
    const B = BT, st = G.state, h = hero(st), hound = B.units.find(u => u.cid === 'clockHound'); applyDamage(hound, 22 * 10); // 10 ogarów zniszczonych przed końcem bitwy
    simulateBattle(B); const res = resolveBattle(B, false), hs = h.army.find(s => s && s.cid === 'clockHound');
    const t = st.towns.find(o => o.owner === ME); t.faction = 'forge'; t.built = [...new Set([...t.built, 'fort', 'special'])]; h.machines = [];
    const m1 = specialVisit(st, t, h), got = [...h.machines], m2 = specialVisit(st, t, h);
    return { outcome: res.outcome, n: hs ? hs.n : 0, salvaged: res.spoils && res.spoils.salvaged, text: attackReport(st, h, res).body, m1, got, m2 };
  });
  assert.equal(r.outcome, 'win'); assert.equal(r.salvaged, 3, '30% z 10'); assert.equal(r.n, 13); assert.match(r.text, /Polowy warsztat: odbudowano 3/);
  assert.match(r.m1, /Warsztat machin/); assert.deepEqual(r.got.sort(), ['ammoCart', 'ballista', 'firstAid']); assert.equal(r.m2, null);
});
