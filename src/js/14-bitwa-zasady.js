// ==================== BITWA: ZASADY ====================================================
// Pole bitwy: siatka heksów BCOLS×BROWS w układzie „odd-r” (co drugi rząd przesunięty w prawo).
// Strona 0 = atakujący bohater (lewa krawędź), strona 1 = obrońca (prawa): potwór neutralny, bohater
// albo miasto (bohater w mieście + garnizon). Stan bitwy (B) nie trafia do zapisu gry.
const BCOLS = 13, BROWS = 9;
const hexKey = (x, y) => y * BCOLS + x;
const inField = (x, y) => x >= 0 && y >= 0 && x < BCOLS && y < BROWS;
function hexNeighbors(x, y) {
  const d = y & 1 ? [[1, 0], [-1, 0], [0, -1], [1, -1], [0, 1], [1, 1]] : [[1, 0], [-1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]];
  return d.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => inField(a, b));
}
const hexAdjacent = (a, b) => hexNeighbors(a.x, a.y).some(([x, y]) => x === b.x && y === b.y);
// Potwory neutralne dzielą się na kilka oddziałów (jak w oryginale)
function splitMonster(count) {
  const k = Math.min(count, count >= 20 ? 5 : count >= 8 ? 3 : count >= 3 ? 2 : 1), out = [];
  for (let i = 0; i < k; i++) out.push(Math.floor(count / k) + (i < count % k ? 1 : 0));
  return out;
}
const spreadRows = k => Array.from({ length: k }, (_, i) => Math.round((i + 0.5) * BROWS / k - 0.5));
// B.sides[s] = { owner, hero, monster, town }; oddział pamięta, skąd przyszedł (src + slot), żeby tam wrócić po bitwie.
const armyEntries = (a, src) => a.map((s, slot) => s && { cid: s.cid, n: s.n, src, slot }).filter(Boolean);
function battleSide(st, foe) {
  if (foe.type === 'bank') { // załoga skarbca: każdy rodzaj w jednym oddziale, liczne rozbite na dwa (najwyżej 7 oddziałów)
    const stacks = []; for (const [cid, n] of foe.guards) (n >= 10 && foe.guards.length <= 3 ? [Math.ceil(n / 2), Math.floor(n / 2)] : [n]).forEach(k => stacks.push({ cid, n: k, src: null, slot: null }));
    return { owner: -1, hero: null, monster: null, bank: foe, town: null, key: foe.id, stacks: stacks.slice(0, 7) };
  }
  if (foe.type === 'monster') return { owner: -1, hero: null, monster: foe, town: null, key: foe.id, stacks: splitMonster(foe.count).map(n => ({ cid: foe.cid, n, src: null, slot: null })) };
  if (foe.garrison) { // miasto: bohater stojący w mieście broni się razem z garnizonem
    const h = townHero(st, foe); // bohater w garnizonie, a gdy go nie ma: bohater w bramie
    return { owner: foe.owner, hero: h, monster: null, town: foe, key: 9000 + st.towns.indexOf(foe), stacks: [...(h ? armyEntries(h.army, 'hero') : []), ...armyEntries(foe.garrison, 'garrison')] };
  }
  return { owner: foe.owner, hero: foe, monster: null, town: null, key: 5000 + foe.id, stacks: armyEntries(foe.army, 'hero') };
}
// Oddziały jednej strony w kolumnach od krawędzi (do 9 w kolumnie; miasto z bohaterem może mieć ich 14)
function placeSide(B, side, stacks) {
  for (let c = 0; c * BROWS < stacks.length; c++) {
    const col = stacks.slice(c * BROWS, (c + 1) * BROWS), rows = spreadRows(col.length);
    col.forEach((e, k) => {
      const cr = CREATURES[e.cid], x = side === 0 ? c : BCOLS - 1 - c;
      B.units.push({ id: B.units.length, side, cid: e.cid, n: e.n, n0: e.n, hp: cr.hp, shots: cr.shots || 0, x, y: rows[k], src: e.src, slot: e.slot, retaliated: false, defending: false, waited: false, dead: false, buffs: {} });
    });
  }
}
// Machiny bohatera stają za armią: najpierw w narożnikach (balista u góry, namiot na dole), potem na wolnych polach od krawędzi
function placeMachines(B, side, h) {
  const ms = MACHINES.filter(id => h && (h.machines || []).includes(id)), rows = [0, BROWS - 1, 1, BROWS - 2, 2, 6, 3, 5, 4];
  for (const cid of ms) {
    let spot = null;
    for (let c = 0; c < 3 && !spot; c++) for (const y of rows) { const x = side === 0 ? c : BCOLS - 1 - c; if (isFree(B, x, y, side)) { spot = [x, y]; break; } }
    if (!spot) continue; const cr = CREATURES[cid];
    B.units.push({ id: B.units.length, side, cid, n: 1, n0: 1, hp: cr.hp, shots: cr.shots || 0, x: spot[0], y: spot[1], src: 'machine', slot: null, retaliated: false, defending: false, waited: false, dead: false, buffs: {} });
  }
}
// --- oblężenie: mur z bramą w kolumnie SIEGE_X (Fort i wyżej), wieże strzelnicze (Cytadela: jedna, Zamek: dwie)
// i katapulta atakującego, która co rundę rzuca głazem w mur. Brama przepuszcza tylko obrońców; lotnicy przelatują.
// Fosa (od Cytadeli) w kolumnie MOAT_X przed murem, z mostem w rzędzie bramy: napastnik, który do niej wejdzie, kończy ruch
// i dostaje obrażenia (MOAT_DMG wg poziomu fortyfikacji); lotnicy ją przelatują.
const SIEGE_X = 9, GATE_Y = 4, MOAT_X = SIEGE_X - 1, MOAT_DMG = [0, 0, 40, 70], WALL_HP = [0, 2, 3, 4];
const moatAt = (B, x, y) => !!(B.moat && x === MOAT_X && y !== GATE_Y);
const wallAt = (B, x, y) => (B.walls ? B.walls.get(hexKey(x, y)) : null);
const walled = (B, x, y, side) => { const w = wallAt(B, x, y); return !!w && w.hp > 0 && (w.kind !== 'gate' || side !== 1); };
const targetable = u => u.cid !== 'arrowTower'; // wież nie da się zaatakować
function addFixed(B, side, cid, x, y, n, src) {
  const cr = CREATURES[cid];
  B.units.push({ id: B.units.length, side, cid, n, n0: n, hp: cr.hp, shots: cr.shots || 0, x, y, src, slot: null, retaliated: false, defending: false, waited: false, dead: false, buffs: {} });
}
function freeSpot(B, side, rows) {
  for (let c = 0; c < 3; c++) for (const y of rows) { const x = side === 0 ? c : BCOLS - 1 - c; if (isFree(B, x, y, side)) return [x, y]; }
  return null;
}
function setupSiege(B, t) {
  const L = townLevel(t); if (!L) return;
  const hp = WALL_HP[L], towers = L >= 3 ? [0, BROWS - 1] : L >= 2 ? [0] : [];
  B.walls = new Map(); B.siege = { level: L }; if (MOAT_DMG[L]) B.moat = { dmg: MOAT_DMG[L] };
  for (let y = 0; y < BROWS; y++) {
    const tower = towers.includes(y);
    B.walls.set(hexKey(SIEGE_X, y), { x: SIEGE_X, y, kind: tower ? 'tower' : y === GATE_Y ? 'gate' : 'wall', hp: tower ? Infinity : hp, max: hp });
    if (tower) addFixed(B, 1, 'arrowTower', SIEGE_X, y, 1 + dwellingLevels(t).length, 'siege'); // siła wieży rośnie z liczbą siedlisk
  }
  const spot = freeSpot(B, 0, [BROWS - 1, 0, BROWS - 2, 1, 7, 2, 6, 3, 5, 4]); if (spot) addFixed(B, 0, 'catapult', spot[0], spot[1], 1, 'siege');
}
// Katapulta: głaz w bramę (co drugi rzut) albo w losowy fragment muru; trafia 3 razy na 4
function actCatapult(B, u) {
  u.acted = true;
  const segs = [...B.walls.values()].filter(w => w.kind !== 'tower' && w.hp > 0);
  if (!segs.length) { B.log.push('Katapulta: mury już leżą w gruzach.'); return; }
  const gate = segs.find(w => w.kind === 'gate'), w = gate && B.rng() < 0.5 ? gate : segs[Math.floor(B.rng() * segs.length)], hit = B.rng() < (skillVal(sideHero(B, u.side), 'ballistics') || 75) / 100; // Balistyka
  if (hit) w.hp--;
  const what = w.kind === 'gate' ? 'brama' : 'mur';
  B.log.push(hit ? (w.hp <= 0 ? `Katapulta: ${what} ${w.kind === 'gate' ? 'rozbita' : 'runął'}!` : `Katapulta trafia: ${what} słabnie.`) : 'Katapulta chybia.');
  if (B.fx) B.fx.push({ kind: 'siege', a: u, x: w.x, y: w.y, hit, broken: hit && w.hp <= 0 });
}
// foe: potwór z mapy, skarbiec, bohater albo miasto
function createBattle(st, h, foe) {
  const D = battleSide(st, foe);
  const B = { st, h, sides: [{ owner: h.owner, hero: h, monster: null, town: null }, { owner: D.owner, hero: D.hero, monster: D.monster, bank: D.bank || null, town: D.town }],
    round: 0, order: [], waitQ: [], active: null, units: [], log: [], over: null, auto: false, obst: new Map(), cast: [false, false],
    rng: mulberry32(st.seed ^ (st.dayTotal * 7919) ^ (D.key * 104729)), prevPos: h.prev ? [...h.prev] : null };
  placeSide(B, 0, armyEntries(h.army, 'hero'));
  placeSide(B, 1, D.stacks);
  if (D.town) setupSiege(B, D.town);
  placeMachines(B, 0, h); placeMachines(B, 1, D.hero);
  for (const u of B.units) { const sb = specBonus(B.sides[u.side].hero, u.cid); if (sb) u.spec = sb; } // specjalność bohatera
  B.morale = [sideMorale(B, 0), sideMorale(B, 1)]; B.luck = [sideLuck(B, 0), sideLuck(B, 1)];
  // przeszkody ze środka pola: te same drzewa i skały co na mapie przygody (typ + wariant rysunku)
  const cnt = 3 + Math.floor(B.rng() * 4);
  const xMax = B.walls ? SIEGE_X - 2 : BCOLS - 3; // przy oblężeniu przeszkody tylko przed murem
  for (let k = 0, tries = 0; k < cnt && tries < 60; tries++) {
    const x = 2 + Math.floor(B.rng() * (xMax - 1)), y = Math.floor(B.rng() * BROWS), key = hexKey(x, y);
    if (B.obst.has(key)) continue; B.obst.set(key, { o: B.rng() < 0.55 ? OBST.TREE : OBST.ROCK, v: Math.floor(B.rng() * 4) }); k++;
  }
  return B;
}
// --- morale i szczęście (jak w oryginale, od −3 do +3; liczone raz, na początku bitwy) ---
// Morale strony: armia z jednej frakcji +1, z dwóch 0, z trzech −1, z więcej −2; nieumarli w armii −1 dla żywych;
// artefakty bohatera; obrońcy miasta z tawerną +1. Potwory z mapy walczą bez morale i szczęścia.
function armyMorale(cids, hero, town) {
  const facs = new Set(cids.map(cid => CREATURES[cid].faction)).size;
  let m = facs <= 1 ? 1 : facs === 2 ? 0 : facs === 3 ? -1 : -2;
  if (cids.some(cid => (CREATURES[cid].abil || []).includes('undead'))) m -= 1;
  if (hero) m += heroBonus(hero, 'morale') + skillVal(hero, 'leadership') + ((hero.boost || {}).morale || 0); // boost: świątynia do następnej bitwy
  if (heroTrait(hero, 'haven')) m += 1; // cecha Przystani
  if (town && hasB(town, 'tavern')) m += 1;
  return clamp(m, -3, 3);
}
const heroLuck = h => clamp(h ? heroBonus(h, 'luck') + skillVal(h, 'luck') + ((h.boost || {}).luck || 0) + (heroTrait(h, 'sylvan') ? 1 : 0) : 0, -3, 3);
function sideMorale(B, side) { const S = B.sides[side]; return S.monster || S.bank ? 0 : armyMorale(B.units.filter(u => u.side === side && !isMachine(u)).map(u => u.cid), S.hero, S.town); }
const sideLuck = (B, side) => heroLuck(B.sides[side].hero);
// Nieumarli nie znają strachu ani zapału: morale zawsze 0
const unitMorale = (B, u) => (hasAb(u, 'undead') || isMachine(u) || !B.morale ? 0 : B.morale[u.side]);
const unitLuck = (B, u) => (B.luck ? B.luck[u.side] : 0) + (u.buffs && u.buffs.fortune ? 2 : 0); // Fortuna: +2
const signed = v => (v > 0 ? `+${v}` : String(v));
const alive = (B, side) => B.units.filter(u => !u.dead && (side == null || u.side === side));
// Oddziały, od których zależy wynik: strona bez nich przegrywa, nawet jeśli zostały jej machiny
const fighters = (B, side) => alive(B, side).filter(u => !isMachine(u));
const hasCart = (B, side) => alive(B, side).some(u => u.cid === 'ammoCart');
const unitAt = (B, x, y) => B.units.find(u => !u.dead && u.x === x && u.y === y) || null;
const hasAb = (u, a) => (CREATURES[u.cid].abil || []).includes(a);
const isFree = (B, x, y, side) => !B.obst.has(hexKey(x, y)) && !walled(B, x, y, side) && !unitAt(B, x, y);
const endlessShots = u => u.cid === 'ballista' || u.cid === 'arrowTower';
const canShoot = (B, u) => endlessShots(u) || u.shots > 0 && !alive(B, 1 - u.side).some(e => hexAdjacent(u, e));
// Współrzędne sześcienne heksu (do odległości i kierunków); układ odd-r
const toCube = (x, y) => { const q = x - (y - (y & 1)) / 2; return [q, y, -q - y]; };
const fromCube = (q, r) => [q + (r - (r & 1)) / 2, r];
const hexDistance = (a, b) => { const [q1, r1, s1] = toCube(a.x, a.y), [q2, r2, s2] = toCube(b.x, b.y); return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2)); };
// Kary strzału (jak w oryginale): cel dalej niż SHOT_RANGE pól albo drzewo lub skała na torze lotu = połowa obrażeń (każda osobno).
// Bez kar strzelają machiny i wyborowi strzelcy (sharpshooter).
const SHOT_RANGE = 7;
const noShotPenalty = a => isMachine(a) || hasAb(a, 'sharpshooter');
const farShot = (a, t) => !noShotPenalty(a) && hexDistance(a, t) > SHOT_RANGE;
function cubeRound(q, r) {
  const s = -q - r; let rq = Math.round(q), rr = Math.round(r); const rs = Math.round(s), dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs; return [rq, rr];
}
// Pola na prostej od strzelca do celu (bez obu końców): przeszkoda na którymkolwiek z nich zasłania cel
function shotBlocked(B, a, t) {
  if (noShotPenalty(a)) return false; const [q1, r1] = toCube(a.x, a.y), [q2, r2] = toCube(t.x, t.y), N = hexDistance(a, t);
  for (let i = 1; i < N; i++) { const [q, r] = cubeRound(q1 + (q2 - q1) * i / N + 1e-6, r1 + (r2 - r1) * i / N + 2e-6), [x, y] = fromCube(q, r); if (B.obst.has(hexKey(x, y))) return true; }
  return false;
}
const shotPenaltyText = (B, a, t) => { const p = [farShot(a, t) && 'daleko', shotBlocked(B, a, t) && 'przeszkoda'].filter(Boolean); return p.length ? `; kara: ${p.join(' i ')}, połowa obrażeń${p.length > 1 ? ' dwa razy' : ''}` : ''; };
// Pole za celem na przedłużeniu linii atakujący → cel (dla zionięcia)
function hexBehind(a, t) {
  const [q1, r1] = toCube(a.x, a.y), [q2, r2] = toCube(t.x, t.y), [x, y] = fromCube(2 * q2 - q1, 2 * r2 - r1);
  return inField(x, y) ? [x, y] : null;
}
// Zasięg ruchu (BFS). Piechota omija zajęte pola i przeszkody; lotnik liczy odległość w linii prostej,
// ale ląduje tylko na wolnym polu. limit = zasięg (Infinity = pełna mapa odległości).
function battleDist(B, u, limit = Infinity) {
  const dist = new Map([[hexKey(u.x, u.y), 0]]), prev = new Map();
  if (hasAb(u, 'fly')) {
    for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) {
      const d = hexDistance(u, { x, y }); if (d > 0 && d <= limit && isFree(B, x, y, u.side)) { dist.set(hexKey(x, y), d); prev.set(hexKey(x, y), hexKey(u.x, u.y)); }
    }
    return { dist, prev, fly: true };
  }
  const q = [[u.x, u.y]];
  while (q.length) {
    const [x, y] = q.shift(), d = dist.get(hexKey(x, y)); if (d >= limit) continue;
    if (d > 0 && u.side === 0 && moatAt(B, x, y)) continue; // z fosy dalej już nie (ruch kończy się w wodzie)
    for (const [nx, ny] of hexNeighbors(x, y)) {
      const k = hexKey(nx, ny); if (dist.has(k) || !isFree(B, nx, ny, u.side)) continue;
      dist.set(k, d + 1); prev.set(k, hexKey(x, y)); q.push([nx, ny]);
    }
  }
  return { dist, prev };
}
function pathTo({ prev }, u, x, y) {
  const out = []; let k = hexKey(x, y); const start = hexKey(u.x, u.y);
  while (k !== start && k !== undefined) { out.unshift([k % BCOLS, Math.floor(k / BCOLS)]); k = prev.get(k); }
  return out;
}
// Premie bohatera do ataku i obrony swoich oddziałów (strona bez bohatera: 0)
const sideHero = (B, side) => B.sides[side].hero;
const sideAtt = (B, side) => (sideHero(B, side) ? heroStat(sideHero(B, side), 'att') : 0);
const sideDef = (B, side) => (sideHero(B, side) ? heroStat(sideHero(B, side), 'def') : 0); // mury miasta chronią fizycznie (oblężenie)
// Którą stroną dowodzi człowiek (resztą SI). Na razie człowiek zawsze atakuje, więc to strona 0.
// Strona dowodzona przez człowieka: gracz przed ekranem albo (hot-seat) inny człowiek, który się broni
const humanSide = (B, side) => { const o = B.sides[side].owner; return o === ME || (o >= 0 && !!B.st.players[o] && B.st.players[o].human); };
// Obrażenia jak w oryginale: podstawa × (1 + 5% za każdy punkt przewagi ataku), albo −2,5% za punkt przewagi obrony.
// moved = liczba pól rozpędu (szarża), ranged = strzał; strzelec wręcz bije za połowę, chyba że ma „Walkę wręcz”.
function damageRoll(B, a, t, ranged, moved = 0) {
  const ca = CREATURES[a.cid], ct = CREATURES[t.cid];
  let base = a.n * (a.buffs.bless ? ca.dmax : a.buffs.curse ? ca.dmin : ca.dmin + B.rng() * (ca.dmax - ca.dmin)); // Klątwa: najniższe obrażenia
  if (a.cid === 'ballista') base *= (sideAtt(B, a.side) + 1) * (1 + skillVal(sideHero(B, a.side), 'artillery') / 100); // balista: podstawa × (atak bohatera + 1), Artyleria
  const A = unitAtt(a) + sideAtt(B, a.side), D = unitDef(t) + sideDef(B, t.side) + (t.defending ? Math.ceil(ct.def * 0.2) + 1 : 0);
  let mult = A >= D ? Math.min(4, 1 + 0.05 * (A - D)) : Math.max(0.3, 1 - 0.025 * (D - A));
  if (!ranged && ca.shots > 0 && !hasAb(a, 'noMeleePenalty')) mult *= 0.5;
  if (!ranged && hasAb(a, 'jousting')) mult *= 1 + 0.05 * moved;
  // strzał atakującego zza muru w obrońcę za murem: połowa obrażeń, dopóki ten fragment muru stoi
  if (ranged && B.walls && a.side === 0 && a.x < SIEGE_X && t.x > SIEGE_X) { const w = wallAt(B, SIEGE_X, t.y); if (w && w.hp > 0) mult *= 0.5; }
  if (t.buffs[ranged ? 'airShield' : 'shield']) mult *= 1 - SHIELD_CUT / 100; // Tarcza (wręcz) i Tarcza powietrza (strzały)
  if (ranged && farShot(a, t)) mult *= 0.5; if (ranged && shotBlocked(B, a, t)) mult *= 0.5; // odległość i przeszkody na torze lotu
  // umiejętności bohaterów: Atak / Łucznictwo napastnika, Zbroja obrońcy
  mult *= (1 + skillVal(sideHero(B, a.side), ranged ? 'archery' : 'offense') / 100) * (1 - skillVal(sideHero(B, t.side), 'armorer') / 100);
  return Math.max(1, Math.floor(base * mult));
}
function applyDamage(t, dmg) {
  const hp = CREATURES[t.cid].hp, total = (t.n - 1) * hp + t.hp - dmg, before = t.n;
  if (total <= 0) { t.n = 0; t.dead = true; return before; }
  t.n = Math.ceil(total / hp); t.hp = total - (t.n - 1) * hp; return before - t.n;
}
// Leczenie z możliwością wskrzeszenia do liczebności z początku bitwy
function healUnit(u, amount) {
  const hp = CREATURES[u.cid].hp, max = u.n0 * hp, total = Math.min(max, (u.n - 1) * hp + u.hp + amount), before = u.n;
  u.n = Math.ceil(total / hp); u.hp = total - (u.n - 1) * hp; return u.n - before;
}
// Szczęście: szansa L/24 na podwójne obrażenia; pech: |L|/12 na połowę
function strike(B, a, t, ranged, moved = 0) {
  let dmg = damageRoll(B, a, t, ranged, moved); const L = unitLuck(B, a);
  if (L > 0 && B.rng() < L / 24) { dmg *= 2; B.log.push(`Szczęście! ${CREATURES[a.cid].plural} zadają podwójne obrażenia.`); if (B.fx) B.fx.push({ kind: 'heal', u: a, label: 'Szczęście!' }); }
  else if (L < 0 && B.rng() < -L / 12) { dmg = Math.max(1, Math.floor(dmg / 2)); B.log.push(`Pech! ${CREATURES[a.cid].plural} zadają połowę obrażeń.`); if (B.fx) B.fx.push({ kind: 'heal', u: a, label: 'Pech!' }); }
  const killed = applyDamage(t, dmg);
  B.log.push(`${CREATURES[a.cid].plural} (${a.n}) zadają ${dmg} obrażeń${killed ? `. ${CREATURES[t.cid].plural} tracą ${killed}` : ''}.`);
  if (B.fx) B.fx.push({ kind: ranged ? 'shot' : 'hit', a, tg: t, dmg, killed });
  if (!ranged && t.buffs.fireShield && !a.dead) { // Ognista tarcza: część obrażeń wraca do napastnika
    const back = Math.max(1, Math.floor(dmg * FIRE_SHIELD / 100)), k = applyDamage(a, back);
    B.log.push(`Ognista tarcza parzy: ${CREATURES[a.cid].plural.toLowerCase()} (${back}${k ? `, tracą ${k}` : ''}).`); if (B.fx) B.fx.push({ kind: 'hit', a: null, tg: a, dmg: back, killed: k });
  }
  if (hasAb(a, 'lifeDrain') && !hasAb(t, 'undead')) {
    const back = healUnit(a, dmg); if (back) B.log.push(`${CREATURES[a.cid].plural} wysysają życie: wraca ${back}.`);
    if (B.fx) B.fx.push({ kind: 'heal', u: a, amount: dmg });
  }
  if (!ranged && hasAb(a, 'breath')) {
    const bh = hexBehind(a, t), v = bh && unitAt(B, bh[0], bh[1]);
    if (v && v !== a) { const d2 = damageRoll(B, a, v, false, 0), k2 = applyDamage(v, d2); B.log.push(`Zionięcie rani też: ${CREATURES[v.cid].plural.toLowerCase()} (${d2}${k2 ? `, tracą ${k2}` : ''}).`); if (B.fx) B.fx.push({ kind: 'hit', a, tg: v, dmg: d2, killed: k2, splash: true }); }
  }
  return dmg;
}
// Wykonanie akcji; ruch i ataki od razu zmieniają stan, a ekran odtwarza je z listy B.fx (gdy istnieje)
function actMoveAttack(B, u, path, target) {
  let moved = 0; u.acted = true; // ruch albo atak: szansa na drugi ruch z morale
  if (path.length) {
    const [x, y] = path[path.length - 1]; moved = hexDistance(u, { x, y });
    if (B.fx) B.fx.push({ kind: 'move', u, path: [[u.x, u.y], ...path], fly: hasAb(u, 'fly') }); u.x = x; u.y = y;
    if (u.side === 0 && !hasAb(u, 'fly') && moatAt(B, x, y)) { // fosa rani napastnika
      const k = applyDamage(u, B.moat.dmg); B.log.push(`Fosa: ${CREATURES[u.cid].plural.toLowerCase()} tracą ${B.moat.dmg} życia${k ? ` (giną: ${k})` : ''}.`);
      if (B.fx) B.fx.push({ kind: 'hit', a: null, tg: u, dmg: B.moat.dmg, killed: k }); if (u.dead) return;
    }
  }
  if (!target) return;
  strike(B, u, target, false, moved);
  const retal = () => { if (target.dead || u.dead || hasAb(u, 'noRetal') || isMachine(target)) return; if (target.retaliated && !hasAb(target, 'unlimitedRetal')) return; target.retaliated = true; strike(B, target, u, false); };
  retal();
  if (hasAb(u, 'doubleStrike') && !u.dead && !target.dead) strike(B, u, target, false, 0);
}
// Strzały: wóz z amunicją uzupełnia je na bieżąco, balista ma ich bez liku
function actShoot(B, u, target) {
  const use = () => { if (!endlessShots(u) && !hasCart(B, u.side)) u.shots--; };
  u.acted = true; use(); strike(B, u, target, true);
  if (hasAb(u, 'doubleShot') && u.shots > 0 && !target.dead) { use(); strike(B, u, target, true); }
}
// Namiot medyka: leczy pierwszego stwora w najbardziej rannym oddziale (1–25 życia, bez wskrzeszania)
function actFirstAid(B, u) {
  u.acted = true;
  const hurt = alive(B, u.side).filter(v => !isMachine(v) && v.hp < CREATURES[v.cid].hp);
  if (!hurt.length) { B.log.push('Namiot medyka: nikt nie potrzebuje pomocy.'); return; }
  const most = skillVal(sideHero(B, u.side), 'firstAid') || 25; // Pierwsza pomoc: do 50/75/100 zamiast 25
  const v = hurt.reduce((a, b) => (CREATURES[b.cid].hp - b.hp > CREATURES[a.cid].hp - a.hp ? b : a)), amt = Math.min(CREATURES[v.cid].hp - v.hp, 1 + Math.floor(B.rng() * most));
  v.hp += amt; B.log.push(`Namiot medyka leczy: ${CREATURES[v.cid].plural.toLowerCase()} (+${amt}).`);
  if (B.fx) B.fx.push({ kind: 'heal', u: v, amount: amt });
}
function actWait(B, u) { u.waited = true; B.waitQ.push(u); B.log.push(`${CREATURES[u.cid].plural} czekają.`); }
function actDefend(B, u) { u.defending = true; B.log.push(`${CREATURES[u.cid].plural} bronią się.`); }
// Wartość wymiany dla SI: ile wartości bojowej zabijemy, minus ile stracimy w kontrataku.
// Średnie obrażenia liczymy bez losowania (tymczasowe rng = 0,5).
function tradeValue(B, u, e, ranged, moved) {
  const saved = B.rng; B.rng = () => 0.5;
  const hpE = CREATURES[e.cid].hp, poolE = (e.n - 1) * hpE + e.hp, dmg = damageRoll(B, u, e, ranged, moved);
  const kills = dmg >= poolE ? e.n : e.n - Math.ceil((poolE - dmg) / hpE); let gain = kills * CREATURES[e.cid].value * (e.shots > 0 ? 1.5 : 1);
  if (dmg >= poolE) gain *= 1.3; // premia za całkowite rozbicie oddziału
  let loss = 0;
  if (!ranged && dmg < poolE && !hasAb(u, 'noRetal') && !isMachine(e) && (!e.retaliated || hasAb(e, 'unlimitedRetal'))) {
    const left = { ...e, n: e.n - kills }, hpU = CREATURES[u.cid].hp, poolU = (u.n - 1) * hpU + u.hp, back = damageRoll(B, left, u, false, 0);
    loss = Math.min(u.n, back >= poolU ? u.n : u.n - Math.ceil((poolU - back) / hpU)) * CREATURES[u.cid].value;
  }
  B.rng = saved; return gain - loss;
}
// Obrońca oblężonego miasta trzyma się za murami (jak w Heroes 3), chyba że jego armia jest dużo silniejsza (wypad)
function holdWalls(B, u, reach) {
  if (u.side !== 1 || !B.walls || reach.fly) return false;
  const power = side => alive(B, side).filter(v => !isMachine(v) && v.src !== 'siege').reduce((s, v) => s + v.n * CREATURES[v.cid].value, 0);
  return power(1) < power(0) * 1.5;
}
// Sztuczna inteligencja: wybiera najlepszą wymianę (strzał albo atak z dostępnego pola),
// a gdy nikogo nie sięgnie, zbliża się do najcenniejszego celu. Strzelców wroga ceni wyżej.
function aiAct(B, u) {
  if (u.cid === 'firstAid') { actFirstAid(B, u); return; }
  if (u.cid === 'catapult') { actCatapult(B, u); return; }
  if (isMachine(u) && !endlessShots(u)) { actDefend(B, u); return; }
  const foes = alive(B, 1 - u.side).filter(targetable);
  if (canShoot(B, u)) {
    const t = foes.reduce((a, b) => (tradeValue(B, u, b, true, 0) > tradeValue(B, u, a, true, 0) ? b : a));
    actShoot(B, u, t); return;
  }
  const spd = unitSpd(u), reach = battleDist(B, u, spd), hold = holdWalls(B, u, reach); let best = null;
  for (const e of foes) for (const [nx, ny] of [[u.x, u.y], ...hexNeighbors(e.x, e.y)]) {
    if (!hexAdjacent({ x: nx, y: ny }, e)) continue; const d = reach.dist.get(hexKey(nx, ny)); if (d == null) continue;
    if (hold && nx < SIEGE_X) continue; // obrońca bije tylko zza muru (z bramy, wyłomu albo ze środka)
    const score = tradeValue(B, u, e, false, d) - d * 0.01; if (!best || score > best.score) best = { score, e, nx, ny };
  }
  // strzelec z sąsiadem obok: bije wręcz tylko, gdy to się opłaca; inaczej broni się
  if (best && (best.score > 0 || u.shots === 0 || foes.every(e => !e.shots))) { actMoveAttack(B, u, pathTo(reach, u, best.nx, best.ny), best.e); return; }
  if (best) { actDefend(B, u); return; }
  // nikt w zasięgu: strzelcy czekają na miejscu, reszta idzie w stronę najcenniejszego wroga
  if (u.shots > 0 || hold) { actDefend(B, u); return; } // obrońca czeka za murami, aż napastnik podejdzie
  const target = foes.reduce((a, b) => (b.n * CREATURES[b.cid].value > a.n * CREATURES[a.cid].value ? b : a));
  const far = battleDist(B, u, reach.fly ? spd : Infinity); let goal = null;
  if (reach.fly) { for (const k of far.dist.keys()) { const x = k % BCOLS, y = Math.floor(k / BCOLS), d = hexDistance({ x, y }, target); if (!goal || d < goal.d) goal = { d, nx: x, ny: y }; } }
  else for (const e of [target, ...foes]) { for (const [nx, ny] of hexNeighbors(e.x, e.y)) { const d = far.dist.get(hexKey(nx, ny)); if (d != null && (!goal || d < goal.d)) goal = { d, nx, ny }; } if (goal) break; }
  if (!goal && B.walls && !reach.fly) { // mur zamknięty: podejdź pod bramę i czekaj na wyłom
    for (const k of far.dist.keys()) { const x = k % BCOLS, y = Math.floor(k / BCOLS), d = hexDistance({ x, y }, { x: SIEGE_X, y: GATE_Y }); if (!goal || d < goal.d) goal = { d, nx: x, ny: y }; }
    if (goal && goal.nx === u.x && goal.ny === u.y) goal = null;
  }
  if (!goal) { actDefend(B, u); return; }
  const path = reach.fly ? [[goal.nx, goal.ny]] : pathTo(far, u, goal.nx, goal.ny).slice(0, spd);
  actMoveAttack(B, u, path, null);
}
// Kolejka: w każdej rundzie od najszybszych; kto czekał, rusza na końcu (najwolniejsi pierwsi)
// Kolejny oddział. Morale: po ataku albo ruchu oddział z dodatnim morale M ma szansę M/24 na drugi ruch
// w tej rundzie; z ujemnym, na początku swojej tury, szansę |M|/12, że się zawaha i straci turę.
function nextActive(B) {
  const prev = B.active;
  if (prev && prev.acted) {
    prev.acted = false; const m = unitMorale(B, prev);
    if (!prev.dead && !prev.moraleBonus && m > 0 && fighters(B, 0).length && fighters(B, 1).length && B.rng() < m / 24) {
      prev.moraleBonus = true; B.log.push(`Wysokie morale! ${CREATURES[prev.cid].plural} ruszają ponownie.`);
      if (B.fx) B.fx.push({ kind: 'heal', u: prev, label: 'Morale!' }); return prev;
    }
  }
  for (;;) {
    if (!fighters(B, 0).length || !fighters(B, 1).length) { B.over = fighters(B, 0).length ? 'win' : 'lose'; B.active = null; return null; }
    if (!B.order.length && B.waitQ.length) { B.order = B.waitQ.filter(u => !u.dead).sort((a, b) => unitSpd(a) - unitSpd(b)); B.waitQ = []; }
    if (!B.order.length) {
      B.round++; B.cast = [false, false];
      for (const u of B.units) {
        u.retaliated = false; u.defending = false; u.waited = false; u.moraleBonus = false; u.moraleRolled = false;
        for (const k of Object.keys(u.buffs)) if (--u.buffs[k] <= 0) delete u.buffs[k];
        if (!u.dead && hasAb(u, 'regen') && u.hp < CREATURES[u.cid].hp) { const amt = CREATURES[u.cid].hp - u.hp; u.hp += amt; if (B.fx) B.fx.push({ kind: 'heal', u, amount: amt }); }
      }
      B.order = alive(B).filter(u => u.cid !== 'ammoCart').sort((a, b) => unitSpd(b) - unitSpd(a) || a.side - b.side); // wóz nie ma własnej tury
    }
    const u = B.order.shift(); if (!u || u.dead) continue;
    if (!u.moraleRolled) {
      u.moraleRolled = true; const m = unitMorale(B, u);
      if (m < 0 && B.rng() < -m / 12) { B.log.push(`Niskie morale: ${CREATURES[u.cid].plural.toLowerCase()} wahają się i tracą turę.`); if (B.fx) B.fx.push({ kind: 'heal', u, label: 'Wahanie' }); continue; }
    }
    B.active = u; if (u.defending) u.defending = false; return u;
  }
}
// --- czary w bitwie: bohater rzuca jeden czar na rundę, zanim ruszy oddział ---
const unitAtt = u => CREATURES[u.cid].att + (u.spec ? u.spec.att : 0) + (u.buffs.bloodlust ? 3 : 0) - (u.buffs.weakness ? 3 : 0) + (u.buffs.prayer ? 2 : 0);
const unitDef = u => CREATURES[u.cid].def + (u.spec ? u.spec.def : 0) + (u.buffs.stoneSkin ? 3 : 0) + (u.buffs.prayer ? 2 : 0);
const unitSpd = u => (isMachine(u) ? 0 : Math.max(1, CREATURES[u.cid].spd + (u.spec ? u.spec.spd : 0) + (u.buffs.haste ? 3 : 0) - (u.buffs.slow ? 3 : 0) + (u.buffs.prayer ? 2 : 0)));
const battleSpells = h => (h.spells || []).filter(id => SPELLS[id].kind === 'battle');
// Czar rzuca bohater strony, której oddział właśnie ma ruch (jeden czar na rundę na stronę)
const casterSide = B => (B.active ? B.active.side : 0);
const canCastNow = B => { const s = casterSide(B), h = sideHero(B, s); return !!(B.active && h && !B.cast[s] && battleSpells(h).some(id => spellCost(h, id) <= h.mana)); };
// Czary bez celu: działają na całe pole (armagedon) albo na wszystkich swoich (przyspieszenie armii)
const MASS_TARGETS = ['all', 'allies'];
// Żywy (nie nieumarły, nie machina) oddział rzucającego, także poległy: cel wskrzeszenia
const livingAlly = (u, s) => u.side === s && !hasAb(u, 'undead') && !isMachine(u) && u.src !== 'siege';
// Oddział na polu jako cel czaru: żywy, a dla czarów wskrzeszających także poległy (gdy pole jest wolne)
const spellUnitAt = (B, id, x, y) => unitAt(B, x, y) || (SPELLS[id].raise && B.units.find(u => u.dead && u.x === x && u.y === y)) || null;
// Czy cel pasuje do czaru (u = oddział albo null dla czaru na pole); „swoi” = strona rzucającego
function spellTargetOk(B, id, u) {
  const t = SPELLS[id].target, s = casterSide(B); if (t === 'hex' || t === 'ring' || MASS_TARGETS.includes(t)) return true; if (u && !targetable(u)) return false;
  if (!u || u.dead && !(t === 'undeadAlly' && u.side === s && hasAb(u, 'undead') || t === 'livingAlly' && livingAlly(u, s))) return false;
  return t === 'enemy' ? u.side !== s : t === 'ally' ? u.side === s : t === 'undeadAlly' ? u.side === s && hasAb(u, 'undead') : t === 'livingAlly' ? livingAlly(u, s) : false;
}
// Obrażenia czaru z Czarnoksięstwem bohatera
const spellDamage = (h, S, sp) => Math.floor(S.dmg(sp) * (1 + skillVal(h, 'sorcery') / 100) * specSpellMul(h, spellId(S)) * schoolMul(h, spellId(S)));
const spellId = S => Object.keys(SPELLS).find(id => SPELLS[id] === S);
// Odporność bohatera strony oddziału: szansa, że wrogi czar go nie tknie (sprawdzana osobno dla każdego oddziału)
const resists = (B, v, s) => { const r = v.side !== s ? skillVal(sideHero(B, v.side), 'resistance') : 0; return r > 0 && B.rng() * 100 < r; };
// Czar na jeden oddział rzucony przez eksperta szkoły działa na wszystkie oddziały tej strony (jak w Heroes 3)
const massBuff = (B, id) => { const S = SPELLS[id]; return !!(B && S.buff && (S.target === 'ally' || S.target === 'enemy') && spellSchoolLv(sideHero(B, casterSide(B)), id) >= 3); };
// Pola trafione czarem (kula ognia: pole + sąsiedzi; pierścień mrozu: same sąsiedzi; armagedon: każdy oddział; czary armii: wszyscy swoi;
// łańcuch piorunów: cel, potem kolejno najbliższy jeszcze nietrafiony oddział; czar eksperta: cała strona)
function spellArea(id, x, y, B) {
  const S = SPELLS[id], t = S.target;
  if (MASS_TARGETS.includes(t)) return B ? B.units.filter(u => !u.dead && targetable(u) && (t === 'all' || u.side === casterSide(B)) && !(S.spare && hasAb(u, S.spare))).map(u => [u.x, u.y]) : []; // Fala śmierci oszczędza nieumarłych
  if (massBuff(B, id)) { const u0 = unitAt(B, x, y); return u0 ? B.units.filter(u => !u.dead && targetable(u) && u.side === u0.side).map(u => [u.x, u.y]) : [[x, y]]; }
  if (S.chain && B) {
    const out = [[x, y]]; let cur = { x, y };
    for (let i = 0; i < S.chain; i++) {
      const next = B.units.filter(u => !u.dead && targetable(u) && !out.some(([ax, ay]) => ax === u.x && ay === u.y)).sort((a, b) => hexDistance(cur, a) - hexDistance(cur, b))[0];
      if (!next) break; out.push([next.x, next.y]); cur = next;
    }
    return out;
  }
  return t === 'hex' ? [[x, y], ...hexNeighbors(x, y)] : t === 'ring' ? hexNeighbors(x, y) : [[x, y]];
}
// Mnożnik obrażeń i-tego trafienia (łańcuch: każdy przeskok za połowę)
const hitMul = (S, i) => (S.chain ? Math.pow(0.5, i) : 1);
// Orle oko: bohater strony przeciwnej może nauczyć się rzuconego czaru (do poziomu wg umiejętności)
function learnBySight(B, s, id) {
  const o = sideHero(B, 1 - s), v = skillVal(o, 'eagleSight'); if (!v || knows(o, id) || SPELLS[id].level > v / 10 - 2) return;
  if (B.rng() * 100 < v) { o.spells.push(id); B.log.push(`${o.name} podpatruje czar „${SPELLS[id].name}” (Orle oko).`); }
}
function castBattle(B, id, x, y) {
  const s = casterSide(B), h = sideHero(B, s), S = SPELLS[id], sp = heroStat(h, 'sp'), tu = spellUnitAt(B, id, x, y);
  const area = spellArea(id, x, y, B);
  h.mana -= spellCost(h, id); B.cast[s] = true; B.log.push(`${h.name} rzuca: ${S.name}.`);
  if (B.fx) B.fx.push({ kind: 'spell', id, x, y, area });
  learnBySight(B, s, id);
  if (S.dmg) area.forEach(([ax, ay], i) => {
    const v = unitAt(B, ax, ay); if (!v || !targetable(v)) return;
    if (resists(B, v, s)) { B.log.push(`${CREATURES[v.cid].plural}: odporność, czar nie działa.`); return; }
    const d = Math.max(1, Math.floor(spellDamage(h, S, sp) * hitMul(S, i))), k = applyDamage(v, d);
    B.log.push(`${CREATURES[v.cid].plural}: ${d} obrażeń${k ? `, tracą ${k}` : ''}.`); if (B.fx) B.fx.push({ kind: 'hit', a: null, tg: v, dmg: d, killed: k });
  });
  if (S.heal && MASS_TARGETS.includes(S.target)) for (const [ax, ay] of area) { // Źródło życia: leczy wszystkich swoich
    const u = unitAt(B, ax, ay); if (!u || isMachine(u)) continue; const amt = Math.floor(S.heal(sp) * specSpellMul(h, id) * schoolMul(h, id));
    u.hp = Math.min(CREATURES[u.cid].hp, u.hp + amt); for (const b of BAD_BUFFS) delete u.buffs[b]; if (B.fx) B.fx.push({ kind: 'heal', u, amount: amt });
  }
  else if (S.heal && tu) {
    if (tu.dead) { tu.dead = false; tu.n = 1; tu.hp = 0; tu.dieT = null; } // ożywienie poległego oddziału
    const amt = Math.floor(S.heal(sp) * specSpellMul(h, id) * schoolMul(h, id)), back = S.raise ? healUnit(tu, amt) : (tu.hp = Math.min(CREATURES[tu.cid].hp, tu.hp + amt), 0);
    if (!S.raise || id === 'resurrection') for (const b of BAD_BUFFS) delete tu.buffs[b];
    if (back) B.log.push(`Wraca do walki: ${back}.`); if (B.fx) B.fx.push({ kind: 'heal', u: tu, amount: amt });
  }
  if (S.buff) {
    const targets = MASS_TARGETS.includes(S.target) || massBuff(B, id) ? area.map(([ax, ay]) => unitAt(B, ax, ay)).filter(Boolean) : tu ? [tu] : [];
    if (targets.length > 1 && !MASS_TARGETS.includes(S.target)) B.log.push(`Ekspert magii ${SCHOOLS[S.school].name}: czar działa na całą armię.`);
    for (const u of targets) { if (u.side !== s && resists(B, u, s)) { B.log.push(`${CREATURES[u.cid].plural}: odporność, czar nie działa.`); continue; } u.buffs[S.buff] = SPELL_ROUNDS(sp) + spellSchoolLv(h, id); if (B.fx) B.fx.push({ kind: 'heal', u, amount: 0, label: SPELLS[id].name }); }
  }
}
// SI bohatera (tryb Auto i walka automatyczna): czar zadający najwięcej wartości, jeśli jakiś się opłaca
function aiHeroCast(B) {
  if (!canCastNow(B)) return false;
  const s = casterSide(B), h = sideHero(B, s), sp = heroStat(h, 'sp'); let best = null;
  for (const id of battleSpells(h)) {
    const S = SPELLS[id]; if (!S.dmg || spellCost(h, id) > h.mana) continue;
    const cells = S.target === 'hex' || S.target === 'ring' ? B.units.filter(u => !u.dead).map(u => [u.x, u.y]) : MASS_TARGETS.includes(S.target) ? [[0, 0]] : alive(B, 1 - s).filter(targetable).map(u => [u.x, u.y]);
    for (const [x, y] of cells) {
      let val = 0;
      for (const [i, [ax, ay]] of spellArea(id, x, y, B).entries()) {
        const v = unitAt(B, ax, ay); if (!v || !targetable(v)) continue; const hp = CREATURES[v.cid].hp, pool = (v.n - 1) * hp + v.hp, d = Math.floor(spellDamage(h, S, sp) * hitMul(S, i));
        const k = d >= pool ? v.n : v.n - Math.ceil((pool - d) / hp); val += (v.side !== s ? 1 : -1.5) * k * CREATURES[v.cid].value;
      }
      if (val > 0 && (!best || val > best.val)) best = { val, id, x, y };
    }
  }
  if (!best) return false; castBattle(B, best.id, best.x, best.y); return true;
}
// Cała bitwa bez ekranu (przycisk „Automatycznie” i testy)
function simulateBattle(B) {
  B.auto = true; let guard = 0;
  while (!B.over && guard++ < 5000) { const u = nextActive(B); if (!u) break; aiHeroCast(B); if (!u.dead && fighters(B, 1 - u.side).length) aiAct(B, u); }
  if (!B.over) B.over = 'lose';
  return B;
}
// Ocalałe oddziały wracają tam, skąd przyszły: do armii bohatera, garnizonu albo liczebności potwora
function writeBackSide(B, side) {
  const S = B.sides[side], units = B.units.filter(u => u.side === side);
  if (S.monster) { S.monster.count = units.reduce((s, u) => s + (u.dead ? 0 : u.n), 0); return; }
  if (S.bank) { const g = new Map(); for (const u of units) if (!u.dead && u.n > 0) g.set(u.cid, (g.get(u.cid) || 0) + u.n); S.bank.guards = [...g]; return; } // ocalała załoga zostaje w skarbcu
  for (const u of units) {
    if (u.src === 'siege') continue; // katapulta i wieże należą do bitwy, nie do armii
    if (u.src === 'machine') { if (u.dead) S.hero.machines = S.hero.machines.filter(id => id !== u.cid); continue; } // zniszczona machina przepada
    const a = u.src === 'garrison' ? S.town.garrison : S.hero.army; a[u.slot] = u.n > 0 && !u.dead ? { cid: u.cid, n: u.n } : null; }
}
const sideLosses = (B, side) => B.units.filter(u => u.side === side && u.n < u.n0 && u.src !== 'siege').map(u => `${CREATURES[u.cid].plural.toLowerCase()} −${u.n0 - u.n}`);
const killedHp = (B, side) => B.units.filter(u => u.side === side).reduce((s, u) => s + (u.n0 - u.n) * CREATURES[u.cid].hp, 0);
// Pokonany bohater znika z mapy. Wybór bohatera gracza przesuwa się tak, żeby wskazywał tego samego (albo pierwszego).
function removeHero(st, h) {
  const sel = hero(st), i = st.heroes.indexOf(h); if (i < 0) return;
  st.heroes.splice(i, 1);
  const keep = sel !== h ? sel : myHeroes(st)[0]; st.selHero = Math.max(0, st.heroes.indexOf(keep));
}
// Bohater, który przegrał albo uciekł, znika z mapy i czeka w tawernach jak w Heroes 3 (st.retired): uciekinier od razu
// u swojego gracza, pokonany po RETIRE_DAYS dniach w puli wszystkich graczy (także przeciwników). Zachowuje poziom,
// umiejętności i czary; armię traci (wraca z jednym stworem), a artefakty pokonanego przejmuje zwycięski bohater (lootHero).
const RETIRE_DAYS = 7;
function retireHero(st, h, fled, keepArts = fled) {
  removeHero(st, h);
  const keep = { ...h, army: emptyArmy(), machines: [], path: null, dest: null, moving: false, stop: false, anim: null, prev: null, pending: null, garrison: null, boat: false, asleep: false, boost: undefined };
  if (!keepArts) { keep.equip = emptyEquip(); keep.bag = []; }
  st.retired = (st.retired || []).filter(r => r.hero.name !== h.name);
  st.retired.push({ hero: keep, owner: fled ? h.owner : -1, from: st.dayTotal + (fled ? 0 : RETIRE_DAYS) });
}
// Artefakty pokonanego (założone i z plecaka) trafiają do plecaka zwycięzcy; zwraca ich liczbę
function lootHero(winner, loser) {
  const ids = [...Object.values(loser.equip || {}).filter(Boolean), ...(loser.bag || [])];
  winner.bag.push(...ids); loser.equip = emptyEquip(); loser.bag = []; return ids.length;
}
// Zmiana właściciela miasta (i jego obiektu na mapie)
function captureTown(st, t, owner) {
  for (const o of st.heroes.filter(o => o.x === t.x && o.y === t.y && o.owner !== owner)) retireHero(st, o, false, true); // bohaterowie poprzedniego właściciela w murach i bramie
  t.owner = owner; if (owner >= 0) reveal(st, t.x, t.y, HERO_SIGHT, owner);
  for (const ob of st.objects) if (ob.type === 'town' && ob.townId === t.id) ob.owner = owner;
  MapRender.miniDirty = true;
}
// Zapisuje wynik w stanie gry i zwraca opis dla okna podsumowania (z punktu widzenia atakującego, strona 0)
// Nekromancja zwycięzcy: z pct% życia poległych żywych wrogów wstają kościotrupy w armii bohatera (gdy jest miejsce)
function raiseDead(B, side) {
  const h = sideHero(B, side), pct = skillVal(h, 'necromancy') + (heroTrait(h, 'barrow') ? 10 : 0); if (!pct) return 0; // cecha Kurhanu
  const amp = B.st && h ? necroAmplifiers(B.st, h.owner) * 10 : 0; // Wzmacniacze nekromancji właściciela
  const hp = B.units.filter(u => u.side !== side && !hasAb(u, 'undead') && !isMachine(u)).reduce((s, u) => s + (u.n0 - u.n) * CREATURES[u.cid].hp, 0);
  const n = Math.floor(hp * (pct + amp) / 100 / CREATURES.boneWarrior.hp);
  const i = h.army.findIndex(s => s && s.cid === 'boneWarrior'), k = i >= 0 ? i : h.army.findIndex(s => !s);
  if (!n || k < 0) return 0;
  if (h.army[k]) h.army[k].n += n; else h.army[k] = { cid: 'boneWarrior', n };
  return n;
}
const raisedText = n => (n ? ` Nekromancja: ${n === 1 ? 'wstaje 1 kościotrup' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? `wstają ${n} kościotrupy` : `wstaje ${n} kościotrupów`}.` : '');
function resolveBattle(B, fled) {
  const { st, h } = B, D = B.sides[1], outcome = fled ? 'fled' : B.over;
  const res = { outcome, lost: sideLosses(B, 0), foeLost: sideLosses(B, 1), exp: 0, foeExp: 0, captured: null, heroDefeated: null, sides: [sideSummary(B, 0), sideSummary(B, 1)] };
  writeBackSide(B, 0); writeBackSide(B, 1);
  for (const S of B.sides) if (S.hero) delete S.hero.boost; // premie ze świątyni i fontanny trwają do końca bitwy
  if (outcome === 'win') {
    res.exp = killedHp(B, 1); res.raised = raiseDead(B, 0);
    if (D.monster) removeObject(st, D.monster);
    if (D.bank) res.bankText = lootBank(st, h, D.bank);
    if (D.hero) { res.heroDefeated = { name: D.hero.name, female: D.hero.female }; if (hasGrail(D.hero)) res.grail = true; res.loot = lootHero(h, D.hero); retireHero(st, D.hero, false); }
    if (D.town) { captureTown(st, D.town, h.owner); res.captured = D.town.name; }
  } else {
    if (D.hero && outcome === 'lose' && hasGrail(h)) res.grailLost = true; // Graal przechodzi na zwycięzcę razem z artefaktami
    if (D.hero && outcome === 'lose') { res.foeExp = killedHp(B, 0); res.foeRaised = raiseDead(B, 1); if (D.hero.owner !== ME) gainExp(st, D.hero, res.foeExp); } // człowiekowi dolicza je okno po obronie
    if (outcome === 'fled') { res.fledHero = true; retireHero(st, h, true); } // ucieczka: bez armii do własnej tawerny
    else { if (D.hero) res.foeLoot = lootHero(D.hero, h); res.heroLost = true; retireHero(st, h, false, !D.hero); } // porażka: artefakty dla zwycięzcy, bohater po tygodniu w tawernach
  }
  h.prev = null; h.path = null; h.dest = null; rebuildObjIndex(st);
  return res;
}

