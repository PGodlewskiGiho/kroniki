# Muzyka bitew: oblężenie, starcie z bohaterem i walka z dzikimi stworami (obok utworu „bitwa” z utwory.py).
from nuty import *
from utwory import STR, SLOWSTR, TREM, PIZZ, VLN, VLA, VC, CB, HARP, TIMP, HORN, TPT, TBN, BRASS, OBOE, EH, BSN, CLAR, FLUTE, CHOIR, ORGAN, BELLS
from zamki import TAIKO, MARIMBA, hits


def ostinato(tr, pr, lo, pat, vel=(90, 74), step=0.5):  # ósemki od prymy akordu: pat = interwały w półtonach
    for c, s, d in pr:
        _, b, _ = chord(c); r = lo + (b - lo) % 12
        for k, iv in enumerate(pat * 4):
            if k * step >= d - 1e-6: break
            tr.note(s + k * step, step * 0.85, r + iv, vel[0] if k % 4 == 0 else vel[1])


def oblezenie():  # oblężenie: ciężki marsz c-moll, niska blacha, bębny wojenne, chór, kotły
    S = Song('bitwa_oblezenie', 96, 4, 24, seed=41); P = lambda s, b: prog(s, 4, S.bar(b))
    I, A, B, L = P('Cm Cm Ab G', 1), P('Cm Fm Cm G Cm Ab Fm:2 G:2 Cm', 5), P('Ab Eb Fm Cm Ab Eb G:2 Gsus4:2 G', 13), P('Cm Ab Fm G', 21)
    allp = I + A + B + L
    horn = S.track('rogi', HORN, 0, vol=108, pan=58, rev=85)
    tpt = S.track('trąbki', TPT, 1, vol=94, pan=50, rev=85)
    tbn = S.track('puzony', TBN, 2, vol=100, pan=70, rev=80)
    ch = S.track('chór', CHOIR, 3, vol=90, pan=64, rev=110)
    trem = S.track('smyczki tremolo', TREM, 4, vol=82, pan=64, rev=80)
    vc = S.track('wiolonczele', VC, 5, vol=96, pan=82, rev=70)
    cb = S.track('kontrabasy', CB, 6, vol=82, pan=76, rev=70)
    timp = S.track('kotły', TIMP, 7, vol=108, pan=64, rev=85)
    taiko = S.track('taiko', TAIKO, 8, vol=104, pan=64, rev=80)
    dr = S.track('werbel', 48, 9, vol=82, pan=64, rev=70)
    melody(horn, S.bar(5), 'C4:1.5 C4:.5 G4:2 | F4:1.5 Eb4:.5 C4:2 | Eb4:1 G4:1 C5:1.5 Bb4:.5 | B4:2 D4:2 | C4:1 Eb4:1 G4:1 Ab4:1 | C5:2 Ab4:2 | Ab4:1 F4:1 B3:1 D4:1 | C4:4', vel=100, legato=0.95)
    mB = melody(tpt, S.bar(13), 'Eb5:2 C5:2 | Bb4:2 G4:2 | Ab4:1 C5:1 F5:2 | Eb5:2 C5:2 | C5:1.5 Eb5:.5 Ab5:2 | G5:2 Bb4:2 | B4:2 C5:2 | D5:4', vel=96, legato=0.95)
    copy_notes(mB, horn, oct=-1, vel=90, legato=0.95)
    mL = melody(horn, S.bar(21), 'C5:2 G4:2 | Ab4:2 C5:2 | F4:2 Ab4:2 | G4:2 B3:2', vel=110); copy_notes(mL, tpt, vel=98); copy_notes(mL, tbn, oct=-1, vel=100)
    pad(tbn, A + B, 43, 58, 3, vel=74); tbn.expr([(16, 80), (48, 104), (80, 96)])
    pad(ch, B + L, 52, 67, 3, vel=70); ch.expr([(48, 70), (76, 106), (96, 90)])
    pad(trem, allp, 60, 75, 3, vel=58); trem.expr([(0, 60), (16, 90), (48, 100), (80, 110), (96, 80)])
    ostinato(vc, allp, 36, [0, 0, 7, 0, 0, 0, 7, 12])
    bass(cb, allp, lo=24, vel=86)
    for c, s, d in allp: taiko.note(s, .8, 38, 110); taiko.note(s + 1, .5, 38, 80); taiko.note(s + 2, .8, 38, 100); taiko.note(s + 3, .5, 38, 84)
    root_t = {'C': 36, 'A': 44, 'G': 43, 'F': 41, 'E': 39}
    for c, s, d in I + L: timp.note(s, 1, root_t[c[0]], 106)
    roll(timp, S.bar(12), 4, 43, 40, 112); roll(timp, S.bar(24), 4, 43, 40, 116)
    hits(dr, 5, 24, 4, [(0, 38, 60), (1.5, 38, 46), (2, 38, 64), (2.75, 38, 44), (3, 38, 58), (3.5, 38, 50)])
    roll(dr, S.bar(4), 4, 38, 30, 96); roll(dr, S.bar(20), 4, 38, 30, 104)
    for b in (5, 13, 21): dr.note(S.bar(b), 2, 49, 100)
    return S


