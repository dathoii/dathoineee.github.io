const CHECK_COOLDOWN_MS = 15_000;
let lastCheckedAt = 0;

/**
 * Kiểm tra xem trên GitHub Pages có bản build frontend mới hơn bản đang chạy trong tab/PWA hay không.
 * Nếu có phiên bản mới hơn, tự động reload đúng 1 lần theo buildId để tránh dùng JS cũ.
 */
export async function checkForAppUpdate(force = false): Promise<void> {
  if (!import.meta.env.PROD || typeof window === "undefined") return;
  if (typeof __APP_BUILD_ID__ === "undefined") return;

  const now = Date.now();
  if (!force && now - lastCheckedAt < CHECK_COOLDOWN_MS) return;
  lastCheckedAt = now;

  try {
    const versionUrl = `${import.meta.env.BASE_URL}version.json?t=${now}`;
    const res = await fetch(versionUrl, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { buildId?: string };
    const remoteBuildId = typeof data?.buildId === "string" ? data.buildId : "";
    if (!remoteBuildId || remoteBuildId === __APP_BUILD_ID__) return;

    const reloadKey = `spy_reloaded_for_${remoteBuildId}`;
    try {
      if (window.sessionStorage.getItem(reloadKey) === "1") return;
      window.sessionStorage.setItem(reloadKey, "1");
    } catch {
      // Bỏ qua nếu trình duyệt chặn sessionStorage
    }

    window.location.reload();
  } catch {
    // Bỏ qua lỗi mạng tạm thời
  }
}
