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
    if (!roomId) {
      return errorResponse("Thiếu mã định danh phòng.", 400, "MISSING_ROOM_ID");
    }

    const admin = getServiceClient();

    const { data: room } = await admin
      .from("rooms")
      .select("id, host_id, status")
      .eq("id", roomId)
      .maybeSingle();

    if (!room) {
      return jsonResponse({ left: true });
    }

    await admin
      .from("room_players")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", user.id);

    const { data: remaining } = await admin
      .from("room_players")
      .select("user_id, is_connected, joined_at")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });

    if (!remaining || remaining.length === 0) {
      await admin
        .from("rooms")
        .update({ status: "closed" })
        .eq("id", roomId);
    } else if (room.host_id === user.id) {
      // Chuyển quyền chủ phòng sang người còn lại (ưu tiên người đang kết nối)
      const nextHost =
        remaining.find((p) => p.is_connected) ?? remaining[0];
      await admin
        .from("rooms")
        .update({ host_id: nextHost.user_id })
        .eq("id", roomId);
    }

    return jsonResponse({ left: true });
  } catch {
    return errorResponse("Lỗi khi rời phòng.", 500, "INTERNAL_ERROR");
  }
});
