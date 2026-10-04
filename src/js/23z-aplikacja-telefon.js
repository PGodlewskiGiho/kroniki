// ==================== APLIKACJA I TELEFON =================================================
// Na stronie (https) gra jest aplikacją do zainstalowania (PWA): ikona na ekranie głównym, pełny ekran bez pasków
// przeglądarki, poziomo i bez internetu (manifest, ikony i sw.js z katalogu web/ leżą obok index.html).
// Na telefonie: pierwszy dotyk włącza pełny ekran i obrót poziomy (Android), a w pionie gra prosi o obrócenie telefonu.
const isTouchDevice = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0 && !(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
// Aplikacja na Androida (android/: WebView z grą w środku) wystawia most KronikiApp: zapis pliku, wyjście
const inApp = () => !!window.KronikiApp;
const isAndroid = () => /Android/i.test(navigator.userAgent);
const APK_URL = 'https://github.com/PGodlewskiGiho/kroniki/releases/latest/download/kroniki-krolestw.apk';
const isStandalone = () => inApp() || !!((window.matchMedia && window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) || navigator.standalone);
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
const onWeb = () => /^https?:$/.test(location.protocol) && !inApp();
// W pionie (telefon trzymany pionowo) obraz 800×600 byłby malutkim paskiem: zamiast gry prośba o obrót
const needRotate = () => isTouchDevice() && window.innerHeight > window.innerWidth * 1.1;
const App = {
  prompt: null, // zdarzenie beforeinstallprompt (Chrome, Android): pozwala pokazać systemowe okno instalacji
  installed: false,
  init() {
    if (onWeb()) {
      const add = (tag, attrs) => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); document.head.appendChild(e); };
      add('link', { rel: 'manifest', href: 'manifest.webmanifest' }); add('link', { rel: 'apple-touch-icon', sizes: '180x180', href: 'ikona-180.png' });
      add('meta', { name: 'apple-mobile-web-app-title', content: 'Kroniki' });
      if (isIOS() && !isStandalone()) this.iosSplash(add);
      add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }); add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
      add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }); add('meta', { name: 'theme-color', content: '#0a0806' });
      if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
      // prośba o trwałe miejsce na dane: przeglądarka nie usunie zapisów gry przy porządkach (Safari kasuje dane nieużywanych stron)
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    }
    // Safari ignoruje user-scalable=no: szczypanie i długie przytrzymanie palca nie mogą powiększać strony ani pokazywać menu
    for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
    document.addEventListener('contextmenu', e => { if (isTouchDevice()) e.preventDefault(); });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.prompt = e; G.dirty = true; if (G.screenName === 'menu' && G.screen.setMode) G.screen.setMode(G.screen.mode); });
    window.addEventListener('appinstalled', () => { this.installed = true; this.prompt = null; G.dirty = true; });
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    // pierwszy dotyk w przeglądarce telefonu: pełny ekran i blokada poziomej orientacji (iPhone tego nie pozwala – tam instalacja)
    G.canvasFirstTouch = e => { if (e.pointerType !== 'touch' || isStandalone() || this.fsTried) return; this.fsTried = true; this.fullscreen(); };
  },
  // Ekran startowy aplikacji na iPhonie: iOS bierze go z apple-touch-startup-image dokładnie w rozmiarze ekranu (inaczej biały błysk),
  // więc obrazy (poziomy i pionowy) rysujemy na tym urządzeniu przy dodawaniu do ekranu początkowego: tło, herb i nazwa gry.
  iosSplash(add, tries = 0) {
    const im = SCREEN_IMG.ladowanie; if (im && !im._ok && tries < 30) return setTimeout(() => this.iosSplash(add, tries + 1), 300); // obraz ekranu ładowania w tle, gdy już się wczytał
    const d = window.devicePixelRatio || 1, sw = screen.width, sh = screen.height;
    for (const land of [true, false]) {
      const w = Math.round((land ? Math.max(sw, sh) : Math.min(sw, sh)) * d), h = Math.round((land ? Math.min(sw, sh) : Math.max(sw, sh)) * d);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); if (!c) return;
      const g = c.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.7); g.addColorStop(0, '#2a1c0e'); g.addColorStop(1, '#0a0806');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      if (im && im._ok) { const k = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * k, ih = im.naturalHeight * k; c.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih); c.fillStyle = 'rgba(10,8,6,0.45)'; c.fillRect(0, 0, w, h); }
      const u = Math.min(w, h) / 100; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = '#000'; c.shadowBlur = u * 2; c.fillStyle = '#e0b85a'; c.font = `${Math.round(u * 11)}px Cinzel, Georgia, serif`; c.fillText('Kroniki Królestw', w / 2, h * 0.47);
      c.fillStyle = '#8a7350'; c.fillRect(w / 2 - u * 22, h * 0.47 + u * 9, u * 44, Math.max(1, u * 0.4));
      const media = `(device-width: ${Math.min(sw, sh)}px) and (device-height: ${Math.max(sw, sh)}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: ${land ? 'landscape' : 'portrait'})`;
      try { add('link', { rel: 'apple-touch-startup-image', media, href: cv.toDataURL('image/png') }); } catch (e) { return; }
    }
  },
  fullscreen() {
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen; if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
    try { const p = req.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {}); } catch (e) { /* przeglądarka odmówiła: gra działa dalej w oknie */ }
  },
  // Przycisk w menu: na stronie, poza zainstalowaną aplikacją, na urządzeniu dotykowym albo gdy przeglądarka proponuje instalację
  canInstall() { return onWeb() && !isStandalone() && !this.installed && (!!this.prompt || isTouchDevice()); },
  install() {
    if (this.prompt) { const p = this.prompt; this.prompt = null; p.prompt(); if (p.userChoice) p.userChoice.then(r => { if (r && r.outcome === 'accepted') this.installed = true; G.dirty = true; }).catch(() => {}); return; }
    if (isAndroid()) return showDialog('Na Androidzie możesz zainstalować grę jako aplikację z przeglądarki (ikona na ekranie głównym) albo pobrać osobną aplikację (plik APK): działa bez internetu i bez przeglądarki. Przy instalacji APK telefon zapyta o zgodę na instalację z tego źródła.',
      [{ label: 'Pobierz APK', key: 'enter', primary: true, action: () => { location.href = APK_URL; } }, { label: 'Z przeglądarki', key: 'p', action: () => showDialog('W menu przeglądarki (⋮) wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.', [{ label: 'OK', key: 'enter' }]) }, { label: 'Anuluj', key: 'escape' }], { bw: 150 });
    if (isIOS()) {
      const other = /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent); // Chrome, Firefox, Edge na iPhonie: „Udostępnij” jest przy pasku adresu
      return showDialog(`Zainstaluj Kroniki jak aplikację: ${other ? 'stuknij „Udostępnij” przy pasku adresu' : 'w Safari stuknij „Udostępnij” (kwadrat ze strzałką) na dole ekranu'}, przewiń w dół i wybierz „Do ekranu początkowego”. Gra otworzy się z ikony na pełnym ekranie i zadziała bez internetu. Aplikacja ma osobne zapisy niż przeglądarka: grę z przeglądarki przeniesiesz przyciskiem „Do pliku” w zapisie gry i „Wczytaj grę” → „Z pliku”.`,
        [{ label: 'OK', key: 'enter' }]);
    }
    showDialog('Zainstaluj Kroniki jak aplikację: w menu przeglądarki (⋮) wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”. Gra otworzy się z ikony na pełnym ekranie, bez pasków przeglądarki, i zadziała także bez internetu. Zapisy zostają te same.', [{ label: 'OK', key: 'enter' }]);
  },
};
function drawRotateHint(ctx) {
  viewportDraw(ctx, c => {
    c.fillStyle = '#0a0806'; c.fillRect(0, 0, VW, VH);
    const k = clamp(0.9 / (G.scale || 1), 1, 2.4); c.translate(VW / 2, VH / 2); c.scale(k, k); c.translate(-VW / 2, -VH / 2); // w pionie płótno jest pomniejszone: napis w czytelnej wielkości
    const cx = VW / 2, cy = VH / 2 - 40, a = Math.sin(G.time * 2) * 0.5 + 0.5, r = a * Math.PI / 2;
    c.save(); c.translate(cx, cy); c.rotate(-r); c.strokeStyle = '#c49a3c'; c.lineWidth = 6; c.beginPath(); c.roundRect ? c.roundRect(-45, -80, 90, 160, 14) : c.rect(-45, -80, 90, 160); c.stroke();
    c.fillStyle = '#c49a3c'; c.beginPath(); c.arc(0, 64, 6, 0, Math.PI * 2); c.fill(); c.restore();
    goldText(c, 'Obróć telefon', cx, cy + 150, 40);
    text(c, 'Kroniki Królestw grają się poziomo.', cx, cy + 196, { size: 24, weight: 500, align: 'center', color: '#e8d9b0' });
  });
  G.dirty = true; // animacja telefonu
}
