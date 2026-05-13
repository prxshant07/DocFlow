"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  api,
  type ProgressEvent,
} from "@/lib/api";

interface Props {
  jobId: string;
  onComplete?: () => void;
}

const STAGE_LABELS: Record<
  string,
  string
> = {
  document_received: "Received",
  parsing_started: "Parsing",
  parsing_completed: "Parsed",
  extraction_started: "Extracting",
  extraction_completed: "Extracted",
  final_result_stored: "Storing",
  job_completed: "Complete",
  job_failed: "Failed",
};

const STAGES_ORDER = [
  "document_received",
  "parsing_started",
  "parsing_completed",
  "extraction_started",
  "extraction_completed",
  "final_result_stored",
  "job_completed",
];

export function ProgressTracker({
  jobId,
  onComplete,
}: Props) {
  const [events, setEvents] = useState<
    ProgressEvent[]
  >([]);

  const [latest, setLatest] =
    useState<ProgressEvent | null>(
      null
    );

  const [done, setDone] =
    useState(false);

  const esRef =
    useRef<EventSource | null>(null);

  const logRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jobId) return;

    esRef.current =
      api.subscribeProgress(
        jobId,

        (event) => {
          setLatest(event);

          setEvents((prev) => [
            ...prev,
            event,
          ]);

          if (logRef.current) {
            logRef.current.scrollTop =
              logRef.current.scrollHeight;
          }
        },

        () => {
          setDone(true);

          onComplete?.();
        }
      );

    return () => {
      esRef.current?.close();
    };
  }, [jobId, onComplete]);

  const pct =
    latest?.progress_pct ?? 0;

  const isFailed =
    latest?.status === "job_failed";

  const isComplete =
    latest?.status === "job_completed";

  const fillClass = isComplete
    ? "completed"
    : isFailed
    ? "failed"
    : "";

  const currentLabel = latest
    ? STAGE_LABELS[
        latest.stage ?? ""
      ] ??
      latest.stage ??
      "Processing…"
    : "Waiting…";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Progress header */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "0.7rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
            }}
          >
            {/* Live pulse */}
            {!isComplete &&
              !isFailed && (
                <motion.div
                  animate={{
                    scale: [1, 1.35, 1],
                    opacity: [
                      0.7, 1, 0.7,
                    ],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat:
                      Infinity,
                  }}
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius:
                      "999px",
                    background:
                      "#646cff",
                    boxShadow:
                      "0 0 12px #646cff",
                  }}
                />
              )}

            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: isFailed
                  ? "var(--danger)"
                  : isComplete
                  ? "var(--success)"
                  : "#d8dcff",
                letterSpacing:
                  "0.01em",
              }}
            >
              {currentLabel}
            </span>
          </div>

          <span
            style={{
              fontSize: "0.74rem",
              color:
                "var(--text-muted)",
              fontFamily:
                "var(--font-mono)",
              letterSpacing:
                "0.06em",
            }}
          >
            {pct}%
          </span>
        </div>

        {/* Progress track */}
        <div
          style={{
            position: "relative",
          }}
        >
          <div
            className="progress-bar-track"
            style={{
              height: "10px",
              borderRadius:
                "999px",
              overflow: "hidden",
              background:
                "rgba(255,255,255,0.04)",
              border:
                "1px solid rgba(255,255,255,0.05)",
              backdropFilter:
                "blur(10px)",
            }}
          >
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${pct}%`,
              }}
              transition={{
                duration: 0.45,
                ease: "easeOut",
              }}
              className={`progress-bar-fill ${fillClass}`}
              style={{
                height: "100%",
                borderRadius:
                  "999px",
                background:
                  isFailed
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : isComplete
                    ? "linear-gradient(90deg, #22d46e, #16a34a)"
                    : "linear-gradient(90deg, #646cff 0%, #7c5cff 45%, #8b5cf6 100%)",

                boxShadow:
                  isFailed
                    ? "0 0 20px rgba(239,68,68,0.28)"
                    : isComplete
                    ? "0 0 20px rgba(34,212,110,0.22)"
                    : "0 0 28px rgba(100,108,255,0.32)",
              }}
            />
          </div>

          {/* Glow */}
          {!isFailed && (
            <motion.div
              animate={{
                opacity: [
                  0.35, 0.7,
                  0.35,
                ],
              }}
              transition={{
                duration: 2,
                repeat:
                  Infinity,
              }}
              style={{
                position:
                  "absolute",
                top: 0,
                left: 0,
                width: `${pct}%`,
                height: "100%",
                borderRadius:
                  "999px",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.18), transparent)",
                pointerEvents:
                  "none",
              }}
            />
          )}
        </div>
      </div>

      {/* Stage stepper */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          paddingInline: "0.1rem",
        }}
      >
        {STAGES_ORDER.map(
          (stage, i) => {
            const reached =
              events.some(
                (e) =>
                  e.stage ===
                  stage
              );

            const isCurrent =
              latest?.stage ===
                stage &&
              !isComplete;

            const failed =
              isFailed &&
              isCurrent;

            const isLast =
              i ===
              STAGES_ORDER.length -
                1;

            const dotColor =
              failed
                ? "#ef4444"
                : reached
                ? isComplete &&
                  isLast
                  ? "#22d46e"
                  : "#646cff"
                : "rgba(255,255,255,0.08)";

            return (
              <div
                key={stage}
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  flex: isLast
                    ? 0
                    : 1,
                }}
              >
                {/* Dot */}
                <motion.div
                  animate={{
                    scale:
                      isCurrent
                        ? [
                            1,
                            1.2,
                            1,
                          ]
                        : 1,
                  }}
                  transition={{
                    duration: 1.6,
                    repeat:
                      isCurrent
                        ? Infinity
                        : 0,
                  }}
                  title={
                    STAGE_LABELS[
                      stage
                    ]
                  }
                  style={{
                    width:
                      isCurrent
                        ? 12
                        : 9,

                    height:
                      isCurrent
                        ? 12
                        : 9,

                    borderRadius:
                      "50%",

                    background:
                      dotColor,

                    border:
                      reached
                        ? `1.5px solid ${dotColor}`
                        : "1.5px solid rgba(255,255,255,0.10)",

                    flexShrink: 0,

                    transition:
                      "all 0.3s ease",

                    boxShadow:
                      isCurrent
                        ? `0 0 16px ${dotColor}`
                        : reached
                        ? `0 0 10px ${dotColor}66`
                        : "none",
                  }}
                />

                {/* Line */}
                {!isLast && (
                  <div
                    style={{
                      flex: 1,
                      height:
                        "2px",
                      background:
                        reached
                          ? "linear-gradient(90deg, #646cff, #8b5cf6)"
                          : "rgba(255,255,255,0.06)",

                      transition:
                        "background 0.4s ease",

                      opacity:
                        reached
                          ? 1
                          : 0.6,
                    }}
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Event log */}
      {events.length > 0 && (
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          ref={logRef}
          style={{
            background:
              "rgba(10,10,18,0.72)",

            border:
              "1px solid rgba(255,255,255,0.06)",

            borderRadius:
              "18px",

            padding:
              "0.8rem 0.9rem",

            maxHeight:
              "170px",

            overflowY: "auto",

            display: "flex",

            flexDirection:
              "column",

            gap: "0.4rem",

            backdropFilter:
              "blur(18px)",

            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {events.map((e, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                x: -6,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              style={{
                display: "flex",
                gap: "0.8rem",
                alignItems:
                  "flex-start",
                fontSize:
                  "0.72rem",
              }}
            >
              {/* timestamp */}
              <span
                style={{
                  color:
                    "var(--text-muted)",

                  fontFamily:
                    "var(--font-mono)",

                  flexShrink: 0,

                  letterSpacing:
                    "0.03em",

                  minWidth:
                    "74px",
                }}
              >
                {new Date(
                  e.timestamp
                ).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                    second:
                      "2-digit",
                  }
                )}
              </span>

              {/* Dot */}
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius:
                    "999px",
                  marginTop:
                    "0.38rem",

                  background:
                    e.status ===
                    "job_failed"
                      ? "#ef4444"
                      : e.status ===
                        "job_completed"
                      ? "#22d46e"
                      : "#646cff",

                  boxShadow:
                    e.status ===
                    "job_failed"
                      ? "0 0 10px #ef4444"
                      : e.status ===
                        "job_completed"
                      ? "0 0 10px #22d46e"
                      : "0 0 10px #646cff",
                }}
              />

              {/* Message */}
              <span
                style={{
                  color:
                    e.status ===
                    "job_failed"
                      ? "var(--danger)"
                      : e.status ===
                        "job_completed"
                      ? "var(--success)"
                      : "var(--text-secondary)",

                  lineHeight:
                    1.6,
                }}
              >
                {e.message}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Error */}
      {isFailed &&
        latest?.error && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="alert alert-danger"
            style={{
              fontSize:
                "0.78rem",

              background:
                "rgba(239,68,68,0.08)",

              border:
                "1px solid rgba(239,68,68,0.14)",

              backdropFilter:
                "blur(10px)",
            }}
          >
            {latest.error}
          </motion.div>
        )}
    </div>
  );
}