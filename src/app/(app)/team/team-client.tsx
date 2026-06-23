// src/app/team/team-client.tsx
"use client";

import { useState, useTransition } from "react";
import {
  addTeamMember,
  setMemberRole,
  setMemberActive,
  resetMemberPassword,
  setMemberTeam,
} from "@/lib/team-actions";
import { ROLES, ROLE_META, type Role } from "@/lib/permissions";
import { PageHeader } from "@/components/crm";
import { Shield, KeyRound, UserMinus, UserPlus } from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  active: boolean;
  avatarColor: string;
  isSuperAdmin: boolean;
  createdAt: Date;
  _count: { assignedTasks: number };
};

const TEAMS = [
  { value: "SALES", label: "Sales" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "BOTH", label: "Both" },
];

const TEAM_LABEL: Record<string, string> = {
  SALES: "Sales",
  DELIVERY: "Delivery",
  BOTH: "Both",
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role as Role] ?? ROLE_META.MEMBER;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: `${meta.color}1A`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

export function TeamClient({ members, meId }: { members: Member[]; meId: string }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PageHeader
        eyebrow="Workspace"
        title="Team"
        subtitle="Manage who has access and what they can do."
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <UserPlus size={16} /> Add member
          </button>
        }
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Tasks</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow key={m.id} m={m} isSelf={m.id === meId} />
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && <AddMemberDialog onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function MemberRow({ m, isSelf }: { m: Member; isSelf: boolean }) {
  const [menuFor, setMenuFor] = useState<"role" | "reset" | null>(null);

  return (
    <tr className="border-b border-line-soft last:border-0 hover:bg-line-soft/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: m.avatarColor }}
          >
            {initials(m.name)}
          </div>
          <div>
            <div className="font-medium text-ink">
              {m.name} {isSelf && <span className="text-xs text-muted">(you)</span>}
              {m.isSuperAdmin && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-brand">
                  <Shield size={11} /> super
                </span>
              )}
            </div>
            <div className="text-xs text-muted">{m.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><RoleBadge role={m.role} /></td>
      <td className="px-4 py-3"><TeamSelect m={m} /></td>
      <td className="px-4 py-3 text-muted">{m._count.assignedTasks}</td>
      <td className="px-4 py-3">
        {m.active ? (
          <span className="text-xs text-[#16A34A]">Active</span>
        ) : (
          <span className="text-xs text-faint">Deactivated</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setMenuFor("role")}
            className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink"
            title="Change role"
          >
            <Shield size={15} />
          </button>
          <button
            onClick={() => setMenuFor("reset")}
            className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink"
            title="Reset password"
          >
            <KeyRound size={15} />
          </button>
          {!isSelf && <ActiveToggle m={m} />}
        </div>
      </td>

      {menuFor === "role" && <RoleDialog m={m} onClose={() => setMenuFor(null)} />}
      {menuFor === "reset" && <ResetDialog m={m} onClose={() => setMenuFor(null)} />}
    </tr>
  );
}

function TeamSelect({ m }: { m: Member }) {
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const team = e.target.value;
    const fd = new FormData();
    fd.set("userId", m.id);
    fd.set("team", team);
    start(async () => {
      try {
        await setMemberTeam(fd);
      } catch (err: any) {
        alert(err?.message ?? "Failed.");
      }
    });
  }

  return (
    <select
      value={m.team}
      onChange={onChange}
      disabled={pending}
      className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand disabled:opacity-50"
    >
      {TEAMS.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  );
}

function ActiveToggle({ m }: { m: Member }) {
  const [pending, start] = useTransition();
  function toggle() {
    const fd = new FormData();
    fd.set("userId", m.id);
    fd.set("active", String(!m.active));
    start(async () => {
      try {
        await setMemberActive(fd);
      } catch (e: any) {
        alert(e?.message ?? "Failed.");
      }
    });
  }
  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="rounded-md p-1.5 text-muted hover:bg-line hover:text-red-600 disabled:opacity-50"
      title={m.active ? "Deactivate" : "Reactivate"}
    >
      <UserMinus size={15} />
    </button>
  );
}

// ── Dialogs ──────────────────────────────────────────────

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function AddMemberDialog({ onClose }: { onClose: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function submit(fd: FormData) {
    setErr(null);
    start(async () => {
      try {
        await addTeamMember(fd);
        onClose();
      } catch (e: any) {
        setErr(e?.message ?? "Failed to add member.");
      }
    });
  }

  return (
    <Backdrop onClose={onClose}>
      <h2 className="font-heading text-lg font-bold text-ink">Add member</h2>
      <p className="mt-1 text-sm text-muted">They'll sign in with this email and password.</p>
      <form action={submit} className="mt-4 flex flex-col gap-3">
        <Input name="name" label="Name" placeholder="Full name" />
        <Input name="email" label="Email" type="email" placeholder="person@company.com" />
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Role</label>
            <select name="role" defaultValue="MEMBER" className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand">
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Team</label>
            <select name="team" defaultValue="BOTH" className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand">
              {TEAMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Input name="password" label="Temporary password" type="password" placeholder="At least 8 characters" />
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{err}</div>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-line">Cancel</button>
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {pending ? "Adding…" : "Add member"}
          </button>
        </div>
      </form>
    </Backdrop>
  );
}

function RoleDialog({ m, onClose }: { m: Member; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function submit(role: Role) {
    setErr(null);
    const fd = new FormData();
    fd.set("userId", m.id);
    fd.set("role", role);
    start(async () => {
      try {
        await setMemberRole(fd);
        onClose();
      } catch (e: any) {
        setErr(e?.message ?? "Failed.");
      }
    });
  }

  return (
    <Backdrop onClose={onClose}>
      <h2 className="font-heading text-lg font-bold text-ink">Change role</h2>
      <p className="mt-1 text-sm text-muted">{m.name}</p>
      <div className="mt-4 flex flex-col gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => submit(r)}
            disabled={pending}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition disabled:opacity-50 ${
              m.role === r ? "border-brand bg-brand-soft" : "border-line hover:bg-line-soft"
            }`}
          >
            <span className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: ROLE_META[r].color }} />
            <span>
              <span className="block text-sm font-medium text-ink">{ROLE_META[r].label}</span>
              <span className="block text-xs text-muted">{ROLE_META[r].desc}</span>
            </span>
          </button>
        ))}
      </div>
      {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{err}</div>}
    </Backdrop>
  );
}

function ResetDialog({ m, onClose }: { m: Member; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function submit(fd: FormData) {
    setErr(null);
    fd.set("userId", m.id);
    start(async () => {
      try {
        await resetMemberPassword(fd);
        onClose();
      } catch (e: any) {
        setErr(e?.message ?? "Failed.");
      }
    });
  }

  return (
    <Backdrop onClose={onClose}>
      <h2 className="font-heading text-lg font-bold text-ink">Reset password</h2>
      <p className="mt-1 text-sm text-muted">Set a new password for {m.name}.</p>
      <form action={submit} className="mt-4 flex flex-col gap-3">
        <Input name="password" label="New password" type="password" placeholder="At least 8 characters" />
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{err}</div>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-line">Cancel</button>
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {pending ? "Saving…" : "Set password"}
          </button>
        </div>
      </form>
    </Backdrop>
  );
}

function Input({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
      />
    </div>
  );
}