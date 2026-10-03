// Poprawki z oceny gry: wiedźmie można odmówić, ukryte kapliczki, mniej oddziałów u neutralnych, odkryty start, drobne nagrody bez okien
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames, dialog, pressDialog } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('kapliczka i wiedźma nie zdradzają nauki, póki twój bohater ich nie odwiedzi', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), sh = { type: 'site', kind: 'shrine', spell: 'fireball', x: 1, y: 1, seen: {} }, wh = { type: 'site', kind: 'witchHut', skill: 'tactics', x: 2, y: 1, seen: {} };
    const before = [siteInfo(st, sh, h), siteInfo(st, wh, h)]; useSite(st, h, sh); siteDiscover(wh, h.owner);
    return { before, after: [siteInfo(st, sh, h), siteInfo(st, wh, h)], foe: siteInfo(st, sh, { owner: 1 }) };
  });
  assert.doesNotMatch(r.before[0], /Kula ognia/); assert.match(r.before[0], /jakiegoś czaru/); assert.doesNotMatch(r.before[1], /Taktyka/);
  assert.match(r.after[0], /Kula ognia/); assert.match(r.after[1], /Taktyka/); assert.match(r.foe, /jakiegoś czaru/, 'inny gracz nadal nie wie');
});

test('wiedźmie można odmówić; potem da się wrócić i przyjąć', async () => {
  await newGame(page);
  await page.evaluate(() => { const st = G.state, h = hero(st); window.WH = { type: 'site', kind: 'witchHut', skill: 'tactics', x: h.x, y: h.y, seen: {}, id: 999 }; h.skills = [{ id: 'leadership', lv: 1 }]; visitObject(st, h, WH); });
  let d = await dialog(page); assert.match(d.msg, /Taktyka/); assert.deepEqual(d.labels, ['Ucz się', 'Odmów']);
  await pressDialog(page, 'Odmów'); assert.equal(await page.evaluate(() => heroSkill(hero(G.state), 'tactics')), 0);
  await frames(page, 3); await page.evaluate(() => visitObject(G.state, hero(G.state), WH)); d = await dialog(page);
  await pressDialog(page, 'Ucz się'); assert.equal(await page.evaluate(() => heroSkill(hero(G.state), 'tactics')), 1);
});

test('stada dzielą się na najwyżej 4 oddziały (strzelcy na 3); start z odkrytą okolicą i obiektami w pobliżu', async () => {
  await newGame(page, { mapSize: 'M', opponents: 2 }, 31);
  const r = await page.evaluate(() => {
    const st = G.state, n = st.map.n, h = hero(st), t = st.towns.find(t => t.owner === ME), ex = st.players[ME].explored; let seen = 0; for (let y = t.y - 9; y <= t.y + 9; y++) for (let x = t.x - 9; x <= t.x + 9; x++) if (x >= 0 && y >= 0 && x < n && y < n && ex[y * n + x]) seen++;
    const near = (o, r) => Math.hypot(o.x - t.x, o.y - t.y) <= r;
    return { split: [splitMonster(25, 'archer').length, splitMonster(60, 'pikeman').length, splitMonster(10, 'pikeman').length, splitMonster(3, 'pikeman').length], seen,
      early: st.objects.some(o => o.type === 'site' && ['stone', 'arena', 'tree', 'garden', 'campfire', 'library', 'temple', 'fountain', 'stables', 'lookout', 'altar'].includes(o.kind) && near(o, 12)), chest: st.objects.some(o => o.type === 'chest' && near(o, 10)) };
  });
  assert.deepEqual(r.split, [3, 4, 2, 1]); assert.ok(r.seen > 250, `odkryte ${r.seen}`); assert.ok(r.early); assert.ok(r.chest);
});

test('drobna nagroda (stajnie) bez okna: napis nad bohaterem i komunikat w ramce', async () => {
  await newGame(page);
  const r = await page.evaluate(() => { const st = G.state, h = hero(st), mp = h.mp; visitObject(st, h, { type: 'site', kind: 'stables', x: h.x, y: h.y, seen: {}, id: 998 }); return { modal: !!G.modal, mp: h.mp - mp, msg: G.screens.adventure.flashMsg && G.screens.adventure.flashMsg.text }; });
  assert.equal(r.modal, false); assert.ok(r.mp > 0); assert.match(r.msg, /Stajnie/);
});
