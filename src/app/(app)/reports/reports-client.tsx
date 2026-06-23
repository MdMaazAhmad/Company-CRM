"use client";

import { useRouter } from "next/navigation";
import { PageHeader, EmptyState, DataTable } from "@/components/crm";
import { TableCell, TableRow } from "@/components/ui/table";
import { STATUS_META } from "@/lib/status";
import { RAIL_COLORS, inr } from "@/lib/ui";

type SourceRow = { source: string; total: number; converted: number; rate: number; revenue: number };
type Funnel = { total: number; stages: { status: string; count: number }[] };

const RANGES = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

export default function ReportsClient({
  range,
  sources,
  funnel,
}: {
  range: string;
  sources: SourceRow[];
  funnel: Funnel;
}) {
  const router = useRouter();
  const maxStage = Math.max(1, ...funnel.stages.map((s) => s.count));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Where your leads come from, how well they convert, and what each channel earns."
        action={
          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => router.push(`/reports?range=${r.value}`)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  range === r.value
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-muted hover:border-ink/30"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Conversion funnel</h2>
        {funnel.total === 0 ? (
          <EmptyState message="No leads in this period." />
        ) : (
          <div className="space-y-2 rounded-2xl border border-line bg-surface p-5">
            {funnel.stages.map((s) => {
              const color = RAIL_COLORS[s.status] ?? "#94A3B8";
              const pct = Math.round((s.count / maxStage) * 100);
              const ofTotal = funnel.total > 0 ? Math.round((s.count / funnel.total) * 100) : 0;
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-xs text-muted">
                    {STATUS_META[s.status as keyof typeof STATUS_META]?.label ?? s.status}
                  </div>
                  <div className="flex-1">
                    <div className="h-7 overflow-hidden rounded-md bg-line-soft">
                      <div
                        className="flex h-full items-center justify-end rounded-md px-2 text-xs font-medium text-white tabular-nums"
                        style={{ width: `${Math.max(pct, 6)}%`, background: color }}
                      >
                        {s.count}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs text-faint tabular-nums">
                    {ofTotal}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Lead sources</h2>
        {sources.length === 0 ? (
          <EmptyState message="No source data in this period." />
        ) : (
          <DataTable
            headers={[
              { label: "Source" },
              { label: "Leads", className: "text-right" },
              { label: "Converted", className: "text-right" },
              { label: "Rate", className: "text-right" },
              { label: "Revenue", className: "text-right" },
            ]}
          >
            {sources.map((r) => (
              <TableRow key={r.source} className="hover:bg-line-soft/60">
                <TableCell className="font-medium text-ink">{r.source}</TableCell>
                <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                <TableCell className="text-right tabular-nums">{r.converted}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <span style={{ color: r.rate >= 30 ? "#16A34A" : r.rate >= 10 ? "#F59E0B" : "#94A3B8" }}>
                    {r.rate}%
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-st-converted">
                  {r.revenue > 0 ? inr(r.revenue) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </section>
    </div>
  );
}