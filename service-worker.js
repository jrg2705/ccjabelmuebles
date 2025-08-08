const CACHE_NAME = 'jabel-muebles-cache-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './estilos.css',
  './script.js',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // network-first for CM.xlsx (try network then cache)
  if (req.url.endsWith('CM.xlsx')) {
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return resp;
      }).catch(()=> caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req))
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
