"use client";

import { useEffect, useRef, useState } from "react";
import { api, type ProgressEvent } from "@/lib/api";

interface Props {
  jobId: string;
  onComplete?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  document_received:    "Received",
  parsing_started:      "Parsing",
  parsing_completed:    "Parsed",
  extraction_started:   "Extracting",
  extraction_completed: "Extracted",
  final_result_stored:  "Storing",
  job_completed:        "Complete",
  job_failed:           "Failed",
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

export function ProgressTracker({ jobId, onComplete }: Props) {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [latest, setLatest] = useState<ProgressEvent | null>(null);
  const [done, setDone] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jobId) return;
    esRef.current = api.subscribeProgress(
      jobId,
      (event) => {
        setLatest(event);
        setEvents((prev) => [...prev, event]);
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      },
      () => {
        setDone(true);
        onComplete?.();
      }
    );
    return () => { esRef.current?.close(); };
  }, [jobId, onComplete]);

  const pct = latest?.progress_pct ?? 0;
  const isFailed = latest?.status === "job_failed";
  const isComplete = latest?.status === "job_completed";
  const fillClass = isComplete ? "completed" : isFailed ? "failed" : "";
  const currentLabel = latest
    ? (STAGE_LABELS[latest.stage ?? ""] ?? latest.stage ?? "Processing…")
    : "Waiting…";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

      {/* Progress bar + label */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}>
          <span style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            color: isFailed
              ? "var(--danger)"
              : isComplete
              ? "var(--success)"
              : "var(--text-secondary)",
            letterSpacing: "0.01em",
          }}>
            {currentLabel}
          </span>
          <span style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}>
            {pct}%
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${fillClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stage stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STAGES_ORDER.map((stage, i) => {
          const reached = events.some((e) => e.stage === stage);
          const isCurrent = latest?.stage === stage && !isComplete;
          const failed = isFailed && isCurrent;
          const isLast = i === STAGES_ORDER.length - 1;

          const dotColor = failed
            ? "var(--danger)"
            : reached
            ? isComplete && isLast
              ? "var(--success)"
              : "var(--brand)"
            : "var(--bg-elevated)";

          const borderColor = failed
            ? "var(--danger)"
            : reached
            ? isComplete && isLast
              ? "var(--success)"
              : "var(--brand)"
            : "var(--border-active)";

          return (
            <div
              key={stage}
              style={{
                display: "flex",
                alignItems: "center",
                flex: isLast ? 0 : 1,
              }}
            >
              <div
                title={STAGE_LABELS[stage]}
                style={{
                  width: isCurrent ? 11 : 8,
                  height: isCurrent ? 11 : 8,
                  borderRadius: "50%",
                  background: dotColor,
                  border: `1.5px solid ${borderColor}`,
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                  boxShadow: isCurrent
                    ? "0 0 6px rgba(100,108,255,0.5)"
                    : "none",
                }}
              />
              {!isLast && (
                <div style={{
                  flex: 1,
                  height: "1.5px",
                  background: reached ? "var(--brand)" : "var(--border)",
                  transition: "background 0.4s ease",
                  opacity: reached ? 1 : 0.5,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Event log */}
      {events.length > 0 && (
        <div
          ref={logRef}
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            padding: "0.65rem 0.75rem",
            maxHeight: "148px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.18rem",
          }}
        >
          {events.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.72rem" }}>
              <span style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}>
                {new Date(e.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span style={{
                color: e.status === "job_failed"
                  ? "var(--danger)"
                  : e.status === "job_completed"
                  ? "var(--success)"
                  : "var(--text-secondary)",
                lineHeight: 1.5,
              }}>
                {e.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isFailed && latest?.error && (
        <div className="alert alert-danger" style={{ fontSize: "0.78rem" }}>
          {latest.error}
        </div>
      )}
    </div>
  );
}