# Szkice kolejnych obrazów (jak szkice.py; img2img w generuj.py):
#   zbrojownia – tło ekranu bohatera: kamienna zbrojownia, stojaki z bronią, tarcze i chorągwie na ścianach, pochodnie
#   manekin    – panel ekwipunku (pion 2:3): drewniany stojak ze zbroją, hełmem i peleryną we wnęce, blask pochodni
#   sala       – tło wokół miasta i okien: ściana zamkowej sali z gobelinami, filary, świeczniki
#   pozegnanie – wyjście z gry: jeździec odjeżdża drogą w stronę zachodu słońca, zamek za nim
#   python szkice2.py nazwa wyjście.png
import math, random, sys
from PIL import Image, ImageDraw, ImageFilter
import szkice as S
from szkice import W, H, gradient, glow, banner, castle

R = random.Random(23)


def stone_wall(d, x0, y0, x1, y1, base=(74, 66, 60)):
    d.rectangle([x0, y0, x1, y1], fill=base)
    for j, y in enumerate(range(y0, y1, 34)):
        off = 0 if j % 2 else 40
        for x in range(x0 - off, x1, 80):
            k = R.randint(-12, 12); c = tuple(max(0, min(255, v + k)) for v in base)
            d.rectangle([x + 2, y + 2, x + 78, y + 32], fill=c)


def torch(img, d, x, y):
    d.rectangle([x - 4, y, x + 4, y + 40], fill=(60, 40, 24)); d.polygon([(x - 10, y), (x, y - 34), (x + 10, y)], fill=(255, 190, 80))
    glow(img, [(x, y - 14, 120, 170)], (255, 170, 80), 40)


def sword(d, x, y, h, tilt=0): # ostrzem w dół, rękojeść u góry (na stojaku)
    d.polygon([(x - 5, y - h + 40), (x + 5, y - h + 40), (x + 3, y), (x, y + 10), (x - 3, y)], fill=(196, 200, 212))
    d.rectangle([x - 18, y - h + 34, x + 18, y - h + 42], fill=(150, 116, 50)); d.rectangle([x - 3, y - h + 6, x + 3, y - h + 34], fill=(70, 44, 26)); d.ellipse([x - 6, y - h, x + 6, y - h + 10], fill=(170, 136, 60))


def spear(d, x, y, h):
    d.line([(x, y), (x, y - h)], fill=(90, 62, 36), width=5); d.polygon([(x - 8, y - h), (x, y - h - 34), (x + 8, y - h)], fill=(200, 204, 214))


def axe(d, x, y, h):
    d.line([(x, y), (x, y - h)], fill=(90, 62, 36), width=6); d.polygon([(x, y - h + 6), (x + 34, y - h - 14), (x + 40, y - h + 26), (x, y - h + 34)], fill=(190, 194, 204))


def shield(d, x, y, r, col, rim=(180, 150, 70)):
    d.polygon([(x - r, y - r), (x + r, y - r), (x + r, y), (x, y + r * 1.4), (x - r, y)], fill=rim)
    k = r - 6; d.polygon([(x - k, y - k), (x + k, y - k), (x + k, y), (x, y + k * 1.4), (x - k, y)], fill=col)


