# Drogi na namalowanym tle: przebieg z układu (uklady/<frakcja>.json, "drogi"), rysowany w perspektywie (szerokość ∝ odległość od
# horyzontu), potem przemalowany przez AI (img2img na całym obrazie) i wklejony z powrotem tylko w pasie drogi z miękką krawędzią.
#   python drogi.py tło.png uklad.json wynik.png [siła=0.4] [ziarno=7]
import json, os, sys, numpy as np, torch
from PIL import Image, ImageDraw, ImageFilter
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
src, lay, out = sys.argv[1], sys.argv[2], sys.argv[3]; strength = float(sys.argv[4]) if len(sys.argv) > 4 else 0.4; seed = int(sys.argv[5]) if len(sys.argv) > 5 else 7
U = json.load(open(lay, encoding='utf-8')); hor = U['pj']['hor']
im = Image.open(src).convert('RGB'); W, H = im.size; S = W / 576.0
def spline(pts, n=24):  # Catmull-Rom przez punkty
    P = [pts[0]] + pts + [pts[-1]]; o = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = map(np.array, P[i - 1:i + 3])
        for t in np.linspace(0, 1, n, endpoint=False): o.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    o.append(np.array(pts[-1])); return o
mask = Image.new('L', (W, H), 0); md = ImageDraw.Draw(mask); draw = im.copy(); dd = ImageDraw.Draw(draw); rng = np.random.default_rng(3)
for R in U.get('drogi', []):
    pts = spline(R['pts'])
    for p in pts:
        x, y = p; w = R['w'] * max(0.15, (y - hor) / (420 - hor)) / 2; X, Y, r = (x - 8) * S, (y - 8) * S, w * S
        k = r * max(0.3, (y - hor) / np.hypot(U['pj'].get('f', 1000), y - hor))  # elipsa w perspektywie
        md.ellipse([X - r * 1.5, Y - k * 1.5, X + r * 1.5, Y + k * 1.5], fill=255)
        c = tuple(int(v) for v in np.array([148, 124, 88]) + rng.normal(0, 8, 3)); dd.ellipse([X - r, Y - k, X + r, Y + k], fill=c)
draw = Image.blend(im, draw, 0.85)
torch.set_num_threads(os.cpu_count())
pipe = StableDiffusionImg2ImgPipeline.from_pretrained(os.environ.get('MODEL', 'Lykon/dreamshaper-8'), torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True); pipe.set_progress_bar_config(disable=True)
prompt = 'detailed fantasy matte painting, green river valley with winding dirt roads and worn cobblestone paths through the meadows, wheel ruts, grass edges, painterly, crisp'
neg = 'buildings, houses, people, text, watermark, blurry, lowres'
res = pipe(prompt, image=draw.resize((768, 560), Image.LANCZOS), strength=strength, negative_prompt=neg, num_inference_steps=30, guidance_scale=7, generator=torch.Generator().manual_seed(seed)).images[0].resize((W, H), Image.LANCZOS)
soft = mask.filter(ImageFilter.GaussianBlur(3 * S))
Image.composite(res, im, soft).save(out); draw.save(out.replace('.png', '-szkic.png')); print(out)
