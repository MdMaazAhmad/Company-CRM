"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/crm";

type Meeting = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
  location: string | null;
  link: string | null;
  contactId: string;
  contactName: string;
  hostId: string | null;
  hostName: string | null;
};

const STATUS_COLOR: Record<string, string> = { SCHEDULED: "#2563EB", DONE: "#16A34A", CANCELLED: "#94A3B8" };
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarClient({ meetings }: { meetings: Meeting[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hostFilter, setHostFilter] = useState<string>("ALL");

  const hosts = useMemo(() => {
    const map = new Map<string, string>();
    meetings.forEach((m) => { if (m.hostId && m.hostName) map.set(m.hostId, m.hostName); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [meetings]);

  const filtered = hostFilter === "ALL" ? meetings : meetings.filter((m) => m.hostId === hostFilter);

  // Build the grid: weeks starting Monday
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Mon=0
  const gridStart = new Date(year, month, 1 - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }

  const meetingsByDay = (d: Date) =>
    filtered
      .filter((m) => sameDay(new Date(m.startAt), d))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        action={
          hosts.length > 0 && (
            <select
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="ALL">All hosts</option>
              {hosts.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )
        }
      />

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-ink">{MONTHS[month]} {year}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line text-xs uppercase tracking-wide text-muted">
          {WEEKDAYS.map((d) => <div key={d} className="px-3 py-2 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === month;
            const isToday = sameDay(d, today);
            const dayMeetings = meetingsByDay(d);
            return (
              <div key={i} className={`min-h-[104px] border-b border-r border-line-soft p-1.5 ${inMonth ? "" : "bg-line-soft/30"} ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}>
                <div className={`mb-1 text-xs ${isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand font-semibold text-white" : inMonth ? "text-ink" : "text-faint"}`}>
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {dayMeetings.map((m) => (
                    <Link
                      key={m.id}
                      href={`/leads/${m.contactId}`}
                      className="block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight hover:opacity-80"
                      style={{ background: `${STATUS_COLOR[m.status] ?? "#94A3B8"}1A`, color: STATUS_COLOR[m.status] ?? "#94A3B8" }}
                      title={`${fmtTime(m.startAt)} · ${m.title} · ${m.contactName}`}
                    >
                      <span className="font-medium">{fmtTime(m.startAt)}</span> {m.contactName}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}