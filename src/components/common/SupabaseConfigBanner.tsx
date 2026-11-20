import React from "react";
import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "../../services/supabase";

export const SupabaseConfigBanner: React.FC = () => {
  if (isSupabaseConfigured) return null;

  return (
    <div className="chibi-section-warning border-[2.5px] border-[#B52B27] p-3 mb-3 text-xs sm:text-sm font-bold text-[#7D1D1A] flex items-start gap-2.5">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#D93832]" />
      <div>
        <div>Chưa kết nối Supabase Backend!</div>
        <div className="font-semibold text-[11px] sm:text-xs mt-0.5 opacity-95">
          Hãy tạo file <code>.env</code> chứa <code>VITE_SUPABASE_URL</code> và{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> (xem hướng dẫn chi tiết trong{" "}
          <code>README.md</code>) để tạo phòng và đồng bộ nhiều điện thoại.
        </div>
      </div>
    </div>
  );
};
