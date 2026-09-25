// Tygodnie i miesiące z efektem (krok 12). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, dialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Pierwsza data (tydzień, miesiąc) od drugiego tygodnia gry, dla której efekt ma dany rodzaj
const findWeek = (kind, month = false) => page.evaluate(([kind, month]) => {
  const st = G.state, keep = [st.week, st.month];
  for (let m = 1; m < 60; m++) for (let w = 1; w <= 4; w++) {
    st.week = w; st.month = m; if (m === 1 && w === 1) continue;
    if ((month ? monthInfo(st) : weekInfo(st)).kind === kind) { [st.week, st.month] = keep; return [w, m]; }
  }
  [st.week, st.month] = keep; return null;
}, [kind, month]);

test('pierwszy tydzień spokojny; później różne efekty, zależne tylko od daty i ziarna', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, kinds = {}, first = weekInfo(st).kind;
    for (let m = 1; m <= 12; m++) for (let w = 1; w <= 4; w++) { st.week = w; st.month = m; const k = weekInfo(st).kind; kinds[k] = (kinds[k] || 0) + 1; }
    st.week = 3; st.month = 2; const a = JSON.stringify(weekInfo(st)), b = JSON.stringify(weekInfo(st));
    return { first, kinds, same: a === b };
  });
  assert.equal(r.first, 'calm');
  for (const k of ['creature', 'gold', 'mines', 'exp', 'calm']) assert.ok(r.kinds[k] > 0, `${k}: ${JSON.stringify(r.kinds)}`);
  assert.ok(r.same);
});

test('tydzień stworzenia: +5 przyrostu w jego siedlisku, nazwa i wieść', async () => {
  await newGame(page);
  const wm = await page.evaluate(() => {
    const st = G.state;
    for (let m = 1; m < 200; m++) for (let w = 1; w <= 4; w++) { st.week = w; st.month = m; const W = weekInfo(st); if (W.kind === 'creature' && W.cid === 'pikeman' && !(w === 1 && monthInfo(st).kind === 'plague')) return [w, m]; }
    return null;
  });
  assert.ok(wm, 'jest Tydzień Pikinierów');
  const r = await page.evaluate(([w, m]) => {
    const st = G.state, t = st.towns[0]; st.day = 7; st.week = w === 1 ? 4 : w - 1; st.month = w === 1 ? m - 1 : m;
    if (!hasB(t, 'dw1')) t.built.push('dw1'); t.avail[1] = 0; const base = weeklyGrowth(t, 1);
    G.screens.adventure.doEndTurn(); const msg = G.modal && G.modal.msg; G.modal = null;
    return { base, avail: t.avail[1], name: weekName(st), msg };
  }, wm);
  assert.equal(r.avail, r.base + 5);
  assert.equal(r.name, 'Pikinierów');
  assert.match(r.msg, /Nastał Tydzień Pikinierów: przyrost: pikinierzy \+5/);
});

test('Dobrobyt, Górnicy i Mędrcy zmieniają dochód i doświadczenie', async () => {
  await newGame(page);
  const dates = { gold: await findWeek('gold'), mines: await findWeek('mines'), exp: await findWeek('exp') };
  const r = await page.evaluate(dates => {
    const st = G.state, h = hero(st), at = ([w, m], f) => { st.week = 1; st.month = 1; const a = f(); st.week = w; st.month = m; const b = f(); st.week = 1; st.month = 1; return [a, b]; };
    const mine = st.objects.find(o => o.type === 'mine' && o.kind !== 'gold'); mine.owner = ME;
    return {
      gold: at(dates.gold, () => dailyIncomeAll(st).gold - skillVal(h, 'estates')),
      mines: at(dates.mines, () => dailyIncomeAll(st)[mine.kind]),
      exp: at(dates.exp, () => { h.skills = []; h.exp = 0; h.level = 1; gainExp(st, h, 100); G.modal = null; return h.exp; }),
      mineInc: MINES[mine.kind].income,
    };
  }, dates);
  assert.equal(r.gold[1], Math.round(r.gold[0] * 1.25));
  assert.deepEqual(r.mines, [r.mineInc, r.mineInc * 2]);
  assert.deepEqual(r.exp, [100, 125]);
});

test('Miesiąc Zarazy zmniejsza pule o połowę, Miesiąc Potworów powiększa potwory', async () => {
  await newGame(page);
  const plague = await findWeek('plague', true), monsters = await findWeek('monsters', true);
  assert.ok(plague && monsters);
  const r = await page.evaluate(([p, mo]) => {
    const st = G.state, t = st.towns[0], ob = st.objects.find(o => o.type === 'monster');
    const turn = m => { st.day = 7; st.week = 4; st.month = m - 1; G.screens.adventure.doEndTurn(); const msg = G.modal && G.modal.msg; G.modal = null; return msg; };
    if (!hasB(t, 'dw1')) t.built.push('dw1'); t.avail[1] = 40; const pm = turn(p[1]), pl = t.avail[1];
    const c0 = ob.count, mm = turn(mo[1]);
    return { pl, pm, grew: ob.count, c0, mm };
  }, [plague, monsters]);
  assert.equal(r.pl, 20);
  assert.match(r.pm, /Nastał Miesiąc Zarazy/);
  assert.equal(r.grew, Math.ceil(r.c0 * 1.5));
  assert.match(r.mm, /Nastał Miesiąc Potworów/);
});

test('dymek nad nazwą tygodnia opisuje efekt', async () => {
  await newGame(page);
  const t = await page.evaluate(() => G.screens.adventure.rightInfo(INFOBOX.x + 20, INFOBOX.y + 10));
  assert.match(t, /^Tydzień \S+: spokojny tydzień/);
  assert.equal(await dialog(page), null);
});
