// Dźwięki otoczenia przy budynkach (pętle blisko bohatera), dźwięki i znaki czarów, mapa zagadki: malowany obraz frakcji,
// nowe kawałki zdejmują się z melodią odkrycia. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('dźwięki otoczenia: tartak piłuje, kuźnia dzwoni… tylko blisko bohatera, najbliższe najgłośniej, najwyżej trzy naraz', async () => {
  await newGame(page, { mapSize: 'M' }, 9);
  const r = await page.evaluate(() => {
    const st = G.state, h = hero(st), has = Sfx.has, was = st.objects.map(o => o.dead); Sfx.has = () => true; human(st).explored.fill(1); st.objects.forEach(o => { o.dead = true; }); // tylko budynki z testu
    const mk = (o, dx) => { o.x = h.x + dx; o.y = h.y; o.id = st.objects.length; st.objects.push(o); return o; };
    const saw = mk({ type: 'mine', kind: 'wood', owner: -1 }, 2), forge = mk({ type: 'site', kind: 'dwarfForge', seen: {} }, -4), far = mk({ type: 'site', kind: 'inn', seen: {} }, 12);
    const near = Ambient.pick(st, h); for (const o of [saw, forge, far]) o.dead = true; was.forEach((d, i) => { st.objects[i].dead = d; }); Sfx.has = has;
    const kinds = Object.keys(SITES).filter(k => !['portal', 'gate', 'obelisk'].includes(k));
    return { saw: near.amb_saw && near.amb_saw.v, forge: near.amb_forge && near.amb_forge.v, inn: !!near.amb_tavern, n: Object.keys(near).length, pan: [near.amb_saw.pan > 0, near.amb_forge.pan < 0],
      mapped: kinds.filter(k => AMB_SITE[k]).length, mines: Object.keys(MINES).every(m => AMB_MINE[m]), portal: AMB_SITE.portal,
      towns: (() => { const h0 = Sfx.has; Sfx.has = nm => !!SOUND_ART[nm + '_1']; const n = new Set(FACTIONS.map(f => ambientOf({ type: 'town', townId: 0 }, { towns: [{ faction: f.id }] }))).size; Sfx.has = h0; return n; })() };
  });
  assert.ok(r.saw > r.forge && r.forge > 0, `głośność: piła ${r.saw}, kuźnia ${r.forge}`); assert.equal(r.inn, false, 'karczma 12 pól dalej milczy');
  assert.ok(r.n <= 3); assert.deepEqual(r.pan, [true, true], 'piła z prawej, kuźnia z lewej'); assert.ok(r.mapped >= 25, `miejsc z dźwiękiem: ${r.mapped}`); assert.ok(r.mines);
  assert.equal(r.portal, 'amb_portal', 'portal: niski szum wiru'); assert.equal(r.towns, 8, 'każda frakcja ma własny dźwięk miasta');
});

test('czary: każdy czar bitewny ma własny znak (słup światła, kopuła, dym, lód…) i dźwięk rzucenia i trafienia; efekty rysują się bez błędów', async () => {
  await newGame(page, { mapSize: 'S' }, 5);
  const r = await page.evaluate(async () => {
    const wait = n => new Promise(res => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    const st = G.state, foe = st.objects.find(o => o.type === 'monster' && !o.dead); setScreen('battle', { battle: createBattle(st, hero(st), foe) }); G.fade.a = 0;
    const ids = Object.keys(SPELLS).filter(id => SPELLS[id].kind !== 'adv'), u = G.screens.battle.B.units.find(x => x.side === 1);
    const noSig = ids.filter(id => !(SPELL_FX[id] && SPELL_FX[id].sig)), noSnd = ids.filter(id => !SPELL_SND[id]);
    const sigs = new Set(ids.map(id => SPELL_FX[id] && SPELL_FX[id].sig).filter(Boolean));
    for (const id of ids) { spellAura(u.px, u.py, SPELL_FX[id] || {}); spellSignature(u.px, u.py, SPELL_FX[id] || {}); } await wait(20);
    const busy = BattleFX.parts.length + BattleFX.beams.length + BattleFX.domes.length; await wait(10);
    const missing = [...new Set(Object.values(SPELL_SND).flat())].filter(n => !(typeof SOUND_ART !== 'undefined' && Object.keys(SOUND_ART).some(k => k.replace(/_\d+$/, '') === n)));
    setScreen('adventure', {}); return { noSig, noSnd, sigs: sigs.size, busy, missing };
  });
  assert.deepEqual(r.noSig, []); assert.deepEqual(r.noSnd, []); assert.ok(r.sigs >= 12, `rodzajów znaków: ${r.sigs}`); assert.ok(r.busy > 100, `cząsteczek: ${r.busy}`);
  assert.deepEqual(r.missing, [], 'próbki dźwięków czarów');
});

test('mapa zagadki: malowany obraz frakcji na kawałkach, nowe kawałki zdejmują się z melodią, przy ponownym otwarciu już nie', async () => {
  await newGame(page, { mapSize: 'M', faction: 'sylvan' }, 9);
  await page.waitForFunction(() => !SCREEN_IMG.zagadka_sylvan || SCREEN_IMG.zagadka_sylvan._ok, null, { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const wait = n => new Promise(res => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    const st = G.state, played = [], play = Sfx.play; Sfx.play = (n, o) => { played.push(n); return play.call(Sfx, n, o); };
    const ob = st.objects.find(o => o.kind === 'obelisk'); ob.seen = { ['p' + ME]: 1 }; showPuzzle(st); await wait(5); const first = st.puzzleSeen[ME], k1 = played.filter(n => n === 'puzzle').length;
    G.modal = null; showPuzzle(st); await wait(5); const k2 = played.filter(n => n === 'puzzle').length; G.modal = null; Sfx.play = play;
    const sounds = ['puzzle', 'grail'].map(n => typeof SOUND_ART !== 'undefined' && !!SOUND_ART[n + '_1']);
    return { first, k1, k2, painted: !!SCREEN_ART.zagadka_sylvan, all: ['haven', 'sylvan', 'barrow', 'fortress', 'inferno', 'academy', 'dungeon', 'stronghold'].filter(f => !SCREEN_ART['zagadka_' + f]), sounds };
  });
  assert.ok(r.first > 0, 'kawałki odsłonięte'); assert.equal(r.k1, 1, 'melodia przy odkryciu'); assert.equal(r.k2, 1, 'drugi raz bez melodii');
  assert.deepEqual(r.all, [], 'obrazy wszystkich frakcji'); assert.deepEqual(r.sounds, [true, true]);
});
