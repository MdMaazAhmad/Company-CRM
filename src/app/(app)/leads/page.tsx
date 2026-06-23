import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { getAssignableMembers } from "@/lib/lead-queries";
import LeadsClient from "./leads-client";

export default async function LeadsPage() {
  const { orgId } = await requireOrg();

  const [leads, members] = await Promise.all([
    prisma.contact.findMany({
      where: { orgId, stage: "LEAD" },
      orderBy: { createdAt: "desc" },
    }),
    getAssignableMembers(orgId),
  ]);

  return (
    <LeadsClient
      members={members}
      leads={leads.map((c) => ({
        id: c.id,
        name: c.name,
        business: c.business,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        city: c.city,
        state: c.state,
        gstin: c.gstin,
        billingAddress: c.billingAddress,
        source: c.source,
        notes: c.notes,
        plan: c.plan,
        quotedPrice: c.quotedPrice,
        assigneeId: c.assigneeId,
        createdAt: c.createdAt.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: c.status,
      }))}
    />
  );
}