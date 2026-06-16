
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

const PLANS = [
  { name: "WP Starter", category: "WordPress", sellPrice: 7999, breakPrice: 4999, delivery: "10–15 days", sortOrder: 1 },
  { name: "WP Business", category: "WordPress", sellPrice: 17999, breakPrice: 11999, delivery: "15–20 days", sortOrder: 2 },
  { name: "WP Professional", category: "WordPress", sellPrice: 32999, breakPrice: 21999, delivery: "20–25 days", sortOrder: 3 },
  { name: "Shopify Standard", category: "Shopify", sellPrice: 11999, breakPrice: 7999, delivery: "15 days", sortOrder: 4 },
  { name: "Shopify Premium", category: "Shopify", sellPrice: 24999, breakPrice: 16999, delivery: "18 days", sortOrder: 5 },
  { name: "Shopify Platinum", category: "Shopify", sellPrice: 49999, breakPrice: 34999, delivery: "20 days", sortOrder: 6 },
  { name: "Landing Page", category: "Custom", sellPrice: 7999, breakPrice: 4999, delivery: "7–10 days", sortOrder: 7 },
  { name: "Basic Website", category: "Custom", sellPrice: 14999, breakPrice: 9999, delivery: "15–20 days", sortOrder: 8 },
  { name: "Custom E-Commerce", category: "Custom", sellPrice: 50000, breakPrice: 35000, delivery: "2–3 months", sortOrder: 9 },
  { name: "Multivendor", category: "Custom", sellPrice: 100000, breakPrice: 75000, delivery: "4–7 months", sortOrder: 10 },
];

const SOURCES = ["Referral", "Instagram", "Ad", "Walk-in"];

async function main() {
  for (const plan of PLANS) {
    const exists = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!exists) {
      await prisma.plan.create({ data: { ...plan, active: true } });
      console.log("＋ plan:", plan.name);
    } else {
      console.log("· skipped (exists):", plan.name);
    }
  }

  for (const label of SOURCES) {
    const exists = await prisma.source.findFirst({ where: { label } });
    if (!exists) {
      await prisma.source.create({ data: { label, active: true } });
      console.log("＋ source:", label);
    } else {
      console.log("· skipped (exists):", label);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });