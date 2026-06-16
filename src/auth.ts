// src/auth.ts
// Full auth setup (Node runtime). Spreads the edge-safe authConfig and adds the
// Credentials provider whose authorize() uses Prisma + bcrypt. This file is
// imported by server components, server actions, and the route handler — NOT by
// middleware (middleware imports auth.config.ts only).

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
});