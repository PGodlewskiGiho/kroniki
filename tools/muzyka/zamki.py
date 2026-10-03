# Muzyka miast: osobny utwór dla każdej frakcji, w jej klimacie. Pętle bez szwu (ostatni akord prowadzi do pierwszego).
from nuty import *
from utwory import STR, SLOWSTR, TREM, PIZZ, VLN, VLA, VC, CB, HARP, TIMP, HORN, TPT, TBN, BRASS, OBOE, EH, BSN, CLAR, FLUTE, RECORDER, CHOIR, ORGAN, BELLS, LUTE

CELESTA, GLOCK, MBOX, MARIMBA, KALIMBA, PANFL, SHAKU, FIDDLE, TAIKO, OOHS = 8, 9, 10, 12, 108, 75, 77, 110, 116, 53


def hits(dr, b0, b1, bar_len, pattern):  # perkusja: pattern = [(offset, nuta GM, głośność)] w każdym takcie b0..b1
    for b in range(b0, b1 + 1):
        t = (b - 1) * bar_len
        for off, p, v in pattern: dr.note(t + off, 0.4, p, v)


def przystan():  # Przystań: rycerski hymn, B-dur, trąbki i rogi, chór, kotły, werbel
    S = Song('miasto_przystan', 92, 4, 24, seed=21); P = lambda s, b: prog(s, 4, S.bar(b))
    I, A, B, C = P('Bb F/A Gm Eb:2 F:2', 1), P('Bb Eb Bb F Gm Eb Cm:2 F:2 Bb', 5), P('Gm Dm Eb Bb Cm Gm Eb:2 F:2 F', 13), P('Eb F Bb:2 Eb:2 Bb', 21)
    allp = I + A + B + C
    tpt = S.track('trąbki', TPT, 0, vol=96, pan=52, rev=85)
    horn = S.track('rogi', HORN, 1, vol=104, pan=58, rev=95)
    pad_t = S.track('smyczki', STR, 2, vol=84, pan=64, rev=90)
    vln = S.track('skrzypce', STR, 3, vol=100, pan=44, rev=85)
    ch = S.track('chór', CHOIR, 4, vol=82, pan=64, rev=110)
    harp = S.track('harfa', HARP, 5, vol=72, pan=92, rev=90)
    vc = S.track('wiolonczele', VC, 6, vol=90, pan=82, rev=80)
    cb = S.track('kontrabasy', CB, 7, vol=74, pan=76, rev=80)
    timp = S.track('kotły', TIMP, 8, vol=100, pan=64, rev=90)
    dr = S.track('werbel', 48, 9, vol=70, pan=64, rev=70)
    br = S.track('blacha', BRASS, 10, vol=80, pan=60, rev=95)
    melody(tpt, S.bar(1), 'Bb4:1 F4:.5 Bb4:.5 D5:2 | C5:1 A4:.5 C5:.5 F5:2 | D5:1.5 Bb4:.5 G4:2 | G4:1 Bb4:1 A4:1 F4:1', vel=96)
    melody(horn, S.bar(5), 'F4:1.5 Bb4:.5 D5:1 F5:1 | Eb5:1.5 D5:.5 C5:1 Bb4:1 | D5:1 F5:1 Bb5:1.5 A5:.5 | A5:2 F5:2 | '
           'G5:1.5 F5:.5 D5:1 Bb4:1 | C5:1 Eb5:1 G5:1.5 F5:.5 | Eb5:1 C5:1 A4:1 C5:1 | Bb4:4', vel=90, oct=-1)
    mB = melody(vln, S.bar(13), 'D5:1.5 G5:.5 Bb5:1 A5:1 | F5:1.5 E5:.5 D5:1 A4:1 | G5:1.5 F5:.5 Eb5:1 G5:1 | F5:3 D5:1 | '
                'Eb5:1.5 D5:.5 C5:1 G5:1 | Bb5:2 G5:1 D5:1 | Eb5:1 G5:1 F5:1 A5:1 | C6:2 A5:1 F5:1', vel=92)
    counter(horn, B, mB, 58, 70, step=2, vel=72)
    mC = melody(tpt, S.bar(21), 'G5:1.5 F5:.5 Eb5:2 | F5:1.5 Eb5:.5 C5:2 | D5:1 F5:1 Eb5:1 G5:1 | F5:2 D5:2', vel=100)
    copy_notes(mC, horn, oct=-1, vel=94); copy_notes(mC, vln, vel=90)
    v = pad(pad_t, I + A, 50, 70, 4, vel=62); pad(pad_t, B + C, 53, 74, 4, vel=72, prev=v)
    pad(ch, B + C, 55, 69, 3, vel=58); ch.expr([(48, 60), (76, 100), (96, 70)])
    pad(br, C, 50, 66, 4, vel=74); br.expr([(80, 70), (90, 108), (96, 60)])
    arp(harp, A + B, 46, 77, step=0.5, shape=(0, 2, 4, 5, 4, 2, 1, 3), vel=58)
    bass(vc, allp, lo=34, pattern=[(0, 2, 'R'), (2, 2, '5')], vel=82)
    bass(cb, A + B + C, lo=22, vel=84)
    root_t = {'B': 46, 'F': 41, 'G': 43, 'E': 39, 'C': 48, 'D': 38}
    for c, s, d in I + C: timp.note(s, 1, root_t[c[0]], 104); timp.note(s + d - 1, .5, root_t[c[0]], 84)
    roll(timp, S.bar(20), 4, 41, 40, 104)
    for b in range(5, 21):  # werbel marszowy, cicho
        t = S.bar(b); dr.note(t, .2, 38, 54); dr.note(t + 1.75, .2, 38, 40); dr.note(t + 2, .2, 38, 58); dr.note(t + 3.5, .2, 38, 44)
    return S


