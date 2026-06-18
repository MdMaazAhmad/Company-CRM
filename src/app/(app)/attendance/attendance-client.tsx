"use client";

import { Clock } from "lucide-react";
import { PageHeader } from "@/components/crm";

type Session = {
  id: string;
  userId: string;
  userName: string;
  avatarColor: string;
  loginAt: string;
  logoutAt: string | null;
  minutes: number | null;
};

type Summary = {
  userId: string;
  userName: string;
  avatarColor: string;
  totalMinutes: number;
  sessions: number;
  online: boolean;
};

function fmtHrs(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function initials(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function AttendanceClient({
  rows,
  summary,
  scopeLabel,
}: {
  rows: Session[];
  summary: Summary[];
  scopeLabel: string;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader eyebrow="Team" title="Attendance" subtitle={scopeLabel} />

      {summary.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((u) => (
            <div key={u.userId} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: u.avatarColor }}>
                  {initials(u.userName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{u.userName}</div>
                  <div className="text-xs text-faint">{u.sessions} session{u.sessions === 1 ? "" : "s"}</div>
                </div>
                {u.online && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-st-converted/10 px-2 py-0.5 text-[10px] font-medium text-st-converted">
                    <span className="h-1.5 w-1.5 rounded-full bg-st-converted" /> Online
                  </span>
                )}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 font-heading text-xl tabular-nums text-ink">
                <Clock size={15} className="text-faint" /> {fmtHrs(u.totalMinutes)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Logout</th>
              <th className="px-4 py-3 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-faint">No sessions recorded yet.</td></tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="border-b border-line-soft last:border-0 hover:bg-line-soft/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: s.avatarColor }}>
                        {initials(s.userName)}
                      </span>
                      <span className="text-ink">{s.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{fmtTime(s.loginAt)}</td>
                  <td className="px-4 py-3">
                    {s.logoutAt ? (
                      <span className="text-muted">{fmtTime(s.logoutAt)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-st-converted">
                        <span className="h-1.5 w-1.5 rounded-full bg-st-converted" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {s.minutes != null ? (
                      <span className={s.logoutAt ? "text-ink" : "text-st-converted"}>{fmtHrs(s.minutes)}</span>
                    ) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}