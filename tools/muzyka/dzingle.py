# Krótkie melodie zdarzeń (nie pętle): odsłonięcie kawałka mapy zagadki i wykopanie Graala. Ta sama orkiestra GM co utwory gry,
# render jak w wypal.py, ale wybrzmienie zostaje na końcu (z wyciszeniem). Wynik: src/dzwieki/<nazwa>_1.mp3 (gra: Sfx.play).
#   python3 tools/muzyka/dzingle.py
import os, sys, io, subprocess, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from nuty import *
from utwory import STR, HARP, HORN, TPT, BRASS, FLUTE, CHOIR, BELLS, TIMP, VC, CB, OBOE
CELESTA = 8
ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); OUT = os.path.join(ROOT, 'src', 'dzwieki')
MUZ = os.environ.get('MUZ_DIR', '/home/user/muzyka'); SF2 = os.path.join(MUZ, 'node_modules', 'generaluser', 'GeneralUser.sf2')
TMP = os.path.join(HERE, '.cache'); os.makedirs(TMP, exist_ok=True)

def puzzle():  # tajemnica się odsłania: harfa w górę, celesta, smyczki z chórem na zawieszonym akordzie, rozwiązanie
    S = Song('puzzle', 72, 4, 2, seed=11); pr = prog('Dsus2:2 Bm7:2 Gmaj7:2 D:2', 4, 0)
    pad_t = S.track('smyczki', STR, 0, vol=86, pan=60, rev=110); ch = S.track('chór', CHOIR, 1, vol=70, pan=70, rev=120)
    harp = S.track('harfa', HARP, 2, vol=92, pan=90, rev=100); cel = S.track('celesta', CELESTA, 3, vol=88, pan=40, rev=110)
    pad(pad_t, pr, 50, 74, 4, vel=62); pad(ch, pr[2:], 60, 76, 3, vel=58); pad_t.expr([(0, 50), (3, 96), (8, 70)])
    arp(harp, pr[:2], 50, 86, step=0.25, shape=(0, 1, 2, 3, 4, 5, 6, 7), vel=64)
    melody(cel, 4, 'A5:.5 F#5:.5 D6:1 | C#6:.5 A5:.5 D6:2', vel=78)
    return S

def grail():  # Graal: werbel kotłów, fanfara trąbek i rogów, chór, pełny akord D-dur
    S = Song('grail', 84, 4, 3, seed=12); pr = prog('D:2 G/D:2 A/D:2 D:2 Bm:1 G:1 D:4', 4, 0)
    br = S.track('blacha', BRASS, 0, vol=96, pan=60, rev=100); tp = S.track('trąbki', TPT, 1, vol=104, pan=50, rev=95)
    hn = S.track('rogi', HORN, 2, vol=96, pan=72, rev=100); ch = S.track('chór', CHOIR, 3, vol=84, pan=64, rev=120)
    st = S.track('smyczki', STR, 4, vol=90, pan=80, rev=100); tm = S.track('kotły', TIMP, 5, vol=104, pan=64, rev=90)
    bl = S.track('dzwonki', BELLS, 6, vol=70, pan=36, rev=110); cb = S.track('kontrabasy', CB, 7, vol=86, pan=78, rev=90)
    roll(tm, 0, 2, 38, 40, 104); tm.note(2, 1, 38, 118); tm.note(8, 1, 45, 100); tm.note(10, 2, 38, 118)
    melody(tp, 2, 'D5:.5 D5:.25 D5:.25 A5:1.5 | F#5:.5 G5:.5 A5:.5 B5:.5 A5:1 D6:3', vel=100)
    melody(hn, 2, 'A4:2 B4:2 | C#5:2 D5:1 B4:1 D5:4', vel=88)
    pad(br, pr[1:], 50, 70, 4, vel=84); pad(st, pr, 55, 79, 4, vel=78); pad(ch, pr[3:], 62, 79, 3, vel=74)
    bass(cb, pr, lo=26, vel=90); melody(bl, 8, 'D6:1 F#6:1 A6:2', vel=70)
    st.expr([(0, 70), (2, 110), (12, 90)])
    return S

def render(S, fade=1.6, tail=3.0):
    mid = os.path.join(TMP, S.name + '.mid'); wav = os.path.join(TMP, S.name + '.wav'); S.save(mid)
    subprocess.run(['node', os.path.join(HERE, 'render.mjs'), SF2, mid, wav, str(tail)], check=True, env={**os.environ, 'MUZ_NODE': os.path.join(MUZ, 'package.json')}, capture_output=True)
    x, sr = sf.read(wav, always_2d=True); n = min(len(x), int((S.seconds + tail) * sr)); y = x[:n].copy(); f = int(fade * sr); y[-f:] *= np.linspace(1, 0, f)[:, None] ** 2
    rms = np.sqrt(np.mean(y[: int(S.seconds * sr)] ** 2)); y *= min(10 ** (-16 / 20) / (rms + 1e-9), 10 ** (-1 / 20) / (np.abs(y).max() + 1e-9))
    buf = io.BytesIO(); sf.write(buf, y.astype(np.float32), sr, format='WAV', subtype='PCM_16'); ff = __import__('imageio_ffmpeg').get_ffmpeg_exe(); mp3 = os.path.join(OUT, S.name + '_1.mp3')
    subprocess.run([ff, '-y', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-ac', '2', '-ar', '44100', '-b:a', '112k', mp3], input=buf.getvalue(), check=True)
    print(f'{S.name}: {n / sr:.1f} s, {os.path.getsize(mp3) // 1024} KB')

if __name__ == '__main__':
    for fn in (puzzle, grail): render(fn())
