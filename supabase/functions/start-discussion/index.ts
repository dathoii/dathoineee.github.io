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
    const action = String(body?.action ?? "enter_discussion").trim();
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
      return errorResponse("Chỉ chủ phòng mới có thể điều khiển thảo luận và đồng hồ.", 403, "NOT_ROOM_HOST");
    }

    const { data: round } = await admin
      .from("game_rounds")
      .select("*")
      .eq("room_id", roomId)
      .eq("round_number", room.current_round)
      .maybeSingle();

    if (!round || round.status === "ended") {
      return errorResponse("Không tìm thấy ván đấu đang diễn ra.", 400, "NO_ACTIVE_ROUND");
    }

    const now = new Date();
    const nowIso = now.toISOString();

    if (action === "enter_discussion") {
      await admin
        .from("game_rounds")
        .update({
          status: "discussing",
          started_at: round.started_at ?? nowIso,
        })
        .eq("id", round.id);

      await admin
        .from("rooms")
        .update({ status: "discussing" })
        .eq("id", roomId);

      return jsonResponse({ status: "discussing" });
    }

    if (action === "start_timer") {
      let remaining = round.timer_remaining_sec;
      if (remaining <= 0) {
        remaining = round.timer_duration_sec;
      }
      const { data: updated } = await admin
        .from("game_rounds")
        .update({
          status: "discussing",
          started_at: round.started_at ?? nowIso,
          timer_running: true,
          timer_started_at: nowIso,
          timer_remaining_sec: remaining,
        })
        .eq("id", round.id)
        .select("*")
        .single();

      await admin.from("rooms").update({ status: "discussing" }).eq("id", roomId);
      return jsonResponse({ round: updated });
    }

    if (action === "pause_timer") {
      let remaining = round.timer_remaining_sec;
      if (round.timer_running && round.timer_started_at) {
        const elapsed = Math.floor((now.getTime() - new Date(round.timer_started_at).getTime()) / 1000);
        remaining = Math.max(0, round.timer_remaining_sec - elapsed);
      }
      const { data: updated } = await admin
        .from("game_rounds")
        .update({
          timer_running: false,
          timer_started_at: null,
          timer_remaining_sec: remaining,
        })
        .eq("id", round.id)
        .select("*")
        .single();
      return jsonResponse({ round: updated });
    }

    if (action === "reset_timer") {
      const { data: updated } = await admin
        .from("game_rounds")
        .update({
          timer_running: false,
          timer_started_at: null,
          timer_remaining_sec: round.timer_duration_sec,
        })
        .eq("id", round.id)
        .select("*")
        .single();
      return jsonResponse({ round: updated });
    }

    if (action === "set_duration") {
      const durationSec = Number(body?.duration_sec);
      if (!Number.isInteger(durationSec) || durationSec < 60 || durationSec > 1800) {
        return errorResponse("Thời gian thảo luận phải từ 1 đến 30 phút.", 400, "INVALID_DURATION");
      }
      const { data: updated } = await admin
        .from("game_rounds")
        .update({
          timer_duration_sec: durationSec,
          timer_remaining_sec: durationSec,
          timer_running: false,
          timer_started_at: null,
        })
        .eq("id", round.id)
        .select("*")
        .single();
      return jsonResponse({ round: updated });
    }

    if (action === "next_turn") {
      const nextTurn = round.description_turn >= round.total_turns ? 1 : round.description_turn + 1;
      const { data: updated } = await admin
        .from("game_rounds")
        .update({ description_turn: nextTurn })
        .eq("id", round.id)
        .select("*")
        .single();
      return jsonResponse({ round: updated });
    }

    return errorResponse("Hành động không hợp lệ.", 400, "INVALID_ACTION");
  } catch {
    return errorResponse("Lỗi điều khiển giai đoạn thảo luận.", 500, "INTERNAL_ERROR");
  }
});
