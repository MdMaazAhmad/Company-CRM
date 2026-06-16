// src/components/tasks/payments-panel.tsx
// Your existing project-detail payment UI, extracted into a panel for the
// Payments tab. Header/back-link/status pill removed — the tab shell owns those
// now. Everything else (summary, progress, add payment, settle, ledger, notes)
// is your original code, unchanged in behaviour.

"use client";

import { useTransition } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DataCard,
  DataTable,
  Stat,
  ProgressBar,
  ConfirmDelete,
  FormDialog,
  Field,
  SelectField,
  FieldRow,
} from "@/components/crm";
import {
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  PAYMENT_KIND_LABELS,
  PAYMENT_KIND_COLORS,
} from "@/lib/payment-kind";
import { Pill, inr } from "@/lib/ui";
import { addPayment, settleProject, deletePayment } from "@/lib/actions";

type Payment = {
  id: string;
  amount: number;
  kind: string;
  method: string | null;
  note: string | null;
  paidAt: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function PaymentFields({ suggested }: { suggested: number }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="grid gap-4 py-2">
      <FieldRow>
        <Field
          label="Amount (₹)"
          name="amount"
          type="number"
          defaultValue={suggested > 0 ? suggested : undefined}
          required
        />
        <Field label="Date" name="paidAt" type="date" defaultValue={today} />
      </FieldRow>
      <FieldRow>
        <SelectField
          label="Type"
          name="kind"
          defaultValue="PARTIAL"
          options={PAYMENT_KINDS.map((k) => ({ value: k, label: PAYMENT_KIND_LABELS[k] }))}
        />
        <SelectField
          label="Method"
          name="method"
          defaultValue="upi"
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.toUpperCase() }))}
        />
      </FieldRow>
      <Field label="Note" name="note" placeholder="e.g. Advance on signing" />
    </div>
  );
}

function SettleButton({ projectId, balance }: { projectId: string; balance: number }) {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <CheckCircle2 className="h-4 w-4" /> Mark fully paid
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Settle the balance?</AlertDialogTitle>
          <AlertDialogDescription>
            Records a final payment of {inr(balance)} and closes the balance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => start(() => settleProject(projectId))}>
            {pending ? "Settling…" : `Record ${inr(balance)}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PaymentsPanel({
  projectId,
  price,
  payments,
  paid,
  notes,
}: {
  projectId: string;
  price: number | null;
  payments: Payment[];
  paid: number;
  notes: string | null;
}) {
  const value = price ?? 0;
  const balance = value - paid;
  const pct = value > 0 ? Math.min(100, Math.round((paid / value) * 100)) : 0;
  const settled = value > 0 && balance <= 0;

  return (
    <div className="space-y-6">
      {/* summary */}
      <DataCard className="p-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Project value" value={inr(price)} size="lg" />
          <Stat label="Paid so far" value={inr(paid)} color="#16A34A" size="lg" />
          <Stat
            label="Balance due"
            value={settled ? "Cleared" : inr(balance)}
            color={settled ? "#16A34A" : "#FF6B00"}
            size="lg"
          />
        </div>

        <div className="mt-5">
          <ProgressBar pct={pct} done={settled} doneLabel="Fully settled" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <FormDialog
            trigger={
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" /> Add payment
              </Button>
            }
            title="Record a payment"
            action={async (fd) => {
              fd.set("projectId", projectId);
              await addPayment(fd);
            }}
            submitLabel="Record payment"
          >
            <PaymentFields suggested={balance > 0 ? balance : 0} />
          </FormDialog>
          {!settled && value > 0 && <SettleButton projectId={projectId} balance={balance} />}
        </div>
      </DataCard>

      {/* ledger */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Payment history</h2>
        {payments.length === 0 ? (
          <DataCard className="p-10 text-center">
            <p className="text-sm text-faint">No payments yet. Add the advance to start the ledger.</p>
          </DataCard>
        ) : (
          <DataTable
            headers={[
              { label: "Date" },
              { label: "Type" },
              { label: "Method" },
              { label: "Note" },
              { label: "Amount", className: "text-right" },
              { label: "", className: "w-[50px]" },
            ]}
          >
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{fmtDate(p.paidAt)}</TableCell>
                <TableCell>
                  <Pill color={PAYMENT_KIND_COLORS[p.kind] ?? "#94A3B8"} label={PAYMENT_KIND_LABELS[p.kind] ?? p.kind} />
                </TableCell>
                <TableCell className="text-muted">{p.method ? p.method.toUpperCase() : "—"}</TableCell>
                <TableCell className="text-muted">{p.note ?? "—"}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{inr(p.amount)}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <ConfirmDelete
                      onConfirm={() => deletePayment(p.id)}
                      title="Delete this payment?"
                      description="The balance recalculates after removal."
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-line">
              <TableCell colSpan={4} className="font-medium">Total paid</TableCell>
              <TableCell className="text-right font-semibold tabular-nums text-st-converted">{inr(paid)}</TableCell>
              <TableCell />
            </TableRow>
          </DataTable>
        )}
      </div>

      {notes && (
        <DataCard>
          <div className="text-xs uppercase tracking-wide text-faint">Project notes</div>
          <p className="mt-1.5 text-sm text-muted">{notes}</p>
        </DataCard>
      )}
    </div>
  );
}