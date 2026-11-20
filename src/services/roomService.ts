import { invokeEdgeFunction, requireSupabase } from "./supabase";
import type {
  CategoryFilter,
  Difficulty,
  GameRound,
  Room,
  RoomPlayer,
  RoomSettings,
  RoundAcknowledgement,
} from "../types/game";

export interface CreateRoomInput {
  room_name: string;
  nickname: string;
  avatar: string;
  max_players: number;
  undercover_count: number;
  mr_white_count: number;
  category_filter: CategoryFilter;
  difficulty: Difficulty;
}

export interface JoinRoomInput {
  room_code: string;
  nickname: string;
  avatar: string;
}

export interface RoomSnapshot {
  room: Room;
  settings: RoomSettings | null;
  players: RoomPlayer[];
  currentRound: GameRound | null;
  acknowledgements: RoundAcknowledgement[];
}

export async function createRoom(
  input: CreateRoomInput
): Promise<{ room_id: string; room_code: string }> {
  return invokeEdgeFunction("create-room", { ...input });
}

export async function joinRoom(
  input: JoinRoomInput
): Promise<{ room_id: string; room_code: string; reconnected?: boolean }> {
  return invokeEdgeFunction("join-room", { ...input });
}

export async function leaveRoom(roomId: string): Promise<void> {
  await invokeEdgeFunction("leave-room", { room_id: roomId });
}

export async function updateReadyStatus(
  roomId: string,
  isReady: boolean
): Promise<{ is_ready: boolean }> {
  return invokeEdgeFunction("update-ready-status", {
    room_id: roomId,
    is_ready: isReady,
  });
}

export async function sendHeartbeat(roomId: string): Promise<void> {
  await invokeEdgeFunction("room-presence", {
    room_id: roomId,
    action: "heartbeat",
  });
}

export async function claimHost(roomId: string): Promise<{ host_id: string }> {
  return invokeEdgeFunction("room-presence", {
    room_id: roomId,
    action: "claim_host",
  });
}

export async function updateRoomSettings(
  roomId: string,
  settings: {
    max_players: number;
    undercover_count: number;
    mr_white_count: number;
    category_filter: CategoryFilter;
    difficulty: Difficulty;
  }
): Promise<void> {
  await invokeEdgeFunction("room-presence", {
    room_id: roomId,
    action: "update_settings",
    ...settings,
  });
}

export async function fetchRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  const client = requireSupabase();

  const { data: room, error: roomErr } = await client
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr || !room) {
    return null;
  }

  const [{ data: settings }, { data: players }, { data: rounds }] =
    await Promise.all([
      client.from("room_settings").select("*").eq("room_id", roomId).maybeSingle(),
      client
        .from("room_players")
        .select("*")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true }),
      client
        .from("game_rounds")
        .select("*")
        .eq("room_id", roomId)
        .order("round_number", { ascending: false })
        .limit(1),
    ]);

  const currentRound = (rounds?.[0] as GameRound | undefined) ?? null;

  let acknowledgements: RoundAcknowledgement[] = [];
  if (currentRound) {
    const { data: acks } = await client
      .from("round_acknowledgements")
      .select("*")
      .eq("round_id", currentRound.id);
    acknowledgements = (acks as RoundAcknowledgement[] | null) ?? [];
  }

  return {
    room: room as Room,
    settings: (settings as RoomSettings | null) ?? null,
    players: (players as RoomPlayer[] | null) ?? [],
    currentRound,
    acknowledgements,
  };
}
