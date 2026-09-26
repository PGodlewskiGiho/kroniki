// Machiny wojenne (krok 8). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('kuźnia sprzedaje machiny bohaterowi w mieście, każdą raz', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], h = hero(st), R = human(st).resources; h.x = t.x; h.y = t.y; R.gold = 5000;
    const out = { start: [...h.machines], noSmith: buyMachine(st, t, h, 'ballista') };
    t.built.push('smith');
    out.ok = buyMachine(st, t, h, 'ballista'); out.gold = R.gold; out.again = buyMachine(st, t, h, 'ballista');
    out.cart = buyMachine(st, t, h, 'ammoCart'); R.gold = 100; out.broke = buyMachine(st, t, h, 'firstAid');
    h.x += 2; out.away = buyMachine(st, t, h, 'firstAid'); h.x -= 2;
    return { ...out, machines: [...h.machines] };
  });
  assert.deepEqual(r.start, []);
  assert.equal(r.noSmith, 'Brak kuźni');
  assert.equal(r.ok, null); assert.equal(r.gold, 2500);
  assert.equal(r.again, 'Bohater ma już tę machinę');
  assert.equal(r.broke, 'Brakuje złota');
  assert.equal(r.away, 'Bohater musi stać w mieście');
  assert.deepEqual(r.machines, ['ballista', 'ammoCart']);
});

test('okno kuźni w mieście: zakup przyciskiem', async () => {
  await newGame(page);
  await page.evaluate(() => { const st = G.state, t = st.towns[0], h = hero(st); h.x = t.x; h.y = t.y; t.built.push('smith'); human(st).resources.gold = 9000; setScreen('town', { townId: 0 }); G.screens.town.showSmith(); });
  let d = await dialog(page);
  assert.deepEqual(d.labels, ['Balista', 'Namiot medyka', 'Wóz z amunicją', 'Wyjdź']);
  await frames(page, 3);
  await pressDialog(page, 'Namiot medyka');
  d = await dialog(page);
  assert.deepEqual(d.labels, ['Balista', 'Wóz z amunicją', 'Wyjdź']);
  await pressDialog(page, 'Wyjdź');
  assert.deepEqual(await page.evaluate(() => [hero(G.state).machines, human(G.state).resources.gold]), [['firstAid'], 8250]);
  await page.evaluate(() => setScreen('hero', { heroId: G.state.selHero }));
  await frames(page, 3);
  assert.match(await page.evaluate(() => G.screens.hero.rightInfo(100, 480)), /Namiot medyka: co rundę leczy/);
});

test('machiny stoją za armią i nie decydują o wyniku bitwy', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
    h.machines = [...MACHINES]; h.army = emptyArmy(); for (let i = 0; i < 7; i++) h.army[i] = { cid: 'pikeman', n: 5 };
    const B = createBattle(st, h, m), ms = B.units.filter(isMachine);
    const out = { n: ms.length, cols: ms.map(u => u.x), unique: new Set(B.units.map(u => u.x + ',' + u.y)).size === B.units.length, morale: B.morale[0] };
    nextActive(B); out.cartInOrder = [B.active, ...B.order].some(u => u.cid === 'ammoCart');
    for (const u of B.units) if (u.side === 0 && !isMachine(u)) { u.dead = true; u.n = 0; }
    B.order = []; B.active = null; nextActive(B); out.over = B.over;
    return out;
  });
  assert.equal(r.n, 3);
  assert.ok(r.cols.every(x => x <= 1), `kolumny: ${r.cols}`);
  assert.ok(r.unique, 'każdy oddział na innym polu');
  assert.equal(r.morale, 2, 'machiny nie psują morale jednej frakcji (+1 za frakcję, +1 cecha Przystani)');
  assert.equal(r.cartInOrder, false);
  assert.equal(r.over, 'lose');
});

