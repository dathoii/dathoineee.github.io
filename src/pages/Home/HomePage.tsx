import React, { useState } from "react";
import { BookOpen, Home, Info, Key, Search, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { RulesModal } from "../../components/common/RulesModal";
import { AboutModal } from "../../components/common/AboutModal";
import { SupabaseConfigBanner } from "../../components/common/SupabaseConfigBanner";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import homeChibiGroup from "../../assets/images/home-chibi-group.png";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { feedback } = useAppSettings();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <SkyBackdrop>
      <BrandHeader showSettings />

      <SupabaseConfigBanner />

      {/* Logo chính: AI LÀ GIÁN ĐIỆP */}
      <section className="flex flex-col items-center text-center mt-1 mb-3">
        <div className="relative inline-flex flex-col items-center">
          <div className="flex items-center gap-1">
            <span className="text-yellow-300 text-2xl drop-shadow-[0_2px_0_#551a09] -rotate-12">
              ★
            </span>
            <h1 className="chibi-hero-title text-[46px] sm:text-[52px] tracking-tight">
              AI LÀ
            </h1>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#BBEAF2] border-[3px] border-[#551A09] shadow-[0_3px_0_#551A09] -rotate-12">
              <Search className="w-5 h-5 text-[#551A09] stroke-[3]" />
            </span>
          </div>
          <div className="chibi-hero-title text-[46px] sm:text-[52px] -mt-1.5">
            GIÁN ĐIỆP
          </div>
        </div>

        <div className="mt-1 px-4 py-0.5 rounded-full bg-white/85 border-2 border-[#552416] shadow-sm font-display font-extrabold text-sm text-[#552416]">
          Trò Chơi Suy Luận Nhóm
        </div>
      </section>

      {/* Khung nhóm nhân vật Chibi */}
      <section className="relative mx-auto w-full mb-3.5">
        <div className="relative rounded-[28px] bg-[#FED8C5] border-[3.5px] border-[#552416] shadow-[0_7px_0_rgba(85,36,22,0.22)] pt-3 px-2 pb-0 overflow-hidden">
          <span
            aria-hidden="true"
            className="absolute top-2 left-4 text-yellow-300 text-xl drop-shadow-[0_2px_0_#552416]"
          >
            ★
          </span>
          <span
            aria-hidden="true"
            className="absolute top-2 right-4 text-yellow-300 text-2xl drop-shadow-[0_2px_0_#552416]"
          >
            ★
          </span>
          <img
            src={homeChibiGroup}
            alt="Nhóm nhân vật Chibi AI LÀ GIÁN ĐIỆP"
            className="w-full h-auto max-h-[245px] object-contain mx-auto block select-none"
            draggable={false}
          />
        </div>
      </section>

      {/* Câu giới thiệu */}
      <div className="text-center mb-3.5 px-1">
        <h2 className="font-display font-extrabold text-[19px] leading-snug">
          Bạn có đủ tinh mắt để tìm ra kẻ nói dối?
        </h2>
        <p className="text-xs sm:text-[13px] font-bold opacity-85 mt-0.5">
          Cùng hội bạn bước vào những màn đấu trí đầy tiếng cười!
        </p>
      </div>

      {/* Hai nút chính nổi bật nhất */}
      <div className="flex flex-col gap-3 mb-4">
        <button
          type="button"
          onClick={() => {
            feedback("tap");
            navigate("/create");
          }}
          className="chibi-btn btn-mint w-full text-[22px] py-3.5"
        >
          <span className="w-9 h-9 rounded-xl bg-[#FFFAF4] border-2 border-[#552416] flex items-center justify-center">
            <Home className="w-5 h-5 text-[#B9463B] stroke-[2.6]" />
          </span>
          <span>TẠO PHÒNG MỚI</span>
        </button>

        <button
          type="button"
          onClick={() => {
            feedback("tap");
            navigate("/join");
          }}
          className="chibi-btn btn-yellow w-full text-[22px] py-3.5"
        >
          <span className="w-9 h-9 rounded-xl bg-[#FFFAF4] border-2 border-[#552416] flex items-center justify-center">
            <Key className="w-5 h-5 text-[#D88B1C] stroke-[2.6]" />
          </span>
          <span>THAM GIA PHÒNG</span>
        </button>
      </div>

      {/* Ba nút tròn phụ */}
      <div className="flex items-center justify-center gap-3.5 mb-4">
        <div
          aria-hidden="true"
          className="hidden xs:block w-8 h-8 rounded-full bg-[#E9E0FF] border-[2.5px] border-[#552416]"
        />
        <button
          type="button"
          onClick={() => {
            feedback("tap");
            setRulesOpen(true);
          }}
          className="w-[78px] h-[78px] rounded-full bg-[#E9E0FF] border-[3px] border-[#552416] shadow-[0_4px_0_#B9A4ED] flex flex-col items-center justify-center text-[#552416] cursor-pointer active:translate-y-0.5"
        >
          <BookOpen className="w-5 h-5 mb-0.5 stroke-[2.5]" />
          <span className="font-display font-extrabold text-[11px] leading-tight text-center">
            HƯỚNG
            <br />
            DẪN
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            feedback("tap");
            navigate("/settings");
          }}
          className="w-[78px] h-[78px] rounded-full bg-[#FEF7E5] border-[3px] border-[#552416] shadow-[0_4px_0_#D4BC88] flex flex-col items-center justify-center text-[#552416] cursor-pointer active:translate-y-0.5"
        >
          <Settings className="w-5 h-5 mb-0.5 stroke-[2.5]" />
          <span className="font-display font-extrabold text-[11px] leading-tight text-center">
            CÀI ĐẶT
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            feedback("tap");
            setAboutOpen(true);
          }}
          className="w-[78px] h-[78px] rounded-full bg-[#E9E0FF] border-[3px] border-[#552416] shadow-[0_4px_0_#B9A4ED] flex flex-col items-center justify-center text-[#552416] cursor-pointer active:translate-y-0.5"
        >
          <Info className="w-5 h-5 mb-0.5 stroke-[2.5]" />
          <span className="font-display font-extrabold text-[11px] leading-tight text-center">
            GIỚI
            <br />
            THIỆU
          </span>
        </button>
        <div
          aria-hidden="true"
          className="hidden xs:block w-8 h-8 rounded-full bg-[#E5D4BD] border-[2.5px] border-[#552416]"
        />
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center text-xs font-extrabold tracking-wide opacity-90 pt-1">
        <div>MADE FOR FRIENDS BY DATHOINEEE</div>
        <div className="font-bold opacity-80">
          Chơi vui hết mình – Đừng để lộ từ khóa!
        </div>
      </footer>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </SkyBackdrop>
  );
};
