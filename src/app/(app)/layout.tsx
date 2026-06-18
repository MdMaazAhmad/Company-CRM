// src/app/(app)/layout.tsx
// Layout for all authenticated app pages. Server component: resolves the session
// user + effective org (honouring super-admin impersonation) and renders the
// sidebar chrome around the page. Blocked / suspended / expired orgs are bounced
// to /suspended. Auth pages (/login, /signup) live OUTSIDE this group.

import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let ctx;
  try {
    ctx = await requireOrg();
  } catch (e: any) {
    if (e?.message === "ORG_INACTIVE") redirect("/suspended");
    redirect("/login");
  }
  const { user, orgId, impersonating } = ctx;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  const me = {
    id: user.id,
    name: user.name,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin,
    avatarColor: user.avatarColor,
    orgName: org?.name ?? null,
  };

  return (
    <div className="flex min-h-screen flex-col">
      {impersonating && org && <ImpersonationBanner orgName={org.name} />}
      <div className="flex flex-1">
        <Sidebar me={me} />
        <main className="flex-1 p-10">{children}</main>
      </div>
    </div>
  );
}