// Balans frakcji: tygodniowa armia każdej frakcji (przyrost wszystkich 7 siedlisk) przeciw tygodniowej armii każdej innej.
//   node tools/balans/frakcje.js [--stopien base|u|x] [--proby 6]
// Dla pary A, B szukamy (połówkowo) mnożnika k armii B, przy którym A wygrywa połowę bitew (k > 1: A silniejsza).
// Obie strony to bohaterowie bez cech, umiejętności i czarów (cechy frakcji działają: morale, szczęście); każda para
// gra w obie strony (atak i obrona), kilka ziaren. Indeks frakcji = średnia geometryczna k po wszystkich rywalach.
// Obok: koszt tygodniowej armii (złoto i surowce) i siła na 1000 złota.
'use strict';
const path = require('path'), fs = require('fs'), url = require('url'), { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const TIER = arg('--stopien', 'base'), TRIALS = +arg('--proby', 6);
(async () => {
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, b = await chromium.launch(exe ? { executablePath: exe } : {}), p = await b.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await p.goto(url.pathToFileURL(path.join(__dirname, '..', '..', 'Kroniki Królestw.html')).href);
  await p.waitForFunction(() => typeof G !== 'undefined' && G.screen, null, { timeout: 120000 });
  const out = await p.evaluate(([TIER, TRIALS]) => {
    const facs = FACTIONS.map(f => f.id), suf = TIER === 'base' ? '' : TIER;
    const S = Object.assign({}, G.settings, { mapSize: 'S', land: 'mixed', underground: false, slots: Array.from({ length: 8 }, (_, i) => ({ type: i === 0 ? 'human' : i === 1 ? 'ai' : 'off', faction: 'haven' })) });
    const st = createNewGame(S, 4242); ME = 0; const t0 = st.towns[0];
    const week = fac => { const F = factionOf(fac); return [1, 2, 3, 4, 5, 6, 7].map(L => { const cid = (F.dw['dw' + L + suf] || F.dw['dw' + L])[1]; return { cid, n: Math.round(CREATURES[cid].growth * (fac === 'stronghold' ? 1.25 : 1)) }; }); };
    const cost = fac => { const c = {}; for (const s of week(fac)) for (const [k, v] of Object.entries(CREATURES[s.cid].cost || {})) c[k] = (c[k] || 0) + v * s.n; return c; };
    const mk = (owner, fac, k) => { st.players[owner].faction = fac; const cls = factionOf(fac).heroes[0][1];
      const h = createHero(st, owner, t0.x, t0.y, { name: 'Próba', cls, female: false, fac }); h.stats = { att: 0, def: 0, sp: 0, kn: 0 }; h.skills = []; h.talents = []; h.spells = []; h.book = false; h.machines = [];
      h.army = week(fac).map(s => ({ cid: s.cid, n: Math.max(1, Math.round(s.n * k)) })); return h; };
    const fight = (A, Bf, k, seed, swap) => { st.heroes = []; const a = mk(0, A, 1), d = mk(1, Bf, k); st.seed = 7000 + seed * 131; st.dayTotal = 1 + seed;
      const B = swap ? createBattle(st, d, a) : createBattle(st, a, d); simulateBattle(B); const atkWon = B.over === 'win'; return swap ? !atkWon : atkWon; };
    const k50 = (A, Bf) => { let lo = 0.25, hi = 4; for (let it = 0; it < 8; it++) { const mid = Math.sqrt(lo * hi); let w = 0; for (let s = 0; s < TRIALS; s++) for (const sw of [false, true]) if (fight(A, Bf, mid, s, sw)) w++; if (w >= TRIALS) lo = mid; else hi = mid; } return Math.sqrt(lo * hi); };
    const M = {}; for (const A of facs) { M[A] = {}; for (const Bf of facs) if (A !== Bf) M[A][Bf] = +k50(A, Bf).toFixed(2); }
    return { facs, M, cost: Object.fromEntries(facs.map(f => [f, cost(f)])), army: Object.fromEntries(facs.map(f => [f, week(f).map(s => `${s.n} ${s.cid}`).join(', ')])) };
  }, [TIER, TRIALS]);
  const { facs, M, cost } = out, gm = a => Math.exp(a.reduce((s, v) => s + Math.log(v), 0) / a.length);
  const idx = Object.fromEntries(facs.map(A => [A, gm(facs.filter(B => B !== A).map(B => Math.sqrt(M[A][B] / M[B][A])))])); // symetryzowane: k(A,B) i 1/k(B,A)
  console.log(`\nTygodniowa armia (stopień ${TIER}): k = ile razy większą armię rywala pokonuje (wiersz przeciw kolumnie)`);
  console.log(''.padEnd(11) + facs.map(f => f.slice(0, 7).padStart(8)).join('') + '   indeks   złoto  na 1000 zł');
  for (const A of facs) { const g = cost[A].gold || 0, rest = Object.entries(cost[A]).filter(([k]) => k !== 'gold').map(([k, v]) => `${v} ${k}`).join(', ');
    console.log(A.padEnd(11) + facs.map(B => (A === B ? '-' : M[A][B].toFixed(2)).padStart(8)).join('') + idx[A].toFixed(2).padStart(9) + String(g).padStart(8) + (idx[A] / g * 1000 * 10).toFixed(3).padStart(10) + '  ' + rest); }
  fs.writeFileSync(path.join(__dirname, `wynik-frakcje-${TIER}.json`), JSON.stringify({ ...out, idx }, null, 1)); await b.close();
})();
