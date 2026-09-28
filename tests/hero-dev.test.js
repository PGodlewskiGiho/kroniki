// Rozwój bohatera jak w Heroes 3: specjalności rosnące z poziomem, nowe umiejętności (Mądrość, Nawigacja, Artyleria,
// Pierwsza pomoc, Balistyka, Odporność, Orle oko) i preferencje klas przy awansie. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każdy bohater ma specjalność z opisem; stwory specjalności istnieją w jego frakcji', async () => {
  const bad = await page.evaluate(() => {
    const out = [];
    for (const F of FACTIONS) for (const [name, cls] of F.heroes) {
      const h = { name, cls, level: 1 }, sp = heroSpec(h);
      if (!sp) { out.push(`${name}: brak`); continue; }
      if (sp.dw && specUnits(h).some(cid => !CREATURES[cid])) out.push(`${name}: stwory`);
      if (sp.skill && !SKILLS[sp.skill]) out.push(`${name}: umiejętność`); if (sp.spell && !SPELLS[sp.spell]) out.push(`${name}: czar`);
      if (sp.res && !RESOURCES.some(r => r.id === sp.res)) out.push(`${name}: surowiec`);
      if (!specText(h) || !specName(h)) out.push(`${name}: opis`);
    }
    return out;
  });
  assert.deepEqual(bad, []);
});

test('specjalność stworów: premia w bitwie rośnie z poziomem, surowiec dziennie, umiejętność i czar mocniejsze', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
    h.name = 'Sir Rolan'; h.cls = 'knight'; h.army = emptyArmy(); h.army[0] = { cid: 'griffin', n: 10 }; h.army[1] = { cid: 'pikeman', n: 10 };
    const unit = (lv, cid) => { h.level = lv; const B = createBattle(st, h, m), u = B.units.find(x => x.side === 0 && x.cid === cid); return [unitAtt(u), unitDef(u), unitSpd(u)]; };
    const base = CREATURES.griffin, low = unit(1, 'griffin'), high = unit(20, 'griffin'), other = unit(20, 'pikeman');
    const inc = n => { h.name = n; return dailyIncomeAll(st, ME); }, g0 = inc('Nikt'), g1 = inc('Bernard'), c1 = inc('Lirien');
    h.name = 'Kasjan'; h.skills = [{ id: 'archery', lv: 3 }]; h.level = 10; const arch = skillVal(h, 'archery');
    h.name = 'Ostromir'; const sp = [spellDamage({ ...h, name: 'Nikt' }, SPELLS.magicArrow, 3), spellDamage(h, SPELLS.magicArrow, 3)];
    return { base: [base.att, base.def, base.spd], low, high, other, pike: [CREATURES.pikeman.att, CREATURES.pikeman.def, CREATURES.pikeman.spd],
      gold: g1.gold - g0.gold, crystal: c1.crystal - g0.crystal, arch, sp };
  });
  assert.deepEqual(r.low, [r.base[0] + 1, r.base[1] + 1, r.base[2] + 1], 'na 1. poziomie co najmniej +1');
  assert.ok(r.high[0] > r.low[0] && r.high[1] > r.low[1], `rośnie z poziomem ${r.high}`);
  assert.deepEqual(r.other, r.pike, 'inne stwory bez premii');
  assert.equal(r.gold, 350); assert.equal(r.crystal, 1);
  assert.equal(r.arch, 75, 'łucznictwo eksperckie 50% × 1,5 na 10. poziomie');
  assert.equal(r.sp[1], Math.floor(r.sp[0] * 1.3), "czar specjalności +3% za poziom");
});

test('Mądrość: bez niej czary tylko do 2. poziomu (gildia i kapliczka), z nią do 3–5', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns.find(t => t.owner === ME);
    for (const id of ['guild1', 'guild2', 'guild3', 'guild4', 'guild5']) { if (!hasB(t, id)) t.built.push(id); rollGuildLevel(st, t, +id.slice(5)); }
    const lv = skills => { h.spells = []; h.skills = skills; return Math.max(...visitGuild(st, t, h).map(id => SPELLS[id].level)); };
    const levels = [lv([]), lv([{ id: 'wisdom', lv: 1 }]), lv([{ id: 'wisdom', lv: 2 }]), lv([{ id: 'wisdom', lv: 3 }])];
    const ob = { type: 'site', kind: 'shrine', spell: 'fireball', x: h.x, y: h.y }; h.skills = []; h.spells = [];
    const no = useSite(st, h, ob).text; h.skills = [{ id: 'wisdom', lv: 1 }]; const yes = useSite(st, h, ob).text;
    const mages = FACTIONS.flatMap(F => F.heroes).filter(([, cls]) => MAGE_CLASSES.includes(cls)).every(([, cls]) => CLASS_SKILLS[cls].some(([id]) => id === 'wisdom'));
    return { levels, no, yes, known: h.spells.includes('fireball'), mages };
  });
  assert.deepEqual(r.levels, [2, 3, 4, 5]);
  assert.match(r.no, /nie pojmuje.*Mądrość/); assert.match(r.yes, /poznaje czar/); assert.ok(r.known);
  assert.ok(r.mages, 'klasy magów zaczynają z Mądrością');
});

