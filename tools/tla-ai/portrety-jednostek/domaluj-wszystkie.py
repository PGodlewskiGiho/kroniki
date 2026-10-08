# Domalowanie wszystkich portretów jednostek (jak domaluj.py, model wczytany raz): tools/grafika3d/.cache/portrety/<cid>.png + opisy.json
# -> tools/tla-ai/portrety-jednostek/.cache/<cid>.png. Gotowe pomija (wznowienie). Potem sklej.py.
#   python domaluj-wszystkie.py [siła=0.55] [cid,cid…]
import json, os, sys, time, torch
from PIL import Image, ImageFilter
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, '..', '..', 'grafika3d', '.cache', 'portrety'); OUT = os.path.join(HERE, '.cache'); os.makedirs(OUT, exist_ok=True)
STYLE = ', fantasy character portrait, heroes of might and magic 3 style, painterly, detailed face, soft light, highly detailed'
NEG = 'text, watermark, signature, frame, blurry, lowres, deformed face, ugly, extra limbs, bad anatomy, cartoon, anime, photo, 3d render, plastic, doll, mannequin'
s = float(sys.argv[1]) if len(sys.argv) > 1 else 0.55; only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
opisy = json.load(open(os.path.join(SRC, 'opisy.json')))
torch.set_num_threads(os.cpu_count())
p = StableDiffusionImg2ImgPipeline.from_pretrained(os.environ.get('MODEL', 'Lykon/dreamshaper-8'), torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False, use_safetensors=True)
p.scheduler = DPMSolverMultistepScheduler.from_config(p.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True); p.set_progress_bar_config(disable=True)
for i, (cid, opis) in enumerate(opisy.items()):
    dst = os.path.join(OUT, cid + '.png')
    if (only and cid not in only) or (not only and os.path.exists(dst)): continue
    t = time.time(); im = Image.open(os.path.join(SRC, cid + '.png')).convert('RGBA'); w, h = im.size; W, H = 512, int(512 * h / w) // 8 * 8
    bg = Image.new('RGBA', im.size, (120, 112, 96, 255)); bg.alpha_composite(im); base = bg.convert('RGB').resize((W, H), Image.LANCZOS)
    out = p(opis + STYLE, image=base, strength=s, negative_prompt=NEG, num_inference_steps=int(os.environ.get('STEPS', 30)), guidance_scale=7, generator=torch.Generator().manual_seed(1)).images[0]
    out = out.resize((w, h), Image.LANCZOS).convert('RGBA'); a = im.split()[3].filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8)); out.putalpha(a); out.save(dst)
    print(f'{i + 1}/{len(opisy)} {cid} {time.time() - t:.0f}s', flush=True)
print('DONE')
