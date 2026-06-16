// src/lib/task-queries.ts
// Org-scoped read helpers. Keeping queries here means every page fetches tasks
// the same safe way (always filtered by orgId) instead of hand-rolling Prisma
// calls that might forget the tenant filter.

import { prisma } from "@/lib/prisma";

const assigneeSelect = {
  select: { id: true, name: true, avatarColor: true },
};

/** All tasks for a project (board + list views). */
export async function getProjectTasks(orgId: string, projectId: string) {
  return prisma.task.findMany({
    where: { orgId, projectId },
    orderBy: [{ status: "asc" }, { order: "asc" }],
    include: {
      assignee: assigneeSelect,
      reporter: assigneeSelect,
      _count: { select: { comments: true, timeLogs: true } },
    },
  });
}

/** One task with everything the detail page needs. */
export async function getTaskDetail(orgId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, orgId },
    include: {
      assignee: assigneeSelect,
      reporter: assigneeSelect,
      project: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: assigneeSelect },
      },
      timeLogs: {
        orderBy: { spentOn: "desc" },
        include: { user: assigneeSelect },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: assigneeSelect },
      },
    },
  });
}

/** Tasks assigned to a given user across all their org's projects (My Tasks). */
export async function getMyTasks(orgId: string, userId: string) {
  return prisma.task.findMany({
    where: { orgId, assigneeId: userId, status: { not: "DONE" } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      project: { select: { id: true, name: true } },
      assignee: assigneeSelect,
    },
  });
}

/** Active team members for assignee pickers. */
export async function getAssignableMembers(orgId: string) {
  return prisma.user.findMany({
    where: { orgId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, avatarColor: true, role: true },
  });
}

/** Recent activity across a whole project (project Activity tab). */
export async function getProjectActivity(orgId: string, projectId: string, take = 50) {
  return prisma.taskActivity.findMany({
    where: { orgId, task: { projectId } },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: assigneeSelect,
      task: { select: { id: true, title: true } },
    },
  });
}