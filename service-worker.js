const CACHE_NAME = 'seven-pockets-v4';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './favicon.ico'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.map(name => (name !== CACHE_NAME ? caches.delete(name) : null)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const req = event.request;
    const isHTML = req.mode === 'navigate' || req.destination === 'document';

    if (isHTML) {
        // HTML はネットワーク優先：最新の index.html を常に取りに行き、失敗時のみキャッシュ
        event.respondWith(
            fetch(req).then(res => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                return res;
            }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
        );
    } else {
        // それ以外（アイコン等）はキャッシュ優先
        event.respondWith(
            caches.match(req).then(r => r || fetch(req).then(res => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                return res;
            }))
        );
    }
});
