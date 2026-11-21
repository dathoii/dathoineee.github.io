export interface EyeBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface AvatarFaceFeaturePreset {
  mode: "blink" | "glint" | "joy";
  skinColor?: string;
  leftEye?: EyeBox;
  rightEye?: EyeBox;
  blinkIntervalMs?: number;
}

export const AVATAR_FACE_PRESETS: Record<string, AvatarFaceFeaturePreset> = {
  // 8 Avatar từ ảnh tham chiếu
  avatar_01: { mode: "glint", leftEye: { cx: 38, cy: 52, w: 16, h: 16 }, rightEye: { cx: 61, cy: 52, w: 16, h: 16 }, blinkIntervalMs: 3800 },
  avatar_02: { mode: "glint", leftEye: { cx: 39, cy: 46, w: 17, h: 13 }, rightEye: { cx: 61, cy: 46, w: 17, h: 13 }, blinkIntervalMs: 4200 },
  avatar_03: { mode: "glint", leftEye: { cx: 39, cy: 56, w: 17, h: 17 }, rightEye: { cx: 61, cy: 56, w: 17, h: 17 }, blinkIntervalMs: 4000 },
  avatar_04: { mode: "joy", blinkIntervalMs: 3200 },
  avatar_05: { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 42, cy: 49, w: 8.5, h: 9.5 }, rightEye: { cx: 58, cy: 49, w: 8.5, h: 9.5 }, blinkIntervalMs: 3600 },
  avatar_06: { mode: "blink", skinColor: "#FAD2B9", leftEye: { cx: 41, cy: 56, w: 8.5, h: 9.5 }, rightEye: { cx: 59, cy: 56, w: 8.5, h: 9.5 }, blinkIntervalMs: 3300 },
  avatar_07: { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 41, cy: 53, w: 9.5, h: 9.5 }, rightEye: { cx: 58, cy: 53, w: 9.5, h: 9.5 }, blinkIntervalMs: 2900 },
  avatar_08: { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 42, cy: 48, w: 8.5, h: 9.5 }, rightEye: { cx: 58, cy: 48, w: 8.5, h: 9.5 }, blinkIntervalMs: 4100 },

  // 10 Avatar gốc được bảo toàn
  "avatar-dino": { mode: "blink", skinColor: "#70C7B5", leftEye: { cx: 39, cy: 54, w: 7.5, h: 8.5 }, rightEye: { cx: 57, cy: 54, w: 7.5, h: 8.5 }, blinkIntervalMs: 3400 },
  "avatar-cat": { mode: "joy", blinkIntervalMs: 3000 },
  "avatar-green-curly": { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 40, cy: 56, w: 9, h: 9.5 }, rightEye: { cx: 60, cy: 56, w: 9, h: 9.5 }, blinkIntervalMs: 3500 },
  "avatar-blue-glasses": { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 39, cy: 58, w: 9, h: 9.5 }, rightEye: { cx: 61, cy: 58, w: 9, h: 9.5 }, blinkIntervalMs: 4300 },
  "avatar-bunny": { mode: "blink", skinColor: "#FFFFFF", leftEye: { cx: 37, cy: 56, w: 9, h: 9.5 }, rightEye: { cx: 63, cy: 56, w: 9, h: 9.5 }, blinkIntervalMs: 2800 },
  "avatar-blue-shades": { mode: "glint", leftEye: { cx: 37, cy: 60, w: 18, h: 16 }, rightEye: { cx: 62, cy: 60, w: 18, h: 16 }, blinkIntervalMs: 4400 },
  "avatar-afro-shades": { mode: "glint", leftEye: { cx: 39, cy: 59, w: 17, h: 17 }, rightEye: { cx: 61, cy: 59, w: 17, h: 17 }, blinkIntervalMs: 3900 },
  "avatar-blonde-boy": { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 39, cy: 56, w: 9, h: 9.5 }, rightEye: { cx: 60, cy: 56, w: 9, h: 9.5 }, blinkIntervalMs: 3100 },
  "avatar-red-glasses": { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 41, cy: 57, w: 8.5, h: 9.5 }, rightEye: { cx: 59, cy: 57, w: 8.5, h: 9.5 }, blinkIntervalMs: 3700 },
  "avatar-orange-kimono": { mode: "blink", skinColor: "#FAD3BA", leftEye: { cx: 41, cy: 57, w: 8.5, h: 9.5 }, rightEye: { cx: 60, cy: 57, w: 8.5, h: 9.5 }, blinkIntervalMs: 3400 },

  // 10 Avatar mới - Expansion Pack 01
  avatar_exp_01: { mode: "blink", skinColor: "#FFE2CE", leftEye: { cx: 40.2, cy: 49.6, w: 8.2, h: 9.8 }, blinkIntervalMs: 3200 },
  avatar_exp_02: { mode: "blink", skinColor: "#FFE8DA", leftEye: { cx: 39.8, cy: 50.0, w: 8.2, h: 9.2 }, rightEye: { cx: 60.2, cy: 50.0, w: 8.2, h: 9.2 }, blinkIntervalMs: 4500 },
  avatar_exp_03: { mode: "blink", skinColor: "#FFE3CE", leftEye: { cx: 40.2, cy: 49.2, w: 8.2, h: 9.4 }, rightEye: { cx: 59.8, cy: 49.2, w: 8.2, h: 9.4 }, blinkIntervalMs: 3300 },
  avatar_exp_04: { mode: "blink", skinColor: "#FFE3D2", leftEye: { cx: 40.2, cy: 49.2, w: 8.6, h: 9.8 }, rightEye: { cx: 59.8, cy: 49.2, w: 8.6, h: 9.8 }, blinkIntervalMs: 2800 },
  avatar_exp_05: { mode: "blink", skinColor: "#FDE0CA", leftEye: { cx: 40.2, cy: 50.0, w: 7.8, h: 8.4 }, rightEye: { cx: 59.8, cy: 50.0, w: 7.8, h: 8.4 }, blinkIntervalMs: 4200 },
  avatar_exp_06: { mode: "blink", skinColor: "#FFE0CA", leftEye: { cx: 40.2, cy: 49.2, w: 8.2, h: 9.4 }, rightEye: { cx: 59.8, cy: 49.2, w: 8.2, h: 9.4 }, blinkIntervalMs: 3000 },
  avatar_exp_07: { mode: "blink", skinColor: "#FFE6DA", leftEye: { cx: 40.2, cy: 49.6, w: 8.2, h: 9.8 }, rightEye: { cx: 59.8, cy: 49.6, w: 8.2, h: 9.8 }, blinkIntervalMs: 4000 },
  avatar_exp_08: { mode: "blink", skinColor: "#FFE2CE", leftEye: { cx: 40.2, cy: 49.6, w: 8.2, h: 9.2 }, rightEye: { cx: 59.8, cy: 49.6, w: 8.2, h: 9.2 }, blinkIntervalMs: 3600 },
  avatar_exp_09: { mode: "blink", skinColor: "#FFE4D2", leftEye: { cx: 40.2, cy: 49.6, w: 8.2, h: 9.2 }, rightEye: { cx: 59.8, cy: 49.6, w: 8.2, h: 9.2 }, blinkIntervalMs: 3900 },
  avatar_exp_10: { mode: "joy", blinkIntervalMs: 2900 },
};

export function getAvatarFacePreset(avatarId: string): AvatarFaceFeaturePreset {
  return (
    AVATAR_FACE_PRESETS[avatarId] ?? {
      mode: "blink",
      skinColor: "#FFE0CC",
      leftEye: { cx: 40, cy: 52, w: 8, h: 8.5 },
      rightEye: { cx: 60, cy: 52, w: 8, h: 8.5 },
      blinkIntervalMs: 3600,
    }
  );
}
