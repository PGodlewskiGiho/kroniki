// Szkoły magii (Ognia, Powietrza, Wody, Ziemi) i nowe czary: tarcze, fortuna, klątwa, lodowy pocisk, pierścień mrozu,
// łańcuch piorunów, ognista tarcza, źródło życia, przywołanie łodzi. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const battle = (army, garrison) => page.evaluate(([army, garrison]) => {
  const st = G.state, t = st.towns[1], h = hero(st);
  t.built = ['hall1']; t.garrison = emptyArmy(); garrison.forEach(([cid, n], i) => { t.garrison[i] = { cid, n }; });
  h.army = emptyArmy(); army.forEach(([cid, n], i) => { h.army[i] = { cid, n }; });
  h.mana = 999; h.stats.sp = 2; h.skills = []; window.__B = createBattle(st, h, t); __B.rng = () => 0.5; __B.obst.clear(); __B.active = __B.units.find(u => u.side === 0); return true;
}, [army, garrison]);

test('każdy czar ma szkołę, ikonę i efekt; w każdej szkole są czary od 1. do 5. poziomu', async () => {
  const r = await page.evaluate(() => {
    const bad = [], levels = {};
    for (const [id, S] of Object.entries(SPELLS)) {
      if (!SCHOOLS[S.school]) bad.push(`${id}: szkoła`); if (S.kind === 'battle' && !SPELL_FX[id]) bad.push(`${id}: efekt`);
      const c = spriteCanvasOf(id); if (!c) bad.push(`${id}: ikona`);
      (levels[S.school] = levels[S.school] || new Set()).add(S.level);
    }
    return { bad, levels: Object.fromEntries(Object.entries(levels).map(([k, v]) => [k, [...v].sort()])), skills: Object.values(SCHOOLS).every(s => SKILLS[s.skill] && MAGIC_SKILLS.includes(s.skill)) };
    function spriteCanvasOf(id) { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.translate(16, 16); drawSpellIcon(g, id);
      const d = g.getImageData(0, 0, 32, 32).data; let lit = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] && (d[i] + d[i + 1] + d[i + 2]) > 200) lit++; return lit > 12; }
  });
  assert.deepEqual(r.bad, []); assert.ok(r.skills);
  for (const s of ['fire', 'air', 'water', 'earth']) assert.deepEqual(r.levels[s], [1, 2, 3, 4, 5], s);
});

test('umiejętność szkoły: tańszy i mocniejszy czar, dłuższe działanie, ekspert rzuca czar na całą armię', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20], ['archer', 20], ['griffin', 5]], [['swordsman', 30], ['monk', 30]]);
  const r = await page.evaluate(() => {
    const B = __B, h = hero(G.state), foe = B.units.find(u => u.side === 1), pike = B.units.find(u => u.cid === 'pikeman');
    const cost = lv => { h.skills = lv ? [{ id: 'airMagic', lv }] : []; return spellCost(h, 'lightningBolt'); };
    const dmg = lv => { h.skills = lv ? [{ id: 'airMagic', lv }] : []; return spellDamage(h, SPELLS.lightningBolt, 2); };
    const costs = [0, 1, 2, 3].map(cost), dmgs = [0, 3].map(dmg);
    h.skills = [{ id: 'earthMagic', lv: 2 }]; castBattle(B, 'stoneSkin', pike.x, pike.y); B.cast[0] = false; const rounds = pike.buffs.stoneSkin, others = B.units.filter(u => u.side === 0 && u.buffs.stoneSkin).length;
    h.skills = [{ id: 'earthMagic', lv: 3 }]; const area = spellArea('slow', foe.x, foe.y, B).length; const mana0 = h.mana; castBattle(B, 'slow', foe.x, foe.y);
    return { costs, dmgs, rounds, others, slowed: B.units.filter(u => u.side === 1 && u.buffs.slow).length, foes: B.units.filter(u => u.side === 1).length, area, paid: mana0 - h.mana };
  });
  assert.deepEqual(r.costs, [10, 9, 8, 7]);
  assert.equal(r.dmgs[1], Math.floor(r.dmgs[0] * 1.3));
  assert.equal(r.rounds, 3 + 2, 'moc 2 → 3 rundy, zaawansowana szkoła +2'); assert.equal(r.others, 1, 'bez eksperta jeden oddział');
  assert.equal(r.slowed, r.foes, 'ekspert: spowolnienie na całą armię wroga'); assert.equal(r.area, r.foes); assert.equal(r.paid, 4);
});

