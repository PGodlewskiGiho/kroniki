// Artefakty i relikwie: składanie z kompletu części, zablokowane miejsca, rozkładanie, komputer, dochód. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('artefakty: dużo nowych, relikwie nie leżą na mapie, każda część ma pasujące miejsce', async () => {
  const r = await page.evaluate(() => ({
    n: Object.keys(ARTIFACTS).length, relics: RELICS.length,
    onMap: ['treasure', 'minor', 'major', 'relic'].some(rar => ARTS_BY_RARITY(rar).some(id => ARTIFACTS[id].parts || id === 'grail')),
    parts: RELICS.every(r => ARTIFACTS[r].parts.every(p => ARTIFACTS[p] && EQUIP_SLOTS.some(s => s.kind === ARTIFACTS[p].kind)) && ARTIFACTS[r].parts.some(p => ARTIFACTS[p].kind === ARTIFACTS[r].kind)),
  }));
  assert.ok(r.n >= 60, `artefaktów: ${r.n}`); assert.ok(r.relics >= 5); assert.ok(!r.onMap); assert.ok(r.parts);
});

test('relikwia: komplet części składa się w jedną, blokuje miejsca, daje premię; rozkłada się z powrotem', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const h = hero(G.state); h.equip = emptyEquip(); h.bag = []; h.locked = {};
    for (const p of ARTIFACTS.dragonLordArmor.parts) giveArtifact(h, p);
    const before = heroStat(h, 'att'), can = assemblable(h).includes('dragonLordArmor');
    assembleRelic(h, 'dragonLordArmor');
    const locked = Object.keys(h.locked).sort(), onTorso = h.equip.torso, att = heroStat(h, 'att');
    giveArtifact(h, 'thunderHammer'); const hammerInBag = h.bag.includes('thunderHammer'); // broń zablokowana: młot do plecaka
    const err = equipFromBag(h, h.bag.indexOf('thunderHammer'));
    disassembleRelic(h, 'torso');
    const back = ARTIFACTS.dragonLordArmor.parts.every(p => Object.values(h.equip).includes(p)), free = Object.keys(h.locked).length;
    // relikwia z plecaka: zakłada się i przesuwa zajęte miejsca do plecaka
    h.equip = emptyEquip(); h.locked = {}; h.bag = ['dragonLordArmor']; h.equip.weapon = 'noviceSword';
    equipFromBag(h, 0); const fromBag = h.equip.torso === 'dragonLordArmor' && h.bag.includes('noviceSword') && h.locked.weapon === 'dragonLordArmor';
    unequip(h, 'torso'); const unlocked = !Object.keys(h.locked).length && h.bag.includes('dragonLordArmor');
    return { can, locked, onTorso, gain: att - before, hammerInBag, err: !!err, back, free, fromBag, unlocked };
  });
  assert.ok(r.can); assert.equal(r.onTorso, 'dragonLordArmor'); assert.deepEqual(r.locked, ['head', 'shield', 'weapon']);
  assert.ok(r.gain > 0, 'relikwia silniejsza od sumy części'); assert.ok(r.hammerInBag); assert.ok(r.err, 'nie da się założyć na zablokowane miejsce');
  assert.ok(r.back); assert.equal(r.free, 0); assert.ok(r.fromBag); assert.ok(r.unlocked);
});

test('relikwie: komputer składa sam, kupiecka daje surowce, pokonany traci relikwię, ekran bohatera pokazuje przycisk', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, ai = st.heroes.find(x => x.owner !== ME), h = hero(st);
    ai.equip = emptyEquip(); ai.bag = []; ai.locked = {};
    for (const p of ARTIFACTS.merchantPrince.parts) giveArtifact(ai, p);
    const aiDone = Object.values(ai.equip).includes('merchantPrince');
    const inc = dailyIncomeAll(st, ai.owner);
    lootHero(h, ai); const looted = h.bag.includes('merchantPrince') && !Object.keys(ai.locked).length;
    h.equip = emptyEquip(); h.bag = []; h.locked = {}; for (const p of ARTIFACTS.stormWalker.parts) giveArtifact(h, p);
    const human = !Object.values(h.equip).includes('stormWalker') && assemblable(h).includes('stormWalker'); // człowiek składa sam, na ekranie bohatera
    setScreen('hero', { heroId: st.selHero });
    return { aiDone, crystal: inc.crystal, looted, human };
  });
  await frames(page, 5);
  assert.ok(r.aiDone); assert.ok(r.crystal >= 1); assert.ok(r.looted); assert.ok(r.human);
  await page.evaluate(() => G.screens.hero.onClick(RELIC_BTN.x + 5, RELIC_BTN.y + 5)); await frames(page, 3);
  const ok = await page.evaluate(() => { G.modal.buttons[0].action(); G.modal = null; return Object.values(hero(G.state).equip).includes('stormWalker'); });
  assert.ok(ok, 'przycisk „Złóż relikwię” składa ją');
});

test('nowe artefakty: komplet Lodowego Króla składa się w relikwię, każdy ma obrazek 3D; karta artefaktu na ekranie bohatera', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); h.equip = emptyEquip(); h.bag = []; h.locked = {};
    for (const p of ARTIFACTS.frostKing.parts) giveArtifact(h, p);
    const can = assemblable(h).includes('frostKing'); assembleRelic(h, 'frostKing');
    const ids = ['pilgrimStaff', 'wolfPelt', 'minerCharm', 'hawkHelm', 'serpentRing', 'assassinDagger', 'fortuneCoin', 'siphonOrb', 'envoyBanner', 'kingsMantle', 'sunAmulet', 'frostBrand', 'frostCrown', 'frostMail', 'frostKing'];
    setScreen('hero', { heroId: st.heroes.indexOf(h) }); G.screens.hero.draw(G.ctx); const torso = EQUIP_SLOTS.find(s => s.id === 'torso');
    const card = G.screens.hero.rightCard(torso.x + 10, torso.y + 10); drawPopup(G.ctx, Object.assign(card, { x: 40, y: 40 }));
    for (const id of ids) drawArtCard(G.ctx, { artCard: id, h, x: 40, y: 40 });
    return { can, torso: h.equip.torso, card: card.artCard, art3d: ids.filter(id => !ARTIFACT_ART.f[id]), perks: ids.filter(id => ARTIFACTS[id].perk && !TALENTS[ARTIFACTS[id].perk]) };
  });
  assert.equal(r.can, true); assert.equal(r.torso, 'frostKing'); assert.equal(r.card, 'frostKing');
  assert.deepEqual(r.art3d, [], 'nowe artefakty mają wypalone obrazki 3D'); assert.deepEqual(r.perks, []);
});
