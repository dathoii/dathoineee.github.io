import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new ApiError(
      "Chưa cấu hình kết nối Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Xem hướng dẫn trong README.md.",
      503,
      "SUPABASE_NOT_CONFIGURED"
    );
  }
  return supabase;
}

/**
 * Bảo đảm người chơi luôn có danh tính Supabase Auth hợp lệ (Anonymous Auth nếu chưa đăng nhập).
 */
export async function ensurePlayerSession(): Promise<{
  user: User;
  accessToken: string;
}> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionErr } = await client.auth.getSession();
  if (sessionErr) {
    throw new ApiError("Không thể kiểm tra phiên đăng nhập.", 401, "AUTH_SESSION_ERROR");
  }

  if (sessionData.session?.user && sessionData.session.access_token) {
    return {
      user: sessionData.session.user,
      accessToken: sessionData.session.access_token,
    };
  }

  const { data: anonData, error: anonErr } = await client.auth.signInAnonymously();
  if (anonErr || !anonData.session?.user || !anonData.session.access_token) {
    throw new ApiError(
      "Không thể khởi tạo phiên chơi ẩn danh. Hãy kiểm tra Anonymous Sign-Ins trong Supabase Authentication.",
      401,
      "ANON_AUTH_FAILED"
    );
  }

  return {
    user: anonData.session.user,
    accessToken: anonData.session.access_token,
  };
}

export async function invokeEdgeFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
  options?: { requireExistingAuth?: boolean }
): Promise<T> {
  const client = requireSupabase();

  let accessToken = "";
  if (options?.requireExistingAuth) {
    const { data } = await client.auth.getSession();
    accessToken = data.session?.access_token ?? "";
    if (!accessToken) {
      throw new ApiError("Vui lòng đăng nhập Admin để tiếp tục.", 401, "UNAUTHORIZED");
    }
  } else {
    const session = await ensurePlayerSession();
    accessToken = session.accessToken;
  }

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(
      "Không thể kết nối máy chủ. Kiểm tra mạng hoặc cấu hình Supabase Edge Functions.",
      0,
      "NETWORK_ERROR"
    );
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const message =
      typeof parsed.error === "string"
        ? parsed.error
        : `Yêu cầu thất bại (${response.status}).`;
    const code =
      typeof parsed.code === "string" ? parsed.code : "EDGE_FUNCTION_ERROR";
    throw new ApiError(message, response.status, code);
  }

  return parsed as T;
}
