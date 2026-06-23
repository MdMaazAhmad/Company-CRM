import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { STATUSES } from "@/lib/status";
import LeadPipelineClient from "./lead-pipeline-client";

export default async function LeadPipelinePage() {
  const { orgId } = await requireOrg();

  const leads = await prisma.contact.findMany({
    where: { orgId, stage: "LEAD" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      business: true,
      status: true,
      quotedPrice: true,
      nextActionAt: true,
      nextActionNote: true,
      assignee: { select: { name: true, avatarColor: true } },
    },
  });

  const data = leads.map((l) => ({
    id: l.id,
    name: l.name,
    business: l.business,
    status: l.status,
    quotedPrice: l.quotedPrice,
    nextActionAt: l.nextActionAt ? l.nextActionAt.toISOString() : null,
    nextActionNote: l.nextActionNote,
    assigneeName: l.assignee?.name ?? null,
    assigneeColor: l.assignee?.avatarColor ?? null,
  }));

  return <LeadPipelineClient leads={data} />;
}