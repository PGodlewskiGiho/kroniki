# Utwory gry: orkiestra GM (bank GeneralUser GS). Każdy utwór kończy się tak, by płynnie wrócić do początku (pętla).
from nuty import *

# Instrumenty GM (0-indeks)
STR, SLOWSTR, TREM, PIZZ, VLN, VLA, VC, CB, HARP, TIMP = 48, 49, 44, 45, 40, 41, 42, 43, 46, 47
HORN, TPT, TBN, BRASS, OBOE, EH, BSN, CLAR, FLUTE, RECORDER, CHOIR, ORGAN, BELLS, LUTE = 60, 56, 57, 61, 68, 69, 70, 71, 73, 74, 52, 19, 14, 24

def kroniki():  # menu: główny temat, D-dur, majestatycznie
    S = Song('menu', 76, 4, 24, seed=3); P = lambda s, b: prog(s, 4, S.bar(b))
    intro, A = P('D Bm G A', 1), P('D Bm G A G D/F# Em7:2 A7:2 D', 5)
    B, C = P('Bm F#m G D/A Em Bm G:2 A:2 Asus4:2 A:2', 13), P('D G Em7:2 A7:2 D', 21)
    allp = intro + A + B + C
    pad_t = S.track('smyczki', STR, 0, vol=92, pan=64, rev=90)
    vln = S.track('skrzypce', STR, 1, vol=100, pan=46, rev=85)
    horn = S.track('rogi', HORN, 2, vol=104, pan=56, rev=95)
    fl = S.track('flet', FLUTE, 3, vol=78, pan=72, rev=95)
    harp = S.track('harfa', HARP, 4, vol=70, pan=92, rev=90)
    vc = S.track('wiolonczele', VC, 5, vol=92, pan=84, rev=80)
    cb = S.track('kontrabasy', CB, 6, vol=72, pan=78, rev=80)
    timp = S.track('kotły', TIMP, 7, vol=100, pan=64, rev=90)
    br = S.track('blacha', BRASS, 8, vol=82, pan=60, rev=95)
    ob = S.track('obój', OBOE, 10, vol=88, pan=70, rev=95)

    v = pad(pad_t, intro + A, 50, 69, 4, vel=64); pad(pad_t, B + C, 55, 72, 4, vel=74, prev=v)
    pad_t.expr([(0, 40), (16, 80), (48, 84), (64, 104), (80, 118), (92, 110), (96, 64)])
    melody(ob, 0, 'A4:2 D5:2 | B4:2 F#4:2 | G4:2 B4:2 | A4:3 r:1', vel=76, legato=1.0)
    mA = melody(horn, S.bar(5), 'D4:1.5 A4:.5 D5:1.5 E5:.5 | F#5:2 E5:1 D5:1 | B4:1.5 D5:.5 G5:1.5 F#5:.5 | E5:2.5 C#5:.5 A4:1 | '
                'D5:1.5 B4:.5 G4:1 B4:1 | A4:2 F#4:1 A4:1 | G4:1 B4:1 E5:1 C#5:1 | D5:4', vel=88)
    horn.expr([(16, 90), (40, 110), (48, 92)])
    mB = melody(vln, S.bar(13), 'F#5:1.5 E5:.5 D5:1 B4:1 | C#5:1.5 B4:.5 A4:1 C#5:1 | D5:1.5 E5:.5 F#5:1 G5:1 | A5:2 F#5:1 D5:1 | '
                'G5:1.5 F#5:.5 E5:1 B4:1 | D5:1.5 C#5:.5 B4:1 F#5:1 | E5:2 D5:1 C#5:1 | D5:2 C#5:2', vel=92)
    vln.expr([(48, 84), (60, 108), (64, 100), (76, 118), (80, 110)])
    counter(fl, B, mB, 74, 86, step=2, vel=70)
    fl.expr([(48, 60), (72, 96), (80, 80)])
    mC = melody(horn, S.bar(21), 'D4:1.5 A4:.5 D5:2 | B4:1.5 D5:.5 G5:2 | E5:2 C#5:2 | D5:4', vel=100)
    copy_notes(mC, vln, oct=0, vel=96)
    horn.expr([(80, 118), (92, 108), (96, 70)]); vln.expr([(92, 110), (96, 70)])
    pad(br, C, 55, 70, 4, vel=78); br.expr([(80, 70), (84, 105), (92, 100), (96, 50)])
    arp(harp, intro + A, 50, 79, step=0.5, shape=(0, 1, 2, 3, 4, 5, 4, 3), vel=60)
    arp(harp, B, 55, 84, step=0.5, shape=(0, 2, 4, 5, 6, 5, 4, 2), vel=58)
    arp(harp, C, 50, 86, step=0.25, shape=(0, 1, 2, 3, 4, 5, 6, 7), vel=56)
    bass(vc, intro, lo=38, vel=70)
    bass(vc, A + B, lo=38, pattern=[(0, 2, 'R'), (2, 2, '5')], vel=82)
    bass(vc, C, lo=38, pattern=[(0, 1.5, 'R'), (1.5, .5, 'R'), (2, 2, '5')], vel=92)
    bass(cb, B + C, lo=26, vel=86); cb.expr([(48, 80), (96, 70)])
    vc.expr([(0, 70), (16, 92), (80, 112), (92, 100), (96, 70)])
    roll(timp, S.bar(20), 4, 45, 40, 108)
    for b, p in ((21, 38), (22, 43), (23, 45), (24, 38)): timp.note(S.bar(b), 1, p, 110 if b == 21 else 92)
    roll(timp, S.bar(24) + 1, 3, 38, 70, 30)
    return S

