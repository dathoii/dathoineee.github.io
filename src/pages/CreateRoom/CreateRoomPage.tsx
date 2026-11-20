import React, { useMemo, useState } from "react";
import { CheckSquare, Flame, Home, Pencil, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { StepperControl } from "../../components/common/StepperControl";
import { AvatarSelector } from "../../components/common/AvatarSelector";
import { SupabaseConfigBanner } from "../../components/common/SupabaseConfigBanner";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { createRoom } from "../../services/roomService";
import { CATEGORY_FILTERS, DIFFICULTY_META } from "../../utils/avatars";
import { validateRoleDistribution } from "../../utils/validation";
import type { CategoryFilter, Difficulty } from "../../types/game";
import detectivePeek from "../../assets/characters/detective-peek.png";
import partyPopper from "../../assets/icons/party-popper.png";
import roleUndercover from "../../assets/icons/role-undercover.png";
import roleMrWhite from "../../assets/icons/role-mrwhite.png";
import roleCivilian from "../../assets/icons/role-civilian.png";

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { playerPref, savePlayerPref, feedback, showToast } = useAppSettings();

  const [roomName, setRoomName] = useState("Hội bạn thân");
  const [hostNickname, setHostNickname] = useState(playerPref.nickname || "");
  const [hostAvatar, setHostAvatar] = useState(
    playerPref.avatar || "avatar-blue-shades"
  );
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [mrWhiteCount, setMrWhiteCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Tất cả");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleCheck = useMemo(
    () => validateRoleDistribution(maxPlayers, undercoverCount, mrWhiteCount),
    [maxPlayers, undercoverCount, mrWhiteCount]
  );

  const handleMaxPlayersChange = (nextMax: number) => {
    setMaxPlayers(nextMax);
    // Tự động điều chỉnh nếu tổng Gián điệp + Mr. White vượt giới hạn hợp lệ
    let uc = undercoverCount;
    let mw = mrWhiteCount;
    while (nextMax - uc - mw < 1) {
      if (mw > 0) mw--;
      else if (uc > 1) uc--;
      else break;
    }
    if (uc !== undercoverCount) setUndercoverCount(uc);
    if (mw !== mrWhiteCount) setMrWhiteCount(mw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedRoom = roomName.trim();
    const trimmedHost = hostNickname.trim();

    if (!trimmedRoom) {
      feedback("alert");
      setErrorMsg("Vui lòng nhập tên phòng!");
      return;
    }
    if (!trimmedHost) {
      feedback("alert");
      setErrorMsg("Vui lòng nhập biệt danh của bạn (chủ phòng)!");
      return;
    }
    if (!roleCheck.valid) {
      feedback("alert");
      setErrorMsg(roleCheck.error);
      return;
    }

    setSubmitting(true);
    try {
      savePlayerPref(trimmedHost, hostAvatar);
      const res = await createRoom({
        room_name: trimmedRoom,
        nickname: trimmedHost,
        avatar: hostAvatar,
        max_players: maxPlayers,
        undercover_count: undercoverCount,
        mr_white_count: mrWhiteCount,
        category_filter: categoryFilter,
        difficulty,
      });
      feedback("success");
      showToast(`Đã tạo phòng ${res.room_code}!`, "success");
      navigate(`/room/${res.room_id}/lobby`, { replace: true });
    } catch (err) {
      feedback("alert");
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể tạo phòng lúc này."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SkyBackdrop>
      <BrandHeader showBack onBack={() => navigate("/")} />

      <SupabaseConfigBanner />

      {/* Tiêu đề & Thám tử Chibi */}
      <div className="relative flex items-center justify-center mt-1 mb-2 px-1">
        <img
          src={partyPopper}
          alt=""
          aria-hidden="true"
          className="w-12 h-12 object-contain -ml-1 mr-1 select-none"
          draggable={false}
        />
        <h1 className="chibi-title-3d text-[28px] sm:text-[31px] text-center">
          TẠO PHÒNG MỚI
        </h1>
        <img
          src={detectivePeek}
          alt="Thám tử Chibi"
          className="w-20 h-20 object-contain -mb-5 ml-1 z-20 select-none"
          draggable={false}
        />
      </div>

      {/* Card chính */}
      <form
        onSubmit={handleSubmit}
        className="chibi-card relative px-3.5 pt-4 pb-8 mb-6 space-y-3.5"
      >
        {/* 1. THÔNG TIN PHÒNG */}
        <div>
          <h2 className="font-display font-extrabold text-lg mb-1.5">
            THÔNG TIN PHÒNG
          </h2>
          <div className="chibi-section-peach p-3 space-y-3">
            <div className="grid grid-cols-12 gap-2.5 items-center">
              <div className="col-span-6">
                <label
                  htmlFor="room-name"
                  className="flex items-center gap-1 font-display font-extrabold text-xs mb-1"
                >
                  <span>TÊN PHÒNG</span>
                  <Home className="w-3.5 h-3.5 text-[#C85346]" />
                </label>
                <div className="relative">
                  <input
                    id="room-name"
                    type="text"
                    maxLength={40}
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Hội bạn thân"
                    className="chibi-input !bg-[#FFDE84] !rounded-xl !py-2 !pr-8 !pl-3 !text-sm !text-[#4A1D12]"
                  />
                  <Pencil className="w-3.5 h-3.5 text-[#552416] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="col-span-6 flex flex-col items-center">
                <span className="flex items-center gap-1 font-display font-extrabold text-xs mb-1">
                  <span>SỐ NGƯỜI CHƠI</span>
                  <Users className="w-3.5 h-3.5 text-[#428BC1]" />
                </span>
                <StepperControl
                  value={maxPlayers}
                  min={3}
                  max={20}
                  onChange={handleMaxPlayersChange}
                  unitLabel="người"
                  ariaLabel="số người chơi"
                />
              </div>
            </div>

            {/* Danh tính chủ phòng */}
            <div className="pt-2 border-t-2 border-dashed border-[#552416]/20 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label
                  htmlFor="host-nickname"
                  className="font-display font-extrabold text-xs shrink-0"
                >
                  👑 TÊN CHỦ PHÒNG:
                </label>
                <input
                  id="host-nickname"
                  type="text"
                  maxLength={24}
                  value={hostNickname}
                  onChange={(e) => setHostNickname(e.target.value)}
                  placeholder="Nhập biệt danh của bạn..."
                  className="chibi-input !py-1.5 !px-3 !text-sm !rounded-xl"
                />
              </div>
              <AvatarSelector
                selectedId={hostAvatar}
                onSelect={setHostAvatar}
                compact
              />
            </div>
          </div>
        </div>

        {/* 2. THIẾT LẬP VAI TRÒ */}
        <div>
          <h2 className="font-display font-extrabold text-lg mb-1.5">
            THIẾT LẬP VAI TRÒ 🎲
          </h2>
          <div className="chibi-section-peach p-3 space-y-2.5">
            {/* Undercover */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={roleUndercover}
                  alt="Gián điệp"
                  className="w-11 h-11 rounded-full border-2 border-[#552416] shrink-0"
                />
                <div className="font-display font-extrabold text-sm leading-tight">
                  <div>GIÁN ĐIỆP</div>
                  <div className="text-xs opacity-85">(UNDERCOVER) 🕵️</div>
                </div>
              </div>
              <StepperControl
                value={undercoverCount}
                min={0}
                max={Math.max(0, maxPlayers - mrWhiteCount - 1)}
                onChange={setUndercoverCount}
                ariaLabel="số Gián điệp"
              />
            </div>

            {/* Mr. White */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={roleMrWhite}
                  alt="Mr. White"
                  className="w-11 h-11 rounded-full border-2 border-[#552416] shrink-0"
                />
                <div className="font-display font-extrabold text-sm leading-tight">
                  MR. WHITE 👻
                </div>
              </div>
              <StepperControl
                value={mrWhiteCount}
                min={0}
                max={Math.max(0, maxPlayers - undercoverCount - 1)}
                onChange={setMrWhiteCount}
                ariaLabel="số Mr. White"
              />
            </div>

            {/* Civilian tự động tính */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t-2 border-dashed border-[#552416]/15">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={roleCivilian}
                  alt="Dân thường"
                  className="w-11 h-11 rounded-full border-2 border-[#552416] shrink-0"
                />
                <div className="font-display font-extrabold text-sm leading-tight">
                  <div>DÂN THƯỜNG</div>
                  <div className="text-xs opacity-85">(CIVILIAN) 🧒</div>
                </div>
              </div>
              <div className="flex flex-col items-center min-w-[116px]">
                <span className="font-display font-extrabold text-2xl text-[#1EA454] leading-none">
                  {roleCheck.civilianCount}
                </span>
                <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#C6EAD7] border border-[#552416]/40 text-[11px] font-extrabold text-[#166A45]">
                  Tự động tính
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DANH MỤC TỪ KHÓA (chỉ gửi lựa chọn lên backend, không lộ kho từ) */}
        <div>
          <h2 className="font-display font-extrabold text-lg mb-1.5">
            💬 DANH MỤC TỪ KHÓA
          </h2>
          <div className="chibi-section-peach p-2.5 flex flex-wrap gap-1.5 justify-center">
            {CATEGORY_FILTERS.map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    feedback("tap");
                    setCategoryFilter(cat.id);
                  }}
                  style={{ backgroundColor: cat.chipBg }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-[2.5px] font-display font-extrabold text-xs text-[#4A1D12] cursor-pointer transition-transform ${
                    active
                      ? "border-[#552416] ring-2 ring-[#552416] scale-[1.03] shadow-[0_3px_0_#552416]"
                      : "border-[#552416]/65 opacity-85 hover:opacity-100"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span>{cat.emoji}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. ĐỘ KHÓ */}
        <div>
          <h2 className="font-display font-extrabold text-lg mb-1.5 flex items-center gap-1">
            <Flame className="w-5 h-5 text-[#E85D2A] fill-[#FF9A3C]" />
            <span>ĐỘ KHÓ</span>
            <Flame className="w-5 h-5 text-[#E85D2A] fill-[#FF9A3C]" />
          </h2>
          <div className="chibi-section-peach p-2.5 grid grid-cols-3 gap-2">
            {DIFFICULTY_META.map((d) => {
              const active = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    feedback("tap");
                    setDifficulty(d.id);
                  }}
                  style={{
                    backgroundColor: d.bg,
                    boxShadow: active ? `0 4px 0 ${d.bevel}` : "none",
                  }}
                  className={`py-2 px-1 rounded-2xl border-[2.5px] font-display font-extrabold text-xs sm:text-sm text-[#4A1D12] cursor-pointer transition-all ${
                    active
                      ? "border-[#552416] ring-2 ring-[#552416] -translate-y-0.5"
                      : "border-[#552416]/55 opacity-80 hover:opacity-100"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tổng vai trò */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 font-extrabold text-sm">
            <span>
              Tổng vai trò:{" "}
              {roleCheck.civilianCount + undercoverCount + mrWhiteCount} /{" "}
              {maxPlayers} người chơi
            </span>
            <CheckSquare
              className={`w-4 h-4 ${
                roleCheck.valid ? "text-[#1EA454]" : "text-[#D93832]"
              }`}
            />
          </div>

          {roleCheck.warning ? (
            <div className="text-xs font-bold text-[#9E6012]">
              ⚠️ {roleCheck.warning}
            </div>
          ) : null}

          {errorMsg || roleCheck.error ? (
            <div className="chibi-section-warning border-2 border-[#B52B27] px-3 py-2 text-xs font-bold text-[#9E1C19]">
              ⚠️ {errorMsg || roleCheck.error}
            </div>
          ) : null}
        </div>

        {/* Nút TẠO PHÒNG nổi ở cạnh dưới card */}
        <div className="pt-1 -mb-14">
          <button
            type="submit"
            disabled={submitting || !roleCheck.valid}
            className="chibi-btn btn-mint w-full text-[24px] py-3.5"
          >
            {submitting ? "ĐANG TẠO PHÒNG..." : "TẠO PHÒNG"}
          </button>
        </div>
      </form>
    </SkyBackdrop>
  );
};