def bohater():  # starcie z bohaterem: epickie e-moll, szybkie ostinato smyczków, temat rogów, trąbki, chór
    S = Song('bitwa_bohater', 140, 4, 36, seed=43); P = lambda s, b: prog(s, 4, S.bar(b))
    cA = 'Em C G D Em C Am:2 B:2 Em'
    I, A, B, A2, C = P('Em C D Em', 1), P(cA, 5), P('C G D Em C G Am B', 13), P(cA, 21), P('Am Em C G Am Em B:2 B7:2 B', 29)
    allp = I + A + B + A2 + C
    mA = 'E4:1.5 B3:.5 E4:1 G4:1 | C5:2 G4:2 | B4:1.5 D5:.5 G4:2 | F#4:2 A4:2 | B4:1 E5:1 D5:1 B4:1 | C5:1.5 B4:.5 G4:1 E4:1 | A4:1 C5:1 B4:1 D#4:1 | E4:4'
    horn = S.track('rogi', HORN, 0, vol=110, pan=58, rev=85)
    tpt = S.track('trąbki', TPT, 1, vol=96, pan=50, rev=85)
    vln = S.track('skrzypce', STR, 2, vol=100, pan=44, rev=75)
    vla = S.track('altówki', VLA, 3, vol=88, pan=56, rev=70)
    ch = S.track('chór', CHOIR, 4, vol=92, pan=64, rev=110)
    vc = S.track('wiolonczele', VC, 5, vol=96, pan=82, rev=70)
    cb = S.track('kontrabasy', CB, 6, vol=82, pan=76, rev=70)
    tbn = S.track('puzony', TBN, 7, vol=92, pan=70, rev=80)
    timp = S.track('kotły', TIMP, 8, vol=108, pan=64, rev=85)
    dr = S.track('perkusja', 48, 9, vol=88, pan=64, rev=70)
    melody(horn, S.bar(5), mA, vel=102, legato=0.95)
    mB = melody(tpt, S.bar(13), 'G5:2 E5:2 | D5:2 B4:2 | A4:1 D5:1 F#5:2 | E5:2 B4:2 | C5:1 E5:1 G5:2 | B5:2 G5:1 D5:1 | C5:2 E5:2 | D#5:2 F#5:2', vel=98, legato=0.95)
    copy_notes(mB, vln, vel=92, legato=0.95)
    m3 = melody(horn, S.bar(21), mA, vel=110, legato=0.95); copy_notes(m3, tpt, oct=1, vel=94, legato=0.95); copy_notes(m3, tbn, oct=-1, vel=96, legato=0.95)
    mC = melody(ch, S.bar(29), 'A4:2 C5:2 | B4:2 G4:2 | E5:2 C5:2 | D5:2 B4:2 | C5:2 E5:2 | G5:2 E5:2 | F#5:2 D#5:2 | B4:4', vel=96, legato=1.02)
    copy_notes(mC, horn, oct=-1, vel=96)
    arp(vla, allp, 55, 79, step=0.5, shape=(0, 2, 4, 2, 1, 3, 5, 3), vel=70, ring=1.0)  # szybkie ostinato
    ostinato(vc, allp, 40, [0, 0, 7, 0, 0, 7, 0, 12])
    bass(cb, allp, lo=28, pattern=[(0, 2, 'R'), (2, 2, 'R')], vel=88)
    pad(tbn, B + C, 47, 59, 3, vel=70)
    for c, s, d in allp: dr.note(s, .3, 36, 100); dr.note(s + 2, .3, 36, 90); dr.note(s + 1, .2, 38, 70); dr.note(s + 3, .2, 38, 76)
    for b in range(13, 21): t = S.bar(b); [dr.note(t + k * 0.5, .2, 42, 54) for k in range(8)]
    for b in (5, 13, 21, 29): dr.note(S.bar(b), 2, 49, 104)
    root_t = {'E': 40, 'C': 48, 'D': 38, 'G': 43, 'A': 45, 'B': 47}
    for c, s, d in I + C: timp.note(s, 1, root_t[c[0]], 108); timp.note(s + 2.5, .5, root_t[c[0]], 84)
    roll(timp, S.bar(4), 4, 47, 40, 112); roll(timp, S.bar(36), 4, 47, 40, 116)
    return S


