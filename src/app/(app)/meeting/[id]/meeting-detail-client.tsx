"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Trash2, MessageSquarePlus, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/crm";
import { Pill as UIPill } from "@/lib/ui";
import {
  setMeetingSummary,
  setMeetingStatus,
  deleteMeeting,
  addMeetingNote,
  deleteMeetingNote,
} from "@/lib/meeting-actions";

type Note = { id: string; body: string; authorName: string | null; createdAt: string };
type Meeting = {
  id: string; title: string; startAt: string; endAt: string | null;
  location: string | null; link: string | null; status: string; outcome: string | null;
  summary: string | null; transcriptUrl: string | null; hostName: string | null;
  contactId: string; contactName: string; contactEmail: string | null;  notes: Note[];
};

const MTG_STATUS: Record<string, string> = { SCHEDULED: "#2563EB", DONE: "#16A34A", CANCELLED: "#94A3B8" };
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function SummaryDialog({ meetingId, current }: { meetingId: string; current: string }) {
  return (
    <FormDialog
      trigger={current ? <button className="text-xs text-brand hover:underline">Edit</button>
        : <Button variant="outline" size="sm" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Add summary</Button>}
      title="Meeting summary"
      action={setMeetingSummary}
      submitLabel="Save"
      hiddenId={meetingId}
    >
      <div className="grid gap-2 py-2">
        <label className="text-sm font-medium text-ink">Paste summary from tl;dv</label>
        <textarea name="summary" defaultValue={current} rows={10}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
          placeholder="Paste the AI summary here…" />
      </div>
    </FormDialog>
  );
}

function EmailInviteButton({ m }: { m: Meeting }) {
    if (!m.contactEmail) {
      return <span className="text-xs text-faint">Add an email to this lead to send invites.</span>;
    }
    const when = new Date(m.startAt).toLocaleString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const subject = `Meeting: ${m.title}`;
    const lines = [
      `Hi ${m.contactName},`,
      ``,
      `This is a confirmation for our upcoming meeting.`,
      ``,
      `Title: ${m.title}`,
      `When: ${when}`,
      m.location ? `Where: ${m.location}` : "",
      m.link ? `Join link: ${m.link}` : "",
      ``,
      `Looking forward to speaking with you.`,
    ].filter(Boolean);
    const href = `mailto:${m.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    return (
      <a href={href}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-line-soft">
        <Mail className="h-4 w-4" /> Email invite to client
      </a>
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
    start(async () => { try { await addMeetingNote(fd); setBody(""); } catch (e: any) { alert(e?.message ?? "Failed."); } });
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

export default function MeetingDetailClient({ meeting: m }: { meeting: Meeting }) {
  const [pending, start] = useTransition();
  const color = MTG_STATUS[m.status] ?? "#94A3B8";
  function setStatus(s: string) {
    const outcome = s === "DONE" ? (prompt("Outcome (optional)") ?? undefined) : undefined;
    start(() => setMeetingStatus(m.id, s, outcome));
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/leads/${m.contactId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {m.contactName}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-ink">{m.title}</h1>
            <UIPill color={color} label={m.status} />
          </div>
          <div className="mt-1 text-sm text-faint">
            {fmtDateTime(m.startAt)}{m.endAt ? ` – ${new Date(m.endAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
            {m.hostName ? ` · ${m.hostName}` : ""}
          </div>
          {(m.location || m.link) && (
            <div className="mt-0.5 text-xs text-faint">
              {m.location}{m.location && m.link ? " · " : ""}
              {m.link && <a href={m.link} target="_blank" className="text-brand hover:underline">link</a>}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {m.status !== "DONE" && <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("DONE")}>Mark done</Button>}
        {m.status !== "CANCELLED" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("CANCELLED")}>Cancel</Button>}
        {m.status !== "SCHEDULED" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("SCHEDULED")}>Reopen</Button>}
      </div>
      <EmailInviteButton m={m} />

      {m.outcome && (
        <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Outcome</div>
          {m.outcome}
        </div>
      )}

      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">Summary</span>
          <SummaryDialog meetingId={m.id} current={m.summary ?? ""} />
        </div>
        {m.summary ? (
          <div className="whitespace-pre-line text-sm leading-relaxed text-ink">{m.summary}</div>
        ) : (
          <p className="text-sm text-faint">No summary yet. Paste one from your meeting tool.</p>
        )}
        {m.transcriptUrl && (
          <a href={m.transcriptUrl} target="_blank" className="mt-2 block text-xs text-brand hover:underline">View full transcript →</a>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Discussion</h2>
        <div className="space-y-2">
          {m.notes.length === 0 && <p className="text-sm text-faint">No notes yet.</p>}
          {m.notes.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-2 text-sm">
              <div>
                <span className="text-ink">{n.body}</span>
                <span className="ml-2 text-xs text-faint">{n.authorName ?? "—"} · {fmtDateTime(n.createdAt)}</span>
              </div>
              <button onClick={() => deleteMeetingNote(n.id)} className="text-faint hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="pt-2"><NoteForm meetingId={m.id} /></div>
        </div>
      </div>

      <div className="pt-2">
        <Button size="sm" variant="ghost" className="text-st-dropped" disabled={pending}
          onClick={() => { if (confirm("Delete meeting?")) start(() => deleteMeeting(m.id)); }}>
          Delete meeting
        </Button>
      </div>
    </div>
  );
}