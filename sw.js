let totalFiles = 0;
let cachedFiles = 0;
const CACHE_NAME = 'bhagavad-gita-v10';  // ← Change this number when you update!

const CORE_ASSETS = [
   './',
   'offline.html',
   'https://fonts.googleapis.com/css2?family=Ramabhadra&family=Outfit:wght@300&family=Noto+Sans+Telugu&display=swap',
   'https://unpkg.com/intro.js/minified/introjs.min.css',
   'https://unpkg.com/intro.js/minified/intro.min.js'
];

let totalFiles = 0;
let cachedFiles = 0;

self.addEventListener('install', event => {
   event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
         console.log('Caching core files...');
         return cache.addAll(CORE_ASSETS);
      }).then(() => {
         // Count total files to cache (main page will send this)
         self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({ type: 'START_CACHING' }));
         });
      })
   );
   self.skipWaiting();
});

self.addEventListener('activate', event => {
   event.waitUntil(
      caches.keys().then(keys => Promise.all(
         keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
   );
   self.clients.claim();
});

self.addEventListener('fetch', event => {
   if (event.request.method !== 'GET') return;

   event.respondWith(
      caches.match(event.request).then(cached => {
         if (cached) {
            cachedFiles++;
            updateProgress();
            return cached;
         }

         return fetch(event.request).then(response => {
            if (response && response.status === 200) {
               cachedFiles++;
               updateProgress();
               const clone = response.clone();
               caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
         }).catch(() => {
            return new Response('Offline — Gita is available', { headers: { 'Content-Type': 'text/plain' } });
         });
      })
   );
});

function updateProgress() {
   if (totalFiles === 0) return;
   const percent = Math.round((cachedFiles / totalFiles) * 100);
   self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({
         type: 'PROGRESS',
         percent: percent,
         cached: cachedFiles,
         total: totalFiles
      }));
   });
}

self.addEventListener('message', event => {
   if (event.data?.type === 'SET_TOTAL') {
      totalFiles = event.data.total;
      cachedFiles = event.data.cached || 0;
   } else if (event.data?.type === 'SKIP_WAITING') {
      self.skipWaiting();
   }
});
