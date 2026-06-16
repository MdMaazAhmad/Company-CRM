"use client";

// src/app/clients/clients-client.tsx
// Table view with search + source/balance filters + move-back-to-lead.

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, FolderKanban, Undo2, Search } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  EmptyState,
  DataTable,
  ContactLinks,
  ConfirmDelete,
  FormDialog,
  Field,
  FieldRow,
} from "@/components/crm";
import { ConfirmAction } from "@/components/crm/confirm-action";
import { inr } from "@/lib/ui";
import { updateContact, deleteContact, revertToLead } from "@/lib/actions";

type Client = {
  id: string;
  name: string;
  business: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  source: string | null;
  notes: string | null;
  projectCount: number;
  value: number;
  paid: number;
};

function ClientFields({ client }: { client: Client }) {
  return (
    <div className="grid gap-4 py-2">
      <FieldRow>
        <Field label="Name" name="name" defaultValue={client.name} required />
        <Field label="Business" name="business" defaultValue={client.business} />
      </FieldRow>
      <FieldRow>
        <Field label="Phone" name="phone" defaultValue={client.phone} />
        <Field label="WhatsApp" name="whatsapp" defaultValue={client.whatsapp} />
      </FieldRow>
      <FieldRow>
        <Field label="Email" name="email" defaultValue={client.email} />
        <Field label="City" name="city" defaultValue={client.city} />
      </FieldRow>
      <Field label="Notes" name="notes" defaultValue={client.notes} />
    </div>
  );
}

const BALANCE_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "OWED", label: "Owed" },
  { value: "CLEARED", label: "Cleared" },
];

export default function ClientsClient({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("ALL");
  const [balance, setBalance] = useState("ALL");

  // distinct sources present in the data
  const sources = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => c.source && set.add(c.source));
    return ["ALL", ...Array.from(set)];
  }, [clients]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (source !== "ALL" && c.source !== source) return false;
      const bal = c.value - c.paid;
      if (balance === "OWED" && bal <= 0) return false;
      if (balance === "CLEARED" && bal > 0) return false;
      if (q) {
        const hay = `${c.name} ${c.business ?? ""} ${c.phone ?? ""} ${
          c.city ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [clients, query, source, balance]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Won"
        title="Clients"
        subtitle={`${clients.length} converted client${
          clients.length === 1 ? "" : "s"
        }`}
      />

      {clients.length === 0 ? (
        <EmptyState message="No clients yet. Convert a lead and it appears here." />
      ) : (
        <>
          {/* search + filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, business, phone, city…"
                className="pl-9"
              />
            </div>

            {/* source chips */}
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    source === s
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-surface text-muted hover:border-ink/30"
                  }`}
                >
                  {s === "ALL" ? "All sources" : s}
                </button>
              ))}
            </div>

            {/* balance chips */}
            <div className="flex gap-1.5">
              {BALANCE_FILTERS.map((b) => {
                const active = balance === b.value;
                const color =
                  b.value === "OWED"
                    ? "#FF6B00"
                    : b.value === "CLEARED"
                    ? "#16A34A"
                    : "#0A0A0A";
                return (
                  <button
                    key={b.value}
                    onClick={() => setBalance(b.value)}
                    className="rounded-full border px-3 py-1 text-xs font-medium transition"
                    style={
                      active
                        ? { background: color, borderColor: color, color: "#fff" }
                        : {
                            borderColor: "var(--color-line)",
                            color: "var(--color-muted)",
                          }
                    }
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {shown.length === 0 ? (
            <EmptyState message="No clients match your filters." />
          ) : (
            <DataTable
              headers={[
                { label: "Client" },
                { label: "Source" },
                { label: "Contact" },
                { label: "Value", className: "text-right" },
                { label: "Paid", className: "text-right" },
                { label: "Balance", className: "text-right" },
                { label: "Projects" },
                { label: "", className: "w-[140px]" },
              ]}
            >
              {shown.map((c) => {
                const bal = c.value - c.paid;
                return (
                  <TableRow
                    key={c.id}
                    className="transition-colors hover:bg-line-soft/60"
                    style={{ boxShadow: "inset 3px 0 0 #16A34A" }}
                  >
                    <TableCell>
                      <div className="font-medium text-ink">{c.name}</div>
                      <div className="text-xs text-faint">
                        {c.business || c.city || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted">
                      {c.source || "—"}
                    </TableCell>
                    <TableCell>
                      <ContactLinks
                        phone={c.phone}
                        whatsapp={c.whatsapp}
                        email={c.email}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {inr(c.value)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-st-converted">
                      {inr(c.paid)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span style={{ color: bal > 0 ? "#FF6B00" : "#16A34A" }}>
                        {bal > 0 ? inr(bal) : "Cleared"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href="/projects"
                        className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand"
                      >
                        <FolderKanban className="h-3.5 w-3.5" />
                        {c.projectCount}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ConfirmAction
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Move back to lead"
                            >
                              <Undo2 className="h-3.5 w-3.5 text-muted" />
                            </Button>
                          }
                          title={`Move ${c.name} back to leads?`}
                          description="The deal reopens as a lead at Negotiating status. Their projects and payments stay intact."
                          confirmLabel="Move to leads"
                          onConfirm={() => revertToLead(c.id)}
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
                          title="Edit client"
                          action={updateContact}
                          submitLabel="Save changes"
                          hiddenId={c.id}
                        >
                          <ClientFields client={c} />
                        </FormDialog>
                        <ConfirmDelete
                          onConfirm={() => deleteContact(c.id)}
                          title="Delete this client?"
                          description="This also removes their projects, payments, and follow-ups."
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </>
      )}
    </div>
  );
}