def wedrowka():  # mapa przygody: pastoralnie, G-dur, na trzy
    S = Song('mapa', 100, 3, 44, seed=5); P = lambda s, b: prog(s, 3, S.bar(b))
    cA, cAns = 'G Em C D G Em Am:2 D:1 G', 'C G/B Am D Em C Am:2 D7:1 G'
    A1, A2, B = P(cA, 1), P(cAns, 9), P('Em Bm C B7 Em Am B7 Em:2 D:1', 17)
    A3, A4, L = P(cA, 25), P(cAns, 33), P('G C D D7', 41)
    allp = A1 + A2 + B + A3 + A4 + L
    mA1 = 'D5:2 B4:1 | E5:1.5 D5:.5 B4:1 | C5:2 E5:1 | D5:3 | D5:2 G5:1 | G5:1.5 F#5:.5 E5:1 | C5:1 E5:1 F#5:1 | G5:3'
    mA2 = 'E5:2 G5:1 | D5:2 B4:1 | C5:1.5 D5:.5 E5:1 | F#5:2 A5:1 | G5:2 E5:1 | E5:1.5 D5:.5 C5:1 | C5:1 A4:1 F#4:1 | G4:3'
    ob = S.track('obój', OBOE, 0, vol=92, pan=70, rev=95)
    fl = S.track('flet', FLUTE, 1, vol=86, pan=58, rev=95)
    cl = S.track('klarnet', CLAR, 2, vol=92, pan=76, rev=95)
    vln = S.track('skrzypce', STR, 3, vol=88, pan=46, rev=90)
    pad_t = S.track('smyczki', SLOWSTR, 4, vol=62, pan=64, rev=100)
    harp = S.track('harfa', HARP, 5, vol=78, pan=90, rev=90)
    pz = S.track('pizzicato', PIZZ, 6, vol=86, pan=80, rev=80)
    horn = S.track('róg', HORN, 7, vol=80, pan=56, rev=100)
    melody(ob, S.bar(1), mA1, vel=84)
    melody(fl, S.bar(9), mA2, vel=82)
    mb = melody(cl, S.bar(17), 'B4:1.5 G4:.5 E4:1 | F#4:2 B4:1 | C5:1.5 B4:.5 G4:1 | A4:1.5 F#4:.5 D#4:1 | E4:1.5 G4:.5 B4:1 | C5:2 E5:1 | '
                'D#5:1.5 B4:.5 A4:1 | G4:2 F#4:1', vel=84)
    m3 = melody(vln, S.bar(25), mA1, vel=86)
    counter(fl, A3, m3, 76, 86, step=3, vel=66)
    m4 = melody(ob, S.bar(33), mA2, vel=84); copy_notes(m4, cl, oct=-1, vel=74)
    melody(horn, S.bar(41), 'B3:3 | C4:2 E4:1 | D4:3 | C4:2 A3:1', vel=72)
    v = pad(pad_t, allp, 55, 71, 3, vel=52)
    pad_t.expr([(0, 70), (48, 80), (72, 90), (96, 96), (120, 80), (132, 64)])
    waltz(harp, A1 + A2 + A3 + A4 + L, 43, 72, bpb=3, vel=58)
    arp(harp, B, 40, 76, step=0.5, shape=(0, 2, 4, 5, 4, 2), vel=56)
    bass(pz, allp, lo=36, pattern=[(0, 1, 'R'), (2, 1, '5')], vel=78)
    vln.expr([(72, 90), (84, 104), (96, 90)])
    return S

