# Szkice pól bitew dla img2img (generuj.py): prawdziwe pole walki jak w Heroes 3, nie krajobraz.
# Widok z góry pod kątem: płaskie podłoże na całej wysokości, w skali jednostek (kępy, kamyki i ścieżka mają rozmiar
# jednego–dwóch pól heksów), większe ozdoby (krzaki, głazy, kryształy, grzyby) tylko przy górnej i dolnej krawędzi,
# horyzont to wąski pas u samej góry (pod górnym paskiem ekranu). Środek zostaje jasny i czytelny: tam stoją oddziały.
#   python3 szkic-pola.py [teren...]   ->  bitwy/pole-<teren>.png  (768×472 = pole bitwy 800×490 bez panelu)
import math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, HOR = 768, 472, 44  # HOR: wysokość pasa horyzontu (pod górnym paskiem gry)

# podłoże (3 odcienie), ścieżka, kamienie, kępy, ozdoby krawędzi, tło horyzontu, dodatki
B = {
  'trawa':     dict(g=[(78, 122, 52), (98, 142, 60), (120, 158, 70)], path=(150, 128, 88), stone=(140, 136, 124), tuft=(60, 100, 40), edge='bush', hor='trees', flowers=[(230, 220, 120), (220, 90, 80), (240, 240, 240)]),
  'ziemia':    dict(g=[(118, 90, 58), (138, 106, 68), (156, 124, 82)], path=(170, 142, 100), stone=(130, 120, 108), tuft=(110, 120, 60), edge='rock', hor='hills', ruts=True),
  'piasek':    dict(g=[(206, 172, 112), (220, 188, 128), (232, 204, 146)], path=(196, 160, 104), stone=(184, 140, 96), tuft=(150, 140, 80), edge='sandrock', hor='dunes', ripples=True),
  'snieg':     dict(g=[(214, 222, 234), (228, 234, 244), (240, 244, 250)], path=(190, 200, 216), stone=(120, 124, 136), tuft=(70, 100, 80), edge='pine', hor='snowhills'),
  'bagno':     dict(g=[(70, 80, 50), (84, 96, 58), (98, 108, 66)], path=(106, 94, 64), stone=(90, 92, 80), tuft=(110, 130, 60), edge='reeds', hor='deadtrees', puddles=(52, 70, 62)),
  'nierowny':  dict(g=[(118, 112, 96), (136, 128, 108), (152, 144, 122)], path=(160, 150, 126), stone=(110, 106, 100), tuft=(120, 128, 70), edge='boulder', hor='crags', slabs=True),
  'lawa':      dict(g=[(46, 40, 40), (60, 52, 50), (76, 64, 58)], path=(90, 76, 66), stone=(36, 32, 32), tuft=(80, 60, 50), edge='basalt', hor='volcano', lava=True),
  'pola':      dict(g=[(170, 150, 70), (190, 168, 82), (206, 184, 98)], path=(160, 130, 88), stone=(140, 136, 124), tuft=(130, 150, 60), edge='hay', hor='farm', rows=True, flowers=[(220, 60, 50)]),
  'dzungla':   dict(g=[(52, 92, 40), (64, 108, 46), (80, 124, 54)], path=(116, 92, 60), stone=(96, 104, 86), tuft=(40, 80, 34), edge='fern', hor='jungle', flowers=[(240, 120, 60), (240, 80, 160)]),
  'sawanna':   dict(g=[(186, 156, 84), (200, 170, 96), (214, 186, 110)], path=(176, 112, 70), stone=(150, 110, 80), tuft=(160, 140, 70), edge='acacia', hor='savanna', redsoil=(170, 104, 66)),
  'lod':       dict(g=[(170, 200, 222), (190, 214, 232), (212, 228, 242)], path=(226, 236, 246), stone=(120, 150, 180), tuft=(200, 220, 236), edge='icespike', hor='glacier', cracks=True),
  'krysztaly': dict(g=[(52, 48, 66), (64, 60, 80), (78, 72, 96)], path=(90, 84, 108), stone=(46, 42, 58), tuft=(70, 60, 90), edge='crystal', hor='cavewall', dark=True),
  'grzyby':    dict(g=[(54, 50, 44), (66, 60, 52), (80, 72, 60)], path=(92, 82, 66), stone=(48, 44, 40), tuft=(60, 110, 100), edge='mushroom', hor='cavewall', dark=True, glow=(110, 230, 210)),
  'woda':      dict(g=[(90, 130, 60), (106, 146, 66), (124, 160, 76)], path=(196, 180, 130), stone=(130, 128, 120), tuft=(70, 110, 50), edge='reeds', hor='sea', shore=True),
}

