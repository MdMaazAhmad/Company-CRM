import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const followUps = await prisma.followUp.findMany();
  for (const f of followUps) {
    await prisma.leadActivity.create({
      data: {
        orgId: f.orgId,
        contactId: f.contactId,
        type: "FOLLOW_UP",
        dueDate: f.dueDate,
        done: f.done,
        outcome: f.note ?? null,
        createdAt: f.createdAt,
      },
    });
  }
  console.log(`migrated ${followUps.length} follow-ups`);

  const interactions = await prisma.interaction.findMany();
  const typeMap: Record<string, string> = {
    call: "CALL", whatsapp: "WHATSAPP", email: "EMAIL", meeting: "MEETING",
  };
  for (const i of interactions) {
    await prisma.leadActivity.create({
      data: {
        orgId: i.orgId,
        contactId: i.contactId,
        type: typeMap[i.channel] ?? "NOTE",
        done: true,
        outcome: i.summary,
        createdAt: i.createdAt,
      },
    });
  }
  console.log(`migrated ${interactions.length} interactions`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());