def dzicz():  # walka z dzikimi stworami: g-dorycki, flet i obój, pizzicato, kongi i bębny, rogi
    S = Song('bitwa_dzicz', 120, 4, 32, seed=45); P = lambda s, b: prog(s, 4, S.bar(b))
    cA = 'Gm F Gm C Gm F Eb:2 F:2 Gm'
    A, B, A2, C = P(cA, 1), P('Eb Bb F Gm Eb Bb C:2 D:2 D', 9), P(cA, 17), P('Gm Gm F F Eb Eb D D', 25)
    allp = A + B + A2 + C
    mA = 'G5:1 Bb5:.5 A5:.5 G5:1 D5:1 | F5:1.5 E5:.5 C5:2 | D5:1 G5:1 Bb5:1 A5:1 | G5:1.5 E5:.5 C5:2 | Bb4:1 D5:1 G5:1.5 F5:.5 | A5:1 G5:.5 F5:.5 C5:2 | G5:1 Eb5:1 F5:1 A5:1 | G5:4'
    fl = S.track('flet', FLUTE, 0, vol=92, pan=60, rev=90)
    ob = S.track('obój', OBOE, 1, vol=90, pan=70, rev=90)
    horn = S.track('rogi', HORN, 2, vol=102, pan=56, rev=90)
    pz = S.track('pizzicato', PIZZ, 3, vol=92, pan=78, rev=75)
    st = S.track('smyczki', STR, 4, vol=74, pan=64, rev=90)
    mar = S.track('marimba', MARIMBA, 5, vol=80, pan=40, rev=80)
    cb = S.track('kontrabasy', CB, 6, vol=80, pan=76, rev=75)
    timp = S.track('kotły', TIMP, 7, vol=100, pan=64, rev=85)
    dr = S.track('bębny', 0, 9, vol=88, pan=64, rev=70)
    m1 = melody(fl, S.bar(1), mA, vel=88, legato=0.94)
    mb = melody(ob, S.bar(9), 'Eb5:2 G5:2 | F5:2 D5:2 | C5:1 F5:1 A5:2 | G5:2 D5:2 | Bb4:1 Eb5:1 G5:2 | F5:2 D5:2 | E5:2 F#5:2 | A5:4', vel=88)
    counter(fl, B, mb, 72, 84, step=2, vel=62)
    m3 = melody(fl, S.bar(17), mA, vel=92, legato=0.94); copy_notes(m3, ob, oct=-1, vel=80, legato=0.94)
    mc = melody(horn, S.bar(25), 'G4:2 D4:2 | Bb4:2 G4:2 | F4:2 C4:2 | A4:2 F4:2 | Eb4:2 Bb3:2 | G4:2 Eb4:2 | D4:2 F#4:2 | A4:4', vel=104)
    pad(horn, A2, 50, 62, 3, vel=64)
    ostinato(pz, allp, 43, [0, 7, 12, 7, 0, 7, 10, 7], vel=(88, 70))
    for c, s, d in B + C:
        for off in (0.5, 1.5, 2.5, 3.5):
            if off < d: mar.note(s + off, .4, voicing(c, 55, 70, 1)[0], 62)
    pad(st, B + A2 + C, 55, 70, 3, vel=58); st.expr([(32, 70), (64, 90), (96, 80), (124, 108)])
    bass(cb, allp, lo=31, pattern=[(0, 1.5, 'R'), (1.5, .5, 'R'), (2, 2, '5')], vel=86)
    hits(dr, 1, 32, 4, [(0, 64, 84), (0.5, 63, 58), (1, 62, 70), (1.5, 63, 56), (2, 64, 80), (2.75, 63, 54), (3, 62, 68), (3.5, 60, 60)])
    hits(dr, 9, 32, 4, [(0, 41, 78), (2, 43, 70), (3.5, 45, 64)])
    for b in (9, 17, 25): dr.note(S.bar(b), 2, 49, 96)
    root_t = {'G': 43, 'F': 41, 'E': 39, 'D': 38, 'C': 48, 'B': 46}
    for c, s, d in C: timp.note(s, 1, root_t[c[0]], 104); timp.note(s + 2, 1, root_t[c[0]], 90)
    roll(timp, S.bar(16), 4, 38, 40, 110); roll(timp, S.bar(32), 4, 38, 40, 112)
    return S