def starcie():  # bitwa: d-moll, motoryczne ostinato, rogi i trąbki, kotły
    S = Song('bitwa', 132, 4, 36, seed=7); P = lambda s, b: prog(s, 4, S.bar(b))
    cA = 'Dm C Bb A Dm F Gm:2 A:2 Dm'
    I, A, B, BR, A2, L = P('Dm Dm Bb A', 1), P(cA, 5), P('Bb F C A Bb F/A Gm A7', 13), P('Dm Dm Bb A', 21), P(cA, 25), P('Dm Bb Gm A', 33)
    allp = I + A + B + BR + A2 + L
    mA = 'D4:1.5 D4:.5 A4:2 | G4:1.5 F4:.5 E4:2 | F4:1.5 G4:.5 F4:1 D4:1 | E4:1.5 C#4:.5 A3:2 | D4:1.5 E4:.5 F4:1 A4:1 | C5:2 A4:1 F4:1 | G4:1 Bb4:1 A4:2 | D4:4'
    trem = S.track('smyczki tremolo', TREM, 0, vol=80, pan=64, rev=70)
    vln = S.track('skrzypce', STR, 1, vol=112, pan=44, rev=70)
    horn = S.track('rogi', HORN, 2, vol=108, pan=56, rev=80)
    tbn = S.track('puzony', TBN, 3, vol=92, pan=70, rev=75)
    vla = S.track('altówki', VLA, 4, vol=86, pan=58, rev=60)
    vc = S.track('wiolonczele', VC, 5, vol=96, pan=84, rev=60)
    tpt = S.track('trąbki', TPT, 6, vol=92, pan=52, rev=80)
    br = S.track('blacha', BRASS, 7, vol=90, pan=62, rev=80)
    timp = S.track('kotły', TIMP, 8, vol=110, pan=64, rev=75)
    dr = S.track('perkusja', 48, 9, vol=92, pan=64, rev=60)
    cb = S.track('kontrabasy', CB, 10, vol=74, pan=76, rev=60)
    ost = [(i * 0.5, 0.42, w) for i, w in enumerate('RR5R85R5')]
    bass(vc, allp, lo=38, pattern=ost, vel=88)
    bass(vla, A + B + A2 + L, lo=50, pattern=[(i * 0.5, 0.4, w) for i, w in enumerate('5R5R5R5R')], vel=72)
    bass(cb, allp, lo=26, pattern=[(0, 2, 'R'), (2, 2, 'R')], vel=92)
    vc.expr([(0, 90), (16, 104), (80, 96), (96, 118), (144, 124)])
    pad(trem, A + B + A2 + L, 69, 84, 4, vel=62); trem.expr([(16, 70), (48, 96), (80, 70), (96, 100), (144, 110)])
    melody(horn, S.bar(5), mA, vel=100, legato=0.95)
    melody(horn, S.bar(25), mA, vel=110, legato=0.95); m2 = melody(tbn, S.bar(25), mA, vel=100, oct=-1, legato=0.95)
    melody(vln, S.bar(25), mA, vel=96, oct=1, legato=0.95)
    mB = melody(tpt, S.bar(13), 'F5:1.5 D5:.5 Bb4:2 | C5:1.5 A4:.5 F5:2 | E5:1.5 G5:.5 E5:1 C5:1 | C#5:2 E5:2 | D5:1 F5:1 Bb5:2 | A5:1.5 G5:.5 F5:1 C5:1 | '
                'Bb4:1 D5:1 G5:2 | A5:2 G5:1 E5:1', vel=96, legato=0.95)
    copy_notes(mB, vln, oct=0, vel=92, legato=0.95)
    pad(horn, B, 50, 65, 3, vel=74)
    tpt.expr([(48, 92), (72, 118), (80, 110)]); vln.expr([(48, 90), (80, 110)])
    for c, s, d in BR:  # przerwa: uderzenia tutti na 1, 2½ i 4
        v = voicing(c, 50, 74, 5)
        for off in (0, 1.5, 3):
            for p in v: br.note(s + off, 0.4, p, 112); vln.note(s + off, 0.3, p + 12, 100)
            timp.note(s + off, 0.5, 38 if c[0] == 'D' else 46 if c[0] == 'B' else 45, 118)
    for c, s, d in L:
        for p in voicing(c, 50, 72, 4): br.note(s, d, p, 92)
    br.expr([(128, 60), (144, 120)])
    root_t = {'D': 38, 'B': 46, 'F': 41, 'C': 48, 'G': 43, 'A': 45}
    for c, s, d in I + A + B + A2:
        t = s
        while t < s + d - 1e-6:
            for off, vv in ((0, 108), (1.5, 84), (2, 96), (3, 86)):
                if t + off < s + d: timp.note(t + off, 0.4, root_t[c[0]], vv)
            t += 4
    roll(timp, S.bar(36), 4, 45, 50, 120)
    def drum_bar(b, kind):
        t = S.bar(b)
        if kind >= 1: dr.note(t, .5, 36, 100); dr.note(t + 2, .5, 36, 90)
        if kind >= 2:
            for k, v in enumerate((70, 0, 50, 56, 66, 0, 50, 60)):
                if v: dr.note(t + k * 0.5, .25, 38, v)
    for b in range(1, 5): drum_bar(b, 1)
    for b in range(5, 21): drum_bar(b, 2)
    for b in range(25, 33): drum_bar(b, 2)
    for b in (5, 13, 25): dr.note(S.bar(b), 2, 49, 100)
    roll(dr, S.bar(20), 4, 38, 40, 104); roll(dr, S.bar(36), 4, 38, 40, 110)
    return S

