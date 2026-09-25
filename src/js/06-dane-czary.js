// ==================== DANE: CZARY =======================================================
// kind: 'battle' (w bitwie, raz na rundę) albo 'adv' (na mapie). target: 'enemy', 'ally', 'undeadAlly', 'hex', 'none'.
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
};
const BUFF_NAMES = { bless: 'błogosławieństwo', stoneSkin: 'kamienna skóra', haste: 'przyspieszenie', slow: 'spowolnienie', weakness: 'osłabienie', bloodlust: 'żądza krwi' };
const BAD_BUFFS = ['slow', 'weakness'];
// Ile czarów danego poziomu oferuje gildia
const GUILD_OFFER = { 1: 3, 2: 2, 3: 2 };
// Czar startowy klas magicznych
const CLASS_SPELLS = { cleric: ['bless'], druid: ['cure'], necro: ['magicArrow'] };