test('tarcze, fortuna, klątwa i ognista tarcza zmieniają walkę', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['swordsman', 20], ['archer', 20]], [['swordsman', 20]]);
  const r = await page.evaluate(() => {
    const B = __B, sw = B.units.find(u => u.side === 0 && u.cid === 'swordsman'), ar = B.units.find(u => u.cid === 'archer'), foe = B.units.find(u => u.side === 1);
    const melee = () => damageRoll(B, foe, sw, false), shot = () => damageRoll(B, ar, foe, true);
    const m0 = melee(); sw.buffs.shield = 2; const m1 = melee();
    foe.x = ar.x + 3; foe.y = ar.y; const s0 = shot(); foe.buffs.airShield = 2; const s1 = shot(); delete foe.buffs.airShield;
    B.rng = () => 0.99; const hi = damageRoll(B, foe, ar, false); foe.buffs.curse = 2; const lo = damageRoll(B, foe, ar, false); delete foe.buffs.curse;
    const l0 = unitLuck(B, ar); ar.buffs.fortune = 1; const l1 = unitLuck(B, ar);
    B.rng = () => 0.5; delete sw.buffs.shield; sw.buffs.fireShield = 2; const n0 = foe.n, hp0 = (foe.n - 1) * CREATURES[foe.cid].hp + foe.hp; strike(B, foe, sw, false);
    return { m: m1 / m0, s: s1 / s0, curse: lo < hi, luck: l1 - l0, burned: (foe.n - 1) * CREATURES[foe.cid].hp + foe.hp < hp0 };
  });
  assert.ok(Math.abs(r.m - 0.7) < 0.03, `tarcza ${r.m}`); assert.ok(Math.abs(r.s - 0.7) < 0.03, `tarcza powietrza ${r.s}`);
  assert.ok(r.curse); assert.equal(r.luck, 2); assert.ok(r.burned, 'ognista tarcza parzy napastnika');
});

test('łańcuch piorunów skacze za połowę, pierścień mrozu oszczędza środek, źródło życia leczy, fala śmierci omija nieumarłych', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20], ['archer', 20]], [['swordsman', 30], ['monk', 30], ['pikeman', 30]]);
  const r = await page.evaluate(() => {
    const B = __B, h = hero(G.state), foe = B.units.filter(u => u.side === 1), hp = u => (u.n - 1) * CREATURES[u.cid].hp + u.hp;
    const area = spellArea('chainLightning', foe[0].x, foe[0].y, B), before = B.units.map(hp);
    castBattle(B, 'chainLightning', foe[0].x, foe[0].y); B.cast[0] = false;
    const lost = area.map(([x, y]) => { const i = B.units.findIndex(u => u.x === x && u.y === y); return before[i] - hp(B.units[i]); });
    // pierścień mrozu wokół wroga: on sam cały, sąsiad na polu obok ranny
    const c = foe[1], nb = hexNeighbors(c.x, c.y).find(([x, y]) => !unitAt(B, x, y)); const pk = B.units.find(u => u.side === 0 && u.cid === 'pikeman'); pk.x = nb[0]; pk.y = nb[1];
    const c0 = hp(c), p0 = hp(pk); castBattle(B, 'frostRing', c.x, c.y); B.cast[0] = false;
    const ring = { center: hp(c) === c0, near: hp(pk) < p0 };
    for (const u of B.units.filter(u => u.side === 0)) { u.hp = 1; u.buffs.slow = 3; } castBattle(B, 'massCure', 0, 0);
    const bone = B.units.find(u => u.side === 1 && !u.dead); bone.cid = 'skeleton'; const spared = !spellArea('deathRipple', 0, 0, B).some(([x, y]) => x === bone.x && y === bone.y);
    return { spared, jumps: area.length, lost, ring, cured: B.units.filter(u => u.side === 0 && !u.dead).every(u => u.hp > 1 && !u.buffs.slow) };
  });
  assert.equal(r.jumps, 4); assert.ok(r.lost[0] > 0 && r.lost[1] > 0, JSON.stringify(r.lost));
  assert.ok(r.lost[1] <= Math.ceil(r.lost[0] / 2) + 1, 'przeskok za połowę');
  assert.deepEqual(r.ring, { center: true, near: true }); assert.ok(r.cured); assert.ok(r.spared, 'fala śmierci omija nieumarłych');
  await page.evaluate(() => { setScreen('battle', { battle: __B }); G.modal = null; __B.fx = []; castBattle(__B, 'chainLightning', __B.units.find(u => u.side === 1 && !u.dead).x, __B.units.find(u => u.side === 1 && !u.dead).y); });
  await frames(page, 30);
});

