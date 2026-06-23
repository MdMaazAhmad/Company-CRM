"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Plus, FileText, CalendarPlus, Trash2, Check, MessageSquarePlus, CalendarClock, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog, Field, FieldRow, SelectField, ContactLinks } from "@/components/crm";
import { STATUS_META } from "@/lib/status";
import { RAIL_COLORS, Pill, inr } from "@/lib/ui";
import { createLeadActivity, toggleLeadActivity, deleteLeadActivity, assignContact, setNextAction, clearNextAction } from "@/lib/actions";
import {
  createMeeting,
  setMeetingStatus,
  deleteMeeting,
  addMeetingNote,
  setMeetingSummary,
  deleteMeetingNote,
} from "@/lib/meeting-actions";

type Member = { id: string; name: string; avatarColor: string };
type Activity = { id: string; type: string; dueDate: string | null; done: boolean; outcome: string | null; createdAt: string };
type Note = { id: string; body: string; authorName: string | null; createdAt: string };
type Meeting = {
    id: string; title: string; startAt: string; endAt: string | null;
    location: string | null; link: string | null; status: string; outcome: string | null;
    hostName: string | null; notes: Note[];
    summary: string | null; transcriptUrl: string | null;
  };
type Lead = {
  id: string; name: string; business: string | null; phone: string | null; whatsapp: string | null;
  email: string | null; city: string | null; source: string | null; plan: string | null;
  quotedPrice: number | null; notes: string | null; stage: string; status: string; createdAt: string;
  assigneeId: string | null; assigneeName: string | null; assigneeColor: string | null;
  nextActionAt: string | null; nextActionNote: string | null;
  activities: Activity[]; meetings: Meeting[];
};

