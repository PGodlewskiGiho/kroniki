// ==================== GRACZE KOMPUTEROWI ================================================
// Tura przeciwnika dzieje się natychmiast (bez animacji), po turze człowieka, a przed nowym dniem.
// SI widzi całą mapę. Kolejność: miasta (budowa, werbunek, najem), potem bohaterowie wybierają cele
// z mapy odległości (aiReach) i idą do nich, dopóki starcza ruchu. Jak zawodowi gracze H3: jeden główny bohater (aiMain)
// walczy i rośnie, pomocnicy (do limitu bohaterów) zbierają mapę i dowożą mu armię (aiFeed); nikt nie wchodzi pod silniejszego wroga (aiDanger). Wieści ważne dla człowieka trafiają do jego skrzynki (tell), zobaczy je na początku swojej tury.
const AI_BUILD_ORDER = ['dw1', 'dw2', 'hall2', 'market', 'fort', 'dw3', 'tavern', 'dw4', 'citadel', 'guild1', 'dw1u', 'dw2u', 'hall3', 'dw5', 'dw3u',
  'castle', 'smith', 'special', 'dw4u', 'dw6', 'dw5u', 'hall4', 'dw6u', 'guild2', 'dw7', 'silo', 'guild3', 'dw7u',
  'dw3x', 'dw4x', 'dw5x', 'dw1x', 'dw2x', 'dw6x', 'dw7x', 'guild4', 'guild5'];
