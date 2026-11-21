import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAnimationVars,
  coerceAnimationConfig,
  getAnimationClassName,
  getParticleCountForContext,
} from "../../animation/animationEngine";
import { useOptionalPerformanceQuality } from "../../contexts/AppSettingsContext";
import { useAvatarCatalog } from "../../contexts/AvatarCatalogContext";
import { getAvatarFacePreset } from "../../data/avatarBlinkPresets";
import type { AvatarAsset, AvatarConfig, PerformanceQuality } from "../../types/game";
import {
  getAvatarRingColor,
  normalizeAvatarConfig,
  resolveAssetImageUrl,
} from "../../utils/avatars";
import { AccessoryParticles } from "./AccessoryParticles";

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
  disableAnimation?: boolean;
  performanceOverride?: PerformanceQuality;
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
  disableAnimation = false,
  performanceOverride,
}) => {
  const { assets: contextAssets } = useAvatarCatalog();
  const contextQuality = useOptionalPerformanceQuality();
  const quality = performanceOverride ?? contextQuality;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          setIsVisible(entries[0].isIntersecting);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const avatarAnim = useMemo(
    () => coerceAnimationConfig(avatarAsset?.animation, "avatar"),
    [avatarAsset?.animation]
  );
  const avatarAnimActive = !disableAnimation && avatarAnim.enabled;
  const avatarAnimClass = avatarAnimActive ? getAnimationClassName(avatarAnim) : "";
  const avatarAnimVars = avatarAnimActive
    ? buildAnimationVars(avatarAnim, quality)
    : undefined;

  const facePreset = useMemo(
    () => getAvatarFacePreset(normalized.avatarId),
    [normalized.avatarId]
  );
  const showEyeMotion =
    avatarAnimActive && avatarAnim.blinkEnabled !== false;
  const particleBudget = disableAnimation
    ? 0
    : getParticleCountForContext(quality, size, isVisible);

  const content = (
    <div
      ref={containerRef}
      data-paused={!isVisible || disableAnimation ? "true" : "false"}
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

      {/* Layer 2 & 4 & 5: Phụ kiện phía sau (Wings) & phía trước (Head / Effects / Other) */}
      {accessoryAssets.map((item) => {
        const anim = coerceAnimationConfig(item.animation, item.category);
        const isAnimated = !disableAnimation && anim.enabled;
        const animVars = isAnimated ? buildAnimationVars(anim, quality) : undefined;
        const imgUrl = resolveAssetImageUrl(item.image_url);
        const splitWings =
          item.category === "wings" && isAnimated && anim.type === "wing_flap";
        const particleKind = anim.particleKind ?? "none";

        return (
          <div
            key={item.id}
            aria-hidden="true"
            className="absolute pointer-events-none overflow-visible"
            style={{
              width: size,
              height: size,
              left: "50%",
              top: "50%",
              zIndex: item.z_index,
              transform: `translate(calc(-50% + ${item.position_x}%), calc(-50% + ${item.position_y}%)) scale(${item.scale})`,
            }}
          >
            {splitWings ? (
              <div className="relative w-full h-full overflow-visible">
                <img
                  src={imgUrl}
                  alt=""
                  draggable={false}
                  className={`absolute inset-0 w-full h-full object-contain max-w-none ${getAnimationClassName(
                    anim,
                    "left"
                  )}`}
                  style={{ ...animVars, clipPath: "inset(0 50% 0 0)" }}
                />
                <img
                  src={imgUrl}
                  alt=""
                  draggable={false}
                  className={`absolute inset-0 w-full h-full object-contain max-w-none ${getAnimationClassName(
                    anim,
                    "right"
                  )}`}
                  style={{ ...animVars, clipPath: "inset(0 0 0 50%)" }}
                />
              </div>
            ) : (
              <div
                className={`relative w-full h-full overflow-visible ${
                  isAnimated ? getAnimationClassName(anim) : ""
                }`}
                style={animVars}
              >
                <img
                  src={imgUrl}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain max-w-none"
                />
              </div>
            )}

            {isAnimated && particleKind !== "none" && particleBudget > 0 ? (
              <AccessoryParticles
                kind={particleKind}
                count={
                  item.category === "effects"
                    ? particleBudget
                    : Math.max(1, Math.floor(particleBudget / 2))
                }
                size={size}
              />
            ) : null}
          </div>
        );
      })}

      {/* Layer 3: Avatar hình tròn chính + Idle Animation + Chớp mắt/Ánh kính */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden bg-white"
        style={{
          zIndex: avatarZIndex,
          backgroundColor: ringBg,
          border: `${borderPx}px solid #552416`,
        }}
      >
        {avatarAsset ? (
          <div
            className={`relative w-full h-full ${avatarAnimClass}`}
            style={avatarAnimVars}
          >
            <img
              src={resolveAssetImageUrl(avatarAsset.image_url)}
              alt={avatarAsset.name}
              draggable={false}
              className="w-full h-full object-cover"
              style={{
                transform: `translate(${avatarAsset.position_x}%, ${avatarAsset.position_y}%) scale(${avatarAsset.scale})`,
              }}
            />

            {/* Chớp mắt tự nhiên trên vùng mắt thật */}
            {showEyeMotion && facePreset.mode === "blink"
              ? [facePreset.leftEye, facePreset.rightEye]
                  .filter((eye): eye is NonNullable<typeof eye> => Boolean(eye))
                  .map((eye, idx) => (
                    <span
                      key={idx}
                      aria-hidden="true"
                      className="chibi-eyelid absolute pointer-events-none rounded-full"
                      style={{
                        left: `${eye.cx}%`,
                        top: `${eye.cy}%`,
                        width: `${eye.w}%`,
                        height: `${eye.h}%`,
                        backgroundColor: facePreset.skinColor ?? "#FFE0CC",
                        borderBottom: `${Math.max(1.5, Math.round(size * 0.032))}px solid #552416`,
                        "--blink-dur": `${facePreset.blinkIntervalMs ?? 3500}ms`,
                        animationDelay: `${(idx * 20)}ms`,
                      } as React.CSSProperties}
                    />
                  ))
              : null}

            {/* Tia sáng lướt qua kính râm cho avatar đeo kính */}
            {showEyeMotion && facePreset.mode === "glint"
              ? [facePreset.leftEye, facePreset.rightEye]
                  .filter((eye): eye is NonNullable<typeof eye> => Boolean(eye))
                  .map((eye, idx) => (
                    <span
                      key={idx}
                      aria-hidden="true"
                      className="chibi-lens-glint absolute pointer-events-none rounded-full"
                      style={{
                        left: `${eye.cx}%`,
                        top: `${eye.cy}%`,
                        width: `${eye.w * 0.45}%`,
                        height: `${eye.h * 0.85}%`,
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)",
                        "--blink-dur": `${facePreset.blinkIntervalMs ?? 4000}ms`,
                      } as React.CSSProperties}
                    />
                  ))
              : null}
          </div>
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
