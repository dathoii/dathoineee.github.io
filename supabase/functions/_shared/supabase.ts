import { createClient, SupabaseClient, User } from "npm:@supabase/supabase-js@2";

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getAuthenticatedUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

export const ALLOWED_CATEGORIES = [
  "Tất cả",
  "Động vật",
  "Đồ ăn",
  "Đồ vật",
  "Địa điểm",
  "Nghề nghiệp",
  "Giải trí",
  "Thể thao",
  "Khác",
] as const;

export const WORD_CATEGORIES = ALLOWED_CATEGORIES.filter(
  (c) => c !== "Tất cả"
);

export const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const ASSET_CATEGORIES = [
  "avatar",
  "head",
  "wings",
  "effects",
  "other",
] as const;

export interface AvatarConfig {
  avatarId: string;
  headId: string | null;
  wingsId: string | null;
  effectsId: string | null;
  otherIds: string[];
}

export async function sanitizeAvatarConfig(
  admin: SupabaseClient,
  rawConfig: unknown,
  fallbackAvatarId?: string
): Promise<AvatarConfig> {
  const { data: assets } = await admin
    .from("avatar_assets")
    .select("id, category, enabled")
    .eq("enabled", true);

  const enabledList = (assets ?? []) as Array<{
    id: string;
    category: string;
    enabled: boolean;
  }>;

  const byCategory = new Map<string, Set<string>>();
  for (const cat of ASSET_CATEGORIES) byCategory.set(cat, new Set());
  for (const item of enabledList) {
    byCategory.get(item.category)?.add(item.id);
  }

  const avatarSet = byCategory.get("avatar") ?? new Set<string>();
  const firstEnabledAvatar =
    enabledList.find((item) => item.category === "avatar")?.id ?? "avatar-dino";

  const cfg = (
    rawConfig && typeof rawConfig === "object" ? rawConfig : {}
  ) as Record<string, unknown>;

  const requestedAvatarId =
    typeof cfg.avatarId === "string" && cfg.avatarId.trim()
      ? cfg.avatarId.trim()
      : (fallbackAvatarId ?? "").trim();

  const avatarId = avatarSet.has(requestedAvatarId)
    ? requestedAvatarId
    : firstEnabledAvatar;

  const pickSingle = (cat: string, val: unknown): string | null => {
    if (typeof val !== "string" || !val.trim()) return null;
    const id = val.trim();
    return byCategory.get(cat)?.has(id) ? id : null;
  };

  const otherSet = byCategory.get("other") ?? new Set<string>();
  const rawOther = Array.isArray(cfg.otherIds) ? cfg.otherIds : [];
  const seenOther = new Set<string>();
  const otherIds: string[] = [];
  for (const entry of rawOther) {
    if (typeof entry === "string") {
      const id = entry.trim();
      if (otherSet.has(id) && !seenOther.has(id)) {
        seenOther.add(id);
        otherIds.push(id);
      }
    }
    if (otherIds.length >= 6) break;
  }

  return {
    avatarId,
    headId: pickSingle("head", cfg.headId),
    wingsId: pickSingle("wings", cfg.wingsId),
    effectsId: pickSingle("effects", cfg.effectsId),
    otherIds,
  };
}
