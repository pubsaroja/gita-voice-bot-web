const CACHE_NAME = 'gita-offline-final-v1';  // ← MUST match exactly in both files

self.addEventListener('install', e => {
  console.log('SW installing...');
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  console.log('SW activating...');
  e.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', async event => {
  if (event.data?.type === 'CACHE_CHUNK') {
    const { urls } = event.data;
    const cache = await caches.open(CACHE_NAME);
    let success = 0;

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res?.ok) {
          await cache.put(url, res.clone());
          success++;
        }
      } catch (e) { /* ignore */ }
      if (success % 5 === 0) await new Promise(r => setTimeout(r, 30));
    }

    event.ports[0].postMessage({ type: 'CHUNK_DONE', success });
  }
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match(e.request)))
  );
});
