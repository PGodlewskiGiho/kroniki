# Wybrane portrety (wybrane.json: bohater -> ziarno, opcjonalnie kadr [x, y, bok] w pikselach obrazu 512×512)
# zmniejsza do 72×72 z lekkim wyostrzeniem i zapisuje w src/grafika/portrety/ + portrety.json (imię -> plik);
# build.js wbudowuje je w grę. Do tego galeria kandydatów: python wybierz.py --galeria plik.png [bohaterowie]
import json, os, sys
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
from generuj import slug, HERE

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT, META, SIZE = os.path.join(ROOT, 'src', 'grafika', 'portrety'), os.path.join(ROOT, 'src', 'grafika', 'portrety.json'), 72

# Obróbka jak w portretach H3: ciasny kadr na twarz, mocne nasycenie i kontrast, paleta 256 kolorów z ditheringiem
CROP = (66, 16, 380)  # domyślny kadr (x, y, bok) z obrazu 512×512: twarz wypełnia portret
def shrink(img, crop=None):
    x, y, s = crop or CROP; img = img.crop((x, y, x + s, y + s))
    img = ImageEnhance.Color(img).enhance(1.35); img = ImageEnhance.Contrast(img).enhance(1.12)
    while img.width > SIZE * 2: img = img.resize((img.width // 2, img.height // 2), Image.LANCZOS)
    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=70, threshold=2))
    return img.quantize(256, dither=Image.Dither.FLOYDSTEINBERG).convert('RGB')

def gallery(path, names):
    rows = []
    for name in names:
        d = os.path.join(HERE, '.cache', slug(name))
        files = sorted(f for f in os.listdir(d) if f.endswith('.png')) if os.path.isdir(d) else []
        rows.append((name, [(f[:-4], Image.open(os.path.join(d, f)).convert('RGB')) for f in files]))
    cols = max([len(r[1]) for r in rows] + [1]); W, H = 160, 160
    sheet = Image.new('RGB', (cols * (W * 2 + 8) + 8, len(rows) * (H + 20) + 8), (26, 22, 18)); g = ImageDraw.Draw(sheet)
    for r, (name, imgs) in enumerate(rows):
        for c, (seed, im) in enumerate(imgs):
            x, y = 8 + c * (W * 2 + 8), 8 + r * (H + 20)
            sheet.paste(im.resize((W, H), Image.LANCZOS), (x, y)); sheet.paste(shrink(im).resize((W, H), Image.NEAREST), (x + W, y))
            g.text((x + 2, y + H + 3), f'{name} {seed}', fill=(230, 220, 200))
    sheet.save(path)

def main():
    if '--galeria' in sys.argv:
        i = sys.argv.index('--galeria'); names = sys.argv[i + 2].split(',') if len(sys.argv) > i + 2 else list(json.load(open(os.path.join(HERE, 'bohaterowie.json'), encoding='utf-8')))
        return gallery(sys.argv[i + 1], [n for n in names if not n.startswith('_')])
    pick = json.load(open(os.path.join(HERE, 'wybrane.json'), encoding='utf-8')); os.makedirs(OUT, exist_ok=True); meta = {}
    for name, p in pick.items():
        seed, crop = (p, None) if isinstance(p, int) else (p['ziarno'], p.get('kadr'))
        f = slug(name) + '.png'; shrink(Image.open(os.path.join(HERE, '.cache', slug(name), f'{seed}.png')).convert('RGB'), crop).save(os.path.join(OUT, f), optimize=True); meta[name] = f
    json.dump(meta, open(META, 'w', encoding='utf-8'), ensure_ascii=False, indent=0); print(len(meta), 'portretów ->', OUT)

if __name__ == '__main__':
    main()
