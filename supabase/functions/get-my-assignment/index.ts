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

    // Xác minh danh tính người chơi trực tiếp từ JWT user.id -> tuyệt đối không nhận player_id từ client!
    const { data: player } = await admin
      .from("room_players")
      .select("id, nickname, avatar")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!player) {
      return errorResponse("Bạn không phải thành viên của phòng này.", 403, "NOT_ROOM_MEMBER");
    }

    const { data: room } = await admin
      .from("rooms")
      .select("id, current_round, status")
      .eq("id", roomId)
      .maybeSingle();

    if (!room || room.current_round < 1 || !["revealing", "discussing"].includes(room.status)) {
      return errorResponse("Hiện chưa có ván đấu đang mở.", 400, "NO_ACTIVE_ROUND");
    }

    const { data: round } = await admin
      .from("game_rounds")
      .select("id, round_number, status")
      .eq("room_id", roomId)
      .eq("round_number", room.current_round)
      .maybeSingle();

    if (!round || round.status === "ended") {
      return errorResponse("Ván đấu này đã kết thúc, không thể xem lại từ khóa.", 403, "ROUND_ENDED");
    }

    const { data: assignment } = await admin
      .from("secret_assignments")
      .select("role, secret_word, acknowledged_at")
      .eq("round_id", round.id)
      .eq("player_id", player.id)
      .maybeSingle();

    if (!assignment) {
      return errorResponse("Chưa tìm thấy phân công cho bạn ở ván này.", 404, "ASSIGNMENT_NOT_FOUND");
    }

    // Chỉ trả về duy nhất dữ liệu của chính người chơi này, không ghi log từ khóa
    return jsonResponse({
      round_id: round.id,
      round_number: round.round_number,
      player_id: player.id,
      nickname: player.nickname,
      role: assignment.role,
      secret_word: assignment.secret_word,
      acknowledged_at: assignment.acknowledged_at,
    });
  } catch {
    return errorResponse("Không thể tải thông tin bí mật.", 500, "INTERNAL_ERROR");
  }
});
