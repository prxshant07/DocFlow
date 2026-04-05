"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type DocumentListItem } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("upload_timestamp");
  const [order, setOrder] = useState("desc");
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const fetchDocs = useCallback(async () => {
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
  }, [search, status, sortBy, order, offset]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Auto-refresh when there are processing jobs
  useEffect(() => {
    const hasActive = docs.some((d) => d.job?.status === "processing" || d.job?.status === "queued");
    if (!hasActive) return;
    const t = setInterval(fetchDocs, 4000);
    return () => clearInterval(t);
  }, [docs, fetchDocs]);

  const stats = {
    total: total,
    processing: docs.filter((d) => d.job?.status === "processing").length,
    completed: docs.filter((d) => d.job?.status === "completed").length,
    failed: docs.filter((d) => d.job?.status === "failed").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <span className="page-subtitle">Manage and monitor document processing jobs</span>
        </div>
        <Link href="/upload" className="btn btn-primary">
          ↑ Upload Documents
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <span className="stat-label">Total Documents</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Processing</span>
          <span className="stat-value" style={{ color: "var(--info)" }}>{stats.processing}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value" style={{ color: "var(--success)" }}>{stats.completed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Failed</span>
          <span className="stat-value" style={{ color: "var(--danger)" }}>{stats.failed}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <input
              className="input"
              placeholder="Search by filename…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
            />
          </div>
          <select
            className="select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
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
            <option value="upload_timestamp">Date uploaded</option>
            <option value="original_filename">Filename</option>
            <option value="file_size">File size</option>
          </select>
          <select
            className="select"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={fetchDocs}>⟳ Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {error && (
          <div className="alert alert-danger" style={{ margin: "1rem" }}>
            Failed to load documents: {error}
          </div>
        )}

        {loading && docs.length === 0 ? (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No documents found</div>
            <div className="empty-desc">
              {search || status ? "Try adjusting your filters." : "Upload your first document to get started."}
            </div>
            <Link href="/upload" className="btn btn-primary btn-sm">Upload now</Link>
          </div>
        ) : (
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
                  <tr key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)}>
                    <td style={{ maxWidth: "240px" }}>
                      <span className="truncate" style={{ display: "block" }}>
                        {doc.original_filename}
                      </span>
                    </td>
                    <td>
                      <span className="tag">{doc.file_type.split("/")[1] ?? doc.file_type}</span>
                    </td>
                    <td>{formatBytes(doc.file_size)}</td>
                    <td>
                      {doc.job ? (
                        <StatusBadge status={doc.job.status} />
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {doc.job?.current_stage?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>{formatDate(doc.upload_timestamp)}</td>
                    <td>
                      {doc.is_finalized ? (
                        <span style={{ color: "var(--success)", fontSize: "0.8rem" }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.875rem 1rem", borderTop: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              >
                ← Prev
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={offset + LIMIT >= total}
                onClick={() => setOffset(offset + LIMIT)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
