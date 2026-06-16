import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import ManageClient from "./manage-client";

export default async function ManagePage() {
  const { orgId } = await requireOrg();

  const [plans, sources] = await Promise.all([
    prisma.plan.findMany({
      where: { orgId },
      orderBy: [{ sortOrder: "asc" }, { sellPrice: "asc" }],
    }),
    prisma.source.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } }),
  ]);

  return <ManageClient plans={plans} sources={sources} />;
}