def grod():  # miasto (jasne frakcje): minstrel, G-miksolidyjski, lutnia, flet prosty, skrzypce
    S = Song('miasto', 104, 4, 28, seed=11); P = lambda s, b: prog(s, 4, S.bar(b))
    cA = 'G F G D G F C:2 D:2 G'
    A1, B, A2, O = P(cA, 1), P('Em C G D Em C Am D', 9), P(cA, 17), P('G C D G', 25)
    allp = A1 + B + A2 + O
    mA = ('D5:.5 G5:.5 G5:.5 A5:.5 B5:1 G5:1 | A5:.5 G5:.5 F5:.5 G5:.5 A5:1 F5:1 | G5:.5 A5:.5 B5:.5 D6:.5 B5:1 G5:1 | A5:1.5 G5:.5 F#5:2 | '
          'D5:.5 G5:.5 G5:.5 A5:.5 B5:1 G5:1 | C6:.5 A5:.5 F5:.5 A5:.5 C6:1 A5:1 | G5:.5 E5:.5 C5:.5 E5:.5 F#5:.5 A5:.5 D6:.5 C6:.5 | B5:2 G5:2')
    rec = S.track('flet prosty', RECORDER, 0, vol=86, pan=60, rev=80)
    fid = S.track('skrzypce', VLN, 1, vol=92, pan=44, rev=80)
    lute = S.track('lutnia', LUTE, 2, vol=100, pan=78, rev=70)
    pz = S.track('bas', PIZZ, 3, vol=90, pan=70, rev=60)
    pad_t = S.track('smyczki', STR, 4, vol=66, pan=64, rev=90)
    dr = S.track('bębenek', 0, 9, vol=80, pan=64, rev=60)
    bsn = S.track('fagot', BSN, 5, vol=80, pan=72, rev=80)
    melody(rec, S.bar(1), mA, vel=84, legato=0.9)
    mb = melody(fid, S.bar(9), 'E5:1 G5:1 B5:1.5 A5:.5 | G5:1 E5:1 C5:2 | D5:1 G5:1 B5:1 A5:1 | F#5:2 D5:2 | E5:.5 F#5:.5 G5:.5 A5:.5 B5:1 E5:1 | '
                'G5:.5 F#5:.5 E5:.5 D5:.5 C5:1 E5:1 | A5:1 G5:.5 F#5:.5 E5:1 C5:1 | D5:2 F#5:1 A5:1', vel=88)
    counter(rec, B, mb, 67, 79, step=2, vel=58)
    m2 = melody(rec, S.bar(17), mA, vel=88, legato=0.9); copy_notes(m2, fid, oct=-1, vel=82, legato=0.92)
    melody(rec, S.bar(25), 'B5:4 | C6:2 G5:2 | A5:4 | G5:4', vel=70)
    melody(bsn, S.bar(9), 'E3:2 B2:2 | C3:2 G2:2 | G2:2 D3:2 | D3:2 A2:2 | E3:2 B2:2 | C3:2 E3:2 | A2:2 C3:2 | D3:2 F#3:2', vel=76, legato=0.8)
    arp(lute, allp, 43, 67, step=0.5, shape=(0, 3, 2, 4, 1, 3, 2, 4), vel=70, ring=2.2)
    bass(pz, allp, lo=36, pattern=[(0, 1, 'R'), (2, 1, '5')], vel=84)
    pad(pad_t, A2 + O, 50, 62, 3, vel=56); pad_t.expr([(64, 50), (72, 90), (112, 70)])
    for b in range(1, 29):
        t = S.bar(b)
        dr.note(t, .5, 45, 72); dr.note(t + 1.5, .5, 45, 56); dr.note(t + 2, .5, 45, 66)
        if b > 8: dr.note(t + 1, .3, 54, 46); dr.note(t + 3, .3, 54, 50)
    return S

