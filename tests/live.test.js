// Tura przeciwnika na żywo i ręczna obrona (etap 1, kroki 2–3). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Odtwarza turę SI klatka po klatce, aż się skończy albo pojawi się okno. Zwraca, ile klatek miało animację ruchu SI.
const driveAi = () => page.evaluate(() => {
  const scr = G.screens.adventure; let animated = 0;
  for (let i = 0; i < 20000 && scr.aiRun && !G.modal && G.screenName === 'adventure'; i++) { scr.update(0.05); if (scr.aiRun && scr.aiRun.anim) animated++; }
  return { animated, running: !!scr.aiRun, modal: !!G.modal };
});
// Gra z jednym rywalem, cała mapa odkryta (ruchy SI widoczne)
async function liveGame(extra = {}, seed = 3) {
  await newGame(page, { mapSize: 'M', opponents: 1, ...extra }, seed);
  await page.evaluate(() => { human(G.state).explored.fill(1); G.screens.adventure.enter({}); G.modal = null; });
}

test('tura na żywo daje ten sam wynik co tura natychmiastowa, a ruchy są animowane', async () => {
  const snap = () => page.evaluate(() => { const d = serializeGame(G.state); d.core.cam = null; return JSON.stringify(d); });
  await liveGame();
  await page.evaluate(() => { for (let d = 0; d < 3; d++) { G.screens.adventure.doEndTurn(); G.modal = null; } });
  const sync = await snap();
  await liveGame();
  let animated = 0;
  for (let d = 0; d < 3; d++) {
    await page.evaluate(() => G.screens.adventure.doEndTurn({ live: true }));
    const r = await driveAi(); animated += r.animated;
    assert.equal(r.running, false, 'tura się skończyła');
    await page.evaluate(() => { G.modal = null; });
  }
  assert.equal(await snap(), sync);
  assert.ok(animated > 10, `animowanych klatek: ${animated}`);
});

test('w trakcie tury przeciwnika gracz nic nie zmienia, a panel mówi, kto gra', async () => {
  await liveGame();
  const r = await page.evaluate(() => {
    const st = G.state, scr = G.screens.adventure, day = st.dayTotal, h = hero(st), pos = [h.x, h.y];
    scr.doEndTurn({ live: true }); scr.update(0.05);
    const info = panelInfoText(st, scr).text, locked = scr.buttons.every(b => b.disabled), save = canSaveNow(st);
    scr.endTurn(); scr.onClick(VIEW.x + 100, VIEW.y + 100); scr.onKey('h');
    return { info, locked, save, day: st.dayTotal - day, moved: h.x !== pos[0] || h.y !== pos[1], running: !!scr.aiRun };
  });
  assert.match(r.info, /Tura przeciwnika: gracz niebieski/);
  assert.ok(r.locked, 'przyciski zablokowane');
  assert.equal(r.save, false, 'bez zapisu w trakcie tury SI');
  assert.equal(r.day, 0);
  assert.equal(r.moved, false);
  assert.ok(r.running);
  await driveAi();
  const after = await page.evaluate(() => ({ unlocked: G.screens.adventure.buttons.some(b => !b.disabled), day: G.state.dayTotal }));
  assert.ok(after.unlocked);
  assert.equal(after.day, 2);
});

// Słaby bohater gracza poza miastem, silny bohater SI tuż obok; poziom Ekspert (bez rozejmu)
async function ambush() {
  await liveGame({ difficulty: 3 }, 9);
  await page.evaluate(() => {
    const st = G.state, me = hero(st), foe = st.heroes.find(h => h.owner === 1), n = st.map.n;
    for (const o of st.objects) if (o.type === 'monster') o.dead = true; rebuildObjIndex(st);
    const spot = [[2, 0], [0, 2], [-2, 0], [2, 2], [3, 0]].map(([dx, dy]) => [me.x + dx, me.y + dy]).find(([x, y]) => passableTile(st, x, y) && !objectAt(st, y * n + x) && !heroAt(st, x, y));
    me.x = spot[0]; me.y = spot[1]; me.army = emptyArmy(); me.army[0] = { cid: 'pikeman', n: 2 };
    st.towns[0].garrison = emptyArmy(); st.towns[0].garrison[0] = { cid: 'lightGuard', n: 30 }; // miasto za silne, celem jest bohater
    foe.x = me.x + 1; foe.y = me.y; foe.army = emptyArmy(); foe.army[0] = { cid: 'vampireLord', n: 20 };
    G.screens.adventure.enter({}); G.modal = null;
  });
}

