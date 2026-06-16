"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/generated/prisma";

/**
 * Result shape returned to the client form. We never throw across the
 * server-action boundary for expected validation issues — we return a
 * structured error the form can render inline.
 */
export type SignupResult =
  | { ok: true; orgSlug: string; email: string }
  | { ok: false; error: string; field?: "company" | "name" | "email" | "password" };

const COLORS = [
  "#FF6B00", "#2563EB", "#16A34A", "#DB2777",
  "#06B6D4", "#F59E0B", "#7C3AED", "#0D9488",
];

function pickColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/** company name -> url-safe base slug */
function baseSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "workspace";
}

/** Find a slug that isn't taken, appending -2, -3, ... if needed. */
async function uniqueSlug(db: PrismaClient, name: string) {
  const base = baseSlug(name);
  let candidate = base;
  let n = 1;
  // slug is @unique on Organization
  while (await db.organization.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

export async function createWorkspace(formData: FormData): Promise<SignupResult> {
  const company = String(formData.get("company") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // ── validation ──────────────────────────────────────────────
  if (company.length < 2)
    return { ok: false, error: "Enter your company name.", field: "company" };
  if (name.length < 2)
    return { ok: false, error: "Enter your name.", field: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Enter a valid email address.", field: "email" };
  if (password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters.", field: "password" };

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slug = await uniqueSlug(tx as PrismaClient, company);

      const org = await tx.organization.create({
        data: {
          name: company,
          slug,
          plan: "FREE",
          active: true,
        },
      });

      // email is @@unique([orgId, email]) — scoped per org, so the same
      // address can own a workspace elsewhere. Fresh org => never collides.
      await tx.user.create({
        data: {
          orgId: org.id,
          name,
          email,
          passwordHash,
          role: "OWNER",
          isSuperAdmin: false,
          active: true,
          avatarColor: pickColor(),
        },
      });

      return { slug: org.slug };
    });

    return { ok: true, orgSlug: result.slug, email };
  } catch (err) {
    console.error("createWorkspace failed:", err);
    return { ok: false, error: "Couldn't create the workspace. Try again." };
  }
}