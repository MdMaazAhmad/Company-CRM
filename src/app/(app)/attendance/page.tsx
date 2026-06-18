import { requireOrg } from "@/lib/session";
import { can } from "@/lib/permissions";
import { getAttendance } from "@/lib/attendance-queries";
import AttendanceClient from "./attendance-client";

export default async function AttendancePage() {
  const { user, orgId } = await requireOrg();
  const seeAll = can(user, "manage_users") || user.isSuperAdmin;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { rows, summary } = await getAttendance(orgId, {
    since,
    ...(seeAll ? {} : { userId: user.id }),
  });

  return (
    <AttendanceClient
      rows={rows}
      summary={summary}
      scopeLabel={seeAll ? "Login and logout times across your team — last 30 days." : "Your login and logout history — last 30 days."}
    />
  );
}