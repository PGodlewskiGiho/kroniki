// ==================== GRACZE KOMPUTEROWI ================================================
// Tura przeciwnika dzieje się natychmiast (bez animacji), po turze człowieka, a przed nowym dniem.
// SI widzi całą mapę. Kolejność: miasta (budowa, werbunek, najem), potem bohaterowie wybierają cele
// z mapy odległości (aiReach) i idą do nich, dopóki starcza ruchu. Wieści ważne dla człowieka trafiają do news.
const AI_BUILD_ORDER = ['dw1', 'dw2', 'hall2', 'market', 'fort', 'dw3', 'tavern', 'dw4', 'citadel', 'guild1', 'dw1u', 'dw2u', 'hall3', 'dw5', 'dw3u',
  'castle', 'smith', 'dw4u', 'dw6', 'dw5u', 'hall4', 'dw6u', 'guild2', 'dw7', 'silo', 'guild3', 'dw7u'];
// Dokupuje brakujące surowce na koszt cost (po kursie rynku gracza), jeśli starczy złota. Zwraca, czy kupił.
function buyMissing(st, owner, cost) {
  if (!marketCount(st, owner)) return false;
  const R = playerOf(st, owner).resources, deals = []; let gold = cost.gold || 0;
  for (const r of RESOURCES) if (r.id !== 'gold' && (cost[r.id] || 0) > R[r.id]) { const k = cost[r.id] - R[r.id], L = marketLot(st, owner, 'gold', r.id); deals.push([r.id, k, L]); gold += Math.ceil(k / L.get) * L.give; }
  if (!deals.length || R.gold < gold) return false;
  for (const [r, k, L] of deals) trade(st, owner, 'gold', r, Math.ceil(k / L.get));
  return true;
}
const aiMaxHeroes = st => (st.map.n >= 108 ? 3 : 2);
// Rozejm: przez tyle dni SI nie atakuje miast ani bohaterów człowieka (Łatwy 21, Normalny 14, Trudny 7, wyżej 0)
const AI_PEACE_DAYS = [21, 14, 7, 0, 0];
const aiPeace = (st, owner) => owner === ME && st.dayTotal <= AI_PEACE_DAYS[st.settings.difficulty];
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
function aiManageTown(st, p, t) {
  // pierwsza osiągalna z trzech kolejnych budowli z listy (żeby brak rudy na Fort nie wstrzymał wszystkiego)
  if (!t.builtToday) {
    const next = AI_BUILD_ORDER.map(id => BUILD_BY_ID[id]).filter(B => !hasB(t, B.id) && reqMet(t, B)).slice(0, 3);
    const B = next.find(B => canAfford(st, B.cost, p.id)) || (next[0] && buyMissing(st, p.id, next[0].cost) ? next[0] : null); if (B) buildIn(st, t, B);
  }
  const heroes = st.heroes.filter(h => h.owner === p.id);
  if (heroes.length < aiMaxHeroes(st) && hasB(t, 'tavern') && !heroAt(st, t.x, t.y) && p.resources.gold >= HERO_COST + 2000) {
    const k = tavernOffer(st, p.id).findIndex(Boolean); if (k >= 0) hireHero(st, t, k);
  }
  for (let L = 7; L >= 1; L--) {
    if (!hasB(t, 'dw' + L) || !t.avail[L]) continue;
    const cid = dwellingUnits(t, L).at(-1), n = Math.min(t.avail[L], maxAffordable(st, unitCost(cid), p.id));
    if (n > 0) recruit(st, t, L, cid, n);
  }
  const h = heroInTown(st, t); if (!h) return;
  armyTransfer(t.garrison, h.army);
  // kuźnia: machiny po werbunku, gdy zostaje zapas złota
  if (hasB(t, 'smith')) for (const id of MACHINES) if (!h.machines.includes(id) && p.resources.gold >= CREATURES[id].cost.gold + 3000) buyMachine(st, t, h, id);
}
// Mapa odległości od bohatera (Dijkstra, koszty ruchu jak u człowieka) tylko po terenie odkrytym przez jego
// gracza. Pola z obiektem, strażnikiem albo bohaterem są przystankami: można na nie wejść, ale nie przejść dalej.
function aiReach(st, h) {
  const map = st.map, n = map.n, N = n * n, ex = playerOf(st, h.owner).explored, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), start = h.y * n + h.x;
  const heap = [[0, start]], push = e => { heap.push(e); let i = heap.length - 1; while (i) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const stop = i => !!(st.objAt[i] || st.guard[i] || heroAt(st, i % n, (i / n) | 0));
  dist[start] = 0;
  while (heap.length) {
    const [d, i] = pop(); if (d > dist[i]) continue; if (i !== start && stop(i)) continue;
    const x = i % n, y = (i / n) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = x + DX8[k], ny = y + DY8[k]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const j = ny * n + nx; if (!ex[j] || map.terrain[j] === TER.WATER || map.obst[j]) continue;
      const ob = objectAt(st, j); if (ob && ob.blocks && j !== ob.y * n + ob.x) continue; // bok miasta/kopalni: tylko przez wejście
      const nd = d + stepCost(map, x, y, nx, ny, h); if (nd < dist[j]) { dist[j] = nd; prev[j] = i; push([nd, j]); }
    }
  }
  return { dist, prev, path(j) { const out = []; while (j !== start && j >= 0) { out.unshift([j % n, (j / n) | 0]); j = prev[j]; } return out; } };
}
// Czy walka się opłaca: bitwa jest powtarzalna (to samo ziarno co w prawdziwej walce tego dnia),
// więc SI rozgrywa ją na próbę i atakuje tylko, gdy wygra, tracąc najwyżej część armii.
function aiWorthFight(st, h, foe) {
  const B = simulateBattle(createBattle(st, h, foe)); if (B.over !== 'win') return false;
  const lost = B.units.filter(u => u.side === 0).reduce((s, u) => s + (u.n0 - u.n) * CREATURES[u.cid].value, 0);
  return lost <= armyPower(h.army) * 0.4;
}
// Najlepszy cel bohatera: wartość celu maleje z odległością (dzień marszu ≈ połowa wartości).
// SI zna tylko to, co odkryła (mgła wojny): nieodkryte obiekty, miasta i bohaterowie nie są celami,
// a gdy w zasięgu nie ma nic lepszego, bohater idzie na zwiad na skraj mgły.
// Walki (potwory, miasta, bohaterowie) sprawdzamy symulacją dopiero wtedy, gdy są najlepszym kandydatem.
function aiPickTarget(st, h, R) {
  const n = st.map.n, ex = playerOf(st, h.owner).explored, cands = [], start = h.y * n + h.x;
  const add = (i, value, what, foe) => { if (value > 0 && i !== start && R.dist[i] < Infinity) cands.push({ i, score: value / (1 + R.dist[i] / 1500), what, foe }); };
  const hasArmy = armySize(h.army) > 0, power = armyStrength(h);
  for (const t of st.towns) {
    const i = t.y * n + t.x, occupant = heroAt(st, t.x, t.y);
    if (t.owner === h.owner) { if (!occupant && armyPower(t.garrison) > 0) add(i, armyPower(t.garrison) * (hasArmy ? 3 : 20), 'reinforce'); continue; }
    if (!hasArmy || aiPeace(st, t.owner)) continue;
    const tp = townPower(st, t); if (power > tp * 0.8) add(i, (t.owner === ME ? 30000 : 20000) + (tp ? 0 : 5000), 'town', t);
  }
  if (hasArmy) {
    for (const ob of st.objects) {
      if (ob.dead) continue; const i = ob.y * n + ob.x;
      if (ob.type === 'monster') {
        const mp = ob.count * CREATURES[ob.cid].value; if (power <= mp) continue;
        let best = -1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = ob.x + dx, y = ob.y + dy, j = y * n + x; if (x >= 0 && y >= 0 && x < n && y < n && st.guard[j] === ob.id + 1 && (best < 0 || R.dist[j] < R.dist[best])) best = j; }
        // strażnik przy kopalni, artefakcie albo skarbie jest wart tyle co to, czego pilnuje
        const guarded = st.objects.find(o => !o.dead && o !== ob && o.type !== 'monster' && Math.abs(o.x - ob.x) <= 1 && Math.abs(o.y - ob.y) <= 1);
        if (best >= 0) add(best, 400 + mp * 0.5 + (guarded ? (guarded.type === 'mine' ? 3500 : 1500) : 0), 'monster', ob); continue;
      }
      if (st.guard[i]) continue; // najpierw trzeba pokonać strażnika
      if (ob.type === 'res') add(i, ob.res === 'gold' ? ob.amount : ob.amount * (RARE.includes(ob.res) ? 250 : 120), 'res');
      else if (ob.type === 'chest') add(i, 1500, 'chest');
      else if (ob.type === 'art') add(i, 2500, 'art');
      else if (ob.type === 'site' && !siteUsed(st, ob, h)) { const v = aiSiteValue(st, h, ob); if (v > 0) add(i, v, 'site'); }
      else if (ob.type === 'mine' && ob.owner !== h.owner && !aiPeace(st, ob.owner)) add(i, ob.kind === 'gold' ? 8000 : 3500, 'mine');
    }
    for (const o of st.heroes) if (o.owner !== h.owner && !aiPeace(st, o.owner) && !st.towns.some(t => t.x === o.x && t.y === o.y) && power > armyStrength(o) * 0.8) add(o.y * n + o.x, o.owner === ME ? 15000 : 8000, 'hero', o);
    // zwiad: wolne pole na skraju odkrytego terenu, tym cenniejsze, im więcej mgły wokół
    const r = 3, m = n + 1, S = new Int32Array(m * m); let best = -1, bestScore = 0; // sumy prefiksowe nieodkrytych pól
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) S[(y + 1) * m + x + 1] = (ex[y * n + x] ? 0 : 1) + S[y * m + x + 1] + S[(y + 1) * m + x] - S[y * m + x];
    for (let i = 0; i < n * n; i++) {
      if (R.dist[i] === Infinity || i === start || st.objAt[i] || st.guard[i]) continue;
      const x = i % n, y = (i / n) | 0, x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(n, x + r + 1), y1 = Math.min(n, y + r + 1);
      const fog = S[y1 * m + x1] - S[y0 * m + x1] - S[y1 * m + x0] + S[y0 * m + x0]; if (fog < 4) continue;
      const score = (300 + fog * 40) / (1 + R.dist[i] / 1500); if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best >= 0) cands.push({ i: best, score: bestScore, what: 'explore' });
  }
  cands.sort((a, b) => b.score - a.score);
  let sims = 0;
  for (const c of cands) {
    if (!c.foe) return c;
    if (sims++ >= 4) continue; // najwyżej kilka prób walki na jeden wybór celu
    if (aiWorthFight(st, h, c.foe)) return c;
  }
  return null;
}
// Tura SI to generator akcji: kroki bohaterów ({ kind: 'step' }, już wykonane w stanie, ekran może je
// odtworzyć), atak na człowieka ({ kind: 'defend' }: wynik bitwy wraca przez gen.next(res)) i początek tury gracza.
// Bez ekranu (testy, symulacje, szybka tura) generator rozgrywa runAiSync: obrona jest wtedy automatyczna.
function* aiBattle(st, h, foe, news) {
  const defOwner = foe.type === 'monster' ? -1 : foe.owner, defName = foe.type === 'monster' ? null : foe.garrison ? `miasto ${foe.name}` : heroTitle(foe);
  let res;
  if (defOwner === ME) {
    const act = { kind: 'defend', h, foe }; res = yield act;
    if (!act.shown) news.push(`${h.name} (${ownerName(st, h.owner)}) atakuje: ${defName}. ${res.outcome === 'win' ? (res.captured ? 'Miasto przepadło.' : 'Twój bohater poległ.') : 'Obrona się udała!'}`);
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
    if (t.owner === h.owner) { armyTransfer(t.garrison, h.army); return; }
    if (!armySize(t.garrison) && !heroInTown(st, t)) { if (t.owner === ME) news.push(`${h.name} (${ownerName(st, h.owner)}) zajmuje bezbronne miasto ${t.name}.`); captureTown(st, t, h.owner); rebuildObjIndex(st); }
    else yield* aiBattle(st, h, t, news);
    return;
  }
  if (other && other.owner !== h.owner) { yield* aiBattle(st, h, other, news); return; }
  if (!ob) return;
  if (ob.type === 'res') { R[ob.res] += ob.amount; removeObject(st, ob); }
  else if (ob.type === 'chest') { R.gold += ob.gold; removeObject(st, ob); }
  else if (ob.type === 'art') { giveArtifact(h, ob.art); removeObject(st, ob); }
  else if (ob.type === 'site') { const r = useSite(st, h, ob); if (r.exp) gainExp(st, h, r.exp); }
  else if (ob.type === 'mine') { if (ob.owner === ME) news.push(`Gracz ${ownerName(st, h.owner).replace('gracz ', '')} przejmuje twoją kopalnię (${MINES[ob.kind].name.toLowerCase()}).`); ob.owner = h.owner; MapRender.miniDirty = true; }
}
function* aiMoveHero(st, h, news) {
  for (let plan = 0; plan < 12 && st.heroes.includes(h); plan++) {
    const R = aiReach(st, h), target = aiPickTarget(st, h, R); if (!target) return;
    const path = R.path(target.i); if (!path.length) return;
    for (const [nx, ny] of path) {
      const c = stepCost(st.map, h.x, h.y, nx, ny, h); if (c > h.mp) return;
      const fx = h.x, fy = h.y; h.mp -= c; h.prev = [fx, fy]; h.x = nx; h.y = ny; if (nx !== fx) h.dir = nx > fx ? 1 : -1;
      reveal(st, nx, ny, heroSight(h), h.owner);
      yield { kind: 'step', h, fx, fy };
    }
    yield* aiVisit(st, h, target.i, news); h.prev = null;
    if (!st.heroes.includes(h) || !armySize(h.army) && target.what !== 'reinforce') return;
  }
}
function* aiTurn(st, p, news) {
  yield { kind: 'player', p };
  for (const t of st.towns.filter(t => t.owner === p.id)) aiManageTown(st, p, t);
  for (const h of st.heroes.filter(h => h.owner === p.id)) yield* aiMoveHero(st, h, news);
  for (const t of st.towns.filter(t => t.owner === p.id)) { const h = heroInTown(st, t); if (h) armyTransfer(t.garrison, h.army); }
}
function* aiAllTurns(st, news) { for (const p of st.players) if (!p.human && !p.out) yield* aiTurn(st, p, news); }
// Obrona człowieka bez ekranu bitwy: walka automatyczna, doświadczenie dla obrońcy
function autoDefend(st, act) {
  const D = act.foe.garrison ? heroInTown(st, act.foe) : act.foe, res = resolveBattle(simulateBattle(createBattle(st, act.h, act.foe)), false);
  if (res.outcome !== 'win' && D && res.foeExp) gainExp(st, D, res.foeExp);
  return res;
}
function runAiSync(st, gen) { let input; for (;;) { const r = gen.next(input); input = undefined; if (r.done) return; if (r.value.kind === 'defend') input = autoDefend(st, r.value); } }

