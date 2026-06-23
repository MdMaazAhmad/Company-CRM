import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { can } from "@/lib/permissions";
import PlanDetailClient from "./PlanDetailClient";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, orgId } = await requireOrg();

  if (!can(user, "manage_pricing")) redirect("/");

  const [plan, categories] = await Promise.all([
    prisma.plan.findFirst({ where: { id, orgId } }),
    prisma.category.findMany({
      where: { orgId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, label: true, color: true },
    }),
  ]);
  if (!plan) notFound();

  return <PlanDetailClient plan={plan} categories={categories} />;
}