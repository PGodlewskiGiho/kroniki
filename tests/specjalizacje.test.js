// Umiejętności 2.0: specjalizacje na poziomie eksperckim (SKILL_FORKS), nowe umiejętności i okno awansu z kartami. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Bitwa bohatera gracza z garnizonem niezależnego miasta bez murów; __B w przeglądarce
const battle = (army, garrison, setup = '') => page.evaluate(([army, garrison, setup]) => {
  const st = G.state, t = st.towns[1], h = hero(st);
  t.built = ['hall1']; t.garrison = emptyArmy(); garrison.forEach(([cid, n], i) => { t.garrison[i] = { cid, n }; });
  h.army = emptyArmy(); army.forEach(([cid, n], i) => { h.army[i] = { cid, n }; });
  h.stats = { att: 4, def: 4, sp: 3, kn: 3 }; h.skills = []; h.talents = []; h.equip = {}; h.machines = []; new Function('h', setup)(h);
  window.__B = createBattle(st, h, t); __B.active = __B.units.find(u => u.side === 0); return true;
}, [army, garrison, setup]);

test('dane: każda umiejętność ma dwie specjalizacje z opisem, identyfikatory są unikalne', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const bad = [], ids = new Set();
    for (const id of Object.keys(SKILLS)) { const F = SKILL_FORKS[id]; if (!F || F.length !== 2) { bad.push(`${id}: brak dwóch`); continue; }
      for (const f of F) { if (!f.id || !f.name || !f.desc || ids.has(f.id)) bad.push(`${id}.${f.id}`); ids.add(f.id); if (FORK[f.id].skill !== id) bad.push(`${f.id}: skill`); }
      if (!F.some(f => f.id === aiPickFork(id))) bad.push(`${id}: wybór SI`);
      for (let L = 1; L <= 3; L++) if (!SKILLS[id].desc(SKILLS[id].v[L - 1])) bad.push(`${id}: opis ${L}`); }
    return { bad, n: Object.keys(SKILLS).length, forks: ids.size };
  });
  assert.deepEqual(r.bad, []); assert.ok(r.n >= 41, `umiejętności: ${r.n}`); assert.equal(r.forks, r.n * 2);
});

test('awans: karta umiejętności, potem wybór specjalizacji; komputer wybiera sam', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); h.skills = [{ id: 'offense', lv: 3 }]; G.modal = null;
    gainExp(st, h, expForLevel(h.level + 1) - h.exp); if (/wolny punkt/.test(G.modal.msg)) G.modal.buttons[0].action(); // poziom 2: najpierw punkt cechy
    const first = { choice: !!(G.modal && G.modal.choice), cards: G.modal ? G.modal.buttons.length : 0 }; G.modal.buttons[0].action();
    const fork = G.modal ? G.modal.buttons.map(b => b.label) : []; if (G.modal && G.modal.choice && fork.includes('Kontra')) G.modal.buttons.find(b => b.label === 'Kontra').action();
    while (G.modal) G.modal.buttons[0].action(); // ewentualny talent
    const foe = { owner: 1, skills: [{ id: 'archery', lv: 2 }], stats: { att: 1, def: 1, sp: 1, kn: 1 }, equip: {}, talents: [], mana: 0 }; // bohater komputera
    for (let k = 0; k < 6 && heroSkill(foe, 'archery') < 3; k++) { learnSkill(foe, 'archery'); const pf = pendingFork(foe); if (pf) chooseFork(foe, pf.id, aiPickFork(pf.id)); }
    return { first, fork, chosen: h.skills.find(s => s.id === 'offense').fork, ai: foe.skills.find(s => s.id === 'archery').fork };
  });
  assert.equal(r.first.choice, true, 'okno z kartami'); assert.ok(r.first.cards >= 2);
  assert.deepEqual(r.fork, ['Przełamanie', 'Kontra']); assert.equal(r.chosen, 'riposte'); assert.equal(r.ai, 'sniper');
});

