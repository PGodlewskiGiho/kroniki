# Szkic kompozycji obrazu menu głównego (img2img: generuj.py maluje na nim): 2:1, bohater na skalnej iglicy po lewej (od tyłu,
# czerwona peleryna, chorągiew), obok na kamiennym pulpicie otwarta księga kronik, z której spiralą wznosi się złote światło;
# dolina królestw o zachodzie słońca z rzeką i zamkami na wzgórzach, góry, smok w chmurach. Prawa strona i środek u góry
# spokojniejsze (tam stoi panel menu i tytuł).   python szkic.py [wyjście.png]
import math, random, sys
from PIL import Image, ImageDraw, ImageFilter

W, H = 1024, 512
R = random.Random(7)
img = Image.new('RGB', (W, H))
px = img.load()
# niebo: od chłodnego granatu u góry, przez fiolet, do złota nad horyzontem (słońce za doliną, nieco w prawo od środka)
SUN = (600, 250)
for y in range(H):
    t = y / 260
    for x in range(W):
        d = math.hypot(x - SUN[0], (y - SUN[1]) * 1.6)
        top = (34, 38, 78); mid = (150, 80, 110); low = (250, 180, 90)
        k = min(1, max(0, t))
        c = [top[i] + (mid[i] - top[i]) * min(1, k * 1.4) for i in range(3)]
        if k > 0.6: c = [c[i] + (low[i] - c[i]) * min(1, (k - 0.6) / 0.4) for i in range(3)]
        g = max(0, 1 - d / 420) ** 2
        c = [min(255, c[i] + (255 - c[i]) * g * (0.9 if i < 2 else 0.6)) for i in range(3)]
        px[x, y] = tuple(int(v) for v in c)
d = ImageDraw.Draw(img, 'RGBA')
# chmury: smugi podświetlone od dołu
for i in range(26):
    cx, cy, w, h = R.uniform(0, W), R.uniform(30, 210), R.uniform(80, 260), R.uniform(14, 34)
    d.ellipse([cx - w, cy - h, cx + w, cy + h], fill=(70, 52, 90, 120))
    d.ellipse([cx - w * 0.8, cy + h * 0.1, cx + w * 0.8, cy + h * 0.9], fill=(255, 190, 120, 70))
# promienie słońca
for a in range(-60, 61, 12):
    r = math.radians(a - 90); d.polygon([SUN, (SUN[0] + math.cos(r - 0.03) * 700, SUN[1] + math.sin(r - 0.03) * 700), (SUN[0] + math.cos(r + 0.03) * 700, SUN[1] + math.sin(r + 0.03) * 700)], fill=(255, 220, 160, 22))
d.ellipse([SUN[0] - 34, SUN[1] - 34, SUN[0] + 34, SUN[1] + 34], fill=(255, 245, 210, 255))
# dalekie góry (niebieskawe), bliższe pasma (fioletowo-brązowe)
def ridge(y0, amp, col, seed, step=6):
    rr = random.Random(seed); pts = [(0, H)]; y = y0
    for x in range(0, W + step, step):
        y += rr.uniform(-amp, amp) * 0.35; y = min(y0 + amp, max(y0 - amp, y)); pts.append((x, y))
    pts.append((W, H)); d.polygon(pts, fill=col)
ridge(262, 40, (120, 96, 130, 255), 3); ridge(286, 30, (96, 74, 100, 255), 5)
# dolina: pola i lasy w złotym świetle, rzeka wijąca się ku słońcu
d.polygon([(0, 300), (W, 296), (W, H), (0, H)], fill=(86, 92, 54, 255))
for i in range(160):
    x, y = R.uniform(0, W), R.uniform(300, H); s = R.uniform(6, 30) * (y - 280) / 200
    d.ellipse([x - s, y - s * 0.4, x + s, y + s * 0.4], fill=R.choice([(60, 74, 40, 200), (120, 116, 60, 180), (44, 60, 36, 200)]))
