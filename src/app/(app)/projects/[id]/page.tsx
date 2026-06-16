import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import {
  getProjectTasks,
  getAssignableMembers,
  getProjectActivity,
} from "@/lib/task-queries";
import { ProjectDetailTabs } from "./project-detail-tabs";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireSession();

  const project = await prisma.project.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      contact: { select: { name: true, business: true, plan: true } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!project) notFound();

  const [tasks, members, activity] = await Promise.all([
    getProjectTasks(me.orgId, id),
    getAssignableMembers(me.orgId),
    getProjectActivity(me.orgId, id, 50),
  ]);

  const paid = project.payments.reduce((s, p) => s + p.amount, 0);
  const payments = project.payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    kind: p.kind,
    method: p.method,
    note: p.note,
    paidAt: p.paidAt.toISOString(),
  }));

  return (
    <ProjectDetailTabs
      project={{
        id: project.id,
        name: project.name,
        status: project.status,
        price: project.price,
        liveUrl: project.liveUrl,
        notes: project.notes,
        clientName: project.contact?.business || project.contact?.name || "—",
        plan: project.contact?.plan ?? null,
      }}
      payments={payments}
      paid={paid}
      tasks={tasks}
      members={members}
      activity={activity}
      me={{ id: me.id, role: me.role, isSuperAdmin: me.isSuperAdmin }}
      canCreateTask={can(me, "create_task")}
    />
  );
}