import { invokeEdgeFunction } from "./supabase";
import type {
  GameRound,
  MySecretAssignment,
  RoundResultsResponse,
} from "../types/game";

export async function startRound(roomId: string): Promise<{
  round: { round_id: string; round_number: number; status: string };
}> {
  return invokeEdgeFunction("start-round", { room_id: roomId });
}

export async function startNextRound(roomId: string): Promise<{
  round: { round_id: string; round_number: number; status: string };
}> {
  return invokeEdgeFunction("start-next-round", {
    room_id: roomId,
    action: "start",
  });
}

export async function returnToLobby(roomId: string): Promise<void> {
  await invokeEdgeFunction("start-next-round", {
    room_id: roomId,
    action: "return_to_lobby",
  });
}

export async function getMyAssignment(roomId: string): Promise<MySecretAssignment> {
  return invokeEdgeFunction("get-my-assignment", { room_id: roomId });
}

export async function getRoundResults(roomId: string): Promise<RoundResultsResponse> {
  return invokeEdgeFunction("get-round-results", { room_id: roomId });
}

export async function acknowledgeAssignment(
  roomId: string,
  roundId: string
): Promise<{
  acknowledged: boolean;
  acknowledged_count: number;
  total_players: number;
  transitioned_to_discussion: boolean;
}> {
  return invokeEdgeFunction("acknowledge-assignment", {
    room_id: roomId,
    round_id: roundId,
  });
}

export async function controlDiscussion(
  roomId: string,
  action:
    | "enter_discussion"
    | "start_timer"
    | "pause_timer"
    | "reset_timer"
    | "set_duration"
    | "next_turn",
  extra?: { duration_sec?: number }
): Promise<{ round?: GameRound }> {
  return invokeEdgeFunction("start-discussion", {
    room_id: roomId,
    action,
    ...(extra ?? {}),
  });
}

export async function endDiscussion(roomId: string): Promise<void> {
  await invokeEdgeFunction("end-discussion", { room_id: roomId });
}
