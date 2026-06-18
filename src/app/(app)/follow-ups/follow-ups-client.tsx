"use client";

// src/app/follow-ups/follow-ups-client.tsx
// Rebuilt on the shared CRM components.

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
  createFollowUp,
  toggleFollowUp,
  deleteFollowUp,
} from "@/lib/actions";

type FollowUp = {
  id: string;
  dueDate: string;
  done: boolean;
  note: string | null;
  contactName: string;
};
type ContactOption = { id: string; label: string };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function FollowUpFields({ contacts }: { contacts: ContactOption[] }) {
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
      <Field
        label="Due date"
        name="dueDate"
        type="date"
        defaultValue={today}
        required
      />
      <Field label="Note" name="note" placeholder="What to follow up on" />
    </div>
  );
}

function Row({ f }: { f: FollowUp }) {
  const [pending, start] = useTransition();
  const [delPending, startDel] = useTransition();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <button
        disabled={pending}
        onClick={() => start(() => toggleFollowUp(f.id, !f.done))}
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
          f.done
            ? "border-st-converted bg-st-converted text-white"
            : "border-line hover:border-st-converted"
        }`}
      >
        {f.done && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1">
        <div
          className={`text-sm font-medium ${
            f.done ? "text-faint line-through" : "text-ink"
          }`}
        >
          {f.contactName}
        </div>
        {f.note && <div className="text-xs text-faint">{f.note}</div>}
      </div>
      <div className="text-xs text-muted">{fmtDate(f.dueDate)}</div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={delPending}
        onClick={() => startDel(() => deleteFollowUp(f.id))}
      >
        <Trash2 className="h-3.5 w-3.5 text-st-dropped" />
      </Button>
    </div>
  );
}

function Group({
  title,
  items,
  color,
}: {
  title: string;
  items: FollowUp[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <h2 className="text-sm font-semibold text-ink">
          {title}{" "}
          <span className="font-normal text-faint">({items.length})</span>
        </h2>
      </div>
      <div className="space-y-2">
        {items.map((f) => (
          <Row key={f.id} f={f} />
        ))}
      </div>
    </div>
  );
}

export default function FollowUpsClient({
  followUps,
  contacts,
}: {
  followUps: FollowUp[];
  contacts: ContactOption[];
}) {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const open = followUps.filter((f) => !f.done);
  const done = followUps.filter((f) => f.done);
  const overdue = open.filter((f) => new Date(f.dueDate) < today);
  const dueToday = open.filter((f) => {
    const d = new Date(f.dueDate);
    return d >= today && d < tomorrow;
  });
  const upcoming = open.filter((f) => new Date(f.dueDate) >= tomorrow);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Stay on it"
        title="Follow-ups"
        action={
          contacts.length > 0 && (
            <FormDialog
              trigger={
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" /> New follow-up
                </Button>
              }
              title="New follow-up"
              action={createFollowUp}
              submitLabel="Add"
            >
              <FollowUpFields contacts={contacts} />
            </FormDialog>
          )
        }
      />

      {followUps.length === 0 ? (
        <EmptyState message="No follow-ups yet. Add one to stay on top of your pipeline." />
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