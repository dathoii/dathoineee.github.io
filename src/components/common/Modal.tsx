import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#32150D]/55 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="chibi-card w-full max-w-[420px] max-h-[85dvh] flex flex-col overflow-hidden animate-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#FFDE84] border-b-[3px] border-[#552416]">
          <h2 className="font-display font-extrabold text-lg text-[#4A1D12]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-white border-2 border-[#552416] flex items-center justify-center text-[#552416] cursor-pointer hover:bg-[#FDE1DB]"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto text-sm font-bold leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
};
