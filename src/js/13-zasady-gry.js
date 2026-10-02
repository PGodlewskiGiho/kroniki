// ==================== ZASADY GRY ========================================================
// Ruch, odkrywanie mapy, obiekty, potyczki, dochód, budowanie.
// Dzienny limit ruchu zależy od najwolniejszej jednostki w armii (jak w oryginale)
function mpBySpeed(s) { return s <= 3 ? 1500 : s >= 11 ? 2000 : [1560, 1630, 1700, 1760, 1830, 1900, 1960][s - 4]; }
function heroMaxMP(h) { return Math.round(mpBySpeed(armySlowest(h.army)) * (1 + skillVal(h, 'logistics') / 100) * seasonMpMul(G.state, h)) + heroBonus(h, 'mp') + (G.state && h.stableWeek === weekIndex(G.state) ? STABLE_MP : 0); }
// Odkrywa teren wokół punktu dla gracza (domyślnie człowieka). SI też ma własną mgłę wojny.
function reveal(st, cx, cy, r, owner = ME) {
  const P = playerOf(st, owner); if (!P || !P.explored) return;
  const n = st.map.n, ex = P.explored; let changed = false;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > r * r + r) continue; const x = cx + dx, y = cy + dy;
    if (x < 0 || y < 0 || x >= n || y >= n) continue; const i = y * n + x; if (!ex[i]) { ex[i] = 1; changed = true; }
  }
  if (changed && owner === ME) MapRender.miniDirty = true;
}
// Pole, na które można wejść. Woda tylko dla bohatera w łodzi albo jako pole z łodzią (wsiadanie).
function passableTile(st, x, y, h = null) {
  const map = st.map, n = map.n; if (x < 0 || y < 0 || x >= n || y >= n) return false;
  const i = y * n + x; if (!human(st).explored[i] || map.obst[i]) return false;
  return map.terrain[i] !== TER.WATER || !!(h && (h.boat || boatAt(st, i)));
}
// --- statki: łódź to obiekt na wodzie; bohater wsiada, wchodząc na nią, a wysiada na brzeg (koniec ruchu na dziś) ---
const BOAT_COST = { gold: 1000, wood: 10 };
const boatAt = (st, i) => { const o = objectAt(st, i); return !!(o && o.type === 'boat'); };
function addBoat(st, x, y) { const ob = { id: st.objects.length, type: 'boat', x, y }; st.objects.push(ob); rebuildObjIndex(st); return ob; }
// Krok po wodzie: w łodzi tylko po wodzie, brzeg wyłącznie jako cel; pieszo woda tylko jako cel (łódź)
function legOk(st, h, i, j, target) {
  const w = st.map.terrain; return h && h.boat ? (w[j] === TER.WATER || (j === target && w[i] === TER.WATER)) : (w[j] !== TER.WATER || j === target);
}
// Miejsce na nową łódź ze stoczni: najbliższa wolna woda przy brzegu w promieniu 4 pól od miasta
function shipyardSpot(st, t) {
  const map = st.map, n = map.n; let best = null;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    const x = t.x + dx, y = t.y + dy, i = y * n + x; if (x < 1 || y < 1 || x >= n - 1 || y >= n - 1 || map.terrain[i] !== TER.WATER || st.objAt[i] || heroAt(st, x, y)) continue;
    let coast = false; for (let d = 0; d < 8; d++) { const j = (y + DY8[d]) * n + x + DX8[d]; if (map.terrain[j] !== TER.WATER && !map.obst[j]) coast = true; }
    const d = dx * dx + dy * dy; if (coast && (!best || d < best.d)) best = { x, y, d };
  }
  return best;
}
// Czy miasto leży nad wodą (stocznię można zbudować tylko nad wodą)
function townCoastal(st, t) { const map = st.map, n = map.n; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = t.x + dx, y = t.y + dy; if (x >= 0 && y >= 0 && x < n && y < n && map.terrain[y * n + x] === TER.WATER) return true; } return false; }
// Kupno łodzi w stoczni. Zwraca błąd albo null.
function buyBoat(st, t) {
  if (!hasB(t, 'shipyard')) return 'Brak stoczni'; if (!canAfford(st, BOAT_COST, t.owner)) return 'Brakuje zasobów na łódź';
  const p = shipyardSpot(st, t); if (!p) return 'Przy stoczni nie ma wolnego miejsca na wodzie';
  const R = playerOf(st, t.owner).resources; for (const r of RESOURCES) if (BOAT_COST[r.id]) R[r.id] -= BOAT_COST[r.id];
  addBoat(st, p.x, p.y); return null;
}
// Przywołanie łodzi: wolne pole wody obok bohatera (najpierw w linii prostej)
function boatSpot(st, h) {
  const map = st.map, n = map.n;
  for (let d = 0; d < 8; d++) { const x = h.x + DX8[d], y = h.y + DY8[d], i = y * n + x; if (x >= 0 && y >= 0 && x < n && y < n && map.terrain[i] === TER.WATER && !st.objAt[i] && !heroAt(st, x, y)) return { x, y }; }
  return null;
}
// Koszt kroku liczony wg terenu, z którego bohater wychodzi; droga działa, gdy oba pola mają drogę.
// Znajdowanie drogi (h) zmniejsza narzut trudnego terenu ponad 100.
function baseCost(map, i, j, h) {
  if (map.road[i] && map.road[j]) return ROADS[map.road[i]].cost;
  const t = map.terrain[i]; let c = TERRAINS[t].cost || 100; const pf = h ? skillVal(h, 'pathfinding') : 0; // woda: zwykły krok
  if (t === TER.WATER && h && skillVal(h, 'navigation')) return Math.round(c / (1 + skillVal(h, 'navigation') / 100)); // Nawigacja
  if (h && ((heroTrait(h, 'fortress') && (t === TER.SWAMP || t === TER.ROUGH)) || (heroTrait(h, 'academy') && t === TER.SNOW))) c = 100; // cechy frakcji
  return c > 100 && pf ? Math.round(100 + (c - 100) * (1 - pf / 100)) : c;
}
function stepCost(map, fx, fy, tx, ty, h) { const n = map.n, c = baseCost(map, fy * n + fx, ty * n + tx, h); return (fx !== tx && fy !== ty) ? Math.floor(c * 1.414) : c; }
function heroDrawPos(h) {
  if (!h.anim) return [h.x, h.y]; const k = clamp(h.anim.t / (h.anim.d || STEP_TIME), 0, 1); // d: krótszy krok przy szybkich ruchach komputera
  return [h.anim.fx + (h.x - h.anim.fx) * k, h.anim.fy + (h.y - h.anim.fy) * k];
}
function rebuildObjIndex(st) {
  const n = st.map.n, N = n * n; st.objAt = new Int32Array(N); st.guard = new Int32Array(N);
  for (const ob of st.objects) {
    if (ob.dead) continue; const id = ob.id + 1;
    st.objAt[ob.y * n + ob.x] = id; if (ob.blocks) for (const i of ob.blocks) st.objAt[i] = id;
    if (ob.type === 'monster') for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = ob.x + dx, y = ob.y + dy; if (x >= 0 && y >= 0 && x < n && y < n && st.map.terrain[y * n + x] !== TER.WATER) st.guard[y * n + x] = id;
    }
  }
}
function objectAt(st, i) { const o = st.objAt[i]; return o ? st.objects[o - 1] : null; }
// Budowla wielopolowa (miasto, kopalnia, skarbiec) pod kursorem: jej pola albo wieże i dachy rysowane do 2 pól nad nimi
// (kliknięcie w zamek prowadzi do bramy, a nie za miasto)
function drawnObjectAt(st, tx, ty) {
  const n = st.map.n, own = objectAt(st, ty * n + tx); if (own) return own.blocks ? own : null;
  for (let k = 1; k <= 2 && ty + k < n; k++) { const ob = objectAt(st, (ty + k) * n + tx); if (ob) return ob.blocks && (ob.type === 'town' || k === 1) ? ob : null; }
  return null;
}
function removeObject(st, ob) { ob.dead = true; rebuildObjIndex(st); }
// Obiekty i strefy strażników można tylko "odwiedzić" jako cel ścieżki, nie przejść przez nie.
// Inny bohater zajmuje pole: można na nie tylko wejść jako cel (wrogi bohater = bitwa).
function objBlocks(st, j, target, tg = 0) {
  if (j !== target && heroAt(st, j % st.map.n, (j / st.map.n) | 0)) return true;
  const ob = objectAt(st, j);
  if (ob) { if ((ob.type === 'mine' || ob.type === 'town' || ob.type === 'bank') && j !== ob.y * st.map.n + ob.x) return true; if (j !== target) return true; }
  return !!(st.guard[j] && j !== target && st.guard[j] !== tg);
}
function computePath(st, h, tx, ty) {
  if (!passableTile(st, tx, ty, h)) return null; const map = st.map, n = map.n, t = ty * n + tx;
  if (objBlocks(st, t, t)) return null;
  const tob = objectAt(st, t), tg = tob && tob.type === 'monster' ? tob.id + 1 : 0;
  const p = findPath(n, h.x, h.y, tx, ty, (j, i) => (passableTile(st, j % n, (j / n) | 0, h) && legOk(st, h, i, j, t) && !objBlocks(st, j, t, tg)) ? baseCost(map, i, j, h) : Infinity, 50);
  return p && p.length > 1 ? p.slice(1).map(i => [i % n, (i / n) | 0]) : null;
}
function heroCanStillMove(st, h) {
  if (!armySize(h.army)) return false;
  const n = st.map.n;
  for (let d = 0; d < 8; d++) { const x = h.x + DX8[d], y = h.y + DY8[d], j = y * n + x; if (passableTile(st, x, y, h) && legOk(st, h, h.y * n + h.x, j, j) && !objBlocks(st, j, j) && !heroAt(st, x, y) && stepCost(st.map, h.x, h.y, x, y, h) <= h.mp) return true; }
  return false;
}
function heroStep(st, h) {
  if (!h.path || !h.path.length || h.stop) { h.moving = false; h.stop = false; return false; }
  const n = st.map.n, [nx, ny] = h.path[0], ni = ny * n + nx, ob = objectAt(st, ni);
  const halt = () => { h.moving = false; h.path = null; h.dest = null; };
  if (ob && ob.type === 'monster') { halt(); h.prev = null; startEncounter(st, h, ob); return false; }
  const other = heroAt(st, nx, ny); // bohater w bramie miasta broni się razem z miastem (startTownAssault)
  if (other && !(ob && ob.type === 'town')) { halt(); if (other.owner !== h.owner) { h.prev = null; startHeroEncounter(st, h, other); } else if (playerOf(st, h.owner).human && !G.screens.adventure.aiRun) showMeeting(st, h, other); return false; } // własny: spotkanie po dojściu
  const cost = stepCost(st.map, h.x, h.y, nx, ny, h); if (h.mp < cost) { h.moving = false; return false; }
  h.mp -= cost; h.path.shift(); if (nx !== h.x) h.dir = nx > h.x ? 1 : -1;
  h.prev = [h.x, h.y]; h.anim = { fx: h.x, fy: h.y, t: 0 }; h.x = nx; h.y = ny; reveal(st, h.x, h.y, heroSight(h));
  if (!h.path.length) { h.path = null; h.dest = null; }
  if (!h.boat && ob && ob.type === 'boat') { h.boat = true; removeObject(st, ob); halt(); return true; }
  if (h.boat && st.map.terrain[ni] !== TER.WATER) { h.boat = false; addBoat(st, h.prev[0], h.prev[1]); h.mp = 0; } // wysiadka: łódź zostaje przy brzegu
  if (st.guard[ni]) { const m = st.objects[st.guard[ni] - 1]; halt(); h.pending = () => startEncounter(st, h, m); }
  else if (ob) { halt(); h.pending = () => visitObject(st, h, ob); }
  return true;
}
// Siedlisko najemników: okno werbunku (wszyscy, na ilu stać, albo nic)
function showDwelling(st, h, ob) {
  const k = dwellMax(st, h, ob), c = CREATURES[ob.cid];
  const msg = `${SITES.dwelling.name}: ${c.plural.toLowerCase()} (poziom ${c.level}). Czeka ${ob.avail}, koszt ${costText(c.cost)} za jednego. ${k ? `Stać cię na ${k}.` : ob.avail ? 'Brakuje ci surowców.' : 'W tym tygodniu nikt już nie czeka.'}`;
  showDialog(msg, [...(k ? [{ label: `Zwerbuj ${k}`, key: 'enter', action: () => { const e = dwellHire(st, h, ob, k); if (e) G.screens.adventure.flash(e); } }] : []), { label: 'Wyjdź', key: 'escape' }],
    { iconH: 70, icon: (ctx, cx, cy) => drawCreatureIcon(ctx, ob.cid, cx, cy + 26, 2) });
}
function advFloat(text, x, y, res) { const s = G.screens.adventure; if (s.floats) s.floats.push({ text, x, y, res, t: G.time }); }
function visitObject(st, h, ob) {
  const R = playerOf(st, h.owner).resources;
  if (ob.type === 'res') { R[ob.res] += ob.amount; advFloat(`+${ob.amount}`, h.x, h.y, ob.res); removeObject(st, ob); }
  else if (ob.type === 'chest') {
    removeObject(st, ob);
    showDialog('Znajdujesz skrzynię ze skarbem. Możesz zatrzymać złoto albo rozdać je chłopom w zamian za doświadczenie.', [
      { label: `${ob.gold} złota`, key: 'enter', action: () => { R.gold += ob.gold; advFloat(`+${ob.gold}`, h.x, h.y, 'gold'); } },
      { label: `${ob.exp} dośw.`, action: () => { advFloat(`+${ob.exp} dośw.`, h.x, h.y); gainExp(st, h, ob.exp); } },
    ], { locked: true, iconH: 56, icon: (ctx, cx, cy) => drawMap3dIcon(ctx, 'chest', cx, cy, 70, 52) || drawSprite(ctx, chestSprite(), cx, cy + 4, 2) });
  } else if (ob.type === 'art') {
    removeObject(st, ob); const on = giveArtifact(h, ob.art); h.mp = Math.min(h.mp + (on ? ARTIFACTS[ob.art].bonus.mp || 0 : 0), heroMaxMP(h));
    showDialog(`Znajdujesz artefakt: ${artInfo(ob.art)} ${on ? `${h.name} od razu go zakłada.` : 'Trafia do plecaka: załóż go na ekranie bohatera.'}${assemblable(h).length ? ` Masz komplet części relikwii: ${ARTIFACTS[assemblable(h)[0]].name}! Złóż ją na ekranie bohatera.` : ''}`, [{ label: 'OK', key: 'enter' }],
      { iconH: 70, icon: (ctx, cx, cy) => drawSprite(ctx, artSprite(ob.art, true), cx, cy, 2) });
  } else if (ob.type === 'site' && ob.kind === 'dwelling') showDwelling(st, h, ob);
  else if (ob.type === 'site' && ob.kind === 'sacrifice' && h.bag.some(id => id !== 'grail' && SACRIFICE_EXP[ARTIFACTS[id].rarity])) {
    const arts = h.bag.filter(id => id !== 'grail' && SACRIFICE_EXP[ARTIFACTS[id].rarity]), exp = arts.reduce((s, id) => s + SACRIFICE_EXP[ARTIFACTS[id].rarity], 0);
    showDialog(`Ołtarz ofiarny. Złożyć w ofierze wszystkie artefakty z plecaka (${arts.length}: ${arts.map(id => ARTIFACTS[id].name).join(', ')}) za ${exp} doświadczenia? Założonych nie rusza.`, [
      { label: 'Poświęć', key: 'enter', action: () => { const r = useSite(st, h, ob); advFloat(r.float, h.x, h.y); gainExp(st, h, r.exp); } }, { label: 'Nie', key: 'escape' },
    ], { iconH: 76, icon: (ctx, cx, cy) => drawMap3dIcon(ctx, 'site_sacrifice', cx, cy, 90, 74) || drawSprite(ctx, siteSprite('sacrifice'), cx, cy + 30, 1.5) });
  } else if (ob.type === 'site') {
    const r = useSite(st, h, ob), S = SITES[ob.kind];
    if (r.float) advFloat(r.float, h.x, h.y, r.res);
    showDialog(`${S.name}. ${r.text}`, [{ label: r.puzzle ? 'Mapa zagadki' : 'OK', key: 'enter', action: () => { if (r.exp) gainExp(st, h, r.exp); if (r.puzzle) showPuzzle(st); } }],
      { iconH: 76, icon: (ctx, cx, cy) => { drawMap3dIcon(ctx, 'site_' + ob.kind, cx, cy, 90, 74) || drawSprite(ctx, siteSprite(ob.kind), cx, cy + 30, 1.5); if (ob.kind === 'witchHut') skillIcon(ctx, ob.skill, cx + 64, cy + 8, 48); } });
  } else if (ob.type === 'town') {
    const t = st.towns[ob.townId];
    if (ob.owner !== h.owner) startTownAssault(st, h, t);
    else if (hasGrail(h) && !hasB(t, 'grail')) { // Graal w plecaku: jak w Heroes 3 miasto pyta, czy go tu wbudować
      const name = bInfo(BUILD_BY_ID.grail, t.faction).name;
      showDialog(`${h.name} przynosi Graala do miasta ${t.name}. Wznieść tu ${name}? (+${GRAIL_GOLD} złota dziennie, +50% przyrostu stworów; Graal zostaje w mieście na zawsze.)`, [
        { label: 'Zbuduj', key: 'enter', action: () => { buildGrail(st, t, h); G.go('town', { townId: t.id }); } },
        { label: 'Nie teraz', key: 'escape', action: () => G.go('town', { townId: t.id }) },
      ], { iconH: 70, icon: (ctx, cx, cy) => drawSprite(ctx, artSprite('grail', true), cx, cy, 3) });
    } else G.go('town', { townId: ob.townId });
  } else if (ob.type === 'bank') {
    if (ob.cleared) { G.screens.adventure.flash(`${BANKS[ob.kind].name}: splądrowane, nic tu już nie ma`); return; }
    startBankAssault(st, h, ob);
  } else if (ob.type === 'mine') {
    const M = MINES[ob.kind];
    if (ob.owner === h.owner) { G.screens.adventure.flash(`${M.name} już należy do ciebie`); return; }
    ob.owner = h.owner; MapRender.miniDirty = true;
    showDialog(`${M.name} należy teraz do ciebie. Dochód dzienny: ${M.income} (${resName(ob.kind).toLowerCase()}).`, [{ label: 'OK', key: 'enter' }],
      { iconH: 66, icon: (ctx, cx, cy) => { if (drawMap3dIcon(ctx, 'mine_' + ob.kind, cx, cy, 110, 64)) return drawSprite(ctx, flagSprite(ownerColor(st, ob.owner), 12, 7), cx + 30, cy - 34, 1); drawSprite(ctx, mineSprite(ob.kind), cx - 33, cy - 31, 1); drawSprite(ctx, flagSprite(ownerColor(st, ob.owner), 12, 7), cx + 23, cy - 33, 1); } });
  }
}
function startEncounter(st, h, m) {
  if (m.dead) return; const c = CREATURES[m.cid];
  // h.prev jest puste, gdy bohater sam wszedł na potwora; ustawione, gdy wszedł w strefę strażnika
  const who = h.prev ? `${qtyName(m.count)} ${c.gen} atakuje twojego bohatera!` : `${h.name} atakuje: ${qtyName(m.count).toLowerCase()} ${c.gen}.`;
  offerBattle(st, h, m, who, m.count * c.value, (ctx, cx, cy) => drawCreatureIcon(ctx, m.cid, cx, cy + 34, 2));
}
// Skarbiec: opis załogi i łupu, potem zwykłe okno przed bitwą (odwrót cofa bohatera o pole)
const bankPower = ob => ob.guards.reduce((s, [cid, n]) => s + n * CREATURES[cid].value, 0);
const bankGuardText = ob => ob.guards.map(([cid, n]) => `${qtyName(n).toLowerCase()} ${CREATURES[cid].gen}`).join(', ');
function bankLootText(kind) {
  const B = BANKS[kind], parts = RESOURCES.filter(r => B.loot[r.id]).map(r => `${B.loot[r.id]} ${r.id === 'gold' ? 'złota' : resName(r.id).toLowerCase()}`);
  for (const [rar, k] of B.arts || []) parts.push(k > 1 ? `${k} artefakty (${{ treasure: 'skarby', minor: 'pomniejsze', major: 'potężne' }[rar]})` : `artefakt (${RARITY[rar]})`);
  if (B.units) parts.push(`${B.units[1]} ${CREATURES[B.units[0]].gen} do armii`);
  return parts.join(', ');
}
function startBankAssault(st, h, ob) {
  const B = BANKS[ob.kind];
  offerBattle(st, h, ob, `${B.name}: ${B.desc}. Załoga: ${bankGuardText(ob)}. Łup: ${bankLootText(ob.kind)}.`, bankPower(ob),
    (ctx, cx, cy) => { if (drawMap3dIcon(ctx, `bank_${ob.kind}_0`, cx, cy, 120, 84)) return; const sp = bankSprite(ob.kind, false), H2 = sp.c.height * sp.u / 2, k = Math.min(1.1, 40 / H2); drawSpriteBox(ctx, sp, cx - sp.c.width * sp.u / 2 * k, cy - H2 * k, k); });
}
// Łup ze skarbca dla zwycięzcy (człowieka albo SI); zwraca opis do okna wyniku
function lootBank(st, h, ob) {
  const B = BANKS[ob.kind], R = playerOf(st, h.owner).resources, r = mulberry32(st.seed ^ (ob.id * 7919) ^ st.dayTotal), got = [];
  ob.cleared = true; MapRender.miniDirty = true;
  for (const res of RESOURCES) if (B.loot[res.id]) R[res.id] += B.loot[res.id];
  for (const [rar, k] of B.arts || []) for (let i = 0; i < k; i++) { const pool = ARTS_BY_RARITY(rar), id = pool[Math.floor(r() * pool.length)]; giveArtifact(h, id); got.push(ARTIFACTS[id].name); }
  let joined = '';
  if (B.units) { if (armyAdd(h.army, B.units[0], B.units[1])) joined = ` Do armii dołączają: ${CREATURES[B.units[0]].plural.toLowerCase()} (${B.units[1]}).`; else joined = ` Uwolnieni ${CREATURES[B.units[0]].plural.toLowerCase()} odchodzą: w armii nie ma miejsca.`; }
  return ` Łup: ${RESOURCES.filter(x => B.loot[x.id]).map(x => `${B.loot[x.id]} ${x.id === 'gold' ? 'złota' : resName(x.id).toLowerCase()}`).join(', ')}${got.length ? `; artefakty: ${got.join(', ')}` : ''}.${joined}`;
}
function startHeroEncounter(st, h, foe) {
  offerBattle(st, h, foe, `${h.name} atakuje: ${heroTitle(foe)} (${ownerName(st, foe.owner)}).`, Math.round(armyPower(foe.army) * heroFactor(foe)),
    (ctx, cx, cy) => drawHeroPortrait(ctx, cx - 36, cy - 36, foe, ownerColor(st, foe.owner), 2));
}
// Siła obrońców miasta: garnizon, bohater w mieście (z premią za cechy) i mury
function townPower(st, t) {
  const hh = townHero(st, t), wall = 1 + 0.05 * TOWN_WALL_DEF[townLevel(t)];
  return Math.round((armyPower(t.garrison) + (hh ? armyPower(hh.army) * heroFactor(hh) : 0)) * wall);
}
// Wejście do obcego miasta: puste zajmujemy od razu, bronione trzeba zdobyć w bitwie
function startTownAssault(st, h, t) {
  if (t.owner === h.owner) return;
  const hh = townHero(st, t), walls = ['', ' Miasto otaczają mury Fortu.', ' Miasto otaczają mury Cytadeli.', ' Miasto otaczają mury Zamku.'][townLevel(t)];
  if (!armySize(t.garrison) && !hh) {
    captureTown(st, t, h.owner); rebuildObjIndex(st);
    showDialog(`Miasto ${t.name} nie ma obrońców. ${h.name} zajmuje je bez walki.`, [{ label: 'Wejdź do miasta', key: 'enter', action: () => G.go('town', { townId: t.id }) }]);
    return;
  }
  const who = `${t.name} (${t.owner < 0 ? 'miasto niezależne' : `miasto: ${ownerName(st, t.owner)}`}) ${hh ? `ma w murach bohatera: ${heroTitle(hh)}` : 'broni się garnizonem'}.${walls}`;
  offerBattle(st, h, t, who, townPower(st, t), (ctx, cx, cy) => drawMap3dIcon(ctx, `town_${t.faction}_${townLevel(t)}`, cx, cy, 110, 84) || drawSpriteBox(ctx, townIconSprite(t.faction, townLevel(t), ownerColor(st, t.owner)), cx - 40, cy - 40, 2));
}
// Okno przed bitwą: porównanie sił i wybór (walka, walka automatyczna, odwrót)
function offerBattle(st, h, foe, who, foePower, icon) {
  const ph = Math.round(armyPower(h.army) * heroFactor(h)), odds = ph > foePower * 1.5 ? 'Przewaga jest po twojej stronie.' : ph > foePower ? 'Siły są dość wyrównane.' : 'Przeciwnik wygląda na silniejszego.';
  showDialog(`${who} ${odds} (siła: twoja ${ph}, wroga ${foePower})`, [
    { label: 'Walcz', key: 'enter', action: () => G.go('battle', { battle: createBattle(st, h, foe) }) },
    { label: 'Automatycznie', key: 'a', action: () => { const B = simulateBattle(createBattle(st, h, foe)); showBattleResult(st, h, resolveBattle(B, false)); } },
    { label: 'Wycofaj się', key: 'escape', action: () => { if (h.prev) { h.x = h.prev[0]; h.y = h.prev[1]; h.prev = null; } } },
  ], { locked: true, iconH: 84, icon });
}
// --- rozwój bohatera: cechy, poziomy, ekwipunek -----------------------------------------------
const emptyEquip = () => Object.fromEntries(EQUIP_SLOTS.map(s => [s.id, null]));
function initHeroProgress(h) {
  const g = CLASS_GROWTH[h.cls] || CLASS_GROWTH.knight;
  if (!h.stats) h.stats = Object.fromEntries(PRIMARY.map((p, i) => [p.id, g.base[i]]));
  if (!h.equip) h.equip = emptyEquip();
  if (!h.locked) h.locked = {}; // miejsca zajęte przez relikwię (miejsce -> relikwia)
  if (!h.bag) h.bag = [];
  if (!h.level) h.level = 1;
  if (!h.spells) h.spells = [...(CLASS_SPELLS[h.cls] || [])];
  if (!h.skills) h.skills = (CLASS_SKILLS[h.cls] || []).map(([id, lv]) => ({ id, lv }));
  if (!h.machines) h.machines = [];
  if (h.mana == null) h.mana = heroMaxMana(h);
}
// --- umiejętności drugorzędne ---
const heroSkill = (h, id) => { const s = h && h.skills && h.skills.find(s => s.id === id); return s ? s.lv : 0; };
// Szkoły magii: poziom umiejętności szkoły czaru u bohatera, koszt many po zniżce, mnożnik obrażeń i leczenia
const spellSchoolLv = (h, id) => { const S = SPELLS[id]; return S && S.school ? heroSkill(h, SCHOOLS[S.school].skill) : 0; };
const spellCost = (h, id) => Math.max(1, Math.round(SPELLS[id].cost * (1 - SCHOOL_COST[spellSchoolLv(h, id)] / 100)));
const schoolMul = (h, id) => 1 + SCHOOL_POWER[spellSchoolLv(h, id)] / 100;
const skillVal = (h, id) => { const L = heroSkill(h, id); if (!L) return 0; const sp = heroSpec(h), v = SKILLS[id].v[L - 1]; return sp && sp.skill === id ? Math.round(v * (1 + 0.05 * h.level)) : v; };
// --- specjalności bohaterów (HERO_SPECS) ---
// Stwory specjalności: oba stwory z siedliska danego poziomu w rodzimej frakcji bohatera
const specUnits = h => { const sp = heroSpec(h), F = sp && sp.dw && factionOf(heroFaction(h)); return F ? DW_TIERS.map(s => F.dw['dw' + sp.dw + s][1]) : []; };
// Premia dla oddziału stworów specjalności: +5% ataku i obrony za każdy poziom bohatera na poziom stwora (co najmniej +1), +1 szybkości
function specBonus(h, cid) {
  if (!specUnits(h).includes(cid)) return null; const c = CREATURES[cid], k = 0.05 * h.level / c.level;
  return { att: Math.max(1, Math.round(c.att * k)), def: Math.max(1, Math.round(c.def * k)), spd: 1 };
}
const specSpellMul = (h, id) => { const sp = heroSpec(h); return sp && sp.spell === id ? 1 + 0.03 * h.level : 1; };
function specText(h) {
  const sp = heroSpec(h); if (!sp) return '';
  if (sp.dw) { const [a] = specUnits(h), bo = specBonus(h, a); return `${CREATURES[a].plural} i ich ulepszenia: +${bo.att} do ataku, +${bo.def} do obrony, +1 do szybkości (rośnie z poziomem)`; }
  if (sp.res) return `+${sp.n} ${sp.res === 'gold' ? 'złota' : resName(sp.res).toLowerCase()} dziennie`;
  if (sp.skill) return `${SKILLS[sp.skill].name}: działa o ${5 * h.level}% mocniej (5% za poziom)`;
  return `${SPELLS[sp.spell].name}: o ${3 * h.level}% mocniejszy (3% za poziom)`;
}
const specName = h => { const sp = heroSpec(h); return !sp ? '' : sp.dw ? CREATURES[specUnits(h)[0]].plural : sp.res ? resName(sp.res) : sp.skill ? SKILLS[sp.skill].name : SPELLS[sp.spell].name; };
const skillText = (id, L) => `${SKILLS[id].name} (${SKILL_LEVELS[L]}): ${SKILLS[id].desc(SKILLS[id].v[L - 1])}`;
// Propozycja przy awansie na poziom L (jak w oryginale): ulepszenie znanej umiejętności i nowa umiejętność;
// gdy którejś grupy brak, obie z drugiej. Losowanie powtarzalne (ziarno gry, bohater, poziom).
// Nowe umiejętności losowane z wagami klasy (skillWeight): ulubione częściej, obce rzadziej.
function skillOffer(st, h, L) {
  const up = (h.skills || []).filter(s => s.lv < 3).map(s => s.id);
  const fresh = (h.skills || []).length < MAX_SKILLS ? Object.keys(SKILLS).filter(id => !heroSkill(h, id) && (id !== 'necromancy' || NECRO_CLASSES.includes(h.cls))) : [];
  const r = mulberry32(thash(h.id, L, st.seed) ^ 0x5a1d);
  const pick = a => { if (!a.length) return null; const w = a.map(id => skillWeight(h.cls, id)); let x = r() * w.reduce((s, v) => s + v, 0), i = 0; while (i < a.length - 1 && (x -= w[i]) >= 0) i++; return a.splice(i, 1)[0]; };
  return [pick(up) || pick(fresh), pick(fresh) || pick(up)].filter(Boolean);
}
function learnSkill(h, id) {
  const s = h.skills.find(s => s.id === id);
  if (s) s.lv = Math.min(3, s.lv + 1); else if (h.skills.length < MAX_SKILLS) h.skills.push({ id, lv: 1 });
  h.mana = Math.min(h.mana, heroMaxMana(h));
}
const aiPickSkill = offer => offer.slice().sort((a, b) => AI_SKILL_ORDER.indexOf(a) - AI_SKILL_ORDER.indexOf(b))[0];
// Suma premii z założonych artefaktów (plecak nie działa)
const heroBonus = (h, key) => Object.values(h.equip || {}).reduce((s, id) => s + (id ? ARTIFACTS[id].bonus[key] || 0 : 0), 0);
const heroStat = (h, key) => h.stats[key] + heroBonus(h, key);
const heroSight = h => h.sight + heroBonus(h, 'sight') + skillVal(h, 'scouting') + (heroTrait(h, 'dungeon') ? 2 : 0);
// Premia bohatera do siły armii w potyczce: +5% za każdy punkt ataku i obrony
const heroFactor = h => 1 + 0.05 * (heroStat(h, 'att') + heroStat(h, 'def'));
// Doświadczenie z awansami. Wzrost cechy losowany deterministycznie (ziarno gry, bohater, poziom).
// Każdy awans daje też wybór umiejętności: SI wybiera od razu, człowiek w oknie (po kolei, gdy awansów jest kilka).
// then(): co zrobić po zamknięciu okien awansu (np. obejrzeć obiekt, na którym stoi bohater)
function gainExp(st, h, amount, then, silent = false) { // silent: awans bez okien (np. uwolniony więzień)
  h.exp += Math.round(amount * (1 + skillVal(h, 'learning') / 100 + (weekKind(st, 'exp') ? 0.25 : 0))); const ups = [];
  while (h.exp >= expForLevel(h.level + 1)) {
    h.level++; const g = (CLASS_GROWTH[h.cls] || CLASS_GROWTH.knight).grow, r = thash(h.id, h.level, st.seed) % 100;
    let acc = 0, k = 0; for (; k < 3; k++) { acc += g[k]; if (r < acc) break; }
    h.stats[PRIMARY[k].id]++; ups.push({ level: h.level, stat: PRIMARY[k] });
  }
  if (h.owner !== ME || silent || !ups.length) {
    for (const u of ups) { const offer = skillOffer(st, h, u.level); if (offer.length) learnSkill(h, aiPickSkill(offer)); }
    if (then) then(); return ups.length;
  }
  const next = i => {
    if (i >= ups.length) { if (then) then(); return; }
    const u = ups[i], offer = skillOffer(st, h, u.level), icon = { iconH: 76, locked: offer.length > 0, icon: (ctx, cx, cy) => drawHeroPortrait(ctx, cx - 36, cy - 36, h, ownerColor(st, h.owner), 2) };
    const msg = `${h.name} osiąga poziom ${u.level}! +1 do ${u.stat.gen}.`;
    if (!offer.length) { showDialog(msg, [{ label: 'Wspaniale', key: 'enter', action: () => next(i + 1) }], icon); return; }
    showDialog(`${msg} Wybierz umiejętność:`, offer.map((id, k) => {
      const L = heroSkill(h, id) + 1;
      return { label: SKILLS[id].name, sub: SKILL_LEVELS[L], tip: skillText(id, L) + '.', key: String(k + 1), lead: (ctx, cx, cy) => skillIcon(ctx, id, cx, cy), action: () => { learnSkill(h, id); next(i + 1); } };
    }), Object.assign(icon, { bw: 200 }));
  };
  next(0); return ups.length;
}
// Zakłada artefakt z plecaka (indeks) na pasujące miejsce: najpierw wolne, inaczej zamiana z pierwszym pasującym.
// Miejsca zajęte przez relikwię (h.locked) są niedostępne. Relikwia zajmuje swoje miejsce i miejsca wszystkich części.
const freeSlots = (h, kind) => EQUIP_SLOTS.filter(s => s.kind === kind && !(h.locked || {})[s.id]);
function equipFromBag(h, bi) {
  const id = h.bag[bi]; if (!id) return 'Brak artefaktu';
  const A = ARTIFACTS[id]; if (!EQUIP_SLOTS.some(s => s.kind === A.kind)) return `${A.name} nie da się założyć`;
  if (A.parts) return equipRelic(h, bi);
  const slots = freeSlots(h, A.kind); if (!slots.length) return `Miejsce zajmuje relikwia: ${ARTIFACTS[h.locked[EQUIP_SLOTS.find(s => s.kind === A.kind).id]].name}`;
  const free = slots.find(s => !h.equip[s.id]) || slots[0];
  const old = h.equip[free.id]; h.equip[free.id] = id; h.bag.splice(bi, 1); if (old) { if (ARTIFACTS[old].parts) releaseLocks(h, old); h.bag.splice(bi, 0, old); }
  return null;
}
// Miejsca dla relikwii: główne (jej rodzaj) i po jednym na każdą pozostałą część
function relicSlots(h, id, prefer = {}) {
  const A = ARTIFACTS[id], used = new Set(), pick = kind => { const c = EQUIP_SLOTS.filter(s => s.kind === kind && !used.has(s.id)); const s = c.find(s => prefer[s.id]) || c.find(s => !h.equip[s.id]) || c[0]; if (s) used.add(s.id); return s; };
  const main = pick(A.kind), others = A.parts.filter((p, i) => !(ARTIFACTS[p].kind === A.kind && i === A.parts.findIndex(q => ARTIFACTS[q].kind === A.kind))).map(p => pick(ARTIFACTS[p].kind));
  return { main, others };
}
function releaseLocks(h, relic) { for (const k of Object.keys(h.locked || {})) if (h.locked[k] === relic) delete h.locked[k]; }
function equipRelic(h, bi) {
  const id = h.bag[bi], { main, others } = relicSlots(h, id); h.bag.splice(bi, 1);
  for (const s of [main, ...others]) { const old = h.equip[s.id]; if (old) { if (ARTIFACTS[old].parts) releaseLocks(h, old); h.bag.push(old); } h.equip[s.id] = null; if (h.locked[s.id]) { const r = h.locked[s.id]; for (const [k, v] of Object.entries(h.equip)) if (v === r) { h.equip[k] = null; h.bag.push(r); } releaseLocks(h, r); } }
  h.equip[main.id] = id; for (const s of others) h.locked[s.id] = id; return null;
}
function unequip(h, slotId) { const id = h.equip[slotId]; if (id) { h.equip[slotId] = null; h.bag.push(id); if (ARTIFACTS[id].parts) releaseLocks(h, id); } }
// Relikwie, które bohater może złożyć (wszystkie części założone)
const assemblable = h => RELICS.filter(r => ARTIFACTS[r].parts.every(p => Object.values(h.equip).includes(p)));
function assembleRelic(h, r) {
  const A = ARTIFACTS[r], prefer = {}; for (const [k, v] of Object.entries(h.equip)) if (A.parts.includes(v)) prefer[k] = 1;
  if (!A.parts.every(p => Object.values(h.equip).includes(p))) return false;
  for (const k of Object.keys(prefer)) h.equip[k] = null;
  const { main, others } = relicSlots(h, r, prefer); h.equip[main.id] = r; for (const s of others) h.locked[s.id] = r; return true;
}
// Rozkłada relikwię z miejsca slotId z powrotem na części (na zwolnione miejsca)
function disassembleRelic(h, slotId) {
  const r = h.equip[slotId]; if (!r || !ARTIFACTS[r].parts) return false;
  const spots = [slotId, ...Object.keys(h.locked).filter(k => h.locked[k] === r)]; releaseLocks(h, r); h.equip[slotId] = null;
  for (const p of ARTIFACTS[r].parts) { const s = spots.find(k => EQUIP_SLOTS.find(e => e.id === k).kind === ARTIFACTS[p].kind && !h.equip[k]); if (s) h.equip[s] = p; else h.bag.push(p); }
  return true;
}
// Nowy artefakt: na wolne pasujące miejsce albo do plecaka. Zwraca true, gdy został założony. Komputer od razu składa relikwie.
function giveArtifact(h, id) {
  const s = !ARTIFACTS[id].parts && freeSlots(h, ARTIFACTS[id].kind).find(s => !h.equip[s.id]);
  if (s) h.equip[s.id] = id; else h.bag.push(id);
  const pl = G.state && G.state.players[h.owner]; if (pl && !pl.human) for (const r of assemblable(h)) assembleRelic(h, r);
  return !!s;
}