river = [(SUN[0] - 10, 300), (640, 318), (560, 340), (650, 370), (780, 410), (720, 460), (820, 512)]
for wdt, col in [(30, (255, 200, 120, 255)), (18, (255, 230, 170, 255))]:
    for (a, b) in zip(river, river[1:]):
        k = (a[1] - 290) / 220; d.line([a, b], fill=col, width=int(4 + wdt * k))
# zamki na wzgórzach (sylwetki z oświetlonymi oknami): różne kształty frakcji
def castle(x, y, s, style):
    s *= 1.45; c = (196, 178, 150, 255); sh = (140, 120, 104, 255); roof = (170, 52, 44, 255)
    d.polygon([(x - 70 * s, y + 18 * s), (x - 40 * s, y - 6 * s), (x + 40 * s, y - 6 * s), (x + 70 * s, y + 18 * s)], fill=(70, 70, 46, 255)) # wzgórze
    d.rectangle([x - 26 * s, y - 34 * s, x + 26 * s, y], fill=c); d.rectangle([x + 8 * s, y - 34 * s, x + 26 * s, y], fill=sh)
    for dx in (-26, 26):
        d.rectangle([x + dx * s - 7 * s, y - 52 * s, x + dx * s + 7 * s, y], fill=c)
        if style == 'cone': d.polygon([(x + dx * s - 9 * s, y - 52 * s), (x + dx * s, y - 72 * s), (x + dx * s + 9 * s, y - 52 * s)], fill=roof)
        if style == 'dome': d.ellipse([x + dx * s - 9 * s, y - 62 * s, x + dx * s + 9 * s, y - 44 * s], fill=(80, 110, 120, 255))
        if style == 'spire': d.polygon([(x + dx * s - 6 * s, y - 52 * s), (x + dx * s, y - 90 * s), (x + dx * s + 6 * s, y - 52 * s)], fill=c)
    d.rectangle([x - 9 * s, y - 70 * s, x + 9 * s, y - 30 * s], fill=c); d.polygon([(x - 11 * s, y - 70 * s), (x, y - 96 * s), (x + 11 * s, y - 70 * s)], fill=roof)
    for i in range(5): d.rectangle([x - 20 * s + i * 10 * s, y - 22 * s, x - 17 * s + i * 10 * s, y - 16 * s], fill=(255, 210, 120, 255))
castle(470, 300, 0.55, 'cone'); castle(720, 298, 0.5, 'dome'); castle(880, 330, 0.75, 'spire'); castle(560, 360, 0.8, 'cone'); castle(980, 300, 0.4, 'dome')
# smok w chmurach (ciemna sylwetka z rozpostartymi skrzydłami), prawa górna część
def dragon(x, y, s):
    c = (40, 30, 44, 255)
    d.polygon([(x - 60 * s, y), (x - 10 * s, y - 6 * s), (x + 30 * s, y - 2 * s), (x + 60 * s, y - 12 * s), (x + 30 * s, y + 6 * s), (x - 10 * s, y + 6 * s)], fill=c)
    d.polygon([(x - 6 * s, y - 2 * s), (x - 50 * s, y - 60 * s), (x - 20 * s, y - 40 * s), (x + 10 * s, y - 70 * s), (x + 14 * s, y - 2 * s)], fill=c)
    d.polygon([(x + 4 * s, y + 4 * s), (x - 30 * s, y + 46 * s), (x + 24 * s, y + 10 * s)], fill=c)
