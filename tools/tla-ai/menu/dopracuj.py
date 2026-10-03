# Dopracowanie obrazu menu (po malowaniu szkicu): img2img całości w większej rozdzielczości (szczegóły) albo wycinka
# (bohater z księgą, smok) w powiększeniu, z dorysowanym szkicem elementu i wklejeniem z miękką krawędzią.
#   python dopracuj.py calosc wej.png wyj.png 1536 768 0.3 [ziarno]
#   python dopracuj.py wycinek wej.png wyj.png x0 y0 x1 y1 siła "opis" [szkic-nakładka.png|-] [ziarno]   (współrzędne w pikselach wej.png)
import sys, os, torch
from PIL import Image, ImageFilter
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
STYLE = ', heroes of might and magic art, epic fantasy matte painting, highly detailed, sunset light'
NEG = 'text, letters, watermark, signature, frame, blurry, lowres, deformed, extra limbs, bad anatomy, ugly, cartoon, photo, modern'


def pipe():
    torch.set_num_threads(os.cpu_count())
    p = StableDiffusionImg2ImgPipeline.from_pretrained(os.environ.get('MODEL', 'Lykon/dreamshaper-8'), torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
    p.scheduler = DPMSolverMultistepScheduler.from_config(p.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True)
    p.set_progress_bar_config(disable=True)
    return p


def run(p, img, prompt, s, seed):
    return p(prompt + STYLE, image=img, strength=s, negative_prompt=NEG, num_inference_steps=int(os.environ.get('STEPS', 32)), guidance_scale=7, generator=torch.Generator().manual_seed(seed)).images[0]


mode, src, dst = sys.argv[1:4]
im = Image.open(src).convert('RGB')
if mode == 'calosc':
    W, H, s = int(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6])
    seed = int(sys.argv[7]) if len(sys.argv) > 7 else 1
    prompt = os.environ.get('OPIS', 'knight with red cape on a cliff above a vast valley with white medieval castles, shining river, sunset sky, golden clouds')
    run(pipe(), im.resize((W, H), Image.LANCZOS), prompt, s, seed).save(dst)
else:
    x0, y0, x1, y1 = map(int, sys.argv[4:8]); s = float(sys.argv[8]); prompt = sys.argv[9]
    over = sys.argv[10] if len(sys.argv) > 10 and sys.argv[10] != '-' else None
    seed = int(sys.argv[11]) if len(sys.argv) > 11 else 1
    crop = im.crop((x0, y0, x1, y1)); cw, ch = crop.size; k = 768 / max(cw, ch); RW, RH = int(cw * k) // 8 * 8, int(ch * k) // 8 * 8
    big = crop.resize((RW, RH), Image.LANCZOS)
    if over:  # szkic elementu (RGBA, w układzie wej.png) dorysowany przed malowaniem
        o = Image.open(over).convert('RGBA').crop((x0, y0, x1, y1)).resize((RW, RH), Image.LANCZOS); big.paste(o, (0, 0), o)
    out = run(pipe(), big, prompt, s, seed).resize((cw, ch), Image.LANCZOS)
    m = Image.new('L', (cw, ch), 0); b = max(6, min(cw, ch) // 8); m.paste(255, (b, b, cw - b, ch - b)); m = m.filter(ImageFilter.GaussianBlur(b / 2))
    im.paste(out, (x0, y0), m); im.save(dst)
