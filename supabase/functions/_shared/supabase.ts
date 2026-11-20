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

export const ALLOWED_AVATARS = new Set([
  "avatar-dino",
  "avatar-cat",
  "avatar-green-curly",
  "avatar-blue-glasses",
  "avatar-bunny",
  "avatar-blue-shades",
  "avatar-afro-shades",
  "avatar-blonde-boy",
  "avatar-red-glasses",
  "avatar-orange-kimono",
]);
