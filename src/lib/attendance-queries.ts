import { prisma } from "@/lib/prisma";

export type AttendanceSession = {
  id: string;
  userId: string;
  userName: string;
  avatarColor: string;
  loginAt: string;
  logoutAt: string | null;
  minutes: number | null;
};

function minutesBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

export async function getAttendance(orgId: string, opts: { userId?: string; since?: Date } = {}) {
  const sessions = await prisma.loginSession.findMany({
    where: {
      orgId,
      ...(opts.userId ? { userId: opts.userId } : {}),
      ...(opts.since ? { loginAt: { gte: opts.since } } : {}),
    },
    orderBy: { loginAt: "desc" },
    include: { user: { select: { id: true, name: true, avatarColor: true } } },
  });

  const now = Date.now();
  const rows: AttendanceSession[] = sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name,
    avatarColor: s.user.avatarColor,
    loginAt: s.loginAt.toISOString(),
    logoutAt: s.logoutAt ? s.logoutAt.toISOString() : null,
    minutes: s.logoutAt
      ? minutesBetween(s.loginAt, s.logoutAt)
      : Math.round((now - s.loginAt.getTime()) / 60000),
  }));

  const byUser = new Map<string, { userId: string; userName: string; avatarColor: string; totalMinutes: number; sessions: number; online: boolean }>();
  for (const s of sessions) {
    const cur = byUser.get(s.userId) ?? {
      userId: s.userId,
      userName: s.user.name,
      avatarColor: s.user.avatarColor,
      totalMinutes: 0,
      sessions: 0,
      online: false,
    };
    cur.sessions += 1;
    cur.totalMinutes += s.logoutAt ? minutesBetween(s.loginAt, s.logoutAt) : 0;
    if (!s.logoutAt) cur.online = true;
    byUser.set(s.userId, cur);
  }

  return { rows, summary: Array.from(byUser.values()).sort((a, b) => b.totalMinutes - a.totalMinutes) };
}