test('bitwa: Przełamanie, Kontra, Szyk, Fortyfikacja, Dobijanie, Kolce i Kwatermistrz', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const est = async setup => { await battle([['swordsman', 20], ['archer', 20]], [['swordsman', 20], ['pikeman', 20]], setup);
    return page.evaluate(() => { const B = __B, a = B.units.find(u => u.side === 0 && u.cid === 'swordsman'), t = B.units.find(u => u.side === 1 && u.cid === 'swordsman'), e = estimateStrike(B, a, t, false);
      B.retalNow = true; const r = estimateStrike(B, t, a, false); B.retalNow = false; const ar = B.units.find(u => u.side === 0 && u.cid === 'archer');
      t.n = 8; const low = estimateStrike(B, a, t, false); return { hit: (e.min + e.max) / 2, back: (r.min + r.max) / 2, low: (low.min + low.max) / 2, shots: ar.shots }; }); };
  const base = await est(''), breach = await est("h.skills = [{ id: 'offense', lv: 3, fork: 'breach' }];"), offense = await est("h.skills = [{ id: 'offense', lv: 3 }];");
  assert.ok(breach.hit > offense.hit, `Przełamanie: ${offense.hit} → ${breach.hit}`);
  const exe = await est("h.skills = [{ id: 'executioner', lv: 3 }];"); assert.ok(exe.low > base.low * 1.3, `Dobijanie: ${base.low} → ${exe.low}`);
  const qm = await est("h.skills = [{ id: 'quartermaster', lv: 3 }];"); assert.equal(qm.shots, base.shots * 2, 'Kwatermistrz: dwa razy więcej strzał');
  const r = await page.evaluate(() => {
    const B = __B, st = G.state, h = B.h, a = B.units.find(u => u.side === 0 && u.cid === 'swordsman'), t = B.units.find(u => u.side === 1 && u.cid === 'swordsman');
    h.skills = [{ id: 'formation', lv: 3 }]; const nearAlly = besideAlly(B, a), d1 = defPerks(B, a);
    h.skills = [{ id: 'armorer', lv: 3, fork: 'spikes' }]; B.active = t; const hp0 = (a.n - 1) * 1e9; const n0 = a.n, tn0 = t.n; strike(B, t, a, false);
    return { nearAlly, d1, spiked: t.n < tn0 || t.hp < CREATURES[t.cid].hp, fort: (() => { const D = B.sides[1]; return D.hero ? 'hero' : 'none'; })() };
  });
  assert.equal(r.d1, r.nearAlly ? 3 : 0, 'Szyk: +3 obrony obok sojusznika'); assert.equal(r.spiked, true, 'Kolce ranią napastnika');
});

test('czary: Krwawa magia, Echo, Mag wojny, Zagłuszanie, Wyciszenie, Żniwo dusz', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 40], ['archer', 20]], [['pikeman', 60]], "h.book = true; h.spells = ['magicArrow']; h.mana = 0; h.skills = [{ id: 'bloodMagic', lv: 3 }, { id: 'echo', lv: 3 }, { id: 'soulHarvest', lv: 3 }];");
  const r = await page.evaluate(() => {
    const B = __B, h = B.h, foe = B.units.find(u => u.side === 1), mine = B.units.find(u => u.side === 0 && u.cid === 'pikeman'), hp = u => (u.n - 1) * CREATURES[u.cid].hp + u.hp;
    const can = castAffordable(B, 0, h, 'magicArrow'), mine0 = hp(mine); B.rng = () => 0; // echo zawsze
    const f0 = hp(foe); castBattle(B, 'magicArrow', foe.x, foe.y);
    const blood = mine0 - hp(mine), echoLog = B.log.some(l => l.startsWith('Echo:'));
    h.skills.push({ id: 'wisdom', lv: 3, fork: 'warMage' }); B.cast[0] = false; B.casts[0] = 0; B.freeCast = null; const free = battleCost(B, 0, h, 'magicArrow');
    const o = { name: 'Wróg', skills: [{ id: 'interference', lv: 3, fork: 'jamming' }], stats: { att: 0, def: 0, sp: 0, kn: 0 }, equip: {}, talents: [] }; B.sides[1].hero = o; B.freeCast = [true, true];
    const jam = battleCost(B, 0, h, 'magicArrow'); o.skills[0].fork = 'silence'; B.round = 1; const silent = !canCastNow(B); B.round = 2; const loud = canCastNow(B);
    B.sides[1].hero = null; h.mana = 0; foe.n = 1; foe.hp = 1; h.mana = 5; castBattle(B, 'magicArrow', foe.x, foe.y);
    return { can, blood, hurt: hp(foe) < f0, echoLog, free, jam, base: spellCost(h, 'magicArrow'), silent, loud, harvest: B.log.some(l => l.startsWith('Żniwo dusz')) };
  });
  assert.equal(r.can, true, 'brak many – Krwawa magia pozwala rzucić'); assert.ok(r.blood > 0, 'oddział zapłacił życiem'); assert.equal(r.echoLog, true, 'Echo powtórzyło czar');
  assert.equal(r.free, 0, 'Mag wojny: pierwszy czar darmo'); assert.equal(r.jam, Math.round(r.base * 1.5), 'Zagłuszanie wroga'); assert.equal(r.silent, true); assert.equal(r.loud, true);
  assert.equal(r.harvest, true, 'Żniwo dusz po zniszczeniu oddziału');
});

