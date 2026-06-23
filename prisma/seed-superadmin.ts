import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const PASSWORD = process.env.SUPERADMIN_PASSWORD;
const NAME = process.env.SUPERADMIN_NAME || "Super Admin";

const BANNED_PASSWORDS = ["changeme123!", "changeme123", "password", "admin123"];

async function main() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars before running.");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(EMAIL)) {
    throw new Error("SUPERADMIN_EMAIL is not a valid email.");
  }
  if (PASSWORD.length < 10) {
    throw new Error("SUPERADMIN_PASSWORD must be at least 10 characters.");
  }
  if (BANNED_PASSWORDS.includes(PASSWORD.toLowerCase())) {
    throw new Error("SUPERADMIN_PASSWORD is a known/default value. Choose a unique password.");
  }

  const org = await prisma.organization.upsert({
    where: { slug: "platform" },
    update: {},
    create: { name: "Web x Hunter Platform", slug: "platform", plan: "BUSINESS" },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const existing = await prisma.user.findFirst({ where: { email: EMAIL } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, isSuperAdmin: true, active: true, role: "OWNER" },
    });
    console.log(`Updated existing user ${EMAIL} → super admin.`);
  } else {
    await prisma.user.create({
      data: {
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
    console.log(`Created super admin ${EMAIL}.`);
  }

  console.log("\nLogin at /superadmin/login");
  console.log(`  Email: ${EMAIL}`);
  console.log("Remember to set SUPERADMIN_EMAILS in .env to include this email.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());