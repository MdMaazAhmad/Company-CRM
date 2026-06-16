// prisma/migrate-to-contacts.ts
// One-time migration: reads your OLD exported data and writes it into the NEW
// Contact-based schema. Run AFTER you've reset the DB to the new schema (see
// the step-by-step in chat). Reads from the ALL.json you exported earlier.
//
// Run with:  npx tsx prisma/migrate-to-contacts.ts <path-to-ALL.json>
// Example:   npx tsx prisma/migrate-to-contacts.ts backups/2026-06-13T14-29-15__ALL.json
//
// Safe: it only INSERTS into a fresh database. Your dev.backup.db is untouched.

import { PrismaClient } from "@/generated/prisma";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

type OldClient = {
  id: string;
  name: string;
  business: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type OldLead = {
  id: string;
  clientId: string;
  plan: string | null;
  quotedPrice: number | null;
  status: string;
  dropReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type OldProject = {
  id: string;
  leadId: string;
  name: string;
  status: string;
  price: number | null;
  advancePaid: number | null;
  dueDate: string | null;
  liveUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type OldPayment = {
  id: string;
  projectId: string;
  amount: number;
  kind: string;
  method: string | null;
  note: string | null;
  paidAt: string;
  createdAt: string;
};

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error(
      "Usage: npx tsx prisma/migrate-to-contacts.ts <path-to-ALL.json>"
    );
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(file, "utf8"));
  const clients: OldClient[] = data.clients ?? [];
  const leads: OldLead[] = data.leads ?? [];
  const projects: OldProject[] = data.projects ?? [];
  const payments: OldPayment[] = data.payments ?? [];

  // Map clientId -> its single lead (1:1 in your data).
  const leadByClient = new Map<string, OldLead>();
  for (const l of leads) leadByClient.set(l.clientId, l);

  // We keep the OLD client id as the new Contact id, so projects/payments
  // re-point cleanly via a clientId lookup below.
  // Build a map oldLeadId -> contactId (= old clientId) for project re-pointing.
  const contactIdByLeadId = new Map<string, string>();

  let asClient = 0;
  let asLead = 0;

  for (const c of clients) {
    const lead = leadByClient.get(c.id);
    const status = lead?.status ?? "NEW";
    const stage = status === "CONVERTED" ? "CLIENT" : "LEAD";
    if (stage === "CLIENT") asClient++;
    else asLead++;

    await prisma.contact.create({
      data: {
        id: c.id, // reuse old client id as the contact id
        name: c.name,
        business: c.business,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        city: c.city,
        source: c.source,
        notes: c.notes, // client notes kept; lead notes dropped per your choice
        stage,
        status,
        plan: lead?.plan ?? null,
        quotedPrice: lead?.quotedPrice ?? null,
        dropReason: lead?.dropReason ?? null,
        convertedAt: status === "CONVERTED" ? new Date(lead!.updatedAt) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });

    if (lead) contactIdByLeadId.set(lead.id, c.id);
  }

  // Projects: re-point from old leadId -> contactId.
  for (const p of projects) {
    const contactId = contactIdByLeadId.get(p.leadId);
    if (!contactId) {
      console.warn(`⚠ project ${p.id} had leadId ${p.leadId} with no contact — skipped`);
      continue;
    }
    await prisma.project.create({
      data: {
        id: p.id,
        contactId,
        name: p.name,
        status: p.status,
        price: p.price,
        dueDate: p.dueDate ? new Date(p.dueDate) : null,
        liveUrl: p.liveUrl,
        notes: p.notes,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
  }

  // Payments: ride on project, ids unchanged.
  for (const pay of payments) {
    await prisma.payment.create({
      data: {
        id: pay.id,
        projectId: pay.projectId,
        amount: pay.amount,
        kind: pay.kind,
        method: pay.method,
        note: pay.note,
        paidAt: new Date(pay.paidAt),
        createdAt: new Date(pay.createdAt),
      },
    });
  }

  console.log("=== Migration complete ===");
  console.log(`Contacts created: ${clients.length}`);
  console.log(`  stage CLIENT: ${asClient}`);
  console.log(`  stage LEAD:   ${asLead}`);
  console.log(`Projects: ${projects.length}`);
  console.log(`Payments: ${payments.length}`);
  console.log("\nExpected: 17 contacts (1 CLIENT, 16 LEAD), 1 project, 1 payment.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });