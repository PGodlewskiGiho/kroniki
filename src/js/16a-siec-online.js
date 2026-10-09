// ==================== GRA ONLINE ==========================================================
// Połączenia WebRTC przez PeerJS (bez własnego serwera: darmowy serwer PeerJS tylko kojarzy przeglądarki).
// Gwiazda: gospodarz zakłada pokój z kodem (np. KRL7F), goście łączą się z nim, a on przekazuje wiadomości dalej.
// Zasady: gra toczy się u tego, czyja jest tura (st.cur). Jego przeglądarka liczy turę, potem tury komputera, i wysyła
// cały stan gry (spakowany gzipem) z następnym graczem. Pozostali oglądają mapę: co chwilę dostają stan, a kroki bohaterów
// na bieżąco (płynny ruch). Bitwa człowieka z człowiekiem: obaj liczą tę samą bitwę (ten sam stan i ziarno losowania),
// przesyłając tylko rozkazy. ME = gracz przy tym ekranie (stały), st.cur = gracz, którego jest tura.
// Testy podmieniają serwer kojarzący: window.KK_PEER = { host, port, path, secure }.
const NET_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const Net = {
  peer: null, role: null, code: null, guests: [], host: null, me: -1, name: '', status: '', err: '', inGame: false,
  seq: 0, inSeq: 0, sendQ: Promise.resolve(), lastPacked: null, lastSyncT: 0, lastSyncKey: '', battleQ: null, retry: null, pendingTurn: null,
  pick() { return netPick(G.settings.netPick || {}); }, // frakcja i bohater, które gość wybiera sobie w poczekalni
  token() { let t = null; try { t = localStorage.getItem('kk_net_token'); } catch (e) {} if (!t) { t = Math.random().toString(36).slice(2) + Date.now().toString(36); try { localStorage.setItem('kk_net_token', t); } catch (e) {} } return t; },
  peerOpts() { return Object.assign({ debug: 0 }, window.KK_PEER || {}); },
  peerId(code) { return 'kroniki-krolestw-' + code.toLowerCase(); },
  newCode() { let s = ''; for (let i = 0; i < 5; i++) s += NET_CODE_CHARS[Math.floor(Math.random() * NET_CODE_CHARS.length)]; return s; },
  available() { return typeof Peer !== 'undefined'; },
  online(st = G.state) { return !!(this.inGame && st && st.online); },
  myTurn(st = G.state) { return !this.online(st) || st.cur === ME; },
  remember(o) { try { localStorage.setItem('kk_net_last', JSON.stringify(o)); } catch (e) {} },
  recalled() { try { return JSON.parse(localStorage.getItem('kk_net_last') || 'null'); } catch (e) { return null; } },
  // --- pakowanie stanu gry: JSON + gzip (mniej więcej 10 razy mniej danych) ---
  async pack(st) {
    const json = JSON.stringify(serializeGame(st));
    if (typeof CompressionStream === 'undefined') return { z: 0, s: json };
    const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
    return { z: 1, b: new Uint8Array(buf) };
  },
  // Stan od innego gracza: najwyżej NET_MAX bajtów po rozpakowaniu (spreparowana „bomba” gzip nie zapcha pamięci)
  async unpack(p) {
    if (!p || typeof p !== 'object') throw new Error('zły stan gry');
    let json = p.s;
    if (p.z) { const rd = new Blob([p.b]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(), parts = []; let n = 0;
      for (;;) { const { done, value } = await rd.read(); if (done) break; n += value.length; if (n > NET_MAX) { rd.cancel(); throw new Error('za duży stan gry'); } parts.push(value); }
      json = new TextDecoder().decode(await new Blob(parts).arrayBuffer()); }
    if (typeof json !== 'string' || json.length > NET_MAX) throw new Error('za duży stan gry');
    return JSON.parse(json);
  },
  // --- połączenia ---
  close() {
    clearTimeout(this.retry); this.retry = null;
    if (this.peer) { try { this.peer.destroy(); } catch (e) {} }
    Object.assign(this, { peer: null, role: null, host: null, guests: [], inGame: false, status: '', err: '', battleQ: null });
  },
  hostGame(code, resume) {
    this.close(); this.role = 'host'; this.code = code || this.newCode(); this.status = 'Zakładanie pokoju…'; this.err = '';
    if (resume) { this.guests = resume.guests.map(g => ({ ...g, conn: null })); }
    return new Promise(ok => {
      const peer = this.peer = new Peer(this.peerId(this.code), this.peerOpts());
      peer.on('open', () => { this.status = `Pokój otwarty. Kod gry: ${this.code}`; G.dirty = true; ok(true); });
      peer.on('connection', conn => this.hostConn(conn));
      peer.on('error', e => {
        if (e.type === 'unavailable-id' && !resume) { this.close(); this.hostGame().then(ok); return; } // kod zajęty: losujemy inny
        this.err = netErrText(e); G.dirty = true; ok(false);
      });
      peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1500); });
    });
  },
  hostConn(conn) {
    conn.on('data', m => this.hostData(conn, m));
    conn.on('close', () => { const g = this.guests.find(g => g.conn === conn); if (g) { g.conn = null; this.lobbyUpdate(); if (this.inGame) { netFlash(`${g.name} rozłączył się. Może wrócić; jego tury może też rozegrać komputer (Menu).`); netAbsent(g.pid); } } });
  },
  hostData(conn, m) {
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return; // wiadomości od innych graczy: tylko obiekty naszego protokołu
    if (m.t === 'hello') {
      const tok = String(m.token).slice(0, 64); let g = this.guests.find(g => g.token === tok);
      if (!g) {
        if (this.inGame) { conn.send({ t: 'deny', why: 'Ta gra już trwa.' }); setTimeout(() => conn.close(), 500); return; }
        g = { token: tok, name: netName(m.name) || `Gracz ${this.guests.length + 2}`, pid: -1 }; this.guests.push(g);
      }
      if (g.conn && g.conn !== conn) { try { g.conn.close(); } catch (e) {} }
      g.conn = conn; if (netName(m.name)) g.name = netName(m.name); if (!this.inGame) Object.assign(g, netPick(m)); this.lobbyUpdate();
      const st = this.inGame && G.state, P = st && st.players[g.pid];
      if (P && P.away) { P.human = true; P.away = false; } // wrócił: jego tury znów rozgrywa on, nie komputer
      if (st && m.turn && st.cur === g.pid) { // turę zakończył bez połączenia: przyjmujemy ją, jeśli gra wciąż na niego czekała
        this.lastPacked = m.turn; this.seq++; for (const o of this.guests) if (o !== g && o.conn) o.conn.send({ t: 'state', kind: 'turn', d: m.turn, seq: this.seq });
        this.onData({ t: 'state', kind: 'turn', d: m.turn });
      }
      if (this.inGame && this.lastPacked) { conn.send({ t: 'state', kind: 'resume', d: this.lastPacked, you: g.pid, seq: this.seq }); netFlash(`${g.name} wrócił do gry.`); }
      return;
    }
    if (m.t === 'pick') { const g = this.guests.find(g => g.conn === conn); if (g && !this.inGame) { Object.assign(g, netPick(m)); this.lobbyUpdate(); } return; } // gość wybrał frakcję i bohatera
    if (m.to != null && m.to !== this.me) { const g = this.guests.find(g => g.pid === m.to); if (g && g.conn) g.conn.send(m); return; } // wiadomość do konkretnego gracza: dalej
    if (m.to == null && (m.t === 'state' || m.t === 'step' || m.t === 'chat')) for (const g of this.guests) if (g.conn && g.conn !== conn) g.conn.send(m); // do wszystkich: rozsyłamy pozostałym gościom
    if (m.t === 'state') this.lastPacked = m.d;
    if (m.t === 'end') return; // koniec gry ogłasza tylko gospodarz
    this.onData(m);
  },
  join(code, name) {
    this.close(); this.role = 'guest'; this.code = code.toUpperCase().replace(/[^A-Z0-9]/g, ''); this.name = name; this.status = 'Łączenie…'; this.err = '';
    this.remember({ role: 'guest', code: this.code, name });
    const peer = this.peer = new Peer(undefined, this.peerOpts());
    peer.on('open', () => this.connectHost());
    peer.on('error', e => { if (e.type === 'peer-unavailable') { this.err = this.inGame ? '' : `Nie ma gry o kodzie ${this.code}.`; this.scheduleRetry(); } else this.err = netErrText(e); G.dirty = true; });
    peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1500); });
  },
  connectHost() {
    if (!this.peer || this.peer.destroyed) return;
    const conn = this.peer.connect(this.peerId(this.code), { reliable: true });
    conn.on('open', () => { this.host = conn; this.err = ''; this.status = this.inGame ? 'Połączono ponownie.' : `Połączono z grą ${this.code}. Czekaj, aż gospodarz ją rozpocznie.`; conn.send({ t: 'hello', token: this.token(), name: this.name, ...this.pick(), turn: this.pendingTurn }); G.dirty = true; });
    conn.on('data', m => this.onData(m));
    conn.on('close', () => { if (this.host === conn) { this.host = null; this.status = 'Utracono połączenie z gospodarzem. Ponawiam…'; netFlash(this.status); this.scheduleRetry(); } });
  },
  scheduleRetry() { if (this.role !== 'guest' || this.retry) return; this.retry = setTimeout(() => { this.retry = null; if (!this.host) this.connectHost(); }, 3000); },
  // wysyłka: gość zawsze przez gospodarza; to = numer gracza albo wszyscy
  send(m, to = null) {
    if (to != null) m.to = to;
    if (this.role === 'guest') { if (this.host && this.host.open) this.host.send(m); return; }
    for (const g of this.guests) if (g.conn && g.conn.open && (to == null || g.pid === to)) g.conn.send(m);
  },
  lobbyUpdate() { G.dirty = true; if (this.role === 'host') this.send({ t: 'lobby', host: this.name, players: this.guests.map(g => ({ name: g.name, on: !!g.conn, faction: g.faction || 'random', hero: g.hero || 'random' })) }); },
  sendPick() { if (this.role === 'guest') this.send({ t: 'pick', ...this.pick() }); },
  guestOn(pid) { return this.guests.some(g => g.pid === pid && g.conn); }, // gospodarz: czy gracz pid jest połączony
  // --- gra ---
  // Gospodarz: nowa gra gotowa (createNewGame) -> ludzie po kolei: gospodarz, potem goście w kolejności dołączenia
  async startGame(st) {
    const humans = st.players.filter(p => p.human);
    st.online = { code: this.code }; this.me = humans[0].id; humans[0].name = humans[0].name || this.name || '';
    this.guests.forEach((g, i) => { const p = humans[i + 1]; g.pid = p ? p.id : -1; if (p) p.name = g.name; });
    ME = this.me; this.inGame = true;
    const d = await this.pack(st); this.lastPacked = d; this.seq++;
    for (const g of this.guests) if (g.conn) g.conn.send({ t: 'state', kind: 'start', d, you: g.pid, seq: this.seq });
    this.saveHost(st);
  },
  saveHost(st) { if (this.role === 'host') this.remember({ role: 'host', code: this.code, name: this.name, me: this.me, guests: this.guests.map(g => ({ token: g.token, name: g.name, pid: g.pid })) }); if (st) SaveStore.write('online', st).catch(() => {}); },
  // Wysłanie stanu: 'turn' (koniec tury, gra przechodzi dalej) albo 'sync' (podgląd w trakcie tury)
  sendState(st, kind) {
    const seq = ++this.seq;
    this.sendQ = this.sendQ.then(async () => { const d = await this.pack(st); if (this.role === 'host') this.lastPacked = d;
      if (this.role === 'guest' && kind === 'turn' && !(this.host && this.host.open)) this.pendingTurn = d; // bez połączenia: tura pójdzie do gospodarza przy powrocie
      this.send({ t: 'state', kind, d, seq, from: ME }); if (kind === 'turn') this.saveHost(st); }).catch(() => {});
    return this.sendQ;
  },
  computing(st = G.state) { return this.online(st) && (st.cur === ME || !!G.screens.adventure.aiRun); }, // ta przeglądarka liczy teraz grę (swoja tura albo tury komputera po niej)
  step(h, fx, fy) { if (this.computing()) this.send({ t: 'step', id: h.id, fx, fy, x: h.x, y: h.y }); },
  // co klatkę: w swojej turze (i licząc tury komputera) co sekundę stan dla oglądających, jeśli coś się zmieniło
  tick() {
    const st = G.state; if (!this.computing(st)) return;
    if (G.time - this.lastSyncT < 1 || st.heroes.some(h => h.anim)) return; this.lastSyncT = G.time;
    const key = JSON.stringify([st.dayTotal, st.cur, st.heroes.map(h => [h.id, h.x, h.y, h.mp, armySize(h.army)]), st.towns.map(t => [t.owner, t.built.length]), st.objects.filter(o => o.dead).length, st.players.map(p => RESOURCES.map(r => p.resources[r.id]).join())]);
    if (key === this.lastSyncKey) return; this.lastSyncKey = key; this.sendState(st, 'sync');
  },
  async onData(m) {
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    if (m.t === 'lobby') { this.lobby = m; G.dirty = true; return; }
    if (m.t === 'chat') { netChatAdd(m.from, m.text); return; }
    if (m.t === 'deny') { this.err = m.why; this.close(); G.dirty = true; return; }
    if (m.t === 'end') { if (this.role === 'guest') netEnded(); return; }
    if (m.t === 'step') { netStep(m); return; }
    if (m.t === 'bcmd') { if (this.battleQ) this.battleQ.push(m.c); return; }
    if (m.t === 'bstart') { await netBattleStart(m); return; }
    if (m.t === 'state') {
      if (m.you != null) this.me = m.you; if (m.kind === 'resume') this.pendingTurn = null;
      if (m.seq != null && m.kind === 'sync' && m.seq < this.inSeq) return; this.inSeq = Math.max(this.inSeq, m.seq || 0);
      const d = await this.unpack(m.d); netApplyState(d, m.kind); return;
    }
  },
};
// Czat: T (albo przycisk w poczekalni) otwiera pole wiadomości; ostatnie wiadomości widać w rogu ekranu przez 15 s
const NetChat = { lines: [] };
const NET_MAX = 64 * 1024 * 1024, netName = v => (v == null ? '' : String(v).replace(/[\u0000-\u001f]/g, '').slice(0, 24));
// Wybór gościa: frakcja z listy (albo losowa) i bohater tej frakcji (albo losowy)
function netPick(m) {
  const faction = FACTIONS.some(f => f.id === m.faction) ? m.faction : 'random', hero = faction !== 'random' && factionOf(faction).heroes.some(([n]) => n === m.hero) ? m.hero : 'random';
  return { faction, hero };
}
// Gospodarz: tura gracza, który się rozłączył – okno z wyborem (czekać, komputer gra za niego, koniec gry); nikt nie jest uwięziony
function netAbsent(pid) {
  const a = G.screens.adventure, st = G.state;
  if (Net.role !== 'host' || !Net.online(st) || st.cur !== pid || pid === ME || Net.guestOn(pid) || !st.players[pid].human) return;
  if (G.screen !== a || a.aiRun || G.modal) { setTimeout(() => netAbsent(pid), 1000); return; } // otwarte okno albo inny ekran: zapytamy, gdy się zamknie
  const key = `${pid}:${st.dayTotal}`; if (Net.absentAsked === key) return; Net.absentAsked = key; // „Czekaj” – w tej turze już nie pytamy (zostaje Menu)
  const nm = cap1(playerName(st, pid));
  showDialog(`${nm} jest rozłączony, a teraz jego tura. Możesz poczekać na jego powrót, oddać jego tury komputerowi (gdy wróci, znów gra sam) albo zakończyć grę – stan zostaje zapisany i da się ją wznowić.`, [
    { label: 'Czekaj', key: 'escape' }, { label: 'Komputer gra', key: 'k', action: () => a.netTakeOver(pid) }, { label: 'Zakończ grę', key: 'z', action: () => netEndGame() }]);
}
const netPickText = g => (g.faction && g.faction !== 'random' ? ` – ${factionOf(g.faction).name}${g.hero && g.hero !== 'random' ? `, ${g.hero}` : ''}` : ' – frakcja losowa');
// Gospodarz kończy grę online: goście dostają wiadomość, stan zostaje (Gra online → Wznów grę)
function netEndGame() { if (Net.role === 'host') { Net.saveHost(G.state); Net.send({ t: 'end' }); } setTimeout(() => G.go('menu'), 300); }
function netEnded() {
  G.modal = null; Net.close();
  showDialog('Gospodarz zakończył grę. Jej stan jest zapisany u niego – gdy ją wznowi, wrócisz przez „Gra online” → „Wróć do gry”.', [{ label: 'OK', key: 'enter', action: () => G.go('menu') }], { locked: true });
}
function netChatAdd(from, txt) { NetChat.lines.push({ from: netName(from), text: String(txt).slice(0, 120), t: G.time }); NetChat.lines = NetChat.lines.slice(-30); Sfx.play('page', { vol: 0.3 }); G.dirty = true; }
function netChatOpen() {
  if (!Net.peer || G.modal) return;
  askText('Wiadomość do graczy:', '', v => { v = (v || '').trim(); if (!v) return; const from = Net.name || (G.state && G.state.players[ME] ? playerName(G.state, ME) : 'Ty'); Net.send({ t: 'chat', from, text: v }); netChatAdd(from, v); }, 120);
}
function drawNetChat(ctx) {
  if (!Net.peer) return; const now = G.time, show = NetChat.lines.filter(l => now - l.t < 15).slice(-6); if (!show.length) return;
  ctx.save(); ctx.font = font(14, 600, 'body'); let y = VH - 70 - show.length * 20;
  for (const l of show) {
    const a = clamp(15 - (now - l.t), 0, 1), s = `${l.from}: ${l.text}`, w = Math.min(VW * 0.5, ctx.measureText(s).width + 16);
    ctx.globalAlpha = a * 0.75; ctx.fillStyle = '#140c06'; ctx.fillRect(12, y - 14, w, 19); ctx.globalAlpha = a;
    text(ctx, s, 20, y, { size: 14, weight: 600, color: '#ffe8b0' }); y += 20;
  }
  ctx.restore(); G.dirty = true;
}
function netErrText(e) {
  const t = e && e.type;
  return t === 'network' || t === 'server-error' || t === 'socket-error' ? 'Brak połączenia z serwerem gry online. Sprawdź internet.' : t === 'browser-incompatible' ? 'Ta przeglądarka nie obsługuje gry online.' : `Błąd połączenia (${t || e}).`;
}
function netFlash(msg) { const a = G.screens.adventure; if (G.screen === a) a.flash(msg); }
// Nowy stan od innego gracza: start gry, powrót po rozłączeniu, podgląd tury albo koniec tury (przejście kolejki)
function netApplyState(d, kind) {
  if (G.screenName === 'battle') { Net.pending = [d, kind]; return; } // w trakcie wspólnej bitwy (i jej wyniku) stan poczeka na powrót na mapę
  if (G.fade.next) { setTimeout(() => netApplyState(d, kind), 150); return; } // trwa przejście ekranu (G.go nic by nie zrobił): stan poczeka chwilę
  const old = G.state, st = deserializeGame(d); ME = Net.me; Net.inGame = true;
  const same = old && old.online && old.map.n === st.map.n && old.map.seed === st.map.seed;
  if (same) { // ta sama gra: zostaje mapa (namalowany teren), moja mgła wojny i kamera
    st.map = old.map; if (old.players[ME] && st.players[ME]) st.players[ME].explored = old.players[ME].explored; st.cam = old.cam; rebuildObjIndex(st);
  } else st.cam = null;
  st.selHero = Math.max(0, st.heroes.findIndex(x => x.owner === ME)); if (same && old.heroes[old.selHero] && old.heroes[old.selHero].owner === ME) { const i = st.heroes.findIndex(x => x.id === old.heroes[old.selHero].id); if (i >= 0) st.selHero = i; }
  G.state = st;
  if (G.screenName !== 'adventure' || !same) { G.modal = null; G.go('adventure', { welcome: st.cur === ME, netKind: kind }); return; }
  G.screens.adventure.netUpdate(st, kind);
}
// Krok bohatera innego gracza: płynny ruch na mapie oglądającego
function netStep(m) {
  const st = G.state; if (!st || st.cur === ME) return; const h = st.heroes.find(x => x.id === m.id); if (!h) return;
  h.x = m.x; h.y = m.y; h.anim = { fx: m.fx, fy: m.fy, t: 0, d: STEP_TIME }; G.dirty = true;
}
// Bitwa z człowiekiem online: ten, czyja jest tura (lead), wysyła obrońcy stan i początek bitwy; obaj liczą ją tak samo
async function netBattle(st, h, foe, onDone) {
  const D = battleSide(st, foe), d = await Net.pack(st), ref = st.towns.includes(foe) ? { kind: 'town', id: st.towns.indexOf(foe) } : { kind: 'hero', id: foe.id };
  Net.send({ t: 'bstart', d, h: h.id, prev: h.prev || null, foe: ref, lead: ME }, D.owner); // lead: kto prowadzi bitwę (do niego wracają rozkazy, także gdy atakuje komputer)
  Net.battleQ = []; G.modal = null;
  G.go('battle', { battle: createBattle(st, h, foe), net: { lead: true, foe: D.owner }, onDone });
}
async function netBattleStart(m) {
  const st = deserializeGame(await Net.unpack(m.d)); ME = Net.me; Net.inGame = true;
  const h = st.heroes.find(x => x.id === m.h), foe = m.foe.kind === 'town' ? st.towns[m.foe.id] : st.heroes.find(x => x.id === m.foe.id);
  if (!h || !foe) return; h.prev = m.prev; if (G.state && G.state.online) st.cam = G.state.cam;
  G.state = st; Net.battleQ = []; G.modal = null;
  G.go('battle', { battle: createBattle(st, h, foe), net: { lead: false, foe: m.lead } });
}
// Gracz online, z którym toczy się bitwa (ludzki właściciel drugiej strony), albo -1
const netHumanOwner = (st, owner) => (Net.online(st) && owner >= 0 && owner !== ME && st.players[owner] && st.players[owner].human ? owner : -1);