test('atak na bohatera gracza: okno obrony, walka automatyczna, wynik i dalsza tura', async () => {
  await ambush();
  await page.evaluate(() => G.screens.adventure.doEndTurn({ live: true }));
  await driveAi();
  const d = await dialog(page);
  assert.ok(d, 'okno obrony');
  assert.match(d.msg, /atakuje twojego bohatera/);
  assert.deepEqual(d.labels, ['Walcz', 'Automatycznie']);
  await pressDialog(page, 'Automatycznie');
  assert.match((await dialog(page)).msg, /Porażka w obronie\..*poległ/);
  await pressDialog(page, 'OK');
  const r = await driveAi();
  assert.equal(r.running, false);
  const news = await dialog(page);
  assert.ok(!news || !/atakuje/.test(news.msg), 'bez powtórzenia wieści o ataku');
  assert.equal(await page.evaluate(() => myHeroes(G.state).length), 0);
});

test('udana obrona daje bohaterowi doświadczenie', async () => {
  await ambush();
  await page.evaluate(() => G.screens.adventure.doEndTurn({ live: true }));
  await driveAi();
  const exp0 = await page.evaluate(() => { const me = hero(G.state); me.army[0] = { cid: 'dawnbringer', n: 40 }; return me.exp; }); // posiłki w ostatniej chwili
  await pressDialog(page, 'Automatycznie');
  const d = await dialog(page);
  assert.match(d.msg, /Obrona udana!.*Doświadczenie: \+\d+/);
  await pressDialog(page, 'OK');
  while (await dialog(page)) await pressDialog(page, (await dialog(page)).labels[0]);
  assert.ok(await page.evaluate(e => hero(G.state).exp > e, exp0));
  await driveAi();
});

test('obrona na ekranie bitwy: gracz po prawej, bez ucieczki, po bitwie tura trwa dalej', async () => {
  await ambush();
  await page.evaluate(() => G.screens.adventure.doEndTurn({ live: true }));
  await driveAi();
  await pressDialog(page, 'Walcz');
  await page.waitForFunction(() => G.screenName === 'battle');
  const b = await page.evaluate(() => { const s = G.screens.battle; return { me: s.me, flee: s.bFlee.disabled, mine: s.B.units.filter(u => humanSide(s.B, u.side)).every(u => u.side === 1) }; });
  assert.deepEqual(b, { me: 1, flee: true, mine: true });
  await frames(page, 20);
  await page.evaluate(() => { const s = G.screens.battle; s.B.auto = true; if (s.phase === 'input') s.startTurnFor(s.B.active); });
  await page.waitForFunction(() => G.screenName === 'adventure' && G.modal, null, { timeout: 90000 });
  assert.match((await dialog(page)).msg, /Porażka w obronie|Obrona udana/);
  await pressDialog(page, 'OK');
  const r = await driveAi();
  assert.equal(r.running, false);
  assert.ok(await page.evaluate(() => G.screens.adventure.buttons.some(x => !x.disabled)), 'przyciski odblokowane');
});

test('dymek jednostki na polu bitwy (twoi / wrogowie)', async () => {
  await ambush();
  await page.evaluate(() => { const st = G.state; setScreen('battle', { battle: createBattle(st, st.heroes.find(h => h.owner === 1), hero(st)) }); });
  await frames(page, 5);
  const r = await page.evaluate(() => { const s = G.screens.battle; return s.B.units.map(u => { const [x, y] = hexCenter(u.x, u.y); return s.rightInfo(x, y); }); });
  assert.ok(r.some(t => /twoi/.test(t)) && r.some(t => /wrogowie/.test(t)), r.join(' | '));
});
