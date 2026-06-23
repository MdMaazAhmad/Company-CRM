// middleware.ts  (project root)
// Imports ONLY the edge-safe config — Prisma never enters the Edge bundle.
// The access logic lives in authConfig.callbacks.authorized.

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { type NextRequest, NextResponse } from "next/server";

// ── Rate limiter ──────────────────────────────────────────────────────────────
// Sliding-window, in-memory. Works for single-instance deployments (VPS, single
// container). For multi-instance / multi-region, swap the Map for Upstash Redis
// — one function change in checkRateLimit().

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 5;   // failed-login attempts per IP per window

type RateWindow = { count: number; start: number };
const loginWindows = new Map<string, RateWindow>();

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const w = loginWindows.get(ip);

  if (!w || now - w.start >= WINDOW_MS) {
    loginWindows.set(ip, { count: 1, start: now });
    return false; // within limit
  }
  if (w.count >= MAX_ATTEMPTS) return true; // blocked
  w.count++;
  return false;
}

// Remove entries older than two windows so the Map doesn't grow unbounded in
// long-running processes (dev server, single Node container).
function pruneStale() {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [ip, w] of loginWindows) {
    if (w.start < cutoff) loginWindows.delete(ip);
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
const { auth } = NextAuth(authConfig);

export async function middleware(req: NextRequest) {
  // Rate-limit the credentials sign-in endpoint before NextAuth processes it.
  if (
    req.method === "POST" &&
    req.nextUrl.pathname === "/api/auth/callback/credentials"
  ) {
    pruneStale();
    if (checkRateLimit(clientIp(req))) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    // Within limit — pass through to the NextAuth route handler.
    return NextResponse.next();
  }

  // All other routes: NextAuth session/auth check (redirects unauthenticated
  // users, enforces superadmin guard, etc.).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (auth as unknown as (req: NextRequest) => Promise<Response>)(req);
}

export const config = {
  matcher: [
    // Must be listed explicitly so our rate-limit block fires before NextAuth.
    "/api/auth/callback/credentials",
    // Everything else except static assets.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
