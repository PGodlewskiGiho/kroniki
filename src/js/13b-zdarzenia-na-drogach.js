// ==================== ZDARZENIA NA DROGACH ===============================================
// Ukryte pola na drogach (st.events, poza st.objects: niewidoczne, nie blokują drogi): pierwszy bohater, który na nie wejdzie,
// trafia na krótką scenkę z wyborem. Człowiek wybiera w oknie, komputer bierze pierwszą korzystną opcję. Każde zdarzenie raz.
// opts: label, ok (czy można wybrać), act(st, h, rnd) -> tekst wyniku; rnd: powtarzalna losowość zdarzenia
const ROAD_EVENTS = {
  wanderer: { title: 'Ranny wędrowiec', text: 'Przy drodze leży ranny wędrowiec i słabym głosem prosi o pomoc.', opts: [
    { label: 'Opatrz go', act: (st, h) => { gainExp(st, h, 400); reveal(st, h.x, h.y, 9, h.owner); MapRender.miniDirty = true; return 'Wędrowiec dochodzi do siebie i w podzięce opowiada o okolicy: mapa wokół odsłania się, a bohater zyskuje 400 doświadczenia.'; } },
    { label: 'Okradnij', act: (st, h) => { playerOf(st, h.owner).resources.gold += 400; return 'Sakiewka wędrowca jest lekka: 400 złota. Wojsko patrzy na to krzywo, ale milczy.'; } },
    { label: 'Odjedź', act: () => 'Armia rusza dalej, zostawiając wędrowca jego losowi.' }] },
  cart: { title: 'Porzucony wóz', text: 'W rowie leży przewrócony wóz kupiecki. Woźnicy ani koni nigdzie nie widać.', opts: [
    { label: 'Przeszukaj', act: (st, h, r) => { const R = playerOf(st, h.owner).resources, rare = RARE[Math.floor(r() * RARE.length)], w = r() < 0.5 ? 'wood' : 'ore'; R[w] += 5; R[rare] += 2; return `Pod plandeką leżą zapasy: 5 × ${resName(w).toLowerCase()} i 2 × ${resName(rare).toLowerCase()}.`; } },
    { label: 'Zostaw', act: () => 'Lepiej nie ruszać cudzego dobytku.' }] },
  seer: { title: 'Wróżbitka', text: 'Stara kobieta przy ognisku obiecuje odczytać przyszłość bohatera – za 500 złota.', opts: [
    { label: 'Zapłać 500 złota', ok: (st, h) => playerOf(st, h.owner).resources.gold >= 500, act: (st, h, r) => { playerOf(st, h.owner).resources.gold -= 500; const P = PRIMARY[Math.floor(r() * 4)]; h.stats[P.id]++; return `Wróżba się spełnia: ${h.name} czuje nową siłę (+1 do ${P.gen}).`; } },
    { label: 'Odejdź', act: () => 'Przyszłość może poczekać.' }] },
  deserters: { title: 'Dezerterzy', text: 'Grupa żołnierzy, którzy porzucili służbę u innego pana, prosi o przyjęcie do armii.', opts: [
    { label: 'Przyjmij ich', ok: (st, h) => !!desertersFor(st, h), act: (st, h, r) => { const D = desertersFor(st, h), n = 4 + Math.floor(r() * 5) + (st.week + 4 * (st.month - 1)) * 2; const i = h.army.findIndex(s => s && s.cid === D); if (i >= 0) h.army[i].n += n; else h.army[h.army.indexOf(null)] = { cid: D, n }; return `Do armii dołącza ${n} ${CREATURES[D].gen}.`; } },
    { label: 'Odpraw', act: () => 'Kto raz zdradził, zdradzi znowu.' }] },
  sage: { title: 'Stary mędrzec', text: 'Pod przydrożnym dębem siedzi starzec. Mówi, że nauczy czegoś każdego, kto poświęci mu resztę dnia.', opts: [
    { label: 'Posłuchaj (koniec ruchu na dziś)', act: (st, h, r) => { const id = r() < 0.5 ? 'kn' : 'sp'; h.stats[id]++; h.mp = 0; h.path = null; return `Długa rozmowa przy ogniu: +1 do ${id === 'kn' ? 'wiedzy' : 'mocy czarów'}. Na dziś koniec marszu.`; } },
    { label: 'Jedź dalej', act: () => 'Nie ma czasu na opowieści.' }] },
  ruins: { title: 'Ruiny strażnicy', text: 'Przy drodze sterczą resztki starej strażnicy. Pod gruzami może coś leżeć – albo nic.', opts: [
    { label: 'Przeszukaj', act: (st, h, r) => { if (r() < 0.6) { const g = 800 + Math.floor(r() * 8) * 100; playerOf(st, h.owner).resources.gold += g; return `W zawalonej piwnicy stoi kufer: ${g} złota.`; } h.mp = Math.max(0, h.mp - 300); return 'Godziny kopania w gruzach na nic: tylko kurz i potłuczone garnki (-300 punktów ruchu).'; } },
    { label: 'Omiń', act: () => 'Ruiny zostają za plecami.' }] },
  merchants: { title: 'Wędrowni kupcy', text: 'Na rozstaju dróg rozbili się kupcy z wozami pełnymi towaru.', opts: [
    { label: 'Kup zapasy (300 złota)', ok: (st, h) => playerOf(st, h.owner).resources.gold >= 300, act: (st, h) => { playerOf(st, h.owner).resources.gold -= 300; h.mp += 600; return 'Świeży prowiant i podkowy: armia maszeruje dziś dalej (+600 punktów ruchu).'; } },
    { label: 'Sprzedaj 5 drewna (500 złota)', ok: (st, h) => playerOf(st, h.owner).resources.wood >= 5, act: (st, h) => { const R = playerOf(st, h.owner).resources; R.wood -= 5; R.gold += 500; return 'Kupcy płacą uczciwie: 500 złota za 5 drewna.'; } },
    { label: 'Jedź dalej', act: () => 'Kupcy machają na pożegnanie.' }] },
  altar: { title: 'Zapomniany ołtarz', text: 'W zaroślach stoi omszały ołtarz dawnego boga. Na kamieniu widać ślady ofiar z klejnotów.', opts: [
    { label: 'Złóż ofiarę (2 klejnoty)', ok: (st, h) => playerOf(st, h.owner).resources.gems >= 2, act: (st, h) => { playerOf(st, h.owner).resources.gems -= 2; h.mana = Math.max(h.mana, heroMaxMana(h)); gainExp(st, h, 600); return 'Kamień rozbłyska: pełna mana i 600 doświadczenia.'; } },
    { label: 'Odejdź', act: () => 'Lepiej nie budzić starych bogów.' }] },
};
// Dezerterzy: stwory 1. albo 2. poziomu frakcji gracza, gdy jest dla nich miejsce w armii
function desertersFor(st, h) {
  const F = factionOf(playerOf(st, h.owner).faction), cid = (F.dw[st.week % 2 ? 'dw2' : 'dw1'] || F.dw.dw1)[1];
  return h.army.some(s => s && s.cid === cid) || h.army.includes(null) ? cid : null;
}
// Rozmieszczenie: pola dróg z dala od startów, bez obiektów i strażników; mniej więcej jedno na 550 pól lądu
function placeEvents(st) {
  const map = st.map, n = map.n, rng = mulberry32(st.seed ^ 0xe7e7), kinds = Object.keys(ROAD_EVENTS), ev = [];
  const want = Math.round((map.ln ? map.ln * map.ln * 2 : n * n) / 550), starts = map.sites;
  for (let t = 0; t < want * 60 && ev.length < want; t++) {
    const x = 1 + Math.floor(rng() * (n - 2)), y = 1 + Math.floor(rng() * (n - 2)), i = y * n + x;
    if (!map.road[i] || st.objAt[i] || st.guard[i] || starts.some(s => Math.hypot(s.x - x, s.y - y) < 6) || ev.some(e => Math.hypot(e.x - x, e.y - y) < 8)) continue;
    ev.push({ kind: kinds[Math.floor(rng() * kinds.length)], x, y });
  }
  return ev;
}
const eventAt = (st, i) => (st.evAt && st.evAt[i] ? st.events[st.evAt[i] - 1] : null);
// Zdarzenie: okno z wyborem (człowiek przy swoim ekranie) albo od razu pierwsza możliwa opcja inna niż odejście (komputer)
function runEvent(st, h, ev) {
  const E = ROAD_EVENTS[ev.kind]; if (!E || ev.done) return; ev.done = true; rebuildObjIndex(st);
  const rnd = mulberry32((st.seed ^ (ev.x * 7919 + ev.y * 104729)) >>> 0), opts = E.opts.filter(o => !o.ok || o.ok(st, h));
  const human = playerOf(st, h.owner).human && !(G.screens.adventure && G.screens.adventure.aiRun);
  if (!human) { const o = opts.find((o, k) => k < opts.length - 1) || opts[0]; o.act(st, h, rnd); return; }
  Sfx.play('page', { vol: 0.5 });
  showDialog(`${E.title}. ${E.text}`, E.opts.map((o, k) => {
    const can = !o.ok || o.ok(st, h);
    return { label: o.label, key: k === E.opts.length - 1 ? 'escape' : String(k + 1), disabled: !can, tip: can ? null : 'Nie stać cię na to.', action: () => { if (!can) return; const msg = o.act(st, h, rnd); G.screens.adventure.layout(true); showDialog(msg, [{ label: 'OK', key: 'enter' }]); } };
  }), { locked: true, bw: 170 });
}
