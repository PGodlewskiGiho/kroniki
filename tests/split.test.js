// Podział oddziału: część jednostek na wolne miejsce albo do takiego samego oddziału (spotkanie, miasto, bohater). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('armySplit: część na wolne miejsce i do takiego samego oddziału; bohater zachowuje jednostkę; inny typ to błąd', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const a = emptyArmy(), b = emptyArmy(); a[0] = { cid: 'pikeman', n: 20 }; b[1] = { cid: 'pikeman', n: 3 }; b[2] = { cid: 'archer', n: 5 };
    const e1 = armySplit(a, 0, b, 0, 7, [a, b]), s1 = [a[0].n, b[0].n];
    const e2 = armySplit(a, 0, b, 1, 4, [a, b]), s2 = [a[0].n, b[1].n];
    const e3 = armySplit(a, 0, b, 2, 1, [a, b]);
    const lim = splitLimit(a, 0, b, 0, [a, b]).max; // a ma jeden oddział: zostaje co najmniej 1 jednostka
    const e4 = armySplit(a, 0, b, 0, 999, [a, b]);
    const c = emptyArmy(); c[0] = { cid: 'pikeman', n: 1 }; const e5 = armySplit(c, 0, c, 1, 1);
    const g = emptyArmy(); g[3] = { cid: 'griffin', n: 6 }; const e6 = armySplit(g, 3, b, 3, 6, [b]); // garnizon oddaje wszystko
    return { e1, s1, e2, s2, e3: !!e3, lim, e4, left: a[0].n, e5: !!e5, e6, g3: g[3], b3: b[3] };
  });
  assert.deepEqual(r.s1, [13, 7]); assert.equal(r.e1, null);
  assert.deepEqual(r.s2, [9, 7]); assert.equal(r.e2, null);
  assert.ok(r.e3, 'inny typ jednostek');
  assert.equal(r.lim, 8); assert.equal(r.e4, null); assert.equal(r.left, 1);
  assert.ok(r.e5, 'jednej jednostki nie da się podzielić');
  assert.equal(r.e6, null); assert.equal(r.g3, null); assert.deepEqual(r.b3, { cid: 'griffin', n: 6 });
});

test('spotkanie bohaterów: przycisk „Dziel” otwiera okno podziału, a po nim wraca spotkanie', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, a = hero(st), b = createHero(st, ME, a.x + 1, a.y); a.army = emptyArmy(); a.army[0] = { cid: 'pikeman', n: 10 }; a.army[1] = { cid: 'archer', n: 4 };
    showMeeting(st, a, b); const M = G.modal;
    M.buttons.find(x => x.label === 'Dziel').action();
    M.draw(G.ctx); // prostokąty miejsc armii powstają przy rysowaniu
    return { ok: true };
  });
  assert.ok(r.ok);
  await frames(page, 2);
  const s = await page.evaluate(() => {
    const st = G.state, M = G.modal, a = M.meeting.a, b = M.meeting.b;
    // klik: oddział 0 bohatera a, potem wolne miejsce 3 bohatera b (współrzędne z układu okna spotkania)
    const slot = (k, i) => ({ x: 60 + 24 + i * 90 + 10, y: [70 + 96, 70 + 290][k] + 16 + 10 });
    let p = slot(0, 0); M.onClick(p.x, p.y); p = slot(1, 3); M.onClick(p.x, p.y);
    const split = G.modal && G.modal.split ? { n: G.modal.split.n, max: G.modal.split.max } : null;
    G.modal.buttons.find(x => x.label === '+1').action(); G.modal.buttons.find(x => x.label === 'Przenieś').action();
    return { split, back: G.modal === M, a0: a.army[0].n, b3: b.army[3] };
  });
  assert.deepEqual(s.split, { n: 5, max: 10 });
  assert.equal(s.back, true);
  assert.equal(s.a0, 4); assert.deepEqual(s.b3, { cid: 'pikeman', n: 6 });
  await page.evaluate(() => { G.modal = null; });
});

test('miasto: Shift+klik dzieli oddział między garnizon a bohatera', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], h = hero(st); h.x = t.x; h.y = t.y; t.garrison = emptyArmy(); t.garrison[0] = { cid: 'griffin', n: 8 };
    setScreen('town', { townId: t.id }); const T = G.screens.town; T.draw(G.ctx);
    const g = T.garRects[0], hr = T.heroRects.find(x => !h.army[x.i]);
    T.onClick(g.x + 5, g.y + 5); G.keys.add('shift'); T.onClick(hr.x + 5, hr.y + 5); G.keys.delete('shift');
    const n = G.modal && G.modal.split && G.modal.split.n; G.modal.buttons.find(x => x.label === 'Przenieś').action();
    return { n, gar: t.garrison[0].n, hero: h.army[hr.i], modal: G.modal };
  });
  assert.equal(r.n, 4); assert.equal(r.gar, 4); assert.deepEqual(r.hero, { cid: 'griffin', n: 4 }); assert.equal(r.modal, null);
  await frames(page, 3);
});
