"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import { api, type DocumentListItem } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth-context";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("upload_timestamp");
  const [order, setOrder] = useState("desc");
  const [offset, setOffset] = useState(0);

  const LIMIT = 20;

  const fetchDocs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.listDocuments({
        search: search || undefined,
        status: status || undefined,
        sort_by: sortBy,
        order,
        limit: LIMIT,
        offset,
      });

      setDocs(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, status, sortBy, order, offset, user]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Auto refresh
  useEffect(() => {
    const hasActive = docs.some(
      (d) =>
        d.job?.status === "processing" ||
        d.job?.status === "queued"
    );

    if (!hasActive) return;

    const t = setInterval(fetchDocs, 4000);

    return () => clearInterval(t);
  }, [docs, fetchDocs]);

  const stats = {
    total,
    processing: docs.filter((d) => d.job?.status === "processing").length,
    completed: docs.filter((d) => d.job?.status === "completed").length,
    failed: docs.filter((d) => d.job?.status === "failed").length,
  };

  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

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
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "-160px",
          left: "-100px",
          width: "260px",
          height: "260px",
          borderRadius: "999px",
          background: "rgba(168,85,247,0.10)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-header"
        style={{
          marginBottom: "2rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div className="page-header-left">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "0.45rem",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background: "#22d46e",
                boxShadow: "0 0 16px #22d46e",
              }}
            />

            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#8b93ff",
              }}
            >
              Operations Dashboard
            </span>
          </div>

          <h1
            style={{
              fontSize: "2.6rem",
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
            }}
          >
            Document Control
          </h1>

          <span
            className="page-subtitle"
            style={{
              maxWidth: "560px",
              lineHeight: 1.7,
            }}
          >
            Monitor uploads, processing pipelines, finalized records,
            and workflow activity across your workspace.
          </span>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.985 }}
        >
          <Link
            href="/upload"
            className="btn"
            style={{
              height: "48px",
              paddingInline: "1.2rem",
              borderRadius: "16px",
              background:
                "linear-gradient(135deg, #646cff 0%, #7c5cff 45%, #8b5cf6 100%)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 10px 30px rgba(100,108,255,0.28)",
              fontWeight: 700,
            }}
          >
            ↑ Upload Documents
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div
        className="grid-4"
        style={{
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "Total Documents",
            value: stats.total,
            color: "var(--text-primary)",
          },
          {
            label: "Processing",
            value: stats.processing,
            color: "var(--info)",
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "var(--success)",
          },
          {
            label: "Failed",
            value: stats.failed,
            color: "var(--danger)",
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.06,
            }}
            whileHover={{
              y: -4,
            }}
            className="stat-card"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow:
                "0 8px 30px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(100,108,255,0.06), transparent 45%)",
                pointerEvents: "none",
              }}
            />

            <span className="stat-label">
              {item.label}
            </span>

            <span
              className="stat-value"
              style={{
                color: item.color,
              }}
            >
              {item.value}
            </span>

            <span className="stat-sub">
              Live workspace metrics
            </span>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card"
        style={{
          marginBottom: "1.2rem",
          background: "rgba(19,19,31,0.72)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: "240px",
            }}
          >
            <input
              className="input"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                height: "46px",
              }}
            />
          </div>

          <select
            className="select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            className="select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="upload_timestamp">
              Date uploaded
            </option>
            <option value="original_filename">
              Filename
            </option>
            <option value="file_size">
              File size
            </option>
          </select>

          <select
            className="select"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>

          <button
            className="btn btn-secondary"
            onClick={fetchDocs}
            style={{
              height: "46px",
              borderRadius: "14px",
            }}
          >
            ⟳ Refresh
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          background: "rgba(19,19,31,0.72)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.28)",
        }}
      >
        {/* Error */}
        {error && (
          <div
            className="alert alert-danger"
            style={{
              margin: "1rem",
            }}
          >
            Failed to load documents: {error}
          </div>
        )}

        {/* Empty states */}
        {loading && docs.length === 0 ? (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div
              className="empty-icon"
              style={{
                fontSize: "3rem",
              }}
            >
              ✦
            </div>

            <div className="empty-title">
              No documents found
            </div>

            <div className="empty-desc">
              {search || status
                ? "Try adjusting your filters."
                : "Upload your first document to start processing workflows."}
            </div>

            <Link
              href="/upload"
              className="btn"
              style={{
                marginTop: "0.5rem",
                background:
                  "linear-gradient(135deg, #646cff 0%, #8b5cf6 100%)",
                color: "#fff",
                border: "none",
              }}
            >
              Upload now
            </Link>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Stage</th>
                    <th>Uploaded</th>
                    <th>Finalized</th>
                  </tr>
                </thead>

                <tbody>
                  {docs.map((doc) => (
                    <motion.tr
                      key={doc.id}
                      whileHover={{
                        backgroundColor:
                          "rgba(255,255,255,0.03)",
                      }}
                      onClick={() =>
                        router.push(`/documents/${doc.id}`)
                      }
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <td
                        style={{
                          maxWidth: "260px",
                        }}
                      >
                        <span
                          className="truncate"
                          style={{
                            display: "block",
                            color: "#f3f4ff",
                          }}
                        >
                          {doc.original_filename}
                        </span>
                      </td>

                      <td>
                        <span
                          className="tag"
                          style={{
                            background:
                              "rgba(100,108,255,0.08)",
                            border:
                              "1px solid rgba(100,108,255,0.14)",
                            color: "#aab0ff",
                          }}
                        >
                          {doc.file_type.split("/")[1] ??
                            doc.file_type}
                        </span>
                      </td>

                      <td>{formatBytes(doc.file_size)}</td>

                      <td>
                        {doc.job ? (
                          <StatusBadge
                            status={doc.job.status}
                          />
                        ) : (
                          <span className="text-muted text-xs">
                            —
                          </span>
                        )}
                      </td>

                      <td
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {doc.job?.current_stage?.replace(
                          /_/g,
                          " "
                        ) ?? "—"}
                      </td>

                      <td
                        style={{
                          fontSize: "0.8rem",
                        }}
                      >
                        {formatDate(doc.upload_timestamp)}
                      </td>

                      <td>
                        {doc.is_finalized ? (
                          <span
                            style={{
                              color: "var(--success)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            ✓ Yes
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "0.8rem",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.2rem",
                  borderTop:
                    "1px solid rgba(255,255,255,0.06)",
                  background:
                    "rgba(255,255,255,0.015)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Showing {offset + 1}–
                  {Math.min(offset + LIMIT, total)} of{" "}
                  {total}
                </span>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={offset === 0}
                    onClick={() =>
                      setOffset(Math.max(0, offset - LIMIT))
                    }
                  >
                    ← Prev
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={offset + LIMIT >= total}
                    onClick={() =>
                      setOffset(offset + LIMIT)
                    }
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}