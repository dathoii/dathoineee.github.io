import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import {
  ASSET_CATEGORIES,
  getAuthenticatedUser,
  getServiceClient,
} from "../_shared/supabase.ts";

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}$/;

function parseAssetPayload(raw: Record<string, unknown>, isCreate: boolean) {
  const id = String(raw?.id ?? "").trim().toLowerCase();
  const name = String(raw?.name ?? "").trim();
  const category = String(raw?.category ?? "").trim();
  const imageUrl = String(raw?.image_url ?? "").trim();
  const storagePath =
    typeof raw?.storage_path === "string" && raw.storage_path.trim()
      ? raw.storage_path.trim()
      : null;
  const description = String(raw?.description ?? "").trim();
  const enabled = raw?.enabled === undefined ? true : Boolean(raw.enabled);
  const scale = Number(raw?.scale ?? 1);
  const positionX = Number(raw?.position_x ?? 0);
  const positionY = Number(raw?.position_y ?? 0);
  const zIndex = Number(raw?.z_index ?? (category === "wings" ? 10 : category === "avatar" ? 20 : 32));

  if (isCreate && !ID_PATTERN.test(id)) {
    return {
      error:
        "Mã ID vật phẩm phải gồm 2–63 ký tự chữ thường, số, gạch ngang (-) hoặc gạch dưới (_).",
    };
  }
  if (name.length < 1 || name.length > 60) {
    return { error: "Tên vật phẩm phải từ 1 đến 60 ký tự." };
  }
  if (!(ASSET_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Danh mục vật phẩm không hợp lệ." };
  }
  if (isCreate && !imageUrl) {
    return { error: "Thiếu đường dẫn hình ảnh vật phẩm." };
  }
  if (!Number.isFinite(scale) || scale < 0.2 || scale > 3) {
    return { error: "Tỷ lệ Scale phải trong khoảng 0.2 đến 3.0." };
  }
  if (!Number.isFinite(positionX) || positionX < -150 || positionX > 150) {
    return { error: "Position X phải từ -150 đến 150 (%)." };
  }
  if (!Number.isFinite(positionY) || positionY < -150 || positionY > 150) {
    return { error: "Position Y phải từ -150 đến 150 (%)." };
  }
  if (!Number.isInteger(zIndex) || zIndex < 0 || zIndex > 100) {
    return { error: "Z-index phải là số nguyên từ 0 đến 100." };
  }

  return {
    data: {
      id,
      name,
      category,
      image_url: imageUrl,
      storage_path: storagePath,
      description,
      enabled,
      scale: Number(scale.toFixed(2)),
      position_x: Number(positionX.toFixed(2)),
      position_y: Number(positionY.toFixed(2)),
      z_index: zIndex,
    },
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse("Vui lòng đăng nhập tài khoản Admin.", 401, "UNAUTHORIZED");
    }

    const admin = getServiceClient();

    const { data: roleRow } = await admin
      .from("admin_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleRow || !["admin", "super_admin"].includes(roleRow.role)) {
      return errorResponse("Bạn không có quyền quản trị tài nguyên.", 403, "FORBIDDEN_ADMIN_ONLY");
    }

    const body = await req.json();
    const action = String(body?.action ?? "list").trim();

    if (action === "list") {
      const { data, error } = await admin
        .from("avatar_assets")
        .select("*")
        .order("category", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        return errorResponse("Không thể tải danh sách tài nguyên.", 500, "DB_ERROR");
      }

      return jsonResponse({ items: data ?? [] });
    }

    if (action === "create") {
      const parsed = parseAssetPayload(body, true);
      if ("error" in parsed) {
        return errorResponse(parsed.error, 400, "VALIDATION_ERROR");
      }

      const { data: existing } = await admin
        .from("avatar_assets")
        .select("id")
        .eq("id", parsed.data.id)
        .maybeSingle();

      if (existing) {
        return errorResponse(
          `Mã vật phẩm "${parsed.data.id}" đã tồn tại. Không cho phép upload trùng ID!`,
          409,
          "DUPLICATE_ASSET_ID"
        );
      }

      const { data, error } = await admin
        .from("avatar_assets")
        .insert(parsed.data)
        .select("*")
        .single();

      if (error) {
        return errorResponse("Không thể lưu vật phẩm mới.", 500, "CREATE_FAILED");
      }

      return jsonResponse({ item: data }, 201);
    }

    if (action === "update") {
      const id = String(body?.id ?? "").trim();
      if (!id) {
        return errorResponse("Thiếu ID vật phẩm.", 400, "MISSING_ID");
      }

      const { data: current } = await admin
        .from("avatar_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!current) {
        return errorResponse("Không tìm thấy vật phẩm.", 404, "NOT_FOUND");
      }

      const merged = {
        id: current.id,
        name: body?.name ?? current.name,
        category: body?.category ?? current.category,
        image_url: body?.image_url ?? current.image_url,
        storage_path: body?.storage_path !== undefined ? body.storage_path : current.storage_path,
        description: body?.description ?? current.description,
        enabled: body?.enabled !== undefined ? body.enabled : current.enabled,
        scale: body?.scale ?? current.scale,
        position_x: body?.position_x ?? current.position_x,
        position_y: body?.position_y ?? current.position_y,
        z_index: body?.z_index ?? current.z_index,
      };

      const parsed = parseAssetPayload(merged, false);
      if ("error" in parsed) {
        return errorResponse(parsed.error, 400, "VALIDATION_ERROR");
      }

      const { data, error } = await admin
        .from("avatar_assets")
        .update({
          name: parsed.data.name,
          category: parsed.data.category,
          image_url: parsed.data.image_url,
          storage_path: parsed.data.storage_path,
          description: parsed.data.description,
          enabled: parsed.data.enabled,
          scale: parsed.data.scale,
          position_x: parsed.data.position_x,
          position_y: parsed.data.position_y,
          z_index: parsed.data.z_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return errorResponse("Không thể cập nhật vật phẩm.", 500, "UPDATE_FAILED");
      }

      return jsonResponse({ item: data });
    }

    if (action === "delete") {
      const id = String(body?.id ?? "").trim();
      if (!id) {
        return errorResponse("Thiếu ID vật phẩm.", 400, "MISSING_ID");
      }

      const { data: target } = await admin
        .from("avatar_assets")
        .select("id, category, storage_path")
        .eq("id", id)
        .maybeSingle();

      if (!target) {
        return errorResponse("Vật phẩm không tồn tại.", 404, "NOT_FOUND");
      }

      const { error: delErr } = await admin
        .from("avatar_assets")
        .delete()
        .eq("id", id);

      if (delErr) {
        return errorResponse("Không thể xóa vật phẩm.", 500, "DELETE_FAILED");
      }

      if (target.storage_path) {
        await admin.storage.from("avatar-assets").remove([target.storage_path]);
      }

      // Chuyển cấu hình các người chơi đang dùng vật phẩm bị xóa sang trạng thái an toàn
      if (target.category === "avatar") {
        const { data: fallbackRow } = await admin
          .from("avatar_assets")
          .select("id")
          .eq("category", "avatar")
          .eq("enabled", true)
          .limit(1)
          .maybeSingle();

        const safeFallbackId = fallbackRow?.id ?? "avatar-dino";

        const { data: affectedProfiles } = await admin
          .from("profiles")
          .select("id, avatar_config")
          .eq("avatar", id);

        for (const p of affectedProfiles ?? []) {
          const cfg = (p.avatar_config ?? {}) as Record<string, unknown>;
          await admin
            .from("profiles")
            .update({
              avatar: safeFallbackId,
              avatar_config: { ...cfg, avatarId: safeFallbackId },
            })
            .eq("id", p.id);
        }

        const { data: affectedPlayers } = await admin
          .from("room_players")
          .select("id, avatar_config")
          .eq("avatar", id);

        for (const rp of affectedPlayers ?? []) {
          const cfg = (rp.avatar_config ?? {}) as Record<string, unknown>;
          await admin
            .from("room_players")
            .update({
              avatar: safeFallbackId,
              avatar_config: { ...cfg, avatarId: safeFallbackId },
            })
            .eq("id", rp.id);
        }
      }

      return jsonResponse({ deleted: true, id });
    }

    return errorResponse("Hành động không hợp lệ.", 400, "INVALID_ACTION");
  } catch {
    return errorResponse("Lỗi quản trị kho tài nguyên.", 500, "INTERNAL_ERROR");
  }
});
