import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppSettingsProvider } from "../contexts/AppSettingsContext";
import { AvatarCatalogProvider } from "../contexts/AvatarCatalogContext";
import { GameStartedPage } from "../pages/GameStarted/GameStartedPage";
import { RoundResultsPage } from "../pages/RoundResults/RoundResultsPage";
import type { RoomStatus, RoundResultsResponse } from "../types/game";

const mockGetRoundResults = vi.fn();
const mockEndDiscussion = vi.fn();
let mockRoomStatus: RoomStatus = "round_ended";

const mockPlayers = [
  {
    id: "p-1",
    room_id: "test-room",
    user_id: "user-1",
    nickname: "AN",
    avatar: "avatar-cat",
    is_ready: true,
    is_connected: true,
    last_seen_at: "2026-11-21T00:00:00Z",
    joined_at: "2026-11-21T00:00:00Z",
  },
  {
    id: "p-2",
    room_id: "test-room",
    user_id: "user-2",
    nickname: "MINH",
    avatar: "avatar-dog",
    is_ready: false,
    is_connected: true,
    last_seen_at: "2026-11-21T00:00:00Z",
    joined_at: "2026-11-21T00:01:00Z",
  },
  {
    id: "p-3",
    room_id: "test-room",
    user_id: "user-3",
    nickname: "LINH",
    avatar: "avatar-fox",
    is_ready: false,
    is_connected: true,
    last_seen_at: "2026-11-21T00:00:00Z",
    joined_at: "2026-11-21T00:02:00Z",
  },
];

vi.mock("../hooks/useRoomRealtime", () => ({
  useRoomRealtime: () => ({
    currentUserId: "user-1",
    loading: false,
    error: null,
    connectionLost: false,
    refresh: vi.fn().mockResolvedValue(undefined),
    snapshot: {
      room: {
        id: "test-room",
        room_code: "ABC123",
        room_name: "Phòng Test",
        host_id: "user-1",
        status: mockRoomStatus,
        max_players: 8,
        category_filter: "Tất cả",
        difficulty: "medium",
        current_round: 2,
        created_at: "2026-11-21T00:00:00Z",
        expires_at: "2026-11-21T06:00:00Z",
      },
      settings: null,
      players: mockPlayers,
      currentRound: {
        id: "round-2",
        room_id: "test-room",
        round_number: 2,
        status: mockRoomStatus === "round_ended" ? "ended" : "discussing",
        timer_duration_sec: 300,
        timer_remaining_sec: 300,
        timer_started_at: null,
        timer_running: false,
        description_turn: 1,
        total_turns: 3,
        created_at: "2026-11-21T00:00:00Z",
        started_at: "2026-11-21T00:00:00Z",
        ended_at: null,
      },
      acknowledgements: [],
    },
  }),
}));

vi.mock("../services/gameService", () => ({
  getRoundResults: (...args: unknown[]) => mockGetRoundResults(...args),
  endDiscussion: (...args: unknown[]) => mockEndDiscussion(...args),
  controlDiscussion: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/roomService", () => ({
  leaveRoom: vi.fn().mockResolvedValue(undefined),
  claimHost: vi.fn().mockResolvedValue(undefined),
}));

const sampleResults: RoundResultsResponse = {
  round_id: "round-2",
  round_number: 2,
  room_name: "Phòng Test",
  word_pair: {
    category: "Đồ ăn",
    civilian_word: "PHỞ BÒ",
    undercover_word: "BÚN BÒ HUẾ",
    difficulty: "medium",
    note: "Hai món nước truyền thống Việt Nam",
  },
  results: [
    {
      player_id: "p-2",
      user_id: "user-2",
      nickname: "MINH",
      avatar: "avatar-dog",
      role: "undercover",
      secret_word: "BÚN BÒ HUẾ",
    },
    {
      player_id: "p-3",
      user_id: "user-3",
      nickname: "LINH",
      avatar: "avatar-fox",
      role: "mr_white",
      secret_word: null,
    },
    {
      player_id: "p-1",
      user_id: "user-1",
      nickname: "AN",
      avatar: "avatar-cat",
      role: "civilian",
      secret_word: "PHỞ BÒ",
    },
  ],
};

function renderRoomRoute(initialRoute: string) {
  return render(
    <AppSettingsProvider>
      <AvatarCatalogProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/room/:roomId/play" element={<GameStartedPage />} />
            <Route path="/room/:roomId/results" element={<RoundResultsPage />} />
            <Route path="/room/:roomId/next" element={<div>MÀN HÌNH CHỜ VÁN TIẾP THEO</div>} />
          </Routes>
        </MemoryRouter>
      </AvatarCatalogProvider>
    </AppSettingsProvider>
  );
}

