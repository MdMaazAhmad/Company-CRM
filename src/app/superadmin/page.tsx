import { requireSuperAdmin } from "@/lib/superadmin";
import { getAllOrgs, getPlatformTotals } from "@/lib/superadmin-queries";
import SuperAdminClient from "./superadmin-client";

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const [orgs, totals] = await Promise.all([getAllOrgs(), getPlatformTotals()]);

  return <SuperAdminClient orgs={orgs} totals={totals} />;
}