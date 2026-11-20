import React from "react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "XÁC NHẬN",
  cancelLabel = "HỦY",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-[15px] leading-relaxed">{message}</p>
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="chibi-btn btn-cream flex-1 text-base"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`chibi-btn ${danger ? "btn-pink" : "btn-mint"} flex-1 text-base`}
        >
          {loading ? "ĐANG XỬ LÝ..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
