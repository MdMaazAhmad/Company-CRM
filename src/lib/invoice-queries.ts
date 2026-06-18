// src/lib/invoice-queries.ts
// Org-scoped read helpers for invoices, mirroring the task-queries pattern:
// every fetch is filtered by orgId so a page can't accidentally leak another
// tenant's billing data.

import { prisma } from "@/lib/prisma";

/** All invoices for the org, newest first, with project + client + paid total. */
export async function getInvoices(orgId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { orgId },
    orderBy: [{ issuedAt: "desc" }, { dueDate: "desc" }],
    include: {
      project: { select: { id: true, name: true, contact: { select: { name: true } } } },
      payments: { select: { amount: true } },
    },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    amount: inv.amount,
    dueDate: inv.dueDate.toISOString(),
    periodLabel: inv.periodLabel,
    status: inv.status,
    issuedAt: inv.issuedAt.toISOString(),
    projectId: inv.project.id,
    projectName: inv.project.name,
    clientName: inv.project.contact.name,
    paid: inv.payments.reduce((s, p) => s + p.amount, 0),
  }));
}

/** Invoices for a single project (project-detail billing section). */
export async function getProjectInvoices(orgId: string, projectId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { orgId, projectId },
    orderBy: [{ dueDate: "desc" }],
    include: { payments: { select: { amount: true } } },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    amount: inv.amount,
    dueDate: inv.dueDate.toISOString(),
    periodLabel: inv.periodLabel,
    status: inv.status,
    paid: inv.payments.reduce((s, p) => s + p.amount, 0),
  }));
}

/** Count of MONTHLY active projects — used to show/hide the generate button. */
export async function countRecurringProjects(orgId: string) {
  return prisma.project.count({
    where: { orgId, billingType: "MONTHLY", billingActive: true },
  });
}