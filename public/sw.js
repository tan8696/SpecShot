// Caches the app shell and the MediaPipe/background-removal CDN assets it
// depends on, so the tool keeps working offline after the first successful
// run. Runtime caching, not a build-time precache list, because Next's
// chunk filenames are content-hashed and change every build.
const CACHE = "specshot-v2";
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

  // Page loads must go network-first: they carry the current build's chunk-hash
  // manifest, so serving a stale cached page sends the browser looking for JS
  // chunks an old deploy already replaced — a 404 that trips the error boundary.
  // Hashed static assets (_next/static/*) stay cache-first below since their
  // filename IS the content fingerprint; they never go stale in place.
  const isDocument = event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html");

  if (isDocument) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return (await cache.match(event.request)) ?? Response.error();
        }
      })
    );
    return;
  }

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
