import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import FollowUpsClient from "./follow-ups-client";

export default async function FollowUpsPage() {
  const { orgId } = await requireOrg();

  const [followUps, contacts] = await Promise.all([
    prisma.followUp.findMany({
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
      followUps={followUps.map((f) => ({
        id: f.id,
        dueDate: f.dueDate.toISOString(),
        done: f.done,
        note: f.note,
        contactName: f.contact.name,
      }))}
      contacts={contacts.map((c) => ({ id: c.id, label: c.name }))}
    />
  );
}