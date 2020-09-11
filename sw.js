const cacheName = 'static';
const staticAssests = [
    './',
    './index.html',
    './main.css',
    './script.js',
    './icons/loader.gif',
    './icons/01d.png',
    './icons/01n.png',
    './icons/02d.png',
    './icons/02n.png',
    './icons/03d.png',
    './icons/03n.png',
    './icons/04d.png',
    './icons/04n.png',
    './icons/09d.png',
    './icons/09n.png',
    './icons/10d.png',
    './icons/10n.png',
    './icons/11d.png',
    './icons/11n.png',
    './icons/13d.png',
    './icons/13n.png',
    './icons/50d.png',
    './icons/50n.png',
    './icons/unknown.png',
    './icons/icon-144x144.png',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './favicon-16x16.png',
    './favicon-32x32.png',
    './manifest.webmanifest'
]

self.addEventListener('install', async e => {
    console.log('SW INSTALLED');
    e.waitUntil(
        await caches.open(cacheName)
        .then(function(cache) {
            cache.addAll(staticAssests);
        })
    )
    return self.skipWaiting();
});

self.addEventListener('activate', e => {
    console.log('SW ACTIVATED');
    self.clients.claim();
});

self.addEventListener('fetch', async e => {
    const req = e.request;
    const url = new URL(req.url);
    try {
        if(url.origin === location.origin) {
            e.respondWith(cacheFirst(req));
        } else {
            e.respondWith(networkAndCache(req));
        } 
    } catch (e) {
        return e;
    }
})

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    return cached || fetch(cache)
}

async function networkAndCache(req) {
    const cache = await caches.open(cacheName);
    try {
        const fresh = await fetch(req);
        await cache.put(req, fresh.clone());
        return fresh;
    } catch (e) {
        const cached = await cache.match(req);
        return cached;
    }
}