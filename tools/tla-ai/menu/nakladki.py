# Nakładki do dopracowania obrazu menu (w układzie obrazu 1536×768): księga kronik na kamiennym pulpicie obok bohatera
# (z poświatą i słupem światła) oraz sylwetka smoka w chmurach.   python nakladki.py katalog
import math, sys
from PIL import Image, ImageDraw, ImageFilter
W, H = 1536, 768; out = sys.argv[1] if len(sys.argv) > 1 else '.'
# księga
o = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(o)
bx, by = 338, 344  # podstawa pulpitu na szczycie skały, na prawo od bohatera
glow = Image.new('L', (W, H)); g = ImageDraw.Draw(glow)
g.ellipse([bx - 70, by - 150, bx + 70, by - 40], fill=170); g.polygon([(bx - 26, by - 90), (bx + 26, by - 90), (bx + 10, 0), (bx - 10, 0)], fill=110)
glow = glow.filter(ImageFilter.GaussianBlur(18)); o.paste(Image.new('RGBA', (W, H), (255, 214, 130, 255)), (0, 0), glow); d = ImageDraw.Draw(o)
d.polygon([(bx - 16, by), (bx + 16, by), (bx + 11, by - 46), (bx - 11, by - 46)], fill=(112, 104, 100, 255)) # trzon
d.polygon([(bx - 22, by), (bx + 22, by), (bx + 18, by - 8), (bx - 18, by - 8)], fill=(90, 84, 80, 255))
d.polygon([(bx - 34, by - 46), (bx + 34, by - 46), (bx + 28, by - 58), (bx - 28, by - 58)], fill=(132, 122, 116, 255)) # blat pochylony
d.polygon([(bx - 38, by - 58), (bx, by - 50), (bx + 38, by - 58), (bx + 36, by - 54), (bx, by - 46), (bx - 36, by - 54)], fill=(120, 34, 26, 255)) # okładka
d.polygon([(bx - 35, by - 60), (bx, by - 53), (bx + 35, by - 60), (bx + 31, by - 72), (bx, by - 64), (bx - 31, by - 72)], fill=(255, 246, 218, 255)) # strony
for i in range(4): d.line([(bx - 28 + i * 3, by - 66 + i), (bx - 6, by - 58 + i)], fill=(200, 170, 120, 255), width=1); d.line([(bx + 6, by - 58 + i), (bx + 28 - i * 3, by - 66 + i)], fill=(200, 170, 120, 255), width=1)
# jedna wyraźna sylwetka bohatera (od tyłu): peleryna łopocząca w lewo, hełm z grzebieniem, naramienniki, miecz u boku
hx, hy = 244, 334
d.polygon([(hx - 40, hy), (hx + 40, hy), (hx + 42, hy - 104), (hx + 22, hy - 130), (hx - 22, hy - 130), (hx - 44, hy - 98)], fill=(168, 26, 30, 255))
d.polygon([(hx - 36, hy - 96), (hx - 100, hy - 30), (hx - 70, hy - 26), (hx - 110, hy - 4), (hx - 30, hy - 10)], fill=(150, 22, 26, 255))
for i in range(5): d.line([(hx - 20 + i * 10, hy - 120), (hx - 26 + i * 12, hy - 4)], fill=(120, 16, 20, 255), width=2)
d.rounded_rectangle([hx - 26, hy - 136, hx + 26, hy - 120], 6, fill=(130, 132, 140, 255))
d.ellipse([hx - 13, hy - 162, hx + 13, hy - 132], fill=(150, 152, 160, 255)); d.polygon([(hx - 3, hy - 162), (hx + 3, hy - 162), (hx + 1, hy - 176), (hx - 1, hy - 176)], fill=(200, 40, 40, 255))
d.line([(hx + 30, hy - 60), (hx + 44, hy + 2)], fill=(180, 180, 190, 255), width=4)
o.save(f'{out}/nakladka-ksiega.png')
# smok
o = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(o); x, y, s = 1250, 175, 1.1; c = (44, 32, 46, 235)
d.polygon([(x - 70 * s, y + 4 * s), (x - 20 * s, y - 4 * s), (x + 24 * s, y - 2 * s), (x + 52 * s, y - 14 * s), (x + 66 * s, y - 10 * s), (x + 34 * s, y + 6 * s), (x - 18 * s, y + 8 * s)], fill=c) # tułów, szyja, łeb
d.polygon([(x - 4 * s, y - 2 * s), (x - 60 * s, y - 66 * s), (x - 34 * s, y - 50 * s), (x - 14 * s, y - 80 * s), (x + 4 * s, y - 56 * s), (x + 18 * s, y - 4 * s)], fill=c) # skrzydło dalsze
d.polygon([(x + 2 * s, y + 4 * s), (x - 46 * s, y + 52 * s), (x - 16 * s, y + 40 * s), (x + 4 * s, y + 62 * s), (x + 24 * s, y + 8 * s)], fill=c) # skrzydło bliższe
d.line([(x - 70 * s, y + 4 * s), (x - 110 * s, y + 20 * s), (x - 130 * s, y + 10 * s)], fill=c, width=int(5 * s)) # ogon
o.filter(ImageFilter.GaussianBlur(1.5)).save(f'{out}/nakladka-smok.png')
