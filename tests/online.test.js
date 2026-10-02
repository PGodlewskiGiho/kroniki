// Gra online: dwie przeglądarki łączą się przez lokalny serwer PeerJS (w grze domyślnie darmowy serwer PeerJS).
// Pokój z kodem, start gry, podgląd tury na żywo, przekazanie tury, wspólna bitwa i powrót po rozłączeniu.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http'), express = require('express'), { ExpressPeerServer } = require('peer');
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const GAME_URL = pathToFileURL(path.join(__dirname, '..', 'Kroniki Królestw.html')).href;

const PORT = 9131, PEER = { host: '127.0.0.1', port: PORT, path: '/kk', secure: false, config: { iceServers: [] } };
let server, browser, A, B; // A = gospodarz, B = gość (dwie karty jednej przeglądarki)
const LOG = process.env.NET_LOG, L = m => { if (LOG) fs.appendFileSync(LOG, new Date().toISOString().slice(11, 19) + ' ' + m + '\n'); };
const until = async (page, fn, arg, ms = 20000) => { L('wait ' + String(fn).slice(6, 70)); await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); L('ok'); };

test.before(async () => {
  L('before');
  const app = express(); server = http.createServer(app); app.use('/kk', ExpressPeerServer(server, { path: '/' }));
  await new Promise(ok => server.listen(PORT, '127.0.0.1', ok));
  const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : null);
  browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } }), errors = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    await page.goto(GAME_URL); await page.waitForFunction(() => typeof G !== 'undefined' && G.screen && unitArtReady());
    await page.evaluate(o => { window.KK_PEER = o; }, PEER); return { page, errors };
  };
  A = await open(); B = await open(); L('pages');
});
test.after(async () => { if (browser) await browser.close(); if (server) { server.closeAllConnections(); server.close(); } });
test.afterEach(() => { for (const g of [A, B]) { const e = g.errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); } });

test('pokój: gospodarz z kodem, gość dołącza i widzi listę graczy', async () => {
  assert.equal(await A.page.evaluate(async () => { Net.name = 'Ala'; G.go('online'); return Net.hostGame('TESTA'); }), true);
  await B.page.evaluate(() => { Net.name = 'Bob'; G.go('online'); Net.join('TESTA', 'Bob'); });
  await until(A.page, () => Net.guests.length === 1 && Net.guests[0].conn && Net.guests[0].conn.open);
  await until(B.page, () => Net.lobby && Net.lobby.players.length === 1);
  assert.deepEqual(await B.page.evaluate(() => [Net.lobby.host, Net.lobby.players[0].name]), ['Ala', 'Bob']);
});

test('czat: wiadomość gospodarza dociera do gościa', async () => {
  await A.page.evaluate(() => { Net.send({ t: 'chat', from: 'Ala', text: 'Cześć!' }); netChatAdd('Ala', 'Cześć!'); });
  await until(B.page, () => NetChat.lines.some(l => l.from === 'Ala' && l.text === 'Cześć!'));
});

test('start gry: gość dostaje świat i ogląda turę gospodarza, podgląd zmian na żywo', async () => {
  await A.page.evaluate(() => {
    const S = G.settings; S.mapSize = 'S'; S.slots.forEach((o, i) => { o.type = i < 2 ? 'human' : 'off'; o.faction = 'haven'; }); S.slots[2].type = 'ai';
    G.go('setup', { online: true });
  });
  await until(A.page, () => G.screenName === 'setup');
  await A.page.evaluate(() => G.screen.start());
  await until(A.page, () => G.screenName === 'adventure' && G.state && G.state.online);
  await until(B.page, () => G.screenName === 'adventure' && G.state && G.state.online);
  const r = await B.page.evaluate(() => ({ me: ME, cur: G.state.cur, watching: G.screens.adventure.watching, name: G.state.players[ME].name }));
  assert.deepEqual(r, { me: 1, cur: 0, watching: true, name: 'Bob' });
  await A.page.evaluate(() => { G.modal = null; G.state.players[0].resources.gold = 77777; });
  await until(B.page, () => G.state.players[0].resources.gold === 77777);
});

