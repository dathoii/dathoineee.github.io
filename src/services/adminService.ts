import { ApiError, invokeEdgeFunction, requireSupabase } from "./supabase";
import type { Difficulty, WordBankStats, WordCategory, WordPair } from "../types/game";

export interface WordPairFormInput {
  category: WordCategory;
  civilian_word: string;
  undercover_word: string;
  difficulty: Difficulty;
  note: string;
  is_active?: boolean;
}

export async function adminSignIn(email: string, password: string): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.session) {
    throw new ApiError(
      "Email hoặc mật khẩu Admin không chính xác.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  try {
    await verifyAdminRole();
  } catch (err) {
    await client.auth.signOut();
    throw err;
  }
}

export async function adminSignOut(): Promise<void> {
  const client = requireSupabase();
  await client.auth.signOut();
}

export async function verifyAdminRole(): Promise<{ is_admin: boolean; role: string }> {
  return invokeEdgeFunction(
    "admin-manage-word-pairs",
    { action: "verify" },
    { requireExistingAuth: true }
  );
}

export async function getWordBankStats(): Promise<WordBankStats> {
  return invokeEdgeFunction(
    "admin-manage-word-pairs",
    { action: "stats" },
    { requireExistingAuth: true }
  );
}

export async function listWordPairs(filters: {
  category?: string;
  difficulty?: string;
  search?: string;
}): Promise<WordPair[]> {
  const res = await invokeEdgeFunction<{ items: WordPair[] }>(
    "admin-manage-word-pairs",
    { action: "list", ...filters },
    { requireExistingAuth: true }
  );
  return res.items;
}

export async function createWordPair(input: WordPairFormInput): Promise<WordPair> {
  const res = await invokeEdgeFunction<{ item: WordPair }>(
    "admin-manage-word-pairs",
    { action: "create", ...input },
    { requireExistingAuth: true }
  );
  return res.item;
}

export async function updateWordPair(
  id: string,
  input: WordPairFormInput
): Promise<WordPair> {
  const res = await invokeEdgeFunction<{ item: WordPair }>(
    "admin-manage-word-pairs",
    { action: "update", id, ...input },
    { requireExistingAuth: true }
  );
  return res.item;
}

export async function deleteWordPair(id: string): Promise<void> {
  await invokeEdgeFunction(
    "admin-manage-word-pairs",
    { action: "delete", id },
    { requireExistingAuth: true }
  );
}

export async function importWordPairs(
  items: WordPairFormInput[]
): Promise<{ imported_count: number }> {
  return invokeEdgeFunction(
    "admin-manage-word-pairs",
    { action: "import", items },
    { requireExistingAuth: true }
  );
}

export async function exportWordPairs(): Promise<WordPairFormInput[]> {
  const res = await invokeEdgeFunction<{ items: WordPairFormInput[] }>(
    "admin-manage-word-pairs",
    { action: "export" },
    { requireExistingAuth: true }
  );
  return res.items;
}
