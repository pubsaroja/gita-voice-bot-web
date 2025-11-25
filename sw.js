const CACHE_NAME = 'bhagavad-gita-v12';   // ← Change when you update

let urlsToCache = [];
let cachedCount = 0;

self.addEventListener('install', e => {
   e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
   e.waitUntil(self.clients.claim());
});

self.addEventListener('message', async event => {
   if (event.data?.type === 'START_CACHING' && event.data.urls) {
      urlsToCache = event.data.urls;
      cachedCount = 0;

      const cache = await caches.open(CACHE_NAME);

      for (let i = 0; i < urlsToCache.length; i++) {
         const url = urlsToCache[i];
         try {
            const resp = await fetch(url, { cache: 'reload' });
            if (resp.ok) {
               await cache.put(url, resp);
               cachedCount++;
               const percent = Math.round((cachedCount / urlsToCache.length) * 100);

               // Send progress back to page
               event.ports[0].postMessage({
                  type: 'PROGRESS',
                  percent: percent,
                  cached: cachedCount,
                  total: urlsToCache.length
               });
            }
         } catch (err) {
            // silently continue on failed file
         }
      }

      // Finished!
      event.ports[0].postMessage({ type: 'COMPLETE' });
   }
});

self.addEventListener('fetch', e => {
   e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
   );
});
