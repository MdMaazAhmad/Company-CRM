import { prisma } from "@/lib/prisma";

export async function getAllOrgs() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      status: true,
      active: true,
      subscribedUntil: true,
      createdAt: true,
      _count: { select: { users: true, contacts: true, projects: true, invoices: true } },
    },
  });

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    plan: o.plan,
    status: o.status,
    active: o.active,
    subscribedUntil: o.subscribedUntil ? o.subscribedUntil.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    users: o._count.users,
    contacts: o._count.contacts,
    projects: o._count.projects,
    invoices: o._count.invoices,
  }));
}

export async function getPlatformTotals() {
  const [orgCount, userCount, activeOrgs, paymentAgg] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.organization.count({ where: { status: "ACTIVE", active: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);

  return {
    orgs: orgCount,
    users: userCount,
    activeOrgs,
    grossRevenue: paymentAgg._sum.amount ?? 0,
  };
}

export async function getOrgDetail(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      status: true,
      active: true,
      blockedReason: true,
      subscribedUntil: true,
      createdAt: true,
      users: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true, active: true, isSuperAdmin: true },
      },
      _count: { select: { contacts: true, projects: true, invoices: true, payments: true } },
    },
  });
  if (!org) return null;

  const paymentAgg = await prisma.payment.aggregate({
    where: { orgId },
    _sum: { amount: true },
  });

  return {
    ...org,
    subscribedUntil: org.subscribedUntil ? org.subscribedUntil.toISOString() : null,
    createdAt: org.createdAt.toISOString(),
    grossRevenue: paymentAgg._sum.amount ?? 0,
  };
}