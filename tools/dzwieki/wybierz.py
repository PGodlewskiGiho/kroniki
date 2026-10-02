# Dźwięki gry z próbek CC0 (Freesound, przez zbiór benjamin-paine/freesound-laion-640k na HuggingFace).
#   python3 tools/dzwieki/wybierz.py kandydaci INDEKS.jsonl    -> .cache/kandydaci.json + pobrane próbki i spektrogramy (do oceny)
#   python3 tools/dzwieki/wybierz.py wypal                      -> src/dzwieki/<zdarzenie>_<n>.mp3 + src/dzwieki/zrodla.json
# Wybór próbek (wybor.json: zdarzenie -> [freesound_id, ...]) można poprawić ręcznie; bez wpisu brana jest najlepiej oceniona.
import json, os, re, sys, subprocess, urllib.request, urllib.parse, io, math
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
sys.path.insert(0, os.path.dirname(__file__)); from katalog import CAT
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); CACHE = os.path.join(os.path.dirname(__file__), '.cache'); OUT = os.path.join(ROOT, 'src', 'dzwieki')
DS = 'benjamin-paine/freesound-laion-640k'; SR = 44100
os.makedirs(CACHE, exist_ok=True)

def score(r, c):
    t, tags, d = r['title'].lower(), ' '.join(r['tags'] or []).lower(), (r['description'] or '').lower()
    if not any(w in t or w in tags for w in c['need']): return 0
    if any(w in t or w in tags or w in d for w in c.get('no', [])): return 0
    s = 0
    for q in c['q']: s += (3 if q in t else 0) + (2 if q in tags else 0) + (0.5 if q in d else 0)
    if re.search(r'loop|ambien|ambience|music|song|melod|beat|field recording|soundscape', t + ' ' + tags): s -= 3 # chcemy pojedyncze efekty, nie podkłady
    if re.search(r'\bsfx\b|sound effect|foley|game|impact|one.?shot', t + ' ' + tags): s += 1
    return s

def fetch(row):
    p = os.path.join(CACHE, f"{row['freesound_id']}.flac")
    if os.path.exists(p): return p
    url = f"https://datasets-server.huggingface.co/rows?dataset={urllib.parse.quote(DS)}&config=default&split=train&offset={row['row']}&length=1"
    for k in range(3):
        try:
            d = json.load(urllib.request.urlopen(url, timeout=60)); src = d['rows'][0]['row']['audio'][0]['src']
            assert d['rows'][0]['row']['freesound_id'] == row['freesound_id']
            open(p, 'wb').write(urllib.request.urlopen(src, timeout=120).read()); return p
        except Exception as e: err = e
    print('  nie pobrano', row['freesound_id'], err); return None

def load(p):
    x, sr = sf.read(p, always_2d=True); x = x.mean(axis=1)
    if sr != SR: g = math.gcd(sr, SR); x = resample_poly(x, SR // g, sr // g)
    return x.astype(np.float32)

def env(x, win=256):
    e = np.sqrt(np.convolve(x * x, np.ones(win) / win, mode='same') + 1e-12); return 20 * np.log10(e + 1e-9)

def onsets(x, min_gap=0.09):
    # obwiednia w ramkach 5 ms; początek uderzenia = skok o >= 8 dB względem minimum z ostatnich 40 ms, powyżej progu ciszy
    hop = int(0.005 * SR); n = len(x) // hop
    if n < 3: return []
    e = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(axis=1)) + 1e-9); thr = e.max() - 32; out = []; last = -1e9
    for i in range(1, n):
        lo = e[max(0, i - 8): i].min()
        if e[i] > thr and e[i] - lo >= 8 and (i - last) * hop > min_gap * SR: out.append(i * hop); last = i
    return out

def shape(seg, dur, gain=0.0, lp=None):
    n = int(dur * SR); seg = seg[:n].copy()
    if lp: seg = sosfilt(butter(4, lp, 'low', fs=SR, output='sos'), seg)
    fi = int(0.003 * SR); seg[:fi] *= np.linspace(0, 1, fi)
    fo = max(1, int(len(seg) * 0.3)); seg[-fo:] *= np.linspace(1, 0, fo) ** 2
    pk = np.abs(seg).max() + 1e-9; seg = seg / pk * 10 ** (-1 / 20) # szczyt -1 dBFS
    rms = np.sqrt(np.mean(seg[: min(len(seg), int(0.3 * SR))] ** 2)) + 1e-9; tgt = 10 ** ((-14 + gain) / 20)
    seg = seg * min(1.0, tgt / rms) # nie głośniej niż -14 dB RMS (wyrównanie głośności między zdarzeniami)
    return seg.astype(np.float32)