def knieja():  # Knieja: leśny walc, F-lidyjski, flet Pana, harfa, czelesta, smyczki
    S = Song('miasto_knieja', 96, 3, 32, seed=23); P = lambda s, b: prog(s, 3, S.bar(b))
    A, A2, B, A3 = P('Fmaj7 G Fmaj7 G Am Em F G', 1), P('Fmaj7 G Am Em Dm Am G F', 9), P('Dm Am C G Dm Am Em G', 17), P('Fmaj7 G Fmaj7 G Am Em G F', 25)
    allp = A + A2 + B + A3
    mA = 'C5:1 A4:1 E5:1 | D5:2 B4:1 | A4:1 C5:1 F5:1 | G5:2 D5:1 | E5:1.5 D5:.5 C5:1 | B4:2 G4:1 | A4:1 C5:1 F5:1 | B4:3'
    pf = S.track('flet Pana', PANFL, 0, vol=92, pan=60, rev=100)
    fl = S.track('flet', FLUTE, 1, vol=84, pan=70, rev=100)
    ob = S.track('obój', OBOE, 2, vol=82, pan=52, rev=95)
    harp = S.track('harfa', HARP, 3, vol=84, pan=88, rev=95)
    pad_t = S.track('smyczki', SLOWSTR, 4, vol=66, pan=64, rev=105)
    cel = S.track('czelesta', CELESTA, 5, vol=70, pan=36, rev=110)
    pz = S.track('pizzicato', PIZZ, 6, vol=80, pan=78, rev=85)
    m1 = melody(pf, S.bar(1), mA, vel=84, legato=0.98)
    melody(fl, S.bar(9), 'E5:1 F5:1 G5:1 | B5:2 A5:1 | C6:1.5 B5:.5 A5:1 | G5:2 E5:1 | F5:1 A5:1 D5:1 | E5:2 C5:1 | D5:1 B4:1 G4:1 | A4:3', vel=82)
    mb = melody(ob, S.bar(17), 'D5:2 F5:1 | E5:2 C5:1 | E5:1 G5:1 C6:1 | B5:2 D5:1 | F5:1.5 E5:.5 D5:1 | C5:1 E5:1 A5:1 | G5:1 E5:1 B4:1 | D5:3', vel=84)
    counter(fl, B, mb, 62, 74, step=3, vel=60)
    m3 = melody(pf, S.bar(25), mA.replace('B4:3', 'A4:3'), vel=86, legato=0.98); copy_notes(m3, cel, oct=1, vel=50)
    arp(harp, allp, 41, 79, step=0.5, shape=(0, 2, 4, 6, 4, 2), vel=60, ring=2.0)
    pad(pad_t, allp, 53, 69, 3, vel=50); pad_t.expr([(0, 64), (48, 80), (72, 92), (96, 70)])
    for c, s, d in A2 + A3: cel.note(s + 1, .5, 72 + chord(c)[2] if chord(c)[2] < 7 else 60 + chord(c)[2], 46)  # dzwoneczki
    bass(pz, allp, lo=36, pattern=[(0, 1, 'R'), (2, 1, '5')], vel=74)
    return S


