const VERSION = 'the-score-v4';
const SHELL = ['./', './index.html', './scores.js', './base.css', './light.css', './manifest.json', './icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// App shell: cache-first, refreshed in the background. Everything else
// (ESPN, RSS, fonts) goes straight to the network — stale scores are worse
// than no scores.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const live = fetch(req).then(res => {
        if (res && res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || live;
    })
  );
});
