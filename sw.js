const CACHE_NAME = 'bhagavad-gita-v13';

self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', async event => {
   if (event.data?.type === 'START_CACHING' && event.data.urls) {
      const urls = event.data.urls;
      const cache = await caches.open(CACHE_NAME);
      let cached = 0;

      for (const url of urls) {
         try {
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok) {
               await cache.put(url, res);
               cached++;
               const percent = Math.round((cached / urls.length) * 100);
               event.ports[0].postMessage({ type: 'PROGRESS', percent, cached, total: urls.length });
            }
         } catch (e) { /* ignore */ }
      }
      event.ports[0].postMessage({ type: 'COMPLETE' });
   }
});

self.addEventListener('fetch', e => {
   e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
