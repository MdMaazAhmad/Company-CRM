// src/components/tasks/task-list.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setTaskStatus, deleteTask } from "@/lib/task-actions";
import { TASK_STATUSES, taskStatusLabel, taskStatusColor } from "@/lib/task-status";
import { taskPriorityColor, taskPriorityLabel } from "@/lib/task-priority";
import { fmtDate } from "@/lib/ui";
import { Pencil, Trash2, Clock, MessageSquare } from "lucide-react";
import { TaskDialog } from "@/components/tasks/task-dialog";

type Member = { id: string; name: string; avatarColor: string; role: string };
type Task = any;

export function TaskListView({
  projectId,
  tasks,
  members,
  me,
}: {
  projectId: string;
  tasks: Task[];
  members: Member[];
  me: { id: string; role: string; isSuperAdmin: boolean };
}) {
  const [editing, setEditing] = useState<Task | null>(null);

  const grouped = TASK_STATUSES.map((s) => ({
    status: s,
    items: tasks.filter((t) => t.status === s),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map((g) => (
        <div key={g.status}>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: taskStatusColor(g.status) }} />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{taskStatusLabel(g.status)}</span>
            <span className="text-xs text-faint">{g.items.length}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            {g.items.map((t) => (
              <TaskRow key={t.id} task={t} projectId={projectId} me={me} onEdit={() => setEditing(t)} />
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <TaskDialog projectId={projectId} members={members} task={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function TaskRow({
  task,
  projectId,
  me,
  onEdit,
}: {
  task: Task;
  projectId: string;
  me: { id: string; role: string; isSuperAdmin: boolean };
  onEdit: () => void;
}) {
  const [pending, start] = useTransition();

  const canEdit =
    me.isSuperAdmin || me.role === "OWNER" || me.role === "ADMIN" ||
    task.assigneeId === me.id || task.reporterId === me.id;

  function changeStatus(status: string) {
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("status", status);
    start(async () => {
      try { await setTaskStatus(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }

  function remove() {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    const fd = new FormData();
    fd.set("taskId", task.id);
    start(async () => {
      try { await deleteTask(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }

  const overdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <div
      className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0 hover:bg-line-soft/60"
      style={{ boxShadow: `inset 3px 0 0 ${taskStatusColor(task.status)}` }}
    >
      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: taskPriorityColor(task.priority) }} title={taskPriorityLabel(task.priority)} />

      <div className="min-w-0 flex-1">
        <Link href={`/projects/${projectId}/tasks/${task.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand">
          {task.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-faint">
          {task.dueDate && <span className={overdue ? "text-red-600" : ""}>{fmtDate(task.dueDate)}</span>}
          {task._count?.comments > 0 && <span className="inline-flex items-center gap-1"><MessageSquare size={11} /> {task._count.comments}</span>}
          {task._count?.timeLogs > 0 && <span className="inline-flex items-center gap-1"><Clock size={11} /> {task._count.timeLogs}</span>}
        </div>
      </div>

      {task.assignee ? (
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: task.assignee.avatarColor }} title={task.assignee.name}>
          {task.assignee.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
      ) : (
        <div className="h-6 w-6 flex-shrink-0 rounded-full border border-dashed border-line" title="Unassigned" />
      )}

      <select
        value={task.status}
        onChange={(e) => changeStatus(e.target.value)}
        disabled={!canEdit || pending}
        className="flex-shrink-0 rounded-md border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand disabled:opacity-60"
      >
        {TASK_STATUSES.map((s) => <option key={s} value={s}>{taskStatusLabel(s)}</option>)}
      </select>

      {canEdit && (
        <div className="flex flex-shrink-0 items-center gap-0.5">
          <button onClick={onEdit} className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" title="Edit"><Pencil size={14} /></button>
          <button onClick={remove} disabled={pending} className="rounded-md p-1.5 text-muted hover:bg-line hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
}