def zbrojownia():
    img = Image.new('RGB', (W, H)); d = ImageDraw.Draw(img, 'RGBA'); stone_wall(d, 0, 0, W, 400)
    d.rectangle([0, 400, W, H], fill=(60, 46, 34))
    for i in range(0, W, 64): d.line([(i, 400), (i - 80, H)], fill=(44, 32, 24), width=3)
    for x0 in (20, 790): # stojaki z bronią po bokach: miecze, włócznie i topory
        d.rectangle([x0, 236, x0 + 214, 248], fill=(90, 60, 34)); d.rectangle([x0, 380, x0 + 214, 394], fill=(90, 60, 34))
        d.rectangle([x0, 236, x0 + 10, 400], fill=(80, 52, 30)); d.rectangle([x0 + 204, 236, x0 + 214, 400], fill=(80, 52, 30))
        for k in range(4): sword(d, x0 + 26 + k * 30, 380, 150)
        spear(d, x0 + 150, 392, 260); axe(d, x0 + 178, 392, 190)
    for x, col in ((320, (150, 30, 34)), (512, (40, 60, 140)), (704, (150, 30, 34))): shield(d, x, 150, 46, col)
    for x in (410, 614): banner(d, x, 0, 230, (130, 26, 30))
    for x in (250, 774): torch(img, d, x, 220)
    d = ImageDraw.Draw(img, 'RGBA'); d.rectangle([400, 300, 624, 420], fill=(100, 70, 40)); d.rectangle([400, 300, 624, 316], fill=(130, 92, 52)) # skrzynia
    glow(img, [(512, 260, 300, 60)], (255, 200, 140), 80)
    return img


def manekin():
    Wm, Hm = 512, 768; img = Image.new('RGB', (Wm, Hm)); d = ImageDraw.Draw(img, 'RGBA')
    for j, y in enumerate(range(0, Hm, 30)):
        for x in range(-(j % 2) * 36, Wm, 72): c = 48 + R.randint(-8, 8); d.rectangle([x + 2, y + 2, x + 70, y + 28], fill=(c, c - 4, c - 8))
    d.rounded_rectangle([96, 40, 416, 560], 140, fill=(28, 24, 22)) # wnęka
    cx = 256
    d.polygon([(cx - 120, 170), (cx + 120, 170), (cx + 150, 520), (cx - 150, 520)], fill=(120, 20, 26)) # peleryna za zbroją
    d.rectangle([cx - 8, 420, cx + 8, 600], fill=(90, 60, 34)); d.rectangle([cx - 70, 596, cx + 70, 612], fill=(90, 60, 34)) # stojak
    d.ellipse([cx - 40, 60, cx + 40, 150], fill=(160, 164, 176)); d.rectangle([cx - 30, 104, cx + 30, 112], fill=(30, 30, 34)) # hełm z wizjerem
    d.polygon([(cx - 90, 170), (cx + 90, 170), (cx + 70, 330), (cx + 40, 380), (cx - 40, 380), (cx - 70, 330)], fill=(170, 174, 186)) # napierśnik
    d.ellipse([cx - 120, 160, cx - 60, 220], fill=(150, 154, 166)); d.ellipse([cx + 60, 160, cx + 120, 220], fill=(150, 154, 166)) # naramienniki
    d.rectangle([cx - 70, 300, cx + 70, 318], fill=(110, 80, 40)) # pas
    d.polygon([(cx - 60, 380), (cx + 60, 380), (cx + 70, 440), (cx - 70, 440)], fill=(140, 144, 156)) # fartuch kolczy
    S_ = 1; glow(img, [(cx, 150, 200, 110)], (255, 200, 130), 60)
    d = ImageDraw.Draw(img, 'RGBA'); d.rectangle([0, 612, Wm, Hm], fill=(40, 32, 26))
    return img


def sala():
    img = Image.new('RGB', (W, H)); d = ImageDraw.Draw(img, 'RGBA'); stone_wall(d, 0, 0, W, H, (70, 62, 56))
    for x in (0, 250, 512, 774, 1000): d.rectangle([x - 26, 0, x + 26, H], fill=(96, 86, 76)); d.rectangle([x - 34, 0, x + 34, 30], fill=(110, 98, 86)) # filary
    for x0, col in ((60, (120, 28, 30)), (310, (34, 54, 110)), (572, (34, 54, 110)), (834, (120, 28, 30))): # gobeliny
        d.rectangle([x0, 60, x0 + 140, 400], fill=col); d.rectangle([x0, 60, x0 + 140, 76], fill=(180, 150, 70))
        d.polygon([(x0 + 40, 180), (x0 + 70, 130), (x0 + 100, 180), (x0 + 70, 260)], fill=(200, 170, 80))
        for k in range(7): d.polygon([(x0 + k * 20, 400), (x0 + k * 20 + 10, 416), (x0 + k * 20 + 20, 400)], fill=(180, 150, 70))
    for x in (250, 774): torch(img, d, x, 230)
    d = ImageDraw.Draw(img, 'RGBA'); d.rectangle([0, 440, W, H], fill=(56, 44, 34))
    return img


