import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import MeetingDetailClient from "./meeting-detail-client";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();

  const meeting = await prisma.meeting.findFirst({
    where: { id, orgId },
    include: {
        contact: { select: { id: true, name: true, email: true } },
      host: { select: { name: true } },
      notes: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!meeting) notFound();

  return (
    <MeetingDetailClient
      meeting={{
        id: meeting.id,
        title: meeting.title,
        startAt: meeting.startAt.toISOString(),
        endAt: meeting.endAt ? meeting.endAt.toISOString() : null,
        location: meeting.location,
        link: meeting.link,
        status: meeting.status,
        outcome: meeting.outcome,
        summary: meeting.summary,
        transcriptUrl: meeting.transcriptUrl,
        hostName: meeting.host?.name ?? null,
        contactId: meeting.contact.id,
        contactName: meeting.contact.name,
        contactEmail: meeting.contact.email,
        notes: meeting.notes.map((n:any) => ({
          id: n.id,
          body: n.body,
          authorName: n.author?.name ?? null,
          createdAt: n.createdAt.toISOString(),
        })),
      }}
    />
  );
}