import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Modal } from "../common/Modal";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import {
  adminCreateAvatarAsset,
  adminUploadAssetImage,
  slugifyAssetId,
} from "../../services/avatarAssetService";
import type { AssetCategory } from "../../types/game";
import { getDefaultAnimationForCategory } from "../../animation/animationEngine";
import { ASSET_CATEGORIES_META, CATEGORY_PRESET_MAP } from "./assetManagerPresets";

interface UploadDraftItem {
  localKey: string;
  file: File;
  previewUrl: string;
  id: string;
  name: string;
  category: AssetCategory;
  description: string;
  enabled: boolean;
  error?: string;
}

interface AssetUploadModalProps {
  open: boolean;
  defaultCategory: AssetCategory;
  existingIds: Set<string>;
  onClose: () => void;
  onUploaded: () => Promise<void> | void;
}

const VALID_MIME = new Set(["image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  open,
  defaultCategory,
  existingIds,
  onClose,
  onUploaded,
}) => {
  const { showToast, feedback } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [batchCategory, setBatchCategory] = useState<AssetCategory>(defaultCategory);
  const [queue, setQueue] = useState<UploadDraftItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setBatchCategory(defaultCategory);
    } else {
      setQueue((prev) => {
        prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        return [];
      });
    }
  }, [open, defaultCategory]);

  const validateItem = useCallback(
    (item: UploadDraftItem, list: UploadDraftItem[]): string | undefined => {
      if (!VALID_MIME.has(item.file.type)) {
        return "Chỉ hỗ trợ ảnh PNG nền trong suốt hoặc WebP.";
      }
      if (item.file.size > MAX_BYTES) {
        return "Dung lượng tối đa 2MB/file.";
      }
      if (!item.name.trim()) {
        return "Vui lòng nhập tên vật phẩm.";
      }
      if (!/^[a-z0-9][a-z0-9_-]{1,58}$/.test(item.id.trim())) {
        return "Mã ID chỉ gồm chữ thường a-z, số, '-' hoặc '_' (2-60 ký tự).";
      }
      if (existingIds.has(item.id.trim())) {
        return `Mã ID "${item.id.trim()}" đã tồn tại trong kho!`;
      }
      const dupInQueue = list.filter(
        (other) => other.localKey !== item.localKey && other.id.trim() === item.id.trim()
      );
      if (dupInQueue.length > 0) {
        return `Trùng mã ID với một file khác trong hàng chờ.`;
      }
      return undefined;
    },
    [existingIds]
  );

  const appendFiles = useCallback(
    (files: FileList | File[]) => {
      const additions: UploadDraftItem[] = [];
      Array.from(files).forEach((file, idx) => {
        const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        const prettyName = baseName
          ? baseName.charAt(0).toUpperCase() + baseName.slice(1)
          : `Vật phẩm ${idx + 1}`;
        const candidateId = slugifyAssetId(baseName || `item-${Date.now()}-${idx}`, batchCategory);
        additions.push({
          localKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          id: candidateId,
          name: prettyName.slice(0, 60),
          category: batchCategory,
          description: "",
          enabled: true,
        });
      });

      setQueue((prev) => [...prev, ...additions]);
    },
    [batchCategory]
  );

  const queueWithErrors = useMemo(
    () =>
      queue.map((item) => ({
        ...item,
        computedError: validateItem(item, queue),
      })),
    [queue, validateItem]
  );

  const hasInvalidItems = queueWithErrors.some((i) => Boolean(i.computedError));

  const updateItem = (localKey: string, patch: Partial<UploadDraftItem>) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.localKey !== localKey) return item;
        const next = { ...item, ...patch };
        if (patch.category && patch.category !== item.category) {
          next.id = slugifyAssetId(next.name, patch.category);
        }
        return next;
      })
    );
  };

  const removeItem = (localKey: string) => {
    setQueue((prev) => {
      const target = prev.find((i) => i.localKey === localKey);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.localKey !== localKey);
    });
  };

  const handleUploadAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queueWithErrors.length === 0 || hasInvalidItems) return;

    setUploading(true);
    let successCount = 0;
    const failedKeys = new Map<string, string>();

    try {
      for (const item of queueWithErrors) {
        const cleanId = item.id.trim();
        const preset = CATEGORY_PRESET_MAP[item.category];
        try {
          const { imageUrl, storagePath } = await adminUploadAssetImage(
            item.file,
            item.category,
            cleanId
          );
          await adminCreateAvatarAsset({
            id: cleanId,
            name: item.name.trim(),
            category: item.category,
            image_url: imageUrl,
            storage_path: storagePath,
            description: item.description.trim(),
            enabled: item.enabled,
            scale: preset.scale,
            position_x: preset.position_x,
            position_y: preset.position_y,
            z_index: preset.z_index,
            animation: getDefaultAnimationForCategory(item.category),
          });
          successCount += 1;
        } catch (err) {
          failedKeys.set(
            item.localKey,
            err instanceof Error ? err.message : "Tải lên thất bại."
          );
        }
      }

      if (successCount > 0) {
        await onUploaded();
        feedback("success");
        showToast(
          `Đã tải lên thành công ${successCount} vật phẩm!`,
          "success"
        );
      }

      if (failedKeys.size === 0) {
        onClose();
      } else {
        setQueue((prev) =>
          prev
            .filter((item) => failedKeys.has(item.localKey))
            .map((item) => ({
              ...item,
              error: failedKeys.get(item.localKey),
            }))
        );
        feedback("alert");
        showToast(
          `${failedKeys.size} file tải lên chưa thành công, hãy kiểm tra lại thông báo bên dưới.`,
          "error"
        );
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !uploading && onClose()}
      title="TẢI LÊN VẬT PHẨM / PHỤ KIỆN"
    >
      <form onSubmit={handleUploadAll} className="space-y-3 text-sm font-bold">
        {/* Chọn phân loại mặc định cho lô upload */}
        <div>
          <label className="block text-xs font-extrabold text-[#552416] mb-1">
            Phân loại mặc định khi chọn file:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ASSET_CATEGORIES_META.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={uploading}
                onClick={() => setBatchCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl border-2 text-xs font-extrabold cursor-pointer ${
                  batchCategory === cat.id
                    ? "bg-[#ADE7CF] border-[#552416] text-[#4A1D12]"
                    : "bg-white border-[#552416]/35 text-[#6E3B2B]"
                }`}
              >
                {cat.emoji} {cat.shortLabel}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-bold text-[#6E402E] mt-1">
            {CATEGORY_PRESET_MAP[batchCategory].hint}
          </p>
        </div>

        {/* Vùng kéo thả / chọn nhiều file */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.length) {
              appendFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-[3px] border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
            dragging
              ? "bg-[#ADE7CF]/45 border-[#166A45]"
              : "bg-[#FFF9ED] border-[#552416]/45 hover:bg-[#FCEAD4]/55"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                appendFiles(e.target.files);
              }
              e.target.value = "";
            }}
          />
          <UploadCloud className="w-8 h-8 mx-auto text-[#428BC1] mb-1" />
          <div className="font-display font-extrabold text-sm text-[#4A1D12]">
            KÉO THẢ HOẶC CHỌN NHIỀU ẢNH
          </div>
          <div className="text-[11px] font-bold text-[#6E402E]">
            Hỗ trợ PNG nền trong suốt hoặc WebP (tối đa 2MB/ảnh)
          </div>
        </div>

        {/* Danh sách ảnh trong hàng chờ */}
        {queueWithErrors.length > 0 ? (
          <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-0.5">
            {queueWithErrors.map((item) => {
              const errMsg = item.computedError || item.error;
              return (
                <div
                  key={item.localKey}
                  className={`rounded-2xl border-[2.5px] p-2.5 space-y-2 ${
                    errMsg
                      ? "bg-[#FCE8E8] border-[#B52B27]"
                      : "bg-[#FDF8EE] border-[#552416]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-16 h-16 rounded-xl border-2 border-[#552416]/50 shrink-0 flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                        backgroundSize: "12px 12px",
                        backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                      }}
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-14 h-14 object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(item.localKey, { name: e.target.value })
                          }
                          placeholder="Tên vật phẩm *"
                          className="chibi-input !py-1.5 !px-2.5 text-xs flex-1"
                        />
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => removeItem(item.localKey)}
                          aria-label="Xóa khỏi hàng chờ"
                          className="w-8 h-8 rounded-xl bg-[#F8ADAD] border-2 border-[#552416] flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-[#7D1916]" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          value={item.id}
                          onChange={(e) =>
                            updateItem(item.localKey, {
                              id: e.target.value.toLowerCase(),
                            })
                          }
                          placeholder="Mã ID duy nhất *"
                          className="chibi-input !py-1 !px-2 text-[11px] font-mono"
                        />
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateItem(item.localKey, {
                              category: e.target.value as AssetCategory,
                            })
                          }
                          className="chibi-input !py-1 !px-2 text-xs"
                        >
                          {ASSET_CATEGORIES_META.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.emoji} {cat.shortLabel}
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.localKey, { description: e.target.value })
                        }
                        placeholder="Mô tả ngắn (tuỳ chọn)..."
                        className="chibi-input !py-1 !px-2 text-xs"
                      />
                    </div>
                  </div>

                  {errMsg ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#B52B27]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errMsg}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#166A45]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sẵn sàng tải lên ({(item.file.size / 1024).toFixed(0)} KB)
                      </span>
                      <label className="inline-flex items-center gap-1 cursor-pointer text-[#4A1D12]">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) =>
                            updateItem(item.localKey, {
                              enabled: e.target.checked,
                            })
                          }
                        />
                        Bật cho người chơi
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="chibi-btn btn-cream !min-h-[44px] py-2 text-sm"
          >
            HỦY
          </button>
          <button
            type="submit"
            disabled={uploading || queueWithErrors.length === 0 || hasInvalidItems}
            className="chibi-btn btn-mint !min-h-[44px] py-2 text-sm"
          >
            <ImagePlus className="w-4 h-4 stroke-[2.6]" />
            <span>
              {uploading
                ? "ĐANG TẢI LÊN..."
                : `TẢI LÊN (${queueWithErrors.length})`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
