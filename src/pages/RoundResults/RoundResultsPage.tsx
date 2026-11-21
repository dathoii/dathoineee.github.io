import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, RefreshCw, Search, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { LayeredAvatar } from "../../components/avatar/LayeredAvatar";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useRoomRealtime } from "../../hooks/useRoomRealtime";
import { getRoundResults } from "../../services/gameService";
import { leaveRoom } from "../../services/roomService";
import type { PlayerRole, RoundResultsResponse } from "../../types/game";
import { formatDifficultyLabel, resolvePlayerAvatarConfig } from "../../utils/avatars";
import roleCivilian from "../../assets/icons/role-civilian.png";
import roleMrWhite from "../../assets/icons/role-mrwhite.png";
import roleUndercover from "../../assets/icons/role-undercover.png";
import partyPopper from "../../assets/icons/party-popper.png";

const ROLE_BADGE_META: Record<
  PlayerRole,
  {
    label: string;
    icon: string;
    cardBg: string;
    pillBg: string;
    textColor: string;
  }
> = {
  undercover: {
    label: "GIÁN ĐIỆP",
    icon: roleUndercover,
    cardBg: "bg-[#FDE2E1]",
    pillBg: "bg-[#F8ADAD]",
    textColor: "text-[#8E1E1B]",
  },
  mr_white: {
    label: "MR. WHITE",
    icon: roleMrWhite,
    cardBg: "bg-[#F3EAFF]",
    pillBg: "bg-[#DEC7FA]",
    textColor: "text-[#4D2682]",
  },
  civilian: {
    label: "DÂN THƯỜNG",
    icon: roleCivilian,
    cardBg: "bg-[#E2F7EE]",
    pillBg: "bg-[#ADE7CF]",
    textColor: "text-[#166A45]",
  },
};

