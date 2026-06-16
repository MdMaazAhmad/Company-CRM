// src/lib/permissions.ts
// Single source of truth for who-can-do-what. Both server actions and UI import
// from here so role logic never drifts. Roles are per-organization:
//
//   OWNER   — full control of the org, incl. user management + pricing (/manage)
//   ADMIN   — manage tasks/projects/clients, assign anyone; no user mgmt, no pricing
//   MEMBER  — create/edit tasks, move own/assigned tasks, comment, log time
//   VIEWER  — read-only everywhere
//
// isSuperAdmin (that's you) overrides everything, across all orgs.

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export const ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

export const ROLE_META: Record<Role, { label: string; desc: string; color: string }> = {
  OWNER:  { label: "Owner",  desc: "Full control, billing, user & pricing management", color: "#FF6B00" },
  ADMIN:  { label: "Admin",  desc: "Manage projects, clients & all tasks",            color: "#2563EB" },
  MEMBER: { label: "Member", desc: "Work on tasks, comment, log time",                color: "#16A34A" },
  VIEWER: { label: "Viewer", desc: "Read-only access",                                color: "#94A3B8" },
};

// Every gated action in the app. Add new ones here as features grow.
export type Action =
  // org / users
  | "manage_users"        // invite, change role, deactivate
  | "manage_pricing"      // /manage plans & sources (internal cost data)
  | "manage_billing"
  // crm
  | "manage_contacts"     // create/edit/delete contacts, convert, etc.
  // projects
  | "manage_projects"     // create/edit/delete projects, payments
  // tasks
  | "create_task"
  | "edit_any_task"       // edit/move/delete ANY task in the org
  | "edit_own_task"       // edit/move tasks you report or are assigned
  | "comment_task"
  | "log_time"
  | "view";               // see the app at all

// Minimal viewer: can see + (implicitly) nothing else.
const VIEWER_CAN: Action[] = ["view"];

const MEMBER_CAN: Action[] = [
  ...VIEWER_CAN,
  "create_task",
  "edit_own_task",
  "comment_task",
  "log_time",
];

const ADMIN_CAN: Action[] = [
  ...MEMBER_CAN,
  "manage_contacts",
  "manage_projects",
  "edit_any_task",
];

const OWNER_CAN: Action[] = [
  ...ADMIN_CAN,
  "manage_users",
  "manage_pricing",
  "manage_billing",
];

const MATRIX: Record<Role, Action[]> = {
  VIEWER: VIEWER_CAN,
  MEMBER: MEMBER_CAN,
  ADMIN: ADMIN_CAN,
  OWNER: OWNER_CAN,
};

type Actor = { role: string; isSuperAdmin?: boolean };

/** Core check. Super-admins (you) bypass the matrix entirely. */
export function can(actor: Actor | null | undefined, action: Action): boolean {
  if (!actor) return false;
  if (actor.isSuperAdmin) return true;
  const allowed = MATRIX[actor.role as Role];
  if (!allowed) return false;
  return allowed.includes(action);
}

/**
 * Task-level check that accounts for ownership. Use for edit/move/delete on a
 * specific task: admins+ can touch any task; members only their own.
 */
export function canEditTask(
  actor: Actor | null | undefined,
  task: { assigneeId?: string | null; reporterId?: string },
  actorUserId: string
): boolean {
  if (!actor) return false;
  if (can(actor, "edit_any_task")) return true;
  if (!can(actor, "edit_own_task")) return false;
  return task.assigneeId === actorUserId || task.reporterId === actorUserId;
}

/** Throwing variant for server actions — fail closed. */
export function assertCan(actor: Actor | null | undefined, action: Action): void {
  if (!can(actor, action)) throw new Error("FORBIDDEN");
}

/**
 * Role-assignment guard. Only OWNER (or super-admin) may set roles, and nobody
 * can hand out OWNER except an existing OWNER/super-admin. Prevents an admin
 * from escalating themselves.
 */
export function canAssignRole(actor: Actor, targetRole: Role): boolean {
  if (actor.isSuperAdmin) return true;
  if (actor.role !== "OWNER") return false;
  return ROLES.includes(targetRole);
}