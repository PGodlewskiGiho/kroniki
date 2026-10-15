// Balans klas bohaterów: krótki pomiar BalanceLab (src/js/14z-pomiar-balansu.js) dla ośmiu klas – czterech wojowników i czterech magów –
// na poziomach 10 i 20 (średnie grup, żeby wynik nie zależał od jednej pary klas). Bitwy mają stałe ziarna, więc wynik jest powtarzalny. Test pilnuje, żeby mag i wojownik nie rozjechali się
// bardziej niż BALANCE_GUARD (dziś), a kolejne etapy rozwoju bohatera zbliżają tę granicę do celu BALANCE_TARGET (±10%).
// Pełny pomiar wszystkich klas: node tools/balans/bohaterowie.js sila. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { openGame } = require('./harness');

let browser, page, errors;
test.before(async () => { ({ browser, page, errors } = await openGame()); });
test.after(async () => { if (browser) await browser.close(); });
test.afterEach(() => { const e = errors.splice(0); assert.deepEqual(e, [], 'błędy strony'); });

test('mag i wojownik mają podobną siłę w bitwie na 10. i 20. poziomie', { timeout: 300000 }, async () => {
  const r = await page.evaluate(() => {
    const lab = BalanceLab.setup(), CL = ['knight', 'barbarian', 'ranger', 'overlord', 'wizard', 'cleric', 'necro', 'warlock'], out = { guard: BALANCE_GUARD, lv: {}, mages: MAGE_CLASSES };
    for (const L of [10, 20]) out.lv[L] = Object.fromEntries(CL.map(c => [c, BalanceLab.index(lab, c, L, 3, 7).index]));
    return out;
  });
  for (const [L, row] of Object.entries(r.lv)) {
    const avg = m => { const v = Object.entries(row).filter(([c]) => r.mages.includes(c) === m).map(([, x]) => x); return v.reduce((a, b) => a + b, 0) / v.length; };
    const might = avg(false), mage = avg(true), ratio = mage / might;
    console.log(`poziom ${L}: ${Object.entries(row).map(([c, v]) => `${c} ${v.toFixed(2)}`).join(', ')}; mag/wojownik ${ratio.toFixed(2)}`);
    assert.ok(Object.values(row).every(v => v > 1), `bohater wzmacnia armię na ${L}. poziomie`);
    assert.ok(Math.abs(ratio - 1) <= r.guard, `poziom ${L}: mag/wojownik ${ratio.toFixed(2)} poza ±${r.guard * 100}%`);
  }
});
