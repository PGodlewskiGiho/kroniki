# Bezszwowe tekstury terenu mapy przygody malowane modelem Stable Diffusion (DreamShaper 8, img2img).
# Baza: okresowy szum (filtr w dziedzinie Fouriera, więc z natury bez szwów) zabarwiony paletą terenu z gry (TERRAINS.pal) i cechami
# terenu (szczeliny lawy, zmarszczki piasku, kałuże bagna, kępy trawy); model domalowuje fakturę. Bezszwowość obrazu wyniku:
# splot z zawijaniem brzegów (padding_mode='circular') w U-Net i VAE.
# Kandydaci: .cache/teren/<teren>-<ziarno>.png (512×512). Wybrane trafiają do src/grafika/teren/<teren>.webp (wybierz.py niżej).
#   tools/tla-ai/uruchom-tekstury.sh [tereny=grass,dirt,...] [ziarna=1,2]
import os, sys, time
import numpy as np, torch
from PIL import Image
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get('MODEL', 'Lykon/dreamshaper-8')
STEPS, CFG, S = int(os.environ.get('STEPS', 24)), float(os.environ.get('CFG', 7)), int(os.environ.get('S', 512))
STYL = 'top-down view of {opis}, ground texture filling the whole frame, painterly fantasy strategy game map terrain, rich natural detail, soft even daylight'
STR = float(os.environ.get('STR', 0.55)); STRS = {'swamp': 0.62, 'snow': 0.5, 'grass': 0.6, 'cave': 0.6, 'water': 0.55} # bagno, śnieg, trawa: mocniej przemalowane (baza za prosta)
PAL = { 'grass': ['#3c7a2a', '#4b8f32', '#5ea23e', '#86c25a'], 'dirt': ['#735432', '#8a6a3e', '#9e7c4a', '#5a4226'], 'sand': ['#c9b074', '#d8c388', '#e6d49c', '#b39660'], 'snow': ['#c8d6e4', '#e2e9f1', '#f4f8fb', '#a6bad2'],
  'cave': ['#463c34', '#564a40', '#685a4c', '#2a241f'], 'water': ['#1d4c8a', '#245a9a', '#2f6aac', '#6a9fd4'],
  'swamp': ['#3e5638', '#4c6444', '#5c7650', '#2c4636'], 'rough': ['#7e6e4a', '#94825a', '#a8966c', '#65573a'], 'lava': ['#2a201d', '#3a2c28', '#4a3a34', '#ff6a1a'] }
NEG = 'long grass blades, branches, plants stems, perspective, horizon, sky, landscape, objects, buildings, houses, people, animals, trees, text, watermark, signature, frame, border, vignette, blurry, photo, 3d render, tiles grid, seams'
OPIS = {
    'grass': 'dense short grass seen from directly above, tiny grass blades, moss, clover leaves and a few tiny wild flowers, evenly spread',
    'dirt': 'brown packed earth ground with small pebbles, dry cracks and sparse withered grass',
    'sand': 'golden desert sand with gentle wind ripples and a few tiny stones',
    'snow': 'fresh powdery snow field seen from directly above, soft gentle bumps and tiny drifts, faint pale blue shadows, small glittering ice crystals, evenly spread',
    'swamp': 'marshland seen from directly above, carpet of dark green moss and wet grass, small patches of black mud, tiny pools with duckweed and lily pads, small reed clumps, evenly spread',
    'cave': 'underground cave floor seen from directly above, dark worn stone, cobbles and gravel, cracks, a few tiny faintly glowing mushrooms, evenly spread',
    'water': 'deep blue sea water surface seen from directly above, gentle painted wave ripples and small foam flecks, evenly spread',
    'rough': 'rough rocky ground, cracked grey brown stone slabs, gravel and sparse dry grass',
    'lava': 'volcanic ground, black cracked basalt rock with thin glowing orange lava cracks and ash',
}

