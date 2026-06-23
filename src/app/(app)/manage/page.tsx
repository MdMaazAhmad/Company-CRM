import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { can } from "@/lib/permissions";
import ManageClient from "./manage-client";

export default async function ManagePage() {
  const { user, orgId } = await requireOrg();

  if (!can(user, "manage_pricing")) redirect("/");

  const [plans, sources, categories] = await Promise.all([
    prisma.plan.findMany({
      where: { orgId },
      orderBy: [{ sortOrder: "asc" }, { sellPrice: "asc" }],
    }),
    prisma.source.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({
      where: { orgId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true, color: true },
    }),
  ]);

  return <ManageClient plans={plans} sources={sources} categories={categories} />;
}