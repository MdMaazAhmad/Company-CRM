// src/lib/task-time.ts
// Pure time math for task estimates. No Prisma, no React — safe to import anywhere.

export type TaskTimeState =
  | "not_started"   // no startedAt yet
  | "no_estimate"   // running but no estimateHours to measure against
  | "on_track"      // running, >15 min left
  | "due_soon"      // running, <=15 min left
  | "overdue"       // running, past due
  | "done_early"    // completed before/at due
  | "done_late";    // completed after due

export type TaskTimeInfo = {
  state: TaskTimeState;
  elapsedMin: number;      // minutes worked (capped at "now" or completedAt)
  remainingMin: number;    // minutes left; negative if overdue
  estimateMin: number;     // estimate in minutes (0 if none)
  dueAt: number | null;    // epoch ms of the deadline, or null
  deltaMin: number;        // for done states: minutes early (+) or late (-)
};

const WARN_MIN = 15; // "due soon" threshold

export function computeTaskTime(
  task: {
    startedAt?: string | Date | null;
    completedAt?: string | Date | null;
    estimateHours?: number | null;
  },
  now: number = Date.now()
): TaskTimeInfo {
  const started = task.startedAt ? new Date(task.startedAt).getTime() : null;
  const completed = task.completedAt ? new Date(task.completedAt).getTime() : null;
  const estimateMin = (task.estimateHours ?? 0) * 60;

  if (!started) {
    return { state: "not_started", elapsedMin: 0, remainingMin: estimateMin, estimateMin, dueAt: null, deltaMin: 0 };
  }

  const dueAt = estimateMin > 0 ? started + estimateMin * 60_000 : null;

  // Completed task — measure final outcome against the deadline.
  if (completed) {
    const elapsedMin = Math.round((completed - started) / 60_000);
    if (dueAt == null) {
      return { state: "done_early", elapsedMin, remainingMin: 0, estimateMin, dueAt: null, deltaMin: 0 };
    }
    const deltaMin = Math.round((dueAt - completed) / 60_000); // +early / -late
    return {
      state: deltaMin >= 0 ? "done_early" : "done_late",
      elapsedMin,
      remainingMin: 0,
      estimateMin,
      dueAt,
      deltaMin,
    };
  }

  // Running task.
  const elapsedMin = Math.round((now - started) / 60_000);

  if (dueAt == null) {
    return { state: "no_estimate", elapsedMin, remainingMin: 0, estimateMin, dueAt: null, deltaMin: 0 };
  }

  const remainingMin = Math.round((dueAt - now) / 60_000);
  let state: TaskTimeState;
  if (remainingMin < 0) state = "overdue";
  else if (remainingMin <= WARN_MIN) state = "due_soon";
  else state = "on_track";

  return { state, elapsedMin, remainingMin, estimateMin, dueAt, deltaMin: 0 };
}

/** "2h 5m", "45m", "-1h 10m" */
export function fmtDuration(min: number): string {
  const sign = min < 0 ? "-" : "";
  const m = Math.abs(Math.round(min));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return sign + (h > 0 ? `${h}h ${mm}m` : `${mm}m`);
}