export interface RoleValidationResult {
  valid: boolean;
  civilianCount: number;
  error: string | null;
  warning: string | null;
}

/**
 * Kiểm tra cấu hình vai trò phòng chơi (3-20 người, không âm, tổng khớp maxPlayers).
 */
export function validateRoleDistribution(
  maxPlayers: number,
  undercoverCount: number,
  mrWhiteCount: number
): RoleValidationResult {
  if (!Number.isInteger(maxPlayers) || maxPlayers < 3 || maxPlayers > 20) {
    return {
      valid: false,
      civilianCount: 0,
      error: "Số người chơi phải nằm trong khoảng 3–20.",
      warning: null,
    };
  }
  if (undercoverCount < 0 || mrWhiteCount < 0) {
    return {
      valid: false,
      civilianCount: 0,
      error: "Số lượng vai trò không được âm.",
      warning: null,
    };
  }

  const civilianCount = maxPlayers - undercoverCount - mrWhiteCount;
  if (undercoverCount + mrWhiteCount < 1) {
    return {
      valid: false,
      civilianCount,
      error: "Cần ít nhất 1 Gián điệp hoặc Mr. White để bắt đầu!",
      warning: null,
    };
  }
  if (civilianCount < 1) {
    return {
      valid: false,
      civilianCount,
      error: "Phải có ít nhất 1 Dân thường (Civilian)!",
      warning: null,
    };
  }

  const warning =
    civilianCount <= undercoverCount + mrWhiteCount
      ? "Gợi ý: Số Dân thường nên nhiều hơn phe Gián điệp để cân bằng hơn!"
      : null;

  return {
    valid: true,
    civilianCount,
    error: null,
    warning,
  };
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
