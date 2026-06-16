import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import LeadsClient from "./leads-client";

export default async function LeadsPage() {
  const { orgId } = await requireOrg();

  const leads = await prisma.contact.findMany({
    where: { orgId, stage: "LEAD" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <LeadsClient
      leads={leads.map((c) => ({
        id: c.id,
        name: c.name,
        business: c.business,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        city: c.city,
        source: c.source,
        notes: c.notes,
        plan: c.plan,
        quotedPrice: c.quotedPrice,
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