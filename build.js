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

// Dane binarne (grafiki, dźwięki) jako tekst w kodzie 85-znakowym: 4 bajty -> 5 znaków (narzut 25% zamiast 33% w base64).
// Alfabet: drukowalne ASCII bez " $ % & ' < > \ ` (bezpieczne w napisie JS i w <script>). Pierwszy znak = liczba bajtów dopełnienia.
const B85 = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).filter(c => !'"$%&\'<>\\`'.includes(c)).join('');
function b85(buf) {
  const pad = (4 - buf.length % 4) % 4, b = pad ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf, out = new Array(b.length / 4 + 1); out[0] = B85[pad];
  for (let i = 0, o = 1; i < b.length; i += 4, o++) { let v = b.readUInt32BE(i), c = ''; for (let k = 0; k < 5; k++) { c = B85[v % 85] + c; v = Math.floor(v / 85); } out[o] = c; }
  return out.join('');
}
function build() {
  const dir = path.join(SRC, 'js'), files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  const js = files.map(f => { const s = fs.readFileSync(path.join(dir, f), 'utf8'); return s.endsWith('\n') ? s : s + '\n'; }).join('');
  const shell = fs.readFileSync(path.join(SRC, 'szablon.html'), 'utf8');
  if (!shell.includes('@@SKRYPT@@\n')) throw new Error('src/szablon.html: brak linii @@SKRYPT@@');
  // Czcionki z src/czcionki (np. pikselowa) wbudowane w plik jako @font-face z danymi base64: gra działa bez internetu.
  // Plik „nazwa-rodziny__zakres[__grubość[-italic]].woff2”: rodzina z myślnikami zamiast spacji, zakres = latin albo latin-ext.
  const RANGES = { latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    'latin-ext': 'U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' };
  const fdir = path.join(SRC, 'czcionki'), faces = fs.existsSync(fdir) ? fs.readdirSync(fdir).filter(f => f.endsWith('.woff2')).sort().map(f => {
    const [fam, range, wt] = f.replace('.woff2', '').split('__'), data = fs.readFileSync(path.join(fdir, f)).toString('base64'), [w, it] = (wt || '400 800').split('-');
    return `@font-face{font-family:'${fam.replace(/-/g, ' ')}';font-style:${it ? 'italic' : 'normal'};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${RANGES[range]}}`;
  }).join('\n') : '';
  // Grafiki jednostek wypalone z modeli 3D (tools/grafika3d/wypal.js): opis klatek i arkusze PNG jako dane base64
  const gdir = path.join(SRC, 'grafika'), gmeta = path.join(gdir, 'jednostki.json');
  const art = fs.existsSync(gmeta) ? JSON.parse(fs.readFileSync(gmeta, 'utf8')) : {};
  for (const id of Object.keys(art)) { const fw = path.join(gdir, 'jednostki', id + '.webp'), f = path.join(gdir, 'jednostki', id + '.png'); if (fs.existsSync(fw)) { art[id].png = b85(fs.readFileSync(fw)); art[id].webp = 1; } else if (fs.existsSync(f)) art[id].png = b85(fs.readFileSync(f)); else delete art[id]; } // arkusz WebP (grafika bez pikselizacji) albo PNG
  const hmeta = path.join(gdir, 'bohaterowie.json'), hart = fs.existsSync(hmeta) ? JSON.parse(fs.readFileSync(hmeta, 'utf8')) : {};
  for (const id of Object.keys(hart)) { const fw = path.join(gdir, 'bohaterowie', id + '.webp'), f = path.join(gdir, 'bohaterowie', id + '.png'); if (fs.existsSync(fw)) { hart[id].png = b85(fs.readFileSync(fw)); hart[id].webp = 1; } else if (fs.existsSync(f)) hart[id].png = b85(fs.readFileSync(f)); else delete hart[id]; }
  // Portrety bohaterów (tools/portrety-ai): imię -> PNG 72×72
  const pmeta = path.join(gdir, 'portrety.json'), port = {};
  if (fs.existsSync(pmeta)) for (const [name, f] of Object.entries(JSON.parse(fs.readFileSync(pmeta, 'utf8')))) { const pf = path.join(gdir, 'portrety', f); if (fs.existsSync(pf)) port[name] = b85(fs.readFileSync(pf)); }
  // Sceny miast wypalone z 3D (tools/grafika3d/wypal-miasta.js): frakcja -> { d, bg, b: klatki budowli, png: arkusz WebP }
  const tmeta = path.join(gdir, 'miasta.json'), tart = {};
  if (fs.existsSync(tmeta)) for (const [fac, m] of Object.entries(JSON.parse(fs.readFileSync(tmeta, 'utf8')))) { const f = path.join(gdir, 'miasta', fac + '.webp'); if (fs.existsSync(f)) tart[fac] = { ...m, png: b85(fs.readFileSync(f)), webp: 1 }; }
  // Artefakty wypalone z 3D (tools/grafika3d/wypal-artefakty.js): { s: bok kratki, f: id -> [x, y], png: arkusz WebP }
  const ameta = path.join(gdir, 'artefakty.json'), aimg = path.join(gdir, 'artefakty.webp'), aart = fs.existsSync(ameta) && fs.existsSync(aimg) ? { ...JSON.parse(fs.readFileSync(ameta, 'utf8')), png: b85(fs.readFileSync(aimg)), webp: 1 } : null;
  // Obiekty mapy wypalone z 3D (tools/grafika3d/wypal-mape.js): { d, f: klucz -> [x, y, w, h, ax, ay], png: arkusz WebP }
  const mmeta = path.join(gdir, 'mapa.json'), mimg = path.join(gdir, 'mapa.webp'), mart = fs.existsSync(mmeta) && fs.existsSync(mimg) ? { ...JSON.parse(fs.readFileSync(mmeta, 'utf8')), png: b85(fs.readFileSync(mimg)), webp: 1 } : null;
  // Tła bitew malowane przez AI (tools/tla-ai, szkice: szkic-bitwy.js): nazwa terenu -> WebP pola bitwy
  const bdir = path.join(gdir, 'bitwy'), bart = {}; if (fs.existsSync(bdir)) for (const f of fs.readdirSync(bdir)) if (f.endsWith('.webp')) bart[f.replace('.webp', '')] = { png: b85(fs.readFileSync(path.join(bdir, f))), webp: 1 };
  const smeta = path.join(gdir, 'umiejetnosci.json'), simg = path.join(gdir, 'umiejetnosci.webp'), sart = fs.existsSync(smeta) && fs.existsSync(simg) ? { ...JSON.parse(fs.readFileSync(smeta, 'utf8')), png: b85(fs.readFileSync(simg)), webp: 1 } : null;
  const cmeta = path.join(gdir, 'czary.json'), cimg = path.join(gdir, 'czary.webp'), spart = fs.existsSync(cmeta) && fs.existsSync(cimg) ? { ...JSON.parse(fs.readFileSync(cmeta, 'utf8')), png: b85(fs.readFileSync(cimg)), webp: 1 } : null;
  const umeta = path.join(gdir, 'interfejs.json'), uimg = path.join(gdir, 'interfejs.webp'), uiart = fs.existsSync(umeta) && fs.existsSync(uimg) ? { ...JSON.parse(fs.readFileSync(umeta, 'utf8')), png: b85(fs.readFileSync(uimg)), webp: 1 } : null;
  // Efekty dźwiękowe (tools/dzwieki/wybierz.py, próbki CC0): nazwa_wariant -> MP3 base64
  const sdir = path.join(SRC, 'dzwieki'), snd = {}; if (fs.existsSync(sdir)) for (const f of fs.readdirSync(sdir).sort()) if (f.endsWith('.mp3')) snd[f.replace('.mp3', '')] = b85(fs.readFileSync(path.join(sdir, f)));
  // Muzyka (tools/muzyka/wypal.py: kompozycje MIDI renderowane bankiem GeneralUser GS): nazwa -> { d: MP3 base64, loop: długość pętli w s }
  const mdir = path.join(SRC, 'muzyka'), mus = {}, mloops = fs.existsSync(path.join(mdir, 'petle.json')) ? JSON.parse(fs.readFileSync(path.join(mdir, 'petle.json'), 'utf8')) : {};
  if (fs.existsSync(mdir)) for (const f of fs.readdirSync(mdir).sort()) if (f.endsWith('.mp3')) { const n = f.replace('.mp3', ''); mus[n] = { d: b85(fs.readFileSync(path.join(mdir, f))), loop: mloops[n] || 0 }; }
  const artJs = `// Wbudowane przez build.js z src/grafika (wypalone przez tools/grafika3d i tools/portrety-ai): klatki jednostek i bohaterów, portrety\nconst UNIT_ART = ${JSON.stringify(art)};\nconst HERO_ART = ${JSON.stringify(hart)};\nconst HERO_PORTRAITS = ${JSON.stringify(port)};\nconst TOWN_BUILD_ART = ${JSON.stringify(tart)};\nconst ARTIFACT_ART = ${JSON.stringify(aart)};\nconst MAP3D_ART = ${JSON.stringify(mart)};\nconst BATTLE_BG_ART = ${JSON.stringify(bart)};\nconst SKILL_ART = ${JSON.stringify(sart)};\nconst UI_ART = ${JSON.stringify(uiart)};\nconst SPELL_ART = ${JSON.stringify(spart)};\nconst SOUND_ART = ${JSON.stringify(snd)};\nconst MUSIC_ART = ${JSON.stringify(mus)};\n`;
  // Biblioteka PeerJS (npm peerjs, licencja MIT): połączenia WebRTC między graczami online, osobny <script> przed kodem gry
  const peerjs = fs.readFileSync(path.join(__dirname, 'node_modules', 'peerjs', 'dist', 'peerjs.min.js'), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '');
  return shell.replace('@@BIBLIOTEKI@@', () => peerjs).replace('@@CZCIONKI@@', () => faces).replace('@@SKRYPT@@\n', () => artJs + js);
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
