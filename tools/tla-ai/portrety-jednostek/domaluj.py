# Domalowanie portretu jednostki (render 3D z tools/grafika3d/wypal-ikony.js) modelem Stable Diffusion (img2img, mała siła):
# kształt, poza i kolory zostają z modelu, a AI dodaje malarskie przejścia, twarz i fakturę jak na portretach Heroes 3.
# Przezroczystość wraca z renderu (maska sylwetki), więc tło dorysowuje gra.
#   python domaluj.py wej.png wyj.png "opis" [siła=0.45] [ziarno=1]
import os, sys, torch
from PIL import Image, ImageFilter
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
STYLE = ', fantasy character portrait, heroes of might and magic 3 style, painterly, detailed face, soft light, highly detailed'
NEG = 'text, watermark, signature, frame, blurry, lowres, deformed face, ugly, extra limbs, bad anatomy, cartoon, anime, photo, 3d render, plastic, doll, mannequin'
src, dst, opis = sys.argv[1:4]; s = float(sys.argv[4]) if len(sys.argv) > 4 else 0.45; seed = int(sys.argv[5]) if len(sys.argv) > 5 else 1
im = Image.open(src).convert('RGBA'); w, h = im.size; W, H = 512, int(512 * h / w) // 8 * 8
bg = Image.new('RGBA', im.size, (120, 112, 96, 255)); bg.alpha_composite(im); base = bg.convert('RGB').resize((W, H), Image.LANCZOS)
torch.set_num_threads(os.cpu_count())
p = StableDiffusionImg2ImgPipeline.from_pretrained(os.environ.get('MODEL', 'Lykon/dreamshaper-8'), torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
p.scheduler = DPMSolverMultistepScheduler.from_config(p.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True); p.set_progress_bar_config(disable=True)
out = p(opis + STYLE, image=base, strength=s, negative_prompt=NEG, num_inference_steps=int(os.environ.get('STEPS', 30)), guidance_scale=7, generator=torch.Generator().manual_seed(seed)).images[0]
out = out.resize((w, h), Image.LANCZOS).convert('RGBA')
a = im.split()[3].filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8)); out.putalpha(a); out.save(dst)
