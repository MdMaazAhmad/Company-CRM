// src/lib/team-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { assertCan, canAssignRole, type Role, ROLES } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const PALETTE = [
  "#FF6B00", "#2563EB", "#16A34A", "#DB2777",
  "#F59E0B", "#06B6D4", "#8B5CF6", "#EF4444",
];
function pickColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

const TEAMS = ["SALES", "DELIVERY", "BOTH"];

function normEmail(v: FormDataEntryValue | null) {
  return String(v ?? "").trim().toLowerCase();
}

/** Add a team member to the current org. OWNER only. */
export async function addTeamMember(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_users");

  const name = String(formData.get("name") ?? "").trim();
  const email = normEmail(formData.get("email"));
  const role = String(formData.get("role") ?? "MEMBER") as Role;
  const password = String(formData.get("password") ?? "");
  const teamRaw = String(formData.get("team") ?? "BOTH");
  const team = TEAMS.includes(teamRaw) ? teamRaw : "BOTH";

  if (!name || !email || !password) throw new Error("Name, email and password are required.");
  if (!ROLES.includes(role)) throw new Error("Invalid role.");
  if (!canAssignRole(user, role)) throw new Error("You can't assign that role.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  // Enforce per-org unique email (matches @@unique([orgId, email])).
  const existing = await prisma.user.findFirst({ where: { orgId, email } });
  if (existing) throw new Error("A member with that email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      orgId,
      name,
      email,
      passwordHash,
      role,
      team,
      active: true,
      avatarColor: pickColor(),
    },
  });

  revalidatePath("/team");
  revalidatePath("/leads");
}

/** Change a member's role. OWNER only; can't demote the last owner. */
export async function setMemberRole(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_users");

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  if (!userId || !ROLES.includes(role)) throw new Error("Invalid input.");
  if (!canAssignRole(user, role)) throw new Error("You can't assign that role.");

  const target = await prisma.user.findFirst({ where: { id: userId, orgId } });
  if (!target) throw new Error("Member not found.");

  // Don't allow removing the org's last OWNER.
  if (target.role === "OWNER" && role !== "OWNER") {
    const owners = await prisma.user.count({ where: { orgId, role: "OWNER", active: true } });
    if (owners <= 1) throw new Error("This is the only owner — promote someone else first.");
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/team");
}

/** Change a member's team (SALES / DELIVERY / BOTH). Drives lead assignability. */
export async function setMemberTeam(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_users");

  const userId = String(formData.get("userId") ?? "");
  const team = String(formData.get("team") ?? "");
  if (!userId || !TEAMS.includes(team)) throw new Error("Invalid input.");

  const target = await prisma.user.findFirst({ where: { id: userId, orgId } });
  if (!target) throw new Error("Member not found.");

  await prisma.user.update({ where: { id: userId }, data: { team } });
  revalidatePath("/team");
  revalidatePath("/leads");
}

/** Activate / deactivate a member (we never hard-delete — audit trail). */
export async function setMemberActive(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_users");

  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!userId) throw new Error("Invalid input.");

  // Can't deactivate yourself, and can't deactivate the last active owner.
  if (userId === user.id) throw new Error("You can't deactivate your own account.");

  const target = await prisma.user.findFirst({ where: { id: userId, orgId } });
  if (!target) throw new Error("Member not found.");

  if (!active && target.role === "OWNER") {
    const owners = await prisma.user.count({ where: { orgId, role: "OWNER", active: true } });
    if (owners <= 1) throw new Error("Can't deactivate the only owner.");
  }

  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/team");
}

/** Reset a member's password (OWNER sets a new one directly). */
export async function resetMemberPassword(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_users");

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 8) throw new Error("Password must be at least 8 characters.");

  const target = await prisma.user.findFirst({ where: { id: userId, orgId } });
  if (!target) throw new Error("Member not found.");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/team");
}