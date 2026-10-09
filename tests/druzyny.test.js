// Drużyny i sojusze: wybór drużyny na ekranie nowej gry, wspólna mapa, sojusznicy nie walczą i nie przejmują sobie kopalń ani miast,
// komputer nie celuje w sojuszników, gra kończy się zwycięstwem drużyny. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

const teamGame = (teams, types = ['human', 'ai', 'ai', 'ai'], seed = 31) => page.evaluate(([teams, types, seed]) => {
  const S = Object.assign({}, G.settings, { mapSize: 'L', land: 'mixed', underground: false, slots: PLAYER_COLORS.map((c, i) => ({ type: types[i] || 'off', color: c.id, faction: 'random', team: teams[i] || 0 })) });
  G.state = createNewGame(S, seed); setScreen('adventure', {}); return G.state.players.map(p => p.team || 0);
}, [teams, types, seed]);

test('drużyny trafiają do graczy; sojusznik = ta sama drużyna; zapis je zachowuje', async () => {
  const t = await teamGame([1, 1, 2, 2]);
  assert.deepEqual(t, [1, 1, 2, 2]);
  const r = await page.evaluate(() => { const st = G.state, d = deserializeGame(JSON.parse(JSON.stringify(serializeGame(st))));
    return { a01: allied(st, 0, 1), a02: allied(st, 0, 2), a23: allied(st, 2, 3), self: allied(st, 3, 3), neutral: allied(st, 0, -1), saved: d.players.map(p => p.team || 0) }; });
  assert.deepEqual(r, { a01: true, a02: false, a23: true, self: true, neutral: false, saved: [1, 1, 2, 2] });
});

test('wspólna mapa: to, co odkrywa bohater sojusznika, widzi cała drużyna (wróg nie)', async () => {
  await teamGame([1, 1, 2, 2]);
  const r = await page.evaluate(() => { const st = G.state, n = st.map.n, i = 5 * n + 5; for (const p of st.players) p.explored[i] = 0;
    reveal(st, 5, 5, 2, 1); return st.players.map(p => p.explored[i]); });
  assert.deepEqual(r, [1, 1, 0, 0]);
});

test('sojusznicy: bohater nie atakuje bohatera ani miasta sojusznika i nie przejmuje jego kopalni', async () => {
  await teamGame([1, 1, 2, 2]);
  const r = await page.evaluate(() => { const st = G.state, h = hero(st), ally = st.heroes.find(o => o.owner === 1), n = st.map.n;
    let fought = false; const sb = startHeroEncounter; window.startHeroEncounter = () => { fought = true; };
    const mine = st.objects.find(o => o.type === 'mine' && !o.dead); mine.owner = 1;
    ally.x = h.x + 1; ally.y = h.y; rebuildObjIndex(st); h.mp = 5000; h.path = [[ally.x, ally.y]]; heroStep(st, h); window.startHeroEncounter = sb;
    const t = st.towns.find(t => t.owner === 1); let assault = false; const sa = window.startTownAssault; window.startTownAssault = () => { assault = true; };
    visitObject(st, h, objectAt(st, t.y * n + t.x)); window.startTownAssault = sa; visitObject(st, h, mine);
    return { fought, assault, mine: mine.owner, townOwner: t.owner }; });
  assert.equal(r.fought, false); assert.equal(r.assault, false); assert.equal(r.mine, 1, 'kopalnia sojusznika zostaje jego'); assert.equal(r.townOwner, 1);
});

test('komputer nie celuje w sojuszników; tydzień gry drużynami bez walk wewnątrz drużyn', async () => {
  await teamGame([1, 2, 1, 2], ['human', 'ai', 'ai', 'ai'], 44);
  const r = await page.evaluate(() => { const st = G.state, battles = [], cb = window.createBattle;
    window.createBattle = (s, h, foe) => { const B = cb(s, h, foe); battles.push([h.owner, B.sides[1].owner]); return B; };
    for (let d = 0; d < 10; d++) { G.screens.adventure.doEndTurn(); if (G.modal) G.modal = null; }
    window.createBattle = cb; return { inTeam: battles.filter(([a, b]) => b >= 0 && allied(st, a, b)).length, total: battles.length, peace: aiPeace(st, 0, 2), war: aiPeace(st, 3, 2) && st.dayTotal > truceDays(st) }; });
  assert.equal(r.inTeam, 0, `bitwy w drużynie: ${r.inTeam} z ${r.total}`); assert.equal(r.peace, true); assert.equal(r.war, false);
});

test('koniec gry: zostaje jedna drużyna – zwycięstwo (hot-seat i gra z komputerem-sojusznikiem)', async () => {
  await teamGame([1, 1, 2, 2], ['human', 'human', 'ai', 'ai']);
  let r = await page.evaluate(() => { const st = G.state; for (const p of st.players.slice(2)) eliminate(st, p); return { res: gameResult(st), winTeam: teamOf(st, st.winner) }; });
  assert.deepEqual(r, { res: 'win', winTeam: 1 });
  await teamGame([1, 1, 2, 0], ['human', 'ai', 'ai', 'ai']);
  r = await page.evaluate(() => { const st = G.state; eliminate(st, st.players[2]); const mid = gameResult(st); eliminate(st, st.players[3]); return { mid, end: gameResult(st) }; });
  assert.deepEqual(r, { mid: null, end: 'win' }, 'sojusznik komputerowy zostaje, a gra jest wygrana');
});

test('ekran nowej gry: przycisk drużyny przełącza brak → 1 → 2 → 3 → 4 → brak', async () => {
  const saved = await page.evaluate(() => JSON.stringify(G.settings.slots));
  await page.evaluate(() => setScreen('setup', {})); await frames(page, 2);
  const r = await page.evaluate(() => { const s = G.screens.setup, o = G.settings.slots[0], seq = []; o.team = 0; for (let k = 0; k < 5; k++) { s.slotBtns[0].tm.action(); seq.push(o.team); } return { seq, tip: s.slotBtns[0].tm.tip }; });
  assert.deepEqual(r.seq, [1, 2, 3, 4, 0]); assert.match(r.tip, /drużyny|Bez drużyny/);
  await page.evaluate(s => { G.settings.slots = JSON.parse(s); }, saved);
});
