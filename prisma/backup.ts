// prisma/backup.ts
// Creates a timestamped backup of the current database:
//   1. A raw copy of dev.db  -> backups/<ts>__dev.db
//   2. A full JSON export    -> backups/<ts>__ALL.json
//
// Run:  npx tsx prisma/backup.ts
//
// The JSON export is schema-independent — it survives future schema changes,
// so you can always re-import even if columns change later.

import { PrismaClient } from "@/generated/prisma";
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

function stamp(): string {
  // 2026-06-15T14-30-05  (filesystem-safe)
  return new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
}

async function main() {
  const ts = stamp();
  const dir = "backups";
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // 1. Raw db file copy (instant full restore)
  const dbPath = join("prisma", "dev.db");
  if (existsSync(dbPath)) {
    copyFileSync(dbPath, join(dir, `${ts}__dev.db`));
    console.log(`  copied  ${dbPath} -> backups/${ts}__dev.db`);
  } else {
    console.warn(`  ! ${dbPath} not found — skipping raw copy`);
  }

  // 2. JSON export of every table
  const [contacts, projects, payments, followUps, plans, sources, interactions] =
    await Promise.all([
      prisma.contact.findMany(),
      prisma.project.findMany(),
      prisma.payment.findMany(),
      prisma.followUp.findMany(),
      prisma.plan.findMany(),
      prisma.source.findMany(),
      // Interaction may not have rows yet — guard in case the model is absent
      prisma.interaction?.findMany?.() ?? Promise.resolve([]),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schema: "contact-v1",
    counts: {
      contacts: contacts.length,
      projects: projects.length,
      payments: payments.length,
      followUps: followUps.length,
      plans: plans.length,
      sources: sources.length,
      interactions: interactions.length,
    },
    contacts,
    projects,
    payments,
    followUps,
    plans,
    sources,
    interactions,
  };

  const jsonPath = join(dir, `${ts}__ALL.json`);
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`  wrote   backups/${ts}__ALL.json`);

  console.log("\n=== Backup complete ===");
  console.table(payload.counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });