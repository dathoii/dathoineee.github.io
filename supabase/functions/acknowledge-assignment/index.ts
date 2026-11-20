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
    const roundId = String(body?.round_id ?? "").trim();
    if (!roomId || !roundId) {
      return errorResponse("Thiếu thông tin phòng hoặc ván đấu.", 400, "MISSING_PARAMS");
    }

    const admin = getServiceClient();

    const { data: player } = await admin
      .from("room_players")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!player) {
      return errorResponse("Bạn không thuộc phòng này.", 403, "NOT_ROOM_MEMBER");
    }

    const { data: round } = await admin
      .from("game_rounds")
      .select("id, room_id, status")
      .eq("id", roundId)
      .eq("room_id", roomId)
      .maybeSingle();

    if (!round) {
      return errorResponse("Không tìm thấy ván đấu.", 404, "ROUND_NOT_FOUND");
    }

    const nowIso = new Date().toISOString();

    await admin
      .from("secret_assignments")
      .update({ acknowledged_at: nowIso })
      .eq("round_id", round.id)
      .eq("player_id", player.id)
      .is("acknowledged_at", null);

    await admin
      .from("round_acknowledgements")
      .upsert(
        {
          round_id: round.id,
          player_id: player.id,
          acknowledged_at: nowIso,
        },
        { onConflict: "round_id,player_id" }
      );

    // Kiểm tra xem tất cả người chơi hiện tại trong phòng đã xác nhận hết chưa
    const [{ count: totalPlayers }, { count: ackCount }] = await Promise.all([
      admin
        .from("room_players")
        .select("id", { count: "exact", head: true })
        .eq("room_id", roomId),
      admin
        .from("round_acknowledgements")
        .select("player_id", { count: "exact", head: true })
        .eq("round_id", round.id),
    ]);

    let transitioned = false;
    if (
      round.status === "revealing" &&
      (totalPlayers ?? 0) > 0 &&
      (ackCount ?? 0) >= (totalPlayers ?? 0)
    ) {
      await admin
        .from("game_rounds")
        .update({
          status: "discussing",
          started_at: nowIso,
        })
        .eq("id", round.id)
        .eq("status", "revealing");

      await admin
        .from("rooms")
        .update({ status: "discussing" })
        .eq("id", roomId)
        .eq("status", "revealing");

      transitioned = true;
    }

    return jsonResponse({
      acknowledged: true,
      acknowledged_count: ackCount ?? 0,
      total_players: totalPlayers ?? 0,
      transitioned_to_discussion: transitioned,
    });
  } catch {
    return errorResponse("Không thể xác nhận đã nhớ từ khóa.", 500, "INTERNAL_ERROR");
  }
});
