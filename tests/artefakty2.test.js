// Etap 5 rozwoju bohatera: artefakty 2.0 – rosnące, przeklęte, aktywne (raz na bitwę), relikwie rodów i zaklinanie w mieście.
// Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const NEW = ['thirstBlade', 'veteranShield', 'livingTome', 'pupilRing', 'trophyNecklace', 'roadBoots', 'berserkAxe', 'greedCrown', 'leadGreaves', 'voidAmulet', 'hexRing', 'bloodMail',
  'thunderRod', 'lifeFlask', 'warHorn', 'mirrorShield', 'bindingChains', 'hourglass', 'manaCrystal', 'fireScroll', 'dawnOath', 'elderHeart', 'lichPhylactery', 'runeHammer', 'hellforgeCrown', 'frostLens', 'abyssMask', 'warchiefTotem', 'gearHeart'];

// bohater gracza w bramie własnego miasta z gildią magów (albo bez niej)
const inTown = guild => page.evaluate(guild => {
  const st = G.state, h = hero(st), t = st.towns.find(t => t.owner === h.owner); t.built = guild ? ['hall1', 'guild1'] : ['hall1'];
  st.heroes.filter(o => o !== h && o.x === t.x && o.y === t.y).forEach(o => { o.x = 1; o.y = 1; }); h.x = t.x; h.y = t.y; h.equip = emptyEquip(); h.bag = []; h.locked = {}; h.ench = {}; h.artXp = {}; return true;
}, guild);

test('dane: 29 nowych artefaktów, każdy rodzaj poprawny, obrazek 3D i rysunek zapasowy, na mapie w puli', async () => {
  await newGame(page);
  const r = await page.evaluate(ids => {
    const bad = ids.filter(id => { const A = ARTIFACTS[id]; if (!A || !EQUIP_SLOTS.some(s => s.kind === A.kind)) return true;
      if (A.use && (!ORDERS[A.use] || ORDERS[A.use].art !== id || !onceOrder(A.use))) return true;
      if (A.cursed && !Object.values(A.bonus).some(v => v < 0)) return true;
      if (A.grow && !(A.grow.every > 0 && A.grow.max > 0 && KEY_NAMES[A.grow.key])) return true;
      if (A.fac && (!FACTIONS.some(F => F.id === A.fac) || !A.own)) return true; return !(A.use || A.cursed || A.grow || A.fac); });
    const c = document.createElement('canvas').getContext('2d'); for (const id of ids) drawArtifact(c, id);
    return { bad, art3d: ids.filter(id => !ARTIFACT_ART.f[id]), pool: ids.filter(id => !ARTS_BY_RARITY(ARTIFACTS[id].rarity).includes(id)), texts: ids.map(id => artInfo(id)), facs: new Set(ids.map(id => ARTIFACTS[id].fac).filter(Boolean)).size };
  }, NEW);
  assert.deepEqual(r.bad, []); assert.deepEqual(r.art3d, [], 'obrazki 3D'); assert.deepEqual(r.pool, []); assert.equal(r.facs, 9, 'relikwia dla każdej frakcji');
  assert.ok(r.texts.every(t => t.length > 20)); assert.match(r.texts[NEW.indexOf('berserkAxe')], /-3 do obrony.*Przeklęty/);
});

test('rosnący artefakt: zbiera zwycięstwa, premia rośnie do granicy, stan idzie z artefaktem do innego bohatera', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); h.equip = emptyEquip(); h.bag = []; h.artXp = {}; giveArtifact(h, 'thirstBlade'); const a0 = heroStat(h, 'att');
    const msgs = []; for (let i = 0; i < 20; i++) msgs.push(...growArtifacts(h)); const a1 = heroStat(h, 'att');
    const other = st.heroes.find(o => o !== h); other.bag = other.bag || []; other.equip = other.equip || emptyEquip(); unequip(h, 'weapon'); h.bag.splice(h.bag.indexOf('thirstBlade'), 1); other.bag.push('thirstBlade'); moveArtData(h, other, 'thirstBlade');
    return { gain: a1 - a0, msgs: msgs.length, first: msgs[0], moved: other.artXp.thirstBlade, left: h.artXp.thirstBlade, info: artInfo('thirstBlade', other) };
  });
  assert.equal(r.gain, 5, 'najwyżej +5'); assert.equal(r.msgs, 5); assert.match(r.first, /Ostrze Pragnienia rośnie w siłę: \+1 ataku/);
  assert.equal(r.moved, 20); assert.equal(r.left, undefined); assert.match(r.info, /teraz \+5, zwycięstw: 20/);
});

