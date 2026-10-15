// Pomiar balansu rozwoju bohaterów (gra w Chromium bez okna, bitwy rozstrzygane przez simulateBattle, obie strony SI).
//   node tools/balans/bohaterowie.js [sila|postep|wszystko] [--poziomy 1,5,10,15,20,25] [--proby 6]
// sila:   indeks siły każdej klasy na kilku poziomach (BalanceLab w src/js/14z-pomiar-balansu.js: armia frakcji rośnie z poziomem,
//         wróg to armia Twierdzy z tego samego tygodnia) i jej wartość na mapie (ruch, złoto, widzenie); znaczy klasy poza celem ±10%.
// postep: kilka gier samych komputerów; poziom głównego bohatera każdego gracza na koniec tygodni 1–8.
'use strict';
const path = require('path'), fs = require('fs'), url = require('url'), { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; }, mode = process.argv[2] || 'wszystko';
const LEVELS = arg('--poziomy', '1,5,10,15,20,25').split(',').map(Number), TRIALS = +arg('--proby', 6), NOPATH = process.argv.includes('--bez-sciezek'), SOFT = arg('--moc', '');
(async () => {
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, b = await chromium.launch(exe ? { executablePath: exe } : {}), p = await b.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await p.goto(url.pathToFileURL(path.join(__dirname, '..', '..', 'Kroniki Królestw.html')).href);
  await p.waitForFunction(() => typeof G !== 'undefined' && G.screen);
  const out = {};
  if (mode === 'sila' || mode === 'wszystko') {
    if (SOFT) await p.evaluate(v => { SP_SOFT = v; }, +SOFT);
    if (arg('--drugi', '')) await p.evaluate(v => { DOUBLE_CAST_COST = v; }, +arg('--drugi', ''));
    if (process.argv.includes('--bez-bitewnego-maga')) await p.evaluate(() => { TALENTS.doubleCast.req = [['navigation', 9]]; });
    out.sila = await p.evaluate(([LEVELS, TRIALS, NOPATH]) => { PATHS_ON = !NOPATH; // pomiar: BalanceLab w src/js/14z-pomiar-balansu.js
      const lab = BalanceLab.setup(), res = { klasy: {}, mapa: {}, mag: MAGE_CLASSES.slice(), cel: BALANCE_TARGET };
      for (const cls of Object.keys(CLASS_GROWTH)) { res.klasy[cls] = {}; res.mapa[cls] = {};
        for (const L of LEVELS) { const r = BalanceLab.index(lab, cls, L, TRIALS); res.klasy[cls][L] = +r.index.toFixed(2); res.mapa[cls][L] = BalanceLab.mapValue(lab, r.hero, cls, L); } }
      return res;
    }, [LEVELS, TRIALS, NOPATH]);
    // Cel balansu (etap 0 rozwoju bohatera): na każdym poziomie każda klasa w granicach ±10% średniej, magowie i wojownicy średnio równo
    const S = out.sila, mage = c => S.mag.includes(c), TARGET = S.cel, mean = L => { const v = Object.values(S.klasy).map(r => r[L]); return v.reduce((a, b) => a + b, 0) / v.length; };
    console.log(`\nIndeks siły w bitwie (armia wroga pokonywana z bohaterem / bez; armia rośnie z poziomem; * mag, ! poza celem ±${TARGET * 100}%)`);
    console.log('klasa'.padEnd(14) + LEVELS.map(L => ('poz ' + L).padStart(9)).join(''));
    for (const [c, row] of Object.entries(S.klasy)) console.log((c + (mage(c) ? '*' : '')).padEnd(14) + LEVELS.map(L => (row[L].toFixed(2) + (Math.abs(row[L] / mean(L) - 1) > TARGET ? '!' : ' ')).padStart(9)).join(''));
    const grp = (m, L) => { const v = Object.entries(S.klasy).filter(([c]) => mage(c) === m).map(([, r]) => r[L]); return v.reduce((a, b) => a + b, 0) / v.length; };
    console.log('wojownicy'.padEnd(14) + LEVELS.map(L => grp(false, L).toFixed(2).padStart(9)).join('')); console.log('magowie*'.padEnd(14) + LEVELS.map(L => grp(true, L).toFixed(2).padStart(9)).join(''));
    console.log('mag/wojownik'.padEnd(14) + LEVELS.map(L => (grp(true, L) / grp(false, L)).toFixed(2).padStart(9)).join(''));
    console.log('rozrzut ±%'.padEnd(14) + LEVELS.map(L => { const v = Object.values(S.klasy).map(r => r[L] / mean(L) - 1); return (Math.max(...v.map(Math.abs)) * 100).toFixed(0).padStart(9); }).join(''));
    console.log('\nWartość na mapie (ruch / złoto dziennie / widzenie ponad bohatera bez rozwoju), poziom ' + LEVELS.slice(-1)[0]);
    for (const [c, row] of Object.entries(S.mapa)) { const m = row[LEVELS.slice(-1)[0]]; console.log((c + (mage(c) ? '*' : '')).padEnd(14) + `${String(m.mp).padStart(6)} ruchu ${String(m.gold).padStart(6)} zł ${String(m.sight).padStart(3)} pól`); }
  }
  if (mode === 'sciezki') { // każda ścieżka osobno: siła z nią / siła bez ścieżki (ta sama klasa, poziom 10 i 20)
    out.sciezki = await p.evaluate(([TRIALS]) => {
      const st = createNewGame(Object.assign({}, G.settings, { mapSize: 'S', land: 'mixed', slots: null, opponents: 1, faction: 'haven', underground: false }), 4242); ME = 0;
      const t0 = st.towns.find(t => t.owner === 0), ARMY = [['pikeman', 30], ['archer', 20], ['griffin', 10], ['swordsman', 8], ['monk', 5], ['cavalier', 3]];
      const FOE = k => { const F = factionOf('fortress'); return [1, 2, 3, 4, 5].map(L => [F.dw['dw' + L][1], Math.max(1, Math.round([28, 18, 10, 7, 4][L - 1] * k))]); };
      const GUILD = L => (L < 4 ? 1 : L < 8 ? 2 : L < 12 ? 3 : L < 16 ? 4 : 5);
      const mk = (cls, L, seed, path) => { PATHS_ON = false; st.heroes = st.heroes.filter(h => h.owner !== 0); const fac = CLASS_FACTION[cls];
        const h = createHero(st, 0, t0.x, t0.y, { name: 'Próba', cls, female: false, fac }); st.seed = seed; gainExp(st, h, Math.max(0, expForLevel(L) - h.exp), null, true); h.mastery = path; PATHS_ON = true;
        if (h.book) { const town = { faction: fac, guild: {}, built: [], id: seed % 97 }; for (let g = 1; g <= Math.min(GUILD(L), guildMax(fac)); g++) { rollGuildLevel(st, town, g); for (let k = 1; k <= Math.min(g, spellCap(h)); k++) for (const id of town.guild[k] || []) if (!knows(h, id)) h.spells.push(id); } }
        h.mana = heroMaxMana(h); h.army = ARMY.map(([cid, n]) => ({ cid, n })).concat([null]); return h; };
      const fight = (h, k, seed) => { const foe = { type: 'bank', id: 900 + seed, guards: FOE(k) }; st.seed = 7000 + seed * 131; st.dayTotal = 1 + seed; const army = h.army.map(s => s && { ...s }); h.mana = heroMaxMana(h); const B = createBattle(st, h, foe); simulateBattle(B); h.army = army; return B.over === 'win'; };
      const k50 = make => { let lo = 0.2, hi = 8; for (let it = 0; it < 9; it++) { const mid = Math.sqrt(lo * hi); let w = 0; for (let s = 0; s < TRIALS; s++) if (fight(make(s), mid, s)) w++; if (w * 2 >= TRIALS) lo = mid; else hi = mid; } return Math.sqrt(lo * hi); };
      const res = {}; for (const cls of Object.keys(CLASS_PATHS)) for (const L of [10, 20]) { const c0 = {}, base = k50(s => c0[s] || (c0[s] = mk(cls, L, 100 + s * 17, null)));
        for (const pth of CLASS_PATHS[cls]) { const c = {}; res[`${cls} ${L} ${pth}`] = +(k50(s => c[s] || (c[s] = mk(cls, L, 100 + s * 17, pth))) / base).toFixed(2); } }
      return res;
    }, [TRIALS]);
    const agg = {}; for (const [k, v] of Object.entries(out.sciezki)) { const [, L, pth] = k.split(' '); (agg[pth + ' ' + L] = agg[pth + ' ' + L] || []).push(v); }
    console.log('\nŚcieżki: siła z nią / bez niej (średnio po klasach, które ją mają; min–max)');
    for (const [k, v] of Object.entries(agg).sort()) console.log(k.padEnd(16) + (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2).padStart(7) + `  (${Math.min(...v).toFixed(2)}–${Math.max(...v).toFixed(2)}, klas: ${v.length})`);
  }
  if (mode === 'postep' || mode === 'wszystko') {
    out.postep = await p.evaluate(() => {
      const rows = [];
      for (const seed of [11, 22, 33]) { const S = Object.assign({}, G.settings, { mapSize: 'M', land: 'mixed', underground: false, opponents: 3, faction: 'haven', slots: null });
        G.state = createNewGame(S, seed); const st = G.state; st.players[0].human = false; setScreen('adventure', {});
        for (let d = 1; d <= 56; d++) { G.screens.adventure.doEndTurn(); if (G.modal) G.modal = null;
          if (d % 7 === 0) for (const pl of st.players) { const hs = st.heroes.filter(h => h.owner === pl.id).sort((a, b) => b.level - a.level); if (hs[0]) rows.push({ seed, week: d / 7, cls: hs[0].cls, level: hs[0].level, n: hs.length, talents: hs[0].talents.length, skills: hs[0].skills.length }); } } }
      return rows;
    });
    const W = [1, 2, 3, 4, 5, 6, 7, 8], R = out.postep;
    console.log('\nPostęp (gry samych komputerów, średni / najwyższy poziom głównego bohatera)'); console.log('tydzień ' + W.map(w => String(w).padStart(9)).join(''));
    console.log('poziom  ' + W.map(w => { const v = R.filter(r => r.week === w).map(r => r.level); return v.length ? `${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}/${Math.max(...v)}`.padStart(9) : '-'.padStart(9); }).join(''));
  }
  fs.writeFileSync(path.join(__dirname, 'wynik-bohaterowie.json'), JSON.stringify(out, null, 1)); await b.close();
})();
