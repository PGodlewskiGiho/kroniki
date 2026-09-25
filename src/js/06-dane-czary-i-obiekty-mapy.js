// ==================== DANE: CZARY =======================================================
// kind: 'battle' (w bitwie, raz na rundę) albo 'adv' (na mapie). target: 'enemy', 'ally', 'undeadAlly', 'livingAlly' (także poległy),
// 'hex' (pole i sąsiedzi), 'all' (wszystkie oddziały na polu bitwy), 'allies' (wszyscy swoi), 'none' (czar mapy).
// sp = moc czarów bohatera; efekty liczą funkcje w polach dmg/heal/rounds, opis w desc(sp).
const SPELL_ROUNDS = sp => Math.max(1, sp + 1);
const SPELLS = {
  magicArrow: { name: 'Magiczna strzała', level: 1, cost: 5, kind: 'battle', target: 'enemy', col: '#8ac0ff', dmg: sp => 10 + 10 * sp, desc: sp => `${10 + 10 * sp} obrażeń jednemu wrogowi` },
  bless: { name: 'Błogosławieństwo', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#ffe08a', buff: 'bless', desc: sp => `sojusznik zadaje najwyższe obrażenia przez ${SPELL_ROUNDS(sp)} rund` },
  stoneSkin: { name: 'Kamienna skóra', level: 1, cost: 5, kind: 'battle', target: 'ally', col: '#b8a888', buff: 'stoneSkin', desc: sp => `+3 do obrony sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  haste: { name: 'Przyspieszenie', level: 1, cost: 6, kind: 'battle', target: 'ally', col: '#a8f0ff', buff: 'haste', desc: sp => `+3 do szybkości sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  cure: { name: 'Uzdrowienie', level: 1, cost: 6, kind: 'battle', target: 'ally', col: '#8af07a', heal: sp => 10 + 5 * sp, desc: sp => `leczy ${10 + 5 * sp} życia i zdejmuje złe czary` },
  slow: { name: 'Spowolnienie', level: 1, cost: 6, kind: 'battle', target: 'enemy', col: '#9a8ac8', buff: 'slow', desc: sp => `−3 do szybkości wroga przez ${SPELL_ROUNDS(sp)} rund` },
  eagleEye: { name: 'Sokole oko', level: 1, cost: 4, kind: 'adv', target: 'none', col: '#f0c040', desc: sp => `odsłania mapę w promieniu ${5 + sp} pól wokół bohatera` },
  lightningBolt: { name: 'Błyskawica', level: 2, cost: 10, kind: 'battle', target: 'enemy', col: '#c8e0ff', dmg: sp => 25 + 20 * sp, desc: sp => `${25 + 20 * sp} obrażeń jednemu wrogowi` },
  weakness: { name: 'Osłabienie', level: 2, cost: 8, kind: 'battle', target: 'enemy', col: '#a8a878', buff: 'weakness', desc: sp => `−3 do ataku wroga przez ${SPELL_ROUNDS(sp)} rund` },
  bloodlust: { name: 'Żądza krwi', level: 2, cost: 7, kind: 'battle', target: 'ally', col: '#ff6a5a', buff: 'bloodlust', desc: sp => `+3 do ataku sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  fireball: { name: 'Kula ognia', level: 3, cost: 15, kind: 'battle', target: 'hex', col: '#ff8a2a', dmg: sp => 15 + 10 * sp, desc: sp => `${15 + 10 * sp} obrażeń na polu i wokół niego (także swoim!)` },
  animateDead: { name: 'Ożywienie umarłych', level: 3, cost: 15, kind: 'battle', target: 'undeadAlly', col: '#a6f0a8', heal: sp => 30 + 50 * sp, raise: true, desc: sp => `przywraca ${30 + 50 * sp} życia nieumarłym, także poległym w tej bitwie` },
  townPortal: { name: 'Powrót do miasta', level: 3, cost: 16, kind: 'adv', target: 'none', col: '#c8a0ff', desc: () => 'przenosi bohatera do najbliższego własnego miasta (kosztuje 300 punktów ruchu)' },
  meteorShower: { name: 'Deszcz meteorów', level: 4, cost: 16, kind: 'battle', target: 'hex', col: '#ff6a3a', dmg: sp => 25 + 25 * sp, desc: sp => `${25 + 25 * sp} obrażeń na polu i wokół niego (także swoim!)` },
  prayer: { name: 'Modlitwa', level: 4, cost: 16, kind: 'battle', target: 'ally', col: '#fff0b0', buff: 'prayer', desc: sp => `+2 do ataku, obrony i szybkości sojusznika przez ${SPELL_ROUNDS(sp)} rund` },
  resurrection: { name: 'Wskrzeszenie', level: 4, cost: 20, kind: 'battle', target: 'livingAlly', col: '#fff8d0', heal: sp => 40 + 20 * sp, raise: true, desc: sp => `przywraca ${40 + 20 * sp} życia żywym sojusznikom, także poległym w tej bitwie` },
  implosion: { name: 'Implozja', level: 5, cost: 30, kind: 'battle', target: 'enemy', col: '#c05aff', dmg: sp => 100 + 75 * sp, desc: sp => `${100 + 75 * sp} obrażeń jednemu wrogowi` },
  armageddon: { name: 'Armagedon', level: 5, cost: 24, kind: 'battle', target: 'all', col: '#ff4a1a', dmg: sp => 30 + 50 * sp, desc: sp => `${30 + 50 * sp} obrażeń każdemu oddziałowi na polu bitwy, także swoim` },
  massHaste: { name: 'Przyspieszenie armii', level: 5, cost: 20, kind: 'battle', target: 'allies', col: '#a8f0ff', buff: 'haste', desc: sp => `+3 do szybkości wszystkich sojuszników przez ${SPELL_ROUNDS(sp)} rund` },
};
const BUFF_NAMES = { bless: 'błogosławieństwo', stoneSkin: 'kamienna skóra', haste: 'przyspieszenie', slow: 'spowolnienie', weakness: 'osłabienie', bloodlust: 'żądza krwi', prayer: 'modlitwa' };
const BAD_BUFFS = ['slow', 'weakness'];
// Ile czarów danego poziomu oferuje gildia
const GUILD_OFFER = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 1 };
const GUILD_MAX = 5;
// Czar startowy klas magicznych
const CLASS_SPELLS = { cleric: ['bless'], druid: ['cure'], necro: ['magicArrow'], witch: ['slow'], heretic: ['magicArrow'] };


// ==================== DANE: OBIEKTY MAPY =================================================
// Miejsca na mapie (obiekt type: 'site', kind): bohater wchodzi na pole i dostaje nagrodę; obiekt zostaje.
// use: 'hero' raz na bohatera, 'day' raz dziennie na bohatera, 'heroWeek' raz w tygodniu na bohatera,
// 'week' raz w tygodniu dla całego świata (plon zbiera pierwszy), 'player' raz na gracza (potem bez skutku).
// per = jeden obiekt na tyle pól mapy (co najmniej jeden), guard = pilnuje go potwór, ai = wartość celu dla SI.
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
};
const SITE_EXP = 1000, SITE_MP = 400, LOOKOUT_R = 12;
