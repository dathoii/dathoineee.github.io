import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useAppSettings } from "../../contexts/AppSettingsContext";

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAppSettings();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[92vw] max-w-[420px] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => {
        const bgClass =
          t.type === "success"
            ? "bg-[#DDF6EA] text-[#166A45]"
            : t.type === "error"
            ? "bg-[#FDE1DB] text-[#9E1C19]"
            : "bg-[#FFF7D6] text-[#552416]";

        const Icon =
          t.type === "success"
            ? CheckCircle2
            : t.type === "error"
            ? AlertCircle
            : Info;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-[3px] border-[#552416] shadow-[0_4px_0_rgba(85,36,22,0.28)] font-bold text-sm animate-page-enter ${bgClass}`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => dismissToast(t.id)}
              className="p-0.5 rounded-full hover:bg-black/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
