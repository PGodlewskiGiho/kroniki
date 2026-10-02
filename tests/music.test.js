// Muzyka: wbudowane utwory, pętle i przypisanie utworów do ekranów. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('każdy utwór jest wbudowany i ma długość pętli', async () => {
  const r = await page.evaluate(() => Object.entries(MUSIC_ART).map(([k, v]) => [k, v.loop, v.d.length]));
  const names = r.map(x => x[0]).sort();
  assert.deepEqual(names, ['bitwa', 'menu', 'miasto', 'miasto_mrok']);
  for (const [k, loop, len] of r) { assert.ok(loop > 30 && loop < 300, `${k}: pętla ${loop}`); assert.ok(len > 100000, `${k}: dane`); }
});

test('ekrany dostają właściwe utwory (mroczne frakcje: mroczne miasto)', async () => {
  await newGame(page);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[0], f0 = t.faction, out = {};
    for (const s of ['menu', 'setup', 'credits', 'adventure', 'battle', 'hero', 'bye']) out[s] = Music.forScreen(s, {});
    t.faction = 'haven'; out.haven = Music.forScreen('town', { townId: 0 });
    t.faction = 'inferno'; out.inferno = Music.forScreen('town', { townId: 0 }); t.faction = f0;
    return out;
  });
  assert.deepEqual(r, { menu: 'menu', setup: 'menu', credits: 'menu', adventure: '', battle: 'bitwa', hero: null, bye: '', haven: 'miasto', inferno: 'miasto_mrok' });
});

test('odtwarzacz przełącza utwory i trzyma w pamięci najwyżej dwa', async () => {
  const r = await page.evaluate(async () => {
    Sfx.unlock(); if (!Sfx.ctx) return 'brak audio';
    const wait = ms => new Promise(f => setTimeout(f, ms));
    for (const n of ['menu', 'bitwa', 'miasto']) { Music.play(n); for (let i = 0; i < 40 && !(Music.buf[n] && Music.node); i++) await wait(100); }
    return { cur: Music.cur, playing: !!Music.node, kept: Object.keys(Music.buf).length };
  });
  if (r === 'brak audio') return;
  assert.deepEqual(r, { cur: 'miasto', playing: true, kept: 2 });
});
