import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAllowlistedSuperAdmin, orgIsUsable } from "@/lib/superadmin";

export type SessionUser = {
  id: string;
  orgId: string;
  role: string;
  isSuperAdmin: boolean;
  name?: string | null;
  email?: string | null;
  avatarColor: string;
};

const IMPERSONATE_COOKIE = "impersonate_org";

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** The org a super-admin is currently impersonating, if any (and valid). */
export async function getImpersonatedOrgId(user: SessionUser): Promise<string | null> {
  if (!isAllowlistedSuperAdmin(user)) return null;
  const jar = await cookies();
  const target = jar.get(IMPERSONATE_COOKIE)?.value;
  return target && target !== user.orgId ? target : null;
}

/**
 * Returns { user, orgId } for tenant-scoped work.
 *  - Resolves the EFFECTIVE org: the impersonated org for an allowlisted
 *    super-admin, otherwise the user's own org.
 *  - Hard-denies blocked / suspended / expired orgs — EXCEPT for super-admins,
 *    so blocking an org never locks you out of fixing it.
 */
export async function requireOrg(): Promise<{ user: SessionUser; orgId: string; impersonating: boolean }> {
  const user = await requireSession();
  const superAdmin = isAllowlistedSuperAdmin(user);

  const impersonatedId = await getImpersonatedOrgId(user);
  const orgId = impersonatedId ?? user.orgId;

  if (!superAdmin) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { status: true, active: true, subscribedUntil: true },
    });
    if (!orgIsUsable(org)) throw new Error("ORG_INACTIVE");
  }

  return { user, orgId, impersonating: impersonatedId != null };
}