// ---------- ekran: gra online (pokój, dołączanie, wznowienie) ----------
G.screens.online = {
  fps: smoothFps, backdrop() {}, buttons: [], mode: 'start',
  enter(p) {
    Net.name = Net.name || (G.settings.netName || '');
    this.setMode(p.mode || (Net.role === 'host' && !Net.inGame ? 'host' : Net.role === 'guest' && !Net.inGame ? 'guest' : 'start'));
  },
  setMode(m) {
    this.mode = m; const B = [], btn = (y, label, act, o = {}) => B.push(new Button(290, y, 220, 44, label, act, Object.assign({ size: 17 }, o)));
    if (m === 'start') {
      const last = Net.recalled();
      btn(196, 'Utwórz grę', () => this.create(), { key: 'u', primary: true, tip: 'Załóż pokój i podaj kod znajomym. Potem wybierzesz mapę i miejsca graczy.' });
      btn(248, 'Dołącz do gry', () => askText('Kod gry od gospodarza (5 znaków):', '', v => { if (v) this.joinCode(v); }, 8), { key: 'd' });
      let y = 300;
      if (last && last.role === 'host') { btn(y, `Wznów grę (${last.code})`, () => this.resumeHost(last), { tip: 'Otwiera ponownie pokój ostatniej gry online z jej ostatnim stanem. Goście połączą się sami.' }); y += 52; }
      if (last && last.role === 'guest') { btn(y, `Wróć do gry ${last.code}`, () => this.joinCode(last.code), { tip: 'Ponowne dołączenie do ostatniej gry online.' }); y += 52; }
      btn(y, `Imię: ${Net.name || '—'}`, () => askText('Twoje imię w grze online:', Net.name, v => { Net.name = v; G.settings.netName = v; saveSettings(); this.setMode('start'); }), { size: 15 }); y += 52;
      btn(y, 'Wróć', () => { Net.close(); G.go('menu'); }, { key: 'escape' });
    } else if (m === 'host') {
      btn(368, 'Czat (T)', () => netChatOpen(), { size: 15 });
      btn(420, 'Wybierz mapę i graj', () => G.go('setup', { online: true }), { key: 'enter', primary: true, tip: 'Ustawienia nowej gry. Miejsc „Człowiek” musi być tyle, ilu jest graczy w pokoju.' });
      btn(472, 'Zamknij pokój', () => { Net.close(); this.setMode('start'); }, { key: 'escape' });
    } else { // gość: gospodarz ustawia świat i zasady, a frakcję (zamek) i bohatera każdy wybiera sobie sam
      const set = o => { G.settings.netPick = Object.assign(Net.pick(), o); saveSettings(); Net.sendPick(); };
      const fa = new Button(170, 196, 225, 44, '', () => { const ids = ['random', ...FACTIONS.map(f => f.id)]; set({ faction: ids[(ids.indexOf(Net.pick().faction) + 1) % ids.length], hero: 'random' }); },
        { size: 15, lead: (ctx, cx, cy) => factionMedal(ctx, Net.pick().faction, cx, cy, 30) });
      Object.defineProperty(fa, 'label', { get: () => { const f = Net.pick().faction; return f === 'random' ? 'Frakcja: losowa' : factionOf(f).name; }, set() {} });
      Object.defineProperty(fa, 'tip', { get: () => { const f = Net.pick().faction; return `Twoja frakcja (zamek)${f === 'random' ? ': losowa' : ` – ${factionOf(f).name}: ${factionOf(f).desc}`}. Mapę i zasady ustawia gospodarz, frakcję każdy wybiera sam. Kliknij, aby zmienić.`; }, set() {} });
      const he = new Button(405, 196, 225, 44, '', () => { const o = Net.pick(), ids = ['random', ...factionOf(o.faction).heroes.map(([n]) => n)]; set({ hero: ids[(ids.indexOf(o.hero) + 1) % ids.length] }); },
        { size: 15, lead: (ctx, cx, cy) => heroPickMedal(ctx, { ...Net.pick(), color: 'red' }, cx, cy, 16) });
      Object.defineProperty(he, 'label', { get: () => { const o = Net.pick(); return o.hero === 'random' ? 'Bohater: losowy' : o.hero; }, set() {} });
      Object.defineProperty(he, 'disabled', { get: () => Net.pick().faction === 'random', set() {} });
      Object.defineProperty(he, 'tip', { get: () => (Net.pick().faction === 'random' ? 'Bohater startowy: najpierw wybierz frakcję.' : `Bohater startowy${Net.pick().hero === 'random' ? ': losowy z frakcji' : `: ${heroPickTip(Net.pick().faction, Net.pick().hero)}`}. Kliknij, aby zmienić.`), set() {} });
      B.push(fa, he);
      btn(420, 'Czat (T)', () => netChatOpen(), { size: 15 });
      btn(472, 'Rozłącz', () => { Net.close(); this.setMode('start'); }, { key: 'escape' });
    }
    this.buttons = B;
  },
  async create() { if (!Net.available()) return showDialog('Gra online nie jest dostępna w tej przeglądarce.', [{ label: 'OK', key: 'enter' }]); this.setMode('host'); await Net.hostGame(); this.setMode('host'); },
  joinCode(v) { if (!Net.available()) return; Net.join(v, Net.name); this.setMode('guest'); },
  async resumeHost(last) {
    const rec = await SaveStore.read('online').catch(() => null); if (!rec || !rec.game) return showDialog('Nie ma zapisanego stanu tej gry.', [{ label: 'OK', key: 'enter' }]);
    const st = deserializeGame(rec.game); Net.name = last.name; const ok = await Net.hostGame(last.code, last); if (!ok) return this.setMode('start');
    Net.me = last.me; ME = Net.me; Net.inGame = true; G.state = st; Net.lastPacked = await Net.pack(st); Net.seq++;
    G.go('adventure', { netKind: 'resume' });
  },
  onBack() { this.buttons[this.buttons.length - 1].action(); },
  draw(ctx) {
    dimmedMenuScene(ctx, 0.5); drawParchment(ctx, 150, 40, 500, 520);
    text(ctx, 'Gra online', W / 2, 86, { size: 30, align: 'center', color: '#3a1e08', fam: 'title' }); divider(ctx, 200, 600, 106);
    const L = (s, y, o = {}) => text(ctx, s, W / 2, y, Object.assign({ size: 16, align: 'center', color: '#3a1e08', weight: 500 }, o));
    if (this.mode === 'start') {
      L('Graj ze znajomymi przez internet. Jeden gracz zakłada grę', 132); L('i podaje kod, pozostali do niej dołączają.', 154);
      L('Wszyscy muszą być online w tym samym czasie.', 176, { italic: true, size: 14 });
    } else if (this.mode === 'host') {
      if (Net.code && Net.peer && Net.peer.open) { L('Kod gry:', 140); goldText(ctx, Net.code, W / 2, 184, 40); L('Podaj go znajomym: wybierają „Gra online” → „Dołącz do gry”.', 222, { size: 14, italic: true }); }
      else L(Net.err || Net.status || 'Zakładanie pokoju…', 160, { color: Net.err ? '#9a2a1a' : '#3a1e08' });
      L('Gracze w pokoju:', 262, { fam: 'title', size: 17 });
      const rows = [{ name: `${Net.name || 'Ty'} (gospodarz)`, on: true }, ...Net.guests.map(g => ({ name: g.name + netPickText(g), on: !!g.conn }))];
      rows.forEach((r, i) => L(`${r.name}${r.on ? '' : ' – rozłączony'}`, 290 + i * 24, { color: r.on ? '#3a1e08' : '#8a6a44' }));
    } else {
      L(Net.err || Net.status, 160, { color: Net.err ? '#9a2a1a' : '#3a1e08' });
      if (Net.lobby) { L('Gracze w pokoju:', 262, { fam: 'title', size: 17 }); [`${Net.lobby.host || 'Gospodarz'} (gospodarz)`, ...Net.lobby.players.map(p => p.name + netPickText(p) + (p.on ? '' : ' – rozłączony'))].forEach((s, i) => L(s, 290 + i * 24)); }
    }
    this.buttons.forEach(b => b.draw(ctx));
  },
};
