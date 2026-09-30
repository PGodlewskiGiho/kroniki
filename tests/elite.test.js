// Trzeci stopień jednostek: elitarne siedliska (dwLx), wspólna pula werbunku, nowe zdolności. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); await newGame(page); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każda frakcja ma elitarne jednostki: wyraźnie silniejsze od ulepszonych, z nową zdolnością albo lepsze we wszystkim', async () => {
  const bad = await page.evaluate(() => {
    const out = [];
    for (const F of FACTIONS) for (let L = 1; L <= 7; L++) {
      const [bn, id] = F.dw['dw' + L + 'x'] || [], U = CREATURES[F.dw['dw' + L + 'u'][1]], X = CREATURES[id];
      if (!bn || !X) { out.push(`${F.id} ${L}: brak elitarnego siedliska`); continue; }
      if (X.faction !== F.id || X.level !== L || X.tier !== 3 || X.growth !== U.growth) out.push(`${id}: frakcja, poziom, stopień albo przyrost`);
      if (X.value < U.value * 1.25) out.push(`${id}: wartość ${X.value} za mała wobec ${U.value}`);
      for (const k of ['att', 'def', 'dmax', 'hp', 'spd']) if (X[k] <= U[k] && !(k === 'dmax' && X.dmin > U.dmin)) out.push(`${id}: ${k} nie rośnie`);
      if ((X.abil || []).some(a => !ABILITIES[a])) out.push(`${id}: nieznana zdolność`);
      if (!(X.abil || []).some(a => !(U.abil || []).includes(a))) out.push(`${id}: brak nowej zdolności`);
      if (NEUTRALS_BY_LEVEL[L].includes(id) || NEUTRALS_BY_LEVEL[L].includes(F.dw['dw' + L + 'u'][1])) out.push(`${id}: ulepszone nie trafiają na mapę`);
      const B = BUILD_BY_ID['dw' + L + 'x']; if (!B || !B.req.includes('dw' + L + 'u') || B.slot !== BUILD_BY_ID['dw' + L].slot) out.push(`dw${L}x: wymagania albo miejsce`);
    }
    return out;
  });
  assert.deepEqual(bad, []);
});

test('elitarne siedlisko: budowa po ulepszonym, wspólna pula, werbunek elity i szybki werbunek od najwyższego stopnia', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], F = factionOf(t.faction), R = human(st).resources;
    for (const k of Object.keys(R)) R[k] = 1e6;
    t.built = ['hall1', 'hall2', 'fort', 'dw1']; t.avail[1] = 30;
    const before = slotNext(t, BUILD_BY_ID.dw1.slot).id;
    t.built.push('dw1u'); const next = slotNext(t, BUILD_BY_ID.dw1.slot).id, canX = reqMet(t, BUILD_BY_ID.dw1x);
    buildIn(st, t, BUILD_BY_ID.dw1x);
    const units = dwellingUnits(t, 1), top = dwTop(t, 1), info = bInfo(BUILD_BY_ID.dw1x, t.faction);
    const scene = paintTownScene(document.createElement('canvas').getContext('2d'), t, '#c83030') ? 1 : 0;
    showRecruit(st, t, 1, () => {}); const btns = G.modal.buttons.filter(b => units.map(u => CREATURES[u].name).includes(b.label)).length; G.modal.draw(G.ctx); G.modal = null;
    t.garrison = emptyArmy(); const err = recruit(st, t, 1, units[2], 5), left = t.avail[1];
    const all = recruitAll(st, t);
    return { before, next, canX, units, want: [F.dw.dw1[1], F.dw.dw1u[1], F.dw.dw1x[1]], top, desc: info.desc, name: info.name, scene, btns, err, left, all: all.n, gar: t.garrison.filter(Boolean).map(s => s.cid) };
  });
  assert.equal(r.before, 'dw1u'); assert.equal(r.next, 'dw1x'); assert.ok(r.canX);
  assert.deepEqual(r.units, r.want); assert.equal(r.top, 'dw1x');
  assert.match(r.desc, /^Elitarne siedlisko/); assert.equal(r.scene, 1); assert.equal(r.btns, 3);
  assert.equal(r.err, null); assert.equal(r.left, 25); assert.equal(r.all, 25);
  assert.deepEqual(r.gar, [r.want[2]]);
});

