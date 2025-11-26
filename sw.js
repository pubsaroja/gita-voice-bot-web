const CACHE_NAME = 'bhagavad-gita-v16';

self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', async event => {
  if (event.data?.type === 'CACHE_CHUNK') {
    const { urls, startIdx } = event.data;
    const cache = await caches.open(CACHE_NAME);
    let success = 0;

    // Cache one small batch (50 files max)
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res?.ok) {
          await cache.put(url, res.clone());
          success++;
        }
      } catch (e) {}
      // Tiny breathing pause every 5 files
      if (i % 5 === 4) await new Promise(r => setTimeout(r, 50));
    }

    event.ports[0].postMessage({
      type: 'CHUNK_DONE',
      startIdx,
      success,
      totalInChunk: urls.length
    });
  }
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
