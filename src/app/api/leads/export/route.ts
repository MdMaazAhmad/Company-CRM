import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { STATUS_META } from "@/lib/status";

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const { orgId } = await requireOrg();

  const leads = await prisma.contact.findMany({
    where: { orgId, stage: "LEAD" },
    orderBy: { createdAt: "desc" },
    include: { assignee: { select: { name: true } } },
  });

  const headers = [
    "Name",
    "Business",
    "Phone",
    "WhatsApp",
    "Email",
    "City",
    "State",
    "GSTIN",
    "Source",
    "Plan",
    "Quoted Price",
    "Status",
    "Owner",
    "Next Action At",
    "Call Status",
    "Call Discussion",
    "Meeting Scheduled",
    "Notes",
    "Added On",
  ];

  const rows = leads.map((l) => [
    l.name,
    l.business,
    l.phone,
    l.whatsapp,
    l.email,
    l.city,
    l.state,
    l.gstin,
    l.source,
    l.plan,
    l.quotedPrice,
    STATUS_META[l.status as keyof typeof STATUS_META]?.label ?? l.status,
    l.assignee?.name ?? "",
    l.nextActionAt
      ? l.nextActionAt.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "",
    "",
    l.nextActionNote ?? "",
    "",
    l.notes,
    l.createdAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map(csvCell).join(","))
    .join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
    },
  });
}