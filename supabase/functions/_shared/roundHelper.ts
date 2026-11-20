import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { errorResponse, jsonResponse } from "./cors.ts";

export async function triggerAtomicRoundStart(
  admin: SupabaseClient,
  roomId: string,
  userId: string
): Promise<Response> {
  const { data, error } = await admin.rpc("assign_round_atomic", {
    p_room_id: roomId,
    p_host_user_id: userId,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("ROOM_NOT_FOUND")) {
      return errorResponse("Không tìm thấy phòng.", 404, "ROOM_NOT_FOUND");
    }
    if (msg.includes("ROOM_CLOSED")) {
      return errorResponse("Phòng đã đóng.", 400, "ROOM_CLOSED");
    }
    if (msg.includes("NOT_ROOM_HOST")) {
      return errorResponse("Chỉ chủ phòng mới có quyền bắt đầu trò chơi.", 403, "NOT_ROOM_HOST");
    }
    if (msg.includes("INVALID_ROOM_STATUS_FOR_START")) {
      return errorResponse("Ván đấu đã được bắt đầu trước đó.", 409, "ALREADY_STARTED");
    }
    if (msg.includes("NOT_ENOUGH_PLAYERS")) {
      return errorResponse(
        "Chưa đủ số lượng người chơi theo cấu hình phòng!",
        400,
        "NOT_ENOUGH_PLAYERS"
      );
    }
    if (msg.includes("PLAYERS_NOT_READY")) {
      return errorResponse(
        "Vẫn còn người chơi chưa bấm Sẵn sàng!",
        400,
        "PLAYERS_NOT_READY"
      );
    }
    if (msg.includes("INVALID_ROLE_TOTAL")) {
      return errorResponse(
        "Tổng số vai trò không khớp số người chơi.",
        400,
        "INVALID_ROLE_TOTAL"
      );
    }
    if (msg.includes("NO_MATCHING_WORD_PAIRS")) {
      return errorResponse(
        "Không tìm thấy cặp từ khóa phù hợp với danh mục và độ khó đã chọn.",
        400,
        "NO_MATCHING_WORD_PAIRS"
      );
    }
    return errorResponse("Không thể bắt đầu ván mới.", 500, "START_ROUND_FAILED");
  }

  return jsonResponse({ round: data });
}
