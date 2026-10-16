// ==================== DANE: CZARY =======================================================
// kind: 'battle' (w bitwie, raz na rundę) albo 'adv' (na mapie). target: 'enemy', 'ally', 'undeadAlly', 'livingAlly' (także poległy),
// 'hex' (pole i sąsiedzi), 'all' (wszystkie oddziały na polu bitwy), 'allies' (wszyscy swoi), 'none' (czar mapy).
// sp = moc czarów bohatera; efekty liczą funkcje w polach dmg/heal/rounds, opis w desc(sp).
const SPELL_ROUNDS = sp => Math.max(1, sp + 1);
// „3 rundy”, „5 rund”, „1 rundę” (odmiana po liczebniku)
const roundsTxt = n => `${n} ${n === 1 ? 'rundę' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'rundy' : 'rund'}`;
// Szkoły magii jak w Heroes 3: umiejętność szkoły (Magia Ognia, Powietrza, Wody, Ziemi) obniża koszt czarów tej szkoły,
// wzmacnia obrażenia i leczenie, wydłuża czary na oddziały, a na poziomie eksperckim czar na jeden oddział działa na całą armię.
const SCHOOLS = {
  fire: { name: 'Ognia', tab: 'Ogień', skill: 'fireMagic', col: '#e8602a' }, air: { name: 'Powietrza', tab: 'Powietrze', skill: 'airMagic', col: '#8ac8ff' },
  water: { name: 'Wody', tab: 'Woda', skill: 'waterMagic', col: '#4a9ae0' }, earth: { name: 'Ziemi', tab: 'Ziemia', skill: 'earthMagic', col: '#a8864a' },
};
// Tarcza i Tarcza powietrza: o tyle % mniej obrażeń; Ognista tarcza: tyle % obrażeń wraca do napastnika; Łańcuch: przeskoki
const SHIELD_CUT = 30, FIRE_SHIELD = 20, CHAIN_JUMPS = 3;
const SPELLS = {
  magicArrow: { name: 'Magiczna strzała', school: 'air', level: 1, cost: 5, kind: 'battle', target: 'enemy', col: '#8ac0ff', dmg: sp => 10 + 10 * sp, desc: sp => `${10 + 10 * sp} obrażeń jednemu wrogowi` },
  bless: { name: 'Błogosławieństwo', school: 'water', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#ffe08a', buff: 'bless', desc: sp => `sojusznik zadaje najwyższe obrażenia przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  stoneSkin: { name: 'Kamienna skóra', school: 'earth', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#b8a888', buff: 'stoneSkin', desc: sp => `+3 do obrony sojusznika przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  haste: { name: 'Przyspieszenie', school: 'air', level: 1, cost: 6, kind: 'battle', target: 'ally', col: '#a8f0ff', buff: 'haste', desc: sp => `+3 do szybkości sojusznika przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  cure: { name: 'Uzdrowienie', school: 'water', level: 1, cost: 6, kind: 'battle', target: 'ally', col: '#8af07a', heal: sp => 10 + 5 * sp, desc: sp => `leczy ${10 + 5 * sp} życia i zdejmuje złe czary` },
  slow: { name: 'Spowolnienie', school: 'earth', level: 1, cost: 6, kind: 'battle', target: 'enemy', col: '#9a8ac8', buff: 'slow', desc: sp => `−3 do szybkości wroga przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  shield: { name: 'Tarcza', school: 'earth', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#d0b070', buff: 'shield', desc: sp => `sojusznik otrzymuje o ${SHIELD_CUT}% mniej obrażeń w walce wręcz przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  eagleEye: { name: 'Sokole oko', school: 'air', level: 1, cost: 4, kind: 'adv', target: 'none', col: '#f0c040', desc: sp => `odsłania mapę w promieniu ${5 + sp} pól wokół bohatera` },
  summonBoat: { name: 'Przywołanie łodzi', school: 'water', level: 1, cost: 7, kind: 'adv', target: 'none', col: '#6ab0e8', desc: () => 'łódź pojawia się na wodzie tuż przy bohaterze (bohater musi stać na brzegu)' },
  lightningBolt: { name: 'Błyskawica', school: 'air', level: 2, cost: 10, kind: 'battle', target: 'enemy', col: '#c8e0ff', dmg: sp => 25 + 20 * sp, desc: sp => `${25 + 20 * sp} obrażeń jednemu wrogowi` },
  iceBolt: { name: 'Lodowy pocisk', school: 'water', level: 2, cost: 8, kind: 'battle', target: 'enemy', col: '#9ad8ff', dmg: sp => 20 + 20 * sp, desc: sp => `${20 + 20 * sp} obrażeń jednemu wrogowi` },
  weakness: { name: 'Osłabienie', school: 'water', level: 2, cost: 8, kind: 'battle', target: 'enemy', col: '#a8a878', buff: 'weakness', desc: sp => `−3 do ataku wroga przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  bloodlust: { name: 'Żądza krwi', school: 'fire', level: 2, cost: 7, kind: 'battle', target: 'ally', col: '#ff6a5a', buff: 'bloodlust', desc: sp => `+3 do ataku sojusznika przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  fortune: { name: 'Fortuna', school: 'air', level: 2, cost: 7, kind: 'battle', target: 'ally', col: '#8af0c0', buff: 'fortune', desc: sp => `+2 do szczęścia sojusznika przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  deathRipple: { name: 'Fala śmierci', school: 'earth', level: 2, cost: 10, kind: 'battle', target: 'all', spare: 'undead', col: '#8a9a6a', dmg: sp => 5 + 5 * sp, desc: sp => `${5 + 5 * sp} obrażeń każdemu żywemu oddziałowi na polu bitwy (także swoim), nieumarłych oszczędza` },
  fireball: { name: 'Kula ognia', school: 'fire', level: 3, cost: 15, kind: 'battle', target: 'hex', col: '#ff8a2a', dmg: sp => 15 + 10 * sp, desc: sp => `${15 + 10 * sp} obrażeń na polu i wokół niego (także swoim!)` },
  frostRing: { name: 'Pierścień mrozu', school: 'water', level: 3, cost: 12, kind: 'battle', target: 'ring', col: '#bfe8ff', dmg: sp => 15 + 10 * sp, desc: sp => `${15 + 10 * sp} obrażeń na polach wokół wskazanego (środek bezpieczny)` },
  curse: { name: 'Klątwa', school: 'fire', level: 1, cost: 6, kind: 'battle', target: 'enemy', col: '#b04a8a', buff: 'curse', desc: sp => `wróg zadaje najniższe obrażenia przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  airShield: { name: 'Tarcza powietrza', school: 'air', level: 3, cost: 12, kind: 'battle', target: 'ally', col: '#d0f0ff', buff: 'airShield', desc: sp => `sojusznik otrzymuje o ${SHIELD_CUT}% mniej obrażeń od strzał przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  animateDead: { name: 'Ożywienie umarłych', school: 'earth', level: 3, cost: 15, kind: 'battle', target: 'undeadAlly', col: '#a6f0a8', heal: sp => 30 + 50 * sp, raise: true, desc: sp => `przywraca ${30 + 50 * sp} życia nieumarłym, także poległym w tej bitwie` },
  townPortal: { name: 'Powrót do miasta', school: 'earth', level: 3, cost: 16, kind: 'adv', target: 'none', col: '#c8a0ff', desc: () => 'przenosi bohatera do najbliższego własnego miasta (kosztuje 300 punktów ruchu)' },
  meteorShower: { name: 'Deszcz meteorów', school: 'earth', level: 4, cost: 16, kind: 'battle', target: 'hex', col: '#ff6a3a', dmg: sp => 25 + 25 * sp, desc: sp => `${25 + 25 * sp} obrażeń na polu i wokół niego (także swoim!)` },
  chainLightning: { name: 'Łańcuch piorunów', school: 'air', level: 4, cost: 24, kind: 'battle', target: 'enemy', chain: CHAIN_JUMPS, col: '#e0ecff', dmg: sp => 25 + 32 * sp,
    desc: sp => `${25 + 32 * sp} obrażeń wrogowi, potem przeskakuje na ${CHAIN_JUMPS} najbliższe oddziały (każdy za połowę poprzednich; także swoje!)` },
  fireShield: { name: 'Ognista tarcza', school: 'fire', level: 4, cost: 16, kind: 'battle', target: 'ally', col: '#ff9a3a', buff: 'fireShield', desc: sp => `kto uderzy sojusznika wręcz, sam dostaje ${FIRE_SHIELD}% zadanych obrażeń (${roundsTxt(SPELL_ROUNDS(sp))})` },
  prayer: { name: 'Modlitwa', school: 'water', level: 4, cost: 16, kind: 'battle', target: 'ally', col: '#fff0b0', buff: 'prayer', desc: sp => `+2 do ataku, obrony i szybkości sojusznika przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  resurrection: { name: 'Wskrzeszenie', school: 'earth', level: 4, cost: 20, kind: 'battle', target: 'livingAlly', col: '#fff8d0', heal: sp => 40 + 20 * sp, raise: true, desc: sp => `przywraca ${40 + 20 * sp} życia żywym sojusznikom, także poległym w tej bitwie` },
  implosion: { name: 'Implozja', school: 'earth', level: 5, cost: 30, kind: 'battle', target: 'enemy', col: '#c05aff', dmg: sp => 100 + 75 * sp, desc: sp => `${100 + 75 * sp} obrażeń jednemu wrogowi` },
  armageddon: { name: 'Armagedon', school: 'fire', level: 5, cost: 24, kind: 'battle', target: 'all', col: '#ff4a1a', dmg: sp => 30 + 50 * sp, desc: sp => `${30 + 50 * sp} obrażeń każdemu oddziałowi na polu bitwy, także swoim` },
  massHaste: { name: 'Przyspieszenie armii', school: 'air', level: 5, cost: 20, kind: 'battle', target: 'allies', col: '#a8f0ff', buff: 'haste', desc: sp => `+3 do szybkości wszystkich sojuszników przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  // --- nowe czary: rozproszenie, oślepienie, trucizna, wampiryzm, ściana ognia, kradzież życia, teleportacja, święte światło, klon, wiatr w plecy ---
  dispel: { name: 'Rozproszenie', school: 'water', level: 1, cost: 5, kind: 'battle', target: 'any', col: '#c8e8ff', dispel: true, desc: () => 'zdejmuje z oddziału wszystkie czary, dobre i złe (także truciznę i oślepienie)' },
  blind: { name: 'Oślepienie', school: 'fire', level: 2, cost: 10, kind: 'battle', target: 'enemy', col: '#f0e0a0', buff: 'blind', desc: sp => `wróg stoi bezczynnie i nie oddaje ciosów przez ${roundsTxt(SPELL_ROUNDS(sp))} albo do pierwszego trafienia` },
  poison: { name: 'Trucizna', school: 'earth', level: 2, cost: 8, kind: 'battle', target: 'enemy', col: '#8ac83a', buff: 'poison', dot: sp => 10 + 10 * sp, desc: sp => `wróg traci ${10 + 10 * sp} życia na początku każdej rundy przez ${roundsTxt(SPELL_ROUNDS(sp))}` },
  tailwind: { name: 'Wiatr w plecy', school: 'air', level: 2, cost: 8, kind: 'adv', target: 'none', col: '#c8f0ff', desc: sp => `+${400 + 100 * sp} punktów ruchu dziś (raz dziennie)` },
  vampirism: { name: 'Wampiryzm', school: 'earth', level: 3, cost: 12, kind: 'battle', target: 'ally', col: '#c83a4a', buff: 'vampiric', desc: sp => `sojusznik wysysa życie: połowa zadanych obrażeń leczy go i wskrzesza poległych (${roundsTxt(SPELL_ROUNDS(sp))})` },
  fireWall: { name: 'Ściana ognia', school: 'fire', level: 3, cost: 12, kind: 'battle', target: 'wall', col: '#ff7a2a', wall: true, dmg: sp => 10 + 10 * sp, desc: sp => `trzy pola płoną przez ${roundsTxt(SPELL_ROUNDS(sp))}: ${10 + 10 * sp} obrażeń od razu i połowa tego co rundę każdemu, kto w nich stoi` },
  lifeSteal: { name: 'Kradzież życia', school: 'earth', level: 3, cost: 14, kind: 'battle', target: 'enemy', col: '#d84a6a', drain: true, dmg: sp => 20 + 15 * sp, desc: sp => `${20 + 15 * sp} obrażeń wrogowi; zabrane życie leczy twój najbardziej poraniony oddział` },
  teleport: { name: 'Teleportacja', school: 'water', level: 3, cost: 12, kind: 'battle', target: 'ally', col: '#9ab0ff', teleport: true, desc: () => 'przenosi sojusznika na dowolne wolne pole (najpierw wskaż oddział, potem miejsce; w oblężeniu nie przez mur)' },
  holyLight: { name: 'Święte światło', school: 'water', level: 4, cost: 20, kind: 'battle', target: 'enemies', holy: true, col: '#fff4c0', dmg: sp => 10 + 12 * sp, desc: sp => `${10 + 12 * sp} obrażeń każdemu wrogowi (nieumarłym podwójnie); swoich nie rani` },
  clone: { name: 'Klon', school: 'air', level: 4, cost: 20, kind: 'battle', target: 'ally', col: '#b8e0ff', clone: true, desc: () => 'tworzy obok kopię oddziału, która walczy, ale znika po pierwszym trafieniu (jeden klon na raz)' },
  fear: { name: 'Groza', school: 'fire', level: 3, cost: 12, kind: 'adv', target: 'none', col: '#c84a2a', desc: () => 'do końca dnia stada co najmniej dwa razy słabsze od twojej armii uciekają przed bohaterem (nawet dzikie)' },
  dimensionDoor: { name: 'Drzwi wymiarów', school: 'air', level: 5, cost: 25, kind: 'adv', target: 'tile', col: '#b89aff', desc: sp => `bohater przenosi się na wskazane wolne pole lądu w promieniu ${6 + sp} pól (300 punktów ruchu, dwa razy dziennie)` },
  blizzard: { name: 'Zamieć', school: 'water', level: 5, cost: 26, kind: 'battle', target: 'enemies', buff: 'slow', col: '#d8f0ff', dmg: sp => 10 + 10 * sp, desc: sp => `${10 + 10 * sp} obrażeń każdemu wrogowi i spowolnienie (−3 do szybkości) na ${roundsTxt(SPELL_ROUNDS(sp))}` },
  // Sztuczka (cantrip): darmowy słaby czar każdego bohatera z księgą, rośnie z mocą czarów; nie uczy się go (level 0, cantrip)
  spark: { name: 'Iskra', level: 0, cantrip: true, cost: 0, kind: 'battle', target: 'enemy', col: '#ffd27a', dmg: sp => SPARK_BASE + SPARK_PER * sp, desc: sp => `${SPARK_BASE + SPARK_PER * sp} obrażeń jednemu wrogowi, bez many (sztuczka)` },
  massCure: { name: 'Źródło życia', school: 'water', level: 5, cost: 22, kind: 'battle', target: 'allies', col: '#7ae8c8', heal: sp => 20 + 15 * sp, desc: sp => `leczy ${20 + 15 * sp} życia wszystkim sojusznikom i zdejmuje z nich złe czary` },
};
const BUFF_NAMES = { bless: 'błogosławieństwo', stoneSkin: 'kamienna skóra', haste: 'przyspieszenie', slow: 'spowolnienie', weakness: 'osłabienie', bloodlust: 'żądza krwi', prayer: 'modlitwa',
  shield: 'tarcza', fortune: 'fortuna', curse: 'klątwa', airShield: 'tarcza powietrza', fireShield: 'ognista tarcza', blind: 'oślepienie', poison: 'trucizna', vampiric: 'wampiryzm' };
const BAD_BUFFS = ['slow', 'weakness', 'curse', 'blind', 'poison'];
// ==================== DANE: ROZKAZY ======================================================
// Rozkazy: drugi, równoległy do czarów sposób działania bohatera w bitwie (etap 1 rozwoju bohatera). Płaci się Zapałem: pula na bitwę
// rośnie z obroną bohatera (jak mana z wiedzą), co rundę wraca VALOR_REGEN; siła rozkazów rośnie z atakiem (jak czary z mocą).
// W rundzie bohater wydaje jeden rozkaz ALBO rzuca jeden czar, więc hybryda nie działa dwa razy. Szarżę i Mur tarcz zna każdy,
// resztę odblokowuje dowolna z umiejętności need. target jak w czarach; buff: znacznik na oddziale (siła w u.ordv), rounds: 1 = do końca rundy.
let SPARK_BASE = 2, SPARK_PER = 3, VALOR_BASE = 6, VALOR_PER_DEF = 2, VALOR_REGEN = 2; // let: strojone pomiarem (tools/balans)
const orderPct = (a, base, per, cap) => Math.min(cap, Math.round(base + per * a)); // procent zależny od ataku bohatera, z górną granicą
const ORDERS = {
  charge: { name: 'Szarża', cost: 4, target: 'ally', col: '#ffb060', buff: 'charge', rounds: 1, pow: a => orderPct(a, 10, 1.5, 50), desc: a => `oddział +2 do szybkości i +${orderPct(a, 10, 1.5, 50)}% obrażeń do końca rundy` },
  shieldWall: { name: 'Mur tarcz', cost: 4, target: 'ally', col: '#c8d0da', buff: 'wall', rounds: 1, pow: a => orderPct(a, 15, 2, 60), desc: a => `oddział otrzymuje o ${orderPct(a, 15, 2, 60)}% mniej obrażeń do końca rundy` },
  warCry: { name: 'Okrzyk bojowy', cost: 8, target: 'allies', need: ['leadership'], col: '#ff8a4a', buff: 'cry', rounds: 2, pow: a => Math.max(1, Math.ceil(a / 4)), desc: a => `cała armia +${Math.max(1, Math.ceil(a / 4))} do ataku i obrony przez 2 rundy` },
  flank: { name: 'Flanka', cost: 5, target: 'enemy', need: ['tactics', 'offense'], col: '#e8c040', buff: 'exposed', rounds: 1, pow: a => orderPct(a, 20, 2, 70), desc: a => `wróg otrzymuje o ${orderPct(a, 20, 2, 70)}% więcej obrażeń i nie oddaje ciosu do końca rundy` },
  volleyOrder: { name: 'Salwa na rozkaz', cost: 7, target: 'enemy', need: ['archery'], col: '#d8b070', volley: true, pow: a => orderPct(a, 30, 2, 80), desc: a => `wszyscy twoi strzelcy od razu strzelają w cel za ${orderPct(a, 30, 2, 80)}% obrażeń (zużywają strzały)` },
  rally: { name: 'Do szeregu!', cost: 6, target: 'livingAlly', need: ['firstAid', 'triage', 'armorer'], col: '#8ae0a0', heal: true, raise: true, pow: a => 30 + 15 * a, desc: a => `oddział odzyskuje ${30 + 15 * a} życia, polegli z tej bitwy wracają do szeregu` },
  regroup: { name: 'Przegrupowanie', cost: 3, target: 'ally', need: ['logistics', 'pathfinding'], col: '#a8c8e8', teleport: true, range: 4, desc: () => 'oddział przechodzi na wolne pole w odległości do 4 (najpierw wskaż oddział, potem miejsce)' },
  execute: { name: 'Pogrom', cost: 6, target: 'ally', need: ['offense', 'tactics'], col: '#c83a2a', buff: 'exec', rounds: 1, pow: a => orderPct(a, 25, 2, 75), desc: a => `ataki oddziału pomijają ${orderPct(a, 25, 2, 75)}% obrony wroga do końca rundy` },
};
// Zdolności klas prestiżowych (PRESTIGE.ability): raz na bitwę, za darmo; siła z ataku i mocy bohatera (a: atak, sp: moc, L: poziom), legenda ×1,5
const prestigePow = (h, f) => Math.round(f(heroStat(h, 'att'), spellPow(h), h.level) * (pathLv(h, h.mastery) === 2 ? 1.5 : 1));
Object.assign(ORDERS, {
  judgement: { name: 'Sąd ognia', prestige: 'flamePaladin', cost: 0, target: 'enemies', col: '#ff7a2a', pow: h => prestigePow(h, (a, sp) => 10 + 4 * (a + sp)), desc: a => 'każdy wróg, który stoi przy twoim oddziale, płonie: obrażenia rosną z atakiem i mocą' },
  runeStrike: { name: 'Runiczne ostrze', prestige: 'runeblade', cost: 0, target: 'ally', col: '#8ac8ff', desc: () => 'oddział do końca rundy zadaje o 50% więcej i pomija połowę obrony wroga' },
  sanctify: { name: 'Uświęcona ziemia', prestige: 'warpriest', cost: 0, target: 'allies', col: '#ffe8a0', pow: h => prestigePow(h, (a, sp) => 10 + 8 * sp), desc: () => 'cała armia +3 do obrony na 2 rundy i leczenie (rośnie z mocą)' },
  thunderVolley: { name: 'Burza', prestige: 'stormhunter', cost: 0, target: 'enemies', col: '#c8e8ff', pow: h => prestigePow(h, (a, sp) => 20 + 8 * sp + 2 * a), desc: () => 'pioruny bija w trzy losowe wrogie oddziały (legenda: pięć)' },
  raiseLegion: { name: 'Powstańcie!', prestige: 'bonecaller', cost: 0, target: 'allies', col: '#a6f0a8', pow: h => prestigePow(h, (a, sp, L) => 3 * L + a), desc: () => 'z ziemi wstają kościotrupy i walczą do końca bitwy (więcej z poziomem i atakiem)' },
  roots: { name: 'Korzenie', prestige: 'archdruid', cost: 0, target: 'enemy', col: '#6a9a3a', desc: () => 'wrogi oddział nie może się ruszyć przez 2 rundy (atakuje i strzela z miejsca)' },
  packCall: { name: 'Zew stada', prestige: 'beastlord', cost: 0, target: 'allies', col: '#a87a4a', pow: h => prestigePow(h, (a, sp, L) => 2 * L + a), desc: () => 'przybywa wataha wilków i walczy do końca bitwy' },
  bomb: { name: 'Bomba', prestige: 'bombardier', cost: 0, target: 'hex', col: '#ff9a3a', pow: h => prestigePow(h, (a, sp) => 20 + 5 * (a + sp)), desc: () => 'wybuch rani wszystkich na polu i wokół niego (także swoich!)' },
  assassinate: { name: 'Cios z cienia', prestige: 'shadowmaster', cost: 0, target: 'enemy', col: '#5a4a6a', pow: h => prestigePow(h, (a, sp, L) => 30 * a + 20 * L), desc: () => 'skrytobójca zadaje wrogiemu oddziałowi obrażenia z ataku i poziomu bohatera' },
  bloodPactP: { name: 'Krwawy pakt', prestige: 'bloodmage', cost: 0, target: 'allies', col: '#c8202a', desc: () => 'najliczniejszy twój żywy oddział oddaje piątą część życia, a bohater odzyskuje całą manę' },
  holdLine: { name: 'Nie przejdą!', prestige: 'warden', cost: 0, target: 'allies', col: '#c8d0da', desc: () => 'cała armia stawia Mur tarcz na 2 rundy' },
  meteor: { name: 'Deszcz meteorów', prestige: 'battleArch', cost: 0, target: 'hex', col: '#ff6a3a', desc: () => 'Deszcz meteorów bez many, nawet bez znajomości czaru' },});
// Zdolności artefaktów aktywnych (ARTIFACTS.use): raz na bitwę każda, za darmo; siła rośnie z poziomem bohatera (tak samo dla maga i wojownika)
Object.assign(ORDERS, {
  rodBolt: { name: 'Grom z różdżki', art: 'thunderRod', cost: 0, target: 'enemy', col: '#ffe060', pow: h => 40 + 12 * h.level, desc: () => 'piorun bije we wrogi oddział (obrażenia rosną z poziomem bohatera)' },
  flaskHeal: { name: 'Żywa woda', art: 'lifeFlask', cost: 0, target: 'livingAlly', col: '#4ac0a0', heal: true, raise: true, pow: h => 30 + 10 * h.level, desc: () => 'oddział odzyskuje życie, polegli z tej bitwy wracają (rośnie z poziomem)' },
  hornBlast: { name: 'Głos rogu', art: 'warHorn', cost: 0, target: 'allies', col: '#e8c070', pow: h => 2 + Math.floor(h.level / 5), desc: () => 'cała armia dostaje premię do ataku i obrony na 2 rundy (rośnie z poziomem)' },
  mirror: { name: 'Zwierciadło', art: 'mirrorShield', cost: 0, target: 'ally', col: '#d8e4f0', desc: () => 'oddział stawia Mur tarcz na 2 rundy i jest odporny na wrogie czary' },
  bind: { name: 'Spętanie', art: 'bindingChains', cost: 0, target: 'enemy', col: '#a050ff', desc: () => 'wrogi oddział nie może się ruszyć przez 2 rundy' },
  timeSurge: { name: 'Przyspieszony czas', art: 'hourglass', cost: 0, target: 'allies', col: '#f0e0a0', desc: () => 'cała armia +3 do szybkości na 2 rundy' },
  manaSurge: { name: 'Przypływ many', art: 'manaCrystal', cost: 0, target: 'allies', col: '#60c0ff', pow: h => 8 + 3 * h.level, desc: () => 'bohater odzyskuje manę (rośnie z poziomem)' },
  scrollFire: { name: 'Ognista kula ze zwoju', art: 'fireScroll', cost: 0, target: 'hex', col: '#ff6a2a', pow: h => 20 + 8 * h.level, desc: () => 'wybuch rani wszystkich na polu i wokół niego, także swoich (rośnie z poziomem)' },
});
const onceOrder = id => !!(ORDERS[id] && (ORDERS[id].prestige || ORDERS[id].art)); // zdolność raz na bitwę (klasa prestiżowa, artefakt)
Object.assign(BUFF_NAMES, { root: 'korzenie' });
Object.assign(BUFF_NAMES, { charge: 'szarża', wall: 'mur tarcz', cry: 'okrzyk bojowy', exposed: 'odsłonięta flanka', exec: 'pogrom' });
// Czar albo rozkaz po identyfikatorze (bitwa obsługuje oba tym samym wskazywaniem celu)
const actDef = id => SPELLS[id] || ORDERS[id];
// Ile czarów danego poziomu oferuje gildia
const GUILD_OFFER = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 1 };
const GUILD_MAX = 5;
// Magia frakcji (jak w Heroes 3): najwyższy poziom gildii magów i waga szkół przy losowaniu czarów gildii.
// Przystań kończy na IV, Twierdza i Cytadela (wojownicy) na III; Inferno i Loch ciągną do ognia, Kurhan do ziemi, Akademia do powietrza.
const FACTION_MAGIC = {
  haven: { max: 4, w: { fire: 1, air: 3, water: 3, earth: 2 } }, sylvan: { max: 5, w: { fire: 1, air: 2, water: 3, earth: 3 } },
  barrow: { max: 5, w: { fire: 1, air: 2, water: 2, earth: 4 } }, fortress: { max: 3, w: { fire: 1, air: 2, water: 3, earth: 3 } },
  inferno: { max: 5, w: { fire: 5, air: 2, water: 1, earth: 2 } }, academy: { max: 5, w: { fire: 2, air: 4, water: 3, earth: 2 } },
  dungeon: { max: 5, w: { fire: 3, air: 2, water: 1, earth: 3 } }, stronghold: { max: 3, w: { fire: 3, air: 3, water: 1, earth: 2 } }, forge: { max: 4, w: { fire: 3, air: 4, water: 1, earth: 2 } },
};
const guildMax = fac => (FACTION_MAGIC[fac] || { max: GUILD_MAX }).max;
const schoolWeight = (fac, sc) => ((FACTION_MAGIC[fac] || {}).w || {})[sc] || 1;
// Opis magii frakcji: „gildia do poziomu IV, najczęściej magia Powietrza i Wody”
function magicText(fac) {
  const w = (FACTION_MAGIC[fac] || {}).w || {}, top = Math.max(...Object.values(w)), best = Object.keys(SCHOOLS).filter(sc => w[sc] === top && top > 1);
  return `gildia magów do poziomu ${['', 'I', 'II', 'III', 'IV', 'V'][guildMax(fac)]}${best.length ? `, najczęściej magia ${best.map(sc => SCHOOLS[sc].name).join(' i ')}` : ''}`;
}
// Czar startowy klas magicznych
const CLASS_SPELLS = { cleric: ['bless'], druid: ['cure'], necro: ['magicArrow'], witch: ['slow'], heretic: ['magicArrow'], alchemist: ['stoneSkin'], wizard: ['haste'], warlock: ['magicArrow'], battleMage: ['bless'], inventor: ['magicArrow'] };


// ==================== DANE: OBIEKTY MAPY =================================================
// Miejsca na mapie (obiekt type: 'site', kind): bohater wchodzi na pole i dostaje nagrodę; obiekt zostaje.
// use: 'hero' raz na bohatera, 'day' raz dziennie na bohatera, 'heroWeek' raz w tygodniu na bohatera,
// 'week' raz w tygodniu dla całego świata (plon zbiera pierwszy), 'player' raz na gracza (potem bez skutku),
// 'free' bez limitu (skutek zależy od stanu obiektu: portal, siedlisko, ołtarz), 'once' jeden raz, potem obiekt znika.
// per = jeden obiekt na tyle pól mapy (co najmniej jeden), guard = pilnuje go potwór, ai = wartość celu dla SI.
// Spichlerz: premia do przyrostu miasta, które zaopatruje; wykopalisko: nagroda za dni kopania (indeks = dni); turniej: czempioni wg liczby wygranych
const GRANARY_PCT = 20, DIG_DAYS = 4, DIG_REWARD = [null, 'gold', 'treasure', 'minor', 'major'], DIG_GOLD = 1000;
const TOURNEY_CHAMPS = [[0, 'crusader'], [2, 'cavalier'], [4, 'champion']];
const SITES = {
  shrine: { name: 'Kapliczka magii', use: 'hero', per: 700, ai: 1500, desc: 'uczy czaru' },
  well: { name: 'Studnia', use: 'day', per: 900, ai: 400, desc: 'odnawia całą manę bohatera (raz dziennie)' },
  windmill: { name: 'Wiatrak', use: 'week', per: 1100, ai: 1200, desc: 'co tydzień 3–6 jednostek rzadkiego surowca dla pierwszego gościa' },
  waterMill: { name: 'Młyn wodny', use: 'week', per: 1100, ai: 1000, desc: 'co tydzień 1000 złota dla pierwszego gościa' },
  camp: { name: 'Obóz najemników', use: 'hero', per: 1600, ai: 3000, stat: 'att', guard: true, desc: '+1 do ataku bohatera' },
  post: { name: 'Posterunek rycerzy', use: 'hero', per: 1600, ai: 3000, stat: 'def', guard: true, desc: '+1 do obrony bohatera' },
  altar: { name: 'Ołtarz mocy', use: 'hero', per: 1600, ai: 2500, stat: 'sp', guard: true, desc: '+1 do mocy czarów bohatera' },
  library: { name: 'Stara biblioteka', use: 'hero', per: 1600, ai: 2500, stat: 'kn', guard: true, desc: '+1 do wiedzy bohatera' },
  stone: { name: 'Kamień wiedzy', use: 'hero', per: 1400, ai: 2500, guard: true, desc: '+1000 doświadczenia' },
  temple: { name: 'Świątynia', use: 'day', per: 1400, ai: 300, desc: '+1 do morale armii do końca następnej bitwy' },
  fountain: { name: 'Fontanna szczęścia', use: 'day', per: 1400, ai: 300, desc: '+1 do szczęścia do końca następnej bitwy' },
  stables: { name: 'Stajnie', use: 'heroWeek', per: 1400, ai: 700, desc: '+400 punktów ruchu na dziś (raz w tygodniu)' },
  lookout: { name: 'Wieża obserwacyjna', use: 'player', per: 1600, ai: 500, desc: 'odsłania okolicę w promieniu 12 pól' },
  obelisk: { name: 'Obelisk', use: 'player', per: 0, ai: 1800, desc: 'odsłania fragment mapy zagadki, która prowadzi do Graala' },
  witchHut: { name: 'Chata wiedźmy', use: 'hero', per: 1500, ai: 2200, desc: 'uczy umiejętności' },
  prison: { name: 'Więzienie', use: 'once', per: 3500, ai: 5000, guard: true, desc: 'uwolniony bohater z doświadczeniem przyłącza się do ciebie' },
  dwelling: { name: 'Siedlisko najemników', use: 'free', per: 1500, ai: 1500, desc: 'co tydzień przybywają stwory do werbunku' },
  sacrifice: { name: 'Ołtarz ofiarny', use: 'free', per: 2500, ai: 0, desc: 'artefakty z plecaka zamienia na doświadczenie' },
  portal: { name: 'Portal', use: 'free', per: 0, ai: 0, desc: 'przenosi bohatera do drugiego portalu z pary' },
  gate: { name: 'Brama podziemi', use: 'free', per: 0, ai: 600, desc: 'schody prowadzące między powierzchnią a podziemiami' },
  wreck: { name: 'Wrak statku', use: 'once', per: 0, ai: 1600, desc: 'zatopiony ładunek: złoto, czasem artefakt (dostępny łodzią)' },
  arena: { name: 'Arena', use: 'hero', per: 2400, ai: 3500, guard: true, desc: '+2 do ataku albo +2 do obrony bohatera (do wyboru)' },
  school: { name: 'Szkoła magii', use: 'hero', per: 2600, ai: 2200, cost: 1000, desc: 'za 1000 złota +1 do mocy czarów albo do wiedzy (do wyboru)' },
  tree: { name: 'Drzewo wiedzy', use: 'hero', per: 3200, ai: 4000, guard: true, desc: 'bohater od razu awansuje o jeden poziom' },
  market: { name: 'Targowisko', use: 'free', per: 2800, ai: 0, desc: 'wymiana surowców jak na rynku w mieście (kurs jak przy dwóch rynkach)' },
  garden: { name: 'Magiczny ogród', use: 'week', per: 1600, ai: 900, desc: 'co tydzień 5 klejnotów albo 500 złota dla pierwszego gościa' },
  campfire: { name: 'Ognisko', use: 'once', per: 1000, ai: 900, desc: 'porzucony obóz: 400–600 złota i 4–6 jednostek surowca (jednorazowo)' },
  oasis: { name: 'Oaza', use: 'day', per: 1800, ai: 600, terr: 'SAND', desc: '+1 do morale do następnej bitwy i +300 punktów ruchu (raz dziennie)' },
  graveyard: { name: 'Stary cmentarz', use: 'once', per: 2600, ai: 2200, guard: true, desc: 'zakopane skarby: 1000–2000 złota i artefakt (jednorazowo, pilnują go umarli)' },
  magicSpring: { name: 'Magiczne źródło', use: 'day', per: 2800, ai: 800, desc: 'napełnia manę bohatera do dwukrotności zwykłego maksimum (raz dziennie)' },
  buoy: { name: 'Boja', use: 'day', per: 0, wper: 900, ai: 300, desc: '+1 do morale do następnej bitwy (raz dziennie, dostępna łodzią)' },
  flotsam: { name: 'Dryfujące szczątki', use: 'once', per: 0, wper: 700, ai: 700, desc: 'ładunek z rozbitego statku: drewno albo złoto (jednorazowo, dostępne łodzią)' },
  sirens: { name: 'Skała syren', use: 'hero', per: 0, wper: 1400, ai: 1200, desc: 'śpiew syren: +1500 doświadczenia, ale co dziesiąty żołnierz rzuca się w fale (raz na bohatera, dostępna łodzią)' },
  mushroomRing: { name: 'Grzybowy krąg', use: 'day', per: 2200, ai: 300, ug: true, desc: '+1 do szczęścia do następnej bitwy (raz dziennie)' },
  crystalCave: { name: 'Kryształowa grota', use: 'week', per: 2400, ai: 1000, ug: true, desc: 'co tydzień 3–5 kryształów dla pierwszego gościa' },
  dwarfForge: { name: 'Kuźnia krasnoludów', use: 'once', per: 3200, ai: 1500, ug: true, guard: true, cost: 2500, desc: 'za 2500 złota i 5 rudy krasnoludy wykuwają artefakt (raz na całą grę, pilnuje jej strażnik)' },
  hillFort: { name: 'Fort na wzgórzu', use: 'free', per: 3000, ai: 0, desc: 'kowale ulepszają stwory w armii bohatera za różnicę w cenie' },
  whirlpool: { name: 'Wir', use: 'free', per: 0, ai: 0, desc: 'wciąga łódź i wyrzuca ją przy drugim wirze z pary; morze zabiera połowę najsłabszego oddziału' },
  lighthouse: { name: 'Latarnia morska', use: 'free', per: 0, ai: 1200, desc: 'właściciel: każdy jego bohater w łodzi płynie dalej (+400 punktów ruchu na morzu)' },
  // miejsca przygody: zagadka, zadanie, plotki, klątwa za skarb, kupcy, hazard (opisy i nazwy własne w siteInfo)
  sphinx: { name: 'Sfinks', use: 'hero', per: 4200, ai: 1800, desc: 'zadaje zagadkę: dobra odpowiedź to 2000 doświadczenia i 1500 złota, zła – milczenie (raz na bohatera)' },
  questHut: { name: 'Chata pustelnika', use: 'free', per: 3600, ai: 0, desc: 'pustelnik prosi o pokonanie groźnych stworów w okolicy; za to daje artefakt i 1500 doświadczenia' },
  inn: { name: 'Karczma', use: 'heroWeek', per: 3000, ai: 900, desc: 'kufel dla wojska (+1 do morale do następnej bitwy) i plotka: gdzie w okolicy czeka coś cennego (raz w tygodniu)' },
  barrow: { name: 'Kurhan', use: 'free', per: 3800, ai: 0, desc: 'grób dawnego wodza z artefaktem; kto go rozkopie, ten ściąga na armię klątwę (morale −3 do następnej bitwy)' },
  caravanserai: { name: 'Karawanseraj', use: 'free', per: 3800, ai: 0, desc: 'kupcy z dalekich krain sprzedają raz w miesiącu jeden artefakt' },
  pandora: { name: 'Puszka Pandory', use: 'free', per: 2600, ai: 1600, desc: 'zamknięta szkatuła: w środku skarb, wiedza albo artefakt… a czasem potwory (otwiera się raz)' },
  keyTent: { name: 'Namiot klucznika', use: 'free', per: 0, ai: 5000, desc: 'klucznik daje przepustkę przez bramy graniczne swojego koloru (raz na gracza)' },
  borderGate: { name: 'Brama graniczna', use: 'free', per: 0, ai: 0, desc: 'zamyka drogę; przejdzie tylko ten, kto odwiedził namiot klucznika w tym samym kolorze' },
  wishingWell: { name: 'Studnia życzeń', use: 'heroWeek', per: 3000, ai: 0, cost: 500, desc: 'za 500 złota życzenie: szczęście, złoto, rzadko artefakt (tylko jeden na studnię)… albo nic (raz w tygodniu)' },
  // spichlerz do przejęcia (jeden przy każdym mieście), wykopalisko (kilka dni kopania), turniej rycerski (co tydzień silniejszy czempion)
  granary: { name: 'Spichlerz', use: 'free', per: 0, ai: 1500, desc: `zaopatruje najbliższe miasto: gdy należy ono do właściciela spichlerza, przyrost stworów w nim rośnie o ${GRANARY_PCT}% (co najmniej o 1 na siedlisko)` },
  excavation: { name: 'Wykopalisko', use: 'free', per: 3600, ai: 1000, desc: 'ruiny dawnej osady: każdy dzień kopania (cały ruch bohatera) przybliża do skarbu – po 1 dniu złoto, po 2 drobny artefakt, po 3 cenny, po 4 bardzo cenny (raz na grę)' },
  tournament: { name: 'Turniej rycerski', use: 'week', per: 4200, ai: 2500, desc: 'raz w tygodniu pojedynek z czempionem turnieju; po każdej jego porażce następny czempion jest silniejszy, a nagroda większa' },
};
// Morze: potwory na wodzie wg poziomu (piraci płyną statkiem, reszta to morskie stwory), wiry w parach wg rozmiaru mapy,
// latarnie (jedna na tyle pól wody) i dodatkowy ruch łodzi za każdą posiadaną latarnię
const SEA_MONSTERS = { 1: ['rusalka', 'rogue'], 2: ['rogue', 'lizardWarrior'], 3: ['siren', 'nomad', 'lizardSlayer'], 4: ['siren', 'sharpshooter'], 5: ['naga', 'sharpshooter'], 6: ['nagaQueen', 'nagaEmpress'], 7: ['kraken', 'hydra', 'chaosHydra', 'primeHydra'] };
const PIRATES = ['rogue', 'nomad', 'sharpshooter'], WHIRL_PAIRS = { S: 1, M: 1, L: 2, XL: 3, XXL: 4, G: 5 }, LIGHTHOUSE_PER = 1300, LIGHTHOUSE_MP = 400, SEA_MONSTER_PER = 380;
// Miejsca bez strażnika (drobne, przydrożne albo same są wyzwaniem); resztę pilnuje potwór obok (placeObjects)
const UNGUARDED_SITES = ['granary', 'excavation', 'tournament', 'well', 'stables', 'temple', 'fountain', 'market', 'inn', 'caravanserai', 'questHut', 'sphinx', 'oasis', 'mushroomRing', 'campfire', 'pandora', 'keyTent', 'borderGate'];
// Klucznicy i bramy graniczne (jak w H3): kolor bramy = kolor namiotu, którego odwiedziny otwierają ją graczowi na zawsze; liczba bram wg mapy
const KEY_COLORS = [{ id: 'azure', name: 'błękitny', f: 'błękitna', hex: '#3aa8f0' }, { id: 'green', name: 'zielony', f: 'zielona', hex: '#3ab040' }, { id: 'red', name: 'czerwony', f: 'czerwona', hex: '#e03a2a' }, { id: 'violet', name: 'fioletowy', f: 'fioletowa', hex: '#a04ae0' }];
const BORDER_GATES = { S: 1, M: 2, L: 2, XL: 3, XXL: 4, G: 4, B: 4 };
const keyColor = id => KEY_COLORS.find(c => c.id === id) || KEY_COLORS[0];
const hasGateKey = (st, owner, ob) => !!(st.players[owner] && (st.players[owner].keys || {})[ob.color]);
// Garnizony na drogach: drewniane forty z załogą na wąskich drogach między krainami (liczba wg mapy). Zdobyty fort należy do zwycięzcy:
// jego i sojuszników przepuszcza, obcych zatrzymuje; właściciel zostawia w nim wojsko (okno jak spotkanie bohaterów)
const OUTPOSTS = { S: 1, M: 2, L: 3, XL: 4, XXL: 5, G: 6, B: 6 };
const friendlyFort = (st, ob, owner) => ob.owner >= 0 && (ob.owner === owner || allied(st, ob.owner, owner));
// Zagadki sfinksa: [pytanie, dobra odpowiedź, zła, zła] (kolejność odpowiedzi w oknie losowa)
const RIDDLES = [
  ['Rano chodzi na czterech nogach, w południe na dwóch, a wieczorem na trzech. Co to?', 'Człowiek', 'Pies', 'Smok'],
  ['Im więcej z niej zabierasz, tym większa się staje.', 'Dziura', 'Góra', 'Rzeka'],
  ['Bez skrzydeł leci, bez oczu płacze.', 'Chmura', 'Ptak', 'Wiatr'],
  ['Należy do ciebie, a inni używają tego częściej niż ty.', 'Imię', 'Miecz', 'Koń'],
  ['Ma szyję, a nie ma głowy; ma ramiona, a nie ma rąk.', 'Koszula', 'Rycerz', 'Drzewo'],
  ['Łamiesz ją, gdy tylko wypowiesz jej imię.', 'Cisza', 'Przysięga', 'Szklanka'],
  ['Rośnie, choć nie żyje; potrzebuje powietrza, a woda ją zabija.', 'Ogień', 'Drzewo', 'Lód'],
  ['Nie ma początku ani końca, a lśni na palcu króla.', 'Pierścień', 'Korona', 'Berło'],
  ['Ma oko, a nie widzi.', 'Igła', 'Sowa', 'Sokół'],
  ['Ma zęby, a nie gryzie.', 'Grzebień', 'Wilk', 'Smok'],
  ['Im dłużej suszy, tym bardziej jest mokry.', 'Ręcznik', 'Piasek', 'Słońce'],
  ['Przechodzi przez szybę, a jej nie tłucze.', 'Światło', 'Duch', 'Strzała'],
  ['Ma koryto, a nie je; ma brzegi, a nie jest misą.', 'Rzeka', 'Koryto', 'Dolina'],
  ['Biegnie bez nóg, a kto go goni, nigdy nie dogoni.', 'Czas', 'Zając', 'Wiatr'],
];
// Nazwy własne miejsc przygody (ob.title, losowane przy tworzeniu świata)
const INN_NAMES = ['Pod Złotym Gryfem', 'Pod Pijanym Smokiem', 'Pod Kulawym Koniem', 'Pod Srebrnym Dzbanem', 'Pod Wesołym Trollem', 'Na Rozstajach', 'Pod Trzema Koronami', 'Pod Śpiącym Rycerzem', 'Pod Czarnym Kotem', 'Pod Dzikim Wieprzem'];
const BARROW_NAMES = ['Wojmira', 'Bolesława Srogiego', 'Jarogniewa', 'Świętomira', 'Dobrogosta', 'Mieszka Jednookiego', 'Gniewomira', 'Racibora', 'Zbyluta Żelaznego', 'Krzesimira'];
const HERMIT_NAMES = ['Bogumił', 'Sędziwój', 'Radost', 'Mszczuj', 'Ostoja', 'Lubomir', 'Wszebor', 'Ciechosław'];
// Karawanseraj: cena artefaktu wg rzadkości; zadanie pustelnika: doświadczenie w nagrodę
const BAZAAR_PRICE = { treasure: 2500, minor: 5000, major: 9000 }, QUEST_EXP = 1500, WISH_MORALE = 1, BARROW_CURSE = -3;
// Nowe miejsca: portale w parach (PORTAL_PAIRS wg rozmiaru mapy), wraki na wodzie (jeden na WRECK_PER pól wody),
// siedlisko: tygodniowy przyrost stworów (DWELL_WEEKS tygodni zapasu), ołtarz: doświadczenie za artefakt wg rzadkości.
const PORTAL_PAIRS = { S: 1, M: 1, L: 2, XL: 3, XXL: 4, G: 5 }, WRECK_PER = 700, DWELL_WEEKS = 3;
const SACRIFICE_EXP = { treasure: 800, minor: 2000, major: 4500, relic: 15000 };
// Graal (jak w Heroes 3): zakopany na mapie; obeliski odsłaniają kolejne kawałki mapy zagadki (PUZZLE_COLS × PUZZLE_ROWS
// kawałków, wycinek PUZZLE_W × PUZZLE_H pól wokół Graala). Kopać można z pełnymi punktami ruchu (zużywa wszystkie).
// Bohater z Graalem wchodzi do własnego miasta i buduje tam budowlę Graala: +GRAIL_GOLD złota dziennie i +50% przyrostu.
const OBELISKS = { S: 3, M: 5, L: 7, XL: 9, XXL: 11, G: 13 }, GRAIL_GOLD = 5000, GRAIL_GROWTH = 0.5;
const PUZZLE_COLS = 8, PUZZLE_ROWS = 6, PUZZLE_W = 16, PUZZLE_H = 12;
const SITE_EXP = 1000, SITE_MP = 400, LOOKOUT_R = 12;
// Skarbce (obiekt type: 'bank', kind): silna załoga z kilku oddziałów, po zwycięstwie jednorazowy łup, potem obiekt stoi pusty.
// guards: [stwór, liczba] (liczby rosną z poziomem trudności), loot: surowce, arts: artefakty [rzadkość, ile], units: stwory dołączają do armii.
// per = jeden na tyle pól mapy, min = najmniej na każdej mapie, dd = najmniejsza odległość od startu (0–1, jak siła potworów).
const BANKS = {
  crypt: { name: 'Krypta', per: 1300, min: 1, dd: 0.15, guards: [['skeleton', 24], ['ghoul', 12], ['wraith', 5]],
    loot: { gold: 2500 }, arts: [['treasure', 1]], desc: 'nieumarli strzegą grobowych skarbów' },
  orcFort: { name: 'Orcza warownia', per: 1900, min: 1, dd: 0.25, guards: [['orc', 22], ['troll', 5], ['ogre', 4]],
    loot: { gold: 4000, wood: 10, ore: 10 }, desc: 'orkowie i trolle pilnują łupów z wypraw' },
  griffinNest: { name: 'Gniazdo gryfów', per: 2600, min: 0, dd: 0.35, guards: [['griffin', 22], ['royalGriffin', 10]],
    loot: { gold: 3000 }, units: ['champion', 3], desc: 'gryfy bronią gniazd; w podziemiach czekają uwięzieni czempioni' },
  hydraLair: { name: 'Leże hydr', per: 3600, min: 0, dd: 0.5, guards: [['hydra', 5], ['basilisk', 12], ['gorgon', 6]],
    loot: { gold: 8000, mercury: 5, sulfur: 5, crystal: 5, gems: 5 }, arts: [['minor', 1]], desc: 'hydry z bagien strzegą zatopionych skarbów' },
  pyramid: { name: 'Piramida', per: 4200, min: 0, dd: 0.5, terr: 'SAND', guards: [['mummy', 30], ['nomad', 12], ['goldGolem', 4]],
    loot: { gold: 6000 }, arts: [['major', 1]], desc: 'mumie i koczownicy strzegą grobowca dawnego króla pustyni' },
  banditHideout: { name: 'Kryjówka zbójców', per: 2200, min: 0, dd: 0.2, guards: [['rogue', 30], ['nomad', 14], ['sharpshooter', 6]],
    loot: { gold: 5000, wood: 8, ore: 8 }, desc: 'zbójcy chowają tu łupy z napadów na kupców' },
  golemWorks: { name: 'Warsztat golemów', per: 3200, min: 0, dd: 0.4, ug: true, guards: [['stoneGolem', 16], ['ironGolem', 10], ['goldGolem', 4], ['diamondGolem', 2]],
    loot: { gold: 4000, mercury: 10 }, units: ['ironGolem', 6], desc: 'golemy pilnują pracowni magów; uruchomione golemy przyłączą się do zwycięzcy' },
  dragonUtopia: { name: 'Smocza Utopia', per: 6000, min: 1, dd: 0.6, guards: [['emeraldDragon', 4], ['jadeDragon', 2], ['ghostWyvern', 3], ['archDevil', 2], ['chaosHydra', 1]],
    loot: { gold: 20000 }, arts: [['major', 2], ['minor', 1]], desc: 'legowisko smoków: ogromne skarby dla najsilniejszych armii' },
};
// Siła potworów na mapie tuż przy starcie gracza (liczebność = siła / wartość stwora), rośnie z odległością (placeObjects)
const MONSTER_POWER = 700;
// Potwory na mapie rosną co tydzień o tyle (część ułamkowa w górę), do MONSTER_GROW_MAX razy stanu początkowego
const MONSTER_GROW = 0.08, MONSTER_GROW_MAX = 3;
const bankGuards = (kind, diff) => BANKS[kind].guards.map(([cid, n]) => [cid, Math.max(1, Math.round(n * (0.6 + 0.4 * DIFFICULTIES[diff].rating / 100)))]);
