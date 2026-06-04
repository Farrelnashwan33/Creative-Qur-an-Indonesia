const CACHE_NAME = 'cqi-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.png',
  'https://equran.id/api/v2/surat',
  'https://equran.id/api/v2/surat/1',
  'https://equran.id/api/v2/tafsir/1',
  'https://equran.id/api/v2/surat/18',
  'https://equran.id/api/v2/tafsir/18',
  'https://equran.id/api/v2/surat/36',
  'https://equran.id/api/v2/tafsir/36',
  'https://equran.id/api/v2/surat/67',
  'https://equran.id/api/v2/tafsir/67'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Quran API: Cache-First to save mobile quota (Qur'an text is static)
  if (url.hostname === 'equran.id') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.open(CACHE_NAME).then((cache) => {
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch((err) => {
              console.warn('SW fetch failed for Quran API, no cache match:', err);
            });
        });
      })
    );
  } 
  // 2. Prayer Times API: Network-First (prayer times change daily)
  else if (url.hostname === 'api.aladhan.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(request);
          });
      })
    );
  } 
  // 2. Navigation (HTML pages) and SvelteKit JS chunks: Network-First with Cache Fallback
  // This solves the 404 cache mismatch issue during updates/new deployments.
  else if (request.mode === 'navigate' || url.pathname.includes('/_app/') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(request);
          });
      })
    );
  } 
  // 3. Static assets: Cache-First with Network Fallback
  else {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
