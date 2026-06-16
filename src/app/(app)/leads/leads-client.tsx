"use client";

import { useState } from "react";
import { Pencil, Plus, ArrowRightCircle, ChevronDown } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
} from "@/lib/actions";

type Lead = {
  id: string;
  name: string;
  business: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  source: string | null;
  notes: string | null;
  plan: string | null;
  quotedPrice: number | null;
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
      <Field label="Notes" name="notes" defaultValue={lead?.notes} />
    </div>
  );
}

export default function LeadsClient({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const counts = STATUSES.reduce(
    (acc, s) => {
      acc[s] = leads.filter((l) => l.status === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const filtered =
    filter === "ALL" ? leads : leads.filter((l) => l.status === filter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
          <FormDialog
            trigger={
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" /> New lead
              </Button>
            }
            title="New lead"
            action={createContact}
            submitLabel="Add lead"
          >
            <LeadFields />
          </FormDialog>
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
                    <div className="font-medium text-ink">{l.name}</div>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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