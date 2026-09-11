/* Coastal Strength service worker — hosted builds only.
   Cache-first for the app shell so it opens with no signal; the cache is refreshed in the
   background and the new version is used on the next launch. */
const VERSION = 'cs-f1373823';
const ASSETS = ['./', './index.html', './manifest.json', './favicon.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((cached) => {
    const network = fetch(e.request).then((res) => {
      if (res && res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
