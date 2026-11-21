import avatarManifest from "../data/avatar-manifest.json";

import catAnimals from "../assets/icons/cat-animals.png";
import catEntertainment from "../assets/icons/cat-entertainment.png";
import catFood from "../assets/icons/cat-food.png";
import catJobs from "../assets/icons/cat-jobs.png";
import catObjects from "../assets/icons/cat-objects.png";
import catOther from "../assets/icons/cat-other.png";
import catPlaces from "../assets/icons/cat-places.png";
import catSports from "../assets/icons/cat-sports.png";

import type {
  AssetCategory,
  AvatarAsset,
  AvatarConfig,
  CategoryFilter,
  Difficulty,
  RoomPlayer,
  WordCategory,
} from "../types/game";

interface ManifestEntry {
  id: string;
  name: string;
  shortLabel?: string;
  category: AssetCategory;
  assetPath: string;
  description?: string;
  ringColor?: string;
  scale: number;
  position_x: number;
  position_y: number;
  z_index: number;
}

const BUNDLED_ASSET_URLS = import.meta.glob<string>(
  "../assets/{avatars,accessories}/**/*.png",
  { eager: true, import: "default" }
);

const ALL_MANIFEST_ENTRIES: ManifestEntry[] = [
  ...(avatarManifest.avatars as ManifestEntry[]),
  ...(avatarManifest.accessories as ManifestEntry[]),
];

export const BUILTIN_ASSET_MAP: Record<string, string> = Object.fromEntries(
  ALL_MANIFEST_ENTRIES.map((entry) => [
    entry.id,
    BUNDLED_ASSET_URLS[`../${entry.assetPath}`] ?? "",
  ])
);

const DEFAULT_FALLBACK_AVATAR_URL =
  BUILTIN_ASSET_MAP["avatar-dino"] || BUILTIN_ASSET_MAP["avatar_01"] || "";

export function resolveAssetImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("builtin:")) {
    const key = imageUrl.slice("builtin:".length);
    return BUILTIN_ASSET_MAP[key] || DEFAULT_FALLBACK_AVATAR_URL;
  }
  return imageUrl;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  avatarId: "avatar_01",
  headId: null,
  wingsId: null,
  effectsId: null,
  otherIds: [],
};

export const FALLBACK_AVATAR_ASSETS: AvatarAsset[] = ALL_MANIFEST_ENTRIES.map(
  (entry) => ({
    id: entry.id,
    name: entry.name,
    category: entry.category,
    image_url: `builtin:${entry.id}`,
    storage_path: null,
    description: entry.description ?? "",
    enabled: true,
    scale: entry.scale,
    position_x: entry.position_x,
    position_y: entry.position_y,
    z_index: entry.z_index,
    is_builtin: true,
    created_at: "",
    updated_at: "",
  })
);

