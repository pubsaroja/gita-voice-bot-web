const CACHE_NAME = 'bhagavad-gita-v15';

self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));  // ← FIXED HERE

let urlsToCache = [];
let total = 0;
let cached = 0;

self.addEventListener('message', async event => {
  if (event.data?.type === 'START_USER_CACHING') {
    urlsToCache = event.data.urls;
    total = urlsToCache.length;
    cached = 0;

    const cache = await caches.open(CACHE_NAME);

    for (let i = 0; i < urlsToCache.length; i++) {
      const url = urlsToCache[i];
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) {
          await cache.put(url, res.clone());
          cached++;
          const percent = Math.round((cached / total) * 100);
          event.ports[0].postMessage({ type: 'PROGRESS', percent, cached, total });
        }
      } catch (e) {
        console.log('Failed:', url);
      }
    }
    event.ports[0].postMessage({ type: 'COMPLETE' });
  }
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
