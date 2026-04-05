import type { Job } from "@/lib/api";

interface Props {
  status: Job["status"];
  size?: "sm" | "md";
}

const config: Record<Job["status"], { label: string; pulse: boolean }> = {
  queued:     { label: "Queued",     pulse: false },
  processing: { label: "Processing", pulse: true },
  completed:  { label: "Completed",  pulse: false },
  failed:     { label: "Failed",     pulse: false },
};

export function StatusBadge({ status, size = "md" }: Props) {
  const { label, pulse } = config[status];
  return (
    <span className={`badge badge-${status}`}>
      <span className={`badge-dot${pulse ? " pulse" : ""}`} />
      {label}
    </span>
  );
}
