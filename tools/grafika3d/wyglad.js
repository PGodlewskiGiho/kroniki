// Zmiana wyglądu (look) jednostek w danych gry bez ręcznego szukania w długich liniach:
//   node tools/grafika3d/wyglad.js zmiany.json   gdzie zmiany.json = { "<cid>": { "cecha": wartość, "usuń": null } }
// Szuka linii definicji jednostki (`  cid: …look: { … }`) w src/js/*.js, podmienia obiekt look i zapisuje plik.
'use strict';
const fs = require('fs'), path = require('path'), DIR = path.join(__dirname, '..', '..', 'src', 'js');
const lit = v => typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : Array.isArray(v) ? `[${v.map(lit).join(', ')}]` : v && typeof v === 'object' ? `{ ${Object.entries(v).map(([k, x]) => `${/^[a-zA-Z_]\w*$/.test(k) ? k : `'${k}'`}: ${lit(x)}`).join(', ')} }` : String(v);
const changes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => path.join(DIR, f)), src = {};
for (const f of files) src[f] = fs.readFileSync(f, 'utf8').split('\n');
for (const [id, ch] of Object.entries(changes)) {
  let hit = null;
  for (const f of files) { const i = src[f].findIndex(l => new RegExp(`^\\s*${id}: `).test(l) && l.includes('look: {')); if (i >= 0) { hit = [f, i]; break; } }
  if (!hit) { console.log('brak:', id); continue; }
  const [f, i] = hit, line = src[f][i], s = line.indexOf('look: {') + 6; let d = 0, e = s;
  for (; e < line.length; e++) { if (line[e] === '{') d++; else if (line[e] === '}' && --d === 0) break; }
  const look = Function(`return (${line.slice(s, e + 1)})`)();
  for (const [k, v] of Object.entries(ch)) if (v === null) delete look[k]; else look[k] = v;
  src[f][i] = line.slice(0, s) + lit(look) + line.slice(e + 1); console.log(id, '→', lit(look));
}
for (const f of files) fs.writeFileSync(f, src[f].join('\n'));
