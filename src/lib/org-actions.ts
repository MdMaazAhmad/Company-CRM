"use server";

import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { assertCan } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const val = (fd: FormData, k: string) => String(fd.get(k) || "").trim() || null;

export async function updateOrgBilling(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_users");

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: String(formData.get("name") || "").trim() || "Workspace",
      billingAddress: val(formData, "billingAddress"),
      billingPhone: val(formData, "billingPhone"),
      billingEmail: val(formData, "billingEmail"),
      billingWebsite: val(formData, "billingWebsite"),
      gstin: val(formData, "gstin"),
      placeOfSupply: val(formData, "placeOfSupply"),
      defaultHsnSac: val(formData, "defaultHsnSac"),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/invoices");
}