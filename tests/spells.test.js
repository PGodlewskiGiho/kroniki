// Czary 4. i 5. poziomu, gildie IV–V i księga czarów. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Bitwa bohatera gracza z garnizonem niezależnego miasta bez murów; __B w przeglądarce, ruch ma oddział gracza
const battle = (army, garrison) => page.evaluate(([army, garrison]) => {
  const st = G.state, t = st.towns[1], h = hero(st);
  t.built = ['hall1']; t.garrison = emptyArmy(); garrison.forEach(([cid, n], i) => { t.garrison[i] = { cid, n }; });
  h.army = emptyArmy(); army.forEach(([cid, n], i) => { h.army[i] = { cid, n }; });
  h.mana = 999; h.stats.sp = 2; window.__B = createBattle(st, h, t); __B.active = __B.units.find(u => u.side === 0); return true;
}, [army, garrison]);

test('gildia IV i V: czary 4. i 5. poziomu, bohater je poznaje', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], h = hero(st);
    for (const id of ['tavern', 'hall2', 'hall3', 'guild1', 'guild2', 'guild3', 'guild4', 'guild5']) { if (!hasB(t, id)) t.built.push(id); const g = /^guild(\d)$/.exec(id); if (g) rollGuildLevel(st, t, +g[1]); }
    h.spells = []; const learned = visitGuild(st, t, h);
    return { L: guildLevel(t), n4: t.guild[4].length, n5: t.guild[5].length, lv: learned.map(id => SPELLS[id].level), name: bInfo(BUILD_BY_ID.guild5, t.faction).name };
  });
  assert.equal(r.L, 5);
  assert.equal(r.n4, 2);
  assert.equal(r.n5, 1);
  assert.ok(r.lv.includes(4) && r.lv.includes(5), r.lv.join(','));
  assert.match(r.name, / V$/);
});

test('armagedon rani wszystkich, przyspieszenie armii działa na wszystkich swoich', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 20], ['archer', 20]], [['pikeman', 20], ['archer', 20]]);
  const r = await page.evaluate(() => {
    const B = __B, hp = u => (u.n - 1) * CREATURES[u.cid].hp + u.hp, before = B.units.map(hp);
    const ok = spellTargetOk(B, 'armageddon', null); castBattle(B, 'armageddon', 0, 0);
    const hurt = B.units.map((u, i) => hp(u) < before[i]); B.cast[0] = false;
    castBattle(B, 'massHaste', 0, 0);
    return { ok, hurt: hurt.every(Boolean), haste: B.units.filter(u => u.side === 0).every(u => u.buffs.haste), foeHaste: B.units.some(u => u.side === 1 && u.buffs.haste) };
  });
  assert.deepEqual(r, { ok: true, hurt: true, haste: true, foeHaste: false });
});

test('wskrzeszenie przywraca poległy żywy oddział, nie nieumarły; modlitwa i implozja', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['pikeman', 10], ['boneWarrior', 10]], [['swordsman', 10]]);
  const r = await page.evaluate(() => {
    const B = __B, pike = B.units.find(u => u.cid === 'pikeman'), bone = B.units.find(u => u.cid === 'boneWarrior'), foe = B.units.find(u => u.side === 1);
    for (const u of [pike, bone]) { u.n = 0; u.hp = 0; u.dead = true; }
    const okBone = spellTargetOk(B, 'resurrection', spellUnitAt(B, 'resurrection', bone.x, bone.y)), okPike = spellTargetOk(B, 'resurrection', spellUnitAt(B, 'resurrection', pike.x, pike.y));
    castBattle(B, 'resurrection', pike.x, pike.y); B.cast[0] = false;
    B.active = bone.dead ? pike : bone; const att0 = unitAtt(pike), def0 = unitDef(pike); castBattle(B, 'prayer', pike.x, pike.y); B.cast[0] = false;
    const n0 = foe.n; castBattle(B, 'implosion', foe.x, foe.y);
    return { okBone, okPike, alive: !pike.dead && pike.n > 0, prayer: unitAtt(pike) - att0 + unitDef(pike) - def0, implosion: foe.n < n0 };
  });
  assert.deepEqual(r, { okBone: false, okPike: true, alive: true, prayer: 4, implosion: true });
});

test('SI rzuca deszcz meteorów; księga z wieloma czarami i ekran bitwy bez błędów', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  await battle([['archer', 20]], [['pikeman', 60]]);
  const r = await page.evaluate(() => {
    const B = __B, h = hero(G.state); h.spells = ['meteorShower'];
    const cast = aiHeroCast(B); h.spells = Object.keys(SPELLS); h.mana = 999; B.cast[0] = false;
    setScreen('battle', { battle: B }); showSpellbook(h, 'battle', () => {});
    return { cast };
  });
  await frames(page, 4);
  await page.evaluate(() => { G.modal = null; });
  await frames(page, 30);
  assert.ok(r.cast);
});
