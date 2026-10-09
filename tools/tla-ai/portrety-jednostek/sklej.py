# Arkusz portretów do gry: rendery 3D z tools/grafika3d/.cache/portrety (bez domalowywania przez AI) zmniejszone
# do 112×128 (gra rysuje je w połowie) -> src/grafika/ikony.webp + ikony.json { f: { cid: [x, y, w, h] } }.   python sklej.py
import json, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..'); RAW = os.path.join(ROOT, 'tools', 'grafika3d', '.cache', 'portrety')
PW, PH, COLS = 112, 128, 16
ids = list(json.load(open(os.path.join(RAW, 'opisy.json'))).keys())
sheet = Image.new('RGBA', (COLS * (PW + 2), -(-len(ids) // COLS) * (PH + 2)), (0, 0, 0, 0)); f = {}
for i, cid in enumerate(ids):
    im = Image.open(os.path.join(RAW, cid + '.png')).convert('RGBA').resize((PW, PH), Image.LANCZOS)
    x, y = (i % COLS) * (PW + 2), (i // COLS) * (PH + 2); sheet.paste(im, (x, y)); f[cid] = [x, y, PW, PH]
sheet.save(os.path.join(ROOT, 'src', 'grafika', 'ikony.webp'), quality=88, method=6); json.dump({'f': f}, open(os.path.join(ROOT, 'src', 'grafika', 'ikony.json'), 'w'))
print(f'{len(ids)} portretów, {os.path.getsize(os.path.join(ROOT, "src", "grafika", "ikony.webp")) // 1024} KB')
