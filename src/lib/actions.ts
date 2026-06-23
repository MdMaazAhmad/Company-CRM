"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { assertCan } from "@/lib/permissions";
import { fd, fdInt, fdFloat, normPhone, normEmail } from "@/lib/form-utils";

export type CreateContactResult =
  | { ok: true }
  | { ok: false; duplicate: { id: string; name: string; stage: string } };

export async function createContact(formData: FormData): Promise<CreateContactResult> {
  const { orgId } = await requireOrg();

  const phone = fd(formData, "phone");
  const email = fd(formData, "email");
  const np = normPhone(phone);
  const ne = normEmail(email);

  if (np || ne) {
    const candidates = await prisma.contact.findMany({
      where: {
        orgId,
        OR: [
          ...(ne ? [{ email: { not: null } }] : []),
          ...(np ? [{ phone: { not: null } }] : []),
        ],
      },
      select: { id: true, name: true, stage: true, phone: true, email: true },
    });

    const dup = candidates.find(
      (c) =>
        (ne && normEmail(c.email) === ne) ||
        (np && normPhone(c.phone) === np)
    );

    if (dup) {
      return { ok: false, duplicate: { id: dup.id, name: dup.name, stage: dup.stage } };
    }
  }

  await prisma.contact.create({
    data: {
      orgId,
      name: String(formData.get("name") || "Unnamed"),
      business: fd(formData, "business"),
      phone,
      whatsapp: fd(formData, "whatsapp"),
      email,
      city: fd(formData, "city"),
      source: fd(formData, "source"),
      notes: fd(formData, "notes"),
      plan: fd(formData, "plan"),
      quotedPrice: fdInt(formData, "quotedPrice"),
      gstin: fd(formData, "gstin"),
      state: fd(formData, "state"),
      billingAddress: fd(formData, "billingAddress"),
      stage: "LEAD",
      status: String(formData.get("status") || "NEW"),
    },
  });
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

export async function updateContact(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing contact id.");
  await prisma.contact.updateMany({
    where: { id, orgId },
    data: {
      name: String(formData.get("name") || "Unnamed"),
      business: fd(formData, "business"),
      phone: fd(formData, "phone"),
      whatsapp: fd(formData, "whatsapp"),
      email: fd(formData, "email"),
      city: fd(formData, "city"),
      source: fd(formData, "source"),
      notes: fd(formData, "notes"),
      plan: fd(formData, "plan"),
      quotedPrice: fdInt(formData, "quotedPrice"),
      gstin: fd(formData, "gstin"),
      state: fd(formData, "state"),
      billingAddress: fd(formData, "billingAddress"),
    },
  });
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function setContactStatus(id: string, status: string) {
  const { orgId } = await requireOrg();
  const data: { status: string; stage?: string; convertedAt?: Date } = { status };
  if (status === "CONVERTED") {
    data.stage = "CLIENT";
    data.convertedAt = new Date();
  }
  await prisma.contact.updateMany({ where: { id, orgId }, data });
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function convertContact(id: string) {
  const { orgId } = await requireOrg();
  await prisma.contact.updateMany({
    where: { id, orgId },
    data: { stage: "CLIENT", status: "CONVERTED", convertedAt: new Date() },
  });
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function revertToLead(id: string) {
  const { orgId } = await requireOrg();
  await prisma.contact.updateMany({
    where: { id, orgId },
    data: { stage: "LEAD", status: "NEGOTIATING", convertedAt: null },
  });
  revalidatePath("/clients");
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function deleteContact(id: string) {
  const { orgId } = await requireOrg();
  await prisma.contact.deleteMany({ where: { id, orgId } });
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function createProject(formData: FormData) {
  const { orgId } = await requireOrg();
  const contactId = String(formData.get("contactId") || "");
  if (!contactId) throw new Error("A project needs a client.");
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, orgId },
    select: { id: true },
  });
  if (!contact) throw new Error("Client not found.");

  const dueRaw = String(formData.get("dueDate") || "");
  const billingType = String(formData.get("billingType") || "ONE_TIME");
  const monthly = billingType === "MONTHLY";

  await prisma.project.create({
    data: {
      orgId,
      contactId,
      name: String(formData.get("name") || "Untitled project"),
      status: String(formData.get("status") || "NOT_STARTED"),
      price: monthly ? null : fdInt(formData, "price"),
      dueDate: dueRaw ? new Date(dueRaw) : null,
      liveUrl: fd(formData, "liveUrl"),
      notes: fd(formData, "notes"),
      billingType,
      monthlyAmount: monthly ? fdInt(formData, "monthlyAmount") : null,
      splitBilling: monthly && formData.get("splitBilling") === "true",
      billingActive: monthly ? formData.get("billingActive") === "on" : true,
      billingStart: monthly ? new Date() : null,
      gstRate: fdFloat(formData, "gstRate"),
      hsnSac: fd(formData, "hsnSac"),
      taxMode: String(formData.get("taxMode") || "INTRA"),
    },
  });
  revalidatePath("/projects");
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function updateProject(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing project id.");

  const existing = await prisma.project.findFirst({
    where: { id, orgId },
    select: { billingType: true, billingStart: true },
  });
  if (!existing) throw new Error("Project not found.");

  const dueRaw = String(formData.get("dueDate") || "");
  const billingType = String(formData.get("billingType") || "ONE_TIME");
  const monthly = billingType === "MONTHLY";

  await prisma.project.updateMany({
    where: { id, orgId },
    data: {
      name: String(formData.get("name") || "Untitled project"),
      status: String(formData.get("status") || "NOT_STARTED"),
      price: monthly ? null : fdInt(formData, "price"),
      dueDate: dueRaw ? new Date(dueRaw) : null,
      liveUrl: fd(formData, "liveUrl"),
      notes: fd(formData, "notes"),
      billingType,
      monthlyAmount: monthly ? fdInt(formData, "monthlyAmount") : null,
      splitBilling: monthly && formData.get("splitBilling") === "true",
      billingActive: monthly ? formData.get("billingActive") === "on" : true,
      billingStart: monthly ? existing.billingStart ?? new Date() : null,
      gstRate: fdFloat(formData, "gstRate"),
      hsnSac: fd(formData, "hsnSac"),
      taxMode: String(formData.get("taxMode") || "INTRA"),
    },
  });
  revalidatePath("/projects");
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function setProjectStatus(id: string, status: string) {
  const { orgId } = await requireOrg();
  await prisma.project.updateMany({ where: { id, orgId }, data: { status } });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function deleteProject(id: string) {
  const { orgId } = await requireOrg();
  await prisma.project.deleteMany({ where: { id, orgId } });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function addPayment(formData: FormData) {
  const { orgId } = await requireOrg();
  const projectId = String(formData.get("projectId") || "");
  if (!projectId) throw new Error("A payment needs a project.");
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found.");
  const paidRaw = String(formData.get("paidAt") || "");
  await prisma.payment.create({
    data: {
      orgId,
      projectId,
      amount: fdInt(formData, "amount") ?? 0,
      kind: String(formData.get("kind") || "PARTIAL"),
      method: fd(formData, "method"),
      note: fd(formData, "note"),
      paidAt: paidRaw ? new Date(paidRaw) : new Date(),
    },
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function settleProject(projectId: string) {
  const { orgId } = await requireOrg();
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    include: { payments: true },
  });
  if (!project) throw new Error("Project not found.");
  const paid = project.payments.reduce((s, p) => s + p.amount, 0);
  const balance = (project.price ?? 0) - paid;
  if (balance <= 0) return;
  await prisma.payment.create({
    data: {
      orgId,
      projectId,
      amount: balance,
      kind: "FINAL",
      note: "Final settlement",
      paidAt: new Date(),
    },
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function deletePayment(id: string) {
  const { orgId } = await requireOrg();
  const payment = await prisma.payment.findFirst({
    where: { id, orgId },
    select: { projectId: true },
  });
  if (!payment) return;
  await prisma.payment.deleteMany({ where: { id, orgId } });
  revalidatePath(`/projects/${payment.projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function createLeadActivity(formData: FormData) {
  const { orgId } = await requireOrg();
  const contactId = String(formData.get("contactId") || "");
  if (!contactId) throw new Error("An activity needs a contact.");
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, orgId },
    select: { id: true },
  });
  if (!contact) throw new Error("Contact not found.");
  const dueRaw = String(formData.get("dueDate") || "");
  await prisma.leadActivity.create({
    data: {
      orgId,
      contactId,
      type: String(formData.get("type") || "FOLLOW_UP"),
      dueDate: dueRaw ? new Date(dueRaw) : null,
      outcome: fd(formData, "outcome"),
    },
  });
  revalidatePath("/follow-ups");
  revalidatePath("/");
}

export async function toggleLeadActivity(id: string, done: boolean) {
  const { orgId } = await requireOrg();
  await prisma.leadActivity.updateMany({ where: { id, orgId }, data: { done } });
  revalidatePath("/follow-ups");
  revalidatePath("/");
}

export async function deleteLeadActivity(id: string) {
  const { orgId } = await requireOrg();
  await prisma.leadActivity.deleteMany({ where: { id, orgId } });
  revalidatePath("/follow-ups");
  revalidatePath("/");
}

export async function createPlan(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  await prisma.plan.create({
    data: {
      orgId,
      name: String(formData.get("name") || "Untitled plan"),
      category: String(formData.get("category") || "WordPress"),
      sellPrice: fdInt(formData, "sellPrice") ?? 0,
      breakPrice: fdInt(formData, "breakPrice") ?? 0,
      delivery: String(formData.get("delivery") || ""),
      active: formData.get("active") === "on",
      sortOrder: fdInt(formData, "sortOrder") ?? 0,
      gstRate: fdFloat(formData, "gstRate"),
      hsnSac: fd(formData, "hsnSac"),
    },
  });
  revalidatePath("/manage");
}

export async function updatePlan(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  const id = String(formData.get("id"));
  const featuresRaw = String(formData.get("features") ?? "");
  const features = JSON.stringify(
    featuresRaw
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
  );
  await prisma.plan.updateMany({
    where: { id, orgId },
    data: {
      name: String(formData.get("name")),
      category: String(formData.get("category")),
      sellPrice: fdInt(formData, "sellPrice") ?? 0,
      regularPrice: fdInt(formData, "regularPrice"),
      breakPrice: fdInt(formData, "breakPrice") ?? 0,
      delivery: String(formData.get("delivery")),
      active: formData.get("active") === "on",
      sortOrder: fdInt(formData, "sortOrder") ?? 0,
      gstRate: fdFloat(formData, "gstRate"),
      hsnSac: fd(formData, "hsnSac"),
      tagline: fd(formData, "tagline"),
      features,
      costMin: fdInt(formData, "costMin"),
      costMax: fdInt(formData, "costMax"),
      target: fd(formData, "target"),
      pitch: fd(formData, "pitch"),
      objection: fd(formData, "objection"),
      upsell: fd(formData, "upsell"),
    },
  });
  revalidatePath(`/manage/plans/${id}`);
  revalidatePath("/manage");
}

export async function deletePlan(id: string) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  await prisma.plan.deleteMany({ where: { id, orgId } });
  revalidatePath("/manage");
}

export async function createSource(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  await prisma.source.create({
    data: { orgId, label: String(formData.get("label") || "Untitled"), active: true },
  });
  revalidatePath("/manage");
}

export async function deleteSource(id: string) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  await prisma.source.deleteMany({ where: { id, orgId } });
  revalidatePath("/manage");
}

export async function createCategory(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  await prisma.category.create({
    data: {
      orgId,
      label: String(formData.get("label") || "Untitled"),
      color: String(formData.get("color") || "#94A3B8"),
      sortOrder: fdInt(formData, "sortOrder") ?? 0,
    },
  });
  revalidatePath("/manage");
}

export async function deleteCategory(id: string) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  await prisma.category.deleteMany({ where: { id, orgId } });
  revalidatePath("/manage");
}

export async function assignContact(id: string, assigneeId: string | null) {
  const { orgId } = await requireOrg();
  if (assigneeId) {
    const member = await prisma.user.findFirst({
      where: { id: assigneeId, orgId, active: true, team: { in: ["SALES", "BOTH"] } },
      select: { id: true },
    });
    if (!member) throw new Error("That teammate can't be assigned leads.");
  }
  await prisma.contact.updateMany({ where: { id, orgId }, data: { assigneeId } });
  revalidatePath("/leads");
  revalidatePath("/my-leads");
  revalidatePath("/");
}

export async function setNextAction(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing contact id.");
  const atRaw = String(formData.get("nextActionAt") || "");
  await prisma.contact.updateMany({
    where: { id, orgId },
    data: {
      nextActionAt: atRaw ? new Date(atRaw) : null,
      nextActionNote: fd(formData, "nextActionNote"),
    },
  });
  revalidatePath("/leads");
  revalidatePath("/my-leads");
  revalidatePath("/");
}

export async function clearNextAction(id: string) {
  const { orgId } = await requireOrg();
  await prisma.contact.updateMany({
    where: { id, orgId },
    data: { nextActionAt: null, nextActionNote: null },
  });
  revalidatePath("/leads");
  revalidatePath("/my-leads");
  revalidatePath("/");
}

export async function renameCategory(formData: FormData) {
  const { user, orgId } = await requireOrg();
  assertCan(user, "manage_pricing");
  const id = String(formData.get("id") || "");
  const newLabel = String(formData.get("label") || "").trim();
  if (!id || !newLabel) throw new Error("Category name required.");

  const cat = await prisma.category.findFirst({ where: { id, orgId }, select: { label: true } });
  if (!cat) throw new Error("Category not found.");
  if (cat.label === newLabel) return;

  await prisma.$transaction([
    prisma.category.updateMany({ where: { id, orgId }, data: { label: newLabel } }),
    prisma.plan.updateMany({ where: { orgId, category: cat.label }, data: { category: newLabel } }),
  ]);

  revalidatePath("/manage");
}