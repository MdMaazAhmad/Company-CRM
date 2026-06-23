"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { fdStr, fdInt } from "@/lib/form-utils";

const IMPERSONATE_COOKIE = "impersonate_org";

async function audit(
  actor: { id?: string; email?: string | null },
  orgId: string | null,
  action: string,
  detail?: string
) {
  await prisma.platformAuditLog.create({
    data: {
      orgId,
      actorId: actor.id ?? "unknown",
      actorEmail: actor.email ?? "unknown",
      action,
      detail: detail ?? null,
    },
  });
}

function revalidateOrg(orgId: string) {
  revalidatePath("/superadmin");
  revalidatePath(`/superadmin/orgs/${orgId}`);
}

export async function setOrgStatus(formData: FormData) {
  const actor = await requireSuperAdmin();
  const orgId = fdStr(formData,"orgId");
  const status = fdStr(formData,"status");
  if (!["ACTIVE", "SUSPENDED", "BLOCKED"].includes(status)) throw new Error("Invalid status.");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      status,
      active: status === "ACTIVE",
      blockedReason: status === "BLOCKED" ? fdStr(formData,"reason") || "Blocked by admin" : null,
    },
  });
  await audit(actor, orgId, "STATUS_CHANGED", `→ ${status}`);
  revalidateOrg(orgId);
}

export async function setOrgSubscription(formData: FormData) {
  const actor = await requireSuperAdmin();
  const orgId = fdStr(formData,"orgId");
  const plan = fdStr(formData,"plan") || "FREE";
  const untilRaw = fdStr(formData,"subscribedUntil");
  const monthlyFee = fdInt(formData, "monthlyFee");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      subscribedUntil: untilRaw ? new Date(untilRaw) : null,
      monthlyFee,
    },
  });
  await audit(actor, orgId, "SUBSCRIPTION_UPDATED", `plan=${plan} fee=${monthlyFee ?? "(plan default)"} until=${untilRaw || "none"}`);
  revalidateOrg(orgId);
}

export async function recordPlatformPayment(formData: FormData) {
  const actor = await requireSuperAdmin();
  const orgId = fdStr(formData,"orgId");
  const amount = parseInt(fdStr(formData,"amount"), 10);
  const untilRaw = fdStr(formData,"until");
  if (!amount || amount <= 0) throw new Error("Enter a valid amount.");
  if (!untilRaw) throw new Error("Pick the date this payment covers until.");

  const until = new Date(untilRaw);
  if (isNaN(until.getTime())) throw new Error("Invalid date.");

  const period =
    fdStr(formData,"period") ||
    until.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  await prisma.$transaction(async (tx) => {
    await tx.platformPayment.create({
      data: {
        orgId,
        amount,
        period,
        note: fdStr(formData,"note") || null,
      },
    });
    await tx.organization.update({
      where: { id: orgId },
      data: { subscribedUntil: until, status: "ACTIVE", active: true, blockedReason: null },
    });
    await tx.platformAuditLog.create({
      data: {
        orgId,
        actorId: actor.id ?? "unknown",
        actorEmail: actor.email ?? "unknown",
        action: "PAYMENT_RECORDED",
        detail: `₹${amount} · until ${until.toISOString().slice(0, 10)}`,
      },
    });
  });
  revalidateOrg(orgId);
}

export async function deletePlatformPayment(formData: FormData) {
  const actor = await requireSuperAdmin();
  const orgId = fdStr(formData,"orgId");
  const id = fdStr(formData,"id");
  await prisma.platformPayment.deleteMany({ where: { id, orgId } });
  await audit(actor, orgId, "PAYMENT_DELETED", id);
  revalidateOrg(orgId);
}

export async function renewOrg(formData: FormData) {
  const actor = await requireSuperAdmin();
  const orgId = fdStr(formData,"orgId");
  const cycles = parseInt(fdStr(formData,"cycles") || "1", 10);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { subscribedUntil: true, plan: true, monthlyFee: true },
  });
  if (!org) throw new Error("Org not found.");

  const base = org.subscribedUntil && org.subscribedUntil > new Date() ? org.subscribedUntil : new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + cycles);

  const prices = await prisma.platformPlan.findUnique({
    where: { name: org.plan },
    select: { monthlyPrice: true },
  });
  const fee = org.monthlyFee ?? prices?.monthlyPrice ?? 0;
  const charge = fee * cycles;

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: { subscribedUntil: next, status: "ACTIVE", active: true, blockedReason: null },
    });
    if (charge > 0) {
      await tx.platformPayment.create({
        data: {
          orgId,
          amount: charge,
          period: `Renewal ×${cycles} → ${next.toISOString().slice(0, 10)}`,
        },
      });
    }
    await tx.platformAuditLog.create({
      data: {
        orgId,
        actorId: actor.id ?? "unknown",
        actorEmail: actor.email ?? "unknown",
        action: "RENEWED",
        detail: `×${cycles} → ${next.toISOString().slice(0, 10)}${charge > 0 ? ` · ₹${charge}` : ""}`,
      },
    });
  });
  revalidateOrg(orgId);
}

export async function setPlatformPlanPrice(formData: FormData) {
  const actor = await requireSuperAdmin();
  const id = fdStr(formData,"id");
  const monthlyPrice = parseInt(fdStr(formData,"monthlyPrice"), 10);
  if (isNaN(monthlyPrice) || monthlyPrice < 0) throw new Error("Invalid price.");
  await prisma.platformPlan.update({ where: { id }, data: { monthlyPrice } });
  await audit(actor, null, "PLAN_PRICE_CHANGED", `${fdStr(formData,"name")} → ₹${monthlyPrice}`);
  revalidatePath("/superadmin");
}

export async function impersonateOrg(formData: FormData) {
  const actor = await requireSuperAdmin();
  const orgId = fdStr(formData,"orgId");
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
  await audit(actor, orgId, "IMPERSONATION_STARTED");
}

export async function stopImpersonating() {
  const actor = await requireSuperAdmin();
  const jar = await cookies();
  jar.delete(IMPERSONATE_COOKIE);
  await audit(actor, null, "IMPERSONATION_STOPPED");
}