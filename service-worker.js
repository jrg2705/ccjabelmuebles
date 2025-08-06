
self.addEventListener('install', e => {
  console.log('Service Worker instalado');
  e.waitUntil(
    caches.open('calculadora-v1').then(cache => {
      return cache.addAll([
        './',
        './Calculadora.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
