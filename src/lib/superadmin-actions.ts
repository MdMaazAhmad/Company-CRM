"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const IMPERSONATE_COOKIE = "impersonate_org";

function str(fd: FormData, k: string) {
  return String(fd.get(k) || "").trim();
}

export async function setOrgStatus(formData: FormData) {
  await requireSuperAdmin();
  const orgId = str(formData, "orgId");
  const status = str(formData, "status");
  if (!["ACTIVE", "SUSPENDED", "BLOCKED"].includes(status)) throw new Error("Invalid status.");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      status,
      active: status === "ACTIVE",
      blockedReason: status === "BLOCKED" ? str(formData, "reason") || "Blocked by admin" : null,
    },
  });

  revalidatePath("/superadmin");
  revalidatePath(`/superadmin/orgs/${orgId}`);
}

export async function setOrgSubscription(formData: FormData) {
  await requireSuperAdmin();
  const orgId = str(formData, "orgId");
  const plan = str(formData, "plan") || "FREE";
  const untilRaw = str(formData, "subscribedUntil");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      subscribedUntil: untilRaw ? new Date(untilRaw) : null,
    },
  });

  revalidatePath("/superadmin");
  revalidatePath(`/superadmin/orgs/${orgId}`);
}

export async function impersonateOrg(formData: FormData) {
  await requireSuperAdmin();
  const orgId = str(formData, "orgId");
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!org) throw new Error("Org not found.");

  const jar = await cookies();
  jar.set(IMPERSONATE_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function stopImpersonating() {
  await requireSuperAdmin();
  const jar = await cookies();
  jar.delete(IMPERSONATE_COOKIE);
}