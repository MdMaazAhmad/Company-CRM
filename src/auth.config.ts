// src/auth.config.ts
// Edge-safe slice of the auth setup. NO Prisma, NO bcrypt, NO Node-only APIs —
// this is what middleware imports, so it must stay clean enough to run in the
// Edge Runtime. The providers array is intentionally EMPTY here; the real
// Credentials provider (which needs Prisma) is added in src/auth.ts.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // real provider added in auth.ts (Node runtime)
  callbacks: {
    // Edge-safe gate used by middleware. Returning false/redirect controls access.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/login/") ||
        pathname.startsWith("/signup/");

      if (isPublic) {
        // Logged-in users shouldn't sit on auth pages.
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }
      // Protected route: allow only if logged in. Returning false makes
      // Auth.js redirect to the signIn page automatically.
      return isLoggedIn;
    },

    // Persist tenancy + role into the token on sign-in.
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.orgId = (user as any).orgId;
        token.role = (user as any).role;
        token.isSuperAdmin = (user as any).isSuperAdmin;
        token.avatarColor = (user as any).avatarColor;
      }
      return token;
    },

    // Expose them on the session object.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.orgId = token.orgId as string;
        session.user.role = token.role as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.avatarColor = token.avatarColor as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;