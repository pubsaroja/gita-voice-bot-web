const CACHE_NAME = 'bhagavad-gita-v17';

self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', async event => {
  if (event.data?.type === 'CACHE_CHUNK') {
    const { urls } = event.data;
    const cache = await caches.open(CACHE_NAME);
    let success = 0;

    // Process only 10 files at a time with tiny delays — NEVER freezes
    for (let i = 0; i < urls.length; i++) {
      try {
        const res = await fetch(urls[i], { cache: 'reload' });
        if (res?.ok) {
          await cache.put(urls[i], res.clone());
          success++;
        }
      } catch (e) {}
      
      // Tiny breathing pause every 3 files — prevents browser freeze
      if (i % 3 === 2) await new Promise(r => setTimeout(r, 80));
    }

    event.ports[0].postMessage({ type: 'CHUNK_DONE', success });
  }
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
