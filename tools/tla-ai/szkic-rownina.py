# Szkic tła miasta z otwartą równiną pod zabudowę (wniosek z Kniei: płaska ziemia od początku, rama tylko po bokach i w tle):
# niebo, postrzępione góry przy horyzoncie (ten sam co w układach: hor = 140 w kadrze gry), płaska ziemia w perspektywie przez
# ponad połowę kadru, wąskie pasy ramy (martwe drzewa / skały) przy krawędziach. Barwy z opisy.json → <frakcja>.szkic.
#   python szkic-rownina.py frakcja wynik.png
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
fac, out = sys.argv[1], sys.argv[2]; S = json.load(open('opisy.json', encoding='utf-8'))[fac]['szkic']
W, H = 768, 560; hor = int((140 - 8) * H / 422); rng = np.random.default_rng(5)
yy = np.mgrid[0:H, 0:W][0].astype(np.float32)
def lerp(a, b, t): return np.array(a, np.float32) * (1 - t) + np.array(b, np.float32) * t
t = np.clip(yy / hor, 0, 1)[..., None]; img = lerp(S['niebo'][0], S['niebo'][1], t)
tg = np.clip((yy - hor) / (H - hor), 0, 1)[..., None]; ziemia = lerp(S['ziemia'][0], S['ziemia'][1], tg ** 0.7)
n = np.asarray(Image.fromarray((rng.random((H // 6, W // 6)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32)[..., None] / 255
img = np.where(yy[..., None] >= hor, ziemia * (0.9 + 0.2 * n), img)
im = Image.fromarray(img.clip(0, 255).astype(np.uint8)); g = ImageDraw.Draw(im)
if S.get('ksiezyc'): x, y, r = S['ksiezyc']; g.ellipse([x - r, y - r, x + r, y + r], fill=tuple(S['ksiezyc_kolor']))
for warstwa, (h0, h1, col) in enumerate(S['gory']):  # pasma gór: dalsze jaśniejsze, bliższe ciemniejsze
    pts = [(0, hor + 4)]; x = 0
    while x < W: x += rng.integers(18, 46); pts.append((x, hor - h0 - rng.random() * (h1 - h0)))
    pts += [(W, hor + 4)]; g.polygon(pts, fill=tuple(col))
for _ in range(900):  # kępki suchej trawy i kamyki na równinie: tylko faktura, bez kształtów
    y = hor + 4 + (H - hor) * rng.random() ** 0.8; x = rng.random() * W; k = 0.3 + (y - hor) / (H - hor)
    c = tuple(int(v) for v in np.array(S['ziemia'][1]) * (0.7 + 0.6 * rng.random())); g.line([(x, y), (x + 6 * k, y - 2 * k)], fill=c, width=max(1, int(2 * k)))
def drzewo(x0, flip):  # martwe, sękate drzewo ramy: pień + gałęzie
    c = tuple(S['rama']); g.polygon([(x0 - 26, H), (x0 + 26, H), (x0 + 12, 120), (x0 - 10, 110)], fill=c)
    for i in range(7):
        y = 120 + i * 40; L = 60 + rng.random() * 90; d = 1 if (i % 2) ^ flip else -1; ang = -0.5 - rng.random() * 0.6
        g.line([(x0, y), (x0 + d * L, y + ang * L * 0.6), (x0 + d * L * 1.4, y + ang * L)], fill=c, width=max(3, 12 - i))
drzewo(30, 0); drzewo(W - 30, 1)
for x in (rng.random(4) * 120).tolist() + (W - rng.random(4) * 120).tolist():  # skały i nagrobki tylko przy brzegach u dołu
    y = H - 20 - rng.random() * 90; w = 14 + rng.random() * 18; g.rounded_rectangle([x - w / 2, y - w * 1.3, x + w / 2, y], radius=5, fill=tuple(S['skaly']))
mg = Image.new('L', (W, H), 0); ImageDraw.Draw(mg).rectangle([0, hor - 30, W, hor + 40], fill=110); mg = mg.filter(ImageFilter.GaussianBlur(18))  # mgła przy horyzoncie
im = Image.composite(Image.new('RGB', (W, H), tuple(S['mgla'])), im, mg)
im.filter(ImageFilter.GaussianBlur(1.2)).save(out); print(out)
