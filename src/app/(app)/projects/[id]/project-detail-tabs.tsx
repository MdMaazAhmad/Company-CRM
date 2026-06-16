// src/app/(app)/projects/[id]/project-detail-tabs.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Pill } from "@/lib/ui";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/project-status";
import { TasksPanel } from "@/components/tasks/tasks-panel";
import { PaymentsPanel } from "@/components/tasks/payments-panel";
import { ProjectActivityFeed } from "@/components/tasks/project-activity-feed";

type Member = { id: string; name: string; avatarColor: string; role: string };
type TabKey = "tasks" | "payments" | "activity";

export function ProjectDetailTabs({
  project,
  payments,
  paid,
  tasks,
  members,
  activity,
  me,
  canCreateTask,
}: {
  project: {
    id: string;
    name: string;
    status: string;
    price: number | null;
    liveUrl: string | null;
    notes: string | null;
    clientName: string;
    plan: string | null;
  };
  payments: any[];
  paid: number;
  tasks: any[];
  members: Member[];
  activity: any[];
  me: { id: string; role: string; isSuperAdmin: boolean };
  canCreateTask: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("tasks");

  const openCount = tasks.filter((t) => t.status !== "DONE").length;
  const statusColor = PROJECT_STATUS_COLORS[project.status] ?? "#94A3B8";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold text-ink">{project.name}</h1>
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-brand">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {project.clientName}
            {project.plan ? ` · ${project.plan}` : ""}
          </p>
        </div>
        <Pill color={statusColor} label={PROJECT_STATUS_LABELS[project.status] ?? project.status} />
      </div>

      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === "tasks"} onClick={() => setTab("tasks")}>
          Tasks {openCount > 0 && <span className="ml-1 text-xs text-muted">({openCount})</span>}
        </TabButton>
        <TabButton active={tab === "payments"} onClick={() => setTab("payments")}>Payments</TabButton>
        <TabButton active={tab === "activity"} onClick={() => setTab("activity")}>Activity</TabButton>
      </div>

      {tab === "tasks" && (
        <TasksPanel projectId={project.id} tasks={tasks} members={members} me={me} canCreateTask={canCreateTask} />
      )}
      {tab === "payments" && (
        <PaymentsPanel projectId={project.id} price={project.price} payments={payments} paid={paid} notes={project.notes} />
      )}
      {tab === "activity" && <ProjectActivityFeed activity={activity} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}