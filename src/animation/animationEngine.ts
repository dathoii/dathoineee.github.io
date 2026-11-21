import type React from "react";
import type {
  AnimationDirection,
  AnimationType,
  AssetAnimationConfig,
  AssetCategory,
  ParticleKind,
  PerformanceQuality,
} from "../types/game";

export const ANIMATION_TYPE_OPTIONS: {
  id: AnimationType;
  label: string;
  description: string;
}[] = [
  { id: "idle", label: "Idle (Thở & Nghiêng)", description: "Thở nhịp nhàng tự nhiên cho avatar" },
  { id: "blink", label: "Chớp mắt (Blink)", description: "Nhấn mạnh chớp mắt & nhịp nhẹ" },
  { id: "bounce", label: "Nhún nảy (Bounce)", description: "Nhún lên xuống vui nhộn" },
  { id: "float", label: "Bay bổng (Float)", description: "Lơ lửng trôi nhẹ nhàng" },
  { id: "sway", label: "Đung đưa (Sway)", description: "Lắc nhẹ trái phải theo gió" },
  { id: "rotation", label: "Xoay vòng (Rotation)", description: "Xoay chậm theo trục giữa" },
  { id: "glow", label: "Phát sáng (Glow)", description: "Nhịp sáng tỏa hào quang" },
  { id: "wing_flap", label: "Đập cánh (Wing Flap)", description: "Hai cánh vỗ đối xứng lệch pha" },
  { id: "particle", label: "Hạt hiệu ứng (Particle)", description: "Chuyển động nhẹ + tỏa hạt" },
  { id: "scale", label: "Co giãn (Scale)", description: "Nở phồng đàn hồi kiểu Slime" },
  { id: "custom", label: "Tùy biến (Custom)", description: "Kết hợp độ xoay, biên độ và hạt riêng" },
];

export const PARTICLE_KIND_OPTIONS: { id: ParticleKind; label: string; emoji: string }[] = [
  { id: "none", label: "Không có hạt", emoji: "⭕" },
  { id: "sparkle", label: "Lấp lánh", emoji: "✨" },
  { id: "heart", label: "Trái tim", emoji: "💖" },
  { id: "star", label: "Ngôi sao", emoji: "⭐" },
  { id: "fire", label: "Tia lửa", emoji: "🔥" },
  { id: "electric", label: "Tia điện", emoji: "⚡" },
  { id: "snow", label: "Bông tuyết", emoji: "❄️" },
  { id: "bubble", label: "Bong bóng", emoji: "🫧" },
  { id: "petal", label: "Cánh hoa", emoji: "🌸" },
  { id: "cosmos", label: "Vũ trụ", emoji: "🪐" },
  { id: "leaf", label: "Lá xanh", emoji: "🍃" },
];

export function getDefaultAnimationForCategory(
  category: AssetCategory
): AssetAnimationConfig {
  switch (category) {
    case "avatar":
      return {
        type: "idle",
        enabled: true,
        duration: 2800,
        delay: 0,
        intensity: 1,
        direction: "alternate",
        rotation: 2.5,
        amplitude: 1,
        loop: true,
        blinkEnabled: true,
        particleKind: "none",
      };
    case "head":
      return {
        type: "sway",
        enabled: true,
        duration: 2400,
        delay: 0,
        intensity: 0.9,
        direction: "alternate",
        rotation: 4,
        amplitude: 0.85,
        loop: true,
        particleKind: "sparkle",
      };
    case "wings":
      return {
        type: "wing_flap",
        enabled: true,
        duration: 1800,
        delay: 0,
        intensity: 1,
        direction: "alternate",
        rotation: 10,
        amplitude: 1,
        loop: true,
        particleKind: "none",
      };
    case "effects":
      return {
        type: "rotation",
        enabled: true,
        duration: 7500,
        delay: 0,
        intensity: 1,
        direction: "normal",
        rotation: 360,
        amplitude: 1,
        loop: true,
        particleKind: "sparkle",
      };
    case "other":
    default:
      return {
        type: "float",
        enabled: true,
        duration: 2200,
        delay: 120,
        intensity: 0.95,
        direction: "alternate",
        rotation: 3,
        amplitude: 1,
        loop: true,
        particleKind: "none",
      };
  }
}

const VALID_TYPES = new Set<AnimationType>(ANIMATION_TYPE_OPTIONS.map((t) => t.id));
const VALID_PARTICLES = new Set<ParticleKind>(PARTICLE_KIND_OPTIONS.map((p) => p.id));
const VALID_DIRS = new Set<AnimationDirection>(["normal", "reverse", "alternate"]);

