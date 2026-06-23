import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { STATUSES, STATUS_META } from "@/lib/status";
import {
  PipelineBar,
  SourceDonut,
  ProjectStatusBar,
  RevenueBar,
} from "./dashboard-charts";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const RAIL_COLORS: Record<string, string> = {
  NEW: "#2563EB",
  CONTACTED: "#06B6D4",
  FOLLOW_UP: "#F59E0B",
  QUOTED: "#FF6B00",
  NEGOTIATING: "#DB2777",
  CONVERTED: "#16A34A",
  DROPPED: "#94A3B8",
};

const PROJECT_STATUSES = [
  ["NOT_STARTED", "Not started"],
  ["IN_PROGRESS", "In progress"],
  ["REVIEW", "Review"],
  ["LIVE", "Live"],
  ["ON_HOLD", "On hold"],
] as const;

export default async function Dashboard() {
  const { user, orgId } = await requireOrg();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [
    org,
    leadCount,
    clientCount,
    statusGroups,
    sourceGroups,
    dueToday,
    overdue,
    myOverdueLeads,
    projectGroups,
    projects,
    paymentAgg,
    convertedBySource,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
    prisma.contact.count({ where: { orgId, stage: "LEAD" } }),
    prisma.contact.count({ where: { orgId, stage: "CLIENT" } }),
    prisma.contact.groupBy({ by: ["status"], where: { orgId }, _count: true }),
    prisma.contact.groupBy({ by: ["source"], where: { orgId }, _count: true }),
    prisma.followUp.count({
      where: { orgId, done: false, dueDate: { gte: today, lt: tomorrow } },
    }),
    prisma.followUp.count({
      where: { orgId, done: false, dueDate: { lt: today } },
    }),
    prisma.contact.count({
      where: {
        orgId,
        stage: "LEAD",
        assigneeId: user.id,
        nextActionAt: { lt: new Date() },
      },
    }),
    prisma.project.groupBy({ by: ["status"], where: { orgId }, _count: true }),
    prisma.project.findMany({ where: { orgId }, select: { price: true } }),
    prisma.payment.aggregate({ where: { orgId }, _sum: { amount: true } }),
    prisma.contact.groupBy({
      by: ["source"],
      where: { orgId, stage: "CLIENT" },
      _count: true,
    }),
  ]);

  const topSources = convertedBySource
    .filter((s) => s.source)
    .map((s) => ({ name: s.source as string, value: s._count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const countFor = (s: string) =>
    statusGroups.find((g) => g.status === s)?._count ?? 0;
  const projectCountFor = (s: string) =>
    projectGroups.find((g) => g.status === s)?._count ?? 0;

  const totalContacts = statusGroups.reduce((s, g) => s + g._count, 0);
  const convRate =
    totalContacts > 0
      ? Math.round((countFor("CONVERTED") / totalContacts) * 100)
      : 0;

  const totalProjects = projectGroups.reduce((s, g) => s + g._count, 0);
  const activeProjects = totalProjects - projectCountFor("LIVE");

  const totalValue = projects.reduce((s, p) => s + (p.price ?? 0), 0);
  const collected = paymentAgg._sum.amount ?? 0;
  const outstanding = Math.max(0, totalValue - collected);

  const pipelineData = STATUSES.map((s) => ({
    name: STATUS_META[s].label,
    value: countFor(s),
  }));
  const sourceData = sourceGroups
    .filter((s) => s.source)
    .map((s) => ({ name: s.source as string, value: s._count }));
  const projectStatusData = PROJECT_STATUSES.map(([s, name]) => ({
    name,
    value: projectCountFor(s),
  }));
  const revenueData = [{ name: "All projects", collected, outstanding }];

  const railSegments = STATUSES.map((s) => ({
    status: s,
    label: STATUS_META[s].label,
    count: countFor(s),
  })).filter((seg) => seg.count > 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[3px] text-brand">
      {org?.name ?? "Workspace"}
      </div>
      <h1 className="mb-1 font-heading text-4xl font-semibold text-ink">
        Dashboard
      </h1>
      <p className="mb-8 text-sm text-muted">
        {totalContacts} contacts in the funnel · {clientCount} won ·{" "}
        {activeProjects} project{activeProjects === 1 ? "" : "s"} in build
      </p>

      <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-sm font-semibold text-ink">
            Everyone in the funnel
          </div>
          <div className="font-heading text-sm text-muted">
            {convRate}% converted
          </div>
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-line-soft">
          {railSegments.map((seg) => (
            <div
              key={seg.status}
              title={`${seg.label}: ${seg.count}`}
              style={{
                flexGrow: seg.count,
                background: RAIL_COLORS[seg.status] ?? "#94A3B8",
              }}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {railSegments.map((seg) => (
            <div key={seg.status} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: RAIL_COLORS[seg.status] ?? "#94A3B8" }}
              />
              <span className="text-xs text-muted">
                {seg.label}{" "}
                <span className="font-semibold text-ink">{seg.count}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <div className="text-xs uppercase tracking-wider text-faint">
            Collected
          </div>
          <div className="mt-2 font-heading text-3xl font-semibold text-st-converted tabular-nums">
            {inr(collected)}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <div className="text-xs uppercase tracking-wider text-faint">
            Outstanding
          </div>
          <div className="mt-2 font-heading text-3xl font-semibold text-st-quoted tabular-nums">
            {inr(outstanding)}
          </div>
        </div>
        <div className="rounded-2xl border border-brand/30 bg-brand-soft p-6">
          <div className="text-xs uppercase tracking-wider text-brand">
            Contracted value
          </div>
          <div className="mt-2 font-heading text-3xl font-semibold text-ink tabular-nums">
            {inr(totalValue)}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Leads", value: leadCount, tone: "text-ink" },
          { label: "Clients", value: clientCount, tone: "text-ink" },
          {
            label: "Active Projects",
            value: activeProjects,
            tone: "text-st-quoted",
          },
          { label: "Conversion", value: `${convRate}%`, tone: "text-brand" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <div className="text-xs uppercase tracking-wider text-faint">
              {s.label}
            </div>
            <div className={`mt-2 text-3xl font-semibold ${s.tone}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-2xl border border-line bg-surface p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-sm font-semibold text-ink">Top converting sources</div>
          <a href="/reports" className="text-xs text-brand hover:underline">Full report →</a>
        </div>
        {topSources.length === 0 ? (
          <div className="text-sm text-faint">No converted clients yet.</div>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {topSources.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="text-sm text-muted">{s.name}</span>
                <span className="font-heading text-sm font-semibold text-ink tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(dueToday > 0 || overdue > 0 || myOverdueLeads > 0) && (
        <div className="mb-4 flex flex-wrap gap-4">
          {myOverdueLeads > 0 && (
            <div className="flex-1 min-w-[200px] rounded-xl border border-brand/30 bg-brand-soft px-5 py-4">
              <div className="text-sm font-semibold text-brand">
                {myOverdueLeads} of your leads need action
              </div>
              <a href="/my-leads" className="text-xs text-muted underline">
                View now
              </a>
            </div>
          )}
          {overdue > 0 && (
            <div className="flex-1 min-w-[200px] rounded-xl border border-st-negotiating-bg bg-st-negotiating-bg px-5 py-4">
              <div className="text-sm font-semibold text-st-negotiating">
                {overdue} overdue follow-up{overdue > 1 ? "s" : ""}
              </div>
              <a href="/follow-ups" className="text-xs text-muted underline">
                View now
              </a>
            </div>
          )}
          {dueToday > 0 && (
            <div className="flex-1 min-w-[200px] rounded-xl border border-st-followup-bg bg-st-followup-bg px-5 py-4">
              <div className="text-sm font-semibold text-st-followup">
                {dueToday} due today
              </div>
              <a href="/follow-ups" className="text-xs text-muted underline">
                View now
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 text-sm font-semibold text-ink">
            Pipeline by stage
          </div>
          <PipelineBar data={pipelineData} />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 text-sm font-semibold text-ink">
            Leads by source
          </div>
          <SourceDonut data={sourceData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 text-sm font-semibold text-ink">
            Projects by status
          </div>
          <ProjectStatusBar data={projectStatusData} />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-1 text-sm font-semibold text-ink">Revenue</div>
          <div className="mb-4 text-xs text-faint">
            Collected vs outstanding across all projects
          </div>
          <RevenueBar data={revenueData} />
        </div>
      </div>
    </div>
  );
}