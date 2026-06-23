// src/lib/task-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { can, canEditTask, assertCan } from "@/lib/permissions";
import { isTaskStatus, TASK_STATUSES } from "@/lib/task-status";
import { isTaskPriority } from "@/lib/task-priority";
import { revalidatePath } from "next/cache";
import { fdStr, fdInt, fdDate } from "@/lib/form-utils";

// ── helpers ──────────────────────────────────────────────

/** Load a task scoped to the caller's org, or throw NOT_FOUND. */
async function getOwnedTask(taskId: string, orgId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, orgId } });
  if (!task) throw new Error("NOT_FOUND");
  return task;
}

/** Confirm a project belongs to the org (used when creating tasks). */
async function assertProjectInOrg(projectId: string, orgId: string) {
  const p = await prisma.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
  if (!p) throw new Error("NOT_FOUND");
}

/** Write one activity-log row. Called inside the same flow as the change. */
async function logActivity(
  orgId: string,
  taskId: string,
  userId: string,
  type: string,
  fromValue?: string | null,
  toValue?: string | null,
  note?: string | null
) {
  await prisma.taskActivity.create({
    data: { orgId, taskId, userId, type, fromValue: fromValue ?? null, toValue: toValue ?? null, note: note ?? null },
  });
}

// ── create ───────────────────────────────────────────────

export async function createTask(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "create_task");

  const projectId = fdStr(formData,"projectId");
  const title = fdStr(formData,"title");
  if (!projectId || !title) throw new Error("Project and title are required.");
  await assertProjectInOrg(projectId, orgId);

  const status = fdStr(formData,"status") || "BACKLOG";
  const priority = fdStr(formData,"priority") || "MEDIUM";
  if (!isTaskStatus(status)) throw new Error("Invalid status.");
  if (!isTaskPriority(priority)) throw new Error("Invalid priority.");

  let assigneeId: string | null = fdStr(formData,"assigneeId") || null;
  if (assigneeId) {
    // assignee must be an active member of the same org
    const a = await prisma.user.findFirst({ where: { id: assigneeId, orgId, active: true }, select: { id: true } });
    if (!a) throw new Error("Assignee not found in your team.");
  }

  // place new task at the end of its column
  const last = await prisma.task.findFirst({
    where: { orgId, projectId, status },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? -1) + 1;

  const task = await prisma.task.create({
    data: {
      orgId,
      projectId,
      title,
      description: fdStr(formData,"description") || null,
      status,
      priority,
      assigneeId,
      reporterId: user.id,
      dueDate: fdDate(formData,"dueDate"),
      estimateHours: fdInt(formData,"estimateHours"),
      order,
    },
  });

  await logActivity(orgId, task.id, user.id, "CREATED", null, title);
  if (assigneeId) await logActivity(orgId, task.id, user.id, "ASSIGNED", null, assigneeId);

  revalidatePath(`/projects/${projectId}`);
  return task.id;
}

// ── edit core fields ─────────────────────────────────────

export async function updateTask(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const taskId = fdStr(formData,"taskId");
  const task = await getOwnedTask(taskId, orgId);
  if (!canEditTask(user, task, user.id)) throw new Error("FORBIDDEN");

  const title = fdStr(formData,"title");
  if (!title) throw new Error("Title is required.");

  const priority = fdStr(formData,"priority") || task.priority;
  if (!isTaskPriority(priority)) throw new Error("Invalid priority.");

  let assigneeId: string | null = fdStr(formData,"assigneeId") || null;
  if (assigneeId) {
    const a = await prisma.user.findFirst({ where: { id: assigneeId, orgId, active: true }, select: { id: true } });
    if (!a) throw new Error("Assignee not found in your team.");
  }

  const dueDate = fdDate(formData,"dueDate");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: fdStr(formData,"description") || null,
      priority,
      assigneeId,
      dueDate,
      estimateHours: fdInt(formData,"estimateHours"),
    },
  });

  // log meaningful diffs
  if (title !== task.title) await logActivity(orgId, taskId, user.id, "TITLE_CHANGED", task.title, title);
  if (priority !== task.priority) await logActivity(orgId, taskId, user.id, "PRIORITY_CHANGED", task.priority, priority);
  if ((assigneeId ?? null) !== (task.assigneeId ?? null))
    await logActivity(orgId, taskId, user.id, "ASSIGNED", task.assigneeId, assigneeId);
  const oldDue = task.dueDate ? task.dueDate.toISOString() : null;
  const newDue = dueDate ? dueDate.toISOString() : null;
  if (oldDue !== newDue) await logActivity(orgId, taskId, user.id, "DUE_CHANGED", oldDue, newDue);

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
}

// ── status change (board drag / inline select) ───────────

