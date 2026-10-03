# Proceduralne, ostre tekstury terenu (512×512, bezszwowe): źdźbła, kamyki, pęknięcia, zmarszczki piasku rysowane w skali,
# w której piksel tekstury ≈ piksel ekranu (heks w bitwie ma ok. 75 pikseli tekstury, pole mapy ok. 64).
# Bezszwowość: szum okresowy (filtr w dziedzinie Fouriera), komórki Woronoja liczone z zawijaniem, kreski rysowane na płótnie 3×3 i przycięte do środka.
#   python3 tools/tekstury-proc.py [tereny]   ->  src/grafika/teren/<teren>.webp  (podgląd: tools/.cache/tekstury-proc.png)
import os, sys, math
import numpy as np
from PIL import Image, ImageDraw

N = 512
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'src', 'grafika', 'teren')

def pnoise(rng, sigma):  # szum okresowy 0..1
    f = np.fft.fft2(rng.standard_normal((N, N))); k = np.fft.fftfreq(N)[:, None] ** 2 + np.fft.fftfreq(N)[None, :] ** 2
    v = np.real(np.fft.ifft2(f * np.exp(-k * (2 * np.pi * sigma) ** 2 / 2))); return (v - v.min()) / (v.max() - v.min() + 1e-9)

def hexc(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)

def base(rng, cols, big=40, mid=10, fine=2.2, amp=(0.5, 0.3, 0.2)):  # barwa podłoża: mieszanka palety wg szumu w trzech skalach
    v = pnoise(rng, big) * amp[0] + pnoise(rng, mid) * amp[1] + pnoise(rng, fine) * amp[2]; v = (v - v.min()) / (v.max() - v.min())
    P = [hexc(c) for c in cols]; t = v * (len(P) - 1); i = np.clip(t.astype(int), 0, len(P) - 2); f = (t - i)[..., None]
    A = np.stack(P)[i]; B = np.stack(P)[i + 1]; return A * (1 - f) + B * f

def voronoi(rng, n, jitter=1.0):  # odległości do najbliższego i drugiego punktu (z zawijaniem) i indeks komórki
    pts = rng.random((n, 2)) * N; yy, xx = np.mgrid[0:N, 0:N].astype(np.float32); d1 = np.full((N, N), 1e9, np.float32); d2 = d1.copy(); idx = np.zeros((N, N), np.int32)
    for k, (px, py) in enumerate(pts):
        dx = np.abs(xx - px); dx = np.minimum(dx, N - dx); dy = np.abs(yy - py); dy = np.minimum(dy, N - dy); d = np.sqrt(dx * dx + dy * dy)
        closer = d < d1; d2 = np.where(closer, d1, np.minimum(d2, d)); idx = np.where(closer, k, idx); d1 = np.where(closer, d, d1)
    return d1, d2, idx

class Strokes:  # płótno 3×3 do rysowania kresek, które przechodzą przez brzeg (bezszwowo)
    def __init__(self, img): self.big = Image.fromarray(np.tile(img.astype(np.uint8), (3, 3, 1))); self.d = ImageDraw.Draw(self.big, 'RGBA')
    def line(self, x, y, x2, y2, col, w=1):
        for ox in (0, N, 2 * N):
            for oy in (0, N, 2 * N): self.d.line([(x + ox, y + oy), (x2 + ox, y2 + oy)], fill=col, width=w)
    def ellipse(self, x, y, rx, ry, col, outline=None):
        for ox in (0, N, 2 * N):
            for oy in (0, N, 2 * N): self.d.ellipse([x - rx + ox, y - ry + oy, x + rx + ox, y + ry + oy], fill=col, outline=outline)
    def done(self): return np.asarray(self.big.crop((N, N, 2 * N, 2 * N))).astype(float)

def c8(a, al=255): a = np.clip(a, 0, 255).astype(int); return (int(a[0]), int(a[1]), int(a[2]), al)

