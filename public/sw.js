// Basic Service Worker for CASHRULER

const CACHE_NAME = 'cashruler-cache-v1';
const urlsToCache = [
  '/',
  // '/_next/static/...', // Next.js assets are typically hashed and managed by Next itself or Workbox
  '/manifest.json'
  // Add other specific static assets if needed, but be cautious with Next.js build outputs.
];

// Install event: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Filter out Next.js dynamic chunks if they were mistakenly added to urlsToCache
        const staticAssetsToCache = urlsToCache.filter(url => !url.startsWith('/_next/static/'));
        return cache.addAll(staticAssetsToCache);
      })
      .catch(err => {
        console.error('Failed to open cache or add URLs:', err);
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients as soon as activated.
  );
});

// Fetch event: serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't cache Genkit AI flow requests or API routes
  if (event.request.url.includes('/api/') || event.request.url.includes('/genkit/') || event.request.url.includes('/_next/static/development/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Cache hit
        }

        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Avoid caching Next.js specific dev/HMR or dynamic RSC payloads in this simple SW
                if (!event.request.url.includes('/_next/static/webpack/') &&
                    !event.request.url.includes('?_rsc=') &&
                    !event.request.url.includes('/_next/static/chunks/app/') && // more specific for app router chunks
                    !event.request.url.includes('flight') ) {
                   cache.put(event.request, responseToCache);
                }
              });
            return networkResponse;
          }
        ).catch(() => {
          // Fallback for network failure if needed
          // e.g., return caches.match('/offline.html');
        });
      })
  );
});
