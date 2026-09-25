// Umiejętności drugorzędne (krok 7). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('bohaterowie zaczynają z umiejętnościami swojej klasy', async () => {
  await newGame(page, { opponents: 2 }, 5);
  const r = await page.evaluate(() => G.state.heroes.map(h => ({ cls: h.cls, skills: h.skills, want: CLASS_SKILLS[h.cls].map(([id, lv]) => ({ id, lv })) })));
  for (const h of r) assert.deepEqual(h.skills, h.want, h.cls);
});

test('działanie umiejętności na mapie: ruch, widzenie, mana, złoto, teren, doświadczenie', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n, set = (id, lv) => { h.skills = lv ? [{ id, lv }] : []; };
    const out = {}, at = (id, lv, f) => { set(id, 0); const a = f(); set(id, lv); const b = f(); return [a, b]; };
    out.mp = at('logistics', 3, () => heroMaxMP(h));
    out.sight = at('scouting', 2, () => heroSight(h));
    out.mana = at('intelligence', 3, () => heroMaxMana(h));
    out.gold = at('estates', 2, () => dailyIncomeAll(st, ME).gold);
    const sand = st.map.terrain.findIndex((t, i) => t === 3 && !st.map.road[i]);
    out.sand = at('pathfinding', 2, () => baseCost(st.map, sand, sand, h));
    out.sandExpert = at('pathfinding', 3, () => baseCost(st.map, sand, sand, h));
    out.exp = at('learning', 3, () => { h.exp = 0; h.level = 1; gainExp(st, h, 100); G.modal = null; return h.exp; });
    return out;
  });
  assert.equal(r.mp[1], Math.round((r.mp[0]) * 1.3));
  assert.equal(r.sight[1], r.sight[0] + 2);
  assert.equal(r.mana[1], r.mana[0] * 2);
  assert.equal(r.gold[1], r.gold[0] + 250);
  assert.deepEqual(r.sand, [150, 125]); assert.deepEqual(r.sandExpert, [150, 100]);
  assert.deepEqual(r.exp, [100, 115]);
});

test('działanie umiejętności w bitwie: atak, łucznictwo, zbroja, czary, przywództwo, szczęście', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
    h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 20 }; h.army[1] = { cid: 'archer', n: 20 };
    const roll = (skills, ranged) => { h.skills = skills; const B = createBattle(st, h, m); B.rng = () => 0.5; const a = B.units.find(u => u.side === 0 && (ranged ? u.cid === 'archer' : u.cid === 'swordsman')), t = B.units.find(u => u.side === 1); return damageRoll(B, a, t, ranged); };
    const back = skills => { h.skills = skills; const B = createBattle(st, h, m); B.rng = () => 0.5; const a = B.units.find(u => u.side === 1), t = B.units.find(u => u.side === 0); return damageRoll(B, a, t, false); };
    const B0 = (h.skills = [{ id: 'leadership', lv: 2 }, { id: 'luck', lv: 3 }], createBattle(st, h, m));
    return { melee: [roll([], false), roll([{ id: 'offense', lv: 3 }], false)], ranged: [roll([], true), roll([{ id: 'archery', lv: 3 }], true)],
      armor: [back([]), back([{ id: 'armorer', lv: 3 }])], morale: B0.morale[0], luck: B0.luck[0],
      spell: [spellDamage({ skills: [] }, SPELLS.magicArrow, 2), spellDamage({ skills: [{ id: 'sorcery', lv: 2 }] }, SPELLS.magicArrow, 2)] };
  });
  assert.ok(Math.abs(r.melee[1] / r.melee[0] - 1.3) < 0.05, JSON.stringify(r.melee));
  assert.ok(Math.abs(r.ranged[1] / r.ranged[0] - 1.5) < 0.05, JSON.stringify(r.ranged));
  assert.ok(Math.abs(r.armor[1] / r.armor[0] - 0.85) < 0.05, JSON.stringify(r.armor));
  assert.equal(r.spell[1], Math.floor(r.spell[0] * 1.2));
  assert.equal(r.morale, 3, 'jedna frakcja +1, przywództwo +2'); assert.equal(r.luck, 3);
});

