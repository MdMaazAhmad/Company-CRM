"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";

const str = (fd: FormData, k: string) => String(fd.get(k) || "") || null;
const intOrNull = (v: FormDataEntryValue | null) =>
  v == null || v === "" ? null : parseInt(String(v), 10);
const floatOrNull = (v: FormDataEntryValue | null) =>
  v == null || v === "" ? null : parseFloat(String(v));

export async function createContact(formData: FormData) {
  const { orgId } = await requireOrg();
  await prisma.contact.create({
    data: {
      orgId,
      name: String(formData.get("name") || "Unnamed"),
      business: str(formData, "business"),
      phone: str(formData, "phone"),
      whatsapp: str(formData, "whatsapp"),
      email: str(formData, "email"),
      city: str(formData, "city"),
      source: str(formData, "source"),
      notes: str(formData, "notes"),
      plan: str(formData, "plan"),
      quotedPrice: intOrNull(formData.get("quotedPrice")),
      stage: "LEAD",
      status: String(formData.get("status") || "NEW"),
    },
  });
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function updateContact(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing contact id.");
  await prisma.contact.updateMany({
    where: { id, orgId },
    data: {
      name: String(formData.get("name") || "Unnamed"),
      business: str(formData, "business"),
      phone: str(formData, "phone"),
      whatsapp: str(formData, "whatsapp"),
      email: str(formData, "email"),
      city: str(formData, "city"),
      source: str(formData, "source"),
      notes: str(formData, "notes"),
      plan: str(formData, "plan"),
      quotedPrice: intOrNull(formData.get("quotedPrice")),
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
      price: monthly ? null : intOrNull(formData.get("price")),
      dueDate: dueRaw ? new Date(dueRaw) : null,
      liveUrl: str(formData, "liveUrl"),
      notes: str(formData, "notes"),
      billingType,
      monthlyAmount: monthly ? intOrNull(formData.get("monthlyAmount")) : null,
      splitBilling: monthly && formData.get("splitBilling") === "true",
      billingActive: monthly ? formData.get("billingActive") === "on" : true,
      billingStart: monthly ? new Date() : null,
      gstRate: floatOrNull(formData.get("gstRate")),
      hsnSac: str(formData, "hsnSac"),
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
      price: monthly ? null : intOrNull(formData.get("price")),
      dueDate: dueRaw ? new Date(dueRaw) : null,
      liveUrl: str(formData, "liveUrl"),
      notes: str(formData, "notes"),
      billingType,
      monthlyAmount: monthly ? intOrNull(formData.get("monthlyAmount")) : null,
      splitBilling: monthly && formData.get("splitBilling") === "true",
      billingActive: monthly ? formData.get("billingActive") === "on" : true,
      billingStart: monthly ? existing.billingStart ?? new Date() : null,
      gstRate: floatOrNull(formData.get("gstRate")),
      hsnSac: str(formData, "hsnSac"),
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
      amount: intOrNull(formData.get("amount")) ?? 0,
      kind: String(formData.get("kind") || "PARTIAL"),
      method: str(formData, "method"),
      note: str(formData, "note"),
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

export async function createFollowUp(formData: FormData) {
  const { orgId } = await requireOrg();
  const contactId = String(formData.get("contactId") || "");
  if (!contactId) throw new Error("A follow-up needs a contact.");
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, orgId },
    select: { id: true },
  });
  if (!contact) throw new Error("Contact not found.");
  const dueRaw = String(formData.get("dueDate") || "");
  await prisma.followUp.create({
    data: {
      orgId,
      contactId,
      dueDate: dueRaw ? new Date(dueRaw) : new Date(),
      note: str(formData, "note"),
    },
  });
  revalidatePath("/follow-ups");
  revalidatePath("/");
}

export async function toggleFollowUp(id: string, done: boolean) {
  const { orgId } = await requireOrg();
  await prisma.followUp.updateMany({ where: { id, orgId }, data: { done } });
  revalidatePath("/follow-ups");
  revalidatePath("/");
}

export async function deleteFollowUp(id: string) {
  const { orgId } = await requireOrg();
  await prisma.followUp.deleteMany({ where: { id, orgId } });
  revalidatePath("/follow-ups");
  revalidatePath("/");
}

export async function createPlan(formData: FormData) {
  const { orgId } = await requireOrg();
  await prisma.plan.create({
    data: {
      orgId,
      name: String(formData.get("name") || "Untitled plan"),
      category: String(formData.get("category") || "WordPress"),
      sellPrice: intOrNull(formData.get("sellPrice")) ?? 0,
      breakPrice: intOrNull(formData.get("breakPrice")) ?? 0,
      delivery: String(formData.get("delivery") || ""),
      active: formData.get("active") === "on",
      sortOrder: intOrNull(formData.get("sortOrder")) ?? 0,
      gstRate: floatOrNull(formData.get("gstRate")),
      hsnSac: String(formData.get("hsnSac") ?? "") || null,
    },
  });
  revalidatePath("/manage");
}

export async function updatePlan(formData: FormData) {
  const { orgId } = await requireOrg();
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
      sellPrice: intOrNull(formData.get("sellPrice")) ?? 0,
      regularPrice: intOrNull(formData.get("regularPrice")),
      breakPrice: intOrNull(formData.get("breakPrice")) ?? 0,
      delivery: String(formData.get("delivery")),
      active: formData.get("active") === "on",
      sortOrder: intOrNull(formData.get("sortOrder")) ?? 0,
      gstRate: floatOrNull(formData.get("gstRate")),
      hsnSac: String(formData.get("hsnSac") ?? "") || null,
      tagline: String(formData.get("tagline") ?? "") || null,
      features,
      costMin: intOrNull(formData.get("costMin")),
      costMax: intOrNull(formData.get("costMax")),
      target: String(formData.get("target") ?? "") || null,
      pitch: String(formData.get("pitch") ?? "") || null,
      objection: String(formData.get("objection") ?? "") || null,
      upsell: String(formData.get("upsell") ?? "") || null,
    },
  });
  revalidatePath(`/manage/plans/${id}`);
  revalidatePath("/manage");
}

export async function deletePlan(id: string) {
  const { orgId } = await requireOrg();
  await prisma.plan.deleteMany({ where: { id, orgId } });
  revalidatePath("/manage");
}

export async function createSource(formData: FormData) {
  const { orgId } = await requireOrg();
  await prisma.source.create({
    data: { orgId, label: String(formData.get("label") || "Untitled"), active: true },
  });
  revalidatePath("/manage");
}

export async function deleteSource(id: string) {
  const { orgId } = await requireOrg();
  await prisma.source.deleteMany({ where: { id, orgId } });
  revalidatePath("/manage");
}

export async function createCategory(formData: FormData) {
  const { orgId } = await requireOrg();
  await prisma.category.create({
    data: {
      orgId,
      label: String(formData.get("label") || "Untitled"),
      color: String(formData.get("color") || "#94A3B8"),
      sortOrder: intOrNull(formData.get("sortOrder")) ?? 0,
    },
  });
  revalidatePath("/manage");
}
 
export async function deleteCategory(id: string) {
  const { orgId } = await requireOrg();
  await prisma.category.deleteMany({ where: { id, orgId } });
  revalidatePath("/manage");
}
 