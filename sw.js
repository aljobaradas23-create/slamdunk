// SLAM DUNK — offline support
// Ini-save sa phone ang page, icon at fonts para gumana kahit walang internet.
// Kapag may internet, kinukuha pa rin ang pinakabagong bersyon ng page.
const CACHE = "slamdunk-v1";
const CORE = ["./", "./index.html", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // cloud sync: laging diretso sa internet, hindi naka-cache
  if (url.hostname.endsWith("googleapis.com") && !url.hostname.startsWith("fonts.")) return;

  // fonts: cache muna (bihira magbago)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((hit) =>
          hit || fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; })
        )
      )
    );
    return;
  }

  // ang page mismo: internet muna para updated, cache kapag offline
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("./index.html") || caches.match("./"))
        )
    );
  }
});
