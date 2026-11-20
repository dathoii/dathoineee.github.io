import { describe, expect, it } from "vitest";
import {
  formatSeconds,
  normalizeRoomCode,
  validateRoleDistribution,
} from "../utils/validation";

describe("validateRoleDistribution", () => {
  it("chấp nhận cấu hình mặc định 8 người: 1 Undercover, 0 Mr. White -> 7 Civilian", () => {
    const res = validateRoleDistribution(8, 1, 0);
    expect(res.valid).toBe(true);
    expect(res.civilianCount).toBe(7);
    expect(res.error).toBeNull();
  });

  it("chấp nhận cấu hình đề bài 8 người: 6 Civilian, 1 Undercover, 1 Mr. White", () => {
    const res = validateRoleDistribution(8, 1, 1);
    expect(res.valid).toBe(true);
    expect(res.civilianCount).toBe(6);
  });

  it("từ chối số lượng người chơi ngoài khoảng 3-20", () => {
    expect(validateRoleDistribution(2, 1, 0).valid).toBe(false);
    expect(validateRoleDistribution(21, 1, 0).valid).toBe(false);
  });

  it("từ chối số lượng vai trò âm", () => {
    expect(validateRoleDistribution(6, -1, 0).valid).toBe(false);
    expect(validateRoleDistribution(6, 1, -1).valid).toBe(false);
  });

  it("từ chối khi không có Gián điệp hay Mr. White", () => {
    expect(validateRoleDistribution(6, 0, 0).valid).toBe(false);
  });

  it("từ chối khi không còn ít nhất 1 Dân thường", () => {
    expect(validateRoleDistribution(4, 3, 1).valid).toBe(false);
  });
});

describe("normalizeRoomCode & formatSeconds", () => {
  it("chuẩn hóa mã phòng 6 ký tự in hoa và bỏ ký tự lạ", () => {
    expect(normalizeRoomCode("k7m-2qx!")).toBe("K7M2QX");
    expect(normalizeRoomCode("abc123456")).toBe("ABC123");
  });

  it("định dạng bộ đếm thời gian mm:ss chính xác", () => {
    expect(formatSeconds(300)).toBe("05:00");
    expect(formatSeconds(65)).toBe("01:05");
    expect(formatSeconds(-5)).toBe("00:00");
  });
});
