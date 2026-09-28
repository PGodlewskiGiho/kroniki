# Portrety bohaterów generowane modelem Stable Diffusion (DreamShaper 8, licencja CreativeML OpenRAIL-M: wolno używać
# wygenerowanych obrazów). Działa na procesorze; opisy bohaterów w bohaterowie.json (styl wspólny, opis i tło osobno).
# Kandydaci trafiają do .cache/<bohater>/<ziarno>.png, wybranego zmniejsza do gry wybierz.js.
#   python generuj.py                     wszyscy bohaterowie, po 3 warianty
#   python generuj.py "Sir Rolan,Raga" 6  wybrani, po 6 wariantów
# Środowisko: python -m venv venv && venv/bin/pip install torch diffusers transformers accelerate safetensors peft pillow
import json, os, sys, time, re, unicodedata
import torch
from diffusers import StableDiffusionPipeline, LCMScheduler

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get('MODEL', 'Lykon/dreamshaper-8')
STEPS, CFG, SIZE = int(os.environ.get('STEPS', 7)), float(os.environ.get('CFG', 1.5)), int(os.environ.get('SIZE', 512))

def slug(name):
    s = unicodedata.normalize('NFKD', name.replace('ł', 'l').replace('Ł', 'L')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def main():
    data = json.load(open(os.path.join(HERE, 'bohaterowie.json'), encoding='utf-8'))
    style, neg = data.pop('_styl'), data.pop('_negatyw')
    names = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] else list(data)
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    torch.set_num_threads(os.cpu_count())
    pipe = StableDiffusionPipeline.from_pretrained(MODEL, torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
    pipe.load_lora_weights('latent-consistency/lcm-lora-sdv1-5'); pipe.fuse_lora()  # LCM: 7 kroków zamiast ~25 (ok. 50 s na obraz bez karty graficznej)
    pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
    pipe.set_progress_bar_config(disable=True)
    for name in names:
        d = data[name]; out = os.path.join(HERE, '.cache', slug(name)); os.makedirs(out, exist_ok=True)
        prompt = style.format(opis=d['opis'], tlo=d['tlo'])
        for k in range(n):
            seed = 1000 + k + d.get('seed', 0)
            path = os.path.join(out, f'{seed}.png')
            if os.path.exists(path): continue
            t = time.time()
            img = pipe(prompt, negative_prompt=neg, num_inference_steps=STEPS, guidance_scale=CFG, width=SIZE, height=SIZE,
                       generator=torch.Generator().manual_seed(seed)).images[0]
            img.save(path); print(f'{name} {seed} {time.time() - t:.0f}s', flush=True)

if __name__ == '__main__':
    main()
