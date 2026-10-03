// Nowe czary: Rozproszenie, Oślepienie, Trucizna, Wampiryzm, Ściana ognia, Kradzież życia, Teleportacja, Święte światło, Klon, Wiatr w plecy.
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

// Bitwa z oddziałem gracza jako aktywnym (czar rzuca strona 0); u = miecznicy, e = pikinierzy wroga
const setup = `(() => { const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'); m.cid = 'pikeman'; m.count = 30;
  h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 20 }; h.army[1] = { cid: 'archer', n: 10 }; h.skills = []; h.talents = []; h.stats.sp = 3; h.mana = 500;
  h.spells = Object.keys(SPELLS); h.equip.misc1 = null; const B = createBattle(st, h, m); B.rng = () => 0.5; B.active = B.units.find(u => u.side === 0 && u.cid === 'swordsman');
  return { st, h, B, u: B.active, e: B.units.find(u => u.side === 1) }; })()`;

test('Oślepienie, Trucizna, Rozproszenie, Wampiryzm', async () => {
  await newGame(page);
  const r = await page.evaluate(setup => {
    const out = {};
    { const { B, e } = eval(setup); castBattle(B, 'blind', e.x, e.y); B.order = [e]; B.active = null; const nx = nextActive(B); out.blind = [!!e.buffs.blind, nx !== e, canRetal(B, e)]; applyDamage(e, 1); out.blindHit = !e.buffs.blind; }
    { const { B, e } = eval(setup); castBattle(B, 'poison', e.x, e.y); const hp0 = (e.n - 1) * CREATURES.pikeman.hp + e.hp; B.order = []; B.waitQ = []; B.active = null; nextActive(B);
      out.poison = [e.psn, hp0 - ((e.n - 1) * CREATURES.pikeman.hp + e.hp)]; B.active = B.units.find(u => u.side === 0); B.cast[0] = false; castBattle(B, 'dispel', e.x, e.y); out.dispel = [Object.keys(e.buffs).length, e.psn]; }
    { const { B, u, e } = eval(setup); u.n = 10; castBattle(B, 'vampirism', u.x, u.y); const n0 = u.n; strike(B, u, e, false); out.vamp = [!!u.buffs.vampiric, u.n > n0]; }
    return out;
  }, setup);
  assert.deepEqual(r.blind, [true, true, false]); assert.ok(r.blindHit, 'trafienie zdejmuje oślepienie');
  assert.equal(r.poison[0], 40); assert.equal(r.poison[1], 40, 'trucizna co rundę (10 + 10 × moc)');
  assert.deepEqual(r.dispel, [0, undefined]); assert.deepEqual(r.vamp, [true, true]);
});

test('Ściana ognia, Kradzież życia, Święte światło', async () => {
  await newGame(page);
  const r = await page.evaluate(setup => {
    const out = {};
    { const { B, e } = eval(setup); const hp = () => (e.n - 1) * CREATURES.pikeman.hp + e.hp, a = hp(); castBattle(B, 'fireWall', e.x, e.y); const b = hp();
      B.order = []; B.waitQ = []; B.active = null; nextActive(B); out.wall = [a - b, b - hp(), B.fire.length, spellArea('fireWall', 6, 5, B).length]; }
    { const { B, u, e } = eval(setup); u.n = 10; const n0 = u.n; castBattle(B, 'lifeSteal', e.x, e.y); out.steal = u.n - n0; }
    { const { B, u, e } = eval(setup); const own = (u.n - 1) * CREATURES.swordsman.hp + u.hp, hp0 = (e.n - 1) * CREATURES.pikeman.hp + e.hp; castBattle(B, 'holyLight', 0, 0);
      out.holy = [hp0 - ((e.n - 1) * CREATURES.pikeman.hp + e.hp), own - ((u.n - 1) * CREATURES.swordsman.hp + u.hp), holyMul(SPELLS.holyLight, { cid: 'skeleton' })]; }
    return out;
  }, setup);
  assert.equal(r.wall[0], 40, 'od razu 10 + 10 × moc'); assert.equal(r.wall[1], 20, 'co rundę połowa'); assert.equal(r.wall[3], 3);
  assert.ok(r.steal > 0, 'kradzież życia wskrzesza polegle');
  assert.equal(r.holy[0], 60); assert.equal(r.holy[1], 0, 'swoich nie rani'); assert.equal(r.holy[2], 2);
});

test('Klon i Teleportacja; klon nie wraca do armii', async () => {
  await newGame(page);
  const r = await page.evaluate(setup => {
    const out = {};
    { const { st, h, B, u, e } = eval(setup); castBattle(B, 'clone', u.x, u.y); const c = B.units.find(x => x.src === 'clone');
      out.clone = [!!c, c && c.n === u.n, c && c.side]; strike(B, e, c, false); out.cloneHit = c.dead; writeBackSide(B, 0); out.army = h.army.filter(Boolean).length; }
    { const { B, u } = eval(setup); const ok = teleportOk(B, u, 8, 2); castBattle(B, 'teleport', u.x, u.y, 8, 2); out.tele = [ok, u.x, u.y]; }
    return out;
  }, setup);
  assert.deepEqual(r.clone, [true, true, 0]); assert.ok(r.cloneHit, 'klon znika od trafienia'); assert.equal(r.army, 2);
  assert.deepEqual(r.tele, [true, 8, 2]);
});