def kurhan():  # Kurhan: żałobny chorał, d-moll, motyw Dies irae, chór, organy, dzwony
    S = Song('miasto_kurhan', 60, 4, 16, seed=25); P = lambda s, b: prog(s, 4, S.bar(b))
    A1, A2 = P('Dm Bb Gm A Dm C Bb A', 1), P('Dm Gm Dm A Bb Gm A:2 A7:2 Dm', 9)
    allp = A1 + A2
    ch = S.track('chór', CHOIR, 0, vol=98, pan=64, rev=115)
    org = S.track('organy', ORGAN, 1, vol=78, pan=58, rev=110)
    lo = S.track('smyczki', SLOWSTR, 2, vol=86, pan=70, rev=100)
    bells = S.track('dzwony', BELLS, 3, vol=76, pan=40, rev=115)
    timp = S.track('kotły', TIMP, 4, vol=90, pan=64, rev=100)
    harp = S.track('harfa', HARP, 5, vol=70, pan=88, rev=105)
    cb = S.track('kontrabasy', CB, 6, vol=80, pan=74, rev=95)
    vc = S.track('wiolonczela', VC, 7, vol=86, pan=80, rev=100)
    melody(ch, S.bar(1), 'F4:1 E4:1 F4:1 D4:1 | E4:1 C4:1 D4:2 | F4:1 G4:1 F4:1 D4:1 | E4:1 C#4:1 E4:2 | D4:2 A4:2 | G4:2 E4:2 | F4:1.5 E4:.5 D4:2 | C#4:4', vel=86, legato=1.04)
    m2 = melody(org, S.bar(9), 'A4:2 F4:1 D4:1 | Bb4:2 G4:2 | A4:1.5 G4:.5 F4:1 E4:1 | E4:4 | D5:2 Bb4:2 | G4:2 Bb4:1 D5:1 | C#5:2 E4:2 | D4:4', vel=80, legato=1.02)
    copy_notes(m2, ch, oct=0, vel=70, legato=1.04)
    counter(vc, A2, m2, 45, 57, step=2, vel=70)
    pad(lo, allp, 38, 57, 4, vel=66); lo.expr([(0, 56), (28, 92), (32, 76), (56, 104), (64, 70)])
    pad(org, A1, 50, 62, 3, vel=50)
    bass(cb, allp, lo=26, vel=86)
    arp(harp, A2, 38, 62, step=1, shape=(0, 1, 2, 3, 2, 1), vel=52)
    for b in range(1, 17, 2): bells.note(S.bar(b), 4, 50, 74); bells.note(S.bar(b) + 2, 2, 57, 52)  # podzwonne
    roll(timp, S.bar(8), 4, 45, 30, 82); roll(timp, S.bar(16) + 2, 2, 45, 30, 70)
    timp.note(S.bar(9), 2, 38, 96); timp.note(S.bar(1), 2, 38, 84)
    return S