test('nowe umiejętności: nawigacja, artyleria, pierwsza pomoc, balistyka, odporność, orle oko', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n, m = st.objects.find(o => o.type === 'monster'), water = st.map.terrain.findIndex(t => t === TER.WATER);
    const nav = [0, 3].map(lv => { h.skills = lv ? [{ id: 'navigation', lv }] : []; return baseCost(st.map, water, water, h); });
    h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 20 }; h.machines = ['ballista', 'firstAid']; h.stats.att = 30;
    const battle = skills => { h.skills = skills; const B = createBattle(st, h, m); B.rng = () => 0.99; return B; };
    const bal = skills => { const B = battle(skills), a = B.units.find(u => u.cid === 'ballista'), t = B.units.find(u => u.side === 1); return damageRoll(B, a, t, true); };
    const heal = skills => { const B = battle(skills), a = B.units.find(u => u.cid === 'firstAid'), v = B.units.find(u => u.cid === 'swordsman'); v.hp = 1; actFirstAid(B, a); return v.hp - 1; };
    // odporność: wrogi czar nie działa, gdy los mniejszy niż wartość umiejętności
    const foe = { name: 'Wróg', cls: 'wizard', owner: 1, stats: { att: 0, def: 0, sp: 5, kn: 5 }, equip: {}, skills: [{ id: 'eagleSight', lv: 3 }], spells: [], mana: 99, army: emptyArmy(), machines: [] };
    const B = battle([{ id: 'resistance', lv: 3 }]); B.sides[1].hero = foe; B.rng = () => 0.1; B.active = B.units.find(u => u.side === 1) || { side: 1 };
    const tgt = B.units.find(u => u.cid === 'swordsman'), n0 = tgt.n; foe.spells = ['magicArrow']; castBattle(B, 'magicArrow', tgt.x, tgt.y);
    // orle oko: bohater strony 1 podpatruje czar rzucony przez stronę 0
    const B2 = battle([]); h.spells = ['lightningBolt']; h.mana = 99; B2.sides[1].hero = foe; foe.spells = []; B2.rng = () => 0.1; B2.active = B2.units.find(u => u.side === 0);
    const e = B2.units.find(u => u.side === 1); castBattle(B2, 'lightningBolt', e.x, e.y);
    return { nav, bal: [bal([]), bal([{ id: 'artillery', lv: 3 }])], heal: [heal([]), heal([{ id: 'firstAid', lv: 3 }])], resisted: tgt.n === n0, learned: foe.spells.includes('lightningBolt') };
  });
  assert.deepEqual(r.nav, [100, 40]);
  assert.ok(Math.abs(r.bal[1] / r.bal[0] - 2) < 0.05, `artyleria ${r.bal}`);
  assert.ok(r.heal[0] <= 25 && r.heal[1] > 25, `pierwsza pomoc ${r.heal}`);
  assert.ok(r.resisted, 'odporność zatrzymała czar'); assert.ok(r.learned, 'orle oko');
});

test('awans: klasy wojowników rzadziej dostają umiejętności magiczne, magowie częściej', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), count = cls => { let magic = 0; for (let id = 0; id < 60; id++) for (const s of skillOffer(st, { ...h, id, cls, skills: [] }, 2)) if (MAGIC_SKILLS.includes(s)) magic++; return magic; };
    return { knight: count('knight'), wizard: count('wizard') };
  });
  assert.ok(r.wizard > r.knight * 2, JSON.stringify(r));
});

test('ekran bohatera i tawerna pokazują specjalność; stary zapis maga dostaje Mądrość', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); setScreen('hero', {}); const scr = G.screens.hero, info = scr.rightInfo(SPEC_BOX.x + 5, SPEC_BOX.y + 5);
    const d = JSON.parse(JSON.stringify(serializeGame(st))), dh = d.heroes.find(x => x.id === h.id); dh.cls = 'wizard'; dh.skills = [{ id: 'mysticism', lv: 1 }];
    const back = deserializeGame(d).heroes.find(x => x.id === h.id);
    return { info, spec: specText(h), wisdom: heroSkill(back, 'wisdom') };
  });
  assert.equal(r.info, `Specjalność: ${r.spec}.`); assert.equal(r.wisdom, 1);
  await frames(page, 4);
});
