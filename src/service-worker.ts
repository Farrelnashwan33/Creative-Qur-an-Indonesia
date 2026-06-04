/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE_NAME = `cqi-cache-${version}`;

const ASSETS_TO_CACHE = [
  ...build,
  ...files,
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

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Gracefully pre-cache each item so a single failure doesn't halt SW installation
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn(`Failed to pre-cache ${url}:`, err))
        )
      );
    })
  );
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event: any) => {
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
  (self as any).clients.claim();
});

self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // 1. Quran API: Cache-First
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
              console.warn('SW fetch failed for Quran API:', err);
              return new Response(JSON.stringify({ error: 'Offline' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        });
      })
    );
  }
  // 2. Prayer Times API: Network-First
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
  // 3. Static assets & build files: Cache-First with Network fallback
  else if (ASSETS_TO_CACHE.includes(url.pathname) || build.includes(url.pathname) || files.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        });
      })
    );
  }
  // 4. Navigation & other assets: Network-First
  else {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return fetch(request)
          .then((response) => {
            if (response.status === 200 && url.protocol.startsWith('http')) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return cachedResponse || caches.match('/');
          });
      })
    );
  }
});
