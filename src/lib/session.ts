// src/lib/session.ts
// Helpers every server action uses to read the logged-in user's tenancy.
// Calling requireSession() at the top of an action guarantees you have an
// orgId to filter/stamp by — the core of multi-tenant isolation.

import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  orgId: string;
  role: string;
  isSuperAdmin: boolean;
  name?: string | null;
  email?: string | null;
  avatarColor: string;
};

/** Returns the current user or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

/** Returns the current user or throws — use at the top of protected actions. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Returns { user, orgId } — the common case in actions. */
export async function requireOrg(): Promise<{ user: SessionUser; orgId: string }> {
  const user = await requireSession();
  return { user, orgId: user.orgId };
}