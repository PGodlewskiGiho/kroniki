# Szkice kompozycji kolejnych obrazów w stylu obrazu menu (img2img jak menu/szkic.py), 2:1:
#   ladowanie  – skryptorium nocą: otwarta księga kronik w blasku świec, pióro w kałamarzu, zwoje, mapa, okno z księżycem
#   zwyciestwo – świt: rycerz w czerwonej pelerynie na murach unosi miecz, chorągwie, zamek, wojsko wiwatuje w dole
#   porazka    – zmierzch: płonący zamek, dym, rycerz klęczy przy wbitym mieczu, porzucona chorągiew, kruki
# Środek obrazu zostaje spokojniejszy (napisy, wstęga, pergamin i przyciski gry).   python szkice.py nazwa wyjście.png
import math, random, sys
from PIL import Image, ImageDraw, ImageFilter

W, H = 1024, 512
R = random.Random(11)


def gradient(img, stops, sun=None, sun_r=380, sun_col=(255, 240, 200), sun_k=0.9):
    px = img.load()
    for y in range(H):
        t = y / H; a = max(i for i in range(len(stops)) if stops[i][0] <= t); b = min(a + 1, len(stops) - 1)
        f = 0 if a == b else (t - stops[a][0]) / (stops[b][0] - stops[a][0]); c = [stops[a][1][i] + (stops[b][1][i] - stops[a][1][i]) * f for i in range(3)]
        for x in range(W):
            cc = c
            if sun:
                g = max(0, 1 - math.hypot(x - sun[0], (y - sun[1]) * 1.5) / sun_r) ** 2
                cc = [min(255, c[i] + (sun_col[i] - c[i]) * g * sun_k) for i in range(3)]
            px[x, y] = tuple(int(v) for v in cc)


def glow(img, pts, col, blur):
    m = Image.new('L', (W, H)); g = ImageDraw.Draw(m)
    for x, y, r, a in pts: g.ellipse([x - r, y - r, x + r, y + r], fill=a)
    img.paste(Image.new('RGB', (W, H), col), (0, 0), m.filter(ImageFilter.GaussianBlur(blur)))


def castle(d, x, y, s, wall=(196, 178, 150), sh=(140, 120, 104), roof=(170, 52, 44), lit=True):
    d.rectangle([x - 90 * s, y - 60 * s, x + 90 * s, y], fill=wall); d.rectangle([x + 30 * s, y - 60 * s, x + 90 * s, y], fill=sh)
    for dx, h in [(-90, 110), (-30, 150), (30, 130), (90, 105)]:
        d.rectangle([x + (dx - 14) * s, y - h * s, x + (dx + 14) * s, y], fill=wall if dx < 30 else sh)
        if roof: d.polygon([(x + (dx - 18) * s, y - h * s), (x + dx * s, y - (h + 44) * s), (x + (dx + 18) * s, y - h * s)], fill=roof)
        if lit:
            for k in range(3): d.rectangle([x + (dx - 4) * s, y - (h - 20 - k * 26) * s, x + (dx + 4) * s, y - (h - 32 - k * 26) * s], fill=(255, 210, 120))
    for k in range(9): d.rectangle([x + (-86 + k * 20) * s, y - 70 * s, x + (-76 + k * 20) * s, y - 60 * s], fill=wall)


def banner(d, x, y, h, col, wave=0):
    d.line([(x, y), (x, y - h)], fill=(70, 50, 36), width=4)
    d.polygon([(x, y - h), (x + 60, y - h + 6 + wave), (x + 48, y - h + 24), (x + 62, y - h + 44 - wave), (x, y - h + 40)], fill=col)


