// src/app/(app)/invoices/page.tsx
import { requireOrg } from "@/lib/session";
import { getInvoices, countRecurringProjects } from "@/lib/invoice-queries";
import InvoicesClient from "./invoices-client";

export default async function InvoicesPage() {
  const { orgId } = await requireOrg();

  const [invoices, recurringCount] = await Promise.all([
    getInvoices(orgId),
    countRecurringProjects(orgId),
  ]);

  return <InvoicesClient invoices={invoices} hasRecurring={recurringCount > 0} />;
}