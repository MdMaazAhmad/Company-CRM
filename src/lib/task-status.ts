// src/lib/task-status.ts
// Task statuses, labels, colors, and board-column ordering. Mirrors the shape of
// project-status.ts (STATUSES array, *_LABELS, *_COLORS) so the rest of the app
// uses one consistent pattern. SQLite has no enums — these stay strings.

export const TASK_STATUSES = [
    "BACKLOG",
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
    "BLOCKED",
  ] as const;
  
  export type TaskStatus = (typeof TASK_STATUSES)[number];
  
  export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    BACKLOG: "Backlog",
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
    DONE: "Done",
    BLOCKED: "Blocked",
  };
  
  // High-contrast palette consistent with your RAIL_COLORS approach.
  export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
    BACKLOG: "#94A3B8",     // slate
    TODO: "#2563EB",        // blue
    IN_PROGRESS: "#F59E0B", // amber
    IN_REVIEW: "#8B5CF6",   // violet
    DONE: "#16A34A",        // green
    BLOCKED: "#DB2777",     // pink/red
  };
  
  // Column order for the Kanban board. BLOCKED sits last as an exception lane.
  export const BOARD_COLUMNS: TaskStatus[] = [
    "BACKLOG",
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
    "BLOCKED",
  ];
  
  // Statuses that count a task as "open" (for progress %, counts).
  export const OPEN_STATUSES: TaskStatus[] = [
    "BACKLOG",
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "BLOCKED",
  ];
  
  export function isTaskStatus(v: string): v is TaskStatus {
    return (TASK_STATUSES as readonly string[]).includes(v);
  }
  
  export function taskStatusLabel(v: string): string {
    return isTaskStatus(v) ? TASK_STATUS_LABELS[v] : v;
  }
  
  export function taskStatusColor(v: string): string {
    return isTaskStatus(v) ? TASK_STATUS_COLORS[v] : "#94A3B8";
  }