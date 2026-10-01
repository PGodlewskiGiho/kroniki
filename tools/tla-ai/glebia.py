# Głębia namalowanego tła (Depth Anything V2, metryczna, plenery): mapa odległości w metrach do analizy kamery i zasłon.
#   python glebia.py obraz.png wynik.npy [podgląd.png]
import sys, numpy as np, torch
from PIL import Image
from transformers import pipeline
src, out = sys.argv[1], sys.argv[2]
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Metric-Outdoor-Small-hf', device='cpu')
im = Image.open(src).convert('RGB')
r = pipe(im); d = r['predicted_depth'].squeeze().numpy().astype(np.float32)
d = np.array(Image.fromarray(d).resize(im.size, Image.BILINEAR))
np.save(out, d); print('głębia', d.shape, float(d.min()), float(np.median(d)), float(d.max()))
if len(sys.argv) > 3:
    v = np.clip(np.log(d) / np.log(d.max()), 0, 1); Image.fromarray((255 * (1 - v)).astype(np.uint8)).save(sys.argv[3])
