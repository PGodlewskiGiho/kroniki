# Wybrane tekstury terenu (.cache/teren/<teren>-<ziarno>.png) -> src/grafika/teren/<teren>.webp.
# Duże plamy światła i cienia (powtarzałyby się co kilka pól) są przytłumione: obraz = szczegół + LOW × rozmyte tło,
# a całość zmniejszona do ROZ px (bez szwów: rozmycie i skalowanie z zawijaniem brzegów).
#   python3 tools/tla-ai/wybierz-tekstury.py grass=2 dirt=1 sand=1 ...
import os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', '..', 'src', 'grafika', 'teren')
ROZ, LOW, Q = int(os.environ.get('ROZ', 256)), float(os.environ.get('LOW', 0.35)), int(os.environ.get('Q', 82))
def blur(a, sigma): # rozmycie Gaussa z zawijaniem (FFT)
    n, m = a.shape[:2]; k = np.fft.fftfreq(n)[:, None] ** 2 + np.fft.fftfreq(m)[None, :] ** 2; g = np.exp(-k * (2 * np.pi * sigma) ** 2 / 2)
    return np.stack([np.real(np.fft.ifft2(np.fft.fft2(a[..., c]) * g)) for c in range(a.shape[2])], -1)
os.makedirs(OUT, exist_ok=True)
for arg in sys.argv[1:]:
    name, seed = arg.split('='); a = np.asarray(Image.open(os.path.join(HERE, '.cache', 'teren', f'{name}-{seed}.png')).convert('RGB'), float)
    lo = blur(a, a.shape[0] / 12); mean = a.reshape(-1, 3).mean(0); a = a - lo + mean + (lo - mean) * LOW
    big = np.tile(np.clip(a, 0, 255).astype(np.uint8), (3, 3, 1)); n = a.shape[0]
    im = Image.fromarray(big).resize((ROZ * 3, ROZ * 3), Image.LANCZOS).crop((ROZ, ROZ, ROZ * 2, ROZ * 2))
    p = os.path.join(OUT, f'{name}.webp'); im.save(p, 'WEBP', quality=Q, method=6); print(name, seed, os.path.getsize(p), 'B')
