import { prisma } from "@/lib/prisma";

export async function getAssignableMembers(orgId: string) {
  return prisma.user.findMany({
    where: { orgId, active: true, team: { in: ["SALES", "BOTH"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, avatarColor: true },
  });
}

export async function getMyLeads(orgId: string, userId: string) {
  const leads = await prisma.contact.findMany({
    where: { orgId, stage: "LEAD", assigneeId: userId },
    orderBy: [{ nextActionAt: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      business: true,
      phone: true,
      whatsapp: true,
      status: true,
      plan: true,
      quotedPrice: true,
      nextActionAt: true,
      nextActionNote: true,
    },
  });
  return leads.map((l) => ({
    ...l,
    nextActionAt: l.nextActionAt ? l.nextActionAt.toISOString() : null,
  }));
}

export async function countOverdueActions(orgId: string, userId: string) {
  return prisma.contact.count({
    where: {
      orgId,
      stage: "LEAD",
      assigneeId: userId,
      nextActionAt: { lt: new Date() },
    },
  });
}