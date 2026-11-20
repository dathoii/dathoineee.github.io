import React from "react";
import { ArrowLeft, Info, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "../../contexts/AppSettingsContext";

interface BrandHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  centerVariant?: "brand" | "mini-logo";
  rightExtra?: React.ReactNode;
  showInfoButton?: boolean;
  onInfoClick?: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  showBack = false,
  onBack,
  showSettings = false,
  centerVariant = "brand",
  rightExtra,
  showInfoButton = false,
  onInfoClick,
}) => {
  const navigate = useNavigate();
  const { feedback } = useAppSettings();

  const handleBack = () => {
    feedback("tap");
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="relative flex items-center justify-between min-h-[54px] mb-1.5">
      {/* Cột trái */}
      <div className="w-14 flex items-center justify-start">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Quay lại"
            className="chibi-icon-circle bg-[#FFDE84] hover:brightness-105"
          >
            <ArrowLeft className="w-6 h-6 stroke-[3]" />
          </button>
        ) : null}
      </div>

      {/* Cột giữa: DATHOINEEE trên đám mây trắng */}
      <div className="flex-1 flex justify-center">
        {centerVariant === "brand" ? (
          <div className="relative inline-flex items-center justify-center px-5 py-1.5">
            {/* Đám mây nền */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -mx-3 -my-1 bg-white/95 rounded-full border-2 border-white shadow-sm"
            />
            <span className="relative z-10 px-4 py-1 rounded-full bg-[#EEA6A7] border-2 border-white shadow-inner font-display font-extrabold text-[15px] tracking-wider text-[#56160D]">
              DATHOINEEE
            </span>
          </div>
        ) : (
          <div className="relative inline-flex flex-col items-center px-4 py-1 rounded-full bg-white/95 border-2 border-white shadow-sm">
            <span className="chibi-title-3d text-sm leading-none">AI LÀ</span>
            <span className="chibi-title-3d text-base leading-none">GIÁN ĐIỆP</span>
          </div>
        )}
      </div>

      {/* Cột phải */}
      <div className="min-w-[56px] flex items-center justify-end gap-2">
        {rightExtra}
        {showInfoButton && onInfoClick ? (
          <button
            type="button"
            onClick={() => {
              feedback("tap");
              onInfoClick();
            }}
            aria-label="Luật chơi"
            className="chibi-icon-circle bg-[#ADE7CF] hover:brightness-105"
          >
            <Info className="w-6 h-6 stroke-[2.8]" />
          </button>
        ) : null}
        {showSettings ? (
          <button
            type="button"
            onClick={() => {
              feedback("tap");
              navigate("/settings");
            }}
            aria-label="Cài đặt"
            className="chibi-icon-circle bg-[#FFDE84] hover:brightness-105"
          >
            <Settings className="w-6 h-6 stroke-[2.5]" />
          </button>
        ) : null}
      </div>
    </header>
  );
};
