// prisma/backfill-org.ts
// One-time migration for the single-tenant → multi-tenant switch (Path A).
// Run AFTER pushing the schema with orgId nullable.
//
//   npx tsx prisma/backfill-org.ts
//
// Creates the Web x Hunter organization, then stamps every existing row
// (which currently has orgId = null) with that org's id. Idempotent: safe
// to run more than once — it reuses the org by slug and only updates nulls.

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const ORG_NAME = "Web x Hunter";
const ORG_SLUG = "web-x-hunter";

async function main() {
  // 1. Create (or reuse) the default organization.
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { name: ORG_NAME, slug: ORG_SLUG, plan: "BUSINESS", active: true },
  });
  console.log(`Organization ready: ${org.name} (${org.id})`);

  // 2. Stamp every table that has an orgId. updateMany with orgId: null filter
  //    so re-runs don't clobber rows that already belong to another org.
  const stamp = { orgId: org.id };
  const where = { orgId: null };

  const results: Record<string, number> = {};
  results.Contact      = (await prisma.contact.updateMany({ where, data: stamp })).count;
  results.Project      = (await prisma.project.updateMany({ where, data: stamp })).count;
  results.Payment      = (await prisma.payment.updateMany({ where, data: stamp })).count;
  results.FollowUp     = (await prisma.followUp.updateMany({ where, data: stamp })).count;
  results.Interaction  = (await prisma.interaction.updateMany({ where, data: stamp })).count;
  results.Plan         = (await prisma.plan.updateMany({ where, data: stamp })).count;
  results.Source       = (await prisma.source.updateMany({ where, data: stamp })).count;
  results.User         = (await prisma.user.updateMany({ where, data: stamp })).count;
  results.Task         = (await prisma.task.updateMany({ where, data: stamp })).count;
  results.TaskActivity = (await prisma.taskActivity.updateMany({ where, data: stamp })).count;
  results.TaskComment  = (await prisma.taskComment.updateMany({ where, data: stamp })).count;
  results.TimeLog      = (await prisma.timeLog.updateMany({ where, data: stamp })).count;

  console.log("Rows stamped with orgId:");
  for (const [model, count] of Object.entries(results)) {
    console.log(`  ${model.padEnd(14)} ${count}`);
  }

  // 3. Safety check — confirm nothing is left null in the core tables.
  const orphanContacts = await prisma.contact.count({ where: { orgId: null } });
  const orphanProjects = await prisma.project.count({ where: { orgId: null } });
  if (orphanContacts || orphanProjects) {
    throw new Error(
      `Backfill incomplete: ${orphanContacts} contacts, ${orphanProjects} projects still have null orgId. Do NOT make orgId required yet.`
    );
  }
  console.log("\n✓ All core rows have an orgId. Safe to make orgId required (Step 3).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());