// --- czary: mana, nauka w gildii, czary na mapie -----------------------------------------------
const heroMaxMana = h => Math.floor(10 * heroStat(h, 'kn') * (1 + skillVal(h, 'intelligence') / 100));
const knows = (h, id) => (h.spells || []).includes(id);
// Czary gildii losowane raz, gdy powstaje dany poziom (deterministycznie z ziarna gry i miasta)
function rollGuildLevel(st, t, L) {
  const pool = Object.keys(SPELLS).filter(id => SPELLS[id].level === L), r = mulberry32(st.seed ^ (t.id * 7777) ^ (L * 131)), out = [];
  while (pool.length && out.length < guildOffer(t, L)) { // losowanie bez powtórzeń z wagami szkół magii frakcji
    const w = pool.map(id => schoolWeight(t.faction, SPELLS[id].school)); let x = r() * w.reduce((a, b) => a + b, 0), i = 0;
    while (i < pool.length - 1 && (x -= w[i]) >= 0) i++; out.push(pool.splice(i, 1)[0]);
  }
  if (!t.guild) t.guild = {}; t.guild[L] = out;
}
const guildOffer = (t, L) => (GUILD_OFFER[L] || 1) + (t.faction === 'academy' && hasB(t, 'special') ? 1 : 0); // Biblioteka Akademii
const guildLevel = t => { for (let L = GUILD_MAX; L > 0; L--) if (hasB(t, 'guild' + L)) return L; return 0; };
// Czy frakcja miasta może postawić budowlę (gildia magów tylko do poziomu frakcji)
const bAllowed = (t, B) => { const m = /^guild(\d)$/.exec(B.id); return !m || +m[1] <= guildMax(t.faction); };
// Księga czarów (jak w Heroes 3): magowie zaczynają z nią, wojownicy kupują ją w mieście z gildią magów. Bez księgi bohater
// nie poznaje czarów (gildia, kapliczka, Orle oko) i nie może ich rzucać. Bohaterowie z dawnych zapisów mają ją (book !== false).
const SPELLBOOK_COST = 500;
const hasBook = h => !!h && h.book !== false;
function buyBook(st, t, h) {
  if (hasBook(h)) return `${h.name} ma już księgę czarów`; if (!guildLevel(t)) return 'Księgę czarów sprzedaje gildia magów';
  const R = playerOf(st, h.owner).resources; if (R.gold < SPELLBOOK_COST) return `Księga czarów kosztuje ${SPELLBOOK_COST} złota`;
  R.gold -= SPELLBOOK_COST; h.book = true; return null;
}
// Bohater w mieście z gildią: poznaje jej czary i odzyskuje całą manę. Zwraca nowo poznane czary.
// Komputer bez księgi kupuje ją sam, gdy go stać (z zapasem na wojsko).
function visitGuild(st, t, h) {
  const L = guildLevel(t); if (!L) return [];
  if (!hasBook(h) && !playerOf(st, h.owner).human && playerOf(st, h.owner).resources.gold >= SPELLBOOK_COST * 3) buyBook(st, t, h);
  if (!hasBook(h)) { h.mana = Math.max(h.mana, heroMaxMana(h)); return []; }
  const learned = [];
  for (let k = 1; k <= Math.min(L, spellCap(h)); k++) for (const id of (t.guild && t.guild[k]) || []) if (!knows(h, id)) { h.spells.push(id); learned.push(id); } // wyżej tylko z Mądrością
  h.mana = Math.max(h.mana, heroMaxMana(h)); return learned;
}
// Czary na mapie przygody. Zwraca tekst błędu albo null.
function castAdventure(st, h, id) {
  const S = SPELLS[id], sp = heroStat(h, 'sp');
  if (h.mana < spellCost(h, id)) return 'Za mało many';
  if (id === 'eagleEye') { reveal(st, h.x, h.y, 5 + sp); }
  else if (id === 'summonBoat') {
    if (h.boat) return 'Bohater już płynie łodzią';
    const p = boatSpot(st, h); if (!p) return 'Przy bohaterze nie ma wolnej wody';
    addBoat(st, p.x, p.y);
  }
  else if (id === 'townPortal') {
    if (h.mp < 300) return 'Za mało punktów ruchu (potrzeba 300)';
    const t = st.towns.filter(t => t.owner === h.owner && !heroAt(st, t.x, t.y)).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    if (!t) return 'Brak wolnego własnego miasta';
    if (h.boat) { h.boat = false; addBoat(st, h.x, h.y); } // łódź zostaje na wodzie
    h.x = t.x; h.y = t.y; h.mp -= 300; h.path = null; h.dest = null; reveal(st, h.x, h.y, heroSight(h)); centerCam(st, h.x, h.y);
  }
  h.mana -= spellCost(h, id); return null;
}

