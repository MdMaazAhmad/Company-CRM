// src/components/tasks/project-activity-feed.tsx
"use client";

import Link from "next/link";
import { fmtDate } from "@/lib/ui";
import { taskStatusLabel } from "@/lib/task-status";
import { taskPriorityLabel } from "@/lib/task-priority";

type Activity = any;

function describe(a: Activity): string {
  switch (a.type) {
    case "CREATED": return "created this task";
    case "STATUS_CHANGED": return `moved ${taskStatusLabel(a.fromValue)} → ${taskStatusLabel(a.toValue)}`;
    case "PRIORITY_CHANGED": return `changed priority ${taskPriorityLabel(a.fromValue)} → ${taskPriorityLabel(a.toValue)}`;
    case "ASSIGNED": return a.toValue ? "reassigned the task" : "unassigned the task";
    case "DUE_CHANGED": return "changed the due date";
    case "TITLE_CHANGED": return "renamed the task";
    case "COMMENTED": return "commented";
    case "LOGGED_TIME": return `logged ${a.toValue}h`;
    default: return a.type.toLowerCase().replace(/_/g, " ");
  }
}

export function ProjectActivityFeed({ activity }: { activity: Activity[] }) {
  if (!activity.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      {activity.map((a) => (
        <div key={a.id} className="flex items-start gap-3 border-b border-line-soft px-4 py-3 last:border-0">
          <div
            className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ background: a.user?.avatarColor ?? "#94A3B8" }}
          >
            {(a.user?.name ?? "?").split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <span className="font-medium text-ink">{a.user?.name ?? "Someone"}</span>{" "}
            <span className="text-muted">{describe(a)}</span>{" "}
            {a.task && (
              <Link href={`/projects/${a.task.id ? "" : ""}`} className="text-faint">
                {/* task link resolved at detail level; show title inline */}
              </Link>
            )}
            <span className="text-faint"> · {a.task?.title}</span>
            {a.type === "COMMENTED" && a.note && (
              <div className="mt-1 rounded-lg bg-line-soft px-3 py-1.5 text-xs text-muted">{a.note}</div>
            )}
            <div className="mt-0.5 text-xs text-faint">{fmtDate(a.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}