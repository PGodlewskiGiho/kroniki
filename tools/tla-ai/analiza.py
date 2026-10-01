# Analiza geometrii namalowanego tła: z głębi (glebia.py) i linii horyzontu wylicza dla każdego piksela położenie na terenie,
# wysokość względem płaszczyzny doliny i nachylenie; zapisuje mapę płaskich miejsc do stawiania budowli.
#   python analiza.py obraz.png glebia.npy hor f wynik_prefix
import sys, json, numpy as np
from PIL import Image, ImageDraw
src, dep, hor, f, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
im = Image.open(src).convert('RGB'); W, H = im.size; S = W / 576.0  # piksele obrazu na px kadru (kadr 576×422 od (8,8))
a = np.asarray(im).astype(np.float32) / 255; d = np.load(dep)
vy = (np.arange(H)[:, None] / S + 8).repeat(W, 1); ux = (np.arange(W)[None, :] / S + 8).repeat(H, 0)
# woda: chłodna, szara, gładka – płaska z definicji (poziom doliny); na niej kalibracja głębi: z_płasko = f·h/(v−hor), h = 1
r, g, b = a[..., 0], a[..., 1], a[..., 2]; water = (b > r + 0.02) & (b > g - 0.04) & (vy > hor + 40) & (a.mean(-1) > 0.2)
zf = f / np.maximum(vy - hor, 1)
m = water & (vy > hor + 60); x, y = np.log(d[m]), np.log(zf[m]); p = np.polyfit(x, y, 1); print('kalibracja log z = %.3f·log d + %.3f, wody px %d' % (p[0], p[1], m.sum()))
z = np.exp(np.polyval(p, np.log(d)))  # odległość w jednostkach wysokości kamery
e = 1 - (vy - hor) * z / f  # wysokość terenu nad doliną (1 = wysokość kamery)
X = (ux - 296) * z / f
# nachylenie: różnica wysokości na odcinku terenu (gradient e względem położenia X, z)
gy, gx = np.gradient(e); zy, zx = np.gradient(z); xy, xx = np.gradient(X)
slope = np.hypot(gx, gy) / np.maximum(np.hypot(np.hypot(xx, xy), np.hypot(zx, zy)), 1e-6)
np.savez_compressed(out + '.npz', z=z.astype(np.float32), e=e.astype(np.float32), slope=slope.astype(np.float32), water=water)
# podgląd: zielone = płaskie (nachylenie < 0,15), niebieskie = woda, czerwone = strome; linie: wysokość co 0,05
v = np.asarray(im).astype(np.float32); ov = np.zeros_like(v)
ov[slope < 0.15] = [40, 220, 60]; ov[slope >= 0.35] = [230, 40, 40]; ov[water] = [40, 90, 255]; ov[vy < hor + 8] = 0
mix = np.where((ov.sum(-1) > 0)[..., None], v * 0.55 + ov * 0.45, v); con = (np.floor(e / 0.05) != np.floor(np.roll(e, 1, 0) / 0.05)) & (vy > hor + 8); mix[con] = [255, 255, 0]
o = Image.fromarray(mix.clip(0, 255).astype(np.uint8)); dr = ImageDraw.Draw(o)
for xx_ in range(8, 584, 50): dr.line([((xx_ - 8) * S, 0), ((xx_ - 8) * S, H)], fill=(255, 255, 255)); dr.text(((xx_ - 8) * S + 2, 2), str(xx_), fill='white')
for yy in range(8, 430, 50): dr.line([(0, (yy - 8) * S), (W, (yy - 8) * S)], fill=(255, 255, 255)); dr.text((2, (yy - 8) * S + 2), str(yy), fill='white')
dr.line([(0, (hor - 8) * S), (W, (hor - 8) * S)], fill=(255, 0, 255), width=2)
o.resize((W * 2, H * 2)).save(out + '-mapa.png'); print(out + '-mapa.png')
