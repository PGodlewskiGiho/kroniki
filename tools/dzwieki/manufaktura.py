# Dźwięk miasta Manufaktury na mapie (amb_town_forge): syntetyczna pętla 4 s – miarowe uderzenia tłoka, syk pary po każdym
# drugim uderzeniu, niski szum maszynowni, a w tle kowadło z amb_forge (ściszone). Pętla bez szwu: wszystko okresowe w 4 s.
#   python3 tools/dzwieki/manufaktura.py
import os, subprocess, numpy as np, imageio_ffmpeg
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); DZ = os.path.join(ROOT, 'src', 'dzwieki')
SR, DUR = 44100, 4.0; N = int(SR * DUR); t = np.arange(N) / SR; rng = np.random.default_rng(37); ff = imageio_ffmpeg.get_ffmpeg_exe()

def lowpass(x, fc):  # jednobiegunowy filtr, dwa przejścia
    a = np.exp(-2 * np.pi * fc / SR)
    for _ in range(2):
        y = np.empty_like(x); s = 0.0
        for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
        x = y
    return x

def wrap(ev):  # zdarzenie zawinięte w pętlę (ogon z końca na początek)
    out = np.zeros(N); out[:len(ev)] += ev[:N]
    if len(ev) > N: out[:len(ev) - N] += ev[N:]
    return out

def at(ev, sec): return np.roll(wrap(ev), int(sec * SR))

mix = np.zeros(N)
# tłok: niski stuk (opadający sinus) z trzaskiem, cztery razy w pętli
k = np.arange(int(0.5 * SR)) / SR
thump = np.sin(2 * np.pi * (70 * k - 30 * k * k)) * np.exp(-k * 14) + lowpass(rng.standard_normal(len(k)), 900) * np.exp(-k * 40) * 1.4
for s in (0.0, 1.0, 2.0, 3.0): mix += at(thump * (1.0 if s % 2 == 0 else 0.7), s)
# syk pary: szum górnoprzepustowy, narasta i gaśnie
k = np.arange(int(0.9 * SR)) / SR; n = rng.standard_normal(len(k)); hiss = (n - lowpass(n, 1800)) * np.minimum(k / 0.04, 1) * np.exp(-k * 4.5) * 0.55
for s in (0.25, 2.25): mix += at(hiss, s)
# szum maszynowni: brum 50/100 Hz i niski szum
mix += 0.08 * np.sin(2 * np.pi * 50 * t) + 0.04 * np.sin(2 * np.pi * 100 * t) + 0.25 * lowpass(rng.standard_normal(N), 160)
# kowadło z kuźni na mapie (ściszone, przesunięte)
raw = subprocess.run([ff, '-loglevel', 'error', '-i', os.path.join(DZ, 'amb_forge_1.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), 'pipe:1'], capture_output=True, check=True).stdout
anv = np.frombuffer(raw, np.float32).astype(float)[:N]; anv = np.pad(anv, (0, N - len(anv)))
mix += np.roll(anv, int(0.6 * SR)) * 0.45 / (np.abs(anv).max() + 1e-9)
mix *= 10 ** (-20 / 20) / (np.sqrt(np.mean(mix ** 2)) + 1e-9); mix *= min(1, 0.89 / np.abs(mix).max())
out = os.path.join(DZ, 'amb_town_forge_1.mp3')
subprocess.run([ff, '-y', '-loglevel', 'error', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-i', 'pipe:0', '-b:a', '96k', out], input=mix.astype(np.float32).tobytes(), check=True)
print(out, os.path.getsize(out) // 1024, 'KB')
