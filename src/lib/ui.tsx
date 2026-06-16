// src/lib/ui.tsx — shared bits used across the rebuilt pages.

import { STATUS_META, type Status } from "@/lib/status";

// High-contrast pipeline palette (matches the dashboard rail).
export const RAIL_COLORS: Record<string, string> = {
  NEW: "#2563EB",
  CONTACTED: "#06B6D4",
  FOLLOW_UP: "#F59E0B",
  QUOTED: "#FF6B00",
  NEGOTIATING: "#DB2777",
  CONVERTED: "#16A34A",
  DROPPED: "#94A3B8",
};

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

export const inr = (n: number | null | undefined) =>
  n == null ? "—" : "₹" + n.toLocaleString("en-IN");

export function fmtDate(iso: string | Date | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// A pill badge driven by a hex color.
export function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

export function statusLabel(status: string) {
  return STATUS_META[status as Status]?.label ?? status;
}