// --- armie: 7 miejsc, każde null albo { cid, n } (bohater: h.army, miasto: t.garrison) ---
const ARMY_SLOTS = 7;
const emptyArmy = () => Array(ARMY_SLOTS).fill(null);
const armyStacks = a => a.filter(Boolean);
const armySize = a => armyStacks(a).reduce((s, x) => s + x.n, 0);
// Szybkość najwolniejszej jednostki decyduje o dziennym ruchu bohatera (jak w oryginale)
function armySlowest(a) { const s = armyStacks(a); return s.length ? Math.min(...s.map(x => CREATURES[x.cid].spd)) : 4; }
// Siła armii = suma wartości bojowych (pole value w CREATURES)
const armyPower = a => armyStacks(a).reduce((p, x) => p + x.n * CREATURES[x.cid].value, 0);
// Dokłada jednostki do stosu tego samego typu albo na pierwsze wolne miejsce; false = brak miejsca
function armyAdd(a, cid, n) {
  const same = a.find(x => x && x.cid === cid); if (same) { same.n += n; return true; }
  const i = a.indexOf(null); if (i < 0) return false; a[i] = { cid, n }; return true;
}
const armyHasRoom = (a, cid) => a.some(x => x && x.cid === cid) || a.includes(null);
// Armia startowa bohatera: jednostki z dwóch najniższych siedlisk jego frakcji
// Bohater bez armii startowej (późniejsi kandydaci w tygodniu, powracający uciekinierzy): jeden stwór 1. poziomu
function weakArmy(fac) { const a = emptyArmy(); a[0] = { cid: factionOf(fac).dw.dw1[1], n: 1 }; return a; }
function startingArmy(fac, r) {
  const F = factionOf(fac), a = emptyArmy();
  a[0] = { cid: F.dw.dw1[1], n: 14 + Math.floor(r() * 11) };
  a[1] = { cid: F.dw.dw2[1], n: 5 + Math.floor(r() * 5) };
  return a;
}
// --- rekrutacja: każdy poziom siedliska ma wspólną pulę dla jednostki zwykłej i ulepszonej ---
const DW_LEVELS = [1, 2, 3, 4, 5, 6, 7];
const dwellingLevels = t => DW_LEVELS.filter(L => hasB(t, 'dw' + L));
// Stopnie siedliska: '' (zwykłe), 'u' (ulepszone), 'x' (elitarne); dwTop = klucz F.dw najwyższego zbudowanego stopnia
const DW_TIERS = ['', 'u', 'x'];
const dwTop = (t, L) => 'dw' + L + (hasB(t, 'dw' + L + 'x') ? 'x' : hasB(t, 'dw' + L + 'u') ? 'u' : '');
function dwellingUnits(t, L) {
  const F = factionOf(t.faction);
  return DW_TIERS.filter(s => !s || hasB(t, 'dw' + L + s)).map(s => F.dw['dw' + L + s][1]); // zwykła jednostka zawsze (także przed budową)
}
// Przyrost tygodniowy: bazowy z jednostki, +50% z Cytadelą, +100% z Zamkiem (opisy w BUILDINGS)
// Tydzień stworzenia dodaje +5 do przyrostu jego siedliska (zwykła i ulepszona jednostka dzielą pulę)
function weeklyGrowth(t, L, st) {
  const cid = factionOf(t.faction).dw['dw' + L][1], base = CREATURES[cid].growth, W = st && weekInfo(st);
  return Math.floor(base * ((hasB(t, 'castle') ? 2 : hasB(t, 'citadel') ? 1.5 : 1) + (hasB(t, 'grail') ? GRAIL_GROWTH : 0)) * (t.faction === 'stronghold' ? 1.25 : 1)) + (W && W.kind === 'creature' && W.cid === cid ? 5 : 0);
}
// Nowy tydzień: przyrost w siedliskach; w Miesiącu Zarazy zamiast przyrostu pula topnieje o połowę
function townGrowthWeek(t, st) {
  const plague = st && st.week === 1 && monthInfo(st).kind === 'plague';
  for (const L of dwellingLevels(t)) t.avail[L] = plague ? Math.floor((t.avail[L] || 0) / 2) : (t.avail[L] || 0) + weeklyGrowth(t, L, st);
}
// --- tygodnie i miesiące z efektem (jak w oryginale). Wynik zależy tylko od daty i ziarna, więc nie trafia do zapisu. ---
// Pierwszy tydzień gry jest spokojny. Potem: tydzień stworzenia (+5 przyrostu), Dobrobytu (złoto z miast +25%),
// Górników (kopalnie dają podwójnie), Mędrców (doświadczenie +25%) albo spokojny tydzień z nazwą zwierzęcia.
const HARVEST = 5;
const WEEK_EFFECTS = {
  gold: { name: 'Dobrobytu', text: 'miasta dają o 25% więcej złota' },
  mines: { name: 'Górników', text: 'kopalnie wydobywają podwójnie' },
  exp: { name: 'Mędrców', text: 'bohaterowie zdobywają o 25% więcej doświadczenia' },
  harvest: { name: 'Żniw', text: `każdy gracz dostaje ${HARVEST} drewna i ${HARVEST} rudy` },
  magic: { name: 'Magii', text: 'bohaterowie odzyskują całą manę' },
};
let WEEK_CREATURES = null; // podstawowe jednostki poziomów 1–6 wszystkich frakcji
function weekInfo(st) {
  const h = thash(st.week, st.month, st.seed), calm = { kind: 'calm', name: WEEK_NAMES[h % WEEK_NAMES.length], text: '' };
  if (st.week === 1 && st.month === 1) return calm;
  const r = (h >>> 8) % 100;
  if (r < 35) {
    WEEK_CREATURES = WEEK_CREATURES || FACTIONS.flatMap(F => [1, 2, 3, 4, 5, 6].map(L => F.dw['dw' + L][1]));
    const cid = WEEK_CREATURES[(h >>> 4) % WEEK_CREATURES.length], g = CREATURES[cid].gen;
    return { kind: 'creature', cid, name: g[0].toUpperCase() + g.slice(1), text: `przyrost: ${CREATURES[cid].plural.toLowerCase()} +5` };
  }
  const kind = r < 47 ? 'gold' : r < 57 ? 'mines' : r < 67 ? 'exp' : r < 75 ? 'harvest' : r < 82 ? 'magic' : null;
  return kind ? { kind, ...WEEK_EFFECTS[kind] } : calm;
}
const weekKind = (st, k) => weekInfo(st).kind === k;
// Miesiąc (od drugiego): Zaraza (pule siedlisk −50% zamiast przyrostu) albo Potworów (potwory na mapie +50%)
function monthInfo(st) {
  if (st.month < 2) return { kind: 'calm', name: '', text: '' };
  const r = thash(st.month, 7717, st.seed) % 100;
  return r < 15 ? { kind: 'plague', name: 'Zarazy', text: 'zaraza: w siedliskach zostaje połowa jednostek, bez przyrostu' }
    : r < 40 ? { kind: 'monsters', name: 'Potworów', text: 'potworów na mapie jest o połowę więcej' } : { kind: 'calm', name: '', text: '' };
}
// Wieści na nowy tydzień (i miesiąc) oraz jednorazowe skutki miesiąca
function startWeek(st, newMonth) {
  const M = newMonth ? monthInfo(st) : null, W = weekInfo(st);
  for (const o of st.objects) if (o.type === 'monster' && !o.dead) { // potwory rosną co tydzień (do MONSTER_GROW_MAX razy), Miesiąc Potworów dokłada połowę
    o.base = o.base || o.count; o.count = Math.min(Math.ceil(o.count * (1 + MONSTER_GROW)), Math.ceil(o.base * MONSTER_GROW_MAX));
    if (M && M.kind === 'monsters') o.count = Math.ceil(o.count * 1.5);
  }
  for (const t of st.towns) townGrowthWeek(t, st);
  weeklyTreasury(st);
  if (W.kind === 'harvest') for (const p of st.players) { p.resources.wood += HARVEST; p.resources.ore += HARVEST; }
  if (W.kind === 'magic') for (const h of st.heroes) h.mana = Math.max(h.mana, heroMaxMana(h));
  const S = seasonOf(st), head = newMonth ? `Nadchodzi ${S.name.toLowerCase()}: ${S.text}. ` + (M.name ? `Nastał Miesiąc ${M.name}: ${M.text}. ` : 'Rozpoczyna się nowy miesiąc. ') : '';
  return `${head}Nastał Tydzień ${W.name}${W.text ? `: ${W.text}` : ''}.${M && M.kind === 'plague' ? '' : ' W siedliskach pojawiły się nowe jednostki.'}`;
}
const unitCost = cid => CREATURES[cid].cost || { gold: CREATURES[cid].value };
const costText = c => Object.entries(c).filter(([, v]) => v).map(([k, v]) => `${v} ${k === 'gold' ? 'złota' : resName(k).toLowerCase()}`).join(', ');
function maxAffordable(st, cost, owner = ME) {
  const R = playerOf(st, owner).resources; let m = Infinity;
  for (const r of RESOURCES) if (cost[r.id]) m = Math.min(m, Math.floor(R[r.id] / cost[r.id]));
  return m === Infinity ? 0 : m;
}
const heroInTown = (st, t) => st.heroes.find(h => h.x === t.x && h.y === t.y && h.owner === t.owner && h.garrison == null) || null; // w bramie
// Garnizon z bohaterem (jak w Heroes 3): bohater w murach dowodzi wojskiem garnizonu, brama zostaje wolna (np. na najem w tawernie)
const garrisonHero = (st, t) => st.heroes.find(h => h.garrison === t.id) || null;
const townHero = (st, t) => garrisonHero(st, t) || heroInTown(st, t); // kto broni miasta
// Zamiana miejsc: bohater z bramy wchodzi do garnizonu (wojsko garnizonu przechodzi do jego armii), bohater z garnizonu wychodzi do bramy.
// Zwraca tekst błędu albo null.
function swapGarrison(st, t) {
  const g = garrisonHero(st, t), v = heroInTown(st, t);
  if (!g && !v) return 'W mieście nie ma bohatera';
  if (v) { const from = t.garrison.map(s => s && { ...s }); armyTransfer(from, v.army.map(s => s && { ...s }));
    if (from.some(Boolean)) return 'Wojsko garnizonu nie zmieści się w armii bohatera: połącz albo przenieś oddziały';
    armyTransfer(t.garrison, v.army); }
  if (g) g.garrison = null;
  if (v) { v.garrison = t.id; v.path = null; v.dest = null; }
  return null;
}
// Werbunek do garnizonu; gdy garnizon pełny, do armii bohatera stojącego w mieście. Zwraca błąd albo null.
function recruit(st, t, L, cid, n) {
  if (n <= 0) return 'Wybierz liczbę jednostek';
  if (n > (t.avail[L] || 0)) return 'Tylu jednostek nie ma w siedlisku';
  const cost = unitCost(cid); if (n > maxAffordable(st, cost, t.owner)) return 'Brakuje zasobów';
  const g = garrisonHero(st, t), h = heroInTown(st, t), dest = g && armyHasRoom(g.army, cid) ? g.army : armyHasRoom(t.garrison, cid) ? t.garrison : (h && armyHasRoom(h.army, cid) ? h.army : null);
  if (!dest) return 'Brak miejsca w garnizonie';
  const R = playerOf(st, t.owner).resources; for (const r of RESOURCES) if (cost[r.id]) R[r.id] -= cost[r.id] * n;
  armyAdd(dest, cid, n); t.avail[L] -= n; return null;
}
// Szybki werbunek (jak „Kup wszystko” w Heroes 3): od najwyższego poziomu w dół kupuje najlepszą formę stwora z siedliska,
// ile jest dostępnych, na ile starczy zasobów i miejsca. Zwraca { n: liczba stworów, text: podsumowanie }.
function recruitAll(st, t) {
  const F = factionOf(t.faction), got = [];
  for (const L of [...DW_LEVELS].reverse()) {
    if (!hasB(t, 'dw' + L) || !(t.avail[L] > 0)) continue;
    const cid = F.dw[dwTop(t, L)][1], n = Math.min(t.avail[L], maxAffordable(st, unitCost(cid), t.owner));
    if (n > 0 && !recruit(st, t, L, cid, n)) got.push(`${CREATURES[cid].plural.toLowerCase()} ${n}`);
  }
  const n = got.reduce((s, g) => s + +g.split(' ').pop(), 0);
  return { n, text: got.length ? `Zwerbowano: ${got.join(', ')}` : 'Nie ma kogo zwerbować (brak stworów, zasobów albo miejsca)' };
}
// Przesunięcie między dwoma miejscami (garnizon ↔ bohater): pusty cel = przeniesienie, ten sam typ = połączenie,
// inny typ = zamiana. Bohater musi zachować co najmniej jeden oddział. Zwraca błąd albo null.
function armyMove(fromA, i, toA, j, heroArmies = []) {
  const s = fromA[i], d = toA[j]; if (!s || (fromA === toA && i === j)) return null;
  const leaves = !d || d.cid === s.cid; // miejsce źródłowe się opróżni
  if (leaves && fromA !== toA && heroArmies.includes(fromA) && armyStacks(fromA).length === 1) return 'Bohater musi mieć co najmniej jeden oddział';
  if (!d) { toA[j] = s; fromA[i] = null; } else if (d.cid === s.cid) { d.n += s.n; fromA[i] = null; } else { toA[j] = s; fromA[i] = d; }
  return null;
}
// Szybkie przekazanie: wszystkie oddziały z fromA do toA (łączą się z takimi samymi albo trafiają na wolne miejsca).
// keepOne: armia bohatera zatrzymuje jednego stwora z najsłabszego oddziału. Zwraca liczbę przeniesionych stworów.
function giveArmy(fromA, toA, keepOne) {
  const idx = fromA.map((s, i) => (s ? i : -1)).filter(i => i >= 0); if (!idx.length) return 0;
  const keep = keepOne ? idx.reduce((a, b) => (CREATURES[fromA[b].cid].value < CREATURES[fromA[a].cid].value ? b : a)) : -1; let moved = 0;
  for (const i of idx) {
    const s = fromA[i], n = s.n - (i === keep ? 1 : 0); if (n <= 0) continue;
    const j = toA.findIndex(d => d && d.cid === s.cid), k = j >= 0 ? j : toA.findIndex(d => !d); if (k < 0) continue; // brak miejsca: zostaje
    if (toA[k]) toA[k].n += n; else toA[k] = { cid: s.cid, n };
    if (n === s.n) fromA[i] = null; else s.n -= n; moved += n;
  }
  return moved;
}
// Podział oddziału: n jednostek z fromA[i] na wolne miejsce albo do takiego samego oddziału toA[j].
// Wszystkie jednostki = zwykłe przeniesienie (armyMove). Zwraca błąd albo null.
function splitLimit(fromA, i, toA, j, heroArmies = []) {
  const s = fromA[i], d = toA[j]; if (!s) return { err: 'Wybierz oddział' };
  if (fromA === toA && i === j) return { err: 'Wskaż inne miejsce, do którego trafi część oddziału' };
  if (d && d.cid !== s.cid) return { err: 'Część oddziału można przenieść tylko na wolne miejsce albo do takiego samego oddziału' };
  const keep = (fromA === toA || (heroArmies.includes(fromA) && armyStacks(fromA).length === 1)) ? 1 : 0; // bohater zatrzymuje choć jedną jednostkę
  const max = s.n - keep; return max < 1 ? { err: 'Oddziału z jednej jednostki nie da się podzielić' } : { max };
}
function armySplit(fromA, i, toA, j, n, heroArmies = []) {
  const L = splitLimit(fromA, i, toA, j, heroArmies); if (L.err) return L.err;
  n = clamp(Math.floor(n), 1, L.max); const s = fromA[i];
  if (n >= s.n) return armyMove(fromA, i, toA, j, heroArmies);
  s.n -= n; if (toA[j]) toA[j].n += n; else toA[j] = { cid: s.cid, n };
  return null;
}
// Dzienny dochód gracza { wood, ..., gold }: kopalnie + miasta. Jedno źródło dla końca dnia, panelu i okna królestwa.
function dailyIncomeAll(st, owner = ME) {
  const inc = Object.fromEntries(RESOURCES.map(r => [r.id, 0]));
  for (const ob of st.objects) if (ob.type === 'mine' && !ob.dead && ob.owner === owner) inc[ob.kind] += MINES[ob.kind].income * (weekKind(st, 'mines') ? 2 : 1);
  const autumn = seasonIdx(st) === 2;
  for (const t of st.towns) if (t.owner === owner) {
    inc.gold += Math.round(townGold(t) * (weekKind(st, 'gold') ? 1.25 : 1)); if (hasB(t, 'silo')) { inc.wood += 1; inc.ore += 1; }
    if (autumn) { inc.wood += 1; inc.ore += 1; } if (t.faction === 'inferno') inc.sulfur += 1; // jesienne zbiory, cecha Inferna
  }
  for (const h of st.heroes) if (h.owner === owner) { inc.gold += heroBonus(h, 'gold') + skillVal(h, 'estates'); const sp = heroSpec(h); if (sp && sp.res) inc[sp.res] += sp.n; // specjalność: surowiec
    for (const id of Object.values(h.equip || {})) if (id && ARTIFACTS[id].bonus.res) for (const [r, n] of Object.entries(ARTIFACTS[id].bonus.res)) inc[r] += n; } // relikwia kupiecka
  return inc;
}
const dailyIncome = (st, res) => dailyIncomeAll(st)[res];
function collectIncome(st) {
  for (const p of st.players) { if (p.out) continue; const inc = dailyIncomeAll(st, p.id); for (const r of RESOURCES) p.resources[r.id] += inc[r.id]; if (!p.human) p.resources.gold += aiGoldBonus(st); }
}
const hasB = (t, id) => t.built.includes(id);
const canAfford = (st, cost, owner = ME) => RESOURCES.every(r => (playerOf(st, owner).resources[r.id] || 0) >= (cost[r.id] || 0));
const reqMet = (t, B) => B.req.every(r => hasB(t, r));
function townGold(t) { let g = 0; for (const id of ['hall1', 'hall2', 'hall3', 'hall4']) if (hasB(t, id)) g = BUILD_BY_ID[id].gold; return g + (hasB(t, 'grail') ? GRAIL_GOLD : 0); }
function availableBuildings(t, st = G.state) { return BUILDINGS.filter(B => !B.grail && bAllowed(t, B) && !hasB(t, B.id) && reqMet(t, B) && (B.id !== 'shipyard' || (st && townCoastal(st, t)))); }
// Wymagania jak w Heroes 3: wszystkie brakujące budowle na drodze do B (także pośrednie), w kolejności, w jakiej trzeba je stawiać
function missingReqs(t, B, seen = new Set()) {
  const out = [];
  for (const r of B.req) { if (hasB(t, r) || seen.has(r)) continue; seen.add(r); out.push(...missingReqs(t, BUILD_BY_ID[r], seen), r); }
  return out;
}
// Budowle, które B bezpośrednio odblokowuje (jeszcze niepostawione)
const unlocksOf = (t, B) => BUILDINGS.filter(X => !X.grail && bAllowed(t, X) && !hasB(t, X.id) && X.req.includes(B.id));
// Lista budowania: najpierw dostępne, potem zablokowane (najbliższe odblokowania najpierw)
function buildList(t, st = G.state) {
  const ok = availableBuildings(t, st).map(B => ({ B, locked: false }));
  const lk = BUILDINGS.filter(B => !B.grail && bAllowed(t, B) && !hasB(t, B.id) && !reqMet(t, B) && (B.id !== 'shipyard' || (st && townCoastal(st, t))))
    .map(B => ({ B, locked: true, miss: missingReqs(t, B) })).sort((a, b) => a.miss.length - b.miss.length);
  return [...ok, ...lk];
}
const reqNames = (ids, fac) => ids.map(id => bInfo(BUILD_BY_ID[id], fac).name).join(', ');
// Następna budowla do postawienia na miejscu (działka w scenie); budowli Graala nie da się kupić, więc nie ma działki
const slotNext = (t, slot) => BUILDINGS.find(B => B.slot === slot && !B.grail && bAllowed(t, B) && !hasB(t, B.id));
function slotBuilding(t, slot) { let best = null; for (const B of BUILDINGS) if (B.slot === slot && hasB(t, B.id)) best = B; return best; }
function buildIn(st, t, B) {
  const R = playerOf(st, t.owner).resources;
  for (const r of RESOURCES) if (B.cost[r.id]) R[r.id] -= B.cost[r.id];
  t.built.push(B.id); t.builtToday = true;
  const gm = /^guild(\d)$/.exec(B.id); if (gm) rollGuildLevel(st, t, +gm[1]);
  if (B.id === 'special' && t.faction === 'academy') for (let L = 1; L <= guildLevel(t); L++) rollGuildLevel(st, t, L); // Biblioteka: czar więcej na każdym poziomie
  const m = /^dw(\d)$/.exec(B.id); if (m) t.avail[+m[1]] = (t.avail[+m[1]] || 0) + weeklyGrowth(t, +m[1], st); // nowe siedlisko od razu daje przyrost
}
// --- karawany (jak w HotA): oddziały z garnizonu jadą bez bohatera do innego własnego miasta; CARAVAN_SPEED pól dziennie ---
// Po dotarciu dołączają do garnizonu (albo armii bohatera, który nim dowodzi). Gdy miasto celu przepadło, karawana zawraca;
// gdy nie ma już dokąd wrócić, przepada. Brak miejsca w garnizonie: czeka do następnego dnia.
const CARAVAN_MP = 1200; // punktów ruchu dziennie (bohater bez premii ma ~1500)
// Droga karawany: po lądzie jak bohater (teren i drogi), bez zatrzymywania się na obiektach; bez drogi lądem — prosto (statkiem)
function caravanRoute(st, a, b) {
  const map = st.map, n = map.n, p = findPath(n, a.x, a.y, b.x, b.y, (j, i) => (map.terrain[j] !== TER.WATER && !map.obst[j]) || j === b.y * n + b.x ? baseCost(map, i, j, null) : Infinity, 50);
  if (!p) return { route: null, cost: Math.hypot(a.x - b.x, a.y - b.y) * 100 };
  let cost = 0; for (let k = 1; k < p.length; k++) cost += baseCost(map, p[k - 1], p[k], null) * (p[k] % n !== p[k - 1] % n && ((p[k] / n) | 0) !== ((p[k - 1] / n) | 0) ? 1.414 : 1);
  return { route: p, cost };
}
const caravanDays = (a, b, st = G.state) => Math.max(1, Math.ceil(caravanRoute(st, a, b).cost / CARAVAN_MP));
const caravanSrc = (st, t) => { const gh = garrisonHero(st, t); return gh ? gh.army : t.garrison; };
function sendCaravan(st, from, to, slots) {
  if (!to || to === from || to.owner !== from.owner) return 'Wybierz inne własne miasto';
  const src = caravanSrc(st, from), pick = [...new Set(slots)].filter(i => src[i]);
  if (!pick.length) return 'Wybierz oddziały do wysłania';
  if (garrisonHero(st, from) && armyStacks(src).length <= pick.length) return 'Bohater w garnizonie musi zatrzymać co najmniej jeden oddział';
  const army = pick.map(i => ({ ...src[i] })); for (const i of pick) src[i] = null;
  const R = caravanRoute(st, from, to), days = Math.max(1, Math.ceil(R.cost / CARAVAN_MP)); st.caravans = st.caravans || [];
  st.caravans.push({ owner: from.owner, from: from.id, to: to.id, army, start: st.dayTotal, arrive: st.dayTotal + days, route: R.route });
  return null;
}
// Dołącz oddziały do armii (ten sam stwór albo wolne miejsce); zwraca to, co się nie zmieściło
function mergeInto(dst, army) {
  const left = [];
  for (const s of army) { const i = dst.findIndex(x => x && x.cid === s.cid), j = i >= 0 ? i : dst.findIndex(x => !x); if (j < 0) { left.push(s); continue; } if (dst[j]) dst[j].n += s.n; else dst[j] = { ...s }; }
  return left;
}
function caravanArrivals(st) {
  for (const c of [...(st.caravans || [])]) {
    if (c.arrive > st.dayTotal) continue;
    const to = st.towns[c.to], from = st.towns[c.from], drop = () => { st.caravans = st.caravans.filter(x => x !== c); };
    if (to.owner !== c.owner) {
      if (from.owner === c.owner && c.from !== c.to) { tell(st, c.owner, `Miasto ${to.name} przepadło: karawana zawraca do miasta ${from.name}.`); const R = caravanRoute(st, to, from); Object.assign(c, { to: from.id, from: to.id, start: st.dayTotal, arrive: st.dayTotal + Math.max(1, Math.ceil(R.cost / CARAVAN_MP)), route: R.route }); }
      else { tell(st, c.owner, 'Karawana nie ma dokąd wrócić i rozprasza się.'); drop(); }
      continue;
    }
    c.army = mergeInto(caravanSrc(st, to), c.army);
    if (c.army.length) { c.arrive = st.dayTotal + 1; tell(st, c.owner, `Karawana czeka pod miastem ${to.name}: w garnizonie brak miejsca.`); }
    else { drop(); tell(st, c.owner, `Karawana dotarła do miasta ${to.name}.`); }
  }
}
// Pozycja karawany na mapie: punkt drogi wg upływu dni (bez drogi lądem: na prostej między miastami)
function caravanPos(st, c) {
  const a = st.towns[c.from], b = st.towns[c.to], f = clamp((st.dayTotal - c.start) / Math.max(1, c.arrive - c.start), 0, 1), n = st.map.n;
  if (c.route && c.route.length > 1) { const i = c.route[Math.min(c.route.length - 1, Math.max(1, Math.round(f * (c.route.length - 1))))]; return [i % n, (i / n) | 0]; }
  return [Math.round(a.x + (b.x - a.x) * f), Math.round(a.y + (b.y - a.y) * f)];
}
// --- budowle specjalne frakcji (FACTION_SPECIAL) ---------------------------------------------
const STABLE_MP = 400;
// Bohater w mieście z budowlą specjalną: stajnie, wir many, klatka wodzów, sala Walhalli. Zwraca opis albo null.
function specialVisit(st, t, h) {
  if (!h || !hasB(t, 'special')) return null;
  const wk = weekIndex(st), S = FACTION_SPECIAL[t.faction]; h.specVisits = h.specVisits || [];
  if (t.faction === 'haven' && h.stableWeek !== wk) { h.stableWeek = wk; h.mp += STABLE_MP; return `${S.name}: ${h.name} dostaje świeże konie (+${STABLE_MP} ruchu do końca tygodnia).`; }
  if (t.faction === 'dungeon' && t.vortexWeek !== wk) { t.vortexWeek = wk; h.mana = Math.max(h.mana, heroMaxMana(h) * 2); return `${S.name}: mana bohatera ${h.name} podwojona (${h.mana}).`; }
  const stat = { fortress: ['def', 'obrony'], stronghold: ['att', 'ataku'] }[t.faction];
  if (stat && !h.specVisits.includes(t.id)) { h.specVisits.push(t.id); h.stats[stat[0]]++; return `${S.name}: ${h.name} zyskuje +1 do ${stat[1]} (teraz ${h.stats[stat[0]]}).`; }
  return null;
}
// Skarbiec krasnoludów (Knieja): na początku tygodnia 10% złota właściciela, najwyżej 2500 za skarbiec
function weeklyTreasury(st) {
  for (const t of st.towns) if (t.faction === 'sylvan' && hasB(t, 'special') && t.owner >= 0) {
    const R = playerOf(st, t.owner).resources, add = Math.min(2500, Math.floor(R.gold * 0.1)); R.gold += add;
    if (add) tell(st, t.owner, `Skarbiec krasnoludów w mieście ${t.name} przynosi ${add} złota.`);
  }
}
const necroAmplifiers = (st, owner) => st.towns.filter(t => t.owner === owner && t.faction === 'barrow' && hasB(t, 'special')).length;
// Brama piekieł (Inferno): miasta, do których bohater z miasta t może przejść (własne, z bramą, bez innego bohatera)
const gateTargets = (st, t) => hasB(t, 'special') && t.faction === 'inferno' ? st.towns.filter(o => o !== t && o.owner === t.owner && o.faction === 'inferno' && hasB(o, 'special') && !heroInTown(st, o)) : [];
function gateTravel(st, t, h, dest) {
  if (!gateTargets(st, t).includes(dest) || heroInTown(st, t) !== h) return 'Brama nie prowadzi do tego miasta';
  h.x = dest.x; h.y = dest.y; if (h.owner === ME) reveal(st, h.x, h.y, heroSight(h)); rebuildObjIndex(st); return null;
}
// --- rynek: handel surowcami ---------------------------------------------------------------
// Wartość surowca w złocie; kupno drożeje, a sprzedaż tanieje, im mniej rynków ma gracz (jak w oryginale).
const RES_VALUE = { wood: 250, ore: 250, mercury: 500, sulfur: 500, crystal: 500, gems: 500, gold: 1 };
const marketCount = (st, owner) => st.towns.filter(t => t.owner === owner && hasB(t, 'market')).length;
const MARKET_BUY = [0, 1, 0.85, 0.75, 0.65], MARKET_SELL = [0, 0.2, 0.3, 0.4, 0.5];
// Najmniejsza transakcja: oddajesz give sztuk `from`, dostajesz get sztuk `to` (null bez rynku albo dla tej samej rzeczy)
function marketLot(st, owner, from, to) {
  const m = Math.min(4, marketCount(st, owner)); if (!m || from === to) return null;
  const val = from === 'gold' ? 1 : RES_VALUE[from] * MARKET_SELL[m], cost = to === 'gold' ? 1 : RES_VALUE[to] * MARKET_BUY[m], r = cost / val;
  return r >= 1 ? { give: Math.ceil(r - 1e-9), get: 1 } : { give: 1, get: Math.floor(1 / r + 1e-9) };
}
// Ile transakcji stać gracza
const marketMax = (st, owner, from, to) => { const L = marketLot(st, owner, from, to); return L ? Math.floor(playerOf(st, owner).resources[from] / L.give) : 0; };
// Wymiana `lots` transakcji. Zwraca błąd albo null.
function trade(st, owner, from, to, lots) {
  const L = marketLot(st, owner, from, to); if (!L) return 'Brak rynku';
  if (!(lots > 0)) return 'Wybierz ilość';
  if (lots > marketMax(st, owner, from, to)) return 'Brakuje surowców na tę wymianę';
  const R = playerOf(st, owner).resources; R[from] -= L.give * lots; R[to] += L.get * lots; return null;
}
// --- tawerna: najem bohaterów ---------------------------------------------------------------
const HERO_COST = 2500, MAX_HEROES = 8; // MAX_HEROES: górna granica zasady „limit bohaterów” (heroLimit)
const weekIndex = st => Math.floor((st.dayTotal - 1) / 7);
// Oferta tawerny gracza na bieżący tydzień (wspólna dla wszystkich jego miast): dwóch chętnych,
// pierwszy z frakcji gracza, drugi z innej. Imiona nie powtarzają się z bohaterami na mapie.
// Tawerna: dwaj kandydaci tygodnia (z pełną armią startową); po najęciu na miejsce wchodzi nowy, ale już z jednym stworem (weak).
// Pula to bohaterowie frakcji i ci, którzy odeszli z mapy (st.retired): uciekinier od razu u swojego gracza, pokonani po tygodniu u wszystkich.
function tavernOffer(st, owner) {
  const p = playerOf(st, owner), wk = weekIndex(st), ret = st.retired || [];
  if (!p.tavern || p.tavern.week !== wk) p.tavern = { week: wk, hired: 0, offers: [null, null] };
  // oferta nieaktualna: tego bohatera najął w międzyczasie ktoś inny (np. drugi gracz z tej samej puli)
  p.tavern.offers = p.tavern.offers.map(o => (o && (st.heroes.some(h => h.name === o.name) || (o.retired && !ret.some(r => r.hero.name === o.name))) ? null : o));
  const tv = p.tavern, open = r => r.from <= st.dayTotal && (r.owner === owner || r.owner < 0), card = (r, weak) => ({ name: r.hero.name, cls: r.hero.cls, female: !!r.hero.female, fac: heroFaction(r.hero) || p.faction, retired: true, weak, level: r.hero.level });
  const mine = ret.find(r => r.owner === owner && open(r) && !tv.offers.some(o => o && o.name === r.hero.name));
  if (mine) tv.offers[1] = card(mine, true); // uciekinier czeka od razu (zastępuje drugiego kandydata)
  const taken = new Set([...st.heroes.map(h => h.name), ...tv.offers.filter(Boolean).map(o => o.name), ...ret.map(r => r.hero.name)]);
  const r = mulberry32(st.seed ^ (wk * 7717) ^ (owner * 131) ^ (tv.hired * 977));
  tv.offers.forEach((o, k) => {
    if (o) return;
    const facs = FACTIONS.map(f => f.id).filter(f => (k === 0) === (f === p.faction));
    const pool = [...facs.flatMap(fac => factionOf(fac).heroes.map(([name, cls, female]) => ({ name, cls, female: !!female, fac }))).filter(c => !taken.has(c.name)),
      ...ret.filter(q => q.owner < 0 && open(q) && facs.includes(heroFaction(q.hero)) && !tv.offers.some(x => x && x.name === q.hero.name)).map(q => card(q, true))];
    if (pool.length) { tv.offers[k] = { ...pool[Math.floor(r() * pool.length)] }; if (tv.hired > 0) tv.offers[k].weak = true; taken.add(tv.offers[k].name); }
  });
  return tv.offers;
}
// Bohater z tawerny: nowy (createHero) albo powracający z st.retired (z poziomem i umiejętnościami, bez armii)
function tavernHero(st, owner, x, y, o) {
  if (!o.retired) return createHero(st, owner, x, y, o);
  const i = (st.retired || []).findIndex(r => r.hero.name === o.name), h = { ...st.retired[i].hero };
  st.retired.splice(i, 1); h.id = st.heroes.reduce((m, q) => Math.max(m, q.id + 1), 0); h.owner = owner; h.x = x; h.y = y;
  h.army = weakArmy(heroFaction(h) || playerOf(st, owner).faction); h.mp = heroMaxMP(h); h.mana = heroMaxMana(h); st.heroes.push(h); return h;
}
function hireHero(st, t, k) {
  const owner = t.owner, P = playerOf(st, owner), o = tavernOffer(st, owner)[k];
  if (!hasB(t, 'tavern')) return { error: 'W mieście nie ma tawerny' };
  if (st.heroes.filter(h => h.owner === owner).length >= heroLimit(st)) return { error: `Możesz mieć najwyżej ${heroLimit(st)} ${heroLimit(st) === 1 ? 'bohatera' : 'bohaterów'} (limit tej gry)` };
  if (heroAt(st, t.x, t.y)) return { error: 'Brama miasta jest zajęta: najpierw wyprowadź bohatera' };
  if (!o) return { error: 'Nikt więcej nie czeka w tawernie' };
  if (P.resources.gold < HERO_COST) return { error: `Najem kosztuje ${HERO_COST} złota` };
  P.resources.gold -= HERO_COST; P.tavern.offers[k] = null; P.tavern.hired++;
  const h = tavernHero(st, owner, t.x, t.y, o); reveal(st, h.x, h.y, heroSight(h), owner);
  return { hero: h };
}