def trudna():  # trudna walka (silniejsze stwory): d-moll, bezlitosne ostinato, chór szeptem i krzykiem, blacha, taiko
    S = Song('bitwa_trudna', 150, 4, 36, seed=47); P = lambda s, b: prog(s, 4, S.bar(b))
    I, A, B, A2, C = P('Dm Dm Bb A', 1), P('Dm Bb Gm A Dm Bb Gm:2 A:2 A', 5), P('Gm Dm Eb Bb Gm Dm Eb:2 A:2 A', 13), P('Dm Bb Gm A Dm Bb Gm:2 A:2 A', 21), P('Dm C Bb A Dm C Bb:2 A:2 A', 29)
    allp = I + A + B + A2 + C
    mA = 'D4:1.5 E4:.5 F4:2 | D4:1 F4:1 Bb4:2 | A4:1.5 G4:.5 Bb4:2 | A4:2 C#4:2 | D4:1 F4:1 A4:1 D5:1 | Bb4:1.5 A4:.5 F4:2 | G4:1 Bb4:1 A4:1 E4:1 | A3:4'
    horn = S.track('rogi', HORN, 0, vol=112, pan=58, rev=85)
    tbn = S.track('puzony', TBN, 1, vol=100, pan=70, rev=80)
    tpt = S.track('trąbki', TPT, 2, vol=94, pan=50, rev=85)
    ch = S.track('chór', CHOIR, 3, vol=96, pan=64, rev=105)
    vln = S.track('skrzypce', STR, 4, vol=96, pan=44, rev=70)
    vc = S.track('wiolonczele', VC, 5, vol=100, pan=82, rev=65)
    cb = S.track('kontrabasy', CB, 6, vol=86, pan=76, rev=65)
    timp = S.track('kotły', TIMP, 7, vol=110, pan=64, rev=80)
    taiko = S.track('taiko', TAIKO, 8, vol=108, pan=64, rev=75)
    dr = S.track('perkusja', 48, 9, vol=90, pan=64, rev=65)
    melody(horn, S.bar(5), mA, vel=104, legato=0.92)
    mB = melody(ch, S.bar(13), 'Bb4:2 D5:2 | A4:2 F4:2 | G4:2 Bb4:2 | F4:4 | D5:2 Bb4:2 | F5:2 D5:2 | Eb5:2 C#5:2 | E5:4', vel=100, legato=1.0)
    copy_notes(mB, tpt, vel=90)
    m3 = melody(horn, S.bar(21), mA, vel=112, legato=0.92); copy_notes(m3, tbn, oct=-1, vel=104, legato=0.92); copy_notes(m3, vln, oct=1, vel=96, legato=0.92)
    mC = melody(tpt, S.bar(29), 'D5:1 D5:1 F5:2 | E5:1 E5:1 G5:2 | F5:1 F5:1 D5:2 | C#5:4 | D5:1 F5:1 A5:2 | G5:1 E5:1 C5:2 | D5:2 C#5:2 | E5:4', vel=104, legato=0.9)
    copy_notes(mC, ch, oct=-1, vel=96)
    for c, s, d in I + A + A2: # chór staccato: sylaby na ósemkach
        v = voicing(c, 50, 62, 2)
        for k in (0, 1.5, 2, 3.5):
            if k < d:
                for p in v: ch.note(s + k, .3, p, 70)
    ostinato(vc, allp, 38, [0, 0, 1, 0, 0, 0, 7, 6])  # półton i tryton: niepokój
    ostinato(vln, I + B + C, 62, [12, 7, 12, 8, 12, 7, 13, 12], vel=(76, 64))
    bass(cb, allp, lo=26, vel=88)
    pad(tbn, B, 43, 55, 3, vel=80)
    for c, s, d in allp: taiko.note(s, .7, 38, 112); taiko.note(s + 1.5, .5, 38, 84); taiko.note(s + 2, .7, 38, 104); taiko.note(s + 3.5, .4, 38, 90)
    for c, s, d in allp: dr.note(s + 1, .2, 38, 74); dr.note(s + 3, .2, 38, 82)
    for b in (5, 13, 21, 29): dr.note(S.bar(b), 2, 49, 108)
    for b in (4, 12, 20, 28, 36): roll(timp, S.bar(b), 4, 45, 50, 118)
    return S


