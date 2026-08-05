const CACHE_NAME = 'finflow-v2'; // Al cambiar a v2, el navegador sabe que hay una versión nueva
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Instalar el nuevo Service Worker y omitir la espera
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// 2. Limpiar versiones antiguas de la caché automáticamente
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia Network First (busca primero en internet la versión nueva)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});
