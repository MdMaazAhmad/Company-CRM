import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe<{ journal_mode: string }[]>(
    "PRAGMA journal_mode=WAL;"
  );
  console.log("journal_mode =", result[0]?.journal_mode);
}

main().finally(() => prisma.$disconnect());