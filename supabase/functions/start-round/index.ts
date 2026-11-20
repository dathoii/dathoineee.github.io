import { handleOptions, errorResponse } from "../_shared/cors.ts";
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
    if (!roomId) {
      return errorResponse("Thiếu room_id.", 400, "MISSING_ROOM_ID");
    }

    const admin = getServiceClient();
    return await triggerAtomicRoundStart(admin, roomId, user.id);
  } catch {
    return errorResponse("Lỗi khi bắt đầu ván.", 500, "INTERNAL_ERROR");
  }
});
