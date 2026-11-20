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

import catAnimals from "../assets/icons/cat-animals.png";
import catEntertainment from "../assets/icons/cat-entertainment.png";
import catFood from "../assets/icons/cat-food.png";
import catJobs from "../assets/icons/cat-jobs.png";
import catObjects from "../assets/icons/cat-objects.png";
import catOther from "../assets/icons/cat-other.png";
import catPlaces from "../assets/icons/cat-places.png";
import catSports from "../assets/icons/cat-sports.png";

import type { CategoryFilter, Difficulty, WordCategory } from "../types/game";

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

export function getAvatarSrc(avatarId: string): string {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.src ?? avatarDino;
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
