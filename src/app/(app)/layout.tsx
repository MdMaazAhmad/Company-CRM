// src/app/(app)/layout.tsx
// Layout for all authenticated app pages. Server component: resolves the session
// user + org name and renders the sidebar chrome around the page. Auth pages
// (/login, /signup) live OUTSIDE this group, so they render with no sidebar.

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login"); // middleware also guards; this is a safety net

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
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
    <div className="flex min-h-screen">
      <Sidebar me={me} />
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}