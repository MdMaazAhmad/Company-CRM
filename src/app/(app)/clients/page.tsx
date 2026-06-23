import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import ClientsClient from "./clients-client";

export default async function ClientsPage() {
  const { orgId } = await requireOrg();

  const clients = await prisma.contact.findMany({
    where: { orgId, stage: "CLIENT" },
    orderBy: { convertedAt: "desc" },
    include: {
      _count: { select: { projects: true } },
      projects: {
        select: { price: true, payments: { select: { amount: true } } },
      },
    },
  });

  return (
    <ClientsClient
      clients={clients.map((c) => ({
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
        projectCount: c._count.projects,
        value: c.projects.reduce((s, p) => s + (p.price ?? 0), 0),
        paid: c.projects.reduce(
          (s, p) => s + p.payments.reduce((a, pay) => a + pay.amount, 0),
          0
        ),
      }))}
    />
  );
}