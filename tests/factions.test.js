// Frakcje: kompletność danych, rysunki stworów i miast, bitwa i tura SI z Twierdzą, Infernem i Akademią. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każda frakcja ma komplet danych: siedliska, stwory, bohaterów, grafikę miasta i mury', async () => {
  const bad = await page.evaluate(() => {
    const out = [], groups = ['hall', 'fort', 'guild', 'tavern', 'market', 'smith', 'silo', 'dw1', 'dw2', 'dw3', 'dw4', 'dw5', 'dw6', 'dw7'];
    for (const F of FACTIONS) {
      for (let L = 1; L <= 7; L++) {
        const [, a] = F.dw['dw' + L], [, b] = F.dw['dw' + L + 'u'], A = CREATURES[a], U = CREATURES[b];
        if (!A || !U) { out.push(`${F.id}: brak stwora poziomu ${L}`); continue; }
        if (A.faction !== F.id || U.faction !== F.id) out.push(`${F.id}: ${a}/${b} ma złą frakcję`);
        if (A.level !== L || U.level !== L) out.push(`${F.id}: ${a}/${b} ma zły poziom`);
        if (A.up !== b) out.push(`${F.id}: ${a}.up powinno wskazywać ${b}`);
        if (U.value <= A.value) out.push(`${F.id}: ${b} nie jest lepszy od ${a}`);
      }
      for (const [name, cls] of F.heroes) { if (!HERO_CLASSES[cls] || !CLASS_GROWTH[cls] || !CLASS_SKILLS[cls] || !PORTRAIT_BG[cls]) out.push(`${F.id}: klasa ${cls}`); if (!HERO_LOOKS[name]) out.push(`${F.id}: wygląd ${name}`); }
      if (!TOWN_ART[F.id] || !TOWN_LAYOUTS[F.id] || TOWN_LAYOUTS[F.id].slots.length !== 14) out.push(`${F.id}: scena miasta`);
      for (const g of groups) if (!(BUILD_ART[F.id] || {})[g]) out.push(`${F.id}: brak rysunku ${g}`);
      if (!SIEGE_STONE[F.id] || !SIEGE_PAVE[F.id]) out.push(`${F.id}: mury oblężenia`);
      if (F.emb.some(e => !e)) out.push(`${F.id}: symbole siedlisk`);
    }
    return out;
  });
  assert.deepEqual(bad, []);
});

test('stwory Twierdzy, Inferna i Akademii rysują się w każdej pozie, na mapie i jako zwłoki', async () => {
  const r = await page.evaluate(() => {
    const ids = Object.keys(CREATURES).filter(k => ['fortress', 'inferno', 'academy'].includes(CREATURES[k].faction)), empty = [];
    for (const id of ids) {
      for (const pose of Object.keys(BATTLE_FRAMES)) for (let i = 0; i < BATTLE_FRAMES[pose]; i++) battleSprite(id, i % 2 ? 1 : -1, pose, i);
      corpseSprite(id, 1); const s = creatureSprite(id, 1, 0), d = s.c.getContext('2d').getImageData(0, 0, s.c.width, s.c.height).data;
      let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k]) n++; if (n < 40) empty.push(id);
    }
    return { n: ids.length, empty };
  });
  assert.equal(r.n, 42);
  assert.deepEqual(r.empty, [], 'każdy stwór jest widoczny na mapie');
});

test('miasta Twierdzy, Inferna i Akademii: pusty i w pełni rozbudowany, ekran rysuje się bez błędów', async () => {
  for (const fac of ['fortress', 'inferno', 'academy']) for (const full of [false, true]) {
    await newGame(page, { mapSize: 'M', faction: fac }, 8);
    await page.evaluate(([full]) => { const t = G.state.towns[0]; if (full) t.built = BUILDINGS.map(b => b.id); setScreen('town', { townId: t.id }); }, [full]);
    await frames(page, 12);
    assert.equal(await page.evaluate(() => G.screenName), 'town');
  }
});

test('bitwa Twierdza kontra Inferno kończy się, a SI Inferna rozgrywa turę', async () => {
  await newGame(page, { mapSize: 'M', faction: 'fortress', opponents: 2 }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns[1], army = (fac, lv) => { const F = factionOf(fac), a = emptyArmy(); lv.forEach((d, i) => { a[i] = { cid: F.dw[d][1], n: 12 - i * 2 }; }); return a; };
    h.army = army('fortress', ['dw1u', 'dw2u', 'dw3u', 'dw4u', 'dw5u', 'dw6u', 'dw7u']); t.faction = 'inferno'; t.built = ['hall1', 'fort']; t.garrison = army('inferno', ['dw1u', 'dw2u', 'dw3u', 'dw4u', 'dw5u', 'dw6u', 'dw7u']);
    const B = simulateBattle(createBattle(st, h, t));
    for (const p of st.players) if (!p.human) { p.faction = 'inferno'; for (const t2 of st.towns) if (t2.owner === p.id) t2.faction = 'inferno'; for (const h2 of st.heroes) if (h2.owner === p.id) h2.army = army('inferno', ['dw1', 'dw2', 'dw3']); }
    for (let d = 0; d < 3; d++) { G.screens.adventure.doEndTurn(); G.modal = null; }
    return { over: B.over, rounds: B.round, day: st.dayTotal };
  });
  assert.ok(r.over === 'win' || r.over === 'lose', JSON.stringify(r));
  assert.ok(r.rounds < 60);
  assert.equal(r.day, 4);
});

test('Akademia kontra Przystań: bitwa się kończy, tytani i starsze gremliny strzelają, nagi walczą bez odwetu', async () => {
  await newGame(page, { mapSize: 'M', faction: 'academy', opponents: 1 }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), t = st.towns[1], army = (fac, lv) => { const F = factionOf(fac), a = emptyArmy(); lv.forEach((d, i) => { a[i] = { cid: F.dw[d][1], n: 12 - i * 2 }; }); return a; };
    h.army = army('academy', ['dw1u', 'dw2u', 'dw3u', 'dw4u', 'dw5u', 'dw6u', 'dw7u']); t.faction = 'haven'; t.built = ['hall1', 'fort']; t.garrison = army('haven', ['dw1u', 'dw2u', 'dw3u', 'dw4u', 'dw5u', 'dw6u', 'dw7u']);
    const B = simulateBattle(createBattle(st, h, t));
    return { over: B.over, rounds: B.round, shooters: ['masterGremlin', 'titan', 'mage'].map(id => CREATURES[id].shots > 0), naga: CREATURES.naga.abil.includes('noRetal'), town: factionOf('academy').terrain === TER.SNOW };
  });
  assert.ok(r.over === 'win' || r.over === 'lose', JSON.stringify(r));
  assert.ok(r.rounds < 60);
  assert.deepEqual(r.shooters, [true, true, true]); assert.ok(r.naga); assert.ok(r.town);
});
