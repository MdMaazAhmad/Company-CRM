"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, RefreshCw, Ban, Download } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  EmptyState,
  DataTable,
  FormDialog,
  Field,
  SelectField,
  FieldRow,
} from "@/components/crm";
import { Pill, inr } from "@/lib/ui";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/billing";
import { PAYMENT_METHODS } from "@/lib/payment-kind";
import {
  generateDueInvoices,
  payInvoice,
  voidInvoice,
} from "@/lib/invoice-actions";

type InvoiceRow = {
  id: string;
  number: string;
  amount: number;
  dueDate: string;
  periodLabel: string;
  status: string;
  issuedAt: string;
  projectId: string;
  projectName: string;
  clientName: string;
  paid: number;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function GenerateButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run() {
    setMsg(null);
    start(async () => {
      try {
        const n = await generateDueInvoices();
        setMsg(n === 0 ? "Already up to date — nothing due." : `Generated ${n} invoice${n === 1 ? "" : "s"}.`);
      } catch (e: any) {
        setMsg(e?.message ?? "Failed to generate.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-sm text-muted">{msg}</span>}
      <Button onClick={run} disabled={pending} className="gap-1.5">
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Generating…" : "Generate due invoices"}
      </Button>
    </div>
  );
}

function PayFields({ balance }: { balance: number }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="grid gap-4 py-2">
      <FieldRow>
        <Field
          label="Amount (₹)"
          name="amount"
          type="number"
          defaultValue={balance > 0 ? balance : undefined}
          required
        />
        <Field label="Date" name="paidAt" type="date" defaultValue={today} />
      </FieldRow>
      <SelectField
        label="Method"
        name="method"
        defaultValue="upi"
        options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.toUpperCase() }))}
      />
      <Field label="Note" name="note" placeholder="e.g. June retainer" />
    </div>
  );
}

function VoidButton({ invoiceId }: { invoiceId: string }) {
  const [pending, start] = useTransition();
  function run() {
    if (!confirm("Void this invoice? It stays on record but is cancelled.")) return;
    const fd = new FormData();
    fd.set("invoiceId", invoiceId);
    start(async () => {
      try { await voidInvoice(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending} onClick={run} title="Void">
      <Ban className="h-3.5 w-3.5 text-st-dropped" />
    </Button>
  );
}

export default function InvoicesClient({
  invoices,
  hasRecurring,
}: {
  invoices: InvoiceRow[];
  hasRecurring: boolean;
}) {
  const totalUnpaid = invoices
    .filter((i) => i.status === "UNPAID" || i.status === "PARTIAL")
    .reduce((s, i) => s + (i.amount - i.paid), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        subtitle="Recurring invoices for monthly retainers — marketing, video, and performance projects."
        action={hasRecurring ? <GenerateButton /> : undefined}
      />

      {!hasRecurring && invoices.length === 0 ? (
        <EmptyState message="No recurring projects yet. Set a project's billing to Monthly to start generating invoices." />
      ) : invoices.length === 0 ? (
        <EmptyState message="No invoices yet. Click “Generate due invoices” once a billing cycle has arrived." />
      ) : (
        <>
          <div className="flex flex-wrap gap-6 rounded-2xl border border-line bg-surface p-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">Total outstanding</div>
              <div className="font-heading text-2xl tabular-nums" style={{ color: totalUnpaid > 0 ? "#FF6B00" : "#16A34A" }}>
                {inr(totalUnpaid)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">Invoices</div>
              <div className="font-heading text-2xl text-ink tabular-nums">{invoices.length}</div>
            </div>
          </div>

          <DataTable
            headers={[
              { label: "Invoice" },
              { label: "Project / Client" },
              { label: "Period" },
              { label: "Due" },
              { label: "Status" },
              { label: "Amount", className: "text-right" },
              { label: "Balance", className: "text-right" },
              { label: "", className: "w-[150px]" },
            ]}
          >
            {invoices.map((inv) => {
              const balance = inv.amount - inv.paid;
              const color = INVOICE_STATUS_COLORS[inv.status] ?? "#94A3B8";
              const overdue =
                inv.status !== "PAID" && inv.status !== "VOID" && new Date(inv.dueDate) < new Date();
              return (
                <TableRow key={inv.id} className="hover:bg-line-soft/60" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
                  <TableCell className="font-medium tabular-nums">{inv.number}</TableCell>
                  <TableCell>
                    <Link href={`/projects/${inv.projectId}`} className="font-medium text-ink hover:text-brand hover:underline">
                      {inv.projectName}
                    </Link>
                    <div className="text-xs text-muted">{inv.clientName}</div>
                  </TableCell>
                  <TableCell className="text-muted">{inv.periodLabel}</TableCell>
                  <TableCell>
                    <span style={{ color: overdue ? "#DB2777" : "inherit" }}>{fmtDate(inv.dueDate)}</span>
                  </TableCell>
                  <TableCell>
                    <Pill color={color} label={INVOICE_STATUS_LABELS[inv.status] ?? inv.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{inr(inv.amount)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span style={{ color: balance > 0 ? "#FF6B00" : "#16A34A" }}>
                      {balance > 0 ? inr(balance) : "Cleared"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <a href={`/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Download PDF">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      {inv.status !== "PAID" && inv.status !== "VOID" && (
                        <FormDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Record payment">
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          }
                          title={`Record payment — ${inv.number}`}
                          action={async (fd) => {
                            fd.set("invoiceId", inv.id);
                            await payInvoice(fd);
                          }}
                          submitLabel="Record payment"
                        >
                          <PayFields balance={balance} />
                        </FormDialog>
                      )}
                      {inv.status !== "VOID" && inv.paid === 0 && <VoidButton invoiceId={inv.id} />}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        </>
      )}
    </div>
  );
}