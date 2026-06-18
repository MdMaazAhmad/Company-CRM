"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowLeft, LogIn, Save } from "lucide-react";
import {
  setOrgStatus,
  setOrgSubscription,
  impersonateOrg,
} from "@/lib/superadmin-actions";

type OrgUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  isSuperAdmin: boolean;
};

type OrgDetail = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  active: boolean;
  blockedReason: string | null;
  subscribedUntil: string | null;
  createdAt: string;
  grossRevenue: number;
  users: OrgUser[];
  _count: { contacts: number; projects: number; invoices: number; payments: number };
};

const inr = (n: number) => "\u20B9" + n.toLocaleString("en-IN");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#16A34A",
  SUSPENDED: "#F59E0B",
  BLOCKED: "#EF4444",
};

function StatusControl({ orgId, status }: { orgId: string; status: string }) {
  const [pending, start] = useTransition();
  function set(next: string) {
    const fd = new FormData();
    fd.set("orgId", orgId);
    fd.set("status", next);
    if (next === "BLOCKED") fd.set("reason", prompt("Reason for blocking?") ?? "");
    start(async () => {
      try { await setOrgStatus(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <div className="flex gap-2">
      {["ACTIVE", "SUSPENDED", "BLOCKED"].map((s) => (
        <button
          key={s}
          onClick={() => set(s)}
          disabled={pending || s === status}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-100"
          style={
            s === status
              ? { background: `${STATUS_COLOR[s]}1A`, color: STATUS_COLOR[s], borderColor: STATUS_COLOR[s] }
              : { borderColor: "#e5e7eb", color: "#6b7280" }
          }
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function SubscriptionForm({ org }: { org: OrgDetail }) {
  const [pending, start] = useTransition();
  const until = org.subscribedUntil ? org.subscribedUntil.slice(0, 10) : "";

  function save(fd: FormData) {
    fd.set("orgId", org.id);
    start(async () => {
      try { await setOrgSubscription(fd); alert("Subscription updated."); }
      catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }

  return (
    <form action={save} className="grid gap-4">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-ink">Plan tier</label>
        <select
          name="plan"
          defaultValue={org.plan}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="BUSINESS">BUSINESS</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-ink">Subscribed until</label>
        <input
          type="date"
          name="subscribedUntil"
          defaultValue={until}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <span className="text-xs text-muted">Leave blank for no expiry. Past dates lock the org out automatically.</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        <Save size={15} /> {pending ? "Saving…" : "Save subscription"}
      </button>
    </form>
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
    <button
      onClick={go}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-line-soft"
    >
      <LogIn size={15} /> Act as this org
    </button>
  );
}

export default function OrgDetailClient({ org }: { org: OrgDetail }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <Link href="/superadmin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All organizations
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-ink">{org.name}</h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: `${STATUS_COLOR[org.status]}1A`, color: STATUS_COLOR[org.status] }}
            >
              {org.status}
            </span>
          </div>
          <div className="mt-1 text-sm text-faint">{org.slug} · created {fmtDate(org.createdAt)}</div>
          {org.status === "BLOCKED" && org.blockedReason && (
            <div className="mt-2 text-sm text-red-600">Blocked: {org.blockedReason}</div>
          )}
        </div>
        <ImpersonateButton orgId={org.id} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Revenue", value: inr(org.grossRevenue) },
          { label: "Users", value: org.users.length },
          { label: "Contacts", value: org._count.contacts },
          { label: "Projects", value: org._count.projects },
          { label: "Invoices", value: org._count.invoices },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-xs uppercase tracking-wide text-muted">{s.label}</div>
            <div className="mt-1 font-heading text-xl tabular-nums text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Lifecycle</h2>
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Status</div>
          <StatusControl orgId={org.id} status={org.status} />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Subscription</h2>
          <SubscriptionForm org={org} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Users ({org.users.length})</h2>
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">State</th>
              </tr>
            </thead>
            <tbody>
              {org.users.map((u) => (
                <tr key={u.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-2.5 font-medium text-ink">
                    {u.name}
                    {u.isSuperAdmin && <span className="ml-2 text-xs text-brand">super</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{u.email}</td>
                  <td className="px-4 py-2.5 text-muted">{u.role}</td>
                  <td className="px-4 py-2.5">
                    {u.active ? (
                      <span className="text-xs text-st-converted">Active</span>
                    ) : (
                      <span className="text-xs text-faint">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}