// ==================== ZASADY GRY ========================================================
// Ruch, odkrywanie mapy, obiekty, potyczki, dochód, budowanie.
// Dzienny limit ruchu zależy od najwolniejszej jednostki w armii (jak w oryginale)
function mpBySpeed(s) { return s <= 3 ? 1500 : s >= 11 ? 2000 : [1560, 1630, 1700, 1760, 1830, 1900, 1960][s - 4]; }
function heroMaxMP(h) { return Math.round(mpBySpeed(armySlowest(h.army)) * (1 + skillVal(h, 'logistics') / 100)) + heroBonus(h, 'mp'); }
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
function passableTile(st, x, y) {
  const map = st.map, n = map.n; if (x < 0 || y < 0 || x >= n || y >= n) return false;
  const i = y * n + x; return !!human(st).explored[i] && map.terrain[i] !== TER.WATER && !map.obst[i];
}
// Koszt kroku liczony wg terenu, z którego bohater wychodzi; droga działa, gdy oba pola mają drogę.
// Znajdowanie drogi (h) zmniejsza narzut trudnego terenu ponad 100.
function baseCost(map, i, j, h) {
  if (map.road[i] && map.road[j]) return ROADS[map.road[i]].cost;
  const c = TERRAINS[map.terrain[i]].cost, pf = h ? skillVal(h, 'pathfinding') : 0;
  return c > 100 && pf ? Math.round(100 + (c - 100) * (1 - pf / 100)) : c;
}
function stepCost(map, fx, fy, tx, ty, h) { const n = map.n, c = baseCost(map, fy * n + fx, ty * n + tx, h); return (fx !== tx && fy !== ty) ? Math.floor(c * 1.414) : c; }
function heroDrawPos(h) {
  if (!h.anim) return [h.x, h.y]; const k = clamp(h.anim.t / STEP_TIME, 0, 1);
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
function removeObject(st, ob) { ob.dead = true; rebuildObjIndex(st); }
// Obiekty i strefy strażników można tylko "odwiedzić" jako cel ścieżki, nie przejść przez nie.
// Inny bohater zajmuje pole: można na nie tylko wejść jako cel (wrogi bohater = bitwa).
function objBlocks(st, j, target, tg = 0) {
  if (j !== target && heroAt(st, j % st.map.n, (j / st.map.n) | 0)) return true;
  const ob = objectAt(st, j);
  if (ob) { if ((ob.type === 'mine' || ob.type === 'town') && j !== ob.y * st.map.n + ob.x) return true; if (j !== target) return true; }
  return !!(st.guard[j] && j !== target && st.guard[j] !== tg);
}
function computePath(st, h, tx, ty) {
  if (!passableTile(st, tx, ty)) return null; const map = st.map, n = map.n, t = ty * n + tx;
  if (objBlocks(st, t, t)) return null;
  const tob = objectAt(st, t), tg = tob && tob.type === 'monster' ? tob.id + 1 : 0;
  const p = findPath(n, h.x, h.y, tx, ty, (j, i) => (passableTile(st, j % n, (j / n) | 0) && !objBlocks(st, j, t, tg)) ? baseCost(map, i, j, h) : Infinity, 50);
  return p && p.length > 1 ? p.slice(1).map(i => [i % n, (i / n) | 0]) : null;
}
function heroCanStillMove(st, h) {
  if (!armySize(h.army)) return false;
  const n = st.map.n;
  for (let d = 0; d < 8; d++) { const x = h.x + DX8[d], y = h.y + DY8[d], j = y * n + x; if (passableTile(st, x, y) && !objBlocks(st, j, j) && !heroAt(st, x, y) && stepCost(st.map, h.x, h.y, x, y, h) <= h.mp) return true; }
  return false;
}
function heroStep(st, h) {
  if (!h.path || !h.path.length || h.stop) { h.moving = false; h.stop = false; return false; }
  const n = st.map.n, [nx, ny] = h.path[0], ni = ny * n + nx, ob = objectAt(st, ni);
  const halt = () => { h.moving = false; h.path = null; h.dest = null; };
  if (ob && ob.type === 'monster') { halt(); h.prev = null; startEncounter(st, h, ob); return false; }
  const other = heroAt(st, nx, ny); // bohater w bramie miasta broni się razem z miastem (startTownAssault)
  if (other && !(ob && ob.type === 'town')) { halt(); if (other.owner !== h.owner) { h.prev = null; startHeroEncounter(st, h, other); } return false; }
  const cost = stepCost(st.map, h.x, h.y, nx, ny, h); if (h.mp < cost) { h.moving = false; return false; }
  h.mp -= cost; h.path.shift(); if (nx !== h.x) h.dir = nx > h.x ? 1 : -1;
  h.prev = [h.x, h.y]; h.anim = { fx: h.x, fy: h.y, t: 0 }; h.x = nx; h.y = ny; reveal(st, h.x, h.y, heroSight(h)); if (h.owner === ME) Sound.play('step');
  if (!h.path.length) { h.path = null; h.dest = null; }
  if (st.guard[ni]) { const m = st.objects[st.guard[ni] - 1]; halt(); h.pending = () => startEncounter(st, h, m); }
  else if (ob) { halt(); h.pending = () => visitObject(st, h, ob); }
  return true;
}
function advFloat(text, x, y, res) { const s = G.screens.adventure; if (s.floats) s.floats.push({ text, x, y, res, t: G.time }); Sound.play(res === 'gold' ? 'coin' : 'pickup'); }
function visitObject(st, h, ob) {
  const R = playerOf(st, h.owner).resources;
  if (ob.type === 'res') { R[ob.res] += ob.amount; advFloat(`+${ob.amount}`, h.x, h.y, ob.res); removeObject(st, ob); }
  else if (ob.type === 'chest') {
    removeObject(st, ob);
    showDialog('Znajdujesz skrzynię ze skarbem. Możesz zatrzymać złoto albo rozdać je chłopom w zamian za doświadczenie.', [
      { label: `${ob.gold} złota`, key: 'enter', action: () => { R.gold += ob.gold; advFloat(`+${ob.gold}`, h.x, h.y, 'gold'); } },
      { label: `${ob.exp} dośw.`, action: () => { advFloat(`+${ob.exp} dośw.`, h.x, h.y); gainExp(st, h, ob.exp); } },
    ], { locked: true, iconH: 56, icon: (ctx, cx, cy) => drawSprite(ctx, chestSprite(), cx, cy + 4, 2) });
  } else if (ob.type === 'art') {
    removeObject(st, ob); Sound.play('treasure'); const on = giveArtifact(h, ob.art); h.mp = Math.min(h.mp + (on ? ARTIFACTS[ob.art].bonus.mp || 0 : 0), heroMaxMP(h));
    showDialog(`Znajdujesz artefakt: ${artInfo(ob.art)} ${on ? `${h.name} od razu go zakłada.` : 'Trafia do plecaka: załóż go na ekranie bohatera.'}`, [{ label: 'OK', key: 'enter' }],
      { iconH: 70, icon: (ctx, cx, cy) => drawSprite(ctx, artSprite(ob.art), cx, cy, 2) });
  } else if (ob.type === 'site') {
    const r = useSite(st, h, ob), S = SITES[ob.kind];
    if (r.float) advFloat(r.float, h.x, h.y, r.res);
    showDialog(`${S.name}. ${r.text}`, [{ label: 'OK', key: 'enter', action: () => { if (r.exp) gainExp(st, h, r.exp); } }],
      { iconH: 76, icon: (ctx, cx, cy) => drawSprite(ctx, siteSprite(ob.kind), cx, cy + 30, 1.5) });
  } else if (ob.type === 'town') {
    if (ob.owner === h.owner) G.go('town', { townId: ob.townId }); else startTownAssault(st, h, st.towns[ob.townId]);
  } else if (ob.type === 'mine') {
    const M = MINES[ob.kind];
    if (ob.owner === h.owner) { G.screens.adventure.flash(`${M.name} już należy do ciebie`); return; }
    ob.owner = h.owner; MapRender.miniDirty = true;
    showDialog(`${M.name} należy teraz do ciebie. Dochód dzienny: ${M.income} (${resName(ob.kind).toLowerCase()}).`, [{ label: 'OK', key: 'enter' }],
      { iconH: 66, icon: (ctx, cx, cy) => { drawSprite(ctx, mineSprite(ob.kind), cx - 33, cy - 31, 1); drawSprite(ctx, flagSprite(ownerColor(st, ob.owner), 12, 7), cx + 23, cy - 33, 1); } });
  }
}
function startEncounter(st, h, m) {
  if (m.dead) return; const c = CREATURES[m.cid];
  // h.prev jest puste, gdy bohater sam wszedł na potwora; ustawione, gdy wszedł w strefę strażnika
  const who = h.prev ? `${qtyName(m.count)} ${c.gen} atakuje twojego bohatera!` : `${h.name} atakuje: ${qtyName(m.count).toLowerCase()} ${c.gen}.`;
  offerBattle(st, h, m, who, m.count * c.value, (ctx, cx, cy) => drawSprite(ctx, creatureSprite(m.cid, 1), cx, cy + 34, 2));
}
function startHeroEncounter(st, h, foe) {
  offerBattle(st, h, foe, `${h.name} atakuje: ${heroTitle(foe)} (${ownerName(st, foe.owner)}).`, Math.round(armyPower(foe.army) * heroFactor(foe)),
    (ctx, cx, cy) => drawHeroPortrait(ctx, cx - 36, cy - 36, foe, ownerColor(st, foe.owner), 2));
}
// Siła obrońców miasta: garnizon, bohater w mieście (z premią za cechy) i mury
function townPower(st, t) {
  const hh = heroInTown(st, t), wall = 1 + 0.05 * TOWN_WALL_DEF[townLevel(t)];
  return Math.round((armyPower(t.garrison) + (hh ? armyPower(hh.army) * heroFactor(hh) : 0)) * wall);
}
// Wejście do obcego miasta: puste zajmujemy od razu, bronione trzeba zdobyć w bitwie
function startTownAssault(st, h, t) {
  if (t.owner === h.owner) return;
  const hh = heroInTown(st, t), walls = ['', ' Miasto otaczają mury Fortu.', ' Miasto otaczają mury Cytadeli.', ' Miasto otaczają mury Zamku.'][townLevel(t)];
  if (!armySize(t.garrison) && !hh) {
    captureTown(st, t, h.owner); rebuildObjIndex(st);
    showDialog(`Miasto ${t.name} nie ma obrońców. ${h.name} zajmuje je bez walki.`, [{ label: 'Wejdź do miasta', key: 'enter', action: () => G.go('town', { townId: t.id }) }]);
    return;
  }
  const who = `${t.name} (${t.owner < 0 ? 'miasto niezależne' : `miasto: ${ownerName(st, t.owner)}`}) ${hh ? `ma w murach bohatera: ${heroTitle(hh)}` : 'broni się garnizonem'}.${walls}`;
  offerBattle(st, h, t, who, townPower(st, t), (ctx, cx, cy) => drawSpriteBox(ctx, townIconSprite(t.faction, townLevel(t), ownerColor(st, t.owner)), cx - 40, cy - 40, 2));
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
  if (!h.bag) h.bag = [];
  if (!h.level) h.level = 1;
  if (!h.spells) h.spells = [...(CLASS_SPELLS[h.cls] || [])];
  if (!h.skills) h.skills = (CLASS_SKILLS[h.cls] || []).map(([id, lv]) => ({ id, lv }));
  if (!h.machines) h.machines = [];
  if (h.mana == null) h.mana = heroMaxMana(h);
}
// --- umiejętności drugorzędne ---
const heroSkill = (h, id) => { const s = h && h.skills && h.skills.find(s => s.id === id); return s ? s.lv : 0; };
const skillVal = (h, id) => { const L = heroSkill(h, id); return L ? SKILLS[id].v[L - 1] : 0; };
const skillText = (id, L) => `${SKILLS[id].name} (${SKILL_LEVELS[L]}): ${SKILLS[id].desc(SKILLS[id].v[L - 1])}`;
// Propozycja przy awansie na poziom L (jak w oryginale): ulepszenie znanej umiejętności i nowa umiejętność;
// gdy którejś grupy brak, obie z drugiej. Losowanie powtarzalne (ziarno gry, bohater, poziom).
function skillOffer(st, h, L) {
  const up = (h.skills || []).filter(s => s.lv < 3).map(s => s.id);
  const fresh = (h.skills || []).length < MAX_SKILLS ? Object.keys(SKILLS).filter(id => !heroSkill(h, id) && (id !== 'necromancy' || NECRO_CLASSES.includes(h.cls))) : [];
  const r = mulberry32(thash(h.id, L, st.seed) ^ 0x5a1d), pick = a => (a.length ? a.splice(Math.floor(r() * a.length), 1)[0] : null);
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
const heroSight = h => h.sight + heroBonus(h, 'sight') + skillVal(h, 'scouting');
// Premia bohatera do siły armii w potyczce: +5% za każdy punkt ataku i obrony
const heroFactor = h => 1 + 0.05 * (heroStat(h, 'att') + heroStat(h, 'def'));
// Doświadczenie z awansami. Wzrost cechy losowany deterministycznie (ziarno gry, bohater, poziom).
// Każdy awans daje też wybór umiejętności: SI wybiera od razu, człowiek w oknie (po kolei, gdy awansów jest kilka).
// then(): co zrobić po zamknięciu okien awansu (np. obejrzeć obiekt, na którym stoi bohater)
function gainExp(st, h, amount, then) {
  h.exp += Math.round(amount * (1 + skillVal(h, 'learning') / 100 + (weekKind(st, 'exp') ? 0.25 : 0))); const ups = [];
  while (h.exp >= expForLevel(h.level + 1)) {
    h.level++; const g = (CLASS_GROWTH[h.cls] || CLASS_GROWTH.knight).grow, r = thash(h.id, h.level, st.seed) % 100;
    let acc = 0, k = 0; for (; k < 3; k++) { acc += g[k]; if (r < acc) break; }
    h.stats[PRIMARY[k].id]++; ups.push({ level: h.level, stat: PRIMARY[k] });
  }
  if (h.owner !== ME || !ups.length) {
    for (const u of ups) { const offer = skillOffer(st, h, u.level); if (offer.length) learnSkill(h, aiPickSkill(offer)); }
    if (then) then(); return ups.length;
  }
  const next = i => {
    if (i >= ups.length) { if (then) then(); return; }
    const u = ups[i], offer = skillOffer(st, h, u.level), icon = { iconH: 76, locked: offer.length > 0, icon: (ctx, cx, cy) => drawHeroPortrait(ctx, cx - 36, cy - 36, h, ownerColor(st, h.owner), 2) };
    const msg = `${h.name} osiąga poziom ${u.level}! +1 do ${u.stat.gen}.`; Sound.play('levelup');
    if (!offer.length) { showDialog(msg, [{ label: 'Wspaniale', key: 'enter', action: () => next(i + 1) }], icon); return; }
    showDialog(`${msg} Wybierz umiejętność:`, offer.map((id, k) => {
      const L = heroSkill(h, id) + 1;
      return { label: SKILLS[id].name, sub: SKILL_LEVELS[L], tip: skillText(id, L) + '.', key: String(k + 1), action: () => { learnSkill(h, id); next(i + 1); } };
    }), Object.assign(icon, { bw: 200 }));
  };
  next(0); return ups.length;
}
// Zakłada artefakt z plecaka (indeks) na pasujące miejsce: najpierw wolne, inaczej zamiana z pierwszym pasującym
function equipFromBag(h, bi) {
  const id = h.bag[bi]; if (!id) return 'Brak artefaktu';
  const slots = EQUIP_SLOTS.filter(s => s.kind === ARTIFACTS[id].kind), free = slots.find(s => !h.equip[s.id]) || slots[0];
  const old = h.equip[free.id]; h.equip[free.id] = id; h.bag.splice(bi, 1); if (old) h.bag.splice(bi, 0, old);
  return null;
}
function unequip(h, slotId) { const id = h.equip[slotId]; if (id) { h.equip[slotId] = null; h.bag.push(id); } }
// Nowy artefakt: na wolne pasujące miejsce albo do plecaka. Zwraca true, gdy został założony.
function giveArtifact(h, id) {
  const s = EQUIP_SLOTS.find(s => s.kind === ARTIFACTS[id].kind && !h.equip[s.id]);
  if (s) { h.equip[s.id] = id; return true; } h.bag.push(id); return false;
}

// --- czary: mana, nauka w gildii, czary na mapie -----------------------------------------------
const heroMaxMana = h => Math.floor(10 * heroStat(h, 'kn') * (1 + skillVal(h, 'intelligence') / 100));
const knows = (h, id) => (h.spells || []).includes(id);
// Czary gildii losowane raz, gdy powstaje dany poziom (deterministycznie z ziarna gry i miasta)
function rollGuildLevel(st, t, L) {
  const pool = Object.keys(SPELLS).filter(id => SPELLS[id].level === L), r = mulberry32(st.seed ^ (t.id * 7777) ^ (L * 131));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  if (!t.guild) t.guild = {}; t.guild[L] = pool.slice(0, GUILD_OFFER[L] || 1);
}
const guildLevel = t => { for (let L = GUILD_MAX; L > 0; L--) if (hasB(t, 'guild' + L)) return L; return 0; };
// Bohater w mieście z gildią: poznaje jej czary i odzyskuje całą manę. Zwraca nowo poznane czary.
function visitGuild(st, t, h) {
  const L = guildLevel(t); if (!L) return [];
  const learned = [];
  for (let k = 1; k <= L; k++) for (const id of (t.guild && t.guild[k]) || []) if (!knows(h, id)) { h.spells.push(id); learned.push(id); }
  h.mana = Math.max(h.mana, heroMaxMana(h)); return learned;
}
// Czary na mapie przygody. Zwraca tekst błędu albo null.
function castAdventure(st, h, id) {
  const S = SPELLS[id], sp = heroStat(h, 'sp');
  if (h.mana < S.cost) return 'Za mało many';
  if (id === 'eagleEye') { reveal(st, h.x, h.y, 5 + sp); }
  else if (id === 'townPortal') {
    if (h.mp < 300) return 'Za mało punktów ruchu (potrzeba 300)';
    const t = st.towns.filter(t => t.owner === h.owner && !heroAt(st, t.x, t.y)).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    if (!t) return 'Brak wolnego własnego miasta';
    h.x = t.x; h.y = t.y; h.mp -= 300; h.path = null; h.dest = null; reveal(st, h.x, h.y, heroSight(h)); centerCam(st, h.x, h.y);
  }
  h.mana -= S.cost; return null;
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
function startingArmy(fac, r) {
  const F = factionOf(fac), a = emptyArmy();
  a[0] = { cid: F.dw.dw1[1], n: 14 + Math.floor(r() * 11) };
  a[1] = { cid: F.dw.dw2[1], n: 5 + Math.floor(r() * 5) };
  return a;
}
// --- rekrutacja: każdy poziom siedliska ma wspólną pulę dla jednostki zwykłej i ulepszonej ---
const DW_LEVELS = [1, 2, 3, 4, 5, 6, 7];
const dwellingLevels = t => DW_LEVELS.filter(L => hasB(t, 'dw' + L));
function dwellingUnits(t, L) {
  const F = factionOf(t.faction), u = [F.dw['dw' + L][1]];
  if (hasB(t, 'dw' + L + 'u')) u.push(F.dw['dw' + L + 'u'][1]);
  return u;
}
// Przyrost tygodniowy: bazowy z jednostki, +50% z Cytadelą, +100% z Zamkiem (opisy w BUILDINGS)
// Tydzień stworzenia dodaje +5 do przyrostu jego siedliska (zwykła i ulepszona jednostka dzielą pulę)
function weeklyGrowth(t, L, st) {
  const cid = factionOf(t.faction).dw['dw' + L][1], base = CREATURES[cid].growth, W = st && weekInfo(st);
  return Math.floor(base * (hasB(t, 'castle') ? 2 : hasB(t, 'citadel') ? 1.5 : 1)) + (W && W.kind === 'creature' && W.cid === cid ? 5 : 0);
}
// Nowy tydzień: przyrost w siedliskach; w Miesiącu Zarazy zamiast przyrostu pula topnieje o połowę
function townGrowthWeek(t, st) {
  const plague = st && st.week === 1 && monthInfo(st).kind === 'plague';
  for (const L of dwellingLevels(t)) t.avail[L] = plague ? Math.floor((t.avail[L] || 0) / 2) : (t.avail[L] || 0) + weeklyGrowth(t, L, st);
}
// --- tygodnie i miesiące z efektem (jak w oryginale). Wynik zależy tylko od daty i ziarna, więc nie trafia do zapisu. ---
// Pierwszy tydzień gry jest spokojny. Potem: tydzień stworzenia (+5 przyrostu), Dobrobytu (złoto z miast +25%),
// Górników (kopalnie dają podwójnie), Mędrców (doświadczenie +25%) albo spokojny tydzień z nazwą zwierzęcia.
const WEEK_EFFECTS = {
  gold: { name: 'Dobrobytu', text: 'miasta dają o 25% więcej złota' },
  mines: { name: 'Górników', text: 'kopalnie wydobywają podwójnie' },
  exp: { name: 'Mędrców', text: 'bohaterowie zdobywają o 25% więcej doświadczenia' },
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
  const kind = r < 50 ? 'gold' : r < 62 ? 'mines' : r < 74 ? 'exp' : null;
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
  if (M && M.kind === 'monsters') for (const o of st.objects) if (o.type === 'monster' && !o.dead) o.count = Math.ceil(o.count * 1.5);
  for (const t of st.towns) townGrowthWeek(t, st);
  const head = newMonth ? (M.name ? `Nastał Miesiąc ${M.name}: ${M.text}. ` : 'Rozpoczyna się nowy miesiąc. ') : '';
  return `${head}Nastał Tydzień ${W.name}${W.text ? `: ${W.text}` : ''}.${M && M.kind === 'plague' ? '' : ' W siedliskach pojawiły się nowe jednostki.'}`;
}
const unitCost = cid => CREATURES[cid].cost || { gold: CREATURES[cid].value };
function maxAffordable(st, cost, owner = ME) {
  const R = playerOf(st, owner).resources; let m = Infinity;
  for (const r of RESOURCES) if (cost[r.id]) m = Math.min(m, Math.floor(R[r.id] / cost[r.id]));
  return m === Infinity ? 0 : m;
}
const heroInTown = (st, t) => st.heroes.find(h => h.x === t.x && h.y === t.y && h.owner === t.owner) || null;
// Werbunek do garnizonu; gdy garnizon pełny, do armii bohatera stojącego w mieście. Zwraca błąd albo null.
function recruit(st, t, L, cid, n) {
  if (n <= 0) return 'Wybierz liczbę jednostek';
  if (n > (t.avail[L] || 0)) return 'Tylu jednostek nie ma w siedlisku';
  const cost = unitCost(cid); if (n > maxAffordable(st, cost, t.owner)) return 'Brakuje zasobów';
  const h = heroInTown(st, t), dest = armyHasRoom(t.garrison, cid) ? t.garrison : (h && armyHasRoom(h.army, cid) ? h.army : null);
  if (!dest) return 'Brak miejsca w garnizonie';
  const R = playerOf(st, t.owner).resources; for (const r of RESOURCES) if (cost[r.id]) R[r.id] -= cost[r.id] * n;
  armyAdd(dest, cid, n); t.avail[L] -= n; return null;
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
// Dzienny dochód gracza { wood, ..., gold }: kopalnie + miasta. Jedno źródło dla końca dnia, panelu i okna królestwa.
function dailyIncomeAll(st, owner = ME) {
  const inc = Object.fromEntries(RESOURCES.map(r => [r.id, 0]));
  for (const ob of st.objects) if (ob.type === 'mine' && !ob.dead && ob.owner === owner) inc[ob.kind] += MINES[ob.kind].income * (weekKind(st, 'mines') ? 2 : 1);
  for (const t of st.towns) if (t.owner === owner) { inc.gold += Math.round(townGold(t) * (weekKind(st, 'gold') ? 1.25 : 1)); if (hasB(t, 'silo')) { inc.wood += 1; inc.ore += 1; } }
  for (const h of st.heroes) if (h.owner === owner) inc.gold += heroBonus(h, 'gold') + skillVal(h, 'estates');
  return inc;
}
const dailyIncome = (st, res) => dailyIncomeAll(st)[res];
function collectIncome(st) {
  for (const p of st.players) { if (p.out) continue; const inc = dailyIncomeAll(st, p.id); for (const r of RESOURCES) p.resources[r.id] += inc[r.id]; if (!p.human) p.resources.gold += aiGoldBonus(st); }
}
const hasB = (t, id) => t.built.includes(id);
const canAfford = (st, cost, owner = ME) => RESOURCES.every(r => (playerOf(st, owner).resources[r.id] || 0) >= (cost[r.id] || 0));
const reqMet = (t, B) => B.req.every(r => hasB(t, r));
function townGold(t) { let g = 0; for (const id of ['hall1', 'hall2', 'hall3', 'hall4']) if (hasB(t, id)) g = BUILD_BY_ID[id].gold; return g; }
function availableBuildings(t) { return BUILDINGS.filter(B => !hasB(t, B.id) && reqMet(t, B)); }
function slotBuilding(t, slot) { let best = null; for (const B of BUILDINGS) if (B.slot === slot && hasB(t, B.id)) best = B; return best; }
function buildIn(st, t, B) {
  const R = playerOf(st, t.owner).resources;
  for (const r of RESOURCES) if (B.cost[r.id]) R[r.id] -= B.cost[r.id];
  t.built.push(B.id); t.builtToday = true;
  const gm = /^guild(\d)$/.exec(B.id); if (gm) rollGuildLevel(st, t, +gm[1]);
  const m = /^dw(\d)$/.exec(B.id); if (m) t.avail[+m[1]] = (t.avail[+m[1]] || 0) + weeklyGrowth(t, +m[1], st); // nowe siedlisko od razu daje przyrost
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
const HERO_COST = 2500, MAX_HEROES = 8;
const weekIndex = st => Math.floor((st.dayTotal - 1) / 7);
// Oferta tawerny gracza na bieżący tydzień (wspólna dla wszystkich jego miast): dwóch chętnych,
// pierwszy z frakcji gracza, drugi z innej. Imiona nie powtarzają się z bohaterami na mapie.
function tavernOffer(st, owner) {
  const p = playerOf(st, owner), wk = weekIndex(st);
  if (!p.tavern || p.tavern.week !== wk) p.tavern = { week: wk, hired: 0, offers: [null, null] };
  const tv = p.tavern, taken = new Set([...st.heroes.map(h => h.name), ...tv.offers.filter(Boolean).map(o => o.name)]);
  const r = mulberry32(st.seed ^ (wk * 7717) ^ (owner * 131) ^ (tv.hired * 977));
  tv.offers.forEach((o, k) => {
    if (o) return;
    const facs = FACTIONS.map(f => f.id).filter(f => (k === 0) === (f === p.faction));
    const pool = facs.flatMap(fac => factionOf(fac).heroes.map(([name, cls, female]) => ({ name, cls, female: !!female, fac }))).filter(c => !taken.has(c.name));
    if (pool.length) { tv.offers[k] = pool[Math.floor(r() * pool.length)]; taken.add(tv.offers[k].name); }
  });
  return tv.offers;
}
// Najem k-tego chętnego w mieście t. Zwraca { hero } albo { error }.
function hireHero(st, t, k) {
  const owner = t.owner, P = playerOf(st, owner), o = tavernOffer(st, owner)[k];
  if (!hasB(t, 'tavern')) return { error: 'W mieście nie ma tawerny' };
  if (st.heroes.filter(h => h.owner === owner).length >= MAX_HEROES) return { error: `Możesz mieć najwyżej ${MAX_HEROES} bohaterów` };
  if (heroAt(st, t.x, t.y)) return { error: 'Brama miasta jest zajęta: najpierw wyprowadź bohatera' };
  if (!o) return { error: 'Nikt więcej nie czeka w tawernie' };
  if (P.resources.gold < HERO_COST) return { error: `Najem kosztuje ${HERO_COST} złota` };
  P.resources.gold -= HERO_COST; P.tavern.offers[k] = null; P.tavern.hired++;
  const h = createHero(st, owner, t.x, t.y, o); reveal(st, h.x, h.y, heroSight(h), owner);
  return { hero: h };
}

// Kuźnia: machina wojenna dla bohatera stojącego w mieście (każdej najwyżej jedna). Zwraca błąd albo null.
function buyMachine(st, t, h, id) {
  if (!hasB(t, 'smith')) return 'Brak kuźni';
  if (!h || !heroInTown(st, t) || heroInTown(st, t) !== h) return 'Bohater musi stać w mieście';
  if (h.machines.includes(id)) return 'Bohater ma już tę machinę';
  const cost = CREATURES[id].cost; if (!canAfford(st, cost, h.owner)) return 'Brakuje złota';
  const R = playerOf(st, h.owner).resources; for (const r of RESOURCES) if (cost[r.id]) R[r.id] -= cost[r.id];
  h.machines.push(id); return null;
}
// --- miejsca na mapie (SITES) ---
// Znacznik odwiedzin: dla kogo (bohater, gracz albo cały świat) i do kiedy nagroda jest wykorzystana
function siteStamp(st, ob, h) {
  const u = SITES[ob.kind].use, wk = weekIndex(st);
  return u === 'hero' ? [h.id, 1] : u === 'day' ? [h.id, st.dayTotal] : u === 'heroWeek' ? [h.id, wk] : u === 'week' ? ['all', wk] : ['p' + h.owner, 1];
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
  }
  if (S.stat) { mark(); h.stats[S.stat]++; const P = PRIMARY.find(p => p.id === S.stat); if (S.stat === 'kn') h.mana = Math.min(heroMaxMana(h), h.mana + 10); return { text: `${h.name}: ${P.name.toLowerCase()} +1 (teraz ${h.stats[S.stat]}).`, float: `${P.name} +1` }; }
  return { text: '' };
}
// Opis miejsca w dymku: co daje i czy wybrany bohater już z niego skorzystał
function siteInfo(st, ob, h) {
  const S = SITES[ob.kind];
  const what = ob.kind === 'shrine' ? `uczy czaru „${SPELLS[ob.spell].name}” (poziom ${SPELLS[ob.spell].level})` : ob.kind === 'windmill' ? `co tydzień 3–6 jednostek surowca (${resName(ob.res).toLowerCase()}) dla pierwszego gościa` : S.desc;
  const used = h && siteUsed(st, ob, h) ? { hero: ' Ten bohater już tu był.', day: ' Dziś już wykorzystane.', heroWeek: ' W tym tygodniu już wykorzystane.', week: ' Plon z tego tygodnia już zebrany.', player: ' Już odwiedzone.' }[S.use] : '';
  return `${S.name}: ${what}.${used}${st.guard[ob.y * st.map.n + ob.x] ? ' Pilnuje go potwór.' : ''}`;
}