def noise(seed, scale, octaves=3):  # gładki szum wartości (bez bibliotek), 0..1
  rng = np.random.default_rng(seed); out = np.zeros((H, W))
  for o in range(octaves):
    s = scale / 2 ** o; gw, gh = int(W / s) + 3, int(H / s) + 3; g = rng.random((gh, gw))
    img = Image.fromarray((g * 255).astype(np.uint8)).resize((int(gw * s), int(gh * s)), Image.BICUBIC)
    out += np.asarray(img, dtype=float)[:H, :W] / 255 / 2 ** o
  return out / sum(1 / 2 ** o for o in range(octaves))

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def shade(c, k): return tuple(max(0, min(255, int(v * k))) for v in c)
def persp(y): return 0.6 + 0.4 * (y - HOR) / (H - HOR)  # dalej (wyżej) mniejsze

def ground(d, seed):
  n = noise(seed, 90) * 0.75 + noise(seed + 1, 22) * 0.25; g = d['g']; arr = np.zeros((H, W, 3))
  t = np.clip((n - 0.25) / 0.5, 0, 1) * 2
  for i in range(3):
    lo, hi = np.array(g[min(i, 2)]), np.array(g[min(i + 1, 2)]); m = (t >= i) & (t < i + 1) if i < 2 else (t >= 2)
    k = (t - i)[..., None]; arr[m] = (lo + (hi - lo) * np.clip(k, 0, 1))[m]
  arr[t < 0] = g[0]
  ys = np.linspace(0.9, 1.06, H)[:, None, None]; arr *= ys  # dalej trochę ciemniej
  return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

def blob(dr, x, y, rx, ry, col, a=255): dr.ellipse([x - rx, y - ry, x + rx, y + ry], fill=col + (a,))

def path(img, d, rng):  # kręta ścieżka w poprzek pola (jak udeptany szlak), szersza z przodu
  dr = ImageDraw.Draw(img, 'RGBA'); y0 = rng.uniform(H * 0.45, H * 0.7); ph, amp = rng.uniform(0, 6), rng.uniform(25, 60)
  for x in range(-20, W + 20, 4):
    y = y0 + math.sin(x / 140 + ph) * amp + math.sin(x / 47) * 8; r = 16 * persp(y) + rng.uniform(-2, 2)
    blob(dr, x, y, r * 1.6, r * 0.75, d['path'], 150)
  for x in range(-20, W + 20, 9):
    y = y0 + math.sin(x / 140 + ph) * amp + math.sin(x / 47) * 8 + rng.uniform(-10, 10)
    blob(dr, x, y, rng.uniform(3, 7), rng.uniform(2, 4), shade(d['path'], rng.uniform(0.85, 1.15)), 160)

def stone(dr, x, y, r, col, rng):
  blob(dr, x + r * 0.3, y + r * 0.35, r, r * 0.55, (0, 0, 0), 70)
  blob(dr, x, y, r, r * 0.7, shade(col, 0.85)); blob(dr, x - r * 0.15, y - r * 0.2, r * 0.75, r * 0.45, shade(col, 1.12))

def tuft(dr, x, y, s, col, rng):
  for _ in range(7):
    a = rng.uniform(-1.1, 1.1); l = s * rng.uniform(0.6, 1.2)
    dr.line([x, y, x + math.sin(a) * l * 0.6, y - math.cos(a) * l], fill=shade(col, rng.uniform(0.8, 1.3)) + (230,), width=2)

