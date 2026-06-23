import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { getAssignableMembers } from "@/lib/lead-queries";
import LeadDetailClient from "./lead-detail-client";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();

  const [contact, members] = await Promise.all([
    prisma.contact.findFirst({
      where: { id, orgId },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        leadActivities: { orderBy: { createdAt: "desc" } },
        meetings: {
          orderBy: { startAt: "desc" },
          include: {
            host: { select: { name: true } },
            notes: {
              orderBy: { createdAt: "asc" },
              include: { author: { select: { name: true } } },
            },
          },
        },
      },
    }),
    getAssignableMembers(orgId),
  ]);
  if (!contact) notFound();

  const data = {
    id: contact.id,
    name: contact.name,
    business: contact.business,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    email: contact.email,
    city: contact.city,
    source: contact.source,
    plan: contact.plan,
    quotedPrice: contact.quotedPrice,
    notes: contact.notes,
    stage: contact.stage,
    status: contact.status,
    createdAt: contact.createdAt.toISOString(),
    assigneeId: contact.assigneeId,
    assigneeName: contact.assignee?.name ?? null,
    assigneeColor: contact.assignee?.avatarColor ?? null,
    nextActionAt: contact.nextActionAt ? contact.nextActionAt.toISOString() : null,
    nextActionNote: contact.nextActionNote,
    activities: contact.leadActivities.map((a) => ({
      id: a.id,
      type: a.type,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      done: a.done,
      outcome: a.outcome,
      createdAt: a.createdAt.toISOString(),
    })),
    meetings: contact.meetings.map((m) => ({
      id: m.id,
      title: m.title,
      startAt: m.startAt.toISOString(),
      endAt: m.endAt ? m.endAt.toISOString() : null,
      location: m.location,
      link: m.link,
      status: m.status,
      outcome: m.outcome,
      summary: m.summary,
      transcriptUrl: m.transcriptUrl,
      hostName: m.host?.name ?? null,
      notes: m.notes.map((n) => ({
        id: n.id,
        body: n.body,
        authorName: n.author?.name ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    })),
  };

  return <LeadDetailClient lead={data} members={members} />;
}