test('początek bitwy: Alchemia, Inicjatywa, Szpiegostwo, Poskramiacz; łupy: Kontrybucja', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20]], [['pikeman', 20]], "h.skills = [{ id: 'alchemy', lv: 3 }, { id: 'tactics', lv: 3, fork: 'initiative' }];");
  const a = await page.evaluate(() => { const B = __B, u = B.units.find(u => u.side === 0), e = B.units.find(u => u.side === 1); return { buffs: Object.keys(u.buffs).length, slow: e.slowV, spd: unitSpd(e), base: CREATURES[e.cid].spd }; });
  assert.equal(a.buffs, 1, 'jeden eliksir'); assert.equal(a.slow, -3); assert.equal(a.spd, a.base - 3);
  const t = await page.evaluate(() => {
    const st = G.state, h = hero(st); h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 30 }; h.skills = [{ id: 'beastTamer', lv: 3 }, { id: 'plunder', lv: 3, fork: 'tribute' }];
    const m = { type: 'monster', cid: 'wolf', count: 30, x: h.x, y: h.y, id: 777 }; const B = createBattle(st, h, m);
    const tamed = B.units.filter(u => u.side === 0 && u.src === 'tamed').reduce((s, u) => s + u.n, 0), left = B.units.filter(u => u.side === 1).reduce((s, u) => s + u.n, 0);
    const P = st.players[h.owner], rare = PATH_RARE.reduce((s, r) => s + P.resources[r], 0); simulateBattle(B); const sp = B.over === 'win' ? victorySpoils(B, 0) : {}; writeBackSide(B, 0);
    return { tamed, left, tribute: sp.tribute ? PATH_RARE.reduce((s, r) => s + P.resources[r], 0) - rare : -1, inArmy: h.army.some(s => s && s.cid === 'wolf') };
  });
  assert.ok(t.tamed >= 1 && t.tamed + t.left === 30, `poskromione ${t.tamed}, zostało ${t.left}`); // 30% najsłabszego z kilku oddziałów stada assert.equal(t.tribute, 1, 'Kontrybucja: rzadki surowiec'); assert.equal(t.inArmy, false, 'bez Przewodnika stada odchodzą');
});

test('mapa: Konni gońcy, Daleki wzrok, Zaopatrzenie, Ambasador, Zastraszenie, Wywiad', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 50 }; h.army[1] = { cid: 'griffin', n: 5 }; h.skills = [];
    const mp0 = heroMaxMP(h), sight0 = heroSight(h); h.skills = [{ id: 'logistics', lv: 3, fork: 'couriers' }, { id: 'scouting', lv: 3, fork: 'farsight' }];
    const mp1 = heroMaxMP(h) / (1 + skillVal(h, 'logistics') / 100), sight1 = heroSight(h) - skillVal(h, 'scouting');
    h.skills = [{ id: 'logistics', lv: 3, fork: 'supply' }]; h.mp = 400; advanceDay(st); const carried = h.mp - heroMaxMP(h);
    const m = { type: 'monster', cid: 'wolf', count: 6, mood: 'savage' }; h.skills = []; const before = neutralReaction(st, h, m); h.skills = [{ id: 'diplomacy', lv: 3, fork: 'intimidate' }]; const after = neutralReaction(st, h, m);
    h.skills = [{ id: 'scouting', lv: 3, fork: 'intel' }]; const q = qtyFor(st, 37);
    return { faster: mp1 > mp0, sight: sight1 - sight0, carried, before: before && before.kind, after: after && after.kind, q };
  });
  assert.equal(r.faster, true, 'Konni gońcy: ruch wg najszybszego'); assert.equal(r.sight, 3); assert.equal(r.carried, 200, 'Zaopatrzenie: połowa z 400');
  assert.notEqual(r.before, 'flee'); assert.equal(r.after, 'flee', 'Zastraszenie: dzikie też uciekają'); assert.equal(r.q, '37');
});

test('ekran bohatera: zaległa specjalizacja świeci i otwiera wybór', async () => {
  await newGame(page);
  await page.evaluate(() => { const h = hero(G.state); h.skills = [{ id: 'earthMagic', lv: 3 }]; setScreen('hero', {}); });
  await frames(page, 3);
  const r = await page.evaluate(() => { const S = G.screens.hero, rc = S.skillRect(0); S.onClick(rc.x + 5, rc.y + 5); const labels = G.modal ? G.modal.buttons.map(b => b.label) : [];
    G.modal.buttons[1].action(); return { labels, fork: hero(G.state).skills[0].fork, info: S.rightInfo(rc.x + 5, rc.y + 5) }; });
  assert.deepEqual(r.labels, ['Trzęsienie', 'Bastion']); assert.equal(r.fork, 'bastion'); assert.match(r.info, /Bastion/);
  await frames(page, 2);
});
