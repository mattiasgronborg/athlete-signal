// Athlete Signal — service worker (PWA app shell)
const CACHE = 'as-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  // Live data (Apps Script JSONP) — always go to network, never cache.
  if (req.url.indexOf('script.google.com') !== -1) return;
  // Network-first so dashboard updates always show; fall back to cache offline.
  e.respondWith(
    fetch(req).then(function (res) {
      var cp = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, cp); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});
