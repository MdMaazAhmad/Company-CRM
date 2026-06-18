import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const { orgId } = await requireOrg();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      billingAddress: true,
      billingPhone: true,
      billingEmail: true,
      billingWebsite: true,
      gstin: true,
      placeOfSupply: true,
      defaultHsnSac: true,
    },
  });
  if (!org) notFound();

  return <SettingsClient org={org} />;
}