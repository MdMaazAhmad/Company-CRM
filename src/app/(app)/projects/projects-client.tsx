"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, ExternalLink, Repeat } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  EmptyState,
  DataTable,
  InlineStatusSelect,
  ConfirmDelete,
  FormDialog,
  Field,
  SelectField,
  FieldRow,
} from "@/components/crm";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from "@/lib/project-status";
import { inr, fmtDate } from "@/lib/ui";
import {
  createProject,
  updateProject,
  setProjectStatus,
  deleteProject,
} from "@/lib/actions";

type ClientOption = { id: string; label: string };
type ProjectRow = {
  id: string;
  contactId: string;
  name: string;
  status: string;
  price: number | null;
  paid: number;
  dueDate: string | null;
  liveUrl: string | null;
  clientName: string;
  billingType: string;
  monthlyAmount: number | null;
  splitBilling: boolean;
  billingActive: boolean;
  gstRate: number | null;
  hsnSac: string | null;
  taxMode: string;
};

const statusOptions = PROJECT_STATUSES.map((s) => ({
  value: s,
  label: PROJECT_STATUS_LABELS[s],
}));

const GST_OPTIONS = [
  { value: "0", label: "0% — exempt" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

const TAX_MODE_OPTIONS = [
  { value: "INTRA", label: "Intra-state (CGST + SGST)" },
  { value: "INTER", label: "Inter-state (IGST)" },
];

function ProjectFields({
  clients,
  project,
}: {
  clients: ClientOption[];
  project?: ProjectRow;
}) {
  const [monthly, setMonthly] = useState(project?.billingType === "MONTHLY");
  const dueValue = project?.dueDate
    ? new Date(project.dueDate).toISOString().slice(0, 10)
    : "";

  return (
    <div className="grid gap-4 py-2">
      <SelectField
        label="Client"
        name="contactId"
        defaultValue={project?.contactId ?? clients[0]?.id ?? ""}
        options={clients.map((c) => ({ value: c.id, label: c.label }))}
        required
      />
      <Field
        label="Project name"
        name="name"
        defaultValue={project?.name}
        placeholder="e.g. Shopify store"
        required
      />
      <FieldRow>
        <SelectField
          label="Status"
          name="status"
          defaultValue={project?.status ?? "NOT_STARTED"}
          options={statusOptions}
        />
        <Field label="Due date" name="dueDate" type="date" defaultValue={dueValue} />
      </FieldRow>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-ink">Billing</label>
        <select
          name="billingType"
          defaultValue={project?.billingType ?? "ONE_TIME"}
          onChange={(e) => setMonthly(e.target.value === "MONTHLY")}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="ONE_TIME">One-time</option>
          <option value="MONTHLY">Monthly retainer</option>
        </select>
      </div>

      {monthly ? (
        <>
          <FieldRow>
            <Field
              label="Monthly amount (₹)"
              name="monthlyAmount"
              type="number"
              defaultValue={project?.monthlyAmount ?? undefined}
              required
            />
            <SelectField
              label="Schedule"
              name="splitBilling"
              defaultValue={project?.splitBilling ? "true" : "false"}
              options={[
                { value: "false", label: "Full on 1st" },
                { value: "true", label: "50/50 — 1st & 15th" },
              ]}
            />
          </FieldRow>
          <FieldRow>
            <SelectField
              label="GST rate"
              name="gstRate"
              defaultValue={project?.gstRate != null ? String(project.gstRate) : "18"}
              options={GST_OPTIONS}
            />
            <Field
              label="HSN / SAC"
              name="hsnSac"
              defaultValue={project?.hsnSac}
              placeholder="999612"
            />
          </FieldRow>
          <SelectField
            label="Tax type"
            name="taxMode"
            defaultValue={project?.taxMode ?? "INTRA"}
            options={TAX_MODE_OPTIONS}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="billingActive"
              defaultChecked={project?.billingActive ?? true}
              className="h-4 w-4 accent-brand"
            />
            Billing active
          </label>
          <Field label="Live URL" name="liveUrl" defaultValue={project?.liveUrl} />
        </>
      ) : (
        <FieldRow>
          <Field
            label="Price (₹)"
            name="price"
            type="number"
            defaultValue={project?.price ?? undefined}
          />
          <Field label="Live URL" name="liveUrl" defaultValue={project?.liveUrl} />
        </FieldRow>
      )}

      <Field label="Notes" name="notes" placeholder="Scope, milestones…" />
    </div>
  );
}

export default function ProjectsClient({
  projects,
  clients,
}: {
  projects: ProjectRow[];
  clients: ClientOption[];
}) {
  const hasClients = clients.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        subtitle="Track the build, status, and payment for each job."
        action={
          hasClients && (
            <FormDialog
              trigger={
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" /> New project
                </Button>
              }
              title="New project"
              action={createProject}
              submitLabel="Create project"
            >
              <ProjectFields clients={clients} />
            </FormDialog>
          )
        }
      />

      {!hasClients ? (
        <EmptyState message="No clients yet. Convert a lead first, then start a project." />
      ) : projects.length === 0 ? (
        <EmptyState message="No projects yet. Click “New project” to start one." />
      ) : (
        <DataTable
          headers={[
            { label: "Project" },
            { label: "Client" },
            { label: "Status" },
            { label: "Price", className: "text-right" },
            { label: "Balance", className: "text-right" },
            { label: "Due" },
            { label: "", className: "w-[110px]" },
          ]}
        >
          {projects.map((p) => {
            const color = PROJECT_STATUS_COLORS[p.status] ?? "#94A3B8";
            const recurring = p.billingType === "MONTHLY";
            const balance = p.price == null ? null : p.price - p.paid;
            const overdue =
              p.dueDate && p.status !== "LIVE" && new Date(p.dueDate) < new Date();
            return (
              <TableRow
                key={p.id}
                className="hover:bg-line-soft/60"
                style={{ boxShadow: `inset 3px 0 0 ${color}` }}
              >
                <TableCell>
                  <div className="flex items-center gap-2 font-medium text-ink">
                    <Link
                      href={`/projects/${p.id}`}
                      className="hover:text-brand hover:underline"
                    >
                      {p.name}
                    </Link>
                    {recurring && (
                      <span title="Monthly retainer" className="text-brand">
                        <Repeat className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted">{p.clientName}</TableCell>
                <TableCell>
                  <InlineStatusSelect
                    current={p.status}
                    options={statusOptions}
                    onChange={(v) => setProjectStatus(p.id, v)}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {recurring ? `${inr(p.monthlyAmount)}/mo` : inr(p.price)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {recurring ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <span style={{ color: balance && balance > 0 ? "#FF6B00" : "#16A34A" }}>
                      {inr(balance)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span style={{ color: overdue ? "#DB2777" : "inherit" }}>
                    {fmtDate(p.dueDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <FormDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Edit project"
                      action={updateProject}
                      submitLabel="Save changes"
                      hiddenId={p.id}
                    >
                      <ProjectFields clients={clients} project={p} />
                    </FormDialog>
                    <ConfirmDelete
                      onConfirm={() => deleteProject(p.id)}
                      title="Delete this project?"
                      description="Removes the project and its payment history. The client stays."
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}