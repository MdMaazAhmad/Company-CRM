"use client";

import { useTransition } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  EmptyState,
  FormDialog,
  Field,
  SelectField,
} from "@/components/crm";
import {
  createLeadActivity,
  toggleLeadActivity,
  deleteLeadActivity,
} from "@/lib/actions";

type Activity = {
  id: string;
  type: string;
  dueDate: string | null;
  done: boolean;
  outcome: string | null;
  contactName: string;
};
type ContactOption = { id: string; label: string };

const TYPE_META: Record<string, { label: string; color: string }> = {
  CALL: { label: "Call", color: "#2563EB" },
  WHATSAPP: { label: "WhatsApp", color: "#16A34A" },
  EMAIL: { label: "Email", color: "#8B5CF6" },
  MEETING: { label: "Meeting", color: "#DB2777" },
  QUOTE: { label: "Quote", color: "#FF6B00" },
  FOLLOW_UP: { label: "Follow-up", color: "#F59E0B" },
  NOTE: { label: "Note", color: "#94A3B8" },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function ActivityFields({ contacts }: { contacts: ContactOption[] }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="grid gap-4 py-2">
      <SelectField
        label="Contact"
        name="contactId"
        defaultValue={contacts[0]?.id ?? ""}
        options={contacts.map((c) => ({ value: c.id, label: c.label }))}
        required
      />
      <SelectField
        label="Type"
        name="type"
        defaultValue="FOLLOW_UP"
        options={Object.entries(TYPE_META).map(([value, m]) => ({ value, label: m.label }))}
        required
      />
      <Field label="Due date" name="dueDate" type="date" defaultValue={today} />
      <Field label="Note / outcome" name="outcome" placeholder="What to do or what happened" />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const m = TYPE_META[type] ?? TYPE_META.NOTE;
  return (
    <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: `${m.color}1A`, color: m.color }}>
      {m.label}
    </span>
  );
}

function Row({ a }: { a: Activity }) {
  const [pending, start] = useTransition();
  const [delPending, startDel] = useTransition();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <button
        disabled={pending}
        onClick={() => start(() => toggleLeadActivity(a.id, !a.done))}
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
          a.done ? "border-st-converted bg-st-converted text-white" : "border-line hover:border-st-converted"
        }`}
      >
        {a.done && <Check className="h-3.5 w-3.5" />}
      </button>
      <TypeBadge type={a.type} />
      <div className="flex-1">
        <div className={`text-sm font-medium ${a.done ? "text-faint line-through" : "text-ink"}`}>
          {a.contactName}
        </div>
        {a.outcome && <div className="text-xs text-faint">{a.outcome}</div>}
      </div>
      {a.dueDate && <div className="text-xs text-muted">{fmtDate(a.dueDate)}</div>}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={delPending}
        onClick={() => startDel(() => deleteLeadActivity(a.id))}
      >
        <Trash2 className="h-3.5 w-3.5 text-st-dropped" />
      </Button>
    </div>
  );
}

function Group({ title, items, color }: { title: string; items: Activity[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <h2 className="text-sm font-semibold text-ink">
          {title} <span className="font-normal text-faint">({items.length})</span>
        </h2>
      </div>
      <div className="space-y-2">
        {items.map((a) => <Row key={a.id} a={a} />)}
      </div>
    </div>
  );
}

export default function FollowUpsClient({
  activities,
  contacts,
}: {
  activities: Activity[];
  contacts: ContactOption[];
}) {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const open = activities.filter((a) => !a.done);
  const done = activities.filter((a) => a.done);
  const overdue = open.filter((a) => a.dueDate && new Date(a.dueDate) < today);
  const dueToday = open.filter((a) => {
    if (!a.dueDate) return false;
    const d = new Date(a.dueDate);
    return d >= today && d < tomorrow;
  });
  const upcoming = open.filter((a) => !a.dueDate || new Date(a.dueDate) >= tomorrow);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Stay on it"
        title="Lead activities"
        action={
          contacts.length > 0 && (
            <FormDialog
              trigger={<Button className="gap-1.5"><Plus className="h-4 w-4" /> New activity</Button>}
              title="New activity"
              action={createLeadActivity}
              submitLabel="Add"
            >
              <ActivityFields contacts={contacts} />
            </FormDialog>
          )
        }
      />

      {activities.length === 0 ? (
        <EmptyState message="No activities yet. Add one to stay on top of your leads." />
      ) : (
        <div className="space-y-6">
          <Group title="Overdue" items={overdue} color="#DB2777" />
          <Group title="Due today" items={dueToday} color="#F59E0B" />
          <Group title="Upcoming" items={upcoming} color="#2563EB" />
          <Group title="Done" items={done} color="#16A34A" />
        </div>
      )}
    </div>
  );
}