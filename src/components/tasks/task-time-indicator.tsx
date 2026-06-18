// src/components/tasks/task-time-indicator.tsx
"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { computeTaskTime, fmtDuration } from "@/lib/task-time";
import type { TaskTimeState } from "@/lib/task-time";

const PRESENTATION: Record<
  TaskTimeState,
  { label: string; bg: string; fg: string; bar: string }
> = {
  not_started: { label: "Not started", bg: "#F1EFE8", fg: "#5F5E5A", bar: "#B4B2A9" },
  no_estimate: { label: "No estimate", bg: "#F1EFE8", fg: "#5F5E5A", bar: "#888780" },
  on_track:    { label: "On track",    bg: "#E6F1FB", fg: "#185FA5", bar: "#378ADD" },
  due_soon:    { label: "Due soon",    bg: "#FAEEDA", fg: "#854F0B", bar: "#EF9F27" },
  overdue:     { label: "Overdue",     bg: "#FCEBEB", fg: "#A32D2D", bar: "#E24B4A" },
  done_early:  { label: "Done on time",bg: "#E1F5EE", fg: "#0F6E56", bar: "#1D9E75" },
  done_late:   { label: "Done late",   bg: "#FCEBEB", fg: "#A32D2D", bar: "#E24B4A" },
};

export function TaskTimeIndicator({
  task,
}: {
  task: { startedAt?: string | null; completedAt?: string | null; estimateHours?: number | null };
}) {
  // Re-render every 30s so a running countdown stays live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (task.completedAt || !task.startedAt) return; // nothing ticking
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [task.startedAt, task.completedAt]);

  const t = computeTaskTime(task, now);
  const p = PRESENTATION[t.state];

  const pct =
    t.estimateMin > 0
      ? Math.min(100, Math.max(0, Math.round((t.elapsedMin / t.estimateMin) * 100)))
      : 0;

  // Pick the right secondary line per state.
  let detail: { label: string; value: string; strong?: boolean } | null = null;
  if (t.state === "on_track" || t.state === "due_soon") {
    detail = { label: "Remaining", value: fmtDuration(t.remainingMin), strong: t.state === "due_soon" };
  } else if (t.state === "overdue") {
    detail = { label: "Over by", value: fmtDuration(-t.remainingMin), strong: true };
  } else if (t.state === "done_early") {
    detail = t.deltaMin > 0 ? { label: "Finished early", value: fmtDuration(t.deltaMin) } : { label: "Finished", value: "on time" };
  } else if (t.state === "done_late") {
    detail = { label: "Finished late", value: fmtDuration(-t.deltaMin), strong: true };
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-faint">Time tracking</span>
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
          style={{ background: p.bg, color: p.fg }}
        >
          {p.label}
        </span>
      </div>

      {t.estimateMin > 0 && t.state !== "not_started" && (
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: p.bar }}
          />
        </div>
      )}

      <div className="space-y-1 text-sm">
        <Row label="Estimate" value={t.estimateMin > 0 ? fmtDuration(t.estimateMin) : "—"} />
        {t.state !== "not_started" && (
          <Row
            label="Elapsed"
            value={
              <span className="inline-flex items-center gap-1">
                <Clock size={13} className="text-faint" /> {fmtDuration(t.elapsedMin)}
              </span>
            }
          />
        )}
        {detail && (
          <Row
            label={detail.label}
            value={detail.value}
            valueClass={detail.strong ? "font-semibold" : ""}
            valueStyle={detail.strong ? { color: p.fg } : undefined}
          />
        )}
      </div>

      {t.state === "not_started" && (
        <p className="mt-2 text-xs text-faint">Clock starts when the task moves to In Progress.</p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "",
  valueStyle,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-faint">{label}</span>
      <span className={`text-ink ${valueClass}`} style={valueStyle}>{value}</span>
    </div>
  );
}