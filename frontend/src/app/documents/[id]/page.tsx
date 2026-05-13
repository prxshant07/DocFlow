"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";

import {
  api,
  type Document,
} from "@/lib/api";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressTracker } from "@/components/progress/ProgressTracker";
import { useAuth } from "@/lib/auth-context";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const router = useRouter();
  const { user } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const [doc, setDoc] = useState<Document | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [editMode, setEditMode] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [finalizing, setFinalizing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDoc = useCallback(async () => {
    try {
      const d = await api.getDocument(id);

      setDoc(d);

      if (d.extracted_data) {
        setTitle(d.extracted_data.title ?? "");
        setCategory(d.extracted_data.category ?? "");
        setSummary(d.extracted_data.summary ?? "");
        setKeywords(
          (d.extracted_data.keywords ?? []).join(", ")
        );
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  // Poll active jobs
  useEffect(() => {
    if (!doc?.job) return;

    if (
      doc.job.status === "processing" ||
      doc.job.status === "queued"
    ) {
      const t = setInterval(fetchDoc, 3000);

      return () => clearInterval(t);
    }
  }, [doc, fetchDoc]);

  const handleSave = async () => {
    if (!doc) return;

    setSaving(true);
    setSaveError(null);

    try {
      await api.updateExtracted(doc.id, {
        title,
        category,
        summary,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      });

      setEditMode(false);

      await fetchDoc();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!doc) return;

    setFinalizing(true);

    try {
      await api.finalize(doc.id);

      await fetchDoc();
    } finally {
      setFinalizing(false);
    }
  };

  const handleRetry = async () => {
    if (!doc) return;

    setRetrying(true);

    try {
      await api.retry(doc.id);

      await fetchDoc();
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (
      !doc ||
      !confirm(`Delete "${doc.original_filename}"?`)
    )
      return;

    setDeleting(true);

    try {
      await api.deleteDocument(doc.id);

      router.push("/dashboard");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="alert alert-danger"
        style={{
          maxWidth: 500,
        }}
      >
        ✕ {error} ·{" "}
        <Link
          href="/dashboard"
          className="btn btn-ghost btn-sm"
        >
          Back
        </Link>
      </div>
    );
  }

  if (!doc) return null;

  const isProcessing =
    doc.job?.status === "processing" ||
    doc.job?.status === "queued";

  const isFailed = doc.job?.status === "failed";

  const isComplete = doc.job?.status === "completed";

  const hasData = !!doc.extracted_data;

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-120px",
          width: "320px",
          height: "320px",
          borderRadius: "999px",
          background: "rgba(100,108,255,0.12)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          Dashboard
        </Link>

        <span>/</span>

        <span
          className="truncate"
          style={{
            color: "var(--text-secondary)",
            maxWidth: "280px",
          }}
        >
          {doc.original_filename}
        </span>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
        style={{
          marginBottom: "2rem",
          alignItems: "flex-start",
        }}
      >
        <div
          className="page-header-left"
          style={{
            minWidth: 0,
          }}
        >
          {/* label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              marginBottom: "0.55rem",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "999px",
                background: "#646cff",
                boxShadow: "0 0 16px #646cff",
              }}
            />

            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8b93ff",
              }}
            >
              Document Intelligence
            </span>
          </div>

          <h1
            className="truncate"
            style={{
              maxWidth: "720px",
              fontSize: "2.4rem",
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
            }}
          >
            {doc.original_filename}
          </h1>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: "0.9rem",
            }}
          >
            {doc.job && (
              <StatusBadge status={doc.job.status} />
            )}

            {doc.is_finalized && (
              <span
                className="badge"
                style={{
                  background:
                    "rgba(34,212,110,0.12)",
                  color: "var(--success)",
                  border:
                    "1px solid rgba(34,212,110,0.18)",
                }}
              >
                ✓ Finalized
              </span>
            )}

            <span
              style={{
                fontSize: "0.76rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              {formatBytes(doc.file_size)} ·{" "}
              {doc.file_type}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          {isFailed && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-secondary"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <div
                  className="spinner"
                  style={{
                    width: 14,
                    height: 14,
                  }}
                />
              ) : (
                "⟳"
              )}

              Retry
            </motion.button>
          )}

          {isComplete &&
            hasData &&
            !doc.is_finalized &&
            !editMode && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-secondary"
                onClick={() => setEditMode(true)}
              >
                ✎ Edit
              </motion.button>
            )}

          {editMode && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.985 }}
                className="btn"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background:
                    "linear-gradient(135deg, #646cff 0%, #8b5cf6 100%)",
                  color: "#fff",
                  border: "none",
                  boxShadow:
                    "0 8px 24px rgba(100,108,255,0.25)",
                }}
              >
                {saving ? (
                  <div
                    className="spinner"
                    style={{
                      width: 14,
                      height: 14,
                      borderTopColor: "#fff",
                    }}
                  />
                ) : null}

                Save Changes
              </motion.button>
            </>
          )}

          {isComplete &&
            hasData &&
            !doc.is_finalized &&
            !editMode && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.985 }}
                className="btn"
                onClick={handleFinalize}
                disabled={finalizing}
                style={{
                  background:
                    "linear-gradient(135deg, #646cff 0%, #8b5cf6 100%)",
                  color: "#fff",
                  border: "none",
                  boxShadow:
                    "0 8px 24px rgba(100,108,255,0.25)",
                }}
              >
                {finalizing ? (
                  <div
                    className="spinner"
                    style={{
                      width: 14,
                      height: 14,
                      borderTopColor: "#fff",
                    }}
                  />
                ) : (
                  "✓"
                )}

                Finalize
              </motion.button>
            )}

          {isComplete && hasData && (
            <>
              <a
                href={api.exportUrl(doc.id, "json")}
                download
                className="btn btn-secondary"
              >
                ↓ JSON
              </a>

              <a
                href={api.exportUrl(doc.id, "csv")}
                download
                className="btn btn-secondary"
              >
                ↓ CSV
              </a>
            </>
          )}

          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <div
                className="spinner"
                style={{
                  width: 12,
                  height: 12,
                }}
              />
            ) : (
              "✕"
            )}

            Delete
          </button>
        </div>
      </motion.div>

      {/* Main grid */}
      <div
        className="grid-2"
        style={{
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{
              background:
                "rgba(19,19,31,0.72)",
              backdropFilter: "blur(18px)",
              border:
                "1px solid rgba(255,255,255,0.06)",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.26)",
            }}
          >
            <h2
              style={{
                marginBottom: "1.25rem",
              }}
            >
              Document Info
            </h2>

            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.7rem 1.6rem",
              }}
            >
              {[
                [
                  "Document ID",
                  <span
                    key={0}
                    className="font-mono"
                    style={{
                      fontSize: "0.75rem",
                    }}
                  >
                    {doc.id}
                  </span>,
                ],

                [
                  "Filename",
                  doc.original_filename,
                ],

                ["Type", doc.file_type],

                [
                  "Size",
                  formatBytes(doc.file_size),
                ],

                [
                  "Uploaded",
                  formatDate(
                    doc.upload_timestamp
                  ),
                ],

                [
                  "Job ID",
                  doc.job ? (
                    <span
                      key={1}
                      className="font-mono"
                      style={{
                        fontSize: "0.75rem",
                      }}
                    >
                      {doc.job.id}
                    </span>
                  ) : (
                    "—"
                  ),
                ],

                [
                  "Retry Count",
                  doc.job?.retry_count ?? 0,
                ],

                [
                  "Started",
                  doc.job?.started_at
                    ? formatDate(
                        doc.job.started_at
                      )
                    : "—",
                ],

                [
                  "Completed",
                  doc.job?.completed_at
                    ? formatDate(
                        doc.job.completed_at
                      )
                    : "—",
                ],
              ].map(([label, value], i) => (
                <>
                  <dt
                    key={`dt-${i}`}
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {label}
                  </dt>

                  <dd
                    key={`dd-${i}`}
                    style={{
                      fontSize: "0.86rem",
                      color:
                        "var(--text-secondary)",
                    }}
                  >
                    {value}
                  </dd>
                </>
              ))}
            </dl>
          </motion.div>

          {/* Progress */}
          {(isProcessing || isFailed) &&
            doc.job && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 14,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.18,
                }}
                className="card"
                style={{
                  background:
                    "rgba(19,19,31,0.72)",
                  backdropFilter:
                    "blur(18px)",
                  border:
                    "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h2
                  style={{
                    marginBottom: "1rem",
                  }}
                >
                  {isProcessing
                    ? "Live Progress"
                    : "Job Status"}
                </h2>

                {isProcessing ? (
                  <ProgressTracker
                    jobId={doc.job.id}
                    onComplete={fetchDoc}
                  />
                ) : (
                  <div>
                    <div className="alert alert-danger">
                      ✕{" "}
                      {doc.job.error_message ??
                        "Job failed without error message"}
                    </div>

                    <p
                      style={{
                        marginTop: "0.75rem",
                        fontSize: "0.84rem",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      Retry count:{" "}
                      {doc.job.retry_count}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
        </div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="card"
          style={{
            background:
              "rgba(19,19,31,0.72)",
            backdropFilter: "blur(18px)",
            border:
              "1px solid rgba(255,255,255,0.06)",
            boxShadow:
              "0 10px 40px rgba(0,0,0,0.26)",
          }}
        >
          <h2
            style={{
              marginBottom: "1.2rem",
            }}
          >
            Extracted Data
          </h2>

          {/* Empty states */}
          {!hasData && !isProcessing && (
            <div
              className="empty-state"
              style={{
                padding: "2rem 0",
              }}
            >
              <div
                className="empty-icon"
                style={{
                  fontSize: "2.5rem",
                }}
              >
                ✦
              </div>

              <div className="empty-title">
                No extracted data yet
              </div>

              <div className="empty-desc">
                {isFailed
                  ? "Processing failed. Retry the job to continue."
                  : "Process a document to see extracted information here."}
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && !hasData && (
            <div
              className="empty-state"
              style={{
                padding: "2rem 0",
              }}
            >
              <div
                className="spinner"
                style={{
                  width: 24,
                  height: 24,
                  marginBottom: "0.5rem",
                }}
              />

              <div className="empty-title">
                Processing…
              </div>

              <div className="empty-desc">
                Extracted data will appear
                once processing completes.
              </div>
            </div>
          )}

          {/* Save error */}
          {saveError && (
            <div
              className="alert alert-danger"
              style={{
                marginBottom: "1rem",
                fontSize: "0.8rem",
              }}
            >
              ✕ {saveError}
            </div>
          )}

          {/* Data */}
          {hasData && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.4rem",
              }}
            >
              {/* Title */}
              <Field
                label="Title"
                editMode={editMode}
                input={
                  <input
                    className="input"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                  />
                }
                display={
                  <p
                    style={{
                      fontWeight: 500,
                      color:
                        "var(--text-primary)",
                    }}
                  >
                    {doc.extracted_data!
                      .title ?? "—"}
                  </p>
                }
              />

              {/* Category */}
              <Field
                label="Category"
                editMode={editMode}
                input={
                  <input
                    className="input"
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value
                      )
                    }
                  />
                }
                display={
                  <span
                    className="badge"
                    style={{
                      background:
                        "rgba(100,108,255,0.12)",
                      color: "#aab0ff",
                      border:
                        "1px solid rgba(100,108,255,0.14)",
                    }}
                  >
                    {doc.extracted_data!
                      .category ?? "—"}
                  </span>
                }
              />

              {/* Summary */}
              <Field
                label="Summary"
                editMode={editMode}
                input={
                  <textarea
                    className="input"
                    value={summary}
                    onChange={(e) =>
                      setSummary(
                        e.target.value
                      )
                    }
                    rows={5}
                  />
                }
                display={
                  <p
                    style={{
                      fontSize: "0.88rem",
                      color:
                        "var(--text-secondary)",
                      lineHeight: 1.75,
                    }}
                  >
                    {doc.extracted_data!
                      .summary ?? "—"}
                  </p>
                }
              />

              {/* Keywords */}
              <Field
                label="Keywords"
                editMode={editMode}
                input={
                  <input
                    className="input"
                    value={keywords}
                    onChange={(e) =>
                      setKeywords(
                        e.target.value
                      )
                    }
                    placeholder="Comma-separated keywords"
                  />
                }
                display={
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.45rem",
                    }}
                  >
                    {(
                      doc.extracted_data!
                        .keywords ?? []
                    ).map((kw, i) => (
                      <span
                        key={i}
                        className="tag"
                        style={{
                          background:
                            "rgba(255,255,255,0.03)",
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                }
              />

              {/* timestamp */}
              {doc.extracted_data && (
                <p
                  style={{
                    fontSize: "0.72rem",
                    color:
                      "var(--text-muted)",
                    marginTop: "0.3rem",
                  }}
                >
                  Last updated:{" "}
                  {formatDate(
                    doc.extracted_data
                      .updated_at
                  )}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  editMode,
  input,
  display,
}: {
  label: string;
  editMode: boolean;
  input: React.ReactNode;
  display: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: "0.74rem",
          color: "var(--text-muted)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "block",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </label>

      {editMode ? input : display}
    </div>
  );
}