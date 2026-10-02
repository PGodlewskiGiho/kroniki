// Sterowanie dotykiem: grubszy palec przy przyciskach, szczypanie mapy, w bitwie stuknięcie = podgląd, drugie = wykonanie.
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame, newGame, frames } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); await newGame(page); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('dotyk trafia w przycisk także tuż obok niego, mysz tylko dokładnie', async () => {
  const r = await page.evaluate(() => {
    const b = new Button(100, 100, 80, 30, 'X', null), list = [b];
    G.mouse.type = 'touch'; const t = buttonAt(list, 95, 110) === b; G.mouse.type = 'mouse'; const m = buttonAt(list, 95, 110);
    return { t, m };
  });
  assert.deepEqual(r, { t: true, m: null });
});

test('dwa palce rozsuwane na mapie przybliżają widok', async () => {
  const r = await page.evaluate(() => {
    setZoom(G.state, 1); const c = G.canvas, R = c.getBoundingClientRect(), cx = R.left + R.width * 0.35, cy = R.top + R.height * 0.45;
    const ev = (type, id, x, y) => (type === 'pointerdown' ? c : window).dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, button: 0, bubbles: true, isPrimary: id === 1 }));
    ev('pointerdown', 1, cx - 20, cy); ev('pointerdown', 2, cx + 20, cy);
    for (let k = 1; k <= 10; k++) { ev('pointermove', 1, cx - 20 - k * 6, cy); ev('pointermove', 2, cx + 20 + k * 6, cy); }
    ev('pointerup', 1, cx - 80, cy); ev('pointerup', 2, cx + 80, cy);
    return { zoom: ZOOM, pinch: G.pinch, screen: G.screenName };
  });
  assert.ok(r.zoom > 1, `przybliżenie ${r.zoom}`); assert.equal(r.pinch, null); assert.equal(r.screen, 'adventure');
  await page.evaluate(() => setZoom(G.state, 1));
});

test('bitwa dotykiem: pierwsze stuknięcie pokazuje ruch, drugie go wykonuje', async () => {
  const r = await page.evaluate(() => {
    const st = G.state, me = hero(st), m = st.objects.find(o => o.type === 'monster' && !o.dead);
    me.army = [{ cid: 'pikeman', n: 20 }, null, null, null, null, null, null];
    const B = createBattle(st, me, m); setScreen('battle', { battle: B }); const scr = G.screen;
    const u = B.units.find(v => v.side === 0); B.active = u; scr.startTurnFor(u); G.mouse.type = 'touch';
    const k = [...scr.reach.dist.keys()].find(k => k !== hexKey(u.x, u.y) && !unitAt(B, k % BCOLS, Math.floor(k / BCOLS)));
    const [x, y] = hexCenter(k % BCOLS, Math.floor(k / BCOLS));
    scr.onClick(x, y); const first = { phase: scr.phase, kind: scr.preview && scr.preview.kind };
    scr.onClick(x, y); const second = scr.phase; G.mouse.type = 'mouse';
    return { first, second };
  });
  assert.deepEqual(r, { first: { phase: 'input', kind: 'move' }, second: 'play' });
});