test('przeklęty artefakt: nie schodzi poza miastem z gildią, w mieście z gildią tak', async () => {
  await newGame(page);
  await inTown(false);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); giveArtifact(h, 'berserkAxe'); const att = heroStat(h, 'att'), def = heroStat(h, 'def');
    const err = unequip(h, 'weapon'), still = h.equip.weapon; h.bag.push('noviceSword'); const swap = equipFromBag(h, h.bag.indexOf('noviceSword'));
    const t = st.towns.find(t => t.owner === h.owner); t.built.push('guild1'); const ok = unequip(h, 'weapon');
    return { err, still, swap, ok, off: h.equip.weapon, att: att - heroStat(h, 'att'), def: def - heroStat(h, 'def') };
  });
  assert.match(r.err, /przeklęty/); assert.equal(r.still, 'berserkAxe'); assert.match(r.swap, /przeklęty/);
  assert.equal(r.ok, undefined); assert.equal(r.off, null); assert.equal(r.att, 7); assert.equal(r.def, -3);
});

test('relikwia rodu: bohater tej frakcji dostaje więcej', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const h = hero(G.state), keep = h.cls; h.equip = emptyEquip(); h.bag = []; giveArtifact(h, 'dawnOath');
    h.cls = 'knight'; const own = [heroBonus(h, 'att'), heroBonus(h, 'morale')]; h.cls = 'barbarian'; const other = [heroBonus(h, 'att'), heroBonus(h, 'morale')]; h.cls = keep; return { own, other };
  });
  assert.deepEqual(r.own, [4, 1]); assert.deepEqual(r.other, [2, 0]);
});

test('zaklinanie: runa w mieście z gildią za kryształ i klejnoty, z ekranu bohatera; komputer zaklina sam', async () => {
  await newGame(page, { opponents: 1 });
  await inTown(false);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = playerOf(st, h.owner).resources; giveArtifact(h, 'thunderHammer');
    const noGuild = enchantArt(st, h, 'thunderHammer', 'att'); st.towns.find(t => t.owner === h.owner).built.push('guild1');
    Object.assign(R, { gold: 1000, crystal: 0, gems: 0 }); const poor = enchantArt(st, h, 'thunderHammer', 'att');
    Object.assign(R, { gold: 5000, crystal: 5, gems: 5 }); const a0 = heroStat(h, 'att'), ok = enchantArt(st, h, 'thunderHammer', 'att');
    const ai = st.heroes.find(o => o.owner !== h.owner), P = playerOf(st, ai.owner), at = st.towns.find(t => t.owner === ai.owner); ai.equip = emptyEquip(); ai.bag = []; ai.ench = {}; giveArtifact(ai, 'dragonfangBlade');
    at.built = ['hall1', 'guild1']; ai.x = at.x; ai.y = at.y; Object.assign(P.resources, { gold: 20000, crystal: 20, gems: 20 }); visitGuild(st, at, ai);
    return { noGuild, poor, ok, gain: heroStat(h, 'att') - a0, left: [R.gold, R.crystal, R.gems], info: artInfo('thunderHammer', h), ai: ai.ench.dragonfangBlade };
  });
  assert.match(r.noGuild, /gildią magów/); assert.match(r.poor, /Runa kosztuje/); assert.equal(r.ok, null); assert.equal(r.gain, 2, 'runa na potężnym: +2');
  assert.deepEqual(r.left, [3000, 2, 2]); assert.match(r.info, /Runa: Runa siły/); assert.ok(r.ai === 'att' || r.ai === 'sp', `SI: ${r.ai}`);
  // ekran bohatera: klik w założony artefakt w mieście z gildią → Zaklnij runą → wybór runy
  await page.evaluate(() => { const st = G.state, h = hero(st); playerOf(st, h.owner).resources.gems = 9; playerOf(st, h.owner).resources.crystal = 9; setScreen('hero', { heroId: st.heroes.indexOf(h) }); });
  await frames(page, 2);
  await page.evaluate(() => { const S = EQUIP_SLOTS.find(s => s.id === 'weapon'); G.screens.hero.onClick(S.x + 10, S.y + 10); });
  let d = await dialog(page); assert.ok(d.labels.includes('Zaklnij runą'), d.labels.join()); await pressDialog(page, 'Zaklnij runą');
  d = await dialog(page); assert.ok(d.labels.includes('Runa mocy'), d.labels.join()); await pressDialog(page, 'Runa mocy');
  assert.equal(await page.evaluate(() => hero(G.state).ench.thunderHammer), 'sp');
});

