import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/superadmin";
import { getOrgDetail } from "@/lib/superadmin-queries";
import OrgDetailClient from "./org-detail-client";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const org = await getOrgDetail(id);
  if (!org) notFound();

  return <OrgDetailClient org={org} />;
}