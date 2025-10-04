const CACHE_NAME = 'battlehub-v1';
const CORE_FILES = [
  'index.html',
  'manifest.json',
  'src/style/base.css',
  'src/style/animations.css',
  'src/core/app.js',
  'src/core/ui.js',
  'src/core/state.js',
  'src/core/soundManager.js',
  'src/games/tictactoe.js',
  'src/games/snake.js',
  'src/games/dotbox.js',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Install: cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(CORE_FILES)).then(()=>self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

// Fetch: network first for html, cache first for others
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Network first for HTML
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match('index.html'))
    );
  } else {
    // Cache first for assets
    event.respondWith(
      caches.match(req).then(cached =>
        cached ||
        fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        }).catch(()=>caches.match('index.html'))
      )
    );
  }
});

// Optional: message handler for future updates
self.addEventListener('message', e => {
  if (e.data === 'force-update') {
    caches.keys().then(keys => {
      keys.forEach(k => caches.delete(k));
    });
  }
});
