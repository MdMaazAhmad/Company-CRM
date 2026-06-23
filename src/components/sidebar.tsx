"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Filter,
  CalendarDays,
  FolderKanban,
  Receipt,
  Settings,
  Building2,
  UserCog,
  ListChecks,
  Clock,
  LogOut,
  Calendar,
  UserCheck,
  BarChart3,
  Columns3,
} from "lucide-react";
import { can } from "@/lib/permissions";

type Me = {
  id: string;
  name?: string | null;
  role: string;
  isSuperAdmin: boolean;
  avatarColor: string;
  orgName?: string | null;
};

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-tasks", label: "My Tasks", icon: ListChecks },
  { href: "/my-leads", label: "My Leads", icon: UserCheck },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/leadboard", label: "Lead board", icon: Columns3 },
  { href: "/leads", label: "Leads", icon: Filter },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarDays },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/invoices", label: "Invoices", icon: Receipt, perm: "manage_users" as const },
  { href: "/manage", label: "Manage", icon: Settings, perm: "manage_pricing" as const },
  { href: "/settings", label: "Settings", icon: Building2, perm: "manage_users" as const },
  { href: "/team", label: "Team", icon: UserCog, perm: "manage_users" as const },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function OrgName({ name }: { name: string }) {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length > 1) {
    const [first, ...rest] = parts;
    return (
      <span className="truncate">
        <span className="text-ink">{first}</span>
        <span className="text-brand"> {rest.join(" ")}</span>
      </span>
    );
  }

  const mid = Math.ceil(trimmed.length / 2);
  return (
    <span className="truncate">
      <span className="text-ink">{trimmed.slice(0, mid)}</span>
      <span className="text-brand">{trimmed.slice(mid)}</span>
    </span>
  );
}

export function Sidebar({ me }: { me: Me }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface p-4">
      <div className="mb-6 flex items-center gap-1 px-2 pt-1 font-heading text-xl font-semibold tracking-wide">
        <OrgName name={me.orgName ?? "Workspace"} />
      </div>

      <div className="mb-2 px-2 text-[10px] uppercase tracking-widest text-faint">
        Menu
      </div>
      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => {
          if (item.perm && !can(me, item.perm)) return null;

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                active
                  ? "bg-brand text-white "
                  : "text-ink hover:bg-line-soft hover:text-ink"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line-soft pt-3">
        <div className="flex items-center gap-2.5 p-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ background: me.avatarColor }}
          >
            {initials(me.name)}
          </div>
          <div className="min-w-0 flex-1 text-xs leading-tight">
            <div className="truncate text-ink">{me.name ?? "User"}</div>
            <div className="truncate text-faint">{me.role}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md p-1.5 text-faint transition hover:bg-line hover:text-red-600"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}