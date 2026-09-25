// Grafika: portrety bohaterów i mury oblężenia. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('portrety: każdy bohater frakcji wygląda inaczej, ten sam zawsze tak samo', async () => {
  const r = await page.evaluate(() => {
    const all = FACTIONS.flatMap(F => F.heroes.map(([name, cls, f]) => ({ name, cls, female: !!f })));
    const pix = h => { const c = portraitCanvas(h, '#c8302a'); return Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data).join(','); };
    const imgs = all.map(pix);
    PORTRAITS.clear(); const again = pix(all[0]);
    return { n: all.length, unique: new Set(imgs).size, same: again === imgs[0], size: portraitCanvas(all[0], '#2a5ac8').width, looks: all.every(h => HERO_LOOKS[h.name]) };
  });
  assert.equal(r.unique, r.n);
  assert.ok(r.same);
  assert.equal(r.size, 36);
  assert.ok(r.looks, 'każdy bohater frakcji ma własny opis wyglądu');
});

test('mury: jeden sprite zamku, nowy rysunek po trafieniu i wyłomie', async () => {
  await newGame(page, { mapSize: 'M' }, 8);
  const r = await page.evaluate(() => {
    const st = G.state, t = st.towns[1], h = hero(st); t.built = ['hall1', 'dw1', 'fort', 'citadel', 'castle'];
    const B = createBattle(st, h, t), spr = () => castleSprite(t.faction, '#888888', B.walls);
    const s0 = spr(), again = spr() === s0, w = wallAt(B, SIEGE_X, 2); w.hp--; const s1 = spr(); w.hp = 0; const s2 = spr();
    setScreen('battle', { battle: B });
    return { again, hit: s1 !== s0, down: s2 !== s1 && s2 !== s0, w: s0.c.width };
  });
  assert.deepEqual(r, { again: true, hit: true, down: true, w: 80 });
  await frames(page, 4);
});
