"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import {
  api,
  type Document,
} from "@/lib/api";

import { ProgressTracker } from "@/components/progress/ProgressTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth-context";

interface UploadItem {
  file: File;
  status:
    | "pending"
    | "uploading"
    | "processing"
    | "completed"
    | "failed";
  document?: Document;
  error?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();

  const { user, isLoading } = useAuth();

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [dragging, setDragging] =
    useState(false);

  const [items, setItems] = useState<
    UploadItem[]
  >([]);

  const [uploading, setUploading] =
    useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const updateItem = useCallback(
    (
      index: number,
      patch: Partial<UploadItem>
    ) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, ...patch }
            : item
        )
      );
    },
    []
  );

  const addFiles = (files: File[]) => {
    const newItems: UploadItem[] =
      files.map((file) => ({
        file,
        status: "pending",
      }));

    setItems((prev) => [
      ...prev,
      ...newItems,
    ]);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      setDragging(false);

      const files = Array.from(
        e.dataTransfer.files
      );

      if (files.length) addFiles(files);
    },
    []
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      e.target.files ?? []
    );

    if (files.length) addFiles(files);
  };

  const handleUpload = async () => {
    const pending = items.filter(
      (i) => i.status === "pending"
    );

    if (!pending.length) return;

    setUploading(true);

    const pendingIndices = items
      .map((item, i) => ({ item, i }))
      .filter(
        ({ item }) =>
          item.status === "pending"
      );

    pendingIndices.forEach(({ i }) =>
      updateItem(i, {
        status: "uploading",
      })
    );

    try {
      const docs = await api.upload(
        pendingIndices.map(
          ({ item }) => item.file
        )
      );

      docs.forEach((doc, di) => {
        const { i } = pendingIndices[di];

        updateItem(i, {
          status: "processing",
          document: doc,
        });
      });
    } catch (e: any) {
      pendingIndices.forEach(({ i }) =>
        updateItem(i, {
          status: "failed",
          error: e.message,
        })
      );
    } finally {
      setUploading(false);
    }
  };

  const removeItem = (index: number) => {
    setItems((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const pendingCount = items.filter(
    (i) => i.status === "pending"
  ).length;

  const allDone =
    items.length > 0 &&
    items.every(
      (i) =>
        i.status === "completed" ||
        i.status === "failed"
    );

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
          right: "-100px",
          width: "320px",
          height: "320px",
          borderRadius: "999px",
          background:
            "rgba(100,108,255,0.12)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "-80px",
          width: "240px",
          height: "240px",
          borderRadius: "999px",
          background:
            "rgba(168,85,247,0.12)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="page-header"
        style={{
          marginBottom: "2rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div className="page-header-left">
          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "999px",
                background: "#646cff",
                boxShadow:
                  "0 0 16px #646cff",
              }}
            />

            <span
              style={{
                fontFamily:
                  "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.14em",
                textTransform:
                  "uppercase",
                color: "#8b93ff",
              }}
            >
              AI Processing Pipeline
            </span>
          </div>

          <h1
            style={{
              fontSize: "2.6rem",
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
            }}
          >
            Upload Documents
          </h1>

          <span
            className="page-subtitle"
            style={{
              maxWidth: "620px",
              lineHeight: 1.7,
            }}
          >
            Upload and process files
            through the intelligent
            extraction and analysis
            workflow.
          </span>
        </div>

        {allDone && (
          <motion.div
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.985,
            }}
          >
            <Link
              href="/dashboard"
              className="btn"
              style={{
                height: "48px",
                paddingInline: "1.2rem",
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, #646cff 0%, #7c5cff 45%, #8b5cf6 100%)",
                color: "#fff",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 10px 30px rgba(100,108,255,0.28)",
                fontWeight: 700,
              }}
            >
              View Dashboard →
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.08,
        }}
        className={`upload-zone ${
          dragging ? "dragging" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() =>
          setDragging(false)
        }
        onDrop={handleDrop}
        onClick={() =>
          inputRef.current?.click()
        }
        style={{
          marginBottom: "1.6rem",
          background:
            dragging
              ? "rgba(100,108,255,0.08)"
              : "rgba(19,19,31,0.55)",
          border:
            dragging
              ? "2px dashed rgba(100,108,255,0.55)"
              : "1px dashed rgba(255,255,255,0.12)",
          backdropFilter: "blur(18px)",
          boxShadow:
            dragging
              ? "0 0 40px rgba(100,108,255,0.16)"
              : "0 8px 30px rgba(0,0,0,0.22)",
          transition: "all 0.22s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Icon */}
        <motion.div
          animate={{
            y: dragging
              ? [-4, 4, -4]
              : [0, -6, 0],
          }}
          transition={{
            duration: dragging ? 1 : 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: "82px",
            height: "82px",
            margin: "0 auto 1.2rem",
            borderRadius: "24px",
            background:
              "linear-gradient(135deg, rgba(100,108,255,0.18), rgba(168,85,247,0.16))",
            border:
              "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            boxShadow:
              "0 0 40px rgba(100,108,255,0.16)",
          }}
        >
          📂
        </motion.div>

        <div
          style={{
            fontWeight: 700,
            fontSize: "1.05rem",
            marginBottom: "0.45rem",
            color: "#f3f4ff",
          }}
        >
          {dragging
            ? "Drop files here"
            : "Drop files or click to browse"}
        </div>

        <div
          style={{
            fontSize: "0.84rem",
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          PDF, DOCX, TXT, CSV and
          more · Maximum 50MB per
          file
        </div>
      </motion.div>

      {/* File list */}
      {items.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            marginBottom: "1.6rem",
          }}
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              whileHover={{
                y: -2,
              }}
              className="card"
              style={{
                background:
                  "rgba(19,19,31,0.72)",
                backdropFilter:
                  "blur(18px)",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.22)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-start",
                  gap: "0.9rem",
                  marginBottom:
                    item.document
                      ? "1rem"
                      : 0,
                }}
              >
                {/* File Icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius:
                      "16px",
                    background:
                      "linear-gradient(135deg, rgba(100,108,255,0.16), rgba(168,85,247,0.12))",
                    border:
                      "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    flexShrink: 0,
                    fontSize: "1.3rem",
                    boxShadow:
                      "0 0 24px rgba(100,108,255,0.08)",
                  }}
                >
                  📄
                </div>

                {/* File info */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom:
                        "0.2rem",
                      color:
                        "#f3f4ff",
                    }}
                    className="truncate"
                  >
                    {item.file.name}
                  </div>

                  <div
                    style={{
                      fontSize:
                        "0.75rem",
                      color:
                        "var(--text-muted)",
                      display: "flex",
                      gap: "0.8rem",
                      flexWrap: "wrap",
                      fontFamily:
                        "var(--font-mono)",
                    }}
                  >
                    <span>
                      {formatBytes(
                        item.file.size
                      )}
                    </span>

                    <span>
                      {item.file.type ||
                        "unknown type"}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    justifyContent:
                      "flex-end",
                  }}
                >
                  {item.status ===
                    "uploading" && (
                    <div
                      className="spinner"
                      style={{
                        width: 16,
                        height: 16,
                      }}
                    />
                  )}

                  {item.document
                    ?.job && (
                    <StatusBadge
                      status={
                        item.document
                          .job.status
                      }
                    />
                  )}

                  {item.status ===
                    "pending" && (
                    <span className="badge badge-queued">
                      Pending
                    </span>
                  )}

                  {(item.status ===
                    "pending" ||
                    item.status ===
                      "failed") && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(
                        e
                      ) => {
                        e.stopPropagation();

                        removeItem(i);
                      }}
                    >
                      ✕
                    </button>
                  )}

                  {item.status ===
                    "completed" &&
                    item.document && (
                      <motion.button
                        whileHover={{
                          scale: 1.03,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          router.push(
                            `/documents/${item.document!.id}`
                          )
                        }
                      >
                        View →
                      </motion.button>
                    )}
                </div>
              </div>

              {/* Progress */}
              {item.document?.job &&
                (item.status ===
                  "processing" ||
                  item.status ===
                    "completed") && (
                  <div
                    style={{
                      marginTop:
                        "0.5rem",
                    }}
                  >
                    <ProgressTracker
                      jobId={
                        item.document.job
                          .id
                      }
                      onComplete={() => {
                        updateItem(i, {
                          status:
                            "completed",

                          document: {
                            ...item.document!,
                            job: {
                              ...item
                                .document!
                                .job!,
                              status:
                                "completed",
                            },
                          },
                        });
                      }}
                    />
                  </div>
                )}

              {/* Error */}
              {item.error && (
                <div
                  className="alert alert-danger"
                  style={{
                    marginTop:
                      "0.9rem",
                    fontSize: "0.8rem",
                  }}
                >
                  ✕ {item.error}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload CTA */}
      {pendingCount > 0 && (
        <motion.div
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <motion.button
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.985,
            }}
            className="btn btn-lg"
            onClick={handleUpload}
            disabled={uploading}
            style={{
              height: "54px",
              borderRadius: "16px",
              background:
                "linear-gradient(135deg, #646cff 0%, #7c5cff 45%, #8b5cf6 100%)",
              color: "#fff",
              border:
                "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 10px 30px rgba(100,108,255,0.28)",
              fontWeight: 700,
            }}
          >
            {uploading ? (
              <>
                <div
                  className="spinner"
                  style={{
                    width: 16,
                    height: 16,
                    borderTopColor:
                      "#fff",
                  }}
                />
                Uploading…
              </>
            ) : (
              <>
                ↑ Process{" "}
                {pendingCount} file
                {pendingCount > 1
                  ? "s"
                  : ""}
              </>
            )}
          </motion.button>

          <span
            style={{
              fontSize: "0.82rem",
              color:
                "var(--text-muted)",
            }}
          >
            Files are processed
            asynchronously through
            the AI extraction
            pipeline.
          </span>
        </motion.div>
      )}

      {/* Success */}
      {allDone && (
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="alert alert-success"
          style={{
            marginTop: "1.4rem",
            background:
              "rgba(34,212,110,0.08)",
            border:
              "1px solid rgba(34,212,110,0.14)",
            boxShadow:
              "0 0 30px rgba(34,212,110,0.06)",
          }}
        >
          ✓ All files processed.
          Review extracted data in
          the document detail pages.
        </motion.div>
      )}
    </div>
  );
}