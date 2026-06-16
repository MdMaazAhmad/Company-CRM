// src/components/tasks/tasks-panel.tsx
"use client";

import { useState } from "react";
import { LayoutGrid, List as ListIcon, Plus } from "lucide-react";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskListView } from "@/components/tasks/task-list";
import { TaskDialog } from "@/components/tasks/task-dialog";

type Member = { id: string; name: string; avatarColor: string; role: string };
type View = "board" | "list";

export function TasksPanel({
  projectId,
  tasks,
  members,
  me,
  canCreateTask,
}: {
  projectId: string;
  tasks: any[];
  members: Member[];
  me: { id: string; role: string; isSuperAdmin: boolean };
  canCreateTask: boolean;
}) {
  const [view, setView] = useState<View>("board");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {/* view toggle */}
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          <ToggleBtn active={view === "board"} onClick={() => setView("board")} icon={<LayoutGrid size={15} />} label="Board" />
          <ToggleBtn active={view === "list"} onClick={() => setView("list")} icon={<ListIcon size={15} />} label="List" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{tasks.length} task{tasks.length === 1 ? "" : "s"}</span>
          {canCreateTask && (
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus size={16} /> Add task
            </button>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="text-sm text-muted">No tasks yet.</p>
          {canCreateTask && (
            <button onClick={() => setAddOpen(true)} className="mt-3 text-sm font-medium text-brand hover:underline">
              Create the first task
            </button>
          )}
        </div>
      ) : view === "board" ? (
        <TaskBoard projectId={projectId} tasks={tasks} me={me} />
      ) : (
        <TaskListView projectId={projectId} tasks={tasks} members={members} me={me} />
      )}

      {addOpen && (
        <TaskDialog projectId={projectId} members={members} task={null} onClose={() => setAddOpen(false)} />
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand text-white" : "text-muted hover:text-ink"
      }`}
    >
      {icon} {label}
    </button>
  );
}