def grass(rng):
    img = base(rng, ['#3a6e24', '#4a8a2e', '#5c9e38', '#6eb044'], big=50, mid=12)
    clump = pnoise(rng, 6); img *= (0.88 + clump * 0.24)[..., None]
    S = Strokes(img)
    for _ in range(26000):  # źdźbła: krótkie, ostre kreski w różnych odcieniach (widok z góry: kierunki dowolne, lekko „pod wiatr”)
        x, y = rng.random() * N, rng.random() * N; a = rng.normal(-1.2, 0.7); L = 3 + rng.random() * 5; dark = rng.random() < 0.45
        col = np.array([40, 92, 28]) if dark else np.array([96, 160, 60]) * (0.85 + rng.random() * 0.35)
        S.line(x, y, x + math.cos(a) * L, y + math.sin(a) * L, c8(col, 220))
    for _ in range(90):  # drobne kwiatki (2–3 px): biały, żółty, fioletowy
        x, y = rng.random() * N, rng.random() * N; col = [(245, 245, 235), (240, 205, 60), (170, 120, 210)][rng.integers(3)]
        S.ellipse(x, y, 1.3, 1.3, col + (255,)); S.ellipse(x, y, 0.5, 0.5, (250, 220, 90, 255))
    return S.done()

def dirt(rng):
    img = base(rng, ['#5e4428', '#735433', '#86663e', '#9a7a4c'], big=45, mid=9)
    S = Strokes(img)
    for _ in range(26):  # pęknięcia: krótkie, łamane linie
        x, y = rng.random() * N, rng.random() * N; a = rng.random() * 6.28
        for _s in range(rng.integers(4, 9)):
            a += rng.normal(0, 0.6); L = 5 + rng.random() * 9; x2, y2 = x + math.cos(a) * L, y + math.sin(a) * L; S.line(x, y, x2, y2, (52, 36, 20, 200), 1); x, y = x2, y2
    for _ in range(700):  # kamyki z jasnym wierzchem i cieniem
        x, y = rng.random() * N, rng.random() * N; r = 0.8 + rng.random() ** 2 * 3.2; g = 110 + rng.random() * 70
        S.ellipse(x + 0.6, y + 0.8, r, r * 0.8, (40, 28, 16, 150)); S.ellipse(x, y, r, r * 0.8, (int(g), int(g * 0.9), int(g * 0.75), 255)); S.ellipse(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.3, (230, 220, 200, 160))
    for _ in range(1600): x, y = rng.random() * N, rng.random() * N; a = rng.random() * 6.28; S.line(x, y, x + math.cos(a) * 3, y + math.sin(a) * 3, (150, 140, 70, 160))  # suche trawki
    return S.done()

def sand(rng):
    img = base(rng, ['#c4a76a', '#d2b77c', '#dfc690', '#e9d5a2'], big=55, mid=14)
    yy, xx = np.mgrid[0:N, 0:N] / N; warp = pnoise(rng, 30) * 2.5
    rip = np.sin((yy * 18 + xx * 4 + warp) * 2 * np.pi); img *= (1 + 0.07 * rip - 0.05 * (rip > 0.85))[..., None]  # zmarszczki od wiatru (okresowe)
    grain = rng.random((N, N)); img *= (0.94 + grain * 0.12)[..., None]  # ziarno piasku w pojedynczych pikselach
    S = Strokes(img)
    for _ in range(140): x, y = rng.random() * N, rng.random() * N; r = 0.8 + rng.random() * 1.8; S.ellipse(x + 0.5, y + 0.6, r, r * 0.8, (120, 95, 60, 140)); S.ellipse(x, y, r, r * 0.8, (175, 150, 110, 255))
    return S.done()

def snow(rng):
    img = base(rng, ['#b9c9da', '#d3dfea', '#e6eef5', '#f6f9fc'], big=55, mid=12, amp=(0.55, 0.3, 0.15))
    drift = pnoise(rng, 20); img *= (0.93 + drift * 0.1)[..., None]
    sp = rng.random((N, N)); img[sp > 0.9965] = [255, 255, 255]; img[(sp > 0.992) & (sp <= 0.9965)] *= 1.04  # iskierki
    S = Strokes(img)
    for _ in range(260): x, y = rng.random() * N, rng.random() * N; a = rng.random() * 6.28; L = 3 + rng.random() * 6; S.line(x, y, x + math.cos(a) * L, y + math.sin(a) * L, (170, 190, 215, 90), 1)  # rysy w szreni
    return S.done()

