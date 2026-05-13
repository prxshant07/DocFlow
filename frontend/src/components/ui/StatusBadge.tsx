import { motion } from "motion/react";

import type { Job } from "@/lib/api";

interface Props {
  status: Job["status"];
  size?: "sm" | "md";
}

const config: Record<
  Job["status"],
  {
    label: string;
    pulse: boolean;
    color: string;
    glow: string;
    bg: string;
    border: string;
  }
> = {
  queued: {
    label: "Queued",
    pulse: false,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.35)",
    bg: "rgba(251,191,36,0.10)",
    border:
      "rgba(251,191,36,0.18)",
  },

  processing: {
    label: "Processing",
    pulse: true,
    color: "#646cff",
    glow: "rgba(100,108,255,0.35)",
    bg: "rgba(100,108,255,0.10)",
    border:
      "rgba(100,108,255,0.18)",
  },

  completed: {
    label: "Completed",
    pulse: false,
    color: "#22d46e",
    glow: "rgba(34,212,110,0.28)",
    bg: "rgba(34,212,110,0.10)",
    border:
      "rgba(34,212,110,0.16)",
  },

  failed: {
    label: "Failed",
    pulse: false,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.30)",
    bg: "rgba(239,68,68,0.10)",
    border:
      "rgba(239,68,68,0.18)",
  },
};

export function StatusBadge({
  status,
  size = "md",
}: Props) {
  const {
    label,
    pulse,
    color,
    glow,
    bg,
    border,
  } = config[status];

  const isSmall = size === "sm";

  return (
    <motion.span
      whileHover={{
        y: -1,
      }}
      className={`badge badge-${status}`}
      style={{
        position: "relative",

        display: "inline-flex",
        alignItems: "center",
        gap: isSmall
          ? "0.38rem"
          : "0.5rem",

        height: isSmall
          ? "28px"
          : "32px",

        paddingInline: isSmall
          ? "0.7rem"
          : "0.9rem",

        borderRadius: "999px",

        background: bg,

        border: `1px solid ${border}`,

        color,

        fontSize: isSmall
          ? "0.72rem"
          : "0.76rem",

        fontWeight: 700,

        letterSpacing: "0.02em",

        backdropFilter: "blur(12px)",

        boxShadow: `0 0 18px ${glow}`,

        overflow: "hidden",

        transition:
          "all 0.2s ease",
      }}
    >
      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,

          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08), transparent)",

          pointerEvents: "none",
        }}
      />

      {/* dot */}
      <motion.span
        animate={
          pulse
            ? {
                scale: [
                  1, 1.35,
                  1,
                ],

                opacity: [
                  0.7, 1,
                  0.7,
                ],
              }
            : {}
        }
        transition={{
          duration: 1.4,
          repeat: Infinity,
        }}
        className={`badge-dot${
          pulse ? " pulse" : ""
        }`}
        style={{
          width: isSmall
            ? "7px"
            : "8px",

          height: isSmall
            ? "7px"
            : "8px",

          borderRadius: "999px",

          background: color,

          boxShadow: `0 0 12px ${color}`,

          flexShrink: 0,

          position: "relative",
          zIndex: 2,
        }}
      />

      {/* label */}
      <span
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        {label}
      </span>

      {/* shimmer */}
      <motion.div
        animate={{
          x: ["-120%", "220%"],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "40%",

          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",

          transform:
            "skewX(-20deg)",

          pointerEvents: "none",
        }}
      />
    </motion.span>
  );
}