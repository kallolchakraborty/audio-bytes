const CACHE = 'audiobytes-v23';
const STATIC = [
  '/',
  '/index.html',
  '/css/tailwind.css',
  '/css/main.css',
  '/js/app.js',
  '/js/store.js',
  '/js/router.js',
  '/js/player.js',
  '/js/ui.js',
  '/js/utils.js',

  '/config/app.js',
  '/config/genres.js',
  '/data/playlists.json',
  '/manifest.json',
  '/assets/images/favicon.svg',
  '/assets/images/fallback-album.svg',
  '/assets/images/og-image.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(STATIC).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        return cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  if (url.hostname === 'img.youtube.com') {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetched = fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  if (e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request).then((cached) => {
        if (cached) return cached;
        if (e.request.mode === 'navigate') return caches.match('/index.html');
        return new Response('Offline', { status: 503 });
      }))
    );
  }
});
