# Ziemia miasta wg planu (uklady/<frakcja>.json + <frakcja>-wymiary.json): na namalowanym tle zostaje niebo, las w tle, rama pni i woda,
# a teren pod miastem jest malowany od nowa jako polana: place pod obrysami budowli (prostokąt podstawy rzutowany na ziemię),
# ścieżki od traktu do frontu każdej budowli, potem img2img i wklejenie tylko w obszarze polany.
#   python polana.py frakcja wynik.png [siła=0.45] [ziarno=7]      env SZKIC=1: tylko szkic (bez AI)
import json, os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
fac, out = sys.argv[1], sys.argv[2]; strength = float(sys.argv[3]) if len(sys.argv) > 3 else 0.45; seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
U = json.load(open(f'uklady/{fac}.json')); M = json.load(open(f'uklady/{fac}-wymiary.json')); P = U['polana']
hor, d, f = U['pj']['hor'], U['pj']['d'], U['pj']['f']
im = Image.open('tla/' + P['zrodlo']).convert('RGB'); W, H = im.size; S = W / 576.0; a0 = np.asarray(im).astype(np.float32)
def I(x, y): return ((x - 8) * S, (y - 8) * S)  # kadr gry -> piksele obrazu
def scr(X, Z): return (296 + f * X / Z, hor + f * d / Z)
rng = np.random.default_rng(seed); yy, xx = np.mgrid[0:H, 0:W]
# obszar polany: wielokąt z układu minus woda (niebieskawe piksele) i pnie ramy (ciemny brąz przy krawędziach)
G = Image.new('L', (W, H), 0); ImageDraw.Draw(G).polygon([I(*p) for p in P['obszar']], fill=255); [ImageDraw.Draw(Gi).polygon([I(*p) for p in q], fill=0) for q in P.get('bez', [])] if (Gi := G) else 0; G = np.asarray(G) > 0
r, g, b = a0[..., 0], a0[..., 1], a0[..., 2]
woda = (b > r + 14) & (b >= g - 6) & (yy > (P['woda'][0] - 8) * S) & (yy < (P['woda'][1] - 8) * S)
wi = Image.fromarray((woda * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.MaxFilter(5)); ImageDraw.floodfill(wi, (0, 0), 128)  # dziury w wodzie (jasne odblaski) też są wodą
woda = np.asarray(wi) != 128
pien = ((r > g + 4) & (g < 70) & ((xx < 70 * S) | (xx > 510 * S))) if P.get('pnie', True) else np.zeros_like(G)
G &= ~woda & ~pien
top = np.where(G.any(0), G.argmax(0), H); sm = np.convolve(rng.random(W + 60), np.ones(30) / 30, 'same')[30:W + 30]; sm2 = np.convolve(rng.random(W + 16), np.ones(8) / 8, 'same')[8:W + 8]
G &= yy >= (top + (sm - 0.35) * 40 * S + sm2 * 10 * S)[None, :]  # tylna krawędź polany nieregularna: las wchodzi językami
# teren: barwy trawy z obrazu (jasna z tyłu w słońcu, ciemniejsza z przodu), szum w kilku skalach i poziome pociągnięcia
def noise(sc):
    n = rng.random((H // sc + 2, W // sc + 2)).astype(np.float32); return np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((W + sc * 2, H + sc * 2), Image.BICUBIC)).astype(np.float32)[:H, :W] / 255
t = np.clip((yy / S + 8 - P['obszar_tyl']) / (430 - P['obszar_tyl']), 0, 1)[..., None]
tyl, przod = np.array(P['trawa'][0], np.float32), np.array(P['trawa'][1], np.float32)
n = 0.5 * noise(40) + 0.3 * noise(12) + 0.2 * noise(4)
teren = (tyl * (1 - t) + przod * t) * (0.8 + 0.4 * n[..., None])
L = Image.fromarray(teren.clip(0, 255).astype(np.uint8)); ld = ImageDraw.Draw(L)
for _ in range(int(2600 * S)):  # kępki trawy: krótkie poziome kreski jaśniejsze/ciemniejsze
    x, y = rng.random() * W, (P['obszar_tyl'] - 8) * S + rng.random() * (H - (P['obszar_tyl'] - 8) * S); k = 0.4 + (y / S + 8 - hor) / 300
    c = tuple(int(v) for v in (tyl * 0.5 + przod * 0.5) * (0.75 + 0.6 * rng.random())); ld.line([(x, y), (x + (3 + 6 * rng.random()) * k * S, y - rng.random() * 2 * S)], fill=c, width=max(1, int(1.2 * k * S)))
ziemia = np.array(P['ziemia'], np.float32)
place = Image.new('L', (W, H), 0); pd = ImageDraw.Draw(place)
fronty = []
for i, o in enumerate(U['slots']):
    m = M[str(i)]; sx, sy = o['s']; zw = o['z'] * 1000 if o.get('z') else f * d / (sy - hor); X = (sx - 296) * zw / f; k = o.get('k', 1)
    w, back, front = m['w'] * k * 0.62, m['back'] * k * 0.62, m['front'] * k * 0.62 + 18  # plac odrobinę większy od podstawy, z przedpolem
    pts = []
    for a in np.linspace(0, 2 * np.pi, 40, endpoint=False):  # elipsa w świecie: plac, nie prostokąt
        ex, ez = np.cos(a), np.sin(a); pts.append(I(*scr(X + ex * w, zw + (ez * back if ez > 0 else ez * front))))
    pd.polygon(pts, fill=255); fronty.append(scr(X, zw - m['front'] * k - 6))
for o in U.get('ozdoby', []):  # małe place pod ozdobami (żeby nie stały w wodzie)
    sx, sy = o['s']; zw = f * d / (sy - hor); X = (sx - 296) * zw / f; r0 = 16 * o.get('k', 1)
    pd.polygon([I(*scr(X + np.cos(a) * r0, zw + np.sin(a) * r0 * 0.8)) for a in np.linspace(0, 2 * np.pi, 24, endpoint=False)], fill=255)
# ścieżki: trakt z układu + odnoga do frontu każdej budowli od najbliższego punktu traktu
def spline(pts, n=20):
    Q = [pts[0]] + pts + [pts[-1]]; o = []
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = map(np.array, Q[i - 1:i + 3])
        for tt in np.linspace(0, 1, n, endpoint=False): o.append(0.5 * ((2 * p1) + (-p0 + p2) * tt + (2 * p0 - 5 * p1 + 4 * p2 - p3) * tt * tt + (-p0 + 3 * p1 - 3 * p2 + p3) * tt ** 3))
    o.append(np.array(pts[-1])); return o
trakt = spline(P['trakt'])
sciezki = [(trakt, P['trakt_w'])]
for i, fp in enumerate(fronty):
    if i in P.get('bez_sciezki', []): continue
    q = min(trakt, key=lambda p: (p[0] - fp[0]) ** 2 + (p[1] - fp[1]) ** 2 * 3); mid = ((q[0] + fp[0]) / 2, max(q[1], fp[1]) + 4)
    sciezki.append((spline([list(q), list(mid), list(fp)], 12), P['trakt_w'] * 0.6))
for pts, wd in sciezki:
    for x, y in pts:
        rr = wd * max(0.2, (y - hor) / (420 - hor)) / 2; kk = rr * (y - hor) / np.hypot(f, y - hor); X0, Y0 = I(x, y)
        pd.ellipse([X0 - rr * S, Y0 - kk * S, X0 + rr * S, Y0 + kk * S], fill=255)
place = place.filter(ImageFilter.GaussianBlur(2 * S)); pa = (np.asarray(place).astype(np.float32) / 255)[..., None]
tx = (0.75 + 0.5 * (0.6 * noise(6) + 0.4 * noise(2)))[..., None]
teren = np.asarray(L).astype(np.float32); teren = teren * (1 - pa * 0.85) + ziemia * tx * pa * 0.85
if P.get('bagno'):  # bagno: woda między placami (rozlewiska i kanały), brzeg z mułu, trzciny na brzegu
    pm = Image.fromarray((np.asarray(place) > 40).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(int(9 * S) | 1)).filter(ImageFilter.GaussianBlur(3 * S))
    nz = 0.55 * noise(34) + 0.3 * noise(12) + 0.15 * noise(4); fy = np.clip((yy / S + 8 - P['obszar_tyl']) / 60, 0, 1)
    wm = G & (np.asarray(pm) < 60) & (nz * fy > P['bagno'])
    wm = np.asarray(Image.fromarray(wm.astype(np.uint8) * 255).filter(ImageFilter.MedianFilter(5))) > 128
    brzeg = (np.asarray(Image.fromarray(wm.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(int(5 * S) | 1))) > 128) & ~wm
    wk = np.array(P.get('woda_kolor', [[150, 170, 140], [40, 60, 48]]), np.float32); tw = np.clip((yy / S + 8 - P['obszar_tyl']) / (430 - P['obszar_tyl']), 0, 1)[..., None] ** 0.6
    wc = wk[0] * (1 - tw) + wk[1] * tw; wc = wc * (0.92 + 0.16 * noise(3)[..., None] * (0.5 + 0.5 * np.sin(yy / S * 1.7))[..., None])
    teren = np.where(wm[..., None], wc, teren); teren = np.where(brzeg[..., None], ziemia * 0.7 * tx, teren)
    T = Image.fromarray(teren.clip(0, 255).astype(np.uint8)); td = ImageDraw.Draw(T); by, bx = np.nonzero(brzeg)
    for j in rng.choice(len(bx), size=min(len(bx), int(900 * S)), replace=False):  # trzciny
        x, y = bx[j], by[j]; k = 0.4 + (y / S + 8 - hor) / 260; hgt = (4 + 8 * rng.random()) * k * S
        td.line([(x, y), (x + (rng.random() - 0.5) * 2 * S, y - hgt)], fill=tuple(int(v) for v in np.array([70, 90, 40]) * (0.7 + 0.6 * rng.random())), width=max(1, int(0.9 * k * S)))
    teren = np.asarray(T).astype(np.float32)
szkic = np.where(G[..., None], teren, a0)
sz = Image.fromarray(szkic.clip(0, 255).astype(np.uint8)); sz.save(out.replace('.png', '-szkic.png'))
if os.environ.get('SZKIC'): print(out.replace('.png', '-szkic.png')); sys.exit()
import torch
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
torch.set_num_threads(os.cpu_count())
pipe = StableDiffusionImg2ImgPipeline.from_pretrained(os.environ.get('MODEL', 'Lykon/dreamshaper-8'), torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True); pipe.set_progress_bar_config(disable=True)
res = pipe(P['opis'], image=sz.resize((768, 560), Image.LANCZOS), strength=strength, negative_prompt='buildings, houses, huts, tents, people, animals, text, watermark, blurry, lowres, fog, mist, haze, smoke, bushes, shrubs, flowers, trees',
           num_inference_steps=30, guidance_scale=7, generator=torch.Generator().manual_seed(seed)).images[0].resize((W, H), Image.LANCZOS)
mask = Image.fromarray((G * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4 * S))
Image.composite(res, im, mask).save(out); print(out)
