const CACHE_NAME = 'moneta-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/views.css',
  './js/app.js',
  './js/db/database.js',
  './js/db/migrations.js',
  './js/services/booking-service.js',
  './js/services/category-service.js',
  './js/services/budget-service.js',
  './js/services/analysis-service.js',
  './js/views/overview.js',
  './js/views/analysis.js',
  './js/views/budgets.js',
  './js/views/settings.js',
  './js/components/bottom-nav.js',
  './js/components/booking-form.js',
  './js/components/category-form.js',
  './js/components/booking-list.js',
  './js/components/confirm-dialog.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
