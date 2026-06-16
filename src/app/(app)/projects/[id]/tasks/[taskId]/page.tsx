import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can, canEditTask } from "@/lib/permissions";
import { getTaskDetail, getAssignableMembers } from "@/lib/task-queries";
import { TaskDetailClient } from "./task-detail-client";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const me = await requireSession();

  const task = await getTaskDetail(me.orgId, taskId);
  if (!task || task.projectId !== id) notFound();

  const members = await getAssignableMembers(me.orgId);
  const totalHours = task.timeLogs.reduce((s, l) => s + l.hours, 0);

  return (
    <TaskDetailClient
      projectId={id}
      task={JSON.parse(JSON.stringify(task))}
      members={members}
      totalHours={totalHours}
      me={{ id: me.id, role: me.role, isSuperAdmin: me.isSuperAdmin }}
      canEdit={canEditTask(
        me,
        { assigneeId: task.assigneeId, reporterId: task.reporterId },
        me.id
      )}
      canComment={can(me, "comment_task")}
      canLogTime={can(me, "log_time")}
    />
  );
}