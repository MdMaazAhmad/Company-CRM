// src/components/tasks/task-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask } from "@/lib/task-actions";
import { TASK_STATUSES, taskStatusLabel } from "@/lib/task-status";
import { TASK_PRIORITIES, taskPriorityLabel } from "@/lib/task-priority";

type Member = { id: string; name: string; avatarColor: string; role: string };
type Task = any;

export function TaskDialog({
  projectId,
  members,
  task,
  onClose,
}: {
  projectId: string;
  members: Member[];
  task: Task | null;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const isEdit = !!task;

  function submit(fd: FormData) {
    setErr(null);
    fd.set("projectId", projectId);
    if (isEdit) fd.set("taskId", task.id);
    start(async () => {
      try {
        if (isEdit) await updateTask(fd);
        else await createTask(fd);
        onClose();
      } catch (e: any) {
        setErr(e?.message ?? "Failed to save task.");
      }
    });
  }

  const due = task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-lg font-bold text-ink">{isEdit ? "Edit task" : "New task"}</h2>
        <form action={submit} className="mt-4 flex flex-col gap-3">
          <Field label="Title">
            <input name="title" defaultValue={task?.title ?? ""} placeholder="What needs doing?" className={inputCls} autoFocus />
          </Field>

          <Field label="Description">
            <textarea name="description" defaultValue={task?.description ?? ""} rows={3} placeholder="Details, links, acceptance criteria…" className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <Field label="Status">
                <select name="status" defaultValue={task?.status ?? "BACKLOG"} className={inputCls}>
                  {TASK_STATUSES.map((s) => <option key={s} value={s}>{taskStatusLabel(s)}</option>)}
                </select>
              </Field>
            )}
            <Field label="Priority">
              <select name="priority" defaultValue={task?.priority ?? "MEDIUM"} className={inputCls}>
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{taskPriorityLabel(p)}</option>)}
              </select>
            </Field>
            <Field label="Assignee">
              <select name="assigneeId" defaultValue={task?.assigneeId ?? ""} className={inputCls}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <input name="dueDate" type="date" defaultValue={due} className={inputCls} />
            </Field>
            <Field label="Estimate (hrs)">
              <input name="estimateHours" type="number" min="0" defaultValue={task?.estimateHours ?? ""} placeholder="—" className={inputCls} />
            </Field>
          </div>

          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{err}</div>}

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-line">Cancel</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand w-full";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}