export const RoundResultsPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { feedback } = useAppSettings();
  const { snapshot, currentUserId } = useRoomRealtime(roomId);

  const [data, setData] = useState<RoundResultsResponse | null>(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const hasDataRef = useRef(false);

  const room = snapshot?.room;
  const roomStatus = room?.status;
  const players = snapshot?.players ?? [];

  useEffect(() => {
    if (!room || !roomId) return;
    if (room.status === "revealing") {
      navigate(`/room/${roomId}/secret`, { replace: true });
    } else if (room.status === "discussing") {
      navigate(`/room/${roomId}/play`, { replace: true });
    } else if (room.status === "waiting") {
      navigate(`/room/${roomId}/lobby`, { replace: true });
    } else if (room.status === "closed") {
      navigate("/", { replace: true });
    }
  }, [room, roomId, navigate]);

  const loadResults = useCallback(async () => {
    if (!roomId || (roomStatus && roomStatus !== "round_ended")) return;
    if (!hasDataRef.current) {
      setLoadingResults(true);
    }
    setResultsError(null);
    try {
      const res = await getRoundResults(roomId);
      hasDataRef.current = true;
      setData(res);
    } catch (err) {
      setResultsError(
        err instanceof Error ? err.message : "Không thể tải kết quả ván đấu."
      );
    } finally {
      setLoadingResults(false);
    }
  }, [roomId, roomStatus]);

  useEffect(() => {
    if (!roomId) return;
    if (!roomStatus || roomStatus === "round_ended") {
      loadResults();
    }
  }, [roomId, roomStatus, loadResults]);

  const spies = useMemo(
    () =>
      (data?.results ?? []).filter(
        (r) => r.role === "undercover" || r.role === "mr_white"
      ),
    [data]
  );

  const handleContinueToNext = () => {
    if (!roomId) return;
    feedback("tap");
    navigate(`/room/${roomId}/next`, { replace: true });
  };

  const handleLeave = async () => {
    if (!roomId) return;
    setLeaveOpen(false);
    await leaveRoom(roomId);
    navigate("/", { replace: true });
  };

  const roundNumLabel = String(
    data?.round_number ?? room?.current_round ?? 1
  ).padStart(2, "0");

  return (
    <SkyBackdrop>
      <BrandHeader
        showBack
        onBack={() => setLeaveOpen(true)}
        centerVariant="mini-logo"
        rightExtra={
          <div className="bg-white border-[2.5px] border-[#552416] rounded-2xl px-2.5 py-1 text-center shadow-sm leading-tight">
            <div className="font-display font-extrabold text-[10px] text-[#C85346]">
              KẾT QUẢ
            </div>
            <div className="font-display font-extrabold text-sm text-[#552416]">
              VÁN #{roundNumLabel}
            </div>
          </div>
        }
      />

      <div className="flex items-center justify-center gap-2 mt-0.5 mb-2">
        <img src={partyPopper} alt="" className="w-7 h-7 select-none" draggable={false} />
        <h1 className="chibi-title-3d text-[26px] sm:text-[30px] text-center leading-none">
          KẾT QUẢ VÁN ĐẤU
        </h1>
        <img src={partyPopper} alt="" className="w-7 h-7 select-none" draggable={false} />
      </div>

      <div className="chibi-card relative px-3.5 pt-4 pb-6 mb-6 space-y-3.5">
        {loadingResults ? (
          <div className="py-10 text-center font-display font-extrabold text-base text-[#4A1D12]">
            🔍 ĐANG MỞ HỒ SƠ GIÁN ĐIỆP...
          </div>
        ) : resultsError ? (
          <div className="chibi-section-warning border-2 border-[#B52B27] p-4 text-center space-y-2.5">
            <div className="text-sm font-extrabold text-[#9E1C19]">
              ⚠️ {resultsError}
            </div>
            <button
              type="button"
              onClick={loadResults}
              className="chibi-btn btn-yellow !min-h-[40px] px-4 py-1.5 text-sm mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>THỬ TẢI LẠI</span>
            </button>
          </div>
        ) : data ? (
          <>
            {/* 1. CẶP TỪ KHÓA CỦA VÁN ĐẤU */}
            {data.word_pair ? (
              <div className="chibi-section-yellow border-2 border-[#552416]/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-display font-extrabold text-sm text-[#4A1D12]">
                    <Search className="w-4 h-4 text-[#C85346]" />
                    <span>TỪ KHÓA VÁN #{roundNumLabel}</span>
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#552416]">
                      {data.word_pair.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FFE082] border border-[#552416]">
                      {formatDifficultyLabel(data.word_pair.difficulty)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#ADE7CF] border-2 border-[#552416] p-2.5 text-center">
                    <div className="text-[11px] font-display font-extrabold text-[#166A45]">
                      🧑 TỪ DÂN THƯỜNG
                    </div>
                    <div className="font-display font-extrabold text-base sm:text-lg text-[#4A1D12] mt-0.5 break-words">
                      {data.word_pair.civilian_word}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F8ADAD] border-2 border-[#552416] p-2.5 text-center">
                    <div className="text-[11px] font-display font-extrabold text-[#8E1E1B]">
                      🕵️ TỪ GIÁN ĐIỆP
                    </div>
                    <div className="font-display font-extrabold text-base sm:text-lg text-[#4A1D12] mt-0.5 break-words">
                      {data.word_pair.undercover_word}
                    </div>
                  </div>
                </div>

                {data.word_pair.note ? (
                  <div className="text-[11px] font-bold text-[#6E402E] text-center">
                    💡 {data.word_pair.note}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* 2. VẠCH MẶT AI LÀ GIÁN ĐIỆP & MR. WHITE */}
            <div className="rounded-2xl bg-gradient-to-b from-[#FFE5E4] to-[#FFD2CF] border-[2.5px] border-[#552416] p-3 space-y-2 shadow-[0_3px_0_rgba(85,36,22,0.18)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-extrabold text-base text-[#8E1E1B]">
                  🕵️ AI LÀ GIÁN ĐIỆP?
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white border-2 border-[#552416] text-[11px] font-extrabold text-[#8E1E1B]">
                  {spies.length} nhân vật ẩn
                </span>
              </div>

              {spies.length === 0 ? (
                <div className="text-xs font-bold text-center text-[#552416]/80 py-2">
                  Ván này không có Gián điệp hay Mr. White.
                </div>
              ) : (
                <div className="space-y-2 overflow-visible">
                  {spies.map((spy) => {
                    const meta = ROLE_BADGE_META[spy.role];
                    const isMe = spy.user_id === currentUserId;
                    const syncedPlayer =
                      players.find((p) => p.id === spy.player_id) ?? spy;
                    return (
                      <div
                        key={spy.player_id}
                        className="bg-white/95 border-2 border-[#552416] rounded-2xl p-2.5 flex items-center gap-3 overflow-visible"
                      >
                        <div className="shrink-0 overflow-visible pl-1">
                          <LayeredAvatar
                            config={resolvePlayerAvatarConfig(syncedPlayer)}
                            size={48}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-display font-extrabold text-base text-[#4A1D12] uppercase truncate">
                              {spy.nickname}
                            </span>
                            {isMe ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#FFDE84] border border-[#552416] text-[10px] font-extrabold">
                                BẠN
                              </span>
                            ) : null}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#552416] text-[10px] font-extrabold ${meta.pillBg} ${meta.textColor}`}
                            >
                              <img src={meta.icon} alt="" className="w-3.5 h-3.5" />
                              {meta.label}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-[#552416] mt-0.5">
                            Từ nhận được:{" "}
                            <span className="text-[#B52B27] uppercase">
                              {spy.role === "mr_white"
                                ? "KHÔNG CÓ TỪ KHÓA (TRẮNG TỪ)"
                                : spy.secret_word}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. BẢNG PHÂN VAI & TỪ KHÓA CỦA TẤT CẢ NGƯỜI CHƠI */}
            <div className="space-y-2 overflow-visible">
              <div className="flex items-center gap-1.5 font-display font-extrabold text-base text-[#4A1D12]">
                <Users className="w-5 h-5 text-[#428BC1]" />
                <span>CHI TIẾT TỪ KHÓA TỪNG NGƯỜI CHƠI ({data.results.length})</span>
              </div>

              <div className="space-y-2 overflow-visible">
                {data.results.map((item) => {
                  const meta = ROLE_BADGE_META[item.role];
                  const isMe = item.user_id === currentUserId;
                  const syncedPlayer =
                    players.find((p) => p.id === item.player_id) ?? item;

                  return (
                    <div
                      key={item.player_id}
                      className={`${meta.cardBg} border-[2.5px] border-[#552416] rounded-2xl px-2.5 py-2 flex items-center gap-3 overflow-visible shadow-[0_3px_0_rgba(85,36,22,0.16)] ${
                        isMe ? "ring-2 ring-[#552416]" : ""
                      }`}
                    >
                      <div className="shrink-0 overflow-visible pl-0.5">
                        <LayeredAvatar
                          config={resolvePlayerAvatarConfig(syncedPlayer)}
                          size={44}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-display font-extrabold text-sm text-[#4A1D12] uppercase truncate">
                            {item.nickname}
                          </span>
                          {isMe ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#FFDE84] border border-[#552416] text-[10px] font-extrabold">
                              BẠN
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#552416]/70 bg-white/80 text-[10px] font-extrabold">
                          <img src={meta.icon} alt="" className="w-3.5 h-3.5" />
                          <span className={meta.textColor}>{meta.label}</span>
                        </div>
                      </div>

                      <div className="shrink-0 max-w-[130px] text-right">
                        <div className="text-[10px] font-extrabold text-[#6E402E]">
                          Từ khóa:
                        </div>
                        <div className="inline-block px-2.5 py-1 rounded-xl bg-white border-2 border-[#552416] font-display font-extrabold text-xs text-[#4A1D12] break-words">
                          {item.role === "mr_white"
                            ? "TRẮNG TỪ"
                            : item.secret_word}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {/* NÚT TIẾP TỤC QUAY LẠI MÀN HÌNH CHỜ VÒNG TIẾP THEO */}
        <button
          type="button"
          onClick={handleContinueToNext}
          className="chibi-btn btn-mint w-full text-lg sm:text-xl py-3"
        >
          <span>TIẾP TỤC CHỜ VÁN TIẾP THEO</span>
          <ArrowRight className="w-5 h-5 stroke-[2.8]" />
        </button>

        <div className="text-center text-[11px] font-bold opacity-80">
          Chủ phòng hoặc bạn có thể xem kết quả xong rồi bấm tiếp tục để chuẩn bị ván mới!
        </div>
      </div>

      <ConfirmDialog
        open={leaveOpen}
        title="RỜI PHÒNG CHƠI?"
        message="Bạn có chắc muốn rời khỏi phòng này không?"
        confirmLabel="RỜI PHÒNG"
        onConfirm={handleLeave}
        onCancel={() => setLeaveOpen(false)}
      />
    </SkyBackdrop>
  );
};
