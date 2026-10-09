// Miejsca przygody: sfinks (zagadka), chata pustelnika (zadanie: pokonać wskazane stwory), karczma (morale i plotka o ukrytym
// skarbie), kurhan (artefakt za klątwę), karawanseraj (artefakt na sprzedaż co tydzień), studnia życzeń. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('świat ma miejsca przygody z nazwami własnymi; pustelnik wskazuje silniejsze stwory kilka dni drogi dalej', async () => {
  const r = await page.evaluate(() => { const kinds = {}, bad = [];
    for (const [size, seed] of [['L', 3], ['XL', 8], ['M', 11]]) { const S = Object.assign({}, G.settings, { mapSize: size, land: 'mixed', difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 1, slots: null, underground: false });
      const st = createNewGame(S, seed);
      for (const o of st.objects) { if (o.dead || o.type !== 'site' || !['sphinx', 'questHut', 'inn', 'barrow', 'caravanserai', 'wishingWell'].includes(o.kind)) continue; kinds[o.kind] = (kinds[o.kind] || 0) + 1;
        if (['inn', 'barrow', 'questHut'].includes(o.kind) && !o.title) bad.push(`${o.kind} bez nazwy`);
        if (o.kind === 'questHut') { const m = st.objects[o.target], d = m && Math.hypot(m.x - o.x, m.y - o.y);
          if (!m || m.type !== 'monster' || m.quest !== o.id || d < 7 || d > 16) bad.push(`pustelnik ${o.id}: cel ${m && m.type} w odległości ${d}`); } } }
    return { kinds, bad }; });
  assert.deepEqual(r.bad, []);
  for (const k of ['sphinx', 'questHut', 'inn', 'barrow', 'caravanserai', 'wishingWell']) assert.ok(r.kinds[k] >= 1, `${k}: ${r.kinds[k] || 0}`);
});

test('sfinks: dobra odpowiedź daje złoto i doświadczenie, zła przepada; raz na bohatera', async () => {
  await newGame(page, { mapSize: 'S' }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = human(st).resources, ob = { id: 9001, type: 'site', kind: 'sphinx', x: h.x, y: h.y, seen: {} }; st.objects.push(ob);
    const Q = sphinxRiddle(st, ob, h), g0 = R.gold, good = useSite(st, h, ob, Q.right), again = useSite(st, h, ob, Q.right);
    const h2 = { ...h, id: h.id + 100 }, Q2 = sphinxRiddle(st, ob, h2), bad = useSite(st, h2, ob, (Q2.right + 1) % 3);
    ob.dead = true; return { ok: RIDDLES.some(x => x[0] === Q.q && x[1] === Q.answers[Q.right]), q: Q.q, n: Q.answers.length, right: Q.answers[Q.right], exp: good.exp, gold: R.gold - g0, again: again.text, bad: [bad.exp || 0, bad.bad] };
  });
  assert.equal(r.n, 3); assert.ok(r.ok, `${r.q} → ${r.right}`);
  assert.equal(r.exp, 2000); assert.equal(r.gold, 1500); assert.match(r.again, /już tu był/); assert.deepEqual(r.bad, [0, true]);
});

test('pustelnik: zadanie odsłania cel, nagroda dopiero po pokonaniu stworów, jedna', async () => {
  await newGame(page, { mapSize: 'L' }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), P = human(st), ob = st.objects.find(o => o.kind === 'questHut' && !o.dead), m = st.objects[ob.target], n = st.map.n, out = {};
    P.explored[m.y * n + m.x] = 0; const t1 = useSite(st, h, ob); out.ask = /Pokonaj je/.test(t1.text) && !t1.exp; out.revealed = !!P.explored[m.y * n + m.x]; out.info = siteInfo(st, ob, h).includes('zadanie:');
    removeObject(st, m); const arts0 = JSON.stringify([h.bag, h.equip]); const t2 = useSite(st, h, ob); out.reward = t2.exp === QUEST_EXP && JSON.stringify([h.bag, h.equip]) !== arts0;
    out.once = /już wynagrodził/.test(useSite(st, h, ob).text); return out;
  });
  assert.deepEqual(r, { ask: true, revealed: true, info: true, reward: true, once: true });
});

