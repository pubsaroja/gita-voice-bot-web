const CACHE_NAME = 'bhagavad-gita-v12';

let urlsToCache = [];
let cachedCount = 0;

self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', async event => {
   if (event.data?.type === 'START_CACHING' && event.data.urls) {
      urlsToCache = event.data.urls;
      cachedCount = 0;
      const cache = await caches.open(CACHE_NAME);

      for (let i = 0; i < urlsToCache.length; i++) {
         try {
            const resp = await fetch(urlsToCache[i], { cache: 'reload' });
            if (resp.ok) {
               await cache.put(urlsToCache[i], resp);
               cachedCount++;
               const percent = Math.round((cachedCount / urlsToCache.length) * 100);
               event.ports[0].postMessage({ type: 'PROGRESS', percent, cached: cachedCount, total: urlsToCache.length });
            }
         } catch (e) {}
      }
      event.ports[0].postMessage({ type: 'COMPLETE' });
   }
});

self.addEventListener('fetch', e => {
   e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