def cytadela():  # Cytadela: bagienna, modalna a-moll, shakuhachi, kalimba, marimba, kongi, niski bordun
    S = Song('miasto_cytadela', 88, 4, 24, seed=27); P = lambda s, b: prog(s, 4, S.bar(b))
    A, B, A2 = P('Am Am G Am F G Em Am', 1), P('Dm Am Dm Em F C G Am', 9), P('Am Am G Am F G Em Am', 17)
    allp = A + B + A2
    mA = 'E5:3 D5:1 | C5:2 A4:2 | B4:3 G4:1 | A4:4 | C5:1.5 D5:.5 E5:2 | G5:2 E5:2 | D5:2 B4:2 | A4:4'
    sh = S.track('shakuhachi', SHAKU, 0, vol=92, pan=58, rev=105)
    pf = S.track('flet Pana', PANFL, 1, vol=86, pan=70, rev=100)
    kal = S.track('kalimba', KALIMBA, 2, vol=84, pan=84, rev=90)
    mar = S.track('marimba', MARIMBA, 3, vol=78, pan=44, rev=85)
    drn = S.track('fagot', BSN, 4, vol=78, pan=66, rev=95)
    pad_t = S.track('smyczki', SLOWSTR, 5, vol=58, pan=64, rev=110)
    cb = S.track('kontrabas', CB, 6, vol=74, pan=72, rev=90)
    dr = S.track('kongi', 0, 9, vol=80, pan=64, rev=70)
    melody(sh, S.bar(1), mA, vel=82, legato=1.0)
    mb = melody(pf, S.bar(9), 'F5:2 D5:1 A4:1 | E5:2 C5:2 | D5:1 F5:1 A5:2 | G5:2 E5:1 B4:1 | A4:1 C5:1 F5:2 | E5:2 G5:2 | D5:1.5 B4:.5 G4:2 | A4:4', vel=82)
    counter(sh, B, mb, 57, 69, step=4, vel=56)
    m3 = melody(sh, S.bar(17), mA, vel=86, legato=1.0); copy_notes(m3, pf, oct=1, vel=56)
    arp(kal, allp, 57, 81, step=0.5, shape=(0, 2, 1, 3, 2, 4, 3, 1), vel=66, ring=1.4)
    for c, s, d in B + A2:  # marimba na słabe części taktu
        for off in (0.5, 1.5, 2.5, 3.5): mar.note(s + off, .4, voicing(c, 45, 60, 1)[0], 58)
    for c, s, d in allp: drn.note(s, d, 33 if c[0] in 'AF' else 40 if c[0] in 'EG' else 38, 64)  # bordun
    pad(pad_t, B + A2, 52, 64, 3, vel=46)
    bass(cb, allp, lo=28, pattern=[(0, 3, 'R'), (3, 1, '5')], vel=76)
    hits(dr, 1, 24, 4, [(0, 64, 76), (1, 63, 54), (1.5, 62, 50), (2, 64, 68), (3, 63, 56), (3.5, 62, 48)])
    for b in range(9, 25): dr.note(S.bar(b) + 2.75, .2, 75, 44)  # klawesy
    return S


