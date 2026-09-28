// Pobiera bazę do portretów: siatkę człowieka i cele (morfy) twarzy z MakeHuman (licencja CC0, github.com/makehumancommunity)
// i zapisuje z nich zwarty plik popiersia .cache/glowa.json (tylko głowa, szyja i barki). Uruchamiane samo przez wypal.js,
// gdy pliku brakuje; ręcznie: node tools/portrety3d/pobierz.js
'use strict';
const path = require('path'), fs = require('fs'), https = require('https');
const CACHE = path.join(__dirname, '.cache'), SRC = path.join(CACHE, 'mh'), OUT = path.join(CACHE, 'glowa.json');
const RAW = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/';
const FACE_GROUPS = ['head', 'forehead', 'eyebrows', 'neck', 'eyes', 'nose', 'mouth', 'ears', 'chin', 'cheek', 'torso'];
const MACRO = { gender: ['female', 'male'], age: ['baby', 'child', 'young', 'old'], muscle: ['minmuscle', 'averagemuscle', 'maxmuscle'], weight: ['minweight', 'averageweight', 'maxweight'], race: ['african', 'asian', 'caucasian'] };
const Y_CUT = 4.6; // dół popiersia (jednostki MakeHuman: dm, czubek głowy ≈ 8,3)

function get(url) {
  return new Promise((ok, bad) => https.get(url, r => {
    if (r.statusCode !== 200) { r.resume(); return bad(new Error(`${r.statusCode} ${url}`)); }
    const b = []; r.on('data', d => b.push(d)); r.on('end', () => ok(Buffer.concat(b).toString('utf8')));
  }).on('error', bad));
}
async function fetchAll(files) {
  fs.mkdirSync(SRC, { recursive: true }); let i = 0;
  const one = async () => { while (i < files.length) { const f = files[i++], dst = path.join(SRC, f.replace(/\//g, '__')); if (fs.existsSync(dst)) continue;
    for (let t = 0; ; t++) { try { fs.writeFileSync(dst, await get(RAW + f)); break; } catch (e) { if (t > 3 || /^404/.test(e.message)) throw e; await new Promise(r => setTimeout(r, 1000 * 2 ** t)); } } } };
  await Promise.all(Array.from({ length: 8 }, one));
}
const read = f => fs.readFileSync(path.join(SRC, f.replace(/\//g, '__')), 'utf8');

async function build() {
  await fetchAll(['3dobjs/base.obj', 'modifiers/modeling_modifiers.json']);
  const mods = JSON.parse(read('modifiers/modeling_modifiers.json')), targets = [];
  for (const g of mods) if (FACE_GROUPS.includes(g.group)) for (const m of g.modifiers) if (m.target) {
    for (const s of m.min ? [m.min, m.max] : [null]) targets.push(`${g.group}/${m.target}${s ? '-' + s : ''}`);
  }
  for (const ge of MACRO.gender) for (const a of MACRO.age) {
    for (const mu of MACRO.muscle) for (const w of MACRO.weight) targets.push(`macrodetails/universal-${ge}-${a}-${mu}-${w}`);
    for (const r of MACRO.race) targets.push(`macrodetails/${r}-${ge}-${a}`);
  }
  await fetchAll(targets.map(t => `targets/${t}.target`));
  // siatka: wierzchołki, UV, ściany z grupami (ciało, oczy, zęby, język, rzęsy, pomocnik włosów)
  const V = [], VT = [], faces = []; let grp = '';
  for (const l of read('3dobjs/base.obj').split('\n')) {
    if (l.startsWith('v ')) V.push(l.split(/\s+/).slice(1, 4).map(Number));
    else if (l.startsWith('vt ')) VT.push(l.split(/\s+/).slice(1, 3).map(Number));
    else if (l.startsWith('g ')) grp = l.slice(2).trim().replace(/-[12]$/, '');
    else if (l.startsWith('f ')) faces.push({ g: grp, v: l.split(/\s+/).slice(1).filter(Boolean).map(t => t.split('/').map(n => +n - 1)) });
  }
  const KEEP = ['body', 'helper-l-eye', 'helper-r-eye', 'helper-upper-teeth', 'helper-lower-teeth', 'helper-tongue', 'helper-hair', 'helper-l-eyelashes', 'helper-r-eyelashes'];
  const keep = faces.filter(f => KEEP.includes(f.g) && f.v.every(([vi]) => V[vi][1] > Y_CUT));
  const map = new Map(), verts = [], uvs = [], groups = {};
  const idx = (vi, ti) => { const k = vi + ':' + ti; if (!map.has(k)) { map.set(k, verts.length / 3); verts.push(...V[vi].map(x => +x.toFixed(4))); uvs.push(...(VT[ti] || [0, 0]).map(x => +x.toFixed(4))); } return map.get(k); };
  const orig = []; // numer wierzchołka MakeHuman dla każdego naszego (cele są po numerach MakeHuman)
  for (const f of keep) { const ids = f.v.map(([vi, ti]) => { const i = idx(vi, ti); orig[i] = vi; return i; }); (groups[f.g] = groups[f.g] || []).push(ids.length === 4 ? ids : [...ids, ids[2]]); }
  const inv = new Map(); orig.forEach((vi, i) => { if (!inv.has(vi)) inv.set(vi, []); inv.get(vi).push(i); });
  const tg = {};
  for (const t of targets) {
    const d = []; for (const l of read(`targets/${t}.target`).split('\n')) { if (!l || l[0] === '#') continue; const [i, x, y, z] = l.trim().split(/\s+/).map(Number); for (const j of inv.get(i) || []) d.push(j, +x.toFixed(4), +y.toFixed(4), +z.toFixed(4)); }
    if (d.length) tg[t] = d;
  }
  fs.writeFileSync(OUT, JSON.stringify({ license: 'MakeHuman base mesh and targets, CC0 (makehumancommunity.org)', verts, uvs, orig, groups, targets: tg, mods: mods.filter(g => FACE_GROUPS.includes(g.group)) }));
  console.log(`glowa.json: ${verts.length / 3} wierzchołków, ${Object.values(groups).reduce((a, g) => a + g.length, 0)} ścian, ${Object.keys(tg).length} celów, ${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB`);
}
module.exports = { build, OUT };
if (require.main === module) build().catch(e => { console.error(e.message); process.exit(1); });
