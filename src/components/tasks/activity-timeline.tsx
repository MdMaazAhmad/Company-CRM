// src/components/tasks/activity-timeline.tsx
"use client";

import { fmtDate } from "@/lib/ui";
import { taskStatusLabel } from "@/lib/task-status";
import { taskPriorityLabel } from "@/lib/task-priority";

function initials(n?: string | null) {
  if (!n) return "?";
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function describe(a: any): string {
  switch (a.type) {
    case "CREATED": return "created the task";
    case "STATUS_CHANGED": return `${taskStatusLabel(a.fromValue)} → ${taskStatusLabel(a.toValue)}`;
    case "PRIORITY_CHANGED": return `priority ${taskPriorityLabel(a.fromValue)} → ${taskPriorityLabel(a.toValue)}`;
    case "ASSIGNED": return a.toValue ? "reassigned" : "unassigned";
    case "DUE_CHANGED": return "changed due date";
    case "TITLE_CHANGED": return "renamed";
    case "COMMENTED": return "commented";
    case "LOGGED_TIME": return `logged ${a.toValue}h`;
    default: return a.type.toLowerCase().replace(/_/g, " ");
  }
}

export function ActivityTimeline({ activities }: { activities: any[] }) {
  if (!activities?.length) return <p className="text-xs text-faint">No activity yet.</p>;

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="flex gap-2 text-xs">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ background: a.user?.avatarColor ?? "#94A3B8" }}>
            {initials(a.user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-medium text-ink">{a.user?.name ?? "Someone"}</span>{" "}
            <span className="text-muted">{describe(a)}</span>
            <div className="text-faint">{fmtDate(a.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}