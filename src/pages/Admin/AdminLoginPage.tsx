import React, { useEffect, useState } from "react";
import { KeyRound, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { SupabaseConfigBanner } from "../../components/common/SupabaseConfigBanner";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { adminSignIn } from "../../services/adminService";
import detectiveKey from "../../assets/characters/detective-key.png";

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { feedback, showToast } = useAppSettings();
  const { isAdmin, refreshAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      feedback("alert");
      setErrorMsg("Vui lòng nhập đầy đủ Email và Mật khẩu Admin.");
      return;
    }

    setSubmitting(true);
    try {
      await adminSignIn(email, password);
      await refreshAuth();
      feedback("success");
      showToast("Đăng nhập Admin thành công!", "success");
      navigate("/admin", { replace: true });
    } catch (err) {
      feedback("alert");
      setErrorMsg(
        err instanceof Error ? err.message : "Đăng nhập Admin thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SkyBackdrop>
      <BrandHeader showBack onBack={() => navigate("/settings")} />

      <SupabaseConfigBanner />

      <div className="flex flex-col items-center mt-1 mb-2">
        <img
          src={detectiveKey}
          alt="Thám tử giữ chìa khóa Admin"
          className="w-24 h-auto mb-1 z-20 select-none"
          draggable={false}
        />
        <h1 className="chibi-title-3d text-[28px] text-center">
          ĐĂNG NHẬP ADMIN
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="chibi-card p-4 space-y-3.5 mb-6">
        <div className="chibi-section-lavender p-3 text-xs font-bold text-center">
          🔒 Không hỗ trợ tự đăng ký công khai. Chỉ tài khoản được cấp quyền trong
          bảng <code>admin_roles</code> trên Supabase mới có thể truy cập.
        </div>

        <div>
          <label
            htmlFor="admin-email"
            className="flex items-center gap-1.5 font-display font-extrabold text-sm mb-1"
          >
            <Mail className="w-4 h-4" />
            <span>EMAIL QUẢN TRỊ</span>
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@dathoineee.com"
            className="chibi-input"
          />
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="flex items-center gap-1.5 font-display font-extrabold text-sm mb-1"
          >
            <Lock className="w-4 h-4" />
            <span>MẬT KHẨU</span>
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="chibi-input"
          />
        </div>

        {errorMsg ? (
          <div className="chibi-section-warning border-2 border-[#B52B27] px-3 py-2 text-xs font-extrabold text-[#9E1C19] text-center">
            ⚠️ {errorMsg}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="chibi-btn btn-yellow w-full text-xl py-3"
        >
          <KeyRound className="w-5 h-5 stroke-[2.6]" />
          <span>{submitting ? "ĐANG XÁC MINH..." : "ĐĂNG NHẬP"}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="chibi-btn btn-cream w-full text-base py-2.5"
        >
          QUAY LẠI CÀI ĐẶT
        </button>
      </form>
    </SkyBackdrop>
  );
};
