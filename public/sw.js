// Service Worker tối giản hỗ trợ cài đặt PWA trên điện thoại.
// KHÔNG cache các API Supabase hoặc Edge Functions để bảo đảm dữ liệu realtime luôn mới và an toàn.
const CACHE_NAME = "dathoineee-spy-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["./", "./manifest.webmanifest", "./icons/icon-192.png"]).catch(() => {})
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
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
