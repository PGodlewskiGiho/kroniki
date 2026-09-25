// ==================== GRAFIKA: SKARBCE ====================================================
// Skarbce (BANKS) na mapie: 2×2 pola jak kopalnia, (0,0) = lewy górny róg, ziemia na y ≈ 58, wejście w prawym dolnym polu.
// Styl jak ruda i góry: bryły ze ściankami jasną i ciemną. Splądrowany skarbiec jest ciemniejszy i bez skarbów.
function drawBank(ctx, kind, cleared) {
  const C = c => (cleared ? DK(c, 0.3) : c), P = (pts, c) => fillPoly(ctx, pts, C(c));
  const rock = (x, y, w, h, c) => { P([[x, y + h], [x + w * 0.15, y + h * 0.3], [x + w * 0.45, y], [x + w * 0.8, y + h * 0.25], [x + w, y + h]], c); P([[x, y + h], [x + w * 0.15, y + h * 0.3], [x + w * 0.45, y], [x + w * 0.4, y + h * 0.55], [x + w * 0.3, y + h]], LT(c, 0.18)); };
  const gold = (x, y, s) => { if (cleared) return; P([[x - 7 * s, y], [x - 3 * s, y - 5 * s], [x + 3 * s, y - 6 * s], [x + 8 * s, y]], '#e0b030'); P([[x - 3 * s, y - 5 * s], [x + 3 * s, y - 6 * s], [x + 1 * s, y - 2 * s]], '#fff0a0'); circ(ctx, x + 5 * s, y - 2 * s, 1.6 * s, '#f8e070'); };
  const door = (x, y, w, h) => { ctx.fillStyle = '#140c08'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill(); };
  oval(ctx, 34, 58, 31, 7, '#00000055');
  if (kind === 'crypt') { // grobowiec z kolumnami i trójkątnym szczytem, nagrobki
    for (const [x, h] of [[6, 12], [14, 9]]) { P([[x, 58], [x, 58 - h], [x + 3, 55 - h], [x + 6, 58 - h], [x + 6, 58]], '#8a8a86'); P([[x, 58], [x, 58 - h], [x + 3, 55 - h], [x + 3, 58]], '#a6a6a0'); }
    P([[24, 58], [24, 26], [62, 26], [62, 58]], '#7a7872'); P([[24, 58], [24, 26], [34, 26], [34, 58]], '#96948c');
    P([[20, 27], [43, 8], [66, 27]], '#5a5854'); P([[20, 27], [43, 8], [43, 27]], '#76746e');
    for (const x of [27, 55]) P([[x, 58], [x, 30], [x + 4, 30], [x + 4, 58]], '#b0aea6');
    door(37, 34, 12, 24); P([[41.5, 13], [44.5, 13], [44.5, 22], [41.5, 22]], '#d8d4c8'); P([[39, 16], [47, 16], [47, 18.5], [39, 18.5]], '#d8d4c8');
    if (!cleared) { circ(ctx, 43, 44, 1.6, '#7ae0c0'); circ(ctx, 43, 44, 0.8, '#e8fff8'); }
  } else if (kind === 'orcFort') { // częstokół z zaostrzonych pali przed chatą ze skór, wieża strażnicza, czaszka na tyczce, proporzec
    P([[14, 34], [26, 12], [44, 12], [54, 34]], '#7a5a3a'); P([[14, 34], [26, 12], [32, 12], [26, 34]], '#9a7448'); // dach z futer
    P([[46, 58], [46, 16], [62, 16], [62, 58]], '#5a3a1e'); P([[46, 58], [46, 16], [51, 16], [51, 58]], '#7a5430'); // wieża
    P([[43, 17], [65, 17], [65, 12], [43, 12]], '#8a6238'); P([[44, 12], [54, 3], [64, 12]], '#a8402a'); P([[44, 12], [54, 3], [54, 12]], '#c85a3a');
    for (let i = 0; i < 9; i++) { const x = 2 + i * 5, h = 20 + (i % 3) * 3; P([[x, 58], [x, 58 - h], [x + 2, 55 - h], [x + 4, 58 - h], [x + 4, 58]], i % 2 ? '#8a6034' : '#b08048'); P([[x + 4, 58], [x + 4, 58 - h], [x + 5, 58 - h], [x + 5, 58]], '#3a2410'); }
    P([[18, 58], [18, 46], [28, 46], [28, 58]], '#1a100a'); limb(ctx, 16, 46, 30, 46, 1.4, C('#5a3a1a'));
    limb(ctx, 40, 58, 40, 24, 1.6, C('#5a3a1a')); circ(ctx, 40, 22, 3.4, C('#e8e0c8')); circ(ctx, 38.8, 21.6, 0.9, '#1a1008'); circ(ctx, 41.2, 21.6, 0.9, '#1a1008');
    limb(ctx, 54, 3, 54, -8, 1.2, C('#4a3018')); P([[54, -8], [66, -5], [54, -2]], '#c82a1a');
    gold(58, 58, 0.8);
  } else if (kind === 'griffinNest') { // skalna iglica z gniazdem z gałęzi, pióra
    rock(8, 26, 30, 32, '#7a6a58'); rock(26, 6, 30, 52, '#8a7862'); rock(44, 30, 22, 28, '#6e604e');
    P([[28, 12], [54, 12], [50, 18], [32, 18]], '#6a4a26'); for (let i = 0; i < 6; i++) limb(ctx, 28 + i * 4.4, 11 + (i % 2) * 5, 33 + i * 4.4, 17 - (i % 2) * 4, 1.2, C('#8a6434'));
    if (!cleared) { oval(ctx, 38, 10, 3, 3.8, '#f0e0b0'); oval(ctx, 44, 10.5, 3, 3.8, '#e8c060'); }
    P([[16, 52], [22, 46], [21, 52]], '#e8d8a8'); P([[58, 52], [62, 47], [63, 52]], '#c8a860');
    door(43, 44, 10, 14);
  } else if (kind === 'hydraLair') { // bagienna pieczara: omszały pagórek, zielona toń, trzciny, z pieczary wychylają się szyje hydry
    oval(ctx, 20, 55, 20, 5, C('#2e5a4a')); oval(ctx, 18, 54, 15, 3, C('#4a9a7a'));
    rock(18, 14, 48, 44, '#4a5a3a'); P([[24, 26], [42, 14], [60, 26], [44, 21]], '#6a9a4a'); P([[30, 20], [36, 16], [40, 20]], '#8aba5a');
    door(36, 36, 18, 22);
    if (!cleared) for (const [x, y, a] of [[38, 36, -0.9], [45, 32, -0.2], [52, 36, 0.6]]) { // trzy łby hydry
      ctx.strokeStyle = '#3a7a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(45, 56); ctx.quadraticCurveTo(45 + a * 6, 46, x, y); ctx.stroke();
      P([[x - 3, y - 2], [x + 3 + a * 2, y - 3], [x + 5 + a * 3, y], [x - 2, y + 2]], '#4a9a5a'); circ(ctx, x + 1, y - 1.2, 0.9, '#f0e060');
    }
    for (const [x, h] of [[4, 14], [8, 18], [12, 12], [62, 14], [66, 10]]) { limb(ctx, x, 58, x + 1, 58 - h, 1.2, C('#6a8a2a')); oval(ctx, x + 1, 58 - h, 1.3, 3, C('#7a5a2a')); }
    gold(28, 58, 0.7);
  } else if (kind === 'dragonUtopia') { // smocza góra: czerwone skały z żyłami lawy, skrzydła smoka na szczycie, złoty skarb w pieczarze
    rock(-18, 10, 40, 48, '#7a3a34'); rock(40, 4, 42, 54, '#6a3430'); rock(4, -30, 56, 88, '#8a4a3c');
    for (const [x1, y1, x2, y2] of [[10, 0, 16, 20], [52, 14, 58, 30], [-6, 30, 0, 46], [46, -6, 42, 8]]) limb(ctx, x1, y1, x2, y2, 1.4, cleared ? '#4a2a22' : '#ff8a2a');
    P([[26, -30], [32, -44], [36, -30]], '#9a5a4a');
    P([[29, -36], [4, -52], [10, -40], [-2, -38], [22, -28]], '#5a1a1a'); P([[33, -36], [58, -52], [52, -40], [64, -38], [40, -28]], '#5a1a1a'); // skrzydła
    P([[29, -36], [4, -52], [16, -36]], '#8a2a22'); P([[33, -36], [58, -52], [46, -36]], '#8a2a22');
    P([[27, -44], [31, -52], [35, -44]], '#6a1a14'); circ(ctx, 29.5, -46, 0.9, cleared ? '#3a1a10' : '#ffd040');
    ctx.fillStyle = C('#1a0a06'); ctx.beginPath(); ctx.moveTo(18, 58); ctx.lineTo(18, 34); ctx.arc(34, 34, 16, Math.PI, 0); ctx.lineTo(50, 58); ctx.fill();
    if (!cleared) { oval(ctx, 34, 55, 15, 4, '#c88a1a'); gold(26, 57, 1.3); gold(40, 57, 1.1); gold(33, 52, 0.8); circ(ctx, 30, 30, 1.8, '#ff5a2a'); circ(ctx, 38, 30, 1.8, '#ff5a2a'); }
    for (const [x, y] of [[-6, 22], [70, 18], [16, -8]]) P([[x, y], [x + 3, y - 4], [x + 6, y]], '#e8c888');
  }
}
// Większa Smocza Utopia wychodzi poza 2×2 pola (w lewo i do góry)
const bankSprite = (k, cleared) => (k === 'dragonUtopia'
  ? sprite(`bank_${k}_${cleared ? 1 : 0}`, 54, 66, 12, 32, p => drawBank(p, k, cleared))
  : sprite(`bank_${k}_${cleared ? 1 : 0}`, 36, 38, 2, 4, p => drawBank(p, k, cleared)));
