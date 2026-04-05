"use client";

import { useEffect, useRef, useState } from "react";
import { api, type ProgressEvent } from "@/lib/api";

interface Props {
  jobId: string;
  onComplete?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  document_received:   "Document received",
  parsing_started:     "Parsing content",
  parsing_completed:   "Parsing complete",
  extraction_started:  "AI extraction",
  extraction_completed:"Extraction complete",
  final_result_stored: "Storing results",
  job_completed:       "Complete ✓",
  job_failed:          "Failed",
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

    return () => {
      esRef.current?.close();
    };
  }, [jobId, onComplete]);

  const pct = latest?.progress_pct ?? 0;
  const isFailed = latest?.status === "job_failed";
  const isComplete = latest?.status === "job_completed";
  const fillClass = isComplete ? "completed" : isFailed ? "failed" : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            {latest ? STAGE_LABELS[latest.stage ?? ""] ?? latest.stage : "Waiting…"}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
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
      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
        {STAGES_ORDER.map((stage, i) => {
          const reached = events.some((e) => e.stage === stage);
          const isCurrent = latest?.stage === stage;
          const failed = isFailed && isCurrent;
          return (
            <div key={stage} style={{ display: "flex", alignItems: "center", flex: i < STAGES_ORDER.length - 1 ? 1 : 0 }}>
              <div
                title={STAGE_LABELS[stage]}
                style={{
                  width: 10, height: 10,
                  borderRadius: "50%",
                  background: failed
                    ? "var(--danger)"
                    : reached
                    ? "var(--accent)"
                    : "var(--bg-elevated)",
                  border: `1.5px solid ${failed ? "var(--danger)" : reached ? "var(--accent)" : "var(--border-active)"}`,
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                }}
              />
              {i < STAGES_ORDER.length - 1 && (
                <div style={{
                  flex: 1, height: 1.5,
                  background: reached ? "var(--accent)" : "var(--border)",
                  transition: "background 0.3s ease",
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
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.75rem",
            maxHeight: "160px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          {events.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem" }}>
              <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ color: e.status === "job_failed" ? "var(--danger)" : e.status === "job_completed" ? "var(--success)" : "var(--text-secondary)" }}>
                {e.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {isFailed && latest?.error && (
        <div className="alert alert-danger" style={{ fontSize: "0.8rem" }}>
          ✕ {latest.error}
        </div>
      )}
    </div>
  );
}
