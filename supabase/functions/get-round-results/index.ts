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

    // Chỉ thành viên trong phòng mới được xem kết quả ván đấu
    const { data: member } = await admin
      .from("room_players")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return errorResponse("Bạn không phải thành viên của phòng này.", 403, "NOT_ROOM_MEMBER");
    }

    const { data: room } = await admin
      .from("rooms")
      .select("id, room_name, current_round, status")
      .eq("id", roomId)
      .maybeSingle();

    if (!room || room.current_round < 1) {
      return errorResponse("Phòng chưa có ván đấu nào.", 400, "NO_ROUND_FOUND");
    }

    // TUYỆT ĐỐI chỉ công khai vai trò và từ khóa khi ván đấu đã kết thúc
    if (room.status !== "round_ended") {
      return errorResponse(
        "Ván đấu chưa kết thúc, chưa thể hiển thị từ khóa và gián điệp.",
        403,
        "ROUND_NOT_ENDED"
      );
    }

    const { data: round } = await admin
      .from("game_rounds")
      .select("id, round_number, status")
      .eq("room_id", roomId)
      .eq("round_number", room.current_round)
      .maybeSingle();

    if (!round || round.status !== "ended") {
      return errorResponse(
        "Kết quả ván đấu hiện chưa sẵn sàng.",
        403,
        "ROUND_NOT_ENDED"
      );
    }

    // Lấy cặp từ khóa của ván
    const { data: usage } = await admin
      .from("round_word_usage")
      .select("word_pair_id")
      .eq("round_id", round.id)
      .maybeSingle();

    let wordPair: Record<string, unknown> | null = null;
    if (usage?.word_pair_id) {
      const { data: pairRow } = await admin
        .from("word_pairs")
        .select("category, civilian_word, undercover_word, difficulty, note")
        .eq("id", usage.word_pair_id)
        .maybeSingle();
      wordPair = pairRow ?? null;
    }

    // Lấy danh sách phân công từ khóa & thông tin người chơi trong phòng
    const [{ data: assignments }, { data: players }] = await Promise.all([
      admin
        .from("secret_assignments")
        .select("player_id, role, secret_word")
        .eq("round_id", round.id),
      admin
        .from("room_players")
        .select("id, user_id, nickname, avatar, avatar_config, joined_at")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true }),
    ]);

    const playerById = new Map(
      (players ?? []).map((p) => [p.id as string, p])
    );

    const roleOrder: Record<string, number> = {
      undercover: 0,
      mr_white: 1,
      civilian: 2,
    };

    const results = (assignments ?? [])
      .map((a) => {
        const player = playerById.get(a.player_id as string);
        if (!player) return null;
        return {
          player_id: a.player_id,
          user_id: player.user_id,
          nickname: player.nickname,
          avatar: player.avatar,
          avatar_config: player.avatar_config,
          role: a.role,
          secret_word: a.secret_word,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));

    return jsonResponse({
      round_id: round.id,
      round_number: round.round_number,
      room_name: room.room_name,
      word_pair: wordPair,
      results,
    });
  } catch {
    return errorResponse("Không thể tải kết quả ván đấu.", 500, "INTERNAL_ERROR");
  }
});
