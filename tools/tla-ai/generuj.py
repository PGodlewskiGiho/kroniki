# Tła miast malowane modelem Stable Diffusion (DreamShaper 8, licencja CreativeML OpenRAIL-M) na szkicu kompozycji z gry
# (img2img): teren, woda, wzgórza i place pod budowlami zostają tam, gdzie stoją miejsca budowli; budowle 3D nakłada gra.
# Szkic: node <scratch>/szkic-tla.js haven  ->  tla/szkic-haven.png. Kandydaci trafiają do .cache/<frakcja>/<ziarno>-<siła>.png.
#   python generuj.py haven szkic.png [ziarna=1,2,3] [siły=0.5,0.6]
# Środowisko jak w tools/portrety-ai (venv tam; biblioteki CUDA niepotrzebne: atrapy w venv/stub, zob. uruchom.sh).
import json, os, sys, time
import torch
from PIL import Image
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get('MODEL', 'Lykon/dreamshaper-8')
STEPS, CFG, W, H = int(os.environ.get('STEPS', 30)), float(os.environ.get('CFG', 7)), 768, 560

def main():
    fac, sketch = sys.argv[1], sys.argv[2]
    seeds = [int(s) for s in (sys.argv[3] if len(sys.argv) > 3 else '1,2').split(',')]
    strengths = [float(s) for s in (sys.argv[4] if len(sys.argv) > 4 else '0.55').split(',')]
    data = json.load(open(os.path.join(HERE, 'opisy.json'), encoding='utf-8'))
    d = data[fac]; prompt = data['_styl'].format(opis=d['opis']); neg = data['_negatyw'] + ', ' + d.get('negatyw', '')
    torch.set_num_threads(os.cpu_count())
    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(MODEL, torch_dtype=torch.float32, variant='fp16', safety_checker=None, requires_safety_checker=False)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, algorithm_type='dpmsolver++', use_karras_sigmas=True)
    pipe.set_progress_bar_config(disable=True)
    init = Image.open(sketch).convert('RGB').resize((W, H), Image.LANCZOS)
    out = os.path.join(HERE, '.cache', fac); os.makedirs(out, exist_ok=True)
    for s in strengths:
        for seed in seeds:
            path = os.path.join(out, f'{seed}-{s:.2f}.png')
            if os.path.exists(path): continue
            t = time.time()
            img = pipe(prompt, image=init, strength=s, negative_prompt=neg, num_inference_steps=STEPS, guidance_scale=CFG, generator=torch.Generator().manual_seed(seed)).images[0]
            img.save(path); print(f'{fac} {seed} {s} {time.time() - t:.0f}s', flush=True)

if __name__ == '__main__':
    main()
