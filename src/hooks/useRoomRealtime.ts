import { useCallback, useEffect, useRef, useState } from "react";
import { ensurePlayerSession, isSupabaseConfigured, supabase } from "../services/supabase";
import { fetchRoomSnapshot, sendHeartbeat, type RoomSnapshot } from "../services/roomService";

export interface UseRoomRealtimeResult {
  snapshot: RoomSnapshot | null;
  currentUserId: string | null;
  loading: boolean;
  error: string | null;
  connectionLost: boolean;
  refresh: () => Promise<void>;
}

export function useRoomRealtime(roomId: string | undefined): UseRoomRealtimeResult {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!roomId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const session = await ensurePlayerSession();
      if (!isMounted.current) return;
      setCurrentUserId(session.user.id);

      const data = await fetchRoomSnapshot(roomId);
      if (!isMounted.current) return;

      if (!data) {
        setError("Không tìm thấy phòng hoặc bạn chưa tham gia phòng này.");
        setSnapshot(null);
      } else {
        setSnapshot(data);
        setError(null);
      }
      setConnectionLost(false);
    } catch (err) {
      if (!isMounted.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "Không thể đồng bộ dữ liệu phòng."
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [roomId]);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    refresh();

    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  // Đăng ký Supabase Realtime cho các bảng công khai của phòng
  useEffect(() => {
    if (!roomId || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`room-sync-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => {
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_settings", filter: `room_id=eq.${roomId}` },
        () => {
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => {
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rounds", filter: `room_id=eq.${roomId}` },
        () => {
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "round_acknowledgements" },
        () => {
          refresh();
        }
      )
      .subscribe((status) => {
        if (!isMounted.current) return;
        if (status === "SUBSCRIBED") {
          setConnectionLost(false);
          refresh();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionLost(true);
        }
      });

    // Heartbeat định kỳ 12 giây để theo dõi mất kết nối & chuyển quyền chủ phòng nếu treo
    const hbInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendHeartbeat(roomId).catch(() => {});
      }
    }, 12_000);

    // Đồng bộ lại ngay khi người dùng mở lại màn hình điện thoại
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        sendHeartbeat(roomId).catch(() => {});
      }
    };

    const handleOnline = () => {
      setConnectionLost(false);
      refresh();
    };
    const handleOffline = () => {
      setConnectionLost(true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.clearInterval(hbInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      supabase?.removeChannel(channel);
    };
  }, [roomId, refresh]);

  return {
    snapshot,
    currentUserId,
    loading,
    error,
    connectionLost,
    refresh,
  };
}