export interface AvatarOption {
  id: string;
  label: string;
  src: string;
  ringColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = (
  avatarManifest.avatars as ManifestEntry[]
).map((entry) => ({
  id: entry.id,
  label: entry.shortLabel || entry.name,
  src: BUILTIN_ASSET_MAP[entry.id] || DEFAULT_FALLBACK_AVATAR_URL,
  ringColor: entry.ringColor ?? "#ADE7CF",
}));

export function getAvatarRingColor(avatarId: string): string {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.ringColor ?? "#ADE7CF";
}

export function getAvatarSrc(avatarId: string): string {
  return (
    AVATAR_OPTIONS.find((a) => a.id === avatarId)?.src ??
    DEFAULT_FALLBACK_AVATAR_URL
  );
}

export function resolvePlayerAvatarConfig(
  player: Pick<RoomPlayer, "avatar" | "avatar_config">
): AvatarConfig {
  const cfg = player.avatar_config;
  if (cfg && typeof cfg === "object" && typeof cfg.avatarId === "string") {
    return {
      avatarId: cfg.avatarId || player.avatar || "avatar-dino",
      headId: cfg.headId ?? null,
      wingsId: cfg.wingsId ?? null,
      effectsId: cfg.effectsId ?? null,
      otherIds: Array.isArray(cfg.otherIds) ? cfg.otherIds : [],
    };
  }
  return {
    ...DEFAULT_AVATAR_CONFIG,
    avatarId: player.avatar || "avatar-dino",
  };
}

/**
 * Chuẩn hóa cấu hình avatar trước khi hiển thị hoặc lưu:
 * nếu vật phẩm bị Admin xóa/ẩn thì tự động chuyển về trạng thái an toàn.
 */
export function normalizeAvatarConfig(
  config: AvatarConfig,
  enabledCatalog: AvatarAsset[]
): AvatarConfig {
  const byId = new Map(enabledCatalog.map((item) => [item.id, item]));
  const firstAvatar =
    enabledCatalog.find((item) => item.category === "avatar")?.id ?? "avatar-dino";

  const avatarAsset = byId.get(config.avatarId);
  const avatarId =
    avatarAsset && avatarAsset.category === "avatar" ? avatarAsset.id : firstAvatar;

  const validSlot = (id: string | null, cat: AssetCategory): string | null => {
    if (!id) return null;
    const item = byId.get(id);
    return item && item.category === cat ? item.id : null;
  };

  const otherIds = (config.otherIds ?? []).filter((id) => {
    const item = byId.get(id);
    return Boolean(item && item.category === "other");
  });

  return {
    avatarId,
    headId: validSlot(config.headId, "head"),
    wingsId: validSlot(config.wingsId, "wings"),
    effectsId: validSlot(config.effectsId, "effects"),
    otherIds: Array.from(new Set(otherIds)),
  };
}

export interface CategoryMeta {
  id: WordCategory;
  label: WordCategory;
  icon: string;
  chipBg: string;
  emoji: string;
}

export const WORD_CATEGORIES_META: CategoryMeta[] = [
  { id: "Động vật", label: "Động vật", icon: catAnimals, chipBg: "#FDD6BA", emoji: "🐯" },
  { id: "Đồ ăn", label: "Đồ ăn", icon: catFood, chipBg: "#FFE2A1", emoji: "🍕" },
  { id: "Đồ vật", label: "Đồ vật", icon: catObjects, chipBg: "#E6CCBA", emoji: "📦" },
  { id: "Địa điểm", label: "Địa điểm", icon: catPlaces, chipBg: "#F7BFE8", emoji: "📍" },
  { id: "Nghề nghiệp", label: "Nghề nghiệp", icon: catJobs, chipBg: "#CBE5B5", emoji: "💼" },
  { id: "Giải trí", label: "Giải trí", icon: catEntertainment, chipBg: "#CFC4F9", emoji: "🎮" },
  { id: "Thể thao", label: "Thể thao", icon: catSports, chipBg: "#C6EAD7", emoji: "⚽" },
  { id: "Khác", label: "Khác", icon: catOther, chipBg: "#FFE9BA", emoji: "🎁" },
];

export const CATEGORY_FILTERS: { id: CategoryFilter; label: string; emoji: string; chipBg: string }[] = [
  { id: "Tất cả", label: "TẤT CẢ", emoji: "⭐", chipBg: "#ADE7CF" },
  ...WORD_CATEGORIES_META.map((c) => ({
    id: c.id as CategoryFilter,
    label: c.label.toUpperCase(),
    emoji: c.emoji,
    chipBg: c.chipBg,
  })),
];

export const DIFFICULTY_META: {
  id: Difficulty;
  label: string;
  bg: string;
  bevel: string;
}[] = [
  { id: "easy", label: "DỄ", bg: "#BBEAF2", bevel: "#84CEDB" },
  { id: "medium", label: "TRUNG BÌNH", bg: "#FFE59B", bevel: "#E7BA47" },
  { id: "hard", label: "KHÓ", bg: "#FFA0A4", bevel: "#DC7076" },
];

export function formatDifficultyLabel(d: Difficulty): string {
  return DIFFICULTY_META.find((item) => item.id === d)?.label ?? "TRUNG BÌNH";
}