def pnoise(n, sigma, rng): # okresowy szum: biały szum rozmyty filtrem Gaussa w dziedzinie Fouriera (zawija się na brzegach)
    f = np.fft.fft2(rng.standard_normal((n, n))); k = np.fft.fftfreq(n)[:, None] ** 2 + np.fft.fftfreq(n)[None, :] ** 2
    v = np.real(np.fft.ifft2(f * np.exp(-k * (2 * np.pi * sigma) ** 2 / 2))); return (v - v.min()) / (v.max() - v.min() + 1e-9)
def hexrgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
def base(name, n, seed):
    rng = np.random.default_rng(seed); P = [hexrgb(c) for c in PAL[name]]
    v = np.clip((pnoise(n, n / 14, rng) * 0.65 + pnoise(n, n / 40, rng) * 0.35 - 0.5) * 1.8 + 0.5, 0, 1)[..., None]
    col = np.where(v < 0.5, P[1] + (P[0] - P[1]) * (1 - v * 2), P[1] + (P[2] - P[1]) * (v - 0.5) * 2); fine = pnoise(n, n / 160, rng)[..., None]; col *= 0.9 + fine * 0.2
    m = pnoise(n, n / 30, rng)[..., None]
    if name == 'lava': cr = np.abs(pnoise(n, n / 22, rng) - 0.5)[..., None]; col = np.where(cr < 0.025, P[3], np.where(cr < 0.045, P[3] * 0.55, col))
    if name == 'sand': y = np.arange(n)[:, None, None]; w = np.sin((y / n * 24 + pnoise(n, n / 10, rng)[..., None] * 3) * 2 * np.pi); col = np.where(w > 0.6, col * 1.08, col)
    if name == 'cave': cr = np.abs(pnoise(n, n / 18, rng) - 0.5)[..., None]; col = np.where(cr < 0.02, P[3], col)
    if name == 'water': y = np.arange(n)[:, None, None]; w = np.sin((y / n * 16 + pnoise(n, n / 8, rng)[..., None] * 5) * 2 * np.pi); col = np.where(w > 0.75, col * 0.7 + P[3] * 0.3, col)
    if name == 'swamp': col = np.where(m > 0.68, P[3] * 0.85, col)
    if name in ('grass', 'dirt', 'rough'): col = np.where(m > 0.7, col * 0.82 + P[3] * 0.18, col)
    if name == 'snow': col = np.where(m < 0.3, col * 0.93 + np.array([150, 175, 215]) * 0.07, col)
    return Image.fromarray(np.clip(col, 0, 255).astype(np.uint8))
def circular(model):
    for m in model.modules():
        if isinstance(m, torch.nn.Conv2d): m.padding_mode = 'circular'

def main():
    names = (sys.argv[1] if len(sys.argv) > 1 else ','.join(OPIS)).split(',')
    seeds = [int(s) for s in (sys.argv[2] if len(sys.argv) > 2 else '1').split(',')]
    torch.set_num_threads(os.cpu_count())
    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(MODEL, torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True)
    pipe.set_progress_bar_config(disable=True); circular(pipe.unet); circular(pipe.vae)
    out = os.path.join(HERE, '.cache', 'teren'); os.makedirs(out, exist_ok=True)
    for name in names:
        for seed in seeds:
            path = os.path.join(out, f'{name}-{seed}.png')
            if os.path.exists(path): continue
            t = time.time(); g = torch.Generator().manual_seed(seed)
            init = base(name, S, seed); init.save(path.replace('.png', '-baza.png'))
            img = pipe(STYL.format(opis=OPIS[name]), image=init, strength=STRS.get(name, STR), negative_prompt=NEG, num_inference_steps=STEPS, guidance_scale=CFG, generator=g).images[0]
            img.save(path); print(f'{name} {seed} {time.time() - t:.0f}s', flush=True)
    print('KONIEC', flush=True)

if __name__ == '__main__':
    main()