def cut(x, c):
    start = np.argmax(np.abs(x) > np.abs(x).max() * 0.05); x = x[start:]
    if c.get('cut') == 'onsets':
        on = onsets(x); grp = c.get('group', 1); outs = []
        for i in range(0, max(0, len(on) - grp + 1)):
            s = max(0, on[i] - int(0.005 * SR)); outs.append(x[s: s + int(c['dur'] * SR) + 1])
            if len(outs) >= c['n'] * 3: break
        outs = outs[1:] if len(outs) > c['n'] else outs # pierwsze uderzenie bywa niepełne
        return outs[: c['n']] if outs else [x]
    return [x]

def spectro(name, clips):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(len(clips), 1, figsize=(8, 1.4 * len(clips)), squeeze=False)
    for a, (lab, x) in zip(ax[:, 0], clips):
        a.specgram(x[: SR * 4] + 1e-9, Fs=SR, NFFT=512, noverlap=384, cmap='magma'); a.set_ylim(0, 12000); a.set_title(lab[:90], fontsize=7); a.tick_params(labelsize=6)
    fig.tight_layout(); fig.savefig(os.path.join(CACHE, f'spec_{name}.png'), dpi=70); plt.close(fig)

def kandydaci(idx):
    rows = [json.loads(l) for l in open(idx)]; rows = [r for r in rows if r['license'] == 0]
    print('próbek CC0:', len(rows)); out = {}
    for name, c in CAT.items():
        if 'src' in c: continue
        sc = sorted(((score(r, c), r) for r in rows), key=lambda t: -t[0])[:10]; got = []
        for s, r in sc:
            if s <= 0: break
            p = fetch(r)
            if not p: continue
            try: x = load(p)
            except Exception as e: print('  zły plik', r['freesound_id'], e); continue
            got.append({ 'id': r['freesound_id'], 'title': r['title'], 'user': r['username'], 'tags': (r['tags'] or [])[:12], 'score': s, 'dur': round(len(x) / SR, 2) })
        out[name] = got; print(name, [(g['id'], g['dur'], g['title'][:30]) for g in got[:6]])
        try: spectro(name, [(f"{g['id']} {g['dur']}s {g['title']}", load(os.path.join(CACHE, f"{g['id']}.flac"))) for g in got[:6]])
        except Exception as e: print('  spektrogram:', e)
    json.dump(out, open(os.path.join(CACHE, 'kandydaci.json'), 'w'), ensure_ascii=False, indent=1)

def wypal():
    K = json.load(open(os.path.join(CACHE, 'kandydaci.json'))); W = json.load(open(os.path.join(os.path.dirname(__file__), 'wybor.json'))) if os.path.exists(os.path.join(os.path.dirname(__file__), 'wybor.json')) else {}
    ff = __import__('imageio_ffmpeg').get_ffmpeg_exe(); os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.mp3'): os.remove(os.path.join(OUT, f))
    src_of, credits = {}, {}
    for name, c in CAT.items():
        if 'src' in c: continue
        ids = W.get(name) or [g['id'] for g in K.get(name, [])[:1]]; segs = []
        for fid in ids:
            g = next((g for g in K.get(name, []) if g['id'] == fid), None) or { 'id': fid, 'title': '?', 'user': '?' }
            x = load(os.path.join(CACHE, f'{fid}.flac')); credits.setdefault(name, []).append({ 'freesound': fid, 'title': g['title'], 'user': g['user'], 'license': 'CC0-1.0' })
            segs += cut(x, c) if len(ids) == 1 else cut(x, c)[:1]
        src_of[name] = segs
    for name, c in CAT.items():
        segs = src_of[c['src']] if 'src' in c else src_of[name]
        if 'src' in c: credits[name] = credits.get(c['src'], [])
        for i, sg in enumerate(segs[: c['n']]):
            y = shape(sg, c['dur'], c.get('gain', 0), c.get('lp'))
            buf = io.BytesIO(); sf.write(buf, y, SR, format='WAV', subtype='PCM_16')
            subprocess.run([ff, '-y', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-ac', '1', '-ar', '44100', '-b:a', '96k', os.path.join(OUT, f'{name}_{i + 1}.mp3')], input=buf.getvalue(), check=True)
    json.dump(credits, open(os.path.join(OUT, 'zrodla.json'), 'w'), ensure_ascii=False, indent=1)
    tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith('.mp3'))
    print('plików:', len([f for f in os.listdir(OUT) if f.endswith('.mp3')]), 'razem KB:', tot // 1024)

if __name__ == '__main__':
    if sys.argv[1] == 'kandydaci': kandydaci(sys.argv[2])
    else: wypal()