test('przywołanie łodzi na brzegu; księga czarów pokazuje szkołę i koszt po zniżce', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n, T = st.map.terrain;
    let spot = null; for (let i = 0; i < n * n && !spot; i++) { const x = i % n, y = (i / n) | 0; if (T[i] !== TER.WATER && !st.objAt[i] && !heroAt(st, x, y) && !st.map.obst[i] && x > 1 && y > 1 && x < n - 2 && y < n - 2 && [...Array(8).keys()].some(d => T[(y + DY8[d]) * n + x + DX8[d]] === TER.WATER)) spot = [x, y]; }
    h.x = spot[0]; h.y = spot[1]; h.mana = 50; h.spells = ['summonBoat', 'lightningBolt']; h.skills = [{ id: 'waterMagic', lv: 1 }];
    const boats0 = st.objects.filter(o => o.type === 'boat').length, err = castAdventure(st, h, 'summonBoat'), boats1 = st.objects.filter(o => o.type === 'boat').length;
    h.skills = [{ id: "airMagic", lv: 2 }]; showSpellbook(h, "view"); const tip = G.modal.rightInfo(140, 180); G.modal = null;
    return { err, added: boats1 - boats0, mana: h.mana, tip };
  });
  assert.equal(r.err, null); assert.equal(r.added, 1); assert.equal(r.mana, 50 - 6);
  assert.match(r.tip, /magia (Wody|Powietrza)/);
});

test('gildie frakcji: różny najwyższy poziom i różne szkoły magii (Inferno ogień, Kurhan ziemia)', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns.find(t => t.owner === ME), out = {};
    for (const fac of ['haven', 'stronghold', 'sylvan']) {
      t.faction = fac; t.built = ['hall1', 'hall2', 'hall3', 'tavern', 'guild1', 'guild2', 'guild3'];
      out[fac] = { list: buildList(t).map(x => x.B.id).filter(id => /^guild/.test(id)), max: guildMax(fac) };
    }
    const share = (fac, sc) => { let n = 0, k = 0; for (let i = 0; i < 300; i++) { const tt = { id: i, faction: fac, built: [] }; for (const L of [1, 2, 3]) { rollGuildLevel(st, tt, L); for (const id of tt.guild[L]) { k++; if (SPELLS[id].school === sc) n++; } } } return n / k; };
    out.fire = [share('inferno', 'fire'), share('haven', 'fire')]; out.earth = [share('barrow', 'earth'), share('stronghold', 'earth')];
    t.faction = 'haven'; t.built = ['hall1', 'tavern', 'guild1', 'guild2', 'guild3', 'guild4']; showGuildView(st, t, G.screens.town); G.modal.draw(G.ctx); G.modal = null;
    out.text = magicText('inferno'); out.noDup = (() => { const tt = { id: 3, faction: 'academy', built: [] }; rollGuildLevel(st, tt, 1); return new Set(tt.guild[1]).size === tt.guild[1].length; })();
    return out;
  });
  assert.deepEqual(r.haven.list, ['guild4'], 'Przystań: gildia do IV');
  assert.deepEqual(r.stronghold.list, [], 'Twierdza: gildia do III');
  assert.deepEqual(r.sylvan.list, ['guild4', 'guild5']);
  assert.ok(r.fire[0] > r.fire[1] * 1.8, `ogień: Inferno ${r.fire[0]} vs Przystań ${r.fire[1]}`);
  assert.ok(r.earth[0] > r.earth[1] * 1.3, `ziemia: Kurhan ${r.earth[0]} vs Twierdza ${r.earth[1]}`);
  assert.match(r.text, /poziomu V, najczęściej magia Ognia/); assert.ok(r.noDup);
});
