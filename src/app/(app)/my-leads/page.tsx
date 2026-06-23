import { requireOrg } from "@/lib/session";
import { getMyLeads } from "@/lib/lead-queries";
import MyLeadsClient from "./my-leads-client";

export default async function MyLeadsPage() {
  const { user, orgId } = await requireOrg();
  const leads = await getMyLeads(orgId, user.id);
  return <MyLeadsClient leads={leads} />;
}