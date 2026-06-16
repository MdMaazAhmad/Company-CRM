
export const PROJECT_STATUSES = [
    "NOT_STARTED",
    "IN_PROGRESS",
    "REVIEW",
    "LIVE",
    "ON_HOLD",
  ] as const;
  
  export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
  
  // ── token-based (kept for backward compatibility) ──
  export const PROJECT_STATUS_META: Record<
    ProjectStatus,
    { label: string; token: string }
  > = {
    NOT_STARTED: { label: "Not started", token: "--color-st-new" },
    IN_PROGRESS: { label: "In progress", token: "--color-st-quoted" },
    REVIEW: { label: "Review", token: "--color-st-negotiating" },
    LIVE: { label: "Live", token: "--color-st-converted" },
    ON_HOLD: { label: "On hold", token: "--color-st-dropped" },
  };
  
  export function projectStatusMeta(status: string) {
    return (
      PROJECT_STATUS_META[status as ProjectStatus] ?? {
        label: status,
        token: "--color-st-new",
      }
    );
  }
  
  // ── hex-based (used by the refactored pages + shared components) ──
  export const PROJECT_STATUS_LABELS: Record<string, string> = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    REVIEW: "Review",
    LIVE: "Live",
    ON_HOLD: "On hold",
  };
  
  export const PROJECT_STATUS_COLORS: Record<string, string> = {
    NOT_STARTED: "#2563EB",
    IN_PROGRESS: "#FF6B00",
    REVIEW: "#DB2777",
    LIVE: "#16A34A",
    ON_HOLD: "#94A3B8",
  };