def swamp(rng):
    img = base(rng, ['#2e4430', '#3c5638', '#4c6844', '#5a7650'], big=40, mid=8)
    w = pnoise(rng, 14); pud = w > 0.68; edge = (w > 0.64) & ~pud
    img[pud] = img[pud] * 0.45 + np.array([40, 60, 55]) * 0.55; img[edge] *= 0.8  # kałuże z ciemnym brzegiem
    hl = pud & (pnoise(rng, 1.5) > 0.75); img[hl] = img[hl] * 0.6 + np.array([150, 170, 160]) * 0.4  # odblaski na wodzie
    S = Strokes(img)
    for _ in range(320):  # kępki trzciny: kilka kresek z jednego punktu
        x, y = rng.random() * N, rng.random() * N
        if w[int(y) % N, int(x) % N] > 0.66: continue
        for _k in range(rng.integers(4, 8)): a = rng.normal(-1.57, 0.5); L = 4 + rng.random() * 6; S.line(x, y, x + math.cos(a) * L, y + math.sin(a) * L, (110, 130, 60, 230))
    for _ in range(9000): x, y = rng.random() * N, rng.random() * N; a = rng.random() * 6.28; S.line(x, y, x + math.cos(a) * 2.5, y + math.sin(a) * 2.5, (70, 100, 50, 150))  # mech
    return S.done()

def stony(rng, cols, cells, crack, gap_col, glow=None):  # płyty skalne / bazalt / bruk: komórki Woronoja z ciemnymi szczelinami
    img = base(rng, cols, big=40, mid=10); d1, d2, idx = voronoi(rng, cells); edge = d2 - d1
    shade = np.random.default_rng(int(rng.integers(1 << 30))).random(cells)[idx]; img *= (0.82 + shade * 0.3)[..., None]
    lit = np.clip((d2 - d1) / 10, 0, 1); img *= (0.9 + lit * 0.12)[..., None]  # wypukłe płyty: jaśniej w środku
    m = edge < crack; img[m] = np.array(gap_col, float) if glow is None else np.array(glow, float)
    if glow is not None: g2 = (edge >= crack) & (edge < crack * 2.6); img[g2] = img[g2] * 0.55 + np.array(glow, float) * 0.45 * (1 - (edge[g2] - crack) / (crack * 1.6))[..., None]
    gr = rng.random((N, N)); img *= (0.93 + gr * 0.12)[..., None]
    return img

def rough(rng):
    img = stony(rng, ['#6c5e44', '#7e6e50', '#928062', '#a59476'], 70, 1.6, (52, 44, 32))
    S = Strokes(img)
    for _ in range(900): x, y = rng.random() * N, rng.random() * N; r = 0.7 + rng.random() * 1.6; g = 100 + rng.random() * 80; S.ellipse(x, y, r, r * 0.8, (int(g), int(g * 0.92), int(g * 0.8), 255))
    return S.done()

def lava(rng): return stony(rng, ['#1e1714', '#2a201b', '#362a24', '#40322a'], 55, 1.4, None, glow=(255, 110, 30))
def cave(rng): return stony(rng, ['#3e352e', '#4c4138', '#5a4d42', '#665849'], 120, 1.5, (24, 20, 17))

def water(rng):
    img = base(rng, ['#1c4a86', '#245a98', '#2c68a8', '#3a78b6'], big=50, mid=12)
    yy, xx = np.mgrid[0:N, 0:N] / N; warp = pnoise(rng, 18) * 3; w = np.sin((yy * 22 + warp) * 2 * np.pi) * np.sin((xx * 3 + warp * 0.5) * 2 * np.pi)
    img *= (1 + 0.08 * w)[..., None]; hl = w > 0.82; img[hl] = img[hl] * 0.7 + np.array([200, 225, 245]) * 0.3
    return img

GEN = { 'grass': grass, 'dirt': dirt, 'sand': sand, 'snow': snow, 'swamp': swamp, 'rough': rough, 'lava': lava, 'cave': cave, 'water': water }

if __name__ == '__main__':
    names = sys.argv[1].split(',') if len(sys.argv) > 1 else list(GEN)
    os.makedirs(OUT, exist_ok=True); prev = []
    for i, name in enumerate(names):
        im = Image.fromarray(np.clip(GEN[name](np.random.default_rng(1000 + i * 17)), 0, 255).astype(np.uint8))
        p = os.path.join(OUT, f'{name}.webp'); im.save(p, 'WEBP', quality=88, method=6); prev.append(im.crop((0, 0, 256, 256))); print(name, os.path.getsize(p), 'B')
    c = os.path.join(HERE, '.cache'); os.makedirs(c, exist_ok=True); o = Image.new('RGB', (256 * len(prev), 256))
    for i, im in enumerate(prev): o.paste(im, (i * 256, 0))
    o.save(os.path.join(c, 'tekstury-proc.png'))
