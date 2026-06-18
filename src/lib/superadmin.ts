import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWLIST = (process.env.SUPERADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAllowlistedSuperAdmin(user: { isSuperAdmin: boolean; email?: string | null } | null) {
  if (!user?.isSuperAdmin) return false;
  if (ALLOWLIST.length === 0) return true;
  return !!user.email && ALLOWLIST.includes(user.email.toLowerCase());
}

export async function requireSuperAdmin() {
  const session = await auth();
  const user = session?.user as { isSuperAdmin: boolean; email?: string | null; id?: string } | undefined;
  if (!user?.id || !isAllowlistedSuperAdmin(user)) redirect("/superadmin/login");
  return user;
}

export function orgIsUsable(org: { status: string; active: boolean; subscribedUntil: Date | null } | null) {
  if (!org) return false;
  if (!org.active) return false;
  if (org.status === "BLOCKED" || org.status === "SUSPENDED") return false;
  if (org.subscribedUntil && org.subscribedUntil.getTime() < Date.now()) return false;
  return true;
}