const ACT_TYPE: Record<string, { label: string; color: string }> = {
  CALL: { label: "Call", color: "#2563EB" },
  WHATSAPP: { label: "WhatsApp", color: "#16A34A" },
  EMAIL: { label: "Email", color: "#8B5CF6" },
  MEETING: { label: "Meeting", color: "#DB2777" },
  QUOTE: { label: "Quote", color: "#FF6B00" },
  FOLLOW_UP: { label: "Follow-up", color: "#F59E0B" },
  NOTE: { label: "Note", color: "#94A3B8" },
};
const MTG_STATUS: Record<string, string> = { SCHEDULED: "#2563EB", DONE: "#16A34A", CANCELLED: "#94A3B8" };

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function OwnerPanel({ leadId, assigneeId, assigneeName, assigneeColor, members }: {
  leadId: string; assigneeId: string | null; assigneeName: string | null; assigneeColor: string | null; members: Member[];
}) {
  const [pending, start] = useTransition();
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value || null;
    start(async () => {
      try { await assignContact(leadId, v); } catch (err: any) { alert(err?.message ?? "Failed."); }
    });
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: assigneeName ? assigneeColor ?? "#CBD5E1" : "#E2E8F0" }}>
        {assigneeName ? initials(assigneeName) : <User className="h-4 w-4 text-slate-400" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted">Owner</div>
        <select value={assigneeId ?? ""} onChange={onChange} disabled={pending}
          className="-ml-0.5 w-full bg-transparent text-sm font-medium text-ink focus:outline-none disabled:opacity-50">
          <option value="">Unassigned</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function NextActionPanel({ lead }: { lead: Lead }) {
  const [pending, start] = useTransition();

  let tone = "#94A3B8";
  let label = "Upcoming";
  if (lead.nextActionAt) {
    const d = new Date(lead.nextActionAt);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (d < today) { tone = "#DB2777"; label = "Overdue"; }
    else if (d < tomorrow) { tone = "#F59E0B"; label = "Today"; }
    else { tone = "#16A34A"; label = "Upcoming"; }
  }
  const dateVal = lead.nextActionAt ? lead.nextActionAt.slice(0, 10) : "";

  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ boxShadow: lead.nextActionAt ? `inset 3px 0 0 ${tone}` : undefined }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: lead.nextActionAt ? `${tone}1A` : "#F1F5F9" }}>
        <CalendarClock className="h-4 w-4" style={{ color: lead.nextActionAt ? tone : "#94A3B8" }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted">Next action</div>
        {lead.nextActionAt ? (
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium text-ink">{lead.nextActionNote || "—"}</span>
            <span className="shrink-0 text-xs" style={{ color: tone }}>{label} · {fmtDate(lead.nextActionAt)}</span>
          </div>
        ) : (
          <div className="text-sm text-faint">None set</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <FormDialog
          trigger={<button className="rounded-md p-1.5 text-faint hover:bg-line-soft hover:text-brand" title="Set next action"><CalendarClock className="h-4 w-4" /></button>}
          title={`Next action — ${lead.name}`}
          action={async (fd) => { fd.set("id", lead.id); await setNextAction(fd); }}
          submitLabel="Save"
        >
          <div className="grid gap-4 py-2">
            <Field label="Next action date" name="nextActionAt" type="date" defaultValue={dateVal} />
            <Field label="What's the action?" name="nextActionNote" defaultValue={lead.nextActionNote ?? ""} placeholder="e.g. Call to confirm quote" />
          </div>
        </FormDialog>
        {lead.nextActionAt && (
          <button disabled={pending} onClick={() => start(() => clearNextAction(lead.id))}
            className="rounded-md p-1.5 text-faint hover:bg-line-soft hover:text-st-converted" title="Mark done">
            <CheckCircle2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wide text-faint">{label}</div>
      <div className="truncate text-sm text-ink">{value}</div>
    </div>
  );
}

function ActivityDialog({ contactId }: { contactId: string }) {
  return (
    <FormDialog
      trigger={<Button variant="outline" size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Log activity</Button>}
      title="Log activity"
      action={createLeadActivity}
      submitLabel="Add"
      hiddenId={contactId}
      hiddenIdName="contactId"
    >
      <div className="grid gap-4 py-2">
        <SelectField label="Type" name="type" defaultValue="CALL"
          options={Object.entries(ACT_TYPE).map(([value, m]) => ({ value, label: m.label }))} required />
        <Field label="Due date (optional)" name="dueDate" type="date" />
        <Field label="Note / outcome" name="outcome" placeholder="What happened or what to do" />
      </div>
    </FormDialog>
  );
}

function SummaryDialog({ meetingId, current }: { meetingId: string; current: string }) {
    return (
      <FormDialog
        trigger={
          current
            ? <button className="text-xs text-brand hover:underline">Edit</button>
            : <Button variant="outline" size="sm" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Add summary</Button>
        }
        title="Meeting summary"
        action={setMeetingSummary}
        submitLabel="Save"
        hiddenId={meetingId}
      >
        <div className="grid gap-2 py-2">
          <label className="text-sm font-medium text-ink">Paste summary from tl;dv</label>
          <textarea
            name="summary"
            defaultValue={current}
            rows={6}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            placeholder="Paste the AI summary from your meeting tool here…"
          />
        </div>
      </FormDialog>
    );
  }

function MeetingDialog({ contactId }: { contactId: string }) {
  return (
    <FormDialog
      trigger={<Button size="sm" className="gap-1.5"><CalendarPlus className="h-4 w-4" /> Schedule meeting</Button>}
      title="Schedule meeting"
      action={createMeeting}
      submitLabel="Schedule"
      hiddenId={contactId}
      hiddenIdName="contactId"
    >
      <div className="grid gap-4 py-2">
        <Field label="Title" name="title" placeholder="Discovery call" required />
        <FieldRow>
          <Field label="Start" name="startAt" type="datetime-local" required />
          <Field label="End (optional)" name="endAt" type="datetime-local" />
        </FieldRow>
        <FieldRow>
          <Field label="Location" name="location" placeholder="Office / Zoom" />
          <Field label="Link" name="link" placeholder="https://meet…" />
        </FieldRow>
      </div>
    </FormDialog>
  );
}

function NoteForm({ meetingId }: { meetingId: string }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  function submit() {
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("meetingId", meetingId);
    fd.set("body", body);
    start(async () => {
      try { await addMeetingNote(fd); setBody(""); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <div className="flex items-center gap-2">
      <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add to discussion…"
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm focus:border-brand focus:outline-none" />
      <Button size="sm" variant="outline" disabled={pending} onClick={submit} className="gap-1">
        <MessageSquarePlus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}

function MeetingCard({ m }: { m: Meeting }) {
    const color = MTG_STATUS[m.status] ?? "#94A3B8";
    return (
      <Link
        href={`/meeting/${m.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-line-soft/40"
        style={{ boxShadow: `inset 3px 0 0 ${color}` }}
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{m.title}</div>
          <div className="text-xs text-muted">
            {fmtDateTime(m.startAt)}{m.hostName ? ` · ${m.hostName}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {m.summary && <FileText className="h-3.5 w-3.5 text-brand" />}
          <Pill color={color} label={m.status} />
        </div>
      </Link>
    );
  }

function ActivityRow({ a }: { a: Activity }) {
  const [pending, start] = useTransition();
  const m = ACT_TYPE[a.type] ?? ACT_TYPE.NOTE;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
      <button disabled={pending} onClick={() => start(() => toggleLeadActivity(a.id, !a.done))}
        className={`flex h-4 w-4 items-center justify-center rounded border transition ${a.done ? "border-st-converted bg-st-converted text-white" : "border-line"}`}>
        {a.done && <Check className="h-3 w-3" />}
      </button>
      <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${m.color}1A`, color: m.color }}>{m.label}</span>
      <div className="flex-1 text-sm">
        <span className={a.done ? "text-faint line-through" : "text-ink"}>{a.outcome || m.label}</span>
      </div>
      <span className="text-xs text-faint">{a.dueDate ? fmtDate(a.dueDate) : fmtDate(a.createdAt)}</span>
      <button onClick={() => deleteLeadActivity(a.id)} className="text-faint hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export default function LeadDetailClient({ lead, members }: { lead: Lead; members: Member[] }) {
  const statusColor = RAIL_COLORS[lead.status] ?? "#94A3B8";
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All leads
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-ink">{lead.name}</h1>
            <Pill color={statusColor} label={STATUS_META[lead.status as keyof typeof STATUS_META]?.label ?? lead.status} />
          </div>
          <div className="mt-1 text-sm text-faint">
            {[lead.business, lead.city].filter(Boolean).join(" · ") || "—"} · added {fmtDate(lead.createdAt)}
          </div>
        </div>
        <ContactLinks phone={lead.phone} whatsapp={lead.whatsapp} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <OwnerPanel
            leadId={lead.id}
            assigneeId={lead.assigneeId}
            assigneeName={lead.assigneeName}
            assigneeColor={lead.assigneeColor}
            members={members}
          />
          <NextActionPanel lead={lead} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line bg-line-soft/30 px-4 py-3 sm:grid-cols-4">
          <MetaItem label="Plan" value={lead.plan || "—"} />
          <MetaItem label="Quote" value={inr(lead.quotedPrice)} />
          <MetaItem label="Source" value={lead.source || "—"} />
          <MetaItem label="Email" value={lead.email || "—"} />
        </div>
      </div>

      {lead.notes && (
        <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink">{lead.notes}</div>
      )}

      <div className="flex flex-wrap gap-2">
        <ActivityDialog contactId={lead.id} />
        <MeetingDialog contactId={lead.id} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-ink">Meetings</h2>
          {lead.meetings.length === 0 ? (
            <p className="text-sm text-faint">No meetings scheduled.</p>
          ) : lead.meetings.map((m) => <MeetingCard key={m.id} m={m} />)}
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-ink">Activity</h2>
          {lead.activities.length === 0 ? (
            <p className="text-sm text-faint">No activity yet.</p>
          ) : lead.activities.map((a) => <ActivityRow key={a.id} a={a} />)}
        </div>
      </div>
    </div>
  );
}