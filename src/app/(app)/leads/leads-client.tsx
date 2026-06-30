"use client";

import { useState, useTransition } from "react";
import {
  Pencil,
  Plus,
  ArrowRightCircle,
  ChevronDown,
  AlertTriangle,
  Download,
} from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  PageHeader,
  EmptyState,
  DataTable,
  FilterChips,
  ConfirmDelete,
  ContactLinks,
  FormDialog,
  Field,
  SelectField,
  FieldRow,
} from "@/components/crm";
import { ConfirmAction } from "@/components/crm/confirm-action";
import { StatusDialog } from "@/components/crm/status-dialog";
import { STATUSES, STATUS_META } from "@/lib/status";
import { RAIL_COLORS, Pill, inr } from "@/lib/ui";
import {
  createContact,
  updateContact,
  setContactStatus,
  convertContact,
  deleteContact,
  assignContact,
} from "@/lib/actions";

type Member = {
  id: string;
  name: string;
  avatarColor: string;
};

type Lead = {
  id: string;
  name: string;
  business: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  billingAddress: string | null;
  source: string | null;
  notes: string | null;
  plan: string | null;
  quotedPrice: number | null;
  assigneeId: string | null;
  createdAt?: string;
  status: string;
};

const PAGE_SIZE = 10;

const statusOptions = STATUSES.map((s) => ({
  value: s,
  label: STATUS_META[s].label,
  color: RAIL_COLORS[s],
}));

function LeadFields({ lead }: { lead?: Lead }) {
  return (
    <div className="grid gap-4 py-2">
      <FieldRow>
        <Field label="Name" name="name" defaultValue={lead?.name} required />
        <Field label="Business" name="business" defaultValue={lead?.business} />
      </FieldRow>
      <FieldRow>
        <Field label="Phone" name="phone" defaultValue={lead?.phone} />
        <Field label="WhatsApp" name="whatsapp" defaultValue={lead?.whatsapp} />
      </FieldRow>
      <FieldRow>
        <Field label="Email" name="email" defaultValue={lead?.email} />
        <Field label="City" name="city" defaultValue={lead?.city} />
      </FieldRow>
      <FieldRow>
        <Field
          label="Plan"
          name="plan"
          defaultValue={lead?.plan}
          placeholder="e.g. WP Business"
        />
        <Field
          label="Quoted price (₹)"
          name="quotedPrice"
          type="number"
          defaultValue={lead?.quotedPrice}
        />
      </FieldRow>
      <FieldRow>
        <Field
          label="Source"
          name="source"
          defaultValue={lead?.source}
          placeholder="referral / instagram / ad"
        />
        {!lead && (
          <SelectField
            label="Status"
            name="status"
            defaultValue="NEW"
            options={statusOptions}
          />
        )}
      </FieldRow>
      <FieldRow>
        <Field
          label="GSTIN"
          name="gstin"
          defaultValue={lead?.gstin}
          placeholder="07ABEFA2267J1ZG"
        />
        <Field
          label="State"
          name="state"
          defaultValue={lead?.state}
          placeholder="Delhi / Maharashtra"
        />
      </FieldRow>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-ink">
          Billing address{" "}
          <span className="font-normal text-muted">
            (one line per row — used on invoices)
          </span>
        </label>
        <textarea
          name="billingAddress"
          rows={3}
          defaultValue={lead?.billingAddress ?? ""}
          placeholder={"Shop 12, MG Road\nNew Delhi 110001"}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <Field label="Notes" name="notes" defaultValue={lead?.notes} />
    </div>
  );
}

