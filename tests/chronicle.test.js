// Kronika tygodnia: ogłoszenie astrologów na początku tygodnia, Tydzień Żniw i Magii, Kronika tawerny (ranking graczy,
// rubryki odkrywane liczbą tawern). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const findWeek = kind => page.evaluate(k => { const st = G.state; for (let m = 1; m < 300; m++) for (let w = 1; w <= 4; w++) { st.week = w; st.month = m; if (weekInfo(st).kind === k) { st.week = 1; st.month = 1; return [w, m]; } } return null; }, kind);

test('astrolodzy ogłaszają nowy tydzień raz, z rysunkiem; Żniwa dają surowce, Magia manę', async () => {
  await newGame(page, { opponents: 1 });
  const harvest = await findWeek('harvest'), magic = await findWeek('magic');
  assert.ok(harvest && magic);
  const r = await page.evaluate(([hv, mg]) => {
    const st = G.state, R = human(st).resources, h = hero(st), go = ([w, m]) => { st.day = 7; st.week = w === 1 ? 4 : w - 1; st.month = w === 1 ? m - 1 : m; G.screens.adventure.doEndTurn(); const d = G.modal; G.modal = null; return d; };
    const w0 = R.wood, d1 = go(hv), gotWood = R.wood - w0 - dailyIncomeAll(st).wood;
    h.mana = 0; const d2 = go(mg), mana = h.mana === heroMaxMana(h);
    G.screens.adventure.startHumanTurn(st, false); const again = !!G.modal && /Astrolodzy/.test(G.modal.msg); G.modal = null;
    return { m1: d1 && d1.msg, icon: !!(d1 && d1.hasIcon), gotWood, m2: d2 && d2.msg, mana, again };
  }, [harvest, magic]);
  assert.match(r.m1, /^Astrolodzy ogłaszają: .*Tydzień Żniw/); assert.ok(r.icon, 'okno z rysunkiem');
  assert.equal(r.gotWood, 5); assert.match(r.m2, /Tydzień Magii/); assert.ok(r.mana);
  assert.equal(r.again, false, 'jedno ogłoszenie na tydzień');
});

test('kronika tawerny: ranking graczy, prowadzący wyróżniony, rubryki zależne od liczby tawern', async () => {
  await newGame(page, { opponents: 2 });
  const r = await page.evaluate(() => {
    const st = G.state; human(st).resources.gold = 99999;
    const shown = n => { st.towns.filter(t => t.owner === ME).forEach((t, i) => { t.built = t.built.filter(b => b !== 'tavern'); if (i < n) t.built.push('tavern'); }); return chronicleTable(st, ME).rows.filter(r => r.vals).length; };
    const one = shown(1), T = chronicleTable(st, ME), gold = T.rows.find(r => r.name === 'Złoto'), meIdx = T.players.findIndex(p => p.id === ME);
    for (let k = 0; k < 2; k++) { const t = st.towns.find(t => t.owner !== ME); if (t) captureTown(st, t, ME); }
    const three = shown(3);
    showChronicle(st); G.modal.draw(G.ctx); const ok = !!G.modal.chronicle; G.modal = null;
    return { one, three, cols: T.players.length, lead: gold.lead[meIdx], ok };
  });
  assert.equal(r.cols, 3); assert.ok(r.lead, 'najbogatszy prowadzi w rubryce Złoto'); assert.ok(r.ok);
  assert.equal(r.one, 4); assert.equal(r.three, 8);
});
