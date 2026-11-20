import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Globe,
  KeyRound,
  LogOut,
  Settings,
  Smartphone,
  Sparkles,
  SunMoon,
  Volume2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { adminSignOut, getWordBankStats } from "../../services/adminService";
import { WORD_CATEGORIES_META } from "../../utils/avatars";
import type { WordBankStats } from "../../types/game";
import detectiveSettingsPeek from "../../assets/characters/detective-settings-peek.png";
import detectiveKey from "../../assets/characters/detective-key.png";
import adminLock from "../../assets/icons/admin-lock.png";

interface ChibiSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

const ChibiSwitch: React.FC<ChibiSwitchProps> = ({
  checked,
  onChange,
  ariaLabel,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={`relative w-14 h-8 rounded-full border-[2.5px] border-[#552416] transition-colors cursor-pointer shrink-0 ${
      checked ? "bg-[#8CD9B6]" : "bg-[#B5B8C0]"
    }`}
  >
    <span
      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white border-2 border-[#552416] shadow-sm transition-transform ${
        checked ? "left-[26px]" : "left-0.5"
      }`}
    />
  </button>
);

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSetting, feedback, showToast } = useAppSettings();
  const { isAdmin, refreshAuth } = useAuth();

  const [stats, setStats] = useState<WordBankStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Chỉ tải thống kê kho từ khóa khi đã được backend xác minh là Admin
  useEffect(() => {
    if (!isAdmin) {
      setStats(null);
      return;
    }

    let cancelled = false;
    setLoadingStats(true);
    getWordBankStats()
      .then((res) => {
        if (!cancelled) setStats(res);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const handleLogoutAdmin = async () => {
    await adminSignOut();
    await refreshAuth();
    setStats(null);
    feedback("tap");
    showToast("Đã đăng xuất tài khoản Admin.", "info");
  };

  return (
    <SkyBackdrop>
      <BrandHeader
        showBack
        onBack={() => navigate("/")}
        rightExtra={
          <img
            src={detectiveSettingsPeek}
            alt="Thám tử Chibi"
            className="w-16 h-16 object-contain -my-3 -mr-1 select-none"
            draggable={false}
          />
        }
      />

      <h1 className="chibi-title-3d text-[25px] sm:text-[28px] text-center mt-0.5 mb-3">
        CÀI ĐẶT &amp; KHO TỪ KHÓA
      </h1>

      {/* CARD 1: CÀI ĐẶT CHUNG */}
      <section className="chibi-card p-3.5 sm:p-4 mb-4">
        <h2 className="flex items-center gap-2 font-display font-extrabold text-xl mb-3">
          <Settings className="w-6 h-6 text-[#8C7B75]" />
          <span>CÀI ĐẶT CHUNG</span>
        </h2>

        <div className="grid grid-cols-2 gap-x-3 gap-y-3 items-center">
          {/* Âm thanh */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-display font-extrabold text-sm">
              <Volume2 className="w-5 h-5 text-[#49A089] shrink-0" />
              <span>ÂM THANH</span>
            </div>
            <ChibiSwitch
              checked={settings.soundEnabled}
              ariaLabel="Bật tắt âm thanh"
              onChange={(next) => {
                updateSetting("soundEnabled", next);
                if (next) feedback("tap");
              }}
            />
          </div>

          {/* Hiệu ứng */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-display font-extrabold text-sm">
              <Sparkles className="w-5 h-5 text-[#E5A922] shrink-0" />
              <span>HIỆU ỨNG</span>
            </div>
            <ChibiSwitch
              checked={settings.effectsEnabled}
              ariaLabel="Bật tắt hiệu ứng"
              onChange={(next) => {
                feedback("tap");
                updateSetting("effectsEnabled", next);
              }}
            />
          </div>

          {/* Rung */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-display font-extrabold text-sm">
              <Smartphone className="w-5 h-5 text-[#E57373] shrink-0" />
              <span>RUNG</span>
            </div>
            <ChibiSwitch
              checked={settings.vibrationEnabled}
              ariaLabel="Bật tắt rung"
              onChange={(next) => {
                updateSetting("vibrationEnabled", next);
                feedback("tap");
              }}
            />
          </div>

          {/* Giao diện Sáng / Tối */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-display font-extrabold text-sm">
              <SunMoon className="w-5 h-5 text-[#E5A922] shrink-0" />
              <span>{settings.theme === "dark" ? "TỐI" : "SÁNG"}</span>
            </div>
            <ChibiSwitch
              checked={settings.theme === "dark"}
              ariaLabel="Chuyển giao diện Sáng hoặc Tối"
              onChange={(next) => {
                feedback("tap");
                updateSetting("theme", next ? "dark" : "light");
              }}
            />
          </div>
        </div>

        {/* Ngôn ngữ Tiếng Việt */}
        <div className="mt-3 pt-3 border-t-2 border-dashed border-[#552416]/15 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-extrabold text-sm">
            <Globe className="w-5 h-5 text-[#3FA1C6]" />
            <span>NGÔN NGỮ</span>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-[#ADE7CF] border-2 border-[#552416] font-display font-extrabold text-xs text-[#4A1D12]">
            TIẾNG VIỆT 🇻🇳
          </span>
        </div>
      </section>

      {/* CARD 2: KHO TỪ KHÓA (CHỈ ADMIN) & CỔNG ĐĂNG NHẬP ADMIN */}
      <section className="chibi-card relative p-3.5 sm:p-4 pb-8 mb-6 space-y-3.5">
        {isAdmin ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display font-extrabold text-xl">
                <BookOpen className="w-6 h-6 text-[#C85346]" />
                <span>KHO TỪ KHÓA</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ADE7CF] border-2 border-[#552416] text-xs font-extrabold text-[#166A45]">
                {loadingStats
                  ? "Đang tải..."
                  : `${stats?.active_total ?? 0} cặp đang bật`}
              </span>
            </div>

            {/* 8 Danh mục chỉ hiển thị cho Admin đã xác thực */}
            <div className="grid grid-cols-2 gap-2">
              {WORD_CATEGORIES_META.map((cat) => {
                const count = stats?.by_category[cat.id] ?? 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      feedback("tap");
                      navigate(`/admin?category=${encodeURIComponent(cat.id)}`);
                    }}
                    className="bg-[#FDF0DD] border-[2.5px] border-[#552416] rounded-2xl p-2 flex items-center gap-2 text-left shadow-[0_3px_0_rgba(85,36,22,0.16)] cursor-pointer hover:brightness-95 active:translate-y-0.5"
                  >
                    <img
                      src={cat.icon}
                      alt={cat.label}
                      className="w-11 h-11 rounded-full border-2 border-[#552416] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-display font-extrabold text-xs sm:text-sm text-[#4A1D12] truncate uppercase">
                        {cat.label}
                      </div>
                      <div className="text-xs font-extrabold text-[#6E402E]">
                        {cat.emoji} {count} cặp
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  feedback("tap");
                  navigate("/admin");
                }}
                className="chibi-btn btn-mint w-full text-lg py-3"
              >
                <KeyRound className="w-5 h-5 stroke-[2.6]" />
                <span>QUẢN LÝ CHI TIẾT KHO TỪ KHÓA</span>
              </button>

              <div className="flex justify-center -mb-14">
                <button
                  type="button"
                  onClick={handleLogoutAdmin}
                  className="chibi-btn btn-pink min-w-[230px] text-base py-2.5"
                >
                  <LogOut className="w-5 h-5 stroke-[2.6]" />
                  <span>ĐĂNG XUẤT ADMIN</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Người chơi bình thường: TUYỆT ĐỐI không thấy danh mục hay số lượng từ khóa */}
            <div className="flex items-center justify-center flex-wrap gap-1.5">
              <span className="font-display font-extrabold text-base sm:text-lg">
                🔒 QUẢN TRỊ KHO TỪ KHÓA –
              </span>
              <span className="px-2.5 py-0.5 rounded-xl bg-[#E53935] text-white font-display font-extrabold text-xs tracking-wide shadow-sm">
                ADMIN ONLY
              </span>
            </div>

            <div className="chibi-section-lavender border-2 border-[#552416]/25 p-3 relative overflow-hidden">
              <div className="flex items-center gap-2.5">
                <img
                  src={adminLock}
                  alt="Khóa bảo mật"
                  className="w-14 h-14 object-contain shrink-0 select-none"
                  draggable={false}
                />
                <div className="pr-[86px] space-y-1">
                  <div className="font-display font-extrabold text-sm sm:text-base leading-tight">
                    KHU VỰC DÀNH RIÊNG CHO ADMIN
                  </div>
                  <p className="text-xs font-bold opacity-85 leading-snug">
                    Đăng nhập quyền quản trị để xem danh mục và quản lý kho từ khóa
                    hệ thống.
                  </p>
                </div>
              </div>

              <img
                src={detectiveKey}
                alt="Thám tử giữ chìa khóa"
                className="w-22 h-auto absolute right-0 -bottom-1 select-none pointer-events-none"
                draggable={false}
              />
            </div>

            <div className="flex justify-center -mb-14 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  feedback("tap");
                  navigate("/admin/login");
                }}
                className="chibi-btn btn-yellow min-w-[250px] text-xl py-3"
              >
                <KeyRound className="w-5 h-5 stroke-[2.6]" />
                <span>ĐĂNG NHẬP ADMIN</span>
              </button>
            </div>
          </>
        )}
      </section>
    </SkyBackdrop>
  );
};
