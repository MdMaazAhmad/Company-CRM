// src/lib/task-priority.ts
// Task priorities — labels, colors, and a rank for sorting (URGENT first).

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "#94A3B8",     // slate
  MEDIUM: "#2563EB",  // blue
  HIGH: "#F59E0B",    // amber
  URGENT: "#DC2626",  // red
};

// Higher number = more urgent — use for descending sort.
export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
};

export function isTaskPriority(v: string): v is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(v);
}

export function taskPriorityLabel(v: string): string {
  return isTaskPriority(v) ? TASK_PRIORITY_LABELS[v] : v;
}

export function taskPriorityColor(v: string): string {
  return isTaskPriority(v) ? TASK_PRIORITY_COLORS[v] : "#94A3B8";
}

export function taskPriorityRank(v: string): number {
  return isTaskPriority(v) ? TASK_PRIORITY_RANK[v] : 1;
}