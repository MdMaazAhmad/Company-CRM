import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const ORG_NAME = process.env.ORG_NAME;
const OWNER_NAME = process.env.OWNER_NAME;
const OWNER_EMAIL = process.env.OWNER_EMAIL?.toLowerCase();
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;

const STARTER_CATEGORIES = [
  { label: "Service", color: "#2563EB", sortOrder: 1 },
  { label: "Retainer", color: "#16A34A", sortOrder: 2 },
  { label: "Project", color: "#FF6B00", sortOrder: 3 },
];

const STARTER_SOURCES = ["Referral", "Instagram", "Website", "WhatsApp", "Walk-in"];

async function main() {
  if (!ORG_NAME || !OWNER_NAME || !OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error(
      "Set ORG_NAME, OWNER_NAME, OWNER_EMAIL and OWNER_PASSWORD env vars before running."
    );
  }
  if (OWNER_PASSWORD.length < 8) {
    throw new Error("OWNER_PASSWORD must be at least 8 characters.");
  }

  const slug = slugify(ORG_NAME);

  const existingOrg = await prisma.organization.findUnique({ where: { slug } });
  if (existingOrg) {
    throw new Error(`An org with slug "${slug}" already exists. Choose a different ORG_NAME.`);
  }

  const org = await prisma.organization.create({
    data: { name: ORG_NAME, slug, plan: "BUSINESS", active: true },
  });

  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);

  const owner = await prisma.user.create({
    data: {
      orgId: org.id,
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      passwordHash,
      role: "OWNER",
      isSuperAdmin: false,
      active: true,
      avatarColor: "#FF6B00",
    },
  });

  await prisma.category.createMany({
    data: STARTER_CATEGORIES.map((c) => ({ ...c, orgId: org.id })),
  });

  await prisma.source.createMany({
    data: STARTER_SOURCES.map((label) => ({ orgId: org.id, label, active: true })),
  });

  console.log("✓ Organization provisioned");
  console.log(`  Org:    ${org.name} (${org.id})  slug=${org.slug}`);
  console.log(`  Owner:  ${owner.name} <${owner.email}>  role=OWNER`);
  console.log(`  Starter: ${STARTER_CATEGORIES.length} categories, ${STARTER_SOURCES.length} sources`);
  console.log(`  No plans seeded — owner adds their own from /manage.`);
  console.log("\n⚠  Tell the owner to change their password after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());