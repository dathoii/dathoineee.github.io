import React from "react";
import type { ParticleKind } from "../../types/game";

interface AccessoryParticlesProps {
  kind: ParticleKind;
  count: number;
  size: number;
}

const PARTICLE_SLOTS = [
  { left: "8%", top: "16%", delay: "0ms", dur: "1800ms" },
  { left: "86%", top: "14%", delay: "350ms", dur: "2100ms" },
  { left: "14%", top: "82%", delay: "650ms", dur: "1950ms" },
  { left: "88%", top: "78%", delay: "220ms", dur: "2250ms" },
  { left: "50%", top: "-6%", delay: "480ms", dur: "1750ms" },
  { left: "4%", top: "48%", delay: "820ms", dur: "2050ms" },
];

const PARTICLE_VISUALS: Record<
  Exclude<ParticleKind, "none">,
  { symbol: string; color: string; mode: "twinkle" | "rise" | "fall" }
> = {
  sparkle: { symbol: "✦", color: "#FFE066", mode: "twinkle" },
  star: { symbol: "★", color: "#FFD447", mode: "twinkle" },
  heart: { symbol: "♥", color: "#FF6B98", mode: "rise" },
  bubble: { symbol: "○", color: "#7CE0FF", mode: "rise" },
  fire: { symbol: "◆", color: "#FF7B2E", mode: "rise" },
  electric: { symbol: "⚡", color: "#5CE1FF", mode: "twinkle" },
  snow: { symbol: "❄", color: "#BCEFFF", mode: "fall" },
  petal: { symbol: "✿", color: "#FFA6CE", mode: "fall" },
  cosmos: { symbol: "✧", color: "#C084FC", mode: "twinkle" },
  leaf: { symbol: "❧", color: "#4ADE80", mode: "fall" },
};

export const AccessoryParticles: React.FC<AccessoryParticlesProps> = ({
  kind,
  count,
  size,
}) => {
  if (kind === "none" || count <= 0) return null;
  const vis = PARTICLE_VISUALS[kind];
  if (!vis) return null;

  const fontSizePx = Math.max(8, Math.round(size * 0.16));
  const animClass =
    vis.mode === "rise"
      ? "chibi-particle-rise"
      : vis.mode === "fall"
      ? "chibi-particle-fall"
      : "chibi-particle-twinkle";

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-visible"
    >
      {PARTICLE_SLOTS.slice(0, count).map((slot, idx) => (
        <span
          key={idx}
          className={`absolute leading-none font-bold select-none ${animClass}`}
          style={{
            left: slot.left,
            top: slot.top,
            color: vis.color,
            fontSize: `${fontSizePx}px`,
            textShadow: "0 1px 0 rgba(85,36,22,0.55)",
            "--p-dur": slot.dur,
            animationDelay: slot.delay,
          } as React.CSSProperties}
        >
          {vis.symbol}
        </span>
      ))}
    </div>
  );
};