def inferno():  # Inferno: piekielny c-moll frygijski, puzony, chór, smyczki tremolo, taiko, organy
    S = Song('miasto_inferno', 100, 4, 24, seed=29); P = lambda s, b: prog(s, 4, S.bar(b))
    A, B, A2 = P('Cm Db Cm G Cm Ab Db G', 1), P('Fm Db Ab G Fm Db G:2 Gsus4:2 G', 9), P('Cm Db Cm G Cm Ab Db G', 17)
    allp = A + B + A2
    mA = 'C4:2 Eb4:1 D4:1 | Db4:3 C4:1 | Eb4:1.5 F4:.5 G4:2 | B3:4 | C4:1 Eb4:1 G4:1 Ab4:1 | C5:2 Ab4:2 | Db5:1.5 C5:.5 Ab4:1 F4:1 | G4:2 B3:2'
    trem = S.track('smyczki tremolo', TREM, 0, vol=86, pan=64, rev=80)
    tbn = S.track('puzony', TBN, 1, vol=100, pan=70, rev=85)
    horn = S.track('rogi', HORN, 2, vol=96, pan=56, rev=90)
    ch = S.track('chór', CHOIR, 3, vol=94, pan=64, rev=110)
    org = S.track('organy', ORGAN, 4, vol=64, pan=60, rev=105)
    vc = S.track('wiolonczele', VC, 5, vol=96, pan=82, rev=70)
    cb = S.track('kontrabasy', CB, 6, vol=80, pan=76, rev=70)
    timp = S.track('kotły', TIMP, 7, vol=104, pan=64, rev=85)
    taiko = S.track('taiko', TAIKO, 8, vol=96, pan=64, rev=80)
    dr = S.track('perkusja', 48, 9, vol=80, pan=64, rev=70)
    melody(tbn, S.bar(1), mA, vel=96, legato=0.96)
    m3 = melody(horn, S.bar(17), mA, vel=100, oct=1, legato=0.96); copy_notes(m3, tbn, vel=100, legato=0.96)
    mb = melody(ch, S.bar(9), 'F5:2 Ab5:2 | Db5:4 | Eb5:2 C5:2 | B4:4 | Ab5:1.5 G5:.5 F5:2 | F5:2 Db5:2 | D5:2 C5:2 | B4:4', vel=92, legato=1.03)
    pad(horn, B, 53, 65, 3, vel=70)
    pad(trem, allp, 60, 75, 3, vel=60); trem.expr([(0, 70), (32, 100), (64, 84), (92, 112), (96, 80)])
    pad(org, A, 36, 48, 2, vel=56)
    for c, s, d in allp:  # riff: ósemki na prymie z półtonem w górę (frygijski)
        _, b, _ = chord(c); r = 36 + (b - 36) % 12
        for k, iv in enumerate((0, 0, 1, 0, 0, 0, 1, 7)):
            if k * 0.5 < d: vc.note(s + k * 0.5, .42, r + iv, 92 if k % 4 == 0 else 76)
    bass(cb, allp, lo=24, vel=84)
    for c, s, d in allp: taiko.note(s, .8, 41, 100); taiko.note(s + 2.5, .5, 41, 80)
    roll(timp, S.bar(8), 4, 43, 40, 110); roll(timp, S.bar(16), 4, 43, 40, 116); roll(timp, S.bar(24), 4, 43, 40, 110)
    hits(dr, 9, 24, 4, [(1, 38, 64), (3, 38, 70)])
    for b in (1, 9, 17): dr.note(S.bar(b), 2, 49, 96)
    return S


def akademia():  # Akademia: zimowa magia, e-dorycki, czelesta, pozytywka, dzwonki, harfa, klarnet
    S = Song('miasto_akademia', 84, 4, 24, seed=31); P = lambda s, b: prog(s, 4, S.bar(b))
    A, B, A2 = P('Em A/E Em A C D Bm Em', 1), P('Cmaj7 D Bm Em Am D G B7', 9), P('Em A Em A C D B7 Em', 17)
    allp = A + B + A2
    mA = 'B5:1 G5:1 E5:1 B5:1 | C#6:2 A5:2 | B5:1 G5:1 E5:1 G5:1 | E5:2 C#5:2 | E5:1 G5:1 C6:1 B5:1 | A5:2 F#5:2 | F#5:1 D5:1 B4:1 D5:1 | E5:4'
    cel = S.track('czelesta', CELESTA, 0, vol=96, pan=58, rev=110)
    gl = S.track('dzwonki', GLOCK, 1, vol=70, pan=40, rev=110)
    mb_t = S.track('pozytywka', MBOX, 2, vol=72, pan=84, rev=105)
    harp = S.track('harfa', HARP, 3, vol=78, pan=90, rev=100)
    pad_t = S.track('smyczki', SLOWSTR, 4, vol=70, pan=64, rev=110)
    cl = S.track('klarnet', CLAR, 5, vol=90, pan=52, rev=100)
    pz = S.track('pizzicato', PIZZ, 6, vol=76, pan=74, rev=90)
    fl = S.track('flet', FLUTE, 7, vol=74, pan=68, rev=105)
    ch = S.track('chór', CHOIR, 8, vol=66, pan=64, rev=115)
    melody(cel, S.bar(1), mA, vel=82, legato=1.1)
    mb = melody(cl, S.bar(9), 'E5:2 G5:1 B5:1 | A5:2 F#5:2 | F#5:1 D5:1 B4:2 | G4:2 B4:2 | C5:2 E5:2 | D5:1 F#5:1 A5:2 | G5:2 D5:2 | D#5:4', vel=86, oct=-1)
    counter(fl, B, [(t, d, p + 12) for t, d, p in mb], 74, 86, step=2, vel=58)
    m3 = melody(cel, S.bar(17), mA, vel=86, legato=1.1); copy_notes(m3, gl, vel=54)
    arp(mb_t, A + A2, 64, 88, step=0.5, shape=(0, 2, 4, 6, 5, 3, 1, 3), vel=56, ring=1.8)
    arp(harp, allp, 40, 76, step=1, shape=(0, 2, 4, 6), vel=58, ring=2.4)
    pad(pad_t, allp, 52, 71, 4, vel=54); pad_t.expr([(0, 60), (32, 86), (64, 96), (96, 64)])
    pad(ch, B, 57, 69, 3, vel=48)
    bass(pz, allp, lo=36, pattern=[(0, 1, 'R'), (2, 1, '5'), (3, 1, '8')], vel=72)
    return S


