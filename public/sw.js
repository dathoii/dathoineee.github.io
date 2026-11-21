// Service Worker hỗ trợ cài đặt PWA trên điện thoại.
// KHÔNG cache HTML/index.html, version.json hay API Supabase để người chơi luôn nhận bản build & dữ liệu realtime mới nhất.
const CACHE_NAME = "dathoineee-spy-shell-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["./manifest.webmanifest", "./icons/icon-192.png"]).catch(() => {})
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (
    event.request.method !== "GET" ||
    url.includes("supabase.co") ||
    url.includes("/functions/v1/")
  ) {
    return;
  }

  const isHtmlOrVersion =
    event.request.mode === "navigate" ||
    url.endsWith("/") ||
    url.endsWith("/index.html") ||
    url.includes("version.json");

  if (isHtmlOrVersion) {
    event.respondWith(
      fetch(new Request(event.request, { cache: "no-store" })).catch(() =>
        caches.match(event.request)
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