export function coerceAnimationConfig(
  raw: unknown,
  category: AssetCategory
): AssetAnimationConfig {
  const defaults = getDefaultAnimationForCategory(category);
  if (!raw || typeof raw !== "object") {
    return defaults;
  }
  const obj = raw as Record<string, unknown>;
  const type = VALID_TYPES.has(obj.type as AnimationType)
    ? (obj.type as AnimationType)
    : defaults.type;
  const direction = VALID_DIRS.has(obj.direction as AnimationDirection)
    ? (obj.direction as AnimationDirection)
    : defaults.direction;
  const particleKind = VALID_PARTICLES.has(obj.particleKind as ParticleKind)
    ? (obj.particleKind as ParticleKind)
    : defaults.particleKind;

  return {
    type,
    enabled: typeof obj.enabled === "boolean" ? obj.enabled : defaults.enabled,
    duration: clampNum(obj.duration, 400, 15000, defaults.duration),
    delay: clampNum(obj.delay, 0, 5000, defaults.delay),
    intensity: clampNum(obj.intensity, 0.1, 2.5, defaults.intensity),
    direction,
    rotation: clampNum(obj.rotation, -360, 360, defaults.rotation),
    amplitude: clampNum(obj.amplitude, 0.1, 2.5, defaults.amplitude),
    loop: typeof obj.loop === "boolean" ? obj.loop : defaults.loop,
    blinkEnabled:
      typeof obj.blinkEnabled === "boolean"
        ? obj.blinkEnabled
        : defaults.blinkEnabled,
    particleKind,
    customPreset:
      typeof obj.customPreset === "string" ? obj.customPreset : defaults.customPreset,
  };
}

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function getAnimationClassName(
  anim: AssetAnimationConfig,
  wingSide?: "left" | "right"
): string {
  if (!anim.enabled) return "";
  if (anim.type === "wing_flap") {
    if (wingSide === "left") return "chibi-anim chibi-anim-wing-left";
    if (wingSide === "right") return "chibi-anim chibi-anim-wing-right";
    return "chibi-anim chibi-anim-float";
  }

  switch (anim.type) {
    case "idle":
    case "blink":
      return "chibi-anim chibi-anim-idle";
    case "bounce":
      return "chibi-anim chibi-anim-bounce";
    case "float":
      return "chibi-anim chibi-anim-float";
    case "sway":
      return "chibi-anim chibi-anim-sway";
    case "rotation":
      return "chibi-anim chibi-anim-rotation";
    case "glow":
      return "chibi-anim chibi-anim-glow";
    case "particle":
      return "chibi-anim chibi-anim-float";
    case "scale":
      return "chibi-anim chibi-anim-scale";
    case "custom":
      return "chibi-anim chibi-anim-custom";
    default:
      return "chibi-anim chibi-anim-idle";
  }
}

export function buildAnimationVars(
  anim: AssetAnimationConfig,
  quality: PerformanceQuality = "medium"
): React.CSSProperties {
  const perfScale = quality === "low" ? 0.65 : quality === "high" ? 1.15 : 1;
  const amp = anim.amplitude * anim.intensity * perfScale;
  const rotDeg = anim.rotation * anim.intensity * perfScale;
  const durMs = quality === "low" ? Math.round(anim.duration * 1.18) : anim.duration;

  return {
    "--chibi-dur": `${durMs}ms`,
    "--chibi-delay": `${anim.delay}ms`,
    "--chibi-dir": anim.direction,
    "--chibi-iter": anim.loop ? "infinite" : "1",
    "--chibi-amp": `${(amp * 4).toFixed(2)}px`,
    "--chibi-rot": `${rotDeg.toFixed(1)}deg`,
    "--chibi-scale-delta": `${Math.min(0.18, 0.05 * amp).toFixed(3)}`,
    "--chibi-glow": quality === "low" ? "0px" : `${Math.round(6 * anim.intensity)}px`,
  } as React.CSSProperties;
}

export function getParticleCountForContext(
  quality: PerformanceQuality,
  avatarSize: number,
  isVisible: boolean
): number {
  if (!isVisible || avatarSize < 34) return 0;
  if (quality === "low") return 0;
  const smallRoomFactor = avatarSize <= 48 ? 0.5 : 1;
  const base = quality === "high" ? 6 : 4;
  return Math.max(1, Math.round(base * smallRoomFactor));
}

let visibilityHooked = false;

export function ensureTabVisibilityPauseHook(): void {
  if (visibilityHooked || typeof document === "undefined") return;
  visibilityHooked = true;
  const sync = () => {
    document.documentElement.dataset.tabHidden = document.hidden ? "true" : "false";
  };
  sync();
  document.addEventListener("visibilitychange", sync);
}
