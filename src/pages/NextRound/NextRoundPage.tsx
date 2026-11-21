import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Crown,
  Hourglass,
  Rocket,
  ThumbsUp,
  Undo2,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useRoomRealtime } from "../../hooks/useRoomRealtime";
import { returnToLobby, startNextRound } from "../../services/gameService";
import { claimHost, leaveRoom, updateReadyStatus } from "../../services/roomService";
import { resolvePlayerAvatarConfig } from "../../utils/avatars";
import { LayeredAvatar } from "../../components/avatar/LayeredAvatar";
import { RoomPlayerAvatarModal } from "../../components/avatar/RoomPlayerAvatarModal";
import crowdNextRound from "../../assets/images/crowd-next-round.png";

export const NextRoundPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { feedback, showToast } = useAppSettings();
  const { snapshot, currentUserId, refresh } = useRoomRealtime(roomId);

  const [toggling, setToggling] = useState(false);
  const [startingNext, setStartingNext] = useState(false);
  const [returningLobby, setReturningLobby] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const room = snapshot?.room;
  const players = snapshot?.players ?? [];

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

  const readyCount = useMemo(
    () => players.filter((p) => p.is_ready).length,
    [players]
  );

  const unreadyGuests = useMemo(
    () => players.filter((p) => p.user_id !== room?.host_id && !p.is_ready),
    [players, room?.host_id]
  );

  const canStartNext =
    isHost &&
    Boolean(room) &&
    players.length === room?.max_players &&
    unreadyGuests.length === 0 &&
    !startingNext;

  const handleToggleReady = async () => {
    if (!roomId || !me) return;
    setToggling(true);
    try {
      feedback("tap");
      await updateReadyStatus(roomId, !me.is_ready);
      await refresh();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật sẵn sàng.",
        "error"
      );
    } finally {
      setToggling(false);
    }
  };

  const handleStartNextRound = async () => {
    if (!roomId || !isHost) return;
    setStartingNext(true);
    try {
      await startNextRound(roomId);
      feedback("success");
      await refresh();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể bắt đầu ván mới.",
        "error"
      );
    } finally {
      setStartingNext(false);
    }
  };

  const handleReturnToLobby = async () => {
    if (!roomId) return;
    if (!isHost) {
      showToast("Chỉ chủ phòng mới có thể đưa nhóm quay về phòng chờ.", "info");
      return;
    }
    setReturningLobby(true);
    try {
      await returnToLobby(roomId);
      feedback("tap");
      await refresh();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể quay về phòng chờ.",
        "error"
      );
    } finally {
      setReturningLobby(false);
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

  const nextRoundNum = String((room?.current_round ?? 1) + 1).padStart(2, "0");

  return (
    <SkyBackdrop>
      <BrandHeader
        showBack
        onBack={() => setLeaveOpen(true)}
        rightExtra={
          <div className="px-2.5 py-1 rounded-xl bg-white border-[2.5px] border-[#552416] text-center shadow-sm leading-none">
            <div className="font-display font-extrabold text-[10px] text-[#C85346]">
              VÁN ĐẤU
            </div>
            <div className="font-display font-extrabold text-sm text-[#552416]">
              #{nextRoundNum}
            </div>
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

      <h1 className="chibi-title-3d text-[28px] sm:text-[32px] text-center mt-0.5 mb-1">
        CHUẨN BỊ VÁN MỚI
      </h1>

      {/* Nhóm nhân vật Chibi & Thám tử cầm biển */}
      <div className="relative z-20 -mb-2 px-1">
        <img
          src={crowdNextRound}
          alt="Ván mới sắp bắt đầu"
          className="w-full h-auto max-h-[135px] object-contain mx-auto block select-none"
          draggable={false}
        />
      </div>

      {/* Card chính */}
      <div className="chibi-card relative px-3.5 pt-4 pb-8 mb-6 space-y-3">
        {/* Banner chúc mừng kết thúc ván trước */}
        <div className="chibi-section-yellow border-2 border-[#552416]/25 px-3 py-2.5 text-center">
          <div className="font-display font-extrabold text-lg sm:text-xl text-[#4A1D12]">
            🎉 VÁN TRƯỚC ĐÃ KẾT THÚC! 🎉
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#4A1D12]/90">
            Bạn đã sẵn sàng cho thử thách tiếp theo chưa?
          </div>
        </div>

        {/* Bộ đếm sẵn sàng */}
        <div className="flex items-center gap-2 font-display font-extrabold text-base sm:text-lg">
          <Users className="w-5 h-5 text-[#428BC1]" />
          <span>
            ĐÃ SẴN SÀNG: {readyCount} / {players.length} NGƯỜI CHƠI
          </span>
        </div>

        {/* Danh sách người chơi 2 cột */}
        <div className="grid grid-cols-2 gap-2.5 overflow-visible">
          {players.map((p) => {
            const playerIsHost = p.user_id === room?.host_id;
            const isMe = p.user_id === currentUserId;
            const bg = p.is_ready ? "bg-[#ADE7CF]" : "bg-[#FFDE84]";
            const subColor = p.is_ready ? "text-[#166A45]" : "text-[#6B4208]";
            return (
              <div
                key={p.id}
                className={`${bg} border-[2.5px] border-[#552416] rounded-2xl p-2 flex items-center gap-2.5 overflow-visible shadow-[0_3px_0_rgba(85,36,22,0.18)] ${
                  isMe ? "ring-2 ring-[#552416]" : ""
                }`}
              >
                <div className="relative shrink-0 overflow-visible py-0.5">
                  <LayeredAvatar
                    config={resolvePlayerAvatarConfig(p)}
                    size={42}
                    interactive={isMe}
                    showBadge={isMe}
                    ariaLabel={isMe ? "Chỉnh sửa avatar của bạn" : p.nickname}
                    onClick={
                      isMe
                        ? () => {
                            feedback("tap");
                            setAvatarModalOpen(true);
                          }
                        : undefined
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 font-display font-extrabold text-sm text-[#4A1D12] leading-tight">
                    <span className="truncate uppercase">{p.nickname}</span>
                    {playerIsHost ? (
                      <Crown className="w-4 h-4 shrink-0 text-[#E59B14] fill-[#FFD94A]" />
                    ) : !p.is_ready ? (
                      <Hourglass className="w-3.5 h-3.5 shrink-0 text-[#C87A14]" />
                    ) : null}
                  </div>
                  <div
                    className={`font-display font-extrabold text-[11px] leading-tight mt-0.5 ${subColor}`}
                  >
                    {p.is_ready ? "ĐÃ SẴN SÀNG" : "ĐANG CHỜ..."}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lưu ý xáo trộn lại */}
        <div className="flex items-center justify-center gap-1.5 text-center text-xs font-extrabold opacity-90 pt-0.5">
          <AlertTriangle className="w-4 h-4 text-[#E69B19] shrink-0" />
          <span>Vai trò và từ khóa sẽ được xáo trộn lại ở ván tiếp theo!</span>
        </div>

        {/* Nút SẴN SÀNG VÁN MỚI */}
        {me ? (
          <button
            type="button"
            disabled={toggling}
            onClick={handleToggleReady}
            className={`chibi-btn ${
              me.is_ready ? "btn-cream" : "btn-mint"
            } w-full text-[20px] py-3`}
          >
            <ThumbsUp className="w-6 h-6 stroke-[2.6]" />
            <span>
              {me.is_ready ? "ĐÃ SẴN SÀNG (CHẠM ĐỂ HỦY)" : "SẴN SÀNG VÁN MỚI"}
            </span>
          </button>
        ) : null}

        {/* Nút BẮT ĐẦU VÁN MỚI (cho chủ phòng) */}
        <div className="space-y-1">
          <button
            type="button"
            disabled={!canStartNext}
            onClick={handleStartNextRound}
            className="chibi-btn btn-yellow w-full text-lg py-3"
          >
            <Rocket className="w-6 h-6 stroke-[2.5] text-[#D94F3D]" />
            <div className="flex flex-col leading-tight text-left">
              <span className="text-[20px]">
                {startingNext ? "ĐANG CHIA VÁN MỚI..." : "BẮT ĐẦU VÁN MỚI"}
              </span>
              <span className="text-xs font-bold opacity-85 text-center">
                (cho chủ phòng)
              </span>
            </div>
          </button>

          {isHost && !canStartNext && !startingNext ? (
            <div className="text-center text-xs font-bold opacity-85">
              {players.length < (room?.max_players ?? 0)
                ? `Phòng đang có ${players.length}/${room?.max_players} người. Quay về phòng chờ nếu muốn chỉnh số người!`
                : `Còn ${unreadyGuests.length} người chơi chưa bấm Sẵn sàng ván mới.`}
            </div>
          ) : null}
        </div>

        {/* Nút QUAY VỀ PHÒNG CHỜ nổi dưới card */}
        <div className="flex justify-center -mb-14 pt-0.5">
          <button
            type="button"
            disabled={!isHost || returningLobby}
            onClick={handleReturnToLobby}
            title={
              isHost
                ? "Đưa cả nhóm quay lại phòng chờ"
                : "Chủ phòng có thể đưa cả nhóm quay về phòng chờ"
            }
            className="chibi-btn btn-pink min-w-[240px] text-lg py-2.5"
          >
            <Undo2 className="w-5 h-5 stroke-[2.8]" />
            <span>
              {returningLobby ? "ĐANG QUAY VỀ..." : "QUAY VỀ PHÒNG CHỜ"}
            </span>
          </button>
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
