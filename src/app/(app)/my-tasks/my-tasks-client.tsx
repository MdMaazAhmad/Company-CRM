// src/app/(app)/my-tasks/my-tasks-client.tsx
"use client";

import { useTransition } from "react";
import Link from "next/link";
import { setTaskStatus } from "@/lib/task-actions";
import { TASK_STATUSES, taskStatusLabel, taskStatusColor } from "@/lib/task-status";
import { taskPriorityColor, taskPriorityLabel } from "@/lib/task-priority";
import { fmtDate } from "@/lib/ui";

type Task = any;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketOf(task: Task): "overdue" | "today" | "upcoming" | "none" {
  if (!task.dueDate) return "none";
  const due = startOfDay(new Date(task.dueDate)).getTime();
  const today = startOfDay(new Date()).getTime();
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "upcoming";
}

const BUCKET_META: Record<string, { label: string; color: string }> = {
  overdue: { label: "Overdue", color: "#DC2626" },
  today: { label: "Due today", color: "#F59E0B" },
  upcoming: { label: "Upcoming", color: "#2563EB" },
  none: { label: "No due date", color: "#94A3B8" },
};

export function MyTasksClient({ tasks, meName }: { tasks: Task[]; meName: string }) {
  const order = ["overdue", "today", "upcoming", "none"] as const;
  const groups = order
    .map((b) => ({ bucket: b, items: tasks.filter((t) => bucketOf(t) === b) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-faint">Workspace</div>
        <h1 className="font-heading text-2xl font-bold text-ink">My Tasks</h1>
        <p className="mt-0.5 text-sm text-muted">Open tasks assigned to {meName}, across all projects.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="text-sm text-muted">Nothing assigned to you right now. 🎉</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.bucket}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: BUCKET_META[g.bucket].color }} />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{BUCKET_META[g.bucket].label}</span>
                <span className="text-xs text-faint">{g.items.length}</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                {g.items.map((t) => <Row key={t.id} task={t} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ task }: { task: Task }) {
  const [pending, start] = useTransition();

  function changeStatus(status: string) {
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("status", status);
    start(async () => { try { await setTaskStatus(fd); } catch (e: any) { alert(e?.message ?? "Failed."); } });
  }

  return (
    <div
      className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0 hover:bg-line-soft/60"
      style={{ boxShadow: `inset 3px 0 0 ${taskStatusColor(task.status)}` }}
    >
      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: taskPriorityColor(task.priority) }} title={taskPriorityLabel(task.priority)} />

      <div className="min-w-0 flex-1">
        <Link href={`/projects/${task.project.id}/tasks/${task.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand">
          {task.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-faint">
          <Link href={`/projects/${task.project.id}`} className="hover:text-brand">{task.project.name}</Link>
          {task.dueDate && <span>· {fmtDate(task.dueDate)}</span>}
        </div>
      </div>

      <select
        value={task.status}
        onChange={(e) => changeStatus(e.target.value)}
        disabled={pending}
        className="flex-shrink-0 rounded-md border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand disabled:opacity-60"
      >
        {TASK_STATUSES.map((s) => <option key={s} value={s}>{taskStatusLabel(s)}</option>)}
      </select>
    </div>
  );
}