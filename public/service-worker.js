const CACHE_NAME = 'cricbet-pwa-cache-v5';
const DYNAMIC_CACHE = 'cricbet-dynamic-cache-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/screenshot-mobile.png',
  '/screenshot-wide.png',
  '/vite.svg'
];

// Install Event - Cache Static Assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Force SW activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching App Shell...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
        .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event - Stale While Revalidate + Network First for APIs
self.addEventListener('fetch', event => {
  // Skip cross-origin or external APIs like Firebase to prevent caching sensitive data
  if (event.request.url.includes('firebasestorage.googleapis.com') || 
      event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('identitytoolkit.googleapis.com') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found, update cache in background (Stale While Revalidate)
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(err => {
          console.log('[SW] Network error', err);
        });

        return cachedResponse || fetchPromise;
      })
      .catch(() => {
        // Fallback for offline Single Page Application routing
        if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});
