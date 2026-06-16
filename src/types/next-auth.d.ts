// src/types/next-auth.d.ts
// Module augmentation so TypeScript knows about our custom session/JWT fields.

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string;
      role: string;
      isSuperAdmin: boolean;
      avatarColor: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    orgId?: string;
    role?: string;
    isSuperAdmin?: boolean;
    avatarColor?: string;
  }
}