# Kontrola: każdy instrument utworu osobno -> głośność (dB RMS) i środek widma (Hz). Pomaga wyłapać ciszę, szum albo zły instrument.
import sys, os, subprocess, numpy as np, soundfile as sf
from utwory import SONGS
from wypal import SF2, MUZ, TMP, HERE
for fn in SONGS:
    if sys.argv[1:] and fn.__name__ not in sys.argv[1:]: continue
    S = fn(); allt = S.tracks; print(S.name)
    for tr in allt:
        S.tracks = [tr]; mid = os.path.join(TMP, 'stem.mid'); wav = os.path.join(TMP, 'stem.wav'); S.save(mid)
        subprocess.run(['node', os.path.join(HERE, 'render.mjs'), SF2, mid, wav, '1'], check=True, capture_output=True)
        x, sr = sf.read(wav); m = x.mean(1); rms = 20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9)
        sp = np.abs(np.fft.rfft(m[: sr * 20])); f = np.fft.rfftfreq(len(m[: sr * 20]), 1 / sr); cen = (sp * f).sum() / (sp.sum() + 1e-9)
        hf = 20 * np.log10(sp[f > 8000].sum() / (sp.sum() + 1e-9) + 1e-9)
        print(f'  {tr.name:18s} prog {tr.prog:3d} ch {tr.ch:2d}  {rms:6.1f} dB  środek {cen:6.0f} Hz  >8k {hf:6.1f} dB  nut {len(tr.notes)}')
    S.tracks = allt
