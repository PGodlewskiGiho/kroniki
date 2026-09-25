// Porządki: stare zapisy wczytują się po naprawie (migrateSave), balans frakcji i siła potworów na mapie. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('stary zapis bez nowych pól i z nieznanymi rzeczami wczytuje się i da się grać dalej', async () => {
  await newGame(page, { mapSize: 'S', opponents: 1 }, 6);
  const r = await page.evaluate(() => {
    const d = JSON.parse(JSON.stringify(serializeGame(G.state)));
    delete d.core.cur; for (const p of d.players) { delete p.welcomed; delete p.inbox; delete p.resources.gems; }
    d.players[1].faction = 'atlantyda'; d.players[1].color = d.players[0].color;
    const h = d.heroes[0]; delete h.army; delete h.stats; delete h.skills; delete h.machines; delete h.mana; h.spells = ['bless', 'zakleciePrzyszlosci']; h.bag = ['nieznanyArtefakt'];
    const t = d.towns[0]; delete t.avail; delete t.garrison; t.built.push('wiezaCzasu');
    d.objects.push({ id: d.objects.length, type: 'monster', cid: 'smokCzasu', count: 5, x: 1, y: 1 });
    d.objects.push({ id: d.objects.length, type: 'bank', kind: 'crypt', x: 2, y: 2, blocks: [] });
    const st = deserializeGame(d); G.state = st; setScreen('adventure', {});
    const out = { cur: st.cur, me: ME, gems: st.players[0].resources.gems, fac: st.players[1].faction, colors: new Set(st.players.map(p => p.color)).size,
      army: armySize(st.heroes[0].army) > 0, spells: st.heroes[0].spells.includes('zakleciePrzyszlosci'), bag: st.heroes[0].bag.length, built: st.towns[0].built.includes('wiezaCzasu'),
      monster: st.objects.find(o => o.cid === 'smokCzasu').dead, bank: st.objects.at(-1).guards.length > 0, garrison: st.towns[0].garrison.length };
    for (let i = 0; i < 3; i++) { G.screens.adventure.doEndTurn(); G.modal = null; }
    out.day = st.dayTotal; return out;
  });
  assert.deepEqual(r, { cur: 0, me: 0, gems: 0, fac: 'haven', colors: 2, army: true, spells: false, bag: 0, built: false, monster: true, bank: true, garrison: 7, day: 4 });
});

test('balans frakcji: armie z dwóch tygodni przyrostu wygrywają 30–70% walk z innymi frakcjami', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, facs = FACTIONS.map(f => f.id), win = {}, games = {}, rnd = mulberry32(77);
    const army = (fac, up) => { const F = factionOf(fac), a = emptyArmy(); for (let L = 1; L <= 7; L++) { const cid = F.dw['dw' + L + (up ? 'u' : '')][1]; a[L - 1] = { cid, n: Math.max(1, Math.round(CREATURES[cid].growth * 2 * (0.8 + 0.4 * rnd()))) }; } return a; };
    const h = st.heroes.find(x => x.owner === 0), foe = st.heroes.find(x => x.owner === 1);
    for (const f of facs) { win[f] = 0; games[f] = 0; }
    for (const a of facs) for (const b of facs) { if (a >= b) continue;
      for (let k = 0; k < 16; k++) { // na zmianę atak i obrona, zwykłe i ulepszone jednostki
        const up = k % 4 < 2, sw = k % 2; h.army = army(sw ? b : a, up); foe.army = army(sw ? a : b, up);
        const B = simulateBattle(createBattle(st, h, foe)), aWon = (B.over === 'win') !== !!sw; win[aWon ? a : b]++; games[a]++; games[b]++;
      } }
    const value = Object.fromEntries(facs.map(f => { const F = factionOf(f); let v = 0; for (let L = 1; L <= 7; L++) { const c = CREATURES[F.dw['dw' + L][1]]; v += c.value * c.growth; } return [f, v]; }));
    return { rate: Object.fromEntries(facs.map(f => [f, Math.round(win[f] / games[f] * 100)])), value };
  });
  for (const [f, p] of Object.entries(r.rate)) assert.ok(p >= 30 && p <= 70, `${f}: ${p}% wygranych (${JSON.stringify(r.rate)})`);
  const vals = Object.values(r.value), mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  for (const [f, v] of Object.entries(r.value)) assert.ok(Math.abs(v - mean) / mean < 0.2, `${f}: wartość tygodnia ${v}, średnio ${Math.round(mean)}`);
});

test('mapa jest wymagająca: armia startowa pokona tylko część potworów, najdalsze są wielokrotnie silniejsze', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); let win = 0, tot = 0; const pw = [];
    for (const ob of st.objects) if (ob.type === 'monster' && !ob.dead) { tot++; if (simulateBattle(createBattle(st, h, ob)).over === 'win') win++; pw.push(ob.count * CREATURES[ob.cid].value); }
    pw.sort((a, b) => a - b);
    const banks = st.objects.filter(o => o.type === 'bank').map(o => o.kind);
    return { share: win / tot, min: pw[0], max: pw.at(-1), army: armyPower(h.army) * heroFactor(h), banks, lvl7: st.objects.some(o => o.type === 'monster' && CREATURES[o.cid].level >= 6) };
  });
  assert.ok(r.share > 0.05 && r.share < 0.4, `wygrywa z ${Math.round(r.share * 100)}% potworów`);
  assert.ok(r.max > r.army * 8, `najsilniejszy potwór ${r.max} przy armii ${Math.round(r.army)}`);
  assert.ok(r.lvl7, 'na mapie są potwory poziomu 6–7');
  assert.ok(r.banks.includes('dragonUtopia') && r.banks.includes('crypt'), JSON.stringify(r.banks));
});

test('skarbiec: zwycięstwo daje łup i zostawia pusty skarbiec; porażka zostawia ocalałą załogę', async () => {
  await newGame(page, { mapSize: 'M', opponents: 0 }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = human(st).resources, b = st.objects.find(o => o.type === 'bank' && o.kind === 'crypt');
    const g0 = R.gold, bag0 = h.bag.length + Object.values(h.equip).filter(Boolean).length;
    h.army = emptyArmy(); h.army[0] = { cid: 'dawnbringer', n: 20 };
    h.x = b.x; h.y = b.y; h.prev = [b.x, b.y + 1];
    const res = resolveBattle(simulateBattle(createBattle(st, h, b)), false);
    const after = { outcome: res.outcome, gold: R.gold - g0, arts: h.bag.length + Object.values(h.equip).filter(Boolean).length - bag0, cleared: b.cleared, text: res.bankText };
    const u = st.objects.find(o => o.type === 'bank' && o.kind === 'dragonUtopia'), before = bankPower(u);
    h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 30 }; h.prev = [u.x, u.y + 1];
    const lost = resolveBattle(simulateBattle(createBattle(st, h, u)), false);
    return { ...after, lost: lost.outcome, utopia: u.cleared, still: bankPower(u) > before * 0.9 };
  });
  assert.equal(r.outcome, 'win'); assert.equal(r.gold, 2500); assert.equal(r.arts, 1); assert.equal(r.cleared, true);
  assert.ok(/Łup: 2500 złota/.test(r.text), r.text);
  assert.equal(r.lost, 'lose'); assert.equal(r.utopia, false); assert.ok(r.still);
});
