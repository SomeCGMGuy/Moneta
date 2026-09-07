const CACHE_NAME = 'moneta-shell-v2.0.2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/views.css',
  './js/app.js',
  './js/version.js',
  './js/db/database.js',
  './js/db/migrations.js',
  './js/services/booking-service.js',
  './js/services/category-service.js',
  './js/services/budget-service.js',
  './js/services/analysis-service.js',
  './js/services/settings-service.js',
  './js/services/backup-service.js',
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
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('./index.html');
    throw new Error('Offline und Ressource nicht im Cache.');
  }
}
