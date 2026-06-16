// prisma/export-data.ts
// Exports every table to readable JSON in a /backups folder.
// Run with:  npx tsx prisma/export-data.ts
// (install tsx once if needed:  npm install -D tsx)
//
// Safe and read-only — it never writes to your database, only reads from it.

import { PrismaClient } from "@/generated/prisma";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

async function main() {
  const dir = join(process.cwd(), "backups");
  if (!existsSync(dir)) mkdirSync(dir);

  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19); // e.g. 2026-06-13T14-22-05

  // Pull every table. Wrapped in try/catch per model so a missing table
  // (e.g. if you haven't migrated Project/Payment yet) won't abort the rest.
  const dump: Record<string, unknown> = {};

  const tables: [string, () => Promise<unknown>][] = [
    ["clients", () => prisma.contact.findMany()],
    ["leads", () => prisma.contact.findMany()],
    ["followUps", () => prisma.followUp.findMany()],
    ["interactions", () => prisma.interaction.findMany()],
    ["projects", () => safe(() => prisma.project.findMany())],
    ["payments", () => safe(() => prisma.payment.findMany())],
    ["plans", () => safe(() => prisma.plan.findMany())],
    ["sources", () => safe(() => prisma.source.findMany())],
  ];

  for (const [name, fn] of tables) {
    const rows = await fn();
    dump[name] = rows;
    const count = Array.isArray(rows) ? rows.length : 0;
    // One file per table, plus a combined file below.
    writeFileSync(
      join(dir, `${stamp}__${name}.json`),
      JSON.stringify(rows, null, 2),
      "utf8"
    );
    console.log(`✓ ${name}: ${count} rows`);
  }

  // Combined snapshot of everything in one file.
  writeFileSync(
    join(dir, `${stamp}__ALL.json`),
    JSON.stringify(dump, null, 2),
    "utf8"
  );

  console.log(`\nBackup written to:  backups/${stamp}__*.json`);
}

// Returns [] if a table doesn't exist yet, instead of throwing.
async function safe<T>(fn: () => Promise<T>): Promise<T | []> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });