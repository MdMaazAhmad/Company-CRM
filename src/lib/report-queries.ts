import { prisma } from "@/lib/prisma";
import { STATUSES } from "@/lib/status";

export type DateRange = "month" | "quarter" | "all";

export function rangeStart(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const q = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), q, 1);
}

function whereCreated(orgId: string, start: Date | null) {
  return start ? { orgId, createdAt: { gte: start } } : { orgId };
}

/** Per-source: total leads, converted count, conversion %, and revenue collected. */
export async function getSourceReport(orgId: string, start: Date | null) {
  const contacts = await prisma.contact.findMany({
    where: whereCreated(orgId, start),
    select: {
      source: true,
      stage: true,
      status: true,
      projects: {
        select: { payments: { select: { amount: true } } },
      },
    },
  });

  const map = new Map<
    string,
    { source: string; total: number; converted: number; revenue: number }
  >();

  for (const c of contacts) {
    const key = c.source?.trim() || "Unknown";
    const row = map.get(key) ?? { source: key, total: 0, converted: 0, revenue: 0 };
    row.total += 1;
    if (c.stage === "CLIENT" || c.status === "CONVERTED") {
      row.converted += 1;
      for (const p of c.projects) {
        row.revenue += p.payments.reduce((s, pay) => s + pay.amount, 0);
      }
    }
    map.set(key, row);
  }

  return Array.from(map.values())
    .map((r) => ({
      ...r,
      rate: r.total > 0 ? Math.round((r.converted / r.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Funnel: count of contacts at or past each pipeline stage. */
export async function getFunnel(orgId: string, start: Date | null) {
  const groups = await prisma.contact.groupBy({
    by: ["status"],
    where: whereCreated(orgId, start),
    _count: true,
  });
  const countOf = (s: string) => groups.find((g) => g.status === s)?._count ?? 0;

  const total = groups.reduce((s, g) => s + g._count, 0);
  const stages = STATUSES.map((s) => ({ status: s, count: countOf(s) }));

  return { total, stages };
}