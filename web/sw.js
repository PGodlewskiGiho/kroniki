// Kroniki Królestw jako aplikacja: gra działa bez internetu (poza grą online).
// Najpierw sieć (zawsze najnowsza wersja), a bez sieci ostatnia zapisana kopia.
const CACHE = 'kroniki-v2', FILES = ['./', 'manifest.webmanifest', 'ikona-180.png', 'ikona-192.png', 'ikona-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./'))));
});
