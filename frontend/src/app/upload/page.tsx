"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type Document } from "@/lib/api";
import { ProgressTracker } from "@/components/progress/ProgressTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface UploadItem {
  file: File;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  document?: Document;
  error?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const updateItem = useCallback((index: number, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = (files: File[]) => {
    const newItems: UploadItem[] = files.map((file) => ({ file, status: "pending" }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) addFiles(files);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) addFiles(files);
  };

  const handleUpload = async () => {
    const pending = items.filter((i) => i.status === "pending");
    if (!pending.length) return;

    setUploading(true);

    // Upload all pending files in one batch request
    const pendingIndices = items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => item.status === "pending");

    pendingIndices.forEach(({ i }) => updateItem(i, { status: "uploading" }));

    try {
      const docs = await api.upload(pendingIndices.map(({ item }) => item.file));

      docs.forEach((doc, di) => {
        const { i } = pendingIndices[di];
        updateItem(i, { status: "processing", document: doc });
      });
    } catch (e: any) {
      pendingIndices.forEach(({ i }) => updateItem(i, { status: "failed", error: e.message }));
    } finally {
      setUploading(false);
    }
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const allDone = items.length > 0 && items.every((i) => i.status === "completed" || i.status === "failed");

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Upload Documents</h1>
          <span className="page-subtitle">Drag and drop files to start async processing</span>
        </div>
        {allDone && (
          <Link href="/dashboard" className="btn btn-primary">
            View Dashboard →
          </Link>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ marginBottom: "1.5rem" }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.5 }}>📂</div>
        <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
          {dragging ? "Drop files here" : "Drop files or click to browse"}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          PDF, DOCX, TXT, CSV and more · Max 50MB per file
        </div>
      </div>

      {/* File list */}
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {items.map((item, i) => (
            <div key={i} className="card">
              {/* File header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: item.document ? "1rem" : 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--radius-sm)",
                  background: "var(--bg-elevated)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "1.25rem",
                }}>
                  📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: "0.15rem" }} className="truncate">
                    {item.file.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem" }}>
                    <span>{formatBytes(item.file.size)}</span>
                    <span>{item.file.type || "unknown type"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {item.status === "uploading" && <div className="spinner" style={{ width: 16, height: 16 }} />}
                  {item.document?.job && <StatusBadge status={item.document.job.status} />}
                  {item.status === "pending" && (
                    <span className="badge badge-queued">Pending</span>
                  )}
                  {(item.status === "pending" || item.status === "failed") && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                    >
                      ✕
                    </button>
                  )}
                  {item.status === "completed" && item.document && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => router.push(`/documents/${item.document!.id}`)}
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>

              {/* Progress tracker for this document */}
              {item.document?.job && (item.status === "processing" || item.status === "completed") && (
                <ProgressTracker
                  jobId={item.document.job.id}
                  onComplete={() => {
                    updateItem(i, {
                      status: "completed",
                      document: { ...item.document!, job: { ...item.document!.job!, status: "completed" } },
                    });
                  }}
                />
              )}

              {item.error && (
                <div className="alert alert-danger" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
                  ✕ {item.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: "#fff" }} /> Uploading…</>
            ) : (
              `↑ Process ${pendingCount} file${pendingCount > 1 ? "s" : ""}`
            )}
          </button>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Files will be processed asynchronously
          </span>
        </div>
      )}

      {allDone && (
        <div className="alert alert-success">
          ✓ All files processed. Review extracted data in the document detail pages.
        </div>
      )}
    </div>
  );
}
