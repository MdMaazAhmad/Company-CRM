// prisma/seed-owner.ts
// Creates your OWNER + super-admin account, attached to the Web x Hunter org
// (the same org created by backfill-org.ts). Run after the multi-tenant
// migration is complete.
//
//   npx tsx prisma/seed-owner.ts
//
// Credentials are read from env so you don't hard-code a password:
//   OWNER_EMAIL=maaz@webxhunter.com OWNER_PASSWORD=yourpass npx tsx prisma/seed-owner.ts
// Falls back to the defaults below if env vars are absent. CHANGE THE PASSWORD
// after first login.

import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ORG_SLUG = "web-x-hunter";
const NAME = process.env.OWNER_NAME || "Maaz";
const EMAIL = (process.env.OWNER_EMAIL || "maaz@webxhunter.com").toLowerCase();
const PASSWORD = process.env.OWNER_PASSWORD || "changeme123";

async function main() {
  // Org must already exist (from backfill-org.ts). Create it if somehow missing.
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { name: "Web x Hunter", slug: ORG_SLUG, plan: "BUSINESS", active: true },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: EMAIL } },
    update: { role: "OWNER", isSuperAdmin: true, active: true },
    create: {
      orgId: org.id,
      name: NAME,
      email: EMAIL,
      passwordHash,
      role: "OWNER",
      isSuperAdmin: true,
      active: true,
      avatarColor: "#FF6B00",
    },
  });

  console.log(`✓ OWNER account ready:`);
  console.log(`  Org:   ${org.name} (${org.id})`);
  console.log(`  User:  ${user.name} <${user.email}>`);
  console.log(`  Role:  ${user.role}  superAdmin=${user.isSuperAdmin}`);
  if (PASSWORD === "changeme123") {
    console.log(`\n⚠  Using default password "changeme123" — change it after first login.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());