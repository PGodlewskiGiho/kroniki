// Składa grę z plików w src/ w jeden plik „Kroniki Królestw.html” (gra dalej działa jako jeden plik).
//   node build.js          zbuduj
//   node build.js --check  sprawdź, czy zbudowany plik jest aktualny (kod 1, gdy nie)
//   node build.js --watch  buduj po każdej zmianie w src/
// Pliki src/js/*.js są sklejane w kolejności nazw (numer na początku) i wstawiane w miejsce @@SKRYPT@@
// w src/szablon.html. Wszystkie działają w jednym <script>, więc widzą nawzajem swoje stałe i funkcje.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = __dirname, SRC = path.join(ROOT, 'src'), OUT = path.join(ROOT, 'Kroniki Królestw.html');

function build() {
  const dir = path.join(SRC, 'js'), files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  const js = files.map(f => { const s = fs.readFileSync(path.join(dir, f), 'utf8'); return s.endsWith('\n') ? s : s + '\n'; }).join('');
  const shell = fs.readFileSync(path.join(SRC, 'szablon.html'), 'utf8');
  if (!shell.includes('@@SKRYPT@@\n')) throw new Error('src/szablon.html: brak linii @@SKRYPT@@');
  return shell.replace('@@SKRYPT@@\n', () => js);
}

const arg = process.argv[2];
if (arg === '--check') {
  const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === build();
  console.log(ok ? 'Plik gry jest aktualny.' : 'Plik gry jest nieaktualny: uruchom „npm run build”.');
  process.exit(ok ? 0 : 1);
}
const write = () => { fs.writeFileSync(OUT, build()); console.log(`Zbudowano: ${path.basename(OUT)} (${new Date().toLocaleTimeString('pl-PL')})`); };
write();
if (arg === '--watch') {
  let t = null;
  fs.watch(SRC, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { try { write(); } catch (e) { console.error(e.message); } }, 100); });
  console.log('Czekam na zmiany w src/ (Ctrl+C kończy).');
}
