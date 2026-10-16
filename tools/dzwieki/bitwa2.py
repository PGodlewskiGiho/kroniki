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
def peak(fid, pre=0.05, dur=1.0):
    # okno przy najgłośniejszym miejscu nagrania (długie nagrania burzy, ryków): cofamy się do początku narastania (> szczyt-24 dB, maks. 1.5 s)
    x = load(os.path.join(CACHE, f'{fid}.flac')); hop = 220; n = len(x) // hop
    e = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9); ip = j = int(np.argmax(e))
    while j > 0 and e[j - 1] > e[ip] - 24 and (ip - j) * hop < 1.5 * SR: j -= 1
    s = max(0, j * hop - int(pre * SR)); return x[s: s + int(dur * SR)]
def tight(fid, at, dur):
    # od podanej sekundy nagrania, przycięte do początku uderzenia (pierwsza próbka > 10% szczytu fragmentu)
    x = load(os.path.join(CACHE, f'{fid}.flac'))[int(at * SR):]; w = x[: int(0.2 * SR)]; i = int(np.argmax(np.abs(w) > np.abs(w).max() * 0.1))
    i = max(0, i - int(0.003 * SR)); return x[i: i + int(dur * SR)]
def strong(fid, n=3):
    # początki n najgłośniejszych uderzeń nagrania (s), z 20 ms zapasu
    x = load(os.path.join(CACHE, f'{fid}.flac')); on = sorted(onsets(x, 0.12), key=lambda i: -np.abs(x[i: i + int(0.1 * SR)]).max())[:n]
    return [max(0, i / SR - 0.02) for i in on]
S = lambda fid, k=0, dur=0.5: seg(fid, k=k, dur=dur, strongest=True)
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
 'explode':   ([lambda: peak(516914, dur=1.4)], 1.4, 0, [516914]), # wybrany przy odsłuchu (wersja B): trzask i krótkie dudnienie
 'lightning': ([lambda: hp(peak(242048, dur=0.35), 900)], 0.35, 0, [242048]), # trzask wyładowania wycięty z bliskiego uderzenia pioruna
 'thunder':   ([lambda: peak(242048, dur=1.6)], 1.6, 3, [242048]), # wybrany przy odsłuchu (wersja C): bliskie uderzenie, ostry trzask i krótki pogłos
 'crash':     ([lambda: peak(522099, pre=0.01, dur=1.3)], 1.3, 3, [522099]), # wybrany przy odsłuchu (wersja A): głaz rozbija beton
 'horn':      ([lambda: seg(539956, dur=1.8)], 1.8, 0, [539956]),
 'order':     ([lambda: seg(235453, dur=1.1), lambda: seg(164446, dur=1.0, strongest=True)], 1.1, 1, [235453, 164446]),
 'power':     ([lambda: seg(172631, dur=1.0)], 1.0, 0, [172631]),
 'luck':      ([lambda: hp(seg(521886, dur=1.2), 300)], 1.2, -4, [521886]),
 'waver':     ([lambda: seg(449438, dur=1.0)], 1.0, -2, [449438]),
 # --- trzeci odsłuch: wszystko oznaczone „do poprawy” wymienione ---
 'cast':      ([lambda: peak(500908, dur=1.0), lambda: peak(159725, dur=1.0)], 1.0, 0, [500908, 159725]), # świst zaklęcia zamiast „kosmicznych” syntezatorów
 'earth':     ([lambda: mix((peak(590096, pre=0.01, dur=1.1), 0, 0), (hp(peak(438685, dur=1.4), 200), -4, 0.05)), lambda: peak(524307, dur=1.4)], 1.4, 2, [590096, 438685, 524307]), # pękająca skała i osuwisko (słychać też w głośniku telefonu)
 'gunshot':   ([lambda: peak(234869, pre=0.01, dur=1.0), lambda: peak(396316, pre=0, dur=0.8)], 1.0, 0, [234869, 396316]), # muszkiet
 'haste':     ([lambda: peak(558736, dur=1.0), lambda: peak(445963, dur=0.7)], 1.0, 0, [558736, 445963]), # dłuższy, narastający świst
 'heal':      ([lambda: mix((peak(436128, dur=1.4), 0, 0), (hp(peak(521883, dur=1.2), 2000), -8, 0.15)), lambda: peak(61521, dur=1.4)], 1.4, 0, [436128, 521883, 61521]), # harfa z migotaniem, anielski dźwięk
 'hit':       ([lambda: S(586841, 0, 0.45), lambda: S(586841, 2, 0.45), lambda: peak(587270, dur=0.5)], 0.5, 0, [586841, 587270]), # mocne uderzenie w ciało zamiast klapsa
 'paws':      ([lambda at=at: hp(tight(436505, at, 0.25), 60) for at in strong(436505)], 0.25, 0, [436505]), # wybrane przy odsłuchu (wersja C): mały stwór drepcze po dywanie
 'skitter':   ([lambda at=at: hp(tight(528191, at, 0.25), 60) for at in strong(528191)], 0.25, 0, [528191]), # wybrane przy odsłuchu (wersja D): drobne kroczki – pająki
 'pierce':    ([lambda: mix((S(395373, 0, 0.5), 0, 0), (lp(peak(522091, pre=0, dur=0.5), 400), -3, 0)), lambda: mix((S(399617, 0, 0.5), 0, 0), (lp(S(586841, 3, 0.5), 300), -3, 0.01)), lambda: mix((S(399614, 0, 0.5), 0, 0), (lp(peak(522091, pre=0, dur=0.5), 400), -4, 0))], 0.5, 1, [395373, 399617, 399614, 522091, 586841]), # pchnięcie ostrza z ciężarem ciosu
 'scream':    ([lambda: peak(492764, dur=1.2), lambda: peak(243380, dur=1.2), lambda: peak(178313, dur=1.2)], 1.2, 1, [492764, 243380, 178313]),
 'slowdn':    ([lambda: peak(577960, dur=0.9), lambda: peak(366092, dur=1.2)], 1.2, 3, [577960, 366092]), # opadający dźwięk, głośniej
 'v_beast':   ([lambda: peak(479825, dur=1.1), lambda: peak(418394, dur=1.1), lambda: peak(519594, dur=1.2)], 1.2, 0, [479825, 418394, 519594]), # niedźwiedź, ryk bestii, ryk bizona (bez „bekania”)
 'v_demon':   ([lambda: peak(580772, dur=0.9), lambda: peak(580774, dur=1.0), lambda: peak(580766, dur=0.9), lambda: peak(580770, dur=1.0)], 1.0, 1, [580772, 580774, 580766, 580770]), # wybrany głos D + trzy podobne od tego samego autora
 'zap':       ([lambda: peak(249817, dur=0.8), lambda: peak(105016, dur=0.8)], 0.8, 0, [249817, 105016]), # świst pocisku magii zamiast lasera
 'zaphit':    ([lambda: peak(500911, dur=0.9), lambda: peak(500905, dur=0.9)], 0.9, 0, [500911, 500905]), # uderzenie zaklęcia zamiast „łuku”
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
