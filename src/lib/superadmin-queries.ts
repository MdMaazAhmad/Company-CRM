import { prisma } from "@/lib/prisma";

const GRACE_DAYS = 5;

async function autoBlockExpired() {
  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000);
  await prisma.organization.updateMany({
    where: {
      status: { not: "BLOCKED" },
      subscribedUntil: { not: null, lt: cutoff },
    },
    data: {
      status: "BLOCKED",
      active: false,
      blockedReason: "Subscription expired (auto-blocked after 5-day grace).",
    },
  });
}

async function planPriceMap(): Promise<Record<string, number>> {
  const plans = await prisma.platformPlan.findMany({ select: { name: true, monthlyPrice: true } });
  return Object.fromEntries(plans.map((p) => [p.name, p.monthlyPrice]));
}

const effectiveFee = (org: { plan: string; monthlyFee: number | null }, prices: Record<string, number>) =>
  org.monthlyFee ?? prices[org.plan] ?? 0;

export async function getAllOrgs() {
  await autoBlockExpired();
  const [orgs, prices] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, slug: true, plan: true, status: true, active: true,
        monthlyFee: true, subscribedUntil: true, createdAt: true,
        _count: { select: { users: true, projects: true, invoices: true } },
      },
    }),
    planPriceMap(),
  ]);

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    plan: o.plan,
    status: o.status,
    active: o.active,
    fee: effectiveFee(o, prices),
    subscribedUntil: o.subscribedUntil ? o.subscribedUntil.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    users: o._count.users,
    projects: o._count.projects,
    invoices: o._count.invoices,
  }));
}

export async function getPlatformTotals() {
  await autoBlockExpired();
  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [orgs, users, activeOrgs, expiringSoon, activeForMrr, prices] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.organization.count({ where: { status: "ACTIVE", active: true } }),
    prisma.organization.count({ where: { subscribedUntil: { gte: now, lte: weekOut } } }),
    prisma.organization.findMany({
      where: { status: "ACTIVE", active: true },
      select: { plan: true, monthlyFee: true },
    }),
    planPriceMap(),
  ]);

  const mrr = activeForMrr.reduce((sum, o) => sum + effectiveFee(o, prices), 0);

  return { orgs, users, activeOrgs, expiringSoon, mrr };
}

export async function getOrgDetail(orgId: string) {
  await autoBlockExpired();
  const [org, prices] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true, name: true, slug: true, plan: true, status: true, active: true,
        blockedReason: true, monthlyFee: true, subscribedUntil: true, createdAt: true,
        _count: { select: { users: true, projects: true, invoices: true } },
        platformPayments: {
          orderBy: { paidAt: "desc" },
          select: { id: true, amount: true, period: true, note: true, paidAt: true },
        },
        platformAuditLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, actorEmail: true, action: true, detail: true, createdAt: true },
        },
      },
    }),
    planPriceMap(),
  ]);
  if (!org) return null;

  const collected = org.platformPayments.reduce((s, p) => s + p.amount, 0);

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    status: org.status,
    active: org.active,
    blockedReason: org.blockedReason,
    monthlyFee: org.monthlyFee,
    effectiveFee: effectiveFee(org, prices),
    subscribedUntil: org.subscribedUntil ? org.subscribedUntil.toISOString() : null,
    createdAt: org.createdAt.toISOString(),
    counts: { users: org._count.users, projects: org._count.projects, invoices: org._count.invoices },
    collected,
    payments: org.platformPayments.map((p) => ({
      id: p.id, amount: p.amount, period: p.period, note: p.note, paidAt: p.paidAt.toISOString(),
    })),
    audit: org.platformAuditLogs.map((a) => ({
      id: a.id, actorEmail: a.actorEmail, action: a.action, detail: a.detail, createdAt: a.createdAt.toISOString(),
    })),
  };
}

export async function getRecentAudit(limit = 15) {
  const rows = await prisma.platformAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, actorEmail: true, action: true, detail: true, createdAt: true,
      org: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id, actorEmail: r.actorEmail, action: r.action, detail: r.detail,
    orgName: r.org?.name ?? null, createdAt: r.createdAt.toISOString(),
  }));
}

export async function getPlatformPlans() {
  return prisma.platformPlan.findMany({ orderBy: { sortOrder: "asc" } });
}