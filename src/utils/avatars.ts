import avatarAfroShades from "../assets/avatars/avatar-afro-shades.png";
import avatarBlondeBoy from "../assets/avatars/avatar-blonde-boy.png";
import avatarBlueGlasses from "../assets/avatars/avatar-blue-glasses.png";
import avatarBlueShades from "../assets/avatars/avatar-blue-shades.png";
import avatarBunny from "../assets/avatars/avatar-bunny.png";
import avatarCat from "../assets/avatars/avatar-cat.png";
import avatarDino from "../assets/avatars/avatar-dino.png";
import avatarGreenCurly from "../assets/avatars/avatar-green-curly.png";
import avatarOrangeKimono from "../assets/avatars/avatar-orange-kimono.png";
import avatarRedGlasses from "../assets/avatars/avatar-red-glasses.png";

import headCrown from "../assets/accessories/head-crown.png";
import headDetectiveHat from "../assets/accessories/head-detective-hat.png";
import headCatEars from "../assets/accessories/head-cat-ears.png";
import headSunglasses from "../assets/accessories/head-sunglasses.png";
import wingsAngel from "../assets/accessories/wings-angel.png";
import wingsDevil from "../assets/accessories/wings-devil.png";
import wingsButterfly from "../assets/accessories/wings-butterfly.png";
import effectSparkles from "../assets/accessories/effect-sparkles.png";
import effectHearts from "../assets/accessories/effect-hearts.png";
import otherStarBadge from "../assets/accessories/other-star-badge.png";
import otherMagnifier from "../assets/accessories/other-magnifier.png";

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

export const BUILTIN_ASSET_MAP: Record<string, string> = {
  "avatar-dino": avatarDino,
  "avatar-cat": avatarCat,
  "avatar-green-curly": avatarGreenCurly,
  "avatar-blue-glasses": avatarBlueGlasses,
  "avatar-bunny": avatarBunny,
  "avatar-blue-shades": avatarBlueShades,
  "avatar-afro-shades": avatarAfroShades,
  "avatar-blonde-boy": avatarBlondeBoy,
  "avatar-red-glasses": avatarRedGlasses,
  "avatar-orange-kimono": avatarOrangeKimono,
  "head-crown": headCrown,
  "head-detective-hat": headDetectiveHat,
  "head-cat-ears": headCatEars,
  "head-sunglasses": headSunglasses,
  "wings-angel": wingsAngel,
  "wings-devil": wingsDevil,
  "wings-butterfly": wingsButterfly,
  "effect-sparkles": effectSparkles,
  "effect-hearts": effectHearts,
  "other-star-badge": otherStarBadge,
  "other-magnifier": otherMagnifier,
};

export function resolveAssetImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("builtin:")) {
    const key = imageUrl.slice("builtin:".length);
    return BUILTIN_ASSET_MAP[key] ?? avatarDino;
  }
  return imageUrl;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  avatarId: "avatar-dino",
  headId: null,
  wingsId: null,
  effectsId: null,
  otherIds: [],
};

const makeBuiltinAsset = (
  id: string,
  name: string,
  category: AssetCategory,
  opts?: Partial<AvatarAsset>
): AvatarAsset => ({
  id,
  name,
  category,
  image_url: `builtin:${id}`,
  storage_path: null,
  description: opts?.description ?? "",
  enabled: true,
  scale: opts?.scale ?? 1,
  position_x: opts?.position_x ?? 0,
  position_y: opts?.position_y ?? 0,
  z_index: opts?.z_index ?? (category === "wings" ? 10 : category === "avatar" ? 20 : 32),
  is_builtin: true,
  created_at: "",
  updated_at: "",
});

