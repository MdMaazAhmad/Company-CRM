import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import CalendarClient from "./calendar-client";

export default async function CalendarPage() {
  const { orgId } = await requireOrg();

  const meetings = await prisma.meeting.findMany({
    where: { orgId, status: { not: "CANCELLED" } },
    orderBy: { startAt: "asc" },
    include: {
      contact: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
    },
  });

  return (
    <CalendarClient
      meetings={meetings.map((m) => ({
        id: m.id,
        title: m.title,
        startAt: m.startAt.toISOString(),
        endAt: m.endAt ? m.endAt.toISOString() : null,
        status: m.status,
        location: m.location,
        link: m.link,
        contactId: m.contact.id,
        contactName: m.contact.name,
        hostId: m.host?.id ?? null,
        hostName: m.host?.name ?? null,
      }))}
    />
  );
}