def pozegnanie():
    img = Image.new('RGB', (W, H)); gradient(img, [(0, (40, 30, 70)), (0.4, (200, 110, 70)), (0.58, (255, 190, 110)), (1, (60, 40, 30))], sun=(512, 290), sun_r=360, sun_col=(255, 230, 170))
    d = ImageDraw.Draw(img, 'RGBA')
    d.polygon([(0, 300), (300, 270), (620, 296), (W, 268), (W, H), (0, H)], fill=(70, 70, 60, 255)) # wzgórza
    castle(d, 840, 300, 0.7, wall=(90, 80, 80), sh=(70, 60, 62))
    d.polygon([(380, H), (500, 300), (524, 300), (700, H)], fill=(170, 140, 100, 255)) # droga ku słońcu
    x, y = 470, 440 # jeździec od tyłu
    d.ellipse([x - 40, y - 50, x + 40, y + 10], fill=(40, 30, 26)); d.rectangle([x - 34, y, x - 24, y + 50], fill=(40, 30, 26)); d.rectangle([x + 24, y, x + 34, y + 50], fill=(40, 30, 26))
    d.polygon([(x - 26, y - 40), (x + 26, y - 40), (x + 30, y - 110), (x - 30, y - 110)], fill=(150, 24, 28)); d.ellipse([x - 13, y - 140, x + 13, y - 110], fill=(120, 122, 130))
    d.line([(x + 30, y - 100), (x + 50, y - 200)], fill=(80, 60, 40), width=4); d.polygon([(x + 50, y - 200), (x + 90, y - 190), (x + 50, y - 176)], fill=(40, 60, 140))
    for i in range(6): bx, by = R.uniform(200, 800), R.uniform(80, 200); d.line([(bx - 10, by), (bx, by + 4), (bx + 10, by)], fill=(30, 20, 30), width=2) # ptaki
    d.polygon([(0, H), (0, 400), (260, 420), (330, H)], fill=(40, 46, 34, 255)); d.polygon([(W, H), (W, 390), (780, 430), (720, H)], fill=(40, 46, 34, 255))
    return img


def sztandar(): # pion 1:2: biały sztandar ze złotym herbem na ciemnym tle (kolor gracza nakłada gra)
    Ws, Hs = 384, 768; img = Image.new('RGB', (Ws, Hs), (22, 16, 12)); d = ImageDraw.Draw(img, 'RGBA')
    d.rectangle([40, 60, 344, 72], fill=(150, 116, 50)); d.ellipse([28, 54, 52, 78], fill=(190, 150, 60)); d.ellipse([332, 54, 356, 78], fill=(190, 150, 60))
    d.polygon([(64, 72), (320, 72), (320, 640), (192, 560), (64, 640)], fill=(200, 196, 188))
    d.line([(64, 72), (320, 72), (320, 640), (192, 560), (64, 640), (64, 72)], fill=(200, 160, 70), width=10)
    d.polygon([(192, 180), (262, 280), (192, 420), (122, 280)], fill=(210, 170, 70)); d.ellipse([162, 250, 222, 310], fill=(150, 110, 40))
    for k in range(5): d.line([(90 + k * 50, 90), (80 + k * 52, 600)], fill=(170, 166, 160), width=3) # fałdy
    glow(img, [(192, 200, 200, 70)], (255, 210, 150), 60)
    return img


if __name__ == '__main__':
    name, out = sys.argv[1], sys.argv[2]
    globals()[name]().filter(ImageFilter.GaussianBlur(1.2)).save(out)
