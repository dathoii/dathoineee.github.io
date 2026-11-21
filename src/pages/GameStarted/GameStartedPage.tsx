import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Clock,
  Flag,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { RulesModal } from "../../components/common/RulesModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useRoomRealtime } from "../../hooks/useRoomRealtime";
import { controlDiscussion, endDiscussion } from "../../services/gameService";
import { claimHost, leaveRoom } from "../../services/roomService";
import { resolvePlayerAvatarConfig } from "../../utils/avatars";
import { LayeredAvatar } from "../../components/avatar/LayeredAvatar";
import { RoomPlayerAvatarModal } from "../../components/avatar/RoomPlayerAvatarModal";
import { formatSeconds } from "../../utils/validation";
import crowdInvestigating from "../../assets/images/crowd-investigating.png";

export const GameStartedPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { feedback, showToast } = useAppSettings();
  const { snapshot, currentUserId, refresh } = useRoomRealtime(roomId);

  const [rulesOpen, setRulesOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [controlling, setControlling] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(300);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const bellPlayedRef = useRef(false);

  const room = snapshot?.room;
  const players = snapshot?.players ?? [];
  const round = snapshot?.currentRound;

  const isHost = Boolean(room && currentUserId && room.host_id === currentUserId);
  const me = useMemo(
    () => players.find((p) => p.user_id === currentUserId) ?? null,
    [players, currentUserId]
  );

  const hostPlayer = useMemo(
    () => players.find((p) => p.user_id === room?.host_id) ?? null,
    [players, room?.host_id]
  );

  const isHostDisconnected = useMemo(() => {
    if (!room || isHost) return false;
    if (!hostPlayer || !hostPlayer.is_connected) return true;
    return Date.now() - new Date(hostPlayer.last_seen_at).getTime() > 26_000;
  }, [room, isHost, hostPlayer]);

  // Đồng bộ chuyển trang theo trạng thái phòng Realtime
  useEffect(() => {
    if (!room || !roomId) return;
    if (room.status === "round_ended") {
      navigate(`/room/${roomId}/results`, { replace: true });
    } else if (room.status === "revealing") {
      navigate(`/room/${roomId}/secret`, { replace: true });
    } else if (room.status === "waiting") {
      navigate(`/room/${roomId}/lobby`, { replace: true });
    } else if (room.status === "closed") {
      navigate("/", { replace: true });
    }
  }, [room, roomId, navigate]);

  // Tính bộ đếm thời gian đồng bộ theo server timestamp
  useEffect(() => {
    if (!round) return;

    const computeRemaining = () => {
      if (!round.timer_running || !round.timer_started_at) {
        return round.timer_remaining_sec;
      }
      const elapsedSec = Math.floor(
        (Date.now() - new Date(round.timer_started_at).getTime()) / 1000
      );
      return Math.max(0, round.timer_remaining_sec - elapsedSec);
    };

    const syncTick = () => {
      const rem = computeRemaining();
      setDisplaySeconds(rem);
      if (rem === 0 && round.timer_running && !bellPlayedRef.current) {
        bellPlayedRef.current = true;
        feedback("bell");
      } else if (rem > 0) {
        bellPlayedRef.current = false;
      }
    };

    syncTick();
    if (!round.timer_running) return;

    const timerId = window.setInterval(syncTick, 500);
    return () => window.clearInterval(timerId);
  }, [round, feedback]);

  const handleTimerAction = async (
    action: "start_timer" | "pause_timer" | "reset_timer" | "set_duration" | "next_turn",
    durationSec?: number
  ) => {
    if (!roomId || !isHost) return;
    setControlling(true);
    try {
      feedback("tap");
      await controlDiscussion(
        roomId,
        action,
        durationSec ? { duration_sec: durationSec } : undefined
      );
      await refresh();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể điều khiển đồng hồ.",
        "error"
      );
    } finally {
      setControlling(false);
    }
  };

  const handleEndDiscussion = async () => {
    if (!roomId || !isHost) return;
    setEnding(true);
    try {
      await endDiscussion(roomId);
      feedback("success");
      await refresh();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể kết thúc lượt.",
        "error"
      );
    } finally {
      setEnding(false);
    }
  };

  const handleClaimHost = async () => {
    if (!roomId) return;
    try {
      await claimHost(roomId);
      feedback("success");
      showToast("Bạn đã nhận quyền chủ phòng!", "success");
      await refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Chủ phòng vẫn đang kết nối.",
        "error"
      );
    }
  };

  const handleLeave = async () => {
    if (!roomId) return;
    await leaveRoom(roomId);
    navigate("/", { replace: true });
  };

  const roundLabel = String(
    round?.round_number ?? room?.current_round ?? 1
  ).padStart(2, "0");

  return (
    <SkyBackdrop>
      <BrandHeader
        showBack
        onBack={() => setLeaveOpen(true)}
        showInfoButton
        onInfoClick={() => setRulesOpen(true)}
        rightExtra={
          <div className="px-2.5 py-1 rounded-xl bg-[#FDE1DB] border-[2.5px] border-[#552416] text-center shadow-sm leading-none">
            <div className="font-display font-extrabold text-[10px]">VÁN</div>
            <div className="font-display font-extrabold text-sm">#{roundLabel}</div>
          </div>
        }
      />

      {isHostDisconnected ? (
        <div className="chibi-section-yellow border-2 border-[#552416] px-3 py-2 mb-2 text-xs font-extrabold flex items-center justify-between gap-2">
          <span>⚠️ Chủ phòng bị mất kết nối!</span>
          <button
            type="button"
            onClick={handleClaimHost}
            className="px-2.5 py-1 rounded-xl bg-[#ADE7CF] border-2 border-[#552416] text-xs font-extrabold cursor-pointer"
          >
            👑 Nhận chủ phòng
          </button>
        </div>
      ) : null}

      {/* Tiêu đề */}
      <h1 className="chibi-title-3d text-[30px] sm:text-[34px] text-center leading-tight mt-0.5 mb-1">
        CUỘC ĐIỀU TRA
        <br />
        BẮT ĐẦU!
      </h1>

      {/* Nhóm nhân vật Chibi đứng tựa trên đỉnh card */}
      <div className="relative z-20 -mb-2.5 px-1">
        <img
          src={crowdInvestigating}
          alt="Nhóm bạn bắt đầu điều tra"
          className="w-full h-auto max-h-[145px] object-contain mx-auto block select-none"
          draggable={false}
        />
      </div>

      {/* Card chính */}
      <div className="chibi-card relative px-3.5 pt-4 pb-8 mb-6 space-y-3">
        {/* Thanh trạng thái 3 pill */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FCEAD4] border-2 border-[#552416]/35 font-display font-extrabold text-xs text-[#4A1D12]">
            <Users className="w-3.5 h-3.5 text-[#428BC1]" />
            <span>{players.length || room?.max_players || 0} NGƯỜI CHƠI</span>
          </span>

          <button
            type="button"
            disabled={!isHost || controlling}
            onClick={() => handleTimerAction("next_turn")}
            title={isHost ? "Chạm để chuyển vòng miêu tả" : undefined}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FCEAD4] border-2 border-[#552416]/35 font-display font-extrabold text-xs text-[#4A1D12] ${
              isHost ? "cursor-pointer hover:brightness-95" : "cursor-default"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              VÒNG MIÊU TẢ: {round?.description_turn ?? 1}/{round?.total_turns ?? 3}
            </span>
          </button>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF6E4E] border-2 border-[#552416] font-display font-extrabold text-xs text-white shadow-sm">
            <span>💬 ĐANG THẢO LUẬN</span>
          </span>
        </div>

        {/* Khu đồng hồ vàng */}
        <div className="chibi-section-yellow border-2 border-[#552416]/25 p-3.5 text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 font-display font-extrabold text-base text-[#4A1D12]">
            <Clock className="w-5 h-5" />
            <span>THỜI GIAN THẢO LUẬN</span>
          </div>

          <div
            className={`font-display font-extrabold text-[54px] sm:text-[62px] leading-none tracking-wider ${
              displaySeconds <= 30 && displaySeconds > 0
                ? "text-[#D93832]"
                : displaySeconds === 0
                ? "text-[#B52B27] animate-pulse"
                : "text-[#4A1D12]"
            }`}
          >
            {formatSeconds(displaySeconds)}
          </div>

          {isHost ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={controlling || Boolean(round?.timer_running)}
                onClick={() => handleTimerAction("start_timer")}
                className="chibi-btn btn-mint w-full text-xl py-2.5"
              >
                <Play className="w-5 h-5 fill-[#552416]" />
                <span>
                  {round?.timer_running
                    ? "ĐANG ĐẾM GIỜ..."
                    : "BẮT ĐẦU ĐẾM GIỜ"}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={controlling || !round?.timer_running}
                  onClick={() => handleTimerAction("pause_timer")}
                  className="chibi-btn btn-yellow !min-h-[44px] py-2 text-base"
                >
                  <Pause className="w-4 h-4 fill-[#552416]" />
                  <span>TẠM DỪNG</span>
                </button>

                <button
                  type="button"
                  disabled={controlling}
                  onClick={() => handleTimerAction("reset_timer")}
                  className="chibi-btn btn-pink !min-h-[44px] py-2 text-base"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.8]" />
                  <span>ĐẶT LẠI</span>
                </button>
              </div>

              {!round?.timer_running ? (
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[180, 300, 420].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      disabled={controlling}
                      onClick={() => handleTimerAction("set_duration", sec)}
                      className={`px-2.5 py-0.5 rounded-full border-2 text-xs font-extrabold cursor-pointer ${
                        round?.timer_duration_sec === sec
                          ? "bg-white border-[#552416]"
                          : "bg-white/60 border-[#552416]/40"
                      }`}
                    >
                      {sec / 60} phút
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-xs font-extrabold opacity-80">
              {round?.timer_running
                ? "⏱️ Đồng hồ đang chạy đồng bộ cùng chủ phòng"
                : "⏸️ Chủ phòng sẽ điều khiển đồng hồ thảo luận"}
            </div>
          )}
        </div>

        {/* Đội hình người chơi */}
        {players.length > 0 ? (
          <div className="bg-white/80 border-2 border-[#552416]/25 rounded-2xl px-3 py-2.5 overflow-visible">
            <div className="text-[11px] font-display font-extrabold text-[#6E3B2B] mb-2">
              ĐỘI HÌNH PHÒNG ({players.length})
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3.5 overflow-visible pt-1">
              {players.map((p) => {
                const isMe = p.user_id === currentUserId;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col items-center gap-1 min-w-[54px] max-w-[70px] overflow-visible"
                  >
                    <LayeredAvatar
                      config={resolvePlayerAvatarConfig(p)}
                      size={38}
                      interactive={isMe}
                      showBadge={isMe}
                      ariaLabel={isMe ? "Tùy chỉnh avatar của bạn" : p.nickname}
                      onClick={
                        isMe
                          ? () => {
                              feedback("tap");
                              setAvatarModalOpen(true);
                            }
                          : undefined
                      }
                    />
                    <span className="text-[10px] font-display font-extrabold text-[#4A1D12] uppercase truncate max-w-full">
                      {p.nickname}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* HƯỚNG DẪN */}
        <div className="chibi-section-lavender p-3.5 space-y-1">
          <div className="font-display font-extrabold text-base">HƯỚNG DẪN:</div>
          <ul className="text-sm font-bold space-y-1">
            <li>+ Lần lượt miêu tả từ khóa của bạn.</li>
            <li>+ Không được nói trực tiếp từ khóa!</li>
            <li>+ Hãy tìm ra ai đang nói dối!</li>
          </ul>
        </div>

        {/* Nút KẾT THÚC VÁN ĐẤU (chỉ chủ phòng) */}
        {isHost ? (
          <button
            type="button"
            disabled={ending}
            onClick={handleEndDiscussion}
            className="chibi-btn btn-mint w-full text-[22px] py-3"
          >
            <Flag className="w-6 h-6 stroke-[2.6]" />
            <span>{ending ? "ĐANG KẾT THÚC..." : "KẾT THÚC VÁN ĐẤU"}</span>
          </button>
        ) : (
          <div className="text-center text-xs font-extrabold opacity-80 py-1">
            Đặt điện thoại xuống, thảo luận trực tiếp và chờ chủ phòng kết thúc ván đấu!
          </div>
        )}

        {/* Nút XEM LUẬT CHƠI nổi cạnh dưới card */}
        <div className="flex justify-center -mb-14 pt-0.5">
          <button
            type="button"
            onClick={() => {
              feedback("tap");
              setRulesOpen(true);
            }}
            className="chibi-btn btn-pink min-w-[225px] text-lg py-2.5"
          >
            <BookOpen className="w-5 h-5 stroke-[2.6]" />
            <span>XEM LUẬT CHƠI</span>
          </button>
        </div>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <ConfirmDialog
        open={leaveOpen}
        title="RỜI VÁN CHƠI?"
        message="Bạn có chắc muốn rời khỏi phòng này không?"
        confirmLabel="RỜI PHÒNG"
        onConfirm={handleLeave}
        onCancel={() => setLeaveOpen(false)}
      />

      {me ? (
        <RoomPlayerAvatarModal
          open={avatarModalOpen}
          initialConfig={resolvePlayerAvatarConfig(me)}
          roomId={roomId}
          onClose={() => setAvatarModalOpen(false)}
          onSaved={() => refresh()}
        />
      ) : null}
    </SkyBackdrop>
  );
};
