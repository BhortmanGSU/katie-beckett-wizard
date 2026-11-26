// Offline-first Service Worker for Katie Beckett Helper PWA.
// Caches the app shell, official Georgia PDFs, and local OCR/PDF workers so
// families can work 100% offline at the doctor's office or hospital.
// Never caches /api/* calls (those stay live when paired with the desktop app).

const CACHE_NAME = 'kb-helper-v2';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './forms/ga/form-94.pdf',
  './forms/ga/dma-6a.pdf',
  './forms/ga/dma-706.pdf',
  './forms/ga/dma-704.pdf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept live sync API calls or SSE streams
  if (url.pathname.includes('/api/')) return;

  // Network-first for navigation (HTML) so updates arrive cleanly, falling back to cache offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match('./index.html') || caches.match('./')),
    );
    return;
  }

  // Cache-first for static assets, fonts, PDF templates, and WASM workers
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      });
    }),
  );
});
