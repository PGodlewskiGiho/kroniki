// Obiekty mapy: kapliczki, studnie, młyny, obozy… (krok 11). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Stawia miejsce danego rodzaju obok bohatera gracza (wolne pole, bez strażnika) i zwraca jego id
const placeSite = (kind, extra = {}) => page.evaluate(([kind, extra]) => {
  const st = G.state, h = hero(st), n = st.map.n;
  for (const o of st.objects) if (o.type === 'monster') o.dead = true;
  const spot = [[1, 1], [2, 1], [1, 2], [2, 2], [-1, 1], [1, -1]].map(([dx, dy]) => [h.x + dx, h.y + dy]).find(([x, y]) => passableTile(st, x, y) && !st.objAt[y * n + x]);
  const ob = { id: st.objects.length, type: 'site', kind, x: spot[0], y: spot[1], seen: {}, ...extra };
  st.objects.push(ob); rebuildObjIndex(st); return ob.id;
}, [kind, extra]);
// Odwiedza miejsce bohaterem (tak jak po wejściu na pole) i zwraca treść okna
const visit = (id, who = null) => page.evaluate(([id, who]) => {
  const st = G.state, ob = st.objects[id], h = who == null ? hero(st) : st.heroes[who]; h.x = ob.x; h.y = ob.y;
  visitObject(st, h, ob); const msg = G.modal && G.modal.msg; if (G.modal) G.modal.buttons[0].action(); G.modal = null; return msg;
}, [id, who]);

test('nowa gra: miejsca na mapie w liczbie zależnej od rozmiaru, na dostępnych polach', async () => {
  const r = await page.evaluate(() => ['S', 'M', 'XL'].map(ms => {
    const st = createNewGame(Object.assign({}, G.settings, { slots: null,  mapSize: ms, opponents: 1 }), 21), n = st.map.n, sites = st.objects.filter(o => o.type === 'site');
    return { ms, n: sites.length, kinds: new Set(sites.map(o => o.kind)).size, ok: sites.every(o => st.map.terrain[o.y * n + o.x] !== TER.WATER && !st.map.obst[o.y * n + o.x]),
      shrines: sites.filter(o => o.kind === 'shrine').every(o => SPELLS[o.spell]), mills: sites.filter(o => o.kind === 'windmill').every(o => RARE.includes(o.res)) };
  }));
  assert.ok(r[0].n >= 3 && r[0].n < 25, `S: ${r[0].n}`);
  assert.ok(r[1].n > r[0].n * 2, `M: ${r[1].n}`);
  assert.equal(r[2].kinds, 13);
  for (const g of r) { assert.ok(g.ok, g.ms); assert.ok(g.shrines); assert.ok(g.mills); }
});

test('obozy, posterunki, ołtarze i biblioteki: +1 do cechy raz na bohatera', async () => {
  await newGame(page);
  for (const [kind, stat] of [['camp', 'att'], ['post', 'def'], ['altar', 'sp'], ['library', 'kn']]) {
    const id = await placeSite(kind), s0 = await page.evaluate(s => hero(G.state).stats[s], stat);
    assert.match(await visit(id), /\+1/);
    assert.match(await visit(id), /już tu był/);
    assert.equal(await page.evaluate(s => hero(G.state).stats[s], stat), s0 + 1, kind);
  }
});

test('kamień wiedzy, kapliczka, studnia i stajnie', async () => {
  await newGame(page);
  const stone = await placeSite('stone'), e0 = await page.evaluate(() => hero(G.state).exp);
  await visit(stone);
  assert.equal(await page.evaluate(() => hero(G.state).exp), e0 + 1000);
  const shrine = await placeSite('shrine', { spell: 'lightningBolt' });
  assert.match(await visit(shrine), /poznaje czar „Błyskawica”/);
  assert.ok(await page.evaluate(() => hero(G.state).spells.includes('lightningBolt')));
  const well = await placeSite('well');
  await page.evaluate(() => { hero(G.state).mana = 0; });
  await visit(well);
  assert.equal(await page.evaluate(() => hero(G.state).mana === heroMaxMana(hero(G.state))), true);
  await page.evaluate(() => { hero(G.state).mana = 0; });
  assert.match(await visit(well), /Wróć jutro/);
  await page.evaluate(() => { G.screens.adventure.doEndTurn(); G.modal = null; hero(G.state).mana = 0; });
  await visit(well);
  assert.ok(await page.evaluate(() => hero(G.state).mana > 0), 'następnego dnia studnia znów działa');
  const st = await placeSite('stables'), mp = await page.evaluate(() => hero(G.state).mp);
  await visit(st);
  assert.equal(await page.evaluate(() => hero(G.state).mp), mp + 400);
  assert.match(await visit(st), /W tym tygodniu/);
});