test('aktywne artefakty: zdolność w Rozkazach raz na bitwę, za darmo, bez księgi; każda działa; SI jej używa', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const res = {};
  for (const art of ['thunderRod', 'lifeFlask', 'warHorn', 'mirrorShield', 'bindingChains', 'hourglass', 'manaCrystal', 'fireScroll']) {
    res[art] = await page.evaluate(art => {
      const st = G.state, t = st.towns[1], h = hero(st); t.built = ['hall1']; t.garrison = emptyArmy(); t.garrison[0] = { cid: 'swordsman', n: 25 }; t.garrison[1] = { cid: 'pikeman', n: 25 };
      h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 30 }; h.army[1] = { cid: 'archer', n: 20 }; h.stats = { att: 4, def: 4, sp: 2, kn: 3 }; h.skills = []; h.talents = []; h.machines = []; h.mastery = null;
      h.equip = emptyEquip(); h.bag = []; h.book = false; h.level = 10; giveArtifact(h, art); h.mana = 0;
      const B = createBattle(st, h, t); B.active = B.units.find(u => u.side === 0); const s = 0, ab = ARTIFACTS[art].use, O = ORDERS[ab];
      const hp = u => (u.n - 1) * CREATURES[u.cid].hp + u.hp, mine = B.units.filter(u => u.side === 0 && !isMachine(u)), foe = B.units.find(u => u.side === 1), pk = mine[0];
      pk.hp = 1; if (O.target === 'livingAlly') { pk.n = 10; } const foeHp = B.units.filter(u => u.side === 1).reduce((t, u) => t + hp(u), 0);
      const known = knownOrders(h).includes(ab), ok = canOrderNow(B) && orderAvail(B, s, h, ab), cost = battleCost(B, s, h, ab), tgt = ['ally', 'livingAlly', 'allies'].includes(O.target) ? pk : foe;
      castBattle(B, ab, tgt.x, tgt.y);
      return { known, ok, cost, again: orderAvail(B, s, h, ab), dmg: foeHp - B.units.filter(u => u.side === 1).reduce((t, u) => t + hp(u), 0), healed: pk.hp > 1 || pk.n > 10,
        cry: mine.every(u => u.buffs.cry), mirror: !!pk.buffs.mirror && !!pk.buffs.wall, root: !!foe.buffs.root, haste: mine.every(u => u.buffs.haste), mana: h.mana };
    }, art);
  }
  for (const [id, r] of Object.entries(res)) { assert.equal(r.known, true, `${id}: na liście`); assert.equal(r.ok, true, `${id}: dostępna`); assert.equal(r.cost, 0, `${id}: darmowa`); assert.equal(r.again, false, `${id}: raz na bitwę`); }
  assert.ok(res.thunderRod.dmg > 0); assert.ok(res.fireScroll.dmg > 0); assert.equal(res.lifeFlask.healed, true); assert.equal(res.warHorn.cry, true); assert.equal(res.mirrorShield.mirror, true);
  assert.equal(res.bindingChains.root, true); assert.equal(res.hourglass.haste, true); assert.ok(res.manaCrystal.mana > 0);
  const ai = await page.evaluate(() => { const st = G.state, t = st.towns[1], h = hero(st); h.equip = emptyEquip(); giveArtifact(h, 'thunderRod'); const B = createBattle(st, h, t); simulateBattle(B); return B.log.some(l => l.includes('Grom z różdżki!')); });
  assert.equal(ai, true, 'SI użyła różdżki');
});

test('zwycięstwo w bitwie: rosnący artefakt rośnie, raport o tym mówi', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1], h = hero(st); t.built = ['hall1']; t.garrison = emptyArmy(); t.garrison[0] = { cid: 'pikeman', n: 2 };
    h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 40 }; h.equip = emptyEquip(); h.bag = []; h.artXp = { veteranShield: 2 }; giveArtifact(h, 'veteranShield');
    const B = createBattle(st, h, t); simulateBattle(B); const sp = victorySpoils(B, 0); return { over: B.over, xp: h.artXp.veteranShield, text: spoilsText(sp) };
  });
  assert.equal(r.over, 'win'); assert.equal(r.xp, 3); assert.match(r.text, /Tarcza Weterana rośnie w siłę: \+1 obrony/);
});
