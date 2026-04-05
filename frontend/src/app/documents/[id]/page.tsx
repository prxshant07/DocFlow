"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Document, type ExtractedData } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressTracker } from "@/components/progress/ProgressTracker";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

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
        setKeywords((d.extracted_data.keywords ?? []).join(", "));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  // Poll while job is active
  useEffect(() => {
    if (!doc?.job) return;
    if (doc.job.status === "processing" || doc.job.status === "queued") {
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
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
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
    if (!doc || !confirm(`Delete "${doc.original_filename}"?`)) return;
    setDeleting(true);
    try {
      await api.deleteDocument(doc.id);
      router.push("/dashboard");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="empty-state"><div className="spinner" /></div>
  );

  if (error) return (
    <div className="alert alert-danger" style={{ maxWidth: 500 }}>
      ✕ {error} · <Link href="/dashboard" className="btn btn-ghost btn-sm">Back</Link>
    </div>
  );

  if (!doc) return null;

  const isProcessing = doc.job?.status === "processing" || doc.job?.status === "queued";
  const isFailed = doc.job?.status === "failed";
  const isComplete = doc.job?.status === "completed";
  const hasData = !!doc.extracted_data;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Dashboard</Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }} className="truncate">{doc.original_filename}</span>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left" style={{ minWidth: 0 }}>
          <h1 className="truncate" style={{ maxWidth: "600px" }}>{doc.original_filename}</h1>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            {doc.job && <StatusBadge status={doc.job.status} />}
            {doc.is_finalized && (
              <span className="badge" style={{ background: "rgba(34,197,94,0.15)", color: "var(--success)" }}>
                ✓ Finalized
              </span>
            )}
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {formatBytes(doc.file_size)} · {doc.file_type}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          {isFailed && (
            <button className="btn btn-secondary" onClick={handleRetry} disabled={retrying}>
              {retrying ? <div className="spinner" style={{ width: 14, height: 14 }} /> : "⟳"} Retry
            </button>
          )}
          {isComplete && hasData && !doc.is_finalized && !editMode && (
            <button className="btn btn-secondary" onClick={() => setEditMode(true)}>
              ✎ Edit
            </button>
          )}
          {editMode && (
            <>
              <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} /> : null}
                Save Changes
              </button>
            </>
          )}
          {isComplete && hasData && !doc.is_finalized && !editMode && (
            <button className="btn btn-primary" onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} /> : "✓"} Finalize
            </button>
          )}
          {isComplete && hasData && (
            <>
              <a href={api.exportUrl(doc.id, "json")} download className="btn btn-secondary">
                ↓ JSON
              </a>
              <a href={api.exportUrl(doc.id, "csv")} download className="btn btn-secondary">
                ↓ CSV
              </a>
            </>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <div className="spinner" style={{ width: 12, height: 12 }} /> : "✕"} Delete
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "1.5rem", alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Document metadata */}
          <div className="card">
            <h2 style={{ marginBottom: "1rem" }}>Document Info</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1.5rem" }}>
              {[
                ["Document ID", <span key={0} className="font-mono" style={{ fontSize: "0.75rem" }}>{doc.id}</span>],
                ["Filename", doc.original_filename],
                ["Type", doc.file_type],
                ["Size", formatBytes(doc.file_size)],
                ["Uploaded", formatDate(doc.upload_timestamp)],
                ["Job ID", doc.job ? <span key={1} className="font-mono" style={{ fontSize: "0.75rem" }}>{doc.job.id}</span> : "—"],
                ["Retry count", doc.job?.retry_count ?? 0],
                ["Started", doc.job?.started_at ? formatDate(doc.job.started_at) : "—"],
                ["Completed", doc.job?.completed_at ? formatDate(doc.job.completed_at) : "—"],
              ].map(([label, value], i) => (
                <>
                  <dt key={`dt-${i}`} style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500, paddingTop: "0.1rem" }}>
                    {label}
                  </dt>
                  <dd key={`dd-${i}`} style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {value}
                  </dd>
                </>
              ))}
            </dl>
          </div>

          {/* Live progress */}
          {(isProcessing || isFailed) && doc.job && (
            <div className="card">
              <h2 style={{ marginBottom: "1rem" }}>
                {isProcessing ? "Live Progress" : "Job Status"}
              </h2>
              {isProcessing ? (
                <ProgressTracker
                  jobId={doc.job.id}
                  onComplete={fetchDoc}
                />
              ) : (
                <div>
                  <div className="alert alert-danger">
                    ✕ {doc.job.error_message ?? "Job failed without error message"}
                  </div>
                  <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Retry count: {doc.job.retry_count}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: extracted data */}
        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Extracted Data</h2>

          {!hasData && !isProcessing && (
            <div className="empty-state" style={{ padding: "2rem 0" }}>
              <div className="empty-icon" style={{ fontSize: "2rem" }}>🔍</div>
              <div className="empty-title">No extracted data yet</div>
              <div className="empty-desc">
                {isFailed ? "Processing failed. Try retrying the job." : "Upload and process a document to see extracted data here."}
              </div>
            </div>
          )}

          {isProcessing && !hasData && (
            <div className="empty-state" style={{ padding: "2rem 0" }}>
              <div className="spinner" style={{ width: 24, height: 24, marginBottom: "0.5rem" }} />
              <div className="empty-title">Processing…</div>
              <div className="empty-desc">Extracted data will appear here once ready.</div>
            </div>
          )}

          {saveError && (
            <div className="alert alert-danger" style={{ marginBottom: "1rem", fontSize: "0.8rem" }}>
              ✕ {saveError}
            </div>
          )}

          {hasData && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>
                  Title
                </label>
                {editMode ? (
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
                ) : (
                  <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>{doc.extracted_data!.title ?? "—"}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>
                  Category
                </label>
                {editMode ? (
                  <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
                ) : (
                  <span className="badge badge-processing" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
                    {doc.extracted_data!.category ?? "—"}
                  </span>
                )}
              </div>

              {/* Summary */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>
                  Summary
                </label>
                {editMode ? (
                  <textarea className="input" value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} />
                ) : (
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    {doc.extracted_data!.summary ?? "—"}
                  </p>
                )}
              </div>

              {/* Keywords */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>
                  Keywords
                </label>
                {editMode ? (
                  <input
                    className="input"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Comma-separated keywords"
                  />
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {(doc.extracted_data!.keywords ?? []).map((kw, i) => (
                      <span key={i} className="tag">{kw}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Updated timestamp */}
              {doc.extracted_data && (
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Last updated: {formatDate(doc.extracted_data.updated_at)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