test('koniec tury przekazuje grę gościowi (z turą komputera po drodze), potem z powrotem', async () => {
  await A.page.evaluate(() => { G.modal = null; G.screens.adventure.doEndTurn({ live: true }); });
  await until(B.page, () => G.state.cur === ME && !G.screens.adventure.watching, null, 40000);
  await until(A.page, () => G.screens.adventure.watching);
  const day = await B.page.evaluate(() => G.state.dayTotal);
  await B.page.evaluate(() => { G.modal = null; G.screens.adventure.doEndTurn({ live: true }); });
  await until(A.page, () => G.state.cur === ME && !G.screens.adventure.watching, null, 40000);
  assert.ok(await A.page.evaluate(d => G.state.dayTotal > d, day));
});

test('bitwa na żywo: każdy dowodzi swoją stroną, obaj liczą to samo', async () => {
  await A.page.evaluate(() => {
    G.modal = null; const st = G.state, a = st.heroes.find(h => h.owner === 0), b = st.heroes.find(h => h.owner === 1);
    a.army = [{ cid: 'archer', n: 60 }, { cid: 'archer', n: 60 }, null, null, null, null, null]; b.army = [{ cid: 'pikeman', n: 6 }, null, null, null, null, null, null];
    b.x = a.x + 1; b.y = a.y; rebuildObjIndex(st); netBattle(st, a, b);
  });
  await until(A.page, () => G.screenName === 'battle'); await until(B.page, () => G.screenName === 'battle');
  // każdy wydaje rozkazy swoim oddziałom: łucznicy strzelają, piechota się broni
  const drive = page => page.evaluate(() => { const s = G.screens.battle; if (G.screenName !== 'battle' || s.phase !== 'input' || G.modal) return;
    const B = s.B, u = B.active, foe = B.units.find(v => !v.dead && v.side !== u.side && targetable(v)); if (canShoot(B, u) && foe) s.order({ a: 'shoot', t: B.units.indexOf(foe) }); else s.order({ a: 'def' }); });
  for (let i = 0; i < 400; i++) {
    await drive(A.page); await drive(B.page);
    const done = await A.page.evaluate(() => G.screens.battle.phase === 'over' || G.screens.battle.phase === 'done'); if (done) break;
    await A.page.waitForTimeout(100);
  }
  const sum = page => page.evaluate(() => G.screens.battle.B.units.map(u => `${u.cid}:${u.n}:${u.dead ? 1 : 0}`).join(','));
  await until(B.page, () => ['over', 'done'].includes(G.screens.battle.phase));
  assert.equal(await sum(A.page), await sum(B.page)); // ta sama bitwa u obu
  assert.equal(await A.page.evaluate(() => G.screens.battle.B.units.filter(u => u.side === 1 && !u.dead).length), 0);
  // po bitwie: prowadzący wraca na mapę, gość dostaje stan bez pokonanego bohatera
  await A.page.evaluate(() => { const s = G.screens.battle; if (s.phase === 'over') s.finish(false); });
  await until(A.page, () => !!G.modal); await A.page.evaluate(() => G.modal.buttons[0].action());
  await until(B.page, () => !!G.modal && G.screenName === 'battle'); await B.page.evaluate(() => G.modal.buttons[0].action());
  await until(B.page, () => G.screenName === 'adventure' && !G.state.heroes.some(h => h.owner === 1 && h.army.some(x => x && x.cid === 'pikeman' && x.n === 6)), null, 20000);
});

