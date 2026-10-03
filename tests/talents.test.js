// Nowe umiejętności (Taktyka, Dyplomacja, Zakłócanie, Grabież, Opatrywanie ran) i talenty co 4 poziomy. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('talenty: oferta trzech, wymagania umiejętności, Weteran i Arcymag zawsze pod ręką', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), offers = [];
    h.skills = []; for (let L = 4; L <= 40; L += 4) offers.push(talentOffer(st, h, L));
    const bare = [...new Set(offers.flat())];
    h.skills = [{ id: 'archery', lv: 2 }, { id: 'luck', lv: 2 }, { id: 'leadership', lv: 2 }];
    const withSk = [...new Set(Array.from({ length: 30 }, (_, i) => talentOffer(st, h, 4 + i * 4)).flat())];
    h.talents = ['volley']; const after = [...new Set(Array.from({ length: 30 }, (_, i) => talentOffer(st, h, 4 + i * 4)).flat())];
    return { sizes: [...new Set(offers.map(o => o.length))], bare, withSk, after, again: JSON.stringify(talentOffer(st, h, 8)) === JSON.stringify(talentOffer(st, h, 8)), lv: [3, 4, 8, 12].map(talentLevel) };
  });
  assert.deepEqual(r.sizes, [3]);
  assert.deepEqual(r.bare.sort(), ['archmage', 'explorer', 'veteran'], 'bez umiejętności tylko talenty bez wymagań');
  for (const id of ['volley', 'fortunate', 'warlord', 'giantSlayer']) assert.ok(r.withSk.includes(id), id);
  assert.ok(!r.after.includes('volley'), 'zdobyty talent nie wraca'); assert.ok(r.again); assert.deepEqual(r.lv, [false, true, true, true]);
});

test('awans gracza na 4. poziom: po umiejętności okno talentu; SI wybiera sama', async () => {
  await newGame(page, { opponents: 1 });
  await page.evaluate(() => { const st = G.state, h = hero(st); h.exp = expForLevel(3); h.level = 3; window.DONE = false; gainExp(st, h, expForLevel(4) - h.exp, () => { window.DONE = true; }); });
  let d = await dialog(page);
  assert.match(d.msg, /osiąga poziom 4!.*Wybierz umiejętność/);
  await pressDialog(page, d.labels[0]);
  d = await dialog(page);
  assert.match(d.msg, /odsłania talent/); assert.equal(d.labels.length, 3);
  await frames(page, 3);
  await pressDialog(page, 'Weteran');
  const r = await page.evaluate(() => { const h = hero(G.state), st = G.state, ai = st.heroes.find(x => x.owner === 1); ai.exp = 0; ai.level = 1; const s0 = { ...ai.stats };
    gainExp(st, ai, expForLevel(8)); return { done: DONE, talents: h.talents, att: h.stats.att, ai: ai.talents, modal: !!G.modal };
  });
  assert.equal(r.done, true); assert.deepEqual(r.talents, ['veteran']);
  assert.equal(r.ai.length, 2, 'SI: talent na 4. i 8. poziomie'); assert.equal(r.modal, false);
});

