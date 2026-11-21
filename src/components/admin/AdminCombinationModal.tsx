import React, { useMemo, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Modal } from "../common/Modal";
import { LayeredAvatar } from "../avatar/LayeredAvatar";
import type {
  AvatarAsset,
  AvatarConfig,
  PerformanceQuality,
} from "../../types/game";
import { DEFAULT_AVATAR_CONFIG } from "../../utils/avatars";

interface AdminCombinationModalProps {
  open: boolean;
  allAssets: AvatarAsset[];
  onClose: () => void;
}

export const AdminCombinationModal: React.FC<AdminCombinationModalProps> = ({
  open,
  allAssets,
  onClose,
}) => {
  const avatars = useMemo(
    () => allAssets.filter((a) => a.category === "avatar"),
    [allAssets]
  );
  const heads = useMemo(
    () => allAssets.filter((a) => a.category === "head"),
    [allAssets]
  );
  const wings = useMemo(
    () => allAssets.filter((a) => a.category === "wings"),
    [allAssets]
  );
  const effects = useMemo(
    () => allAssets.filter((a) => a.category === "effects"),
    [allAssets]
  );
  const others = useMemo(
    () => allAssets.filter((a) => a.category === "other"),
    [allAssets]
  );

  const [combo, setCombo] = useState<AvatarConfig>({
    avatarId: avatars[0]?.id ?? DEFAULT_AVATAR_CONFIG.avatarId,
    headId: heads[0]?.id ?? null,
    wingsId: wings[0]?.id ?? null,
    effectsId: effects[0]?.id ?? null,
    otherIds: others[0] ? [others[0].id] : [],
  });
  const [perf, setPerf] = useState<PerformanceQuality>("high");

  const previewCatalog = useMemo(
    () => allAssets.map((item) => ({ ...item, enabled: true })),
    [allAssets]
  );

  const toggleOther = (id: string) => {
    setCombo((prev) => ({
      ...prev,
      otherIds: prev.otherIds.includes(id)
        ? prev.otherIds.filter((item) => item !== id)
        : [...prev.otherIds, id],
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="PREVIEW COMBINATION (XEM THỬ ĐỒNG THỜI)"
    >
      <div className="space-y-3 text-sm font-bold">
        {/* Sân khấu chạy đồng thời tất cả hoạt ảnh */}
        <div className="bg-gradient-to-b from-[#BCEBFF] via-[#E4F7FE] to-[#FFE7B6] border-[2.5px] border-[#552416] rounded-2xl p-4 flex items-center justify-around gap-4 overflow-visible">
          <div className="flex flex-col items-center gap-1.5 overflow-visible">
            <div className="pt-5 pb-3 px-8 overflow-visible">
              <LayeredAvatar
                config={combo}
                size={112}
                catalogOverride={previewCatalog}
                performanceOverride={perf}
              />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#552416]">
              <Sparkles className="w-3.5 h-3.5 text-[#E59B14]" />
              COMBO ĐỘNG (112px)
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 overflow-visible">
            <div className="p-3 overflow-visible">
              <LayeredAvatar
                config={combo}
                size={44}
                catalogOverride={previewCatalog}
                performanceOverride={perf}
              />
            </div>
            <span className="text-[11px] font-extrabold text-[#552416]">
              TRONG PHÒNG (44px)
            </span>
          </div>
        </div>

        {/* Bộ chọn 3 mức hiệu năng */}
        <div className="flex items-center justify-between gap-2 bg-[#FFF8EB] border-2 border-[#552416]/25 rounded-xl px-3 py-2">
          <span className="text-xs font-extrabold text-[#4A1D12]">
            Thử mức hiệu năng:
          </span>
          <div className="flex gap-1">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPerf(level)}
                className={`px-2.5 py-0.5 rounded-lg border-2 border-[#552416] text-xs font-extrabold uppercase cursor-pointer ${
                  perf === level
                    ? "bg-[#ADE7CF] text-[#166A45]"
                    : "bg-white text-[#552416]/75"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Bộ chọn từng lớp */}
        <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-0.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-extrabold mb-0.5">
                Avatar ({avatars.length}):
              </label>
              <select
                value={combo.avatarId}
                onChange={(e) =>
                  setCombo((prev) => ({ ...prev, avatarId: e.target.value }))
                }
                className="chibi-input !py-1.5 !px-2 text-xs"
              >
                {avatars.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold mb-0.5">
                Head ({heads.length}):
              </label>
              <select
                value={combo.headId ?? ""}
                onChange={(e) =>
                  setCombo((prev) => ({
                    ...prev,
                    headId: e.target.value || null,
                  }))
                }
                className="chibi-input !py-1.5 !px-2 text-xs"
              >
                <option value="">-- Không dùng --</option>
                {heads.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold mb-0.5">
                Wings ({wings.length}):
              </label>
              <select
                value={combo.wingsId ?? ""}
                onChange={(e) =>
                  setCombo((prev) => ({
                    ...prev,
                    wingsId: e.target.value || null,
                  }))
                }
                className="chibi-input !py-1.5 !px-2 text-xs"
              >
                <option value="">-- Không dùng --</option>
                {wings.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold mb-0.5">
                Effects ({effects.length}):
              </label>
              <select
                value={combo.effectsId ?? ""}
                onChange={(e) =>
                  setCombo((prev) => ({
                    ...prev,
                    effectsId: e.target.value || null,
                  }))
                }
                className="chibi-input !py-1.5 !px-2 text-xs"
              >
                <option value="">-- Không dùng --</option>
                {effects.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-extrabold mb-1">
              Other (chọn nhiều phụ kiện đồng thời - {combo.otherIds.length} đang bật):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {others.map((o) => {
                const active = combo.otherIds.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggleOther(o.id)}
                    className={`px-2 py-1 rounded-xl border-2 text-[11px] font-extrabold cursor-pointer ${
                      active
                        ? "bg-[#FFE7A8] border-[#552416] text-[#4A1D12]"
                        : "bg-white border-[#552416]/35 text-[#6E402E]"
                    }`}
                  >
                    {active ? "✓ " : ""}
                    {o.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              setCombo({
                avatarId: avatars[0]?.id ?? DEFAULT_AVATAR_CONFIG.avatarId,
                headId: null,
                wingsId: null,
                effectsId: null,
                otherIds: [],
              })
            }
            className="chibi-btn btn-cream !min-h-[42px] px-3 py-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>THÁO HẾT</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="chibi-btn btn-mint !min-h-[42px] px-4 py-2 text-sm flex-1"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </Modal>
  );
};
