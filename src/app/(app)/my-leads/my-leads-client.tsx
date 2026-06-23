"use client";

import NextLink from "next/link";
import { CheckCircle2, CalendarClock, Plus } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  EmptyState,
  DataTable,
  ContactLinks,
  FormDialog,
  Field,
} from "@/components/crm";
import { RAIL_COLORS, Pill, inr } from "@/lib/ui";
import { STATUS_META } from "@/lib/status";
import { setNextAction, clearNextAction } from "@/lib/actions";

type Lead = {
  id: string;
  name: string;
  business: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  plan: string | null;
  quotedPrice: number | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function NextActionFields({ lead }: { lead: Lead }) {
  const val = lead.nextActionAt ? lead.nextActionAt.slice(0, 10) : "";
  return (
    <div className="grid gap-4 py-2">
      <Field label="Next action date" name="nextActionAt" type="date" defaultValue={val} />
      <Field
        label="What's the action?"
        name="nextActionNote"
        defaultValue={lead.nextActionNote ?? ""}
        placeholder="e.g. Call to confirm quote"
      />
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const color = RAIL_COLORS[lead.status] ?? "#94A3B8";
  return (
    <TableRow className="hover:bg-line-soft/60" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <TableCell>
        <NextLink href={`/leads/${lead.id}`} className="font-medium text-ink hover:text-brand hover:underline">
          {lead.name}
        </NextLink>
        <div className="text-xs text-faint">{lead.business || "—"}</div>
      </TableCell>
      <TableCell>
        <Pill color={color} label={STATUS_META[lead.status as keyof typeof STATUS_META]?.label ?? lead.status} />
      </TableCell>
      <TableCell className="text-muted">
        {lead.nextActionNote || <span className="text-faint">—</span>}
        {lead.nextActionAt && (
          <div className="text-xs text-faint">{fmt(lead.nextActionAt)}</div>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{inr(lead.quotedPrice)}</TableCell>
      <TableCell>
        <ContactLinks phone={lead.phone} whatsapp={lead.whatsapp} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <FormDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Set next action">
                <CalendarClock className="h-3.5 w-3.5" />
              </Button>
            }
            title={`Next action — ${lead.name}`}
            action={async (fd) => {
              fd.set("id", lead.id);
              await setNextAction(fd);
            }}
            submitLabel="Save"
          >
            <NextActionFields lead={lead} />
          </FormDialog>
          {lead.nextActionAt && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Mark action done"
              onClick={() => clearNextAction(lead.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-st-converted" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function Group({ title, leads, tone }: { title: string; leads: Lead[]; tone?: string }) {
  if (leads.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className={`text-sm font-semibold ${tone ?? "text-ink"}`}>
        {title} <span className="text-faint">({leads.length})</span>
      </div>
      <DataTable
        headers={[
          { label: "Lead" },
          { label: "Status" },
          { label: "Next action" },
          { label: "Quote", className: "text-right" },
          { label: "Contact" },
          { label: "", className: "w-[100px]" },
        ]}
      >
        {leads.map((l) => <LeadRow key={l.id} lead={l} />)}
      </DataTable>
    </div>
  );
}

export default function MyLeadsClient({ leads }: { leads: Lead[] }) {
  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday); startTomorrow.setDate(startToday.getDate() + 1);

  const overdue: Lead[] = [];
  const today: Lead[] = [];
  const upcoming: Lead[] = [];
  const noAction: Lead[] = [];

  for (const l of leads) {
    if (!l.nextActionAt) { noAction.push(l); continue; }
    const d = new Date(l.nextActionAt);
    if (d < startToday) overdue.push(l);
    else if (d < startTomorrow) today.push(l);
    else upcoming.push(l);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Sales"
        title="My Leads"
        subtitle={`${leads.length} lead${leads.length === 1 ? "" : "s"} assigned to you`}
      />

      {leads.length === 0 ? (
        <EmptyState message="No leads assigned to you yet. Assign yourself a lead from the Leads page." />
      ) : (
        <>
          <Group title="Overdue" leads={overdue} tone="text-st-negotiating" />
          <Group title="Today" leads={today} tone="text-st-followup" />
          <Group title="Upcoming" leads={upcoming} />
          <Group title="No next action set" leads={noAction} tone="text-muted" />
        </>
      )}
    </div>
  );
}