def ladowanie():
    img = Image.new('RGB', (W, H)); gradient(img, [(0, (34, 26, 24)), (1, (20, 14, 12))]); d = ImageDraw.Draw(img, 'RGBA')
    for y in range(0, 330, 28): # mur z kamiennych bloków
        for x in range(-(y // 28 % 2) * 40, W, 80): d.rectangle([x + 2, y + 2, x + 78, y + 26], fill=(48 + R.randint(0, 12), 38, 34, 255))
    d.rectangle([760, 40, 940, 300], fill=(20, 22, 44, 255)); d.pieslice([760, -50, 940, 130], 180, 360, fill=(20, 22, 44, 255)) # okno łukowe
    d.rectangle([845, 0, 855, 300], fill=(50, 40, 36, 255)); d.rectangle([760, 150, 940, 158], fill=(50, 40, 36, 255))
    d.ellipse([880, 60, 920, 100], fill=(240, 236, 210, 255))
    for i in range(30): x, y = R.uniform(765, 935), R.uniform(10, 290); d.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(255, 255, 230, 255))
    d.rectangle([60, 70, 300, 240], fill=(170, 140, 96, 255)) # mapa na ścianie
    for i in range(12): d.line([(80 + R.uniform(0, 200), 90 + R.uniform(0, 130)), (80 + R.uniform(0, 200), 90 + R.uniform(0, 130))], fill=(110, 80, 50, 255), width=2)
    d.polygon([(0, 330), (W, 320), (W, H), (0, H)], fill=(90, 56, 30, 255)) # blat
    for i in range(10): d.line([(0, 340 + i * 17), (W, 330 + i * 17)], fill=(70, 42, 22, 255), width=2)
    bx, by = 512, 380
    d.polygon([(bx - 230, by + 20), (bx, by + 50), (bx + 230, by + 20), (bx + 220, by - 40), (bx, by - 10), (bx - 220, by - 40)], fill=(110, 30, 24, 255)) # okładka
    d.polygon([(bx - 214, by + 6), (bx, by + 34), (bx + 214, by + 6), (bx + 200, by - 60), (bx, by - 28), (bx - 200, by - 60)], fill=(240, 226, 190, 255)) # strony
    for i in range(9): d.line([(bx - 180, by - 40 + i * 8), (bx - 30, by - 18 + i * 8)], fill=(120, 90, 60, 255), width=2); d.line([(bx + 30, by - 18 + i * 8), (bx + 180, by - 40 + i * 8)], fill=(120, 90, 60, 255), width=2)
    for cx, h in [(150, 120), (200, 90), (110, 70)]: # świece
        d.rectangle([cx - 10, 360 - h, cx + 10, 360], fill=(236, 226, 196, 255)); d.ellipse([cx - 6, 340 - h, cx + 6, 362 - h], fill=(255, 210, 90, 255))
    d.ellipse([760, 340, 820, 380], fill=(30, 26, 30, 255)); d.line([(790, 350), (860, 230)], fill=(240, 236, 226, 255), width=6) # kałamarz i pióro
    for x in (880, 930): d.rounded_rectangle([x - 20, 360, x + 20, 470], 8, fill=(220, 200, 150, 255)) # zwoje
    glow(img, [(150, 230, 120, 200), (200, 260, 110, 180), (bx, by - 40, 220, 120)], (255, 196, 110), 40)
    return img


def zwyciestwo():
    img = Image.new('RGB', (W, H)); gradient(img, [(0, (70, 110, 170)), (0.45, (250, 190, 120)), (0.62, (255, 220, 160)), (1, (120, 100, 70))], sun=(560, 300), sun_r=420)
    d = ImageDraw.Draw(img, 'RGBA')
    for i in range(18): cx, cy, w, h = R.uniform(0, W), R.uniform(40, 220), R.uniform(80, 220), R.uniform(12, 28); d.ellipse([cx - w, cy - h, cx + w, cy + h], fill=(255, 230, 200, 90))
    for a in range(-70, 71, 14): r = math.radians(a - 90); d.polygon([(560, 300), (560 + math.cos(r - 0.03) * 700, 300 + math.sin(r - 0.03) * 700), (560 + math.cos(r + 0.03) * 700, 300 + math.sin(r + 0.03) * 700)], fill=(255, 240, 200, 26))
    d.polygon([(0, 330), (W, 320), (W, H), (0, H)], fill=(110, 120, 70, 255)) # dolina
    castle(d, 800, 330, 1.25, lit=False); banner(d, 690, 200, 80, (40, 70, 150), 4); banner(d, 912, 205, 80, (40, 70, 150), -4)
    for i in range(260): # wojsko z włóczniami i chorągwiami
        x, y = R.uniform(380, 1024), R.uniform(380, 512); d.rectangle([x - 3, y - 10, x + 3, y], fill=(R.choice([90, 140, 60]), 60, 50, 255)); d.line([(x + 3, y - 10), (x + 3, y - 30)], fill=(200, 200, 210, 255), width=1)
    for x in range(420, 1000, 70): banner(d, x, 440, 70, R.choice([(160, 30, 34), (40, 70, 150), (220, 180, 60)]))
    d.polygon([(0, H), (0, 300), (360, 300), (360, H)], fill=(150, 136, 118, 255)) # mury pod stopami bohatera
    for k in range(9): d.rectangle([k * 40, 268, k * 40 + 26, 300], fill=(160, 146, 128, 255))
    hx, hy = 210, 300 # bohater od tyłu, miecz w górze
    d.polygon([(hx - 40, hy), (hx + 40, hy), (hx + 42, hy - 104), (hx + 22, hy - 130), (hx - 22, hy - 130), (hx - 44, hy - 98)], fill=(168, 26, 30, 255))
    d.polygon([(hx - 44, hy - 98), (hx - 110, hy - 40), (hx - 80, hy - 30), (hx - 120, hy - 6), (hx - 30, hy - 10)], fill=(150, 22, 26, 255))
    d.rounded_rectangle([hx - 26, hy - 136, hx + 26, hy - 120], 6, fill=(130, 132, 140, 255)); d.ellipse([hx - 13, hy - 162, hx + 13, hy - 132], fill=(150, 152, 160, 255))
    d.line([(hx + 24, hy - 126), (hx + 60, hy - 200)], fill=(130, 132, 140, 255), width=10); d.line([(hx + 60, hy - 200), (hx + 96, hy - 290)], fill=(240, 240, 250, 255), width=8) # ramię i miecz
    glow(img, [(hx + 96, hy - 290, 40, 220)], (255, 250, 220), 14)
    return img


def porazka():
    img = Image.new('RGB', (W, H)); gradient(img, [(0, (20, 14, 26)), (0.45, (90, 30, 30)), (0.62, (180, 70, 40)), (1, (30, 20, 20))], sun=(780, 300), sun_r=300, sun_col=(255, 120, 50), sun_k=0.7)
    d = ImageDraw.Draw(img, 'RGBA')
    d.polygon([(0, 330), (W, 320), (W, H), (0, H)], fill=(44, 36, 32, 255))
    castle(d, 780, 330, 1.25, wall=(70, 60, 60), sh=(50, 42, 44), roof=None, lit=False) # ruina bez dachów
    d.polygon([(690, 220), (720, 260), (700, 330), (660, 330)], fill=(30, 24, 26, 255))
    for i in range(14): x, y = R.uniform(620, 960), R.uniform(150, 330); d.polygon([(x - 14, y), (x, y - R.uniform(30, 70)), (x + 14, y)], fill=(255, R.randint(110, 190), 40, 230)) # płomienie
    for i in range(10): x = R.uniform(600, 980); d.ellipse([x - 60, 0 + i * 10, x + 60, 160 + i * 10], fill=(30, 26, 28, 120)) # dym
    glow(img, [(780, 260, 200, 150)], (255, 110, 40), 40); d = ImageDraw.Draw(img, 'RGBA')
    for i in range(7): x, y = R.uniform(150, 600), R.uniform(60, 200); d.polygon([(x - 18, y), (x, y + 5), (x + 18, y), (x, y - 4)], fill=(10, 8, 10, 255)) # kruki
    d.polygon([(0, H), (0, 380), (200, 360), (420, 380), (460, H)], fill=(36, 28, 26, 255)) # pagórek pierwszego planu
    hx, hy = 230, 380 # bohater klęczy, głowa spuszczona, miecz wbity w ziemię
    d.polygon([(hx - 50, hy), (hx + 40, hy), (hx + 30, hy - 70), (hx + 10, hy - 92), (hx - 20, hy - 92), (hx - 46, hy - 60)], fill=(120, 22, 26, 255))
    d.ellipse([hx - 10, hy - 110, hx + 14, hy - 86], fill=(110, 112, 120, 255))
    d.line([(hx + 54, hy + 4), (hx + 54, hy - 90)], fill=(190, 190, 200, 255), width=6); d.line([(hx + 40, hy - 74), (hx + 68, hy - 74)], fill=(150, 120, 60, 255), width=6)
    d.line([(hx - 120, hy + 10), (hx + 10, hy - 30)], fill=(70, 50, 36, 255), width=5); d.polygon([(hx - 120, hy + 10), (hx - 160, hy - 6), (hx - 140, hy + 30), (hx - 100, hy + 26)], fill=(40, 60, 120, 255)) # porzucona chorągiew
    for i in range(60): x, y = R.uniform(0, W), R.uniform(150, H); d.ellipse([x - 1.5, y - 1.5, x + 1.5, y + 1.5], fill=(255, 150, 60, 200)) # iskry
    return img


if __name__ == '__main__':
    name, out = sys.argv[1], sys.argv[2]
    globals()[name]().filter(ImageFilter.GaussianBlur(1.2)).save(out)
