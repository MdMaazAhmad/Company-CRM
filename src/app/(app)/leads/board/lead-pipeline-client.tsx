"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarClock, ChevronDown } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/crm";
import { STATUSES, STATUS_META } from "@/lib/status";
import { RAIL_COLORS, inr } from "@/lib/ui";
import { PipelineBar, SourceDonut } from "../../dashboard-charts";

type Lead = {
  id: string;
  name: string;
  business: string | null;
  status: string;
  quotedPrice: number | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  assigneeName: string | null;
  assigneeColor: string | null;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function actionTone(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d < today) return "#DB2777";
  if (d < tomorrow) return "#F59E0B";
  return "#16A34A";
}
const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function LeadPipelineClient({ leads }: { leads: Lead[] }) {
  const [open, setOpen] = useState<string | null>(STATUSES[0]);

  const countFor = (s: string) => leads.filter((l) => l.status === s).length;
  const valueFor = (s: string) =>
    leads.filter((l) => l.status === s).reduce((sum, l) => sum + (l.quotedPrice ?? 0), 0);

  const totalLeads = leads.length;
  const totalValue = leads.reduce((s, l) => s + (l.quotedPrice ?? 0), 0);

  const pipelineData = STATUSES.map((s) => ({
    name: STATUS_META[s].label,
    value: countFor(s),
  }));
  const valueData = STATUSES.map((s) => ({
    name: STATUS_META[s].label,
    value: valueFor(s),
  })).filter((d) => d.value > 0);

  const railSegments = STATUSES.map((s) => ({
    status: s,
    label: STATUS_META[s].label,
    count: countFor(s),
  })).filter((seg) => seg.count > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Table view
      </Link>

      <PageHeader
        eyebrow="Pipeline"
        title="Lead pipeline"
        subtitle={`${totalLeads} active lead${totalLeads === 1 ? "" : "s"} · ${inr(totalValue)} in quoted value`}
      />

      {totalLeads === 0 ? (
        <EmptyState message="No active leads yet. Add prospects from the Leads table." />
      ) : (
        <>
          {/* pipeline rail */}
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="mb-4 text-sm font-semibold text-ink">Funnel at a glance</div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-line-soft">
              {railSegments.map((seg) => (
                <div
                  key={seg.status}
                  title={`${seg.label}: ${seg.count}`}
                  style={{ flexGrow: seg.count, background: RAIL_COLORS[seg.status] ?? "#94A3B8" }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {railSegments.map((seg) => (
                <div key={seg.status} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: RAIL_COLORS[seg.status] ?? "#94A3B8" }} />
                  <span className="text-xs text-muted">
                    {seg.label} <span className="font-semibold text-ink">{seg.count}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* per-stage count cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {STATUSES.map((s) => {
              const color = RAIL_COLORS[s] ?? "#94A3B8";
              return (
                <div key={s} className="rounded-xl border border-line bg-surface p-4" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
                  <div className="text-[11px] uppercase tracking-wide text-faint">
                    {STATUS_META[s].label}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-ink tabular-nums">{countFor(s)}</div>
                  {valueFor(s) > 0 && (
                    <div className="text-[11px] text-faint tabular-nums">{inr(valueFor(s))}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="mb-4 text-sm font-semibold text-ink">Leads by stage</div>
              <PipelineBar data={pipelineData} />
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="mb-1 text-sm font-semibold text-ink">Quoted value by stage</div>
              <div className="mb-4 text-xs text-faint">Where your pipeline money sits</div>
              {valueData.length === 0 ? (
                <div className="py-10 text-center text-sm text-faint">No quoted values yet.</div>
              ) : (
                <SourceDonut data={valueData} />
              )}
            </div>
          </div>

          {/* per-stage lead lists */}
          <div className="space-y-3">
            {STATUSES.filter((s) => countFor(s) > 0).map((s) => {
              const color = RAIL_COLORS[s] ?? "#94A3B8";
              const stageLeads = leads.filter((l) => l.status === s);
              const isOpen = open === s;
              return (
                <div key={s} className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <button
                    onClick={() => setOpen(isOpen ? null : s)}
                    className="flex w-full items-center justify-between px-5 py-3 hover:bg-line-soft/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-semibold text-ink">{STATUS_META[s].label}</span>
                      <span className="text-xs text-faint">{stageLeads.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {valueFor(s) > 0 && <span className="text-xs text-faint tabular-nums">{inr(valueFor(s))}</span>}
                      <ChevronDown className={`h-4 w-4 text-faint transition ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-line-soft border-t border-line">
                      {stageLeads.map((l) => {
                        const tone = actionTone(l.nextActionAt);
                        return (
                          <Link
                            key={l.id}
                            href={`/leads/${l.id}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-line-soft/40"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-ink">{l.name}</div>
                              {l.business && <div className="truncate text-xs text-faint">{l.business}</div>}
                            </div>
                            {l.nextActionAt && tone && (
                              <div className="hidden items-center gap-1 text-[11px] sm:flex" style={{ color: tone }}>
                                <CalendarClock className="h-3 w-3" />
                                <span className="truncate">{l.nextActionNote || "Next action"} · {fmtShort(l.nextActionAt)}</span>
                              </div>
                            )}
                            {l.quotedPrice ? (
                              <span className="text-xs font-medium tabular-nums text-ink">{inr(l.quotedPrice)}</span>
                            ) : null}
                            {l.assigneeName ? (
                              <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                style={{ background: l.assigneeColor ?? "#CBD5E1" }}
                                title={l.assigneeName}
                              >
                                {initials(l.assigneeName)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-faint">—</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}