test('karczma: morale +1 (zmywa klątwę kurhanu) i plotka odsłania nieodkryte cenne miejsce lub ukryty skarb', async () => {
  await newGame(page, { mapSize: 'L' }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), P = human(st), out = {}, barrow = st.objects.find(o => o.kind === 'barrow' && !o.dead), inn = st.objects.find(o => o.kind === 'inn' && !o.dead);
    const arts0 = JSON.stringify([h.bag, h.equip]); const b = useSite(st, h, barrow); out.curse = h.boost.morale; out.art = JSON.stringify([h.bag, h.equip]) !== arts0; out.empty = /rozkopany/.test(useSite(st, h, barrow).text);
    out.barrowInfo = /rozkopany/.test(siteInfo(st, barrow, h));
    P.explored.fill(0); const t = useSite(st, h, inn); out.morale = h.boost.morale; out.rumor = /szepcze/.test(t.text); out.lit = P.explored.reduce((s, v) => s + v, 0) > 0;
    out.week = /W tym tygodniu/.test(useSite(st, h, inn).text); return out;
  });
  assert.deepEqual(r, { curse: -3, art: true, empty: true, barrowInfo: true, morale: 1, rumor: true, lit: true, week: true });
});

test('karawanseraj: artefakt za złoto raz w miesiącu, potem nowy towar; studnia życzeń pobiera opłatę raz w tygodniu, artefakt daje najwyżej jeden', async () => {
  await newGame(page, { mapSize: 'L' }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = human(st).resources, out = {}, bz = st.objects.find(o => o.kind === 'caravanserai' && !o.dead), well = st.objects.find(o => o.kind === 'wishingWell' && !o.dead);
    R.gold = 100; out.poor = /a masz 100/.test(useSite(st, h, bz).text); R.gold = 20000; const o = bazaarOffer(st, bz); useSite(st, h, bz); out.paid = 20000 - R.gold === o.price; out.sold = bazaarOffer(st, bz) === null;
    st.dayTotal += 7; out.week = bazaarOffer(st, bz) === null; st.dayTotal += 21; out.restock = !!bazaarOffer(st, bz);
    R.gold = 1000; useSite(st, h, well); out.fee = R.gold !== 1000; out.today = /W tym tygodniu już/.test(useSite(st, h, well).text);
    // los studni: w 200 dniach wszystkie cztery wyniki
    const seen = new Set(); let arts = 0; for (let d = 0; d < 400; d++) { st.dayTotal += 7; R.gold = 1000; const t = useSite(st, h, well).text; seen.add(t.slice(0, 12)); if (/Życzenie spełnione/.test(t)) arts++; } out.outcomes = seen.size; out.oneArt = arts === 1;
    return out;
  });
  assert.deepEqual({ ...r, outcomes: r.outcomes >= 4 }, { poor: true, paid: true, sold: true, week: true, restock: true, fee: true, today: true, outcomes: true, oneArt: true });
});

test('okna: sfinks pyta z trzema odpowiedziami, kurhan i studnia pytają o zgodę; dymki z nazwą własną; SI odwiedza bez błędów', async () => {
  await newGame(page, { mapSize: 'L', opponents: 1 }, 3);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), out = {}, pick = k => st.objects.find(o => o.kind === k && !o.dead);
    for (const k of ['sphinx', 'barrow', 'wishingWell', 'caravanserai']) { human(st).resources.gold = 9000; G.modal = null; visitObject(st, h, pick(k)); out[k] = G.modal ? G.modal.buttons.length : -1; G.modal = null; }
    out.tip = siteInfo(st, pick('inn'), h).startsWith('Karczma „');
    const ai = st.heroes.find(x => x.owner !== ME); for (const k of ['sphinx', 'questHut', 'inn', 'barrow', 'caravanserai', 'wishingWell']) { const v = aiSiteValue(st, ai, pick(k)); if (!(v >= 0)) out.aiBad = k; const res = useSite(st, ai, pick(k)); if (typeof res.text !== 'string') out.aiBad = k; }
    return out;
  });
  assert.equal(r.aiBad, undefined); assert.ok(r.tip, 'nazwa karczmy w dymku');
  assert.equal(r.sphinx, 4, 'trzy odpowiedzi i „Odejdź”'); assert.equal(r.barrow, 2); assert.equal(r.wishingWell, 2); assert.equal(r.caravanserai, 2);
});
