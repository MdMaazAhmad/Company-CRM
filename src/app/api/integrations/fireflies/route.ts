import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.FIREFLIES_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orgId, meetingId, externalId, title, startAt, summary, transcriptUrl } = body ?? {};
  if (!orgId || !summary) {
    return NextResponse.json({ error: "orgId and summary required" }, { status: 400 });
  }

  // Resolve which meeting this transcript belongs to.
  let target: { id: string } | null = null;

  if (meetingId) {
    target = await prisma.meeting.findFirst({ where: { id: meetingId, orgId }, select: { id: true } });
  }
  if (!target && externalId) {
    target = await prisma.meeting.findFirst({ where: { externalId, orgId }, select: { id: true } });
  }
  if (!target && title && startAt) {
    const start = new Date(startAt);
    const windowStart = new Date(start.getTime() - 6 * 60 * 60 * 1000);
    const windowEnd = new Date(start.getTime() + 6 * 60 * 60 * 1000);
    target = await prisma.meeting.findFirst({
      where: { orgId, title, startAt: { gte: windowStart, lte: windowEnd } },
      orderBy: { startAt: "desc" },
      select: { id: true },
    });
  }

  if (!target) {
    return NextResponse.json({ error: "No matching meeting found" }, { status: 404 });
  }

  await prisma.meeting.update({
    where: { id: target.id },
    data: { summary, transcriptUrl: transcriptUrl ?? null, externalId: externalId ?? undefined },
  });

  return NextResponse.json({ ok: true, meetingId: target.id });
}