function DuplicateModal({
  dup,
  onClose,
}: {
  dup: { id: string; name: string; stage: string };
  onClose: () => void;
}) {
  const where = dup.stage === "CLIENT" ? "client" : "lead";
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-st-quoted" />
            Lead already exists
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted">
          <span className="font-medium text-ink">{dup.name}</span> is already in
          your system as a {where} (same phone or email). Open that record and
          add a new project instead of creating a duplicate.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <NextLink href={`/leads/${dup.id}`}>
            <Button>Open existing {where}</Button>
          </NextLink>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewLeadDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [dup, setDup] = useState<{
    id: string;
    name: string;
    stage: string;
  } | null>(null);

  function submit(fd: FormData) {
    start(async () => {
      try {
        const res = await createContact(fd);
        if (res.ok) {
          setOpen(false);
        } else {
          setOpen(false);
          setDup(res.duplicate);
        }
      } catch (e: any) {
        alert(e?.message ?? "Failed to add lead.");
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> New lead
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New lead</DialogTitle>
          </DialogHeader>
          <form action={submit}>
            <LeadFields />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Adding…" : "Add lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {dup && <DuplicateModal dup={dup} onClose={() => setDup(null)} />}
    </>
  );
}

function AssigneeSelect({
  leadId,
  assigneeId,
  members,
}: {
  leadId: string;
  assigneeId: string | null;
  members: Member[];
}) {
  const [pending, start] = useTransition();
  const current = members.find((m) => m.id === assigneeId);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value || null;
    start(async () => {
      try {
        await assignContact(leadId, v);
      } catch (err: any) {
        alert(err?.message ?? "Failed to assign.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
        style={{ background: current?.avatarColor ?? "#CBD5E1" }}
      >
        {current
          ? current.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          : "—"}
      </span>
      <select
        value={assigneeId ?? ""}
        onChange={onChange}
        disabled={pending}
        className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-brand focus:outline-none disabled:opacity-50"
      >
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function LeadsClient({
  leads,
  members,
}: {
  leads: Lead[];
  members: Member[];
}) {
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const counts = STATUSES.reduce(
    (acc, s) => {
      acc[s] = leads.filter((l) => l.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const filtered =
    filter === "ALL" ? leads : leads.filter((l) => l.status === filter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const shown = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function changeFilter(v: string) {
    setFilter(v);
    setPage(1);
  }

  const chips = STATUSES.map((s) => ({
    value: s,
    label: STATUS_META[s].label,
    count: counts[s],
    color: RAIL_COLORS[s],
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        subtitle={`${leads.length} prospect${
          leads.length === 1 ? "" : "s"
        } in the funnel`}
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="gap-1.5">
              <NextLink href="/api/leads/export" prefetch={false}>
                <Download className="h-4 w-4" /> Export
              </NextLink>
            </Button>
            <NewLeadDialog />
          </div>
        }
      />

      <FilterChips
        active={filter}
        onChange={changeFilter}
        allCount={leads.length}
        chips={chips}
      />

      {shown.length === 0 ? (
        <EmptyState
          message={
            leads.length === 0
              ? "No leads yet. Add your first prospect."
              : "No leads in this stage."
          }
        />
      ) : (
        <>
          <DataTable
            headers={[
              { label: "Lead" },
              { label: "Status" },
              { label: "Owner" },
              { label: "Plan" },
              { label: "Quote" },
              { label: "Added" },
              { label: "Contact" },
              { label: "", className: "w-[210px]" },
            ]}
          >
            {shown.map((l) => {
              const color = RAIL_COLORS[l.status] ?? "#94A3B8";
              return (
                <TableRow
                  key={l.id}
                  className="transition-colors hover:bg-line-soft/60"
                  style={{ boxShadow: `inset 3px 0 0 ${color}` }}
                >
                  <TableCell>
                    <NextLink
                      href={`/leads/${l.id}`}
                      className="font-medium text-ink hover:text-brand hover:underline"
                    >
                      {l.name}
                    </NextLink>
                    <div className="text-xs text-faint">
                      {l.business || l.city || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusDialog
                      current={l.status}
                      options={statusOptions}
                      onApply={(v) => setContactStatus(l.id, v)}
                      trigger={
                        <button className="inline-flex items-center gap-1">
                          <Pill
                            color={color}
                            label={
                              STATUS_META[l.status as keyof typeof STATUS_META]
                                ?.label ?? l.status
                            }
                          />
                          <ChevronDown className="h-3 w-3 text-faint" />
                        </button>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <AssigneeSelect
                      leadId={l.id}
                      assigneeId={l.assigneeId}
                      members={members}
                    />
                  </TableCell>
                  <TableCell className="text-muted">{l.plan || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inr(l.quotedPrice)}
                  </TableCell>
                  <TableCell className="text-muted">
                    {l.createdAt || "—"}
                  </TableCell>
                  <TableCell>
                    <ContactLinks phone={l.phone} whatsapp={l.whatsapp} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ConfirmAction
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                          >
                            <ArrowRightCircle className="h-3.5 w-3.5" />
                            Convert
                          </Button>
                        }
                        title={`Convert ${l.name} to a client?`}
                        description="This marks the lead as won and moves it to your Clients list. You can move it back later if needed."
                        confirmLabel="Convert to client"
                        onConfirm={() => convertContact(l.id)}
                      />
                      <FormDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                        title="Edit lead"
                        action={updateContact}
                        submitLabel="Save changes"
                        hiddenId={l.id}
                      >
                        <LeadFields lead={l} />
                      </FormDialog>
                      <ConfirmDelete
                        onConfirm={() => deleteContact(l.id)}
                        title="Delete this lead?"
                        description="This removes the contact and its projects and follow-ups."
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="text-faint">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-faint tabular-nums">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
