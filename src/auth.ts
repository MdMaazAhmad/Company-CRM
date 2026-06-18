import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email as string | undefined)?.trim().toLowerCase();
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findFirst({
          where: { email, active: true },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          orgId: user.orgId,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          avatarColor: user.avatarColor,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      const u = user as { id?: string; orgId?: string };
      if (!u.id || !u.orgId) return;
      await prisma.loginSession.create({
        data: { orgId: u.orgId, userId: u.id },
      });
    },
    async signOut(message) {
      const token = (message as { token?: { uid?: string } }).token;
      const uid = token?.uid;
      if (!uid) return;
      const open = await prisma.loginSession.findFirst({
        where: { userId: uid, logoutAt: null },
        orderBy: { loginAt: "desc" },
      });
      if (open) {
        await prisma.loginSession.update({
          where: { id: open.id },
          data: { logoutAt: new Date() },
        });
      }
    },
  },
});