export async function setTaskStatus(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const taskId = fdStr(formData,"taskId");
  const status = fdStr(formData,"status");
  if (!isTaskStatus(status)) throw new Error("Invalid status.");

  const task = await getOwnedTask(taskId, orgId);
  if (!canEditTask(user, task, user.id)) throw new Error("FORBIDDEN");
  if (status === task.status) return;

  // append to the end of the destination column
  const last = await prisma.task.findFirst({
    where: { orgId, projectId: task.projectId, status },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? -1) + 1;

  // Auto-clock fields based on the status transition.
  const clock: { startedAt?: Date; completedAt?: Date | null } = {};

  // First time work begins → stamp start.
  if (status === "IN_PROGRESS" && !task.startedAt) {
    clock.startedAt = new Date();
  }

  // Entering DONE → stamp completion. Leaving DONE → clear it.
  if (status === "DONE" && task.status !== "DONE") {
    clock.completedAt = new Date();
    // If it somehow never had a start, stamp it now so elapsed isn't nonsense.
    if (!task.startedAt) clock.startedAt = new Date();
  } else if (status !== "DONE" && task.status === "DONE") {
    clock.completedAt = null;
  }

  await prisma.task.update({ where: { id: taskId }, data: { status, order, ...clock } });
  await logActivity(orgId, taskId, user.id, "STATUS_CHANGED", task.status, status);

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
}

// ── reorder within / across columns (board dnd) ──────────
// Accepts an ordered list of task ids for a single destination status column.
export async function reorderColumn(args: {
  projectId: string;
  status: string;
  orderedIds: string[];
}) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "view");
  if (!isTaskStatus(args.status)) throw new Error("Invalid status.");
  await assertProjectInOrg(args.projectId, orgId);

  // Only touch tasks that genuinely belong to this org+project.
  const owned = await prisma.task.findMany({
    where: { id: { in: args.orderedIds }, orgId, projectId: args.projectId },
    select: { id: true, status: true, startedAt: true },
  });
  const ownedIds = new Set(owned.map((t) => t.id));
  const ownedById = new Map(owned.map((t) => [t.id, t]));

  const now = new Date();

  await prisma.$transaction(
    args.orderedIds
      .filter((id) => ownedIds.has(id))
      .map((id, idx) => {
        const prev = ownedById.get(id)!;

        // Same auto-clock rules as setTaskStatus, applied per moved task.
        const clock: { startedAt?: Date; completedAt?: Date | null } = {};
        if (args.status === "IN_PROGRESS" && !prev.startedAt) {
          clock.startedAt = now;
        }
        if (args.status === "DONE" && prev.status !== "DONE") {
          clock.completedAt = now;
          if (!prev.startedAt) clock.startedAt = now;
        } else if (args.status !== "DONE" && prev.status === "DONE") {
          clock.completedAt = null;
        }

        return prisma.task.update({
          where: { id },
          data: { status: args.status, order: idx, ...clock },
        });
      })
  );

  // log status moves for any task whose column actually changed
  for (const t of owned) {
    if (t.status !== args.status) {
      await logActivity(orgId, t.id, user.id, "STATUS_CHANGED", t.status, args.status);
    }
  }

  revalidatePath(`/projects/${args.projectId}`);
}

// ── delete ───────────────────────────────────────────────

export async function deleteTask(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const taskId = fdStr(formData,"taskId");
  const task = await getOwnedTask(taskId, orgId);
  if (!canEditTask(user, task, user.id)) throw new Error("FORBIDDEN");

  await prisma.task.delete({ where: { id: taskId } }); // cascades activity/comments/timelogs
  revalidatePath(`/projects/${task.projectId}`);
}

// ── comments ─────────────────────────────────────────────

export async function addComment(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "comment_task");
  const taskId = fdStr(formData,"taskId");
  const body = fdStr(formData,"body");
  if (!body) throw new Error("Comment can't be empty.");

  const task = await getOwnedTask(taskId, orgId);

  await prisma.taskComment.create({ data: { orgId, taskId, userId: user.id, body } });
  await logActivity(orgId, taskId, user.id, "COMMENTED", null, null, body.slice(0, 140));

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
}

export async function deleteComment(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const commentId = fdStr(formData,"commentId");
  const comment = await prisma.taskComment.findFirst({ where: { id: commentId, orgId } });
  if (!comment) throw new Error("NOT_FOUND");

  // author can delete own; admins+ can delete any
  const isAuthor = comment.userId === user.id;
  if (!isAuthor && !can(user, "edit_any_task")) throw new Error("FORBIDDEN");

  const task = await prisma.task.findUnique({ where: { id: comment.taskId }, select: { projectId: true } });
  await prisma.taskComment.delete({ where: { id: commentId } });
  if (task) revalidatePath(`/projects/${task.projectId}/tasks/${comment.taskId}`);
}

// ── time logs ────────────────────────────────────────────

export async function addTimeLog(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "log_time");
  const taskId = fdStr(formData,"taskId");
  const hoursRaw = fdStr(formData,"hours");
  const hours = parseFloat(hoursRaw);
  if (!Number.isFinite(hours) || hours <= 0) throw new Error("Enter hours greater than 0.");

  const task = await getOwnedTask(taskId, orgId);
  const spentOn = fdDate(formData,"spentOn") ?? new Date();

  await prisma.timeLog.create({
    data: { orgId, taskId, userId: user.id, hours, note: fdStr(formData,"note") || null, spentOn },
  });
  await logActivity(orgId, taskId, user.id, "LOGGED_TIME", null, String(hours));

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
}

export async function deleteTimeLog(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const logId = fdStr(formData,"logId");
  const log = await prisma.timeLog.findFirst({ where: { id: logId, orgId } });
  if (!log) throw new Error("NOT_FOUND");

  const isAuthor = log.userId === user.id;
  if (!isAuthor && !can(user, "edit_any_task")) throw new Error("FORBIDDEN");

  const task = await prisma.task.findUnique({ where: { id: log.taskId }, select: { projectId: true } });
  await prisma.timeLog.delete({ where: { id: logId } });
  if (task) revalidatePath(`/projects/${task.projectId}/tasks/${log.taskId}`);
}