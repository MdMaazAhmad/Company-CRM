"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowLeft, LogIn, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import {
  setOrgStatus,
  setOrgSubscription,
  recordPlatformPayment,
  deletePlatformPayment,
  renewOrg,
  impersonateOrg,
} from "@/lib/superadmin-actions";

type Payment = { id: string; amount: number; period: string | null; note: string | null; paidAt: string };
type Audit = { id: string; actorEmail: string; action: string; detail: string | null; createdAt: string };

type OrgDetail = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  active: boolean;
  blockedReason: string | null;
  monthlyFee: number | null;
  effectiveFee: number;
  subscribedUntil: string | null;
  createdAt: string;
  counts: { users: number; projects: number; invoices: number };
  collected: number;
  payments: Payment[];
  audit: Audit[];
};

const inr = (n: number) => "\u20B9" + n.toLocaleString("en-IN");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#16A34A",
  SUSPENDED: "#F59E0B",
  BLOCKED: "#EF4444",
};

const ACTION_LABEL: Record<string, string> = {
  STATUS_CHANGED: "Status changed",
  SUBSCRIPTION_UPDATED: "Subscription updated",
  PAYMENT_RECORDED: "Payment recorded",
  PAYMENT_DELETED: "Payment deleted",
  RENEWED: "Renewed",
  IMPERSONATION_STARTED: "Started acting as org",
  IMPERSONATION_STOPPED: "Stopped acting as org",
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
        <select name="plan" defaultValue={org.plan}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none">
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="BUSINESS">BUSINESS</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-ink">Monthly fee (₹)</label>
        <input type="number" name="monthlyFee" defaultValue={org.monthlyFee ?? ""} placeholder={`Plan default: ${inr(org.effectiveFee)}`}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <span className="text-xs text-muted">Blank = use plan price. Set a value to override for this tenant.</span>
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-ink">Subscribed until</label>
        <input type="date" name="subscribedUntil" defaultValue={until}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        <span className="text-xs text-muted">Blank = no expiry. Auto-blocks 5 days after a past date.</span>
      </div>
      <button type="submit" disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
        <Save size={15} /> {pending ? "Saving…" : "Save subscription"}
      </button>
    </form>
  );
}

function RenewButton({ orgId }: { orgId: string }) {
  const [pending, start] = useTransition();
  function go() {
    const fd = new FormData();
    fd.set("orgId", orgId);
    fd.set("cycles", "1");
    start(async () => {
      try { await renewOrg(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <button onClick={go} disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-line-soft">
      <RefreshCw size={15} /> {pending ? "Renewing…" : "Renew 1 month"}
    </button>
  );
}

function PaymentForm({ orgId, fee, currentUntil }: { orgId: string; fee: number; currentUntil: string | null }) {
  const [pending, start] = useTransition();
  const defaultUntil = currentUntil ? currentUntil.slice(0, 10) : "";
  function add(fd: FormData) {
    fd.set("orgId", orgId);
    start(async () => {
      try { await recordPlatformPayment(fd); }
      catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <form action={add} className="flex flex-wrap items-end gap-2">
      <div className="grid gap-1">
        <label className="text-xs text-muted">Amount (₹)</label>
        <input type="number" name="amount" defaultValue={fee || ""} placeholder="0"
          className="w-28 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none" />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted">Paid until</label>
        <input type="date" name="until" defaultValue={defaultUntil}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none" />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted">Period (optional)</label>
        <input type="text" name="period" placeholder="auto"
          className="w-32 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none" />
      </div>
      <button type="submit" disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
        <Plus size={14} /> {pending ? "Saving…" : "Record & set date"}
      </button>
    </form>
  );
}

function DeletePaymentButton({ orgId, id }: { orgId: string; id: string }) {
  const [pending, start] = useTransition();
  function go() {
    if (!confirm("Delete this payment record?")) return;
    const fd = new FormData();
    fd.set("orgId", orgId);
    fd.set("id", id);
    start(async () => {
      try { await deletePlatformPayment(fd); } catch (e: any) { alert(e?.message ?? "Failed."); }
    });
  }
  return (
    <button onClick={go} disabled={pending} className="rounded-md p-1 text-faint hover:text-red-600" title="Delete">
      <Trash2 size={13} />
    </button>
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
    <button onClick={go} disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-line-soft">
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
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: `${STATUS_COLOR[org.status]}1A`, color: STATUS_COLOR[org.status] }}>
              {org.status}
            </span>
          </div>
          <div className="mt-1 text-sm text-faint">{org.slug} · {org.plan} · created {fmtDate(org.createdAt)}</div>
          {org.status === "BLOCKED" && org.blockedReason && (
            <div className="mt-2 text-sm text-red-600">Blocked: {org.blockedReason}</div>
          )}
        </div>
        <div className="flex gap-2">
          {/* <RenewButton orgId={org.id} /> */}
          <ImpersonateButton orgId={org.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Monthly fee", value: inr(org.effectiveFee) },
          { label: "Collected", value: inr(org.collected) },
          { label: "Seats", value: org.counts.users },
          { label: "Projects", value: org.counts.projects },
          { label: "Invoices", value: org.counts.invoices },
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
        <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Platform billing</h2>
        <PaymentForm orgId={org.id} fee={org.effectiveFee} currentUntil={org.subscribedUntil} />
        {org.payments.length === 0 ? (
          <p className="mt-4 text-sm text-faint">No payments recorded yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Period</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {org.payments.map((p) => (
                <tr key={p.id} className="border-t border-line-soft">
                  <td className="py-2 text-muted">{fmtDate(p.paidAt)}</td>
                  <td className="py-2 text-muted">{p.period ?? "—"}</td>
                  <td className="py-2 text-right tabular-nums text-ink">{inr(p.amount)}</td>
                  <td className="py-2 text-right"><DeletePaymentButton orgId={org.id} id={p.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Activity log</h2>
        {org.audit.length === 0 ? (
          <p className="text-sm text-faint">No activity yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {org.audit.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 text-sm">
                <div>
                  <span className="font-medium text-ink">{ACTION_LABEL[a.action] ?? a.action}</span>
                  {a.detail && <span className="text-muted"> · {a.detail}</span>}
                  <div className="text-xs text-faint">{a.actorEmail}</div>
                </div>
                <span className="shrink-0 text-xs text-faint">{fmtDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <LogIn size={15} className="text-faint" />
          Team roster, contacts, and tenant revenue stay hidden — the platform manages subscription and lifecycle only.
        </div>
      </div>
    </div>
  );
}