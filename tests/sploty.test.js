// Etap 3 rozwoju bohatera: wolne punkty cech (co FREE_PT_EVERY poziomów) i sploty umiejętności (SYNERGIES). Uruchom: npm test
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
  h.stats = { att: 6, def: 4, sp: 3, kn: 3 }; h.skills = []; h.talents = []; h.equip = {}; h.machines = []; new Function('h', setup)(h);
  window.__B = createBattle(st, h, t); __B.active = __B.units.find(u => u.side === 0); return true;
}, [army, garrison, setup]);

test('dane splotów: dwie różne istniejące umiejętności, splot działa od poziomu zaawansowanego obu', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const bad = Object.entries(SYNERGIES).filter(([, S]) => S.req.length !== 2 || S.req[0] === S.req[1] || !S.req.every(s => SKILLS[s]) || !S.name || !S.desc).map(([id]) => id);
    const h = hero(G.state); h.skills = [{ id: 'tactics', lv: 2 }, { id: 'fireMagic', lv: 1 }]; const before = synergy(h, 'burningCharge');
    h.skills[1].lv = 2; return { bad, n: Object.keys(SYNERGIES).length, before, after: synergy(h, 'burningCharge'), list: activeSynergies(h), hint: synHint(h, 'tactics') };
  });
  assert.deepEqual(r.bad, []); assert.ok(r.n >= 20); assert.equal(r.before, false); assert.equal(r.after, true); assert.deepEqual(r.list, ['burningCharge']);
  assert.match(r.hint, /Płonąca szarża \(działa\)/); assert.match(r.hint, /Polowe dowództwo \(z: Mądrość\)/);
});

test('wolne punkty: komputer wydaje od razu, stary zapis dostaje zaległe, gracz klika cechę na ekranie bohatera', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, ai = st.heroes.find(x => x.owner !== ME), s0 = Object.values(ai.stats).reduce((a, b) => a + b, 0), L0 = ai.level;
    gainExp(st, ai, expForLevel(L0 + 6) - ai.exp); const s1 = Object.values(ai.stats).reduce((a, b) => a + b, 0), ups = ai.level - L0;
    const old = { level: 9, stats: { att: 1, def: 1, sp: 1, kn: 1 }, skills: [], equip: {}, bag: [], talents: [], exp: expForLevel(9) }; initHeroProgress(old);
    return { gained: s1 - s0, ups, free: ai.freePts, pts: Math.floor(ai.level / FREE_PT_EVERY) - Math.floor(L0 / FREE_PT_EVERY), old: old.freePts };
  });
  assert.equal(r.free, 0, 'komputer nie zostawia punktów'); assert.equal(r.gained, r.ups + r.pts, 'cecha z klasy co poziom + wolny punkt co 2'); assert.equal(r.old, 4);
  await page.evaluate(() => { const h = hero(G.state); h.freePts = 2; setScreen('hero', {}); }); await frames(page, 3);
  const h = await page.evaluate(() => { const S = G.screens.hero, kn0 = hero(G.state).stats.kn; S.onClick(32 + 3 * 90 + 40, 200); return { kn: hero(G.state).stats.kn - kn0, left: hero(G.state).freePts }; });
  assert.deepEqual(h, { kn: 1, left: 1 });
});

test('awans: nowy splot ogłoszony po wyborze umiejętności, która go dopełnia', async () => {
  await newGame(page);
  await page.evaluate(() => { const st = G.state, h = hero(st); h.level = 2; h.exp = expForLevel(2); h.freePts = 0; h.skills = [{ id: 'leadership', lv: 2 }, { id: 'waterMagic', lv: 1 }]; h.synSeen = [];
    window.skillOffer = ((orig) => (st, h, L) => ['waterMagic', 'luck', 'scouting'])(skillOffer); gainExp(st, h, expForLevel(3) - h.exp); });
  let d = await dialog(page); assert.match(d.msg, /Wybierz umiejętność/); await pressDialog(page, 'Magia Wody');
  d = await dialog(page); assert.match(d.msg, /Nowy splot/); assert.deepEqual(d.labels, ['Święty zastęp']);
  await pressDialog(page, 'Święty zastęp'); assert.equal(await page.evaluate(() => !!G.modal), false);
});