test('propozycja przy awansie: ulepszenie i nowa umiejętność, bez nekromancji poza Kurhanem, limit 8', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), offers = [];
    for (let L = 2; L < 40; L++) offers.push(skillOffer(st, h, L));
    const again = JSON.stringify(skillOffer(st, h, 5)) === JSON.stringify(skillOffer(st, h, 5));
    const known = h.skills.map(s => s.id), first = skillOffer(st, h, 2);
    const full = { ...h, skills: Object.keys(SKILLS).filter(id => id !== 'necromancy').slice(0, 8).map(id => ({ id, lv: 1 })) }, fullOffer = skillOffer(st, full, 3);
    const maxed = { ...h, skills: full.skills.map(s => ({ ...s, lv: 3 })) };
    const necro = { ...h, cls: 'necro', skills: [] }, necroSeen = Array.from({ length: 40 }, (_, L) => skillOffer(st, necro, L)).flat().includes('necromancy');
    return { sizes: [...new Set(offers.map(o => o.length))], noNecro: !offers.flat().includes('necromancy'), again,
      firstUp: known.includes(first[0]), firstNew: !known.includes(first[1]), fullOnlyUp: fullOffer.every(id => full.skills.some(s => s.id === id)), maxed: skillOffer(st, maxed, 3), necroSeen };
  });
  assert.deepEqual(r.sizes, [2]); assert.ok(r.noNecro); assert.ok(r.again);
  assert.ok(r.firstUp, 'pierwsza opcja ulepsza znaną'); assert.ok(r.firstNew, 'druga jest nowa');
  assert.ok(r.fullOnlyUp, 'przy 8 umiejętnościach tylko ulepszenia'); assert.deepEqual(r.maxed, []); assert.ok(r.necroSeen);
});

test('awans gracza: okno wyboru umiejętności po kolei dla każdego poziomu, potem dalszy ciąg', async () => {
  await newGame(page);
  await page.evaluate(() => { const st = G.state, h = hero(st); window.DONE = false; window.OFFERS = [skillOffer(st, h, 2)]; gainExp(st, h, expForLevel(3) - h.exp, () => { window.DONE = true; }); });
  let d = await dialog(page);
  assert.match(d.msg, /osiąga poziom 2!.*Wybierz umiejętność/);
  const want = await page.evaluate(() => OFFERS[0].map(id => SKILLS[id].name));
  assert.deepEqual(d.labels, want);
  assert.equal(await page.evaluate(() => G.modal.locked), true, 'Esc nie pomija wyboru');
  const pick = await page.evaluate(() => OFFERS[0][1]);
  await pressDialog(page, d.labels[1]);
  assert.equal(await page.evaluate(id => heroSkill(hero(G.state), id), pick), 1);
  d = await dialog(page);
  assert.match(d.msg, /osiąga poziom 3!/);
  await frames(page, 3);
  await pressDialog(page, d.labels[0]);
  assert.equal(await page.evaluate(() => DONE), true);
  assert.equal(await page.evaluate(() => hero(G.state).skills.length), 3);
});

test('SI wybiera umiejętności sama, według swojej kolejności', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, h = st.heroes.find(h => h.owner === 1), offer = skillOffer(st, h, 2), before = h.skills.map(s => s.id + s.lv).join();
    gainExp(st, h, expForLevel(2) - h.exp);
    return { modal: !!G.modal, pick: aiPickSkill(offer), skills: h.skills, before };
  });
  assert.equal(r.modal, false);
  assert.ok(r.skills.some(s => s.id === r.pick), JSON.stringify(r));
});

test('nekromancja: po zwycięstwie z poległych wstają kościotrupy', async () => {
  await newGame(page, { faction: 'barrow' });
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'); m.cid = 'pikeman'; m.count = 50;
    h.skills = [{ id: 'necromancy', lv: 3 }]; h.army = emptyArmy(); h.army[0] = { cid: 'vampireLord', n: 30 };
    const res = resolveBattle(simulateBattle(createBattle(st, h, m)), false), bones = h.army.find(s => s && s.cid === 'boneWarrior');
    return { outcome: res.outcome, raised: res.raised, bones: bones && bones.n, text: raisedText(res.raised) };
  });
  assert.equal(r.outcome, 'win');
  assert.equal(r.raised, Math.floor(50 * 10 * 0.3 / 7)); // 30% życia poległych / 7 pż kościotrupa
  assert.equal(r.bones, r.raised); assert.match(r.text, /Nekromancja: wstaj/);
});

test('ekran bohatera pokazuje umiejętności, zapis je zachowuje', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); learnSkill(h, 'logistics'); learnSkill(h, 'logistics');
    setScreen('hero', {}); const scr = G.screens.hero, rc = scr.skillRect(2), info = scr.rightInfo(rc.x + 5, rc.y + 5), empty = scr.rightInfo(scr.skillRect(7).x + 5, scr.skillRect(7).y + 5);
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { info, empty, saved: JSON.stringify(back.heroes.find(x => x.id === h.id).skills) === JSON.stringify(h.skills) };
  });
  assert.match(r.info, /Logistyka \(zaawansowane\): \+20% punktów ruchu/);
  assert.match(r.empty, /Wolne miejsce/); assert.ok(r.saved);
  await frames(page, 5);
});