def details(img, d, rng):
  dr = ImageDraw.Draw(img, 'RGBA')
  for _ in range(int(W * H / 9000)):  # plamy (ciemniejsze i jaśniejsze) w skali kilku heksów
    x, y = rng.uniform(0, W), rng.uniform(HOR, H); k = rng.choice([0.85, 1.12]); s = persp(y)
    blob(dr, x, y, rng.uniform(30, 70) * s, rng.uniform(14, 30) * s, shade(d['g'][1], k), 60)
  if d.get('redsoil'):
    for _ in range(10): x, y = rng.uniform(0, W), rng.uniform(HOR + 20, H); s = persp(y); blob(dr, x, y, rng.uniform(30, 60) * s, rng.uniform(12, 24) * s, d['redsoil'], 170)
  if d.get('puddles'):
    for _ in range(9):
      x, y = rng.uniform(0, W), rng.uniform(HOR + 20, H); s = persp(y); rx = rng.uniform(20, 46) * s
      blob(dr, x, y, rx, rx * 0.4, d['puddles'], 230); blob(dr, x - rx * 0.3, y - rx * 0.1, rx * 0.4, rx * 0.08, (170, 200, 190), 120)
  if d.get('rows'):  # rzędy zboża skośnie (perspektywa), przerwa na ścieżkę
    for i in range(-30, 60):
      x0 = i * 26; dr.line([x0, H, x0 + 220, HOR], fill=shade(d['g'][0], 0.82) + (120,), width=3)
  if d.get('ripples'):
    for y in range(HOR + 6, H, 11):
      ph = rng.uniform(0, 6); pts = [(x, y + math.sin(x / 30 + ph) * 3) for x in range(0, W + 8, 8)]
      dr.line(pts, fill=shade(d['g'][0], 0.9) + (90,), width=2)
  if d.get('slabs'):
    for _ in range(14):
      x, y = rng.uniform(0, W), rng.uniform(HOR + 20, H); s = persp(y); w, h = rng.uniform(30, 60) * s, rng.uniform(14, 26) * s
      dr.polygon([(x - w, y), (x - w * 0.6, y - h), (x + w * 0.7, y - h * 0.8), (x + w, y + h * 0.2), (x + w * 0.4, y + h * 0.6), (x - w * 0.7, y + h * 0.5)], fill=shade(d['stone'], 1.15) + (200,), outline=shade(d['stone'], 0.6) + (200,))
  if d.get('cracks') or d.get('lava'):
    col = (255, 120, 30) if d.get('lava') else (240, 250, 255)
    for _ in range(12 if d.get('lava') else 16):
      x, y = rng.uniform(0, W), rng.uniform(HOR + 20, H); pts = [(x, y)]
      for _ in range(rng.integers(4, 9)): x += rng.uniform(-22, 22); y += rng.uniform(-8, 8); pts.append((x, y))
      if d.get('lava'): dr.line(pts, fill=(120, 30, 10, 200), width=7)
      dr.line(pts, fill=col + (230,), width=3 if d.get('lava') else 2)
  if d.get('shore'):  # wyspa: płytka woda przy lewym i prawym brzegu? nie: u góry i u dołu, pole walki suche
    for yy, h in ((HOR, 40), (H - 46, 46)):
      for x in range(0, W, 6):
        e = yy + (h if yy == HOR else 0) + math.sin(x / 50) * 10 + rng.uniform(-3, 3)
        y0, y1 = (yy, e) if yy == HOR else (e, H)
        dr.rectangle([x, y0, x + 6, y1], fill=(60, 120, 150, 255))
        dr.line([x, e, x + 6, e], fill=(220, 210, 160, 255), width=6)
  for _ in range(int(W * H / 2600)):  # kamyki i kępy w skali jednostek
    x, y = rng.uniform(0, W), rng.uniform(HOR + 8, H); s = persp(y)
    if rng.random() < 0.45: stone(dr, x, y, rng.uniform(3, 7) * s, shade(d['stone'], rng.uniform(0.85, 1.15)), rng)
    else: tuft(dr, x, y, rng.uniform(7, 12) * s, d['tuft'], rng)
  for c in d.get('flowers', []):
    for _ in range(40): x, y = rng.uniform(0, W), rng.uniform(HOR + 8, H); blob(dr, x, y, 2.2, 1.6, c)
  if d.get('glow'):
    for _ in range(26): x, y = rng.uniform(0, W), rng.uniform(HOR + 8, H); blob(dr, x, y, 9, 5, d['glow'], 60); blob(dr, x, y, 3, 2, d['glow'], 230)