test('sploty w bitwie: Święty zastęp, Kamienny mur, Polowe dowództwo, Kapitan łuczników, Rzeka i skała, Mistrz oblężeń, Polowy chirurg', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20], ['swordsman', 10], ['archer', 20]], [['pikeman', 30]],
    "h.skills = [{ id: 'leadership', lv: 2 }, { id: 'waterMagic', lv: 2 }, { id: 'armorer', lv: 2 }, { id: 'earthMagic', lv: 2 }, { id: 'tactics', lv: 2 }, { id: 'wisdom', lv: 2 }, { id: 'archery', lv: 2 }, { id: 'ballistics', lv: 2 }, { id: 'artillery', lv: 2 }, { id: 'firstAid', lv: 2 }, { id: 'triage', lv: 2 }]; h.machines = ['firstAid'];");
  const r = await page.evaluate(() => {
    const B = __B, h = B.h, [pk, sw] = B.units.filter(u => u.side === 0 && !isMachine(u)), out = {};
    out.firstFree = battleCost(B, 0, h, 'warCry'); out.volley = (() => { B.freeOrder = [true, true]; return battleCost(B, 0, h, 'volleyOrder'); })(); B.freeOrder = null;
    pk.hp = 1; const v0 = B.valor[0]; castBattle(B, 'warCry', pk.x, pk.y); out.healed = pk.hp > 1; out.paid = v0 - B.valor[0];
    B.cast[0] = false; B.casts[0] = 0; sw.x = pk.x; sw.y = pk.y + 1 < BROWS ? pk.y + 1 : pk.y - 1; castBattle(B, 'shieldWall', pk.x, pk.y); out.wall = [!!pk.buffs.wall, !!sw.buffs.wall, hexAdjacent(pk, sw)];
    out.def = sideDef(B, 0) - heroStat(h, 'def'); out.cat = catapultShots(B, { side: 0 });
    const tent = B.units.find(u => u.cid === 'firstAid'); pk.n = 5; pk.hp = CREATURES.pikeman.hp; const n0 = pk.n; B.rng = () => 0.99; actFirstAid(B, tent, pk); out.raised = pk.n > n0;
    return out;
  });
  assert.equal(r.firstFree, 0, 'Polowe dowództwo: pierwszy rozkaz za darmo'); assert.equal(r.paid, 0); assert.equal(r.volley, 7 - 3, 'Kapitan łuczników');
  assert.equal(r.healed, true, 'Święty zastęp leczy'); assert.equal(r.wall[0], true); if (r.wall[2]) assert.equal(r.wall[1], true, 'Kamienny mur: sąsiad też');
  assert.equal(r.def, 1, 'Rzeka i skała: +1 obrony'); assert.equal(r.cat, 3, 'Mistrz oblężeń: katapulta raz więcej'); assert.equal(r.raised, true, 'Polowy chirurg wskrzesza');
});

test('sploty: Płonąca szarża, Ostrze i czar, Żelazna wola, Burza ognia, Zwiad konny, Akademia wojenna', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['swordsman', 20]], [['pikeman', 40]], "h.skills = [{ id: 'tactics', lv: 2 }, { id: 'fireMagic', lv: 2 }, { id: 'offense', lv: 2 }, { id: 'sorcery', lv: 2 }, { id: 'leadership', lv: 2 }, { id: 'resistance', lv: 2 }]; h.book = true; h.spells = ['magicArrow']; h.mana = 50;");
  const r = await page.evaluate(() => {
    const B = __B, h = B.h, a = B.units.find(u => u.side === 0), t = B.units.find(u => u.side === 1);
    castBattle(B, 'magicArrow', t.x, t.y); const blade = !!a.buffs.charge && a.ordv.charge === 25;
    strike(B, a, t, false); const burn = !!t.buffs.poison && t.psn > 0;
    B.morale = [-3, 0]; let lost = 0; for (let k = 0; k < 30; k++) { B.order = [a]; B.waitQ = []; a.moraleRolled = false; B.active = null; const u = nextActive(B); if (u !== a) lost++; }
    h.skills.push({ id: 'airMagic', lv: 2 }); const cost = spellCost(h, 'fireball'), base = (() => { const s = h.skills; h.skills = s.filter(x => x.id !== 'airMagic'); const c = spellCost(h, 'fireball'); h.skills = s; return c; })();
    const st = G.state, me = hero(st); me.skills = [{ id: 'scouting', lv: 2 }, { id: 'logistics', lv: 2 }, { id: 'mentor', lv: 2 }, { id: 'learning', lv: 2 }]; st.day = 7; advanceDay(st); const mpExtra = me.mp - heroMaxMP(me);
    const e0 = me.exp; me.skills = [{ id: 'learning', lv: 2 }]; gainExp(st, me, 100, null, true); const plain = me.exp - e0; me.skills = [{ id: 'mentor', lv: 2 }, { id: 'learning', lv: 2 }]; const e1 = me.exp; gainExp(st, me, 100, null, true);
    return { blade, burn, lost, cost, base, mpExtra, extraExp: me.exp - e1 - plain };
  });
  assert.equal(r.blade, true, 'Ostrze i czar'); assert.equal(r.burn, true, 'Płonąca szarża'); assert.equal(r.lost, 0, 'Żelazna wola');
  assert.ok(r.cost < r.base && Math.abs(r.cost - r.base * 0.8) <= 1, `Burza ognia: ${r.base} → ${r.cost}`); assert.equal(r.mpExtra, 500, 'Zwiad konny w 1. dniu tygodnia'); assert.equal(r.extraExp, 10, 'Akademia wojenna +10%');
});