test('talenty i nowe umiejętności w bitwie', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'); m.cid = 'pikeman'; m.count = 40;
    h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 20 }; h.army[1] = { cid: 'archer', n: 100 };
    const setup = (skills, talents) => { h.skills = skills; h.talents = talents; const B = createBattle(st, h, m); B.rng = () => 0.5; return B; };
    const out = {};
    // Taktyka: +3 do szybkości i ataku w pierwszej rundzie, potem znika
    { const B = setup([{ id: 'tactics', lv: 3 }], []), u = B.units.find(u => u.side === 0 && u.cid === 'swordsman'), s0 = unitSpd(u); nextActive(B); const s1 = unitSpd(u);
      for (let k = 0; k < 2; k++) { B.order = []; B.waitQ = []; B.active = null; nextActive(B); } out.tac = [CREATURES.swordsman.spd, s1, unitSpd(u), B.round]; }
    // Salwa: strzał z daleka bez kary
    { const dmg = t => { const B = setup([], t), a = B.units.find(u => u.side === 0 && u.cid === 'archer'), e = B.units.find(u => u.side === 1); a.x = 0; e.x = BCOLS - 1; B.obst.clear(); return damageRoll(B, a, e, true); }; out.volley = [dmg([]), dmg(['volley'])]; }
    // Kontruderzenie: dwa odwety na rundę
    { const B = setup([], ['counter']), u = B.units.find(u => u.side === 0 && u.cid === 'swordsman'); out.counter = [canRetal(B, u), (u.retaliated = 1, canRetal(B, u)), (u.retaliated = 2, canRetal(B, u))]; }
    // Wódz: morale nie spada poniżej zera, +1
    { h.army[2] = { cid: 'skeleton', n: 5 }; h.army[3] = { cid: 'imp', n: 5 }; const a = setup([], []).morale[0], b = setup([], ['warlord']).morale[0]; h.army[2] = h.army[3] = null; out.warlord = [a, b]; }
    // Bitewny mag: dwa czary w rundzie; Bariera wroga zatrzymuje pierwszy
    { h.spells = ['magicArrow']; h.mana = 100; const B = setup([], ['doubleCast']); nextActive(B); const s = casterSide(B), t = B.units.find(u => u.side !== s);
      castBattle(B, 'magicArrow', t.x, t.y); const c1 = canCastNow(B); castBattle(B, 'magicArrow', t.x, t.y); out.dbl = [c1, canCastNow(B)]; }
    // Zakłócanie: obrażenia wrogich czarów słabsze
    { const B = setup([{ id: 'interference', lv: 3 }], []); out.interf = interfMul(B, 1); }
    // Grabież i Opatrywanie ran po zwycięstwie
    { h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 60 }; m.count = 40; const g0 = st.players[ME].resources.gold;
      const B = setup([{ id: 'plunder', lv: 3 }, { id: 'triage', lv: 3 }], []); simulateBattle(B); const lost = B.units.filter(u => u.side === 0).reduce((s, u) => s + u.n0 - (u.dead ? 0 : u.n), 0);
      const res = resolveBattle(B, false); out.spoils = { want: Math.round(40 * CREATURES.pikeman.cost.gold * 0.3), outcome: res.outcome, gold: st.players[ME].resources.gold - g0, plunder: res.spoils.gold, healed: res.spoils.healed, lost, army: h.army[0] && h.army[0].n, text: spoilsText(res.spoils) }; }
    return out;
  });
  assert.equal(r.tac[1], r.tac[0] + 3); assert.equal(r.tac[2], r.tac[0], JSON.stringify(r.tac));
  assert.ok(Math.abs(r.volley[1] / r.volley[0] - 2) < 0.02, JSON.stringify(r.volley)); // kara za odległość znika
  assert.deepEqual(r.counter, [true, true, false]);
  assert.ok(r.warlord[0] < 0 && r.warlord[1] === 1, JSON.stringify(r.warlord));
  assert.deepEqual(r.dbl, [true, false]);
  assert.equal(r.interf, 0.6);
  assert.equal(r.spoils.outcome, 'win'); assert.equal(r.spoils.gold, r.spoils.plunder); assert.equal(r.spoils.plunder, r.spoils.want);
  assert.equal(r.spoils.healed, Math.floor(r.spoils.lost * 0.3)); assert.match(r.spoils.text, /Grabież/);
});

