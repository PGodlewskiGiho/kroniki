// Podgląd modeli 3D: galeria jednostek do pliku PNG (do oceny wyglądu przed wypaleniem).
//   node tools/grafika3d/podglad.js [plik.png] [rodzaj|lista cid po przecinku] [poza: idle|walk|attack|hurt|dead]
'use strict';
const path = require('path');
const fs = require('fs');
const { ROOT, CACHE, openStudio } = require('./wspolne');
(async () => {
  if (process.argv[2] === '--animacja') {
    const id = process.argv[3], meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/grafika/jednostki.json'), 'utf8'))[id];
    if (!meta) throw new Error(`Brak klatek jednostki: ${id}`);
    const out = path.resolve(process.argv[4] || path.join(CACHE, `${id}.html`));
    const name = process.argv[5] || id, escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const ext = fs.existsSync(path.join(ROOT, 'src/grafika/jednostki', `${id}.webp`)) ? 'webp' : 'png';
    const image = fs.readFileSync(path.join(ROOT, 'src/grafika/jednostki', `${id}.${ext}`)).toString('base64');
    const poses = { idle: 'Spoczynek', walk: 'Chód', attack: 'Atak', hurt: 'Zranienie', dead: 'Śmierć', map: 'Mapa', fly: 'Lot' };
    const choices = Object.keys(meta.f).map(pose => `<label><input type="radio" name="pose" value="${pose}" ${pose === 'idle' ? 'checked' : ''}><span>${poses[pose] || pose}</span></label>`).join('');
    const html = `<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(name)}</title>
<style>
:root{--ink:#25312e;--accent:#146b59;--line:#cbd1cb;--paper:#f3f5f2}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--paper);font-family:Georgia,serif}main{max-width:1040px;margin:auto;padding:24px}h1{font-size:28px;font-weight:normal;margin:0 0 18px;letter-spacing:0}canvas{display:block;width:100%;height:auto;aspect-ratio:3/2;background-color:#dce2dc;background-image:linear-gradient(45deg,#d1d9d1 25%,transparent 25%,transparent 75%,#d1d9d1 75%),linear-gradient(45deg,#d1d9d1 25%,transparent 25%,transparent 75%,#d1d9d1 75%);background-size:32px 32px;background-position:0 0,16px 16px}fieldset{padding:0;margin:18px 0;border:0;display:flex;flex-wrap:wrap;gap:6px}fieldset label{position:relative}fieldset input{position:absolute;opacity:0}fieldset span{display:block;padding:8px 12px;border-bottom:2px solid var(--line);font-size:15px}fieldset input:checked+span{border-color:var(--accent);color:var(--accent)}fieldset input:focus-visible+span{outline:2px solid var(--accent)}footer{display:flex;align-items:center;flex-wrap:wrap;gap:20px;font-size:15px}footer label{display:flex;align-items:center;gap:8px}input{accent-color:var(--accent)}input[type=range]{width:120px}output{min-width:4ch;font-family:monospace}@media(max-width:600px){main{padding:16px}h1{font-size:24px}fieldset span{padding:8px}footer{gap:12px}}
</style><main><h1>${escape(name)}</h1><canvas width="960" height="640" aria-label="${escape(name)}"></canvas><fieldset aria-label="Poza">${choices}</fieldset><footer><label><input id="play" type="checkbox" checked>Animacja</label><label>Tempo<input id="speed" type="range" min="0.25" max="2" value="1" step="0.25"><output id="rate">1×</output></label><label><input id="flip" type="checkbox">Odbicie</label></footer></main>
<script>
const art=${JSON.stringify(meta).replace(/</g, '\\u003c')}, image=new Image(), canvas=document.querySelector('canvas'), context=canvas.getContext('2d');
const play=document.querySelector('#play'), speed=document.querySelector('#speed'), flip=document.querySelector('#flip');
let pose='idle', elapsed=0, previous=0;
const rows=Object.entries(art.f).filter(([key])=>key!=='map').flatMap(([,row])=>row), boundsLeft=Math.min(...rows.map(frame=>-frame[4])), boundsRight=Math.max(...rows.map(frame=>frame[2]-frame[4])), boundsTop=Math.min(...rows.map(frame=>-frame[5])), boundsBottom=Math.max(...rows.map(frame=>frame[3]-frame[5]));
const scale=Math.min(canvas.width*.76/(boundsRight-boundsLeft),canvas.height*.8/(boundsBottom-boundsTop)), anchorX=canvas.width/2-(boundsLeft+boundsRight)*scale/2, anchorY=canvas.height*.9-boundsBottom*scale;
document.querySelectorAll('[name=pose]').forEach(input=>input.addEventListener('change',()=>{pose=input.value;elapsed=0;}));
speed.addEventListener('input',()=>{document.querySelector('#rate').value=speed.value+'×';});
image.onload=()=>requestAnimationFrame(draw);image.src='data:image/${ext};base64,${image}';
function draw(now){if(previous&&play.checked)elapsed+=Math.min(now-previous,100)*Number(speed.value)/1000;previous=now;const row=art.f[pose], duration=pose==='attack'?1.4:pose==='walk'?1:pose==='idle'?2:1,index=Math.floor(elapsed/duration*row.length)%row.length;const [sx,sy,width,height,ax,ay]=row[index], size=pose==='map'?scale*art.mu/art.u:scale;context.clearRect(0,0,canvas.width,canvas.height);context.save();context.imageSmoothingQuality='high';if(flip.checked){context.translate(canvas.width,0);context.scale(-1,1);}context.drawImage(image,sx,sy,width,height,anchorX-ax*size,anchorY-ay*size,width*size,height*size);context.restore();canvas.dataset.pose=pose;canvas.dataset.frame=index;requestAnimationFrame(draw);}
</script></html>`;
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
    console.log(out); return;
  }
  const out = path.resolve(process.argv[2] || 'podglad.png'), which = process.argv[3] || 'hum', pose = process.argv[4] || 'idle', zoom = +(process.argv[5] || 1), dens = +(process.argv[6] || 1); // dens: gęstość renderu (szczegóły)
  const { browser, page, errors } = await openStudio();
  const n = await page.evaluate(([which, pose, zoom, dens]) => {
    const ids = which.includes(',') || CREATURES[which] ? which.split(',') : Object.keys(CREATURES).filter(id => CREATURES[id].look.kind === which);
    document.body.innerHTML = ''; document.body.style.background = '#3e5a30';
    const cv = document.createElement('canvas'); cv.width = 1440; cv.height = 900; document.body.appendChild(cv); const ctx = cv.getContext('2d'); ctx.font = '11px sans-serif'; ctx.fillStyle = '#fff';
    const P = pose === 'walk' ? { walk: 0.25 } : pose === 'fly' ? { fly: 0.25 } : pose === 'fly2' ? { fly: 0.75 } : pose === 'attack' ? { atk: 0.55 } : pose === 'wind' ? { atk: 0.3 } : pose === 'hurt' ? { hurt: true } : { t: 0 };
    ids.forEach((id, i) => {
      const L = CREATURES[id].look, g0 = buildUnit(L, P); if (!g0) return; const g = pose === 'dead' ? layDead(g0, L) : g0;
      const c = G3.render(g, 118 * dens, 136 * dens, 24.6 * dens, 59 * dens, 114 * dens), cols = Math.floor(12 / zoom), x = (i % cols) * 120 * zoom, y = Math.floor(i / cols) * 150 * zoom; ctx.imageSmoothingEnabled = false; ctx.drawImage(c, x, y, 118 * zoom, 136 * zoom); ctx.fillText(id, x + 4, y + 140 * zoom);
    });
    return ids.length;
  }, [which, pose, zoom, dens]);
  await page.screenshot({ path: out }); console.log(n, 'jednostek ->', out, errors.slice(0, 5)); await browser.close();
})();
