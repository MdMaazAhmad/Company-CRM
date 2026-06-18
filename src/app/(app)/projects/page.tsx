import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import ProjectsClient from "./projects-client";

export default async function ProjectsPage() {
  const { orgId } = await requireOrg();

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: { orgId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: { contact: true, payments: { select: { amount: true } } },
    }),
    prisma.contact.findMany({
      where: { orgId, stage: "CLIENT" },
      orderBy: { convertedAt: "desc" },
    }),
  ]);

  return (
    <ProjectsClient
      projects={projects.map((p) => ({
        id: p.id,
        contactId: p.contactId,
        name: p.name,
        status: p.status,
        price: p.price,
        paid: p.payments.reduce((s, pay) => s + pay.amount, 0),
        dueDate: p.dueDate ? p.dueDate.toISOString() : null,
        liveUrl: p.liveUrl,
        clientName: p.contact.name,
        billingType: p.billingType,
        monthlyAmount: p.monthlyAmount,
        splitBilling: p.splitBilling,
        billingActive: p.billingActive,
        gstRate: p.gstRate,
        hsnSac: p.hsnSac,
        taxMode: p.taxMode,
      }))}
      clients={clients.map((c) => ({
        id: c.id,
        label: `${c.name}${c.business ? ` — ${c.business}` : ""}`,
      }))}
    />
  );
}