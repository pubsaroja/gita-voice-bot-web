const CACHE_NAME = 'bhagavad-gita-v11';   // ← Change version when updating

let allAudioUrls = [];   // Will be filled by main page

self.addEventListener('message', event => {
   if (event.data && event.data.type === 'CACHE_URLS') {
      allAudioUrls = event.data.urls;
      // Start pre-caching everything
      event.waitUntil(preCacheAll());
   }
   if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function preCacheAll() {
   const cache = await caches.open(CACHE_NAME);
   let cached = 0;
   const total = allAudioUrls.length;

   for (const url of allAudioUrls) {
      try {
         const response = await fetch(url, { cache: 'no-cache' });
         if (response.ok) {
            await cache.put(url, response);
            cached++;
            // Send progress to main page
            self.clients.matchAll().then(clients => {
               clients.forEach(client => client.postMessage({
                  type: 'PROGRESS',
                  percent: Math.round((cached / total) * 100),
                  cached: cached,
                  total: total
               }));
            });
         }
      } catch (e) { /* ignore failed files */ }
   }

   // Done!
   self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'CACHING_COMPLETE' }));
   });
}

// Regular fetch (for normal page use)
self.addEventListener('fetch', event => {
   if (event.request.method !== 'GET') return;
   event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
   );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
