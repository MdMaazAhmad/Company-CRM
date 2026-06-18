import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isSuperAdminLogin = pathname === "/superadmin/login";
      const isSuperAdminArea = pathname.startsWith("/superadmin");

      const isPublic =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/login/") ||
        pathname.startsWith("/signup/") ||
        isSuperAdminLogin;

      if (isPublic) {
        if (isLoggedIn && !isSuperAdminLogin) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      if (isSuperAdminArea) {
        return isLoggedIn && (auth!.user as any).isSuperAdmin === true;
      }

      return isLoggedIn;
    },

    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.orgId = (user as any).orgId;
        token.role = (user as any).role;
        token.isSuperAdmin = (user as any).isSuperAdmin;
        token.avatarColor = (user as any).avatarColor;
        token.email = (user as any).email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.orgId = token.orgId as string;
        session.user.role = token.role as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.avatarColor = token.avatarColor as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;