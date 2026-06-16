// middleware.ts  (project root)
// Imports ONLY the edge-safe config — Prisma never enters the Edge bundle.
// The access logic lives in authConfig.callbacks.authorized.

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};