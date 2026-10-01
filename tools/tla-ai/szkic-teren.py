# Szkic tła z ciekawszą topografią, ale z płaskimi miejscami pod budowle: płaskowyże (mesy) na różnych wysokościach z urwiskami,
# rzeki (lawa/woda) w korytach, wulkan/szczyt w tle, skalne turnie przy brzegach. Spec w opisy.json → <frakcja>.teren, współrzędne w kadrze gry (592×438, obraz 8..584 × 8..430).
#   python szkic-teren.py frakcja wynik.png
#   teren: { hor, niebo:[góra,dół], ziemia:[tył,przód], skala:[kolor urwiska], plyty:[{x:[x0,x1], tyl, przod, dol, kolor?, wodospady:[x...]}],
#            rzeki:[{pkt:[[x,y]...], w:[szer. z tyłu, z przodu]}], ciecz:[jasny, ciemny], wulkan:{x, szczyt, szer, krater?}, gory:[...], turnie:[[x, szczyt, szer]...], dym? }
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
fac, out = sys.argv[1], sys.argv[2]; T = json.load(open('opisy.json', encoding='utf-8'))[fac]['teren']
W, H = 768, 560; S = H / 422; rng = np.random.default_rng(T.get('ziarno', 3))
def I(x, y): return ((x - 8) * S, (y - 8) * S)
hor = (T['hor'] - 8) * S; yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
def lerp(a, b, t): return np.array(a, np.float32) * (1 - t) + np.array(b, np.float32) * t
def noise(sc):
    n = rng.random((H // sc + 2, W // sc + 2)).astype(np.float32); return np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((W + sc * 2, H + sc * 2), Image.BICUBIC)).astype(np.float32)[:H, :W] / 255
img = lerp(T['niebo'][0], T['niebo'][1], np.clip(yy / hor, 0, 1)[..., None] ** 1.3)
if T.get('dym'):  # smugi dymu na niebie
    n = (0.6 * noise(60) + 0.4 * noise(20))[..., None]; img = img * (1 - 0.35 * n * (yy < hor)[..., None]) + np.array(T['dym'], np.float32) * 0.35 * n * (yy < hor)[..., None]
tg = np.clip((yy - hor) / (H - hor), 0, 1)[..., None]; n = (0.5 * noise(30) + 0.3 * noise(8) + 0.2 * noise(3))[..., None]
img = np.where(yy[..., None] >= hor, lerp(T['ziemia'][0], T['ziemia'][1], tg ** 0.7) * (0.82 + 0.36 * n), img)
im = Image.fromarray(img.clip(0, 255).astype(np.uint8)); g = ImageDraw.Draw(im)
glow = Image.new('L', (W, H), 0); gd = ImageDraw.Draw(glow)  # maska świecenia (lawa)
liq = [tuple(T['ciecz'][0]), tuple(T['ciecz'][1])]
def jagged(x0, x1, base, top, step=(14, 40), amp=1.0):
    pts = [(x0, base)]; x = x0
    while x < x1: x = min(x1, x + rng.integers(*step)); pts.append((x, base - (top + (rng.random() - 0.3) * amp * 30)))
    return pts + [(x1, base)]
for (h0, h1, col) in T.get('gory', []):  # dalekie pasma
    pts = [(0, hor + 3)]; x = 0
    while x < W: x += rng.integers(20, 50); pts.append((x, hor - h0 * S - rng.random() * (h1 - h0) * S))
    g.polygon(pts + [(W, hor + 3)], fill=tuple(col))
if T.get('wulkan'):  # wulkan: stożek ze ściętym kraterem, strugi lawy po zboczach, łuna
    V = T['wulkan']; cx, top = I(V['x'], V['szczyt']); hw = V['szer'] * S / 2; kr = hw * 0.12
    g.polygon([(cx - hw, hor + 4), (cx - kr * 1.6, top + 6), (cx - kr, top), (cx + kr, top), (cx + kr * 1.6, top + 6), (cx + hw, hor + 4)], fill=tuple(V.get('kolor', T['skala'])))
    g.polygon([(cx - kr, top), (cx + kr, top), (cx + kr * 0.8, top + 5), (cx - kr * 0.8, top + 5)], fill=liq[0]); gd.ellipse([cx - kr * 3, top - kr * 3, cx + kr * 3, top + kr * 2], fill=200)
    for i in range(5):  # strugi lawy
        x = cx + (rng.random() - 0.5) * kr * 1.6; y = top + 4; pts = [(x, y)]
        while y < hor: y += 8 + rng.random() * 10; x += (x - cx) / max(1, (y - top)) * 9 + (rng.random() - 0.5) * 6; pts.append((x, min(y, hor)))
        g.line(pts, fill=liq[0], width=max(2, int(4 - i * 0.5))); gd.line(pts, fill=160, width=7)
# rzeki (lawa/woda) w korytach na równinie: szerokość w perspektywie
for R in T.get('rzeki', []):
    P0 = R['pkt']; seg = []
    for (a, b) in zip(P0, P0[1:]):
        for t in np.linspace(0, 1, 16, endpoint=False): seg.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    seg.append(tuple(P0[-1]))
    for x, y in seg:
        tt = np.clip((y - T['hor']) / (430 - T['hor']), 0, 1); w = (R['w'][0] * (1 - tt) + R['w'][1] * tt) * S; X, Y = I(x, y); k = 0.35 + 0.35 * tt
        g.ellipse([X - w * 0.62, Y - w * k * 0.62, X + w * 0.62, Y + w * k * 0.62], fill=tuple(T['skala'])); gd.ellipse([X - w, Y - w * k, X + w, Y + w * k], fill=150)
    for x, y in seg:
        tt = np.clip((y - T['hor']) / (430 - T['hor']), 0, 1); w = (R['w'][0] * (1 - tt) + R['w'][1] * tt) * S * 0.48; X, Y = I(x, y); k = 0.35 + 0.35 * tt
        g.ellipse([X - w, Y - w * k, X + w, Y + w * k], fill=liq[0] if rng.random() < 0.6 else liq[1])
# płaskowyże: wierzch (płaski, pod budowle) + urwisko z pionową fakturą + wodospady (lawospady) na urwisku; od najdalszych
for p in sorted(T.get('plyty', []), key=lambda p: p['dol']):
    x0, x1 = p['x']; top = [I(x0 + 10, p['tyl']), I(x1 - 10, p['tyl'])]; fr = [I(x1, p['przod']), I(x0, p['przod'])]
    cl = tuple(p.get('kolor_urwiska', T['skala'])); ct = tuple(p.get('kolor', T['ziemia'][0]))
    front = []; x = x0
    while x <= x1: front.append(I(x, p['przod'] + (rng.random() - 0.5) * 3)); x += 12
    g.polygon([I(x0, p['dol'])] + front + [I(x1, p['dol'])], fill=cl)
    for i in range(int((x1 - x0) / 5)):  # pionowe żłobienia urwiska (kolumny bazaltu)
        X = I(x0 + 3 + i * 5, 0)[0]; c = tuple(min(255, int(v * (0.7 + 0.5 * rng.random()))) for v in cl); g.line([(X, I(0, p['przod'])[1] + 2), (X + (rng.random() - 0.5) * 3, I(0, p['dol'])[1])], fill=c, width=2)
    g.polygon([top[0], top[1], I(x1, p['przod']), *front[::-1][1:-1], I(x0, p['przod'])], fill=ct)
    for i in range(160):  # faktura wierzchu
        tx, ty = x0 + rng.random() * (x1 - x0), p['tyl'] + rng.random() * (p['przod'] - p['tyl']); X, Y = I(tx, ty); c = tuple(min(255, int(v * (0.7 + 0.5 * rng.random()))) for v in ct); g.line([(X, Y), (X + 5, Y - 1)], fill=c, width=1)
    for wx in p.get('wodospady', []):
        X0, Y0 = I(wx, p['przod']); _, Y1 = I(wx, p['dol']); g.polygon([(X0 - 5, Y0), (X0 + 5, Y0), (X0 + 9, Y1), (X0 - 9, Y1)], fill=liq[0]); gd.polygon([(X0 - 10, Y0), (X0 + 10, Y0), (X0 + 16, Y1 + 6), (X0 - 16, Y1 + 6)], fill=190)
        g.ellipse([X0 - 20, Y1 - 5, X0 + 20, Y1 + 7], fill=liq[0])
for (x, szczyt, szer) in T.get('turnie', []):  # skalne turnie przy brzegach
    X, Yt = I(x, szczyt); w = szer * S / 2; pts = [(X - w, H + 2)]; n = 7
    for i in range(1, n): f_ = i / n; pts.append((X - w + 2 * w * f_ + (rng.random() - 0.5) * w * 0.3, Yt + (H - Yt) * (abs(f_ - 0.5) * 2) ** 1.6 * 0.85 + rng.random() * 20))
    pts.append((X + w, H + 2)); g.polygon(pts, fill=tuple(T.get('turnie_kolor', T['skala'])))
mg = Image.new('L', (W, H), 0); ImageDraw.Draw(mg).rectangle([0, hor - 26, W, hor + 26], fill=90); mg = mg.filter(ImageFilter.GaussianBlur(16))
im = Image.composite(Image.new('RGB', (W, H), tuple(T.get('mgla', T['niebo'][1]))), im, mg)
gl = np.asarray(glow.filter(ImageFilter.GaussianBlur(14))).astype(np.float32)[..., None] / 255; a = np.asarray(im).astype(np.float32)
a = a + gl * np.array(T.get('lune', [255, 110, 30]), np.float32) * 0.55
Image.fromarray(a.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0)).save(out); print(out)
