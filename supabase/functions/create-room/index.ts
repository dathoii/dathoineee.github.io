import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import {
  ALLOWED_AVATARS,
  ALLOWED_CATEGORIES,
  ALLOWED_DIFFICULTIES,
  generateRoomCode,
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
    const roomName = String(body?.room_name ?? "").trim();
    const nickname = String(body?.nickname ?? "").trim();
    const avatar = String(body?.avatar ?? "avatar-blue-shades").trim();
    const maxPlayers = Number(body?.max_players);
    const undercoverCount = Number(body?.undercover_count);
    const mrWhiteCount = Number(body?.mr_white_count);
    const categoryFilter = String(body?.category_filter ?? "Tất cả").trim();
    const difficulty = String(body?.difficulty ?? "medium").trim();

    if (roomName.length < 1 || roomName.length > 40) {
      return errorResponse("Tên phòng phải từ 1 đến 40 ký tự.", 400, "INVALID_ROOM_NAME");
    }
    if (nickname.length < 1 || nickname.length > 24) {
      return errorResponse("Biệt danh chủ phòng phải từ 1 đến 24 ký tự.", 400, "INVALID_NICKNAME");
    }
    if (!ALLOWED_AVATARS.has(avatar)) {
      return errorResponse("Avatar không hợp lệ.", 400, "INVALID_AVATAR");
    }
    if (!Number.isInteger(maxPlayers) || maxPlayers < 3 || maxPlayers > 20) {
      return errorResponse("Số lượng người chơi phải từ 3 đến 20.", 400, "INVALID_MAX_PLAYERS");
    }
    if (!Number.isInteger(undercoverCount) || undercoverCount < 0) {
      return errorResponse("Số lượng Gián điệp không được âm.", 400, "INVALID_UNDERCOVER");
    }
    if (!Number.isInteger(mrWhiteCount) || mrWhiteCount < 0) {
      return errorResponse("Số lượng Mr. White không được âm.", 400, "INVALID_MR_WHITE");
    }
    if (undercoverCount + mrWhiteCount < 1) {
      return errorResponse("Phải có ít nhất 1 Gián điệp hoặc Mr. White.", 400, "NO_INFILTRATOR");
    }

    const civilianCount = maxPlayers - undercoverCount - mrWhiteCount;
    if (civilianCount < 1) {
      return errorResponse("Phải có ít nhất 1 Dân thường.", 400, "INVALID_CIVILIAN_COUNT");
    }
    if (!(ALLOWED_CATEGORIES as readonly string[]).includes(categoryFilter)) {
      return errorResponse("Danh mục từ khóa không hợp lệ.", 400, "INVALID_CATEGORY");
    }
    if (!(ALLOWED_DIFFICULTIES as readonly string[]).includes(difficulty)) {
      return errorResponse("Độ khó không hợp lệ.", 400, "INVALID_DIFFICULTY");
    }

    const admin = getServiceClient();

    // Kiểm tra kho từ khóa có tồn tại ít nhất 1 cặp từ phù hợp (chỉ kiểm tra có/không, không trả số lượng)
    let wordCheck = admin
      .from("word_pairs")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("difficulty", difficulty);
    if (categoryFilter !== "Tất cả") {
      wordCheck = wordCheck.eq("category", categoryFilter);
    }
    const { count, error: checkError } = await wordCheck;
    if (checkError) {
      return errorResponse("Không thể kiểm tra cấu hình từ khóa.", 500, "DB_ERROR");
    }
    if (!count || count < 1) {
      return errorResponse(
        "Danh mục và độ khó này hiện chưa có từ khóa phù hợp. Vui lòng chọn cấu hình khác.",
        400,
        "NO_MATCHING_WORD_PAIRS"
      );
    }

    // Tạo mã phòng duy nhất (tối đa 5 lần thử tránh trùng)
    let createdRoom: { id: string; room_code: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidateCode = generateRoomCode();
      const { data: roomData, error: roomErr } = await admin
        .from("rooms")
        .insert({
          room_code: candidateCode,
          room_name: roomName,
          host_id: user.id,
          status: "waiting",
          max_players: maxPlayers,
          category_filter: categoryFilter,
          difficulty,
          current_round: 0,
        })
        .select("id, room_code")
        .single();

      if (!roomErr && roomData) {
        createdRoom = roomData;
        break;
      }
      if (roomErr?.code !== "23505") {
        return errorResponse("Không thể tạo phòng lúc này.", 500, "CREATE_ROOM_FAILED");
      }
    }

    if (!createdRoom) {
      return errorResponse("Không thể tạo mã phòng duy nhất, vui lòng thử lại.", 500, "CODE_COLLISION");
    }

    const { error: settingsErr } = await admin.from("room_settings").insert({
      room_id: createdRoom.id,
      civilian_count: civilianCount,
      undercover_count: undercoverCount,
      mr_white_count: mrWhiteCount,
    });
    if (settingsErr) {
      await admin.from("rooms").delete().eq("id", createdRoom.id);
      return errorResponse("Không thể lưu thiết lập vai trò.", 500, "SETTINGS_FAILED");
    }

    const { error: playerErr } = await admin.from("room_players").insert({
      room_id: createdRoom.id,
      user_id: user.id,
      nickname,
      avatar,
      is_ready: true,
      is_connected: true,
    });
    if (playerErr) {
      await admin.from("rooms").delete().eq("id", createdRoom.id);
      return errorResponse("Không thể thêm chủ phòng vào phòng chờ.", 500, "HOST_JOIN_FAILED");
    }

    await admin.from("profiles").upsert({
      id: user.id,
      display_name: nickname,
      avatar,
      updated_at: new Date().toISOString(),
    });

    return jsonResponse({
      room_id: createdRoom.id,
      room_code: createdRoom.room_code,
    });
  } catch {
    return errorResponse("Lỗi máy chủ khi tạo phòng.", 500, "INTERNAL_ERROR");
  }
});