// Dokupuje brakujące surowce na koszt cost (po kursie rynku gracza), jeśli starczy złota. Zwraca, czy kupił.
function buyMissing(st, owner, cost) {
  if (!marketCount(st, owner)) return false;
  const R = playerOf(st, owner).resources, deals = []; let gold = cost.gold || 0;
  for (const r of RESOURCES) if (r.id !== 'gold' && (cost[r.id] || 0) > R[r.id]) { const k = cost[r.id] - R[r.id], L = marketLot(st, owner, 'gold', r.id); deals.push([r.id, k, L]); gold += Math.ceil(k / L.get) * L.give; }
  if (!deals.length || R.gold < gold) return false;
  for (const [r, k, L] of deals) trade(st, owner, 'gold', r, Math.ceil(k / L.get));
  return true;
}
// Ilu bohaterów najmuje SI: tylu, ile pozwala limit gry, ale na małej mapie mniej (jak zawodowi gracze H3:
// jeden główny bohater i pomocnicy, którzy zbierają skarby i dowożą mu armię)
const aiMaxHeroes = st => Math.min(heroLimit(st), st.map.n >= 108 ? 8 : st.map.n >= 72 ? 6 : 4);
// Główny bohater gracza SI (p.mainHero): najsilniejszy; zmienia się, gdy zginie albo inny stanie się dużo silniejszy
const aiHeroScore = h => armyStrength(h) + h.level * 1500;
function aiMain(st, p) {
  const hs = st.heroes.filter(h => h.owner === p.id); if (!hs.length) return null;
  const best = hs.reduce((a, h) => (aiHeroScore(h) > aiHeroScore(a) ? h : a)), cur = hs.find(h => h.id === p.mainHero);
  const m = cur && aiHeroScore(cur) * 2 >= aiHeroScore(best) ? cur : best; p.mainHero = m.id; return m;
}
const aiRole = (st, h) => (hasAiMain(st, h) ? 'helper' : 'main');
const hasAiMain = (st, h) => { const p = playerOf(st, h.owner), m = st.heroes.find(o => o.id === p.mainHero && o.owner === h.owner); return !!m && m !== h; };
// Pola zagrożone (ucieczka do własnego miasta i dowóz armii głównemu są dozwolone): w zasięgu jednego dnia marszu wrogiego bohatera silniejszego od h (który SI widzi na odkrytej mapie).
// Bohater SI tam nie idzie: pomocnik z jedną jednostką to darmowe doświadczenie dla wroga, a główny straciłby armię.
function aiDanger(st, h) {
  const n = st.map.n, ex = playerOf(st, h.owner).explored, power = armyStrength(h), D = new Uint8Array(n * n);
  for (const o of st.heroes) {
    if (allied(st, o.owner, h.owner) || o.garrison != null || !ex[o.y * n + o.x] || armyStrength(o) <= power * 0.8) continue; // rozejm chroni tylko ludzi przed SI, nie odwrotnie
    const r = Math.ceil(heroMaxMP(o) / 100) + 1;
    for (let y = Math.max(0, o.y - r); y <= Math.min(n - 1, o.y + r); y++) for (let x = Math.max(0, o.x - r); x <= Math.min(n - 1, o.x + r); x++) D[y * n + x] = 1;
  }
  return D;
}
// Cele zajęte w tej turze przez innych bohaterów tego samego gracza (pole -> bohater): pomocnicy rozchodzą się po mapie
const aiClaims = new Map();
// Pomocnik oddaje głównemu bohaterowi armię (zostawia sobie 1 najsłabszą jednostkę) i artefakty.
// Gdy w armii głównego brak miejsca, słabszy oddział głównego wraca do pomocnika w zamian za silniejszy.
function aiFeed(st, h, m) {
  const before = armyPower(m.army); if (!feedArmies(h.army, m.army)) return 0;
  for (const slot of Object.keys(h.equip)) if (h.equip[slot] && !(h.locked || {})[slot]) unequip(h, slot);
  for (const id of h.bag.splice(0)) { giveArtifact(m, id); if (ARTIFACTS[id].parts) { const bi = m.bag.indexOf(id); if (bi >= 0 && relicSlots(m, id)) equipRelic(m, bi); } }
  return armyPower(m.army) - before;
}
// Sama wymiana oddziałów (na żywych armiach albo na kopiach, by policzyć, ile naprawdę przejdzie); false = pomocnik nie ma czego oddać
function feedArmies(ha, ma) {
  const val = s => s.n * CREATURES[s.cid].value, stacks = armyStacks(ha); if (!stacks.length) return false;
  const weak = stacks.reduce((a, x) => (CREATURES[x.cid].value < CREATURES[a.cid].value ? x : a)), kept = { cid: weak.cid, n: 1 };
  weak.n--; if (!weak.n) ha[ha.indexOf(weak)] = null;
  for (let i = 0; i < ha.length; i++) { // brak miejsca: zamiana z najsłabszym oddziałem głównego
    const s = ha[i]; if (!s || ma.some(x => !x || x.cid === s.cid)) continue;
    const j = ma.reduce((b, x, k) => (b < 0 || val(x) < val(ma[b]) ? k : b), -1); if (j >= 0 && val(ma[j]) < val(s)) { ha[i] = ma[j]; ma[j] = s; }
  }
  armyTransfer(ha, ma);
  const k = ha.findIndex(x => x && x.cid === kept.cid); if (k >= 0) ha[k].n++; else { const f = ha.findIndex(x => !x); if (f >= 0) ha[f] = kept; }
  return true;
}
// Ile siły armii głównego bohatera naprawdę przybędzie po dowozie (pełna armia głównego przyjmie tylko te same rodzaje albo zamianę na silniejsze)
const feedGain = (h, m) => { const ha = h.army.map(s => s && { ...s }), ma = m.army.map(s => s && { ...s }); return feedArmies(ha, ma) ? armyPower(ma) - armyPower(m.army) : 0; };
// Rozejm: przez tyle dni SI nie atakuje miast ani bohaterów człowieka (zasada „rozejm”; wg trudności: Łatwy 21, Normalny 14, Trudny 7, wyżej 0)
const AI_PEACE_DAYS = [21, 14, 7, 0, 0];
const truceDays = st => { const r = rule(st, 'truce'); return r === 'auto' ? AI_PEACE_DAYS[st.settings.difficulty] : r; };
const aiPeace = (st, owner, me = -1) => owner >= 0 && (allied(st, owner, me) || (playerOf(st, owner).human && st.dayTotal <= truceDays(st))); // rozejm z ludźmi albo sojusz
// Daily bonus złota SI na wyższych poziomach trudności (Trudny +300, Ekspert +600, Niemożliwy +1000)
const aiGoldBonus = st => Math.max(0, DIFFICULTIES[st.settings.difficulty].rating - 100) * 10;
const armyStrength = h => Math.round(armyPower(h.army) * heroFactor(h));
// Przenosi oddziały z jednej armii do drugiej (łączy takie same, zajmuje wolne miejsca)
function armyTransfer(from, to) {
  for (let i = 0; i < from.length; i++) {
    const s = from[i]; if (!s) continue;
    const j = to.findIndex(x => x && x.cid === s.cid), k = j >= 0 ? j : to.findIndex(x => !x);
    if (k < 0) continue; if (to[k]) to[k].n += s.n; else to[k] = { cid: s.cid, n: s.n }; from[i] = null;
  }
}
// Część garnizonu, którą bohater naprawdę zabierze (armyTransfer): ten sam rodzaj albo wolne miejsce w armii.
// Bez tego SI z pełną armią krążyła między własnymi miastami po jednostki, których nie mogła wziąć.
function takeableArmy(from, to) {
  let free = to.filter(x => !x).length; const have = new Set(to.filter(Boolean).map(x => x.cid));
  return from.map(s => { if (!s) return null; if (have.has(s.cid)) return s; if (free > 0) { free--; have.add(s.cid); return s; } return null; });
}
function aiManageTown(st, p, t) {
  // pierwsza osiągalna z trzech kolejnych budowli z listy (żeby brak rudy na Fort nie wstrzymał wszystkiego)
  if (!t.builtToday) {
    const next = AI_BUILD_ORDER.map(id => BUILD_BY_ID[id]).filter(B => !hasB(t, B.id) && bAllowed(t, B) && reqMet(t, B)).slice(0, 3);
    const B = next.find(B => canAfford(st, B.cost, p.id)) || (next[0] && buyMissing(st, p.id, next[0].cost) ? next[0] : null); if (B) buildIn(st, t, B);
  }
  const heroes = st.heroes.filter(h => h.owner === p.id);
  if (heroes.length < aiMaxHeroes(st) && hasB(t, 'tavern') && !heroAt(st, t.x, t.y) && p.resources.gold >= HERO_COST + (heroes.length < 2 ? 500 : 1500)) {
    const k = tavernOffer(st, p.id).findIndex(Boolean); if (k >= 0) hireHero(st, t, k);
  }
  for (let L = 7; L >= 1; L--) {
    if (!hasB(t, 'dw' + L) || !t.avail[L]) continue;
    for (const cid of dwellingUnits(t, L).reverse()) { // najwyższy stopień, na który stać (jeden oddział na poziom)
      const n = Math.min(t.avail[L], maxAffordable(st, unitCost(cid), p.id)); if (n > 0) { recruit(st, t, L, cid, n); break; }
    }
  }
  const h = heroInTown(st, t);
  // ulepszanie kupionych stworów (garnizon i bohater w mieście), gdy po opłacie zostaje zapas złota
  for (const a of [t.garrison, h && h.army].filter(Boolean)) for (let i = 0; i < a.length; i++) {
    const x = a[i], to = x && townUpgradeTarget(t, x.cid); if (!to) continue; const c = upgradeCostFor(x.cid, to, x.n);
    if (p.resources.gold - (c.gold || 0) >= 2000) townUpgrade(st, t, a, i);
  }
  if (!h) return;
  armyTransfer(t.garrison, h.army);
  // kuźnia: machiny po werbunku, gdy zostaje zapas złota
  if (hasB(t, 'smith')) for (const id of MACHINES) if (!h.machines.includes(id) && p.resources.gold >= CREATURES[id].cost.gold + 3000) buyMachine(st, t, h, id);
}
// Mapa odległości od bohatera (Dijkstra, koszty ruchu jak u człowieka) tylko po terenie odkrytym przez jego
// gracza. Pola z obiektem, strażnikiem albo bohaterem są przystankami: można na nie wejść, ale nie przejść dalej.
function aiReach(st, h) {
  const map = st.map, n = map.n, N = n * n, ex = playerOf(st, h.owner).explored, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), start = h.y * n + h.x;
  // kopiec na tablicach typowanych (klucz = odległość, wartość = pole): bez tworzenia par przy każdym kroku
  let hk = new Float64Array(1024), hv = new Int32Array(1024), hn = 0;
  const push = (d, v) => {
    if (hn === hk.length) { const k2 = new Float64Array(hn * 2), v2 = new Int32Array(hn * 2); k2.set(hk); v2.set(hv); hk = k2; hv = v2; }
    let i = hn++; while (i) { const q = (i - 1) >> 1; if (hk[q] <= d) break; hk[i] = hk[q]; hv[i] = hv[q]; i = q; } hk[i] = d; hv[i] = v;
  };
  const pop = () => { // zdejmuje najmniejszy element (na wierzchu kopca)
    const d = hk[--hn], v = hv[hn]; let i = 0;
    for (;;) { const l = 2 * i + 1, r = l + 1; let m = l; if (l >= hn) break; if (r < hn && hk[r] < hk[l]) m = r; if (hk[m] >= d) break; hk[i] = hk[m]; hv[i] = hv[m]; i = m; }
    hk[i] = d; hv[i] = v;
  };
  const heroCell = new Uint8Array(N); for (const o of st.heroes) if (o.garrison == null) heroCell[o.y * n + o.x] = 1;
  const stop = i => !!((st.objAt[i] && objSeen(st, st.objects[st.objAt[i] - 1], h.owner)) || st.guard[i] || heroCell[i]); // nieznany ukryty skarb: przechodzi (i go znajduje)
  dist[start] = 0; push(0, start);
  while (hn) {
    const d = hk[0], i = hv[0]; pop(); if (d > dist[i]) continue; if (i !== start && stop(i)) continue;
    const x = i % n, y = (i / n) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = x + DX8[k], ny = y + DY8[k]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const j = ny * n + nx; if (!ex[j] || map.terrain[j] === TER.WATER || map.obst[j]) continue;
      const ob = objectAt(st, j); if (ob && ob.blocks && j !== ob.y * n + ob.x) continue; // bok miasta/kopalni: tylko przez wejście
      const nd = d + stepCost(map, x, y, nx, ny, h); if (nd < dist[j]) { dist[j] = nd; prev[j] = i; push(nd, j); }
    }
  }
  return { dist, prev, path(j) { const out = []; while (j !== start && j >= 0) { out.unshift([j % n, (j / n) | 0]); j = prev[j]; } return out; } };
}
// Czy walka się opłaca: bitwa jest powtarzalna (to samo ziarno co w prawdziwej walce tego dnia),
// więc SI rozgrywa ją na próbę i atakuje tylko, gdy wygra, tracąc najwyżej część armii.
// Wynik próby zależy tylko od dnia oraz stanu obu stron, więc pamiętamy go: bohater, który w jednej turze kilka razy
// wybiera cel, nie rozgrywa tej samej bitwy od nowa.
const armySig = a => a.map(x => x ? x.cid + x.n : '-').join();
const aiFightMemo = new WeakMap();
function aiWorthFight(st, h, foe, maxLoss = 0.4) {
  const key = [st.dayTotal, armySig(h.army), h.mana, h.exp, h.machines.join(), Object.values(h.equip).join(), foe.count, foe.army ? armySig(foe.army) : '', foe.garrison ? armySig(foe.garrison) + (townHero(st, foe) ? armySig(townHero(st, foe).army) : '') : '', foe.mana].join('|');
  let m = aiFightMemo.get(foe); if (!m) aiFightMemo.set(foe, m = new Map());
  const k = h.id + '|' + key; if (!m.has(k)) { if (m.size > 64) m.clear(); m.set(k, aiFightLoss(st, h, foe)); }
  return m.get(k) <= maxLoss;
}
// Jaką część armii bohater straci w próbnej walce (Infinity = przegra)
// (próbna walka: czary w niej zużywają manę bohaterów, więc po niej mana wraca do stanu sprzed walki)
function aiFightLoss(st, h, foe) {
  const mana = st.heroes.map(x => x.mana), B = simulateBattle(createBattle(st, h, foe)); st.heroes.forEach((x, k) => { x.mana = mana[k]; });
  if (B.over !== 'win') return Infinity;
  const lost = B.units.filter(u => u.side === 0).reduce((s, u) => s + (u.n0 - u.n) * CREATURES[u.cid].value, 0);
  return lost / Math.max(1, armyPower(h.army));
}
// Najlepszy cel bohatera: wartość celu maleje z odległością (dzień marszu ≈ połowa wartości).
// SI zna tylko to, co odkryła (mgła wojny): nieodkryte obiekty, miasta i bohaterowie nie są celami,
// a gdy w zasięgu nie ma nic lepszego, bohater idzie na zwiad na skraj mgły.
// Walki (potwory, miasta, bohaterowie) sprawdzamy symulacją dopiero wtedy, gdy są najlepszym kandydatem.
// Role: główny bohater walczy (potwory, skarbce, miasta, wrodzy bohaterowie), pomocnik zbiera to, co leży bez straży,
// bije tylko dużo słabszych, przejmuje kopalnie i zanosi głównemu armię z miast; pomocnicy nie biorą celów innych bohaterów.
function aiPickTarget(st, h, R) {
  const n = st.map.n, ex = playerOf(st, h.owner).explored, cands = [], start = h.y * n + h.x, helper = aiRole(st, h) === 'helper';
  const danger = aiDanger(st, h);
  const add = (i, value, what, foe) => { const c = aiClaims.get(i); if (value > 0 && i !== start && R.dist[i] < Infinity && (!danger[i] || what === 'reinforce' || what === 'feed') && (c == null || c === h.id)) cands.push({ i, score: value / (1 + R.dist[i] / 1500), what, foe }); };
  const hasArmy = armySize(h.army) > 0, power = armyStrength(h), fightK = helper ? 2.5 : 1;
  if (helper) { // dowóz armii do głównego bohatera: tym cenniejszy, im więcej (i im bliżej)
    const m = aiMain(st, playerOf(st, h.owner)), give = m ? feedGain(h, m) : 0; // tylko to, co główny naprawdę przyjmie (inaczej pomocnik stał obok bez końca i zagradzał drogę)
    if (m && give >= Math.max(250, armyPower(m.army) * 0.08)) add(m.y * n + m.x, give * 2.5 + 1500, 'feed', null);
  }
  for (const t of st.towns) {
    const i = t.y * n + t.x, occupant = heroAt(st, t.x, t.y);
    if (t.owner === h.owner) { const take = armyPower(takeableArmy(t.garrison, h.army)); if (!occupant && take > 0) add(i, take * (!hasArmy ? 20 : !helper && take > armyPower(h.army) * 0.3 ? 4 : 3), 'reinforce'); continue; }
    if (!hasArmy || aiPeace(st, t.owner, h.owner)) continue;
    // wartość miasta rośnie z siłą bohatera (późną grą silny bohater nie woli zbierać wzmocnień niż zdobywać miast); ostatnie miasto gracza cenniejsze
    const tp = townPower(st, t), last = t.owner >= 0 && st.towns.filter(o => o.owner === t.owner).length === 1 ? 1.5 : 1;
    if (power > tp * 0.8 * fightK) add(i, Math.max((t.owner >= 0 && playerOf(st, t.owner).human ? 30000 : 20000) + (tp ? 0 : 5000), power * 0.3) * last, 'town', t);
  }
  if (hasArmy) {
    for (const ob of st.objects) {
      if (ob.dead) continue; const i = ob.y * n + ob.x;
      if (ob.type === 'monster') {
        const mp = ob.count * CREATURES[ob.cid].value; if (power <= mp * fightK) continue;
        let best = -1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = ob.x + dx, y = ob.y + dy, j = y * n + x; if (x >= 0 && y >= 0 && x < n && y < n && st.guard[j] === ob.id + 1 && (best < 0 || R.dist[j] < R.dist[best])) best = j; }
        // strażnik przy kopalni, artefakcie albo skarbie jest wart tyle co to, czego pilnuje
        const guarded = st.objects.find(o => !o.dead && o !== ob && o.type !== 'monster' && Math.abs(o.x - ob.x) <= 1 && Math.abs(o.y - ob.y) <= 1);
        if (best >= 0) add(best, (helper ? 400 : 700) + mp * (helper ? 0.3 : 0.8) + (guarded ? (guarded.type === 'mine' ? 3500 : 1500) : 0), 'monster', ob); continue;
      }
      if (st.guard[i] || !objSeen(st, ob, h.owner)) continue; // najpierw trzeba pokonać strażnika; ukrytego skarbu SI jeszcze nie zna
      if (ob.type === 'res') add(i, ob.res === 'gold' ? ob.amount : ob.amount * (RARE.includes(ob.res) ? 250 : 120), 'res');
      else if (ob.type === 'chest') add(i, 1500, 'chest');
      else if (ob.type === 'art') add(i, 2500, 'art');
      else if (ob.type === 'site' && !siteUsed(st, ob, h)) { const v = aiSiteValue(st, h, ob); if (v > 0) add(i, v, 'site'); }
      else if (ob.type === 'mine' && ob.owner !== h.owner && !aiPeace(st, ob.owner, h.owner)) add(i, ob.kind === 'gold' ? 8000 : 3500, 'mine');
      else if (ob.type === 'bank' && !ob.cleared && !helper && power > bankPower(ob) * 1.3) add(i, 2000 + bankPower(ob) * 0.4, 'bank', ob);
    }
    for (const o of st.heroes) if (o.owner !== h.owner && !aiPeace(st, o.owner, h.owner) && !st.towns.some(t => t.x === o.x && t.y === o.y) && power > armyStrength(o) * 0.8 * fightK) add(o.y * n + o.x, Math.max(playerOf(st, o.owner).human ? 15000 : 8000, armyStrength(o) * 0.5), 'hero', o);
    // zwiad: wolne pole na skraju odkrytego terenu, tym cenniejsze, im więcej mgły wokół
    const r = 3, m = n + 1, S = new Int32Array(m * m); let best = -1, bestScore = 0; // sumy prefiksowe nieodkrytych pól
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) S[(y + 1) * m + x + 1] = (ex[y * n + x] ? 0 : 1) + S[y * m + x + 1] + S[(y + 1) * m + x] - S[y * m + x];
    for (let i = 0; i < n * n; i++) {
      if (R.dist[i] === Infinity || i === start || st.objAt[i] || st.guard[i] || danger[i]) continue;
      const x = i % n, y = (i / n) | 0, x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(n, x + r + 1), y1 = Math.min(n, y + r + 1);
      const fog = S[y1 * m + x1] - S[y0 * m + x1] - S[y1 * m + x0] + S[y0 * m + x0]; if (fog < 4) continue;
      const score = (300 + fog * 40) / (1 + R.dist[i] / 1500); if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best >= 0) cands.push({ i: best, score: bestScore, what: 'explore' });
  }
  // Graal: gdy SI zna całą mapę zagadki, idzie kopać; z Graalem w plecaku wraca do najbliższego własnego miasta
  const G2 = st.grail;
  if (G2 && G2.found < 0 && !hasGrail(h) && aiKnowsGrail(st, h.owner) && !st.heroes.some(o => o !== h && o.x === G2.x && o.y === G2.y)) add(G2.y * n + G2.x, 12000, 'dig');
  if (hasGrail(h)) for (const t of st.towns) if (t.owner === h.owner && !hasB(t, 'grail') && !heroAt(st, t.x, t.y)) add(t.y * n + t.x, 40000, 'grail');
  cands.sort((a, b) => b.score - a.score);
  let sims = 0;
  for (const c of cands) {
    if (!c.foe) return c;
    if (sims++ >= 4) continue; // najwyżej kilka prób walki na jeden wybór celu
    if (aiWorthFight(st, h, c.foe, helper ? 0.15 : 0.2)) return c;
  }
  return null;
}
// Tura SI to generator akcji: kroki bohaterów ({ kind: 'step' }, już wykonane w stanie, ekran może je
// odtworzyć), atak na człowieka ({ kind: 'defend' }: wynik bitwy wraca przez gen.next(res)) i początek tury gracza.
// Bez ekranu (testy, symulacje, szybka tura) generator rozgrywa runAiSync: obrona jest wtedy automatyczna.
function* aiBattle(st, h, foe, news) {
  const defOwner = foe.type === 'monster' || foe.type === 'bank' ? -1 : foe.owner, defName = foe.type === 'monster' || foe.type === 'bank' ? null : foe.garrison ? `miasto ${foe.name}` : heroTitle(foe);
  if (foe.type === 'monster') { // potwory chcą dołączyć: komputer bierze je za darmo albo gdy złota starczy z zapasem
    const re = neutralReaction(st, h, foe);
    if (re && re.kind === 'join' && re.cost * 2 + 500 <= playerOf(st, h.owner).resources.gold && joinMonsters(st, h, foe, re.cost)) return true;
  }
  let res;
  if (defOwner >= 0 && playerOf(st, defOwner).human) {
    const act = { kind: 'defend', h, foe, owner: defOwner }; res = yield act;
    if (!act.shown) tell(st, defOwner, `${h.name} (${ownerName(st, h.owner)}) atakuje: ${defName}. ${res.outcome === 'win' ? (res.captured ? 'Miasto przepadło.' : 'Twój bohater poległ.') : 'Obrona się udała!'}`);
  } else res = resolveBattle(simulateBattle(createBattle(st, h, foe)), false);
  if (res.outcome === 'win') gainExp(st, h, res.exp);
  return res.outcome === 'win';
}
// Ile warte jest dla SI miejsce na mapie (0 = nie warto iść): kapliczka ze znanym czarem, pełna mana itp.
function aiSiteValue(st, h, ob) {
  const S = SITES[ob.kind];
  if (ob.kind === 'shrine' && h.spells.includes(ob.spell)) return 0;
  if (ob.kind === 'well' && h.mana >= heroMaxMana(h) * 0.6) return 0;
  if ((ob.kind === 'temple' || ob.kind === 'fountain') && h.boost && h.boost[ob.kind === 'temple' ? 'morale' : 'luck']) return 0;
  if (ob.kind === 'witchHut' && (heroSkill(h, ob.skill) || h.skills.length >= MAX_SKILLS || skillWeight(h.cls, ob.skill) < 1)) return 0; // SI odmawia umiejętności obcych swojej klasie
  if (ob.kind === 'prison' && st.heroes.filter(o => o.owner === h.owner).length >= heroLimit(st)) return 0;
  if ((ob.kind === 'oasis' || ob.kind === 'buoy') && h.boost && h.boost.morale) return 0;
  if (ob.kind === 'magicSpring' && h.mana >= heroMaxMana(h)) return 0;
  if (ob.kind === 'mushroomRing' && h.boost && h.boost.luck) return 0;
  if (ob.kind === 'dwarfForge' && (playerOf(st, h.owner).resources.gold < 4000 || playerOf(st, h.owner).resources.ore < 8)) return 0;
  if (ob.kind === 'school' && playerOf(st, h.owner).resources.gold < SITES.school.cost + 2000) return 0; // szkoła: gdy złota starczy z zapasem
  if (ob.kind === 'hillFort') { const R = playerOf(st, h.owner).resources, plan = hillFortPlan(h).filter(p => canPay(R, p.cost) && R.gold - (p.cost.gold || 0) >= 1500); return plan.length ? 1500 + plan.reduce((s, p) => s + p.n * (CREATURES[p.to].value - CREATURES[p.from].value), 0) * 0.5 : 0; }
  if (ob.kind === 'inn' && h.boost && h.boost.morale > 0) return 300; // plotka i tak się przyda
  if (ob.kind === 'questHut') { const m = st.objects[ob.target]; return ob.done == null && (!m || m.dead) ? 4000 : 0; } // nagroda za pokonane stwory
  if (ob.kind === 'barrow') return ob.looted == null ? 3500 : 0; // artefakt wart klątwy
  if (ob.kind === 'lighthouse') return ob.owner === h.owner ? 0 : S.ai;
  if (ob.kind === 'caravanserai') { const o = bazaarOffer(st, ob); return o && playerOf(st, h.owner).resources.gold >= o.price + 4000 ? 2000 : 0; }
  if (ob.kind === 'dwelling' && (!dwellMax(st, h, ob) || !h.army.includes(null) && !h.army.some(x => x && x.cid === ob.cid))) return 0;
  return S.ai;
}
// Wejście na pole celu (tak jak visitObject u człowieka, ale bez okien)
function* aiVisit(st, h, i, news) {
  const n = st.map.n, R = playerOf(st, h.owner).resources, x = i % n, y = (i / n) | 0;
  const guard = st.guard[i] && st.objects[st.guard[i] - 1];
  if (guard && !guard.dead && !(yield* aiBattle(st, h, guard, news))) return;
  if (h.x !== x || h.y !== y) return; // przegrana odesłała bohatera do domu
  const other = st.heroes.find(o => o !== h && o.x === x && o.y === y), ob = objectAt(st, i);
  if (ob && ob.type === 'town') {
    const t = st.towns[ob.townId];
    if (t.owner !== h.owner && allied(st, h.owner, t.owner)) return; // miasto sojusznika
    if (t.owner === h.owner) { if (buildGrail(st, t, h)) tell(st, -1, `${ownerName(st, h.owner)} wznosi budowlę Graala w mieście ${t.name}.`); armyTransfer(t.garrison, h.army); return; }
    if (!armySize(t.garrison) && !townHero(st, t)) { tell(st, t.owner, `${h.name} (${ownerName(st, h.owner)}) zajmuje bezbronne miasto ${t.name}.`); captureTown(st, t, h.owner); rebuildObjIndex(st); }
    else yield* aiBattle(st, h, t, news);
    return;
  }
  if (other && !allied(st, other.owner, h.owner)) { yield* aiBattle(st, h, other, news); return; }
  if (!ob) return;
  if (ob.type === 'res') { R[ob.res] += ob.amount; removeObject(st, ob); }
  else if (ob.type === 'chest') { R.gold += ob.gold; removeObject(st, ob); }
  else if (ob.type === 'art') { giveArtifact(h, ob.art); removeObject(st, ob); }
  else if (ob.type === 'site' && ob.kind === 'witchHut' && skillWeight(h.cls, ob.skill) < 1) siteDiscover(ob, h.owner); // odmawia wiedźmie
  else if (ob.type === 'site') { const r = useSite(st, h, ob); if (r.exp) gainExp(st, h, r.exp); }
  else if (ob.type === 'bank') { if (!ob.cleared) yield* aiBattle(st, h, ob, news); }
  else if (ob.type === 'mine' && ob.owner >= 0 && ob.owner !== h.owner && allied(st, h.owner, ob.owner)) return;
  else if (ob.type === 'mine') { if (ob.owner >= 0 && ob.owner !== h.owner) tell(st, ob.owner, `Gracz ${ownerName(st, h.owner).replace('gracz ', '')} przejmuje twoją kopalnię (${MINES[ob.kind].name.toLowerCase()}).`); ob.owner = h.owner; MapRender.miniDirty = true; }
}
const aiKnowsGrail = (st, pid) => obelisksTotal(st) > 0 && obelisksSeen(st, pid) >= obelisksTotal(st);
// Czary SI na mapie: Wiatr w plecy, gdy cel jest dalej niż dzisiejszy ruch (i zostaje mana na bitwę), Drzwi wymiarów:
// skok na najdalsze pole ścieżki do celu, które oszczędza co najmniej 300 punktów ruchu. Zwraca true, gdy bohater się przeniósł.
const aiCan = (h, id) => hasBook(h) && knows(h, id) && h.mana >= spellCost(h, id) + Math.round(heroMaxMana(h) * 0.3);
function aiMapSpells(st, h, R, target) {
  if (R.dist[target.i] <= h.mp || h.boat) return false;
  if (aiCan(h, 'tailwind') && h.windDay !== st.dayTotal) castAdventure(st, h, 'tailwind');
  if (!aiCan(h, 'dimensionDoor') || doorCheck(st, h)) return false;
  const path = R.path(target.i).slice(0, -1), n = st.map.n;
  for (let k = path.length - 1; k >= 0; k--) { const [x, y] = path[k]; if (R.dist[y * n + x] - 300 < 300) break; if (!doorCheck(st, h, x, y)) { castAdventure(st, h, 'dimensionDoor', { x, y }); reveal(st, x, y, heroSight(h), h.owner); return true; } }
  return false;
}
function* aiMoveHero(st, h, news) {
  const G2 = st.grail; // stoi na miejscu Graala od wczoraj: kopie z pełnymi punktami ruchu
  if (G2 && G2.found < 0 && h.x === G2.x && h.y === G2.y && aiKnowsGrail(st, h.owner) && digGrail(st, h).found) tell(st, -1, `${h.name} (${ownerName(st, h.owner)}) wykopuje Graala!`);
  for (let plan = 0; plan < 12 && st.heroes.includes(h); plan++) {
    const R = aiReach(st, h), target = aiPickTarget(st, h, R); if (!target) return;
    aiClaims.set(target.i, h.id);
    if (aiMapSpells(st, h, R, target)) continue; // czar na mapie przybliżył cel: plan od nowa
    const path = R.path(target.i); if (target.what === 'feed') path.pop(); // do głównego bohatera: staje obok
    if (target.what === 'feed' && !path.length) { const m = st.heroes.find(o => o.owner === h.owner && o.y * st.map.n + o.x === target.i); if (!m || !aiFeed(st, h, m)) return; continue; }
    if (!path.length) return;
    for (const [nx, ny] of path) {
      const c = stepCost(st.map, h.x, h.y, nx, ny, h); if (c > h.mp) return;
      const blocker = heroAt(st, nx, ny); if (blocker && blocker !== h && allied(st, blocker.owner, h.owner) && blocker.garrison == null) return; // pole zajmuje własny bohater (np. stoi w kapliczce): nie wchodzimy na niego
      const fx = h.x, fy = h.y; h.mp -= c; h.prev = [fx, fy]; h.x = nx; h.y = ny; if (nx !== fx) h.dir = nx > fx ? 1 : -1;
      reveal(st, nx, ny, heroSight(h), h.owner);
      yield { kind: 'step', h, fx, fy };
    }
    if (target.what === 'feed') { // obok głównego bohatera: oddaje armię i artefakty
      const m = st.heroes.find(o => o.owner === h.owner && o.y * st.map.n + o.x === target.i); h.prev = null;
      if (!m || Math.max(Math.abs(m.x - h.x), Math.abs(m.y - h.y)) > 1 || !aiFeed(st, h, m)) return; continue;
    }
    yield* aiVisit(st, h, target.i, news); h.prev = null;
    if (target.what === 'dig') return; // kopać można dopiero jutro, z pełnymi punktami ruchu
    if (!st.heroes.includes(h) || !armySize(h.army) && target.what !== 'reinforce') return;
  }
}
function* aiTurn(st, p, news) {
  yield { kind: 'player', p };
  for (const t of st.towns.filter(t => t.owner === p.id)) aiManageTown(st, p, t);
  aiClaims.clear(); const m = aiMain(st, p); // najpierw pomocnicy (dowiozą armię), na końcu główny bohater
  for (const h of st.heroes.filter(h => h.owner === p.id && h !== m)) yield* aiMoveHero(st, h, news);
  if (m && st.heroes.includes(m)) yield* aiMoveHero(st, m, news);
  for (const t of st.towns.filter(t => t.owner === p.id)) { const h = heroInTown(st, t); if (h) armyTransfer(t.garrison, h.army); }
}
// Kolejka tur po graczu `from`: komputery po kolei, przy przejściu przez koniec listy nowy dzień ({ kind: 'day' }),
// aż do następnego człowieka w grze. Wartość zwracana = numer człowieka, który gra teraz (przy jednym człowieku znowu from).
function* turnsAfter(st, from, news) {
  const N = st.players.length;
  for (let k = 1; k <= N; k++) {
    const id = (from + k) % N;
    if (id === 0) { const d = advanceDay(st); yield { kind: 'day', newWeek: d.newWeek }; }
    const p = st.players[id]; if (p.out) continue;
    if (!playerAlive(st, p)) { p.out = true; continue; } // bez miast i bohaterów: odpada (ogłasza to ekran)
    if (p.human) return id;
    yield* aiTurn(st, p, news);
  }
  return from;
}
// Nowy dzień dla wszystkich: data, ruch i mana bohaterów, dochód, tydzień; wieści trafiają do skrzynek ludzi
function advanceDay(st) {
  st.day++; st.dayTotal++; let newWeek = false, newMonth = false;
  if (st.day > 7) { st.day = 1; st.week++; newWeek = true; if (st.week > 4) { st.week = 1; st.month++; newMonth = true; } }
  for (const h of st.heroes) {
    h.mp = heroMaxMP(h);
    const t = st.towns.find(t => t.x === h.x && t.y === h.y && t.owner === h.owner); // w mieście z gildią pełna mana, poza nim +1 dziennie
    if (t && guildLevel(t)) visitGuild(st, t, h); else h.mana = Math.min(heroMaxMana(h), h.mana + 1 + skillVal(h, 'mysticism'));
    if (t) { const m = specialVisit(st, t, h); if (m && h.owner !== ME) h.mp = heroMaxMP(h); } // budowla specjalna (stajnie, wir many, klatka, Walhalla)
  }
  collectIncome(st); caravanArrivals(st); tallyDaily(st); if (newWeek) recordHistory(st); // statystyki: szczyty i wykres potęgi co tydzień
  for (const t of st.towns) t.builtToday = false;
  if (newWeek) st.weekNews = { wk: st.month * 10 + st.week, month: newMonth, text: startWeek(st, newMonth) }; // ludzie zobaczą ogłoszenie astrologów (KRONIKA TYGODNIA)
  dailyTownCheck(st); rebuildObjIndex(st); MapRender.miniDirty = true;
  return { newWeek };
}
// Obrona człowieka bez ekranu bitwy: walka automatyczna, doświadczenie dla obrońcy
function autoDefend(st, act) {
  const D = act.foe.garrison ? townHero(st, act.foe) : act.foe, res = resolveBattle(simulateBattle(createBattle(st, act.h, act.foe)), false);
  if (res.outcome !== 'win' && D && res.foeExp) gainExp(st, D, res.foeExp);
  return res;
}
function runAiSync(st, gen) { let input; for (;;) { const r = gen.next(input); input = undefined; if (r.done) return r.value; if (r.value.kind === 'defend') input = autoDefend(st, r.value); } }

