# Mały warsztat kompozytorski: utwór = ścieżki (instrument GM, kanał, panorama, pogłos) + nuty w taktach/ćwierćnutach.
# Akordy z prowadzeniem głosów, arpeggia harfy, linia basu, kontrapunkt do melodii, krzywe ekspresji (CC11) i „ludzkie” rozchwianie.
import random, itertools, mido

TPB = 480
NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
QUAL = {'': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10), 'm7': (0, 3, 7, 10), 'maj7': (0, 4, 7, 11), 'sus4': (0, 5, 7), 'sus2': (0, 2, 7),
        'dim': (0, 3, 6), 'aug': (0, 4, 8), 'add9': (0, 4, 7, 2), 'madd9': (0, 3, 7, 2), '5': (0, 7), 'm6': (0, 3, 7, 9), '6': (0, 4, 7, 9)}

def pc(s):
    v = NAMES[s[0]]
    for ch in s[1:]: v += 1 if ch == '#' else -1 if ch == 'b' else 0
    return v % 12

def midi(n):  # 'F#4' -> 66
    i = 1
    while i < len(n) and n[i] in '#b': i += 1
    return pc(n[:i]) + 12 * (int(n[i:]) + 1)

def chord(sym):  # 'F#m7/A' -> (pcs, bass_pc, root_pc)
    bass = None
    if '/' in sym: sym, b = sym.split('/'); bass = pc(b)
    i = 1
    while i < len(sym) and sym[i] in '#b': i += 1
    r = pc(sym[:i]); pcs = [(r + x) % 12 for x in QUAL[sym[i:]]]
    return pcs, (bass if bass is not None else r), r

def prog(s, bpb, start=0.0):  # 'Dm C:2 G:2' (bez długości = cały takt) -> [[akord, start, długość]]
    out, t = [], float(start)
    for tok in s.split():
        if tok == '|': continue
        c, d = (tok.split(':') + [None])[:2]; d = float(d) if d else float(bpb)
        out.append([c, t, d]); t += d
    return out

class Track:
    def __init__(self, name, prog_no, ch, vol=100, pan=64, rev=70, cho=0, bank=0):
        self.name, self.prog, self.ch, self.vol, self.pan, self.rev, self.cho, self.bank = name, prog_no, ch, vol, pan, rev, cho, bank
        self.notes, self.cc = [], []  # (start_beat, dur_beats, pitch, vel), (beat, cc, val)
    def note(self, t, d, p, v): self.notes.append((t, d, p, int(max(1, min(127, v)))))
    def expr(self, pts, step=0.25):  # pts: [(beat, wartość)], liniowo między punktami
        for (a, va), (b, vb) in zip(pts, pts[1:]):
            n = max(1, int((b - a) / step))
            for k in range(n): self.cc.append((a + (b - a) * k / n, 11, int(va + (vb - va) * k / n)))
        self.cc.append((pts[-1][0], 11, int(pts[-1][1])))

class Song:
    def __init__(self, name, bpm, beats_per_bar, bars, seed=1):
        self.name, self.bpm, self.bpb, self.bars = name, bpm, beats_per_bar, bars
        self.tracks = []; self.rng = random.Random(seed)
    @property
    def length(self): return self.bars * self.bpb  # w ćwierćnutach
    @property
    def seconds(self): return self.length * 60.0 / self.bpm
    def track(self, *a, **k): t = Track(*a, **k); self.tracks.append(t); return t
    def bar(self, b): return (b - 1) * self.bpb  # takt 1 = początek

    def save(self, path, humanize=True):
        mf = mido.MidiFile(ticks_per_beat=TPB); meta = mido.MidiTrack(); mf.tracks.append(meta)
        meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm), time=0))
        meta.append(mido.MetaMessage('time_signature', numerator=self.bpb, denominator=4, time=0))
        meta.append(mido.MetaMessage('end_of_track', time=int(self.length * TPB)))
        L = self.length
        for tr in self.tracks:
            ev = []
            if tr.bank: ev += [(0, 0, mido.Message('control_change', channel=tr.ch, control=0, value=tr.bank))]
            ev += [(0, 1, mido.Message('program_change', channel=tr.ch, program=tr.prog))]
            for c, v in ((7, tr.vol), (10, tr.pan), (91, tr.rev), (93, tr.cho), (11, 127)):
                ev.append((0, 2, mido.Message('control_change', channel=tr.ch, control=c, value=v)))
            for t, c, v in tr.cc:
                if t <= L: ev.append((int(t * TPB), 3, mido.Message('control_change', channel=tr.ch, control=c, value=max(0, min(127, v)))))
            for t, d, p, v in tr.notes:
                if t >= L: continue
                jt = self.rng.uniform(-0.012, 0.012) if humanize and tr.ch != 9 and t > 0 else 0
                jv = self.rng.randint(-5, 5) if humanize else 0
                s = max(0, int((t + jt) * TPB)); e = min(int(L * TPB) - 1, int((t + d) * TPB))
                if e <= s: continue
                ev.append((s, 5, mido.Message('note_on', channel=tr.ch, note=p, velocity=max(1, min(127, v + jv)))))
                ev.append((e, 4, mido.Message('note_off', channel=tr.ch, note=p, velocity=0)))
            ev.sort(key=lambda x: (x[0], x[1])); mt = mido.MidiTrack(); mt.append(mido.MetaMessage('track_name', name=tr.name.encode('ascii', 'ignore').decode(), time=0)); last = 0
            for tick, _, m in ev: m.time = tick - last; last = tick; mt.append(m)
            mf.tracks.append(mt)
        mf.save(path)

