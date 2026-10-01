// Składa grę z plików w src/ w jeden plik „Kroniki Królestw.html” (gra dalej działa jako jeden plik).
//   node build.js          zbuduj
//   node build.js --check  sprawdź, czy zbudowany plik jest aktualny (kod 1, gdy nie)
//   node build.js --watch  buduj po każdej zmianie w src/
// Grafiki jednostek (src/grafika) wypala z modeli 3D osobny skrypt: npm run grafika (tools/grafika3d/wypal.js).
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
  // Czcionki z src/czcionki (np. pikselowa) wbudowane w plik jako @font-face z danymi base64: gra działa bez internetu.
  // Plik „nazwa-rodziny__zakres.woff2”: rodzina z myślnikami zamiast spacji, zakres = latin albo latin-ext.
  const RANGES = { latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    'latin-ext': 'U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' };
  const fdir = path.join(SRC, 'czcionki'), faces = fs.existsSync(fdir) ? fs.readdirSync(fdir).filter(f => f.endsWith('.woff2')).sort().map(f => {
    const [fam, range] = f.replace('.woff2', '').split('__'), data = fs.readFileSync(path.join(fdir, f)).toString('base64');
    return `@font-face{font-family:'${fam.replace(/-/g, ' ')}';font-style:normal;font-weight:400 800;font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${RANGES[range]}}`;
  }).join('\n') : '';
  // Grafiki jednostek wypalone z modeli 3D (tools/grafika3d/wypal.js): opis klatek i arkusze PNG jako dane base64
  const gdir = path.join(SRC, 'grafika'), gmeta = path.join(gdir, 'jednostki.json');
  const art = fs.existsSync(gmeta) ? JSON.parse(fs.readFileSync(gmeta, 'utf8')) : {};
  for (const id of Object.keys(art)) { const fw = path.join(gdir, 'jednostki', id + '.webp'), f = path.join(gdir, 'jednostki', id + '.png'); if (fs.existsSync(fw)) { art[id].png = fs.readFileSync(fw).toString('base64'); art[id].webp = 1; } else if (fs.existsSync(f)) art[id].png = fs.readFileSync(f).toString('base64'); else delete art[id]; } // arkusz WebP (grafika bez pikselizacji) albo PNG
  const hmeta = path.join(gdir, 'bohaterowie.json'), hart = fs.existsSync(hmeta) ? JSON.parse(fs.readFileSync(hmeta, 'utf8')) : {};
  for (const id of Object.keys(hart)) { const f = path.join(gdir, 'bohaterowie', id + '.png'); if (fs.existsSync(f)) hart[id].png = fs.readFileSync(f).toString('base64'); else delete hart[id]; }
  // Portrety bohaterów (tools/portrety-ai): imię -> PNG 72×72
  const pmeta = path.join(gdir, 'portrety.json'), port = {};
  if (fs.existsSync(pmeta)) for (const [name, f] of Object.entries(JSON.parse(fs.readFileSync(pmeta, 'utf8')))) { const pf = path.join(gdir, 'portrety', f); if (fs.existsSync(pf)) port[name] = fs.readFileSync(pf).toString('base64'); }
  // Sceny miast wypalone z 3D (tools/grafika3d/wypal-miasta.js): frakcja -> { d, bg, b: klatki budowli, png: arkusz WebP }
  const tmeta = path.join(gdir, 'miasta.json'), tart = {};
  if (fs.existsSync(tmeta)) for (const [fac, m] of Object.entries(JSON.parse(fs.readFileSync(tmeta, 'utf8')))) { const f = path.join(gdir, 'miasta', fac + '.webp'); if (fs.existsSync(f)) tart[fac] = { ...m, png: fs.readFileSync(f).toString('base64'), webp: 1 }; }
  const artJs = `// Wbudowane przez build.js z src/grafika (wypalone przez tools/grafika3d i tools/portrety-ai): klatki jednostek i bohaterów, portrety\nconst UNIT_ART = ${JSON.stringify(art)};\nconst HERO_ART = ${JSON.stringify(hart)};\nconst HERO_PORTRAITS = ${JSON.stringify(port)};\nconst TOWN_BUILD_ART = ${JSON.stringify(tart)};\n`;
  return shell.replace('@@CZCIONKI@@', () => faces).replace('@@SKRYPT@@\n', () => artJs + js);
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
