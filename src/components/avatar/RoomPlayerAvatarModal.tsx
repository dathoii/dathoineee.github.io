import React, { useState } from "react";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { savePlayerAvatarConfig } from "../../services/avatarAssetService";
import type { AvatarConfig } from "../../types/game";
import { AvatarCustomizationModal } from "./AvatarCustomizationModal";

interface RoomPlayerAvatarModalProps {
  open: boolean;
  initialConfig: AvatarConfig;
  roomId?: string;
  onClose: () => void;
  onSaved?: (saved: AvatarConfig) => Promise<void> | void;
}

/**
 * Wrapper dùng chung cho các màn hình trong phòng để mở popup tùy chỉnh avatar
 * và đồng bộ ngay cấu hình mới lên Supabase Realtime + localStorage.
 */
export const RoomPlayerAvatarModal: React.FC<RoomPlayerAvatarModalProps> = ({
  open,
  initialConfig,
  roomId,
  onClose,
  onSaved,
}) => {
  const { feedback, saveAvatarConfigPref, showToast } = useAppSettings();
  const [saving, setSaving] = useState(false);

  const handleConfirm = async (nextConfig: AvatarConfig) => {
    setSaving(true);
    try {
      const saved = await savePlayerAvatarConfig(nextConfig, roomId);
      saveAvatarConfigPref(saved);
      if (onSaved) {
        await onSaved(saved);
      }
      feedback("success");
      showToast("Đã cập nhật avatar!", "success");
      onClose();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật avatar.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AvatarCustomizationModal
      open={open}
      initialConfig={initialConfig}
      saving={saving}
      onClose={onClose}
      onConfirm={handleConfirm}
    />
  );
};
