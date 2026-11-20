import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse("Phiên đăng nhập không hợp lệ.", 401, "UNAUTHORIZED");
    }

    const body = await req.json();
    const roomId = String(body?.room_id ?? "").trim();
    const isReady = Boolean(body?.is_ready);
    if (!roomId) {
      return errorResponse("Thiếu room_id.", 400, "MISSING_ROOM_ID");
    }

    const admin = getServiceClient();

    const { data, error } = await admin
      .from("room_players")
      .update({
        is_ready: isReady,
        is_connected: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .select("id, is_ready")
      .maybeSingle();

    if (error || !data) {
      return errorResponse("Bạn không thuộc phòng này.", 403, "NOT_ROOM_MEMBER");
    }

    return jsonResponse({ is_ready: data.is_ready });
  } catch {
    return errorResponse("Không thể cập nhật trạng thái sẵn sàng.", 500, "INTERNAL_ERROR");
  }
});
