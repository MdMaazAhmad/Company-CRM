// src/app/(app)/projects/[id]/tasks/[taskId]/task-detail-client.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Send, Plus, Clock } from "lucide-react";
import {
  updateTask,
  deleteTask,
  setTaskStatus,
  addComment,
  deleteComment,
  addTimeLog,
  deleteTimeLog,
} from "@/lib/task-actions";
import { TASK_STATUSES, taskStatusLabel, taskStatusColor } from "@/lib/task-status";
import { TASK_PRIORITIES, taskPriorityLabel, taskPriorityColor } from "@/lib/task-priority";
import { fmtDate } from "@/lib/ui";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { ActivityTimeline } from "@/components/tasks/activity-timeline";
import { TaskTimeIndicator } from "@/components/tasks/task-time-indicator";
type Member = { id: string; name: string; avatarColor: string; role: string };

function initials(n?: string | null) {
  if (!n) return "?";
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function TaskDetailClient({
  projectId,
  task,
  members,
  totalHours,
  me,
  canEdit,
  canComment,
  canLogTime,
}: {
  projectId: string;
  task: any;
  members: Member[];
  totalHours: number;
  me: { id: string; role: string; isSuperAdmin: boolean };
  canEdit: boolean;
  canComment: boolean;
  canLogTime: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();

  function changeStatus(status: string) {
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("status", status);
    start(async () => {
      try { await setTaskStatus(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }

  function remove() {
    if (!confirm(`Delete "${task.title}"? This removes its comments, time logs and history.`)) return;
    const fd = new FormData();
    fd.set("taskId", task.id);
    start(async () => {
      try { await deleteTask(fd); window.location.href = `/projects/${projectId}`; }
      catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> {task.project?.name ?? "Project"}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── main ── */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-heading text-2xl font-bold text-ink">{task.title}</h1>
            {canEdit && (
              <div className="flex flex-shrink-0 gap-1">
                <button onClick={() => setEditing(true)} className="rounded-md p-2 text-muted hover:bg-line hover:text-ink" title="Edit"><Pencil size={16} /></button>
                <button onClick={remove} className="rounded-md p-2 text-muted hover:bg-line hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
              </div>
            )}
          </div>

          {/* description */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Description</div>
            {task.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{task.description}</p>
            ) : (
              <p className="text-sm text-faint">No description.</p>
            )}
          </div>

          {/* comments */}
          <Comments
            task={task}
            canComment={canComment}
            me={me}
          />
        </div>

        {/* ── sidebar ── */}
        <div className="space-y-4">
          {/* status */}
          <SidebarCard label="Status">
            <select
              value={task.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
              style={{ boxShadow: `inset 3px 0 0 ${taskStatusColor(task.status)}` }}
            >
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{taskStatusLabel(s)}</option>)}
            </select>
          </SidebarCard>

          <SidebarCard label="Assignee">
            {task.assignee ? (
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: task.assignee.avatarColor }}>
                  {initials(task.assignee.name)}
                </span>
                <span className="text-sm text-ink">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-faint">Unassigned</span>
            )}
          </SidebarCard>

          <SidebarCard label="Reporter">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: task.reporter?.avatarColor ?? "#94A3B8" }}>
                {initials(task.reporter?.name)}
              </span>
              <span className="text-sm text-ink">{task.reporter?.name ?? "—"}</span>
            </div>
          </SidebarCard>

          <div className="grid grid-cols-2 gap-4">
            <SidebarCard label="Priority">
              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `${taskPriorityColor(task.priority)}1A`, color: taskPriorityColor(task.priority) }}>
                {taskPriorityLabel(task.priority)}
              </span>
            </SidebarCard>
            <SidebarCard label="Due">
              <span className="text-sm text-ink">{task.dueDate ? fmtDate(task.dueDate) : "—"}</span>
            </SidebarCard>
          </div>

          {task.estimateHours != null && (
            <TaskTimeIndicator
            task={{
              startedAt: task.startedAt ?? null,
              completedAt: task.completedAt ?? null,
              estimateHours: task.estimateHours ?? null,
            }}
          />
          )}

          {/* time logs */}
          <TimeLogs task={task} totalHours={totalHours} canLogTime={canLogTime} me={me} />

          {/* activity */}
          <SidebarCard label="Activity">
            <ActivityTimeline activities={task.activities} />
          </SidebarCard>
        </div>
      </div>

      {editing && (
        <TaskDialog projectId={projectId} members={members} task={task} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

// ── Comments ─────────────────────────────────────────────

function Comments({ task, canComment, me }: { task: any; canComment: boolean; me: any }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function post() {
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("body", body);
    start(async () => {
      try { await addComment(fd); setBody(""); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }

  function remove(id: string) {
    const fd = new FormData();
    fd.set("commentId", id);
    start(async () => {
      try { await deleteComment(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }

  const canDelete = (c: any) => c.userId === me.id || me.role === "OWNER" || me.role === "ADMIN" || me.isSuperAdmin;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
        Comments {task.comments.length > 0 && <span className="text-muted">({task.comments.length})</span>}
      </div>

      <div className="space-y-4">
        {task.comments.length === 0 && <p className="text-sm text-faint">No comments yet.</p>}
        {task.comments.map((c: any) => (
          <div key={c.id} className="flex gap-3">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: c.user?.avatarColor ?? "#94A3B8" }}>
              {initials(c.user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{c.user?.name ?? "Someone"}</span>
                <span className="text-xs text-faint">{fmtDate(c.createdAt)}</span>
                {canDelete(c) && (
                  <button onClick={() => remove(c.id)} className="ml-auto text-faint hover:text-red-600" title="Delete"><Trash2 size={12} /></button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {canComment && (
        <div className="mt-4 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), post())}
            placeholder="Write a comment…"
            className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />
          <button onClick={post} disabled={pending || !body.trim()} className="rounded-lg bg-brand px-3 py-2 text-white hover:opacity-90 disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Time logs ────────────────────────────────────────────

function TimeLogs({ task, totalHours, canLogTime, me }: { task: any; totalHours: number; canLogTime: boolean; me: any }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function add(fd: FormData) {
    fd.set("taskId", task.id);
    start(async () => {
      try { await addTimeLog(fd); setOpen(false); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  function remove(id: string) {
    const fd = new FormData();
    fd.set("logId", id);
    start(async () => { try { await deleteTimeLog(fd); } catch (e: any) { alert(e?.message ?? "Failed."); } });
  }
  const canDelete = (l: any) => l.userId === me.id || me.role === "OWNER" || me.role === "ADMIN" || me.isSuperAdmin;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-faint">Time logged</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink"><Clock size={13} /> {totalHours}h</span>
      </div>

      <div className="space-y-2">
        {task.timeLogs.length === 0 && <p className="text-xs text-faint">No time logged.</p>}
        {task.timeLogs.map((l: any) => (
          <div key={l.id} className="flex items-center gap-2 text-xs">
            <span className="font-medium text-ink">{l.hours}h</span>
            <span className="text-faint">{l.user?.name}</span>
            <span className="text-faint">· {fmtDate(l.spentOn)}</span>
            {l.note && <span className="truncate text-muted">— {l.note}</span>}
            {canDelete(l) && (
              <button onClick={() => remove(l.id)} className="ml-auto text-faint hover:text-red-600"><Trash2 size={11} /></button>
            )}
          </div>
        ))}
      </div>

      {canLogTime && (
        open ? (
          <form action={add} className="mt-3 space-y-2 border-t border-line-soft pt-3">
            <div className="grid grid-cols-2 gap-2">
              <input name="hours" type="number" step="0.25" min="0" placeholder="Hours" className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-brand" autoFocus />
              <input name="spentOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-brand" />
            </div>
            <input name="note" placeholder="Note (optional)" className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-brand" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-line">Cancel</button>
              <button type="submit" disabled={pending} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60">Log time</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
            <Plus size={13} /> Log time
          </button>
        )
      )}
    </div>
  );
}

function SidebarCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">{label}</div>
      {children}
    </div>
  );
}