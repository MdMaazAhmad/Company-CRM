import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import PlanDetailClient from "./PlanDetailClient";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();

  const plan = await prisma.plan.findFirst({ where: { id, orgId } });
  if (!plan) notFound();

  return <PlanDetailClient plan={plan} />;
}