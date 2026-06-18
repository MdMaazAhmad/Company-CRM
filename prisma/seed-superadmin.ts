import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "admin@webxhunter.com";
const PASSWORD = "ChangeMe123!";
const NAME = "Super Admin";

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "platform" },
    update: {},
    create: { name: "Web x Hunter Platform", slug: "platform", plan: "BUSINESS" },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const email = EMAIL.trim().toLowerCase();

  const existing = await prisma.user.findFirst({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, isSuperAdmin: true, active: true, role: "OWNER" },
    });
    console.log(`Updated existing user ${email} → super admin.`);
  } else {
    await prisma.user.create({
      data: {
        orgId: org.id,
        name: NAME,
        email,
        passwordHash,
        role: "OWNER",
        isSuperAdmin: true,
        active: true,
        avatarColor: "#FF6B00",
      },
    });
    console.log(`Created super admin ${email}.`);
  }

  console.log("\nLogin at /superadmin/login");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log("\nChange the password after first login, and set SUPERADMIN_EMAILS in .env to this email.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());