// Etap 4 rozwoju bohatera: klasy prestiżowe (PRESTIGE) – hybrydy na 10. poziomie dla każdego bohatera z parą umiejętności,
// stałe działanie i zdolność raz na bitwę. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const battle = (army, garrison, setup = '') => page.evaluate(([army, garrison, setup]) => {
  const st = G.state, t = st.towns[1], h = hero(st);
  t.built = ['hall1']; t.garrison = emptyArmy(); garrison.forEach(([cid, n], i) => { t.garrison[i] = { cid, n }; });
  h.army = emptyArmy(); army.forEach(([cid, n], i) => { h.army[i] = { cid, n }; });
  h.stats = { att: 6, def: 4, sp: 4, kn: 4 }; h.skills = []; h.talents = []; h.equip = {}; h.machines = []; h.level = 12; h.mastery = null; new Function('h', setup)(h);
  window.__B = createBattle(st, h, t); __B.active = __B.units.find(u => u.side === 0); return true;
}, [army, garrison, setup]);

test('dane: 12 klas prestiżowych, każda z parą umiejętności, legendą i zdolnością w ORDERS', async () => {
  await newGame(page);
  const r = await page.evaluate(() => ({ n: Object.keys(PRESTIGE).length,
    bad: Object.entries(PRESTIGE).filter(([id, P]) => P.req.length !== 2 || !P.req.every(s => SKILLS[s]) || !P.legend || !ORDERS[P.ability] || ORDERS[P.ability].prestige !== id || !HERO_PATHS[id]).map(([id]) => id),
    texts: Object.keys(PRESTIGE).map(id => pathText(id, 2)) }));
  assert.equal(r.n, 12); assert.deepEqual(r.bad, []); assert.ok(r.texts.every(t => /raz na bitwę/.test(t)));
});

test('rycerz z Magią Ognia na 10. poziomie widzi Płomiennego paladyna; komputer woli klasę prestiżową', async () => {
  await newGame(page, { opponents: 1 });
  await page.evaluate(() => { const st = G.state, h = hero(st); h.exp = expForLevel(9); h.level = 9; h.freePts = 0; h.skills = [{ id: 'leadership', lv: 2 }, { id: 'fireMagic', lv: 2 }]; h.mastery = null;
    window.skillOffer = () => []; gainExp(st, h, expForLevel(10) - h.exp); });
  let d = await dialog(page); while (d && !/ścieżkę mistrzowską/.test(d.msg)) { await pressDialog(page, d.labels[0]); d = await dialog(page); }
  assert.match(d.msg, /klasy prestiżowe/); assert.ok(d.labels.includes('Płomienny paladyn'), d.labels.join());
  await pressDialog(page, 'Płomienny paladyn');
  const r = await page.evaluate(() => { const st = G.state, h = hero(st), ai = st.heroes.find(x => x.owner === 1);
    ai.skills = [{ id: 'archery', lv: 2 }, { id: 'airMagic', lv: 2 }]; ai.mastery = null; ai.level = 9; ai.exp = expForLevel(9); gainExp(st, ai, expForLevel(10) - ai.exp);
    return { mine: h.mastery, orders: knownOrders(h), ai: ai.mastery, title: pathTitle(h) }; });
  assert.equal(r.mine, 'flamePaladin'); assert.ok(r.orders.includes('judgement')); assert.equal(r.ai, 'stormhunter'); assert.equal(r.title, 'Płomienny paladyn');
});

