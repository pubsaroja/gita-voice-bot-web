const CACHE_NAME = 'bhagavad-gita-v9';  // ← Change this number when you update content!

// List of files to cache (main page + critical assets)
const CORE_ASSETS = [
   './',
   'index.html',
   'test.html',
   'https://fonts.googleapis.com/css2?family=Ramabhadra&family=Outfit:wght@300&family=Noto+Sans+Telugu&display=swap',
   'https://unpkg.com/intro.js/minified/introjs.min.css',
   'https://unpkg.com/intro.js/minified/intro.min.js'
];

// Install + cache core files
self.addEventListener('install', event => {
   event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
         console.log('Bhagavad Gita Bot: Caching core files...');
         return cache.addAll(CORE_ASSETS);
      })
   );
   self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
   event.waitUntil(
      caches.keys().then(keys => {
         return Promise.all(
            keys.filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
         );
      })
   );
   self.clients.claim();
});

// Fetch: serve from cache, update in background
self.addEventListener('fetch', event => {
   // Only handle GET requests for our domain or known CDNs
   if (event.request.method !== 'GET') return;

   event.respondWith(
      caches.match(event.request).then(cachedResponse => {
         // Return cached version if exists
         if (cachedResponse) {
            // Update in background for next visit
            fetch(event.request).then(networkResponse => {
               if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME).then(cache => {
                     cache.put(event.request, networkResponse.clone());
                  });
               }
            }).catch(() => {}); // ignore network errors
            return cachedResponse;
         }

         // Otherwise fetch from network
         return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
               const responseClone = networkResponse.clone();
               caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
               });
            }
            return networkResponse;
         }).catch(() => {
            return new Response('Offline — Bhagavad Gita is still available', {
               headers: { 'Content-Type': 'text/plain' }
            });
         });
      })
   );
});

// Listen for update message from main page
self.addEventListener('message', event => {
   if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
   }
});