# ---------- materiał muzyczny ----------
def melody(tr, start, s, vel=90, legato=1.02, oct=0, accent=True):
    """'D4:1.5 A4:.5 r:1 | ...' -> nuty od start (ćwierćnuty). Zwraca listę (t, d, p)."""
    t, out = start, []
    for tok in s.split():
        if tok == '|': continue
        n, d = tok.split(':'); d = float(d)
        if n != 'r':
            p = midi(n) + 12 * oct; v = vel + (6 if accent and abs((t - start) % 1) < 1e-6 and d >= 1 else 0) - (8 if d <= 0.26 else 0)
            tr.note(t, d * legato, p, v); out.append((t, d, p))
        t += d
    return out

def copy_notes(src_notes, tr, shift=0, vel=None, oct=0, legato=1.0):
    for t, d, p in src_notes: tr.note(t, d * legato, p + 12 * oct + shift, vel if vel else 80)

def chord_at(pr, t):
    for c, s, d in pr:
        if s <= t < s + d: return c
    return pr[-1][0]

def voicing(sym, lo, hi, n, prev=None):
    pcs, bass, root = chord(sym)
    cand = [p for p in range(lo, hi + 1) if p % 12 in pcs]
    best, bs = None, 1e9
    need = set(pcs[:3]) if len(pcs) >= 3 else set(pcs)
    for comb in itertools.combinations(cand, n):
        if not need.issubset({p % 12 for p in comb}) and len(pcs) <= n: continue
        if any(b - a < 3 for a, b in zip(comb, comb[1:])): continue
        if prev: sc = sum(abs(a - b) for a, b in zip(comb, prev))
        else: sc = abs(sum(comb) / n - (lo + hi) / 2) * n
        sc += 0.5 * sum(1 for a, b in zip(comb, comb[1:]) if b - a > 9)  # bez dziur
        if sc < bs: best, bs = comb, sc
    return list(best or cand[:n])

def pad(tr, pr, lo, hi, n=4, vel=70, legato=1.0, prev=None, restrike=False):
    for c, s, d in pr:
        v = voicing(c, lo, hi, n, prev)
        for p in v:
            held = prev and p in prev and not restrike
            tr.note(s, d * legato, p, vel)
        prev = v
    return prev

def bass(tr, pr, lo=36, pattern=None, vel=88, oct_jump=False):
    """pattern: lista (offset, długość, 'R'|'5'|'8') w obrębie akordu; domyślnie jedna nuta na akord."""
    for c, s, d in pr:
        pcs, b, r = chord(c); p = lo + ((b - lo) % 12)
        fifth = lo + ((r + 7 - lo) % 12)
        if not pattern: tr.note(s, d, p, vel); continue
        for off, ln, w in pattern:
            if off >= d: break
            q = p if w == 'R' else (p + 12 if w == '8' else fifth)
            tr.note(s + off, min(ln, d - off), q, vel - (0 if off == 0 else 8))

def arp(tr, pr, lo, hi, step=0.5, shape=(0, 1, 2, 3, 4, 3, 2, 1), vel=64, ring=1.6):
    for c, s, d in pr:
        pcs, b, r = chord(c)
        tones = [p for p in range(lo, hi + 1) if p % 12 in pcs]
        k, t = 0, s
        while t < s + d - 1e-6:
            i = shape[k % len(shape)]; p = tones[min(i, len(tones) - 1)]
            tr.note(t, min(step * ring, s + d - t + 0.05), p, vel + (6 if k % len(shape) == 0 else 0)); t += step; k += 1  # bez wybrzmiewania na następny akord

def waltz(tr, pr, lo, hi, bpb=3, vel=60):  # bas na raz, akord na dwa i trzy (gitara/harfa)
    for c, s, d in pr:
        pcs, b, r = chord(c); bp = lo + ((b - lo) % 12)
        v = voicing(c, lo + 10, hi, 3)
        t = s
        while t < s + d - 1e-6:
            tr.note(t, 0.9, bp, vel + 6)
            for k in range(1, bpb):
                if t + k < s + d:
                    for p in v: tr.note(t + k, 0.8, p, vel - 4)
            t += bpb

def counter(tr, pr, mel, lo, hi, step=2, vel=70, start_p=None):
    """Długie nuty kontrapunktu: składnik akordu najbliższy poprzedniemu, bez unisonu i sekundy z melodią."""
    prev = start_p or (lo + hi) // 2
    for c, s, d in pr:
        t = s
        while t < s + d - 1e-6:
            ln = min(step, s + d - t); pcs, _, _ = chord(c)
            mel_here = [p for (mt, md, p) in mel if mt < t + ln and mt + md > t]
            cands = [p for p in range(lo, hi + 1) if p % 12 in pcs and all(abs(p - m) not in (0, 1, 2) for m in mel_here)]
            if cands:
                p = min(cands, key=lambda x: (abs(x - prev), x)); tr.note(t, ln * 1.02, p, vel); prev = p
            t += ln

def roll(tr, t, d, p, v0, v1, step=0.125):  # tremolo kotłów/werbla z narastaniem
    n = int(d / step)
    for k in range(n): tr.note(t + k * step, step, p, int(v0 + (v1 - v0) * k / max(1, n - 1)))
