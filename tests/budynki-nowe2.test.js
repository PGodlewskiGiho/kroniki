// Nowe budynki mapy (2): pomnik bohatera (+1 morale), port rybacki (złoto dziennie, tańsze łodzie), zbrojownia polowa (machiny
// poza miastem), prom (para przystani przez wodę), kartograf (mapy wód, lądów i podziemi). Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('rozmieszczenie: pomniki, zbrojownie, kartografowie; porty na brzegu; promy w parach przez wodę; modele 3D', async () => {
  const r = await page.evaluate(() => { const cnt = {}, bad = [];
    for (const [size, seed, land] of [['L', 3, 'mixed'], ['XL', 8, 'mixed'], ['L', 21, 'islands'], ['M', 5, 'lakes']]) {
      const S = Object.assign({}, G.settings, { mapSize: size, land, difficulty: 1, faction: 'haven', bonus: 'gold', opponents: 1, slots: null, underground: false });
      const st = createNewGame(S, seed), n = st.map.n, W = i => st.map.terrain[i] === TER.WATER;
      for (const o of st.objects) { if (o.dead || !['monument', 'fishPort', 'armory', 'ferry', 'cartographer'].includes(o.kind)) continue; cnt[o.kind] = (cnt[o.kind] || 0) + 1; const i = o.y * n + o.x;
        if (W(i)) bad.push(`${o.kind} na wodzie`);
        if (o.kind === 'fishPort' && !DX8.some((dx, d) => W((o.y + DY8[d]) * n + o.x + dx))) bad.push('port bez wody obok');
        if (o.kind === 'ferry') { const p = st.objects[o.pair]; if (!p || p.kind !== 'ferry' || p.pair !== o.id) bad.push('prom bez pary');
          else { const d = Math.max(Math.abs(p.x - o.x), Math.abs(p.y - o.y)), sx = Math.sign(p.x - o.x), sy = Math.sign(p.y - o.y); let wet = 0; for (let k = 1; k < d; k++) if (W((o.y + sy * k) * n + o.x + sx * k)) wet++;
            if (d < 3 || d > 6 || wet !== d - 1) bad.push(`prom: ${d} pól, wody ${wet}`); } } } }
    return { cnt, bad, sprites: ['site_monument', 'site_fishPort', 'site_armory', 'site_ferry', 'site_cartographer'].filter(k => !(MAP3D_ART && MAP3D_ART.f[k])), flags: [map3dFlags('site_monument').length, map3dFlags('site_fishPort').length] }; });
  assert.deepEqual(r.bad, []); assert.deepEqual(r.sprites, []); assert.deepEqual(r.flags, [1, 1]);
  for (const k of ['monument', 'fishPort', 'armory', 'cartographer']) assert.ok(r.cnt[k] >= 1, `${k}: ${r.cnt[k] || 0}`);
  assert.ok(r.cnt.ferry >= 2 && r.cnt.ferry % 2 === 0, `promy: ${r.cnt.ferry}`);
});

test('pomnik: przejęcie daje +1 morale wszystkim bohaterom gracza (drugi się nie sumuje); port: +250 złota dziennie i łódź za pół ceny', async () => {
  await newGame(page, { mapSize: 'S' }, 5);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), mk = kind => { const o = { id: st.objects.length, type: 'site', kind, x: 1, y: st.objects.length % st.map.n, owner: -1, seen: {} }; st.objects.push(o); return o; };
    const m0 = armyMorale(['pikeman', 'boneWarrior'], h), a = mk('monument'), t1 = useSite(st, h, a).text, m1 = armyMorale(['pikeman', 'boneWarrior'], h); useSite(st, h, mk('monument')); const m2 = armyMorale(['pikeman', 'boneWarrior'], h);
    const i0 = dailyIncomeAll(st, h.owner).gold, port = mk('fishPort'), b0 = boatCost(st, h.owner); const t2 = useSite(st, h, port).text, i1 = dailyIncomeAll(st, h.owner).gold, b1 = boatCost(st, h.owner);
    const info = siteInfo(st, port, h), ai = aiSiteValue(st, h, a);
    return { m0, m1, m2, t1, i: i1 - i0, b0, b1, t2, info, ai };
  });
  assert.equal(r.m1 - r.m0, 1); assert.equal(r.m2, r.m1); assert.match(r.t1, /\+1 do morale/);
  assert.equal(r.i, 250); assert.deepEqual(r.b0, { gold: 1000, wood: 10 }); assert.deepEqual(r.b1, { gold: 500, wood: 5 }); assert.match(r.info, /należy do/); assert.equal(r.ai, 0);
});

