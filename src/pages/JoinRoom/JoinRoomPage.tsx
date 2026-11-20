import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, DoorOpen, Pencil } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { AvatarSelector } from "../../components/common/AvatarSelector";
import { SupabaseConfigBanner } from "../../components/common/SupabaseConfigBanner";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { joinRoom } from "../../services/roomService";
import { normalizeRoomCode } from "../../utils/validation";
import detectiveJoin from "../../assets/characters/detective-join.png";

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { playerPref, savePlayerPref, feedback, showToast } = useAppSettings();

  const initialCode = normalizeRoomCode(searchParams.get("room") ?? "");
  const [codeChars, setCodeChars] = useState<string[]>(() =>
    Array.from({ length: 6 }, (_, i) => initialCode[i] ?? "")
  );
  const [nickname, setNickname] = useState(playerPref.nickname || "");
  const [avatar, setAvatar] = useState(playerPref.avatar || "avatar-blue-glasses");
  const [submitting, setSubmitting] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const paramCode = normalizeRoomCode(searchParams.get("room") ?? "");
    if (paramCode.length === 6) {
      setCodeChars(paramCode.split(""));
    }
  }, [searchParams]);

  const fullCode = codeChars.join("");

  const handleBoxChange = (index: number, raw: string) => {
    setWarningMsg(null);
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean) {
      setCodeChars((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    if (clean.length > 1) {
      // Hỗ trợ dán cả mã 6 ký tự
      const pasted = clean.slice(0, 6);
      setCodeChars((prev) => {
        const next = [...prev];
        for (let i = 0; i < pasted.length && index + i < 6; i++) {
          next[index + i] = pasted[i];
        }
        return next;
      });
      const focusIdx = Math.min(5, index + pasted.length);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    setCodeChars((prev) => {
      const next = [...prev];
      next[index] = clean[0];
      return next;
    });
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeChars[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg(null);

    if (fullCode.length !== 6) {
      feedback("alert");
      setWarningMsg("Mã phòng không hợp lệ! Vui lòng nhập đủ 6 ký tự.");
      return;
    }

    const trimmedName = nickname.trim();
    if (!trimmedName) {
      feedback("alert");
      setWarningMsg("Vui lòng nhập tên của bạn trước khi vào phòng!");
      return;
    }

    setSubmitting(true);
    try {
      savePlayerPref(trimmedName, avatar);
      const res = await joinRoom({
        room_code: fullCode,
        nickname: trimmedName,
        avatar,
      });
      feedback("success");
      showToast(
        res.reconnected
          ? `Đã kết nối lại phòng ${res.room_code}!`
          : `Đã tham gia phòng ${res.room_code}!`,
        "success"
      );
      navigate(`/room/${res.room_id}/lobby`, { replace: true });
    } catch (err) {
      feedback("alert");
      setWarningMsg(
        err instanceof Error
          ? err.message
          : "Không thể tham gia phòng lúc này."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SkyBackdrop>
      <BrandHeader showBack onBack={() => navigate("/")} />

      <SupabaseConfigBanner />

      {/* Tiêu đề & Thám tử cầm biển VÔ CHƠI ĐI! */}
      <div className="relative flex items-end justify-between mt-1 mb-1">
        <div className="flex items-center gap-1 pb-2">
          <span className="text-yellow-300 text-2xl drop-shadow-[0_2px_0_#552416]">
            ★
          </span>
          <h1 className="chibi-title-3d text-[28px] sm:text-[31px] leading-none">
            THAM GIA PHÒNG
          </h1>
        </div>
        <img
          src={detectiveJoin}
          alt="Thám tử mời vô chơi"
          className="w-28 h-auto -mb-4 -mr-1 z-20 select-none shrink-0"
          draggable={false}
        />
      </div>

      {/* Card chính */}
      <form
        onSubmit={handleJoin}
        className="chibi-card relative px-3.5 pt-4 pb-8 mb-6 space-y-4"
      >
        {/* Khu xanh dương: Mã phòng 6 ký tự + Tên của bạn */}
        <div className="chibi-section-blue p-3.5 space-y-3.5">
          <div>
            <label className="block font-display font-extrabold text-base mb-2">
              MÃ PHÒNG (6 KÝ TỰ):
            </label>
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {codeChars.map((ch, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  aria-label={`Ký tự mã phòng thứ ${idx + 1}`}
                  value={ch}
                  onChange={(e) => handleBoxChange(idx, e.target.value)}
                  onKeyDown={(e) => handleBoxKeyDown(idx, e)}
                  placeholder="•"
                  className="h-12 sm:h-14 w-full text-center font-display font-extrabold text-2xl uppercase bg-white text-[#552416] border-[3px] border-[#552416] rounded-2xl shadow-[0_3px_0_rgba(85,36,22,0.2)] outline-none focus:ring-4 focus:ring-[#FFDE84]"
                />
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="player-nickname"
              className="block font-display font-extrabold text-base mb-1.5"
            >
              TÊN CỦA BẠN:
            </label>
            <div className="relative">
              <input
                id="player-nickname"
                type="text"
                maxLength={24}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setWarningMsg(null);
                }}
                placeholder="Nhập tên của bạn (VD: MINH)"
                className="chibi-input !pr-10 uppercase placeholder:normal-case placeholder:text-sm"
              />
              <Pencil className="w-5 h-5 text-[#E58D2D] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Chọn Avatar */}
        <div>
          <h2 className="font-display font-extrabold text-base mb-1.5">
            CHỌN AVATAR CỦA BẠN 🎨
          </h2>
          <AvatarSelector selectedId={avatar} onSelect={setAvatar} />
        </div>

        {/* Thông báo cảnh báo */}
        {warningMsg ? (
          <div role="alert" className="space-y-1">
            <div className="font-display font-extrabold text-sm">
              THÔNG BÁO CẢNH BÁO
            </div>
            <div className="chibi-section-warning border-2 border-[#D95B55] px-3 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold text-[#9E1C19]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#D93832]" />
              <span>{warningMsg}</span>
            </div>
          </div>
        ) : null}

        {/* Nút THAM GIA PHÒNG */}
        <button
          type="submit"
          disabled={submitting}
          className="chibi-btn btn-yellow w-full text-[22px] py-3.5"
        >
          <DoorOpen className="w-6 h-6 stroke-[2.8]" />
          <span>{submitting ? "ĐANG VÀO PHÒNG..." : "THAM GIA PHÒNG"}</span>
        </button>

        {/* Nút QUAY LẠI nổi cạnh dưới card */}
        <div className="flex justify-center -mb-14 pt-0.5">
          <button
            type="button"
            onClick={() => {
              feedback("tap");
              navigate("/");
            }}
            className="chibi-btn btn-pink min-w-[200px] text-xl py-2.5"
          >
            QUAY LẠI
          </button>
        </div>
      </form>
    </SkyBackdrop>
  );
};
