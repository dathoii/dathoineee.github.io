import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  getServiceClient,
  sanitizeAvatarConfig,
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
    const roomId = typeof body?.room_id === "string" ? body.room_id.trim() : "";

    const admin = getServiceClient();
    const avatarConfig = await sanitizeAvatarConfig(
      admin,
      body?.avatar_config,
      typeof body?.avatar === "string" ? body.avatar : undefined
    );

    const nowIso = new Date().toISOString();

    await admin.from("profiles").upsert({
      id: user.id,
      avatar: avatarConfig.avatarId,
      avatar_config: avatarConfig,
      updated_at: nowIso,
    });

    if (roomId) {
      await admin
        .from("room_players")
        .update({
          avatar: avatarConfig.avatarId,
          avatar_config: avatarConfig,
          last_seen_at: nowIso,
        })
        .eq("room_id", roomId)
        .eq("user_id", user.id);
    } else {
      await admin
        .from("room_players")
        .update({
          avatar: avatarConfig.avatarId,
          avatar_config: avatarConfig,
          last_seen_at: nowIso,
        })
        .eq("user_id", user.id);
    }

    return jsonResponse({ avatar_config: avatarConfig });
  } catch {
    return errorResponse("Không thể lưu cấu hình avatar.", 500, "INTERNAL_ERROR");
  }
});