test('Mistrzostwo, Przebicie i Cios śmiertelny działają w walce', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, B = { st, sides: [{ hero: null }, { hero: null }], rng: mulberry32(5), log: [], units: [] };
    const U = (cid, side) => ({ cid, n: 10, hp: CREATURES[cid].hp, side, x: side ? 6 : 5, y: 5, buffs: {}, dead: false });
    const dmg = (a, t, k = 60) => { let s = 0; for (let i = 0; i < k; i++) s += damageRoll(B, a, t, false); return s / k; };
    const abil = CREATURES.templar.abil, tank = U('primalBehemoth', 1);
    const tm = U('templar', 0), maxed = dmg(tm, tank); CREATURES.templar.abil = ['doubleStrike']; const plain = dmg(tm, tank); CREATURES.templar.abil = abil;
    const spread = new Set(Array.from({ length: 20 }, () => damageRoll(B, tm, tank, false))).size;
    const ra = U('ramAurochs', 0), pierce = dmg(ra, tank), ab2 = CREATURES.ramAurochs.abil; CREATURES.ramAurochs.abil = ['jousting']; const noPierce = dmg(ra, tank); CREATURES.ramAurochs.abil = ab2;
    let doubled = 0; const bies = U('bies', 0); for (let i = 0; i < 400; i++) { B.log = []; const t = U('primalBehemoth', 1); strike(B, bies, t, false); if (B.log.some(l => /Cios śmiertelny/.test(l))) doubled++; }
    return { maxed, plain, spread, pierce, noPierce, doubled };
  });
  assert.ok(r.maxed > r.plain * 1.1, `mistrzostwo ${r.maxed} > ${r.plain}`); assert.equal(r.spread, 1);
  assert.ok(r.pierce > r.noPierce * 1.2, `przebicie ${r.pierce} > ${r.noPierce}`);
  assert.ok(r.doubled > 50 && r.doubled < 120, `cios śmiertelny ${r.doubled}/400`);
});

test('komputer werbuje najwyższy stopień, na który go stać', async () => {
  await newGame(page, { opponents: 1 });
  const r = await page.evaluate(() => {
    const st = G.state, p = st.players.find(p => !p.human), t = st.towns.find(t => t.owner === p.id), F = factionOf(t.faction);
    t.built = ['hall1', 'fort', 'dw1', 'dw1u', 'dw1x']; t.builtToday = true; t.avail = { 1: 20 }; t.garrison = emptyArmy();
    for (const k of Object.keys(p.resources)) p.resources[k] = 0; p.resources.gold = unitCost(F.dw.dw1x[1]).gold * 20;
    for (const h of st.heroes.filter(h => h.x === t.x && h.y === t.y)) h.x = h.x + 3;
    aiManageTown(st, p, t); const rich = t.garrison.filter(Boolean).map(s => [s.cid, s.n]);
    t.avail = { 1: 20 }; t.garrison = emptyArmy(); p.resources.gold = unitCost(F.dw.dw1u[1]).gold; aiManageTown(st, p, t); // na elitę nie starcza
    return { rich, poor: t.garrison.filter(Boolean).map(s => s.cid), x: F.dw.dw1x[1], u: F.dw.dw1u[1] };
  });
  assert.deepEqual(r.rich, [[r.x, 20]]); assert.deepEqual(r.poor, [r.u]);
});

// Symulacja: sama elita przeciw samym ulepszonym tego samego poziomu za to samo złoto (bez bohaterów, morale i szczęścia),
// na przemian z dala i wręcz (szybszy nie traci na tym, że pierwszy podchodzi). Elita ma zwykle wygrywać, ale nie zawsze.
test('balans w walce: elita wygrywa za równe złoto, ale żadna nie jest bezużyteczna', async () => {
  const r = await page.evaluate(() => {
    const st = G.state;
    function fight(a, b, seed, near) {
      const B = { st, h: null, sides: [0, 1].map(o => ({ owner: o, hero: null, monster: true, town: null })), round: 0, order: [], waitQ: [], active: null, units: [], log: [],
        over: null, auto: true, obst: new Map(), cast: [true, true], rng: mulberry32(seed), morale: [0, 0], luck: [0, 0] };
      placeSide(B, 0, [{ cid: a[0], n: a[1], src: 'x' }]); placeSide(B, 1, [{ cid: b[0], n: b[1], src: 'x' }]);
      if (near) { B.units[0].x = 7; B.units[1].x = 8; B.units[1].y = B.units[0].y; }
      for (let g = 0; !B.over && g < 3000; g++) { const u = nextActive(B); if (!u) break; if (!u.dead && fighters(B, 1 - u.side).length) aiAct(B, u); }
      const alive = s => B.units.some(u => u.side === s && !u.dead);
      return alive(0) && !alive(1) ? 0 : alive(1) && !alive(0) ? 1 : -1;
    }
    const rates = {};
    for (const F of FACTIONS) for (let L = 1; L <= 7; L++) {
      const u = F.dw['dw' + L + 'u'][1], x = F.dw['dw' + L + 'x'][1], nx = CREATURES[x].growth * 6, nu = Math.round(nx * unitCost(x).gold / unitCost(u).gold);
      let w = 0; for (let s = 0; s < 8; s++) { const sw = s % 2, near = s % 4 > 1; if (fight(sw ? [u, nu] : [x, nx], sw ? [x, nx] : [u, nu], 1000 + s, near) === sw) w++; }
      rates[x] = w / 8;
    }
    return rates;
  });
  const v = Object.values(r), avg = v.reduce((a, b) => a + b, 0) / v.length;
  assert.ok(avg > 0.65 && avg < 0.97, `średnio ${avg}`);
  assert.deepEqual(Object.entries(r).filter(([, w]) => w < 0.35).map(([id]) => id), []);
});