describe("Màn hình Kết Quả Ván Đấu (RoundResultsPage)", () => {
  beforeEach(() => {
    mockRoomStatus = "round_ended";
    mockGetRoundResults.mockReset();
    mockGetRoundResults.mockResolvedValue(sampleResults);
    mockEndDiscussion.mockReset();
    mockEndDiscussion.mockImplementation(async () => {
      mockRoomStatus = "round_ended";
      return { status: "round_ended" };
    });
  });

  it("Chủ phòng bấm KẾT THÚC VÁN ĐẤU đi thẳng vào /results chứ không bị đẩy sang /next", async () => {
    mockRoomStatus = "discussing";
    renderRoomRoute("/room/test-room/play");

    const endBtn = screen.getByRole("button", { name: /KẾT THÚC VÁN ĐẤU/i });
    fireEvent.click(endBtn);

    await waitFor(() => {
      expect(mockEndDiscussion).toHaveBeenCalledWith("test-room");
      expect(screen.getByText("KẾT QUẢ VÁN ĐẤU")).toBeInTheDocument();
    });
    expect(screen.queryByText("MÀN HÌNH CHỜ VÁN TIẾP THEO")).not.toBeInTheDocument();

    // Khi vừa mới vào /results trong thời gian settle guard, không nhảy nhầm qua /next
    await waitFor(() => {
      expect(screen.getByText(/CHI TIẾT TỪ KHÓA TỪNG NGƯỜI CHƠI \(3\)/i)).toBeInTheDocument();
    });
    const continueBtn = screen.getByRole("button", { name: /TIẾP TỤC CHỜ VÁN TIẾP THEO/i });
    expect(continueBtn).toBeDisabled();
    fireEvent.click(continueBtn);
    expect(screen.queryByText("MÀN HÌNH CHỜ VÁN TIẾP THEO")).not.toBeInTheDocument();
  });

  it("Hiển thị cặp từ khóa, vạch mặt Gián điệp/Mr. White, từ khóa của từng người chơi và chuyển sang NextRoundPage khi nút sẵn sàng", async () => {
    renderRoomRoute("/room/test-room/results");

    await waitFor(() => {
      expect(screen.getByText(/CHI TIẾT TỪ KHÓA TỪNG NGƯỜI CHƠI \(3\)/i)).toBeInTheDocument();
    });

    expect(mockGetRoundResults).toHaveBeenCalledWith("test-room");

    // 1. Cặp từ khóa của ván đấu
    expect(screen.getByText(/TỪ DÂN THƯỜNG/i)).toBeInTheDocument();
    expect(screen.getByText(/TỪ GIÁN ĐIỆP/i)).toBeInTheDocument();
    expect(screen.getAllByText("PHỞ BÒ").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("BÚN BÒ HUẾ").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Đồ ăn")).toBeInTheDocument();

    // 2. Spotlight AI LÀ GIÁN ĐIỆP?
    expect(screen.getByText(/AI LÀ GIÁN ĐIỆP\?/i)).toBeInTheDocument();
    expect(screen.getByText("2 nhân vật ẩn")).toBeInTheDocument();
    expect(screen.getByText("KHÔNG CÓ TỪ KHÓA (TRẮNG TỪ)")).toBeInTheDocument();

    // 3. Chi tiết từng người chơi + vai trò + từ khóa
    expect(screen.getAllByText("MINH").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("LINH").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("AN")).toBeInTheDocument();
    expect(screen.getByText("BẠN")).toBeInTheDocument();
    expect(screen.getByText("DÂN THƯỜNG")).toBeInTheDocument();
    expect(screen.getAllByText("GIÁN ĐIỆP").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("MR. WHITE").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("TRẮNG TỪ")).toBeInTheDocument();

    // 4. Đợi hết settle guard rồi bấm TIẾP TỤC CHỜ VÁN TIẾP THEO -> chuyển qua /room/:roomId/next
    const continueBtn = screen.getByRole("button", { name: /TIẾP TỤC CHỜ VÁN TIẾP THEO/i });
    await waitFor(() => expect(continueBtn).not.toBeDisabled(), { timeout: 2000 });
    fireEvent.click(continueBtn);
    expect(screen.getByText("MÀN HÌNH CHỜ VÁN TIẾP THEO")).toBeInTheDocument();
  });
});