test('młyny: plon raz w tygodniu dla pierwszego gościa', async () => {
  await newGame(page, { opponents: 1 });
  const wm = await placeSite('waterMill'), mill = await placeSite('windmill', { res: 'gems' });
  const g0 = await page.evaluate(() => human(G.state).resources.gold);
  await visit(wm);
  assert.equal(await page.evaluate(() => human(G.state).resources.gold), g0 + 1000);
  const r = await page.evaluate(([wm, mill]) => {
    const st = G.state, foe = st.heroes.find(h => h.owner === 1), before = st.players[1].resources.gold;
    const again = useSite(st, foe, st.objects[wm]).text, gems0 = human(st).resources.gems; useSite(st, hero(st), st.objects[mill]);
    return { again, gotFoe: st.players[1].resources.gold - before, gems: human(st).resources.gems - gems0, value: aiSiteValue(st, foe, st.objects[wm]), used: siteUsed(st, st.objects[wm], foe) };
  }, [wm, mill]);
  assert.match(r.again, /plon już zebrano/);
  assert.equal(r.gotFoe, 0);
  assert.ok(r.gems >= 3 && r.gems <= 6, `klejnoty: ${r.gems}`);
  assert.ok(r.used, 'SI też widzi, że plon zebrany');
  await page.evaluate(() => { for (let d = 0; d < 7; d++) { G.screens.adventure.doEndTurn(); G.modal = null; } });
  await visit(wm);
  assert.equal(await page.evaluate(() => human(G.state).resources.gold >= 1000), true);
  assert.equal(await page.evaluate(id => siteUsed(G.state, G.state.objects[id], hero(G.state)), wm), true);
});

test('świątynia i fontanna: +1 morale i szczęścia do końca następnej bitwy', async () => {
  await newGame(page);
  const t = await placeSite('temple'), f = await placeSite('fountain');
  const m0 = await page.evaluate(() => { const h = hero(G.state); return [armyMorale(armyStacks(h.army).map(s => s.cid), h, null), heroLuck(h)]; });
  await visit(t); await visit(f);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'); m.dead = false; m.cid = 'goblin'; m.count = 1;
    h.army[0] = { cid: 'dawnbringer', n: 5 };
    const B = createBattle(st, h, m), during = [B.morale[0], B.luck[0]];
    resolveBattle(simulateBattle(B), false);
    return { during, after: [armyMorale(armyStacks(h.army).map(s => s.cid), h, null), heroLuck(h)] };
  });
  assert.deepEqual(r.during.map((v, i) => v - m0[i]), [1, 1]);
  assert.equal(r.after[1], m0[1], 'po bitwie szczęście wraca');
});

test('wieża obserwacyjna odsłania okolicę', async () => {
  await newGame(page);
  const id = await placeSite('lookout');
  const r = await page.evaluate(id => {
    const st = G.state, ob = st.objects[id], ex = human(st).explored, n = st.map.n; ex.fill(0);
    visitObject(st, hero(st), ob); G.modal = null;
    let c = 0; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (ex[y * n + x] && Math.hypot(x - ob.x, y - ob.y) > 8) c++;
    return c;
  }, id);
  assert.ok(r > 50, `odkryte daleko: ${r}`);
});

test('SI chodzi do miejsc i z nich korzysta', async () => {
  await newGame(page, { mapSize: 'M', opponents: 1 }, 3);
  const r = await page.evaluate(() => {
    const st = G.state; for (let d = 0; d < 20; d++) { G.screens.adventure.doEndTurn(); G.modal = null; }
    return st.objects.filter(o => o.type === 'site' && Object.keys(o.seen).some(k => st.heroes.some(h => h.owner === 1 && String(h.id) === k) || k === 'p1' || k === 'all')).length;
  });
  assert.ok(r >= 2, `miejsc odwiedzonych przez SI: ${r}`);
});

test('mapa, dymek i okno z rysunkiem miejsca', async () => {
  await newGame(page);
  const ids = [];
  for (const k of ['windmill', 'camp', 'fountain', 'lookout']) ids.push(await placeSite(k, k === 'windmill' ? { res: 'gems' } : {}));
  await page.evaluate(() => { human(G.state).explored.fill(1); G.screens.adventure.enter({}); });
  await frames(page, 6);
  const info = await page.evaluate(id => { const ob = G.state.objects[id]; return [tileInfo(G.state, ob.x, ob.y), siteInfo(G.state, ob, hero(G.state))]; }, ids[1]);
  assert.equal(info[0], 'Obóz najemników');
  assert.match(info[1], /^Obóz najemników: \+1 do ataku bohatera\.$/);
  await page.evaluate(id => { const st = G.state, ob = st.objects[id], h = hero(st); h.x = ob.x; h.y = ob.y; visitObject(st, h, ob); }, ids[0]);
  await frames(page, 3);
  assert.match((await dialog(page)).msg, /^Wiatrak\. Młynarz oddaje/);
  await pressDialog(page, 'OK');
});
