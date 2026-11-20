import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import {
  ALLOWED_DIFFICULTIES,
  WORD_CATEGORIES,
  getAuthenticatedUser,
  getServiceClient,
} from "../_shared/supabase.ts";

interface WordPairPayload {
  category?: unknown;
  civilian_word?: unknown;
  undercover_word?: unknown;
  difficulty?: unknown;
  note?: unknown;
  is_active?: unknown;
}

function validateWordPair(raw: WordPairPayload) {
  const category = String(raw?.category ?? "").trim();
  const civilianWord = String(raw?.civilian_word ?? "").trim();
  const undercoverWord = String(raw?.undercover_word ?? "").trim();
  const difficulty = String(raw?.difficulty ?? "medium").trim();
  const note = String(raw?.note ?? "").trim();
  const isActive = raw?.is_active === undefined ? true : Boolean(raw.is_active);

  if (!(WORD_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Danh mục từ khóa không hợp lệ." };
  }
  if (!civilianWord || !undercoverWord) {
    return { error: "Từ khóa Civilian và Undercover không được để trống." };
  }
  if (civilianWord.toLowerCase() === undercoverWord.toLowerCase()) {
    return { error: "Từ khóa Civilian và Undercover phải khác nhau." };
  }
  if (!(ALLOWED_DIFFICULTIES as readonly string[]).includes(difficulty)) {
    return { error: "Độ khó không hợp lệ." };
  }

  return {
    data: {
      category,
      civilian_word: civilianWord,
      undercover_word: undercoverWord,
      difficulty,
      note,
      is_active: isActive,
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

    // Xác minh quyền Admin trực tiếp từ bảng admin_roles phía backend
    const { data: roleRow } = await admin
      .from("admin_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleRow || !["admin", "super_admin"].includes(roleRow.role)) {
      return errorResponse(
        "Bạn không có quyền quản trị kho từ khóa.",
        403,
        "FORBIDDEN_ADMIN_ONLY"
      );
    }

    const body = await req.json();
    const action = String(body?.action ?? "list").trim();

    if (action === "verify") {
      return jsonResponse({ is_admin: true, role: roleRow.role });
    }

    if (action === "stats") {
      const { data: rows, error } = await admin
        .from("word_pairs")
        .select("category, difficulty, is_active");
      if (error) {
        return errorResponse("Không thể tải thống kê kho từ khóa.", 500, "DB_ERROR");
      }

      const byCategory: Record<string, number> = {};
      for (const c of WORD_CATEGORIES) byCategory[c] = 0;

      let activeTotal = 0;
      for (const r of rows ?? []) {
        if (r.is_active) {
          activeTotal++;
          byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
        }
      }

      return jsonResponse({
        total: (rows ?? []).length,
        active_total: activeTotal,
        by_category: byCategory,
      });
    }

    if (action === "list") {
      const category = String(body?.category ?? "Tất cả").trim();
      const difficulty = String(body?.difficulty ?? "all").trim();
      const search = String(body?.search ?? "").trim();

      let query = admin
        .from("word_pairs")
        .select("*")
        .order("created_at", { ascending: false });

      if (category && category !== "Tất cả") {
        query = query.eq("category", category);
      }
      if (difficulty && difficulty !== "all") {
        query = query.eq("difficulty", difficulty);
      }
      if (search) {
        const safe = search.replace(/[%_,()]/g, "");
        query = query.or(
          `civilian_word.ilike.%${safe}%,undercover_word.ilike.%${safe}%,note.ilike.%${safe}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        return errorResponse("Không thể tải danh sách từ khóa.", 500, "DB_ERROR");
      }

      return jsonResponse({ items: data ?? [] });
    }

    if (action === "create") {
      const validated = validateWordPair(body);
      if ("error" in validated) {
        return errorResponse(validated.error, 400, "VALIDATION_ERROR");
      }

      const { data, error } = await admin
        .from("word_pairs")
        .insert(validated.data)
        .select("*")
        .single();

      if (error) {
        return errorResponse("Không thể thêm cặp từ khóa.", 500, "CREATE_FAILED");
      }

      return jsonResponse({ item: data }, 201);
    }

    if (action === "update") {
      const id = String(body?.id ?? "").trim();
      if (!id) {
        return errorResponse("Thiếu ID cặp từ khóa.", 400, "MISSING_ID");
      }
      const validated = validateWordPair(body);
      if ("error" in validated) {
        return errorResponse(validated.error, 400, "VALIDATION_ERROR");
      }

      const { data, error } = await admin
        .from("word_pairs")
        .update({
          ...validated.data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return errorResponse("Không thể cập nhật cặp từ khóa.", 500, "UPDATE_FAILED");
      }

      return jsonResponse({ item: data });
    }

    if (action === "delete") {
      const id = String(body?.id ?? "").trim();
      if (!id) {
        return errorResponse("Thiếu ID cặp từ khóa.", 400, "MISSING_ID");
      }

      const { error } = await admin.from("word_pairs").delete().eq("id", id);
      if (error) {
        return errorResponse("Không thể xóa cặp từ khóa.", 500, "DELETE_FAILED");
      }

      return jsonResponse({ deleted: true });
    }

    if (action === "import") {
      const items = Array.isArray(body?.items) ? body.items : [];
      if (items.length === 0 || items.length > 500) {
        return errorResponse(
          "Dữ liệu nhập phải gồm từ 1 đến 500 cặp từ khóa.",
          400,
          "INVALID_IMPORT"
        );
      }

      const validRows = [];
      for (let i = 0; i < items.length; i++) {
        const res = validateWordPair(items[i]);
        if ("error" in res) {
          return errorResponse(
            `Dòng ${i + 1}: ${res.error}`,
            400,
            "IMPORT_ROW_INVALID"
          );
        }
        validRows.push(res.data);
      }

      const { data, error } = await admin
        .from("word_pairs")
        .insert(validRows)
        .select("id");

      if (error) {
        return errorResponse("Không thể nhập dữ liệu từ khóa.", 500, "IMPORT_FAILED");
      }

      return jsonResponse({ imported_count: data?.length ?? validRows.length });
    }

    if (action === "export") {
      const { data, error } = await admin
        .from("word_pairs")
        .select("category, civilian_word, undercover_word, difficulty, note, is_active")
        .order("category", { ascending: true });

      if (error) {
        return errorResponse("Không thể xuất dữ liệu.", 500, "EXPORT_FAILED");
      }
      return jsonResponse({ items: data ?? [] });
    }

    return errorResponse("Hành động không hợp lệ.", 400, "INVALID_ACTION");
  } catch {
    return errorResponse("Lỗi quản trị kho từ khóa.", 500, "INTERNAL_ERROR");
  }
});
