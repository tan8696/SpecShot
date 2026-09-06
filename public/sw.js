// Caches the app shell and the MediaPipe/background-removal CDN assets it
// depends on, so the tool keeps working offline after the first successful
// run. Runtime caching, not a build-time precache list, because Next's
// chunk filenames are content-hashed and change every build.
// Bump this version string on every deploy that changes any cached static
// asset or the app shell itself — the fetch handler below is cache-first, so
// returning visitors keep the old cache indefinitely otherwise.
const CACHE = "specshot-v1";
const CACHEABLE_HOSTS = new Set(["cdn.jsdelivr.net", "storage.googleapis.com"]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const cacheable = url.origin === self.location.origin || CACHEABLE_HOSTS.has(url.hostname);
  if (!cacheable) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    })
  );
});
