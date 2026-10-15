// Etap 6 rozwoju bohatera: planer rozwoju (zakładki, cel), ołtarz przemiany, księga rozkazów z kartami, budowa bohatera na karcie mapy.
// Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('planer: przycisk Rozwój na ekranie bohatera, trzy zakładki, klik w splot wyznacza cel, drugi klik go zdejmuje', async () => {
  await newGame(page);
  await page.evaluate(() => { const h = hero(G.state); h.skills = [{ id: 'leadership', lv: 2 }]; setScreen('hero', {}); G.screens.hero.buttons.find(b => b.label === 'Rozwój').action(); });
  await frames(page, 2);
  const r = await page.evaluate(() => {
    const M = G.modal, h = hero(G.state), out = { open: !!(M && M.planner), tab: M.planner.tab };
    M.buttons.find(b => b.label === 'Sploty').action(); G.screen.draw(G.ctx); M.draw(G.ctx); out.tab2 = M.planner.tab;
    // wiersz Świętego zastępu: znajdź go po podpowiedzi
    let hit = null; for (let y = 120; y < 480 && !hit; y += 6) for (const x of [120, 500]) { const t = M.rightInfo(x, y); if (t && t.startsWith('Święty zastęp')) { hit = [x, y]; break; } }
    M.onClick(...hit); out.goal = h.goal; out.miss = goalSkills(h); M.onClick(...hit); out.cleared = h.goal;
    M.buttons.find(b => b.label === 'Klasy prestiżowe').action(); M.draw(G.ctx); out.tab3 = M.planner.tab;
    return out;
  });
  assert.equal(r.open, true); assert.equal(r.tab, 'progress'); assert.equal(r.tab2, 'syn'); assert.equal(r.tab3, 'pre');
  assert.equal(r.goal, 'syn:holyHost'); assert.deepEqual(r.miss, ['waterMagic'], 'Przywództwo już zaawansowane'); assert.equal(r.cleared, null);
});

test('cel rozwoju: umiejętność do celu zawsze w ofercie awansu, z gwiazdką', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); h.skills = [{ id: 'leadership', lv: 1 }]; h.goal = 'pre:stormhunter'; let ok = 0;
    for (let L = 2; L < 30; L++) if (skillOffer(st, h, L).some(id => ['archery', 'airMagic'].includes(id))) ok++;
    const opt = skillChoiceOpt(h, 'archery', 0, () => {}); return { ok, sub: opt.sub, tip: opt.tip };
  });
  assert.equal(r.ok, 28); assert.match(r.sub, /^★ /); assert.match(r.tip, /Prowadzi do celu: klasa Łowca burz/);
});

test('ołtarz przemiany: tylko w mieście z gildią; specjalizacje, punkty i umiejętność od nowa za złoto', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns.find(t => t.owner === h.owner), R = playerOf(st, h.owner).resources;
    h.skills = [{ id: 'offense', lv: 3, fork: SKILL_FORKS.offense[0].id }, { id: 'archery', lv: 2 }]; h.freePts = 2; spendPoint(h, 'att'); spendPoint(h, 'att'); const att = h.stats.att;
    h.x = 0; h.y = 0; const away = altar(st, h, 'forks'); t.built = ['hall1', 'guild1']; h.x = t.x; h.y = t.y; R.gold = 7000; const poor = altar(st, h, 'forks'); R.gold = 50000;
    const e1 = altar(st, h, 'forks'), pend = pendingFork(h) && pendingFork(h).id, g1 = R.gold;
    const e2 = altar(st, h, 'points'), back = [att - h.stats.att, h.freePts], g2 = R.gold;
    const e3 = altar(st, h, 'skill', 'archery'), relearnN = h.relearn, g3 = R.gold;
    return { away, e1, pend, e2, back, e3, relearnN, skills: h.skills.map(s => s.id), poor, paid: [50000 - g1, g1 - g2, g2 - g3] };
  });
  assert.match(r.away, /gildii magów/); assert.equal(r.e1, null); assert.equal(r.pend, 'offense'); assert.equal(r.e2, null); assert.deepEqual(r.back, [2, 2]);
  assert.equal(r.e3, null); assert.equal(r.relearnN, 2); assert.deepEqual(r.skills, ['offense']); assert.deepEqual(r.paid, [7500, 5000, 10000]); assert.match(r.poor, /kosztuje 7500 złota/);
  // ekran bohatera: wolne pole umiejętności świeci, klik daje wybór, wybór zmniejsza dług
  await page.evaluate(() => setScreen('hero', {})); await frames(page, 2);
  await page.evaluate(() => { const S = G.screens.hero, r = S.skillRect(1); S.onClick(r.x + 20, r.y + 20); });
  const d = await dialog(page); assert.match(d.msg, /w miejsce zapomnianej \(zostało 2\)/); await pressDialog(page, d.labels[0]);
  assert.equal(await page.evaluate(() => hero(G.state).relearn), 1);
  // okno ołtarza z planera
  const labels = await page.evaluate(() => { showDevPlanner(hero(G.state)); G.modal.buttons.find(b => b.label === 'Ołtarz przemiany').action(); return G.modal.buttons.map(b => b.label); });
  assert.deepEqual(labels, ['Nowe specjalizacje', 'Punkty cech od nowa', 'Zapomnij umiejętność', 'Anuluj']);
});

test('księga rozkazów: karty z ikonami, niedostępne przygaszone, zdolności artefaktów i klasy opisane', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1], h = hero(st); t.built = ['hall1']; t.garrison = emptyArmy(); t.garrison[0] = { cid: 'pikeman', n: 20 };
    h.skills = [{ id: 'tactics', lv: 1 }]; h.mastery = 'warden'; h.level = 10; h.equip = emptyEquip(); giveArtifact(h, 'thunderRod');
    const B = createBattle(st, h, t); B.active = B.units.find(u => u.side === 0); setScreen('battle', { battle: B }); const S = G.screens.battle; S.phase = 'input'; S.startTurnFor && S.startTurnFor(B.active);
    B.valor[0] = 3; S.openOrders(); const M = G.modal, card = l => M.buttons.find(b => b.label === l);
    M.draw(G.ctx); return { choice: !!M.choice, charge: card('Szarża').disabled, rod: card('Grom z różdżki').disabled, hold: card('Nie przejdą!').disabled, cancel: !!card('Anuluj') };
  });
  assert.deepEqual(r, { choice: true, charge: true, rod: false, hold: false, cancel: true });
});

test('karta bohatera na mapie: budowa (klasa prestiżowa, specjalizacje, sploty, artefakty) także u wroga', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, ai = st.heroes.find(x => x.owner !== ME); ai.skills = [{ id: 'offense', lv: 3, fork: SKILL_FORKS.offense[0].id }, { id: 'wisdom', lv: 2 }, { id: 'tactics', lv: 2 }, { id: 'fireMagic', lv: 2 }];
    ai.mastery = 'runeblade'; ai.equip = emptyEquip(); giveArtifact(ai, 'warHorn'); drawPopup(G.ctx, { mapHero: ai, x: 100, y: 300 });
    return { sum: buildSummary(ai), info: foeHeroInfo(st, ai) };
  });
  assert.match(r.sum, /^klasa: Ostrze run · specjalizacje: Przełamanie · sploty: Płonąca szarża, Polowe dowództwo · artefakty: Róg Wojenny$/); assert.match(r.info, /Klasa: Ostrze run/);
});
