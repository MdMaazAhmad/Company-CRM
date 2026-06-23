import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import FollowUpsClient from "./follow-ups-client";

export default async function FollowUpsPage() {
  const { orgId } = await requireOrg();

  const [activities, contacts] = await Promise.all([
    prisma.leadActivity.findMany({
      where: { orgId },
      orderBy: { dueDate: "asc" },
      include: { contact: true },
    }),
    prisma.contact.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <FollowUpsClient
      activities={activities.map((a) => ({
        id: a.id,
        type: a.type,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        done: a.done,
        outcome: a.outcome,
        contactName: a.contact.name,
      }))}
      contacts={contacts.map((c) => ({ id: c.id, label: c.name }))}
    />
  );
}