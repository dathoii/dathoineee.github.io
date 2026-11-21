import type { AssetCategory } from "../../types/game";

export interface CategoryPresetMeta {
  id: AssetCategory;
  label: string;
  shortLabel: string;
  emoji: string;
  scale: number;
  position_x: number;
  position_y: number;
  z_index: number;
  hint: string;
}

export const ASSET_CATEGORIES_META: CategoryPresetMeta[] = [
  {
    id: "avatar",
    label: "Avatar gốc",
    shortLabel: "AVATAR",
    emoji: "🧑",
    scale: 1,
    position_x: 0,
    position_y: 0,
    z_index: 20,
    hint: "Hiển thị trong khung tròn nhân vật (z-index chuẩn: 20).",
  },
  {
    id: "head",
    label: "Nón / Đầu / Kính",
    shortLabel: "HEAD",
    emoji: "👑",
    scale: 0.85,
    position_x: 0,
    position_y: -44,
    z_index: 32,
    hint: "Nằm trên đầu hoặc ngang mặt nhân vật (z-index chuẩn: 30-35).",
  },
  {
    id: "wings",
    label: "Đôi cánh",
    shortLabel: "WINGS",
    emoji: "🕊️",
    scale: 1.8,
    position_x: 0,
    position_y: 0,
    z_index: 10,
    hint: "Nằm phía sau avatar và nhô ra hai bên (z-index < 20).",
  },
  {
    id: "effects",
    label: "Hiệu ứng",
    shortLabel: "EFFECTS",
    emoji: "✨",
    scale: 1.38,
    position_x: 0,
    position_y: 0,
    z_index: 40,
    hint: "Bao quanh hoặc tỏa sáng phía trước avatar (z-index chuẩn: 40).",
  },
  {
    id: "other",
    label: "Phụ kiện khác",
    shortLabel: "OTHER",
    emoji: "🎀",
    scale: 0.48,
    position_x: 36,
    position_y: 34,
    z_index: 45,
    hint: "Huy hiệu, kính lúp, trang trí góc (z-index chuẩn: 45).",
  },
];

export const CATEGORY_PRESET_MAP: Record<AssetCategory, CategoryPresetMeta> = {
  avatar: ASSET_CATEGORIES_META[0],
  head: ASSET_CATEGORIES_META[1],
  wings: ASSET_CATEGORIES_META[2],
  effects: ASSET_CATEGORIES_META[3],
  other: ASSET_CATEGORIES_META[4],
};
