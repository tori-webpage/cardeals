const CACHE_NAME = 'cardeals-v4';
const urlsToCache = [
  '/index.html',
  '/cardeals-backoffice.html',
  '/admin.html',
  '/dyqani.html',
  '/workshop.html',
  '/privacy.html',
  '/css/style.css',
  '/js/firebase.js',
  '/js/app.js',
  '/js/error-handler.js',
  '/js/performance.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
