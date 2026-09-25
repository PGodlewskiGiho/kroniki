// Dźwięk: efekty i muzyka z Web Audio, motyw zależny od ekranu, ustawienia głośności. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('motywy: 8 taktów po 8 ósemek, każdy takt ma nuty; efekty grają bez błędów', async () => {
  await page.mouse.click(5, 5); // pierwsze kliknięcie odblokowuje dźwięk
  const r = await page.evaluate(async () => {
    const songs = Object.keys(MUSIC).map(k => { const s = composeSong(MUSIC[k]); return { k, n: s.length, empty: [...Array(8).keys()].filter(b => !s.slice(b * 8, b * 8 + 8).some(x => x.length)).length, instr: s.flat().every(n => INSTR[n.i]) }; });
    for (const id of Object.keys(SFX)) { Sound.last = {}; Sound.play(id); }
    await new Promise(res => setTimeout(res, 300));
    return { ctx: !!Sound.ctx, songs, spells: Object.keys(SPELLS).every(id => SFX[spellSfx(id)]) };
  });
  assert.ok(r.ctx, 'kontekst audio po kliknięciu');
  for (const s of r.songs) { assert.equal(s.n, 64, s.k); assert.ok(s.instr, s.k); assert.equal(s.empty, 0, `${s.k}: puste takty`); }
  assert.ok(r.spells, 'każdy czar ma dźwięk');
});

test('muzyka zmienia się z ekranem: menu, mapa frakcji, miasto, bitwa', async () => {
  await newGame(page, { mapSize: 'M', faction: 'sylvan' }, 8);
  const seen = [await page.evaluate(() => Sound.theme)];
  await page.evaluate(() => { const st = G.state; setScreen('town', { townId: st.towns[0].id }); });
  seen.push(await page.evaluate(() => Sound.theme));
  await page.evaluate(() => { const st = G.state; setScreen('battle', { battle: createBattle(st, hero(st), st.towns[1]) }); });
  seen.push(await page.evaluate(() => Sound.theme));
  await frames(page, 10);
  await page.evaluate(() => setScreen('menu', {}));
  seen.push(await page.evaluate(() => Sound.theme));
  assert.deepEqual(seen, ['map_sylvan', 'town_sylvan', 'battle', 'menu']);
});

test('ustawienia dźwięku: przycisk zmienia głośność po kolei i zapisuje ją', async () => {
  const r = await page.evaluate(() => {
    G.settings.sfx = 0.7; G.settings.mus = 0.35; showSoundSettings();
    G.modal.buttons[0].action(); const a = G.settings.sfx; G.modal.buttons[0].action(); const b = G.settings.sfx; G.modal.buttons[1].action();
    const saved = JSON.parse(localStorage.getItem('kk_settings')); G.modal = null;
    return { a, b, mus: G.settings.mus, saved: [saved.sfx, saved.mus] };
  });
  assert.deepEqual(r, { a: 1, b: 0, mus: 0.7, saved: [0, 0.7] });
});