export const FALLBACK_AVATAR_ASSETS: AvatarAsset[] = [
  makeBuiltinAsset("avatar-dino", "Khủng long xanh", "avatar"),
  makeBuiltinAsset("avatar-cat", "Mèo con tam thể", "avatar"),
  makeBuiltinAsset("avatar-green-curly", "Tóc xoăn xanh", "avatar"),
  makeBuiltinAsset("avatar-blue-glasses", "Cậu bé kính tròn", "avatar"),
  makeBuiltinAsset("avatar-bunny", "Thỏ hồng đáng yêu", "avatar"),
  makeBuiltinAsset("avatar-blue-shades", "Kính râm ngầu", "avatar"),
  makeBuiltinAsset("avatar-afro-shades", "Xoăn bồng phong cách", "avatar"),
  makeBuiltinAsset("avatar-blonde-boy", "Cậu bé tóc vàng", "avatar"),
  makeBuiltinAsset("avatar-red-glasses", "Cô nàng tóc đỏ", "avatar"),
  makeBuiltinAsset("avatar-orange-kimono", "Tóc cam năng động", "avatar"),

  makeBuiltinAsset("head-crown", "Vương miện hoàng gia", "head", { scale: 0.78, position_y: -48, z_index: 32 }),
  makeBuiltinAsset("head-detective-hat", "Nón thám tử", "head", { scale: 1.05, position_y: -40, z_index: 32 }),
  makeBuiltinAsset("head-cat-ears", "Tai mèo dễ thương", "head", { scale: 0.92, position_y: -42, z_index: 30 }),
  makeBuiltinAsset("head-sunglasses", "Kính mát thời trang", "head", { scale: 0.82, position_y: -4, z_index: 34 }),

  makeBuiltinAsset("wings-angel", "Cánh thiên thần", "wings", { scale: 1.85, position_y: -2, z_index: 10 }),
  makeBuiltinAsset("wings-devil", "Cánh ác quỷ nhỏ", "wings", { scale: 1.8, position_y: 2, z_index: 10 }),
  makeBuiltinAsset("wings-butterfly", "Cánh bướm cầu vồng", "wings", { scale: 1.75, position_y: 0, z_index: 10 }),

  makeBuiltinAsset("effect-sparkles", "Hào quang sao lấp lánh", "effects", { scale: 1.38, z_index: 40 }),
  makeBuiltinAsset("effect-hearts", "Trái tim bay", "effects", { scale: 1.35, z_index: 40 }),

  makeBuiltinAsset("other-star-badge", "Huy hiệu ngôi sao", "other", { scale: 0.95, position_x: 4, position_y: 4, z_index: 45 }),
  makeBuiltinAsset("other-magnifier", "Kính lúp thám tử", "other", { scale: 0.95, position_x: -4, position_y: 4, z_index: 45 }),
];

export interface AvatarOption {
  id: string;
  label: string;
  src: string;
  ringColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "avatar-dino", label: "Khủng long", src: avatarDino, ringColor: "#A9E4CA" },
  { id: "avatar-cat", label: "Mèo con", src: avatarCat, ringColor: "#D8C6F8" },
  { id: "avatar-green-curly", label: "Tóc xoăn xanh", src: avatarGreenCurly, ringColor: "#BFE4FC" },
  { id: "avatar-blue-glasses", label: "Kính tròn", src: avatarBlueGlasses, ringColor: "#F9D677" },
  { id: "avatar-bunny", label: "Thỏ hồng", src: avatarBunny, ringColor: "#FBC7CC" },
  { id: "avatar-blue-shades", label: "Kính râm", src: avatarBlueShades, ringColor: "#F7A6A4" },
  { id: "avatar-afro-shades", label: "Xoăn bồng", src: avatarAfroShades, ringColor: "#DCC6FA" },
  { id: "avatar-blonde-boy", label: "Tóc vàng", src: avatarBlondeBoy, ringColor: "#ADE7CF" },
  { id: "avatar-red-glasses", label: "Tóc đỏ", src: avatarRedGlasses, ringColor: "#F79E9E" },
  { id: "avatar-orange-kimono", label: "Tóc cam", src: avatarOrangeKimono, ringColor: "#B7E7C9" },
];

export function getAvatarRingColor(avatarId: string): string {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.ringColor ?? "#ADE7CF";
}

export function getAvatarSrc(avatarId: string): string {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.src ?? avatarDino;
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
