import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import {
  ALLOWED_AVATARS,
  getAuthenticatedUser,
  getServiceClient,
} from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse("Phiên đăng nhập không hợp lệ.", 401, "UNAUTHORIZED");
    }

    const body = await req.json();
    const roomCode = String(body?.room_code ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const nickname = String(body?.nickname ?? "").trim();
    const avatar = String(body?.avatar ?? "avatar-dino").trim();

    if (roomCode.length !== 6) {
      return errorResponse("Mã phòng không hợp lệ!", 400, "INVALID_ROOM_CODE");
    }
    if (nickname.length < 1 || nickname.length > 24) {
      return errorResponse("Tên của bạn phải từ 1 đến 24 ký tự.", 400, "INVALID_NICKNAME");
    }
    if (!ALLOWED_AVATARS.has(avatar)) {
      return errorResponse("Avatar không hợp lệ.", 400, "INVALID_AVATAR");
    }

    const admin = getServiceClient();

    const { data: room, error: roomErr } = await admin
      .from("rooms")
      .select("id, room_code, status, max_players, expires_at")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (roomErr || !room) {
      return errorResponse("Mã phòng không hợp lệ!", 404, "ROOM_NOT_FOUND");
    }

    if (room.status === "closed" || new Date(room.expires_at).getTime() < Date.now()) {
      return errorResponse("Phòng này đã đóng hoặc hết hạn!", 400, "ROOM_CLOSED");
    }

    // Kiểm tra xem người chơi này đã ở trong phòng chưa (tránh tham gia nhiều lần hoặc hỗ trợ kết nối lại)
    const { data: existingSelf } = await admin
      .from("room_players")
      .select("id, nickname")
      .eq("room_id", room.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSelf) {
      await admin
        .from("room_players")
        .update({
          is_connected: true,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existingSelf.id);

      return jsonResponse({
        room_id: room.id,
        room_code: room.room_code,
        reconnected: true,
      });
    }

    if (room.status !== "waiting") {
      return errorResponse(
        "Phòng đang chơi rồi, vui lòng đợi ván mới hoặc phòng khác!",
        400,
        "ROOM_ALREADY_STARTED"
      );
    }

    const { count: currentCount } = await admin
      .from("room_players")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);

    if ((currentCount ?? 0) >= room.max_players) {
      return errorResponse("Phòng đã đủ số người chơi tối đa!", 400, "ROOM_FULL");
    }

    // Kiểm tra trùng tên trong cùng phòng (không phân biệt hoa/thường)
    const { data: playersInRoom } = await admin
      .from("room_players")
      .select("nickname")
      .eq("room_id", room.id);

    const normalizedTarget = nickname.toLowerCase();
    const isDuplicateName = (playersInRoom ?? []).some(
      (p) => p.nickname.trim().toLowerCase() === normalizedTarget
    );
    if (isDuplicateName) {
      return errorResponse(
        "Tên này bị trùng rồi, đổi tên khác nha!",
        409,
        "NICKNAME_TAKEN"
      );
    }

    const { error: insertErr } = await admin.from("room_players").insert({
      room_id: room.id,
      user_id: user.id,
      nickname,
      avatar,
      is_ready: false,
      is_connected: true,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return errorResponse(
          "Tên này bị trùng rồi, đổi tên khác nha!",
          409,
          "NICKNAME_TAKEN"
        );
      }
      return errorResponse("Không thể tham gia phòng lúc này.", 500, "JOIN_FAILED");
    }

    await admin.from("profiles").upsert({
      id: user.id,
      display_name: nickname,
      avatar,
      updated_at: new Date().toISOString(),
    });

    return jsonResponse({
      room_id: room.id,
      room_code: room.room_code,
      reconnected: false,
    });
  } catch {
    return errorResponse("Lỗi máy chủ khi tham gia phòng.", 500, "INTERNAL_ERROR");
  }
});