def cien():  # miasto (mroczne frakcje): e-moll, chór, niskie smyczki, dzwony
    S = Song('miasto_mrok', 64, 4, 20, seed=13); P = lambda s, b: prog(s, 4, S.bar(b))
    cA = 'Em C Am B Em F D B7'
    A1, A2, O = P(cA, 1), P(cA, 9), P('Em C Am B', 17)
    allp = A1 + A2 + O
    mA = 'E4:2 G4:1 F#4:1 | G4:3 E4:1 | A4:2 C5:1 B4:1 | B4:4 | E5:2 D5:1 B4:1 | C5:3 A4:1 | A4:2 F#4:2 | D#4:4'
    ch = S.track('chór', CHOIR, 0, vol=96, pan=64, rev=110)
    lo = S.track('smyczki', SLOWSTR, 1, vol=88, pan=70, rev=100)
    vc = S.track('wiolonczela', VC, 2, vol=96, pan=80, rev=95)
    eh = S.track('rożek angielski', EH, 3, vol=84, pan=56, rev=100)
    bells = S.track('dzwony', BELLS, 4, vol=74, pan=40, rev=110)
    harp = S.track('harfa', HARP, 5, vol=80, pan=90, rev=100)
    cb = S.track('kontrabas', CB, 6, vol=70, pan=72, rev=90)
    timp = S.track('kotły', TIMP, 7, vol=88, pan=64, rev=100)
    tbn = S.track('puzony', TBN, 8, vol=76, pan=60, rev=100)
    melody(ch, S.bar(1), mA, vel=82, legato=1.05)
    m2 = melody(eh, S.bar(9), mA, vel=88, legato=1.05)
    counter(vc, A2, m2, 43, 55, step=2, vel=74)
    pad(ch, A2 + O, 52, 63, 3, vel=56)
    pad(lo, allp, 38, 57, 4, vel=68)
    lo.expr([(0, 60), (28, 96), (32, 80), (60, 104), (64, 90), (80, 60)])
    pad(tbn, A2, 40, 55, 3, vel=60); tbn.expr([(32, 50), (56, 90), (64, 50)])
    bass(cb, allp, lo=28, vel=84)
    arp(harp, O, 40, 64, step=0.5, shape=(0, 1, 2, 3, 2, 1), vel=56)
    for c, s, d in allp[::2]: bells.note(s, 4, 60 + chord(c)[2] if chord(c)[2] < 8 else 48 + chord(c)[2], 70)  # dzwon na prymie akordu
    roll(timp, S.bar(8), 4, 47, 30, 80); roll(timp, S.bar(16), 4, 47, 30, 90)
    timp.note(S.bar(9), 2, 40, 96)
    return S

SONGS = [kroniki, starcie, grod, cien] # wedrowka (mapa) poza grą: mapa jest bez muzyki