// --- koniec gry: gracz odpada, gdy nie ma miast ani bohaterów albo przez 7 dni nie ma żadnego miasta ---
const NO_TOWN_DAYS = 7;
const playerAlive = (st, p) => !p.out && (st.towns.some(t => t.owner === p.id) || st.heroes.some(h => h.owner === p.id));
function eliminate(st, p) { p.out = true; for (const h of st.heroes.filter(h => h.owner === p.id)) removeHero(st, h); }
// Po każdym dniu: licznik dni bez miasta. Zwraca wieści dla człowieka.
function dailyTownCheck(st) {
  const news = [];
  for (const p of st.players) {
    if (p.out) continue;
    if (st.towns.some(t => t.owner === p.id)) { p.noTownDays = 0; continue; }
    p.noTownDays = (p.noTownDays || 0) + 1;
    if (p.noTownDays >= NO_TOWN_DAYS) { eliminate(st, p); if (!p.human) news.push(`Gracz ${ownerName(st, p.id).replace('gracz ', '')} nie odzyskał miasta i odpada z gry.`); }
    else if (p.human) news.push(`Nie masz żadnego miasta! Zdobądź je w ciągu ${NO_TOWN_DAYS - p.noTownDays + 1} dni, inaczej przegrasz.`);
  }
  return news;
}
// Wynik gry: 'win', 'lose' albo null. Bez przeciwników (tryb swobodny) nie ma zwycięstwa.
function gameResult(st) {
  const me = human(st); if (me.out || !playerAlive(st, me)) return 'lose';
  const foes = st.players.filter(p => !p.human); if (!foes.length) return null;
  for (const p of foes) if (!p.out && !playerAlive(st, p)) p.out = true;
  return foes.every(p => p.out) ? 'win' : null;
}