// Kuźnia: machina wojenna dla bohatera stojącego w mieście (każdej najwyżej jedna). Zwraca błąd albo null.
function buyMachine(st, t, h, id) {
  if (!hasB(t, 'smith')) return 'Brak kuźni';
  if (!h || (heroInTown(st, t) !== h && garrisonHero(st, t) !== h)) return 'Bohater musi stać w mieście';
  if (h.machines.includes(id)) return 'Bohater ma już tę machinę';
  const cost = CREATURES[id].cost; if (!canAfford(st, cost, h.owner)) return 'Brakuje złota';
  const R = playerOf(st, h.owner).resources; for (const r of RESOURCES) if (cost[r.id]) R[r.id] -= cost[r.id];
  h.machines.push(id); return null;
}
// --- miejsca na mapie (SITES) ---
// Znacznik odwiedzin: dla kogo (bohater, gracz albo cały świat) i do kiedy nagroda jest wykorzystana
function siteStamp(st, ob, h) {
  const u = SITES[ob.kind].use, wk = weekIndex(st);
  return u === 'hero' ? [h.id, 1] : u === 'day' ? [h.id, st.dayTotal] : u === 'heroWeek' ? [h.id, wk] : u === 'week' ? ['all', wk] : u === 'free' ? ['free', -1] : u === 'once' ? ['all', 1] : ['p' + h.owner, 1];
}
// --- nowe miejsca: siedlisko, więzienie, portal, wrak, ołtarz ofiarny ---
// Siedlisko: przyrost co tydzień (zapas najwyżej na DWELL_WEEKS tygodni)
function dwellRefresh(st, ob) { const wk = weekIndex(st), g = CREATURES[ob.cid].growth; if (ob.week !== wk) { ob.avail = Math.min(g * DWELL_WEEKS, (ob.avail || 0) + g * Math.max(1, wk - (ob.week || 0))); ob.week = wk; } }
// Ilu stworów z siedliska gracza stać (wszystkie surowce kosztu)
function dwellMax(st, h, ob) { dwellRefresh(st, ob); const R = playerOf(st, h.owner).resources, c = CREATURES[ob.cid].cost; return Object.entries(c).reduce((m, [r, v]) => Math.min(m, Math.floor(R[r] / v)), ob.avail); }
function dwellHire(st, h, ob, k) {
  if (k <= 0) return 'Nikogo nie zwerbowano'; if (!armyAdd(h.army, ob.cid, k)) return 'W armii nie ma miejsca na nowy oddział';
  const R = playerOf(st, h.owner).resources; for (const [r, v] of Object.entries(CREATURES[ob.cid].cost)) R[r] -= v * k; ob.avail -= k; return null;
}
// Więzienie: uwolniony bohater (losowy, z doświadczeniem) staje obok. Zwraca nowego bohatera albo tekst przeszkody.
function freePrisoner(st, h, ob) {
  if (st.heroes.filter(o => o.owner === h.owner).length >= heroLimit(st)) return `Więzień nie ma dokąd pójść: masz już ${heroLimit(st)} ${heroLimit(st) === 1 ? 'bohatera' : 'bohaterów'} (limit tej gry).`;
  const n = st.map.n, spot = DX8.map((dx, d) => [ob.x + dx, ob.y + DY8[d]]).find(([x, y]) => passableTile(st, x, y) && !objectAt(st, y * n + x) && !heroAt(st, x, y) && !st.guard[y * n + x]);
  if (!spot) return 'Przy więzieniu nie ma wolnego miejsca dla uwolnionego.';
  const taken = new Set(st.heroes.map(o => o.name)), pool = FACTIONS.flatMap(F => F.heroes.map(([name, cls, female]) => ({ name, cls, female: !!female, fac: F.id }))).filter(c => !taken.has(c.name));
  if (!pool.length) return 'W celi nikogo już nie ma.';
  const r = mulberry32(st.seed ^ (ob.id * 7919)), P = pool[Math.floor(r() * pool.length)], p = createHero(st, h.owner, spot[0], spot[1], P);
  gainExp(st, p, expForLevel(4 + Math.floor(r() * 4)), null, true); p.mp = 0; reveal(st, p.x, p.y, heroSight(p), p.owner); return p;
}
// --- Graal i obeliski ---
const obelisksTotal = st => st.objects.filter(o => o.type === 'site' && o.kind === 'obelisk' && !o.dead).length;
const obelisksSeen = (st, pid) => st.objects.filter(o => o.type === 'site' && o.kind === 'obelisk' && !o.dead && (o.seen || {})['p' + pid] === 1).length;
const hasGrail = h => !!h && (h.bag || []).includes('grail');
// Ile kawałków mapy zagadki widzi gracz (wszystkie, gdy odwiedził każdy obelisk)
function puzzlePieces(st, pid) { const N = obelisksTotal(st), k = obelisksSeen(st, pid), all = PUZZLE_COLS * PUZZLE_ROWS; return N ? (k >= N ? all : Math.floor(all * k / N)) : 0; }
// Kopanie na polu bohatera (jak w Heroes 3: tylko z pełnymi punktami ruchu, zużywa wszystkie). Zwraca { error } albo { found }.
function digGrail(st, h) {
  const n = st.map.n, i = h.y * n + h.x, t = st.map.terrain[i];
  if (h.boat || t === TER.WATER) return { error: 'Nie da się kopać na wodzie' };
  if (h.mp < heroMaxMP(h)) return { error: 'Kopać można tylko na początku dnia, z pełnymi punktami ruchu' };
  if (objectAt(st, i)) return { error: 'Tu nie da się kopać: pole zajmuje obiekt' };
  if ((st.holes || []).includes(i)) return { error: 'Tu już ktoś kopał' };
  h.mp = 0; (st.holes = st.holes || []).push(i); MapRender.miniDirty = true;
  const G2 = st.grail; if (G2 && G2.found < 0 && G2.x === h.x && G2.y === h.y) { G2.found = h.owner; giveArtifact(h, 'grail'); return { found: true }; }
  return { found: false };
}
// Bohater z Graalem w swoim mieście: Graal zostaje wbudowany (jedna budowla Graala na miasto). Zwraca true, gdy powstała.
function buildGrail(st, t, h) {
  if (!hasGrail(h) || t.owner !== h.owner || hasB(t, 'grail')) return false;
  h.bag.splice(h.bag.indexOf('grail'), 1); t.built.push('grail'); return true;
}
const siteUsed = (st, ob, h) => { const [k, v] = siteStamp(st, ob, h); return (ob.seen || {})[k] === v; };
// Skutek odwiedzin (człowiek i SI). Zwraca { text, float?, res?, exp? }; doświadczenie dolicza wołający (okno awansu).
function useSite(st, h, ob) {
  const S = SITES[ob.kind], R = playerOf(st, h.owner).resources;
  if (siteUsed(st, ob, h)) return { text: { hero: `${h.name} już tu był${h.female ? 'a' : ''}.`, day: 'Dziś już stąd korzystano. Wróć jutro.', heroWeek: 'W tym tygodniu już stąd korzystano.', week: 'W tym tygodniu plon już zebrano. Wróć w następnym.', player: 'Okolica jest już odsłonięta.' }[S.use] };
  const [k, v] = siteStamp(st, ob, h); const mark = () => { ob.seen = ob.seen || {}; ob.seen[k] = v; };
  switch (ob.kind) {
    case 'shrine': {
      const sp = SPELLS[ob.spell]; if (h.spells.includes(ob.spell)) { mark(); return { text: `Kapliczka uczy czaru „${sp.name}”, który ${h.name} już zna.` }; }
      if (!hasBook(h)) return { text: `Kapliczka uczy czaru „${sp.name}”, ale ${h.name} nie ma księgi czarów. Kupisz ją w mieście z gildią magów (${SPELLBOOK_COST} złota).` };
      if (sp.level > spellCap(h)) return { text: `Kapliczka uczy czaru „${sp.name}” (poziom ${sp.level}), ale ${h.name} go nie pojmuje: potrzebna Mądrość (${SKILL_LEVELS[sp.level - 2]}).` };
      mark(); h.spells.push(ob.spell); return { text: `${h.name} poznaje czar „${sp.name}” (poziom ${sp.level}): ${sp.desc(heroStat(h, 'sp'))}.` };
    }
    case 'well': {
      const max = heroMaxMana(h); if (h.mana >= max) return { text: 'Woda jest orzeźwiająca, ale mana bohatera jest już pełna.' };
      mark(); h.mana = max; return { text: `Mana bohatera wraca do pełna (${max}).`, float: `mana ${max}` };
    }
    case 'windmill': { const a = 3 + thash(ob.id, weekIndex(st), st.seed) % 4; mark(); R[ob.res] += a; return { text: `Młynarz oddaje tygodniowy plon: ${a} (${resName(ob.res).toLowerCase()}).`, float: `+${a}`, res: ob.res }; }
    case 'waterMill': mark(); R.gold += 1000; return { text: 'Młynarz oddaje tygodniowy utarg: 1000 złota.', float: '+1000', res: 'gold' };
    case 'stone': mark(); return { text: `Runy na kamieniu dzielą się pradawną wiedzą: +${SITE_EXP} doświadczenia.`, float: `+${SITE_EXP} dośw.`, exp: SITE_EXP };
    case 'temple': case 'fountain': {
      const key = ob.kind === 'temple' ? 'morale' : 'luck'; mark(); h.boost = { ...(h.boost || {}), [key]: 1 };
      return { text: ob.kind === 'temple' ? 'Modlitwa dodaje wojsku ducha: +1 do morale do końca następnej bitwy.' : 'Moneta wrzucona do fontanny przynosi szczęście: +1 do końca następnej bitwy.' };
    }
    case 'stables': mark(); h.mp += SITE_MP; return { text: `Świeże konie: +${SITE_MP} punktów ruchu na dziś.` };
    case 'lookout': mark(); reveal(st, ob.x, ob.y, LOOKOUT_R, h.owner); MapRender.miniDirty = true; return { text: `Z wieży widać okolicę w promieniu ${LOOKOUT_R} pól.` };
    case 'witchHut': {
      const sk = ob.skill, nm = SKILLS[sk].name; if (heroSkill(h, sk)) { mark(); return { text: `Wiedźma uczy umiejętności ${nm}, którą ${h.name} już zna.` }; }
      if (h.skills.length >= MAX_SKILLS) return { text: `Wiedźma uczy umiejętności ${nm}, ale ${h.name} nie ma już miejsca na nowe umiejętności.` };
      mark(); learnSkill(h, sk); return { text: `Wiedźma uczy: ${skillText(sk, 1)}.`, float: nm };
    }
    case 'prison': { const p = freePrisoner(st, h, ob); if (typeof p === 'string') return { text: p }; removeObject(st, ob);
      return { text: `${h.name} otwiera celę. ${heroTitle(p)} (poziom ${p.level}) wychodzi na wolność i przyłącza się do twojej sprawy.`, freed: p }; }
    case 'gate': case 'portal': {
      const to = st.objects[ob.pair], gate = ob.kind === 'gate'; if (!to || to.dead) return { text: 'Portal gaśnie: jego drugi koniec zniknął.' };
      if (gate && heroAt(st, to.x, to.y)) return { text: 'Wyjście z bramy zajmuje inny bohater. Spróbuj później.' };
      if (gate) { h.x = to.x; h.y = to.y; h.path = null; h.dest = null; h.prev = null; reveal(st, h.x, h.y, heroSight(h), h.owner); MapRender.miniDirty = true;
        if (h.owner === ME && G.state === st) centerCam(st, h.x, h.y); return { text: levelOf(st.map, h.x, h.y) ? 'Armia schodzi kamiennymi schodami w mrok podziemi.' : 'Armia wychodzi z podziemi na światło dnia.' }; }
      if (heroAt(st, to.x, to.y)) return { text: 'Drugi koniec portalu zajmuje inny bohater. Spróbuj później.' };
      h.x = to.x; h.y = to.y; h.path = null; h.dest = null; h.prev = null; reveal(st, h.x, h.y, heroSight(h), h.owner); MapRender.miniDirty = true;
      if (h.owner === ME && G.state === st) centerCam(st, h.x, h.y); return { text: 'Wir światła porywa armię i wyrzuca ją w drugim portalu, daleko stąd.' };
    }
    case 'dwelling': { // SI werbuje, ile może (człowiek wybiera w oknie: visitObject)
      const k = dwellMax(st, h, ob), err = k > 0 ? dwellHire(st, h, ob, k) : 'pusto'; const c = CREATURES[ob.cid];
      return { text: err ? `${c.plural}: nikogo nie zwerbowano.` : `Do armii dołączają: ${c.plural.toLowerCase()} (${k}).` };
    }
    case 'sacrifice': {
      const arts = h.bag.filter(id => id !== 'grail' && SACRIFICE_EXP[ARTIFACTS[id].rarity]), exp = arts.reduce((s, id) => s + SACRIFICE_EXP[ARTIFACTS[id].rarity], 0);
      if (!arts.length) return { text: 'Na ołtarzu można złożyć artefakty z plecaka, ale plecak jest pusty.' };
      h.bag = h.bag.filter(id => !arts.includes(id)); return { text: `${h.name} składa w ofierze: ${arts.map(id => ARTIFACTS[id].name).join(', ')}. +${exp} doświadczenia.`, float: `+${exp} dośw.`, exp };
    }
    case 'wreck': {
      const r = mulberry32(st.seed ^ (ob.id * 131)), gold = 1500 + Math.floor(r() * 4) * 500, pool = ARTS_BY_RARITY(r() < 0.3 ? 'minor' : 'treasure'), art = r() < 0.5 ? pool[Math.floor(r() * pool.length)] : null;
      removeObject(st, ob); R.gold += gold; if (art) giveArtifact(h, art);
      return { text: `Z wraku udaje się wyłowić ${gold} złota${art ? ` i artefakt: ${ARTIFACTS[art].name}` : ''}.`, float: `+${gold}`, res: 'gold' };
    }
    case 'obelisk': { mark(); const k = obelisksSeen(st, h.owner), N = obelisksTotal(st);
      return { puzzle: true, text: k >= N ? 'Ostatni obelisk! Mapa zagadki jest kompletna: krzyżyk wskazuje, gdzie zakopano Graala.' : `Runy na obelisku odsłaniają kolejny fragment mapy zagadki (${k} z ${N}).` }; }
  }
  if (S.stat) { mark(); h.stats[S.stat]++; const P = PRIMARY.find(p => p.id === S.stat); if (S.stat === 'kn') h.mana = Math.min(heroMaxMana(h), h.mana + 10); return { text: `${h.name}: ${P.name.toLowerCase()} +1 (teraz ${h.stats[S.stat]}).`, float: `${P.name} +1` }; }
  return { text: '' };
}
// Opis miejsca w dymku: co daje i czy wybrany bohater już z niego skorzystał
function siteInfo(st, ob, h) {
  const S = SITES[ob.kind];
  if (ob.kind === 'dwelling') dwellRefresh(st, ob);
  const what = ob.kind === 'shrine' ? `uczy czaru „${SPELLS[ob.spell].name}” (poziom ${SPELLS[ob.spell].level})` : ob.kind === 'windmill' ? `co tydzień 3–6 jednostek surowca (${resName(ob.res).toLowerCase()}) dla pierwszego gościa`
    : ob.kind === 'witchHut' ? `uczy umiejętności ${skillText(ob.skill, 1)}` : ob.kind === 'dwelling' ? `${CREATURES[ob.cid].plural.toLowerCase()} do werbunku: ${ob.avail} (po ${costText(CREATURES[ob.cid].cost)}), co tydzień przybywa ${CREATURES[ob.cid].growth}`
    : ob.kind === 'portal' && st.objects[ob.pair] ? `${S.desc} (pole ${st.objects[ob.pair].x}, ${st.objects[ob.pair].y})` : ob.kind === 'gate' ? `${S.desc}: ${levelOf(st.map, ob.x, ob.y) ? 'wyjście na powierzchnię' : 'zejście do podziemi'}` : S.desc;
  const used = h && siteUsed(st, ob, h) ? { hero: ' Ten bohater już tu był.', day: ' Dziś już wykorzystane.', heroWeek: ' W tym tygodniu już wykorzystane.', week: ' Plon z tego tygodnia już zebrany.', player: ' Już odwiedzone.' }[S.use] : '';
  return `${S.name}: ${what}.${used}${st.guard[ob.y * st.map.n + ob.x] ? ' Pilnuje go potwór.' : ''}`;
}
