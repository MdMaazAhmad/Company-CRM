import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const PLANS = [
  { name: "FREE", monthlyPrice: 0, sortOrder: 1 },
  { name: "PRO", monthlyPrice: 999, sortOrder: 2 },
  { name: "BUSINESS", monthlyPrice: 2499, sortOrder: 3 },
];

async function main() {
  for (const p of PLANS) {
    await prisma.platformPlan.upsert({
      where: { name: p.name },
      update: { monthlyPrice: p.monthlyPrice, sortOrder: p.sortOrder },
      create: { ...p, active: true },
    });
    console.log("plan:", p.name, "₹" + p.monthlyPrice);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());