test('balista strzela z mocą bohatera, wóz daje strzały, namiot leczy', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
    h.machines = [...MACHINES]; h.army = emptyArmy(); h.army[0] = { cid: 'archer', n: 10 }; m.cid = 'ogre'; m.count = 5;
    const B = createBattle(st, h, m), ball = B.units.find(u => u.cid === 'ballista'), arch = B.units.find(u => u.cid === 'archer'), foe = B.units.find(u => u.side === 1);
    const est = att => { h.stats.att = att; return estimateStrike(B, ball, foe, true); };
    const out = { a0: est(0), a4: est(4), canShoot: canShoot(B, ball) };
    const shots = arch.shots; actShoot(B, arch, foe); out.shotsCart = arch.shots === shots;
    B.units.find(u => u.cid === 'ammoCart').dead = true; actShoot(B, arch, foe); out.shotsNoCart = shots - arch.shots;
    arch.hp = 3; aiAct(B, B.units.find(u => u.cid === 'firstAid')); out.healed = arch.hp > 3 && arch.hp <= 10;
    const n = foe.n; aiAct(B, ball); out.ballistaHit = foe.n < n || foe.hp < CREATURES.ogre.hp;
    const fn = foe.n, fhp = foe.hp; actMoveAttack(B, foe, [], ball); out.noRetal = foe.n === fn && foe.hp === fhp;
    return out;
  });
  assert.ok(r.a4.min > r.a0.min * 3, `balista ${JSON.stringify(r.a0)} → ${JSON.stringify(r.a4)}`);
  assert.ok(r.canShoot);
  assert.ok(r.shotsCart, 'z wozem strzały się nie kończą');
  assert.equal(r.shotsNoCart, 1);
  assert.ok(r.healed);
  assert.ok(r.ballistaHit);
  assert.ok(r.noRetal, 'machina nie kontratakuje');
});

test('zniszczona machina przepada, ocalała zostaje; po porażce bohater traci wszystkie', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
    h.machines = [...MACHINES]; h.army = emptyArmy(); h.army[0] = { cid: 'dawnbringer', n: 20 };
    let B = createBattle(st, h, m); B.units.find(u => u.cid === 'firstAid').dead = true;
    const win = resolveBattle(simulateBattle(B), false).outcome, after = [...h.machines];
    h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 1 }; const m2 = st.objects.find(o => o.type === 'monster' && !o.dead); m2.cid = 'ogre'; m2.count = 30;
    const lose = resolveBattle(simulateBattle(createBattle(st, h, m2)), false).outcome;
    return { win, after, lose, left: h.machines };
  });
  assert.equal(r.win, 'win');
  assert.deepEqual(r.after, ['ballista', 'ammoCart']);
  assert.equal(r.lose, 'lose');
  assert.deepEqual(r.left, []);
});

test('ekran bitwy z machinami: rysuje się, a machiny gracza działają same', async () => {
  await newGame(page);
  await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster');
    h.machines = [...MACHINES]; h.army = emptyArmy(); h.army[0] = { cid: 'archer', n: 30 }; m.cid = 'goblin'; m.count = 40;
    setScreen('battle', { battle: createBattle(st, h, m) });
  });
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const s = await page.evaluate(() => {
      const scr = G.screens.battle, B = scr.B;
      for (let k = 0; k < 10; k++) scr.update(0.05);
      if (scr.phase === 'input') { if (isMachine(B.active)) return { bad: B.active.cid }; const t = alive(B, 1)[0]; if (canShoot(B, B.active)) actShoot(B, B.active, t); else actDefend(B, B.active); scr.phase = 'play'; }
      return { phase: scr.phase, active: B.active && B.active.cid, screen: G.screenName };
    });
    assert.ok(!s.bad, `gracz dostał turę machiny: ${s.bad}`);
    if (s.active) seen.add(s.active);
    if (s.screen !== 'battle') break;
    if (i % 40 === 0) await frames(page, 2);
  }
  assert.ok(seen.has('ballista'), [...seen].join(','));
  assert.equal(await page.evaluate(() => G.screenName), 'adventure');
  while (await dialog(page)) await pressDialog(page, (await dialog(page)).labels[0]);
});

test('SI kupuje machiny, a zapis je przechowuje', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, p = st.players[1], t = st.towns.find(t => t.owner === 1), foe = st.heroes.find(h => h.owner === 1);
    t.built.push('smith'); foe.x = t.x; foe.y = t.y; p.resources.gold = 20000; aiManageTown(st, p, t);
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { bought: [...foe.machines], saved: back.heroes.find(h => h.owner === 1).machines };
  });
  assert.deepEqual(r.bought, ['ballista', 'firstAid', 'ammoCart']);
  assert.deepEqual(r.saved, r.bought);
});
