import React, { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Check,
  Crown,
  Feather,
  RotateCcw,
  Sparkles,
  Sticker,
  User,
  X,
} from "lucide-react";
import { useAvatarCatalog } from "../../contexts/AvatarCatalogContext";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import {
  buildAnimationVars,
  coerceAnimationConfig,
  getAnimationClassName,
} from "../../animation/animationEngine";
import type { AssetCategory, AvatarConfig } from "../../types/game";
import {
  DEFAULT_AVATAR_CONFIG,
  normalizeAvatarConfig,
  resolveAssetImageUrl,
} from "../../utils/avatars";
import { LayeredAvatar } from "./LayeredAvatar";

interface AvatarCustomizationModalProps {
  open: boolean;
  initialConfig: AvatarConfig;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (nextConfig: AvatarConfig) => Promise<void> | void;
}

const TABS: {
  id: AssetCategory;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "avatar", label: "AVATAR", Icon: User },
  { id: "head", label: "HEAD", Icon: Crown },
  { id: "wings", label: "WINGS", Icon: Feather },
  { id: "effects", label: "EFFECTS", Icon: Sparkles },
  { id: "other", label: "OTHER", Icon: Sticker },
];

export const AvatarCustomizationModal: React.FC<AvatarCustomizationModalProps> = ({
  open,
  initialConfig,
  saving = false,
  onClose,
  onConfirm,
}) => {
  const { assets } = useAvatarCatalog();
  const { feedback } = useAppSettings();

  const [activeTab, setActiveTab] = useState<AssetCategory>("avatar");
  const [draft, setDraft] = useState<AvatarConfig>(initialConfig);

  useEffect(() => {
    if (open) {
      setDraft(normalizeAvatarConfig(initialConfig, assets));
    }
  }, [open, initialConfig, assets]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, saving, onClose]);

  const itemsInTab = useMemo(
    () => assets.filter((item) => item.category === activeTab && item.enabled),
    [assets, activeTab]
  );

  if (!open) return null;

  const isSelected = (id: string): boolean => {
    if (activeTab === "avatar") return draft.avatarId === id;
    if (activeTab === "head") return draft.headId === id;
    if (activeTab === "wings") return draft.wingsId === id;
    if (activeTab === "effects") return draft.effectsId === id;
    return draft.otherIds.includes(id);
  };

  const handleSelectItem = (id: string) => {
    feedback("tap");
    setDraft((prev) => {
      if (activeTab === "avatar") {
        // Đổi avatar giữ nguyên phụ kiện đang mặc
        return { ...prev, avatarId: id };
      }
      if (activeTab === "head") {
        return { ...prev, headId: prev.headId === id ? null : id };
      }
      if (activeTab === "wings") {
        return { ...prev, wingsId: prev.wingsId === id ? null : id };
      }
      if (activeTab === "effects") {
        return { ...prev, effectsId: prev.effectsId === id ? null : id };
      }
      // OTHER hỗ trợ nhiều vật phẩm cùng lúc
      const exists = prev.otherIds.includes(id);
      return {
        ...prev,
        otherIds: exists
          ? prev.otherIds.filter((item) => item !== id)
          : [...prev.otherIds, id],
      };
    });
  };

  const handleClearCategory = () => {
    feedback("tap");
    setDraft((prev) => {
      if (activeTab === "head") return { ...prev, headId: null };
      if (activeTab === "wings") return { ...prev, wingsId: null };
      if (activeTab === "effects") return { ...prev, effectsId: null };
      if (activeTab === "other") return { ...prev, otherIds: [] };
      return prev;
    });
  };

  const handleReset = () => {
    feedback("tap");
    const firstAvatar =
      assets.find((item) => item.category === "avatar" && item.enabled)?.id ??
      DEFAULT_AVATAR_CONFIG.avatarId;
    setDraft({
      avatarId: firstAvatar,
      headId: null,
      wingsId: null,
      effectsId: null,
      otherIds: [],
    });
  };

  const handleConfirm = async () => {
    feedback("success");
    const clean = normalizeAvatarConfig(draft, assets);
    await onConfirm(clean);
  };

  const isNoneSelected =
    (activeTab === "head" && !draft.headId) ||
    (activeTab === "wings" && !draft.wingsId) ||
    (activeTab === "effects" && !draft.effectsId) ||
    (activeTab === "other" && draft.otherIds.length === 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#32150D]/60 backdrop-blur-[2px] p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Tùy chỉnh Avatar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="chibi-card w-full max-w-[430px] max-h-[90dvh] flex flex-col overflow-hidden animate-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Popup */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#FFDE84] border-b-[3px] border-[#552416]">
          <div className="flex items-center gap-1.5 font-display font-extrabold text-lg text-[#4A1D12]">
            <Sparkles className="w-5 h-5 text-[#D86E1D]" />
            <span>TÙY CHỈNH AVATAR</span>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-white border-2 border-[#552416] flex items-center justify-center text-[#552416] cursor-pointer hover:bg-[#FDE1DB]"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 1. KHU VỰC PREVIEW (không bị cắt cánh/vương miện) */}
        <div className="bg-gradient-to-b from-[#D7EEFF] to-[#FFF6E5] border-b-[3px] border-[#552416] px-4 py-3 flex flex-col items-center justify-center relative">
          <div className="h-[162px] w-full flex items-center justify-center overflow-visible">
            <LayeredAvatar config={draft} size={104} />
          </div>
          <div className="text-[11px] font-extrabold text-[#552416]/85 mt-1 text-center">
            {activeTab === "other"
              ? `Có thể chọn nhiều phụ kiện OTHER (${draft.otherIds.length} đang chọn)`
              : "Chọn vật phẩm bên dưới để xem trước ngay!"}
          </div>
        </div>

        {/* 2. KHU VỰC 5 TAB DANH MỤC (hiển thị đủ 5 tab gọn gàng trên màn hình mobile) */}
        <div
          role="tablist"
          aria-label="Danh mục tùy chỉnh avatar"
          className="grid grid-cols-5 gap-1 px-2 py-2 bg-[#FCEAD4] border-b-2 border-[#552416]/20"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  feedback("tap");
                  setActiveTab(tab.id);
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1 py-1.5 rounded-xl border-[2px] font-display font-extrabold text-[10px] sm:text-xs leading-none cursor-pointer transition-all min-w-0 ${
                  active
                    ? "bg-[#ADE7CF] border-[#552416] text-[#4A1D12] shadow-[0_3px_0_#66B896] -translate-y-0.5"
                    : "bg-white/85 border-[#552416]/45 text-[#552416]/80 hover:bg-white"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5 shrink-0 stroke-[2.6]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. KHU VỰC DANH SÁCH VẬT PHẨM DẠNG LƯỚI */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Nút KHÔNG SỬ DỤNG để tháo phụ kiện */}
            {activeTab !== "avatar" ? (
              <button
                type="button"
                onClick={handleClearCategory}
                aria-pressed={isNoneSelected}
                className={`rounded-2xl border-[2.5px] p-2 flex flex-col items-center justify-center gap-1.5 min-h-[104px] cursor-pointer transition-transform active:scale-95 ${
                  isNoneSelected
                    ? "bg-[#FDE1DB] border-[#552416] ring-2 ring-[#F6BE3D]"
                    : "bg-[#FFFDF9] border-[#552416]/45 hover:border-[#552416]"
                }`}
              >
                <span className="w-10 h-10 rounded-full bg-white border-2 border-[#552416]/40 flex items-center justify-center text-[#B52B27]">
                  <Ban className="w-5 h-5" />
                </span>
                <span className="font-display font-extrabold text-[11px] leading-tight text-center text-[#4A1D12]">
                  KHÔNG SỬ DỤNG
                </span>
              </button>
            ) : null}

            {itemsInTab.map((item) => {
              const selected = isSelected(item.id);
              const tileAnim = coerceAnimationConfig(item.animation, item.category);
              const tileAnimClass = tileAnim.enabled
                ? getAnimationClassName(tileAnim)
                : "";
              const tileAnimVars = tileAnim.enabled
                ? buildAnimationVars(tileAnim, "medium")
                : undefined;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item.id)}
                  aria-pressed={selected}
                  className={`relative rounded-2xl border-[2.5px] p-2 flex flex-col items-center justify-between gap-1 min-h-[104px] cursor-pointer transition-transform active:scale-95 ${
                    selected
                      ? "bg-[#FFF7D6] border-[#552416] ring-2 ring-[#F6BE3D] shadow-[0_3px_0_#D8A735]"
                      : "bg-[#FFFDF9] border-[#552416]/45 hover:border-[#552416]"
                  }`}
                >
                  {selected ? (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#1EA454] border-2 border-white flex items-center justify-center text-white shadow z-10">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </span>
                  ) : null}

                  <div className="w-14 h-14 flex items-center justify-center">
                    <div
                      className={`w-13 h-13 flex items-center justify-center ${tileAnimClass}`}
                      style={tileAnimVars}
                    >
                      <img
                        src={resolveAssetImageUrl(item.image_url)}
                        alt={item.name}
                        draggable={false}
                        className={`max-w-full max-h-full object-contain ${
                          item.category === "avatar"
                            ? "rounded-full border-2 border-[#552416] w-13 h-13 object-cover"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                  <span className="font-display font-extrabold text-[11px] leading-tight text-center text-[#4A1D12] line-clamp-2">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          {itemsInTab.length === 0 ? (
            <div className="text-center py-6 text-xs font-bold opacity-75">
              Chưa có vật phẩm nào được bật trong mục này.
            </div>
          ) : null}
        </div>

        {/* 4. CÁC NÚT ĐIỀU KHIỂN: RESET / CANCEL / CONFIRM */}
        <div className="p-3 bg-[#FFF8F1] border-t-[3px] border-[#552416] flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleReset}
            className="chibi-btn btn-cream !min-h-[44px] !px-3 text-xs sm:text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => {
              feedback("tap");
              onClose();
            }}
            className="chibi-btn btn-pink !min-h-[44px] flex-1 text-sm"
          >
            CANCEL
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleConfirm}
            className="chibi-btn btn-mint !min-h-[44px] flex-1 text-sm"
          >
            {saving ? "ĐANG LƯU..." : "CONFIRM"}
          </button>
        </div>
      </div>
    </div>
  );
};
