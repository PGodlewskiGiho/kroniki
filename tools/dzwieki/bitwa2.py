# Dźwięki bitwy, wersja 2 (po odsłuchu właściciela gry): ręcznie wybrane próbki CC0 z Freesound (zbiór freesound-laion-640k),
# wycięte i złożone warstwami tam, gdzie pojedyncze nagranie brzmiało za lekko (łoskot = gruz + niski huk, cios w zbroję = metal + uderzenie).
#   python3 tools/dzwieki/bitwa2.py            -> src/dzwieki/<zdarzenie>_<n>.mp3 (tylko zdarzenia z tej listy) + wpisy w zrodla.json
# Próbki pobiera wybierz.py (cache: tools/dzwieki/.cache/<freesound_id>.flac).
import os, sys, io, json, subprocess, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from wybierz import load, onsets, shape, SR, CACHE, OUT
from scipy.signal import butter, sosfilt
lp = lambda x, f: sosfilt(butter(4, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def seg(fid, k=0, dur=1.0, at=None, strongest=False):
    # k-te uderzenie nagrania (albo najgłośniejsze, albo od podanej sekundy) i dur sekund dalej
    x = load(os.path.join(CACHE, f'{fid}.flac'))
    if at is not None: s = int(at * SR)
    else:
        on = onsets(x, 0.12) or [int(np.argmax(np.abs(x) > np.abs(x).max() * 0.05))]
        if strongest: # uderzenia uszeregowane od najgłośniejszego
            on = sorted(on, key=lambda i: -np.abs(x[i: i + int(0.15 * SR)]).max())
        s = max(0, on[min(k, len(on) - 1)] - int(0.004 * SR))
    return x[s: s + int(dur * SR)]
def mix(*parts): # (sygnał, dB, opóźnienie s)
    n = max(len(p) + int(d * SR) for p, _, d in parts); y = np.zeros(n, np.float32)
    for p, db, d in parts: o = int(d * SR); y[o: o + len(p)] += p / (np.abs(p).max() + 1e-9) * 10 ** (db / 20)
    return y
# zdarzenie -> lista wariantów: (funkcja tworząca sygnał, długość s, korekta głośności dB), źródła do podziękowań
EV = {
 'hit_metal': ([lambda: mix((seg(614062, dur=0.8), 0, 0), (lp(seg(583306, dur=0.5), 180), -2, 0)), lambda: mix((seg(614063, dur=0.8), 0, 0), (lp(seg(583306, k=1, dur=0.5), 180), -2, 0))], 0.8, 2, [614062, 614063, 583306]),
 'scream':    ([lambda: seg(432058, dur=1.1), lambda: seg(540454, dur=1.0), lambda: seg(523216, dur=0.6)], 1.1, 0, [432058, 540454, 523216]),
 'v_human':   ([lambda: seg(521832, dur=0.9), lambda: seg(621335, dur=0.9), lambda: seg(474650, dur=0.7)], 0.9, 0, [521832, 621335, 474650]),
 'firebreath':([lambda: seg(323496, dur=1.5), lambda: seg(157616, dur=1.5)], 1.5, 2, [323496, 157616]),
 'burn':      ([lambda: seg(260584, dur=0.9), lambda: seg(262478, dur=0.9)], 0.9, 0, [260584, 262478]),
 'march':     ([lambda k=k: mix((seg(556002 if k % 2 else 452628, k=2 + k, dur=0.3, strongest=True), 0, 0), (seg(511501 if k < 2 else 511503, k=2 + k % 2 * 3, dur=0.3, strongest=True), -5, 0.01)) for k in range(4)], 0.3, 0, [556002, 452628, 511501, 511503]), # but w żwirze + brzęk zbroi
 'gallop':    ([lambda k=k: seg(368583, k=k * 2, dur=0.32, strongest=True) for k in range(4)], 0.32, 1, [368583]),
 'pierce':    ([lambda: seg(417192, dur=0.45, strongest=True), lambda: seg(417192, k=1, dur=0.45, strongest=True)], 0.45, 1, [417192]),
 'explode':   ([lambda: seg(439270, dur=2.4), lambda: seg(418970, dur=2.4)], 2.4, 4, [439270, 418970]),
 'lightning': ([lambda: seg(393067, dur=0.6), lambda: seg(393067, k=1, dur=0.6)], 0.6, 0, [393067]),
 'thunder':   ([lambda: seg(574042, dur=2.2), lambda: seg(434359, dur=2.2)], 2.2, 3, [574042, 434359]),
 'crash':     ([lambda: mix((seg(569507, dur=1.0), 0, 0), (lp(seg(418970, dur=1.4), 300), -3, 0)), lambda: mix((seg(569500, dur=1.0), 0, 0), (lp(seg(439270, dur=1.4), 300), -3, 0))], 1.4, 3, [569507, 569500, 418970, 439270]),
 'v_demon':   ([lambda: seg(400631, dur=1.2), lambda: seg(397240, k=0, dur=1.3, strongest=True)], 1.3, 1, [400631, 397240]),
 'horn':      ([lambda: seg(539956, dur=1.8)], 1.8, 0, [539956]),
 'order':     ([lambda: seg(235453, dur=1.1), lambda: seg(164446, dur=1.0, strongest=True)], 1.1, 1, [235453, 164446]),
 'power':     ([lambda: seg(172631, dur=1.0)], 1.0, 0, [172631]),
 'luck':      ([lambda: hp(seg(521886, dur=1.2), 300)], 1.2, -4, [521886]),
 'waver':     ([lambda: seg(449438, dur=1.0)], 1.0, -2, [449438]),
}
if __name__ == '__main__':
    only = sys.argv[1].split(',') if len(sys.argv) > 1 else None
    ff = __import__('imageio_ffmpeg').get_ffmpeg_exe(); K = {}
    for f in os.listdir(os.path.join(os.path.dirname(__file__), '.cache')): pass
    titles = {}
    try:
        for l in open(os.path.join(CACHE, 'indeks.jsonl')):
            if '"freesound_id": ' in l:
                r = json.loads(l); titles[r['freesound_id']] = (r['title'], r['username'])
    except FileNotFoundError: pass
    cred = json.load(open(os.path.join(OUT, 'zrodla.json')))
    for name, (vars_, dur, gain, srcs) in EV.items():
        if only and name not in only: continue
        for f in os.listdir(OUT):
            if f.endswith('.mp3') and f.rsplit('_', 1)[0] == name and f.rsplit('_', 1)[1][:-4].isdigit(): os.remove(os.path.join(OUT, f))
        for i, mk in enumerate(vars_):
            y = shape(mk().astype(np.float32), dur, gain)
            buf = io.BytesIO(); sf.write(buf, y, SR, format='WAV', subtype='PCM_16')
            subprocess.run([ff, '-y', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-ac', '1', '-ar', '44100', '-b:a', '96k', os.path.join(OUT, f'{name}_{i + 1}.mp3')], input=buf.getvalue(), check=True)
        cred[name] = [{ 'freesound': s, 'title': titles.get(s, ('?', '?'))[0], 'user': titles.get(s, ('?', '?'))[1], 'license': 'CC0-1.0' } for s in srcs]
        print(name, len(vars_))
    json.dump(cred, open(os.path.join(OUT, 'zrodla.json'), 'w'), ensure_ascii=False, indent=1)
