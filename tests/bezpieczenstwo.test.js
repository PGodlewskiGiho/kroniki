// Bezpieczeństwo projektu: paczki npm tylko z oficjalnego rejestru i z sumami kontrolnymi, bez skryptów instalacji,
// żadnych sekretów w repozytorium, kod gry bez wstawiania HTML i eval, dane od innych graczy online sprawdzane. Uruchom: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { openGame } = require('./harness');
const ROOT = path.join(__dirname, '..');

test('paczki npm: tylko registry.npmjs.org, każda z sumą kontrolną, skrypty instalacji wyłączone', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8')), bad = [];
  for (const [k, v] of Object.entries(lock.packages)) { if (!k || v.link) continue;
    if (!v.resolved || !v.resolved.startsWith('https://registry.npmjs.org/')) bad.push(`${k}: ${v.resolved}`);
    if (!/^sha512-/.test(v.integrity || '')) bad.push(`${k}: brak sumy sha512`); }
  assert.deepEqual(bad, []);
  assert.match(fs.readFileSync(path.join(ROOT, '.npmrc'), 'utf8'), /^ignore-scripts=true$/m);
  for (const f of fs.readdirSync(path.join(ROOT, '.github', 'workflows'))) {
    const y = fs.readFileSync(path.join(ROOT, '.github', 'workflows', f), 'utf8');
    assert.ok(!/npm (ci|install)(?! --ignore-scripts)/.test(y), `${f}: npm ci bez --ignore-scripts`);
    assert.ok(!/pull_request_target/.test(y), `${f}: pull_request_target daje sekrety obcym zmianom`);
  }
});

test('repozytorium bez sekretów: klucze podpisu, hasła i tokeny tylko w sekretach GitHuba', () => {
  const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  assert.deepEqual(files.filter(f => /\.(keystore|jks|p12|pem|key)$|(^|\/)\.env|sekret|secret/i.test(f)), []);
  const pat = /-----BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{30}|github_pat_|AKIA[0-9A-Z]{16}|\bsk-[A-Za-z0-9]{32}|hf_[A-Za-z0-9]{30}|(storePassword|keyPassword)\s+['"]/;
  const hits = files.filter(f => f !== 'tests/bezpieczenstwo.test.js').filter(f => /\.(js|py|json|ya?ml|gradle|java|xml|md|sh|properties|html)$/.test(f) && !f.endsWith('.html') && !f.startsWith('src/grafika/'))
    .filter(f => pat.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  assert.deepEqual(hits, []);
});

test('kod gry nie wstawia HTML ani nie wykonuje tekstu jako kodu', () => {
  const dir = path.join(ROOT, 'src', 'js'), bad = [];
  for (const f of fs.readdirSync(dir)) fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, i) => {
    if (/\beval\(|new Function\(|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write\(|set(Timeout|Interval)\(\s*['"`]/.test(l)) bad.push(`${f}:${i + 1}`); });
  assert.deepEqual(bad, []);
});

test('gra online: obce wiadomości odrzucane, nazwy przycięte, „bomba” gzip zatrzymana', async () => {
  const { browser, page, errors } = await openGame();
  try {
    const r = await page.evaluate(async () => {
      const out = {}; for (const m of [null, 5, 'tekst', { x: 1 }]) { Net.hostData({ send() {} }, m); await Net.onData(m); }
      out.name = netName('a'.repeat(200) + '\u0007'); netChatAdd('x'.repeat(500), 'hej'); out.from = NetChat.lines[NetChat.lines.length - 1].from.length;
      // 80 MB zer spakowanych do ~80 KB: rozpakowanie przerwane po NET_MAX
      const big = new Uint8Array(80 * 1024 * 1024), z = new Uint8Array(await new Response(new Blob([big]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
      try { await Net.unpack({ z: 1, b: z }); out.bomb = 'przyjęta'; } catch (e) { out.bomb = e.message; }
      out.ok = (await Net.unpack(await Net.pack(createNewGame(Object.assign({}, G.settings, { mapSize: 'S', opponents: 0, slots: null }), 7)))).v != null;
      return out;
    });
    assert.deepEqual(r, { name: 'a'.repeat(24), from: 24, bomb: 'za duży stan gry', ok: true });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