test('Bariera, Dyplomacja, Forsowny marsz, Skarbnik, Uczony; zapis talentów', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'), out = {};
    // Bariera: pierwszy wrogi czar nie działa
    { h.talents = []; h.spells = ['magicArrow']; h.mana = 100; const foe = { ...h, talents: ['spellWard'] }; const B = createBattle(st, h, m); B.sides[1].hero = foe; B.active = B.units.find(u => u.side === 0);
      const s = casterSide(B), t = B.units.find(u => u.side !== s), n0 = t.n, hp0 = t.hp; castBattle(B, 'magicArrow', t.x, t.y); out.ward = [t.n === n0 && t.hp === hp0, B.warded[1 - s], B.log.some(l => /Bariera/.test(l))]; }
    // Dyplomacja: taniej i chętniej
    { const mm = { ...m, cid: 'pikeman', count: 10, mood: 'neutral' }; h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 30 }; h.skills = [];
      const a = neutralReaction(st, h, mm); h.skills = [{ id: 'diplomacy', lv: 3 }]; const b = neutralReaction(st, h, mm); h.talents = ['diplomat']; const c = neutralReaction(st, h, mm); out.dip = [a, b, c]; }
    h.talents = []; h.skills = []; const mp0 = heroMaxMP(h), g0 = dailyIncomeAll(st, ME).gold; h.talents = ['forcedMarch', 'treasurer']; out.mp = heroMaxMP(h) - mp0; out.gold = dailyIncomeAll(st, ME).gold - g0;
    h.skills = [{ id: 'wisdom', lv: 2 }]; const n0 = h.spells.length; learnTalent(st, h, 'scholar'); out.scholar = h.spells.length - n0;
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st)))); out.saved = back.heroes.find(x => x.id === h.id).talents;
    setScreen('hero', {}); G.screens.hero.draw(G.ctx); const tr = G.screens.hero.talentRects[0]; out.info = G.screens.hero.rightInfo(tr.x + 4, tr.y + 4);
    return out;
  });
  assert.deepEqual(r.ward, [true, true, true]);
  assert.ok(r.dip[1] && r.dip[1].kind === 'join', JSON.stringify(r.dip)); assert.ok(!r.dip[0] || r.dip[0].cost > r.dip[1].cost, JSON.stringify(r.dip)); assert.equal(r.dip[2].cost, 0);
  assert.equal(r.mp, 300); assert.equal(r.gold, 500); assert.equal(r.scholar, 2);
  assert.deepEqual(r.saved, ['forcedMarch', 'treasurer', 'scholar']); assert.match(r.info, /Talent — Forsowny marsz/);
  await frames(page, 5);
});

test('SI pod ostrzałem: piechota nie czeka w miejscu, tylko idzie na strzelców (od 2. rundy)', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, a = hero(st), b = st.heroes.find(h => h.owner === 1);
    a.army = emptyArmy(); a.army[0] = { cid: 'swordsman', n: 20 }; a.army[1] = { cid: 'pikeman', n: 30 }; b.army = emptyArmy(); b.army[0] = { cid: 'archer', n: 40 }; b.army[1] = { cid: 'pikeman', n: 30 };
    a.machines = []; b.machines = []; const B = createBattle(st, a, b), u = B.units.find(x => x.side === 0 && x.cid === 'swordsman'), x0 = u.x;
    B.round = 2; B.order = B.units.filter(x => x.side === 1); B.active = u; const fire = underFire(B, 0); aiAct(B, u);
    return { fire, moved: u.x !== x0, waited: !!u.waited, def: !!u.defending };
  });
  assert.deepEqual(r, { fire: true, moved: true, waited: false, def: false });
});

test('artefakty z talentem działają po założeniu; SI skacze Drzwiami wymiarów do dalekiego celu', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), out = {}; h.talents = [];
    out.before = heroPerk(h, 'volley'); h.equip.weapon = 'falconBow'; out.after = heroPerk(h, 'volley'); out.info = artInfo('falconBow');
    const ai = st.heroes.find(x => x.owner === 1), n = st.map.n; for (const p of st.players) p.explored.fill(1);
    ai.spells = ['dimensionDoor']; ai.book = true; ai.stats.sp = 4; ai.stats.kn = 10; ai.mana = 100; ai.mp = 400; const R = aiReach(st, ai);
    let ti = -1; for (let i = 0; i < n * n; i++) if (R.dist[i] > 1500 && R.dist[i] < 2500) { ti = i; break; }
    const x0 = ai.x, y0 = ai.y, jumped = aiMapSpells(st, ai, R, { i: ti, what: 'explore' });
    out.ai = { jumped, moved: ai.x !== x0 || ai.y !== y0, mana: ai.mana < 100 };
    return out;
  });
  assert.equal(r.before, false); assert.equal(r.after, true); assert.match(r.info, /talent Salwa/);
  assert.deepEqual(r.ai, { jumped: true, moved: true, mana: true });
});