test('Auto w bitwie online: komputer dowodzi za gracza, obie strony liczą to samo', async () => {
  await A.page.evaluate(() => {
    G.modal = null; const st = G.state, a = st.heroes.find(h => h.owner === 0), b = st.heroes.find(h => h.owner === 1) || createHero(st, 1, a.x + 1, a.y);
    a.army = [{ cid: 'swordsman', n: 30 }, null, null, null, null, null, null]; b.army = [{ cid: 'pikeman', n: 8 }, null, null, null, null, null, null];
    b.x = a.x + 1; b.y = a.y; rebuildObjIndex(st); netBattle(st, a, b);
  });
  await until(A.page, () => G.screenName === 'battle'); await until(B.page, () => G.screenName === 'battle');
  for (const g of [A, B]) await g.page.evaluate(() => { const s = G.screens.battle; s.myAuto = true; if (s.phase === 'input') s.order({ a: 'ai' }); });
  await until(A.page, () => ['over', 'done'].includes(G.screens.battle.phase), null, 60000); await until(B.page, () => ['over', 'done'].includes(G.screens.battle.phase), null, 60000);
  const sum = page => page.evaluate(() => G.screens.battle.B.units.map(u => `${u.cid}:${u.n}:${u.dead ? 1 : 0}`).join(','));
  assert.equal(await sum(A.page), await sum(B.page));
  await A.page.evaluate(() => { const s = G.screens.battle; if (s.phase === 'over') s.finish(false); }); await until(A.page, () => !!G.modal); await A.page.evaluate(() => G.modal.buttons[0].action());
  await until(B.page, () => !!G.modal && G.screenName === 'battle'); await B.page.evaluate(() => G.modal.buttons[0].action()); await until(B.page, () => G.screenName === 'adventure');
});

test('rozłączenie gościa: wraca sam i dostaje aktualny stan', async () => {
  await A.page.evaluate(() => { G.modal = null; G.state.players[0].resources.gold = 4242; });
  await until(B.page, () => G.state.players[0].resources.gold === 4242);
  await B.page.evaluate(() => Net.host.close());
  await until(A.page, () => !Net.guests[0].conn);
  await A.page.evaluate(() => { G.state.players[0].resources.gold = 5151; });
  await until(A.page, () => Net.guests[0].conn && Net.guests[0].conn.open, null, 20000);
  await until(B.page, () => G.state.players[0].resources.gold === 5151, null, 20000);
});

test('komputer atakuje gracza online: wspólna bitwa, strona komputera liczona u obu', async () => {
  await A.page.evaluate(() => {
    G.modal = null; const st = G.state, ai = st.heroes.find(h => !st.players[h.owner].human), b = st.heroes.find(h => h.owner === 1) || createHero(st, 1, ai.x + 1, ai.y); // bohater gościa poległ w poprzedniej bitwie: nowy
    ai.army = [{ cid: 'swordsman', n: 40 }, null, null, null, null, null, null]; b.army = [{ cid: 'pikeman', n: 5 }, null, null, null, null, null, null];
    b.x = ai.x + 1; b.y = ai.y; rebuildObjIndex(st); window.__res = null;
    netBattle(st, ai, b, res => { window.__res = res.outcome; G.go('adventure'); });
  });
  await until(B.page, () => G.screenName === 'battle');
  for (let i = 0; i < 400; i++) {
    await B.page.evaluate(() => { const s = G.screens.battle; if (G.screenName === 'battle' && s.phase === 'input' && !G.modal) s.order({ a: 'def' }); });
    if (await A.page.evaluate(() => window.__res != null)) break; await A.page.waitForTimeout(100);
  }
  assert.equal(await A.page.evaluate(() => window.__res), 'win');
  await until(B.page, () => !!G.modal); await B.page.evaluate(() => G.modal.buttons[0].action());
  await until(B.page, () => G.screenName === 'adventure');
});

test('gospodarz wznawia grę po przeładowaniu: ten sam kod, gość wraca sam', async () => {
  await A.page.evaluate(async () => { G.state.players[0].resources.gold = 6262; await Net.saveHost(G.state); });
  await A.page.waitForTimeout(300);
  await A.page.evaluate(() => { const last = Net.recalled(); Net.close(); G.state = null; window.__last = last; });
  await until(B.page, () => !Net.host, null, 20000);
  await A.page.evaluate(() => G.screens.online.resumeHost(window.__last));
  await until(A.page, () => G.screenName === 'adventure' && G.state && G.state.players[0].resources.gold === 6262, null, 20000);
  await until(B.page, () => Net.host && G.state.players[0].resources.gold === 6262, null, 30000);
});