// --- koniec gry: gracz odpada, gdy nie ma miast ani bohaterów albo przez 7 dni nie ma żadnego miasta ---
const NO_TOWN_DAYS = 7;
const playerAlive = (st, p) => !p.out && (st.towns.some(t => t.owner === p.id) || st.heroes.some(h => h.owner === p.id));
function eliminate(st, p) { p.out = true; for (const h of st.heroes.filter(h => h.owner === p.id)) removeHero(st, h); }
// Po każdym dniu: licznik dni bez miasta; ostrzeżenia i wieści trafiają do skrzynek ludzi
function dailyTownCheck(st) {
  for (const p of st.players) {
    if (p.out) continue;
    if (st.towns.some(t => t.owner === p.id)) { p.noTownDays = 0; continue; }
    p.noTownDays = (p.noTownDays || 0) + 1;
    if (p.noTownDays >= NO_TOWN_DAYS) { eliminate(st, p); tell(st, -1, `Gracz ${playerName(st, p.id).replace('gracz ', '')} nie odzyskał miasta i odpada z gry.`); }
    else tell(st, p.id, `Nie masz żadnego miasta! Zdobądź je w ciągu ${NO_TOWN_DAYS - p.noTownDays + 1} dni, inaczej przegrasz.`);
  }
}
// Skrzynka wieści gracza-człowieka (to = -1: wszyscy ludzie w grze). Komputer wieści nie potrzebuje.
function tell(st, to, text) { for (const p of st.players) if (p.human && !p.out && (to < 0 || p.id === to)) (p.inbox = p.inbox || []).push(text); }
function takeInbox(p) { const a = p.inbox || []; p.inbox = []; return a; }
// Wynik gry: 'win', 'lose' albo null. Bez przeciwników (tryb swobodny) nie ma zwycięstwa.
// Hot-seat: 'lose', gdy odpadli wszyscy ludzie; 'win', gdy został jeden gracz i jest człowiekiem (st.winner).
function gameResult(st) {
  for (const p of st.players) if (!p.out && !playerAlive(st, p)) p.out = true;
  if (hotseat(st)) {
    const left = st.players.filter(p => !p.out);
    if (!left.some(p => p.human)) return 'lose';
    if (left.every(p => allied(st, p.id, left[0].id))) { st.winner = (left.find(p => p.human) || left[0]).id; return 'win'; } // został jeden gracz albo jedna drużyna
    return null;
  }
  const me = human(st); if (me.out) return 'lose';
  const foes = st.players.filter(p => !allied(st, p.id, me.id)); if (!foes.length) return null; // sojusznicy komputerowi nie są rywalami
  return foes.every(p => p.out) ? 'win' : null;
}
