# Usuwa ramę (pnie, gałęzie nad kadrem) z namalowanego tła: ciemne piksele przy krawędziach i u góry wypełnione barwą wiersza
# (niebo / góry / ziemia z odsłoniętych miejsc), potem img2img i wklejenie tylko w obszarze ramy; środek obrazu zostaje.
#   WYPELNIJ=szkic-bez-ramy.png python bez-ramy.py frakcja wejście.png wynik.png [siła=0.5] [ziarno=3]      env PROG (jasność ramy, domyślnie 34)
import json, os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
fac, src, out = sys.argv[1:4]; strength = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5; seed = int(sys.argv[5]) if len(sys.argv) > 5 else 3
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32); H, W = a.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
lum = a.mean(2); prog = float(os.environ.get('PROG', 34))
ciemne = Image.fromarray(((lum < prog) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
for x in range(0, W, 3):  # rama = ciemne piksele połączone z krawędzią obrazu (pnie, gałęzie); ciemne góry w środku zostają
    for y in (0, H - 1):
        if ciemne.getpixel((x, y)) == 255: ImageDraw.floodfill(ciemne, (x, y), 128)
for y in range(0, H, 3):
    for x in (0, W - 1):
        if ciemne.getpixel((x, y)) == 255: ImageDraw.floodfill(ciemne, (x, y), 128)
rama = (np.asarray(ciemne) == 128) | ((lum < prog) & (yy < H * 0.36))  # plus strzępy gałęzi wysoko na niebie
rama = np.asarray(Image.fromarray((rama * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(11))) > 0
f = np.asarray(Image.open(os.environ['WYPELNIJ']).convert('RGB').resize((W, H))).astype(np.float32)  # szkic bez ramy: niebo z księżycem, góry, ziemia
sz = np.where(rama[..., None], f, a); szi = Image.fromarray(sz.clip(0, 255).astype(np.uint8)); szi.save(out.replace('.png', '-szkic.png'))
if os.environ.get('SZKIC'): sys.exit()
import torch
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
torch.set_num_threads(os.cpu_count())
O = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'opisy.json'), encoding='utf-8'))
pipe = StableDiffusionImg2ImgPipeline.from_pretrained('Lykon/dreamshaper-8', torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True); pipe.set_progress_bar_config(disable=True)
prompt = O['_styl'].replace('{opis}', O[fac].get('opis_bez_ramy', O[fac]['opis']))
res = pipe(prompt, image=szi.resize((768, 560)), strength=strength, negative_prompt=O['_negatyw'] + ', trees, tree trunks, branches, frame, vignette',
           num_inference_steps=30, guidance_scale=7, generator=torch.Generator().manual_seed(seed)).images[0].resize((W, H), Image.LANCZOS)
mask = Image.fromarray((rama * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(8))
Image.composite(res, im, mask).save(out); print(out)