dragon(840, 120, 1.25)
# skalna iglica na pierwszym planie po lewej, ciemna, z ciepłą krawędzią od słońca
cliff = [(0, H), (0, 250), (40, 236), (92, 226), (150, 214), (205, 210), (250, 222), (285, 250), (300, 290), (322, 340), (360, 400), (400, 450), (430, H)]
d.polygon(cliff, fill=(46, 36, 40, 255))
for (a, b) in zip(cliff[3:8], cliff[4:9]): d.line([a, b], fill=(220, 140, 80, 255), width=4)
for i in range(40):
    x, y = R.uniform(10, 360), R.uniform(240, H); d.line([(x, y), (x + R.uniform(-30, 30), y + R.uniform(10, 50))], fill=(30, 24, 28, 160), width=2)
# kamienny pulpit z otwartą księgą i złotym światłem wznoszącym się spiralą
lx, ly = 232, 214
BK = 1.7
d.polygon([(lx - 14 * BK, ly), (lx + 14 * BK, ly), (lx + 10 * BK, ly - 34 * BK), (lx - 10 * BK, ly - 34 * BK)], fill=(120, 110, 104, 255))
d.polygon([(lx - 30 * BK, ly - 34 * BK), (lx + 30 * BK, ly - 34 * BK), (lx + 24 * BK, ly - 44 * BK), (lx - 24 * BK, ly - 44 * BK)], fill=(140, 128, 120, 255))
d.polygon([(lx - 32 * BK, ly - 45 * BK), (lx, ly - 38 * BK), (lx + 32 * BK, ly - 45 * BK), (lx + 30 * BK, ly - 42 * BK), (lx, ly - 35 * BK), (lx - 30 * BK, ly - 42 * BK)], fill=(110, 40, 30, 255)); d.polygon([(lx - 30 * BK, ly - 46 * BK), (lx, ly - 40 * BK), (lx + 30 * BK, ly - 46 * BK), (lx + 26 * BK, ly - 54 * BK), (lx, ly - 48 * BK), (lx - 26 * BK, ly - 54 * BK)], fill=(255, 244, 210, 255))
glow = Image.new('L', (W, H), 0); gd = ImageDraw.Draw(glow)
for i in range(120):
    t = i / 120; a = t * 7 * math.pi; r = 8 + t * 70; gx, gy = lx + math.cos(a) * r, ly - 50 * BK - t * 200
    gd.ellipse([gx - 8, gy - 8, gx + 8, gy + 8], fill=int(255 * (1 - t * 0.6)))
gd.ellipse([lx - 40, ly - 60 * BK - 30, lx + 40, ly - 60 * BK + 30], fill=200)
glow = glow.filter(ImageFilter.GaussianBlur(10))
img.paste(Image.new('RGB', (W, H), (255, 214, 120)), (0, 0), glow)
d = ImageDraw.Draw(img, 'RGBA')
# bohater od tyłu na krawędzi: czerwona peleryna, hełm, chorągiew na drzewcu
hx, hy = 150, 214
d.polygon([(hx - 18, hy), (hx + 18, hy), (hx + 24, hy - 70), (hx + 10, hy - 92), (hx - 10, hy - 92), (hx - 26, hy - 66)], fill=(150, 30, 34, 255)) # peleryna
d.polygon([(hx + 24, hy - 70), (hx + 52, hy - 64), (hx + 22, hy - 50)], fill=(150, 30, 34, 255)) # łopocząca peleryna
d.ellipse([hx - 9, hy - 110, hx + 9, hy - 90], fill=(120, 120, 130, 255)) # hełm
d.rectangle([hx - 14, hy - 94, hx + 14, hy - 84], fill=(110, 110, 120, 255)) # naramienniki
d.line([(hx - 22, hy + 4), (hx - 30, hy - 150)], fill=(60, 40, 30, 255), width=4) # drzewce
d.polygon([(hx - 30, hy - 150), (hx - 90, hy - 140), (hx - 70, hy - 124), (hx - 92, hy - 106), (hx - 30, hy - 112)], fill=(40, 70, 150, 255)) # chorągiew
img = img.filter(ImageFilter.GaussianBlur(1.2))
img.save(sys.argv[1] if len(sys.argv) > 1 else 'szkic-menu.png')
