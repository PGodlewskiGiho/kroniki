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
  if (foe.type === 'monster') return { owner: -1, hero: null, monster: foe, town: null, key: foe.id, stacks: splitMonster(foe.count).map(n => ({ cid: foe.cid, n, src: null, slot: null })) };
  if (foe.garrison) { // miasto: bohater stojący w mieście broni się razem z garnizonem
    const h = heroInTown(st, foe);
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
// foe: potwór z mapy, bohater albo miasto
function createBattle(st, h, foe) {
  const D = battleSide(st, foe);
  const B = { st, h, sides: [{ owner: h.owner, hero: h, monster: null, town: null }, { owner: D.owner, hero: D.hero, monster: D.monster, town: D.town }],
    round: 0, order: [], waitQ: [], active: null, units: [], log: [], over: null, auto: false, obst: new Map(), cast: [false, false],
    rng: mulberry32(st.seed ^ (st.dayTotal * 7919) ^ (D.key * 104729)), prevPos: h.prev ? [...h.prev] : null };
  placeSide(B, 0, armyEntries(h.army, 'hero'));
  placeSide(B, 1, D.stacks);
  // przeszkody ze środka pola: te same drzewa i skały co na mapie przygody (typ + wariant rysunku)
  const cnt = 3 + Math.floor(B.rng() * 4);
  for (let k = 0, tries = 0; k < cnt && tries < 60; tries++) {
    const x = 2 + Math.floor(B.rng() * (BCOLS - 4)), y = Math.floor(B.rng() * BROWS), key = hexKey(x, y);
    if (B.obst.has(key)) continue; B.obst.set(key, { o: B.rng() < 0.55 ? OBST.TREE : OBST.ROCK, v: Math.floor(B.rng() * 4) }); k++;
  }
  return B;
}
const alive = (B, side) => B.units.filter(u => !u.dead && (side == null || u.side === side));
const unitAt = (B, x, y) => B.units.find(u => !u.dead && u.x === x && u.y === y) || null;
const hasAb = (u, a) => (CREATURES[u.cid].abil || []).includes(a);
const isFree = (B, x, y) => !B.obst.has(hexKey(x, y)) && !unitAt(B, x, y);
const canShoot = (B, u) => u.shots > 0 && !alive(B, 1 - u.side).some(e => hexAdjacent(u, e));
// Współrzędne sześcienne heksu (do odległości i kierunków); układ odd-r
const toCube = (x, y) => { const q = x - (y - (y & 1)) / 2; return [q, y, -q - y]; };
const fromCube = (q, r) => [q + (r - (r & 1)) / 2, r];
const hexDistance = (a, b) => { const [q1, r1, s1] = toCube(a.x, a.y), [q2, r2, s2] = toCube(b.x, b.y); return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2)); };
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
      const d = hexDistance(u, { x, y }); if (d > 0 && d <= limit && isFree(B, x, y)) { dist.set(hexKey(x, y), d); prev.set(hexKey(x, y), hexKey(u.x, u.y)); }
    }
    return { dist, prev, fly: true };
  }
  const q = [[u.x, u.y]];
  while (q.length) {
    const [x, y] = q.shift(), d = dist.get(hexKey(x, y)); if (d >= limit) continue;
    for (const [nx, ny] of hexNeighbors(x, y)) {
      const k = hexKey(nx, ny); if (dist.has(k) || !isFree(B, nx, ny)) continue;
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
const sideDef = (B, side) => (sideHero(B, side) ? heroStat(sideHero(B, side), 'def') : 0) + (B.sides[side].town ? TOWN_WALL_DEF[townLevel(B.sides[side].town)] : 0);
// Którą stroną dowodzi człowiek (resztą SI). Na razie człowiek zawsze atakuje, więc to strona 0.
const humanSide = (B, side) => B.sides[side].owner === ME;
// Obrażenia jak w oryginale: podstawa × (1 + 5% za każdy punkt przewagi ataku), albo −2,5% za punkt przewagi obrony.
// moved = liczba pól rozpędu (szarża), ranged = strzał; strzelec wręcz bije za połowę, chyba że ma „Walkę wręcz”.
function damageRoll(B, a, t, ranged, moved = 0) {
  const ca = CREATURES[a.cid], ct = CREATURES[t.cid];
  const base = a.n * (a.buffs.bless ? ca.dmax : ca.dmin + B.rng() * (ca.dmax - ca.dmin));
  const A = unitAtt(a) + sideAtt(B, a.side), D = unitDef(t) + sideDef(B, t.side) + (t.defending ? Math.ceil(ct.def * 0.2) + 1 : 0);
  let mult = A >= D ? Math.min(4, 1 + 0.05 * (A - D)) : Math.max(0.3, 1 - 0.025 * (D - A));
  if (!ranged && ca.shots > 0 && !hasAb(a, 'noMeleePenalty')) mult *= 0.5;
  if (!ranged && hasAb(a, 'jousting')) mult *= 1 + 0.05 * moved;
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
function strike(B, a, t, ranged, moved = 0) {
  const dmg = damageRoll(B, a, t, ranged, moved), killed = applyDamage(t, dmg);
  B.log.push(`${CREATURES[a.cid].plural} (${a.n}) zadają ${dmg} obrażeń${killed ? `. ${CREATURES[t.cid].plural} tracą ${killed}` : ''}.`);
  if (B.fx) B.fx.push({ kind: ranged ? 'shot' : 'hit', a, tg: t, dmg, killed });
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
  let moved = 0;
  if (path.length) {
    const [x, y] = path[path.length - 1]; moved = hexDistance(u, { x, y });
    if (B.fx) B.fx.push({ kind: 'move', u, path: [[u.x, u.y], ...path], fly: hasAb(u, 'fly') }); u.x = x; u.y = y;
  }
  if (!target) return;
  strike(B, u, target, false, moved);
  const retal = () => { if (target.dead || u.dead || hasAb(u, 'noRetal')) return; if (target.retaliated && !hasAb(target, 'unlimitedRetal')) return; target.retaliated = true; strike(B, target, u, false); };
  retal();
  if (hasAb(u, 'doubleStrike') && !u.dead && !target.dead) strike(B, u, target, false, 0);
}
function actShoot(B, u, target) {
  u.shots--; strike(B, u, target, true);
  if (hasAb(u, 'doubleShot') && u.shots > 0 && !target.dead) { u.shots--; strike(B, u, target, true); }
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
  if (!ranged && dmg < poolE && !hasAb(u, 'noRetal') && (!e.retaliated || hasAb(e, 'unlimitedRetal'))) {
    const left = { ...e, n: e.n - kills }, hpU = CREATURES[u.cid].hp, poolU = (u.n - 1) * hpU + u.hp, back = damageRoll(B, left, u, false, 0);
    loss = Math.min(u.n, back >= poolU ? u.n : u.n - Math.ceil((poolU - back) / hpU)) * CREATURES[u.cid].value;
  }
  B.rng = saved; return gain - loss;
}
// Sztuczna inteligencja: wybiera najlepszą wymianę (strzał albo atak z dostępnego pola),
// a gdy nikogo nie sięgnie, zbliża się do najcenniejszego celu. Strzelców wroga ceni wyżej.
function aiAct(B, u) {
  const foes = alive(B, 1 - u.side);
  if (canShoot(B, u)) {
    const t = foes.reduce((a, b) => (tradeValue(B, u, b, true, 0) > tradeValue(B, u, a, true, 0) ? b : a));
    actShoot(B, u, t); return;
  }
  const spd = unitSpd(u), reach = battleDist(B, u, spd); let best = null;
  for (const e of foes) for (const [nx, ny] of [[u.x, u.y], ...hexNeighbors(e.x, e.y)]) {
    if (!hexAdjacent({ x: nx, y: ny }, e)) continue; const d = reach.dist.get(hexKey(nx, ny)); if (d == null) continue;
    const score = tradeValue(B, u, e, false, d) - d * 0.01; if (!best || score > best.score) best = { score, e, nx, ny };
  }
  // strzelec z sąsiadem obok: bije wręcz tylko, gdy to się opłaca; inaczej broni się
  if (best && (best.score > 0 || u.shots === 0 || foes.every(e => !e.shots))) { actMoveAttack(B, u, pathTo(reach, u, best.nx, best.ny), best.e); return; }
  if (best) { actDefend(B, u); return; }
  // nikt w zasięgu: strzelcy czekają na miejscu, reszta idzie w stronę najcenniejszego wroga
  if (u.shots > 0) { actDefend(B, u); return; }
  const target = foes.reduce((a, b) => (b.n * CREATURES[b.cid].value > a.n * CREATURES[a.cid].value ? b : a));
  const far = battleDist(B, u, reach.fly ? spd : Infinity); let goal = null;
  if (reach.fly) { for (const k of far.dist.keys()) { const x = k % BCOLS, y = Math.floor(k / BCOLS), d = hexDistance({ x, y }, target); if (!goal || d < goal.d) goal = { d, nx: x, ny: y }; } }
  else for (const e of [target, ...foes]) { for (const [nx, ny] of hexNeighbors(e.x, e.y)) { const d = far.dist.get(hexKey(nx, ny)); if (d != null && (!goal || d < goal.d)) goal = { d, nx, ny }; } if (goal) break; }
  if (!goal) { actDefend(B, u); return; }
  const path = reach.fly ? [[goal.nx, goal.ny]] : pathTo(far, u, goal.nx, goal.ny).slice(0, spd);
  actMoveAttack(B, u, path, null);
}
// Kolejka: w każdej rundzie od najszybszych; kto czekał, rusza na końcu (najwolniejsi pierwsi)
function nextActive(B) {
  for (;;) {
    if (!alive(B, 0).length || !alive(B, 1).length) { B.over = alive(B, 0).length ? 'win' : 'lose'; B.active = null; return null; }
    if (!B.order.length && B.waitQ.length) { B.order = B.waitQ.filter(u => !u.dead).sort((a, b) => unitSpd(a) - unitSpd(b)); B.waitQ = []; }
    if (!B.order.length) {
      B.round++; B.cast = [false, false];
      for (const u of B.units) {
        u.retaliated = false; u.defending = false; u.waited = false;
        for (const k of Object.keys(u.buffs)) if (--u.buffs[k] <= 0) delete u.buffs[k];
        if (!u.dead && hasAb(u, 'regen') && u.hp < CREATURES[u.cid].hp) { const amt = CREATURES[u.cid].hp - u.hp; u.hp += amt; if (B.fx) B.fx.push({ kind: 'heal', u, amount: amt }); }
      }
      B.order = alive(B).sort((a, b) => unitSpd(b) - unitSpd(a) || a.side - b.side);
    }
    const u = B.order.shift(); if (u && !u.dead) { B.active = u; if (u.defending) u.defending = false; return u; }
  }
}
// --- czary w bitwie: bohater rzuca jeden czar na rundę, zanim ruszy oddział ---
const unitAtt = u => CREATURES[u.cid].att + (u.buffs.bloodlust ? 3 : 0) - (u.buffs.weakness ? 3 : 0);
const unitDef = u => CREATURES[u.cid].def + (u.buffs.stoneSkin ? 3 : 0);
const unitSpd = u => Math.max(1, CREATURES[u.cid].spd + (u.buffs.haste ? 3 : 0) - (u.buffs.slow ? 3 : 0));
const battleSpells = h => (h.spells || []).filter(id => SPELLS[id].kind === 'battle');
// Czar rzuca bohater strony, której oddział właśnie ma ruch (jeden czar na rundę na stronę)
const casterSide = B => (B.active ? B.active.side : 0);
const canCastNow = B => { const s = casterSide(B), h = sideHero(B, s); return !!(B.active && h && !B.cast[s] && battleSpells(h).some(id => SPELLS[id].cost <= h.mana)); };
// Czy cel pasuje do czaru (u = oddział albo null dla czaru na pole); „swoi” = strona rzucającego
function spellTargetOk(B, id, u) {
  const t = SPELLS[id].target, s = casterSide(B); if (t === 'hex') return true; if (!u || u.dead && !(t === 'undeadAlly' && u.side === s && hasAb(u, 'undead'))) return false;
  return t === 'enemy' ? u.side !== s : t === 'ally' ? u.side === s : t === 'undeadAlly' ? u.side === s && hasAb(u, 'undead') : false;
}
// Pola trafione czarem (kula ognia: pole + sąsiedzi)
const spellArea = (id, x, y) => (SPELLS[id].target === 'hex' ? [[x, y], ...hexNeighbors(x, y)] : [[x, y]]);
function castBattle(B, id, x, y) {
  const s = casterSide(B), h = sideHero(B, s), S = SPELLS[id], sp = heroStat(h, 'sp'), tu = B.units.find(u => u.x === x && u.y === y && (!u.dead || S.raise)) || null;
  h.mana -= S.cost; B.cast[s] = true; B.log.push(`${h.name} rzuca: ${S.name}.`);
  if (B.fx) B.fx.push({ kind: 'spell', id, x, y });
  if (S.dmg) for (const [ax, ay] of spellArea(id, x, y)) {
    const v = unitAt(B, ax, ay); if (!v) continue; const d = S.dmg(sp), k = applyDamage(v, d);
    B.log.push(`${CREATURES[v.cid].plural}: ${d} obrażeń${k ? `, tracą ${k}` : ''}.`); if (B.fx) B.fx.push({ kind: 'hit', a: null, tg: v, dmg: d, killed: k });
  }
  if (S.heal && tu) {
    if (tu.dead) { tu.dead = false; tu.n = 1; tu.hp = 0; tu.dieT = null; } // ożywienie poległego oddziału
    const back = S.raise ? healUnit(tu, S.heal(sp)) : (tu.hp = Math.min(CREATURES[tu.cid].hp, tu.hp + S.heal(sp)), 0);
    if (!S.raise) for (const b of BAD_BUFFS) delete tu.buffs[b];
    if (back) B.log.push(`Wraca do walki: ${back}.`); if (B.fx) B.fx.push({ kind: 'heal', u: tu, amount: S.heal(sp) });
  }
  if (S.buff && tu) { tu.buffs[S.buff] = SPELL_ROUNDS(sp); if (B.fx) B.fx.push({ kind: 'heal', u: tu, amount: 0, label: SPELLS[id].name }); }
}
// SI bohatera (tryb Auto i walka automatyczna): czar zadający najwięcej wartości, jeśli jakiś się opłaca
function aiHeroCast(B) {
  if (!canCastNow(B)) return false;
  const s = casterSide(B), h = sideHero(B, s), sp = heroStat(h, 'sp'); let best = null;
  for (const id of battleSpells(h)) {
    const S = SPELLS[id]; if (!S.dmg || S.cost > h.mana) continue;
    const cells = S.target === 'hex' ? B.units.filter(u => !u.dead).map(u => [u.x, u.y]) : alive(B, 1 - s).map(u => [u.x, u.y]);
    for (const [x, y] of cells) {
      let val = 0;
      for (const [ax, ay] of spellArea(id, x, y)) {
        const v = unitAt(B, ax, ay); if (!v) continue; const hp = CREATURES[v.cid].hp, pool = (v.n - 1) * hp + v.hp, d = S.dmg(sp);
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
  while (!B.over && guard++ < 5000) { const u = nextActive(B); if (!u) break; aiHeroCast(B); if (!u.dead && alive(B, 1 - u.side).length) aiAct(B, u); }
  if (!B.over) B.over = 'lose';
  return B;
}
// Ocalałe oddziały wracają tam, skąd przyszły: do armii bohatera, garnizonu albo liczebności potwora
function writeBackSide(B, side) {
  const S = B.sides[side], units = B.units.filter(u => u.side === side);
  if (S.monster) { S.monster.count = units.reduce((s, u) => s + (u.dead ? 0 : u.n), 0); return; }
  for (const u of units) { const a = u.src === 'garrison' ? S.town.garrison : S.hero.army; a[u.slot] = u.n > 0 && !u.dead ? { cid: u.cid, n: u.n } : null; }
}
const sideLosses = (B, side) => B.units.filter(u => u.side === side && u.n < u.n0).map(u => `${CREATURES[u.cid].plural.toLowerCase()} −${u.n0 - u.n}`);
const killedHp = (B, side) => B.units.filter(u => u.side === side).reduce((s, u) => s + (u.n0 - u.n) * CREATURES[u.cid].hp, 0);
// Pokonany bohater znika z mapy. Wybór bohatera gracza przesuwa się tak, żeby wskazywał tego samego (albo pierwszego).
function removeHero(st, h) {
  const sel = hero(st), i = st.heroes.indexOf(h); if (i < 0) return;
  st.heroes.splice(i, 1);
  const keep = sel !== h ? sel : myHeroes(st)[0]; st.selHero = Math.max(0, st.heroes.indexOf(keep));
}
// Zmiana właściciela miasta (i jego obiektu na mapie)
function captureTown(st, t, owner) {
  t.owner = owner; if (owner >= 0) reveal(st, t.x, t.y, HERO_SIGHT, owner);
  for (const ob of st.objects) if (ob.type === 'town' && ob.townId === t.id) ob.owner = owner;
  MapRender.miniDirty = true;
}
// Zapisuje wynik w stanie gry i zwraca opis dla okna podsumowania (z punktu widzenia atakującego, strona 0)
function resolveBattle(B, fled) {
  const { st, h } = B, D = B.sides[1], outcome = fled ? 'fled' : B.over;
  const res = { outcome, lost: sideLosses(B, 0), foeLost: sideLosses(B, 1), exp: 0, foeExp: 0, captured: null, heroDefeated: null };
  writeBackSide(B, 0); writeBackSide(B, 1);
  if (outcome === 'win') {
    res.exp = killedHp(B, 1);
    if (D.monster) removeObject(st, D.monster);
    if (D.hero) { res.heroDefeated = { name: D.hero.name, female: D.hero.female }; removeHero(st, D.hero); }
    if (D.town) { captureTown(st, D.town, h.owner); res.captured = D.town.name; }
  } else {
    if (D.hero && outcome === 'lose') { res.foeExp = killedHp(B, 0); if (D.hero.owner !== ME) gainExp(st, D.hero, res.foeExp); } // człowiekowi dolicza je okno po obronie
    if (outcome === 'fled') { if (B.prevPos) { h.x = B.prevPos[0]; h.y = B.prevPos[1]; } h.mp = 0; }
    else { // porażka: bohater uchodzi z życiem do swojego miasta (z wolną bramą), bez armii; gdy takiego nie ma, a gracz ma innych bohaterów, odchodzi
      const towns = st.towns.filter(t => t.owner === h.owner), t = towns.find(t => !heroAt(st, t.x, t.y)) || (towns.length && st.heroes.filter(o => o.owner === h.owner).length === 1 ? towns[0] : null);
      h.army = emptyArmy(); h.mp = 0; res.home = t ? t.name : null;
      if (t) { h.x = t.x; h.y = t.y; reveal(st, h.x, h.y, heroSight(h), h.owner); }
      else if (towns.length) { removeHero(st, h); res.heroLost = true; }
    }
  }
  h.prev = null; h.path = null; h.dest = null; rebuildObjIndex(st);
  return res;
}

