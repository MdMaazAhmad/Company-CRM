// src/app/team/page.tsx
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const me = await requireSession();

  if (!can(me, "manage_users")) redirect("/");

  const members = await prisma.user.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: true,
      active: true,
      avatarColor: true,
      isSuperAdmin: true,
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
  });

  return <TeamClient members={members} meId={me.id} />;
}