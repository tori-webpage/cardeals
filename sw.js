/* =============================================
   Cardeals.al — Service Worker v5
   Strategy:
   - HTML → network first (always fresh)
   - CSS/JS/images → cache first (fast loads)
   ============================================= */

const CACHE_VERSION = 'v5'; // ← bump this on every deploy
const CACHE_NAME = 'cardeals-' + CACHE_VERSION;

const STATIC_ASSETS = [
  '/css/style.css',
  '/css/dashboard.css',
  '/js/firebase.js',
  '/js/app.js',
  '/js/error-handler.js',
  '/js/performance.js',
  '/js/lang.js',
  '/js/utils.js',
  '/js/analytics.js',
  '/js/notifications.js',
  '/manifest.json'
];

// ========== INSTALL ==========
// Pre-cache static assets only (not HTML)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ========== ACTIVATE ==========
// Delete all caches from previous versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ========== FETCH ==========
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignore non-GET requests and browser extensions
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  // Ignore Firebase and external API calls — always go to network
  const url = new URL(request.url);
  const isExternal =
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('emailjs') ||
    url.hostname.includes('paypal') ||
    url.hostname.includes('gstatic');

  if (isExternal) return;

  const isHTML = request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // ── HTML: Network first, cache fallback ──
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache a fresh copy for offline fallback
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline: serve from cache if available
          return caches.match(request).then(cached => {
            return cached || caches.match('/index.html');
          });
        })
    );
  } else {
    // ── CSS / JS / Images: Cache first, network fallback ──
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          // Only cache valid responses
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
  }
});
