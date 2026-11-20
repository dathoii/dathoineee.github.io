import React from "react";

interface SkyBackdropProps {
  variant?: "sky" | "secret";
  children: React.ReactNode;
}

export const SkyBackdrop: React.FC<SkyBackdropProps> = ({
  variant = "sky",
  children,
}) => {
  return (
    <div
      className={`${
        variant === "secret" ? "chibi-secret-bg" : "chibi-sky-bg"
      } flex flex-col items-center`}
    >
      {/* Trang trí bầu trời: bóng bay pastel, sao, mây (pointer-events-none) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0"
      >
        {/* Dải ruy băng góc trên phải */}
        <svg
          className="absolute -top-4 -right-6 w-48 h-28 opacity-80"
          viewBox="0 0 200 110"
          fill="none"
        >
          <path
            d="M15 -10 C 70 40, 140 60, 210 50"
            stroke="#FFAAB8"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M40 -10 C 95 30, 155 42, 210 34"
            stroke="#FFDF7E"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </svg>

        {variant === "sky" ? (
          <>
            {/* Bóng bay trái */}
            <svg
              className="hidden sm:block absolute top-24 left-2 w-24 h-36 opacity-65 animate-chibi-float"
              viewBox="0 0 100 150"
              fill="none"
            >
              <ellipse cx="42" cy="52" rx="32" ry="40" fill="#FDE0AF" stroke="#B69473" strokeWidth="2" />
              <path d="M42 92 Q36 118 46 144" stroke="#B69473" strokeWidth="2" />
              <ellipse cx="76" cy="76" rx="22" ry="28" fill="#C7F0EA" stroke="#85B3AF" strokeWidth="2" />
              <path d="M76 104 Q72 126 78 145" stroke="#85B3AF" strokeWidth="2" />
            </svg>

            {/* Bóng bay phải */}
            <svg
              className="hidden sm:block absolute top-28 right-2 w-24 h-36 opacity-65 animate-chibi-float"
              viewBox="0 0 100 150"
              fill="none"
            >
              <ellipse cx="58" cy="52" rx="32" ry="40" fill="#FDE0AF" stroke="#B69473" strokeWidth="2" />
              <path d="M58 92 Q64 118 54 144" stroke="#B69473" strokeWidth="2" />
              <ellipse cx="26" cy="84" rx="22" ry="28" fill="#F9BFC5" stroke="#B57E85" strokeWidth="2" />
              <path d="M26 112 Q30 130 24 146" stroke="#B57E85" strokeWidth="2" />
            </svg>
          </>
        ) : null}

        {/* Các ngôi sao lấp lánh */}
        <span className="absolute top-20 left-5 text-yellow-300 text-2xl drop-shadow-[0_2px_0_#552416]">
          ★
        </span>
        <span className="absolute top-28 right-6 text-yellow-300 text-xl drop-shadow-[0_2px_0_#552416]">
          ★
        </span>
        <span className="absolute bottom-14 left-3 text-yellow-300 text-3xl drop-shadow-[0_2px_0_#552416]">
          ★
        </span>
        <span className="absolute bottom-24 right-4 text-yellow-300 text-2xl drop-shadow-[0_2px_0_#552416]">
          ★
        </span>

        {/* Mây trắng chân trang */}
        <svg
          className="absolute bottom-0 left-0 w-full h-24 opacity-75"
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 160 L0 110 Q140 60 280 105 Q430 40 610 98 Q800 50 980 102 Q1180 42 1360 95 L1440 108 L1440 160 Z"
            fill="rgba(255,255,255,0.65)"
          />
        </svg>
      </div>

      {/* Khung ứng dụng mobile-first chính */}
      <main className="relative z-10 w-full max-w-[460px] min-h-dvh flex flex-col px-3.5 pt-3 pb-7 animate-page-enter">
        {children}
      </main>
    </div>
  );
};
