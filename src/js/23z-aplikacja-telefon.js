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
      add('link', { rel: 'manifest', href: 'manifest.webmanifest' }); add('link', { rel: 'apple-touch-icon', href: 'ikona-192.png' });
      add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }); add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
      add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }); add('meta', { name: 'theme-color', content: '#0a0806' });
      if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.prompt = e; G.dirty = true; if (G.screenName === 'menu' && G.screen.setMode) G.screen.setMode(G.screen.mode); });
    window.addEventListener('appinstalled', () => { this.installed = true; this.prompt = null; G.dirty = true; });
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    // pierwszy dotyk w przeglądarce telefonu: pełny ekran i blokada poziomej orientacji (iPhone tego nie pozwala – tam instalacja)
    G.canvasFirstTouch = e => { if (e.pointerType !== 'touch' || isStandalone() || this.fsTried) return; this.fsTried = true; this.fullscreen(); };
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
    const how = isIOS() ? 'W Safari stuknij „Udostępnij” (kwadrat ze strzałką), potem „Do ekranu początkowego”.'
      : 'W menu przeglądarki (⋮) wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.';
    showDialog(`Zainstaluj Kroniki jak aplikację: ${how} Gra otworzy się z ikony na pełnym ekranie, bez pasków przeglądarki, i zadziała także bez internetu. Zapisy zostają te same.`, [{ label: 'OK', key: 'enter' }]);
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