def loch():  # Loch: podziemia, h-moll, rożek angielski, niskie smyczki i kontrabas, krople (czelesta), kotły
    S = Song('miasto_loch', 66, 4, 18, seed=33); P = lambda s, b: prog(s, 4, S.bar(b))
    A, A2, O = P('Bm Bm G F# Em Bm C F#', 1), P('Bm Bm G F# Em Bm C F#', 9), P('Bm F#', 17)
    allp = A + A2 + O
    mA = 'F#4:3 G4:1 | F#4:2 D4:2 | E4:2 G4:1 B4:1 | A#4:4 | G4:1.5 F#4:.5 E4:2 | D4:2 B3:2 | E4:2 G4:2 | F#4:4'
    eh = S.track('rożek angielski', EH, 0, vol=94, pan=56, rev=110)
    ob = S.track('obój', OBOE, 1, vol=78, pan=66, rev=110)
    lo = S.track('smyczki', SLOWSTR, 2, vol=90, pan=70, rev=105)
    vc = S.track('wiolonczele', VC, 3, vol=84, pan=82, rev=100)
    cb = S.track('kontrabasy', CB, 4, vol=84, pan=74, rev=95)
    cel = S.track('krople', CELESTA, 5, vol=58, pan=30, rev=120)
    harp = S.track('harfa', HARP, 6, vol=70, pan=92, rev=110)
    timp = S.track('kotły', TIMP, 7, vol=86, pan=64, rev=105)
    ch = S.track('chór', OOHS, 8, vol=70, pan=64, rev=115)
    melody(eh, S.bar(1), mA, vel=84, legato=1.03)
    m2 = melody(ob, S.bar(9), mA, vel=80, oct=1, legato=1.03)
    counter(vc, A2, m2, 43, 55, step=2, vel=70)
    melody(eh, S.bar(17), 'D4:2 B3:2 | C#4:2 A#3:2', vel=74)
    pad(lo, allp, 35, 54, 3, vel=64); lo.expr([(0, 60), (24, 92), (32, 70), (56, 104), (64, 76), (72, 60)])
    pad(ch, A2, 50, 62, 3, vel=46)
    bass(cb, allp, lo=23, vel=84)
    arp(harp, A2, 35, 59, step=1, shape=(0, 1, 2, 1), vel=50, ring=2.2)
    rng = random.Random(7)  # krople z sklepienia: rzadkie, wysokie, bez rytmu
    for k in range(26):
        t = rng.uniform(0, S.length - 2); c = chord_at(allp, t); p = 84 + (chord(c)[0][rng.randrange(len(chord(c)[0]))] - 84) % 12
        cel.note(t, 1.5, p, rng.randint(34, 58))
    for b in (1, 9): timp.note(S.bar(b), 2, 35, 92)
    roll(timp, S.bar(8), 4, 42, 24, 76); roll(timp, S.bar(18), 4, 42, 24, 70)
    return S


