"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";

const str = (fd: FormData, k: string) => String(fd.get(k) || "") || null;

export async function createMeeting(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const contactId = String(formData.get("contactId") || "");
  if (!contactId) throw new Error("A meeting needs a contact.");
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, orgId },
    select: { id: true },
  });
  if (!contact) throw new Error("Contact not found.");

  const startRaw = String(formData.get("startAt") || "");
  if (!startRaw) throw new Error("Pick a start time.");
  const endRaw = String(formData.get("endAt") || "");

  await prisma.meeting.create({
    data: {
      orgId,
      contactId,
      hostId: user.id,
      title: String(formData.get("title") || "Meeting"),
      startAt: new Date(startRaw),
      endAt: endRaw ? new Date(endRaw) : null,
      location: str(formData, "location"),
      link: str(formData, "link"),
      status: "SCHEDULED",
    },
  });
  revalidatePath(`/leads/${contactId}`);
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function updateMeeting(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing meeting id.");
  const existing = await prisma.meeting.findFirst({
    where: { id, orgId },
    select: { contactId: true },
  });
  if (!existing) throw new Error("Meeting not found.");

  const startRaw = String(formData.get("startAt") || "");
  const endRaw = String(formData.get("endAt") || "");

  await prisma.meeting.updateMany({
    where: { id, orgId },
    data: {
      title: String(formData.get("title") || "Meeting"),
      startAt: startRaw ? new Date(startRaw) : undefined,
      endAt: endRaw ? new Date(endRaw) : null,
      location: str(formData, "location"),
      link: str(formData, "link"),
    },
  });
  revalidatePath(`/leads/${existing.contactId}`);
  revalidatePath("/calendar");
}

export async function setMeetingStatus(id: string, status: string, outcome?: string) {
  const { orgId } = await requireOrg();
  const m = await prisma.meeting.findFirst({ where: { id, orgId }, select: { contactId: true } });
  if (!m) return;
  await prisma.meeting.updateMany({
    where: { id, orgId },
    data: { status, ...(outcome !== undefined ? { outcome } : {}) },
  });
  revalidatePath(`/leads/${m.contactId}`);
  revalidatePath("/calendar");
}

export async function deleteMeeting(id: string) {
  const { orgId } = await requireOrg();
  const m = await prisma.meeting.findFirst({ where: { id, orgId }, select: { contactId: true } });
  if (!m) return;
  await prisma.meeting.deleteMany({ where: { id, orgId } });
  revalidatePath(`/leads/${m.contactId}`);
  revalidatePath("/calendar");
}

export async function addMeetingNote(formData: FormData) {
  const { user, orgId } = await requireOrg();
  const meetingId = String(formData.get("meetingId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!meetingId || !body) throw new Error("Note needs text.");
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, orgId },
    select: { contactId: true },
  });
  if (!meeting) throw new Error("Meeting not found.");

  await prisma.meetingNote.create({
    data: { orgId, meetingId, authorId: user.id, body },
  });
  revalidatePath(`/leads/${meeting.contactId}`);
}

export async function deleteMeetingNote(id: string) {
  const { orgId } = await requireOrg();
  const note = await prisma.meetingNote.findFirst({
    where: { id, orgId },
    select: { meeting: { select: { contactId: true } } },
  });
  if (!note) return;
  await prisma.meetingNote.deleteMany({ where: { id, orgId } });
  if (note.meeting) revalidatePath(`/leads/${note.meeting.contactId}`);
}

export async function setMeetingSummary(formData: FormData) {
    const { orgId } = await requireOrg();
    const id = String(formData.get("id") || "");
    const summary = String(formData.get("summary") || "").trim();
    const m = await prisma.meeting.findFirst({ where: { id, orgId }, select: { contactId: true } });
    if (!m) throw new Error("Meeting not found.");
    await prisma.meeting.updateMany({
      where: { id, orgId },
      data: { summary: summary || null },
    });
    revalidatePath(`/leads/${m.contactId}`);
  }