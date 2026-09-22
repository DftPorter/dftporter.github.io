// halfway — cache the app shell so it opens instantly and survives a dead signal.
// Map tiles and routing always need the network.
const SHELL = "halfway-shell-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.allSettled(FILES.map(f => c.add(f)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (/nominatim|router\.project-osrm|tile\.openstreetmap/.test(url.host + url.pathname)) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res && res.ok && url.origin === location.origin) {
      const copy = res.clone();
      caches.open(SHELL).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => hit)));
});
