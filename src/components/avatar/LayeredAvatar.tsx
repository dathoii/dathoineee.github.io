import React, { useMemo } from "react";
import { useAvatarCatalog } from "../../contexts/AvatarCatalogContext";
import type { AvatarAsset, AvatarConfig } from "../../types/game";
import {
  getAvatarRingColor,
  normalizeAvatarConfig,
  resolveAssetImageUrl,
} from "../../utils/avatars";

interface LayeredAvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  showBadge?: boolean;
  catalogOverride?: AvatarAsset[];
  assetOverrides?: Record<string, Partial<AvatarAsset>>;
  isOnline?: boolean;
}

export const LayeredAvatar: React.FC<LayeredAvatarProps> = ({
  config,
  size = 48,
  className = "",
  interactive = false,
  onClick,
  ariaLabel = "Tùy chỉnh avatar",
  showBadge = false,
  catalogOverride,
  assetOverrides,
  isOnline,
}) => {
  const { assets: contextAssets } = useAvatarCatalog();
  const catalog = catalogOverride ?? contextAssets;

  const effectiveCatalog = useMemo(() => {
    if (!assetOverrides) return catalog;
    return catalog.map((item) =>
      assetOverrides[item.id] ? { ...item, ...assetOverrides[item.id] } : item
    );
  }, [catalog, assetOverrides]);

  const normalized = useMemo(
    () => normalizeAvatarConfig(config, effectiveCatalog),
    [config, effectiveCatalog]
  );

  const byId = useMemo(
    () => new Map(effectiveCatalog.map((item) => [item.id, item])),
    [effectiveCatalog]
  );

  const avatarAsset = byId.get(normalized.avatarId);
  const accessoryAssets = useMemo(() => {
    const ids = [
      normalized.wingsId,
      normalized.headId,
      normalized.effectsId,
      ...(normalized.otherIds ?? []),
    ].filter((id): id is string => Boolean(id));

    return ids
      .map((id) => byId.get(id))
      .filter((item): item is AvatarAsset => Boolean(item))
      .sort((a, b) => a.z_index - b.z_index);
  }, [normalized, byId]);

  const avatarZIndex = avatarAsset?.z_index ?? 20;
  const ringBg = getAvatarRingColor(normalized.avatarId);
  const borderPx = size >= 96 ? 3.5 : size >= 56 ? 2.5 : 2;

  const content = (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-visible ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Layer 1: Background Glow nhẹ (zIndex 5) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          zIndex: 5,
          boxShadow: "0 3px 0 rgba(85, 36, 22, 0.2)",
        }}
      />

      {/* Layer 2 & 4 & 5: Phụ kiện phía sau (Wings z=10) & phía trước (Head/Effects/Other z=30+) */}
      {accessoryAssets.map((item) => (
        <img
          key={item.id}
          src={resolveAssetImageUrl(item.image_url)}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute pointer-events-none object-contain max-w-none"
          style={{
            width: size,
            height: size,
            left: "50%",
            top: "50%",
            zIndex: item.z_index,
            transform: `translate(calc(-50% + ${item.position_x}%), calc(-50% + ${item.position_y}%)) scale(${item.scale})`,
          }}
        />
      ))}

      {/* Layer 3: Avatar hình tròn chính (giữ nguyên thiết kế gốc, chỉ bo tròn phần avatar) */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden bg-white"
        style={{
          zIndex: avatarZIndex,
          backgroundColor: ringBg,
          border: `${borderPx}px solid #552416`,
        }}
      >
        {avatarAsset ? (
          <img
            src={resolveAssetImageUrl(avatarAsset.image_url)}
            alt={avatarAsset.name}
            draggable={false}
            className="w-full h-full object-cover"
            style={{
              transform: `translate(${avatarAsset.position_x}%, ${avatarAsset.position_y}%) scale(${avatarAsset.scale})`,
            }}
          />
        ) : null}
      </div>

      {/* Trạng thái online/offline (nếu có) */}
      {typeof isOnline === "boolean" ? (
        <span
          title={isOnline ? "Đang trực tuyến" : "Mất kết nối"}
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? "bg-[#1EA454]" : "bg-[#E53935]"
          }`}
          style={{ zIndex: 60 }}
        />
      ) : null}

      {/* Nhãn gợi ý tùy chỉnh */}
      {showBadge ? (
        <span
          className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#FFDE84] border-2 border-[#552416] text-[10px] font-display font-extrabold text-[#552416] shadow-sm leading-none"
          style={{ zIndex: 60 }}
        >
          ✨
        </span>
      ) : null}
    </div>
  );

  if (interactive || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="relative inline-flex items-center justify-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-visible"
      >
        {content}
      </button>
    );
  }

  return content;
};
