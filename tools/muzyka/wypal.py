# Muzyka gry: utwory.py -> MIDI -> render (spessasynth_core + GeneralUser GS) -> pętla bez szwu -> MP3 w src/muzyka/.
#   python3 tools/muzyka/wypal.py [nazwa ...]
# Wymaga: pip mido numpy soundfile imageio-ffmpeg; npm (w $MUZ_DIR, domyślnie /home/user/muzyka): spessasynth_core generaluser
# Pętla: ogon po końcu utworu (pogłos, wybrzmienia) jest dodawany na początek, a plik ma dokładnie długość utworu.
import os, sys, io, json, subprocess, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from utwory import SONGS
from zamki import ZAMKI
from bitwy import BITWY
SONGS = SONGS + ZAMKI + BITWY  # muzyka miast (każda frakcja) i dodatkowe utwory bitew
ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); OUT = os.path.join(ROOT, 'src', 'muzyka')
MUZ = os.environ.get('MUZ_DIR', '/home/user/muzyka'); SF2 = os.path.join(MUZ, 'node_modules', 'generaluser', 'GeneralUser.sf2')
TMP = os.path.join(HERE, '.cache'); os.makedirs(TMP, exist_ok=True); os.makedirs(OUT, exist_ok=True)
TAIL = 5.0

def build(fn):
    S = fn(); mid = os.path.join(TMP, S.name + '.mid'); wav = os.path.join(TMP, S.name + '.wav'); S.save(mid)
    subprocess.run(['node', os.path.join(HERE, 'render.mjs'), SF2, mid, wav, str(TAIL)], check=True, env={**os.environ, 'MUZ_NODE': os.path.join(MUZ, 'package.json')}, capture_output=True)
    x, sr = sf.read(wav, always_2d=True); L = int(round(S.seconds * sr))
    y = x[:L].copy(); t = x[L:L + int(TAIL * sr)]; y[:len(t)] += t  # ogon na początek: pętla bez szwu
    rms = np.sqrt(np.mean(y ** 2)); y *= min(10 ** (-18 / 20) / (rms + 1e-9), 10 ** (-1 / 20) / (np.abs(y).max() + 1e-9))  # -18 dB RMS, szczyt maks. -1 dBFS
    buf = io.BytesIO(); sf.write(buf, y.astype(np.float32), sr, format='WAV', subtype='PCM_16')
    ff = __import__('imageio_ffmpeg').get_ffmpeg_exe(); mp3 = os.path.join(OUT, S.name + '.mp3')
    subprocess.run([ff, '-y', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-ac', '2', '-ar', '44100', '-b:a', '112k', mp3], input=buf.getvalue(), check=True)
    peak = 20 * np.log10(np.abs(y).max() + 1e-9)
    print(f'{S.name}: {S.seconds:.1f}s, szczyt {peak:.1f} dB, {os.path.getsize(mp3) // 1024} KB')
    return S.name, round(S.seconds, 4)

if __name__ == '__main__':
    want = set(sys.argv[1:]); meta_p = os.path.join(OUT, 'petle.json')
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for fn in SONGS:
        if want and fn.__name__ not in want and fn().name not in want: continue
        n, sec = build(fn); meta[n] = sec
    json.dump(meta, open(meta_p, 'w'), indent=1)
