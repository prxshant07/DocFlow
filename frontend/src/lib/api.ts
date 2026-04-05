const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  upload_timestamp: string;
  is_finalized: boolean;
  job?: Job;
  extracted_data?: ExtractedData;
}

export interface DocumentListItem {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  upload_timestamp: string;
  is_finalized: boolean;
  job?: Job;
}

export interface Job {
  id: string;
  document_id: string;
  celery_task_id?: string;
  status: "queued" | "processing" | "completed" | "failed";
  current_stage?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
}

export interface ExtractedData {
  id: string;
  document_id: string;
  title?: string;
  category?: string;
  summary?: string;
  keywords?: string[];
  raw_json?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProgressEvent {
  job_id: string;
  document_id: string;
  status: string;
  stage?: string;
  message: string;
  progress_pct: number;
  timestamp: string;
  error?: string;
}

export interface DocumentListResponse {
  items: DocumentListItem[];
  total: number;
  limit: number;
  offset: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const api = {
  // Upload
  upload: async (files: File[]): Promise<Document[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  // Documents
  listDocuments: (params: {
    search?: string;
    status?: string;
    sort_by?: string;
    order?: string;
    limit?: number;
    offset?: number;
  }): Promise<DocumentListResponse> => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return request(`/documents?${q}`);
  },

  getDocument: (id: string): Promise<Document> =>
    request(`/documents/${id}`),

  updateExtracted: (id: string, data: Partial<ExtractedData>): Promise<ExtractedData> =>
    request(`/documents/${id}/extracted`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  finalize: (id: string): Promise<Document> =>
    request(`/finalize/${id}`, { method: "POST" }),

  retry: (id: string): Promise<Job> =>
    request(`/retry/${id}`, { method: "POST" }),

  deleteDocument: (id: string): Promise<void> =>
    request(`/documents/${id}`, { method: "DELETE" }),

  // Export
  exportUrl: (id: string, format: "json" | "csv") =>
    `${API_BASE}/export/${id}?format=${format}`,

  // SSE progress stream
  subscribeProgress: (jobId: string, onEvent: (e: ProgressEvent) => void, onClose: () => void): EventSource => {
    const es = new EventSource(`${API_BASE}/progress/${jobId}`);
    es.onmessage = (e) => {
      const data: ProgressEvent = JSON.parse(e.data);
      if (data.status === "stream_closed") {
        es.close();
        onClose();
        return;
      }
      onEvent(data);
      if (data.status === "job_completed" || data.status === "job_failed") {
        setTimeout(() => { es.close(); onClose(); }, 500);
      }
    };
    es.onerror = () => { es.close(); onClose(); };
    return es;
  },
};
