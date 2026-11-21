import {
  ApiError,
  invokeEdgeFunction,
  isSupabaseConfigured,
  requireSupabase,
  supabase,
} from "./supabase";
import type { AssetCategory, AvatarAsset, AvatarConfig } from "../types/game";
import { FALLBACK_AVATAR_ASSETS } from "../utils/avatars";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/webp"]);

export async function fetchPublicAvatarAssets(): Promise<AvatarAsset[]> {
  if (!isSupabaseConfigured || !supabase) {
    return FALLBACK_AVATAR_ASSETS;
  }

  const { data, error } = await supabase
    .from("avatar_assets")
    .select("*")
    .eq("enabled", true)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return FALLBACK_AVATAR_ASSETS;
  }

  return data.map(coerceAvatarAsset);
}

export function coerceAvatarAsset(row: Record<string, unknown>): AvatarAsset {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    category: (row.category as AssetCategory) ?? "other",
    image_url: String(row.image_url ?? ""),
    storage_path: typeof row.storage_path === "string" ? row.storage_path : null,
    description: String(row.description ?? ""),
    enabled: Boolean(row.enabled ?? true),
    scale: Number(row.scale ?? 1),
    position_x: Number(row.position_x ?? 0),
    position_y: Number(row.position_y ?? 0),
    z_index: Number(row.z_index ?? 30),
    is_builtin: Boolean(row.is_builtin ?? false),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function savePlayerAvatarConfig(
  config: AvatarConfig,
  roomId?: string
): Promise<AvatarConfig> {
  if (!isSupabaseConfigured) {
    return config;
  }

  const res = await invokeEdgeFunction<{ avatar_config: AvatarConfig }>(
    "update-avatar-config",
    {
      avatar_config: config,
      ...(roomId ? { room_id: roomId } : {}),
    }
  );
  return res.avatar_config;
}

export async function fetchProfileAvatarConfig(): Promise<AvatarConfig | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("avatar_config")
    .eq("id", userId)
    .maybeSingle();

  if (data?.avatar_config && typeof data.avatar_config === "object") {
    return data.avatar_config as AvatarConfig;
  }
  return null;
}

// ============================================================================
// ADMIN ASSET MANAGER APIs
// ============================================================================

export async function adminListAvatarAssets(): Promise<AvatarAsset[]> {
  const res = await invokeEdgeFunction<{ items: Record<string, unknown>[] }>(
    "admin-manage-assets",
    { action: "list" },
    { requireExistingAuth: true }
  );
  return (res.items ?? []).map(coerceAvatarAsset);
}

export interface CreateAvatarAssetInput {
  id: string;
  name: string;
  category: AssetCategory;
  image_url: string;
  storage_path?: string | null;
  description?: string;
  enabled?: boolean;
  scale?: number;
  position_x?: number;
  position_y?: number;
  z_index?: number;
}

export async function adminCreateAvatarAsset(
  input: CreateAvatarAssetInput
): Promise<AvatarAsset> {
  const res = await invokeEdgeFunction<{ item: Record<string, unknown> }>(
    "admin-manage-assets",
    { action: "create", ...input },
    { requireExistingAuth: true }
  );
  return coerceAvatarAsset(res.item);
}

export async function adminUpdateAvatarAsset(
  id: string,
  updates: Partial<Omit<AvatarAsset, "id" | "created_at" | "updated_at">>
): Promise<AvatarAsset> {
  const res = await invokeEdgeFunction<{ item: Record<string, unknown> }>(
    "admin-manage-assets",
    { action: "update", id, ...updates },
    { requireExistingAuth: true }
  );
  return coerceAvatarAsset(res.item);
}

export async function adminDeleteAvatarAsset(id: string): Promise<void> {
  await invokeEdgeFunction(
    "admin-manage-assets",
    { action: "delete", id },
    { requireExistingAuth: true }
  );
}

export function slugifyAssetId(rawName: string, category: AssetCategory): string {
  const cleaned = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  const prefix = category === "avatar" ? "avatar" : category;
  return `${prefix}-${cleaned || "item"}`.slice(0, 60);
}

export async function adminUploadAssetImage(
  file: File,
  category: AssetCategory,
  assetId: string
): Promise<{ imageUrl: string; storagePath: string }> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ApiError(
      "Chỉ hỗ trợ file ảnh PNG (nền trong suốt) hoặc WebP.",
      400,
      "INVALID_FILE_TYPE"
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      "Dung lượng file quá lớn (tối đa 2MB). Hãy nén ảnh trước khi tải lên.",
      400,
      "FILE_TOO_LARGE"
    );
  }

  const client = requireSupabase();
  const ext = file.type === "image/webp" ? "webp" : "png";
  const storagePath = `${category}/${assetId}.${ext}`;

  const { error: uploadErr } = await client.storage
    .from("avatar-assets")
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadErr) {
    if (uploadErr.message?.toLowerCase().includes("already exists")) {
      throw new ApiError(
        `Đã tồn tại file ảnh cho mã "${assetId}". Vui lòng đổi mã ID khác!`,
        409,
        "DUPLICATE_FILE"
      );
    }
    throw new ApiError(
      uploadErr.message || "Không thể tải file ảnh lên Supabase Storage.",
      500,
      "UPLOAD_FAILED"
    );
  }

  const { data } = client.storage.from("avatar-assets").getPublicUrl(storagePath);
  return {
    imageUrl: data.publicUrl,
    storagePath,
  };
}
