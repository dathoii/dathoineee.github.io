import type { AppSettings } from "../types/game";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playFeedback(
  type: "tap" | "success" | "alert" | "bell",
  settings: Pick<AppSettings, "soundEnabled" | "vibrationEnabled">
): void {
  if (settings.vibrationEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      if (type === "tap") navigator.vibrate(14);
      else if (type === "success") navigator.vibrate([18, 30, 24]);
      else if (type === "alert") navigator.vibrate([40, 40, 40]);
      else if (type === "bell") navigator.vibrate([60, 50, 90]);
    } catch {
      // Ignore vibration permission blocks
    }
  }

  if (!settings.soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playTone = (freq: number, start: number, dur: number, gainVal: number, wave: OscillatorType = "sine") => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(gainVal, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    if (type === "tap") {
      playTone(540, now, 0.06, 0.08, "triangle");
    } else if (type === "success") {
      playTone(523.25, now, 0.1, 0.09, "triangle");
      playTone(659.25, now + 0.07, 0.12, 0.09, "triangle");
      playTone(783.99, now + 0.14, 0.18, 0.09, "triangle");
    } else if (type === "alert") {
      playTone(320, now, 0.12, 0.09, "sawtooth");
      playTone(260, now + 0.1, 0.14, 0.09, "sawtooth");
    } else if (type === "bell") {
      playTone(880, now, 0.25, 0.12, "sine");
      playTone(1046.5, now + 0.16, 0.35, 0.12, "sine");
    }
  } catch {
    // Ignore audio context autoplay restrictions
  }
}
