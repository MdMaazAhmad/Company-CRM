// src/components/tasks/task-board.tsx
"use client";

import { useState, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderColumn } from "@/lib/task-actions";
import {
  BOARD_COLUMNS,
  taskStatusLabel,
  taskStatusColor,
  type TaskStatus,
} from "@/lib/task-status";
import { taskPriorityColor, taskPriorityLabel } from "@/lib/task-priority";
import { fmtDate } from "@/lib/ui";
import { MessageSquare, Clock } from "lucide-react";

type Member = { id: string; name: string; avatarColor: string; role: string };
type Task = any;

function initials(name?: string | null) {
  if (!name) return "";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function TaskBoard({
  projectId,
  tasks: initialTasks,
  me,
}: {
  projectId: string;
  tasks: Task[];
  me: { id: string; role: string; isSuperAdmin: boolean };
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const draggedRef = useRef(false);
  const savingRef = useRef(false); // guard against double-save on one drop

  const canMove = me.isSuperAdmin || me.role === "OWNER" || me.role === "ADMIN";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columns = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const s of BOARD_COLUMNS) map[s] = [];
    for (const t of tasks) (map[t.status] ??= []).push(t);
    for (const s of BOARD_COLUMNS) map[s].sort((a, b) => a.order - b.order);
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function canMoveTask(t: Task) {
    return canMove || t.assigneeId === me.id || t.reporterId === me.id;
  }

  function statusOf(id: string, list: Task[]): TaskStatus | null {
    const t = list.find((x) => x.id === id);
    if (t) return t.status;
    if (BOARD_COLUMNS.includes(id as TaskStatus)) return id as TaskStatus;
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    draggedRef.current = false;
    setActiveId(String(e.active.id));
  }

  // Live cross-column move while hovering. Pure state update only — no actions.
  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    draggedRef.current = true;

    const aId = String(active.id);
    const oId = String(over.id);

    setTasks((prev) => {
      const from = statusOf(aId, prev);
      const to = statusOf(oId, prev);
      if (!from || !to || from === to) return prev;
      const moving = prev.find((t) => t.id === aId);
      if (!moving || moving.status === to) return prev;
      return prev.map((t) => (t.id === aId ? { ...t, status: to } : t));
    });
  }

  // On drop: compute final order in plain vars, set state ONCE, then persist
  // OUTSIDE the updater. This is the key fix — no server action inside setTasks.
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const aId = String(active.id);
    const oId = String(over.id);

    // work from current state snapshot
    const current = tasks;
    const dest = statusOf(oId, current);
    if (!dest) return;

    // reflect any cross-column move that onDragOver already applied
    const movedStatus = statusOf(aId, current);
    const effectiveDest = movedStatus ?? dest;

    const col = current
      .filter((t) => t.status === effectiveDest)
      .sort((a, b) => a.order - b.order);

    const oldIndex = col.findIndex((t) => t.id === aId);
    let newIndex = col.findIndex((t) => t.id === oId);
    if (newIndex === -1) newIndex = col.length - 1;

    const reordered =
      oldIndex === -1 ? col : arrayMove(col, oldIndex, newIndex);
    const orderedIds = reordered.map((t) => t.id);

    // 1) update local state once
    const orderById = new Map(reordered.map((t, i) => [t.id, i]));
    const next = current.map((t) =>
      t.status === effectiveDest ? { ...t, order: orderById.get(t.id) ?? t.order } : t
    );
    setTasks(next);

    // 2) persist — separate from the state update, guarded against double-fire
    if (savingRef.current) return;
    savingRef.current = true;
    const snapshot = current;
    startTransition(async () => {
      try {
        await reorderColumn({ projectId, status: effectiveDest, orderedIds });
      } catch (err: any) {
        setTasks(snapshot);
        alert(err?.message === "FORBIDDEN" ? "You can only move your own tasks." : "Couldn't save the move.");
      } finally {
        savingRef.current = false;
      }
    });
  }

  function openTask(id: string) {
    if (draggedRef.current) return;
    router.push(`/projects/${projectId}/tasks/${id}`);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex select-none gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status]}
            canMoveTask={canMoveTask}
            onOpen={openTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <Card task={activeTask} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// ── Column (droppable) ───────────────────────────────────

function Column({
  status,
  tasks,
  canMoveTask,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  canMoveTask: (t: Task) => boolean;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column" } });
  const color = taskStatusColor(status);

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{taskStatusLabel(status)}</span>
        <span className="text-xs text-faint">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver ? "border-brand bg-brand-soft/40" : "border-line bg-line-soft/40"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableCard key={t.id} task={t} disabled={!canMoveTask(t)} onOpen={onOpen} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line py-6 text-xs text-faint">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cards ────────────────────────────────────────────────

function SortableCard({
  task,
  disabled,
  onOpen,
}: {
  task: Task;
  disabled: boolean;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
      className={disabled ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
    >
      <Card task={task} grabbable={!disabled} />
    </div>
  );
}

function Card({ task, dragging, grabbable }: { task: Task; dragging?: boolean; grabbable?: boolean }) {
  const overdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();
  return (
    <div
      className={`rounded-lg border border-line bg-surface p-3 ${dragging ? "shadow-lg ring-1 ring-brand/30" : "shadow-sm"}`}
      style={{ boxShadow: `inset 3px 0 0 ${taskPriorityColor(task.priority)}` }}
    >
      <div className="text-sm font-medium leading-snug text-ink">{task.title}</div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-faint">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: `${taskPriorityColor(task.priority)}1A`, color: taskPriorityColor(task.priority) }}
          >
            {taskPriorityLabel(task.priority)}
          </span>
          {task.dueDate && <span className={overdue ? "text-red-600" : ""}>{fmtDate(task.dueDate)}</span>}
          {task._count?.comments > 0 && <span className="inline-flex items-center gap-0.5"><MessageSquare size={10} /> {task._count.comments}</span>}
          {task._count?.timeLogs > 0 && <span className="inline-flex items-center gap-0.5"><Clock size={10} /> {task._count.timeLogs}</span>}
        </div>

        {task.assignee ? (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ background: task.assignee.avatarColor }}
            title={task.assignee.name}
          >
            {initials(task.assignee.name)}
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-line" title="Unassigned" />
        )}
      </div>
    </div>
  );
}