def edge_obj(dr, kind, x, y, s, d, rng):  # ozdoba krawędzi (dół jest bliżej: większa)
  sh = lambda rx: blob(dr, x + rx * 0.3, y + 4 * s, rx, rx * 0.35, (0, 0, 0), 80)
  if kind in ('bush', 'fern', 'reeds'):
    col = {'bush': (56, 96, 40), 'fern': (40, 100, 40), 'reeds': (110, 120, 60)}[kind]; sh(26 * s)
    if kind == 'reeds':
      for _ in range(14): a = rng.uniform(-0.4, 0.4); dr.line([x + rng.uniform(-14, 14) * s, y, x + math.sin(a) * 40 * s, y - rng.uniform(28, 46) * s], fill=shade(col, rng.uniform(0.8, 1.2)) + (255,), width=3)
    else:
      for _ in range(9): blob(dr, x + rng.uniform(-20, 20) * s, y - rng.uniform(4, 26) * s, rng.uniform(10, 16) * s, rng.uniform(8, 13) * s, shade(col, rng.uniform(0.8, 1.25)))
  elif kind in ('rock', 'boulder', 'sandrock', 'basalt'):
    col = {'rock': (128, 120, 108), 'boulder': (120, 116, 110), 'sandrock': (190, 140, 90), 'basalt': (40, 36, 38)}[kind]; r = rng.uniform(16, 26) * s; sh(r)
    blob(dr, x, y - r * 0.4, r, r * 0.75, shade(col, 0.8)); blob(dr, x - r * 0.2, y - r * 0.7, r * 0.7, r * 0.45, shade(col, 1.15))
  elif kind == 'pine':
    sh(18 * s); dr.rectangle([x - 2 * s, y - 10 * s, x + 2 * s, y], fill=(80, 60, 40))
    for k in range(3): w = (18 - k * 5) * s; yy = y - (8 + k * 14) * s; dr.polygon([(x - w, yy), (x + w, yy), (x, yy - 22 * s)], fill=(40, 80, 60)); dr.polygon([(x - w * 0.8, yy - 2), (x, yy - 18 * s), (x - w * 0.1, yy - 2)], fill=(236, 242, 250))
  elif kind == 'hay':
    sh(22 * s); blob(dr, x, y - 14 * s, 22 * s, 16 * s, (210, 180, 90)); blob(dr, x - 5 * s, y - 20 * s, 14 * s, 8 * s, (232, 206, 120))
  elif kind == 'acacia':
    sh(30 * s); dr.line([x, y, x + 4 * s, y - 40 * s], fill=(90, 66, 44), width=int(5 * s)); blob(dr, x + 4 * s, y - 46 * s, 36 * s, 9 * s, (96, 120, 50))
  elif kind == 'icespike':
    sh(16 * s)
    for k in range(3): dx = (k - 1) * 9 * s; hh = rng.uniform(24, 44) * s; dr.polygon([(x + dx - 7 * s, y), (x + dx, y - hh), (x + dx + 7 * s, y)], fill=(170, 210, 236)); dr.line([x + dx - 2, y - 4, x + dx, y - hh + 6], fill=(240, 250, 255), width=2)
  elif kind == 'crystal':
    blob(dr, x, y - 16 * s, 34 * s, 22 * s, (170, 90, 240), 60)
    for k in range(4): dx = (k - 1.5) * 7 * s; hh = rng.uniform(20, 40) * s; c = (150, 80, 220) if k % 2 else (90, 200, 230); dr.polygon([(x + dx - 5 * s, y), (x + dx + rng.uniform(-3, 3), y - hh), (x + dx + 5 * s, y)], fill=c)
  elif kind == 'mushroom':
    sh(20 * s); dr.rectangle([x - 4 * s, y - 26 * s, x + 4 * s, y], fill=(200, 190, 170)); blob(dr, x, y - 28 * s, 22 * s, 10 * s, (90, 160, 150)); blob(dr, x, y - 28 * s, 26 * s, 14 * s, d['glow'], 50)

def edges(img, d, rng):
  dr = ImageDraw.Draw(img, 'RGBA')
  for y0, s, n in ((HOR + 14, 0.7, 9), (H + 6, 1.15, 7)):  # rząd przy górze i przy dolnej krawędzi (częściowo ucięty)
    for i in range(n):
      x = (i + rng.uniform(0.1, 0.9)) * W / n; y = y0 + rng.uniform(-6, 8)
      if rng.random() < 0.8: edge_obj(dr, d['edge'], x, y, s, d, rng)

def horizon(img, d, rng):  # wąski pas tła u samej góry
  dr = ImageDraw.Draw(img, 'RGBA'); h = d['hor']
  sky = {'cavewall': (30, 26, 36), 'volcano': (90, 50, 40)}.get(h, (150, 180, 210)); dr.rectangle([0, 0, W, HOR], fill=sky)
  col = {'trees': (50, 80, 44), 'hills': (110, 110, 80), 'dunes': (220, 180, 120), 'snowhills': (230, 236, 246), 'deadtrees': (70, 74, 56), 'crags': (110, 106, 100),
         'volcano': (50, 40, 40), 'farm': (110, 140, 60), 'jungle': (36, 76, 34), 'savanna': (170, 150, 90), 'glacier': (200, 220, 240), 'cavewall': (50, 44, 58), 'sea': (60, 110, 150)}[h]
  pts = [(0, HOR + 6)]
  for x in range(0, W + 16, 16): pts.append((x, HOR - 6 - (14 if h in ('trees', 'jungle', 'cavewall') else 8) * (0.5 + 0.5 * math.sin(x / 37 + rng.uniform(0, 0.6)))))
  pts.append((W, HOR + 6)); dr.polygon(pts, fill=col)
  img2 = img.filter(ImageFilter.GaussianBlur(1)); img.paste(img2.crop((0, 0, W, HOR + 8)), (0, 0))

def make(name, seed=11):
  d = B[name]; rng = np.random.default_rng(seed + hash(name) % 997)
  img = ground(d, seed).convert('RGBA'); details(img, d, rng); path(img, d, rng); horizon(img, d, rng); edges(img, d, rng)
  out = os.path.join(HERE, 'bitwy', f'pole-{name}.png'); img.convert('RGB').save(out); return out

if __name__ == '__main__':
  for n in (sys.argv[1:] or list(B)): print(make(n))
