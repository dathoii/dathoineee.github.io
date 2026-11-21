import React, { useEffect, useMemo, useState } from "react";
import { Play, RotateCcw, Save, Sparkles } from "lucide-react";
import { Modal } from "../common/Modal";
import { LayeredAvatar } from "../avatar/LayeredAvatar";
import {
  ANIMATION_TYPE_OPTIONS,
  PARTICLE_KIND_OPTIONS,
  coerceAnimationConfig,
  getDefaultAnimationForCategory,
} from "../../animation/animationEngine";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { adminUpdateAvatarAsset } from "../../services/avatarAssetService";
import type {
  AnimationDirection,
  AnimationType,
  AssetAnimationConfig,
  AvatarAsset,
  AvatarConfig,
  ParticleKind,
} from "../../types/game";
import { DEFAULT_AVATAR_CONFIG } from "../../utils/avatars";

interface AssetAnimationModalProps {
  asset: AvatarAsset | null;
  allAssets: AvatarAsset[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export const AssetAnimationModal: React.FC<AssetAnimationModalProps> = ({
  asset,
  allAssets,
  onClose,
  onSaved,
}) => {
  const { feedback, showToast } = useAppSettings();

  const [draftAnim, setDraftAnim] = useState<AssetAnimationConfig>(
    getDefaultAnimationForCategory("head")
  );
  const [zIndex, setZIndex] = useState(30);
  const [sampleAvatarId, setSampleAvatarId] = useState("avatar_01");
  const [saving, setSaving] = useState(false);

  const sampleAvatars = useMemo(
    () => allAssets.filter((a) => a.category === "avatar" && a.enabled),
    [allAssets]
  );

  useEffect(() => {
    if (!asset) return;
    setDraftAnim(coerceAnimationConfig(asset.animation, asset.category));
    setZIndex(asset.z_index);
    if (
      sampleAvatars.length > 0 &&
      !sampleAvatars.some((a) => a.id === sampleAvatarId)
    ) {
      setSampleAvatarId(sampleAvatars[0].id);
    }
  }, [asset, sampleAvatars, sampleAvatarId]);

  const previewConfig: AvatarConfig = useMemo(() => {
    if (!asset) return DEFAULT_AVATAR_CONFIG;
    const baseAvatar =
      asset.category === "avatar"
        ? asset.id
        : sampleAvatars.some((a) => a.id === sampleAvatarId)
        ? sampleAvatarId
        : DEFAULT_AVATAR_CONFIG.avatarId;

    return {
      avatarId: baseAvatar,
      headId: asset.category === "head" ? asset.id : null,
      wingsId: asset.category === "wings" ? asset.id : null,
      effectsId: asset.category === "effects" ? asset.id : null,
      otherIds: asset.category === "other" ? [asset.id] : [],
    };
  }, [asset, sampleAvatars, sampleAvatarId]);

  const previewCatalog = useMemo(() => {
    if (!asset) return allAssets;
    return allAssets.map((item) =>
      item.id === asset.id ? { ...item, enabled: true } : item
    );
  }, [allAssets, asset]);

  const overrides = useMemo(() => {
    if (!asset) return undefined;
    return {
      [asset.id]: {
        z_index: zIndex,
        animation: draftAnim,
        enabled: true,
      },
    };
  }, [asset, zIndex, draftAnim]);

  const patchAnim = <K extends keyof AssetAnimationConfig>(
    key: K,
    value: AssetAnimationConfig[K]
  ) => {
    setDraftAnim((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (!asset) return;
    feedback("tap");
    setDraftAnim(getDefaultAnimationForCategory(asset.category));
    setZIndex(asset.z_index);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setSaving(true);
    try {
      await adminUpdateAvatarAsset(asset.id, {
        z_index: zIndex,
        animation: draftAnim,
      });
      await onSaved();
      feedback("success");
      showToast(`Đã lưu hoạt ảnh cho "${asset.name}"!`, "success");
      onClose();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể lưu hoạt ảnh.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(asset)}
      onClose={() => !saving && onClose()}
      title={asset ? `ANIMATION EDITOR: ${asset.name.toUpperCase()}` : "ANIMATION EDITOR"}
    >
      {asset ? (
        <form onSubmit={handleSave} className="space-y-3 text-sm font-bold">
          {/* Xem trước hoạt ảnh trực tiếp ở cỡ lớn & cỡ trong phòng */}
          <div className="bg-gradient-to-b from-[#BCEBFF] via-[#E4F7FE] to-[#FFE7B6] border-[2.5px] border-[#552416] rounded-2xl p-4 flex items-center justify-around gap-4 overflow-visible">
            <div className="flex flex-col items-center gap-1.5 overflow-visible">
              <div className="pt-4 pb-2 px-6 overflow-visible">
                <LayeredAvatar
                  config={previewConfig}
                  size={104}
                  catalogOverride={previewCatalog}
                  assetOverrides={overrides}
                  performanceOverride="high"
                />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#552416]">
                <Play className="w-3 h-3 fill-[#552416]" />
                TRỰC TIẾP (104px)
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 overflow-visible">
              <div className="p-3 overflow-visible">
                <LayeredAvatar
                  config={previewConfig}
                  size={44}
                  catalogOverride={previewCatalog}
                  assetOverrides={overrides}
                  performanceOverride="medium"
                />
              </div>
              <span className="text-[11px] font-extrabold text-[#552416]">
                TRONG PHÒNG (44px)
              </span>
            </div>
          </div>

          {asset.category !== "avatar" && sampleAvatars.length > 0 ? (
            <div className="flex items-center gap-2">
              <label className="text-xs font-extrabold text-[#552416] shrink-0">
                Avatar mẫu:
              </label>
              <select
                value={sampleAvatarId}
                onChange={(e) => setSampleAvatarId(e.target.value)}
                className="chibi-input !py-1.5 !px-2.5 text-xs flex-1"
              >
                {sampleAvatars.map((av) => (
                  <option key={av.id} value={av.id}>
                    {av.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2.5 bg-[#FDF6EA] border-2 border-[#552416]/25 rounded-2xl p-3 max-h-[42vh] overflow-y-auto">
            {/* Bật / Tắt + Chớp mắt */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-extrabold text-[#4A1D12]">
                <input
                  type="checkbox"
                  checked={draftAnim.enabled}
                  onChange={(e) => patchAnim("enabled", e.target.checked)}
                />
                <span>Bật hoạt ảnh cho vật phẩm này</span>
              </label>

              {asset.category === "avatar" ? (
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-extrabold text-[#166A45]">
                  <input
                    type="checkbox"
                    checked={draftAnim.blinkEnabled !== false}
                    onChange={(e) => patchAnim("blinkEnabled", e.target.checked)}
                  />
                  <span>Chớp mắt / Ánh kính</span>
                </label>
              ) : null}
            </div>

            {/* Loại Animation + Hướng + Lặp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-extrabold text-[#552416] mb-0.5">
                  Loại Animation:
                </label>
                <select
                  value={draftAnim.type}
                  onChange={(e) => patchAnim("type", e.target.value as AnimationType)}
                  className="chibi-input !py-1.5 !px-2 text-xs"
                >
                  {ANIMATION_TYPE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#552416] mb-0.5">
                  Hướng &amp; Lặp:
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={draftAnim.direction}
                    onChange={(e) =>
                      patchAnim("direction", e.target.value as AnimationDirection)
                    }
                    className="chibi-input !py-1.5 !px-2 text-xs flex-1"
                  >
                    <option value="alternate">Qua lại (alternate)</option>
                    <option value="normal">Xuôi (normal)</option>
                    <option value="reverse">Ngược (reverse)</option>
                  </select>
                  <label className="inline-flex items-center gap-1 text-xs font-extrabold shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftAnim.loop}
                      onChange={(e) => patchAnim("loop", e.target.checked)}
                    />
                    Lặp
                  </label>
                </div>
              </div>
            </div>

            {/* Thời gian (Duration) & Độ trễ (Delay) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] font-extrabold mb-0.5">
                  <span>Thời gian (Tốc độ)</span>
                  <span className="font-mono">{draftAnim.duration}ms</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={12000}
                  step={100}
                  value={draftAnim.duration}
                  onChange={(e) => patchAnim("duration", Number(e.target.value))}
                  className="w-full accent-[#552416]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-extrabold mb-0.5">
                  <span>Độ trễ (Delay)</span>
                  <span className="font-mono">{draftAnim.delay}ms</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3000}
                  step={50}
                  value={draftAnim.delay}
                  onChange={(e) => patchAnim("delay", Number(e.target.value))}
                  className="w-full accent-[#428BC1]"
                />
              </div>
            </div>

            {/* Cường độ & Biên độ */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] font-extrabold mb-0.5">
                  <span>Cường độ (Intensity)</span>
                  <span className="font-mono">{draftAnim.intensity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.5}
                  step={0.05}
                  value={draftAnim.intensity}
                  onChange={(e) => patchAnim("intensity", Number(e.target.value))}
                  className="w-full accent-[#E56E52]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-extrabold mb-0.5">
                  <span>Biên độ (Amplitude)</span>
                  <span className="font-mono">{draftAnim.amplitude.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.5}
                  step={0.05}
                  value={draftAnim.amplitude}
                  onChange={(e) => patchAnim("amplitude", Number(e.target.value))}
                  className="w-full accent-[#166A45]"
                />
              </div>
            </div>

            {/* Góc xoay & Layer */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] font-extrabold mb-0.5">
                  <span>Góc xoay (Rotation)</span>
                  <span className="font-mono">{draftAnim.rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-360}
                  max={360}
                  step={1}
                  value={draftAnim.rotation}
                  onChange={(e) => patchAnim("rotation", Number(e.target.value))}
                  className="w-full accent-[#7E57C2]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-extrabold mb-0.5">
                  <span>Layer (z-index)</span>
                  <span className="font-mono">{zIndex}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={zIndex}
                  onChange={(e) => setZIndex(Number(e.target.value))}
                  className="w-full accent-[#552416]"
                />
              </div>
            </div>

            {/* Hạt hiệu ứng đi kèm */}
            <div>
              <label className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#552416] mb-0.5">
                <Sparkles className="w-3 h-3 text-[#E59B14]" />
                Hạt hiệu ứng (Particles):
              </label>
              <select
                value={draftAnim.particleKind ?? "none"}
                onChange={(e) =>
                  patchAnim("particleKind", e.target.value as ParticleKind)
                }
                className="chibi-input !py-1.5 !px-2 text-xs"
              >
                {PARTICLE_KIND_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleReset}
              className="chibi-btn btn-cream !min-h-[42px] px-3 py-2 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>MẶC ĐỊNH</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="chibi-btn btn-cream !min-h-[42px] px-4 py-2 text-sm flex-1"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={saving}
              className="chibi-btn btn-mint !min-h-[42px] px-4 py-2 text-sm flex-[1.5]"
            >
              <Save className="w-4 h-4 stroke-[2.6]" />
              <span>{saving ? "ĐANG LƯU..." : "LƯU HOẠT ẢNH"}</span>
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
};