def twierdza():  # Twierdza: stepowa, d-dorycka, skrzypki ludowe, rogi, bębny wojenne, niski chór, smyczkowe ostinato
    S = Song('miasto_twierdza', 112, 4, 28, seed=35); P = lambda s, b: prog(s, 4, S.bar(b))
    cA = 'Dm G Dm C Dm G C:2 A:2 Dm'
    A, B, A2, R = P(cA, 1), P('F C G Dm Bb F A:2 Asus4:2 A', 9), P(cA, 17), P('Dm Dm C Dm', 25)
    allp = A + B + A2 + R
    mA = 'D5:1 D5:.5 E5:.5 F5:1 A5:1 | G5:1.5 F5:.5 E5:1 D5:1 | F5:1 E5:.5 D5:.5 C5:1 A4:1 | C5:1.5 D5:.5 E5:1 G5:1 | A5:1 G5:.5 F5:.5 E5:1 D5:1 | B4:1 D5:1 G5:2 | E5:1 C5:1 C#5:1 E5:1 | D5:4'
    fid = S.track('skrzypki', FIDDLE, 0, vol=92, pan=50, rev=80)
    horn = S.track('rogi', HORN, 1, vol=104, pan=60, rev=90)
    oo = S.track('niski chór', OOHS, 2, vol=84, pan=64, rev=100)
    st = S.track('smyczki', STR, 3, vol=84, pan=70, rev=80)
    vc = S.track('wiolonczele', VC, 4, vol=96, pan=82, rev=70)
    cb = S.track('kontrabasy', CB, 5, vol=82, pan=76, rev=70)
    taiko = S.track('taiko', TAIKO, 6, vol=104, pan=64, rev=80)
    timp = S.track('kotły', TIMP, 7, vol=96, pan=64, rev=85)
    dr = S.track('bębny', 0, 9, vol=88, pan=64, rev=70)
    melody(fid, S.bar(1), mA, vel=88, legato=0.92)
    melody(horn, S.bar(9), 'C5:2 A4:2 | G4:2 E4:2 | D4:1 G4:1 B4:2 | A4:2 F4:2 | Bb4:2 D5:2 | C5:2 A4:2 | C#5:2 D5:2 | E5:4', vel=96, oct=-1)
    m3 = melody(fid, S.bar(17), mA, vel=92, legato=0.92); copy_notes(m3, horn, oct=-1, vel=84, legato=0.92)
    melody(horn, S.bar(25), 'D4:2 A3:2 | F4:1 E4:1 D4:2 | E4:2 C4:2 | D4:4', vel=104)
    pad(oo, B + A2, 45, 57, 3, vel=62); oo.expr([(32, 60), (60, 96), (96, 80), (112, 100)])
    pad(st, B, 57, 69, 3, vel=58)
    for c, s, d in allp:  # ostinato wiolonczel: ósemki w rytmie galopu
        _, b, r = chord(c); p = 38 + (b - 38) % 12
        for k, w in enumerate((0, 0, 7, 0, 0, 0, 7, 12)):
            if k * 0.5 < d: vc.note(s + k * 0.5, .4, p + w, 90 if k % 2 == 0 else 72)
    bass(cb, allp, lo=26, vel=86)
    for c, s, d in allp:
        taiko.note(s, .8, 38, 104); taiko.note(s + 1.5, .5, 38, 78)
        if d >= 4: taiko.note(s + 2, .8, 38, 96); taiko.note(s + 3.5, .4, 38, 70)
    hits(dr, 9, 28, 4, [(0, 41, 70), (1, 45, 58), (2, 43, 66), (2.5, 45, 52), (3, 41, 60), (3.5, 43, 54)])
    roll(timp, S.bar(24), 4, 38, 50, 116); roll(timp, S.bar(28), 4, 45, 50, 110)
    for b in (9, 17, 25): dr.note(S.bar(b), 2, 49, 92)
    return S


ZAMKI = [przystan, knieja, kurhan, cytadela, inferno, akademia, loch, twierdza]
