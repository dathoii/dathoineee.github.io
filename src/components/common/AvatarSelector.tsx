import React, { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useAvatarCatalog } from "../../contexts/AvatarCatalogContext";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import type { AvatarConfig } from "../../types/game";
import { getAvatarRingColor, resolveAssetImageUrl } from "../../utils/avatars";
import { savePlayerAvatarConfig } from "../../services/avatarAssetService";
import { LayeredAvatar } from "../avatar/LayeredAvatar";
import { AvatarCustomizationModal } from "../avatar/AvatarCustomizationModal";

interface AvatarSelectorProps {
  selectedConfig: AvatarConfig;
  onChangeConfig: (next: AvatarConfig) => void;
  compact?: boolean;
  roomId?: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedConfig,
  onChangeConfig,
  compact = false,
  roomId,
}) => {
  const { assets } = useAvatarCatalog();
  const { feedback, showToast, saveAvatarConfigPref } = useAppSettings();
  const [popupOpen, setPopupOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const avatarItems = useMemo(
    () => assets.filter((item) => item.category === "avatar" && item.enabled),
    [assets]
  );

  const circleSize = compact ? 48 : 62;

  const handleConfirmPopup = async (nextConfig: AvatarConfig) => {
    setSaving(true);
    try {
      const saved = await savePlayerAvatarConfig(nextConfig, roomId).catch(
        () => nextConfig
      );
      saveAvatarConfigPref(saved);
      onChangeConfig(saved);
      setPopupOpen(false);
      showToast("Đã cập nhật diện mạo avatar!", "success");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarTileClick = (id: string) => {
    feedback("tap");
    if (selectedConfig.avatarId === id) {
      // Nhấn vào avatar hình tròn hiện tại -> mở POPUP AVATAR CUSTOMIZATION
      setPopupOpen(true);
      return;
    }
    const next = {
      ...selectedConfig,
      avatarId: id,
    };
    saveAvatarConfigPref(next);
    onChangeConfig(next);
  };

  return (
    <>
      <div className="chibi-section-peach px-2.5 py-2.5">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1.5">
          {/* Avatar hiện tại có gắn phụ kiện - nhấn vào để mở Popup tùy chỉnh */}
          <div className="shrink-0 flex flex-col items-center gap-1 pr-2 border-r-2 border-dashed border-[#552416]/25">
            <LayeredAvatar
              config={selectedConfig}
              size={circleSize}
              interactive
              showBadge
              ariaLabel="Mở tùy chỉnh avatar và phụ kiện"
              onClick={() => {
                feedback("tap");
                setPopupOpen(true);
              }}
            />
            <button
              type="button"
              onClick={() => {
                feedback("tap");
                setPopupOpen(true);
              }}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FFDE84] border border-[#552416] text-[10px] font-display font-extrabold text-[#4A1D12] cursor-pointer hover:brightness-105"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Tùy chỉnh</span>
            </button>
          </div>

          {/* Danh sách nhanh các avatar hình tròn đang bật trong kho */}
          {avatarItems.map((av) => {
            const isSelected = selectedConfig.avatarId === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleAvatarTileClick(av.id)}
                aria-label={
                  isSelected
                    ? `Tùy chỉnh ${av.name}`
                    : `Chọn avatar ${av.name}`
                }
                aria-pressed={isSelected}
                style={{
                  width: circleSize,
                  height: circleSize,
                  backgroundColor: getAvatarRingColor(av.id),
                }}
                className={`relative shrink-0 rounded-full transition-transform cursor-pointer ${
                  isSelected
                    ? "scale-105 ring-4 ring-[#F6BE3D] border-[3px] border-[#552416]"
                    : "border-[2.5px] border-[#552416]/75 opacity-90 hover:opacity-100"
                }`}
              >
                <img
                  src={resolveAssetImageUrl(av.image_url)}
                  alt={av.name}
                  className="w-full h-full rounded-full object-cover"
                  draggable={false}
                />
                {isSelected ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1EA454] border-2 border-white flex items-center justify-center text-white shadow">
                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <AvatarCustomizationModal
        open={popupOpen}
        initialConfig={selectedConfig}
        saving={saving}
        onClose={() => setPopupOpen(false)}
        onConfirm={handleConfirmPopup}
      />
    </>
  );
};
