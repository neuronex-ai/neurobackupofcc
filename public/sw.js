/* NeuroNex PWA service worker
 *
 * Privacy rule: cache only the public offline shell and static same-origin
 * assets. API responses, Supabase traffic and authenticated data are never
 * cached by this worker.
 */

const CACHE_NAME = "neuronex-pwa-v2";
const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/pwa-192.png",
  "/pwa-512.png",
  "/favicon-dark.png",
  "/favicon-light.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("neuronex-pwa-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/functions/v1/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkNavigation(request));
    return;
  }

  if (["script", "style", "font", "image", "manifest"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match("/offline.html")) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkRequest = fetch(request)
    .then(async (response) => {
      if (response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkRequest;
    return cached;
  }

  return (await networkRequest) || Response.error();
}
