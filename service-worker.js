const CACHE_NAME = "pesatrend-cache-v1";
const urlsToCache = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "https://cdn.jsdelivr.net/npm/chart.js",
    "/icon.png"
];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", event => {
    event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});
