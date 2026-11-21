export type Difficulty = "easy" | "medium" | "hard";

export type WordCategory =
  | "Động vật"
  | "Đồ ăn"
  | "Đồ vật"
  | "Địa điểm"
  | "Nghề nghiệp"
  | "Giải trí"
  | "Thể thao"
  | "Khác";

export type CategoryFilter = "Tất cả" | WordCategory;

export type RoomStatus =
  | "waiting"
  | "revealing"
  | "discussing"
  | "round_ended"
  | "closed";

export type PlayerRole = "civilian" | "undercover" | "mr_white";

export interface Room {
  id: string;
  room_code: string;
  room_name: string;
  host_id: string;
  status: RoomStatus;
  max_players: number;
  category_filter: CategoryFilter;
  difficulty: Difficulty;
  current_round: number;
  created_at: string;
  expires_at: string;
}

export interface RoomSettings {
  room_id: string;
  civilian_count: number;
  undercover_count: number;
  mr_white_count: number;
  updated_at: string;
}

export type AssetCategory = "avatar" | "head" | "wings" | "effects" | "other";

export interface AvatarAsset {
  id: string;
  name: string;
  category: AssetCategory;
  image_url: string;
  storage_path: string | null;
  description: string;
  enabled: boolean;
  scale: number;
  position_x: number;
  position_y: number;
  z_index: number;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvatarConfig {
  avatarId: string;
  headId: string | null;
  wingsId: string | null;
  effectsId: string | null;
  otherIds: string[];
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  avatar: string;
  avatar_config?: AvatarConfig;
  is_ready: boolean;
  is_connected: boolean;
  last_seen_at: string;
  joined_at: string;
}

export interface GameRound {
  id: string;
  room_id: string;
  round_number: number;
  status: "revealing" | "discussing" | "ended";
  timer_duration_sec: number;
  timer_remaining_sec: number;
  timer_started_at: string | null;
  timer_running: boolean;
  description_turn: number;
  total_turns: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface RoundAcknowledgement {
  round_id: string;
  player_id: string;
  acknowledged_at: string;
}

export interface MySecretAssignment {
  round_id: string;
  round_number: number;
  player_id: string;
  nickname: string;
  role: PlayerRole;
  secret_word: string | null;
  acknowledged_at: string | null;
}

export interface WordPair {
  id: string;
  category: WordCategory;
  civilian_word: string;
  undercover_word: string;
  difficulty: Difficulty;
  note: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WordBankStats {
  total: number;
  active_total: number;
  by_category: Record<WordCategory, number>;
}

export interface AppSettings {
  soundEnabled: boolean;
  effectsEnabled: boolean;
  vibrationEnabled: boolean;
  theme: "light" | "dark";
  language: "vi";
}
