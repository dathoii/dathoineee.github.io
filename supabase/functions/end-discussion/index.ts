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
      return errorResponse("Thiếu room_id.", 400, "MISSING_ROOM_ID");
    }

    const admin = getServiceClient();

    const { data: room } = await admin
      .from("rooms")
      .select("id, host_id, current_round, status")
      .eq("id", roomId)
      .maybeSingle();

    if (!room) {
      return errorResponse("Không tìm thấy phòng.", 404, "ROOM_NOT_FOUND");
    }
    if (room.host_id !== user.id) {
      return errorResponse("Chỉ chủ phòng mới có quyền kết thúc lượt chơi.", 403, "NOT_ROOM_HOST");
    }

    const nowIso = new Date().toISOString();

    await admin
      .from("game_rounds")
      .update({
        status: "ended",
        timer_running: false,
        timer_started_at: null,
        ended_at: nowIso,
      })
      .eq("room_id", roomId)
      .eq("round_number", room.current_round);

    await admin
      .from("rooms")
      .update({ status: "round_ended" })
      .eq("id", roomId);

    // Chủ phòng giữ trạng thái sẵn sàng, các người chơi khác về trạng thái chờ sẵn sàng ván mới
    await admin
      .from("room_players")
      .update({ is_ready: false })
      .eq("room_id", roomId)
      .neq("user_id", room.host_id);

    await admin
      .from("room_players")
      .update({ is_ready: true })
      .eq("room_id", roomId)
      .eq("user_id", room.host_id);

    return jsonResponse({ status: "round_ended" });
  } catch {
    return errorResponse("Không thể kết thúc lượt chơi.", 500, "INTERNAL_ERROR");
  }
});
