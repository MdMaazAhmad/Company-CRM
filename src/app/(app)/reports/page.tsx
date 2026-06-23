import { requireOrg } from "@/lib/session";
import { getSourceReport, getFunnel, rangeStart, type DateRange } from "@/lib/report-queries";
import ReportsClient from "./reports-client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { orgId } = await requireOrg();
  const sp = await searchParams;
  const range: DateRange = sp.range === "month" || sp.range === "quarter" ? sp.range : "all";
  const start = rangeStart(range);

  const [sources, funnel] = await Promise.all([
    getSourceReport(orgId, start),
    getFunnel(orgId, start),
  ]);

  return <ReportsClient range={range} sources={sources} funnel={funnel} />;
}