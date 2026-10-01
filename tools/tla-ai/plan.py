# Plan ułożenia na namalowanym tle, bez renderu: obrys podstawy każdej budowli (prostokąt w świecie rzutowany na ziemię)
# i jej sylwetka (szer. × wys. w px), z wymiarów z grafika3d/wymiary.js. Czerwone = podstawy nachodzą na siebie w świecie.
#   python plan.py frakcja [tło.png] [wynik.png]
import sys, json
from PIL import Image, ImageDraw
fac = sys.argv[1]; U = json.load(open(f'uklady/{fac}.json')); W = json.load(open(f'uklady/{fac}-wymiary.json'))
bg = sys.argv[2] if len(sys.argv) > 2 else 'tla/' + U['tlo']; out = sys.argv[3] if len(sys.argv) > 3 else f'.cache/plan-{fac}.png'
hor, d, f = U['pj']['hor'], U['pj']['d'], U['pj']['f']; K = 2
im = Image.open(bg).convert('RGB').resize((576 * K, 422 * K), Image.LANCZOS); g = ImageDraw.Draw(im, 'RGBA')
def scr(X, Z, e=0): return ((296 + f * X / Z - 8) * K, (hor + f * (d - e) / Z - 8) * K)
R = []
for i, o in enumerate(U['slots']):
    m = W[str(i)]; sx, sy = o['s']; zw = o['z'] * 1000 if o.get('z') else f * d / (sy - hor); X = (sx - 296) * zw / f; e = d - (sy - hor) * zw / f; k = o.get('k', 1)
    w, back, front, h = m['w'] * k, m['back'] * k, m['front'] * k, m['h'] * k
    R.append((i, m['key'], X - w / 2, X + w / 2, zw - front, zw + back, zw, X, e, w, h))
bad = set()
for a in R:
    for b in R:
        if a[0] < b[0] and a[2] < b[3] - 10 and b[2] < a[3] - 10 and a[4] < b[5] - 10 and b[4] < a[5] - 10: bad |= {a[0], b[0]}
for i, key, x0, x1, z0, z1, zw, X, e, w, h in sorted(R, key=lambda r: -r[6]):
    col = (255, 60, 60) if i in bad else (255, 230, 0)
    g.polygon([scr(x0, z0, e), scr(x1, z0, e), scr(x1, z1, e), scr(x0, z1, e)], fill=col + (70,), outline=col + (255,))
    bx, by = scr(X, zw, e); s = f / zw * K
    g.rectangle([bx - w / 2 * s, by - h * s, bx + w / 2 * s, by], outline=(120, 200, 255, 200), width=1)
    g.ellipse([bx - 4, by - 4, bx + 4, by + 4], fill=col + (255,)); g.rectangle([bx + 5, by - 14, bx + 70, by], fill=(0, 0, 0, 170)); g.text((bx + 7, by - 13), f'{i} {key}', fill='white')
g.line([(0, (hor - 8) * K), (576 * K, (hor - 8) * K)], fill=(255, 0, 255, 160))
im.save(out); print(out, 'kolizje:', sorted(bad))
