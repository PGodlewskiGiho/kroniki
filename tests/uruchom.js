// Wszystkie testy: najpierw zwykłe (równolegle, plik na rdzeń), potem pomiary płynności (perf) osobno – zmierzone obok kilku
// innych przeglądarek walczących o te same rdzenie dawały przypadkowe wyniki. Uruchom: npm test
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const all = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort().map(f => path.join('tests', f)), solo = all.filter(f => /perf\.test\.js$/.test(f));
let code = 0;
for (const files of [all.filter(f => !solo.includes(f)), solo]) if (files.length) { const r = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit', cwd: path.join(__dirname, '..') }); if (r.status) code = r.status || 1; }
process.exit(code);
