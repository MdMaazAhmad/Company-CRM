"use server";

import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { assertCan, can } from "@/lib/permissions";
import { cyclesDueFor, formatInvoiceNumber } from "@/lib/billing";
import { revalidatePath } from "next/cache";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return v == null ? "" : String(v).trim();
}

export async function generateDueInvoices(): Promise<number> {
  const { user, orgId } = await requireOrg();
  if (!can(user, "manage_users") && !user.isSuperAdmin) {
    throw new Error("Only owners and admins can generate invoices.");
  }

  const now = new Date();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { gstRate: true },
  });
  const orgGst = org?.gstRate ?? 18;

  const projects = await prisma.project.findMany({
    where: { orgId, billingType: "MONTHLY", billingActive: true },
    select: {
      id: true,
      billingType: true,
      monthlyAmount: true,
      splitBilling: true,
      billingActive: true,
      billingStart: true,
      billingDay: true,
      createdAt: true,
      gstRate: true,
      hsnSac: true,
      taxMode: true,
      invoices: { select: { periodKey: true } },
    },
  });

  let created = 0;

  for (const p of projects) {
    const have = new Set(p.invoices.map((i) => i.periodKey));
    const due = cyclesDueFor(p, now).filter((c) => !have.has(c.periodKey));
    if (due.length === 0) continue;

    const gstRate = p.gstRate ?? orgGst;
    const taxMode = p.taxMode ?? "INTRA";
    const hsnSac = p.hsnSac ?? null;

    for (const cycle of due) {
      try {
        await prisma.$transaction(async (tx) => {
          const o = await tx.organization.update({
            where: { id: orgId },
            data: { invoiceSeq: { increment: 1 } },
            select: { invoiceSeq: true },
          });
          await tx.invoice.create({
            data: {
              orgId,
              projectId: p.id,
              number: formatInvoiceNumber(o.invoiceSeq, cycle.dueDate),
              amount: cycle.amount,
              dueDate: cycle.dueDate,
              periodLabel: cycle.periodLabel,
              periodKey: cycle.periodKey,
              status: "UNPAID",
              gstRate,
              taxMode,
              hsnSac,
            },
          });
        });
        created++;
      } catch (e: any) {
        if (e?.code === "P2002") continue;
        throw e;
      }
    }
  }

  revalidatePath("/invoices");
  return created;
}

async function recomputeInvoiceStatus(invoiceId: string) {
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { amount: true, status: true, payments: { select: { amount: true } } },
  });
  if (!inv || inv.status === "VOID") return;

  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
  const status = paid <= 0 ? "UNPAID" : paid >= inv.amount ? "PAID" : "PARTIAL";
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
}

export async function payInvoice(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "view");

  const invoiceId = str(formData, "invoiceId");
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
    select: { id: true, projectId: true, amount: true },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const amount = parseInt(str(formData, "amount"), 10);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than 0.");

  const paidAtRaw = str(formData, "paidAt");
  const paidAt = paidAtRaw ? new Date(paidAtRaw) : new Date();

  await prisma.payment.create({
    data: {
      orgId,
      projectId: invoice.projectId,
      invoiceId: invoice.id,
      amount,
      kind: "MILESTONE",
      method: str(formData, "method") || null,
      note: str(formData, "note") || null,
      paidAt,
    },
  });

  await recomputeInvoiceStatus(invoice.id);

  revalidatePath("/invoices");
  revalidatePath(`/projects/${invoice.projectId}`);
}

export async function voidInvoice(formData: FormData) {
  const { user, orgId } = await requireOrg();
  if (!can(user, "manage_users") && !user.isSuperAdmin) {
    throw new Error("Only owners and admins can void invoices.");
  }

  const invoiceId = str(formData, "invoiceId");
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, orgId }, select: { id: true, projectId: true } });
  if (!invoice) throw new Error("NOT_FOUND");

  await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "VOID" } });

  revalidatePath("/invoices");
  revalidatePath(`/projects/${invoice.projectId}`);
}

export async function deleteInvoicePayment(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const paymentId = str(formData, "paymentId");
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, orgId } });
  if (!payment) throw new Error("NOT_FOUND");

  const isAuthorable = can(user, "manage_users") || user.isSuperAdmin;
  if (!isAuthorable) throw new Error("FORBIDDEN");

  const invoiceId = payment.invoiceId;
  await prisma.payment.delete({ where: { id: paymentId } });
  if (invoiceId) await recomputeInvoiceStatus(invoiceId);

  revalidatePath("/invoices");
  revalidatePath(`/projects/${payment.projectId}`);
}