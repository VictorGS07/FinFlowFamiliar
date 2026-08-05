const CACHE_NAME = 'finflow-v5'; // Cambia el número de versión (v2, v3...) en cada actualización grande
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Instalar el nuevo Service Worker y omitir la espera
self.addEventListener('install', e => {
  self.skipWaiting(); // Forzar al nuevo SW a activarse inmediatamente
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
            return caches.delete(key); // Elimina el caché de la versión anterior
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de la página de inmediato
  );
});

// 3. Estrategia "Network First": Intenta buscar la versión fresca online, si falla usa el caché
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Guarda la nueva versión en caché mientras navega
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request)) // Si está offline, carga del caché
  );
});
