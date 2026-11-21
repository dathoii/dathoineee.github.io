import React, { useEffect, useMemo, useRef, useState } from "react";
import { Move, RotateCcw, Save } from "lucide-react";
import { Modal } from "../common/Modal";
import { LayeredAvatar } from "../avatar/LayeredAvatar";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { adminUpdateAvatarAsset } from "../../services/avatarAssetService";
import type { AvatarAsset, AvatarConfig } from "../../types/game";
import { DEFAULT_AVATAR_CONFIG } from "../../utils/avatars";
import { CATEGORY_PRESET_MAP } from "./assetManagerPresets";

interface AssetPositionModalProps {
  asset: AvatarAsset | null;
  allAssets: AvatarAsset[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export const AssetPositionModal: React.FC<AssetPositionModalProps> = ({
  asset,
  allAssets,
  onClose,
  onSaved,
}) => {
  const { feedback, showToast } = useAppSettings();

  const [scale, setScale] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [zIndex, setZIndex] = useState(30);
  const [sampleAvatarId, setSampleAvatarId] = useState("avatar-dino");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOriginRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const sampleAvatars = useMemo(
    () => allAssets.filter((a) => a.category === "avatar" && a.enabled),
    [allAssets]
  );

  useEffect(() => {
    if (!asset) return;
    setScale(asset.scale);
    setPosX(asset.position_x);
    setPosY(asset.position_y);
    setZIndex(asset.z_index);
    if (sampleAvatars.length > 0 && !sampleAvatars.some((a) => a.id === sampleAvatarId)) {
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

  // Đảm bảo item đang sửa luôn được bật trong preview ngay cả khi hiện đang tắt
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
        scale,
        position_x: posX,
        position_y: posY,
        z_index: zIndex,
        enabled: true,
      },
    };
  }, [asset, scale, posX, posY, zIndex]);

  const handleResetPreset = () => {
    if (!asset) return;
    const preset = CATEGORY_PRESET_MAP[asset.category];
    feedback("tap");
    setScale(preset.scale);
    setPosX(preset.position_x);
    setPosY(preset.position_y);
    setZIndex(preset.z_index);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setSaving(true);
    try {
      await adminUpdateAvatarAsset(asset.id, {
        scale,
        position_x: posX,
        position_y: posY,
        z_index: zIndex,
      });
      await onSaved();
      feedback("success");
      showToast(`Đã lưu vị trí cho "${asset.name}"!`, "success");
      onClose();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật vị trí.",
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
      title={asset ? `CHỈNH VỊ TRÍ: ${asset.name.toUpperCase()}` : "CHỈNH VỊ TRÍ"}
    >
      {asset ? (
        <form onSubmit={handleSave} className="space-y-3 text-sm font-bold">
          {/* Khu vực xem trước real-time + kéo thả trực tiếp trên avatar mẫu */}
          <div className="bg-gradient-to-b from-[#BCEBFF] via-[#E4F7FE] to-[#FFE7B6] border-[2.5px] border-[#552416] rounded-2xl p-4 flex items-center justify-around gap-4 overflow-visible">
            <div className="flex flex-col items-center gap-1.5 overflow-visible">
              <div
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragging(true);
                  dragOriginRef.current = {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    startX: posX,
                    startY: posY,
                  };
                }}
                onPointerMove={(e) => {
                  if (!dragOriginRef.current) return;
                  const dxPct = Math.round(
                    ((e.clientX - dragOriginRef.current.clientX) / 104) * 100
                  );
                  const dyPct = Math.round(
                    ((e.clientY - dragOriginRef.current.clientY) / 104) * 100
                  );
                  setPosX(
                    Math.max(-150, Math.min(150, dragOriginRef.current.startX + dxPct))
                  );
                  setPosY(
                    Math.max(-150, Math.min(150, dragOriginRef.current.startY + dyPct))
                  );
                }}
                onPointerUp={() => {
                  dragOriginRef.current = null;
                  setDragging(false);
                }}
                onPointerCancel={() => {
                  dragOriginRef.current = null;
                  setDragging(false);
                }}
                style={{ touchAction: "none" }}
                className={`pt-4 pb-2 px-6 overflow-visible rounded-2xl border-2 border-dashed transition-colors select-none ${
                  dragging
                    ? "border-[#166A45] bg-white/40 cursor-grabbing"
                    : "border-[#552416]/35 hover:border-[#552416]/70 cursor-grab"
                }`}
                title="Nhấn giữ và kéo trực tiếp để di chuyển vật phẩm"
              >
                <LayeredAvatar
                  config={previewConfig}
                  size={104}
                  catalogOverride={previewCatalog}
                  assetOverrides={overrides}
                />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#552416]">
                <Move className="w-3 h-3" />
                KÉO THẢ HOẶC KÉO THANH TRƯỢT (104px)
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 overflow-visible">
              <div className="p-3 overflow-visible">
                <LayeredAvatar
                  config={previewConfig}
                  size={44}
                  catalogOverride={previewCatalog}
                  assetOverrides={overrides}
                />
              </div>
              <span className="text-[11px] font-extrabold text-[#552416]">
                TRONG PHÒNG (44px)
              </span>
            </div>
          </div>

          {/* Chọn avatar mẫu để test độ khớp */}
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
                    {av.name} ({av.id})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Bộ điều khiển Scale / Position X / Position Y / Z-Index */}
          <div className="space-y-2.5 bg-[#FDF6EA] border-2 border-[#552416]/25 rounded-2xl p-3">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                <span>Kích thước (Scale)</span>
                <span className="font-mono">{scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.05}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-[#552416]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                <span>Vị trí ngang (X %)</span>
                <span className="font-mono">{posX}%</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                step={1}
                value={posX}
                onChange={(e) => setPosX(Number(e.target.value))}
                className="w-full accent-[#428BC1]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                <span>Vị trí dọc (Y %)</span>
                <span className="font-mono">{posY}%</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                step={1}
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="w-full accent-[#E56E52]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                <span>Thứ tự lớp (z-index: Avatar = 20)</span>
                <span className="font-mono">{zIndex}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={zIndex}
                onChange={(e) => setZIndex(Number(e.target.value))}
                className="w-full accent-[#166A45]"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#6E402E]">
                <span>0-19: Sau avatar (Cánh)</span>
                <span>21-100: Trước/Trên avatar</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleResetPreset}
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
              <span>{saving ? "ĐANG LƯU..." : "LƯU VỊ TRÍ"}</span>
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
};