test('stałe działanie: Płomienny paladyn, Strażnik twierdzy, Ostrze run, Krwawy mag, Łowca burz', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['archer', 20]], [['pikeman', 20]], "h.mastery = 'flamePaladin';");
  const r = await page.evaluate(() => { const B = __B, h = B.h, out = {}; out.att = sideAtt(B, 0) - heroStat(h, 'att'); h.mastery = 'warden'; out.def = sideDef(B, 0) - heroStat(h, 'def');
    h.mastery = null; const sp0 = heroStat(h, 'sp'); h.mastery = 'runeblade'; out.sp = heroStat(h, 'sp') - sp0;
    h.mastery = null; const d0 = spellDamage(h, SPELLS.magicArrow, 3); h.mastery = 'bloodmage'; out.blood = spellDamage(h, SPELLS.magicArrow, 3) / d0;
    const a = B.units.find(u => u.side === 0), t = B.units.find(u => u.side === 1); h.mastery = null; const e0 = estimateStrike(B, a, t, true); h.mastery = 'stormhunter'; const e1 = estimateStrike(B, a, t, true); out.storm = e1.max / e0.max;
    return out; });
  assert.equal(r.att, 1); assert.equal(r.def, 2); assert.equal(r.sp, 1, 'Ostrze run: atak 6 / 4'); assert.ok(r.blood > 1.09 && r.blood < 1.11); assert.ok(r.storm > 1.08, `Łowca burz ×${r.storm}`);
});

test('zdolności: raz na bitwę, za darmo, każda działa', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const res = {};
  for (const id of ['flamePaladin', 'runeblade', 'warpriest', 'stormhunter', 'bonecaller', 'archdruid', 'beastlord', 'bombardier', 'shadowmaster', 'bloodmage', 'warden', 'battleArch']) {
    await battle([['pikeman', 30], ['archer', 20]], [['swordsman', 25], ['pikeman', 25]], `h.mastery = '${id}'; h.book = true; h.mana = 2;`);
    res[id] = await page.evaluate(() => {
      const B = __B, h = B.h, s = 0, ab = PRESTIGE[h.mastery].ability, hp = u => (u.n - 1) * CREATURES[u.cid].hp + u.hp, mine = B.units.filter(u => u.side === 0), foe = B.units.find(u => u.side === 1);
      const pk = mine[0]; foe.x = pk.x + 1; foe.y = pk.y; // wróg tuż przy pikinierach (Sąd ognia)
      pk.hp = 1; const before = { foe: B.units.filter(u => u.side === 1).reduce((t, u) => t + hp(u), 0), units: B.units.length, mana: h.mana };
      const ok = canOrderNow(B) && orderAvail(B, s, h, ab), cost = battleCost(B, s, h, ab), tgt = ['ally'].includes(ORDERS[ab].target) ? pk : foe;
      castBattle(B, ab, tgt.x, tgt.y); const again = orderAvail(B, s, h, ab);
      return { ok, cost, again, dmg: before.foe - B.units.filter(u => u.side === 1).reduce((t, u) => t + hp(u), 0), summoned: B.units.length - before.units, healed: pk.hp > 1,
        rune: !!(pk.buffs.charge && pk.buffs.exec), root: !!foe.buffs.root && unitSpd(foe) === 0, wall: mine.every(u => u.buffs.wall), mana: h.mana - before.mana, stone: mine.every(u => u.buffs.stoneSkin) };
    });
  }
  for (const [id, r] of Object.entries(res)) { assert.equal(r.ok, true, `${id}: dostępna`); assert.equal(r.cost, 0, `${id}: darmowa`); assert.equal(r.again, false, `${id}: raz na bitwę`); }
  for (const id of ['flamePaladin', 'stormhunter', 'bombardier', 'shadowmaster', 'battleArch']) assert.ok(res[id].dmg > 0, `${id}: obrażenia`);
  assert.equal(res.bonecaller.summoned, 1); assert.equal(res.beastlord.summoned, 1); assert.equal(res.runeblade.rune, true); assert.equal(res.archdruid.root, true);
  assert.equal(res.warden.wall, true); assert.equal(res.warpriest.stone, true); assert.equal(res.warpriest.healed, true); assert.ok(res.bloodmage.mana > 0, 'Krwawy pakt: mana');
});

test('SI używa zdolności w bitwie', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['swordsman', 30], ['archer', 20]], [['pikeman', 60]], "h.mastery = 'shadowmaster';");
  const r = await page.evaluate(() => { simulateBattle(__B); return __B.log.some(l => l.includes('Cios z cienia!')); });
  assert.equal(r, true);
});
