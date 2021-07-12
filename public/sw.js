const OFFLINE_VERSION = 1;
const CACHE_NAME = "offline";
const OFFLINE_URL = "main.html";

const cacheFiles = [
  '/main.html',
  '/main.js',
  '/main.css',
  '/launch.html',
  '/launch.js',
  '/offline.html',
  '/offline.js',
  '/cloudVM.png',
  '/v86util.js',
  '/v86.css',
  '/VMs.json',
  '/build/v86.wasm',
  '/build/xterm.js',
  '/build/libv86.js',
  '/bios/vgabios.bin',
  '/bios/seabios.bin'
];

self.addEventListener("install", (event) => {
    console.log('[Service Worker] Installing Caches');
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.log('[Service Worker] Caching All');
            await cache.addAll(cacheFiles);
        })()
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            if ("navigationPreload" in self.registration) {
                await self.registration.navigationPreload.enable();
            }
        })()
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    console.log(event);
    if (event.request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }
                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                }
                catch (error) {
                    console.log("Fetch failed; returning offline page instead.", error);
                    const cache = await caches.open(CACHE_NAME);
                    //if ()
                    const cachedResponse = await cache.match(event.request, {ignoreSearch: true});
                    //const cachedResponse = await cache.match(event.request);
                    return cachedResponse;
                }
            })()
        );
    }
});