import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, Eye, EyeOff, Lock, Play, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useRoomRealtime } from "../../hooks/useRoomRealtime";
import {
  acknowledgeAssignment,
  controlDiscussion,
  getMyAssignment,
} from "../../services/gameService";
import { leaveRoom } from "../../services/roomService";
import type { MySecretAssignment } from "../../types/game";
import detectiveShush from "../../assets/characters/detective-shush.png";

export const SecretWordPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { feedback, showToast } = useAppSettings();
  const { snapshot, currentUserId, loading } = useRoomRealtime(roomId);

  const [assignment, setAssignment] = useState<MySecretAssignment | null>(null);
  const [fetchingWord, setFetchingWord] = useState(true);
  const [wordError, setWordError] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [forcingDiscussion, setForcingDiscussion] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const room = snapshot?.room;
  const players = snapshot?.players ?? [];
  const currentRound = snapshot?.currentRound;
  const acknowledgements = snapshot?.acknowledgements ?? [];

  const isHost = Boolean(room && currentUserId && room.host_id === currentUserId);

  const myPlayer = useMemo(
    () => players.find((p) => p.user_id === currentUserId) ?? null,
    [players, currentUserId]
  );

  // Đồng bộ điều hướng khi chuyển sang thảo luận hoặc kết thúc ván
  useEffect(() => {
    if (!room || !roomId) return;
    if (room.status === "discussing") {
      navigate(`/room/${roomId}/play`, { replace: true });
    } else if (room.status === "round_ended") {
      navigate(`/room/${roomId}/next`, { replace: true });
    } else if (room.status === "waiting") {
      navigate(`/room/${roomId}/lobby`, { replace: true });
    } else if (room.status === "closed") {
      navigate("/", { replace: true });
    }
  }, [room, roomId, navigate]);

  const loadMyAssignment = useCallback(async () => {
    if (!roomId) return;
    setFetchingWord(true);
    setWordError(null);
    try {
      const data = await getMyAssignment(roomId);
      setAssignment(data);
      setHasAcknowledged(Boolean(data.acknowledged_at));
    } catch (err) {
      setWordError(
        err instanceof Error ? err.message : "Không thể tải từ khóa bí mật."
      );
    } finally {
      setFetchingWord(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadMyAssignment();
  }, [loadMyAssignment, room?.current_round]);

  // Kiểm tra đồng bộ acknowledgment từ bảng round_acknowledgements (chỉ chứa player_id, không chứa bí mật)
  useEffect(() => {
    if (myPlayer && acknowledgements.some((a) => a.player_id === myPlayer.id)) {
      setHasAcknowledged(true);
    }
  }, [acknowledgements, myPlayer]);

  const ackCount = acknowledgements.length;
  const totalCount = players.length || room?.max_players || 0;

  const handleRevealToggle = () => {
    feedback("tap");
    setIsRevealed((prev) => !prev);
  };

  const handleAcknowledge = async () => {
    if (!roomId || !assignment) return;
    setAcknowledging(true);
    try {
      const res = await acknowledgeAssignment(roomId, assignment.round_id);
      feedback("success");
      setIsRevealed(false); // Ẩn ngay từ khóa khi đã xác nhận để tránh người ngồi cạnh nhìn thấy
      setHasAcknowledged(true);
      if (res.transitioned_to_discussion) {
        navigate(`/room/${roomId}/play`, { replace: true });
      }
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể xác nhận đã nhớ từ khóa.",
        "error"
      );
    } finally {
      setAcknowledging(false);
    }
  };

  const handleHostForceDiscussion = async () => {
    if (!roomId || !isHost) return;
    setForcingDiscussion(true);
    try {
      await controlDiscussion(roomId, "enter_discussion");
      feedback("success");
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể chuyển sang thảo luận.",
        "error"
      );
    } finally {
      setForcingDiscussion(false);
    }
  };

  const handleLeave = async () => {
    if (!roomId) return;
    await leaveRoom(roomId);
    navigate("/", { replace: true });
  };

  const roleUi = useMemo(() => {
    if (!assignment) return null;
    if (assignment.role === "civilian") {
      return {
        label: "DÂN THƯỜNG",
        sub: "(CIVILIAN)",
        bg: "bg-[#ADE7CF]",
        text: "text-[#166A45]",
      };
    }
    if (assignment.role === "undercover") {
      return {
        label: "GIÁN ĐIỆP",
        sub: "(UNDERCOVER)",
        bg: "bg-[#FDE1DB]",
        text: "text-[#B52B27]",
      };
    }
    return {
      label: "MR. WHITE",
      sub: "(KHÔNG CÓ TỪ KHÓA)",
      bg: "bg-[#EAE0FF]",
      text: "text-[#5B2E91]",
    };
  }, [assignment]);

  const roundLabel = String(
    assignment?.round_number ?? currentRound?.round_number ?? room?.current_round ?? 1
  ).padStart(2, "0");

  const playerDisplayName = (
    assignment?.nickname ?? myPlayer?.nickname ?? "BẠN"
  ).toUpperCase();

  return (
    <SkyBackdrop variant="secret">
      <BrandHeader
        showBack
        onBack={() => setLeaveOpen(true)}
        centerVariant="mini-logo"
        showSettings
      />

      {/* Thanh pill VÁN ĐẤU | BÍ MẬT */}
      <div className="flex items-center justify-center gap-2.5 mt-1 mb-2">
        <span className="px-3.5 py-1 rounded-full bg-white border-[2.5px] border-[#552416] shadow-sm font-display font-extrabold text-sm">
          VÁN ĐẤU: {roundLabel}
        </span>
        <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-[#F8C99D] border-[2.5px] border-[#552416] shadow-sm font-display font-extrabold text-sm">
          <span>BÍ MẬT</span>
          <Lock className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Lời chào & cảnh báo bảo mật */}
      <div className="text-center space-y-1 mb-3">
        <h1 className="font-display font-extrabold text-[28px] sm:text-[32px] leading-tight">
          XIN CHÀO, {playerDisplayName}! 👋
        </h1>
        <p className="text-sm font-bold opacity-90">
          Đây là thông tin bí mật dành riêng cho bạn
        </p>
        <div className="inline-block px-3.5 py-1 rounded-full bg-white/95 border-2 border-[#552416] text-xs font-extrabold shadow-sm">
          Đừng để người khác nhìn thấy màn hình! 🤫
        </div>
      </div>

      {/* Card phong bì bí mật */}
      <div className="chibi-card overflow-hidden mb-4">
        {/* Khung trên: Phong bì hồng & Thám tử Chibi suỵt */}
        <div className="relative bg-gradient-to-b from-[#FDE8EC] to-[#FFDF96] border-b-[3px] border-[#552416] p-3 pt-4">
          <div className="grid grid-cols-12 items-end gap-2">
            {/* Thám tử suỵt bên trái */}
            <div className="col-span-5 flex justify-center">
              <img
                src={detectiveShush}
                alt="Thám tử giữ bí mật"
                className="w-full max-w-[155px] h-auto object-contain select-none -mb-3"
                draggable={false}
              />
            </div>

            {/* Tờ giấy thông tin bí mật bên phải */}
            <div className="col-span-7 bg-white border-[3px] border-[#552416] rounded-2xl p-3 text-center shadow-[0_4px_0_rgba(85,36,22,0.16)] min-h-[195px] flex flex-col justify-center">
              {loading || fetchingWord ? (
                <div className="space-y-2 py-4">
                  <div className="font-display font-extrabold text-sm">
                    ĐANG MỞ PHONG BÌ...
                  </div>
                  <div className="text-xs font-bold opacity-75">
                    Đang xác thực danh tính an toàn
                  </div>
                </div>
              ) : wordError ? (
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-[#B52B27]">
                    ⚠️ {wordError}
                  </div>
                  <button
                    type="button"
                    onClick={loadMyAssignment}
                    className="chibi-btn btn-yellow !min-h-[36px] !py-1 !px-3 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>THỬ LẠI</span>
                  </button>
                </div>
              ) : isRevealed && assignment && roleUi ? (
                <div className="space-y-2.5 animate-page-enter">
                  <div>
                    <div className="font-display font-extrabold text-xs text-[#552416]">
                      VAI TRÒ CỦA BẠN:
                    </div>
                    <div
                      className={`mt-1 px-2 py-1.5 rounded-xl border-2 border-[#552416] ${roleUi.bg} ${roleUi.text}`}
                    >
                      <div className="font-display font-extrabold text-base leading-tight">
                        {roleUi.label}
                      </div>
                      <div className="font-display font-extrabold text-[11px] leading-tight">
                        {roleUi.sub}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-display font-extrabold text-xs text-[#552416]">
                      TỪ KHÓA CỦA BẠN:
                    </div>
                    <div className="mt-1 px-2 py-2 rounded-xl bg-[#FFDE84] border-2 border-[#552416] font-display font-extrabold text-lg sm:text-xl text-[#4A1D12] break-words">
                      {assignment.role === "mr_white"
                        ? "BẠN KHÔNG CÓ TỪ KHÓA"
                        : assignment.secret_word}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 py-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FFE7A8] border-2 border-[#552416] flex items-center justify-center">
                    <Lock className="w-6 h-6 text-[#552416]" />
                  </div>
                  <div className="font-display font-extrabold text-sm text-[#552416]">
                    THÔNG TIN ĐANG ĐƯỢC CHE KÍN
                  </div>
                  <p className="text-[11px] font-bold opacity-80">
                    Đảm bảo không ai nhìn trộm màn hình trước khi bấm mở!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Khung dưới: Các nút tương tác */}
        <div className="bg-[#FEF7E5] p-3.5 space-y-2.5 text-center">
          {!isRevealed ? (
            <button
              type="button"
              disabled={fetchingWord || Boolean(wordError)}
              onClick={handleRevealToggle}
              className="chibi-btn btn-yellow w-full text-xl py-3"
            >
              <Eye className="w-6 h-6 stroke-[2.6]" />
              <span>HIỆN TỪ KHÓA</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRevealToggle}
              className="chibi-btn btn-pink w-full text-base py-2.5"
            >
              <EyeOff className="w-5 h-5 stroke-[2.6]" />
              <span>ẨN THÔNG TIN</span>
            </button>
          )}

          {!hasAcknowledged ? (
            <button
              type="button"
              disabled={fetchingWord || Boolean(wordError) || acknowledging}
              onClick={handleAcknowledge}
              className="chibi-btn btn-mint w-full text-[20px] py-3"
            >
              <span>
                {acknowledging ? "ĐANG XÁC NHẬN..." : "ĐÃ NHỚ – TIẾP TỤC"}
              </span>
              <CheckSquare className="w-6 h-6 text-[#166A45] stroke-[2.8]" />
            </button>
          ) : (
            <div className="chibi-section-blue border-2 border-[#552416] p-3 space-y-2">
              <div className="font-display font-extrabold text-sm text-[#166A45]">
                ✅ BẠN ĐÃ XÁC NHẬN NHỚ TỪ KHÓA!
              </div>
              <div className="text-xs font-extrabold">
                Đang chờ mọi người xác nhận: {ackCount} / {totalCount} người chơi
              </div>
              <div className="w-full h-3 rounded-full bg-white border-2 border-[#552416] overflow-hidden">
                <div
                  className="h-full bg-[#ADE7CF] transition-all duration-300"
                  style={{
                    width: `${
                      totalCount > 0 ? Math.min(100, (ackCount / totalCount) * 100) : 0
                    }%`,
                  }}
                />
              </div>

              {isHost ? (
                <button
                  type="button"
                  disabled={forcingDiscussion}
                  onClick={handleHostForceDiscussion}
                  className="chibi-btn btn-yellow w-full text-sm py-2 mt-1"
                >
                  <Play className="w-4 h-4 fill-[#552416]" />
                  <span>
                    {forcingDiscussion
                      ? "ĐANG CHUYỂN..."
                      : "BẮT ĐẦU THẢO LUẬN NGAY (CHỦ PHÒNG)"}
                  </span>
                </button>
              ) : null}
            </div>
          )}

          <div className="pt-1 text-xs font-extrabold opacity-90">
            <div>ĐỪNG ĐỂ LỘ TỪ KHÓA NHA! 🤫</div>
            <div className="text-[11px] tracking-wider opacity-80">DATHOINEEE</div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={leaveOpen}
        title="RỜI PHÒNG CHƠI?"
        message="Ván đấu đang diễn ra. Bạn có chắc muốn rời khỏi phòng này không?"
        confirmLabel="RỜI PHÒNG"
        onConfirm={handleLeave}
        onCancel={() => setLeaveOpen(false)}
      />
    </SkyBackdrop>
  );
};
