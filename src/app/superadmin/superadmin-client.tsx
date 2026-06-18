"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogIn, Ban, Pause, Play } from "lucide-react";
import { setOrgStatus, impersonateOrg } from "@/lib/superadmin-actions";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  subscribedUntil: string | null;
  createdAt: string;
  users: number;
  contacts: number;
  projects: number;
  invoices: number;
};

type Totals = { orgs: number; users: number; activeOrgs: number; grossRevenue: number };

const inr = (n: number) => "\u20B9" + n.toLocaleString("en-IN");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#16A34A",
  SUSPENDED: "#F59E0B",
  BLOCKED: "#EF4444",
};

function StatusButtons({ orgId, status }: { orgId: string; status: string }) {
  const [pending, start] = useTransition();
  function set(next: string, reason?: string) {
    const fd = new FormData();
    fd.set("orgId", orgId);
    fd.set("status", next);
    if (reason) fd.set("reason", reason);
    start(async () => {
      try { await setOrgStatus(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <div className="flex gap-1">
      {status !== "ACTIVE" && (
        <button onClick={() => set("ACTIVE")} disabled={pending} title="Activate"
          className="rounded-md p-1.5 text-faint hover:bg-line hover:text-st-converted">
          <Play size={14} />
        </button>
      )}
      {status !== "SUSPENDED" && (
        <button onClick={() => set("SUSPENDED")} disabled={pending} title="Suspend"
          className="rounded-md p-1.5 text-faint hover:bg-line hover:text-amber-600">
          <Pause size={14} />
        </button>
      )}
      {status !== "BLOCKED" && (
        <button onClick={() => { const r = prompt("Reason for blocking?") ?? ""; set("BLOCKED", r); }} disabled={pending} title="Block"
          className="rounded-md p-1.5 text-faint hover:bg-line hover:text-red-600">
          <Ban size={14} />
        </button>
      )}
    </div>
  );
}

function ImpersonateButton({ orgId }: { orgId: string }) {
  const [pending, start] = useTransition();
  function go() {
    const fd = new FormData();
    fd.set("orgId", orgId);
    start(async () => {
      try { await impersonateOrg(fd); window.location.href = "/"; }
      catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <button onClick={go} disabled={pending} title="Impersonate / act as org"
      className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink hover:bg-line-soft">
      <LogIn size={12} /> Act as
    </button>
  );
}

export default function SuperAdminClient({ orgs, totals }: { orgs: OrgRow[]; totals: Totals }) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-faint">Platform</div>
        <h1 className="font-heading text-3xl font-bold text-ink">Super Admin</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Organizations", value: totals.orgs },
          { label: "Active orgs", value: totals.activeOrgs },
          { label: "Total users", value: totals.users },
          { label: "Gross revenue", value: inr(totals.grossRevenue) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-5">
            <div className="text-xs uppercase tracking-wide text-muted">{s.label}</div>
            <div className="mt-1 font-heading text-2xl tabular-nums text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subscribed until</th>
              <th className="px-4 py-3 text-right">Users</th>
              <th className="px-4 py-3 text-right">Projects</th>
              <th className="px-4 py-3 text-right">Invoices</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-line-soft hover:bg-line-soft/40"
                style={{ boxShadow: `inset 3px 0 0 ${STATUS_COLOR[o.status] ?? "#94A3B8"}` }}>
                <td className="px-4 py-3">
                  <Link href={`/superadmin/orgs/${o.id}`} className="font-medium text-ink hover:text-brand hover:underline">
                    {o.name}
                  </Link>
                  <div className="text-xs text-faint">{o.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted">{o.plan}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: `${STATUS_COLOR[o.status]}1A`, color: STATUS_COLOR[o.status] }}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{o.subscribedUntil ? fmtDate(o.subscribedUntil) : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{o.users}</td>
                <td className="px-4 py-3 text-right tabular-nums">{o.projects}</td>
                <td className="px-4 py-3 text-right tabular-nums">{o.invoices}</td>
                <td className="px-4 py-3 text-muted">{fmtDate(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <StatusButtons orgId={o.id} status={o.status} />
                    <ImpersonateButton orgId={o.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}