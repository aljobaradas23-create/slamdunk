// SLAM DUNK — offline + mabilis na pagbukas
// Ipinapakita AGAD ang naka-save na kopya sa phone (walang hintay sa internet),
// tapos tahimik na kinukuha ang bagong bersyon para sa susunod na bukas.
const CACHE = "slamdunk-v2";
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

function fromCacheThenUpdate(req, fallbackKey) {
  return caches.open(CACHE).then((c) =>
    c.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req)
        .then((res) => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; })
        .catch(() => null);
      if (hit) return hit;                                   // agad-agad mula sa phone
      return net.then((res) => res || (fallbackKey ? c.match(fallbackKey) : null) || Response.error());
    })
  );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // cloud sync at pictures: laging diretso sa internet
  if (url.hostname.endsWith("googleapis.com") && !url.hostname.startsWith("fonts.")) return;

  // fonts: mula sa phone kung meron na
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(fromCacheThenUpdate(req));
    return;
  }

  // ang page mismo + icon
  if (url.origin === self.location.origin) {
    const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
    e.respondWith(fromCacheThenUpdate(isPage ? new Request("./index.html") : req, isPage ? "./index.html" : null));
  }
});
