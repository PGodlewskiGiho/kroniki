// Długie gry samych komputerów (Chromium bez okna): wyłapywanie błędów i pomiar, które frakcje wygrywają.
//   node tools/balans/gry.js [--gry 12] [--dni 150] [--od 1] [--mapy S,M,L] [--frakcje haven,sylvan] [--zapis-co 10]
// Każda gra: losowa mapa (wielkość, kraina, podziemia, czasem drużyny), 2–6 graczy komputerowych z różnymi frakcjami.
// Po każdym dniu sprawdzamy niezmienniki stanu (surowce, armie, położenie bohaterów, właściciele, gracze, którzy odpadli),
// co kilka dni zapis i odczyt (stan po odczycie musi dać ten sam zapis), czas dnia; na koniec kto wygrał i po ilu dniach.
// Wynik: tools/balans/wynik-gry.json; błędy wypisane na końcu (z dniem, ziarnem i ustawieniami, by dało się je powtórzyć).
'use strict';
const path = require('path'), fs = require('fs'), url = require('url'), { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const GAMES = +arg('--gry', 12), DAYS = +arg('--dni', 150), FROM = +arg('--od', 1), SAVE_EVERY = +arg('--zapis-co', 10);
const SIZES = arg('--mapy', 'S,M,L').split(','), ONLY = arg('--frakcje', ''), DUMP = arg('--zrzut', ''); // --zrzut katalog: zapis stanu gier bez rozstrzygnięcia
(async () => {
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, b = await chromium.launch(exe ? { executablePath: exe } : {}), p = await b.newPage();
  const pageErr = []; p.on('pageerror', e => pageErr.push(String(e && e.stack || e))); p.on('console', m => { if (m.type() === 'error') pageErr.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await p.goto(url.pathToFileURL(path.join(__dirname, '..', '..', 'Kroniki Królestw.html')).href);
  await p.waitForFunction(() => typeof G !== 'undefined' && G.screen, null, { timeout: 120000 });
  await p.evaluate(() => { // sprawdzanie stanu po każdym dniu: zwraca listę naruszeń (puste = w porządku)
    window.SOAK = {
      check(st) {
        const bad = [], n = st.map.n, ids = new Set(), fin = v => typeof v === 'number' && Number.isFinite(v);
        const army = (a, who) => { if (!Array.isArray(a) || a.length !== ARMY_SLOTS) { bad.push(`${who}: armia ma ${a && a.length} miejsc`); return 0; } let k = 0;
          for (const s of a) if (s) { k++; if (!CREATURES[s.cid]) bad.push(`${who}: nieznany stwór ${s.cid}`); if (!(Number.isInteger(s.n) && s.n > 0)) bad.push(`${who}: liczebność ${s.n} (${s.cid})`); } return k; };
        for (const pl of st.players) {
          for (const [k, v] of Object.entries(pl.resources || {})) if (!fin(v) || v < 0) bad.push(`gracz ${pl.id}: surowiec ${k} = ${v}`);
          if (pl.out && (st.towns.some(t => t.owner === pl.id) || st.heroes.some(h => h.owner === pl.id))) bad.push(`gracz ${pl.id} odpadł, a ma miasta albo bohaterów`);
        }
        const at = new Map();
        for (const h of st.heroes) {
          const who = `bohater ${h.name} (${h.owner})`;
          if (ids.has(h.id)) bad.push(`${who}: powtórzony id ${h.id}`); ids.add(h.id);
          if (!st.players[h.owner]) bad.push(`${who}: nie ma takiego gracza`);
          if (!(h.x >= 0 && h.y >= 0 && h.x < n && h.y * n + h.x < st.map.terrain.length)) bad.push(`${who}: poza mapą ${h.x},${h.y}`);
          if (!army(h.army, who)) bad.push(`${who}: pusta armia`);
          for (const k of ['mp', 'mana', 'exp', 'level']) if (!fin(h[k]) || h[k] < 0) bad.push(`${who}: ${k} = ${h[k]}`);
          for (const k of Object.keys(h.stats || {})) if (!fin(h.stats[k])) bad.push(`${who}: cecha ${k} = ${h.stats[k]}`);
          const key = `${h.x},${h.y}`, town = st.towns.find(t => t.x === h.x && t.y === h.y);
          if (at.has(key) && !town) bad.push(`${who}: na tym samym polu co ${at.get(key)} (${key})`); at.set(key, h.name);
        }
        for (const t of st.towns) {
          if (t.owner >= 0 && !st.players[t.owner]) bad.push(`miasto ${t.name}: właściciel ${t.owner}`);
          if (t.garrison) army(t.garrison, `garnizon ${t.name}`);
          for (const [k, v] of Object.entries(t.avail || {})) if (!fin(v) || v < 0) bad.push(`miasto ${t.name}: do werbunku ${k} = ${v}`);
        }
        for (const o of st.objects) if (o.type === 'monster' && !o.dead && !(o.count > 0 && CREATURES[o.cid])) bad.push(`potwór ${o.cid} x${o.count} na ${o.x},${o.y}`);
        return bad;
      },
      save(st) { const a = JSON.stringify(serializeGame(st)), st2 = deserializeGame(JSON.parse(a)), b = JSON.stringify(serializeGame(st2)); ME = 0; return a === b ? null : 'zapis po odczycie różni się od zapisu'; },
    };
  });
  const facs = ONLY ? ONLY.split(',') : await p.evaluate(() => FACTIONS.map(f => f.id));
  const games = [], errors = [];
  for (let g = FROM; g < FROM + GAMES; g++) {
    const r = (k => () => (k = (k * 1103515245 + 12345) % 2147483648) / 2147483648)(g * 7919);
    const size = SIZES[g % SIZES.length], cap = { S: 2, M: 4, L: 6, XL: 6 }[size] || 4, np = 2 + Math.floor(r() * (cap - 1));
    const order = [...facs]; for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } const teams = np >= 4 && r() < 0.35;
    const cfg = { seed: 1000 + g, mapSize: size, land: ['mixed', 'random', 'islands', 'mountains'][Math.floor(r() * 4)], underground: r() < 0.4,
      slots: Array.from({ length: 8 }, (_, i) => i < np ? { type: i === 0 ? 'human' : 'ai', faction: order[i % order.length], team: teams ? 1 + (i % 2) : 0 } : { type: 'off' }) };
    const ok = await p.evaluate(cfg => {
      try { const S = Object.assign({}, G.settings, { mapSize: cfg.mapSize, land: cfg.land, underground: cfg.underground, slots: cfg.slots });
G.state = createNewGame(S, cfg.seed); ME = 0; G.state.players[0].human = false; return null; } catch (e) { return String(e.stack || e); }
    }, cfg).catch(e => String(e));
    const tag = `gra ${g} (ziarno ${cfg.seed}, ${size}, ${cfg.land}${cfg.underground ? ', podziemia' : ''}${teams ? ', drużyny' : ''}, ${cfg.slots.slice(0, np).map(s => s.faction).join('/')})`;
    if (ok) { errors.push({ tag, day: 0, what: 'tworzenie świata: ' + ok }); continue; }
    const rec = { tag, cfg, np, teams, factions: cfg.slots.slice(0, np).map(s => s.faction), slowest: 0, days: 0, winner: null, out: [] };
    let dead = false;
    for (let d = 1; d <= DAYS && !dead; d++) {
      const t0 = Date.now();
      const res = await p.evaluate(([d, SAVE_EVERY]) => {
        const st = G.state; try { runAiSync(st, turnsAfter(st, 0, [])); } catch (e) { return { err: String(e.stack || e) }; }
        const left = st.players.filter(q => !q.out && playerAlive(st, q)); for (const q of st.players) if (!q.out && !playerAlive(st, q)) q.out = true;
        const bad = SOAK.check(st); if (d % SAVE_EVERY === 0) { try { const s = SOAK.save(st); if (s) bad.push(s); } catch (e) { bad.push('zapis: ' + e); } G.state = st; ME = 0; }
        const over = left.length <= 1 || left.every(q => allied(st, q.id, left[0].id));
        const dev = d % 7 ? null : st.players.map(q => { const ts = st.towns.filter(t => t.owner === q.id), hs = st.heroes.filter(h => h.owner === q.id); // rozwój co tydzień: miasta, budowle, siła armii, poziom, złoto
          return { towns: ts.length, built: ts.reduce((s, t) => s + t.built.length, 0), army: Math.round(hs.reduce((s, h) => s + armyPower(h.army), 0) + ts.reduce((s, t) => s + armyPower(t.garrison), 0)), lv: Math.max(0, ...hs.map(h => h.level)), gold: q.resources.gold, out: !!q.out }; });
        return { bad, over, dev, left: left.map(q => q.id), lv: Math.max(0, ...st.heroes.map(h => h.level)), towns: st.players.map(q => st.towns.filter(t => t.owner === q.id).length) };
      }, [d, SAVE_EVERY]).catch(e => ({ err: 'przeglądarka: ' + e }));
      const ms = Date.now() - t0; rec.slowest = Math.max(rec.slowest, ms); rec.days = d;
      if (pageErr.length) errors.push({ tag, day: d, what: 'błąd strony: ' + pageErr.splice(0).join(' | ') });
      if (res.err) { errors.push({ tag, day: d, what: res.err }); dead = true; break; }
      for (const w of [...new Set(res.bad)].slice(0, 8)) if (!errors.some(e => e.tag === tag && e.what === w)) errors.push({ tag, day: d, what: w });
      rec.towns = res.towns; rec.maxLevel = res.lv; if (res.dev) (rec.dev = rec.dev || []).push({ day: d, p: res.dev });
      if (res.over) { rec.winner = res.left; break; }
    }
    if (DUMP && !rec.winner) { fs.mkdirSync(DUMP, { recursive: true }); fs.writeFileSync(path.join(DUMP, `gra-${g}.json`), await p.evaluate(() => JSON.stringify(serializeGame(G.state)))); }
    games.push(rec);
    console.log(`${tag}: ${rec.winner ? `koniec w dniu ${rec.days}, wygrywa ${rec.winner.map(i => rec.factions[i]).join('+')}` : `po ${rec.days} dniach bez rozstrzygnięcia (miasta ${rec.towns})`}, najwolniejszy dzień ${rec.slowest} ms`);
  }
  const wins = {}, plays = {}; for (const g of games) { g.factions.forEach(f => { plays[f] = (plays[f] || 0) + 1; }); if (g.winner) for (const i of g.winner) wins[g.factions[i]] = (wins[g.factions[i]] || 0) + 1 / g.winner.length; }
  // rozwój frakcji: średnio po graczach danej frakcji (tylko ci, którzy jeszcze grają), tygodnie 2, 4, 8
  const W = [14, 28, 56], dev = {}; for (const g of games) for (const s of g.dev || []) if (W.includes(s.day)) s.p.forEach((q, i) => { if (q.out) return; const k = g.factions[i] + '|' + s.day; (dev[k] = dev[k] || []).push(q); });
  const avg = (a, f) => a && a.length ? a.reduce((s, q) => s + f(q), 0) / a.length : NaN;
  console.log('\nRozwój (średnio): budowle / siła armii (tys.) / poziom bohatera w dniach ' + W.join(', '));
  for (const f of facs) console.log('  ' + f.padEnd(11) + W.map(d => { const a = dev[f + '|' + d]; return a ? `${avg(a, q => q.built).toFixed(0).padStart(3)} ${(avg(a, q => q.army) / 1000).toFixed(0).padStart(4)}k ${avg(a, q => q.lv).toFixed(1).padStart(4)}` : '      -       '; }).join('   |'));
  console.log('\nFrakcje: wygrane / gry'); for (const f of facs) console.log(`  ${f.padEnd(11)} ${(wins[f] || 0).toFixed(1).padStart(5)} / ${plays[f] || 0}`);
  console.log(`\nBłędy: ${errors.length}`); for (const e of errors) console.log(`  [${e.tag}, dzień ${e.day}] ${e.what.slice(0, 600)}`);
  fs.writeFileSync(path.join(__dirname, 'wynik-gry.json'), JSON.stringify({ games, errors, wins, plays }, null, 1)); await b.close();
})();
