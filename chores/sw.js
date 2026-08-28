// Offline shell for Chore Quest. Bump CACHE_V after changing index.html.
var CACHE_V = 'chore-quest-v4';
var SHELL = ['./', './index.html', './manifest.json', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png',
  './money-cash-pile.png', './money-cash-fan.png', './money-coins-cash.png',
  './money-coins.png', './money-cash-stack.png', './money-coins-pile.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_V).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE_V; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  // Never cache the sheet — the app handles its own staleness via localStorage.
  if(url.hostname.indexOf('docs.google.com') !== -1) return;
  if(e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(function(res){
      if(url.origin === self.location.origin && res.ok){
        var copy = res.clone();
        caches.open(CACHE_V).then(function(c){ c.put(e.request, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});