test('Teleportacja w ekranie bitwy: oddział, potem miejsce', async () => {
  await newGame(page);
  await page.evaluate(() => { const st = G.state, h = hero(st), m = st.objects.find(o => o.type === 'monster'); m.cid = 'pikeman'; m.count = 5; h.spells = ['teleport']; h.mana = 100;
    setScreen('battle', { battle: createBattle(st, h, m) }); });
  await frames(page, 30);
  const r = await page.evaluate(() => { const S = G.screens.battle, B = S.B; if (!B) return 'brak bitwy';
    for (let i = 0; i < 400 && (S.phase !== 'input' || B.active.side !== 0); i++) S.update(0.1);
    const u = B.active, [ux, uy] = hexCenter(u.x, u.y); S.casting = 'teleport'; S.onPointerMove(ux, uy); S.onClick(ux, uy); const picked = !!S.tele;
    const tx = 7, ty = 1, [cx, cy] = hexCenter(tx, ty); S.onPointerMove(cx, cy); const pv = S.preview && S.preview.kind; S.onClick(cx, cy); return { picked, pv, at: [u.x, u.y] }; });
  assert.deepEqual(r, { picked: true, pv: 'cast', at: [7, 1] });
});

test('Wiatr w plecy raz dziennie; SI w walce używa nowych czarów bez błędów', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st); h.spells = ['tailwind']; h.mana = 100; h.stats.sp = 2; const mp = h.mp, a = castAdventure(st, h, 'tailwind'), mp1 = h.mp, b = castAdventure(st, h, 'tailwind');
    const res = []; for (let k = 0; k < 6; k++) { const m = st.objects.find(o => o.type === 'monster'); m.cid = 'pikeman'; m.count = 40; h.army = emptyArmy(); h.army[0] = { cid: 'swordsman', n: 25 }; h.army[1] = { cid: 'archer', n: 15 };
      h.spells = ['blind', 'poison', 'vampirism', 'fireWall', 'lifeSteal', 'holyLight', 'clone', 'dispel', 'teleport']; h.mana = 200; h.stats.sp = 2 + k;
      const B = simulateBattle(createBattle(st, h, m)); res.push(B.over); }
    return { a, gain: mp1 - mp, b, res };
  });
  assert.equal(r.a, null); assert.equal(r.gain, 600); assert.match(r.b, /już dziś/);
  assert.ok(r.res.every(x => x === 'win' || x === 'lose'), JSON.stringify(r.res));
});

test('Drzwi wymiarów (zasięg, wolne pole, dwa razy dziennie), Groza, Zamieć', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), n = st.map.n, out = {}; h.stats.sp = 2; h.mana = 200; h.mp = 2000; for (const p of st.players) p.explored.fill(1);
    const free = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!doorCheck(st, h, x, y)) free.push([x, y]);
    const far = (() => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (Math.max(Math.abs(x - h.x), Math.abs(y - h.y)) > 9 && passableTile(st, x, y)) return [x, y]; })();
    out.far = castAdventure(st, h, 'dimensionDoor', { x: far[0], y: far[1] });
    const [tx, ty] = free.find(([x, y]) => x !== h.x || y !== h.y); const mp0 = h.mp; out.go = castAdventure(st, h, 'dimensionDoor', { x: tx, y: ty }); out.at = [h.x === tx, h.y === ty, mp0 - h.mp];
    const [ux, uy] = free.find(([x, y]) => !doorCheck(st, h, x, y) && (x !== h.x || y !== h.y)); castAdventure(st, h, 'dimensionDoor', { x: ux, y: uy });
    const [vx, vy] = [h.x, h.y]; out.third = castAdventure(st, h, 'dimensionDoor', { x: vx, y: vy });
    // Groza: słabsze o połowę stado ucieka, nawet dzikie
    const m = { ...st.objects.find(o => o.type === 'monster'), cid: 'pikeman', count: 10, mood: 'savage' }; h.army = emptyArmy(); h.army[0] = { cid: 'pikeman', n: 30 }; h.skills = [];
    out.fear = [neutralReaction(st, h, m), (castAdventure(st, h, 'fear'), neutralReaction(st, h, m)), castAdventure(st, h, 'fear')];
    // Zamieć: obrażenia i spowolnienie każdego wroga
    const mm = st.objects.find(o => o.type === 'monster'); mm.cid = 'pikeman'; mm.count = 30; h.spells = ['blizzard']; h.mana = 100; const B = createBattle(st, h, mm); B.active = B.units.find(u => u.side === 0);
    castBattle(B, 'blizzard', 0, 0); const foes = B.units.filter(u => u.side === 1 && !u.dead); out.bliz = [foes.every(u => u.buffs.slow), foes.every(u => u.hp < CREATURES.pikeman.hp || u.n < u.n0), B.units.filter(u => u.side === 0).every(u => !u.buffs.slow)];
    return out;
  });
  assert.match(r.far, /Za daleko/); assert.equal(r.go, null); assert.deepEqual(r.at, [true, true, 300]); assert.match(r.third, /dwa razy dziennie/);
  assert.equal(r.fear[0], null); assert.deepEqual(r.fear[1], { kind: 'flee' }); assert.match(r.fear[2], /już dziś/);
  assert.deepEqual(r.bliz, [true, true, true]);
});
