# Retusz błędów obrazów AI (dodatkowe skrzydła, kończyny, zlepione postacie): zaznaczony wielokątami obszar zamalowujemy otoczeniem
# (dyfuzja kolorów z brzegu maski), potem wycinek wokół maski przemalowuje Stable Diffusion (img2img, niska siła, ten sam styl),
# a do obrazu wraca tylko obszar maski z miękką krawędzią. Reszta obrazu zostaje bit w bit.
#   python retusz.py wej.png wyj.png "x0,y0 x1,y1 x2,y2 ..." ["...kolejny wielokąt"] --opis "purple sunset sky" [--sila 0.4] [--ziarno 1] [--bez-sd]
import sys, os, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('wej'); ap.add_argument('wyj'); ap.add_argument('wielokaty', nargs='+')
ap.add_argument('--opis', default='fantasy landscape'); ap.add_argument('--sila', type=float, default=0.4); ap.add_argument('--ziarno', type=int, default=1)
ap.add_argument('--bez-sd', action='store_true'); ap.add_argument('--zapas', type=int, default=48)
a = ap.parse_args()

im = Image.open(a.wej).convert('RGB'); W, H = im.size
mask = Image.new('L', (W, H), 0); d = ImageDraw.Draw(mask)
for poly in a.wielokaty: d.polygon([tuple(map(float, p.split(','))) for p in poly.split()], fill=255)
m = np.array(mask) > 0
ys, xs = np.nonzero(m); x0, y0 = max(0, xs.min() - a.zapas), max(0, ys.min() - a.zapas); x1, y1 = min(W, xs.max() + a.zapas), min(H, ys.max() + a.zapas)

# 1) wypełnienie maski kolorami z brzegu: wielokrotne rozmywanie z przywracaniem znanych pikseli (równanie Laplace'a)
arr = np.asarray(im, dtype=np.float32).copy(); crop = arr[y0:y1, x0:x1].copy(); cm = m[y0:y1, x0:x1]
known = ~cm; fill = crop.copy(); fill[cm] = crop[known].mean(axis=0)
for it in range(1500):
    p = np.pad(fill, ((1, 1), (1, 1), (0, 0)), mode='edge'); avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / 4
    fill[cm] = avg[cm]
filled = arr.copy(); filled[y0:y1, x0:x1] = fill

# 2) faktura: wycinek przemalowany przez SD (powiększony do ~768 px), żeby łata nie była gładką plamą
out = filled
if not a.bez_sd:
    import torch
    from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
    torch.set_num_threads(os.cpu_count())
    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(os.environ.get('MODEL', 'Lykon/dreamshaper-8'), torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False, use_safetensors=True)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True); pipe.set_progress_bar_config(disable=True)
    c = Image.fromarray(filled[y0:y1, x0:x1].astype(np.uint8)); cw, ch = c.size; k = 768 / max(cw, ch); RW, RH = max(64, int(cw * k) // 8 * 8), max(64, int(ch * k) // 8 * 8)
    neg = 'text, letters, watermark, frame, blurry, deformed, extra wings, extra limbs, extra heads, bad anatomy'
    res = pipe(a.opis + ', heroes of might and magic art, epic fantasy matte painting, highly detailed', image=c.resize((RW, RH), Image.LANCZOS), strength=a.sila, negative_prompt=neg,
               num_inference_steps=int(os.environ.get('STEPS', 30)), guidance_scale=7, generator=torch.Generator().manual_seed(a.ziarno)).images[0].resize((cw, ch), Image.LANCZOS)
    out = filled.copy(); out[y0:y1, x0:x1] = np.asarray(res, dtype=np.float32)

# 3) do obrazu wraca tylko maska (poszerzona i z miękką krawędzią)
soft = np.asarray(mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(4)), dtype=np.float32)[..., None] / 255
final = arr * (1 - soft) + out * soft
Image.fromarray(np.clip(final, 0, 255).astype(np.uint8)).save(a.wyj)
print('retusz', a.wyj, 'obszar', (x0, y0, x1, y1))
