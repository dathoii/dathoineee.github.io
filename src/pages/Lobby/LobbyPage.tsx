import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  DoorOpen,
  Play,
  SlidersHorizontal,
  Users,
  WifiOff,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Modal } from "../../components/common/Modal";
import { StepperControl } from "../../components/common/StepperControl";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useRoomRealtime } from "../../hooks/useRoomRealtime";
import {
  claimHost,
  leaveRoom,
  updateReadyStatus,
  updateRoomSettings,
} from "../../services/roomService";
import { startRound } from "../../services/gameService";
import { CATEGORY_FILTERS, DIFFICULTY_META, getAvatarSrc } from "../../utils/avatars";
import { validateRoleDistribution } from "../../utils/validation";
import type { CategoryFilter, Difficulty } from "../../types/game";
import detectiveLobby from "../../assets/characters/detective-lobby.png";

export const LobbyPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { feedback, showToast } = useAppSettings();
  const { snapshot, currentUserId, loading, error, connectionLost, refresh } =
    useRoomRealtime(roomId);

  const [copied, setCopied] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [claimingHost, setClaimingHost] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Chỉnh cấu hình nhanh cho chủ phòng
  const [editOpen, setEditOpen] = useState(false);
  const [editMax, setEditMax] = useState(8);
  const [editUndercover, setEditUndercover] = useState(1);
  const [editMrWhite, setEditMrWhite] = useState(0);
  const [editCategory, setEditCategory] = useState<CategoryFilter>("Tất cả");
  const [editDifficulty, setEditDifficulty] = useState<Difficulty>("medium");
  const [savingSettings, setSavingSettings] = useState(false);

  const room = snapshot?.room;
  const settings = snapshot?.settings;
  const players = snapshot?.players ?? [];

  // Tự động chuyển màn hình theo trạng thái phòng Realtime
  useEffect(() => {
    if (!room || !roomId) return;
    if (room.status === "revealing") {
      navigate(`/room/${roomId}/secret`, { replace: true });
    } else if (room.status === "discussing") {
      navigate(`/room/${roomId}/play`, { replace: true });
    } else if (room.status === "round_ended") {
      navigate(`/room/${roomId}/next`, { replace: true });
    } else if (room.status === "closed") {
      showToast("Phòng đã đóng.", "info");
      navigate("/", { replace: true });
    }
  }, [room, roomId, navigate, showToast]);

  const me = useMemo(
    () => players.find((p) => p.user_id === currentUserId) ?? null,
    [players, currentUserId]
  );

  const isHost = Boolean(room && currentUserId && room.host_id === currentUserId);

  const hostPlayer = useMemo(
    () => players.find((p) => p.user_id === room?.host_id) ?? null,
    [players, room?.host_id]
  );

  const isHostDisconnected = useMemo(() => {
    if (!room || isHost) return false;
    if (!hostPlayer || !hostPlayer.is_connected) return true;
    return Date.now() - new Date(hostPlayer.last_seen_at).getTime() > 26_000;
  }, [room, isHost, hostPlayer]);

  const unreadyGuests = useMemo(
    () =>
      players.filter(
        (p) => p.user_id !== room?.host_id && !p.is_ready
      ),
    [players, room?.host_id]
  );

  const canStart =
    isHost &&
    Boolean(room) &&
    players.length === room?.max_players &&
    unreadyGuests.length === 0 &&
    !starting;

  const editRoleCheck = useMemo(
    () => validateRoleDistribution(editMax, editUndercover, editMrWhite),
    [editMax, editUndercover, editMrWhite]
  );

  const openSettingsModal = () => {
    if (!room || !settings) return;
    setEditMax(room.max_players);
    setEditUndercover(settings.undercover_count);
    setEditMrWhite(settings.mr_white_count);
    setEditCategory(room.category_filter);
    setEditDifficulty(room.difficulty);
    setEditOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !editRoleCheck.valid) return;
    setSavingSettings(true);
    try {
      await updateRoomSettings(roomId, {
        max_players: editMax,
        undercover_count: editUndercover,
        mr_white_count: editMrWhite,
        category_filter: editCategory,
        difficulty: editDifficulty,
      });
      feedback("success");
      showToast("Đã cập nhật cấu hình phòng!", "success");
      setEditOpen(false);
      await refresh();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật cấu hình.",
        "error"
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopyCode = async () => {
    if (!room) return;
    feedback("tap");
    const joinLink = `${window.location.origin}${window.location.pathname}#/join?room=${room.room_code}`;
    try {
      await navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      showToast(`Đã sao chép mã phòng ${room.room_code}! Link mời: ${joinLink}`, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(`Mã phòng của bạn: ${room.room_code}`, "info");
    }
  };

  const handleToggleReady = async () => {
    if (!roomId || !me) return;
    setActionError(null);
    setTogglingReady(true);
    try {
      feedback("tap");
      await updateReadyStatus(roomId, !me.is_ready);
      await refresh();
    } catch (err) {
      feedback("alert");
      setActionError(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái."
      );
    } finally {
      setTogglingReady(false);
    }
  };

  const handleStartGame = async () => {
    if (!roomId || !isHost) return;
    setActionError(null);
    setStarting(true);
    try {
      feedback("success");
      await startRound(roomId);
      await refresh();
    } catch (err) {
      feedback("alert");
      setActionError(
        err instanceof Error ? err.message : "Không thể bắt đầu trò chơi."
      );
    } finally {
      setStarting(false);
    }
  };

  const handleClaimHost = async () => {
    if (!roomId) return;
    setClaimingHost(true);
    try {
      await claimHost(roomId);
      feedback("success");
      showToast("Bạn đã trở thành chủ phòng mới!", "success");
      await refresh();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Chủ phòng vẫn đang kết nối.",
        "error"
      );
    } finally {
      setClaimingHost(false);
    }
  };

  const handleLeaveConfirmed = async () => {
    if (!roomId) return;
    setLeaving(true);
    try {
      await leaveRoom(roomId);
      feedback("tap");
      navigate("/", { replace: true });
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể rời phòng.",
        "error"
      );
    } finally {
      setLeaving(false);
      setLeaveConfirmOpen(false);
    }
  };

  if (loading && !snapshot) {
    return (
      <SkyBackdrop>
        <BrandHeader showBack onBack={() => navigate("/")} showSettings />
        <div className="chibi-card p-8 text-center my-auto space-y-2">
          <div className="font-display font-extrabold text-xl">
            ĐANG KẾT NỐI PHÒNG CHỜ...
          </div>
          <p className="text-sm font-bold opacity-75">
            Đang đồng bộ danh sách bạn bè từ máy chủ.
          </p>
        </div>
      </SkyBackdrop>
    );
  }

  if (error || !room) {
    return (
      <SkyBackdrop>
        <BrandHeader showBack onBack={() => navigate("/")} showSettings />
        <div className="chibi-card p-6 text-center my-auto space-y-4">
          <div className="font-display font-extrabold text-xl text-[#B52B27]">
            KHÔNG THỂ TẢI PHÒNG CHỜ
          </div>
          <p className="text-sm font-bold">{error ?? "Phòng không tồn tại."}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="chibi-btn btn-yellow w-full"
          >
            VỀ TRANG CHỦ
          </button>
        </div>
      </SkyBackdrop>
    );
  }

  return (
    <SkyBackdrop>
      <BrandHeader
        showBack
        onBack={() => setLeaveConfirmOpen(true)}
        showSettings
      />

      {connectionLost ? (
        <div className="chibi-section-warning border-2 border-[#B52B27] px-3 py-2 mb-2 text-xs font-extrabold text-[#9E1C19] flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Kết nối mạng đang chập chờn, hệ thống đang tự kết nối lại...</span>
        </div>
      ) : null}

      {isHostDisconnected ? (
        <div className="chibi-section-yellow border-2 border-[#552416] px-3 py-2 mb-2 text-xs font-extrabold flex items-center justify-between gap-2">
          <span>⚠️ Chủ phòng bị mất kết nối!</span>
          <button
            type="button"
            disabled={claimingHost}
            onClick={handleClaimHost}
            className="px-2.5 py-1 rounded-xl bg-[#ADE7CF] border-2 border-[#552416] text-xs font-extrabold cursor-pointer shrink-0"
          >
            {claimingHost ? "Đang xử lý..." : "👑 Nhận chủ phòng"}
          </button>
        </div>
      ) : null}

      {/* Tiêu đề & Thám tử Chibi với bóng thoại */}
      <div className="relative flex items-end justify-between mt-0.5 mb-1">
        <div className="flex items-center gap-1 pb-2">
          <span className="text-yellow-300 text-2xl drop-shadow-[0_2px_0_#552416]">
            ★
          </span>
          <h1 className="chibi-title-3d text-[30px] sm:text-[34px] leading-none">
            PHÒNG CHỜ
          </h1>
        </div>
        <div className="relative flex items-end">
          <div className="hidden xs:block mb-6 -mr-2 px-2.5 py-1 rounded-2xl bg-white border-[2.5px] border-[#552416] shadow-sm text-[10px] font-display font-extrabold text-[#552416] leading-tight text-center">
            CHỜ BẠN BÈ
            <br />
            VÔ NHA!
          </div>
          <img
            src={detectiveLobby}
            alt="Thám tử Chibi chào đón"
            className="w-24 h-auto -mb-3 z-20 select-none shrink-0"
            draggable={false}
          />
        </div>
      </div>

      {/* Card chính */}
      <div className="chibi-card relative px-3.5 pt-4 pb-8 mb-6 space-y-3.5">
        {/* THÔNG TIN PHÒNG */}
        <div className="chibi-section-blue p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-extrabold text-base">
              THÔNG TIN PHÒNG
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-white/85 border border-[#552416]/40 text-xs font-extrabold truncate max-w-[165px]">
              {room.room_name}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white border-[3px] border-[#552416] rounded-2xl p-1.5 pl-3">
            <div className="font-display font-extrabold text-lg sm:text-xl tracking-wide text-[#552416] truncate">
              MÃ PHÒNG: <span className="tracking-widest">{room.room_code}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ADE7CF] border-[2.5px] border-[#552416] shadow-[0_3px_0_#66B896] font-display font-extrabold text-xs text-[#4A1D12] cursor-pointer active:translate-y-0.5"
            >
              {copied ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <Copy className="w-4 h-4 stroke-[2.5]" />
              )}
              <span className="leading-tight text-left">
                {copied ? "ĐÃ CHÉP" : "SAO CHÉP"}
              </span>
            </button>
          </div>

          <div className="text-center text-xs font-bold opacity-90">
            Gửi mã này cho bạn bè để cùng tham gia!
          </div>
        </div>

        {/* SỐ NGƯỜI & CẤU HÌNH VAI TRÒ */}
        <div className="chibi-section-peach p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-display font-extrabold text-base sm:text-lg">
              <Users className="w-5 h-5 text-[#428BC1]" />
              <span>
                SỐ NGƯỜI: {players.length}/{room.max_players} người chơi
              </span>
            </div>
            {isHost ? (
              <button
                type="button"
                onClick={openSettingsModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FFDE84] border-2 border-[#552416] text-xs font-extrabold text-[#4A1D12] cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>
            ) : null}
          </div>

          {settings ? (
            <div className="text-xs sm:text-sm font-extrabold flex flex-wrap items-center gap-x-2 gap-y-1 opacity-90">
              <span>🕵️ {settings.undercover_count} Gián Điệp</span>
              <span>|</span>
              <span>👻 {settings.mr_white_count} Mr. White</span>
              <span>|</span>
              <span>🧒 {settings.civilian_count} Dân Thường</span>
            </div>
          ) : null}
        </div>

        {/* DANH SÁCH NGƯỜI CHƠI */}
        <div>
          <h2 className="font-display font-extrabold text-base mb-2">
            DANH SÁCH NGƯỜI CHƠI
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => {
              const playerIsHost = p.user_id === room.host_id;
              const isMe = p.user_id === currentUserId;
              const cardBg = p.is_ready ? "bg-[#ADE7CF]" : "bg-[#FFDE84]";
              const statusTextColor = p.is_ready
                ? "text-[#166A45]"
                : "text-[#6B4208]";
              const offline =
                !p.is_connected ||
                Date.now() - new Date(p.last_seen_at).getTime() > 35_000;

              return (
                <div
                  key={p.id}
                  className={`${cardBg} border-[2.5px] border-[#552416] rounded-2xl p-2 flex items-center gap-2 shadow-[0_3px_0_rgba(85,36,22,0.18)] ${
                    isMe ? "ring-2 ring-[#552416]" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={getAvatarSrc(p.avatar)}
                      alt={p.nickname}
                      className="w-11 h-11 rounded-full border-2 border-[#552416] bg-white object-cover"
                    />
                    <span
                      title={offline ? "Mất kết nối" : "Đang trực tuyến"}
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        offline ? "bg-[#E53935]" : "bg-[#1EA454]"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-display font-extrabold text-sm text-[#4A1D12] leading-tight">
                      <span className="truncate uppercase">{p.nickname}</span>
                      {playerIsHost ? (
                        <Crown
                          aria-label="Chủ phòng"
                          className="w-4 h-4 shrink-0 text-[#E59B14] fill-[#FFD94A]"
                        />
                      ) : null}
                    </div>
                    <div
                      className={`font-display font-extrabold text-[11px] leading-tight mt-0.5 ${statusTextColor}`}
                    >
                      {p.is_ready ? "ĐÃ SẴN SÀNG" : "ĐANG CHỜ"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {actionError ? (
          <div className="chibi-section-warning border-2 border-[#B52B27] px-3 py-2 text-xs font-extrabold text-[#9E1C19] text-center">
            ⚠️ {actionError}
          </div>
        ) : null}

        {/* Nút SẴN SÀNG cho thành viên (và chủ phòng cũng có thể bấm) */}
        {me ? (
          <button
            type="button"
            disabled={togglingReady}
            onClick={handleToggleReady}
            className={`chibi-btn ${
              me.is_ready ? "btn-yellow" : "btn-mint"
            } w-full text-lg py-2.5`}
          >
            {me.is_ready ? "⏳ HỦY SẴN SÀNG" : "✅ SẴN SÀNG"}
          </button>
        ) : null}

        {/* Nút BẮT ĐẦU TRÒ CHƠI (chỉ chủ phòng được kích hoạt khi đủ người) */}
        <div className="space-y-1">
          <button
            type="button"
            disabled={!canStart}
            onClick={handleStartGame}
            className="chibi-btn btn-mint w-full text-lg py-3"
          >
            <Play className="w-6 h-6 fill-[#552416]" />
            <div className="flex flex-col leading-tight text-left">
              <span className="text-[20px]">
                {starting ? "ĐANG CHIA TỪ KHÓA..." : "BẮT ĐẦU TRÒ CHƠI"}
              </span>
              <span className="text-xs font-bold opacity-85 text-center">
                (cho chủ phòng)
              </span>
            </div>
          </button>

          {isHost && !canStart && !starting ? (
            <div className="text-center text-xs font-bold opacity-85">
              {players.length < room.max_players
                ? `Đang chờ thêm ${room.max_players - players.length} người chơi nữa để đủ ${room.max_players} người.`
                : unreadyGuests.length > 0
                ? `Còn ${unreadyGuests.length} người chơi chưa bấm Sẵn sàng.`
                : null}
            </div>
          ) : null}
        </div>

        {/* Nút RỜI PHÒNG nổi dưới card */}
        <div className="flex justify-center -mb-14 pt-0.5">
          <button
            type="button"
            onClick={() => {
              feedback("tap");
              setLeaveConfirmOpen(true);
            }}
            className="chibi-btn btn-pink min-w-[205px] text-lg py-2.5"
          >
            <DoorOpen className="w-5 h-5 stroke-[2.8]" />
            <span>RỜI PHÒNG</span>
          </button>
        </div>
      </div>

      {/* Xác nhận rời phòng */}
      <ConfirmDialog
        open={leaveConfirmOpen}
        title="RỜI PHÒNG CHỜ?"
        message={
          isHost
            ? "Bạn đang là chủ phòng. Nếu rời đi, quyền chủ phòng sẽ được chuyển cho người chơi tiếp theo (hoặc đóng phòng nếu không còn ai)."
            : "Bạn có chắc muốn rời khỏi phòng chơi này không?"
        }
        confirmLabel="RỜI PHÒNG"
        loading={leaving}
        onConfirm={handleLeaveConfirmed}
        onCancel={() => setLeaveConfirmOpen(false)}
      />

      {/* Modal sửa cấu hình cho chủ phòng */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="⚙️ SỬA CẤU HÌNH PHÒNG"
      >
        <form onSubmit={handleSaveSettings} className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Số người chơi tối đa:</span>
            <StepperControl
              value={editMax}
              min={Math.max(3, players.length)}
              max={20}
              onChange={setEditMax}
              ariaLabel="số người tối đa"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Gián điệp (Undercover):</span>
            <StepperControl
              value={editUndercover}
              min={0}
              max={Math.max(0, editMax - editMrWhite - 1)}
              onChange={setEditUndercover}
              ariaLabel="số Gián điệp"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Mr. White:</span>
            <StepperControl
              value={editMrWhite}
              min={0}
              max={Math.max(0, editMax - editUndercover - 1)}
              onChange={setEditMrWhite}
              ariaLabel="số Mr. White"
            />
          </div>
          <div className="text-xs font-extrabold text-[#166A45]">
            Dân thường tự động tính: {editRoleCheck.civilianCount} người
          </div>

          <div>
            <div className="mb-1">Danh mục từ khóa:</div>
            <div className="flex flex-wrap gap-1">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEditCategory(cat.id)}
                  className={`px-2 py-1 rounded-xl border-2 text-xs font-extrabold cursor-pointer ${
                    editCategory === cat.id
                      ? "bg-[#ADE7CF] border-[#552416]"
                      : "bg-white border-[#552416]/40"
                  }`}
                >
                  {cat.label} {cat.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1">Độ khó:</div>
            <div className="grid grid-cols-3 gap-1.5">
              {DIFFICULTY_META.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setEditDifficulty(d.id)}
                  style={{ backgroundColor: d.bg }}
                  className={`py-1.5 rounded-xl border-2 text-xs font-extrabold cursor-pointer ${
                    editDifficulty === d.id
                      ? "border-[#552416] ring-2 ring-[#552416]"
                      : "border-[#552416]/40 opacity-75"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {editRoleCheck.error ? (
            <div className="text-xs text-[#B52B27]">{editRoleCheck.error}</div>
          ) : null}

          <button
            type="submit"
            disabled={!editRoleCheck.valid || savingSettings}
            className="chibi-btn btn-mint w-full text-base"
          >
            {savingSettings ? "ĐANG LƯU..." : "LƯU CẤU HÌNH"}
          </button>
        </form>
      </Modal>
    </SkyBackdrop>
  );
};