def boss():  # starcie z potężnym bohaterem (boss): f-moll, organy i chór, cała orkiestra, dzwony, ciężkie kotły
    S = Song('bitwa_boss', 132, 4, 40, seed=49); P = lambda s, b: prog(s, 4, S.bar(b))
    I, A, B, A2, C = P('Fm Db Fm C', 1), P('Fm Db Bbm C Fm Db Bbm:2 C:2 C', 5), P('Db Ab Eb Fm Db Ab Bbm:2 C:2 C', 13), P('Fm Db Bbm C Fm Db Bbm:2 C:2 C', 21), P('Fm Fm Db Db Bbm Bbm C:2 Csus4:2 C Fm Db Bbm:2 C:2 C', 29)
    allp = I + A + B + A2 + C
    mA = 'F4:2 Ab4:1 C5:1 | Db5:2 C5:1 Bb4:1 | Bb4:1.5 C5:.5 Db5:1 F5:1 | E5:4 | F5:1 Eb5:1 C5:1 Ab4:1 | Db5:1.5 C5:.5 Ab4:2 | Bb4:1 Db5:1 C5:1 G4:1 | C5:4'
    org = S.track('organy', ORGAN, 0, vol=84, pan=60, rev=110)
    ch = S.track('chór', CHOIR, 1, vol=100, pan=64, rev=115)
    horn = S.track('rogi', HORN, 2, vol=110, pan=56, rev=90)
    tbn = S.track('puzony', TBN, 3, vol=102, pan=70, rev=85)
    tpt = S.track('trąbki', TPT, 4, vol=96, pan=48, rev=90)
    vln = S.track('skrzypce', STR, 5, vol=100, pan=44, rev=80)
    vc = S.track('wiolonczele', VC, 6, vol=100, pan=82, rev=70)
    cb = S.track('kontrabasy', CB, 7, vol=88, pan=76, rev=70)
    bells = S.track('dzwony', BELLS, 8, vol=84, pan=36, rev=115)
    timp = S.track('kotły', TIMP, 10, vol=112, pan=64, rev=90)
    taiko = S.track('taiko', TAIKO, 11, vol=104, pan=64, rev=80)
    dr = S.track('perkusja', 48, 9, vol=90, pan=64, rev=70)
    pad(org, I, 41, 60, 4, vel=80)
    for b in (1, 3): bells.note(S.bar(b), 4, 53, 96); bells.note(S.bar(b) + 2, 2, 48, 80)
    m1 = melody(ch, S.bar(5), mA, vel=100, legato=1.02); copy_notes(m1, horn, oct=-1, vel=96, legato=0.95)
    mB = melody(tpt, S.bar(13), 'Ab5:2 F5:2 | Eb5:2 C5:2 | Bb4:1 Eb5:1 G5:2 | F5:2 C5:2 | Db5:1 F5:1 Ab5:2 | C6:2 Ab5:1 Eb5:1 | Db5:2 F5:2 | E5:4', vel=100, legato=0.95)
    copy_notes(mB, vln, vel=94, legato=0.95)
    m3 = melody(horn, S.bar(21), mA, vel=112, legato=0.95); copy_notes(m3, ch, oct=1, vel=96); copy_notes(m3, tbn, oct=-1, vel=104, legato=0.95); copy_notes(m3, tpt, oct=1, vel=90, legato=0.95)
    melody(ch, S.bar(29), 'C5:4 | Ab4:4 | Db5:4 | F5:4 | Db5:4 | Bb4:4 | C5:2 F5:2 | E5:4 | F5:2 C5:2 | Ab5:2 F5:2 | F5:2 E5:2 | E5:4', vel=104, legato=1.04)
    pad(org, A + B + A2 + C, 41, 60, 4, vel=66); org.expr([(16, 70), (80, 96), (112, 110), (160, 90)])
    ostinato(vc, allp, 41, [0, 0, 7, 0, 0, 7, 12, 7])
    arp(vln, A + A2 + C, 65, 89, step=0.5, shape=(0, 2, 4, 2, 0, 3, 5, 3), vel=64, ring=1.0)
    bass(cb, allp, lo=29, vel=90)
    pad(tbn, B + C, 44, 56, 3, vel=76)
    for c, s, d in A + B + A2 + C:
        taiko.note(s, .8, 38, 110); taiko.note(s + 2, .8, 38, 100)
        dr.note(s + 1, .2, 38, 76); dr.note(s + 3, .2, 38, 84)
    for b in range(29, 41, 2): bells.note(S.bar(b), 3, 53, 88)
    for b in (5, 13, 21, 29, 37): dr.note(S.bar(b), 2, 49, 110)
    root_t = {'F': 41, 'D': 37, 'B': 46, 'C': 48, 'A': 44, 'E': 39}
    for c, s, d in I + C: timp.note(s, 1, root_t[c[0]], 112); timp.note(s + 2, .5, root_t[c[0]], 92)
    for b in (4, 12, 20, 28, 40): roll(timp, S.bar(b), 4, 48, 50, 120)
    return S


BITWY = [oblezenie, bohater, dzicz, trudna, boss]
