import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import {
  ALLOWED_CATEGORIES,
  ALLOWED_DIFFICULTIES,
  getAuthenticatedUser,
  getServiceClient,
} from "../_shared/supabase.ts";

const HOST_OFFLINE_THRESHOLD_MS = 25_000;

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
    const action = String(body?.action ?? "heartbeat").trim();
    if (!roomId) {
      return errorResponse("Thiếu room_id.", 400, "MISSING_ROOM_ID");
    }

    const admin = getServiceClient();

    const { data: member } = await admin
      .from("room_players")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return errorResponse("Bạn không thuộc phòng này.", 403, "NOT_ROOM_MEMBER");
    }

    if (action === "heartbeat") {
      await admin
        .from("room_players")
        .update({
          is_connected: true,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", member.id);
      return jsonResponse({ ok: true });
    }

    if (action === "disconnect") {
      await admin
        .from("room_players")
        .update({ is_connected: false })
        .eq("id", member.id);
      return jsonResponse({ ok: true });
    }

    if (action === "claim_host") {
      const { data: room } = await admin
        .from("rooms")
        .select("id, host_id, status")
        .eq("id", roomId)
        .maybeSingle();

      if (!room || room.status === "closed") {
        return errorResponse("Phòng không tồn tại hoặc đã đóng.", 400, "ROOM_CLOSED");
      }
      if (room.host_id === user.id) {
        return jsonResponse({ host_id: user.id });
      }

      const { data: currentHost } = await admin
        .from("room_players")
        .select("id, is_connected, last_seen_at")
        .eq("room_id", roomId)
        .eq("user_id", room.host_id)
        .maybeSingle();

      const hostOfflineTooLong =
        !currentHost ||
        !currentHost.is_connected ||
        Date.now() - new Date(currentHost.last_seen_at).getTime() > HOST_OFFLINE_THRESHOLD_MS;

      if (!hostOfflineTooLong) {
        return errorResponse(
          "Chủ phòng hiện tại vẫn đang kết nối bình thường.",
          409,
          "HOST_STILL_ACTIVE"
        );
      }

      await admin
        .from("rooms")
        .update({ host_id: user.id })
        .eq("id", roomId);

      await admin
        .from("room_players")
        .update({ is_ready: true, is_connected: true, last_seen_at: new Date().toISOString() })
        .eq("id", member.id);

      return jsonResponse({ host_id: user.id, transferred: true });
    }

    if (action === "update_settings") {
      const { data: room } = await admin
        .from("rooms")
        .select("id, host_id, status")
        .eq("id", roomId)
        .maybeSingle();

      if (!room) {
        return errorResponse("Không tìm thấy phòng.", 404, "ROOM_NOT_FOUND");
      }
      if (room.host_id !== user.id) {
        return errorResponse("Chỉ chủ phòng mới được thay đổi cấu hình.", 403, "NOT_ROOM_HOST");
      }
      if (!["waiting", "round_ended"].includes(room.status)) {
        return errorResponse("Chỉ có thể đổi cấu hình khi đang ở phòng chờ.", 400, "INVALID_STATUS");
      }

      const maxPlayers = Number(body?.max_players);
      const undercoverCount = Number(body?.undercover_count);
      const mrWhiteCount = Number(body?.mr_white_count);
      const categoryFilter = String(body?.category_filter ?? "Tất cả").trim();
      const difficulty = String(body?.difficulty ?? "medium").trim();

      if (!Number.isInteger(maxPlayers) || maxPlayers < 3 || maxPlayers > 20) {
        return errorResponse("Số lượng người chơi phải từ 3 đến 20.", 400, "INVALID_MAX_PLAYERS");
      }
      if (!Number.isInteger(undercoverCount) || undercoverCount < 0 || !Number.isInteger(mrWhiteCount) || mrWhiteCount < 0) {
        return errorResponse("Số lượng vai trò không hợp lệ.", 400, "INVALID_ROLES");
      }
      if (undercoverCount + mrWhiteCount < 1) {
        return errorResponse("Cần ít nhất 1 Gián điệp hoặc Mr. White.", 400, "NO_INFILTRATOR");
      }
      const civilianCount = maxPlayers - undercoverCount - mrWhiteCount;
      if (civilianCount < 1) {
        return errorResponse("Phải có ít nhất 1 Dân thường.", 400, "INVALID_CIVILIAN");
      }
      if (!(ALLOWED_CATEGORIES as readonly string[]).includes(categoryFilter)) {
        return errorResponse("Danh mục không hợp lệ.", 400, "INVALID_CATEGORY");
      }
      if (!(ALLOWED_DIFFICULTIES as readonly string[]).includes(difficulty)) {
        return errorResponse("Độ khó không hợp lệ.", 400, "INVALID_DIFFICULTY");
      }

      const { count: currentPlayers } = await admin
        .from("room_players")
        .select("id", { count: "exact", head: true })
        .eq("room_id", roomId);

      if (maxPlayers < (currentPlayers ?? 0)) {
        return errorResponse(
          `Hiện đã có ${currentPlayers} người trong phòng, không thể giảm xuống ${maxPlayers}.`,
          400,
          "BELOW_CURRENT_PLAYERS"
        );
      }

      await admin
        .from("rooms")
        .update({
          max_players: maxPlayers,
          category_filter: categoryFilter,
          difficulty,
        })
        .eq("id", roomId);

      await admin
        .from("room_settings")
        .update({
          civilian_count: civilianCount,
          undercover_count: undercoverCount,
          mr_white_count: mrWhiteCount,
          updated_at: new Date().toISOString(),
        })
        .eq("room_id", roomId);

      return jsonResponse({ updated: true });
    }

    return errorResponse("Hành động không hợp lệ.", 400, "INVALID_ACTION");
  } catch {
    return errorResponse("Lỗi cập nhật trạng thái phòng.", 500, "INTERNAL_ERROR");
  }
});
