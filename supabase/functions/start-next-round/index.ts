import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/supabase.ts";
import { triggerAtomicRoundStart } from "../_shared/roundHelper.ts";

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
    const action = String(body?.action ?? "start").trim();
    if (!roomId) {
      return errorResponse("Thiếu room_id.", 400, "MISSING_ROOM_ID");
    }

    const admin = getServiceClient();

    if (action === "return_to_lobby") {
      const { data: room } = await admin
        .from("rooms")
        .select("id, host_id, status")
        .eq("id", roomId)
        .maybeSingle();

      if (!room) {
        return errorResponse("Không tìm thấy phòng.", 404, "ROOM_NOT_FOUND");
      }
      if (room.host_id !== user.id) {
        return errorResponse("Chỉ chủ phòng mới có thể đưa cả nhóm về phòng chờ.", 403, "NOT_ROOM_HOST");
      }

      await admin
        .from("rooms")
        .update({ status: "waiting" })
        .eq("id", roomId);

      // Giữ chủ phòng ở trạng thái sẵn sàng, người chơi khác đặt lại chưa sẵn sàng
      await admin
        .from("room_players")
        .update({ is_ready: false })
        .eq("room_id", roomId)
        .neq("user_id", user.id);

      await admin
        .from("room_players")
        .update({ is_ready: true })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      return jsonResponse({ status: "waiting" });
    }

    return await triggerAtomicRoundStart(admin, roomId, user.id);
  } catch {
    return errorResponse("Lỗi khi chuẩn bị ván mới.", 500, "INTERNAL_ERROR");
  }
});