test('zbrojownia polowa: karty machin, zakup bez miasta; komputer kupuje, gdy go stać z zapasem', async () => {
  await newGame(page, { mapSize: 'S' }, 7);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = human(st).resources, ob = { id: st.objects.length, type: 'site', kind: 'armory', x: h.x, y: h.y, seen: {} }; st.objects.push(ob);
    h.machines = []; R.gold = 5000; G.modal = null; visitObject(st, h, ob); const labels = G.modal.buttons.map(b => b.label);
    G.modal.buttons.find(b => b.label === CREATURES.firstAid.name).action(); G.modal = null; const after = h.machines.slice(), gold = R.gold;
    h.machines = []; R.gold = 50000; const ai = useSite(st, h, ob).text; return { labels, after, gold, aiM: h.machines.length, ai, v: aiSiteValue(st, h, ob) };
  });
  assert.equal(r.labels.length, 4); assert.ok(r.labels.includes('Wyjdź')); assert.deepEqual(r.after, ['firstAid']); assert.ok(r.gold < 5000);
  assert.equal(r.aiM, 3); assert.match(r.ai, /Kupiono/); assert.equal(r.v, 0);
});

test('prom: przeprawa na drugą przystań za 200 złota; bez złota nie ma przycisku; zajęta przystań blokuje', async () => {
  await newGame(page, { mapSize: 'S' }, 9);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), R = human(st).resources, n = st.map.n, out = {};
    const spot = st.map.terrain.findIndex((t, i) => i > n * 3 && t !== TER.WATER && !st.map.obst[i] && !objectAt(st, i) && !heroAt(st, i % n, (i / n) | 0) && (i % n) > 3 && (i % n) < n - 3 && i !== h.y * n + h.x);
    const a = { id: st.objects.length, type: 'site', kind: 'ferry', x: h.x, y: h.y, seen: {} }; st.objects.push(a); const b = { id: st.objects.length, type: 'site', kind: 'ferry', x: spot % n, y: (spot / n) | 0, seen: {} }; st.objects.push(b); a.pair = b.id; b.pair = a.id;
    R.gold = 100; G.modal = null; visitObject(st, h, a); out.poor = G.modal.buttons.map(x => x.label); G.modal = null;
    R.gold = 1000; visitObject(st, h, a); out.btns = G.modal.buttons.map(x => x.label); G.modal.buttons[0].action(); G.modal = null;
    out.pos = [h.x, h.y]; out.to = [b.x, b.y]; out.gold = R.gold; out.info = siteInfo(st, b, h);
    return out; });
  assert.deepEqual(r.poor, ['Odejdź']); assert.deepEqual(r.btns, ['Przepraw się', 'Odejdź']); assert.deepEqual(r.pos, r.to); assert.equal(r.gold, 800); assert.match(r.info, /drugi brzeg: pole/);
});

test('kartograf: mapa wód odsłania całą wodę (raz na gracza), mapa podziemi tylko gdy są podziemia', async () => {
  await newGame(page, { mapSize: 'M', land: 'lakes' }, 11);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), P = human(st), R = P.resources, ob = { id: st.objects.length, type: 'site', kind: 'cartographer', x: h.x, y: h.y, seen: {} }; st.objects.push(ob);
    const water = cartoTiles(st, 'sea'), before = water.filter(i => P.explored[i]).length; R.gold = 10000; G.modal = null; visitObject(st, h, ob); const labels = G.modal.buttons.map(b => b.label);
    G.modal.buttons.find(b => b.label.startsWith('Mapa wód')).action(); G.modal = null; const after = water.filter(i => P.explored[i]).length;
    return { labels, water: water.length, before, after, gold: R.gold, avail: cartoAvail(st, ob, h.owner).map(m => m.id), info: siteInfo(st, ob, h) }; });
  assert.ok(r.water > 50); assert.ok(r.before < r.water); assert.equal(r.after, r.water); assert.equal(r.gold, 9000);
  assert.ok(r.labels.some(l => l.startsWith('Mapa wód')) && !r.labels.some(l => l.startsWith('Mapa podziemi')));
  assert.ok(!r.avail.includes('sea')); assert.match(r.info, /w ofercie/);
});

test('mapa z nowymi budynkami rysuje się bez błędów (flagi właściciela na pomniku i porcie)', async () => {
  await newGame(page, { mapSize: 'M' }, 13);
  await page.evaluate(() => { const st = G.state, h = hero(st); for (const [i, kind] of ['monument', 'fishPort', 'armory', 'ferry', 'cartographer'].entries()) st.objects.push({ id: st.objects.length, type: 'site', kind, x: h.x + 2 + i, y: h.y + 2, owner: ['monument', 'fishPort'].includes(kind) ? h.owner : undefined, seen: {} });
    rebuildObjIndex(st); MapRender.miniDirty = true; });
  await frames(page, 6);
});
