var CACHE_NAME = "odyssey-pwa-v1-phone-safe-20260914-1";
var LIVE_FEED_URL = "./data/intelligence-feed.json";

var APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=1.1.1",
  "./app.js?v=1.1.1",
  "./manifest.json",
  "./assets/odyssey-hero.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches["delete"](key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.url.indexOf("/data/intelligence-feed.json") !== -1) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(LIVE_FEED_URL, copy);
        });
        return response;
      })["catch"](function() {
        return caches.match(LIVE_FEED_URL);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, copy);
        });
        return response;
      })["catch"](function() {
        return caches.match("./index.html");
      });
    })
  );
});
